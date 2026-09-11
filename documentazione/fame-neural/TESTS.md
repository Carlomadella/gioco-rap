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

## Hardening e owned-beats (10 settembre 2026)

Vedi [protocollo](FAME_OWNED_BEATS_AUDIO_TO_MIDI_PLAYBOOK.md), sezioni W1–W10, e [verifiche/limiti](HARDENING_OWNED_BEATS_2026-09-10.md). Il bootstrap inventaria/copia soltanto; 7D Block2 è completato nel proprio scope tecnico, Human Reference development 8/8 finalizzata, conversione audio→MIDI non avviata.
## Audio Analysis — baseline V1 reference-scored (11 settembre 2026)

Prima di osservare i punteggi della baseline:

- V1 source blob deve restare `fcabcf8b069fe2a65edc6ce171d86226e1bcaecb`;
- protocollo deve restare `FROZEN_PRE_TUNING`;
- Human Reference development deve essere `audio-analysis-v2-dev-reference-precision-v2`, digest `f63c37bf557a82e32c5a1c58b381501e043ff6e08832b7a3434742521521fa18`;
- le finestre della reference definitiva devono rispettare il contratto post-hardening (coverage, review, raw/history espliciti);
- `mir_eval==0.8.2`;
- evaluation holdout non deve essere letto.

Test evaluator:

```powershell
D:\FAME_NEURAL\venv-audio-analysis\Scripts\python.exe .\frontend\strumenti\fame-neural-composer\owned-beats\audio-analysis-v1-evaluate-test.py
```

Preflight senza esecuzione della baseline:

```powershell
D:\FAME_NEURAL\venv-audio-analysis\Scripts\python.exe .\frontend\strumenti\fame-neural-composer\owned-beats\audio-analysis-v1-evaluate.py D:\FAME_NEURAL --preflight
```

La prima run reale `v1-baseline-development-001` viene eseguita solo dopo commit/push dell'evaluator e del contratto di scoring.
