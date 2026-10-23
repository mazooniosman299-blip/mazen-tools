import {writeFile, mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
// Only official OAuth and Google APIs. No credentials, responses or financial data go to logs.
const origin = 'https://mazentoolsfree.mazooniosman299.workers.dev/';
const sitemap = origin + 'sitemap.xml';
const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'];
await mkdir('work', {recursive: true});
if (!required.every(key => process.env[key])) {
  await writeFile('work/google-status.json', JSON.stringify({checkedAt: new Date().toISOString(), authorized: false, sitemapSubmitted: false, reason: 'Official Google OAuth authorization is not configured'}, null, 2));
  console.log('Google reports unavailable: official authorization is not configured.');
  process.exit(process.argv.includes('--submit-sitemap') ? 1 : 0);
}
const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  body: new URLSearchParams({client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: process.env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token'}), signal: AbortSignal.timeout(30000)
});
const auth = await tokenResponse.json();
assert.ok(tokenResponse.ok && auth.access_token, 'Google refused the official OAuth authorization');
async function request(url, method = 'GET', body) {
  const response = await fetch(url, {method, headers: {Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json'}, ...(body ? {body: JSON.stringify(body)} : {}), signal: AbortSignal.timeout(30000)});
  assert.ok(response.ok, `Google API refused request (HTTP ${response.status}); no success recorded`);
  return response.status === 204 || response.headers.get('content-length') === '0' ? {} : response.text().then(text => text ? JSON.parse(text) : {});
}
const sites = await request('https://www.googleapis.com/webmasters/v3/sites');
const property = sites.siteEntry?.find(site => site.siteUrl === origin && ['siteOwner', 'siteFullUser'].includes(site.permissionLevel));
assert.ok(property, 'The authorized account does not have access to the exact URL-prefix property');
const endpoint = 'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(origin);
let submitted = false;
if (process.argv.includes('--submit-sitemap')) {
  // Refuse submission until the public file, all listed routes and robots pass actual HTTP checks.
  const {spawnSync} = await import('node:child_process');
  const check = spawnSync('python3', ['scripts/check-sitemap.py', '--base', origin, '--require-self'], {stdio: 'inherit'});
  assert.equal(check.status, 0, 'Public sitemap checks failed; submission cancelled');
  await request(endpoint + '/sitemaps/' + encodeURIComponent(sitemap), 'PUT');
  submitted = true;
}
const maps = await request(endpoint + '/sitemaps');
const map = maps.sitemap?.find(item => item.path === sitemap);
const end = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
const start = new Date(Date.now() - 31 * 86400000).toISOString().slice(0, 10);
const search = await request(endpoint + '/searchAnalytics/query', 'POST', {startDate: start, endDate: end, dimensions: ['page'], rowLimit: 100});
const report = {checkedAt: new Date().toISOString(), authorized: true, property: origin, sitemapSubmitted: submitted, sitemap: map || null, searchPeriod: {start, end}, searchRows: search.rows || [], note: 'A successful API submission is not confirmed fetch, indexing or AdSense approval'};
// This file can contain private traffic or financial information. Never upload to public artifacts.
if (process.env.ADSENSE_ACCOUNT_ID) {
  assert.match(process.env.ADSENSE_ACCOUNT_ID, /^pub-\d{16}$/);
  report.adSenseSites = await request(`https://adsense.googleapis.com/v2/accounts/${process.env.ADSENSE_ACCOUNT_ID}/sites?pageSize=100`);
  const url = new URL(`https://adsense.googleapis.com/v2/accounts/${process.env.ADSENSE_ACCOUNT_ID}/reports:generate`);
  url.searchParams.set('dateRange', 'LAST_30_DAYS');
  url.searchParams.append('metrics', 'ESTIMATED_EARNINGS');
  url.searchParams.append('metrics', 'PAGE_VIEWS');
  report.adSenseReport = await request(url.href);
  report.adSenseRevenueNote = 'Estimated account earnings are not finalized payments, and are not necessarily attributable to Mazen Tools';
}
if (process.env.GA4_PROPERTY_ID) {
  assert.match(process.env.GA4_PROPERTY_ID, /^\d+$/);
  report.analytics = await request(`https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`, 'POST', {dateRanges: [{startDate: '30daysAgo', endDate: 'yesterday'}], dimensions: [{name: 'eventName'}], metrics: [{name: 'eventCount'}, {name: 'totalUsers'}], limit: 100});
  report.analyticsNote = 'Only existing events from the authorized property; no tracking is activated or data fabricated';
}
await writeFile('work/private-google-report.json', JSON.stringify(report, null, 2), {mode: 0o600});
await writeFile('work/google-status.json', JSON.stringify({checkedAt: report.checkedAt, authorized: true, sitemapSubmitted: submitted, sitemapReportedByGoogle: !!map, hasFetchErrors: map ? Number(map.errors || 0) > 0 : null}, null, 2));
console.log('Official Google API report saved privately; no traffic or earnings values written to logs.');
