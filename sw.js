const CACHE = 'gol-v8';
const FILES = ['/', '/index.html', '/manifest.json', '/js/matches.js', '/js/live.js', '/js/app.js', '/js/firebase.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
  // Notify all open tabs to refresh
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage({type: 'UPDATE_AVAILABLE'}));
  });
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Gol!', {
      body: data.body || 'Match starting soon!',
      icon: '/icons/icon-192.png'
    })
  );
});