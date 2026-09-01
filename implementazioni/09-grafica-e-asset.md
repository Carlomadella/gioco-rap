# La grafica, le ambientazioni e gli asset

Come deve sembrare, e il materiale che serve per farlo sembrare così.

_I punti di questo argomento. L'indice di tutti sta in_ [`README.md`](README.md).

---

## 38 · Ogni parte del gioco deve avere la sua ambientazione

38. Ogni parte di gioco deve avere proprio scenario e una propria ambientazione

Preparami un prompt da mettere su chat gpt ; per ogni pagina che abbiamo (es.attività criminali, es. studio, es.casa (vita quotidiana), es. luogo dove incontriamo artisti. )

Anche per la pagina di landing, e per la creazione dell'avatar, Non mettere un prompt unico ma pagine separate.

---

## La grafica uguale alla foto, e l'avatar segnaposto

Migliora la grafica e dell ' interfaccia rendila uguale identica alla foto chiamata "schermata_di_gioco", se esiste un metodo migliore della foto in background provalo.
Come avatar metti un segnaposto di un personaggio preso dalla foto chiamata "avatar_profilo_carnagione_chiara"

---

## La Fame Studio dentro al gioco, senza essere invadente

Dobbiamo pensare a un modo per mettere La Fame Studio il più possibile nel ggioco. Quindi ti chiedo come potremmo aggiungerla, ad esempio gli studi dove si va il migliore potremmo mettere che si chiama la fame studio. Insomma tutta roba che faccia branding. Ovviamente non deve sembrare invadente, anzi, solo piacevole quando leggono 'La Fame Studio'.

---

## Gli asset arrivati da fuori

--- ASSET NUOVI, FUORI DAI PUNTI NUMERATI (01/09/2026) ---

Nessun punto chiesto qui dentro: due file HTML mandati da fuori
(`~/Downloads/anni-di-fame-menu-2026(1)-integrato-finale.html` e
`...-sfondi-urban.html`) erano due concept completi di una **landing page
nuova** (menu con un hero a schermo intero, sfondo che cambia a scene, un
dock con le stesse voci di oggi: carriera, artista, regole, classifiche,
impostazioni) — codice e basta, con dentro cinque foto a testa incollate come
base64. Estratte, riconvertite in JPEG (erano PNG da ~2 MB l'una, adesso
300-500 KB) e salvate in `frontend/media/photo/`:

- **Serie A** (dal file "integrato-finale"): `landing_a_provincia_urban.jpg`,
  `landing_a_garage.jpg`, `landing_a_specchio.jpg`, `landing_a_infopoint.jpg`,
  `landing_a_street_league.jpg`.
- **Serie B** (dal file "sfondi-urban"): `landing_b_vicolo_graffiti.jpg`,
  `landing_b_skate_spot.jpg`, `landing_b_negozio_angolo.jpg`,
  `landing_b_rooftop_session.jpg`, `landing_b_ferrovia.jpg`.

Due serie alternative della stessa idea, non dieci sfondi diversi: si sceglie
quale delle due (o si mischiano i pezzi migliori) quando si rifà la landing
page vera (punto 4, ancora aperto). Ho controllato ogni foto a occhio prima
di salvarla — il nome del file dice cosa c'è dentro, non è un'estrazione alla
cieca.

**Nota tecnica lasciata scritta apposta**: la shell di questo ambiente è zsh,
dove gli array partono dall'indice **1** e non da 0 come in bash — un primo
giro di conversione con `${ARR[$((i-1))]}` ha sfasato i nomi di un posto
(e `sips` ha pure duplicato un paio di file quando l'ho rifatto in fretta).
Corretto controllando l'MD5 di ogni PNG sorgente contro quello copiato prima
di convertirlo: tutti e dieci sono unici e nel posto giusto, verificato due
volte. Se in futuro si scrivono script di conversione batch su questa
macchina, l'indicizzazione degli array è il primo sospettato.
`npm run prova` (12/12) pulito con i file nuovi dentro.

---

## 51 · Un prompt per ogni card, e dove sono finiti quelli del 38

51. Scrivimi un prompt per ogni card di gioco, e che fine hanno fatto i prompt del punto 38 del file implementazioni.md? TROVIAMOLI E RIPORTAMELI. RISCRIVIMELI .

   **Non erano persi — solo la nota che lo diceva.** `prompt-ambientazioni.md`
   è sempre stato in radice del repo, intatto: quello che è sparito è la
   riga sotto al punto 38 di questo file che lo diceva, ripulita insieme a
   tutte le altre note FATTO. Controllato adesso (01/09/2026): **16
   prompt**, e coprono già **tutte e dodici le card di gioco** una per una
   — scrivi barre (6), cerca un beat (11), registra (4), mixa (5), pubblica
   (12), promo (13), freestyle in piazza (14), live (15), cerca lavoro/turno
   (16), stacca la spina (9), palestra (8) — più La Sala (3), la casa (7),
   il vicolo delle attività criminali (10), la landing (1) e la creazione
   avatar (2). Niente da riscrivere: il file è già quello richiesto.

---

## 67 · Meno colori nella schermata di gioco

67. Ci sono troppi colori nella schermata principale di gioco. A differenza di quella del menù che è
    più su pochi colori e difatti l'inquadratura mi piace molto, è bella clean.

    **FATTO in parte (01/09/2026)** — le dodici mosse della settimana (`scene-art.js`) avevano
    ognuna due tinte sue per il bordo e lo sfondo della card (`--a`/`--b` in `game.css`): otto tinte
    diverse su dodici card, una specie di arcobaleno ogni volta che si guardava la griglia intera —
    l'opposto del nero-e-oro della landing. Raggruppate in **quattro famiglie con un senso**
    (`TINTA_STUDIO`, `TINTA_HUSTLE`, `TINTA_SUONO`, `TINTA_VITA` in `scene-art.js`): viola per chi
    scrive e produce in studio (scrivi, registra, mixa, pubblica), oro per chi fa muovere soldi e
    occasioni (promo, cerca lavoro, turno), ciano per il suono e il palco (cerca un beat, freestyle,
    live), verde per la vita fuori dalla musica (stacca la spina, palestra). Gli stessi colori
    vanno anche nel toast delle mosse rapide (`ART`, `ui.js`), così il popup dopo il tap non stona
    col colore della card appena premuta.
    **In parte** perché non ho toccato i disegni SVG delle scenette (i dettagli dentro ogni
    illustrazione — cuori, note, luci di scena — restano colorati come prima, sono il contenuto
    dell'arte, non il suo involucro) né i colori della fascia in alto (soldi/hype/fama/network/
    benessere, che servono a distinguerli al volo e non affollano la schermata come dodici card
    fianco a fianco). Toccare anche quelli è un lavoro diverso, di ridisegno vero.
    **Bug trovato mentre lo facevo**: le quattro tinte erano dichiarate dentro alla funzione che
    chiude `SC` (una IIFE), quindi invisibili da fuori — `ui.js` che le leggeva per `ART` mandava in
    errore tutto il file (`TINTA_STUDIO is not defined`), il che a sua volta rompeva `renderGioco` e
    la settimana intera. Spostate fuori dalla IIFE, verificato in Chrome che la griglia delle mosse
    torna a disegnarsi (11 card) e che le scene a pagina piena (punto 58) partono ancora bene.
    Occasione buona anche per alzare il numero di versione dei file (`?v=8` → `?v=9` in
    `index.html`): con lo stesso numero il browser aveva tenuto in cache la versione rotta anche
    dopo la correzione.

---

