import test from 'node:test';
import assert from 'node:assert/strict';
import {promoteSafely, traffic} from '../scripts/deployment-policy.mjs';
const old = '11111111-1111-1111-1111-111111111111', next = '22222222-2222-2222-2222-222222222222';
function scenario({fail = false, drift = false, changedBefore = false} = {}) {
  const previous = {id: 'old-deployment', versions: [{version_id: old, percentage: 100}]};
  let current = changedBefore ? {...previous, id: 'someone-else'} : previous;
  const writes = [], records = [];
  return {writes, records, options: {previous, candidate: next,
    readCurrent: async () => current,
    deploy: async versions => {writes.push(versions); current = {id: `deployment-${writes.length}`, versions}; return current;},
    verify: async () => {if (drift) current = {...previous, id: 'newer-human-deployment'}; if (fail) throw Error('Actual file download failed');},
    record: async record => records.push(record)
  }};
}
test('successful public verification leaves new version at 100%', async () => {
  const s = scenario(); await promoteSafely(s.options); assert.equal(s.writes.length, 1); assert.equal(s.records.at(-1).status, 'public-checks-passed');
});
test('failed public verification restores previous traffic distribution', async () => {
  const s = scenario({fail: true}); await assert.rejects(promoteSafely(s.options), /restored/); assert.deepEqual(s.writes[1], s.options.previous.versions);
});
test('failed checks never overwrite a subsequent human deployment', async () => {
  const s = scenario({fail: true, drift: true}); await assert.rejects(promoteSafely(s.options), /newer deployment/); assert.equal(s.writes.length, 1);
});
test('concurrent deployment during upload prevents promotion', async () => {
  const s = scenario({changedBefore: true}); await assert.rejects(promoteSafely(s.options), /cancelled/); assert.equal(s.writes.length, 0);
});
test('invalid traffic distributions are refused before deployment', () => {
  assert.throws(() => traffic([{version_id: old, percentage: 50}]));
  assert.throws(() => traffic([{version_id: old, percentage: 100}, {version_id: old, percentage: 0}]));
});
