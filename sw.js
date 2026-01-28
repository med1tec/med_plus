// الانتظار حتى يتم تثبيت الخدمة وتفعيلها فوراً
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

// استقبال إشارة "التنبيه" من التطبيق (حتى في الخلفية)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'ALARM_NOW') {
        const options = {
            body: event.data.body,
            icon: 'https://cdn-icons-png.flaticon.com/512/822/822143.png',
            vibrate: [500, 200, 500],
            tag: 'med-alert-' + Date.now(), // وسام فريد لكل إشعار لضمان الانبثاق
            renotify: true,
            requireInteraction: true, // يبقى الإشعار حتى يتفاعل معه المستخدم
            priority: 'high',         // ضروري للأندرويد
            actions: [
                { action: 'open', title: 'فتح التطبيق' },
                { action: 'done', title: 'تم التناول ✅' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(event.data.title, options)
        );
    }
});

// فتح التطبيق عند الضغط على الإشعار
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            if (windowClients.length > 0) return windowClients[0].focus();
            return clients.openWindow('/');
        })
    );
});