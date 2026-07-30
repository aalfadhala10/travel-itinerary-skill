const CACHE = 'bosla-v4';
const ASSETS = ['./', './index.html', './favicon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './manifest.webmanifest'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // let Klook/Booking/Travelpayouts/Airalo hit the network
  var isDoc = e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (isDoc) {
    // Network-first for the app itself, so updates always arrive when online.
    // `cache:'no-cache'` matters: a plain fetch() here still goes through the browser's own HTTP
    // cache, and GitHub Pages tells browsers to hold index.html for several minutes. Without this
    // the service worker faithfully re-serves a stale app and every update looks like it never
    // shipped. no-cache still allows a 304, so an unchanged app costs nothing to check.
    e.respondWith(
      fetch(new Request(url.href, { cache: 'no-cache', credentials: 'same-origin' })).then(function(resp){
        var copy = resp.clone();
        caches.open(CACHE).then(function(c){ c.put('./index.html', copy); });
        return resp;
      }).catch(function(){ return caches.match('./index.html').then(function(c){ return c || caches.match('./'); }); })
    );
    return;
  }
  // Cache-first for static assets (icons, manifest)
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(resp){
        var copy = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return resp;
      }).catch(function(){ return cached; });
    })
  );
});
