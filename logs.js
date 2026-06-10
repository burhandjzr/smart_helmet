// logs.js — relies on client, BASE_LAT, BASE_LNG, formatDateTime from app.js

const map = L.map('map').setView([BASE_LAT, BASE_LNG], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'OpenStreetMap' }).addTo(map);

const startIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41]
});

const endIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41]
});

let routeLine = null;
let startMarker = null;
let endMarker = null;

async function fetchAuditLogs() {
    const selector = document.getElementById("helmet_selector");
    const selectedHelmet = selector ? selector.value : "HELM-01";
    document.getElementById("map_title").innerText = `Worker Tracking Route - ${selectedHelmet}`;

    let dataRows = [];

    if (selectedHelmet === "HELM-01") {
        try {
            const { data, error } = await client
                .from("sensor_realtime")
                .select("*")
                .order("updated_at", { ascending: false })
                .limit(10);
            if (!error && data) dataRows = data;
        } catch (e) { console.log(e); }
    } else {
        const isH3 = selectedHelmet === "HELM-03";
        for (let i = 0; i < 10; i++) {
            const offsetSpace = i * 0.00008;
            dataRows.push({
                updated_at: new Date(Date.now() - i * 60000).toISOString(),
                device_id: selectedHelmet,
                drowsiness_status: isH3 ? (i % 4 === 0) : false,
                accident_status: false,
                helmet_activity_status: "active",
                system_status: true,
                latitude: isH3 ? (BASE_LAT - 0.0002 - offsetSpace) : (BASE_LAT + 0.0003 + offsetSpace),
                longitude: isH3 ? (BASE_LNG + 0.0005 + offsetSpace) : (BASE_LNG - 0.0004 - offsetSpace)
            });
        }
    }

    if (dataRows.length === 0) return;

    const tbody = document.getElementById("log_table");
    tbody.innerHTML = "";
    dataRows.forEach(sensor => {
        let msg = "🟢 Pekerja Normal", severity = "safe";
        if (sensor.drowsiness_status) { msg = "⚠️ Kantuk Terdeteksi"; severity = "warning"; }
        if (sensor.accident_status)   { msg = "🚨 Insiden Terdeteksi"; severity = "danger";  }

        const row = document.createElement("tr");
        row.innerHTML = `<td>${formatDateTime(sensor.updated_at)}</td><td>${sensor.device_id}</td><td>${msg}</td><td><span class="${severity}">${severity.toUpperCase()}</span></td>`;
        tbody.appendChild(row);
    });

    const trackingData = [...dataRows].reverse();

    if (routeLine)    map.removeLayer(routeLine);
    if (startMarker)  map.removeLayer(startMarker);
    if (endMarker)    map.removeLayer(endMarker);

    const routeCoords = trackingData.map(item => [parseFloat(item.latitude), parseFloat(item.longitude)]);
    routeLine = L.polyline(routeCoords, { color: "#3b82f6", weight: 5, opacity: 0.85 }).addTo(map);

    const startPt = trackingData[0];
    startMarker = L.marker([parseFloat(startPt.latitude), parseFloat(startPt.longitude)], { icon: startIcon }).addTo(map);

    const endPt = trackingData[trackingData.length - 1];
    endMarker = L.marker([parseFloat(endPt.latitude), parseFloat(endPt.longitude)], { icon: endIcon }).addTo(map);

    map.fitBounds(routeLine.getBounds());
    document.getElementById("tracking_info").innerHTML = `Points: <b>${routeCoords.length}</b> | Latest: <b>${formatDateTime(dataRows[0].updated_at)}</b>`;
}

function switchDeviceLog() { fetchAuditLogs(); }
fetchAuditLogs();
setInterval(fetchAuditLogs, 10000);
