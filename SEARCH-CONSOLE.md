# Search Console preparation

Canonical property: URL-prefix `https://mazen-tools-free.sprytitan65.chatgpt.site/`.
Sitemap: `https://mazen-tools-free.sprytitan65.chatgpt.site/sitemap.xml`.

The URL-prefix method can verify this exact hosted origin without DNS access. No Search Console connector, owner authorization or site-specific verification token is available in the session. Prepared does not mean verified, submitted or indexed.

The build accepts public `GSC_VERIFICATION_TOKEN` and emits the validated `google-site-verification` meta tag in the root and localized pages. It emits nothing when absent. This is a public ownership token, not an OAuth credential. A Google-issued verification HTML file can alternatively be placed in public/ and will be copied unchanged; do not invent one. Verification files are excluded from offline precaching. Keep the token/file after verification so Google's periodic checks continue to pass.

After official ownership verification, submit sitemap.xml and inspect the Arabic and English home pages plus representative tools in Search Console. No deprecated sitemap ping or generic Indexing API is used. These actions request discovery; they do not guarantee indexing or rankings.

The content, canonical, hreflang, descriptions and structured data are generated in HTML for crawlers without JavaScript. JSON-LD contains no fake ratings or traffic numbers. Root canonical points to /ar/ to avoid a duplicate home page. Unknown pages are marked noindex; proper 404 delivery depends on the host.
