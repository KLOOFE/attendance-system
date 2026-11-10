/* Service worker بسيط: الشبكة أولًا (حتى تظهر التعديلات فورًا)، والكاش عند انقطاع الإنترنت */
const CACHE = "attendance-v2";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", e => {
    const req = e.request;
    const url = new URL(req.url);
    if (req.method !== "GET" || url.origin !== location.origin) return;   /* فاير بيز والمكتبات تمر مباشرة */

    e.respondWith(
        fetch(req)
            .then(res => {
                const copy = res.clone();
                caches.open(CACHE).then(c => c.put(req, copy));
                return res;
            })
            .catch(() => caches.match(req))
    );
});