import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// إعداداتك الخاصة (Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyDYV2c9_PAcla_7btxKA7L7nHWmroD94zQ",
    authDomain: "myalarmapp-26e3e.firebaseapp.com",
    databaseURL: "https://myalarmapp-26e3e-default-rtdb.firebaseio.com",
    projectId: "myalarmapp-26e3e",
    storageBucket: "myalarmapp-26e3e.firebasestorage.app",
    messagingSenderId: "790274373412",
    appId: "1:790274373412:web:272afc4b52e09b396ce5b1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const userId = "master_user";
const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');

// تسجيل الـ Service Worker لتمكين إشعارات الخلفية
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

// تفعيل الصوت والإذن عند أول ضغطة
document.body.addEventListener('click', () => {
    if (Notification.permission !== "granted") Notification.requestPermission();
    sound.play().then(() => { sound.pause(); sound.currentTime = 0; });
}, { once: true });

// حفظ الدواء في Firebase
document.getElementById('saveBtn').onclick = () => {
    const name = document.getElementById('medName').value;
    const time = document.getElementById('medTime').value;
    if (name && time) {
        const newRef = push(ref(db, `users/${userId}/meds`));
        set(newRef, { name, time, lastNotifiedDate: "" });
        document.getElementById('medName').value = "";
    }
};

// الفحص اليومي الذكي
setInterval(() => {
    const now = new Date();
    const today = now.toDateString(); // تاريخ اليوم
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

    onValue(ref(db, `users/${userId}/meds`), (snapshot) => {
        const meds = snapshot.val();
        for (let id in meds) {
            // إذا تطابق الوقت ولم يتم إرسال إشعار "اليوم"
            if (meds[id].time === currentTime && meds[id].lastNotifiedDate !== today) {
                sendMedNotification(id, meds[id].name, today);
            }
        }
    }, { onlyOnce: true });
}, 1000);

function sendMedNotification(id, name, date) {
    sound.play();
    
    // إشعار نظام (حتى لو التطبيق مغلق)
    if (Notification.permission === "granted") {
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification('تذكير الدواء اليومي 💊', {
                body: `حان موعد تناول جرعة: ${name}`,
                icon: 'https://cdn-icons-png.flaticon.com/512/822/822143.png',
                vibrate: [200, 100, 200]
            });
        });
    }

    // إظهار الواجهة
    document.getElementById('alertOverlay').classList.remove('hidden');
    document.getElementById('alertMedName').innerText = name;

    // تحديث قاعدة البيانات: تم الإرسال اليوم
    set(ref(db, `users/${userId}/meds/${id}/lastNotifiedDate`), date);

    document.getElementById('doneBtn').onclick = () => {
        document.getElementById('alertOverlay').classList.add('hidden');
        sound.pause();
    };
}

// عرض القائمة
onValue(ref(db, `users/${userId}/meds`), (snapshot) => {
    const listDiv = document.getElementById('medList');
    listDiv.innerHTML = "";
    const data = snapshot.val();
    for (let id in data) {
        const item = document.createElement('div');
        item.className = "med-item";
        item.innerHTML = `<div><b>${data[id].name}</b><br><small>${data[id].time}</small></div>`;
        const delBtn = document.createElement('button');
        delBtn.innerText = "❌"; delBtn.style="background:none; border:none; cursor:pointer;";
        delBtn.onclick = () => remove(ref(db, `users/${userId}/meds/${id}`));
        item.appendChild(delBtn);
        listDiv.appendChild(item);
    }
});