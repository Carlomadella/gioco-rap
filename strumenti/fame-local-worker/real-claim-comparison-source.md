# Prossima prova: QA P2 in Cline, report unico numerato

Il report scelto è `OWNED_BEATS_AUDIO_TO_MIDI_P2_MEASUREMENT_PASS_2026-09-22.md`, congelato dal commit `5fc9330ef003be43cfbb2af8a63c13e7814ea870`. Snapshot in `cases/cline-p2-report.md`; SHA256 `566912bff9c497361f00ccb7f8a513461b4543bbd854ae9988ba508c8c7b49e9`.

È nuovo rispetto ai report dei probe Cline registrati (independent evaluation e Tsumugi), non una certificazione che il modello non lo abbia mai incontrato. Dichiarare eventuali precedenti esposizioni. Si valuta il contenuto del report P2 storico, non lo stato operativo corrente del progetto. Le precedenti prove e rubriche restano invariate.

## Procedura operatore

Dalla worktree sul branch feature/fame-neural-roadmap, aggiornare con `git pull --ff-only`, poi:

```powershell
python strumenti/fame-local-worker/cline_gptoss_p2_probe.py init --root "$HOME\FAME_CLINE_GPTOSS_P2_001"
```

Il comando prepara i file, senza chiamare il modello. Aprire in una nuova finestra VS Code **solo** la cartella:

```text
C:\Users\mycol\FAME_CLINE_GPTOSS_P2_001\desk
```

Nuova conversazione Cline, stessa configurazione osservata: Cline 4.1.20, Ollama 0.34.2, gpt-oss:20b, contesto UI 32768, Act, Web Search disattivato. Non confondere Auto Compact con Use Compact Prompt, assente nella UI osservata. Annotare eventuali differenze senza cambiarle silenziosamente. Auto-approve solo letture; approvare manualmente la scrittura di answer.json. Nessun terminale, browser o MCP per il compito.

Inviare una sola volta:

```text
Esegui il compito in TASK.md usando i file della scrivania. Salva il risultato richiesto in answer.json.
```

Non passare questa guida, codice del grader, rubriche o risultati attesi al modello. Nella desk ci sono soltanto incarichi, procedura, regola e report unico con ID incorporati. Conservare i log fuori dalla desk. Nessun suggerimento correttivo né Retry nel run misurato. Se il tool layer fallisce, registrare il primo esito; dopo 5 minuti senza completamento interrompere e annotare il motivo.

Compilare `operator/session.json` con ciò che si è realmente osservato, prima del grade. Non copiare automaticamente true dalla sessione precedente. Registrare durata se misurata; lasciare null se ignota. La normale approvazione Save non conta come suggerimento correttivo.

Controllo esterno, dal terminale della repo:

```powershell
python strumenti/fame-local-worker/cline_gptoss_p2_probe.py grade --root "$HOME\FAME_CLINE_GPTOSS_P2_001"
```

Salva `operator/evaluation.json` una sola volta. Se esiste già, leggerlo senza rilanciare grade:

```powershell
Get-Content -Raw -Encoding UTF8 "$HOME\FAME_CLINE_GPTOSS_P2_001\operator\evaluation.json"
```

## Criteri fissati prima della risposta

Quattro affermazioni: export su 12 family e overflow, durata reference del renderer, effetto storico non misurato e voti preservati, presunta autorizzazione training/batch. Ogni parte delle affermazioni composte richiede copertura. Rubrica host-only nel preparatore; hash del grader e file congelati registrati all'init e verificati al grade.

Il risultato separa:

- conclusione: `conclusionCorrect`;
- copertura: `coverage`;
- contesto aggiuntivo già verificato innocuo: `precisionWarnings`, non bloccante;
- citazioni fuori dagli insiemi verificati: `unreviewedEvidenceIds`, da ispezionare, senza dichiararle automaticamente false o innocue;
- contratto JSON, integrità file e attestazione della sessione.

Il PASS dell'artefatto richiede conclusioni corrette e copertura sufficiente, senza difetti di contratto o citazioni ancora da valutare. Le citazioni innocue superflue non provocano FAIL. Il limite di otto ID resta quello noto; ogni insieme necessario entra ampiamente nel limite.

`PASS_OPERATOR_ATTESTED` richiede anche la scheda sessione completa; `ARTIFACT_PASS_SESSION_UNVERIFIED` significa che il contenuto è corretto ma la sessione non è attestata completamente. Le attestazioni non sono verifiche indipendenti dei log. `FAIL` va letto insieme agli errori: una risposta assente non è un giudizio sulla semantica.

Nessuna nuova autorizzazione audio/training/batch131/produzione. Non confrontare direttamente la percentuale di quattro affermazioni con quella della rete di 14 agenti su un report diverso. Non modificare i criteri per ottenere un PASS dopo il primo run; eventuali audit sono separati.

## Verifica del preparatore/correttore

9 test con fixture simulate passati: copertura di tutte le parti, prove alternative della sintesi, aggiunta innocua non bloccante, falsa autorizzazione respinta, citazioni non valutate segnalate, ID invalidi, risultato salvato senza sovrascrittura, report alterato rifiutato. Nessuna inferenza Cline/Ollama eseguita dall'assistente.

```powershell
python -m unittest discover -s strumenti/fame-local-worker -p test_cline_gptoss_p2_probe.py -q
```

## Dopo il run

Leggere evaluation e log, registrare separatamente completamento, conclusioni, copertura, precisione, interventi e tempi. Un esito buono giustifica altri compiti ristretti; non dimostra ancora affidabilità generale o vantaggio di tempo. In caso di failure, diagnosticare la classe senza ripetere il caso per promuoverlo retroattivamente.
