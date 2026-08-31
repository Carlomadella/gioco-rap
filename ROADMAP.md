# Anni di Fame — Roadmap di Gameplay

Simulatore di carriera rap a settimane. Il repository è la fonte: `index.html` + `css/` + `js/`.
Per l'artifact di Claude si ricompila tutto in un file solo con `python3 strumenti/build-artifact.py`
(esce `dist/anni-di-fame.html`).
Artifact esistente: https://claude.ai/code/artifact/9994ada6-fecb-4023-a5a5-019c2f46af89
(da aggiornare passandolo come `url`, mai crearne uno nuovo).

L'elenco puntuale dei lavori aperti sta in `implementazioni.md`: lì i punti si spuntano uno a uno,
qui c'è il disegno d'insieme.

## Regole permanenti (valgono per ogni fase)

- **Tutto dev'essere interattivo** — nessuna riga da database, solo scene e card da gioco.
- **Tutto personalizzabile** — titoli brani, copertine, nome d'arte, logo li scelgono i giocatori.
- **Look professionale e autentico** — direzione "app di streaming" (nero pieno, colori accesi, tipografia grossa, copertine colorate). Niente elementi copiati da Spotify.
- **Scalata realistica** — non si diventa famosi in fretta; conta gestione, scelte e sfide.
- **Si sblocca un mondo, non un menu** — ogni cosa nuova compare come un posto sulla mappa.
- **Niente studio personale** — per fare musica devi uscire, andare dagli altri e conoscere gente.
- Livelli di fama: Sconosciuto → Rapper esordiente → Rapper emergente → Rapper → Star → Man of the Year → GOAT.

---

## L'HUB: LA MAPPA A TRE CITTÀ _(direzione attuale — punto 26 di `implementazioni.md`)_

Da qui in avanti la schermata di gioco **è** una mappa che si allarga insieme al rapper.
Concept art in `media/photo/`: `schermata_di_gioco_città_iniziale.png`,
`schermata_di_gioco_città_di_mezzo.png`, `schermata_di_gioco_città_finale.png`.

### La schermata

Una sola interfaccia per tutte e tre le città — cambia il mondo in mezzo, non il modo di giocare,
così il giocatore impara una volta e poi vede solo espandersi il suo mondo.

```
┌─────────────────────────────────────────────────────────────────────┐
│ LOGO · nome, livello, fase · energia · soldi · hype · seguito       │
├─────────────────────────────────────────────────────────────────────┤
│                        NOME DELLA CITTÀ                             │
│                     la tua storia inizia qui                        │
│                                                                     │
│        LA MAPPA: i luoghi come punti da toccare, e quelli           │
│        ancora chiusi che dicono cosa serve per aprirli              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ MAPPA · CONTATTI · INVENTARIO · OBIETTIVI · STATISTICHE      ┌─────┐│
│ obiettivo attuale (x / y) · notizie della città              │CHAT │2│
└──────────────────────────────────────────────────────────────┴─────┘┘
```

- **In testata, il rapper**: chi sei e cosa hai, in mezzo secondo — nome, livello, fase e le
  quattro cose che contano. Una riga sola: la carta d'identità completa sta nel profilo.
- **La città, dominante**: i luoghi aperti e quelli ancora chiusi ben visibili
  («Club — sblocca a Milano»). Il giocatore deve vedere il mondo che lo aspetta.
- **Il telefono**: contatti, messaggi, chat. Serve a far sentire che la città vive anche
  quando non stai facendo niente.
- **In basso**: le linguette più la riga di cosa fare adesso e le notizie. Coerente con la
  ripulitura del punto 9 (una testata sola, i numeri che contano, il resto dietro un bottone).

### Le tre città

**1 · Città di provincia** — il nome lo scrive il giocatore («Da dove comincia la tua storia?»:
Rovereto, Vicenza, Bari, Catania…), così ogni partita parte da un posto suo.
Qui non sei nessuno: pochi soldi, poca fama, pochissimi contatti, pochi posti.
Sulla mappa: **studio** (registra, mixa, pubblica), **beat maker** (crea beat e alza le skill),
**vita quotidiana** (casa, relazioni, allenamento), **attività criminali** (piccoli rischi,
piccoli guadagni). Bloccati ma in vista: club, concerti.

**2 · Milano** — «la città delle opportunità». Si sblocca con più parametri insieme, non
grindandone uno solo: **livello ≥ 10, fama ≥ 50, hype ≥ 40**.
La mappa esplode: studi di registrazione professionali, manager, club & discoteche,
concerti & live, sponsor, business, shop, vita quotidiana, criminalità di livello superiore.

**3 · Los Angeles** — «solo per leggende». Ci arrivi da GOAT: **livello ≥ 30, fama ≥ 90,
hype ≥ 85, reputazione ≥ 80**.
Studi top tier, labels & A&R, eventi VIP, sponsor HQ con deal milionari, club esclusivi
su invito, casinò (dove i soldi si perdono anche in una serata), shop luxury, business
district, criminalità ad altissimo rischio.

### Gli studi non sono una skin

Ogni studio ha una qualità che entra nel calcolo del pezzo: provinciale ~40/100,
milanese ~75/100, leggendario ~95/100. Registrare nel posto giusto è una scelta economica.

### La rete di contatti è una risorsa

Il loop del gioco è: **cerco → mi muovo → conosco → creo rapporti → ottengo occasioni → miglioro**.
Un producer ti presenta un artista, l'artista un fonico, il fonico un altro studio.

Ogni contatto ha un **tipo** (producer, rapper, fonico, manager, organizzatore eventi,
proprietario di club, imprenditore, brand, contatti criminali) e un **grado**:
conoscenza → contatto → amico → collaboratore → fidato → partner.
Non tutti sono raggiungibili: un producer sconosciuto lo incontri andando in studio, uno
famoso può chiedere 70 di fama, 50 di hype e 3 contatti in comune.
Farmare contatti è gameplay, non un menu.

### Ordine di lavoro dell'hub

1. ~~Schermata hub con le linguette, la città di provincia e i suoi quattro luoghi; le azioni
   che esistono già (scrivi, beat, registra, pubblica, piazza) si aprono da lì.~~
   **FATTA (31/08/2026)** — `js/game/hub.js`, `css/hub.css`, e come mappa la concept art
   stessa (`media/photo/mappa_provincia.jpg`), con sopra le zone da toccare. Si entra dalla
   mappa; studio, beat maker e vita quotidiana aprono la partita sulla sezione giusta; club e
   concerti sono in vista e dicono cosa serve per Milano.
2. Anagrafica dei contatti: tipo, grado, come si sale, dove si incontrano.
3. Studi come luoghi con una qualità, dentro il calcolo del pezzo; via ogni residuo di studio proprio.
4. Milano: soglie di sblocco, luoghi nuovi, prezzi e qualità più alti.
5. Los Angeles: soglie, luoghi di lusso e di rischio, tetto della carriera.

---

## Fase 0 — Base attuale (fatta)

Avatar (ritratto e figura intera, tagli, cappelli, espressioni, otto preset e fondali),
direzione grafica approvata, struttura a settimane, menù e profilo, scrittura delle barre,
mercato dei beat con ascolto, freestyle in piazza, lifestyle, classifica, rivali.
Nel profilo "stile" = genere musicale.

Fatto di recente (dettagli in `implementazioni.md`):

- **Menu impostazioni** (punto 23): audio, aspetto e temi, preset di difficoltà, 3 slot partita,
  esporta/importa carriera, lingua italiano/inglese, diritti La Fame Studio.
- **Banco suoni rifatto** (punto 25, prima metà): compressore e riverbero, click d'aria, penna,
  celesta, tonfo di sala, fader, folla. Resta da variare di più i beat.
- **Schermata di gioco ripulita** (punto 9): una testata sola, tre numeri in vista, il contorno
  dietro «Dettagli», fase in fascia bassa, catalogo a linguette, lifestyle a categorie chiuse.

## Fase 1 — L'hub a mappa _(in corso: la provincia c'è)_

La sezione qui sopra. È il lavoro che viene prima di tutto il resto, perché tutto il resto
poi ci si attacca sopra come luogo della città. La città di partenza è costruita; restano
i contatti, la criminalità e le altre due città.

Dentro ci finisce anche la vecchia idea della **mappa d'Italia**, come strato successivo:
fan per città che crescono con uscite, concerti e social; città-roccaforti che rendono di più;
tour con tappe da pianificare. Non è più la schermata principale — è quello che succede
quando dalla provincia cominci a muoverti verso Milano.

## Fase 2 — Carriera & Fama

- Soglie per livello (fan + ascolti + reputazione, non soldi) — sono anche le chiavi delle città.
- Momentum/hype settimanale: scende se non fai nulla, sotto soglia la fama cala.
- Peso dei brani: pezzo forte = salto, pezzo debole = freno; rischio flop reale.
- Traguardi per livello che sbloccano nuove azioni.
- Barra di progresso verso il livello successivo, sempre visibile.
- L'energia cresce col livello: salire deve valere qualcosa, farmare non deve stufare (punto 22).

## Fase 3 — Contatti, team e producer

- I contatti (tipo e grado) sono la spina dorsale: manager, fonico e producer non si "comprano"
  in un negozio, si conoscono e si coltivano.
- Manager (più opportunità e contratti), fonico (alza la qualità del mix), producer (beat migliori),
  con stipendio settimanale → legato all'economia; si potenziano e si licenziano.
- I producer hanno abilità e una fama loro, in crescita (punto 20): la trattativa dipende dal
  rapporto che avete, dalla fama tua e sua, dal genere che produce e dal suo carattere.
- Se un producer collabora spesso con un opp, il beat non te lo fa (punto 8).

## Fase 4 — Fare musica: scene giocabili

- **Scrivi barre**: nella stanza con l'avatar, il giocatore digita le sue barre (il gioco le valuta,
  non le scrive); completamento assistito, che però costa qualcosa (punti 6 e 19).
- **Cerca un beat**: scena col produttore, scelta del genere, libreria grande di loop.
- **Beat maker**: comporre con i suoni registrati in studio.
- **Freestyle in piazza**: scena con la folla che applaude o fischia, gara contro il computer
  o contro un amico (punto 14).
- Qualità brano = più fattori (barre + beat + benessere + skill + fonico + **qualità dello studio**).
- Il brano finale esiste davvero come audio; titolo e copertina scelti o caricati dal giocatore.

## Fase 5 — Strategia di rilascio _(importantissima)_

- Rollout a fasi: teaser → annuncio data → snippet → uscita; saltare fasi = pezzo "freddo".
- Formato: singolo (tenere caldo) / EP-mixtape (crescere) / album (salto di livello, più pezzi pronti).
- Timing e concorrenza: la data conta, uscire contro un rivale forte è un rischio.
- Hype pre-uscita → picco di ascolti al drop; senza hype = flop, momentum giù.

## Fase 6 — LaFamegram (finto Instagram)

- Vive nel telefono, la colonna destra dell'hub, insieme a contatti e notizie.
- Feed proprio: post (teaser, lifestyle, dietro le quinte, dissing) con reazioni dei fan.
- Follower legati alla mappa; motore dell'hype tra un'uscita e l'altra.
- Commenti vivi di superfan / casual / hater; puoi rispondere, ignorare o rispondere con un pezzo.
- Il rollout delle uscite si posta qui (lega social e strategia di rilascio).
- Profilo personalizzabile; traguardo di crescita con badge brandizzato La Fame (niente spunta copiata).

## Fase 7 — Economia, lifestyle e criminalità

- Spese settimanali fisse legate al lifestyle; benessere e lifestyle collegati.
- Il lavoro dà soldi ma toglie benessere e abbassa il rendimento → capire quando mollarlo.
- Entrate: streaming, concerti, merch, feat pagati. Spese che alzano il lifestyle ma bruciano cassa.
- **Criminalità** come strada alternativa per soldi e, poi, fama (punto 21): piccoli colpi in
  provincia, colpi grossi a Milano, altissimo rischio a Los Angeles. Reputazione di strada
  che sale, e polizia e rivali che diventano un problema vero.
- A Los Angeles il casinò: si moltiplica o si perde tutto in una serata.

## Fase 8 — Abilità & gestione del tempo

- Skill che crescono con l'uso: Scrittura, Flow, Produzione, Business, Carisma, Networking.
- Punti azione settimanali limitati: scrivere, registrare, concerto, social, riposo, spostarsi.
- Burnout se spingi troppo (tono hustle/sacrificio, non vizi).

## Fase 9 — Relazioni, opps, feat & beef

- Rapper rivali, gli **opps**, in classifica: li superi o ti superano (punto 7).
- Feat: chiedi la collab, patteggi le condizioni; nomi grossi = boost enorme ma difficile — e passano
  dai contatti, non da un menu.
- Beef e dissing: eventi a scelte, puoi rispondere con un pezzo (torna su "scrivi barre").
- Reputazione doppia: strada contro mainstream.

## Fase 10 — Traguardi da industria & meta

- Dischi d'oro e di platino a soglie di ascolti; premi (cerimonie come eventi, lega a "Man of the Year").
- Placement in playlist e radio che moltiplica gli ascolti.
- Label e A&R a Los Angeles: la firma come traguardo, non come punto di partenza.
- Trend: ogni stagione un genere va di moda; i fan hanno gusti, cambiare troppo li allontana.

## Fase 11 — Rifiniture

- Videoclip (costa, alza l'hype; mini-scelte su budget, location, ospiti).
- Fanbase viva (superfan, casual, hater); identità (nome d'arte, crew, logo).
- Vita fuori dalla musica (famiglia, amici del team) — tempo contro benessere e storia.
- Il logo vero: semplice e riconoscibile. Le mappe generate restano Main Hub, non logo.

---

## Riferimenti di qualità

Grafica e feel da eguagliare: Rap Star Idle Clicker, Score Hero, Brawl Stars, Fortnite, Rematch.
Avatar espressivo nel mood di Inazuma Eleven. Gameplay di riferimento: Il Nuovo Goat (ilnuovogoat.it).
Per l'hub: la struttura da gestionale/RPG a tre colonne, non la mappa a tutto schermo.
Per lo stile della schermata di gioco: `stili interfaccia schermata di gioco.md`.

## Team

Alessio (La Fame Studio), Claude, Carletto (scarica il progetto e ci lavora da casa con Claude Plus).

## Nota tecnica

Il codice sorgente sta nel repo e si legge da lì: non serve più allegare l'HTML in sessione.
Quando si aggiorna l'artifact si ricompila con `strumenti/build-artifact.py` e si pubblica
`dist/anni-di-fame.html` sull'URL esistente.
