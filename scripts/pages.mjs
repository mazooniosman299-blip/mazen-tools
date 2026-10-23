import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {tools} from '../src/core.js';
import {summaries,toolArticle,pageContent,pagesCatalog} from '../src/content.js';
import {canRequestAds} from '../src/ad-policy.js';
const origin=(process.env.SITE_ORIGIN||'https://mazentoolsfree.mazooniosman299.workers.dev').replace(/\/$/,'');
if(new URL(origin).protocol!=='https:')throw Error('Production SITE_ORIGIN must use HTTPS');
const template=await readFile('dist/index.html','utf8');
const editorialDescriptions=JSON.parse(await readFile('config/seo-content.json','utf8'));
const measurement=JSON.parse(await readFile('config/measurement.json','utf8'));
if(measurement.enabled&&(!measurement.certifiedConsentAdapterReady||!measurement.privacyReviewed||!/^G-[A-Z0-9]{6,20}$/.test(measurement.ga4MeasurementId)||!(await readFile('public/_headers','utf8')).includes('https://www.googletagmanager.com')))throw Error('Analytics requires a real property and reviewed consent, privacy and CSP integration');
const config=JSON.parse(await readFile('config/monetization.json','utf8'));
const publisher=process.env.ADSENSE_PUBLISHER_ID||config.publisherId;
const verification=process.env.GSC_VERIFICATION_TOKEN||'';
if(publisher&&!/^ca-pub-\d{16}$/.test(publisher))throw Error('Invalid AdSense publisher ID');
if(verification&&!/^[A-Za-z0-9_-]{10,200}$/.test(verification))throw Error('Invalid Search Console verification token');
if(config.enabled&&!canRequestAds({...config,publisherId:publisher},{advertisingAllowed:true,certifiedAdapter:true}))throw Error('Advertising activation gates are not approved');
const seller=process.env.ADSENSE_ADS_TXT||'';
if(seller){if(!publisher||seller.trim()!==`google.com, ${publisher.slice(3)}, DIRECT, f08c47fec0942fa0`)throw Error('ads.txt must match the real publisher account');await writeFile('dist/ads.txt',seller.trim()+'\n')}
const verificationMeta=(verification?`<meta name="google-site-verification" content="${verification}">`:'')+(publisher?`<meta name="google-adsense-account" content="${publisher}">`:'');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const routes=[];const entries=[['','أدوات يومك، ببساطة','Everyday tools, simply'],...tools,...pagesCatalog];
function render(entry,lang){const ar=lang==='ar',id=entry[0],name=entry[ar?1:2],title=name+' | MAZEN AUTO TOOLS';const path=`/${lang}/${id?id+'/':''}`,canonical=origin+path;const description=summaries[id]?.[ar?0:1]||editorialDescriptions[id]?.[ar?0:1]||(id?`${name} — ${ar?'دليل ومعلومات MAZEN AUTO TOOLS المجانية.':'Free MAZEN AUTO TOOLS guidance and information.'}`:ar?'أدوات مجانية للصور وPDF والنصوص تعمل على جهازك دون رفع الملفات.':'Free image, PDF and text tools that work on your device without uploads.');
const isTool=tools.some(t=>t[0]===id);const schema=isTool?{'@context':'https://schema.org','@type':'WebApplication',name,url:canonical,description,applicationCategory:'UtilitiesApplication',operatingSystem:'Any',isAccessibleForFree:true,inLanguage:lang,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}}:{'@context':'https://schema.org','@type':id?'WebPage':'WebSite',name:title,url:canonical,inLanguage:lang};
const meta=`${verificationMeta}<link rel="canonical" href="${canonical}">${['ar','en','x-default'].map(l=>`<link rel="alternate" hreflang="${l}" href="${origin}/${l==='x-default'?'en':l}/${id?id+'/':''}">`).join('')}<meta name="robots" content="index,follow"><meta property="og:locale" content="${ar?'ar_AR':'en_US'}"><meta name="twitter:card" content="summary"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${canonical}"><script type="application/ld+json">${JSON.stringify(schema)}</script>`;
const nav=entries.filter(x=>x[0]!==id).map(x=>`<a href="/${lang}/${x[0]?x[0]+'/':''}">${x[ar?1:2]}</a>`).join(' · ');
const fallback=`<div id="app"><main class="workspace panel"><h1>${title}</h1><p>${description}</p>${isTool?toolArticle(id,lang):id?pageContent(id,lang):''}<p>${ar?'المعالجة محلية؛ فعّل JavaScript لاستخدام الأدوات التفاعلية.':'Processing is local; enable JavaScript for interactive tools.'}</p><nav>${nav}</nav></main></div>`;
return template.replace('lang="ar" dir="rtl"',`lang="${lang}" dir="${ar?'rtl':'ltr'}"`).replace(/<title>.*?<\/title>/,`<title>${title}</title>`).replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escape(description)}">`).replace('</head>',meta+'</head>').replace('<div id="app"></div>',fallback)}
for(const lang of ['ar','en'])for(const entry of entries){const path=`/${lang}/${entry[0]?entry[0]+'/':''}`;routes.push(path);await mkdir('dist'+path,{recursive:true});await writeFile('dist'+path+'index.html',render(entry,lang))}
await writeFile('dist/index.html',render(entries[0],'ar'));
// Real HTML compatibility pages: old links work without host-specific redirects.
const aliases={'pdf-merge':'merge-pdf','pdf-split':'split-pdf','img-to-pdf':'images-pdf','pdf-to-img':'pdf-images','img-compress':'compress-image','img-resize':'resize-image','img-convert':'convert-image','qr-generator':'qr-code','word-counter':'word-counter','text-editor':'text-tools'};
await mkdir('dist/tools',{recursive:true});
for(const [alias,id] of Object.entries(aliases))await writeFile(`dist/tools/${alias}.html`,render(entries.find(e=>e[0]===id),'ar'));

await writeFile('dist/404.html',template.replace('</head>','<meta name="robots" content="noindex"></head>'));
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${routes.map(path=>{const pair=path.startsWith('/ar/')?path.replace('/ar/','/en/'):path.replace('/en/','/ar/');return `<url><loc>${origin}${path}</loc><xhtml:link rel="alternate" hreflang="${path.startsWith('/ar/')?'ar':'en'}" href="${origin}${path}"/><xhtml:link rel="alternate" hreflang="${path.startsWith('/ar/')?'en':'ar'}" href="${origin}${pair}"/></url>`}).join('')}</urlset>`);
async function walk(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())result.push(...await walk(p));else result.push('/'+p.slice(5))}return result}
const files=await walk('dist');const cacheFiles=files.filter(p=>!p.endsWith('_headers')&&!p.endsWith('_redirects')&&!p.endsWith('ads.txt')&&!/^\/google[^/]*\.html$/.test(p));const sw=await readFile('scripts/service-worker.template.js','utf8');await writeFile('dist/sw.js',sw.replace("'__CACHE__'",JSON.stringify('mazen-v3-'+Date.now())).replace('__FILES__',JSON.stringify(cacheFiles)));
await writeFile('dist/build-report.json',JSON.stringify({routes:routes.length,assets:files.length,origin,adsEnabled:config.enabled,analyticsEnabled:measurement.enabled,searchConsoleVerificationConfigured:!!verification,adSenseVerificationConfigured:!!publisher,adsTxtConfigured:!!seller},null,2));
console.log(`Generated ${routes.length} localized pages with original content and offline cache. Ads: ${config.enabled?'gated':'disabled'}.`);
