(function(){
"use strict";

/* ============================================================
   ANNI DI FAME — EVENTI DI LAVORO
   ------------------------------------------------------------
   Un solo strato per le famiglie del punto 10.

   Regole:
   - usa stato reale (G.workplaces, G.gente, Agenda, Strada, carriera);
   - non duplica straordinari, contatti iniziali o lead Fabbrica già esistenti;
   - un turno può produrre al massimo un evento automatico;
   - il conflitto con la musica si decide PRIMA del turno, quindi non vengono
     scalati energia e ore prima che il giocatore scelga;
   - i normali eventi dopo-turno partono solo dopo che il clock ha committato
     davvero il turno.
   ============================================================ */

const CFG = Object.freeze({
  cooldown:Object.freeze({
    career:7,
    colleague:4,
    music:6,
    crime:10,
    physical:3
  }),
  chance:Object.freeze({
    colleague:.16,
    music:.14,
    crime:.12,
    physical:.24
  }),
  career:Object.freeze({
    raisePct:8,
    promotionPct:15
  }),
  crime:Object.freeze({
    bonusPct:15,
    extraHeat:2,
    durataGiorni:7
  })
});

/* Le otto famiglie del punto 10. Alcune sono orchestrate qui, altre (come
   lo straordinario Fabbrica) conservano il loro motore storico ma registrano
   gli esiti nello stesso stato persistente. */
const FAMILIES = Object.freeze({
  discipline:Object.freeze({id:"discipline",label:"Presenze e disciplina"}),
  career:Object.freeze({id:"career",label:"Carriera"}),
  overtime:Object.freeze({id:"overtime",label:"Straordinari e richieste"}),
  colleague:Object.freeze({id:"colleague",label:"Colleghi"}),
  music:Object.freeze({id:"music",label:"Opportunità musicali"}),
  crime:Object.freeze({id:"crime",label:"Opportunità criminali"}),
  conflict:Object.freeze({id:"conflict",label:"Conflitto lavoro/musica"}),
  physical:Object.freeze({id:"physical",label:"Conseguenze fisiche/mentali"})
});

const MUSIC_AGENDA_IDS = new Set(["live","free","sala","promo"]);
const CRIME_JOBS = new Set(["buttafuori","fattorino"]);
let bypassConflict = null;
let pendingConflictMiss = null;

function nclamp(v,min,max){
  v=Number(v)||0;
  return Math.max(min,Math.min(max,v));
}

function absDay(){
  return (((Number(G.year)||1)-1)*52 + ((Number(G.week)||1)-1))*7 +
    (Number(G.day)||1);
}

function workKey(job){
  if(!job) return null;
  if(typeof lavoroReteChiave==="function") return lavoroReteChiave(job);
  if(typeof lavoroLuogo==="function") return lavoroLuogo(job) || job.id || null;
  return job.place || job.id || null;
}

function state(job){
  const key=workKey(job);
  if(!key) return null;

  let sede=null;
  if(typeof lavoroSede==="function") sede=lavoroSede(key);
  else{
    if(!G.workplaces || typeof G.workplaces!=="object") G.workplaces={};
    if(!G.workplaces[key] || typeof G.workplaces[key]!=="object") G.workplaces[key]={};
    sede=G.workplaces[key];
  }

  if(!sede.workEvents || typeof sede.workEvents!=="object"){
    sede.workEvents={
      lastFamilyDay:{},
      history:[],
      musicLead:null,
      crimeLead:null
    };
  }
  const s=sede.workEvents;
  if(!s.lastFamilyDay || typeof s.lastFamilyDay!=="object") s.lastFamilyDay={};
  if(!Array.isArray(s.history)) s.history=[];
  return s;
}

function familyReady(s,family){
  if(!s) return false;
  const cd=Number(CFG.cooldown[family]||0);
  const last=Number(s.lastFamilyDay[family]);
  return !Number.isFinite(last) || absDay()-last>=cd;
}

function record(s,family,data){
  if(!s) return null;
  s.lastFamilyDay[family]=absDay();
  const row=Object.assign({
    family,
    absoluteDay:absDay(),
    year:Number(G.year)||1,
    week:Number(G.week)||1,
    day:Number(G.day)||1
  },data||{});
  s.history.unshift(row);
  if(s.history.length>40) s.history.length=40;
  try{ if(typeof save==="function") save(); }catch(_){}
  return row;
}

function notify(data){
  try{
    if(window.ADF_EVENTI && typeof ADF_EVENTI.addNotification==="function")
      return ADF_EVENTI.addNotification(data);
  }catch(_){}
  return null;
}

function claim(source){
  try{
    if(window.ADF_EVENTI && typeof ADF_EVENTI.claimAutoEvent==="function")
      return ADF_EVENTI.claimAutoEvent(source);
  }catch(_){}
  return true;
}

function addNetwork(v){
  if(typeof gain==="function"){ gain("rete",Number(v)||0); return; }
  if(!G.skills) G.skills={};
  G.skills.rete=Number(G.skills.rete||0)+Number(v||0);
}

function addLucidity(v){
  if(typeof addLuc==="function"){ addLuc(Number(v)||0); return; }
  G.lucidita=nclamp(Number(G.lucidita||50)+Number(v||0),0,100);
}

function addWellbeing(v){
  G.wellbeing=nclamp(Number(G.wellbeing||0)+Number(v||0),0,100);
}

function relation(p,v){
  if(!p) return;
  if(typeof chatAvvicina==="function"){ chatAvvicina(p,Number(v)||0); return; }
  if(Number(v)>0 && typeof postoAvvicinaContattoLavoro==="function"){
    postoAvvicinaContattoLavoro(p,Number(v)||0);
    return;
  }
  p.pt=Math.max(0,Number(p.pt||0)+Number(v||0));
}

function currentContacts(key){
  return (G.gente||[]).filter(p => p && !p.via && p.origineLuogo===key);
}

function fmtTime(m){
  try{
    if(window.GAME_TIME && typeof GAME_TIME.format==="function") return GAME_TIME.format(m);
  }catch(_){}
  const n=((Math.round(Number(m)||0)%1440)+1440)%1440;
  return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
}

/* ==================== 7. CONFLITTO LAVORO / MUSICA ==================== */

function conflictForShift(){
  if(!G.job || !window.AGENDA || typeof AGENDA.conflittiTra!=="function") return null;
  if(!window.GAME_TIME || typeof GAME_TIME.now!=="function" ||
     typeof GAME_TIME.durationFor!=="function") return null;

  const from=Number(GAME_TIME.now());
  const duration=Number(GAME_TIME.durationFor("turno"));
  if(!Number.isFinite(from) || !Number.isFinite(duration) || duration<=0) return null;
  const to=from+duration;

  const list=AGENDA.conflittiTra(from,to)
    .filter(v => v && MUSIC_AGENDA_IDS.has(v.id));
  if(!list.length) return null;

  return {voice:list[0],from,to,duration};
}

function guardAction(id){
  if(id!=="turno" || !G.job) return {ok:true};

  const key=workKey(G.job);
  if(bypassConflict && bypassConflict.key===key && bypassConflict.day===absDay()){
    bypassConflict=null;
    return {ok:true,bypass:true};
  }

  const hit=conflictForShift();
  if(!hit) return {ok:true};

  const v=hit.voice;
  const s=state(G.job);

  /* È una scelta richiesta dal giocatore PRIMA della mossa, non un evento
     automatico: non occupa la chiave minuto dell'arbitro. Se chiudi e riprovi,
     la decisione deve poter ricomparire nello stesso minuto. */
  if(typeof showEvent!=="function") return {ok:true};

  showEvent({
    k:(G.job.n||"Lavoro")+" · Conflitto",
    t:"Il turno si mangia "+v.n,
    d:"Se entri adesso lavori dalle <b>"+fmtTime(hit.from)+"</b> alle <b>"+
      fmtTime(hit.to)+"</b>. In Agenda hai <b>"+v.n+"</b> alle <b>"+v.ora+
      "</b>.<br><br>Le due cose si sovrappongono davvero: non puoi fare finta di essere in entrambi i posti.",
    annulla(){},
    opts:[
      {n:"Vai al turno",d:"Prendi paga e presenza, ma perdi l'appuntamento",run(){
        /* Non togliamo ancora la voce: il secondo avvio può comunque essere
           respinto da luogo/orario. La perdita viene committata solo dopo che
           il clock certifica che il turno ha davvero attraversato l'evento. */
        pendingConflictMiss={voice:v,key,day:absDay(),jobId:G.job&&G.job.id};
        bypassConflict={key,day:absDay()};
        setTimeout(()=>{
          if(typeof avviaAzioneDiretta==="function") avviaAzioneDiretta("turno");
        },60);
        return null;
      }},
      {n:"Tieni l'appuntamento",d:"Non fai il turno: niente paga e il lavoro resta scoperto",run(){
        pendingConflictMiss=null;
        record(s,"conflict",{
          choice:"music",
          jobId:G.job&&G.job.id,
          appointmentId:v.id,
          appointmentName:v.n,
          appointmentTime:v.ora
        });
        addLucidity(1);
        return {t:"Hai tenuto libero il tempo per <b>"+v.n+"</b>. Il turno non è stato fatto.",c:""};
      }}
    ]
  });

  return {ok:false,handled:true,reason:"work-music-conflict",conflict:hit};
}

/* ==================== 2. CARRIERA ==================== */

function careerCandidate(job){
  if(!job || typeof lavoroLuogo!=="function") return null;
  const luogo=lavoroLuogo(job);
  if(luogo!=="fabbrica") return null;

  if(typeof lavoroPromozioneDisponibile==="function" && lavoroPromozioneDisponibile(luogo)){
    const next=typeof lavoroProssimoRuolo==="function" ? lavoroProssimoRuolo(luogo) : null;
    return next ? {type:"promotion",place:luogo,next} : null;
  }
  if(typeof lavoroAumentoDisponibile==="function" && lavoroAumentoDisponibile(luogo))
    return {type:"raise",place:luogo};
  return null;
}

function showCareer(job,s,candidate){
  if(!candidate || !familyReady(s,"career") || !claim("work-career")) return false;
  if(typeof showEvent!=="function") return false;

  record(s,"career",{status:"offered",type:candidate.type,jobId:job.id});

  if(candidate.type==="promotion"){
    const target=candidate.next;
    showEvent({
      k:"Fabbrica · Carriera",
      t:"Il capo ti chiede di fermarti",
      d:"Le presenze e l'affidabilità hanno superato la soglia. Ti propone di passare a <b>"+
        target.n+"</b>. Non è un premio finto: se accetti cambiano davvero mansione e paga, mentre anzianità e cartellino restano della Fabbrica.",
      annulla(){},
      opts:[
        {n:"Accetta la promozione",d:"Nuovo ruolo · paga base più alta",run(){
          const prima=Number(G.job&&G.job.pay||0);
          const nuova=Math.max(prima+1,Math.round(prima*(1+CFG.career.promotionPct/100)));
          const out=typeof lavoroPromuoviRuolo==="function"
            ? lavoroPromuoviRuolo(candidate.place,{nuovaPaga:nuova,motivo:"evento carriera"})
            : null;
          record(s,"career",{status:out?"accepted":"expired",type:"promotion",
            from:out&&out.da&&out.da.id,to:out&&out.a&&out.a.id,
            payBefore:out&&out.pagaPrima,payAfter:out&&out.pagaDopo});
          return out
            ? {t:"Da oggi sei <b>"+out.a.n+"</b>. Paga base: <b>"+out.pagaDopo+" €</b> a turno.",c:"good"}
            : {t:"La promozione non è più disponibile.",c:""};
        }},
        {n:"Resta nel ruolo attuale",d:"Nessun cambio oggi: la candidatura potrà tornare",run(){
          record(s,"career",{status:"declined",type:"promotion"});
          return {t:"Hai rifiutato la promozione. Resti nel ruolo attuale.",c:""};
        }}
      ]
    });
    return true;
  }

  showEvent({
    k:"Fabbrica · Carriera",
    t:"Ti propongono un aumento",
    d:"Il ciclo di lavoro è stato abbastanza solido da aprire un aumento reale della paga base. Se accetti, anche le maggiorazioni future partiranno dal nuovo importo.",
    annulla(){},
    opts:[
      {n:"Accetta +"+CFG.career.raisePct+"%",d:"La paga cambia da questo momento",run(){
        const out=typeof lavoroApplicaAumento==="function"
          ? lavoroApplicaAumento(candidate.place,{percentuale:CFG.career.raisePct,motivo:"evento carriera"})
          : null;
        record(s,"career",{status:out?"accepted":"expired",type:"raise",
          payBefore:out&&out.prima,payAfter:out&&out.dopo});
        return out
          ? {t:"Aumento accettato: da <b>"+out.prima+" €</b> a <b>"+out.dopo+" €</b> a turno.",c:"good"}
          : {t:"L'aumento non è più disponibile.",c:""};
      }},
      {n:"Rifiuta",d:"La paga resta quella attuale",run(){
        record(s,"career",{status:"declined",type:"raise"});
        return {t:"Hai rifiutato l'aumento. La paga resta invariata.",c:""};
      }}
    ]
  });
  return true;
}

/* ==================== 4. COLLEGHI ==================== */

function showColleague(job,s,roll){
  if(!familyReady(s,"colleague")) return false;
  if(Number(roll)>=CFG.chance.colleague) return false;

  const key=workKey(job);
  const people=currentContacts(key);
  if(!people.length || !claim("work-colleague")) return false;

  const p=people[Math.floor(Math.random()*people.length)];
  const tension=Math.random()<.35;
  record(s,"colleague",{status:"shown",personId:p.id,variant:tension?"tension":"favor"});

  if(typeof showEvent!=="function") return false;
  if(tension){
    showEvent({
      k:(job.n||"Lavoro")+" · Colleghi",
      t:p.n+" oggi è intrattabile",
      d:"A fine turno una cosa piccola diventa una discussione. Se la gestisci male il rapporto si rovina; se la chiudi bene, domani lavorate ancora fianco a fianco.",
      annulla(){},
      opts:[
        {n:"Chiarisci",d:"Provi a chiuderla senza trascinarla fuori dal lavoro",run(){
          relation(p,1); addLucidity(1);
          record(s,"colleague",{status:"resolved",personId:p.id,choice:"clarify"});
          return {t:"La tensione scende. Con <b>"+p.n+"</b> il rapporto regge.",c:"good"};
        }},
        {n:"Rispondi male",d:"Scarichi la tensione, ma il rapporto peggiora",run(){
          relation(p,-2); addWellbeing(-2);
          record(s,"colleague",{status:"worsened",personId:p.id,choice:"fight"});
          return {t:"Avete chiuso male. Domani vi ritrovate comunque nello stesso ambiente.",c:"bad"};
        }}
      ]
    });
  }else{
    showEvent({
      k:(job.n||"Lavoro")+" · Colleghi",
      t:p.n+" ti chiede una mano",
      d:"Non è una comparsa casuale: è una persona che hai già incontrato lavorando. Decidi che tipo di rapporto costruire.",
      annulla(){},
      opts:[
        {n:"Dagli una mano",d:"+rapporto · +rete · un po' di fatica",run(){
          relation(p,2); addNetwork(.4); addWellbeing(-1);
          record(s,"colleague",{status:"helped",personId:p.id});
          return {t:"Hai coperto <b>"+p.n+"</b>. Il rapporto sul lavoro si è fatto più solido.",c:"good"};
        }},
        {n:"Parlate e basta",d:"+rapporto · +benessere",run(){
          relation(p,1); addWellbeing(2);
          record(s,"colleague",{status:"talked",personId:p.id});
          return {t:"Niente favori grossi: avete solo parlato un po'. Anche quello costruisce un rapporto.",c:""};
        }}
      ]
    });
  }
  return true;
}

/* ==================== 5. OPPORTUNITÀ MUSICALI ==================== */

function musicPeople(job){
  const key=workKey(job);
  return currentContacts(key).filter(p =>
    p.numero && ["beatmaker","fonico","rapper","promoter","videomaker"].includes(p.ruolo)
  );
}

function showMusic(job,s,roll){
  if(!familyReady(s,"music") || Number(roll)>=CFG.chance.music) return false;
  if(s.musicLead && Number(s.musicLead.expiresAbsoluteDay)>=absDay()) return false;

  const people=musicPeople(job);
  if(!people.length || !claim("work-music")) return false;

  const p=people[Math.floor(Math.random()*people.length)];
  record(s,"music",{status:"shown",personId:p.id,role:p.ruolo});

  if(typeof showEvent!=="function") return false;

  if(p.ruolo==="beatmaker" && typeof chatMandaBeat==="function"){
    showEvent({
      k:(job.n||"Lavoro")+" · Musica",
      t:p.n+" ti ferma prima di andare",
      d:"Fuori dal turno torna fuori la musica. <b>"+p.n+"</b> ha un beat che secondo lui può funzionare su di te.",
      annulla(){},
      opts:[
        {n:"Fattelo mandare",d:"Il beat entra davvero nel catalogo",run(){
          const beat=chatMandaBeat(p);
          relation(p,1);
          record(s,"music",{status:beat?"accepted":"failed",personId:p.id,
            kind:"beat",beat:beat&&beat.n});
          return beat
            ? {t:"«<b>"+beat.n+"</b>» è nel catalogo: qualità "+beat.q+" · "+beat.price+" €.",c:"good"}
            : {t:"Non è riuscito a mandartelo.",c:""};
        }},
        {n:"Non adesso",d:"Nessun beat aggiunto",run(){
          record(s,"music",{status:"declined",personId:p.id,kind:"beat"});
          return {t:"Hai lasciato perdere il beat.",c:""};
        }}
      ]
    });
    return true;
  }

  const mult=p.ruolo==="promoter" ? 1.25 : 1.15;
  showEvent({
    k:(job.n||"Lavoro")+" · Musica",
    t:p.n+" ha una porta da aprirti",
    d:"Il contatto nato sul lavoro può trasformarsi in qualcosa di musicale. Se accetti, la <b>prossima serata live entro 7 giorni</b> parte con una spinta reale.",
    annulla(){},
    opts:[
      {n:"Prendi il contatto",d:"Bonus reale sulla prossima serata live",run(){
        s.musicLead={
          kind:"live",
          multiplier:mult,
          sourcePersonId:p.id,
          sourceName:p.n,
          sourceRole:p.ruolo,
          acceptedAbsoluteDay:absDay(),
          expiresAbsoluteDay:absDay()+7
        };
        relation(p,1); addNetwork(.5);
        record(s,"music",{status:"accepted",personId:p.id,kind:"live",
          multiplier:mult,expiresAbsoluteDay:s.musicLead.expiresAbsoluteDay});
        return {t:"Occasione aperta: la prossima serata live entro 7 giorni avrà una spinta da <b>"+p.n+"</b>.",c:"good"};
      }},
      {n:"Lascia stare",d:"Non consumi il rapporto",run(){
        record(s,"music",{status:"declined",personId:p.id,kind:"live"});
        return {t:"Hai lasciato passare l'occasione.",c:""};
      }}
    ]
  });
  return true;
}

function activeLead(field,kind){
  const today=absDay();
  for(const sede of Object.values(G.workplaces||{})){
    if(!sede || typeof sede!=="object" || !sede.workEvents) continue;
    const s=sede.workEvents;
    const lead=s[field];
    if(!lead) continue;
    if(Number(lead.expiresAbsoluteDay)<today){
      s[field]=null;
      continue;
    }
    if(!kind || lead.kind===kind) return {state:s,lead};
  }
  return null;
}

function consumeMusicLead(kind){
  const hit=activeLead("musicLead",kind||"live");
  if(!hit) return null;
  const out=Object.assign({},hit.lead,{consumedAbsoluteDay:absDay()});
  hit.state.musicLead=null;
  record(hit.state,"music",{status:"consumed",kind:out.kind,
    sourcePersonId:out.sourcePersonId,multiplier:out.multiplier});
  return out;
}

/* ==================== 6. OPPORTUNITÀ CRIMINALI ==================== */

function streetStarted(){
  try{
    if(typeof stradaGiroAvviato==="function") return !!stradaGiroAvviato();
  }catch(_){}
  return !!(G.strada&&G.strada.giroAvviato);
}

function showCrime(job,s,roll){
  if(!job || !CRIME_JOBS.has(job.id)) return false;
  if(!streetStarted() || (G.strada&&G.strada.arresto)) return false;
  if(!familyReady(s,"crime") || Number(roll)>=CFG.chance.crime) return false;
  if(activeLead("crimeLead")) return false;

  /* La Fabbrica ha già un lead dedicato, con numeri e varianti proprie. */
  if(typeof lavoroLuogo==="function" && lavoroLuogo(job)==="fabbrica") return false;
  if(!claim("work-crime")) return false;

  record(s,"crime",{status:"shown",jobId:job.id});
  if(typeof showEvent!=="function") return false;

  const source=job.id==="buttafuori" ? "fuori dal locale" : "durante le consegne";
  showEvent({
    k:(job.n||"Lavoro")+" · Strada",
    t:"Una proposta che col lavoro c'entra solo a metà",
    d:"Una persona che hai incrociato "+source+" sa che frequenti già la Strada. Non ti apre quel mondo da zero: ti passa una dritta perché ci sei già dentro.",
    annulla(){},
    opts:[
      {n:"Prendi la dritta",d:"7 giorni · +"+CFG.crime.bonusPct+"% sul prossimo colpo · più attenzione",run(){
        s.crimeLead={
          kind:"next_crime",
          sourceJobId:job.id,
          sourceLabel:job.n||job.id,
          bonusPct:CFG.crime.bonusPct,
          extraHeat:CFG.crime.extraHeat,
          acceptedAbsoluteDay:absDay(),
          expiresAbsoluteDay:absDay()+CFG.crime.durataGiorni
        };
        record(s,"crime",{status:"accepted",jobId:job.id,
          bonusPct:s.crimeLead.bonusPct,extraHeat:s.crimeLead.extraHeat,
          expiresAbsoluteDay:s.crimeLead.expiresAbsoluteDay});
        return {t:"Dritta presa: vale sul prossimo colpo entro 7 giorni. Più guadagno, ma anche più attenzione.",c:"good"};
      }},
      {n:"Lascia perdere",d:"Nessun effetto sulla Strada",run(){
        record(s,"crime",{status:"declined",jobId:job.id});
        return {t:"Hai lasciato perdere la proposta.",c:""};
      }}
    ]
  });
  return true;
}

function crimeLeadActive(){
  const hit=activeLead("crimeLead");
  return hit ? Object.assign({},hit.lead) : null;
}

function consumeCrimeLead(success){
  const hit=activeLead("crimeLead");
  if(!hit) return null;
  const out=Object.assign({},hit.lead,{
    consumedAbsoluteDay:absDay(),
    success:!!success
  });
  hit.state.crimeLead=null;
  record(hit.state,"crime",{status:"consumed",jobId:out.sourceJobId,
    success:!!success,bonusPct:out.bonusPct,extraHeat:out.extraHeat});
  return out;
}

/* ==================== 8. CONSEGUENZE FISICHE / MENTALI ==================== */

function showPhysical(job,s,roll){
  const overworked=Number(G.shifts||0)>=4 || Number(G.wellbeing||100)<=35;
  if(!overworked || !familyReady(s,"physical") || Number(roll)>=CFG.chance.physical)
    return false;
  if(!claim("work-physical")) return false;

  record(s,"physical",{status:"shown",shifts:Number(G.shifts||0),wellbeing:Number(G.wellbeing||0)});
  if(typeof showEvent!=="function") return false;

  showEvent({
    k:(job.n||"Lavoro")+" · Stanchezza",
    t:"Il turno oggi ti è rimasto addosso",
    d:"Non è solo una frase: hai già accumulato parecchi turni o il benessere è basso. Come chiudi la giornata cambia davvero come stai.",
    annulla(){},
    opts:[
      {n:"Ti fermi qui",d:"+benessere · +lucidità",run(){
        addWellbeing(3); addLucidity(2);
        record(s,"physical",{status:"recovered",choice:"stop"});
        return {t:"Hai deciso di non tirare ancora. <b>Benessere +3 · lucidità +2.</b>",c:"good"};
      }},
      {n:"Tiri dritto",d:"−benessere · −lucidità",run(){
        addWellbeing(-4); addLucidity(-3);
        record(s,"physical",{status:"pushed",choice:"push"});
        return {t:"Hai ignorato la stanchezza. <b>Benessere −4 · lucidità −3.</b>",c:"bad"};
      }}
    ]
  });
  return true;
}

/* ==================== 3. STRAORDINARI E RICHIESTE ==================== */

function onOvertime(luogo,status,payload){
  if(!luogo) return null;
  const job=(G.job && workKey(G.job)===luogo)
    ? G.job
    : {id:luogo,place:luogo,n:luogo};
  const s=state(job);
  if(!s) return null;
  payload=payload||{};
  return record(s,"overtime",{
    status:status||"updated",
    overtimeType:payload.tipo||payload.overtimeType||null,
    targetAbsoluteDay:payload.targetAbsoluteDay==null ? null : Number(payload.targetAbsoluteDay),
    bonusPct:Number(payload.bonusPct||0),
    reliabilityDelta:Number(payload.affidabilitaDelta!=null
      ? payload.affidabilitaDelta
      : payload.reliabilityDelta||0)
  });
}

/* ==================== 1. PRESENZE / DISCIPLINA ==================== */

function onDiscipline(luogo,result){
  if(!result || !result.eligible) return null;
  const job=G.job || {id:luogo,place:luogo,n:luogo};
  const s=state(job);
  if(!s) return null;

  if(result.dismissed){
    record(s,"discipline",{status:"dismissed",absences:result.absences,
      warningsBefore:result.warningsBefore});
    return notify({
      eventId:"work-discipline-dismissal",
      tier:"medio",family:"Lavoro",
      title:"Licenziamento",
      result:"Le assenze ripetute hanno chiuso il rapporto di lavoro.",
      source:"work-discipline"
    });
  }
  if(result.warningAdded){
    record(s,"discipline",{status:"warning",absences:result.absences,
      warningsAfter:result.warningsAfter,reliabilityDelta:result.reliabilityDelta});
    return notify({
      eventId:"work-discipline-warning",
      tier:"basso",family:"Lavoro",
      title:"Richiamo formale",
      result:result.absences+" assenze nella settimana · affidabilità "+
        (result.reliabilityDelta>=0?"+":"")+result.reliabilityDelta+".",
      source:"work-discipline"
    });
  }
  if(result.absences>0){
    record(s,"discipline",{status:"absence",absences:result.absences,
      reliabilityDelta:result.reliabilityDelta});
    return notify({
      eventId:"work-discipline-absence",
      tier:"basso",family:"Lavoro",
      title:"Presenze sotto contratto",
      result:result.absences+" assenze · affidabilità "+
        (result.reliabilityDelta>=0?"+":"")+result.reliabilityDelta+".",
      source:"work-discipline"
    });
  }
  return null;
}

function onCycle(luogo,evaluation){
  if(!evaluation || !evaluation.eligible || !evaluation.perfect) return null;
  const job=G.job || {id:luogo,place:luogo,n:luogo};
  const s=state(job);
  if(s) record(s,"discipline",{status:"perfect-cycle",
    reliabilityDelta:evaluation.reliabilityDelta,fullWeeks:evaluation.fullWeeks});
  return notify({
    eventId:"work-perfect-cycle",
    tier:"basso",family:"Lavoro",
    title:"Quattro settimane complete",
    result:"Ciclo perfetto: affidabilità +"+Math.max(0,Number(evaluation.reliabilityDelta||0))+".",
    source:"work-discipline"
  });
}

/* ==================== DOPO IL TURNO ==================== */

/* Il conflitto scelto a favore del lavoro diventa "mancato" soltanto qui:
   siamo dopo il commit del clock e possiamo verificare che l'intervallo del
   turno abbia davvero attraversato l'appuntamento. */
function commitConflictMiss(payload,job,s){
  if(!pendingConflictMiss) return null;
  const p=pendingConflictMiss;
  pendingConflictMiss=null;

  if(p.day!==absDay() || !p.voice) return null;
  const from=Number(payload&&payload.started_at);
  const to=Number(payload&&payload.ended_at);
  const at=Number(p.voice.minuti);
  if(!Number.isFinite(from) || !Number.isFinite(to) || !Number.isFinite(at) ||
     !(at>=from && at<to)) return null;

  const missed=window.AGENDA && typeof AGENDA.mancaVoce==="function"
    ? AGENDA.mancaVoce(p.voice,"turno di lavoro")
    : null;
  record(s,"conflict",{
    choice:"work",
    jobId:p.jobId || (job&&job.id),
    appointmentId:p.voice.id,
    appointmentName:p.voice.n,
    appointmentTime:p.voice.ora,
    missed:!!missed,
    startedAt:from,
    endedAt:to
  });
  return missed;
}

function afterShift(payload,rolls){
  if(!G.job) return false;
  const job=G.job;
  const s=state(job);
  if(!s) return false;

  commitConflictMiss(payload,job,s);

  rolls=rolls||{};
  const r=name => Number.isFinite(Number(rolls[name])) ? Number(rolls[name]) : Math.random();

  const career=careerCandidate(job);
  if(career && showCareer(job,s,career)) return true;
  if(showMusic(job,s,r("music"))) return true;
  if(showCrime(job,s,r("crime"))) return true;
  if(showColleague(job,s,r("colleague"))) return true;
  if(showPhysical(job,s,r("physical"))) return true;

  return false;
}

window.ADF_WORK_EVENTS=Object.freeze({
  version:"1",
  families:FAMILIES,
  guardAction,
  afterShift,
  onDiscipline,
  onCycle,
  onOvertime,
  consumeMusicLead,
  crimeLeadActive,
  consumeCrimeLead,
  stateForJob:state,
  conflictForShift,
  debug(){
    return {
      job:G.job ? Object.assign({},G.job) : null,
      key:workKey(G.job),
      conflict:conflictForShift(),
      musicLead:activeLead("musicLead"),
      crimeLead:activeLead("crimeLead")
    };
  }
});

})();