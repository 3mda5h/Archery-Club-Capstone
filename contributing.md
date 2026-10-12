# Contributing Guide

How to set up, code, test, review, and release so contributions meet our Definition of Done.

## Code of Conduct

Reference the project/community behavior expectations and reporting process.

We will follow the OSU Student Code of Conduct and the Inclusion Norms in our team charter. We assume good intent, critique code and the ideas rather than the person presenting them. We plan to have solutions be the main priority in our discussions. 

We will bring concerns to the Project Manager first. If a concern seems like additional input is needed from an outside source, then we contact the instructors directly to help resolve any issues. 

## Getting Started

List prerequisites, setup steps, environment variables/secrets handling, and how to run the app locally.

Prerequisites:
- Git
- TODO : runtime and version
- TODO : package manager
- TODO : database (and how to run it locally)

Setup:
- Clone the repository: git clone https://github.com/3mda5h/Archery-Club-Capstone.git && git@github.com:3mda5h/Archery-Club-Capstone.git
- Install Dependencies: TODO install command
- Copy the environment template: cp .env.example .env
- Fill in .env with your local values
- Load seed data: TODO seed command, so you have a working demo

Environment variables and secrets
- All configuration and credentials live in a local .env file. It is listed in .gitignore and must never be committed.
- .env.example lists every variable the app needs, with placeholder values only. Update it whenever you add a variable
- Real credentials are shared through a private channel agreed on by the team, never in teh public repo, never in the todo Discord channel, and never pasted into any AI tool.

Run Locally
- Start the app: TODO dev command, then open TODO http://localhost:PORT.
- Run the tests: see Testing

AI context

agents.md in the repository root describes the project architecture and goals. When using a chat LLM, paste it at the start of the session. Keep it current (see Documentation Expectations).

## Branching & Workflow

Describe the workflow (e.g., trunk-based or GitFlow), default branch, branch naming, and when to rebase vs. merge.

Model: trunk-based development. main is the default branch, is protected, and must always be demo-ready

Branch Names: type/issue-number-short-description, using the same types as commit messages (e.g. docs/61-update-readme).

Branch life: keep branches short-lived (days, not weeks) and small enough to review comfortably. 

Rebase vs. Merge: Rebase your branch onto the latest main before opening a PR and again if main moves while your PR is open. Never rebase a branch someone else is working on. PRs are squash-merged (all the individual commits from a feature or topic branch into a single, brand-new commit on your target branch) into main, so history stays one commit per change.

No direct pushes to main. Every change goes through a PR. 

## Issues & Planning

Explain how to file issues, required templates/labels, estimation, and triage/assignment practices.

Filing: Anyone can file an issue using the repository templates (bug report, feature request, task). Every issue needs a clear description and acceptance criteria, so a teammate can tell when it is done.

Labels: One type label (bug, feature, docs, chore, test), plus as needed blocked, good-first-issue, and needs-partner-input.

Estimation: Sized as S (under half a day), M (about a day), or L (more than a day, which should usually be split). Estimates are agreed during sprint planning.

Triage: The PM triages new issues weekly at the Friday meeting and keeps the project board accurate.

Assignment: Members self-assign first. The PM assigns anything unclaimed at planning. Reassignments are discussed with the team and recorded in Discord, as in our charter.

Status: The project board is the source for where our status is. 

## Commit Messages

State the convention (e.g., Conventional Commits), include examples, and how to reference issues.

We use Conventional Commits: type(scope): short summary.

Types: feat, fix, docs, test, refactor, style, chore, ci.
  Examples: 
  - feat (feature): add score entry form
  - fix : break ties by number of tens
  - docs (e.g. readme) : add local database setup steps

Use imperative mood (i.e. "add" not "added). 

Keep summary under about 72 characters.

Reference issues in the body or footer. 
  Examples:
  - Fix #xxx
  - Close #34
  - Resolve #4

Because we squash-merge, the PR title must also follow this formate


## Code Style, Linting & Formatting

Name the formatter/linter, config file locations, and the exact commands to check/fix locally.

Formatter: TODO
Config: TODO path
Check Locally: TODO lint and format check command
Auto-fix locally: TODO fix command

A pre-commit hook runs the formatter and linter on staged files, and CI runs the same checks. If CI fails on style, run the fix command and push again.

Do not disable lint rules inline without a comment explaining why.


## Testing

Define required test types, how to run tests, expected coverage thresholds, and when new/updated tests are mandatory.

Required Test Types
- Unit Tests for logic, especially score calculation, ranking, and any validation rules.
- Integration or API tests for the endpoints and database interactions behind competition scoring and leaderboards
- End-to-end tests for the key user flows (e.g. scoring a round, viewing the leaderboard) once the flows are stable.

Runnning tests
- All tests: TODO test comand
- A single file or test: TODO single-test comand

Coverage
Target: TODO for the project, and new code should not lower the number. Coverage is reported by the CI.

When tests are mandatory
- Every bug fix includes a gression test that fails without the fix.
- Every new feature or behavior change includes tests for the new behavior.
- Refactors must keep existing test passing, and add tests if coverage of the touched code was thin. 

## Definition of Done

List the checks a change must pass before it merges (tests, review, docs updated, lint and security checks), each with the CI job, hook, or test that enforces it. For a gate not built yet, name the sprint it lands in and its owner.



## Contribution Norm

State the floor (every contributor lands at least one piece of accepted work per sprint), where each kind of work lives (the repository, the issue tracker, the partner's system), and what accepted means for each.

The floor: every contributor lands at least one piece of accepted work per sprint. 


## Pull Requests & Reviews

Outline PR requirements (template, checklist, size limits), reviewer expectations, approval rules, and required status checks.

Opening a PR
- Use the PR template: what changed and why, how to test it, linked issue, and the Definition of Done checklist.
- Keep PRs small, ideally under about 400 changed lines. Split anything larger.
- Mark a PR as draft until it is ready for review. Do not merge code yo have not read or cannot explain

Reviewing
- Review within the timelines in our charter: first response within 48 hours for small PRs, and within 4 days for large ones. Say so in Discord if you can't.
- Check correctness, tests, readability, and docs, not only style. Name what is good as well as what to change.
- Comments should be specific and kind. The author responds to or resolves every thread.
- AI code review is a supplement. It never replaces the required human review.

Merging
- At least one approval from someone other than the author, all required status checks gre, all conversations resolved.
- The author squash-merges and deletes the branch.

## CI/CD

Link to pipeline definitions, list mandatory jobs, how to view logs/re-run jobs, and what must pass before merge/release.

Pipeline Definition: TODO
Mandatory Jobs: lint, test, and build, plus the secret and dependency scans once they land.
Viewing logs: open the PR, go to the Checks tab, and select failing job.
Re-running: use Re-run failed jobs on the Checks page. If a job fails intermittently, file an issue labeled bug and ci.
Before Merge: every mandatory job passes. 
Before Release: the same, on main.

The Quality Owner owns CI health. A broken main is fixed before any new feature work merges.

## Security & Secrets

State how to report vulnerabilities, prohibited patterns (hard-coded secrets), dependency update policy, and scanning tools.

Reporting Vulnerabilities: Report them privately to the Quality Owner or the PM (dm in Discord), not in a public issue. Include steps to reproduce. We respond within 48 hours.
Prohibited: hard-coded credentials, API keys, tokens, connection strings, private keys, or personal information in code, commits, issues, longs, or test fixtures. If a secret is ever committed, treat it as leaked: rotate it immediately, tell the team, and then clean it from the history.
Dependencies: review dependency updates at least once per sprint (TODO Dependabot or equivalent). Security updates take priority.
Scanning: TODO secret scanning and dependency scanning tools, run in CI.
AI and confidentiality: follow section 6 of our team charter. Never Enter credentials, PII, or financial information into any generative AI tool 

## Documentation Expectations

Specify what must be updated (README, docs/, API refs, CHANGELOG) and docstring/comment standards.

README: a setup, run, and usage changes.
docs/: architecture notes and ADRs (e.g. docs/adr/NNN-title.md) for significant decision.
agents.md: any change to architecture, major dependencies, or project goals, since this is the context we paste into LLMs.
API reference: any change to endpoints, request and response shapes, or error behavior. TODO location
CHANGELOG: every user-visible change, under the "Unreleased" heading.
Code: public functions and modules get docstrings. Comment the why, not the what. Remove commented-out code instead of leaving it behind.


## Release Process

Describe versioning scheme, tagging, changelog generation, packaging/publishing steps, and rollback process.
Versioning scheme: Semantic Versioning (MAJOR.MINOR.PATCH). We start at 0.x during development, then first club-wide rollout is 1.0.0..
Tagging: the Quality Owner tag releases form main: git tag vX.Y.Z && git push origin vX.Y.Z.
Changelog: generated from Conventional Commit messages and reviewed by hand before release, then moved from "Unreleased" to the new version heading.
Publishing: TODO build and deploy steps and hosting target.
Pre-release check: main is green, the DoD is met for every included change, and teh demo path works end-to-end.
Rollback: redeploy the previous tag (TODO command), then open a bug issue describing what failed. Fix forward in a normal PR

## Support & Contact
- The primary long-term maintainer is 3mda5h
- If you have questions about the code, open a Github discussion 
- For bugs and feature requests, open an issue
- If you have questions about the OSU Archery Club, contact us at archery@oregonstate.edu

