# Documentazione

I fogli che spiegano **come si lavora a questo progetto**: i comandi, i
riferimenti visivi, i problemi trovati e come sono finiti. Stavano tutti sparsi
in radice fino al punto 7.

| file | cosa c'è dentro |
| --- | --- |
| [`come-si-lavora.md`](come-si-lavora.md) | **le regole di lavoro**: i punti, i numeri che si spostano, `npm run verifica`, il giro di fine task, quello che gira da solo. In versione corta in [`../CLAUDE.md`](../CLAUDE.md) |
| [`comandidelterminale.md`](comandidelterminale.md) | tutti i comandi: git, il frontend, il backend, e i guai comuni |
| [`stili-interfaccia.md`](stili-interfaccia.md) | i riferimenti visivi di fuori (i link ai mock e ai concept) |
| [`problemi-riscontrati.md`](problemi-riscontrati.md) | i problemi trovati leggendo il codice, e come sono stati chiusi |
| [`dipendenze.md`](dipendenze.md) | la regola per scegliere una dipendenza, il prezzo che si paga, e il registro di quelle installate |
| [`pagine-azioni/`](pagine-azioni/README.md) | una pagina per ogni azione: l'analisi, i pro e i contro, il telaio comune e il progetto di **ogni** schermata, mossa per mossa |

Il resto sta dove è nato e ci resta, perché è lì che lo si cerca:
[`../README.md`](../README.md) (la mappa del progetto), [`../ROADMAP.md`](../ROADMAP.md)
(dove sta andando il gioco), [`../implementazioni/`](../implementazioni/README.md)
(i punti da fare e quelli chiusi), [`../registro-modifiche/`](../registro-modifiche)
(cosa è cambiato, commit per commit), [`../frontend/README.md`](../frontend/README.md)
e [`../backend/README.md`](../backend/README.md).

---

## Gli agenti

In `.claude/agents/` ci sono tre agenti che fanno da soli un giro di controllo e
**scrivono quello che trovano invece di sistemarlo**. Si chiamano per nome nel
discorso («fai un giro con `segnala-problemi`»).

| agente | cosa fa |
| --- | --- |
| `segnala-problemi` | gira il gioco, trova le cose storte e le scrive in [`problemi-riscontrati.md`](problemi-riscontrati.md). Non tocca il codice. |
| `prova-sul-telefono` | apre il gioco nel browser a misura di telefono, ci gioca, fa gli screenshot e segna cosa si rompe. Il giro dura: non è da fare a ogni modifica. |
| `backend-allineato` | controlla che le tre copie della stessa cosa non divergano — `backend/server.js`, `backend/README-API.md`, `backend/database/schema.md` — e le due serie di migrazioni, SQLite e PostgreSQL. |

Tutti e tre hanno una sveglia, in `.claude/settings.json`:

- **a ogni messaggio** parte `scripts/controlla-backend.js`, che confronta rotte,
  migrazioni e schema; se trova uno scarto lo dice in una riga e propone
  `backend-allineato`. Se non trova niente, tace.
- **all'apertura di una sessione** parte `scripts/promemoria-telefono.js`, che
  guarda quanti file dell'interfaccia sono cambiati dall'ultimo giro sul telefono
  e, se sono tanti, propone `prova-sul-telefono`.
- **dopo ogni `git commit`** parte `scripts/dopo-la-task.js`, che chiede il giro di
  fine task: `segnala-problemi` e `backend-allineato`, insieme, prima del push. Parla
  una volta sola per commit, e sta zitto se il commit ha toccato solo il registro.

Tutti e tre i comandi si possono dare anche a mano (`node scripts/...`) e non
fermano niente se falliscono. Se dan fastidio, si tolgono cancellando il pezzo
che li chiama da `.claude/settings.json`. Quando è stato fatto l'ultimo giro sta
in `.claude/stato-agenti.json`, che è di questa macchina e resta fuori da git.
