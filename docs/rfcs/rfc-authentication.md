# RFC: Rotating Session Codes Instead of Member Accounts for Score Submission

| Field | Value |
| --- | --- |
| Author | David Hausman |
| Date | 2026-11-01 |
| Status | Proposed |
| Decision Date | (fill when decided) |
| Deciders | (who agreed to the outcome) |
| Superseded By | (link, if applicable) |

## Problem and Context

The club's scoring app must confirm that a score submission comes from a member at practice, without requiring member accounts. Fake submissions from outsiders or bots would corrupt the public leaderboard, averages, and pin achievements. 

The project is design-only, so this is the cheapest time to decide. The choice shapes the database schema, submission endpoints, offline sync, and the admin page; changing it after launch means migrating data and retraining members.

Doing nothing means one static password told to members at practice. It never expires, spreads through group chats, and stays known to former members until an officer rotates it. This RFC assumes about 50 members, two 2-hour practices a week, free-tier hosting, and an MIT license.

## Options

### Option A: Rotating 4-letter session code

An officer opens a session at practice and the server generates a code such as `KXQW`, valid only for that session. Members enter it once; the browser keeps a session token. **Costs:** a sessions table, a code generator, an open/close button, and an officer present at every practice. **Right choice when** an officer reliably attends and the threat is outsiders, not members.

### Option B: Per-user accounts

Each member logs in with a password, magic link, or Google sign-in. Every submission is tied to a person. **Costs:** signup, login, password reset, recovery, and email delivery to build, plus logins that are slowest where signal is worst. **Right choice when** the club needs per-member privacy or accountability.

### Option C: Do Nothing (static shared password)

**Costs:** near-zero to build, but the cost arrives with the first leak: outsiders or former members can submit until officers notice and rotate. It recurs every term as membership turns over. **Right choice when** the club is small and stable, the leaderboard is low-stakes, and no officer reliably attends practice.

## Analysis

Option A gives most of the security of accounts at a fraction of the cost, because the threat is outsiders, not members.

| Tradeoff | A. Session code | B. Accounts | C. Do nothing |
| --- | --- | --- | --- |
| Outsider protection | Strong; codes expire each practice | Strong, if recovery is built well | Weak once leaked |
| Poor-signal performance | One request, then cached token | Login round-trips and redirects | One request |
| Build complexity | Low | High | Lowest |
| Maintenance | Officers open and close sessions | Account support for \~50 people | Manual rotation |
| Personal data | Names | Names plus emails | Names |

**Why four letters is enough.** Strength comes from rate limiting, not length; NIST SP 800-63B caps failed attempts at 100. A 24-letter alphabet (no I or O) gives 24⁴ = 331,776 codes. If joining locks after 100 failures per session, an attacker's chance per session is about 0.03%, and about 3% per year even if they max out every session. A leaked static password gives 100%. A successful guess only affects one practice, and every submission carries a session ID, so officers can bulk-delete it.

**Hiding from Google.** A `noindex` tag keeps pages out of search results but is not access control; it only reduces casual discovery.

**Case study.** Members score on phones with weak signal at the range: A works offline after one request, while B's login flow fails exactly then. Membership turns over each term: under C, former members keep access; under A, they lose it at the next practice. Members with dead phones already go through officers, so A needs no extra path.

**Uncertainty.** Nothing is built or measured yet, and the member and attendance figures are assumptions. Officer attendance matters most, since A fails if nobody opens a session.

## Recommendation and Verification Plan

Adopt Option A for members, and give each of the roughly five officers their own admin login for an audit trail of score edits and easy removal of departing officers. Codes avoid an offensive-word blocklist. Tokens stay valid until the session closes plus a 2-hour grace period, so scores queued offline can sync. Per-IP throttling stops single devices early, and pages carry `noindex`.

| Check | Target | When |
| --- | --- | --- |
| Wrong and expired codes rejected | 100% | Automated test, every CI run |
| Lockout at failure 101 | Joining locks, officers alerted | Automated test, every CI run |
| Offline queue syncs | All queued scores land | Manual airplane-mode test, before launch |
| Join page weight | Under 100 KB on "Slow 4G" | Dev tools, before launch |
| Time to join | Median under 15 seconds | First two practices |
| Sessions opened | 95% of practices | End of first month |
| Unauthorized submissions | 0 per term | Officer review, end of term |

Revisit this RFC if an unauthorized submission is confirmed, officers miss more than one session a month, or the club needs per-member privacy.

## Constraints

- **Licensing.** The code is MIT; dependencies must be compatible. Option B with Google sign-in would add the provider's terms.
- **Open design.** The public repository shows how the gate works, which is fine: security rests on random codes and rate limits. Secrets live in environment variables, never the repository.
- **Data use.** Names and scores appear on a public leaderboard, so members are told and may use a display name or initials. Members under 18 need club guidance first.
- **IP.** Club branding stays in configuration, not the repository. Scoring rules are implemented as logic, not copied text.
- **Partner confidentiality.** The roster, real scores, codes, and officer credentials never enter the repository or issue tracker. Test data is synthetic, and logs record failed attempts, not the codes typed.

## Delegation and Validation

- **Handed to AI:** Claude provided formatting help when provided the assignment template. It also re worded a lot of what I wrote, and grabbed NIST SP 800-63B to do some calculations.
- **Checks in place:** none yet. The project is design-only, with no tests, CI, or staging; the plan above lists intended checks. The decision is still cheap to reverse because nothing is deployed.
- **What I validated myself:** Officer attendance, approximate club membership and meeting times, as well as the likelihood of a password being compromised by and arbitrary attacker.

## Decision

Proposed
