/* Attività criminali V2 — adapter UI/TRAPHONE sulla logica reale strada-crimine.js. */
"use strict";
(function(){
  const root=document.getElementById("strada");
  if(!root || typeof G==="undefined") return;
  const esc=v=>String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const money=n=>Math.round(Number(n)||0).toLocaleString("it-IT");
  const clampN=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  let activeBg=0,bgHistory=[],bgTimer=null,lastPhoneAt=0;
  let jailBgTimer=null,jailBgLast="",jailBgActive=0,jailTransitionBusy=false,jailLastPhrase="";

  const JAIL_ARREST_PHRASES = [
    ["Ti hanno","bevuto."],
    ["Ti hanno","fatto."],
    ["Stavolta ti hanno","preso."],
    ["Sei finito","dentro."],
    ["Ti hanno messo","al fresco."],
    ["Ti hanno","chiuso."],
    ["Le manette sono","scattate."],
    ["La corsa finisce","qui."],
    ["Non l'hai fatta","franca."],
    ["Stavolta è andata","male."]
  ];

  function jailPickArrestPhrase(){
    const s=street()||{},a=s.arresto||{};
    const special=[];
    if((Number(s.precedenti)||0)>=2)special.push(["Di nuovo","dentro."]);
    if((Number(s.heat)||0)>=70)special.push(["Era solo questione","di tempo."]);
    if(a.colpo)special.push(["Il colpo è saltato.","Tu pure."]);
    const pool=special.length&&Math.random()<.45?special:JAIL_ARREST_PHRASES;
    const key=x=>Array.isArray(x)?x.join("|"):String(x||"");
    const choices=pool.filter(x=>key(x)!==jailLastPhrase);
    const use=choices.length?choices:pool;
    const chosen=use[Math.floor(Math.random()*use.length)]||["Ti hanno","preso."];
    jailLastPhrase=key(chosen);
    return chosen;
  }

  const jailWait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function ensureArrestTransition(){
    let layer=document.getElementById("adf-arrest-transition");
    if(layer)return layer;
    layer=document.createElement("div");
    layer.id="adf-arrest-transition";
    layer.className="adf-arrest-transition";
    layer.setAttribute("aria-live","assertive");
    layer.innerHTML='<div class="adf-arrest-phrase" id="adf-arrest-phrase"></div>';
    document.body.appendChild(layer);
    return layer;
  }

  async function playArrestTransition(){
    if(jailTransitionBusy||!street().arresto)return false;
    jailTransitionBusy=true;
    ensureJail();
    const layer=ensureArrestTransition();
    const phrase=layer.querySelector("#adf-arrest-phrase");
    const words=jailPickArrestPhrase();
    phrase.innerHTML='<span class="white">'+esc(words[0])+'</span><span class="red">'+esc(words[1])+'</span>';
    const reduced=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    layer.className="adf-arrest-transition";
    void layer.offsetWidth;
    try{
      await jailWait(reduced?30:350);
      layer.classList.add("on");
      await jailWait(reduced?90:2500);
      layer.classList.add("show-phrase");
      await jailWait(reduced?260:3400);
      layer.classList.remove("show-phrase");
      await jailWait(reduced?90:750);
      close();
      openJail({direct:true,reason:"arrest-transition"});
      await jailWait(reduced?30:200);
      layer.classList.add("leave");
      await jailWait(reduced?90:1000);
    }finally{
      layer.remove();
      jailTransitionBusy=false;
    }
    return true;
  }

  window.ADF_JAIL_TRANSITION=Object.freeze({
    play:playArrestTransition,
    phrases:()=>JAIL_ARREST_PHRASES.map(x=>x.slice()),
    busy:()=>jailTransitionBusy
  });

  function shell(){
    root.innerHTML=`<div class="app crime-app" id="crimeApp">
      <div class="bg-slideshow" id="bgSlideshow" aria-hidden="true"><div class="bg-slide on" id="bgA"></div><div class="bg-slide" id="bgB"></div></div>
      <div class="danger-wash" aria-hidden="true"></div><div class="shadow-pass" aria-hidden="true"></div>
      <header class="topbar">
        <div class="logo"><span class="mark"><svg viewBox="0 0 24 24"><path d="M12 2 15 8.2 22 7l-4.8 5 1.4 7L12 15.5 5.4 19l1.4-7L2 7l7 1.2z"/></svg></span><span>Anni di <i>Fame</i></span></div>
        <div class="where"><span class="k" id="crimeWhere">IL GIRO // PROVINCIA</span><strong>Attività <em>criminali</em></strong></div>
        <div class="session"><span id="crimeCity">Provincia</span><span>Sett. <b id="crimeWeek">01</b></span><span><b id="crimeClock">08:00</b></span><button class="exit" type="button">×</button></div>
      </header>
      <main class="scene">
        <aside class="panel side">
          <div class="panel-k">ADESSO</div>
          <div class="status-money"><span>Soldi sporchi</span><strong id="dirty">0 €</strong><button class="launder" id="launder" type="button">Ripulisci</button></div>
          <div class="stat"><div class="stat-head"><span>Reputazione di strada</span><b id="repN">0</b></div><div class="track"><i class="rep" id="repBar"></i></div></div>
          <div class="stat"><div class="stat-head heat-title"><span>Calore</span><b id="heatN">0</b></div><div class="track"><i class="heat" id="heatBar"></i></div></div>
          <div class="risk"><span>Energia</span><b id="energy">0 / 100</b></div>
          <div class="risk"><span>Contanti puliti</span><b id="clean">0 €</b></div>
          <div class="risk"><span>Precedenti</span><b id="precedents">0</b></div>
          <div class="risk pressure-row"><span>Occhi addosso</span><b class="hot" id="pressure">Bassi</b></div>
          <div class="street-note" id="pressureDetail">Più soldi sporchi tieni addosso, più ogni rumore fuori dalla porta sembra per te.</div>
          <div class="risk"><span>Tenore di vita</span><b id="lifestyleRisk">Coerente</b></div>
          <div class="street-note" id="lifestyleDetail">Quello che mostri fuori deve restare credibile rispetto alle entrate pulite.</div>
          <button class="quit" id="quit" type="button">Molla il giro</button>
        </aside>
        <section class="panel center" id="crimeCenter">
          <div class="herohead"><div class="kicker"><span class="pulse-dot"></span> CONTANTI · FAVORI · ORARI CHE CONTANO · NESSUN CONTRATTO</div><h1>Qui niente è <span>pulito.</span></h1><p id="crimeCaption">Ogni guadagno lascia qualcuno da pagare, qualcuno che sa troppo o qualcuno che ti sta cercando.</p><div id="crimeCaptionSource" class="crime-caption-source"></div></div>
          <div class="crimes" id="crimes"></div>
          <div class="lockscene" id="crimeLock"><div class="lockbox"><span>Fuori dal giro per ora</span><strong id="lockTitle">Sei dentro.</strong><span id="lockReq"></span></div></div>
        </section>
        <aside class="panel right">
          <div class="tabs"><button class="tab on" data-tab="cover" type="button">Chi ti copre</button><button class="tab" data-tab="business" type="button">Attività</button></div>
          <div class="tabpane on" id="tab-cover">
            <div class="cover-row"><div class="t"><strong>Persone del giro <span id="menCount">(0)</span></strong><span id="peopleSummary">La fiducia si costruisce: nessuno si compra da questa schermata.</span></div><button class="pill" id="addMan" type="button">Rapporti</button></div>
            <div class="cover-row"><div class="t"><strong>Protezione</strong><span id="protectionSummary">Serve una persona reale disposta a garantire per te.</span></div><button class="pill" id="prot" type="button">Gestisci</button></div>
            <div class="cover-row"><div class="t"><strong>Il ferro</strong><span id="gunSummary">Arriva tramite un contatto molto fidato e una proposta reale.</span></div><button class="pill danger" id="gun" type="button">Via contatto</button></div>
            <div class="cover-row"><div class="t"><strong>Avvocato</strong><span id="lawyerSummary">Va conosciuto nel mondo e poi incaricato.</span></div><button class="pill" id="lawyer" type="button">Gestisci</button></div>
            <div class="cover-row"><div class="t"><strong>Costo copertura</strong><span>Spesa fissa attuale.</span></div><button class="pill on" id="weekly" type="button" disabled>0 €/sett.</button></div>
            <div class="traphone-dock" id="traphoneDock">
              <div class="traphone-dock-head"><div><span>LINEA SEPARATA</span><b>TRAPHONE 16</b></div><em id="trapDockStatus">OFFLINE</em></div>
              <div class="trap-wrap" id="trapWrap" aria-label="Trap phone"><div class="trap-led" id="trapLed"></div><div class="trap-phone-badge" id="trapBadge">0</div><div class="trap-hint trap-hint-hidden"><b>TRAPHONE 16</b><br>Solo chiamate e messaggi.</div><div class="trap-phone"><div class="trap-speaker"></div><div class="trap-brand">TRAPHONE <b>16</b></div><div class="trap-screen-bezel"><div class="trap-screen" id="trapScreen"><div class="trap-status"><span class="trap-signal">▂▄▆█</span><span id="trapClock">08:00</span><span><span class="trap-battery"><i></i></span></span></div><div class="trap-view" id="trapView"></div><div class="trap-softline"><span id="trapSoftL">MENU</span><span id="trapSoftR">ESCI</span></div></div></div><div class="trap-modelplate"><span>TRAPHONE</span><b>16</b><i>DUAL BAND</i></div><div class="trap-controls"><div class="trap-softkeys"><button class="trap-key trap-soft" id="trapLeft" type="button">—</button><div class="trap-nav"><button class="up" data-trap-nav="up" type="button">▲</button><button class="down" data-trap-nav="down" type="button">▼</button><button class="left" data-trap-nav="left" type="button">◀</button><button class="right" data-trap-nav="right" type="button">▶</button><button class="ok" id="trapOk" type="button">OK</button></div><button class="trap-key trap-soft" id="trapRight" type="button">—</button></div><div class="trap-callrow"><button class="trap-key trap-call green" id="trapGreen" type="button">☎</button><button class="trap-key trap-call red" id="trapRed" type="button">●</button></div><div class="trap-numpad"><button class="trap-key trap-num" data-num="1" type="button">1<small>.,?</small></button><button class="trap-key trap-num" data-num="2" type="button">2<small>ABC</small></button><button class="trap-key trap-num" data-num="3" type="button">3<small>DEF</small></button><button class="trap-key trap-num" data-num="4" type="button">4<small>GHI</small></button><button class="trap-key trap-num" data-num="5" type="button">5<small>JKL</small></button><button class="trap-key trap-num" data-num="6" type="button">6<small>MNO</small></button><button class="trap-key trap-num" data-num="7" type="button">7<small>PQRS</small></button><button class="trap-key trap-num" data-num="8" type="button">8<small>TUV</small></button><button class="trap-key trap-num" data-num="9" type="button">9<small>WXYZ</small></button><button class="trap-key trap-num" data-num="*" type="button">*</button><button class="trap-key trap-num" data-num="0" type="button">0<small>+</small></button><button class="trap-key trap-num" data-num="#" type="button">#</button></div></div></div></div>
              <div class="trap-dock-actions"><span>80 SMS · 144 chiamate</span></div>
            </div>
            <div class="street-note">Nel giro non compri sicurezza. Compri solo qualche minuto in più prima che qualcosa vada storto.</div>
          </div>
          <div class="tabpane" id="tab-business"><div id="businessList"></div><div class="business-foot">Le attività generano resa settimanale e aumentano la capacità di ripulire il denaro sporco.</div></div>
        </aside>
        <div class="citybar"><div class="city-note"><span>Più sali, più diventa difficile sparire.</span></div><div class="cities"><button class="city on" data-city="provincia" type="button"><span class="n">Provincia</span><span class="d">Offerte del giorno</span></button><button class="city lock" data-city="milano" type="button"><span class="n">Milano</span><span class="d">4 colpi · livello 10</span></button><button class="city lock" data-city="la" type="button"><span class="n">Los Angeles</span><span class="d">3 colpi · da GOAT</span></button></div><div class="escape-help"><button class="map-return" id="mapReturn" type="button"><span class="arrow">←</span><span>Torna alla mappa</span></button></div></div>
      </main>
      <div class="modal" id="crimeModal"><div class="sheet"><div class="sheet-head"><div><span class="k" id="sceneK">Come vuoi muoverti?</span><h2 id="mTitle">—</h2><p id="mDesc">—</p></div><button class="closemodal" id="closeCrimeModal" type="button">×</button></div><div class="approaches" id="crimeOptions"></div></div></div>
      <div class="toast" id="crimeToast"></div><div class="trap-toast" id="trapToast"></div>
    </div>`;
  }
  shell();
  const q=s=>root.querySelector(s), qa=s=>[...root.querySelectorAll(s)];
  function gameState(){ return G; }
  function street(){ return G.strada; }
  function crimeVisualState(){
    const s=street(), a=window.ARTIST||((typeof A!=="undefined"&&A)||{});
    const fidati=typeof stradaPersoneSquadra==="function"?stradaPersoneSquadra():[];
    const avvocato=typeof stradaHaAvvocatoPrivato==="function"?stradaHaAvvocatoPrivato():!!s.avvocato;
    return {rep:+s.rep||0,heat:+s.heat||0,dirty:+s.sporchi||0,men:fidati.length,protection:+s.prot||0,gun:!!s.ferro,lawyer:!!avvocato,precedents:+s.precedenti||0,arrest:!!s.arresto,arresto:s.arresto,owned:s.attivita||{},businessCount:Object.values(s.attivita||{}).filter(Boolean).length,hasTrapPhone:(typeof stradaHaTrapPhone==="function"?stradaHaTrapPhone():!!(s.traphone&&s.traphone.owned)),trapPhone:s.traphone||null,city:String(a.city||a.citta||"provincia").toLowerCase(),level:(typeof livello==="function"?livello().lvl:1),fame:+G.fans||0,hype:+G.hype||0,goat:(typeof livello==="function"?livello().lvl>=60:false)};
  }
  window.crimeVisualState=crimeVisualState;
  function toast(t){const el=q("#crimeToast");if(!el)return;el.textContent=t;el.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("on"),1900)}
  function pressure(h){return h>=75?"Critici":h>=50?"Troppi":h>=25?"Presenti":"Bassi"}
  function weeklyCost(){
    if(typeof stCopertura==="function") return Number(stCopertura())||0;
    const s=street();
    const prot=(typeof STRADA_PROT!=="undefined"&&STRADA_PROT[s.prot])?Number(STRADA_PROT[s.prot].costo||0):0;
    return prot+(s.avvocato?320:0);
  }
  function crimeDef(id){return typeof STRADA_COLPI!=="undefined"?STRADA_COLPI.find(c=>c&&c.id===id)||null:null}
  function durationFor(id){const c=crimeDef(id);return c&&typeof stradaDurataColpo==="function"?stradaDurataColpo(c):120}
  function timeText(){try{return window.GAME_TIME?GAME_TIME.text():"08:00"}catch(_){return "08:00"}}
  function crimeWindow(id){
    const c=crimeDef(id);
    return c&&typeof stradaFinestraColpoStato==="function"
      ? stradaFinestraColpoStato(c)
      : {ok:true,label:""};
  }
  function canDoCrime(id){
    try{
      if(typeof stradaPartecipazioneAttiva==="function"&&!stradaPartecipazioneAttiva())return false;
      const finestra=crimeWindow(id);
      if(finestra&&!finestra.ok)return false;
      return !window.GAME_TIME || durationFor(id)<=GAME_TIME.remaining();
    }catch(_){return true}
  }
  function triggerPhone(level){const now=Date.now();if(now-lastPhoneAt<1500)return;lastPhoneAt=now;try{if(window.TRAPHONE16)TRAPHONE16.triggerTrapEvent(level||"low")}catch(_){}}
  function setVisual(tags,ms){try{if(window.setCrimeVisualEvent)window.setCrimeVisualEvent(tags,ms||60000)}catch(_){}}

  /* ---------- CARCERE: stato esclusivo della partita ----------
     Non è un luogo della mappa né una sottopagina del giro: quando sei detenuto
     questa è la scena di gioco disponibile. Il nuovo menu di sistema globale
     resta accessibile; la Mappa invece rimane bloccata fino alla scarcerazione. */
  function ensureJail(){
    let jail=document.getElementById("adf-jail");
    if(jail)return jail;
    const css=document.createElement("style");
    css.id="adf-jail-css";
    css.textContent=`
      .adf-jail{position:fixed;inset:0;z-index:112;display:none;background:#08090c;color:#f5f1ea;font-family:Figtree,Inter,system-ui,sans-serif;overflow:hidden}
      .adf-jail.on{display:block}
      .adf-jail-bg{position:absolute;inset:0;background-position:center;background-size:cover;filter:grayscale(.62) brightness(.28);transform:scale(1.02)}
      .adf-jail-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,5,8,.97) 0%,rgba(4,5,8,.77) 45%,rgba(4,5,8,.45) 100%),repeating-linear-gradient(90deg,transparent 0 72px,rgba(255,255,255,.045) 72px 78px)}
      .adf-jail-top{position:relative;z-index:2;height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 34px;border-bottom:1px solid rgba(255,255,255,.12);background:rgba(5,6,9,.72);backdrop-filter:blur(18px)}
      .adf-jail-brand{font-weight:950;letter-spacing:.08em;text-transform:uppercase}.adf-jail-brand i{font-style:normal;color:#ff315b}
      .adf-jail-meta{display:flex;gap:18px;color:#b7b2b4;font:800 11px/1.2 IBM Plex Mono,monospace;text-transform:uppercase}
      .adf-jail-main{position:relative;z-index:2;height:calc(100% - 72px);display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:28px;padding:clamp(34px,5vw,82px)}
      .adf-jail-copy{align-self:center;max-width:920px}
      .adf-jail-k{color:#ff315b;font:900 13px/1 IBM Plex Mono,monospace;letter-spacing:.15em;text-transform:uppercase}
      /* line-height .86 e non .72: sotto quel valore «dentro.» finiva sopra a «Sei» */
      .adf-jail h1{margin:14px 0 18px;font-family:"Big Shoulders Stencil Display","League Gothic",Impact,sans-serif;font-size:clamp(70px,8.4vw,164px);line-height:.86;letter-spacing:-.025em;text-transform:uppercase}
      .adf-jail h1 span{display:block;color:#ff315b}
      .adf-jail-copy>p{max-width:690px;margin:0;color:#c8c2c3;font-size:17px;line-height:1.55}
      /* la scheda scorre: a 768 di altezza non ci sta tutta, e quello che
         restava fuori (gli eventi, il tasto per uscire) non si raggiungeva */
      .adf-jail-card{align-self:center;max-height:100%;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,49,91,.42) transparent;padding:28px;border:1px solid rgba(255,49,91,.42);background:rgba(16,12,17,.82);backdrop-filter:blur(18px);box-shadow:0 26px 80px rgba(0,0,0,.42)}
      .adf-jail-card small{display:block;color:#a39ca0;font:850 10px/1 IBM Plex Mono,monospace;letter-spacing:.13em;text-transform:uppercase}
      .adf-jail-weeks{margin:10px 0 20px;font-family:"Big Shoulders Stencil Display",Impact,sans-serif;font-size:78px;line-height:.9;color:#fff}
      .adf-jail-weeks span{display:block;margin-top:8px;color:#ff315b;font:900 12px/1.2 Figtree,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      .adf-jail-row{padding:14px 0;border-top:1px solid rgba(255,255,255,.10)}.adf-jail-row b{display:block;margin-top:5px;font-size:15px}
      .adf-jail-tools{margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.12)}
      .adf-jail-tools>small,.adf-jail-feed>small{display:block;margin-bottom:8px;color:#9aa0aa;font-size:10px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}
      .adf-jail-actions{display:grid;gap:7px}.adf-jail-act{width:100%;padding:10px 11px;text-align:left;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.055);color:#f5f1ea;cursor:pointer}
      .adf-jail-act b{display:block;font-size:12px}.adf-jail-act span{display:block;margin-top:3px;color:#aeb3bd;font-size:10px;line-height:1.3}
      .adf-jail-act:disabled{opacity:.42;cursor:not-allowed}@media (hover:hover){.adf-jail-act:not(:disabled):hover{border-color:#ff315b;background:rgba(255,49,91,.09)}}
      .adf-jail-result{min-height:18px;margin-top:8px;color:#d9dde4;font-size:11px;line-height:1.35}
      .adf-jail-people{margin-top:15px;padding-top:12px;border-top:1px solid rgba(255,255,255,.10)}
      .adf-jail-people>small{display:block;margin-bottom:8px;color:#9aa0aa;font-size:10px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}
      .adf-jail-person{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-top:1px solid rgba(255,255,255,.07)}
      .adf-jail-person:first-of-type{border-top:0}.adf-jail-person b{font-size:11px}.adf-jail-person span{color:#9fa5af;font-size:10px;text-align:right}
      .adf-jail-feed{margin-top:15px;padding-top:12px;border-top:1px solid rgba(255,255,255,.10)}
      .adf-jail-event{padding:7px 0;border-top:1px solid rgba(255,255,255,.07)}.adf-jail-event:first-of-type{border-top:0}
      .adf-jail-event b{display:block;font-size:11px}.adf-jail-event span{display:block;margin-top:2px;color:#9fa5af;font-size:10px;line-height:1.35}
      .adf-jail-empty{color:#777e89;font-size:10px;line-height:1.35}
      .adf-jail-exit{width:100%;margin-top:18px;padding:14px 16px;border:1px solid rgba(255,255,255,.18);background:#f4f0ea;color:#111;font-weight:950;text-transform:uppercase;cursor:pointer}
      @media(max-width:900px){.adf-jail-main{grid-template-columns:1fr;padding:28px}.adf-jail-card{align-self:end}.adf-jail h1{font-size:86px}.adf-jail-meta{display:none}}
    `;
    css.textContent+=`
      .adf-jail-bg{opacity:0;transition:opacity 1.8s ease,filter 1.5s ease;will-change:opacity,filter}
      .adf-jail-bg.on{opacity:1}
      .adf-jail[data-jail-daypart="morning"] .adf-jail-bg{filter:grayscale(.18) sepia(.05) brightness(.46) contrast(1.03)}
      .adf-jail[data-jail-daypart="day"] .adf-jail-bg{filter:grayscale(.28) brightness(.40) contrast(1.05)}
      .adf-jail[data-jail-daypart="evening"] .adf-jail-bg{filter:grayscale(.24) sepia(.08) brightness(.34) contrast(1.07)}
      .adf-jail[data-jail-daypart="night"] .adf-jail-bg{filter:grayscale(.52) saturate(.74) brightness(.25) contrast(1.12)}
      .adf-jail-prisoner{display:flex;align-items:center;gap:18px;margin:0 0 24px}
      .adf-jail-portrait-shell{position:relative;width:112px;height:112px;flex:0 0 112px;overflow:hidden;border:1px solid rgba(255,255,255,.20);background:#0b0c0f;box-shadow:0 18px 45px rgba(0,0,0,.35)}
      .adf-jail-portrait{position:absolute;inset:0;display:grid;place-items:center;filter:grayscale(.32) contrast(1.04)}
      .adf-jail-portrait svg,.adf-jail-portrait img{width:100%;height:100%;display:block;object-fit:cover}
      .adf-jail-bars{position:absolute;inset:-3px;z-index:3;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0 18px,rgba(7,8,10,.94) 18px 24px,rgba(255,255,255,.12) 24px 25px,transparent 25px 40px);box-shadow:inset 0 0 30px rgba(0,0,0,.42)}
      .adf-jail-bars:after{content:"";position:absolute;left:-4%;right:-4%;top:52%;height:8px;background:linear-gradient(#1a1c20,#050608 55%,#24272d);box-shadow:0 1px rgba(255,255,255,.10)}
      .adf-jail-prisoner-meta{display:flex;flex-direction:column;gap:5px}
      .adf-jail-prisoner-meta span{color:#ff315b;font:900 10px/1 IBM Plex Mono,monospace;letter-spacing:.16em;text-transform:uppercase}
      .adf-jail-prisoner-meta b{font-size:20px;line-height:1.05;text-transform:uppercase}
      .adf-arrest-transition{position:fixed;inset:0;z-index:220;display:grid;place-items:center;background:#050506;opacity:0;pointer-events:all;transition:opacity 1.15s cubic-bezier(.22,.61,.36,1)}
      .adf-arrest-transition.on{opacity:1}
      .adf-arrest-transition.leave{opacity:0;transition-duration:.9s}
      .adf-arrest-phrase{position:relative;z-index:2;max-width:min(1100px,90vw);padding:0 24px;text-align:center;font-family:"Big Shoulders Stencil Display","League Gothic",Impact,sans-serif;font-size:clamp(86px,10vw,190px);font-weight:900;line-height:.72;letter-spacing:-.025em;text-transform:uppercase;opacity:0;transition:opacity 1.4s ease}
      .adf-arrest-phrase .white,.adf-arrest-phrase .red{display:block}
      .adf-arrest-phrase .white{color:#111114;transition:color 1.4s ease}
      .adf-arrest-phrase .red{color:#121216;transition:color 1.4s ease}
      .adf-arrest-transition.show-phrase .adf-arrest-phrase{opacity:1}
      .adf-arrest-transition.show-phrase .adf-arrest-phrase .white{color:#f5f1ea}
      .adf-arrest-transition.show-phrase .adf-arrest-phrase .red{color:#ff315b}
      @media(max-width:900px){.adf-jail-prisoner{margin-bottom:16px}.adf-jail-portrait-shell{width:86px;height:86px;flex-basis:86px}.adf-jail-prisoner-meta b{font-size:16px}.adf-arrest-phrase{font-size:clamp(72px,18vw,118px)}}
      @media(prefers-reduced-motion:reduce){.adf-jail-bg,.adf-arrest-transition,.adf-arrest-phrase{transition-duration:.01ms!important}}
    `;
    document.head.appendChild(css);
    jail=document.createElement("div");
    jail.id="adf-jail";
    jail.className="adf-jail";
    jail.innerHTML=`<div class="adf-jail-bg on" id="adf-jail-bg-a"></div><div class="adf-jail-bg" id="adf-jail-bg-b"></div>
      <div class="adf-jail-top">
        <div class="adf-jail-brand">Anni di <i>Fame</i> // Carcere</div>
        <div class="adf-jail-meta"><span id="adf-jail-city">Provincia</span><span id="adf-jail-time">08:00</span></div>
      </div>
      <div class="adf-jail-main">
        <div class="adf-jail-copy">
          <div class="adf-jail-prisoner">
            <div class="adf-jail-portrait-shell"><div class="adf-jail-portrait" id="adf-jail-portrait"></div><div class="adf-jail-bars" aria-hidden="true"></div></div>
            <div class="adf-jail-prisoner-meta"><span>Detenuto</span><b id="adf-jail-prisoner-name">—</b></div>
          </div>
          <div class="adf-jail-k">Detenzione</div>
          <h1>Sei <span>dentro.</span></h1>
          <p>Niente colpi finché non esci. La pena scorre con le settimane del gioco: il carcere non dipende dagli orari delle Attività criminali.</p>
        </div>
        <aside class="adf-jail-card">
          <small>Tempo residuo</small>
          <div class="adf-jail-weeks" id="adf-jail-weeks">—</div>
          <div class="adf-jail-row"><small>Per cosa</small><b id="adf-jail-cause">—</b></div>
          <div class="adf-jail-row"><small>Precedenti</small><b id="adf-jail-record">0</b></div>
          <div class="adf-jail-tools">
            <small>Cosa puoi fare qui dentro</small>
            <div class="adf-jail-actions" id="adf-jail-actions"></div>
            <div class="adf-jail-result" id="adf-jail-result"></div>
          </div>
          <div class="adf-jail-people">
            <small>Persone qui dentro</small>
            <div id="adf-jail-people"></div>
          </div>
          <div class="adf-jail-feed">
            <small>Dentro succede</small>
            <div id="adf-jail-events"></div>
          </div>
        </aside>
      </div>`;
    document.body.appendChild(jail);
    jail.addEventListener("click",ev=>{
      const b=ev.target.closest&&ev.target.closest("[data-jail-action]");
      if(!b || !window.ADF_JAIL || typeof ADF_JAIL.act!=="function") return;
      const r=ADF_JAIL.act(b.dataset.jailAction);
      const out=jail.querySelector("#adf-jail-result");
      if(out) out.textContent=(r&&r.t)||"";
      syncJail();
    });
    return jail;
  }
  function jailDaypart(){
    let minutes=Number(G.timeMinutes);
    if(!Number.isFinite(minutes)){
      const txt=timeText(),m=/^(\d{1,2}):(\d{2})$/.exec(txt);
      minutes=m?(+m[1]*60)+(+m[2]):480;
    }
    const h=((Math.floor(minutes/60)%24)+24)%24;
    return h>=6&&h<11?"morning":h>=11&&h<18?"day":h>=18&&h<22?"evening":"night";
  }
  function jailBackground(){
    const all=window.JAIL_BACKGROUNDS_LOCAL||[];
    if(!all.length)return null;
    const part=jailDaypart();
    const scored=all.map(bg=>{
      const tags=Array.isArray(bg.tags)?bg.tags:[];
      let score=1;
      if(tags.includes(part))score+=8;
      if(part==="morning"&&tags.includes("day"))score+=2;
      if(part==="evening"&&tags.includes("day"))score+=1;
      if(part==="night"&&tags.includes("indoor"))score+=2;
      if(part==="night"&&tags.includes("outdoor")&&!tags.includes("night"))score-=1;
      if(bg.url===jailBgLast)score=0;
      return {bg,score:Math.max(0,score)};
    }).filter(x=>x.score>0);
    const pool=scored.length?scored:all.map(bg=>({bg,score:1}));
    let total=pool.reduce((n,x)=>n+x.score,0),r=Math.random()*total,pick=pool[pool.length-1].bg;
    for(const x of pool){r-=x.score;if(r<=0){pick=x.bg;break}}
    jailBgLast=pick&&pick.url||"";
    return pick||null;
  }
  function applyJailBackground(el,force){
    if(!el)return;
    el.dataset.jailDaypart=jailDaypart();
    const a=el.querySelector("#adf-jail-bg-a"),b=el.querySelector("#adf-jail-bg-b");
    if(!a||!b)return;
    const current=jailBgActive?a:b;
    const next=jailBgActive?b:a;
    if(!force&&current.dataset.ready==="1")return;
    const bg=jailBackground();
    if(!bg||!bg.url)return;
    next.style.backgroundImage=`url("${bg.url}")`;
    next.style.backgroundPosition=bg.position||"center";
    next.dataset.ready="1";
    requestAnimationFrame(()=>{
      next.classList.add("on");
      current.classList.remove("on");
      jailBgActive=jailBgActive?0:1;
    });
  }
  function startJailBackgroundCycle(){
    clearInterval(jailBgTimer);
    jailBgTimer=setInterval(()=>{
      const jail=document.getElementById("adf-jail");
      if(!jail||!jail.classList.contains("on")||!street().arresto){clearInterval(jailBgTimer);jailBgTimer=null;return}
      applyJailBackground(jail,true);
    },24000);
  }
  function renderJailLoop(el){
    const box=el.querySelector("#adf-jail-actions"), feed=el.querySelector("#adf-jail-events"),
      people=el.querySelector("#adf-jail-people");
    if(!window.ADF_JAIL || typeof ADF_JAIL.view!=="function"){
      if(box) box.innerHTML='<div class="adf-jail-empty">Meccaniche carcere non disponibili.</div>';
      return;
    }
    const v=ADF_JAIL.view();
    if(box) box.innerHTML=(v.azioni||[]).map(a=>
      '<button class="adf-jail-act" type="button" data-jail-action="'+esc(a.id)+'" '+(a.disabled?"disabled":"")+'>'+
        '<b>'+esc(a.n)+'</b><span>'+esc(a.reason||a.d||"")+'</span></button>'
    ).join("");
    if(people){
      people.innerHTML=(v.persone&&v.persone.length)
        ? v.persone.map(p=>'<div class="adf-jail-person"><b>'+esc(p.n)+'</b><span>'+esc(p.stato)+'</span></div>').join("")
        : '<div class="adf-jail-empty">Non hai ancora costruito un rapporto vero con nessuno qui dentro.</div>';
    }
    if(feed){
      feed.innerHTML=(v.eventi&&v.eventi.length)
        ? v.eventi.map(e=>'<div class="adf-jail-event"><b>'+esc(e.t)+'</b><span>'+esc(e.txt)+'</span></div>').join("")
        : '<div class="adf-jail-empty">Per ora solo rumore di chiavi e porte. Gli eventi qui dentro arrivano con il tempo, non ogni ora.</div>';
    }
  }

  function syncJail(){
    const jail=document.getElementById("adf-jail");
    const a=street().arresto;
    if(!a){closeJail(true);return false}
    const el=ensureJail();
    const n=Math.max(0,Number(a.settimane)||0);
    el.querySelector("#adf-jail-weeks").innerHTML=n+`<span>${n===1?"settimana rimasta":"settimane rimaste"}</span>`;
    el.querySelector("#adf-jail-cause").textContent=a.colpo||"Arresto";
    el.querySelector("#adf-jail-record").textContent=String(Number(street().precedenti)||0);
    el.querySelector("#adf-jail-time").textContent=timeText();
    const art=window.ARTIST||{};
    el.querySelector("#adf-jail-city").textContent=(String(art.city||art.citta||"").trim()||"Provincia");
    const pname=el.querySelector("#adf-jail-prisoner-name");
    if(pname)pname.textContent=(String(art.name||"").trim()||"Detenuto");
    const portrait=el.querySelector("#adf-jail-portrait");
    if(portrait&&window.ARTIST_PORTRAIT)portrait.innerHTML=window.ARTIST_PORTRAIT();
    applyJailBackground(el,false);
    renderJailLoop(el);
    return true;
  }
  function closeJail(force){
    if(street().arresto&&!force)return false;
    const jail=document.getElementById("adf-jail");
    if(jail)jail.classList.remove("on");
    clearInterval(jailBgTimer);jailBgTimer=null;
    try{window.dispatchEvent(new CustomEvent("jail-ui:closed"))}catch(_){}
    return true;
  }
  function openJail(opts){
    if(!street().arresto)return false;
    root.classList.remove("on");
    const jail=ensureJail();
    syncJail();
    jail.classList.add("on");
    applyJailBackground(jail,true);
    startJailBackgroundCycle();
    try{window.dispatchEvent(new CustomEvent("jail-ui:opened",{detail:opts||{}}))}catch(_){}
    return true;
  }
  window.apriCarcere=openJail;
  window.chiudiCarcere=()=>closeJail(false);
  window.addEventListener("jail:changed",()=>{
    if(street().arresto){
      syncJail();
      const jail=document.getElementById("adf-jail");
      if(!jailTransitionBusy&&jail&&!jail.classList.contains("on"))openJail({direct:true,reason:"jail-state"});
    }else closeJail(true);
  });

  /* ---------- local background engine ---------- */
  function careerBand(s){let structure=s.men*5+s.protection*7+s.businessCount*6+(s.gun?4:0)+(s.lawyer?4:0),capital=Math.min(25,Math.log10(Math.max(1,s.dirty+100))*6),cityBonus=s.city.includes("milano")?14:(s.city.includes("los")||s.city==="la"?26:0),score=s.rep*.62+structure+capital+cityBonus;if(s.goat)score=Math.max(score,88);return score>=78?3:score>=50?2:score>=27?1:0}
  let visualEvent={tags:[],until:0};
  window.setCrimeVisualEvent=function(tags,ms=45000){visualEvent={tags:Array.isArray(tags)?tags:[tags],until:Date.now()+ms};chooseBackground(false)};
  function tagBoost(bg,s){const tags=new Set(bg.tags||[]);let w=1;if(tags.has("police")||tags.has("heat")||tags.has("raid")||tags.has("arrest")){w*=1+s.heat/38;if(s.heat>70)w*=1.8}if(s.arrest){if(tags.has("prison")||tags.has("arrest")||tags.has("court")||tags.has("lawyer"))w*=8;if(tags.has("luxury")||tags.has("boss")||tags.has("empire"))w*=.18}if(s.precedents>0&&(tags.has("court")||tags.has("lawyer")||tags.has("prison")||tags.has("arrest")))w*=1+Math.min(2.5,s.precedents*.45);if(s.gun&&(tags.has("gun")||tags.has("heist")))w*=2.2;if(s.men>=2&&(tags.has("crew")||tags.has("meeting")))w*=1.5+s.men*.16;if(s.protection>=2&&(tags.has("protection")||tags.has("convoy")||tags.has("crew")))w*=1.7;if(s.lawyer&&(tags.has("lawyer")||tags.has("court")))w*=2.7;if(s.businessCount>0&&(tags.has("business")||tags.has("launder")))w*=1.5+s.businessCount*.35;if(s.owned.lavanderia&&tags.has("launder"))w*=2.1;if(s.owned.autolavaggio&&tags.has("carwash"))w*=3;if(s.owned.minimarket&&tags.has("business"))w*=1.8;if(s.dirty>1200&&(tags.has("dirty")||tags.has("cash")||tags.has("launder")))w*=1.6;if(s.rep>45&&(tags.has("boss")||tags.has("organization")||tags.has("meeting")))w*=1.55;if(s.rep>70&&(tags.has("empire")||tags.has("boss")||tags.has("luxury")))w*=2.1;if(visualEvent.until>Date.now())for(const t of visualEvent.tags)if(tags.has(t))w*=5.5;return w}
  function unlocked(bg,s){const band=careerBand(s);if(bg.tier===0||bg.tier<=band)return true;if(bg.tier===1&&(s.men>=2||s.businessCount>=1||s.gun||s.lawyer||s.dirty>1500))return true;if(bg.tier===2&&(s.rep>=45&&(s.men>=2||s.protection>=2||s.businessCount>=2||s.dirty>4500)))return true;if(bg.tier===3&&((s.rep>=72&&s.protection>=2&&s.men>=3)||s.goat))return true;return false}
  function chooseBackground(immediate){const all=window.CRIME_BACKGROUNDS_LOCAL||[];if(!all.length)return;const s=crimeVisualState(),band=careerBand(s),mult=[1,band>=1?1.25:.45,band>=2?1.25:.28,band>=3?1.25:.18],pool=[];for(const bg of all){if(!unlocked(bg,s))continue;let w=tagBoost(bg,s)*mult[bg.tier];if(bgHistory.includes(bg.id))w*=.12;pool.push([bg,Math.max(.02,w)])}let total=pool.reduce((a,x)=>a+x[1],0),r=Math.random()*total,bg=pool[0]&&pool[0][0];for(const x of pool){r-=x[1];if(r<=0){bg=x[0];break}}if(!bg)return;const layers=[q("#bgA"),q("#bgB")],next=immediate?layers[0]:layers[1-activeBg];next.style.backgroundImage=`url("${bg.url}")`;next.style.backgroundPosition=bg.position||"center 48%";next.classList.add("on");if(!immediate){layers[activeBg].classList.remove("on");activeBg=1-activeBg}else activeBg=0;bgHistory.push(bg.id);if(bgHistory.length>6)bgHistory.shift();window.__CRIME_BG_TAGS=Array.isArray(bg.tags)?bg.tags.slice():[];try{if(window.refreshCrimeCaption)window.refreshCrimeCaption(!!immediate)}catch(_){}}

  function renderCrimes(){
    const s=street(),partecipa=typeof stradaPartecipazioneAttiva!=="function"||stradaPartecipazioneAttiva();
    const box=q("#crimes");
    if(!partecipa){
      const u=typeof stradaUscitaStato==="function"?stradaUscitaStato():null;
      const giorni=u&&typeof stradaAbsDay==="function"
        ? Math.max(0,Number(u.memoryUntilAbsoluteDay||0)-stradaAbsDay())
        : 0;
      box.innerHTML='<div class="crime-empty"><b>Hai mollato il giro</b><p>Non accetti più colpi e non ricicli denaro. '+
        (giorni>0
          ? 'Il passato può ancora tornare a bussare per circa '+giorni+' giorni.'
          : 'Persone, precedenti e storia restano parte del personaggio.')+
        '</p></div>';
      return;
    }

    const offerte=typeof stradaColpiDisponibiliAdesso==="function"
      ? stradaColpiDisponibiliAdesso()
      : (typeof stradaColpiDisponibili==="function"?stradaColpiDisponibili():STRADA_COLPI.slice(0,4))
          .filter(c=>crimeWindow(c.id).ok);

    if(!offerte.length){
      box.innerHTML='<div class="crime-empty"><b>Nessun lavoro gira adesso</b><p>Le offerte del giorno restano le stesse, ma in questa fascia oraria nessuna è coerente con il contesto. Torna più tardi.</p></div>';
      return;
    }

    const leadIncontro=typeof stradaOpportunitaAttiva==="function"?stradaOpportunitaAttiva():null;
    const leadLavoro=window.ADF_WORK_EVENTS&&typeof ADF_WORK_EVENTS.crimeLeadActive==="function"
      ? ADF_WORK_EVENTS.crimeLeadActive()
      : null;

    box.innerHTML=offerte.map((c,i)=>{
      const finestra=crimeWindow(c.id);
      const ok=G.energy>=c.energia&&canDoCrime(c.id)&&!s.arresto;
      const categoria=typeof stradaCategoria==="function"?stradaCategoria(c).n:"";
      const rischio=typeof stRischio==="function"?stRischio(c):null;
      const rischioClasse=typeof stClasseRischio==="function"?stClasseRischio(c):"";
      const caduta=typeof stradaCadutaProfilo==="function"?stradaCadutaProfilo(c):null;
      const cadutaClasse=typeof stradaCadutaClasse==="function"?stradaCadutaClasse(c):"";
      const leadIncontroQui=leadIncontro&&leadIncontro.colpoId===c.id?leadIncontro:null;
      const lead=leadIncontroQui||leadLavoro;
      const giorniLead=lead&&typeof stradaAbsDay==="function"
        ? Math.max(1,Number(lead.expiresAbsoluteDay)-stradaAbsDay())
        : 0;
      const fonteLead=leadIncontroQui
        ? (leadIncontroQui.titolo||"Opportunità")
        : (lead&&lead.sourceLabel?"Dritta "+lead.sourceLabel:"Dritta lavoro");
      const bonusLead=lead
        ? fonteLead+" "+(Number(lead.bonusPct||0)>=0?"+":"")+Number(lead.bonusPct||0)+"%"+
          (lead.source==="street-opportunity"&&typeof stradaSegnoPct==="function"
            ?" · "+stradaSegnoPct(lead.chanceDelta)+" riuscita"
            :"")+
          (giorniLead?" · "+giorniLead+(giorniLead===1?" giorno":" giorni"):"")
        : "";
      return `<button class="crime${ok?"":" disabled"}" data-crime="${esc(c.id)}" type="button" ${ok?"":"disabled"}><span class="num">0${i+1}</span><b>${esc(c.n)}</b><p>${esc(c.d)}</p><div class="chips">${categoria?`<span class="chip">${esc(categoria)}</span>`:""}<span class="chip money">${money(c.min)}–${money(c.max)} €</span><span class="chip">${c.energia} energia</span><span class="chip">${window.GAME_TIME?GAME_TIME.formatDuration(durationFor(c.id)):""}</span>${finestra&&finestra.label?`<span class="chip">${esc(finestra.label)}</span>`:""}${rischio?`<span class="chip ${esc(rischioClasse)}">Rischio ${esc(String(rischio).toLowerCase())}</span>`:""}${caduta?`<span class="chip ${esc(cadutaClasse)}">Caduta ${esc(caduta.label)}</span>`:""}${bonusLead?`<span class="chip money">${esc(bonusLead)}</span>`:""}</div><span class="go">→</span></button>`;
    }).join("");
  }
  function renderBusinesses(){
    const s=street(),partecipa=typeof stradaPartecipazioneAttiva!=="function"||stradaPartecipazioneAttiva();
    q("#businessList").innerHTML=STRADA_ATTIVITA.map(a=>{
      const own=!!s.attivita[a.id];
      if(!own)return `<div class="activity"><div class="a-top"><strong>${esc(a.n)}</strong><span class="price">${money(a.costo)} €</span></div><p>Ricavi normali ${money(a.ricavoPulito||0)} €/sett. · gestione ${money(a.gestione||0)} €. Aumenta la capacità di riciclaggio.</p><button class="pill" data-buy="${esc(a.id)}" type="button" ${!partecipa||G.money<a.costo?"disabled":""}>${partecipa?"Rileva":"Fuori dal giro"}</button></div>`;
      const st=typeof stradaAttivitaStato==="function"?stradaAttivitaStato(a.id,true):null;
      const residuo=typeof stradaLavaggioResiduoCanale==="function"?stradaLavaggioResiduoCanale(a.id):0;
      const operativa=typeof stradaAttivitaOperativa==="function"?stradaAttivitaOperativa(a.id):true;
      return `<div class="activity owned"><div class="a-top"><strong>${esc(a.n)}</strong><span class="price">${operativa?(st&&st.issue?"PROBLEMA":"OPERATIVA"):"FERMA"}</span></div><p>Netto normale ${money(Math.max(0,Number(a.ricavoPulito||0)-Number(a.gestione||0)))} €/sett. · ${partecipa?"riciclaggio residuo "+money(residuo)+" €":"lato criminale chiuso"} · pressione ${Math.round(Number(st&&st.pressione||0))}/100.</p><button class="pill" data-business="${esc(a.id)}" type="button">Gestisci</button></div>`;
    }).join("");
  }
  function renderScene(){
    const modal=q("#crimeModal");
    if(!STRADA_SCENA){modal.classList.remove("on");return}
    q("#sceneK").textContent=STRADA_SCENA.k||"DECISIONE";
    q("#mTitle").textContent=STRADA_SCENA.titolo||"—";
    const stats=(STRADA_SCENA.stats||[]).map(x=>'<span class="chip '+esc(x.c||"")+'">'+esc(x.t||"")+'</span>').join("");
    q("#mDesc").innerHTML=(STRADA_SCENA.testo||"")+(stats?'<div class="chips">'+stats+'</div>':"");
    q("#crimeOptions").innerHTML=(STRADA_SCENA.opts||[]).map((o,i)=>{
      const meta=[o.sx,o.dx].filter(Boolean).map(x=>'<span class="chip">'+esc(x)+'</span>').join("");
      return `<button class="approach${o.hot?" hot":""}${o.no?" disabled":""}" data-scene-opt="${i}" type="button" ${o.no?"disabled":""}><span class="a-num">0${i+1}</span><b>${esc(o.n)}</b><p>${esc(o.d||"")}</p>${meta?'<div class="chips">'+meta+'</div>':""}</button>`;
    }).join("");
    modal.classList.add("on");
  }
  function sync(){
    const s=street(),art=window.ARTIST||{},city=(String(art.city||art.citta||"").trim()||"Provincia");
    const partecipa=typeof stradaPartecipazioneAttiva!=="function"||stradaPartecipazioneAttiva();

    if(typeof stradaAggiornaRelazioniCriminali==="function")stradaAggiornaRelazioniCriminali(true);
    if(typeof stradaHeatSincronizzaPersone==="function")stradaHeatSincronizzaPersone();

    q("#crimeCity").textContent=city;
    q("#crimeWhere").textContent="IL GIRO // "+city.toUpperCase();
    q("#dirty").textContent=money(s.sporchi)+" €";
    q("#clean").textContent=money(G.money)+" €";
    q("#energy").textContent=Math.round(G.energy)+" / "+Math.round(G.maxEnergy||100);
    q("#repN").textContent=Math.round(s.rep);
    q("#repBar").style.width=clampN(s.rep,0,100)+"%";
    q("#heatN").textContent=Math.round(s.heat);
    q("#heatBar").style.width=clampN(s.heat,0,100)+"%";
    q("#precedents").textContent=Math.round(s.precedenti||0);

    const heatMondo=typeof stradaHeatProfilo==="function"
      ? stradaHeatProfilo()
      : {id:"basso",label:pressure(s.heat),occhi:pressure(s.heat),mondo:"La pressione resta locale."};
    q("#pressure").textContent=heatMondo.occhi||heatMondo.label||pressure(s.heat);
    q("#pressure").classList.toggle("hot",heatMondo.id==="alto"||heatMondo.id==="critico"||Number(s.heat)>=50);
    q("#pressureDetail").textContent=heatMondo.mondo||"La pressione del giro cambia come reagiscono persone e controlli.";

    const tenore=typeof lifestyleRiepilogoRischio==="function"
      ? lifestyleRiepilogoRischio()
      : {id:"coerente",label:"Coerente",testo:"Il tuo tenore di vita è compatibile con le entrate giustificabili.",entrate:Number(G._entratePulite||0),visibile:typeof lifeCost==="function"?lifeCost():0};
    q("#lifestyleRisk").textContent=tenore.label||"Coerente";
    q("#lifestyleRisk").classList.toggle("hot",tenore.id!=="coerente"&&tenore.id!=="tirato");
    q("#lifestyleDetail").textContent=(tenore.testo||"")+" · circa "+money(tenore.entrate)+" €/sett. giustificabili contro "+money(tenore.visibile)+" €/sett. visibili.";

    const tutti=typeof stradaNpcPersone==="function"
      ? stradaNpcPersone().filter(p=>p&&p.strada&&p.strada.known&&!p.via)
      : [];
    const contatti=typeof stradaRelazioneDisponibile==="function"
      ? tutti.filter(stradaRelazioneDisponibile)
      : tutti;
    const prudenti=typeof stradaHeatPersonaCauta==="function"?contatti.filter(stradaHeatPersonaCauta):[];
    const rivali=typeof stradaRivalitaAttiva==="function"?tutti.filter(stradaRivalitaAttiva):[];
    const dormienti=typeof stradaRelazioneDisponibile==="function"
      ? tutti.filter(p=>!stradaRelazioneDisponibile(p)&&!(typeof stradaRivalitaAttiva==="function"&&stradaRivalitaAttiva(p)))
      : [];
    const fidati=typeof stradaPersoneSquadra==="function"?stradaPersoneSquadra():[];

    q("#menCount").textContent=`(${contatti.length} attivi · ${fidati.length} fidati)`;
    q("#peopleSummary").textContent=(fidati.length
      ? fidati.length+(fidati.length===1?" persona si fida":" persone si fidano")+" abbastanza da muoversi con te."
      : "Nessuno si fida ancora abbastanza da venire a un colpo con te.")+
      (prudenti.length?" · "+prudenti.length+(prudenti.length===1?" contatto si tiene basso.":" contatti si tengono bassi."):"")+
      (dormienti.length?" · "+dormienti.length+(dormienti.length===1?" contatto è fuori dal giro per ora.":" contatti sono fuori dal giro per ora."):"")+
      (rivali.length?" · "+rivali.length+(rivali.length===1?" rapporto è diventato una rivalità.":" rapporti sono diventati rivalità."):"");

    const launderCap=typeof stradaCapienza==="function"?stradaCapienza():400;
    const launderMin=window.GAME_TIME&&GAME_TIME.durationFor?GAME_TIME.durationFor("ricicla"):45;
    const launderTime=window.GAME_TIME&&GAME_TIME.formatDuration?GAME_TIME.formatDuration(launderMin):launderMin+" min";
    q("#launder").textContent=!partecipa
      ? "Fuori dal giro: riciclaggio chiuso"
      : launderCap>0
        ? "Ripulisci fino a "+money(launderCap)+" € · "+launderTime
        : "Limite settimanale raggiunto";
    q("#launder").disabled=!partecipa||s.sporchi<=0||launderCap<=0||!!s.arresto;

    const ferroSt=typeof stradaFerroStato==="function"?stradaFerroStato():null;
    const avvSt=typeof stradaAvvocatoStato==="function"?stradaAvvocatoStato():null;
    const protSt=typeof stradaProtezioneStato==="function"?stradaProtezioneStato():null;

    q("#addMan").disabled=!partecipa;
    q("#prot").disabled=!partecipa;
    q("#gun").disabled=!partecipa||!!s.ferro;
    q("#lawyer").disabled=!partecipa;

    q("#gun").textContent=s.ferro?"Ce l'hai":(ferroSt&&ferroSt.pending?"Proposta aperta":"Via contatto");
    q("#gun").classList.toggle("on",!!s.ferro);
    q("#lawyer").textContent=avvSt&&avvSt.retained?(avvSt.name||"Incaricato"):(partecipa?"Gestisci":"Fuori dal giro");
    q("#lawyer").classList.toggle("on",!!(avvSt&&avvSt.retained));
    q("#prot").textContent=s.prot>0?((protSt&&protSt.providerName?protSt.providerName+" · ":"")+(STRADA_PROT[s.prot]||STRADA_PROT[0]).n):(partecipa?"Gestisci":"Fuori dal giro");
    q("#prot").classList.toggle("on",s.prot>0);

    q("#protectionSummary").textContent=!partecipa
      ? "Gli accordi criminali sono chiusi; le persone che conoscevi restano nel mondo."
      : s.prot>0
        ? ((protSt&&protSt.providerName?protSt.providerName+" garantisce per te. ":"")+money((STRADA_PROT[s.prot]||STRADA_PROT[0]).costo)+" €/sett.")
        : "Serve una persona reale disposta a garantire per te.";
    q("#gunSummary").textContent=!partecipa
      ? "Hai lasciato il giro: non cerchi nuove armi tramite la rete."
      : s.ferro
        ? "Lo possiedi: aumenta le possibilità, ma rende più pesante un controllo."
        : "Arriva tramite un contatto molto fidato e una proposta reale.";
    q("#lawyerSummary").textContent=!partecipa
      ? "I rapporti restano, ma non mantieni un incarico privato per la Strada."
      : avvSt&&avvSt.retained
        ? (avvSt.name||"Avvocato privato")+" · "+money(typeof STRADA_AVVOCATO_COSTO!=="undefined"?STRADA_AVVOCATO_COSTO:320)+" €/sett."
        : "Va conosciuto nel mondo e poi incaricato.";

    q("#weekly").textContent=money(weeklyCost())+" €/sett.";
    q("#quit").textContent=partecipa?"Molla il giro":"Fuori dal giro";
    q("#quit").disabled=!partecipa||!!s.arresto;

    q("#crimeWeek").textContent=String(G.week||1).padStart(2,"0");
    q("#crimeClock").textContent=timeText();
    const tc=q("#trapClock");if(tc)tc.textContent=timeText();
    const trapOwned=typeof stradaHaTrapPhone==="function"?stradaHaTrapPhone():!!(s.traphone&&s.traphone.owned);
    const trapDock=q("#traphoneDock");if(trapDock)trapDock.hidden=!trapOwned;

    const caption=q("#crimeCaption");
    if(caption&&!partecipa){
      const u=typeof stradaUscitaStato==="function"?stradaUscitaStato():null;
      const giorni=u&&typeof stradaAbsDay==="function"?Math.max(0,Number(u.memoryUntilAbsoluteDay||0)-stradaAbsDay()):0;
      caption.textContent=giorni>0
        ? "Hai mollato il giro. Il passato è ancora vicino, ma non stai più cercando nuovi colpi."
        : "Hai mollato il giro. La storia resta, le attività criminali attive no.";
    }

    const ar=!!s.arresto;
    q("#crimeCenter").classList.toggle("locked",ar);
    q("#crimeLock").style.display=ar?"flex":"";
    if(ar){
      q("#lockTitle").textContent="Sei dentro.";
      q("#lockReq").textContent=(s.arresto.settimane||0)+" settimane rimaste · "+(s.arresto.colpo||"arresto");
    }

    renderCrimes();
    renderBusinesses();
    renderScene();
    try{
      if(window.TRAPHONE16&&trapOwned){
        const snap=TRAPHONE16.snapshot();
        q("#trapDockStatus").textContent=(snap.unread||0)+" NON LETTI";
      }
    }catch(_){}
  }

  function close(){root.classList.remove("on");try{window.dispatchEvent(new CustomEvent("crime-ui:closed"))}catch(_){} }
  function open(){if(street().arresto)return openJail();if(typeof hubTap==="function")hubTap();STRADA_SCENA=null;sync();root.classList.add("on");chooseBackground(!q("#bgA").style.backgroundImage);if(!bgTimer)bgTimer=setInterval(()=>{if(root.classList.contains("on"))chooseBackground(false)},15000); }

  root.addEventListener("click",ev=>{
    const c=ev.target.closest("[data-crime]");if(c){if(!canDoCrime(c.dataset.crime)){const f=crimeWindow(c.dataset.crime);toast(f&&!f.ok?f.message:"Non puoi completare questo colpo adesso.");return}if(window.GAME_EVENTS&&GAME_EVENTS.blocked&&GAME_EVENTS.blocked()){toast("Prima devi risolvere l'evento in corso.");return}if(typeof hubTap==="function")hubTap();stAvviaColpo(c.dataset.crime);sync();return}
    const so=ev.target.closest("[data-scene-opt]");if(so&&STRADA_SCENA){const o=STRADA_SCENA.opts[+so.dataset.sceneOpt];if(o&&o.no)return;if(o&&typeof o.run==="function")o.run();try{save()}catch(_){}sync();try{renderGioco()}catch(_){}if(street().arresto&&!STRADA_SCENA){playArrestTransition()}return}
    if(ev.target.closest("#launder")){if(typeof stScenaRiciclaggio==="function"){STRADA_SCENA=stScenaRiciclaggio();sync()}return}
    if(ev.target.closest("#addMan")){toast("Le persone del giro entrano dai rapporti: non si comprano da qui.");return}
    if(ev.target.closest("#prot")){if(typeof stScenaProtezione==="function"){STRADA_SCENA=stScenaProtezione();sync()}return}
    if(ev.target.closest("#gun")){const msg=stCompraFerro();if(msg)toast(msg);sync();return}
    if(ev.target.closest("#lawyer")){if(typeof stScenaAvvocato==="function"){STRADA_SCENA=stScenaAvvocato();sync()}return}
    const manage=ev.target.closest("[data-business]");if(manage){if(typeof stScenaAttivita==="function"){STRADA_SCENA=stScenaAttivita(manage.dataset.business);sync()}return}
    const b=ev.target.closest("[data-buy]");if(b){const before=!!street().attivita[b.dataset.buy],msg=stCompraAttivita(b.dataset.buy);if(msg)toast(msg);if(!before&&street().attivita[b.dataset.buy]){setVisual(["business","launder"]);triggerPhone("medium")}sync();return}
    if(ev.target.closest("#quit")){if(street().arresto){toast("Da dentro non si molla niente.");return}const costo=Math.max(1500,Math.round((Number(street().sporchi)||0)*.3)),disponibili=Math.max(0,Number(street().sporchi)||0)+Math.max(0,Number(G.money)||0),manca=Math.max(0,costo-disponibili);STRADA_SCENA={k:"Uscirne",titolo:"Molla il giro",testo:"Ti costa "+money(costo)+" € — il 30% dei soldi sporchi, e mai meno di 1.500 € — e la reputazione di strada cala. In cambio ti torna la testa per la musica.",opts:[{n:"Mollo",d:manca?"Ti mancano "+money(manca)+" €":"Chiudi i conti e sparisci dal giro",hot:true,no:manca>0,run(){const msg=stMollaIlGiro();if(typeof stradaPartecipazioneAttiva==="function"&&!stradaPartecipazioneAttiva()){STRADA_SCENA=null;setVisual(["street","danger"])}toast(msg)}},{n:"Lascia stare",d:"Resti dentro al giro",run(){STRADA_SCENA=null;}}]};sync();return}
    const tab=ev.target.closest("[data-tab]");if(tab){qa(".tab").forEach(x=>x.classList.toggle("on",x===tab));qa(".tabpane").forEach(x=>x.classList.remove("on"));q("#tab-"+tab.dataset.tab).classList.add("on");return}
    const city=ev.target.closest("[data-city]");if(city&&city.dataset.city!=="provincia"){toast(city.dataset.city==="milano"?"Milano si apre con la progressione prevista.":"Los Angeles si apre da GOAT.");return}
    if(ev.target.closest("#mapReturn")||ev.target.closest(".exit")){close();return}
    if(ev.target.closest("#closeCrimeModal")){STRADA_SCENA=null;sync();return}
  });
  root.addEventListener("click",ev=>{if(ev.target===q("#crimeModal")){/* decisioni alte/no-cancel restano protette dalla logica core; qui le scene crime normali possono chiudersi */}},false);

  /* Innesto narrativo e temporale sui metodi REALI: nessuna formula economica viene duplicata. */
  if(typeof stradaTenta==="function"&&!stradaTenta.__crimeUiWrapped){const old=stradaTenta;stradaTenta=function(colpoId,approccioId){const beforeArrest=!!street().arresto,beforeEnergy=Number(G.energy)||0,r=old.apply(this,arguments),started=(Number(G.energy)||0)<beforeEnergy;if(!started){sync();return r}const tags=["heist","street"];if(approccioId==="ferro")tags.push("gun");if(approccioId==="squadra")tags.push("crew");if(colpoId==="macchina")tags.push("car");if(colpoId==="scotta"||colpoId==="consegne")tags.push("deal","dirty");setVisual(tags,70000);const arrested=!beforeArrest&&!!street().arresto;triggerPhone(arrested?"high":"medium");sync();return r};stradaTenta.__crimeUiWrapped=true}

  renderStrada=sync; window.renderStrada=sync;
  /* Le scene del core (riciclaggio, attività, protezione, avvocato) chiamano
     renderStScheda/stToast: quando la V2 sostituisce il DOM devono puntare
     alla vista V2, non al markup legacy ormai rimosso. */
  if(typeof renderStScheda==="function"){renderStScheda=renderScene;window.renderStScheda=renderScene}
  if(typeof stToast==="function"){stToast=toast;window.stToast=toast}
  apriStrada=open; window.apriStrada=open;
  chiudiStrada=close; window.chiudiStrada=close;
  /* La main recente chiama uscitaStrada() da uscita.js. Il renderer legacy non può
     essere usato dopo che questo adapter ha sostituito il markup della schermata. */
  if(typeof uscitaStrada==="function"){
    uscitaStrada=function(){if(STRADA_SCENA){STRADA_SCENA=null;sync();return true}close();return true};
    window.uscitaStrada=uscitaStrada;
  }
  window.addEventListener("game-time:advanced",()=>{sync();syncJail()});
  window.addEventListener("game-time:day-start",()=>{sync();syncJail()});
  document.addEventListener("keydown",e=>{
    if(e.key!=="Escape")return;
    const jail=document.getElementById("adf-jail");
    if(jail&&jail.classList.contains("on")){
      /* Sul nuovo main ESC viene intercettato prima dal menu di sistema.
         Se arriva fin qui, non deve mai chiudere il carcere. */
      if(street().arresto)return;
      closeJail(true);return;
    }
    if(root.classList.contains("on")&&!STRADA_SCENA)close();
  });
  sync();
})();
