const CACHE_NAME = "hussam-gym-v1";
const OFFLINE_URL = "/offline.html";

// Files to cache for offline use
const CACHE_URLS = [
  "/",
  "/login",
  "/subscribers",
  "/add-subscriber",
  "/courses",
  "/diet",
  "/store",
  "/offline.html",
  "/manifest.json",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log("[SW] Install Event");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching app shell");
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log("[SW] Skip waiting");
        return self.skipWaiting();
      }),
  );
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate Event");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("[SW] Claiming clients");
        return self.clients.claim();
      }),
  );
});

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests differently
  if (
    event.request.url.includes("/rest/v1/") ||
    event.request.url.includes("supabase.co")
  ) {
    // For API requests, try network first, fallback to cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then((response) => {
            if (response) {
              return response;
            }
            // Return offline page for failed API requests
            return caches.match(OFFLINE_URL);
          });
        }),
    );
    return;
  }

  // For navigation requests
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/");
      }),
    );
    return;
  }

  // For all other requests, cache first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return offline page for failed requests
          return caches.match(OFFLINE_URL);
        });
    }),
  );
});

// Background sync event for offline data synchronization
self.addEventListener("sync", (event) => {
  console.log("[SW] Background Sync Event:", event.tag);

  if (event.tag === "sync-offline-data") {
    event.waitUntil(
      // Notify the main app to sync data
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SYNC_REQUEST",
            timestamp: Date.now(),
          });
        });
      }),
    );
  }
});

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[SW] Push Event:", event);

  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body || "إشعار جديد من صالة حسام جم",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      dir: "rtl",
      lang: "ar",
      vibrate: [100, 50, 100],
      data: data.url || "/",
      actions: [
        {
          action: "open",
          title: "فتح التطبيق",
        },
        {
          action: "close",
          title: "إغلاق",
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "صالة حسام جم", options),
    );
  }
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification Click Event:", event);

  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const url = event.notification.data || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clients) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }

      // If not, open a new window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});
