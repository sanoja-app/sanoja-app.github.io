# Draft: improved Chrome Web Store listing (not submitted)

Nothing here is live. Copy into the Developer Dashboard only after you've read it.
Facts in the English text were taken from the extension's current behaviour and the
live listing; the Finnish text has NOT been checked by a native speaker.

## 1. Category
Live listing currently shows **Communication**. Change to **Education** (the repo's
STORE_LISTING.md already says Education). If Education isn't in the dropdown, use the
closest language-learning option.

## 2. Summary (132 chars max)
Current (120): Learn Finnish: select any word on the web to translate English ↔ Finnish, hear it, and build vocabulary with flashcards.

Proposed (115):
English–Finnish translator and dictionary: select any word on a page, hear it, and review it later with flashcards.

## 3. Detailed description (English)

Understand Finnish as you browse, and actually remember the words you look up.

Sanoja is an English–Finnish translator and dictionary that works inside your browser. Select or double-click any word or short phrase on any website: English shows in Finnish, Finnish shows in English, detected automatically with no language picker. One click plays the Finnish pronunciation.

Every word you look up is saved, usually together with the sentence it appeared in, so it doesn't disappear when you close the tab:

• Spaced-repetition flashcards (Leitner system): a word you get right comes back in a few days, then a week, then a month; a word you miss comes back tomorrow
• Words you know well graduate to a separate "known words" list
• A searchable, sortable word list and a word-cloud view
• A daily streak for finishing your reviews
• Practice on your phone: tap "Practice on phone" and scan a QR code. No app install needed

Useful for learners of Finnish at any level, and for English speakers living in Finland who want to understand what they read: news, forms, ads and messages.

No accounts, no ads, no tracking. Your word list and progress stay in your browser and are never sent anywhere automatically. The only network requests Sanoja makes are for text you explicitly select (its translation, its dictionary form from Wiktionary, and its pronunciation audio) and, only if you tap "Practice on phone", a copy of your word list sent to Sanoja's own server so your phone can load it. Full privacy policy: https://sanoja-app.github.io/privacy.html

Built for one language pair on purpose: English and Finnish, both directions, nothing else.

## 4. Finnish-language listing (add as a second language in the dashboard)

Summary (107):
Suomi–englanti-sanakirja: valitse sana miltä tahansa sivulta, kuuntele se ja kertaa se myöhemmin korteilla.

Description:

Ymmärrä suomea selatessasi ja muista hakemasi sanat.

Sanoja on englannin ja suomen välinen kääntäjä ja sanakirja selaimessasi. Valitse tai kaksoisnapsauta mitä tahansa sanaa tai lyhyttä ilmausta millä tahansa verkkosivulla: englanti käännetään suomeksi ja suomi englanniksi, ja kieli tunnistetaan automaattisesti. Yhdellä napsautuksella kuulet suomenkielisen ääntämisen.

Jokainen hakemasi sana tallentuu, yleensä sen lauseen kanssa, jossa se esiintyi:

• Kertauskortit (Leitner-järjestelmä): oikein menneet sanat palaavat muutaman päivän, viikon ja kuukauden kuluttua, väärin menneet jo huomenna
• Hyvin osaamasi sanat siirtyvät erilliseen "osaan jo" -listaan
• Haettava ja lajiteltava sanalista sekä sanapilvi
• Päivittäinen putki kertausten tekemisestä
• Harjoittele puhelimella: napauta "Practice on phone" ja skannaa QR-koodi, sovellusta ei tarvitse asentaa

Sopii suomen oppijoille tasosta riippumatta sekä Suomessa asuville, jotka haluavat ymmärtää lukemansa: uutiset, lomakkeet, mainokset ja viestit.

Ei tilejä, ei mainoksia, ei seurantaa. Sanalistasi ja edistymisesi pysyvät selaimessasi, eikä niitä lähetetä minnekään automaattisesti. Ainoat verkkopyynnöt koskevat itse valitsemaasi tekstiä (käännös, perusmuoto Wiktionarysta ja ääntämisääni) ja, vain jos napautat "Practice on phone", kopiota sanalistastasi Sanojan omalle palvelimelle, jotta puhelimesi voi ladata sen. Tietosuojaseloste: https://sanoja-app.github.io/privacy.html

Tehty tarkoituksella yhdelle kielipaarille: englanti ja suomi, molempiin suuntiin, ei muuta.

## 5. Screenshots (store allows 5; the repo has 6)
- Keep 5, drop one. Suggested order: (1) Finnish to English on a Finnish news page, since that is your real audience; (2) English to Finnish; (3) the flashcard quiz; (4) word list with example sentences; (5) phone flashcards.
- Add a one-line caption on each image (for example "Select any word. See it instantly."). The current images are 1280x800 with a small popup on a mostly blank page, so the feature is hard to see at store-thumbnail size.
- Use a real-looking page (a news article layout) and zoom so the popup is large.

## 6. Name
"Sanoja - Finnish Translator & Dictionary" is already keyword-rich. The store name comes from manifest.json, so changing it means a new version. Leave it.
