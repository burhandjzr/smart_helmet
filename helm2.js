// ==========================================
// CONFIG & INITIALIZATION HELM 2 (DUMMY NORMAL)
// ==========================================
document.getElementById("detail_title").innerText = "HELMET DASHBOARD - HELM-02 (DUMMY)";

const BASE_LAT = -6.367170;
const BASE_LNG = 106.831740;
const H2_LAT = BASE_LAT + 0.0003;
const H2_LNG = BASE_LNG - 0.0004;

const map = L.map('map').setView([H2_LAT, H2_LNG], 17);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'OpenStreetMap' }).addTo(map);
let marker = L.marker([H2_LAT, H2_LNG]).addTo(map);

function formatDateTime(timestamp){
    return new Date(timestamp).toLocaleString("id-ID", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
}

function setStatus(elementId, text, className){
    const el = document.getElementById(elementId);
    if(el) el.innerHTML = `<span class="${className}">${text}</span>`;
}

function fetchDataHelm2() {
    // Simulasi data konstan pekerja sehat/normal berjalan di site
    const dummySensor = {
        device_id: "HELM-02",
        gyro_x: (Math.random() * 0.3 - 0.15).toFixed(2),
        gyro_y: (Math.random() * 0.2 - 0.10).toFixed(2),
        gyro_z: (9.78 + (Math.random() * 0.1)).toFixed(2),
        updated_at: new Date().toISOString(),
        eye_status: "open",
        drowsiness_status: false,
        accident_status: false,
        helmet_activity_status: "active",
        system_status: true
    };

    document.getElementById("device_id").innerText = dummySensor.device_id;
    document.getElementById("gyro_x").innerText = dummySensor.gyro_x;
    document.getElementById("gyro_y").innerText = dummySensor.gyro_y;
    document.getElementById("gyro_z").innerText = dummySensor.gyro_z;
    document.getElementById("updated_at").innerText = formatDateTime(dummySensor.updated_at);

    setStatus("eye_status", "OPEN", "safe");
    setStatus("drowsiness_status", "NORMAL", "safe");
    setStatus("accident_status", "SAFE", "safe");
    setStatus("helmet_activity_status", "ACTIVE", "safe");
    
    document.getElementById("system_toggle").checked = true;

    // Pergerakan mikro dummy marker di peta lokal
    const currentLat = H2_LAT + (Math.random() - 0.5) * 0.00005;
    const currentLng = H2_LNG + (Math.random() - 0.5) * 0.00005;
    marker.setLatLng([currentLat, currentLng]);
    marker.bindPopup(`<b>HELM-02 (Dummy Worker)</b><br>Status: Normal & Safe`);
}

document.getElementById("system_toggle").addEventListener("change", function(){
    alert("Control lock: Cannot toggle dummy systems.");
    this.checked = true;
});

fetchDataHelm2();
setInterval(fetchDataHelm2, 3000);