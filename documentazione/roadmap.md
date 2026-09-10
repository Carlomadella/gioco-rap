# La roadmap del progetto — a che punto siamo davvero

**Aggiornata all'08/09/2026.** Ogni riga di questo file è stata controllata sul repo il
giorno in cui è stata scritta: se qui c'è scritto «fatto», il codice c'è ed è stato
guardato. Se c'è scritto «da fare», nel repo non c'è niente che lo faccia.

Ci sono tre fogli e non si pestano i piedi:

| foglio | risponde a |
| --- | --- |
| **questo** | **a che punto siamo e cosa viene dopo** — il cantiere |
| [`../ROADMAP.md`](../ROADMAP.md) | **che gioco vogliamo** — le fasi, le tre città, il disegno d'insieme |
| [`../implementazioni/README.md`](../implementazioni/README.md) | **i punti uno per uno**, col loro stato |

Se una cosa vale per il gioco che verrà, va in `ROADMAP.md`. Se è un punto da spuntare, va
in `implementazioni/`. Qui ci sta solo quello che serve a rispondere alla domanda «a che
punto siamo, e cosa conviene fare adesso».

---

## La regola: questo file si aggiorna a ogni task

**Prima del push, insieme al commit della task**, si aggiorna qui:

1. la **data in cima** (`Aggiornata al gg/mm/aaaa`);
2. la riga della tappa toccata — se un pezzo si chiude, si sposta da «manca» a «c'è già»,
   con `**FATTO (gg/mm/aaaa)**` e una frase;
3. se la task chiude un punto, si controlla che il suo stato in
   [`../implementazioni/README.md`](../implementazioni/README.md) sia d'accordo con quello
   che c'è scritto qui.

Vale la regola di casa: **si cita il testo del punto, mai il numero da solo** — i numeri si
spostano. E come il resto, questo file non lo scrive un bot: il bot scrive solo
`registro-modifiche/`.

---

## Dove siamo (fotografia del 07/09/2026)

**La base è verde.** `cd frontend && npm run verifica` su `main` passa tutto: le prove
senza browser, `audit-regressioni.js`, il build (33 controlli, 0 falliti) e l'audit delle
dipendenze (0 vulnerabilità, frontend e backend).

**I punti**, ricontati dalla tabella di `implementazioni/README.md`:

| stato | quanti |
| --- | --- |
| chiusi | 76 |
| a metà | 13 |
| da fare | 18 |
| risposti (c'è il ragionamento, il codice no) | 5 |
| **in tutto** | **112** |

**I problemi**: [`problemi-riscontrati.md`](problemi-riscontrati.md) al 07/09/2026 non ha
niente di aperto — le cinque segnalazioni in elenco sono tutte chiuse.

**Le due metà**:

- **`frontend/`** — HTML, CSS e JavaScript senza framework, niente moduli ES (la ragione
  sta in `frontend/README.md`). 26 fogli di stile e 47 file di gioco, impacchettati da
  esbuild in due bundle con l'impronta nel nome. `media/` pesa 194 MB, dopo che il dataset
  degli avatar è uscito da git (07/09/2026).
- **`backend/`** — Node, una dipendenza sola (`pg`). SQLite dentro a Node con 18 tabelle e
  migrazioni numerate; classifica unica coi bot, account, salvataggi in cloud. Si prova con
  `cd backend && npm run prova`.

---

## Le tappe, in ordine

L'ordine viene da come è fatto il gioco, non da un'idea nuova: l'hub prima di tutto perché
ogni cosa nuova ci si attacca sopra come luogo, e l'interfaccia del telefono prima degli
store perché è il lavoro lungo che sta fra noi e la pubblicazione.

| | tappa | stato |
| --- | --- | --- |
| **A** | La base: avatar, settimane, menù, barre, beat, classifica | ✅ fatta |
| **B** | L'hub a mappa — la città di provincia | ✅ fatta, si rifinisce |
| **C** | L'economia della carriera: hype, energia, livelli | 🔶 cominciata |
| **D** | Fare un pezzo come catena di scelte (la TRACK) | ⬜ da fare — è la prossima grossa |
| **E** | Il mondo vivo: opps, produttori con un carattere, vita simulata | 🔶 cominciata (c'è La Sala) |
| **F** | Milano | ⬜ da fare |
| **G** | L'interfaccia sul telefono | 🔶 cominciata |
| **H** | Los Angeles | ⬜ da fare |
| **I** | L'uscita su Steam e sugli store | 🔶 tre lavori su cinque |

> **Da confermare con Alessio**: mettere D prima di F è una proposta, non una decisione
> presa. La TRACK cambia il cuore del gioco, e Milano costruita sopra al motore vecchio
> andrebbe rifatta.

---

### A · La base _(fatta)_

Avatar (ritratto e figura intera, preset, fondali), struttura a settimane, menù e profilo,
scrittura delle barre, mercato dei beat con ascolto, freestyle in piazza, lifestyle,
classifica e rivali. Più il menù impostazioni, i tre slot di salvataggio, la landing
staccata dall'accesso e dal gioco, l'albero delle abilità, la discografia, i dischi d'oro.

### B · L'hub a mappa — la provincia _(fatta, si rifinisce)_

**C'è già**: la plancia che riempie lo schermo con la mappa del concept, i luoghi come
punti da toccare, le card tutte nella forma dello Studio, i tastini che muovevano la mappa
tolti, lo Shop diventato uno shop vero, Casa, la palestra, la Pizzeria e la Fabbrica al
posto di due cartelli chiusi, le trasferte fuori città, il telefono nuovo con LaFamegram e
il feed che si scorre.

**Manca**:

- le card di lato invece che sopra agli edifici — *«Le card sulla mappa, di lato invece che
  sopra agli edifici»*;
- Studio, Casa e Attività criminali sono ancora ammassate, e i pulsanti sopra la mappa
  restano grossi rispetto ai quadratini (foglio dei punti nuovi, Alessio);
- meno cartelli chiusi e più roba che si apre — *«Meno cartelli chiusi sulla mappa, più
  roba che si apre»*, a metà;
- ogni parte del gioco con la sua ambientazione, e le schermate rifatte identiche alle foto
  — *«Ogni parte del gioco deve avere la sua ambientazione»* e *«La grafica uguale alla
  foto, e l'avatar segnaposto»*.

### C · L'economia della carriera _(cominciata)_

**C'è già**: l'hype con un tetto per fase della carriera (`PHASES[fase].hcap` in
`phases.js`) e un tetto settimanale sulla promo — **FATTO (06/09/2026)**; energia a 100,
giornate e skip di quanto vuoi; le classifiche settimanali con le frecce.

**Manca**:

- l'energia che cresce col livello, e livelli che vogliano dire qualcosa — *«L'energia
  cresce col livello, e i livelli devono avere un senso»*;
- il pub e la pubblicità sui social come primo modo di fare hype a inizio carriera: sono
  rimasti fuori apposta dal giro dell'hype, e oggi come luogo non esistono;
- i prezzi dei beat rifatti su tre fasce (100–250 / 300–1000 / 1000–2000) e la partenza con
  tutti i parametri a 1 (foglio dei punti nuovi, Alessio);
- la giornata al posto della settimana, e il conto dei costi dell'energia: c'è la risposta
  ragionata, il codice no;
- **lo skip è lento** quando si saltano tante ore (foglio dei punti nuovi, Carletto);
- **togliere «lucidità»**: è un lavoro grosso e va misurato prima — oggi la parola compare
  **1484 volte** fra `frontend/js` e `frontend/css`, dal catalogo eventi alla testata dello
  Studio.

### D · La TRACK — fare un pezzo come catena di scelte _(cominciata)_

Non più «faccio un pezzo → +10 fama», ma beat, mix, testo, cover, featuring, marketing e
timing, ognuno con un suo numero, e la qualità che esce dalla somma; poi qualità + hype +
fama + network → gli stream. Con un'app del telefono per vedere come invecchiano i pezzi, e
farci remaster o parti 2.

**C'è già** (08/09/2026): le otto sezioni dello Studio, e dentro le scelte che finora non
c'erano. Il beat lo compri dalle tre schede sul banco o te lo fa una persona; la strofa e il
beat che entrano in cabina li scegli tu; la registrazione non è più un dado invisibile ma un
elenco di take fra cui prendere la buona; il mix ha i tre cursori del banco (voce, bassi,
aria) e ne esce un carattere che resta scritto sul pezzo; il tema del testo si sceglie prima
di aprire il foglio; e l'uscita ha un quando — stanotte, venerdì, o in cassaforte. Le
schermate sono quelle delle foto di riferimento
(`media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/`), e il codice sta in
`frontend/js/game/studio-elementi.js`.

**Manca**: i numeri per elemento scritti in chiaro — il riquadro *Beat 82 / Testo 76 / Mix 68
/ Feature 85 / Marketing 53 → QUALITÀ tot* del foglio dei punti nuovi non c'è: la qualità
esce da una somma sola, e quanto ci ha messo ogni pezzo non si legge da nessuna parte. E
manca l'app della discografia che dice come invecchiano i pezzi.

È il punto salito in cima al foglio dei punti nuovi il 07/09/2026 (commit *«il punto sulla
TRACK sale fra le cose da fare»*). Tocca `sim.js`, `studio.js`, `posto.js` e la discografia:
**è la task più grande fra quelle aperte**, e conviene farla prima di costruire Milano
sopra al motore vecchio.

Ci si appoggiano due punti già aperti: *«"Completa la canzone" deve costare qualcosa»* e
*«La scena del produttore quando cerchi un beat»*.

### E · Il mondo vivo _(cominciata)_

**C'è già**: La Sala, il posto dove si conosce la gente — ruolo, carattere, fama e i sei
gradini del rapporto, e con un rapper si può anche rompere; il videomaker; gli opp e i
giornalisti per strada; un'età per i personaggi; una conversazione lunga al giorno; le chat
con mamma e il migliore amico.

**Manca**:

- gli opps come rivali veri, presi da chi ti sta sopra in classifica — *«Gli opps, i rapper
  rivali»*, che si aggancia al server;
- i produttori con abilità, fama e carattere che pesano sulla trattativa — *«I produttori
  hanno abilità, fama e carattere»*;
- i rapporti coi beatmaker che non vanno mai in negativo: li puoi offendere quanto vuoi e
  il rapporto resta uguale (foglio dei punti nuovi, Alessio);
- la vita simulata, e la criminalità che oggi è troppo facile: risposta scritta, codice no;
- i dialoghi tanti e diversi, e gli scenari uguali nella forma e diversi nelle circostanze:
  tutti e due a metà.

### F · Milano _(da fare)_

Soglie di sblocco (livello ≥ 10, fama ≥ 50, hype ≥ 40), studi professionali, manager, club,
concerti, sponsor, business, criminalità di livello superiore. Oggi nel codice «Milano» è un
nome che compare nelle trasferte e negli eventi: **come città non esiste**. È per questo che
*«La carriera cresce con la mappa: Provincia → Milano → Los Angeles»* è a metà.

Prima serve, dalla lista dell'hub in `ROADMAP.md`: gli studi come luoghi con una qualità che
entra nel calcolo del pezzo — che è anche un pezzo della TRACK.

### G · L'interfaccia sul telefono _(cominciata)_

La plancia è disegnata a 1536×1024 e rimpicciolita tutta insieme: sul monitor va bene, sul
telefono in verticale no. Serve una disposizione sua (profilo, mappa e telefono uno sotto
l'altro), aree da toccare di almeno 44 punti, niente `hover`, testi leggibili senza zoom.
Sono i CSS e un pezzo di `hub.js`, ma è il lavoro più lungo dei cinque per uscire.

*«Responsività di tutto il gioco»* — **il giro sugli `:hover` è fatto (08/09/2026)**: tutte
le regole `:hover` dei 24 fogli che ne avevano stanno dentro a `@media (hover:hover)`, e un
controllo in `audit-regressioni.js` tiene ferma la convenzione. Nello stesso giro sono
chiusi i tre punti dello Studio (l'orologio galleggiante che copriva i pannelli, la barra
delle take che non si poteva confrontare, la fascia in alto tagliata a 360) e la Strada, che
sotto ai 980 punti non si impilava — esisteva solo larga, e sul telefono non si giocava.

**Resta la prova su un telefono vero**, con l'agente `prova-sul-telefono`: le misure di
questo giro sono state lette nel CSS, non rifatte a schermo. Finché non è passata quella,
questa tappa non è chiusa.

### H · Los Angeles _(da fare)_

Ci si arriva da GOAT (livello ≥ 30, fama ≥ 90, hype ≥ 85, reputazione ≥ 80): studi top tier,
label e A&R, eventi VIP, casinò, criminalità ad altissimo rischio. Dopo Milano, non prima.

### I · L'uscita sugli store _(tre lavori su cinque)_

La tabella qui sotto.

---

## I cinque lavori per uscire

Il codice resta HTML, CSS e JavaScript dentro a un guscio nativo: **Electron** per il
desktop, **Capacitor** per iOS e Android.

| lavoro | stato |
| --- | --- |
| **Il build** — bundle minificato con l'impronta nel nome, server di sviluppo, controlli | ✅ **fatto (31/08/2026)** |
| **I salvataggi** — file vero sul dispositivo, Steam Cloud, cloud nostro | 🔶 **metà (01/09/2026)**: il cloud c'è, ma `save()` scrive ancora solo nel `localStorage` |
| **Gli account** — ospite o mail, sessioni, cancellazione, verifica Steam/Apple/Google | ✅ **fatto (01/09/2026)** — dei tre negozi mancano solo le chiavi |
| **L'interfaccia sul telefono** — verticale, a tocchi, leggibile | ⬜ da fare: è la tappa G |
| **Il database vero** — SQLite adesso, PostgreSQL il giorno dell'uscita | ✅ **fatto (01/09/2026)** per SQLite; PostgreSQL è scritto e si prova con `npm run prova-pg` |

Il file unico (`frontend/strumenti/build-artifact.py`) resta la demo da far girare, non il
formato di uscita. Il server non entra nel pacchetto del gioco: si gioca anche col server
spento.

### Cosa blocca l'uscita, oggi

In ordine di quanto pesa:

1. **L'interfaccia sul telefono** — senza, sugli store del telefono non si va.
2. **Agganciare `save()` al cloud**, e il file vero sul dispositivo: il ponte
   (`ONLINE.salvaCarriera`) c'è, la chiamata no.
3. **Le chiavi di Steam, Apple e Google**: la verifica è scritta e provata, ma senza chiavi
   quel canale risponde `501`. Si prendono quando l'app è registrata sugli store.
4. **Il guscio nativo**: Electron e Capacitor non sono ancora nel repo.
5. **La settimana simulata sul server**: oggi il punteggio arriva dal dispositivo e il
   server tiene fuori solo l'assurdo. Per un gioco in vendita non basta.
6. **Gli asset arrivati da fuori** e il branding La Fame Studio dentro al gioco: da
   sistemare prima di mandare materiale a uno store.

---

## Il foglio dei punti nuovi, dove atterra

I punti aperti in
[`../implementazioni/implementazioni.md`](../implementazioni/implementazioni.md), smistati
sulle tappe qui sopra:

**Alessio** — shop già dalla città iniziale con prodotti limitati (B), rapporti coi
beatmaker che non vanno in negativo (E), prezzi dei beat realistici (C), partenza con tutti
i parametri a 1 (C), Avaturn e creatore in gioco che convivono 50/50 (B), card della mappa
troppo vicine e pulsanti troppo grandi (B).

> Tre punti di quel foglio — le card tutte come lo Studio, via i tastini che muovono la
> mappa, lo shop che diventa uno shop — **risultano già chiusi** nella tabella dei punti:
> vanno spostati nel file del loro argomento. Del primo resta da verificare la seconda
> metà, il pallino giallo sull'ultimo posto visitato.

**Carletto** — la TRACK (D), le foto di sfondo dei posti e le schermate rifatte in HTML (B),
le transizioni video sulle cinque schede (B), lo skip lento (C), via «lucidità» (C), la
legacy — quanto sei influente sulle generazioni dopo di te (E: nel codice non esiste). Più
due regole di lavoro: le canzoni con l'IA come task giornaliera, e quando non è un fix
creare un file nuovo collegato invece di gonfiare quelli che ci sono.

**Da discutere**: se dopo Los Angeles si possa scegliere un'altra città italiana (la
risposta scritta è: a Los Angeles per forza, ma indietro si può tornare); la schermata delle
classifiche aperta anche dall'app del telefono; la pagina di Mycol collegata allo shop.

**Dopo il gioco**, non prima: le modalità nuove — carriera dello studio, città di partenza a
scelta, le città finali (Chicago, Las Vegas, Atlanta/New York).

---

## Quello che qui dentro non c'è

- **I commit**: stanno in [`../registro-modifiche/`](../registro-modifiche), che lo scrive
  un bot dai merge e non si tocca a mano.
- **Le regole di lavoro**: [`come-si-lavora.md`](come-si-lavora.md), in versione corta in
  [`../CLAUDE.md`](../CLAUDE.md).
- **I problemi trovati**: [`problemi-riscontrati.md`](problemi-riscontrati.md), che lo
  riempiono gli agenti.
- **Il progetto di ogni singola schermata**: [`pagine-azioni/`](pagine-azioni/README.md).
