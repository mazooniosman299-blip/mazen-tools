import {readFile, writeFile, mkdir} from 'node:fs/promises';
await mkdir('work', {recursive:true});
let report;
try { report=JSON.parse(await readFile('work/private-google-report.json','utf8')); }
catch(error) {
  if(error.code!=='ENOENT')throw error;
  await writeFile('work/growth-status.json',JSON.stringify({dataAvailable:false,reason:'No authorized Search Console report; no traffic figures or keyword volumes inferred'},null,2));
  console.log('Growth analysis awaits real authorized Search Console data.');
  process.exit(0);
}
const opportunities=(report.searchRows||[]).filter(r=>r.impressions>=10 && (r.ctr<0.04 || r.position>10)).map(r=>({page:r.keys[0],clicks:r.clicks,impressions:r.impressions,ctr:r.ctr,position:r.position,suggestedAction:r.position<=10?'Review title and description against search intent; no clickbait':'Improve the relevant original guide and internal links; preserve working tools'})).sort((a,b)=>b.impressions-a.impressions).slice(0,10);
await writeFile('work/private-growth-opportunities.json',JSON.stringify({period:report.searchPeriod,opportunities,note:'Priorities from actual API data, not guaranteed rankings or revenue'},null,2),{mode:0o600});
await writeFile('work/growth-status.json',JSON.stringify({dataAvailable:true,opportunitiesFound:opportunities.length,rawTrafficKeptPrivate:true},null,2));
console.log('Growth priorities calculated from actual Google data and saved privately.');
