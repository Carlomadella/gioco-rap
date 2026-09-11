# Owned Beats — Audio Analysis — Easy Sanity Set checkpoint

Data: 11 settembre 2026

## Perché è stato fatto

Dopo il primo esito positivo di `audio-analysis-v2-config-001` sul development ufficiale, è stata verificata l'ipotesi che le 8 family congelate del pilot possano essere relativamente difficili come primo banco di prova.

Per non alterare il protocollo ufficiale è stato creato un **sanity set separato** di 3 beat boom bap old school scelti intenzionalmente perché semplici, regolari e ripetitivi.

Questo set:

- non sostituisce il development ufficiale;
- non appartiene all'holdout;
- non autorizza training;
- non cambia il budget `1/8` delle configurazioni V2;
- non viene usato per scegliere nuovi parametri di `config-001`;
- resta diagnostico/esplorativo.

I file audio non vengono committati nella repository.

## Identità delle tre sorgenti locali

| Sanity track | SHA256 |
|---|---|
| Oldschool / 90s Boom Bap | `f408c79254d36b534fdfbe7cffe7dcf707130116f5a121293123d501d9a8fef4` |
| Locked Up | `0ce33ec22bef47ea40d45fe56dd465545d0c98b31fb605869cfe9e3f78eb9aa8` |
| Street Candy | `e80c31488306f8dd729b5f03664f00cdc59d4f78d30701e72f2dc60b4aab86f4` |

Il testo `[FREE]` presente nei nomi file non viene considerato prova di licenza o autorizzazione per training/distribuzione.

## Diagnostica automatica iniziale

Le tre tracce mostrano timing molto regolare, con beat-interval CV circa:

- Oldschool: `2,17%`;
- Locked Up: `3,21%`;
- Street Candy: `2,14%`.

Il tracker V1 legge circa:

- Oldschool: `89,10 BPM`;
- Locked Up: `172,27 BPM`, plausibile lettura double-time di circa `86,13 BPM`;
- Street Candy: `92,29 BPM`.

Section candidate prima di qualsiasi reference umana:

| Traccia | V1 | config-001 |
|---|---:|---:|
| Oldschool | 3 | 9 |
| Locked Up | 0 | 9 |
| Street Candy | 0 | 7 |
| **Totale** | **3** | **25** |

Questa osservazione, da sola, non misura correttezza.

## Prima Human Reference cieca

È stata annotata una reference umana senza mostrare output V1/config-001:

- `candidateOutputsExposed = false`;
- full track;
- sole boundary interne;
- nessun obbligo di segnare ogni blocco regolare;
- 9 boundary per traccia;
- 27 boundary totali.

Reference:

`easy-sanity-sections-v1`

SHA256 file reference:

`dce0180e05cba28911ddd12470e63ab4d3b2a27c8ed173c92a9cbdcff6feef31`

### Primo confronto

Sul criterio stretto `±0,5 s`:

| Traccia | V1 F1 | config-001 F1 |
|---|---:|---:|
| Oldschool | 0,000000 | 0,444444 |
| Locked Up | 0,000000 | 0,333333 |
| Street Candy | 0,000000 | 0,000000 |

Mediana family:

- V1: `0,000000`;
- config-001: `0,333333`.

Sul diagnostico `±3 s`, config-001 produce:

- Oldschool: `0,777778`;
- Locked Up: `0,555556`;
- Street Candy: `0,875000`;
- mediana family: `0,777778`.

La vicinanza del conteggio `25 candidate / 27 human` esclude l'ipotesi più semplice di grossolana oversegmentation globale su questi tre beat.

## Secondo passaggio: raffinamento con waveform

Per verificare se gli errori strict dipendessero dall'imprecisione del click, le stesse 27 boundary sono state raffinate con waveform.

Vincoli del secondo passaggio:

- identity e count delle boundary immutabili;
- nessuna aggiunta/eliminazione;
- waveform visibile;
- V1 non visibile;
- config-001 non visibile;
- `candidateOutputsExposed = false`.

Reference raffinata:

`easy-sanity-sections-precision-v2`

SHA256:

`813aeb8f62adba5c3b3780987e498005a474e06bed00c674dd58f8b00d97a903`

Shift umano mediano assoluto:

- Oldschool: `0,304 s`;
- Locked Up: `0,142 s`;
- Street Candy: `0,067 s`.

## Confronto dopo il raffinamento

| Traccia | V1 F1 @0,5 s | config-001 F1 @0,5 s | config-001 F1 @3 s |
|---|---:|---:|---:|
| Oldschool | 0,000000 | 0,555556 | 0,777778 |
| Locked Up | 0,000000 | 0,222222 | 0,555556 |
| Street Candy | 0,000000 | 0,000000 | 0,875000 |

Mediane family:

- V1 Section F1 @0,5 s: `0,000000`;
- config-001 Section F1 @0,5 s: `0,222222`;
- config-001 Section F1 @3 s: `0,777778`.

Il raffinamento non elimina quindi il problema di localizzazione.

### Caso Street Candy

È il caso più informativo:

- shift umano mediano con waveform: solo `67 ms`;
- shift umano massimo: `107 ms`;
- config-001: `0,000000` @0,5 s;
- config-001: `0,875000` @3 s;
- 7/7 candidate trovano una boundary umana entro 3 s;
- gli errori matched sono circa `0,61–0,70 s`, con un caso `1,328 s`.

A ~92 BPM questi scarti sono coerenti con circa uno o due beat.

La conclusione più supportata è quindi che `config-001` spesso individui correttamente **la zona strutturale del cambio**, ma localizzi la boundary sul beat adiacente.

## Cosa abbiamo imparato

1. **V1 è realmente troppo debole sulle sections anche su materiale semplice.**  
   Non si può spiegare il failure del development soltanto dicendo che le 8 tracce ufficiali sono difficili.

2. **L'ipotesi che il development ufficiale sia relativamente impegnativo è plausibile e ora ha evidenza a favore.**  
   config-001 sul sanity set semplice ottiene risultati migliori che sul development ufficiale, ma 3 beat boom bap non costituiscono prova generale né sostituiscono un audit formale della difficoltà del pilot.

3. **config-001 ha migliorato davvero la sensibilità strutturale.**  
   V1 propone 3 boundary totali contro 27 umane; config-001 ne propone 25. Il diagnostico @3 s è forte su tutte e tre le tracce.

4. **La localizzazione temporale è un failure mode reale.**  
   Il secondo passaggio con waveform dimostra che almeno il caso Street Candy non può essere spiegato dall'imprecisione del click umano.

5. **Il problema successivo, se sarà necessario intervenire, è diverso dalla detection pura.**  
   È plausibile un futuro boundary-refinement/localization stage che agganci il cambio strutturale al beat corretto, senza dover necessariamente sostituire il detector contestuale.

## Effetto sul protocollo ufficiale

Nessun cambiamento alla decisione ufficiale:

- candidate: `audio-analysis-v2-config-001`;
- configuration budget: `1/8`;
- freeze commit: `43530f44c5e753a1ab024a5be235dc2363c2f7ba`;
- development metric gate: `V2_WINS_METRICALLY`;
- decisione ufficiale: `INCONCLUSIVE_REVIEW_PENDING`;
- holdout: chiuso / non osservato.

Il prossimo passo resta il **required human correction-cost review** di config-001 su almeno 6 development family comparabili.

Non viene aperta `config-002` prima di quel review.

## Artefatti diagnostici esterni

Gli artefatti restano fuori Git; qui vengono registrati solo identità e digest.

| Artefatto | SHA256 |
|---|---|
| Easy sanity automatic report V1 | `e6d501e77a8d420e6fbe3da92b77dd84a08e58532a50782aeb4681e2627321fd` |
| Human section reference V1 | `dce0180e05cba28911ddd12470e63ab4d3b2a27c8ed173c92a9cbdcff6feef31` |
| V1 vs config-001 comparison V1 | `538468f9e52b49089a93c644018e8ef10e819174e5711ed6012043872ad04085` |
| Waveform-refined reference precision-v2 | `813aeb8f62adba5c3b3780987e498005a474e06bed00c674dd58f8b00d97a903` |
| Localization comparison V2 | `e1b139c030348b6439d32ede17d5b1f3761350c27f6bbd48d3fd5b75d492d043` |
