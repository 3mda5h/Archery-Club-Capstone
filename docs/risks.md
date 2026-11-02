# Risks

**Objective:** OSU Archery Club members can enter arrow scores from their phones at practice and see their history, averages, and leaderboards, and future officers can run and configure it without technical help, on club-owned accounts that stay free or cheap after our team leaves.

Rank is likelihood/impact (H/M/L) and why. Last reviewed: 11/1/26.

## Open risks (ranked)

### R-1 · team · H/H

*Checkpoint 1 requires it; nothing exists yet.*

The repository has no CI workflow and no tests, and `contributing.md` lists the test, build, and lint jobs as TODO. Checkpoint 1 needs CI passing on the named commit, with at least one test that fails when the scaffold breaks. If CI is missing, or goes green without testing anything, the Build Health item fails.

- **Owner:** `<QUALITY OWNER>`
- **Mitigate:** add a workflow with build and test jobs on every pull request, include a Go test that checks something real about the scaffold, then break it on a branch once to confirm CI goes red.
- **Trigger:** no green run, or no red run on the broken branch, by `<DATE>`.

### R-2 · technical · M/H

*A leaked code corrupts the leaderboard; serverless makes rate limiting harder (but still possible).*

Submissions rely on an event code, per-IP rate limiting, an open submission window, and a `noindex` header. Vercel may run each request on a fresh instance, so rate-limit counters kept in memory would not persist. If the counters aren't shared, guessing codes is easier than designed. `noindex` only reduces casual discovery; it is not access control.

- **Owner:** `Database owner`
- **Mitigate:** keep rate-limit counters in the database, and run tests for wrong codes, expired codes, and lockout in CI.
- **Trigger:** any score from a non-member, or the lockout test not passing by `<DATE>`.

### R-3 · technical · M/H

*A bad migration or deletion is unlikely but permanent.*

The free plan has no automatic backups. If a migration goes wrong or rows are deleted by mistake, score history can't be recovered.

- **Owner:** `Database owner`
- **Mitigate:** take a manual or scheduled database export before each migration, and run one restore test before real data goes in. Moving to Pro adds daily backups (7 days, per Supabase's published plans).
- **Trigger:** no tested restore by Checkpoint 2, or a migration merged without an export.

### R-4 · business · M/H

*Untested; the objective depends on it.*

Future club officers will have little technical knowledge, and the admin page is not built or tested with any officer yet. If officers can't change members, events, and security settings in the UI, the app stops being used when our team leaves.

- **Owner:** `Student lead`
- **Mitigate:** run a first trial with at least one officer on an early admin page by `<DATE>`, then the full trial (three officers, the five admin tasks in the requirements) before handoff, and write the admin guide as the tasks are built.
- **Start by:** `<DATE>`, the last day to ask officers for trial time and still hold the first trial.
- **Trigger:** no officer trial scheduled by `<DATE>`, or an officer can't finish a task in a trial.

### R-5 · business · H/M

*The club will be idle between seasons; the cost is downtime, not lost data.*

Supabase pauses Free projects after about a week of low activity. The club may go weeks without using the app. If the project pauses, the app is down until someone with dashboard access restores it.

- **Owner:** `Database owner`
- **Mitigate:** decide whether to move to Pro, which cannot be paused, or test a keep-alive during the spike; either way, make sure Supabase's warning emails go to an address the club monitors.
- **Trigger:** a pause-warning email arrives, or no decision on Pro vs. free by `<DATE>`.

### R-6 · team · H/M

*The brief lists many extras.*

Several Should and Could requirements (double scoring, team-making, pin achievements) could take time from the core flow: enter a score, view history, see the leaderboard. If the core flow isn't deployed, the app isn't usable at practice.

- **Owner:** `<NAME>`
- **Mitigate:** ship the core flow first and keep the extras as Should and Could in `docs/requirements.md` until it is deployed.
- **Trigger:** core flow not deployed by `<DATE>`.


### R-7 · technical · M/M

*Browser behavior on phones is unmeasured.*

The design assumes scores cached in the browser survive reloads and dropped signal. iOS and Android browsers may clear storage. If so, an archer loses a scorecard mid-event.

- **Owner:** `<NAME>`
- **Mitigate:** spike on real phones at the range (`docs/design.md` lists this as an open question) and show an unsynced indicator.
- **Trigger:** any lost scorecard reported at practice.

### R-8 · team · M/M

*Only some people have deployed; availability varies.*

Only `<N>` team members have deployed the app, and Vercel's GitHub integration is not on, so no preview deploys exist yet. If the deployer is away, a bad release stays bad.

- **Owner:** `<NAME>`
- **Mitigate:** turn on the integration (`design.md` has a TODO), document deployment in `README.md`, and have a second person deploy.
- **Trigger:** a release is due while the only deployer is away.

### R-9 · business · L/M

*Not yet checked; the design already keeps real names out of public view.*

We don't know whether an OSU policy limits storing members' real names or sets how long they must be kept. If a policy applies and we haven't checked, we may have to change what we store or delete data after launch.

- **Owner:** `<NAME>`
- **Mitigate:** keep real names admin-only, use only invented data in tests, and send one request to the partner contact covering both questions.
- **Contingency:** if real names can't be stored, remove that field and have officers keep the mapping outside the app.
- **Start by:** `<DATE>`, before any real member data enters the database.
- **Trigger:** no answer two weeks after asking, or real names entered before we have one.

### R-10 · team · M/L

*README is Windows-only.*

The quickstart covers Windows only, and graders follow it from a clean clone. If a teammate, grader, or future developer uses macOS or Linux, they can't follow it.

- **Owner:** `quality owner`
- **Mitigate:** add Linux steps and have a team member who uses Linux follow them from a clean clone before Checkpoint 2. Add macOS steps if someone with a Mac can test them; otherwise note in the README that macOS is untested.
- **Contingency:** if someone on another OS can't complete the quickstart, fix the steps in the same pull request and re-test.
- **Trigger:** anyone on another OS fails the quickstart, or no Linux test done by `<DATE>`.

## External prerequisites

Each item depends on someone outside the team. Where a request has not been sent yet, the line gives the last day to send it. Once sent, replace it with who asked and when.

### Approval: production target

Vercel for the web server, Supabase for the database, both under club-owned accounts.

- **Asked of:** Project partner.
- **Asked by:** `student lead`, on `Oct 27th`.
- **Status:** agreed on October 27, 2026 (recorded in `docs/design.md`).
- **Still open:** that the club-owned accounts exist and who holds them (next item).

### Club-owned Vercel and Supabase accounts

Needed for deployment, and handoff after we leave.

- **To be asked of:** `<PARTNER CONTACT>`
- **To be asked by:** `student lead`
- **Start by:** `<DATE>`, the last day to ask and still have the accounts before the first deploy to production.
- **Note:** Supabase's pause-warning emails should go to an address the club monitors (R-6).

### Agreement to pay for a paid plan, if we choose one (Supabase Pro)

Needed for avoiding the free plan's pausing and having daily backups. Only needed if the team chooses Pro.

- **To be asked of:** `<PARTNER CONTACT>`
- **To be asked by:** `student lead`
- **Start by:** `<DATE>`, before the decision date in R-6.

### Officer time for admin usability trials

Needed for confirming non-technical officers can run the admin page (R-5).

- **To be asked of:** `<OFFICERS>`
- **To be asked by:** `Student lead`
- **Start by:** `<DATE>`, early enough to hold the first trial.

## Closed

(none yet)
