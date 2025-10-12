// Battlefield Medical Assistant - Service Worker
const CACHE_NAME = 'battlefield-medical-v1.0.0';
const OFFLINE_CACHE = 'battlefield-medical-offline-v1';

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Dynamic API routes to cache
const API_CACHE_ROUTES = [
  '/api/status',
  '/api/emergency-status',
  '/api/diagnose/analyze',
  '/api/injury/detect'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('🛠️ Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker installed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log(`🧹 Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement offline-first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests (Network First, then Cache)
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses for offline use
      const cache = await caches.open(OFFLINE_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('🌐 Network failed, trying cache for:', request.url);
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('💾 Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // No cache available, return offline fallback for critical APIs
    if (isCriticalApi(request.url)) {
      return createOfflineResponse(request);
    }
    
    // For non-critical APIs, return error
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      offline: true,
      message: 'Please check your connection'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle static assets (Cache First, then Network)
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If both cache and network fail, return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || createOfflineFallback();
    }
    
    throw error;
  }
}

// Check if API is critical for offline functionality
function isCriticalApi(url) {
  const criticalApis = [
    '/api/diagnose/analyze',
    '/api/injury/detect',
    '/api/records/save'
  ];
  
  return criticalApis.some(api => url.includes(api));
}

// Create offline response for critical APIs
function createOfflineResponse(request) {
  const offlineData = {
    success: true,
    data: {
      message: 'Offline mode active - using local analysis',
      offline: true,
      timestamp: new Date().toISOString(),
      system: 'Battlefield Medical AI (Offline)'
    },
    offlineFallback: true
  };
  
  return new Response(JSON.stringify(offlineData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Create offline fallback page
function createOfflineFallback() {
  const offlineHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Battlefield Medical - Offline</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #1a202c;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          text-align: center;
        }
        .container {
          padding: 2rem;
        }
        h1 {
          color: #e53e3e;
          margin-bottom: 1rem;
        }
        p {
          margin-bottom: 1rem;
          opacity: 0.8;
        }
        .icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🛡️</div>
        <h1>Offline Mode Active</h1>
        <p>Battlefield Medical Assistant is operating in offline mode.</p>
        <p>Basic medical assessment and record storage are available.</p>
        <p>Full functionality will resume when connection is restored.</p>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHtml, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

// Background sync implementation
async function doBackgroundSync() {
  try {
    // Get all pending sync items from IndexedDB
    const pendingItems = await getPendingSyncItems();
    
    if (pendingItems.length === 0) {
      console.log('✅ No pending items to sync');
      return;
    }
    
    console.log(`🔄 Syncing ${pendingItems.length} pending items`);
    
    for (const item of pendingItems) {
      try {
        await syncItem(item);
        await markItemAsSynced(item.id);
      } catch (error) {
        console.error(`❌ Failed to sync item ${item.id}:`, error);
        await markItemAsFailed(item.id, error.message);
      }
    }
    
    console.log('✅ Background sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Helper functions for background sync
async function getPendingSyncItems() {
  // This would interact with the frontend's IndexedDB
  // For now, return empty array - actual implementation would use postMessage
  return [];
}

async function syncItem(item) {
  // Simulate API call
  const response = await fetch('/api/records/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ records: [item] })
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed with status: ${response.status}`);
  }
  
  return response.json();
}

async function markItemAsSynced(itemId) {
  // Mark item as synced in IndexedDB
  console.log(`✅ Marked item ${itemId} as synced`);
}

async function markItemAsFailed(itemId, error) {
  // Mark item as failed in IndexedDB
  console.log(`❌ Marked item ${itemId} as failed: ${error}`);
}

// Push notifications for emergency alerts
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.message || 'Emergency medical alert',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.url || '/',
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/view-24x24.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-24x24.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Battlefield Medical Alert', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});

// Periodic sync for background updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-update') {
    console.log('🔄 Periodic content update sync');
    event.waitUntil(updateCachedContent());
  }
});

// Update cached content periodically
async function updateCachedContent() {
  const cache = await caches.open(CACHE_NAME);
  const requests = STATIC_ASSETS.map(url => new Request(url));
  
  const responses = await Promise.all(
    requests.map(request => fetch(request).catch(() => null))
  );
  
  const updates = responses.filter(Boolean);
  
  await Promise.all(
    updates.map((response, index) => {
      if (response && response.ok) {
        return cache.put(requests[index], response);
      }
    })
  );
  
  console.log(`✅ Updated ${updates.length} cached assets`);
}