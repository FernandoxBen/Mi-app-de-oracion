var CACHE = "horas-v6-mobile-2.1.0";
var ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./mobile.css",
  "./icons/icon.svg",
  "./app.js",
  "./data.js",
  "./manifest.json",
  "./fonts/Cardo-Regular.woff2",
  "./fonts/Cardo-Bold.woff2",
  "./fonts/Cardo-Italic.woff2",
  "./fonts/PlexSans-Regular.woff2",
  "./fonts/PlexSans-Medium.woff2",
  "./fonts/PlexSans-SemiBold.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache){ return cache.addAll(ASSETS); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k.indexOf("horas-v") === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  if(e.request.mode === "navigate"){
    e.respondWith(fetch(e.request).then(function(resp){
      var copy = resp.clone();
      caches.open(CACHE).then(function(cache){ cache.put("./index.html", copy); });
      return resp;
    }).catch(function(){ return caches.match("./index.html"); }));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      var network = fetch(e.request).then(function(resp){
        if(resp && resp.status === 200 && resp.type === "basic"){
          var copy = resp.clone();
          caches.open(CACHE).then(function(cache){ cache.put(e.request, copy); });
        }
        return resp;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
