import {syncHealthAlert} from './health-alert.mjs';
const repo=process.env.GITHUB_REPOSITORY,token=process.env.GITHUB_TOKEN,run=process.env.GITHUB_RUN_ID;
const marker='<!-- mazen-tools-health-alert:v1 -->',testMarker=`<!-- mazen-tools-alert-delivery-test:${run} -->`;
let created;
async function raw(path,method='GET',body){const r=await fetch('https://api.github.com'+path,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json','Cache-Control':'no-cache'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`Delivery test API failed: HTTP ${r.status}`);return r.json()}
async function api(path,method='GET',body){
 if(method==='GET')return (await raw(path)).filter(i=>i.body?.includes(testMarker)).map(i=>({...i,body:i.body.replace(testMarker,marker)}));
 const payload={...body};if(payload.title)payload.title='[Monitoring test] Notification delivery verification — no site outage';
 if(payload.body)payload.body='CONTROLLED DELIVERY TEST: these are simulated job results, not a production failure.\n\n'+payload.body.replace(marker,testMarker);
 const result=await raw(path,method,payload);if(method==='POST')created=result.number;return result;
}
try{
 const args={api,repo,runUrl:`https://github.com/${repo}/actions/runs/${run}`,crawl:'failure',functional:'success'};
 for(const expected of ['created-failure-alert','updated-existing-failure','closed-recovered-alert']){
  if(expected==='closed-recovered-alert')args.crawl='success';
  const actual=await syncHealthAlert(args);if(actual!==expected)throw Error(`Unexpected delivery transition: ${actual}`);console.log('CONTROLLED_NOTIFICATION_TEST: '+actual);
  if(expected!=='closed-recovered-alert'){
    let visible=false;
    for(let attempt=0;attempt<10;attempt++){
      const listed=await api(`/repos/${repo}/issues?state=open&per_page=100&page=1`);
      if(listed.some(issue=>issue.number===created)){visible=true;break;}
      await new Promise(resolve=>setTimeout(resolve,1000));
    }
    if(!visible)throw Error('GitHub has not exposed the created test issue to listing yet');
  }
 }
 const issue=await raw(`/repos/${repo}/issues/${created}`);if(issue.state!=='closed')throw Error('Delivery test issue was not closed');console.log('CONTROLLED_NOTIFICATION_TEST: confirmed closed issue '+issue.html_url);
}finally{
 const testIssues=await raw(`/repos/${repo}/issues?state=open&per_page=100`);
 for(const issue of testIssues.filter(issue=>issue.body?.includes(testMarker)))await raw(`/repos/${repo}/issues/${issue.number}`,'PATCH',{state:'closed'});
 if(created){const issue=await raw(`/repos/${repo}/issues/${created}`);if(issue.state!=='closed')await raw(`/repos/${repo}/issues/${created}`,'PATCH',{state:'closed'});}
}
