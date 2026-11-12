// Service worker do GPObras. Deixa o canteiro abrir sem sinal:
// - /_next/static/* (JS/CSS com hash no nome): cache primeiro.
// - /canteiro* (páginas e payloads RSC): rede primeiro, cache como reserva.
// O resto (API, login, demais telas) segue direto para a rede.
const CACHE = "gpobras-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  )
);

async function guardar(request, response) {
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(caches.match(request).then((c) => c || fetch(request).then((r) => guardar(request, r))));
  } else if (url.pathname === "/canteiro" || url.pathname.startsWith("/canteiro/")) {
    event.respondWith(
      fetch(request)
        .then((r) => guardar(request, r))
        .catch(() => caches.match(request).then((c) => c || Response.error()))
    );
  }
});
