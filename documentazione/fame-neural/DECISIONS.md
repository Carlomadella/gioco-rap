# FAME Neural — Decision Log

Questo file contiene soltanto decisioni del progetto FAME Neural.
Le decisioni del FAME legacy non vengono ereditate automaticamente.

## NDR-001 — Separazione dal legacy
**Status:** ACCEPTED

FAME Neural è un progetto autonomo. Il legacy resta storico, benchmark e possibile fallback. Una regola legacy entra nel Neural solo dopo rivalutazione esplicita.

## NDR-002 — Primo dominio: Trap, 8 barre
**Status:** ACCEPTED

Il primo problema musicale da risolvere è generare bene 8 barre di Trap. Forma lunga e altri generi restano chiusi finché il relativo gate non viene superato.

## NDR-003 — Rappresentazione simbolica prima del training
**Status:** ACCEPTED

Il training serio non viene aperto finché il formato simbolico non dispone di encode/decode, grammatica e test di round-trip.

## NDR-004 — PoC isolato dal renderer
**Status:** ACCEPTED

Il Neural lavora inizialmente sul dominio simbolico. Il renderer non viene modificato durante la fondazione e il linguaggio dati.

## NDR-005 — Nessuna tecnologia scelta per moda
**Status:** ACCEPTED

Flat, REMI+, Compound Word e formati FAME custom verranno confrontati con benchmark prima di congelare la rappresentazione di training definitiva.

## NDR-006 — Il giudizio musicale resta un gate
**Status:** ACCEPTED

Loss, perplexity o audit automatici non bastano per promuovere un composer.

## NDR-007 — Tonalità e accordi sono concetti separati
**Status:** ACCEPTED

`tonality` descrive root/mode globali. `harmony` descrive segmenti di accordo nel tempo con root, quality e bass/inversione. Il primo accordo non viene più usato come sostituto implicito della tonalità.

## NDR-008 — Event stream canonico e deterministic ordering
**Status:** ACCEPTED

Eventi allo stesso tick vengono ordinati con una precedenza canonica stabile. Il formato non deve dipendere dall'ordine accidentale con cui una sorgente MIDI fornisce le note.

## NDR-009 — Quantizzazione neurale esplicita
**Status:** ACCEPTED

Il formato runtime può restare più preciso del token stream. Le perdite ammesse dal Neural V1 sono esplicite e testate: onset/duration sulle griglie supportate e conditioning/velocity in 10 bin. Non sono ammesse perdite silenziose non documentate.

## NDR-010 — Constrained token grammar
**Status:** ACCEPTED

Il token stream ha una grammatica verificabile e può esporre i token ammessi come prossimo passo. Il futuro generatore non dovrà imparare inutilmente sintassi musicalmente impossibili solo dai dati.

## NDR-011 — Annotazioni V1 congelate dopo review umana
**Status:** ACCEPTED

Le annotazioni FASE 4 sono feature euristiche ausiliarie con confidence, non ground truth. La review umana 22/22 ha trovato 19 phrase pienamente coerenti, 2 phrase da escludere per qualita' musicale e un solo errore metrico isolato sulla tension; non emerge un pattern sufficiente a giustificare una calibrazione globale. Le phrase scartate vengono gestite con un exclusion overlay reversibile senza cancellare il corpus sorgente.

## NDR-012 — FAME Compound V1 è la rappresentazione neurale selezionata
**Status:** ACCEPTED

La FASE 5 seleziona `fame-compound-v1` come contratto di rappresentazione per il Neural successivo.

La scelta deriva dal confronto simbolico e dal micro-training: compattezza circa 20.23 unit/bar, 0 round-trip failure, copertura 8/8 delle feature FASE 4 e costo GPU contenuto.

L'invalid-generation rate del Blocco 3 non viene usato per il ranking finale: l'audit dei 41 sample invalidi ha mostrato esclusivamente violazioni di grammatica/stato prodotte dal sampling unconstrained. Questo comportamento viola il principio già accettato in NDR-010, secondo cui il generatore deve applicare una grammatica constrained.

Compound Word resta baseline tecnica di controllo. Flat e REMI+ restano disponibili per benchmark e regressioni; non vengono eliminati.

## NDR-013 — Due baseline complementari per il benchmark Neural
**Status:** ACCEPTED

La FASE 6 congela due controlli non neurali sullo stesso split leakage-safe e sulla rappresentazione ame-compound-v1:

- ame-retrieval-baseline-v1, forte sulla coerenza di materiale reale;
- ame-constrained-baseline-v1, generativa e senza copie esatte di phrase/bar del train nel test misurato.

Il plan MAE zero della constrained baseline deriva dal conditioning diretto sul piano high-level e non misura il Planner end-to-end.

Le metriche exact-match non vengono interpretate come prova generale di assenza di memorization.

I limiti musicali osservati restano nel benchmark invece di essere corretti con nuove regole procedurali.
