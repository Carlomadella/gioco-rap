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
   insieme. Si aggiorna a ogni giro: un punto chiuso esce dalla lista e va in fondo, una
   riga con la data e dove sta il racconto; i numeri delle voci si spostano.
2. **Inbox automatica** — le richieste nuove come checkbox, una frase basta: le legge
   `scripts/roadmap-auto.js`, che prima cerca duplicati e cose già fatte.
3. **Le liste per persona** (ALE, CARLO) — i punti scritti a mano, con sotto le note di
   stato: `FATTO`, `FATTO in parte` e cosa manca, `RISPOSTA` se se n'è solo discusso.

---

## Da fare adesso, in ordine

Riordinato il 20/09/2026, dopo il reparto Vestiti dello Shop; il 21/09 sono uscite le due
piccole della Sala e della take, e i tre punti dello Shop. Le voci chiuse sono uscite
dalla lista e stanno in fondo, una riga l'una con la data e dove sta il racconto — prima
restavano barrate in mezzo alle aperte e la lista era lunga il doppio di quello che
serviva. I sette punti di CARLO del 16/09 (lo Studio, la troupe) sono entrati: due erano
già chiusi senza che nessuno lo dicesse, il Marketing spostato e la preview di un pezzo
non uscito. È l'ordine in cui si prendono i punti aperti di questo foglio **e** quelli
ancora aperti in [`problemi-riscontrati.md`](../documentazione/problemi-riscontrati.md):
prima quello che tocca il gioco sul telefono (è lì che esce), poi quello che pesa nel
pacchetto o blocca una partita, poi le cose piccole e chiare, poi i lavori lunghi, in
fondo quello che è una decisione prima che un lavoro. Ogni voce cita il **testo** del
punto, non il numero — qui i numeri si spostano a ogni riordino — e dice da quale lista
viene.

**Sul telefono**

1. **Il giro su un telefono vero** — la coda della responsività (CARLO, «Responsività»,
   chiusa l'08/09). Le misure sono state prese nel browser a sedici misure, dal 360 al
   1920: in mano, mai. Si fa con `prova-sul-telefono` sull'estensione, o con un telefono
   collegato; finché non passa, la tappa della responsività non è chiusa (lo dice anche la
   roadmap).

**Pesa nel pacchetto o blocca una partita**

_Niente di aperto: `jose` e `zod` sono usate, l'avvio rapido dice quanto ci mette, i
cinque video del punto sono collegati. I sette video in più sono una decisione, in fondo._

**Piccole e chiare**

_Niente di aperto: i tre punti dello Shop scelti il 20/09 sono chiusi tutti il 21/09, in
fondo fra le chiuse._

**Lavori lunghi**

2. **Via la lucidità** — CARLO, «togli il parametro «lucidità» e tutto ciò che ne
   consegue». Tocca 17 file del gioco e le formule della qualità del testo: non è una
   riga, va fatto in una task sua con l'audit aggiornato nello stesso commit. Chiude da
   sola anche «l'uscita di venerdì non costa niente, quella a mano sì» di
   problemi-riscontrati.
3. **La cover «stile emblema»** — CARLO, l'ultima coda del punto «Non è più: "Faccio un
   pezzo → +10 fama"» (FATTO in parte): l'editor di copertine a livelli, come l'emblema di
   Black Ops 2. È una pagina a parte. Il resto della coda è chiuso: la cover da file c'era
   dal 07/09, la discografia era già un'app del telefono dal 04/09 (il foglio diceva il
   contrario), e **le remastered e le parti 2** sono FATTE il 21/09 — «Remastered e parti 2»
   sotto «19 · La discografia», `04-musica-e-suoni.md`.
4. **Beat, Testo e Cabina a mano, il resto in automatico coi malus** — CARLO, «Studio
   (16/09/2026)»: «l'utente deve poter fare solo le sezioni Beat, Testo e Cabina, poi il
   resto in automatico, però questo porta dei malus». Oggi Mix e Uscita si aprono col
   primo pezzo sul banco e si fanno a mano. L'automatico è una scelta in Cabina («chiudi
   tu il resto»): un mix medio, l'uscita al venerdì, e un malus sulla qualità che si legge
   nel riquadro dei numeri.
5. **La serata del Live Club giocata a momenti** — CARLO, la coda di «aggiungi le foto di
    background dei posti»: nel riferimento `concerto_live` in mezzo alla pagina c'è «al
    terzo pezzo uno in fondo comincia a parlare sopra», tre risposte e la gente che sale o
    scende, più «cambia ordine» nella scaletta. Oggi la serata è la mossa `live` di sempre
    (un numero) scelta sulla foto: i momenti sono il minigioco della Piazza rifatto per il
    palco, e la scaletta con l'ordine vorrebbe un peso in `sim.js`.
6. **Le card sulla mappa troppo vicine, i pulsanti sopra la mappa troppo grandi** — ALE.
    Si giudicano a occhio: vanno guardate con uno screenshot, non dal CSS. Stessa cosa per
    **la schermata opzioni da migliorare graficamente** — CARLO, pagina di landing.
7. **Quando skippi tante ore ci mette troppo** — CARLO. Prima si misura (quanti giorni,
    quanti secondi), poi si cerca dove.
8. **Su LaFamegram non posta nessuno** — CARLO. Oggi gli altri compaiono nel feed solo
    quando l'evento riguarda te (il fan, il giornalista, la Strada: `lafamegramEventi`);
    nessun contatto della Sala o rivale posta per conto suo. Prima si decide chi posta e
    cosa, poi si fa.
9. **Il pub e la pubblicità come primo modo di fare hype** — ALE, la coda del punto
    sull'hype (FATTO il 06/09 per il resto, in `fatte.md`): oggi non esistono né come
    luogo né come azione.
10. **I collettivi di rapper** — CARLO, «Studio (16/09/2026)»: «fai in modo che si possano
    creare collettivi di rapper». Nel gioco non esiste un gruppo: ci sono i rivali della
    classifica e la gente della Sala, uno per uno. Prima si scrive cos'è un collettivo
    (chi ci entra, cosa dà — pezzi in comune, hype condiviso, un nome in classifica), poi
    si fa.
11. **Il joint album con altri rapper, su chiamata di un produttore** — CARLO, «Studio
    (16/09/2026)»: «fai in modo che un produttore possa chiamarti per fare un joint album
    con altri rapper». La chiamata è un evento del telefono; l'album, più pezzi in fila
    con più feat, oggi non esiste come oggetto. Viene dopo i collettivi.

**Decisioni prima che lavori**

12. **I rapporti coi beatmaker che vanno in negativo** — ALE. In `posto.js` il rapporto
    scende (`p.rel--`) ma è tenuto fra 0 e 5: sotto zero non va. Prima di farlo va deciso
    cosa succede a −1 (non ti vende più? ti fa pagare di più?).
13. **Non sempre far scorrere una giornata ridà l'energia** e **la legacy** — CARLO. Sono
    regole di gioco nuove: prima si scrive come funzionano, poi si fa.
14. **Lo Shop in provincia, con limitazioni** — ALE. Lo Shop c'è già dal primo giorno, e
    dal 21/09 sette capi si sbloccano con la carriera («Capi che si sbloccano», fra le
    chiuse): è una limitazione, ma per carriera, non per città. Va ancora deciso cosa **non**
    si vende in provincia (vedi la RISPOSTA sotto al punto).
15. **La troupe** — CARLO, «Da discutere»: «il player può decidere se avere una troupe:
    manager, social media manager, fonico personale, beatmaker personale, videomaker». Il
    fonico e il beatmaker «personali» sono già gente della Sala con un rapporto che sale;
    il manager, il social media manager e il videomaker non esistono. Prima si decide cosa
    fa ognuno e quanto costa a settimana.
16. **Le decisioni tue**, senza le quali il resto non si muove: se dopo Milano e Los
    Angeles si può tornare indietro (DA DISCUTERE); la pagina di Mycol e il «tuo artista»
    nella landing; se il gioco sugli store gira anche **di traverso** (nel repo non c'è un
    manifest né un `orientation`, da problemi-riscontrati); e se cancellare gli undici
    branch già uniti in `main` (`git branch --merged main` li elenca, da
    `test/vitest-playwright-gate` a `task/studio-cinque-linguette`), anche sul remoto.
17. **Come arriva MakeHuman a chi installa il gioco** — dal punto su Avaturn e il camerino
    (FATTO il 20/09): il camerino MakeHuman legge il dataset di `media/makehuman-editor-v1`
    (2,8 GB), che sta fuori da git e fuori dal pacchetto per gli store
    (`FUORI_DAL_PACCHETTO` in `strumenti/build.js`). In un pacchetto pulito la strada «crea
    l'avatar nel gioco» e l'avvio rapido non partono. Le strade: un pacchetto ridotto
    (solo i proxy e i target che il camerino usa davvero — il catalogo UI ne conta 468 su
    1.717), un download al primo avvio, o il dataset intero. Va deciso prima dell'uscita,
    insieme al progetto Avaturn nostro (oggi gira sul demo pubblico).
18. **I sette video che nessun punto chiede** — la coda delle transizioni video (FATTO il
    20/09 per i cinque del punto): palestra, Milano, club, shop, trasferta, live, più
    `video_transizione_entrata_in_studio` che è un doppione dello studio. Sono 22 MB in
    `frontend/media/video/Transizioni di scena/` che viaggiano nel pacchetto per gli
    store senza che nessuna riga li carichi. O si collegano — la palestra, il club e lo
    shop hanno un cartello, il live è una mossa, Milano e la trasferta sono i viaggi, e
    il meccanismo è pronto (`TRANSIZIONI_VIDEO` in `js/game/transizioni-video.js`, una
    riga e una chiamata l'uno) — o escono da `media/`. Il doppione esce comunque.

Restano fuori dall'ordine, di proposito: **le nuove modalità** (Carriera Studio, città di
partenza, le città finali), che sono per dopo, quando il gioco è masterizzato; le canzoni
con l'IA, che è una **giornaliera** e non si smista; e i due «aperti di proposito» di
problemi-riscontrati (la copertina «grande» e quella «di adesso» quasi uguali, la risposta
del Marketing in cima).

**Chiuse, dal riordino del 15/09 a oggi** — una riga l'una; il racconto sta nel foglio
detto, la richiesta com'era scritta in [`fatte.md`](fatte.md):

- **Il giro unico sull'hover al tocco** — FATTO 08/09 (riconosciuto il 15/09): «La
  responsività: lo Studio, la Strada e l'hover al tocco», `02-interfaccia-e-telefono.md`.
- **Un pezzo non uscito non si spinge: se ne fa uscire un'anteprima** — FATTO 14/09
  (riconosciuto il 20/09): stessa sezione, `02-interfaccia-e-telefono.md`.
- **Le tre del Marketing** — FATTO 14/09 (riconosciuto il 20/09), più la riga delle mosse
  nell'Agenda a capo: «Le tre del Marketing», `02-interfaccia-e-telefono.md`.
- **Il Marketing sul telefono vero** — FATTO 15/09: «Il telefono quando lo schermo è un
  telefono», `02-interfaccia-e-telefono.md`.
- **Il Marketing spostato fuori dallo Studio** («marketing toglilo da qua e spostalo,
  dimmi dove lo metti») — FATTO 15/09 (riconosciuto il 20/09): sul telefono, in
  LaFamegram, «Che post fai?» — «Lo Studio a cinque linguette», `02-interfaccia-e-telefono.md`.
- **`jose` va usata, e `zod` va deciso** — FATTO 16/09: «Le due dipendenze del backend,
  usate», `07-multiplayer-e-backend.md`.
- **L'avvio rapido ci mette due minuti e non lo dice** — FATTO 19/09: «L'avvio rapido: la
  schermata «Preparo il tuo artista»», `02-interfaccia-e-telefono.md`.
- **Le foto dei posti che non hanno ancora una pagina** — FATTO 19/09: «Le pagine dei
  posti sulla loro foto», `02-interfaccia-e-telefono.md`. La serata a momenti è la voce 5.
- **Fra i 980 e i 1180 punti la barra della plancia trabocca** — FATTO 20/09, con la
  plancia a 1280 × 800 e 1366 × 768: «La fascia della plancia fra 980 e 1240, e la plancia
  a 1280 × 800», `02-interfaccia-e-telefono.md`.
- **Le transizioni video** — FATTO 20/09 (lo Studio dal 16/09): «Le transizioni video: gli
  altri quattro», `02-interfaccia-e-telefono.md`. I sette video in più sono la voce 18.
- **L'evento fatto esce dall'agenda** — FATTO 20/09: `02-interfaccia-e-telefono.md`.
- **I prezzi dei beat per fama del beatmaker** — FATTO 20/09: `04-musica-e-suoni.md`.
- **Si parte con tutti i parametri a 1** — FATTO 20/09: `05-carriera-e-tempo.md`.
- **Non ci si può licenziare** — FATTO 20/09: `05-carriera-e-tempo.md`.
- **Lo Shop promette tre reparti, ce ne sono due** — FATTO 20/09: «Lo Shop: il reparto
  Vestiti — lo Shop sblocca, il camerino veste», `02-interfaccia-e-telefono.md`.
- **Avaturn e il creator in game, tutti e due** — FATTO 20/09, confermato in partita e
  scritto: «Avaturn e il camerino MakeHuman, tutti e due», `03-artista-e-avatar.md`.
- **Non deve costare energia interagire con gli altri nella Sala** — FATTO 21/09, tutto a
  zero: «Nella Sala non si spende energia», `06-mondo-e-personaggi.md`.
- **Costa troppo una take in studio** — FATTO 21/09, la prima a 25 e le altre a 8: «La
  take costa 25, le altre 8», `04-musica-e-suoni.md`.
- **Lo stile che conta** — FATTO 21/09: «Lo stile che conta: i capi addosso pesano su hype,
  presenza e promo», `02-interfaccia-e-telefono.md`.
- **I beat non devono stare nello shop, i filtri dei vestiti, l'attrezzatura non serve** —
  FATTO 21/09, lo stesso giorno in cui è stato chiesto: «Lo Shop vende solo vestiti, coi
  filtri per tipologia», `02-interfaccia-e-telefono.md`.
- **Capi che si sbloccano** e **Le offerte della settimana** — FATTO 21/09, insieme: «Lo
  Shop cresce con la carriera: i capi che si sbloccano e le offerte della settimana»,
  `02-interfaccia-e-telefono.md`.
- **Le tre code dello Studio a cinque linguette** — FATTO 21/09: l'omonimo e il posto
  rubato alla Sala nel branch, la copertina orfana era già chiusa dal 14/09; «Le tre code,
  chiuse il 21/09/2026» sotto «Lo Studio a cinque linguette», `02-interfaccia-e-telefono.md`.

Due punti di CARLO — «quando non sono fix… crea un file nuovo collegato ai già presenti»
e «tieni tutto ciò che riguarda la parte smartphone separata dal resto del progetto» —
**non sono task ma regole di lavoro**: dal 20/09/2026 stanno in
[`come-si-lavora.md`](../documentazione/come-si-lavora.md) («Le regole di Carlo sui
file») e nella versione corta in `CLAUDE.md`, e sono uscite dalla lista qui sotto.

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

_Il 20/09/2026 Carletto ha rinumerato la lista senza buchi: i numeri che `fatte.md` cita
per i punti chiusi sono quelli di prima. L'hype (era il 6) ci stava «apposta, per la coda
che manca»: la coda — il pub e la pubblicità — è una voce dell'ordine in testa, e il punto
è andato in `fatte.md` con gli altri._

2. Rendi accessibile lo shop già dalla città iniziale, con limitazioni sui prodotti in vendita

   **RISPOSTA (15/09/2026)** — lo Shop sta già nella città iniziale: in `hub.js` è un
   cartello del quartiere «periferia», si apre dal primo giorno. Quello che manca è la
   seconda metà, «con limitazioni sui prodotti in vendita»: va deciso cosa non si vende
   in provincia (i beat sopra a una certa qualità? l'attrezzatura da studio grande?).

3. i rapporti con i beatmaker non vanno mai in negativo, puoi offenderli quanto vuoi e il rapporto resta uguale

4. Avaturn voglio lo rendiamo UN 50/50 , Cioè chi non vuole andare a farsi tutta la trafila per fare avaturn (anche se ovviamente dobbiamo fare di tutto per consigliarli a farlo) può benissimamente creare il suo avatar in game. FAI COESISTERE LE COSE.

   **RISPOSTA (15/09/2026)** — nel codice convivono già: `avvio.js` apre
   «Avaturn/MakeHuman», `hub.js` distingue `avatarSource === "avaturn"` dall'altro, e
   l'avvio rapido carica MakeHuman vero. Da confermare in partita che dal creator si
   scelga davvero fra le due strade, e poi scriverlo in
   [`03-artista-e-avatar.md`](03-artista-e-avatar.md), che oggi non ne parla.

   **FATTO (20/09/2026)** — confermato in partita: la prima schermata del creator chiede
   «Come vuoi creare il tuo artista?» con le due card, MakeHuman apre il camerino e Avaturn
   il suo editor, e si cambia strada senza perdere l'avatar confermato. Sulla card di
   Avaturn c'è scritto «consigliato». «Avaturn e il camerino MakeHuman, tutti e due» in
   `03-artista-e-avatar.md`, con le tre cose che 50/50 non sono (lo Shop veste solo
   MakeHuman, Avaturn gira sul demo pubblico, MakeHuman vuole il suo dataset).

5. Studio, casa e attività criminiali sulla mappa sono TROPPO VICINE LE CARD tra di loro. Anche se gli edifici sono abbastanza vicini falle in un modo MOOOOLTO più clean. Così sono troppo ammassate.

6. Ti ricordo che i pulsanti sopra la mappa sono ANCORA TROPPO GRANDI rispetto ai quadratini stessi. Rivedilo.

### CARLO

_Rinumerata senza buchi il 20/09/2026, come quella di ALE: il «punto 4 di CARLO» che
`studio.js` cita è ancora il 4, quello lungo sulla catena del pezzo; i numeri che
`fatte.md` cita per i punti chiusi sono quelli di prima. Due punti non erano task ma
regole di lavoro («crea un file nuovo collegato», «la parte smartphone separata») e dal
20/09 stanno in `come-si-lavora.md`; le transizioni video e la domanda sull'agenda che
blocca il giorno (risposta e chiusa) sono in `fatte.md`; dal 21/09 anche il 12, la take
che costava troppo._

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
   per pezzo). **FATTO anche (21/09/2026)**: le **remastered e le parti 2**, dalla
   Discografia sul telefono allo Studio («Remastered e parti 2», `04-musica-e-suoni.md`);
   la cover caricata da file c'era dal 07/09 e la discografia è un'app del telefono dal
   04/09 — questo foglio diceva che mancavano, e non era vero. **Manca** solo la cover
   «stile emblema», l'editor a livelli.

5. Non funziona più la pagina attività criminali, questo è ciò che segna in console:

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

6. aggiungi le foto di background dei posti senza HTML, poi ricrea la schermata identica alle foto con elementi HTML

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

7. quando skippi tante ore ci mette troppo a simulare

8. togli il parametro «lucidità» e tutto ciò che ne consegue

9. aggiungere la legacy cioè quanto sei influente sulle generazioni future o più piccole di artisti

10. non sempre far scorrere una giornata ti ridà l'energia

11. sull'app lafamegram non posta nessuno

    **Stato (15/09/2026)** — nel feed (`telPost()` in `telefono.js`) ci sono i tuoi post,
    quelli che nascono dagli incontri — il fan, il giornalista, la Strada, tutti in
    `lafamegramEventi` e tutti **su di te** — e due notizie de «La Voce del Giro». Nessun
    contatto della Sala, nessun rivale, posta per conto suo: è vero che «non posta
    nessuno». Prima di farlo va deciso chi posta e cosa (i beatmaker i loro beat? gli opps
    contro di te? chi scala la classifica?).

#### Studio (16/09/2026)

_Scritti da Carletto il 16/09 nella lista dello Studio; i numeri sono i suoi, i buchi
sono i punti chiusi in [`fatte.md`](fatte.md). Il 7 (il Marketing spostato) e l'8 (la
preview di un pezzo non uscito) risultavano fatti dal 14 e dal 15/09 senza che il foglio
lo dicesse: riconosciuti il 20/09. L'11 (la Sala senza energia) è chiuso il 21/09, in
`fatte.md`. Gli altri tre sono nell'ordine in testa._

10. l'utente deve poter fare solo le sezioni Beat, Testo, e Cabina, poi il resto in automatico, però questo porta dei malus

12. fai in modo che si possano creare collettivi di rapper

13. fai in modo che un produttore possa chiamarti per fare un joint album con altri rapper

#### Shop (20/09/2026)

_Le idee proposte chiudendo il reparto Vestiti («Lo Shop: il reparto Vestiti» in
`02-interfaccia-e-telefono.md`); Carlo ha scelto queste tre. Tutte e tre chiuse il
21/09/2026 e stanno in `fatte.md` — «Lo stile che conta», poi «Capi che si sbloccano» e
«Le offerte della settimana» insieme — con la richiesta del 21/09 sullo Shop solo vestiti
coi filtri (chiusa lo stesso giorno)._

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
