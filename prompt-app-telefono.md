# Prompt per le app del telefono (uno per schermata, da incollare su ChatGPT)

Punto 42 di `implementazioni.md` — il telefono nella sidebar di destra, versione PC.
Qui non servono ambientazioni fotografiche come in `prompt-ambientazioni.md`: servono
**riferimenti di interfaccia** (UI concept, non scene) per ridisegnare ogni app che si
apre dentro alla cornice del telefono. Ogni sezione è un prompt **autosufficiente**:
copiala intera e incollala in una chat nuova di ChatGPT con generazione immagini —
non vanno unite fra loro, ogni app ha il suo contenuto e la sua gerarchia.

Cosa già esiste nel gioco (per restare coerenti, non per essere copiato): schermo
telefono verticale dentro una cornice iPhone con notch, sfondo quasi nero (#0B0D13),
card leggermente più chiare (#12151F) con bordo sottile bianco trasparente, accento
viola (#7C3AED) per lo stato attivo, rosso (#EF4444) per i badge di notifica, testo
bianco caldo (#E8EAF0) per i titoli e grigio (#8A90A0) per i sottotitoli, angoli
molto arrotondati (10-16px), nessuna ombra dura. Icone linea piena, non outline
sottili. Formato verticale, proporzione tipo iPhone (circa 9:19.5). **Nessun testo
reale nell'immagine** (il gioco ci scrive sopra i suoi dati veri): dove servirebbe
una scritta, disegna un blocco/placeholder grigio della forma giusta, non lettere.

---

## 1. Messaggi (il diario)

```
Disegna il concept UI di una schermata "Messages" per un'app di gioco mobile in
stile iOS scuro, dark mode elegante. È il diario di un personaggio di un gioco di
carriera rap: una lista verticale di notifiche/eventi della sua vita (non chat tra
persone). Ogni riga: un piccolo avatar tondo a sinistra, due righe di testo-placeholder
(un blocco più corto sopra grassetto, uno più lungo sotto grigio), un'etichetta breve
a destra tipo "settimana". Sfondo quasi nero, righe su card leggermente più chiare
con bordo sottilissimo, angoli molto arrotondati, accento viola acceso su una icona
di notifica in alto. Stile pulito, tanto respiro tra le righe, nessun testo reale
leggibile — solo blocchi placeholder della forma giusta. Formato verticale 9:19.5.
```

## 2. Contatti (la rete)

```
Disegna il concept UI di una schermata "Contacts" per un'app di gioco mobile in
stile iOS scuro. È la rete di conoscenze di un personaggio hip hop: una lista
verticale di persone, ognuna con un avatar tondo colorato diverso (colori accesi:
arancio, azzurro, viola, verde), un nome placeholder in grassetto, sotto un'etichetta
di ruolo/relazione più piccola e grigia (tipo "produttore · amico"), a destra un
numeretto con una piccola icona a forma di stella. In cima un badge grande con un
numero totale di contatti. Sfondo quasi nero, card con bordo sottile, tocco urban/
streetwear ma pulito, non ricco di decorazioni. Nessun testo reale leggibile, solo
placeholder. Formato verticale 9:19.5.
```

## 3. Notizie (il giornale del giro)

```
Disegna il concept UI di una schermata "News" per un'app di gioco mobile in stile
iOS scuro. È il giornale della scena musicale di una città: una lista verticale di
notizie brevi, ognuna con una piccola icona colorata a sinistra (megafono, sirena,
nota musicale, zaino) dentro un cerchietto, e a destra un blocco di 2 righe di testo
placeholder. Sensazione da bacheca cittadina/tabloid urbano ma minimal, non caotica.
Sfondo quasi nero, card scure con bordo sottile, accenti di colore solo sulle icone.
Nessun testo reale leggibile, solo placeholder. Formato verticale 9:19.5.
```

## 4. Obiettivi

```
Disegna il concept UI di una schermata "Goals" per un'app di gioco mobile in stile
iOS scuro. Lista verticale di obiettivi di carriera, ognuno con un'icona a forma di
mirino/bersaglio a sinistra, un titolo placeholder in grassetto, una descrizione più
piccola sotto, e a destra una pillola/badge: alcuni verdi con un segno di spunta
("fatto"), altri grigi con un simbolo "+" o una piccola ricompensa (fulmine, moneta).
Sensazione di progressione, da RPG leggero. Sfondo quasi nero, card scure, contrasto
netto tra obiettivi fatti (più spenti/trasparenti) e aperti (più vivi). Nessun testo
reale leggibile, solo placeholder. Formato verticale 9:19.5.
```

## 5. Inventario

```
Disegna il concept UI di una schermata "Inventory" per un'app di gioco mobile in
stile iOS scuro. In alto una barra di quattro linguette a pillola (una attiva in
viola pieno, le altre tre grigie e vuote). Sotto, una lista verticale di oggetti,
ognuno con una piccola icona diversa a sinistra (matita per testi scritti, nota
musicale per beat, microfono per pezzi, manopola per attrezzatura da studio), un
titolo placeholder, una riga descrittiva sotto più piccola, e un numero di qualità
a destra dentro un badge tondo. Estetica da inventario di gioco ma minimal, non
fantasy. Sfondo quasi nero, card scure. Nessun testo reale leggibile, solo
placeholder. Formato verticale 9:19.5.
```

## 6. Statistiche

```
Disegna il concept UI di una schermata "Stats" per un'app di gioco mobile in stile
iOS scuro. Colonna verticale di righe-statistica, ognuna con una piccola icona
colorata a sinistra (fulmine giallo per energia, cuore rosso per benessere, luna
viola per lucidità, fiamma arancio per hype, corona dorata per fama/fan, banconota
verde per i soldi), un'etichetta breve, un valore numerico grande a destra, e sotto
alcune righe una barra di progresso sottile colorata. In fondo un piccolo riquadro
con una nota testuale placeholder su due righe. Sfondo quasi nero, sensazione da
cruscotto/dashboard di un videogioco gestionale, ordinata e leggibile a colpo
d'occhio. Nessun testo reale leggibile, solo placeholder. Formato verticale 9:19.5.
```

## 7. Classifiche

```
Disegna il concept UI di una schermata "Charts" per un'app di gioco mobile in stile
iOS scuro. In cima un riquadro evidenziato con la posizione dell'utente in classifica
(un numero enorme preceduto da "#") e una piccola freccia verde verso l'alto accanto.
Sotto, una lista verticale in stile classifica musicale: numero di posizione a
sinistra, un piccolo avatar/copertina quadrata, un nome artista placeholder in
grassetto e una città/genere sotto più piccolo, a destra un valore numerico (stream)
e una freccina su/giù colorata. Una riga della lista è evidenziata con un bordo
viola acceso (è "l'utente" in mezzo agli altri). Sfondo quasi nero, energia da
classifica hip hop vera. Nessun testo reale leggibile, solo placeholder. Formato
verticale 9:19.5.
```

## 8. Agenda (le mosse di oggi)

```
Disegna il concept UI di una schermata "Today" per un'app di gioco mobile in stile
iOS scuro. Due sezioni verticali separate da un titoletto: in alto "Stasera" con 2-3
righe evento (icona colorata a sinistra dentro un cerchietto, titolo e descrizione,
un orario a destra tipo "21:00"); sotto "Le tue mosse" con una lista più lunga di
azioni disponibili, ogni riga con titolo, descrizione breve, e a destra un piccolo
badge con un'icona a fulmine e un numero (costo energia). Alcune righe più spente/
disabilitate (costo troppo alto). Sfondo quasi nero, sensazione da agenda/planner di
un rapper indipendente. Nessun testo reale leggibile, solo placeholder. Formato
verticale 9:19.5.
```

## 9. Impostazioni (dentro al telefono)

```
Disegna il concept UI di una schermata "Settings" compatta per un'app di gioco
mobile in stile iOS scuro. Poche righe verticali essenziali: una riga con icona nota
musicale e un interruttore on/off a destra (acceso, viola); una riga con icona scudo
e un'etichetta di difficoltà; una riga con icona giornale e la lingua corrente. In
fondo un bottone pieno, largo quanto lo schermo, con angoli arrotondati, colore
viola acceso, per "apri tutte le impostazioni". Sfondo quasi nero, essenziale,
poco affollato. Nessun testo reale leggibile, solo placeholder. Formato verticale
9:19.5.
```

## 10. LaFamegram (il finto Instagram del gioco)

```
Disegna il concept UI di un feed social in stile Instagram ma per un gioco di
carriera rap chiamato "LaFamegram", dark mode. Colonna verticale di post: ogni post
è una card con angoli arrotondati, in testa un piccolo avatar tondo con un anello
sfumato arcobaleno (stile storie Instagram) più un nome placeholder in grassetto e
un orario piccolo grigio a destra; sotto un blocco di testo placeholder su 2 righe
(la didascalia); in fondo alla card un cuoricino rosso pieno con accanto un numero
di like in grassetto. Nessuna foto vera nei post, solo il testo placeholder — il
post è testuale, tipo "tweet lungo", non un'immagine. Sfondo quasi nero, energia da
social media ma coerente con l'estetica scura del resto dell'app. Nessun testo reale
leggibile, solo placeholder. Formato verticale 9:19.5.
```
