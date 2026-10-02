# 10 — Sistemi di gioco

Registro automatico delle modifiche realmente entrate in `main`.

Non contiene idee, TODO o implementazioni future.

---

<!-- merge:60f258d7 -->
## 02/10/26, 13:53 — task/pizzeria-eventi-ruolo-cucina → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `60f258d7`

### Cosa è entrato

- `bf38e391` — fix(test): rende robusti i test eventi Pizzeria — **mycolbraga**
- `64bc8d45` — test(fabbrica): limita il conteggio eventi al blocco Fabbrica — **mycolbraga**
- `8bd768f7` — fix(lavoro): conserva etichette scalate degli eventi Fabbrica — **mycolbraga**
- `e89c418b` — test(pizzeria): copre eventi ruolo e vita di cucina — **mycolbraga**
- `77441087` — feat(pizzeria): aggiunge dieci eventi di vita in cucina — **mycolbraga**
- `234c0c42` — refactor(lavoro): usa gli eventi ruolo per Fabbrica e Pizzeria — **mycolbraga**
- `0f19459c` — refactor(lavoro): generalizza carico ed effetti degli eventi per sede — **mycolbraga**
- `86ea829c` — feat(pizzeria): aggiunge venti eventi specifici per ruolo — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/js/game/lavoro-eventi.js`
- **Modificato:** `frontend/test/unit/lavoro-eventi.test.js`
- **Aggiunto:** `frontend/test/unit/pizzeria-eventi.test.js`

**File interessati in questa categoria:** 3

---

<!-- merge:244add3b -->
## 02/10/26, 12:59 — task/pizzeria-identita-gameplay → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `244add3b`

### Cosa è entrato

- `a86f5285` — fix(test): rimuove escape letterale nel test Pizzeria — **mycolbraga**
- `a991daa0` — test(pizzeria): allinea soglia promozione alla nuova carriera — **mycolbraga**
- `b2ea5831` — fix(test): corregge parsing test identita Pizzeria — **mycolbraga**
- `83bb3e81` — test(pizzeria): corregge verifica storico rete — **mycolbraga**
- `8df13bab` — test(pizzeria): copre identita part-time e crescita sociale — **mycolbraga**
- `ba38a102` — feat(pizzeria): definisce identita part-time e rete per ruolo — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/test/unit/fabbrica-presenze.test.js`
- **Aggiunto:** `frontend/test/unit/pizzeria-identita.test.js`

**File interessati in questa categoria:** 3

---

<!-- merge:f442a416 -->
## 02/10/26, 07:53 — task/reset-carriera-fine-contratto → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `f442a416`

### Cosa è entrato

- `3bd41177` — test(regressioni): allinea il gate al reset carriera — **mycolbraga**
- `3b85784c` — chore(cache): invalida chiusura contratto nei luoghi — **mycolbraga**
- `669d9c71` — refactor(lavoro): usa chiusura contratto atomica nel licenziamento — **mycolbraga**
- `2f8eb696` — refactor(lavoro): lascia la chiusura job al contratto — **mycolbraga**
- `04af1fb9` — fix(lavoro): rende atomica la chiusura del contratto — **mycolbraga**
- `f2733d72` — docs(lavoro): allinea roadmap al reset carriera — **mycolbraga**
- `1eaf3c49` — chore(cache): invalida reset carriera lavoro — **mycolbraga**
- `c20b42b6` — docs(lavoro): documenta il reset carriera alla chiusura — **mycolbraga**
- `0661561a` — ui(lavoro): chiarisce il reset carriera nel contratto — **mycolbraga**
- `e8787060` — test(lavoro): copre reset carriera su uscita e riassunzione — **mycolbraga**
- `002458b2` — fix(lavoro): azzera la carriera alla fine del contratto — **mycolbraga**

### File di questa categoria

- **Modificato:** `documentazione/roadmap.md`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/luoghi-foto.js`
- **Modificato:** `frontend/pagine/gioco.html`
- **Modificato:** `frontend/test/unit/fabbrica-presenze.test.js`

**File interessati in questa categoria:** 6

---

<!-- merge:f6b291e5 -->
## 02/10/26, 01:25 — task/docs-dimissioni-lavoro → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `f6b291e5`

### Cosa è entrato

- `ac9e7543` — docs: allinea dimissioni e licenziamento al gameplay attuale — **mycolbraga**
- `e19c7099` — docs: rinomina il punto lavoro su dimissioni e licenziamento — **mycolbraga**
- `0c168de6` — docs: aggiorna la roadmap sulle dimissioni dai lavori — **mycolbraga**

### File di questa categoria

- **Modificato:** `documentazione/roadmap.md`

**File interessati in questa categoria:** 1

---

<!-- merge:6bad7f1d -->
## 02/10/26, 00:35 — task/strada-incontri-criminali-gameplay → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `6bad7f1d`

### Cosa è entrato

- `dcf6efc9` — fix(strada): separa davvero i trigger giornalieri delle opportunita — **mycolbraga**
- `0403a258` — fix(strada): non consuma la varieta se il popup viene annullato — **mycolbraga**
- `74c82e92` — test(strada): include i colpi nel runtime delle opportunita — **mycolbraga**
- `89b8074e` — test(strada): copre incontri criminali fuori dal lavoro — **mycolbraga**
- `4e985c2c` — fix(strada): annulla anche il cooldown se il popup non parte — **mycolbraga**
- `cdc8bd49` — feat(strada): fa emergere opportunita anche fuori dalla Fabbrica — **mycolbraga**
- `065a5875` — feat(strada): abilita incontri criminali anche fuori dal lavoro — **mycolbraga**
- `5f8d8f81` — fix(strada): aggiorna il riepilogo al nuovo incontro generale — **mycolbraga**
- `211ecd21` — ux(strada): rende leggibile il colpo associato alla proposta — **mycolbraga**
- `f48ae181` — refactor(strada): prepara trigger riutilizzabili per gli incontri — **mycolbraga**
- `ccc0d7f8` — chore(cache): invalida opportunita criminali — **mycolbraga**
- `a33877f3` — test(strada): copre pool dialoghi e conseguenze gameplay — **mycolbraga**
- `03a1dde0` — refactor(strada): centralizza gli effetti reali delle opportunita — **mycolbraga**
- `13c7bf9f` — feat(strada): aggiunge dialogo e decisione alle opportunita — **mycolbraga**
- `2ea0280d` — feat(strada): introduce pool generale di opportunita criminali — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/js/game/eventi-v2.js`
- **Modificato:** `frontend/js/game/strada-crimine.js`
- **Modificato:** `frontend/pagine/gioco.html`
- **Modificato:** `frontend/test/unit/fabbrica-strada.test.js`

**File interessati in questa categoria:** 4

---

<!-- merge:471c965 -->
## 01/10/26, 21:09 — task/rimuovi-centro-impiego → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `471c965`

### Cosa è entrato

- `f95897f` — docs(lavori): segna la rimozione del Centro per l'impiego — **mycolbraga**
- `8d9dd18` — chore(cache): invalida i moduli dopo la rimozione del Centro impiego — **mycolbraga**
- `1305f1b` — refactor(lavori): completa pulizia riferimenti cerca lavoro — **mycolbraga**
- `86ff491` — test(lavori): protegge la rimozione del Centro per l'impiego — **mycolbraga**
- `9685d24` — test(bilanciamento): usa la Fabbrica invece dei colloqui legacy — **mycolbraga**
- `49d7f3e` — refactor(lavori): rimuove scena del vecchio cerca lavoro — **mycolbraga**
- `5fee8ff` — refactor(lavori): aggiorna commento macchina azioni — **mycolbraga**
- `ffbe266` — refactor(lavori): pulisce UI del vecchio cerca lavoro — **mycolbraga**
- `e1cc3aa` — refactor(lavori): rimuove coordinate Centro per l'impiego — **mycolbraga**
- `2a4f4fe` — refactor(lavori): rimuove orario Centro per l'impiego — **mycolbraga**
- `4d0d832` — refactor(lavori): rimuove il tempo dei colloqui legacy — **mycolbraga**
- `c1b1835` — refactor(mappa): rimuove il Centro per l'impiego — **mycolbraga**
- `d0fa123` — refactor(lavori): mette in pausa i lavori legacy — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/orari.js`
- **Modificato:** `frontend/js/game/scene-art.js`
- **Modificato:** `frontend/js/game/spostamenti.js`
- **Modificato:** `frontend/js/game/tempo.js`
- **Modificato:** `frontend/js/game/ui.js`
- **Modificato:** `frontend/pagine/gioco.html`

**File interessati in questa categoria:** 8

---

<!-- merge:19f6506 -->
## 01/10/26, 20:34 — feature/pizzeria-cinematica → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `19f6506`

### Cosa è entrato

- `9838ebc` — feat: integra cinematica di ingresso Pizzeria — **mycolbraga**
- `decd68b` — assets(pizzeria): add arrival cinematic frames — **mycolbraga**
- `861b15e` — feat(pizzeria): hook arrival cinematic slideshow — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/transizioni-video.js`

**File interessati in questa categoria:** 2

---

<!-- merge:77dea95 -->
## 01/10/26, 20:00 — fix/ci-avvio-rapido-roadmap → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `77dea95`

### Cosa è entrato

- `222bf1a` — test: riallinea audit avvio rapido al gameplay reale — **mycolbraga**
- `ff2ecec` — ci: separa avvio rapido dal MakeHuman pesante — **mycolbraga**
- `4c1205c` — ci: evita verifiche duplicate su push e pull request — **mycolbraga**
- `019c5c9` — fix: stabilizza avvio rapido CI e riallinea inventario roadmap — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/package.json`
- **Modificato:** `frontend/test/e2e/gameplay.spec.js`

**File interessati in questa categoria:** 2

---

<!-- merge:dc26a32 -->
## 01/10/26, 13:34 — feature/eventi-lavoro-famiglie-rebased → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `dc26a32`

### Cosa è entrato

- `85cf559` — test: riallinea dritta Fabbrica al testo corrente — **mycolbraga**
- `70a302e` — fix: chiudi regressioni CI punto 10 — **mycolbraga**
- `ce9fc63` — chore: riallinea punto 10 con main e risolvi conflitti — **mycolbraga**
- `4541d4f` — chore: sync main before point 10 merge — **mycolbraga**
- `be367d2` — docs(roadmap): align promoter geography with work contacts — **mycolbraga**
- `7be1556` — docs(contacts): clarify work-only promoter exception in Provincia — **mycolbraga**
- `d27fa4d` — test(work-events): follow refreshed event engine asset — **mycolbraga**
- `b959cd2` — chore(work-events): refresh persistent conflict engine cache — **mycolbraga**
- `69e291b` — test(work-events): keep pending conflicts persistent until shift commit — **mycolbraga**
- `39aa1f6` — fix(work-events): persist pending work-music conflicts across reloads — **mycolbraga**
- `58ada6d` — chore(gameplay): refresh reviewed work-event caches — **mycolbraga**
- `86c1985` — test(work-review): cover clock resume and structured re-entry — **mycolbraga**
- `a2bad73` — fix(work-events): wait for resumed shift before post-shift hooks — **mycolbraga**
- `2cd000b` — fix(work): generalize structured contract re-entry state — **mycolbraga**
- `3afec04` — fix(agenda): read numeric game time correctly — **mycolbraga**
- `d245203` — docs(events): mark legacy promotion arc as superseded — **mycolbraga**
- `dbdd985` — docs(work): point structured careers at real event engine — **mycolbraga**
- `cb9c6fa` — test(work-events): cover work families on latest structured jobs — **mycolbraga**
- `4581e71` — test(audit): align work-event checks with latest main — **mycolbraga**
- `588e750` — chore(work-events): load work event engine on latest gameplay — **mycolbraga**
- `2eba74b` — docs(famepedia): add work event families to structured jobs — **mycolbraga**
- `e60798f` — feat(work-events): arbitrate structured work events after committed shifts — **mycolbraga**
- `56c4c49` — feat(work-events): connect structured jobs to persistent event effects — **mycolbraga**
- `54f273d` — feat(work-events): carry landing.html integration onto latest main — **mycolbraga**
- `d6f10dd` — feat(work-events): carry strada-crimine.js integration onto latest main — **mycolbraga**
- `aef21f6` — feat(work-events): carry ui.js integration onto latest main — **mycolbraga**
- `c215384` — feat(work-events): carry agenda.js integration onto latest main — **mycolbraga**
- `3b222e9` — feat(work-events): add persistent work event families on structured jobs — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/js/famepedia.js`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/agenda.js`
- **Modificato:** `frontend/js/game/eventi-v2.js`
- **Aggiunto:** `frontend/js/game/lavoro-eventi.js`
- **Modificato:** `frontend/js/game/posto.js`
- **Modificato:** `frontend/js/game/strada-crimine.js`
- **Modificato:** `frontend/js/game/ui.js`
- **Modificato:** `frontend/pagine/gioco.html`
- **Modificato:** `frontend/pagine/landing.html`
- **Modificato:** `frontend/test/unit/fabbrica-strada.test.js`
- **Aggiunto:** `frontend/test/unit/lavoro-eventi.test.js`

**File interessati in questa categoria:** 12

---

<!-- merge:3b85be1 -->
## 27/09/26, 16:18 — task/diario-senza-giorno-saltato → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `3b85be1`

### Cosa è entrato

- `29c22f1` — La fine giornata non scrive più «1 giorno saltato» nel diario — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/skip.js`

**File interessati in questa categoria:** 1

---

<!-- merge:ae1413f -->
## 27/09/26, 16:18 — task/classifica-dieci-posti → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `ae1413f`

### Cosa è entrato

- `5d1fe4c` — La classifica conta chi sta davanti a qualcuno, e il diario scrive l'hype vero — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/sim.js`

**File interessati in questa categoria:** 1

---

<!-- merge:f83c4ad -->
## 21/09/26, 08:07 — task/shop-lo-stile-che-conta → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `f83c4ad`

### Cosa è entrato

- `08c5a0e` — Shop: «Lo stile che conta» — i capi addosso pesano su hype, presenza e promo — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/sim.js`
- **Aggiunto:** `frontend/js/game/stile.js`

**File interessati in questa categoria:** 3

---

<!-- merge:bf00c1d -->
## 19/09/26, 15:59 — task/avvio-rapido → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `bf00c1d`

### Cosa è entrato

- `db3e0e8` — fix(avvio): il giro di chiusura di «Preparo il tuo artista» — sette voci del 19/09, tutte chiuse — **Carlomadella**
- `f29ad6b` — feat(avvio): «Preparo il tuo artista» — «l'avvio rapido ci mette quasi due minuti, e nessuno lo dice al giocatore» — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/test/e2e/gameplay.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:668d98c -->
## 19/09/26, 14:00 — task/pagine-luoghi-foto → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `668d98c`

### Cosa è entrato

- `2cf77fc` — fix(luoghi): il giro di chiusura delle pagine sulla foto — sei voci del 19/09, tutte chiuse — **Carlomadella**
- `18141cf` — feat(luoghi): Casa, Palestra, Live Club e stacca la spina sulla loro foto — «aggiungi le foto di background dei posti» — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/hub.js`
- **Aggiunto:** `frontend/js/game/luoghi-foto.js`

**File interessati in questa categoria:** 2

---

<!-- merge:684a1af -->
## 16/09/26, 14:36 — task/prima-transizione-video → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `684a1af`

### Cosa è entrato

- `f0f730f` — feat(transizioni): il primo video, lo Studio — «implementa le transizioni dentro al progetto, che partano cliccando sulla scheda collegata» — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/hub.js`
- **Aggiunto:** `frontend/js/game/transizioni-video.js`

**File interessati in questa categoria:** 2

---

<!-- merge:64db26c -->
## 13/09/26, 20:20 — task/studio-mix-da-solo → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `64db26c`

### Cosa è entrato

- `5566fbb` — fix(studio): al banco del Mix si sceglie il fonico, e «da solo» si clicca — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/studio.js`

**File interessati in questa categoria:** 1

---

<!-- merge:55a9083 -->
## 13/09/26, 20:08 — task/studio-marketing-dopo-timing → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `55a9083`

### Cosa è entrato

- `8cb498d` — feat(studio): Timing prima di Marketing — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/studio.js`

**File interessati in questa categoria:** 1

---

<!-- merge:4515ce0 -->
## 13/09/26, 17:12 — task/watcher-uccide-la-partita → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `4515ce0`

### Cosa è entrato

- `d4a33fd` — fix(dev): il watcher non ricarica piu' la pagina in mezzo alla partita — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/test/e2e/gameplay.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:541eacc -->
## 13/09/26, 15:18 — test/vitest-playwright-gate → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `541eacc`

### Cosa è entrato

- `fea873b` — docs: scrive la diagnosi del giro lungo, per chi ci ricasca — **Carlomadella**
- `83a695f` — test: il controllo sulle navigazioni non prendeva l'errore piu' frequente — **Carlomadella**
- `dad1c62` — test: il giro lungo nel browser esce dalla catena di ogni push — **Carlomadella**
- `007de3d` — test: alza il tetto dell'attesa dell'avvio rapido a dieci minuti — **Carlomadella**
- `8507075` — merge: porta il ramo del gate di prove sopra main — **Carlomadella**
- `288fa6c` — docs: appunti nuovi in implementazioni — **Carlomadella**
- `b4a6202` — docs(dipendenze): il registro dice quello che c'e' davvero, debito compreso — **Carlomadella**
- `e78ed6d` — test: il gate di verifica fa girare prove vere, e trova l'avvio rapido rotto — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/test/e2e/gameplay.spec.js`
- **Aggiunto:** `frontend/test/unit/gameplay-regressions.test.js`

**File interessati in questa categoria:** 2

---

<!-- merge:bdb2c5f -->
## 05/09/26, 16:17 — task/pagine-di-servizio → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `bdb2c5f`

### Cosa è entrato

- `59c3988` — refactor(backend): le pagine di errore diventano middleware, e il 404 esce dal frontend — **Carlomadella**
- `28af709` — feat: le pagine di servizio — avvio, rotto, salvataggio illeggibile, server giù, 404 — **Carlomadella**
- `86ba2c2` — chore: i video in ordine, i concept fuori dal pacchetto, e un 404 a ogni avvio — **Carlomadella**

### File di questa categoria

- **Modificato:** `backend/README-API.md`
- **Modificato:** `backend/prova.js`
- **Aggiunto:** `backend/risposte.js`
- **Modificato:** `backend/server.js`
- **Modificato:** `frontend/concept/README.md`
- **Rinominato:** `frontend/media/photo/immagini_background_personaggio/booth_registrazione_notturno.png` → `frontend/concept/booth_registrazione_notturno.png`
- **Rinominato:** `frontend/media/photo/immagini_background_personaggio/control_room_notturna.png` → `frontend/concept/control_room_notturna.png`
- **Rinominato:** `frontend/media/photo/pagina_skill_tree/interfaccia_skill_tree_a colonne.png` → `frontend/concept/skill_tree_a_colonne.png`
- **Rinominato:** `frontend/media/photo/pagina_skill_tree/interfaccia_skill_tree_ramificato.png` → `frontend/concept/skill_tree_ramificato.png`
- **Aggiunto:** `frontend/css/servizio.css`
- **Modificato:** `frontend/index.html`
- **Modificato:** `frontend/js/game/state.js`
- **Modificato:** `frontend/js/game/trasferte.js`
- **Modificato:** `frontend/js/net/online.js`
- **Aggiunto:** `frontend/js/servizio.js`
- **Rimosso:** `frontend/media/video/06_palestra_boxe_definitivo.mp4`
- **Rimosso:** `frontend/media/video/08_ingresso_club_definitivo.mp4`
- **Rinominato:** `frontend/media/video/07_partenza_milano_definitivo.mp4` → `frontend/media/video/Transizioni di scena/07_partenza_milano_definitivo.mp4`

**File interessati in questa categoria:** 18

---

<!-- merge:60b46fe -->
## 04/09/26, 12:12 — task/studio-prova → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `60b46fe`

### Cosa è entrato

- `05d39fc` — fix: il logo non finisce piu' sopra a "Lo Studio" — **Carlomadella**
- `ccaf2a1` — fix: lo Studio non manda piu' al Catalogo, e la promo non finge — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/studio.js`

**File interessati in questa categoria:** 3

---

<!-- commit:d7455b1 -->
## 03/09/26, 21:10 — fix: nuove carriere partono da zero

**Tipo:** Commit diretto su main

**Autore:** Mycol (mycolbraga@gmail.com)

**Commit:** `d7455b1`


### File di questa categoria

- **Modificato:** `frontend/js/game/state.js`

**File interessati in questa categoria:** 1

---

<!-- commit:e89ad13 -->
## 03/09/26, 14:13 — feat: completa il gameplay del carcere

**Tipo:** Commit diretto su main

**Autore:** Mycol (mycolbraga@gmail.com)

**Commit:** `e89ad13`


### File di questa categoria

- **Modificato:** `frontend/js/game/eventi-tempo.js`
- **Modificato:** `frontend/js/game/eventi-v2.js`
- **Modificato:** `frontend/js/game/sim.js`
- **Modificato:** `frontend/js/game/strada-crimine-ui.js`
- **Modificato:** `frontend/js/game/strada-crimine.js`
- **Modificato:** `frontend/js/game/tempo-controlli.js`
- **Modificato:** `frontend/js/game/tempo.js`
- **Modificato:** `frontend/js/game/trasferte.js`

**File interessati in questa categoria:** 8

---

<!-- commit:0468db2 -->
## 03/09/26, 13:09 — feat: nuovo flusso avvio, slot e difficolta

**Tipo:** Commit diretto su main

**Autore:** Mycol (mycolbraga@gmail.com)

**Commit:** `0468db2`


### File di questa categoria

- **Modificato:** `frontend/js/game/state.js`

**File interessati in questa categoria:** 1

---

<!-- commit:36dd0b5 -->
## 03/09/26, 10:30 — fix: blocca il gameplay durante il carcere

**Tipo:** Commit diretto su main  
**Autore:** Mycol (mycolbraga@gmail.com)  
**Commit:** `36dd0b5`


### File di questa categoria

- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/spostamenti.js`
- **Modificato:** `frontend/js/game/telefono.js`

**File interessati in questa categoria:** 3

---

<!-- commit:5d3233c -->
## 03/09/26, 02:31 — feat: la palestra diventa un sistema, non un pulsante (punto 9)

**Tipo:** Commit diretto su main  
**Autore:** Sadyco La Fame (sadycolafame@192.168.1.53)  
**Commit:** `5d3233c`


### File di questa categoria

- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/fx.js`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/scene-art.js`

**File interessati in questa categoria:** 4

---

<!-- commit:6d99c14 -->
## 01/09/26, 14:45 — feat: transizioni quando una card apre una pagina, 156 scene per i fan (Da smistare 1, 2)

**Tipo:** Commit diretto su main  
**Autore:** Sadyco La Fame (sadycolafame@192.168.1.53)  
**Commit:** `6d99c14`


### File di questa categoria

- **Modificato:** `frontend/js/game/state.js`

**File interessati in questa categoria:** 1

---

<!-- commit:856c27c -->
## 01/09/26, 12:44 — feat: responsivita' finita (punti 36 e responsivita'), due collisioni di classe risolte

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `856c27c`


### File di questa categoria

- **Modificato:** `frontend/js/game/hub.js`

**File interessati in questa categoria:** 1

---

<!-- commit:7b70be6 -->
## 31/08/26, 23:15 — docs: il vincolo giusto e' Steam e gli store, non l'artifact (punto 32)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `7b70be6`


### File di questa categoria

- **Modificato:** `backend/README.md`
- **Modificato:** `backend/database/README.md`
- **Modificato:** `frontend/README.md`

**File interessati in questa categoria:** 3

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

<!-- commit:9adf89d -->
## 29/08/26, 15:53 — refactor: dividi il monolite in index.html + css/ + js/

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `9adf89d`


### File di questa categoria

- **Aggiunto:** `css/actionbar.css`
- **Aggiunto:** `css/base.css`
- **Aggiunto:** `css/effects.css`
- **Aggiunto:** `css/forms.css`
- **Aggiunto:** `css/game.css`
- **Aggiunto:** `css/hud.css`
- **Aggiunto:** `css/overlays.css`
- **Aggiunto:** `css/preview.css`
- **Aggiunto:** `css/shell.css`
- **Rimosso:** `game_2.html`
- **Aggiunto:** `index.html`
- **Aggiunto:** `js/core.js`
- **Aggiunto:** `js/creator/data.js`
- **Aggiunto:** `js/creator/events.js`
- **Aggiunto:** `js/creator/nav.js`
- **Aggiunto:** `js/creator/portrait.js`
- **Aggiunto:** `js/creator/render.js`
- **Aggiunto:** `js/creator/state.js`
- **Aggiunto:** `js/game/actions.js`
- **Aggiunto:** `js/game/content.js`
- **Aggiunto:** `js/game/copertine.js`
- **Aggiunto:** `js/game/covers.js`
- **Aggiunto:** `js/game/events.js`
- **Aggiunto:** `js/game/fx.js`
- **Aggiunto:** `js/game/lifestyle.js`
- **Aggiunto:** `js/game/modal.js`
- **Aggiunto:** `js/game/phases.js`
- **Aggiunto:** `js/game/piazza.js`
- **Aggiunto:** `js/game/rivals.js`
- **Aggiunto:** `js/game/scene-art.js`
- **Aggiunto:** `js/game/sim.js`
- **Aggiunto:** `js/game/state.js`
- **Aggiunto:** `js/game/ui.js`
- **Aggiunto:** `js/game/writer.js`

**File interessati in questa categoria:** 34

---

<!-- commit:8844343 -->
## 29/08/26, 15:24 — chore: import iniziale da artifact

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `8844343`


### File di questa categoria

- **Aggiunto:** `game_2.html`

**File interessati in questa categoria:** 1

---

