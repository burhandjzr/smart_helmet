// ==========================================
// CONFIG & INITIALIZATION HELM 1 (LIVE)
// ==========================================
const SUPABASE_URL = "https://vfqbpjabzghzjuhmwxtj.supabase.co";
const SUPABASE_KEY = "sb_publishable_QKA_4y0d6eZZo561MQsUnA_kGmCpgkh";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.getElementById("detail_title").innerText = "HELMET DASHBOARD - HELM-01";

const BASE_LAT = -6.367170;
const BASE_LNG = 106.831740;

const map = L.map('map').setView([BASE_LAT, BASE_LNG], 17);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'OpenStreetMap' }).addTo(map);
let marker = L.marker([BASE_LAT, BASE_LNG]).addTo(map);

let lastDrowsy = false;
let lastAccident = false;
let lastInactive = false;
let lastSystem = true;

function formatDateTime(timestamp){
    const date = new Date(timestamp);
    return date.toLocaleString("id-ID", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
}

function addEventLog(message, severity){
    const eventLog = document.getElementById("event_log");
    if(!eventLog) return;
    const eventItem = document.createElement("div");
    eventItem.classList.add("event-item");
    if(severity === "warning") eventItem.classList.add("event-warning");
    if(severity === "danger") eventItem.classList.add("event-danger");
    if(severity === "safe") eventItem.classList.add("event-safe");

    const time = new Date().toLocaleTimeString("id-ID");
    eventItem.innerHTML = `<div class="event-time">${time}</div><div class="event-text">${message}</div>`;
    eventLog.prepend(eventItem);
    if(eventLog.children.length > 20) eventLog.removeChild(eventLog.lastChild);
}

function setStatus(elementId, text, className){
    const el = document.getElementById(elementId);
    if(el) el.innerHTML = `<span class="${className}">${text}</span>`;
}

async function fetchDataHelm1(){
    try {
        const { data, error } = await client
            .from("sensor_realtime")
            .select("*")
            .order("updated_at", { ascending: false })
            .limit(1);

        if(error || !data || data.length === 0) return;
        const sensor = data[0];

        // EVENT DETECTION LOGIC
        if(sensor.drowsiness_status && !lastDrowsy) addEventLog("⚠️ DROWSINESS DETECTED", "warning");
        if(!sensor.drowsiness_status && lastDrowsy) addEventLog("🟢 WORKER NORMAL", "safe");
        lastDrowsy = sensor.drowsiness_status;

        if(sensor.accident_status && !lastAccident) addEventLog("🚨 MENGANTUK", "danger");
        lastAccident = sensor.accident_status;

        if(sensor.helmet_activity_status === "inactive" && !lastInactive) addEventLog("🪖 HELMET INACTIVE", "danger");
        lastInactive = sensor.helmet_activity_status === "inactive";

        if(!sensor.system_status && lastSystem) addEventLog("⛔ SYSTEM OFF", "warning");
        if(sensor.system_status && !lastSystem) addEventLog("✅ SYSTEM ON", "safe");
        lastSystem = sensor.system_status;

        // UPDATE TEXT UI
        document.getElementById("device_id").innerText = sensor.device_id;
        document.getElementById("gyro_x").innerText = sensor.gyro_x;
        document.getElementById("gyro_y").innerText = sensor.gyro_y;
        document.getElementById("gyro_z").innerText = sensor.gyro_z;
        document.getElementById("updated_at").innerText = formatDateTime(sensor.updated_at);

        setStatus("eye_status", sensor.eye_status === "open" ? "OPEN" : "CLOSED", sensor.eye_status === "open" ? "safe" : "warning");
        setStatus("drowsiness_status", sensor.drowsiness_status ? "DROWSY" : "NORMAL", sensor.drowsiness_status ? "warning" : "safe");
        setStatus("accident_status", sensor.accident_status ? "ACCIDENT" : "SAFE", sensor.accident_status ? "danger" : "safe");
        setStatus("helmet_activity_status", sensor.helmet_activity_status === "inactive" ? "INACTIVE" : "ACTIVE", sensor.helmet_activity_status === "inactive" ? "danger" : "safe");

        const toggle = document.getElementById("system_toggle");
        if(toggle) toggle.checked = sensor.system_status;

        // MAP UPDATE
        const lat = parseFloat(sensor.latitude);
        const lng = parseFloat(sensor.longitude);
        if(!isNaN(lat) && !isNaN(lng)){
            marker.setLatLng([lat, lng]);
            map.setView([lat, lng], 17);
            marker.bindPopup(`<b>HELM-01 (Live)</b><br>Last Update:<br>${formatDateTime(sensor.updated_at)}`);
        }
    } catch(err) { console.log(err); }
}

// TOGGLE SWITCH CONTROL
document.getElementById("system_toggle").addEventListener("change", async function(){
    try {
        const status = this.checked;
        const { data } = await client.from("sensor_realtime").select("*").order("updated_at", { ascending: false }).limit(1);
        if(data && data.length > 0) {
            await client.from("sensor_realtime").update({ system_status: status }).eq("id", data[0].id);
        }
    } catch(err) { console.log(err); }
});

fetchDataHelm1();
setInterval(fetchDataHelm1, 3000);