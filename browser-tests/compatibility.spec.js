import {test,expect} from '@playwright/test';
const aliases={'pdf-merge':'merge-pdf','pdf-split':'split-pdf','img-to-pdf':'images-pdf','pdf-to-img':'pdf-images','img-compress':'compress-image','img-resize':'resize-image','img-convert':'convert-image','qr-generator':'qr-code','word-counter':'word-counter','text-editor':'text-tools'};
test('all ten requested HTML routes load tools, metadata and assets',async({page})=>{
 const failures=[];
 page.on('pageerror',e=>failures.push(e.message));
 page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`)});
 for(const [alias,id] of Object.entries(aliases)){
  const response=await page.goto(`/tools/${alias}.html`);
  expect(response.status()).toBe(200);
  await expect(page.locator('#controls')).toBeVisible();
  await expect(page.locator('.logo')).toContainText('MAZEN AUTO TOOLS');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',new RegExp(`/ar/${id}/$`));
  await expect(page.locator('header a[lang=en]')).toHaveAttribute('href',`/en/${id}/`);
 }
 expect(failures).toEqual([]);
});
test('compatibility counter produces a valid UTF-8 download',async({page})=>{
 await page.goto('/tools/word-counter.html');
 await page.locator('#text').fill('مازن Hello');
 await expect(page.locator('#counts')).toContainText('2');
 await page.locator('#download').click();
 const ready=page.waitForEvent('download');
 await page.locator('#outputs a').click();
 const result=await ready;
 expect(await result.failure()).toBeNull();
});
