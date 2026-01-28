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

// --- 1. نظام الخصوصية والدخول ---
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

// --- 2. تشغيل النظام ومزامنة البيانات ---
function startSystem() {
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

    // مراقبة الوقت في الخلفية
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
// --- 3. وظيفة التنبيه (المطورة لتعمل في الخلفية والمنبثق العلوي) ---
function triggerAlarm(name) {
    // تشغيل الصوت في الواجهة
    alarmSound.play().catch(() => console.log("الصوت بانتظار تفاعل"));
    
    // إرسال رسالة للـ Service Worker (هذا ما يضمن ظهور الإشعار والموقع مغلق)
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'ALARM_NOW',
            title: `💊 موعد جرعة: ${name}`,
            body: 'حان موعد دواءك الآن، فضلاً قم بتناوله.'
        });
    }

    // إظهار الواجهة الداخلية (Overlay)
    document.getElementById('activeMedName').innerText = name;
    document.getElementById('alarmOverlay').classList.remove('hidden');
}

// --- 4. أزرار التحكم ---
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

// --- تسجيل الـ Service Worker المطور (للبقاء حياً في الخلفية) ---
if ('serviceWorker' in navigator) {
    // التحديث عبر الكاش: 'none' لضمان تحميل الكود الجديد دائماً
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
    .then(reg => {
        console.log("Service Worker جاهز ومسجل بنجاح");
        
        // سر الويندوز والأندرويد: فحص التحديثات كل ساعة لضمان بقاء الخدمة نشطة
        setInterval(() => {
            reg.update();
            console.log("تم تحديث خدمة الخلفية لضمان الاستمرارية");
        }, 1000 * 60 * 60);
    });

    // طلب إذن الإشعارات عند أول لمسة للشاشة
    document.body.addEventListener('click', () => {
        if (Notification.permission !== "granted") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") console.log("تم السماح بالإشعارات");
            });
        }
    }, {once: true});
}