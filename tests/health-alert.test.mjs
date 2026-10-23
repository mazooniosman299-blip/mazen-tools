import test from 'node:test';import assert from 'node:assert/strict';
import {syncHealthAlert} from '../scripts/health-alert.mjs';
function scenario({existing=false,crawl='success',functional='success'}={}){
 const writes=[];return {writes,args:{repo:'owner/repo',runUrl:'https://github.com/owner/repo/actions/runs/123',crawl,functional,api:async(path,method='GET',body)=>{if(method==='GET')return existing?[{number:7,body:'<!-- mazen-tools-health-alert:v1 -->'}]:[];writes.push({path,method,body});return {};}}};
}
test('healthy daily checks with weekly job skipped create no alert',async()=>{const s=scenario({functional:'skipped'});assert.equal(await syncHealthAlert(s.args),'healthy-no-alert-needed');assert.equal(s.writes.length,0)});
test('new crawl failure creates an issue with evidence',async()=>{const s=scenario({crawl:'failure'});assert.equal(await syncHealthAlert(s.args),'created-failure-alert');assert.equal(s.writes[0].method,'POST');assert.match(s.writes[0].body.body,/runs\/123/)});
test('repeated failures update the same issue rather than creating duplicates',async()=>{const s=scenario({existing:true,functional:'failure'});await syncHealthAlert(s.args);assert.equal(s.writes.length,1);assert.equal(s.writes[0].method,'PATCH');assert.match(s.writes[0].path,/issues\/7$/)});
test('a successful run closes the existing alert',async()=>{const s=scenario({existing:true});await syncHealthAlert(s.args);assert.equal(s.writes[0].body.state,'closed')});
test('missing results cannot close an alert or report recovery',async()=>{const s=scenario({existing:true,crawl:'skipped'});await assert.rejects(syncHealthAlert(s.args),/Incomplete/);assert.equal(s.writes.length,0)});
