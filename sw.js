const CACHE = 'bosla-v55';
const ASSETS = ['./', './index.html', './favicon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './manifest.webmanifest'];
self.addEventListener('install', function(e){
  // addAll is all-or-nothing: one 404 on an icon and the worker never installs, so the app has
  // no offline mode at all. The document is the part that matters; the icons are best-effort.
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.add('./index.html').then(function(){
      return Promise.all(ASSETS.map(function(a){ return c.add(a).catch(function(){}); }));
    });
  }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // let Klook/Booking/Travelpayouts/Airalo hit the network
  // Only the app itself. `mode === 'navigate'` is true for ANY page on this origin, so opening
  // /demo/globe.html was fetched, then written into the cache under './index.html' — and the next
  // offline launch of the app would have served the demo instead. Any other page just goes to the
  // network and is none of our business.
  var isDoc = url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (isDoc) {
    // Network-first for the app itself, so updates always arrive when online.
    // `cache:'no-cache'` matters: a plain fetch() here still goes through the browser's own HTTP
    // cache, and GitHub Pages tells browsers to hold index.html for several minutes. Without this
    // the service worker faithfully re-serves a stale app and every update looks like it never
    // shipped. no-cache still allows a 304, so an unchanged app costs nothing to check.
    e.respondWith(
      fetch(new Request(url.href, { cache: 'no-cache', credentials: 'same-origin' })).then(function(resp){
        // Only a real app goes in the cache. A 404 mid-deploy, a 5xx, a captive portal's login
        // page — caching any of those replaces the working offline copy with a broken one, and
        // it stays broken until the next successful load. A bad answer is worse than none.
        if (resp && resp.ok && resp.type === 'basic') {
          var copy = resp.clone();
          caches.open(CACHE).then(function(c){ c.put('./index.html', copy); });
          return resp;
        }
        return caches.match('./index.html').then(function(c){ return c || resp; });
      }).catch(function(){ return caches.match('./index.html').then(function(c){ return c || caches.match('./'); }); })
    );
    return;
  }
  // Cache-first, but ONLY for the handful of files this worker was told about. It used to be
  // cache-first for anything else on the origin, which meant /demo/globe.html was frozen at
  // whichever version you happened to load first and no amount of refreshing would move it.
  // A service worker should only manage what it knows; everything else is the browser's business.
  var known = ASSETS.some(function(a2){
    var n2 = a2.replace(/^\.\//, '');
    return n2 && url.pathname.endsWith('/' + n2);
  });
  if (!known) return;                                     // hands off — plain network, plain refresh
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(resp){
        if (resp && resp.ok) {
          var copy = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return resp;
      }).catch(function(){ return cached || Response.error(); });
    })
  );
});
