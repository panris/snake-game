/**
 * Service Worker — 贪吃蛇离线支持
 * 缓存策略：Network First（在线优先拿最新代码，离线回退缓存）
 */
const CACHE_NAME = 'snake-game-v5';
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

// 请求拦截：Network First
self.addEventListener('fetch', (event) => {
    // 仅处理同源请求
    if (!event.request.url.startsWith(self.location.origin)) return;
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request).then(response => {
            // 仅缓存有效响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
            }
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, clone);
            });
            return response;
        }).catch(() => {
            return caches.match(event.request).then(cached => {
                if (cached) return cached;
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return Response.error();
            });
        })
    );
});
