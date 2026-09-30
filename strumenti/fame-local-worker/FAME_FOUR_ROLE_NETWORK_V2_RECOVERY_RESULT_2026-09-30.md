# FAME Four-Role Network V2 — risultato recovery semantico

Data: 30 settembre 2026.

Root recovery locale: `FAME_FOUR_ROLE_NETWORK_V2_RECOVERY_20260930_121630`.

Il recovery ha riusato gli output già accettati di Extractor + Anti-Bias dal pilot V2 originale e ha eseguito soltanto il Verifier.

Esito: `NEEDS_REVIEW`.

- Verifier: `REJECTED`;
- Integrator: non eseguito;
- nuove chiamate modello: 1.

Errore host: `VERIFIER_NONSUPPORTED_WITH_EVIDENCE`.

Il failure è semantico/contrattuale, non di trasporto. Per tutti e tre i claim il modello ha scelto `UNSUPPORTED` ma ha mantenuto evidence ID e ha scritto motivazioni che affermano esplicitamente che le evidenze sostengono il claim. Ha inoltre scelto `ESTABLISHED` per la domanda complessiva, mostrando che i verdict astratti `ESTABLISHED/NOT_ESTABLISHED` sono ambigui nel contesto della domanda.

Il risultato resta FAIL storico e non viene reinterpretato come PASS.

Correzione successiva V3:
- status claim espliciti: `EVIDENCE_SUPPORTS_CLAIM`, `EVIDENCE_DOES_NOT_SUPPORT_CLAIM`, `CLAIM_NEEDS_REWORK`;
- opzioni risposta con ID + significato testuale;
- expected answer resta host-only;
- Extractor non vede le opzioni di risposta;
- Verifier e Integrator vedono tutte le opzioni ma non quella attesa;
- Integrator deve essere coerente col Verifier;
- `U05` passa da evidence gate obbligatorio a contesto opzionale perché descrive il next step e non è necessario per rispondere alla domanda.
