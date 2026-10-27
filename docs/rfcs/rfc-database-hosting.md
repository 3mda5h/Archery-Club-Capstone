# RFC: Where We Host the Production Database

## 1. Problem and context

Our application records archery scores for OSU Archery Club : members, events (league competitions, tournaments, pin shoots), scorecards, and the ends and arrows within them. The schema is designed but not yet deployed. We need to decide **where the shared database runs**, both for development and for the version the club will actually use.

**Why this is hard to reverse.** Hosting looks like a configuration detail, but here it bundles three harder decisions together:

1. **The database engine.** Supabase only offers PostgreSQL. Self-hosting MySQL or Aiven for MySQL keeps us on MySQL. Our schema, migrations and queries will be written for one engine, and switching later means porting all of them.
2. **Who owns the account.** The database must keep running after our team leaves at the end of the year. Whoever holds the account and pays the bill becomes responsible for the club's data. Transferring that later is an administrative project, not a code change.
3. **Data gravity.** Once the club enters real scores, moving providers means a migration with a downtime window and a risk of losing data, instead of a connection-string change.

**Why now.** We want to start testing data migration between the website and our data base. The engine choice in particular must be made before migrations are written.

**If we do nothing.** Everyone keeps running the database locally. Nobody has shared test data, the partner cannot try the app, and the hosting decision gets made in a hurry near handoff, which is the worst time to make it.

## 2. Options

**Option 0: Do nothing / local only.** Each developer runs MySQL [or PostgreSQL] locally, for example in Docker. No hosted database yet. Cost: $0, but no shared environment and the decision is deferred to handoff.

**Option 1: Supabase (managed PostgreSQL).** A hosted Postgres database, plus optional auth, file storage and APIs. Cost: $0 on Free, $25/month on Pro [1]. Requires committing to PostgreSQL.

**Option 2: Aiven for MySQL (managed MySQL).** A hosted MySQL database with backups and monitoring handled by the provider. Cost: $0 on Free, $5/month on the Developer tier [3][4]. Aiven also offers PostgreSQL on the same tiers, so this option does not lock us into MySQL.

**Option 3: Self-hosted MySQL.** We install and run MySQL on a server: [a cheap cloud VPS, a partner-provided machine, or a university server]. Cost: [VPS PRICE]/month, or $0 on existing hardware, plus our time for setup, security updates and backups.

## 3. Analysis

### Option 0: Local only

This costs nothing and is what we already do. It is fine for writing schema, but it fails the project's actual goal, since the club can't use an app whose database only exists on laptops. It also leaves the engine question open, which is the most expensive part of this decision to change later.

### Option 1: Supabase

**Strengths.** It is the most capable option. A Supabase project works as a plain Postgres database that any Postgres client or ORM can connect to, and its auth, storage and realtime features are included but optional and cost nothing if unused [1]. Built-in auth could also cover our [member login] requirement, if we have one. Supabase is open source and can be self-hosted with Docker [1], which gives us an exit route if the hosted service stops fitting.

**Weaknesses for us.**
- **Engine change.** Our diagram currently targets [MySQL / unspecified]. Choosing Supabase means writing everything for PostgreSQL. The schema itself ports easily (both engines support foreign keys, `CHECK` constraints and enums, though Postgres defines enums as separate types). However, any team member experience, tutorials or tooling we planned around MySQL no longer applies.
- **The free tier pauses and has no backups.** Free projects pause after one week of inactivity, and automatic backups are not included on Free [1]. A club app may go unused between league seasons, so a paused database means the app is down until someone with dashboard access unpauses it. No backups means one bad migration could erase the club's scores.
- **Pro costs $25/month.** Pro removes pausing and includes daily backups kept for 7 days and 8 GB of disk [1]. That is five times the cost of Option 2's paid tier, for features we may not use.
- **Lock-in through features.** If we adopt Supabase Auth or its auto-generated APIs, leaving Supabase means rewriting those parts of the app, not just moving the data. Using it only as a database avoids this.

### Option 2: Aiven for MySQL

**Strengths.** It keeps MySQL, so nothing about our planned stack changes. The free plan needs no credit card, includes 1 GB of storage, 1 GB RAM and backups, and has no time limit [2]. The Developer tier, at $5/month, raises disk to 8 GB, includes daily backups and basic support, and is never powered off for inactivity [3][4]. Because the database is standard MySQL, leaving is a normal `mysqldump` and restore, with no provider-specific features to unwind.

**Weaknesses.**
- **The free tier can be powered off.** Aiven may power off free services that see no ongoing activity, after sending a notification, and may change their cloud, region or configuration at any time [3]. That makes Free fine for development but risky for the club's real data.
- **Small and single-node.** The Developer tier is one node with no choice of cloud region [3]. For a club with [N] members, that is likely plenty, but there is no automatic failover if the node goes down.
- **Engine-only.** Aiven gives us a database, nothing else. Auth and hosting for the app itself are still separate decisions.

### Option 3: Self-hosted MySQL

**Strengths.** Full control and no vendor limits. MySQL Community Edition is free, open-source software [VERIFY: license, GPLv2]. If the partner already runs a server, the data stays on their infrastructure, which may suit their confidentiality requirements.

**Weaknesses.** Everything Options 1 and 2 provide, we would have to build and maintain: security patches, firewall rules, TLS, user accounts, monitoring, and above all backups that are actually tested. The bigger problem is handoff. When our team leaves, someone at the club has to maintain a database server. Unless the partner has IT staff [VERIFY WITH PARTNER], this option moves the maintenance burden onto the people least equipped to carry it.

### Cost summary

| | Monthly cost | Pauses / powers off when idle? | Backups | Engine |
|---|---|---|---|---|
| Local only | $0 | n/a | None | Either |
| Supabase Free | $0 | Yes, after 1 week | Not included | PostgreSQL |
| Supabase Pro | $25 | No | Daily, 7 days | PostgreSQL |
| Aiven Free | $0 | Can be, after notice | Included | MySQL or PostgreSQL |
| Aiven Developer | $5 | No | Daily | MySQL or PostgreSQL |
| Self-hosted | [VPS PRICE] or $0 | No | Our responsibility | Either |

**Performance.** At our scale, N members and M scorecards per season, every option has far more capacity than we need.  Performance is not a deciding factor, so this analysis weighs reliability, maintenance, cost and handoff.

## 4. Recommendation and verification plan

**Recommendation: Option 2, Aiven for MySQL,** using the Free tier for development now and the $5/month Developer tier for production before the club enters real data.

This option keeps the engine we planned around, costs the least of the managed options that never pause, includes backups, and leaves us an easy exit because it is plain MySQL. It also puts the least maintenance burden on the club after handoff.

**What would change this:**
- If the team decides to use Supabase's built-in auth instead of building our own, Option 1 on Pro becomes worth its higher price.
- If the partner requires data to stay on their own infrastructure, Option 3 becomes necessary, and we would need a written plan for who maintains it.

**How we will know it was the right choice:**

- **Restore test.** Before real data goes in, we take a backup, delete the database, and restore it. Pass: all rows and constraints come back. If this fails, we do not go to production on this setup.
- **Portability test.** Export the database with `mysqldump` and load it into a local MySQL instance. Pass: the app runs against the local copy with only a connection-string change. This proves the exit route actually works.
- **Idle test.** Leave the production database untouched for two weeks and confirm it is still reachable afterward. This checks our assumption that the Developer tier does not power off.
- **Capacity check.** Load a season's worth of realistic test data, N scorecards. Pass: storage stays under 30% of the plan's limit.
- **Handoff check.** Before the end of the project, a club contact logs into the Aiven account, finds the backups, and can explain who gets billed. Pass: they can do it without us.
- **Security check.** Connections require TLS, the app uses a separate database user with only the permissions it needs, and no credentials are committed to the repository.

## 5. Constraints

**Licensing.** MySQL Community Edition is open source [VERIFY license]. Aiven and Supabase are commercial services; their terms of service, not a software license, govern our use. Supabase itself is open source [1].

**Data use and privacy.** The database will hold some personal data about club members: names, scores and league averages. A hosted provider stores that data on its infrastructure, so we need to know which region it lives in and who can access it. Aiven's Developer tier does not let us choose the cloud or region [3]. This decision also needs to follow our privacy-by-design notes.

**IP and ownership.** The production account should be created by or transferred to the partner, not left on a student's personal account. [Confirm with the partner and the project agreement who owns the hosting account and the data.]

**Partner confidentiality.** This RFC names vendors and the club's event types but contains no member data. [Confirm with partner that this level of detail is fine to share with peer reviewers.] Connection strings and credentials never go in this document or the repository.

## 6. Delegation and validation

**What I handed to AI (Claude):** drafting this RFC; looking up current prices, free-tier limits and inactivity policies on the Supabase and Aiven pricing and documentation pages; and structuring the comparison.

**What made that reasonable:** every price and limit cited here comes from a vendor's own page, listed in the references, so each claim can be checked against its source. Nothing has been deployed yet, so a wrong number costs an edit, not an outage.

**Where I stopped and validated myself:**

**What I did not delegate:** the recommendation. I chose Aiven because the club needs something that stays up without anyone maintaining it, and $5 a month is the cheapest option that does that, and I can defend that without the tool.

## Decision

Pending peer and team review. Proposed: Option 2, Aiven for MySQL, Free tier for development and Developer tier for production.

## References

[1] Supabase, "Pricing." https://supabase.com/pricing (accessed October 25, 2026)

[2] Aiven, "Free plans," Aiven docs. https://aiven.io/docs/platform/concepts/free-plan (accessed October 25, 2026)

[3] Aiven, "Service pricing," Aiven docs. https://aiven.io/docs/platform/concepts/service-pricing (accessed October 25, 2026)

[4] Aiven, "Developer tier for PostgreSQL and MySQL." https://aiven.io/developer-tier-pg-mysql (accessed October 25, 2026)

[5] [MySQL Community Edition license page, VERIFY]

[6] [Your self-hosting option's pricing page, if you use a VPS]
