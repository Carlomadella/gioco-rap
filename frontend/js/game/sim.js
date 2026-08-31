/* Simulazione: chiusura settimana, stream, spese, classifica, traguardi. */
"use strict";

/* ==================== SIMULAZIONE ==================== */
const totalWeeks = () => (G.year-1)*52 + G.week;

/* acceso mentre stai saltando avanti nel tempo: le settimane passano,
   ma eventi e prove aspettano che tu torni a giocarle davvero */
let SALTO = false;

function pushLog(text, cls){
  G.log.unshift({w:"A" + G.year + " S" + String(G.week).padStart(2,"0"), t:text, c:cls || ""});
  if(G.log.length > 80) G.log.length = 80;
}

function songWeekly(s){
  const age = totalWeeks() - s.week;
  const curve = age <= 1 ? 1 : Math.exp(-age/7.5);
  const push = G.contract ? G.contract.push : 1;
  // chi ti segue già lo ascolta; gli altri ti scoprono solo se il pezzo è forte e c'è hype
  const fanPull = G.fans * rnd(0.26, 0.5) * (0.5 + s.q/170);
  const scoperta = Math.pow(Math.max(0, s.q - 26)/74, 2.6) * (35 + G.hype*13) * push;
  let out = (fanPull + scoperta) * curve * rnd(0.8, 1.25);
  if(s.viral) out *= s.viral;
  return Math.round(out);
}

/* crescita delle abilità con rendimenti decrescenti: i primi punti sono facili, gli ultimi no */
function gain(k, a){
  G.skills[k] = clamp(G.skills[k] + a * Math.max(0.12, 1 - G.skills[k]/88), 0, 88);
}

/* le spese fisse: la durezza scelta nelle impostazioni pesa su tutto il conto */
function weeklyCosts(){ return Math.round((25 + G.fans*0.0006 + G.songs.length*2 + lifeCost()) * difSpese()); }

function advanceWeek(){
  if(G.ended) return;
  // colpo di fortuna: raro, e più probabile se il pezzo è forte ed è appena uscito
  for(const s of G.songs){
    if(!s.released) continue;
    const age = totalWeeks() - s.week;
    if(!s.viral && age <= 3 && Math.random() < (s.q >= 60 ? 0.028 : 0.005) * (1 + G.hype/70)){
      s.viral = rnd(2.4, 5.5);
      pushLog("<b>«" + s.t + "» sta girando.</b> Qualcuno l'ha messo in una clip e sono partiti in tanti.", "good");
    }
    if(s.viral){ s.viral *= 0.72; if(s.viral < 1.08) delete s.viral; }
  }

  const grezzi = [];
  for(const s of G.songs){ if(s.released) grezzi.push([s, songWeekly(s)]); }
  let tot = grezzi.reduce((a,x) => a + x[1], 0);
  const cap = PHASES[G.phase].cap;
  const fattore = (tot > cap && tot > 0) ? (cap + (tot - cap) * 0.2) / tot : 1;
  let streams = 0;
  for(const [s, v] of grezzi){
    const w = Math.round(v * fattore);
    s.streams += w; s.last = w; streams += w;
  }
  if(fattore < 0.75 && G.phase < PHASES.length-1 && Math.random() < .3)
    pushLog("Il pezzo gira, ma oltre <b>" + PHASES[G.phase].n.toLowerCase() + "</b> non arriva. Serve il passo dopo.", "");

  const newFans = Math.round((streams * 0.017 + G.hype * 0.7) * difFan());
  G.fans += newFans;

  // chi ti segue se ne va, se sparisci
  const ultima = G.songs.filter(x => x.released).reduce((a,x) => Math.max(a, x.week), 0);
  const fermo = totalWeeks() - ultima;
  if(G.fans > 60){
    const churn = 0.005 + (fermo > 5 ? Math.min(0.03, (fermo-5)*0.004) : 0);
    const persi = Math.round(G.fans * churn);
    G.fans = Math.max(0, G.fans - persi);
    if(persi > 40) pushLog(fmt(persi) + " persone hanno smesso di seguirti.", fermo > 8 ? "bad" : "");
  }

  // il tetto della fase: oltre non ci arrivi finché non superi la prova
  const fmax = PHASES[G.phase].fmax;
  if(G.fans > fmax){
    G.fans = Math.round(fmax + (G.fans - fmax) * 0.88);
    if(Math.random() < .2)
      pushLog("Sei al soffitto di <b>" + PHASES[G.phase].n.toLowerCase() + "</b>. Senza il passo dopo, i numeri si fermano qui.", "");
  }

  let gross = streams * 0.0055;
  if(G.contract) gross *= G.contract.share;
  if(G.manager) gross *= 0.85;
  const costs = weeklyCosts();
  G.money += gross - costs;

  // Il lifestyle lo vivi solo se hai tempo: ogni turno di lavoro te ne toglie un pezzo.
  const lb = lifeBonus();
  const vissuto = clamp(1 - (G.shifts||0) * 0.20, 0.25, 1);
  G.fans += Math.round(newFans * (lb.fan - 1) * vissuto);
  G.hype = clamp(G.hype * 0.87 + lb.hype * vissuto, 0, 100);

  // il benessere tende al livello naturale del tuo tenore di vita, non sale all'infinito
  const naturale = clamp(34 + lb.well * 4.6 * vissuto - (G.money < 0 ? 12 : 0), 12, 100);
  G.wellbeing = clamp(G.wellbeing + (naturale - G.wellbeing) * 0.45, 0, 100);
  if((G.shifts||0) >= 3)
    pushLog("Tre turni in una settimana. <b>Il tenore di vita che paghi non lo stai vivendo.</b>", "");
  gain("rete", lb.rete * vissuto);
  syncEnergy();
  G.energy = G.maxEnergy;

  if(G.job){
    if(G.shifts > 0) G.job.missed = 0;
    else{
      G.job.missed++;
      if(G.job.missed >= 3){
        pushLog("<b>Ti hanno licenziato</b> da " + G.job.n + ". Niente più stipendio.", "bad");
        G.job = null;
      }else{
        pushLog("Non ti sei presentato al lavoro. Ancora " + (3 - G.job.missed) +
          " settimane così e ti licenziano.", "bad");
      }
    }
  }
  G.shifts = 0;

  /* la lucidità cala da sola: se non stai sui pezzi, la testa va altrove */
  addLuc(-4);
  G.rest = 0;
  if(luc() <= 25 && Math.random() < .5)
    pushLog("<b>Non hai la testa dentro.</b> Ti siedi al foglio e non esce niente di buono.", "bad");

  // la scena intorno a te va avanti da sola
  sistemaRivali();
  vitaRivali(streams);

  const pos = chartPosition(streams);
  G.streamsPrev = streams;
  if(streams > 0 && pos <= G.best.chart) G.best.chart = pos;
  G.best.fans = Math.max(G.best.fans, G.fans);

  if(streams > 0)
    pushLog("<b>" + fmt(streams) + " stream</b>, " + fmt(newFans) + " nuovi fan, " +
      (gross-costs >= 0 ? "+" : "") + fmt(gross-costs) + " €" +
      (pos <= 10 ? " · <b>#" + pos + " in classifica</b>" : ""), pos <= 10 ? "good" : "");
  else
    pushLog("Nessun pezzo fuori. Spese della settimana: −" + fmt(costs) + " €", "");

  if(G.money < -400){
    G.wellbeing = clamp(G.wellbeing - 12, 0, 100);
    pushLog("<b>Sei sotto di " + fmt(-G.money) + " €.</b> Non dormi la notte.", "bad");
  }

  // contratto: obblighi
  if(G.obligation){
    G.obligation.left--;
    const done = G.songs.filter(s => s.released && s.week > G.obligation.from).length;
    if(done >= G.obligation.need){
      pushLog("<b>Obblighi contrattuali completati.</b> Sei libero da questa scadenza.", "good");
      G.obligation = null;
    }else if(G.obligation.left <= 0){
      const fine = Math.round(G.contract.advance * 0.4);
      G.money -= fine;
      pushLog("<b>Non hai consegnato in tempo.</b> Penale di " + fmt(fine) + " €.", "bad");
      G.obligation = null;
    }
  }

  G.week++;
  if(G.week > 52){ G.week = 1; G.year++; G.age++; pushLog("<b>Un anno in più.</b> Hai " + G.age + " anni.", "big"); }

  checkGoals();
  if(G.trialCd > 0) G.trialCd--;
  const prova = (!SALTO && G.trialCd <= 0) ? pendingTrial() : null;
  if(prova){ G.trialsDone[prova.ph] = true; showEvent(prova); }
  else if(!SALTO && Math.random() < .38) maybeEvent();
  save(); renderGioco();
}

function posPrec(x){
  if(!x.r) return 99;
  const tutti = G.rivals.map(r2 => ({p: r2.prev != null ? r2.prev : r2.p, n:r2.n}))
    .concat([{p: G.streamsPrev || 0, me:true}]);
  tutti.sort((a,b) => b.p - a.p);
  return tutti.findIndex(y => y.n === x.n) + 1;
}
function schedaRivale(nome){
  const r2 = G.rivals.find(x => x.n === nome);
  if(!r2) return;
  const mio = G.songs.filter(x => x.released).reduce((a,x) => a + (x.last||0), 0);
  const dist = mio > 0 ? (r2.p > mio ? "ti sta davanti di " + short(r2.p - mio) + " stream"
    : "sei avanti tu di " + short(mio - r2.p) + " stream") : "tu non sei ancora in classifica";
  const trend = r2.prev ? (r2.p > r2.prev*1.05 ? "in salita" : r2.p < r2.prev*0.95 ? "in calo" : "fermo") : "—";
  $("m-k").textContent = "Chi è";
  $("m-t").textContent = r2.n;
  $("m-d").innerHTML = '<div class="rcard2">' +
    '<div class="top2">' + faccia(r2, 62) + '<div><b>' + r2.n + '</b><span>' + r2.city + ' · ' + r2.gen +
      ' · ' + (r2.deal ? "sotto contratto" : "indipendente") + '</span></div></div>' +
    '<div class="stat2">' +
      '<div><div class="v2">' + short(r2.p) + '</div><div class="l2">stream</div></div>' +
      '<div><div class="v2">' + r2.usc + '</div><div class="l2">uscite</div></div>' +
      '<div><div class="v2">' + trend + '</div><div class="l2">tendenza</div></div>' +
    '</div>' +
    '<p style="margin:0 0 12px;font-size:14px;color:var(--soft)">' + r2.storia + ' Adesso ' + dist + '.</p>' +
    '<div class="ul"><span class="cv">' + cover(r2.seed, r2.ult, r2.n) + '</span>' +
      '<span><b style="display:block;font-size:14px">«' + r2.ult + '»</b>' +
      '<span style="font-size:12.5px;color:var(--soft)">ultima uscita</span></span></div></div>';
  const w = $("m-opts"); w.innerHTML = "";
  const b = document.createElement("button");
  b.className = "opt2";
  b.innerHTML = '<span class="n">Chiudi</span><span class="d">Torna alla classifica</span>';
  b.onclick = () => $("modal").classList.remove("on");
  w.appendChild(b);
  $("modal").classList.add("on");
}

function chartPosition(myStreams){
  const all = G.rivals.map(r => ({n:r.n, p:r.p, r})).concat([{n:"TU", p:myStreams, me:true}]);
  all.sort((a,b) => b.p - a.p);
  return all.findIndex(x => x.me) + 1;
}

function maybeEvent(){
  const now = totalWeeks();
  G.evCd = G.evCd || {};
  const pool = EVENTS.filter(e => (!e.when || e.when(G)) &&
    (e.once ? !G.evCd[e.id] : now - (G.evCd[e.id] || -999) >= 24));
  if(!pool.length) return;
  const e = pick(pool);
  G.evCd[e.id] = now;
  showEvent(e);
}

function checkGoals(){
  for(const g of GOALS){
    if(G.goals[g.id]) continue;
    if(!g.ok(G)) continue;
    G.goals[g.id] = true;
    if(g.rw.hype) G.hype = clamp(G.hype + g.rw.hype, 0, 100);
    if(g.rw.money) G.money += g.rw.money;
    if(g.rw.wellbeing) G.wellbeing = clamp(G.wellbeing + g.rw.wellbeing, 0, 100);
    pushLog("<b>Traguardo:</b> " + g.n + ".", "good");
  }
}
