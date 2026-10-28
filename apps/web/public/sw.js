const CACHE_NAME = "finease-cache-v2";
const STATIC_ASSETS = [
  "/",
  "/favicon.svg",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

// Check if running on localhost / loopback
const isLocalhost = Boolean(
  self.location.hostname === "localhost" ||
  self.location.hostname === "[::1]" ||
  self.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/,
  ),
);

// 1. Install Event: Pre-cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching static assets");
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// 2. Activate Event: Cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cache);
            return caches.delete(cache);
          }
        }),
      );
    }),
  );
  event.waitUntil(self.clients.claim());
});

// 3. Fetch Event: Advanced Caching Strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // In local development, bypass caching to avoid blocking fast refreshes and updates
  if (isLocalhost) return;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Strategy for Images/Fonts: Cache-First
  if (
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          const cacheCopy = networkResponse.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, cacheCopy));
          return networkResponse;
        });
      }),
    );
    return;
  }

  // Strategy for JS/CSS: Stale-While-Revalidate
  if (request.destination === "script" || request.destination === "style") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          const cacheCopy = networkResponse.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, cacheCopy));
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      }),
    );
    return;
  }

  // Fallback for navigation: Network-First
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }
});

// 4. Notification System: Push Notification Handling
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || "FinEase Alert";
  const options = {
    body: data.body || "You have an update from FinEase.",
    icon: data.icon || "/icon-192x192.png",
    badge: data.badge || "/favicon.svg",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/dashboard",
    },
    actions: [
      { action: "open", title: "View" },
      { action: "close", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            if (client.url.includes(targetUrl)) {
              return client.focus();
            }
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }),
  );
});
