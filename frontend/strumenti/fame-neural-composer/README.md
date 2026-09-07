# FAME Neural Composer — PoC 0

Prototipo **simbolico e isolato**. Non sostituisce il renderer FAME e non modifica il motore audio.

## Cosa contiene

- `core.js`: contratto `fame-neural-sequence-v1` a 960 PPQ.
- `vocabulary.js`: vocabolario discreto per un futuro modello autoregressivo.
- `tokenizer.js`: sequenza simbolica -> token/id.
- `audit-musicale.js`: primi controlli musicali di lungo contesto.
- `fixtures.js`: 3 fixture sintetiche da 8 barre, strutturalmente diverse.
- `smoke-test.js`: verifica formato, vocabolario, tokenizzazione e audit.
- `export-dataset.js`: esporta JSONL pronto per il prossimo step di training.

Le fixture NON sono un dataset musicale reale e NON vanno usate per giudicare la qualità compositiva del futuro modello. Servono soltanto a collaudare il contratto dati.

## Esecuzione

Dalla cartella `frontend`:

```powershell
node .\strumenti\fame-neural-composer\smoke-test.js
node .\strumenti\fame-neural-composer\export-dataset.js .\fame-neural-poc.dataset.jsonl
```

## Confine intenzionale del PoC

Questa tranche non introduce PyTorch/TensorFlow né un Transformer finto. Prima si stabilizzano:

1. rappresentazione simbolica;
2. vocabolario;
3. dataset contract;
4. audit musicali;
5. mapping futuro verso `adf-beat-v1`.

Solo dopo si aggiunge il trainer del modello.
