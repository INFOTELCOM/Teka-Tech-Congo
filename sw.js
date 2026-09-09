const CACHE_NAME = 'tekatech-congo-v2';

const APP_SHELL = [
  'index.html',
  'styles.css',
  'script.js',
  'manifest.json',
  'assets/logo.png',
  'assets/favicon-32.png',
  'assets/favicon-192.png',
  'assets/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

function addClientNav(html) {
  if (html.includes('href="espace-client.html"')) return html;
  const marker = '<a href="faq.html">FAQ</a>';
  if (!html.includes(marker)) return html;
  return html.replace(marker, '<a href="espace-client.html">Espace client</a>\n      ' + marker);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Page navigations: network first, fall back to cache (works offline after first visit)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(async (res) => {
          const type = res.headers.get('content-type') || '';
          if (!type.includes('text/html')) return res;

          const html = addClientNav(await res.text());
          const headers = new Headers(res.headers);
          headers.set('content-type', 'text/html; charset=utf-8');
          const transformed = new Response(html, {
            status: res.status,
            statusText: res.statusText,
            headers,
          });
          caches.open(CACHE_NAME).then((cache) => cache.put(req, transformed.clone()));
          return transformed;
        })
        .catch(() => caches.match(req).then((res) => res || caches.match('index.html')))
    );
    return;
  }

  // Same-origin static assets: cache first, then network
  if (new URL(req.url).origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        });
      })
    );
  }
});
