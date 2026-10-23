import {cloudflareToken} from './cloudflare-token.mjs';
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {traffic, promoteSafely} from './deployment-policy.mjs';
const origin = 'https://mazentoolsfree.mazooniosman299.workers.dev';
const worker = 'mazentoolsfree';
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = cloudflareToken(process.env.CLOUDFLARE_API_TOKEN);
assert.ok(process.env.CLOUDFLARE_DEPLOY_ENABLED === 'true', 'Deployment is disabled until official account setup is complete');
assert.match(account || '', /^[a-f0-9]{32}$/i, 'Missing actual Cloudflare account ID');
assert.ok(token, 'Missing official Cloudflare authorization');
const prefix = `/accounts/${account}/workers/scripts/${worker}`;
async function api(endpoint, body) {
  const response = await fetch('https://api.cloudflare.com/client/v4' + endpoint, {
    method: body ? 'POST' : 'GET',
    headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
    ...(body ? {body: JSON.stringify(body)} : {}), signal: AbortSignal.timeout(30000)
  });
  const data = await response.json();
  // Never print provider response bodies or authentication material.
  assert.ok(response.ok && data.success, `Cloudflare API refused ${endpoint.split('?')[0]} (HTTP ${response.status})`);
  return data.result;
}
async function readCurrent() {
  const {deployments} = await api(prefix + '/deployments');
  assert.ok(deployments?.[0]?.id, 'No existing deployment; refusing to create a replacement Worker');
  traffic(deployments[0].versions);
  return deployments[0];
}
async function deploy(versions) {
  return api(prefix + '/deployments', {strategy: 'percentage', versions: traffic(versions), annotations: {'workers/message': 'Mazen Tools tested release / automated recovery'}});
}
function command(bin, args, extra = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {stdio: 'inherit', env: {...process.env, WRANGLER_SEND_METRICS: 'false', CLOUDFLARE_API_TOKEN: token, ...extra}});
    child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${bin} failed (${code})`)));
  });
}
await mkdir('work', {recursive: true});
const record = data => writeFile('work/deployment.json', JSON.stringify({origin, worker, recordedAt: new Date().toISOString(), ...data}, null, 2));
const subdomain = await api(`/accounts/${account}/workers/subdomain`);
assert.equal(subdomain.subdomain, 'mazooniosman299', 'Wrong Cloudflare account; no changes made');
const previous = await readCurrent();
const settings = await api(prefix + '/settings');
assert.ok((settings.bindings || []).every(b => ['plain_text', 'secret_text'].includes(b.type)), 'Existing resource bindings require a reviewed migration; no changes made');
if (process.argv.includes('--rollback')) {
  const snapshot = JSON.parse(await readFile(process.argv[process.argv.indexOf('--rollback') + 1], 'utf8'));
  assert.equal(snapshot.origin, origin);
  assert.equal(previous.id, snapshot.promoted.id, 'Current deployment differs from this snapshot; no rollback performed');
  const restored = await deploy(snapshot.previous.versions);
  assert.equal((await readCurrent()).id, restored.id);
  console.log('Previous deployment restored; all versions retained.');
} else {
  const build = JSON.parse(await readFile('dist/build-report.json', 'utf8'));
  assert.equal(build.origin, origin);
  assert.equal(build.adsEnabled, false, 'Advertising activation requires its own reviewed release');
  await record({previous, status: 'snapshot-before-upload'});
  const tag = `ci-${process.env.GITHUB_RUN_ID || Date.now()}-${process.env.GITHUB_RUN_ATTEMPT || '1'}`;
  await command('npx', ['--no-install', 'wrangler', 'versions', 'upload', '--config', 'wrangler.jsonc', '--keep-vars', '--strict', '--tag', tag, '--message', 'Mazen Tools checked production assets']);
  const {items} = await api(prefix + '/versions?deployable=true');
  const candidates = items.filter(v => v.annotations?.['workers/tag'] === tag);
  assert.equal(candidates.length, 1, 'Uploaded version could not be identified unambiguously; no promotion');
  const candidate = candidates[0].id;
  await promoteSafely({previous, candidate, readCurrent, deploy, record, verify: async () => {
    await command('python3', ['scripts/check-sitemap.py', '--base', origin, '--require-self']);
    // Downloads and file contents are tested against the public release, not just the build.
    await command('npx', ['--no-install', 'playwright', 'test'], {PUBLIC_ORIGIN: origin});
  }});
  console.log('Deployment and public functional checks passed.');
}
