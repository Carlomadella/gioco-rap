# FAME Neural — Fase 7A — Blocco 4 — Chiusura operativa e ricerca di chiusura

Data: 9 settembre 2026
Base repository: `e62ab392d1e47bdf6c6e591418c8a8a9f009d63e`

> Questa chiusura riguarda source fidelity e derivazione tracciabile della futura Drum View. Chiude la Fase 7A nel suo perimetro di contratti/pipeline. Non dichiara `DRUM DATA READY V2`, non promuove GMD a Trap target e non apre training serio.

## Esito

**SUCCESSO TECNICO DEL BLOCCO 4: VERIFICATO.**

L'opening audit aveva dimostrato tre perdite reali:

1. note GM drum differenti potevano collassare nello stesso ruolo aggregato, per esempio `perc`;
2. source tick differenti potevano collassare dopo scaling/rounding;
3. `fame-neural-sequence-v1` elimina campi source/original non previsti dal contratto.

Sul corpus storico 502 candidate erano presenti 14.287 drum events, 1.878 `perc`, 0 MIDI note originali conservate nei drum event e 0 campi source/original. I 160 dataset item storici trovabili vicino al corpus non esponevano `sourceFidelity`.

## Soluzione implementata

Il Blocco 4 introduce:

- `midi/source-fidelity.js`;
- `sourceFidelity` versionato nel dataset item;
- preservazione di MIDI note, source timing, duration, velocity, PPQ, mapping/versione;
- `sourceEventId` deterministico per ogni hit;
- proiezione canonica esplicita ma separata dal dato raw;
- slice source fidelity nel phrase builder;
- smoke test dedicato;
- re-import test reale GMD.

Il canonico V1 rimane invariato: il payload raw non viene iniettato negli eventi canonici.

## Verifica reale

Il test reale ha rigenerato un campione GMD dalla sorgente ufficiale verificata tramite SHA-256 e ha ottenuto:

- MIDI reali: **6**;
- importati: **6**;
- raw drum events preservati: **2382**;
- canonical drum events: **2382**;
- phrase con source fidelity: **35/35**.

Regressioni e smoke:

- Fase 2 / Blocco 2: OK;
- Fase 7A / Blocco 3: OK;
- raw GM drum note identity preserved: OK;
- raw source ticks preserved before canonical rounding: OK;
- canonical V1 unchanged / no raw drum note injection: OK;
- deterministic sourceEventId: OK;
- phrase fidelity slice/linkage: OK;
- duplicate simultaneous hit identity: OK;
- real GMD re-import: OK.

L'uguaglianza 2382/2382 è un'invariante utile sul campione testato, ma non viene interpretata come prova di qualità musicale.

## Negative result / correzioni emerse durante il blocco

```text
ASSUNZIONE ERRATA NEL TEST V1
GM49 e GM51 della fixture avrebbero dovuto collidere nel canonical tick

→ TEST
fixture con sourceTick 1 e 21 a sourcePpq 1920

→ RISULTATO
canonicalTick 1 e 11: assertion fallita

→ PERCHÉ ERA ERRATA
la fixture non rappresentava la collisione temporale che intendeva testare

→ NUOVA REGOLA
le fixture devono verificare esplicitamente source tick e canonical tick attesi;
la fixture corretta usa sourceTick 1 e 2 → canonicalTick 1
```

```text
ASSUNZIONE ERRATA NEL TEST GMD V2
"directory cache esistente" equivale a "campione reale disponibile"

→ TEST
cache presente ma con 0 MIDI

→ RISULTATO
il test reale falliva come se l'implementazione fosse errata

→ PERCHÉ ERA ERRATA
presenza della directory e disponibilità del dataset sono stati confusi

→ NUOVA REGOLA
cache assente o insufficiente produce SKIP esplicito;
la chiusura richiede comunque un successivo REAL GMD TEST: OK
```

Entrambi i fallimenti erano nei test/fixture. Il launcher ha eseguito rollback sui soli file target, quindi non sono rimaste patch parziali.

## Ricerca di chiusura

### GMD: dati simbolici e metadata separati

La documentazione ufficiale del Groove MIDI Dataset mantiene un archivio MIDI-only e metadata separati per performance, inclusi drummer/session/id/style/BPM/beat type/time signature. Questo è coerente con la scelta di preservare l'identità della sorgente e derivare viste task-specifiche senza sostituire i fatti sorgente con label aggregate.

Riferimento:
https://magenta.tensorflow.org/datasets/groove

### Note representation: pitch, time, duration e velocity sono informazione simbolica primaria

MusPy documenta una note-based representation come tuple `(time, pitch, duration, velocity)`. FAME non adotta MusPy come dipendenza o formato, ma il confronto sostiene che pitch/timing/duration/velocity sono informazione simbolica primaria che non va distrutta prima di sapere quale Task View servirà.

Riferimento:
https://muspy.readthedocs.io/en/stable/representations/note.html

### Provenance e derivazione

W3C PROV tratta la provenance come informazione utile a valutare qualità, affidabilità e trust. Il sidecar FAME non implementa PROV, ma la separazione tra entità sorgente, derivazione e vista risultante è coerente con il requisito di rendere verificabile da dove proviene un dato task-specifico.

Riferimento:
https://www.w3.org/TR/prov-overview/

## Confronto con l'ipotesi iniziale

L'ipotesi di apertura era preferire un sidecar versionato rispetto a un'estensione immediata del canonico V1.

**Esito: supportata dal test.**

Il sidecar:

- preserva i dettagli raw necessari;
- evita regressioni sul common format storico;
- mantiene derivazione e mapping espliciti;
- consente alle phrase di avere una slice coerente;
- lascia alla futura Drum View V2 la scelta di quali campi usare realmente nel modello.

Non è dimostrato che questa sia l'unica architettura possibile. È la soluzione adottata perché risolve il problema osservato con minore impatto sul contratto esistente.

## Limite storico

Le 502 phrase storiche non vengono riscritte. Sono state generate da dataset item/canonici che non conservavano la nuova source fidelity. Inferire una nota originale da `perc` violerebbe NDR-033/NDR-036.

Per i nuovi task drum che richiedono questa informazione:

- reimportare la sorgente MIDI quando disponibile;
- oppure usare una fonte che espone esplicitamente eventi equivalenti;
- altrimenti dichiarare la fedeltà non disponibile.

## Cosa chiude

Il Blocco 4 chiude:

- preservazione source note identity;
- source timing/PPQ prima del rounding;
- mapping/versione tracciabile;
- sourceEventId stabile;
- derivazione dataset item → phrase;
- compatibilità del canonico V1;
- verifica sintetica e reale GMD.

Con questo risultato **la Fase 7A è COMPLETATA NEL SUO SCOPE**.

## Cosa NON chiude

Restano aperti nella Fase 7:

- 7C Drum Dataset V2;
- 7D espansione GMD e evidence enrichment;
- 7E Trap-specific source / HH-TRP;
- 7F PDMX quality-aware quando pertinente;
- 7G boundary/loopability;
- soglie/pool/split definitivi del DRUM DATA READY V2 gate;
- human musical gate;
- training readiness.

Quindi: **7A chiusa; Fase 7 resta corrente; training serio ancora chiuso.**
