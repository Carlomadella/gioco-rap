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
  {id:"account", n:() => L("Account","Account"),   ic:"◉"},
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
  const p = SET.gioco;
  return '<div class="scard">' +
    riga(L("Difficoltà","Difficulty"),
      L("Tre preset. Toccando una manopola passi a «su misura».","Three presets. Touch a knob and it goes «custom»."),
      seg("gioco.preset", [["facile", L("Facile","Easy")], ["normale", L("Normale","Normal")],
                           ["duro", L("Duro","Hard")], ["custom", L("Su misura","Custom")]])) +
  '</div>' +
  '<div class="scard">' +
    riga(L("Energia al giorno","Energy per day"),
      L("In più o in meno rispetto ai cento di base, ogni giorno.","On top of (or below) the standard hundred, every day."),
      seg("gioco.energia", [[-1,"−1"],[0,"0"],[1,"+1"],[2,"+2"]])) +
    riga(L("Spese fisse","Fixed costs"),
      L("Quanto pesano affitto, lifestyle e vita.","How heavy rent, lifestyle and living are."),
      seg("gioco.spese", [[0.6, L("Leggere","Light")], [1, L("Normali","Normal")], [1.5, L("Pesanti","Heavy")]])) +
    riga(L("Crescita dei fan","Fan growth"),
      L("Quanto in fretta la gente ti trova.","How fast people find you."),
      seg("gioco.fan", [[1.35, L("Veloce","Fast")], [1, L("Normale","Normal")], [0.75, L("Lenta","Slow")]])) +
    riga(L("I rivali","The rivals"),
      L("Quanto corrono gli altri mentre tu lavori.","How hard the others run while you work."),
      seg("gioco.rivali", [[0.75, L("Tranquilli","Easy-going")], [1, L("Normali","Normal")], [1.35, L("Spietati","Ruthless")]])) +
  '</div>' +
  '<div class="scard">' +
    riga(L("Chiedi conferma","Ask before spending"),
      L("Prima delle mosse che costano soldi.","Before moves that cost money."),
      sw("gioco.conferme")) +
    '<p class="snote">' + L(
      "Le manopole valgono da subito, anche su una carriera già iniziata: cambiano il futuro, non quello che hai già fatto.",
      "The knobs take effect right away, even mid-career: they change what comes next, not what you've already done.") + '</p>' +
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

/* ==================== ACCOUNT (punto 21) ====================
   Registrazione, entrata e uscita. Il ponte con il server c'era gia' tutto
   (js/net/online.js: registraConMail, entra, esci, io, cancellaAccount), ma
   non c'era nessun posto da cui usarlo: si poteva solo dalla console.

   Regola di sempre: **se il server non c'e', il gioco non se ne accorge.**
   Qui vuol dire che la sezione lo dice chiaro e non rompe niente: la carriera
   sta su questo dispositivo e continua a starci, l'account serve solo a
   portarsela altrove. */
let ACC = {fase:"ignoto", io:null, errore:"", nota:"", vista:"entra", corso:false};

/* gli errori che il server manda davvero (backend/server.js), detti a parole */
function accErrore(cod){
  const t = {
    "email-non-valida":     L("Quella mail non sta in piedi.", "That email doesn't hold up."),
    "segreto-troppo-corto": L("La password deve avere almeno otto caratteri.", "The password needs at least eight characters."),
    "email-gia-usata":      L("Quella mail ha gia' un account. Entra, invece di registrarti.", "That email already has an account. Sign in instead."),
    "non-torna":            L("Mail o password sbagliate.", "Wrong email or password."),
    "sessione-scaduta":     L("La sessione e' scaduta. Rientra.", "Session expired. Sign in again."),
    "account-sconosciuto":  L("Non c'e' nessun account con quella mail.", "No account with that email."),
    "troppe-richieste":     L("Troppi tentativi di fila. Aspetta un minuto.", "Too many tries in a row. Wait a minute."),
    "serve-la-conferma":    L("Serve la conferma.", "Confirmation needed.")
  };
  return t[cod] || (L("Non ha funzionato", "It didn't work") + " (" + cod + ").");
}

/* Chi sei, adesso. Torna `null` se il server non risponde: e' il modo in cui
   il ponte dice "sono staccato", e non e' un errore da mostrare in rosso. */
async function accChiedi(){
  ACC.fase = "carico"; ACC.errore = ""; disegnaImpostazioni();
  const r = await ONLINE.io();
  if(r === null){ ACC.fase = "staccato"; ACC.io = null; }
  else if(r.errore){ ACC.fase = "fuori"; ACC.io = null; }
  else{ ACC.fase = "dentro"; ACC.io = r; }
  disegnaImpostazioni();
}

function accCampi(){
  const m = $("acc-mail"), w = $("acc-pw"), w2 = $("acc-pw2");
  return {mail: m ? m.value.trim() : "", pw: w ? w.value : "", pw2: w2 ? w2.value : ""};
}

async function accEntra(){
  const c = accCampi();
  if(!c.mail || !c.pw){ ACC.errore = L("Mail e password, tutte e due.", "Email and password, both."); disegnaImpostazioni(); return; }
  ACC.corso = true; ACC.errore = ""; ACC.nota = ""; disegnaImpostazioni();
  const r = await ONLINE.entra(c.mail, c.pw);
  ACC.corso = false;
  if(r === null){ ACC.fase = "staccato"; disegnaImpostazioni(); return; }
  if(r.errore){ ACC.errore = accErrore(r.errore); disegnaImpostazioni(); return; }
  ACC.nota = L("Sei dentro.", "You're in.");
  accChiedi();
}

async function accRegistra(){
  const c = accCampi();
  if(!c.mail || !c.pw){ ACC.errore = L("Mail e password, tutte e due.", "Email and password, both."); disegnaImpostazioni(); return; }
  if(c.pw.length < 8){ ACC.errore = accErrore("segreto-troppo-corto"); disegnaImpostazioni(); return; }
  if(c.pw !== c.pw2){ ACC.errore = L("Le due password non sono uguali.", "The two passwords don't match."); disegnaImpostazioni(); return; }
  ACC.corso = true; ACC.errore = ""; ACC.nota = ""; disegnaImpostazioni();
  const r = await ONLINE.registraConMail(c.mail, c.pw);
  ACC.corso = false;
  if(r === null){ ACC.fase = "staccato"; disegnaImpostazioni(); return; }
  if(r.errore){ ACC.errore = accErrore(r.errore); disegnaImpostazioni(); return; }
  ACC.nota = L("Account creato. Da adesso la carriera puoi portartela via.",
               "Account created. From now on you can take the career with you.");
  accChiedi();
}

async function accEsci(){
  ACC.corso = true; disegnaImpostazioni();
  await ONLINE.esci();
  ACC.corso = false; ACC.io = null; ACC.fase = "fuori";
  ACC.nota = L("Sei uscito. La carriera resta su questo dispositivo.",
               "Signed out. The career stays on this device.");
  disegnaImpostazioni();
}

async function accCancella(){
  ACC.corso = true; disegnaImpostazioni();
  const r = await ONLINE.cancellaAccount();
  ACC.corso = false;
  if(r === null){ ACC.fase = "staccato"; disegnaImpostazioni(); return; }
  if(r.errore){ ACC.errore = accErrore(r.errore); disegnaImpostazioni(); return; }
  ACC.io = null; ACC.fase = "fuori";
  ACC.nota = L("Account cancellato. Quello che c'era sul server non c'e' piu'.",
               "Account deleted. What was on the server is gone.");
  disegnaImpostazioni();
}

function accCampo(id, tipo, etichetta, segnaposto, auto){
  return '<label class="scampo"><span>' + etichetta + '</span>' +
    '<input id="' + id + '" type="' + tipo + '" autocomplete="' + auto + '" spellcheck="false" ' +
    'placeholder="' + segnaposto + '"></label>';
}

function corpoAccount(){
  if(ACC.fase === "ignoto"){ setTimeout(accChiedi, 0); }

  const testa = '<div class="scard"><b class="stit">' +
    L("Perche' serve un account", "Why an account") + '</b>' +
    '<p class="snote">' + L(
      "La carriera e' salvata su questo dispositivo: se svuoti i dati del browser se ne va con loro. " +
      "Con un account la stessa carriera la ritrovi altrove \u2014 e il tuo nome sta in classifica per davvero.",
      "The career is saved on this device: clear the browser data and it goes with it. " +
      "With an account you find the same career elsewhere \u2014 and your name really is on the leaderboard.") +
    '</p>' +
    riga(L("Server", "Server"), ONLINE.url,
      '<span class="sacts">' + bottone("acc-server", L("Cambia", "Change")) + '</span>') +
    '</div>';

  const avviso =
    (ACC.errore ? '<p class="sacc-no">' + ACC.errore + '</p>' : '') +
    (ACC.nota ? '<p class="sacc-si">' + ACC.nota + '</p>' : '');

  if(ACC.fase === "carico" || ACC.corso)
    return testa + '<div class="scard"><p class="snote">' + L("Un attimo\u2026", "One moment\u2026") + '</p></div>';

  if(ACC.fase === "staccato")
    return testa + '<div class="scard"><b class="stit">' + L("Il server non risponde", "The server isn't answering") + '</b>' +
      '<p class="snote">' + L(
        "Non e' un problema: il gioco funziona lo stesso, offline, come ha sempre fatto. " +
        "Quando il server torna, questa sezione ricomincia a funzionare da sola.",
        "Not a problem: the game works anyway, offline, as it always has. " +
        "When the server comes back, this section starts working again on its own.") + '</p>' +
      '<span class="sacts">' + bottone("acc-riprova", L("Riprova", "Try again")) +
        bottone("acc-server", L("Cambia server", "Change server")) + '</span></div>';

  if(ACC.fase === "dentro"){
    const a = (ACC.io && ACC.io.account) || {};
    const quanti = (ACC.io && ACC.io.carriere ? ACC.io.carriere.length : 0);
    const artisti = (ACC.io && ACC.io.artisti) || [];
    return testa + avviso +
      '<div class="scard"><b class="stit">' + L("Sei dentro", "You're in") + '</b>' +
      riga(L("Account", "Account"), a.tipo === "email" ? L("con la mail", "with email") : (a.tipo || "\u2014"),
        '<span class="sacc-chi">' + (a.email || a.id || "\u2014") + '</span>') +
      riga(L("Artisti", "Artists"),
        artisti.length ? artisti.map(x => x.nome).join(", ") : L("nessuno ancora", "none yet"),
        '<span class="sacc-chi">' + artisti.length + '</span>') +
      riga(L("Carriere in cloud", "Careers in the cloud"),
        L("Gli slot salvati sul server.", "The slots saved on the server."),
        '<span class="sacc-chi">' + quanti + '</span>') +
      '<span class="sacts">' + bottone("acc-esci", L("Esci", "Sign out")) + '</span></div>' +
      '<div class="scard"><b class="stit">' + L("Cancella l'account", "Delete the account") + '</b>' +
      '<p class="snote">' + L(
        "Sparisce il tuo nome, la mail e tutto quello che e' tuo sul server. La carriera su questo " +
        "dispositivo resta dov'e'. Non si torna indietro.",
        "Your name, your email and everything of yours on the server go away. The career on this " +
        "device stays where it is. No way back.") + '</p>' +
      '<span class="sacts">' + bottone("accdel", L("Cancella l'account", "Delete the account"), "danger") +
      '</span></div>';
  }

  /* fuori: registrati o entra */
  const dueVie = '<span class="seg sacc-vie">' +
    '<button data-accv="entra"' + (ACC.vista === "entra" ? ' class="on"' : '') + '>' + L("Entra", "Sign in") + '</button>' +
    '<button data-accv="registra"' + (ACC.vista === "registra" ? ' class="on"' : '') + '>' + L("Registrati", "Sign up") + '</button>' +
    '</span>';

  if(ACC.vista === "registra")
    return testa + avviso + '<div class="scard"><b class="stit">' + L("Crea un account", "Create an account") + '</b>' +
      '<span class="sacts">' + dueVie + '</span>' +
      accCampo("acc-mail", "email", L("Mail", "Email"), "nome@esempio.it", "email") +
      accCampo("acc-pw", "password", L("Password", "Password"), L("almeno 8 caratteri", "at least 8 characters"), "new-password") +
      accCampo("acc-pw2", "password", L("Ripeti la password", "Repeat the password"), "", "new-password") +
      '<span class="sacts">' + bottone("acc-registra", L("Crea l'account", "Create the account")) + '</span>' +
      '<p class="snote">' + L(
        "Nota onesta: l'account nuovo parte vuoto. L'artista e le carriere gia' in cloud restano " +
        "attaccati all'account ospite che il gioco si era preso da solo \u2014 la carriera su questo " +
        "dispositivo, quella che stai giocando, non si tocca.",
        "An honest note: the new account starts empty. The artist and any careers already in the cloud " +
        "stay attached to the guest account the game took for itself \u2014 the career on this device, " +
        "the one you're playing, is untouched.") + '</p></div>';

  return testa + avviso + '<div class="scard"><b class="stit">' + L("Entra", "Sign in") + '</b>' +
    '<span class="sacts">' + dueVie + '</span>' +
    accCampo("acc-mail", "email", L("Mail", "Email"), "nome@esempio.it", "email") +
    accCampo("acc-pw", "password", L("Password", "Password"), "", "current-password") +
    '<span class="sacts">' + bottone("acc-entra", L("Entra", "Sign in")) + '</span>' +
    '<p class="snote">' + L(
      "Se non hai ancora un account, registrati: ci vogliono una mail e una password.",
      "No account yet? Sign up: an email and a password is all it takes.") + '</p></div>';
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

const CORPI = {audio:corpoAudio, look:corpoLook, gioco:corpoGioco, dati:corpoDati,
  account:corpoAccount, lingua:corpoLingua, info:corpoInfo};

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

function apriImpostazioni(sez){
  /* punto 21: dal menu si puo' entrare dritti su una sezione (l'account) */
  if(sez && CORPI[sez]) SEZ = sez;
  disegnaImpostazioni();
  $("setts").classList.add("on");
  document.body.style.overflow = "hidden";
}
function chiudiImpostazioni(){
  const el = $("setts"); if(!el) return;
  el.classList.remove("on");
  document.body.style.overflow = "";
  if(typeof renderMenu === "function") renderMenu();
  if(typeof renderGioco === "function" && $("s-game") && $("s-game").classList.contains("on")) renderGioco();
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
      if(path.indexOf("gioco.") === 0) SET.gioco.preset = "custom";
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

  /* entra o registrati (punto 21) */
  const av = e.target.closest("[data-accv]");
  if(av){ ACC.vista = av.dataset.accv; ACC.errore = ""; disegnaImpostazioni(); return; }

  /* le pastiglie di colore */
  const c = e.target.closest("[data-col]");
  if(c){ SET.look.col = c.dataset.col; SET.look.accento = "fisso"; dopoModifica(); return; }

  /* i bottoni con un'azione */
  const d = e.target.closest("[data-do]");
  if(!d) return;
  const [az, arg] = d.dataset.do.split(":");

  if(az === "prova"){ if(typeof SFX !== "undefined" && SFX[arg || "tap"]) SFX[arg || "tap"](); return; }

  /* ---- account (punto 21) ---- */
  if(az === "acc-entra"){ accEntra(); return; }
  if(az === "acc-registra"){ accRegistra(); return; }
  if(az === "acc-esci"){ accEsci(); return; }
  if(az === "acc-riprova"){ accChiedi(); return; }
  if(az === "acc-server"){
    const ora = ONLINE.url;
    const nuovo = prompt(L("Indirizzo del server:", "Server address:"), ora);
    if(nuovo && nuovo.trim() && nuovo.trim() !== ora){ ONLINE.collega(nuovo.trim()); accChiedi(); }
    return;
  }

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
  if(az === "accdel"){
    if(ARMATO !== "accdel"){
      ARMATO = "accdel";
      d.textContent = L("Sicuro? Tocca ancora", "Sure? Tap again");
      d.classList.add("armato");
      setTimeout(() => { if(ARMATO === "accdel"){ ARMATO = ""; disegnaImpostazioni(); } }, 4000);
      return;
    }
    ARMATO = "";
    accCancella();
    return;
  }
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
