SMURFEX – odporúčané Firebase pravidlá

Aktuálna PWA používa Firestore priamo z prehliadača. Pre plne bezpečné pravidlá je ideálne doplniť Firebase Authentication alebo server/API.

Dočasné pravidlá na testovanie nechávajú zápis otvorený pre aplikáciu, ale produkčne odporúčam:
1. pridať Firebase Authentication,
2. admin účet,
3. worker účty alebo anonymné tokeny,
4. uzamknúť collections records, requests, siteDiaries.

Push notifikácie: vyžadujú Firebase Cloud Messaging + registráciu zariadení. V tejto PWA sú pripravené posledné udalosti v admin paneli.

Interný stavebný denník
------------------------
Zapnite Google v Firebase Authentication. Každému poverenému používateľovi
vytvorte cez Firebase Console dokument siteDiaryMembers/<Firebase Auth UID>.
Doplňte nižšie uvedené pravidlá do existujúceho match /databases/{database}/documents.
Pravidlá records a requests ponechajte. Pred publikovaním odstráňte alebo zúžte
každé všeobecné povoľovacie pravidlo, ktoré by sa vzťahovalo aj na siteDiaries
siteExtraWorks alebo siteDiaryMembers. Firestore povoľovacie pravidlá sa vyhodnocujú cez OR.

    function hasDiaryAccess() {
      return request.auth != null
        && request.auth.token.firebase.sign_in_provider == 'google.com'
        && exists(/databases/$(database)/documents/siteDiaryMembers/$(request.auth.uid));
    }

    match /siteDiaryMembers/{uid} {
      allow read, write: if false;
    }

    match /siteDiaries/{entry} {
      allow read: if hasDiaryAccess();
      allow create: if hasDiaryAccess()
        && request.resource.data.keys().hasAll(['site', 'date', 'work', 'extras', 'authorUid', 'authorName', 'createdAt'])
        && request.resource.data.keys().hasOnly(['site', 'date', 'work', 'extras', 'authorUid', 'authorName', 'createdAt'])
        && request.resource.data.site in ['Ďumbierska', 'ZUŠ Jána Cikkera']
        && request.resource.data.date is string
        && request.resource.data.date.matches('[0-9]{4}-[0-9]{2}-[0-9]{2}')
        && request.resource.data.work is string
        && request.resource.data.extras is string
        && request.resource.data.work.size() <= 5000
        && request.resource.data.extras.size() <= 5000
        && (request.resource.data.work.size() > 0 || request.resource.data.extras.size() > 0)
        && request.resource.data.authorUid == request.auth.uid
        && request.resource.data.authorName is string
        && request.resource.data.authorName.size() <= 200
        && request.resource.data.createdAt == request.time;
    }

    match /siteExtraWorks/{entry} {
      allow read: if hasDiaryAccess();
      allow create: if hasDiaryAccess()
        && request.resource.data.keys().hasAll(['site', 'description', 'quantity', 'unit', 'requestedBy', 'authorUid', 'authorName', 'createdAt'])
        && request.resource.data.keys().hasOnly(['site', 'description', 'quantity', 'unit', 'requestedBy', 'authorUid', 'authorName', 'createdAt'])
        && request.resource.data.site in ['Ďumbierska', 'ZUŠ Jána Cikkera']
        && request.resource.data.description is string
        && request.resource.data.description.size() > 0
        && request.resource.data.description.size() <= 5000
        && request.resource.data.unit is string
        && request.resource.data.unit.size() <= 30
        && ((request.resource.data.quantity == null && request.resource.data.unit == '')
          || (request.resource.data.quantity is number && request.resource.data.quantity > 0
            && request.resource.data.quantity <= 1.7976931348623157e308
            && request.resource.data.unit.size() > 0))
        && request.resource.data.requestedBy is string
        && request.resource.data.requestedBy.size() <= 200
        && request.resource.data.authorUid == request.auth.uid
        && request.resource.data.authorName is string
        && request.resource.data.authorName.size() <= 200
        && request.resource.data.createdAt == request.time;
    }
