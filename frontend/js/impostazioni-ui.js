/* Il pannello delle impostazioni — Anni di Fame. © La Fame Studio.
   Si apre dal menu principale. Arriva per ultimo perché tocca cose definite
   dappertutto: audio (fx.js), stato (state.js), interfaccia (ui.js). */
"use strict";

/* etichette del pannello: qui la lingua si sceglie riga per riga */
const L = (it, en) => (SET.lingua === "en" ? en : it);

/* ==================== accesso ai valori per percorso ==================== */
function setGet(p){ return p.split(".").reduce((o,k) => (o == null ? o : o[k]), SET); }
function setPut(p, v){
  const k = p.split("."), ultimo = k.pop();
  const o = k.reduce((x,y) => x[y], SET);
  o[ultimo] = v;
}

/* ==================== mattoncini ==================== */
function riga(tit, sub, ctl, extra){
  return '<div class="srow' + (extra ? ' ' + extra : '') + '">' +
    '<span class="stx"><b>' + tit + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</span>' +
    '<span class="sctl">' + ctl + '</span></div>';
}
function seg(path, opts){
  const cur = setGet(path);
  return '<span class="seg" data-seg="' + path + '">' + opts.map(o =>
    '<button data-v="' + o[0] + '"' + (String(cur) === String(o[0]) ? ' class="on"' : '') + '>' + o[1] + '</button>'
  ).join("") + '</span>';
}
function slider(path, min, max, step, suff){
  const v = setGet(path);
  return '<span class="sld"><input type="range" data-num="' + path + '" min="' + min + '" max="' + max +
    '" step="' + (step || 1) + '" value="' + v + '"><i class="sval">' + v + (suff || "") + '</i></span>';
}
function sw(path){
  return '<button class="sw' + (setGet(path) ? ' on' : '') + '" data-sw="' + path + '" aria-pressed="' +
    (setGet(path) ? "true" : "false") + '"><i></i></button>';
}
function bottone(azione, testo, cls){
  return '<button class="sbtn' + (cls ? ' ' + cls : '') + '" data-do="' + azione + '">' + testo + '</button>';
}

/* ==================== le sezioni ==================== */
const SEZIONI = [
  {id:"audio",  n:() => L("Audio","Audio"),        ic:"♪"},
  {id:"look",   n:() => L("Aspetto","Look"),       ic:"◐"},
  {id:"gioco",  n:() => L("Gioco","Game"),         ic:"▲"},
  {id:"dati",   n:() => L("Partite","Saves"),      ic:"▤"},
  {id:"lingua", n:() => L("Lingua","Language"),    ic:"文"},
  {id:"info",   n:() => L("Diritti","Rights"),     ic:"©"}
];
let SEZ = "audio";

function corpoAudio(){
  return '<div class="scard">' +
    riga(L("Audio del gioco","Game audio"),
         L("Il tasto ♪ in partita fa la stessa cosa.","The ♪ button in game does the same."), sw("audio.on")) +
    riga(L("Volume generale","Master volume"),
         L("Comanda su tutto il resto.","It rules everything else."), slider("audio.master",0,100,5,"%")) +
    riga(L("Effetti","Sound effects"),
         L("Tasti, cassa, folla, fine settimana.","Taps, kicks, crowds, week's end."), slider("audio.sfx",0,100,5,"%")) +
    riga(L("Beat","Beats"),
         L("Quanto suonano forte i beat che ascolti.","How loud the beats you audition play."), slider("audio.beat",0,100,5,"%")) +
  '</div>' +
  '<div class="scard">' +
    riga(L("Carattere dei suoni","Sound character"),
      L("Morbido: click d'aria e legni. Retrò: il vecchio banco a otto bit.",
        "Soft: airy clicks and wooden tones. Retro: the old 8-bit bench."),
      seg("audio.suoni", [["morbido", L("Morbido","Soft")], ["retro", L("Retrò","Retro")]])) +
    riga(L("Click dei pulsanti","Button clicks"),
      L("Il tocco che senti quando premi qualcosa.","The tick you hear when you press something."),
      sw("audio.click")) +
    riga(L("Prova i suoni","Try the sounds"), "",
      '<span class="sprove">' +
      [["tap", L("click","click")], ["apri", L("apri","open")], ["cash", L("soldi","money")],
       ["rec", L("sala","studio")], ["publish", L("uscita","release")], ["crowd", L("folla","crowd")],
       ["week", L("settimana","week")], ["fanfare", L("traguardo","milestone")]]
        .map(([k,n]) => '<button class="sbtn" data-do="prova:' + k + '">' + n + '</button>').join("") +
      '</span>') +
  '</div>';
}

function corpoLook(){
  const acc = ACCENTI.map(([c,n]) =>
    '<button class="sw2' + (SET.look.accento === "fisso" && SET.look.col === c ? ' on' : '') +
    '" data-col="' + c + '" title="' + n + '" style="background:' + c + '"></button>').join("");
  return '<div class="scard">' +
    riga(L("Tema","Theme"), L("Come è tinto lo sfondo del gioco.","How the game's background is tinted."),
      seg("look.tema", [["notte", L("Notte","Night")], ["nero", L("Nero assoluto","Pure black")],
                        ["contrasto", L("Contrasto alto","High contrast")]])) +
    riga(L("Colore dell'interfaccia","Interface colour"),
      L("Normalmente è il colore scelto dal tuo artista.","Normally it's the colour your artist picked."),
      seg("look.accento", [["artista", L("Come l'artista","Artist's")], ["fisso", L("Scelgo io","I pick")]])) +
    (SET.look.accento === "fisso" ? riga(L("Quale colore","Which colour"), "", '<span class="sw2row">' + acc + '</span>') : "") +
  '</div>' +
  '<div class="scard">' +
    riga(L("Grana","Film grain"), L("Il pulviscolo sopra tutto il gioco.","The dust over the whole game."),
      slider("look.grana",0,100,5,"%")) +
    riga(L("Alone di colore","Colour glow"), L("Il bagliore in cima allo schermo.","The glow at the top of the screen."),
      slider("look.alone",0,100,4,"%")) +
    riga(L("Animazioni","Animations"), L("Spegnile se il gioco ti va a scatti.","Turn them off if the game stutters."),
      sw("look.anim")) +
  '</div>' +
  '<div class="scard">' +
    riga(L("Dimensione dell'interfaccia","Interface size"),
      L("Ingrandisce tutto: testi, card, bottoni.","Scales everything: text, cards, buttons."),
      seg("look.scala", [[90,"90%"],[100,"100%"],[110,"110%"],[125,"125%"]])) +
    riga(L("Modalità compatta","Compact mode"),
      L("Meno aria fra le card: ci sta più roba a schermo.","Less air between cards: more fits on screen."),
      sw("look.compatto")) +
  '</div>';
}

function corpoGioco(){
  return '<div class="scard">' +
    riga(L("Difficoltà","Difficulty"),
      L("Scegli il tono della carriera. Per ora tutti e tre usano il bilanciamento standard.",
        "Choose the career tone. For now all three use the standard balance."),
      seg("gioco.difficolta", [
        ["strada-aperta", L("Strada aperta","Open road")],
        ["anni-di-fame", L("Anni di Fame","Anni di Fame")],
        ["niente-sconti", L("Niente sconti","No breaks")]
      ])) +
    '<p class="snote">' + L(
      "La scelta viene già salvata con la carriera. I modificatori reali verranno collegati più avanti.",
      "The choice is already saved with the career. Actual modifiers will be connected later.") + '</p>' +
  '</div>' +
  '<div class="scard">' +
    riga(L("Chiedi conferma","Ask before spending"),
      L("Prima delle mosse che costano soldi.","Before moves that cost money."),
      sw("gioco.conferme")) +
  '</div>';
}

/* ---- partite: tre slot, esporta e importa ---- */
/* le chiavi le tengono state.js e creator/state.js: qui si ricalca solo il
   suffisso dello slot, senza riscrivere a mano nomi che possono cambiare */
const chiaviSlot = n => {
  const suff = n > 1 ? "-s" + n : "";
  return {partita: SAVE_KEY + suff, artista: ART_KEY + suff};
};
function letturaSlot(n){
  const k = chiaviSlot(n);
  let g = null, a = null;
  try{ g = JSON.parse(localStorage.getItem(k.partita) || "null"); }catch(e){}
  try{ a = JSON.parse(localStorage.getItem(k.artista) || "null"); }catch(e){}
  return {g, a, vuoto: !g && !(a && a.name)};
}
function corpoDati(){
  let out = '<div class="scard"><p class="snote">' + L(
    "Tre carriere in parallelo, ognuna col suo artista. Il gioco salva da solo su quella aperta.",
    "Three careers in parallel, each with its own artist. The game autosaves on the open one.") + '</p>';
  for(let n = 1; n <= N_SLOT; n++){
    const s = letturaSlot(n), att = SET.slot === n;
    const nome = s.a && s.a.name ? s.a.name : L("Slot libero","Empty slot");
    const det = s.vuoto ? L("Nessuna carriera qui dentro.","No career in here.")
      : (s.g ? L("Anno ","Year ") + (s.g.year || 1) + L(" · settimana "," · week ") + (s.g.week || 1) +
               " · " + (s.g.fans || 0) + L(" fan"," fans") : L("Artista pronto, carriera da iniziare","Artist ready, career not started"));
    out += '<div class="sslot' + (att ? ' on' : '') + '">' +
      '<span class="sn">' + n + '</span>' +
      '<span class="stx"><b>' + nome + (att ? ' <em>' + L("in uso","in use") + '</em>' : '') + '</b><span>' + det + '</span></span>' +
      '<span class="sacts">' +
        (att ? '' : bottone("slot:" + n, L("Apri","Open"))) +
        (s.vuoto ? '' : bottone("esporta:" + n, L("Copia","Copy"))) +
        (s.vuoto ? '' : bottone("cancella:" + n, L("Cancella","Delete"), "danger")) +
      '</span></div>';
  }
  out += '</div>';
  out += '<div class="scard">' +
    '<b class="stit">' + L("Porta via la carriera","Take the career with you") + '</b>' +
    '<p class="snote">' + L(
      "«Copia» mette il codice della carriera qui sotto: incollalo dove vuoi (note, mail, un file di testo) e lì resta al sicuro. Per rimetterlo dentro, incollalo qui e premi Importa: finisce nello slot aperto.",
      "«Copy» drops the career code below: paste it wherever you like (notes, an email, a text file) and it stays safe there. To restore it, paste it back here and press Import: it lands in the open slot.") + '</p>' +
    '<textarea class="stxa" id="s-codice" spellcheck="false" placeholder="' +
      L("Il codice della carriera compare qui.","The career code shows up here.") + '"></textarea>' +
    '<span class="sacts">' + bottone("copia", L("Copia negli appunti","Copy to clipboard")) +
      bottone("importa", L("Importa nello slot aperto","Import into the open slot")) + '</span>' +
  '</div>';
  out += '<div class="scard">' +
    '<b class="stit">' + L("Cancella tutto","Erase everything") + '</b>' +
    '<p class="snote">' + L(
      "Tre carriere, artisti e impostazioni. Non si torna indietro.",
      "Three careers, artists and settings. No way back.") + '</p>' +
    '<span class="sacts">' + bottone("azzera", L("Cancella tutto","Erase everything"), "danger") + '</span></div>';
  return out;
}

function corpoLingua(){
  return '<div class="scard">' +
    riga(L("Lingua dell'interfaccia","Interface language"),
      L("Cambiandola il gioco si ricarica.","Changing it reloads the game."),
      seg("lingua", [["it","Italiano"], ["en","English"]])) +
    '<p class="snote">' + L(
      "Menu, pannelli, azioni e pulsanti passano in inglese. Le scene scritte — diario, eventi, dialoghi — restano in italiano: si traducono a mano, un pezzo alla volta.",
      "Menus, panels, actions and buttons switch to English. The written scenes — diary, events, dialogue — stay in Italian: they get translated by hand, a piece at a time.") + '</p>' +
  '</div>';
}

function corpoInfo(){
  return '<div class="scard sinfo">' +
    '<div class="smark"><b>Anni di Fame</b><span>' + L("prototipo giocabile","playable prototype") + '</span></div>' +
    '<p class="scop">' + ADF_COPYRIGHT + '</p>' +
    '<p class="snote">' + L(
      "Anni di Fame, il suo nome, il suo codice, la sua grafica, i suoi testi, i suoi personaggi e i suoi suoni sono opera di " + ADF_MARCHIO +
      " e appartengono per intero a " + ADF_MARCHIO + ". Nessuna parte del gioco può essere copiata, distribuita, modificata o usata per farci soldi senza il consenso scritto dello studio.",
      "Anni di Fame — its name, code, artwork, writing, characters and sounds — is the work of " + ADF_MARCHIO +
      " and belongs entirely to " + ADF_MARCHIO + ". No part of the game may be copied, distributed, modified or monetised without the studio's written consent.") + '</p>' +
    '<p class="snote">' + L("Versione","Version") + ' 1.1 · ' + L("impostazioni","settings") + ' v' + SET.v + '</p>' +
  '</div>';
}

const CORPI = {audio:corpoAudio, look:corpoLook, gioco:corpoGioco, dati:corpoDati, lingua:corpoLingua, info:corpoInfo};

/* ==================== il guscio ==================== */
function creaPannello(){
  if($("setts")) return;
  const el = document.createElement("div");
  el.className = "setts"; el.id = "setts";
  el.innerHTML =
    '<div class="swrap">' +
      '<div class="shead">' +
        '<div><span class="sk">Anni di Fame</span><h2 id="s-tit">Impostazioni</h2></div>' +
        '<button class="sx" id="s-x" aria-label="Chiudi">✕</button>' +
      '</div>' +
      '<div class="stabs" id="s-tabs"></div>' +
      '<div class="sbody" id="s-body"></div>' +
      '<div class="sfoot" id="s-foot"></div>' +
    '</div>';
  document.body.appendChild(el);
  el.addEventListener("click", e => { if(e.target === el) chiudiImpostazioni(); });
  $("s-x").onclick = () => chiudiImpostazioni();
}

function disegnaImpostazioni(){
  creaPannello();
  $("s-tit").textContent = L("Impostazioni","Settings");
  $("s-tabs").innerHTML = SEZIONI.map(s =>
    '<button class="stab' + (s.id === SEZ ? ' on' : '') + '" data-sez="' + s.id + '">' +
    '<i>' + s.ic + '</i>' + s.n() + '</button>').join("");
  $("s-body").innerHTML = CORPI[SEZ]();
  $("s-foot").textContent = ADF_COPYRIGHT;
  if(typeof passataLingua === "function") passataLingua($("setts"));
}

function apriImpostazioni(){
  disegnaImpostazioni();
  $("setts").classList.add("on");
  document.body.style.overflow = "hidden";
}
function chiudiImpostazioni(){
  const el = $("setts"); if(!el) return;
  el.classList.remove("on");
  document.body.style.overflow = "";
  if(typeof renderMenu === "function") renderMenu();
  if(typeof renderGioco === "function" && $("quaderno") && $("quaderno").classList.contains("on")) renderGioco();
}

/* ==================== quello che succede quando tocchi ==================== */
function dopoModifica(ridisegna){
  setSalva();
  applicaImpostazioni();
  if(typeof renderMenu === "function") renderMenu();
  if(ridisegna !== false) disegnaImpostazioni();
}

/* Niente scaricamento di file: dentro all'artifact il browser lo blocca in
   silenzio e resterebbe un bottone morto. Il codice si copia e si incolla. */
function codiceSlot(n){
  const s = letturaSlot(n);
  return JSON.stringify({gioco:"anni-di-fame", v:1, studio:ADF_MARCHIO, slot:n, partita:s.g, artista:s.a});
}
function importaCodice(txt){
  let d = null;
  try{ d = JSON.parse(txt); }catch(e){ return false; }
  if(!d || d.gioco !== "anni-di-fame") return false;
  const k = chiaviSlot(SET.slot);
  try{
    if(d.partita) localStorage.setItem(k.partita, JSON.stringify(d.partita));
    if(d.artista) localStorage.setItem(k.artista, JSON.stringify(d.artista));
  }catch(e){ return false; }
  return true;
}

let ARMATO = "";
document.addEventListener("click", e => {
  const pan = $("setts");
  if(!pan || !pan.classList.contains("on")) return;

  /* le sezioni */
  const tab = e.target.closest("[data-sez]");
  if(tab){ SEZ = tab.dataset.sez; ARMATO = ""; disegnaImpostazioni(); return; }

  /* i gruppi di bottoni */
  const b = e.target.closest("[data-seg] button");
  if(b){
    const path = b.closest("[data-seg]").dataset.seg;
    let v = b.dataset.v;
    if(v !== "" && !isNaN(v)) v = parseFloat(v);
    if(path === "lingua"){ SET.lingua = v; setSalva(); location.reload(); return; }
    if(path === "gioco.preset"){ if(v !== "custom") applicaPreset(v); else SET.gioco.preset = "custom"; }
    else{
      setPut(path, v);
      if(path === "gioco.difficolta"){
        try{ if(typeof G !== "undefined"){ G.difficolta = v; if(typeof save === "function") save(); } }catch(e2){}
      }else if(path.indexOf("gioco.") === 0) SET.gioco.preset = "custom";
    }
    dopoModifica(); return;
  }

  /* gli interruttori */
  const s = e.target.closest("[data-sw]");
  if(s){
    const path = s.dataset.sw;
    setPut(path, !setGet(path));
    if(path.indexOf("gioco.") === 0) SET.gioco.preset = "custom";
    dopoModifica();
    return;
  }

  /* le pastiglie di colore */
  const c = e.target.closest("[data-col]");
  if(c){ SET.look.col = c.dataset.col; SET.look.accento = "fisso"; dopoModifica(); return; }

  /* i bottoni con un'azione */
  const d = e.target.closest("[data-do]");
  if(!d) return;
  const [az, arg] = d.dataset.do.split(":");

  if(az === "prova"){ if(typeof SFX !== "undefined" && SFX[arg || "tap"]) SFX[arg || "tap"](); return; }

  if(az === "slot"){
    try{ if(typeof save === "function") save(); }catch(e2){}
    SET.slot = +arg; setSalva(); location.reload(); return;
  }
  if(az === "esporta"){
    const t = $("s-codice"); if(t){ t.value = codiceSlot(+arg); t.focus(); t.select(); }
    return;
  }
  if(az === "copia"){
    const t = $("s-codice");
    if(!t) return;
    if(!t.value.trim()) t.value = codiceSlot(SET.slot);
    t.select();
    try{ navigator.clipboard.writeText(t.value); }catch(e2){ try{ document.execCommand("copy"); }catch(e3){} }
    d.textContent = L("Copiato","Copied");
    setTimeout(() => { d.textContent = L("Copia negli appunti","Copy to clipboard"); }, 1800);
    return;
  }
  if(az === "importa"){
    const t = $("s-codice");
    if(!t || !t.value.trim()){ d.textContent = L("Incolla prima il codice","Paste the code first");
      setTimeout(() => { d.textContent = L("Importa nello slot aperto","Import into the open slot"); }, 2200); return; }
    if(importaCodice(t.value)){ location.reload(); }
    else{
      d.textContent = L("Codice non valido","Invalid code");
      setTimeout(() => { d.textContent = L("Importa nello slot aperto","Import into the open slot"); }, 2200);
    }
    return;
  }
  /* le cose che cancellano si chiedono due volte, sul bottone stesso */
  if(az === "cancella" || az === "azzera"){
    const chiave = az + ":" + (arg || "");
    if(ARMATO !== chiave){
      ARMATO = chiave;
      d.textContent = L("Sicuro? Tocca ancora","Sure? Tap again");
      d.classList.add("armato");
      setTimeout(() => { if(ARMATO === chiave){ ARMATO = ""; disegnaImpostazioni(); } }, 4000);
      return;
    }
    ARMATO = "";
    if(az === "cancella"){
      const k = chiaviSlot(+arg);
      try{
        localStorage.removeItem(k.partita);
        localStorage.removeItem(k.artista);
      }catch(e2){}
      if(+arg === SET.slot){ location.reload(); return; }
      disegnaImpostazioni(); return;
    }
    try{
      const via = [];
      for(let i = 0; i < localStorage.length; i++){
        const k = localStorage.key(i);
        if(k && (k.indexOf("anni-di-fame") === 0 || k.indexOf("adf-") === 0)) via.push(k);
      }
      via.forEach(k => localStorage.removeItem(k));
    }catch(e2){}
    location.reload();
  }
});

/* le manopole si sentono mentre le muovi */
document.addEventListener("input", e => {
  const r = e.target.closest("[data-num]");
  if(!r) return;
  const path = r.dataset.num;
  setPut(path, parseFloat(r.value));
  const et = r.parentNode.querySelector(".sval");
  if(et) et.textContent = r.value + (path.indexOf("audio.") === 0 || path.indexOf("look.") === 0 ? "%" : "");
  setSalva(); applicaImpostazioni();
});
document.addEventListener("change", e => {
  const r = e.target.closest("[data-num]");
  if(!r) return;
  if(r.dataset.num.indexOf("audio.") === 0 && typeof SFX !== "undefined") SFX.tap();
});

/* apertura dal menu principale, chiusura con ESC */
if($("m-setts")) $("m-setts").onclick = () => apriImpostazioni();
document.addEventListener("keydown", e => {
  if(e.key !== "Escape") return;
  const el = $("setts");
  if(el && el.classList.contains("on")) chiudiImpostazioni();
});
window.IMPOSTAZIONI = apriImpostazioni;
