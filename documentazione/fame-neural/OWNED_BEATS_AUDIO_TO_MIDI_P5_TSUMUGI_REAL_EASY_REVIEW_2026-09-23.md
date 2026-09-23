# Owned Beats — P5 Tsumugi real-easy Human Review

Data: 23 settembre 2026  
Candidate: `tsumugi-drums-v1_5`  
Run: `audio-to-midi-p5-tsumugi-real-easy-development-v1-001`  
Review: `audio-to-midi-p5-tsumugi-real-easy-human-review-v1-001`

## Evidenza operatore

Il report locale è stato incollato dall'operatore; la sessione non ha letto indipendentemente i byte del workspace locale.

Digest riportati:

- package SHA256: `a22e4d0d17085e0c6b161fc16a1f5b6afe4875e82103de70c8d5c18af34b20a4`;
- submission SHA256: `6cb08343f6a704319b0756bd21831edbaf4279d769ff554a55180511d74f06c3`.

Statistiche descrittive:

- records: **3**;
- median usefulness: **2**;
- family >=2: **3/3**;
- total usefulness: **6**;
- automatic promotion: **false**.

## Review per family

| Source | Score | Osservazione |
|---|---:|---|
| `FAME000040` | 2 | Qualche kick percepito fuori posto; base complessivamente molto buona; triplet hi-hat leggermente lente; rim sostituito con hi-hat. |
| `FAME000080` | 2 | Triplet hi-hat ancora troppo lente; kick, snare e hi-hat riconosciuti bene anche quando sovrapposti. |
| `FAME000126` | 2 | Clap non riconosciuto come tale e sostituito con hi-hat. |

Safety riportata dal report:

- split: development;
- original source audio: non acceduto;
- independent evaluation: non acceduta;
- final holdout: non acceduto;
- retuning: no;
- training/P6/batch131/task-data readiness: non autorizzati.

## Interpretazione

Il risultato è qualitativamente diverso dai failure sintetici D03/D04-snare/D06/D07: su tre stem drums reali pre-selezionati per chiarezza, Tsumugi è giudicato utilizzabile in tutti e tre i casi.

Questo supporta l'ipotesi che la sensibilità osservata sui transient sintetici non descriva da sola la capacità del checkpoint su audio reale. Non dimostra però che il problema sintetico sia esclusivamente out-of-distribution e non dimostra generalizzazione al corpus.

Limiti residui osservati:

1. timing delle triplet hi-hat ancora lento;
2. qualche falso kick;
3. clap/rim non rappresentati correttamente e spesso ricondotti a hi-hat;
4. review piccola e development-only.

## Decisione

P5 viene chiuso con `tsumugi-drums-v1_5` come candidato drums da portare a **P6 nuova evaluation indipendente** senza retuning.

Pipeline candidata per il freeze P6:

`audio-analysis-v2-config-001 → HTDemucs/OpenVINO congelato → Tsumugi drums_v1_5 + librosa-pyin-lowend-v1`

Il passaggio a P6 è un'autorizzazione a preparare protocollo/cohort, non una promozione al batch. Le 12 family della precedente independent evaluation, le 8 development e ogni easy/diagnostic già osservato restano esclusi dal nuovo cohort.
