import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const origin='https://mazentoolsfree.mazooniosman299.workers.dev';
const workerSource=await readFile('dist/sw.js','utf8');
const manifest=JSON.parse(workerSource.match(/^const FILES = (\[.*\]);$/m)?.[1] || 'null');
if(!Array.isArray(manifest))throw new Error('Missing generated offline asset manifest');
// Verify every application asset and localized HTML document, not only markers.
// The dedicated missing-route check covers the host's 404 response separately.
const paths=[...new Set(['/build-report.json','/sw.js','/google611146e9ceec162a.html',...manifest.filter(path=>path!=='/404.html')])];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const expected=new Map(await Promise.all(paths.map(async path=>[path,hash(await readFile('dist'+path))])));
await mkdir('work',{recursive:true});
for(let attempt=1;attempt<=15;attempt++){
  const observed=new Array(paths.length);
  let next=0;
  await Promise.all(Array.from({length:4},async()=>{
   while(next<paths.length){
    const index=next++,path=paths[index];
    observed[index]=await (async()=>{
    try{
      const response=await fetch(origin+path.replace(/index\.html$/,''),{headers:{'Cache-Control':'no-cache','User-Agent':'MazenTools-Release-Check/1.0'},signal:AbortSignal.timeout(5000)});
      const actual=hash(Buffer.from(await response.arrayBuffer()));
      return {path,status:response.status,expected:expected.get(path),actual,matches:response.ok&&actual===expected.get(path)};
    }catch{return {path,matches:false,error:'Public fetch did not complete'};}
    })();
   }
  }));
  const complete=observed.every(item=>item.matches);
  await writeFile('work/release-verification.json',JSON.stringify({origin,attempt,complete,observed},null,2));
  console.log(`Public release identity: ${observed.filter(x=>x.matches).length}/${paths.length} matching artifacts (attempt ${attempt})`);
  if(complete)process.exit(0);
  if(attempt<15)await new Promise(resolve=>setTimeout(resolve,2000));
}
throw new Error('The public edge did not converge to the exact uploaded release; refusing release verification');
