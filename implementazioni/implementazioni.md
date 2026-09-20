# Punti nuovi

> **Da Carletto, per chi lavora su questo foglio.** Quando finisci una task committa e
> pusha, e nel commit fai riferimento al punto del foglio che hai chiuso. Se vedi che il
> file viene modificato non preoccuparti, sono io: tu continua con quello che stai
> facendo, e ogni volta che finisci una task segnala il punto come completato.

**Scrivi qui.** Questo è il foglio dove si butta l'idea appena viene, senza pensare a dove
va: un punto, una riga, anche di corsa. Poi si sposta nel file dell'argomento giusto, con
sotto scritto cosa è stato fatto.

I punti di prima — tutti e sessantasette — stanno nella cartella
**[`implementazioni/`](README.md)**, divisi per argomento:

|                                                                | argomento                                       |
| -------------------------------------------------------------- | ----------------------------------------------- |
| [`01-mappa-e-citta.md`](01-mappa-e-citta.md)                   | la plancia, la mappa, le tre città              |
| [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md) | schermate, navigazione, il telefono, il negozio |
| [`03-artista-e-avatar.md`](03-artista-e-avatar.md)             | la faccia, i vestiti, chi sei                   |
| [`04-musica-e-suoni.md`](04-musica-e-suoni.md)                 | barre, beat, freestyle, come suona              |
| [`05-carriera-e-tempo.md`](05-carriera-e-tempo.md)             | energia, giornate, livelli, salvataggi          |
| [`06-mondo-e-personaggi.md`](06-mondo-e-personaggi.md)         | La Sala, i contatti, gli opps, la strada        |
| [`07-multiplayer-e-backend.md`](07-multiplayer-e-backend.md)   | la classifica vera, gli account, il cloud       |
| [`08-uscita-sugli-store.md`](08-uscita-sugli-store.md)         | Steam, App Store, Play Store                    |
| [`09-grafica-e-asset.md`](09-grafica-e-asset.md)               | ambientazioni, foto, branding                   |

Le task **chiuse** che stavano qui dentro sono in [`fatte.md`](fatte.md), con la richiesta
com'era scritta e la nota di cosa è stato fatto. Qui restano solo i punti **aperti**: le
liste hanno dei buchi dove stavano quelli chiusi, ed è voluto — i numeri non si rifanno,
perché qualcuno li cita (vedi [`fatte.md`](fatte.md)). Per la stessa ragione un punto si
cita sempre col suo **testo**, mai col numero da solo.

L'indice con **tutti i punti e il loro stato** sta in
[`implementazioni/README.md`](README.md).

**Come si legge questo foglio.** Tre pezzi, dall'alto in basso:

1. **Da fare adesso, in ordine** — l'ordine in cui si prendono i punti aperti, di questo
   foglio e di [`problemi-riscontrati.md`](../documentazione/problemi-riscontrati.md)
   insieme. Si aggiorna a ogni giro: un punto chiuso resta nella lista, barrato, con la
   data.
2. **Inbox automatica** — le richieste nuove come checkbox, una frase basta: le legge
   `scripts/roadmap-auto.js`, che prima cerca duplicati e cose già fatte.
3. **Le liste per persona** (ALE, CARLO) — i punti scritti a mano, con sotto le note di
   stato: `FATTO`, `FATTO in parte` e cosa manca, `RISPOSTA` se se n'è solo discusso.

---

## Da fare adesso, in ordine

Smistato il 15/09/2026, dopo la chiusura di «Sputa» e della regola nuova sull'energia in
Cabina; riguardato lo stesso giorno dopo «Il telefono quando lo schermo è un telefono», da
cui sono uscite due voci nuove, il 16/09 dopo il primo video delle transizioni (chiusa
il 20/09 con gli altri quattro; resta la decisione sui sette video in più), e il 19/09
dopo le pagine di Casa, Palestra, Live Club e stacca la spina
sulla loro foto (chiusa la voce delle foto; la serata del club giocata a momenti è una voce
nuova, fra i lavori lunghi) e dopo la schermata dell'avvio rapido; il 20/09 dopo le quattro
piccole (agenda, prezzi dei beat, parametri a 1, licenziarsi), chiuse in un branch solo, e
dopo «Le tre del Marketing», che erano chiuse dal 14/09 senza che l'ordine lo dicesse. È
l'ordine in cui si prendono i punti aperti di questo foglio **e** quelli ancora aperti in
[`problemi-riscontrati.md`](../documentazione/problemi-riscontrati.md): prima quello che
tocca il gioco sul telefono (è lì che esce), poi quello che pesa nel pacchetto o blocca una
partita, poi le cose piccole e chiare, poi i lavori lunghi, in fondo quello che è una
decisione prima che un lavoro. Ogni voce cita il **testo** del punto, non il numero, e dice
da quale lista viene.

**Sul telefono**

1. ~~**Il Marketing sul telefono vero**~~ **FATTO (15/09/2026)** — il telefono si alza a
   schermo pieno anche sotto i 1180: «Il telefono quando lo schermo è un telefono» in
   `02-interfaccia-e-telefono.md`.
2. ~~**Fra i 980 e i 1180 punti la barra della plancia trabocca**~~ **FATTO (20/09/2026)** —
   la fascia si stringe per gradi (1240, 1120), va a capo a 980, sul telefono è tre righe
   (165 punti, era 307); e chiudendola si è sistemata anche la plancia a 1280 × 800 e
   1366 × 768, dove le card degli eventi erano larghe 91 punti e quattro righe del profilo
   sparivano. «La fascia della plancia fra 980 e 1240, e la plancia a 1280 × 800» in
   `02-interfaccia-e-telefono.md`.
3. ~~**Le tre del Marketing**~~ **FATTO (14/09/2026, riconosciuto il 20/09)** — da
   problemi-riscontrati (14/09): «In spinta» come seconda riga bianca, la riga senza seed
   che è un bottone muto, il pezzo scelto che sparisce dall'elenco, il motivo dell'anteprima
   tagliato sul telefono. Erano chiuse tutte e quattro il 14/09 stesso, nel branch del
   Marketing, e passate pari pari in «Che post fai?» su LaFamegram; riprovate in partita il
   20/09 e messe sotto audit. Nello stesso giro è venuta fuori e chiusa una cosa nuova: nell'Agenda
   del telefono le descrizioni lunghe delle mosse finivano coi puntini, adesso vanno a
   capo fino a tre righe. «Le tre del Marketing» in `02-interfaccia-e-telefono.md`.
4. ~~**Il giro unico sull'hover al tocco**~~ **FATTO (08/09/2026, riconosciuto il 15/09)** —
   era chiuso da una settimana e tre elenchi lo davano ancora da fare: tutte le regole
   `:hover` stanno in `@media (hover:hover)`, e l'audit lo controlla («La responsività: lo
   Studio, la Strada e l'hover al tocco» in `02-interfaccia-e-telefono.md`).

**Pesa nel pacchetto o blocca una partita**

5. ~~**Le transizioni video**~~ **FATTO (20/09/2026)** — CARLO, «implementa le transizioni
   dentro al progetto, che partano cliccando sulla scheda collegata». Lo Studio dal 16/09;
   il 20/09 gli altri quattro del punto: la Sala e Casa sul cartello, «stacca la spina»
   sulla mossa da dovunque parta, «registra» sulla prima take in Cabina. «Le transizioni
   video: gli altri quattro» in `02-interfaccia-e-telefono.md`. **Resta una decisione**, la
   voce sua in fondo: i sette video che nessun punto chiede.
6. ~~**L'avvio rapido ci mette due minuti e non lo dice**~~ **FATTO (19/09/2026)** — la
   schermata «Preparo il tuo artista» sta sopra al creator nascosto con le fasi vere del
   camerino, il tempo che passa e tre tasti se si rompe; e i due minuti erano il browser
   senza GPU delle prove — su Chrome vero sono 9 secondi più la cinematic. «L'avvio
   rapido: la schermata «Preparo il tuo artista»» in `02-interfaccia-e-telefono.md`.
7. ~~**`jose` va usata, e `zod` va deciso**~~ **FATTO (16/09/2026)** — `accessi.js`
   verifica i token con `jose`; `zod` è deciso: si usa, e la forma dei corpi delle 14 rotte
   sta in `backend/forme.js`. «Le due dipendenze del backend, usate» in
   `07-multiplayer-e-backend.md`.

**Piccole e chiare**

8. ~~**L'evento fatto esce dall'agenda**~~ **FATTO (20/09/2026)** — `consumaPeso()` legge il
   peso e poi `onora()` toglie la voce di oggi; anche il «Piccolo party» passa di lì.
   «L'evento fatto esce dall'agenda» in `02-interfaccia-e-telefono.md`.
9. ~~**I prezzi dei beat per fama del beatmaker**~~ **FATTO (20/09/2026)** — tre fasce sulla
   fama di chi lo fa (100–250, 300–1000, 1000–2000), la qualità dice dove dentro alla fascia;
   la fascia si legge sulla card. «I prezzi dei beat per fama del beatmaker» in
   `04-musica-e-suoni.md`.
10. ~~**Si parte con tutti i parametri a 1**~~ **FATTO (20/09/2026)** — una riga in
    `state.js`; `livello()` guardato, si resta al livello 1. «Si parte con tutti i parametri
    a 1» in `05-carriera-e-tempo.md`.
11. ~~**Non ci si può licenziare**~~ **FATTO (20/09/2026)** — via il «lascialo» dai due testi,
    i colloqui non si fanno con un posto in tasca, e l'evento «Ti offrono un lavoro vero»
    chiede `no_job`. «Non ci si può licenziare» in `05-carriera-e-tempo.md`.
12. **Avaturn e il creator in game, tutti e due** — ALE, «FAI COESISTERE LE COSE». Nel
    codice convivono già (vedi la RISPOSTA sotto al punto): resta da confermarlo in
    partita e scriverlo in `03-artista-e-avatar.md`, che oggi non ne parla.
13. ~~**Lo Shop promette tre reparti, ce ne sono due**~~ **FATTO (20/09/2026)** — la
    terza linguetta è tornata, ma non sul ritratto 2D congelato il 09/09: il reparto
    Vestiti vende 39 capi veri del camerino MakeHuman, lo Shop sblocca e il camerino veste
    (le tendine mostrano solo quello che possiedi, più quello che hai già addosso). «Lo
    Shop: il reparto Vestiti» in `02-interfaccia-e-telefono.md`. Gli avatar Avaturn non si
    vestono con roba MakeHuman, e il reparto lo dice.

**Lavori lunghi**

14. **Via la lucidità** — CARLO, «togli il parametro «lucidità» e tutto ciò che ne
    consegue». Tocca 17 file del gioco e le formule della qualità del testo: non è una
    riga, va fatto in una task sua con l'audit aggiornato nello stesso commit. Chiude da
    sola anche «l'uscita di venerdì non costa niente, quella a mano sì» di
    problemi-riscontrati.
15. **Le tre code dello Studio a cinque linguette** — da problemi-riscontrati (15/09):
    l'omonimo della classifica che non si può chiamare, chi accetta dalla classifica che
    ruba un posto alla Sala, la copertina proposta e non confermata che resta nel
    salvataggio con la foto.
16. **Quello che manca alla catena del pezzo** — CARLO, la coda del punto «Non è più:
    "Faccio un pezzo → +10 fama"» (FATTO in parte): la cover caricata da file e quella
    «stile emblema», la discografia come app del telefono, le remastered e le parti 2.
17. ~~**Le foto dei posti che non hanno ancora una pagina**~~ **FATTO (19/09/2026)** —
    Casa, Palestra, Live Club e stacca la spina sono pagine sulla loro foto, la Piazza ha
    la sua sotto; Cover e Feat come sezioni non esistono più dal 15/09 (Studio a cinque
    linguette), quindi non hanno più bisogno di una foto. «Le pagine dei posti sulla loro
    foto» in `02-interfaccia-e-telefono.md`. **Resta** la coda qui sotto, la serata a
    momenti.
18. **La serata del Live Club giocata a momenti** — CARLO, la coda di «aggiungi le foto di
    background dei posti»: nel riferimento `concerto_live` in mezzo alla pagina c'è «al
    terzo pezzo uno in fondo comincia a parlare sopra», tre risposte e la gente che sale o
    scende, più «cambia ordine» nella scaletta. Oggi la serata è la mossa `live` di sempre
    (un numero) scelta sulla foto: i momenti sono il minigioco della Piazza rifatto per il
    palco, e la scaletta con l'ordine vorrebbe un peso in `sim.js`.
19. **Le card sulla mappa troppo vicine, i pulsanti sopra la mappa troppo grandi** — ALE.
    Si giudicano a occhio: vanno guardate con uno screenshot, non dal CSS. Stessa cosa per
    **la schermata opzioni da migliorare graficamente** — CARLO, pagina di landing.
20. **Quando skippi tante ore ci mette troppo** — CARLO. Prima si misura (quanti giorni,
    quanti secondi), poi si cerca dove.
21. **Su LaFamegram non posta nessuno** — CARLO. Oggi gli altri compaiono nel feed solo
    quando l'evento riguarda te (il fan, il giornalista, la Strada: `lafamegramEventi`);
    nessun contatto della Sala o rivale posta per conto suo. Prima si decide chi posta e
    cosa, poi si fa.
22. **Il pub e la pubblicità come primo modo di fare hype** — ALE, la coda del punto
    sull'hype (FATTO il 06/09 per il resto): oggi non esistono né come luogo né come
    azione.

**Decisioni prima che lavori**

23. **I rapporti coi beatmaker che vanno in negativo** — ALE. In `posto.js` il rapporto
    scende (`p.rel--`) ma è tenuto fra 0 e 5: sotto zero non va. Prima di farlo va deciso
    cosa succede a −1 (non ti vende più? ti fa pagare di più?).
24. **Non sempre far scorrere una giornata ridà l'energia** e **la legacy** — CARLO. Sono
    regole di gioco nuove: prima si scrive come funzionano, poi si fa.
25. **Lo Shop in provincia, con limitazioni** — ALE. Lo Shop c'è già dal primo giorno;
    va deciso cosa **non** si vende in provincia (vedi la RISPOSTA sotto al punto).
26. **Le decisioni tue**, senza le quali il resto non si muove: se dopo Milano e Los
    Angeles si può tornare indietro (DA DISCUTERE); la pagina di Mycol e il «tuo artista»
    nella landing; se il gioco sugli store gira anche **di traverso** (nel repo non c'è un
    manifest né un `orientation`, da problemi-riscontrati); e se cancellare gli undici
    branch già uniti in `main` (`git branch --merged main` li elenca, da
    `test/vitest-playwright-gate` a `task/studio-cinque-linguette`), anche sul remoto.
27. **I sette video che nessun punto chiede** — la coda delle transizioni video (FATTO il
    20/09 per i cinque del punto): palestra, Milano, club, shop, trasferta, live, più
    `video_transizione_entrata_in_studio` che è un doppione dello studio. Sono 22 MB in
    `frontend/media/video/Transizioni di scena/` che viaggiano nel pacchetto per gli
    store senza che nessuna riga li carichi. O si collegano — la palestra, il club e lo
    shop hanno un cartello, il live è una mossa, Milano e la trasferta sono i viaggi, e
    il meccanismo è pronto (`TRANSIZIONI_VIDEO` in `js/game/transizioni-video.js`, una
    riga e una chiamata l'uno) — o escono da `media/`. Il doppione esce comunque.

**Ancora da smistare (16/09/2026):** i sette punti nuovi di CARLO — sei sullo Studio (il
Marketing da spostare, la preview sul social prima dell'uscita, le sezioni in automatico coi
malus, la Sala senza costo in energia, i collettivi, il joint album) e la troupe in «Da
discutere». Entrano nell'ordine al prossimo giro.

Restano fuori dall'ordine, di proposito: **le nuove modalità** (Carriera Studio, città di
partenza, le città finali), che sono per dopo, quando il gioco è masterizzato; le canzoni
con l'IA, che è una **giornaliera** e non si smista; e i due «aperti di proposito» di
problemi-riscontrati (la copertina «grande» e quella «di adesso» quasi uguali, la risposta
del Marketing in cima).

Due punti di CARLO — «quando non sono fix… crea un file nuovo collegato ai già presenti»
e «tieni tutto ciò che riguarda la parte smartphone separata dal resto del progetto» —
**non sono task ma regole di lavoro**: il loro posto è
[`come-si-lavora.md`](../documentazione/come-si-lavora.md) e la versione corta in
`CLAUDE.md`. Finché non ci arrivano restano qui sotto, dove stavano.

---

## Da smistare

### Inbox automatica

**Scrivi qui le nuove richieste anche in una frase sola**, come checkbox. Prima di
espanderle il sistema cerca duplicati, sovrapposizioni e cose già implementate; solo dopo
costruisce i passaggi mancanti. Quando una richiesta è stata letta, lo script la segna
`[x]` e ci scrive accanto cosa ha trovato. Le liste per persona qui sotto **restano
intatte** e sono importate automaticamente nel cruscotto: non vengono riscritte né
cancellate.

<!-- ADF-AUTO-INBOX:BEGIN -->

- [x] voglio sistemare gli eventi ed il tempo in game <!-- ADF-TASK:ADF-NEW-3E6D8998D1BD --> — **🟡 ESTENSIONE → ADF-LEG-EC3A45E275D0, ADF-LEG-99F7F334DFE9** · La richiesta è più ampia delle task esistenti: EC3A45E275D0 copre la gerarchia degli incontri durante i salti e 99F7F334DFE9 il passaggio alla giornata; resta un delta reale di coerenza e prestazioni del motore eventi-tempo.

<!-- Esempio (non attivo): - [ ] voglio cambiare il tempo del turno in fabbrica -->
<!-- ADF-AUTO-INBOX:END -->

### ALE

_I numeri sono quelli di sempre: i buchi sono i punti chiusi, spostati in
[`fatte.md`](fatte.md)._

2. Rendi accessibile lo shop già dalla città iniziale, con limitazioni sui prodotti in vendita

   **RISPOSTA (15/09/2026)** — lo Shop sta già nella città iniziale: in `hub.js` è un
   cartello del quartiere «periferia», si apre dal primo giorno. Quello che manca è la
   seconda metà, «con limitazioni sui prodotti in vendita»: va deciso cosa non si vende
   in provincia (i beat sopra a una certa qualità? l'attrezzatura da studio grande?).

3. i rapporti con i beatmaker non vanno mai in negativo, puoi offenderli quanto vuoi e il rapporto resta uguale

6. Verissima la cosa dell'hype, fattore che dev'essere davvero primario nel gioco e i player dovran costantemente provare a inseguire ma con tanta fatica, Partiamo proprio dallo sviluppo dell'hype :

   L'hype è in scala internazionale, vuol dire che se sei al livello 100 è impossibile che tu sia ancora nel paesino di provincia.
   Probabilmente all'inizio l'unico modo per fare hype è andare al pub e pubblicare sui social pubblicità per la tua musica (DA SVILUPPARE QUESTO) , ma più di tanto HYPE all'inizio non si può fare, quindi è impossibile che al primo anno rimanendo nella prima città tu diventi 100 di hype

   Tutt'altro se non sei goat manco puoi averli 100 di hype

   L'hype vero si inizierà a fare quando i tuoi numeri social andranno forte e nelle classifiche il tuo nome inizierà a farsi valere sempre di più, quando farai feat con nomi più grandi dei tuoi e i pezzi andranno bene, quando prendiamo una macchina importante e molto costosa e la flexiamo sui social

   Insomma, come le cose che vanno davvero in hype IRL, non se fai un feat con pinko pallino a caso che nessuno conosce

   **FATTO (06/09/2026)** — l'hype adesso ha un **tetto che dipende dalla fase della
   carriera** (`PHASES[fase].hcap` in `phases.js`, letto da `hypeCap()`): 20 da
   Sconosciuto, 42 da esordiente, 55, 65, 80, 92, e solo da GOAT il tetto è 100. Non
   conta _come_ l'hype sale — farmando o con un colpo di fortuna — il tetto tiene
   comunque, perché è applicato ovunque l'hype cresce (oltre 30 punti diversi nel
   codice, da `promo` alla Strada). I tetti restano sempre sopra alle soglie
   `G.hype >= 40/60/55` già richieste dalle prove di passaggio della carriera stessa
   (`phases.js`, `TRIALS`), quindi nessuna prova diventa impossibile da superare.
   Sulla fatica vera: la promo sui social aveva già un freno sui follower, ma
   **l'hype che dà continuava a salire ogni giorno senza limite** — adesso ha anche
   lui un tetto settimanale (22 punti, `actions.js`), verificato con 7 giorni di
   promo di fila. Sul lato "quando conta davvero": scalare in classifica adesso dà un
   bonus d'hype vero e proporzionato al salto (`sim.js`, vicino a `G.best.chart`), e
   un feat capitato per caso (`events.js`) non vale più sempre uguale: **la maggior
   parte delle volte è un nome piccolo** (hype modesto), **una volta ogni tanto è uno
   grosso davvero**, e lì l'hype si muove sul serio — non lo sai finché non firmi,
   come chiesto. Il "feat con nomi più grandi" esiste già anche come relazione vera
   con un beatmaker della Sala (`posto.js`, tipo `feat`, scala già con `p.fama`): non
   toccato, andava già bene. Restano fuori da questo giro — **da sviluppare a
   parte**, come segnalato nel punto stesso — il pub e la pubblicità come primo modo
   di fare hype a inizio carriera, che oggi non esistono ancora come luogo/azione.
   `npm run prova` (70/70) più una verifica dedicata fuori dal browser sui tetti per
   fase e sul tetto settimanale della promo.

   _(Il punto resta qui apposta, per la coda che manca — il pub e la pubblicità; la nota
   breve sta in [`fatte.md`](fatte.md).)_

11. Avaturn voglio lo rendiamo UN 50/50 , Cioè chi non vuole andare a farsi tutta la trafila per fare avaturn (anche se ovviamente dobbiamo fare di tutto per consigliarli a farlo) può benissimamente creare il suo avatar in game. FAI COESISTERE LE COSE.

    **RISPOSTA (15/09/2026)** — nel codice convivono già: `avvio.js` apre
    «Avaturn/MakeHuman», `hub.js` distingue `avatarSource === "avaturn"` dall'altro, e
    l'avvio rapido carica MakeHuman vero. Da confermare in partita che dal creator si
    scelga davvero fra le due strade, e poi scriverlo in
    [`03-artista-e-avatar.md`](03-artista-e-avatar.md), che oggi non ne parla.

12. Studio, casa e attività criminiali sulla mappa sono TROPPO VICINE LE CARD tra di loro. Anche se gli edifici sono abbastanza vicini falle in un modo MOOOOLTO più clean. Così sono troppo ammassate.

13. Ti ricordo che i pulsanti sopra la mappa sono ANCORA TROPPO GRANDI rispetto ai quadratini stessi. Rivedilo.

### CARLO

_Stessa regola: i numeri non si rifanno. Ci sono due punti «4» — quello lungo sulla
catena del pezzo è il «punto 4 di CARLO» che `studio.js` cita, l'altro è arrivato dopo
con lo stesso numero e resta così._

#### Giornaliere

1. creare canzoni con l'ia, guarda cartella musica nei segnalibri, task
   giornaliera quindi da non smistare

#### Da fare

4. Non è più: "Faccio un pezzo → +10 fama", ma diventa:

   ```
   TRACK luogo: STUDIO
   │
   ├── Beat/Producer il beat puoi crearlo tu o chiedere ad un produttore di crearti il beat
   ├── Mix
   ├── Testo
   ├── Cover (influenza meno, ma ha 3 opzioni: caricamento file da telefono/computer, assets preimpostati e personalizzazione stile emblema black ops 2)
   ├── Featuring (può esserci come no, nelle canzoni, nel caso abbiamoo un feat nemlle canzoni, non è obbligatorio che il feat venga alla sessione, ovviamente se svolge la sessione con noi molto probabilmente i pezzo avrà più qualità)
   ├── Marketing (dimmi te come lo svilupperesti, dammi una terza opzione, le prime due sono: in discografia sul telefono tramite app, in studio in una sezione dedicata)
   └── Timing (app discografia)
   ```

   E ogni elemento influenza il risultato.

   Esempio:

   ```
   "TUTTO O NIENTE"

   Beat 82
   Testo 76
   Mix 68
   Feature 85
   Marketing 53
   ────────────────────
   QUALITÀ tot
   ```

   Poi, ad esempio:

   ```
   QUALITÀ tot
   HYPE 82
   FAMA 31
   NETWORK 64

   → 43.000 streams.
   ```

   è possibile controllare come stanno andando le canzoni nel tempo da un'app del telefono per sapere se stanno invecchiando bene o male e magari farci delle remastered o parti 2 di una canzone o di un album (discografia)

   **FATTO in parte (15/09/2026)** — la catena c'è quasi tutta, e sta in
   [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md), «Lo Studio a cinque
   linguette»: Beat, Testo, Cabina (con il Feat accanto al fonico), Mix e Uscita (con dentro
   la Cover e il QUANDO); il Marketing è passato sul telefono, in LaFamegram; la stima degli
   stream esce dalla formula vera di `sim.js`. La discografia c'è (`04-musica-e-suoni.md`,
   «19 · La discografia»: una linguetta della partita con la curva delle ultime 26 settimane
   per pezzo). **Manca** la cover caricata da file e quella «stile emblema» (oggi solo
   proposte generate), la discografia come app del telefono, e le remastered e le parti 2.

4. Non funziona più la pagina attività criminali, questo è ciò che segna in console:

   ```
   Feature policy: ignorato nome caratteristica non supportato “autoplay”. pagine.js:68:11
   Feature policy: ignorato nome caratteristica non supportato “autoplay”. pagine.js:90:19
   Feature policy: ignorato nome caratteristica non supportato “autoplay”. pagine.js:106:5
   [Anni di Fame] Eventi v1.2.13 pronti: 1000 eventi eventi-v2.js:3010:13
   Problema di sicurezza: i contenuti in http://localhost:8000/pagine/landing.html non possono caricare o avere link che rimandino a file:///.
   Problema di sicurezza: i contenuti in http://localhost:8000/pagine/gioco.html non possono caricare o avere link che rimandino a file:///.
   ```

   **RISPOSTA (15/09/2026)** — quelle righe di console non sono il guasto: sono avvisi di
   Firefox e basta. «Feature policy … autoplay» è l'`allow="autoplay"` dell'iframe in
   `js/pagine.js` (Firefox non conosce quel nome, Chrome sì, e in tutti e due l'audio va);
   il «problema di sicurezza» su `file:///` è un link che punta al disco, e nel frontend non
   ce n'è nessuno — probabilmente la pagina era stata aperta prima da file. Nel codice non
   trovo cosa fosse rotto: il 07/09 due guardie saltavano la Strada perché cercavano un id
   che non esiste (`strada-crimine`, sistemato, sta in problemi-riscontrati), e l'08/09 il
   giro sulla Strada la trovava giocabile. **Se succede ancora, serve cosa fai e cosa vedi**
   (la pagina non si apre? si apre e non risponde?), perché la console non lo dice.

5. aggiungi le foto di background dei posti senza HTML, poi ricrea la schermata identica alle foto con elementi HTML

   **FATTO in parte (08/09/2026) — lo Studio.** Le foto sotto ci sono già da prima; adesso ci
   sono anche gli elementi che nelle foto di riferimento ci stanno **sopra**, e che il codice
   non disegnava. `studio_creazione_beat`: le tre schede dei beat sul banco, con copertina,
   bpm, tasto per ascoltarli, onda e prezzo — «troppo caro» in rosso quando non ce li hai.
   `registrazione_pezzo`: l'elenco delle take, con la barra a tacche e la migliore segnata;
   la prima è il tiro di dado che `registra` faceva da sola, le altre si pagano in energia.
   `studio_mixaggio`: i tre cursori (voce, bassi, aria) e il carattere che ne esce — al
   centro valgono zero, il mix di prima non cambia di un punto. `studio_uscita_pezzo`: il
   QUANDO con le tre scelte tutte vere (stanotte, venerdì che esce da solo quando arriva il
   giorno, il cassetto che mette il pezzo in cassaforte), la stima degli stream presa dalla
   formula vera di `sim.js`, e la cassaforte a destra. In più, dalle altre due foto: il tema
   che si sceglie nel Testo (`scrittura_barre`) con la barra dell'ispirazione, e l'avviso
   della promo già fatta oggi (`studio_promo_su_lafamegram` — quella schermata è del
   telefono, non dello Studio, e il resto resta lì).
   Sta in `frontend/js/game/studio-elementi.js` e `frontend/css/studio-elementi.css`, file
   nuovi accanto a quelli che c'erano, come chiede il punto sui file già presenti.

   **FATTO (19/09/2026) — gli altri posti.** Casa, la Palestra, il Live Club e lo «stacca
   la spina» sono pagine sulla loro foto a schermo intero, con lo stesso telaio dello
   Studio (la fascia in alto con energia, cassa e ora; i pannelli di vetro scuro; il tasto
   d'oro; la riga di diario in fondo). `casa_di provincia_definitiva`: la cucina con le
   quattro porte sopra alla foto — scrivi una barra, vai in camera (la notte di «Salta
   avanti», con conferma), stacca la spina, i conti di casa. `stacca_la_spina`: il
   titolone su due righe, «Dormi, mangi, vedi gente normale», i due numeri (prima quelli
   promessi, dopo quelli veri), Continua che riporta in cucina; la foto è quella del divano
   di giorno o di sera secondo l'ora. `palestra`: Pesi o Cardio in mezzo, a sinistra la
   serie dei giorni di fila che esisteva (`palestraMoltiplicatore`) e non si vedeva da
   nessuna parte, a destra la giornata. `concerto_live`: la scaletta dei pezzi fuori a
   sinistra, «stasera» a destra con chi c'è (la gente della Sala che conosci) e l'incasso
   stimato, in mezzo palco o piazza. `freestyle_in_piazza`: la Piazza che c'era già ha la
   foto del sottopasso sotto. Le mosse sono quelle di `actions.js` (nessun numero cambia);
   quando finivano nella scenetta disegnata di `scene-art.js` adesso finiscono sulla foto,
   anche se partono da una card della plancia. I tre cartelli della mappa aprono la pagina
   invece della finestra con due risposte, che è sparita. Il tasto d'oro legge anche
   l'orario del posto («Apre alle 20:00» sotto al tasto, invece della finestra dopo).
   Sta in `frontend/js/game/luoghi-foto.js` e `frontend/css/luoghi-foto.css`, file nuovi;
   il resto è in «Le pagine dei posti sulla loro foto» in `02-interfaccia-e-telefono.md`.

   **Cosa manca ancora:** la serata del club giocata a momenti, come nel riferimento (la
   voce sua nell'indice in testa). Cover e Feat non hanno più una sezione loro dal 15/09,
   quindi non hanno più bisogno di una foto.

8. implementa le transizioni dentro al progetto, che partano cliccando sulla scheda collegata — studio, sala, ritorno a casa, stacca la spina, registra un pezzo. Nel dettaglio: il primo video parte quando il player clicca sul luogo chiamato "studio", il secondo quando clicca su "sala", il terzo quando decide di tornare a "casa", il quarto su "stacca la spina", il quinto su "registra un pezzo".

   **FATTO (20/09/2026)** — il primo il 16/09: toccando «Studio» sulla mappa (dopo il
   «Vai» dello spostamento, se non sei già lì) partono i 5,6 secondi di
   `01_studio_definitivo.mp4` e sotto si apre la stanza. Il meccanismo è generale —
   `transizioneVideo(id, poi)` in `js/game/transizioni-video.js`, un file nuovo, come
   chiede la regola dei punti che non sono fix — e sta scritto in
   `02-interfaccia-e-telefono.md`, «Le transizioni video: il primo, lo Studio». Gli altri
   quattro il 20/09: `02_ingresso_sala` sul cartello «La Sala», `03_ritorno_casa` su
   «Casa», `04_stacca_la_spina` sulla mossa «Stacca la spina» da dovunque parta (la porta
   di Casa, l'agenda, la card della sera), `05_registra_pezzo` sulla prima take in Cabina;
   «Le transizioni video: gli altri quattro», stesso foglio. Non è il punto delle
   dissolvenze CSS («Transizioni quando una card apre una pagina», stesso file): quelle
   restano, il video ci va sopra. **Resta da decidere** cosa fare dei sette video che
   nessun punto chiede (la voce sua fra le decisioni di «Da fare adesso»).

9. quando skippi tante ore ci mette troppo a simulare

10. togli il parametro «lucidità» e tutto ciò che ne consegue

11. aggiungere la legacy cioè quanto sei influente sulle generazioni future o più piccole di artisti

12. quando non sono fix, risoluzioni di bug o errori non modificare troppo i file già presenti ma crea un file nuovo collegato ai già presenti

    _Regola di lavoro, non task: vedi in testa a «Da fare adesso»._

13. non sempre far scorrere una giornata ti ridà l'energia

14. tieni tutto ciò che riguarda la parte smartphone separata dal resto del progetto

    _Regola di lavoro, non task: vedi in testa a «Da fare adesso»._

16. quando si segna un evento in agenda poi non si riesce a far passare il giorno

    **RISPOSTA (15/09/2026)** — è l'effetto voluto di un tuo punto precedente, «gli eventi
    segnati in agenda bloccano lo skip» (FATTO 06/09, in [`fatte.md`](fatte.md)): con un
    appuntamento di oggi ancora da fare il salto non parte, e se è più avanti il salto si
    ferma alla sua mattina. Un'ora già passata non blocca niente, e «Fine giornata» resta
    libero apposta. Se il giorno non passa **dopo che l'evento l'hai fatto**, allora è il
    punto «se partecipo ad un evento segnato… si toglie automaticamente dall'agenda», FATTO il 20/09/2026 (in [`fatte.md`](fatte.md)).

18. sull'app lafamegram non posta nessuno

    **Stato (15/09/2026)** — nel feed (`telPost()` in `telefono.js`) ci sono i tuoi post,
    quelli che nascono dagli incontri — il fan, il giornalista, la Strada, tutti in
    `lafamegramEventi` e tutti **su di te** — e due notizie de «La Voce del Giro». Nessun
    contatto della Sala, nessun rivale, posta per conto suo: è vero che «non posta
    nessuno». Prima di farlo va deciso chi posta e cosa (i beatmaker i loro beat? gli opps
    contro di te? chi scala la classifica?).

#### Studio (16/09/2026)

_Scritti da Carletto il 16/09 nella lista dello Studio; i numeri sono i suoi, i buchi
sono i punti chiusi in [`fatte.md`](fatte.md)._

7. marketing toglilo da qua e spostalo, dimmi dove lo metti

8. non posso spingere una canzone che non è ancora uscita, al massimo faccio uscire una preview sul social

10. l'utente deve poter fare solo le sezioni Beat, Testo, e Cabina, poi il resto in automatico, però questo porta dei malus

11. non deve costare energia interagire con gli altri all'interno della sala

12. fai in modo che si possano creare collettivi di rapper

13. fai in modo che un produttore possa chiamarti per fare un joint album con altri rapper

#### Da discutere

2. DA DISCUTERE Dopo aver completato milano ed essere diventato goat ed essere andato a los angeles il player può decidere se trasferirsi in un'altra città italiana o per forza a Los Angeles? Per forza a los angeles, però può decidere di tornare nelle città prima

3. Il player può decidere se avere una troupe. es: manager, social media manager, fonico personale, beatmaker personale, videomaker

#### Pagina di landing

1. migliorare graficamente la schermata opzioni

2. creare una schermata per le classifiche che si apre anche dall'app del telefono

   **Stato (15/09/2026)** — sembra già fatto da prima: la landing ha la voce «Classifiche»
   (`pagine/landing.html`, «Chi comanda questa settimana») e il telefono ha l'app
   «Classifiche» (`telefono.js`, `schermataClassifiche()`, che risente il server quando
   la apri). Se intendevi un'altra cosa — una schermata sola, uguale nei due posti? — va
   riscritto il punto.

3. DA DISCUTERE collegare la pagina di mycol togliere la sezione il tuo artista dalla pagina di landing o , oltre che da nuova partita. e collegarla allo shop, se shoppi qualcosa ti va nell'inventario

#### Responsività

Chiusa il 08/09/2026: i tre punti dello Studio (l'orologio galleggiante, la barra
delle take, la fascia a 360), l'hover che restava acceso al tocco su tutti i CSS, e
il giro largo sulle altre schermate — da cui è uscita la Strada, che sotto ai 980
punti non si impilava e sul telefono non si giocava. Il racconto per esteso sta in
[`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md), sotto «La responsività:
lo Studio, la Strada e l'hover al tocco».

Resta da fare: il giro su un telefono vero con `prova-sul-telefono` — le misure sono
state lette nel CSS, le schermate non sono state rifatte. Il 15/09 il giro a misura di
telefono (390 × 844) è stato fatto nel browser, chiudendo «Il telefono quando lo schermo
è un telefono»; il telefono vero, in mano, ancora no. Il 20/09 il giro su tutte le
schermate a sedici misure, dal 360 al 1920 × 1080: nessuna scorre di lato, e la plancia
è a posto anche a 1280 × 800 e 1366 × 768 («La fascia della plancia fra 980 e 1240, e la
plancia a 1280 × 800» in `02-interfaccia-e-telefono.md`).

#### Nuove modalità

Nelle cose da mettere dopo aver masterizzato il gioco, creiamo delle nuove modalità giocabili/DLC:

ESEMPI NUOVE MODALITA' DI GIOCO:

1. MODALITA' CARRIERA STUDIO:

   - Il personaggio creato dall'utente è un rapper di uno studio e devi portare lo studio al top (es. La fame studio) e avere lo studio migliore contro altri studi gestiti da altri player attivi

2. MODALITA' A SCELTA DI CITTA' DI PARTENZA E LIBERA: puoi decidere in che città nascere e in base a quello hai pro o contro. Il player sceglie tra un numero di città predefinito e poi si può spostare in tutto il mondo (forse meno)

3. MODALITA' CON PIU' CITTA' FINALI: dopo esserti stabilizzato a Los Angeles e, dopo aver creato contatti con personaggi di altre città o che lavoro in altre città o inviti per telefono che ti ha fatto ricevere il manager sblocchi la possibilità di andare o trasferirti in altre città come:

   - Chicago i crimini sono più facili ma c'è più criminalità/concorrenza ed è più difficile affermarsi
   - Las vegas: per avere i casinò migliori e i locali top per massimizzare il lifestyle così puoi averlo al massimo e sbloccare un'altra cosa es. un titolo da esporre nella descrizione del profilo tipo: JOHN GOTTI
   - Atlanta/New York: più focalizzata sul conoscere artisti famosi come 21 Savage, Future, Young Thug
