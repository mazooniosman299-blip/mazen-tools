/* Generated cache identity and immutable asset list are inserted during build. */
const CACHE = '__CACHE__';
const FILES = __FILES__;
const ASSETS = new Set(FILES);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const versions = (await caches.keys()).filter(key => key.startsWith('mazen-'));
    // Keep one previous asset generation for documents still open in other tabs.
    const previous = versions.filter(key => key !== CACHE).slice(-1);
    await Promise.all(versions.filter(key => key !== CACHE && !previous.includes(key)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      // Prefer deployed HTML; never trap a returning user on an obsolete app shell.
      try { const response = await fetch(request); if (response.ok) return response; } catch {}
      const cache = await caches.open(CACHE);
      const pathname = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
      const fallback = await cache.match(pathname, {ignoreVary:true});
      // Static hosts redirect /page/index.html to /page/. A cached redirected
      // response cannot satisfy a navigation whose redirect mode is manual.
      // Reconstruct the same bytes/headers without redirect metadata.
      if (fallback) return new Response(fallback.body, {status:fallback.status,statusText:fallback.statusText,headers:fallback.headers});
      return new Response('Page unavailable offline', {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    })());
    return;
  }
  if (!ASSETS.has(url.pathname) && !url.pathname.startsWith('/assets/')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request, {ignoreVary:true});
    if (cached) return cached;
    // Hash-named files are safe to reuse across releases; HTML is not.
    if (url.pathname.startsWith('/assets/')) {
      const retained = await caches.match(request, {ignoreVary:true});
      if (retained) return retained;
    }
    return fetch(request);
  })());
});
