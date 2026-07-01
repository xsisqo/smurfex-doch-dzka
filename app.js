const key = "smurfex_dochadzka_records";

function loadRecords(){
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function saveRecords(records){
  localStorage.setItem(key, JSON.stringify(records));
}

function saveRecord(type){
  const worker = document.getElementById("worker").value.trim();
  const site = document.getElementById("site").value.trim();

  if(!worker || !site){
    alert("Vyplň meno pracovníka aj stavbu.");
    return;
  }

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

  document.getElementById("status").innerText = type + " uložený: " + record.cas;
  renderRecords();
}

function renderRecords(){
  const records = loadRecords();
  const box = document.getElementById("records");

  if(records.length === 0){
    box.innerHTML = "<p>Zatiaľ žiadne záznamy.</p>";
    return;
  }

  box.innerHTML = records.map(r => `
    <div class="record">
      <b>${r.typ}</b> – ${r.pracovnik}<br>
      ${r.datum} ${r.cas}<br>
      Stavba: ${r.stavba}
    </div>
  `).join("");
}

function exportCSV(){
  const records = loadRecords();
  if(records.length === 0){
    alert("Nie sú žiadne záznamy.");
    return;
  }

  const header = "Datum;Cas;Pracovnik;Stavba;Typ\n";
  const rows = records.map(r =>
    `${r.datum};${r.cas};${r.pracovnik};${r.stavba};${r.typ}`
  ).join("\n");

  const blob = new Blob([header + rows], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "smurfex-dochadzka.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function clearRecords(){
  if(confirm("Naozaj vymazať všetky záznamy v tomto mobile?")){
    localStorage.removeItem(key);
    renderRecords();
  }
}

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js");
}

renderRecords();
