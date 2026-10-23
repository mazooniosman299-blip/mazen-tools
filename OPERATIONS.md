# Operations
Existing active GitHub Actions workflows are the actual unattended system; Codex does not continue running after this conversation.
- public-health.yml: daily 03:17 UTC / 07:17 Dubai crawl and synthetic performance; Monday 03:47 UTC / 07:47 Dubai full functional checks. Verifies sitemap, robots, routes, HTTP status and Google verification. Creates or updates one issue on failure and closes it after recovery.
- quality.yml: pushes, pull requests and Monday 05:23 UTC / 09:23 Dubai. Unit, browser, sitemap, readiness and synthetic performance checks.
- cloudflare.yml: authorized production releases with pre/post-deploy validation and recovery.
- rollback.yml: explicit rollback to a recorded release.
- google-status.yml: optional Monday 04:47 UTC / 08:47 Dubai authorized Google reporting, gated by GOOGLE_REPORTS_ENABLED. This gating is separate from health monitoring. Sitemap submission is explicit and conditional on authorized access and public checks.
GitHub can delay scheduled runs and disable schedules on inactive public repositories. Current workflow state and successful prior runs were checked through GitHub API. A successful dispatch is not proof that a job ran or that Google authorized access.
Low-risk fixes follow a branch/pull request, tests and reviewed merge. No autonomous production code-rewriting bot is enabled. Synthetic measurements are not field Core Web Vitals, organic visits or revenue.
