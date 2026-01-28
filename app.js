import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
const alarmSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
let userId = localStorage.getItem('med_user_id');
let lastTriggered = "";

// 1. تسلسل الدخول
if (userId) {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('userBadge').innerText = "ID: " + userId;
    startSystem();
}

document.getElementById('authBtn').onclick = () => {
    const key = document.getElementById('loginKey').value.trim();
    if (key) {
        localStorage.setItem('med_user_id', key);
        location.reload();
    }
};

// 2. تشغيل النظام الواقعي
function startSystem() {
    // جلب البيانات من المسار الخاص بالمستخدم
    onValue(ref(db, `alarms/${userId}`), (snap) => {
        const list = document.getElementById('medList');
        list.innerHTML = "";
        const data = snap.val();
        if (data) {
            for (let id in data) {
                const item = document.createElement('div');
                item.className = "med-item";
                item.innerHTML = `<div><strong>${data[id].name}</strong><br><small>${data[id].time}</small></div>`;
                const delBtn = document.createElement('button');
                delBtn.innerHTML = '<i class="fas fa-trash"></i>';
                delBtn.style = "background:none; border:none; color:#ff4b2b; cursor:pointer;";
                delBtn.onclick = () => remove(ref(db, `alarms/${userId}/${id}`));
                item.appendChild(delBtn);
                list.appendChild(item);
            }
        }
    });

    // فحص المواعيد
    setInterval(() => {
        const now = new Date();
        const curTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        if (now.getSeconds() === 0 && lastTriggered !== curTime) {
            onValue(ref(db, `alarms/${userId}`), (snap) => {
                const data = snap.val();
                for (let id in data) {
                    if (data[id].time === curTime) {
                        lastTriggered = curTime;
                        triggerAlarm(data[id].name);
                    }
                }
            }, { onlyOnce: true });
        }
    }, 1000);
}

// 3. وظيفة التنبيه (صوت + إشعار + واجهة)
function triggerAlarm(name) {
    alarmSound.play().catch(() => {});
    
    if (Notification.permission === "granted") {
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(`🚨 موعد جرعة: ${name}`, {
                body: "حان موعد دواءك الآن، فضلاً قم بتناوله.",
                icon: "https://cdn-icons-png.flaticon.com/512/822/822143.png",
                vibrate: [200, 100, 200],
                tag: 'med-alert'
            });
        });
    }

    document.getElementById('activeMedName').innerText = name;
    document.getElementById('alarmOverlay').classList.remove('hidden');
}

// 4. تفعيل أزرار الإضافة والخروج
document.getElementById('addBtn').onclick = () => {
    const name = document.getElementById('medName').value.trim();
    const time = document.getElementById('medTime').value;
    if (name && time) {
        push(ref(db, `alarms/${userId}`), { name, time });
        document.getElementById('medName').value = "";
    }
};

document.getElementById('stopSoundBtn').onclick = () => {
    document.getElementById('alarmOverlay').classList.add('hidden');
    alarmSound.pause();
    alarmSound.currentTime = 0;
};

document.getElementById('logoutBtn').onclick = () => {
    localStorage.clear();
    location.reload();
};

// تسجيل الـ Service Worker وطلب الإذن عند أول لمسة
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
    document.body.addEventListener('click', () => Notification.requestPermission(), {once: true});
}