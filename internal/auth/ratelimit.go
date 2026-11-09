package auth

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// failureLimiter limits failed attempts per IP address with a token
// bucket from golang.org/x/time/rate. Only failures spend from the bucket, so
// correct logins never use it up. Once the bucket is empty, every attempt is
// refused, even with the right password. It can be reused later for other
// secrets
//
// A token bucket refills gradually rather than all at once: with 5 failures
// per 15 minutes, a blocked IP gets one more try every 3 minutes. The
// sustained guessing rate is the same as a fixed 15-minute window.
type failureLimiter struct {
	mu        sync.Mutex
	limit     rate.Limit
	burst     int
	window    time.Duration
	buckets   map[string]*bucket
	lastPrune time.Time
}

type bucket struct {
	lim      *rate.Limiter
	lastSeen time.Time
}

// newFailureLimiter allows `failures` failed attempts per `window` per key.
func newFailureLimiter(failures int, window time.Duration) *failureLimiter {
	return &failureLimiter{
		limit:   rate.Every(window / time.Duration(failures)),
		burst:   failures,
		window:  window,
		buckets: map[string]*bucket{},
	}
}

// Blocked reports whether key has no failed attempts left.
func (l *failureLimiter) Blocked(key string, now time.Time) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.prune(now)
	b, ok := l.buckets[key]
	if !ok {
		return false
	}
	return b.lim.TokensAt(now) < 1
}

// Fail records one failed attempt for key.
func (l *failureLimiter) Fail(key string, now time.Time) {
	l.mu.Lock()
	defer l.mu.Unlock()
	b, ok := l.buckets[key]
	if !ok {
		b = &bucket{lim: rate.NewLimiter(l.limit, l.burst)}
		l.buckets[key] = b
	}
	b.lastSeen = now
	b.lim.AllowN(now, 1)
}

// RetryAfter is how long a blocked key waits for its next attempt.
func (l *failureLimiter) RetryAfter() time.Duration {
	return l.window / time.Duration(l.burst)
}

// Clear forgets every key, unblocking everyone.
func (l *failureLimiter) Clear() {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.buckets = map[string]*bucket{}
}

// prune drops buckets idle for a whole window; they have fully refilled, so
// forgetting them changes nothing. Must be called with l.mu held.
func (l *failureLimiter) prune(now time.Time) {
	if now.Sub(l.lastPrune) < time.Minute {
		return
	}
	l.lastPrune = now
	for key, b := range l.buckets {
		if now.Sub(b.lastSeen) > l.window {
			delete(l.buckets, key)
		}
	}
}

// clientIP returns the caller's IP. 
func clientIP(r *http.Request, trustProxy bool) string {
	if trustProxy {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			first, _, _ := strings.Cut(xff, ",")
			if ip := strings.TrimSpace(first); ip != "" {
				return ip
			}
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
