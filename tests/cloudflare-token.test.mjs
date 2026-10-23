import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudflareToken} from '../scripts/cloudflare-token.mjs';
test('credential transport accepts surrounding copy whitespace without changing token bytes', () => {
  assert.equal(cloudflareToken('  test-token-value\r\n'), 'test-token-value');
  assert.equal(cloudflareToken('Bearer test-token-value'), 'test-token-value');
});
test('invalid multiline credentials are rejected without disclosing their contents', () => {
  const value='private-value\nnot-a-header';
  assert.throws(() => cloudflareToken(value), error => !error.message.includes('private-value') && error.message.includes('GitHub Secrets'));
});
test('the official curl header or token JSON can be imported without executing code', () => {
  const token = 'example-token-for-testing-only-123';
  assert.equal(cloudflareToken(`curl https://api.cloudflare.com/client/v4/user/tokens/verify \\\n+  -H "Authorization: Bearer ${token}"`), token);
  assert.equal(cloudflareToken(JSON.stringify({value: token})), token);
  assert.throws(() => cloudflareToken(`Authorization: Bearer ${token}\nAuthorization: Bearer ${token}`), /Multiple authorization/);
});
