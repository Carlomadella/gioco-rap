# Owned Beats — Tsumugi drums_v1_5 preflight — PASS

Data: 22 settembre 2026  
Decisione di riferimento: NDR-098  
Branch: `feature/fame-neural-roadmap`

## Preflight eseguito

Run: `audio-to-midi-p5-tsumugi-env-v1-001`

Esito:

`FAME_NEURAL_TSUMUGI_ENVIRONMENT_PREFLIGHT_PASS`

Identità congelate:

- candidate: `tsumugi-drums-v1_5`;
- source commit: `f7411471a4de0ad3d430191de11b8623d67e5b38`;
- checkpoint: `best_model_drums_v1_5.pth`;
- checkpoint SHA256: `65138ad1dd919f33fb0ce56e54c0c23c87deaad6511132d69137cf4901ee9319`;
- checkpoint bytes: `57150497`;
- installed package snapshot SHA256: `b14b2b16bd95bc164e7ab5c57a2dd0c035ea6353acae99cdb5a13913b7b22704`.

Runtime osservato:

- Python `3.12.14`;
- torch `2.13.0+cu130`;
- torchaudio `2.11.0+cu130`;
- CUDA available: `true`;
- CUDA runtime: `13.0`;
- device: `NVIDIA GeForce RTX 5070 Ti`.

Safety del comando:

- source audio aperto: `false`;
- fixture audio aperto: `false`;
- transcription eseguita: `false`;
- source separation eseguita: `false`;
- training autorizzato: `false`;
- batch131 autorizzato: `false`;
- task-data readiness dichiarabile: `false`.

## Protocollo controlled congelato dopo il preflight

Prima del primo accesso alle fixture è stato congelato `audio-to-midi-p5-tsumugi-controlled-protocol-v1.json`.

Parametri principali:

- explicit frozen checkpoint locale, nessun auto-download;
- device CUDA obbligatorio, nessun fallback CPU;
- FP32, AMP off;
- `torch.compile` off;
- instrument filter `drums`;
- window/track-batch risolti dai training args del checkpoint immutabile, con fallback dichiarati e valori risolti registrati nel summary;
- window batch size 1;
- merge onset 50 ms;
- silence gate -72 dBFS;
- note bias 0;
- Semi-CRF backend `torch`;
- nessun source separation.

Mapping di scoring congelato:

- kick: GM 35/36;
- snare: GM 38, dopo alias 40→38;
- hi-hat: GM 42/44/46;
- alias aggiuntivo Tsumugi 57→49;
- qualunque altro pitch drum predetto conta come false positive complessivo e viene riportato separatamente;
- clap/rim D08 restano diagnostici fuori tassonomia e non sono necessari per il PASS.

Metriche:

- primary 30 ms;
- secondary diagnostic 50 ms;
- matching one-to-one same-role;
- gate controlled: D01–D07 precision/recall/F1 = 1.0 a 30 ms;
- D08 diagnostic only;
- anche un PASS sintetico non promuove automaticamente il candidato.

## Prossimo passo

Eseguire `run-audio-to-midi-p5-tsumugi-controlled.ps1` sulle sole 8 fixture drums P3 già congelate. Questo accesso apre esclusivamente fixture sintetiche, non beat proprietari reali né cohort indipendenti consumati.
