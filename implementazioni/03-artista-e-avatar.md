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
