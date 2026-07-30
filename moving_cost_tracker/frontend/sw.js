/* Moving Cost Tracker service worker.

   Shell and assets only — /api/* is NEVER cached. Your items, budget, rooms and
   IKEA picks live behind that API, and a cached copy of a budget is worse than no
   copy: it would quietly show yesterday's numbers as if they were today's. So
   offline you get the app frame and an honest empty state, not stale money.

   BUMP V whenever an asset changes (style.css, script.js, i18n.js, rooms.js,
   ikea.js, the icons) or installed phones keep serving the old bundle. */
const V = "movingcost-v1";
const PREFIX = "movingcost-";
const SHELL = [
  "/", "/index.html", "/style.css", "/script.js", "/i18n.js", "/rooms.js", "/ikea.js",
  "/manifest.webmanifest", "/icon.svg", "/icon-192.png", "/icon-512.png",
  "/apple-touch-icon.png", "/guide.html",
];

self.addEventListener("install", (e) => {
  // one bad URL must not fail the whole install, so add them individually
  e.waitUntil(
    caches.open(V)
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      // only our own generations — see Guide-Master on the shared-origin trap
      .then((keys) => Promise.all(keys.filter((k) => k !== V && k.startsWith(PREFIX)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;      // never cache the data

  const isDoc = req.mode === "navigate" || req.destination === "document";
  if (isDoc) {
    // network-first so a deploy reaches you immediately when online
    e.respondWith(
      fetch(req)
        .then((res) => { const c = res.clone(); caches.open(V).then((x) => x.put(req, c)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match("/index.html")))
    );
    return;
  }

  // stale-while-revalidate for css/js/icons
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) { const c = res.clone(); caches.open(V).then((x) => x.put(req, c)); }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
