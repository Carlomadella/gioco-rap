# Anni di Fame — Roadmap di Gameplay

Simulatore di carriera rap a settimane, singolo file HTML (menù, profilo, gameplay).
Artifact esistente: https://claude.ai/code/artifact/9994ada6-fecb-4023-a5a5-019c2f46af89
(da aggiornare passandolo come `url`, mai crearne uno nuovo).

## Regole permanenti (valgono per ogni fase)

- **Tutto dev'essere interattivo** — nessuna riga da database, solo scene e card da gioco.
- **Tutto personalizzabile** — titoli brani, copertine, nome d'arte, logo li scelgono i giocatori.
- **Look professionale e autentico** — direzione "app di streaming" (nero pieno, colori accesi, tipografia grossa, copertine colorate). Niente elementi copiati da Spotify.
- **Scalata realistica** — non si diventa famosi in fretta; conta gestione, scelte e sfide.
- Livelli di fama: Sconosciuto → Rapper esordiente → Rapper emergente → Rapper → Star → Man of the Year → GOAT.

---

## PRIMO PACCHETTO DI BUILD (in lavorazione)

Blocco unico attorno alla carriera, deciso con Alessio:

1. **Carriera & Fama** (Fase 2) — soglie, momentum/hype, peso brani, traguardi, barra progresso.
2. **LaFamegram** (Fase 6) — social integrato nella carriera come motore dell'hype.
3. **Team / Manager** (Fase 3) — manager, fonico, producer con stipendio settimanale.
4. **Rivalità** (Fase 9) — rapper rivali in classifica, feat, beef/dissing.
5. Più il resto già approvato, aggiunto man mano.
   > Bloccante: serve il file HTML attuale allegato in sessione per costruire senza perdere il lavoro esistente.

---

## Fase 0 — Base attuale (fatta)

Avatar (ritratto + figura intera, tagli, cappelli, espressioni), direzione grafica approvata, struttura a settimane, menù e profilo. Nel profilo "stile" = genere musicale.

## Fase 1 — Mappa d'Italia & Fan _(approvata, prossima)_

- Fan per città che crescono con uscite, concerti e social.
- Sblocco città con concerti / andando in tendenza lì; città-roccaforti che rendono di più.
- Tour: pianifichi le tappe, ogni concerto è un mini-evento.

## Fase 2 — Carriera & Fama _(primo blocco scelto)_

- Soglie per livello (fan + ascolti + reputazione, non soldi).
- Momentum/hype settimanale: scende se non fai nulla, sotto soglia la fama cala.
- Peso dei brani: pezzo forte = salto, pezzo debole = freno; rischio flop reale.
- Traguardi per livello che sbloccano nuove azioni.
- Barra di progresso verso il livello successivo, sempre visibile.

## Fase 3 — Team

- Manager (più opportunità/contratti), Fonico (alza qualità mix), Producer (beat migliori).
- Stipendio settimanale → legato all'economia; si potenziano/licenziano; i migliori si sbloccano salendo di fama.

## Fase 4 — Fare musica: scene giocabili

- **Scrivi barre**: nella stanza con l'avatar, il giocatore digita le sue barre (il gioco le valuta, non le scrive).
- **Cerca un beat**: libreria grande di loop reali; il beat influenza mood e qualità.
- **Beat maker**: comporre con i suoni registrati nello studio.
- **Freestyle in piazza**: sfida a tempo sotto pressione.
- Qualità brano = più fattori (barre + beat + benessere + skill + fonico).
- Il brano finale esiste davvero come audio; titolo e copertina scelti/caricati dal giocatore.

## Fase 5 — Strategia di rilascio _(importantissima)_

- Rollout a fasi: teaser → annuncio data → snippet → uscita; saltare fasi = pezzo "freddo".
- Formato: singolo (tenere caldo) / EP-mixtape (crescere) / album (salto di livello, più pezzi pronti).
- Timing & concorrenza: la data conta, uscire contro un rivale forte è un rischio.
- Hype pre-uscita → picco di ascolti al drop; senza hype = flop, momentum giù.

## Fase 6 — LaFamegram (finto Instagram)

- Feed proprio: post (teaser, lifestyle, dietro le quinte, dissing) con reazioni dei fan.
- Follower legati alla mappa d'Italia; motore dell'hype tra un'uscita e l'altra.
- Commenti vivi di superfan / casual / hater; puoi rispondere, ignorare o rispondere con un pezzo.
- Il rollout delle uscite si posta qui (lega social e strategia di rilascio).
- Profilo personalizzabile; traguardo di crescita con badge brandizzato La Fame (niente spunta copiata).

## Fase 7 — Economia & Lifestyle

- Spese settimanali fisse legate al lifestyle; benessere e lifestyle collegati.
- Il lavoro dà soldi ma toglie benessere e abbassa il rendimento → capire quando mollarlo.
- Entrate: streaming, concerti, merch, feat pagati. Spese che alzano lifestyle ma bruciano cassa.

## Fase 8 — Abilità & gestione del tempo

- Skill che crescono con l'uso: Scrittura, Flow, Produzione, Business, Carisma.
- Punti azione settimanali limitati: scrivere, registrare, concerto, social, riposo.
- Burnout se spingi troppo (tono hustle/sacrificio, non vizi).

## Fase 9 — Relazioni, rivali, feat & beef

- Rapper rivali in classifica: li superi o ti superano.
- Feat: chiedi collab, patteggi le condizioni; nomi grossi = boost enorme ma difficile.
- Beef/dissing: eventi a scelte, puoi rispondere con un pezzo (torna su "scrivi barre").
- Reputazione doppia: strada vs mainstream.

## Fase 10 — Traguardi da industria & meta

- Dischi d'oro/platino a soglie di ascolti; premi (cerimonie come eventi, lega a "Man of the Year").
- Placement in playlist/radio che moltiplica gli ascolti.
- Trend: ogni stagione un genere va di moda; i fan hanno gusti, cambiare troppo li allontana.

## Fase 11 — Rifiniture

- Videoclip (costa, alza hype; mini-scelte su budget/location/ospiti).
- Fanbase viva (superfan/casual/hater); identità (nome d'arte, crew, logo).
- Vita fuori dalla musica (famiglia, amici del team) — tempo vs benessere/storia.

---

## Riferimenti di qualità

Grafica/feel da eguagliare: Rap Star Idle Clicker, Score Hero, Brawl Stars, Fortnite, Rematch. Avatar espressivo nel mood di Inazuma Eleven. Gameplay di riferimento: Il Nuovo Goat (ilnuovogoat.it).

## Team

Alessio (La Fame Studio), Claude, Carletto (scarica il progetto e ci lavora da casa con Claude Plus).

## Nota tecnica

Per costruire serve il file HTML attuale del gioco allegato in sessione: la lettura diretta dell'artifact è bloccata dalla rete dell'ambiente.
