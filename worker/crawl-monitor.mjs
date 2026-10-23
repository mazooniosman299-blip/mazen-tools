const monitored=new Set(['/sitemap.xml','/robots.txt']);
export function crawlRecord(request,status){
  const path=new URL(request.url).pathname;
  if(!monitored.has(path))return null;
  const agent=(request.headers.get('User-Agent')||'').slice(0,250);
  const claimedGoogle=/googlebot|google-inspectiontool/i.test(agent);
  return {event:'mazen-crawl-fetch-v1',at:new Date().toISOString(),path,method:request.method,status,
    userAgent:agent,claimedGoogle,
    // Only Cloudflare's runtime-supplied connecting address, never X-Forwarded-For.
    // This is evidence for later verification, NOT an allow-list or authentication.
    ...(claimedGoogle&&request.cf?{sourceIp:request.headers.get('CF-Connecting-IP')||null}:{}),
    ray:request.headers.get('CF-Ray')||null,identityVerification:'not-yet-verified'};
}
export default {
  async fetch(request,env){
    try{
      const response=await env.ASSETS.fetch(request);
      const record=crawlRecord(request,response.status);
      if(record)console.log(record);
      return response;
    }catch(error){
      const record=crawlRecord(request,null);
      if(record)console.error({...record,error:'Asset fetch threw before a response was observed'});
      throw error;
    }
  }
};
