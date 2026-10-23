import {cloudflareToken} from './cloudflare-token.mjs';
import {mkdir, writeFile, appendFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('work', {recursive:true});
const token=cloudflareToken(process.env.CLOUDFLARE_API_TOKEN);
async function finish(report){
  await writeFile('work/cloudflare-access.json',JSON.stringify(report,null,2));
  if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`ready=${report.ready}\naccount_id=${report.accountId||''}\n`);
  console.log(JSON.stringify(report));
}
if(!token){
  await finish({ready:false,tokenConfigured:false,reason:'Missing repository secret CLOUDFLARE_API_TOKEN. No Cloudflare changes attempted.'});
}else{
  async function get(path){
    const response=await fetch('https://api.cloudflare.com/client/v4'+path,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(30000)});
    const data=await response.json();assert.ok(response.ok&&data.success,`Cloudflare authorization check failed for ${path} (HTTP ${response.status}); no changes attempted`);return data.result;
  }
  const accounts=process.env.CLOUDFLARE_ACCOUNT_ID?[{id:process.env.CLOUDFLARE_ACCOUNT_ID}]:await get('/accounts?per_page=50');
  const matches=[];
  for(const account of accounts){
    assert.match(account.id,/^[a-f0-9]{32}$/i);
    const subdomain=await get(`/accounts/${account.id}/workers/subdomain`);
    if(subdomain.subdomain==='mazooniosman299')matches.push(account.id);
  }
  assert.equal(matches.length,1,'The token must authorize exactly one account with workers.dev subdomain mazooniosman299');
  const accountId=matches[0];
  const deployment=await get(`/accounts/${accountId}/workers/scripts/mazentoolsfree/deployments`);
  assert.ok(deployment.deployments?.[0]?.id,'Existing Worker deployment could not be verified');
  await finish({ready:true,tokenConfigured:true,accountId,worker:'mazentoolsfree',currentDeploymentId:deployment.deployments[0].id,scope:'Read-only authorization preflight; no deployment performed'});
}
