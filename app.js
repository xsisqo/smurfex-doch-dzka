const ADMIN_PIN = "2580";
const APP_VERSION = "1.1.0-auto-background";
const key = "smurfex_dochadzka_records_backup";
let lang = localStorage.getItem("smurfex_lang") || "sk";
let isAdmin = localStorage.getItem("smurfex_admin") === "1";
let currentRecords = [];
let currentRequests = [];
let unsubscribeRecords = null;
let unsubscribeRequests = null;

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


const DEFAULT_HOURLY_RATES = {
  "Mohit Kumar": 6,
  "Gurwinder Singh": 6,
  "Pradip Majumder": 6,
  "Jatinder Singh": 5,
  "Vlado Hatala": 8,
  "Fero Maslík": 8,
  "Milan Sedliak": 8
};

const DEFAULT_LUNCH_MINUTES = {
  "Mohit Kumar": 30,
  "Gurwinder Singh": 30,
  "Pradip Majumder": 60,
  "Jatinder Singh": 30,
  "Vlado Hatala": 60,
  "Fero Maslík": 60,
  "Milan Sedliak": 60
};

function getHourlyRates(){
  try{
    return { ...DEFAULT_HOURLY_RATES, ...JSON.parse(localStorage.getItem("smurfex_hourly_rates") || "{}") };
  }catch(e){
    return { ...DEFAULT_HOURLY_RATES };
  }
}

function saveHourlyRatesToStorage(rates){
  localStorage.setItem("smurfex_hourly_rates", JSON.stringify(rates));
}

function getLunchMinutes(){
  try{
    return { ...DEFAULT_LUNCH_MINUTES, ...JSON.parse(localStorage.getItem("smurfex_lunch_minutes") || "{}") };
  }catch(e){
    return { ...DEFAULT_LUNCH_MINUTES };
  }
}

function saveLunchMinutesToStorage(lunch){
  localStorage.setItem("smurfex_lunch_minutes", JSON.stringify(lunch));
}

const SITES = [
  "STRABAG letisko",
  "STRABAG nemocnica"
];

const SITE_COORDS = {
  "STRABAG letisko": { lat: 48.6379611, lng: 19.1356756 },
  "STRABAG nemocnica": { lat: 48.744191282, lng: 19.119472504 }
};

const GEOFENCE_RADIUS_METERS = 3000;
const AUTO_CHECKIN_DELAY_MS = 5 * 60 * 1000;
const AUTO_CHECKOUT_DELAY_MS = 15 * 60 * 1000;
const DRIVER_EXEMPT_WORKERS = ["Pradip Majumder", "Vlado Hatala"];
const MASTER_EXEMPT_WORKERS = [];
const DRIVER_DAILY_BONUS_MINUTES = 60;
let autoWatchId = null;
let autoInsideSince = null;
let autoOutsideSince = null;
let autoLastActionKey = localStorage.getItem("smurfex_auto_last_action") || "";

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
const requestsCol = db.collection("requests");

const t = {
  sk: {
    title:"Dochádzka",
    subtitle:"Online evidencia príchodu a odchodu",
    attendanceNotice:"⚠️ Dochádzku zaznamenávajte až po fyzickom príchode na pracovisko. Prihlásenie mimo stavby nie je povolené. Výnimku majú šoféri a pracovníci vykonávajúci dopravu.",
    requestTitle:"Požiadavka pre admina",
    requestHint:"Ak potrebuješ materiál, náradie alebo máš inú požiadavku, napíš ju sem.",
    requestTypeLabel:"Typ požiadavky",
    requestMaterial:"Materiál",
    requestTool:"Náradie",
    requestTransport:"Doprava",
    requestOther:"Iné",
    requestTextLabel:"Text požiadavky",
    requestTextPlaceholder:"Napr. potrebujeme sadrokartón, skrutky, penu, kotúče...",
    sendRequestBtn:"Odoslať požiadavku",
    requestSent:"Požiadavka bola odoslaná adminovi.",
    requestFill:"Vyber pracovníka, stavbu, zadaj PIN a napíš požiadavku.",
    requestError:"Požiadavku sa nepodarilo odoslať.",
    adminRequestsTitle:"Požiadavky pracovníkov",
    noRequests:"Zatiaľ nie sú žiadne požiadavky.",
    markDone:"Vybavené",
    requestStatusOpen:"Čaká",
    requestStatusDone:"Vybavené",
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
    sitesDashboardTitle:"Dashboard stavieb",
    peopleOnSite:"Aktuálne na stavbe",
    siteHoursToday:"Hodiny dnes na stavbe",
    noSiteWorkers:"Na tejto stavbe dnes zatiaľ nikto nie je.",
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
    geofenceError:"Nachádzate sa mimo povoleného okruhu stavby. Dochádzku je možné zapísať iba priamo na stavbe.",
    geofenceDistance:"Vzdialenosť od stavby",
    geofenceOk:"Poloha je v povolenom okruhu stavby.",
    weatherTitle:"Počasie na stavbe",
    weatherLoad:"Načítať počasie",
    weatherLoading:"Načítavam počasie...",
    weatherError:"Počasie sa nepodarilo načítať.",
    temperature:"Teplota",
    wind:"Vietor",
    rain:"Zrážky",
    weatherHint:"Vyber stavbu a zobrazí sa aktuálne počasie.",
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
    calendarTitle:"Kalendár pracovníka",
    calendarWorker:"Pracovník",
    calendarMonth:"Mesiac",
    showCalendarBtn:"Zobraziť kalendár",
    calendarNoData:"Pre vybraný mesiac nie sú záznamy.",
    calendarProblem:"Chýba odchod",
    calendarOk:"OK",
    calendarDay:"Deň",
    calendarStatus:"Stav",
    filterTitle:"Filter záznamov",
    filterWorker:"Pracovník",
    filterSite:"Stavba",
    filterDate:"Dátum",
    filterType:"Typ",
    filterAllTypes:"Všetko",
    filterSearch:"Hľadať",
    filterSearchPlaceholder:"Meno, stavba, dátum...",
    resetFilterBtn:"Reset filtra",
    filteredCount:"Zobrazené záznamy",
    arrival:"Príchod",
    departure:"Odchod",
    duration:"Trvanie",
    driver:"Šofér",
    driverExempt:"Šofér – výnimka z geofencingu",
    wageTitle:"Mzdy a hodinové sadzby",
    wageHint:"Hodinové sadzby a obedy sú prednastavené podľa Smurfex. Vieš ich upraviť a uložiť v tomto admin zariadení.",
    hourlyRate:"Hodinová sadzba",
    lunchBreak:"Obed",
    paidHours:"Platené hodiny",
    grossHours:"Hrubé hodiny",
    totalLunch:"Obedy spolu",
    saveWageRatesBtn:"Uložiť sadzby a obedy",
    wageRatesSaved:"Hodinové sadzby a obedy boli uložené.",
    monthlyWageTitle:"Mesačný výpočet mzdy",
    wageAmount:"Mzda",
    totalWage:"Spolu mzda",
    rateNotSet:"Sadzba nie je nastavená"
  },
  en: {
    title:"Attendance",
    subtitle:"Online check-in and check-out record",
    attendanceNotice:"⚠️ Please record attendance only after physically arriving at the workplace. Attendance registration outside the construction site is not permitted. Drivers and transport personnel are exempt.",
    requestTitle:"Request for admin",
    requestHint:"If you need material, tools or anything else, write the request here.",
    requestTypeLabel:"Request type",
    requestMaterial:"Material",
    requestTool:"Tools",
    requestTransport:"Transport",
    requestOther:"Other",
    requestTextLabel:"Request text",
    requestTextPlaceholder:"E.g. we need plasterboard, screws, foam, cutting discs...",
    sendRequestBtn:"Send request",
    requestSent:"The request has been sent to admin.",
    requestFill:"Select worker, site, enter PIN and write the request.",
    requestError:"The request could not be sent.",
    adminRequestsTitle:"Worker requests",
    noRequests:"No requests yet.",
    markDone:"Done",
    requestStatusOpen:"Open",
    requestStatusDone:"Done",
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
    sitesDashboardTitle:"Sites dashboard",
    peopleOnSite:"Currently on site",
    siteHoursToday:"Hours today on site",
    noSiteWorkers:"No one has checked in on this site today yet.",
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
    geofenceError:"You are outside the allowed site radius. Attendance can only be recorded directly at the construction site.",
    geofenceDistance:"Distance from site",
    geofenceOk:"Location is within the allowed site radius.",
    weatherTitle:"Site weather",
    weatherLoad:"Load weather",
    weatherLoading:"Loading weather...",
    weatherError:"Weather could not be loaded.",
    temperature:"Temperature",
    wind:"Wind",
    rain:"Rain",
    weatherHint:"Select a site to show current weather.",
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
    calendarTitle:"Worker calendar",
    calendarWorker:"Worker",
    calendarMonth:"Month",
    showCalendarBtn:"Show calendar",
    calendarNoData:"No records for selected month.",
    calendarProblem:"Missing departure",
    calendarOk:"OK",
    calendarDay:"Day",
    calendarStatus:"Status",
    filterTitle:"Record filter",
    filterWorker:"Worker",
    filterSite:"Site",
    filterDate:"Date",
    filterType:"Type",
    filterAllTypes:"All",
    filterSearch:"Search",
    filterSearchPlaceholder:"Name, site, date...",
    resetFilterBtn:"Reset filter",
    filteredCount:"Shown records",
    arrival:"Arrival",
    departure:"Departure",
    duration:"Duration",
    driver:"Driver",
    driverExempt:"Driver – geofencing exception",
    wageTitle:"Wages and hourly rates",
    wageHint:"Hourly rates and lunch breaks are preset for Smurfex. You can edit and save them on this admin device.",
    hourlyRate:"Hourly rate",
    lunchBreak:"Lunch",
    paidHours:"Paid hours",
    grossHours:"Gross hours",
    totalLunch:"Total lunch",
    saveWageRatesBtn:"Save rates and lunch",
    wageRatesSaved:"Hourly rates and lunch breaks have been saved.",
    monthlyWageTitle:"Monthly wage calculation",
    wageAmount:"Wage",
    totalWage:"Total wage",
    rateNotSet:"Rate is not set"

  },
  hi: {
    title:"उपस्थिति",
    subtitle:"ऑनलाइन आने और जाने का रिकॉर्ड",
    attendanceNotice:"⚠️ कृपया कार्यस्थल पर शारीरिक रूप से पहुँचने के बाद ही उपस्थिति दर्ज करें। निर्माण स्थल के बाहर उपस्थिति दर्ज करना अनुमति नहीं है। ड्राइवरों और परिवहन कर्मचारियों को छूट है।",
    requestTitle:"एडमिन के लिए अनुरोध",
    requestHint:"यदि आपको सामग्री, औज़ार या कोई अन्य चीज़ चाहिए, तो यहाँ लिखें।",
    requestTypeLabel:"अनुरोध का प्रकार",
    requestMaterial:"सामग्री",
    requestTool:"औज़ार",
    requestTransport:"परिवहन",
    requestOther:"अन्य",
    requestTextLabel:"अनुरोध का विवरण",
    requestTextPlaceholder:"जैसे: हमें प्लास्टरबोर्ड, स्क्रू, फोम, कटिंग डिस्क चाहिए...",
    sendRequestBtn:"अनुरोध भेजें",
    requestSent:"अनुरोध एडमिन को भेज दिया गया है।",
    requestFill:"कर्मचारी, साइट चुनें, PIN डालें और अनुरोध लिखें।",
    requestError:"अनुरोध भेजा नहीं जा सका।",
    adminRequestsTitle:"कर्मचारियों के अनुरोध",
    noRequests:"अभी कोई अनुरोध नहीं है।",
    markDone:"पूरा हुआ",
    requestStatusOpen:"खुला",
    requestStatusDone:"पूरा हुआ",
    workerLabel:"कर्मचारी",
    workerPlaceholder:"कर्मचारी चुनें",
    pinLabel:"कर्मचारी PIN",
    pinPlaceholder:"PIN दर्ज करें",
    siteLabel:"निर्माण स्थल",
    sitePlaceholder:"साइट चुनें",
    photoLabel:"कर्मचारी की फोटो",
    photoHint:"सेव करने से पहले कर्मचारी की फोटो लें।",
    photoRequired:"कर्मचारी की फोटो आवश्यक है।",
    photoProcessing:"फोटो प्रोसेस हो रही है...",
    photo:"फोटो",
    startBtn:"मैं आ गया हूँ",
    endBtn:"मैं जा रहा हूँ",
    todayTitle:"सभी रिकॉर्ड",
    dashboardTitle:"आज का लाइव अवलोकन",
    sitesDashboardTitle:"साइट डैशबोर्ड",
    peopleOnSite:"वर्तमान में साइट पर",
    siteHoursToday:"आज साइट पर घंटे",
    noSiteWorkers:"आज इस साइट पर अभी तक कोई चेक-इन नहीं हुआ है।",
    notificationsTitle:"नवीनतम घटनाएँ",
    presentNow:"अभी काम पर",
    latestEvents:"नवीनतम रिकॉर्ड",
    exportBtn:"CSV एक्सपोर्ट",
    clearBtn:"रिकॉर्ड हटाएं",
    noRecords:"अभी कोई रिकॉर्ड नहीं है।",
    fillAlert:"कर्मचारी, साइट चुनें और PIN डालें।",
    wrongWorkerPin:"गलत कर्मचारी PIN।",
    saved:"ऑनलाइन सेव हुआ",
    start:"आगमन",
    end:"प्रस्थान",
    site:"साइट",
    noExport:"कोई रिकॉर्ड नहीं है।",
    confirmClear:"क्या आप सच में सभी ऑनलाइन रिकॉर्ड हटाना चाहते हैं?",
    adminTitle:"एडमिन",
    adminLoginBtn:"एडमिन लॉगिन",
    adminLogoutBtn:"एडमिन लॉगआउट",
    wrongPin:"गलत PIN।",
    online:"ऑनलाइन डेटाबेस जुड़ा हुआ है।",
    saving:"सेव हो रहा है...",
    saveError:"सेव करने में त्रुटि। इंटरनेट या Firestore नियम जांचें।",
    gpsGetting:"GPS लोकेशन ली जा रही है...",
    gpsError:"GPS लोकेशन आवश्यक है। ब्राउज़र में लोकेशन अनुमति दें और फिर कोशिश करें।",
    geofenceError:"आप साइट की अनुमति सीमा से बाहर हैं। उपस्थिति केवल निर्माण स्थल पर ही दर्ज की जा सकती है।",
    geofenceDistance:"साइट से दूरी",
    geofenceOk:"लोकेशन साइट की अनुमति सीमा में है।",
    weatherTitle:"साइट का मौसम",
    weatherLoad:"मौसम लोड करें",
    weatherLoading:"मौसम लोड हो रहा है...",
    weatherError:"मौसम लोड नहीं हो सका।",
    temperature:"तापमान",
    wind:"हवा",
    rain:"वर्षा",
    weatherHint:"वर्तमान मौसम देखने के लिए साइट चुनें।",
    map:"मैप खोलें",
    location:"GPS लोकेशन",
    inWork:"काम पर",
    left:"चला गया",
    noToday:"आज अभी कोई उपस्थिति रिकॉर्ड नहीं है।",
    hoursToday:"आज",
    lastTime:"अंतिम समय",
    reportTitle:"मासिक रिपोर्ट",
    reportWorker:"रिपोर्ट के लिए कर्मचारी",
    reportMonth:"महीना",
    showReportBtn:"रिपोर्ट दिखाएं",
    pdfReportBtn:"PDF रिपोर्ट",
    csvReportBtn:"CSV रिपोर्ट",
    allWorkers:"सभी कर्मचारी",
    totalHours:"कुल घंटे",
    reportDays:"दिन",
    reportNoData:"चुने गए महीने के लिए कोई रिकॉर्ड नहीं है।",
    reportGenerated:"रिपोर्ट बनाई गई",
    calendarTitle:"कर्मचारी कैलेंडर",
    calendarWorker:"कर्मचारी",
    calendarMonth:"महीना",
    showCalendarBtn:"कैलेंडर दिखाएं",
    calendarNoData:"चुने गए महीने के लिए कोई रिकॉर्ड नहीं है।",
    calendarProblem:"प्रस्थान गायब है",
    calendarOk:"ठीक है",
    calendarDay:"दिन",
    calendarStatus:"स्थिति",
    filterTitle:"रिकॉर्ड फ़िल्टर",
    filterWorker:"कर्मचारी",
    filterSite:"साइट",
    filterDate:"तारीख",
    filterType:"प्रकार",
    filterAllTypes:"सभी",
    filterSearch:"खोजें",
    filterSearchPlaceholder:"नाम, साइट, तारीख...",
    resetFilterBtn:"फ़िल्टर रीसेट",
    filteredCount:"दिखाए गए रिकॉर्ड",
    arrival:"आगमन",
    departure:"प्रस्थान",
    duration:"अवधि",
    driver:"ड्राइवर",
    driverExempt:"ड्राइवर – जियोफेंसिंग छूट",
    wageTitle:"वेतन और प्रति घंटा दर",
    wageHint:"Smurfex के लिए प्रति घंटा दर और लंच ब्रेक पहले से सेट हैं। एडमिन इन्हें बदलकर सेव कर सकता है।",
    hourlyRate:"प्रति घंटा दर",
    lunchBreak:"लंच",
    paidHours:"पेड घंटे",
    grossHours:"कुल घंटे",
    totalLunch:"कुल लंच",
    saveWageRatesBtn:"दर और लंच सेव करें",
    wageRatesSaved:"प्रति घंटा दर और लंच ब्रेक सेव हो गए हैं।",
    monthlyWageTitle:"मासिक वेतन गणना",
    wageAmount:"वेतन",
    totalWage:"कुल वेतन",
    rateNotSet:"दर सेट नहीं है"
  }
};

function fillSelects(){
  const workerSelect = document.getElementById("worker");
  const siteSelect = document.getElementById("site");
  if(!workerSelect || !siteSelect) return;

  const selectedWorker = workerSelect.value;
  const selectedSite = siteSelect.value;

  workerSelect.innerHTML = `<option value="">${t[lang].workerPlaceholder}</option>` +
    WORKERS.map(name => `<option value="${name}">${name}${DRIVER_EXEMPT_WORKERS.includes(name) ? " 🚛" : ""}</option>`).join("");

  siteSelect.innerHTML = `<option value="">${t[lang].sitePlaceholder}</option>` +
    SITES.map(site => `<option value="${site}">${site}</option>`).join("");

  if(selectedWorker) workerSelect.value = selectedWorker;
  if(selectedSite) siteSelect.value = selectedSite;
  siteSelect.onchange = renderWeatherForSelectedSite;
  renderWeatherForSelectedSite();

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


  const calendarWorker = document.getElementById("calendarWorker");
  if(calendarWorker){
    const selectedCalendarWorker = calendarWorker.value;
    calendarWorker.innerHTML = `<option value="">${t[lang].workerPlaceholder}</option>` +
      WORKERS.map(name => `<option value="${name}">${name}</option>`).join("");
    if(selectedCalendarWorker) calendarWorker.value = selectedCalendarWorker;
  }

  const calendarMonth = document.getElementById("calendarMonth");
  if(calendarMonth && !calendarMonth.value){
    calendarMonth.value = new Date().toISOString().slice(0,7);
  }

  const filterWorker = document.getElementById("filterWorker");
  if(filterWorker){
    const selected = filterWorker.value;
    filterWorker.innerHTML = `<option value="">${t[lang].allWorkers}</option>` +
      WORKERS.map(name => `<option value="${name}">${name}</option>`).join("");
    if(selected) filterWorker.value = selected;
  }

  const filterSite = document.getElementById("filterSite");
  if(filterSite){
    const selected = filterSite.value;
    filterSite.innerHTML = `<option value="">${t[lang].filterAllTypes}</option>` +
      SITES.map(site => `<option value="${site}">${site}</option>`).join("");
    if(selected) filterSite.value = selected;
  }

  const filterType = document.getElementById("filterType");
  if(filterType){
    const selected = filterType.value;
    filterType.innerHTML = `
      <option value="">${t[lang].filterAllTypes}</option>
      <option value="start">${t[lang].start}</option>
      <option value="end">${t[lang].end}</option>`;
    if(selected) filterType.value = selected;
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
  const hiBtn = document.getElementById("btn-hi");
  if(hiBtn) hiBtn.classList.toggle("active", lang === "hi");
  fillSelects();
  renderAdminState();
  fillRequestTypeTexts();
  renderAdminRequests();
  renderNotifications();
  renderNotifications();
  renderDashboard();
  renderSiteDashboard();
  renderRecords();
  renderMonthlyReport(false);
  renderWorkerCalendar(false);
  renderWageSettings();
}

function renderAdminState(){
  const adminPanel = document.getElementById("adminPanel");
  const adminLoginBtn = document.getElementById("adminLoginBtn");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");
  if(!adminPanel || !adminLoginBtn || !adminLogoutBtn) return;

  adminPanel.style.display = isAdmin ? "block" : "none";
  adminLoginBtn.style.display = isAdmin ? "none" : "inline-block";
  adminLogoutBtn.style.display = isAdmin ? "inline-block" : "none";
  if(isAdmin){ startAdminListener(); startRequestListener(); renderWageSettings(); }
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
  if(unsubscribeRequests){
    unsubscribeRequests();
    unsubscribeRequests = null;
  }
  currentRecords = [];
  currentRequests = [];
  renderAdminState();
  fillRequestTypeTexts();
  renderAdminRequests();
  renderNotifications();
  renderDashboard();
  renderSiteDashboard();
  renderRecords();
}


function fillRequestTypeTexts(){
  const type = document.getElementById("requestType");
  if(type){
    const selected = type.value || "material";
    type.innerHTML = `
      <option value="material">${t[lang].requestMaterial}</option>
      <option value="tool">${t[lang].requestTool}</option>
      <option value="transport">${t[lang].requestTransport}</option>
      <option value="other">${t[lang].requestOther}</option>`;
    type.value = selected;
  }
}

async function sendWorkerRequest(){
  const worker = document.getElementById("worker") ? document.getElementById("worker").value.trim() : "";
  const site = document.getElementById("site") ? document.getElementById("site").value.trim() : "";
  const pin = document.getElementById("workerPin") ? document.getElementById("workerPin").value.trim() : "";
  const type = document.getElementById("requestType") ? document.getElementById("requestType").value : "other";
  const textEl = document.getElementById("requestText");
  const text = textEl ? textEl.value.trim() : "";
  const status = document.getElementById("requestStatus");

  if(!worker || !site || !pin || !text){ alert(t[lang].requestFill); return; }
  if(WORKER_PINS[worker] !== pin){ alert(t[lang].wrongWorkerPin); return; }

  const now = new Date();
  const request = {
    pracovnik: worker,
    stavba: site,
    typ: type,
    text: text,
    status: "open",
    datum: now.toLocaleDateString("sk-SK"),
    cas: now.toLocaleTimeString("sk-SK", {hour:"2-digit", minute:"2-digit"}),
    dateISO: now.toISOString().slice(0,10),
    createdAtLocal: now.toISOString(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try{
    await requestsCol.add(request);
    if(textEl) textEl.value = "";
    if(status) status.innerText = t[lang].requestSent;
  }catch(e){
    console.error(e);
    alert(t[lang].requestError);
    if(status) status.innerText = t[lang].requestError;
  }
}

function startRequestListener(){
  if(unsubscribeRequests) return;
  unsubscribeRequests = requestsCol.orderBy("createdAtLocal", "desc").onSnapshot(snapshot => {
    currentRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderAdminRequests();
  }, err => {
    console.error(err);
  });
}

function requestTypeText(type){
  if(type === "material") return t[lang].requestMaterial;
  if(type === "tool") return t[lang].requestTool;
  if(type === "transport") return t[lang].requestTransport;
  return t[lang].requestOther;
}

function renderAdminRequests(){
  const box = document.getElementById("adminRequests");
  if(!box) return;
  if(!isAdmin){ box.innerHTML = ""; return; }
  if(currentRequests.length === 0){ box.innerHTML = `<p>${t[lang].noRequests}</p>`; return; }
  box.innerHTML = currentRequests.slice(0, 20).map(r => `
    <div class="record">
      <b>${r.status === "done" ? "✅" : "🟡"} ${requestTypeText(r.typ)}</b> — ${r.pracovnik || ""}<br>
      ${r.datum || ""} ${r.cas || ""}<br>
      ${t[lang].site}: ${r.stavba || ""}<br>
      <p>${(r.text || "").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
      <b>${r.status === "done" ? t[lang].requestStatusDone : t[lang].requestStatusOpen}</b>
      ${r.status !== "done" ? `<br><button class="small" onclick="markRequestDone('${r.id}')">${t[lang].markDone}</button>` : ""}
    </div>`).join("");
}

async function markRequestDone(id){
  if(!isAdmin || !id) return;
  await requestsCol.doc(id).update({ status:"done", doneAtLocal:new Date().toISOString() });
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


function degreesToRadians(value){
  return value * Math.PI / 180;
}

function distanceMeters(lat1, lng1, lat2, lng2){
  const earthRadius = 6371000;
  const dLat = degreesToRadians(lat2 - lat1);
  const dLng = degreesToRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function checkGeofence(worker, site, gps){
  const sitePosition = SITE_COORDS[site];
  if(!sitePosition || DRIVER_EXEMPT_WORKERS.includes(worker) || MASTER_EXEMPT_WORKERS.includes(worker)){
    return { ok: true, distance: null };
  }
  const distance = distanceMeters(gps.lat, gps.lng, sitePosition.lat, sitePosition.lng);
  return { ok: distance <= GEOFENCE_RADIUS_METERS, distance };
}

function weatherCodeText(code){
  const mapSk = {
    0:"Jasno", 1:"Prevažne jasno", 2:"Polooblačno", 3:"Zamračené",
    45:"Hmla", 48:"Námraza", 51:"Slabé mrholenie", 53:"Mrholenie", 55:"Silné mrholenie",
    61:"Slabý dážď", 63:"Dážď", 65:"Silný dážď", 71:"Slabé sneženie", 73:"Sneženie", 75:"Silné sneženie",
    80:"Prehánky", 81:"Silné prehánky", 82:"Prudké prehánky", 95:"Búrka"
  };
  const mapEn = {
    0:"Clear", 1:"Mostly clear", 2:"Partly cloudy", 3:"Overcast",
    45:"Fog", 48:"Rime fog", 51:"Light drizzle", 53:"Drizzle", 55:"Heavy drizzle",
    61:"Light rain", 63:"Rain", 65:"Heavy rain", 71:"Light snow", 73:"Snow", 75:"Heavy snow",
    80:"Showers", 81:"Heavy showers", 82:"Violent showers", 95:"Thunderstorm"
  };
  const mapHi = {
    0:"साफ", 1:"अधिकतर साफ", 2:"आंशिक बादल", 3:"बादल छाए हुए",
    45:"कोहरा", 48:"ठंडा कोहरा", 51:"हल्की बूंदाबांदी", 53:"बूंदाबांदी", 55:"तेज़ बूंदाबांदी",
    61:"हल्की बारिश", 63:"बारिश", 65:"तेज़ बारिश", 71:"हल्की बर्फ", 73:"बर्फ", 75:"तेज़ बर्फ",
    80:"बारिश की बौछारें", 81:"तेज़ बौछारें", 82:"बहुत तेज़ बौछारें", 95:"तूफ़ान"
  };
  const maps = { sk: mapSk, en: mapEn, hi: mapHi };
  return (maps[lang] || mapSk)[code] || (lang === "hi" ? "मौसम" : (lang === "en" ? "Weather" : "Počasie"));
}

async function renderWeatherForSelectedSite(){
  const box = document.getElementById("weatherBox");
  const siteSelect = document.getElementById("site");
  if(!box || !siteSelect) return;
  const site = siteSelect.value;
  const coords = SITE_COORDS[site];
  if(!site || !coords){
    box.innerHTML = `<p>${t[lang].weatherHint}</p>`;
    return;
  }
  box.innerHTML = `<p>${t[lang].weatherLoading}</p>`;
  try{
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&timezone=auto`;
    const response = await fetch(url);
    if(!response.ok) throw new Error("Weather error");
    const data = await response.json();
    const c = data.current || {};
    box.innerHTML = `
      <div class="record">
        <b>${site}</b><br>
        🌤 ${weatherCodeText(c.weather_code)}<br>
        🌡 ${t[lang].temperature}: ${Math.round(c.temperature_2m)} °C<br>
        💨 ${t[lang].wind}: ${Math.round(c.wind_speed_10m || 0)} km/h<br>
        🌧 ${t[lang].rain}: ${c.precipitation || 0} mm
      </div>`;
  }catch(e){
    console.error(e);
    box.innerHTML = `<p>${t[lang].weatherError}</p>`;
  }
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

  const geofence = checkGeofence(worker, site, gps);
  if(!geofence.ok){
    const message = `${t[lang].geofenceError} ${t[lang].geofenceDistance}: ${geofence.distance} m / ${GEOFENCE_RADIUS_METERS} m.`;
    alert(message);
    document.getElementById("status").innerText = message;
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
    siteLatitude: SITE_COORDS[site] ? SITE_COORDS[site].lat : null,
    siteLongitude: SITE_COORDS[site] ? SITE_COORDS[site].lng : null,
    geofenceDistance: geofence.distance,
    geofenceRadius: GEOFENCE_RADIUS_METERS,
    isDriver: DRIVER_EXEMPT_WORKERS.includes(worker),
    driverExempt: DRIVER_EXEMPT_WORKERS.includes(worker),
    isMaster: MASTER_EXEMPT_WORKERS.includes(worker),
    photoData: photoData,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  document.getElementById("status").innerText = t[lang].saving;

  try{
    await recordsCol.add(record);
    localStorage.setItem(key, JSON.stringify(record));
    rememberAutoCredentials(worker, site, pin, true);
    setTimeout(() => startAutoAttendance(true), 700);
    document.getElementById("workerPin").value = "";
    const selfieInput = document.getElementById("selfie");
    if(selfieInput) selfieInput.value = "";
    document.getElementById("status").innerText = t[lang][type] + " " + t[lang].saved + ": " + record.cas + " — " + (record.isDriver ? t[lang].driverExempt : t[lang].geofenceOk);
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
    renderSiteDashboard();
    renderRecords();
    renderMonthlyReport(false);
    renderWorkerCalendar(false);
  renderWorkerCalendar(false);
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

function renderSiteDashboard(){
  const box = document.getElementById("siteDashboard");
  if(!box) return;
  if(!isAdmin){ box.innerHTML = ""; return; }

  const data = getTodaySummary();
  const bySite = {};
  SITES.forEach(site => bySite[site] = []);
  data.forEach(s => {
    const site = s.site || "Bez stavby";
    if(!bySite[site]) bySite[site] = [];
    bySite[site].push(s);
  });

  box.innerHTML = Object.keys(bySite).map(site => {
    const workers = bySite[site];
    const present = workers.filter(w => w.status === "in").length;
    const totalMinutes = workers.reduce((sum,w) => sum + (w.minutes || 0), 0);
    const rows = workers.length ? workers.map(w => `
      <div style="margin-top:8px">
        ${w.status === "in" ? "🟢" : "🔴"} <b>${w.worker}</b><br>
        ${w.status === "in" ? t[lang].inWork : t[lang].left} · ${t[lang].hoursToday}: ${formatMinutes(w.minutes)} · ${t[lang].lastTime}: ${w.lastTime || "-"}
      </div>
    `).join("") : `<p>${t[lang].noSiteWorkers}</p>`;

    return `
      <div class="record">
        <b>🏗 ${site}</b><br>
        ${t[lang].peopleOnSite}: <b>${present}</b><br>
        ${t[lang].siteHoursToday}: <b>${formatMinutes(totalMinutes)}</b>
        ${rows}
      </div>`;
  }).join("");
}


function getWorkerMonthRecords(worker, month){
  return currentRecords
    .filter(r => !worker || r.pracovnik === worker)
    .filter(r => (r.dateISO || "").slice(0,7) === month)
    .slice()
    .sort((a,b) => (a.createdAtLocal || "").localeCompare(b.createdAtLocal || ""));
}

function buildCalendarDays(records){
  const days = {};
  records.forEach(r => {
    const day = r.dateISO || "";
    if(!day) return;
    if(!days[day]) days[day] = [];
    days[day].push(r);
  });

  return Object.keys(days).sort().map(day => {
    const recs = days[day].sort((a,b) => (a.createdAtLocal || "").localeCompare(b.createdAtLocal || ""));
    let openStart = null;
    let minutes = 0;
    const pairs = [];
    let site = recs[0] ? (recs[0].stavba || "") : "";

    recs.forEach(r => {
      if(r.stavba) site = r.stavba;
      if(r.typ === "start") openStart = r;
      if(r.typ === "end"){
        if(openStart){
          const mins = minutesBetween(openStart.createdAtLocal, r.createdAtLocal);
          minutes += mins;
          pairs.push({ start: openStart.cas || "", end: r.cas || "", minutes: mins });
          openStart = null;
        } else {
          pairs.push({ start: "-", end: r.cas || "", minutes: 0 });
        }
      }
    });

    if(openStart){
      const mins = minutesBetween(openStart.createdAtLocal, new Date().toISOString());
      minutes += mins;
      pairs.push({ start: openStart.cas || "", end: "-", minutes: mins, open: true });
    }

    return { day, site, pairs, minutes, problem: !!openStart };
  });
}

function renderWorkerCalendar(showEmpty = true){
  const box = document.getElementById("workerCalendar");
  if(!box || !isAdmin) return;
  const workerEl = document.getElementById("calendarWorker");
  const monthEl = document.getElementById("calendarMonth");
  const worker = workerEl ? workerEl.value : "";
  const month = monthEl ? monthEl.value : new Date().toISOString().slice(0,7);
  if(!worker){
    box.innerHTML = showEmpty ? `<p>${t[lang].workerPlaceholder}</p>` : "";
    return;
  }
  const records = getWorkerMonthRecords(worker, month);
  const days = buildCalendarDays(records);
  if(days.length === 0){
    box.innerHTML = showEmpty ? `<p>${t[lang].calendarNoData}</p>` : "";
    return;
  }
  const total = days.reduce((sum,d) => sum + d.minutes, 0);
  box.innerHTML = `
    <p><b>${worker}</b> — ${month}<br>${t[lang].totalHours}: <b>${formatMinutes(total)}</b> · ${t[lang].reportDays}: <b>${days.length}</b></p>
    <div class="record">
      ${days.map(d => `
        <b>${d.day}</b> — ${d.site || ""}<br>
        ${d.pairs.map(p => `${t[lang].arrival}: ${p.start} / ${t[lang].departure}: ${p.end} — ${formatMinutes(p.minutes)}`).join("<br>")}<br>
        ${t[lang].calendarStatus}: <b>${d.problem ? "⚠️ " + t[lang].calendarProblem : "✅ " + t[lang].calendarOk}</b>
      `).join("<hr>")}
    </div>`;
}

function getFilteredRecords(){
  const worker = document.getElementById("filterWorker") ? document.getElementById("filterWorker").value : "";
  const site = document.getElementById("filterSite") ? document.getElementById("filterSite").value : "";
  const date = document.getElementById("filterDate") ? document.getElementById("filterDate").value : "";
  const type = document.getElementById("filterType") ? document.getElementById("filterType").value : "";
  const search = document.getElementById("filterSearch") ? document.getElementById("filterSearch").value.trim().toLowerCase() : "";

  return currentRecords.filter(r => {
    if(worker && r.pracovnik !== worker) return false;
    if(site && r.stavba !== site) return false;
    if(date && r.dateISO !== date) return false;
    if(type && r.typ !== type) return false;
    if(search){
      const text = `${r.pracovnik || ""} ${r.stavba || ""} ${r.datum || ""} ${r.cas || ""} ${r.dateISO || ""} ${t[lang][r.typ] || r.typ || ""}`.toLowerCase();
      if(!text.includes(search)) return false;
    }
    return true;
  });
}

function resetFilters(){
  ["filterWorker","filterSite","filterDate","filterType","filterSearch"].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = "";
  });
  renderRecords();
}

function renderRecords(){
  const box = document.getElementById("records");
  if(!box) return;
  if(!isAdmin){ box.innerHTML = ""; return; }
  const records = getFilteredRecords();
  const count = document.getElementById("filterCount");
  if(count) count.innerText = `${t[lang].filteredCount}: ${records.length} / ${currentRecords.length}`;
  if(records.length === 0){box.innerHTML = `<p>${t[lang].noRecords}</p>`;return;}
  box.innerHTML = records.map(r => `
    <div class="record">
      <b>${t[lang][r.typ] || r.typ}</b> – ${r.pracovnik || ""}<br>
      ${r.datum || ""} ${r.cas || ""}<br>
      ${t[lang].site}: ${r.stavba || ""}<br>
      ${r.isDriver ? `🚛 ${t[lang].driverExempt}<br>` : ""}
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
  const wageRows = buildWageSummary(report.rows);
  const totalWage = wageRows.reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalPaid = wageRows.reduce((sum, w) => sum + (w.paidMinutes || 0), 0);
  const totalLunch = wageRows.reduce((sum, w) => sum + (w.lunchTotal || 0), 0);
  box.innerHTML = `
    <p><b>${t[lang].reportGenerated}</b>: ${report.month}</p>
    <p>${t[lang].grossHours}: <b>${formatMinutes(report.total)}</b><br>${t[lang].totalLunch}: <b>${formatMinutes(totalLunch)}</b><br>${t[lang].paidHours}: <b>${formatMinutes(totalPaid)}</b><br>${t[lang].reportDays}: <b>${report.days}</b><br>${t[lang].totalWage}: <b>${formatMoney(totalWage)}</b></p>
    <div class="record">
      <b>${t[lang].monthlyWageTitle}</b><br>
      ${wageRows.map(w => `${w.worker}: ${t[lang].grossHours} ${formatMinutes(w.minutes)} - ${t[lang].lunchBreak} ${formatMinutes(w.lunchTotal)}${w.driverBonusMinutes ? ` + 🚛 bonus ${formatMinutes(w.driverBonusMinutes)}` : ""} = ${t[lang].paidHours} ${formatMinutes(w.paidMinutes)} × ${w.rate ? formatMoney(w.rate) : t[lang].rateNotSet} = <b>${formatMoney(w.amount)}</b>`).join("<br>")}
    </div>
    <div class="record">
      ${report.rows.map(r => `
        <b>${r.worker}</b> — ${r.site}<br>
        ${r.date}: ${t[lang].arrival} ${r.startTime} / ${t[lang].departure} ${r.endTime}<br>
        ${t[lang].grossHours}: ${formatMinutes(r.minutes)}
      `).join("<hr>")}
    </div>`;
}

function printMonthlyReport(){
  if(!isAdmin) return;
  const report = getMonthlySummary();
  if(report.rows.length === 0){alert(t[lang].reportNoData); return;}
  const title = `Smurfex - ${t[lang].reportTitle} ${report.month}`;
  const wageRows = buildWageSummary(report.rows);
  const totalWage = wageRows.reduce((sum, w) => sum + (w.amount || 0), 0);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;color:#111} h1{margin-bottom:4px} table{width:100%;border-collapse:collapse;margin-top:18px} th,td{border:1px solid #999;padding:8px;text-align:left;font-size:13px} th{background:#eee}.sum{margin-top:12px;font-size:16px}</style>
    </head><body>
    <h1>Smurfex s.r.o. - ${t[lang].reportTitle}</h1>
    <div>${t[lang].reportMonth}: <b>${report.month}</b></div>
    <div>${t[lang].reportWorker}: <b>${report.worker || t[lang].allWorkers}</b></div>
    <div class="sum">${t[lang].grossHours}: <b>${formatMinutes(report.total)}</b> | ${t[lang].reportDays}: <b>${report.days}</b> | ${t[lang].totalWage}: <b>${formatMoney(totalWage)}</b></div>
    <h2>${t[lang].monthlyWageTitle}</h2><table><thead><tr><th>Pracovník</th><th>${t[lang].grossHours}</th><th>${t[lang].lunchBreak}</th><th>${t[lang].paidHours}</th><th>${t[lang].hourlyRate}</th><th>${t[lang].wageAmount}</th></tr></thead><tbody>${wageRows.map(w => `<tr><td>${w.worker}</td><td>${formatMinutes(w.minutes)}</td><td>${formatMinutes(w.lunchTotal)}</td><td>${formatMinutes(w.paidMinutes)}</td><td>${w.rate ? formatMoney(w.rate) : "-"}</td><td>${formatMoney(w.amount)}</td></tr>`).join("")}</tbody></table>
    <h2>${t[lang].reportTitle}</h2><table><thead><tr><th>Dátum</th><th>Pracovník</th><th>Stavba</th><th>${t[lang].arrival}</th><th>${t[lang].departure}</th><th>${t[lang].duration}</th></tr></thead><tbody>
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
  const wageRows = buildWageSummary(report.rows);
  const wageSection = "\n\nWorker;Gross minutes;Gross duration;Lunch minutes;Driver bonus minutes;Paid minutes;Paid duration;Hourly rate;Wage\n" + wageRows.map(w => `${w.worker};${w.minutes};${formatMinutes(w.minutes)};${w.lunchTotal};${w.driverBonusMinutes || 0};${w.paidMinutes};${formatMinutes(w.paidMinutes)};${w.rate || 0};${w.amount.toFixed(2)}`).join("\n");
  const blob = new Blob([header + rows + wageSection], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `smurfex-vykaz-${report.month}-${report.worker || "vsetci"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(){
  if(!isAdmin) return;
  const records = getFilteredRecords();
  if(records.length === 0){alert(t[lang].noExport);return;}
  const header = "Date;Time;Worker;Site;Type;Latitude;Longitude;Accuracy;Map;Photo\n";
  const rows = records.map(r =>
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

function renderWageSettings(){
  const box = document.getElementById("wageSettings");
  if(!box || !isAdmin) return;
  const rates = getHourlyRates();
  const lunches = getLunchMinutes();
  box.innerHTML = `
    <p class="sub">${t[lang].wageHint}</p>
    ${WORKERS.map(w => `
      <div class="record">
        <b>${w}${DRIVER_EXEMPT_WORKERS.includes(w) ? " 🚛" : ""}</b><br>
        ${DRIVER_EXEMPT_WORKERS.includes(w) ? `<span>${t[lang].driverExempt}</span><br>` : ""}
        <label>${t[lang].hourlyRate} (€ / h)</label>
        <input class="wageRateInput" data-worker="${w}" type="number" min="0" step="0.01" value="${rates[w] || ""}" placeholder="0.00">
        <label>${t[lang].lunchBreak} (min / deň)</label>
        <input class="lunchInput" data-worker="${w}" type="number" min="0" step="5" value="${lunches[w] || 0}" placeholder="30">
      </div>
    `).join("")}
    <button class="small" onclick="saveWageRates()">${t[lang].saveWageRatesBtn}</button>
    <p id="wageStatus" class="sub"></p>
  `;
}

function saveWageRates(){
  if(!isAdmin) return;
  const rates = {};
  const lunches = {};
  document.querySelectorAll(".wageRateInput").forEach(input => {
    const worker = input.dataset.worker;
    const value = parseFloat(String(input.value).replace(",", "."));
    rates[worker] = isNaN(value) ? 0 : value;
  });
  document.querySelectorAll(".lunchInput").forEach(input => {
    const worker = input.dataset.worker;
    const value = parseInt(input.value, 10);
    lunches[worker] = isNaN(value) ? 0 : value;
  });
  saveHourlyRatesToStorage(rates);
  saveLunchMinutesToStorage(lunches);
  const status = document.getElementById("wageStatus");
  if(status) status.innerText = t[lang].wageRatesSaved;
  renderMonthlyReport(false);
}

function buildWageSummary(rows){
  const rates = getHourlyRates();
  const lunches = getLunchMinutes();
  const summary = {};
  const driverDays = {};

  rows.forEach(r => {
    const lunch = Math.min(r.minutes || 0, lunches[r.worker] || 0);
    const paid = Math.max(0, (r.minutes || 0) - lunch);
    if(!summary[r.worker]){
      summary[r.worker] = {
        worker:r.worker,
        minutes:0,
        lunchTotal:0,
        driverBonusMinutes:0,
        paidMinutes:0,
        rate:rates[r.worker] || 0,
        amount:0
      };
    }
    summary[r.worker].minutes += r.minutes || 0;
    summary[r.worker].lunchTotal += lunch;
    summary[r.worker].paidMinutes += paid;

    if(DRIVER_EXEMPT_WORKERS.includes(r.worker) && r.date){
      const key = `${r.worker}-${r.date}`;
      driverDays[key] = r.worker;
    }
  });

  Object.values(driverDays).forEach(worker => {
    if(!summary[worker]){
      summary[worker] = { worker, minutes:0, lunchTotal:0, driverBonusMinutes:0, paidMinutes:0, rate:rates[worker] || 0, amount:0 };
    }
    summary[worker].driverBonusMinutes += DRIVER_DAILY_BONUS_MINUTES;
    summary[worker].paidMinutes += DRIVER_DAILY_BONUS_MINUTES;
  });

  Object.values(summary).forEach(s => {
    s.amount = (s.paidMinutes / 60) * (s.rate || 0);
  });
  return Object.values(summary);
}

function formatMoney(value){
  return `${Number(value || 0).toFixed(2)} €`;
}


function rememberAutoCredentials(worker, site, pin, enable){
  if(worker) localStorage.setItem("smurfex_auto_worker", worker);
  if(site) localStorage.setItem("smurfex_auto_site", site);
  if(pin) localStorage.setItem("smurfex_auto_pin", pin);
  if(enable) localStorage.setItem("smurfex_auto_enabled", "1");
}

function requestNotificationPermission(){
  try{
    if("Notification" in window && Notification.permission === "default"){
      Notification.requestPermission().catch(()=>{});
    }
  }catch(e){}
}

function showLocalNotification(title, body){
  try{
    if("Notification" in window && Notification.permission === "granted"){
      new Notification(title, { body: body, icon: "icon-192.png", badge: "icon-192.png" });
    }
  }catch(e){}
}

let smurfexWakeLock = null;
async function requestWakeLock(){
  try{
    if("wakeLock" in navigator && !smurfexWakeLock){
      smurfexWakeLock = await navigator.wakeLock.request("screen");
      smurfexWakeLock.addEventListener("release", () => { smurfexWakeLock = null; });
    }
  }catch(e){}
}

function autoStatusMessage(text){
  const box = getAutoStatusBox();
  box.style.display = "block";
  box.innerHTML = text;
}

function isWorkerExemptFromGeofence(worker){
  return DRIVER_EXEMPT_WORKERS.includes(worker) || MASTER_EXEMPT_WORKERS.includes(worker);
}

function getAutoStatusBox(){
  let box = document.getElementById("autoStatusBox");
  if(!box){
    const status = document.getElementById("status");
    box = document.createElement("div");
    box.id = "autoStatusBox";
    box.className = "record";
    box.style.display = "none";
    if(status && status.parentNode){
      status.parentNode.insertBefore(box, status.nextSibling);
    }
  }
  return box;
}

function renderAutoControls(){
  if(document.getElementById("autoControls")) return;
  const buttons = document.querySelector(".buttons");
  if(!buttons || !buttons.parentNode) return;
  const panel = document.createElement("div");
  panel.id = "autoControls";
  panel.className = "record";
  panel.innerHTML = `
    <b>📍 Automatická dochádzka</b><br>
    <span>Po prvom prihlásení si aplikácia uloží pracovníka, stavbu a PIN. Pri ďalšom otvorení sa automatika spustí sama. Príchod po 5 min v zóne, odchod po 15 min mimo zóny.</span><br>
    <button class="small" onclick="startAutoAttendance(false)">Zapnúť / uložiť automatiku</button>
    <button class="small danger" onclick="stopAutoAttendance(true)">Vypnúť automatiku / odhlásiť</button>
  `;
  buttons.parentNode.insertBefore(panel, buttons.nextSibling);
}

async function getLatestWorkerStatus(worker){
  const today = getTodayISO();
  const snap = await recordsCol.where("pracovnik", "==", worker).where("dateISO", "==", today).get();
  const docs = snap.docs.map(d => d.data()).sort((a,b) => (b.createdAtLocal || "").localeCompare(a.createdAtLocal || ""));
  return docs[0] ? docs[0].typ : "end";
}

async function saveAutoRecord(type, worker, site, gps, note){
  const latest = await getLatestWorkerStatus(worker);
  if(type === "start" && latest === "start") return false;
  if(type === "end" && latest !== "start") return false;

  const now = new Date();
  const sitePosition = SITE_COORDS[site] || null;
  const distance = sitePosition ? distanceMeters(gps.lat, gps.lng, sitePosition.lat, sitePosition.lng) : null;
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
    siteLatitude: sitePosition ? sitePosition.lat : null,
    siteLongitude: sitePosition ? sitePosition.lng : null,
    geofenceDistance: distance,
    geofenceRadius: GEOFENCE_RADIUS_METERS,
    isDriver: DRIVER_EXEMPT_WORKERS.includes(worker),
    driverExempt: DRIVER_EXEMPT_WORKERS.includes(worker),
    isMaster: MASTER_EXEMPT_WORKERS.includes(worker),
    autoAttendance: true,
    note: note || "Automatická dochádzka",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  await recordsCol.add(record);
  showLocalNotification("Smurfex Dochádzka", `${worker} — ${type === "start" ? "automatický príchod" : "automatický odchod"} — ${site} — ${record.cas}`);
  autoLastActionKey = `${worker}-${record.dateISO}-${type}-${record.cas}`;
  localStorage.setItem("smurfex_auto_last_action", autoLastActionKey);
  return true;
}

function startAutoAttendance(silent){
  const worker = document.getElementById("worker") ? document.getElementById("worker").value.trim() : (localStorage.getItem("smurfex_auto_worker") || "");
  const site = document.getElementById("site") ? document.getElementById("site").value.trim() : (localStorage.getItem("smurfex_auto_site") || "");
  const pin = (document.getElementById("workerPin") && document.getElementById("workerPin").value.trim()) || localStorage.getItem("smurfex_auto_pin") || "";
  const box = getAutoStatusBox();
  if(!worker || !site || !pin){ if(!silent) alert(t[lang].fillAlert || "Vyber pracovníka, stavbu a zadaj PIN."); return; }
  if(WORKER_PINS[worker] !== pin){ if(!silent) alert(t[lang].wrongWorkerPin || "Nesprávny PIN pracovníka."); return; }
  if(!navigator.geolocation){ if(!silent) alert("GPS nie je podporované."); return; }

  rememberAutoCredentials(worker, site, pin, true);
  requestNotificationPermission();
  requestWakeLock();

  if(autoWatchId !== null){ navigator.geolocation.clearWatch(autoWatchId); }
  autoInsideSince = null;
  autoOutsideSince = null;
  box.style.display = "block";
  box.innerHTML = "📍 Automatická dochádzka je zapnutá. Pri ďalšom otvorení aplikácie sa spustí sama. Čakám na GPS...";

  autoWatchId = navigator.geolocation.watchPosition(async pos => {
    const gps = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: Math.round(pos.coords.accuracy || 0),
      mapUrl: `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`
    };
    const sitePosition = SITE_COORDS[site];
    const distance = sitePosition ? distanceMeters(gps.lat, gps.lng, sitePosition.lat, sitePosition.lng) : null;
    const exempt = isWorkerExemptFromGeofence(worker);
    const inside = exempt || (distance !== null && distance <= GEOFENCE_RADIUS_METERS);
    const now = Date.now();

    try{
      if(inside){
        autoOutsideSince = null;
        if(!autoInsideSince) autoInsideSince = now;
        const remain = Math.max(0, AUTO_CHECKIN_DELAY_MS - (now - autoInsideSince));
        box.innerHTML = `📍 ${worker} — ${site}<br>${exempt ? "Výnimka: šofér/majster" : "V zóne"}${distance !== null ? ` (${distance} m / ${GEOFENCE_RADIUS_METERS} m)` : ""}<br>Automatický príchod o ${Math.ceil(remain/60000)} min.`;
        if(now - autoInsideSince >= AUTO_CHECKIN_DELAY_MS){
          const saved = await saveAutoRecord("start", worker, site, gps, "Automatický príchod po 5 minútach");
          if(saved) box.innerHTML = `✅ ${worker} bol automaticky prihlásený do práce.`;
          autoInsideSince = now;
        }
      }else{
        autoInsideSince = null;
        if(!autoOutsideSince) autoOutsideSince = now;
        const remain = Math.max(0, AUTO_CHECKOUT_DELAY_MS - (now - autoOutsideSince));
        box.innerHTML = `📍 ${worker} — mimo zóny (${distance} m / ${GEOFENCE_RADIUS_METERS} m)<br>Automatický odchod o ${Math.ceil(remain/60000)} min.`;
        if(now - autoOutsideSince >= AUTO_CHECKOUT_DELAY_MS){
          const saved = await saveAutoRecord("end", worker, site, gps, "Automatický odchod po 15 minútach mimo zóny");
          if(saved) box.innerHTML = `✅ ${worker} bol automaticky odhlásený z práce.`;
          autoOutsideSince = now;
        }
      }
    }catch(e){
      console.error(e);
      box.innerHTML = "⚠️ Automatická dochádzka: chyba uloženia alebo Firebase pravidiel.";
    }
  }, err => {
    console.error(err);
    box.innerHTML = "⚠️ Automatická dochádzka potrebuje povolenú polohu.";
  }, { enableHighAccuracy:true, maximumAge:30000, timeout:20000 });
}

async function stopAutoAttendance(createCheckout){
  const worker = localStorage.getItem("smurfex_auto_worker") || (document.getElementById("worker") ? document.getElementById("worker").value.trim() : "");
  const site = localStorage.getItem("smurfex_auto_site") || (document.getElementById("site") ? document.getElementById("site").value.trim() : "");
  if(autoWatchId !== null){
    navigator.geolocation.clearWatch(autoWatchId);
    autoWatchId = null;
  }
  localStorage.removeItem("smurfex_auto_enabled");
  const box = getAutoStatusBox();
  box.style.display = "block";

  if(createCheckout && worker && site){
    try{
      const gps = await getLocation();
      const saved = await saveAutoRecord("end", worker, site, gps, "Odchod pri vypnutí automatickej dochádzky");
      box.innerHTML = saved ? `✅ ${worker} bol odhlásený a automatika je vypnutá.` : "Automatika je vypnutá.";
    }catch(e){
      console.error(e);
      box.innerHTML = "Automatika je vypnutá. Odchod sa nepodarilo uložiť bez GPS.";
    }
  }else{
    box.innerHTML = "Automatická dochádzka je vypnutá.";
  }
}

function resumeAutoAttendanceIfEnabled(){
  renderAutoControls();
  const enabled = localStorage.getItem("smurfex_auto_enabled") === "1";
  if(!enabled) return;
  const worker = localStorage.getItem("smurfex_auto_worker");
  const site = localStorage.getItem("smurfex_auto_site");
  const pin = localStorage.getItem("smurfex_auto_pin") || "";
  const workerEl = document.getElementById("worker");
  const siteEl = document.getElementById("site");
  const pinEl = document.getElementById("workerPin");
  if(workerEl && worker) workerEl.value = worker;
  if(siteEl && site) siteEl.value = site;
  if(pinEl && pin) pinEl.value = pin;
  const box = getAutoStatusBox();
  box.style.display = "block";
  box.innerHTML = "📍 Automatika bola zapnutá skôr. Spúšťam GPS automaticky...";
  setTimeout(() => startAutoAttendance(true), 800);
}

async function clearRecords(){
  if(!isAdmin) return;
  if(!confirm(t[lang].confirmClear)) return;

  const snap = await recordsCol.get();
  const batch = db.batch();
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}


document.addEventListener("visibilitychange", () => {
  if(document.visibilityState === "visible" && localStorage.getItem("smurfex_auto_enabled") === "1"){
    requestWakeLock();
    startAutoAttendance(true);
  }
});

window.addEventListener("focus", () => {
  if(localStorage.getItem("smurfex_auto_enabled") === "1"){
    startAutoAttendance(true);
  }
});

setInterval(() => {
  if(localStorage.getItem("smurfex_auto_enabled") === "1" && autoWatchId === null){
    startAutoAttendance(true);
  }
}, 60000);

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js");
}

ensurePinInput();
fillSelects();
fillRequestTypeTexts();
setLang(lang);
renderAutoControls();
resumeAutoAttendanceIfEnabled();
renderAdminState();
