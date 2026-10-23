export function cloudflareToken(raw) {
  if (!raw) return '';
  let token = raw.trim().replace(/^Bearer\s+/i, '');
  // Cloudflare shows an official curl verification example after creation.
  // If that example was saved, accept exactly one explicit Bearer value.
  const headers = [...raw.matchAll(/\bAuthorization:\s*Bearer\s+([A-Za-z0-9_-]{20,200})/gi)];
  if (headers.length > 1) throw new Error('Multiple authorization values in CLOUDFLARE_API_TOKEN; save one original token in GitHub Secrets.');
  if (headers.length === 1) token = headers[0][1];
  if (raw.trim().startsWith('{')) {
    try { const data = JSON.parse(raw); if (typeof data.value === 'string') token = data.value.trim(); } catch {}
  }
  // Reject unsafe header characters without ever embedding secret input in errors.
  if (!token || !/^[\x21-\x7e]+$/.test(token)) {
    throw new Error('CLOUDFLARE_API_TOKEN must contain only the original API token. The stored value contains internal whitespace or non-ASCII characters. Re-save the token directly in GitHub Secrets; never put it in chat.');
  }
  return token;
}
