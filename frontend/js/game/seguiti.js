/* Remastered e parti 2 — la coda del punto di CARLO «Non e' piu': "Faccio un
   pezzo → +10 fama"»: «e' possibile controllare come stanno andando le
   canzoni nel tempo da un'app del telefono per sapere se stanno invecchiando
   bene o male e magari farci delle remastered o parti 2».

   La Discografia (ui.js, sul telefono e nella linguetta) e' dove si **decide**:
   su un pezzo vecchio compaiono due tasti. Il lavoro pero' si fa in Studio,
   come tutto il resto:

   - **Parte 2** — si prenota da qui, e il prossimo pezzo che incidi in Cabina
     nasce «<titolo> pt. 2», legato al primo (`seguitoDi`). Quando esce, la
     gente che aveva ascoltato il primo va a sentire il secondo
     (`seguitoAscolti`, in sim.js accanto al feat), e il primo **torna a
     girare**: la sua curva ricomincia da capo a meta' forza (`rilancio`).
   - **Remastered** — si prenota da qui e si chiude al banco del Mix, con il
     fonico che hai dietro al vetro: costa una sessione (energia come il mix,
     piu' la sala), il pezzo guadagna qualche punto di qualita' e riparte come
     se fosse appena uscito, quasi (`rilancio` a forza piena meno un pezzo).
     Una volta sola per pezzo.

   Le eta' minime ci sono perche' una parte 2 di un pezzo uscito ieri non e' una
   parte 2, e' un altro pezzo: il tasto compare quando la curva e' gia' scesa. */
"use strict";

const SEGUITO_ETA_MIN = 8;         /* settimane fuori prima che si possa prenotare la parte 2 */
const REMASTER_ETA_MIN = 12;       /* e la remastered: a dodici la curva e' a un quinto */
const REMASTER_ENERGIA = 24;       /* come «Mixa il pezzo» */
const REMASTER_COSTO = 80;         /* la sala per la sessione */
const SEGUITO_ASCOLTI = 0.015;     /* quanta parte degli ascolti del primo va a sentire il secondo, a settimana */
const RILANCIO_PARTE2 = 0.45;      /* la curva del primo ricomincia, a questa forza, quando esce la parte 2 */
const RILANCIO_REMASTER = 0.8;     /* e a questa quando lo rimasterizzi */
const SEGUITO_TITOLO_MAX = 26;     /* lo stesso tetto di chiediTitolo */

/* ==================== CHI E' DI CHI ==================== */
function seguitoEta(s){
  return typeof totalWeeks === "function" ? totalWeeks() - (s.week || 0) : 0;
}
/* il primo pezzo, di cui `s` e' la parte 2 */
function seguitoOriginale(s){
  if(!s || s.seguitoDi == null) return null;
  return (G.songs || []).find(x => x.seed === s.seguitoDi) || null;
}
/* la parte 2 di `orig`, uscita o ancora sul banco */
function seguitoParte2(orig){
  if(!orig) return null;
  return (G.songs || []).find(x => x.seguitoDi === orig.seed) || null;
}
function seguitoPrenotato(){
  const d = G && G.studio;
  if(!d || d.seguito == null) return null;
  const s = (G.songs || []).find(x => x.seed === d.seguito && x.released) || null;
  /* prenotata su un pezzo che ha gia' la sua parte 2 (un salvataggio a meta'): si lascia cadere */
  if(!s || seguitoParte2(s)){ d.seguito = null; return null; }
  return s;
}
function remasterPrenotato(){
  const d = G && G.studio;
  if(!d || d.remaster == null) return null;
  const s = (G.songs || []).find(x => x.seed === d.remaster && x.released) || null;
  if(!s || s.remaster){ d.remaster = null; return null; }
  return s;
}

/* ==================== SI PUO'? ==================== */
/* Niente parte 3: la parte 2 di una parte 2 e' un altro pezzo, e il tasto
   non c'e'. */
function discoPuoParte2(s){
  return !!(s && s.released && s.seguitoDi == null && !seguitoParte2(s) &&
    seguitoEta(s) >= SEGUITO_ETA_MIN);
}
function discoPuoRemaster(s){
  return !!(s && s.released && !s.remaster && seguitoEta(s) >= REMASTER_ETA_MIN);
}

/* ==================== LA PARTE 2 ==================== */
function seguitoTitolo(){
  const s = seguitoPrenotato();
  if(!s) return null;
  const coda = " pt. 2";
  return s.t.slice(0, SEGUITO_TITOLO_MAX - coda.length).trimEnd() + coda;
}
function discoPrenotaParte2(seed){
  const s = (G.songs || []).find(x => x.seed === seed);
  if(!discoPuoParte2(s)) return false;
  if(!G.studio) G.studio = {};
  G.studio.seguito = seed;
  if(typeof toast === "function")
    toast("La <b>parte 2</b> di «" + s.t + "»: la scrivi e la incidi <b>in Cabina</b>, il titolo è già suo",
      "good", "2", typeof TINTA_STUDIO !== "undefined" ? TINTA_STUDIO : ["#8B5CF6", "#1D1030"]);
  if(typeof SFX === "object" && SFX.tap) SFX.tap();
  save();
  return true;
}
function discoLasciaParte2(){
  if(!G.studio || G.studio.seguito == null) return;
  G.studio.seguito = null;
  if(typeof SFX === "object" && SFX.tap) SFX.tap();
  save();
}
/* Il pezzo appena inciso (actions.js, `registra`): se c'era una parte 2
   prenotata, e' lui. */
function seguitoIncidi(s2){
  const orig = seguitoPrenotato();
  if(!orig || !s2) return null;
  s2.seguitoDi = orig.seed;
  G.studio.seguito = null;
  return orig;
}
/* Il pezzo esce (`pubblica` in actions.js, l'uscita del venerdi' in
   studio-elementi.js): se e' una parte 2, il primo torna a girare. */
function seguitoUscita(s2){
  const orig = seguitoOriginale(s2);
  if(!orig || !orig.released) return null;
  orig.rilancio = totalWeeks();
  orig.rilancioForza = RILANCIO_PARTE2;
  pushLog("<b>«" + orig.t + "» torna a girare.</b> La parte 2 ha rimesso in piedi anche la prima.", "good");
  return orig;
}

/* ==================== LA REMASTERED ==================== */
function discoPrenotaRemaster(seed){
  const s = (G.songs || []).find(x => x.seed === seed);
  if(!discoPuoRemaster(s)) return false;
  if(!G.studio) G.studio = {};
  G.studio.remaster = seed;
  if(typeof toast === "function")
    toast("«" + s.t + "» va <b>al banco del Mix</b>: la remastered si chiude in Studio",
      "good", "↻", typeof TINTA_STUDIO !== "undefined" ? TINTA_STUDIO : ["#8B5CF6", "#1D1030"]);
  if(typeof SFX === "object" && SFX.tap) SFX.tap();
  save();
  return true;
}
function discoLasciaRemaster(){
  if(!G.studio || G.studio.remaster == null) return;
  G.studio.remaster = null;
  if(typeof SFX === "object" && SFX.tap) SFX.tap();
  save();
}
/* Quanto guadagna: meta' del mix di adesso (il pezzo un mix l'aveva gia'),
   mai meno di tre, piu' il fonico dietro al vetro — e' per lui che vale
   tornare in Studio a farla. */
function remasterGuadagno(){
  const base = typeof mixGain === "function" ? mixGain() : 6;
  const fon = typeof studioAiutoFonico === "function" ? studioAiutoFonico() : 0;
  return Math.max(3, Math.round(base * 0.5)) + fon;
}
/* Il lavoro vero, chiamato dalla mossa `remaster` di actions.js. */
function remasterChiudi(){
  const s = remasterPrenotato();
  if(!s) return null;
  const g = remasterGuadagno();
  const prima = s.q;
  s.q = clamp(s.q + g, 5, 100);
  s.remaster = totalWeeks();
  s.rilancio = totalWeeks();
  s.rilancioForza = RILANCIO_REMASTER;
  if(s.parti) s.parti.remaster = g;
  G.studio.remaster = null;
  return {s, prima, g};
}

/* ==================== LA CURVA CHE RICOMINCIA ====================
   sim.js la chiama al posto della sola `exp(-eta/7.5)`: un pezzo rilanciato
   vale il massimo fra la sua curva vecchia e una curva nuova, che parte dalla
   settimana del rilancio alla forza scritta sul pezzo. */
function curvaPezzo(s, age){
  let curva = age <= 1 ? 1 : Math.exp(-age / 7.5);
  if(s && s.rilancio != null){
    const da = totalWeeks() - s.rilancio;
    if(da >= 0){
      const nuova = (da <= 1 ? 1 : Math.exp(-da / 7.5)) * (s.rilancioForza || RILANCIO_PARTE2);
      curva = Math.max(curva, nuova);
    }
  }
  return curva;
}
/* La gente del primo che va a sentire il secondo: una parte degli ascolti
   totali del primo, ogni settimana, che segue la curva del secondo come il
   feat segue la sua. */
function seguitoAscolti(s){
  const orig = seguitoOriginale(s);
  if(!orig) return 0;
  return (orig.streams || 0) * SEGUITO_ASCOLTI * (0.5 + (s.q || 0) / 170);
}

/* ==================== NELLA DISCOGRAFIA ====================
   La riga di ogni pezzo (renderDiscografia, ui.js): un'etichetta se e' una
   parte 2 o una remastered, e i tasti, se se ne puo' fare una. */
function discoEsc(t){
  return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}
function discoSeguitiRiga(s){
  if(!s || !s.released) return "";
  const tag = [];
  const orig = seguitoOriginale(s);
  if(orig) tag.push('<i class="dtag">parte 2 di «' + discoEsc(orig.t) + '»</i>');
  if(s.remaster) tag.push('<i class="dtag oro">remastered</i>');
  const p2 = seguitoParte2(s);
  if(p2) tag.push('<i class="dtag">' + (p2.released ? 'ha la sua parte 2' : 'la parte 2 è sul banco') + '</i>');

  const tasti = [];
  const pren = seguitoPrenotato(), rem = remasterPrenotato();
  if(pren === s)
    tasti.push('<span class="dpren">parte 2 prenotata: in Cabina</span>' +
      '<button type="button" class="dbtn" data-disco-lascia="p2">lascia</button>');
  else if(discoPuoParte2(s))
    tasti.push('<button type="button" class="dbtn" data-disco-p2="' + s.seed + '"' +
      (pren ? ' title="C’è già una parte 2 prenotata: questa la sostituisce"' : '') + '>Parte 2</button>');
  if(rem === s)
    tasti.push('<span class="dpren">remastered prenotata: al Mix</span>' +
      '<button type="button" class="dbtn" data-disco-lascia="rm">lascia</button>');
  else if(discoPuoRemaster(s))
    tasti.push('<button type="button" class="dbtn" data-disco-rm="' + s.seed + '">Remastered</button>');

  if(!tag.length && !tasti.length) return "";
  return '<span class="dazioni">' + tag.join("") + tasti.join("") + '</span>';
}
/* Il pezzo e' giovane e non ha ancora niente: la nota in fondo lo dice, cosi'
   i tasti non sembrano mancare a caso. */
function discoSeguitiNota(fuori){
  if(!fuori || !fuori.length) return "";
  if(fuori.some(s => discoPuoParte2(s) || discoPuoRemaster(s) || s.remaster || s.seguitoDi != null)) return "";
  return ' Da <b>' + SEGUITO_ETA_MIN + ' settimane</b> in su un pezzo si può continuare con una <b>parte 2</b>; ' +
    'da <b>' + REMASTER_ETA_MIN + '</b> si può <b>rimasterizzare</b>.';
}

/* ==================== NELLO STUDIO ==================== */
/* La riga sopra alla Cabina quando c'e' una parte 2 prenotata. */
function seguitoCabinaNota(){
  const s = seguitoPrenotato();
  if(!s) return "";
  return '<p class="stnota stseguito">Quello che incidi adesso è la <b>parte 2</b> di «<b>' +
    discoEsc(s.t) + '</b>»: si chiamerà «' + discoEsc(seguitoTitolo()) + '», e quando esce ' +
    'rimette in piedi anche la prima.</p>';
}
/* Il pannello al banco del Mix quando c'e' una remastered prenotata. */
function remasterPannello(){
  const s = remasterPrenotato();
  if(!s) return "";
  const g = remasterGuadagno();
  const fon = typeof studioFonico === "function" ? studioFonico() : null;
  const aiuto = typeof studioAiuto === "function" ? studioAiuto(fon) : 0;
  return stPan("",
    stCapo("Rimasterizzi", s.t, "q" + s.q) +
    '<p class="stnota">Uscito ' + seguitoEta(s) + ' settimane fa, ' + short(s.streams || 0) +
      ' ascolti. La remastered lo <b>rimette in giro</b> come nuovo, quasi, e gli lascia i punti ' +
      'del banco: ' + REMASTER_ENERGIA + ' energie e ' + fmt(REMASTER_COSTO) + ' € di sala.</p>' +
    stEsito(stFreccia() + ' ' + stOro("q" + clamp(s.q + g, 5, 100)) + ' · ' + stNum("+" + g) +
      (fon ? ', di cui ' + stNum("+" + aiuto) + ' di ' + discoEsc(fon.n) : ', da solo') +
      ' · <b>torna a girare</b>') +
    stAzioni(
      stSecondo(' data-disco-lascia="rm"', "Lascia stare", "rinnova"),
      stPrimo(' data-az="remaster"', "Chiudi la remastered", "spunta")));
}

/* ==================== I TASTI ==================== */
/* La discografia e' un nodo solo (#g-disco) che il telefono si porta dentro
   e restituisce al magazzino: l'ascoltatore ci resta sopra ovunque vada. Lo
   Studio ha il suo ascoltatore su #studio: «Lascia stare» del Mix ci arriva
   da la', con lo stesso attributo. */
function discoSeguitiTasto(t){
  if(!t) return false;
  if(t.dataset.discoP2 != null){ discoPrenotaParte2(Number(t.dataset.discoP2)); }
  else if(t.dataset.discoRm != null){ discoPrenotaRemaster(Number(t.dataset.discoRm)); }
  else if(t.dataset.discoLascia === "p2"){ discoLasciaParte2(); }
  else if(t.dataset.discoLascia === "rm"){ discoLasciaRemaster(); }
  else return false;
  if(typeof renderGioco === "function") renderGioco();
  if(typeof renderStudio === "function") renderStudio();
  return true;
}
if(typeof document !== "undefined" && typeof $ === "function"){
  const disco = $("g-disco");
  if(disco) disco.addEventListener("click", e => {
    discoSeguitiTasto(e.target.closest("[data-disco-p2],[data-disco-rm],[data-disco-lascia]"));
  });
  const studio = $("studio");
  if(studio) studio.addEventListener("click", e => {
    discoSeguitiTasto(e.target.closest("[data-disco-lascia]"));
  });
}
