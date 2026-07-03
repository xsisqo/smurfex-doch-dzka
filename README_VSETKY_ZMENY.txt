SMURFEX DOCHÁDZKA PRO – FINÁLNY BALÍK VŠETKÝCH ZMIEN

Nahrať na GitHub a prepísať tieto súbory:
- index.html
- app.js
- style.css
- sw.js

Po nahratí:
1. Počkajte 1–3 minúty, kým GitHub Pages nasadí zmeny.
2. Otvorte aplikáciu v inkognito okne alebo vymažte cache stránky.
3. Na mobile odporúčané: Chrome/Safari → nastavenia stránky → vymazať dáta stránky.
4. Ak je aplikácia pridaná na ploche, odstrániť ikonu a pridať znovu.

Obsah balíka:
- SK / EN / Hindi jazyk
- Firebase online databáza
- admin PIN 2580
- pracovníci: Mohit Kumar, Gurwinder Singh, Pradip Majumder, Jatinder Singh, Vlado Hatala, Fero Maslík, Milan Sedliak
- PINy pracovníkov 1111 až 7777
- stavby: STRABAG letisko, STRABAG nemocnica
- GPS poloha pri zázname
- geofencing 3 km pre bežných pracovníkov
- šoféri bez blokovania geofencingu: Pradip Majumder, Vlado Hatala
- pripravená výnimka pre majstra v MASTER_EXEMPT_WORKERS
- fotka/selfie pri príchode a odchode
- počasie podľa stavby
- požiadavky pracovníkov pre admina: materiál, náradie, doprava, iné
- admin panel
- živý prehľad, kto je v práci
- dashboard stavieb
- posledné udalosti
- filtre záznamov
- kalendár pracovníka
- mesačný výkaz
- CSV export
- hodinové sadzby:
  Mohit 6 €/h, Gurwinder 6 €/h, Pradip 6 €/h, Jatinder 5 €/h, Vlado 8 €/h, Fero 8 €/h, Milan 8 €/h
- obedy:
  Mohit 30 min, Gurwinder 30 min, Pradip 60 min, Jatinder 30 min, Vlado 60 min, Fero 60 min, Milan 60 min
- šoférsky bonus +1 platená hodina denne pre Pradip Majumder a Vlado Hatala
- automatická dochádzka: hodnoty v kóde sú 5 min príchod v zóne a 15 min odchod mimo zóny
- upozornenie pred prihlásením do práce
- service worker súbor sw.js

Dôležité:
Automatická dochádzka v PWA funguje spoľahlivo hlavne keď je aplikácia otvorená alebo aktívna v mobile. Plná automatika na pozadí by vyžadovala natívnu Android aplikáciu alebo pokročilé push/background riešenie.
