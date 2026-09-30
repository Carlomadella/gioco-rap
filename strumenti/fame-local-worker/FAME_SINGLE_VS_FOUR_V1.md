# FAME Neural — Single Agent vs Four-Role Network V1

## Scopo

Confrontare sullo stesso problema congelato:

- baseline single-agent: 1 chiamata;
- Four-Role Network V3: 4 chiamate, `Extractor -> Anti-Bias -> Verifier -> Integrator`.

Il confronto misura ciò che il protocollo può misurare direttamente senza inventare vantaggi:
- correttezza dell'opzione finale rispetto alla rubric host-only;
- coverage delle evidenze richieste;
- evidence ID selezionati e uso di contesto opzionale;
- numero di claim e limitazioni;
- issue Anti-Bias e loro stato;
- model calls;
- prompt/eval token;
- durata modello, load separato e durata escluso load.

Il tempo umano, gli overclaim giudicati umanamente e le correzioni restano `null` finché non vengono davvero revisionati.

Nessun winner automatico viene assegnato.

## Case congelato

`single-vs-four-coordinator-causality-v1`

Fonte: `COORDINATOR.md` al commit `b16ef607905d26bf12c9ac8fa2a3b0c481bb4574`.

Domanda:

> Se il coordinatore ottiene un risultato migliore del protocollo precedente, questo dimostra che la divisione del lavoro è la causa del miglioramento e che la rete generalizza già a nuovi documenti?

La fonte distingue esplicitamente:
- utilità osservata della divisione del lavoro;
- identificazione causale del miglioramento;
- generalizzazione a nuovi documenti.

## Braccio single-agent

`fame_single_agent_baseline_v1.py`

Una chiamata, stesso modello/digest/opzioni della rete. Riceve domanda, answer options e unità; non riceve `expectedAnswerOptionId`.

Produce:
- answer option;
- claim atomici;
- evidence ID;
- risposta;
- limitazioni.

## Braccio four-role

`fame_four_role_network_v3.py`, invariato.

L'Extractor non vede le answer options. Anti-Bias, Verifier e Integrator seguono il protocollo V3 già testato.

## Orchestratore

`fame_single_vs_four_v1.py`

`init` crea due root sotto una root esperimento:
- `single-agent/`;
- `four-role-network/`.

`run` esegue i due bracci e scrive `comparison.json` quando entrambi sono terminali.

L'ordine è single-agent poi four-role. La durata raw può quindi essere confusa dallo stato di caricamento del modello; il report conserva `load_duration` separatamente e calcola anche `modelDurationExcludingLoadNs`.

## Limiti

Un solo caso può mostrare una differenza osservata fra i due bracci, ma non stabilisce superiorità generale dell'architettura.

La revisione umana resta obbligatoria e separata dalle metriche automatiche.

Restano false tutte le autorizzazioni operative/training/production/independent evaluation.
