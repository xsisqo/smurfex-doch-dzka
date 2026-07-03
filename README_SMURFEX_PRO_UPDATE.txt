SMURFEX DOCHÁDZKA PRO – update 2, 3, 4

Pridané funkcie:
2. Push / lokálne notifikácie v prehliadači
- tlačidlo „Povoliť notifikácie“ v admin paneli
- upozornenie pri novom príchode/odchode
- upozornenie pri novej požiadavke pracovníka
- upozornenie pri novom stavebnom denníku
Poznámka: nejde o plnohodnotné Firebase Cloud Messaging na pozadí. Funguje hlavne keď je aplikácia otvorená alebo aktívna.

3. Denný stavebný denník + fotodokumentácia
- dátum
- stavba
- názov práce
- popis vykonaných prác
- počet pracovníkov
- viac fotiek
- zoznam denníkov v admin paneli
- PDF/tlač denníka

4. Grafy a štatistiky
- hodiny podľa pracovníka
- hodiny podľa stavby
- výber mesiaca
- grafické vodorovné stĺpce

Nahrať na GitHub:
- index.html
- app.js
- style.css
- sw.js

Po nahratí:
- počkaj 1–3 minúty
- otvor aplikáciu
- obnov stránku / Ctrl+F5
- v mobile prípadne vymaž dáta stránky

Dôležité Firebase pravidlá:
Aby fungovali aj stavebné denníky, pridaj do Firestore Rules aj kolekciu diaries alebo povoľ podľa pripravených pravidiel.
