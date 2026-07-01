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
    siteLabel:"Stavba",
    sitePlaceholder:"Vyber stavbu",
    startBtn:"PRIŠIEL SOM",
    endBtn:"ODCHÁDZAM",
    todayTitle:"Všetky záznamy",
    exportBtn:"Export CSV",
    clearBtn:"Vymazať záznamy",
    noRecords:"Zatiaľ žiadne záznamy.",
    fillAlert:"Vyber pracovníka aj stavbu.",
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
    saveError:"Chyba uloženia. Skontroluj internet alebo Firestore pravidlá."
  },
  en: {
    title:"Attendance",
    subtitle:"Online check-in and check-out record",
    workerLabel:"Worker",
    workerPlaceholder:"Select worker",
    siteLabel:"Construction site",
    sitePlaceholder:"Select site",
    startBtn:"I ARRIVED",
    endBtn:"I AM LEAVING",
    todayTitle:"All records",
    exportBtn:"Export CSV",
    clearBtn:"Clear records",
    noRecords:"No records yet.",
    fillAlert:"Select worker and construction site.",
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
    saveError:"Save error. Check internet or Firestore rules."
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

function setLang(l){
  lang = l;
  localStorage.setItem("smurfex_lang", lang);
  document.documentElement.lang = lang;
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
  renderRecords();
}

function renderAdminState(){
  document.getElementById("adminPanel").style.display = isAdmin ? "block" : "none";
  document.getElementById("adminLoginBtn").style.display = isAdmin ? "none" : "inline-block";
  document.getElementById("adminLogoutBtn").style.display = isAdmin ? "inline-block" : "none";
  if(isAdmin) startAdminListener();
}

function adminLogin(){
  const pin = prompt("ADMIN PIN");
  if(pin === ADMIN_PIN){
    isAdmin = true;
    localStorage.setItem("smurfex_admin", "1");
    renderAdminState();
  } else {
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
}

async function saveRecord(type){
  const worker = document.getElementById("worker").value.trim();
  const site = document.getElementById("site").value.trim();
  if(!worker || !site){alert(t[lang].fillAlert);return}

  const now = new Date();
  const record = {
    datum: now.toLocaleDateString("sk-SK"),
    cas: now.toLocaleTimeString("sk-SK", {hour:"2-digit", minute:"2-digit"}),
    dateISO: now.toISOString().slice(0,10),
    createdAtLocal: now.toISOString(),
    pracovnik: worker,
    stavba: site,
    typ: type,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  document.getElementById("status").innerText = t[lang].saving;

  try{
    await recordsCol.add(record);
    localStorage.setItem(key, JSON.stringify(record));
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
    renderRecords();
  }, err => {
    console.error(err);
    document.getElementById("syncStatus").innerText = "Firestore error";
  });
}

function renderRecords(){
  const box = document.getElementById("records");
  if(!box || !isAdmin) return;
  if(currentRecords.length === 0){box.innerHTML = `<p>${t[lang].noRecords}</p>`;return}
  box.innerHTML = currentRecords.map(r => `
    <div class="record">
      <b>${t[lang][r.typ] || r.typ}</b> – ${r.pracovnik || ""}<br>
      ${r.datum || ""} ${r.cas || ""}<br>
      ${t[lang].site}: ${r.stavba || ""}
    </div>`).join("");
}

function exportCSV(){
  if(!isAdmin) return;
  if(currentRecords.length === 0){alert(t[lang].noExport);return}
  const header = "Date;Time;Worker;Site;Type
";
  const rows = currentRecords.map(r =>
    `${r.datum || ""};${r.cas || ""};${r.pracovnik || ""};${r.stavba || ""};${t.en[r.typ] || r.typ || ""}`
  ).join("
");
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

if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js")}
setLang(lang);
