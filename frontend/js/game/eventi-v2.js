(function(){
"use strict";

/* ============================================================
   ANNI DI FAME — EVENTI V2 + LAFAMEGRAM v1.2.13 · REPO
   ------------------------------------------------------------
   - Catalogo: 1000 eventi v1.2
   - Catalogo: 1000 eventi (450 bassi / 350 medi / 200 alti)
   - 559 eventi possono generare conseguenze pubbliche su LaFamegram.
   - Integrazione repo: caricare questo file DOPO telefono.js.
   - Il catalogo JSON deve stare nella stessa cartella di questo script.
   ============================================================ */

const ADF_SCRIPT_BASE = new URL(".", document.currentScript.src);
const ADF_CATALOG_URL = new URL("eventi-master-1000-v1.2.13.json", ADF_SCRIPT_BASE).href;

const ADF = {
  ready:false,
  db:[],
  byId:new Map(),
  skipRunning:false,
  hookTimer:null,
  version:"1.2.13-repo",
  commit:"531edf193439eb2fd67812fc4f2377b6550b2f3e"
};
window.ADF_EVENTI = ADF;

/* Il vecchio EVENTS resta nel codice originale per compatibilità, ma la
   selezione casuale settimanale non deve più pescare da quel catalogo. */
try{ maybeEvent = function(){}; }catch(_){}

const RARITY = {comune:55, insolito:27, raro:12, epico:5};
const TIER_LABEL = {low:"BASSO", medium:"MEDIO", high:"ALTO"};

function absDay(){
  return (((G.year||1)-1)*52 + ((G.week||1)-1))*7 + (G.day||1);
}
function st(){
  if(!G.eventiV2 || typeof G.eventiV2 !== "object") G.eventiV2 = {};
  const s=G.eventiV2;
  if(!s.flags || typeof s.flags!=="object") s.flags={};
  if(!s.last || typeof s.last!=="object") s.last={};
  if(!s.familyLast || typeof s.familyLast!=="object") s.familyLast={};
  if(!s.seen || typeof s.seen!=="object") s.seen={};
  if(!Array.isArray(s.scheduled)) s.scheduled=[];
  if(typeof s.normalDays!=="number") s.normalDays=0;
  if(typeof s.nextNormalAt!=="number") s.nextNormalAt=2+Math.floor(Math.random()*2);
  if(typeof s.skip1Chain!=="number") s.skip1Chain=0;
  if(typeof s.lastHighDay!=="number") s.lastHighDay=-999;
  if(typeof s.nextHighDue!=="number") s.nextHighDue=absDay()+10+Math.floor(Math.random()*6);
  if(typeof s.lastEventDay!=="number") s.lastEventDay=-999;
  if(typeof s.lastHookEventDay!=="number") s.lastHookEventDay=-999;
  if(!s.runtime || typeof s.runtime!=="object") s.runtime={};
  if(!s.stats || typeof s.stats!=="object") s.stats={shown:0,auto:0,high:0,hook:0,normal:0};
  if(typeof s.stats.legacyStreet!=="number") s.stats.legacyStreet=0;
  if(typeof s.lastLegacyStreetDay!=="number") s.lastLegacyStreetDay=-999;

  /* v1.2.13 — Centro notifiche del telefono.
     Qui finiscono gli eventi auto-risolti dagli skip. */
  if(!Array.isArray(s.notifications)) s.notifications=[];
  if(typeof s.notificationSeq!=="number") s.notificationSeq=0;

  /* v1.2.13 — sistema "vita pubblica -> LaFamegram". */
  if(typeof s.runtime.socialPostSeq!=="number") s.runtime.socialPostSeq=0;
  if(!Array.isArray(s.runtime.socialRecentFormats)) s.runtime.socialRecentFormats=[];
  if(!Array.isArray(s.runtime.socialRecentPublishers)) s.runtime.socialRecentPublishers=[];
  if(!Array.isArray(s.runtime.socialRecentScenes)) s.runtime.socialRecentScenes=[];
  if(!Array.isArray(s.runtime.socialRecentTones)) s.runtime.socialRecentTones=[];
  if(!Array.isArray(s.runtime.socialRecentTopics)) s.runtime.socialRecentTopics=[];
  if(!Array.isArray(s.runtime.socialRecentAccounts)) s.runtime.socialRecentAccounts=[];
  if(!Array.isArray(s.runtime.socialRecentCaptions)) s.runtime.socialRecentCaptions=[];
  if(!Array.isArray(s.runtime.socialRecentCommentTexts)) s.runtime.socialRecentCommentTexts=[];
  if(!Array.isArray(s.runtime.socialRecentCommentAccounts)) s.runtime.socialRecentCommentAccounts=[];
  if(!Array.isArray(s.runtime.socialRecentPlayerReplies)) s.runtime.socialRecentPlayerReplies=[];
  if(!Array.isArray(s.runtime.socialInteractionHistory)) s.runtime.socialInteractionHistory=[];
  if(typeof s.runtime.socialInteractionSeq!=="number") s.runtime.socialInteractionSeq=0;
  if(!Array.isArray(G.lafamegramStorieMie)) G.lafamegramStorieMie=[];
  if(!Array.isArray(s.runtime.socialAlerts)) s.runtime.socialAlerts=[];
  if(!s.runtime.socialArcState || typeof s.runtime.socialArcState!=="object") s.runtime.socialArcState={};
  if(!Array.isArray(s.runtime.socialImpactHistory)) s.runtime.socialImpactHistory=[];
  if(typeof s.runtime.lastSkipInterruptedDay!=="number") s.runtime.lastSkipInterruptedDay=-999;
  if(typeof s.runtime.lastSkipInterruptedAfter!=="number") s.runtime.lastSkipInterruptedAfter=0;
  return s;
}
function flag(name){ return !!st().flags[name]; }
function setFlag(name,v){ st().flags[name]=v!==false; }

function highDue(){ return absDay() >= st().nextHighDue; }
function armHigh(){
  const s=st(), n=10+Math.floor(Math.random()*6);
  s.lastHighDay=absDay();
  s.nextHighDue=absDay()+n;
  return n;
}
function resetNormal(){
  const s=st();
  s.normalDays=0;
  s.nextNormalAt=2+Math.floor(Math.random()*2);
}
function overlayBusy(){
  try{
    if(typeof overlayAperto==="function" && overlayAperto()) return true;
  }catch(_){}
  const ids=["modal","report","writer","piazza","scena","posto","strada-crimine","negozio","adf-result-overlay","adf-social-overlay"];
  for(const id of ids){
    const el=document.getElementById(id);
    if(el && el.classList.contains("on")) return true;
  }
  const socialBanner=document.getElementById("adf-social-banner");
  if(socialBanner && socialBanner.classList.contains("show")) return true;
  return false;
}
function afterClear(fn, tries){
  tries=tries==null?80:tries;
  if(!overlayBusy()){ fn(); return; }
  if(tries<=0) return;
  setTimeout(()=>afterClear(fn,tries-1),160);
}

/* -------------------- stato / requisiti -------------------- */
function getPath(path){
  if(!path) return undefined;
  const bits=String(path).replace(/^G\./,"").split(".");
  let cur=G;
  for(const b of bits){
    if(cur==null) return undefined;
    cur=cur[b];
  }
  return cur;
}
function cmp(a,op,b){
  if(op===">=") return a>=b;
  if(op==="<=") return a<=b;
  if(op===">") return a>b;
  if(op==="<") return a<b;
  if(op==="==") return a===b;
  if(op==="!=") return a!==b;
  return false;
}
function released(){ return (G.songs||[]).filter(x=>x.released); }
function testReq(r){
  if(!r) return true;
  if(Array.isArray(r.any)) return r.any.some(testReq);
  if(r.path) return cmp(getPath(r.path),r.op,r.value);
  const t=r.test, v=("value" in r)?r.value:true;

  if(t==="event_flag") return (flag(r.flag) === (r.present!==false));
  if(t==="has_released_song") return released().length>0;
  if(t==="has_unreleased_song") return (G.songs||[]).some(x=>!x.released);
  if(t==="best_released_quality_at_least") return released().some(x=>(x.q||0)>=v);
  if(t==="has_released_quality_at_least") return released().some(x=>(x.q||0)>=v);
  if(t==="has_song_over_streams") return released().some(x=>(x.streams||0)>=v);
  if(t==="has_rival") return !!(G.rivals&&G.rivals.length);
  if(t==="has_manager") return !!G.manager;
  if(t==="no_manager") return !G.manager;
  if(t==="has_contract") return !!G.contract;
  if(t==="no_contract") return !G.contract;
  if(t==="no_major_contract") return !G.contract || G.contract.id!=="major";
  if(t==="contract_id_is") return !!G.contract && G.contract.id===v;
  if(t==="contract_masters_owned") return !!G.contract && !!G.contract.masters===!!v;
  if(t==="has_obligation") return !!G.obligation;
  if(t==="obligation_near_deadline") return !!G.obligation && G.obligation.left<=Number(r.weeks||v||10);
  if(t==="has_job") return !!G.job;
  if(t==="origin_provincia"){
    const art=window.ARTIST||{};
    return art.scene==="provincia";
  }
  if(t==="gear_owned_count_at_least") return Object.keys(G.gear||{}).filter(k=>G.gear[k]).length>=v;
  if(t==="clothes_owned_count_at_least") return Object.keys(G.vestiti||{}).filter(k=>G.vestiti[k]).length>=v;
  if(t==="crime_business_count_at_least") return Object.keys((G.strada&&G.strada.attivita)||{}).filter(k=>G.strada.attivita[k]).length>=v;
  if(t==="is_arrested") return !!(G.strada&&G.strada.arresto);
  if(t==="just_released_from_prison") return st().runtime.justReleasedDay===absDay();

  if(t==="posto_person_relation_at_least")
    return (G.gente||[]).some(p=>(!r.role||r.role==="*"||p.ruolo===r.role) && !p.via && (p.rel||0)>=v);
  if(t==="posto_any_relation_at_least")
    return (G.gente||[]).some(p=>!p.via && (p.rel||0)>=v);
  if(t==="has_posto_contact")
    return (G.gente||[]).some(p=>!p.via && !!p.numero);
  if(t==="posto_has_recent_conflict")
    return !!st().runtime.postoRecentConflict;
  if(t==="posto_conflict_with_relation_at_least")
    return !!st().runtime.postoRecentConflict && Number(st().runtime.postoConflictRel||0)>=v;

  if(t==="weekly_costs_gt_clean_income"){
    const c=typeof weeklyCosts==="function"?weeklyCosts():0;
    return c>Number(G._entratePulite||0);
  }
  if(t==="lafamegram_event_outperforms_own_post"){
    const a=(G.lafamegramEventi||[]).reduce((m,x)=>Math.max(m,x.like||0),0);
    const b=(G.lafamegramMiei||[]).reduce((m,x)=>Math.max(m,x.like||0),0);
    return a>b && a>0;
  }
  return false;
}
function requirementsOk(e){ return (e.requirements||[]).every(testReq); }

function cityOk(e){
  /* La repo attuale non ha ancora uno stato di città corrente. Gli eventi
     segnati future-only restano fuori dal pool. Tutto ciò che è già
     compatibile con la Provincia può girare. */
  if(e.city_runtime==="requires_future_city_state") return false;
  return !e.cities || e.cities.includes("provincia");
}
function phaseOk(e){
  const p=G.phase||0;
  return p>=(e.phase_min==null?0:e.phase_min) && p<=(e.phase_max==null?6:e.phase_max);
}
function cooldownOk(e){
  const s=st(), now=absDay();
  if(e.once && s.seen[e.id]) return false;
  if(typeof s.last[e.id]==="number" && now-s.last[e.id] < Number(e.cooldown_days||0)) return false;
  if(e.anti_repeat_group && typeof s.familyLast[e.anti_repeat_group]==="number" &&
     now-s.familyLast[e.anti_repeat_group] < Number(e.family_cooldown_days||0)) return false;
  return true;
}
function eligible(e, opts){
  opts=opts||{};
  if(!e || !cityOk(e) || !phaseOk(e) || !requirementsOk(e) || !cooldownOk(e)) return false;
  if(e.tier==="high" && !opts.ignoreHigh && !highDue()) return false;
  return true;
}

/* -------------------- pool / follow-up -------------------- */
function rarityPick(pool){
  if(!pool.length) return null;
  let total=pool.reduce((n,e)=>n+(RARITY[e.rarity]||8),0);
  let r=Math.random()*total;
  for(const e of pool){
    r-=RARITY[e.rarity]||8;
    if(r<=0) return e;
  }
  return pool[pool.length-1];
}
function scheduledDue(){
  const s=st(), now=absDay();
  const due=s.scheduled
    .filter(x=>x.due<=now)
    .sort((a,b)=>a.due-b.due);
  for(const x of due){
    const e=ADF.byId.get(x.id);
    if(e && eligible(e)){
      s.scheduled=s.scheduled.filter(y=>y!==x);
      return e;
    }
  }
  return null;
}
function ambientPool(tier){
  const allowed=new Set(["ambient","milestone","ambient_repo_event","event_actor_pick"]);
  return ADF.db.filter(e=>{
    const k=(e.trigger&&e.trigger.kind)||"ambient";
    return allowed.has(k) && (!tier || e.tier===tier) && eligible(e);
  });
}
function pickAmbient(context){
  const due=scheduledDue();
  if(due) return due;

  if(highDue()){
    const hp=ambientPool("high");
    if(hp.length) return rarityPick(hp);
  }
  let t;
  const r=Math.random();
  if(context==="skip7") t=r<.50?"low":"medium";
  else if(context==="skip1") t=r<.62?"low":"medium";
  else t=r<.64?"low":"medium";

  let p=ambientPool(t);
  if(!p.length) p=ambientPool(t==="low"?"medium":"low");
  return rarityPick(p);
}
function scheduleFollowups(e){
  const s=st(), now=absDay();
  for(const f of (e.followups||[])){
    if((f.requires_flags||[]).some(x=>!flag(x))) continue;
    if(Math.random()*100 > Number(f.chance==null?100:f.chance)) continue;
    const a=Number(f.min_days||1), b=Number(f.max_days||a);
    const due=now+a+Math.floor(Math.random()*(Math.max(0,b-a)+1));
    if(!s.scheduled.some(x=>x.id===f.event_id))
      s.scheduled.push({id:f.event_id,due:due,source:e.id});
  }
}
function scheduleDirect(id, minDays, maxDays, source){
  const s=st();
  if(s.scheduled.some(x=>x.id===id)) return;
  const a=Number(minDays||1), b=Number(maxDays||a);
  s.scheduled.push({id:id,due:absDay()+a+Math.floor(Math.random()*(Math.max(0,b-a)+1)),source:source||"hook"});
}

/* -------------------- effetti -------------------- */
function setTarget(path,value){
  const bits=String(path).replace(/^G\./,"").split(".");
  let cur=G;
  for(let i=0;i<bits.length-1;i++){
    if(!cur[bits[i]] || typeof cur[bits[i]]!=="object") cur[bits[i]]={};
    cur=cur[bits[i]];
  }
  cur[bits[bits.length-1]]=value;
}
function special(v){
  if(!v || typeof v!=="object") return;
  if(v.open_contract_offer){
    const id=v.open_contract_offer;
    G.offersSeen=G.offersSeen||{};
    G.offersSeen[id]=true;
    setTimeout(()=>{
      const tab=document.querySelector('.nb[data-t="contratti"]');
      if(tab) tab.click();
      const offer=document.querySelector('[data-sign="'+id+'"]');
      if(offer) offer.scrollIntoView({behavior:"smooth",block:"center"});
      if(typeof toast==="function") toast("Offerta contratto aperta: <b>"+id+"</b>.","","§",["#7C3AED","#4C1D95"]);
    },60);
  }
  if(v.set_G_manager) G.manager=true;
  if(v.set_job){
    const j=(typeof JOBS!=="undefined"?JOBS:[]).find(x=>x.id===v.set_job);
    if(j) G.job={id:j.id,n:j.n,pay:j.pay,e:j.e,missed:0};
  }
  if(v.life_casa_delta){
    G.life=G.life||{};
    G.life.casa=clamp((G.life.casa||0)+Number(v.life_casa_delta),0,4);
    try{ syncEnergy(); }catch(_){}
  }
  if(v.set_best_released_song_viral){
    const s=released().slice().sort((a,b)=>(b.streams||0)-(a.streams||0))[0];
    if(s) s.viral=Number(v.set_best_released_song_viral);
  }
  if(v.remove_random_gear){
    const ids=Object.keys(G.gear||{}).filter(k=>G.gear[k]);
    if(ids.length) delete G.gear[ids[Math.floor(Math.random()*ids.length)]];
  }
}
function applyOp(op){
  if(!op) return;
  if(op.op==="add"){
    let v=Number(getPath(op.target)||0)+Number(op.value||0);
    if(op.floor!=null) v=Math.max(Number(op.floor),v);
    if(Array.isArray(op.clamp)) v=clamp(v,Number(op.clamp[0]),Number(op.clamp[1]));
    setTarget(op.target,v);
  }else if(op.op==="add_lucidita"){
    addLuc(Number(op.value||0));
  }else if(op.op==="add_energy"){
    G.energy=clamp(Number(G.energy||0)+Number(op.value||0),0,Number(G.maxEnergy||100));
  }else if(op.op==="gain_skill"){
    gain(op.skill,Number(op.value||0));
  }else if(op.op==="set_event_flag"){
    setFlag(op.flag,op.value!==false);
  }else if(op.op==="add_beat"){
    const v=op.value||{};
    G.beats.push({n:v.name||"Beat evento",q:Math.round(Number(v.quality||50))});
  }else if(op.op==="special"){
    special(op.value);
  }
}
function pickOutcome(choice){
  const arr=choice.outcomes||[];
  if(!arr.length) return {effects:{},result:""};
  let total=arr.reduce((n,o)=>n+Number(o.weight||100),0), r=Math.random()*total;
  for(const o of arr){ r-=Number(o.weight||100); if(r<=0) return o; }
  return arr[arr.length-1];
}
function clsFor(out){
  const e=out.effects||{};
  let score=0;
  for(const k of ["fans","hype","money","wellbeing","lucidita","network","scrittura","flow","presenza"])
    score += Number(e[k]||0);
  return score>1?"good":score<-1?"bad":"";
}
function mark(e, auto){
  const s=st(), now=absDay();
  s.last[e.id]=now;
  if(e.anti_repeat_group) s.familyLast[e.anti_repeat_group]=now;
  if(e.once) s.seen[e.id]=true;
  s.lastEventDay=now;
  if(auto) s.stats.auto++; else s.stats.shown++;
  if(e.tier==="high"){ s.stats.high++; armHigh(); }
  resetNormal();
}
function execute(e, choice, auto){
  const out=pickOutcome(choice);
  for(const op of (out.ops||[])) applyOp(op);
  /* Compatibilità con cataloghi dove `special` non è già presente nelle ops. */
  if(out.special && !(out.ops||[]).some(op=>op.op==="special")) special(out.special);
  mark(e,auto);
  scheduleFollowups(e);
  return {
    t:out.result||e.title,
    c:clsFor(out),
    outcome:out,
    choice:choice
  };
}

/* ==================== NOTIFICHE SKIP · TELEFONO ==================== */
function adfEsc(v){
  return String(v==null?"":v)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function adfNotifStore(){ return st().notifications; }
function adfNotifUnread(){ return adfNotifStore().filter(n=>!n.read).length; }
function adfNotifFamily(e){
  return String((e&&e.family)||"evento").replace(/_/g," ").replace(/\b\w/g,m=>m.toUpperCase());
}
function adfNotifWhen(){
  return {
    absDay:absDay(),
    year:G.year||1,
    week:G.week||1,
    day:G.day||1
  };
}
function adfNotifEffects(out){
  const eff=(out&&out.effects)||{};
  const labels={
    fans:"fan",hype:"hype",money:"€",wellbeing:"benessere",lucidita:"lucidità",
    energy:"energia",network:"network",scrittura:"scrittura",flow:"flow",
    presenza:"presenza",rep:"reputazione",heat:"attenzione",sporchi:"soldi sporchi"
  };
  const arr=[];
  for(const [k,v] of Object.entries(eff)){
    if(v==null || typeof v==="object") continue;
    let txt="";
    const n=Number(v);
    const sign=Number.isFinite(n)&&n>0?"+":"";
    if(k==="money") txt=sign+Math.round(n)+" €";
    else txt=(labels[k]||k)+" "+sign+(Number.isFinite(n)?Math.round(n*10)/10:v);
    arr.push({k:k,text:txt,positive:Number.isFinite(n)?n>0:false,negative:Number.isFinite(n)?n<0:false});
  }
  return arr;
}
function adfAddSkipNotification(e, result, opts){
  opts=opts||{};
  const s=st(), when=adfNotifWhen();
  const out=(result&&result.outcome)||{};
  const choice=(result&&result.choice)||{};
  const n={
    nid:"N"+(++s.notificationSeq),
    eventId:e.id,
    tier:e.tier,
    title:e.title,
    family:adfNotifFamily(e),
    description:e.description||"",
    choice:choice.label||"",
    result:(result&&result.t)||out.result||e.title,
    effects:adfNotifEffects(out),
    year:when.year,week:when.week,day:when.day,absDay:when.absDay,
    source:"skip-only",
    deliverySuppressed:true,
    interrupted:!!opts.interrupted,
    read:!!opts.read
  };
  s.notifications.unshift(n);
  if(s.notifications.length>250) s.notifications.length=250;
  return n;
}
function adfMarkNotificationsRead(){
  let changed=false;
  for(const n of adfNotifStore()){
    if(!n.read){ n.read=true; changed=true; }
  }
  if(changed) save();
}
function adfNotificationBadgeRefresh(){
  /* Se siamo sulla home del telefono il badge viene ricalcolato da HUB_APP.
     Evitiamo di ridisegnare l'intero hub durante uno skip. */
  const b=document.querySelector('[data-app="notifiche"] .tbadge');
  const count=adfNotifUnread();
  if(b){
    if(count){ b.textContent=count>99?"99+":count; b.style.display="flex"; }
    else b.remove();
  }
}
function adfNotifTierLabel(t){ return t==="high"?"ALTO":t==="medium"?"MEDIO":"BASSO"; }
function adfNotifCard(n){
  const effects=(n.effects||[]).map(x=>
    '<span class="adf-neff '+(x.positive?"pos":x.negative?"neg":"")+'">'+adfEsc(x.text)+'</span>'
  ).join("");
  return '<article class="adf-ncard '+(!n.read?"unread":"")+' tier-'+adfEsc(n.tier)+'">'+
    '<div class="adf-nmeta">'+
      '<span class="adf-ntier">'+adfNotifTierLabel(n.tier)+'</span>'+
      '<span>A'+n.year+' · S'+n.week+' · G'+n.day+'</span>'+
      (n.interrupted?'<span class="adf-ninterrupted">decisione</span>':'')+
    '</div>'+
    '<h4>'+adfEsc(n.title)+'</h4>'+
    '<div class="adf-nfamily">'+adfEsc(n.family)+'</div>'+
    (n.choice?'<p class="adf-nchoice"><b>Scelta:</b> '+adfEsc(n.choice)+'</p>':'')+
    '<p class="adf-nresult">'+adfEsc(n.result)+'</p>'+
    (effects?'<div class="adf-neffects">'+effects+'</div>':'')+
  '</article>';
}
function adfOpenNotifications(){
  const el=document.getElementById("hb-tel");
  if(!el) return;
  try{ TEL_APP="notifiche"; }catch(_){}
  el.className="ptelscr";

  const list=adfNotifStore();
  const unread=adfNotifUnread();
  el.innerHTML=
    '<div class="tscreen adf-notif-screen">'+
      '<div class="tscreenhead">'+
        '<button class="tback" type="button" data-adf-notif-back="1" aria-label="Indietro"></button>'+
        '<b>Notifiche</b>'+
      '</div>'+
      '<div class="adf-ntool">'+
        '<div><strong>'+list.length+'</strong> eventi dagli skip'+
          (unread?' · <span>'+unread+' nuovi</span>':'')+
        '</div>'+
        (unread?'<button type="button" data-adf-notif-read="1">Segna lette</button>':'')+
      '</div>'+
      '<div class="tscreenbody adf-nbody">'+
        (list.length
          ? '<div class="adf-nlist">'+list.map(adfNotifCard).join("")+'</div>'
          : '<div class="tempty"><b>Nessuna notifica.</b><br>Gli eventi BASSI e MEDI risolti automaticamente con +1/+7 compariranno qui.</div>')+
      '</div>'+
      '<button class="tgest" type="button" data-adf-notif-back="1" aria-label="Home"></button>'+
    '</div>';

  /* L'utente le ha effettivamente viste: puliamo il badge poco dopo,
     ma lasciamo il bordo "nuovo" visibile nella schermata corrente. */
  if(unread) setTimeout(()=>{
    adfMarkNotificationsRead();
    adfNotificationBadgeRefresh();
  },250);
}
function adfCloseNotifications(){
  try{ TEL_APP=null; }catch(_){}
  if(typeof renderTelefono==="function") renderTelefono();
}
function adfInstallNotificationApp(){
  try{
    if(typeof HIC!=="undefined" && !HIC.campana){
      HIC.campana='<path d="M12 2a4 4 0 0 0-4 4v1.1c0 1.1-.36 2.17-1.03 3.04L5.4 12.2A2.5 2.5 0 0 0 7.38 16h9.24a2.5 2.5 0 0 0 1.98-3.8l-1.57-2.06A5 5 0 0 1 16 7.1V6a4 4 0 0 0-4-4zm0 20a3 3 0 0 0 2.82-2H9.18A3 3 0 0 0 12 22z"/>';
    }
    if(typeof HUB_APP!=="undefined" && Array.isArray(HUB_APP) && !HUB_APP.some(a=>a.id==="notifiche")){
      HUB_APP.splice(1,0,{
        id:"notifiche",n:"Notifiche",ic:"campana",k:"#F59E0B",
        badge:()=>adfNotifUnread()
      });
    }
    if(typeof HUB_APP_VECCHIO!=="undefined" && Array.isArray(HUB_APP_VECCHIO) &&
       !HUB_APP_VECCHIO.some(a=>a.id==="notifiche")){
      HUB_APP_VECCHIO.splice(1,0,{
        id:"notifiche",n:"Notifiche",ic:"campana",k:"#F59E0B",
        sotto:()=>adfNotifUnread()?(adfNotifUnread()+" nuove"):(adfNotifStore().length+" archiviate"),
        vai:()=>adfOpenNotifications()
      });
    }
  }catch(err){
    console.warn("[ADF v1.2.13] impossibile registrare app Notifiche",err);
  }
}

/* Intercettiamo l'app prima del gestore originale del telefono: `notifiche`
   non esiste nella repo e la renderizziamo interamente qui. */
document.addEventListener("click",ev=>{
  const app=ev.target.closest&&ev.target.closest('[data-app="notifiche"]');
  if(app){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    adfOpenNotifications();return;
  }
  const back=ev.target.closest&&ev.target.closest("[data-adf-notif-back]");
  if(back){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    adfCloseNotifications();return;
  }
  const read=ev.target.closest&&ev.target.closest("[data-adf-notif-read]");
  if(read){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    adfMarkNotificationsRead();
    adfOpenNotifications();return;
  }
},true);


/* ==================== POPUP ESITO DELLA DECISIONE ==================== */
let ADF_RESULT_CONTINUE=null;

const ADF_GENERIC_RESULTS=new Set([
  "La scelta si riflette subito sul resto della giornata.",
  "Il compromesso tiene insieme il presente, ma lascia una conseguenza.",
  "Hai protetto una cosa rinunciando a un'altra.",
  "Hai scelto di entrarci davvero e la situazione lascia un effetto visibile.",
  "La soluzione intermedia regge, almeno per adesso.",
  "Hai spinto sul momento invece di proteggerlo.",
  "Il compromesso evita gli estremi e lascia aperta una seconda mossa.",
  "La storia si chiude senza esplodere e torni a concentrarti sul resto.",
  "Hai deciso che non valeva il prezzo richiesto.",
  "Hai protetto tempo, testa o controllo, rinunciando a una parte dell'occasione."
]);

function adfOutcomeNarrative(e,choice,out){
  const result=String((out&&out.result)||"").trim();
  if(result && !ADF_GENERIC_RESULTS.has(result)) return result;

  const desc=String((e&&e.description)||"").trim().replace(/\s+/g," ").replace(/[.!?]+$/,"");
  const label=String((choice&&choice.label)||"").trim();
  const eff=(out&&out.effects)||{};
  let pos=0,neg=0;
  for(const v of Object.values(eff)){
    if(typeof v!=="number") continue;
    if(v>0) pos++;
    if(v<0) neg++;
  }

  let ending="";
  if(pos&&neg) ending="La decisione ti porta un vantaggio, ma lascia anche un costo concreto.";
  else if(pos) ending="La scelta gira a tuo favore e ti lascia un vantaggio concreto.";
  else if(neg) ending="La situazione si chiude, ma la decisione ti lascia una conseguenza concreta.";
  else if((e.followups||[]).length || (out.set_flags||[]).length)
    ending="Per ora cambia poco in superficie, ma questa scelta resta nella tua storia e può tornare più avanti.";
  else ending="La situazione si chiude senza grandi variazioni immediate, ma la decisione resta parte della tua storia.";

  return (desc?desc+". ":"")+(label?'Hai scelto «'+label+'». ':"")+ending;
}

function adfResultPopup(e,choice,result,onContinue){
  const out=(result&&result.outcome)||{};
  const effects=adfNotifEffects(out);
  const narrative=adfOutcomeNarrative(e,choice,out);
  const hasFollowup=!!((e.followups||[]).length || (out.set_flags||[]).length ||
    (out.relations&&Object.keys(out.relations).length));

  let ov=document.getElementById("adf-result-overlay");
  if(!ov){
    ov=document.createElement("div");
    ov.id="adf-result-overlay";
    document.body.appendChild(ov);
  }

  const chips=effects.map(x=>
    '<span class="adf-rchip '+(x.positive?"pos":x.negative?"neg":"")+'">'+adfEsc(x.text)+'</span>'
  ).join("");

  ov.innerHTML=
    '<div class="adf-rbackdrop"></div>'+
    '<section class="adf-rcard tier-'+adfEsc(e.tier)+'" role="dialog" aria-modal="true">'+
      '<div class="adf-rhead"><span class="adf-rkicker">COSA È SUCCESSO</span>'+
        '<span class="adf-rtier">'+adfNotifTierLabel(e.tier)+'</span></div>'+
      '<h2>'+adfEsc(e.title)+'</h2>'+
      '<div class="adf-rchoice"><span>Hai scelto</span><strong>'+adfEsc(choice.label||"")+'</strong></div>'+
      '<p class="adf-rstory">'+adfEsc(narrative)+'</p>'+
      '<div class="adf-rsection"><span class="adf-rlabel">CONSEGUENZE</span>'+
        (chips?'<div class="adf-rchips">'+chips+'</div>':
          '<p class="adf-rneutral">Nessuna variazione immediata delle statistiche.</p>')+
      '</div>'+
      (hasFollowup?'<div class="adf-rfuture"><b>Questa scelta può tornare più avanti.</b>'+
        '<span>Il gioco terrà memoria della decisione.</span></div>':'')+
      '<button id="adf-result-continue" type="button">CONTINUA</button>'+
    '</section>';

  ov.classList.add("on");
  ADF_RESULT_CONTINUE=typeof onContinue==="function"?onContinue:null;
  setTimeout(()=>{ const b=document.getElementById("adf-result-continue"); if(b)b.focus(); },30);
}

function adfCloseResultPopup(){
  const ov=document.getElementById("adf-result-overlay");
  if(ov) ov.classList.remove("on");
  const cb=ADF_RESULT_CONTINUE;
  ADF_RESULT_CONTINUE=null;
  try{ save(); if(typeof renderGioco==="function") renderGioco(); if(typeof renderHub==="function") renderHub(); }catch(_){}
  if(cb) setTimeout(cb,0);
}

document.addEventListener("click",ev=>{
  if(ev.target.closest&&ev.target.closest("#adf-result-continue")){
    ev.preventDefault();ev.stopPropagation();
    adfCloseResultPopup();
  }
},true);
document.addEventListener("keydown",ev=>{
  const ov=document.getElementById("adf-result-overlay");
  if(ev.key==="Escape"&&ov&&ov.classList.contains("on")){
    ev.preventDefault();adfCloseResultPopup();
  }
},true);


/* ==================== LAFAMEGRAM · FOTO EVENTO (DEMO) ====================
   Questa build NON usa il renderer avatar attuale: il protagonista è una
   sagoma-placeholder. Quando il nuovo character creator sarà definitivo,
   basterà sostituire adfSocialPlayerMarkup() con il nuovo renderer.
*/
const ADF_SOCIAL_AUTHORS = {
  fan:["@matti.wav","@aleinthepit","@fra.02","@noemi.mp4","@rickysottozero"],
  rap:["@sottosuono","@rapstreet.it","@fuoriscena","@miccheck.daily"],
  gossip:["@dietroilbackstage","@occhi_sulla_scena","@girostretto"]
};

function adfSocialPlayerMarkup(kind){
  const name=((window.ARTIST||{}).name||"TU").trim()||"TU";
  return '<div class="adf-photo-person player '+(kind||"")+'">'+
    '<span class="adf-photo-head"></span><span class="adf-photo-body"></span>'+
    '<i>'+adfEsc(name)+'</i></div>';
}
function adfSocialOtherMarkup(cls,label){
  return '<div class="adf-photo-person '+cls+'"><span class="adf-photo-head"></span>'+
    '<span class="adf-photo-body"></span><i>'+adfEsc(label||"")+'</i></div>';
}
function adfSocialMediaHTML(media){
  if(!media) return "";
  const scene=media.scene||"generic";
  const format=media.format||"photo";
  if(format==="text") return "";

  if(format==="ranking"){
    return '<div class="adf-post-media adf-generic-media ranking"><span class="adf-generic-big">#</span>'+
      '<b>CLASSIFICA</b><i>aggiornamento posizione</i><span class="adf-media-tag">CARD CLASSIFICA</span></div>';
  }
  if(format==="article"){
    return '<div class="adf-post-media adf-generic-media article"><span class="adf-generic-lines"></span>'+
      '<b>NOTIZIA / ARTICOLO</b><i>anteprima della testata</i><span class="adf-media-tag">ARTICOLO</span></div>';
  }
  if(format==="meme"){
    return '<div class="adf-post-media adf-generic-media meme">'+adfSocialPlayerMarkup("meme")+
      '<b>MEME</b><i>contenuto creato dagli utenti</i><span class="adf-media-tag">MEME</span>'+
      '<span class="adf-avatar-placeholder">avatar definitivo → qui</span></div>';
  }
  if(format==="screenshot"){
    return '<div class="adf-post-media adf-generic-media screenshot"><span class="adf-screenbar"></span>'+
      '<span class="adf-screenlines"></span><b>SCREENSHOT</b><span class="adf-media-tag">SCREENSHOT</span></div>';
  }

  if(scene==="fan_selfie"){
    return '<div class="adf-post-media selfie"><div class="adf-photo-city"><b></b><b></b><b></b><b></b></div>'+
      '<div class="adf-photo-flash"></div><div class="adf-photo-pair">'+
      adfSocialOtherMarkup("fan","FAN")+adfSocialPlayerMarkup("selfie")+'</div>'+
      '<span class="adf-media-tag">'+(format==="story"?"STORY":"FOTO DAL TELEFONO")+'</span>'+
      '<span class="adf-avatar-placeholder">avatar definitivo → qui</span></div>';
  }

  if(scene==="rival_fight"){
    return '<div class="adf-post-media fight"><div class="adf-fight-lights"></div>'+
      '<div class="adf-fight-crowd"></div><div class="adf-fight-figures">'+
      adfSocialPlayerMarkup("fight-left")+adfSocialOtherMarkup("rival fight-right","RIVALE")+'</div>'+
      '<div class="adf-motion m1"></div><div class="adf-motion m2"></div>'+
      '<span class="adf-rec">● REC</span><span class="adf-media-tag">FRAME DA VIDEO</span>'+
      '<span class="adf-avatar-placeholder">avatar definitivo → qui</span></div>';
  }

  if(scene==="freestyle_clip"||scene==="piazza_crowd"){
    return '<div class="adf-post-media freestyle"><div class="adf-stage-light one"></div>'+
      '<div class="adf-stage-light two"></div><div class="adf-stage-crowd"></div>'+
      '<div class="adf-freestyle-player">'+adfSocialPlayerMarkup("mic")+
      '<span class="adf-mic-stick"></span></div><span class="adf-video-time">0:17</span>'+
      '<span class="adf-media-tag">CLIP VERTICALE</span>'+
      '<span class="adf-avatar-placeholder">avatar definitivo → qui</span></div>';
  }

  const formatLabel={photo:"FOTO",story:"STORY",carousel:"CAROSELLO",reel:"REEL",repost:"REPOST"}[format]||String(format).toUpperCase();
  return '<div class="adf-post-media adf-generic-media generic '+adfEsc(format)+'">'+
    '<div class="adf-generic-bg"></div>'+adfSocialPlayerMarkup("generic")+
    '<b>'+adfEsc(scene.replace(/_/g," ").toUpperCase())+'</b>'+
    '<i>scena placeholder · verrà collegata al nuovo avatar</i>'+
    '<span class="adf-media-tag">'+adfEsc(formatLabel)+'</span>'+
    '<span class="adf-avatar-placeholder">avatar definitivo → qui</span></div>';
}


const ADF_SOCIAL_COMMENT_ACCOUNTS=[
  "@matti.wav","@noemi.mp4","@simo.wav","@bea.mp4","@luca.sottopalco",
  "@vale.808","@nicozero","@marti.wav","@fede.mp4","@gio.south",
  "@quartiere.rap","@sottosuono","@fuoriscena","@streettakes",
  "@aleinthepit","@rickysottozero","@barsitalia","@loopculture"
];

const ADF_SOCIAL_COMMENT_TEXTS={
  positive:[
    "W enorme.","Questo è il modo giusto di muoversi.","Sta crescendo davvero.",
    "Finalmente qualcuno che non se la tira.","Questa cosa mi ha fatto rivalutare tutto.",
    "Continua così 🔥","Io lo dico da mesi.","Meritato.","Qua c'è fame vera.",
    "La gente se ne sta accorgendo finalmente."
  ],
  neutral:[
    "Vediamo come va a finire.","Manca un pezzo della storia secondo me.",
    "Aspetterei prima di giudicare.","Ok però voglio vedere il seguito.",
    "Dipende da cosa è successo prima.","Non ho ancora capito chi ha ragione.",
    "Questa può girare in due modi.","Internet sta correndo troppo."
  ],
  negative:[
    "Questa non è una bella figura.","Sta gestendo malissimo la situazione.",
    "Troppo ego per niente.","Qua qualcuno dovrebbe staccare il telefono.",
    "Ogni volta la stessa storia.","Non mi convince per niente.",
    "Il problema è come risponde, non il post.","Questa gli torna indietro.",
    "Sta alimentando una cosa inutile.","Così perde gente per strada."
  ],
  defender:[
    "State vedendo dieci secondi e avete già deciso tutto.",
    "Ma avete il contesto o state parlando a caso?",
    "La clip non racconta tutta la storia.","Internet processa la gente in trenta secondi.",
    "Almeno aspettate la sua versione."
  ],
  beef:[
    "Tenetela sui pezzi, non fuori.","Se risponde adesso esplode tutto.",
    "Questo beef sta diventando più grosso della musica.",
    "La risposta del rivale arriverà sicuro.","Qui domani c'è un'altra clip."
  ],
  fan:[
    "Io al suo posto sarei svenuto 😭","La foto è venuta malissimo ma vale oro 😂",
    "Questo tipo di cose conta più di cento post promozionali."
  ],
  press:[
    "Titolo molto più pesante del contenuto.","L'articolo completo dice un'altra cosa.",
    "Finalmente un'intervista con domande vere.","Qua il virgolettato cambia tutto."
  ],
  ranking:[
    "La classifica si sta muovendo parecchio.","Manca pochissimo al prossimo gradino.",
    "I numeri stavolta parlano chiaro."
  ]
};

let ADF_SOCIAL_THREAD_OPEN=null;
let ADF_SOCIAL_REPLY_OPEN=null;
let ADF_SOCIAL_STORY_OPEN=null;

function adfFindSocialPost(sid){
  if(!sid) return null;
  const all=[].concat(G.lafamegramEventi||[],G.lafamegramMiei||[],G.lafamegramStorieMie||[]);
  return all.find(p=>p&&p.sid===sid)||null;
}

function adfSocialArtistName(){
  return (((window.ARTIST||{}).name||"Tu").trim()||"Tu");
}

function adfSocialEnsureActions(p){
  if(!p.playerActions||typeof p.playerActions!=="object"){
    p.playerActions={liked:false,reposted:false,story:false,reply:null};
  }
  return p.playerActions;
}

function adfSocialCommentPool(p,kind){
  const topic=(p.socialMeta&&p.socialMeta.topic)||"career";
  const out=[];
  if(ADF_SOCIAL_COMMENT_TEXTS[kind]) out.push(...ADF_SOCIAL_COMMENT_TEXTS[kind]);
  if(ADF_SOCIAL_COMMENT_TEXTS[topic]) out.push(...ADF_SOCIAL_COMMENT_TEXTS[topic]);
  return out.length?out:ADF_SOCIAL_COMMENT_TEXTS.neutral;
}

function adfSocialBuildThread(p){
  if(Array.isArray(p.threadSample)) return p.threadSample;
  const s=st();
  const mood=(p.socialMeta&&p.socialMeta.mood)||"neutral";
  let kinds;

  if(mood==="positive") kinds=["positive","positive","neutral","positive","negative"];
  else if(mood==="negative") kinds=["negative","negative","defender","neutral","negative"];
  else kinds=["neutral","positive","neutral","negative","defender"];

  p.threadSample=kinds.map((kind,i)=>{
    const account=adfSocialPick(
      ADF_SOCIAL_COMMENT_ACCOUNTS,
      s.runtime.socialRecentCommentAccounts,12
    );
    const text=adfSocialPick(
      adfSocialCommentPool(p,kind),
      s.runtime.socialRecentCommentTexts,18
    );
    return {id:p.sid+"-c"+i,n:account,t:text,kind:kind,me:false};
  });
  return p.threadSample;
}

function adfSocialInteractionLog(p,action,fx,pressureDelta){
  const s=st();
  s.runtime.socialInteractionHistory.unshift({
    id:"SI"+(++s.runtime.socialInteractionSeq),
    day:absDay(),sid:p.sid,eventId:p.eventId||null,
    arcId:(p.socialMeta&&p.socialMeta.arcId)||null,
    action:action,effects:Object.assign({},fx||{}),
    pressureDelta:Number((pressureDelta||0).toFixed(2))
  });
  if(s.runtime.socialInteractionHistory.length>100)
    s.runtime.socialInteractionHistory.length=100;
}

function adfSocialArcForPost(p){
  const id=p&&p.socialMeta&&p.socialMeta.arcId;
  if(!id) return null;
  const s=st();
  if(!s.runtime.socialArcState[id]){
    s.runtime.socialArcState[id]={
      posts:0,pressure:0,negativeStreak:0,positiveStreak:0,
      lastMood:null,lastStage:0,lastDay:absDay()
    };
  }
  return s.runtime.socialArcState[id];
}

function adfSocialApplyInteraction(p,action,fx,pressureDelta){
  fx=fx||{};
  const safe={
    fans:adfSocialClamp(Number(fx.fans||0),-3,3),
    hype:adfSocialClamp(Number(fx.hype||0),-1,1),
    wellbeing:adfSocialClamp(Number(fx.wellbeing||0),-1,1),
    lucidita:adfSocialClamp(Number(fx.lucidita||0),-1,1)
  };
  Object.keys(safe).forEach(k=>{ if(!safe[k]) delete safe[k]; });
  adfApplySocialEffects(safe);

  const arc=adfSocialArcForPost(p);
  if(arc && pressureDelta){
    arc.pressure=adfSocialClamp((arc.pressure||0)+pressureDelta,0,5);
    arc.lastPlayerResponse=action;
    arc.lastPlayerResponseDay=absDay();
  }

  adfSocialInteractionLog(p,action,safe,pressureDelta||0);
  return safe;
}

function adfSocialInteractionText(fx){
  const t=adfSocialEffectsText(fx||{});
  return t==="nessuna variazione immediata" ? "nessun effetto immediato" : t;
}

function adfSocialReplyOptions(p){
  const sm=p.socialMeta||{};
  const topic=sm.topic||"career";
  const mood=sm.mood||"neutral";

  if(topic==="beef"||topic==="scandal"||topic==="gossip"){
    return [
      {id:"clarify",label:"Chiarisci",style:"calm"},
      {id:"irony",label:"Ironizza",style:"mid"},
      {id:"attack",label:"Rispondi duro",style:"hot"}
    ];
  }

  if(topic==="press"||topic==="brand"){
    return [
      {id:"professional",label:"Rispondi professionale",style:"calm"},
      {id:"context",label:"Contestualizza",style:"mid"},
      {id:"challenge",label:"Contesta",style:"hot"}
    ];
  }

  if(mood==="positive"||topic==="fan"||topic==="live"||topic==="ranking"||topic==="collab"){
    return [
      {id:"thanks",label:"Ringrazia",style:"calm"},
      {id:"joke",label:"Fai una battuta",style:"mid"},
      {id:"silence",label:"Lascia parlare il post",style:"quiet"}
    ];
  }

  return [
    {id:"clarify",label:"Chiarisci",style:"calm"},
    {id:"joke",label:"Sdrammatizza",style:"mid"},
    {id:"silence",label:"Non rispondere",style:"quiet"}
  ];
}

function adfSocialPlayerReplyText(p,id){
  const s=st();
  const pools={
    clarify:[
      "Non è andata come la state raccontando. Il contesto conta.",
      "Capisco la clip, ma manca metà della storia.",
      "Prima di decidere come è andata, guardate tutto."
    ],
    irony:[
      "Internet è più veloce dei fatti 😂",
      "Vedo che avete già scritto pure il finale.",
      "Dieci secondi di video e siamo già al processo 💀"
    ],
    attack:[
      "Se avete qualcosa da dire, ditela senza inventare.",
      "Parlate meno e mettete i fatti sul tavolo.",
      "Continuate pure a parlare. Io so come è andata."
    ],
    professional:[
      "Grazie per lo spazio. Preferisco che parlino i fatti e il lavoro.",
      "Apprezzo il confronto. Il resto lo chiariremo nei posti giusti.",
      "Grazie dell'attenzione. Testa al prossimo passo."
    ],
    context:[
      "Una frase senza il resto dell'intervista cambia completamente il senso.",
      "Leggete tutto prima del titolo.",
      "Il passaggio completo è molto meno semplice di così."
    ],
    challenge:[
      "Se volete raccontarla, almeno raccontatela bene.",
      "Il titolo fa più rumore della storia vera.",
      "Questa ricostruzione non mi rappresenta."
    ],
    thanks:[
      "Grazie davvero ❤️",
      "Queste cose mi fanno ancora strano. Grazie.",
      "Rispetto a chi c'è da prima del rumore 🤝"
    ],
    joke:[
      "Il telefono poteva almeno mettermi a fuoco 😂",
      "Va bene tutto, ma scegliete una foto migliore 💀",
      "Ok questa me la salvo 😂"
    ],
    silence:[
      "—"
    ]
  };
  return adfSocialPick(
    pools[id]||pools.clarify,
    s.runtime.socialRecentPlayerReplies,10
  );
}

function adfSocialReplyEffect(p,id){
  const sm=p.socialMeta||{};
  const mood=sm.mood||"neutral";

  if(id==="clarify")
    return {fx:mood==="negative"?{fans:1,wellbeing:1}:{fans:1},pressure:-.65};
  if(id==="irony")
    return {fx:{hype:1},pressure:.12};
  if(id==="attack")
    return {fx:{hype:1,wellbeing:-1},pressure:.80};

  if(id==="professional")
    return {fx:{fans:1},pressure:-.50};
  if(id==="context")
    return {fx:{fans:1},pressure:-.30};
  if(id==="challenge")
    return {fx:{hype:1},pressure:.45};

  if(id==="thanks")
    return {fx:{fans:2,wellbeing:1},pressure:-.30};
  if(id==="joke")
    return {fx:{fans:1,hype:1},pressure:.08};

  return {fx:{},pressure:-.05};
}

function adfSocialReactionAfterReply(p,id){
  const pools={
    clarify:["Almeno ha risposto senza fare casino.","Ok, così ha più senso.","Questa era la parte che mancava."],
    irony:["😂😂😂","Ok questa risposta è forte.","Ha scelto di riderci sopra, ci sta."],
    attack:["Ecco, adesso il beef riparte.","Questa risposta non chiude proprio niente.","Domani qualcuno risponde sicuro."],
    professional:["Risposta pulita.","Così si gestisce.","Zero benzina sul fuoco."],
    context:["Finalmente il contesto completo.","Il titolo aveva spinto troppo.","Questa precisazione serviva."],
    challenge:["Adesso però la testata risponderà.","Qua si apre un altro giro.","Non finisce qui."],
    thanks:["W.","Questo è il rapporto coi fan che conta.","Grande."],
    joke:["😂","Almeno sa ridere di sé.","Ok mi ha fatto ridere."],
    silence:[""]
  };
  const arr=pools[id]||pools.clarify;
  const t=arr[Math.floor(Math.random()*arr.length)];
  if(!t) return null;
  const s=st();
  const n=adfSocialPick(ADF_SOCIAL_COMMENT_ACCOUNTS,s.runtime.socialRecentCommentAccounts,12);
  return {id:p.sid+"-r"+Date.now(),n:n,t:t,kind:id==="attack"||id==="challenge"?"negative":"neutral",me:false};
}

function adfSocialReply(p,id){
  if(!p||p.mia) return false;
  const actions=adfSocialEnsureActions(p);
  if(actions.reply) return false;

  const opt=adfSocialReplyOptions(p).find(x=>x.id===id);
  if(!opt) return false;

  const text=adfSocialPlayerReplyText(p,id);
  const effect=adfSocialReplyEffect(p,id);
  const fx=adfSocialApplyInteraction(p,"reply:"+id,effect.fx,effect.pressure);

  const thread=adfSocialBuildThread(p);
  if(text!=="—"){
    thread.push({
      id:p.sid+"-me",
      n:adfSocialArtistName(),
      t:text,kind:"player",me:true
    });
  }

  const reaction=adfSocialReactionAfterReply(p,id);
  if(reaction) thread.push(reaction);

  actions.reply={
    id:id,label:opt.label,text:text,
    effects:fx,pressureDelta:effect.pressure,day:absDay()
  };
  p.lastInteractionEffect=adfSocialInteractionText(fx);
  ADF_SOCIAL_REPLY_OPEN=null;
  ADF_SOCIAL_THREAD_OPEN=p.sid;
  save();
  renderTelefono();
  return true;
}

function adfSocialToggleLike(p){
  if(!p) return;
  const a=adfSocialEnsureActions(p);
  a.liked=!a.liked;
  p.like=Math.max(0,Number(p.like||0)+(a.liked?1:-1));
  adfSocialInteractionLog(p,a.liked?"like":"unlike",{},0);
  save(); renderTelefono();
}

function adfSocialRepost(p){
  if(!p||p.mia) return false;
  const a=adfSocialEnsureActions(p);
  if(a.reposted) return false;

  const mood=(p.socialMeta&&p.socialMeta.mood)||"neutral";
  let effect={fx:{hype:1},pressure:0};
  if(mood==="positive") effect={fx:{fans:2,hype:1},pressure:-.08};
  else if(mood==="negative") effect={fx:{hype:1},pressure:.32};

  const fx=adfSocialApplyInteraction(p,"repost",effect.fx,effect.pressure);
  a.reposted=true;

  const s=st();
  const repost={
    adfSocial:true,
    sid:"SOC"+(++s.runtime.socialPostSeq),
    n:adfSocialArtistName(),
    t:"↻ Repost di "+p.n+" — "+p.t,
    w:"adesso",
    like:Math.max(2,Math.round(4+G.hype*.35+rnd(0,8))),
    comments:0,mia:true,repostOf:p.sid,
    media:p.media?Object.assign({},p.media,{format:"repost"}):null,
    socialMeta:{
      topic:(p.socialMeta&&p.socialMeta.topic)||"career",
      format:"repost",mood:mood,sourceSid:p.sid,effects:fx
    }
  };

  G.lafamegramMiei=G.lafamegramMiei||[];
  G.lafamegramMiei.unshift(repost);
  if(G.lafamegramMiei.length>30) G.lafamegramMiei.length=30;
  p.lastInteractionEffect=adfSocialInteractionText(fx);
  save(); renderTelefono();
  return true;
}

function adfSocialShareStory(p){
  if(!p||p.mia) return false;
  const a=adfSocialEnsureActions(p);
  if(a.story) return false;

  const mood=(p.socialMeta&&p.socialMeta.mood)||"neutral";
  let effect={fx:{},pressure:0};
  if(mood==="positive") effect={fx:{fans:1},pressure:-.04};
  else if(mood==="negative") effect={fx:{},pressure:.15};

  const fx=adfSocialApplyInteraction(p,"share_story",effect.fx,effect.pressure);
  a.story=true;

  const s=st();
  const story={
    adfSocial:true,
    sid:"ST"+(++s.runtime.socialPostSeq),
    sourceSid:p.sid,
    n:adfSocialArtistName(),
    t:p.t,
    w:"adesso",mia:true,
    expiresDay:absDay()+2,
    media:p.media?Object.assign({},p.media,{format:"story"}):{scene:"screenshot_post",format:"story"},
    socialMeta:{
      topic:(p.socialMeta&&p.socialMeta.topic)||"career",
      format:"story",mood:mood,sourceSid:p.sid,effects:fx
    }
  };

  G.lafamegramStorieMie.unshift(story);
  if(G.lafamegramStorieMie.length>12) G.lafamegramStorieMie.length=12;
  p.lastInteractionEffect=adfSocialInteractionText(fx);
  ADF_SOCIAL_STORY_OPEN=story.sid;
  save(); renderTelefono();
  return true;
}

function adfSocialStoryList(){
  const today=absDay();
  const external=(G.lafamegramEventi||[]).filter(p=>
    p&&p.adfSocial&&p.media&&p.media.format==="story"&&(!p.expiresDay||p.expiresDay>=today)
  );
  const mine=(G.lafamegramStorieMie||[]).filter(p=>
    p&&(!p.expiresDay||p.expiresDay>=today)
  );
  return mine.concat(external);
}

function adfSocialStoryTrayHTML(){
  const stories=adfSocialStoryList();
  if(!stories.length) return "";
  return '<div class="adf-story-tray">'+stories.slice(0,10).map(p=>
    '<button class="adf-story-dot'+(p.mia?" mine":"")+'" data-adf-story-open="'+adfEsc(p.sid)+'">'+
      '<span class="adf-story-ring"><i>'+adfEsc((p.n||"?").replace("@","").slice(0,2).toUpperCase())+'</i></span>'+
      '<b>'+adfEsc(p.mia?"La tua storia":String(p.n||"").replace("@","").slice(0,12))+'</b>'+
    '</button>'
  ).join("")+'</div>';
}

function adfSocialStoryViewerHTML(){
  if(!ADF_SOCIAL_STORY_OPEN) return "";
  const p=adfFindSocialPost(ADF_SOCIAL_STORY_OPEN);
  if(!p || (p.expiresDay && p.expiresDay<absDay())){
    ADF_SOCIAL_STORY_OPEN=null;
    return "";
  }

  return '<section class="adf-story-view">'+
    '<div class="adf-story-view-head"><b>'+adfEsc(p.n||"Story")+'</b>'+
      '<button data-adf-story-close="1">×</button></div>'+
    adfSocialMediaHTML(p.media)+
    '<p>'+adfEsc(p.t||"")+'</p>'+
    (!p.mia?adfSocialActionsHTML(p,true):'<div class="adf-own-story-note">La tua Story · scade tra '+Math.max(0,p.expiresDay-absDay())+' giorni</div>')+
  '</section>';
}

function adfSocialCommentsHTML(p){
  const thread=adfSocialBuildThread(p);
  if(ADF_SOCIAL_THREAD_OPEN!==p.sid) return "";

  return '<div class="adf-thread">'+
    '<div class="adf-thread-head"><b>Commenti</b><span>campione dal thread</span></div>'+
    thread.map(c=>
      '<div class="adf-comment'+(c.me?" me":"")+'">'+
        '<b>'+adfEsc(c.me?"Tu":c.n)+'</b><span>'+adfEsc(c.t)+'</span>'+
      '</div>'
    ).join("")+
  '</div>';
}

function adfSocialReplyPanelHTML(p){
  const a=adfSocialEnsureActions(p);
  if(a.reply){
    return '<div class="adf-reply-done"><b>Hai risposto:</b> '+adfEsc(a.reply.text==="—"?"nessuna risposta pubblica":a.reply.text)+
      (a.reply.effects&&Object.keys(a.reply.effects).length?'<small>'+adfEsc(adfSocialInteractionText(a.reply.effects))+'</small>':'')+
    '</div>';
  }

  if(ADF_SOCIAL_REPLY_OPEN!==p.sid) return "";

  return '<div class="adf-reply-panel"><span>Come vuoi gestirla pubblicamente?</span>'+
    '<div>'+adfSocialReplyOptions(p).map(o=>
      '<button class="'+adfEsc(o.style)+'" data-adf-reply="'+adfEsc(o.id)+'" data-adf-sid="'+adfEsc(p.sid)+'">'+
        adfEsc(o.label)+'</button>'
    ).join("")+'</div>'+
  '</div>';
}

function adfSocialActionsHTML(p,storyMode){
  if(!p||!p.adfSocial||p.mia||p.repostOf) return "";
  const a=adfSocialEnsureActions(p);
  return '<div class="adf-social-actions">'+
    '<button class="'+(a.liked?"on":"")+'" data-adf-like="'+adfEsc(p.sid)+'">♡ '+(a.liked?"Piace":"Like")+'</button>'+
    (!storyMode?'<button data-adf-thread="'+adfEsc(p.sid)+'">◯ Commenti</button>':'')+
    '<button class="'+(a.reposted?"on":"")+'" data-adf-repost="'+adfEsc(p.sid)+'">'+(a.reposted?"✓ Repost":"↻ Repost")+'</button>'+
    '<button class="'+(a.story?"on":"")+'" data-adf-story-share="'+adfEsc(p.sid)+'">'+(a.story?"✓ Story":"+ Story")+'</button>'+
    '<button class="'+(a.reply?"on":"")+'" data-adf-reply-toggle="'+adfEsc(p.sid)+'">'+(a.reply?"✓ Risposto":"Rispondi")+'</button>'+
  '</div>'+
  adfSocialReplyPanelHTML(p)+
  (!storyMode?adfSocialCommentsHTML(p):"")+
  (p.lastInteractionEffect?'<div class="adf-interaction-result">'+adfEsc(p.lastInteractionEffect)+'</div>':'');
}

function adfSocialPostCard(p, full){
  const comments=Number.isFinite(+p.comments)?+p.comments:Math.max(2,Math.round((p.like||0)*.07));
  const interactive=!!(p&&p.adfSocial&&!p.mia&&!p.repostOf);
  if(interactive){
    adfSocialEnsureActions(p);
    adfSocialBuildThread(p);
  }

  const repostHead=p.repostOf
    ? '<div class="adf-repost-head">↻ Hai ricondiviso un post</div>'
    : '';

  return '<article class="tigpost adf-social-post'+(p.mia?" mia":"")+'" data-adf-post="'+adfEsc(p.sid||"")+'">'+
    repostHead+
    '<div class="tighead"><span class="tigav">'+hsvg("camera")+'</span><b>'+adfEsc(p.n)+'</b>'+
      '<span class="tigw">'+adfEsc(p.w||"adesso")+'</span></div>'+
    adfSocialMediaHTML(p.media)+
    '<div class="tigcap">'+adfEsc(p.t||"")+'</div>'+
    '<div class="tigfoot">'+hsvg("cuore")+'<b>'+Math.round(p.like||0)+'</b>'+
      '<span class="adf-comments">◯ '+comments+'</span></div>'+
    (interactive?adfSocialActionsHTML(p,false):"")+
    (full?'<div class="adf-post-public-note">Questo è ciò che il pubblico vede. La versione privata resta nelle Notifiche.</div>':'')+
  '</article>';
}


const ADF_SOCIAL_ACCOUNTS={
  fan:["@matti.wav","@aleinthepit","@fra.02","@noemi.mp4","@rickysottozero","@simo.wav","@bea.mp4","@luca.sottopalco"],
  fanpage:["@annidifame_updates","@lafamefanclub","@quartiere.rap"],
  rap_page:["@sottosuono","@rapstreet.it","@fuoriscena","@miccheck.daily","@barsitalia"],
  gossip:["@dietroilbackstage","@occhi_sulla_scena","@girostretto"],
  media:["@musicwave","@rumoreurbano","@linea45"],
  journalist:["@marcoferri.music","@elisa.nardi","@nico.bars"],
  creator:["@clipcheck","@streettakes","@loopculture"],
  rival:["@rival.direct"], venue:["@clubcentrale","@districtlive"],
  photographer:["@simone.frames","@chiara.livephoto"],
  brand:["@northblockwear","@districtlab"], fashion_page:["@streetfit.it","@weartheroom"],
  artist:["@artista.ospite"]
};

const ADF_SOCIAL_CAPTIONS={
  fan:{
    warm:["Non pensavo si fermasse davvero 😭❤️","Beccato fuori dal locale. Super disponibile.","Foto fatta al volo e serata svoltata 🤝"],
    hype:["BRO È LUI 😭🔥","Ancora non ci credo, l'ho beccato davvero.","Questa me la tengo per sempre."],
    ironic:["Foto tremenda ma almeno ce l'abbiamo 😂","Il mio telefono ha deciso di sfocare proprio oggi 💀"]
  },
  beef:{
    clickbait:["🚨 MA SONO LORO? Video fuori dal locale.","TENSIONE PESANTE stanotte 👀","Qualcuno spieghi cosa è successo qui."],
    gossip:["Pare che questa storia vada avanti da un po' 👀","Le versioni non coincidono, ma il video gira."],
    critical:["Scene evitabili fuori dal locale.","Quando il beef smette di essere musica."],
    ironic:["Internet aveva bisogno di questo video? probabilmente no 💀"]
  },
  freestyle:{
    hype:["Questa strofa al volo sta girando parecchio 🔥","Zero palco. Solo gente ferma ad ascoltare.","17 secondi e il comment section è già impazzito."],
    technical:["Flow pulito anche senza base. Interessante.","Questa chiusura merita un replay."],
    ironic:["Uno gli chiede due barre e parte un mini concerto 😂"]
  },
  live:{
    hype:["Ieri sera il locale era suo.","Questa clip dal palco rende poco l'idea.","La gente sapeva già tutte le parole."],
    warm:["Bel momento ieri sera. Il pubblico c'era davvero.","Una di quelle serate che restano."],
    professional:["Buona risposta del pubblico e set molto solido."]
  },
  ranking:{
    celebratory:["Nuovo ingresso in classifica 📈","Prima volta dentro. Adesso cambia tutto.","La salita continua."],
    professional:["Aggiornamento classifica: nuovo massimo personale."],
    hype:["NON È PIÙ SOLO HYPE 📈🔥"]
  },
  brand:{
    professional:["Nuova collaborazione ufficiale.","Campaign live. Dettagli nelle prossime ore."],
    hype:["Questo fit sta già facendo discutere 👀","Nuovo drop, nuova era."],
    ironic:["Il guardaroba ha appena ricevuto un upgrade serio."]
  },
  gossip:{
    gossip:["E questi due insieme? 👀","Foto di ieri sera. Fate voi.","Pare non sia proprio un incontro casuale."],
    clickbait:["NUOVA COPPIA? Internet ha già deciso 😳"],
    neutral:["Una foto insieme sta facendo il giro dei social."]
  },
  press:{
    professional:["Nuova intervista: carriera, città e prossimi passi.","L'artista parla del momento che sta vivendo."],
    neutral:["Un passaggio dell'intervista sta facendo discutere."],
    critical:["La risposta divide parecchio i commenti."]
  },
  online:{
    ironic:["Internet ha già trasformato tutto in un meme 💀","Questo format era inevitabile."],
    hype:["Il suono sta prendendo una piega interessante 👀","La clip continua a salire."],
    clickbait:["QUESTO VIDEO È OVUNQUE."]
  },
  scandal:{
    critical:["La situazione sta facendo discutere parecchio.","Non una bella immagine per la serata."],
    clickbait:["🚨 VIDEO / FOTO stanno circolando da stanotte."],
    neutral:["Le informazioni sono ancora frammentarie."]
  },
  collab:{
    hype:["Questi due nello stesso studio? 👀🔥","Possibile collaborazione in arrivo."],
    gossip:["Foto insieme e internet ha già deciso che è un feat."],
    professional:["Sessione in studio. Nessun annuncio ufficiale per ora."]
  },
  career:{
    neutral:["Piccolo aggiornamento dalla scena.","Sta succedendo qualcosa intorno a questo nome."],
    professional:["Un altro passo nella costruzione del percorso."],
    hype:["Sta iniziando a muoversi qualcosa 🔥"]
  }
};

function adfSocialPick(pool,recent,windowSize){
  const clean=(pool||[]).filter(Boolean);
  let candidates=clean.filter(x=>recent.indexOf(x)<0);
  if(!candidates.length)candidates=clean.slice();
  const pick=candidates.length?candidates[Math.floor(Math.random()*candidates.length)]:clean[0];
  if(pick&&recent){
    recent.unshift(pick);
    if(recent.length>(windowSize||4))recent.length=(windowSize||4);
  }
  return pick;
}

function adfSocialClamp(n,a,b){ return Math.max(a,Math.min(b,n)); }

function adfSocialResponseScore(choice,result){
  const out=(result&&result.outcome)||{}, fx=out.effects||{};
  let score=0;
  if(fx.fans) score+=adfSocialClamp(fx.fans/18,-2.2,2.2);
  if(fx.hype) score+=adfSocialClamp(fx.hype/3,-1.8,1.8);
  if(fx.network) score+=adfSocialClamp(fx.network/2,-1.2,1.2);

  const low=((((choice&&choice.label)||"")+" "+(out.result||"")).toLowerCase());
  if(/chiar|scus|civile|gentil|disponib|fermati|spiega|contestual|calma|protegg|profession/.test(low)) score+=.55;
  if(/provoc|insult|minacci|rissa|aggred|manda a|sfida|attacca|umilia/.test(low)) score-=.85;
  if(/ignora|silenzio|non rispond/.test(low)) score-=.12;
  const setFlags=(out.set_flags||[]).join(" ").toLowerCase();
  const clearFlags=(out.clear_flags||[]).join(" ").toLowerCase();
  if(/beef_chiuso|confini|professionale|mediazione|risolto|chiarito|accordo/.test(setFlags)) score+=.55;
  if(/beef_active|beef_escalation|blacklist|scandalo|conflitto|rissa/.test(setFlags)) score-=.65;
  if(/beef_active|beef_escalation|conflitto/.test(clearFlags)) score+=.45;
  return adfSocialClamp(score/2.8,-1,1);
}

function adfSocialArcInfo(e){
  const s=st(), id=e.arc_id||("FAM:"+String(e.family||"career"));
  if(!s.runtime.socialArcState[id]){
    s.runtime.socialArcState[id]={posts:0,pressure:0,negativeStreak:0,positiveStreak:0,lastMood:null,lastStage:0,lastDay:-999};
  }
  const a=s.runtime.socialArcState[id];
  const gap=a.lastDay>-900 ? Math.max(0,absDay()-a.lastDay) : 999;
  if(gap>=10){ a.negativeStreak=0; a.positiveStreak=0; }
  if(gap>=14 && a.pressure>0){
    a.pressure=adfSocialClamp(a.pressure-Math.floor(gap/7)*.55,0,5);
  }
  return {id:id,state:a,gap:gap};
}

function adfSocialChooseMood(topic,tone,responseScore,a){
  let pPos=.35,pNeg=.25;
  pPos+=Math.max(0,responseScore)*.28;
  pNeg+=Math.max(0,-responseScore)*.34;
  if(["warm","celebratory","hype","professional"].includes(tone)) pPos+=.10;
  if(["critical","clickbait","gossip"].includes(tone)) pNeg+=.10;
  pNeg+=Math.min(.14,(a.pressure||0)*.035);
  if((a.negativeStreak||0)>=2) pNeg+=.06;
  if((a.positiveStreak||0)>=2) pPos+=.04;

  pPos=adfSocialClamp(pPos,.12,.72);
  pNeg=adfSocialClamp(pNeg,.10,.66);
  if(pPos+pNeg>.88){
    const q=.88/(pPos+pNeg); pPos*=q; pNeg*=q;
  }
  const r=Math.random();
  if(r<pNeg) return "negative";
  if(r<pNeg+pPos) return "positive";
  return "neutral";
}

function adfSocialFanCap(negative,stage,pressure){
  const fame=Math.max(0,Number(G.fans)||0);
  const scaled=(negative?7:9)+Math.round(Math.sqrt(fame)*(negative?.28:.30));
  const seriesBoost=Math.round(Math.max(0,stage-1)*4+Math.min(pressure,4)*2);
  return Math.min(negative?42:55,scaled+seriesBoost);
}

function adfSocialStatFallout(e,topic,tone,choice,result){
  const arc=adfSocialArcInfo(e), a=arc.state;
  const responseScore=adfSocialResponseScore(choice,result);
  const mood=adfSocialChooseMood(topic,tone,responseScore,a);
  const stage=Math.max(1,Number(e.arc_stage)||1);

  const continued=(a.posts||0)>0 && arc.gap<=28;
  let seriesMul=1;
  if(continued){
    seriesMul+=Math.min(.44,(a.posts||0)*.11);
    seriesMul+=Math.min(.40,(a.pressure||0)*.09);
    if(stage>(a.lastStage||0)) seriesMul+=Math.min(.20,(stage-(a.lastStage||0))*.08);
    if(mood==="negative") seriesMul+=Math.min(.30,(a.negativeStreak||0)*.10);
    if(mood==="positive") seriesMul+=Math.min(.12,(a.positiveStreak||0)*.04);
  }
  seriesMul=adfSocialClamp(seriesMul,1,1.90);

  let fx={};
  if(mood==="positive"){
    if(topic==="fan") fx={fans:Math.round(rnd(3,8)*seriesMul),hype:Math.random()<.55?1:0};
    else if(topic==="ranking"||topic==="live"||topic==="freestyle") fx={fans:Math.round(rnd(4,11)*seriesMul),hype:rnd(1,2)};
    else if(topic==="brand"||topic==="collab") fx={fans:Math.round(rnd(3,9)*seriesMul),hype:1};
    else fx={fans:Math.round(rnd(2,8)*seriesMul),hype:Math.random()<.45?1:0};
    if(Math.random()<.22) fx.wellbeing=1;
  }else if(mood==="negative"){
    if(topic==="beef"||topic==="scandal"){
      fx={fans:-Math.round(rnd(2,6)*seriesMul),hype:Math.random()<.70?1:0,
          wellbeing:-Math.max(1,Math.round(rnd(1,2)*seriesMul)),lucidita:Math.random()<.55?-1:0};
    }else if(topic==="gossip"){
      fx={fans:-Math.round(rnd(1,5)*seriesMul),wellbeing:-Math.max(1,Math.round(rnd(1,2)*seriesMul))};
    }else{
      fx={fans:-Math.round(rnd(1,5)*seriesMul),hype:Math.random()<.35?-1:0,wellbeing:Math.random()<.45?-1:0};
    }
  }else{
    if(Math.random()<.35) fx.hype=1;
    if(Math.random()<.25) fx.fans=rnd(1,3);
  }

  const fanPosCap=adfSocialFanCap(false,stage,a.pressure||0);
  const fanNegCap=adfSocialFanCap(true,stage,a.pressure||0);
  if(fx.fans>0) fx.fans=Math.min(fx.fans,fanPosCap);
  if(fx.fans<0) fx.fans=-Math.min(Math.abs(fx.fans),fanNegCap);
  /* integrazione repo: i fan sono persone, mai valori frazionari. */
  if(fx.fans) fx.fans=Math.round(fx.fans);
  if(fx.hype) fx.hype=adfSocialClamp(fx.hype,-3,3);
  if(fx.wellbeing) fx.wellbeing=adfSocialClamp(fx.wellbeing,-4,2);
  if(fx.lucidita) fx.lucidita=adfSocialClamp(fx.lucidita,-3,1);

  if(mood==="negative"){
    a.negativeStreak=(a.negativeStreak||0)+1; a.positiveStreak=0;
    a.pressure=adfSocialClamp((a.pressure||0)+1+(responseScore<-.45?.45:0),0,5);
  }else if(mood==="positive"){
    a.positiveStreak=(a.positiveStreak||0)+1; a.negativeStreak=0;
    a.pressure=adfSocialClamp((a.pressure||0)-(.8+Math.max(0,responseScore)*.7),0,5);
  }else{
    a.negativeStreak=0; a.positiveStreak=0;
    a.pressure=adfSocialClamp((a.pressure||0)-.2,0,5);
  }
  a.posts=(a.posts||0)+1; a.lastMood=mood; a.lastStage=stage; a.lastDay=absDay();

  const s=st();
  s.runtime.socialImpactHistory.unshift({
    day:absDay(),eventId:e.id,arcId:arc.id,stage,mood,responseScore,
    seriesMul:Number(seriesMul.toFixed(2)),pressure:Number(a.pressure.toFixed(2)),effects:Object.assign({},fx)
  });
  if(s.runtime.socialImpactHistory.length>80) s.runtime.socialImpactHistory.length=80;

  return {mood,fx,responseScore,arcId:arc.id,arcStage:stage,
          seriesMul:Number(seriesMul.toFixed(2)),seriesPressure:Number(a.pressure.toFixed(2))};
}

function adfApplySocialEffects(fx){
  fx=fx||{};
  if(fx.fans)G.fans=Math.max(0,G.fans+fx.fans);
  if(fx.hype)G.hype=Math.max(0,G.hype+fx.hype);
  if(fx.wellbeing)G.wellbeing=Math.max(0,Math.min(100,G.wellbeing+fx.wellbeing));
  if(fx.lucidita)G.lucidita=Math.max(0,Math.min(100,G.lucidita+fx.lucidita));
}

function adfSocialEffectsText(fx){
  const lab={fans:"fan",hype:"hype",wellbeing:"benessere",lucidita:"lucidità"};
  const bits=[];
  Object.entries(fx||{}).forEach(([k,v])=>{
    if(!v)return;
    bits.push((v>0?"+":"")+v+" "+(lab[k]||k));
  });
  return bits.join(" · ")||"nessuna variazione immediata";
}


function adfSocialPublicationChance(e,choice,result){
  const meta=e.social||{};
  let chance=Number(meta.chance||0);
  const out=(result&&result.outcome)||{};
  const low=(
    ((choice&&choice.label)||"")+" "+(out.result||"")+" "+
    (out.set_flags||[]).join(" ")+" "+(out.clear_flags||[]).join(" ")
  ).toLowerCase();

  if(/non pubblic|privat|tieni.*privat|rifiut|rimuov|ritira|blocca|diffida|segnala/.test(low)) chance*=.52;
  if(/pubblic|condivid|repost|rilancia|posta|story|diretta|rispondi|frecciata/.test(low)) chance*=1.28;
  if(/beef_chiuso|mediazione|confini/.test(low)) chance*=.75;
  if(/beef_active|beef_escalation|scandalo/.test(low)) chance*=1.12;

  /* Revisione manuale: alcuni eventi hanno una probabilità diversa in base
     alla scelta concreta. Esempio: "Mostrala apertamente" rende la scorta
     molto più pubblicabile di "Riduci la protezione". */
  if(choice && meta.choice_multipliers){
    const m=Number(meta.choice_multipliers[choice.label]);
    if(Number.isFinite(m)) chance*=m;
  }

  return adfSocialClamp(chance,.01,.98);
}
function adfSocialShouldPublish(e,choice,result,candidate){
  if(!e.social||!e.social.eligible) return false;
  if(candidate&&candidate.forced) return true;
  const chance=adfSocialPublicationChance(e,choice,result);
  const roll=(candidate&&Number.isFinite(candidate.roll))?candidate.roll:Math.random();
  return roll<chance;
}
function adfSocialPostFromEvent(e,choice,result){
  const s=st(),meta=e.social||{},topic=meta.topic||"career";
  const fmt=adfSocialPick(meta.formats||["text"],s.runtime.socialRecentFormats,4);
  const pubType=adfSocialPick(meta.publishers||["rap_page"],s.runtime.socialRecentPublishers,5);
  const tone=adfSocialPick(meta.tones||["neutral"],s.runtime.socialRecentTones,4);
  const scene=adfSocialPick(meta.scenes||["screenshot_post"],s.runtime.socialRecentScenes,5);
  s.runtime.socialRecentTopics.unshift(topic);
  if(s.runtime.socialRecentTopics.length>5)s.runtime.socialRecentTopics.length=5;

  const author=adfSocialPick(
    ADF_SOCIAL_ACCOUNTS[pubType]||ADF_SOCIAL_ACCOUNTS.rap_page,
    s.runtime.socialRecentAccounts,8
  );
  const sets=(meta.captions&&typeof meta.captions==="object")
    ? meta.captions
    : (ADF_SOCIAL_CAPTIONS[topic]||ADF_SOCIAL_CAPTIONS.career);
  const pool=sets[tone]||Object.values(sets).flat();
  const caption=adfSocialPick(pool,s.runtime.socialRecentCaptions,8)||pool[0]||"";

  const fallout=adfSocialStatFallout(e,topic,tone,choice,result);
  adfApplySocialEffects(fallout.fx);

  const post={
    adfSocial:true,
    sid:"SOC"+(++s.runtime.socialPostSeq),
    eventId:e.id,n:author,t:caption,w:"adesso",
    like:Math.round(30+Math.max(0,G.hype)*8+rnd(10,240)),
    comments:rnd(2,90),mia:false,
    expiresDay:fmt==="story"?absDay()+2:null,
    media:{scene:scene,format:fmt},
    socialMeta:{
      topic,format:fmt,publisherType:pubType,tone,scene,mood:fallout.mood,effects:fallout.fx,
      responseScore:fallout.responseScore,arcId:fallout.arcId,arcStage:fallout.arcStage,
      seriesMul:fallout.seriesMul,seriesPressure:fallout.seriesPressure,
      choiceLabel:(choice&&choice.label)||"",
      eventResult:(result&&result.outcome&&result.outcome.result)||""
    }
  };
  adfSocialEnsureActions(post);
  adfSocialBuildThread(post);
  return post;
}
function adfSocialMakePost(scene, opts){
  opts=opts||{};
  const name=((window.ARTIST||{}).name||"l'artista").trim()||"l'artista";
  let author,caption,likes,comments;

  if(scene==="rival_fight"){
    author=ADF_SOCIAL_AUTHORS.rap[Math.floor(Math.random()*ADF_SOCIAL_AUTHORS.rap.length)];
    caption="MA SONO LORO? 😳 Video fuori dal locale: "+name+" e un altro rapper vengono separati mentre intorno filmano tutti.";
    likes=Math.round(430+G.hype*18+rnd(40,680)); comments=Math.round(likes*.12);
  }else if(scene==="freestyle_clip"){
    author=ADF_SOCIAL_AUTHORS.rap[Math.floor(Math.random()*ADF_SOCIAL_AUTHORS.rap.length)];
    caption="Questa strofa al volo sta girando parecchio. "+name+" in piazza, zero palco e gente che si ferma ad ascoltare. 🎤";
    likes=Math.round(180+G.hype*12+rnd(30,420)); comments=Math.round(likes*.075);
  }else{
    author=ADF_SOCIAL_AUTHORS.fan[Math.floor(Math.random()*ADF_SOCIAL_AUTHORS.fan.length)];
    caption=opts.quick
      ?"Beccato al volo fuori dal bar 😂 almeno il saluto ce l'ha dato. "+name+" 🤝"
      :"Non pensavo si fermasse davvero 😭 foto fatta fuori dal bar. Super disponibile, grande "+name+" ❤️";
    likes=Math.round(55+G.hype*6+rnd(15,170)); comments=Math.round(likes*.055);
    scene="fan_selfie";
  }

  const post={
    adfSocial:true,
    sid:"SOC"+(++st().runtime.socialPostSeq),
    n:author,t:caption,w:"adesso",like:likes,comments:comments,mia:false,
    media:{scene:scene}
  };
  adfSocialEnsureActions(post);
  return post;
}

function adfSocialStorePost(post){
  G.lafamegramEventi=G.lafamegramEventi||[];
  G.lafamegramEventi.unshift(post);
  if(G.lafamegramEventi.length>30) G.lafamegramEventi.length=30;
  save();
  return post;
}

let ADF_SOCIAL_CONTINUE=null;
function adfShowSocialPost(post,onContinue){
  let ov=document.getElementById("adf-social-overlay");
  if(!ov){
    ov=document.createElement("div");
    ov.id="adf-social-overlay";
    document.body.appendChild(ov);
  }
  ov.innerHTML=
    '<div class="adf-social-backdrop"></div>'+
    '<section class="adf-social-popup">'+
      '<div class="adf-social-popup-head"><span>LaFamegram</span><b>NUOVO POST SU DI TE</b></div>'+
      adfSocialPostCard(post,true)+
      '<button id="adf-social-continue" type="button">CONTINUA</button>'+
    '</section>';
  ov.classList.add("on");
  ADF_SOCIAL_CONTINUE=typeof onContinue==="function"?onContinue:null;
  setTimeout(()=>{ const b=document.getElementById("adf-social-continue"); if(b)b.focus(); },40);
}
function adfCloseSocialPost(){
  const ov=document.getElementById("adf-social-overlay");
  if(ov) ov.classList.remove("on");
  const cb=ADF_SOCIAL_CONTINUE; ADF_SOCIAL_CONTINUE=null;
  try{ save(); renderTelefono(); }catch(_){}
  if(cb) setTimeout(cb,0);
}
function adfPublishSocial(scene,opts,onContinue){
  const p=adfSocialStorePost(adfSocialMakePost(scene,opts));
  adfShowSocialPost(p,onContinue);
  return p;
}

/* Traduzione evento+scelta -> immagine pubblica.
   Per la demo forzata EV0001: la scelta piena produce il selfie "bello",
   il saluto rapido produce una foto più casuale. */
function adfSocialPublishFromEvent(e,choice,result,onContinue,opts){
  opts=opts||{};
  const p=(e.social&&e.social.eligible)?adfSocialPostFromEvent(e,choice,result):adfSocialMakePost("fan_selfie",{});
  p.socialMeta=p.socialMeta||{};
  p.socialMeta.fromSkip=!!opts.fromSkip;
  adfSocialStorePost(p);
  adfQueueSocialAlert(p,null);
  return p;
}


let ADF_SOCIAL_ALERT_POST=null;

function adfQueueSocialAlert(post,onContinue){
  /* onContinue ignorato di proposito: l'interruzione chiude lo skip. */
  ADF_SOCIAL_ALERT_POST=post;
  const s=st();
  s.runtime.socialAlerts.unshift({
    sid:post.sid,at:absDay(),read:false,
    effects:(post.socialMeta&&post.socialMeta.effects)||{}
  });
  if(s.runtime.socialAlerts.length>50)s.runtime.socialAlerts.length=50;
  save();
  adfRenderSocialBanner(post);
}

function adfRenderSocialBanner(post){
  let el=document.getElementById("adf-social-banner");
  if(!el){
    el=document.createElement("div");
    el.id="adf-social-banner";
    document.body.appendChild(el);
  }
  const fx=(post.socialMeta&&post.socialMeta.effects)||{};
  const sm=post.socialMeta||{};
  const mood=sm.mood||"neutral";
  const serie=(sm.arcStage>1||sm.seriesPressure>=1.5)
    ?" · storia in corso ×"+Number(sm.seriesMul||1).toFixed(2)
    :"";
  el.className="adf-social-banner "+mood;
  el.innerHTML=
    '<div class="adf-sb-icon">'+hsvg("camera")+'</div>'+
    '<div class="adf-sb-copy"><div class="adf-sb-top"><b>LaFamegram</b><span>adesso</span></div>'+
    '<strong>'+adfEsc(post.n)+' ha pubblicato qualcosa su di te</strong>'+
    '<i>'+adfEsc(post.t)+'</i>'+
    '<small>'+adfEsc(adfSocialEffectsText(fx)+serie)+'</small></div>'+
    '<div class="adf-sb-actions"><button data-adf-social-open="1">APRI</button>'+
    '<button data-adf-social-dismiss="1">CHIUDI</button></div>';
  requestAnimationFrame(()=>el.classList.add("show"));
}

function adfHideSocialBanner(){
  const el=document.getElementById("adf-social-banner");
  if(el)el.classList.remove("show");
}

function adfSocialOpenLatest(){
  try{
    if(ADF_SOCIAL_ALERT_POST && ADF_SOCIAL_ALERT_POST.media &&
       ADF_SOCIAL_ALERT_POST.media.format==="story"){
      ADF_SOCIAL_STORY_OPEN=ADF_SOCIAL_ALERT_POST.sid;
    }
    TEL_APP="lafamegram";
    renderTelefono();
  }catch(_){}
}

function adfResolveSocialAlert(openIt){
  const post=ADF_SOCIAL_ALERT_POST;
  const wasSkip=!!(post&&post.socialMeta&&post.socialMeta.fromSkip);
  if(openIt) adfSocialOpenLatest();
  adfHideSocialBanner();
  try{
    const s=st();
    const row=(s.runtime.socialAlerts||[]).find(x=>post&&x.sid===post.sid);
    if(row) row.read=true;
    save();
  }catch(_){}
  ADF_SOCIAL_ALERT_POST=null;
  if(wasSkip&&typeof toast==="function"){
    toast("<b>Avanzamento interrotto.</b> Premi di nuovo +1 o +7 quando vuoi far passare altro tempo.",
      "","⏸",["#7C3AED","#312E81"]);
  }
}

document.addEventListener("click",ev=>{
  if(ev.target.closest&&ev.target.closest("[data-adf-social-open]")){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    adfResolveSocialAlert(true);return;
  }
  if(ev.target.closest&&ev.target.closest("[data-adf-social-dismiss]")){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    adfResolveSocialAlert(false);return;
  }
},true);

/* LaFamegram della repo con supporto a media, Story e interazioni. */
if(typeof schermataLafamegram==="function"){
  schermataLafamegram=function(){
    const allPosts=telPost().filter(p=>!p.expiresDay||p.expiresDay>=absDay());
    const feedPosts=allPosts.filter(p=>!(p.media&&p.media.format==="story"));

    return adfSocialStoryTrayHTML()+
      adfSocialStoryViewerHTML()+
      '<div class="tigscrivi">'+
        '<textarea id="tig-testo" maxlength="220" placeholder="A cosa stai pensando?"></textarea>'+
        '<button class="tbtn" id="tig-pubblica">Pubblica</button>'+
      '</div>'+
      '<div class="tig">'+feedPosts.map(p=>adfSocialPostCard(p,false)).join("")+'</div>';
  };
}

document.addEventListener("click",ev=>{
  const like=ev.target.closest&&ev.target.closest("[data-adf-like]");
  if(like){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    const p=adfFindSocialPost(like.dataset.adfLike);
    if(p) adfSocialToggleLike(p);
    return;
  }

  const thread=ev.target.closest&&ev.target.closest("[data-adf-thread]");
  if(thread){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    const sid=thread.dataset.adfThread;
    ADF_SOCIAL_THREAD_OPEN=ADF_SOCIAL_THREAD_OPEN===sid?null:sid;
    renderTelefono();return;
  }

  const replyToggle=ev.target.closest&&ev.target.closest("[data-adf-reply-toggle]");
  if(replyToggle){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    const sid=replyToggle.dataset.adfReplyToggle;
    const p=adfFindSocialPost(sid);
    if(p&&adfSocialEnsureActions(p).reply){
      ADF_SOCIAL_THREAD_OPEN=sid;
    }else{
      ADF_SOCIAL_REPLY_OPEN=ADF_SOCIAL_REPLY_OPEN===sid?null:sid;
    }
    renderTelefono();return;
  }

  const reply=ev.target.closest&&ev.target.closest("[data-adf-reply]");
  if(reply){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    const p=adfFindSocialPost(reply.dataset.adfSid);
    if(p) adfSocialReply(p,reply.dataset.adfReply);
    return;
  }

  const repost=ev.target.closest&&ev.target.closest("[data-adf-repost]");
  if(repost){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    const p=adfFindSocialPost(repost.dataset.adfRepost);
    if(p) adfSocialRepost(p);
    return;
  }

  const storyShare=ev.target.closest&&ev.target.closest("[data-adf-story-share]");
  if(storyShare){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    const p=adfFindSocialPost(storyShare.dataset.adfStoryShare);
    if(p) adfSocialShareStory(p);
    return;
  }

  const storyOpen=ev.target.closest&&ev.target.closest("[data-adf-story-open]");
  if(storyOpen){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    ADF_SOCIAL_STORY_OPEN=storyOpen.dataset.adfStoryOpen;
    renderTelefono();return;
  }

  if(ev.target.closest&&ev.target.closest("[data-adf-story-close]")){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    ADF_SOCIAL_STORY_OPEN=null;
    renderTelefono();return;
  }
  if(ev.target.closest&&ev.target.closest("#adf-social-continue")){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    adfCloseSocialPost();return;
  }
},true);

function mirrorDelivery(e, meta){
  meta=meta||{};
  if(meta.fromSkip) return;

  if(e.delivery==="lafamegram"){
    G.lafamegramEventi=G.lafamegramEventi||[];
    G.lafamegramEventi.unshift({
      n:"La Voce del Giro",t:e.title+" — "+e.description,w:"adesso",
      like:Math.max(5,Math.round(12+G.hype*.8)),mia:false
    });
    if(G.lafamegramEventi.length>20) G.lafamegramEventi.length=20;
  }else if(e.delivery==="chat"){
    pushLog("📱 <b>Chat:</b> "+e.title+". "+e.description,"");
  }
}
function eventObject(e, resume, meta){
  meta=meta||{};
  const k=(e.delivery==="chat"?"CHAT · ":e.delivery==="lafamegram"?"LAFAMEGRAM · ":"")+
    TIER_LABEL[e.tier]+" · "+String(e.family||"evento").replace(/_/g," ");
  return {
    __adfCatalog:true,
    k:k,t:e.title,d:e.description,
    opts:(e.choices||[]).map(c=>({
      n:c.label,d:c.hint||"",
      run(){
        const r=execute(e,c,false);
        if(meta.fromSkip){
          adfAddSkipNotification(e,r,{read:true,interrupted:true});
        }
        /* Se questo evento è diventato pubblico:
           scelta -> popup esito -> eventuale POST LAFAMEGRAM; lo skip resta interrotto.
           Altrimenti resta il flusso v1.2.7. */
        let shouldSocial=false;
        if(e.social&&e.social.eligible){
          if(meta.fromSkip&&meta.socialPost) shouldSocial=adfSocialShouldPublish(e,c,r,meta.socialPost);
          else if(!meta.fromSkip) shouldSocial=adfSocialShouldPublish(e,c,r,null);
        }
        const safeResume=meta.fromSkip?null:(resume||null);
        const dopoEsito=shouldSocial
          ? ()=>adfSocialPublishFromEvent(e,c,r,safeResume,{fromSkip:!!meta.fromSkip})
          : safeResume;
        setTimeout(()=>adfResultPopup(e,c,r,dopoEsito),0);
        return r;
      }
    }))
  };
}
function showCatalog(e,resume,meta){
  if(!e) return;
  meta=meta||{};

  /* v1.2.13
     Gli eventi generati dagli skip appartengono ESCLUSIVAMENTE al Centro
     Notifiche. Non devono creare una copia in Messaggi/Chat o LaFamegram,
     anche quando il loro campo editoriale `delivery` è "chat" o
     "lafamegram".

     Gli stessi eventi, se accadono durante il gioco normale, continuano
     invece a usare il canale previsto dal catalogo. */
  if(!meta.fromSkip){
    mirrorDelivery(e);
  }

  showEvent(eventObject(e,resume,meta));
}
function autoResolve(e){
  if(!e) return false;
  const cs=e.choices||[];
  if(!cs.length) return false;
  const idx=cs.length>=3?1:Math.min(1,cs.length-1);
  const r=execute(e,cs[idx],true);

  /* v1.2.13: niente più una riga di Diario per ogni evento dello skip.
     La cronologia completa vive nell'app Notifiche del telefono. */
  adfAddSkipNotification(e,r,{read:false,interrupted:false});
  return true;
}

/* -------------------- hook repo reali -------------------- */
function hookMatches(e, kind, payload){
  payload=payload||{};
  const h=e.repo_hook||{};
  if(h.kind===kind){
    for(const key of ["action_id","job_id","colpo_id","approccio_id","gear_id","life_id","action","role","function","attivita_id","offer_id"]){
      if(h[key]==null) continue;
      if(h[key]==="*") continue;
      if(payload[key]!==h[key]) return false;
    }
    return true;
  }
  const tr=e.trigger||{};
  if(kind==="after_action" && tr.kind==="after_action"){
    const a=payload.action_id;
    return Array.isArray(tr.action_ids) && tr.action_ids.includes(a);
  }
  return false;
}
function hookChance(kind){
  if(["on_arrest","on_release","on_job_lost","on_contract_obligation_complete"].includes(kind)) return 1;
  if(["after_gear_purchase","after_clothes_action","after_lifestyle_change","after_beat_market_action","after_contract_sign"].includes(kind)) return .24;
  if(kind.startsWith("after_crime") || kind==="after_launder" || kind==="after_protection_change" || kind==="after_lawyer_toggle" || kind==="after_leave_crime") return .18;
  if(kind.startsWith("after_sala")) return .16;
  if(kind==="weekly_state" || kind.startsWith("weekly_")) return .11;
  if(kind==="after_action" || kind==="after_job_shift") return .11;
  if(kind==="after_lafamegram_post" || kind==="after_lafamegram_event" || kind==="after_feed_refresh") return .14;
  return .12;
}
function emitHook(kind,payload,forced){
  if(!ADF.ready || ADF.skipRunning) return;
  payload=payload||{};
  const s=st(), now=absDay();
  if(!forced && s.lastEventDay===now) return;
  if(!forced && s.lastHookEventDay===now) return;

  const criticalForced = forced && ["on_arrest","on_release","on_job_lost","on_contract_obligation_complete"].includes(kind);
  let pool=ADF.db.filter(e=>hookMatches(e,kind,payload) && eligible(e,{ignoreHigh:criticalForced}));
  if(!pool.length) return;

  let pick=null;
  if(highDue()){
    const hp=pool.filter(e=>e.tier==="high");
    if(hp.length) pick=rarityPick(hp);
  }
  if(!pick){
    pool=pool.filter(e=>e.tier!=="high");
    if(!pool.length) return;
    if(!forced && Math.random()>hookChance(kind)) return;
    pick=rarityPick(pool);
  }
  if(!pick) return;
  s.lastHookEventDay=now;
  s.stats.hook++;
  afterClear(()=>showCatalog(pick),80);
}
function emitWeeklyHooks(before){
  emitHook("weekly_state",{},false);
  emitHook("weekly_job_state",{},false);
  if(G.obligation) emitHook("weekly_contract_obligation",{offer_id:G.contract&&G.contract.id},false);
  if(G.contract) emitHook("weekly_contract_state",{offer_id:G.contract.id},false);
  if(!G.contract) emitHook("contract_offer_available",{offer_id:"indie"},false);
  emitHook("chat_state_event",{},false);
  emitHook("chat_posto_contact",{},false);

  if(before.job && !G.job) emitHook("on_job_lost",{reason:"missed_shifts"},true);
  if(before.arresto && !(G.strada&&G.strada.arresto)){
    st().runtime.justReleasedDay=absDay();
    emitHook("on_release",{},true);
  }
  if(before.obligation && !G.obligation){
    const done=(G.songs||[]).filter(x=>x.released && x.week>before.obligation.from).length;
    if(done>=before.obligation.need)
      emitHook("on_contract_obligation_complete",{offer_id:before.contractId},true);
  }
}
function scheduleDaysAfterSala(action, actor){
  for(const e of ADF.db){
    const h=e.repo_hook||{};
    if(h.kind!=="days_after_sala_action") continue;
    if(h.action && h.action!==action) continue;
    const d=Array.isArray(h.days)?h.days:[2,14];
    scheduleDirect(e.id,d[0],d[1],"sala:"+((actor&&actor.id)||""));
  }
}

/* -------------------- incontri PER STRADA legacy --------------------
   La repo ha un sottosistema autonomo (`provaIncontro`) che viene chiamato da
   avanzaGiorno(). Lasciato libero durante +7/+28, può produrre molti ALTI
   "Lo incroci per strada" e schiacciare il catalogo da 1000 eventi.

   v1.2.3:
   - durante QUALSIASI skip ADF non viene proprio interrogato;
   - nel gioco giorno-per-giorno resta come flavor, ma con cooldown globale
     minimo di 14 giorni fra due popup PER STRADA;
   - il suo popup non sostituisce né resetta la cadenza dei 1000 eventi.
*/
if(typeof provaIncontro==="function"){
  const _adfProvaIncontro=provaIncontro;
  provaIncontro=function(){
    const s=st(), now=absDay();
    if(ADF.skipRunning || SALTO) return false;
    if(now-s.lastLegacyStreetDay < 14) return false;
    return _adfProvaIncontro.apply(this,arguments);
  };
}

/* -------------------- cadenza normale -------------------- */
function tryNormal(){
  if(!ADF.ready || ADF.skipRunning || G.ended) return;
  const s=st();
  if(s.lastEventDay===absDay()) return;
  const highNow=highDue();
  if(!highNow && s.normalDays<s.nextNormalAt) return;
  afterClear(()=>{
    if(st().lastEventDay===absDay()) return;
    let e=null;
    if(highDue()){
      const hp=ambientPool("high");
      if(hp.length) e=rarityPick(hp);
    }
    if(!e) e=pickAmbient("normal");
    if(e){ st().stats.normal++; showCatalog(e); }
  },60);
}
function skip1Chance(chain){
  return [0,.08,.18,.32,.48,.65,.80][Math.min(6,Math.max(1,chain))];
}

/* -------------------- wrappa giorno/settimana -------------------- */
const _advanceWeek=advanceWeek;
advanceWeek=function(){
  const before={
    job:G.job?Object.assign({},G.job):null,
    arresto:G.strada&&G.strada.arresto?Object.assign({},G.strada.arresto):null,
    obligation:G.obligation?Object.assign({},G.obligation):null,
    contractId:G.contract&&G.contract.id
  };
  const r=_advanceWeek.apply(this,arguments);
  setTimeout(()=>emitWeeklyHooks(before),0);
  return r;
};

const _avanzaGiorno=avanzaGiorno;
avanzaGiorno=function(){
  const r=_avanzaGiorno.apply(this,arguments);
  if(!ADF.skipRunning){
    const s=st();
    s.skip1Chain=0;
    s.normalDays++;
    setTimeout(tryNormal,0);
  }
  return r;
};

/* -------------------- salti +1/+7/+28 -------------------- */
function finishSkipLog(done,lucPrima,wellPrima,newNotifications,interrupted){
  const dLuc=Math.round(luc()-lucPrima), dWell=Math.round(G.wellbeing-wellPrima);
  const extra=newNotifications>0
    ?" · <b>"+newNotifications+" "+(newNotifications===1?"evento":"eventi")+" in Notifiche</b>"
    :"";
  pushLog("<b>"+done+(done===1?" giorno saltato.":" giorni saltati.")+"</b> Benessere "+
    (dWell>=0?"+"+dWell:dWell)+", lucidità "+(dLuc>=0?"+"+dLuc:dLuc)+"."+extra+
    (interrupted?" · <b>Avanzamento interrotto.</b>":""),
    dLuc<=-10?"bad":"");
  if(newNotifications>0 && typeof toast==="function"){
    toast("<b>"+newNotifications+" "+(newNotifications===1?"nuova notifica":"nuove notifiche")+
      "</b> dal salto tempo.","","🔔",["#F59E0B","#B45309"]);
  }
}
saltaGiorni=function(n){
  if(G.ended || n<=0) return;
  if(!weekOpen) openWeek();
  const before=weekOpen, costiSettimana=weeklyCosts();
  const lucPrima=luc(), wellPrima=G.wellbeing;
  const s=st(), chainBefore=s.skip1Chain;
  const notifPrima=s.notifications.length;

  const guaranteed=new Set();
  if(n>=7){
    for(let start=0;start<n;start+=7){
      const size=Math.min(7,n-start);
      guaranteed.add(start+Math.floor(Math.random()*size));
    }
  }

  ADF.skipRunning=true;
  SALTO=true;
  SALTO_STOP=null;
  let weeks=0, done=0, adfStop=null, adfAny=false, adfSocialStop=null;

  for(let i=0;i<n && !G.ended;i++){
    SALTO=true;
    if(avanzaGiorno()) weeks++;
    done++;

    if(SALTO_STOP) break;
    let trigger=highDue(), ctx="skip7";
    if(!trigger && n===1){
      ctx="skip1";
      trigger=Math.random()<skip1Chance(chainBefore+1);
    }else if(!trigger && n<7){
      trigger=Math.random()<.14;
    }else if(!trigger && n>=7){
      trigger=guaranteed.has(i) || Math.random()<.07;
    }

    if(trigger){
      const e=pickAmbient(ctx);
      if(e){
        adfAny=true;
        let socialCandidate=null;
        if(e.social&&e.social.eligible){
          const roll=Math.random(), base=Number(e.social.chance||0);
          if(roll<base) socialCandidate={roll:roll,base:base};
        }
        if(socialCandidate){
          adfStop=e; adfSocialStop=socialCandidate; break;
        }
        if(e.tier==="high"){ adfStop=e; break; }
        autoResolve(e);
      }
    }
  }

  ADF.skipRunning=false;
  SALTO=false;

  if(n===1 && !adfAny && !SALTO_STOP) s.skip1Chain=Math.min(12,chainBefore+1);
  else if(adfAny || n!==1) s.skip1Chain=0;

  const nuoveNotifiche=Math.max(0,s.notifications.length-notifPrima);
  const skipInterrottoAdesso=!!(SALTO_STOP||adfStop);
  finishSkipLog(done,lucPrima,wellPrima,nuoveNotifiche,skipInterrottoAdesso);
  try{ SFX[weeks>0?"week":"giorno"](); }catch(_){}
  save();

  if(weeks>0){
    weekReport(before,costiSettimana*weeks);
    openWeek();
  }else renderGioco();

  try{ avvisoLucidita(); }catch(_){}

  const rimasti=n-done;
  const interrotto=!!(SALTO_STOP||adfStop);
  if(interrotto){
    s.runtime.lastSkipInterruptedDay=absDay();
    s.runtime.lastSkipInterruptedAfter=done;
  }

  if(SALTO_STOP){
    const core=SALTO_STOP; SALTO_STOP=null;
    armHigh();
    afterClear(()=>showEvent(core),100);
  }else if(adfStop){
    if(!adfSocialStop&&adfStop.social&&adfStop.social.eligible){
      const roll=Math.random(), base=Number(adfStop.social.chance||0);
      if(roll<base) adfSocialStop={roll:roll,base:base};
    }
    afterClear(()=>showCatalog(adfStop,null,{fromSkip:true,socialPost:adfSocialStop}),100);
  }
  refreshHub();
};

/* -------------------- action hooks -------------------- */
for(const a of ACTIONS){
  if(a.__adfWrapped) continue;
  const old=a.run;
  a.run=function(){
    const jobBefore=G.job&&G.job.id;
    const out=old.apply(this,arguments);
    setTimeout(()=>{
      emitHook("after_action",{action_id:a.id});
      if(a.id==="turno" && G.job)
        emitHook("after_job_shift",{action_id:"turno",job_id:G.job.id});
    },0);
    return out;
  };
  a.__adfWrapped=true;
}

/* La Sala: qui abbiamo l'attore concreto, quindi lo conserviamo nel runtime. */
if(typeof azionePosto==="function"){
  const old=azionePosto;
  azionePosto=function(tipo,id){
    const p=(G.gente||[]).find(x=>x.id===id);
    const before=p?{rel:p.rel,pt:p.pt,numero:p.numero}:null;
    const r=old.apply(this,arguments);
    st().runtime.lastActorId=id;
    st().runtime.lastActorRole=p&&p.ruolo;
    setTimeout(()=>{
      emitHook("after_sala_action",{action:tipo,role:p&&p.ruolo,actor_id:id});
      if(tipo==="numero") scheduleDaysAfterSala("numero",p);
      if(p && before && p.rel!==before.rel)
        emitHook("after_sala_relation_change",{from:before.rel,to:p.rel,role:p.ruolo,actor_id:id});
    },0);
    return r;
  };
}
if(typeof poRispondi==="function"){
  const old=poRispondi;
  poRispondi=function(i){
    const pp=typeof POSTO_PARLA!=="undefined" && POSTO_PARLA ? POSTO_PARLA.p : null;
    const before=pp?{rel:pp.rel,pt:pp.pt}:null;
    const r=old.apply(this,arguments);
    if(pp && before){
      const bad=(pp.rel<before.rel)||(pp.pt<before.pt);
      st().runtime.postoRecentConflict=bad;
      st().runtime.postoConflictRel=pp.rel||0;
      if(bad) setTimeout(()=>emitHook("after_sala_dialogue",{result:"negative",role:pp.ruolo,actor_id:pp.id}),0);
    }
    return r;
  };
}

/* Strada criminale. */
if(typeof stradaTenta==="function"){
  const old=stradaTenta;
  stradaTenta=function(colpoId,approccioId){
    const s=G.strada||{}, before={rep:s.rep||0,sporchi:s.sporchi||0,arresto:s.arresto};
    const r=old.apply(this,arguments);
    const success=(G.strada.rep||0)>before.rep || (G.strada.sporchi||0)>before.sporchi;
    setTimeout(()=>{
      emitHook("after_crime",{colpo_id:colpoId,approccio_id:approccioId});
      emitHook(success?"after_crime_success":"after_crime_failure",{colpo_id:colpoId,approccio_id:approccioId});
      if(!before.arresto && G.strada.arresto) emitHook("on_arrest",{colpo_id:colpoId},true);
    },0);
    return r;
  };
}
function wrapFn(name,kind,payloadFn){
  const fn=window[name];
  if(typeof fn!=="function") return;
  window[name]=function(){
    const args=[...arguments], r=fn.apply(this,args);
    setTimeout(()=>emitHook(kind,payloadFn?payloadFn(args):{function:name}),0);
    return r;
  };
}
wrapFn("stradaRipulisci","after_launder",()=>({function:"stradaRipulisci"}));
wrapFn("stAssumiUomo","after_crime_staff",()=>({function:"stAssumiUomo"}));
wrapFn("stLicenziaUomo","after_crime_staff",()=>({function:"stLicenziaUomo"}));
wrapFn("stImpostaProtezione","after_protection_change",()=>({function:"stImpostaProtezione"}));
wrapFn("stCompraFerro","after_crime_purchase",()=>({function:"stCompraFerro"}));
wrapFn("stToggleAvvocato","after_lawyer_toggle",()=>({function:"stToggleAvvocato"}));
wrapFn("stCompraAttivita","after_crime_business_purchase",a=>({function:"stCompraAttivita",attivita_id:a[0]}));
wrapFn("stMollaIlGiro","after_leave_crime",()=>({function:"stMollaIlGiro"}));

/* Telefono/social. */
if(typeof telScrivi==="function"){
  const old=telScrivi;
  telScrivi=function(){
    const ok=old.apply(this,arguments);
    if(ok) setTimeout(()=>emitHook("after_lafamegram_post",{}),0);
    return ok;
  };
}
if(typeof postaEvento==="function"){
  const old=postaEvento;
  postaEvento=function(){
    const r=old.apply(this,arguments);
    setTimeout(()=>emitHook("after_lafamegram_event",{}),0);
    return r;
  };
}
if(typeof telAggiornaFeed==="function"){
  const old=telAggiornaFeed;
  telAggiornaFeed=function(){
    const r=old.apply(this,arguments);
    setTimeout(()=>emitHook("after_feed_refresh",{}),1200);
    return r;
  };
}

/* Acquisti e lifestyle: gli handler vengono ricreati ad ogni render, quindi
   intercettiamo il click in capture e controlliamo lo stato subito dopo. */
document.addEventListener("click",ev=>{
  const hear=ev.target.closest&&ev.target.closest("[data-hear]");
  if(hear){
    const i=+hear.dataset.hear, b=G.market&&G.market[i];
    setTimeout(()=>emitHook("after_beat_market_action",{action:"listen",beat:b&&b.n}),20);
  }
  const drop=ev.target.closest&&ev.target.closest("[data-drop]");
  if(drop){
    const i=+drop.dataset.drop, b=G.market&&G.market[i];
    setTimeout(()=>emitHook("after_beat_market_action",{action:"reject",beat:b&&b.n}),20);
  }
  const buy=ev.target.closest&&ev.target.closest("[data-buy]");
  if(buy){
    const i=+buy.dataset.buy, b=G.market&&G.market[i];
    setTimeout(()=>emitHook("after_beat_market_action",{action:"buy",beat:b&&b.n}),30);
  }
  const gear=ev.target.closest&&ev.target.closest("[data-gear]");
  if(gear){
    const id=gear.dataset.gear;
    setTimeout(()=>{ if(G.gear&&G.gear[id]) emitHook("after_gear_purchase",{gear_id:id}); },30);
  }
  const life=ev.target.closest&&ev.target.closest("[data-life]");
  if(life){
    const id=life.dataset.life, old=G.life&&G.life[id];
    setTimeout(()=>{ if(G.life&&G.life[id]!==old) emitHook("after_lifestyle_change",{life_id:id}); },30);
  }
  const cbuy=ev.target.closest&&ev.target.closest("[data-compra]");
  if(cbuy){
    const id=cbuy.dataset.compra;
    setTimeout(()=>emitHook("after_clothes_action",{action:"buy",clothes_id:id}),30);
  }
  const ceq=ev.target.closest&&ev.target.closest("[data-indossa]");
  if(ceq){
    const id=ceq.dataset.indossa;
    setTimeout(()=>emitHook("after_clothes_action",{action:"equip",clothes_id:id}),30);
  }
  const sign=ev.target.closest&&ev.target.closest("[data-sign]");
  if(sign){
    const id=sign.dataset.sign;
    setTimeout(()=>{ if(G.contract&&G.contract.id===id) emitHook("after_contract_sign",{offer_id:id},true); },40);
  }
},true);

/* -------------------- controlli +1/+7 accanto al calendario -------------------- */
const css=document.createElement("style");
css.textContent=`
/* v1.2.1: i controlli del tempo vivono DENTRO .psett. In questo modo il
   render della plancia non può spingerli fuori dalla fascia superiore. */
.psett.adf-time-enabled{width:198px!important;padding:6px 10px 5px 14px!important;gap:1px!important;
  position:relative;box-sizing:border-box}
#adf-calendar-time{display:grid;grid-template-columns:1fr 1fr;gap:5px;width:100%;margin-top:3px;flex:none}
#adf-calendar-time button{display:flex;align-items:center;justify-content:center;gap:3px;height:25px;min-width:0;
  padding:0 5px;border-radius:6px;border:1px solid rgba(167,139,250,.62);
  background:linear-gradient(180deg,#211A30,#13111B);color:#E0D5FF;cursor:pointer;
  font:800 9px Figtree,system-ui,sans-serif;letter-spacing:.01em;white-space:nowrap}
#adf-calendar-time button.seven{color:#fff;border-color:#A78BFA;background:linear-gradient(180deg,#7C3AED,#5B21B6);
  box-shadow:0 3px 12px rgba(91,33,182,.25)}
#adf-calendar-time button:hover:not(:disabled){filter:brightness(1.12)}
#adf-calendar-time button:disabled{opacity:.48;cursor:not-allowed}
#adf-chain{display:none;min-width:13px;height:13px;border-radius:99px;background:#C4B5FD;color:#17121F;
  font-size:8px;font-weight:900;align-items:center;justify-content:center}
#adf-chain.on{display:inline-flex}
#adf-high-dot{position:absolute;right:8px;top:8px;width:6px;height:6px;border-radius:50%;background:#6B7280;
  box-shadow:0 0 0 2px rgba(107,114,128,.12)}
#adf-high-dot.ready{background:#EF4444;box-shadow:0 0 9px rgba(239,68,68,.8)}
@media(max-width:1250px){
  .psett.adf-time-enabled{width:176px!important;padding-left:9px!important;padding-right:8px!important}
  #adf-calendar-time button{font-size:8px;padding:0 3px}
}
`;
document.head.appendChild(css);

const notifCss=document.createElement("style");
notifCss.textContent=`
/* v1.2.13 — app Notifiche, coerente col telefono della repo */
.adf-notif-screen .tscreenhead b{margin-right:28px}
.adf-ntool{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.06);
  font:600 9.5px Figtree,system-ui,sans-serif;color:#727A8C}
.adf-ntool strong{color:#E8EAF0;font-weight:900}
.adf-ntool span{color:#F59E0B;font-weight:800}
.adf-ntool button{border:0;background:rgba(245,158,11,.1);color:#FBBF24;
  padding:5px 8px;border-radius:999px;font:800 8.5px Figtree,system-ui,sans-serif;
  text-transform:uppercase;letter-spacing:.04em;cursor:pointer}
.adf-nbody{padding:9px 10px 4px!important}
.adf-nlist{display:flex;flex-direction:column;gap:7px}
.adf-ncard{position:relative;padding:10px 10px 9px;border-radius:12px;
  background:#11141D;border:1px solid rgba(255,255,255,.06);
  box-shadow:0 3px 12px rgba(0,0,0,.12)}
.adf-ncard.unread{border-color:rgba(245,158,11,.48);
  background:linear-gradient(135deg,rgba(245,158,11,.09),#11141D 42%)}
.adf-ncard.unread::before{content:"";position:absolute;right:9px;top:10px;width:6px;height:6px;
  border-radius:50%;background:#F59E0B;box-shadow:0 0 8px rgba(245,158,11,.65)}
.adf-nmeta{display:flex;align-items:center;gap:5px;padding-right:12px;
  font-size:7.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#687083}
.adf-ntier{padding:2px 5px;border-radius:999px;background:rgba(255,255,255,.06);color:#AEB5C3}
.tier-low .adf-ntier{background:rgba(74,222,128,.1);color:#86EFAC}
.tier-medium .adf-ntier{background:rgba(245,158,11,.1);color:#FBBF24}
.tier-high .adf-ntier{background:rgba(239,68,68,.12);color:#FCA5A5}
.adf-ninterrupted{color:#A78BFA}
.adf-ncard h4{margin:6px 0 1px;font:800 11.5px Figtree,system-ui,sans-serif;color:#F1F3F7;
  line-height:1.22;padding-right:8px}
.adf-nfamily{font-size:8px;color:#697184;text-transform:uppercase;letter-spacing:.04em}
.adf-nchoice,.adf-nresult{margin:6px 0 0;font-size:9.5px;line-height:1.32;color:#99A1B0}
.adf-nchoice b{color:#C8CDD8}
.adf-nresult{color:#C5CAD4}
.adf-neffects{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px}
.adf-neff{padding:3px 5px;border-radius:6px;background:rgba(255,255,255,.055);
  color:#A8AFBD;font-size:8px;font-weight:700}
.adf-neff.pos{background:rgba(74,222,128,.09);color:#86EFAC}
.adf-neff.neg{background:rgba(239,68,68,.09);color:#FCA5A5}
`;
document.head.appendChild(notifCss);

const resultCss=document.createElement("style");
resultCss.textContent=`
#adf-result-overlay{position:fixed;inset:0;z-index:999999;display:none;align-items:center;justify-content:center;padding:24px;font-family:Figtree,system-ui,sans-serif}
#adf-result-overlay.on{display:flex}
.adf-rbackdrop{position:absolute;inset:0;background:rgba(3,4,8,.8);backdrop-filter:blur(8px)}
.adf-rcard{position:relative;width:min(540px,calc(100vw - 36px));max-height:calc(100vh - 36px);overflow:auto;border-radius:22px;padding:24px 24px 20px;background:linear-gradient(165deg,#1A1A21,#111218 72%);border:1px solid rgba(255,255,255,.11);box-shadow:0 30px 90px rgba(0,0,0,.62);color:#E8EAF0}
.adf-rcard::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:22px 0 0 22px;background:#4ADE80}
.adf-rcard.tier-medium::before{background:#F59E0B}.adf-rcard.tier-high::before{background:#EF4444}
.adf-rhead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
.adf-rkicker{font-size:10px;font-weight:900;letter-spacing:.13em;color:#8E95A5}
.adf-rtier{padding:4px 8px;border-radius:999px;background:rgba(74,222,128,.1);color:#86EFAC;font-size:9px;font-weight:900;letter-spacing:.08em}
.tier-medium .adf-rtier{background:rgba(245,158,11,.1);color:#FBBF24}.tier-high .adf-rtier{background:rgba(239,68,68,.12);color:#FCA5A5}
.adf-rcard h2{margin:0 0 16px;font-size:25px;line-height:1.08;color:#F6F7FA;letter-spacing:-.025em}
.adf-rchoice{display:flex;flex-direction:column;gap:4px;padding:12px 14px;border-radius:12px;background:#22232C;border:1px solid rgba(255,255,255,.075)}
.adf-rchoice span{font-size:9px;text-transform:uppercase;letter-spacing:.1em;font-weight:800;color:#777F91}.adf-rchoice strong{font-size:14px;color:#F1F2F6}
.adf-rstory{margin:13px 2px 0;font-size:14px;line-height:1.55;color:#C7CBD4}
.adf-rsection{margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.07)}
.adf-rlabel{display:block;margin-bottom:9px;font-size:9px;font-weight:900;letter-spacing:.12em;color:#777F91}
.adf-rchips{display:flex;flex-wrap:wrap;gap:7px}.adf-rchip{padding:6px 9px;border-radius:8px;background:rgba(255,255,255,.06);color:#B5BBC7;font-size:11px;font-weight:800}
.adf-rchip.pos{background:rgba(74,222,128,.1);color:#86EFAC}.adf-rchip.neg{background:rgba(239,68,68,.1);color:#FCA5A5}
.adf-rneutral{margin:0;color:#8E95A5;font-size:11.5px}
.adf-rfuture{display:flex;flex-direction:column;gap:3px;margin-top:16px;padding:11px 12px;border-radius:11px;background:rgba(124,58,237,.1);border:1px solid rgba(167,139,250,.17)}
.adf-rfuture b{font-size:11px;color:#C4B5FD}.adf-rfuture span{font-size:10px;color:#8E83A4}
#adf-result-continue{width:100%;height:42px;margin-top:19px;border:1px solid rgba(167,139,250,.6);border-radius:10px;background:linear-gradient(180deg,#7C3AED,#5B21B6);color:#fff;font:900 11px Figtree,system-ui,sans-serif;letter-spacing:.09em;cursor:pointer}
`;
document.head.appendChild(resultCss);

const socialCss=document.createElement("style");
socialCss.textContent=`
.adf-social-demo-panel{margin-bottom:10px;padding:9px;border-radius:12px;background:linear-gradient(145deg,rgba(214,41,118,.13),rgba(124,58,237,.09));border:1px solid rgba(214,41,118,.22)}
.adf-demo-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.adf-demo-title b{font-size:9px;letter-spacing:.09em;color:#F0A3C7}.adf-demo-title span{font-size:8px;color:#777F91}
.adf-demo-row{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
.adf-demo-row button,.adf-demo-skip{border:1px solid rgba(255,255,255,.08);border-radius:8px;background:#171923;color:#CED2DB;padding:7px 5px;font:800 8.5px Figtree,system-ui,sans-serif;cursor:pointer}
.adf-demo-skip{width:100%;margin-top:6px;color:#F5B2D2;border-color:rgba(214,41,118,.3);background:rgba(214,41,118,.09)}
.adf-demo-skip.armed{color:#86EFAC;border-color:rgba(74,222,128,.3);background:rgba(74,222,128,.08)}

.adf-social-post{overflow:hidden}
.adf-post-media{position:relative;height:205px;margin:0 -0px 9px;overflow:hidden;background:#222633}
.adf-post-media::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.03),transparent 36%,rgba(0,0,0,.28));mix-blend-mode:screen}
.adf-media-tag{position:absolute;left:8px;bottom:7px;z-index:8;padding:3px 6px;border-radius:4px;background:rgba(0,0,0,.55);color:#fff;font-size:7px;font-weight:900;letter-spacing:.08em}
.adf-avatar-placeholder{position:absolute;right:7px;bottom:7px;z-index:8;padding:3px 5px;border-radius:4px;background:rgba(124,58,237,.68);color:#EEE9FF;font-size:6.8px;font-weight:800}

.adf-photo-person{position:absolute;width:78px;height:132px;z-index:5;transform-origin:50% 100%}
.adf-photo-head{position:absolute;left:21px;top:0;width:39px;height:46px;border-radius:48% 48% 45% 45%;background:linear-gradient(145deg,#353946,#151720);box-shadow:inset 8px 0 8px rgba(255,255,255,.04)}
.adf-photo-body{position:absolute;left:5px;top:39px;width:70px;height:93px;border-radius:31px 31px 8px 8px;background:linear-gradient(145deg,#252936,#0D0F15)}
.adf-photo-person i{position:absolute;z-index:3;left:50%;bottom:9px;transform:translateX(-50%);padding:2px 4px;background:rgba(0,0,0,.48);border-radius:4px;color:#DADDE6;font:800 6.7px Figtree,sans-serif;white-space:nowrap}

.selfie{background:linear-gradient(180deg,#28344B 0%,#6A4B4F 52%,#151821 53%,#0B0D12 100%)}
.adf-photo-city{position:absolute;inset:0}
.adf-photo-city b{position:absolute;bottom:67px;width:50px;background:#111620;border-radius:3px 3px 0 0;box-shadow:inset 8px 8px 0 rgba(245,180,96,.14)}
.adf-photo-city b:nth-child(1){left:0;height:63px}.adf-photo-city b:nth-child(2){left:58px;height:88px}.adf-photo-city b:nth-child(3){right:48px;height:70px}.adf-photo-city b:nth-child(4){right:-8px;height:102px}
.adf-photo-flash{position:absolute;left:50%;top:37%;width:170px;height:170px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,244,220,.34),rgba(255,255,255,.06) 37%,transparent 67%)}
.adf-photo-pair{position:absolute;left:50%;bottom:-8px;width:190px;height:150px;transform:translateX(-50%) rotate(-2deg)}
.adf-photo-pair .fan{left:15px;bottom:0;transform:rotate(6deg) scale(.92)}.adf-photo-pair .player{right:20px;bottom:0;transform:rotate(-4deg) scale(1.05)}
.selfie{filter:saturate(.9) contrast(1.04)}

.fight{background:radial-gradient(circle at 20% 24%,#B43E31 0 4%,transparent 17%),radial-gradient(circle at 80% 18%,#4462A9 0 5%,transparent 19%),linear-gradient(145deg,#191724,#07080C)}
.adf-fight-lights{position:absolute;inset:-30px;background:repeating-linear-gradient(110deg,transparent 0 33px,rgba(255,255,255,.035) 34px 36px);transform:rotate(-7deg)}
.adf-fight-crowd{position:absolute;left:-10%;right:-10%;bottom:-30px;height:105px;background:radial-gradient(ellipse at 10% 30%,#141720 0 20px,transparent 21px),radial-gradient(ellipse at 30% 25%,#171A23 0 24px,transparent 25px),radial-gradient(ellipse at 55% 31%,#10121A 0 23px,transparent 24px),radial-gradient(ellipse at 78% 25%,#171A23 0 22px,transparent 23px),radial-gradient(ellipse at 95% 33%,#11141C 0 20px,transparent 21px)}
.adf-fight-figures{position:absolute;left:50%;bottom:8px;width:210px;height:145px;transform:translateX(-50%) rotate(1deg)}
.adf-fight-figures .fight-left{left:18px;bottom:0;transform:rotate(17deg) scale(1.04)}.adf-fight-figures .fight-right{right:24px;bottom:0;transform:rotate(-19deg) scale(1.02)}
.adf-motion{position:absolute;height:3px;border-radius:99px;background:rgba(255,255,255,.15);filter:blur(1px);transform:rotate(-18deg)}
.adf-motion.m1{left:20px;top:70px;width:150px}.adf-motion.m2{right:5px;top:105px;width:105px;transform:rotate(13deg)}
.adf-rec{position:absolute;right:8px;top:8px;color:#FF6C68;font:900 8px monospace;letter-spacing:.08em}
.fight{filter:contrast(1.13) saturate(.8)}

.freestyle{background:linear-gradient(180deg,#151E32,#15151F 55%,#090A0D)}
.adf-stage-light{position:absolute;top:-60px;width:120px;height:230px;filter:blur(9px);opacity:.28;transform:rotate(18deg);background:linear-gradient(180deg,#A9C6FF,transparent)}
.adf-stage-light.one{left:7px}.adf-stage-light.two{right:0;transform:rotate(-18deg);background:linear-gradient(180deg,#F2A4D3,transparent)}
.adf-stage-crowd{position:absolute;left:-8%;right:-8%;bottom:-16px;height:74px;background:repeating-radial-gradient(ellipse at 50% 100%,#0A0C12 0 12px,#11141B 13px 21px)}
.adf-freestyle-player{position:absolute;left:50%;bottom:25px;width:90px;height:135px;transform:translateX(-50%)}
.adf-freestyle-player .player{left:5px;bottom:0;transform:scale(1.04)}.adf-mic-stick{position:absolute;left:72px;top:29px;width:4px;height:83px;border-radius:4px;background:#71798A;transform:rotate(8deg);box-shadow:0 -6px 0 3px #242A35}
.adf-video-time{position:absolute;right:8px;top:8px;padding:3px 5px;border-radius:4px;background:rgba(0,0,0,.48);color:#fff;font:800 7px monospace}

.adf-comments{margin-left:10px;color:#7F8798;font-size:9px;font-weight:700}
.adf-post-public-note{margin:8px 10px 1px;padding:7px 8px;border-radius:8px;background:rgba(214,41,118,.07);color:#998A95;font-size:8.5px;line-height:1.35}

#adf-social-overlay{position:fixed;inset:0;z-index:1000000;display:none;align-items:center;justify-content:center;padding:22px;font-family:Figtree,system-ui,sans-serif}
#adf-social-overlay.on{display:flex}
.adf-social-backdrop{position:absolute;inset:0;background:rgba(2,3,7,.84);backdrop-filter:blur(10px)}
.adf-social-popup{position:relative;width:min(410px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;border-radius:24px;padding:13px;background:#0B0D13;border:1px solid rgba(255,255,255,.1);box-shadow:0 35px 110px rgba(0,0,0,.72)}
.adf-social-popup-head{display:flex;align-items:center;justify-content:space-between;padding:5px 3px 12px}
.adf-social-popup-head span{font-size:18px;font-weight:900;font-style:italic;color:#F4F0F5}.adf-social-popup-head b{font-size:8px;letter-spacing:.08em;color:#E164A0}
.adf-social-popup .tigpost{background:#11141B;border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:10px}
#adf-social-continue{width:100%;height:42px;margin-top:10px;border:0;border-radius:11px;background:linear-gradient(90deg,#D62976,#7C3AED);color:#fff;font:900 10px Figtree,sans-serif;letter-spacing:.09em;cursor:pointer}
`;
document.head.appendChild(socialCss);

const auditSocialCss=document.createElement("style");
auditSocialCss.textContent=`
.adf-generic-media{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;padding:16px;box-sizing:border-box;background:linear-gradient(145deg,#222633,#11141B)}
.adf-generic-media>b{position:relative;z-index:4;font-size:16px;letter-spacing:.04em;color:#F4F5F8}
.adf-generic-media>i{position:relative;z-index:4;margin-top:3px;font-size:9px;color:#A5ABB8}
.adf-generic-media .adf-photo-person{left:50%;bottom:12px;transform:translateX(-50%) scale(.9);opacity:.78}
.adf-generic-media .adf-generic-bg{position:absolute;inset:0;background:radial-gradient(circle at 20% 18%,rgba(124,58,237,.28),transparent 38%),radial-gradient(circle at 85% 70%,rgba(214,41,118,.18),transparent 42%),linear-gradient(160deg,#222735,#11131A)}
.adf-generic-media.ranking{justify-content:center;align-items:center;text-align:center;background:linear-gradient(145deg,#222A36,#0E1118)}
.adf-generic-media.ranking .adf-generic-big{font-size:70px;font-weight:900;line-height:.75;color:rgba(255,255,255,.08)}
.adf-generic-media.article{justify-content:flex-end;background:linear-gradient(180deg,#D9DDE3,#B8BEC8);color:#16181D}
.adf-generic-media.article>b,.adf-generic-media.article>i{color:#16181D}
.adf-generic-lines{position:absolute;left:18px;right:18px;top:28px;height:82px;background:repeating-linear-gradient(180deg,rgba(15,17,22,.75) 0 5px,transparent 5px 15px);opacity:.35}
.adf-generic-media.meme{justify-content:flex-end;background:linear-gradient(145deg,#29232F,#121217)}
.adf-generic-media.screenshot{justify-content:flex-end;background:#E7E9EE;color:#15171A}
.adf-generic-media.screenshot>b{color:#15171A}
.adf-screenbar{position:absolute;left:15px;right:15px;top:18px;height:16px;border-radius:8px;background:#B9BEC8}
.adf-screenlines{position:absolute;left:20px;right:20px;top:52px;height:90px;background:repeating-linear-gradient(180deg,#7E8590 0 5px,transparent 5px 15px);opacity:.45}
`;
document.head.appendChild(auditSocialCss);

const socialBannerCss=document.createElement("style");
socialBannerCss.textContent=`
#adf-social-banner{position:fixed;z-index:1200000;left:50%;top:12px;width:min(540px,calc(100vw - 28px));
transform:translate(-50%,-150%);opacity:0;transition:transform .32s cubic-bezier(.2,.9,.2,1),opacity .22s;
display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:start;padding:11px 12px;border-radius:18px;
background:rgba(20,22,29,.96);border:1px solid rgba(255,255,255,.12);box-shadow:0 20px 70px rgba(0,0,0,.46);
backdrop-filter:blur(18px);font-family:Figtree,system-ui,sans-serif;color:#F5F6F8}
#adf-social-banner.show{transform:translate(-50%,0);opacity:1}
.adf-sb-icon{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(145deg,#D62976,#7C3AED)}
.adf-sb-icon svg{width:19px;height:19px;fill:#fff}
.adf-sb-copy{min-width:0;display:flex;flex-direction:column;gap:2px}
.adf-sb-top{display:flex;gap:7px;align-items:center}.adf-sb-top b{font-size:11px}.adf-sb-top span{font-size:9px;color:#888F9D}
.adf-sb-copy strong{font-size:11px;line-height:1.2}.adf-sb-copy i{font-size:10px;line-height:1.3;color:#B7BCC7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:330px}
.adf-sb-copy small{margin-top:3px;font-size:9px;font-weight:800;color:#AAB1BE}
#adf-social-banner.positive .adf-sb-copy small{color:#86EFAC}
#adf-social-banner.negative .adf-sb-copy small{color:#FCA5A5}
.adf-sb-actions{display:flex;flex-direction:column;gap:5px}.adf-sb-actions button{border:0;border-radius:8px;padding:6px 8px;background:#2A2E39;color:#E9EBF0;font:900 8px Figtree,sans-serif;cursor:pointer}
.adf-sb-actions button:first-child{background:linear-gradient(90deg,#D62976,#7C3AED);color:#fff}
@media(max-width:650px){#adf-social-banner{grid-template-columns:36px 1fr;top:8px}.adf-sb-actions{grid-column:1/-1;flex-direction:row}.adf-sb-actions button{flex:1}.adf-sb-copy i{max-width:230px}}
`;
document.head.appendChild(socialBannerCss);

const socialInteractionCss=document.createElement("style");
socialInteractionCss.textContent=`
.adf-social-actions{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin:8px 0 2px}
.adf-social-actions button{min-width:0;border:0;border-radius:7px;padding:7px 3px;background:#191C24;color:#8E95A5;
font:800 7.4px Figtree,system-ui,sans-serif;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.adf-social-actions button:hover{background:#222631;color:#D8DCE5}
.adf-social-actions button.on{background:rgba(214,41,118,.12);color:#F09AC3}

.adf-thread{margin:8px 0 2px;padding:8px;border-radius:9px;background:#0D0F14;border:1px solid rgba(255,255,255,.05)}
.adf-thread-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.adf-thread-head b{font-size:8.5px;color:#D7DAE1}.adf-thread-head span{font-size:7px;color:#666D7A}
.adf-comment{display:grid;grid-template-columns:auto 1fr;gap:6px;padding:5px 0;border-top:1px solid rgba(255,255,255,.035)}
.adf-comment:first-of-type{border-top:0}
.adf-comment b{font-size:7.5px;color:#AEB4C0}.adf-comment span{font-size:8px;line-height:1.35;color:#818896}
.adf-comment.me{margin:3px -2px;padding:6px;border-radius:7px;background:rgba(124,58,237,.10);border-top:0}
.adf-comment.me b{color:#C4B5FD}.adf-comment.me span{color:#CDD0D8}

.adf-reply-panel{margin:7px 0 2px;padding:8px;border-radius:9px;background:#12151D;border:1px solid rgba(124,58,237,.18)}
.adf-reply-panel>span{display:block;margin-bottom:6px;color:#8E95A5;font-size:7.5px;font-weight:800}
.adf-reply-panel>div{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
.adf-reply-panel button{border:1px solid rgba(255,255,255,.07);border-radius:7px;padding:7px 5px;background:#1B1E27;color:#C7CBD4;font:800 7.5px Figtree,sans-serif;cursor:pointer}
.adf-reply-panel button.calm{border-color:rgba(74,222,128,.17);color:#A7F3D0}
.adf-reply-panel button.hot{border-color:rgba(239,68,68,.18);color:#FCA5A5}
.adf-reply-panel button.quiet{color:#777F91}
.adf-reply-done{margin:7px 0 2px;padding:7px 8px;border-radius:8px;background:rgba(124,58,237,.08);font-size:8px;line-height:1.35;color:#A8ADBA}
.adf-reply-done b{color:#C4B5FD}.adf-reply-done small{display:block;margin-top:3px;color:#7D8491}
.adf-interaction-result{margin-top:5px;font-size:7.5px;font-weight:800;color:#8E95A5}
.adf-repost-head{margin:-2px 0 7px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.06);font-size:7.5px;font-weight:900;color:#A78BFA}

.adf-story-tray{display:flex;gap:9px;overflow-x:auto;padding:4px 2px 10px;margin-bottom:4px;scrollbar-width:none}
.adf-story-tray::-webkit-scrollbar{display:none}
.adf-story-dot{flex:0 0 54px;border:0;background:transparent;color:#9097A4;cursor:pointer;padding:0}
.adf-story-ring{display:grid;place-items:center;width:43px;height:43px;margin:auto;border-radius:50%;padding:2px;
background:linear-gradient(145deg,#D62976,#F59E0B,#7C3AED)}
.adf-story-ring i{display:grid;place-items:center;width:39px;height:39px;border-radius:50%;background:#151820;color:#E9EBF1;
font:900 9px Figtree,sans-serif;font-style:normal;border:2px solid #0B0D13}
.adf-story-dot.mine .adf-story-ring{background:linear-gradient(145deg,#7C3AED,#60A5FA)}
.adf-story-dot b{display:block;margin-top:4px;font-size:6.7px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.adf-story-view{margin:0 0 10px;padding:9px;border-radius:12px;background:#0E1118;border:1px solid rgba(214,41,118,.16)}
.adf-story-view-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.adf-story-view-head b{font-size:9px;color:#E9EBF1}.adf-story-view-head button{border:0;background:transparent;color:#7E8592;font-size:18px;cursor:pointer}
.adf-story-view .adf-post-media{height:235px;border-radius:9px}
.adf-story-view>p{margin:7px 2px;font-size:8.5px;line-height:1.4;color:#B7BCC7}
.adf-own-story-note{padding:6px 8px;border-radius:8px;background:rgba(124,58,237,.08);color:#9187AD;font-size:7.5px}

@media(max-width:1180px){
  .adf-social-actions{grid-template-columns:repeat(3,1fr)}
  .adf-reply-panel>div{grid-template-columns:1fr}
}
`;
document.head.appendChild(socialInteractionCss);

function installCalendar(){
  const week=document.querySelector("#s-hub .psett") || document.querySelector(".psett");
  if(!week) return false;

  week.classList.add("adf-time-enabled");

  let box=document.getElementById("adf-calendar-time");
  if(!box){
    box=document.createElement("div");
    box.id="adf-calendar-time";
    box.setAttribute("aria-label","Avanza il tempo");
    box.innerHTML='<button id="adf-s1" type="button" title="Avanza di 1 giorno" onclick="window.ADF_TIME_SKIP&&window.ADF_TIME_SKIP(1)">▶ +1 giorno <span id="adf-chain"></span></button>'+
      '<button id="adf-s7" class="seven" type="button" title="Avanza di 7 giorni" onclick="window.ADF_TIME_SKIP&&window.ADF_TIME_SKIP(7)">» +7 giorni</button>';
    week.appendChild(box);

    const dot=document.createElement("span");
    dot.id="adf-high-dot";
    dot.title="Prossimo evento ALTO";
    week.appendChild(dot);
  }else if(box.parentElement!==week){
    week.appendChild(box);
  }

  const b1=document.getElementById("adf-s1");
  const b7=document.getElementById("adf-s7");
  updateCalendarControls();
  return true;
}

function updateCalendarControls(){
  const s=st();
  const b1=document.getElementById("adf-s1"), b7=document.getElementById("adf-s7");

  /* v1.2.4:
     NON disabilitare i pulsanti in base a overlayBusy().
     Dopo uno skip settimanale il report è ancora aperto quando renderHub()
     aggiorna la barra; prima il bottone veniva messo disabled=true e nessuno
     lo riabilitava alla chiusura del report. Risultato: un solo skip possibile.
     Ora restano abilitati e il blocco viene valutato soltanto al click. */
  const locked=!ADF.ready || ADF.skipRunning;
  if(b1) b1.disabled=locked;
  if(b7) b7.disabled=locked;

  const c=document.getElementById("adf-chain");
  if(c){
    if(s.skip1Chain>0){ c.textContent=s.skip1Chain;c.classList.add("on"); }
    else{ c.textContent="";c.classList.remove("on"); }
  }
  const dot=document.getElementById("adf-high-dot");
  if(dot){
    const d=s.nextHighDue-absDay();
    dot.classList.toggle("ready",d<=0);
    dot.title=d<=0 ? "Evento ALTO pronto" : "Prossimo ALTO tra circa "+d+" giorni";
  }
}

/* Aggancio diretto a renderHub: anche se in futuro la plancia viene ricreata,
   i controlli vengono riappesi immediatamente dopo il render. */
try{
  if(typeof renderHub==="function" && !renderHub.__adfCalendarWrapped){
    const _renderHubCalendar=renderHub;
    renderHub=function(){
      const r=_renderHubCalendar.apply(this,arguments);
      setTimeout(()=>{installCalendar();updateCalendarControls();},0);
      return r;
    };
    renderHub.__adfCalendarWrapped=true;
  }
}catch(_){ }

function refreshHub(){
  try{ if(typeof renderHub==="function") renderHub(); }catch(_){ }
  installCalendar();
  updateCalendarControls();
}

/* Tre reti di sicurezza: esecuzione immediata, DOMContentLoaded/load e un
   breve retry. Non aspettiamo più che il catalogo JSON finisca di caricarsi
   per far APPARIRE i tasti. */
installCalendar();
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",installCalendar,{once:true});
window.addEventListener("load",()=>{installCalendar();updateCalendarControls();},{once:true});
let adfInstallTries=0;
const adfInstallTimer=setInterval(()=>{
  adfInstallTries++;
  if(installCalendar() || adfInstallTries>=40) clearInterval(adfInstallTimer);
},250);

const obs=new MutationObserver(()=>{
  if(!document.getElementById("adf-calendar-time")) installCalendar();
});
obs.observe(document.body,{childList:true,subtree:true});

/* Non contiamo i trial come eventi del catalogo, ma un trial/core stop ALTO
   deve comunque riaprire la finestra 10–15 giorni. */
const _showEvent=showEvent;
showEvent=function(e){
  if(e && !e.__adfCatalog && e.ph!=null) armHigh();
  const k=String((e&&e.k)||"").toLowerCase();
  if(k.includes("strada")){
    const s=st();
    s.lastLegacyStreetDay=absDay();
    s.stats.legacyStreet=(s.stats.legacyStreet||0)+1;
  }
  return _showEvent.apply(this,arguments);
};

/* Catalogo: caricato per ultimo, poi il motore diventa attivo. */
fetch(ADF_CATALOG_URL,{cache:"no-store"})
  .then(r=>{ if(!r.ok) throw new Error("Catalogo HTTP "+r.status); return r.json(); })
  .then(db=>{
    if(!Array.isArray(db) || db.length!==1000) throw new Error("Catalogo v1.2 non valido: "+(db&&db.length));
    ADF.db=db;
    ADF.byId=new Map(db.map(e=>[e.id,e]));
    ADF.ready=true;
    st();
    adfInstallNotificationApp();
    try{
      if(typeof TEL_APP==="undefined" || TEL_APP===null){
        if(typeof renderTelefono==="function") renderTelefono();
      }
    }catch(_){}
    const buildBadge=document.getElementById("adf-build-badge");
    if(buildBadge){ buildBadge.textContent="1000 OK · v1.2.13"; buildBadge.classList.add("ok"); }
    installCalendar();
    refreshHub();
    console.info("[Anni di Fame] Eventi v1.2.13 pronti:",db.length,"eventi");
    if(typeof toast==="function")
      setTimeout(()=>toast("<b>Eventi v1.2.13:</b> 1000 caricati.","good","◆",["#7C3AED","#4C1D95"]),300);
  })
  .catch(err=>{
    const buildBadge=document.getElementById("adf-build-badge");
    if(buildBadge){ buildBadge.textContent="ERRORE EVENTI"; buildBadge.classList.add("err"); }
    console.error("[Anni di Fame] Eventi v1.2.13 non caricati",err);
    if(typeof toast==="function")
      toast("<b>Eventi v1.2 non caricati.</b> "+String(err.message||err),"bad","!",["#B91C1C","#7F1D1D"]);
  });

window.ADF_CAN_SKIP_TIME=function(){
  return ADF.ready && !ADF.skipRunning && !overlayBusy() && !G.ended;
};

/* Bridge unico per i controlli +1/+7 e per gli eventi a minuti.
   Non crea un secondo centro notifiche: usa lo store di Eventi V2. */
window.ADF_TIME_SKIP=function(n){
  n=Math.max(1,Math.floor(Number(n)||1));
  if(!window.ADF_CAN_SKIP_TIME()) return false;
  saltaGiorni(n);
  return true;
};
ADF.addNotification=function(data){
  data=data||{};
  const store=adfNotifStore(), when=adfNotifWhen(), s=st();
  const tier=data.tier==="alto"?"high":data.tier==="medio"?"medium":data.tier==="basso"?"low":(data.tier||"low");
  const n={
    nid:"N"+(++s.notificationSeq), eventId:data.eventId||data.id||"clock", tier:tier,
    title:data.title||"Evento", family:data.family||"Tempo", description:data.description||"",
    choice:data.choice||"", result:data.result||data.text||data.title||"Evento", effects:data.effects||[],
    year:when.year,week:when.week,day:when.day,absDay:when.absDay,
    source:data.source||"game-time",deliverySuppressed:true,interrupted:!!data.interrupted,read:!!data.read
  };
  store.unshift(n); if(store.length>250) store.length=250;
  adfNotificationBadgeRefresh();
  try{ save(); }catch(_){}
  return n;
};

window.ADF_EVENTI.debug=function(){
  const s=st();
  return {
    ready:ADF.ready,events:ADF.db.length,day:absDay(),
    nextHighIn:s.nextHighDue-absDay(),normalDays:s.normalDays,nextNormalAt:s.nextNormalAt,
    skip1Chain:s.skip1Chain,scheduled:s.scheduled.slice(),
    lastLegacyStreetDay:s.lastLegacyStreetDay,
    legacyStreetCooldownLeft:Math.max(0,14-(absDay()-s.lastLegacyStreetDay)),
    notifications:s.notifications.length,
    notificationsUnread:s.notifications.filter(n=>!n.read).length,
    skipNotificationsExclusive:true,
    socialPosts:(G.lafamegramEventi||[]).filter(p=>p&&p.adfSocial).length,
    socialAlerts:(s.runtime.socialAlerts||[]).length,
    socialRecentAccounts:(s.runtime.socialRecentAccounts||[]).slice(),
    socialRecentCaptions:(s.runtime.socialRecentCaptions||[]).slice(),
    manualSocialReview:"68 reviewed: 50 disabled / 18 kept+reworked",
    socialInteractionHistory:(s.runtime.socialInteractionHistory||[]).slice(0,15),
    activeStories:adfSocialStoryList().length,
    socialArcState:s.runtime.socialArcState,
    socialImpactHistory:(s.runtime.socialImpactHistory||[]).slice(0,12),
    lastSkipInterruptedDay:s.runtime.lastSkipInterruptedDay,
    lastSkipInterruptedAfter:s.runtime.lastSkipInterruptedAfter,
    stats:Object.assign({},s.stats)
  };
};

})();