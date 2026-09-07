# FAME Neural — FASE 2 / Blocco 2

Stato: **COMPLETATO NELLA PATCH BLOCCO 2**

## Obiettivo

Rendere l'importer utilizzabile su piccoli corpus reali senza forzare decisioni musicali ambigue.

Questo blocco aggiunge:

1. override espliciti per track ambigue;
2. conversione conservativa pitch bend → glide 808;
3. batch importer con sidecar provenance e report;
4. test su file SMF fisici generati dal test.

## Override track

La classificazione automatica resta il default. Un file di opzioni può correggere una track solo in modo esplicito e tracciabile.

Esempio `import-options.json`:

```json
{
  "pitchBendRangeSemitones": 2,
  "trackOverrides": {
    "tracks": [
      {
        "trackIndex": 2,
        "melodicRole": "808",
        "pitchBendRangeSemitones": 2,
        "reason": "Confermato manualmente dal producer"
      }
    ]
  }
}
```

Ruoli ammessi:

- `808`;
- `harmony`;
- `lead`;
- `unknown`;
- `none`.

L'analisi conserva ruolo/confidenza automatici e segnala che è stato applicato un override.

## Pitch bend → glide 808

Su track classificate `808`, i pitch bend semplici e monotoni possono essere ridotti a:

- `glideTo`;
- `glideTicks`.

Il pitch-bend range è configurabile; il default tecnico è 2 semitoni.

Pattern complessi, con cambio di direzione o target non rappresentabile, NON vengono forzati in un singolo glide: producono warning.

## Batch importer

```powershell
cd frontend
node .\strumenti\fame-neural-composer\midi\batch-import-midi.js `
  C:\corpus\raw `
  C:\corpus\items `
  C:\corpus\report.json `
  C:\corpus\import-options.json
```

Per ogni `*.mid` / `*.midi` cerca:

- `<nome>.provenance.json`;
- oppure `<nome>.mid.provenance.json`.

Il report separa:

- `imported` / commercial cleared;
- `technicalBlocked`;
- `rightsBlocked`;
- `missingProvenance`;
- `failed`.

Un file senza sidecar provenance non viene promosso a dataset item.

## Test

```powershell
cd frontend
node .\strumenti\fame-neural-composer\phase2-block2-smoke-test.js
```

Gate verificati:

- classificazione automatica `unknown`;
- override esplicito `unknown → 808`;
- glide 808 da pitch bend semplice;
- override invalido bloccato;
- bend complesso non forzato;
- batch con file cleared e file senza provenance.

## Restano aperti prima della chiusura FASE 2

- tempo map variabile;
- estrazione armonica / chord-note preservation verificata;
- manifest di corpus riproducibile;
- prova su un piccolo set di MIDI originali/licenziati reali;
- hardening sui casi SMF trovati nei dati veri.
