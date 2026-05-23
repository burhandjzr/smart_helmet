// =========================
// SUPABASE CONFIG
// =========================
const SUPABASE_URL = "https://vfqbpjabzghzjuhmwxtj.supabase.co";
const SUPABASE_KEY = "sb_publishable_QKA_4y0d6eZZo561MQsUnA_kGmCpgkh";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const BASE_LAT = -6.367170;
const BASE_LNG = 106.831740;

const map = L.map('map').setView([BASE_LAT, BASE_LNG], 17);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'OpenStreetMap'
}).addTo(map);

let markers = {
    "HELM-01": L.marker([BASE_LAT, BASE_LNG]).addTo(map),
    "HELM-02": L.marker([BASE_LAT + 0.0003, BASE_LNG - 0.0004]).addTo(map),
    "HELM-03": L.marker([BASE_LAT - 0.0002, BASE_LNG + 0.0005]).addTo(map)
};

function setStatusUI(elementId, text, className) {
    const el = document.getElementById(elementId);
    if(el) el.innerHTML = `<span class="${className}">${text}</span>`;
}

async function fetchFleetData() {
    try {
        // Ambil Data Terupdate Helm 1 (Asli dari Supabase)
        const { data, error } = await client
            .from("sensor_realtime")
            .select("*")
            .order("updated_at", { ascending: false })
            .limit(1);

        if(!error && data && data.length > 0) {
            const latestSensor = data[0];
            
            document.getElementById("h1_id").innerText = latestSensor.device_id || "HELM-01";
            setStatusUI("h1_drowsy", latestSensor.drowsiness_status ? "DROWSY" : "NORMAL", latestSensor.drowsiness_status ? "warning" : "safe");
            setStatusUI("h1_accident", latestSensor.accident_status ? "ACCIDENT" : "SAFE", latestSensor.accident_status ? "danger" : "safe");
            
            const systemBadge = document.getElementById("h1_system");
            if(systemBadge) {
                systemBadge.innerText = latestSensor.system_status ? "ACTIVE" : "INACTIVE";
                systemBadge.className = latestSensor.system_status ? "badge badge-active" : "badge badge-inactive";
            }

            const h1Lat = parseFloat(latestSensor.latitude) || BASE_LAT;
            const h1Lng = parseFloat(latestSensor.longitude) || BASE_LNG;
            markers["HELM-01"].setLatLng([h1Lat, h1Lng]);
            markers["HELM-01"].bindPopup(`<b>${latestSensor.device_id} (Live)</b><br>Status: ${latestSensor.drowsiness_status ? "Drowsy" : "Normal"}`);
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

    } catch(err) {
        console.log("Fleet Fetch Error:", err);
    }
}

fetchFleetData();
setInterval(fetchFleetData, 3000);