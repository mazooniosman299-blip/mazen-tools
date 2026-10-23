# Validation
23 October 2026: npm test passed 36/36. npm run build generated 38 localized pages plus ten HTML compatibility pages. scripts/check-site.mjs verified metadata, local assets and links, and static discovery of every localized page.
The browser suite validates actual downloads: PDF counts/order, PNG dimensions/content, JPEG decoding, WebP signature, exact QR payload decoding, UTF-8 text, error recovery, privacy and offline behavior on desktop and mobile. New tests cover all ten requested HTML routes and a text download.
Completion counts, Python checks, dependency audit and the deployed release's results are recorded in the final delivery report and linked GitHub Actions run. Do not infer completion from a started test process.

Completed local checks: 66/66 browser tests passed on desktop/mobile; 12/12 Python sitemap regressions passed; npm audit --omit=dev found zero vulnerabilities. Final Cloudflare compatibility checks and public release evidence follow in the delivery report.
