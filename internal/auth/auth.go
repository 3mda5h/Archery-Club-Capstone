// Package auth handles officer login for the admin page.
//
// Officers log in with the admin password, set in the ADMIN_PASSWORD
// environment variable. The server checks it with bcrypt, then gives the
// browser an HttpOnly cookie that later admin requests send automatically.
// Wrong passwords are rate limited per IP address.
//
//	auth.go       setup, shared helpers and the storage interface
//	ratelimit.go  per-IP limit on wrong passwords
//	admin.go      the login, logout and RequireAdmin check
package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"log"
	"math"
	"net/http"
	"strconv"
	"sync"
	"time"
)

// Config holds settings for New. Zero durations and counts use the defaults
// from docs/requirements.md.
type Config struct {
	Store Store

	// AdminPasswordHash is a bcrypt hash from HashPassword. If nil, admin
	// login is disabled.
	AdminPasswordHash []byte

	// TrustProxyHeaders reads the client IP from X-Forwarded-For. Turn it on
	// only behind a proxy that sets that header, such as Vercel.
	TrustProxyHeaders bool
	// SecureCookies marks the admin cookie HTTPS-only. Turn it on in production.
	SecureCookies bool

	AdminLoginTTL time.Duration // how long an officer stays logged in, default 8h

	IPFailures int           // default 5
	IPWindow   time.Duration // default 15m

	// Now lets tests control time. Defaults to time.Now.
	Now func() time.Time
}

func setDefault[T comparable](v *T, def T) {
	var zero T
	if *v == zero {
		*v = def
	}
}

// When sessions get added more stuff will go in config to handle
// that. Such as tracking how many session tokens have failed,
// lockout windows, puase durations, etc. As well as memebr session durations...
func (c *Config) setDefaults() {
	setDefault(&c.AdminLoginTTL, 8*time.Hour)
	setDefault(&c.IPFailures, 5)
	setDefault(&c.IPWindow, 15*time.Minute)
	if c.Now == nil {
		c.Now = time.Now
	}
}

// Service serves the auth endpoints. Create one with New.
type Service struct {
	cfg     Config
	store   Store
	adminIP *failureLimiter
}

// New returns a Service. cfg.Store is required.
func New(cfg Config) *Service {
	if cfg.Store == nil {
		panic("auth: Config.Store is required")
	}
	cfg.setDefaults()
	return &Service{
		cfg:     cfg,
		store:   cfg.Store,
		adminIP: newFailureLimiter(cfg.IPFailures, cfg.IPWindow),
	}
}

// Routes registers every auth endpoint on mux. 
func (s *Service) Routes(mux *http.ServeMux) {
	s.adminRoutes(mux)
}

// ErrNotFound means the thing looked up doesn't exist.
var ErrNotFound = errors.New("auth: not found")

// Store is everything the auth service saves. Each feature defines its own
// small interface next to its handlers and adds it here, so future features
// such as member sessions can add theirs.
//
// MemoryStore is the only implementation so far. A Supabase/Postgres store
// should implement this same interface so the handlers don't change.
type Store interface {
	AdminTokenStore
	//TODO: anything else auth needs to store(Sesson, memebr tokens)
}

// MemoryStore keeps everything in RAM. It is for local development and tests:
// everything is lost on restart, 
type MemoryStore struct {
	mu     sync.Mutex
	admins map[string]AdminToken
}

// NewMemoryStore returns an empty MemoryStore.
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		admins: map[string]AdminToken{},
	}
}

// newToken returns 256 random bits, URL-safe, for login tokens.
func newToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// hashToken is what gets stored instead of the token itself, so a copy of the
// database can't be used to log in as an officer. Tokens are long and
// random, so a fast hash is enough; slow hashes like bcrypt are only needed
// for things people choose, like the admin password.
func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// readJSON decodes a small JSON body into v. An empty body leaves v as is.
// On failure it writes a 400 and returns false.
func readJSON(w http.ResponseWriter, r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 4<<10)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(v); err != nil && !errors.Is(err, io.EOF) {
		writeError(w, http.StatusBadRequest, "The request wasn't valid JSON.")
		return false
	}
	return true
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store") // auth responses must not be cached
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// writeError sends {"error": msg}. Pages show msg to the user, so write it
// for a club officer, not a developer.
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func serverError(w http.ResponseWriter, err error) {
	log.Printf("auth: %v", err)
	writeError(w, http.StatusInternalServerError, "Something went wrong on the server. Try again.")
}

func tooMany(w http.ResponseWriter, retry time.Duration, msg string) {
	secs := int(math.Ceil(retry.Seconds()))
	if secs < 1 {
		secs = 1
	}
	w.Header().Set("Retry-After", strconv.Itoa(secs))
	writeError(w, http.StatusTooManyRequests, msg)
}
