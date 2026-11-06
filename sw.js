const C="mm-v10";const F=["./","index.html","content.js","app.js","ai.js","game.js","panel.js","manifest.webmanifest","icon-180.png","icon-512.png","fotima/1.jpg","fotima/2.jpg","fotima/3.jpg","fotima/4.jpg","fotima/5.jpg","fotima/6.jpg","fotima/7.jpg","fotima/8.jpg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
