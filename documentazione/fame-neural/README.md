# FAME Neural

Progetto autonomo rispetto al FAME procedurale legacy.

## Fonte operativa

1. `ROADMAP_FAME_NEURAL.md` — ordine delle fasi e gate.
2. `CURRENT_STATE.md` — stato reale e prossimo intervento.
3. `DECISIONS.md` — decisioni accettate soltanto nel Neural.
4. `TESTS.md` — verifiche proprie del Neural.
5. `POC0.md` — origine e confini del prototipo simbolico.

## Audit e lezioni da non perdere

[Audit della Roadmap V2 — 9 settembre 2026](AUDIT_ROADMAP_V2_2026-09-09.md): riscontri nel codice, confronto con la letteratura, limiti delle prove storiche e matrice delle decisioni NDR-001…027.

Le conseguenze operative sono in `DECISIONS.md` (NDR-028…034); lo stato dei problemi è in `CURRENT_STATE.md`. L'audit è una fotografia riferita al commit `1372467`, non una roadmap parallela. Una voce documentata non è automaticamente corretta nel codice.

Prima di riprendere un blocco leggere roadmap, current state e decision log, seguendo i rimandi all'audit pertinenti. I documenti delle singole fasi conservano lo storico; le indicazioni di sequenza superate non prevalgono sulla roadmap corrente.

## Regola di separazione

La documentazione legacy può essere consultata come storico, benchmark o sorgente di idee, ma non impone automaticamente regressioni, regole o architetture a FAME Neural.

Una scelta diventa vincolante nel Neural soltanto dopo una decisione esplicita registrata qui.

## Revisione handoff e pista Sonic Pi

[Confronto critico del 9 settembre 2026](REVISIONE_HANDOFF_SONIC_PI_2026-09-09.md), riferito al commit `02bc708`: stato 7A, limiti del validatore, applicazione delle policy, fedeltà, dati allineati e protocollo del pilot programmatico. Le decisioni adottate sono NDR-035…040; CURRENT_STATE distingue implementazione e azioni ancora aperte. La versione estesa dell'handoff sostituisce quella preliminare come contesto, senza diventare una roadmap autonoma.
