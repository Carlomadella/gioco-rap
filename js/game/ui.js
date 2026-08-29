/* renderGioco(): disegna HUD, pannelli, liste e collega i comandi. */
"use strict";

const SHOWN = {};
const ART = {
  scrivi:["#FF5A36","#B026FF","S"], beat:["#3DC7FF","#B026FF","B"],
  registra:["#FFC53D","#3DC7FF","R"], mixa:["#FF4D9D","#FF5A36","M"],
  pubblica:["#B026FF","#FF4D9D","P"], promo:["#3DC7FF","#FFC53D","O"],
  free:["#FFC53D","#FF5A36","F"], live:["#FF4D9D","#B026FF","L"],
  turno:["#4A4A58","#22262E","€"], cercalavoro:["#5A6472","#2B2B34","C"],
  stacca:["#2B3340","#4A5568","Z"]
};

function renderGioco(){
  if(typeof beatStop === "function") beatStop();
  const art = window.ARTIST || {};
  const cc = art.color || "#FF5A36";
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
  $("g-meta").textContent = "Anno " + G.year + " · Settimana " + G.week + " · " +
    PHASES[G.phase].n + " · " + (G.contract ? G.contract.label : "indipendente");

  // fase della scalata
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
  $("g-phase").innerHTML = '<div class="phase"><div class="pk">La tua scalata</div>' +
    '<div class="pn">' + ph.n + '</div><div class="pd">' + ph.d + '</div>' +
    '<div class="ptrack">' + track + '</div>' + nxt + '</div>';

  let en = "";
  for(let i=0;i<G.maxEnergy;i++) en += '<i class="' + (i < G.energy ? "on" : "spent") + '"></i>';

  // livello ed esperienza
  const skl = G.skills.scrittura + G.skills.flow + G.skills.presenza + G.skills.rete;
  const xpTot = Math.round(G.fans + skl*22 + G.songs.filter(x=>x.released).length*140);
  let lvl = 1, need = 300, acc = 0;
  while(xpTot >= acc + need && lvl < 60){ acc += need; lvl++; need = Math.round(need*1.35); }
  const into = xpTot - acc;
  $("g-lvl").textContent = "LIV " + lvl;
  $("g-xp").style.width = clamp(into/need*100, 0, 100) + "%";
  $("g-xptxt").textContent = fmt(into) + " / " + fmt(need);

  // risorse
  const pod = (k, ic, val, lab, neg) =>
    '<span class="rchip' + (neg ? " neg" : "") + '" style="--k:' + k + '">' +
    '<i style="background:linear-gradient(180deg,' + k + ',color-mix(in srgb,' + k + ' 70%, #000))">' + ic + '</i>' +
    '<span><b>' + val + '</b><u>' + lab + '</u></span></span>';
  $("g-res").innerHTML =
    pod("var(--acid)", "€", fmt(G.money), "in cassa", G.money < 0) +
    pod("var(--hot)", "♥", short(G.fans), "chi ti segue") +
    pod("var(--violet)", "▲", Math.round(G.hype), "hype") +
    pod("var(--sky)", "✦", G.energy + "/" + G.maxEnergy, "turni");

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

  const box = (n, l, cls, meter, ok, key, raw) =>
    '<div class="sbox"><div class="n ' + (cls||"") + '"' + (key ? ' data-k="' + key + '" data-to="' + raw + '"' : '') + '>' + n + '</div><div class="l">' + l + '</div>' +
    (meter !== undefined ? '<div class="meter"><i class="' + (ok?"ok":"") + '" style="width:' + clamp(meter,0,100) + '%"></i></div>' : '') +
    '</div>';
  $("g-stats").innerHTML =
    box(Math.round(G.wellbeing), "benessere", G.wellbeing <= 30 ? "red" : "", G.wellbeing, G.wellbeing > 30) +
    box(Math.round(luc()), "lucidità", luc() <= 30 ? "red" : "", luc(), luc() > 45) +
    box(G.songs.filter(x => x.released).length, "pezzi fuori") +
    box(G.job ? G.job.pay + " €" : "—", G.job ? "a turno · " + G.job.n.toLowerCase() : "nessun lavoro");

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
    b.onclick = () => {
      if(!ok) return;
      const fansBefore = G.fans, moneyBefore = G.money;
      G.energy -= en2;
      const msg = a.run();
      if(a.luc) addLuc(a.luc);
      if(msg) pushLog(msg, "");
      G.wellbeing = clamp(G.wellbeing, 0, 100);
      const s2 = SFX[SND[a.id] || "tap"]; if(s2) s2();
      b.classList.add("hit"); setTimeout(() => b.classList.remove("hit"), 430);
      let extra = "";
      const df = G.fans - fansBefore, dm = Math.round(G.money - moneyBefore);
      if(df > 0) extra += ' <b>+' + fmt(df) + ' fan</b>';
      if(dm > 0){ extra += ' <b>+' + fmt(dm) + ' €</b>'; weekEarn += dm; }
      toast(msg + extra, "good", g[2], [g[0], g[1]]);
      checkGoals(); save(); renderGioco();
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
      SFX.tap();
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

  const PAL = [["#FF5A36","#FF4D9D"],["#3DC7FF","#B026FF"],["#FFC53D","#3DC7FF"],["#B026FF","#FF5A36"]];
  $("g-songs").innerHTML = G.songs.length
    ? G.songs.slice().reverse().map((x,i) => {
        return '<div class="li"><span class="cov">' +
          cover(x.seed || (i+11), x.t, (window.ARTIST||{}).name || "", x.img) + '</span>' +
        '<span class="nm"><b>' + x.t + '</b><span>qualità ' + x.q + (x.released ? " · " + short(x.streams) + " stream" : "") + '</span></span>' +
        '<button class="rinomina" data-ren="' + G.songs.indexOf(x) + '" title="Cambia titolo">✎</button>' +
        '<span class="tag' + (x.released ? " on" : "") + '">' + (x.released ? "fuori" : x.mixed ? "pronto" : "grezzo") + '</span></div>';
      }).join("")
    : '<div class="empty2">Nessun pezzo registrato.</div>';

  $("g-songs").querySelectorAll("[data-ren]").forEach(btn => {
    btn.onclick = () => {
      const sx = G.songs[+btn.dataset.ren]; if(!sx) return;
      SFX.tap();
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

  // classifica
  const my = G.songs.filter(x => x.released).reduce((a2,x) => a2 + (x.last||0), 0);
  sistemaRivali();
  const all = G.rivals.map(r => ({n:r.n, p:r.p, r})).concat([{n:(art.name||"Tu").trim(), p:my, me:true}]);
  all.sort((a2,b2) => b2.p - a2.p);
  const mioTop = G.songs.filter(x => x.released).sort((a,b) => (b.last||0)-(a.last||0))[0];
  $("g-chart").innerHTML = all.slice(0,10).map((x,i) => {
    const pos = i+1;
    const prima = x.me ? (G.chartPrev || 99) : posPrec(x);
    const d = prima - pos;
    const dl = d > 0 ? '<span class="dl up">▲ ' + d + '</span>'
      : d < 0 ? '<span class="dl dn">▼ ' + (-d) + '</span>'
      : '<span class="dl eq">—</span>';
    const cv = x.me
      ? (mioTop ? cover(mioTop.seed || 1, mioTop.t, (window.ARTIST||{}).name || "TU", mioTop.img) : "")
      : cover(x.r.seed, x.r.ult, x.n);
    const fc = x.me ? "" : '<span class="fc">' + faccia(x.r, 34) + '</span>';
    const sotto = x.me
      ? ((window.ARTIST||{}).city || "la tua città") + " · " + PHASES[G.phase].n.toLowerCase()
      : x.r.city + " · " + x.r.gen + (x.r.deal ? " · sotto contratto" : " · indipendente");
    return '<div class="crow' + (x.me ? " me" : "") + '"' + (x.me ? "" : ' data-riv="' + x.n + '"') + '>' +
      '<span class="pz">' + pos + '</span>' +
      '<span class="cv">' + cv + '</span>' + fc +
      '<span class="in3"><b>' + (x.me ? ((window.ARTIST||{}).name || "Tu") : x.n) +
        (x.r && x.r.hot > 0 ? '<i class="hotdot"></i>' : "") + '</b><span>' + sotto + '</span></span>' +
      '<span class="rt"><span class="st">' + short(x.p) + '</span>' + dl + '</span></div>';
  }).join("");
  G.chartPrev = all.findIndex(x => x.me) + 1;
  $("g-chart").querySelectorAll("[data-riv]").forEach(el => {
    el.onclick = () => { SFX.tap(); schedaRivale(el.dataset.riv); };
  });

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

  $("g-life").innerHTML = LIFE.map(cat => {
    const cur = G.life[cat.id] || 0;
    return '<div class="lcat" style="--a:' + cat.c[0] + '33">' +
      '<div class="lhead"><span class="ic">' + cat.ic + '</span>' +
      '<span class="tt"><b>' + cat.n + '</b><span>' + cat.t[cur].n + '</span></span>' +
      '<span class="cw">' + (cat.t[cur].w ? fmt(cat.t[cur].w) + ' €' : 'gratis') + '</span></div>' +
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

  $("g-bar-a").textContent = "A" + G.year + " · S" + G.week;
  $("g-bar-b").textContent = G.energy + "/" + G.maxEnergy + " turni";
}

function openDiary(){
  $("drawer").classList.add("on");
  G.seenLog = G.log.length; save(); renderGioco();
}
function closeDiary(){ $("drawer").classList.remove("on"); }
$("g-diary").onclick = () => { SFX.tap(); openDiary(); };
$("d-close").onclick = () => { SFX.tap(); closeDiary(); };
$("drawer").addEventListener("click", e => { if(e.target.id === "drawer") closeDiary(); });
document.addEventListener("keydown", e => { if(e.key === "Escape") closeDiary(); });

document.querySelectorAll(".nb").forEach(t => {
  t.onclick = () => {
    document.querySelectorAll(".nb").forEach(x => x.classList.toggle("on", x === t));
    document.querySelectorAll(".gpane").forEach(pp => pp.classList.toggle("on", pp.dataset.p === t.dataset.t));
    if(typeof beatStop === "function") beatStop();
    SFX.tap();
  };
});
let weekOpen = null, weekEarn = 0;
function openWeek(){
  weekOpen = {money:G.money, fans:G.fans,
    bestPos: chartPosition(G.songs.filter(x => x.released).reduce((a,x) => a + (x.last||0), 0))};
  weekEarn = 0;
}
$("g-advance").onclick = () => {
  if(!weekOpen) openWeek();
  const before = weekOpen;
  const costs = weeklyCosts();
  advanceWeek();
  weekReport(before, costs);
  openWeek();
};
$("g-skip").onclick = () => { SFX.tap(); saltaTempo(); };
$("g-menu").onclick = () => { if(window.GO) window.GO("menu"); };


