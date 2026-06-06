// =========================
// SUPABASE CONFIG (Single Source)
// =========================
const SUPABASE_URL = "https://vfqbpjabzghzjuhmwxtj.supabase.co";
const SUPABASE_KEY = "sb_publishable_QKA_4y0d6eZZo561MQsUnA_kGmCpgkh";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const BASE_LAT = -6.367170;
const BASE_LNG = 106.831740;

// =========================
// SHARED UTILITIES
// =========================
function formatDateTime(timestamp) {
    return new Date(timestamp).toLocaleString("id-ID", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
}

// =========================
// STATE & AUDIO UNTUK MAIN DASHBOARD (Sama seperti di Detail View)
// =========================
let lastAccidentMain = false; // Menyimpan status terakhir kecelakaan untuk kontrol alarm & notifikasi
const alarmAudioMain = new Audio('assets/sirine-alarm.mp3');
alarmAudioMain.loop = true;

function triggerMainBrowserNotification(deviceId) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
        new Notification("🚨 EMERGENCY: ACCIDENT DETECTED ON MAIN!", {
            body: `Pekerja dengan perangkat ${deviceId} terdeteksi mengalami kecelakaan! Segera cek lokasi aktif pekerja.`,
            icon: 'https://cdn-icons-png.flaticon.com/512/595/595067.png',
            requireInteraction: true
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(p => {
            if (p === "granted") triggerMainBrowserNotification(deviceId);
        });
    }
}

function setStatusUI(elementId, text, className) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = `<span class="${className}">${text}</span>`;
}

// =========================
// FLEET DASHBOARD (index.html)
// =========================
if (document.getElementById("map") && !window.location.search.includes("id=")) {
    // Meminta izin notifikasi browser saat pertama kali dashboard utama dibuka
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }

    const map = L.map('map').setView([BASE_LAT, BASE_LNG], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap'
    }).addTo(map);

    // --- DEFINISI ICON URL ---
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

    // Inisialisasi marker awal
    let markers = {
        "HELM-01": L.marker([BASE_LAT, BASE_LNG], { icon: defaultIcon }).addTo(map),
        "HELM-02": L.marker([BASE_LAT + 0.0003, BASE_LNG - 0.0004], { icon: defaultIcon }).addTo(map),
        "HELM-03": L.marker([BASE_LAT - 0.0002, BASE_LNG + 0.0005], { icon: warningIcon }).addTo(map)
    };

    async function fetchFleetData() {
        try {
            const { data, error } = await client
                .from("sensor_realtime")
                .select("*")
                .order("updated_at", { ascending: false })
                .limit(1);

            if (!error && data && data.length > 0) {
                const latestSensor = data[0];

                document.getElementById("h1_id").innerText = latestSensor.device_id || "HELM-01";
                setStatusUI("h1_drowsy", latestSensor.drowsiness_status ? "DROWSY" : "NORMAL", latestSensor.drowsiness_status ? "warning" : "safe");
                setStatusUI("h1_accident", latestSensor.accident_status ? "ACCIDENT" : "SAFE", latestSensor.accident_status ? "danger" : "safe");

                const systemBadge = document.getElementById("h1_system");
                if (systemBadge) {
                    systemBadge.innerText = latestSensor.system_status ? "ACTIVE" : "INACTIVE";
                    systemBadge.className = latestSensor.system_status ? "badge badge-active" : "badge badge-inactive";
                }

                const h1Lat = parseFloat(latestSensor.latitude) || BASE_LAT;
                const h1Lng = parseFloat(latestSensor.longitude) || BASE_LNG;
                markers["HELM-01"].setLatLng([h1Lat, h1Lng]);

                // Parsing status database
                const isAccident = latestSensor.accident_status === true || latestSensor.accident_status === 1 || latestSensor.accident_status === "true";
                const isDrowsy = latestSensor.drowsiness_status === true || latestSensor.drowsiness_status === 1 || latestSensor.drowsiness_status === "true";

                // --- LOGIKA ALARM & NOTIFIKASI SAMA SEPERTI DI DETAIL ---
                if (isAccident && !lastAccidentMain) {
                    alarmAudioMain.play().catch(err => console.log("Audio diblokir browser:", err));
                    if (navigator.vibrate) navigator.vibrate([500, 250, 500, 250, 500]);
                    triggerMainBrowserNotification(latestSensor.device_id || "HELM-01");
                } else if (!isAccident && lastAccidentMain) {
                    alarmAudioMain.pause();
                    alarmAudioMain.currentTime = 0;
                    if (navigator.vibrate) navigator.vibrate(0);
                }
                lastAccidentMain = isAccident;

                // --- LOGIKA UPDATE ICON MARKER ---
                if (isAccident) {
                    markers["HELM-01"].setIcon(dangerIcon);
                } else if (isDrowsy) {
                    markers["HELM-01"].setIcon(warningIcon);
                } else {
                    markers["HELM-01"].setIcon(defaultIcon);
                }

                markers["HELM-01"].bindPopup(`<b>${latestSensor.device_id || "HELM-01"} (Live)</b><br>Status: ${isAccident ? "Accident" : (isDrowsy ? "Drowsy" : "Normal")}`);
            }

            // Simulasi Pergerakan Mikro Realistis Helm 2 & 3
            const h2Lat = BASE_LAT + 0.0003 + (Math.random() - 0.5) * 0.00015;
            const h2Lng = BASE_LNG - 0.0004 + (Math.random() - 0.5) * 0.00015;
            markers["HELM-02"].setLatLng([h2Lat, h2Lng]);
            markers["HELM-02"].bindPopup(`<b>HELM-02 (Dummy Worker)</b><br>Status: Normal`);

            const h3Lat = BASE_LAT - 0.0002 + (Math.random() - 0.5) * 0.00015;
            const h3Lng = BASE_LNG + 0.0005 + (Math.random() - 0.5) * 0.00015;
            markers["HELM-03"].setLatLng([h3Lat, h3Lng]);
            markers["HELM-03"].bindPopup(`<b>HELM-03 (Dummy Worker)</b><br>Status: Drowsy Warning`);

        } catch (err) {
            console.log("Fleet Fetch Error:", err);
        }
    }

    fetchFleetData();
    setInterval(fetchFleetData, 3000);
}