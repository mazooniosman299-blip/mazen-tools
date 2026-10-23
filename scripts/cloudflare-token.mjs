export function cloudflareToken(raw) {
  if (!raw) return '';
  let token = raw.trim().replace(/^Bearer\s+/i, '');
  // Cloudflare shows an official curl verification example after creation.
  // If that example was saved, accept exactly one explicit Bearer value.
  const headers = [...raw.matchAll(/\bAuthorization:\s*Bearer\s+([^\s\x22\x27]+(?=[\s\x22\x27]|$))/gi)];
  if (headers.length > 1) throw new Error('Multiple authorization values in CLOUDFLARE_API_TOKEN; save one original token in GitHub Secrets.');
  if (headers.length === 1) token = headers[0][1];
  if (raw.trim().startsWith('{')) {
    try { const data = JSON.parse(raw); if (typeof data.value === 'string') token = data.value.trim(); } catch {}
  }
  // Reject unsafe header characters without ever embedding secret input in errors.
  if (!token || !/^[A-Za-z0-9_-]{1,200}$/.test(token)) {
    throw new Error('CLOUDFLARE_API_TOKEN must contain only the original API token. The stored value has an invalid length, internal whitespace, or unsupported token characters. Re-save the token directly in GitHub Secrets; never put it in chat.');
  }
  return token;
}
