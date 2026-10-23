import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir, writeFile} from 'node:fs/promises';
const local = process.env.PERFORMANCE_LOCAL === 'true';
const origin = local ? 'http://127.0.0.1:4173' : process.env.PUBLIC_ORIGIN || 'https://mazentoolsfree.mazooniosman299.workers.dev';
let server;
let browser;
try {
  if (local) {
    server = spawn(process.execPath, ['scripts/serve-production.mjs'], {stdio: 'ignore'});
    for (let n = 0; n < 30; n++) {
      try { if ((await fetch(origin + '/robots.txt')).ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  browser = await chromium.launch({...(process.env.CI ? {} : {executablePath: '/usr/bin/chromium'}), args: ['--no-sandbox'], ...(!local && process.env.HTTPS_PROXY ? {proxy: {server: process.env.HTTPS_PROXY}} : {})});
  const rows = [];
  for (const path of ['/ar/', '/en/images-pdf/']) {
    const context = await browser.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block', extraHTTPHeaders: {DNT: '1'}});
    // Synthetic diagnostics must never request ads, record analytics or click ads.
    await context.route('**/*', route => new URL(route.request().url()).origin === new URL(origin).origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const response = await page.goto(origin + path, {waitUntil: 'networkidle'});
    if (response?.status() !== 200) throw Error(`Performance navigation failed: ${path}`);
    const timing = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      return {responseMs: navigation.responseStart, domContentLoadedMs: navigation.domContentLoadedEventEnd, loadMs: navigation.loadEventEnd, firstContentfulPaintMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null, transferredBytes: resources.reduce((n, r) => n + r.transferSize, navigation.transferSize), resources: resources.length};
    });
    rows.push({path, ...timing});
    await context.close();
  }
  await mkdir('work', {recursive: true});
  await writeFile('work/performance.json', JSON.stringify({origin, measuredAt: new Date().toISOString(), scope: 'Synthetic cold browser navigation; not field Core Web Vitals, visitor traffic or earnings', rows}, null, 2));
  console.log(`Recorded ${rows.length} real browser navigation measurements; no visitor or earnings claims.`);
} finally {
  await browser?.close();
  server?.kill();
}
