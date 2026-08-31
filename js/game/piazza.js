/* Freestyle in piazza: scena animata, folla, minigioco a tempo. */
"use strict";

/* ==================== FREESTYLE IN PIAZZA ==================== */
const SITUAZIONI = [
  {t:"Uno davanti a te ride e dice che sei uguale a tutti gli altri.",
   o:[["Se sono uguale agli altri dimmi il nome di uno che ti ha fermato per strada", 1],
      ["Ridi pure, tanto stasera ti ricordi solo la mia faccia", .7],
      ["Non è colpa mia se hai le orecchie chiuse", .25]]},
  {t:"Passa una volante, la gente si gira e per due secondi nessuno ti guarda più.",
   o:[["Guardate loro o guardate me, tanto io resto quando se ne vanno", 1],
      ["Aspetto che passi, io ho tempo", .5],
      ["Meglio così, almeno c'è il silenzio", .3]]},
  {t:"Un ragazzino sotto il palco sa a memoria una tua barra e la urla prima di te.",
   o:[["Tienila tu quella barra, io ne ho altre venti in tasca", 1],
      ["Sali qui e falla insieme a me", .9],
      ["Zitto che rovini il pezzo", .1]]},
  {t:"Il beat si incarta per un secondo, l'impianto gracchia.",
   o:[["Anche senza cassa io conto lo stesso, ascoltate solo la voce", 1],
      ["Aspetto che riparta, non è roba mia", .35],
      ["Fischia l'impianto come fischiate voi", .5]]},
  {t:"Una tipa filma tutto col telefono a mezzo metro dalla tua faccia.",
   o:[["Riprendi bene che questa te la rivedi fra due anni e capisci", 1],
      ["Abbassa il telefono e stai qui davvero", .75],
      ["Non riprendere che poi finisco su internet", .2]]},
  {t:"Dall'altra parte della piazza un altro comincia a rappare sopra di te.",
   o:[["Uno alla volta, e comincia tu, così so cosa devo battere", 1],
      ["Alza la voce che da qui non ti sento", .8],
      ["Lascio stare, non ho voglia di litigare", .15]]}
];

/* ---- LA PIAZZA: fondale, il tuo personaggio, i passanti ---- */
const PEDCOL = ["#2A2E38","#343946","#232733","#3B404E","#2E3340","#454B5A","#262A34"];
const PEDSKIN = ["#E8B991","#C68A5C","#9A6238","#82502D","#F2CBA8","#684023","#B0774A"];
function passante(i){
  const c = PEDCOL[i % PEDCOL.length];
  const cd = "#15171E";
  const sk = PEDSKIN[(i*3) % PEDSKIN.length];
  return '<g class="ped" id="ped' + i + '">' +
    '<ellipse cx="0" cy="1" rx="7" ry="2.2" fill="#000" opacity=".35"/>' +
    '<g class="pl">' +
      '<path d="M-3,-17 L-4.4,-1 L-1.2,-1 L-0.6,-17 Z" fill="' + cd + '"/>' +
      '<path d="M3,-17 L4.4,-1 L1.2,-1 L0.6,-17 Z" fill="' + cd + '"/>' +
    '</g>' +
    '<path d="M-5.6,-16 C-6.4,-26 -5.6,-31 -3.6,-33 L3.6,-33 C5.6,-31 6.4,-26 5.6,-16 Z" fill="' + c + '"/>' +
    '<circle cx="0" cy="-37.5" r="4.4" fill="' + sk + '"/>' +
    '<path d="M-4.4,-38.5 C-4.4,-42 -2.4,-43.4 0,-43.4 C2.4,-43.4 4.4,-42 4.4,-38.5 Z" fill="#14110F"/>' +
    '</g>';
}
function costruisciScena(){
  const N = 16;
  let peds = "";
  for(let i=0;i<N;i++) peds += passante(i);
  window.__POSE = "mic";
  const corpo = window.ARTIST_BODY ? window.ARTIST_BODY() : "";
  const col = (window.ARTIST && window.ARTIST.color) || "#FF5A36";
  $("p-scena").innerHTML =
  '<svg viewBox="0 0 360 230" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#241A33"/><stop offset=".55" stop-color="#17131F"/>' +
        '<stop offset="1" stop-color="#0E0C13"/></linearGradient>' +
      '<linearGradient id="terra" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#1B1A22"/><stop offset="1" stop-color="#101016"/></linearGradient>' +
      '<linearGradient id="lamp" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#FFD98A" stop-opacity=".30"/>' +
        '<stop offset=".65" stop-color="#FFD98A" stop-opacity=".10"/>' +
        '<stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="pozza" cx=".5" cy=".5" r=".5">' +
        '<stop offset="0" stop-color="#FFD98A" stop-opacity=".22"/>' +
        '<stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="alone" cx=".5" cy=".5" r=".5">' +
        '<stop offset="0" stop-color="' + col + '" stop-opacity=".5"/>' +
        '<stop offset="1" stop-color="' + col + '" stop-opacity="0"/></radialGradient>' +
    '</defs>' +
    '<rect width="360" height="230" fill="url(#cielo)"/>' +
    '<path d="M302,22 A13,13 0 1 0 302,46 A10,10 0 1 1 302,22 Z" fill="#F3EAD3" opacity=".88"/>' +
    // palazzi
    '<g fill="#0C0B11">' +
      '<path d="M0,150 L0,72 L38,72 L38,58 L74,58 L74,150 Z"/>' +
      '<path d="M84,150 L84,44 L128,44 L128,150 Z"/>' +
      '<path d="M138,150 L138,66 L176,66 L176,52 L206,52 L206,150 Z"/>' +
      '<path d="M216,150 L216,38 L252,38 L252,150 Z"/>' +
      '<path d="M262,150 L262,78 L306,78 L306,64 L360,64 L360,150 Z"/>' +
    '</g>' +
    '<g fill="#FFC96B" opacity=".62" id="finestre">' +
      '<rect x="10" y="84" width="7" height="9"/><rect x="24" y="84" width="7" height="9"/>' +
      '<rect x="10" y="102" width="7" height="9"/><rect x="46" y="70" width="7" height="9"/>' +
      '<rect x="60" y="70" width="7" height="9"/><rect x="46" y="90" width="7" height="9"/>' +
      '<rect x="94" y="56" width="8" height="10"/><rect x="110" y="56" width="8" height="10"/>' +
      '<rect x="94" y="78" width="8" height="10"/><rect x="110" y="98" width="8" height="10"/>' +
      '<rect x="148" y="78" width="7" height="9"/><rect x="162" y="78" width="7" height="9"/>' +
      '<rect x="184" y="64" width="8" height="10"/><rect x="184" y="88" width="8" height="10"/>' +
      '<rect x="226" y="50" width="8" height="10"/><rect x="240" y="50" width="8" height="10"/>' +
      '<rect x="226" y="74" width="8" height="10"/><rect x="240" y="96" width="8" height="10"/>' +
      '<rect x="272" y="90" width="7" height="9"/><rect x="288" y="90" width="7" height="9"/>' +
      '<rect x="318" y="76" width="8" height="10"/><rect x="336" y="76" width="8" height="10"/>' +
    '</g>' +
    // terra
    '<rect y="150" width="360" height="80" fill="url(#terra)"/>' +
    '<path d="M0,150 L360,150 L360,154 L0,154 Z" fill="#000" opacity=".5"/>' +
    '<g stroke="#000" stroke-opacity=".35" stroke-width="1">' +
      '<path d="M40,230 L96,150"/><path d="M140,230 L158,150"/><path d="M240,230 L222,150"/>' +
      '<path d="M330,230 L280,150"/><path d="M0,190 L360,190"/>' +
    '</g>' +
    // lampione
    '<path d="M70,90 L48,214 L112,214 Z" fill="url(#lamp)"/>' +
    '<ellipse cx="80" cy="212" rx="52" ry="15" fill="url(#pozza)"/>' +
    '<path d="M44,214 L44,84 L70,84" stroke="#08080C" stroke-width="4" fill="none"/>' +
    '<path d="M64,84 L76,84 L79,92 L61,92 Z" fill="#0A0A0E"/>' +
    '<circle cx="70" cy="90" r="3.6" fill="#FFE7B4"/>' +
    // passanti dietro
    '<g id="pedlayer">' + peds + '</g>' +
    // il tuo personaggio
    '<g id="me" transform="translate(180,208) scale(0.255)">' +
      '<ellipse id="onda" cx="0" cy="0" rx="90" ry="26" fill="url(#alone)" opacity="0"/>' +
      '<g id="mebody">' + corpo + '</g>' +
    '</g>' +
  '</svg>' +
  '<div class="judge2" id="p-judge"></div>';
}

/* stato dei passanti */
function initPed(){
  FS.ped = [];
  for(let i=0;i<16;i++){
    const lane = i % 4;
    FS.ped.push({
      i, x: rnd(-90, 450), y: 170 + lane*11 + rnd(-2,2),
      sc: 0.95 + rnd(-.07,.09),
      v: (Math.random() < .5 ? -1 : 1) * rnd(14, 26),
      stato: "passa", tx: 0, fase: rnd(0, 6.28)
    });
  }
  FS.slot = [];
  const arco = [
    [96,182],[136,178],[224,178],[264,182],[62,188],[298,188],
    [80,206],[124,210],[236,210],[280,206],[46,200],[314,200]
  ];
  for(const [x,y] of arco) FS.slot.push({x, y, preso:-1});
}
function aggiornaPed(dt){
  const target = Math.round(FS.folla/100 * 12);
  let guardano = FS.ped.filter(p => p.stato === "guarda" || p.stato === "arriva").length;
  if(guardano < target){
    const libero = FS.slot.find(s => s.preso < 0);
    const cand = FS.ped.find(p => p.stato === "passa" && p.x > -40 && p.x < 400);
    if(libero && cand){ cand.stato = "arriva"; cand.slot = libero; libero.preso = cand.i; }
  } else if(guardano > target){
    const c = FS.ped.find(p => p.stato === "guarda" || p.stato === "arriva");
    if(c){ c.stato = "va"; if(c.slot){ c.slot.preso = -1; c.slot = null; }
      c.v = (c.x < 180 ? -1 : 1) * rnd(20, 34); }
  }
  for(const p of FS.ped){
    if(p.stato === "passa" || p.stato === "va"){
      p.x += p.v * dt;
      p.fase += dt * 9;
      if(p.x < -60){ p.x = 420; p.stato = "passa"; }
      if(p.x > 420){ p.x = -60; p.stato = "passa"; }
    } else if(p.stato === "arriva"){
      const dx = p.slot.x - p.x, dy = p.slot.y - p.y;
      const d = Math.hypot(dx, dy);
      p.fase += dt * 9;
      if(d < 3){ p.stato = "guarda"; }
      else { p.x += dx/d * 46 * dt; p.y += dy/d * 26 * dt; }
    } else {
      p.fase += dt * 2.2;
    }
    const el = document.getElementById("ped" + p.i);
    if(!el) continue;
    const bob = (p.stato === "guarda") ? Math.sin(p.fase)*0.7 : Math.abs(Math.sin(p.fase))*1.6;
    const flip = (p.stato === "guarda") ? (p.x > 180 ? -1 : 1) : (p.v < 0 ? -1 : 1);
    const sc = clamp(0.56 + (p.y - 166)/58 * 0.46, 0.5, 1.06) * p.sc;
    el.setAttribute("transform", "translate(" + p.x.toFixed(1) + "," + (p.y - bob).toFixed(1) +
      ") scale(" + (flip*sc).toFixed(3) + "," + sc.toFixed(3) + ")");
    el.setAttribute("opacity", p.stato === "guarda" ? "1" : ".82");
  }
}

let FS = null;
function apriPiazza(boost){
  FS = {boost:boost||1, folla:16, beat:0, tot:34, perfetti:0, buoni:0, persi:0,
        bpm:96, intervallo:0, prossima:0, tapped:false, timer:null, scelte:0, punti:0, fine:false};
  FS.intervallo = 60000/FS.bpm;
  $("piazza").classList.add("on");
  costruisciScena();
  initPed();
  disegnaFolla();
  scenaTap();
  FS.ultimo = performance.now();
  const anima = t => {
    if(!FS) return;
    const dt = Math.min(.05, (t - FS.ultimo)/1000); FS.ultimo = t;
    aggiornaPed(dt);
    const me = document.getElementById("mebody");
    if(me){
      const fase = (FS.prossima - t) / FS.intervallo;
      const salto = Math.max(0, Math.sin((1-fase) * Math.PI)) * 11;
      me.setAttribute("transform", "translate(0," + (-salto).toFixed(2) + ")");
    }
    FS.raf = requestAnimationFrame(anima);
  };
  FS.raf = requestAnimationFrame(anima);
  FS.prossima = performance.now() + 900;
  FS.timer = setInterval(battuta, FS.intervallo);
}
function chiudiPiazza(){
  if(FS && FS.timer) clearInterval(FS.timer);
  if(FS && FS.raf) cancelAnimationFrame(FS.raf);
  FS = null;
  $("piazza").classList.remove("on");
  document.removeEventListener("keydown", tastoPiazza);
}
function disegnaFolla(){
  const g = FS.ped ? FS.ped.filter(p => p.stato === "guarda" || p.stato === "arriva").length : 0;
  $("p-count").innerHTML = '<b>' + g + '</b> ferm' + (g === 1 ? "a" : "e") + ' ad ascoltarti · ' +
    (FS.folla >= 85 ? "la piazza è tua"
    : FS.folla >= 60 ? "si sta fermando gente"
    : FS.folla >= 35 ? "qualcuno guarda, qualcuno tira dritto"
    : FS.folla >= 15 ? "ti stanno lasciando solo"
    : "non ti guarda più nessuno");
  if(false) $("p-count").innerHTML = FS.folla >= 85 ? "<b>La piazza è tua.</b> Non se ne va più nessuno."
    : FS.folla >= 60 ? "<b>Si sta fermando gente.</b> Continua così."
    : FS.folla >= 35 ? "Qualcuno ti guarda, qualcuno tira dritto."
    : FS.folla >= 15 ? "<b>Ti stanno lasciando solo.</b>"
    : "<b>Non ti guarda più nessuno.</b>";
}
function scenaTap(){
  $("p-body").innerHTML =
    '<button class="ptap" id="p-tap">VAI A TEMPO · barra spaziatrice o tocca qui</button>';
  $("p-tap").onclick = colpo;
  document.addEventListener("keydown", tastoPiazza);
}
function tastoPiazza(e){
  if(!FS) return;
  if(e.code === "Space" || e.key === " "){ e.preventDefault(); colpo(); }
  if(e.key === "Escape") uscitaPiazza();
}
function battuta(){
  if(!FS || FS.fine) return;
  FS.beat++;
  FS.prossima = performance.now() + FS.intervallo;
  const on = document.getElementById("onda");
  if(on){
    on.setAttribute("opacity", ".5");
    on.setAttribute("rx", "70"); on.setAttribute("ry", "20");
    setTimeout(() => { if(document.getElementById("onda")){
      document.getElementById("onda").setAttribute("opacity", "0");
      document.getElementById("onda").setAttribute("rx", "118");
      document.getElementById("onda").setAttribute("ry", "34"); } }, 150);
  }
  if(!muted) SFX.click(FS.beat % 4 === 1);
  if(!FS.tapped && FS.beat > 2 && !$("p-choice")){ FS.persi++; cambiaFolla(-2.6); }
  FS.tapped = false;
  if(FS.beat === 10 || FS.beat === 20 || FS.beat === 29){ momentoScelta(); return; }
  if(FS.beat >= FS.tot) finePiazza();
}
function colpo(){
  if(!FS || FS.fine || FS.tapped) return;
  const d = Math.abs(performance.now() - (FS.prossima - FS.intervallo));
  const d2 = Math.min(d, Math.abs(performance.now() - FS.prossima));
  FS.tapped = true;
  const j = $("p-judge");
  let txt = "", col = "#fff";
  if(d2 < 95){ FS.perfetti++; cambiaFolla(4.6); txt = "IN POCKET"; col = "var(--acid)"; if(!muted) SFX.pocket(); }
  else if(d2 < 190){ FS.buoni++; cambiaFolla(2.2); txt = "a tempo"; col = "#fff"; if(!muted) SFX.buono(); }
  else { FS.persi++; cambiaFolla(-3.4); txt = "fuori tempo"; col = "var(--hot)"; if(!muted) SFX.perso(); }
  if(j){ j.textContent = txt; j.style.color = col; j.className = "judge2 show";
    setTimeout(() => { if($("p-judge")) $("p-judge").className = "judge2"; }, 320); }
}
function cambiaFolla(d){
  FS.folla = clamp(FS.folla + d * (1 + G.skills.presenza/160), 0, 100);
  disegnaFolla();
}
function momentoScelta(){
  clearInterval(FS.timer);
  FS.prossima = performance.now() + 1e9;
  const sit = SITUAZIONI[(FS.scelte + Math.floor(Math.random()*3)) % SITUAZIONI.length];
  FS.scelte++;
  const ordine = sit.o.slice().sort(() => Math.random()-.5);
  const bolla = document.createElement("div");
  bolla.className = "bolla"; bolla.id = "p-bolla"; bolla.textContent = sit.t;
  $("p-scena").appendChild(bolla);
  $("p-body").innerHTML = '<div class="psit">Rispondi prima che la gente si giri.<span>' +
    'Chi si è fermato ti sta guardando.</span></div>' +
    '<div class="ptimer"><i id="p-tm" style="width:100%"></i></div>' +
    '<div id="p-choice">' + ordine.map((o,i) =>
      '<button class="pline" data-v="' + o[1] + '">' + o[0] + '</button>').join("") + '</div>';
  document.querySelectorAll("#p-choice .pline").forEach(b => {
    b.onclick = () => rispondi(+b.dataset.v);
  });
  let t = 100;
  const tick = setInterval(() => {
    t -= 2.2;
    const el = $("p-tm"); if(el) el.style.width = Math.max(0,t) + "%";
    if(t <= 0){ clearInterval(tick); if(FS && !FS.fine) rispondi(0); }
  }, 110);
  FS.tick = tick;
}
function rispondi(v){
  if(!FS || FS.fine) return;
  if(FS.tick) clearInterval(FS.tick);
  const bo = document.getElementById("p-bolla"); if(bo) bo.remove();
  FS.punti += v;
  const forza = v >= .9 ? 15 : v >= .6 ? 8 : v > 0 ? 2 : -12;
  cambiaFolla(forza);
  if(!muted){ if(v >= .9) SFX.crowd(); else if(v <= 0) SFX.fail(); }
  if(FS.beat >= FS.tot){ finePiazza(); return; }
  scenaTap();
  FS.prossima = performance.now() + FS.intervallo;
  FS.timer = setInterval(battuta, FS.intervallo);
}
function finePiazza(){
  if(!FS || FS.fine) return;
  FS.fine = true;
  clearInterval(FS.timer);
  document.removeEventListener("keydown", tastoPiazza);
  const tempo = (FS.perfetti*1 + FS.buoni*0.55) / Math.max(1, FS.perfetti+FS.buoni+FS.persi);
  const resa = clamp(FS.folla/100 * 0.7 + tempo * 0.3, 0, 1);
  const fan = Math.round((4 + G.skills.presenza*1.3 + G.hype*0.35) * resa * 2.2 * FS.boost);
  const soldi = Math.round(rnd(2,9) * resa * 4 * FS.boost);
  const pres = (0.8 + resa*1.8) * FS.boost;
  const hype = Math.round(resa * 6 * FS.boost);
  G.fans += fan; G.money += soldi; gain("presenza", pres);
  G.hype = clamp(G.hype + hype, 0, 100);
  G.wellbeing = clamp(G.wellbeing - 2, 0, 100);
  const voto = resa >= .8 ? "Hai spaccato la piazza." : resa >= .55 ? "Ti sei fatto ascoltare."
    : resa >= .3 ? "Qualcuno si è fermato, molti no." : "È andata male. Capita.";
  $("p-body").innerHTML = '<div class="pres"><div class="big">' + Math.round(FS.folla) + '</div>' +
    '<div class="sub">persone rimaste fino alla fine · ' + voto + '</div>' +
    '<div class="wrow"><b>A tempo</b><span class="bar"><i style="width:' + Math.round(tempo*100) + '%"></i></span>' +
      '<span>' + FS.perfetti + ' in pocket · ' + FS.buoni + ' buone · ' + FS.persi + ' fuori</span></div>' +
    '<div class="wrow"><b>Risposte</b><span class="bar"><i style="width:' +
      Math.round(clamp(FS.punti/Math.max(1,FS.scelte),0,1)*100) + '%"></i></span><span>' + FS.scelte + ' botta e risposta</span></div>' +
    '<div class="wrow"><b>Bottino</b><span class="bar"><i style="width:' + Math.round(resa*100) + '%"></i></span>' +
      '<span>+' + fmt(fan) + ' fan · +' + soldi + ' € · presenza +' + pres.toFixed(1) + '</span></div>' +
    (FS.boost > 1 ? '<div class="wrow"><b>×1,5</b><span class="bar"><i style="width:100%"></i></span><span>perché te la sei giocata</span></div>' : '') +
    '</div><button class="ptap" id="p-end">Torna alla settimana</button>';
  $("p-end").onclick = () => { chiudiPiazza(); save(); renderGioco(); };
  pushLog("Freestyle in piazza: <b>" + Math.round(FS.folla) + "</b> persone rimaste, +" + fmt(fan) + " fan.",
    resa >= .6 ? "good" : "");
  SFX.crowd();
}
function uscitaPiazza(){
  if(!FS) return;
  if(FS.fine){ azioneFatta(); chiudiPiazza(); save(); renderGioco(); return; }
  annullaAzione();
  chiudiPiazza(); renderGioco();
}
