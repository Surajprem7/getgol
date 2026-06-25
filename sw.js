const CACHE = 'gol-v48';
const FILES = ['/', '/index.html', '/manifest.json', '/js/matches.js', '/js/notifications.js', '/js/live.js', '/js/poster.js', '/js/matchdetail.js', '/js/app.js', '/js/firebase.js', '/js/selfcheck.js', '/js/install.js'];

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

// Tapping a notification focuses an open tab, or opens the app.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const c of clients) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});