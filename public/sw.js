// Service worker mínimo para que la app sea instalable como PWA.
// Estrategia conservadora para no servir datos privados cacheados:
//  - Navegaciones y peticiones a la API: SIEMPRE red (network-first sin caché).
//  - Estáticos propios (iconos, manifest): cache-first.
const STATIC_CACHE = "poker-static-v1";
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Estáticos propios -> cache-first
  if (url.origin === self.location.origin && url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request)),
    );
    return;
  }

  // Resto -> network-first (no cacheamos datos privados ni HTML autenticado)
  // Nada más: dejamos pasar a la red por defecto.
});
