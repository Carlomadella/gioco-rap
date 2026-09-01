/* punto 66: "Chat" nel telefono — non si può chiamarla come l'app vera, ma il
   mestiere è quello: messaggi da persone vere, non il diario degli eventi
   (quello resta "Messaggi"). All'inizio scrivono solo mamma e il tuo
   migliore amico; più cresci di fama, più gente si fa sotto — bene o male,
   come chiedeva il punto. */
"use strict";

const CHAT_CONTATTI = [
  {id:"mamma", n:"Mamma", ic:"cuore", k:"#FF4D9D", sempre:true,
   apre:[
     "Tutto bene? Hai mangiato oggi?",
     "Ho fatto sentire il tuo ultimo pezzo alla zia, le è piaciuto molto.",
     "Quando vieni a trovarmi? Anche solo per pranzo, un'oretta.",
     "Mi raccomando non fare le ore piccole ogni sera, lo so che scrivi di notte."
   ],
   opts:[
     {n:"Tranquilla, tutto ok", d:"+benessere",
      run(){ G.wellbeing = clamp(G.wellbeing + 6, 0, 100); return "Meno male. Un bacio, amore mio."; }},
     {n:"Sto correndo, ti chiamo dopo", d:"",
      run(){ return "Va bene, aspetto la chiamata. Non sparire."; }}
   ]},
  {id:"amico", n:"Dario", ic:"persona", k:"#38BDF8", sempre:true,
   apre:[
     "Bro come butta, tutto ok?",
     "Ho sentito l'ultimo pezzo, sta spaccando davvero.",
     "Ci si vede stasera o sei in modalità artista full time?",
     "Ma è vero quello che dicono in giro su di te?"
   ],
   opts:[
     {n:"Tutto ok, sto lavorando forte", d:"",
      run(){ return "Da bravo. Fatti sentire quando stacchi la spina."; }},
     {n:"Vieni a trovarmi, ti presento gente", d:"+rete",
      run(){ G.skills.rete = clamp(G.skills.rete + 1, 0, 999); return "Ci sto, dimmi quando e ti raggiungo."; }}
   ]},
  {id:"fan", n:"Un fan", ic:"fama", k:"#FACC15", soglia:g => g.fans >= 80,
   apre:[
     "Ciao!! Sono il tuo fan numero uno, mi rispondi per favore??",
     "Puoi fare uno shoutout alla mia pagina? Ti prego ti prego",
     "Quando esce il prossimo pezzo? Non vedo l'ora, seriamente"
   ],
   opts:[
     {n:"Rispondi con calore", d:"+hype",
      run(){ G.hype = clamp(G.hype + 3, 0, 100); return "AAAA MI HAI RISPOSTO DAVVERO. Sei il migliore, lo dico a tutti!"; }},
     {n:"Non rispondere", d:"", run(){ return null; }}
   ]},
  {id:"hater", n:"Un hater", ic:"maschera", k:"#F87171", soglia:g => g.fans >= 250,
   apre:[
     "Sei sopravvalutato, lo sanno tutti quelli che ascoltano roba vera.",
     "Chi ti ha detto che sai scrivere barre scusa",
     "Fra tre mesi non ti ricorda più nessuno, segnati questo messaggio"
   ],
   opts:[
     {n:"Rispondi a tono", d:"Rischi, ma se la fai buona ne parlano",
      run(){
        if(Math.random() < .5){ G.hype = clamp(G.hype + 4, 0, 100); return null; }
        G.wellbeing = clamp(G.wellbeing - 6, 0, 100);
        return "Ah quindi ho ragione. Toccato nel vivo eh.";
      }},
     {n:"Blocca", d:"Non scrive più per un po'", blocca:6, run(){ return null; }},
     {n:"Ignora", d:"", run(){ return null; }}
   ]}
];

/* ==================== IL CICLO SETTIMANALE ====================
   Chiamata da sim.js dentro advanceWeek(): chi è sbloccato e non bloccato può
   scrivere un messaggio nuovo, pescato dalla sua rubrica di frasi. */
function chatSettimana(){
  if(!G.chat) G.chat = {};
  const sett = totalWeeks();
  for(const c of CHAT_CONTATTI){
    const attivo = c.sempre || (c.soglia && c.soglia(G));
    if(!attivo) continue;
    if(!G.chat[c.id]) G.chat[c.id] = {msgs:[], nonLetti:0, bloccatoFino:0};
    const t = G.chat[c.id];
    if(t.bloccatoFino > sett) continue;
    if(Math.random() < (c.sempre ? .55 : .3)){
      t.msgs.push({chi:"loro", testo:pick(c.apre)});
      t.nonLetti = (t.nonLetti || 0) + 1;
    }
  }
}

/* ==================== RISPONDERE ==================== */
function chatRispondi(contactId, idx){
  const c = CHAT_CONTATTI.find(x => x.id === contactId);
  if(!c || !G.chat || !G.chat[contactId]) return;
  const o = c.opts[idx];
  if(!o) return;
  const t = G.chat[contactId];
  t.msgs.push({chi:"io", testo:o.n});
  const risposta = o.run();
  if(risposta) t.msgs.push({chi:"loro", testo:risposta});
  if(o.blocca) t.bloccatoFino = totalWeeks() + o.blocca;
  save(); renderTelefono(); renderGioco();
}

/* ==================== LE SCHERMATE (dentro al telefono, telefono.js) ==================== */
function chatAttivi(){ return CHAT_CONTATTI.filter(c => c.sempre || (c.soglia && c.soglia(G))); }
function chatNonLetti(){
  if(!G.chat) return 0;
  return chatAttivi().reduce((a, c) => a + ((G.chat[c.id] && G.chat[c.id].nonLetti) || 0), 0);
}

let TEL_CHAT_APERTA = null;

function schermataChat(){
  if(!G.chat) G.chat = {};
  const attivi = chatAttivi();
  if(!attivi.length) return '<div class="tempty">Nessuno scrive ancora. Vieni notato con la musica, e qualcuno si farà sotto.</div>';
  return '<div class="tlist">' + attivi.map(c => {
    const t = G.chat[c.id] || {msgs:[], nonLetti:0};
    const ultimo = t.msgs.length ? t.msgs[t.msgs.length - 1].testo : "Nessun messaggio ancora";
    return '<button class="tli" data-chat="' + c.id + '">' +
      '<span class="tliav" style="--k:' + c.k + '">' + hsvg(c.ic) + '</span>' +
      '<span class="tlitx"><b>' + c.n + '</b><i>' + tronca(spoglia(ultimo), 46) + '</i></span>' +
      (t.nonLetti ? '<span class="tbadge2">' + t.nonLetti + '</span>' : '') +
      '</button>';
  }).join("") + '</div>';
}

function schermataChatThread(){
  const c = CHAT_CONTATTI.find(x => x.id === TEL_CHAT_APERTA);
  if(!c) return schermataChat();
  if(!G.chat[c.id]) G.chat[c.id] = {msgs:[], nonLetti:0, bloccatoFino:0};
  const t = G.chat[c.id];
  t.nonLetti = 0;
  const bolle = t.msgs.length
    ? t.msgs.map(m => '<div class="tbolla ' + (m.chi === "io" ? "io" : "loro") + '">' + m.testo + '</div>').join("")
    : '<div class="tempty">Ancora nessun messaggio con ' + c.n + '.</div>';
  const bloccato = t.bloccatoFino > totalWeeks();
  const opts = bloccato ? '<p class="tchatstop">L’hai bloccato. Torna a scrivere fra qualche settimana.</p>' :
    c.opts.map((o, i) => '<button class="tbtn" data-chatopt="' + i + '">' + o.n +
      (o.d ? ' <small>(' + o.d + ')</small>' : '') + '</button>').join("");
  return '<button class="tback2" data-chathome="1">‹ Chat</button>' +
    '<div class="tchat">' + bolle + '</div><div class="tchatopts">' + opts + '</div>';
}
