# FAME Neural — FASE 2 / Pipeline MIDI e provenienza

Stato: **IN CORSO**
Blocco documentato: **3 — tempo-map segmentata + conservazione chord-note**

## Pipeline corrente

```text
MIDI bytes
→ SMF parser
→ track classifier / override
→ tempo-map strategy
→ normalizer 960 PPQ
→ harmony note preservation
→ provenance validator
→ fame-neural-dataset-item-v1
```

## Cosa è stato chiuso finora

### Blocco 1
- parser Standard MIDI File format 0/1;
- normalizzazione PPQ → 960;
- classificazione drums / 808 / harmony / lead / unknown;
- Dataset Item V1;
- SHA-256;
- provenance/rights gate;
- validità tecnica separata dalla clearance commerciale.

### Blocco 2
- override espliciti per track ambigue;
- pitch bend semplice 808 → glide canonico;
- bend complessi lasciati non forzati;
- batch importer;
- sidecar provenance;
- report corpus-level.

### Blocco 3
- `tempoMapStrategy: "block" | "segment"`;
- default conservativo `block`;
- `segment` divide un MIDI con cambi BPM in sequenze canoniche a tempo costante;
- note che attraversano un confine di tempo vengono clip/split per preservare il contenuto sonoro del segmento;
- `canonical` resta la singola sequence per MIDI a tempo costante;
- per tempo-map segmentata `canonical` è `null` e si usa `canonicalSegments[]`;
- ogni segmento riceve `segmentId`, range tick sorgente, BPM e analisi;
- eventi `harmony` restano note MIDI individuali nel canonico;
- `analysis.harmonyNotes` raggruppa note simultanee senza dedurre ancora il nome dell'accordo;
- nessuna quality armonica viene inventata nel Blocco 3.

## Perché non inseriamo la tempo-map nel formato neurale V1

Il linguaggio FASE 1 usa un BPM globale per sequence. Cambiarlo ora significherebbe riaprire tokenizer, grammatica e test già chiusi.

Per la pipeline dati è più sicuro:

```text
MIDI con 140 → 150 BPM
↓
segmento A: sequence V1 @ 140
segmento B: sequence V1 @ 150
```

Questo mantiene ogni esempio compatibile col contratto già verificato.

## Tempo-map strategy

Nel file opzioni:

```json
{
  "tempoMapStrategy": "segment"
}
```

- `block`: comportamento conservativo; una tempo-map variabile blocca l'import tecnico.
- `segment`: crea una sequence canonica per ogni intervallo a BPM costante.

Un valore diverso produce `TEMPO_MAP_STRATEGY_INVALID`.

## Conservazione armonica

Il Blocco 3 **non prova ancora a dire** che `[60,63,67]` è un `C minor`.

Conserva:

- tick;
- MIDI note;
- durata;
- velocity;
- pitch class;
- gruppi simultanei.

L'analisi espone:

```text
analysis.harmonyNotes.eventCount
analysis.harmonyNotes.groupCount
analysis.harmonyNotes.chordLikeGroupCount
analysis.harmonyNotes.chordNoteGroups[]
analysis.harmonyNotes.inferenceApplied = false
```

L'inferenza di root/quality/inversione verrà fatta sopra questi dati conservati, non al posto loro.

## Test Blocco 3

```powershell
node .\frontend\strumenti\fame-neural-composer\phase2-block3-smoke-test.js
```

Il test usa un SMF originale generato in memoria con:

- 480 PPQ;
- 140 BPM;
- cambio a 150 BPM;
- due triadi su track `Harmony Keys`;
- provenance originale cleared.

Verifica:

- default `block` continua a bloccare tempo-map non rappresentabile;
- `segment` produce due sequence canoniche;
- BPM 140 → 150 preservati;
- chord-note preservate in entrambi i segmenti;
- nessuna chord quality inferita prematuramente;
- rights gate ancora valido.

## Cosa manca per chiudere FASE 2

1. inferenza armonica iniziale **con confidence e possibilità di `unknown`**;
2. fixture/file MIDI reali originali o con licenza verificata, non solo sintetici;
3. test batch su un piccolo corpus reale;
4. report finale della pipeline e criteri di accettazione;
5. decisione esplicita sui casi meter-map/SMPTE che resteranno fuori V1.

Solo dopo questi punti la FASE 2 può passare a `COMPLETATA`.
