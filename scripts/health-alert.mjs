import {fileURLToPath} from 'node:url';
const marker='<!-- mazen-tools-health-alert:v1 -->';
export async function syncHealthAlert({api,repo,runUrl,crawl,functional}) {
  if(!['success','failure','cancelled'].includes(crawl)||!['success','failure','cancelled','skipped'].includes(functional))throw new Error('Incomplete monitor results; refusing a false recovery');
  let existing;
  for(let page=1;page<=10;page++){
    const issues=await api(`/repos/${repo}/issues?state=open&per_page=100&page=${page}`);
    existing=issues.find(issue=>!issue.pull_request&&issue.body?.includes(marker));
    if(existing||issues.length<100)break;
    if(page===10)throw new Error('Could not safely complete alert deduplication');
  }
  const previousFunctionalFailure=/functional=(failure|cancelled)/.exec(existing?.body||'')?.[1];
  let retained='';
  if(functional==='skipped' && previousFunctionalFailure){
    if(crawl==='success')return 'awaiting-functional-recheck';
    functional=previousFunctionalFailure;
    retained='\nThe functional failure is retained from the previous run; functional checks were skipped in this run.\n'+(existing.body.match(/Evidence: (https:\/\/github.com\/[^\s]+)/)?.[0]||'');
  }
  const failed=[crawl,functional].some(result=>['failure','cancelled'].includes(result));
  const body=`${marker}\nPublic maintenance results: crawl=${crawl}; functional=${functional}.\n\nEvidence: ${runUrl}\n\nThis reports technical checks, not confirmed Google indexing or traffic.${retained}`;
  if(failed){
    if(existing){await api(`/repos/${repo}/issues/${existing.number}`,'PATCH',{body});return 'updated-existing-failure';}
    await api(`/repos/${repo}/issues`,'POST',{title:'[Monitoring] Mazen Tools public health failure',body});return 'created-failure-alert';
  }
  if(existing){await api(`/repos/${repo}/issues/${existing.number}`,'PATCH',{state:'closed',state_reason:'completed',body:body+'\n\nRecovered: all checks scheduled for this run passed.'});return 'closed-recovered-alert';}
  return 'healthy-no-alert-needed';
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const repo=process.env.GITHUB_REPOSITORY;
  if(repo!=='mazooniosman299-blip/mazen-tools')throw new Error('Unexpected monitoring repository');
  const token=process.env.GITHUB_TOKEN;
  if(!token)throw new Error('Missing official Actions token');
  async function api(path,method='GET',body){
    const r=await fetch('https://api.github.com'+path,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
    if(!r.ok)throw new Error(`Monitoring alert API failed (HTTP ${r.status})`);
    return r.json();
  }
  console.log(await syncHealthAlert({api,repo,runUrl:`https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`,crawl:process.env.CRAWL_RESULT,functional:process.env.FUNCTIONAL_RESULT}));
}
