# Anni di Fame — il primo mese

*Dal 29 agosto al 29 settembre 2026: cosa è successo, giorno per giorno, e dove siamo arrivati.*

---

Il 29 agosto Anni di Fame era **un file HTML solo**, nato come artifact in una chat: un gestionale da
browser con un avatar e qualche barra. Il 29 settembre è **un gioco con una città da girare,
uno studio dove si incide un pezzo take per take, un telefono con due social, un carcere, una
classifica online dove i bot non si riconoscono dai giocatori veri, un server con gli account
e i salvataggi in cloud** — e, a fianco, un laboratorio che sta insegnando a una macchina ad
ascoltare un beat e a riscriverlo in note.

In mezzo ci sono trentadue giorni. Questo è il racconto.

| il mese in numeri | |
| --- | --- |
| giorni con almeno un commit | **30 su 32** |
| commit, tutti i branch | **più di 1.100** |
| il giorno più pieno | **domenica 21 settembre, 191 commit** |
| file di gioco (JS) e fogli di stile | **116 e 33** |
| tabelle nel database del server | **20** |
| rotte del server provate una per una | **34** |
| prove automatiche nel browser | **16 scenari**, più le prove senza browser e l'audit che si accorge se sparisce qualcosa |
| problemi trovati dai giri di controllo | **64 voci**, chiuse tutte tranne una scelta di bilanciamento e due lasciate aperte apposta |

---

## Il gioco oggi, in due minuti

Se non lo apri da un po', ecco cosa trovi.

**Crei l'artista.** Un camerino 3D (MakeHuman) con quattordici preset e le facce che si
modellano, oppure la foto-avatar di Avaturn: convivono, scegli tu. Se hai fretta c'è l'avvio
rapido, che ti prepara un artista con nome e città di provenienza — e mentre lo fa te lo dice,
invece di lasciarti davanti al nero.

**Entri in città.** La schermata di gioco è una plancia: il tuo profilo a sinistra, la mappa
della provincia al centro, il telefono a destra, gli eventi del giorno in basso. La mappa è la
foto del concept, con i luoghi che si toccano: lo Studio, La Sala, Casa, la Palestra, lo Shop,
la Pizzeria, la Fabbrica, il Live Club, la Piazza, le Attività criminali. Il tempo scorre ora
per ora, col meteo e la luce che cambia; puoi saltare avanti, e dal 28/09 anche otto ore di
salto durano due secondi.

**Fai un pezzo.** Lo Studio ha cinque linguette — *Beat · Testo · Cabina · Mix · Uscita*. Il
beat lo compri (i prezzi salgono con la fama del beatmaker) o te lo fa una persona che hai
conosciuto; il testo lo scrivi nel foglio, con l'autocompletamento; in cabina registri le take
e scegli quella buona; al banco del mix muovi voce, bassi e aria; all'uscita scegli la
copertina e il giorno. Il feat lo chiami in cabina, da chi conosci o dalla classifica — e può
dirti di no. La qualità e gli ascolti hanno due conti separati, scritti in chiaro. Se vuoi fare
solo Beat, Testo e Cabina, il resto lo chiude il gioco da solo, con un malus.

**Lo fai girare.** Il marketing è sul telefono: su **LaFamegram** scegli che post fare, e da
oggi ci postano anche i rivali e la gente che hai conosciuto. Su **Sputa**, il finto X da 140
caratteri, i rivali sputano barre. La **Discografia** ti fa vedere come invecchiano i pezzi, e
da lì prenoti una remastered o una parte 2.

**Vivi.** Alla Sala conosci fonici, beatmaker, rapper e videomaker, con sei gradini di rapporto
(e con un rapper puoi anche rompere: diventa un opp). Per strada incontri fan, giornalisti,
opp. In Piazza c'è la battle di freestyle. La Strada è il minigioco del criminale, e se ti
prendono c'è il carcere, giocato davvero. Lo Shop vende vestiti che pesano su hype e presenza,
con i capi che si sbloccano con la carriera e l'offerta del lunedì. C'è l'agenda, il diario di
bordo, l'albero delle abilità, i dischi d'oro.

**E la classifica è una sola.** Il server tiene una classifica unica per tutti, con dentro i
giocatori veri e i bot — che hanno nomi da rapper, una città, un genere, una storia, e si
diradano man mano che arriva gente vera. Gli account (da ospite, con la mail, e la verifica
per Steam, Apple e Google già scritta) e i salvataggi in cloud ci sono.

---

## Il diario

### Settimana zero — il monolite si apre

**Venerdì 29 agosto.** Il primo commit si chiama «import iniziale da artifact»: tutto il gioco
sta in un file. Il secondo lo spacca in `index.html`, fogli di stile e file di codice — la
decisione che rende possibile tutto il resto. Lo stesso giorno entrano il salto del tempo, i
generi dei beat, l'ascolto, e la sezione avatar nello stile della sheet degli otto ritratti.

**Sabato 30.** Il catalogo completo dell'avatar, «dai buzz cut al full neck». Landing rifatta,
marchio, l'avatar nella barra. Poi una giornata che chiunque abbia fatto un'interfaccia
riconosce: la navbar va a 37 pixel, poi 46, poi 56. Si esce da ogni finestra con la ✕, con
ESC o con un clic fuori. Arriva il menu impostazioni e il banco suoni nuovo.

**Domenica 31.** Il giorno in cui il gioco cambia forma: **la schermata di gioco diventa la
mappa della provincia**, prima disegnata, poi direttamente la foto del concept, con la plancia
intera intorno. Nasce **La Sala**, il posto dove si conosce la gente. E sotto, senza far
rumore, tre decisioni grosse: il progetto si divide in `frontend/` e `backend/`, nasce il
server della classifica — *una sola per tutti* — e si mette nero su bianco che il gioco non è
una pagina web ma un prodotto per **Steam e gli store del telefono**. Primo dei cinque lavori
per arrivarci: il build vero.

### Settimana uno — il giorno dei sessanta commit, e arriva Mycol

**Lunedì 1 settembre. Sessanta commit, tre persone in parallelo.** Carletto costruisce il
server: database vero, account, salvataggi in cloud, accessi Steam/Apple/Google, sanzioni,
moderazione dei nomi, classifiche per città e per genere, stagioni e albo d'oro, un
anti-imbroglio che ragiona sul gioco, PostgreSQL pronto per il giorno dell'uscita, e tutte le
34 rotte provate su Postman. Nello stesso giorno Alessio riempie il mondo: **il telefono
diventa un iPhone vero con LaFamegram**, il negozio, l'energia a 100 e la vita a giornate,
quaranta dialoghi nuovi alla Sala, suoni nuovi, Shop e Concerti sbloccati sulla mappa, sette
mosse che aprono una pagina vera invece di un avviso, sette incontri per strada «stessa forma,
circostanze diverse», Pizzeria e Fabbrica al posto di due cartelli chiusi, **la Strada** — il
minigioco del criminale che mancava — la chat nel telefono, l'età dei personaggi, le
transizioni fra le schermate e **156 scene per i fan**, la gerarchia degli incontri durante un
salto di tempo, opp e giornalisti per strada. La sera il gioco regge dal telefono al monitor
grande.

**Martedì 2.** Arriva Mycol, e arriva col botto: **il tempo di gioco, gli eventi v2 e il
TRAPHONE del crimine** in un colpo solo. Poi il carcere separato dalle attività criminali, i
limiti al riciclaggio, il controllo globale del tempo. Carletto aggiunge le trasferte fuori
città, la discografia coi pezzi che invecchiano, il videomaker alla Sala e il README completo
delle rotte. Arriva **la mappa definitiva della città**.

**Mercoledì 3.** Mycol mette in piedi la macchina che ancora oggi tiene in ordine il progetto:
**il meteo dinamico**, il **registro automatico dei merge** (il bot che scrive
`registro-modifiche/` da solo), **la verifica automatica del gioco su GitHub**, l'arbitro
globale degli eventi, il nuovo avvio con slot e difficoltà, **il carcere giocato davvero**, il
menu di sistema, la mappa con quartieri e luce dinamica. Alessio trasforma la palestra da
pulsante a sistema e separa il guardaroba dal negozio. Carletto porta la classifica vera nella
schermata e fa dello **Studio una stanza sua**, con dentro la gente della Sala.

**Giovedì 4.** Pulizia: via la vecchia schermata di gioco, via il quaderno, via i quattro
bottoni doppioni; 35 MB di media fuori dal pacchetto. Lo Shop smette di essere un menu e
diventa uno shop. Le card della mappa diventano tutte uguali.

**Venerdì 5.** Mycol integra **il creator RPG** e l'intro della carriera, con l'avatar
Avaturn nel camerino. Entra **l'albero delle abilità**, a tutto schermo. Nascono le pagine di
servizio — avvio, rotto, salvataggio illeggibile, server giù, 404.

**Sabato 6.** Landing, accesso e gioco diventano tre pagine. Mycol costruisce **l'architettura
audio centrale** con un player che resta acceso fra le schermate. Alessio fa la battle di
freestyle esclusiva, il tetto d'hype per fase, e mette fine al farm infinito della chat. Il
telefono prende la home e la scocca della foto di riferimento, tasti compresi. Sulla mappa le
zone da toccare diventano la sagoma degli edifici.

**Domenica 7.** Alessio trasforma le Statistiche in **un diario di bordo** della carriera. Il
server impara a stare al passo col gioco, coi bot credibili. Lo Studio prende le sette sezioni
e l'aspetto del riferimento, dettaglio per dettaglio. E il giorno delle regole: il principio
«zero dipendenze» lascia il posto a una regola vera, nascono `CLAUDE.md` e la roadmap del
cantiere, e **2,8 GB di dataset degli avatar escono dalla storia di git**. Mycol apre un
filone tutto suo: **la bibbia di FAME** e la grammatica della trap — il motore che un giorno
dovrà generare i beat.

### Settimana due — lo Studio come nelle foto, e FAME Neural corre

**Lunedì 8. Cinquantanove commit.** Lo Studio viene ricostruito sugli elementi delle foto di
riferimento, le take si confrontano, e un giro su tutti i fogli di stile mette ogni effetto
«al passaggio del mouse» dove un dito non lo accende per sbaglio. La Strada si impila sul
telefono. Mycol porta **il camerino MakeHuman dentro al gioco** e, nello stesso giorno, fa
correre FAME Neural dalla fase 2 alla fase 6: corpus MIDI, audit del dataset, annotazioni
musicali, benchmark delle rappresentazioni, prime baseline. E automatizza la roadmap: un
sistema che legge le richieste nuove, cerca doppioni e cose già fatte, e controlla lo stato
dichiarato contro il codice vero.

**Martedì 9 – venerdì 12.** Il camerino si stabilizza fra i browser, la foto profilo diventa
uguale su ogni dispositivo, tornano i **quattordici preset personaggio**. Il salvataggio
smette di sovrascrivere gli slot per sbaglio. Nascono **la FAMEpedia** sulla landing, il
salvataggio e il ripristino dal cloud dentro l'interfaccia, lo stato della connessione, i
nomi e le città casuali. Alessio aggiusta il turno in fabbrica (otto ore, non una) e mette il
tasto per spegnere la musica. Il backend prende `jose` e `zod`, il frontend ESLint, Vitest e
Playwright. FAME Neural chiude la fase 7A e comincia a lavorare sui **beat nostri**,
trasformando audio in MIDI con reference ascoltate a orecchio.

**Sabato 13 – domenica 14.** Il gate di verifica comincia a far girare prove vere — e trova
subito l'avvio rapido rotto. Lo Studio passa sette ritocchi uno dopo l'altro: il fonico si
sceglie anche al Mix, il Marketing spinge **un** pezzo e non tutto, un pezzo non uscito si fa
uscire in anteprima. Poi la domanda grossa: e se Cover, Feat e Marketing uscissero dallo
Studio? Il brainstorming si scrive, e la risposta arriva il giorno dopo.

### Settimana tre — lo Studio a cinque linguette, e il weekend dei cinquecento commit

**Lunedì 15.** **Lo Studio a cinque linguette.** Il Marketing va sul telefono, in LaFamegram
(«Che post fai?»); il feat sta in Cabina accanto al fonico e conta davvero sul pezzo; la
copertina sta nell'Uscita e pesa sugli ascolti della prima settimana; si lavora un pezzo alla
volta. Nasce **Sputa**. L'energia si spende per fare la take, mai per tenerla. E il telefono,
sugli schermi piccoli, si alza a schermo pieno da un tasto.

**Martedì 16 – mercoledì 17.** Il primo video di transizione, quello dello Studio. I fogli
dei punti si possono salvare anche da `main`. Il Marketing diventa una campagna in fasi —
teaser, annuncio, snippet, drop, dopo l'uscita — con «l'attesa del singolo» separata
dall'hype, tutto scritto prima come prova e poi come codice.

**Giovedì 18.** Silenzio.

**Venerdì 19.** Casa, Palestra, Live Club e «stacca la spina» diventano pagine sulla loro
foto. L'avvio rapido diventa **«Preparo il tuo artista»**, con le fasi vere a schermo.

**Sabato 20. Centotrenta commit.** Le quattro piccole (agenda, prezzi dei beat per fama del
beatmaker, tutti i parametri a 1 in partenza, dal lavoro non ci si licenzia — lo perdi se non
ti presenti). La plancia che si stringe per gradi, provata con un banco automatico su venti
schermate e sedici misure, dal telefono al 1920×1080: nessuna scorre di lato. Tutte le
transizioni video collegate. Lo Shop apre il reparto Vestiti sui capi del camerino. Avaturn e
MakeHuman confermati «50/50», come chiesto. Intanto FAME Neural chiude la valutazione R6,
promuove l'Audio Analysis V2, e mette in fila **separazione delle tracce** (HTDemucs) e
**trascrizione Audio→MIDI**, ognuna con i suoi controlli tecnici e la sua review a orecchio,
fino a «8 su 8».

**Domenica 21. Centonovantuno commit, il giorno più pieno del mese.** Alla Sala parlare con la
gente non costa più energia; la take costa 25 invece di 45. Lo Shop diventa quello che è oggi:
solo vestiti, coi filtri, lo stile che pesa, i capi che si sbloccano, le offerte del lunedì. Si
chiudono le tre code dello Studio (l'omonimo della classifica, il posto rubato alla Sala, la
copertina orfana). Arrivano **remastered e parti 2**, dalla Discografia allo Studio. Le
linguette dello Studio restano aperte sempre. FAME Neural fa 154 commit: Basic Pitch montato,
congelato e verificato, e la prima valutazione indipendente su dodici beat mai visti.

### Settimana quattro — il laboratorio e il collaudo

**Lunedì 22.** Il verdetto della valutazione indipendente è onesto: **il basso passa** (10
beat su 12 sopra la soglia), **la batteria no** (8 su 12, ne servivano 9). Invece di forzare,
FAME Neural fa quello che fanno i laboratori seri: scrive l'analisi del fallimento e riparte
dai casi facili. Snare scambiati per charleston, colpi simultanei che il modello non sa
rappresentare. Tre candidati provati e scartati con il loro perché, poi un modello già
addestrato (Tsumugi) che passa i controlli di preparazione.

**Martedì 23 – mercoledì 24.** Nasce **la rete di agenti locali**: modelli che girano sul PC
(Ollama, gpt-oss) e fanno controllo di qualità sulle prove di FAME Neural, ognuno legato alle
sue evidenze. Tsumugi viene scelto come candidato per la batteria. Poi il confronto che
decide: la rete a più stadi fa 3 su 6 e ci mette quasi quattro volte tanto; il modello da solo
fa 6 su 6. **Stop all'espansione multi-agente**, scritto e motivato, e si apre la sfida fra
modelli di base.

**Giovedì 25 – venerdì 26.** Quasi silenzio: le impostazioni e i bersagli da toccare sotto i
44 punti, sistemati per il telefono.

**Sabato 27. Il collaudo di un anno.** Un giro di controllo su tutto il repository con **un
anno di gioco simulato**: otto problemi veri, qualcuno di quelli che bloccano una partita. Tutti
chiusi in giornata, uno per branch, ognuno con la sua prova: il salvataggio che non si completa
negli oggetti annidati, il salto del tempo che resta acceso se la chiusura va in errore, il
contratto rescisso in carcere, l'evento importante coperto da un'altra finestra, il diario che
scriveva «1 giorno saltato». Sul telefono il Foglio va a capo, la mappa dice che continua a
destra, l'orologio sta sotto le finestre. Mycol, lo stesso giorno, sistema lo skip dai luoghi
che controllano il tempo.

**Domenica 28 – lunedì 29.** Otto ore di salto passano da 11,8 a **2,2 secondi**. Nello
Studio si possono fare solo Beat, Testo e Cabina e lasciare il resto al gioco, pagandolo in
qualità. E su LaFamegram, finalmente, **posta anche la gente**: i rivali e chi hai conosciuto
alla Sala.

---

## Chi ha fatto cosa

Un mese così non l'ha fatto una persona sola, e si vede aprendo il gioco.

**Alessio** ha dato al gioco il suo mondo. L'iPhone con LaFamegram, la Strada, la Pizzeria e
la Fabbrica, la palestra come sistema, i quaranta dialoghi della Sala, le 156 scene dei fan,
gli incontri per strada con opp e giornalisti, la battle di freestyle, il diario di bordo. E
tante sue richieste sono diventate codice dopo: i prezzi dei beat realistici, la partenza con
tutti i parametri a 1, Avaturn e MakeHuman che convivono.

**Mycol** ha dato al gioco il suo motore. Il tempo che scorre, gli eventi v2 e l'arbitro che
li mette in fila, il meteo e la luce, il carcere, il creator e il camerino MakeHuman coi preset,
la FAMEpedia, il cloud dall'interfaccia, l'architettura audio. E la macchina che tiene in
ordine il cantiere: la verifica automatica su GitHub, il bot del registro modifiche, la roadmap
che si controlla da sola. Più FAME Neural, che è un progetto dentro al progetto.

**Carletto** ha tenuto il filo: il server e la classifica unica, lo Studio dalla prima
all'ultima linguetta, la plancia e la mappa, il telefono sugli schermi piccoli, le regole di
lavoro, i giri di controllo.

E **Claude** ha scritto codice e documenti accanto a tutti e tre.

---

## FAME Neural, detto semplice

L'idea è in una riga della sua bibbia: *generare beat completi e credibili anche per giocatori
che non sanno nulla di produzione musicale.* Genere, mood, energia, un prompt, «Genera beat».

Per arrivarci serve un modello che conosca la musica, e per addestrarlo servono beat scritti
in note. Il lavoro di settembre è stato costruire quella materia prima **in modo pulito**: beat
di cui abbiamo i diritti, separati in tracce, trascritti in MIDI, ascoltati a orecchio,
con ogni passaggio congelato e verificabile. È lento apposta: niente dati presi a caso, niente
risultati gonfiati.

Oggi: il **basso** si trascrive bene, la **batteria** non ancora, e c'è un candidato serio
(Tsumugi) pronto per la prossima prova. FAME Neural vive su un branch suo e **nel gioco non è
ancora entrato**: lo Studio oggi vende beat fatti. Il giorno in cui «te lo fa una persona»
diventa «te lo fa FAME», le due metà del progetto si toccano.

---

## Dove siamo arrivati

Il gioco è pensato in tappe. Questa è la fotografia di oggi.

| | tappa | stato |
| --- | --- | --- |
| A | La base: avatar, tempo, menu, barre, beat, classifica | ✅ fatta |
| B | La città di provincia come mappa | ✅ fatta, si rifinisce |
| C | L'economia della carriera: hype, energia, livelli | 🔶 a buon punto |
| D | Fare un pezzo come catena di scelte (la TRACK) | 🔶 a buon punto: manca l'editor di copertine «stile emblema» |
| E | Il mondo vivo: opps, produttori con un carattere | 🔶 cominciata |
| F | **Milano** | ⬜ da fare |
| G | Il gioco sul telefono | 🔶 fatta nel browser a sedici misure, manca la prova in mano |
| H | **Los Angeles** | ⬜ da fare |
| I | L'uscita su Steam e sugli store | 🔶 tre lavori su cinque |

**Per uscire mancano**, in ordine di peso: la prova su un telefono vero; il salvataggio
agganciato al cloud (il ponte c'è, la chiamata no); il guscio nativo, Electron per Steam e
Capacitor per il telefono; le chiavi degli store; la settimana calcolata dal server e non dal
dispositivo; e decidere come arriva il camerino MakeHuman — il suo dataset pesa 2,8 GB e oggi
resta fuori dal pacchetto.

**Il cantiere è in ordine.** Ogni lavoro nasce su un branch suo, passa da una verifica che fa
girare le prove e un audit che si accorge se sparisce qualcosa, e prima del push lo guardano
due agenti di controllo. Il registro delle modifiche si scrive da solo.

---

## Le cose che aspettano

Alcune voci del foglio dei punti non sono lavori: sono **decisioni**, e alcune hanno un nome
sopra. Sono lì, scritte così, da qualche settimana.

**Sul gioco**

- **La TRACK prima di Milano?** Nella roadmap c'è scritto *«da confermare con Alessio»*: è una
  proposta, non una decisione presa. Costruire Milano sul motore vecchio vorrebbe dire rifarla.
- **I rapporti coi beatmaker che vanno sotto zero.** Oggi puoi offenderli quanto vuoi e il
  rapporto resta uguale. A −1 cosa succede — non ti vende più? ti fa pagare di più?
- **Lo Shop in provincia**: cosa *non* si vende nella prima città.
- **Il pub e la pubblicità** come primo modo di fare hype: oggi non esistono.
- **Le card sulla mappa** troppo vicine e i pulsanti troppo grandi: si giudicano a occhio.
- **La troupe** (manager, social media manager, videomaker personale), **i collettivi** di
  rapper, **il joint album** su chiamata di un produttore, **la legacy**: regole nuove da
  scrivere prima di farle.

**Sul motore**

- **Come arriva MakeHuman a chi installa il gioco**: pacchetto ridotto, download al primo
  avvio o dataset intero. E il progetto Avaturn nostro, che oggi gira sul demo pubblico.
- **FAME Neural dentro allo Studio**: quando, e in che forma — anche una prima versione
  piccola, un genere solo.
- **La pagina di Mycol** e «il tuo artista» sulla landing.

**Sull'uscita**

- Se il gioco sugli store gira anche **in orizzontale**.
- Milano e Los Angeles: la concept art c'è, il mondo no.

---

## Per chi vuole rimettere le mani nel gioco

Ci vogliono dieci minuti.

```bash
git pull
cd frontend && npm install && npm run dev     # → http://localhost:8000
```

Poi tre letture, in quest'ordine:

1. [`CLAUDE.md`](../CLAUDE.md) — le regole di casa in una pagina: un branch per lavoro, la
   verifica prima di chiudere.
2. [`implementazioni/implementazioni.md`](../implementazioni/implementazioni.md) — in testa
   c'è «Da fare adesso, in ordine»: cosa c'è aperto e da dove si parte.
3. [`documentazione/roadmap.md`](roadmap.md) — le tappe, con cosa c'è già e cosa manca.

Un punto nuovo si scrive nel foglio anche di corsa, una riga basta.

---

*Ricostruito il 29/09/2026 dalla storia di git, dai fogli dei punti, dalla roadmap e dai
documenti di FAME Neural.*
