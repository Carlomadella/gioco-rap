# FAME Neural — Single Agent vs Four-Role Network Battery V1

## Obiettivo

Passare da confronti singoli scelti sequenzialmente a una piccola batteria precongelata, per ridurre il rischio di inseguire casi favorevoli o sfavorevoli dopo aver visto i risultati precedenti.

La batteria contiene quattro casi nuovi congelati prima di qualsiasi inferenza reale della batteria.

## Casi

1. `battery-qa-transfer-v1`
   - fonte: `QA_TRANSFER.md`;
   - tema: differenza fra `VALIDATED_FOR_REVIEW`, PASS e risparmio umano non misurato;
   - ordine: single-agent -> four-role.

2. `battery-recovery-v1`
   - fonte: `RECOVERY.md`;
   - tema: preservazione del first pass e assenza di generalizzazione dal recovery sul caso noto;
   - ordine: four-role -> single-agent.

3. `battery-gptoss-diagnostic-v1`
   - fonte: `GPTOSS_DIAGNOSTIC.md`;
   - tema: OUTPUT_TRUNCATED vs errore semantico e limiti di think=low;
   - ordine: single-agent -> four-role.

4. `battery-anti-bias-v1`
   - fonte: `FAME_ANTI_BIAS.md`;
   - tema: divieto di dichiarazioni unbiased e semantica fail-closed degli issue BLOCKING;
   - ordine: four-role -> single-agent.

Gli ordini sono quindi bilanciati 2/2.

## Runner

`fame_single_vs_four_battery_v1.py`

`init` congela:
- 4 package digest;
- ordine dei due bracci per ciascun caso;
- modello/digest/opzioni;
- hash del codice;
- massimo 20 chiamate;
- autorizzazioni tutte chiuse.

`run` esegue i quattro casi in ordine e arresta la batteria su errore di trasporto, senza trasformare errori in retry automatici.

Ogni caso mantiene:
- root single-agent;
- root Four-Role Network V3;
- comparison locale riproducibile.

Il risultato globale è `battery-result.json`.

## Aggregazione automatica

L'aggregato conta:
- answer corretta in entrambi / solo single / solo network / nessuno;
- required evidence coverage per braccio;
- accepted per braccio;
- model calls;
- prompt/eval token;
- model duration excluding load;
- issue Anti-Bias e issue unresolved.

Non assegna un vincitore automatico.

## Review umana

Restano da valutare dopo la batteria completa:
- overclaim;
- parsimony/evidence precision;
- correzioni effettivamente necessarie;
- utilità delle issue Anti-Bias;
- burden e tempo umano.

Questi aspetti non vengono inferiti dalle sole metriche automatiche.

## Stato prima del run

I due confronti singoli precedenti hanno prodotto:
- 2/2 casi con answer corretta in entrambi i bracci;
- 2/2 required coverage completa in entrambi;
- nessun errore materiale della baseline corretto dalla rete;
- overhead netto della rete in entrambi;
- nel secondo caso la baseline è risultata più parsimoniosa nella selezione dell'evidenza.

La batteria non modifica retroattivamente questi risultati e non è progettata per far vincere uno dei due bracci.

## Sicurezza

Sempre:
- `humanReviewRequired=true`;
- `executionAuthorized=false`;
- `trainingAuthorized=false`;
- `networkProductionReady=false`;
- `independentEvaluation=false`.
