# FAME Local Worker — chiusura del percorso Cline e isolamento runtime

Data: 2026-09-23.

## Decisione

Non eseguire altri retry o probe Cline sullo stesso problema per cercare un PASS.

Le prove hanno mostrato due failure classi indipendenti:

1. **tool layer Cline**: tool-call JSON malformate e richieste di shell nonostante il task read-only;
2. **ragionamento semantico**: nel diagnostico compatto Tsumugi il modello ha completato l'artefatto ma ha classificato correttamente solo 2/4 binding runtime.

Il packaging a file unico ha permesso di arrivare ad `audit.json`, ma non ha eliminato gli errori di tool-call e non ha corretto i due errori semantici.

## Strategia

Il percorso operativo FAME Local Worker passa al client diretto Ollama gia presente in `agent.py`.

Il modello:
- non riceve tool;
- non sceglie file o comandi;
- riceve uno snapshot preparato dall'host;
- restituisce JSON sotto schema;
- viene validato dall'host;
- non puo trasformare un output errato in un'azione autorizzata.

Per isolare Cline dal modello, `direct_tsumugi_contract_audit.py` ripete **una sola volta** lo stesso audit Tsumugi tramite `/api/chat` locale, senza Cline e senza retry. Non e una nuova independent evaluation.

Interpretazione:
- PASS 4/4 diretto: il precedente 2/4 e compatibile con un effetto del runtime/prompting Cline;
- REJECTED con gli stessi errori o altri errori semantici: il limite appartiene al modello/task anche senza Cline;
- ERROR operativo: problema del direct runtime/preflight, da correggere prima di valutare il modello.

Dopo questo isolamento non si continua a ripetere lo stesso caso. Le decisioni successive riguardano architettura del worker e selezione/scomposizione dei task, non il recupero retroattivo dei probe consumati.

## Esito isolamento diretto

Run operator-reported: `FAME_DIRECT_TSUMUGI_CONTRACT_001`.

Comando diretto con `gpt-oss:20b`, una sola chiamata Ollama, nessun tool e nessun retry:

- `status=PASS`;
- `artifactCorrect=true`;
- `modelCalls=1`;
- stessa rubrica congelata dei quattro binding runtime Tsumugi.

Questo diagnostico non e una nuova independent evaluation e non dimostra causalita esclusiva di Cline, perche il runtime e il framing diretto differiscono. Dimostra pero che lo stesso modello, sullo stesso contenuto/rubrica, puo completare correttamente il task quando Cline e rimosso dal percorso.

Decisione operativa: per FAME Local Worker i task QA strutturati passano al runtime diretto Ollama con snapshot host-side, schema JSON e validatore esterno. Cline resta evidenza storica/strumento separato, non il runtime di produzione del worker.
