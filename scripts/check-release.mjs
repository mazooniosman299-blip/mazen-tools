import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const origin='https://mazentoolsfree.mazooniosman299.workers.dev';
const paths=['/build-report.json','/sw.js','/sitemap.xml'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const expected=new Map(await Promise.all(paths.map(async path=>[path,hash(await readFile('dist'+path))])));
await mkdir('work',{recursive:true});
for(let attempt=1;attempt<=15;attempt++){
  const observed=await Promise.all(paths.map(async path=>{
    try{
      const response=await fetch(origin+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(5000)});
      const actual=hash(Buffer.from(await response.arrayBuffer()));
      return {path,status:response.status,expected:expected.get(path),actual,matches:response.ok&&actual===expected.get(path)};
    }catch{return {path,matches:false,error:'Public fetch did not complete'};}
  }));
  const complete=observed.every(item=>item.matches);
  await writeFile('work/release-verification.json',JSON.stringify({origin,attempt,complete,observed},null,2));
  console.log(`Public release identity: ${observed.filter(x=>x.matches).length}/${paths.length} matching artifacts (attempt ${attempt})`);
  if(complete)process.exit(0);
  if(attempt<15)await new Promise(resolve=>setTimeout(resolve,2000));
}
throw new Error('The public edge did not converge to the exact uploaded release; refusing release verification');
