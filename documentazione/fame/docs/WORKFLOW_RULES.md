# FAME WORKFLOW RULES

## Regola 1 — Prima di modificare
Leggere:
- FAME_MASTER_SPEC
- CURRENT_STATE
- DECISIONS
- REJECTED_APPROACHES
- spec del genere coinvolto

## Regola 2 — Ogni modifica deve dichiarare
- cosa cambia;
- cosa NON cambia;
- quale problema risolve;
- quali regressioni può introdurre.

## Regola 3 — Ogni modifica deve aggiornare
- codice;
- spec;
- CURRENT_STATE se cambia lo stato;
- DECISIONS se introduce una scelta architetturale;
- REJECTED_APPROACHES se scarta una strada;
- test;
- CHANGELOG.

## Regola 4 — Freeze
Se l'utente approva chiaramente un sottosistema:
marcarlo come FROZEN-DIRECTION o APPROVED.
Non riscriverlo insieme ad altri moduli senza motivo.

## Regola 5 — Test one subsystem at a time
Quando possibile:
- drums;
- drums+bass;
- harmony;
- lead;
- FX;
- full mix.

## Regola 6 — User ear > numeric audit
Se l'audit dice 0 violations ma il groove suona male:
il problema è ancora aperto.

## Regola 7 — Niente regressioni silenziose
Ogni nuova build deve elencare:
- FIXED
- CHANGED
- UNCHANGED / FROZEN
- KNOWN ISSUES

## Regola 8 — Niente memoria implicita
Una decisione importante detta in chat va trasferita qui prima della prossima fase.

## Regola 9 — No broad genre rollout too early
Prima si valida un sottosistema su un benchmark ristretto.
Poi si replica sugli altri generi.

## Regola 10 — Clean room
Studiare fonti e tecniche; reimplementare in modo indipendente.
