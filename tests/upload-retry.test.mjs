import test from 'node:test';
import assert from 'node:assert/strict';
import {retryAssetUpload, transientAssetUploadFailure} from '../scripts/upload-retry.mjs';
test('only the observed Cloudflare asset-session 10013 error is eligible for retry', () => {
  assert.equal(transientAssetUploadFailure('/assets-upload-session failed [code: 10013]'), true);
  for (const message of ['HTTP 403 Forbidden', '/assets-upload-session failed [code: 10000]', '/versions failed [code: 10013]']) assert.equal(transientAssetUploadFailure(message), false);
});
test('transient asset-session failure is retried with bounded delay', async () => {
  let calls = 0; const delays = [];
  await retryAssetUpload(async () => { if (++calls < 3) throw Object.assign(new Error('transient'), {transientAssetUpload: true}); }, {sleep: async ms => delays.push(ms)});
  assert.equal(calls, 3); assert.deepEqual(delays, [5000, 10000]);
});
test('persistent failure and authorization failures remain errors', async () => {
  for (const transientAssetUpload of [false, true]) {
    let calls = 0;
    await assert.rejects(retryAssetUpload(async () => {calls++; throw Object.assign(new Error('upload failed'), {transientAssetUpload});}, {sleep: async () => {}}), /upload failed/);
    assert.equal(calls, transientAssetUpload ? 3 : 1);
  }
});
