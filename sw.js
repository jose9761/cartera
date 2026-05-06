const CACHE = 'cartera-jose-v1';
const ASSETS = ['./index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Para requests de API (tiingo, dolarapi) — siempre red, sin cache
  if(e.request.url.includes('api.tiingo.com') || e.request.url.includes('dolarapi.com')){
    e.respondWith(fetch(e.request).catch(() => new Response('{"error":"offline"}', {headers:{'Content-Type':'application/json'}})));
    return;
  }
  // Para el resto: cache first, luego red
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        if(res.ok){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
