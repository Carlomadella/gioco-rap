# FAME Neural — FASE 2 / Pipeline MIDI e provenienza

Stato: **IN CORSO**
Blocco documentato: **1 — parser, normalizzazione, classificazione iniziale, provenance e Dataset Item V1**

## Obiettivo

Trasformare un file Standard MIDI File in un elemento dati ispezionabile, normalizzato e accompagnato da una dichiarazione esplicita di provenienza/diritti.

Pipeline corrente:

```text
MIDI bytes
→ SMF parser
→ track classifier
→ normalizer 960 PPQ
→ canonical fame-neural-sequence-v1
→ provenance validator
→ fame-neural-dataset-item-v1
```

Questa pipeline non autorizza automaticamente un file al training: separa deliberatamente la validità tecnica dalla clearance commerciale.

## File

Directory runtime:

`frontend/strumenti/fame-neural-composer/midi/`

- `smf-parser.js` — parser SMF format 0/1, PPQ, note, program change, pitch bend, control change, tempo, meter, key signature e nomi track;
- `track-classifier.js` — prima classificazione drums / 808 / harmony / lead / unknown;
- `normalize-midi.js` — conversione timing verso 960 PPQ e mapping nel formato canonico;
- `provenance.js` — contratto e validazione provenance/rights;
- `dataset-item.js` — Dataset Item V1, SHA-256, stato import e gate rights;
- `import-midi.js` — CLI e API per importare un file reale.

Test:

`frontend/strumenti/fame-neural-composer/phase2-smoke-test.js`

## Dataset Item V1

Schema:

`fame-neural-dataset-item-v1`

Sezioni principali:

- `source` — filename, SHA-256, metadati MIDI e track summary;
- `provenance` — sorgente, creator, licenza/permesso, famiglia composizione, evidenze;
- `rights` — stato della validazione dei diritti;
- `import` — errori, warning, classificazioni e analisi;
- `eligibility` — separa validità tecnica da ammissibilità al training commerciale;
- `canonical` — `fame-neural-sequence-v1` normalizzata.

## Provenance minima obbligatoria

Esempio:

```json
{
  "sourceId": "producer-pack-001",
  "originType": "commissioned",
  "creator": "Nome produttore",
  "licenseId": "CONTRACT-2026-001",
  "compositionFamily": "producer-001-session-a",
  "sourceUri": "contratto:o:evidence-id-interno",
  "rightsEvidence": [
    "Contratto firmato: ML training + commercial model/output rights."
  ],
  "commercialTrainingAllowed": true,
  "commercialOutputAllowed": true,
  "notes": "opzionale"
}
```

`originType` ammessi:

- `original`
- `commissioned`
- `licensed_dataset`
- `public_domain`
- `third_party_unknown`

Una scheda valida ma con uno dei due flag commerciali a `false` resta utilizzabile per analisi tecnica, ma `eligibility.commercialTraining` rimane `false`.

La pipeline registra dichiarazioni/evidenze: **non sostituisce la verifica legale della licenza**.

## CLI

```powershell
cd frontend
node .\strumenti\fame-neural-composer\midi\import-midi.js `
  C:\path\beat.mid `
  C:\path\beat.provenance.json `
  C:\path\beat.dataset-item.json
```

Exit code:

- `0` — import tecnico OK e commercial training cleared;
- `2` — MIDI tecnicamente bloccato;
- `3` — MIDI tecnicamente leggibile ma rights non cleared;
- `1` — errore parser/file/JSON;
- `64` — argomenti CLI mancanti.

## Limiti espliciti del blocco 1

Sono intenzionali e devono essere risolti prima di chiudere la FASE 2:

1. solo Standard MIDI File format 0/1;
2. SMPTE division non supportata;
3. formato canonico V1: 4/4 costante;
4. tempo map variabile bloccata;
5. pitch bend viene letto ma non ancora convertito a glide 808;
6. classificazione track euristica: le track `unknown` non vengono silenziosamente forzate in un ruolo;
7. non viene ancora inferita una progressione armonica dagli accordi MIDI;
8. key signature mancante produce fallback tecnico con confidenza 0, non una deduzione musicale spacciata per vera.

## Gate del blocco 1

Il blocco è valido quando il test dimostra:

- parsing SMF;
- rescaling PPQ → 960;
- mapping drums/808/lead;
- metadata tempo/meter/key;
- SHA-256 sorgente;
- provenance cleared vs analysis-only;
- blocco tempo map non rappresentabile;
- blocco file corrotto.

Comando:

```powershell
cd frontend
node .\strumenti\fame-neural-composer\phase2-smoke-test.js
```

## Prossimo blocco FASE 2

- mapping/config override per track ambigue;
- pitch bend → glide 808;
- handling controllato tempo map / segmentazione;
- estrazione armonica iniziale o conservazione chord-note lossless;
- batch importer;
- report di errori per corpus;
- fixture MIDI reali/originali con provenance completa.
