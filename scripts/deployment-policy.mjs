import assert from 'node:assert/strict';
export function traffic(versions) {
  assert.ok(Array.isArray(versions) && versions.length > 0 && versions.length <= 2, 'Invalid existing deployment');
  for (const item of versions) {
    assert.match(item.version_id, /^[a-f0-9-]{36}$/i);
    assert.ok(Number.isFinite(item.percentage) && item.percentage >= 0 && item.percentage <= 100);
  }
  assert.equal(new Set(versions.map(v => v.version_id)).size, versions.length);
  assert.ok(Math.abs(versions.reduce((n, v) => n + v.percentage, 0) - 100) < 0.001);
  return versions.map(({version_id, percentage}) => ({version_id, percentage}));
}
export async function promoteSafely({previous, candidate, readCurrent, deploy, verify, record}) {
  const restore = traffic(previous.versions);
  assert.equal((await readCurrent()).id, previous.id, 'Deployment changed during upload; promotion cancelled');
  const promoted = await deploy([{version_id: candidate, percentage: 100}]);
  await record({previous, candidate, promoted, status: 'promoted-awaiting-checks'});
  try {
    const active = await readCurrent();
    assert.equal(active.id, promoted.id, 'Another deployment replaced this deployment');
    assert.deepEqual(traffic(active.versions), [{version_id: candidate, percentage: 100}]);
    await verify();
    const verified = await readCurrent();
    assert.equal(verified.id, promoted.id, 'Deployment changed during public verification');
    assert.deepEqual(traffic(verified.versions), [{version_id: candidate, percentage: 100}]);
    await record({previous, candidate, promoted, status: 'public-checks-passed'});
  } catch (error) {
    // Never overwrite a subsequent deployment made by someone else.
    if ((await readCurrent()).id !== promoted.id) {
      await record({previous, candidate, promoted, status: 'failed-newer-deployment-left-untouched'});
      throw new Error('Public checks failed; a newer deployment exists, so automatic rollback was blocked', {cause: error});
    }
    const rollback = await deploy(restore);
    const restored = await readCurrent();
    assert.equal(restored.id, rollback.id, 'Rollback deployment could not be confirmed');
    assert.deepEqual(traffic(restored.versions), restore, 'Previous traffic distribution was not restored');
    await record({previous, candidate, promoted, rollback, status: 'failed-and-rolled-back'});
    throw new Error('Public checks failed; previous traffic distribution restored', {cause: error});
  }
}
