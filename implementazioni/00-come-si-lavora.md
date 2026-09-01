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

**I punti nuovi si scrivono in [`../implementazioni.md`](../implementazioni.md)**, che è
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

## Dove sta il resto

| documento | cosa c'è dentro |
| --- | --- |
| [`../README.md`](../README.md) | la mappa del progetto: le due metà, come si avviano |
| [`../ROADMAP.md`](../ROADMAP.md) | il disegno d'insieme, le fasi, dove sta andando il gioco |
| [`../frontend/README.md`](../frontend/README.md) | il gioco: struttura, build, i lavori per gli store |
| [`../backend/README.md`](../backend/README.md) | il server: rotte, manopole, quanto regge |
| `../backend.md` | il quaderno di bordo del server (fuori da git) |
| [`../stili interfaccia schermata di gioco.md`](../stili%20interfaccia%20schermata%20di%20gioco.md) | il riferimento visivo |

---

## 49 · Un file coi comandi del terminale

49. Creami il file comandidelterminale.md in cui scrivi tutti i comandi da lanciare nel terminale per essere sempre aggiornati a vicenda con carletto e per fare partire il frontend e backend

   **FATTO (01/09/2026).** `comandidelterminale.md` in radice: git
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
