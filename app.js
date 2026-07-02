const key = "smurfex_dochadzka_records";
const adminKey = "smurfex_admin_logged";
const ADMIN_PIN = "2580";
let lang = localStorage.getItem("smurfex_lang") || "sk";

const t = {
  sk: {
    title:"Dochádzka",
    subtitle:"Jednoduchá evidencia príchodu a odchodu",
    workerLabel:"Meno pracovníka",
    workerPlaceholder:"napr. Ján Novák",
    siteLabel:"Stavba",
    sitePlaceholder:"napr. STRABAG / Nitra",
    startBtn:"PRIŠIEL SOM",
    endBtn:"ODCHÁDZAM",
    todayTitle:"Dnešné záznamy",
    adminBtn:"Admin",
    adminMode:"Administrátor",
    logoutBtn:"Odhlásiť admina",
    exportBtn:"Export CSV",
    clearBtn:"Vymazať záznamy",
    noRecords:"Zatiaľ žiadne záznamy.",
    fillAlert:"Vyplň meno pracovníka aj stavbu.",
    saved:"uložený",
    start:"PRÍCHOD",
    end:"ODCHOD",
    site:"Stavba",
    noExport:"Nie sú žiadne záznamy.",
    confirmClear:"Naozaj vymazať všetky záznamy v tomto mobile?",
    pinPrompt:"Zadaj administrátorský PIN:",
    wrongPin:"Nesprávny PIN.",
    adminLogged:"Admin režim zapnutý.",
    adminLoggedOut:"Admin režim vypnutý."
  },
  en: {
    title:"Attendance",
    subtitle:"Simple check-in and check-out record",
    workerLabel:"Worker name",
    workerPlaceholder:"e.g. John Smith",
    siteLabel:"Construction site",
    sitePlaceholder:"e.g. STRABAG / Nitra",
    startBtn:"I ARRIVED",
    endBtn:"I AM LEAVING",
    todayTitle:"Today's records",
    adminBtn:"Admin",
    adminMode:"Administrator",
    logoutBtn:"Log out admin",
    exportBtn:"Export CSV",
    clearBtn:"Clear records",
    noRecords:"No records yet.",
    fillAlert:"Fill in worker name and construction site.",
    saved:"saved",
    start:"ARRIVAL",
    end:"DEPARTURE",
    site:"Site",
    noExport:"There are no records.",
    confirmClear:"Do you really want to delete all records on this phone?",
    pinPrompt:"Enter administrator PIN:",
    wrongPin:"Wrong PIN.",
    adminLogged:"Admin mode enabled.",
    adminLoggedOut:"Admin mode disabled."
  }
};

function isAdmin(){return localStorage.getItem(adminKey) === "yes"}

function updateAdminView(){
  const login = document.getElementById("admin-login");
  const panel = document.getElementById("admin-panel");
  if(!login || !panel) return;
  login.style.display = isAdmin() ? "none" : "block";
  panel.style.display = isAdmin() ? "block" : "none";
}

function adminLogin(){
  const pin = prompt(t[lang].pinPrompt);
  if(pin === ADMIN_PIN){
    localStorage.setItem(adminKey, "yes");
    document.getElementById("status").innerText = t[lang].adminLogged;
    updateAdminView();
  } else if(pin !== null){
    alert(t[lang].wrongPin);
  }
}

function adminLogout(){
  localStorage.removeItem(adminKey);
  document.getElementById("status").innerText = t[lang].adminLoggedOut;
  updateAdminView();
}

function setLang(l){
  lang = l;
  localStorage.setItem("smurfex_lang", lang);
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.innerText = t[lang][el.dataset.i18n];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.placeholder = t[lang][el.dataset.i18nPlaceholder];
  });
  document.getElementById("btn-sk").classList.toggle("active", lang === "sk");
  document.getElementById("btn-en").classList.toggle("active", lang === "en");
  updateAdminView();
  renderRecords();
}

function loadRecords(){return JSON.parse(localStorage.getItem(key) || "[]")}
function saveRecords(records){localStorage.setItem(key, JSON.stringify(records))}

function saveRecord(type){
  const worker = document.getElementById("worker").value.trim();
  const site = document.getElementById("site").value.trim();
  if(!worker || !site){alert(t[lang].fillAlert);return}

  const now = new Date();
  const record = {
    datum: now.toLocaleDateString("sk-SK"),
    cas: now.toLocaleTimeString("sk-SK", {hour:"2-digit", minute:"2-digit"}),
    pracovnik: worker,
    stavba: site,
    typ: type
  };

  const records = loadRecords();
  records.unshift(record);
  saveRecords(records);
  document.getElementById("status").innerText = t[lang][type] + " " + t[lang].saved + ": " + record.cas;
  renderRecords();
}

function renderRecords(){
  const records = loadRecords();
  const box = document.getElementById("records");
  if(records.length === 0){box.innerHTML = `<p>${t[lang].noRecords}</p>`;return}
  box.innerHTML = records.map(r => `
    <div class="record">
      <b>${t[lang][r.typ] || r.typ}</b> – ${r.pracovnik}<br>
      ${r.datum} ${r.cas}<br>
      ${t[lang].site}: ${r.stavba}
    </div>`).join("");
}

function exportCSV(){
  if(!isAdmin()){adminLogin(); return;}
  const records = loadRecords();
  if(records.length === 0){alert(t[lang].noExport);return}
  const header = "Date;Time;Worker;Site;Type\n";
  const rows = records.map(r => `${r.datum};${r.cas};${r.pracovnik};${r.stavba};${t.en[r.typ]}`).join("\n");
  const blob = new Blob([header + rows], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "smurfex-attendance.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function clearRecords(){
  if(!isAdmin()){adminLogin(); return;}
  if(confirm(t[lang].confirmClear)){
    localStorage.removeItem(key);
    renderRecords();
  }
}

if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js")}
setLang(lang);
