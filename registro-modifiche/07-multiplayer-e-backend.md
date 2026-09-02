# 07 — Multiplayer e backend

Registro automatico delle modifiche realmente entrate in `main`.

Non contiene idee, TODO o implementazioni future.

---

<!-- merge:e644e59 -->
## 02/09/26, 18:12 — Merge branch 'task/08-readme-api-routes'

**Tipo:** Merge  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `e644e59`


### Commit contenuti nel merge

- `442a676` — docs(api): README completo delle route e delle chiamate (punto 8) — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `backend/README-API.md`

**File interessati in questa categoria:** 1

---

<!-- commit:e38367a -->
## 01/09/26, 16:57 — test: tutte e 34 le rotte del server provate su Postman (Da smistare)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `e38367a`


### File di questa categoria

- **Modificato:** `backend/README.md`
- **Modificato:** `backend/package.json`
- **Aggiunto:** `backend/postman/README.md`
- **Aggiunto:** `backend/postman/anni-di-fame.postman_collection.json`
- **Aggiunto:** `backend/postman/genera.js`
- **Aggiunto:** `backend/postman/prova.js`

**File interessati in questa categoria:** 6

---

<!-- commit:b2ea221 -->
## 01/09/26, 13:27 — feat: sotto il server ci puo' stare PostgreSQL, e la scadenza dei biglietti diventa obbligatoria

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `b2ea221`


### File di questa categoria

- **Modificato:** `backend/README.md`
- **Modificato:** `backend/accessi.js`
- **Aggiunto:** `backend/ambiente.js`
- **Modificato:** `backend/carico.js`
- **Modificato:** `backend/database/README.md`
- **Modificato:** `backend/database/archivio.js`
- **Modificato:** `backend/database/copia.js`
- **Modificato:** `backend/database/db.js`
- **Aggiunto:** `backend/database/migrazioni-pg/001_iniziale.sql`
- **Aggiunto:** `backend/database/migrazioni-pg/002_segnalazioni.sql`
- **Aggiunto:** `backend/database/migrazioni-pg/003_classifiche.sql`
- **Aggiunto:** `backend/database/migrazioni-pg/004_posizioni.sql`
- **Aggiunto:** `backend/database/migrazioni-pg/005_citta.sql`
- **Aggiunto:** `backend/database/migrazioni-pg/006_ordine_traguardi.sql`
- **Aggiunto:** `backend/database/migrazioni/006_ordine_traguardi.sql`
- **Aggiunto:** `backend/database/postgres.js`
- **Aggiunto:** `backend/database/sqlite.js`
- **Modificato:** `backend/database/travaso.js`
- **Aggiunto:** `backend/package-lock.json`
- **Modificato:** `backend/package.json`
- **Modificato:** `backend/prova.js`
- **Modificato:** `backend/server.js`

**File interessati in questa categoria:** 22

---

<!-- commit:c5c8721 -->
## 01/09/26, 12:58 — docs: lo schema del database nel README, e come aprirlo con Beekeeper Studio

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `c5c8721`


### File di questa categoria

- **Modificato:** `backend/database/README.md`

**File interessati in questa categoria:** 1

---

<!-- merge:e4d5e45 -->
## 01/09/26, 03:02 — Merge remote-tracking branch 'origin/main'

**Tipo:** Merge  
**Autore:** Sadyco La Fame (sadycolafame@192.168.1.53)  
**Commit:** `e4d5e45`


### Commit contenuti nel merge

- `b5192c2` — fix: la mappa della plancia puntava a un file che non c'e' piu' — **Carlomadella**
- `956f95b` — Merge remote-tracking branch 'origin/main' — **Carlomadella**
- `10043b1` — perf: la classifica smette di riordinare tutto, e adesso e' misurata — **Carlomadella**

### File di questa categoria

- **Modificato:** `backend/README.md`
- **Aggiunto:** `backend/carico.js`
- **Modificato:** `backend/database/README.md`
- **Modificato:** `backend/database/archivio.js`
- **Aggiunto:** `backend/database/migrazioni/004_posizioni.sql`
- **Aggiunto:** `backend/database/migrazioni/005_citta.sql`
- **Modificato:** `backend/package.json`

**File interessati in questa categoria:** 7

---

<!-- merge:999ef83 -->
## 01/09/26, 02:49 — Merge remote-tracking branch 'origin/main'

**Tipo:** Merge  
**Autore:** Sadyco La Fame (sadycolafame@192.168.1.53)  
**Commit:** `999ef83`


### Commit contenuti nel merge

- `b2df2b3` — feat: anti-imbroglio che ragiona sul gioco + due bug trovati dalla prova — **Carlomadella**
- `a2e21a1` — feat: il feed di LaFamegram e gli opps veri — **Carlomadella**

### File di questa categoria

- **Modificato:** `backend/README.md`
- **Modificato:** `backend/bot.js`
- **Modificato:** `backend/database/archivio.js`
- **Aggiunto:** `backend/plausibilita.js`
- **Modificato:** `backend/prova.js`
- **Modificato:** `backend/server.js`

**File interessati in questa categoria:** 6

---

<!-- commit:131c7b6 -->
## 01/09/26, 02:33 — feat: classifiche per citta' e per genere, stagioni e albo d'oro

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `131c7b6`


### File di questa categoria

- **Modificato:** `backend/README.md`
- **Modificato:** `backend/database/archivio.js`
- **Aggiunto:** `backend/database/migrazioni/003_classifiche.sql`
- **Modificato:** `backend/prova.js`
- **Modificato:** `backend/server.js`

**File interessati in questa categoria:** 5

---

<!-- commit:2f6ee4d -->
## 01/09/26, 02:27 — feat: moderazione dei nomi e traguardi dati dal server

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `2f6ee4d`


### File di questa categoria

- **Modificato:** `backend/database/archivio.js`
- **Modificato:** `backend/prova.js`
- **Modificato:** `backend/server.js`

**File interessati in questa categoria:** 3

---

<!-- commit:b0afc96 -->
## 01/09/26, 01:16 — .

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `b0afc96`


### File di questa categoria

- **Aggiunto:** `backend/database/migrazioni/002_segnalazioni.sql`
- **Aggiunto:** `backend/moderazione.js`
- **Aggiunto:** `backend/parole.js`

**File interessati in questa categoria:** 3

---

<!-- commit:4879a04 -->
## 01/09/26, 00:23 — feat: accessi Steam/Apple/Google, sanzioni, copia di sicurezza (finisce il 35)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `4879a04`


### File di questa categoria

- **Modificato:** `backend/README.md`
- **Aggiunto:** `backend/accessi.js`
- **Modificato:** `backend/database/README.md`
- **Modificato:** `backend/database/archivio.js`
- **Aggiunto:** `backend/database/copia.js`
- **Modificato:** `backend/package.json`
- **Modificato:** `backend/prova.js`
- **Modificato:** `backend/server.js`

**File interessati in questa categoria:** 8

---

<!-- commit:37808a1 -->
## 01/09/26, 00:09 — feat: database vero, account e salvataggi in cloud (punti 37, 35, meta' del 34)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `37808a1`


### File di questa categoria

- **Modificato:** `backend/README.md`
- **Modificato:** `backend/bot.js`
- **Modificato:** `backend/database/README.md`
- **Modificato:** `backend/database/archivio.js`
- **Aggiunto:** `backend/database/db.js`
- **Aggiunto:** `backend/database/migrazioni/001_iniziale.sql`
- **Aggiunto:** `backend/database/travaso.js`
- **Modificato:** `backend/package.json`
- **Modificato:** `backend/prova.js`
- **Modificato:** `backend/server.js`
- **Modificato:** `frontend/README.md`
- **Modificato:** `frontend/js/net/online.js`

**File interessati in questa categoria:** 12

---

<!-- commit:7b70be6 -->
## 31/08/26, 23:15 — docs: il vincolo giusto e' Steam e gli store, non l'artifact (punto 32)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `7b70be6`


### File di questa categoria

- **Modificato:** `backend/README.md`
- **Modificato:** `backend/database/README.md`

**File interessati in questa categoria:** 2

---

<!-- commit:af4d02c -->
## 31/08/26, 22:54 — refactor: il progetto si divide in frontend e backend (punto 31)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `af4d02c`


### File di questa categoria

- **Aggiunto:** `backend/README.md`
- **Rinominato:** `server/bot.js` → `backend/bot.js`
- **Aggiunto:** `backend/database/README.md`
- **Rinominato:** `server/archivio.js` → `backend/database/archivio.js`
- **Rinominato:** `server/nomi.js` → `backend/nomi.js`
- **Aggiunto:** `backend/package.json`
- **Aggiunto:** `backend/prova.js`
- **Rinominato:** `server/server.js` → `backend/server.js`
- **Aggiunto:** `frontend/README.md`
- **Rinominato:** `css/actionbar.css` → `frontend/css/actionbar.css`
- **Rinominato:** `css/base.css` → `frontend/css/base.css`
- **Rinominato:** `css/creator.css` → `frontend/css/creator.css`
- **Rinominato:** `css/effects.css` → `frontend/css/effects.css`
- **Rinominato:** `css/forms.css` → `frontend/css/forms.css`
- **Rinominato:** `css/game.css` → `frontend/css/game.css`
- **Rinominato:** `css/hub.css` → `frontend/css/hub.css`
- **Rinominato:** `css/hud.css` → `frontend/css/hud.css`
- **Rinominato:** `css/impostazioni.css` → `frontend/css/impostazioni.css`
- **Rinominato:** `css/overlays.css` → `frontend/css/overlays.css`
- **Rinominato:** `css/posto.css` → `frontend/css/posto.css`
- **Rinominato:** `css/preview.css` → `frontend/css/preview.css`
- **Rinominato:** `css/shell.css` → `frontend/css/shell.css`
- **Rinominato:** `index.html` → `frontend/index.html`
- **Rinominato:** `js/core.js` → `frontend/js/core.js`
- **Rinominato:** `js/creator/avatar-presets.js` → `frontend/js/creator/avatar-presets.js`
- **Rinominato:** `js/creator/data.js` → `frontend/js/creator/data.js`
- **Rinominato:** `js/creator/events.js` → `frontend/js/creator/events.js`
- **Rinominato:** `js/creator/nav.js` → `frontend/js/creator/nav.js`
- **Rinominato:** `js/creator/options.js` → `frontend/js/creator/options.js`
- **Rinominato:** `js/creator/portrait.js` → `frontend/js/creator/portrait.js`
- **Rinominato:** `js/creator/render.js` → `frontend/js/creator/render.js`
- **Rinominato:** `js/creator/state.js` → `frontend/js/creator/state.js`
- **Rinominato:** `js/game/actions.js` → `frontend/js/game/actions.js`
- **Rinominato:** `js/game/beatplay.js` → `frontend/js/game/beatplay.js`
- **Rinominato:** `js/game/beats.js` → `frontend/js/game/beats.js`
- **Rinominato:** `js/game/content.js` → `frontend/js/game/content.js`
- **Rinominato:** `js/game/copertine.js` → `frontend/js/game/copertine.js`
- **Rinominato:** `js/game/covers.js` → `frontend/js/game/covers.js`
- **Rinominato:** `js/game/events.js` → `frontend/js/game/events.js`
- **Rinominato:** `js/game/fx.js` → `frontend/js/game/fx.js`
- **Rinominato:** `js/game/hub.js` → `frontend/js/game/hub.js`
- **Rinominato:** `js/game/lifestyle.js` → `frontend/js/game/lifestyle.js`
- **Rinominato:** `js/game/modal.js` → `frontend/js/game/modal.js`
- **Rinominato:** `js/game/phases.js` → `frontend/js/game/phases.js`
- **Rinominato:** `js/game/piazza.js` → `frontend/js/game/piazza.js`
- **Rinominato:** `js/game/posto.js` → `frontend/js/game/posto.js`
- **Rinominato:** `js/game/rivals.js` → `frontend/js/game/rivals.js`
- **Rinominato:** `js/game/scene-art.js` → `frontend/js/game/scene-art.js`
- **Rinominato:** `js/game/sim.js` → `frontend/js/game/sim.js`
- **Rinominato:** `js/game/skip.js` → `frontend/js/game/skip.js`
- **Rinominato:** `js/game/state.js` → `frontend/js/game/state.js`
- **Rinominato:** `js/game/ui.js` → `frontend/js/game/ui.js`
- **Rinominato:** `js/game/uscita.js` → `frontend/js/game/uscita.js`
- **Rinominato:** `js/game/versi.js` → `frontend/js/game/versi.js`
- **Rinominato:** `js/game/writer.js` → `frontend/js/game/writer.js`
- **Rinominato:** `js/impostazioni-ui.js` → `frontend/js/impostazioni-ui.js`
- **Rinominato:** `js/impostazioni.js` → `frontend/js/impostazioni.js`
- **Rinominato:** `js/lingua.js` → `frontend/js/lingua.js`
- **Rinominato:** `js/net/online.js` → `frontend/js/net/online.js`
- **Rinominato:** `media/photo/avatar_profilo_carnagione_chiara.png` → `frontend/media/photo/avatar_profilo_carnagione_chiara.png`
- **Rinominato:** `media/photo/avatar_profilo_carnagione_scura.png` → `frontend/media/photo/avatar_profilo_carnagione_scura.png`
- **Rinominato:** `media/photo/mappa_citta.jpg` → `frontend/media/photo/mappa_citta.jpg`
- **Rinominato:** `media/photo/schermata_di_gioco.png` → `frontend/media/photo/schermata_di_gioco.png`
- **Rinominato:** `"media/photo/schermata_di_gioco_citt\303\240_di_mezzo.png"` → `"frontend/media/photo/schermata_di_gioco_citt\303\240_di_mezzo.png"`
- **Rinominato:** `"media/photo/schermata_di_gioco_citt\303\240_finale.png"` → `"frontend/media/photo/schermata_di_gioco_citt\303\240_finale.png"`
- **Rinominato:** `"media/photo/schermata_di_gioco_citt\303\240_iniziale.png"` → `"frontend/media/photo/schermata_di_gioco_citt\303\240_iniziale.png"`

**File interessati in questa categoria:** 66

---

<!-- commit:47c1f5a -->
## 31/08/26, 22:37 — feat: il server della classifica, una sola per tutti (punto 30)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `47c1f5a`


### File di questa categoria

- **Modificato:** `index.html`
- **Aggiunto:** `js/net/online.js`
- **Aggiunto:** `server/archivio.js`
- **Aggiunto:** `server/bot.js`
- **Aggiunto:** `server/nomi.js`
- **Aggiunto:** `server/server.js`

**File interessati in questa categoria:** 6

---

