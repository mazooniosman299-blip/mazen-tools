import {cloudflareToken} from './cloudflare-token.mjs';
const token=cloudflareToken(process.env.CLOUDFLARE_API_TOKEN);
if(!token) throw new Error('Cloudflare authorization missing');
console.log('::add-mask::'+token);
const account='da3d16c061d92307fde87ab0270c66b9';
for(const worker of ['cold-mud-0f95']){
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/scripts/'+worker+'/deployments',{headers:{Authorization:'Bearer '+token}});
 const d=await r.json();
 console.log(JSON.stringify({worker,httpStatus:r.status,success:d.success,errors:d.errors?.map(e=>({code:e.code,message:e.message})),deployments:d.result?.deployments?.map(x=>({id:x.id,created_on:x.created_on,versions:x.versions}))}));
 if(!r.ok||!d.success)process.exitCode=1;
}
