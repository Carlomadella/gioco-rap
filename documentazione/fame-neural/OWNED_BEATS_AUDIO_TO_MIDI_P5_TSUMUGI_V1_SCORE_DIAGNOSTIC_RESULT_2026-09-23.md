# Owned Beats — P5 Tsumugi V1 score diagnostic — corrected per-role result

Data: 23 settembre 2026.

Run: `audio-to-midi-p5-tsumugi-v1-score-diagnostic-v1-001`.

Il reporter read-only corretto ha ricostruito la presenza dei pitch target direttamente dagli `events[].rawPitch` persistiti del controlled run.

Risultato su 9 role-row supportate:

- `SOURCE_CONTROLLED_TARGET_PITCH_EVENTS_PRESENT`: 5;
- `EXPECTED_ROLE_TARGET_SCORES_NONPOSITIVE`: 4;
- `POSITIVE_TARGET_SCORE_BUT_SOURCE_TARGET_PITCH_ABSENT`: 0.

I quattro miss per ruolo sono:

- D03 hi-hat: best score `-1.207700610`, zero pitch target 42/44/46;
- D04 snare: best score `-7.770591259`, zero pitch target 38/40;
- D06 hi-hat: best score `-3.646468163`, zero pitch target 42/44/46;
- D07 kick: best score `-1.721765161`, zero pitch target 35/36.

I casi positivi sono coerenti: D01 kick, D02 snare, D04 kick e D05 kick+hi-hat hanno score target positivi e corrispondenti raw pitch target nel controlled output.

## Interpretazione

Il failure dei quattro ruoli mancanti è già visibile nello score head V1: non esiste, in questo diagnostic, un caso in cui il target abbia score positivo e venga poi perso dal decoding/path selection.

Quindi non viene aperto un ramo di decoder tuning sui fixture sintetici. La domanda successiva è se questa debolezza sia specifica dei transient sintetici oppure si presenti anche su stem drums reali già giudicati chiari.

## Passo successivo congelato

Il diagnostic real-easy development usa tre family già consumate e selezionate esclusivamente dalla precedente Human Review Source Separation:

- `FAME000040` — drums usefulness 3 — “Buono, molto chiaro e preciso.”
- `FAME000080` — drums usefulness 3 — “Chiaro, bello e completo.”
- `FAME000126` — drums usefulness 3 — “Bello, chiaro, forte e preciso.”

Non consuma independent evaluation o final holdout, non apre original source audio, non modifica parametri e non promuove automaticamente Tsumugi.
