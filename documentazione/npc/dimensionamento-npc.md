# Dimensionamento NPC — riferimento per i punti 17–18

Fonte: `recap-simulazione-npc.md`, fornito dall'utente il 03/10/2026.
Il report dichiara 270 esecuzioni, 30 seed per ciascuno dei nove scenari,
sul commit `839c67fef7307b900b39ced3cfd363b585d1bedd`.
Qui è acquisito il recap, non il pacchetto con simulatore e dati grezzi:
i risultati sono riportati dalla fonte, non rieseguiti o verificati da questa
task. La base NPC corrente è successiva (`40b5423`).

| Durata interna | Profilo | Persone distinte, media | P05–P95 empirico | Massimo osservato |
| --- | --- | ---: | --- | ---: |
| 13 settimane | Prudente | 14,2 | 11–16 | 17 |
| 13 settimane | Equilibrato | 18 | 16–21 | 25 |
| 13 settimane | Esplorativo | 31,9 | 27–36 | 39 |
| 1 anno | Prudente | 36,7 | 20–59 | 68 |
| 1 anno | Equilibrato | 104,4 | 81–132 | 136 |
| 1 anno | Esplorativo | 185 | 155–214 | 216 |
| 3 anni | Prudente | 151,1 | 109–210 | 241 |
| 3 anni | Equilibrato | 305,3 | 260–342 | 367 |
| 3 anni | Esplorativo | 538,2 | 472–594 | 620 |

La misura conta identità incontrate una volta per ID, più fino a cinque ospiti
fissi del backstage. Non conta ogni ricomparsa come persona nuova. Non comprende
folla, fan anonimi o rivali solo visibili in classifica. Le persistenti
incontrate sono 99,4 in media nell'equilibrato annuale e 533,2 nell'esplorativo
triennale. Persone incontrate, persone create e visite sono misure diverse.

## Uso previsto, senza trasformare la stima in un tetto

- **300 identità**: proposta della fonte per carriere intorno a un anno.
- **800 identità**: proposta per gli scenari provati fino a tre anni.
- Capacità di combinazione/generazione, non NPC da creare subito, non un
  limite oltre il quale eliminare persone conosciute o impedire incontri.
- Verificare nei punti 17–18 nomi e identità coerenti, riuso delle persone,
  crescita del salvataggio e costo dei selettori. Non serve simulare ogni
  giorno l'intera vita di 800 persone per consentire quella capacità.
- Valutare separatamente varietà di dialoghi, tratti, interessi e reti:
  questa simulazione non certifica la sufficienza del catalogo di personalità.

## Limiti da conservare nelle decisioni

Gli stili, le curve di fan/hype e la progressione lavorativa sono ipotesi.
Il modello assume sostenibili i viaggi accettati e conserva tutti gli incontri
di trasferta; non esegue economia/calendario completi. La Strada usa frequenze
ipotizzate; le detenzioni esplorative sono programmate e non consumano tempo
nel calendario. Non è un bot che ha giocato 270 carriere complete né una
misura dei giocatori reali. P05–P95 descrive i seed, non un intervallo di
confidenza della popolazione. I nuovi hub completi e le storyline future
non sono misurati; carriere oltre tre anni richiedono ulteriori verifiche.

I ruoli della distribuzione del report sono legacy: non usarli come quote
dirette di professioni. I suffissi numerici sono un segnale euristico di
esaurimento dei pool, non un conteggio provato di collisioni d'identità.
Non ricavare una media unica dei giocatori senza conoscere la distribuzione
dei loro stili. Per la generazione finale servono scenari aggiornati e i
dati riproducibili della simulazione, quando disponibili.
