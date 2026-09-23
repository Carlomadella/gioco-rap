# Prossima prova Cline — P3/P4 con unita di evidenza semantiche

Questa prova nasce dal limite emerso nel P2: una singola frase sul renderer era stata spezzata in E019/E020/E021, per cui il grader misurava anche la ricomposizione artificiale della frase. Il FAIL storico P2 resta invariato; qui si cambia il formato del **nuovo** caso, non la rubrica passata.

Source congelata: `OWNED_BEATS_AUDIO_TO_MIDI_P3_P4_DECISION_2026-09-22.md`, snapshot `cases/cline-p3-p4-report.md`, SHA256 `f28a18435b95a4c21265dc5ee4ce57a50b38e572cb256fa424e11005595b775c`.

## Differenza metodologica

`report-units.md` assegna gli ID `Uxxx` a blocchi Markdown completi separati da righe vuote, saltando le sole intestazioni. Quindi una formula e la frase che ne spiega il significato restano nello stesso blocco quando appartengono allo stesso paragrafo; le liste drums e Decisione P4 restano blocchi interi.

Il grader continua a distinguere conclusione, copertura, warning benigni e citazioni non revisionate. Una conclusione composta puo richiedere due **unita semanticamente distinte** (per esempio decisione P4 + prossimo passo), ma non piu frammenti arbitrari della stessa frase.

## Procedura operatore

Dalla worktree aggiornata:

```powershell
python -m unittest test_cline_gptoss_p3_p4_semantic_probe -q
python cline_gptoss_p3_p4_semantic_probe.py init --root "$HOME\FAME_CLINE_GPTOSS_P3P4_SEMANTIC_001"
```

Aprire in una nuova finestra VS Code solo la cartella `desk` stampata dal comando.

Nuova conversazione Cline. Mantenere la stessa configurazione osservata se ancora invariata: Ollama, `gpt-oss:20b`, Act, Web Search OFF, auto-approve solo letture, scrittura `answer.json` approvata manualmente. Annotare le differenze reali invece di copiarle automaticamente.

Inviare una sola volta:

```text
Esegui il compito in TASK.md usando i file della scrivania. Salva il risultato richiesto in answer.json.
```

Nessun Retry, correzione o suggerimento. Non passare al modello questa guida, grader o risultati attesi.

Prima del grade compilare `operator/session.json` con quanto realmente osservato. Poi, una sola volta:

```powershell
python cline_gptoss_p3_p4_semantic_probe.py grade --root "$HOME\FAME_CLINE_GPTOSS_P3P4_SEMANTIC_001"
```

## Quattro decisioni QA

La prova controlla:

- diagnosi D02: classificazione vs transient detection;
- limite di rappresentazione sui colpi simultanei D04/D05;
- assenza di autorizzazione al threshold tuning dal solo sintetico;
- scope della prima variante P5: attivazioni indipendenti, con onset/export/renderer v2/low-end invariati.

Il quarto punto richiede due unita complete perche decisione architetturale e vincoli di implementazione sono espressi in due blocchi distinti del report. Questo e un requisito semantico reale, non una frase spezzata artificialmente.

Nessun risultato di questo probe autorizza training, batch131, P6 o produzione.
