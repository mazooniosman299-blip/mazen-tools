export function cloudflareToken(raw) {
  if (!raw) return '';
  const token = raw.trim().replace(/^Bearer\s+/i, '');
  // Reject unsafe header characters without ever embedding secret input in errors.
  if (!token || !/^[\x21-\x7e]+$/.test(token)) {
    throw new Error('CLOUDFLARE_API_TOKEN must contain only the original API token. The stored value contains internal whitespace or non-ASCII characters. Re-save the token directly in GitHub Secrets; never put it in chat.');
  }
  return token;
}
