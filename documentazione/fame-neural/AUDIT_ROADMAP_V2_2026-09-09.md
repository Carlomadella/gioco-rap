# FAME Neural — Audit delle decisioni e della Roadmap V2

> **Documento di evidenza storica, integrato il 9 settembre 2026.** L'audit seguente fotografa il commit `1372467591e7bc99ef8ee92a3e68c86a6cc2977e`, prima dell'integrazione documentale. Le frasi sul branch e sull'assenza di commit si riferiscono a quel controllo. Le conseguenze operative sono ora registrate in [DECISIONS.md](DECISIONS.md), NDR-028…034; lo stato dei problemi resta in [CURRENT_STATE.md](CURRENT_STATE.md). Questa integrazione modifica la documentazione: non corregge il codice né ripete gli esperimenti. Le proposte del rapporto vanno lette insieme alle decisioni canoniche, senza creare una roadmap alternativa.

## Giudizio complessivo

**La direzione della V2 è ragionevole, ma il progetto non ha ancora una validazione sufficiente per considerare dimostrata l’architettura neurale finale.** Il lavoro svolto contiene infrastruttura utile, esperimenti informativi e risultati negativi da conservare. Contiene anche errori di protocollo e interpretazioni eccessive: non è corretto presentarlo come una sequenza interamente validata dalla ricerca.

Il reset verso dati specifici per il task è giustificato. Restano da correggere soprattutto il valore probatorio attribuito al benchmark Fase 5, la separazione dei dati nel preprocessing, l’uso troppo generale del termine “falsificato”, i gate ancora privi di criteri operativi e la tracciabilità degli esperimenti d’ascolto.

**Raccomandazione:** conservare pipeline, formato comune, strumenti e risultati storici; correggere i contratti di valutazione prima di nuovo training. Non ricominciare da zero, non ampliare il modello per compensare il dataset, non introdurre subito tutti i componenti della futura architettura.

Questo è un audit, non una nuova roadmap. Le correzioni sotto sono proposte concrete; nessuna decisione o modifica al repository è stata applicata durante il controllo.

## Perimetro ed evidenza disponibile

Verifica al 9 settembre 2026. Il riferimento remoto `feature/fame-neural-roadmap` punta ancora a `1372467591e7bc99ef8ee92a3e68c86a6cc2977e`. Tutte le letture di codice di questo audit sono riferite a quel commit. I tre documenti canonici, già letti integralmente nella ripresa, costituiscono la fonte delle decisioni. Sono stati aggiunti il codice del micro-training, codec, benchmark, finalizzazione, retrieval, gate dati e documenti Fase 5–6. [^R1][^R2][^R3]

L’allegato `Pasted markdown(6).md` è stato letto integralmente: 263 righe, 10.439 byte. Contiene estratti sulla recovery PowerShell della Fase 5, il giudizio sui 16 ascolti e l’handoff V2. **Non contiene una trascrizione completa di tutti gli esperimenti precedenti**, i MIDI del corpus, i WAV di ascolto o il manifest che associa ogni etichetta Fxx alla sorgente. Non si può quindi ricostruire da quel solo file l’intero ciclo sperimentale.

Tre livelli di evidenza sono mantenuti separati:

| Livello | Cosa è disponibile | Limite |
|---|---|---|
| Verificato ora | Ref remoto, codice, documenti, due prove isolate sui codec; controllo del builder già eseguito nella ripresa | Non è una riesecuzione dell’intero corpus |
| Storico documentato | Report GPU, conteggi del corpus, giudizi registrati nella V2 | Non sono stati rieseguiti training o ascolti |
| Proposto/inferito | Modifiche di protocollo e architettura | Non sono risultati sperimentali FAME |

Non sono stati eseguiti nuovi training, download di corpus, ascolti sostitutivi, commit o push. Il rapporto non certifica riproducibilità completa di esperimenti i cui artefatti non sono disponibili.

## Risultati prioritari

| ID | Priorità | Riscontro | Azione necessaria |
|---|---|---|---|
| A01 | Prima del prossimo benchmark | Vocabolario e schemi del micro-training derivati anche da validation/test | Codec fissato da specifica o costruito soltanto sul train |
| A02 | Prima di sostenere una superiorità neurale | Selezione FAME Compound più forte delle prove comparative | Conservare come formato comune; qualificare il confronto |
| A03 | Prima della generazione neurale | Decoder unconstrained in un protocollo che richiedeva grammar masking | Testare il decoder previsto, mantenendo il fallimento storico |
| A04 | Prima della Drum View fedele | Identità delle note drum persa nell’importer | Conservazione sorgente e mapping versionato |
| A05 | Prima dei gate musicali | Criteri e campionamento non ancora operativi | Separare sviluppo da conferma finale e fissare criteri prima dell’ascolto |
| A06 | Prima di espandere le fonti | Volume, diritti e qualità restano dimensioni diverse | Valutazione per ruolo, dominio e famiglia |
| A07 | Prima di congelare l’architettura | Catena di componenti plausibile ma non dimostrata necessaria | Confronto con una soluzione joint/condizionale più semplice |
| A08 | Documentale | Documento Fase 6 ancora orientato al Planner | Marcare esplicitamente la sequenza V1 come superata |

Le priorità non indicano che tutto sia inutilizzabile. Indicano quale affermazione o passaggio non deve dipendere da un’evidenza ancora insufficiente.

## 1. Validità del micro-training e della scelta FAME Compound

### A01 — Separazione incompleta nel preprocessing

In `phase5/microtrain.py`, `parse_dataset` costruisce train/val/test e una raccolta `all`. `train_one` usa `records["all"]` per inizializzare entrambi i codec. `TokenCodec` estrae i token osservati; `CompoundCodec` estrae valori, campi e schemi prevalenti. Il modello viene poi addestrato con il batcher del train. [^R2]

**Conclusione verificata:** validation e test influenzano il preprocessing e, per i compound, anche gli schemi usati in generazione. **Non è verificato un addestramento sui target del test**, né è quantificato l’effetto sui risultati. La formulazione corretta è “assenza di sovrapposizione dei gruppi secondo lo split; preprocessing non isolato”, non “zero leakage” senza qualifiche.

La buona pratica è apprendere trasformazioni dal train e applicarle agli altri split; una specifica simbolica fissata a priori è invece ammessa, perché non viene stimata dal test. [^L1]

**Correzione proposta:** usare vocabolari e schemi dichiarati/versionati oppure apprenderli dal solo train con policy esplicita per valori non osservati. Non scegliere automaticamente la variante migliore guardando il test. I vecchi numeri rimangono storici; la generalizzazione va rivalutata con un benchmark pulito quando serve decidere il modello.

### A02 — Scelta ingegneristica valida, vittoria neurale non dimostrata

Il benchmark documenta 120 step, batch di 4 phrase e 401 phrase train: 480 presentazioni, circa **1,20 epoche nominali**. Questo è adatto a un micro-benchmark di costo e funzionamento; non dimostra convergenza, robustezza fra seed o qualità compositiva. [^R3]

| Rappresentazione | VRAM MiB | Barre/s | Validation bits/bar | Output validi |
|---|---:|---:|---:|---:|
| Flat PoC | 691,518 | 1.063,191 | 267,438852 | 6/12 |
| REMI+ locale | 707,267 | 1.438,365 | 241,336572 | 1/12 |
| Compound Word locale | 137,539 | 557,856 | 191,268692 | 0/12 |
| FAME Compound | 144,136 | 359,363 | 205,256405 | 0/12 |

Sono numeri del report storico, non misure ripetute. FAME Compound usa poca memoria rispetto alle rappresentazioni flat testate, ma **non è il più veloce nel micro-training**. Il Compound generico ha bits/bar inferiori, mentre FAME ha NLL per target inferiore. Nessuno dei due numeri identifica da solo un vincitore: vengono codificati e predetti campi differenti. [^R3]

La copertura 8/8 certifica che l’adapter trasporta tutte le feature Fase 4 previste. Non certifica che quelle feature siano buoni obiettivi musicali. Favorisce comprensibilmente l’adapter costruito per quel contratto; non dimostra l’inferiorità generale di REMI o Compound Word pubblicati.

**Correzione proposta:** mantenere NDR-012/017 come “formato comune selezionato per compatibilità, compattezza e costo locale”. Sostituire l’interpretazione “winner neurale” con “preferenza ingegneristica; superiorità generativa non dimostrata”. Separare benchmark a contenuto informativo uguale da benchmark di funzionalità estese.

### A03 — Il protocollo del decoder è stato violato

Il generatore compound campiona kind, type e campi dagli stessi logits; non applica il vincolo completo di grammatica/stato previsto da NDR-010. La decisione salvata riporta 41 output invalidi complessivi e ne scarta il ranking. [^R2][^R3]

Scartare quella metrica come confronto fra rappresentazioni è ragionevole se il protocollo è sbagliato. **Non equivale però a dimostrare che il decoder corretto funzionerà.** Un validatore che segnala errori grammaticali non dimostra che la musica, una volta vincolata, sarà buona.

Inoltre `CompoundModel` ha teste separate sullo stesso hidden state: la scelta di pitch, durata o altri sottocampi del nuovo evento non condiziona esplicitamente le altre teste dello stesso evento. Questa fattorizzazione va distinta dal formato dati. NMT, nella revisione di marzo 2026, studia proprio la dipendenza fra sottotoken compound e propone decodifica sequenziale interna. È un’alternativa pertinente, non un obbligo di adozione. [^L2]

**Correzione proposta:** testare separatamente grammatica, modello probabilistico dei sottocampi e qualità. Per il benchmark successivo confrontare teste factorized e decoding condizionale solo se quella scelta incide sul task; non riscrivere il formato comune per un difetto del sampler.

### “Zero round-trip failure” non significa lossless

Il codice misura stabilità seriale `encode → decode → encode`, confrontando le due codifiche. Un codec può essere stabile anche dopo aver perso informazione nel primo passaggio. Il documento Fase 5 lo spiega già, ma le sintesi possono far sparire questa distinzione. Le metriche di ricostruzione sono separate e non tutte perfette. [^R3][^R4]

**Terminologia proposta:** “idempotenza del codec superata”; fedeltà di onset, velocity, pitch, classe e boundary riportata separatamente. Non retrocedere un test valido: correggere ciò che si sostiene che dimostri.

## 2. Dati: il reset è giusto, ma deve essere verificabile

### Capacità, qualità e diritti

La V2 corregge un errore reale: presenza aggregata di drums/808/harmony/lead non significa esempi completi, simultanei o utili. Separare il Gate 1 ingegneristico dal Task Data Ready è coerente con i risultati documentati. [^R1]

Serve però evitare una seconda scorciatoia. La presenza di note percussive non dimostra `DRUM_GROOVE`; un conteggio elevato non dimostra `DRUM_FILL`; co-presenza dei ruoli non certifica `FULL_ARRANGEMENT`. Le nuove capability dovranno dichiarare evidenza, granularità, stato di verifica e uso consentito.

I flag `commercialTraining` e i colori del Source Registry riguardano diritti/ammissibilità tecnica. Non vanno riusati come autorizzazione musicale. Il seed originale può avere diritti chiari e restare escluso dai target di qualità. Per nuovi dati servono anche condizioni applicabili alla versione acquisita, attribuzioni e tracciabilità; una fonte licenziata non rende automaticamente ogni generazione originale.

### GMD: scelta coerente per groove umano

GMD contiene 1.150 MIDI, 13,6 ore e 22.214 battute, con performance umane, metadata di stile, beat/fill e split. È pubblicato CC BY 4.0. La documentazione segnala una mappa Roland non identica al General MIDI. [^L3]

**Verdetto:** ampliarlo per competenza ritmica generale è sensato. Il trasferimento alla Trap resta un’ipotesi da misurare. Occorre confrontare un modello specializzato con e senza pretraining generale, a condizioni comparabili, perché il feeling live potrebbe aiutare oppure allontanare dal target.

L’unità statistica non è soltanto la finestra. Performance, famiglia, batterista, take e varianti possono essere correlati. Lo split per famiglia riduce un rischio, non certifica automaticamente indipendenza di ogni pattern simile.

### HH-TRP: candidata, non soluzione già disponibile

Il deposito pubblica 15.000 loop audio algoritmici, WAV/JSON e mappa delle note, con licenza dichiarata CC BY 4.0. L’inventario visibile non presenta un archivio MIDI. Non è stato verificato se i JSON contengano eventi sufficienti alla ricostruzione simbolica. [^L4]

**Verdetto:** la cautela della V2 è coerente. Prima dell’intake vanno verificati schema effettivo, numero di famiglie ritmiche, varianti di suono e qualità. Se occorre trascrivere, le trascrizioni sono stime da validare. “Migliaia di file” non sostituisce una risposta su quanta nuova musica contengano.

### PDMX: qualità sì, proxy assoluto no

Il paper PDMX distingue rating e assenza di rating; riporta 14.182 brani valutati e segnala molti tag di genere mancanti. Il rapporto fra rating e caratteristiche armoniche non dimostra selezione di groove Trap. [^L5]

La selezione FAME attuale usa filtri di licenza/dedup/validità e ranking hash. È riproducibile, ma non quality-aware. Il miglioramento proposto nella V2 è fondato; va implementato come confronto fra selettori sullo stesso pool ammissibile. Non imporre rating minimo a dati senza voti trattandoli come scadenti; non scambiare popolarità per qualità del ruolo drum. [^R5]

### Sintetico: giusta esclusione locale, nessun divieto universale

L’allegato documenta 2 esempi rappabili, 4 coerenti ma non rappabili e 10 giudicati casuali. La corrispondenza con seed e PDMX è riportata nei documenti canonici; il manifest completo Fxx→sorgente non è nell’allegato. [^R1]

Questo giustifica interrompere l’uso del seed come insegnante musicale. Non dimostra che ogni esempio dei 47 sia stato ascoltato, che ogni sintetico sia cattivo o che un dato PDMX sia universalmente buono. La policy conservativa su tutta la fonte è una **decisione gestionale motivata dal campione**, non un’estensione fittizia del test.

Anche una quota sintetica del 40% o inferiore non è una soglia scientifica di qualità. La V2 lo riconosce: bisogna misurare per task e per famiglia.

## 3. Rappresentazione e struttura temporale

### Informazione drum persa prima di FAME Compound

L’importer trasforma le note drum in type/tick/velocity senza conservare la nota originale. Il classificatore converte molte identità in `perc`. Il timing viene riscalato a 960 PPQ, non direttamente alla sedicesima. Il problema di identità strumentale precede il codec neurale. [^R6]

**Conclusione:** non si può ricostruire tom/crash/ride da un `perc` ambiguo. Una Task View derivata esclusivamente dal formato già impoverito non soddisfa il requisito di fedeltà. Serve conservazione sorgente, reimport controllato o estensione compatibile. La scelta fra sidecar ed estensione del canonico deve dipendere da test di collegamento e compatibilità: la preferenza per il sidecar espressa nel primo dossier non è ancora una decisione dimostrata.

### 2, 4 e 8 barre sono scope diversi

Il builder attuale accetta 4/8/16; una richiesta `[2]` torna a `[4]`. È un limite contrattuale verificato. Non prova che 4 barre siano musicalmente sbagliate. [^R6]

MaskBeat descrive una rappresentazione a due barre, nove voci e attivazioni binarie, con un Transformer di 8 layer, 8 head, dimensione 512 e un corpus dichiarato di 30.000 loop. Include prior ritmici nelle loss. **Questo non dimostra che quella griglia, quelle loss o due barre siano ottimali per Trap.** La codifica descritta non conserva la velocity come valore continuo originale. [^L6]

**Correzione proposta:** confrontare finestre corte per core e sequenze più lunghe per variazioni/arrangiamento. Griglia, offset, terzine, roll multipli per cella e confini devono avere misure separate. L’autocorrelazione può selezionare candidate, ma non certifica il riattacco musicale.

Il vecchio test 4-vs-8 non ha una chiusura recuperata. La formulazione corretta è “diagnostico aperto, artefatti/feedback da recuperare”, non “mai eseguito” o “già concluso”. Può restare parte della verifica boundary; la sua assenza non invalida l’audit concettuale attuale.

## 4. Architettura: quali scelte sono fondate?

### Planner rinviato: coerente

L’ordine del runtime non impone quello del training. FIGARO usa descrizioni estratte dalla musica per allenare generazione condizionata e combina feature esperte e apprese. Questo sostiene la possibilità di imparare prima un Performer con condizioni disponibili; non richiede che esista già un Planner autonomo. [^L7]

I 71 esempi train del profiler documentato non costituiscono evidenza sufficiente per aprire il Planner generalizzabile desiderato. Non sono però una dimostrazione matematica che nessun modello possa apprendere alcunché: restano utili per test di contratto e overfit. [^R1]

### Feature euristiche: non sono inutili perché non sono ground truth

La V2 ha ragione a non identificare `energy/tension/vocalSpace` con verità percettive. Sarebbe invece un errore eliminarle in blocco: descrittori deterministici possono essere utili per controllabilità. Il test richiesto è se cambiare quella condizione produce una variazione riconoscibile senza peggiorare la musica. La letteratura sul conditioning non autorizza a chiamare ogni euristica un’etichetta umana. [^L7]

Anche “fill”, “pattern family”, “section” e “motif return” possono essere inferiti euristicamente. Non diventano automaticamente osservabili soltanto perché sostituiscono energy o tension. Vanno distinti conteggi diretti, metadata della fonte, inferenze e review.

### Specializzazione e coerenza: obiettivo fondato, topologia aperta

Una scomposizione condizionale può modellare relazioni: generare una parte conoscendo le altre è diverso dal campionarle da pool indipendenti. DeepBach offre un esempio di generazione condizionale di voci; il suo dominio corale non dimostra efficacia Trap, ma impedisce di generalizzare il fallimento FAME a ogni generazione per parti. [^L8]

MMT offre un’alternativa con modellazione multitraccia e attenzione condivisa. L’esistenza di questa famiglia rende non dimostrata la necessità di un modulo separato chiamato Joint Refiner. La coerenza può essere appresa nel modello unico, nel conditioning o con revisione successiva. [^L9]

**Verdetto:** Drum Core → Arranger → Low-end/Tonal → Refiner è una proposta plausibile, non l’unica architettura valida. Prima di costruire tutti i moduli, confrontare almeno una soluzione joint/condizionale più semplice. Non serve implementare oggi il concorrente completo; serve evitare che la roadmap trasformi componenti ipotetici in obblighi irreversibili.

### Il fallimento del ricombinatore ha un perimetro

La V2 documenta che Constrained V1 e Coupled V2 non superano il retrieval nei test ascoltati. È sufficiente per non promuoverli. Non dimostra che le interdipendenze non possano essere modellate statisticamente: una distribuzione congiunta è anch’essa statistica. La frase va riferita alla specifica ricombinazione locale testata. [^R1]

Il retrieval rimane un controllo utile, non necessariamente il miglior composer possibile. Nei confronti futuri bisogna distinguere recupero guidato da caratteristiche del target, generazione da intenzione dell’utente e Planner end-to-end. Usare descrittori del target per un benchmark condizionale è lecito; diventa scorretto soltanto se lo si presenta come generazione autonoma da informazioni meno ricche. [^R7]

## 5. Valutazione: evitare di ripetere gli errori

### Test set usato per decidere

La documentazione descrive esperimenti e correzioni dopo aver visto output e metriche degli split. Non è possibile ricostruire ogni esposizione senza manifest. È quindi un rischio concreto, non una quantità di contaminazione misurata. La letteratura sull’analisi adattiva mostra perché riutilizzare un holdout per scegliere ipotesi può far sovrastimare la generalizzazione. [^L10]

**Proposta:** trattare i vecchi esempi ascoltati come suite di sviluppo/regressione; riservare nuove famiglie non usate nelle decisioni al gate finale. Non cambiare soltanto il seed del sort: lo stesso contenuto già esaminato non torna “nuovo”.

### Il giudizio del product owner è valido, ma la scala della conclusione conta

L’ascolto dell’autore del gioco è un requisito di prodotto legittimo. Non servono centinaia di persone per bocciare un prototipo chiaramente inadatto. Servono però sample identificabili, sorgente nascosta quando possibile, stesso renderer nei confronti simbolici e domande separate su groove, coerenza, Trap e rappabilità.

Dieci giudizi negativi possono giustificare uno stop operativo; non stimano automaticamente il comportamento su tutto il dominio. Più ascoltatori diventano utili quando si sostiene una preferenza del pubblico, non come burocrazia obbligatoria di ogni iterazione.

### Gate ancora incompleti

Espressioni come “abbastanza grande”, “quota sufficiente” e “campione significativo” nella V2 non definiscono un test eseguibile. Prima di ciascun gate vanno fissati pool, unità di campionamento, numerosità, criteri, trattamento dei casi incerti e regola di arresto.

Non si devono inventare ora 5.000 o 10.000 esempi come soglia universale. MusicBERT usa oltre un milione di brani per pretraining di comprensione musicale: è una prova della scala di quel sistema, non una soglia trasferibile al Drum Core. [^L11]

**Protocollo proposto:** learning curve per famiglie uniche, baseline sullo stesso task, più seed quando si decide il modello, curve train/val e un test finale non adattato. Memoria/throughput sono misure ingegneristiche; nearest-neighbour e diversity sono diagnostiche; nessuna sostituisce l’ascolto.

## 6. Coerenza documentale e affidabilità del processo

`PHASE6_BASELINE.md` conclude ancora con “FASE 7 — Neural Planner V0”, mentre i tre documenti canonici V2 lo rinviano. La precedenza è chiara, ma il file operativo può riattivare una sequenza obsoleta. Va marcato come storico/superato, preservando i risultati. [^R7]

Nel decision log varie sezioni sono tutte `ACCEPTED`, benché alcune siano regole operative e altre ipotesi di efficacia. Servono due informazioni distinte: “scelta accettata per procedere” ed “evidenza sperimentale a supporto”. Una decisione può essere accettata anche se la sua utilità deve ancora essere testata.

La cronologia allegata documenta un errore di recovery attribuito a una funzione PowerShell chiamata Git e una forte frizione dovuta a molti file di avvio. Il sorgente di quella recovery non è nell’allegato: la causa è una diagnosi storica riportata, non riprodotta ora. È comunque un requisito operativo chiaro usare comandi/script stabili, evitare collisioni con eseguibili e ridurre pacchetti ad hoc. La quantità di procedure eseguite non misura il progresso musicale.

L’handoff prometteva continuità più forte di quella effettivamente riproducibile. Le conclusioni fondamentali ci sono; alcuni artefatti no. **Correzione proposta:** ogni nuovo esperimento conserva in un posto stabile codice/commit, config, hash input, split, seed, risultati, renderer, manifest cieco e feedback. Non occorre committare enormi WAV: occorre sapere come recuperarli o rigenerarli senza inventare la storia.

## 7. Matrice delle decisioni NDR

La seguente matrice valuta tutte le decisioni registrate, raggruppando quelle con lo stesso esito. Non le modifica. [^R1]

| Decisioni | Valutazione | Precisazione necessaria |
|---|---|---|
| 001, 004 | Coerenti come perimetro | Separazione dal legacy e renderer isolato preservano confrontabilità |
| 002 | Coerente come requisito di prodotto | Trap e 8 barre sono il primo obiettivo, non una legge musicale |
| 003, 007, 008 | Coerenti | Contratto simbolico, armonia/tonalità e ordinamento espliciti |
| 005 | Coerente, applicazione da rafforzare | Confronto equo richiede task e informazione equivalenti |
| 006, 025 | Coerenti | Metriche e ascolto separati; gate da rendere operativi |
| 009 | Coerente per V1 | Non dimostra adeguatezza di 10 bin/griglie per tutti i task |
| 010 | Coerente, violata nel micro-sampling | Validatore e generatore vincolato sono componenti distinti |
| 011, 022 | Coerenti con riserva | Feature ausiliarie utili; anche i nuovi target strutturali richiedono provenance |
| 012, 017 | Da qualificare | Formato comune accettabile; “miglior representation neurale” non dimostrato |
| 013 | Coerente come archivio di controlli | Constrained non promosso; conditioning oracle dichiarato |
| 014, 015 | Correzioni fondate | Da tradurre in gate per task senza inventare capability musicali |
| 016 | Policy prudente giustificata | Bocciatura del campione, esclusione della fonte per precauzione; non ascolto di tutti i record |
| 018 | Coerente | Preservare identità; ablation locale non prova assenza di ogni problema percussivo |
| 019 | Coerente | Finestre e phrase distinte; criterio operativo ancora aperto |
| 020 | Coerente | Planner training-later; efficacia dell’ordine scelto da verificare |
| 021 | Obiettivo coerente, realizzazione aperta | Cross-track necessario come proprietà; Refiner separato non dimostrato obbligatorio |
| 023 | Coerente con riserva | Scala giustificata tramite task e curve, non analogia con modelli enormi |
| 024 | Coerente | Ruolo del sintetico esplicito; percentuale globale non certifica qualità |
| 026 | Coerente | Ricerca deve poter cambiare il piano, non confermarlo automaticamente |
| 027 | Coerente, linguaggio da restringere | Risultato negativo locale non diventa impossibilità universale |

## 8. Sequenza raccomandata dopo l’audit

1. **Correzione del contratto documentale.** Qualificare il risultato Fase 5, il preprocessing e il perimetro delle falsificazioni; marcare il riferimento Planner obsoleto; registrare gli esperimenti non riproducibili integralmente. Conservare tutti i risultati precedenti.
2. **Specificare Fase 7A prima del codice.** Capacità osservate/candidate, usi consentiti, stato unknown, esclusioni musicali e provenance dei label. Scegliere il punto di conservazione dei dati drum con una prova di compatibilità, senza riscrivere il legacy.
3. **Preparare benchmark e dati fedeli.** Split prima delle trasformazioni apprese; mapping drum, microtiming e collisioni verificati; policy di boundary e core/fill con evidenza esplicita.
4. **Espansione controllata e audit delle candidate.** Più groove umano, fonte Trap realmente utilizzabile, PDMX per ruoli pertinenti. Counts per famiglia e confronti dei selettori.
5. **Gate dati con ascolto.** Regole fissate prima degli output, sample ciechi, vecchi casi come regressione e nuove famiglie come conferma.
6. **Solo dopo: modello minimo comparabile.** Decoder corretto, baseline forte, task identico, learning curve e alternativa architetturale. Nessuna necessità di addestrare oggi Planner o tutta la catena V2.

Questa sequenza usa le fasi esistenti. L’audit non raccomanda una nuova roadmap né una collezione di nuovi launcher.

## Appendice — Prove mirate e limiti

Le definizioni effettive di `TokenCodec` e `CompoundCodec` sono state estratte tramite AST dal file fissato al commit ed eseguite su record minimali. Nessun parametro del modello è stato addestrato. Il record fittizio held-out introduceva un token, una velocity e un campo non presenti nel train.

```text
TokenCodec(train): vocab_size = 4
TokenCodec(train + heldout): vocab_size = 5
HELDOUT_ONLY presente nel secondo vocabolario: true
Campo heldoutField presente nel CompoundCodec: true
Valori velocity osservati dal codec completo: [1, 9]
```

Questo dimostra il meccanismo del preprocessing; non misura quanto abbia alterato le metriche reali. Il call site reale usa `records["all"]`, mentre il batcher usa `records["train"]`.

Il controllo Node del builder effettuato durante la ripresa ha prodotto:

```text
normalizeBuilderOptions({phraseBars:[2]}).phraseBars = [4]
plannedWindows(8,{phraseBars:[2]}) = due finestre da 4 barre
drumEventType(48/49/51/58) = perc
drumEventType(22) = hat_closed; drumEventType(26) = hat_open
```

Non sono stati ricontati i 502 record, ricalcolati gli split sul corpus locale, rigenerati i sample Fxx o verificati i loro WAV. Il report mantiene esplicitamente quei risultati al livello di storico documentato.

## Fonti e riferimenti

Le fonti scientifiche sono state controllate nella versione indicata. Un paper pertinente è un confronto, non una certificazione della soluzione FAME. Le risorse non accompagnate da una replica locale non vengono presentate come riprodotte.

[^R1]: Carlomadella/gioco-rap, commit `1372467591e7bc99ef8ee92a3e68c86a6cc2977e`: [ROADMAP_FAME_NEURAL.md](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/documentazione/fame-neural/ROADMAP_FAME_NEURAL.md), [CURRENT_STATE.md](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/documentazione/fame-neural/CURRENT_STATE.md), [DECISIONS.md](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/documentazione/fame-neural/DECISIONS.md). Stato, decisioni e giudizi storici. Allegati: `Pasted markdown(6).md` e `Pasted markdown(2).md`, estratti forniti nella conversazione.
[^R2]: FAME Neural, [phase5/microtrain.py](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/phase5/microtrain.py), funzioni/classi `parse_dataset`, `train_one`, `TokenCodec`, `CompoundCodec`, `CompoundModel`, `compound_loss`, `compound_next_word`.
[^R3]: FAME Neural, [PHASE5_BLOCK3_RESULTS.json](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/documentazione/fame-neural/PHASE5_BLOCK3_RESULTS.json), [PHASE5_DECISION.json](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/documentazione/fame-neural/PHASE5_DECISION.json), [PHASE5_RAPPRESENTAZIONI.md](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/documentazione/fame-neural/PHASE5_RAPPRESENTAZIONI.md).
[^R4]: FAME Neural, [representation/benchmark.js](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/representation/benchmark.js), confronto `encoded`/`reencoded`, ricostruzione e snapshot delle feature.
[^R5]: FAME Neural, [dataset/select-pdmx.js](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/dataset/select-pdmx.js) e [dataset/source-registry.json](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/dataset/source-registry.json).
[^R6]: FAME Neural, [midi/normalize-midi.js](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/midi/normalize-midi.js), [midi/track-classifier.js](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/midi/track-classifier.js), [dataset/phrase-builder.js](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/dataset/phrase-builder.js).
[^R7]: FAME Neural, [PHASE6_BASELINE.md](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/documentazione/fame-neural/PHASE6_BASELINE.md) e [phase6/retrieval-baseline.js](https://github.com/Carlomadella/gioco-rap/blob/1372467591e7bc99ef8ee92a3e68c86a6cc2977e/frontend/strumenti/fame-neural-composer/phase6/retrieval-baseline.js), `planDistance` e selezione del donor.
[^L1]: Scikit-learn, [Common pitfalls and recommended practices](https://scikit-learn.org/stable/common_pitfalls.html), documentazione ufficiale, sezione Data leakage; consultata il 9 settembre 2026.
[^L2]: Yoo et al., [Nested Music Transformer: Sequentially Decoding Compound Tokens in Symbolic Music and Audio Generation](https://arxiv.org/html/2408.01180v2), revisione 16 marzo 2026. Dipendenze fra sottotoken e confronto delle architetture compound.
[^L3]: Google Magenta, [Groove MIDI Dataset](https://magenta.withgoogle.com/datasets/groove), 2019, documentazione ufficiale: scala, split, beat/fill, mappa Roland e licenza.
[^L4]: WaivOps/Patchbanks, [HH-TRP, deposito Zenodo](https://zenodo.org/records/15734094), 25 giugno 2025: descrizione, licenza dichiarata e inventario dei file.
[^L5]: Long et al., [PDMX: A Large-Scale Public Domain MusicXML Dataset for Symbolic Music Processing](https://arxiv.org/html/2409.10831v2), 17 marzo 2025, sezioni Data Quality e Analysis.
[^L6]: Lanzendörfer et al., [MaskBeat: Loopable Drum Beat Generation](https://arxiv.org/html/2507.03395v1), 4 luglio 2025, sezioni Methodology ed Evaluation. I risultati sono riportati dagli autori, non replicati in FAME.
[^L7]: von Rütte et al., [FIGARO: Controllable Music Generation using Expert and Learned Features](https://arxiv.org/html/2201.10936v4), 22 febbraio 2024, description-to-sequence e conditioning; [implementazione ufficiale](https://github.com/dvruette/figaro) disponibile, non eseguita nell’audit.
[^L8]: Hadjeres, Pachet e Nielsen, [DeepBach: a Steerable Model for Bach Chorales Generation](https://proceedings.mlr.press/v70/hadjeres17a.html), ICML/PMLR 2017. Riferimento sulla generazione condizionale polifonica; dominio diverso dalla Trap.
[^L9]: Dong et al., [Multitrack Music Transformer](https://arxiv.org/abs/2207.06983), versione 24 maggio 2023, ICASSP 2023; [codice ufficiale](https://github.com/salu133445/mmt). Alternativa multitraccia, non benchmark FAME replicato.
[^L10]: Dwork et al., [Generalization in Adaptive Data Analysis and Holdout Reuse](https://arxiv.org/abs/1506.02629), 2015. Fondamento del rischio di riuso adattivo del test.
[^L11]: Zeng et al., [MusicBERT: Symbolic Music Understanding with Large-Scale Pre-Training](https://arxiv.org/abs/2106.05630), 2021. Pretraining per comprensione simbolica, non soglia dati per il Drum Core.
