# Officer login

Officers log in on `/admin.html` with the admin password. The server checks it with bcrypt and never keeps it in plain text, then sets an HttpOnly, SameSite=Strict cookie that lasts 8 hours. Admin endpoints check that cookie with `RequireAdmin`. Code: `internal/auth/` (the top of `auth.go` lists what each file does).

Member sessions and codes aren't built yet.

## Setup

1. Copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell) and set `ADMIN\_PASSWORD` to a long passphrase. `.env` is gitignored.
2. `go mod tidy` (once, needs internet), then `go run .`.
3. Open `http://localhost:4000/admin.html` and log in.

## Rate limiting

Wrong passwords are limited to 5 per IP per 15 minutes. After that, every attempt gets `429`, even the right password (NFR-18). Correct logins don't count. The limit is a token bucket, so a blocked IP gets one new try every 3 minutes.

## API

Bodies are JSON. Errors look like `{"error": "message to show the user"}`.

|Method \& path|Access|Purpose|Responses|
|-|-|-|-|
|`POST /api/admin/login` `{"password"}`|public|Log in|`204`, `401` wrong password, `429` rate limited, `503` `ADMIN\_PASSWORD` not set|
|`POST /api/admin/logout`|public|Log out|`204`|
|`GET /api/admin/me`|admin|Check whether the login is still valid|`204`, `401`|

To protect a new admin endpoint, wrap it: `mux.Handle("POST /api/admin/members", authService.RequireAdmin(handler))`.

## Known limits

* **One shared admin password**, set by environment variable. Changing it from the admin page and per-officer logins need the database.

## Dependencies

All are open source under licenses compatible with this project's MIT license.

|Module|Used for|License|
|-|-|-|
|[`golang.org/x/crypto/bcrypt`](https://pkg.go.dev/golang.org/x/crypto/bcrypt)|Checking the admin password|BSD-3-Clause|
|[`golang.org/x/time/rate`](https://pkg.go.dev/golang.org/x/time/rate)|Limiting wrong passwords per IP|BSD-3-Clause|
|[`github.com/joho/godotenv`](https://github.com/joho/godotenv)|Loading `.env` during local development|MIT|
|Go standard library [`http.CrossOriginProtection`](https://pkg.go.dev/net/http#CrossOriginProtection)|Blocking cross-site POSTs (CSRF), Go 1.25+|BSD-3-Clause|



