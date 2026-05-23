// =========================
// SUPABASE CONFIG
// =========================
const SUPABASE_URL = "https://vfqbpjabzghzjuhmwxtj.supabase.co";
const SUPABASE_KEY = "sb_publishable_QKA_4y0d6eZZo561MQsUnA_kGmCpgkh";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =========================
// LEAFLET MAP
// =========================
// Inisialisasi peta awal
const map = L.map('map').setView([-6.200000, 106.816000], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'OpenStreetMap'
}).addTo(map);

// Membuat satu single marker untuk melacak posisi paling terakhir saja
let marker = L.marker([-6.200000, 106.816000]).addTo(map);

// =========================
// EVENT MEMORY
// =========================
let lastDrowsy = false;
let lastAccident = false;
let lastInactive = false;
let lastSystem = true;

// =========================
// FORMAT DATETIME
// =========================
function formatDateTime(timestamp){
    const date = new Date(timestamp);
    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

// =========================
// EVENT LOG FUNCTION
// =========================
function addEventLog(message, severity){
    const eventLog = document.getElementById("event_log");
    if(!eventLog) return;

    const eventItem = document.createElement("div");
    eventItem.classList.add("event-item");

    if(severity === "warning") eventItem.classList.add("event-warning");
    if(severity === "danger") eventItem.classList.add("event-danger");
    if(severity === "safe") eventItem.classList.add("event-safe");

    const time = new Date().toLocaleTimeString("id-ID");

    eventItem.innerHTML = `
        <div class="event-time">${time}</div>
        <div class="event-text">${message}</div>
    `;

    eventLog.prepend(eventItem);

    // Maksimal 20 log yang tampil di container realtime log
    if(eventLog.children.length > 20){
        eventLog.removeChild(eventLog.lastChild);
    }
}

// =========================
// STATUS UI
// =========================
function setStatus(elementId, text, className){
    const el = document.getElementById(elementId);
    if(!el) return;

    el.innerHTML = `<span class="${className}">${text}</span>`;
}

// =========================
// FETCH DATA
// =========================
async function fetchData(){
    try {
        // Mengambil data sensor terbaru dari Supabase
        const { data, error } = await client
            .from("sensor_realtime")
            .select("*")
            .order("updated_at", { ascending: false })
            .limit(10);

        if(error){
            console.log("Supabase Error:", error);
            return;
        }

        if(!data || data.length === 0){
            console.log("No data found");
            return;
        }

        // Ambil baris indeks ke-0 (Data Paling Baru)
        const latestSensor = data[0];

        // =====================
        // EVENT DETECTION
        // =====================
        // MENGANTUK (DROWSINESS)
        if(latestSensor.drowsiness_status && !lastDrowsy){
            addEventLog("⚠️ DROWSINESS DETECTED", "warning");
        }
        if(!latestSensor.drowsiness_status && lastDrowsy){
            addEventLog("🟢 WORKER NORMAL", "safe");
        }
        lastDrowsy = latestSensor.drowsiness_status;

        // JATUH (ACCIDENT)
        if(latestSensor.accident_status && !lastAccident){
            addEventLog("🚨 ACCIDENT DETECTED", "danger");
        }
        lastAccident = latestSensor.accident_status;

        // STATUS HELM
        if(latestSensor.helmet_activity_status === "inactive" && !lastInactive){
            addEventLog("🪖 HELMET INACTIVE", "danger");
        }
        lastInactive = latestSensor.helmet_activity_status === "inactive";

        // STATUS SISTEM
        if(!latestSensor.system_status && lastSystem){
            addEventLog("⛔ SYSTEM OFF", "warning");
        }
        if(latestSensor.system_status && !lastSystem){
            addEventLog("✅ SYSTEM ON", "safe");
        }
        lastSystem = latestSensor.system_status;

        // =====================
        // UPDATE UI TEXT CARD
        // =====================
        document.getElementById("device_id").innerText = latestSensor.device_id;
        document.getElementById("gyro_x").innerText = latestSensor.gyro_x;
        document.getElementById("gyro_y").innerText = latestSensor.gyro_y;
        document.getElementById("gyro_z").innerText = latestSensor.gyro_z;
        document.getElementById("updated_at").innerText = formatDateTime(latestSensor.updated_at);

        // =====================
        // STATUS UI COLOR
        // =====================
        setStatus(
            "eye_status",
            latestSensor.eye_status === "open" ? "OPEN" : "CLOSED",
            latestSensor.eye_status === "open" ? "safe" : "warning"
        );

        setStatus(
            "drowsiness_status",
            latestSensor.drowsiness_status ? "DROWSY" : "NORMAL",
            latestSensor.drowsiness_status ? "warning" : "safe"
        );

        setStatus(
            "accident_status",
            latestSensor.accident_status ? "ACCIDENT" : "SAFE",
            latestSensor.accident_status ? "danger" : "safe"
        );

        setStatus(
            "helmet_activity_status",
            latestSensor.helmet_activity_status === "inactive" ? "INACTIVE" : "ACTIVE",
            latestSensor.helmet_activity_status === "inactive" ? "danger" : "safe"
        );

        // =====================
        // SYSTEM TOGGLE STATE
        // =====================
        const toggle = document.getElementById("system_toggle");
        if(toggle){
            toggle.checked = latestSensor.system_status;
        }

        // ==========================================
        // MAP UPDATE (HANYA MENAMPILKAN POSISI TERAKHIR)
        // ==========================================
        const latestLat = parseFloat(latestSensor.latitude);
        const latestLng = parseFloat(latestSensor.longitude);

        if(!isNaN(latestLat) && !isNaN(latestLng)){
            // Geser posisi penanda (marker) yang sudah ada ke koordinat paling baru
            marker.setLatLng([latestLat, latestLng]);

            // Fokuskan kamera map ke titik koordinat baru secara berkala dengan zoom level 17
            map.setView([latestLat, latestLng], 17);

            // Perbarui balon info (popup) di atas marker penanda tersebut
            marker.bindPopup(`
                <b>${latestSensor.device_id}</b>
                <br><br>
                <b>STATUS:</b> CURRENT POSITION<br>
                <b>Last Update:</b><br>${formatDateTime(latestSensor.updated_at)}
            `);
        }

    } catch(err) {
        console.log("Fetch Error:", err);
    }
}

// =========================
// SYSTEM TOGGLE INTERACTION
// =========================
const toggleButton = document.getElementById("system_toggle");

if(toggleButton){
    toggleButton.addEventListener("change", async function(){
        try {
            const status = this.checked;
            const { data } = await client
                .from("sensor_realtime")
                .select("*")
                .order("updated_at", { ascending: false })
                .limit(1);

            if(!data || data.length === 0) return;

            const latest = data[0];

            await client
                .from("sensor_realtime")
                .update({ system_status: status })
                .eq("id", latest.id);

        } catch(err) {
            console.log(err);
        }
    });
}

// =========================
// RUN DASHBOARD
// =========================
fetchData();

// Interval update realtime dashboard setiap 3 detik
setInterval(fetchData, 3000);