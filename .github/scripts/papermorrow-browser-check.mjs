import { chromium } from 'playwright';
import fs from 'node:fs';
const base = 'https://papermorrow-tools-om.pages.dev';
const slugs = [
'jpg-to-pdf','png-to-pdf','webp-to-pdf','images-to-pdf','merge-pdf',
'split-pdf','extract-pdf-pages','delete-pdf-pages','rotate-pdf-pages','reorder-pdf-pages',
'pdf-to-images','compress-pdf','watermark-pdf','add-page-numbers',
'jpg-to-png','png-to-jpg','webp-to-jpg-png','compress-image','resize-image',
'crop-image','rotate-image','batch-convert-images','optimize-images-for-web','convert-to-webp'
];
fs.mkdirSync('papermorrow-browser-report',{recursive:true});
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:true});
const page = await context.newPage();
const results = [];
for (const lang of ['en','ar']) {
 for (const slug of slugs) {
  const url = base + (lang === 'ar' ? '/ar' : '') + '/tools/' + slug + '/';
  const errors = [];
  const handler = e=>errors.push(String(e.message||e).slice(0,320));
  page.on('pageerror',handler);
  let status=null, uploadVisible=false, pageTitle='', bodyText='';
  try {
   const resp = await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
   status = resp?.status()??null;
   await page.locator('input[type=file]').first().waitFor({state:'attached',timeout:9000});
   uploadVisible = await page.locator('input[type=file]').count()>0;
   pageTitle = await page.title();
   bodyText = (await page.locator('body').innerText()).slice(0,400);
  } catch(e) {
   errors.push('NAV/LOAD: '+String(e.message||e).slice(0,240));
  } finally {
   page.off('pageerror',handler);
  }
  const item={lang,slug,url,status,uploadVisible,pageTitle,errors,bodySample:bodyText};
  results.push(item);
  console.log((status===200 && uploadVisible && !errors.length?'PASS':'CHECK'),lang,slug,status,uploadVisible,errors.join('; '));
 }
}
await page.goto(base+'/tools/pdf-to-images/',{waitUntil:'domcontentloaded',timeout:20000}).catch(()=>null);
await page.screenshot({path:'papermorrow-browser-report/pdf-to-images.png',fullPage:true}).catch(()=>{});
await browser.close();
const summary = {checked:results.length,passed:results.filter(x=>x.status===200&&x.uploadVisible&&!x.errors.length).length,results};
fs.writeFileSync('papermorrow-browser-report/results.json',JSON.stringify(summary,null,2));
console.log('FINAL',summary.passed,'/',summary.checked);
if(summary.passed!==summary.checked) process.exitCode=1;
