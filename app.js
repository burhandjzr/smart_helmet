// =========================
// SUPABASE CONFIG
// =========================

const SUPABASE_URL =
"https://vfqbpjabzghzjuhmwxtj.supabase.co";

const SUPABASE_KEY =
"sb_publishable_QKA_4y0d6eZZo561MQsUnA_kGmCpgkh";

const client =
supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// =========================
// LEAFLET MAP
// =========================

const map =
L.map('map')
.setView(
    [-6.200000, 106.816000],
    15
);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: 'OpenStreetMap'
    }
).addTo(map);

// MARKER
let marker =
L.marker(
    [-6.200000, 106.816000]
).addTo(map);

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

    const date =
    new Date(timestamp);

    return date.toLocaleString(
        "id-ID",
        {

            day:"2-digit",

            month:"short",

            year:"numeric",

            hour:"2-digit",

            minute:"2-digit",

            second:"2-digit"
        }
    );
}

// =========================
// EVENT LOG FUNCTION
// =========================

function addEventLog(
    message,
    severity
){

    const eventLog =
    document.getElementById(
        "event_log"
    );

    if(!eventLog) return;

    const eventItem =
    document.createElement("div");

    eventItem.classList.add(
        "event-item"
    );

    // SEVERITY
    if(severity === "warning"){

        eventItem.classList.add(
            "event-warning"
        );
    }

    if(severity === "danger"){

        eventItem.classList.add(
            "event-danger"
        );
    }

    if(severity === "safe"){

        eventItem.classList.add(
            "event-safe"
        );
    }

    const time =
    new Date()
    .toLocaleTimeString(
        "id-ID"
    );

    eventItem.innerHTML = `

        <div class="event-time">

            ${time}

        </div>

        <div class="event-text">

            ${message}

        </div>
    `;

    eventLog.prepend(
        eventItem
    );

    // MAX 20 LOG
    if(eventLog.children.length > 20){

        eventLog.removeChild(
            eventLog.lastChild
        );
    }
}

// =========================
// STATUS UI
// =========================

function setStatus(
    elementId,
    text,
    className
){

    const el =
    document.getElementById(
        elementId
    );

    if(!el) return;

    el.innerHTML = `

        <span class="${className}">
            ${text}
        </span>

    `;
}

// =========================
// FETCH DATA
// =========================

async function fetchData(){

    try{

        const { data, error } =

        await client

        .from("sensor_realtime")

        .select("*")

        .order(
            "updated_at",
            { ascending:false }
        )

        .limit(1);

        // ERROR
        if(error){

            console.log(
                "Supabase Error:",
                error
            );

            return;
        }

        // EMPTY
        if(
            !data ||
            data.length === 0
        ){

            console.log(
                "No data found"
            );

            return;
        }

        // LATEST DATA
        const sensor = data[0];

        console.log(sensor);

        // =====================
        // EVENT DETECTION
        // =====================

        // DROWSINESS
        if(
            sensor.drowsiness_status &&
            !lastDrowsy
        ){

            addEventLog(
                "⚠ DROWSINESS DETECTED",
                "warning"
            );
        }

        if(
            !sensor.drowsiness_status &&
            lastDrowsy
        ){

            addEventLog(
                "🟢 WORKER NORMAL",
                "safe"
            );
        }

        lastDrowsy =
        sensor.drowsiness_status;

        // ACCIDENT
        if(
            sensor.accident_status &&
            !lastAccident
        ){

            addEventLog(
                "🚨 ACCIDENT DETECTED",
                "danger"
            );
        }

        lastAccident =
        sensor.accident_status;

        // HELMET
        if(
            sensor.helmet_activity_status
            === "inactive"

            &&

            !lastInactive
        ){

            addEventLog(
                "🪖 HELMET INACTIVE",
                "danger"
            );
        }

        lastInactive =
        sensor.helmet_activity_status
        === "inactive";

        // SYSTEM
        if(
            !sensor.system_status &&
            lastSystem
        ){

            addEventLog(
                "⛔ SYSTEM OFF",
                "warning"
            );
        }

        if(
            sensor.system_status &&
            !lastSystem
        ){

            addEventLog(
                "✅ SYSTEM ON",
                "safe"
            );
        }

        lastSystem =
        sensor.system_status;

        // =====================
        // UPDATE UI
        // =====================

        document.getElementById(
            "device_id"
        ).innerText =
        sensor.device_id;

        document.getElementById(
            "gyro_x"
        ).innerText =
        sensor.gyro_x;

        document.getElementById(
            "gyro_y"
        ).innerText =
        sensor.gyro_y;

        document.getElementById(
            "gyro_z"
        ).innerText =
        sensor.gyro_z;

        document.getElementById(
            "updated_at"
        ).innerText =

        formatDateTime(
            sensor.updated_at
        );

        // =====================
        // STATUS UI
        // =====================

        setStatus(
            "eye_status",

            sensor.eye_status === "open"
            ? "OPEN"
            : "CLOSED",

            sensor.eye_status === "open"
            ? "safe"
            : "warning"
        );

        setStatus(
            "drowsiness_status",

            sensor.drowsiness_status
            ? "DROWSY"
            : "NORMAL",

            sensor.drowsiness_status
            ? "warning"
            : "safe"
        );

        setStatus(
            "accident_status",

            sensor.accident_status
            ? "ACCIDENT"
            : "SAFE",

            sensor.accident_status
            ? "danger"
            : "safe"
        );

        setStatus(
            "helmet_activity_status",

            sensor.helmet_activity_status
            === "inactive"

            ? "INACTIVE"
            : "ACTIVE",

            sensor.helmet_activity_status
            === "inactive"

            ? "danger"
            : "safe"
        );

        // =====================
        // SYSTEM TOGGLE
        // =====================

        const toggle =
        document.getElementById(
            "system_toggle"
        );

        if(toggle){

            toggle.checked =
            sensor.system_status;
        }

        // =====================
        // MAP UPDATE
        // =====================

        const lat =
        parseFloat(
            sensor.latitude
        );

        const lng =
        parseFloat(
            sensor.longitude
        );

        if(
            !isNaN(lat) &&
            !isNaN(lng)
        ){

            marker.setLatLng(
                [lat,lng]
            );

            map.setView(
                [lat,lng],
                15
            );

            marker.bindPopup(`

                <b>
                    ${sensor.device_id}
                </b>

                <br><br>

                Last Update:
                <br>

                ${formatDateTime(sensor.updated_at)}

            `);
        }

    }catch(err){

        console.log(
            "Fetch Error:",
            err
        );
    }
}

// =========================
// SYSTEM TOGGLE
// =========================

const toggleButton =
document.getElementById(
    "system_toggle"
);

if(toggleButton){

    toggleButton.addEventListener(

        "change",

        async function(){

            try{

                const status =
                this.checked;

                const { data } =

                await client

                .from("sensor_realtime")

                .select("*")

                .order(
                    "updated_at",
                    { ascending:false }
                )

                .limit(1);

                if(
                    !data ||
                    data.length === 0
                ){

                    return;
                }

                const latest =
                data[0];

                await client

                .from("sensor_realtime")

                .update({

                    system_status:status

                })

                .eq(
                    "id",
                    latest.id
                );

            }catch(err){

                console.log(err);
            }
        }
    );
}

// =========================
// START SYSTEM
// =========================

fetchData();

// REALTIME UPDATE
setInterval(
    fetchData,
    3000
);