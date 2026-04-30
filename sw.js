/**
 * Service Worker — 贪吃蛇离线支持
 * 缓存策略：Cache First（所有资源优先读缓存）
 */
const CACHE_NAME = 'snake-game-v1';
const ASSETS = [
    './',
    './index.html',
    './styles/style.css',
    './src/core/utils.js',
    './src/core/food.js',
    './src/core/snake.js',
    './src/engine/game.js',
    './manifest.json'
];

// 安装：缓存所有静态资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// 请求拦截：Cache First
self.addEventListener('fetch', (event) => {
    // 仅处理同源请求
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                // 仅缓存有效响应
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, clone);
                });
                return response;
            });
        })
    );
});
