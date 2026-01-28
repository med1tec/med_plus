// sw.js
self.addEventListener('install', (e) => self.skipWaiting());

self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

// استقبال التنبيه من التطبيق وعرضه كإشعار نظام
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const options = {
            body: event.data.body,
            icon: 'https://cdn-icons-png.flaticon.com/512/822/822143.png',
            vibrate: [200, 100, 200],
            tag: 'med-reminder',
            renotify: true,
            actions: [{ action: 'open', title: 'فتح التطبيق' }]
        };
        self.registration.showNotification(event.data.title, options);
    }
});