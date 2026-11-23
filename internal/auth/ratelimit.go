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
	now       func() time.Time
	limit     rate.Limit
	burst     int
	window    time.Duration
	buckets   map[string]*bucket
	lastPrune time.Time
}

type bucket struct {
	mu       sync.Mutex // bucket now has a mutex held for the whole attempt
	lim      *rate.Limiter
	users    int
	lastSeen time.Time
}

// This is the way that go makes ENUMs cause there is no enum keyword:
// attemptBlocked   = 0
// attemptFailed    = 1
// attemptSucceeded = 2
type attemptResult int

const(
	attemptBlocked		attemptResult = iota // out of tries
	attemptFailed
	attemptSucceeded
)

// newFailureLimiter allows `failures` failed attempts per `window` per key.
func newFailureLimiter(failures int, window time.Duration, now func() time.Time) *failureLimiter {
	return &failureLimiter{
		now:	 now,
		limit:   rate.Every(window / time.Duration(failures)),
		burst:   failures,
		window:  window,
		buckets: map[string]*bucket{},
	}
}

// Attempt runs the whole check now ensuring the whole chain of recieve->check->pass/failed
// is locked for the duration. It's relatively slow, but that should only matter for attackers
func(l *failureLimiter) Attempt(key string, check func() bool) attemptResult {
	b := l.acquire(key)
	defer l.release(b)

	b.mu.Lock()
	defer b.mu.Unlock()

	now := l.now()
	if b.lim.TokensAt(now) < 1 {
		return attemptBlocked
	}
	if check() {
		return attemptSucceeded
	}
	b.lim.AllowN(now, 1)
	return attemptFailed
}

// acquire returns key's bucket, creating it if needed, and marks it in use so
// prune can't delete it while an attempt holds or waits for its lock.
func (l *failureLimiter) acquire(key string) *bucket {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.prune(l.now())
	b, ok := l.buckets[key]
	if !ok {
		b = &bucket{lim: rate.NewLimiter(l.limit, l.burst)}
		l.buckets[key] = b	
	}
	b.users++
	return b
}

func (l *failureLimiter) release(b *bucket) {
	l.mu.Lock()
	defer l.mu.Unlock()
	b.users--
	b.lastSeen = l.now()
}

// RetryAfter is how long a blocked key waits for its next attempt.
func (l *failureLimiter) RetryAfter() time.Duration {
	return l.window / time.Duration(l.burst)
}

// prune drops buckets idle for a whole window; they have fully refilled, so
// forgetting them changes nothing. Must be called with l.mu held.
func (l *failureLimiter) prune(now time.Time) {
	if now.Sub(l.lastPrune) < time.Minute {
		return
	}
	l.lastPrune = now
	for key, b := range l.buckets {
		if b.users == 0 && now.Sub(b.lastSeen) > l.window {
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
