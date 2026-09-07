# FAME Neural — Test Plan

## FASE 1 — COMPLETATA

### T-NC-001 — Sequence validation
Le fixture base devono rispettare `fame-neural-sequence-v1`.

### T-NC-002 — Vocabulary uniqueness
Nessun token duplicato.

### T-NC-003 — Token/id round-trip
`tokens -> ids -> tokens` deve essere lossless.

### T-NC-004 — Canonical sequence round-trip
`encode(decode(encode(sequence)))` deve essere identico al token stream canonico iniziale.

### T-NC-005 — Triplet duration
160 e 320 tick devono essere rappresentabili esattamente.

### T-NC-006 — Malformed grammar rejection
Attributi fuori ordine o stream incompleti devono essere rifiutati.

### T-NC-007 — Constrained prefix
La grammatica deve poter restituire i token ammessi come prossimo passo.

### T-NC-008 — Harmony round-trip
Progressioni, qualità, inversioni e accordi che attraversano barre devono sopravvivere al round-trip canonico.

### T-NC-009 — 808 glide round-trip
Target e durata del glide devono essere preservati; glide su eventi non-808 deve essere invalido.

### T-NC-010 — Simultaneous event ordering
L'ordine canonico non deve dipendere dall'ordine di input.

### T-NC-011 — Boundary / cross-bar
Prima/ultima zona di barra, note MIDI 0/127 e durate che attraversano una barra devono essere gestite esplicitamente.

### T-NC-012 — Harmony semantic validation
Quality ignote e segmenti armonici sovrapposti devono essere rifiutati.

### T-NC-013 — Audit regression
Una ripetizione letterale artificiale del motivo deve attivare `MOTIF_LITERAL_REPEAT`.

## Comando

```powershell
cd frontend
node .\strumenti\fame-neural-composer\smoke-test.js
```

## Gate successivo

FASE 2 dovrà aggiungere test per:

- parsing MIDI reale;
- tempo/time-signature supportati/non supportati;
- normalizzazione PPQ;
- track/channel mapping;
- provenance schema;
- import failure deterministico;
- round-trip di fixture MIDI controllate.
