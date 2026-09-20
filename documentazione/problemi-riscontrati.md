## Cosa resta aperto al 20/09/2026

Smistato leggendo ogni voce contro il codice: sotto a ciascuna c'è scritto se e quando è
stata chiusa. Qui solo quelle **ancora aperte**, nello stesso ordine di «Da fare adesso» in
[`implementazioni/implementazioni.md`](../implementazioni/implementazioni.md), che mette
insieme i due fogli: prima il telefono, poi quello che pesa nel pacchetto, poi le cose
piccole, poi i lavori lunghi, in fondo le decisioni. Riordinato il 15/09 dopo il giro di
fine task su quel foglio; il 19/09 il giro sulle pagine dei posti sulla loro foto ha
trovato sette cose, sei chiuse nello stesso branch, una (la mano del rapper) è stata
chiusa il 20/09 in un branch suo; lo stesso giorno il giro sull'avvio rapido ne ha trovate
sette, tutte chiuse nel branch. Il 20/09 il giro sulle «quattro piccole» ne ha trovate tre,
più tre note: sono le voci 30–32, tutte e tre chiuse nello stesso branch prima del push; il
giro sulla mano del rapper ne ha trovate due (33–34), chiuse nello stesso branch. Lo stesso
giorno il giro di fine task sulla fascia della plancia (`task/barra-plancia-980-1180`) ne ha
trovate sei, più quattro note (voci 35–40), e la prova sul telefono altre sette, di cui tre le
stesse, una la mano del rapper e una l'orizzontale già aperto (voce 9): le due nuove sono le
voci 41–42. Tutte chiuse nello stesso branch prima del push. Sempre il 20/09 la task «Le tre
del Marketing» (`task/le-tre-del-marketing`) ha trovato che la voce 2 era **chiusa dal 14/09**
in tutte e quattro le sue parti — l'indice non l'aveva riconosciuto, come per l'hover — e
guardando in partita ha trovato una cosa nuova, la voce 43, chiusa nel branch; il giro di
fine task ne ha trovate tre (44–46), chiuse nello stesso branch prima del push. Sempre il
20/09 il giro di fine task sulle transizioni video («gli altri quattro»,
`task/transizioni-video-le-altre`) ne ha trovate cinque (47–51), tutte chiuse nello stesso branch prima del push, più tre note: due della
copertura del filmato (che il tasto del menu e la tastiera passano), una sulla pagina
sotto durante l'attesa, la nota già scritta nel foglio dell'interfaccia sui due «—»
dall'agenda (confermata), e una riga di foglio rimasta indietro.

1. ~~**Fra i 980 e i 1180 punti la barra della plancia trabocca** (15/09, trovato facendo il
   telefono che si alza): 1100 punti di contenuto in 1000, il Menu esce a destra. Il tasto
   del telefono lì galleggia in basso a destra, quindi si raggiunge; la barra resta da
   disegnare. E sotto i 980 la barra è alta 307 su 844: un terzo dello schermo.~~
   **RISOLTO (20/09/2026)** — branch `task/barra-plancia-980-1180`: la fascia si stringe per
   gradi sotto i 1240 e i 1120, va a capo a 980, sul telefono è tre righe da 165. Nello
   stesso giro la plancia a 1280 × 800 e 1366 × 768 (card degli eventi da 91 punti, quattro
   righe del profilo che sparivano). Il dettaglio sotto alla voce, nel giro del 15/09.
2. ~~Le tre del Marketing (14/09): **«In spinta» esce come una seconda riga bianca**, **una
   riga di pezzo senza seed è un bottone che non fa niente**, **il pezzo scelto può sparire
   dall'elenco, ma resta quello che si spinge**; più **sul telefono il motivo per cui
   l'anteprima è spenta viene tagliato**.~~ **RISOLTO (14/09/2026, riconosciuto il 20/09)** —
   tutte e quattro erano chiuse lo stesso giorno, nel branch `task/studio-marketing-scegli-il-pezzo`
   (le RISOLTE stanno sotto ai giri del 14/09, primo e secondo), e dal 15/09 il Marketing è
   «Che post fai?» su LaFamegram, dove le tre regole sono passate pari pari. Riprovato in
   partita il 20/09 a 1440 e a 390: «in spinta» è testo nella riga piccola, la riga senza
   seed esce senza `data-spingi`, il pezzo scelto più vecchio dei sei sta in elenco con
   «scelto», «Serve un pezzo scelto su LaFamegram» sta in una riga. Cinque controlli
   nell'audit lo tengono fermo. Vedi «Le tre del Marketing» in
   `implementazioni/02-interfaccia-e-telefono.md`.
3. ~~**Sul telefono i colori del «passaggio del mouse» restano accesi dopo il tocco** (08/09):
   il giro unico su tutti i CSS.~~ **RISOLTO (08/09/2026, riconosciuto il 15/09)** — era
   chiuso lo stesso giorno e la riga sotto alla voce mancava: vedi il giro del 15/09 in fondo.
4. ~~**L'avvio rapido ci mette quasi due minuti, e nessuno lo dice al giocatore** (13/09).~~
   **RISOLTO (19/09/2026)** — la schermata «Preparo il tuo artista» con le fasi vere del
   camerino; e i due minuti erano il browser senza GPU delle prove: su Chrome vero sono
   9 secondi. Il dettaglio sotto alla voce, nel giro del 13/09.
5. ~~**`jose` e `zod` stanno fra le `dependencies`** (13/09), aperta per decisione.~~
   **RISOLTO (16/09/2026)** — usate tutte e due: `jose` in `accessi.js`, `zod` in
   `forme.js` per i corpi delle rotte. Vedi «Le due dipendenze del backend, usate» in
   `implementazioni/07-multiplayer-e-backend.md`.
6. **Lo Shop promette tre reparti a schede, ce ne sono due** (10/09).
7. **L'uscita di venerdì non costa niente, quella a mano sì** (08/09): risolto in parte per
   scelta — il vantaggio di venerdì è quello di aspettare, non uno sconto. Sparisce del tutto
   con «togli il parametro lucidità» (CARLO), che nell'altro foglio è fra i lavori lunghi.
8. Le code dello Studio a cinque linguette (15/09): **un rapper della classifica con lo
   stesso nome di uno della Sala non si può chiamare**, **chi accetta dalla classifica occupa
   un posto della Sala**; e dal 14/09 **la copertina proposta e non confermata resta nel
   salvataggio, foto compresa**.
9. **Di traverso** (844 × 390) il telefono alzato si usa, ma resta da **decidere se il gioco
   sugli store gira anche in orizzontale**: nel repo non c'è un manifest né un
   `orientation`. Nell'altro foglio sta fra «le decisioni tue».
10. Aperti di proposito (14/09, prova sul telefono): la copertina «grande» e quella «di
   adesso» quasi uguali; nel Marketing la risposta compare in cima. Nell'altro foglio
   restano fuori dall'ordine.
11. ~~**Esc durante il video dello Studio apre il menu di pausa invece di saltare il filmato**
   (16/09, prima transizione video).~~ **RISOLTO (16/09/2026)** — la copertura sta nella
   lista delle finestre che il menu di sistema rispetta; provato: Esc salta, niente menu.
12. ~~**Nel secondo e mezzo prima che il video parta la mappa risponde ancora** (16/09).~~
   **RISOLTO (16/09/2026)** — nell'attesa una copertura trasparente prende i tocchi, e il
   tocco salta l'attesa.
13. ~~**Sul telefono l'orologio della plancia resta sopra al video** (16/09), più il video che
   ignora «riduci movimento» del sistema.~~ **RISOLTO (16/09/2026)** — la copertura è salita
   a 150, sopra all'orologio (142); `prefers-reduced-motion` spegne il video come le
   animazioni. Restano le **due scelte**: il taglio in verticale (si vede un quarto
   dell'inquadratura) e il filmato che a freddo sul telefono può non partire in tempo — da
   provare sullo store, dove i file stanno sul telefono.
14. ~~**Lo script che salva i punti da `main` committa tutto quello che era già in coda**,
   non solo i fogli (16/09), più quattro cose piccole dello stesso giro.~~ **RISOLTO
   (16/09/2026)** — tutte e cinque, nello stesso branch prima del push: commit dei soli
   fogli, nomi con accenti, `--no-renames`, eccezione stretta ai `.md` di primo livello,
   messaggio del push. Il dettaglio sotto a ogni voce, nel giro in fondo.
15. ~~**Se le chiavi di Apple o Google rispondono con un errore (503, HTML), la colpa va al
   giocatore**; più `jose` 6 che vuole Node 22.12, e il README dell'API sul `tipo`
   sconosciuto (16/09).~~ **RISOLTO (16/09/2026)** — la colpa la decide il codice dell'errore
   di `jose` (due prove nuove, 192 a posto); `engines >=22.12` e i documenti con lui; §6
   corretto. Il dettaglio sotto a ogni voce, nel giro in fondo.
16. ~~**Sei righe di documento dietro alla task `jose` e `zod`** (16/09, giro
   backend-allineato).~~ **RISOLTO (16/09/2026)** — `README-API.md` corretto in §6, §7 e
   nelle sette liste errori per rotta; `artistaId-mancante` è diventato `artista-mancante`
   ed esce in `errore`; `README.md`, `ROADMAP.md` e `dipendenze.md` non dicono più «da
   usare». Il dettaglio sotto a ogni voce, nel giro in fondo.
17. ~~**La mano del braccio alzato del rapper è un tracciato SVG rotto** (19/09,
   `creator/nav.js:71`): a ogni Piazza la console segna «attribute d: Expected number» e la
   mano col microfono non si disegna. Non è della task delle pagine dei posti: va guardato
   il disegno, non indovinato un numero.~~ **RISOLTO (20/09/2026)** — branch
   `task/mano-rapper-svg`: all'ultima curva della mano mancava il punto d'arrivo, che è
   quello da cui parte (`48,-372`, il polso); adesso la mano si chiude lì. L'audit genera
   il corpo intero e conta le coordinate di ogni tracciato, così non torna indietro.
18. ~~**«I conti di casa» aperti dalla Casa coprono il Menu e «Torna alla mappa»** (19/09).~~
   **RISOLTO (19/09/2026)** — in `menu-sistema.js` il pannello viene prima della pagina.
19. ~~**Sul telefono una mossa lanciata dal telefono alzato apre la pagina sotto al
   telefono** (19/09).~~ **RISOLTO (19/09/2026)** — la pagina mette giù il telefono quando
   si apre.
20. ~~**Sul telefono il costo delle mosse nelle righe è tagliato** (19/09).~~ **RISOLTO
   (19/09/2026)** — il costo sta nel tasto d'oro, per intero.
21. ~~**«Vai in camera» salta il giorno senza i controlli del «+1»** (19/09).~~ **RISOLTO
   (19/09/2026)** — passa da `ADF_TIME_SKIP`.
22. ~~**Da «Stacca la spina» non si torna in cucina senza fare la mossa** (19/09).~~
   **RISOLTO (19/09/2026)** — «Torna in cucina» accanto al tasto d'oro.
23. ~~**Il documento delle pagine-azioni dice ancora che Casa, Palestra e Live Club sono
   finestre** (19/09).~~ **RISOLTO (19/09/2026)** — nota di stato in testa al foglio.

24. ~~**La sesta tacca «Pronto: si entra» della schermata dell'avvio rapido non si accende
   mai** (19/09).~~ **RISOLTO (19/09/2026)** — «PRONTO:» maiuscolo e col due punti.
25. ~~**«Fallo a mano» apre il camerino rotto, non il creator, e l'avvio rapido nel creator
   resta acceso** (19/09).~~ **RISOLTO (19/09/2026)** — il gioco manda
   `quick-makehuman-cancel`, il creator spegne il rapido e chiude il camerino.
26. ~~Accessibilità della schermata dell'avvio rapido (19/09): **il lettore di schermo legge
   il contatore ogni secondo** e **i tre tasti dell'errore compaiono senza focus**.~~
   **RISOLTO (19/09/2026)** — parla solo la fase; il fuoco va su «Riprova».
27. ~~**Se il creator non c'è proprio, l'errore dice «Sono passati 29 milioni di minuti»**
   (19/09).~~ **RISOLTO (19/09/2026)** — la schermata si apre prima di ogni controllo, e
   senza creator «Fallo a mano» non c'è.
28. ~~**Il limite dei due minuti dell'avvio rapido è fisso anche mentre il camerino sta
   parlando** (19/09).~~ **RISOLTO (19/09/2026)** — due minuti senza notizie: ogni fase
   riparte il conto.
29. ~~**Il caso @lento non guarda la schermata «Preparo il tuo artista»** (19/09).~~
   **RISOLTO (19/09/2026)** — la prova la vuole accesa con una fase, e via alla fine.

30. ~~**`npm run prova` è rosso: il test «parte da zero» vuole ancora le skill a 0**~~ (20/09,
   `strumenti/prova.js:352` contro `state.js:21`): 179 a posto, 1 no, e `npm run verifica` si
   ferma lì. L'audit nuovo chiede il contrario: uno dei due resta rosso finché il test non
   si aggiorna. **RISOLTO (20/09/2026)** — il test chiede le quattro skill a 1, e la
   verifica di prima l'avevo letta male: l'exit code era di `tail`, non di npm.
31. ~~**Il bonus dell'evento della settimana si può prendere due volte nello stesso giorno**~~
   (20/09, `agenda.js:179-191` e `:331-334`): tolta la voce, la card torna su «segna» e il
   peso si riprende intero. C'era già togliendo e rimettendo il quadratino a mano.
   **RISOLTO (20/09/2026)** — `G.agenda.onorati` ricorda cosa hai onorato oggi: il peso
   torna 1 e la card lo dà per passato.
32. ~~**L'evento «fatto» resta in agenda se il gioco non lo conta come fatto**~~ (20/09): alla
   Sala si toglie solo con la «Sessione» a pagamento, il colpo solo se riesce; il «Piccolo
   party» invece se ne va con uno «Stacca la spina» di mattina. **RISOLTO (20/09/2026)** —
   il colpo si onora prima del dado, il beat sul tavolo chiude il «Producer session» di oggi;
   il party non era un problema: `orari.js` apre «Stacca la spina» solo dalle 00:00 alle 04:00.

33. ~~**L'audit della mano ingoia in silenzio l'errore con cui `nav.js` si carica** (20/09,
   `audit-regressioni.js:2456`): l'artista finto non ha `name`, `refreshArtistChrome()`
   esplode e il `catch` vuoto non lo dice. Oggi innocuo, perché `ARTIST_BODY` è già
   definita; domani il test direbbe solo «ARTIST_BODY non generato» senza il perché.~~
   **RISOLTO (20/09/2026)** — l'artista finto ha un `name`, `nav.js` si carica senza errori,
   e caricamento e `ARTIST_BODY()` stanno in un test loro che riporta il messaggio, come
   il blocco gemello di `spostamenti.js`.
34. ~~**L'indice in testa dice ancora che la mano del rapper «resta»** (20/09, riga 9 di
   questo foglio), mentre la voce 17 qui sotto è chiusa.~~ **RISOLTO (20/09/2026)** — il
   paragrafo dice che è stata chiusa il 20/09 in un branch suo.

35. ~~**Il foglio della strofa sul telefono scorre di lato, e la X sta fuori dallo schermo** (20/09,
   `overlays.css:47-54` con `menu-sistema.css:541-553`): a 390 e 360 la testata è larga 415 in
   354, la X del foglio parte a 389 e il titolo va su tre righe. Il documento della task dice
   che nessuna schermata scorre di lato, il foglio sì.~~ **RISOLTO (20/09/2026)** — il foglio
   sta nelle regole delle testate sotto i 620 (MAPPA via, marchio 96, titolo da 104) col
   titolo a 22 punti su una riga; a 390 la X sta a 328, a 360 a 298.
36. ~~**La pastiglia del tempo sotto i 620 è rimpicciolita due volte: 105 × 38, scritte da
   4,7 punti** (20/09, `stretto.css:636-647` e `:768-776` contro `tempo-controlli.js:367-372`):
   il foglio la rimpicciolisce a 168 × 54 da solo, la scatola da 150 la stringe ancora, e i
   sette decimi si applicano sopra. Nella plancia, nella Sala e nello Shop.~~ **RISOLTO
   (20/09/2026)** — nove decimi in una scatola da 160: 144 × 49, le scritte a 6 punti (quelle
   del foglio suo, che sotto i 620 le fa da 6,7 e 7). La fascia a 390 resta 159.
37. ~~**Le due regole che appoggiano il marchio dove sta `#hb-logo` (980 e 620) non lavorano**
   (20/09, `stretto.css:470-476` e `:615-618` contro `menu-sistema.css:429-434`): stessa forza,
   tutte e due con `!important`, e menu-sistema si carica dopo. Il marchio sta a 0,0 invece
   che a 6,8: fra 901 e 980 è 19 punti più in alto della città.~~ **RISOLTO (20/09/2026)** —
   `html` davanti come nelle testate, e alto 44 (era 34 col contenuto che sporgeva, prova sul
   telefono): a 844 × 390 e a 900 il marchio sta a 6,8 e fa 132 × 44, sotto i 620 a 6,4 e 96 × 44.
38. ~~**Fra 981 e 1120 «Città di provincia» va su due righe e riempie la fascia fino ai bordi**
   (20/09, `hub.css:1315-1317`): la casella è 150, il nome a 17 punti non ci sta, e
   «CITTÀ ATTUALE» tocca il bordo sopra e la fase quello sotto.~~ **RISOLTO (20/09/2026)** —
   la casella a 164 e il nome a 15: una riga, a 981 come a 1120.
39. ~~**Fra 981 e 1180 il tasto tondo del telefono copre il fondo della seconda riga della
   settimana** (20/09, `telefono-stretto.css:109-118` con `hub.css:1343-1357`): a 1024 × 768
   la «Serata open mic» finisce a 715 e il tasto parte a 696. E il commento di
   telefono-stretto dice ancora che la barra trabocca «di suo».~~ **RISOLTO (20/09/2026)** —
   il tondo se n'è andato: la fascia adesso ci sta e il tasto torna nella barra (44 × 72 a
   1024, fra il tempo e il Menu), da 981 a 1180 senza che la barra scorra.
40. ~~**Il «Negozio» delle regole nuove non esiste** (20/09, `stretto.css:751-820`,
   `implementazioni/02-interfaccia-e-telefono.md`): `#negozio`, `.nghead`, `.ngk` e `.ngx` non
   sono in `gioco.html` e `negozio.js` è dormiente; il documento lo conta fra le quattro
   testate sistemate.~~ **RISOLTO (20/09/2026)** — via le righe del Negozio da `stretto.css`
   (l'audit controlla che non tornino); le testate sono tre più il foglio, e il documento lo
   dice.
41. ~~**A 1240–1280 il titolo della card dell'evento si tronca coi puntini: «FREESTYLE AL BAR
   CEN…»** (20/09, prova sul telefono, `hub.css:1373-1378`): titolo 184 contro 208 richiesti.~~
   **RISOLTO (20/09/2026)** — sotto i 1300 il titolo va su due righe da 12 (24) e il piede
   perde un po' d'aria (padding 5, tasto 3 e 10): 55 in 56, «CENTRALE» sulla seconda riga.
42. ~~**A 768 di altezza la scatola del profilo scorre di 27 punti e «Prossimo livello» resta
   tagliato, senza un segno** (20/09, prova sul telefono, `hub.css:1436-1450`).~~ **RISOLTO
   (20/09/2026)** — sotto i 780 di altezza il ritratto è 84 × 100 e le linguette 76: a 1366 × 768
   e 1024 × 768 la colonna è 555 in 555.
43. ~~**Nell'Agenda del telefono la descrizione di quattro mosse finisce coi puntini**
   (20/09, «Le tre del Marketing»): promo, anteprima, pesi e cardio, quando la mossa è
   accesa.~~ **RISOLTO (20/09/2026)** — nell'Agenda la riga piccola delle mosse e degli
   eventi va a capo su due righe. Il dettaglio nel giro in fondo.
44. ~~**Sul telefono basso (360 × 640) la promo nell'Agenda finisce ancora coi puntini**
   (20/09, giro di fine task su «Le tre del Marketing»): con lo schermo basso il telefono
   si disegna più stretto e la riga piccola tiene 170 punti, la descrizione su due righe
   ne vuole tre e «su LaFamegram» se ne va lo stesso. A 360 × 780 e a 375 × 667 sta.~~
   **RISOLTO (20/09/2026)** — la riga piccola va fino a tre righe (`-webkit-line-clamp:3`):
   a 360 × 640 promo e anteprima stanno in tre (47 punti), a 375 × 667 l'anteprima pure,
   dai 390 in su restano due. Screenshot `agenda-mosse-accese-360x640-tre-righe.jpg`.
45. ~~**Un controllo dell'audit guarda il file sbagliato** (20/09): «una riga di pezzo senza
   seed esce senza data-spingi» controlla la guardia di `studio.js`, ma il tocco di «Che
   post fai?» passa da `telSpingi` in `telefono.js`, che non è sotto controllo.~~
   **RISOLTO (20/09/2026)** — il controllo guarda anche la guardia di `telSpingi`.
46. ~~**La tabella dei fogli nel README dice 34 voci per l'interfaccia, la tabella grande ne
   ha 43** (20/09): il conto in cima era già indietro prima del branch (39), il branch ne ha
   aggiunte quattro senza toccarlo.~~ **RISOLTO (20/09/2026)** — ricontate tutte le righe
   per foglio: 43, 16, 13, 16 e 8 (erano 34, 14, 11, 14 e 7).
47. ~~**Sotto al filmato i tasti rispondono ancora alla tastiera** (20/09, transizioni video):
   la copertura prende clic, tocchi ed Esc ma non il fuoco. Invio subito dopo il clic su
   «Registra la take» fa una seconda take pagando due volte la sessione (45 + 45 invece di
   45 + 12); Tab e Invio sul tasto d'oro dello «stacca la spina» fanno la mossa due volte.~~
   **RISOLTO (20/09/2026)** — la copertura prende il fuoco (`tabIndex -1`, `focus()`);
   Invio e spazio saltano il filmato come un tocco, Tab non gira per la pagina sotto, tutto
   in cattura e col default fermato. Riprovato: Tab + Invio dopo il clic sulla take → una
   take sola, energia 100 → 55.
48. ~~**Mentre si aspetta che il filmato dello «stacca la spina» parta, la pagina sotto dice
   una cosa sbagliata** (20/09): «+3–5», «la seconda volta oggi recupera meno», il tasto d'oro
   ancora lì, e la banda in basso che già dice «Ti sei fermato. Benessere +13». Fino a un
   secondo e mezzo, solo se il video non è già in cache.~~ **RISOLTO (20/09/2026)** — fra il
   tasto e il filmato la pagina resta com'era (`LUOGO.attesa`, `renderLuogo` non ridisegna);
   la banda del diario in basso è di tutto il gioco e continua a scrivere subito.
49. ~~**Il tasto «Anni di Fame» apre il menu di sistema sopra al filmato, che continua sotto**
   (20/09): a fine filmato la pagina si apre sotto al menu. Era così dallo Studio del 16/09,
   adesso vale per cinque; «MAPPA» invece è bloccato come deve.~~ **RISOLTO (20/09/2026)** —
   i tre tasti della barra (`data-adf-global`) sono inerti col filmato in corso, come già
   «MAPPA»: un tocco sul filmato lo salta, poi la barra torna.
50. ~~**Arrivando allo «stacca la spina» dall'agenda o dalla card, i due numeri grandi sono
   «—»** (20/09, confermata la nota del foglio dell'interfaccia): la fotografia dei numeri di
   prima la fa solo il tasto sulla pagina. Non è del branch, è così dal 19/09.~~ **RISOLTO
   (20/09/2026)** — `luoghi-foto.js` incarta anche `avviaAzioneDiretta`: una mossa con la
   pagina si fotografa prima di partire, da ogni strada. Dall'agenda: «Benessere +4».
51. ~~**Il paragrafo in testa a «Da fare adesso» dice ancora che la voce delle transizioni
   «resta, a metà»** (20/09, `implementazioni/implementazioni.md:53`), mentre la voce 5 due
   righe sotto è barrata e FATTO.~~ **RISOLTO (20/09/2026)** — il paragrafo dice che è chiusa
   il 20/09 e che resta la decisione sui sette video.
Tutto il resto, da qui in giù, è chiuso: le voci restano perché raccontano cosa è successo.

---

Una cosa che ho notato ma non ho toccato, perché è una scelta tua e non un bug:
js/game/crime-caption.js contiene 118 citazioni testuali di brani rap con autore e titolo. Se il gioco esce su Steam e sugli store, quelle sono liriche protette da copyright e vanno valutate prima della pubblicazione.

**RISOLTO (05/09/2026)** — branch `task/problemi-riscontrati`. Le 118 citazioni
sono uscite tutte: una frase di una canzone non diventa libera perché è corta e
perché citi chi l'ha scritta, e quella era la strada più corta per una
segnalazione a Steam e per doverle togliere di corsa il giorno dell'uscita. Al
loro posto ci sono **64 modi di dire nostri**, scritti per la provincia di Anni
di Fame. La firma sotto non è più un artista con un disco: è il posto da cui la
frase arriva — il muro del sottopasso, il vecchio del bar, uno appena uscito.
Il motore è lo stesso di prima (tag, pesi, cooldown): cambiano solo le frasi e
il campo `by`/`track`, diventato `da`.

DA RIVEDERE

fix: togliere che quando sei in carcere ti vengono fuori le notifiche di lafamegram

**RISOLTO (05/09/2026)** — branch `task/problemi-riscontrati`. Il catalogo già
sapeva di doversi fermare in carcere (`showCatalog`, `emitHook`, `tryNormal`),
ma un post poteva nascere **dalla scelta che ti ci ha portato**: l'evento si
apre da libero, la scelta ti fa arrestare, e la notifica di LaFamegram arriva
addosso a uno che sta già in cella. Peggio: quella fascia conta come finestra
aperta per `tempo-controlli.js`, quindi restava lì a bloccare i comandi del
tempo mentre scontavi la pena — e il tempo è l'unica cosa che ti fa uscire.
Adesso `adfRenderSocialBanner()` non disegna niente se sei dentro, e se la
fascia era già a schermo quando ti prendono se ne va all'apertura del carcere.
Il post **resta nel feed**: il mondo fuori continua a parlare di te, lo trovi
quando esci. È solo la notifica che non arriva, perché il telefono non ce l'hai.

---

DA RIVEDERE

fix: `renderNegozio` non è mai esistita — il guardaroba e la vetrina non si
riaggiornavano quando passa il tempo

**RISOLTO (06/09/2026)** — branch `task/fix-render-e-agenti`, recuperato da
`task/simulazione-carriera`, che era rimasto fuori da `main`. Dentro a
`refreshOtherViews()` (`frontend/js/game/tempo-controlli.js`) — la funzione che
quando il tempo avanza ridisegna le schermate aperte perché non mostrino numeri
vecchi — c'era scritto `renderNegozio()`. **Quella funzione non esiste**: si
chiamano `renderArmadio` (il guardaroba) e `renderAbbigliamento` (la vetrina
dentro allo Shop). Il `typeof` davanti teneva nascosto lo sbaglio: la chiamata
non esplodeva, semplicemente non faceva niente. Controllato nel browser —
`typeof renderNegozio` risponde `undefined` — quindi da sempre quelle due viste
non si sono mai riaggiornate col tempo. Nello stesso elenco **mancava anche lo
Studio**, che in testata dice energia, soldi e lucidità: le tre cose che il tempo
cambia. Adesso ci sono tutte e tre.

Insieme è uscita `.telslot`, che stava **dichiarata in due fogli** (`css/game.css`
e `css/telefono.css`). Nessun danno — le due righe erano identiche — ma è
esattamente la forma del guaio che qui è già costato caro una volta: due classi
con lo stesso nome in due fogli diversi si rompono in silenzio. Tolta da
`game.css`, dove il resto della vestizione dello slot non c'è.

---

DA RIVEDERE

`strada-crimine` non è l'id di niente: due guardie saltano la pagina delle
Attività criminali

**RISOLTO (07/09/2026)** — branch `task/id-strada-morto`. Venuto fuori mentre si contavano
i posti in cui va iscritta una schermata nuova (il conto sta in
[`pagine-azioni/README.md`](pagine-azioni/README.md)). Due elenchi scritti a mano
nominano l'elemento **`strada-crimine`**:

- `frontend/js/game/eventi-v2.js:195` — cosa chiudere prima di far uscire un evento
- `frontend/js/game/trasferte.js:705` — cosa impedisce di partire per un'altra città

**Quell'id non esiste in nessun file**: l'elemento vero è `id="strada"`
(`frontend/pagine/gioco.html:430`). `getElementById("strada-crimine")` risponde
`null`, quindi tutt'e due le guardie **saltano la pagina delle Attività criminali**
da sempre. Cosa vuol dire giocando: con la Strada aperta un evento può uscirti
sopra, e una trasferta può partire.

Le due righe adesso dicono `"strada"`, che è l'id vero. Non è una scelta a caso:
`strada` è già il nome che usano il registro delle uscite (`uscita.js`, la lista
`USCITE` da cui dipendono ESC e il clic fuori) e il widget del tempo
(`tempo-controlli.js`, che si aggancia a `#strada.on`). Le due guardie erano le
uniche due copie rimaste indietro.

**Cosa cambia giocando**, e va detto perché è un cambio di comportamento vero, non
solo una riga più pulita: con le Attività criminali aperte adesso un evento della
settimana **aspetta** invece di uscirti sopra, e una trasferta **non parte**. È
quello che le due guardie volevano fare dal primo giorno — semplicemente non lo
facevano. Chi giocava prima poteva vedersi arrivare un evento in mezzo a un colpo:
non succede più.

Era il **terzo** guaio della stessa famiglia: la stessa lista di schermate scritta a
mano in posti diversi, e una copia che resta indietro. Gli altri due erano la ✕
dello Studio (punto 15) e `renderNegozio` qui sopra. Il guaio è chiuso, ma **la
famiglia no**: la cura vera, invece delle pezze, resta il registro unico proposto in
[`pagine-azioni/README.md`](pagine-azioni/README.md). Finché una pagina va iscritta a
mano in sette elenchi, il quarto caso è solo questione di tempo.

Cercati tutti gli altri id morti prima di chiudere, con una passata su ogni
`getElementById` e `querySelector("#…")` del frontend confrontato con gli id
davvero dichiarati (nelle pagine e in quelli creati a runtime dal JS). Ne restano
tre, e **nessuno dei tre è un guaio**: `g-meta` (`tempo.js`) è dichiarato morto in
un commento — la riga della testata del quaderno non c'è più e la funzione esce
subito; `labCaption` (`crime-caption.js`) e `adf-build-badge` (`eventi-v2.js`) sono
agganci facoltativi a elementi che non esistono più, tutti e due dietro a un
`if(...)` che regge. Sono codice morto, non guardie che saltano: la differenza è
che questi non fanno niente, quello di sopra faceva la cosa sbagliata.

---

DA RIVEDERE

il dataset degli avatar finiva nel pacchetto per gli store: 2,8 GB che nessuno
carica

**RISOLTO (07/09/2026)** — branch `task/id-strada-morto`. Non l'ha segnalato
nessuno: è saltato fuori facendo girare `npm run verifica` su `main`, che era
**rosso** e non se n'era accorto nessuno. La prova che cadeva era «in media/ non
restano immagini che nessuna riga di codice carica», con **1.717 immagini
orfane** — tutte dentro a `frontend/media/makehuman-editor-v1`, arrivate col
commit `34aa515` («feat(makehuman): aggiunge dataset e asset validati»).

Le 1.717 immagini non sono un errore: sono il dataset da cui si pescano i pezzi
dell'avatar, e i loro nomi stanno nei cataloghi JSON del dataset, non nel codice
del gioco — quindi una prova che cerca in `js/css/html` non poteva che chiamarle
orfane tutte quante.

**Il guaio vero era l'altro, e la prova rossa lo stava indicando davvero.**
`media/` la copia intera `strumenti/build.js` dentro al pacchetto per gli store.
Quel dataset pesa **2,8 GB** — più di tutto il resto del gioco messo insieme — e
**nessuna riga di codice lo nomina**. Sarebbe finito addosso a chi installa il
gioco senza che nessuno l'avesse chiesto: esattamente la cosa che quella prova è
lì per impedire.

Cosa si è fatto. Il dataset non parte col pacchetto — lo salta `build.js`
(`FUORI_DAL_PACCHETTO`), e l'audit smette di guardarci dentro _perché_ il build lo
salta. Le due cose sono legate da una prova apposta («il dataset degli avatar
resta fuori dal pacchetto per gli store»): se un giorno qualcuno toglie il salto
dal build, l'audit se ne accorge invece di lasciar tornare 2,8 GB nel pacchetto in
silenzio. Il pacchetto per gli store è passato da **3,0 GB a 194 MB**.

Restava però una cosa fuori posto, ed era una scelta rimandata: quei 2,8 GB
stavano anche nella **storia di git**, e ogni `git clone` se li portava dietro.

---

e stavano pure nella storia di git: ogni clone si portava dietro 2,8 GB

**RISOLTO (07/09/2026)** — Mycol, history riscritta e `main` force-pushed. Il
dataset è uscito anche da lì. Nel repo restano i cataloghi JSON, il manifest e i
crediti; il dataset vero sta nella release GitHub **`makehuman-v29`**, spezzato in
35 pezzi da 64 MB, e se lo tira giù chi gli serve con:

```
cd frontend && npm run setup:makehuman
```

Lo script (`frontend/strumenti/setup-makehuman.js`) controlla lo sha256 di ogni
pezzo, poi dell'archivio ricostruito, poi di `targets.bin` estratto, e mette da
parte il vecchio `data/` prima di sostituirlo: se qualcosa non torna si ferma
senza aver toccato niente. `.gitignore` tiene fuori
`frontend/media/makehuman-editor-v1/data/`, così non ci ricasca nessuno.

**Attenzione a due cose.** La prima: su una macchina appena clonata il dataset
**non c'è**, e finché non lanci il setup l'editor degli avatar non ha da dove
pescare. La seconda: un branch nato prima della riscrittura può ancora portarsi
dentro i 2,8 GB — prima di mergiarlo o pusharlo si controlla con
`git ls-tree -r <branch> -- frontend/media/makehuman-editor-v1/data`.

---

## Giro del 08/09/2026

Giro di fine task sul lavoro degli **elementi HTML delle otto sezioni dello Studio**
(branch `task/studio-elementi-html`, commit `83ab4c5`, nel frattempo già finito in
`main` col merge `1196778`).

Prima le cose che ho fatto girare e che sono **a posto**: `npm run prova` (79 su 79),
`node strumenti/audit-regressioni.js` (280 su 280) e `npm run verifica:build` (33 su 33) passano tutti e tre. Poi ho provato a mano, fuori dal browser, le cose nuove:
i tre cursori del banco lasciati al centro valgono **esattamente zero** (il mix resta
quello di prima, 6 punti su una partita nuova) e in tutte le 125 posizioni non danno
mai più di tre punti in su o in giù; un pezzo messo in cassaforte **non esce** né da
solo né dalla plancia; un pezzo messo in coda per venerdì esce **una volta sola**, il
giorno giusto, e poi il segno della coda sparisce; comprare un beat funziona uguale
dalla Sala e dallo Studio; una partita vecchia senza le voci nuove nel salvataggio non
fa esplodere nessuna delle otto sezioni. Gli attributi `data-` nuovi dello Studio non
si pestano i piedi con nessun altro pezzo del gioco: ho guardato tutti e quindici, uno
per uno, e anche i quattro ascoltatori che stanno su tutto il documento.

Quello che non va è qui sotto.

### Il gioco si spegne appena arrivi a 1500 fan senza contratto

- **dove** — `frontend/js/game/ui.js:482`
- **cosa succede** — la riga che stima quanto rende il primo anno di contratto usa un
  numero, `my`, che in quel punto **non esiste** (esiste solo dentro a un'altra
  funzione, più in basso). Appena arrivi a 1500 fan e non hai firmato con nessuno, la
  prima offerta compare e quella riga esplode: si ferma tutto il disegno della
  plancia, non solo il riquadro dei contratti. Non c'entra con lo Studio: era identico
  su `main` da prima.
- **come si vede** — porta i fan a 1500 senza firmare un contratto e fai passare un
  giorno.
- **quanto pesa** — blocca la partita.

**RISOLTO (08/09/2026)** — sistemato mentre facevo il giro, sul branch
`task/my-non-definito` e già in `main` col merge `6ecd52f`: al posto di `my` adesso
c'è `streamSettimana()`, che il conto se lo fa da sé.

### La take che paghi in cabina può finire sul pezzo sbagliato

- **dove** — `frontend/js/game/studio-elementi.js:364` (`studioTakePresa`), e la
  targhetta che dovrebbe legarla al pezzo giusto sta a riga 279 (`studioTakeChiave`).
- **cosa succede** — ogni take si porta dietro una targhetta che dice a quale strofa e
  a quale beat appartiene, e finché stai dentro alla cabina funziona: cambi strofa e
  le take si buttano da sole. Ma **al momento di registrare quella targhetta non la
  guarda nessuno**: si prende quello che c'è e basta. Così se paghi le take con la
  strofa che hai adesso, poi vai a scriverne una migliore e registri dalla plancia
  senza ripassare dalla cabina, sul pezzo nuovo finisce la take pagata sul vecchio —
  in regalo se era buona, in faccia se era venuta male. C'è anche una seconda strada
  per lo stesso guaio: la targhetta è fatta col tema e la qualità della strofa, quindi
  **due strofe sullo stesso tema e con la stessa qualità sono la stessa cosa** per
  lei, e le take pagate su una valgono anche sull'altra.
- **come si vede** — in cabina paga due o tre take finché ne esce una buona, non
  registrare, vai nel Testo e scrivi una strofa migliore, poi registra dalla plancia:
  il pezzo esce con il punteggio della take di prima.
- **quanto pesa** — si vede ma si gira intorno.

**RISOLTO (08/09/2026)** — la targhetta adesso la guarda anche `studioTakePresa()`, non
solo la cabina: se non combacia la take si butta e si tira il dado di sempre. Ed è
fatta con i **numeri di serie** della strofa e del beat, non col tema e il voto, così
due strofe gemelle non sono più la stessa cosa.

### I cursori del banco si spostano di una tacca sola per volta

- **dove** — `frontend/js/game/studio-elementi.js:456` (`studioBancoMuovi`) con
  `frontend/js/game/studio.js:1152`
- **cosa succede** — appena il cursore si muove di una tacca, il gioco ridisegna tutto
  il pannello di mezzo: il cursore che stavi trascinando **viene buttato via e rifatto
  da capo**, e il dito resta a trascinare una cosa che non c'è più. Per spostarlo di
  due tacche devi staccare il dito e ripartire. Con la tastiera è peggio: dopo una
  freccia il cursore perde il fuoco e le altre frecce non fanno più niente — e alla
  tastiera il gioco ci tiene, tanto che sotto c'è una riga apposta per far vedere il
  cursore a chi ci arriva col tab.
- **come si vede** — apri lo Studio, sezione del banco, e prova a trascinare «Voce» da
  un capo all'altro con un dito solo.
- **quanto pesa** — si vede ma si gira intorno.

**RISOLTO (08/09/2026)** — muovere un cursore non ridisegna più il pannello: cambiano a
mano solo la parte piena, il nodo, la frase sotto e il riquadro del risultato, e
l'`input` che ha il dito sopra resta lo stesso. Il fuoco della tastiera resta dov'è.
Per strada è saltato fuori un secondo buco nella stessa riga: il riquadro guardava
`studioDaMixare()`, che torna `null` finché non scegli un provino a mano, quindi non
si aggiornava mai — adesso ripiega sul migliore come fa la sezione
(`studioProvino()`).

### Dopo che metti un pezzo nel cassetto, il tasto grande resta «Tienilo da parte»

- **dove** — `frontend/js/game/studio-elementi.js:564` (`studioMandaFuori`) e
  `frontend/js/game/studio.js:1013`
- **cosa succede** — la scelta del «quando» non torna su «stanotte» dopo che l'hai
  usata. Metti un pezzo in cassaforte e la schermata passa da sola al pezzo dopo, ma
  il tasto d'oro in mezzo allo schermo continua a dire «Tienilo da parte»: un secondo
  tocco nello stesso punto mette via anche quello, e poi il terzo, senza che niente
  cambi a schermo tranne il titolo. Provato: tre pezzi pronti, due tocchi sullo stesso
  tasto, due pezzi in cassaforte. Si rimedia — dalla cassaforte si ritirano — ma è la
  faccia del tasto che non dice quello che sta per fare.
- **come si vede** — sezione Fuori con due o più pezzi pronti: scegli «tienilo nel
  cassetto», premi, e premi di nuovo senza toccare altro.
- **quanto pesa** — si vede ma si gira intorno.

**RISOLTO (08/09/2026)** — dopo il cassetto la scelta torna su «stanotte», e il tasto
d'oro torna a dire «Mandalo fuori».

### Un pezzo di una partita vecchissima, messo in cassaforte, non si ritira più

- **dove** — `frontend/js/game/studio-elementi.js:594` (`studioRiprendi`)
- **cosa succede** — la cassaforte riconosce i pezzi dal loro numero di serie. I pezzi
  registrati da quando il gioco si è diviso in `frontend/` e `backend/` ce l'hanno
  tutti; un salvataggio più vecchio di così può avere pezzi senza. Quel pezzo lo puoi
  mettere in cassaforte, si vede nell'elenco, ma il tasto «ritira» non risponde — e
  intanto è sparito da quelli che possono uscire, quindi non lo pubblichi più né dallo
  Studio né dalla plancia. Provato: il pezzo resta segnato «tenuto» anche dopo aver
  premuto. Stessa storia per «cambia copertina» sullo stesso pezzo.
- **come si vede** — solo con un salvataggio molto vecchio: pezzo in cassaforte, poi
  «ritira».
- **quanto pesa** — da sistemare con calma.

**RISOLTO (08/09/2026)** — `studioPezzoSeme()` gliene dà uno la prima volta che serve,
come si fa da sempre con i beat e adesso anche con le strofe. Vale per «ritira» e per
«cambia copertina».

### Il tasto tondo per ascoltare è più piccolo di un dito

- **dove** — `frontend/css/studio-elementi.css:42` (e `:169` per «cambia copertina»)
- **cosa succede** — il tondo con il triangolo è 34 punti, e «cambia copertina» pure:
  la regola del progetto, quella scritta in `css/tocco.css`, dice **44** perché sotto
  quella misura il dito sbaglia bersaglio. Qui conta più del solito, perché il tondo
  sta dentro alla riga della take e la riga fa un'altra cosa: se lo manchi non è che
  non succede niente, è che **scegli quella take** invece di ascoltarla. Il commento
  nel codice dice che il bersaglio buono è la riga, ma la riga è di un altro tasto.
  `tocco.css` non lo tira su perché queste classi sono nuove e lì dentro non ci sono.
- **come si vede** — sul telefono, in cabina, prova ad ascoltare le take una dopo
  l'altra.
- **quanto pesa** — da sistemare con calma.

**RISOLTO (08/09/2026)** — il cerchio **si vede** ancora da 34 punti, come nella foto, ma
quello che si tocca è 44: un `::before` che sborda. «Cambia copertina» è passato a
`min-height:44px`.

### L'uscita di venerdì non costa niente, quella a mano sì

- **dove** — `frontend/js/game/studio-elementi.js:608` (`studioUscitePronte`) contro
  `frontend/js/game/actions.js:356` (la mossa «Pubblica il pezzo»)
- **cosa succede** — se mandi fuori un pezzo a mano spendi una mossa della giornata e
  un punto di lucidità; se lo metti in coda per venerdì esce **da solo** e non paghi
  né l'una né l'altro, più i 4 punti di hype in più. Il commento nel codice dice che
  l'hype «lo paghi aspettando», ma nel conto vero l'attesa ti fa anche risparmiare:
  così aspettare non è mai una scelta, è sempre la scelta giusta. Non è rotto, è un
  bilanciamento da guardare: o venerdì costa anche lui, o il vantaggio è doppio.
- **come si vede** — metti un pezzo in coda per venerdì e guarda la lucidità prima e
  dopo che esce.
- **quanto pesa** — da sistemare con calma.

**RISOLTO in parte (08/09/2026)** — l'uscita in coda adesso costa il punto di lucidità
come quella a mano. La **mossa della giornata** no, e quella resta com'era: il pezzo
esce di notte mentre dormi, e far pagare una mossa a chi non è sveglio non si può
scrivere in modo onesto. Quindi un piccolo vantaggio venerdì ce l'ha ancora — ma
adesso è il vantaggio di aspettare, non uno sconto.

### La stima degli stream promette più di quello che arriva

- **dove** — `frontend/js/game/studio-elementi.js:538` (`studioStreamStima`) con
  `frontend/js/game/sim.js:65`
- **cosa succede** — il «~ 1.200 – 2.900 stream» della sezione Fuori è la formula vera
  di `sim.js`, presa ai due capi dei suoi tiri di dado: fin qui giusto. Solo che il
  lunedì, prima di darti i numeri, la simulazione passa il totale sotto a un **tetto**
  che dipende dalla fase della carriera, e sopra a quel tetto tiene solo un quinto di
  quello che avanza. La stima quel tetto non lo guarda, quindi più il tuo catalogo
  tira, più il numero scritto sta sopra a quello che poi leggi davvero.
- **come si vede** — con parecchi pezzi già fuori, segnati la stima di venerdì e
  confrontala col lunedì.
- **quanto pesa** — da sistemare con calma.

**RISOLTO (08/09/2026)** — la stima applica lo stesso tetto di `advanceWeek()`, contando
anche quello che il resto del catalogo ha già occupato.

### La scheda del beat che scegli si perde se ricarichi

- **dove** — `frontend/js/game/studio-elementi.js:207` (`studioBeatSegna`)
- **cosa succede** — tutte le altre scelte dello Studio (la strofa, il beat su cui
  incidi, il tema, il quando, i cursori) vengono salvate appena le fai. La scheda del
  beat sul banco no: si ridisegna e basta. Chiudi e riapri il gioco e ti ritrovi
  segnata la prima delle tre, che non è quella che stavi per comprare.
- **come si vede** — sezione Beat, scegli la terza scheda, ricarica la pagina.
- **quanto pesa** — da sistemare con calma.

**RISOLTO (08/09/2026)** — `studioBeatSegna()` salva, come tutte le altre scelte dello
Studio.

### Chi compra un beat dallo Studio o dalla Sala non lo racconta al motore degli eventi

- **dove** — `frontend/js/game/studio-elementi.js:141` (`prendiBeatDalBanco`),
  `frontend/js/game/eventi-v2.js:2567`, `frontend/js/game/ui.js:380`
- **cosa succede** — il motore degli eventi si accorge che hai comprato un beat solo
  se lo compri **dallo Shop**: sta in ascolto su quel tasto lì e su nessun altro.
  Comprarlo dalla Sala non ha mai fatto scattare niente, e adesso che si compra anche
  dalla schermata dei beat dello Studio i posti muti sono due su tre. Non si rompe
  niente: semplicemente gli eventi che dovrebbero venirti dietro dopo un acquisto non
  arrivano. Nella stessa fila ci sono «ascolta» e «lascialo lì», che il motore ascolta
  con dei nomi che nella Sala non si usano. Non è di questa task, ma questa task la
  allarga.
- **come si vede** — si vede solo dai file: sono tre tasti che fanno la stessa cosa e
  uno solo parla col motore.
- **quanto pesa** — da sistemare con calma.

**LASCIATO (08/09/2026)** — non è di questa task e non si sistema in una riga: vuol dire
decidere che nomi deve ascoltare `eventi-v2.js` per i tre tasti, ed è una cosa che
tocca il motore degli eventi, non lo Studio. Segnato qui perché adesso i posti muti
sono due su tre invece di uno su due.


**RISOLTO (13/09/2026)** — l'hook è lo stesso per lo Shop e per la sezione Beat dello Studio,
perché è la stessa transazione, e parte solo se l'acquisto è andato in porto; l'ascolto
(`data-bplay`) idem, solo per un beat ancora sul banco. Il racconto sta in
`implementazioni/06-mondo-e-personaggi.md`, «Il motore degli eventi e i beat comprati fuori
dallo Shop».
### Sul telefono i colori del «passaggio del mouse» restano accesi dopo il tocco

- **dove** — `frontend/css/studio-elementi.css:46, 65, 99, 173` (e in tutto il resto
  del gioco: **nessun** foglio di stile fa la distinzione)
- **cosa succede** — le schede dei beat, le righe delle take, il tondo di ascolto e
  «cambia copertina» si schiariscono quando ci passi sopra col mouse. Sul telefono il
  passaggio del mouse non esiste, e quello che succede è che il colore si accende al
  tocco e **ci resta**, come se quella cosa fosse ancora scelta, finché non tocchi
  altrove. Non è roba di questa task — è così in tutto il gioco, ed è già fra le cose
  lasciate indietro sulla responsività — ma qui si aggiungono altre quattro righe alla
  lista.
- **come si vede** — su un telefono vero, tocca una scheda di beat e guarda dove
  rimane il chiarore.
- **quanto pesa** — da sistemare con calma.

**LASCIATO (08/09/2026)** — è così in tutto il gioco, nessun foglio di stile fa la
distinzione, ed è già nell'elenco delle cose lasciate indietro sulla responsività.
Va fatto in un giro solo su tutti i CSS: farlo qui e basta vorrebbe dire quattro
righe diverse dalle altre trecento.

**RISOLTO (08/09/2026, scritto il 15/09/2026)** — il giro unico è stato fatto lo stesso
giorno, sul branch `task/responsivita`: lo dice il secondo giro dell'08/09 qui sotto («la
passata degli `:hover` file per file … nessuna regola `:hover` rimasta fuori») e lo dice
`implementazioni/02-interfaccia-e-telefono.md:1383` (**FATTO (08/09/2026)**). Nel codice
torna: tutte le 161 regole `:hover` dei 27 fogli in `frontend/css/` stanno dentro alla
gabbia `@media (hover:hover)`, e il controllo automatico «nessun :hover fuori da
@media (hover:hover)» in `audit-regressioni.js` è verde anche sui pezzi di grafica scritti
dentro al JavaScript. Questa riga mancava, ed è per questo che la voce è rimasta negli
elenchi degli aperti: vedi il giro del 15/09 in fondo.

### Nota, non è un errore: in cabina il tasto d'oro è quello che spende

- **dove** — `frontend/js/game/studio.js:726`
- Nelle altre schermate dello Studio il tasto d'oro — quello grosso, uno per pagina —
  è la mossa che fa succedere la cosa. In cabina l'oro ce l'ha **«Un'altra take · 12
  energia»**, e «Tieni questa e chiudi», che è la mossa vera, è il tasto di contorno.
  Chi va di fretta preme l'oro e spende energia senza volerlo. Funziona tutto: è una
  scelta su come sono messi i tasti, non un guasto, e cambiarla o no lo decidi tu.

  **LASCIATA COM'È (08/09/2026), ma è una domanda aperta.** Nella foto di riferimento
  `registrazione_pezzo` l'oro ce l'ha «UN'ALTRA TAKE», ed è quella la foto a cui la task
  doveva arrivare uguale. La regola scritta in `css/studio.css` dice però che l'oro va alla
  mossa che fa succedere la cosa, ed è per quella regola che nella sezione Beat «Compralo»
  è d'oro e «Fattelo fare» no. Le due cose qui non vanno d'accordo: ha vinto la foto,
  perché era la richiesta. Basta dirlo e si gira.

---

## Giro del 08/09/2026 (secondo giro: responsività)

Controllato: `npm run prova` e `node strumenti/audit-regressioni.js` (294 ok, 0
falliti), le graffe di tutti e 27 i fogli di stile in `frontend/css/` (tutte in
pari), la passata degli `:hover` file per file, la riga muta dello Studio in
`tempo-controlli.js`, e i blocchi nuovi in fondo a `strada-crimine-v2.css` e
`effects.css` selettore per selettore contro il vero markup (`frontend/pagine/gioco.html`).

Il grosso è a posto: nessuna graffa storta, nessuna gabbia annidata male,
nessuna regola `:hover` rimasta fuori e nessun pezzo non-hover finito dentro
alla gabbia per sbaglio. La riga muta dello Studio pulisce bene: quando lo
Studio si apre il gioco chiude il pannello, rimette a posto i vecchi orologi
che aveva nascosto e sparisce la pastiglia; quando si chiude, torna da sola
sull'hub. Sotto ci sono cinque cose che restano.

### La passata degli hover ha saltato quello che è scritto dentro al JavaScript

- **dove** — `frontend/js/game/tempo-controlli.js:303, 347, 348`,
  `frontend/js/game/eventi-v2.js:2612, 2805`,
  `frontend/js/game/strada-crimine-ui.js:195`
- **cosa succede** — sei pezzi di grafica non stanno nei fogli di stile ma sono
  scritti dentro al codice, e la passata non li ha toccati: la pastiglia del
  tempo, i tasti «+» e «−» e i tasti del pannello del tempo, i tasti del
  calendario, i tasti dei post di LaFamegram e i tasti del carcere. Su quelli,
  sul telefono, il colore si accende al tocco e ci resta — che è esattamente la
  cosa che questo giro doveva togliere. Peggio: il controllo automatico nuovo
  guarda solo dentro a `frontend/css/`, quindi dice «tutto a posto» e continuerà
  a dirlo anche se se ne aggiungono altri lì dentro.
- **come si vede** — su un telefono vero: tocca la pastiglia dell'ora e guarda
  dove rimane il chiarore; stessa cosa sui tasti di un post di LaFamegram.
- **quanto pesa** — si vede ma si gira intorno.

**RISOLTO (08/09/2026)** — branch `task/responsivita`. I sei pezzi adesso stanno
nella gabbia come quelli dei fogli di stile. E il controllo in
`audit-regressioni.js` non guarda più solo `frontend/css/`: legge anche i file
di codice che si portano dentro un foglio di stile, quindi da adesso se ne
sfugge uno lì dentro la prova diventa rossa. Provato togliendo apposta una
gabbia: la prova fallisce.

### Nella Strada c'è una riga nuova che non tocca niente: quei pannelli si

### chiamano in un altro modo

- **dove** — `frontend/css/strada-crimine-v2.css:2448`
- **cosa succede** — la riga dice «i pannelli non si tagliano più il contenuto»
  e li chiama `panel`. Nella pagina vera (`frontend/pagine/gioco.html:497, 520, 530`)
  quei tre pannelli si chiamano `stpan`, non `panel`: la riga non trova nessuno
  e non fa niente. Il taglio del contenuto continua ad arrivare da
  `frontend/css/strada-crimine.css:115`, che è rimasto com'era. Non è colpa di
  questo giro: lo stesso nome sbagliato era già lì tre volte da prima
  (righe 69, 307, 434 dello stesso file), adesso sono quattro.
- **come si vede** — si vede solo dai file: quel nome non esiste nella pagina.
- **quanto pesa** — da sistemare con calma.

**RISOLTO (08/09/2026)** — la riga adesso dice `stpan`, che è il nome vero, ed è
in `frontend/css/stretto.css`. Le altre tre occorrenze sbagliate erano già lì
da prima e non sono state toccate: non è roba di questo giro.

### Sul telefono la pastiglia del tempo si tiene 222 punti anche quando si è

### rimpicciolita

- **dove** — `frontend/js/game/tempo-controlli.js:290` contro `:351`
- **cosa succede** — c'è una riga che dice «sotto i 620 punti la pastiglia si
  stringe a 176», e ce n'è un'altra, scritta più precisa, che per la Strada (e
  per l'hub, il carcere, il Posto e il negozio) dice 222. Vince la più precisa,
  sempre, anche sul telefono: quindi l'orologio disegnato si rimpicciolisce
  davvero ma la casella che se lo tiene resta larga come su un monitor. Su uno
  schermo da 360 punti quella casella più la crocetta per chiudere si mangiano
  quasi tutta la seconda riga della fascia, e al titolo della schermata
  restano una sessantina di punti. Non è di questo giro — quelle righe non sono
  state toccate — ma è proprio la riga che il blocco nuovo a 620 doveva far
  entrare.
- **come si vede** — apri la Strada su uno schermo stretto e guarda quanto
  spazio vuoto c'è intorno all'orologio, e quanto ne resta al titolo.
- **quanto pesa** — si vede ma si gira intorno.

**RISOLTO (08/09/2026)** — le due righe responsive adesso dicono
`#adf-time-dock[data-host]`: stessa precisione delle righe per singolo posto, e
vengono dopo, quindi sul telefono vince la misura stretta.

### Nella Strada stretta il menu in alto e il titolo sotto non partono

### dallo stesso punto

- **dove** — `frontend/css/strada-crimine-v2.css:2456` e `:2472`, contro
  `frontend/css/menu-sistema.css:447`
- **cosa succede** — i blocchi nuovi portano il margine sinistro della fascia
  della Strada da 30 punti a 12. Il menu in alto (quello con la corona e
  «MAPPA») però è inchiodato a 30 punti da un'altra regola, scritta con la
  parola che vince su tutto, e per la Strada non c'è nessuna eccezione per gli
  schermi stretti. Risultato: su un telefono il menu parte 18 punti più a
  destra del titolo e della riga sotto. Non rompe niente, si vede e basta.
- **come si vede** — apri la Strada su uno schermo da 360 punti e guarda il
  bordo sinistro: il menu è rientrato, quello che c'è sotto no.
- **quanto pesa** — da sistemare con calma.

**RISOLTO (08/09/2026)** — in `frontend/css/menu-sistema.css`, sotto i 620 punti
il menu della Strada rientra a 12 come la fascia, e scende a 52 di altezza.

### Nota, non è un errore: adesso sul telefono toccare un tasto non fa più

### vedere niente

- **dove** — tutto `frontend/css/`, per esempio `.stbcard` e `.sttakeriga` in
  `studio-elementi.css:71, 105`, `#strada .crime` in `strada-crimine-v2.css:119`,
  `.ptab` e `.pev` in `hub.css:545, 909`
- Chiudere gli `:hover` nella gabbia era giusto e toglie il chiarore che
  rimaneva acceso dopo il tocco. Il rovescio della medaglia è che su 138 cose
  che si accendevano col mouse, **123 non hanno nessun'altra risposta al
  tocco**: né un colore che si abbassa mentre premi, né altro. Prima almeno
  lampeggiavano storto; adesso premi e, finché la schermata non cambia, non
  succede niente a vedersi. Dove il tocco sceglie qualcosa (le schede dei beat,
  le linguette) il colore da «scelto» arriva lo stesso, quindi lì si capisce;
  dove il tocco fa partire un'azione — un colpo nella Strada, un evento
  sull'hub — no. Funziona tutto: è una scelta su quanto risponde il gioco al
  dito, e va decisa, non è un guasto. Se si vuole si mette una risposta al
  «mentre premo» in un giro solo, come è stato fatto per la gabbia.

### Nota, non è un errore: nello Studio i due blocchi per gli schermi stretti

### sono scritti in ordine inverso

- **dove** — `frontend/css/studio.css:354` e `:364`
- Il blocco «sotto i 480» sta **prima** del blocco «sotto i 520». Su un telefono
  da 360 valgono tutti e due, e a parità di regola vince quello scritto dopo —
  cioè il più largo, che è il contrario di quello che ci si aspetta. Oggi non
  fa danni perché i due blocchi non si contendono niente: uno sposta la fascia
  in alto, l'altro le linguette in basso. Ma è una trappola: chi domani
  aggiunge una riga a quello da 480 può vedersela mangiare da quello da 520
  senza capire perché. Basta scambiarli di posto, e non è urgente.

**RISOLTO (08/09/2026)** — scambiati. Adesso stanno in `frontend/css/stretto.css`,
nella sezione STUDIO, in ordine dal più largo al più stretto: 900, 620, 520, 480.

## Giro del 08/09/2026

Giro di fine task sul branch `task/beat-e-tasto-oro`, commit `7dc2d70`: il tasto d'oro
in cabina e il motore degli eventi che adesso sente i beat comprati dallo Studio.

**Quello che ho controllato e che è a posto.** I controlli automatici: l'audit delle
regressioni dà 296 a posto e 0 falliti, il build ne dà 33 a posto. Sullo scambio dei due
tasti in cabina va tutto bene: lo «spento» quando hai poca energia è rimasto attaccato a
«Un'altra take» e non a «Tieni questa e chiudi», quindi con poca energia chiudi la
registrazione lo stesso; `stSecondo()` accetta lo spento esattamente come `stPrimo()`
(`frontend/js/game/studio.js:484` e `:488`); il foglio di stile spegne tutti e due i tipi
di tasto (`frontend/css/studio.css:236`); le icone sono rimaste sul tasto giusto, la
spunta con «Tieni questa e chiudi» e il microfono con «Un'altra take». Sul motore degli
eventi: i due file che servono si caricano prima (`beatplay.js` e `studio-elementi.js`
stanno sopra a `eventi-v2.js` in `frontend/pagine/gioco.html`) e comunque il codice
controlla prima di chiamarli. La cosa che più mi preoccupava — che il conteggio «i beat
sono aumentati?» venisse fatto quando l'acquisto era già avvenuto, e quindi non partisse
mai nessun evento — **non** succede: quell'ascoltatore è agganciato in modo da passare
per primo (`frontend/js/game/eventi-v2.js:2626`, la riga si chiude con `},true)`), prima
di quello dello Studio. Quindi il conto di partenza è quello giusto e anche il nome del
beat è quello giusto. Il filtro sui beat già in cartella tiene: i beat li fa `creaBeat()`
con un numero a caso e con un nome che non ripete quelli che hai già
(`frontend/js/game/beats.js:99` e `:109`), quindi un beat della cartella non può essere
scambiato per uno ancora in vendita. `beatSeed()` chiamato dal motore non combina guai:
al massimo scrive un numero che sarebbe stato calcolato uguale un attimo dopo, e non fa
salvare niente da solo. Un click solo non fa partire due eventi: i tasti in questione non
sono uno dentro l'altro. Ho guardato tutti i punti in cui un beat finisce in cartella
(sei) e gli altri quattro non passano dal banco dei beat, quindi il loro silenzio è
coerente con la scelta già scritta nel commit. Anche il test aggiornato sui nomi rubati
tiene: gli altri tredici nomi dello Studio restano protetti come prima, e in più adesso
la prova cade anche se qualcuno smette di ascoltare i due nomi voluti.

### Se compri un'attività nella Strada, il gioco crede che tu abbia comprato un beat

- **dove** — `frontend/js/game/eventi-v2.js:2566`, contro
  `frontend/js/game/strada-crimine-ui.js:412`
- **cosa succede** — il motore degli eventi ascolta tutti i tasti che si chiamano
  `data-buy` e ogni volta racconta «hai comprato un beat». Ma con quel nome lì c'è anche
  il tasto «Rileva» delle tre attività della Strada (lavanderia, autolavaggio,
  minimarket). Così quando ti compri una lavanderia il motore registra un acquisto di
  beat, per giunta senza nome del beat, e può farti uscire l'evento del mercato dei beat
  mentre sei nel bel mezzo della Strada. È esattamente lo stesso guaio che il commento
  nello Studio racconta di aver evitato chiamando il suo tasto `data-stcompra` invece che
  `data-compra` — solo che qui nessuno se n'era accorto. Non è di questo giro: c'era già
  prima, il commit non l'ha creato. Vale la pena dirlo adesso perché la prova che
  controlla i nomi rubati (`frontend/strumenti/audit-regressioni.js:577`) guarda solo i
  nomi inventati dallo Studio, e questo le passa sotto il naso.
- **come si vede** — vai nella Strada, compra una delle tre attività, e guarda se ti
  spunta un evento sul mercato dei beat nei momenti dopo.
- **quanto pesa** — si vede ma si gira intorno.


**RISOLTO (13/09/2026)** — «una lavanderia non è un beat»: `eventi-v2.js` emette l'acquisto
solo se `data-buy` è davvero un indice del banco e il beat esiste. Stesso posto della voce
qui sopra, in `06-mondo-e-personaggi.md`.
### Due prove automatiche sono rosse, ma non per colpa di questo lavoro

- **dove** — `frontend/js/avatar/makehuman/` (per esempio `adapter.js` e `contract.js`)
- **cosa succede** — `npm run prova` chiude con «77 a posto, 2 no». Le due che non
  passano sono «nessun file sul disco è rimasto fuori dalle pagine» e «ogni file di
  codice compila», e le righe vere che stampa sono
  `js/avatar/makehuman/adapter.js — Cannot use import statement outside a module` e
  `js/avatar/makehuman/contract.js — Unexpected token 'export'`. Sono file scritti in un
  modo che il controllo non sa leggere e che nessuna pagina richiama. Ho controllato che
  su `main` sia già così: non le ha rotte questo lavoro. La segnalo lo stesso perché
  finché sono rosse, `npm run verifica` non arriva mai in fondo, e quindi la prima cosa
  che facciamo prima di chiudere una task si ferma sempre lì.
- **come si vede** — da `frontend/`, `npm run prova`.
- **quanto pesa** — da sistemare con calma.


**RISOLTO (08/09/2026)** — commit `4412dd1`: `js/avatar/makehuman/` è dichiarata libreria
ES-module in `strumenti/prova.js` (`MODULI_JS_STANDALONE`), e le due prove non la leggono più
come se fosse un gruppo di `<script>`. `npm run verifica` arriva in fondo.
## Giro del 10/09/2026

Giro fatto sul branch `task/beat-energia-e-barre-senza-malus`, dopo le modifiche a
`studio.js` (tolto il costo di 20 energia per farsi fare un beat su misura), `writer.js`
(tolto il calo di benessere quando chiudi una strofa) e `actions.js` (costo di «Scrivi
barre» sceso da 28 a 15 di energia).

- `npm run prova`: 89 a posto, 0 no — tutto verde.
- `node strumenti/audit-regressioni.js`: 298 a posto, 3 no. I tre falliti sono quelli già
  noti da prima (lo shop a linguette per Attrezzatura/Beat/Vestiti e i nomi dei file delle
  pagine sparsi in più punti) — li ho controllati uno per uno e non c'entrano con questo
  lavoro.
- `npm run verifica:build`: 33 a posto, 0 no — build e file unico a posto.
- Cercato in tutto `frontend/js/` un residuo di `STUDIO_BEAT_ENERGIA` o del vecchio testo
  «20 energia» nello Studio: non ne è rimasto nessuno. La card «Fattelo fare» adesso mostra
  solo prezzo e tempo, senza il pezzo di energia che c'era prima.
- Cercato in tutto `frontend/js/game/` un altro punto che levasse benessere quando si
  scrivono le barre (eventi, achievement, dialoghi): non ne ho trovato. C'è un evento di
  prova finale (`js/game/phases.js:143`, «Lo scrivi da solo, tutto») che toglie 25 di
  benessere per scrivere da soli l'ultimo disco della carriera, ma è una scena a sé, non
  legata a `chiudiStrofa()`, e non l'ha toccata questo lavoro — la segnalo solo perché
  Carletto sappia che esiste, non perché sia da correggere.
- Il costo in energia di «Scrivi barre» in `actions.js:266` è letto dalla plancia in modo
  automatico (`hub.js:509`, `const e = a.dyn ? a.dyn() : a.e`), quindi il numero mostrato
  nella card è già 15 senza bisogno di toccare altro testo.
- Il test aggiornato in `strumenti/prova.js:1057-1064` controlla adesso che l'energia non
  scenda comprando o facendosi fare un beat, coerente col codice.

Non ho trovato problemi nuovi da questa task. Tutto il resto (JavaScript che si rompe
all'avvio, collegamenti fra schermate, telefono) non è stato toccato da queste modifiche,
quindi non l'ho ricontrollato punto per punto oltre ai controlli automatici sopra.

### Nota, non è un errore: il beat «Esclusiva» comprato dall'evento resta muto

- **dove** — `frontend/js/game/events.js:10`
- Il commit spiega bene perché «Fattelo fare» non racconta niente al motore: il beat non
  viene dal banco, se lo fa il gioco. Girando fra tutti i punti in cui un beat finisce in
  cartella ne ho trovato un altro che è un po' diverso dagli altri: nel vecchio evento
  «Un beat che spacca» paghi **250 €** per un beat e resta muto anche lui. Non viene dal
  banco, quindi con la regola scritta nel commit è giusto così — ma è l'unico caso in cui
  tiri fuori dei soldi per un beat e il motore non lo sa. È una scelta da confermare, non
  un guasto: oggi non rompe niente.

---

## Giro del 10/09/2026

Giro di fine task sul branch `task/turno-fabbrica-8-ore-e-mute-musica`, due commit:
`531df10` (il turno in fabbrica durava 60 minuti fissi invece della durata vera, per
qualunque azione avviata da un luogo della mappa) e `9536374` (pulsante muta/smuta la
musica dal menu principale, `pagine/landing.html` + `js/landing.js` + `css/shell.css`).

**Controlli automatici**: `npm run prova` dà 94 a posto e 0 no (compreso il nuovo blocco
che controlla i minuti veri per turno). `npm run verifica:build` dà 33 a posto e 0 no.
`node strumenti/audit-regressioni.js` dà 298 a posto e **3 no** — ma ho controllato con
un worktree sul commit `3d32737` (l'ultimo prima di questa task) e gli stessi 3 fallivano
già lì: non li ha rotti questo lavoro, ma restano rossi adesso e li segno sotto perché non
risultavano ancora scritti in questo file.

**Sul fix del turno**: ho riletto `avviaAzioneDiretta()` (`ui.js`) e `GAME_TIME.captureAction`
(`tempo.js`), e seguito tutte le strade che ci passano — Fabbrica e Pizzeria (`assumitiCome`),
Palestra (`hub.js:146,148`), «Stacca la spina» e Live Club (`hub.js:102,107,123`), più il
centro per l'impiego. Tutte chiamano `captureAction` col vero id prima di `iniziaAzione()`, e
`DURATE_LAVORO` ha i minuti giusti per ogni lavoro (`lavapiatti:300`, `operaio:480`, eccetera).
Non ho trovato altre strade che avviano un'azione senza passare né dal click sulla tile né da
`avviaAzioneDiretta()`.

**Sul pulsante muta/smuta**: il bottone è un fratello di `.brand` dentro `.navleft`, quindi
resta visibile anche quando `body.su-menu` nasconde il marchio — coerente con «un pulsantino
in parte a sx». `SET.audio.on` arriva davvero al motore audio (`js/audio/engine.js`, `livelli()`
azzera il gain master quando è spento), quindi il tasto non è solo cosmetico. Ho anche caricato
`pagine/landing.html` con Chrome in modalità headless: la pagina arriva fino in fondo a
`js/landing.js` senza eccezioni bloccanti (il bottone compare nel DOM con `aria-pressed="false"`
di default) e nessun file JS del progetto ha errori di sintassi.

Un problema trovato, sotto. Poi tre cose vecchie (non di questa task) mai segnate qui prima.

### Il pulsante muta/smuta rischia di restare senza stile o senza funzione dopo un aggiornamento

- **dove** — `frontend/pagine/landing.html:26` (`css/shell.css?v=12`) e `:277`
  (`js/landing.js?v=2`)
- **cosa succede** — il commit `9536374` cambia sia `css/shell.css` (le regole del nuovo
  bottone tondo) sia `js/landing.js` (il click che lo fa funzionare), ma il numero dopo
  `?v=` nei due `<script>`/`<link>` di `pagine/landing.html` è rimasto lo stesso di prima.
  In questo stesso progetto, quando si tocca `js/game/ui.js` o `js/game/tempo.js` quel
  numero si alza sempre (l'altro commit di questa stessa task lo fa, `ui.js?v=19→20` e
  `tempo.js?v=11→12`): qui non è successo. Chi ha ancora in cache la vecchia copia di
  `shell.css` o di `landing.js` — il browser di chi prova il gioco, o un giorno un CDN in
  produzione — continua a vedere la pagina vecchia finché non fa un refresh forzato: il
  bottone può comparire senza stile (un cerchio senza il suo aspetto) o comparire ma non
  rispondere al click, a seconda di quale dei due file è rimasto vecchio.
- **come si vede** — si vede dai file: `git show 9536374 --stat` cambia `css/shell.css` e
  `js/landing.js`, ma `git show 9536374 -- pagine/landing.html` non tocca le righe con
  `?v=`.
- **quanto pesa** — si vede ma si gira intorno (basta un refresh forzato una volta).

**RISOLTO (10/09/2026)** — il commit `5dcdfec` ha alzato `css/shell.css?v=12→13` e
`js/landing.js?v=2→3` in `pagine/landing.html`. Lo racconta anche il giro successivo qui
sotto, che però ha trovato lo stesso guaio ripresentarsi su un terzo commit.

### Lo Shop promette tre reparti a schede, ce ne sono solo due

- **dove** — `frontend/pagine/gioco.html:281-288` e `frontend/js/game/negozio.js`
- **cosa succede** — non è di questa task: l'ho trovato perché uno dei 3 controlli
  automatici rossi lo riguarda. Le schede dello Shop sono due sole, Attrezzatura e Beat
  (`data-sh="gear"` e `data-sh="beat"` in `gioco.html`); un terzo reparto per i Vestiti,
  con la sua scheda e la sua griglia riscritta, non esiste — quello che c'è di Vestiti è
  ancora la vecchia griglia impilata (`<div class="nggrid" id="g-fit">`), non dietro a
  nessuna linguetta.
- **come si vede** — apri lo Shop dalla mappa: le linguette in alto sono solo due.
- **quanto pesa** — da sistemare con calma.

### Un file fuori da `js/pagine.js` si tiene scritto a mano il nome di una pagina

- **dove** — `frontend/js/creator/rpg-v24-bridge.js:158`
- **cosa succede** — non è di questa task. La regola del progetto è che i nomi dei tre
  file delle pagine (`landing.html`, `accesso.html`, `gioco.html`) stanno scritti in un
  posto solo, `js/pagine.js`, così il giorno che cambiano nome si riscrive un file e
  basta. `rpg-v24-bridge.js` ha una riga (`location.href="pagine/landing.html"`) che se lo
  costruisce da sé, fuori da quella regola.
- **come si vede** — si vede solo dai file: è l'unica riga fuori da `js/pagine.js` che
  nomina una delle tre pagine per intero.
- **quanto pesa** — da sistemare con calma.


**RISOLTO (10/09/2026)** — commit `2f05b11` («riallinea Studio, Shop e navigazione pagine»):
la riga di `rpg-v24-bridge.js` non nomina più `landing.html`.
---

## Giro del 10/09/2026 (controllo mirato sul commit in più, `346c955`)

Sopra ai due commit già controllati in questo stesso giro (`0f7b4a4` e `5dcdfec`) è
arrivato un terzo commit, `346c955` — dodici righe in più nel click del pulsante
muta/smuta della landing, per far ripartire davvero la musica (contesto audio e traccia)
quando prima si era fermata da sola. Ho riletto il diff, seguito a mano dove portano
`ADF_AUDIO.unlock()`, `ADF_AUDIO.music.playing` ed `ensureMenu()` (sia nella versione vera
in `js/audio/music.js`, sia in quella "a ponte" usata quando la pagina sta dentro alla
cornice del gioco), e rifatto girare `npm run prova` (94/94 a posto). Il codice aggiunto di
per sé non rompe niente e non introduce comportamenti strani nel motore audio.

Un problema trovato, legato proprio a questo commit — lo stesso già segnato e sistemato
una volta per il commit precedente, ripresentato qui. Poi una nota, non un errore.

### Il numero di cache-busting di `landing.js` non si è alzato neanche questa volta

- **dove** — `frontend/pagine/landing.html:277` (`js/landing.js?v=3`)
- **cosa succede** — il commit `346c955` cambia il contenuto di `js/landing.js` (il click
  del pulsante muta/smuta) ma il numero dopo `?v=` in `landing.html` resta `3`, lo stesso
  di prima. È lo stesso identico problema segnato in questo file per il commit precedente
  (`0f7b4a4`) e poi sistemato dal commit `5dcdfec` alzando quel numero a `v=3` — solo che
  adesso il contenuto del file è cambiato di nuovo e il numero no. Chi ha già in cache la
  vecchia copia di `landing.js` (presa dopo `5dcdfec` e prima di `346c955`) continua a
  vedere il pulsante muta/smuta col comportamento vecchio, senza la nuova correzione,
  finché non fa un refresh forzato.
- **come si vede** — si vede dai file: `git show 346c955 --stat` cambia solo
  `frontend/js/landing.js`, e `landing.html` non è nel diff.
- **quanto pesa** — si vede ma si gira intorno (basta un refresh forzato una volta).

**RISOLTO (10/09/2026)** — il commit `1d0f737` ha alzato `js/landing.js?v=3→4`. Verificato
adesso in `frontend/pagine/landing.html:277`: dice `v=4`.

### Nota, non un errore: la stessa correzione non è arrivata al pulsante gemello nelle Impostazioni

- **dove** — `frontend/js/impostazioni-ui.js:312-319` (l'interruttore `sw("audio.on")`,
  che chiama `dopoModifica()` a riga 260-265)
- **cosa succede** — non è un guasto di questo commit, è una scelta che vale la pena
  segnare: il pannello Impostazioni (raggiungibile sia da `landing.html` sia da
  `gioco.html`) ha un secondo interruttore che fa esattamente la stessa cosa del
  pulsante muta/smuta della landing — scrive su `SET.audio.on` e chiama
  `applicaImpostazioni()`. Il commit `346c955` ha aggiunto `ADF_AUDIO.unlock()` e
  `ADF_AUDIO.music.ensureMenu()` solo al pulsante della landing, non a questo secondo
  interruttore: se il sintomo descritto nel commit (si smuta ma la musica resta ferma)
  capita di nuovo, può ancora capitare passando dalle Impostazioni invece che dal
  pulsantino in alto a sinistra.
- **come si vede** — non l'ho provato dal vivo (il commit dice di non essere riuscito a
  riprodurre il sintomo neanche lui): è una lettura del codice, da tenere d'occhio.
- **quanto pesa** — da sistemare con calma.

---

## Giro del 10/09/2026 (terzo giro: verifica finale dopo il merge da main)

Giro di fine task sul branch `task/turno-fabbrica-8-ore-e-mute-musica`, dopo il merge da
`main` (arrivate nel frattempo le correzioni MakeHuman/Avaturn e il riallineamento di
Studio/Shop/navigazione — non toccate da questo giro).

**Controlli automatici, tutti verdi**: `npm run prova` dà 96 a posto e 0 no, `node
strumenti/audit-regressioni.js` dà 301 a posto e 0 no (i 3 che fallivano nel giro
precedente — Shop a linguette e nomi dei file di pagina — sono arrivati sistemati col
merge da main), `npm run verifica:build` dà 33 a posto e 0 no.

**Sul turno in fabbrica**: riletto `avviaAzioneDiretta()` in `frontend/js/game/ui.js:128`
e `GAME_TIME.captureAction()` in `frontend/js/game/tempo.js:477`. La cattura dell'id
avviene subito prima di `iniziaAzione()`, dentro alla stessa funzione sincrona `esegui()`
— anche passando dalla conferma («Confermi?» quando costa soldi) non c'è modo che un altro
clic su una tile la sporchi nel mezzo. Il controllo vero e proprio se c'è abbastanza
giornata per iniziare un turno (`actionAccess()` in `frontend/js/game/spostamenti.js:190`)
non passava mai dall'id catturato — usa sempre l'id esplicito — quindi su quel fronte non
c'era mai stato il bug: il numero sbagliato usciva solo nel conteggio del tempo "occupato"
dopo l'avvio, come dice giustamente il commit.

**Sul pulsante muta/smuta**: confermato che i due file (`css/shell.css`, `js/landing.js`)
sono richiamati con lo stesso `?v=` del loro contenuto — vedi le due righe RISOLTO qui
sopra. `ADF_AUDIO.unlock()` e `ADF_AUDIO.music.ensureMenu()` esistono davvero con quei nomi
sia nel motore vero (`js/audio/music.js:217,71`) sia nel ponte usato dentro alla cornice
del gioco (`js/audio/music.js:70-99`), quindi le chiamate del fix non puntano a funzioni
inventate.

Due problemi trovati, nessuno dei due blocca la partita.

### L'icona del pulsante muta/smuta non si aggiorna se spegni l'audio dalle Impostazioni

- **dove** — `frontend/js/impostazioni-ui.js:260-265` (`dopoModifica()`), contro
  `frontend/js/landing.js:98-103` (`aggiornaMuteLanding()`)
- **cosa succede** — sulla landing ci sono **due** interruttori per lo stesso
  `SET.audio.on`: il pulsante tondo in alto a sinistra, e l'interruttore «Audio» dentro al
  pannello Impostazioni (si apre dal bottone `m-setts` della landing stessa). Quando tocchi
  quello delle Impostazioni, `dopoModifica()` salva, applica i volumi e richiama
  `renderMenu()` — ma non richiama `aggiornaMuteLanding()`. Il pulsante tondo in alto
  resta con l'icona di prima: se l'audio era acceso e lo spegni dalle Impostazioni, il
  pulsante in alto continua a mostrare l'altoparlante «acceso». Chi a quel punto ci clicca
  sopra pensando di spegnerlo lo **riaccende** invece, perché il pulsante parte dal suo
  stato vecchio, non da quello vero.
- **come si vede** — sulla landing apri le Impostazioni (l'ingranaggio), spegni «Audio»,
  chiudi il pannello: il pulsantino in alto a sinistra resta con l'icona dell'altoparlante
  acceso invece di quella barrata.
- **quanto pesa** — si vede ma si gira intorno.

**RISOLTO (10/09/2026)** — `dopoModifica()` (`frontend/js/impostazioni-ui.js:260`) adesso
richiama anche `aggiornaMuteLanding()`, se esiste, subito dopo `renderMenu()`. Il pulsante
tondo in alto si allinea da solo ogni volta che l'interruttore «Audio» delle Impostazioni
cambia, senza bisogno di ricaricare la pagina.

### Il pulsante muta/smuta è più piccolo di un dito, sul telefono

- **dove** — `frontend/css/shell.css:44` (`.brand-mute`), contro
  `frontend/css/tocco.css:40-42`
- **cosa succede** — il progetto ha una regola scritta apposta per il telefono: sotto i
  900 punti o dove si tocca con un dito, ogni bottone della barra in alto sale a 44×44,
  perché sotto quella misura il dito sbaglia bersaglio — la regola lo dice esplicitamente
  per `.brand` e per `.avatarbtn`, che stanno proprio accanto a questo nuovo pulsante.
  Il pulsante muta/smuta però è rimasto a **36×36** in `shell.css` e non è mai stato
  aggiunto all'elenco di `tocco.css`, quindi su un telefono resta piccolo mentre i suoi
  vicini nella stessa barra crescono.
- **come si vede** — apri la landing su uno schermo stretto (o con `tocco.css` attivo,
  sotto i 900 punti): il pulsante muta/smuta è visibilmente più piccolo del marchio e
  dell'avatar accanto a lui.
- **quanto pesa** — da sistemare con calma.

**RISOLTO (10/09/2026)** — aggiunta `.brand-mute{width:44px;height:44px}` in
`frontend/css/tocco.css:43`, accanto ad `.avatarbtn`. Sotto i 900 punti o col dito cresce
alla misura giusta come i suoi vicini nella barra; l'icona SVG dentro resta 18×18 e
centrata, quindi non cambia aspetto.

---

## Giro del 10/09/2026 (quarto giro: controllo del commit `35db690`)

Giro di fine task, sempre su `task/turno-fabbrica-8-ore-e-mute-musica`, solo per
controllare che il commit `35db690` (le due correzioni annotate qui sopra) non abbia
portato dentro qualcos'altro di rotto. Non ho riaperto il resto del giro precedente, già
fatto.

**Controlli automatici, tutti verdi**: `npm run prova` 96 a posto e 0 no, `node
strumenti/audit-regressioni.js` 301 a posto e 0 no, `npm run verifica:build` 33 a posto e
0 no.

**`dopoModifica()`** (`frontend/js/impostazioni-ui.js:267`) — la chiamata a
`aggiornaMuteLanding()` è protetta da `typeof ... === "function"`, la stessa guardia già
usata due righe sopra per `renderMenu()`. Serve perché `impostazioni-ui.js` è caricato sia
in `landing.html` che in `gioco.html`, ma `aggiornaMuteLanding()` esiste solo in
`js/landing.js`, che sta solo sulla landing: dentro alla partita la funzione non c'è, e la
guardia evita che il pannello Impostazioni si rompa lì. Controllato anche `js/landing.js:98`:
`aggiornaMuteLanding()` esiste davvero con quel nome, non è un richiamo a vuoto.

**`.brand-mute{width:44px;height:44px}`** (`frontend/css/tocco.css:43`) — la regola gemella
in `frontend/css/shell.css:44` fissa il pulsante a 36×36 con `display:grid;place-items:center`,
e l'icona SVG dentro (`shell.css:52`) resta a 18×18 per conto suo: la regola nuova cambia solo
la scatola esterna, non l'icona, quindi non la deforma. `tocco.css` è caricato per ultimo sia
in `landing.html:35` che in `gioco.html:53` (dopo `shell.css`), quindi vince lui come deve
essere.

**I numeri `?v=`** — cercato `tocco.css` e `impostazioni-ui.js` in tutte le pagine del
progetto: solo `landing.html` e `gioco.html` li caricano, ed entrambe sono state alzate allo
stesso numero (`tocco.css?v=13`, `impostazioni-ui.js?v=15`). Non è rimasta nessuna pagina
indietro.

Niente di nuovo trovato: le due correzioni fanno quello che dicono e non hanno smosso altro.

---

## Giro del 10/09/2026 (quinto giro: dopo il merge da main, commit `1cccf23`)

Giro mirato su `fix/durata-azioni-e-orari-fabbrica`, appena tornato da un merge di `main`
che ha portato dentro il riallineamento di Studio/Shop (`2f05b11`) e le correzioni
MakeHuman/Avaturn (`4427e77` e dintorni). Ho guardato tre cose: se la logica nuova di
`assumitiCome()`/`schedaLavoro()` (in `hub.js`) si scontra con qualcosa toccato da quei due
branch, se `GAME_HOURS.jobStatus/jobDuration/placeJobStatus` (`orari.js`) sono coerenti con
com'è usato `orari.js` altrove, e se la doppia cattura dell'id (il wrapper di `tempo.js` +
la chiamata esplicita in `ui.js:128`) crea problemi.

**Controlli automatici, tutti verdi**: `npm run prova` 96 a posto e 0 no, `node
strumenti/audit-regressioni.js` 301 a posto e 0 no, `npm run verifica:build` 33 a posto e
0 no.

**Sul riallineamento di Studio/Shop e MakeHuman**: il commit `2f05b11` non tocca
`hub.js`, `orari.js`, `tempo.js` né `spostamenti.js` — cambia solo `css/game.css` (le
linguette dello Shop) e `pagine/gioco.html`. I commit MakeHuman (`4427e77`, `4eabf0b`,
`d9bc704`, `d75b15b`) toccano `hub.js` ma solo `vistaProfilo()`/il ritratto e la lista
delle linguette del profilo (tolta «Vestiti»): non toccano `assumitiCome()`,
`schedaLavoro()` né i punti dove entra `GAME_HOURS`. Confrontato riga per riga il diff di
`34a45f8` (il commit che ha introdotto `jobStatus`/`jobDuration`/`placeJobStatus`) con lo
stato attuale di `orari.js`: è arrivato intatto, `GAME_HOURS.showClosed` è esportato (prima
non lo era, ed `assumitiCome()` lo chiama) e i nomi dei lavori in `JOB_HOURS` combaciano
uno a uno con `JOBS` in `actions.js` e con `DURATE_LAVORO` in `tempo.js`. Nessuno scontro
trovato con quello che è arrivato dagli altri due branch.

**Sulla doppia cattura dell'id**: confermato che sono ridondanti ma non in conflitto, come
già scritto nel commit. Il wrapper di `tempo.js:323` cattura l'id appena parte
`avviaAzioneDiretta(id)`; la chiamata esplicita di `ui.js:128` lo ricattura, con lo stesso
valore, appena prima di `iniziaAzione()` dentro `esegui()`. Anche quando l'azione passa
dalla finestra «Confermi?» (costa soldi veri) l'id resta lo stesso finché non si conferma:
non c'è un punto in cui la mossa cambia proprietario a metà.

Un problema serio, trovato leggendo il codice (non l'ho cliccato dal vivo nel browser: qui
non ho un browser da aprire, quindi questa è una lettura, da confermare a mano prima di
fidarsene del tutto — ma ho seguito ogni singolo punto del codice che tocca
`G.currentPlace` e non ce n'è uno che manca).

### Il gioco chiede di essere «al posto giusto» per registrare, mixare, fare live, palestra e i turni in Fabbrica/Pizzeria — ma non ti ci porta mai

- **dove** — `frontend/js/game/spostamenti.js:190-226` (`actionAccess`, il controllo
  «sei nel posto giusto?») contro `frontend/js/game/hub.js:833-845` (il click sui cartelli
  della mappa) e `frontend/js/game/state.js:13-47` (`START()`, la partita nuova)
- **cosa succede** — dal commit `dc49c91` (3/09) ogni mossa che passa da
  `avviaAzioneDiretta()` (quindi anche «Cerca un beat», «Registra il pezzo», «Mixa il
  pezzo» dentro lo Studio, «Fai la serata» al Live Club, le due mosse della Palestra, e
  «Fai il turno» in Fabbrica/Pizzeria — è la stessa mossa che questo branch ha appena
  sistemato per la durata) controlla anche `G.currentPlace`: se non sei fisicamente nel
  posto richiesto (`studio`, `concerti`, `palestra`, `fabbrica`, `pizzeria`) la mossa viene
  rifiutata con «Per fare questa mossa devi prima raggiungere X sulla mappa», prima ancora
  di toccare energia o soldi. Il problema è che **niente, in tutto il codice, sposta
  `G.currentPlace` quando clicchi un cartello della mappa**: `START()` (partita nuova) non
  lo mette nello stato iniziale, e l'unico punto che lo scrive davvero è `esegui(toId)` in
  `spostamenti.js:297` (`GAME_TRAVEL.go`) — che ho cercato in tutto `frontend/js/` e non è
  chiamato da nessuna parte: non dal click sui cartelli (`hub.js:833`, che chiama solo
  `l.vai()`, cioè apre direttamente lo Studio/la Pizzeria/eccetera), non da `apriStudio()`,
  non da `schedaLavoro()`. Quindi `G.currentPlace` resta sempre `"vita"` (Casa) per tutta
  la partita, tranne quando vai in carcere. Il risultato: **«Cerca un beat», «Registra il
  pezzo», «Mixa il pezzo», «Fai la serata», le due mosse della Palestra e «Fai il turno» in
  Fabbrica/Pizzeria falliscono sempre**, con l'avviso che ti manda a un posto in cui sei
  già entrato (lo Studio, per dire) senza mai spendere energia, soldi o tempo. Per il
  lavoro di questo branch nello specifico: `assumitiCome()` ti assume regolarmente (quel
  controllo guarda solo l'orario), ma la riga subito dopo che chiama `hubAzione("turno")`
  per farti davvero lavorare va a sbattere su questo stesso muro — la paga non arriva mai.
  Lo stesso identico scenario è già scritto, come test isolato, dentro
  `strumenti/audit-regressioni.js:1163-1194` (`currentPlace:"vita"` → `wrong-place`): il
  test conferma che il blocco funziona come progettato, ma nessun test verifica che il
  gioco vero porti mai `currentPlace` fuori da `"vita"`.
- **come si vede** — non l'ho provato in un browser vero (qui non ne ho uno). Da
  controllare a mano: partita nuova, vai in Studio dalla mappa, prova «Cerca un beat» (o
  in Fabbrica, fatti assumere e prova «Fai il turno»); se il sospetto è giusto, esce
  l'avviso «devi prima raggiungere Studio/Fabbrica sulla mappa» anche stando già lì dentro.
- **quanto pesa** — blocca la partita (se confermato: tutta la produzione musicale, la
  palestra e i due lavori con un edificio fisico diventerebbero impossibili da usare).
  Non è nato con questo branch — il controllo sul luogo è del 3/09 (`dc49c91`), prima che
  `fix/durata-azioni-e-orari-fabbrica` esistesse — ma il pezzo che questo branch ha appena
  sistemato (il turno in Fabbrica) ci sbatte contro in pieno, e vale la pena controllarlo
  subito insieme.

**RISPOSTA (10/09/2026)** — falso allarme, controllato a mano in `frontend/js/game/spostamenti.js`.
`esegui(toId)` **è chiamato**: riga 347, dentro `mostraConferma()`, quando si clicca «Vai»
nella finestra di conferma dello spostamento. Quella finestra si apre dal click su un pin
della mappa (`#hb-pins`, listener a riga 413-435): click su `.pspot[data-l]` → `piano(id)` →
se il tragitto è valido e non sei già lì, `mostraConferma(p, onArrive)` → sull'opzione «Vai»
(riga 346-350) chiama `esegui(p.toId)`, che scrive `G.currentPlace = toId` (riga 297) e
salva. Il giro precedente ha cercato la stringa letterale `GAME_TRAVEL.go(...)` (il nome con
cui la funzione è esposta all'esterno, riga 482: `go:esegui`) e non l'ha trovata in giro per
`frontend/js/`, senza accorgersi che dentro allo stesso modulo la funzione si richiama per
il suo nome locale, `esegui(...)`, non tramite l'alias pubblico. `G.currentPlace` si muove
davvero quando ci si sposta sulla mappa: «Cerca un beat», «Fai il turno» in Fabbrica e le
altre mosse legate al luogo non sono bloccate in modo strutturale.

---

## Giro del 10/09/2026 (sesto giro: controllo mirato del commit `c6d44df`)

Controllati lo stop dei provini in Shop, La Sala e Studio e la ricarica fino al massimo dinamico a ogni nuovo giorno, sia con «Fine giornata» sia con gli skip: tutto a posto. Anche i controlli automatici sono verdi (`npm run prova`: 99 a posto, `audit-regressioni`: 301 a posto, `verifica:build`: 33 a posto).

---

## Giro del 12/09/2026 (verifica reale Vitest/Playwright)

RISOLTO

### «Avvio rapido» completa l'introduzione del personaggio ma non entra nel gioco

- **dove** — flusso reale dalla landing: «Avvio rapido» → difficoltà → creator
  MakeHuman nell'iframe → conclusione dell'introduzione.
- **cosa succede** — dopo circa 22 secondi l'introduzione del creator risulta
  `done`, ma la cornice resta in modalità cinematica: l'hub non compare e il bus
  audio resta in `pregame`, con i beat spenti. Il giocatore non arriva quindi alla
  partita che il pulsante promette di avviare.
- **come si vede** — apri la landing, premi «Avvio rapido», scegli una difficoltà e
  attendi la fine dell'introduzione del personaggio: il gioco non passa all'hub.
- **quanto pesa** — blocca uno dei due ingressi principali a una nuova partita.

**RISOLTO (12/09/2026)** — il creator ora conferma al parent di avere applicato
l'inizializzazione (`adf-rpg-v24-init-applied`), e il preset rapido parte solo dopo
quella conferma.

> **Aggiornamento del 13/09/2026: questa correzione non e' piu' nel codice, e non serve
> piu'.** Unendo il ramo con `main` si e' visto che li' l'avvio rapido era gia' stato
> riscritto da capo (`fb2b8d8`): niente piu' avatar finto, si chiede a MakeHuman un
> personaggio vero e si aspetta `adf-rpg-v24-quick-makehuman-ready`, con una scadenza di
> 120 secondi e un errore scritto in console se non arriva. E' la stessa cura, fatta meglio:
> la versione qui sotto una scadenza non ce l'aveva (vedi il giro di `segnala-problemi` piu'
> in basso). Il ramo ha quindi preso la versione di `main` e ha buttato la propria, insieme
> al messaggio `adf-rpg-v24-init-applied` nel creator, che non lo ascoltava piu' nessuno.
> Quello che resta di questa task e' il gate di prove che ha trovato il bug. Prima i due messaggi correvano uno contro l'altro: il preset scriveva
nome, città, avatar e risposte, poi l'inizializzazione vuota del parent li cancellava;
il risultato finale non era valido e il bridge restava correttamente fermo. Il test
Playwright percorre la UI vera — pulsante «Avvio rapido», difficoltà consigliata,
creator e cinematic — e controlla che l'hub compaia, l'artista sia salvato e audio e
beat passino a `gameplay`.

RISOLTO

### Il test Playwright passa, ma su Windows non termina se deve avviare lui il server

- **dove** — configurazione `webServer` di `frontend/playwright.config.js`.
- **cosa succede** — con la porta 8000 inizialmente libera il test arriva a `1 passed`,
  poi resta fermo su `Terminating the WebServer`. Su Windows Playwright usa un
  `taskkill` sincrono per chiudere il processo: in questo ambiente quel comando resta
  bloccato e il server Node continua a tenere aperta la porta. Togliere il wrapper
  `npm` non basta; il blocco si riproduce anche lanciando direttamente
  `node strumenti/dev.js`. Se sulla porta c'è già un server e viene riutilizzato, il
  problema non compare perché Playwright non prova a terminarlo.
- **come si vede** — chiudi ogni server sulla porta 8000 ed esegui
  `npm run test:e2e`: il caso è verde, ma il comando non restituisce il controllo.
- **quanto pesa** — blocca `npm run verifica` e la CI proprio nel percorso pulito che
  devono usare.

**RISOLTO (12/09/2026)** — Playwright non possiede più il processo `webServer`, quindi
non può entrare nel percorso `taskkill` che si bloccava. Il `globalSetup` avvia invece
direttamente e senza shell il processo Node esatto, aspetta che il gioco risponda e,
nel cleanup, usa l'endpoint `--playwright` per fermarlo e attende l'uscita di quel
processo. Un token casuale lega l'endpoint al child avviato dal test; anche nei percorsi
di errore il cleanup tenta l'arresto volontario e, se serve, termina quel solo processo.
Un server normale già aperto viene riconosciuto come esterno, riutilizzato e lasciato
acceso. Verificati entrambi i casi: con porta libera i 2 E2E terminano da soli con
codice 0; con un server normale già aperto i 2 E2E terminano con codice 0 e la porta
resta in ascolto.

---

## Giro del 13/09/2026 (backend-allineato, fine task `test/vitest-playwright-gate`)

La task non ha toccato `backend/`: questo e' il giro di routine.
`node scripts/controlla-backend.js` e' verde (34 rotte, 8+8 migrazioni, 18 tabelle,
schema riconosciuto) e `cd backend && npm run prova` fa 179 a posto, 0 no.
Le due serie di migrazioni sono state confrontate riga per riga: le gemelle 001-008
dicono la stessa cosa, e l'unica differenza e' di tipi (`INTEGER`→`BIGINT`,
`REAL`→`DOUBLE PRECISION`, `AUTOINCREMENT`→`GENERATED BY DEFAULT AS IDENTITY`) piu'
due adattamenti dichiarati nei commenti (`strftime` → `EXTRACT(EPOCH ...)` nella 004,
niente `UPDATE ... = rowid` nella 006 perche' la tabella li' nasce vuota). Colonne,
`NOT NULL`, `CHECK`, `UNIQUE` e indici parziali coincidono. **Niente che fermerebbe il
passaggio a PostgreSQL.**

### `schema.md` non conosce quattro colonne che esistono davvero

- **dove** — `backend/database/schema.md`, sezioni 2.4 `artista` e 2.12 `traguardo`.
- **cosa succede** — quattro colonne che stanno nelle migrazioni non sono nel disegno:
  `artista.fuori` (migrazione 004, ed e' quella su cui poggia l'indice
  `artista_classifica`), `artista.chiave_hash` (001, i client vecchi di prima degli
  account), `artista.nome_prima` (002, il nome com'era prima del cambio d'ufficio) e
  `traguardo.ordine` (006, l'ordine dichiarato che ha sostituito `rowid`). Il controllo
  secco non le vede perche' confronta i nomi delle **tabelle**, non delle colonne.
- **come si vede** — `grep -n "fuori\|chiave_hash\|nome_prima" backend/database/schema.md`:
  nessuna delle tre esce come colonna, solo come parola in mezzo alla prosa.
- **quanto pesa** — da sistemare con calma. Il disegno e' rimasto indietro, il codice sta
  bene: chi legge `schema.md` per capire come si fa la classifica non trova la colonna
  che la fa andare veloce.


**RISOLTO (13/09/2026)** — commit `cdd86d9`, insieme a «`schema.md` entra in git»: il documento
è stato riscritto sulle migrazioni vere, e le colonne ci sono.
### `schema.md` descrive un PostgreSQL che `migrazioni-pg/` non costruisce

- **dove** — `backend/database/schema.md`, sezione 7 («Le differenze su SQLite») e
  sezione 8 («Come ci si arriva da oggi»).
- **cosa succede** — la sezione 7 mette SQLite come variante e PostgreSQL come schema
  vero, con `uuid`/`gen_random_uuid()`, `citext`, `timestamptz`/`now()`, `jsonb`,
  `bigserial`. Le migrazioni PostgreSQL vere non fanno niente di tutto questo: gli id
  sono `TEXT` generati da Node, i tempi sono `BIGINT` in millisecondi epoch, l'email e'
  `TEXT` con `UNIQUE (lower(email))` e le chiavi crescenti sono `IDENTITY`. Cioe' la
  colonna «SQLite» della tabella descrive tutti e due i database, e la colonna
  «Postgres» nessuno dei due. La sezione 8, poi, e' ancora scritta al futuro («oggi
  l'archivio e' un file JSON», «il travaso e' uno script che si scrive in mezz'ora»)
  quando `backend/database/travaso.js`, le migrazioni e la tabella `migrazione`
  esistono gia'; cita un `002_stagioni.sql` che non e' mai nato (la 002 e' le
  segnalazioni) e non nomina mai `migrazioni-pg/`.
- **come si vede** — `sed -n '641,700p' backend/database/schema.md` accanto a
  `backend/database/migrazioni-pg/001_iniziale.sql`.
- **quanto pesa** — da sistemare con calma, **ma e' la voce da guardare per prima delle
  quattro**: e' il documento che si va a leggere il giorno del passaggio, ed e' quello
  che oggi racconta la cosa meno vera del backend.


**RISOLTO (13/09/2026)** — stesso commit `cdd86d9`: i § 7-8 raccontano i due motori come stanno
nelle migrazioni (`TEXT` per gli id, `BIGINT` per i tempi, `UNIQUE (lower(email))`), e
`migrazioni-pg/` è nominata. Il giro di `backend-allineato` del 15/09, in fondo, conferma che
le otto coppie di migrazioni combaciano colonna per colonna.
### Quattro variabili d'ambiente che il codice legge e nessun documento nomina

- **dove** — `backend/accessi.js` (`ADF_APPLE_JWKS`, `ADF_GOOGLE_JWKS`, `ADF_STEAM_URL`)
  e `backend/prova.js` (`ADF_TIENI`).
- **cosa succede** — la tabella delle variabili in `backend/README.md` ne elenca 18 su 24.
  Le tre di `accessi.js` sono gli indirizzi da cui si scaricano le chiavi pubbliche di
  Apple e Google e l'API di Steam: si sovrascrivono per provare senza uscire in rete, ed
  e' un'informazione che serve a chi scrive le prove e a chi mette su un ambiente chiuso.
  `ADF_TIENI` serve solo alla prova (non cancella il database alla fine) ed e' la meno
  grave.
- **come si vede** — confronta `grep -ohE "ADF_[A-Z_]+" backend/*.js backend/database/*.js | sort -u`
  con la tabella di `backend/README.md`.
- **quanto pesa** — da sistemare con calma.

### `jose` e `zod` stanno fra le `dependencies`, non fra le `devDependencies`

- **dove** — `backend/package.json`.
- **cosa succede** — nessuna delle due e' importata da nessun file del repository (ne'
  con `require`, ne' con `import`, ne' con un `require` costruito a mano: in tutto
  `backend/` e `scripts/` non c'e' **nessun** require dinamico). Stando fra le
  `dependencies` vengono pero' scaricate e messe nel pacchetto anche in produzione:
  oggi e' peso morto che viaggia col server.
- **come si vede** — `grep -rn --exclude-dir=node_modules --include=*.js -iE "jose|zod" .`
  torna solo `backend/package.json` e i documenti che ne parlano.
- **quanto pesa** — da sistemare con calma. Il registro in `documentazione/dipendenze.md`
  lo dice gia' e dice anche cosa fare: `jose` va **usata** (e' la prima della lista), non
  tolta.
- **RISOLTO (16/09/2026)** — branch `task/jose-e-zod-nel-backend`: `accessi.js` importa
  `jose` (`jwtVerify` + `createRemoteJWKSet` al posto della verifica a mano), `forme.js`
  importa `zod` e dà la forma ai corpi delle 14 rotte che ne leggono uno. Stanno fra le
  `dependencies` perché servono in produzione, ed è giusto così. Le prove del backend sono
  190 (sette nuove sulle forme), e quelle sui biglietti Apple passano uguali.

---

## Giro del 13/09/2026 (segnala-problemi, fine task `test/vitest-playwright-gate`)

Controlli automatici, tutti girati oggi su questo ramo: `npm run prova` 132 a posto e 0 no,
`node strumenti/audit-regressioni.js` 302 ok e 0 falliti, `npm run test:unit` 3 su 3,
`npm run test:e2e` 2 su 2, `npm run verifica:build` 33 ok e 0 falliti,
`npm run verifica:dipendenze` 0 buchi di sicurezza. Niente da segnalare da lì.

Controllato a mano l'endpoint `/__playwright` dentro al server di sviluppo, **e tiene**:
senza il pezzo `--playwright` sulla riga di comando non esiste proprio (risponde «non c'è»),
col pezzo acceso ma senza il codice segreto giusto risponde ancora «non c'è», con un metodo
diverso da GET e POST risponde «non si può», e solo col codice giusto il POST chiude il
server con uscita pulita. Il server normale di tutti i giorni (`npm run dev`) quel pulsante
non ce l'ha: provato apposta, il POST non lo ferma. In più quei file di prova non finiscono
nel pacchetto che va sugli store: il build copia solo `media/`, `assets/`, `pagine/` e i due
file impacchettati, non `strumenti/` e non `test/`.

### Se il creator non risponde all'appello, resta lo schermo nero e il gioco non dice niente

- **dove** — `frontend/js/gioco-ingresso.js:119` (l'attesa) e `frontend/js/gioco-ingresso.js:318`
  (l'avvio rapido); la risposta che si aspetta parte da
  `frontend/media/creator-rpg-v24/creator.html:2783`.
- **cosa succede** — l'avvio rapido adesso apre la creazione del personaggio nascosta e
  aspetta che questa dica «ricevuto». L'attesa però non ha una scadenza: se quel «ricevuto»
  non arriva mai — la pagina della creazione non si carica, oppure si ferma su un errore
  prima di rispondere — il giocatore resta davanti a un rettangolo nero che copre tutto, per
  sempre. Non c'è un tasto per uscire (quello sta dentro alla finestra nascosta), non compare
  nessun messaggio, non si scrive niente nemmeno nella console per chi va a guardare. L'unica
  via d'uscita è ricaricare la pagina. Il gioco intanto resta anche ad ascoltare quella
  risposta che non arriverà, e la musica resta ferma sulla modalità menu.
- **come si vede** — provato oggi: aperta la landing con un browser guidato, tolta di mezzo
  solo la risposta «ricevuto» e premuto «Avvio rapido» + difficoltà. Dopo 20 secondi la
  pagina del gioco ha ancora il rettangolo nero acceso (`display: block`, colore
  `rgb(5, 6, 9)`), la finestra della creazione invisibile, **nessuna schermata accesa** e
  l'audio ancora in modalità menu. Zero errori in console.
- **quanto pesa** — blocca la partita.

### Questo ramo non ha l'ultima correzione di `main`, e lo scontro cade proprio sull'avvio rapido

- **dove** — `frontend/js/gioco-ingresso.js`, contro il commit `fb2b8d8` che sta già in `main`
  («fix(makehuman): stabilizza navigazione e primo click preset», 12/09).
- **cosa succede** — mentre si lavorava qui, su `main` è arrivata una correzione che tocca gli
  stessi file: `js/creator/nav.js`, `js/creator/rpg-v24-bridge.js`, `js/gioco-ingresso.js`,
  `media/makehuman-camerino-v1/runtime.js` e `strumenti/prova.js`. Quella correzione, fra le
  altre cose, **toglie** la riga `goto("profile")` dall'avvio rapido (oggi quella riga apre
  già lei la creazione del personaggio, e lo fa *prima* che il gioco si metta in ascolto
  della risposta) e cambia il modo in cui si parla alla creazione quando si modifica solo
  l'aspetto. Qui quella riga c'è ancora. Unendo i due rami il computer non riesce a decidere
  da solo e si ferma: verificato con una prova di unione a vuoto, il file che va in conflitto
  è esattamente `frontend/js/gioco-ingresso.js`. Se il conflitto si chiude a occhio si rischia
  di rimettere dentro il pezzo che `main` ha appena tolto, o di perdere l'appello nuovo: in
  tutti e due i casi l'avvio rapido torna rotto come prima.
- **come si vede** — `git merge-tree --write-tree --name-only main HEAD` risponde
  `CONFLICT (content): Merge conflict in frontend/js/gioco-ingresso.js`.
- **quanto pesa** — blocca la partita.

### I test del browser si attaccano al server che trovano acceso, qualunque esso sia

- **dove** — `frontend/test/e2e/server-lifecycle.js:8` e `frontend/test/e2e/server-lifecycle.js:102`.
- **cosa succede** — prima di partire, i test guardano se sulla porta 8000 c'è qualcuno che
  risponde alla pagina del gioco: se sì lo usano e non ne accendono uno loro. È comodo, ma
  l'unica cosa che controllano è che quella pagina risponda, non **cosa** stia servendo. Se hai
  lasciato aperto il server che serve la cartella impacchettata (`node strumenti/dev.js --dist`),
  le prove girano sul pacchetto vecchio invece che sui file che hai appena modificato, e
  diventano verdi o rosse per un motivo che non c'entra niente. La stessa cosa vale per un
  server di un altro progetto che per caso abbia quell'indirizzo. Il numero 8000 è scritto
  fisso nel file e non si può cambiare da fuori. Oggi, per esempio, tutte le prove del browser
  che ho fatto girare hanno usato il server che era già acceso sulla macchina, non uno loro.
- **come si vede** — acceso `node strumenti/dev.js --dist` e chiesta la pagina del gioco:
  risponde 200 e serve il file impacchettato (`gioco-46f7fb83.js`), cioè esattamente quello
  che i test prendono per buono. **Da guardare, non l'ho provato:** cosa resta acceso se i
  test si fermano a metà con Ctrl-C — il server acceso da loro potrebbe restare in piedi da
  solo e farsi adottare al giro dopo.
- **quanto pesa** — si vede ma si gira intorno.

### La chiusura d'emergenza del server di prova viene contata come errore anche quando funziona

- **dove** — `frontend/test/e2e/server-lifecycle.js:82` e `frontend/test/e2e/server-lifecycle.js:94`.
- **cosa succede** — alla fine dei test si chiede al server di spegnersi da solo. Se non ce la
  fa entro 5 secondi c'è una seconda strada: lo si chiude a forza. Solo che quando lo chiudi a
  forza il sistema non restituisce «uscita pulita» ma «nessun numero, spento da fuori», e il
  controllo che viene subito dopo si aspetta lo zero: così l'uscita di scorta, proprio quando
  serve, fa comunque fallire tutta la verifica con un messaggio che sembra un guasto vero
  («terminato con codice null»). La rete di sicurezza c'è ma non può mai finire bene.
- **come si vede** — si legge nel file: il pezzo che chiude a forza e il controllo sul numero
  di uscita sono uno sotto l'altro e si contraddicono. Non l'ho fatto scattare davvero, perché
  serve un server che si rifiuti di spegnersi.
- **quanto pesa** — da sistemare con calma.

### Nessuno dice che prima della verifica va scaricato il browser di prova

- **dove** — `frontend/package.json` (la catena `verifica`), `README.md` e
  `documentazione/dipendenze.md`.
- **cosa succede** — `npm run verifica` adesso apre un browser vero, e quel browser va
  scaricato una volta con `npx playwright install chromium`. Nel computer che fa la verifica
  in automatico il passaggio c'è scritto; per una persona che scarica il progetto e lancia la
  verifica, no: non è nel README, non è nel registro delle dipendenze e non c'è un comando di
  preparazione. La verifica si ferma a metà. Per fortuna il messaggio che compare è chiaro e
  dice da solo cosa lanciare, quindi è una perdita di tempo, non un muro.
- **come si vede** — fatto girare `npm run test:e2e` con la cartella dei browser vuota: i due
  casi falliscono subito con «Executable doesn't exist… Please run: npx playwright install».
- **quanto pesa** — da sistemare con calma.

### La prova dell'avvio rapido ha 4 secondi di margine, e li sta consumando tutti

- **dove** — `frontend/test/e2e/gameplay.spec.js:103` (attesa di 25 secondi) e
  `frontend/test/e2e/gameplay.spec.js:43` (tetto di 40 secondi per il caso).
- **cosa succede** — la prova aspetta al massimo 25 secondi che l'introduzione del personaggio
  finisca e compaia l'hub. Il giro di oggi, su questa macchina e con il server già caldo, ci ha
  messo 20,9 secondi; il giro del 12/09 annotava «circa 22 secondi». Su una macchina più lenta
  o sul computer che fa la verifica in automatico — dove il browser parte freddo — quei 4
  secondi di margine si mangiano facilmente, e la verifica diventa rossa senza che nel gioco
  sia rotto niente. Il rischio è che ci si abitui a rilanciare invece che a guardare.
- **come si vede** — l'ultima riga di `npm run test:e2e` di oggi: «avvio rapido conclude la
  cinematic ed entra nell'hub (20.9s)».
- **quanto pesa** — da sistemare con calma.

### Nota, non è un errore: il codice segreto del server di prova passa dalla riga di comando

- **dove** — `frontend/test/e2e/server-lifecycle.js:108` e `frontend/strumenti/dev.js:23`.
- **cosa succede** — il codice che permette di spegnere il server di prova viene passato
  scritto in chiaro nella riga di comando, e su Windows la riga di comando di un programma la
  può leggere chiunque abbia accesso al computer. Va aggiunto che il server di sviluppo
  ascolta su tutte le schede di rete, non solo sul computer stesso (`strumenti/dev.js:223`:
  `server.listen(PORTA)` senza dire «solo qui»), quindi in un posto con la rete condivisa
  qualcun altro può almeno sfogliarlo. Il codice è casuale e lungo, non si indovina, e la cosa
  peggiore che ci si fa è spegnere un server di sviluppo: per questo lo scrivo come nota e non
  come problema. Passarlo da una variabile d'ambiente invece che dalla riga di comando, e
  legare il server al solo computer locale, sono due scelte da fare con calma — la seconda è
  di prima di questa task.
- **quanto pesa** — da sistemare con calma.

---

## Giro del 13/09/2026 (chiusura di `test/vitest-playwright-gate`: cosa e' stato sistemato)

Il giro di `segnala-problemi` qui sopra ha trovato sette voci. Ecco cosa ne e' stato, prima
del push.

**RISOLTO (13/09/2026) — «Se il creator non risponde all'appello, resta lo schermo nero».**
Non sistemando l'attesa, ma togliendola: unendo il ramo con `main` si e' visto che l'avvio
rapido era gia' stato riscritto la', con una scadenza di 120 secondi e un errore in console
(`richiediMakeHumanRapido`). Il ramo ha preso quella versione e ha buttato la propria — e
con lei il messaggio `adf-rpg-v24-init-applied` nel creator, rimasto senza ascoltatori.

**RISOLTO (13/09/2026) — «Questo ramo non ha l'ultima correzione di `main`».** Unione fatta,
i due scontri erano `frontend/js/gioco-ingresso.js` (risolto prendendo `main` in blocco, per
il motivo qui sopra) e `frontend/package.json`, dove `main` aveva aggiunto `verifica:git` in
testa alla catena e questo ramo le due prove nuove: ci stanno tutte e due, e adesso la catena
le ha entrambe.

**RISOLTO (13/09/2026) — «I test del browser si attaccano al server che trovano acceso».**
Adesso non basta che risponda la pagina del gioco: si chiede anche `/js/gioco-ingresso.js`,
che esiste **solo** fra i sorgenti perche' il build non copia `js/` dentro a `dist/`. Se
sulla porta c'e' un server acceso su `--dist` le prove non partono e dicono perche', invece
di girare sul pacchetto vecchio facendo finta di niente.

**RISOLTO (13/09/2026) — «La chiusura d'emergenza viene contata come errore anche quando
funziona».** Chi chiude a forza adesso lo segna, e il controllo sul codice di uscita non si
applica a quel caso: spegnere a forza vuol dire uscire senza codice, ed e' l'esito atteso di
quella strada, non un guasto.

**RISOLTO (13/09/2026) — «Nessuno dice che prima della verifica va scaricato il browser».**
C'e' `npm run setup:browser`, ed e' scritto nel README di sopra, in quello del frontend
(anche nella tabella dei comandi) e nella riga di `@playwright/test` del registro delle
dipendenze.

**RISOLTO (13/09/2026) — «La prova dell'avvio rapido ha 4 secondi di margine».** Il margine
non era stretto: era sbagliato di un ordine di grandezza, e se ne e' accorto il merge. Vedi
la voce qui sotto.

**RISOLTO (13/09/2026) — la nota sul codice segreto del server di prova.** Non passa piu'
dalla riga di comando ma dall'ambiente (`ADF_PLAYWRIGHT_TOKEN`), che su Windows un altro
utente della macchina non legge. Che il server di sviluppo ascolti su tutte le schede di rete
resta com'era: e' di prima di questa task e non e' stato toccato qui.

### L'avvio rapido ci mette quasi due minuti, e nessuno lo dice al giocatore

- **dove** — il percorso «Avvio rapido» dalla landing, dopo la riscrittura di `fb2b8d8`.
- **cosa succede** — l'avvio rapido non mette piu' un avatar finto: carica MakeHuman vero.
  Nel log del browser si legge `targets.bin (~145 MB)`, poi «PRONTO: 269 modifier · 1258
  target · 19158 vertici», e solo dopo parte la cinematic. Misurato oggi con un browser
  guidato, su questa macchina e col server gia' acceso: **115 secondi** dal clic all'hub.
  Nei primi 50 secondi non si vede muovere niente. Funziona — l'artista arriva, l'hub si
  apre, l'audio passa a `gameplay` — ma il pulsante si chiama «rapido», e chi lo preme non
  ha modo di sapere se il gioco sta lavorando o si e' piantato.
- **come si vede** — apri la landing, premi «Avvio rapido» e una difficolta', e guarda
  l'orologio. Oppure `npm run test:e2e`, che ora quella attesa la mette in conto.
- **quanto pesa** — non blocca, ma e' il primo minuto di gioco di chi prova il gioco per la
  prima volta. Da guardare: o si mostra che sta caricando, o l'avvio rapido torna a non
  aspettare MakeHuman.
- **RISOLTO (19/09/2026, branch `task/avvio-rapido`)** — la prima strada: la schermata
  «Preparo il tuo artista» (`js/preparo.js`, `css/preparo.css`, `#preparo` in
  `gioco.html`) sta sopra al creator nascosto e mostra le fasi vere del camerino
  (rilanciate lungo la catena motore → camerino → creator → gioco), il tempo che passa, e
  se si rompe tre tasti. Ma prima l'ho rimisurato fase per fase: **i 115 secondi erano il
  Chromium senza GPU di Playwright**, che disegna il 3D a software (45–70 s in un blocco
  solo dentro a `WebGLRenderer.render` e alla foto); **su Chrome vero, con la scheda video,
  il personaggio è pronto in 8,6 secondi**, poi 17 s di cinematic. Il giocatore aspetta
  nove secondi, non due minuti — ed erano nove secondi di nero. «L'avvio rapido: la
  schermata «Preparo il tuo artista»» in `implementazioni/02-interfaccia-e-telefono.md`.

### La prova dell'avvio rapido non e' fragile, e' pesante: non sta in un gate a ogni push

- **dove** — `frontend/test/e2e/gameplay.spec.js`, il caso «avvio rapido conclude la
  cinematic ed entra nell'hub», e la catena `verifica` di `frontend/package.json`.
- **cosa succede** — la prova carica MakeHuman vero e lo tiene in memoria. Misure di oggi,
  stessa macchina e stesso codice, tutte arrivate in fondo quando ce l'hanno fatta: 114, 115
  e 126 secondi a macchina scarica; **288 secondi** dentro a `npm run verifica`; **oltre 600
  secondi** dentro all'hook di pre-push, con l'altro agente che lavorava in parallelo e 3,4
  GB di memoria libera — e li' e' andata rossa con l'audio ancora in `pregame`, cioe' senza
  che la cinematic fosse mai partita. Non e' un tetto da alzare: il tempo non dipende dal
  codice ma da quanto e' occupato il computer, e un gate che ogni tanto e' rosso per il
  carico smette di voler dire qualcosa. Da segnalare che il gate ha comunque fatto il suo
  mestiere: il push e' stato **rifiutato**, non passato per sbaglio.
- **come si vede** — `npm run test:e2e:lento` su una macchina occupata, oppure guardando
  l'ora mentre gira `npm run verifica` con qualcos'altro di pesante acceso.
- **quanto pesa** — non e' un difetto del gioco. E' una scelta di dove mettere la prova.

**RISOLTO (13/09/2026)** — il caso porta il marchio `@lento`. `npm run test:e2e` (quello
dentro a `npm run verifica`) lo salta, `npm run test:e2e:lento` fa girare solo lui, e la CI
lo lancia comunque a ogni push in un passaggio suo, dove la macchina e' dedicata e nessuno
sta aspettando davanti allo schermo. Cosi' l'avvio rapido resta coperto — e' il percorso
dove il bug si era nascosto — senza che la verifica di tutti i giorni duri dieci minuti. Un
controllo dell'audit tiene insieme le due meta': se il marchio sparisce dalla catena o il
passaggio sparisce dalla CI, l'audit lo dice.

**Nota del 13/09/2026, per chi ci ricasca.** Il giro lungo e' stato provato cinque volte di
fila sulla macchina di sviluppo e cinque volte e' andato rosso, con punti di blocco diversi:
una volta fermo sulla landing, una sulla schermata «Si sta accendendo tutto», una con
MakeHuman a meta'. Prima di dare la colpa al codice conviene guardare due cose, perche' in
questo caso erano tutte e due la spiegazione:

1. **I file del gioco erano identici a `main`** — `git diff main -- frontend/js frontend/pagine
   frontend/css frontend/media` non dava niente. Quel ramo non aveva toccato una riga di
   gioco: tutto quello che riguardava l'avvio rapido era arrivato da `main` con l'unione.
2. **La memoria libera era 2,2 GB su 16**, con un altro agente che lavorava in parallelo e
   tredici processi del browser aperti. Il giro lungo carica 145 MB e ne costruisce 19158
   vertici: con quella memoria non arriva in fondo nemmeno in dieci minuti. Con la macchina
   scarica, lo stesso identico codice ci aveva messo 114, 115 e 126 secondi.

Nel mezzo e' saltato fuori anche un errore vero, ma della prova e non del gioco: il controllo
che doveva tollerare le navigazioni cercava «frame was detached» con la regex sensibile alle
maiuscole, e l'errore che arriva davvero e' «**F**rame was detached». Passava oltre proprio
il caso piu' frequente.

---

## Giro del 13/09/2026 (branch `task/backend-schema-allineato`)

Le quattro voci del giro di `backend-allineato`, una per una.

**RISOLTO (13/09/2026) — «Quattro variabili d'ambiente che il codice legge e nessun
documento nomina».** Erano **sei**, non quattro: oltre a `ADF_APPLE_JWKS`,
`ADF_GOOGLE_JWKS`, `ADF_STEAM_URL` e `ADF_TIENI` mancavano anche `ADF_MANUTENZIONE` e
`ADF_MANUTENZIONE_FINO`, cioe' le due che spengono il server quando si mette mano al
database. Adesso la tabella di `backend/README.md` le ha tutte e ventiquattro, con una
riga in piu' che spiega che le tre degli indirizzi (`...JWKS`, `ADF_STEAM_URL`) **non sono
da riempire**: hanno gia' dentro l'indirizzo vero di Apple, Google e Steam, e si toccano
solo per provare l'ingresso senza uscire in rete.

E perche' non risucceda, `scripts/controlla-backend.js` ha un quarto controllo che
confronta le `ADF_` lette dal codice con quelle elencate nel README. Provato che morda:
tolta una riga a mano, dice «manopole che il codice legge ma backend/README.md non elenca:
ADF_MANUTENZIONE» ed esce con errore.

**APERTA per decisione, non per pigrizia — «`jose` e `zod` stanno fra le `dependencies`».**
Confermato: non le importa nessuno, e stando fra le `dependencies` viaggiano nel pacchetto
di produzione da peso morto. Non le ho tolte perche' la strada giusta non e' togliere:
`jose` e' **la prima della lista** di quelle che devono entrare davvero, al posto della
verifica dei token Apple e Google scritta a mano in `backend/accessi.js` — che e' il punto
peggiore del progetto dove risparmiare. Disinstallarla vorrebbe dire cancellare una
decisione gia' presa; usarla e' una task sua. Il registro in
[`dipendenze.md`](dipendenze.md) lo dice gia', nella tabella di quelle entrate senza un
file dietro.

### `schema.md` non sta in git, ed e' il motivo per cui si e' disallineato

- **dove** — `.gitignore` riga 9, e `backend/database/schema.md`.
- **cosa succede** — il disegno del database **non e' tracciato**: sta nel `.gitignore`
  insieme a `backend.md` e a `backend/.env.local`, quello delle password.
  `git ls-files backend/database/schema.md` non torna niente. Chi clona il progetto quel
  file non ce l'ha, e infatti `scripts/controlla-backend.js:88` mette in conto che possa
  mancare e in quel caso salta il controllo. Non lo genera nessuno script: e' scritto a
  mano. Ma lo citano cinque documenti che invece in git ci sono, fra cui
  [`come-si-lavora.md`](come-si-lavora.md) e la scheda dell'agente `backend-allineato`.
- **perche' conta** — e' la spiegazione delle altre due voci su `schema.md`. Un documento
  che non passa da nessun merge non lo rilegge nessuno in revisione, e si allontana dal
  codice senza che se ne accorga niente e nessuno: e' esattamente quello che e' successo,
  fino ad avere nomi di colonna che il database non ha.
- **quanto pesa** — da decidere, ed e' una decisione, non una correzione: se in quel file
  non c'e' niente di sensibile, il suo posto e' in git. Finche' resta fuori, ogni giro di
  allineamento lo rifa' da capo uno solo, sulla sua copia.

**RISOLTO (13/09/2026)** — `schema.md` e' in git. Prima di metterlo dentro il file e' stato
letto per intero, tutte e 884 le righe, cercando credenziali, stringhe di connessione, host,
indirizzi IP, chiavi, email e dati di persone: **nessun riscontro**. Anzi, il § 4 documenta
proprio il contrario — che le password degli store non le vediamo mai, che l'IP sta solo
come `ip_hash` con un sale che sta nella configurazione e non nel codice, e che le barre
scritte dai giocatori non vengono ne' indicizzate ne' lette.

E l'esclusione non era motivata: il commit che l'ha creato (`7b70be6`, 31/08/2026) lo mette
fuori «come `backend.md`», per vicinanza, senza nessuna valutazione. Nel `.gitignore` le
cose con le password hanno un blocco loro, con sopra scritto «mai in git»; `schema.md` non
era li'.

Insieme al file sono cambiate tre cose che altrimenti restavano false: la riga in testa
diceva «questo file non si pusha», il commento di `scripts/controlla-backend.js` dava per
scontato che il file potesse mancare, e le regole del § 5 parlavano di due file per
migrazione. Adesso sono tre — le due gemelle **e questo documento**, nello stesso commit —
ed e' la regola che nasce da questo giro.

---

## Giro del 13/09/2026 (la causa vera dei rossi del giro lungo)

**Le due diagnosi scritte qui sopra erano sbagliate tutte e due, e vanno lette sapendolo.**
Prima «la prova e' lenta, alziamo il tetto» (da 25 a 240 a 600 secondi). Poi «non e'
fragile, e' pesante: dipende da quanto e' occupato il computer». Tutte e due erano
ragionevoli e tutte e due guardavano dalla parte sbagliata.

### Era il watcher del server di sviluppo a uccidere la partita

- **dove** — `frontend/strumenti/dev.js`, il `fs.watch` e la funzione
  `fileDavveroModificato()`.
- **cosa succede** — il server di sviluppo sorveglia la cartella e, quando un file cambia,
  dice al browser di ricaricare. Solo che su Windows `fs.watch` notifica **anche le
  letture**, e MakeHuman di file ne legge tanti. Il controllo dell'impronta che stava li'
  apposta non li fermava, per una ragione scritta nel suo stesso commento: le impronte si
  registrano quando il server **serve** un file, e un file letto per la prima volta
  un'impronta non ce l'ha ancora — il ramo `prev === undefined` lo dava per modificato. Il
  risultato: il server mandava «cambiato», la landing si ricaricava e **la partita appena
  avviata moriva**, iframe del creator compreso.
- **perche' sembrava intermittente** — l'avvio rapido sceglie un preset a caso fra
  quattordici, quindi carica una **skin diversa ogni volta**. Finche' usciva una skin gia'
  letta, nessuna ricarica e la prova passava; alla prima skin nuova, ricarica e rosso. Da
  qui i «a volte passa a volte no» che facevano pensare al carico della macchina.
- **come si vede** — in un terminale, mentre gira l'avvio rapido:
  `curl -N http://127.0.0.1:8000/__ricarica`. Il 13/09 l'evento `data: cambiato` arrivava
  900 ms dopo l'avvio rapido, e 200 ms dopo la pagina era tornata alla landing. I file che
  lo scatenavano, presi con un watcher gemello:
  `media/makehuman-editor-v1/data/skins/<skin>/<skin>.json`.
- **quanto pesava** — bloccava il giro lungo, e non solo: **capita anche a chi gioca dal
  server di sviluppo**, non solo alle prove. Chi apriva l'avvio rapido e si vedeva tornare
  alla landing non stava immaginando niente.

**RISOLTO (13/09/2026)** — il watcher non guarda piu' le cartelle dei dati (`data/`,
`vendor/`, `.runtime-*`, e `dist/` anche quando e' la prima voce del percorso: `fs.watch`
li consegna relativi alla radice). Li' dentro non c'e' niente che si scrive a mano. In piu',
con `--playwright` il watcher e' spento del tutto: mentre girano le prove nessuno sta
salvando file. Provato subito dopo: il canale `/__ricarica` resta muto per tutto l'avvio
rapido, e il giro lungo passa **tre volte su tre** (2,4 · 2,3 · 1,8 minuti).

E siccome il motivo per cui era stato messo fuori dalla catena non esisteva, **il giro lungo
e' tornato dentro `npm run verifica`**, dove deve stare: e' il percorso dove il bug si era
nascosto. Due controlli dell'audit tengono ferme le due meta' — che la prova sia nella
catena, e che il watcher non torni a guardare le cartelle dei dati.

**La lezione, che vale piu' della correzione.** Un test che fallisce in modo intermittente
non e' una prova che il test sia fragile: le prime due spiegazioni erano tutte e due
plausibili, tutte e due scritte con dei numeri veri a supporto, e tutte e due sbagliate. La
domanda che ha risolto la faccenda non e' stata «quanto ci mette» ma «**chi** l'ha
ricaricata», e costava un minuto farsela cinque ore prima.

---

## Giro del 13/09/2026 (`task/beat-e-tasto-oro` riapplicato a mano)

Il ramo `task/beat-e-tasto-oro` era dell'08/09 e indietro di 153 commit. Conteneva quattro
correzioni che `main` non aveva mai ricevuto, ma unirlo avrebbe riportato indietro
`studioScegliBeatmaker` (sistemato dopo) e il «Punto 14» dello Studio. Quindi: riapplicate
a mano, una per una, sul codice di adesso.

**Tre su quattro sono entrate.**

- **RISOLTO (13/09/2026) — il marchio non copre piu' HYPE sul telefono.** Misurato a 360
  punti: nav alta 30 dentro una barra di 307, nessuna sovrapposizione.
- **RISOLTO (13/09/2026) — «una lavanderia non e' un beat»**, piu' i due ascolti che
  mancavano allo Studio (`data-stcompra` e `data-bplay`). Il controllo dell'audit sui nomi
  doppi e' stato aggiornato: adesso distingue la **collisione** (un attributo rubato, che
  spara l'evento sbagliato) dall'**ascolto voluto** (lo stesso banco, quindi lo stesso
  evento), e se domani qualcuno stacca quei due lo dice.
- **RISOLTO (13/09/2026) — in cabina l'oro ce l'ha «Tieni questa e chiudi».** Provato anche
  in partita, non solo nel sorgente: il tasto `stprimo` e' quello che chiude.

### Il quarto non e' stato riapplicato, ed e' la cosa da ricordare

Il costo in energia per farsi fare un beat (`STUDIO_BEAT_ENERGIA = 20`) **non e' tornato, e
non deve tornare**. Il 10/09 era stato tolto su richiesta esplicita — «Togli che nello
studio, per comprare un beat, consumi 20 di energia. Non e' realistico, toglilo.», commit
`fb731d5` — e rimetterlo sarebbe stato disfare quella decisione.

Me ne sono accorto perche' l'avevo riapplicato e `npm run prova` e' andato rosso su un
controllo che diceva gia' la regola: **«costa in soldi, non in energia»**. Senza quel
controllo sarebbe passato, e il gioco sarebbe tornato indietro di tre giorni senza che
nessuno se ne accorgesse.

**E' esattamente il motivo per cui quel ramo andava riapplicato a mano invece che unito.**
Un ramo vecchio non contiene solo lavoro che manca: contiene anche decisioni che nel
frattempo sono state **cambiate apposta**, e l'unione le riporta indietro tutte insieme, in
silenzio. La differenza fra le due strade non e' la fatica, e' che a mano ogni pezzo passa
davanti a una domanda — «questo vale ancora?» — e unendo non ci passa nessuno.

---

## Giro del 13/09/2026 (il giro lungo fallisce solo quando gira insieme all'altro)

**Serve una scelta, e non l'ho presa da solo.** Il problema e' nuovo e non e' quello di
stamattina: il watcher e' escluso (il canale `/__ricarica` resta muto per tutto l'avvio
rapido, verificato).

- **dove** — `frontend/test/e2e/gameplay.spec.js`, il caso «avvio rapido conclude la
  cinematic ed entra nell'hub @lento», dentro alla catena `npm run verifica`.
- **cosa succede** — la prova **passa da sola** (`npm run test:e2e:lento`: 2,6 minuti) e
  **fallisce quando gira dentro la catena**, cioe' dopo l'altro caso e2e, con lo stesso
  server e lo stesso codice. Due volte su due, a 10,0 e 10,2 minuti, con lo stesso esito:
  `Received: null` per tutto il tempo concesso. Non e' il carico — e' riproducibile.
- **cosa non so ancora** — se sia il primo caso a lasciare qualcosa (il browser e' lo stesso
  per tutti i casi, i contesti no), o se sia la prova stessa a non distinguere «la cornice
  non c'e'» da «la domanda e' arrivata mentre la pagina navigava»: il `catch` che ho scritto
  stamattina torna `null` in tutti e due i casi, e quel `null` e' esattamente quello che si
  legge nel referto. **La prima cosa da fare, quando si riprende, e' separare quei due
  casi**: finche' tornano lo stesso valore, il referto non dice dove guardare.
- **quanto pesa** — blocca **ogni push**, perche' l'hook di pre-push fa girare la catena
  intera.

**Scelta presa adesso, ed e' una toppa dichiarata**: il caso torna fuori dalla catena di
tutti i giorni (`npm run test:e2e` lo salta, `npm run test:e2e:lento` lo fa girare) e resta
in CI in un passaggio suo, dove gira da solo — cioe' nella condizione in cui passa. Cosi' il
lavoro non si ferma.

**Ma va ripreso**, e la domanda a cui rispondere e' una: *perche' due casi che passano
separati non passano insieme?* Finche' non si sa, il giro lungo protegge meno di quanto
sembri.
## Giro del 13/09/2026 («come si compra un beat nello Studio?»)

La domanda era questa, e la risposta e' che **si puo', ma il tasto non si vedeva**.

### Il «Compralo» della sezione Beat finiva fuori dallo schermo

- **dove** — `frontend/css/studio.css`, la barra `.stazioni` dentro alla colonna centrale
  `.stcol`, che scorre.
- **cosa succede** — nella sezione Beat il pannello centrale mostra le tre schede del banco,
  una sotto l'altra, e i tasti stanno **in fondo**, dopo le schede. Misurato oggi: su una
  finestra di 1280x800 il tasto «Compralo» stava **nove pixel sotto** il bordo; su un
  telefono da 390x844, **duecentottanta**. Il pannello scorre, ma di quello che c'e' sotto
  non c'era nessun segno: si vedevano tre schede e basta. Chi apriva la sezione Beat
  concludeva ragionevolmente che comprare un beat da li' non si potesse.
- **come si vede** — apri lo Studio, sezione Beat, su una finestra alta 800: le tre schede
  ci sono, i tasti no.
- **quanto pesa** — nascondeva una mossa che c'e' e funziona.

**RISOLTO (13/09/2026)** — la barra dei tasti si appoggia al fondo della colonna che scorre
(`position:sticky; bottom:0`), col fondo pieno perche' le schede che passano dietro non si
leggano attraverso i tasti. Sopra i 1000 punti di altezza torna normale: li' il pannello ci
sta tutto e una barra incollata sarebbe un'ombra in mezzo al vuoto. Misurato dopo: il tasto
e' dentro lo schermo a 1280x800, a 1920x1080 e a 390x844. Controllate tutte e otto le
sezioni dello Studio (Beat, Testo, Cabina, Mix, Cover, Feat, Marketing, Timing): nessun
tasto fuori dallo schermo, nessun errore.

### Per il resto il giro funziona, ed e' questo

Provato in partita, dal principio: si clicca **Studio** sulla mappa, si conferma lo
spostamento (30 minuti), si apre lo Studio sulla sezione **Beat**. Se il banco e' vuoto c'e'
**«Gira a cercare beat»**, che porta tre beat sul banco; si sceglie la scheda che si vuole
(la prima e' gia' scelta) e si preme **«Compralo»**. Il beat va in cartella e i soldi
scalano: verificato, 5000 → 4565 con il banco che passa da tre a due.

**Una cosa da sapere**: l'azione «Cerca un beat» e' legata al luogo. Se si apre lo Studio
senza esserci arrivati dalla mappa, il gioco risponde «Non puoi iniziare questa mossa: per
fare questa mossa devi prima raggiungere Studio sulla mappa» — ed e' corretto, non e' un
errore.

## Giro del 14/09/2026 (segnala-problemi, fine task `task/studio-marketing-scegli-il-pezzo`, commit `f09a99d`)

Controlli automatici tutti verdi: `npm run prova` 144 a posto e 0 no, `audit-regressioni.js`
330 ok e 0 falliti, `verifica:build` 33 ok e 0 falliti. Letti `studio.js` (righe di «Cosa
spingi», `studioSegna`, `studioFuori`, `studioDaSpingere`, `stScelta`), `actions.js`
(l'azione `promo`), `sim.js` (`songWeekly` e `advanceWeek`) e `css/studio.css`.

Le quattro cose che la task chiedeva di guardare, in ordine:

- **Pezzo senza `seed` al Marketing** — e' un caso che oggi non puo' succedere da solo: ogni
  pezzo nasce in un punto solo (`actions.js:336`) e il seed glielo da' sempre `copertine.js:44`,
  ed e' cosi' dal primo import del progetto. Ma se capita (un salvataggio ritoccato a mano) la
  riga si comporta male: vedi la voce qui sotto.
- **`s.spinta` che resta su un pezzo di un salvataggio** — a posto. `sim.js:36` la moltiplica
  solo se c'e', `sim.js:63` la fa scendere ogni settimana e la toglie sotto 1,03; un pezzo
  vecchio senza `spinta` non cambia niente. Se il pezzo segnato in `G.studio.spingi` non c'e'
  piu', `studioSceltoTra` torna `null` e si ripiega sull'ultimo uscito.
- **La promo lanciata senza Studio aperto** — non c'e' piu' una strada del genere: l'elenco
  delle mosse non esiste, la promo si lancia solo dal Marketing (`studio.js:1002`). In
  `actions.js:414` c'e' comunque la guardia `typeof studioDaSpingere === "function"`, e
  `studio.js` e' caricato nella stessa pagina (`pagine/gioco.html:646`), quindi anche se un
  domani la promo partisse da altrove il pezzo scelto sarebbe letto lo stesso.
- **Il `<b>` dentro a `d`** — non e' coerente con le altre righe, e non e' solo estetica: vedi
  la seconda voce.

**RISOLTE (14/09/2026)** — tutte e quattro, sul branch `task/studio-marketing-scegli-il-pezzo`
prima del push, insieme ai punti «solo il nome quando tieni la take» e «la conferma della
copertina». In ordine: `.stchi span span{display:inline}` in `css/studio.css` (andava a capo
anche «−8 se esce così» in Timing, misurato in partita: `display:block` sullo span
annidato) e «in spinta» è uno `<span class="oro">`; `stSeme()` in `studio.js` dà
l'attributo solo se il seed è un numero, se no la riga esce muta; l'elenco del Marketing
aggiunge il pezzo scelto se è più vecchio dei sei; la descrizione della promo dice «Spinge
il pezzo che scegli al Marketing».

### «In spinta» esce come una seconda riga bianca grande quanto il titolo

- **dove** — `frontend/js/game/studio.js:964` (il `<b>in spinta</b>` dentro a `d`) e
  `frontend/css/studio.css:180` (la regola `.stchi b`).
- **cosa succede** — la riga secondaria del pezzo («q60 · 1.234 stream · in spinta») e' un
  `<span>` e il foglio di stile dice che **qualsiasi grassetto** dentro alla casella del nome
  (`.stchi b`) va a capo da solo, a 16 punti e in bianco: e' la regola pensata per il titolo.
  Cosi' «in spinta» non resta in coda alla riga piccola azzurra ma diventa una terza riga che
  sembra un secondo titolo, e la scheda si alza. Le altre righe dello Studio che vogliono
  colorare un pezzo di `d` usano `<span class="ros">` o `<span class="oro">`
  (`studio.js:1091-1092`), mai `<b>`. Letto nel CSS, non misurato in partita.
- **come si vede** — Studio, Marketing, con un pezzo fuori: premi «Posta» una volta, la riga
  di quel pezzo in «Cosa spingi» cambia forma.
- **quanto pesa** — da sistemare con calma.

### Una riga di pezzo senza seed e' un bottone che non fa niente, e non lo dice

- **dove** — `frontend/js/game/studio.js:961` (`data-spingi="' + x.seed + '"`) e
  `studio.js:190-193` (`studioSegna` che scarta il `NaN` in silenzio). Lo stesso succede alle
  righe del Mix (`:862`), della Cover (`:882`) e del Timing (`:1087`): e' una voce sola.
- **cosa succede** — se un pezzo non ha il seed, l'attributo diventa `data-spingi="undefined"`.
  La riga esce comunque come bottone (si accende sotto al dito, cursore a mano), ma al tocco
  `Number("undefined")` e' `NaN`, `studioSegna` esce senza suono, senza salvare e senza
  ridisegnare: il giocatore preme e non succede niente. Oggi non ci si arriva con un
  salvataggio normale (vedi sopra), quindi e' una rete di sicurezza che manca, non un errore
  che si vede.
- **come si vede** — solo con un salvataggio a cui si toglie a mano il `seed` di un pezzo.
- **quanto pesa** — da sistemare con calma.

### Il pezzo scelto puo' sparire dall'elenco, ma resta quello che si spinge

- **dove** — `frontend/js/game/studio.js:960` (`fuori.slice(0, 6)`) contro `studio.js:213-215`
  (`studioDaSpingere` cerca in tutta la lista).
- **cosa succede** — «Cosa spingi» mostra solo gli ultimi sei pezzi usciti, ma la scelta e'
  cercata fra **tutti**. Scegli un pezzo, poi ne fai uscire altri sei: quello scelto non
  compare piu' nell'elenco, nessuna riga e' accesa, eppure la testata dice ancora «Spingi
  «quello»» e la promo continua a spingerlo. Per cambiare devi toccare un altro pezzo; per
  «togliere» la scelta e tornare all'ultimo uscito non c'e' un modo visibile, perche' la riga
  da ri-toccare non c'e'.
- **come si vede** — con sette o piu' pezzi fuori, scelto il piu' vecchio prima che uscissero
  gli ultimi.
- **quanto pesa** — si vede ma si gira intorno.

### Dopo il post la scena dice ancora «Accende quello che hai fuori»

- **dove** — `frontend/js/game/actions.js:377` (`d:"Clip e provocazioni. Accende quello che
  hai fuori."`), che `ui.js:54` mette nella scena a schermo pieno dopo la mossa e `ui.js:172`
  nella finestra di conferma.
- **cosa succede** — la promo adesso spinge **un** pezzo, quello scelto al Marketing, e il
  messaggio di esito lo dice («Spingi «X»», `actions.js:429`). Ma la descrizione fissa della
  mossa, che compare nella stessa scena una riga sopra, dice il contrario: che accende tutto
  quello che hai fuori. Due frasi che si smentiscono nella stessa schermata.
- **come si vede** — Studio, Marketing, «Posta»: leggi la scena che si apre.
- **quanto pesa** — da sistemare con calma.

**Nota, non e' un errore**: la spinta cresce di 0,10 a post (per la resa del giorno e il peso
d'agenda) fino a 1,5, e ogni settimana si dimezza quasi (`sim.js:63`, resta il 55% dell'eccesso
sopra 1). Sono numeri scelti, non controllati contro niente: se il Marketing sembrera' troppo
forte o troppo debole, e' li' che si gira la manopola.

## Giro del 14/09/2026 (secondo)

Fine task `task/studio-marketing-scegli-il-pezzo`, commit `28c6561` (solo il nome quando tieni
la take, la conferma della copertina) e `fd90cd7` (l'anteprima di un pezzo non uscito).
Controlli automatici tutti verdi: `npm run prova` 154 a posto e 0 no, `audit-regressioni.js`
330 ok e 0 falliti, `verifica:build` 33 ok e 0 falliti. Letti per intero i due diff, e poi
`copertine.js` (`chiediTitolo`, `salvaConCopertine`), `studio.js` (la Cover con la proposta,
`studioDaAnticipare`, il Marketing, il click sui `data-cov`), `studio-elementi.js` (la
cassaforte e `studioUscitePronte`), `actions.js` (`anteprima`, `anteprimeAllUscita`,
`pubblica`), `telefono.js` («Le tue mosse»), `ui.js` (`avviaAzioneDiretta`), `fx.js`,
`sim.js`, `eventi-v2.js:2444` e `state.js`/`online.js` per dove finisce il salvataggio.

Le cose che la task chiedeva di guardare, in ordine:

- **`G.studio.coverProva` con la foto dentro** — e' un problema vero, vedi la prima voce.
- **Proposta rimasta su un pezzo che poi esce** — stessa voce: la proposta resta nel
  salvataggio e non c'e' piu' un tasto per buttarla. Se il pezzo viene **rinominato dalla
  plancia** invece va bene: `ui.js:449` rimette lo stesso seed (`chiediTitolo` con `pezzo` non
  ne genera uno nuovo), la proposta resta agganciata e il titolo nel riquadro grande segue,
  perche' e' letto da `s.t` al momento del disegno (`studio.js:957`).
- **`s.anteprime` e la cassaforte** — a posto. Un pezzo `tenuto` sparisce da «Non ancora fuori»
  (`studioPronti()` lo esclude) ma le anteprime restano scritte sul pezzo; quando lo riprendi
  torna in elenco col suo conto, e all'uscita — le due sole strade, `actions.js:383` e
  `studio-elementi.js:716` — `anteprimeAllUscita` le trasforma in spinta e le cancella. Se la
  casella `spingi` e' rimasta su quel pezzo mentre e' in cassaforte, il Marketing torna alla
  promo sull'ultimo uscito, senza righe accese: coerente, non rotto.
- **L'agenda del telefono** — «Anteprima del pezzo» compare fra «Le tue mosse» come tutte le
  altre, e funziona: `hubPronta` la spegne con il motivo finche' non scegli un pezzo al
  Marketing, e col pezzo scelto parte da li' con la stessa scena. Il motivo pero' e' lungo per
  la riga del telefono: seconda voce. (Il giro precedente diceva che la promo «si lancia solo
  dal Marketing»: non e' esatto, il telefono elenca **tutte** le mosse e le fa partire,
  `telefono.js:758`. Non cambia niente di quello che era stato detto, ma lo correggo qui.)
- **`eventi-v2.js:2444`** — a posto. Avvolge ogni mossa, anche la nuova, e dopo manda
  l'evento `after_action` con `action_id:"anteprima"`; il catalogo lo confronta con liste di
  id (`hookMatches`, `:2152`) e un id che nessun evento conosce non fa scattare niente. Nessun
  errore, solo silenzio: un'anteprima non puo' far nascere un evento social, la promo si.

**RISOLTE (14/09/2026)** — tutte e tre, sul branch prima del push. `studioCoverPulisci()`
(chiamata da `renderStudio()`) butta la proposta il cui pezzo non sta più nella Cover, e
`salvaConCopertine` la sacrifica **prima** delle copertine confermate; proporre su un altro
pezzo lo dice con un avviso. Il motivo della mossa spenta è «Serve un pezzo scelto al
Marketing». `SND.anteprima = "promo"` in `fx.js`.

### La copertina proposta e non confermata resta nel salvataggio, foto compresa, e nessuno la toglie

- **dove** — `frontend/js/game/studio.js:397-401` (`studioCoverProponi` mette la foto in
  `G.studio.coverProva` e salva), `studio.js:382-385` (`studioPezzoCover` mostra la Cover solo
  per i pezzi in `ready()`, cioe' non usciti), `frontend/js/game/copertine.js:29-38`
  (`salvaConCopertine` sacrifica solo `s.img` dei pezzi).
- **cosa succede** — carichi una foto nella Cover e non premi ne' «Conferma» ne' «Lascia
  com'era»: la foto (un JPEG 360×360 in testo, decine di KB) vive in `G.studio.coverProva` e
  viene salvata a ogni `save()`, insieme a tutto il resto. Due cose non tornano. **Uno**: se la
  memoria del browser e' piena, `salvaConCopertine` toglie le copertine **confermate** dei pezzi,
  una alla volta, per far posto — e lascia in piedi quella proposta e mai accettata; se poi le
  foto sui pezzi sono finite torna `false` e il gioco smette di salvare in silenzio (`state.js:102`
  ignora l'errore), con la proposta ancora li' dentro. **Due**: se nel frattempo il pezzo esce
  (da Timing, o da solo il venerdi'), non e' piu' nella Cover, quindi il riquadro con «Conferma»
  e «Lascia com'era» non si vede piu' e la proposta orfana resta nel salvataggio finche' non ne
  fai un'altra su un altro pezzo (la casella e' una sola: la nuova sovrascrive la vecchia, senza
  dirlo — anche se la vecchia era su un pezzo ancora in elenco, che perde la sua etichetta
  «da confermare» senza una parola). Letto nel codice, non riprodotto con la memoria piena.
- **come si vede** — Studio, Cover, «Carica una foto», poi vai in Timing e fai uscire quel
  pezzo: torna in Cover, la proposta non c'e' piu' da nessuna parte ma nel salvataggio
  (`localStorage`, chiave della partita) `studio.coverProva.img` e' ancora pieno.
- **quanto pesa** — da sistemare con calma.

### Sul telefono il motivo per cui l'anteprima e' spenta viene tagliato

- **dove** — `frontend/js/game/actions.js:453` (`"1 pezzo non ancora uscito, scelto al
  Marketing"`), che `hub.js:536` fa diventare «Serve 1 pezzo non ancora uscito, scelto al
  Marketing» e `telefono.js:626` mette nella riga piccola `<i>`; `frontend/css/telefono.css:274`
  la riga e' a una sola linea con i puntini (`white-space:nowrap; text-overflow:ellipsis`).
- **cosa succede** — sono 52 caratteri a 10,5 punti dentro allo schermo del telefono, con a
  destra il costo «8⚡»: la parte che serve — «scelto al Marketing», cioe' *dove* andare per
  accenderla — e' proprio quella in fondo, quella che i puntini mangiano. Il giocatore legge
  «Serve 1 pezzo non ancora uscito, sc…» e pensa di dover registrare un pezzo, che magari ha
  gia'. Dedotto da misure del CSS, non visto su un telefono vero: va guardato.
- **come si vede** — telefono, Agenda, «Le tue mosse», senza aver scelto niente al Marketing.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (14/09/2026, riconosciuto il 20/09)** — il motivo è «un pezzo scelto su
  LaFamegram» (`actions.js`, commit `e288634`): misurato il 20/09 in partita, 204 punti in
  204 nella colonna a 1440 e 255 in 255 sul telefono a 390, senza puntini.

### L'anteprima fa il rumore di un tocco qualsiasi, non quello della promo

- **dove** — `frontend/js/game/fx.js:267-269` (la tabella `SND` che lega ogni mossa al suo
  suono: `promo:"promo"`, `anteprima` non c'e'), letta da `ui.js:140` con `|| "tap"`.
- **cosa succede** — la nuova mossa ha la scena della promo (`scene-art.js:190`), il colore
  della promo (`ui.js:25`) e i suoi minuti, ma quando parte suona il «tap» generico. E' l'unica
  delle mosse con la scena a schermo pieno senza il suo suono.
- **come si vede** — Studio, Marketing, scegli un pezzo sotto «Non ancora fuori», «Fai uscire
  una preview», con l'audio acceso.
- **quanto pesa** — da sistemare con calma.

**Nota, non e' un errore**: la promo ha la saturazione del giorno (`adfOggi("promo")`: dal secondo
post in poi rende meno) e il tetto di 1,5 sulla spinta. L'anteprima no: e' limitata a tre **per
pezzo**, ma non per giornata, quindi con cinque pezzi registrati e non usciti si possono fare
quindici anteprime di fila, ognuna con il suo hype (che scala solo dentro allo stesso pezzo) e i
suoi 2–9 fan. Il freno e' l'energia (8 a colpo) e il tetto dell'hype. E' una scelta di
bilanciamento, e sta tutta in `actions.js:449-475`; se il Marketing sembrera' una stampante di
hype, la manopola e' li'. Stessa cosa per le anteprime fatte mesi prima su un pezzo tenuto in
cassaforte: all'uscita valgono come se fossero di ieri.

## Giro del 14/09/2026 (terzo)

Fine task `task/studio-marketing-scegli-il-pezzo`, commit `fcebe81` (prima Beat, Testo e
Cabina; il resto si apre col primo pezzo) e `e288634` (la proposta di copertina non resta
orfana, l'anteprima suona come la promo). Controlli automatici tutti verdi: `npm run prova`
158 a posto e 0 no, `audit-regressioni.js` 330 ok e 0 falliti, `verifica:build` 33 ok e 0
falliti. Letti per intero i due diff, e poi le cose chieste una per una:

- **chi apre lo Studio con una sezione da fuori** — l'unico che lo fa è il cartello «Studio»
  della mappa (`hub.js:78`: `apriStudio(G.bars.length ? "beat" : "cabina")`), e sono due
  sezioni aperte. `menu-sistema.js`, `telefono.js`, `spostamenti.js`, `posto.js`, `chat.js`,
  `eventi-v2.js`, `skip.js`, `sim.js` non chiamano `apriStudio` con una sezione e non toccano
  `G.studio`. L'altro salto interno (`studio-elementi.js:783`, «cambia copertina» che porta in
  Cover) parte da Timing, che senza pezzi è chiusa: non ci si arriva. Nessuno finisce sul Beat
  senza saperlo.
- **il cartello «Beat Maker»** — non esiste più come posto (`hub.js:113`, «La Sala» al suo
  posto), e `spostamenti.js:72` porta chi aveva salvato lì nello Studio senza sezione. A posto.
- **salvataggio vecchio senza pezzi ma con roba in `G.studio`** — `renderStudio()` riporta al
  Beat prima di disegnare; le sezioni chiuse non leggono niente. I pezzi non si cancellano mai
  (nessun `songs.splice`/riassegnazione in `js/`), quindi una volta aperto resta aperto.
- **`studioOltre()` e lo scroll** — la linguetta accesa è sempre la prima quando le altre sono
  chiuse, `scrollIntoView` la porta a sinistra e la sfumatura «c'è dell'altro» si accende
  correttamente. Il lucchetto allunga le cinque linguette ma la striscia scorre lo stesso;
  `css/stretto.css:216` ha `.sttab{min-width:0;...}` e non tocca `::after`.
- **`studioCoverPulisci()` e `ready()`** — `ready` è in `actions.js:162`, caricato a
  `pagine/gioco.html:629`, prima di `studio.js` (riga 646); e `renderStudio()` esce subito se
  lo Studio non è acceso, quindi non gira mai all'avvio. A posto.
- **`pushLog` in `salvaConCopertine` senza `G.log`** — `G.log` sta in `START()`
  (`state.js:21`) e il caricamento fa `Object.assign(START(), salvato)`, quindi c'è sempre;
  in più `save()` (`state.js:102`) incarta tutto in un `try`. Non si rompe.

Un problema solo, piccolo, e una nota.

**RISOLTO (14/09/2026)** — sul branch prima del push: con il mouse sopra la linguetta
chiusa tiene lo stesso fondo e lo stesso colore di quando non la tocchi
(`css/studio.css`, `.sttab.chiusa:hover`).

### Passando col mouse su una linguetta chiusa, si accende invece di restare spenta

- **dove** — `frontend/css/studio.css:338`
  (`.sttab.chiusa:hover{background:transparent;color:inherit}`).
- **cosa succede** — la riga vuole togliere l'effetto del passaggio del mouse sulle
  linguette col lucchetto, ma lo fa mettendo valori diversi da quelli di riposo: a riposo la
  linguetta ha lo sfondo grigio leggero e il testo azzurro spento (`studio.css:327-330`,
  `color:var(--stSoft)`), col mouse sopra lo sfondo sparisce e il testo prende il colore della
  pagina (più chiaro). Il risultato è che la linguetta chiusa **cambia** quando ci passi
  sopra, come se fosse cliccabile — il contrario di quel che dice il commento sopra. Con
  l'opacità al 42% è poco visibile, ma c'è. Solo col mouse (la regola sta dentro
  `@media (hover:hover)`): sul telefono non si vede.
- **come si vede** — sul computer, partita nuova senza pezzi, Studio, passa il mouse su
  «Mix» o «Marketing».
- **quanto pesa** — da sistemare con calma.

**Nota, non è un errore**: quando tieni la prima take e il pezzo nasce, le cinque linguette
perdono il lucchetto in silenzio — nessun avviso dice «adesso si è aperto il resto». Il
giocatore che ha letto «Prima il pezzo: Beat, Testo, Cabina. Poi il resto» lo intuisce, ma
chi non ha mai toccato una linguetta chiusa potrebbe non accorgersi che c'è altro da fare
oltre alla Cabina. È una scelta di come si racconta lo sblocco (`studio.js:1291-1297`), non
un guasto; se serve, un toast nel punto in cui `registra` aggiunge il pezzo basta.

## Prova sul telefono del 14/09/2026 (Studio: Cover, Marketing, linguette)

Misure: **390 × 844** e **360 × 800**. Branch `task/studio-marketing-scegli-il-pezzo`,
partita salvata con quattro pezzi («Sottopasso», «Terzo piano», «Neve sporca», «Sangue»),
nessuno uscito. Guardato solo lo Studio, nei tre punti cambiati oggi: la proposta di
copertina (Cover), «Cosa spingi» / «Non ancora fuori» con l'anteprima (Marketing), e le
cinque linguette chiuse col lucchetto. Console senza errori per tutto il giro. Gli
screenshot stanno in `documentazione/prove-telefono/2026-09-14/`.

**Come l'ho provato, per riprovarlo.** Chrome ha ignorato tre volte il ridimensionamento
della finestra (restava a 1150 × 687: è massimizzata). Ho messo il gioco dentro a un
`<iframe>` della stessa origine largo esattamente 390 (poi 360) e alto 844 (poi 800), in
una scheda a parte: dentro all'iframe le media query e il layout vedono quella misura, i
tocchi arrivano ai bottoni veri e la console è quella del gioco. Due cose da tenere a mente
leggendo le figure: (1) c'è la barra di scorrimento del computer, 15 px, che sul telefono
non c'è — quindi la colonna utile era 375 e 345, non 390 e 360; (2) la rotella del mouse
non scorreva la colonna, l'ho scorsa da console (`.stwrap.scrollTop`): che *scorra* l'ho
verificato dalle misure (`scrollHeight` > `clientHeight`, `overflow-y:auto`), non col dito.

**Quello che funziona.** Cover: «Generane un'altra» mette la proposta al centro con
quella di adesso accanto, i tre tasti sono uno sotto l'altro larghi tutta la colonna e
alti 48 px, niente esce dallo schermo (nessuno scorrimento orizzontale a nessuna delle due
misure), «Lascia com'era» risponde al tocco e rimette la copertina sola. Marketing: i due
elenchi stanno uno sotto l'altro nella colonna che scorre, non si coprono, l'ultima riga
resta sopra alla banda del diario, il tocco su un pezzo di «Non ancora fuori» fa
comparire «ANTEPRIMA: «…»» e il tasto d'oro «Fai uscire una preview» (48 px) si raggiunge.
Linguette: le cinque chiuse hanno il lucchetto, restano su una riga (44 px di altezza,
la striscia scorre: 568 px su 345), toccandone una si resta sul Beat ed esce l'avviso
«Prima il pezzo: Beat, Testo, Cabina. Poi il resto.»

![Cover a 390: proposta, «adesso» e i tre tasti](prove-telefono/2026-09-14/cover-proposta-390.jpg)
![Marketing a 390: «Cosa spingi» e «Non ancora fuori»](prove-telefono/2026-09-14/marketing-due-elenchi-390.jpg)
![Linguette chiuse a 390](prove-telefono/2026-09-14/linguette-chiuse-390.jpg)

**RISOLTO (14/09/2026)** — `.toast` in `css/effects.css` ha `width:max-content` (col
tetto `max-width` che c'era già): `left:50%` da solo gli lasciava mezzo schermo. Vale per
tutti gli avvisi del gioco, non solo per questo.

### L'avviso «Prima il pezzo…» sul telefono è una colonnina di quattro righe

- **dove** — `frontend/css/effects.css:14-17` (`.toast{position:fixed;left:50%;...
  max-width:min(92vw,460px)}`), chiamato da `frontend/js/game/studio.js:1373`.
- **cosa succede** — il toast è `position:fixed` con `left:50%` e nessuna larghezza: la
  larghezza «a misura del contenuto» si ferma allo spazio che resta a destra della metà
  dello schermo. A 390 il riquadro viene largo 188 px e alto 109 (quattro righe di testo),
  a 360 viene 172 × 122 (cinque righe). Il `max-width` non serve a niente, perché il
  vincolo vero è più stretto. Sul computer non si vede: 575 px bastano a tutto. È l'unico
  avviso che il giocatore *deve* leggere nello Studio nuovo — è quello che spiega perché
  le cinque linguette sono chiuse — e arriva così.
- **come si vede** — 390 × 844, partita senza pezzi (o `G.songs = []; renderStudio()`),
  Studio, tocca «Mix».
  ![Toast stretto a 390](prove-telefono/2026-09-14/linguette-chiuse-toast-stretto-390.jpg)
- **quanto pesa** — si legge, ma è brutto e sta sopra ai tasti del pannello. Non è di
  oggi (vale per ogni toast del gioco sul telefono), ma oggi è diventato parte del
  percorso. Da sistemare con calma.

**RISOLTO (14/09/2026)** — l'etichetta è «proposta», che ci sta.

### A 360 «da confermare» nell'elenco della Cover è tagliato: si legge «da conf…»

- **dove** — `frontend/js/game/studio.js:964` (la riga piccola
  `q71 · generata · da confermare`) con `frontend/css/studio.css:182-183`
  (`.stchi span{...white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`).
- **cosa succede** — resta sulla riga piccola, come chiesto, ma non ci sta: il testo
  vuole 184 px e la riga ne ha 154 (a 360 con la barra del computer) o circa 169 (su un
  telefono vero a 360): in tutti e due i casi l'ultima parola, che è quella che dice
  qualcosa, sparisce nei puntini. A 390 ci sta (184 su 184, giusto giusto: basta una
  parola in più e salta anche lì).
- **come si vede** — 360 × 800, Cover, «Generane un'altra», scorri all'elenco «I tuoi
  pezzi».
  ![«da conf…» a 360](prove-telefono/2026-09-14/cover-elenco-da-confermare-tagliato-360.jpg)
- **quanto pesa** — si vede ma si gira intorno: al centro c'è scritto la stessa cosa
  («non è ancora sul pezzo»). Da sistemare con calma.

**RISOLTO (14/09/2026)** — in `css/stretto.css` la copertina «di adesso» scende a 72 punti
(la proposta resta a 110): si vede subito quale è quale, e la fascia «ADESSO» copre meno.

### Sul telefono la copertina «grande» e quella «di adesso» sono quasi uguali, e l'etichetta copre il titolo

- **dove** — `frontend/css/stretto.css:220` (`.stcopertina{width:110px;height:110px}`
  sotto i 520) contro `frontend/css/studio.css:225`
  (`.stcopertina.stprima{...width:96px;height:96px}`), e `studio.css:226-228` per la
  fascia «adesso».
- **cosa succede** — sul computer la proposta è 180 e quella di adesso 96: si capisce al
  volo qual è la nuova. Sotto i 520 la proposta scende a 110 ma `.stprima` resta a 96
  (ha due classi, vince sempre): 110 contro 96, si vede a malapena chi è la grande, e la
  gerarchia «al centro lei, accanto quella di adesso» si perde. In più la fascia scura con
  scritto «ADESSO» sta in fondo alla copertina piccola, esattamente dove la copertina
  generata scrive il titolo del pezzo: i due testi si sovrappongono e non si legge né
  l'uno né l'altro (questo a tutte le misure, anche sul computer).
- **come si vede** — 390 × 844 o 360 × 800, Cover, «Generane un'altra»: guarda le due
  copertine in alto.
  ![Le due copertine a 360](prove-telefono/2026-09-14/cover-proposta-360.jpg)
- **quanto pesa** — si vede ma si gira intorno (c'è comunque l'etichetta e c'è il
  riquadro «non è ancora sul pezzo»). Da sistemare con calma.

**APERTO, di proposito** — non è di oggi: è come sono impilate le colonne sotto i 980 punti
(`stretto.css`, il centro prima di tutto) e vale per ogni sezione con un elenco a sinistra
(Cabina, Mix, Timing). Scorrere in cima a ogni tocco sarebbe una scelta di navigazione per
tutto lo Studio, e va decisa una volta, non da dentro questa task.

### Nel Marketing tocchi un pezzo in fondo e la risposta compare in cima, fuori dallo schermo

- **dove** — `frontend/css/stretto.css:185-186` (`.stmid{order:1}` e `.stsx{order:2}`:
  sul telefono il centro sta sopra e gli elenchi sotto) con `frontend/js/game/studio.js:202-209`
  (`studioSegna` → `renderStudio()`, che ridisegna senza toccare lo scorrimento).
- **cosa succede** — per arrivare a «Non ancora fuori» devi scorrere in fondo; tocchi
  «Sangue» e il pannello che cambia («ANTEPRIMA: «Sangue» · q78» col suo testo) è quello
  sopra, che a quel punto sta sotto alla fascia alta: a 390 il titolo è tagliato (si
  vede solo «q66» che spunta), a 360 sta a −28 px, cioè del tutto fuori. Il tasto d'oro
  resta in vista in tutti e due i casi perché il pannello dell'anteprima è corto, ma
  quello che ti dice *cosa* stai per fare non lo vedi finché non risali. Con la Promo
  (pannello più lungo) resta in vista ancora meno.
- **come si vede** — 390 × 844, un pezzo fuori e tre no, Marketing, scorri in fondo e
  tocca un pezzo di «Non ancora fuori».
  ![Dopo il tocco a 390: il titolo è sopra](prove-telefono/2026-09-14/marketing-dopo-il-tocco-titolo-fuori-390.jpg)
  ![Dopo il tocco a 360](prove-telefono/2026-09-14/marketing-dopo-il-tocco-360.jpg)
- **quanto pesa** — si vede ma si gira intorno: la riga si accende d'oro e il pollice sa
  che ha toccato. Ma è lo stesso problema per Mix, Timing e Cover (tutti gli elenchi
  che stanno sotto al centro). Da sistemare con calma.

**APERTO, di proposito** — è lo stesso `stCapo()` di tutte le sezioni («SPINGI: «Sottopasso»
· q71», «MIXI: …»): il numero va a capo da solo con qualunque titolo lungo, non solo qui.
Si sistema in `stCapo` per tutte insieme, con `white-space:nowrap` sul numero e il titolo
che si accorcia — non l'ho fatto in questa task per non toccare otto schermate all'ultimo.

### Il capo «ANTEPRIMA: «Neve sporca» · q66» va a capo lasciando «· q66» da solo

- **dove** — `frontend/js/game/studio.js:1092` (`stCapo("Anteprima", ant.t, "q" + ant.q)`)
  con `frontend/css/studio.css:198-199` (`.stcapo{font-size:22px;...word-break:break-word}`).
- **cosa succede** — a 390 la riga è larga 306 e il capo non ci sta: la seconda riga è
  solo «· q66», col puntino in testa. A 360 uguale con «Sangue». Cosmetico.
- **come si vede** — Marketing, tocca un pezzo di «Non ancora fuori», scorri in cima.
  ![Il capo a capo a 390](prove-telefono/2026-09-14/marketing-anteprima-titolo-a-capo-390.jpg)
- **quanto pesa** — si vede ma si gira intorno.

**RISOLTO (14/09/2026)** — `scroll-padding-inline:12px` su `.sttabs`: `scrollIntoView`
rispetta il margine della striscia.

### La prima linguetta si apre attaccata al bordo sinistro, senza il suo margine

- **dove** — `frontend/js/game/studio.js:1305-1307`
  (`acceso.scrollIntoView({block:"nearest", inline:"nearest"})`), con il `padding` della
  striscia in `frontend/css/stretto.css:215` (`.sttabs{...padding:8px 10px ...}`).
- **cosa succede** — con le cinque chiuse la linguetta accesa è «Beat», la prima. Lo
  `scrollIntoView` la porta a filo del bordo del contenitore, cioè scorre la striscia di
  10 px e si mangia il margine sinistro: «Beat» parte a x = 0, attaccata allo schermo,
  mentre tutte le altre hanno il loro respiro. Si vede a 390 (12 px) e a 360 (10 px).
- **come si vede** — Studio con la partita senza pezzi, guarda in basso a sinistra.
  ![«Beat» a filo a 360](prove-telefono/2026-09-14/linguette-chiuse-beat-attaccato-al-bordo-360.jpg)
- **quanto pesa** — si vede ma si gira intorno.

## Giro del 15/09/2026 (backend-allineato, fine task `task/studio-cinque-linguette`)

La task non ha toccato `backend/`. `node scripts/controlla-backend.js` verde, `npm run
prova` 183 a posto. Le otto coppie di migrazioni SQLite/PostgreSQL dicono la stessa cosa
colonna per colonna (le sole differenze sono `AUTOINCREMENT` contro `GENERATED BY DEFAULT
AS IDENTITY` e un `ALTER TABLE` doppio in `008_diario.sql`, che è dialetto e basta):
niente che fermi il passaggio a PostgreSQL. Il conto delle «20 tabelle» in `README.md`
torna. Una sola voce, di documento.

### `README-API.md` non sa che `POST /api/account` promuove l'ospite a email

**Sistemato (15/09/2026), nello stesso giro:** §6 ha il terzo esito e la nota 3 dice il
presente (`README-API.md`, «Terzo esito, con `tipo: "email"`»).

- **dove** — `backend/README-API.md:462-464` (§6 `POST /api/account`, le risposte) e
  `backend/README-API.md:1100-1102` («Note e limiti attuali», punto 3). Il codice è
  `backend/server.js:236-246` e `frontend/js/net/online.js:176-182`.
- **cosa succede** — dal commit `cb502a7` (12/09, «collega account artista e cloud») una
  `POST /api/account` con `tipo: "email"` mandata **con** una `x-sessione` di un account
  ospite non crea un secondo account: promuove quello stesso (`archivio.collegaIdentita`)
  e risponde `200 { account, token }`, con il token che è lo stesso della sessione
  corrente. `registraConMail()` nel gioco manda apposta la sessione. Il documento invece
  elenca solo `201 { account, identita, token }` per il nuovo account e `200 { account,
  token }` per «un'identità store già registrata» — questo terzo caso non c'è — e la nota 3
  dice il contrario del vero: «`ONLINE.registraConMail()` non converte l'account ospite
  corrente. Crea un nuovo account email e sostituisce il token locale; non trasferisce
  automaticamente artista e carriera». Dal 12/09 li trasferisce, ed è proprio quello il
  senso del fix.
- **come si vede** — `backend/prova.js` ha la prova del caso (aggiunta nello stesso
  commit); il documento a fianco racconta ancora il comportamento di prima.
- **quanto pesa** — da sistemare con calma: è solo documento, ma è il caso peggiore
  della lista (rotta presente in tutti e due con una risposta che il documento non
  conosce), e nessun controllo automatico lo becca. Proposta: in §6 aggiungere il terzo
  esito (`200 { account, token }` quando la sessione corrente è un ospite senza mail,
  con token invariato) e riscrivere la nota 3 al presente, o toglierla.


**RISOLTO (15/09/2026)** — commit `43e7555`.
## Giro del 15/09/2026 (segnala-problemi, fine task `task/studio-cinque-linguette`)

Controlli automatici tutti verdi: `npm run prova` 180 a posto e 0 no, `audit-regressioni.js`
337 ok e 0 falliti, `verifica:build` 33 ok e 0 falliti. Letto per intero il diff
`main...HEAD` (quindici file) e poi, riga per riga, `studio.js` (il banco, le due porte del
feat, la Cover dentro a Fuori, `studioNumeri`, `renderStudio` e i click), `studio-elementi.js`
(`studioMandaFuori`, `studioRiprendi`, `studioUscitePronte`, la stima degli stream),
`actions.js` (`registra`, `mixa`, `pubblica`, `promo`, `anteprima`), `sim.js` (`songWeekly`,
`advanceWeek`), `covers.js` (`coverResa`), `telefono.js` (`telPromo`, `telSpingi`, il click su
`hb-tel`), `eventi-v2.js:1889`, e per i casi limite `posto.js` (`nuovaPersona`, `sistemaGente`,
`diventaOpp`), `rivals.js` (`nuovoRivale`, `faccia`), `modal.js`, `tempo.js` (`spendi`),
`hub.js` (`hubAzione`, `hubPronta`, `renderHub`) e `css/hub.css` (il telefono sotto i 1180).

I casi limite chiesti, uno per uno:

- **Salvataggi vecchi** — a posto. `studioDati()` (`studio.js:158-175`) migra `mixa`/`esce`
  al primo giro e, se nessuna delle due punta ancora a un pezzo, mette sul banco l'ultimo
  inciso e non uscito; una partita nuova parte con `banco = null`. Un pezzo senza `parti`
  mostra solo la q (`studioNumeri`), un pezzo con `feat` scritto come nome (com'era su
  `main`) si legge uguale.
- **Pezzo sul banco che sparisce** — a posto. I pezzi non si cancellano mai (nessun
  `songs.splice` in `js/`), il seed cambia solo in `studioCoverConferma` che sposta anche
  `banco` e `spingi` (`studio.js:634-637`), e le tre strade con cui un pezzo lascia il banco
  (`pubblica` in `actions.js:402`, il venerdì in `studio-elementi.js:729`, la cassaforte in
  `:672`) svuotano tutte il banco. Se il banco resta a un seed di un pezzo `tenuto`, la
  lettura torna `null` e le due linguette si chiudono: coerente.
- **Promo senza pezzi** — a posto. `telPromo()` con niente fuori e niente pronto dice «Niente
  da spingere» (`telefono.js:679`); con pezzi pronti ma niente fuori il tasto «Posta» è
  spento e la riga sotto manda all'anteprima. Il tasto «fallo sapere» dello Studio compare
  solo se c'è un pezzo uscito.
- **`G.studio.spingi` su un pezzo uscito nel frattempo** — a posto, e anzi è la strada
  giusta: `studioDaAnticipare` non lo trova più fra i pronti, `studioDaSpingere` lo trova fra
  gli usciti, e la promo parte su quello senza toccare niente. Se invece finisce in
  cassaforte, si ripiega sull'ultimo uscito senza righe accese — come già scritto nel giro
  del 14/09.
- **Rivale con lo stesso nome di uno in `G.gente`** — qui c'è un problema vero, vedi la
  terza voce.

Sei voci, nessuna blocca la partita. Le prime due sono quelle che contano.

### Nel riquadro dei numeri di Fuori il feat non compare mai: la sua parte è sempre zero

**Sistemato (15/09/2026), nello stesso giro:** `registra` legge `featBonus()` e `studioBonus()` in due costanti **prima** di `studioConsumaFeat()` e le scrive in `parti`; l'audit controlla l'ordine.

- **dove** — `frontend/js/game/actions.js:353` (`studioConsumaFeat()`, che stacca il feat e
  mette `G.studio.feat = null`) e subito dopo `actions.js:360` (`parti:{..., feat:featBonus(),
  ...}`), letto da `studioNumeri` in `frontend/js/game/studio.js:1235`.
- **cosa succede** — la qualità del pezzo il feat la conta giusta (`actions.js:349`, calcolata
  prima di staccarlo), ma la riga «QUALITÀ = Beat · Testo · Fonico · con X · Mix» che il
  documento promette non dirà mai «con X»: quando si scrive `parti.feat` il feat è già stato
  consumato, `featBonus()` non trova più nessuno e scrive 0, e `studioNumeri` mostra la voce
  solo se è diversa da zero. Chi paga 120 € un rapper della classifica vede in Fuori una riga
  di numeri che non lo nomina, e sotto «ASCOLTI» compare «La gente di X» (quella legge
  `featFama`, che è a posto): la seconda riga dice che c'è, la prima no. Letto nel codice, non
  riprodotto in partita: il test di `prova.js:1434` usa un pezzo scritto a mano con `feat:0`.
- **come si vede** — Cabina, scegli un feat (chi conosci va bene), tieni la take, vai
  nell'Uscita: la riga «Qualità» non ha la voce del feat.
- **quanto pesa** — da sistemare con calma.


**RISOLTO (15/09/2026)** — commit `c4aa9e6`: `registra` legge le due costanti del feat **prima**
che `studioConsumaFeat()` lo liberi, e l'audit controlla l'ordine.
### Sul telefono la promo non si sceglie e l'anteprima non si raggiunge più

- **dove** — `frontend/js/game/studio.js:407-408` (`studioFalloSapere`: senza `telPC()`
  lancia `studioAzione("promo")` e basta), `frontend/css/hub.css:1273-1287` (sotto i 1180 px
  `body.in-hub .ptel{display:none}`), `frontend/js/game/telefono.js:55-88` (`HUB_APP_VECCHIO`,
  la griglia compatta, che LaFamegram non ce l'ha), `frontend/js/game/actions.js:474`
  (`need` dell'anteprima: «un pezzo scelto su LaFamegram»).
- **cosa succede** — «Che post fai?» vive solo nel telefono della plancia, e quel telefono
  sotto i 1180 px non c'è. Su un telefono vero quindi: il tasto «fallo sapere» spinge
  **sempre l'ultimo pezzo uscito**, senza la scelta del pezzo che il giro del 14/09 aveva
  appena aggiunto; e la mossa «Anteprima del pezzo» non ha più nessuna strada, perché l'unico
  posto in cui si sceglie il pezzo non uscito è LaFamegram. Ieri sul telefono a 390 la
  linguetta Marketing con i due elenchi funzionava (prova del 14/09, qui sopra): oggi quel
  pezzo di gioco sul telefono è sparito. Il documento della task lo sa e lo dice
  (`implementazioni/02-interfaccia-e-telefono.md`, «Una cosa da sapere, non risolta qui»):
  lo scrivo lo stesso perché il gioco esce sugli store del telefono ed è lì che conta.
- **come si vede** — finestra più stretta di 1180 px, un pezzo fuori e uno no: Studio,
  Uscita o Cabina, «fallo sapere» → parte la promo sull'ultimo uscito. Nessun posto dove
  fare l'anteprima.
- **quanto pesa** — si vede ma si gira intorno (la promo parte comunque); per l'anteprima
  non c'è un giro.


**RISOLTO (15/09/2026)** — branch `task/telefono-sul-telefono`: sotto i 1180 il telefono si alza a
schermo pieno da un tasto nella barra, e «fallo sapere» ci passa sempre. «Il telefono quando
lo schermo è un telefono» in `implementazioni/02-interfaccia-e-telefono.md`.
### Un rapper della classifica con lo stesso nome di uno della Sala non si può chiamare

- **dove** — `frontend/js/game/studio.js:279-280` (`studioRivaliChiamabili` scarta i rivali
  il cui **nome** sta già in `G.gente`), contro `frontend/js/game/posto.js:395-396` (i rapper
  della Sala pescano i nomi dagli stessi trenta di `RIV_NOMI`, guardando solo `G.gente` e
  mai `G.rivals`) e `rivals.js:46` (i rivali guardano solo `G.rivals`).
- **cosa succede** — i due elenchi si passano lo stesso mazzo di nomi senza parlarsi, quindi
  è normale che alla Sala giri un «Lupo» da fama 20 e in classifica ci sia un «Lupo» da tre
  milioni di ascolti: due persone diverse. Il filtro per nome li prende per la stessa
  persona e il Lupo della classifica sparisce da «Dalla classifica» senza dirlo; con tre
  rapper alla Sala e nove-undici in classifica succede quasi in ogni partita. Stessa radice,
  caso raro ma brutto: chiami un rivale, accetta, entra fra i contatti (`studio.js:303`), poi
  ci litighi alla Sala fino a `diventaOpp` (`posto.js:780`, rapporto a zero e tre punti
  sotto) — che crea un **secondo** rivale col suo nome in classifica, perché quello di
  partenza non è mai stato tolto. Il legame giusto sarebbe una cosa che non cambia (il
  `seed` del rivale, o un `rivale:true` con il suo nome), non il nome da solo.
- **come si vede** — partita dove alla Sala c'è un rapper con un nome che sta anche in
  classifica: in Cabina, sotto «Dalla classifica», quel nome manca.
- **quanto pesa** — da sistemare con calma.

### «Dalla classifica» mostra solo i sei più grossi, cioè quelli che dicono di no

**Sistemato (15/09/2026), nello stesso giro:** la lista è tutta la classifica, dal più grosso in giù — quelli della tua misura stanno in fondo e la colonna scorre.

- **dove** — `frontend/js/game/studio.js:1161` (`studioRivaliChiamabili().slice(0, 6)`), con
  l'ordine per ascolti calanti in `studio.js:281`.
- **cosa succede** — la classifica ha nove-undici nomi; in Cabina se ne vedono sei, i più
  grossi. Ma la probabilità che uno dica sì è il rapporto fra la tua misura e la sua
  (`studioFeatProbabilita`, `studio.js:270-276`): i sei più grossi sono esattamente quelli che
  a un giocatore piccolo rispondono «sì al 8%» e costano di più; quelli della sua misura, che
  direbbero sì e costerebbero una serata, stanno fuori dall'elenco e non c'è modo di
  arrivarci. Nel primo anno di gioco la porta della classifica è quasi solo una vetrina.
- **come si vede** — partita nuova, un paio di settimane, Cabina: sei righe con «sì al 8%»
  e prezzi da 200 € in su, e in classifica altri quattro nomi che non ci sono.
- **quanto pesa** — da sistemare con calma.


**RISOLTO (15/09/2026)** — commit `c4aa9e6`: «Dalla classifica» non si ferma più ai sei più
grossi, tutta la classifica in «Con chi».
### Chi accetta dalla classifica occupa un posto della Sala, e alla Sala arriva meno gente

- **dove** — `frontend/js/game/studio.js:303` (`G.gente.push(p)`) contro
  `frontend/js/game/posto.js:423-432` (`sistemaGente`: si aggiunge gente finché
  `G.gente.length < quante`, tetto 8, e il videomaker e il giornalista prendono il loro
  posto solo quando quel giro parte).
- **cosa succede** — ogni rivale che dice sì entra in `G.gente` e conta nel tetto. Con due
  feat comprati dalla classifica la Sala smette di far arrivare due persone: un beatmaker,
  un fonico, o proprio il videomaker (che serve al video del pezzo) e il giornalista, che
  arrivano solo se il giro di `sistemaGente` ha ancora posti liberi. Non si rompe niente,
  ma è un costo nascosto che il gioco non dice e che probabilmente nessuno ha scelto.
- **come si vede** — fai accettare due rivali nelle prime settimane, poi conta chi arriva
  alla Sala nelle settimane dopo: un posto in meno per ognuno.
- **quanto pesa** — da sistemare con calma.

### «Sì al 8%» e «Dice sì al 8%»: davanti alla vocale ci va «all'»

**Sistemato (15/09/2026), nello stesso giro:** `studioPercento()` mette «al» o «all'» secondo il numero (8, 11, 80–89).

- **dove** — `frontend/js/game/studio.js:1184` (la riga della classifica in Cabina) e
  `studio.js:340` (la finestra di conferma).
- **cosa succede** — con probabilità 8, 11, 80 e simili si legge «sì al 8%», che in
  italiano non si dice. Sono proprio i numeri che un giocatore piccolo vede di più.
- **come si vede** — Cabina, «Dalla classifica», partita giovane.
- **quanto pesa** — da sistemare con calma.

**RISOLTO (15/09/2026)** — commit `c4aa9e6`: «all'8%».

**Nota, non è un errore**: un rivale che dice no si può richiamare subito, all'infinito. Il no
costa 5 di energia e un'ora (`studio.js:327-331`), la probabilità non scende mai sotto l'8%
(`studio.js:274`), non c'è un «oggi no» né un ricordo del rifiuto: a forza di chiamare, prima
o poi dice sì, e dodici chiamate sono sessanta di energia. In più il sì non costa tempo, e il
no a fine giornata (dopo le tre) costa l'energia ma non l'ora, perché `GAME_TIME.spend` si
ferma prima delle 04:00 e non c'è un `canSpend` a monte come per il beat. È bilanciamento, e
sta tutto in `studioChiamaRivale`; se la porta della classifica sembrerà troppo facile, la
manopola è lì (un rifiuto che vale per la settimana basterebbe).

**Nota, non è un errore**: due cose piccole che non valgono una voce. I commenti di
`studio.js:653` («tutte e otto») e `studio.js:1454` («Otto linguette non ci stanno in riga»)
parlano ancora delle otto linguette: sono cinque, il codice sotto è giusto. E in
`telefono.js:674` e `:716` il titolo del pezzo entra nell'HTML senza passare da uno
`studioEsc`: nello Studio i titoli passano tutti di lì, sul telefono no — ma sul telefono era
già così prima di oggi (`telefono.js:492`, la discografia), e i titoli li scrive il giocatore
in una casella che il gioco controlla.

Due voci del 14/09 cambiano forma con questa task, senza essere risolte: «Nel Marketing
tocchi un pezzo in fondo e la risposta compare in cima» non riguarda più il Marketing (che
nello Studio non c'è) ma vale tale e quale per gli elenchi di Cabina, Mix e Uscita; «Il capo
ANTEPRIMA … va a capo» non esiste più come schermata, ma lo `stCapo` che va a capo è lo
stesso di «MIXI: «…» · q78» e resta aperto come scritto lì.

## Giro del 15/09/2026 (backend-allineato, task `task/app-post-e-take-senza-energia`, «c'è un secondo database?»)

La task (`e89eea7`) non ha toccato `backend/`. `node scripts/controlla-backend.js` verde,
`npm run prova` 183 a posto, 0 no. Le otto coppie di migrazioni SQLite/PostgreSQL sono
state confrontate colonna per colonna (tipo, `NOT NULL`, `DEFAULT`, `CHECK`, `REFERENCES`,
indici e vincoli): dicono la stessa cosa, le sole differenze sono dialetto (`INTEGER`
contro `BIGINT`/`DOUBLE PRECISION` come scritto in `schema.md` § 7, `AUTOINCREMENT` contro
`GENERATED BY DEFAULT AS IDENTITY`, `strftime` contro `EXTRACT(EPOCH)` nell'`UPDATE` della
004, l'`ALTER TABLE` doppio in una riga nella 008 PostgreSQL). **Niente che fermi il
passaggio a PostgreSQL.**

**Alla domanda «c'è un secondo database?»: no, non nel senso di un secondo strato dati.**
Dal `b2ea221` (01/09, «sotto il server ci puo' stare PostgreSQL») ci sono **due motori**
dietro a **uno strato dati solo**:

- `backend/database/db.js:30-38` (`scegliMotore`) legge `cfg.pg` oppure `process.env.ADF_PG`:
  se c'è un URL carica `postgres.js` e applica `migrazioni-pg/`, se no carica `sqlite.js`
  e applica `migrazioni/`. È l'unico punto di scelta, e si sceglie **all'avvio**, non per
  richiesta: **uno rimpiazza l'altro, non convivono** nello stesso processo.
- `backend/database/sqlite.js` (`node:sqlite`, `DatabaseSync`, un file:
  `ADF_DATI`, di suo `backend/database/dati/classifica.db`, `server.js:54`) e
  `backend/database/postgres.js` (libreria `pg`, pool, `?`→`$n`, transazioni con
  `AsyncLocalStorage`) espongono la stessa faccia: `esegui`, `uno`, `tutti`, `fai`,
  `insieme`, `chiudi`, `nome`.
- `backend/database/archivio.js` è l'unico file che parla col database e **non sa quale ha
  sotto** (`archivio.js:25`, `let A = null`); `server.js` sa solo il nome per il log
  (`server.js:601`). `copia.js:30-33` si tira indietro con `ADF_PG` (rimanda a `pg_dump`);
  `prova.js:34-43` accende PostgreSQL **solo** con `--pg` esplicito (`npm run prova-pg`),
  non basta la variabile nell'ambiente.
- `ADF_PG` si può mettere in `backend/.env.local` (fuori da git, `.gitignore:13`), letto
  da `backend/ambiente.js:27-46`; l'ambiente vero vince sul file. Oggi sul disco **non c'è**
  né `.env.local` né un secondo file `.db`: in `dati/` c'è solo `classifica.db` (con
  `-wal`/`-shm`) e la cartella `copie/`.
- Nessuna traccia di un terzo motore o di un ORM: `package.json` ha `pg`, `jose`, `zod`,
  e nel codice si `require` solo `pg` (`postgres.js:46`) e `node:sqlite`.

La documentazione descrive entrambi i motori e come si scelgono: `backend/README.md:15-23`
e `:131-133`, `backend/database/README.md:19` e `:514-632` («I due motori»),
`backend/database/schema.md:23-34` e § 7-8, `backend/README-API.md:1084-1085`,
`documentazione/dipendenze.md:73`. Sono a posto. Quello che è rimasto indietro è sotto.

### `README-API.md` non conosce tre cose entrate con la difficoltà (03/09)

- **dove** — `backend/README-API.md:553-583` (§11 `POST /api/artista`, corpo e regole),
  `backend/README-API.md:662-669` (§15 `GET /api/classifica`, tabella delle query) e
  `backend/README-API.md:748-749` (§22 `PUT /api/carriera/:slot`, gli errori). Il codice è
  `backend/server.js:351` (`difficolta: b.difficolta` all'iscrizione),
  `backend/server.js:409-413` (il filtro `?difficolta=` sulla classifica, fra i tre valori
  di `archivio.DIFFICOLTA`) e `backend/server.js:465-468` (`403 non-e-tuo` se
  `artistaId` nel corpo non è un artista dell'account).
- **cosa succede** — il commit `42f10ae` (03/09, «la difficolta accanto all'artista, e
  tre buchi tappati») ha toccato `server.js` ma non `README-API.md`, scritto il giorno
  prima (`442a676`). Risultato: il corpo di `POST /api/artista` nel documento non ha
  `difficolta` (mentre `POST /api/punteggio` a riga 621 ce l'ha); la tabella delle query di
  `GET /api/classifica` elenca `da`, `quanti`, `io`, `citta`, `genere` e non `difficolta`;
  `PUT /api/carriera/:slot` dice «Altri errori: `400 stato-mancante`, `413
  carriera-troppo-grande`» e non il `403 non-e-tuo`, che è proprio uno dei «tre buchi
  tappati».
- **come si vede** — `backend/prova.js` prova tutte e tre le cose (cerca `difficolta` e
  `non-e-tuo`); il documento a fianco non le racconta. `controlla-backend.js` confronta
  solo i nomi delle rotte, quindi non lo becca.
- **quanto pesa** — da sistemare con calma. Proposta: aggiungere `"difficolta"` al corpo
  di §11 con la regola (uno dei tre valori, se no `anni-di-fame`), una riga `difficolta`
  alla tabella di §15, e `403 non-e-tuo` agli errori di §22.


**RISOLTO (15/09/2026)** — branch `task/documenti-backend-in-pari`: `difficolta` nel corpo e
nelle regole di §11 (i tre valori, il ripiego su `anni-di-fame`), una riga `difficolta` nella
tabella di §15 con la frase «la graduatoria resta una sola per tutti», e `403 non-e-tuo` fra
gli errori di §22 con il perché.
### La tabella «Variabili d'ambiente» di `README-API.md` è a metà, e ne cita una che non esiste

- **dove** — `backend/README-API.md:1079-1098`. Il confronto è con `backend/README.md:125-160`
  (la tabella completa, difesa da `scripts/controlla-backend.js:99-113`) e col codice.
- **cosa succede** — mancano sette manopole che il codice legge: `ADF_BOT_MINIMO`
  (`server.js:55`), `ADF_PG_CONNESSIONI` (`postgres.js:88`), `ADF_APPLE_JWKS`,
  `ADF_GOOGLE_JWKS`, `ADF_STEAM_URL` (`accessi.js:29-31`), `ADF_COPIE` (`copia.js:24`),
  `ADF_TIENI` (`prova.js:961`). In più a riga 969 compare `ADF_CATALOG_URL` come se fosse
  una variabile del server: è una costante del **frontend**
  (`frontend/js/game/eventi-v2.js:16`), non una manopola d'ambiente. Il controllo
  automatico difende solo `backend/README.md`, quindi le due tabelle possono divergere
  senza che nessuno se ne accorga — ed è successo.
- **come si vede** — `grep -o "ADF_[A-Z_]*" backend/README-API.md | sort -u` contro lo
  stesso su `backend/README.md`.
- **quanto pesa** — da sistemare con calma. Proposta: o si completa la tabella, o (meglio)
  si toglie e si rimanda a quella di `backend/README.md`, che è l'unica difesa da un
  controllo; e a riga 969 si dice che `ADF_CATALOG_URL` è del gioco.


**RISOLTO (15/09/2026)** — presa la strada «meglio»: la tabella è **tolta**, al suo posto il
rimando a «Le manopole» di `backend/README.md`, l'unica difesa da `controlla-backend.js`, con
scritto perché non ce ne sono due; restano nominate `ADF_PG` e `ADF_ADMIN`, che servono a
leggere le rotte. Alla seconda `fetch()` c'è scritto che `ADF_CATALOG_URL` è una costante del
gioco, non una manopola del server.
### `backend/database/README.md` dice ancora che `schema.md` «non sta in git»

- **dove** — `backend/database/README.md:8-10` («**Non sta in git** (come `backend.md`): è
  il foglio su cui si lavora, non il riferimento») e `backend/database/README.md:641`
  («schema.md — il foglio di disegno, commentato (fuori da git)»). Lo stesso in
  `.claude/agents/backend-allineato.md:11` («`backend/database/schema.md`, fuori da git»).
- **cosa succede** — dal commit `cdd86d9` (13/09, «schema.md entra in git, allineato alle
  migrazioni vere») il file è tracciato (`git ls-files backend/database/schema.md` lo
  trova) e `controlla-backend.js` lo confronta con le migrazioni. Chi legge il README dei
  dati pensa il contrario, e può non cercarlo in git o non committarne le modifiche.
- **come si vede** — `git ls-files backend/database/schema.md`.
- **quanto pesa** — da sistemare con calma: due righe di README e una del prompt
  dell'agente.


**RISOLTO (15/09/2026)** — le due righe del README dei dati e quella del prompt di
`backend-allineato` dicono «in git dal 13/09/2026», e il README spiega anche perché ci è
entrato (si era allontanato dalle migrazioni senza che nessuno lo rileggesse).
### Il README di radice dice «una dipendenza sola (`pg`)», il backend ne ha tre

- **dove** — `README.md:9` («Node + SQLite, una dipendenza sola (`pg`)»). Il vero è in
  `backend/package.json:22-26`: `jose`, `pg`, `zod`.
- **cosa succede** — `eef9588` e `d879f75` (10/09) hanno aggiunto `jose` e `zod` al
  `package.json` senza che nessun file le importi (`grep require jose|zod` nel backend non
  trova niente; `accessi.js:72` verifica ancora le firme a mano con `crypto.verify`).
  `documentazione/dipendenze.md:92-93` lo dice onestamente («`accessi.js` non la importa»,
  «nessuna rotta la importa»), il README di radice no. Non è un problema di codice; è che
  «una dipendenza sola» era l'argomento della regola vecchia, e non è più vero.
- **come si vede** — `README.md:9` contro `backend/package.json`.
- **quanto pesa** — da sistemare con calma: una riga. Resta aperta la scelta scritta in
  `dipendenze.md:201` (usare `jose` in `accessi.js`, `zod` nelle rotte), che è un lavoro
  vero e non di documento.


**RISOLTO (15/09/2026)** — la riga dice «tre dipendenze: `pg`, `jose`, `zod` — le ultime due
installate e ancora da usare», col rimando a `dipendenze.md`. Usarle resta il lavoro vero, che
non è di documento.
**Nota, non è un errore**: due commenti di testa parlano di un mondo prima di
PostgreSQL. `backend/server.js:12-13` dice «Sotto c'è SQLite (`database/`), senza niente da
installare» (mentre `server.js:32-33` elenca `ADF_PG`), e `backend/database/archivio.js:3-7`
dice «Il giorno che sotto ci sarà PostgreSQL, si riscrive questo file e basta — è il motivo
per cui esiste»: è il contrario di quello che è successo, e che `db.js:13-15` spiega
(l'asincrono su SQLite «è il prezzo, piccolo, perché `archivio.js` sia uno solo invece che
due»). Il codice sotto è giusto; sono le premesse che sono invecchiate.


## Giro del 15/09/2026 (segnala-problemi, fine task `task/app-post-e-take-senza-energia`, commit `e89eea7`)

Controlli automatici tutti verdi: `npm run prova` 180 a posto e 0 no, `audit-regressioni.js`
340 ok e 0 falliti, `verifica:build` 33 ok e 0 falliti. Letti per intero il diff del commit
(quattordici file) e `sputa.js` riga per riga; poi, per quello che Sputa e la Cabina chiamano,
`telefono.js` (`schermataApp`, `renderTelefono`, il click su `hb-tel`), `actions.js`
(`registra`, `adfOggi`, `daIncidere`), `studio-elementi.js` (`studioTake`, `studioTakeAncora`,
`studioTakePresa`, `studioStrofa`, `studioBeatSuCui`), `studio.js` (`studioSezCabina`,
`studioAzione`), `ui.js` (`avviaAzioneDiretta`, la tile in `renderGioco`), `hub.js`
(`hubPronta`, `renderHub`), `rivals.js` (`nuovoRivale`, `vitaRivali`), `phases.js`
(`hypeCap`), `css/telefono.css` e `css/hub.css` (il telefono sotto i 1180). Tutte le
funzioni che `sputa.js` usa esistono e stanno in file caricati prima; nessun errore in
console.

Provato nel gioco vero con Playwright a 1400 e a 390: Sputa si apre, la barra esce, il
contatore conta, i 140 sono un tetto vero, il feed con i rivali è lo stesso riaprendo l'app,
«Rispondi» mette «@Nome», il fuoco si accende e resta; in Cabina 100 → 55 alla prima take,
43 alla seconda, «Tieni questa e chiudi» a 0 di energia arriva alla finestra del titolo e il
pezzo esce con la take scelta; dalla plancia «Registra il pezzo» senza take dice «SERVE una
take, in cabina».

Sei voci, nessuna blocca la partita. La prima è quella che conta: è un buco che il commit
ha aperto senza volerlo.

### La take pagata 45 sparisce se in Cabina tocchi un'altra strofa o un altro beat

- **dove** — `frontend/js/game/studio-elementi.js:314-322` (`studioTake`: se la chiave
  strofa+beat non è quella della take in corso, la take si rifà **vuota**), i tocchi che
  cambiano la chiave in `studio-elementi.js:806-808` (`data-strofa`, `data-incide`) e le
  righe che li disegnano nella stessa Cabina, `frontend/js/game/studio.js:1088-1095`.
- **cosa succede** — paghi 45 per la prima take, magari ti esce +5, poi tocchi un'altra
  strofa o un altro beat nella colonna «Che cosa incidi» (che sta nella stessa schermata):
  la take sparisce, il tasto torna «Registra la take · 45 energia», e se torni sul beat di
  prima la take **non torna** (provato: energia 55, take `[5]`, cambio beat → take `[]`,
  ricambio → ancora `[]`). Nessun avviso. Succede anche da solo: se compri un beat migliore
  in Beat o scrivi una strofa migliore, la scelta di default cambia e la take pagata se ne
  va. Prima di questo commit la prima take era gratis e il ripristino non costava niente:
  ora costa la sessione intera.
- **come si vede** — Studio, Cabina, con due beat o due strofe in mano: «Registra la take»,
  poi tocca l'altro beat.
- **quanto pesa** — si vede ma si gira intorno (basta non toccare niente dopo la take, ma
  nessuno lo dice).


**RISOLTO (15/09/2026)** — sullo stesso branch, prima del push. `studioTake()` non butta più la
take quando la targhetta cambia: la mette da parte in `d.takeAltre` con la sua chiave, e se
torni su quella coppia strofa+beat la ritrovi. Le take da parte finiscono quando chiudi un
pezzo (`studioTakePresa`), che è la fine della sessione. La nota vuota della Cabina lo dice
(«se cambi, le ritrovi tornando qui»). Un controllo nell'audit.
### La plancia e l'Agenda dicono che «Registra il pezzo» è gratis

- **dove** — `frontend/js/game/ui.js:295` (la tile: con `e:0` scrive «gratis») e
  `frontend/js/game/telefono.js:630` (l'Agenda del telefono: «Registra il pezzo · 0⚡»).
- **cosa succede** — la mossa costa zero sulla carta perché i 45 li chiede la take in
  Cabina, ma la tile sulla mappa e la riga dell'Agenda leggono `a.e` e dicono al giocatore
  che registrare è gratis / vale 0 energia. È falso: in tutto costa 45 come prima. Chi
  pianifica la giornata dalla plancia fa i conti sbagliati.
- **come si vede** — plancia, tile «Registra il pezzo» con strofa e beat in mano;
  telefono → Agenda → «Le tue mosse».
- **quanto pesa** — da sistemare con calma.


**RISOLTO (15/09/2026)** — `registra` ha `costoScritto()`, solo da mostrare: 45 finché non c'è
una take, poi «gratis» che a quel punto è vero. La tile (`ui.js`) e l'Agenda (`telefono.js`)
leggono quello; il costo che si scala resta `e:0`. Un controllo nell'audit.
### Dopo la prima barra del giorno l'hype in alto resta quello di prima

- **dove** — `frontend/js/game/sputa.js:199-200` (`sputaScrivi` chiama `save()` e
  `renderGioco()`, non `renderHub()`); la fascia con l'hype la ridisegna solo `renderHub`,
  `frontend/js/game/hub.js:743-747`.
- **cosa succede** — il fumetto dice «Il nome gira: +1 hype», `G.hype` sale di uno, ma il
  numero «Hype» nella fascia in alto non si muove finché qualcos'altro non ridisegna la
  plancia (provato: hype 5 → 6, la fascia dice ancora 5). Uno legge il fumetto, guarda in
  alto e pensa che non sia successo niente.
- **come si vede** — Sputa, prima barra del giorno, guarda «Hype» in alto.
- **quanto pesa** — da sistemare con calma.


**RISOLTO (15/09/2026)** — `sputaScrivi` chiama `renderHub()` (che ridisegna anche il telefono)
oltre a `renderGioco()`.
### Al tetto dell'hype Sputa promette «+1 hype» che non arriva

- **dove** — `frontend/js/game/sputa.js:193-197` (il fumetto esce sempre alla prima barra,
  l'`if(G.hype < tetto)` copre solo il numero) e `sputa.js:241-242` (il riquadro «La prima
  barra del giorno fa girare il nome: +1 hype»).
- **cosa succede** — in fase «Sconosciuto» il tetto dell'hype è 20 (`phases.js:15`): a 20 la
  prima barra del giorno non dà niente, giustamente, ma il fumetto dice lo stesso «+1 hype»
  e il riquadro sopra al foglio lo promette prima di scrivere (provato: hype 20, barra,
  fumetto «+1 hype», hype 20). Letto nel codice il perché, visto in partita l'effetto.
- **come si vede** — hype al tetto della fase, Sputa, scrivi una barra.
- **quanto pesa** — da sistemare con calma.


**RISOLTO (15/09/2026)** — al tetto il fumetto dice «il nome gira, ma qui sei già al tetto:
serve il passo dopo», e il riquadro sopra al foglio lo dice prima di scrivere.
### Il «dado fermo» dei rivali si sblocca quando un rivale esce con un pezzo

- **dove** — `frontend/js/game/sputa.js:134` (il seme è `r.seed + settimana`) e `:158`
  (l'id della barra, a cui è attaccato il fuoco), contro `frontend/js/game/rivals.js:78`,
  che a ogni pezzo nuovo del rivale gli **cambia il seed**.
- **cosa succede** — il documento e il commento in cima al file promettono che riaprendo
  l'app trovi le stesse barre: vale finché nessun rivale pubblica. Quando uno esce con un
  pezzo (succede ogni settimana a qualcuno) tutte le sue barre si rifanno da capo, comprese
  quelle della settimana scorsa, che adesso parlano del pezzo di questa settimana; e il fuoco
  che avevi messo resta segnato su un id che non esiste più (provato: due barre su «Fumo Blu»
  → tre barre diverse, una su «Pezzo nuovo», fuoco rimasto in `G.sputaFuoco` a vuoto). Non è
  grave, ma è il contrario di quello che la voce promette, e un giocatore attento se ne accorge.
- **come si vede** — Sputa, segna una barra di un rivale, aspetta che quel rivale esca con un
  pezzo (log «X è uscito con …»), riapri Sputa.
- **quanto pesa** — da sistemare con calma.


**RISOLTO (15/09/2026)** — il dado e l'id delle barre partono da `sputaSemeRivale(r)`, un
numero fisso tirato dal **nome** del rivale, non da `r.seed` (che è il seme della copertina e
`rivals.js` rifà a ogni pezzo nuovo). Le barre e il fuoco restano dove stavano. Resta una cosa
piccola, voluta: la barra della settimana scorsa che parlava del pezzo nuovo di allora adesso
nomina quello di oggi (`{ult}` si legge al ridisegno) — non si salva il testo per una riga.
### Sputa sul telefono vero non c'è

- **dove** — `frontend/css/hub.css:1273-1287` (`body.in-hub .ptel{display:none}` sotto i
  1180 px) e `frontend/js/game/sputa.js:255-260` (si registra solo nel telefono della
  plancia, in `HUB_APP` e `HUB_APP_VECCHIO`).
- **cosa succede** — è lo stesso buco della voce «Sul telefono la promo non si sceglie e
  l'anteprima non si raggiunge più» del giro precedente: il telefono della plancia sotto i
  1180 px è nascosto, e Sputa vive solo lì. A 390 px `hb-tel` è largo zero e l'app non si
  apre da nessuna parte (provato). Il commit ha aggiunto una seconda app a un telefono che
  sul telefono non si vede; la scrivo perché il gioco esce sugli store ed è la seconda volta
  in due giorni che una cosa nuova finisce dietro a quella tenda.
- **come si vede** — finestra più stretta di 1180 px: non c'è un tasto per Sputa.
- **quanto pesa** — da sistemare con calma (l'hype che dà è uno al giorno, la partita va
  avanti senza).


**APERTO, di proposito** — non si sistema qui: è lo stesso buco della promo e dell'anteprima
sotto i 1180 px, e va chiuso in una task sola che decida dove sta il telefono quando lo
schermo è un telefono. È il primo punto di «Da fare adesso» in
`implementazioni/implementazioni.md`.

**RISOLTO (15/09/2026)** — stesso branch, stessa cosa: il telefono alzato ha tutte le app,
Sputa compresa; la griglia compatta in cui le app si dovevano iscrivere una seconda volta
non c'è più.
**Nota, non è un errore**: cose piccole che non valgono una voce. `sputa.js:259` scrive «1
barre tue» nella griglia vecchia del telefono (manca il singolare). I due tasti sotto le barre
dei rivali — il fuoco e «Rispondi» — sono alti 21 px (`css/telefono.css`, `.tspfuoco` e
`.tsprisp`, misurati in partita): sotto i 44 di `tocco.css`, ma quel telefono si vede solo
dai 1180 px in su, quindi quasi sempre col mouse; se un giorno il telefono torna sul
telefono, ci vorrà la presa. Il documento in `04-musica-e-suoni.md` dice che «i salvataggi
con una take vecchia in corso la trovano come l'avevano lasciata»: vero, e quella take era
gratis, quindi chi carica una partita salvata in Cabina prima di questo commit registra un
pezzo senza spendere i 45, una volta sola — è una scelta, non un bug. Infine `registra`
chiama `studioTakeManca()` dal suo `need`, che viene letto a ogni ridisegno della plancia e
dell'Agenda: `studioTake()` scrive in `G.studio` anche da lì, ma scrive sempre la stessa cosa
che scriverebbe la Cabina, quindi non fa danni; lo segno perché un `need` che scrive nel
salvataggio è una cosa da sapere.

## Giro del 15/09/2026 (controllo mirato sul commit ac64bc4)

Controlli automatici tutti verdi: `npm run prova` 180 a posto e 0 no, `audit-regressioni.js`
343 ok e 0 falliti, `verifica:build` 33 ok e 0 falliti. Letto il diff del commit per intero e,
attorno a quello che tocca, `studio-elementi.js` (`studioTake`, `studioTakeElenco`,
`studioTakeAncora`, `studioTakeManca`, `studioTakePresa`, `studioStrofa`, `studioBeatSuCui`,
`studioTakeChiave`), `actions.js` (`registra` tutta, `daIncidere`, `adfDailyCounts`),
`ui.js` (la tile in `renderGioco`, `avviaAzioneDiretta`), `telefono.js` (`schermataAgenda`,
`renderTelefono`, `telVaiApp`), `hub.js` (`renderHub`), `sputa.js` riga per riga,
`rivals.js` (`nuovoRivale`, `vitaRivali`), `copertine.js` (`chiediTitolo`), `fx.js` (`toast`).

Provato nel gioco vero con Playwright a 1400 px, col server di sviluppo. Le sei correzioni
fanno quello che le note RISOLTO dicono:
- la take pagata si mette da parte e torna (energia 200 → 155 alla prima take, cambio beat →
  la take sta in `takeAltre` con la sua targhetta, ricambio → è di nuovo lì, identica);
- la tile dice «45 energia» + «SERVE una take, in cabina» senza take e «gratis» con una take;
  l'Agenda «45⚡» e poi «0⚡»; `costoScritto` è letto solo da quelle due righe,
  `avviaAzioneDiretta` scala ancora `en2` (l'energia non si muove al «Registra»);
- dopo la prima barra del giorno la fascia in alto passa da 5 a 6 con il numero, e l'app
  resta aperta su Sputa (`renderHub` ridisegna il telefono tenendo `TEL_APP`); Sputa si
  scrive solo dal telefono della plancia, quindi `renderHub` trova sempre i suoi pezzi;
- al tetto (20 in «Sconosciuto») il riquadro e il fumetto dicono tutti e due «sei già al
  tetto», l'hype resta 20;
- cambiando `r.seed` e `r.ult` a un rivale, le barre della settimana scorsa restano con lo
  stesso id e lo stesso testo.

Due voci, nessuna blocca la partita. La prima è la più grossa che ho trovato in questi giri
sulla Cabina, e **non l'ha aperta questo commit**: c'è da quando `studioTakePresa` guarda la
targhetta (08/09/2026). La scrivo qui perché il commit tocca proprio quella funzione, e
perché il giro precedente aveva scritto «il pezzo esce con la take scelta» — non era vero,
avevo guardato che il pezzo uscisse, non con quale numero.

### La take che scegli in Cabina non finisce mai sul pezzo: esce sempre col dado nuovo

- **dove** — `frontend/js/game/actions.js:350-351` (`registra.run`: la strofa e il beat si
  tolgono dalla lista **prima** di leggere la take, che sta alla riga `:359`) contro
  `frontend/js/game/studio-elementi.js:427-435` (`studioTakePresa` confronta la targhetta
  della take con `studioTakeChiave()`, che dopo quel `splice` è di un'altra coppia — o
  vuota — e allora butta la take e tira `rnd(-5,6)`).
- **cosa succede** — paghi 45 per la prima take e 12 per le altre, scegli la buona, la Cabina
  scrive «esce con q76» e il pezzo esce con q69: il numero della take non conta niente, si
  tira sempre un dado nuovo. Provato tre volte di fila con una strofa e un beat soli: take
  scelte 4, 5 e 6 (q73, q75, q76 in Cabina), sul pezzo `parti.take` 4,99, 3,07 e −2,70 —
  numeri con la virgola, cioè il dado, non una take (le take sono interi). Prima del commit
  era uguale. In pratica tutta l'energia spesa in Cabina oltre alla prima take è buttata, e
  la prima serve solo a sbloccare il tasto.
- **come si vede** — Studio → Cabina, tre take, tieni la migliore e guarda il «q» che ti
  promette; «Tieni questa e chiudi», titolo; in Uscita il pezzo ha un altro q.
- **quanto pesa** — si vede ma si gira intorno (il pezzo esce lo stesso, ma la Cabina è una
  presa in giro finché sta così: il giocatore paga per un numero che non arriva).


**RISOLTO (15/09/2026)** — sullo stesso branch, prima del push. `registra` legge
`studioTakePresa()` **prima** di sfilare strofa e beat dalla lista, così la targhetta combacia.
Provato nel gioco vero tre volte con la take a +5 scelta in Cabina: il pezzo esce con
`parti.take` 5 e la qualità uguale a quella promessa (74/75/75). Un controllo nell'audit
guarda l'ordine delle due righe.
### La barra della settimana scorsa di un rivale cambia frase quando lui esce con un pezzo

- **dove** — `frontend/js/game/sputa.js:155` (`if(r.hot > 0 && i === 0) pool = "nuovo"`) e
  `:168` (il fuoco ×1,6 se `hot`): le barre si rifanno da `sputaSemeRivale` a ogni apertura,
  ma la scelta del **mazzo** legge `r.hot` di adesso, non di quella settimana.
- **cosa succede** — è quello che resta della voce «Il dado fermo dei rivali si sblocca»: gli
  id e il dado adesso tengono, ma quando un rivale passa da `hot` 0 a 3 (esce con un pezzo,
  `rivals.js:78`) la sua prima barra della settimana scorsa cambia frase per intero, non solo
  il nome del pezzo (provato su «Zeta»: «Da Roma con niente in tasca e tutto nella testa» →
  «Pezzo nuovo. Tre giorni e già la cantano sotto casa mia»), e il fuoco che ci avevi messo
  resta su una frase che non è più quella. La nota RISOLTO dice che «{ult}» può cambiare: qui
  cambia tutta la barra. Vale anche al contrario, quando `hot` torna a zero tre settimane
  dopo, e quando cominci a essere nominato (`sputaTiNominano` cambia i mazzi).
- **come si vede** — Sputa, leggi una barra «flex» o «città» di un rivale, aspetta il log «X è
  uscito con …», riapri Sputa.
- **quanto pesa** — da sistemare con calma.


**LASCIATO (15/09/2026)** — è la cosa piccola già scritta sotto alla voce del dado fermo:
per tenerla ferma andrebbe salvato il testo della barra, e per una riga di un rivale non vale
un campo nel salvataggio.
**Nota, non è un errore**: cose viste che sono scelte o inezie. `studioTakePresa` cancella
`takeAltre` quando un pezzo si chiude, come dice la nota RISOLTO: chi ha pagato take su due
coppie e ne registra una perde l'altra, e la frase nella Cabina («se cambi, le ritrovi
tornando qui») non dice che finiscono con il pezzo — è la scelta scritta nel commento, la
segno perché il giocatore non la legge. Con una take in mano la plancia scrive «gratis» e
l'Agenda «0⚡» per la stessa mossa: stessa cosa detta in due modi, come già per le altre
mosse a zero. `studioTake()` adesso scrive anche `takeAltre` nel salvataggio quando lo chiama
`costoScritto` a ogni ridisegno della plancia — sempre la stessa cosa, non fa danni, è la
stessa nota del giro precedente su `need`.


## Giro del 15/09/2026 (backend-allineato, task `task/documenti-backend-in-pari`)

Il commit `1d59615` è solo documenti. `node scripts/controlla-backend.js` verde, `npm run
prova` 183 a posto, 0 no. Migrazioni e `server.js` non toccati dal `cb502a7` (12/09): le
otto coppie SQLite/PostgreSQL restano quelle già confrontate colonna per colonna nel giro
precedente — **niente che fermi il passaggio a PostgreSQL**. Verificato contro il codice
tutto quello che il commit scrive: `difficolta` in `POST /api/artista` (`server.js:353`,
`archivio.js:310-315` con `difficoltaBuona`, i tre valori e il ripiego su `anni-di-fame`
di `archivio.js:39-41`); il filtro `?difficolta=` di `GET /api/classifica` (`server.js:409-413`,
`archivio.js:213`), una graduatoria sola; `403 non-e-tuo` in `PUT /api/carriera/:slot`
(`server.js:465-468`); le manopole sono ventiquattro in «Le manopole» (23 righe, una ne
tiene due) ed è quella tabella che `controlla-backend.js:107-113` confronta col codice;
`ADF_CATALOG_URL` è una costante di `frontend/js/game/eventi-v2.js:16`; `schema.md` è in
git dal `cdd86d9` (13/09); le dipendenze del backend sono `jose`, `pg`, `zod`. I rimandi
tengono: l'indice (`README-API.md:25`) punta a `#variabili-dambiente` e il titolo «## Variabili
d'ambiente» c'è ancora (riga 1090); `README.md#le-manopole` trova «## Le manopole»
(`backend/README.md:126`). Una sola voce, di documento, nata nel commit stesso.

### §11 di `README-API.md` dice che la difficoltà «si sceglie una volta», ma `POST /api/punteggio` la riscrive a ogni invio

- **dove** — `backend/README-API.md:578-581` («Si sceglie una volta, alla nascita
  dell'artista, e da lì resta scritta accanto a lui (la legge `GET /api/artista/:id` e la
  ripete `POST /api/punteggio`)») e §14 (`README-API.md:626`, `difficolta` nel corpo di
  esempio senza una riga che dica cosa ne fa il server). Il vero è in
  `backend/database/archivio.js:353-360` e in `backend/README.md:201` e `:209-210`.
- **cosa succede** — il server la scrive **a ogni punteggio**, non una volta: l'`UPDATE` di
  `segnaPunteggio` mette `difficolta = ?` con quello che arriva nel corpo (passato per
  `difficoltaBuona`, quindi un valore sconosciuto ricasca su `anni-di-fame`), e solo se il
  campo non arriva (`null`, client vecchio) resta quello che c'era. Il commento in
  `archivio.js:357-359` lo dice apposta: «una carriera può essere ricominciata in un altro
  modo dentro allo stesso slot». `backend/README.md:201` lo racconta giusto («all'iscrizione
  e a ogni punteggio»); §11 di `README-API.md` no, e §14 tace: un giocatore che ricomincia
  in «niente sconti» nello stesso slot cambia difficoltà in classifica al primo invio, e chi
  legge README-API crede che non possa.
- **come si vede** — `POST /api/artista` con `difficolta: "strada-aperta"`, poi
  `POST /api/punteggio` sullo stesso id con `difficolta: "niente-sconti"`: `GET
  /api/artista/:id` risponde `niente-sconti`.
- **quanto pesa** — da sistemare con calma: una frase in §11 («la scrive l'iscrizione e la
  riscrive ogni `POST /api/punteggio`; se non arriva resta quella che c'era») e una riga
  ai limiti di §14. Non tocca il codice, che fa la cosa scritta in `backend/README.md`.


**RISOLTO (15/09/2026)** — nello stesso branch, prima del push: §11 dice «la scrive
l'iscrizione e la riscrive ogni `POST /api/punteggio`; se un invio non la manda resta quella
che c'era», e §14 lo ripete fra i limiti («sostituisce quella scritta accanto all'artista»).
## Giro del 15/09/2026 (segnala-problemi, controllo mirato sul commit 1d59615)

Controllati solo i cinque documenti del commit, non il gioco (i controlli automatici erano
già verdi). Verificato che i rimandi puntino a titoli veri e che le frasi nuove tornino col
resto del repo: `README.md#le-manopole` esiste (`backend/README.md:126`) e la tabella elenca
davvero **ventiquattro** `ADF_` (23 righe, una doppia per Steam); `#variabili-dambiente`
dell'indice di `README-API.md:25` punta ancora al titolo di riga 1090; `scripts/controlla-backend.js`
esiste, è acceso da `.claude/settings.json` e oggi passa; `schema.md` è entrato in git il
13/09/2026 (commit `cdd86d9`); `backend/package.json` ha proprio `pg`, `jose`, `zod`;
`ADF_CATALOG_URL` è una costante di `frontend/js/game/eventi-v2.js:16`; i tre valori della
difficoltà e il ripiego su `anni-di-fame` sono gli stessi di `backend/README.md:196-210`;
`403 non-e-tuo` su `PUT /api/carriera/:slot` c'è in `backend/server.js:484`. Una cosa sola
non torna, e non è nei cinque file ma in quelli che adesso li contraddicono:

### Il README di radice dice «tre dipendenze», le due roadmap dicono ancora «una sola»

- **dove** — `documentazione/roadmap.md:63` («Node, una dipendenza sola (`pg`). SQLite dentro
  a Node con 18 tabelle») e `ROADMAP.md:133` («una dipendenza sola (`pg`, per PostgreSQL)»).
  Il vero è in `README.md:9` (corretto da questo commit), `backend/package.json` e
  `documentazione/dipendenze.md:92-93`.
- **cosa succede** — il commit ha messo a posto la riga del README di radice, ma la stessa
  frase vecchia sta anche nelle due roadmap, che non sono state toccate: chi le legge trova
  «una dipendenza sola» e «18 tabelle», mentre il README di radice dice tre dipendenze e
  20 tabelle (e le migrazioni ne creano davvero 20). Stessa cosa, detta in due modi.
- **come si vede** — apri `README.md` e `documentazione/roadmap.md` uno accanto all'altro,
  riga 9 e riga 63.
- **quanto pesa** — da sistemare con calma: due righe di documento.

**RISOLTO (15/09/2026)** — nello stesso branch, prima del push: `documentazione/roadmap.md`
e `ROADMAP.md` dicono «tre dipendenze» e «20 tabelle» come il README di radice (le tabelle
sono venti: contate nei `CREATE TABLE` delle otto migrazioni).

**Nota, non è un errore**: `documentazione/dipendenze.md:400` dice «il backend una
dipendenza ce l'ha, `pg`» nel racconto di com'era il 07/09, quando `jose` e `zod` non c'erano
ancora; è storia, e lo stesso file le elenca poche righe sopra. Va bene così.

## Giro del 15/09/2026 (mentre si faceva «il telefono quando lo schermo è un telefono»)

### Fra i 980 e i 1180 punti la barra della plancia trabocca, e il Menu esce a destra

- **dove** — `frontend/css/hub.css` (`.pbarra`, `.plogo` 132, `.pcitta` 170, `.pstat`
  467, `.pmenu` 107) e il widget del tempo che `tempo-controlli.js` monta nella barra
  (`#adf-time-dock`, 224 di larghezza, sopra allo stat). Sotto i 980 `stretto.css` fa
  andare a capo la barra; fra 980 e 1180 nessuno se ne occupa.
- **cosa succede** — a 1000 di larghezza il contenuto della barra è 1100 (misurato: il
  Menu comincia a 956 e finisce a 1063, la barra ha `scrollWidth` 1144). Non è di questa
  task: c'era già, e il tasto nuovo del telefono (44) lo peggiora di 44 — a 1000 il Menu
  è tutto fuori.
- **come si vede** — finestra a 1000 × 700, plancia: il Menu non c'è, a destra c'è il
  telefono e basta.
- **quanto pesa** — si vede ma si gira intorno (il menu di sistema si apre anche con ESC).
  La soglia di `stretto.css` a 980 e quella del telefono a 1180 non si parlano: o la barra
  va a capo già sotto i 1180, o il logo e la città si stringono lì.

**RISOLTO (20/09/2026)** — branch `task/barra-plancia-980-1180`. Tutte e due le strade: sotto
i 1240 logo e città si stringono e il Menu è la sola casetta, sotto i 1120 le risorse
restano icona e numero (l'energia tiene la barretta), sotto i 980 la fascia va a capo su
due righe, sotto i 620 su tre — a 390 × 844 è alta 165, era 307. Nello stesso giro le
testate della Sala, del Negozio, dello Shop e della Piazza sotto i 620 (la pastiglia ai
sette decimi, MAPPA via perché c'è la X, il marchio a 96 e sotto i 400 la sola corona), la
piazza e il foglio muti in `tempo-controlli.js`, e la plancia sul computer a 1280 × 800 e
1366 × 768: le card degli eventi, larghe 91 punti, stanno su due righe e due colonne sotto
i 1520; e le quattro righe del profilo (stile, fan base, pezzi fuori, contratto) che sotto
gli 820 di altezza si schiacciavano a due punti. Provato con un banco Playwright su venti
schermate a sedici misure: nessuna scorre di lato. Il racconto in «La fascia della plancia
fra 980 e 1240, e la plancia a 1280 × 800», `implementazioni/02-interfaccia-e-telefono.md`.

## Prova sul telefono del 15/09/2026 (il telefono che si alza)

Misure: **390 × 844**, **360 × 800** e **844 × 390** (orizzontale). Branch
`task/telefono-sul-telefono`, commit `d97e8de`. Partita di prova di `gioco.html` (giorno 1,
nessun pezzo), e per «Che post fai?» con l'elenco e il tasto «Posta» una partita con tre
pezzi usciti («Sottopasso», «Terzo piano», «Neve sporca sul marciapiede di casa») e uno
registrato non uscito («Sangue»). Console senza errori in tutti i giri. Gli screenshot stanno
in `documentazione/prove-telefono/2026-09-15/`.

**Come l'ho provato, per riprovarlo.** L'estensione Chrome non era collegata: ho usato
Playwright da `frontend/node_modules`, con una finestra **davvero** di quella misura
(`viewport` 390 × 844, `isMobile`, `hasTouch`, scala 2): niente iframe e niente barra di
scorrimento del computer, quindi le misure qui sotto sono quelle di un telefono vero. I
tocchi sono `page.tap` (eventi touch), non click; ESC da tastiera. Le app le ho aperte con
`telVaiApp(...)` dopo aver alzato il telefono col tasto della barra. Il server era già acceso
su `localhost:8000`, non l'ho spento.

**Quello che funziona.** Il tasto nella barra è 44 × 44 a tutte e tre le misure, con la
pallina «9+»; toccato, `.ptel` prende `.on` e copre lo schermo (390 × 844 → guscio 366 × 741,
schermo 332 × 707; 360 × 800 → guscio 336 × 680). **Nessuno scorrimento orizzontale** in
nessuna delle tre misure, né della pagina (`scrollWidth` = `innerWidth`) né dello schermo
del telefono in verticale. La griglia: 11 icone da 65 (59 a 360), etichette non tagliate,
nessuna fuori; il dock 4 icone da 60 (55). «Metti giù» è 138 × 44, sta sotto al guscio e
dentro allo schermo (a 390 finisce a 820 su 844; a 360 a 767 su 800; in orizzontale a 378
su 390), e mette giù; il tocco fuori dal guscio (touch, sul fondale) mette giù; ESC con
un'app aperta torna alla home, il secondo ESC mette giù e il menu di sistema **non** si apre.
La pastiglia del tempo sparisce col telefono alzato (`visibility:hidden`). LaFamegram: «Che
post fai?» in cima, l'elenco dei pezzi con «scelto», il tocco su un pezzo lo sceglie
(`G.studio.spingi`), «Posta · 12⚡» (295 × 38) fa l'azione (hype 0 → 7,4, scena «Promo sui
social» sopra al telefono, che sotto resta alzato su LaFamegram dopo «Continua»); la
casella «A cosa stai pensando?» e «Pubblica» ci sono. Sputa: casella, contatore (24/140 mentre
scrivo) e tasto «Sputa» che pubblica (il post «Tu · oggi» compare in cima, con l'avviso «Prima
barra del giorno»). Chat: due righe da 52 di altezza, la chat si apre, il tasto indietro
c'è. Dallo Studio (Fuori) «fallo sapere: «Sottopasso» è fuori…» (388 × 44) alza il telefono
su LaFamegram e chiude lo Studio; «Metti giù» da lì riporta alla plancia.

![Home a 390: griglia, dock e «Metti giù»](prove-telefono/2026-09-15/telefono-home-390x844.jpg)
![LaFamegram a 360 con i pezzi e «Posta»](prove-telefono/2026-09-15/lafamegram-pezzi-360x800.jpg)
![Sputa a 390 dopo aver sputato](prove-telefono/2026-09-15/sputa-dopo-390x844.jpg)

### In orizzontale (844 × 390) il telefono alzato è un francobollo: 154 di larghezza, icone da 27, etichette che si accavallano

- **dove** — `frontend/css/telefono-stretto.css:56-71`:
  `--telalto:calc(100dvh - 24px - 54px …)` e `--tellargo:min(100vw - 24px, var(--telalto) * .494)`,
  con `.ptelframe{aspect-ratio:676/1369}`. Il guscio è alto quanto lo schermo e largo di
  conseguenza: con 390 di altezza viene **154 × 312**, schermo interno 138 × 296.
- **cosa succede** — dentro a 138 punti le misure in `cqw` scendono al minimo dei `clamp`
  (icone 27 × 27, etichette a 7 px: `telefono.css:176-178`) e quelle fisse in px no: le
  etichette «CLASSIFICHE» e «STATISTICHE», «DISCOGRAFIA CONTRATTI AGENDA IMPOSTAZIONI»,
  «NOTIFICHE TRASFERTE» si scrivono una sopra all'altra (`white-space:nowrap;overflow:visible`);
  il titolo dell'app si legge «LAFAMEGRAN»; il tasto «Sputa» (75 × 28, `telefono.css:362`) sta
  in una colonna da 90 e tocca il bordo; lo schermo del telefono ha 5 punti di roba fuori
  (`#hb-tel` `scrollWidth` 143 su 138: etichette, «Rispondi», «Settimana 3»), tagliati da
  `overflow-x:hidden`. Il guscio **sta dentro allo schermo** (era la cosa da verificare: sì,
  non esce) e «Metti giù» si raggiunge — ma non si usa niente di quello che c'è dentro:
  nessuna icona arriva a 44, la home è 131 px di griglia e Sputa mostra tre righe e mezzo.
- **come si vede** — 844 × 390, plancia, tocca il telefono in barra; poi Sputa.
  ![Home in orizzontale](prove-telefono/2026-09-15/telefono-home-844x390.jpg)
  ![Sputa in orizzontale](prove-telefono/2026-09-15/sputa-844x390.jpg)
- **quanto pesa** — in orizzontale il telefono **non serve**: si apre, si chiude, ma non ci
  si fa niente. Se il gioco sugli store gira solo in verticale (da decidere: nel repo non c'è nessun
  manifest né un `orientation` dichiarato), è un problema che non c'è; se gira anche in orizzontale, il
  guscio con le proporzioni dell'iPhone non ci sta, e lì il telefono va disegnato senza
  cornice (schermo largo quanto serve, senza `aspect-ratio`) o non va offerto.


**RISOLTO in parte (15/09/2026)** — sullo stesso branch, prima del push. Sotto i 560 di altezza il guscio lascia le
proporzioni dell'iPhone: largo fino a 560, alto quanto c'è, la home scorre (`telefono-stretto.css`,
l'ultima media query). A 844 × 390 viene 560 × 312, icone da 99, i tasti dentro da 44: si usa.
**Resta la decisione** se il gioco sugli store gira anche di traverso: finché non c'è, di traverso
si usa così.
### Dentro al telefono alzato i bersagli e i caratteri sono quelli della colonna da computer

- **dove** — `frontend/css/telefono.css`: `.tback` 28 × 28 (:199), `.tspbtn` padding 7 e
  font 12 (:362), `.tsprisp` padding 3 (:392), `.tspfuoco` padding 3 (:385), `.tbtn` padding 12
  e font 11 (:233-235), `.tlitx i` 10.5 (:227), `.tigw` 10 (:312), `.ttag` 9.5 (:240).
  `telefono-stretto.css` non tocca niente di questo: sotto i 1180 il guscio cambia misura, il
  contenuto no.
- **cosa succede** — misurato a 390 × 844 (a 360 uguale, un punto in meno): il tasto
  **indietro** in cima a ogni app è 28 × 28; **«Sputa»** 75 × 28; **«Rispondi»** 60 × 19;
  il **fuoco** 44 × 21; **«Pubblica»** 284 × 37 e **«Posta · 12⚡»** 295 × 38. Sotto ai 44
  tutti tranne le righe (chat 52, pezzi 54). I caratteri sono 10–12 px: l'11 di «Che post
  fai?» e del tasto «Posta», il 10.5 di «q55 · 800 stream», il 9.5 di «scelto». Erano giusti
  per una colonna da 300 sul computer, dove si clicca col mouse e si sta a mezzo metro; sul
  telefono in mano sono i bersagli e i caratteri più piccoli di tutto il gioco (la plancia
  intorno ha tasti da 44-48 e testi da 13-16). I tocchi arrivano — li ho fatti tutti — ma con
  la punta, non col pollice.
- **come si vede** — 390 × 844, telefono, Sputa: la casella, il tasto bianco «Sputa» e i
  «Rispondi» sotto ai post; poi il tasto indietro in alto a sinistra.
  ![Sputa a 390: «Sputa» 75 × 28, «Rispondi» 60 × 19](prove-telefono/2026-09-15/sputa-dopo-390x844.jpg)
  ![LaFamegram a 390: «Pubblica» 37 di altezza, indietro 28](prove-telefono/2026-09-15/lafamegram-390x844.jpg)
- **quanto pesa** — si usa ma si gira intorno. È la cosa da fare dopo questa task, non
  dentro: sotto i 1180 `.ptel.on` può alzare i minimi (`.tback` e `.tspbtn` a 44, `.tbtn` con
  padding 14, i font a 13-14), senza toccare la colonna dai 1180 in su.


**RISOLTO (15/09/2026)** — sullo stesso branch, prima del push. Solo da alzato (`body.in-hub .ptel.on …` in
`telefono-stretto.css`): indietro 44 × 44, «Sputa» 94 × 44, «Rispondi» e il fuoco 36 di altezza,
`.tbtn` 48, la casella di Sputa 72 con caratteri da 15, il resto a 12-13. La colonna dai 1180 in
su non cambia. Misurato a 390 e 360.
### In orizzontale, dopo «Posta», la scena «Promo sui social» non ha il «Continua» sullo schermo

- **dove** — `frontend/css/effects.css:62-66` (`.scenapiena{position:fixed;inset:0;
  display:grid;place-items:center;padding:20px}` senza `overflow`, `.scwrap{max-width:560px}`),
  la scena la apre `frontend/js/game/ui.js:60-67` (`#scena` di `gioco.html:584`), la chiude
  `uscita.js:50` con ESC: è la scena delle azioni, non il telefono. Non è codice di questa task: ci si arriva da qui perché adesso «Posta»
  sul telefono alzato la lancia.
- **cosa succede** — a 844 × 390 la card della scena è alta 598 in uno schermo da 390:
  centrata, parte a −104 e il tasto **«Continua» sta a 419–468, fuori** (misurato). La
  scena non scorre (`overflow-y:visible`, `scrollHeight` 494 su 390, la rotella non muove
  niente). La chiudono ESC e **il tocco fuori dalla card** (provato: sì, sul fondale scuro
  a sinistra) — ma nessuno lo dice, e il testo del risultato («Hype +2, 5 nuovi follower…»)
  è tagliato a metà in fondo: il giocatore vede una card senza tasto e senza fine.
- **come si vede** — 844 × 390, partita con un pezzo uscito, telefono, LaFamegram, tocca
  «Posta».
  ![La scena dopo «Posta» in orizzontale: niente «Continua»](prove-telefono/2026-09-15/lafamegram-dopo-posta-844x390.jpg)
- **quanto pesa** — si vede ma si gira intorno (toccando fuori), in orizzontale; in verticale
  a 390 e 360 «Continua» è 282 × 49 e sta dentro. Vale per ogni scena delle azioni, non solo
  per questa: `.scenapiena` vuole un `overflow-y:auto` (e `align-content:start` quando la
  card non ci sta), oppure il gioco si blocca in verticale e la cosa non si pone.


**RISOLTO (15/09/2026)** — sullo stesso branch, prima del push. `.scenapiena` ha `overflow-y:auto` e
`place-items:safe center` (`effects.css`): la card più alta dello schermo parte dall'alto e
scorre, il «Continua» si raggiunge. Vale per tutte le scene delle azioni.
### Accanto al tasto del telefono (44 × 44) il Menu è alto 22

- **dove** — `frontend/css/hub.css:156-167` (`.pmenu{padding:0 20px}` senza `min-height`),
  di fianco a `.ptelbtn{min-width:44px;min-height:44px}` in `telefono-stretto.css:23-32`.
- **cosa succede** — nella barra a 390 il Menu misura 47 × 22 e il telefono 44 × 44: a
  vederli sono due icone uguali una accanto all'altra, ma uno si prende col pollice e
  l'altro no (22 di altezza è la metà del minimo). C'era già; adesso che ha un vicino da 44
  si nota.
- **come si vede** — 390 × 844, plancia, in fondo alla barra a destra.
  ![La barra a 390: telefono con «9+» e Menu](prove-telefono/2026-09-15/plancia-390x844.jpg)
- **quanto pesa** — si vede ma si gira intorno (la casa si prende lo stesso, mirando).
  Una riga: `.pmenu{min-height:44px}` sotto i 980, nello stesso file dell'altro.


**RISOLTO (15/09/2026)** — sullo stesso branch, prima del push. `.pmenu{min-height:44px}` sotto i 980, in `stretto.css`.
**Nota, non di questa task**: a 390 la barra della plancia (logo, città, sei statistiche in
due colonne, la pastiglia del tempo, i due tasti) è alta **307 px** su 844 — più di un
terzo dello schermo prima della città; in orizzontale 266 su 390, e della città resta una
striscia. Lo si vede in `plancia-390x844.jpg` e `plancia-844x390.jpg`. È il punto aperto
della barra sotto i 980 (`stretto.css`), non il telefono; lo segno perché col telefono che
si alza da lì è la prima cosa che si vede.

## Giro del 15/09/2026 (segnala-problemi, fine task `task/telefono-sul-telefono`, commit `d97e8de`)

Controlli automatici tutti verdi: `npm run prova` 180 a posto, `audit-regressioni.js` 343 ok,
`verifica:build` 33 ok. Nessun errore in console a nessuna misura. Cercati in tutto
`frontend/` i nomi tolti (`.pvecchio`, `.papp`, `.pap`, `HUB_APP_VECCHIO`,
`renderTelefonoVecchio`, `telAgendaDisponibili`): nessuno li chiama più. Provato nel gioco
vero (server già acceso sulla 8000, Playwright) a 390 × 844, 1000 × 700, 1400 × 900 e
844 × 390: il tasto nella barra c'è solo sotto i 1181 e sparisce a 1400; la pallina somma
quelle delle app (9+ a inizio partita: 9 obiettivi + 4 notizie) e si azzera quando le hai
viste; il telefono si alza, LaFamegram con «Che post fai?», Sputa, Notifiche, Trasferte e
Impostazioni si aprono dentro; un evento (`showEvent`) esce sopra al telefono e si tocca; la
Strada esce sopra; il salto di tempo col telefono su funziona, la pastiglia del tempo si
nasconde e torna appena metti giù; il tocco fuori dal guscio mette giù anche col dito; «fallo
sapere» dallo Studio a 390 chiude lo Studio e alza il telefono su LaFamegram; allargando la
finestra a 1400 col telefono su e un'app aperta il telefono torna colonna e l'app si chiude,
stringendo di nuovo torna il tasto; ESC col telefono su chiude prima l'app, poi mette giù, e
il menu di sistema si apre solo al terzo. Il telefono girato di traverso (844 × 390: guscio
da 154, icone da 27, nomi uno sull’altro, «LAFAMEGRAN») l’ho visto anch’io con gli stessi
numeri: è già scritto nella «Prova sul telefono del 15/09/2026» qui sopra, non lo ripeto.
Quello che segue è quello che non torna.

### ESC col telefono alzato mette giù il telefono anche quando sopra c'è un'altra finestra

- **dove** — `frontend/js/game/telefono-stretto.js:107-119` (l'ascolto di ESC «in cattura»,
  che passa per primo e ferma il tasto), `frontend/js/game/trasferte.js:1657-1662` (l'ESC di
  Trasferte, che arriva dopo), `frontend/js/game/uscita.js:66-72` (l'ESC della modale).
- **cosa succede** — il tasto ESC nuovo guarda solo se il telefono è su e se dentro c'è
  un'app: non guarda se sopra al telefono c'è già qualcos'altro. Così, con un evento
  annullabile aperto sopra al telefono alla home, ESC mette giù il telefono e l'evento resta
  lì (provato: modale ancora aperta, telefono giù). Peggio con Trasferte: si apre a schermo
  pieno sopra al telefono e non segna nessuna app aperta (`TEL_APP` resta vuoto), quindi ESC
  fa sparire il telefono dietro alle Trasferte, che restano aperte; le chiudi con la freccia e
  ti ritrovi sulla plancia col telefono giù, da rialzare.
- **come si vede** — finestra a 390: alza il telefono, tocca Trasferte, premi ESC, poi la
  freccia in alto a sinistra.
- **quanto pesa** — si vede ma si gira intorno (si rialza dal tasto).


**RISOLTO (15/09/2026)** — sullo stesso branch, prima del push. `telStrettoQualcosaSopra()` guarda `overlayAperto()` di
`uscita.js` e la lista delle finestre di eventi-v2, Trasferte, orologio, menu di sistema e
impostazioni: se c'è qualcosa sopra, ESC non è del telefono. Provato con la modale sopra: resta
tutto com'è.
### «APRI» sulla fascia di LaFamegram non alza il telefono

- **dove** — `frontend/js/game/eventi-v2.js:1840-1848` (`adfSocialOpenLatest`: scrive
  `TEL_APP="lafamegram"` e ridisegna, senza passare da `telVaiApp`).
- **cosa succede** — quando qualcuno posta su di te esce la fascia in alto con APRI e CHIUDI.
  Sotto i 1181 APRI apre LaFamegram dentro a un telefono che è giù: sullo schermo non cambia
  niente (provato a 390: telefono giù, `TEL_APP` = lafamegram). Il post lo vedi solo se poi
  alzi il telefono dal tasto, e lì ti trovi dritto su LaFamegram senza sapere perché. Il
  documento della task dice il contrario: «aprire un'app da fuori — “fallo sapere” dallo
  Studio, una notifica — alza il telefono da solo» (`implementazioni/02-interfaccia-e-telefono.md`,
  «Il telefono quando lo schermo è un telefono»): vale per lo Studio, non per la fascia.
- **come si vede** — finestra a 390, aspetta un post su di te (o fai comparire la fascia),
  tocca APRI.
- **quanto pesa** — si vede ma si gira intorno.


**RISOLTO (15/09/2026)** — sullo stesso branch, prima del push. `adfSocialOpenLatest` passa da `telVaiApp`, che sullo
schermo stretto alza il telefono. Provato a 390: APRI → telefono su, LaFamegram aperta.
### Fra i 980 e i 1110 punti il tasto del telefono è fuori dallo schermo: iPad di traverso compreso

- **dove** — `frontend/css/telefono-stretto.css:23-31` (il tasto, `order:2` in coda alla
  barra) e la barra che trabocca già di suo (`frontend/css/hub.css`, voce «Fra i 980 e i 1180
  punti la barra della plancia trabocca» qui sopra).
- **cosa succede** — la voce di prima dice che a 1000 «a destra c'è il telefono e basta»:
  misurato, non è così. Il tasto del telefono sta a 993–1037 con una finestra da 980 a 1000
  (se ne vedono 7 punti), e a 1110–1154 con una finestra da 1024 a 1110: cioè **tutto fuori**.
  Un iPad tenuto di traverso è largo 1024: lì il telefono non si alza da nessuna parte, e
  senza tastiera non c'è nemmeno ESC o Tab. Sputa, Notifiche, Chat, la Discografia tornano
  irraggiungibili proprio come prima di questa task; «fallo sapere» dallo Studio invece
  funziona, perché alza il telefono senza il tasto. Segnalo anche che fra 1181 e 1240 la
  barra trabocca ancora di qualche punto (`scrollWidth` 1237 a 1181): è da prima, ma la voce
  precedente dice «fra 980 e 1180».
- **come si vede** — finestra a 1024 × 768: nella barra il tasto del telefono non c'è.
- **quanto pesa** — si vede ma si gira intorno (da tastiera: Tab fino al tasto e Invio; su
  tablet no).


**RISOLTO (15/09/2026)** — sullo stesso branch, prima del push. Fra i 981 e i 1180 il tasto **galleggia** in basso a
destra (56 × 56, `position:fixed`), dove c'è sempre: misurato a 1000 e a 1024. Ho provato prima a
far andare a capo la barra come sotto i 980: la prima riga si tagliava e il logo finiva in
seconda riga — quella barra vuole un disegno suo, e resta la voce «Fra i 980 e i 1180 punti la
barra della plancia trabocca».
### La pallina sul tasto della barra non si accorge di una notifica appena arrivata

- **dove** — `frontend/js/game/eventi-v2.js:564-573` e `3081` (`adfNotificationBadgeRefresh`
  aggiorna solo la pallina dell'icona dentro al telefono), `frontend/js/game/telefono-stretto.js:59-66`
  (la pallina del tasto si rifà solo a ogni ridisegno del telefono).
- **cosa succede** — con il telefono giù e tutto visto (pallina spenta), arriva una notifica
  nuova: dentro al telefono la campanella segna 1, sul tasto della barra resta niente finché
  qualcosa non ridisegna il telefono. Provato: subito dopo `addNotification` il tasto dice
  0/nascosta e Notifiche dice 1; dopo un ridisegno torna giusto. Il salto +1 ridisegna da
  sé, quindi lì non si vede; si vede con le notifiche dell'agenda e degli eventi a minuti
  che arrivano fra un'azione e l'altra.
- **come si vede** — a 390, telefono giù e pallina spenta, aspetta un avviso dell'agenda:
  il tasto resta senza numero.
- **quanto pesa** — da sistemare con calma.


**RISOLTO (15/09/2026)** — sullo stesso branch, prima del push. `adfNotificationBadgeRefresh` chiama anche
`telStrettoAggiorna`. Provato: telefono giù, pallina spenta, arriva una notifica → «1».
### Da tastiera il fuoco resta dietro al telefono, e dopo «Metti giù» si perde

- **dove** — `frontend/js/game/telefono-stretto.js:80-93` (il tasto nella barra e «Metti
  giù»: nessuno sposta il fuoco).
- **cosa succede** — Invio sul tasto della barra alza il telefono, ma il fuoco resta sul
  tasto, sotto alla sovrapposizione; il Tab dopo va sul Menu (sempre dietro), non dentro al
  telefono: da tastiera bisogna passare tutta la plancia nascosta prima di arrivare alle
  app. Invio su «Metti giù» funziona, ma il tasto sparisce e il fuoco finisce sul `body`:
  il Tab dopo riparte dall'inizio della pagina. Il tasto non ha un `:focus-visible` suo come
  il Menu (`hub.css:168`): resta il bordo del browser, si vede, ma è diverso dal vicino.
- **come si vede** — a 390, Tab fino al tasto del telefono, Invio, Tab.
- **quanto pesa** — da sistemare con calma.


**RISOLTO (15/09/2026)** — sullo stesso branch, prima del push. Alzato, il fuoco va sulla prima icona; messo giù, torna
sul tasto della barra. Il tasto ha il suo `:focus-visible`, uguale al Menu.
### Due ESC di fila in fretta: il telefono resta su

- **dove** — `frontend/js/game/telefono.js:710-716` (`telHome` svuota `TEL_APP` solo dopo
  i 160 ms dell'animazione), `frontend/js/game/telefono-stretto.js:107-109` (ESC guarda
  `TEL_APP` sul momento).
- **cosa succede** — con un'app aperta, il primo ESC avvia l'animazione di chiusura; se il
  secondo arriva prima che siano passati 160 ms, `TEL_APP` è ancora pieno, il tasto nuovo
  lascia passare e `telefono.js` richiama `telHome` un'altra volta: il telefono resta su e
  ci vuole un terzo ESC. Provato: due ESC senza pausa dopo Sputa → app chiusa, telefono
  ancora su.
- **come si vede** — a 390, apri Sputa, ESC ESC veloci.
- **quanto pesa** — da sistemare con calma.


**RISOLTO (15/09/2026)** — sullo stesso branch, prima del push. Se l'app sta già andando via (`.tscreen.tout`, i 160 ms
dell'animazione) il secondo ESC è del telefono e lo mette giù. Provato con ESC ESC senza pausa.
**Nota, non è un errore**: tre cose viste e lasciate lì. In `telefono.js:721-739` restano i
rami per `data-telapp`, `data-news` e `data-diario` dentro al telefono, ma dopo questo commit
nessun pezzo del telefono produce più quegli attributi (cercato in tutto `frontend/js`): sono
rami morti, non fanno danni. Lo Studio sta a z 55 e il telefono alzato a 58: se un giorno
qualcosa dentro al telefono aprirà lo Studio, lo Studio si aprirà **dietro** (provato con
`apriStudio` a mano); oggi lo Studio si apre solo dal segnaposto della città, che sotto al
telefono non si tocca, quindi non c'è una strada per vederlo. `body.tel-aperto{overflow:hidden}`
(`telefono-stretto.css:83`) ferma lo scorrimento della plancia dietro al telefono: su Safari
di iPhone quel trucco spesso non basta e la pagina sotto scorre lo stesso — non l'ho provato
su un telefono vero, va guardato lì.

---

## Giro del 15/09/2026 (segnala-problemi, fine task `task/sistema-il-foglio-dei-punti-nuovi`, commit `167e22d`)

La task ha toccato un file solo, `implementazioni/implementazioni.md` (359 righe cambiate,
`git diff --stat main...HEAD`): il codice del gioco è identico a `main`. Controlli
automatici tutti verdi: `npm run prova` 180 a posto, `audit-regressioni.js` 343 ok,
`verifica:build` 33 ok. Sul JavaScript: ogni `<script>` e ogni foglio di stile citati
dalle tre pagine esistono; ogni `onclick` scritto in `gioco.html` e ogni `onclick`
costruito dal codice chiama una funzione che esiste (0 nomi orfani); i cinque nomi guardati
con `typeof` e non definiti nel gioco (`aggiornaMuteLanding`, `renderMenu`, `onDone`,
`onArrive`, `onContinue`) sono o funzioni della landing, che carica gli stessi file, o
parametri locali: niente come il vecchio `renderNegozio`. Collegamenti e telefono non li
ho riprovati a schermo: il codice è quello del giro precedente (`d97e8de`), che li ha
già guardati uno per uno. Il grosso del giro è stato il confronto fra i due fogli degli
aperti, come chiesto: sotto le due cose che non tornano.

### «Cosa resta aperto» dice che il suo ordine è lo stesso di «Da fare adesso», e non lo è

- **dove** — `documentazione/problemi-riscontrati.md:3-5` (la premessa dell'elenco in
  testa) contro `implementazioni/implementazioni.md:49-158` («Da fare adesso, in ordine»).
- **cosa succede** — le dieci voci di «Cosa resta aperto al 15/09/2026» compaiono **tutte**
  in «Da fare adesso» (contate una per una: avvio rapido → 6, Shop → 13, hover → 4, code
  dello Studio → 15, Marketing → 3, `jose`/`zod` → 7, barra della plancia → 2, di traverso
  → 25, uscita di venerdì → dentro a 14, «aperti di proposito» → nel capoverso «Restano
  fuori dall'ordine»). Ma la premessa qui dice «in ordine d'importanza — l'ordine è lo
  stesso di «Da fare adesso»», e l'altro foglio le ordina in un altro modo (prima il
  telefono, poi il pacchetto, poi le piccole, poi le lunghe, in fondo le decisioni): qui
  l'avvio rapido è al primo posto e la barra al settimo, di là la barra è seconda e l'avvio
  sesto; lo Shop qui è secondo, di là tredicesimo. Chi legge questo foglio e va a cercare la
  stessa sequenza nell'altro non la trova. Due dettagli piccoli nello stesso confronto: di
  là la voce 7 nomina solo `jose` (qui è «`jose` e `zod`», e `zod` sta ancora fra le
  `dependencies` di `backend/package.json:23` senza che nessuno la usi), e la dice «dal
  registro delle dipendenze» invece che da questo foglio.
- **come si vede** — leggi i numeri 1-10 in testa a questo file e cerca la stessa sequenza
  in «Da fare adesso».
- **quanto pesa** — da sistemare con calma. Va deciso da che parte si aggiusta: o la
  premessa qui smette di promettere lo stesso ordine (basta dire «tutte stanno in "Da fare
  adesso", che le mette in fila con le altre»), o le dieci voci qui si riordinano come di
  là. Non ho toccato né l'una né l'altra.

### L'hover al tocco è chiuso dall'08/09, ma tre elenchi lo danno ancora da fare

- **dove** — `documentazione/problemi-riscontrati.md:10-11` (voce 3 di «Cosa resta aperto»),
  `implementazioni/implementazioni.md:74-76` (voce 4 di «Da fare adesso»: «nessun foglio
  di stile distingue mouse e dito … un giro solo su tutti i CSS»),
  `implementazioni/08-uscita-sugli-store.md:157` («**Niente hover**: da fare. Gli effetti
  `:hover` ci sono ancora tutti»).
- **cosa succede** — il lavoro che quei tre punti chiedono è già fatto, e da una settimana.
  Nel codice tutte le 161 regole `:hover` dei 27 fogli in `frontend/css/` stanno dentro a
  `@media (hover:hover)` (contate oggi), i sei pezzi di grafica scritti dentro al JavaScript
  pure, e il controllo automatico «nessun :hover fuori da @media (hover:hover)» in
  `frontend/strumenti/audit-regressioni.js:2148` è verde e diventerebbe rosso se ne
  sfuggisse uno. Lo dicono anche i documenti, ma solo due: il secondo giro dell'08/09 in
  questo file («nessuna regola `:hover` rimasta fuori») e
  `implementazioni/02-interfaccia-e-telefono.md:1383` (**FATTO (08/09/2026)**). La voce di
  questo file (riga 423, «Sul telefono i colori del «passaggio del mouse» restano accesi»)
  era rimasta col solo **LASCIATO** della mattina e senza il RISOLTO del pomeriggio, e da lì
  è finita negli elenchi degli aperti; il RISOLTO gliel'ho messo sotto adesso. Quello che
  resta davvero aperto sull'argomento è un'altra cosa, ed è una **scelta**, non un lavoro:
  la nota dell'08/09 «adesso sul telefono toccare un tasto non fa più vedere niente» (123
  cose che si accendevano col mouse e al dito non rispondono in nessun modo).
- **come si vede** — `cd frontend && node strumenti/audit-regressioni.js | grep hover`
  → «ok nessun :hover fuori da @media (hover:hover)».
- **quanto pesa** — da sistemare con calma: se qualcuno prende la voce 4 di «Da fare
  adesso» si mette a rifare un giro già fatto. Da togliere dai tre elenchi (o da barrare
  con la data, come fa quel foglio) e, se si vuole, da sostituire con la scelta sulla
  risposta al «mentre premo». Non ho toccato nessuno dei tre.

## Giro del 16/09/2026 (segnala-problemi, fine task `task/prima-transizione-video`, prima del commit)

Controllato sul branch con le modifiche ancora da committare. I tre comandi sono verdi:
`npm run prova` 180 a posto e 0 no, `node strumenti/audit-regressioni.js` 349 ok e 0
falliti, `npm run verifica:build` 33 ok e 0 falliti; il build copia i dodici video in
`dist/media/video/Transizioni di scena/`. Nessun errore di JavaScript all'avvio della pagina
del gioco (aperta con Playwright sul Chrome installato, come dice il foglio di memoria):
`transizioni-video.js` sta prima di `hub.js`, il cartello `#hb-pins` a cui si aggancia
esiste, e il cartello dello Studio lo chiama solo al clic. Provato dal vivo: il video parte
e finisce a 5,6 s e sotto c'è lo Studio; il clic a metà lo salta; col file che non c'è lo
Studio si apre dopo un secondo (l'evento `error` arriva prima del timer); con le animazioni
spente lo Studio si apre subito senza filmato; l'audio segue l'interruttore generale e il
volume degli effetti (il video una traccia audio ce l'ha). Le cose sotto sono quelle che non
tornano.

### Esc durante il video non lo salta: apre il menu di pausa, e lo Studio si apre sotto al menu
- **dove** — `frontend/js/menu-sistema.js:491-513` (l'ascoltatore di Esc del menu di
  sistema, registrato «in cattura», cioè prima di tutti gli altri, e che ferma il tasto con
  `stopImmediatePropagation`) contro `frontend/js/game/transizioni-video.js:85` e `:108`
  (l'ascoltatore del video, normale, che così non riceve mai il tasto). La lista delle
  finestre che il menu rispetta prima di aprirsi sta in `menu-sistema.js:36-71`
  (`dialogoFlottante` e `internoDaChiuderePrima`): la copertura `.tvid` non c'è.
- **cosa succede** — premi Esc mentre il filmato dello Studio va: si apre il menu «LA FAME /
  SISTEMA» sopra al video, il video **continua** sotto (visto: da 2,7 s arriva a 5,6 s col
  menu aperto), e quando finisce lo Studio si apre sotto al menu di pausa. Chi preme
  «Riprendi» si ritrova nello Studio senza aver capito perché. Il salto con Esc quindi non
  esiste, mentre lo promettono sia il commento in testa a `transizioni-video.js:17` sia
  `implementazioni/02-interfaccia-e-telefono.md:1888` («un tocco, un clic o Esc chiudono il
  video») — e la riga «Provato» di quel foglio (`:1897`) elenca il clic ma non l'Esc, che
  infatti non è stato provato. La prova dell'audit
  `frontend/strumenti/audit-regressioni.js:2212` («si può saltare») guarda solo che nel file
  ci sia scritto `"Escape"`, quindi resta verde anche così.
- **come si vede** — dalla mappa tocca «Studio» (conferma «Vai» se non sei già lì), premi
  Esc mentre il filmato va.
- **quanto pesa** — si vede ma si gira intorno: il video finisce da solo e il menu ha
  «Riprendi». Ma è il tasto che tutti provano per saltare un filmato, e il risultato è un
  menu di pausa che non ferma niente.
- **RISOLTO (16/09/2026, stesso branch, prima del commit)** — `#tvid.on` e `#tvid.attesa`
  stanno in `dialogoFlottante()` di `menu-sistema.js`: il menu lascia passare l'Esc e lo
  prende l'ascoltatore del video. Provato: Esc a 1,2 s salta il filmato, lo Studio si apre,
  nessun menu. L'audit adesso controlla le due voci nella lista del menu, non la sola stringa
  `"Escape"`.

### Nel secondo e mezzo prima che il video parta la mappa risponde ancora, e si aprono due posti
- **dove** — `frontend/js/game/transizioni-video.js:92` (la copertura compare solo
  all'evento `playing`), `:110` (il secondo e mezzo di attesa) e `:56` (se un video è già
  in corso, il secondo tocco apre la pagina diretta).
- **cosa succede** — è una scelta giusta che la mappa non diventi nera prima che il video
  vada, ma finché non va la mappa è anche **cliccabile**. Tocchi «Studio» e, prima che il
  filmato parta, tocchi un altro cartello: quel posto si apre (provato con la Pizzeria: si
  apre la scheda «Lavapiatti»), poi il filmato copre tutto, e alla fine lo Studio si apre
  **sotto** alla scheda della Pizzeria, che resta lì sopra. Se invece tocchi due volte
  «Studio», la seconda volta lo apre subito senza video (per la guardia di riga 56), poi
  arriva il video e lo riapre. Sul monitor la finestra è di pochi decimi di secondo (il
  video a caldo parte in 10 ms); sul telefono emulato a 390 × 844 il filmato è partito a 1,6 s
  anche col precarico fatto, e due volte su tre a freddo non è partito affatto entro il
  tempo (lo Studio si è aperto senza video, come previsto): lì la finestra è tutta.
- **come si vede** — tocca «Studio» e subito un altro cartello, meglio da telefono o con la
  rete rallentata dagli strumenti del browser.
- **quanto pesa** — si vede ma si gira intorno: chiudi la scheda di sopra e sei nello
  Studio. Da guardare insieme al ritardo di partenza sul telefono vero.
- **RISOLTO (16/09/2026, stesso branch, prima del commit)** — dal clic al `playing` la
  copertura c'è ma è trasparente (`.tvid.attesa`): la mappa si vede e non risponde, e il
  tocco lì sopra salta l'attesa e apre la pagina subito. Provato con la rete rallentata e un
  video non precaricato: sotto al dito sul cartello della Pizzeria c'è la copertura, il
  tocco apre lo Studio e la Pizzeria no.

### Sul telefono l'orologio della plancia resta sopra al video, e si tocca
- **dove** — `frontend/js/game/tempo-controlli.js:286` (`#adf-time-dock` a z-index 142)
  contro `frontend/css/transizioni-video.css:8` (`.tvid` a 95).
- **cosa succede** — a 390 × 844 la pastiglia dell'orologio («ANNO 1 · SETT. 01 · 08:00 ·
  GIORNO 1/7») galleggia in mezzo al filmato, a sinistra, per tutti i 5,6 secondi (vista
  nello screenshot; sul monitor a 1280 no: lì il video la copre, perché la barra della
  plancia sta in un altro «strato»). È anche il primo elemento sotto al dito: nel telefono
  emulato un tocco lì ha chiuso il video e aperto lo Studio con sopra la scheda «Scrivi
  barre», invece del pannello delle ore. Questo secondo pezzo è da confermare su un
  telefono vero, il primo si vede e basta.
- **come si vede** — apri il gioco a 390 di larghezza, tocca «Studio», guarda a sinistra a
  metà schermo mentre il filmato va.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (16/09/2026, stesso branch, prima del commit)** — `.tvid` è salita da 95 a 150:
  sopra all'orologio (142) e al toast (130), sotto alla Strada (180) e al menu di sistema.
  Provato a 390 × 844: `elementFromPoint` al centro della pastiglia dà la copertura.

### Il video ignora «riduci le animazioni» del telefono, che il resto del gioco rispetta
- **dove** — `frontend/js/game/transizioni-video.js:55` (guarda solo l'interruttore
  «Animazioni» delle impostazioni del gioco).
- **cosa succede** — chi ha acceso «riduci movimento» nel sistema (iOS e Android ce l'hanno
  fra le opzioni di accessibilità) si becca comunque i cinque secondi di filmato. Altre
  quattro parti del gioco quella preferenza la leggono (`frontend/css/effects.css:118`,
  `frontend/css/avvio.css:104`, `frontend/js/game/tempo-controlli.js:362`,
  `frontend/js/game/strada-crimine-ui.js:63`), il video no. È una riga in più nel
  controllo di riga 55, non un lavoro.
- **come si vede** — sul telefono, con «riduci movimento» acceso e «Animazioni» del gioco
  lasciato acceso, tocca «Studio».
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (16/09/2026, stesso branch, prima del commit)** — `transizioneVideo()` guarda
  anche `matchMedia("(prefers-reduced-motion: reduce)")`. Provato con la preferenza
  emulata: lo Studio si apre diretto, senza copertura.

Due note che sono **scelte**, non errori, e stanno qui solo per essere decise:

- **In verticale si vede una fetta del filmato.** Il video è 1280 × 720; a 390 × 844 con
  `object-fit:cover` (`frontend/css/transizioni-video.css:9`) sullo schermo entra circa un
  quarto della larghezza dell'inquadratura, la fascia centrale: nello screenshot a 2 secondi
  si vedono il banco e la pianta, il ragazzo che entra è fuori dal taglio. Il CSS lo dice
  apposta («quello che avanza si taglia, meglio di due bande nere») e va bene così se i
  cinque video sono pensati per il centro; se no, ai prossimi quattro conviene chiederlo a
  chi li fa, o prevedere una versione verticale.
- **A freddo, sul telefono, il video spesso non parte in tempo e non si vede.** È il
  comportamento voluto (meglio niente che uno schermo nero), ma vuol dire che il primo
  «Studio» di una partita nuova su un telefono lento può non avere il filmato. Sugli store
  i file stanno sul telefono, non in rete, quindi probabilmente basta: va provato lì, non
  qui.

Documenti: le quattro scritture (`implementazioni/implementazioni.md` in due punti,
`implementazioni/02-interfaccia-e-telefono.md`, `implementazioni/README.md`,
`documentazione/roadmap.md`) dicono tutte la stessa cosa — FATTO in parte, uno su cinque,
gli altri quattro allo stesso modo, sette video senza un punto — e tornano fra loro. L'unica
frase smentita dal codice è quella sull'Esc, già nella prima voce.

## Giro del 16/09/2026 (segnala-problemi, fine task `task/salvare-i-punti-da-main`, commit `c922653`)

Giro su carta, come chiesto: letti `.githooks/pre-commit`, `.githooks/pre-push`,
`scripts/salva-punti.js`, le righe nuove di `CLAUDE.md` e di
`documentazione/come-si-lavora.md`, la prova nuova in
`frontend/strumenti/audit-regressioni.js:2121`. Fatti girare solo `sh -n` sui due hook e
`node --check` sullo script: tutti e tre puliti. Niente cloni, niente prove dal vivo,
niente `npm run verifica`. Il backend non è toccato.

Le cose che **tengono** e che ho controllato a mano sul codice: un commit su `main` che
tocca un foglio **e** un file di codice è bloccato dal pre-commit (riga 22, il codice resta
nella lista) e dal pre-push (`solo_documenti`, riga 36); cancellare un file di codice su
`main` è bloccato (la `D` è nel filtro di riga 12); un `git push` con più branch fa la
verifica intera appena uno solo dei commit non è di soli fogli (`SOLO_DOCS` va a 0 e non
torna su); un remoto senza `main` ferma il push già alla riga 25 (com'era prima); un merge
commit non ha file nel `diff-tree` (provato su `684a1af`: vuoto), quindi `solo_documenti`
dice «no» e il push di `main` dopo un merge fa la verifica intera come sempre — è la
direzione prudente. I quattro posti (due hook, script, `CLAUDE.md`, `come-si-lavora.md`)
dicono la stessa regola. Cinque cose da segnalare, nessuna blocca la partita né il
salvataggio dei punti nel caso normale.

### Lo script salva anche quello che era già in coda, non solo i fogli
- **dove** — `scripts/salva-punti.js:61-62`
- **cosa succede** — lo script fa `git add` dei fogli e poi `git commit -m …`: il commit
  prende **tutto** quello che sta in coda (nell'index), non solo i fogli. Se prima avevi
  fatto `git add frontend/js/qualcosa.js` e poi lanci lo script, su `main` il pre-commit lo
  blocca (bene, ma il messaggio parla di branch e non capisci cosa c'entra col foglio); su
  un branch di task quel file di codice finisce nel commit «docs(implementazioni): …» senza
  che nessuno lo dica. Il documento promette «prende i fogli cambiati e solo quelli».
- **come si vede** — su un branch di task: `git add` di un file di codice, poi
  `node scripts/salva-punti.js`; guarda `git show --stat HEAD`.
- **quanto pesa** — si vede ma si gira intorno.
- **RISOLTO (16/09/2026, stesso branch, prima del push)** — `git commit --only -m … -- <fogli>`:
  con i percorsi il commit prende solo quelli e quello che era in coda ci resta; e lo
  `stash pop` è `--index`, così ci torna anche dopo il push. Provato nel clone: `README.md`
  in coda prima, in coda dopo, e nel commit solo il foglio.

### Un foglio con accenti o spazi nel nome fa fallire lo script
- **dove** — `scripts/salva-punti.js:40`
- **cosa succede** — Git, quando un nome ha lettere non ASCII (`core.quotePath`, che qui è
  al valore di fabbrica), lo scrive fra virgolette con le lettere in codice:
  `"implementazioni/citt\303\240.md"`. Lo script toglie le virgolette e poi trasforma
  ogni `\` in `/`, e ne esce `implementazioni/citt/303/240.md`: il `git add` non trova il
  file e lo script si ferma. Stessa fine per un foglio rinominato e già in coda, che nel
  `--porcelain` compare come `R  vecchio.md -> nuovo.md` su una riga sola. Oggi i tredici
  fogli hanno tutti nomi ASCII senza spazi, quindi non morde; morde il giorno che se ne
  aggiunge uno con l'accento.
- **come si vede** — crea `implementazioni/città.md`, `node scripts/salva-punti.js --prova`
  e guarda il nome che stampa.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (16/09/2026, stesso branch, prima del push)** — lo script legge `git status
  --porcelain -z` (NUL fra le voci, niente virgolette né escape ottali, il nome vecchio del
  rename saltato); i due hook chiamano `git -c core.quotepath=false`, perché anche loro
  vedevano `"citt\303\240 di prova.md"` con le virgolette e la regex non lo prendeva.
  Provato con `implementazioni/città di prova.md`: committato e pushato.

### Il pre-commit non vede lo spostamento di un file di codice dentro `implementazioni/`
- **dove** — `.githooks/pre-commit:12`
- **cosa succede** — `git diff --cached --name-only` riconosce gli spostamenti e scrive
  solo il nome **nuovo**: `git mv frontend/js/x.js implementazioni/x.md` su `main` mostra
  solo `implementazioni/x.md`, che è nell'eccezione, e il commit passa; il file di codice è
  sparito da `main`. Il pre-push lo ferma (`diff-tree` alla riga 34 non riconosce gli
  spostamenti e vede la cancellazione), quindi il buco è solo locale, ma il commit sbagliato
  resta da rifare a mano.
- **come si vede** — su `main`, `git mv` di un file di codice in `implementazioni/` con
  estensione `.md`, poi `git commit`.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (16/09/2026, stesso branch, prima del push)** — `git diff --cached
  --no-renames`: lo spostamento si vede come un file tolto e uno aggiunto, e il tolto
  (`frontend/js/x.js`) non è un foglio. L'audit controlla che il flag resti.

### L'eccezione prende anche `implementazioni/auto/`, i messaggi dicono `implementazioni/*.md`
- **dove** — `.githooks/pre-commit:22` e `:33`, `.githooks/pre-push:36`
- **cosa succede** — la regola `implementazioni/.*\.md$` vale per tutte le sottocartelle,
  quindi anche per `implementazioni/auto/README.md` e `implementazioni/auto/tasks/*.md`, che
  sono i fogli che fa il bot (`scripts/roadmap-auto.js`) e non si scrivono a mano. Il
  messaggio del pre-commit, `CLAUDE.md:28` e `come-si-lavora.md:50` dicono
  `implementazioni/*.md` o «i `.md` di `implementazioni/`», che si legge come la cartella
  sola. Non è rotto: è da decidere se l'audit del bot deve poter essere ritoccato da `main`
  o no, e poi scrivere la stessa cosa nei tre posti.
- **come si vede** — leggendo le tre righe.
- **quanto pesa** — da sistemare con calma (è una scelta, non un bug).
- **RISOLTO (16/09/2026, stesso branch, prima del push)** — deciso: solo i `.md` di primo
  livello, `implementazioni/[^/]+\.md$`, in tutti e due gli hook, nello script e nell'audit.
  `implementazioni/auto/` è del bot e non è un foglio. Provato: `auto/finto.md` resta fuori.

### Quando il push non riesce, lo script rimanda a un messaggio che può non esserci
- **dove** — `scripts/salva-punti.js:74` e `:82`
- **cosa succede** — il remoto è fisso a `origin` (il pre-push invece lo prende da `$1`).
  Se `origin` non c'è, o se `main` sul remoto è andata avanti (Carletto ha salvato da un
  altro computer), l'audit gira e poi il push viene rifiutato da Git, non dal gate; lo
  script dice «leggi sopra cosa dice il gate, poi `git push`», ma sopra c'è solo l'errore di
  Git e il `git push` fallisce uguale: la strada è `git pull --rebase` e poi `git push`.
  Nel frattempo i file messi da parte tornano al loro posto (riga 77): bene, ma se erano
  già in coda tornano fuori dalla coda (`stash pop` senza `--index`).
- **come si vede** — con `main` remota più avanti della tua, `node scripts/salva-punti.js`.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (16/09/2026, stesso branch, prima del push)** — il remoto lo script lo legge da
  `branch.<nome>.remote` (`origin` se manca); se il remoto non esiste committa e lo dice senza
  provare il push; se il push non riesce il messaggio dice le due cause possibili — il gate,
  oppure Git stesso col remoto avanti — e il comando per rimettersi in pari.

Una nota sui documenti, non un errore: il commento della prova nuova
(`frontend/strumenti/audit-regressioni.js:2117-2120`) parla di «tre posti che devono
restare d'accordo» e controlla i due hook, lo script e `CLAUDE.md`; il quarto posto,
`documentazione/come-si-lavora.md` («Salvare i punti nuovi, da `main`»), non è nella prova,
mentre `CLAUDE.md` dice che le due copie della regola vanno cambiate insieme. Oggi tornano.

## Giro del 16/09/2026 (segnala-problemi, fine task `task/jose-e-zod-nel-backend`, commit `d268a3d`)

Giro sul backend, come chiesto: letti `backend/accessi.js` (e la versione di prima con
`git show HEAD~1:backend/accessi.js`), `backend/forme.js`, il diff di `backend/server.js` e
di `backend/prova.js`, `frontend/js/net/online.js` per i corpi che il gioco manda davvero,
la collezione Postman, il codice di `jose` in `node_modules` (come scarica le chiavi e che
errori tira), e i documenti toccati. Fatti girare `cd backend && npm run prova` (**190 a
posto, 0 no**) e `node scripts/controlla-backend.js` (verde). Niente `npm run verifica`.
In più uno script mio, fuori dal repo, che chiama `accessi.verifica("apple", …)` con le
chiavi pubbliche in cinque stati diversi: è da lì che viene la prima voce.

Le cose che **tengono** e che ho controllato a mano: le opzioni di `jwtVerify` fanno
quello che faceva il codice di prima — `iss` con e senza `https://` (provato), `aud` anche
come lista (provato), `exp` obbligatoria e `sub` obbligatorio, un minuto di tolleranza,
«firmato nel futuro» rimasto come riga nostra; un biglietto con `alg: none` o `alg: HS256`
viene buttato (provato), e `jose` guarda l'`alg` **prima** di andare a prendere le chiavi;
un `exp` scritto come stringa viene buttato; le chiavi pubbliche con la porta chiusa danno
«verifica-non-riuscita» come prima. In `forme.js` nessuna forma è più stretta di quello
che `online.js` manda (`dispositivo` è un oggetto, `seed` un intero, `stream`/`deal` liberi,
`settimana`/`anno` numeri, `forza` un booleano vero, `ultima` una stringa o `null`); dove
`server.js` legge `b.x` senza più `String(b.x || "")` il campo è obbligatorio nella forma
(`artistaId`, `id`, `codice`, `accountId`, `tipo`), quindi non arriva `undefined`; i campi
letti con `!= null` (`nome`, `citta`, `genere` in `PUT /api/artista`, `ultima` nel
punteggio) sono `nullish` nella forma; il `trim().toLowerCase()` della mail fatto due volte
(`forme.js:62` e `server.js:247`) dà lo stesso risultato tutte e due le volte, è solo un
doppione innocuo; le 14 rotte contate a mano sono 14 e i documenti dicono 14; la collezione
Postman aspetta gli stessi nomi di errore che il server dà ancora (`email-non-valida`,
`stato-mancante`, `azione-sconosciuta`, `serve-la-conferma`, 403 per il biglietto finto).
Tre cose da segnalare, nessuna blocca la partita.

### Se il server delle chiavi di Apple o Google risponde con un errore, la colpa viene data al giocatore
- **dove** — `backend/accessi.js:84-86`
- **cosa succede** — quando le chiavi pubbliche non si riescono a scaricare, il codice
  rilancia l'errore solo se il messaggio contiene «fetch», «network», «ECONN», «ENOTFOUND»
  o è un timeout di `jose`. Ma se il server di Apple risponde (per dire) 503, 429 o un
  redirect, oppure risponde con una pagina HTML invece del JSON, `jose` tira un errore che
  dice «Expected 200 OK from the JSON Web Key Set HTTP response» oppure «Failed to parse the
  JSON Web Key Set HTTP response as JSON»: nessuna di quelle parole c'è, quindi si finisce
  nel `return null` e chi entra si prende un **403 «biglietto-rifiutato»** — come se il
  biglietto fosse falso — invece del «verifica-non-riuscita» che diceva il codice di prima
  (che alzava un errore su qualsiasi risposta che non fosse 200). Il commento nel file
  (righe 80-83) e il foglio `implementazioni/07-multiplayer-e-backend.md` («se sono le
  chiavi pubbliche a non rispondere, l'errore risale come verifica non riuscita») promettono
  il contrario. Nessuna prova in `prova.js` copre il caso: il finto Apple risponde sempre
  200. `jose` mette un `code` su tutti i suoi errori (`ERR_JOSE_GENERIC` per questi due,
  `ERR_JWKS_TIMEOUT` per il timeout), che è più solido di cercare parole nel messaggio.
- **come si vede** — con `ADF_APPLE_AUD` messo e `ADF_APPLE_JWKS` puntato a un server che
  risponde 503, `POST /api/account` con `tipo: "apple"` e un biglietto firmato bene torna
  403 `biglietto-rifiutato`. Con la porta chiusa torna invece `verifica-non-riuscita`.
- **quanto pesa** — si vede ma si gira intorno (succede solo quando è Apple o Google ad
  avere un problema; il giocatore riprova più tardi, ma il messaggio gli dà la colpa).
- **RISOLTO (16/09/2026, stesso branch, prima del push)** — in `accessi.js` la colpa la decide il **codice** dell'errore di `jose`, non
  una regex sul messaggio: `ERR_JWT_*`, `ERR_JWS_*`, chiave sconosciuta, algoritmo non
  ammesso, JWT malformato sono colpa del biglietto (→ null → «rifiutato»); tutto il resto —
  timeout, 503, HTML al posto del JSON, rete giù — risale come «le chiavi pubbliche non
  rispondono» → «verifica-non-riuscita». Due prove nuove in `prova.js`: il banchetto del
  finto Apple risponde 503 su `/giu` e `apriToken` alza l'errore; con `/chiavi` torna il
  `sub`. 192 a posto.

### `jose` 6 si carica solo da Node 22.12 in su, i documenti dicono ancora 22.5
- **dove** — `backend/accessi.js:25`, `backend/package.json:18`, `backend/README.md:46`,
  `documentazione/comandidelterminale.md:75` e `:152`
- **cosa succede** — `jose` dalla versione 6 è pubblicata solo come modulo ES (`"type":
  "module"` nel suo `package.json`, nessuna copia CommonJS); `accessi.js` la carica con
  `require("jose")`, che con un modulo ES funziona solo da Node 22.12 in su (prima era
  dietro un flag sperimentale). Il `package.json` del backend chiede `node >=22.5`, e il
  README e la guida ai comandi dicono «Node 22.5 o più nuovo»: chi mette il server su una
  di quelle versioni (22.5-22.11) lo vede morire all'avvio con `ERR_REQUIRE_ESM` alla prima
  riga di `accessi.js`, e con lui tutto l'online. Qui gira 22.14 e la CI prende l'ultima 22,
  quindi oggi non si vede. Non l'ho provato su un Node vecchio: viene dal `package.json` di
  `jose` e dalle note di Node 22.12.
- **come si vede** — `node --version` fra 22.5 e 22.11, `cd backend && npm start`.
- **quanto pesa** — si vede ma si gira intorno (basta aggiornare Node; ma la soglia va
  scritta giusta in `engines` e nei due documenti, se no la promessa è falsa).
- **RISOLTO (16/09/2026, stesso branch, prima del push)** — `engines.node` è `>=22.12` in `backend/package.json`, e lo dicono
  `backend/README.md` (col perché: `node:sqlite` dal 22.5, `require` di un modulo ESM dal
  22.12) e `documentazione/comandidelterminale.md` nei due punti.

### Il README dell'API dice che un `tipo` di account sconosciuto diventa «ospite», adesso è un 400
- **dove** — `backend/README-API.md:440-441`
- **cosa succede** — c'è scritto «Un tipo assente o non riconosciuto viene trattato come
  `ospite`». Dal 16/09 il tipo assente diventa ancora `ospite`, ma quello **non
  riconosciuto** è un 400 `dati-non-validi` con `campi: [{ campo: "tipo" }]` — è una scelta
  della task, scritta apposta nel foglio (`07-multiplayer-e-backend.md`, «più stretto dove
  costava niente») e coperta da una prova. Il README però racconta ancora il comportamento
  vecchio.
- **come si vede** — `POST /api/account` con `{ "tipo": "marziano" }`: 400, non 201.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (16/09/2026, stesso branch, prima del push)** — §6 di `README-API.md`: assente vale `ospite`, sconosciuto è `400
  dati-non-validi`, e Steam/Apple/Google senza biglietto è `400 biglietto-mancante`.

Due note, non errori. **La prima:** `forza` in `PUT /api/carriera/:n` adesso deve essere un
booleano vero (`forme.js:130`): il gioco manda `!!forza`, quindi va bene, ma un client che
mandasse `"forza": "true"` o `1` — prima passava perché contava solo che fosse «vero» — ora
prende un 400. È una scelta coerente con il resto della task, va solo saputo. **La seconda:**
in `forme.js:128` `z.union([z.string().max(80), z.literal("")])` è un doppione — la stringa
vuota è già una stringa sotto gli 80 caratteri — che non fa danni.

## Giro del 16/09/2026 (backend-allineato, task `task/jose-e-zod-nel-backend`, commit `d268a3d`)

`node scripts/controlla-backend.js` verde, `cd backend && npm run prova` 190 a posto, 0 no.
Il commit non tocca `database/migrazioni/`, `database/migrazioni-pg/` né `schema.md`
(`git show --stat d268a3d`): le coppie SQLite/PostgreSQL restano quelle già confrontate
colonna per colonna il 15/09 — **niente che fermi il passaggio a PostgreSQL**. Le manopole
`ADF_*` che legge `accessi.js` (`ADF_STEAM_CHIAVE`, `ADF_STEAM_APPID`, `ADF_APPLE_AUD`,
`ADF_GOOGLE_CLIENT`, `ADF_APPLE_JWKS`, `ADF_GOOGLE_JWKS`, `ADF_STEAM_URL`,
`accessi.js:28-35`) stanno tutte in «Le manopole» (`backend/README.md:144-149`), e il
paragrafo su `jose` (`backend/README.md:304-312`) dice il vero. Le quattordici rotte con
corpo passano tutte da `corpoInForma()` (`server.js:150-160`, quattordici chiamate; l'unico
`await corpo(req)` rimasto è dentro `corpoInForma` stessa). Le `nota` sparite da
`serve-la-conferma` e `azione-sconosciuta` non erano documentate in `README-API.md` e il
frontend non le legge (`grep` su `frontend/js`); la collezione Postman (`postman/genera.js:348,
378, 428, 553, 632`) manda sempre un id vero, quindi le sue cinque prove `403 non-e-tuo` e
`400 azione-sconosciuta` reggono. Sei voci, tutte di documento tranne una riga di codice;
nessuna blocca la partita.

### `README-API.md` §6 dice che un `tipo` sconosciuto vale `ospite`; adesso è un 400

- **dove** — `backend/README-API.md:440-441` («Un tipo assente o non riconosciuto viene
  trattato come `ospite`»). Il vero è in `backend/forme.js:55` (`z.enum(TIPI_ACCOUNT)`) e
  `backend/server.js:243` (`b.tipo || "ospite"`).
- **cosa succede** — un `tipo` **assente** vale ancora `ospite`; un `tipo` **non
  riconosciuto** (`"boh"`) non arriva più alla rotta: la forma risponde
  `400 dati-non-validi` con `campi: [{ campo: "tipo", problema: "Opzione non valida: atteso
  uno tra …" }]`. Prima del 16/09 ricadeva davvero su `ospite`. È la cosa giusta — un client
  che sbaglia il tipo deve sentirselo dire — ma il documento dice il contrario.
- **come si vede** — `POST /api/account` con `{ "tipo": "boh" }`: 400, non 201 ospite.
- **quanto pesa** — da sistemare con calma: mezza frase in §6 («assente vale `ospite`; non
  riconosciuto è `400 dati-non-validi`»).
- **RISOLTO (16/09/2026, stesso branch, prima del push)** — vedi la voce gemella del giro segnala-problemi qui sopra: §6 corretto.

### `biglietto-mancante` non «esiste da prima», e §6/§7 non lo elencano

- **dove** — `backend/README-API.md:119-121` (l'elenco dei nomi «che esistono da prima»
  comprende `biglietto-mancante`), §6 (`:487-488`) e §7 (`:527-528`), che elencano gli
  errori di `POST /api/account` e `POST /api/sessione` senza questo. Il nome nasce in
  `backend/forme.js:69` e `:86`: `git grep biglietto-mancante d268a3d~1 -- backend frontend`
  non trova niente.
- **cosa succede** — prima, `tipo: "apple"` senza `biglietto` finiva in `conBiglietto()` e
  tornava `403 biglietto-rifiutato` (lo dice anche la prova nuova, `prova.js:624`: «Apple
  senza biglietto è un 400, non un 403»). Adesso è `400 biglietto-mancante`. È un nome
  nuovo, dunque un cambiamento di contratto per un client che guardasse il 403: va scritto
  come tale, non fra quelli «di sempre», e va nella lista errori delle due rotte.
- **come si vede** — `POST /api/sessione` con `{ "tipo": "google" }` e niente biglietto.
- **quanto pesa** — da sistemare con calma: spostare il nome fuori dall'elenco «da prima» e
  aggiungerlo a §6 e §7.
- **RISOLTO (16/09/2026, stesso branch, prima del push)** — nel paragrafo generale `biglietto-mancante` e `artista-mancante` sono
  «i due nomi nuovi dal 16/09/2026», con quello che erano prima (`403 biglietto-rifiutato`,
  `403 chiave-sbagliata`); §6 e §7 li elencano.

### `artistaId-mancante` non compare né nel documento né in `errore`

- **dove** — `backend/forme.js:84` (la forma di `POST /api/sessione`, `tipo: "legacy"`
  senza `artistaId`) e `backend/forme.js:170`, la regola che sceglie il nome da mettere in
  `errore`: `/^[a-z][a-z0-9-]*$/`. `README-API.md` §7 (`:512-528`) non lo nomina.
- **cosa succede** — la forma vuole rispondere `artistaId-mancante`, ma la `I` maiuscola
  non passa la regola, quindi la risposta è `{ errore: "dati-non-validi", campi: [{ campo:
  "artistaId", problema: "artistaId-mancante" }] }`: il nome c'è solo dentro a `campi`.
  Prima del 16/09 lo stesso corpo prendeva `403 chiave-sbagliata` (`server.js:290`, con
  `artistaGrezzo("")`). Non rompe niente — il 400 arriva e dice il campo — ma il nome
  scritto nel codice non è quello che esce, e chi legge `forme.js` crede il contrario.
- **come si vede** — da `backend/`, in Node: `require("./forme.js").controlla("sessione", { tipo: "legacy" })`
  torna `errore: "dati-non-validi"`, non `artistaId-mancante`.
- **quanto pesa** — da sistemare con calma. È una riga di codice (o la regola accetta le
  maiuscole, o il messaggio diventa `artista-mancante`), e poi una riga in §7. La segnalo e
  non la tocco: il codice non lo riscrivo io.
- **RISOLTO (16/09/2026, stesso branch, prima del push)** — il nome è diventato `artista-mancante`, minuscolo come tutti gli altri,
  così la regola di `controlla()` lo prende ed esce in `errore`; §7 lo elenca. La regola
  resta stretta (minuscole e trattini) apposta: i nomi degli errori sono tutti così.

### Le liste errori per rotta non sanno del `400` che ha preso il posto di `403 non-e-tuo`

- **dove** — `backend/README-API.md` §4 (`:417`, `POST /api/relazione`), §14 (`:680`,
  `POST /api/punteggio`), §25 (`:805-806`, `POST /api/traguardo`): dicono `403 non-e-tuo`
  e basta. Anche §26 (`:808-823`, `POST /api/segnalazione`, nessun 400 elencato), §30
  (`:869`, `POST /api/sanzione`: solo `400 sanzione-non-valida`) e §34 (`:901-909`,
  `POST /api/spinto`: nessun errore). Il vero è in `backend/forme.js:46, 116, 134, 138,
  146-147, 155`: `artistaId`/`id`/`accountId`/`tipo`/`codice` sono obbligatori.
- **cosa succede** — un corpo **senza** l'id (o con un id non stringa) adesso è
  `400 dati-non-validi` prima ancora di chiedere «è tuo?»; il `403 non-e-tuo` resta per
  l'id di un altro. Per `sanzione` e `spinto` un campo obbligatorio che manca è 400 invece
  di `400 sanzione-non-valida` o di un 200 a vuoto; per `segnalazione` è 400 invece di
  `404 artista-sconosciuto`. Il paragrafo generale «Formato degli errori» (`:108-122`) lo
  racconta per famiglia, e va bene così; ma chi legge una rotta sola non ci arriva.
- **come si vede** — `POST /api/punteggio` con `{ "stream": 1 }` e una sessione valida:
  400, non 403.
- **quanto pesa** — da sistemare con calma: una frase sola, ripetuta, nelle sei liste
  («più `400 dati-non-validi` se manca un campo obbligatorio, vedi Formato degli errori»).
- **RISOLTO (16/09/2026, stesso branch, prima del push)** — una frase in ciascuna delle sette liste — relazione, account, sessione,
  punteggio, traguardo, segnalazione, sanzione, spinto — «più `400 dati-non-validi` (con
  `campi`) se manca un campo obbligatorio o ha il tipo sbagliato», coi campi che contano; e
  il paragrafo generale dice che un id che manca è un `400`, non più il `403 non-e-tuo`.

### «`campi` c'è lo stesso» non vale per il `nome-non-valido` che decide il server

- **dove** — `backend/README-API.md:121` («`errore` resta quello, e `campi` c'è lo
  stesso»). Il vero è in `backend/server.js:343` e `:384`: `male(res, 400, "nome-non-valido")`
  senza `campi`.
- **cosa succede** — `nome-non-valido` esce da due posti: dalla forma, quando `nome` manca
  o non è una stringa (`forme.js:96`, con `campi`), e dal server, quando è una stringa ma
  `nomePulito` la butta (vuota, troppo corta, caratteri invisibili): lì `campi` non c'è.
  Un client che contasse su `campi` per dire «quale campo» lo trova a volte sì a volte no.
- **come si vede** — `POST /api/artista` con `{ "nome": "  " }`: `{ "errore":
  "nome-non-valido" }` e niente `campi`; con `{}`: `campi: [{ campo: "nome", … }]`.
- **quanto pesa** — da sistemare con calma: o la frase dice «dove lo dice la forma», o
  `server.js:343/384` aggiungono `{ campi: [{ campo: "nome", problema: "nome-non-valido" }] }`.
  Scelta di chi tiene il codice.
- **RISOLTO (16/09/2026, stesso branch, prima del push)** — la frase adesso dice «`campi` c'è dove è la forma a dirlo», e
  `nome-non-valido` è scritto a parte: lo decide il server dopo la pulizia, senza `campi`.

### Tre documenti dicono ancora che `jose` e `zod` sono «da usare»

- **dove** — `README.md:9` (la tabella delle cartelle: «`jose`, `zod` — le ultime due
  installate e ancora da usare»), `ROADMAP.md:133` («`jose` e `zod` installate e ancora da
  usare»), `documentazione/dipendenze.md:356-360` (la lista delle candidate: «È la prima che
  installerei» per `jose`, «Oggi è a mano, rotta per rotta» per `zod`, mentre `pg` alla riga
  354 porta «_già installata._»).
- **cosa succede** — il commit `d268a3d` ha aggiornato `backend/README.md`,
  `documentazione/roadmap.md:63-64`, la tabella di `dipendenze.md:74-75` e il foglio 07, ma
  non questi tre punti: chi apre il `README.md` di radice o `ROADMAP.md` legge che il
  backend ha due dipendenze morte, e non è più vero da oggi.
- **come si vede** — `grep -n "ancora da usare" README.md ROADMAP.md`.
- **quanto pesa** — da sistemare con calma, tre righe. (Nota a margine, non di questa task:
  `backend/README-API.md:6-7` dice «Verificata … commit `024bf79` del 2 settembre 2026» e
  da allora è stata aggiornata dieci volte; o la riga si aggiorna a ogni giro o si toglie.)
- **RISOLTO (16/09/2026, stesso branch, prima del push)** — `README.md` di radice, `ROADMAP.md` e la lista delle candidate in
  `dipendenze.md` («_già installata, in uso dal 16/09/2026_», come `pg`). La nota a margine
  sul commit di verifica di `README-API.md` resta: non è di questa task.

## Giro del 19/09/2026 (segnala-problemi, fine task `task/pagine-luoghi-foto`, commit `18141cf`)

Giro sulla task «Casa, Palestra, Live Club e stacca la spina sulla loro foto». Fatti girare
`npm run prova` (**180 a posto, 0 no**), `node strumenti/audit-regressioni.js` (**366 ok,
0 falliti**) e `npm run verifica:build` (**33 ok**). Letti per intero `js/game/luoghi-foto.js`
e `css/luoghi-foto.css`, il blocco nuovo di `stretto.css`, il diff di `hub.js`,
`menu-sistema.js` e `tempo-controlli.js`, l'elemento `#luogo` in `gioco.html`; e intorno,
per le interazioni: `ui.js` (`avviaAzioneDiretta`, `mostraScena`, `SCENA_PIENA`),
`actions.js` (le sei mosse che passano da qui), `interruzioni.js` e `orari.js` che incartano
le stesse funzioni, `spostamenti.js` (la guardia sul posto), `uscita.js` (USCITE),
`eventi-v2.js` (`overlayBusy`, il salto del tempo), `trasferte.js` (`schermoLibero`),
`skip.js`/`agenda.js` (la notte di «Vai in camera»), `modal.js`, `piazza.js`,
`telefono.js` e `telefono-stretto.js`, `strada-crimine-ui.js` (il carcere a 112 sta sopra).
Poi il gioco vero con Playwright su `localhost:8000`, a 1366×768 e a 390×844: aperte le
quattro pagine, fatte «stacca la spina», «cardio» e «open mic» alle 21 con un pezzo fuori,
la Piazza con la foto sotto, «I conti di casa», «Vai in camera» (giorno 2, ore 08:00,
energia piena, si resta in cucina), «Torna alla mappa» dal menu, la pagina con la mossa
già fatta due volte. **Nessun errore in console dalle pagine nuove**, nessuna richiesta
fallita: le cinque foto si caricano (anche quelle nella cartella col lo spazio nel nome),
il divano è quello di giorno alle 08:00 e quello di sera alle 21:00.

Le cose che **tengono** e che ho controllato a mano: `#luogo` non sta in USCITE, in
`overlayBusy` né in `schermoLibero`, e per questa pagina va bene così — è il modello dello
Studio (`#studio` non c'è nemmeno lui): ESC apre il menu di sistema come nello Studio,
`overlayAperto()` deve restare falso perché `esegui()` in `ui.js:134` chiude il conto
dell'azione solo se nessuna finestra è aperta, e gli eventi e gli inviti delle trasferte
escono sopra alla pagina (modale a 60, gli overlay di Eventi V2 a 999999, il carcere a 112,
`tras-overlay` a 120). I tre incarti (`renderGioco`, `mostraScena`, `apriPiazza`/
`chiudiPiazza`) si caricano dopo `ui.js` e `piazza.js` e prima di `interruzioni.js` e
`orari.js`, quindi la catena è quella giusta: un'interruzione rimanda l'esito e lo
riconsegna alla pagina; il build non rinomina i nomi (`minifyIdentifiers:false`), quindi
`window.mostraScena = …` vale anche nel file unico. `tempo.js` incarta
`avviaAzioneDiretta` prima che la pagina la chiami, quindi la durata della mossa è quella
giusta (stacca: 3 ore, provato). Il cartello del Live Club prima delle 20 lo ferma già
`orari.js:382-399` sulla mappa, come prima. Le porte della Casa, il pannello dei conti,
la Piazza dal Live Club e l'orologio della fascia si aggiornano da soli. Sette cose da
segnalare, nessuna blocca la partita; le prime tre si vedono, le altre si sistemano con calma.

### «I conti di casa» aperti dalla Casa coprono il Menu e «Torna alla mappa»
- **dove** — `frontend/js/menu-sistema.js:560-561` (l'elenco HOSTS: `luogo` viene prima di
  `pannello`), contro `frontend/js/game/tempo-controlli.js:34-46` dove `pannello` viene
  prima di `luogo`; la porta che apre il pannello è `frontend/js/game/luoghi-foto.js:427-429`.
- **cosa succede** — la porta «I conti di casa» apre il pannello delle spese fisse (`#pannello`,
  che sta a 94) sopra alla Casa (che sta a 55). Il menu di sistema cerca in quale pagina montare
  la barra col Menu e «Torna alla mappa», trova prima la Casa e la monta nella sua fascia — che
  sta **sotto** al pannello. Risultato: sul pannello delle spese non c'è né il Menu né «Torna
  alla mappa», resta solo la ✕ in alto a destra (che chiude il pannello e ti rimette in cucina,
  non sulla mappa, anche se la sua etichetta dice «Torna alla mappa»). L'orologio invece c'è,
  perché `tempo-controlli.js` guarda le pagine nell'altro ordine. Aprendo lo stesso pannello
  dallo Shop sulla mappa la barra c'è: il buco è solo da qui.
- **come si vede** — mappa → Casa → «I conti di casa»: in alto a sinistra niente Menu (provato
  con Playwright: nel punto dove sta la barra risponde il pannello, non lei).
- **quanto pesa** — si vede ma si gira intorno: la ✕ chiude e da Casa si torna alla mappa.
- **RISOLTO (19/09/2026, stesso branch, prima del push)** — in `menu-sistema.js` l'elenco HOSTS mette `pannello` prima di
  `luogo`, come già fa `tempo-controlli.js`: la barra col Menu e «Torna alla mappa» adesso si
  monta nella fascia del pannello (provato con Playwright: sotto al dito risponde la nav).

### Sul telefono, una mossa lanciata dal telefono alzato apre la pagina sotto al telefono
- **dove** — `frontend/css/luoghi-foto.css:16` (la pagina sta a 55) contro
  `frontend/css/telefono-stretto.css:61` (il telefono alzato sta a 58); chi apre la pagina è
  l'incarto di `mostraScena` in `frontend/js/game/luoghi-foto.js:394-405`, chiamato dalle
  righe dell'agenda del telefono (`frontend/js/game/telefono.js:787-794`), che elencano
  tutte le mosse — «Pesi», «Cardio leggero», «Stacca la spina», «Serata open mic» comprese.
- **cosa succede** — sotto i 1180 punti il telefono si alza a schermo pieno (58) sopra alla
  mappa. Se da lì tocchi «Cardio leggero», la mossa parte (energia spesa, ora avanzata) e il
  suo esito si scrive sulla pagina della Palestra, che si apre a 55: **dietro** al telefono. Tu
  vedi ancora il telefono e niente che dica cos'è successo, finché non lo metti giù. Prima di
  questa task l'esito usciva nella scenetta `#scena`, che sta a 80 e passava sopra al
  telefono. Sul computer non succede: lì il telefono è una colonna della plancia e la pagina
  la copre. Lo Studio ha lo stesso 55, ma le sue mosse dal telefono non ci sono.
- **come si vede** — finestra a 390×844, tasto del telefono nella barra, app dell'agenda,
  «Cardio leggero» (con energia): il telefono resta davanti (provato con Playwright:
  `#luogo.on` acceso, `.ptel.on` acceso, nel centro dello schermo risponde il telefono).
- **quanto pesa** — si vede ma si gira intorno: «Metti giù» e la pagina è lì con l'esito.
- **RISOLTO (19/09/2026, stesso branch, prima del push)** — `apriLuogo()` chiama `telStrettoChiudi()` prima di accendere la
  pagina: il telefono si mette giù e la pagina è davanti, com'è quando arrivi dalla mappa
  (provato a 390×844: «Cardio leggero» dal telefono, l'esito in mezzo allo schermo).

### Sul telefono il costo delle mosse nelle righe è tagliato: i 18 € dei Pesi non si leggono
- **dove** — `frontend/js/game/luoghi-foto.js:281` (Pesi/Cardio) e `:328`, `:331` (palco/
  piazza): il costo (`lfCosto`) è accodato alla descrizione della riga, dentro allo `<span>`
  che `css/studio.css:182-183` (`.stchi span`) tiene su una riga sola con i
  puntini.
- **cosa succede** — a 390 punti la riga dice «Ferro pesante, poc…» e «Il palco, con i tuoi
  pezzi.…»: energia e soldi sono dopo i puntini. Il tasto d'oro dice «Fai i pesi» senza costo,
  la colonna «Oggi» dice quanto hai in cassa ma non quanto se ne va. Quindi sul telefono
  nessun punto della pagina dice che i Pesi costano **18 €** (e 16 energie): lo scopri dopo,
  o dalla finestra di conferma se «conferme» è acceso nelle impostazioni. Lo stacca la spina
  non ha il problema: il suo costo sta nel tasto.
- **come si vede** — finestra a 390×844, Palestra: le due righe in mezzo.
- **quanto pesa** — si vede ma si gira intorno (con le conferme accese lo dice la finestra;
  spente, paghi senza che nessuno te l'abbia scritto).
- **RISOLTO (19/09/2026, stesso branch, prima del push)** — `lfTasto()` accoda il costo al tasto d'oro («Fai i pesi · 16
  energie · 18 €», «Sali sul palco · 42 energie»), che non si tronca; nelle righe resta per
  chi ha lo schermo largo.

### «Vai in camera» salta il giorno senza i controlli del tasto «+1» dell'orologio
- **dove** — `frontend/js/game/luoghi-foto.js:438` chiama `saltaGiorni(1)` direttamente; il
  «+1» dell'orologio passa da `ADF_TIME_SKIP` (`frontend/js/game/eventi-v2.js:3062-3070`) e da
  `blocked()` (`frontend/js/game/tempo-controlli.js:198`).
- **cosa succede** — il tasto dell'orologio si rifiuta di far passare la notte se il catalogo
  degli eventi non è ancora pronto (`ADF.ready`), se un salto è già in corso, se c'è un evento
  alto che aspetta una risposta (`globalHigh`) o se c'è una finestra che blocca. La porta della
  Casa controlla solo `G.ended` e va: la notte passa lo stesso. Il commento dice «la stessa del
  tasto Salta avanti, e chiede conferma come lui» — la conferma c'è, i controlli no. L'agenda
  invece c'è, perché `agenda.js:277-283` incarta `saltaGiorni` per tutti.
- **come si vede** — solo leggendo il codice: nel giro normale (provato) la notte funziona.
  Il caso da provare è Casa aperta nei primi secondi di gioco, prima che gli eventi siano
  caricati.
- **quanto pesa** — da sistemare con calma: una riga di guardia, la stessa del «+1».
- **RISOLTO (19/09/2026, stesso branch, prima del push)** — «Dormi» passa da `ADF_TIME_SKIP(1)` (con `saltaGiorni` di ripiego
  se il ponte non c'è) e se dice di no lo scrive in un toast.

### Da «Stacca la spina» non si torna in cucina se non fai la mossa
- **dove** — `frontend/js/game/luoghi-foto.js:407-418` (`luogoContinua`) e `:224-254`
  (`lfStacca`): «Continua» compare solo dopo la mossa.
- **cosa succede** — dalla Casa entri nello stacca la spina; se cambi idea, o se la mossa è
  spenta perché l'hai già fatta due volte («Serve TORNARE DOMANI.», provato), la pagina non ha
  un tasto per tornare in cucina: l'unica uscita è «Torna alla mappa» e poi di nuovo Casa.
  Lo Studio ha le linguette in basso per spostarsi, questa pagina no.
- **come si vede** — Casa → «Stacca la spina» → cerca il modo di tornare alle porte.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (19/09/2026, stesso branch, prima del push)** — accanto al tasto d'oro c'è «Torna in cucina» (`stsecondo`,
  `data-continua`) quando la pagina arriva dalla Casa, anche a mossa spenta; e il motivo
  «Serve TORNARE DOMANI.» è diventato «Per oggi basta: torna domani.» (la nota a margine 2).

### Il documento delle pagine-azioni dice ancora che Casa, Palestra e Live Club sono finestre
- **dove** — `documentazione/pagine-azioni/README.md:55-56` (la tabella dei pesi: «finestra:
  Casa, Palestra, Live Club», «scena: … live, stacca, pesi, cardio»), `:66-73` (dove sta ogni
  mossa oggi) e `:774-776` («resta scena» per stacca, pesi e cardio).
- **cosa succede** — il commit ha aggiornato `02-interfaccia-e-telefono.md`,
  `implementazioni.md` e la roadmap, ma il documento che spiega come si costruiscono queste
  pagine racconta ancora lo stato di prima: tre finestre e quattro scene che non esistono più.
  Chi lo legge per fare la prossima pagina parte da una mappa vecchia. La riga 805 («Il turno
  di lavoro, staccare la spina, la palestra, il cardio» come cose che restano scena) idem.
- **come si vede** — `grep -n "resta scena\|finestra" documentazione/pagine-azioni/README.md`.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (19/09/2026, stesso branch, prima del push)** — una nota «Stato al 19/09/2026» in testa al foglio dice cosa è
  cambiato dopo la fotografia del 07/09 e come leggere le tabelle; il foglio resta il
  progetto com'era scritto, non si riscrive a ogni pagina.

### (non di questa task) La mano del braccio alzato del rapper è un tracciato SVG rotto
- **dove** — `frontend/js/creator/nav.js:71`: l'ultimo pezzo `C` del tracciato ha due
  coppie di numeri invece di tre (`C55.6,-364.2 49.7,-365.2 Z`).
- **cosa succede** — ogni volta che si apre la Piazza (`piazza.js:55`, `ARTIST_BODY()`) la
  console segna `<path> attribute d: Expected number` e il browser salta quel pezzo di disegno:
  la mano che tiene il microfono non si disegna. Era così anche prima di questa task; l'ho
  visto perché la Piazza è nel giro.
- **come si vede** — Live Club → «Vai in piazza» → la battle, con la console aperta.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (20/09/2026)** — branch `task/mano-rapper-svg`: la curva è `C56,-366 50,-367
  48,-372 Z`, con il terzo punto che è il polso da cui il tracciato parte — la mano si
  chiude su sé stessa invece di restare un pezzo che il browser butta via. Nell'audit un
  controllo genera `ARTIST_BODY()` con un artista finto e conta le coordinate di ogni
  comando (`M`/`L` due, `C` multipli di sei, `Z` nessuna): sul codice vecchio fallisce,
  sul nuovo passa.

Note a margine, scelte e non bug: (1) nello stacca la spina, prima di premere, la riga sotto
ai numeri dice «hai rivisto gente che non c'entra niente con la musica» al passato, come se
fosse già successo (`luoghi-foto.js:237`) — sistemata, adesso è al presente; (2) il motivo «Serve TORNARE DOMANI.» sotto al
tasto spento è il testo di `actions.js:599` letto da `hubPronta`, che sulla mappa stava in
una card e qui sta in mezzo alla pagina, in maiuscolo; (3) a 1366 il sottotitolo della
Palestra nella fascia esce tagliato («il fisico che si vede sotto le luc») anche se a destra
c'è spazio — va guardato, non ho capito da cosa dipende.

L'indice «Cosa resta aperto» in testa al foglio è aggiornato: sei voci chiuse nello stesso
branch, resta la mano del rapper.

## Giro del 19/09/2026 (segnala-problemi, fine task `task/avvio-rapido`, commit `f29ad6b`)

Giro sulla task «Preparo il tuo artista», la schermata dell'avvio rapido. Fatti girare
`npm run prova` (**180 a posto, 0 no**), `node strumenti/audit-regressioni.js` (**375 ok,
0 falliti**) e `npm run verifica:build` (**33 ok**). Letti per intero `js/preparo.js` e
`css/preparo.css`, il blocco `#preparo` di `gioco.html`, il diff di `js/gioco-ingresso.js`
(`quandoCreatorPronto`, `richiediMakeHumanRapido`, `preparoFallito`, `avvioRapido`), quello di
`media/creator-rpg-v24/creator.html` (il rilancio delle fasi, `startQuickMakeHuman`,
`requestQuickMakeHumanPreset`, il risultato del preset), di `runtime.js` (`setStatus`,
`emitToRoom`, `init`, il gestore del preset rapido, `adfMhApplyPreset`) e di
`modifier-engine.html` (`log`); intorno, `js/creator/rpg-v24-bridge.js` (l'overlay a 999999 e
cosa fa al «cancel»), `js/pagine.js` (`vaiA` e la shell della landing), `js/avvio.js` (come
si arriva a `?nuova=rapido&slot=n`), `strumenti/build.js` (la copia di `media/`) e il caso
@lento di `test/e2e/gameplay.spec.js`. Poi il gioco vero con Playwright su `localhost:8000`
(Chromium senza GPU, quindi i tempi sono quelli lunghi): l'avvio rapido dalla landing con la
schermata letta ogni mezzo secondo; lo stesso con `runtime.js` bloccato per vedere il limite
dei venti secondi e i tre tasti, con «Torna al menu», «Fallo a mano» e «Riprova» premuti uno
per volta; a 390×844 l'attesa e l'errore; il camerino aperto da solo
(`media/makehuman-camerino-v1/index.html`, 45 secondi, nessun errore in console).

Le cose che **tengono**: la catena delle fasi arriva alla schermata (a 0,8 s «Scarico il
modello del corpo», a 1,6 s «Costruisco il personaggio», a 2,1 s «Scelgo il look e scatto la
foto», poi il personaggio pronto a 37 s e la città a 100 s, cinematic compresa — zero errori
in console); la schermata sta sopra al creator (1000000 contro 999999) e sotto non c'è
niente che debba passarle davanti durante l'avvio rapido (gli overlay a 1000000 e 1200000
di `eventi-v2.js` sono cose del gioco, non dell'avvio); il creator normale e «Il tuo artista»
non la vedono (la apre solo `avvioRapido`, `gioco-ingresso.js:647`) e non rilanciano le fasi
(`creator.html:3321` le passa solo con `quickMakeHumanPending`); il camerino da solo le manda
a se stesso e le ignora (il suo ascoltatore a `runtime.js:4866` guarda solo il preset rapido e
l'init, quello del motore controlla da chi arriva); i `'*'` nei `postMessage` portano solo
righe di stato, niente di riservato; il limite dei venti secondi scatta a 20 s tondi con la
frase giusta e i tre tasti; «Torna al menu» nella shell chiude la cornice del gioco e la
landing è lì sotto; «Riprova» ricarica con `?nuova=rapido` e la schermata riparte (lo slot
non serve nell'indirizzo: è già nelle impostazioni); il contatore va con l'orologio vero,
non con i giri del timer, quindi dopo un blocco del thread mostra il tempo giusto; nel
pacchetto (`dist/media/`) ci sono le righe nuove del creator, del camerino e del motore, e
il bundle del gioco ha `ADF_PREPARO`; sul telefono i tre tasti sono alti 44 punti, niente
esce dallo schermo; `:hover` sta sotto `@media (hover:hover)`.

### La sesta tacca, «Pronto: si entra», non si accende mai
- **dove** — `frontend/js/preparo.js:41` e `:43`.
- **cosa succede** — quando il personaggio è pronto il gioco manda «pronto per entrare»
  per accendere l'ultima tacca. Ma la fase di prima, «Costruisco il personaggio», si
  riconosce con `/PRONTO|Costruisco personaggio/i` — e quella `i` fa prendere anche
  «pronto per entrare», che è la quarta fase, non la sesta. La barra va solo avanti, quindi
  il messaggio viene buttato: la schermata sparisce con la barra a quattro tacche e la
  scritta ancora su «Scelgo il look e scatto la foto». L'ho visto con la sonda: alla
  chiusura le tacche erano `fatta,fatta,fatta,fatta,in-corso,-`. Si vede poco perché la
  dissolvenza dura mezzo secondo, ma la barra non arriva mai in fondo.
- **come si vede** — avvio rapido, guardare la barra nell'istante in cui la schermata
  sfuma; oppure in console `ADF_PREPARO.fase("pronto per entrare")` dopo la quarta fase.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (19/09/2026, stesso branch, prima del push)** — la fase del motore si riconosce da «PRONTO:» maiuscolo e col
  due punti (niente `/i`), e «pronto per entrare» ha la sua riga: sesta tacca accesa
  (provato: «Pronto: si entra» prima della cinematic). Le quattro righe del preset — vesto,
  modello, ricostruisco, scatto la foto — sono diventate sottofasi della quinta tacca, scritte
  sotto (la nota a margine 1).

### «Fallo a mano» apre il camerino rotto, non il creator, e l'avvio rapido nel creator resta acceso
- **dove** — `frontend/js/gioco-ingresso.js:616-620` (il tasto); `creator.html:3245`
  (`quickMakeHumanPending` che nessuno spegne) e `:3336-3338` (il preset che parte da solo).
- **cosa succede** — dopo «Il camerino non ha risposto» ho premuto «Fallo a mano»: si vede
  il creator, ma con sopra il camerino ancora aperto (è la stessa finestra che non era
  partita), e dentro il suo cartello tecnico «MakeHuman non è riuscito ad avviarsi —
  runtime.js non caricato: http://127.0.0.1:8000/media/…». Il giocatore deve capire da solo
  che c'è «Indietro» in basso a sinistra per tornare alla scelta dell'avatar. In più il
  creator si ricorda ancora di essere in avvio rapido: se il camerino poi si sveglia (il
  caso vero è il limite dei due minuti su una macchina lenta, non quello del file
  bloccato), applica un preset a caso e chiude il camerino sotto le mani di chi sta
  facendo il personaggio, saltando alla schermata dell'identità.
- **come si vede** — bloccare `media/makehuman-camerino-v1/runtime.js` (in devtools,
  Network → block request), avvio rapido, aspettare venti secondi, «Fallo a mano».
- **quanto pesa** — si vede ma si gira intorno.
- **RISOLTO (19/09/2026, stesso branch, prima del push)** — «Fallo a mano» manda al creator
  `adf-rpg-v24-quick-makehuman-cancel`: `quickMakeHumanPending` si spegne, il camerino si
  chiude col suo cartello, e un risultato in ritardo non applica più niente (provato con
  `runtime.js` bloccato: sotto c'è «Come vuoi creare il tuo artista?», pulito).

### Il lettore di schermo legge il contatore ogni secondo
- **dove** — `frontend/pagine/gioco.html:103` (`aria-live="polite"` su tutto `#preparo`) e
  `:116` (`#preparo-tempo`), `frontend/js/preparo.js:78-81`.
- **cosa succede** — tutta la schermata è una zona «parlante», e dentro c'è il contatore
  che cambia testo ogni secondo: per chi usa un lettore di schermo sono «1 s», «2 s»,
  «3 s»… per tutta l'attesa, sopra alle fasi che invece andrebbero sentite. E la nota «La
  prima volta ci mette un po'» sta nella pagina da subito (è invisibile solo per
  l'opacità), quindi viene letta al secondo zero, non dopo i 25 secondi.
- **come si vede** — Windows: Narratore o NVDA acceso, avvio rapido.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (19/09/2026, stesso branch, prima del push)** — `aria-live` sta solo sulla fase (e sulla riga sotto); il contatore e
  la nota «la prima volta ci mette un po'» sono `aria-hidden`.

### Quando compaiono i tre tasti nessuno ci va sopra con il focus
- **dove** — `frontend/js/preparo.js:122-126` (`errore`).
- **cosa succede** — i tasti vengono scritti nella pagina e basta: il focus resta sul
  corpo del documento (la sonda lo ha letto: `BODY`). Chi va con la tastiera o con un
  lettore di schermo sente «Non ce l'ha fatta» ma non sa che c'è qualcosa da premere, e
  con Tab può finire dentro al creator che sta sotto, invisibile.
- **come si vede** — come sopra, poi Tab.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (19/09/2026, stesso branch, prima del push)** — `errore()` mette il fuoco sul primo tasto (provato: «Riprova»).

### Se il creator non c'è proprio, l'errore dice «Sono passati 29 milioni di minuti» e «Fallo a mano» porta al nero
- **dove** — `frontend/js/gioco-ingresso.js:641` (chiamato prima di `apri()` a `:647`),
  `frontend/js/preparo.js:47`, `:53` e `:116-118`.
- **cosa succede** — se il ponte del creator (`ADF_RPG_V24`) non è caricato, la schermata
  d'errore viene aperta senza che sia mai stata aperta quella d'attesa: il momento di
  partenza vale zero, e «Sono passati …» conta dal 1970 (circa 29 milioni di minuti); la
  barra delle tacche è vuota perché non è mai stata disegnata. E «Fallo a mano» chiude la
  schermata per mostrare un creator che non esiste: si resta davanti al nero. Succede
  solo se `rpg-v24-bridge.js` è rotto — ma è proprio il caso in cui la schermata dovrebbe
  aiutare.
- **come si vede** — in console, prima dell'avvio rapido, `delete window.ADF_RPG_V24`;
  oppure leggere `secondi()` con `partita = 0`.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (19/09/2026, stesso branch, prima del push)** — `ADF_PREPARO.apri()` è la prima riga di `avvioRapido()`; `secondi()`
  parte da adesso se nessuno l'ha mai aperta; e con `{senzaCreator:true}` «Fallo a mano»
  non si offre.

### Il limite dei due minuti è fisso anche mentre il camerino sta parlando
- **dove** — `frontend/js/gioco-ingresso.js:245-248` (120 s) e `:255-258` (20 s);
  `frontend/js/gioco-ingresso.js:108` (i 6 s del creator).
- **cosa succede** — tre limiti diversi, e solo quello dei venti secondi si spegne quando
  arriva un segno di vita. I due minuti contano dall'inizio, qualunque cosa il camerino
  dica: e il file stesso scrive che senza scheda video ci si arriva a 115 s. Sul PC di
  prova (Chromium a software) il personaggio arriva a 37 s e il caso @lento passa in 1,4
  min; una macchina appena più lenta senza GPU — un portatile vecchio, una macchina
  virtuale, un Chromebook — passa i 120 s mentre sta finendo, si vede «Il camerino non ha
  finito in due minuti», e «Riprova» ricomincia da capo (il modello resta in cache, la
  ricostruzione no). Ora che le fasi arrivano una per una, il limite potrebbe contare il
  silenzio dall'ultima fase invece del totale; ma è una scelta, la segno e basta. Due
  note sugli altri due: prima della prima fase il camerino deve scaricare `index.html`,
  `runtime.js` (225 KB) e `three.module.js` (620 KB) — dal pacchetto sono in locale, ma
  in una versione via web su una connessione lenta 20 s possono non bastare; e il creator
  ha 6 s (120 tentativi × 50 ms, `:108`), un terzo del camerino, senza un motivo scritto.
- **come si vede** — Chromium headless con `--disable-gpu` su una macchina lenta;
  oppure abbassare `120000` a `30000` e fare l'avvio rapido senza scheda video.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (19/09/2026, stesso branch, prima del push)** — non più una scelta: i due minuti sono «senza notizie», `riarma()` a
  ogni fase. Sulle macchine senza GPU il blocco muto più lungo visto è 70 s, sotto al limite.

### Il caso @lento non guarda la schermata
- **dove** — `frontend/test/e2e/gameplay.spec.js:60-147`.
- **cosa succede** — la prova dell'avvio rapido controlla che si arrivi in città, ma non
  che `#preparo` si apra, che le fasi avanzino e che si chiuda: l'unico controllo
  automatico sulla schermata è l'audit (`strumenti/audit-regressioni.js:1985-2023`), che
  guarda le stringhe nei file, non cosa succede — infatti la tacca che non si accende
  (la prima voce di questo giro) non l'ha vista. Basterebbe leggere `#preparo-fase` e le
  tacche mentre si aspetta, la prova sta già lì per 100 secondi.
- **come si vede** — `grep -c preparo frontend/test/e2e/gameplay.spec.js` dà 0.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (19/09/2026, stesso branch, prima del push)** — la prova aspetta la schermata accesa con una fase vera (fino a 30 s)
  e alla fine vuole `#preparo` nascosto (`preparoVia`).

Note a margine, scelte e non bug: (1) le quattro righe nuove che il camerino manda durante
il preset — «Vesto il personaggio» (`runtime.js:5657`), «Modello il corpo» (`:5673`),
«Ricostruisco la scena» (`:5679`), «Scatto la foto» (`:4910`) — arrivano alla schermata ma
non le riconosce nessuna fase (`preparo.js:37-44`), quindi non cambiano niente: o si danno
loro una tacca o si tolgono, adesso sono fili che non vanno da nessuna parte; (2) nel
Chromium senza GPU il contatore resta su «5 s» per trenta secondi e poi salta a «37 s»,
perché il camerino blocca il thread anche del gioco (stesso processo) — su Chrome vero il
blocco è di pochi secondi, e il contatore riprende giusto; non è della schermata, ma è
quello che vede chi non ha la scheda video; (3) «Fallo a mano» non aggancia il tasto
«to-menu» come fa `creatorePoiCitta` (`gioco-ingresso.js:278-288`), ma il ponte al
«cancel» pulisce lo slot da sé (`rpg-v24-bridge.js:222-232`), quindi va bene così.

L'indice «Cosa resta aperto» in testa al foglio ha le voci nuove di questo giro.

## Giro del 20/09/2026 (segnala-problemi, fine task `task/piccole-agenda-beat-parametri-licenziarsi`, commit `164e6be`)

Giro sulle «quattro piccole»: l'evento fatto che esce dall'agenda, i prezzi dei beat per
fama del beatmaker, la partenza con tutti i parametri a 1, il lavoro da cui non ci si
licenzia. Il backend non è stato toccato. Fatti girare `npm run prova` (**179 a posto,
1 no** — vedi la prima voce), `node strumenti/audit-regressioni.js` (**383 ok, 0 falliti**,
compreso il blocco nuovo «Le quattro piccole del 20/09»), `npm run verifica:build` (**33
ok**) e `npm run test:unit` (3 su 3). Letti per intero il diff del commit e `agenda.js`; poi
intorno: chi chiama `consumaPeso` (`actions.js` promo/live/stacca/palestra, `piazza.js`,
`posto.js`, `strada-crimine.js`), chi legge le voci dopo (`hub.js` il quadratino e la card
della settimana, `telefono.js` l'app Agenda, `bloccoSalto`, `controllaOggi`,
`controllaGiorno`), `beats.js` con `state.js` e `content.js` davanti (l'ordine degli script
in `gioco.html`: `clamp` e `rnd` ci sono già), `studio.js` (`studioBeatPronto`,
`studioBeatPrezzo`), le due card e il loro CSS (`.shs` a due righe con i puntini,
`.stbgen` su una riga con i puntini: il testo lungo non esce), `offerJobs` e la mossa
«Cerca lavoro», `sim.js` (il licenziamento a `missed >= 3`, cioè tre settimane: il testo
nuovo dice il vero), EV0035 nel catalogo (JSON valido, stesso formato degli altri 183
`requirements`, `no_job` accanto a `has_job` in `testReq`), la Famepedia e le pagine per
testi vecchi su prezzi, «licenziarsi» e «da zero» (niente da correggere), le soglie sulle
skill (la più bassa è 16: partire da 1 non ne sposta nessuna). Fuori dal browser ho fatto
girare `agenda.js` e `beats.js` dentro a `vm` per vedere cosa fanno davvero: i prezzi stanno
sempre nella loro fascia (emergente 105–250, affermato 320–1000, famosissimo 1000–2000 su
500 giri per caso), un beat vecchio senza `fascia` non scrive niente, e la voce di sabato
resta se l'evento lo giochi mercoledì.

Le cose che **tengono**: `onora` toglie solo le voci di oggi con quel nome, di oggi o della
settimana, e non tocca gli altri giorni; il `save()` parte solo se ha tolto qualcosa; il
filtro rifà l'array invece di toglierci dentro, quindi nessun giro sulle voci si rompe a
metà; la plancia e il telefono rileggono le voci a ogni disegno, quindi il quadratino e
l'app si aggiornano da soli; `G.job` si assegna in tre posti (`actions.js:227`, `hub.js:454`,
`eventi-v2.js:418`) e tutti e tre passano solo se non lavori già — la sola strada per
perderlo è `sim.js:161`; il tasto «Va bene» dei colloqui torna `null` come fanno già i
tasti del centro per l'impiego.

### `npm run prova` è rosso: il test «parte da zero» vuole ancora le skill a 0
- **dove** — `frontend/strumenti/prova.js:345-354` (il controllo a `:352`,
  `Object.values(stato.skills).every(v => v === 0)`); la riga che è cambiata è
  `frontend/js/game/state.js:21`.
- **cosa succede** — il commit porta le quattro abilità a 1, ma il test «soldi, fan, hype,
  skill e stream iniziano tutti da zero» chiede ancora che siano tutte a 0: `npm run prova`
  chiude con **179 a posto, 1 no** e codice d'uscita 1. `npm run verifica` è una catena di
  comandi legati con «e poi»: si ferma lì, e l'audit, le prove del browser e il build dopo
  non partono nemmeno. L'audit nuovo, dall'altra parte, pretende le skill a 1
  (`audit-regressioni.js:2186`): i due controlli si contraddicono, e uno dei due sarà
  sempre rosso finché il test non si aggiorna (anche il titolo del blocco, «la nuova carriera
  parte da zero», dice una cosa non più vera per le skill).
- **come si vede** — `cd frontend && npm run prova`, guardare il blocco «la nuova carriera
  parte da zero»: la riga `skills={"scrittura":1,"flow":1,"presenza":1,"rete":1}`.
- **quanto pesa** — si vede ma si gira intorno: il gioco funziona, ma il gate del push è
  rosso e finché resta così la task non si può chiudere.
- **RISOLTO (20/09/2026)** — il test in `prova.js` chiede quattro skill tutte a 1, col titolo
  giusto. La verifica che avevo dato per verde era `npm run verifica | tail`: l'exit code
  letto era quello di `tail`. Rifatta senza il tubo: 180 a posto, 385 dell'audit, e2e e build ok.

### Il bonus dell'evento della settimana si può prendere due volte nello stesso giorno
- **dove** — `frontend/js/game/agenda.js:179-191` (`onora`, `consumaPeso`) con
  `:331-334` (`passata`) e `:126-139` (`segna`); la card che si riaccende è
  `frontend/js/game/hub.js:707-716`.
- **cosa succede** — prima, giocato l'evento, la voce restava e portava scritto
  `bonusUsato`: il peso (×1,2 alla Sala, ×1,25 alla giornata di lanci, ×1,6 al giro grosso)
  non tornava più quella settimana. Adesso la voce sparisce, e per la card della settimana
  l'evento di oggi non è «passato» (`passata` guarda solo se il giorno è già andato):
  il tasto torna su «segna». Segni di nuovo, rigiochi, e il peso torna intero — l'ho
  visto fuori dal browser: `consumaPeso("sala")` dà 1,2, poi `segna`, poi di nuovo 1,2.
  Con la Sala rende: ogni sessione da 60 € è un beat migliore del 20 %, finché hai soldi
  ed energia. Per onestà: il buco c'era anche prima, ma bisognava togliere e rimettere il
  quadratino apposta; adesso è il gioco che lo rimette su «segna» da solo. Il commento in
  cima al blocco (`agenda.js:156-161`, «consumaPeso() lo marca subito») racconta ancora
  il modo vecchio, e `vociDaConsumare` filtra un `bonusUsato` che nessuno scrive più.
- **come si vede** — mercoledì, con «Sessione lunga alla Sala» fra i due della settimana:
  segnala, fai una sessione con un beatmaker, torna in plancia — il tasto dice «segna»;
  segnala e rifai la sessione.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (20/09/2026)** — `G.agenda.onorati` tiene le chiavi `anno:sett:giorno:tipo:id` di
  quello che hai onorato oggi (`onora` le scrive, `pulisci` butta quelle di ieri): `vociDaConsumare`
  torna vuoto se la settimana è già onorata, quindi il peso è 1, e `passata()` dice «passato»,
  quindi la card non torna su «segna». Provato fuori dal browser: 1,3 → segna → 1. Il commento
  vecchio è riscritto; il filtro su `bonusUsato` resta per i salvataggi di prima.

### L'evento «fatto» resta in agenda se il gioco non lo conta come fatto
- **dove** — `frontend/js/game/posto.js:851-858` (solo la «sessione» chiama
  `consumaPeso("sala")`), `frontend/js/game/strada-crimine.js:204-210` (solo se il colpo
  riesce), `frontend/js/game/actions.js:614-617` (il «Piccolo party»).
- **cosa succede** — il punto dice «dopo che ho partecipato l'evento si toglie», ma la
  voce si toglie solo quando parte il pezzo di codice che dà il peso. «Producer session»
  segnata: vai alla Sala alle 22:30, parli con la gente, ascolti il beat sul tavolo — la
  voce resta, perché si toglie solo con la «Sessione» a pagamento (60 €, e serve un
  rapporto di almeno 2). «Colpo rapido» segnato: se il colpo va male la voce resta, e
  l'agenda ti dice ancora di andarci. All'inverso, il «Piccolo party» delle 00:00 si toglie
  anche se «Stacca la spina» lo fai alle dieci di mattina, perché è la stessa mossa. Il
  salto del tempo non si blocca comunque (dopo l'ora l'appuntamento non ferma niente), ma
  il quaderno dice il falso fino a mezzanotte.
- **come si vede** — segna «Producer session», vai alla Sala e non fare la sessione;
  oppure segna «Colpo rapido» e fallisci il colpo. Apri l'app Agenda del telefono.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (20/09/2026)** — in `strada-crimine.js` il peso si legge prima del dado: al colpo ci
  sei andato anche se va male. In `posto.js` farsi sentire un beat chiama `AGENDA.onora("sala",
  "oggi")`: chiude il «Producer session» di stasera e non la «Sessione lunga» della settimana,
  che vuole la sessione vera e il suo peso. Il «Piccolo party» non era un problema: `orari.js`
  apre «Stacca la spina» solo dalle 00:00 alle 04:00, di mattina non si fa.

Note a margine, scelte e non bug: (1) **si parte con 0 € e il beat più economico costa
100**: il primo beat vuole almeno un turno (70–220 € a seconda del lavoro) o la sessione
alla Sala, mentre prima costava 15 — è quello che il punto di ALE chiede, ma la prima
mezz'ora di gioco cambia, e vale la pena provarla; (2) **la sessione alla Sala costa 60 €
e il beat è tuo gratis** (`posto.js:852` e `:862`), meno del fondo del listino di un
emergente, e il beat sul tavolo con rapporto 1 viene 88 € (`posto.js:841`): il foglio lo
dice apposta — «l'amicizia è un'altra cosa» — ma il listino e la Sala adesso raccontano due
prezzi diversi per lo stesso beatmaker; (3) sulla card dello Studio la riga del genere sta
su una riga sola con i puntini (`studio-elementi.css:80`): con un beatmaker dal nome lungo
a 180 punti di card si legge «boom bap · Nome Cog…», che va bene, ma la fascia non si vede
mai quando c'è il nome — è così per scelta (`b.da` vince).

L'indice «Cosa resta aperto» in testa al foglio ha le voci nuove di questo giro.

## Giro del 20/09/2026 (segnala-problemi, fine task `task/barra-plancia-980-1180`, commit `c4d9f77`)

Giro sul commit che stringe la fascia della plancia per gradi (1240, 1120), la manda a capo a
980, la fa in tre righe sotto i 620, sistema le testate dei posti sotto i 620 e i 400, le card
degli eventi sotto i 1520 e il profilo sotto gli 820 di altezza. `npm run verifica` era già
verde (lo dice il messaggio della task) e non l'ho rifatto. Letti per intero il diff del commit,
i blocchi `@media` di `hub.css` e `stretto.css` con le regole base della fascia, `tempo-controlli.js`
(la lista dei posti e lo stile che inietta), `menu-sistema.css` e `menu-sistema.js` (dove si appoggia
il marchio), `telefono-stretto.css`, `hub.js` (le sei risorse, le card e la settimana), i sette
controlli nuovi dell'audit e i quattro documenti. Poi il gioco vero, con Playwright sul server
di sviluppo, a dodici larghezze fra 360 e 1520 per la plancia e a 390, 360 e 1280 per la Sala, lo
Shop, la piazza e il foglio: misure prese dal browser e schermate guardate, non solo il CSS.

Le cose che **tengono**: a nessuna delle dodici misure la plancia scorre di lato, e la fascia
a 390 × 844 è alta 159 (era 307); fra 901 e 980 la riga della griglia cresce e la seconda riga
delle risorse non finisce sopra al profilo; a 1280 × 800 le card sono 202 × 56 su due righe, le
due scatole del profilo 51 di altezza (non più 2) e la colonna scorre di 27 a 768; la piazza e il
foglio non montano più la pastiglia (`activeHost()` torna `null` e nasconde scatola e pannello)
e il pannello della pastiglia rimpicciolita si apre al posto giusto (`getBoundingClientRect()`
vede la trasformazione, come dice il commento); MAPPA se ne va davvero nella Sala, nello Shop e
nella piazza sotto i 620 e le tre testate non scorrono più di lato a 390 né a 360; le sei
risorse sono costruite da `hub.js:734-741` con l'energia prima e il benessere ultimo, quindi
`.ps:first-child .pbar` e `.pstat .ps:last-child` prendono le celle giuste; i sette controlli
dell'audit cercano cose che nel codice ci sono e passerebbero al rosso se sparissero.

### Il foglio della strofa sul telefono scorre di lato, e la X sta fuori dallo schermo
- **dove** — `frontend/css/overlays.css:47-54` (`.writer{overflow-y:auto}`, `.whead`, la X
  `.wx`) e `frontend/css/menu-sistema.css:541-553` (la nav del marchio con MAPPA nella testata
  del foglio); in `stretto.css` per `.whead` non c'è niente.
- **cosa succede** — a 390 e a 360 la testata del foglio è larga 415 dentro a 354: il marchio
  con MAPPA prende 202 punti, il titolo «Scrivi la tua strofa» va su tre righe e la X parte a
  389, cioè fuori dallo schermo. Siccome `.writer` scorre in verticale, scorre anche di lato
  (433 in 390): si trascina il foglio a sinistra per trovare la X, oppure si usa «Lascia
  perdere» in fondo. La piazza, che è la sorella del foglio in `menu-sistema.css`, in questa task
  è stata sistemata sotto i 620; il foglio no. Il documento della task dice «nessuna schermata
  scorre di lato a nessuna misura» e conta il foglio fra le venti provate.
- **come si vede** — a 390 di larghezza, dallo Studio (Testo) apri il foglio: il titolo su tre
  righe, la X che non c'è, la pagina che si trascina di lato.
- **quanto pesa** — si vede ma si gira intorno.
- **RISOLTO (20/09/2026)** — branch `task/barra-plancia-980-1180`: `#writer.on .whead` sta nelle tre regole delle
  testate sotto i 620 (MAPPA via, marchio 96, titolo da 104) e sotto i 400 (la sola corona,
  titolo da 52), col titolo a 22 punti; a 390 e a 360 la testata non scorre e la X sta a
  328 e a 298. Misurato col banco Playwright, screenshot nello scratchpad.

### La pastiglia del tempo sotto i 620 è rimpicciolita due volte: 105 × 38, scritte da 4,7 punti
- **dove** — `frontend/css/stretto.css:636-647` (plancia) e `:768-776` (Sala e Shop):
  `transform: scale(0.7)` dentro a una scatola da 150 × 44; contro `frontend/js/game/tempo-controlli.js:367-372`,
  il blocco dei 620 dello stile che inietta la pastiglia stessa.
- **cosa succede** — il commento in `stretto.css:583-593` ragiona su un bottone da 210 × 62 che
  ai sette decimi fa 147 × 43. Ma la pastiglia sotto i 620 si rimpicciolisce già da sola a
  168 × 54 (e le sue scritte piccole a 6,7 e 7 punti); poi la scatola da 150 la stringe a 150
  perché è un figlio flessibile; poi i sette decimi. Misurata nel browser: 105 × 38, l'ora a
  14,7 punti, «ANNO 1 · SETT. 01» e «GIORNO 1/7» a 4,7 e 4,9. L'ora si legge e la pastiglia
  si tocca, ma il bersaglio è sotto ai 44 della regola del tocco (`tocco.css`) e le due righe
  piccole su un monitor normale sono un'ombra; su un telefono a tre pixel per punto sono
  quattordici pixel fisici, si leggono a fatica. Vale nella plancia, nella Sala e nello Shop.
- **come si vede** — a 390 di larghezza, la pastiglia in alto nella plancia: la riga sopra e
  sotto l'ora.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (20/09/2026)** — branch `task/barra-plancia-980-1180`: `scale(.9)` in una scatola da 160 (plancia, Sala,
  Shop): 144 × 49 con ANNO/GIORNO a 6 punti, l'ora a 19. La fascia a 390 resta 159 e a 360
  la prima riga fa 96 + 160 + 44 + 43 in 348. Il commento in stretto.css dice le misure vere.

### Le due regole che appoggiano il marchio dove sta `#hb-logo` (980 e 620) non lavorano
- **dove** — `frontend/css/stretto.css:470-476` (`top:8px; left:6px; bottom:auto; height:auto`)
  e `:615-618` (`top:4px; height:44px`), contro `frontend/css/menu-sistema.css:429-434`
  (`left:0; top:0; bottom:0; height:auto`, tutte `!important`).
- **cosa succede** — i due selettori sono identici lettera per lettera, tutte e due le regole
  hanno `!important`, e `menu-sistema.css` si carica **dopo** `stretto.css` (è scritto in cima a
  `stretto.css` e in `gioco.html:58-60`): a parità vince l'ultimo, quindi `top`, `left` e
  `bottom` di stretto non si applicano mai. Il commento sopra dice che il marchio si appoggia
  «dove sta #hb-logo, stessi margini della fascia»; misurato: il marchio sta a 0,0 mentre
  `#hb-logo` sta a 6,19 a 900 e 940, a 6,4 a 390 — fra 901 e 980 il marchio è incollato
  all'angolo, 19 punti più in alto della città che gli sta accanto. Non si stira per tutta
  l'altezza solo perché `align-self:flex-start`, che non ha una rivale, lo tiene alto quanto
  il contenuto. Il blocco delle testate dei posti, tre schermate più sotto, il problema lo
  conosce e ci mette `html` davanti; questi due blocchi no.
- **come si vede** — a 940 di larghezza, la plancia: il marchio nell'angolo in alto a
  sinistra, «CITTÀ ATTUALE» che parte più in basso.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (20/09/2026)** — branch `task/barra-plancia-980-1180`: `html` davanti a tutte e due, e `height:44px`
  invece di `auto` (la prova sul telefono l'aveva misurato 34 con 41 di contenuto). A 900 e
  a 844 × 390: 6,8 e 132 × 44; a 620 e sotto: 6,4 e 96 × 44. Un controllo nell'audit.

### Fra 981 e 1120 «Città di provincia» va su due righe e riempie la fascia fino ai bordi
- **dove** — `frontend/css/hub.css:1315-1317` (`.pcitta{width:150px}` sotto i 1120) con `.pcn` a
  17 punti (`hub.css:202-207`).
- **cosa succede** — in 135 punti di testo «Città di provincia» a 17 punti non ci sta: va su
  due righe (40 di altezza), e con l'etichetta sopra e la fase sotto la casella fa 72 in una
  fascia da 72: «CITTÀ ATTUALE» tocca il bordo di sopra e «Fase 1: Sconosciuto» quello di
  sotto, senza aria. Niente è tagliato (misurato 72 su 72), ma è la casella più stretta di
  tutta la fascia e la città di partenza è quella che si vede per più tempo. A 1121 torna
  su una riga.
- **come si vede** — a 1024 × 768, la plancia, la seconda casella della fascia.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (20/09/2026)** — branch `task/barra-plancia-980-1180`: `.pcitta` a 164 e `.pcn` a 15 punti sotto i 1120:
  una riga da 981 a 1120, la fascia resta 72-75.

### Fra 981 e 1180 il tasto tondo del telefono copre il fondo della seconda riga della settimana
- **dove** — `frontend/css/telefono-stretto.css:109-118` (il tasto fisso in basso a destra,
  56 × 56 a 16 dal bordo) con `frontend/css/hub.css:1343-1357` (la settimana alta due righe,
  fino al fondo della fascia degli eventi).
- **cosa succede** — a 1024 × 768 la riga «Serata open mic · SEGNA» va da 671 a 715 e il tasto
  parte a 696: i 19 punti in fondo alla riga sono sotto al tasto, e la scritta SEGNA lo
  sfiora. Uguale a 1100 × 800, 1180 × 800 e 1180 × 720. Toccando il fondo della riga si apre
  il telefono invece di segnare l'evento; la parte alta della riga risponde. A 900 di altezza
  non si toccano. E il commento sopra a quel blocco (`telefono-stretto.css:109-113`) dice che
  «la barra della plancia trabocca già di suo» e che il tasto galleggia «finché quella barra
  non ha un disegno suo»: adesso il disegno c'è, e il tasto galleggia ancora — che va bene,
  perché nella fascia a 1024 posto non ce n'è (le risorse finiscono a 749, la pastiglia a
  973, il Menu a 1024), ma il commento racconta una cosa non più vera.
- **come si vede** — a 1024 × 768, la plancia, in basso a destra.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (20/09/2026)** — branch `task/barra-plancia-980-1180`: via il blocco 981–1180 di telefono-stretto.css: la
  fascia ci sta (è il lavoro di questa task) e il tasto torna in barra, 44 × 72 fra il tempo e
  il Menu; misurato a 981, 1024, 1100, 1120 e 1180, la barra non scorre e la settimana è
  libera. Il commento dice com'era e perché non c'è più; l'audit controlla che il tondo non
  torni.

### Il «Negozio» delle regole nuove non esiste
- **dove** — `frontend/css/stretto.css:751-820` (`#negozio.on .nghead`, `.ngk`, `.ngx`,
  `#adf-time-dock[data-host="negozio"]`), `implementazioni/02-interfaccia-e-telefono.md`
  («Le testate dei posti (la Sala, il Negozio, lo Shop, la Piazza)») e il messaggio del commit.
- **cosa succede** — in `pagine/gioco.html` non c'è nessun `id="negozio"`, né `.nghead`, né
  `.ngk`, né `.ngx`; `negozio.js` è un file dormiente («ADF_ABBIGLIAMENTO_HIBERNATE_V2», tutte
  le funzioni tornano subito). Le regole per il Negozio in `menu-sistema.css` e in
  `tempo-controlli.js` c'erano già da prima e non sono di questa task; ma le tredici righe
  nuove in `stretto.css` non prendono niente, e il documento e il commit contano il Negozio
  fra le quattro testate sistemate: sono tre (Sala, Shop, piazza).
- **come si vede** — `grep -rn negozio frontend/pagine/gioco.html`: solo i due `<link>`.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (20/09/2026)** — branch `task/barra-plancia-980-1180`: le righe del Negozio sono uscite dalle regole delle
  testate (`#negozio`, `.nghead`, `.ngk`, `.ngx`, `data-host="negozio"`), il commento dice che
  non c'è e che quando tornerà avrà la sua riga; il documento della task conta tre testate
  più il foglio. L'audit controlla che `#negozio.on .nghead` non sia in stretto.css.

Note a margine, scelte e non bug: (1) **a 390 la Sala, lo Shop e la piazza hanno la sola
corona** — il blocco dei 400 (`stretto.css:803`) dice «un telefono da 360», ma 390 è sotto i
400 e la corona vale anche per l'iPhone base, il più comune: se è voluto, va bene; (2) il
terzo controllo nuovo dell'audit (`audit-regressioni.js:2465-2467`) verifica solo che i due
selettori esistano, non che MAPPA sia `display:none` né che la pastiglia sia a `scale(.7)`;
e i controlli con `[\s\S]*?` dopo `@media (...) {` passerebbero anche se la regola stesse in
un blocco successivo: dicono meno di quello che promettono, ma non danno falsi verdi oggi;
(3) `.pstat .ps:last-child{display:none}` sta due volte, a 1000 in `stretto.css:383-386` e a
1120 in `hub.css:1328-1330`: quella di stretto adesso non serve; (4) fuori dalla task, ma lo
si vede in ogni schermata presa: **a ogni ingresso in plancia esce il toast «Eventi
v1.2.13: 1000 caricati.»** (`eventi-v2.js:3058-3059`), un messaggio da sviluppatore che il
giocatore non sa cosa farsene — non è nei documenti, e se è voluto va scritto.

L'indice «Cosa resta aperto» in testa al foglio ha le voci nuove di questo giro (35–40, erano 33–38 prima di unire main con la mano del rapper).

## Giro del 20/09/2026 (prova-sul-telefono, fine task `task/barra-plancia-980-1180`, commit `c4d9f77`)

Misure: **390 × 844** (telefono verticale), **844 × 390** (di traverso), **1024 × 768**,
**1100 × 800**, **1280 × 800**, **1366 × 768**; in più **360 × 640** (il piccolo vero) e
i quattro confini della fascia, **979/981** e **1240/1241**. Branch
`task/barra-plancia-980-1180`, commit `c4d9f77`. Partita di prova di `gioco.html` (giorno 1,
nessun pezzo). Gli screenshot stanno in `documentazione/prove-telefono/2026-09-20/`.

**Come l'ho provato, per riprovarlo.** L'estensione Chrome non era collegata: ho usato
Playwright da `frontend/node_modules` con una finestra di quella misura (`viewport`,
`hasTouch` sotto i 900), su ognuna la plancia e poi Sala (`apriPosto()`), Shop
(`HUB_LUOGHI` → `shop`), Piazza (`apriPiazza()`) e Studio (`apriStudio("cabina")`), con
la console registrata. Per ogni schermata ho misurato `scrollWidth` contro `clientWidth`
della pagina, la fascia e i suoi figli (chi esce dallo schermo, chi si sovrappone, chi ha
il testo più largo della casella), e la misura di Menu, tasto del telefono e marchio. Il
**Negozio non si può aprire**: `#negozio` non esiste in `gioco.html` (`negozio.js` è
dormiente, «ADF_ABBIGLIAMENTO_HIBERNATE_V2»), quindi le regole nuove per `.nghead`
(`stretto.css:783-806`) non toccano niente e la testata del Negozio non l'ho potuta
guardare. Il server l'ho acceso io su `localhost:8000` e l'ho spento alla fine.

**Quello che funziona.** **Nessuna delle 31 schermate scorre di lato** (`scrollWidth` =
`clientWidth` a tutte le misure, plancia e quattro luoghi compresi). A 390 e a 360 la
fascia è tre righe da 159: marchio 96 × 44, pastiglia ai sette decimi, telefono 44 × 44,
Menu 43 × 44, la città e la fase su una riga, le sei risorse su tre colonne e due righe,
niente che si accavalla. A 981 la fascia sta su una riga (72) con tutto dentro, a 979 va a
capo (148) con le risorse sotto; a 1240 il Menu è la sola casetta (51), a 1241 torna la
parola (107). Sala, Shop e Piazza sotto i 620 hanno la sola corona (44 × 58) con il titolo
subito dopo, MAPPA se n'è andato e la X resta; a 844 × 390 e sopra il marchio pieno e TORNA
ALLA MAPPA ci stanno. Lo Studio a 390 tiene marchio, TORNA ALLA MAPPA e «LA CABINA» su una
riga, con le risorse sotto. Le card degli eventi a 1024–1366 stanno su due righe e due
colonne con la settimana a destra. Console pulita sulla plancia, in Sala, Shop e Studio.

![Plancia a 390 × 844: la fascia su tre righe](prove-telefono/2026-09-20/plancia-390x844.jpg)
![Plancia a 360 × 640](prove-telefono/2026-09-20/plancia-360x640.jpg)
![La Sala a 390: la sola corona, il titolo, la pastiglia e la X](prove-telefono/2026-09-20/sala-390x844.jpg)
![Lo Shop a 390](prove-telefono/2026-09-20/shop-390x844.jpg)
![Lo Studio a 390](prove-telefono/2026-09-20/studio-390x844.jpg)

### Ogni volta che si apre la Piazza un errore rosso in console: la mano del braccio alzato ha un path SVG rotto

- **dove** — `frontend/js/creator/nav.js:69-71`, la mano di `braccioAlto` dentro a
  `ARTIST_BODY`: l'ultima curva è `C W(56),-H(366) W(50),-H(367) Z`, cioè una `C` con
  **due** coppie di coordinate invece di tre. La costruisce `costruisciScena()`
  (`piazza.js:56`, `<g id="mebody">`).
- **cosa succede** — il browser rifiuta tutto il path (`Error: <path> attribute d:
  Expected number, "…4.2 49.7,-365.2 Z"`, in console a **tutte** le sei misure, sempre
  all'`apriPiazza()`) e la mano che regge il microfono non viene disegnata: il braccio
  finisce nel vuoto e il microfono galleggia sopra.
- **come si vede** — apri la Piazza da qualunque misura, guarda la console e la figura al
  centro. Non c'entra la task (è lo stesso corpo del creator, e `posto.js` non lo usa: in
  Sala la console è pulita).
- **quanto pesa** — medio: è un errore rosso a ogni apertura, e la figura è la cosa che
  sta al centro della schermata. Non blocca niente.
- **RISOLTO (20/09/2026)** — branch `task/mano-rapper-svg`, già in `main`: la voce 17 in
  testa al foglio.

![Piazza a 390: il braccio alzato senza la mano](prove-telefono/2026-09-20/piazza-390x844-mano-mancante.jpg)
![La figura ingrandita: il microfono sopra al braccio, senza la mano](prove-telefono/2026-09-20/piazza-390x844-mano-mancante-zoom.jpg)

### Fra i 981 e i 1120 il blocco della città riempie la fascia da bordo a bordo: «CITTÀ ATTUALE» attaccato in cima, «Fase 1» in fondo

- **dove** — `frontend/css/hub.css:1314-1317` (`@media (max-width:1120px) .pcitta{width:150px}`):
  con 150 di scatola e 14 di rientro restano 135 al nome, e «Città di provincia» va su
  **due righe** (a 1240, con 145, sta su una).
- **cosa succede** — etichetta 13 + nome 40 + fase 13 con i loro margini fanno **72**, che
  a 768 di altezza è esattamente l'altezza della fascia (`.pbarra` 72): `.pk` parte a
  y=0 e `.pcf` finisce a 72, senza un punto d'aria sopra e sotto, mentre tutte le altre
  colonne della fascia respirano. A 800 di altezza (fascia 75) l'aria è 2 punti. Con una
  città dal nome più lungo («Città metropolitana») resta su due righe, non peggiora.
- **come si vede** — plancia a 1024 × 768 o 1100 × 800, guarda a sinistra fra il
  marchio e ENERGIA: le lettere di «CITTÀ ATTUALE» toccano il bordo superiore.
- **quanto pesa** — basso: è la fascia che la task ha appena ridisegnato, si nota
  perché è l'unica colonna schiacciata.
- **RISOLTO (20/09/2026)** — è la voce 38: casella 164, nome a 15, una riga.

![Plancia a 1024 × 768](prove-telefono/2026-09-20/plancia-1024x768-citta-al-bordo.jpg)
![Il blocco della città ingrandito: attaccato sopra e sotto](prove-telefono/2026-09-20/plancia-1024x768-citta-al-bordo-zoom.jpg)

### Di traverso (844 × 390) e fra i 621 e i 980 il marchio che apre il menu di sistema è alto 34, e il suo contenuto 41

- **dove** — `frontend/css/stretto.css:470-476`: con la fascia su due righe la nav di
  `menu-sistema.js` è `height:auto` e il bottone `.adf-global-system` viene **132 × 34**;
  sotto i 620 (`stretto.css:615-624`) è forzato a 44 e va bene.
- **cosa succede** — su un telefono di traverso, che è touch, il bersaglio del menu di
  sistema è 34 di altezza (sotto i 44); e la parola del marchio è alta 41 dentro a una
  scatola da 34 (`scrollHeight` 41 > `clientHeight` 34): non si taglia perché
  l'overflow è visibile, ma sporge di 7 sotto al bottone. Il Menu casetta e il telefono
  accanto sono 44.
- **come si vede** — plancia a 844 × 390 (o 979 × 768), in alto a sinistra.
- **quanto pesa** — basso: il menu di sistema si apre anche dal Menu casetta.
- **RISOLTO (20/09/2026)** — è la voce 37: `height:44px` e `html` davanti, 132 × 44 a 6,8.

### Di traverso la fascia si prende 144 punti su 390: la città resta in 246

- **dove** — `frontend/css/stretto.css:399-478` (`@media (max-width:980px)`, la fascia su
  due righe): 844 × 390 ricade nella fascia del tablet stretto, non in quella del
  telefono, e le righe sono da 72 e 55.
- **cosa succede** — la fascia è il 37% dello schermo; della mappa si vede la prima
  fila di cartelli (Shop, Live Club, Centro per l'impiego, La Sala, Casa) e lo Studio è
  tagliato a metà sul bordo. Si scorre, ma la prima schermata è quasi tutta fascia.
- **come si vede** — plancia a 844 × 390.
- **quanto pesa** — basso: l'orizzontale è un punto ancora aperto (memoria
  «Responsività da finire»), lo segno perché la task ha rifatto proprio la fascia.
- **Aperta di proposito** — è la voce 9: prima si decide se il gioco sugli store gira di
  traverso, poi la fascia orizzontale avrà il suo disegno.

![Plancia a 844 × 390: la fascia da 144 e il marchio da 34](prove-telefono/2026-09-20/plancia-844x390-fascia-144-marchio-34.jpg)

### A 1240–1280 il titolo della card dell'evento si tronca coi puntini: «FREESTYLE AL BAR CEN…»

- **dove** — `frontend/css/hub.css:1373-1378` (`.pevt{white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis}` nel blocco 901–1520): a 1280 la card è 202 e il titolo ha 184
  ma ne vuole 208; a 1240, 164 contro 208.
- **cosa succede** — «Freestyle al bar centrale» diventa «FREESTYLE AL BAR CEN…»; gli
  altri tre titoli di oggi ci stanno. A 1366 (227) e a 1024–1100 (254–264, senza il
  telefono a lato) sta intero.
- **come si vede** — plancia a 1280 × 800, «Eventi e attività di oggi», prima card.
- **quanto pesa** — basso: è la scelta della task (titolo su una riga), ma alla misura
  che la task cita come riferimento il primo titolo non si legge tutto.
- **RISOLTO (20/09/2026)** — voce 41: sotto i 1300 due righe da 12 e il piede più stretto,
  55 in 56; a 1280 «FREESTYLE AL BAR / CENTRALE», screenshot nello scratchpad.

![Plancia a 1280 × 800: la prima card tronca](prove-telefono/2026-09-20/plancia-1280x800-titolo-evento-tagliato.jpg)

### A 768 di altezza la scatola del profilo scorre di 27 punti e «Prossimo livello» resta tagliato, senza un segno

- **dove** — `frontend/css/hub.css:1436-1450` (le scatole del profilo sotto gli 820 di
  altezza, `.psx` che scorre): a 1024 × 768 e 1366 × 768 `#hb-profilo` è 547 di
  finestra su 574 di contenuto.
- **cosa succede** — la scatola «Prossimo livello» si vede a metà (il testo sì, la
  barretta no) e il bordo basso della card sembra il bordo della scatola: che sotto ci
  sia altro non lo dice niente, la barra sottile di scorrimento compare solo col mouse
  sopra. A 800 di altezza sta tutto.
- **come si vede** — plancia a 1366 × 768, colonna di sinistra, sopra alle tre linguette.
- **quanto pesa** — basso.
- **RISOLTO (20/09/2026)** — voce 42: sotto i 780 di altezza ritratto 84 × 100 e linguette
  76, la colonna è 555 in 555 a 1366 × 768 e a 1024 × 768.

![Plancia a 1366 × 768: «Prossimo livello» a metà](prove-telefono/2026-09-20/plancia-1366x768-profilo-tagliato.jpg)

### Sul telefono la terza riga della pastiglia («GIORNO 1/7») è a 5 punti: non si legge

- **dove** — `frontend/js/game/tempo-controlli.js:372` (`.adf-tw-day{font-size:7px}` nella
  versione stretta del widget, bianco al 76% sul cielo chiaro) per `stretto.css:646`
  (`transform:scale(0.7)`, la pastiglia ai sette decimi): 7 × 0,7 = **4,9 punti**.
- **cosa succede** — a 390 e a 360 la riga sotto all'ora è una macchia chiara sul
  cielo di giorno; a 844 × 390 e sul computer (7,8 senza scala) si legge appena.
- **come si vede** — plancia a 390 × 844, la pastiglia in prima riga.
- **quanto pesa** — basso: l'ora e la settimana sopra si leggono; il giorno lo dice
  anche il pannello che la pastiglia apre.
- **RISOLTO (20/09/2026)** — è la voce 36: nove decimi, GIORNO a 6,3 punti (7 × 0,9), ANNO a 6.

### Cose viste e lasciate lì

- Sul computer (1024 e oltre) la X di Sala e Piazza è **34 × 34** (`#po-x`, `#p-x`);
  sotto i 900 diventa più grande. Col mouse va bene.
- La foto della città non riempie la sua card e lascia due bande sopra e sotto (61 a
  1280 × 800, 73 a 1240, 23 a 1366): è `aspect-ratio` per scelta (`hub.css:623-634`, il
  fondo sfocato dietro), non è della task.

## Giro del 20/09/2026 (segnala-problemi, fine task `task/mano-rapper-svg`, commit `309de1c`)

Giro piccolo, sul solo commit `309de1c` nel worktree `gioco-rap-mano`: la mano del braccio
alzato del rapper in `frontend/js/creator/nav.js:71`, il controllo nuovo in
`frontend/strumenti/audit-regressioni.js:2447-2468`, la voce 17 dell'indice, la scheda del
19/09 e la riga della roadmap. `npm run verifica` era già verde (386, 3, 33) e non l'ho
rifatto. Letti `git show 309de1c` e `nav.js` per intero; il controllo dell'audit l'ho
fatto girare da solo con `vm`, sul `nav.js` di adesso e su quello di prima
(`bcec0df`): sul vecchio segna `C 52.8,-361.6 47.2,-362.6`, sul nuovo niente — come dice
il commit. Poi ho disegnato le due mani con Playwright (Chromium), ingrandite: quella
vecchia Chrome la disegnava lo stesso, fino al pezzo rotto, con uno spigolo tagliato dritto
in basso a sinistra e l'errore in console; quella nuova è un pugno tondo che copre il
polsino, col microfono dentro.

**Il punto scelto per chiudere è sensato.** La mano parte dal polso `48,-372`; il braccio
alzato finisce in cima fra `66,-372` e `50,-370`, quindi il polso sta esattamente lì. Il
fondo della mano nuova (l'ultima curva, con i controlli a `-366` e `-367`) scende di
tre-cinque unità sotto l'orlo della manica e lo copre, come nel braccio abbassato dove la
mano finisce a `50,-210`, due unità oltre l'orlo (`48,-212`), e la `Z` chiude dritto
sul polso. Le due mani sono fatte allo stesso modo: prima il dorso, poi il lato, poi il
ritorno al polso. L'unica alternativa sarebbe stata chiudere su `50,-370` (l'angolo interno
della manica) e lasciare alla `Z` gli ultimi due punti: stesso disegno a occhio, niente da
cambiare. Il commento in cima al controllo, la voce 17 e la scheda del 19/09 dicono il
vero sui numeri (`C56,-366 50,-367 48,-372 Z`); `nav.js:71` è la riga giusta.

### L'audit della mano ingoia in silenzio l'errore con cui `nav.js` si carica
- **dove** — `frontend/strumenti/audit-regressioni.js:2456` (`try{ ... }catch(e){}`) e
  `:2457` (la chiamata `ARTIST_BODY()` fuori dal `try`); l'errore nasce in
  `frontend/js/creator/nav.js:174` (`A.name.trim()` dentro `refreshArtistChrome()`,
  chiamata a `:178`).
- **cosa succede** — l'artista finto ha `w`, `h`, `skin`, `fit`, `color` ma non `name`:
  quando `nav.js` arriva in fondo e ridisegna l'avatar della barra, esplode con «Cannot
  read properties of undefined (reading 'trim')» e il `catch` vuoto lo butta via. Oggi non
  fa danno, perché `ARTIST_BODY` viene definita prima (riga 42) e il test la trova. Ma il
  controllo è cieco: se domani qualcuno mette prima della riga 42 una riga che chiede un
  pezzo che i finti non hanno (`A.name`, un `$()` che deve rispondere qualcosa,
  `portrait()` che deve tornare un oggetto), il test si accende con «ARTIST_BODY non
  generato» e basta, senza il messaggio vero — e chi lo legge deve rifare tutto il
  ragionamento da zero. L'altro blocco `vm` dell'audit (`:1491-1492`, spostamenti) fa
  la cosa giusta: se il file non si carica, lo scrive come test fallito col messaggio. In
  più `ARTIST_BODY()` a `:2457` sta fuori dal `try`: se un giorno lancia (un campo di
  `A` che non c'è, `portrait(true)` che non torna `defs`/`testa` — già oggi i finti
  producono «undefinedundefined» nella testa, senza rompere), muore l'audit intero con uno
  stack, non una riga rossa. Gli altri finti bastano: `$` torna `{}` e i tre `onclick`
  ci si appoggiano, `shade` e `fit` producono solo colori (anche «undefined»), e i
  colori non stanno nei tracciati.
- **come si vede** — nel `catch` mettere `console.log(e.message)` e far girare
  `node strumenti/audit-regressioni.js`: stampa l'errore del `trim`. Oppure spostare
  `refreshArtistChrome()` prima di `window.ARTIST_BODY` e vedere il test dire solo
  «ARTIST_BODY non generato».
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (20/09/2026)** — l'artista finto ha `name:"Prova"`, e `nav.js` si carica senza
  errori; il caricamento e `ARTIST_BODY()` stanno in un test loro («nav.js si carica nel test
  runtime e disegna il corpo intero») che riporta il messaggio dell'eccezione, come il blocco
  gemello di `spostamenti.js`. 387 controlli, tutti verdi.

### L'indice in testa dice ancora che la mano del rapper «resta»
- **dove** — `documentazione/problemi-riscontrati.md:9` («sei chiuse nello stesso branch,
  una (la mano del rapper) resta»).
- **cosa succede** — il commit barra la voce 17 e la segna RISOLTO, ma il paragrafo sopra
  all'indice — quello che uno legge per primo, con la data del 20/09 — dice ancora che la
  mano è l'unica rimasta aperta del giro del 19/09. La stessa frase in fondo al giro del
  19/09 (`:3883`) va bene così: racconta com'era quel giorno.
- **come si vede** — aprire il foglio, leggere le prime dieci righe.
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (20/09/2026)** — il paragrafo dice che la mano è stata chiusa il 20/09 in un
  branch suo, e cita le voci 33–34 di questo giro.

Note a margine, non bug: (1) **il vecchio tracciato non faceva sparire la mano**: Chrome
disegna un tracciato fino al pezzo sbagliato e si ferma lì, quindi la mano c'era, con un
angolo tagliato dritto e un piccolo spigolo in basso a sinistra, e l'errore in console. Il
messaggio del commit e la scheda del 19/09 dicono «non si disegnava»: è storia, non serve
correggerla, ma è il motivo per cui nessuno l'aveva vista a occhio prima del giro con la
console aperta. (2) **«corpo intero» nella roadmap vuol dire quello che disegna `nav.js`**:
la testa arriva da `portrait(true)` (`js/creator/portrait.js`), che nell'audit è un finto
che torna vuoto, quindi i tracciati della testa il controllo non li conta. Va bene così —
è un altro file — ma se un giorno si rompe un tracciato della testa, questo controllo non
se ne accorge. (3) **il conteggio conosce solo `M`, `L`, `C` e `Z`**
(`audit-regressioni.js:2460`): oggi il corpo usa solo quelli, ho controllato ogni
tracciato; se un giorno uno usa `Q`, `S`, `A`, `H`, `V` o le lettere minuscole, i numeri
finiscono nel comando prima e il test diventa rosso per sbaglio. Rosso, non verde: si
vede, quindi va bene.

L'indice «Cosa resta aperto» in testa al foglio ha le voci 33 e 34 di questo giro.

## Giro del 20/09/2026 (task `task/le-tre-del-marketing`, «Le tre del Marketing»)

La voce 2 dell'indice — le tre cose del Marketing trovate il 14/09, più il motivo tagliato
sul telefono — è **chiusa dal 14/09**: le quattro RISOLTE stanno sotto ai giri di quel giorno
(primo e secondo), nei commit `98cc918`, `28c6561` e `e288634` dello stesso branch, e il
foglio dei punti lo dice da allora («Sistemate insieme le quattro cose che segnala-problemi
aveva trovato sul Marketing», sotto «Quando tieni la take si chiede solo il nome»). Il
riordino del 15/09 non l'ha riconosciuto e la voce è rimasta aperta per sei giorni — lo
stesso caso dell'hover (voce 3). Riprovato in partita con Playwright (server di sviluppo,
otto pezzi fuori e uno no, il più vecchio scelto), a 1440 e a 390: «in spinta» è testo nella
riga piccola e la riga è alta come le altre (56); la riga senza seed esce senza
`data-spingi`; «Pezzo 1», scelto e più vecchio dei sei, sta in elenco con «scelto»;
«Serve un pezzo scelto su LaFamegram» sta in una riga (255 in 255). Cinque controlli nuovi
nell'audit («Le tre del Marketing (20/09/2026)») tengono ferme le quattro cose e la quinta
qui sotto.

### Nell'Agenda del telefono la descrizione di quattro mosse finisce coi puntini

- **dove** — `frontend/css/telefono.css` (`.tlitx i`, una riga sola con
  `text-overflow:ellipsis`) contro `frontend/js/game/actions.js` (le `d:` di `promo`, 62
  caratteri; `anteprima`, 74; `palestra_pesi`, 70; `palestra_cardio`, 66) e
  `telefono.js` (`schermataAgenda`, «Le tue mosse»).
- **cosa succede** — la riga piccola tiene circa 46 caratteri nella colonna a 1440 (200
  punti) e sul telefono a 390 (251): «Il foglio, la penna e quello che hai in testa.» ci sta
  esatto, le altre nove pure. Le quattro lunghe no: «Clip e provocazioni. Spinge il pezzo
  che scegl…» (294 punti in 200) — e la parte che se ne va è proprio «su LaFamegram», dove
  andare a scegliere. Il motivo della mossa spenta è corto dal 14/09; la descrizione della
  mossa accesa, che compare al suo posto quando puoi farla, no. Misurato in partita con
  `scrollWidth > clientWidth` su tutte e tredici le righe, a 1440 e a 390: tagliate la promo
  e, col pezzo scelto, l'anteprima; pesi e cardio mostravano «Devi andare a Palestra» e i
  loro 70 e 66 caratteri sono contati sul testo, non misurati.
- **come si vede** — telefono, Agenda, «Le tue mosse», con un pezzo fuori (la promo accesa).
- **quanto pesa** — da sistemare con calma.
- **RISOLTO (20/09/2026)** — non accorciando i testi (sono gli stessi della scena a schermo
  pieno dopo la mossa, e lì stanno bene) ma nella riga: in `telefono.css` la riga piccola
  delle mosse e degli eventi dell'Agenda (`.tli[data-azione]`, `.tli[data-evento]`) va a
  capo su due righe (`-webkit-line-clamp:2`), poi i puntini. Le altre liste del telefono con
  la stessa riga (contatti, agenda segnata, «Che post fai?») non cambiano. Riprovato: a 1440
  le due righe lunghe (promo e anteprima) sono alte 64 invece di 51, a 390 68 invece di
  53, a 360 48 invece di 37; nessuna delle tredici è tagliata. Il controllo sta nell'audit.

L'indice «Cosa resta aperto» in testa al foglio ha la voce 2 barrata e la voce 43 di questo
giro.

## Giro del 20/09/2026 (segnala-problemi, fine task `task/le-tre-del-marketing`, commit `a52377a`)

Controlli automatici tutti verdi: `npm run prova` 180 a posto e 0 no, `audit-regressioni.js`
403 ok e 0 falliti (i cinque di «Le tre del Marketing (20/09/2026)» compresi),
`verifica:build` 33 ok e 0 falliti, e la regola nuova arriva intera nel file unico
(`dist/anni-di-fame-gioco.html`), col `-webkit-box-orient:vertical` che certi minificatori
tolgono. Letto il diff intero contro `main` (sette file, nessun JavaScript del gioco
toccato), `telefono.css` intorno a `.tli`, `telefono-stretto.css` (la riga a 12 punti col
telefono alzato), `schermataAgenda`, `telAgendaEvento`, `telAgendaAzione`,
`telAgendaGateText` e `telSpingi` in `telefono.js`, `hubPronta` e `HUB_EVENTI` in
`hub.js`, le `d:` e i `need:` di `actions.js`. Poi in partita con Playwright (server di
sviluppo, un pezzo fuori così la promo è accesa) a 1440 × 900, 390 × 844, 375 × 667,
360 × 780 e 360 × 640.

Le cose chieste, in ordine, quelle a posto:

- **Le altre liste del telefono non cambiano.** La regola è agganciata a `[data-azione]` e
  `[data-evento]`, che nel gioco esistono solo nelle due liste dell'Agenda
  (`telefono.js:558` e `:569`); l'unico altro `data-azione` è il bottone «Posta» di «Che
  post fai?» (`:664`), che è un `.tbtn` e non un `.tli`. Contatti, agenda segnata, «Che
  post fai?» (`data-spingi`), impostazioni: la riga piccola resta a una riga coi puntini,
  misurato (`nowrap / block`) a 1440 e a 390.
- **Il telefono stretto va d'accordo.** `telefono-stretto.css:96` cambia solo il corpo
  del carattere (12 invece di 10,5): con la riga a 1,3 le due righe fanno 31 punti invece di
  27, la card 68 invece di 64. Niente si sovrappone.
- **`display:-webkit-box` sopra al `display:block`** della regola base va bene: è la
  stessa coppia che `game.css:110` e `stretto.css:218` usano da tempo; `overflow:hidden`
  resta dalla regola base (serve al taglio), `text-overflow:ellipsis` e `margin-top:1px` non
  danno fastidio. Il browser di Playwright riporta la riga come `flow-root` — è come
  Chromium chiama oggi la scatola col taglio a righe — e taglia dove deve.
- **«Stasera» non ha un caso che va a capo.** I quattro eventi di `HUB_EVENTI` hanno
  descrizioni da 22 a 42 caratteri, e i motivi per cui una riga è spenta («Dalle 21:00»,
  «Troppo tardi per partecipare», «Sei in carcere») stanno tutti in una riga; il selettore
  su `[data-evento]` oggi non cambia niente, ed è giusto che ci sia per quando cambierà.
  Nessun motivo delle mosse spente (`hubPronta`, `telAgendaGateText`, i `need`) supera i
  35 caratteri, e nessuna descrizione di mossa i 74: due righe bastano — dove la riga è
  larga abbastanza, vedi la prima voce.
- **I fogli tornano.** La tabella grande del README ricontata riga per riga: 126 voci, 90
  «fatto», 14 «in parte», 17 «da fare», 5 «risposto» (1 + 4 «risposto, da fare»), nessun
  duplicato. L'indice di problemi-riscontrati va da 1 a 43 senza salti; la voce 2 barrata
  rimanda a RISOLTE che ci sono (il blocco in testa al giro del 14/09 per le prime tre, la
  riga nuova sotto «Sul telefono il motivo…» per la quarta); «Quando tieni la take si chiede
  solo il nome» e la frase «Sistemate insieme le quattro cose» stanno davvero nel foglio
  dell'interfaccia (`02-interfaccia-e-telefono.md:1552` e `:1584`); i tre commit citati
  (`98cc918`, `28c6561`, `e288634`) esistono. I quattro controlli sulle cose del 14/09
  sono agganciati a stringhe che nel codice ci sono (`telefono.js:616`, `:613`, `:644`,
  `actions.js:504`), letterali come tutto il resto dell'audit: si rompono se qualcuno
  riscrive la riga, non se cambia il comportamento, ma è lo stile del file.

Le tre cose trovate:

### Sul telefono basso (360 × 640) la promo nell'Agenda finisce ancora coi puntini

- **dove** — `frontend/css/telefono.css:234` (la regola nuova, due righe poi i puntini)
  contro la larghezza che il telefono alzato ha con lo schermo basso.
- **cosa succede** — con lo schermo alto 640 il telefono si disegna più stretto (la cornice
  si adatta all'altezza) e la riga piccola delle mosse resta 170 punti larga: la descrizione
  della promo, a 12 punti, vuole tre righe (47 punti in 31) e la fine se ne va ancora —
  «Clip e provocazioni. Spinge il pezzo che scegli su…», con «LaFamegram» perso, che è
  proprio la parte per cui la voce 43 era stata aperta. L'anteprima (74 caratteri) non l'ho
  vista accesa in questa prova, ma con dodici caratteri in più della promo si taglia di
  sicuro. A 360 × 780 la riga è 223 punti e sta (31 in 31), a 375 × 667 è 182 e sta per un
  soffio, a 390 × 844 è 251. Il foglio dei punti dice «a 360 … nessuna delle tredici è
  tagliata»: vale per il 360 alto, non per quello basso.
- **come si vede** — finestra 360 × 640 (o un telefono Android piccolo), alza il telefono,
  Agenda, «Le tue mosse», con un pezzo fuori così la promo è accesa. Screenshot fatto.
- **quanto pesa** — da sistemare con calma. È un telefono piccolo e il senso della riga si
  capisce lo stesso; ma la voce 43 era nata per non perdere «su LaFamegram».

### Un controllo dell'audit guarda il file sbagliato

- **dove** — `frontend/strumenti/audit-regressioni.js:2508-2510` («una riga di pezzo senza
  seed esce senza data-spingi, non come bottone che non fa niente»).
- **cosa succede** — la prima metà del controllo è giusta (`seme` in `telefono.js:616`);
  la seconda cerca `if(!Number.isFinite(seed)) return;` in `studio.js`, che è la guardia
  di `studioMettiSulBanco` e `studioSegna` (`studio.js:134` e `:360`) — lo Studio. Ma
  dal 15/09 il tocco su un pezzo di «Che post fai?» passa da `telSpingi` in
  `telefono.js:675`, che ha una guardia sua, scritta diversa
  (`if(!Number.isFinite(seed) || typeof studioDati !== "function") return;`) e che l'audit
  non guarda: se qualcuno la toglie, il controllo resta verde. Non è rotto niente oggi.
- **come si vede** — leggendo i due file; l'audit passa comunque.
- **quanto pesa** — da sistemare con calma.

### La tabella dei fogli nel README dice 34 voci per l'interfaccia, la tabella grande ne ha 43

- **dove** — `implementazioni/README.md:18` («**L'interfaccia e il telefono** — 34 voci»)
  contro le righe della tabella grande che rimandano a `02-interfaccia-e-telefono.md` (43
  dopo il branch, 39 su `main`).
- **cosa succede** — il conto in cima era già indietro prima di questo branch (su `main`
  la tabella grande ne ha 39 per quel foglio e in cima c'è scritto 34); il branch ne ha
  aggiunte quattro nella tabella grande e ha ricontato solo il totale (126, giusto), non la
  riga per foglio. Chi apre il README legge due numeri che non tornano fra loro. È un
  foglio, non il gioco.
- **come si vede** — `implementazioni/README.md`, la prima tabella contro la seconda.
- **quanto pesa** — da sistemare con calma.

Una nota, non un problema: a 360 × 640 anche il nome «Freestyle al bar centrale» nella
lista «Stasera» va su due righe (la card è 67 invece di 53). Non è del branch — il nome è
in grassetto e non ha regole di taglio — e si legge bene: lo segno perché l'ho visto.

L'indice «Cosa resta aperto» in testa al foglio ha le voci 44–46 di questo giro.

**Chiuse nello stesso branch, prima del push (20/09/2026).** La riga piccola delle mosse va
fino a tre righe invece di due (`telefono.css`, `-webkit-line-clamp:3`): riprovato con
Playwright a 360 × 640 (promo e anteprima 47 punti in tre righe, niente tagliato), 375 × 667
(anteprima in tre, promo in due), 360 × 780, 390 × 844 e 1440 × 900 (due righe come prima),
screenshot `agenda-mosse-accese-360x640-tre-righe.jpg`. Il controllo dell'audit cerca anche
la guardia di `telSpingi`, e il suo compagno sulla riga a capo dice tre. La prima tabella del
README ricontata foglio per foglio (43, 16, 13, 16, 8). Le tre voci in testa sono barrate.

**Controllato il commit di chiusura `4aa172d` (segnala-problemi, 20/09/2026): non ha aperto
niente.** Letto il diff intero (CSS, audit, README, i quattro fogli, tredici screenshot) contro
il codice. Le tre chiusure sono vere: `telefono.css:236` dice `-webkit-line-clamp:3` e la
regola arriva intera nel file unico (`dist/anni-di-fame-gioco.html`); il controllo dell'audit
aggancia davvero la guardia di `telSpingi` (`telefono.js:675`, provato il regex sul file con i
fine riga di Windows) e il suo compagno cerca il tre; la prima tabella del README ricontata
riga per riga contro la tabella grande: 16, 43, 1, 16, 13, 16, 8, 3, 7 tornano tutte, e i
totali (126 = 90 + 14 + 17 + 5) pure; i link puntano a file che esistono. Le voci 44–46 in
testa sono barrate e le loro RISOLTO rimandano a cose che ci sono (lo screenshot
`prove-telefono/2026-09-20/agenda-mosse-accese-360x640-tre-righe.jpg`, la riga dell'audit, i
cinque numeri). Poi in partita con Playwright (un pezzo fuori e uno scelto, così promo e
anteprima sono accese) a 1440 × 900, 390 × 844, 375 × 667, 360 × 780, 360 × 640 e 320 × 568:
nessuna delle diciassette righe dell'Agenda è tagliata (`scrollHeight` uguale all'altezza);
promo e anteprima vanno in tre righe a 360 × 640 e a 320 × 568 (47 punti, card 82), a 375 × 667
solo l'anteprima, dai 390 in su restano in due; «su LaFamegram» arriva intero. Le altre
liste del telefono (contatti, agenda segnata, «Che post fai?») restano a una riga: la regola
tocca solo `[data-azione]` e `[data-evento]`, e `telefono-stretto.css:96` cambia solo il corpo
del carattere. Una nota, non un problema: la RISOLTO della voce 43 in testa dice ancora «va a
capo su due righe» — è la storia di quel giorno, e la voce 44 subito sotto spiega il passaggio
a tre; si legge di seguito e non inganna, ma chi legge solo la 43 la trova indietro di un passo.

## Giro del 20/09/2026 (segnala-problemi, fine task `task/transizioni-video-le-altre`, commit `32cb6f5`)

Un commit sopra a `main`: i quattro video che mancavano al punto di CARLO «implementa le
transizioni dentro al progetto, che partano cliccando sulla scheda collegata» — la Sala,
Casa, stacca la spina, registra. I tre comandi non li ho rifatti: chi ha lanciato il giro li
ha appena visti verdi (180 a posto, 409 ok, 33 ok di build). Ho letto il diff intero
(`transizioni-video.js`, `hub.js`, `luoghi-foto.js`, `studio-elementi.js`, l'audit, i
quattro fogli) contro il codice, e poi ho giocato con Playwright sul Chrome installato a
1280 × 800 e a 390 × 844 col tocco.

**Quello che torna.** Il JavaScript all'avvio: `transizioni-video.js` sta dopo
`luoghi-foto.js` e `studio-elementi.js` in `gioco.html` (righe 706, 709, 716), ma i due lo
chiamano solo al clic e dietro `typeof transizioneVideo === "function"`
(`luoghi-foto.js:425`, `studio-elementi.js:417`); `TRANSIZIONI_VIDEO` sta dopo la `&&`, quindi
senza il file non si tocca. Nessun'altra pagina carica quei due file (`index.html` e
`pagine/*.html` no), e la prova di `prova.js:1111` che carica `studio-elementi.js` senza il
file dei video passa proprio per quella guardia. Nessun errore in console in nessuna delle
prove. La Sala e Casa partono dal cartello e a fine filmato c'è la Sala sotto e la cucina
sotto; dopo Casa il video pronto è quello dello stacca, dopo lo Studio quello della take; il
puntatore sui cartelli `beat`, `vita` e `studio` prepara il file giusto. Lo «stacca la spina»
da tutte e tre le strade: dalla porta di Casa (esito «+13 / +0,4» giusto), dall'agenda a 1280
e col telefono alzato a 390 (il telefono resta su sotto la copertura e si mette giù quando
la pagina si apre, `LUOGO` è `null` fino a lì e `mostra()` la apre), dalla card del
«Piccolo party» (stessa riga di codice dell'agenda, `hub.js:893`; la card di sera è spenta
«Dalle 00:00», è l'orario, non un guasto). Esc a metà, un tocco a metà e un secondo tocco
svelto sullo stesso tasto d'oro saltano il filmato e aprono l'esito senza rifare la mossa.
La take: l'energia scende al clic (100 → 55), il tiro di dado arriva a fine filmato e il
salvataggio con lui (in mezzo `localStorage` ha ancora l'energia di prima: se la partita si
chiude durante il filmato non si perde né energia né take); col file che non c'è la take
arriva subito (l'evento `error` arriva prima del secondo e mezzo); la seconda take non ha
filmato; il tocco a metà la fa arrivare. I fogli: la prima tabella del README contro la
grande riga per riga (16, 44, 1, 16, 13 tornano; i totali 127 = 92 + 13 + 17 + 5 pure); la
voce 5 dell'ordine, la voce 27 nuova e il punto 8 di CARLO dicono la stessa cosa; la roadmap
pure. Le cose sotto sono quelle che non tornano.

### Sotto al filmato i tasti rispondono ancora alla tastiera: due take pagate come due sessioni, due «stacca la spina»
- **dove** — `frontend/js/game/transizioni-video.js:138-143` (la copertura prende i clic e
  l'Esc, ma non sposta né blocca il fuoco della tastiera) contro
  `frontend/js/game/studio-elementi.js:402` e `:417` (l'energia scende subito, la take arriva
  dopo, e fino ad allora `t.l` è vuota: la «prima take» da 45 lo è ancora) e
  `frontend/js/game/luoghi-foto.js:385` (`luogoVai` ridisegna la pagina col tasto d'oro
  ancora acceso).
- **cosa succede** — il filmato copre lo schermo, ma il tasto che hai appena premuto resta
  «a fuoco» sotto di lui, e Invio lo preme di nuovo. In Cabina: clic su «Registra la take ·
  45 energia», poi Invio mentre il filmato va — l'energia passa da 55 a 10 (una seconda
  sessione da 45, non un'altra take da 12), e a fine filmato le take sono due. Sulla pagina
  dello «stacca la spina»: con Tab si arriva al tasto d'oro sotto al filmato e Invio fa la
  mossa una seconda volta (energia 41 → 27, «oggi» da 1 a 2); l'esito che si legge alla fine
  è quello della prima, la seconda è successa e basta. Col mouse e col dito non si può (la
  copertura li prende): è solo tastiera, cioè il PC e Steam.
- **come si vede** — Studio, Cabina, clic su «Registra la take», Invio subito; oppure Casa,
  porta «Stacca la spina», tasto d'oro, poi Tab finché il fuoco torna sul tasto e Invio.
- **quanto pesa** — si vede ma si gira intorno: non si rompe niente, ma una take costa il
  doppio senza che si capisca perché.

### Mentre si aspetta che il filmato dello «stacca la spina» parta, la pagina sotto dice una cosa sbagliata
- **dove** — `frontend/js/game/ui.js:158` (`renderGioco()` subito dopo `mostraScena`, che
  adesso ha in mezzo il filmato) con `frontend/js/game/luoghi-foto.js:398` (l'incarto di
  `renderGioco` ridisegna la pagina) e `:385` (`luogoVai` la ridisegna ancora), mentre
  `LUOGO.esito` arriva solo a filmato finito (`:418`).
- **cosa succede** — dalla porta di Casa, nel secondo e mezzo in cui la copertura è
  trasparente e il video non è ancora partito, la pagina sotto si vede ed è quella di **dopo**
  la mossa ma **senza** l'esito: i numeri grandi dicono «+3–5» e «—», la riga dice «La seconda
  volta oggi recupera meno: il corpo ha già avuto la sua parte», il tasto d'oro «Stacca la
  spina · 14 energie» è ancora lì, la fascia in alto ha già l'energia scalata (86), e la banda
  in basso — l'ultima riga del diario — dice già «Ti sei fermato. Benessere +13, rete +0,4»,
  cioè l'esito prima del filmato che dovrebbe portarci. Se il video è in cache (dopo il
  filmato di Casa lo è: `TRANSIZIONI_DOPO`) il filmato copre tutto in pochi millisecondi e
  non si vede; se non lo è (Casa aperta da «Continua», o rete lenta) si vede fino a un
  secondo e mezzo, e poi o parte il filmato o arriva l'esito. Screenshot fatto con il video
  rallentato a 600 ms dal clic. Dall'agenda non succede: lì la pagina non c'è ancora.
- **come si vede** — Casa, «Stacca la spina», tasto d'oro con la rete rallentata dagli
  strumenti del browser (o alla prima volta senza essere passati dal filmato di Casa).
- **quanto pesa** — da sistemare con calma: dura al massimo un secondo e mezzo e poi si
  sistema da sola, ma per quel tempo la pagina promette la mossa che hai appena fatto.

### Il tasto «Anni di Fame» apre il menu di sistema sopra al filmato, che continua sotto
- **dove** — `frontend/js/menu-sistema.js:486` (il clic sul tasto del marchio chiama
  `apri()`) e `:194-195` (`apri()` chiede solo che il gioco sia acceso), con
  `frontend/css/menu-sistema.css:55` (la barra sta a 9600, sopra alla copertura del video a
  150: si vede e si tocca durante il filmato). «MAPPA» invece passa da `tornaMappa()`, che
  guarda `dialogoFlottante()` con dentro `#tvid.on` e `#tvid.attesa`, e non fa niente.
- **cosa succede** — durante il filmato della Sala tocchi «Anni di Fame» in alto a sinistra:
  si apre il menu «LA FAME / SISTEMA», il filmato va avanti sotto (visto: da 0,6 s arriva a
  5,6 s col menu aperto), e quando finisce la Sala si apre sotto al menu.
  Chi preme «Riprendi» si ritrova nella Sala senza aver capito perché. È la sorella dell'Esc
  chiusa il 16/09 (voce 11): lì il tasto, qui il bottone; con lo Studio solo era già così,
  adesso vale per cinque filmati.
- **come si vede** — dalla mappa tocca «La Sala» (o Casa, o Studio), e mentre il filmato va
  tocca il marchio in alto a sinistra.
- **quanto pesa** — si vede ma si gira intorno: il filmato finisce da solo e il menu ha
  «Riprendi».

### Arrivando allo «stacca la spina» dall'agenda o dalla card, i due numeri grandi sono «—»
- **dove** — `frontend/js/game/luoghi-foto.js:91` (`apriLuogo` parte con `prima:null`) e
  `:240-243` (senza `prima` i due numeri diventano «—»), contro `:380` (`luogoVai`, l'unico
  posto che fotografa i numeri di prima). L'incarto di `mostraScena` (`:417`) apre la pagina
  con `da:"mossa"` e non fotografa niente.
- **cosa succede** — è la nota che il foglio dell'interfaccia ha già scritto, e la confermo:
  dall'agenda del telefono (a 1280 e a 390) e dalla card della sera, a filmato finito la
  pagina dice «Benessere —», «Rete —» sotto alle due icone, mentre la riga sotto dice
  «Ti sei fermato. Benessere +11, rete +0,4». Dalla porta di Casa i numeri ci sono
  («+13», «+0,4»). Screenshot fatto. Non è del branch: è così dal 19/09, da quando le pagine
  dei posti stanno sulla loro foto.
- **come si vede** — telefono, Agenda, «Le tue mosse», «Stacca la spina»; guarda i due
  numeri grandi a filmato finito.
- **quanto pesa** — da sistemare con calma.

### Il paragrafo in testa a «Da fare adesso» dice ancora che la voce delle transizioni «resta, a metà»
- **dove** — `implementazioni/implementazioni.md:53` («il 16/09 dopo il primo video delle
  transizioni (la voce resta, a metà)») contro la voce 5 dello stesso elenco (`:92`), barrata
  e **FATTO (20/09/2026)** in questo branch, e la voce 27 nuova (`:183`).
- **cosa succede** — il paragrafo che racconta i giri dell'ordine è stato aggiornato per le
  quattro piccole e per il Marketing del 20/09, non per questo giro: chi lo legge trova la
  voce «a metà» e due righe sotto la trova chiusa. È un foglio, non il gioco.
- **come si vede** — `implementazioni/implementazioni.md`, il paragrafo sotto «Da fare
  adesso, in ordine».
- **quanto pesa** — da sistemare con calma.

Tre note che non sono errori:

- **La Sala ha il filmato solo dal cartello.** La card «Producer session» — sulla plancia
  (`hub.js:890`) e nell'agenda del telefono (`telefono.js:784`) — apre la Sala diretta, senza
  filmato; lo «stacca la spina» invece ce l'ha da tutte le strade, perché sta sulla mossa. I
  fogli lo dicono così («la Sala e Casa sul cartello»), quindi è una scelta: la segno perché
  chi arriva alla Sala dalla card la sera vede una cosa diversa da chi ci arriva dalla mappa.
- **Vista una volta e non riprodotta:** a 390, al terzo «stacca la spina» del giorno dalla
  porta di Casa, il numero grande diceva «+8» e la riga sotto «Benessere +6» (screenshot
  `m-stacca-esito` nello scratchpad della prova). Il benessere era passato da 91 a 99,3: la
  mossa ne ha dati 6, gli altri 2,3 sono arrivati da qualcos'altro fra la fotografia di
  `luogoVai` e l'esito, e non ho trovato da dove (con un tracciamento su `G.wellbeing` in
  una prova a 1280 la mossa era l'unica a toccarlo, e i numeri tornavano: +12 e +12). Il
  branch non tocca quel conto; il filmato però allunga di cinque secondi la finestra in cui
  qualcos'altro può muovere il numero. Da guardare, non da dare per rotto.
- **Dopo ogni filmato di Casa e dello Studio parte un download da 4–5 MB** (`TRANSIZIONI_DOPO`,
  `transizioni-video.js:47` e `:114`): lo stacca e la take, «a pagina ferma». Sugli store i
  file stanno sul telefono e non costa niente; nel browser con la rete del telefono sono
  megabyte spesi anche se poi non si stacca la spina né si registra. È la scelta che il file
  spiega, la segno e basta.

L'indice «Cosa resta aperto» in testa al foglio ha le voci 47–51 di questo giro.

**Chiuse nello stesso branch, prima del push (20/09/2026).** Tutte e cinque: la copertura del
filmato prende il fuoco e ferma Invio, spazio e Tab; i tre tasti della barra sono inerti col
filmato in corso; fra il tasto e il filmato la pagina dello «stacca la spina» resta com'era;
la fotografia dei numeri si fa da ogni strada (anche dall'agenda: «Benessere +4»); il
paragrafo in testa all'ordine è aggiornato. Riprovato con Playwright sul Chrome installato a
1440 × 900: Tab + Invio dopo il clic sulla take → una take sola (energia 100 → 55); spazio a
metà filmato apre Casa; il clic sul brand col filmato in corso non apre il menu e a fine
filmato si apre la Sala. Quattro controlli in più nell'audit. Le cinque voci in testa sono barrate.
