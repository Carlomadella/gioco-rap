quando finisci una task committa e pusha e nel committ fai riferimento al punto del file completato. Se vedi che viene modificato il file non preoccuparti, sono io, tu continua con quello che stai facendo, ogni volta che finisci un task segnalo come completato

# Punti nuovi

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
perché qualcuno li cita (vedi [`fatte.md`](fatte.md)).

L'indice con **tutti i punti e il loro stato** sta in
[`implementazioni/README.md`](README.md).

---

## Da smistare

### Inbox automatica

**Scrivi qui le nuove richieste anche in una frase sola.** Prima di espanderle il sistema cerca duplicati, sovrapposizioni e cose già implementate; solo dopo costruisce i passaggi mancanti.
La lista storica già presente sotto **rimane intatta** ed è importata automaticamente nel cruscotto: non viene riscritta né cancellata.

<!-- ADF-AUTO-INBOX:BEGIN -->
<!-- Esempio (non attivo): - [ ] voglio cambiare il tempo del turno in fabbrica -->
<!-- ADF-AUTO-INBOX:END -->
_(qui sotto finiscono i punti nuovi, appena scritti)_

ALE:

2. Rendi accessibile lo shop già dalla città iniziale, con limitazioni sui prodotti in vendita

3. i rapporti con i beatmaker non vanno mai in negativo, puoi offenderli quanto vuoi e il rapporto resta uguale

4. Ci sono i prezzi dei beat spropositati. Non ha senso che alcuni beat costino 700 euro al livello quattro. Facciamo prezzi realistici : da 100 a 250 euro beat da beatmaker emergenti , da 300 euro a 1000 per beatmaker affermati e da 1000 a 2000 per beatmaker famosissimi

5. Il giocatore parte con tutti i parametri a 1

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

8.  Le card sulla mappa come studio, fabbrica, pizzeria, la sala ecc hanno una card cliccabile troppo grande, LE VOGLIO TUTTE COME STUDIO. Inoltre noto che l'ultima cosa dove entri resta una sorte di pallino gialla come se t'indicasse l'ulitma cosa schiacciata. Non la voglio.

9.  Ci sono dei tastini sul in centro sotto della mappa che fan muovere la mappa. Levali. La mappa non voglio si veda muoveree. dev'essere ferma

10. Lo shop dev'essere un vero e proprio shop, come gli shop di fortnite o nba2k.. LEVA STI CAZZO DI INTERFACCIA MENU! RENDILO UNO SHOP DA VIDEOGIOCO NEL 2026

11. Avaturn voglio lo rendiamo UN 50/50 , Cioè chi non vuole andare a farsi tutta la trafila per fare avaturn (anche se ovviamente dobbiamo fare di tutto per consigliarli a farlo) può benissimamente creare il suo avatar in game. FAI COESISTERE LE COSE.

12. Studio, casa e attività criminiali sulla mappa sono TROPPO VICINE LE CARD tra di loro. Anche se gli edifici sono abbastanza vicini falle in un modo MOOOOLTO più clean. Così sono troppo ammassate.

13. Ti ricordo che i pulsanti sopra la mappa sono ANCORA TROPPO GRANDI rispetto ai quadratini stessi. Rivedilo.

CARLO:

/_ GIORNALIERE _/

1. creare canzoni con l'ia, guarda cartella musica nei segnalibri, task giornaliera quindi da non smistare

/_ DA FARE _/

4. Non è più: "Faccio un pezzo → +10 fama", ma diventa:

TRACK luogo: STUDIO
│
├── Beat/Producer il beat puoi crearlo tu o chiedere ad un produttore di crearti il beat
├── Mix
├── Testo
├── Cover (influenza meno, ma ha 3 opzioni: caricamento file da telefono/computer, assets preimpostati e personalizzazione stile emblema black ops 2)
├── Featuring (può esserci come no, nelle canzoni, nel caso abbiamoo un feat nemlle canzoni, non è obbligatorio che il feat venga alla sessione, ovviamente se svolge la sessione con noi molto probabilmente i pezzo avrà più qualità)
├── Marketing (dimmi te come lo svilupperesti, dammi una terza opzione, le prime due sono: in discografia sul telefono tramite app, in studio in una sezione dedicata)
└── Timing (app discografia)

E ogni elemento influenza il risultato.

Esempio:

"TUTTO O NIENTE"

Beat 82
Testo 76
Mix 68
Feature 85
Marketing 53
────────────────────
QUALITÀ tot

Poi, ad esempio:

QUALITÀ tot
HYPE 82
FAMA 31
NETWORK 64

→ 43.000 streams.

è possibile controllare come stanno andando le canzoni nel tempo da un'app del telefono per sapere se stanno invecchiando bene o male e magari farci delle remastered o parti 2 di una canzone o di un album (discografia)

4. aggiungi le foto di background dei posti senza HTML, poi ricrea la schermata identica alle foto con elementi HTML

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

   **Cosa manca ancora, per chiudere il punto:** le altre sei foto di riferimento sono di
   posti che non hanno ancora una pagina che le carichi — Casa (`casa_di provincia_definitiva`,
   `scrittura_barre`), la Palestra, il freestyle in piazza, il concerto live e lo «stacca la
   spina». E dentro allo Studio, Cover e Feat una foto loro non ce l'hanno né con né senza
   interfaccia: si tengono in prestito quella della stanza più vicina.

5. Il motore degli eventi non sa che hai comprato un beat se non lo compri dallo Shop. Non è di questa task, ma questa task la allarga (i posti muti sono due su tre invece di uno su due). Sistemarlo vuol dire decidere che nomi deve ascoltare eventi-v2.js: tocca il motore, non lo Studio.

6. Il tasto d'oro in cabina. Nella foto registrazione_pezzo l'oro ce l'ha «UN'ALTRA TAKE», e la foto era la richiesta. Ma la regola scritta in css/studio.css dice che l'oro va alla mossa che fa succedere la cosa — ed è per quella regola che nella sezione Beat «Compralo» è d'oro e «Fattelo fare» no. Qui le due cose non vanno d'accordo: ha vinto la foto, e il risultato è che chi va di fretta preme l'oro e spende 12 di energia senza volerlo. Dimmi e la giro.

/_ RESPONSIVITA' _/

Chiusa il 08/09/2026: i tre punti dello Studio (l'orologio galleggiante, la barra
delle take, la fascia a 360), l'hover che restava acceso al tocco su tutti i CSS, e
il giro largo sulle altre schermate — da cui e' uscita la Strada, che sotto ai 980
punti non si impilava e sul telefono non si giocava. Il racconto per esteso sta in
`implementazioni/02-interfaccia-e-telefono.md`, sotto «La responsivita': lo Studio,
la Strada e l'hover al tocco».

Resta da fare: il giro su un telefono vero con `prova-sul-telefono` — le misure sono
state lette nel CSS, le schermate non sono state rifatte.

7. implementa le transizioni dentro al progetto, che partano cliccando sulla scheda collegata — studio, sala, ritorno a casa, stacca la spina, registra un pezzo. Nel dettaglio: il primo video parte quando il player clicca sul luogo chiamato "studio", il secondo quando clicca su "sala", il terzo quando decide di tornare a "casa", il quarto su "stacca la spina", il quinto su "registra un pezzo".

8. quando skippi tante ore ci mette troppo a simulare

9. togli il parametro «lucidità» e tutto ciò che ne consegue

10. aggiungere la legacy cioè quanto sei influente sulle generazioni future o più piccole di artisti

11. quando non sono fix, risoluzioni di bug o errori non modificare troppo i file già presenti ma crea un file nuovo collegato ai già presenti

12. non sempre far scorrere una giornata ti ridà l'energia

13. tieni tutto ciò che riguarda la parte smartphone separata dal resto del progetto

/_ DA DISCUTERE _/

2. DA DISCUTERE Dopo aver completato milano ed essere diventato goat ed essere andato a los angeles il player può decidere se trasferirsi in un'altra città italiana o per forza a Los Angeles? Per forza a los angeles, però può decidere di tornare nelle città prima

/_ PAGINA DI LANDING: _/

1. migliorare graficamente la schermata opzioni

2. creare una schermata per le classifiche che si apre anche dall'app del telefono

3. DA DISCUTERE collegare la pagina di mycol togliere la sezione il tuo artista dalla pagina di landing o , oltre che da nuova partita. e collegarla allo shop, se shoppi qualcosa ti va nell'inventario

/_ NUOVE MODALITA' _/

Nelle cose da mettere dopo aver masterizzato il gioco, creiamo delle nuove modalità giocabili/DLC:

ESEMPI NUOVE MODALITA' DI GIOCO:

1. MODALITA' CARRIERA STUDIO:

- Il personaggio creato dall'utente è un rapper di uno studio e devi portare lo studio al top (es. La fame studio) e avere lo studio migliore contro altri studi gestiti da altri player attivi

2. MODALITA' A SCELTA DI CITTA' DI PARTENZA E LIBERA: puoi decidere in che città nascere e in base a quello hai pro o contro. Il player sceglie tra un numero di città predefinito e poi si può spostare in tutto il mondo (forse meno)

3. MODALITA' CON PIU' CITTA' FINALI: dopo esserti stabilizzato a Los Angeles e, dopo aver creato contatti con personaggi di altre città o che lavoro in altre città o inviti per telefono che ti ha fatto ricevere il manager sblocchi la possibilità di andare o trasferirti in altre città come:

- Chicago i crimini sono più facili ma c'è più criminalità/concorrenza ed è più difficile affermarsi
- Las vegas: per avere i casinò migliori e i locali top per massimizzare il lifestyle così puoi averlo al massimo e sbloccare un'altra cosa es. un titolo da esporre nella descrizione del profilo tipo: JOHN GOTTI
- Atlanta/New York: più focalizzata sul conoscere artisti famosi come 21 Savage, Future, Young Thug
