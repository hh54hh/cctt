// خدمة العمل المتقدمة لنظام حسام جم
// Advanced Service Worker for Hussam Gym System

const CACHE_NAME = "hussam-gym-v2";
const DATA_CACHE_NAME = "hussam-gym-data-v1";

// الملفات الأساسية للتخزين المؤقت
const STATIC_CACHE_URLS = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/placeholder.svg",
  // خطوط Google
  "https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Tajawal:wght@300;400;500;700&display=swap",
];

// إعداد التخزين المؤقت عند التثبيت
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Install");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Pre-caching offline page");
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      }),
  );
});

// تنظيف التخزين المؤقت القديم عند التفعيل
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  return self.clients.claim();
});

// استراتيجية التخزين المؤقت للطلبات
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // طلبات API (البيانات)
  if (request.url.includes("/api/") || request.url.includes("supabase.co")) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            // إذا كان الرد صحيح، احفظه في التخزين المؤقت
            if (response.status === 200) {
              cache.put(request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            // إذا فشل الطلب، ارجع البيانات المخزنة
            return cache.match(request);
          });
      }),
    );
    return;
  }

  // طلبات الملفات الثابتة
  if (request.destination === "document") {
    // صفحات HTML - Cache First Strategy
    event.respondWith(
      caches
        .match(request)
        .then((response) => {
          return response || fetch(request);
        })
        .catch(() => {
          // إذا لم توجد في التخزين المؤقت وفشل الطلب، ارجع الصفحة الرئيسية
          return caches.match("/");
        }),
    );
  } else {
    // الملفات الأخرى (CSS, JS, الصور) - Cache First Strategy
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((response) => {
            // إضافة الملفات الجديدة للتخزين المؤقت
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          })
        );
      }),
    );
  }
});

// التزامن في الخلفية
self.addEventListener("sync", (event) => {
  console.log("[ServiceWorker] Background Sync", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

// دالة التزامن في الخلفية
function doBackgroundSync() {
  return new Promise((resolve) => {
    // محاولة مزامنة البيانات المحلية مع الخادم
    console.log("[ServiceWorker] Syncing local data...");

    // هنا يمكن إضافة منطق مزامنة البيانات
    // مثل إرسال المبيعات المحلية إلى Supabase

    resolve();
  });
}

// التعامل مع الإشعارات Push
self.addEventListener("push", (event) => {
  console.log("[ServiceWorker] Push Received");

  const options = {
    body: event.data ? event.data.text() : "إشعار جديد من حسام جم",
    icon: "/placeholder.svg",
    badge: "/placeholder.svg",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "notification-1",
    },
    actions: [
      {
        action: "explore",
        title: "فتح التطبيق",
        icon: "/placeholder.svg",
      },
      {
        action: "close",
        title: "إغلاق",
        icon: "/placeholder.svg",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("حسام جم - كمال الأجسام", options),
  );
});

// التعامل مع نقرات الإشعارات
self.addEventListener("notificationclick", (event) => {
  console.log("[ServiceWorker] Notification click Received");

  event.notification.close();

  if (event.action === "explore") {
    // فتح التطبيق
    event.waitUntil(clients.openWindow("/"));
  } else if (event.action === "close") {
    // إغلاق الإشعار
    event.notification.close();
  } else {
    // النقر على الإشعار نفسه
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      }),
    );
  }
});

// رسائل من التطبيق الرئيسي
self.addEventListener("message", (event) => {
  console.log("[ServiceWorker] Message received", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "SYNC_DATA") {
    // طلب مزامنة البيانات
    event.waitUntil(doBackgroundSync());
  }
});

// دالة لحفظ البيانات محلياً عند عدم وجود اتصال
function saveOfflineData(data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("HussamGymDB", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["offline_queue"], "readwrite");
      const store = transaction.objectStore("offline_queue");

      store.add({
        id: Date.now(),
        data: data,
        timestamp: new Date(),
        synced: false,
      });

      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("offline_queue")) {
        db.createObjectStore("offline_queue", { keyPath: "id" });
      }
    };
  });
}

// دالة لاسترجاع البيانات المحفوظة محلياً
function getOfflineData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("HussamGymDB", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["offline_queue"], "readonly");
      const store = transaction.objectStore("offline_queue");
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
    };
  });
}

console.log("[ServiceWorker] Service Worker Loaded - Hussam Gym v2");
