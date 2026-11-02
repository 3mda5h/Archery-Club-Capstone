# Risks

**Objective:** OSU Archery Club members can enter arrow scores from their phones at practice and see their history, averages, and leaderboards, and future officers can run and configure it without technical help, on club-owned accounts that stay free or cheap after our team leaves.

Rank is likelihood/impact (H/M/L) and why. Last reviewed: 11/1/26.

## Open risks (ranked)

### R-1 · technical · H/H

*Untested, and every feature depends on it.*

We have not confirmed that the Go server in `main.go` runs on Vercel as configured. Locally it serves `public/` when `PORT` is unset; when Vercel sets `PORT` it registers no routes, and no API endpoint exists yet. If Go on Vercel doesn't work, no scorecard can reach the database and the walking skeleton can't be deployed.

- **Owner:** `<NAME>`
- **Mitigate:** spike one endpoint on Vercel that writes and reads one scorecard in Supabase by `<DATE>`.
- **Trigger:** no working spike by `<DATE>`.

### R-2 · team · H/H

*Checkpoint 1 requires it; nothing exists yet.*

The repository has no CI workflow and no tests, and `contributing.md` lists the test, build, and lint jobs as TODO. Checkpoint 1 needs CI passing on the named commit, with at least one test that fails when the scaffold breaks. If CI is missing, or goes green without testing anything, the Build Health item fails.

- **Owner:** `<QUALITY OWNER>`
- **Mitigate:** add a workflow with build and test jobs on every pull request, include a Go test that checks something real about the scaffold, then break it on a branch once to confirm CI goes red.
- **Trigger:** no green run, or no red run on the broken branch, by `<DATE>`.

### R-3 · technical · M/H

*A leaked code corrupts the leaderboard; serverless makes rate limiting harder.*

Submissions rely on an event code, per-IP rate limiting, an open submission window, and a `noindex` header. Vercel may run each request on a fresh instance, so rate-limit counters kept in memory would not persist. If the counters aren't shared, guessing codes is easier than designed. `noindex` only reduces casual discovery; it is not access control.

- **Owner:** `<NAME>`
- **Mitigate:** keep rate-limit counters in the database, and run tests for wrong codes, expired codes, and lockout in CI.
- **Trigger:** any score from a non-member, or the lockout test not passing by `<DATE>`.

### R-4 · technical · M/H

*A bad migration or deletion is unlikely but permanent.*

The free plan has no automatic backups. If a migration goes wrong or rows are deleted by mistake, score history can't be recovered.

- **Owner:** `<NAME>`
- **Mitigate:** take a manual or scheduled database export before each migration, and run one restore test before real data goes in. Moving to Pro adds daily backups (7 days, per Supabase's published plans).
- **Trigger:** no tested restore by Checkpoint 2, or a migration merged without an export.

### R-5 · business · M/H

*Untested; the objective depends on it.*

Future club officers will have little technical knowledge, and the admin page is not built or tested with any officer yet. If officers can't change members, events, and security settings in the UI, the app stops being used when our team leaves.

- **Owner:** `<NAME>`
- **Mitigate:** run a first trial with at least one officer on an early admin page by `<DATE>`, then the full trial (three officers, the five admin tasks in the requirements) before handoff, and write the admin guide as the tasks are built.
- **Start by:** `<DATE>`, the last day to ask officers for trial time and still hold the first trial.
- **Trigger:** no officer trial scheduled by `<DATE>`, or an officer can't finish a task in a trial.

### R-6 · business · H/M

*The club will be idle between seasons; the cost is downtime, not lost data.*

Supabase pauses Free projects after about a week of low activity. The club may go weeks without using the app. If the project pauses, the app is down until someone with dashboard access restores it.

- **Owner:** `<NAME>`
- **Mitigate:** decide whether to move to Pro, which cannot be paused, or test a keep-alive during the spike; either way, make sure Supabase's warning emails go to an address the club monitors.
- **Trigger:** a pause-warning email arrives, or no decision on Pro vs. free by `<DATE>`.

### R-7 · team · H/M

*The brief lists many extras.*

Several Should and Could requirements (double scoring, team-making, pin achievements) could take time from the core flow: enter a score, view history, see the leaderboard. If the core flow isn't deployed, the app isn't usable at practice.

- **Owner:** `<NAME>`
- **Mitigate:** ship the core flow first and keep the extras as Should and Could in `docs/requirements.md` until it is deployed.
- **Trigger:** core flow not deployed by `<DATE>`.

### R-8 · team · M/M

*Docs disagree with each other; graders compare docs to code.*

Several documents contradict each other. `docs/design.md` says Supabase is decided and ADR-001 is a TODO, but the hosting RFC still recommends Aiven MySQL and is marked pending. The auth RFC proposes rotating session codes and per-officer admin logins, while `requirements.md` and `design.md` describe a single shared admin password. If these aren't reconciled, someone builds the wrong thing and the checkpoint docs don't match.

- **Owner:** `<NAME>`
- **Mitigate:** write ADR-001 for Supabase, mark the hosting RFC as superseded, and settle the admin access model in one place.
- **Trigger:** any doc still contradicting `design.md` at the pre-submission read.

### R-9 · technical · M/M

*Browser behavior on phones is unmeasured.*

The design assumes scores cached in the browser survive reloads and dropped signal. iOS and Android browsers may clear storage. If so, an archer loses a scorecard mid-event.

- **Owner:** `<NAME>`
- **Mitigate:** spike on real phones at the range (`docs/design.md` lists this as an open question) and show an unsynced indicator.
- **Trigger:** any lost scorecard reported at practice.

### R-10 · team · M/M

*Only some people have deployed; availability varies.*

Only `<N>` team members have deployed the app, and Vercel's GitHub integration is not on, so no preview deploys exist yet. If the deployer is away, a bad release stays bad.

- **Owner:** `<NAME>`
- **Mitigate:** turn on the integration (`design.md` has a TODO), document deployment in `README.md`, and have a second person deploy.
- **Trigger:** a release is due while the only deployer is away.

### R-11 · team · M/M

*The review process exists on paper; enforcement is unchecked.*

Some code is AI-drafted. `contributing.md` requires a human reviewer and `coderabbit.yaml` adds AI review, but branch protection is a TODO. If protection isn't on, code merges without the review the process promises.

- **Owner:** `<QUALITY OWNER>`
- **Mitigate:** enable branch protection on `main` (one non-author approval, resolved conversations, passing CI).
- **Trigger:** any merged pull request without a human approval.

### R-12 · business · L/M

*Not yet checked; the design already keeps real names out of public view.*

We don't know whether an OSU policy limits storing members' real names or sets how long they must be kept, and members under 18 need club guidance first. If a policy applies and we haven't checked, we may have to change what we store or delete data after launch.

- **Owner:** `<NAME>`
- **Mitigate:** keep real names admin-only, use only invented data in tests, and send one request to the partner contact covering both questions.
- **Contingency:** if real names can't be stored, remove that field and have officers keep the mapping outside the app.
- **Start by:** `<DATE>`, before any real member data enters the database.
- **Trigger:** no answer two weeks after asking, or real names entered before we have one.

### R-13 · team · M/L

*README is Windows-only.*

The quickstart covers Windows only, and graders follow it from a clean clone. If a teammate, grader, or future developer uses macOS or Linux, they can't follow it.

- **Owner:** `<NAME>`
- **Mitigate:** add Linux steps and have a team member who uses Linux follow them from a clean clone before Checkpoint 2. Add macOS steps if someone with a Mac can test them; otherwise note in the README that macOS is untested.
- **Contingency:** if someone on another OS can't complete the quickstart, fix the steps in the same pull request and re-test.
- **Trigger:** anyone on another OS fails the quickstart, or no Linux test done by `<DATE>`.

## External prerequisites

Each item depends on someone outside the team. Where a request has not been sent yet, the line gives the last day to send it. Once sent, replace it with who asked and when.

### Approval: production target

Vercel for the web server, Supabase for the database, both under club-owned accounts.

- **Asked of:** Project partner.
- **Asked by:** `<NAME>`, on `<DATE>`.
- **Status:** agreed on October 27, 2026 (recorded in `docs/design.md`).
- **Still open:** that the club-owned accounts exist and who holds them (next item).

### Club-owned Vercel and Supabase accounts

Needed for deployment, and handoff after we leave. Related risks: R-1, R-6.

- **To be asked of:** `<PARTNER CONTACT>`
- **To be asked by:** `<NAME>`
- **Start by:** `<DATE>`, the last day to ask and still have the accounts before the first deploy to production.
- **Note:** Supabase's pause-warning emails should go to an address the club monitors (R-6).

### Agreement to pay for a paid plan, if we choose one (Supabase Pro)

Needed for avoiding the free plan's pausing and having daily backups (R-4, R-6). Only needed if the team chooses Pro.

- **To be asked of:** `<PARTNER CONTACT>`
- **To be asked by:** `<NAME>`
- **Start by:** `<DATE>`, before the decision date in R-6.

### Answer on storing real names, and guidance on members under 18

Needed for deciding what personal data the database may hold (R-12).

- **To be asked of:** `<PARTNER CONTACT>`, who can say who at OSU or the club can answer.
- **To be asked by:** `<NAME>`
- **Start by:** `<DATE>`, before any real member data enters the database.

### Officer time for admin usability trials

Needed for confirming non-technical officers can run the admin page (R-5).

- **To be asked of:** `<OFFICERS>`
- **To be asked by:** `<NAME>`
- **Start by:** `<DATE>`, early enough to hold the first trial.

## Closed

(none yet)
