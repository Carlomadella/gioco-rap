# Owned Beats — Audio Analysis Block E — Checkpoint Reference precision-v3

Data: 11 settembre 2026

## Scopo

Questo documento congela il contesto operativo emerso dopo la prima baseline V1 reference-scored e dopo la revisione musicale completa della Human Reference development. Integra il precedente handoff/analisi del Block E con quanto verificato e corretto nella sessione successiva.

Non chiude ancora il Block E: `precision-v3` è una submission revisionata ma **non ancora finalizzata come snapshot immutabile**. Non autorizza holdout, training serio, source separation o Audio→MIDI.

Stato repository usato come base del checkpoint:

- branch: `feature/fame-neural-roadmap`;
- parent repository commit: `47cd4a100ad6af31b2029e28c6660617043d1ac0` (`feat(neural): congela baseline V1 reference-scored`);
- evaluation holdout: chiuso/non osservato;
- candidate output: non esposto alla reference umana.

## 1. Contratto congelato che resta valido

Il protocollo Audio Analysis V2 rimane `FROZEN_PRE_TUNING` e non viene riscritto in seguito ai risultati.

Riferimenti congelati:

- protocollo: `frontend/strumenti/fame-neural-composer/owned-beats/audio-analysis-v2-protocol.json`;
- protocol digest SHA256: `a85cb06f34108fe60f9d0bc40db754a429403500d32bfc48a06a76c7965bb254`;
- protocol Git blob: `aebd54b0da41d6726d209e5fc22b5f59b2df0847`;
- V1 source Git blob: `fcabcf8b069fe2a65edc6ce171d86226e1bcaecb`;
- `mir_eval`: `0.8.2`;
- development: 8 composition family;
- holdout: 10 composition family, tuning vietato;
- beat primary: F-measure @70 ms;
- Cemgil: sigma 40 ms;
- sections primary: F1 @0,5 s;
- sections diagnostica: F1 @3 s;
- BPM tolerance FAME: 3%;
- confronto futuro V2−V1: paired per `compositionFamilyId`;
- massimo 8 configurazioni V2 append-only;
- holdout apribile solo dopo `V2_WINS` e freeze immutabile della candidata.

## 2. precision-v2 e baseline001 restano storico immutabile

La reference usata dalla prima baseline reale era:

`audio-analysis-v2-dev-reference-precision-v2`

Digest submission:

`f63c37bf557a82e32c5a1c58b381501e043ff6e08832b7a3434742521521fa18`

La baseline storica resta:

`D:\FAME_NEURAL\runs\audio-analysis-evaluation-v1\v1-baseline-development-001\report.json`

Digest report SHA256:

`608566F255BA392437903CFE7350AFC65AA64A708F1B90F073D0C7E3ADF5C319`

Stato report: `BASELINE_ONLY_NO_V2_COMPARISON`.

Risultati aggregati congelati di baseline001:

| Metrica | Valore |
|---|---:|
| family development | 8 |
| median Beat F1 | 0.837662 |
| median Cemgil | 0.599052 |
| median Section F1 @0,5 s | 0 |
| BPM EXACT | 5 |
| BPM DOUBLE | 1 |
| BPM OTHER | 2 |
| meter exact diagnostic | 7/8 family |

Dettaglio family baseline001:

| Family | BPM ref v2 | BPM V1 | Categoria | Beat F1 | Cemgil | Section F1 @0,5 s |
|---|---:|---:|---|---:|---:|---:|
| FAME000011 | 121.492905 | 123.046875 | EXACT | 0.909091 | 0.741223 | 0 |
| FAME000012 | 70.311539 | 135.999178 | OTHER | 0.645161 | 0.536583 | 0 |
| FAME000023 | 76.731936 | 151.999081 | DOUBLE | 0.598540 | 0.499725 | 0 |
| FAME000040 | 119.296390 | 117.453835 | EXACT | 0.909091 | 0.661521 | 0 |
| FAME000046 | 138.251715 | 135.999178 | EXACT | 0.766234 | 0.473707 | 0 |
| FAME000058 | 103.197932 | 103.359375 | EXACT | 0.918033 | 0.801979 | 0.363636 |
| FAME000080 | 129.173098 | 129.199219 | EXACT | 0.993548 | 0.763172 | 0 |
| FAME000126 | 149.231829 | 99.384014 | OTHER | 0.289655 | 0.175676 | 0 |

**Regola di continuità:** baseline001 non viene cancellata, riscritta o reinterpretata contro una reference diversa. Rimane il risultato storico di V1 contro `precision-v2`.

## 3. Diagnosi della baseline: cosa resta valido

La diagnosi precedente sulle sezioni resta valida e va conservata separatamente dalla successiva correzione delle beat reference:

| Sezioni sulle 8 tracce | @0,5 s | @3 s |
|---|---:|---:|
| boundary annotate | 52 | 52 |
| boundary prodotte da V1 | 8 | 8 |
| match corretti | 2 | 5 |
| boundary annotate non trovate | 50 | 47 |

Sono presenti **due failure mode contemporanei**:

1. omissione/undersegmentation molto forte: cinque tracce non ricevono alcuna boundary e V1 produce solo 8 boundary contro 52 reference;
2. localizzazione non sempre precisa: alcuni dei pochi match diventano corretti soltanto allargando la tolleranza da 0,5 s a 3 s.

Anche ipotizzando tutte le 8 boundary V1 perfettamente localizzate, la recall massima sarebbe `8 / 52 = 15,4%`. Quindi il problema delle sezioni non può essere risolto limitandosi a spostare i picchi esistenti.

Il detector V1 campiona feature musicali in relazione ai beat e usa variazioni locali/smoothing/picchi. Una soglia troppo selettiva è una causa plausibile ma **non dimostrata da sola**; abbassarla senza diagnostica potrebbe aumentare falsi positivi. La prima candidata V2 sulle sezioni dovrà quindi valutare anche contesto temporale/novelty e mantenere inizialmente invariato il beat tracker per attribuire correttamente gli effetti.

Il dato `meter exact = 7/8` rimane **diagnostico**: non equivale a dichiarare il riconoscimento del meter risolto.

## 4. Perché la Human Reference è stata riaperta

Dopo baseline001 sono stati controllati audio e marker per evitare di ottimizzare V2 contro errori della reference.

Il controllo mirato iniziale aveva individuato come sospette soprattutto:

- `FAME000046` MIDDLE e LATE;
- `FAME000080` LATE;
- `FAME000126` EARLY e MIDDLE.

Questa lista è **superata come perimetro di revisione**. Durante il lavoro è emerso che affidarsi soltanto alle finestre sospette non era sufficiente; la decisione finale è stata riascoltare **tutte le 24 finestre beat development** con metronomo/bip aderente ai marker reali.

Le correzioni sono state fatte per motivazione musicale, non per migliorare il punteggio V1. Nessun output candidato V2 è stato usato come ground truth.

## 5. Riscontri audio specifici conservati

### FAME000046

Il source MP3 verificato non espone un tag BPM/TEMPO convenzionale. L'audit strumentale con `librosa` a risoluzione standard restituiva `135.999 BPM`, ma tale valore è quantizzato dalla combinazione sample-rate/hop e non costituisce ground truth fine. Il grid-fit frazionario dell'audit sosteneva una pulsazione circa `137.95–138.05 BPM`.

Conclusione operativa: il segnale sosteneva circa 138 BPM; la vecchia griglia centrale aveva deriva sufficiente da meritare revisione umana. La reference v3 finale della sessione è stata poi fissata dai marker umani, non dalla stima automatica.

### FAME000080

Il periodo globale era già vicino a 129 BPM; il problema da controllare era soprattutto l'allineamento/phase dei marker. Anche questa family è stata poi inclusa nella revisione completa delle 24 finestre.

### FAME000126

Il segnale sostiene una pulsazione vicina a 150 BPM al livello metrico annotato. Il risultato V1 circa 99.38 BPM resta quindi un failure mode importante di V1, compatibile con un raggruppamento metrico differente ma non spiegato automaticamente da esso. Anche le vecchie griglie umane sono state comunque riascoltate e corrette dove necessario.

## 6. Lezione dell'editor di annotazione: una sola verità temporale

Durante la revisione sono state provate interfacce temporanee con una griglia/guida separata dai marker reali. Questo ha creato stato divergente e comportamento poco interpretabile; una variante di upgrade ha inoltre ripescato stato browser precedente, con rischio di perdita del lavoro corrente.

Quella linea è **deprecata e non va riutilizzata**.

Contratto operativo fissato da questo checkpoint:

- i marker gialli / `beatTimesSeconds` sono l'unica fonte di verità temporale;
- il bip/metronomo deve leggere gli stessi `beatTimesSeconds` reali;
- `±1 ms`, `±10 ms` sul marker selezionato modificano i marker reali;
- lo shift dell'intera griglia modifica i marker reali;
- la quantizzazione è esplicita e modifica i marker reali;
- nessuna ghost grid, shadow grid o seconda timeline nascosta;
- eventuale futuro `stretch` deve trasformare direttamente l'array reale dei marker, senza creare uno stato parallelo;
- non si resetta `localStorage` o stato browser se l'utente non ha esplicitamente scelto di scartare i salvataggi.

### `Calcola BPM dai marker`

Il comando non analizza l'audio e non sposta marker. Usa tutti gli intervalli consecutivi dei marker presenti nelle tre finestre EARLY/MIDDLE/LATE, scarta intervalli fuori `0.1–3 s`, prende la mediana e imposta:

`referenceBpm = 60 / medianInterval`

Per questo va usato dopo la revisione delle finestre e il suo valore rappresenta la mediana del set di marker corrente.

## 7. Revisione completa precision-v3

Submission corrente della sessione:

`audio-analysis-v2-dev-reference-precision-v3`

Stato dell'export revisionato:

- 8/8 family presenti;
- 24/24 finestre `coverage: COMPLETE`;
- 24/24 finestre `reviewed: true`;
- 8/8 beat reference `reviewed: true`;
- meter e sezioni marcati reviewed;
- tutti i `reviewCostSeconds` valorizzati;
- `metricLevel: PRIMARY_MUSICAL_BEAT`;
- `candidateOutputsExposed: false`;
- protocol digest coerente con il protocollo congelato;
- **snapshot v3 non ancora finalizzata**;
- digest immutabile v3 non ancora acquisito.

BPM esportati dopo la revisione completa:

| Family | precision-v2 | precision-v3 corrente | Delta v3−v2 |
|---|---:|---:|---:|
| FAME000011 | 121.492905 | 121.703854 | +0.210949 |
| FAME000012 | 70.311539 | 70.136638 | -0.174901 |
| FAME000023 | 76.731936 | 76.653610 | -0.078326 |
| FAME000040 | 119.296390 | 120.265305 | +0.968915 |
| FAME000046 | 138.251715 | 138.444712 | +0.192997 |
| FAME000058 | 103.197932 | 103.728163 | +0.530231 |
| FAME000080 | 129.173098 | 129.648157 | +0.475059 |
| FAME000126 | 149.231829 | 150.244523 | +1.012694 |

I numeri detti a voce durante le singole prove erano valori transitori. **Per il record tecnico fanno fede i valori dell'export v3**, non le stime intermedie della sessione.

La revisione mostra che correzioni apparentemente piccole in BPM possono produrre drift temporale udibile sulla durata del brano. Questo è il motivo per cui il controllo è stato esteso a tutte le finestre invece di limitarsi alle cinque inizialmente sospette.

## 8. Differenze di BPM fra finestre: non normalizzare a forza

Il BPM implicito di una singola finestra può differire leggermente da quello di un'altra finestra della stessa traccia. Questo è un segnale diagnostico, non un vincolo che impone di rendere numericamente identiche tutte le finestre.

Decisione presa dopo il riascolto finale: se il bip basato sui marker reali resta musicalmente agganciato al beat nell'intera finestra, **non si spostano i marker soltanto per rendere uguali i BPM impliciti**. Una normalizzazione numerica priva di motivazione musicale potrebbe peggiorare la reference.

## 9. Semantica della copertura beat

`coverage: COMPLETE` non significa che ogni millisecondo dei 12 secondi debba contenere una griglia estrapolata. Significa che la porzione musicalmente annotabile è rappresentata correttamente.

Regola operativa:

- non creare beat fittizi in silenzio/coda senza pulsazione riconoscibile;
- se esistono beat udibili omessi per semplice mancata annotazione, la copertura non è semanticamente completa;
- la quantizzazione può riempire la griglia soltanto nel tratto sostenuto dai tap/beat umani, senza estrapolazione cieca nelle code mute;
- `rawTapTimesSeconds` e `quantizationHistory` possono contenere tentativi/revisioni; per lo scoring finale sono autorevoli i `beatTimesSeconds` finali validati.

Caso esplicito conservato in v3: `FAME000046` annota la rimozione manuale di quattro marker generati automaticamente nella coda silenziosa finale.

## 10. Regola fondamentale per il prossimo confronto V1/V2

Se `precision-v3` cambia la reference usata per lo scoring, il confronto paired deve usare **la stessa reference per entrambi i sistemi**.

Quindi:

`V1-v2` vs `V2-v3` = **confronto vietato / non interpretabile**.

Il percorso corretto è:

`V1-v3` vs `V2-v3`.

Per questo baseline001 resta storico e, dopo finalizzazione v3, servirà una nuova baseline append-only `v1-baseline-development-002` con un **nuovo contratto immutabile** pinned alla v3. Il vecchio contratto/reference di baseline001 non va mutato.

## 11. Prossimi passi bloccanti prima di V2

Ordine operativo fissato:

1. eseguire `human-reference-pack.js check` sulla submission `precision-v3`;
2. produrre diff esatto `precision-v2 → precision-v3` e verificare che meter/sezioni non siano cambiati salvo modifica intenzionale documentata;
3. finalizzare `precision-v3` come snapshot immutabile;
4. acquisire e registrare il digest reale della snapshot v3;
5. creare un nuovo contratto/evaluator run pinning la stessa v3 senza modificare lo storico di baseline001;
6. eseguire `v1-baseline-development-002` append-only;
7. congelare il nuovo risultato V1-v3;
8. produrre diagnostica delle sezioni: reference, proposte V1, curva di cambiamento/novelty, soglia e picchi scartati;
9. aprire la prima candidata V2 concentrata sulle sezioni, mantenendo inizialmente invariato il beat tracker;
10. applicare il protocollo congelato e il budget massimo di 8 configurazioni;
11. tenere l'holdout chiuso fino a `V2_WINS` + freeze candidato.

## 12. Gap CI verificato al checkpoint

Nel branch base `47cd4a1`, `.github/workflows/verifica-neural-hardening.yml` esegue gli smoke Audio Analysis V1/V2 ma **non invoca ancora**:

`frontend/strumenti/fame-neural-composer/owned-beats/audio-analysis-v1-evaluate-test.py`

Il test del valutatore era stato eseguito manualmente con esito PASS prima della baseline, ma la sua assenza dal workflow CI resta un gap reale da chiudere prima del prossimo punto di freeze importante.

## 13. Stato operativo alla fine di questo checkpoint

- baseline001: congelata e preservata contro precision-v2;
- diagnosi sezioni: valida, severe omission + localizzazione secondaria;
- revisione beat reference: estesa da 5 finestre sospette a tutte le 24 development;
- precision-v3: 24/24 riascoltate con metronomo sui marker reali e marcate complete/reviewed;
- riascolto finale: giudicato musicalmente coerente; nessuna normalizzazione numerica forzata;
- precision-v3: **non ancora finalizzata**;
- baseline002: non ancora eseguita;
- V2 tuning: non ancora avviato;
- holdout: chiuso;
- training serio: chiuso;
- source separation / Audio→MIDI: non avviati da questo avanzamento.

Questo checkpoint integra e supera, dove esplicitamente indicato, il precedente handoff che limitava la revisione a cinque finestre. Le diagnosi di baseline e sezioni non superate restano invece valide.
