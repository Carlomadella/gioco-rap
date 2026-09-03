/* renderGioco(): disegna HUD, pannelli, liste e collega i comandi. */
"use strict";

const SHOWN = {};
/* quali categorie del lifestyle l'utente ha aperto: sopravvive ai ridisegni */
const LAPERTE = new Set();
/* punto 67: stesse quattro famiglie di colore delle card (scene-art.js),
   così il toast che segue un tap non stona col colore della card appena
   premuta. Solo scrivi/beat/registra/free/cercalavoro ci passano davvero —
   le altre finiscono nella scena a pagina piena (SCENA_PIENA, sotto), non
   nel toast, ma restano coerenti anche loro se un giorno cambia qualcosa. */
const ART = {
  scrivi:TINTA_STUDIO.concat("S"), beat:TINTA_SUONO.concat("B"),
  registra:TINTA_STUDIO.concat("R"), mixa:TINTA_STUDIO.concat("M"),
  pubblica:TINTA_STUDIO.concat("P"), promo:TINTA_HUSTLE.concat("O"),
  free:TINTA_SUONO.concat("F"), live:TINTA_SUONO.concat("L"),
  turno:TINTA_HUSTLE.concat("€"), cercalavoro:TINTA_HUSTLE.concat("C"),
  stacca:TINTA_VITA.concat("Z"), palestra_pesi:TINTA_VITA.concat("P"),
  palestra_cardio:TINTA_VITA.concat("P")
};

/* Punto 50: queste mosse finivano dritte in un toast — nessuna scena,
   nessuna pagina, un numero e via. Scrivi/beat/free hanno già la loro
   (foglio, piazza, e beat aspetta la scena del producer al punto 8);
   registra e cercalavoro hanno già una finestra vera (il titolo del
   pezzo, i due colloqui). Queste sette no: adesso aprono la scenetta che
   avevano già sulla card (scene-art.js), grande, con l'esito scritto
   sopra — non un'altra riga di testo che vola via in due secondi. */
const SCENA_PIENA = new Set(["mixa","pubblica","promo","live","turno","stacca",
  "palestra_pesi","palestra_cardio"]);
function mostraScena(a, sc, msg, extra){
  $("sc-art").innerHTML = sc[2]
    ? '<svg viewBox="0 0 200 128" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' + sc[2] + '</svg>'
    : "";
  $("sc-k").textContent = a.n;
  $("sc-k").style.setProperty("--k", sc[0]);
  $("sc-t").textContent = a.n;
  $("sc-d").textContent = a.d;
  $("sc-esito").innerHTML = (msg || "") + extra;
  /* punto 58: l'entrata cambia con la mossa (css/effects.css) — tolgo e
     rimetto l'animazione per farla ripartire anche riaprendo la stessa scena
     di fila (altrimenti il browser la considera già "finita" e non la rilancia) */
  const wrap = $("scena").querySelector(".scwrap");
  wrap.style.animation = "none";
  wrap.dataset.anim = a.id;
  void wrap.offsetWidth;
  wrap.style.animation = "";
  $("scena").classList.add("on");
}
$("sc-go").onclick = () => { $("scena").classList.remove("on"); };

function renderGioco(){
  if(typeof beatStop === "function") beatStop();
  const art = window.ARTIST || {};
  /* l'accento è il colore dell'artista, a meno che nelle impostazioni non sia
     stato fissato un colore d'interfaccia: in quel caso comanda quello */
  const cc = coloreAccento(art.color);
  $("gtop").style.setProperty("--c1", cc);
  document.documentElement.style.setProperty("--c1", cc);
  // la faccia segue il momento che stai vivendo
  window.__MOOD = G.wellbeing <= 28 ? "stanco"
    : G.money < -200 ? "arrabbiato"
    : G.hype >= 65 ? "sfida"
    : G.best.chart === 1 ? "sorriso"
    : G.hype >= 35 ? "sicuro"
    : G.phase >= 3 ? "freddo"
    : (G.songs.some(x => x.released) ? "determinato" : null);
  if(window.ARTIST_PORTRAIT) $("g-port").innerHTML = window.ARTIST_PORTRAIT();
  window.__MOOD = null;
  $("g-name").textContent = (art.name || "Senza Nome").trim();
  $("g-meta").textContent = "Anno " + G.year + " · Settimana " + G.week + ", giorno " + (G.day || 1) +
    "/7 · " + PHASES[G.phase].n + " · " + (G.contract ? G.contract.label : "indipendente");

  /* Fase della scalata: una fascia sola, non piu' una scheda alta mezzo schermo.
     A sinistra dove sei, a destra i gradini fatti, sotto la riga che conta —
     cosa devi fare adesso. Il racconto della fase sta nel titolo al passaggio. */
  const ph = PHASES[G.phase], nt = nextTrial();
  let nxt;
  if(!nt) nxt = '<div class="pnx">Sei arrivato in cima. Adesso il difficile è restarci.</div>';
  else if(G.trialCd > 0)
    nxt = '<div class="pnx">La prossima occasione — <b>' + nt.t + '</b> — non tornerà prima di <b>' +
      G.trialCd + '</b> settimane.</div>';
  else if(pendingTrial())
    nxt = '<div class="pnx ready">Sei pronto per <b>' + nt.t + '</b>. Capiterà chiudendo una di queste settimane.</div>';
  else
    nxt = '<div class="pnx">Prossimo passo: <b>' + nt.t + '</b>. ' + nt.hint + '</div>';
  let track = "";
  for(let i2=0;i2<PHASES.length;i2++) track += '<i class="' + (i2 <= G.phase ? "on" : "") + '"></i>';
  $("g-phase").innerHTML = '<div class="phase" title="' + ph.d.replace(/"/g, "&quot;") + '">' +
    '<div class="phead2"><div class="pt"><span class="pk">La tua scalata</span>' +
      '<span class="pn">' + ph.n + '</span></div>' +
      '<div class="ptrack">' + track + '</div></div>' + nxt + '</div>';

  // livello ed esperienza (il conto sta in state.js: lo legge anche l'hub)
  const L = livello();
  $("g-lvl").textContent = "LIV " + L.lvl;
  $("g-xp").style.width = clamp(L.into/L.need*100, 0, 100) + "%";
  $("g-xptxt").textContent = fmt(L.into) + " / " + fmt(L.need);

  /* L'energia rimasta della settimana. Il numero da solo non si legge al volo,
     i trattini si': uno per turno, spenti quelli gia' usati. Quando finisce
     diventa rossa, che e' la cosa che devi sapere prima di cercare una mossa.
     Sta solo nella barra in basso: li' e' sempre sotto gli occhi e non fa
     doppione con la testata. */
  const pipsEnergia = () => '<i style="width:' + clamp(G.energy / G.maxEnergy * 100, 0, 100) + '%"></i>';

  /* I tre numeri su cui decidi: cassa, chi ti segue, hype. In riga, senza
     scatola dentro la scatola: sono dentro la testata, non una scheda a parte. */
  const pod = (k, ic, val, lab, neg) =>
    '<span class="vit' + (neg ? " neg" : "") + '" style="--k:' + k + '">' +
    '<i>' + ic + '</i><span><b>' + val + '</b><u>' + lab + '</u></span></span>';
  $("g-res").innerHTML =
    pod("var(--acid)", "€", fmt(G.money), "in cassa", G.money < 0) +
    pod("var(--hot)", "♥", short(G.fans), "chi ti segue") +
    pod("var(--violet)", "▲", Math.round(G.hype), "hype");

  // notifiche sulle sezioni
  const badges = {
    catalogo: G.songs.filter(x => !x.released).length + G.market.length,
    contratti: (!G.contract ? OFFERS.filter(o => G.fans >= o.need).length : 0),
    obiettivi: GOALS.filter(g3 => !G.goals[g3.id] && g3.ok(G)).length
  };
  document.querySelectorAll(".nb").forEach(nb => {
    const old = nb.querySelector(".bdg"); if(old) old.remove();
    const n = badges[nb.dataset.t] || 0;
    if(n > 0){ const e2 = document.createElement("span"); e2.className = "bdg"; e2.textContent = n; nb.appendChild(e2); }
  });
  /* le stesse pallette sulle linguette dentro al catalogo, se no chiudendo le
     liste non si vede piu' che c'e' roba nuova */
  const sbadges = {market: G.market.length, songs: G.songs.filter(x => !x.released).length};
  document.querySelectorAll(".sbdg").forEach(b => {
    const n = sbadges[b.dataset.b] || 0;
    b.hidden = n <= 0; b.textContent = n;
  });

  const box = (n, l, cls, meter, ok, key, raw) =>
    '<div class="sbox"><div class="n ' + (cls||"") + '"' + (key ? ' data-k="' + key + '" data-to="' + raw + '"' : '') + '>' + n + '</div><div class="l">' + l + '</div>' +
    (meter !== undefined ? '<div class="meter"><i class="' + (ok?"ok":"") + '" style="width:' + clamp(meter,0,100) + '%"></i></div>' : '') +
    '</div>';
  $("g-stats").innerHTML =
    box(Math.round(G.wellbeing), "benessere", G.wellbeing <= 30 ? "red" : "", G.wellbeing, G.wellbeing > 30) +
    box(Math.round(luc()), "lucidità", luc() <= 30 ? "red" : "", luc(), luc() > 45) +
    box(G.songs.filter(x => x.released).length, "pezzi fuori") +
    box(G.job ? G.job.pay + " €" : "—", G.job ? "a turno · " + G.job.n.toLowerCase() : "nessun lavoro");

  /* I dettagli sono chiusi finché non li apri, ma se benessere o lucidità sono
     a terra il bottone si accende: nascondere un numero non deve nascondere un
     guaio. */
  const allarme = G.wellbeing <= 30 || luc() <= 30;
  $("g-dett").classList.toggle("allarme", allarme);

  $("g-stats").querySelectorAll("[data-k]").forEach(el => {
    const k = el.dataset.k, to = +el.dataset.to;
    const prev = SHOWN[k];
    if(prev !== undefined && prev !== to){
      el.dataset.v = prev;
      countTo(el, to, k === "money" ? (v => fmt(v) + " €") : (v => short(v)));
    }
    SHOWN[k] = to;
  });

  // azioni
  const aw = $("g-actions"); aw.innerHTML = "";
  for(const a of ACTIONS){
    if(a.avail && !a.avail()) continue;
    const en2 = a.dyn ? a.dyn() : a.e;
    const c = a.money ? a.money() : 0;
    const miss = a.need ? a.need() : null;
    const noMoney = c && G.money < c;
    const ok = !miss && !noMoney && G.energy >= en2;
    const sc = SC[a.id] || ["#3A3F49","#22262E",""];
    const g = ART[a.id] || ["#3A3F49","#22262E","·"];
    const b = document.createElement("button");
    b.className = "tile"; b.disabled = !ok;
    b.dataset.id = a.id;
    b.style.setProperty("--a", sc[0]); b.style.setProperty("--b", sc[1]);
    const rw = miss ? '<span class="rw need">SERVE ' + miss + '</span>'
      : noMoney ? '<span class="rw need">SERVE ' + c + ' \u20AC in cassa</span>'
      : '<span class="rw">' + a.give() + '</span>';
    b.innerHTML =
      '<span class="scene">' +
        '<svg viewBox="0 0 200 128" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' + sc[2] + '</svg>' +
        '<span class="cost"><i>' + en2 + '</i>energia</span>' +
        (c ? '<span class="price">' + c + ' \u20AC</span>' : '') +
        (ok ? '' : '<span class="lock">\uD83D\uDD12</span>') +
      '</span>' +
      '<span class="t">' + a.n + '</span>' +
      '<span class="s">' + a.d + '</span>' + rw;
    const esegui = () => {
      /* Le tile disabilitate da orari/spostamenti/clock sono solo UI.
         Prima di toccare energia, soldi o statistiche chiediamo al runtime
         se la mossa è davvero eseguibile in questo preciso momento. */
      try{
        if(window.GAME_TRAVEL && typeof GAME_TRAVEL.guardAction === "function"){
          const gate = GAME_TRAVEL.guardAction(a.id);
          if(!gate.ok){
            if(typeof SFX === "object" && SFX.fail) SFX.fail();
            return;
          }
        }
      }catch(err){
        console.error("[Anni di Fame] guardia runtime azione non riuscita", err);
        if(typeof toast === "function")
          toast("<b>Mossa non avviata.</b> Controllo luogo/orario non disponibile.","bad","!",["#B91C1C","#7F1D1D"]);
        return;
      }

      const fansBefore = G.fans, moneyBefore = G.money;
      G.energy -= en2;
      /* da qui l'azione e' aperta: se si apre una scena e la abbandoni,
         annullaAzione() rimette a posto l'energia (vedi uscita.js) */
      iniziaAzione(en2);
      const msg = a.run();
      if(!overlayAperto()) azioneFatta();   /* si e' conclusa subito, niente da annullare */
      if(a.luc) addLuc(a.luc);
      if(msg) pushLog(msg, "");
      G.wellbeing = clamp(G.wellbeing, 0, 100);
      const s2 = SFX[SND[a.id] || "tap"]; if(s2) s2();
      b.classList.add("hit"); setTimeout(() => b.classList.remove("hit"), 430);
      let extra = "";
      const df = G.fans - fansBefore, dm = Math.round(G.money - moneyBefore);
      if(df > 0) extra += ' <b>+' + fmt(df) + ' fan</b>';
      if(dm > 0){ extra += ' <b>+' + fmt(dm) + ' €</b>'; weekEarn += dm; }
      if(SCENA_PIENA.has(a.id)) mostraScena(a, sc, msg, extra);
      else toast(msg + extra, "good", g[2], [g[0], g[1]]);
      checkGoals(); save(); renderGioco();
    };
    /* «Chiedi conferma» nelle impostazioni: si controlla solo dove fa male
       sbagliare, cioè quando la mossa costa soldi o mezza settimana di energia */
    b.onclick = () => {
      if(!ok) return;
      /* punto 55: con l'energia a 100 quasi ogni mossa costava «due energie
         o più», quindi la conferma usciva sempre — non filtrava più niente.
         Resta solo dove si spendono soldi veri. */
      const pesa = SET.gioco.conferme && c > 0;
      if(!pesa){ esegui(); return; }
      showEvent({
        k:"Confermi?", t:a.n,
        d:"Ti costa <b>" + en2 + (en2 === 1 ? " energia" : " energie") + "</b>" +
          (c ? " e <b>" + fmt(c) + " €</b>" : "") + ". " + a.d,
        annulla(){},
        opts:[
          {n:"Vai", d:"Fai la mossa adesso", run(){ esegui(); return null; }},
          {n:"Lascia stare", d:"Torni indietro senza spendere niente", run(){ return null; }}
        ]
      });
    };
    aw.appendChild(b);
  }

  // catalogo
  const avg = G.bars.length ? Math.round(G.bars.reduce((x,y) => x+y.q, 0)/G.bars.length) : 0;
  $("g-mat").innerHTML =
    '<div class="li"><span class="nm"><b>Strofe scritte</b><span>' +
      (G.bars.length ? "qualità media " + avg : "il quaderno è vuoto") + '</span></span><span class="v">' + G.bars.length + '</span></div>' +
    (G.beats.length
      ? G.beats.map((b,i) => '<div class="li"><span class="cov" style="background:' + beatCov(b) + '"></span>' +
          '<span class="nm"><b>' + b.n + '</b><span>qualità ' + b.q + ' · ' + beatEtichetta(b) + '</span></span>' +
          '<button class="play" data-mine="' + i + '" title="Ascolta">▶</button>' +
          '<span class="tag">tuo</span></div>').join("")
      : '<div class="li"><span class="nm"><b>Beat comprati</b><span>nessuno: i beat si comprano qui sotto</span></span><span class="v">0</span></div>');

  $("g-mat").querySelectorAll("[data-mine]").forEach(btn => {
    btn.onclick = () => beatSuona(G.beats[+btn.dataset.mine], btn);
  });

  const rigaBeat = (b, i) => '<div class="li"><span class="cov" style="background:' + beatCov(b) + '"></span>' +
    '<span class="nm"><b>' + b.n + '</b><span>qualità ' + b.q + ' · ' + beatInfo(b).bpm + ' bpm</span></span>' +
    '<button class="play no" data-drop="' + i + '" title="Rifiuta: sparisce dal catalogo">✕</button>' +
    '<button class="play" data-hear="' + i + '" title="Ascolta il beat">▶</button>' +
    '<button class="buy" data-buy="' + i + '"' + (G.money < b.price ? " disabled" : "") + '>' + b.price + ' €</button></div>';
  /* il banco diviso per genere: il tuo per primo, gli altri in ordine */
  const perGen = {};
  G.market.forEach((b,i) => { const g = beatGen(b); (perGen[g] = perGen[g] || []).push([b,i]); });
  const mioG = mioGenere();
  const ordine = Object.keys(perGen).sort((x,y) =>
    x === mioG ? -1 : y === mioG ? 1 : genBeat(x).n.localeCompare(genBeat(y).n));
  $("g-market").innerHTML = G.market.length
    ? ordine.map(g => {
        const gg = genBeat(g);
        return '<div class="gsep' + (g === mioG ? " mine" : "") + '">' +
          '<i style="background:linear-gradient(140deg,' + gg.c[0] + ',' + gg.c[1] + ')"></i>' +
          '<b>' + gg.n + '</b><span>' + (g === mioG ? "il tuo genere" : gg.bpm[0] + "–" + gg.bpm[1] + " bpm") +
          ' · ' + perGen[g].length + (perGen[g].length === 1 ? " beat" : " beat") + '</span></div>' +
          perGen[g].map(([b,i]) => rigaBeat(b,i)).join("");
      }).join("")
    : '<div class="empty2">Nessun beat in vendita. Usa «Cerca un beat».</div>';
  $("g-market").querySelectorAll("[data-hear]").forEach(btn => {
    btn.onclick = () => beatSuona(G.market[+btn.dataset.hear], btn);
  });
  /* i beat che non ti dicono niente li lasci lì: spariscono dal catalogo */
  $("g-market").querySelectorAll("[data-drop]").forEach(btn => {
    btn.onclick = () => {
      const b = G.market[+btn.dataset.drop];
      if(!b) return;
      G.market.splice(+btn.dataset.drop, 1);
      toast("Hai lasciato lì «<b>" + b.n + "</b>». Non era il tuo.", "", "✕", ["#5A6472","#2B2B34"]);
      save(); renderGioco();
    };
  });
  $("g-market").querySelectorAll("[data-buy]").forEach(btn => {
    btn.onclick = () => {
      const i = +btn.dataset.buy, b = G.market[i];
      if(!b || G.money < b.price) return;
      G.money -= b.price; G.market.splice(i,1); G.beats.push({n:b.n, q:b.q, gen:beatGen(b), seed:beatSeed(b)});
      pushLog("Comprato il beat «" + b.n + "» (q" + b.q + ") per " + b.price + " €.", "");
      save(); renderGioco();
    };
  });

  $("g-songs").innerHTML = G.songs.length
    ? G.songs.slice().reverse().map((x,i) => {
        return '<div class="li"><span class="cov">' +
          cover(x.seed || (i+11), x.t, (window.ARTIST||{}).name || "", x.img) + '</span>' +
        '<span class="nm"><b>' + x.t + '</b><span>qualità ' + x.q + (x.released ? " · " + short(x.streams) + " stream" : "") +
          /* punto 10: se ci hanno girato un video sopra, si vede — e si vede chi */
          (x.video ? " · video" + (x.videoDa ? " di " + x.videoDa : "") : "") + '</span></span>' +
        '<button class="rinomina" data-ren="' + G.songs.indexOf(x) + '" title="Cambia titolo">✎</button>' +
        '<span class="tag' + (x.released ? " on" : "") + '">' + (x.released ? "fuori" : x.mixed ? "pronto" : "grezzo") + '</span></div>';
      }).join("")
    : '<div class="empty2">Nessun pezzo registrato.</div>';

  renderDiscografia();

  $("g-songs").querySelectorAll("[data-ren]").forEach(btn => {
    btn.onclick = () => {
      const sx = G.songs[+btn.dataset.ren]; if(!sx) return;
      chiediTitolo(sx.t, (nome, seed, img) => { sx.t = nome; sx.seed = seed; sx.img = img; save(); renderGioco(); }, sx);
    };
  });

  $("g-shop").innerHTML = GEAR.map(g2 => {
    const owned = !!G.gear[g2.id];
    return '<div class="li"><span class="nm"><b>' + g2.n + '</b><span>' + g2.d + '</span></span>' +
      (owned ? '<span class="tag on">tuo</span>'
             : '<button class="buy" data-gear="' + g2.id + '"' + (G.money < g2.p ? " disabled" : "") + '>' + g2.p + ' €</button>') + '</div>';
  }).join("");
  $("g-shop").querySelectorAll("[data-gear]").forEach(btn => {
    btn.onclick = () => {
      const g2 = GEAR.find(x => x.id === btn.dataset.gear);
      if(G.money < g2.p) return;
      G.money -= g2.p; G.gear[g2.id] = true;
      pushLog("Hai comprato: " + g2.n + ".", "good");
      save(); renderGioco();
    };
  });

  /* punto 7: i vestiti si comprano qui, non dal guardaroba della plancia */
  if(typeof renderAbbigliamento === "function") renderAbbigliamento();

  // classifica
  renderChart();

  // contratti
  const avail = OFFERS.filter(o => G.fans >= o.need && !G.contract);
  $("g-offers").innerHTML = avail.length ? avail.map(o => {
    const proj = Math.round(my * 52 * 0.0055 * o.share * o.push + o.advance);
    return '<div class="li"><span class="nm"><b>' + o.label + ' · ' + o.tag + '</b><span>' + o.pitch +
      '<br>' + o.catch + '<br>anticipo ' + fmt(o.advance) + ' € · a te il ' + Math.round(o.share*100) +
      '% · master ' + (o.masters ? "tuoi" : "loro") + (o.deliver ? " · " + o.deliver + " uscite in " + o.weeks + " settimane" : "") +
      ' · stima primo anno ' + fmt(proj) + ' €</span></span>' +
      '<button class="buy" data-sign="' + o.id + '">Firma</button></div>';
  }).join("") : '<div class="empty2">' + (G.contract ? "Sei sotto contratto." : "Nessuna offerta. Le etichette si fanno vive quando i numeri parlano.") + '</div>';
  $("g-offers").querySelectorAll("[data-sign]").forEach(btn => {
    btn.onclick = () => {
      const o = OFFERS.find(x => x.id === btn.dataset.sign);
      G.contract = o; G.money += o.advance;
      if(o.deliver) G.obligation = {need:o.deliver, left:o.weeks, from:totalWeeks()};
      G.goals.g6 = true;
      pushLog("<b>Hai firmato con " + o.label + ".</b> Anticipo di " + fmt(o.advance) + " €.", "good");
      save(); renderGioco();
    };
  });

  $("g-deal").innerHTML = G.contract
    ? '<div class="li"><span class="nm"><b>' + G.contract.label + '</b><span>a te il ' +
      Math.round(G.contract.share*100) + '% · spinta ×' + G.contract.push + ' · master ' +
      (G.contract.masters ? "tuoi" : "dell etichetta") +
      (G.obligation ? '<br>Devi consegnare ' + (G.obligation.need - G.songs.filter(x => x.released && x.week > G.obligation.from).length) +
        ' uscite in ' + G.obligation.left + ' settimane.' : "") + '</span></span></div>'
    : '<div class="empty2">Sei indipendente. Tutto quello che entra è tuo, e tutto quello che manca è un problema tuo.</div>';

  $("g-goals").innerHTML = GOALS.map(g2 =>
    '<div class="li"><span class="nm"><b>' + g2.n + '</b><span>' + g2.d + '</span></span>' +
    '<span class="tag' + (G.goals[g2.id] ? " on" : "") + '">' + (G.goals[g2.id] ? "fatto" : "aperto") + '</span></div>').join("");


  // lifestyle
  const lb2 = lifeBonus(), lc = lifeCost();
  const bonusTxt = [];
  if(lb2.energy) bonusTxt.push("+" + lb2.energy + " turni");
  if(lb2.hype) bonusTxt.push("+" + lb2.hype + " hype a settimana");
  if(lb2.fan > 1) bonusTxt.push("+" + Math.round((lb2.fan-1)*100) + "% fan");
  if(lb2.live > 1) bonusTxt.push("+" + Math.round((lb2.live-1)*100) + "% sui live");
  if(lb2.well) bonusTxt.push((lb2.well > 0 ? "+" : "") + lb2.well + " benessere");
  $("g-lifesum").innerHTML = '<div class="lsum">' +
    '<div><div class="v bad">' + fmt(lc) + ' €</div><div class="l">di lifestyle a settimana</div></div>' +
    '<div><div class="v">' + fmt(weeklyCosts()) + ' €</div><div class="l">spese totali</div></div>' +
    '<div><div class="v good">' + (bonusTxt.length ? bonusTxt.length : "0") + '</div><div class="l">vantaggi attivi</div></div>' +
    '</div>' + (bonusTxt.length ? '<div class="ltier"><span class="tx"><span>' + bonusTxt.join(" · ") + '</span></span></div>' : '') +
    (() => {
      const lb2 = lifeBonus();
      const viss = clamp(1 - (G.shifts||0)*0.20, 0.25, 1);
      const nat = Math.round(clamp(34 + lb2.well*4.6*viss - (G.money < 0 ? 12 : 0), 12, 100));
      return '<div class="ltier"><span class="tx"><span><b>Benessere naturale: ' + nat + '</b></span>' +
        '<span>Ogni settimana il benessere torna verso questo numero: è il tuo tenore di vita che lo tiene su. ' +
        'I turni di lavoro te lo fanno vivere meno' + (G.shifts ? ' (questa settimana −' + Math.round((1-viss)*100) + '%)' : '') +
        ', e stare in rosso lo abbassa di 12. Dal benessere dipende la qualità di tutto quello che scrivi e registri.</span></span></div>';
    })();

  /* Cinque categorie per cinque gradini erano venticinque righe aperte tutte
     insieme. Adesso vedi dove stai adesso e quanto paghi; i gradini si aprono
     su quella che ti interessa. */
  $("g-life").innerHTML = LIFE.map(cat => {
    const cur = G.life[cat.id] || 0;
    const aperta = LAPERTE.has(cat.id);
    return '<div class="lcat' + (aperta ? " aperta" : "") + '" style="--a:' + cat.c[0] + '33">' +
      '<button class="lhead" data-lopen="' + cat.id + '" aria-expanded="' + aperta + '">' +
      '<span class="ic">' + cat.ic + '</span>' +
      '<span class="tt"><b>' + cat.n + '</b><span>' + cat.t[cur].n + '</span></span>' +
      '<span class="cw">' + (cat.t[cur].w ? fmt(cat.t[cur].w) + ' €' : 'gratis') + '</span>' +
      '<span class="lar">▾</span></button>' +
      cat.t.map((t,i) => {
        const isNow = i === cur;
        const up = i === cur + 1, down = i === cur - 1;
        const eff = [];
        if(t.e.energy) eff.push("+" + t.e.energy + " turni");
        if(t.e.hype) eff.push("+" + t.e.hype + " hype");
        if(t.e.fan) eff.push("+" + Math.round((t.e.fan-1)*100) + "% fan");
        if(t.e.live) eff.push("+" + Math.round((t.e.live-1)*100) + "% live");
        if(t.e.rete) eff.push("+" + t.e.rete + " rete");
        if(t.e.well) eff.push((t.e.well>0?"+":"") + t.e.well + " benessere");
        const canUp = up && G.money >= t.w * 3;
        return '<div class="ltier' + (isNow ? " now" : "") + '">' +
          '<span class="num">' + (isNow ? "✓" : (i+1)) + '</span>' +
          '<span class="tx"><b>' + t.n + '</b><span>' + t.d + '</span>' +
          (eff.length ? '<em>' + eff.join(" · ") + '</em>' : '') + '</span>' +
          '<span class="w">' + (t.w ? fmt(t.w) + ' €<br>a settimana' : 'gratis') + '</span>' +
          (up ? '<button class="act2" data-life="' + cat.id + '" data-lv="' + i + '"' + (canUp ? "" : " disabled") + '>Sali</button>' : '') +
          (down ? '<button class="act2 down" data-life="' + cat.id + '" data-lv="' + i + '">Scendi</button>' : '') +
          '</div>';
      }).join("") + '</div>';
  }).join("");

  $("g-life").querySelectorAll("[data-lopen]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.lopen;
      if(LAPERTE.has(id)) LAPERTE.delete(id); else LAPERTE.add(id);
      renderGioco();
    };
  });

  $("g-life").querySelectorAll("[data-life]").forEach(btn => {
    btn.onclick = () => {
      const cat = LIFE.find(c => c.id === btn.dataset.life);
      const lv = +btn.dataset.lv, old = G.life[cat.id] || 0;
      const t = cat.t[lv];
      if(lv > old){
        if(G.money < t.w * 3){ toast("Servono almeno <b>" + fmt(t.w*3) + " €</b> in cassa per permettertelo.", "bad", "!", ["#FF5A36","#B026FF"]); return; }
        G.money -= t.w;
        G.life[cat.id] = lv;
        G.hype = clamp(G.hype + 3, 0, 100);
        SFX.cash();
        toast("<b>" + t.n + "</b> — adesso paghi " + fmt(t.w) + " € a settimana.", "good", cat.ic, cat.c);
      }else{
        G.life[cat.id] = lv;
        G.hype = clamp(G.hype - 5, 0, 100);
        SFX.fail();
        toast("Sei sceso a <b>" + t.n + "</b>. Qualcuno se ne accorgerà.", "bad", cat.ic, ["#5A6472","#2B2B34"]);
      }
      syncEnergy(); save(); renderGioco();
    };
  });

  // diario (a tendina)
  const nuovi = Math.max(0, G.log.length - (G.seenLog || 0));
  const bdg = $("g-dbdg");
  if(bdg){ bdg.hidden = nuovi <= 0 || $("drawer").classList.contains("on"); bdg.textContent = nuovi > 99 ? "99" : nuovi; }
  $("g-feed").innerHTML = G.log.length
    ? G.log.map(l => '<div class="ev ' + l.c + '"><span class="w">' + l.w + '</span>' + l.t + '</div>').join("")
    : '<div class="empty2">Il diario è vuoto. Fai qualcosa.</div>';

  const be = $("g-barenergia");
  be.classList.toggle("vuota", G.energy <= 0);
  be.innerHTML = '<span class="n"><b>' + G.energy + '</b>/' + G.maxEnergy + ' <em>energia</em></span>' +
    '<span class="enpips">' + pipsEnergia() + '</span>';
}

function openDiary(){
  $("drawer").classList.add("on");
  G.seenLog = G.log.length; save(); renderGioco();
}
function closeDiary(){ $("drawer").classList.remove("on"); }
$("g-diary").onclick = () => openDiary();
$("d-close").onclick = () => closeDiary();
$("drawer").addEventListener("click", e => { if(e.target.id === "drawer") closeDiary(); });
document.addEventListener("keydown", e => { if(e.key === "Escape") closeDiary(); });

document.querySelectorAll(".nb").forEach(t => {
  t.onclick = () => {
    document.querySelectorAll(".nb").forEach(x => x.classList.toggle("on", x === t));
    document.querySelectorAll(".gpane").forEach(pp => pp.classList.toggle("on", pp.dataset.p === t.dataset.t));
    if(typeof beatStop === "function") beatStop();
    /* Aprire la classifica è chiedere «a che punto sono adesso»: si va a
       risentire il server. Se non risponde resta quella che c'è. */
    if(t.dataset.t === "classifica" && typeof ONLINE !== "undefined" && ONLINE){
      ONLINE.aggiornaClassifica(CHART_QUANTI).then(c => { if(c) renderChart(); }).catch(() => {});
    }
  };
});


/* ==================== LA CLASSIFICA (punti 12 e 30) ====================
   Il server con dentro la graduatoria vera c'era da un pezzo — le frecce ▲▼
   della settimana, le stagioni, i bot per fare numero, tutto provato — e
   questa schermata continuava a disegnare i rivali finti di casa. Il
   multiplayer esisteva e non si vedeva da nessuna parte.

   Adesso: se il server risponde si vede la classifica **vera**; se non
   risponde si vedono i rivali locali, esattamente come prima. Nessun avviso
   in faccia, nessuna schermata d'errore — chi gioca in aereo non si deve
   accorgere che esiste un server.

   L'iscrizione non la chiede nessuno e non c'è niente da compilare: parte da
   sola a settimana chiusa (`advanceWeek`, js/game/sim.js) col nome e la città
   che il giocatore ha già scritto nel creatore.

   Punto 12: si apre in top 10, e da sotto si allarga alla top 100. La tua
   posizione si vede sempre — se sei fuori dalla fetta, in fondo compare la
   tua riga con scritto a che numero sei. */
let CHART_QUANTI = 10;

/* I nomi e i titoli di questa schermata li scrive **altra gente**, e il
   server li tiene corti e senza caratteri invisibili ma non li ripulisce
   dall'HTML — non è il suo mestiere, è roba di chi disegna. Qui si disegna,
   quindi qui si mette al sicuro. Si chiama così e non `esc` perché `esc`
   esiste già in trasferte.js: due `const` con lo stesso nome in due file
   caricati insieme sono un errore che spegne tutto il gioco. */
const chartEsc = s => String(s == null ? "" : s)
  .replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

/* Il volto di chi gioca davvero. Il server manda i numeri, non l'aspetto — e
   fa bene, l'aspetto è roba del gioco, non della classifica. Si ricava
   dall'id, che non cambia mai: stesso artista, stessa faccia, su ogni
   dispositivo e a ogni giro di settimana. Pesca dalle stesse tavolozze dei
   rivali locali (`rivals.js`), così le due metà della classifica non stonano. */
function facciaDaId(id){
  const s = String(id || "");
  let h = 2166136261;
  for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return {
    skin: RIV_SKIN[h % RIV_SKIN.length],
    hair: (h >>> 7) % 4,
    col: RIV_COL[(h >>> 13) % RIV_COL.length]
  };
}

/* `null` vuol dire «non lo sappiamo»: alla prima settimana, o per chi è
   appena entrato, una posizione precedente non c'è. Un trattino è la verità;
   uno zero verde sarebbe una bugia. */
function chartFreccia(d){
  return d == null ? '<span class="dl eq">·</span>'
    : d > 0 ? '<span class="dl up">▲ ' + d + '</span>'
    : d < 0 ? '<span class="dl dn">▼ ' + (-d) + '</span>'
    : '<span class="dl eq">—</span>';
}

/* Una riga, con lo stesso vestito sia che arrivi dal server sia che sia fatta
   in casa: la giuntura non si deve vedere. */
function chartRigaHtml(d){
  return '<div class="crow' + (d.me ? " me" : "") + (d.staccata ? " staccata" : "") +
    (d.click ? "" : " ferma") + '"' +
    (d.click ? ' data-riv="' + chartEsc(d.click) + '"' : "") + '>' +
    '<span class="pz">' + d.pos + '</span>' +
    '<span class="cv">' + (d.cover || "") + '</span>' +
    (d.faccia ? '<span class="fc">' + d.faccia + '</span>' : "") +
    '<span class="in3"><b>' + chartEsc(d.nome) + (d.hot ? '<i class="hotdot"></i>' : "") +
      '</b><span>' + chartEsc(d.sotto) + '</span></span>' +
    '<span class="rt"><span class="st">' + short(d.stream) + '</span>' +
      chartFreccia(d.delta) + '</span></div>';
}

function renderChart(){
  const c = (typeof ONLINE !== "undefined" && ONLINE) ? ONLINE.classificaInCache() : null;
  if(c && c.righe && c.righe.length) chartDalServer(c);
  else chartDiCasa();
}

function chartDalServer(c){
  const righe = c.righe.slice(0, CHART_QUANTI);
  const mioTop = G.songs.filter(x => x.released).sort((a, b) => (b.last || 0) - (a.last || 0))[0];
  const vestita = (r, staccata) => chartRigaHtml({
    pos: r.pos, me: !!r.io, nome: r.nome, staccata: !!staccata,
    /* la mia copertina è quella vera del mio pezzo più forte, non una
       ricostruita dal seed: ce l'ho in mano, tanto vale usarla */
    cover: r.io && mioTop
      ? cover(mioTop.seed || 1, mioTop.t, (window.ARTIST || {}).name || "TU", mioTop.img)
      : cover(r.seed || 1, chartEsc(r.ultima || ""), chartEsc(r.nome)),
    faccia: r.io ? "" : faccia(facciaDaId(r.id), 34),
    sotto: r.citta + " · " + r.genere + (r.deal ? " · sotto contratto" : " · indipendente"),
    stream: r.stream, delta: r.delta
  });

  let html = righe.map(vestita).join("");
  /* «sei 428°»: se la tua riga non è nella fetta che si vede, si attacca in
     fondo staccata. È la domanda che si fa chiunque apra una classifica. */
  if(c.io && !righe.some(r => r.io)) html += vestita(Object.assign({}, c.io, { io: true }), true);
  $("g-chart").innerHTML = html;

  $("g-charthead").textContent = "Top " + CHART_QUANTI + " della settimana · " +
    fmt(c.totale) + (c.totale === 1 ? " artista" : " artisti") + " in classifica";

  /* Punto 12: la top 10 si allarga alla top 100. Il server ne manda fino a
     200 per richiesta, quindi la fetta più grande è una richiesta sola. */
  const piu = $("g-chartpiu");
  const iscritto = typeof ONLINE !== "undefined" && ONLINE.identita();
  piu.innerHTML =
    (c.totale > 10
      ? '<button class="chartpiu" data-chart="' + (CHART_QUANTI === 10 ? 100 : 10) + '">' +
        (CHART_QUANTI === 10 ? "Vedi la top 100" : "Torna alla top 10") + '</button>'
      : "") +
    (iscritto ? "" : '<div class="chartnota">Entri in classifica a fine settimana.</div>');
  piu.querySelectorAll("[data-chart]").forEach(b => {
    b.onclick = () => {
      CHART_QUANTI = +b.dataset.chart;
      ONLINE.aggiornaClassifica(CHART_QUANTI).then(() => renderChart());
      renderChart();
    };
  });
}

/* La classifica di casa: quella di sempre, per chi gioca senza server. */
function chartDiCasa(){
  const art = window.ARTIST || {};
  const my = G.songs.filter(x => x.released).reduce((a2, x) => a2 + (x.last || 0), 0);
  sistemaRivali();
  const all = G.rivals.map(r => ({ n: r.n, p: r.p, r })).concat([{ n: (art.name || "Tu").trim(), p: my, me: true }]);
  all.sort((a2, b2) => b2.p - a2.p);
  const mioTop = G.songs.filter(x => x.released).sort((a, b) => (b.last || 0) - (a.last || 0))[0];
  $("g-chart").innerHTML = all.slice(0, 10).map((x, i) => {
    const pos = i + 1;
    const prima = x.me ? (G.chartPrev || 99) : posPrec(x);
    return chartRigaHtml({
      pos, me: !!x.me, nome: x.me ? (art.name || "Tu") : x.n,
      click: x.me ? "" : x.n,
      cover: x.me
        ? (mioTop ? cover(mioTop.seed || 1, mioTop.t, art.name || "TU", mioTop.img) : "")
        : cover(x.r.seed, x.r.ult, x.n),
      faccia: x.me ? "" : faccia(x.r, 34),
      hot: !x.me && x.r.hot > 0,
      sotto: x.me
        ? G.age + " anni · " + (art.city || "la tua città") + " · " + PHASES[G.phase].n.toLowerCase()
        : (x.r.eta ? x.r.eta + " anni · " : "") + x.r.city + " · " + x.r.gen +
          (x.r.deal ? " · sotto contratto" : " · indipendente"),
      stream: x.p, delta: prima - pos
    });
  }).join("");
  G.chartPrev = all.findIndex(x => x.me) + 1;
  $("g-charthead").textContent = "Top 10 della settimana";
  $("g-chartpiu").innerHTML = "";
  $("g-chart").querySelectorAll("[data-riv]").forEach(el => {
    el.onclick = () => schedaRivale(el.dataset.riv);
  });
}

/* ==================== LA DISCOGRAFIA (punto 19) ====================
   Il catalogo dice cosa hai in cartella; la discografia dice cosa e' uscito e
   come sta andando. La differenza che conta e' il tempo: un pezzo non e' un
   numero fermo, e' una curva che sale e poi scende. `s.storia` (js/game/sim.js)
   tiene le ultime ventisei settimane, e da quelle si vede se un pezzo sta
   invecchiando bene o male. */

/* la curva delle ultime settimane, disegnata piccola accanto al pezzo */
function discoCurva(storia, colore){
  const d = (storia || []).slice(-14);
  if(d.length < 2) return '<span class="dcurva vuota"></span>';
  const max = Math.max.apply(null, d) || 1;
  const W = 68, H = 22;
  const punti = d.map((v, i) => {
    const x = d.length === 1 ? 0 : (i / (d.length - 1)) * W;
    const y = H - (v / max) * (H - 2) - 1;
    return x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");
  return '<span class="dcurva"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
    '<polyline points="' + punti + '" fill="none" stroke="' + colore + '" stroke-width="1.6" ' +
    'stroke-linejoin="round" stroke-linecap="round"/></svg></span>';
}

/* Come sta andando: si confrontano le ultime due settimane vere. Non e' un
   giudizio sul pezzo, e' il verso in cui sta andando adesso. */
function discoAndamento(s){
  const d = s.storia || [];
  if(!s.last && d.length < 2) return {k:"nuovo", t:"appena uscito", c:"#94A3B8", f:""};
  if(d.length < 2) return {k:"nuovo", t:"prima settimana", c:"#94A3B8", f:""};
  const ora = d[d.length - 1], prima = d[d.length - 2];
  if(ora === 0 && prima === 0) return {k:"fermo", t:"non lo ascolta piu' nessuno", c:"#6B7280", f:""};
  const var_ = prima === 0 ? 1 : (ora - prima) / prima;
  if(var_ >= 0.12) return {k:"su", t:"sta risalendo", c:"#4ADE80", f:"+" + Math.round(var_ * 100) + "%"};
  if(var_ >= -0.12) return {k:"tiene", t:"tiene", c:"#38BDF8", f:(var_ >= 0 ? "+" : "") + Math.round(var_ * 100) + "%"};
  if(var_ >= -0.4) return {k:"cala", t:"sta calando", c:"#FBBF24", f:Math.round(var_ * 100) + "%"};
  return {k:"giu", t:"sta sparendo", c:"#F87171", f:Math.round(var_ * 100) + "%"};
}

function discoQuando(s){
  const sett = s.week || 0;
  const anno = Math.floor((sett - 1) / 52) + 1;
  const nel = sett - (anno - 1) * 52;
  return "anno " + anno + ", settimana " + nel;
}

function renderDiscografia(){
  const box = $("g-disco");
  if(!box) return;
  const fuori = G.songs.filter(x => x.released);

  if(!fuori.length){
    box.innerHTML = '<div class="list"><h3>Discografia</h3>' +
      '<div class="empty2">Non e\u2019 ancora uscito niente. Scrivi, registra, pubblica: ' +
      'da l\u00ec in poi i pezzi vivono per conto loro e qui si vede come.</div></div>';
    return;
  }

  const totali = fuori.reduce((n, x) => n + (x.streams || 0), 0);
  const settimana = fuori.reduce((n, x) => n + (x.last || 0), 0);
  const migliore = fuori.slice().sort((a, b) => (b.streams || 0) - (a.streams || 0))[0];
  const cc = coloreAccento((window.ARTIST || {}).color);

  const testa = '<div class="dtesta">' +
    '<div class="dbox"><span class="k">Pezzi fuori</span><span class="v">' + fuori.length + '</span></div>' +
    '<div class="dbox"><span class="k">Stream in tutto</span><span class="v">' + short(totali) + '</span></div>' +
    '<div class="dbox"><span class="k">Questa settimana</span><span class="v">' + short(settimana) + '</span></div>' +
    '<div class="dbox"><span class="k">Il piu\u2019 ascoltato</span><span class="v piccolo">' + migliore.t + '</span></div>' +
    '</div>';

  /* dal piu\u2019 recente: la discografia si legge dall\u2019ultimo pezzo */
  const righe = fuori.slice().sort((a, b) => (b.week || 0) - (a.week || 0)).map(x => {
    const a = discoAndamento(x);
    const i = G.songs.indexOf(x);
    return '<div class="drow" style="--k:' + a.c + '">' +
      '<span class="dcov">' + cover(x.seed || (i + 11), x.t, (window.ARTIST || {}).name || "", x.img) + '</span>' +
      '<span class="dnm"><b>' + x.t + '</b>' +
        '<span>' + discoQuando(x) + ' \u00b7 qualit\u00e0 ' + x.q +
        (x.video ? ' \u00b7 con il video' : '') + '</span></span>' +
      discoCurva(x.storia, a.c) +
      '<span class="dand"><u>' + a.t + '</u>' + (a.f ? '<em>' + a.f + '</em>' : '') + '</span>' +
      '<span class="dnum"><b>' + short(x.streams || 0) + '</b><span>' + short(x.last || 0) + ' questa sett.</span></span>' +
      '</div>';
  }).join("");

  box.innerHTML = '<div class="list"><h3>Discografia</h3>' + testa +
    '<div class="dlista">' + righe + '</div>' +
    '<p class="dnota">La curva sono le ultime settimane di ascolti. Un pezzo che scende non \u00e8 ' +
    'un pezzo brutto: \u00e8 un pezzo vecchio. Quello che lo rimette in piedi \u00e8 quello che gli ' +
    'succede intorno \u2014 un video, un feat, un palco, un altro pezzo che tira su tutto il resto.</p>' +
    '</div>';
  box.querySelector(".dlista").style.setProperty("--acc", cc);
}

/* Linguette dentro a un pannello: una lista alla volta invece di quattro
   impilate. Vale per qualunque .subnav, non solo per il catalogo. */
document.querySelectorAll(".subnav").forEach(sn => {
  const pane = sn.parentNode;
  sn.querySelectorAll(".sb").forEach(t => {
    t.onclick = () => {
      sn.querySelectorAll(".sb").forEach(x => x.classList.toggle("on", x === t));
      pane.querySelectorAll(".spane").forEach(sp => sp.classList.toggle("on", sp.dataset.s === t.dataset.s));
      if(typeof beatStop === "function") beatStop();
    };
  });
});

/* I numeri di contorno — benessere, lucidità, pezzi fuori, lavoro — stanno
   chiusi: si aprono quando li vuoi e restano aperti finché non li richiudi. */
$("g-dett").onclick = () => {
  const st = $("g-stats"), apri = st.hidden;
  st.hidden = !apri;
  $("g-dett").setAttribute("aria-expanded", apri ? "true" : "false");
  $("g-dett").classList.toggle("aperto", apri);
};
let weekOpen = null, weekEarn = 0;
function openWeek(){
  weekOpen = {money:G.money, fans:G.fans,
    bestPos: chartPosition(G.songs.filter(x => x.released).reduce((a,x) => a + (x.last||0), 0))};
  weekEarn = 0;
}
/* Punto 40: si chiude la giornata, non più la settimana. Il rapporto
   (weekReport) esce solo il settimo giorno, quando avanzaGiorno() fa
   scattare davvero il battito economico — gli altri sei è solo notte
   che passa, niente da raccontare con una finestra sopra. */
$("g-advance").onclick = () => {
  if(!weekOpen) openWeek();
  const before = weekOpen, costs = weeklyCosts();
  const chiusa = avanzaGiorno();
  if(chiusa){ weekReport(before, costs); openWeek(); }
  else{ SFX.giorno(); save(); renderGioco(); }
};
$("g-skip").onclick = () => saltaTempo();
$("g-tomenu").onclick = () => { save(); if(window.GO) window.GO("menu"); };


