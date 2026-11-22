(function(){
  const login = document.getElementById("diaryLogin");
  const logout = document.getElementById("diaryLogout");
  const auth = firebase.auth();
  const diary = {
    panel: document.getElementById("diaryForm"),
    form: document.getElementById("diaryForm"),
    status: document.getElementById("diaryStatus"),
    list: document.getElementById("diaryEntries"),
    collection: db.collection("siteDiaries"),
    sortField: "date",
    details: [["diaryWork", "work"], ["diaryExtras", "extras"]]
  };
  const extraWorks = {
    panel: document.getElementById("extraWorks"),
    form: document.getElementById("extraWorksForm"),
    status: document.getElementById("extraWorksStatus"),
    list: document.getElementById("extraWorksEntries"),
    collection: db.collection("siteExtraWorks"),
    sortField: "createdAt",
    details: [["extraDescription", "description"], ["extraQuantity", "measurement"], ["extraRequestedBy", "requestedBy"]]
  };

  function showStatus(section, key){
    section.statusKey = key;
    section.status.textContent = t[lang][key] || "";
  }

  function renderEntries(section){
    section.list.replaceChildren();
    if(section.panel.hidden) return;
    if(!section.entries.length){
      section.list.textContent = t[lang].diaryNoEntries;
      return;
    }
    for(const entry of section.entries){
      const card = document.createElement("article");
      card.className = "record diary-entry";
      const heading = document.createElement("strong");
      heading.textContent = [entry.date, entry.site, entry.authorName].filter(Boolean).join(" · ");
      card.append(heading);
      const measurement = entry.quantity == null ? "" : new Intl.NumberFormat(lang, {
        maximumSignificantDigits: 15
      }).format(entry.quantity) + " " + entry.unit;
      for(const [labelKey, field] of section.details){
        const value = field === "measurement" ? measurement : entry[field];
        if(!value) continue;
        const label = document.createElement("h3");
        label.textContent = t[lang][labelKey];
        const text = document.createElement("p");
        text.textContent = value;
        card.append(label, text);
      }
      section.list.append(card);
    }
  }

  for(const section of [diary, extraWorks]){
    for(const site of SITES) section.form.elements.site.add(new Option(site, site));
    section.form.addEventListener("submit", async event => {
      event.preventDefault();
      const user = auth.currentUser;
      if(!user || section.panel.hidden || section.saving) return;
      const values = new FormData(section.form);
      const description = values.get(section === diary ? "work" : "description").trim();
      if(!description){
        showStatus(section, "diaryEmpty");
        return;
      }

      const entry = {
        site: values.get("site"),
        authorUid: user.uid,
        authorName: (user.displayName || user.email || "").slice(0, 200),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      if(section === diary){
        Object.assign(entry, {date: values.get("date"), work: description, extras: ""});
      }else{
        const rawQuantity = values.get("quantity");
        const quantity = rawQuantity === "" ? null : Number(rawQuantity);
        const unit = values.get("unit").trim();
        if(quantity === null ? unit !== "" : !Number.isFinite(quantity) || quantity <= 0 || !unit){
          showStatus(section, "extraMeasurementError");
          return;
        }
        Object.assign(entry, {description, quantity, unit, requestedBy: values.get("requestedBy").trim()});
      }

      const submit = section.form.querySelector('button[type="submit"]');
      section.saving = true;
      submit.disabled = true;
      try {
        await section.collection.add(entry);
        if(auth.currentUser?.uid === user.uid){
          section.form.reset();
          section.form.elements.site.value = entry.site;
          if(section === diary) section.form.elements.date.value = entry.date;
          showStatus(section, "diarySaved");
        }
      } catch {
        if(auth.currentUser?.uid === user.uid) showStatus(section, "diarySaveError");
      } finally {
        section.saving = false;
        submit.disabled = false;
      }
    });
  }

  document.addEventListener("smurfex-language-change", () => {
    for(const section of [diary, extraWorks]){
      showStatus(section, section.statusKey);
      renderEntries(section);
    }
  });

  login.addEventListener("click", async () => {
    login.disabled = true;
    try {
      await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    } catch {
      showStatus(diary, "diaryAuthError");
    } finally {
      login.disabled = false;
    }
  });

  logout.addEventListener("click", async () => {
    try {
      await auth.signOut();
    } catch {
      showStatus(diary, "diaryAuthError");
    }
  });

  auth.onAuthStateChanged(user => {
    login.hidden = Boolean(user);
    logout.hidden = !user;
    for(const section of [diary, extraWorks]){
      section.stopListening?.();
      section.stopListening = undefined;
      section.form.reset();
      section.panel.hidden = true;
      section.entries = [];
      showStatus(section, "");
      renderEntries(section);
      if(section === diary){
        section.form.elements.date.value = new Intl.DateTimeFormat("sv-SE", {
          timeZone:"Europe/Bratislava"
        }).format(new Date());
      }
      if(!user) continue;
      section.stopListening = section.collection.orderBy(section.sortField, "desc")
        .onSnapshot({includeMetadataChanges: true}, snapshot => {
          if(snapshot.metadata.fromCache && section.panel.hidden) return;
          section.entries = snapshot.docs.map(doc => doc.data());
          section.panel.hidden = false;
          renderEntries(section);
        }, error => {
          section.panel.hidden = true;
          section.entries = [];
          renderEntries(section);
          showStatus(section, error.code === "permission-denied" ? "diaryDenied" : "diaryLoadError");
        });
    }
  });
})();
