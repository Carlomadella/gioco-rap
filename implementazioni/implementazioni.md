quando finisci una task committa e pusha e nel committ fai riferimento al punto del file completato. Se vedi che viene modificato il file non preoccuparti, sono io, tu continua con quello che stai facendo, ogni volta che finisci un task segnalo come completato

# Punti nuovi

**Scrivi qui.** Questo è il foglio dove si butta l'idea appena viene, senza pensare a dove
va: un punto, una riga, anche di corsa. Poi si sposta nel file dell'argomento giusto, con
sotto scritto cosa è stato fatto.

I punti di prima — tutti e sessantasette — stanno nella cartella
**[`implementazioni/`](README.md)**, divisi per argomento:

|                                                                | argomento                                       |
| -------------------------------------------------------------- | ----------------------------------------------- |
| [`00-come-si-lavora.md`](00-come-si-lavora.md)                 | le regole di lavoro                             |
| [`01-mappa-e-citta.md`](01-mappa-e-citta.md)                   | la plancia, la mappa, le tre città              |
| [`02-interfaccia-e-telefono.md`](02-interfaccia-e-telefono.md) | schermate, navigazione, il telefono, il negozio |
| [`03-artista-e-avatar.md`](03-artista-e-avatar.md)             | la faccia, i vestiti, chi sei                   |
| [`04-musica-e-suoni.md`](04-musica-e-suoni.md)                 | barre, beat, freestyle, come suona              |
| [`05-carriera-e-tempo.md`](05-carriera-e-tempo.md)             | energia, giornate, livelli, salvataggi          |
| [`06-mondo-e-personaggi.md`](06-mondo-e-personaggi.md)         | La Sala, i contatti, gli opps, la strada        |
| [`07-multiplayer-e-backend.md`](07-multiplayer-e-backend.md)   | la classifica vera, gli account, il cloud       |
| [`08-uscita-sugli-store.md`](08-uscita-sugli-store.md)         | Steam, App Store, Play Store                    |
| [`09-grafica-e-asset.md`](09-grafica-e-asset.md)               | ambientazioni, foto, branding                   |

L'indice con **tutti i punti e il loro stato** sta in
[`implementazioni/README.md`](README.md).

---

## Da smistare

_(qui sotto finiscono i punti nuovi, appena scritti)_

ALE:

1. Le chat nel cellulare allo stato attuale sono infinite e sempre ripetitive. Volendo noi potremmo looppare all'infinito di parlare con nostra madre e farmare il (+benessere) con la solita conversazione. Non va bene, noi vogliamo che sia tutto più realistico possibile. dobbiamo far avere conversazioni uniche ogni volta e soprattutto non possiamo sentire più di una volta al giorno la stessa persona, tutt'anzi le persone ci scriveranno sporadicamente Nel cellulare volendo

2. Rendi accessibile lo shop già dalla città iniziale, con limitazioni sui prodotti in vendita

3. i rapporti con i beatmaker non vanno mai in negativo, puoi offenderli quanto vuoi e il rapporto resta uguale

4. Ci sono i prezzi dei beat spropositati. Non ha senso che alcuni beat costino 700 euro al livello quattro. Facciamo prezzi realistici : da 100 a 250 euro beat da beatmaker emergenti , da 300 euro a 1000 per beatmaker affermati e da 1000 a 2000 per beatmaker famosissimi

5. Il giocatore parte con tutti i parametri a 1

6. Le azioni ripetibili che facevano farmare facilmente senza avere un gameplay dinamico troviamo un modo per limitarle realisticamente nella possibilità di eseguirla ; Ad esempio la battle di freestyle potremmo metterlo come 'Evento esclusivo' Una sola volta alla settimana e in un orario specifico.
   Inoltre, per aumentare la dinamicità, potremmo fare che NON tutti gli eventi danno gli stessi hype, soldi, fan.. dipende dall'importanza dell'evento stesso della settimana.

7. Verissima la cosa dell'hype, fattore che dev'essere davvero primario nel gioco e i player dovran costantemente provare a inseguire ma con tanta fatica, Partiamo proprio dallo sviluppo dell'hype :

L'hype è in scala internazionale, vuol dire che se sei al livello 100 è impossibile che tu sia ancora nel paesino di provincia.
Probabilmente all'inizio l'unico modo per fare hype è andare al pub e pubblicare sui social pubblicità per la tua musica (DA SVILUPPARE QUESTO) , ma più di tanto HYPE all'inizio non si può fare, quindi è impossibile che al primo anno rimanendo nella prima città tu diventi 100 di hype

Tutt'altro se non sei goat manco puoi averli 100 di hype

L'hype vero si inizierà a fare quando i tuoi numeri social andranno forte e nelle classifiche il tuo nome inizierà a farsi valere sempre di più, quando farai feat con nomi più grandi dei tuoi e i pezzi andranno bene, quando prendiamo una macchina importante e molto costosa e la flexiamo sui social

Insomma, come le cose che vanno davvero in hype IRL, non se fai un feat con pinko pallino a caso che nessuno conosce

8.

CARLO:

1. aggiungere la reputazione cioè quanto sei affidabile, il massimo è real/real oppure OG, e il minimo tipo figlio di troia quando ti comporti da figlio di troia (detto meglio) O TENERE SOLO LA FAMa

2. DA DISCUTERE aggiungere la legacy cioè quanto sei influente sulle generazioni future o più piccole di artisti

3. DA DISCUTERE Dopo aver completato milano ed essere diventato goat ed essere andato a los angeles il player può decidere se trasferirsi in un'altra città italiana o per forza a Los Angeles?

4. Non è più: "Faccio un pezzo → +10 fama", ma diventa:

TRACK
│
├── Beat
├── Producer
├── Studio
├── Mix
├── Master
├── Testo
├── Cover
├── Featuring
├── Marketing
└── Timing

E ogni elemento influenza il risultato.

Esempio:

"TUTTO O NIENTE"

Beat 82
Testo 76
Performance 91
Studio 74
Mix 68
Feature 85
Marketing 53
────────────────────
QUALITÀ 78

Poi:

QUALITÀ 78
HYPE 82
FAMA 31
NETWORK 64

→ 43.000 streams.

è possibile controllare come stanno andando le canzoni nel tempo da un'app del telefono per sapere se stanno invecchiando bene o male e magari farci delle remastered o parti 2 di una canzone o di un album

5. implementa le transizioni dentro al progetto, che partano cliccando sulla scheda collegata — studio, sala, ritorno a casa, stacca la spina, registra un pezzo
    Nel dettaglio: il primo video parte quando il player clicca sul luogo chiamato "studio", il
    secondo quando clicca su "sala", il terzo quando decide di tornare a "casa", il quarto su
    "stacca la spina", il quinto su "registra un pezzo".

6. togli il parametro «lucidità» e tutto ciò che ne consegue

7. dividi tutti i file .md sparsi in cartelle con nomi coerenti, inoltre smista le task fatte da implementazioni.md

8. gli eventi in basso sono cliccabili, e puoi segnarli nell'agenda, quando scatta l'ora o poco prima, arriva una notifica

9. possono verificarsi eventi settimanali, da segnare in agenda anche quelli e la matina del giorno stesso arriva la notifica

/_ PAGINA DI LANDING: _/

10. migliorare graficamente la schermata opzioni

11. creare una schermata per le classifiche che si apre anche dall'app del telefono

12. DA DISCUTERE collegare la pagina di mycol togliere la sezione il tuo artista dalla pagina di landing o , oltre che da nuova partita. e collegarla allo shop?

/_ NUOVE MODALITA' _/

Nelle cose da mettere dopo aver masterizzato il gioco, creiamo delle nuove modalità giocabili/DLC:

ESEMPI NUOVE MODALITA' DI GIOCO:

MODALITA' CARRIERA STUDIO:

- Il personaggio creato dall'utente è un rapper di uno studio e devi portare lo studio al top (es. La fame studio) e avere lo studio migliore contro altri studi gestiti da altri player attivi

MODALITA' A SCELTA DI CITTA' DI PARTENZA E LIBERA: puoi decidere in che città nascere e in base a quello hai pro o contro. Il player sceglie tra un numero di città predefinito e poi si può spostare in tutto il mondo (forse meno)

MODALITA' CON PIU' CITTA' FINALI: dopo esserti stabilizzato a Los Angeles e, dopo aver creato contatti con personaggi di altre città o che lavoro in altre città o inviti per telefono che ti ha fatto ricevere il manager sblocchi la possibilità di andare o trasferirti in altre città come:

- Chicago i crimini sono più facili ma c'è più criminalità/concorrenza ed è più difficile affermarsi
- Las vegas: per avere i casinò migliori e i locali top per massimizzare il lifestyle così puoi averlo al massimo e sbloccare un'altra cosa es. un titolo da esporre nella descrizione del profilo tipo: JOHN GOTTI
- Atlanta/New York: più focalizzata sul conoscere artisti famosi come 21 Savage, Future, Young Thug
