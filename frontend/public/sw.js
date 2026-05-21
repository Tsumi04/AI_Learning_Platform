/**
 * NeuroVault — Service Worker
 * 
 * Chiến lược caching:
 * - Static assets (JS/CSS/fonts): Cache First — tối ưu tốc độ load
 * - API calls: Network First — luôn lấy data mới nhất, fallback cache khi offline
 * - Navigation: Network First — SPA routing cần HTML mới nhất
 * - Offline fallback: Hiển thị offline page khi không có mạng
 */

const CACHE_NAME = 'neurovault-v1';
const STATIC_CACHE = 'neurovault-static-v1';
const API_CACHE = 'neurovault-api-v1';

// Tài nguyên precache — load sẵn khi install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
];

// ── Install: Precache tài nguyên thiết yếu ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // Kích hoạt ngay, không chờ tab cũ đóng
  );
});

// ── Activate: Dọn dẹp cache cũ ──
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !currentCaches.includes(name))
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim()) // Kiểm soát tất cả tab ngay lập tức
  );
});

// ── Fetch: Routing chiến lược cache theo loại request ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bỏ qua non-GET requests (POST, PUT, DELETE)
  if (request.method !== 'GET') return;

  // Bỏ qua Chrome extensions và các URL không hỗ trợ
  if (!url.protocol.startsWith('http')) return;

  // API calls → Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Static assets → Cache First (JS, CSS, fonts, images)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation (HTML pages) → Network First + offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Mặc định → Network First
  event.respondWith(networkFirst(request, CACHE_NAME));
});

// ═══════════════════════════════════════════════════
// Caching Strategies
// ═══════════════════════════════════════════════════

/**
 * Cache First — Ưu tiên cache, chỉ fetch khi cache miss
 * Phù hợp: static assets hiếm khi thay đổi
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Offline — không có cache lẫn network
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network First — Ưu tiên network, fallback cache khi offline
 * Phù hợp: API calls, data luôn cần mới nhất
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'offline', message: 'You are currently offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Navigation Handler — SPA routing + offline fallback page
 */
async function navigationHandler(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Thử trả về cached index (SPA)
    const cached = await caches.match('/');
    if (cached) return cached;
    // Fallback → offline page
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) return offlinePage;
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Kiểm tra request có phải static asset không
 */
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.woff', '.woff2', '.ttf', '.otf',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
    '.mp4', '.webm',
  ];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// ── Message handler — cho phép frontend trigger cache clear ──
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});
