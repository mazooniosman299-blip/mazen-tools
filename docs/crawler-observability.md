# Crawl evidence and its limits

Only `/sitemap.xml` and `/robots.txt` run through the monitoring handler before returning the original asset response. All other known assets retain normal direct asset delivery. No security rule, allow-list, redirect, file content or cache header is changed by the handler.

Workers Logs collects structured technical records. Invocation logs are disabled to avoid collecting arbitrary request URLs/headers. Query strings, cookies, authorization headers and document contents are not logged. A Cloudflare-provided connecting IP is retained only for clients claiming Googlebot or Google-InspectionTool; these are claims, never an access-control decision. The current Free plan retains Workers Logs for three days; requests that execute the Worker remain subject to the Workers Free request limit. No paid plan is enabled.

The existing daily maintenance job queries the last 24 hours when the repository token permits Workers Observability queries. Raw event data stays in an ephemeral private runner file and is deleted. Only a sanitized report is retained. Google source addresses are checked against the appropriate official Google common-crawlers or user-triggered-fetchers-google CIDR list, using Python's IPv4/IPv6 network parser. Missing source data or unavailable Google lists produce an unknown result, never a verified Google request.

Requests blocked by Cloudflare before Worker execution, including browser-signature rejection 1010, will NOT appear here. An empty report therefore does not prove Google never tried to fetch. These logs cannot recover historic requests from before deployment and cannot establish Google's sitemap processing or indexing state. That requires authorized Search Console data. A User-Agent test alone is never evidence of genuine Google access.

Query permission errors are reported explicitly as unavailable evidence; they do not turn into a claim that Google access succeeded. The existing sitemap and browser checks still fail on actual public-site faults.

References:
- https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests
- https://developers.cloudflare.com/workers/observability/logs/workers-logs/
- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
