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
    photoLabel:"Fotka pracovníka",
    photoHint:"Pred uložením sprav fotku pracovníka.",
    photoRequired:"Fotka pracovníka je povinná.",
    photoProcessing:"Spracúvam fotku...",
    photo:"Fotka",
    startBtn:"PRIŠIEL SOM",
    endBtn:"ODCHÁDZAM",
    todayTitle:"Všetky záznamy",
    dashboardTitle:"Živý prehľad dnes",
    notificationsTitle:"Posledné udalosti",
    presentNow:"Momentálne v práci",
    latestEvents:"Najnovšie záznamy",
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
    lastTime:"Posledný čas",
    reportTitle:"Mesačný výkaz",
    reportWorker:"Pracovník pre výkaz",
    reportMonth:"Mesiac",
    showReportBtn:"Zobraziť výkaz",
    pdfReportBtn:"PDF výkaz",
    csvReportBtn:"CSV výkaz",
    allWorkers:"Všetci pracovníci",
    totalHours:"Spolu hodín",
    reportDays:"Počet dní",
    reportNoData:"Pre vybraný mesiac nie sú záznamy.",
    reportGenerated:"Výkaz vygenerovaný",
    arrival:"Príchod",
    departure:"Odchod",
    duration:"Trvanie"
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
    photoLabel:"Worker photo",
    photoHint:"Take a worker photo before saving.",
    photoRequired:"Worker photo is required.",
    photoProcessing:"Processing photo...",
    photo:"Photo",
    startBtn:"I ARRIVED",
    endBtn:"I AM LEAVING",
    todayTitle:"All records",
    dashboardTitle:"Live overview today",
    notificationsTitle:"Latest events",
    presentNow:"Currently at work",
    latestEvents:"Newest records",
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
    lastTime:"Last time",
    reportTitle:"Monthly report",
    reportWorker:"Worker for report",
    reportMonth:"Month",
    showReportBtn:"Show report",
    pdfReportBtn:"PDF report",
    csvReportBtn:"CSV report",
    allWorkers:"All workers",
    totalHours:"Total hours",
    reportDays:"Days",
    reportNoData:"No records for selected month.",
    reportGenerated:"Report generated",
    arrival:"Arrival",
    departure:"Departure",
    duration:"Duration"
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

  const reportWorker = document.getElementById("reportWorker");
  if(reportWorker){
    const selectedReportWorker = reportWorker.value;
    reportWorker.innerHTML = `<option value="">${t[lang].allWorkers}</option>` +
      WORKERS.map(name => `<option value="${name}">${name}</option>`).join("");
    if(selectedReportWorker) reportWorker.value = selectedReportWorker;
  }

  const reportMonth = document.getElementById("reportMonth");
  if(reportMonth && !reportMonth.value){
    reportMonth.value = new Date().toISOString().slice(0,7);
  }
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
  renderNotifications();
  renderNotifications();
  renderDashboard();
  renderRecords();
  renderMonthlyReport(false);
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
  renderNotifications();
  renderDashboard();
  renderRecords();
}


function readPhotoBase64(){
  return new Promise((resolve, reject) => {
    const input = document.getElementById("selfie");
    if(!input || !input.files || !input.files[0]){
      reject(new Error("Photo required"));
      return;
    }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 640;
        let width = img.width;
        let height = img.height;
        if(width > height && width > maxSize){
          height = Math.round(height * maxSize / width);
          width = maxSize;
        } else if(height > maxSize){
          width = Math.round(width * maxSize / height);
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.55));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

  document.getElementById("status").innerText = t[lang].photoProcessing;
  let photoData;
  try{
    photoData = await readPhotoBase64();
  }catch(e){
    console.error(e);
    alert(t[lang].photoRequired);
    document.getElementById("status").innerText = t[lang].photoRequired;
    return;
  }

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
    photoData: photoData,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  document.getElementById("status").innerText = t[lang].saving;

  try{
    await recordsCol.add(record);
    localStorage.setItem(key, JSON.stringify(record));
    document.getElementById("workerPin").value = "";
    const selfieInput = document.getElementById("selfie");
    if(selfieInput) selfieInput.value = "";
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
    renderNotifications();
    renderDashboard();
    renderRecords();
    renderMonthlyReport(false);
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


function renderNotifications(){
  const box = document.getElementById("notifications");
  if(!box) return;
  if(!isAdmin){ box.innerHTML = ""; return; }

  const today = getTodayISO();
  const todayRecords = currentRecords
    .filter(r => r.dateISO === today)
    .slice()
    .sort((a,b) => (b.createdAtLocal || "").localeCompare(a.createdAtLocal || ""));

  const presentCount = getTodaySummary().filter(s => s.status === "in").length;

  if(todayRecords.length === 0){
    box.innerHTML = `<div class="record"><b>${t[lang].presentNow}: 0</b><br>${t[lang].noToday}</div>`;
    return;
  }

  const latest = todayRecords.slice(0, 8).map(r => {
    const icon = r.typ === "start" ? "🟢" : "⚪";
    const typeText = t[lang][r.typ] || r.typ;
    const map = r.mapUrl ? ` · <a href="${r.mapUrl}" target="_blank" rel="noopener">${t[lang].map}</a>` : "";
    return `${icon} <b>${r.pracovnik || ""}</b> — ${typeText} — ${r.stavba || ""} — ${r.cas || ""}${map}`;
  }).join("<br>");

  box.innerHTML = `
    <div class="record">
      <b>${t[lang].presentNow}: ${presentCount}</b><br>
      <span>${t[lang].latestEvents}</span><br>
      ${latest}
    </div>`;
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
      ${r.mapUrl ? `${t[lang].location}: <a href="${r.mapUrl}" target="_blank" rel="noopener">${t[lang].map}</a> (${r.accuracy || "?"} m)<br>` : ""}
      ${r.photoData ? `${t[lang].photo}:<br><img src="${r.photoData}" alt="${t[lang].photo}" style="width:100%;max-width:220px;border-radius:12px;margin-top:8px;">` : ""}
    </div>`).join("");
}


function getReportRecords(){
  const worker = document.getElementById("reportWorker") ? document.getElementById("reportWorker").value : "";
  const month = document.getElementById("reportMonth") ? document.getElementById("reportMonth").value : new Date().toISOString().slice(0,7);
  const records = currentRecords
    .filter(r => !worker || r.pracovnik === worker)
    .filter(r => (r.dateISO || "").slice(0,7) === month)
    .slice()
    .sort((a,b) => (a.createdAtLocal || "").localeCompare(b.createdAtLocal || ""));
  return { worker, month, records };
}

function buildMonthlyPairs(records){
  const open = {};
  const rows = [];
  records.forEach(r => {
    const w = r.pracovnik || "";
    if(r.typ === "start"){
      open[w] = r;
    }
    if(r.typ === "end"){
      const start = open[w];
      const mins = start ? minutesBetween(start.createdAtLocal, r.createdAtLocal) : 0;
      rows.push({
        worker: w,
        site: r.stavba || (start ? start.stavba : ""),
        date: r.dateISO || (r.datum || ""),
        startTime: start ? (start.cas || "") : "-",
        endTime: r.cas || "",
        minutes: mins
      });
      open[w] = null;
    }
  });
  Object.keys(open).forEach(w => {
    const start = open[w];
    if(start){
      rows.push({
        worker: w,
        site: start.stavba || "",
        date: start.dateISO || (start.datum || ""),
        startTime: start.cas || "",
        endTime: "-",
        minutes: minutesBetween(start.createdAtLocal, new Date().toISOString())
      });
    }
  });
  return rows;
}

function getMonthlySummary(){
  const data = getReportRecords();
  const rows = buildMonthlyPairs(data.records);
  const total = rows.reduce((sum, r) => sum + (r.minutes || 0), 0);
  const days = new Set(rows.map(r => `${r.worker}-${r.date}`)).size;
  return { ...data, rows, total, days };
}

function renderMonthlyReport(showEmpty = true){
  const box = document.getElementById("monthlyReport");
  if(!box || !isAdmin) return;
  const report = getMonthlySummary();
  if(report.rows.length === 0){
    box.innerHTML = showEmpty ? `<p>${t[lang].reportNoData}</p>` : "";
    return;
  }
  box.innerHTML = `
    <p><b>${t[lang].reportGenerated}</b>: ${report.month}</p>
    <p>${t[lang].totalHours}: <b>${formatMinutes(report.total)}</b><br>${t[lang].reportDays}: <b>${report.days}</b></p>
    <div class="record">
      ${report.rows.map(r => `
        <b>${r.worker}</b> — ${r.site}<br>
        ${r.date}: ${t[lang].arrival} ${r.startTime} / ${t[lang].departure} ${r.endTime}<br>
        ${t[lang].duration}: ${formatMinutes(r.minutes)}
      `).join("<hr>")}
    </div>`;
}

function printMonthlyReport(){
  if(!isAdmin) return;
  const report = getMonthlySummary();
  if(report.rows.length === 0){alert(t[lang].reportNoData); return;}
  const title = `Smurfex - ${t[lang].reportTitle} ${report.month}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;color:#111} h1{margin-bottom:4px} table{width:100%;border-collapse:collapse;margin-top:18px} th,td{border:1px solid #999;padding:8px;text-align:left;font-size:13px} th{background:#eee}.sum{margin-top:12px;font-size:16px}</style>
    </head><body>
    <h1>Smurfex s.r.o. - ${t[lang].reportTitle}</h1>
    <div>${t[lang].reportMonth}: <b>${report.month}</b></div>
    <div>${t[lang].reportWorker}: <b>${report.worker || t[lang].allWorkers}</b></div>
    <div class="sum">${t[lang].totalHours}: <b>${formatMinutes(report.total)}</b> | ${t[lang].reportDays}: <b>${report.days}</b></div>
    <table><thead><tr><th>Dátum</th><th>Pracovník</th><th>Stavba</th><th>${t[lang].arrival}</th><th>${t[lang].departure}</th><th>${t[lang].duration}</th></tr></thead><tbody>
    ${report.rows.map(r => `<tr><td>${r.date}</td><td>${r.worker}</td><td>${r.site}</td><td>${r.startTime}</td><td>${r.endTime}</td><td>${formatMinutes(r.minutes)}</td></tr>`).join("")}
    </tbody></table>
    <script>window.onload=function(){window.print();}</script></body></html>`;
  const w = window.open("", "_blank");
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function exportMonthlyCSV(){
  if(!isAdmin) return;
  const report = getMonthlySummary();
  if(report.rows.length === 0){alert(t[lang].reportNoData); return;}
  const header = "Date;Worker;Site;Arrival;Departure;Minutes;Duration\n";
  const rows = report.rows.map(r => `${r.date};${r.worker};${r.site};${r.startTime};${r.endTime};${r.minutes};${formatMinutes(r.minutes)}`).join("\n");
  const blob = new Blob([header + rows], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `smurfex-vykaz-${report.month}-${report.worker || "vsetci"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(){
  if(!isAdmin) return;
  if(currentRecords.length === 0){alert(t[lang].noExport);return;}
  const header = "Date;Time;Worker;Site;Type;Latitude;Longitude;Accuracy;Map;Photo\n";
  const rows = currentRecords.map(r =>
    `${r.datum || ""};${r.cas || ""};${r.pracovnik || ""};${r.stavba || ""};${t.en[r.typ] || r.typ || ""};${r.latitude || ""};${r.longitude || ""};${r.accuracy || ""};${r.mapUrl || ""};${r.photoData ? "yes" : "no"}`
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
