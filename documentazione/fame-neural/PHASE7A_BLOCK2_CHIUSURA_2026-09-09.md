# FAME Neural — Fase 7A/7B — Blocco 2 — Chiusura operativa

Data: 9 settembre 2026
Base documentale: `ec0229de9b26d4c94f5b8cb93d64ab93b4df8dfb`

> Questa chiusura riguarda soltanto il Blocco 2. Non dichiara completata l'intera Fase 7A, non chiude `DRUM DATA READY V2` e non apre training serio.

## Esito

**SUCCESSO TECNICO DEL BLOCCO 2: VERIFICATO.**

Il contratto content/evidence/usage del Blocco 1 è stato collegato al corpus reale tramite overlay/consumer/audit.

Risultati:

- 504 phrase scoperte;
- 2 esclusioni review umana;
- **502 candidate**;
- **301 provenance source ID**;
- **6 source collection**;
- **284 composition family**;
- **0/0 errori/warning overlay**;
- **0 unresolved**;
- **0 capability musicali auto-promosse**;
- seed policy violations: **0**;
- GMD `pretraining=candidate`: **57**;
- Hip Hop Drummer `augmentation=candidate`: **49**;
- `musicalTarget=allowed`: **0**;
- `READY FOR EVIDENCE ENRICHMENT`: **SI**.

| Source collection | Phrase | Provenance source ID | Composition family |
|---|---:|---:|---:|
| `fame-original-seed-v1` | 47 | 24 | 24 |
| `free-midi-chords` | 2 | 2 | 2 |
| `gmd-v1.0.0` | 57 | 24 | 7 |
| `hiphopdrummer` | 49 | 49 | 49 |
| `pdmx-v2025` | 218 | 75 | 75 |
| `waivops-nrg-cp` | 129 | 127 | 127 |

Source corpus digest SHA-256:

`fec26d6184548454b94abd452032b29dab8417e47d0058595646282aee7e7f79`

## Risultato negativo / correzione

```text
ASSUNZIONE INIZIALE
provenance.sourceId e Source Registry.id sono direttamente confrontabili

→ TEST
audit sulle 502 candidate

→ RISULTATO
301/301 sourceId risultano falsamente non registrati

→ PERCHÉ ERA ERRATA
sourceId = record/composizione concreta
registry/policy id = source collection

→ NUOVA REGOLA
preservare sourceId granulare
+ risolvere separatamente la collection
con exact match o prefisso delimitato da ":"
```

Dopo la correzione:

`301 source ID → 6 collection → 0 unresolved`.

## Cosa NON chiude

Restano aperti:

- ammissibilità semantica/task-specifica;
- enforcement nel percorso reale selezione/export;
- fedeltà sorgente per Drum View;
- qualità musicale;
- Trap readiness;
- Drum Dataset V2 readiness;
- training readiness.

Quindi: **Blocco 2 chiuso; Fase 7A ancora aperta.**
