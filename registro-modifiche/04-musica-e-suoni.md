# 04 — Musica e suoni

Registro automatico delle modifiche realmente entrate in `main`.

Non contiene idee, TODO o implementazioni future.

---

<!-- merge:241bcda -->
## 26/09/26, 16:50 â€” task/giro-telefono-25-09-2026 â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `241bcda`

### Cosa Ã¨ entrato

- `74ebb70` â€” Responsività: sistema Impostazioni e bersagli touch sotto i 44 punti â€” **Carlomadella**

### File di questa categoria

- **Aggiunto:** `documentazione/prove-telefono/2026-09-26/05-sala-360x640.png`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-26/05-sala-390x844.png`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-26/08-telefono-discografia-360x640.png`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-26/08-telefono-discografia-390x844.png`

**File interessati in questa categoria:** 4

---

<!-- merge:d471010 -->
## 21/09/26, 19:36 â€” task/discografia-app-telefono â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `d471010`

### Cosa Ã¨ entrato

- `6f27b7e` â€” Remastered e parti 2, dopo il giro di fine task: il pezzo senza seed non è di nessuno, il fonico conta una volta sola, la sostituzione della parte 2 si dice a schermo, «lascia» alto come gli altri, la frase del Mix separa guadagno e costo, e la Cabina ha «lascia la parte 2» â€” **Carlomadella**
- `4b12a12` â€” Remastered e parti 2, la coda di «Non è più: "Faccio un pezzo → +10 fama"»: dalla Discografia sul telefono si prenotano, in Studio si fanno — la parte 2 in Cabina col titolo suo (e quando esce rimette in piedi il primo), la remastered al banco del Mix; la riga della Discografia nel telefono, che era rotta, va su due righe â€” **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `documentazione/roadmap.md`
- **Aggiunto:** `frontend/css/seguiti.css`
- **Modificato:** `frontend/css/telefono.css`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/fx.js`
- **Modificato:** `frontend/js/game/orari.js`
- **Aggiunto:** `frontend/js/game/seguiti.js`
- **Modificato:** `frontend/js/game/sim.js`
- **Modificato:** `frontend/js/game/studio-elementi.js`
- **Modificato:** `frontend/js/game/studio.js`
- **Modificato:** `frontend/js/game/tempo.js`
- **Modificato:** `frontend/js/game/ui.js`
- **Modificato:** `frontend/pagine/gioco.html`
- **Aggiunto:** `frontend/test/unit/seguiti.test.js`

**File interessati in questa categoria:** 15

---

<!-- merge:5b1b476 -->
## 21/09/26, 18:31 â€” task/studio-le-tre-code â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `5b1b476`

### Cosa Ã¨ entrato

- `21afb8d` â€” Studio, «Le tre code dello Studio a cinque linguette», dopo il secondo giro: il rivale-contatto uscito dalla classifica che diventa opp rinasce con la storia del feat, non «conosciuti alla Sala» â€” **Carlomadella**
- `e8d8f32` â€” docs: la roadmap segna FATTO «Le tre code dello Studio a cinque linguette», e la nota di chiusura dice che il legame è solo rivaleId â€” **Carlomadella**
- `b588eb3` â€” Studio, «Le tre code dello Studio a cinque linguette»: chi rompe con te alla Sala il posto lo occupa ancora — diventaOpp lega la persona al rivale solo con rivaleId, non con rivale:true che vuol dire «venuto dalla classifica» e la toglieva dal conto della Sala â€” **Carlomadella**
- `6b84125` â€” Studio, dopo il giro di fine task: l'opp nato alla Sala resta legato al suo rivale (non torna in «Dalla classifica» a pagamento), le trasferte non pescano nomi della classifica, l'omonimo di un salvataggio vecchio che diventa opp si fonde col rivale â€” **Carlomadella**
- `c8fc276` â€” Studio: il legame rivale ↔ contatto è un id stabile del rivale, non il seed (che è la copertina dell'ultimo pezzo e cambia a ogni uscita) â€” **Carlomadella**
- `389beea` â€” Studio, «Le tre code dello Studio a cinque linguette»: l'omonimo della classifica si può chiamare (il legame è il seed), chi accetta non ruba un posto alla Sala; la copertina orfana era già chiusa dal 14/09 â€” **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `documentazione/roadmap.md`
- **Modificato:** `frontend/js/game/posto.js`
- **Modificato:** `frontend/js/game/rivals.js`
- **Modificato:** `frontend/js/game/studio.js`
- **Modificato:** `frontend/js/game/trasferte.js`
- **Aggiunto:** `frontend/test/unit/studio-rivali-e-sala.test.js`

**File interessati in questa categoria:** 7

---

<!-- merge:1ff4f30 -->
## 21/09/26, 08:27 â€” task/shop-solo-vestiti-con-filtri â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `1ff4f30`

### Cosa Ã¨ entrato

- `022e7ad` â€” Shop: «i beat non devono stare nello shop … pulsanti tipo filtri … l'attrezzatura non serve se andiamo in studio a registrare» — solo vestiti, coi filtri per tipologia â€” **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/roadmap.md`
- **Modificato:** `frontend/css/game.css`
- **Modificato:** `frontend/css/negozio.css`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/content.js`
- **Modificato:** `frontend/js/game/events.js`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/negozio.js`
- **Modificato:** `frontend/js/game/posto.js`
- **Modificato:** `frontend/js/game/studio.js`
- **Modificato:** `frontend/js/game/telefono.js`
- **Modificato:** `frontend/js/game/ui.js`
- **Modificato:** `frontend/pagine/gioco.html`

**File interessati in questa categoria:** 13

---

<!-- merge:170da15 -->
## 21/09/26, 07:51 â€” task/sala-gratis-e-take-a-25 â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `170da15`

### Cosa Ã¨ entrato

- `d08209e` â€” Sala: «non deve costare energia interagire con gli altri all'interno della sala» — tutto a zero; Studio: «Costa troppo una take in studio» — la prima a 25, le altre a 8 â€” **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/roadmap.md`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/posto.js`
- **Modificato:** `frontend/js/game/studio-elementi.js`

**File interessati in questa categoria:** 4

---

<!-- merge:33dd294 -->
## 20/09/26, 21:57 â€” task/transizioni-video-le-altre â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `33dd294`

### Cosa Ã¨ entrato

- `cddd392` â€” fix(video): il giro di chiusura delle transizioni — cinque voci del 20/09 (47–51), tutte chiuse â€” **Carlomadella**
- `32cb6f5` â€” feat(video): «implementa le transizioni dentro al progetto, che partano cliccando sulla scheda collegata» — gli altri quattro: la Sala, Casa, stacca la spina, registra â€” **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-20/transizione-stacca-agenda-390x844.jpg`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-20/transizione-stacca-agenda-esito-390x844.jpg`
- **Modificato:** `documentazione/roadmap.md`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/luoghi-foto.js`
- **Modificato:** `frontend/js/game/studio-elementi.js`
- **Modificato:** `frontend/js/game/transizioni-video.js`
- **Modificato:** `frontend/js/menu-sistema.js`

**File interessati in questa categoria:** 9

---

<!-- merge:d17bd8f -->
## 20/09/26, 11:49 â€” task/barra-plancia-980-1180 â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `d17bd8f`

### Cosa Ã¨ entrato

- `8781762` â€” fix(plancia): il giro di chiusura della fascia — otto voci del 20/09 (35–42), tutte chiuse â€” **Carlomadella**
- `a8f6cc3` â€” merge: main nel branch della fascia — la mano del rapper; le voci del giro rinumerate 35–40 â€” **Carlomadella**
- `7b8c978` â€” docs(plancia): i due giri di fine task sulla fascia — segnala-problemi e prova-sul-telefono, sei e sette voci â€” **Carlomadella**
- `c4d9f77` â€” feat(plancia): «Fra i 980 e i 1180 punti la barra della plancia trabocca» — la fascia per gradi, e la plancia a 1280 × 800 â€” **Carlomadella**

### File di questa categoria

- **Aggiunto:** `documentazione/prove-telefono/2026-09-20/sala-390x844.jpg`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-20/sala-844x390.jpg`

**File interessati in questa categoria:** 2

---

<!-- merge:67e3719 -->
## 20/09/26, 01:09 â€” task/piccole-agenda-beat-parametri-licenziarsi â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `67e3719`

### Cosa Ã¨ entrato

- `adbe45d` â€” fix(agenda): il giro di chiusura delle quattro piccole — tre voci del 20/09, tutte chiuse â€” **Carlomadella**
- `164e6be` â€” feat(gioco): le quattro piccole — agenda, prezzi dei beat, parametri a 1, licenziarsi â€” **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `documentazione/roadmap.md`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/agenda.js`
- **Modificato:** `frontend/js/game/beats.js`
- **Modificato:** `frontend/js/game/chat.js`
- **Modificato:** `frontend/js/game/eventi-master-1000-v1.2.13.json`
- **Modificato:** `frontend/js/game/eventi-v2.js`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/posto.js`
- **Modificato:** `frontend/js/game/state.js`
- **Modificato:** `frontend/js/game/strada-crimine.js`
- **Modificato:** `frontend/js/game/studio-elementi.js`
- **Modificato:** `frontend/js/game/studio.js`
- **Modificato:** `frontend/js/game/trasferte.js`
- **Modificato:** `frontend/js/game/ui.js`

**File interessati in questa categoria:** 16

---

<!-- merge:975839c -->
## 15/09/26, 00:32 â€” task/studio-cinque-linguette â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `975839c`

### Cosa Ã¨ entrato

- `c4aa9e6` â€” fix(studio): il feat entra nei numeri di Fuori, tutta la classifica in «Con chi», «all'8%» â€” **Carlomadella**
- `43e7555` â€” docs(backend): README-API sa che POST /api/account promuove l'ospite a email â€” **Carlomadella**
- `b4d6a40` â€” docs(studio): «Lo Studio a cinque linguette» — B + D3 + F2 + E chiuso nei documenti â€” **Carlomadella**
- `ea4359e` â€” test(studio): la prova di «Con chi» segue la riga accorciata â€” **Carlomadella**
- `e3ace64` â€” fix(studio): la promo anche nella LaFamegram di eventi-v2, righe del feat che non si troncano â€” **Carlomadella**
- `14eeee1` â€” feat(studio): il pezzo sul banco (F2) — Mix e Uscita ad ogni pezzo â€” **Carlomadella**
- `3df6539` â€” feat(studio): la Cover dentro all'Uscita, e qualita' e ascolti divisi (E) â€” **Carlomadella**
- `35c04b6` â€” feat(studio): il Feat in Cabina accanto al fonico, con le due porte (D3) â€” **Carlomadella**
- `98cc918` â€” feat(studio): il Marketing passa sul telefono, in LaFamegram («Che post fai?») â€” **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/covers.js`

**File interessati in questa categoria:** 1

---

<!-- merge:90d1ea3 -->
## 14/09/26, 06:06 â€” task/studio-marketing-scegli-il-pezzo â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `90d1ea3`

### Cosa Ã¨ entrato

- `4dd4a5b` â€” fix(studio): dopo il terzo giro e la prova sul telefono — avviso largo, linguette, copertine â€” **Carlomadella**
- `e288634` â€” fix(studio): la proposta di copertina non resta orfana, e l'anteprima suona come la promo â€” **Carlomadella**
- `ea69bd3` â€” docs(studio): le misure di un anno con la spinta e le anteprime â€” **Carlomadella**
- `fcebe81` â€” feat(studio): prima Beat, Testo e Cabina; il resto si apre col primo pezzo â€” **Carlomadella**
- `fd90cd7` â€” feat(studio): di un pezzo non uscito si fa uscire un'anteprima, dal Marketing â€” **Carlomadella**
- `28c6561` â€” fix(studio): quando tieni la take si chiede solo il nome, e la copertina si conferma nella Cover â€” **Carlomadella**
- `f09a99d` â€” fix(studio): al Marketing si sceglie quale pezzo spingere, e la promo lo spinge davvero â€” **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-14/cover-elenco-da-confermare-tagliato-360.jpg`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-14/cover-proposta-360.jpg`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-14/cover-proposta-390.jpg`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-14/linguette-chiuse-390.jpg`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-14/linguette-chiuse-beat-attaccato-al-bordo-360.jpg`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-14/linguette-chiuse-toast-stretto-390.jpg`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-14/marketing-anteprima-titolo-a-capo-390.jpg`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-14/marketing-dopo-il-tocco-360.jpg`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-14/marketing-dopo-il-tocco-titolo-fuori-390.jpg`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-14/marketing-due-elenchi-390.jpg`
- **Modificato:** `documentazione/roadmap.md`
- **Modificato:** `frontend/css/effects.css`
- **Modificato:** `frontend/css/overlays.css`
- **Modificato:** `frontend/css/stretto.css`
- **Modificato:** `frontend/css/studio.css`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/copertine.js`
- **Modificato:** `frontend/js/game/fx.js`
- **Modificato:** `frontend/js/game/scene-art.js`
- **Modificato:** `frontend/js/game/sim.js`
- **Modificato:** `frontend/js/game/studio-elementi.js`
- **Modificato:** `frontend/js/game/studio.js`
- **Modificato:** `frontend/js/game/tempo.js`
- **Modificato:** `frontend/js/game/ui.js`

**File interessati in questa categoria:** 25

---

<!-- merge:18824d8 -->
## 13/09/26, 17:44 â€” task/beat-e-tasto-oro-riapplicato â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `18824d8`

### Cosa Ã¨ entrato

- `80108c7` â€” fix(studio): riapplica a mano tre delle quattro correzioni di beat-e-tasto-oro â€” **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `frontend/css/menu-sistema.css`
- **Modificato:** `frontend/js/game/eventi-v2.js`
- **Modificato:** `frontend/js/game/studio.js`

**File interessati in questa categoria:** 4

---

<!-- merge:f6f76da -->
## 10/09/26, 16:27 â€” branch non identificato â†’ main

**Merge effettuato da:** Sadyco La Fame (sadycolafame@192.168.1.58)  
**Merge commit:** `f6f76da`

### Cosa Ã¨ entrato

- `6602293` â€” docs: registra il quarto giro di controllo sul commit 35db690 â€” **Sadyco La Fame**
- `35db690` â€” fix(landing): il pulsante muta/smuta si allinea dalle Impostazioni e tocca 44px sul telefono â€” **Sadyco La Fame**
- `7648cc8` â€” Merge remote-tracking branch 'origin/main' into task/turno-fabbrica-8-ore-e-mute-musica â€” **Sadyco La Fame**
- `1d0f737` â€” chore: alza il ?v= di landing.js dopo il fix del mute, registra il controllo â€” **Sadyco La Fame**
- `346c955` â€” fix(landing): il pulsante mute riattiva anche il contesto audio â€” **Sadyco La Fame**
- `5dcdfec` â€” chore: alza il ?v= di shell.css e landing.js, registra il giro di controllo â€” **Sadyco La Fame**
- `0f7b4a4` â€” feat(landing): pulsante muta/smuta la musica dal menu principale â€” **Sadyco La Fame**
- `a586824` â€” fix(tempo): il turno in fabbrica dura 8 ore, non 1 â€” **Sadyco La Fame**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `frontend/css/shell.css`
- **Modificato:** `frontend/css/tocco.css`
- **Modificato:** `frontend/js/game/tempo.js`
- **Modificato:** `frontend/js/game/ui.js`
- **Modificato:** `frontend/js/impostazioni-ui.js`
- **Modificato:** `frontend/js/landing.js`
- **Modificato:** `frontend/pagine/accesso.html`
- **Modificato:** `frontend/pagine/gioco.html`
- **Modificato:** `frontend/pagine/landing.html`

**File interessati in questa categoria:** 10

---

<!-- merge:de087c7 -->
## 10/09/26, 01:07 â€” main â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `de087c7`

### Cosa Ã¨ entrato

- `a90a3d8` â€” docs: aggiorna implementazioni e roadmap ufficiale â€” **Anni di Fame Bot**
- `fdb9378` â€” docs: aggiorna registro modifiche â€” **Anni di Fame Bot**
- `0724440` â€” Merge branch 'task/beat-energia-e-barre-senza-malus' â€” **Sadyco La Fame**
- `fb731d5` â€” fix(studio): via il costo in energia per farsi fare un beat, e via il malus di scrivere le barre â€” **Sadyco La Fame**
- `231c0f1` â€” docs: aggiorna implementazioni e roadmap ufficiale â€” **Anni di Fame Bot**
- `c2c0306` â€” fix(makehuman): rende Three.js locale e diagnostica il bootstrap â€” **Mycol**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/studio.js`
- **Modificato:** `frontend/js/game/writer.js`
- **Modificato:** `frontend/media/makehuman-camerino-v1/index.html`
- **Modificato:** `frontend/media/makehuman-camerino-v1/runtime.js`
- **Aggiunto:** `frontend/media/makehuman-camerino-v1/vendor/three-r179/LICENSE-three.txt`
- **Aggiunto:** `frontend/media/makehuman-camerino-v1/vendor/three-r179/three.core.js`
- **Aggiunto:** `frontend/media/makehuman-camerino-v1/vendor/three-r179/three.module.js`

**File interessati in questa categoria:** 9

---

<!-- merge:0724440 -->
## 10/09/26, 00:45 â€” task/beat-energia-e-barre-senza-malus â†’ main

**Merge effettuato da:** Sadyco La Fame (sadycolafame@192.168.1.58)  
**Merge commit:** `0724440`

### Cosa Ã¨ entrato

- `fb731d5` â€” fix(studio): via il costo in energia per farsi fare un beat, e via il malus di scrivere le barre â€” **Sadyco La Fame**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/studio.js`
- **Modificato:** `frontend/js/game/writer.js`

**File interessati in questa categoria:** 4

---

<!-- merge:10a372d -->
## 08/09/26, 21:17 â€” main â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `10a372d`

### Cosa Ã¨ entrato

- `354a383` â€” feat(makehuman): rifinisce zoom camerino â€” **Mycol**
- `72b3118` â€” feat(makehuman): aggiorna sfondo camerino â€” **Mycol**
- `d75b15b` â€” feat(makehuman): integra creator e ritratto nel gioco â€” **Mycol**
- `2caed5c` â€” docs: aggiorna registro modifiche â€” **Anni di Fame Bot**
- `b87ec1e` â€” merge: in Studio le azioni non ti buttano più fuori sulla mappa â€” **Sadyco La Fame**
- `fd972b7` â€” test: un controllo automatico vero per il punto 14 dello Studio â€” **Sadyco La Fame**
- `0b41d74` â€” fix: in Studio le azioni non ti buttano più fuori sulla mappa â€” **Sadyco La Fame**

### File di questa categoria

- **Modificato:** `frontend/js/game/writer.js`

**File interessati in questa categoria:** 1

---

<!-- merge:b87ec1e -->
## 08/09/26, 11:09 â€” branch non identificato â†’ main

**Merge effettuato da:** Sadyco La Fame (sadycolafame@192.168.1.58)  
**Merge commit:** `b87ec1e`

### Cosa Ã¨ entrato

- `fd972b7` â€” test: un controllo automatico vero per il punto 14 dello Studio â€” **Sadyco La Fame**
- `0b41d74` â€” fix: in Studio le azioni non ti buttano più fuori sulla mappa â€” **Sadyco La Fame**

### File di questa categoria

- **Modificato:** `frontend/js/game/writer.js`

**File interessati in questa categoria:** 1

---

<!-- merge:e69464e -->
## 07/09/26, 16:03 â€” branch non identificato â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `e69464e`

### Cosa Ã¨ entrato

- `d59c876` â€” style(studio): la pagina si allinea al riferimento, dettaglio per dettaglio â€” **Carlomadella**
- `5c58187` â€” feat(studio): la foto a schermo intero, e sopra la schermata dei riferimenti â€” **Carlomadella**
- `a4a6936` â€” fix(studio): 44 punti sulle linguette, la striscia dice che continua, e una frase in italiano â€” **Carlomadella**
- `89bb7f8` â€” feat(studio): le sette sezioni del punto 4, in una barra in basso â€” **Carlomadella**

### File di questa categoria

- **Rinominato:** `frontend/media/photo/schermate_luoghi/schermate luoghi_senza_HTML/ChatGPT Image 6 set 2026, 19_43_32 (1).png` â†’ `frontend/media/photo/schermate_luoghi/schermate luoghi_senza_HTML/studio_beat.png`

**File interessati in questa categoria:** 1

---

<!-- merge:328eb81 -->
## 06/09/26, 21:22 â€” task/telefono-nuovo â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `328eb81`

### Cosa Ã¨ entrato

- `1bbcd22` â€” feat(telefono): via l'app Messaggi, dock nuovo, sfondo a tutto schermo (punto 68) â€” **Carlomadella**
- `f4f63a2` â€” assets: le schermate dei luoghi in una cartella loro â€” **Carlomadella**
- `3b32ec8` â€” feat(telefono): la home è quella della foto (punto 3 «DA FARE» → punto 68) â€” **Carlomadella**

### File di questa categoria

- **Rinominato:** `frontend/media/photo/studio_creazione_beat.png` â†’ `frontend/media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/studio_creazione_beat.png`
- **Aggiunto:** `frontend/media/photo/telefono/app-discografia.png`

**File interessati in questa categoria:** 2

---

<!-- merge:e4ad390 -->
## 06/09/26, 14:40 â€” origin/main â†’ main

**Merge effettuato da:** Sadyco La Fame (sadycolafame@Mac.Home)  
**Merge commit:** `e4ad390`

### Cosa Ã¨ entrato

- `b1a0d15` â€” docs: aggiorna registro modifiche â€” **Anni di Fame Bot**
- `06bcd36` â€” merge: intro finale carriera dinamica â€” **Mycol**
- `9a6d8ed` â€” feat: rende dinamica intro finale carriera â€” **Mycol**
- `90d6c1a` â€” docs: aggiorna registro modifiche â€” **Anni di Fame Bot**
- `7858816` â€” Merge branch 'task/foto-luoghi-e-azioni' â€” **Carlomadella**
- `35f9227` â€” assets: le undici foto delle azioni e dei luoghi â€” **Carlomadella**
- `0b7bc2d` â€” docs: aggiorna registro modifiche â€” **Anni di Fame Bot**
- `51b2c5e` â€” Merge branch 'task/agenda-blocca-skip' â€” **Carlomadella**
- `efa2033` â€” feat(agenda): un appuntamento segnato ferma il salto del tempo (punto 1 DA FARE) â€” **Carlomadella**
- `ddabac6` â€” docs: aggiorna registro modifiche â€” **Anni di Fame Bot**

### File di questa categoria

- **Aggiunto:** `frontend/media/photo/studio_creazione_beat.png`

**File interessati in questa categoria:** 1

---

<!-- merge:7858816 -->
## 06/09/26, 13:38 â€” task/foto-luoghi-e-azioni â†’ main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `7858816`

### Cosa Ã¨ entrato

- `35f9227` â€” assets: le undici foto delle azioni e dei luoghi â€” **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/media/photo/studio_creazione_beat.png`

**File interessati in questa categoria:** 1

---

<!-- merge:c9451d0 -->
## 06/09/26, 11:28 â€” branch non identificato â†’ main

**Merge effettuato da:** Mycol (mycolbraga@gmail.com)  
**Merge commit:** `c9451d0`

### Cosa Ã¨ entrato

- `15fe477` â€” feat: rifinisce transizioni audio e player persistente â€” **Mycol**

### File di questa categoria

- **Modificato:** `frontend/js/audio/engine.js`
- **Modificato:** `frontend/js/audio/music.js`
- **Modificato:** `frontend/js/avvio.js`
- **Modificato:** `frontend/js/creator/rpg-v24-bridge.js`
- **Modificato:** `frontend/js/pagine.js`
- **Modificato:** `frontend/media/creator-rpg-v24/creator.html`
- **Modificato:** `frontend/pagine/accesso.html`
- **Modificato:** `frontend/pagine/gioco.html`
- **Modificato:** `frontend/pagine/landing.html`

**File interessati in questa categoria:** 9

---

<!-- commit:6f4d15e -->
## 03/09/26, 02:57 — fix: unifica La Sala e Beat Maker come luogo logico

**Tipo:** Commit diretto su main  
**Autore:** Mycol (mycolbraga@gmail.com)  
**Commit:** `6f4d15e`


### File di questa categoria

- **Modificato:** `frontend/js/game/eventi-tempo.js`
- **Modificato:** `frontend/js/game/orari.js`
- **Modificato:** `frontend/js/game/spostamenti.js`

**File interessati in questa categoria:** 3

---

<!-- merge:10f4cc0 -->
## 02/09/26, 20:13 — Merge remote-tracking branch 'origin/feature/bilanciamento-hardening-365' into integration/bilanciamento-hardening-365

**Tipo:** Merge  
**Autore:** Mycol (mycolbraga@gmail.com)  
**Commit:** `10f4cc0`


### Commit contenuti nel merge

- `5135bd0` — fix: limita riciclaggio e coperture criminali — **Mycol**
- `05f315a` — fix: separa il carcere dalle attivita criminali — **Mycol**
- `1e1d03d` — balance: limita recupero e scrittura giornaliera — **Mycol**
- `84d80c4` — fix: ripristina notifiche e catalogo eventi nel dist — **Mycol**

### File di questa categoria

- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/eventi-v2.js`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/orari.js`
- **Modificato:** `frontend/js/game/strada-crimine-ui.js`
- **Modificato:** `frontend/js/game/strada-crimine.js`
- **Modificato:** `frontend/js/game/telefono.js`
- **Modificato:** `frontend/js/game/tempo.js`
- **Modificato:** `frontend/js/game/writer.js`

**File interessati in questa categoria:** 9

---

<!-- merge:7c5c331 -->
## 02/09/26, 18:19 — Merge branch 'task/19-discografia'

**Tipo:** Merge  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `7c5c331`


### Commit contenuti nel merge

- `7f19f20` — feat(discografia): la sezione con i pezzi usciti e come invecchiano (punto 19) — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/css/game.css`
- **Modificato:** `frontend/index.html`
- **Modificato:** `frontend/js/game/sim.js`
- **Modificato:** `frontend/js/game/ui.js`

**File interessati in questa categoria:** 4

---

<!-- merge:2eabcea -->
## 02/09/26, 18:18 — Merge branch 'task/10-videomaker-nella-sala'

**Tipo:** Merge  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `2eabcea`


### Commit contenuti nel merge

- `51ef9bb` — feat(sala): il videomaker entra a La Sala (punto 10) — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/index.html`
- **Modificato:** `frontend/js/game/chat.js`
- **Modificato:** `frontend/js/game/posto.js`
- **Modificato:** `frontend/js/game/sim.js`
- **Modificato:** `frontend/js/game/ui.js`

**File interessati in questa categoria:** 5

---

<!-- merge:3025136 -->
## 02/09/26, 18:15 — Merge branch 'task/20-22-beat-si-vedono'

**Tipo:** Merge  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `3025136`


### Commit contenuti nel merge

- `d184a16` — fix(sala): la conferma si vede e il beat resta sul tavolo (punti 20 e 22) — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/css/effects.css`
- **Modificato:** `frontend/css/posto.css`
- **Modificato:** `frontend/index.html`
- **Modificato:** `frontend/js/game/posto.js`

**File interessati in questa categoria:** 4

---

<!-- commit:4706666 -->
## 01/09/26, 15:24 — feat: scambiarsi il numero con fonici e beatmaker, e ritrovarseli in chat (Da smistare 4)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `4706666`


### File di questa categoria

- **Modificato:** `frontend/css/telefono.css`
- **Modificato:** `frontend/js/game/chat.js`
- **Modificato:** `frontend/js/game/posto.js`

**File interessati in questa categoria:** 3

---

<!-- merge:dd0eda6 -->
## 01/09/26, 12:47 — Merge remote-tracking branch 'origin/main'

**Tipo:** Merge  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `dd0eda6`


### Commit contenuti nel merge

- `b24e007` — docs: chiusi i punti 62-67, il 21/57 chiude con la Strada, il 64 era già fatto — **Sadyco La Fame**
- `f5c0a9f` — feat: Chat nel telefono, età per i personaggi, mappa senza bande nere, meno colori (punti 62, 63, 65, 66, 67) — **Sadyco La Fame**
- `e0e181a` — feat: la Strada, il minigioco del criminale che mancava (chiude i punti 21 e 57) — **Sadyco La Fame**

### File di questa categoria

- **Modificato:** `frontend/css/hub.css`
- **Aggiunto:** `frontend/css/strada-crimine.css`
- **Modificato:** `frontend/css/telefono.css`
- **Modificato:** `frontend/css/tocco.css`
- **Modificato:** `frontend/index.html`
- **Aggiunto:** `frontend/js/game/chat.js`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/lifestyle.js`
- **Modificato:** `frontend/js/game/posto.js`
- **Modificato:** `frontend/js/game/rivals.js`
- **Modificato:** `frontend/js/game/scene-art.js`
- **Modificato:** `frontend/js/game/sim.js`
- **Modificato:** `frontend/js/game/state.js`
- **Aggiunto:** `frontend/js/game/strada-crimine.js`
- **Modificato:** `frontend/js/game/telefono.js`
- **Modificato:** `frontend/js/game/ui.js`
- **Modificato:** `frontend/js/game/uscita.js`

**File interessati in questa categoria:** 17

---

<!-- merge:2c00ae5 -->
## 01/09/26, 04:56 — Merge remote-tracking branch 'origin/main'

**Tipo:** Merge  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `2c00ae5`


### Commit contenuti nel merge

- `cb5ea2d` — fix: sotto i 1180px il telefono non si nascondeva, la mappa collassava a zero — **Sadyco La Fame**
- `a66f3e0` — feat: via la conferma per la sola energia, sette scene con entrate diverse (punti 55, 58) — **Sadyco La Fame**
- `a2b805e` — feat: Pizzeria e Fabbrica al posto di due cartelli chiusi, Casa e Palestra (punti 59, 60, 61) — **Sadyco La Fame**

### File di questa categoria

- **Modificato:** `frontend/css/effects.css`
- **Modificato:** `frontend/css/hub.css`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/ui.js`
- **Modificato:** `frontend/js/impostazioni-ui.js`

**File interessati in questa categoria:** 6

---

<!-- merge:0bf5d48 -->
## 01/09/26, 04:17 — Merge remote-tracking branch 'origin/main'

**Tipo:** Merge  
**Autore:** Sadyco La Fame (sadycolafame@192.168.1.53)  
**Commit:** `0bf5d48`


### Commit contenuti nel merge

- `646ab6b` — fix: sulla landing niente sopra alla foto, come nel concept (punto 4) — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/css/landing.css`
- **Modificato:** `frontend/index.html`
- **Modificato:** `frontend/js/creator/nav.js`

**File interessati in questa categoria:** 3

---

<!-- merge:bfe3e24 -->
## 01/09/26, 03:50 — Merge remote-tracking branch 'origin/main'

**Tipo:** Merge  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `bfe3e24`


### Commit contenuti nel merge

- `b8c5317` — Merge remote-tracking branch 'origin/main' — **Sadyco La Fame**
- `dbc7604` — feat: sette mosse aprono una pagina vera invece di un toast (punto 50) — **Sadyco La Fame**

### File di questa categoria

- **Modificato:** `frontend/css/effects.css`
- **Modificato:** `frontend/index.html`
- **Modificato:** `frontend/js/game/scene-art.js`
- **Modificato:** `frontend/js/game/ui.js`
- **Modificato:** `frontend/js/game/uscita.js`

**File interessati in questa categoria:** 5

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
- **Modificato:** `frontend/css/hub.css`
- **Modificato:** `frontend/index.html`
- **Modificato:** `frontend/js/game/hub.js`
- **Rinominato:** `frontend/media/photo/avatar_profilo_carnagione_chiara.png` → `frontend/media/photo/avatar/avatar_profilo_carnagione_chiara.png`
- **Rinominato:** `frontend/media/photo/avatar_profilo_carnagione_scura.png` → `frontend/media/photo/avatar/avatar_profilo_carnagione_scura.png`
- **Rinominato:** `frontend/media/photo/mappa_citta.jpg` → `frontend/media/photo/schermate di gioco/mappa_citta.jpg`
- **Rinominato:** `frontend/media/photo/schermata_di_gioco.png` → `frontend/media/photo/schermate di gioco/schermata_di_gioco.png`
- **Rinominato:** `"frontend/media/photo/schermata_di_gioco_citt\303\240_di_mezzo.png"` → `"frontend/media/photo/schermate di gioco/schermata_di_gioco_citt\303\240_di_mezzo.png"`
- **Rinominato:** `"frontend/media/photo/schermata_di_gioco_citt\303\240_finale.png"` → `"frontend/media/photo/schermate di gioco/schermata_di_gioco_citt\303\240_finale.png"`
- **Rinominato:** `"frontend/media/photo/schermata_di_gioco_citt\303\240_iniziale.png"` → `"frontend/media/photo/schermate di gioco/schermata_di_gioco_citt\303\240_iniziale.png"`

**File interessati in questa categoria:** 17

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
- **Aggiunto:** `frontend/media/photo/foto_1_pagina_di_landing.png`
- **Aggiunto:** `frontend/media/photo/foto_2_pagina_di_landing.png`

**File interessati in questa categoria:** 8

---

<!-- merge:09d071d -->
## 01/09/26, 02:28 — Merge remote-tracking branch 'origin/main'

**Tipo:** Merge  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `09d071d`


### Commit contenuti nel merge

- `cf88143` — feat: tre suoni nuovi, promo/palestra/giorno (punto 44, in parte) — **Sadyco La Fame**
- `c4665ff` — feat: la Sala ha quaranta dialoghi in piu' (punto 43) — **Sadyco La Fame**
- `a7fbb25` — feat: energia a 100 e vita a giornate, non a settimana (punti 39/40/41) — **Sadyco La Fame**
- `998af83` — docs: punto 45 bloccato su un asset, non su codice — **Sadyco La Fame**
- `9990ce1` — fix: via Produzione e Mixing dalla scheda Abilita (punto 46) — **Sadyco La Fame**
- `cbc9fd3` — feat: il negozio di vestiti, sbloccato da subito (punto 47) — **Sadyco La Fame**
- `7da72ca` — Merge remote-tracking branch 'origin/beat-generi-e-salto-tempo' — **Sadyco La Fame**
- `8d7c0ee` — feat: il telefono e' un iPhone vero da PC, con LaFamegram (punto 42) — **Sadyco La Fame**

### File di questa categoria

- **Modificato:** `frontend/css/hub.css`
- **Modificato:** `frontend/css/hud.css`
- **Aggiunto:** `frontend/css/negozio.css`
- **Aggiunto:** `frontend/css/telefono.css`
- **Modificato:** `frontend/index.html`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/events.js`
- **Modificato:** `frontend/js/game/fx.js`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/lifestyle.js`
- **Aggiunto:** `frontend/js/game/negozio.js`
- **Modificato:** `frontend/js/game/posto.js`
- **Modificato:** `frontend/js/game/sim.js`
- **Modificato:** `frontend/js/game/skip.js`
- **Modificato:** `frontend/js/game/state.js`
- **Aggiunto:** `frontend/js/game/telefono.js`
- **Modificato:** `frontend/js/game/ui.js`
- **Modificato:** `frontend/js/impostazioni-ui.js`

**File interessati in questa categoria:** 18

---

<!-- commit:af4d02c -->
## 31/08/26, 22:54 — refactor: il progetto si divide in frontend e backend (punto 31)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `af4d02c`


### File di questa categoria

- **Rinominato:** `js/game/beatplay.js` → `frontend/js/game/beatplay.js`
- **Rinominato:** `js/game/beats.js` → `frontend/js/game/beats.js`
- **Rinominato:** `js/game/copertine.js` → `frontend/js/game/copertine.js`
- **Rinominato:** `js/game/covers.js` → `frontend/js/game/covers.js`
- **Rinominato:** `js/game/versi.js` → `frontend/js/game/versi.js`
- **Rinominato:** `js/game/writer.js` → `frontend/js/game/writer.js`

**File interessati in questa categoria:** 6

---

<!-- commit:b046e94 -->
## 31/08/26, 18:00 — feat: La Sala, il posto dove si conosce la gente (+ palestra, progressione muta)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `b046e94`


### File di questa categoria

- **Aggiunto:** `css/posto.css`
- **Modificato:** `index.html`
- **Modificato:** `js/game/actions.js`
- **Modificato:** `js/game/hub.js`
- **Aggiunto:** `js/game/posto.js`
- **Modificato:** `js/game/state.js`
- **Modificato:** `js/game/uscita.js`
- **Modificato:** `media/photo/mappa_citta.jpg`

**File interessati in questa categoria:** 8

---

<!-- commit:7c3f9ec -->
## 30/08/26, 17:13 — feat: menu impostazioni e banco suoni nuovo (punti 23, 13, meta del 15)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `7c3f9ec`


### File di questa categoria

- **Modificato:** `js/game/beatplay.js`
- **Modificato:** `js/game/copertine.js`
- **Modificato:** `js/game/versi.js`
- **Modificato:** `js/game/writer.js`

**File interessati in questa categoria:** 4

---

<!-- commit:c7be192 -->
## 30/08/26, 02:45 — fix: css e js con versione nell'url + bottone menu piu' grande + energia in chiaro (punto 18)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `c7be192`


### File di questa categoria

- **Modificato:** `css/game.css`
- **Modificato:** `css/hud.css`
- **Modificato:** `index.html`
- **Modificato:** `js/game/ui.js`

**File interessati in questa categoria:** 4

---

<!-- commit:a02c9ad -->
## 30/08/26, 02:01 — feat: autocompletamento della strofa nel foglio (punto 6)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `a02c9ad`


### File di questa categoria

- **Modificato:** `css/overlays.css`
- **Modificato:** `index.html`
- **Modificato:** `js/game/actions.js`
- **Modificato:** `js/game/uscita.js`
- **Aggiunto:** `js/game/versi.js`
- **Modificato:** `js/game/writer.js`

**File interessati in questa categoria:** 6

---

<!-- commit:d630481 -->
## 30/08/26, 01:49 — feat: si esce da ogni azione con ✕, ESC o un clic fuori (punto 5)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `d630481`


### File di questa categoria

- **Modificato:** `js/game/copertine.js`
- **Modificato:** `js/game/writer.js`

**File interessati in questa categoria:** 2

---

<!-- commit:923ff79 -->
## 29/08/26, 17:14 — feat: salto del tempo, lucidità, ascolto e generi dei beat

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `923ff79`


### File di questa categoria

- **Modificato:** `css/game.css`
- **Modificato:** `index.html`
- **Modificato:** `js/game/actions.js`
- **Aggiunto:** `js/game/beatplay.js`
- **Aggiunto:** `js/game/beats.js`
- **Modificato:** `js/game/sim.js`
- **Aggiunto:** `js/game/skip.js`
- **Modificato:** `js/game/state.js`
- **Modificato:** `js/game/ui.js`
- **Aggiunto:** `media/photo/avatar_profilo.png`

**File interessati in questa categoria:** 10

---

<!-- commit:9adf89d -->
## 29/08/26, 15:53 — refactor: dividi il monolite in index.html + css/ + js/

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `9adf89d`


### File di questa categoria

- **Aggiunto:** `js/game/copertine.js`
- **Aggiunto:** `js/game/covers.js`
- **Aggiunto:** `js/game/writer.js`

**File interessati in questa categoria:** 3

---

