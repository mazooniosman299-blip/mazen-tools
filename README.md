# Mazen Tools

Free Arabic/English PWA with 11 working local browser tools. No accounts, file uploads, ads, analytics, backend or paid dependency. Vite bundles pdf-lib, PDF.js and QRCode locally. All 38 localized pages are statically generated with metadata, canonical, hreflang, structured data and internal navigation. PDF and QR dependencies load only when needed.

## Development

Node 22+; `npm ci`, `npm test`, `npm run build`, `npm run test:browser`. Browser tests use system Chromium locally; CI installs Playwright Chromium. The production test server enforces _headers, MIME types and 404 responses. Tests cover desktop and Pixel 7 emulation. PUBLIC_ORIGIN runs the same suite against a deployed host. See HOTFIX.md for the current verification limits. `node scripts/check-site.mjs` checks generated SEO and links. Optional `PUBLIC_ORIGIN=https://...` adds actual public HTTP checks. `SITE_ORIGIN` controls canonical and sitemap URLs during build; set it to the final hosting origin.

## Cloudflare free deployment

This source is ready for Cloudflare Pages Free. No account has been connected in this session. Create a Pages project named `mazen-tools` in the owner's account, link a new GitHub repository, use build command `npm run build`, output `dist`, Node 22 and set `SITE_ORIGIN` to the assigned pages.dev origin. Alternatively the included workflow deploys main after tests when repository variable `CLOUDFLARE_DEPLOY_ENABLED=true`, variable `SITE_ORIGIN` and secrets `CLOUDFLARE_API_TOKEN` (restricted to that Pages project) and `CLOUDFLARE_ACCOUNT_ID` are configured. Use one deployment method, not both. No credentials belong in source. Add required reviewers to the production environment if approval is desired. GitHub public repository Actions use the free standard runners within applicable limits.

## Maintenance

The quality workflow tests pushes, pull requests, manual runs and every Monday at 05:23 UTC. It checks dependencies, builds, runs real browser workflows, validates local links and uploads a build/SEO report. Workflows are prepared, not running until hosted on GitHub with Actions enabled. GitHub can disable scheduled workflows in inactive public repositories; monitor notifications. This does not provide perpetual external uptime monitoring. Add PUBLIC_ORIGIN to a scheduled check only after the final public URL is known and reachable. No automated source modification or mass content generation occurs.

## Data and limitations

25 MB per file, 20 files per batch, maximum image area 24 megapixels. PDF render limited to 50 pages. PDFs protected by passwords are unsupported. PDF extraction collects the selected pages into one new file. Images exported as JPEG use a white transparency background. Image compression can increase size; actual sizes are displayed. No OCR, HEIC, SVG input or PDF compression claim. Invalid files show actual errors. File bytes never leave the browser. The host may keep request logs. Offline cache contains public assets only, including dynamically loaded libraries. Updates activate after old tabs close. Clear site data to remove cached assets. PWA installation depends on the browser and HTTPS.

## Revenue activation gate

Advertising is OFF. No publisher ID, ad script, ads.txt seller declaration, revenue numbers or third-party consent claims are fabricated. See MONETIZATION.md. Project is not revenue-producing merely because it is deployed.

## Contact

The owner explicitly approved publication of mazenosman968@gmail.com. The bilingual contact page has a mailto link and privacy-conscious reporting instructions. No message was sent and mailbox delivery was not tested. GitHub repository creation is still denied by the official connection; no issue-tracker link is fabricated.

## Monetization and search preparation

See MONETIZATION.md and SEARCH-CONSOLE.md. The 38 statically rendered pages include original tool guidance, About, policies and contact. `config/monetization.json` disables all advertising. Build-time verification inputs are optional public values; no placeholder IDs are published. `node scripts/readiness.mjs` generates an internal assessment and records the workspace-domain eligibility concern. Maintenance follows MAINTENANCE.md.
