self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'ALARM_NOW') {
        const options = {
            body: event.data.body,
            icon: 'https://cdn-icons-png.flaticon.com/512/822/822143.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/822/822143.png',
            vibrate: [500, 110, 500, 110, 450],
            tag: 'urgent-pills',
            renotify: true,
            // ميزات الانبثاق للأندرويد والويندوز
            requireInteraction: true, 
            priority: 'high', 
            actions: [
                { action: 'show', title: 'عرض التفاصيل' },
                { action: 'close', title: 'تم التناول ✅' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(event.data.title, options)
        );
    }
});

// التعامل مع الضغط على الإشعار
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientsList => {
            if (clientsList.length > 0) return clientsList[0].focus();
            return clients.openWindow('/');
        })
    );
});