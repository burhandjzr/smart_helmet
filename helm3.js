// ==========================================
// CONFIG & INITIALIZATION HELM 3 (DUMMY WARNING)
// ==========================================
document.getElementById("detail_title").innerText = "HELMET DASHBOARD - HELM-03";

const BASE_LAT = -6.367170;
const BASE_LNG = 106.831740;
const H3_LAT = BASE_LAT - 0.0002;
const H3_LNG = BASE_LNG + 0.0005;

const map = L.map('map').setView([H3_LAT, H3_LNG], 17);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'OpenStreetMap' }).addTo(map);
let marker = L.marker([H3_LAT, H3_LNG]).addTo(map);

let lastDrowsy = false;

function formatDateTime(timestamp){
    return new Date(timestamp).toLocaleString("id-ID", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
}

function addEventLog(message, severity){
    const eventLog = document.getElementById("event_log");
    if(!eventLog) return;
    const eventItem = document.createElement("div");
    eventItem.classList.add("event-item");
    if(severity === "warning") eventItem.classList.add("event-warning");

    const time = new Date().toLocaleTimeString("id-ID");
    eventItem.innerHTML = `<div class="event-time">${time}</div><div class="event-text">${message}</div>`;
    eventLog.prepend(eventItem);
}

function setStatus(elementId, text, className){
    const el = document.getElementById(elementId);
    if(el) el.innerHTML = `<span class="${className}">${text}</span>`;
}

function fetchDataHelm3() {
    // Simulasi data pekerja mengantuk (Eye Status Closed & Drowsiness True)
    const dummySensor = {
        device_id: "HELM-03",
        gyro_x: (Math.random() * 0.5 - 0.25).toFixed(2),
        gyro_y: (Math.random() * 0.4 - 0.20).toFixed(2),
        gyro_z: (9.65 + (Math.random() * 0.15)).toFixed(2),
        updated_at: new Date().toISOString(),
        eye_status: "closed",
        drowsiness_status: true,
        accident_status: false,
        helmet_activity_status: "active",
        system_status: true
    };

    if(!lastDrowsy) {
        addEventLog("⚠️ DROWSINESS DETECTED", "warning");
        lastDrowsy = true;
    }

    document.getElementById("device_id").innerText = dummySensor.device_id;
    document.getElementById("gyro_x").innerText = dummySensor.gyro_x;
    document.getElementById("gyro_y").innerText = dummySensor.gyro_y;
    document.getElementById("gyro_z").innerText = dummySensor.gyro_z;
    document.getElementById("updated_at").innerText = formatDateTime(dummySensor.updated_at);

    setStatus("eye_status", "CLOSED", "warning");
    setStatus("drowsiness_status", "DROWSY", "warning");
    setStatus("accident_status", "SAFE", "safe");
    setStatus("helmet_activity_status", "ACTIVE", "safe");
    
    document.getElementById("system_toggle").checked = true;

    const currentLat = H3_LAT + (Math.random() - 0.5) * 0.00005;
    const currentLng = H3_LNG + (Math.random() - 0.5) * 0.00005;
    marker.setLatLng([currentLat, currentLng]);
    marker.bindPopup(`<b>HELM-03 (Dummy Worker)</b><br><span class="warning">Status: Drowsy Warning</span>`);
}

document.getElementById("system_toggle").addEventListener("change", function(){
    alert("Control lock: Cannot toggle dummy systems.");
    this.checked = true;
});

fetchDataHelm3();
setInterval(fetchDataHelm3, 3000);