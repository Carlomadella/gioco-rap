# Audit delle 14 rubriche — 23 settembre 2026

## Esito e limiti

Audit documentale del report congelato `cases/independent-evaluation-report.md`, della relativa rubrica e dei validator v6/coordinatore/recovery al commit `7b37ce44960c7c21338553057104b0e828fb1aff`. Nessuna nuova inferenza, apertura audio, training o promozione operativa. Gli esiti sul PC sono output forniti dall'operatore, non file acquisiti indipendentemente.

Il giudizio precedente «SEMANTIC_FAIL prova che il modello non comprende» sarebbe scorretto: il codice usa la stessa etichetta per conclusioni errate, prove incomplete e diversi difetti delle citazioni. Inoltre le rubriche enumerano righe ammesse; non sono un verificatore semantico generale.

Il modello del recovery cita E147–E154, comprese E152 («Due ipotesi tecniche ... compatibili con il failure»), E153 e E154. Questo insieme sostiene per contesto l'incertezza causale. E155 la dichiara direttamente. Accettiamo il primo insieme come **supporto contestuale post-hoc**, mantenendo distinta la forza della prova. E153–E154 senza E152 non sono un'alternativa sufficiente secondo questa revisione.

Questo non dimostra che qualunque menzione di ipotesi escluda una causa verificata: la valutazione è specifica al report congelato completo, che non contiene una successiva conferma della causa. Non esportare questa equivalenza come regola universale.

## Audit per incarico

I numeri seguenti sono righe fisiche del report congelato, non numeri E. Le alternative già presenti restano valide; nessuna nuova informazione è passata al modello.

| Incarico | Copertura richiesta e prove verificate | Decisione audit / controesempio da respingere |
|---|---|---|
| TECHNICAL_ONLY | Riga 43 distingue integrità e qualità musicale. | Mantenere. Il solo PASS tecnico (260) non dimostra la distinzione. |
| DRUMS_FAIL | 69: 8/12; 60: requisito 9/12; 71: FAIL. Sintesi 262 copre confronto e fallimento. | Mantenere alternativa già presente. Totale 18 (70) o FAIL senza soglia/conteggio non coprono tutto. |
| LOWEND_PASS | 84: mediana 3; 85: 10/12; 87: PASS. Sintesi 263 copre tutte le parti. | Mantenere. Totale 28 non sostituisce mediana o conteggio. |
| COHORT_CONSUMED | 23 o 267/305: consumo e divieto di nuova evaluation dopo modifiche. | Mantenere. La mera identificazione del cohort non basta. |
| AUTHORIZATION_CLOSED | 100–102: batch, training, readiness. 307 riassume tutti e tre. | Mantenere. «Batch non acceduto» non equivale ai tre vincoli di autorizzazione. |
| ONSET_CAUSE_UNKNOWN | 147 esplicita che assenze udite non localizzano il detector come causa. | Mantenere criterio diretto nel caso esaminato. Elenco dei colpi mancanti e parametri onset non dimostrano da soli l'incertezza causale. |
| SINGLE_LABEL_LIMIT | 166 o 265 per single-label; 168 per kick simultaneo aggiunto dalla fusion. | Mantenere entrambe le parti. Lista delle tre classi non prova da sola single-label; single-label non vieta simultaneità finale. |
| FUSION_BENEFIT_UNISOLATED | 194 richiede confronto controllato; 266 dice che contributo causale e beneficio non sono isolati. | Mantenere alternative già presenti. Recuperi percepiti o falsi kick da soli non provano beneficio netto. |
| LOWEND_CAUSES_UNPROVEN | Release: 217. Note alte: 235 diretto; aggiunta alternativa contestuale **230+232+233**. | Correggere solo nel sidecar. La parte note alte non sostituisce quella release; parametri numerici da soli non bastano. |
| RENDERER_LIMITS | 245: JSON senza rilettura MIDI; 250: effetto sui voti non misurato. | Mantenere entrambe. Durata/attacco del renderer non documentano da soli mancata misura dell'effetto. |
| TECHNICAL_PROVES_MUSICAL_QUALITY | Contraddetta da 43. | supported=false. Il PASS tecnico non autorizza supported=true. |
| ONSET_ROOT_CAUSE_PROVEN | Contraddetta dal limite epistemico in 147. | supported=false. Eventi mancanti non localizzano una causa provata. |
| FUSION_NET_BENEFIT_PROVEN | Contraddetta da 194/266. | supported=false. Apprezzamenti del reviewer non sono un'ablation. |
| BATCH_AUTHORIZED | Contraddetta da 100/307 e dalla decisione operativa. | supported=false. Completamento della valutazione non autorizza il batch. |

L'audit copre tutte le 14 affermazioni e il testo completo. Non certifica che gli insiemi enumerati esauriscano ogni possibile parafrasi o combinazione di prove. Per gli altri incarichi non è emerso dagli output esaminati un falso rifiuto che giustifichi modificare i criteri. Le false affermazioni mantengono il contratto originale supported=false, evidenceIds=[]; la loro accettazione non misura la capacità di citare una confutazione.

## Separazione dei risultati

`qa_rubric_audit.py` è un rivalutatore locale separato; non modifica i validator congelati. Restituisce:

- `conclusion`: CORRECT / INCORRECT / UNKNOWN;
- `evidence`: DIRECT / CONTEXTUAL / INSUFFICIENT / NOT_REQUIRED / NOT_ASSESSED;
- `surplusEvidenceIds`: citazioni non necessarie secondo la rubrica, separate dal giudizio;
- stato originale e relativi errori, sempre conservati.

Il tool verifica prima richieste, risposte e ricevute usando il protocollo originale. Scrive soltanto in una nuova cartella separata. Non unisce nuove risposte a quelle storiche e non promuove la rete operativa.

Dal contenuto incollato dall'operatore: release recovery = prova diretta E145; note alte recovery = supporto contestuale E152+E153+E154. Quindi la rivalutazione documentale del recovery sarebbe 2/2, mentre il risultato congelato resta 1/2. La rete originale resta 13/14 anche nel sidecar: la risposta iniziale non copriva la release. Non chiamare questo «14/14 al primo tentativo» né nuova evaluation indipendente.

La selezione del modello resta poco precisa: cinque ID del blocco E147–E154 non contribuiscono alla nuova copertura; il ragionamento testuale conta erroneamente un insieme e omette E155 nella risposta finale. Questi sono difetti osservabili di selezione, non prova di saturazione del contesto o di una causa interna certa. Il limite di 8 ID può aver influito; una singola risposta non ne dimostra il ruolo causale.

## Comandi PowerShell — nessuna chiamata Ollama

Dopo `git pull --ff-only`, dalla worktree:

```powershell
python strumenti/fame-local-worker/qa_rubric_audit.py --source "$HOME\FAME_AGENT_NETWORK_001" --out "$HOME\FAME_AGENT_NETWORK_AUDIT_001"
```

Poi, per il recovery:

```powershell
python strumenti/fame-local-worker/qa_rubric_audit.py --source "$HOME\FAME_AGENT_RECOVERY_001" --out "$HOME\FAME_AGENT_RECOVERY_AUDIT_001"
```

Ogni cartella di output deve essere nuova. Il risultato è `audit.json`. In caso di errore di integrità non modificare hash o ricevute: conservare l'errore e verificare la fonte. I controlli hash sono locali, non firme indipendenti.

## Prossimo checkpoint

Prima confrontare i due audit con gli esiti documentali attesi sopra. Poi congelare un protocollo che distingua correttezza della conclusione, copertura e precisione delle citazioni. Solo dopo preparare un nuovo report con rubriche dirette e alternative contestuali definite prima delle risposte del modello, inclusi casi negativi. Nessun ulteriore retry sul caso noto per dichiarare generalizzazione. L'accettazione contestuale è una scelta di valutazione esplicita, rivedibile, non un nuovo successo sperimentale indipendente.

## Test

Dalla cartella strumenti/fame-local-worker:

```powershell
python -m unittest test_qa_coordinator test_qa_recovery test_qa_rubric_audit -q
```

Test con client simulati: riferimenti per tutte le 14 categorie, controlli negativi, risposta reale del recovery riprodotta come fixture, necessità di tutti i componenti contestuali, omissione release respinta, ID invalidi e conservazione byte per byte della fonte durante il sidecar. Nessuna inferenza reale eseguita dall'assistente.
