Kimi:
GAMEPLAY & MECCANICHE (1–10)

    Sistema meteo stagionale — La pioggia o la neve influenzano l'affluenza ai live, il mood di scrittura e gli eventi disponibili. Aggiunge varietà senza complicare le meccaniche core.
    Rap battle a turni con deck building leggero — Invece del freestyle istantaneo, il giocatore sceglie 3 "barre" (carte) da un mazzo che cresce con la skill Scrittura. Più strategico, meno random.
    Crew / collettivo gestibile — Oltre ai contatti singoli, poter fondare una crew con altri rapper (bot o reali). Bonus di hype se la crew è in classifica, ma tensioni interne se un membro firma per una major.
    Sistema di "rumor" e gossip — Eventi casuali dove si spargono voci (vere o false) su di te o sui rivali. Puoi ignorarle, smentirle con un post o rispondere con un diss track. Impatta reputazione e hype.
    Demo tape / press kit — Prima di cercare contratti, puoi creare una demo tape (3 pezzi) da mandare alle label. La qualità della demo influenza l'offerta. Aggiunge un passo strategico prima della firma.
    Tour manager come ruolo contatto — Un contatto specifico che sblocca il "tour" tra città italiane (layer geografico sotto la mappa hub). Senza di lui, i live restano locali.
    Sistema di "one-hit wonder" vs "cult artist" — Se pubblichi un pezzo forte e poi sparisci per settimane, diventi un one-hit wonder (hype alto ma instabile). Se costruisci gradualmente, diventi "cult" (fan fedeli, hype stabile). Diversi ending.
    Casa discografica propria (endgame) — A Los Angeles, dopo il GOAT, puoi fondare una label. Il gameplay cambia: non scrivi più barre, ma scouti talenti, firmi artisti e gestisci il loro hype. Loop infinito.
    Sistema di "era" per album — Ogni album definisce un'era con look, genere e mood specifici. Cambiare troppo spesso era confonde i fan, restare troppo fermo li annoia. Bilanciamento chiaro.
    Cypher online asincrono — I giocatori registrano 16 barre (testo + beat scelto), il server le mescola in un cypher virtuale. Votazione della community, classifica settimanale del cypher.

🌐 SOCIAL, MULTIPLAYER & COMMUNITY (11–20)

    Guild / crew cross-player — Formare crew con giocatori reali. La classifica ha una colonna "Crew" e i membri condividono bonus (es. +5% hype se tutti pubblicano nello stesso mese).
    Mercato beat P2P — I giocatori possono vendere i beat che compongono nel beat maker ad altri giocatori per soldi virtuali. Il server tiene una borsa beat con prezzi dinamici.
    Sfide "Verzuz" asincrone — Scegli un opp, entrambi selezionate 3 pezzi dal catalogo, il server calcola il vincitore in base a stream + hype + qualità. Il risultato genera un post su LaFamegram.
    Radio in-game curata dai giocatori — Ogni settimana i 10 pezzi più ascoltati entrano in "LaFame Radio". Ascoltare la radio dà bonus hype al proprio pezzo se lo mandi in playlist.
    Sistema mentor / rookie — I giocatori di alto livello possono "prendere sotto la loro ala" un rookie. Il mentor guadagna un badge, il rookie sblocca consigli e contatti più in fretta.
    Eventi live globali del server — "Festival estivo", "Notte di Sanremo parallela", "Halloween Cypher". Eventi a tempo limitato dove tutti i giocatori partecipano per traguardi esclusivi.
    Hall of Fame perenne — Oltre all'albo d'oro stagionale, una hall of fame per i GOAT di ogni stagione, con il loro nome, la crew e il pezzo più ascoltato. Visibile da tutti.
    Sistema di "co-firma" per feat — Quando fai un feat con un altro giocatore reale, il pezzo compare in entrambi i cataloghi e gli stream si dividono (60/40 o 50/50). Il server gestisce il contratto.
    Chat di quartiere / città — Canali di chat legati alla città in cui gioca il rapper. I bot scrivono messaggi generati, i giocatori reali possono rispondere. Crea senso di comunità locale.
    Sistema di "bounty" sui rivali — Mettere una taglia (hype o soldi) su un opp in classifica: chi lo supera entro X settimane vince la taglia. Economia player-driven.

🎨 UX, UI & ACCESSIBILITÀ (21–30)

    Modale "Cosa è successo mentre eri via" — Al rientro dopo giorni, una schermata riassume: settimane passate, posizione in classifica, notizie, messaggi. Non lasciare il giocatore disorientato.
    Tema ad alto contrasto e font leggibile — Per accessibilità, un tema WCAG-compliant con contrasto 4.5:1 minimo e font sans-serif ingrandibile. Essenziale per gli store.
    Tutorial contestuale a bolle — Invece di un tutorial frontale, bolle che appaiono la prima volta che clicchi su "Studio" o "La Sala". Più leggero, non blocca il gioco.
    Modalità "Stream Deck" ottimizzata — Layout orizzontale specifico per Steam Deck con bottoni grandi, navigazione pad completa (D-pad + A/B) e testo leggibile a 1280×800.
    Widget telefono "always on" ridotto — Sul desktop, il telefono a destra può diventare una barra laterale compatta che mostra solo notifiche, hype e messaggi non letti. Si espande al click.
    Animazioni "juice" sulle azioni — Quando pubblichi un pezzo, una piccola animazione della copertina che "esplode" in stream. Quando sali in classifica, effetto ▲ con suono. Feedback immediato.
    Quick actions dalla testata — Tasti rapidi per le 3 azioni più usate dall'utente (es. "Scrivi barre", "Cerca beat", "Vai in studio") direttamente nella fascia in alto, senza aprire la mappa.
    Filtri e ricerca nel catalogo — Con tanti pezzi, serve cercare per genere, anno, qualità, stato (pubblicato/grezzo). Ordinamento per stream, data, qualità.
    Confronto side-by-side dei beat — Quando compri un beat, poter confrontare 2-3 beat in parallelo con anteprima audio, BPM, qualità e prezzo. Riduce l'attrito d'acquisto.
    Haptic feedback su mobile — Vibrazione leggera al tap sui bottoni, più intensa quando sali di livello o pubblichi un pezzo. Usare l'API Vibration di Capacitor.

⚙️ TECNICO, ARCHITETTURA & PERFORMANCE (31–40)

    Service Worker per offline mode — Cache delle risorse statiche. Se il giocatore perde connessione, può comunque giocare in locale e sincronizzare al ritorno online. Fondamentale per mobile.
    Lazy loading delle mappe città — Caricare mappa_provincia.jpg subito, ma mappa_milano.jpg e mappa_losangeles.jpg solo quando si sbloccano. Riduce il payload iniziale.
    Virtual scrolling per classifiche lunghe — Quando la classifica avrà migliaia di giocatori, renderGioco() non deve ridisegnare tutto. Virtual scroll o paginazione nella UI.
    Web Workers per il calcolo audio — Il beat maker e il generatore audio possono girare in un Web Worker per non bloccare il main thread, specialmente su telefoni economici.
    Compressione Brotli/Gzip nel build — Aggiungere al build script la compressione Brotli per i file statici. Su Steam il peso non conta, ma su mobile sì (Capacitor bundle).
    Sistema di patch delta — Invece di scaricare l'intero gioco ad ogni update, un sistema che scarica solo i file cambiati (basato su hash). Critico per mobile con dati limitati.
    Metriche e crash reporting — Integrare un sistema leggero di analytics (es. Plausible self-hosted o semplici log) e crash reporter per capire dove il gioco si rompe sui dispositivi reali.
    Automazione CI/CD con GitHub Actions — Build, test (npm run prova), lint e generazione artifact ad ogni push. Previene regressioni e velocizza i rilasci.
    Database read replica per classifiche — Quando passate a PostgreSQL, una replica in sola lettura per le query pesanti (classifica, feed, opps) mentre il master gestisce scritture e account.
    Rate limiting per endpoint sensibili — Oltre ai limiti attuali, aggiungere rate limit specifici per POST /api/punteggio (es. max 1/minuto) e POST /api/segnalazione (max 3/giorno) per prevenire abusi.

💰 MONETIZZAZIONE, MARKETING & RETENTION (41–50)

    DLC "Città Extra" — Dopo le 3 città base, vendere Berlino, Tokyo, Londra come DLC. Ogni città ha studi unici, contatti esclusivi e un pezzo di storia. Modello espansione, non pay-to-win.
    Season Pass "Anno di Fame" — Ogni stagione reale (3-4 mesi) un pass con traguardi esclusivi, skin per l'avatar, beat leggendari e un posto speciale sulla mappa. Gratuito vs premium.
    Merchandising in-game → reale — I giocatori possono progettare magliette e copertine nel gioco; con integrazione print-on-demand (es. Printful API) comprarle davvero. Revenue share.
    Soundtrack ufficiale vendibile — I beat del gioco (quelli generati proceduralmente) possono essere esportati come file audio e venduti come NFT-free digital download. Revenue per La Fame Studio.
    Cross-promo con artisti reali — Eventi speciali dove artisti emergenti italiani appaiono come contatti speciali nel gioco. Loro ottengono visibilità, voi contenuto esclusivo e marketing condiviso.
    Referral program — Invita un amico, entrambi ricevete un beat esclusivo o +10% hype per una settimana. Tracciato via codice referral nel backend.
    Modalità "Storia" narrativa — Campagna a pagamento con storyline scritta, scelte moralità e ending multipli. Diverso dalla sandbox infinita. Vendibile come DLC narrativo.
    Analytics di retention — Tracciare D1, D7, D30 retention e i punti in cui i giocatori abbandonano (es. dopo quante settimane senza contratto). Dati per bilanciare la difficoltà.
    Localizzazione in spagnolo e francese — Il rap è globale. Tradurre l'interfaccia e i nomi dei bot per mercati extra-UE. Il sistema lingua esiste già (js/lingua.js), va esteso.
    Demo time-limited su Steam — Versione demo con 4 settimane di gameplay, poi blocco che invita all'acquisto. La demo esiste già (npm run demo), ma va limitata nel tempo e condivisa su Steam.
