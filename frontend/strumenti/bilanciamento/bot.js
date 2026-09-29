/* Il bot del simulatore di bilanciamento: quello che gira DENTRO la pagina.

   È il bot del «giro di un anno» del 27/09/2026 (documentazione/problemi-riscontrati.md,
   «Giro del 27/09/2026»), portato dentro al browser: una giornata intera è una sola
   chiamata, così mille carriere stanno in una notte. Usa le stesse strade del giocatore —
   ACTIONS, GAME_TRAVEL, avviaAzioneDiretta, stradaTenta, ADF_TIME_SKIP(1) per chiudere
   la giornata — e mai scorciatoie sui numeri: se una curva è rotta, è rotta nel gioco.

   `installaBot` viene serializzata da Playwright e fatta girare nella pagina: niente
   require, niente variabili di fuori. Mette in `window.__SIM`:
     - semina(seme)          Math.random deterministico: la stessa carriera si rigioca uguale
     - giorno(strategia, g)  gioca un giorno e lo chiude; torna una fotografia dei numeri
     - STRATEGIE             i nomi, per il runner

   Le strategie sono giocatori «ragionevoli» con un'idea fissa; non giocano bene, giocano
   in modo riconoscibile. Il confronto fra loro è quello che dice se una curva è storta. */
"use strict";

function installaBot(){
  const attendi = ms => new Promise(r => setTimeout(r, ms));
  const on = id => { const el = document.getElementById(id); return !!(el && el.classList.contains("on")); };
  const conta = (tab, k) => { tab[k] = (tab[k] || 0) + 1; };

  /* le finestre che non sono eventi: la scelta della strofa (writer.js), i colloqui
     (actions.js) e il titolo del pezzo (copertine.js). Il bot prende la prima opzione
     e non le conta fra gli eventi. I titoli li tiene fermi l'audit. */
  const NON_EVENTI = ["Come la fai", "Colloqui", "Come lo chiami"];

  /* quello che resta aperto dopo un'azione o un salto: eventi, colloqui, il foglio,
     le schermate dei posti, gli overlay dei moduli eventi e crimine */
  function risolvi(sc){
    for(let giro = 0; giro < 25; giro++){
      if(on("modal")){
        const k = (document.getElementById("m-k") || {}).textContent || "";
        const bt = [...document.querySelectorAll("#m-opts button")].filter(b => !b.disabled);
        if(!bt.length){ sc.blocchi.push("modale senza bottoni: " + k); try{ chiudiModale(); }catch(e){} if(on("modal")) break; continue; }
        let i = 0;
        const evento = !NON_EVENTI.includes(k);
        if(evento && bt.length > 1) i = Math.floor(Math.random() * bt.length);
        if(evento) sc.eventi++;
        bt[i].click(); continue;
      }
      if(on("writer")){ document.getElementById("w-done").click(); continue; }
      let chiuso = false;
      for(const id of ["piazza","posto","strada","drawer","report","scena"]){
        if(on(id)){
          try{ chiudiInCima(); }catch(e){ sc.blocchi.push("chiudi " + id + ": " + e.message); }
          if(on(id)) document.getElementById(id).classList.remove("on");
          chiuso = true; break;
        }
      }
      if(chiuso) continue;
      if(typeof STRADA_SCENA !== "undefined" && STRADA_SCENA){ STRADA_SCENA = null; continue; }
      const alt = ["crimeModal","adf-result-overlay","adf-social-overlay"].map(id => document.getElementById(id))
        .find(el => el && (el.classList.contains("on") || el.classList.contains("show")));
      if(alt){
        const b = [...alt.querySelectorAll("button")].filter(b => !b.disabled && b.offsetParent !== null);
        if(b.length){ b[Math.floor(Math.random() * b.length)].click(); continue; }
        alt.classList.remove("on", "show"); continue;
      }
      const ban = document.getElementById("adf-social-banner");
      if(ban && ban.classList.contains("show")){
        const b = [...ban.querySelectorAll("button")].find(b => !b.disabled);
        if(b){ b.click(); continue; }
      }
      break;
    }
  }

  /* il pannello «Aspetta» del giocatore: il tempo passa a passi di mezz'ora,
     e un evento che si apre a metà si risolve come gli altri */
  function aspetta(sc, fino){
    const t0 = GAME_TIME.now();
    fino = Math.min(fino, GAME_TIME.DAY_END);
    if(fino - t0 < 1 || fino - t0 > 12 * 60) return false;
    while(GAME_TIME.now() < fino){
      const out = GAME_TIME.advance(Math.min(30, fino - GAME_TIME.now()), "wait-global", { detail: { manualWait: true, target: fino } });
      risolvi(sc);
      if(out && out.blocked) break;
    }
    conta(sc.azioni, "aspetta");
    return GAME_TIME.now() > t0;
  }

  /* se il posto o l'azione aprono più tardi oggi, il giocatore aspetta; se hanno
     già chiuso, no. Torna true se ha aspettato. */
  function aspettaApertura(sc, st, anticipo){
    if(!st || st.phase !== "before" || !isFinite(st.openAt)) return false;
    return aspetta(sc, st.openAt - (anticipo || 0));
  }

  const pronta = id => { const a = ACTIONS.find(x => x.id === id); return !!a && !(a.need && a.need()) && !(a.avail && !a.avail()); };

  /* un'azione come la fa il giocatore: ci va, controlla orari ed energia, la avvia */
  function prova(sc, id){
    const a = ACTIONS.find(x => x.id === id);
    let r = null;
    if(!a) r = "inesistente";
    else if(a.avail && !a.avail()) r = "non disponibile";
    else if(a.need && a.need()) r = "manca " + a.need();
    else {
      const req = GAME_TRAVEL.requiredPlaceForAction(id);
      if(req){
        let p = GAME_TRAVEL.go(req);
        if(!p.ok && p.reason === "arrival-closed" && aspettaApertura(sc, p.status, p.minutes)) p = GAME_TRAVEL.go(req);
        if(!p.ok) r = "viaggio " + (p.reason || "?") + (p.status && p.status.phase ? " (" + p.status.phase + ")" : "");
      }
      if(!r){
        let g = GAME_TRAVEL.actionAccess(id);
        if(!g.ok && g.reason === "hours" && aspettaApertura(sc, g.status)) g = GAME_TRAVEL.actionAccess(id);
        if(!g.ok) r = "orario/luogo " + g.reason + (g.status && g.status.phase ? " (" + g.status.phase + ")" : "");
        else if(G.energy < (a.dyn ? a.dyn() : a.e)) r = "energia";
        else if(a.money && G.money < a.money()) r = "soldi";
        else if(!avviaAzioneDiretta(id)) r = "rifiutata";
      }
    }
    risolvi(sc);
    if(r){ conta(sc.rifiuti, id + " · " + r); return false; }
    conta(sc.azioni, id);
    return true;
  }

  function compraBeat(sc, margine){
    if(G.beats.length) return;
    if(!G.market.length) prova(sc, "beat");
    const l = (G.market || []).filter(b => b.price <= G.money - margine).sort((a, b) => b.q - a.q);
    if(l[0]){ prendiBeatDalBanco(l[0]); conta(sc.azioni, "compra beat"); }
    risolvi(sc);
  }

  function registra(sc, margine){
    if(!(G.bars.length && G.beats.length && G.money >= margine)) return;
    const req = GAME_TRAVEL.requiredPlaceForAction("registra");
    if(req) GAME_TRAVEL.go(req);
    try{ if(typeof studioTakeManca === "function" && studioTakeManca()) studioTakeAncora(); }catch(e){}
    prova(sc, "registra");
  }

  /* la filiera della musica: scrivi, beat, cabina, mix, fuori */
  function musica(sc, o){
    o = o || {};
    if(G.bars.length < 3){ prova(sc, "scrivi"); if(!o.poco) prova(sc, "scrivi"); }
    compraBeat(sc, o.margine || 60);
    registra(sc, 50);
    /* mix e uscita si tentano quando c'è qualcosa: se no ogni giorno sono due
       rifiuti che non dicono niente */
    if(pronta("mixa")) prova(sc, "mixa");
    if(!o.trattieni && pronta("pubblica")) prova(sc, "pubblica");
  }

  /* l'anteprima come la fa il giocatore: su LaFamegram segna il pezzo pronto
     (G.studio.spingi), poi posta i quindici secondi. Quando non ne può fare altre,
     il pezzo esce. */
  function anteprime(sc){
    const pronti = typeof studioPronti === "function" ? studioPronti() : [];
    if(!pronti.length) return;
    const s = pronti[0];
    if(!studioDaAnticipare() && Number.isFinite(s.seed)){ studioSegna("spingi", s.seed); risolvi(sc); }
    if(pronta("anteprima")) prova(sc, "anteprima");
    else if(pronta("pubblica")) prova(sc, "pubblica");
  }

  const fuori = () => G.songs.some(s => s.released);
  const inCarcere = () => !!(G.strada && G.strada.arresto);

  function lavoro(sc, sempre){
    if(!G.job){ if(sempre || G.money < 400) prova(sc, "cercalavoro"); return; }
    if(sempre || ((G.shifts || 0) < 2 && (G.day === 2 || G.day === 4)) || G.money < 0) prova(sc, "turno");
  }

  function riposo(sc, soglia){
    if(G.wellbeing < soglia) prova(sc, "stacca");
  }

  /* la Strada: il colpo più grosso che la reputazione regge, da solo e pulito
     finché non c'è un uomo; ripulisce quando ci sono soldi sporchi */
  function colpo(sc){
    if(inCarcere() || typeof stradaTenta !== "function" || !G.strada) return;
    const s = G.strada;
    if(G.money > 900 && !s.avvocato && s.precedenti > 0 && typeof stToggleAvvocato === "function"){ stToggleAvvocato(); conta(sc.azioni, "avvocato"); }
    if(G.money > 1500 && s.uomini < 2 && typeof stAssumiUomo === "function"){ stAssumiUomo(); conta(sc.azioni, "assume uomo"); }
    const quale = s.rep >= 55 && s.heat < 50 ? "cassa" : s.rep >= 20 && s.heat < 60 ? "scotta" : "consegne";
    const c = STRADA_COLPI.find(x => x.id === quale);
    if(s.heat >= 75){ conta(sc.rifiuti, "colpo · troppo caldo"); return; }
    if(G.energy < c.energia){ conta(sc.rifiuti, "colpo · energia"); return; }
    if(typeof GAME_TIME !== "undefined" && GAME_TIME.remaining && GAME_TIME.remaining() < 240){ conta(sc.rifiuti, "colpo · tardi"); return; }
    const e0 = G.energy;
    stradaTenta(quale, s.uomini > 0 ? "squadra" : "pulito");
    if(G.energy < e0){ conta(sc.azioni, "colpo " + quale); sc.colpi++; if(inCarcere()) sc.arresti++; }
    else conta(sc.rifiuti, "colpo · non partito");
    risolvi(sc);
    if(s.sporchi > 0 && !inCarcere() && typeof stradaRipulisci === "function"){
      const m = stradaRipulisci();
      if(/Ripuliti/.test(m || "")) conta(sc.azioni, "ripulisci");
    }
    risolvi(sc);
  }

  const STRATEGIE = {
    /* il bot del giro di un anno: lavoretto per campare, la musica al centro */
    musicista(sc, g){
      lavoro(sc, false); riposo(sc, 45); musica(sc);
      if(fuori()) prova(sc, "promo");
      if(fuori() && g % 3 === 0) prova(sc, "live");
      if(g % 2 === 0) prova(sc, "palestra_cardio");
      if(g % 5 === 0) prova(sc, "free");
    },
    /* chi lavora: il turno tutti i giorni, la musica con quello che avanza. Mix e
       uscita prima del turno: dopo, la giornata è finita e il pezzo registrato resta
       in cassetto a costare (il giro del 29/09 ne pubblicava 26 su 100) */
    lavoratore(sc, g){
      if(pronta("mixa")) prova(sc, "mixa");
      if(pronta("pubblica")) prova(sc, "pubblica");
      lavoro(sc, true); riposo(sc, 35);
      if(g % 2 === 0) musica(sc, { poco: true, margine: 150 });
      if(fuori() && g % 3 === 0) prova(sc, "promo");
    },
    /* chi spinge la promo: il pezzo pronto prima lo anticipa, poi lo fa uscire;
       quello che è fuori lo spinge sui social e sul palco */
    promo(sc, g){
      lavoro(sc, false); riposo(sc, 40);
      musica(sc, { poco: true, trattieni: true });
      anteprime(sc);
      if(fuori()){ prova(sc, "promo"); prova(sc, "promo"); if(g % 2 === 0) prova(sc, "live"); }
      if(g % 2 === 0) prova(sc, "free");
    },
    /* chi fa crimini: niente lavoro, un colpo al giorno, la musica dopo */
    criminale(sc, g){
      riposo(sc, 40); colpo(sc);
      if(!inCarcere()){ musica(sc, { poco: true }); if(fuori() && g % 2 === 0) prova(sc, "promo"); }
    },
    /* il controllo: non fa niente per la carriera. Quello che cresce qui cresce da solo */
    fermo(sc, g){
      riposo(sc, 60);
      if(g % 2 === 0) prova(sc, "palestra_cardio");
      if(G.money < 0) lavoro(sc, false);
    },
    /* a caso: tre mosse fra quelle che ci sono. Trova i buchi che le altre non toccano */
    caso(sc){
      const ids = ACTIONS.map(a => a.id).filter(id => !/remaster/.test(id));
      for(let i = 0; i < 3; i++) prova(sc, ids[Math.floor(Math.random() * ids.length)]);
      if(Math.random() < .3) compraBeat(sc, 0);
      if(Math.random() < .2) colpo(sc);
    }
  };

  function invarianti(){
    const p = [];
    const num = (k, v) => { if(typeof v !== "number" || !isFinite(v)) p.push(k + "=" + v); };
    ["energy","maxEnergy","money","fans","hype","wellbeing","lucidita","week","year","day","age"].forEach(k => num(k, G[k]));
    Object.entries(G.skills).forEach(([k, v]) => { num("skill." + k, v); if(v > 88 || v < 0) p.push("skill " + k + "=" + v); });
    if(G.energy > G.maxEnergy + 1e-9) p.push("energia>max");
    if(G.energy < 0) p.push("energia negativa");
    if(G.fans < 0) p.push("fan negativi");
    if(G.hype < 0 || G.hype > 100) p.push("hype " + G.hype);
    if(G.wellbeing < 0 || G.wellbeing > 100) p.push("benessere " + G.wellbeing);
    if(G.day < 1 || G.day > 7) p.push("giorno " + G.day);
    G.songs.forEach(s => { if(!isFinite(s.streams) || s.streams < 0) p.push("stream rotti"); if(!isFinite(s.q)) p.push("qualità rotta"); });
    return p;
  }

  function foto(){
    const s = G.strada || {};
    return {
      y: G.year, w: G.week, d: G.day,
      fan: Math.round(G.fans), soldi: Math.round(G.money), hype: Math.round(G.hype),
      hypeCap: typeof hypeCap === "function" ? hypeCap() : 100,
      ben: Math.round(G.wellbeing), luc: Math.round(G.lucidita), fase: G.phase,
      pezzi: G.songs.filter(x => x.released).length, stream: Math.round(G.streamsPrev || 0),
      /* 99 è il valore di partenza (state.js): vuol dire mai entrato in classifica */
      classifica: G.best && G.best.chart < 99 ? G.best.chart : null,
      abilita: Object.fromEntries(Object.entries(G.skills).map(([k, v]) => [k, Math.round(v * 10) / 10])),
      lavoro: G.job ? G.job.id : null, carcere: !!s.arresto, rep: Math.round(s.rep || 0), calore: Math.round(s.heat || 0),
      sporchi: Math.round(s.sporchi || 0), contratto: !!G.contract, finita: !!G.ended
    };
  }

  window.__SIM = {
    STRATEGIE: Object.keys(STRATEGIE),
    semina(seme){
      let s = (Number(seme) * 2654435761 >>> 0) || 1;
      Math.random = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
      try{ SET.gioco.conferme = false; }catch(e){}
    },
    async giorno(strategia, g){
      const sc = { azioni: {}, rifiuti: {}, blocchi: [], eventi: 0, colpi: 0, arresti: 0, salto: "ok" };
      try{
        if(!inCarcere()) STRATEGIE[strategia](sc, g);
      }catch(e){ sc.blocchi.push("strategia: " + e.message); }
      risolvi(sc);
      /* il «+1» da solo: il tempo della giornata intera conta anche le mosse del bot,
         e un rallentamento del gioco si vede qui */
      const t1 = performance.now();
      const prima = GAME_TIME.now ? GAME_TIME.now() : 0, g0 = [G.year, G.week, G.day].join(".");
      let ok = window.ADF_TIME_SKIP(1);
      await attendi(0);
      risolvi(sc);
      if(!ok){
        ok = window.ADF_TIME_SKIP(1);
        await attendi(0);
        risolvi(sc);
        if(!ok){ sc.salto = "bloccato"; avanzaGiorno(); save(); risolvi(sc); }
        else sc.salto = "al secondo colpo";
      }
      sc.msSalto = Math.round(performance.now() - t1);
      if([G.year, G.week, G.day].join(".") === g0 && sc.salto === "ok") sc.salto = "fermo";
      sc.prima = prima;
      sc.invarianti = invarianti();
      sc.foto = foto();
      return sc;
    }
  };
  return window.__SIM.STRATEGIE;
}

module.exports = { installaBot };
