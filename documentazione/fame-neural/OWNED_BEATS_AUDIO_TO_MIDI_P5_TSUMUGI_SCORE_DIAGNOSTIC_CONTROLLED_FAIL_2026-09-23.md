# Owned Beats — P5 Tsumugi score diagnostic — controlled failure before publish

Data: 23 settembre 2026  
Branch: `feature/fame-neural-roadmap`

## Tentativo

Wrapper eseguito dall'operatore:

`run-audio-to-midi-p5-tsumugi-score-diagnostic.ps1 -Workspace D:\FAME_NEURAL`

Static test e self-test hanno passato i binding congelati. L'esecuzione reale sulle fixture si e poi fermata con:

`FAME NEURAL TSUMUGI SCORE DIAGNOSTIC FAILED: 'pair_gate_logits'`

Il run non ha pubblicato il summary finale; il runner usa una directory temporanea e la rimuove in caso di eccezione prima della rename append-only.

## Root cause nel source congelato Tsumugi

Audit del commit Tsumugi congelato `f7411471a4de0ad3d430191de11b8623d67e5b38`:

- `AudioSemiCRFTransformer.forward()` usa `V1SemiCRFHead` quando `semi_crf_version == "v1"`;
- solo `V2OverlapSemiCRFHead.forward()` emette `pair_gate_logits`;
- il V1 head emette invece `interval_query`, `interval_key`, `interval_diag`, `interval_features`, `instrument_features`, `instrument_logits` e `frame_valid_mask`;
- nel decoder V1, `selected_pair_count` viene riportato come `track_count = NUM_PITCHES * num_pitch_slots`, non come numero di pair selezionati da un pair gate.

Quindi il precedente score diagnostic conteneva un presupposto architetturale non verificato: tentava di leggere un output V2. Il KeyError e coerente con un checkpoint istanziato con head V1. Prima di congelare il sostituto va registrato il `semi_crf_version` reale dal checkpoint locale tramite l'environment doctor read-only.

## Decisione

1. Non rieseguire `audio-to-midi-p5-tsumugi-score-diagnostic-v1-001`.
2. Conservare il failure come controlled diagnostic design failure.
3. Aggiungere un guard nel vecchio runner: se il checkpoint non e V2, fermarsi immediatamente dopo il load del checkpoint e prima di aprire fixture audio.
4. Verificare metadata checkpoint locale, in particolare `semi_crf_version` e `num_pitch_slots`.
5. Se confermato V1, congelare un nuovo diagnostic con nuovo runId basato sui reali output V1: score pitch-wise Semi-CRF (`interval_query/key/diag`) e non pair-gate logits.
6. Nessun retuning, beat reale, training, P6 o batch131 viene aperto da questo failure.
