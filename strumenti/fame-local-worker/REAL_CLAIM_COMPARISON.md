# Confronto reale simmetrico — batch vs selector + judge

Programma:

```text
real_claim_comparison.py
```

Fonte congelata:

```text
strumenti/fame-local-worker/CLINE_GPTOSS_P2_PROBE.md
source commit: cdea2227a4a71906c48b97d888e707a787cecc3e
source SHA256: 258cc46e482b65c3e7fececaa1d050d1d502b853ac051ed4e5920913417c287e
```

La fonte e byte-identica tra il commit di recovery e il branch corrente al
momento della preparazione.

## Obiettivo

Misurare se la decomposizione selector + judge migliora una chiamata batch sullo
stesso documento reale, evitando il limite del precedente `claim_network.py`.

In questo confronto baseline e staged condividono:

- stesso modello e digest;
- stessi parametri;
- stessa fonte completa;
- stesse 6 claim;
- stessa semantica ternaria: SUPPORTED / CONTRADICTED / UNKNOWN;
- stesso requisito di evidence per SUPPORTED e CONTRADICTED;
- UNKNOWN senza evidence;
- stessa rubrica host;
- stessa funzione di scoring.

L'unica differenza architetturale intenzionale e:

- baseline: tutte le claim vengono giudicate in una sola chiamata;
- staged: per ogni claim un selector suggerisce evidence e un judge produce il
  verdetto.

Il suggerimento del selector non e autoritativo. Il judge riceve comunque tutte
le 29 unita del documento, quindi il selector non puo nascondere una
controprova.

## Claim congelate

La suite contiene:

```text
2 SUPPORTED
2 CONTRADICTED
2 UNKNOWN
```

Le claim riguardano esclusivamente il protocollo documentato:

- divieto di retry/suggerimenti correttivi nel run misurato;
- requisiti del PASS artefatto;
- limite delle attestazioni operatore;
- limite di generalizzazione di un buon esito;
- due informazioni non presenti nel documento.

Target e required evidence restano host-only.

## Chiamate

Massimo:

```text
1 baseline
+ 6 selector
+ 6 judge
= 13 model calls
```

Nessun retry.

## Output

`report.json` registra separatamente:

- baselineAccepted;
- stagedAccepted;
- baselineAllPass;
- stagedAllPass;
- comparison;
- baselineModelSeconds;
- stagedModelSeconds;
- humanReviewMinutes = null finche non viene misurato;
- sameSemantics = true;
- sameRubric = true.

Interpretazione di `comparison`:

- `STAGED_BETTER`: staged accetta piu claim;
- `NO_GAIN`: stesso numero;
- `STAGED_WORSE`: staged accetta meno claim.

Un eventuale vantaggio resta development evidence su un documento reale della
repo, non una independent evaluation o autorizzazione operativa.

## Verifica prima del run

```powershell
python -m unittest test_real_claim_comparison -q
```

I test coprono:

- ricostruzione byte-per-byte della fonte congelata;
- 6 claim e distribuzione ternaria;
- ciclo completo a 13 chiamate simulate;
- stessa semantica e stessa rubrica;
- target/rubrica assenti dai prompt;
- stesso system prompt ternario tra baseline e judge;
- documento completo sempre visibile al judge;
- casi simulati STAGED_BETTER e STAGED_WORSE sotto lo stesso scoring;
- evidence obbligatoria per CONTRADICTED;
- UNKNOWN senza evidence;
- digest errato;
- timeout senza retry;
- divieto di sovrascrittura root.

## Run reale

Solo dopo PASS locale:

```powershell
python real_claim_comparison.py --root "$HOME\FAME_REAL_CLAIM_COMPARISON_001"
```

La root deve essere nuova e non va rilanciata.
