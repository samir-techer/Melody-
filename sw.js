/**
 * Melody PWA - Service Worker
 * Offline-first caching strategy
 * @version 1.0.0
 */

const CACHE_NAME = 'melody-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/reset.css',
  '/css/variables.css',
  '/css/base.css',
  '/css/animations.css',
  '/css/components.css',
  '/css/pages.css',
  '/css/player.css',
  '/css/responsive.css',
  '/js/core/app.js',
  '/js/core/router.js',
  '/js/core/state.js',
  '/js/core/database.js',
  '/js/core/storage.js',
  '/js/services/audio.js',
  '/js/services/metadata.js',
  '/js/services/lyrics.js',
  '/js/services/search.js',
  '/js/services/equalizer.js',
  '/js/services/mediaSession.js',
  '/js/services/import.js',
  '/js/services/coverArt.js',
  '/js/ui/firstLaunch.js',
  '/js/ui/greeting.js',
  '/js/ui/home.js',
  '/js/ui/player.js',
  '/js/ui/miniPlayer.js',
  '/js/ui/library.js',
  '/js/ui/playlist.js',
  '/js/ui/search.js',
  '/js/ui/settings.js',
  '/js/ui/queue.js',
  '/js/ui/favorites.js',
  '/js/ui/equalizer.js',
  '/js/utils/helpers.js',
  '/js/utils/animations.js',
  '/js/utils/filenameCleaner.js',
  '/js/utils/duplicateDetector.js',
  '/js/utils/timeFormatter.js',
  '/js/components/card.js',
  '/js/components/modal.js',
  '/js/components/toast.js',
  '/js/components/slider.js',
  '/js/components/toggle.js',
  '/assets/images/logo.svg',
  '/assets/images/default-cover.svg',
  '/assets/images/vinyl-texture.svg'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Melody SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[Melody SW] Cache failed:', err))
  );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Cache-first for static, network-first for API/data
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Strategy: Cache First for static assets
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.endsWith('.css') || url.pathname.endsWith('.js') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.png')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // Strategy: Network First for dynamic content
  event.respondWith(
    fetch(request)
      .then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, response.clone());
          return response;
        });
      })
      .catch(() => caches.match(request))
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-playlists') {
    event.waitUntil(syncPlaylists());
  }
});

async function syncPlaylists() {
  // Placeholder for background sync logic
  console.log('[Melody SW] Syncing playlists...');
}
