# Base worker model benchmark — GPT-OSS 20B vs Mistral Small 3.2 24B

Data: 2026-09-24.

## Decisione

La rete multi-agent resta congelata. Prima si seleziona un worker di base
sufficientemente affidabile.

Challenger:

```text
mistral-small3.2:24b
```

Baseline:

```text
gpt-oss:20b
```

Qwen non viene riproposto: questa linea richiede un modello nuovo rispetto ai
test gia consumati.

## Perche Mistral Small 3.2

Il modello Ollama `mistral-small3.2:24b` e un 24B quantizzato distribuito in
circa 15 GB. La release dichiara miglioramenti specifici di instruction
following e riduzione delle ripetizioni rispetto a Mistral Small 3.1.

Con una GPU da 16 GB il modello e al limite della VRAM. Per il benchmark entrambi
i modelli usano quindi:

```text
num_ctx = 8192
num_predict = 1024
temperature = 0
seed = 42
```

8192 e sufficiente per i documenti congelati del benchmark e riduce il costo KV
rispetto ai 32768 storici.

## Benchmark

Programma:

```text
base_worker_model_benchmark.py
```

Suite:

```text
base_worker_model_benchmark_cases.json
```

Tre documenti reali della repository:

1. `DIRECT_QA_PACKAGE_AUTHORING.md`;
2. `RECOVERY.md`;
3. `DIRECT_QA_WORKER.md`.

Gli snapshot sono congelati separatamente.

Ogni documento contiene 5 claim host-authored prima delle inferenze:

```text
2 SUPPORTED
2 CONTRADICTED
1 UNKNOWN
```

Totale:

```text
15 claim per modello
3 chiamate batch per modello
6 model call massime complessive
0 retry
```

## Simmetria

Entrambi i modelli ricevono:

- gli stessi documenti;
- le stesse claim;
- lo stesso system prompt;
- la stessa semantica ternaria;
- lo stesso JSON Schema;
- gli stessi parametri;
- la stessa rubrica host;
- la stessa funzione di scoring.

Target e required evidence non vengono inviati ai modelli.

La metrica primaria e:

```text
accepted claims / 15
```

Il tempo viene registrato ma non spezza un pareggio di correttezza.

## Protocollo a due fasi

`init` non effettua inferenze. Verifica che entrambi i modelli siano locali e
installati, registra i digest esatti, congela hash di codice, suite, transport e
snapshot.

`run` rifiuta l'esecuzione se modello, codice, suite o snapshot sono cambiati
dopo init.

## Comandi

Installare una sola volta il challenger:

```powershell
ollama pull mistral-small3.2:24b
```

Verifica codice:

```powershell
python -m unittest test_base_worker_model_benchmark -q
```

Init senza inference:

```powershell
python base_worker_model_benchmark.py init --root "$HOME\FAME_BASE_WORKER_MODEL_001"
python base_worker_model_benchmark.py status --root "$HOME\FAME_BASE_WORKER_MODEL_001"
```

Dopo verifica dello status:

```powershell
python base_worker_model_benchmark.py run --root "$HOME\FAME_BASE_WORKER_MODEL_001"
```

La root e consumata dopo il run e non va rilanciata.

## Interpretazione

Possibili esiti aggregati:

- `MISTRAL_BETTER`;
- `GPT_OSS_BETTER`;
- `TIE_ON_ACCEPTED`.

Il benchmark non certifica produzione o generalizzazione universale. Serve a
decidere quale modello merita il prossimo test end-to-end come worker primario.

Non si riapre il multi-agent prima di questa decisione.
