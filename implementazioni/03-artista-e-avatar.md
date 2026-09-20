# L'artista e il suo avatar

Chi sei: la faccia, i vestiti, il nome, la città da cui parti.

_I punti di questo argomento. L'indice di tutti sta in_ [`README.md`](README.md).

---

## 3 · Crea il tuo avatar

3. sezione "crea il tuo avatar":
   💇 Capelli
   Corti
   Fade
   Buzz cut
   Ricci
   Afro
   Treccine
   Dread
   Dread lunghe
   Dread corte
   Mullet
   Lunghi
   Cornrows
   Twist
   Durag
   🧢 Cappelli
   Niente
   Snapback
   Snapback laterale
   Snapback rovesciato
   Beanie
   Bucket
   Bandana
   Cappellino NY
   Cappellino LA
   👁 Occhi
   Normali
   Stretti
   Spalancati
   Socchiusi
   Sicuri
   Freddi
   colori:
   Marroni
   Neri
   Nocciola
   Azzurri
   Verdi
   Grigi
   🕶 Accessori
   Occhiali piccoli
   Occhiali grandi
   Occhiali neri
   Occhiali colorati
   Cuffie
   Orecchino
   Doppio orecchino
   Grillz oro
   Grillz diamanti
   Catena sottile
   Catena grossa
   Doppia catena
   👕 Vestiti
   Hoodie
   T-shirt
   Bomber
   Piumino
   Giacca pelle
   Giacca varsity
   Canotta
   Tuta
   Giacca elegante
   🖋 Tatuaggi
   Nessuno
   Lacrima
   Croce
   Rosa
   Corona
   Scritta sul collo
   Scritta sul viso
   Stelle
   Tattoo full neck

**Risulta già fatto.** La sezione «Il tuo artista» ha esattamente le sei categorie
chieste — Capelli, Cappelli, Occhi, Accessori, Vestiti, Tatuaggi
(`frontend/js/creator/options.js`) — e dentro c'è tutto l'elenco qui sopra, con qualche
voce in più: **cento opzioni** in tutto contro le settanta chieste. I capelli sono 18
invece di 14 (ci sono anche Rasati, A spazzola, Coda, Cappuccio su), i vestiti 11 invece
di 9 (Total black e Streetwear), e agli occhi si aggiungono la forma «come l'espressione»
e le sopracciglia.

Ogni opzione non è un'icona generica: è **il tuo ritratto** con quel solo elemento
cambiato, tagliato sul punto che conta — la calotta per i capelli, gli occhi per gli
occhiali, il petto per le catene (`cropRitratto()`).

**Come l'ho verificato**, perché «c'è nell'elenco» non vuol dire «si vede»: un'opzione
scritta in `data.js` che il ritratto non disegna è peggio che non averla — la scegli, non
succede niente, e sembra rotto il gioco. Quindi ho caricato il ritratto **fuori dal
browser** e ho generato i cento disegni una opzione alla volta, confrontandoli fra loro:
**cento su cento cambiano il disegno**, nessuna è muta. L'unica coppia che risultava
identica era «Come l'espressione» e «Normali», ed è giusta: con l'umore neutro gli occhi
dell'espressione *sono* quelli normali. Con «arrabbiato», «sorpreso» o «stanco» tornano
diversi — c'è una prova apposta.

Il controllo non è rimasto in un file di appunti: **sta dentro a `npm run prova`** del
frontend (`frontend/strumenti/prova.js`, sezione «il creatore: ogni opzione si deve
vedere»). Da adesso, chi aggiunge una voce all'elenco e si scorda di disegnarla se ne
accorge subito. C'è anche il controllo che l'elenco del punto 3 ci sia per nome, con
scritti i due o tre casi in cui il gioco usa un nome più lungo (il punto dice «Tuta», il
gioco «Tuta sportiva»): elencati apposta invece di allargare il confronto, se no la
prossima volta un buco vero passerebbe liscio.

**Quello che non ho potuto fare**: la passata a vista in Chrome, perché il browser era
chiuso. Il creatore l'avevo comunque aperto in Chrome oggi stesso, lavorando sulla
responsività, e la galleria e la barra delle categorie si disegnano; ma le cento opzioni
una per una le ho controllate col metodo qui sopra, non a occhio.

---

## Avaturn e il camerino MakeHuman, tutti e due

> «Avaturn voglio lo rendiamo UN 50/50, cioè chi non vuole andare a farsi tutta la trafila
> per fare Avaturn (anche se ovviamente dobbiamo fare di tutto per consigliarli a farlo)
> può benissimamente creare il suo avatar in game. FAI COESISTERE LE COSE.» (ALE)

**FATTO (20/09/2026)** — branch `task/avaturn-e-camerino-insieme`. Nel codice convivevano
già (la RISPOSTA del 15/09 lo diceva); qui è **confermato in partita** e scritto, com'era
chiesto, più una riga sulla card di Avaturn: «consigliato».

**Come funziona, visto in Chrome.** Nuova partita apre il creator
(`media/creator-rpg-v24/creator.html`) e la prima schermata è **«Come vuoi creare il tuo
artista?»** con due card: **01 · Avaturn** (editor esterno, «selfie opzionale, più
personalizzazione», da oggi con scritto *consigliato*) e **02 · MakeHuman** (editor del
gioco, «nessun selfie, editor completo, nel gioco»). Il tasto sotto è spento finché non
scegli («Seleziona un metodo»), poi dice «Continua con Avaturn →» o «Continua con MakeHuman
→».

- **MakeHuman** apre il camerino (`media/makehuman-camerino-v1/`, dentro al creator):
  carica il runtime in sei passi («6/6 — Carico modifier stack nativo MakeHuman…»), poi
  volto, corpo, capelli, pelle, guardaroba e la foto; alla conferma si passa all'identità.
  È anche la strada dell'**avvio rapido** («Preparo il tuo artista»: un preset maschile e
  la foto, senza toccare niente).
- **Avaturn** apre il camerino di prima (`camerino.html`) con il tasto «Modifica con
  Avaturn»: carica l'SDK da jsDelivr (`@avaturn/sdk`) e apre l'editor Avaturn in un iframe
  (`https://demo.avaturn.dev/?sdk=true`); all'export l'avatar (URL del modello, anteprima)
  torna nel camerino e da lì all'identità.
- **Si cambia idea senza perdere niente**: con un avatar già confermato le card dicono
  «Passa ad Avaturn →» / «Passa a MakeHuman →», e il personaggio di prima resta salvato
  finché non confermi il nuovo (`state.avatarPendingSource`, `completeAvatarCreation`).
- **In partita** i due sono la stessa cosa: una foto (`avatarPreviewImage`) sulla plancia,
  con una classe diversa per l'inquadratura (`pport-img-avaturn`,
  `pport-img-makehuman-deterministic` in `hub.js`); «Il tuo artista» dalla landing o dal
  menu riapre l'editor giusto (`avatarSource`: `avaturn` o `local`).

**Dove non sono 50/50, e va saputo.**

- Lo **Shop veste solo MakeHuman**: il reparto Vestiti («Lo Shop: il reparto Vestiti» in
  `02-interfaccia-e-telefono.md`) vende capi del catalogo MakeHuman, e con un avatar
  Avaturn lo dice. Vestire un avatar Avaturn vorrebbe dire comprare nel loro editor, che
  non è nostro.
- **Avaturn gira sul demo pubblico** (`demo.avaturn.dev`), che chiede un accesso Google o
  Discord dentro all'iframe: per il gioco sugli store serve un progetto Avaturn nostro
  (sottodominio e chiave), con la loro licenza. È una cosa da fare prima dell'uscita, non
  del codice.
- **MakeHuman ha bisogno del suo dataset** (`media/makehuman-editor-v1`, 2,8 GB, fuori dal
  pacchetto per gli store, `FUORI_DAL_PACCHETTO` in `strumenti/build.js`): finché non si
  decide come distribuirlo, la strada «nel gioco» funziona in sviluppo e non in un
  pacchetto pulito. Anche questa è una decisione da uscita: nessun foglio la porta ancora
  come voce sua, e andrebbe fra le decisioni di `implementazioni.md`.

**Provato** con Playwright sul Chrome installato a 1440 × 900: la schermata con le due card
e il tasto spento; MakeHuman → il camerino arriva al passo 6/6; Avaturn → «Modifica con
Avaturn» → l'SDK e l'iframe del demo si aprono (login Google/Discord dentro). Un controllo
in più nell'audit: le due card ci sono, Avaturn è quella consigliata, e il ponte del creator
distingue i due (`avatarSource`).

---
