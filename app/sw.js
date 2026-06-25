/* ===========================================================
   Service Worker — TH · Sổ Tài Chính
   Cache app shell để chạy offline & cài như app (PWA).
   Đổi CACHE_VERSION mỗi khi sửa code để buộc cập nhật.
   =========================================================== */
const CACHE_VERSION = 'th-sotaichinh-v1';

// Tài nguyên cùng nguồn — nạp sẵn khi cài đặt.
const CORE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon.svg'
];

// Cài đặt: nạp sẵn app shell.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Kích hoạt: xóa cache phiên bản cũ.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Lấy tài nguyên:
//  - Điều hướng trang: network-first, lỗi mạng thì trả index.html từ cache.
//  - Tài nguyên khác (kể cả CDN chart.js, Google Fonts): cache-first,
//    đồng thời lưu lại bản tải mới để dùng offline lần sau.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Lưu lại bản sao (bỏ qua nếu phản hồi lỗi để tránh cache rác).
        if (response && (response.ok || response.type === 'opaque')) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
