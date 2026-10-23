import {mkdir,readFile,writeFile,unlink} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {cloudflareToken} from './cloudflare-token.mjs';
await mkdir('work',{recursive:true});
const token=cloudflareToken(process.env.CLOUDFLARE_API_TOKEN);
if(token&&process.env.GITHUB_ACTIONS==='true')console.log(`::add-mask::${token}`);
async function finish(data){await writeFile('work/crawler-log-status.json',JSON.stringify(data,null,2));console.log('CRAWLER_LOG_STATUS='+JSON.stringify(data));}
if(!token){await finish({logQueryAvailable:false,reason:'Cloudflare authorization not configured; not proof of Google access'});process.exit(0);}
let account=process.env.CLOUDFLARE_ACCOUNT_ID;
if(!account){
 const check=spawnSync(process.execPath,['scripts/check-cloudflare-access.mjs'],{encoding:'utf8',env:{...process.env,CLOUDFLARE_API_TOKEN:token}});
 if(check.status!==0){await finish({logQueryAvailable:false,reason:'Cloudflare account preflight failed; no Google access conclusion'});process.exit(0);}
 account=JSON.parse(await readFile('work/cloudflare-access.json','utf8')).accountId;
}
if(!/^[a-f0-9]{32}$/i.test(account||''))throw Error('Invalid authorized account');
const now=Date.now();
const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/observability/telemetry/query`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({queryId:'mazen-tools-crawl-readonly',timeframe:{from:now-86400000,to:now},parameters:{datasets:[],filters:[{key:'$metadata.service',operation:'eq',type:'string',value:'mazentoolsfree'}]},view:'events',limit:2000,dry:true}),signal:AbortSignal.timeout(30000)});
if(!response.ok){await finish({logQueryAvailable:false,httpStatus:response.status,reason:response.status===403?'Token cannot query Workers Observability; additional official permission required':'Cloudflare telemetry query failed; no conclusion about Google access'});process.exit(0);}
const data=await response.json();
if(data.success===false){await finish({logQueryAvailable:false,reason:'Cloudflare did not confirm the telemetry query'});process.exit(0);}
if(data.result?.run?.status==='STARTED'){
 await finish({logQueryAvailable:true,queryCompleted:false,reason:'Telemetry query is still processing; no Google access conclusion'});process.exit(0);
}
const privatePath='work/private-crawler-logs.json';
try{
 await writeFile(privatePath,JSON.stringify(data),{mode:0o600});
 const check=spawnSync('python3',['scripts/crawler_identity.py',privatePath],{encoding:'utf8'});
 if(check.status!==0)throw Error('Private crawler verification failed; raw data not printed');
 await finish(JSON.parse(check.stdout));
}finally{await unlink(privatePath).catch(()=>{});}
