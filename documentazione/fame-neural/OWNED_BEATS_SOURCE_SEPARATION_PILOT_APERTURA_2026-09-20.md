# Owned Beats — Source Separation pilot — ricerca di apertura

Data: 2026-09-20  
Stato: **APERTURA IMPLEMENTATA / INFERENZA NON AVVIATA**

## Punto di partenza verificato

Audio Analysis R6 è chiuso con `V2_PROMOTE`. La sequenza Owned Beats torna quindi al passo già previsto dal playbook: Source Separation → Audio→MIDI drums/low-end → QA.

Il pilot non usa il final holdout Audio Analysis. Il tooling seleziona esclusivamente gli 8 record attivi con split `development` e verifica anche che le tuple di identità non coincidano con il riferimento congelato `audio-analysis-holdout-r1-v2`.

## Ricerca di apertura

HTDemucs resta un baseline sensato per il primo pilot perché produce direttamente i quattro stem richiesti dal playbook: drums, bass, other e vocals. Il paper Hybrid Transformers for Music Source Separation descrive la variante HT Demucs e l'uso congiunto di rappresentazioni temporali e spettrali.

Fonti:
- https://arxiv.org/abs/2211.08553
- https://github.com/facebookresearch/demucs
- https://github.com/intel/openvino-plugins-ai-audacity
- https://huggingface.co/Intel/demucs-openvino

Il repository originale Demucs è archiviato dal 2025. Il codice è MIT, ma non assumiamo automaticamente che qualunque checkpoint trovato in rete erediti la stessa licenza. Per il pilot viene quindi identificato come baseline primario l'artefatto OpenVINO Intel usato dal plugin Audacity, la cui repository modello dichiara MIT.

Per riproducibilità viene fissato come candidato di apertura il revision usato dall'installer OpenVINO/Audacity già coerente con il prototipo storico del progetto:

- candidate id: `intel-openvino-htdemucs-v4-97fc578`;
- revision: `97fc578fb57650045d40b00bc84c7d156be77547`;
- `htdemucs_v4.bin` SHA256: `7aa84fa1f2b534bd6865a5609b8b5b028802fe761d6a09b1d30a1564f8fac6f8`;
- `htdemucs_v4.xml` SHA256: `304e24325756089d6bb6583171dd1bea2327505e87c6cb6e010afea7463d9f0a`;
- output atteso: drums / bass / other / vocals.

BS-RoFormer e Mel-Band RoFormer restano candidati tecnici interessanti: la letteratura riporta risultati superiori su benchmark MSS in diversi setting. Non vengono però introdotti nel pilot iniziale finché non viene verificata l'esatta provenance/licenza del checkpoint che useremmo, distinta dalla sola licenza del codice.

Fonti:
- https://arxiv.org/abs/2309.02612
- https://arxiv.org/abs/2310.01809
- https://github.com/lucidrains/BS-RoFormer

## Decisione di apertura

Il primo obiettivo non è scegliere il separatore “migliore in assoluto”, ma costruire un pilot riproducibile e misurabile sul nostro dominio.

Il baseline primario del pilot è quindi HTDemucs v4 / Intel OpenVINO con identità artefatto fissata. Questa è una scelta di baseline del pilot, non una promozione definitiva del separatore.

La comparazione con un secondo modello verrà aperta solo se il baseline mostra failure che incidono su drums/low-end o se un checkpoint alternativo ha provenance e licenza sufficientemente chiare.

## Tooling implementato

Aggiunti:

- `owned-beats/source-separation-pilot-protocol-v1.json`;
- `owned-beats/source-separation-pilot.js`;
- `owned-beats-source-separation-pilot-test.js`.

Comandi:

```powershell
node frontend\strumenti\fame-neural-composer\owned-beats\source-separation-pilot.js preflight D:\FAME_NEURAL
node frontend\strumenti\fame-neural-composer\owned-beats\source-separation-pilot.js prepare D:\FAME_NEURAL
node frontend\strumenti\fame-neural-composer\owned-beats\source-separation-pilot.js check D:\FAME_NEURAL
```

`preflight` è metadata-only. `prepare` verifica i byte delle 8 sorgenti development e materializza un run append-only `source-separation-pilot-v1-001`, senza eseguire inferenza.

## Vincoli ancora aperti prima di ascoltare output del pilot

Prima di generare e giudicare stems vanno ancora chiusi:

- adapter batch ripetibile verso il separatore;
- receipt di esecuzione con modello/config/device/shifts;
- validazione tecnica degli stem;
- rubric di role fidelity;
- rubric di utilità downstream per drums e low-end;
- regola di confronto se viene introdotto un secondo separatore.

Non vengono autorizzati:

- accesso al final holdout per tuning;
- batch sui 131 asset;
- `TASK_DATA_READY`;
- training serio.

## Prossimo intervento

Implementare e verificare il **batch separator adapter** per il candidate fissato, poi congelare QA e soglie prima dell'ascolto degli output del pilot.


## Addendum — adapter environment doctor

Dopo il preflight reale sul workspace, il run `source-separation-pilot-v1-001` è stato preparato su 8/8 family development con SHA delle sorgenti verificati e senza inferenza.

Per evitare di dipendere da assunzioni sulla GUI Audacity è stato aggiunto `source-separation-audacity-openvino-doctor.ps1`. Il comando non apre audio e non modifica configurazioni: rileva l'installazione Audacity, verifica `mod-openvino.dll`, verifica i due file HTDemucs contro gli SHA256 congelati e controlla se `mod-script-pipe` è disponibile/attivo.

La pipeline Intel documenta Music Separation come effetto Audacity interattivo; il doctor serve quindi a stabilire se possiamo costruire il batch adapter riusando l'installazione esistente oppure se serve un backend standalone prima di produrre qualunque stem.

Fonti:
- https://github.com/intel/openvino-plugins-ai-audacity/blob/main/mod-openvino/OVMusicSeparation.cpp
- https://manual.audacityteam.org/man/scripting.html
