/* Marketing del singolo: l'hype dell'artista resta in G.hype, mentre questa
   memoria appartiene al pezzo. Nasce separata per non far diventare una
   campagna pre-release un bonus permanente a tutta la carriera. */
"use strict";

const MARKETING_RELEASE_HYPE_MAX = 100;
const MARKETING_RELEASE_HYPE_ANTEPRIMA = 12;

/* Salvataggi vecchi: prima l'attesa era implicita nel numero di anteprime.
   Leggerla una volta migra il pezzo senza cambiare il risultato: 1/2/3
   anteprime = 12/24/36 punti = x1.12/x1.24/x1.36 alla prima settimana. */
function marketingReleaseHype(s){
  if(!s || typeof s !== "object") return 0;
  if(!Number.isFinite(Number(s.releaseHype))){
    const vecchieAnteprime = Math.max(0, Number(s.anteprime || 0));
    s.releaseHype = clamp(
      vecchieAnteprime * MARKETING_RELEASE_HYPE_ANTEPRIMA,
      0,
      MARKETING_RELEASE_HYPE_MAX
    );
  }else{
    s.releaseHype = clamp(Number(s.releaseHype), 0, MARKETING_RELEASE_HYPE_MAX);
  }
  return s.releaseHype;
}

function marketingAggiungiReleaseHype(s, punti){
  if(!s || typeof s !== "object") return 0;
  const prima = marketingReleaseHype(s);
  s.releaseHype = clamp(
    prima + Number(punti || 0),
    0,
    MARKETING_RELEASE_HYPE_MAX
  );
  return s.releaseHype;
}

function marketingSpintaUscita(s){
  return 1 + marketingReleaseHype(s) / 100;
}

/* Esplicite per test/browser e per i file caricati dopo questo. */
window.marketingReleaseHype = marketingReleaseHype;
window.marketingAggiungiReleaseHype = marketingAggiungiReleaseHype;
window.marketingSpintaUscita = marketingSpintaUscita;
