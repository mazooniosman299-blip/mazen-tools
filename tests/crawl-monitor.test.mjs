import test from 'node:test';import assert from 'node:assert/strict';
import worker,{crawlRecord} from '../worker/crawl-monitor.mjs';
test('monitor delegates the exact request and response, preserving XML bytes and headers',async()=>{
 const request=new Request('https://example.com/sitemap.xml');const response=new Response('<urlset/>',{headers:{'Content-Type':'application/xml','Cache-Control':'max-age=0'}});let received;
 const original=console.log;console.log=()=>{};
 try{assert.equal(await worker.fetch(request,{ASSETS:{fetch:async r=>{received=r;return response}}}),response);assert.equal(received,request);assert.equal(await response.text(),'<urlset/>');}finally{console.log=original;}
});
test('claimed Google identity is never marked verified and a spoofed forwarded IP is not trusted',()=>{
 const request=new Request('https://example.com/sitemap.xml?private=value',{headers:{'User-Agent':'Googlebot/2.1','X-Forwarded-For':'66.249.66.1','CF-Connecting-IP':'66.249.66.1','Cookie':'private-cookie'}});
 const row=crawlRecord(request,200);assert.equal(row.claimedGoogle,true);assert.equal(row.identityVerification,'not-yet-verified');assert.equal(row.sourceIp,undefined);assert.equal(row.path,'/sitemap.xml');assert.ok(!JSON.stringify(row).includes('private'));
});
test('Cloudflare-provided address is retained privately for subsequent real-IP verification',()=>{
 const request=new Request('https://example.com/robots.txt',{headers:{'User-Agent':'Googlebot/2.1','CF-Connecting-IP':'192.0.2.1'}});request.cf={colo:'TEST'};
 assert.equal(crawlRecord(request,403).sourceIp,'192.0.2.1');assert.equal(crawlRecord(request,403).status,403);
});
test('ordinary tool requests are not logged and monitor requests retain no source address',()=>{
 assert.equal(crawlRecord(new Request('https://example.com/en/merge-pdf/'),200),null);
 assert.equal(crawlRecord(new Request('https://example.com/sitemap.xml',{headers:{'User-Agent':'MazenTools-Sitemap-Check/1.0','CF-Connecting-IP':'192.0.2.1'}}),200).sourceIp,undefined);
});
