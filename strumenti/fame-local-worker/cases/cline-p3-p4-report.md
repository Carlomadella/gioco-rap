# Owned Beats — Audio→MIDI P3 controlled diagnostic / P4 decision

Data: 22 settembre 2026  
Decisione: NDR-095  
Branch: `feature/fame-neural-roadmap`

## Esito P3 controllato

Run: `audio-to-midi-p3-controlled-baseline-v1-001`  
Fixture manifest SHA256: `f68eddc1fab7919f90a8bd391e24e444401a168d36fa06f22af0ec6d70d33d0b`

Fixture drums:
- D01 kick isolato: PASS, F1/recall 1.0;
- D02 snare isolato: FAIL di classificazione, non di transient detection; 4/4 transient rilevati e 4/4 classificati hihat;
- D03 hi-hat isolato: PASS, F1/recall 1.0;
- D04 kick+snare simultanei: unique-transient recall 1.0, ma la pipeline single-label non rappresenta entrambi i ruoli;
- D05 kick+hi-hat simultanei: unique-transient recall 1.0, ma viene emesso solo hihat;
- D06 hi-hat triplet: PASS;
- D07 kick sincopato: PASS;
- D08 clap/rim: diagnostico fuori tassonomia; escluso dal PASS supportato.

Low-end:
- L01 sustained: F1 1.0;
- L02 note change: F1 1.0;
- L03 glide: median absolute pitch error 2.879475 cent;
- L04 gap/release: F1 1.0.

Conclusione: il low-end resta congelato. Il primo failure drums compare già su casi semplici ed è localizzato nel layer di attribuzione ruoli / rappresentazione simultanea, non nel timing generale dell'onset detector.

## Evidenza spettrale D02

Gli snare sintetici D02 hanno:
- low ratio circa 0.022–0.026;
- mid ratio circa 0.148–0.151;
- high ratio circa 0.825–0.828;
- centroid circa 6.60–6.65 kHz.

Con il classificatore corrente, hihat scatta con `highRatio >= 0.28 OR centroid >= 3500 Hz`, quindi D02 attraversa entrambi i gate hi-hat. Questo spiega il comportamento della baseline sul fixture, ma non autorizza a ricavare nuove soglie dal solo sintetico.

## Ricerca di apertura P4/P5

Fonti:
- librosa onset detection: https://librosa.org/doc/0.11.0/generated/librosa.onset.onset_detect.html
- librosa onset strength: https://librosa.org/doc/0.11.0/generated/librosa.onset.onset_strength.html
- Weyers et al., ISMIR 2025, *Understanding Performance Limitations in Automatic Drum Transcription*: https://zenodo.org/record/17706523/files/000067.pdf
- Wu & Lerch, ISMIR 2015, *Drum Transcription Using Partially Fixed Non-Negative Matrix Factorization with Template Adaptation*: https://archives.ismir.net/ismir2015/paper/000199.pdf
- OaF Drums / E-GMD: https://magenta.withgoogle.com/oaf-drums
- E-GMD license: https://magenta.withgoogle.com/datasets/e-gmd

Risultati rilevanti:
- `onset_detect` individua transienti/peak temporali; non assegna indipendentemente più strumenti allo stesso transient;
- la letteratura recente identifica gli overlapping drum hits come uno dei principali limiti ADT, soprattutto su drum-only;
- PF-NMF consente attivazioni indipendenti di componenti/template ed è quindi un confronto interpretabile per la simultaneità;
- OaF Drums dimostra un percorso learned multi-class/multi-hit, ma l'implementazione Magenta storica è archiviata e basata su stack legacy; non viene selezionata automaticamente;
- E-GMD è CC BY 4.0, ma l'uso di modelli/checkpoint esterni richiede comunque audit specifico prima dell'integrazione.

## Decisione P4

1. Non modificare il low-end.
2. Non ritoccare l'onset timing sulla base dei fixture P3.
3. Non fare threshold tuning sul sintetico D02.
4. Sostituire, nella prima variante P5, la classificazione drums esclusiva `if/else` con attivazioni indipendenti per kick/snare/hihat sullo stesso transient.
5. Confrontare successivamente una variante PF-NMF/template activation come alternativa interpretabile.
6. Conservare OaF Drums come riferimento di ricerca, non come dipendenza immediata.
7. Ogni variante deve passare prima i livelli controllati e non può essere promossa dal solo sintetico.
8. Prima del confronto su real-easy, congelare identità e reference di 3 beat semplici autorizzati.
9. I 12 record independent evaluation consumati restano esclusi dal tuning.
10. P6 resta obbligatorio con cohort fresco dopo l'eventuale selezione P5.

Protocollo congelato prima del primo risultato P5:
`audio-to-midi-p5-drums-comparison-v1.json`.

## Prossimo passo

Implementare `drums-independent-multilabel-spectral-v1` sui soli fixture controllati, mantenendo invariati onset detector, export, renderer v2 e low-end.
