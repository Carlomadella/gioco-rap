# 04 — Musica e suoni

Registro automatico delle modifiche realmente entrate in `main`.

Non contiene idee, TODO o implementazioni future.

---

<!-- merge:234a3d39 -->
## 02/10/26, 18:43 — fix/pizzeria-secondo-audit → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `234a3d39`

### Cosa è entrato

- `72a1f5ba` — docs(roadmap): segna la Pizzeria v1 come completata — **mycolbraga**
- `8e38e56e` — fix(tempo): completa il clock delle azioni lanciate dai luoghi — **mycolbraga**
- `bb97d27e` — test(pizzeria): verifica che la storyline non si ripeta all'infinito — **mycolbraga**
- `1593c29a` — fix(pizzeria): chiude le micro-storyline dopo il terzo episodio — **mycolbraga**
- `753ccd41` — test(pizzeria): rispetta l'apertura durante lo spostamento — **mycolbraga**
- `cba7b797` — test(pizzeria): copre tutte le fonti rete ripetibili — **mycolbraga**
- `62bcf307` — fix(pizzeria): chiude le ultime ricompense rete ripetibili per persona — **mycolbraga**
- `128980b2` — test(pizzeria): allinea il test storico alla carriera più lenta — **mycolbraga**
- `93d7e7dc` — test(pizzeria): aspetta l'apertura prima del turno integrato — **mycolbraga**
- `4668418d` — docs(famepedia): allinea carriera lenta e micro-storyline Pizzeria — **mycolbraga**
- `eab0127d` — test(pizzeria): copre micro-storyline persistenti — **mycolbraga**
- `e4f4c45e` — test(pizzeria): copre anti-farming dei contatti nelle chat — **mycolbraga**
- `c3dccd69` — test(pizzeria): allinea carriera lenta e perimetro anti-farming — **mycolbraga**
- `4a26a4e7` — test(pizzeria): usa NPC unici e prova musica-spostamento-conflitto-turno — **mycolbraga**
- `eb27b1a5` — test(pizzeria): verifica che la carriera non domini il primo anno — **mycolbraga**
- `ea94909f` — test(pizzeria): aggiorna stress test alla carriera più lenta — **mycolbraga**
- `4c775ac8` — feat(pizzeria): aggiunge micro-storyline sociali persistenti — **mycolbraga**
- `087a5bac` — fix(pizzeria): impedisce farming rete anche dalle chat — **mycolbraga**
- `ccf97da2` — fix(pizzeria): limita l'anti-farming al solo perimetro Pizzeria — **mycolbraga**
- `b9440958` — balance(pizzeria): rende la carriera lavorativa davvero secondaria — **mycolbraga**

### File di questa categoria

- **Modificato:** `documentazione/roadmap.md`
- **Modificato:** `frontend/js/famepedia.js`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/chat.js`
- **Modificato:** `frontend/js/game/eventi-v2.js`
- **Modificato:** `frontend/js/game/lavoro-eventi.js`
- **Modificato:** `frontend/js/game/luoghi-foto.js`
- **Modificato:** `frontend/test/e2e/pizzeria-workflow.spec.js`
- **Modificato:** `frontend/test/unit/fabbrica-presenze.test.js`
- **Modificato:** `frontend/test/unit/lavori-contatti.test.js`
- **Modificato:** `frontend/test/unit/pizzeria-bilanciamento.test.js`
- **Modificato:** `frontend/test/unit/pizzeria-identita.test.js`
- **Modificato:** `frontend/test/unit/pizzeria-sociale.test.js`

**File interessati in questa categoria:** 13

---

<!-- merge:21ca4050 -->
## 02/10/26, 17:16 — fix/pizzeria-audit-chiusura → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `21ca4050`

### Cosa è entrato

- `7ba40290` — test(pizzeria): allinea il playtest alla UI carriera reale — **mycolbraga**
- `09052f97` — test(lavoro): include i contatti normali Pizzeria — **mycolbraga**
- `b0e5b996` — feat(pizzeria): etichetta i contatti normali nel telefono — **mycolbraga**
- `0b4f5179` — test(pizzeria): aggiunge playtest browser su 24 servizi — **mycolbraga**
- `c9e08341` — docs(famepedia): allinea la Pizzeria al gameplay attuale — **mycolbraga**
- `69241ac3` — test(pizzeria): blocca rete troppo musicale e farming per persona — **mycolbraga**
- `053a0830` — balance(pizzeria): rende decrescente la rete da dialoghi e autopromo — **mycolbraga**
- `c91996a3` — balance(pizzeria): limita la rete dai reincontri post-turno — **mycolbraga**
- `c35ff8f5` — balance(pizzeria): limita la rete farmabile dalla stessa persona — **mycolbraga**
- `4e8bbf38` — feat(pizzeria): descrive i nuovi contatti sociali — **mycolbraga**
- `0658fefe` — feat(pizzeria): porta i contatti normali nelle chat persistenti — **mycolbraga**
- `1d4e1dfc` — feat(pizzeria): aggiunge contatti normali persistenti — **mycolbraga**
- `998b6b54` — balance(pizzeria): rende la rete soprattutto sociale, non musicale — **mycolbraga**
- `166adb88` — test(pizzeria): blocca regressione sul contatto più recente — **mycolbraga**
- `81977bd7` — fix(pizzeria): mostra l'ultimo contatto nel riepilogo turno — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/js/famepedia.js`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/chat.js`
- **Modificato:** `frontend/js/game/eventi-v2.js`
- **Modificato:** `frontend/js/game/lavoro-eventi.js`
- **Modificato:** `frontend/js/game/posto.js`
- **Modificato:** `frontend/js/game/telefono.js`
- **Aggiunto:** `frontend/test/e2e/pizzeria-workflow.spec.js`
- **Modificato:** `frontend/test/unit/lavori-contatti.test.js`
- **Modificato:** `frontend/test/unit/pizzeria-identita.test.js`
- **Modificato:** `frontend/test/unit/pizzeria-ui.test.js`

**File interessati in questa categoria:** 11

---

<!-- merge:e7463e6c -->
## 02/10/26, 17:12 — fix/mobile-creator-cache-bust → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `e7463e6c`

### Cosa è entrato

- `1f95a22d` — fix(cache): aggiorna bridge creator nel gioco — **mycolbraga**
- `ac801195` — fix(cache): aggiorna bridge creator sulla landing — **mycolbraga**
- `e645ea57` — fix(cache): forza nuova versione creator RPG — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/js/creator/rpg-v24-bridge.js`
- **Modificato:** `frontend/pagine/gioco.html`
- **Modificato:** `frontend/pagine/landing.html`

**File interessati in questa categoria:** 3

---

<!-- merge:e460a62b -->
## 02/10/26, 14:31 — task/pizzeria-bilanciamento-playtest → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `e460a62b`

### Cosa è entrato

- `bbbf1087` — chore(pizzeria): aggiunge comando bilanciamento dedicato — **mycolbraga**
- `26f85365` — test(pizzeria): copre bilanciamento annuale e convivenza con la musica — **mycolbraga**
- `e013c5a4` — test(pizzeria): aggiunge stress test economico sociale e doppia vita — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/package.json`
- **Aggiunto:** `frontend/test/unit/pizzeria-bilanciamento.test.js`

**File interessati in questa categoria:** 2

---

<!-- merge:3b581dea -->
## 02/10/26, 11:28 — fix/pizzeria-hours-badge → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `3b581dea`

### Cosa è entrato

- `651e6b54` — docs: registra fix orario Pizzeria — **mycolbraga**
- `456d4d49` — chore(cache): aggiorna versione orari — **mycolbraga**
- `59bd96af` — test(hours): blocca regressione orario Pizzeria — **mycolbraga**
- `346d0a65` — fix(hours): allinea apertura Pizzeria alle 17 — **mycolbraga**

### File di questa categoria

- **Modificato:** `documentazione/roadmap.md`
- **Modificato:** `frontend/js/game/orari.js`
- **Modificato:** `frontend/pagine/gioco.html`

**File interessati in questa categoria:** 3

---

<!-- merge:d01ea2eb -->
## 02/10/26, 10:42 — task/fabbrica-playtest-doppia-vita → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `d01ea2eb`

### Cosa è entrato

- `ad348e44` — Merge pull request #52 from Carlomadella/main — **mycolbraga**
- `6a3ca5c9` — docs(fabbrica): documenta playtest doppia vita — **mycolbraga**
- `2b3e5e58` — test(fabbrica): protegge playtest lavoro musica — **mycolbraga**
- `c6aabcc9` — test(fabbrica): aggiunge playtest doppia vita lavoro musica — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/test/unit/fabbrica-bilanciamento.test.js`

**File interessati in questa categoria:** 1

---

<!-- merge:7d758154 -->
## 02/10/26, 10:25 — task/fabbrica-stress-test-operativo → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `7d758154`

### Cosa è entrato

- `80b1b594` — docs(fabbrica): documenta stress test operativo — **mycolbraga**
- `54005b52` — docs(fabbrica): chiarisce copertura stress test operativo — **mycolbraga**
- `746793ee` — test(fabbrica): copre ruolo disciplina eventi e musica — **mycolbraga**
- `a27f3ba5` — test(fabbrica): estende stress test all'esperienza operativa — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/test/unit/fabbrica-bilanciamento.test.js`

**File interessati in questa categoria:** 1

---

<!-- merge:63e6420a -->
## 02/10/26, 10:02 — task/via-agente-telefono → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `63e6420a`

### Cosa è entrato

- `efd73c23` — Merge remote-tracking branch 'origin/main' into task/via-agente-telefono — **Carlomadella**
- `b16d78d5` — Merge remote-tracking branch 'origin/main' into task/via-agente-telefono — **Carlomadella**
- `fd83936d` — Via l'agente prova-sul-telefono, e il suo promemoria — **Carlomadella**

### File di questa categoria

- **Rimosso:** `.claude/agents/prova-sul-telefono.md`
- **Modificato:** `.claude/settings.json`
- **Modificato:** `documentazione/README.md`
- **Modificato:** `documentazione/come-si-lavora.md`
- **Modificato:** `documentazione/roadmap.md`

**File interessati in questa categoria:** 5

---

<!-- merge:d88a31c4 -->
## 02/10/26, 09:55 — task/studio-mixtape-album → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `d88a31c4`

### Cosa è entrato

- `0a1b18a7` — La roadmap si aggiorna al push di chiunque: gli eventi della Fabbrica per ruolo (#43) — **Carlomadella**
- `db4db0e2` — Merge remote-tracking branch 'origin/main' into task/studio-mixtape-album — **Carlomadella**
- `762541d7` — La roadmap si aggiorna al push di chiunque: il layout orizzontale del telefono (#41, #42) — **Carlomadella**
- `2fac1790` — Merge remote-tracking branch 'origin/main' into task/studio-mixtape-album — **Carlomadella**
- `9791bac1` — Studio: «fai in modo che si possano creare mixtape e album» — **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `documentazione/roadmap.md`
- **Aggiunto:** `frontend/css/progetti.css`
- **Aggiunto:** `frontend/js/game/progetti.js`
- **Modificato:** `frontend/js/game/sim.js`
- **Modificato:** `frontend/js/game/state.js`
- **Modificato:** `frontend/js/game/studio-elementi.js`
- **Modificato:** `frontend/js/game/studio.js`
- **Modificato:** `frontend/js/game/ui.js`
- **Modificato:** `frontend/pagine/gioco.html`
- **Aggiunto:** `frontend/test/unit/progetti.test.js`

**File interessati in questa categoria:** 11

---

<!-- merge:9950e9ff -->
## 01/10/26, 23:40 — task/fabbrica-conflitto-musica-scelta → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `9950e9ff`

### Cosa è entrato

- `1556a833` — fix(lavoro): non conta gli straordinari fuori contratto nel conflitto — **mycolbraga**
- `30e99346` — chore(cache): invalida conflitto lavoro musica — **mycolbraga**
- `81022920` — test(lavoro): copre scelta tra turno e musica — **mycolbraga**
- `c066b6fe` — feat(lavoro): rende leggibile il conflitto turno musica — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/js/game/lavoro-eventi.js`
- **Modificato:** `frontend/pagine/gioco.html`
- **Modificato:** `frontend/test/unit/lavoro-eventi.test.js`

**File interessati in questa categoria:** 3

---

<!-- merge:14b1549 -->
## 01/10/26, 21:27 — fix/registro-unico-utf8 → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `14b1549`

### Cosa è entrato

- `e8cf7ae` — test(mappa): aggiorna il conteggio dopo la rimozione del Centro impiego — **mycolbraga**
- `b8d423e` — docs(registro): ripara il mojibake storico — **mycolbraga**
- `8cb9235` — docs(registro): ripara il mojibake storico — **mycolbraga**
- `7e09dfe` — docs(registro): ripara il mojibake storico — **mycolbraga**
- `836a29d` — docs(registro): ripara il mojibake storico — **mycolbraga**
- `8511f88` — docs(registro): ripara il mojibake storico — **mycolbraga**
- `6dac263` — docs(registro): ripara il mojibake storico — **mycolbraga**
- `f8e0268` — docs(registro): ripara il mojibake storico — **mycolbraga**
- `9585ec5` — docs(registro): ripara il mojibake storico — **mycolbraga**
- `5a23544` — docs(registro): ripara il mojibake storico — **mycolbraga**
- `8df13bf` — docs(registro): ripara il mojibake storico — **mycolbraga**
- `3168697` — docs(registro): ripara il mojibake storico — **mycolbraga**
- `163cce2` — docs(registro): ripara il mojibake storico — **mycolbraga**
- `5bbbdc2` — chore(git): fissa LF per il registro modifiche — **mycolbraga**
- `0353524` — test(git): impedisce doppio writer e mojibake del registro — **mycolbraga**
- `892485c` — fix(registro): corregge il testo del workflow — **mycolbraga**
- `aadf981` — fix(registro): corregge le stringhe UTF-8 del generatore — **mycolbraga**
- `8ef14d8` — fix(git): lascia il registro post-merge a GitHub Actions — **mycolbraga**

### File di questa categoria

- **Aggiunto:** `.gitattributes`

**File interessati in questa categoria:** 1

---

<!-- merge:747e7b7 -->
## 01/10/26, 13:58 — task/circolo-orari-e-pagine → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `747e7b7`

### Cosa è entrato

- `7332eb4` — Il Circolo a stanze: i titoli dritti, via il pennarello corsivo — **Carlomadella**
- `c48b66b` — Merge remote-tracking branch 'origin/main' into task/circolo-orari-e-pagine — **Carlomadella**
- `c511470` — Il Circolo a stanze: le voci 85–89 del giro di fine task — **Carlomadella**
- `ab18a4f` — Il Circolo a stanze: Bancone, Sala, Palco, Backstage — **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `documentazione/problemi-risolti.md`
- **Modificato:** `documentazione/roadmap.md`
- **Aggiunto:** `frontend/css/circolo-stanze.css`
- **Modificato:** `frontend/css/circolo.css`
- **Modificato:** `frontend/css/luoghi-foto.css`
- **Modificato:** `frontend/css/stretto.css`
- **Aggiunto:** `frontend/js/game/circolo-incontri.js`
- **Aggiunto:** `frontend/js/game/circolo-stanze.js`
- **Modificato:** `frontend/js/game/circolo.js`
- **Modificato:** `frontend/js/game/luoghi-foto.js`
- **Rimosso:** `frontend/media/photo/circolo/palco.jpg`
- **Rimosso:** `frontend/media/photo/circolo/serata.jpg`
- **Aggiunto:** `frontend/media/photo/circolo/stanze/backstage.jpg`
- **Aggiunto:** `frontend/media/photo/circolo/stanze/bancone.jpg`
- **Aggiunto:** `frontend/media/photo/circolo/stanze/palco.jpg`
- **Rimosso:** `frontend/media/photo/schermate_luoghi/schermate luoghi_senza_HTML/live_club.png`
- **Modificato:** `frontend/pagine/gioco.html`
- **Aggiunto:** `frontend/test/unit/circolo-stanze.test.js`

**File interessati in questa categoria:** 19

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

<!-- merge:2c67b9c -->
## 01/10/26, 12:43 — task/studio-cursori-e-linguette → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `2c67b9c`

### Cosa è entrato

- `0dd90b6` — Il giro di fine task dopo il merge della Pizzeria: i numeri ?v= dei file cambiati — **Carlomadella**
- `d627a5b` — Merge branch 'task/test-fabbrica-dopo-pizzeria' into task/studio-cursori-e-linguette — **Carlomadella**
- `f3b42b4` — Merge branch 'task/test-fabbrica-dopo-pizzeria' into task/studio-cursori-e-linguette — **Carlomadella**
- `a810c7f` — Merge remote-tracking branch 'origin/main' into task/studio-cursori-e-linguette — **Carlomadella**
- `6e63f12` — Studio, linguette sempre aperte: le due voci del giro di fine task — **Carlomadella**
- `9f6bca3` — Studio: le linguette sempre aperte e i cursori del Mix in G.studio.cursori — **Carlomadella**
- `afbb42f` — Il giro di fine task su «Su LaFamegram non posta nessuno» e «Beat, Testo e Cabina a mano, il resto in automatico coi malus» — **Carlomadella**
- `211769e` — Dopo il resto in automatico, Mix e Uscita restano aperte — **Carlomadella**
- `fdd7002` — Beat, Testo e Cabina a mano, il resto in automatico coi malus — **Carlomadella**
- `9b896a8` — Su LaFamegram posta anche la gente: i post degli incontri si datano quando nascono — **Carlomadella**
- `0e9af7f` — Su LaFamegram posta anche la gente — **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `documentazione/problemi-risolti.md`
- **Aggiunto:** `documentazione/prove-telefono/2026-10-01/lafamegram-feed-server-360x640.png`
- **Aggiunto:** `documentazione/prove-telefono/2026-10-01/lafamegram-gente-390x844.png`
- **Aggiunto:** `documentazione/prove-telefono/2026-10-01/studio-auto-dopo-tocco-beat-390x844.png`
- **Aggiunto:** `documentazione/prove-telefono/2026-10-01/studio-auto-mix-riaperto-390x844.png`
- **Aggiunto:** `documentazione/prove-telefono/2026-10-01/studio-auto-uscita-riaperta-390x844.png`
- **Modificato:** `frontend/css/studio.css`
- **Modificato:** `frontend/js/game/eventi-v2.js`
- **Modificato:** `frontend/js/game/state.js`
- **Modificato:** `frontend/js/game/strada.js`
- **Aggiunto:** `frontend/js/game/studio-automatico.js`
- **Modificato:** `frontend/js/game/studio-elementi.js`
- **Modificato:** `frontend/js/game/studio.js`
- **Aggiunto:** `frontend/js/game/telefono-feed-gente.js`
- **Modificato:** `frontend/js/game/telefono.js`
- **Modificato:** `frontend/pagine/gioco.html`
- **Modificato:** `frontend/test/unit/seguiti.test.js`

**File interessati in questa categoria:** 18

---

<!-- merge:e3e9a54 -->
## 30/09/26, 20:30 — feature/fabbrica-pagina-foto → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `e3e9a54`

### Cosa è entrato

- `b101ed9` — test: rende stabile audit transizione stacca — **mycolbraga**
- `9acedf4` — chore(fabbrica): invalida cache del fondale 4K — **mycolbraga**
- `e90306a` — fix(fabbrica): sostituisce fondale con versione 4K — **github-actions[bot]**
- `f188aaa` — chore(fabbrica): installa fondale 4K — **mycolbraga**
- `96aeb85` — fix(fabbrica): punta al fondale 4K — **mycolbraga**
- `54200c4` — fix(fabbrica): punta al fondale 4K — **mycolbraga**
- `b8d1877` — test(fabbrica): verifica il fondale effettivo — **mycolbraga**
- `66c9fce` — fix(fabbrica): usa il fondale presente nella branch — **mycolbraga**
- `8ca4588` — test(fabbrica): allinea audit al fondale webp — **mycolbraga**
- `9d3cf81` — fix(fabbrica): usa il fondale 2K webp — **mycolbraga**
- `375a134` — test(fabbrica): protegge il turno dentro la pagina — **mycolbraga**
- `874e784` — chore(fabbrica): aggiorna cache della pagina fotografica — **mycolbraga**
- `26e5e81` — fix(fabbrica): mantiene il turno nella pagina fotografica — **mycolbraga**
- `1e1214d` — chore: rimuove asset Fabbrica duplicato — **mycolbraga**
- `8138ea9` — chore: pulisce asset temporaneo Fabbrica — **mycolbraga**
- `fa021af` — chore: rimuove file temporanei asset Fabbrica — **mycolbraga**
- `f13763a` — chore: pulizia asset Fabbrica 3/4 — **mycolbraga**
- `0d867e0` — chore: pulizia asset Fabbrica 2/4 — **mycolbraga**
- `cc2a863` — chore: pulizia asset Fabbrica 1/4 — **mycolbraga**
- `0268ac7` — feat: aggiunge il fondale 2K della Fabbrica — **mycolbraga**
- `828c405` — tmp: asset fabbrica 4/4 — **mycolbraga**
- `c61d95d` — tmp: asset fabbrica 3/4 — **mycolbraga**
- `4a497dc` — tmp: asset fabbrica 2/4 — **mycolbraga**
- `b82bd05` — tmp: asset fabbrica 1/4 — **mycolbraga**
- `679ffdd` — test: copre la nuova pagina Fabbrica — **mycolbraga**
- `d883661` — chore: aggiorna cache pagina fabbrica — **mycolbraga**
- `4fa44a2` — feat: apre la fabbrica senza popup — **mycolbraga**
- `d2c48ec` — feat: trasforma la fabbrica in pagina fotografica — **mycolbraga**
- `796bc86` — chore(fabbrica): prepara asset 2K — **mycolbraga**
- `23deaf4` — feat(fabbrica): aggiungi fondale 2K — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/luoghi-foto.js`
- **Aggiunto:** `frontend/media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/fabbrica.webp`
- **Modificato:** `frontend/pagine/gioco.html`

**File interessati in questa categoria:** 4

---

<!-- merge:4a578e8 -->
## 30/09/26, 00:35 — task/il-circolo → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `4a578e8`

### Cosa è entrato

- `cf8f789` — Il Circolo: le voci del giro di fine task — il palco solo stando lì, la serata a metà, il telefono — **Carlomadella**
- `07d14b9` — Il Circolo: la Sala e il Live Club diventano un posto solo, con la serata giocata a momenti — **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `documentazione/problemi-risolti.md`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-30/circolo-cartelli-390x844.png`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-30/circolo-cartelli-844x390.png`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-30/circolo-foto-844x390.png`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-30/circolo-tasti-844x390.png`
- **Modificato:** `documentazione/roadmap.md`
- **Modificato:** `frontend/README.md`
- **Aggiunto:** `frontend/css/circolo.css`
- **Modificato:** `frontend/css/menu-sistema.css`
- **Rimosso:** `frontend/css/posto.css`
- **Modificato:** `frontend/css/stretto.css`
- **Modificato:** `frontend/css/tocco.css`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/agenda.js`
- **Aggiunto:** `frontend/js/game/circolo.js`
- **Modificato:** `frontend/js/game/eventi-master-1000-v1.2.13.json`
- **Modificato:** `frontend/js/game/eventi-tempo.js`
- **Modificato:** `frontend/js/game/eventi-v2.js`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/luoghi-foto.js`
- **Modificato:** `frontend/js/game/orari.js`
- **Modificato:** `frontend/js/game/posto.js`
- **Modificato:** `frontend/js/game/spostamenti.js`
- **Modificato:** `frontend/js/game/strada.js`
- **Modificato:** `frontend/js/game/studio.js`
- **Modificato:** `frontend/js/game/telefono.js`
- **Modificato:** `frontend/js/game/tempo-controlli.js`
- **Modificato:** `frontend/js/game/transizioni-video.js`
- **Modificato:** `frontend/js/game/trasferte.js`
- **Modificato:** `frontend/js/game/uscita.js`
- **Modificato:** `frontend/js/lingua.js`
- **Modificato:** `frontend/js/menu-sistema.js`
- **Aggiunto:** `frontend/media/photo/circolo/palco.jpg`
- **Aggiunto:** `frontend/media/photo/circolo/serata.jpg`
- **Aggiunto:** `frontend/media/photo/schermate_luoghi/schermate luoghi_senza_HTML/il_circolo.png`
- **Aggiunto:** `frontend/media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/backstage.png`
- **Aggiunto:** `frontend/media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/bancone.png`
- **Aggiunto:** `frontend/media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/il_circolo.png`
- **Aggiunto:** `frontend/media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/open_mic.png`
- **Aggiunto:** `frontend/media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/sala.png`
- **Modificato:** `frontend/pagine/gioco.html`
- **Aggiunto:** `frontend/test/unit/circolo.test.js`
- **Modificato:** `frontend/test/unit/studio-rivali-e-sala.test.js`

**File interessati in questa categoria:** 44

---

<!-- merge:3e09a47 -->
## 27/09/26, 16:52 — task/foglio-a-capo-sul-telefono → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `3e09a47`

### Cosa è entrato

- `32afc59` — Foglio sul telefono: tasti su una riga, barre separate, Invio che dice «avanti» — **Carlomadella**
- `44db19d` — Il Foglio si rimisura girando il telefono, e l'a capo della tastiera è un Invio — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/writer.js`

**File interessati in questa categoria:** 1

---

<!-- merge:04fda6c -->
## 27/09/26, 16:19 — task/foglio-a-capo-sul-telefono → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `04fda6c`

### Cosa è entrato

- `fa298cc` — Sul telefono le barre del Foglio vanno a capo — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/writer.js`

**File interessati in questa categoria:** 1

---

<!-- merge:13c9519 -->
## 27/09/26, 16:18 — task/due-piccole-testo-traguardo → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `13c9519`

### Cosa è entrato

- `9cf22cf` — «Ancora 1 settimana così», e «Vivi di musica» vuole che non lavori — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/content.js`
- **Modificato:** `frontend/js/game/sim.js`
- **Aggiunto:** `frontend/test/e2e/due-piccole.spec.js`

**File interessati in questa categoria:** 3

---

<!-- merge:26f1182 -->
## 27/09/26, 16:18 — task/titolo-dopo-il-viaggio → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `26f1182`

### Cosa è entrato

- `cf57c4c` — Dopo la conferma di un viaggio il titolo del pezzo torna scrivibile — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/copertine.js`

**File interessati in questa categoria:** 1

---

<!-- merge:f2ec9b9 -->
## 27/09/26, 15:13 — task/alto-coperto-da-altra-finestra → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `f2ec9b9`

### Cosa è entrato

- `d0f5485` — La coda della modale: si conta una volta, riparte anche dopo un errore — **Carlomadella**
- `8e00cf1` — Un evento ALTO a schermo non si copre più con un'altra finestra — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/copertine.js`

**File interessati in questa categoria:** 1

---

<!-- merge:241bcda -->
## 26/09/26, 16:50 — task/giro-telefono-25-09-2026 → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `241bcda`

### Cosa è entrato

- `74ebb70` — Responsività: sistema Impostazioni e bersagli touch sotto i 44 punti — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `documentazione/prove-telefono/2026-09-26/05-sala-360x640.png`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-26/05-sala-390x844.png`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-26/08-telefono-discografia-360x640.png`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-26/08-telefono-discografia-390x844.png`

**File interessati in questa categoria:** 4

---

<!-- merge:d471010 -->
## 21/09/26, 19:36 — task/discografia-app-telefono → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `d471010`

### Cosa è entrato

- `6f27b7e` — Remastered e parti 2, dopo il giro di fine task: il pezzo senza seed non è di nessuno, il fonico conta una volta sola, la sostituzione della parte 2 si dice a schermo, «lascia» alto come gli altri, la frase del Mix separa guadagno e costo, e la Cabina ha «lascia la parte 2» — **Carlomadella**
- `4b12a12` — Remastered e parti 2, la coda di «Non è più: "Faccio un pezzo → +10 fama"»: dalla Discografia sul telefono si prenotano, in Studio si fanno — la parte 2 in Cabina col titolo suo (e quando esce rimette in piedi il primo), la remastered al banco del Mix; la riga della Discografia nel telefono, che era rotta, va su due righe — **Carlomadella**

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
## 21/09/26, 18:31 — task/studio-le-tre-code → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `5b1b476`

### Cosa è entrato

- `21afb8d` — Studio, «Le tre code dello Studio a cinque linguette», dopo il secondo giro: il rivale-contatto uscito dalla classifica che diventa opp rinasce con la storia del feat, non «conosciuti alla Sala» — **Carlomadella**
- `e8d8f32` — docs: la roadmap segna FATTO «Le tre code dello Studio a cinque linguette», e la nota di chiusura dice che il legame è solo rivaleId — **Carlomadella**
- `b588eb3` — Studio, «Le tre code dello Studio a cinque linguette»: chi rompe con te alla Sala il posto lo occupa ancora — diventaOpp lega la persona al rivale solo con rivaleId, non con rivale:true che vuol dire «venuto dalla classifica» e la toglieva dal conto della Sala — **Carlomadella**
- `6b84125` — Studio, dopo il giro di fine task: l'opp nato alla Sala resta legato al suo rivale (non torna in «Dalla classifica» a pagamento), le trasferte non pescano nomi della classifica, l'omonimo di un salvataggio vecchio che diventa opp si fonde col rivale — **Carlomadella**
- `c8fc276` — Studio: il legame rivale ↔ contatto è un id stabile del rivale, non il seed (che è la copertina dell'ultimo pezzo e cambia a ogni uscita) — **Carlomadella**
- `389beea` — Studio, «Le tre code dello Studio a cinque linguette»: l'omonimo della classifica si può chiamare (il legame è il seed), chi accetta non ruba un posto alla Sala; la copertina orfana era già chiusa dal 14/09 — **Carlomadella**

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
## 21/09/26, 08:27 — task/shop-solo-vestiti-con-filtri → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `1ff4f30`

### Cosa è entrato

- `022e7ad` — Shop: «i beat non devono stare nello shop … pulsanti tipo filtri … l'attrezzatura non serve se andiamo in studio a registrare» — solo vestiti, coi filtri per tipologia — **Carlomadella**

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
## 21/09/26, 07:51 — task/sala-gratis-e-take-a-25 → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `170da15`

### Cosa è entrato

- `d08209e` — Sala: «non deve costare energia interagire con gli altri all'interno della sala» — tutto a zero; Studio: «Costa troppo una take in studio» — la prima a 25, le altre a 8 — **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/roadmap.md`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/posto.js`
- **Modificato:** `frontend/js/game/studio-elementi.js`

**File interessati in questa categoria:** 4

---

<!-- merge:33dd294 -->
## 20/09/26, 21:57 — task/transizioni-video-le-altre → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `33dd294`

### Cosa è entrato

- `cddd392` — fix(video): il giro di chiusura delle transizioni — cinque voci del 20/09 (47–51), tutte chiuse — **Carlomadella**
- `32cb6f5` — feat(video): «implementa le transizioni dentro al progetto, che partano cliccando sulla scheda collegata» — gli altri quattro: la Sala, Casa, stacca la spina, registra — **Carlomadella**

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
## 20/09/26, 11:49 — task/barra-plancia-980-1180 → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `d17bd8f`

### Cosa è entrato

- `8781762` — fix(plancia): il giro di chiusura della fascia — otto voci del 20/09 (35–42), tutte chiuse — **Carlomadella**
- `a8f6cc3` — merge: main nel branch della fascia — la mano del rapper; le voci del giro rinumerate 35–40 — **Carlomadella**
- `7b8c978` — docs(plancia): i due giri di fine task sulla fascia — segnala-problemi e prova-sul-telefono, sei e sette voci — **Carlomadella**
- `c4d9f77` — feat(plancia): «Fra i 980 e i 1180 punti la barra della plancia trabocca» — la fascia per gradi, e la plancia a 1280 × 800 — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `documentazione/prove-telefono/2026-09-20/sala-390x844.jpg`
- **Aggiunto:** `documentazione/prove-telefono/2026-09-20/sala-844x390.jpg`

**File interessati in questa categoria:** 2

---

<!-- merge:67e3719 -->
## 20/09/26, 01:09 — task/piccole-agenda-beat-parametri-licenziarsi → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `67e3719`

### Cosa è entrato

- `adbe45d` — fix(agenda): il giro di chiusura delle quattro piccole — tre voci del 20/09, tutte chiuse — **Carlomadella**
- `164e6be` — feat(gioco): le quattro piccole — agenda, prezzi dei beat, parametri a 1, licenziarsi — **Carlomadella**

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
## 15/09/26, 00:32 — task/studio-cinque-linguette → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `975839c`

### Cosa è entrato

- `c4aa9e6` — fix(studio): il feat entra nei numeri di Fuori, tutta la classifica in «Con chi», «all'8%» — **Carlomadella**
- `43e7555` — docs(backend): README-API sa che POST /api/account promuove l'ospite a email — **Carlomadella**
- `b4d6a40` — docs(studio): «Lo Studio a cinque linguette» — B + D3 + F2 + E chiuso nei documenti — **Carlomadella**
- `ea4359e` — test(studio): la prova di «Con chi» segue la riga accorciata — **Carlomadella**
- `e3ace64` — fix(studio): la promo anche nella LaFamegram di eventi-v2, righe del feat che non si troncano — **Carlomadella**
- `14eeee1` — feat(studio): il pezzo sul banco (F2) — Mix e Uscita ad ogni pezzo — **Carlomadella**
- `3df6539` — feat(studio): la Cover dentro all'Uscita, e qualita' e ascolti divisi (E) — **Carlomadella**
- `35c04b6` — feat(studio): il Feat in Cabina accanto al fonico, con le due porte (D3) — **Carlomadella**
- `98cc918` — feat(studio): il Marketing passa sul telefono, in LaFamegram («Che post fai?») — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/js/game/covers.js`

**File interessati in questa categoria:** 1

---

<!-- merge:90d1ea3 -->
## 14/09/26, 06:06 — task/studio-marketing-scegli-il-pezzo → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `90d1ea3`

### Cosa è entrato

- `4dd4a5b` — fix(studio): dopo il terzo giro e la prova sul telefono — avviso largo, linguette, copertine — **Carlomadella**
- `e288634` — fix(studio): la proposta di copertina non resta orfana, e l'anteprima suona come la promo — **Carlomadella**
- `ea69bd3` — docs(studio): le misure di un anno con la spinta e le anteprime — **Carlomadella**
- `fcebe81` — feat(studio): prima Beat, Testo e Cabina; il resto si apre col primo pezzo — **Carlomadella**
- `fd90cd7` — feat(studio): di un pezzo non uscito si fa uscire un'anteprima, dal Marketing — **Carlomadella**
- `28c6561` — fix(studio): quando tieni la take si chiede solo il nome, e la copertina si conferma nella Cover — **Carlomadella**
- `f09a99d` — fix(studio): al Marketing si sceglie quale pezzo spingere, e la promo lo spinge davvero — **Carlomadella**

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
## 13/09/26, 17:44 — task/beat-e-tasto-oro-riapplicato → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `18824d8`

### Cosa è entrato

- `80108c7` — fix(studio): riapplica a mano tre delle quattro correzioni di beat-e-tasto-oro — **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `frontend/css/menu-sistema.css`
- **Modificato:** `frontend/js/game/eventi-v2.js`
- **Modificato:** `frontend/js/game/studio.js`

**File interessati in questa categoria:** 4

---

<!-- merge:f6f76da -->
## 10/09/26, 16:27 — branch non identificato → main

**Merge effettuato da:** Sadyco La Fame (sadycolafame@192.168.1.58)  
**Merge commit:** `f6f76da`

### Cosa è entrato

- `6602293` — docs: registra il quarto giro di controllo sul commit 35db690 — **Sadyco La Fame**
- `35db690` — fix(landing): il pulsante muta/smuta si allinea dalle Impostazioni e tocca 44px sul telefono — **Sadyco La Fame**
- `7648cc8` — Merge remote-tracking branch 'origin/main' into task/turno-fabbrica-8-ore-e-mute-musica — **Sadyco La Fame**
- `1d0f737` — chore: alza il ?v= di landing.js dopo il fix del mute, registra il controllo — **Sadyco La Fame**
- `346c955` — fix(landing): il pulsante mute riattiva anche il contesto audio — **Sadyco La Fame**
- `5dcdfec` — chore: alza il ?v= di shell.css e landing.js, registra il giro di controllo — **Sadyco La Fame**
- `0f7b4a4` — feat(landing): pulsante muta/smuta la musica dal menu principale — **Sadyco La Fame**
- `a586824` — fix(tempo): il turno in fabbrica dura 8 ore, non 1 — **Sadyco La Fame**

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
## 10/09/26, 01:07 — main → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `de087c7`

### Cosa è entrato

- `a90a3d8` — docs: aggiorna implementazioni e roadmap ufficiale — **Anni di Fame Bot**
- `fdb9378` — docs: aggiorna registro modifiche — **Anni di Fame Bot**
- `0724440` — Merge branch 'task/beat-energia-e-barre-senza-malus' — **Sadyco La Fame**
- `fb731d5` — fix(studio): via il costo in energia per farsi fare un beat, e via il malus di scrivere le barre — **Sadyco La Fame**
- `231c0f1` — docs: aggiorna implementazioni e roadmap ufficiale — **Anni di Fame Bot**
- `c2c0306` — fix(makehuman): rende Three.js locale e diagnostica il bootstrap — **Mycol**

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
## 10/09/26, 00:45 — task/beat-energia-e-barre-senza-malus → main

**Merge effettuato da:** Sadyco La Fame (sadycolafame@192.168.1.58)  
**Merge commit:** `0724440`

### Cosa è entrato

- `fb731d5` — fix(studio): via il costo in energia per farsi fare un beat, e via il malus di scrivere le barre — **Sadyco La Fame**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/studio.js`
- **Modificato:** `frontend/js/game/writer.js`

**File interessati in questa categoria:** 4

---

<!-- merge:10a372d -->
## 08/09/26, 21:17 — main → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `10a372d`

### Cosa è entrato

- `354a383` — feat(makehuman): rifinisce zoom camerino — **Mycol**
- `72b3118` — feat(makehuman): aggiorna sfondo camerino — **Mycol**
- `d75b15b` — feat(makehuman): integra creator e ritratto nel gioco — **Mycol**
- `2caed5c` — docs: aggiorna registro modifiche — **Anni di Fame Bot**
- `b87ec1e` — merge: in Studio le azioni non ti buttano più fuori sulla mappa — **Sadyco La Fame**
- `fd972b7` — test: un controllo automatico vero per il punto 14 dello Studio — **Sadyco La Fame**
- `0b41d74` — fix: in Studio le azioni non ti buttano più fuori sulla mappa — **Sadyco La Fame**

### File di questa categoria

- **Modificato:** `frontend/js/game/writer.js`

**File interessati in questa categoria:** 1

---

<!-- merge:b87ec1e -->
## 08/09/26, 11:09 — branch non identificato → main

**Merge effettuato da:** Sadyco La Fame (sadycolafame@192.168.1.58)  
**Merge commit:** `b87ec1e`

### Cosa è entrato

- `fd972b7` — test: un controllo automatico vero per il punto 14 dello Studio — **Sadyco La Fame**
- `0b41d74` — fix: in Studio le azioni non ti buttano più fuori sulla mappa — **Sadyco La Fame**

### File di questa categoria

- **Modificato:** `frontend/js/game/writer.js`

**File interessati in questa categoria:** 1

---

<!-- merge:e69464e -->
## 07/09/26, 16:03 — branch non identificato → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `e69464e`

### Cosa è entrato

- `d59c876` — style(studio): la pagina si allinea al riferimento, dettaglio per dettaglio — **Carlomadella**
- `5c58187` — feat(studio): la foto a schermo intero, e sopra la schermata dei riferimenti — **Carlomadella**
- `a4a6936` — fix(studio): 44 punti sulle linguette, la striscia dice che continua, e una frase in italiano — **Carlomadella**
- `89bb7f8` — feat(studio): le sette sezioni del punto 4, in una barra in basso — **Carlomadella**

### File di questa categoria

- **Rinominato:** `frontend/media/photo/schermate_luoghi/schermate luoghi_senza_HTML/ChatGPT Image 6 set 2026, 19_43_32 (1).png` → `frontend/media/photo/schermate_luoghi/schermate luoghi_senza_HTML/studio_beat.png`

**File interessati in questa categoria:** 1

---

<!-- merge:328eb81 -->
## 06/09/26, 21:22 — task/telefono-nuovo → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `328eb81`

### Cosa è entrato

- `1bbcd22` — feat(telefono): via l'app Messaggi, dock nuovo, sfondo a tutto schermo (punto 68) — **Carlomadella**
- `f4f63a2` — assets: le schermate dei luoghi in una cartella loro — **Carlomadella**
- `3b32ec8` — feat(telefono): la home è quella della foto (punto 3 «DA FARE» → punto 68) — **Carlomadella**

### File di questa categoria

- **Rinominato:** `frontend/media/photo/studio_creazione_beat.png` → `frontend/media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/studio_creazione_beat.png`
- **Aggiunto:** `frontend/media/photo/telefono/app-discografia.png`

**File interessati in questa categoria:** 2

---

<!-- merge:e4ad390 -->
## 06/09/26, 14:40 — origin/main → main

**Merge effettuato da:** Sadyco La Fame (sadycolafame@Mac.Home)  
**Merge commit:** `e4ad390`

### Cosa è entrato

- `b1a0d15` — docs: aggiorna registro modifiche — **Anni di Fame Bot**
- `06bcd36` — merge: intro finale carriera dinamica — **Mycol**
- `9a6d8ed` — feat: rende dinamica intro finale carriera — **Mycol**
- `90d6c1a` — docs: aggiorna registro modifiche — **Anni di Fame Bot**
- `7858816` — Merge branch 'task/foto-luoghi-e-azioni' — **Carlomadella**
- `35f9227` — assets: le undici foto delle azioni e dei luoghi — **Carlomadella**
- `0b7bc2d` — docs: aggiorna registro modifiche — **Anni di Fame Bot**
- `51b2c5e` — Merge branch 'task/agenda-blocca-skip' — **Carlomadella**
- `efa2033` — feat(agenda): un appuntamento segnato ferma il salto del tempo (punto 1 DA FARE) — **Carlomadella**
- `ddabac6` — docs: aggiorna registro modifiche — **Anni di Fame Bot**

### File di questa categoria

- **Aggiunto:** `frontend/media/photo/studio_creazione_beat.png`

**File interessati in questa categoria:** 1

---

<!-- merge:7858816 -->
## 06/09/26, 13:38 — task/foto-luoghi-e-azioni → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `7858816`

### Cosa è entrato

- `35f9227` — assets: le undici foto delle azioni e dei luoghi — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/media/photo/studio_creazione_beat.png`

**File interessati in questa categoria:** 1

---

<!-- merge:c9451d0 -->
## 06/09/26, 11:28 — branch non identificato → main

**Merge effettuato da:** Mycol (mycolbraga@gmail.com)  
**Merge commit:** `c9451d0`

### Cosa è entrato

- `15fe477` — feat: rifinisce transizioni audio e player persistente — **Mycol**

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

