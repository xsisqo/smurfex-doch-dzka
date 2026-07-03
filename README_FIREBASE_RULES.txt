SMURFEX – odporúčané Firebase pravidlá

Aktuálna PWA používa Firestore priamo z prehliadača. Pre plne bezpečné pravidlá je ideálne doplniť Firebase Authentication alebo server/API.

Dočasné pravidlá na testovanie nechávajú zápis otvorený pre aplikáciu, ale produkčne odporúčam:
1. pridať Firebase Authentication,
2. admin účet,
3. worker účty alebo anonymné tokeny,
4. uzamknúť collections records, requests, siteDiaries.

Push notifikácie: vyžadujú Firebase Cloud Messaging + registráciu zariadení. V tejto PWA sú pripravené posledné udalosti v admin paneli.
