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
