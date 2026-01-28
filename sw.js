self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('message', (event) => {
    if (event.data.type === 'ALARM_NOW') {
        const options = {
            body: event.data.body,
            icon: 'https://cdn-icons-png.flaticon.com/512/822/822143.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/822/822143.png',
            vibrate: [500, 110, 500, 110, 500], // اهتزاز قوي جداً
            tag: 'med-alert', // لمنع تكرار الإشعارات المزعجة
            renotify: true,
            requireInteraction: true, // الإشعار لن يختفي في الويندوز والايفون حتى يضغط عليه المستخدم
            priority: 'high', // للأندرويد لضمان الظهور في الجزء العلوي
            actions: [
                { action: 'open', title: 'فتح التطبيق' },
                { action: 'close', title: 'تم التناول' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(event.data.title, options)
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clis => {
            if (clis.length > 0) return clis[0].focus();
            return clients.openWindow('/');
        })
    );
});