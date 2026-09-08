# FAME Neural — Source Registry

Stato: operativo in FASE 3.

## Scopo

`source-registry.json` è la fonte di verità centrale per lo stato legale e operativo delle sorgenti dati di FAME Neural.

Non sostituisce:
- provenance per-file;
- adapter source-specifici;
- Dataset Auditor;
- Gate 1.

Li coordina.

## Stati

- `green`: può entrare nel training commerciale solo passando adapter/filter e provenance;
- `yellow`: quarantena/reference, non entra nel training;
- `red`: escluso dal training commerciale.

Il colore descrive la decisione dati/diritti. La compatibilità con il composer simbolico è separata in `pipeline.currentSymbolic`.

Esempio: una sorgente audio CC BY 4.0 può essere `green` ma `currentSymbolic=false`.

## Licenze e diritti

Il registry separa:
- `license.code`;
- `license.dataset`;
- `license.outputs`;
- `rights.mlTrainingExplicit`;
- `rights.commercialTrainingAllowed`;
- `rights.commercialOutputAllowed`;
- `rights.trainingBasis`;
- `verification`.

Una repository pubblica o MIT non rende automaticamente MIT i MIDI contenuti.

Una fonte `green` deve avere:
- verifica completata;
- evidenze;
- training commerciale consentito;
- output commerciale consentito;
- una base giuridico-operativa non pending.

## Cache

I dataset NON vanno nella repository.

Default Windows:

`%LOCALAPPDATA%\FAME-Neural\source-cache`

Override:

`FAME_NEURAL_SOURCE_CACHE`

Il downloader rifiuta YELLOW/RED e verifica gli hash degli asset pin-hashati.

Dal hardening NRG-CP V2 il downloader:
- supporta mirror espliciti per asset;
- ritenta errori temporanei 408/425/429/5xx;
- applica timeout per singolo endpoint;
- non promuove mai un file in cache senza checksum valido;
- conserva nel manifest quale endpoint ha prodotto il file valido.

Comandi:

```powershell
node frontend\strumenti\fame-neural-composer\dataset\source-registry.js validate frontend\strumenti\fame-neural-composer\dataset\source-registry.json

node frontend\strumenti\fame-neural-composer\dataset\download-green-sources.js --list

node frontend\strumenti\fame-neural-composer\dataset\download-green-sources.js --source waivops-nrg-cp

node frontend\strumenti\fame-neural-composer\dataset\download-green-sources.js --all-green --dry-run
```

`--all-green` scarica solo le GREEN con `autoDownload=true`.
Sorgenti grandi o che richiedono filtri particolari, come PDMX, restano explicit/manual.

## Adapter

I dettagli di selezione musicale non appartengono al registry.

Esempio NRG-CP:
- registry: licenza, URL, hash, creator, stato;
- `nrg-cp-source.json`: target source, minimum pitched events, source-share cap;
- resolver: produce la configurazione runtime.

Questo evita di duplicare i dati di licenza dentro ogni adapter.

Gli adapter legacy GMD, free-midi-chords e PDMX restano funzionanti e vengono migrati al registry quando vengono toccati per modifiche reali. Nessun refactoring distruttivo solo per uniformità.

## Strati corpus

Il registry classifica le fonti in:
- `human_groove`;
- `harmony`;
- `hiphop_style`;
- `adf_synthetic`;
- `general_symbolic`;
- `audio_style`;
- `reference_only`.

Il sintetico ha inizialmente un advisory max del 40% del training corpus.

Non è un blocker Gate 1: è una guardia di governance da misurare nei benchmark. Non si abbassano o alzano Gate per far tornare il numero.

## Processo per una nuova source

1. inserire la candidate come YELLOW;
2. verificare licenza dei DATI, non solo del codice;
3. registrare evidence e training basis;
4. promuovere a GREEN solo se commercial training/output sono difendibili;
5. pin degli asset con hash quando scaricabili;
6. costruire adapter;
7. preflight importer;
8. provenance per-file;
9. curation/dedup;
10. merge e Gate globale.

## Priorità corrente

1. WaivOps NRG-CP — harmony / pitchedAny / volume phrase;
2. hiphopdrummer — dataset sintetico ADF con cap e seed riproducibili;
3. NeuralAcid — dopo verifica rights e benchmark bass→808;
4. OpenScore Lieder / Quartets — dopo verifica rights e adapter MusicXML;
5. Harmony Whiz — quarantena finché non esiste licenza/permesso commerciale ML esplicito.

GMD, free-midi-chords e PDMX sono già sorgenti attive/validate nel corpus.


## Hip Hop Drummer — generated-output source

Pinned generator commit:

`4cbf33aef786338b5a991e716fb82879fe47a6c7`

Operational policy:
- upstream `node tests.js` must pass before generation;
- critical Git blob SHAs are verified against the pinned commit;
- generated outputs use deterministic per-item seeds and a generation manifest;
- only styles whose `BASS_STYLES[style].instrument` is exactly `808sub` may populate the FAME `808` role;
- lead examples are restricted to the source's G-Funk lead-capable styles;
- every generated MIDI is merged as separate format-1 tracks and passed through the real FAME importer before intake;
- same-rhythm groups are deduplicated conservatively because the source is rule-generated;
- HHD contribution is capped at 20% of the pre-review global corpus and is used to close role deficits, not to inflate the 500-phrase target.

Rights evidence:
- repository `LICENSE` and README declare MIT;
- README explicitly states generated beats are user-owned and may be used commercially without attribution, royalties or restrictions;
- `package.json` currently declares `ISC`, which conflicts with repository LICENSE metadata. This discrepancy is recorded and the generated-output ownership statement is the operational basis for generated examples.
