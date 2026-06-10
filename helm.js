// =========================
// UNIFIED HELM DETAIL SCRIPT
// Replaces helm1.js, helm2.js, helm3.js
// Config driven — no logic duplication
// =========================

// Helmet device configs
const HELM_CONFIG = {
    "HELM-01": {
        label: "HELM-01",
        lat: BASE_LAT,
        lng: BASE_LNG,
        isLive: true
    },
    "HELM-02": {
        label: "HELM-02 (DUMMY)",
        lat: BASE_LAT + 0.0003,
        lng: BASE_LNG - 0.0004,
        isLive: false,
        dummyData: {
            eye_status: "open",
            drowsiness_status: false,
            accident_status: false,
            helmet_activity_status: "active",
            system_status: true,
            gyroBase: { x: 0.15, y: 0.10, z: 9.78 }
        }
    },
    "HELM-03": {
        label: "HELM-03",
        lat: BASE_LAT - 0.0002,
        lng: BASE_LNG + 0.0005,
        isLive: false,
        dummyData: {
            eye_status: "closed",
            drowsiness_status: true,
            accident_status: false,
            helmet_activity_status: "active",
            system_status: true,
            gyroBase: { x: 0.25, y: 0.20, z: 9.65 }
        }
    }
};

// =========================
// INIT
// =========================
const urlParams = new URLSearchParams(window.location.search);
const helmId = urlParams.get('id') || "HELM-01";
const config = HELM_CONFIG[helmId] || HELM_CONFIG["HELM-01"];

document.getElementById("detail_title").innerText = `HELMET DASHBOARD - ${config.label}`;

// --- DEFINISI ICON URL RESMI LEAFLET ---
const defaultIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});

const dangerIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});

const warningIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});

const map = L.map('map').setView([config.lat, config.lng], 17);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'OpenStreetMap' }).addTo(map);

// Inisialisasi awal marker detail dengan defaultIcon
let marker = L.marker([config.lat, config.lng], { icon: defaultIcon }).addTo(map);

// =========================
// SHARED STATE & AUDIO
// =========================
let lastDrowsy = false;
let lastAccident = false;
let lastInactive = false;
let lastSystem = true;

const alarmAudio = new Audio('assets/sirine-alarm.mp3');
alarmAudio.loop = true;

// =========================
// SHARED HELPERS
// =========================
function addEventLog(message, severity) {
    const eventLog = document.getElementById("event_log");
    if (!eventLog) return;
    const item = document.createElement("div");
    item.classList.add("event-item");
    if (severity === "warning") item.classList.add("event-warning");
    if (severity === "danger") item.classList.add("event-danger");
    if (severity === "safe") item.classList.add("event-safe");
    const time = new Date().toLocaleTimeString("id-ID");
    item.innerHTML = `<div class="event-time">${time}</div><div class="event-text">${message}</div>`;
    eventLog.prepend(item);
    if (eventLog.children.length > 20) eventLog.removeChild(eventLog.lastChild);
}

function setStatus(elementId, text, className) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = `<span class="${className}">${text}</span>`;
}

function triggerBrowserNotification(deviceId) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
        new Notification("🚨 EMERGENCY: ACCIDENT DETECTED!", {
            body: `Pekerja dengan perangkat ${deviceId} terdeteksi mengalami kecelakaan! Segera cek lokasi aktif pekerja.`,
            icon: 'https://cdn-icons-png.flaticon.com/512/595/595067.png',
            requireInteraction: true
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(p => {
            if (p === "granted") triggerBrowserNotification(deviceId);
        });
    }
}

// =========================
// UNIFIED UI UPDATE
// =========================
function updateUI(sensor) {
    if (!sensor) return;

    // Parsing status database yang aman (mendukung boolean, string, maupun integer)
    const isDrowsy = sensor.drowsiness_status === true || sensor.drowsiness_status === 1 || sensor.drowsiness_status === "true";
    const isAccident = sensor.accident_status === true || sensor.accident_status === 1 || sensor.accident_status === "true";

    // Event detection
    if (isDrowsy && !lastDrowsy) addEventLog("⚠️ Kantuk Terdeteksi", "warning");
    if (!isDrowsy && lastDrowsy) addEventLog("🟢 Pekerja Normal", "safe");
    lastDrowsy = isDrowsy;

    if (isAccident && !lastAccident) {
        addEventLog("🚨 Insiden Terdeteksi", "danger");
        alarmAudio.play().catch(err => console.log("Audio diblokir browser:", err));
        if (navigator.vibrate) navigator.vibrate([500, 250, 500, 250, 500]);
        triggerBrowserNotification(sensor.device_id);
    } else if (!isAccident && lastAccident) {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
        if (navigator.vibrate) navigator.vibrate(0);
    }
    lastAccident = isAccident;

    if (sensor.helmet_activity_status === "inactive" && !lastInactive) addEventLog("🪖 HELMET INACTIVE", "danger");
    lastInactive = sensor.helmet_activity_status === "inactive";

    if (!sensor.system_status && lastSystem) addEventLog("⛔ SYSTEM OFF", "warning");
    if (sensor.system_status && !lastSystem) addEventLog("✅ SYSTEM ON", "safe");
    lastSystem = sensor.system_status;

    // Text UI Update
    document.getElementById("device_id").innerText = sensor.device_id;
    document.getElementById("gyro_x").innerText = sensor.gyro_x;
    document.getElementById("gyro_y").innerText = sensor.gyro_y;
    document.getElementById("gyro_z").innerText = sensor.gyro_z;
    document.getElementById("updated_at").innerText = formatDateTime(sensor.updated_at);

    setStatus("eye_status", sensor.eye_status === "open" ? "OPEN" : "CLOSED", sensor.eye_status === "open" ? "safe" : "warning");
    setStatus("drowsiness_status", isDrowsy ? "Terdeteksi" : "Tidak Terdeteksi", isDrowsy ? "warning" : "safe");
    setStatus("accident_status", isAccident ? "Terdeteksi" : "Tidak Terdeteksi", isAccident ? "danger" : "safe");
    setStatus("helmet_activity_status", sensor.helmet_activity_status === "inactive" ? "INACTIVE" : "ACTIVE", sensor.helmet_activity_status === "inactive" ? "danger" : "safe");

    const toggle = document.getElementById("system_toggle");
    if (toggle) toggle.checked = sensor.system_status;

    // Map update
    const lat = parseFloat(sensor.latitude);
    const lng = parseFloat(sensor.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
        marker.setLatLng([lat, lng]);
        map.setView([lat, lng], 17);

        // --- UPDATE IKON MARKER SECARA DINAMIS (Merah Saat Insiden) ---
        if (isAccident) {
            marker.setIcon(dangerIcon);
        } else if (isDrowsy) {
            marker.setIcon(warningIcon);
        } else {
            marker.setIcon(defaultIcon);
        }

        marker.bindPopup(`<b>${helmId} (Live)</b><br>Last Update:<br>${formatDateTime(sensor.updated_at)}`);
    }
}

// =========================
// LIVE MODE (HELM-01)
// =========================
if (config.isLive) {
    async function fetchInitialData() {
        try {
            const { data, error } = await client
                .from("sensor_realtime")
                .select("*")
                .order("updated_at", { ascending: false })
                .limit(1);
            if (error || !data || data.length === 0) return;
            updateUI(data[0]);
        } catch (err) { console.log("Fetch Error Detail:", err); }
    }

    // Alur Realtime Stream dari Supabase Changes (Instant update)
    client
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sensor_realtime' }, (payload) => {
            if (payload.new && payload.new.device_id === "HELM-01") {
                updateUI(payload.new);
            }
        })
        .subscribe();

    document.getElementById("system_toggle").addEventListener("change", async function () {
        try {
            const status = this.checked;
            const { data } = await client.from("sensor_realtime").select("*").order("updated_at", { ascending: false }).limit(1);
            if (data && data.length > 0) {
                await client.from("sensor_realtime").update({ system_status: status }).eq("id", data[0].id);
            }
        } catch (err) { console.log(err); }
    });

    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }

    // Menjalankan inisialisasi awal data saat halaman dimuat
    fetchInitialData();

    // Polling interval 3 detik sebagai cadangan (sama seperti perlakuan di main dashboard)
    setInterval(fetchInitialData, 3000);

// =========================
// DUMMY MODE (HELM-02 & HELM-03)
// =========================
} else {
    const dummy = config.dummyData;

    document.getElementById("system_toggle").addEventListener("change", function () {
        alert("Control lock: Cannot toggle dummy systems.");
        this.checked = true;
    });

    function fetchDummyData() {
        const g = dummy.gyroBase;
        const sensor = {
            device_id: helmId,
            gyro_x: (Math.random() * g.x * 2 - g.x).toFixed(2),
            gyro_y: (Math.random() * g.y * 2 - g.y).toFixed(2),
            gyro_z: (g.z + Math.random() * 0.15).toFixed(2),
            updated_at: new Date().toISOString(),
            eye_status: dummy.eye_status,
            drowsiness_status: dummy.drowsiness_status,
            accident_status: dummy.accident_status,
            helmet_activity_status: dummy.helmet_activity_status,
            system_status: dummy.system_status,
            latitude: config.lat + (Math.random() - 0.5) * 0.00005,
            longitude: config.lng + (Math.random() - 0.5) * 0.00005
        };

        updateUI(sensor);

        // Dummy map: pergerakan mikro stabil tanpa reset posisi kamera map
        marker.setLatLng([sensor.latitude, sensor.longitude]);
        
        if (dummy.accident_status) {
            marker.setIcon(dangerIcon);
        } else if (dummy.drowsiness_status) {
            marker.setIcon(warningIcon);
        } else {
            marker.setIcon(defaultIcon);
        }

        marker.bindPopup(`<b>${helmId} (Dummy Worker)</b><br>Status: ${dummy.drowsiness_status ? "Kantuk Terdeteksi" : "Normal & Aman"}`);
    }

    fetchDummyData();
    setInterval(fetchDummyData, 3000);
}