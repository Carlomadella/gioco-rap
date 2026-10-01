# 11 — Strumenti e test

Registro automatico delle modifiche realmente entrate in `main`.

Non contiene idee, TODO o implementazioni future.

---

<!-- merge:7fe740c -->
## 01/10/26, 21:37 — task/widget-meteo-click-perimetro → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `7fe740c`

### Cosa è entrato

- `0603e5c` — chore(cache): invalida il widget tempo meteo — **mycolbraga**
- `13a543e` — test(meteo): protegge la chiusura fuori perimetro — **mycolbraga**
- `434d2ca` — feat(meteo): chiude il widget quando il mouse esce dal perimetro — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/js/game/tempo-controlli.js`
- **Modificato:** `frontend/pagine/gioco.html`
- **Modificato:** `frontend/strumenti/audit-regressioni.js`

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
- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/verifica-git.js`

**File interessati in questa categoria:** 3

---

<!-- merge:7c86244 -->
## 01/10/26, 21:16 — task/contratti-visuali-lavoro → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `7c86244`

### Cosa è entrato

- `05b485f` — test(lavori): protegge il layout dei contratti firmabili — **mycolbraga**
- `a54f7cb` — chore(cache): invalida i contratti visuali — **mycolbraga**
- `1590d72` — style(lavori): rende i contratti dei posti un foglio firmabile — **mycolbraga**
- `9bf32d0` — feat(lavori): presenta Pizzeria e Fabbrica come contratti veri — **mycolbraga**
- `50efb00` — feat(ui): aggiunge variante modale per i contratti di lavoro — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/css/overlays.css`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/modal.js`
- **Modificato:** `frontend/pagine/gioco.html`
- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 5

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
- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/bilanciamento/bot.js`

**File interessati in questa categoria:** 10

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

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

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
- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/test/e2e/gameplay.spec.js`

**File interessati in questa categoria:** 3

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

- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Aggiunto:** `frontend/test/unit/circolo-stanze.test.js`

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
- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/test/unit/fabbrica-strada.test.js`
- **Aggiunto:** `frontend/test/unit/lavoro-eventi.test.js`

**File interessati in questa categoria:** 13

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
- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/prova.js`
- **Modificato:** `frontend/test/unit/seguiti.test.js`

**File interessati in questa categoria:** 20

---

<!-- merge:18c56d3 -->
## 01/10/26, 10:58 — feature/pizzeria-lavoro-strutturato → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `18c56d3`

### Cosa è entrato

- `a628512` — test(audit): follow generic workplace resignation flow — **mycolbraga**
- `6e8df92` — chore(web): bust pizzeria workplace assets — **mycolbraga**
- `b88496c` — test(audit): cover structured pizzeria page — **mycolbraga**
- `33f3a2e` — test(pizzeria): cover structured workplace rules — **mycolbraga**
- `b123133` — fix(work): avoid legacy discipline for pizzeria — **mycolbraga**
- `086daf8` — fix(work): preserve factory sixth-day payout type — **mycolbraga**
- `f76d9ee` — docs(famepedia): explain structured pizzeria work — **mycolbraga**
- `7a27c6d` — feat(events): add pizzeria overtime flow — **mycolbraga**
- `c57b8e6` — feat(hours): apply each workplace contract calendar — **mycolbraga**
- `77f5ed5` — fix(travel): keep workplace location after job promotions — **mycolbraga**
- `0c2334e` — feat(time): keep pizzeria shift duration across promotions — **mycolbraga**
- `a34271c` — style(work): render workplace-specific rest days — **mycolbraga**
- `b171937` — feat(pizzeria): add contract attendance and career UI — **mycolbraga**
- `24c8030` — feat(work): support pizzeria contracts in hiring flow — **mycolbraga**
- `61012fc` — feat(work): generalize workplace career for pizzeria — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/css/luoghi-foto.css`
- **Modificato:** `frontend/js/famepedia.js`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/eventi-v2.js`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/luoghi-foto.js`
- **Modificato:** `frontend/js/game/orari.js`
- **Modificato:** `frontend/js/game/sim.js`
- **Modificato:** `frontend/js/game/spostamenti.js`
- **Modificato:** `frontend/js/game/tempo.js`
- **Modificato:** `frontend/pagine/gioco.html`
- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/test/unit/fabbrica-presenze.test.js`

**File interessati in questa categoria:** 13

---

<!-- merge:703d05e -->
## 30/09/26, 20:43 — feature/pizzeria-pagina-foto → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `703d05e`

### Cosa è entrato

- `4fe8256` — test(pizzeria): lega audit al lavoro corretto — **mycolbraga**
- `88bdc89` — fix(pizzeria): lega il turno al lavoro del luogo — **mycolbraga**
- `8fda34a` — test(pizzeria): aggiunge regressioni pagina separata — **mycolbraga**
- `f3713e8` — chore(pizzeria): aggiorna cache pagina fotografica — **mycolbraga**
- `5d70cc5` — feat(pizzeria): aggiunge fondale 4K — **github-actions[bot]**
- `9a95106` — chore(pizzeria): installa fondale 4K — **mycolbraga**
- `eed567a` — feat(pizzeria): aggiunge pagina fotografica separata — **mycolbraga**
- `06cc3a8` — feat(pizzeria): apre la pagina fotografica — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/luoghi-foto.js`
- **Aggiunto:** `frontend/media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/pizzeria.webp`
- **Modificato:** `frontend/pagine/gioco.html`
- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 5

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
- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 5

---

<!-- merge:3ae18e1 -->
## 30/09/26, 10:41 — fix/global-map-navigation-v2 → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `3ae18e1`

### Cosa è entrato

- `9d56bdc` — test(nav): align regression audit with host registry — **mycolbraga**
- `79a37c8` — test(nav): cover stable global map navigation — **mycolbraga**
- `65d8140` — fix(nav): bust cache for stable global navigation — **mycolbraga**
- `bf3ba17` — fix(nav): keep one global map control — **mycolbraga**
- `50eb2b8` — fix(nav): stabilize global return-to-map routing — **mycolbraga**

### File di questa categoria

- **Modificato:** `frontend/css/menu-sistema.css`
- **Modificato:** `frontend/js/menu-sistema.js`
- **Modificato:** `frontend/pagine/gioco.html`
- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Aggiunto:** `frontend/test/unit/navigazione-globale.test.js`

**File interessati in questa categoria:** 5

---

<!-- merge:2353662 -->
## 30/09/26, 12:23 — task/circolo-viewport-avatar → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `2353662`

### Cosa è entrato

- `c8904e8` — npm audit: brace-expansion da 5.0.9 a 5.0.12 — **Carlomadella**
- `d4fcf23` — Il Circolo tutto nello schermo: le voci del giro di fine task — **Carlomadella**
- `41ac344` — Il Circolo tutto nello schermo, coi volti veri — **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `documentazione/problemi-risolti.md`
- **Aggiunto:** `frontend/concept/simil_avatar.png`
- **Modificato:** `frontend/css/circolo.css`
- **Modificato:** `frontend/js/game/circolo.js`
- **Aggiunto:** `frontend/media/photo/circolo/volti/volto-1.jpg`
- **Aggiunto:** `frontend/media/photo/circolo/volti/volto-2.jpg`
- **Aggiunto:** `frontend/media/photo/circolo/volti/volto-3.jpg`
- **Aggiunto:** `frontend/media/photo/circolo/volti/volto-4.jpg`
- **Aggiunto:** `frontend/media/photo/circolo/volti/volto-5.jpg`
- **Aggiunto:** `frontend/media/photo/circolo/volti/volto-6.jpg`
- **Aggiunto:** `frontend/media/photo/circolo/volti/volto-7.jpg`
- **Aggiunto:** `frontend/media/photo/circolo/volti/volto-8.jpg`
- **Modificato:** `frontend/package-lock.json`
- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 15

---

<!-- merge:4a578e8 -->
## 30/09/26, 00:35 — task/il-circolo → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `4a578e8`

### Cosa è entrato

- `cf8f789` — Il Circolo: le voci del giro di fine task — il palco solo stando lì, la serata a metà, il telefono — **Carlomadella**
- `07d14b9` — Il Circolo: la Sala e il Live Club diventano un posto solo, con la serata giocata a momenti — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/bilanciamento/bot.js`
- **Aggiunto:** `frontend/test/unit/circolo.test.js`
- **Modificato:** `frontend/test/unit/studio-rivali-e-sala.test.js`

**File interessati in questa categoria:** 4

---

<!-- merge:d13db73 -->
## 29/09/26, 19:38 — task/simulatore-bilanciamento → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `d13db73`

### Cosa è entrato

- `69f5c63` — Il diario del progetto: il primo mese, dal 29/08 al 29/09 — **Carlomadella**
- `1996e56` — Il simulatore di bilanciamento: le voci del giro di fine task — **Carlomadella**
- `47eae1d` — Il simulatore di bilanciamento: mille carriere con strategie diverse, una alla volta — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Aggiunto:** `frontend/strumenti/bilanciamento/bot.js`
- **Aggiunto:** `frontend/strumenti/bilanciamento/rapporto.js`
- **Aggiunto:** `frontend/strumenti/simulatore-bilanciamento.js`
- **Aggiunto:** `frontend/test/unit/bilanciamento-rapporto.test.js`

**File interessati in questa categoria:** 5

---

<!-- merge:6a4f0a9 -->
## 28/09/26, 12:49 — task/skip-lento → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `6a4f0a9`

### Cosa è entrato

- `85e934e` — Quando skippi tante ore non ci mette più troppo — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:14eff26 -->
## 28/09/26, 12:18 — task/modale-piu-piccola → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `14eff26`

### Cosa è entrato

- `aed5dfd` — Giro di fine task sulla conferma dello spostamento: pulito — **Carlomadella**
- `c3aeede` — La conferma dello spostamento, più piccola — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/test/e2e/ritocchi-telefono.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:7f02c3e -->
## 28/09/26, 11:46 — task/diario-dal-telefono → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `7f02c3e`

### Cosa è entrato

- `7da4f4f` — Esc sul Diario aperto dalle Notifiche chiude solo il Diario — **Carlomadella**
- `b85ba42` — Il Diario si riapre col dito, e l'orologio non ci sta sopra — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:c415886 -->
## 27/09/26, 16:53 — task/ritocchi-telefono-27-09 → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `c415886`

### Cosa è entrato

- `0d0ce55` — Telefono: la conferma del viaggio non si apre già scorsa, e tre ritocchi — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/test/e2e/ritocchi-telefono.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:969eb78 -->
## 27/09/26, 16:52 — task/mappa-si-scorre → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `969eb78`

### Cosa è entrato

- `8f88f99` — La freccia della mappa resta davvero sul bordo destro — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/test/e2e/mappa-si-scorre.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:a202dde -->
## 27/09/26, 16:52 — task/coda-menu-e-prova-ricaricata → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `a202dde`

### Cosa è entrato

- `665d85f` — La prova rimasta aperta torna anche dopo il carcere — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/test/e2e/prova-ricaricata.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:3e09a47 -->
## 27/09/26, 16:52 — task/foglio-a-capo-sul-telefono → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `3e09a47`

### Cosa è entrato

- `32afc59` — Foglio sul telefono: tasti su una riga, barre separate, Invio che dice «avanti» — **Carlomadella**
- `44db19d` — Il Foglio si rimisura girando il telefono, e l'a capo della tastiera è un Invio — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/test/e2e/foglio-a-capo.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:9e9d494 -->
## 27/09/26, 16:52 — task/titolo-dopo-il-viaggio → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `9e9d494`

### Cosa è entrato

- `cdc50b6` — Sul telefono il dado del titolo sta dentro alla finestra — **Carlomadella**
- `694f06b` — La prova del titolo dopo il viaggio controlla anche la scheda del rivale — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/test/e2e/titolo-dopo-il-viaggio.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:071bdcf -->
## 27/09/26, 16:19 — task/mappa-si-scorre → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `071bdcf`

### Cosa è entrato

- `4698cb8` — Sul telefono una freccia dice che la città continua a destra — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/test/e2e/mappa-si-scorre.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:68e09a1 -->
## 27/09/26, 16:19 — task/coda-menu-e-prova-ricaricata → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `68e09a1`

### Cosa è entrato

- `8b433f9` — Una prova di passaggio rimasta aperta torna dopo un ricaricamento — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/test/e2e/prova-ricaricata.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:04fda6c -->
## 27/09/26, 16:19 — task/foglio-a-capo-sul-telefono → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `04fda6c`

### Cosa è entrato

- `fa298cc` — Sul telefono le barre del Foglio vanno a capo — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/test/e2e/foglio-a-capo.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:a0a4f23 -->
## 27/09/26, 16:19 — task/carcere-spese-e-lavoro → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `a0a4f23`

### Cosa è entrato

- `f28ccec` — In carcere il diario dice quanto costa stare dentro — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/test/e2e/carcere-spese.spec.js`

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

<!-- merge:3b85be1 -->
## 27/09/26, 16:18 — task/diario-senza-giorno-saltato → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `3b85be1`

### Cosa è entrato

- `29c22f1` — La fine giornata non scrive più «1 giorno saltato» nel diario — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/test/e2e/diario-fine-giornata.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:e1277e7 -->
## 27/09/26, 16:18 — task/incontro-alto-senza-x → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `e1277e7`

### Cosa è entrato

- `5bf23ba` — L'incontro ALTO per strada fermo in un salto non ha più la X — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:ae1413f -->
## 27/09/26, 16:18 — task/classifica-dieci-posti → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `ae1413f`

### Cosa è entrato

- `5d1fe4c` — La classifica conta chi sta davanti a qualcuno, e il diario scrive l'hype vero — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/test/e2e/classifica-dieci-posti.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:26f1182 -->
## 27/09/26, 16:18 — task/titolo-dopo-il-viaggio → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `26f1182`

### Cosa è entrato

- `cf57c4c` — Dopo la conferma di un viaggio il titolo del pezzo torna scrivibile — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/test/e2e/titolo-dopo-il-viaggio.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:1effdfc -->
## 27/09/26, 13:57 — feat/responsive-travel-modal → main

**Merge effettuato da:** GitHub (noreply@github.com)  
**Merge commit:** `1effdfc`

### Cosa è entrato

- `f444af9` — feat(game): conferma spostamento azzurra e responsive — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/test/unit/travel-modal.test.js`

**File interessati in questa categoria:** 1

---

<!-- merge:8f632e1 -->
## 27/09/26, 15:13 — task/orologio-sotto-le-finestre → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `8f632e1`

### Cosa è entrato

- `bdb4aa7` — Orologio: «GIORNO» più grande anche sul telefono; via la presa della barretta — **Carlomadella**
- `9ccf9d7` — Sul telefono l'orologio sta sotto le finestre, e quattro ritocchi dal giro — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/test/e2e/mobile-touch.spec.js`
- **Aggiunto:** `frontend/test/e2e/orologio-sotto-le-finestre.spec.js`

**File interessati in questa categoria:** 2

---

<!-- merge:8053990 -->
## 27/09/26, 15:13 — task/salvataggio-annidato-a-meta → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `8053990`

### Cosa è entrato

- `0776f9f` — Il completamento del salvataggio non rimette «pulita» una carriera criminale vecchia — **Carlomadella**
- `24316c0` — Il salvataggio si completa anche dentro gli oggetti annidati — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/test/e2e/salvataggio-vecchio.spec.js`

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

- **Aggiunto:** `frontend/test/e2e/alto-coperto.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:e7f618f -->
## 27/09/26, 15:13 — task/salto-senza-finally → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `e7f618f`

### Cosa è entrato

- `bc515d0` — Il salto rilegge lo stato degli eventi dopo un giorno disfatto, e avvisa sempre — **Carlomadella**
- `1030fee` — Il salto disfa il giorno rotto e manda l'errore alla schermata di servizio — **Carlomadella**
- `f6b9262` — Il salto del tempo si spegne anche quando la chiusura va in errore — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/test/e2e/salto-dopo-un-errore.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:3a1b2e8 -->
## 27/09/26, 15:13 — task/contratto-rescisso-in-carcere → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `3a1b2e8`

### Cosa è entrato

- `378537e` — Il contratto rescisso in carcere si porta via anche la consegna — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/test/e2e/contratto-rescisso.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:5838892 -->
## 27/09/26, 15:13 — task/audit-skip-overlay → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `5838892`

### Cosa è entrato

- `a6e3bd3` — Audit: il controllo degli skip guarda skipOverlayBusy() — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:241bcda -->
## 26/09/26, 16:50 — task/giro-telefono-25-09-2026 → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `241bcda`

### Cosa è entrato

- `74ebb70` — Responsività: sistema Impostazioni e bersagli touch sotto i 44 punti — **Carlomadella**

### File di questa categoria

- **Aggiunto:** `frontend/test/e2e/mobile-touch.spec.js`

**File interessati in questa categoria:** 1

---

<!-- merge:d471010 -->
## 21/09/26, 19:36 — task/discografia-app-telefono → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `d471010`

### Cosa è entrato

- `6f27b7e` — Remastered e parti 2, dopo il giro di fine task: il pezzo senza seed non è di nessuno, il fonico conta una volta sola, la sostituzione della parte 2 si dice a schermo, «lascia» alto come gli altri, la frase del Mix separa guadagno e costo, e la Cabina ha «lascia la parte 2» — **Carlomadella**
- `4b12a12` — Remastered e parti 2, la coda di «Non è più: "Faccio un pezzo → +10 fama"»: dalla Discografia sul telefono si prenotano, in Studio si fanno — la parte 2 in Cabina col titolo suo (e quando esce rimette in piedi il primo), la remastered al banco del Mix; la riga della Discografia nel telefono, che era rotta, va su due righe — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Aggiunto:** `frontend/test/unit/seguiti.test.js`

**File interessati in questa categoria:** 2

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

- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Aggiunto:** `frontend/test/unit/studio-rivali-e-sala.test.js`

**File interessati in questa categoria:** 2

---

<!-- merge:9995781 -->
## 21/09/26, 13:53 — task/shop-rifiniture-dopo-il-giro → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `9995781`

### Cosa è entrato

- `1e5426c` — Shop, il giro stretto sulle rifiniture: il render non salva mai (l'estrazione si segna e la salva l'apertura dello Shop), le prove col dado seminato e il ramo «solo usato» costruito, la barra piena fino al bordo — **Carlomadella**
- `f4f7569` — Shop, le rifiniture dopo il giro di fine task: «1 capo scontati», la card bloccata più scura, l'estrazione pigra che salva, il diario col solo usato, tredici prove unitarie, la barra dei filtri con lo sfondo, README-API a Node 22.12 — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Aggiunto:** `frontend/test/unit/shop-sblocchi-e-offerte.test.js`

**File interessati in questa categoria:** 2

---

<!-- merge:c43384b -->
## 21/09/26, 13:15 — task/shop-capi-sbloccati-e-offerte → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `c43384b`

### Cosa è entrato

- `305f912` — docs: la lista «Da fare adesso» rinumerata dopo i due punti dello Shop usciti, e la voce dello Shop in provincia rimanda ai capi che si sbloccano — **Carlomadella**
- `df4ee09` — Shop: «Capi che si sbloccano» e «Le offerte della settimana» — lo Shop cresce con la carriera — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

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
- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 14

---

<!-- merge:f83c4ad -->
## 21/09/26, 08:07 — task/shop-lo-stile-che-conta → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `f83c4ad`

### Cosa è entrato

- `08c5a0e` — Shop: «Lo stile che conta» — i capi addosso pesano su hype, presenza e promo — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

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
- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 5

---

<!-- merge:ae5ca5b -->
## 20/09/26, 23:48 — task/avaturn-e-camerino-insieme → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `ae5ca5b`

### Cosa è entrato

- `4f395a6` — docs(avatar): «Avaturn voglio lo rendiamo UN 50/50 … FAI COESISTERE LE COSE» — confermato in partita e scritto; Avaturn «consigliato» sulla card — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:219c73c -->
## 20/09/26, 23:10 — task/shop-tre-reparti → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `219c73c`

### Cosa è entrato

- `0537ae2` — feat(shop): «Lo Shop promette tre reparti, ce ne sono due» — il reparto Vestiti: lo Shop sblocca, il camerino veste — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 2

---

<!-- merge:33dd294 -->
## 20/09/26, 21:57 — task/transizioni-video-le-altre → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `33dd294`

### Cosa è entrato

- `cddd392` — fix(video): il giro di chiusura delle transizioni — cinque voci del 20/09 (47–51), tutte chiuse — **Carlomadella**
- `32cb6f5` — feat(video): «implementa le transizioni dentro al progetto, che partano cliccando sulla scheda collegata» — gli altri quattro: la Sala, Casa, stacca la spina, registra — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:0fcc254 -->
## 20/09/26, 20:48 — task/le-tre-del-marketing → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `0fcc254`

### Cosa è entrato

- `d64c3c5` — docs: giro di fine task sul commit di chiusura de «Le tre del Marketing» — niente aperto — **Carlomadella**
- `4aa172d` — fix(telefono): il giro di chiusura de «Le tre del Marketing» — tre voci del 20/09 (44–46), tutte chiuse — **Carlomadella**
- `a52377a` — fix(telefono): «Le tre del Marketing» — chiuse dal 14/09, riconosciute; e la riga delle mosse su due righe — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

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

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:20153a1 -->
## 20/09/26, 11:23 — task/mano-rapper-svg → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `20153a1`

### Cosa è entrato

- `108ec42` — fix(piazza): il giro di chiusura della mano del rapper — l'audit dice perché, l'indice dice che è chiusa — **Carlomadella**
- `309de1c` — fix(piazza): «La mano del braccio alzato del rapper è un tracciato SVG rotto» — la curva si chiude sul polso — **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `documentazione/roadmap.md`
- **Modificato:** `frontend/js/creator/nav.js`
- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 4

---

<!-- merge:67e3719 -->
## 20/09/26, 01:09 — task/piccole-agenda-beat-parametri-licenziarsi → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `67e3719`

### Cosa è entrato

- `adbe45d` — fix(agenda): il giro di chiusura delle quattro piccole — tre voci del 20/09, tutte chiuse — **Carlomadella**
- `164e6be` — feat(gioco): le quattro piccole — agenda, prezzi dei beat, parametri a 1, licenziarsi — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 2

---

<!-- merge:bf00c1d -->
## 19/09/26, 15:59 — task/avvio-rapido → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `bf00c1d`

### Cosa è entrato

- `db3e0e8` — fix(avvio): il giro di chiusura di «Preparo il tuo artista» — sette voci del 19/09, tutte chiuse — **Carlomadella**
- `f29ad6b` — feat(avvio): «Preparo il tuo artista» — «l'avvio rapido ci mette quasi due minuti, e nessuno lo dice al giocatore» — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/test/e2e/gameplay.spec.js`

**File interessati in questa categoria:** 2

---

<!-- merge:668d98c -->
## 19/09/26, 14:00 — task/pagine-luoghi-foto → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `668d98c`

### Cosa è entrato

- `2cf77fc` — fix(luoghi): il giro di chiusura delle pagine sulla foto — sei voci del 19/09, tutte chiuse — **Carlomadella**
- `18141cf` — feat(luoghi): Casa, Palestra, Live Club e stacca la spina sulla loro foto — «aggiungi le foto di background dei posti» — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:6ba6de0 -->
## 16/09/26, 17:47 — task/jose-e-zod-nel-backend → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `6ba6de0`

### Cosa è entrato

- `18fae26` — fix(backend): il giro di chiusura di jose e zod — nove voci dei due controlli, tutte chiuse — **Carlomadella**
- `d268a3d` — feat(backend): jose e zod usate — «jose va usata, e zod va deciso» — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:c0c45c2 -->
## 16/09/26, 17:20 — task/salvare-i-punti-da-main → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `c0c45c2`

### Cosa è entrato

- `5926f75` — fix(git): il giro di chiusura del gate dei fogli — cinque cose del controllo, tutte chiuse — **Carlomadella**
- `c922653` — feat(git): i fogli dei punti si salvano da main — «fai in modo che io possa salvare le implementazioni nuove» — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:684a1af -->
## 16/09/26, 14:36 — task/prima-transizione-video → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `684a1af`

### Cosa è entrato

- `f0f730f` — feat(transizioni): il primo video, lo Studio — «implementa le transizioni dentro al progetto, che partano cliccando sulla scheda collegata» — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/dev.js`

**File interessati in questa categoria:** 2

---

<!-- merge:b9bd794 -->
## 15/09/26, 14:28 — task/telefono-sul-telefono → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `b9bd794`

### Cosa è entrato

- `4d482f1` — fix(telefono): il giro di chiusura del telefono che si alza — nove voci su dieci — **Carlomadella**
- `d97e8de` — feat(telefono): il telefono quando lo schermo è un telefono — sotto i 1180 si alza da un tasto — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:d33d43e -->
## 15/09/26, 11:13 — task/app-post-e-take-senza-energia → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `d33d43e`

### Cosa è entrato

- `ea060ac` — fix(studio): la take scelta in Cabina arriva davvero sul pezzo — **Carlomadella**
- `ac64bc4` — fix(studio, telefono): la take pagata si mette da parte, e Sputa aggiorna l'hype — **Carlomadella**
- `e89eea7` — feat(telefono, studio): «Sputa», la seconda app per postare, e «non si può spendere energia per tenere una take» — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

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

- **Modificato:** `backend/README-API.md`
- **Modificato:** `documentazione/brainstorming-studio-cover-feat-marketing.md`
- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `documentazione/roadmap.md`
- **Modificato:** `frontend/css/studio-elementi.css`
- **Modificato:** `frontend/css/studio.css`
- **Modificato:** `frontend/css/telefono.css`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/covers.js`
- **Modificato:** `frontend/js/game/eventi-v2.js`
- **Modificato:** `frontend/js/game/sim.js`
- **Modificato:** `frontend/js/game/studio-elementi.js`
- **Modificato:** `frontend/js/game/studio.js`
- **Modificato:** `frontend/js/game/telefono.js`
- **Modificato:** `frontend/pagine/gioco.html`
- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 17

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
- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 26

---

<!-- merge:55a9083 -->
## 13/09/26, 20:08 — task/studio-marketing-dopo-timing → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `55a9083`

### Cosa è entrato

- `8cb498d` — feat(studio): Timing prima di Marketing — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 1

---

<!-- merge:bc14d1d -->
## 13/09/26, 19:55 — task/tasto-compralo-fuori-schermo → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `bc14d1d`

### Cosa è entrato

- `4a67409` — Merge branch 'main' into task/tasto-compralo-fuori-schermo — **Carlomadella**
- `5f91dc2` — fix(studio): il tasto «Compralo» non finisce piu' fuori dallo schermo — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:18f731f -->
## 13/09/26, 19:47 — task/giro-lungo-fuori-dalla-catena → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `18f731f`

### Cosa è entrato

- `540a4e4` — test: il giro lungo torna fuori dalla catena, e il perche' e' scritto — **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `frontend/package.json`
- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 3

---

<!-- merge:18824d8 -->
## 13/09/26, 17:44 — task/beat-e-tasto-oro-riapplicato → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `18824d8`

### Cosa è entrato

- `80108c7` — fix(studio): riapplica a mano tre delle quattro correzioni di beat-e-tasto-oro — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:4515ce0 -->
## 13/09/26, 17:12 — task/watcher-uccide-la-partita → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `4515ce0`

### Cosa è entrato

- `d4a33fd` — fix(dev): il watcher non ricarica piu' la pagina in mezzo alla partita — **Carlomadella**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `frontend/README.md`
- **Modificato:** `frontend/package.json`
- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/dev.js`
- **Modificato:** `frontend/test/e2e/gameplay.spec.js`

**File interessati in questa categoria:** 6

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

- **Modificato:** `documentazione/dipendenze.md`
- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `frontend/README.md`
- **Modificato:** `frontend/package-lock.json`
- **Modificato:** `frontend/package.json`
- **Aggiunto:** `frontend/playwright.config.js`
- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/dev.js`
- **Aggiunto:** `frontend/test/e2e/gameplay.spec.js`
- **Aggiunto:** `frontend/test/e2e/server-lifecycle.js`
- **Aggiunto:** `frontend/test/unit/gameplay-regressions.test.js`

**File interessati in questa categoria:** 11

---

<!-- merge:fe258b4 -->
## 12/09/26, 21:24 — origin/fix/rimuove-continua-menu-avvio-20260912-212414 → main

**Merge effettuato da:** Mycol (mycolbraga@gmail.com)  
**Merge commit:** `fe258b4`

### Cosa è entrato

- `a2f9531` — fix(ui): rimuove continua dal menu di avvio — **Mycol**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:290f4e3 -->
## 12/09/26, 21:12 — origin/fix/famepedia-sidebar-legibile-20260912-211127 → main

**Merge effettuato da:** Mycol (mycolbraga@gmail.com)  
**Merge commit:** `290f4e3`

### Cosa è entrato

- `0052ef6` — fix(famepedia): rende leggibile la sidebar — **Mycol**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:36deb6e -->
## 12/09/26, 21:09 — origin/fix/famepedia-tipografia-makehuman-20260912-210829 → main

**Merge effettuato da:** Mycol (mycolbraga@gmail.com)  
**Merge commit:** `36deb6e`

### Cosa è entrato

- `4dbe467` — fix(famepedia): allinea tipografia a MakeHuman — **Mycol**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:54b8289 -->
## 12/09/26, 20:54 — origin/feat/famepedia-layout-v2-20260912-205354 → main

**Merge effettuato da:** Mycol (mycolbraga@gmail.com)  
**Merge commit:** `54b8289`

### Cosa è entrato

- `5c7dfa6` — feat(famepedia): aggiunge indice persistente e sfondo — **Mycol**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:c41c257 -->
## 12/09/26, 19:40 — origin/feat/famepedia-v1-v2-20260912-194005 → main

**Merge effettuato da:** Mycol (mycolbraga@gmail.com)  
**Merge commit:** `c41c257`

### Cosa è entrato

- `bf80cbf` — feat(ui): aggiunge FAMEpedia alla landing — **Mycol**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:48dc367 -->
## 12/09/26, 17:55 — origin/feat/stato-account-landing-v2-20260912-175446 → main

**Merge effettuato da:** Mycol (mycolbraga@gmail.com)  
**Merge commit:** `48dc367`

### Cosa è entrato

- `13864e6` — feat(account): mostra stato connessione nella landing — **Mycol**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:8a27fba -->
## 12/09/26, 17:43 — origin/fix/sessione-account-senza-artista-20260912-174303 → main

**Merge effettuato da:** Mycol (mycolbraga@gmail.com)  
**Merge commit:** `8a27fba`

### Cosa è entrato

- `bd79730` — fix(account): conserva login senza artista locale — **Mycol**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:1595560 -->
## 12/09/26, 17:24 — origin/fix/backend-online-player-default-20260912-172324 → main

**Merge effettuato da:** Mycol (mycolbraga@gmail.com)  
**Merge commit:** `1595560`

### Cosa è entrato

- `cff0c0f` — fix(online): usa backend pubblico per i player — **Mycol**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:8dffa9f -->
## 12/09/26, 12:54 — fix/account-artista-cloud-20260912-145418 → main

**Merge effettuato da:** Mycol (mycolbraga@gmail.com)  
**Merge commit:** `8dffa9f`

### Cosa è entrato

- `cb502a7` — fix(online): collega account artista e cloud — **Mycol**

### File di questa categoria

- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 1

---

<!-- merge:fecae36 -->
## 12/09/26, 14:21 — task/fix-dev-live-reload-makehuman → main

**Merge effettuato da:** Mycol (mycolbraga@gmail.com)  
**Merge commit:** `fecae36`

### Cosa è entrato

- `18269dd` — fix(dev): evita reload falsi durante MakeHuman — **Mycol**

### File di questa categoria

- **Modificato:** `frontend/strumenti/dev.js`

**File interessati in questa categoria:** 1

---

<!-- merge:7979f69 -->
## 12/09/26, 13:21 — origin/fix/anti-regressione-git-gate-v2 → main

**Merge effettuato da:** Mycol (mycolbraga@gmail.com)  
**Merge commit:** `7979f69`

### Cosa è entrato

- `66c8d70` — fix(git): impedisce regressioni da main e branch obsoleti — **Mycol**

### File di questa categoria

- **Aggiunto:** `frontend/strumenti/configura-git-hooks.js`
- **Aggiunto:** `frontend/strumenti/verifica-git.js`

**File interessati in questa categoria:** 2

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
- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 11

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

- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 1

---

<!-- merge:0724440 -->
## 10/09/26, 00:45 — task/beat-energia-e-barre-senza-malus → main

**Merge effettuato da:** Sadyco La Fame (sadycolafame@192.168.1.58)  
**Merge commit:** `0724440`

### Cosa è entrato

- `fb731d5` — fix(studio): via il costo in energia per farsi fare un beat, e via il malus di scrivere le barre — **Sadyco La Fame**

### File di questa categoria

- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 1

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

- **Modificato:** `frontend/css/hub.css`
- **Modificato:** `frontend/css/studio.css`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/hub.js`
- **Modificato:** `frontend/js/game/modal.js`
- **Modificato:** `frontend/js/game/studio.js`
- **Modificato:** `frontend/js/game/ui.js`
- **Modificato:** `frontend/js/game/writer.js`
- **Modificato:** `frontend/js/gioco-ingresso.js`
- **Modificato:** `frontend/media/creator-rpg-v24/creator.html`
- **Aggiunto:** `frontend/media/makehuman-camerino-v1/assets/camerino-makehuman-custom.png`
- **Modificato:** `frontend/media/makehuman-camerino-v1/index.html`
- **Modificato:** `frontend/media/makehuman-camerino-v1/runtime.js`
- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/dev.js`

**File interessati in questa categoria:** 15

---

<!-- merge:b87ec1e -->
## 08/09/26, 11:09 — branch non identificato → main

**Merge effettuato da:** Sadyco La Fame (sadycolafame@192.168.1.58)  
**Merge commit:** `b87ec1e`

### Cosa è entrato

- `fd972b7` — test: un controllo automatico vero per il punto 14 dello Studio — **Sadyco La Fame**
- `0b41d74` — fix: in Studio le azioni non ti buttano più fuori sulla mappa — **Sadyco La Fame**

### File di questa categoria

- **Modificato:** `documentazione/problemi-riscontrati.md`
- **Modificato:** `frontend/css/studio.css`
- **Modificato:** `frontend/js/game/actions.js`
- **Modificato:** `frontend/js/game/modal.js`
- **Modificato:** `frontend/js/game/studio.js`
- **Modificato:** `frontend/js/game/ui.js`
- **Modificato:** `frontend/js/game/writer.js`
- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 8

---

<!-- merge:91438dd -->
## 08/09/26, 10:36 — branch non identificato → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `91438dd`

### Cosa è entrato

- `a36b5e8` — Merge branch 'main' into task/responsivita — **Carlomadella**
- `b197884` — fix: le cinque cose trovate dal giro di fine task — **Carlomadella**
- `4d688c8` — css: il gioco stretto in un foglio suo, css/stretto.css — **Carlomadella**
- `1338348` — docs: i punti della responsività chiusi, spostati nel loro argomento — **Carlomadella**
- `df41c78` — strada: si impila sul telefono, e il rapporto di settimana ci sta a 360 — **Carlomadella**
- `ee4951c` — css: ogni :hover dentro a @media (hover:hover), su tutti i fogli — **Carlomadella**
- `43623ca` — studio: l'orologio galleggiante non copre più lo Studio, e le take si confrontano — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:6ecd52f -->
## 07/09/26, 23:50 — branch non identificato → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `6ecd52f`

### Cosa è entrato

- `f000a36` — fix: la stima del primo anno usava «my», che in quella funzione non esisteva — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:d443364 -->
## 07/09/26, 23:11 — task/come-si-lavora-aggiornato → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `d443364`

### Cosa è entrato

- `43876cc` — docs: le regole di lavoro escono da implementazioni/ e diventano anche CLAUDE.md — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:5bbd9fb -->
## 07/09/26, 20:26 — task/via-lo-zero-dipendenze → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `5bbd9fb`

### Cosa è entrato

- `2c44f85` — docs(dipendenze): il registro, e i rimandi agganciati al testo invece che al numero — **Carlomadella**
- `af8f0e0` — merge: main dentro al branch delle dipendenze — **Carlomadella**
- `8b82f2f` — docs(punto 4): via il principio zero-dipendenze, al suo posto una regola — **Carlomadella**

### File di questa categoria

- **Modificato:** `backend/README.md`
- **Modificato:** `backend/database/README.md`
- **Modificato:** `backend/database/postgres.js`
- **Modificato:** `documentazione/README.md`
- **Aggiunto:** `documentazione/dipendenze.md`
- **Modificato:** `frontend/README.md`
- **Modificato:** `frontend/package.json`

**File interessati in questa categoria:** 7

---

<!-- merge:4a2831e -->
## 07/09/26, 18:17 — branch non identificato → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `4a2831e`

### Cosa è entrato

- `9486590` — fix: la lineetta storta nel package.json, e il commento del build che diceva il falso — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/package.json`
- **Modificato:** `frontend/strumenti/build.js`

**File interessati in questa categoria:** 2

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

- **Rinominato:** `frontend/media/photo/schermate_luoghi/schermate luoghi_senza_HTML/ChatGPT Image 6 set 2026, 19_43_34 (7).png` → `frontend/media/photo/schermate_luoghi/schermate luoghi_senza_HTML/studio_testo.png`
- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 3

---

<!-- merge:41ac4ed -->
## 06/09/26, 22:55 — task/popup-energia → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `41ac4ed`

### Cosa è entrato

- `3d0a574` — feat(energia): l'avviso «non hai energia» esce da ogni mossa, col fulmine — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

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

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

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

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:51b2c5e -->
## 06/09/26, 13:33 — task/agenda-blocca-skip → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `51b2c5e`

### Cosa è entrato

- `efa2033` — feat(agenda): un appuntamento segnato ferma il salto del tempo (punto 1 DA FARE) — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:e823d71 -->
## 06/09/26, 09:34 — task/pagina-attivita-criminali → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `e823d71`

### Cosa è entrato

- `1afca19` — fix: la pagina delle Attività criminali non taglia più i pezzi (punto 1 «DA FARE») — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:e673802 -->
## 06/09/26, 01:44 — task/7-8-9-md-agenda-eventi → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `e673802`

### Cosa è entrato

- `fcee5ec` — feat: l'agenda con le notifiche, e i file .md in cartelle (punti 7, 8, 9) — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:b42c3ca -->
## 05/09/26, 23:53 — task/26-landing-login-gioco-pagine-separate → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `b42c3ca`

### Cosa è entrato

- `e3634c6` — feat: la landing, l'accesso e il gioco diventano tre pagine (punto 27) — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/build.js`
- **Modificato:** `frontend/strumenti/prova.js`
- **Modificato:** `frontend/strumenti/verifica-build.js`

**File interessati in questa categoria:** 4

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

- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/build.js`
- **Modificato:** `frontend/strumenti/dev.js`

**File interessati in questa categoria:** 3

---

<!-- merge:74dc954 -->
## 05/09/26, 12:38 — task/schermata-abilita → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `74dc954`

### Cosa è entrato

- `a3e530a` — feat: l'albero delle abilità a tutto schermo, con dentro la tua carriera (punto 13) — **Carlomadella**
- `297022f` — feat: l'albero delle abilità entra nel gioco (punto 13, la schermata) — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:76cfda1 -->
## 04/09/26, 22:48 — main → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `76cfda1`

### Cosa è entrato

- `4c52f4f` — fix: lo Shop diventa uno shop, non un menù impostazioni (punto 4) — **Sadyco La Fame**
- `5a66eb5` — fix: card della mappa uniformi come lo Studio, via i tastini che la scorrono (punti 2, 3) — **Sadyco La Fame**
- `4e9168e` — docs: aggiorna registro modifiche — **Anni di Fame Bot**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:d80b80a -->
## 04/09/26, 11:23 — task/via-il-quaderno → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `d80b80a`

### Cosa è entrato

- `e8b1dda` — feat: via il quaderno, ogni scheda torna nel posto che gia' esisteva — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 2

---

<!-- merge:3170d23 -->
## 04/09/26, 10:08 — main → main

**Merge effettuato da:** Sadyco La Fame (sadycolafame@192.168.1.53)  
**Merge commit:** `3170d23`

### Cosa è entrato

- `0287cef` — docs: aggiorna registro modifiche — **Anni di Fame Bot**
- `994aa67` — Merge branch 'task/schermata-originale-nella-mappa' — **Carlomadella**
- `276e8d1` — fix: via anche i quattro bottoni in fondo alla mappa, erano doppioni — **Carlomadella**
- `cee9ce0` — feat: via la vecchia schermata di gioco, le sue schede sopra la mappa — **Carlomadella**
- `6dad126` — chore: pulizia dei media, 35 MB fuori dal pacchetto per gli store — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- merge:994aa67 -->
## 04/09/26, 10:05 — task/schermata-originale-nella-mappa → main

**Merge effettuato da:** Carlomadella (madella871@gmail.com)  
**Merge commit:** `994aa67`

### Cosa è entrato

- `276e8d1` — fix: via anche i quattro bottoni in fondo alla mappa, erano doppioni — **Carlomadella**
- `cee9ce0` — feat: via la vecchia schermata di gioco, le sue schede sopra la mappa — **Carlomadella**
- `6dad126` — chore: pulizia dei media, 35 MB fuori dal pacchetto per gli store — **Carlomadella**

### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- commit:b0840d4 -->
## 03/09/26, 21:40 — fix: evita opp criminali per giocatori puliti

**Tipo:** Commit diretto su main

**Autore:** Mycol (mycolbraga@gmail.com)

**Commit:** `b0840d4`


### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- commit:d7455b1 -->
## 03/09/26, 21:10 — fix: nuove carriere partono da zero

**Tipo:** Commit diretto su main

**Autore:** Mycol (mycolbraga@gmail.com)

**Commit:** `d7455b1`


### File di questa categoria

- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 1

---

<!-- commit:f28bb6a -->
## 03/09/26, 20:33 — feat: completa esperienza e navigazione del carcere

**Tipo:** Commit diretto su main

**Autore:** Mycol (mycolbraga@gmail.com)

**Commit:** `f28bb6a`


### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- commit:e89ad13 -->
## 03/09/26, 14:13 — feat: completa il gameplay del carcere

**Tipo:** Commit diretto su main

**Autore:** Mycol (mycolbraga@gmail.com)

**Commit:** `e89ad13`


### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- commit:cc87b56 -->
## 03/09/26, 10:54 — ci: aggiunge verifica automatica del gioco

**Tipo:** Commit diretto su main  
**Autore:** Mycol (mycolbraga@gmail.com)  
**Commit:** `cc87b56`


### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`
- **Aggiunto:** `frontend/strumenti/verifica-build.js`

**File interessati in questa categoria:** 2

---

<!-- commit:36dd0b5 -->
## 03/09/26, 10:30 — fix: blocca il gameplay durante il carcere

**Tipo:** Commit diretto su main  
**Autore:** Mycol (mycolbraga@gmail.com)  
**Commit:** `36dd0b5`


### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- commit:eab276a -->
## 03/09/26, 09:29 — fix: allinea agenda alla disponibilita runtime

**Tipo:** Commit diretto su main  
**Autore:** Mycol (mycolbraga@gmail.com)  
**Commit:** `eab276a`


### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- commit:b2122c7 -->
## 03/09/26, 03:06 — fix: separa messaggi e notifiche nel telefono compatto

**Tipo:** Commit diretto su main  
**Autore:** Mycol (mycolbraga@gmail.com)  
**Commit:** `b2122c7`


### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- commit:6f4d15e -->
## 03/09/26, 02:57 — fix: unifica La Sala e Beat Maker come luogo logico

**Tipo:** Commit diretto su main  
**Autore:** Mycol (mycolbraga@gmail.com)  
**Commit:** `6f4d15e`


### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- commit:dc49c91 -->
## 03/09/26, 02:48 — fix: blocca azioni fuori luogo e orario

**Tipo:** Commit diretto su main  
**Autore:** Mycol (mycolbraga@gmail.com)  
**Commit:** `dc49c91`


### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- commit:de3eb52 -->
## 03/09/26, 02:34 — fix: consolida arbitro globale degli eventi

**Tipo:** Commit diretto su main  
**Autore:** Mycol (mycolbraga@gmail.com)  
**Commit:** `de3eb52`


### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

---

<!-- commit:595c0b8 -->
## 03/09/26, 02:04 — feat: guardaroba separato dal negozio, via il Campetto dalla mappa (punti 7, 8)

**Tipo:** Commit diretto su main  
**Autore:** Sadyco La Fame (sadycolafame@192.168.1.53)  
**Commit:** `595c0b8`


### File di questa categoria

- **Modificato:** `frontend/strumenti/build.js`

**File interessati in questa categoria:** 1

---

<!-- commit:0b33abe -->
## 02/09/26, 21:45 — feat: aggiunge controllo globale del tempo

**Tipo:** Commit diretto su main  
**Autore:** Mycol (mycolbraga@gmail.com)  
**Commit:** `0b33abe`


### File di questa categoria

- **Modificato:** `frontend/strumenti/audit-regressioni.js`

**File interessati in questa categoria:** 1

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

- **Aggiunto:** `frontend/strumenti/audit-regressioni.js`
- **Modificato:** `frontend/strumenti/build.js`

**File interessati in questa categoria:** 2

---

<!-- commit:673953b -->
## 02/09/26, 11:22 — Integrate game time, events v2 and crime TRAPHONE

**Tipo:** Commit diretto su main  
**Autore:** Mycol (mycolbraga@gmail.com)  
**Commit:** `673953b`


### File di questa categoria

- **Modificato:** `frontend/strumenti/dev.js`

**File interessati in questa categoria:** 1

---

<!-- commit:3a5ded4 -->
## 02/09/26, 01:40 — Fix strada map and jail flow

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `3a5ded4`


### File di questa categoria

- **Aggiunto:** `frontend/strumenti/fix-mojibake.js`

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

<!-- commit:4706666 -->
## 01/09/26, 15:24 — feat: scambiarsi il numero con fonici e beatmaker, e ritrovarseli in chat (Da smistare 4)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `4706666`


### File di questa categoria

- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 1

---

<!-- commit:df6e337 -->
## 01/09/26, 15:05 — feat: la chat del telefono non va piu' in loop e si puo' portare avanti (Da smistare 3)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `df6e337`


### File di questa categoria

- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 1

---

<!-- commit:b92a86e -->
## 01/09/26, 14:49 — test: ogni opzione del creatore deve cambiare il ritratto (chiude il punto 3 dell'indice)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `b92a86e`


### File di questa categoria

- **Modificato:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 1

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

<!-- commit:24354f7 -->
## 31/08/26, 23:31 — feat: il build vero, primo dei cinque lavori per gli store (punto 33)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `24354f7`


### File di questa categoria

- **Modificato:** `frontend/README.md`
- **Aggiunto:** `frontend/package-lock.json`
- **Aggiunto:** `frontend/package.json`
- **Rimosso:** `frontend/strumenti/build-artifact.py`
- **Aggiunto:** `frontend/strumenti/build.js`
- **Aggiunto:** `frontend/strumenti/dev.js`
- **Aggiunto:** `frontend/strumenti/prova.js`

**File interessati in questa categoria:** 7

---

<!-- commit:af4d02c -->
## 31/08/26, 22:54 — refactor: il progetto si divide in frontend e backend (punto 31)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `af4d02c`


### File di questa categoria

- **Rinominato:** `strumenti/build-artifact.py` → `frontend/strumenti/build-artifact.py`

**File interessati in questa categoria:** 1

---

<!-- commit:b2ae674 -->
## 31/08/26, 16:47 — feat: la mappa e' la foto del concept, non un disegno che le somiglia (punto 26)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `b2ae674`


### File di questa categoria

- **Modificato:** `strumenti/build-artifact.py`

**File interessati in questa categoria:** 1

---

<!-- commit:7c3f9ec -->
## 30/08/26, 17:13 — feat: menu impostazioni e banco suoni nuovo (punti 23, 13, meta del 15)

**Tipo:** Commit diretto su main  
**Autore:** Carlomadella (madella871@gmail.com)  
**Commit:** `7c3f9ec`


### File di questa categoria

- **Aggiunto:** `strumenti/build-artifact.py`

**File interessati in questa categoria:** 1

---

