# Runtime reliability hotfix

The public owner reported `ERR_FAILED` across tools. This executor cannot yet reach the public hostname: curl is rejected by the configured proxy with CONNECT 403; Chromium reports ERR_TUNNEL_CONNECTION_FAILED before receiving site HTTP headers. These network errors do not establish the user's root cause. Do not claim the public failure has been reproduced or fixed until remote functional checks pass.

Confirmed source defect: accessing `localStorage.theme` at module startup could synchronously throw SecurityError when browser storage is denied. This stopped all tool initialization. Theme reads/writes now tolerate denied storage. A dedicated browser regression test checks the tool still generates a password with storage access forcibly denied.

Cache reliability changes: use the current named cache for HTML fallbacks, prefer network HTML online, activate a fully populated new cache, claim clients without reloading forms, and retain one previous immutable asset generation for tabs already open. Only Mazen application caches are pruned; no localStorage or user files are deleted. An offline browser test executes PDF rendering, QR generation and passwords. Another regression test seeds obsolete HTML and verifies direct navigation remains functional.

A separate classic boot-health script displays an honest retry message when the module script cannot load. It does not claim success or silently erase data. File selection order is visible; previous generated Blob URLs are released when a new run replaces outputs; image quality rejects non-finite values.

Validation uses a static production preview that applies the actual _headers file, strict MIME types and true 404 for missing assets. The previous Vite preview did not enforce those deployment headers. Browser tests open every original localized route directly, inspect JS/CSS HTTP status and content types, collect runtime errors and perform actual download events. Output checks read the downloaded PDF, PNG, JPEG, WebP, UTF-8 and QR bytes. Desktop and Pixel 7 mobile emulation are configured; this is not a physical-phone test.

Run: `npm ci && npm test && npm run build && node scripts/check-site.mjs && npm run test:browser`.
Remote: set `PUBLIC_ORIGIN` to the public origin, then run `npm run test:browser`. In the managed environment Chromium uses the inherited HTTPS proxy. Local and remote reports must be labelled separately. The GitHub public-health workflow is prepared but cannot execute until a GitHub repository and Actions permissions are available.
