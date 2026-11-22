(function(){
  const form = document.getElementById("diaryForm");
  const siteSelect = document.getElementById("diarySite");
  const dateInput = document.getElementById("diaryDate");
  const login = document.getElementById("diaryLogin");
  const logout = document.getElementById("diaryLogout");
  const status = document.getElementById("diaryStatus");
  const entriesEl = document.getElementById("diaryEntries");
  const submit = form.querySelector('button[type="submit"]');
  const auth = firebase.auth();
  const diaries = db.collection("siteDiaries");
  let stopListening;
  let entries = [];
  let statusKey = "";
  let saving = false;

  function showStatus(key){
    statusKey = key;
    status.textContent = t[lang][key] || "";
  }

  function renderEntries(){
    entriesEl.replaceChildren();
    if(form.hidden) return;
    if(!entries.length){
      entriesEl.textContent = t[lang].diaryNoEntries;
      return;
    }
    for(const entry of entries){
      const card = document.createElement("article");
      card.className = "record diary-entry";
      const heading = document.createElement("strong");
      heading.textContent = [entry.date, entry.site, entry.authorName].join(" · ");
      card.append(heading);
      for(const [key, value] of [["diaryWork", entry.work], ["diaryExtras", entry.extras]]){
        if(!value) continue;
        const label = document.createElement("h3");
        label.textContent = t[lang][key];
        const text = document.createElement("p");
        text.textContent = value;
        card.append(label, text);
      }
      entriesEl.append(card);
    }
  }

  for(const site of SITES) siteSelect.add(new Option(site, site));
  document.addEventListener("smurfex-language-change", () => {
    showStatus(statusKey);
    renderEntries();
  });

  login.addEventListener("click", async () => {
    login.disabled = true;
    try {
      await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    } catch {
      showStatus("diaryAuthError");
    } finally {
      login.disabled = false;
    }
  });

  logout.addEventListener("click", async () => {
    try {
      await auth.signOut();
    } catch {
      showStatus("diaryAuthError");
    }
  });

  auth.onAuthStateChanged(user => {
    stopListening?.();
    stopListening = undefined;
    form.reset();
    dateInput.value = new Intl.DateTimeFormat("sv-SE", {timeZone:"Europe/Bratislava"}).format(new Date());
    form.hidden = true;
    login.hidden = Boolean(user);
    logout.hidden = !user;
    entries = [];
    showStatus("");
    renderEntries();
    if(!user) return;

    stopListening = diaries.orderBy("date", "desc").limit(100).onSnapshot({includeMetadataChanges: true}, snapshot => {
      if(snapshot.metadata.fromCache && form.hidden) return;
      entries = snapshot.docs.map(doc => doc.data());
      form.hidden = false;
      renderEntries();
    }, error => {
      form.hidden = true;
      entries = [];
      renderEntries();
      showStatus(error.code === "permission-denied" ? "diaryDenied" : "diaryLoadError");
    });
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const user = auth.currentUser;
    if(!user || form.hidden || saving) return;
    const values = new FormData(form);
    const work = values.get("work").trim();
    const extras = values.get("extras").trim();
    if(!work && !extras){
      showStatus("diaryEmpty");
      return;
    }
    saving = true;
    submit.disabled = true;
    try {
      await diaries.add({
        site: values.get("site"),
        date: values.get("date"),
        work,
        extras,
        authorUid: user.uid,
        authorName: (user.displayName || user.email || "").slice(0, 200),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      if(auth.currentUser?.uid === user.uid){
        form.elements.work.value = "";
        form.elements.extras.value = "";
        showStatus("diarySaved");
      }
    } catch {
      if(auth.currentUser?.uid === user.uid) showStatus("diarySaveError");
    } finally {
      saving = false;
      submit.disabled = false;
    }
  });
})();
