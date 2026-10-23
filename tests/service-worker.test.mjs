import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=(await readFile(new URL('../scripts/service-worker.template.js',import.meta.url),'utf8')).replace("'__CACHE__'", "'test-cache'").replace('__FILES__',JSON.stringify(['/one','/two','/three','/four','/five']));
function fixture(fetch) {
  const handlers={},stored=new Map();let activated=false;
  const context=vm.createContext({fetch,AbortSignal,Error,Promise,Set,setTimeout:fn=>{fn();return 0},caches:{open:async()=>({put:async(path,response)=>stored.set(path,response)})},self:{addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{activated=true}}});
  vm.runInContext(source,context);
  return {stored,get activated(){return activated},install:()=>new Promise((resolve,reject)=>handlers.install({waitUntil:promise=>promise.then(resolve,reject)}))};
}
test('offline installation recovers from the observed 502 and caches every required file',async()=>{
  const counts=new Map();let concurrent=0,max=0;
  const f=fixture(async path=>{concurrent++;max=Math.max(max,concurrent);await Promise.resolve();concurrent--;const n=(counts.get(path)||0)+1;counts.set(path,n);return {status:path==='/two'&&n===1?502:200}});
  await f.install();assert.equal(f.stored.size,5);assert.equal(counts.get('/two'),2);assert.ok(max<=4);assert.equal(f.activated,true);
});
test('a forbidden or missing mandatory offline file blocks activation without retries',async()=>{
  for(const status of [403,404]){let calls=0;const f=fixture(async()=>{calls++;return {status}});await assert.rejects(f.install(),new RegExp(`HTTP ${status}`));assert.equal(f.activated,false);assert.ok(calls<=4);}
});
test('persistent edge errors have bounded retries and never activate an incomplete cache',async()=>{
  const counts=new Map();const f=fixture(async path=>{counts.set(path,(counts.get(path)||0)+1);return {status:502}});
  await assert.rejects(f.install(),/HTTP 502/);assert.equal(f.activated,false);assert.ok([...counts.values()].every(n=>n<=3));
});
