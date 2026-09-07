# FAME Neural — FASE 2 / Gate finale corpus

Stato: **INFRASTRUTTURA GATE PRONTA — ATTESA CORPUS REALE**

## Scopo

Questo gate chiude la FASE 2 solo quando i primi MIDI reali/originali/licenziati sono gia' passati dalla pipeline e hanno prodotto `fame-neural-dataset-item-v1` validi.

Non valuta ancora se la musica e' bella, Trap, varia o priva di near-duplicate musicali: quello appartiene alla FASE 3 — Dataset Auditor.

## Cosa controlla

Per ogni dataset item:

- schema `fame-neural-dataset-item-v1`;
- `source.sha256` valido;
- `itemId` presente;
- provenance minima (`sourceId`, `creator`, `licenseId`, `compositionFamily`, `rightsEvidence`);
- import tecnico `ok`;
- `eligibility.technical = true`;
- `eligibility.commercialTraining = true`;
- rights `commercial-cleared`;
- training e output commerciali esplicitamente consentiti;
- almeno una `fame-neural-sequence-v1`, diretta o in `canonicalSegments`;
- nessun `itemId` duplicato;
- nessun SHA-256 sorgente duplicato esatto;
- numero minimo di item e composition family.

## Cosa NON controlla

Rimandato alla FASE 3:

- duplicati musicali/near-duplicate;
- trasposizioni della stessa composizione;
- leakage tra split;
- qualita' musicale;
- conformita' Trap/Rap;
- motif similarity;
- fingerprint ritmici/armonici.

## Comando

Dopo il batch import dei primi MIDI reali:

```powershell
cd frontend
node .\strumenti\fame-neural-composer\midi\corpus-gate.js `
  C:\path\dataset-items `
  C:\path\phase2-corpus-gate-report.json `
  .\strumenti\fame-neural-composer\midi\corpus-gate-options.example.json
```

Exit code:

- `0` — gate READY;
- `2` — gate BLOCKED;
- `1` — errore di lettura/JSON;
- `64` — argomenti mancanti.

## Default iniziale

```json
{
  "minItems": 3,
  "minCompositionFamilies": 1
}
```

Il numero 3 e' solo un gate tecnico minimo per provare la pipeline su materiale reale; NON e' la dimensione del corpus di training. Il target della FASE 3 resta un corpus molto piu' ampio e curato.

## Regola di chiusura FASE 2

La FASE 2 puo' essere marcata **COMPLETATA** solo quando:

1. almeno i primi MIDI reali/originali/licenziati sono stati importati;
2. il report `fame-neural-phase2-corpus-gate-v1` restituisce `ready: true`;
3. nessun file e' stato autorizzato per deduzione: i diritti devono derivare dalla provenance esplicita;
4. il report viene conservato come evidenza tecnica della milestone.

Le fixture sintetiche automatiche dimostrano che il gate funziona, ma non sostituiscono il corpus reale.
