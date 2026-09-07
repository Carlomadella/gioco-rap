# Come si lavora

Le regole di lavoro, che valgono per tutti e per tutto. Sono le prime righe che stavano in
cima al vecchio `implementazioni.md`, tenute qui perché non si perdano in mezzo ai punti.

---

## La regola di partenza (parole di Carletto)

> quando finisci una task committa e pusha e nel committ fai riferimento al punto del file
> completato. Se vedi che viene modificato il file non preoccuparti, sono io, tu continua
> con quello che stai facendo, ogni volta che finisci un task segnalo come completato

---

## Come sono organizzati i punti

Era un file solo, ed era diventato lungo come un libro: mille righe in cui per ritrovare
una cosa bisognava sapere già dov'era. Adesso è una cartella, **un file per argomento**, e
l'indice sta in [`README.md`](README.md).

**I punti nuovi si scrivono in [`implementazioni.md`](implementazioni.md)**, qui dentro, che è
rimasto lì apposta: è il foglio dove si butta l'idea appena viene, senza pensare a dove va.
Quando un punto è chiuso — o anche solo quando si capisce di che argomento è — si sposta
nel file giusto, con dentro scritto **cosa è stato fatto e quando**.

Perché sia questo il verso e non il contrario: chi ha l'idea non deve fermarsi a decidere
in quale file va. Quello è lavoro di dopo, e lo fa chi mette a posto.

## Come si segna un punto chiuso

Sotto al punto, indentato, una riga che dice cosa è stato fatto:

```
   **FATTO (01/09/2026)** — cosa c'è adesso, in una frase.
   - i dettagli che servono a chi ci torna fra un mese
   - e i file toccati, se aiutano
```

Se è fatto a metà si scrive **FATTO in parte** e cosa manca. Se non è stato fatto ma se
n'è discusso, si scrive **RISPOSTA** e il ragionamento: serve a non rifare due volte la
stessa discussione fra tre settimane.

Vale la pena scriverlo bene: sette punti di questa cartella risultavano chiusi solo dai
messaggi dei commit, e nessuno se lo ricordava più. Adesso hanno una riga che lo dice, ma
è roba recuperata dalla storia di git — meglio non doverlo rifare.

## Le dipendenze

**Si possono usare.** Il principio «zero dipendenze» è caduto il 07/09/2026. La regola che
c'è al suo posto, il prezzo che si paga e **il registro di quello che è installato** stanno
in [`../documentazione/dipendenze.md`](../documentazione/dipendenze.md); il ragionamento per
esteso e l'elenco di tutto quello che si potrebbe installare stanno nel punto «togli il
principio zero-dipendenze» di [`implementazioni.md`](implementazioni.md). In breve:

> Ognuna si sceglie, si motiva in una riga e si può togliere.

Prima di installare, cinque domande:

1. **entra nel gioco o resta fuori?** Negli strumenti la soglia è bassa, dentro a
   `gioco-*.js` si misura il peso col build, prima e dopo;
2. **la cosa che fa è difficile, e la difficoltà è di qualcun altro?** (crittografia,
   protocolli, immagini, audio: sì; cinque funzioni di comodo: no);
3. **quanti pacchetti si porta dietro?** — `npm ls --all`, l'albero, non la scheda;
4. **si può togliere in un giorno?** Ogni dipendenza sta dietro a un file nostro;
5. **è viva, e la licenza regge in un gioco venduto?** MIT/Apache/BSD sì, GPL/AGPL no.

E il prezzo, che si paga sempre: lockfile committato e `npm ci` in CI, una dipendenza per
commit col perché nel messaggio, `npm audit` nella verifica, aggiornamenti automatici
accesi, e una riga nel registro delle dipendenze. Se quella riga non si riesce a scrivere,
quella dipendenza non doveva entrare.

## Dove sta il resto

| documento | cosa c'è dentro |
| --- | --- |
| [`../README.md`](../README.md) | la mappa del progetto: le due metà, come si avviano |
| [`../ROADMAP.md`](../ROADMAP.md) | il disegno d'insieme, le fasi, dove sta andando il gioco |
| [`../frontend/README.md`](../frontend/README.md) | il gioco: struttura, build, i lavori per gli store |
| [`../backend/README.md`](../backend/README.md) | il server: rotte, manopole, quanto regge |
| `../backend.md` | il quaderno di bordo del server (fuori da git) |
| [`../documentazione/stili-interfaccia.md`](../documentazione/stili-interfaccia.md) | il riferimento visivo |
| [`../documentazione/dipendenze.md`](../documentazione/dipendenze.md) | la regola per sceglierle e il registro di quelle installate |

---

## 49 · Un file coi comandi del terminale

49. Creami il file comandidelterminale.md in cui scrivi tutti i comandi da lanciare nel terminale per essere sempre aggiornati a vicenda con carletto e per fare partire il frontend e backend

   **FATTO (01/09/2026).** `documentazione/comandidelterminale.md` (stava in radice
   fino al punto 7): git
   (status/pull/push e cosa fare se il push viene rifiutato), i quattro
   comandi del frontend (dev/build/demo/prova), i cinque del backend
   (start/prova/postman/copia/travaso), come farli girare insieme in due terminali,
   e i problemi comuni (porta occupata, Node troppo vecchio).

---

## 56 · Restare sempre aggiornati col repo

56. Assicurati sempre di essere aggiornato col mio github e quello di carletto.

    **FATTO (01/09/2026)** — è già la regola fissa di ogni sessione (vedi sopra): `git fetch` e verifica
    prima di lavorare, e prima di ogni push. In questa sessione è arrivato un push di Carletto proprio
    a metà lavoro (il ridisegno della plancia, punto sotto); niente da fare oltre a continuare a farlo
    a ogni giro, cosa già in corso.

---


---

## 7 · I file .md in cartelle con nomi coerenti

> **FATTO (06/09/2026)** — branch `task/7-8-9-md-agenda-eventi`.
>
> In radice c'erano nove `.md` uno accanto all'altro: la roadmap, i comandi del
> terminale, due file di prompt, i riferimenti visivi, i problemi trovati, gli
> appunti locali. Adesso in radice restano **due**, che sono le porte d'ingresso:
> `README.md` e `ROADMAP.md`. Gli altri stanno in due cartelle nuove, ognuna col
> suo README che dice cosa c'è dentro:
>
> | cartella | cosa ci sta |
> | --- | --- |
> | [`../documentazione/`](../documentazione/README.md) | `comandidelterminale.md`, `stili-interfaccia.md`, `problemi-riscontrati.md` |
> | [`../prompt/`](../prompt/README.md) | `prompt-ambientazioni.md`, `prompt-app-telefono.md`, `foto_da_creare.md` |
>
> **Un nome cambiato**: `stili interfaccia schermata di gioco.md` aveva gli spazi
> dentro, e ogni collegamento diventava `stili%20interfaccia%20schermata%20di%20gioco.md`.
> Adesso è `documentazione/stili-interfaccia.md`.
>
> **Due file restano in radice apposta**: `PROVARE.md` e `backend.md`. Sono
> appunti locali tenuti fuori da git — uno in `.git/info/exclude`, l'altro in
> `.gitignore` — e spostarli vorrebbe dire rompere le righe che li escludono.
>
> Aggiornati tutti i rimandi (README di radice, ROADMAP, `frontend/README.md`, i
> file di questa cartella) e rifatta la mappa dei documenti in cima al README di
> radice, che adesso è una tabella: dove sta cosa, in una riga per cartella. Un
> controllo in `strumenti/audit-regressioni.js` verifica che in radice non
> ricompaia un `.md` sciolto e che nessun documento punti più ai vecchi percorsi.
