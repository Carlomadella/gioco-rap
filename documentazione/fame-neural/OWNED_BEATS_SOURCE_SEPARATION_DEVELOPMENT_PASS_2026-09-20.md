# Owned Beats — Source Separation development PASS — 20/09/2026

## Esito

Il pilot Source Separation sul cohort `development` è chiuso con **PASS tecnico + PASS umano**.

Run di inferenza:

- `source-separation-development-inference-v1-001`
- 8/8 composition family development
- 32/32 stem verificati
- stem: `drums`, `bass`, `other`, `vocals`
- final holdout non acceduto
- batch 131 non eseguito
- training non autorizzato

Human review:

- reviewId: `source-separation-human-review-v1-001`
- package digest SHA256: `e860ecd2ae8ccc8ebdafa6069097e03f9443fef15fd1b3f62ed6b620bb35d276`
- submission digest SHA256: `ae63ed188816efb9d272a43549338c3441627505eaaa9e0f78b0b548544343cf`
- record valutati: 8

## Gate congelato prima dell'ascolto

La rubric `source-separation-pilot-review-v1.json` richiedeva, separatamente per drums e bass:

- mediana downstream usefulness >= 2;
- almeno 6/8 family con downstream usefulness >= 2.

Il gate tecnico richiedeva `ALL_8_FAMILIES_PASS`.

## Risultato umano

### Drums

- median downstream usefulness: **2.5**
- family >= 2: **8/8**
- gate: **PASS**

### Bass / low-end

- median downstream usefulness: **2.5**
- family >= 2: **7/8**
- gate: **PASS**

### Outcome

`OPEN_AUDIO_TO_MIDI_DRUMS_LOW_END_PILOT`

Il PASS autorizza il pilot Audio→MIDI soltanto per **drums + low-end**. Non autorizza automaticamente il ramo tonale, il batch completo sulle 131 sorgenti, il training o una dichiarazione di task/data readiness.

## Osservazioni qualitative post-review sullo stem `other`

Queste note sono state fornite dal reviewer dopo la review e sono conservate come evidenza qualitativa ausiliaria. **Non fanno parte del gate PASS drums/bass e non ne modificano retroattivamente le soglie.**

L'ordine della UI era per `sourceRecordId`, quindi le osservazioni corrispondono alle otto family development nel seguente modo:

| Source record | Osservazione reviewer su `other` |
|---|---|
| `FAME000011` | Molto chiaro. |
| `FAME000012` | Chiaro per circa i primi 12 secondi, poi degrada nettamente. |
| `FAME000023` | Intro chiara; successivamente degrada, ma meno del caso precedente e resta complessivamente più chiaro. |
| `FAME000040` | Tiene molto meglio per circa i primi 20 secondi, poi scompare e torna nel ritornello percepito dal reviewer. |
| `FAME000046` | Pattern simile: intro molto buona, poi perde qualità/presenza. |
| `FAME000058` | Pattern simile, ma lo stem è più alto/presente e degrada meno. |
| `FAME000080` | Comportamento analogo a `FAME000058`. |
| `FAME000126` | Comportamento analogo a `FAME000040`. |

Pattern qualitativo osservato: lo stem `other` può essere molto pulito nelle intro o in alcune sezioni, ma la separazione tonale non appare stabile lungo l'intero arrangiamento in diversi casi. Per questo il ramo **tonal Audio→MIDI resta chiuso** e richiederà un proprio gate/approccio successivo.

## Stato successivo

Percorso previsto dalla roadmap:

`SOURCE SEPARATION → AUDIO→MIDI drums/low-end → QA`

Prossimo blocco autorizzato:

**pilot Audio→MIDI development-only su drums + low-end**, con protocollo e criteri congelati prima di osservare i risultati.

Training serio resta chiuso.
