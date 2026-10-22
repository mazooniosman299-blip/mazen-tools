# Independent maintenance contract

Use the existing Site appgprj_6ada950c47bc8191995007a795d64e71 and its current source revision. Never create another Site or change audience/domain. Never enable ads, change publisher settings, generate visits or click advertising. No paid service or new subscription is authorized.

For a fresh cloud run, get_site identifies the live version. Acquire short-lived source access for this Site through the official Sites credential tool. Credentials belong only in process memory and stdin, never files, command arguments or reports. Use the Sites source workflow helper when available; if it is absent, use Git with the returned remote and ephemeral HTTP authorization supplied through the subprocess environment after hidden stdin input. Do not print credentials. A scratch checkout is acceptable; the current conversation's /workspace files must not be assumed to persist.

In the fresh checkout, use Node 22+, npm ci, npm test, npm run build, node scripts/check-site.mjs and node scripts/readiness.mjs. Run npm run test:browser if a supported Chromium is available. Browser tests compare real downloaded file contents and validate 38 routes on desktop and mobile emulation. Run npm audit --omit=dev --audit-level=high and report actual results. No unattended source modification or deployment is required by this monitoring task.

Where network policy permits, use PUBLIC_ORIGIN=https://mazen-tools-free.sprytitan65.chatgpt.site for the browser suite; it validates actual public HTTP assets and tool functionality. Keep the configured proxy and TLS verification. If blocked, report the exact limitation and label local checks separately. The owner has externally confirmed the tools worked after the prior fix; that is not a substitute for new checks.

Readiness checks are internal evidence, not Google approval. Verify contact remains mazenosman968@gmail.com (explicitly approved for publication), ad flags remain disabled, and no placeholder publisher ID is present. Do not use personal file contents or passwords as fixtures. Monitor official policy changes using primary Google documentation. Do not generate articles, fabricate traffic/revenue or send email.

Return an Arabic report of what passed, what failed, and the single most useful next action. Record the checked source revision, live version and actual run time. Missing source, browser or permission must be reported rather than silently counted as a pass.
