package auth

import (
	"context"
	"errors"
	"log"
	"net/http"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// AdminToken is an officer's login, stored as a hash.
type AdminToken struct {
	Hash      string
	ExpiresAt time.Time
}

// AdminTokenStore saves officer logins.
type AdminTokenStore interface {
	SaveAdminToken(ctx context.Context, t AdminToken) error
	GetAdminToken(ctx context.Context, hash string) (AdminToken, error)
	DeleteAdminToken(ctx context.Context, hash string) error
}

const adminCookie = "archery_admin"

// HashPassword hashes an admin password with bcrypt so it's never kept in
// plain text 
func HashPassword(password string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
}

func (s *Service) adminRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/admin/login", s.handleAdminLogin)
	mux.HandleFunc("POST /api/admin/logout", s.handleAdminLogout)
	mux.Handle("GET /api/admin/me", s.adminOnly(s.handleAdminMe))
}

// adminOnly is shorthand for RequireAdmin when registering routes.
func (s *Service) adminOnly(h http.HandlerFunc) http.Handler { return s.RequireAdmin(h) }

// RequireAdmin rejects requests without a valid officer login cookie.
func (s *Service) RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie(adminCookie)
		if err != nil || c.Value == "" {
			writeError(w, http.StatusUnauthorized, "Log in as an officer first.")
			return
		}
		at, err := s.store.GetAdminToken(r.Context(), hashToken(c.Value))
		if errors.Is(err, ErrNotFound) || (err == nil && !s.cfg.Now().Before(at.ExpiresAt)) {
			writeError(w, http.StatusUnauthorized, "Your officer login has expired. Log in again.")
			return
		}
		if err != nil {
			serverError(w, err)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Service) handleAdminLogin(w http.ResponseWriter, r *http.Request) {
	if s.cfg.AdminPasswordHash == nil {
		writeError(w, http.StatusServiceUnavailable, "Admin login isn't set up. Set ADMIN_PASSWORD on the server.")
		return
	}
	now := s.cfg.Now()
	ip := clientIP(r, s.cfg.TrustProxyHeaders)
	// Checked before the password, so attempt 6 fails even if it's right.
	if s.adminIP.Blocked(ip, now) {
		tooMany(w, s.adminIP.RetryAfter(), "Too many wrong passwords. Wait a few minutes and try again.")
		return
	}

	var req struct {
		Password string `json:"password"`
	}
	if !readJSON(w, r, &req) {
		return
	}
	if bcrypt.CompareHashAndPassword(s.cfg.AdminPasswordHash, []byte(req.Password)) != nil {
		s.adminIP.Fail(ip, now)
		log.Printf("auth: wrong admin password from %s", ip)
		writeError(w, http.StatusUnauthorized, "Wrong admin password.")
		return
	}

	token, err := newToken()
	if err != nil {
		serverError(w, err)
		return
	}
	at := AdminToken{Hash: hashToken(token), ExpiresAt: now.Add(s.cfg.AdminLoginTTL)}
	if err := s.store.SaveAdminToken(r.Context(), at); err != nil {
		serverError(w, err)
		return
	}
	http.SetCookie(w, s.loginCookie(token, int(s.cfg.AdminLoginTTL.Seconds())))
	w.WriteHeader(http.StatusNoContent)
}

func (s *Service) handleAdminLogout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(adminCookie); err == nil && c.Value != "" {
		if err := s.store.DeleteAdminToken(r.Context(), hashToken(c.Value)); err != nil {
			serverError(w, err)
			return
		}
	}
	http.SetCookie(w, s.loginCookie("", -1))
	w.WriteHeader(http.StatusNoContent)
}

// handleAdminMe lets the admin page check whether it's still logged in.
func (s *Service) handleAdminMe(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}

// loginCookie builds the officer login cookie. maxAge -1 deletes it.
func (s *Service) loginCookie(value string, maxAge int) *http.Cookie {
	return &http.Cookie{
		Name:     adminCookie,
		Value:    value,
		Path:     "/api/admin",
		MaxAge:   maxAge,
		HttpOnly: true, // page scripts can't read it
		Secure:   s.cfg.SecureCookies,
		SameSite: http.SameSiteStrictMode,
	}
}

func (m *MemoryStore) SaveAdminToken(_ context.Context, t AdminToken) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.admins[t.Hash] = t
	return nil
}

func (m *MemoryStore) GetAdminToken(_ context.Context, hash string) (AdminToken, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	t, ok := m.admins[hash]
	if !ok {
		return AdminToken{}, ErrNotFound
	}
	return t, nil
}

func (m *MemoryStore) DeleteAdminToken(_ context.Context, hash string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.admins, hash)
	return nil
}
