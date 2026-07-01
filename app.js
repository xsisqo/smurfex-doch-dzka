const ADMIN_PIN = "2580";
const key = "smurfex_dochadzka_records_backup";
let lang = localStorage.getItem("smurfex_lang") || "sk";
let isAdmin = localStorage.getItem("smurfex_admin") === "1";
let currentRecords = [];
let unsubscribeRecords = null;

const WORKERS = [
  "Mohit Kumar",
  "Gurwinder Singh",
  "Pradip Majumder",
  "Jatinder Singh",
  "Vlado Hatala",
  "Fero Maslík",
  "Milan Sedliak"
];

const WORKER_PINS = {
  "Mohit Kumar": "1111",
  "Gurwinder Singh": "2222",
  "Pradip Majumder": "3333",
  "Jatinder Singh": "4444",
  "Vlado Hatala": "5555",
  "Fero Maslík": "6666",
  "Milan Sedliak": "7777"
};

const SITES = [
  "STRABAG letisko",
  "STRABAG nemocnica"
];

const firebaseConfig = {
  apiKey: "AIzaSyD972-SyhAtPi7keb-ivBB3FmAsahuHfs8",
  authDomain: "smurfex-dochadzka.firebaseapp.com",
  projectId: "smurfex-dochadzka",
  storageBucket: "smurfex-dochadzka.firebasestorage.app",
  messagingSenderId: "830780057575",
  appId: "1:830780057575:web:2fede9cb050452e2a3bf42",
  measurementId: "G-VFQNK513TR"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const recordsCol = db.collection("records");

const t = {
  sk: {
    title:"Dochádzka",
    subtitle:"Online evidencia príchodu a odchodu",
    workerLabel:"Pracovník",
    workerPlaceholder:"Vyber pracovníka",
    pinLabel:"PIN pracovníka",
    pinPlaceholder:"Zadaj PIN",
    siteLabel:"Stavba",
    sitePlaceholder:"Vyber stavbu",
    startBtn:"PRIŠIEL SOM",
    endBtn:"ODCHÁDZAM",
    todayTitle:"Všetky záznamy",
    dashboardTitle:"Živý prehľad dnes",
    exportBtn:"Export CSV",
    clearBtn:"Vymazať záznamy",
    noRecords:"Zatiaľ žiadne záznamy.",
    fillAlert:"Vyber pracovníka, stavbu a zadaj PIN.",
    wrongWorkerPin:"Nesprávny PIN pracovníka.",
    saved:"uložený online",
    start:"PRÍCHOD",
    end:"ODCHOD",
    site:"Stavba",
    noExport:"Nie sú žiadne záznamy.",
    confirmClear:"Naozaj vymazať všetky online záznamy?",
    adminTitle:"Administrátor",
    adminLoginBtn:"Admin prihlásenie",
    adminLogoutBtn:"Odhlásiť admina",
    wrongPin:"Nesprávny PIN.",
    online:"Online databáza pripojená.",
    saving:"Ukladám...",
    saveError:"Chyba uloženia. Skontroluj internet alebo Firestore pravidlá.",
    gpsGetting:"Získavam GPS polohu...",
    gpsError:"GPS poloha je povinná. Povoľ polohu v prehliadači a skús znova.",
    map:"Otvoriť mapu",
    location:"GPS poloha",
    inWork:"V práci",
    left:"Odišiel",
    noToday:"Dnes zatiaľ nikto nezapísal dochádzku.",
    hoursToday:"Dnes",
    lastTime:"Posledný čas"
  },
  en: {
    title:"Attendance",
    subtitle:"Online check-in and check-out record",
    workerLabel:"Worker",
    workerPlaceholder:"Select worker",
    pinLabel:"Worker PIN",
    pinPlaceholder:"Enter PIN",
    siteLabel:"Construction site",
    sitePlaceholder:"Select site",
    startBtn:"I ARRIVED",
    endBtn:"I AM LEAVING",
    todayTitle:"All records",
    dashboardTitle:"Live overview today",
    exportBtn:"Export CSV",
    clearBtn:"Clear records",
    noRecords:"No records yet.",
    fillAlert:"Select worker, site and enter PIN.",
    wrongWorkerPin:"Wrong worker PIN.",
    saved:"saved online",
    start:"ARRIVAL",
    end:"DEPARTURE",
    site:"Site",
    noExport:"There are no records.",
    confirmClear:"Do you really want to delete all online records?",
    adminTitle:"Administrator",
    adminLoginBtn:"Admin login",
    adminLogoutBtn:"Admin logout",
    wrongPin:"Wrong PIN.",
    online:"Online database connected.",
    saving:"Saving...",
    saveError:"Save error. Check internet or Firestore rules.",
    gpsGetting:"Getting GPS location...",
    gpsError:"GPS location is required. Allow location in the browser and try again.",
    map:"Open map",
    location:"GPS location",
    inWork:"At work",
    left:"Left",
    noToday:"No attendance records today yet.",
    hoursToday:"Today",
    lastTime:"Last time"
  }
};

function fillSelects(){
  const workerSelect = document.getElementById("worker");
  const siteSelect = document.getElementById("site");
  if(!workerSelect || !siteSelect) return;

  const selectedWorker = workerSelect.value;
  const selectedSite = siteSelect.value;

  workerSelect.innerHTML = `<option value="">${t[lang].workerPlaceholder}</option>` +
    WORKERS.map(name => `<option value="${name}">${name}</option>`).join("");

  siteSelect.innerHTML = `<option value="">${t[lang].sitePlaceholder}</option>` +
    SITES.map(site => `<option value="${site}">${site}</option>`).join("");

  if(selectedWorker) workerSelect.value = selectedWorker;
  if(selectedSite) siteSelect.value = selectedSite;
}

function ensurePinInput(){
  const siteLabel = document.querySelector('label[data-i18n="siteLabel"]');
  if(!siteLabel || document.getElementById("workerPin")) return;
  const pinLabel = document.createElement("label");
  pinLabel.setAttribute("data-i18n", "pinLabel");
  pinLabel.innerText = t[lang].pinLabel;
  const pinInput = document.createElement("input");
  pinInput.id = "workerPin";
  pinInput.type = "password";
  pinInput.inputMode = "numeric";
  pinInput.autocomplete = "off";
  pinInput.placeholder = t[lang].pinPlaceholder;
  pinInput.setAttribute("data-i18n-placeholder", "pinPlaceholder");
  siteLabel.parentNode.insertBefore(pinInput, siteLabel);
  siteLabel.parentNode.insertBefore(pinLabel, pinInput);
}

function setLang(l){
  lang = l;
  localStorage.setItem("smurfex_lang", lang);
  document.documentElement.lang = lang;
  ensurePinInput();
  document.querySelectorAll("[data-i18n]").forEach(el => {
    if(t[lang][el.dataset.i18n]) el.innerText = t[lang][el.dataset.i18n];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    if(t[lang][el.dataset.i18nPlaceholder]) el.placeholder = t[lang][el.dataset.i18nPlaceholder];
  });
  document.getElementById("btn-sk").classList.toggle("active", lang === "sk");
  document.getElementById("btn-en").classList.toggle("active", lang === "en");
  fillSelects();
  renderAdminState();
  renderDashboard();
  renderRecords();
}

function renderAdminState(){
  const adminPanel = document.getElementById("adminPanel");
  const adminLoginBtn = document.getElementById("adminLoginBtn");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");
  if(!adminPanel || !adminLoginBtn || !adminLogoutBtn) return;

  adminPanel.style.display = isAdmin ? "block" : "none";
  adminLoginBtn.style.display = isAdmin ? "none" : "inline-block";
  adminLogoutBtn.style.display = isAdmin ? "inline-block" : "none";
  if(isAdmin) startAdminListener();
}

function adminLogin(){
  const pin = prompt("ADMIN PIN");
  if(pin === ADMIN_PIN){
    isAdmin = true;
    localStorage.setItem("smurfex_admin", "1");
    renderAdminState();
  } else if(pin !== null) {
    alert(t[lang].wrongPin);
  }
}

function adminLogout(){
  isAdmin = false;
  localStorage.removeItem("smurfex_admin");
  if(unsubscribeRecords){
    unsubscribeRecords();
    unsubscribeRecords = null;
  }
  currentRecords = [];
  renderAdminState();
  renderDashboard();
  renderRecords();
}

function getLocation(){
  return new Promise((resolve, reject) => {
    if(!navigator.geolocation){
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy || 0),
        mapUrl: `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`
      }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

async function saveRecord(type){
  const worker = document.getElementById("worker").value.trim();
  const site = document.getElementById("site").value.trim();
  const pin = document.getElementById("workerPin") ? document.getElementById("workerPin").value.trim() : "";
  if(!worker || !site || !pin){alert(t[lang].fillAlert);return;}
  if(WORKER_PINS[worker] !== pin){alert(t[lang].wrongWorkerPin);return;}

  document.getElementById("status").innerText = t[lang].gpsGetting;
  let gps;
  try{
    gps = await getLocation();
  }catch(e){
    console.error(e);
    alert(t[lang].gpsError);
    document.getElementById("status").innerText = t[lang].gpsError;
    return;
  }

  const now = new Date();
  const record = {
    datum: now.toLocaleDateString("sk-SK"),
    cas: now.toLocaleTimeString("sk-SK", {hour:"2-digit", minute:"2-digit"}),
    dateISO: now.toISOString().slice(0,10),
    createdAtLocal: now.toISOString(),
    pracovnik: worker,
    stavba: site,
    typ: type,
    latitude: gps.lat,
    longitude: gps.lng,
    accuracy: gps.accuracy,
    mapUrl: gps.mapUrl,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  document.getElementById("status").innerText = t[lang].saving;

  try{
    await recordsCol.add(record);
    localStorage.setItem(key, JSON.stringify(record));
    document.getElementById("workerPin").value = "";
    document.getElementById("status").innerText = t[lang][type] + " " + t[lang].saved + ": " + record.cas;
  }catch(e){
    console.error(e);
    alert(t[lang].saveError);
    document.getElementById("status").innerText = t[lang].saveError;
  }
}

function startAdminListener(){
  if(unsubscribeRecords) return;
  unsubscribeRecords = recordsCol.orderBy("createdAtLocal", "desc").onSnapshot(snapshot => {
    currentRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    document.getElementById("syncStatus").innerText = t[lang].online;
    renderDashboard();
    renderRecords();
  }, err => {
    console.error(err);
    document.getElementById("syncStatus").innerText = "Firestore error";
  });
}

function minutesBetween(a,b){
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  if(isNaN(start) || isNaN(end) || end < start) return 0;
  return Math.round((end - start) / 60000);
}

function formatMinutes(total){
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${String(m).padStart(2,"0")}m`;
}

function getTodayISO(){
  return new Date().toISOString().slice(0,10);
}

function getTodaySummary(){
  const today = getTodayISO();
  const todayRecords = currentRecords
    .filter(r => r.dateISO === today)
    .slice()
    .sort((a,b) => (a.createdAtLocal || "").localeCompare(b.createdAtLocal || ""));

  const summary = {};
  WORKERS.forEach(w => summary[w] = { worker:w, status:"", site:"", lastTime:"", minutes:0, openStart:null });

  todayRecords.forEach(r => {
    const s = summary[r.pracovnik] || { worker:r.pracovnik, status:"", site:"", lastTime:"", minutes:0, openStart:null };
    if(r.typ === "start"){
      s.status = "in";
      s.site = r.stavba || s.site;
      s.lastTime = r.cas || "";
      s.openStart = r.createdAtLocal;
    }
    if(r.typ === "end"){
      s.status = "out";
      s.site = r.stavba || s.site;
      s.lastTime = r.cas || "";
      if(s.openStart){
        s.minutes += minutesBetween(s.openStart, r.createdAtLocal);
        s.openStart = null;
      }
    }
    summary[r.pracovnik] = s;
  });

  Object.values(summary).forEach(s => {
    if(s.openStart) s.minutes += minutesBetween(s.openStart, new Date().toISOString());
  });

  return Object.values(summary).filter(s => s.status || s.minutes > 0);
}

function renderDashboard(){
  const box = document.getElementById("dashboard");
  if(!box) return;
  if(!isAdmin){ box.innerHTML = ""; return; }

  const data = getTodaySummary();
  if(data.length === 0){box.innerHTML = `<p>${t[lang].noToday}</p>`; return;}

  const bySite = {};
  data.forEach(s => {
    const site = s.site || "Bez stavby";
    if(!bySite[site]) bySite[site] = [];
    bySite[site].push(s);
  });

  box.innerHTML = Object.keys(bySite).map(site => `
    <div class="record">
      <b>${site}</b><br>
      ${bySite[site].map(s => `
        ${s.status === "in" ? "🟢" : "⚪"} ${s.worker} — ${s.status === "in" ? t[lang].inWork : t[lang].left}<br>
        ${t[lang].hoursToday}: ${formatMinutes(s.minutes)} | ${t[lang].lastTime}: ${s.lastTime || "-"}
      `).join("<br>")}
    </div>`).join("");
}

function renderRecords(){
  const box = document.getElementById("records");
  if(!box) return;
  if(!isAdmin){ box.innerHTML = ""; return; }
  if(currentRecords.length === 0){box.innerHTML = `<p>${t[lang].noRecords}</p>`;return;}
  box.innerHTML = currentRecords.map(r => `
    <div class="record">
      <b>${t[lang][r.typ] || r.typ}</b> – ${r.pracovnik || ""}<br>
      ${r.datum || ""} ${r.cas || ""}<br>
      ${t[lang].site}: ${r.stavba || ""}<br>
      ${r.mapUrl ? `${t[lang].location}: <a href="${r.mapUrl}" target="_blank" rel="noopener">${t[lang].map}</a> (${r.accuracy || "?"} m)` : ""}
    </div>`).join("");
}

function exportCSV(){
  if(!isAdmin) return;
  if(currentRecords.length === 0){alert(t[lang].noExport);return;}
  const header = "Date;Time;Worker;Site;Type;Latitude;Longitude;Accuracy;Map\n";
  const rows = currentRecords.map(r =>
    `${r.datum || ""};${r.cas || ""};${r.pracovnik || ""};${r.stavba || ""};${t.en[r.typ] || r.typ || ""};${r.latitude || ""};${r.longitude || ""};${r.accuracy || ""};${r.mapUrl || ""}`
  ).join("\n");
  const blob = new Blob([header + rows], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "smurfex-attendance-online.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function clearRecords(){
  if(!isAdmin) return;
  if(!confirm(t[lang].confirmClear)) return;

  const snap = await recordsCol.get();
  const batch = db.batch();
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js");
}

ensurePinInput();
fillSelects();
setLang(lang);
renderAdminState();
