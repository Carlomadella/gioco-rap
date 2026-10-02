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
    role:6,
    factory:4,
    physical:3
  }),
  chance:Object.freeze({
    colleague:.16,
    music:.14,
    crime:.12,
    role:.18,
    factory:.16,
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

/* Le famiglie degli eventi di lavoro. Alle otto trasversali si aggiunge la
   responsabilità di ruolo della Fabbrica: non duplica il motore, registra
   gli esiti nello stesso stato persistente e passa dallo stesso arbitro. */
const FAMILIES = Object.freeze({
  discipline:Object.freeze({id:"discipline",label:"Presenze e disciplina"}),
  career:Object.freeze({id:"career",label:"Carriera"}),
  overtime:Object.freeze({id:"overtime",label:"Straordinari e richieste"}),
  colleague:Object.freeze({id:"colleague",label:"Colleghi"}),
  role:Object.freeze({id:"role",label:"Responsabilità di ruolo"}),
  factory:Object.freeze({id:"factory",label:"Vita di Fabbrica"}),
  music:Object.freeze({id:"music",label:"Opportunità musicali"}),
  crime:Object.freeze({id:"crime",label:"Opportunità criminali"}),
  conflict:Object.freeze({id:"conflict",label:"Conflitto lavoro/musica"}),
  physical:Object.freeze({id:"physical",label:"Conseguenze fisiche/mentali"})
});

const MUSIC_AGENDA_IDS = new Set(["live","free","sala","promo"]);
const CRIME_JOBS = new Set(["buttafuori","fattorino"]);
let bypassConflict = null;

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

function conflictShiftContext(job,hit){
  const luogo=workKey(job);
  const out={
    luogo,
    paga:Number(job&&job.pay||0),
    pagaLabel:"",
    energia:null,
    benessere:null,
    lucidita:null,
    eventWeight:1,
    attendance:null,
    overtime:null
  };

  if(luogo && typeof lavoroPagaTurno==="function"){
    const p=lavoroPagaTurno(luogo,Number(job&&job.pay||0));
    if(p){
      out.paga=Number(p.totale||out.paga||0);
      out.pagaLabel=(p.percentuale?(" · +"+Number(p.percentuale)+"%"):"");
    }
  }
  if(luogo && typeof lavoroEffettiTurno==="function"){
    const fx=lavoroEffettiTurno(luogo,job);
    if(fx){
      out.energia=Number(fx.energia);
      out.benessere=Number(fx.benessere||0);
      out.lucidita=Number(fx.lucidita||0);
    }
  }
  try{
    if(window.AGENDA && typeof AGENDA.pesoDiOggi==="function" && hit && hit.voice)
      out.eventWeight=Math.max(1,Number(AGENDA.pesoDiOggi(hit.voice.id)||1));
  }catch(_){}

  if(luogo && typeof lavoroCartellino==="function" && typeof lavoroContrattoDef==="function"){
    const cart=lavoroCartellino(luogo);
    const def=lavoroContrattoDef(luogo);
    if(cart && def && Number(def.turniSettimanali||0)>0){
      const richiesti=Math.max(0,Number(def.turniSettimanali||0));
      const fatti=Math.max(0,Number(cart.giorniLavoratiSettimana||0));
      const oggi=Math.max(1,Math.min(7,Number(G.day||1)));
      const consentiti=Array.isArray(def.giorniConsentiti)?def.giorniConsentiti:[1,2,3,4,5,6,7];
      const giaOggi=Number(cart.conteggi&&cart.conteggi[cart.posOggi]||0)>0;
      const oggiConta=consentiti.includes(oggi) && !giaOggi;
      const futuri=consentiti.filter(g=>g>oggi).length;
      const maxSeSalti=fatti+futuri;
      const maxSeLavori=fatti+futuri+(oggiConta?1:0);
      const assenzeSeSalti=Math.max(0,richiesti-maxSeSalti);
      const assenzeSeLavori=Math.max(0,richiesti-maxSeLavori);
      out.attendance={
        fatti,
        richiesti,
        giaOggi,
        oggiConta,
        futuri,
        assenzeSeSalti,
        assenzeSeLavori,
        assenzeCreateDalConflitto:Math.max(0,assenzeSeSalti-assenzeSeLavori)
      };
    }
  }

  if(luogo && typeof lavoroStraordinarioOggi==="function"){
    const extra=lavoroStraordinarioOggi(luogo);
    if(extra){
      let delta=0;
      if(typeof lavoroCarrieraDef==="function"){
        const cfg=lavoroCarrieraDef(luogo);
        delta=Number(cfg&&cfg.straordinari&&cfg.straordinari.affidabilitaSaltato||0);
      }
      out.overtime={tipo:extra.tipo||null,reliabilityDelta:delta};
    }
  }
  return out;
}

function conflictWorkDetail(ctx){
  let d="+"+Math.round(Number(ctx.paga||0))+" €";
  if(ctx.pagaLabel) d+=ctx.pagaLabel;
  if(ctx.attendance){
    const a=ctx.attendance;
    const dopo=Math.min(a.richiesti,a.fatti+(a.oggiConta?1:0));
    d+=" · presenza "+dopo+"/"+a.richiesti;
  }
  d+=" · perdi l'appuntamento";
  if(ctx.eventWeight>1) d+=" ×"+ctx.eventWeight.toFixed(2);
  return d;
}

function conflictMusicDetail(ctx){
  const parts=[];
  if(ctx.eventWeight>1) parts.push("evento Agenda ×"+ctx.eventWeight.toFixed(2));
  if(ctx.overtime && ctx.overtime.reliabilityDelta<0)
    parts.push("straordinario accettato: affidabilità "+ctx.overtime.reliabilityDelta);
  else if(ctx.attendance){
    const a=ctx.attendance;
    if(a.assenzeCreateDalConflitto>0)
      parts.push(a.assenzeCreateDalConflitto+
        (a.assenzeCreateDalConflitto===1?" assenza diventa inevitabile":" assenze diventano inevitabili"));
    else if(a.assenzeSeSalti===0)
      parts.push("puoi ancora chiudere "+a.richiesti+"/"+a.richiesti);
    else
      parts.push("settimana già sotto quota");
  }else{
    parts.push("niente paga del turno");
  }
  return parts.join(" · ");
}

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
  const ctx=conflictShiftContext(G.job,hit);

  /* È una scelta richiesta dal giocatore PRIMA della mossa, non un evento
     automatico: non occupa la chiave minuto dell'arbitro. Se chiudi e riprovi,
     la decisione deve poter ricomparire nello stesso minuto. */
  if(typeof showEvent!=="function") return {ok:true};

  let quadro="Se entri adesso lavori dalle <b>"+fmtTime(hit.from)+"</b> alle <b>"+
    fmtTime(hit.to)+"</b>. In Agenda hai <b>"+v.n+"</b> alle <b>"+v.ora+"</b>.";
  if(ctx.attendance){
    quadro+="<br><br>Questa settimana sei a <b>"+ctx.attendance.fatti+"/"+ctx.attendance.richiesti+
      " presenze</b>.";
    if(ctx.attendance.assenzeCreateDalConflitto>0)
      quadro+=" Saltare proprio questo turno rende inevitabile "+
        ctx.attendance.assenzeCreateDalConflitto+
        (ctx.attendance.assenzeCreateDalConflitto===1?" assenza":" assenze")+".";
    else if(ctx.attendance.assenzeSeSalti===0)
      quadro+=" Puoi ancora coprire il contratto nei giorni rimasti.";
  }
  quadro+="<br><br>Non puoi fare entrambe le cose: qui scegli cosa vale di più per questa settimana.";

  showEvent({
    k:(G.job.n||"Lavoro")+" · Conflitto",
    t:"Il turno si mangia "+v.n,
    d:quadro,
    annulla(){},
    opts:[
      {n:"Vai al turno",d:conflictWorkDetail(ctx),run(){
        /* Non togliamo ancora la voce: il secondo avvio può comunque essere
           respinto da luogo/orario. La perdita viene committata solo dopo che
           il clock certifica che il turno ha davvero attraversato l'evento. */
        s.pendingConflictMiss={
          voice:v,key,day:absDay(),jobId:G.job&&G.job.id,
          pay:Number(ctx.paga||0),
          eventWeight:Number(ctx.eventWeight||1),
          attendance:ctx.attendance?Object.assign({},ctx.attendance):null
        };
        try{ if(typeof save==="function") save(); }catch(_){}
        bypassConflict={key,day:absDay()};
        setTimeout(()=>{
          if(typeof avviaAzioneDiretta==="function") avviaAzioneDiretta("turno");
        },60);
        return null;
      }},
      {n:"Tieni l'appuntamento",d:conflictMusicDetail(ctx),run(){
        delete s.pendingConflictMiss;
        record(s,"conflict",{
          choice:"music",
          jobId:G.job&&G.job.id,
          appointmentId:v.id,
          appointmentName:v.n,
          appointmentTime:v.ora,
          eventWeight:Number(ctx.eventWeight||1),
          forgonePay:Number(ctx.paga||0),
          attendance:ctx.attendance?Object.assign({},ctx.attendance):null,
          overtime:ctx.overtime?Object.assign({},ctx.overtime):null
        });
        return {t:"Hai tenuto libero il tempo per <b>"+v.n+
          "</b>. Il turno non è stato fatto: l'appuntamento resta in Agenda e dovrai andarci davvero.",c:""};
      }}
    ]
  });

  return {ok:false,handled:true,reason:"work-music-conflict",conflict:hit};
}

/* ==================== 2. CARRIERA ==================== */

function careerCandidate(job){
  if(!job || typeof lavoroLuogo!=="function") return null;
  const luogo=lavoroLuogo(job);
  const cfg=typeof lavoroCarrieraDef==="function" ? lavoroCarrieraDef(luogo) : null;
  if(!luogo || !cfg) return null;

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

  record(s,"career",{status:"offered",type:candidate.type,jobId:job.id,workplace:candidate.place});
  const luogoNome=typeof lavoroNomeLuogo==="function"
    ? lavoroNomeLuogo(candidate.place)
    : (candidate.place||job.n||"Lavoro");

  if(candidate.type==="promotion"){
    const target=candidate.next;
    showEvent({
      k:luogoNome+" · Carriera",
      t:"Il capo ti chiede di fermarti",
      d:"Le presenze e l'affidabilità hanno superato la soglia. Ti propone di passare a <b>"+
        target.n+"</b>. Non è un premio finto: se accetti cambiano davvero mansione e paga, mentre anzianità e cartellino restano del posto di lavoro.",
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
    k:luogoNome+" · Carriera",
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

/* ==================== RUOLO IN FABBRICA ====================
   Non sono eventi generici con il nome cambiato: ogni gradino della carriera
   porta problemi diversi. Il cooldown evita che il ruolo diventi un popup a
   ogni turno; le conseguenze usano le stesse statistiche vere del gioco. */
const FACTORY_ROLE_EVENTS = Object.freeze({
  operaio:Object.freeze([
    Object.freeze({
      id:"ritmo-linea",
      t:"La linea oggi corre più del solito",
      d:"Manca una persona e il ritmo è stato alzato. Non è uno straordinario: sei già dentro al tuo turno, ma devi decidere quanto tirare.",
      opts:Object.freeze([
        Object.freeze({n:"Tieni il ritmo",d:"+1 affidabilità · −2 benessere",fx:{reliability:1,wellbeing:-2},
          result:"Hai tenuto il ritmo fino alla sirena. Il capo se n'è accorto, ma il turno ti è rimasto addosso."}),
        Object.freeze({n:"Chiedi un cambio di postazione",d:"+1 benessere",fx:{wellbeing:1},
          result:"Hai chiesto di girare postazione prima di arrivare cotto. Hai finito il turno senza trascinarti."})
      ])
    }),
    Object.freeze({
      id:"pezzo-fuori-sede",
      t:"Un pezzo non entra come dovrebbe",
      d:"La linea continua a muoversi ma qualcosa non torna. Puoi fermare e segnalare oppure provare a sistemarlo al volo.",
      opts:Object.freeze([
        Object.freeze({n:"Ferma e segnala",d:"+1 affidabilità · +1 lucidità",fx:{reliability:1,lucidita:1},
          result:"Hai fermato il passaggio prima che il problema si propagasse. Meno eroismo, più testa."}),
        Object.freeze({n:"Sistemalo al volo",d:"−1 benessere · −1 lucidità",fx:{wellbeing:-1,lucidita:-1},
          result:"L'hai rimesso in riga senza fermare tutto, ma hai passato il resto del turno in tensione."})
      ])
    }),
    Object.freeze({
      id:"postazione-pesante",
      t:"Ti chiedono di scambiare postazione",
      d:"Quello accanto a te è cotto e ti chiede di prendere per un po' la postazione più pesante. Puoi caricarti il pezzo duro oppure proporre una rotazione vera.",
      opts:Object.freeze([
        Object.freeze({n:"Prendi tu la postazione",d:"+0,3 rete · −2 benessere",fx:{rete:.3,wellbeing:-2},
          result:"Gli hai tolto pressione, ma a fine turno senti bene dove hai passato l'ultima ora."}),
        Object.freeze({n:"Proponi una rotazione",d:"+1 lucidità · +0,1 rete",fx:{lucidita:1,rete:.1},
          result:"Avete spezzato il carico invece di spostarlo da una persona all'altra. Meno eroico, più sostenibile."})
      ])
    }),
    Object.freeze({
      id:"scarto-ripetuto",
      t:"Troppi pezzi finiscono nello scarto",
      d:"Non è un singolo pezzo storto: ne stai mettendo via troppi di fila. Puoi fermare il flusso e segnalarlo oppure continuare a separare gli scarti senza rallentare tutti.",
      opts:Object.freeze([
        Object.freeze({n:"Ferma e segnala l'andamento",d:"+1 affidabilità · −1 lucidità",fx:{reliability:1,lucidita:-1},
          result:"Hai fatto perdere qualche minuto alla linea, ma il problema è stato preso prima di diventare un lotto intero."}),
        Object.freeze({n:"Continua a selezionare",d:"+1 benessere · −1 affidabilità",fx:{wellbeing:1,reliability:-1},
          result:"Hai evitato lo stop, ma hai lasciato che il problema restasse dentro al ritmo del turno."})
      ])
    }),
    Object.freeze({
      id:"cambio-fine-linea",
      t:"A fine linea si accumula materiale",
      d:"Il ritmo a monte non cala ma davanti a te il materiale si ammassa. Puoi spingere per svuotare il collo di bottiglia oppure chiedere un rallentamento coordinato.",
      opts:Object.freeze([
        Object.freeze({n:"Spingi per svuotare",d:"+1 affidabilità · −2 benessere",fx:{reliability:1,wellbeing:-2},
          result:"Hai riaperto spazio a forza di ritmo. Il reparto respira, tu un po' meno."}),
        Object.freeze({n:"Chiedi di rallentare",d:"+1 lucidità · +1 benessere",fx:{lucidita:1,wellbeing:1},
          result:"Hai fatto abbassare il ritmo per qualche minuto e il collo di bottiglia si è sciolto senza correre."})
      ])
    })
  ]),
  operaio_esperto:Object.freeze([
    Object.freeze({
      id:"nuovo-assunto",
      t:"Ti mettono accanto un nuovo assunto",
      d:"Conosci abbastanza bene la linea da diventare quello a cui fanno le domande. Puoi seguirlo davvero o pensare solo alla tua postazione.",
      opts:Object.freeze([
        Object.freeze({n:"Affiancalo",d:"+1 affidabilità · +0,2 rete · −1 lucidità",fx:{reliability:1,rete:.2,lucidita:-1},
          result:"Hai perso un po' di testa dietro alle sue domande, ma da oggi non sei più solo quello che esegue."}),
        Object.freeze({n:"Resta sulla tua postazione",d:"+1 benessere",fx:{wellbeing:1},
          result:"Hai fatto il tuo senza caricarti anche il turno di un altro."})
      ])
    }),
    Object.freeze({
      id:"qualita-lotto",
      t:"Il controllo qualità non ti convince",
      d:"Hai abbastanza esperienza per capire che un lotto è al limite. Fermarlo crea ritardo; lasciarlo andare può tornare indietro dopo.",
      opts:Object.freeze([
        Object.freeze({n:"Blocca il lotto",d:"+2 affidabilità · −1 lucidità",fx:{reliability:2,lucidita:-1},
          result:"Hai preferito prenderti la responsabilità adesso invece di nascondere il problema."}),
        Object.freeze({n:"Lascialo scorrere",d:"+1 benessere · −2 affidabilità",fx:{wellbeing:1,reliability:-2},
          result:"Il turno è filato più liscio, ma hai fatto finta di non vedere una cosa che ormai sai riconoscere."})
      ])
    }),
    Object.freeze({
      id:"cambio-formato",
      t:"C'è un cambio formato da chiudere",
      d:"La linea riparte con un formato diverso e sei uno dei pochi che sa davvero dove guardare. Puoi fare tu ogni controllo oppure guidare chi è meno esperto.",
      opts:Object.freeze([
        Object.freeze({n:"Controlli tutto tu",d:"+2 affidabilità · −2 lucidità",fx:{reliability:2,lucidita:-2},
          result:"La ripartenza è pulita, ma ti sei caricato addosso ogni verifica."}),
        Object.freeze({n:"Guida un collega",d:"+0,3 rete · −1 lucidità",fx:{rete:.3,lucidita:-1},
          result:"Hai distribuito i controlli e trasformato il cambio formato in un piccolo affiancamento."})
      ])
    }),
    Object.freeze({
      id:"anomalia-ricorrente",
      t:"La stessa anomalia torna per la terza volta",
      d:"Sai già come tamponarla, ma ormai è chiaro che il problema non è il singolo pezzo. Puoi fermarti a cercare la causa oppure registrarla bene e passarla al turno dopo.",
      opts:Object.freeze([
        Object.freeze({n:"Cerchi la causa",d:"+1 affidabilità · −2 lucidità",fx:{reliability:1,lucidita:-2},
          result:"Non hai risolto il mondo, ma hai trovato il punto da cui partire invece di fare il terzo rattoppo."}),
        Object.freeze({n:"Documenti e passi consegna",d:"+1 lucidità · +1 benessere",fx:{lucidita:1,wellbeing:1},
          result:"Hai lasciato una consegna utile e hai evitato di trasformare il turno in una caccia infinita al guasto."})
      ])
    }),
    Object.freeze({
      id:"doppio-controllo",
      t:"Ti chiedono un doppio controllo sul lotto",
      d:"La qualità vuole una seconda verifica prima di liberare il materiale. Puoi rifare tutto con calma oppure campionare i punti più critici e tenere il ritmo.",
      opts:Object.freeze([
        Object.freeze({n:"Rifai il controllo completo",d:"+2 affidabilità · −1 benessere",fx:{reliability:2,wellbeing:-1},
          result:"Hai chiuso il dubbio senza lasciare buchi, ma ti sei tenuto addosso anche il controllo extra."}),
        Object.freeze({n:"Controlli i punti critici",d:"+1 lucidità · +1 benessere",fx:{lucidita:1,wellbeing:1},
          result:"Hai usato l'esperienza per concentrarti dove serviva davvero e il lotto è ripartito senza trascinarsi."})
      ])
    })
  ]),
  capolinea:Object.freeze([
    Object.freeze({
      id:"linea-in-ritardo",
      t:"La tua linea è indietro",
      d:"Il numero di fine turno non torna. Ora non devi solo lavorare: devi decidere come far lavorare anche gli altri.",
      opts:Object.freeze([
        Object.freeze({n:"Redistribuisci le postazioni",d:"+1 affidabilità · −2 lucidità",fx:{reliability:1,lucidita:-2},
          result:"Hai passato il resto del turno a spostare persone e controllare incastri. La linea ha recuperato, tu meno."}),
        Object.freeze({n:"Spingi il ritmo",d:"+2 affidabilità · −2 benessere",fx:{reliability:2,wellbeing:-2},
          result:"Avete recuperato tirando tutti più forte. Il risultato c'è, anche la fatica."})
      ])
    }),
    Object.freeze({
      id:"tensione-reparto",
      t:"Due persone della linea si prendono male",
      d:"Prima avresti potuto farti i fatti tuoi. Da capolinea, se la cosa si trascina, domani il problema è anche tuo.",
      opts:Object.freeze([
        Object.freeze({n:"Li separi e chiarisci",d:"+1 affidabilità · +0,2 rete · −1 lucidità",fx:{reliability:1,rete:.2,lucidita:-1},
          result:"Hai chiuso la discussione prima che diventasse il clima del reparto."}),
        Object.freeze({n:"Tagli corto e li rimandi al lavoro",d:"+1 benessere · −1 affidabilità",fx:{wellbeing:1,reliability:-1},
          result:"La linea è ripartita subito, ma la tensione è rimasta sotto."})
      ])
    }),
    Object.freeze({
      id:"assenza-improvvisa",
      t:"Ti manca una persona a metà turno",
      d:"Una persona deve uscire e resti con un buco vero sulla linea. Puoi ridistribuire subito le postazioni oppure chiedere supporto al reparto vicino.",
      opts:Object.freeze([
        Object.freeze({n:"Ridisegni le postazioni",d:"+1 affidabilità · −2 lucidità",fx:{reliability:1,lucidita:-2},
          result:"Hai tenuto la linea in piedi cambiando incastri per il resto del turno."}),
        Object.freeze({n:"Chiedi supporto al reparto vicino",d:"+0,3 rete · −1 affidabilità",fx:{rete:.3,reliability:-1},
          result:"Hai trovato una mano fuori dalla tua linea, ma hai dovuto ammettere che da solo il numero non stava in piedi."})
      ])
    }),
    Object.freeze({
      id:"pause-da-incastrare",
      t:"Le pause non entrano più nel piano",
      d:"Un ritardo ha mangiato il margine e adesso le pause si sovrappongono al momento peggiore. Puoi proteggere le rotazioni oppure stringerle per recuperare produzione.",
      opts:Object.freeze([
        Object.freeze({n:"Mantieni le rotazioni",d:"+0,3 rete · −1 affidabilità",fx:{rete:.3,reliability:-1},
          result:"Hai protetto il ritmo delle persone e accettato un numero di produzione meno bello."}),
        Object.freeze({n:"Stringi le rotazioni",d:"+2 affidabilità · −2 lucidità",fx:{reliability:2,lucidita:-2},
          result:"Avete recuperato il ritardo, ma hai passato il resto del turno a rincorrere tempi e malumori."})
      ])
    }),
    Object.freeze({
      id:"priorita-cambiata",
      t:"Il piano cambia a turno iniziato",
      d:"Arriva una priorità nuova quando la linea è già impostata. Puoi rifare subito l'assetto oppure chiedere al capoturno di proteggere il piano originale.",
      opts:Object.freeze([
        Object.freeze({n:"Riorganizzi la linea",d:"+1 affidabilità · −2 lucidità",fx:{reliability:1,lucidita:-2},
          result:"Hai assorbito il cambio senza fermare il reparto, ma il turno è diventato tutto incastri."}),
        Object.freeze({n:"Difendi il piano originale",d:"+1 benessere · −1 affidabilità",fx:{wellbeing:1,reliability:-1},
          result:"Hai evitato di ribaltare tutto all'ultimo, pagando però un po' di credito verso l'alto."})
      ])
    })
  ]),
  capoturno:Object.freeze([
    Object.freeze({
      id:"priorita-reparti",
      t:"Due linee chiedono la stessa manutenzione",
      d:"Non puoi accontentare tutti. Il problema del capoturno è questo: il corpo lavora meno, ma la decisione sbagliata pesa su mezzo stabilimento.",
      opts:Object.freeze([
        Object.freeze({n:"Fermi la linea più a rischio",d:"+2 affidabilità · −2 lucidità",fx:{reliability:2,lucidita:-2},
          result:"Hai scelto il rischio minore e ti sei preso la responsabilità della produzione persa."}),
        Object.freeze({n:"Tieni aperta la produzione",d:"+1 benessere · −2 affidabilità",fx:{wellbeing:1,reliability:-2},
          result:"Hai protetto il numero di oggi, ma la scelta non è passata inosservata."})
      ])
    }),
    Object.freeze({
      id:"capolinea-assente",
      t:"Un capolinea salta il turno",
      d:"Puoi assorbire tu il reparto oppure delegare a uno degli esperti e restare sul coordinamento generale.",
      opts:Object.freeze([
        Object.freeze({n:"Copri tu il reparto",d:"+1 affidabilità · −2 lucidità",fx:{reliability:1,lucidita:-2},
          result:"Hai tenuto insieme due livelli di responsabilità per tutto il turno."}),
        Object.freeze({n:"Delega a un esperto",d:"+0,3 rete · +1 benessere",fx:{rete:.3,wellbeing:1},
          result:"Hai dato fiducia a chi conosce la linea e ti sei tenuto libero per il resto dello stabilimento."})
      ])
    }),
    Object.freeze({
      id:"due-linee-corte",
      t:"Due linee partono corte insieme",
      d:"Non hai abbastanza persone per coprire entrambe come da piano. Puoi spostare un esperto dove brucia di più oppure abbassare il target di una linea.",
      opts:Object.freeze([
        Object.freeze({n:"Sposti un esperto",d:"+1 affidabilità · −2 lucidità",fx:{reliability:1,lucidita:-2},
          result:"Hai tenuto i numeri in piedi spostando esperienza dove serviva, ma hai passato il turno a compensare il buco rimasto."}),
        Object.freeze({n:"Abbassi un target",d:"+0,2 rete · +1 benessere · −1 affidabilità",fx:{rete:.2,wellbeing:1,reliability:-1},
          result:"Hai scelto un obiettivo realistico e tolto pressione a un reparto, pagando qualcosa sul risultato di giornata."})
      ])
    }),
    Object.freeze({
      id:"qualita-ferma-reparto",
      t:"La qualità vuole fermare un reparto",
      d:"Un controllo apre un dubbio serio su un lotto. Puoi fermare tutto finché non è chiaro oppure isolare il materiale e tenere aperto il resto.",
      opts:Object.freeze([
        Object.freeze({n:"Fermi il reparto",d:"+2 affidabilità · −2 lucidità",fx:{reliability:2,lucidita:-2},
          result:"Hai scelto la certezza e ti sei preso il costo del fermo davanti a tutti."}),
        Object.freeze({n:"Isoli il lotto",d:"+1 affidabilità · −1 benessere",fx:{reliability:1,wellbeing:-1},
          result:"Hai salvato il resto della produzione, ma hai tenuto addosso il rischio della decisione fino a fine turno."})
      ])
    }),
    Object.freeze({
      id:"pressione-produzione",
      t:"Dall'alto chiedono di spingere i numeri",
      d:"Il piano è già tirato, ma arriva la richiesta di fare di più senza persone in più. Puoi difendere il carico dei reparti oppure scaricare la pressione verso il basso.",
      opts:Object.freeze([
        Object.freeze({n:"Difendi il carico",d:"+0,3 rete · −1 affidabilità",fx:{rete:.3,reliability:-1},
          result:"Hai tenuto il punto sui carichi e perso un po' di credito sul numero, ma sotto di te se ne accorgono."}),
        Object.freeze({n:"Spingi la produzione",d:"+2 affidabilità · −3 lucidità",fx:{reliability:2,lucidita:-3},
          result:"Il numero sale. Per farlo hai passato il turno a rincorrere ogni reparto e a mettere pressione ovunque."})
      ])
    })
  ])
});

/* Il turno base differenzia già fatica fisica e pressione mentale per ruolo.
   Gli eventi trasversali della Fabbrica devono rispettare la stessa logica:
   - il lavoro fisico pesa di più in basso nella gerarchia;
   - la pressione mentale cresce con responsabilità e coordinamento;
   - affidabilità e rete non vengono "moltiplicate" dal ruolo: descrivono
     conseguenze sociali/organizzative, non la fatica del corpo o della testa. */
const FACTORY_ROLE_EVENT_LOAD = Object.freeze({
  operaio:Object.freeze({
    physicalPenalty:1,
    mentalPenalty:1,
    recovery:Object.freeze({wellbeing:3,lucidita:1}),
    push:Object.freeze({wellbeing:-4,lucidita:-1}),
    fatigueTitle:"Il turno oggi ti è rimasto nelle braccia",
    fatigueText:"Hai già accumulato parecchio lavoro o il corpo sta iniziando a presentare il conto. Fermarti protegge soprattutto il fisico; tirare ancora pesa lì."
  }),
  operaio_esperto:Object.freeze({
    physicalPenalty:.8,
    mentalPenalty:1,
    recovery:Object.freeze({wellbeing:3,lucidita:2}),
    push:Object.freeze({wellbeing:-3,lucidita:-2}),
    fatigueTitle:"Il turno oggi ti è rimasto addosso",
    fatigueText:"Conosci meglio il mestiere e sprechi meno energie, ma tra linea, qualità e persone la stanchezza si divide tra corpo e testa."
  }),
  capolinea:Object.freeze({
    physicalPenalty:.6,
    mentalPenalty:1.5,
    recovery:Object.freeze({wellbeing:2,lucidita:3}),
    push:Object.freeze({wellbeing:-2,lucidita:-3}),
    fatigueTitle:"La linea oggi ti è rimasta in testa",
    fatigueText:"Il corpo lavora meno di prima, ma ritmo, persone e problemi della linea continuano a girarti in testa anche dopo la sirena."
  }),
  capoturno:Object.freeze({
    physicalPenalty:.5,
    mentalPenalty:2,
    recovery:Object.freeze({wellbeing:1,lucidita:4}),
    push:Object.freeze({wellbeing:-1,lucidita:-4}),
    fatigueTitle:"Il turno oggi non ti esce dalla testa",
    fatigueText:"Non sei più quello che porta il peso maggiore con le braccia: adesso ti porti dietro decisioni, imprevisti e responsabilità di tutto il turno."
  })
});

const DEFAULT_WORK_EVENT_LOAD = Object.freeze({
  recovery:Object.freeze({wellbeing:3,lucidita:2}),
  push:Object.freeze({wellbeing:-4,lucidita:-3}),
  fatigueTitle:"Il turno oggi ti è rimasto addosso",
  fatigueText:"Non è solo una frase: hai già accumulato parecchi turni o una delle tue risorse sta scendendo troppo. Come chiudi la giornata cambia davvero come stai."
});

function factoryRoleEventLoad(job){
  return job && workKey(job)==="fabbrica"
    ? (FACTORY_ROLE_EVENT_LOAD[job.id] || null)
    : null;
}

function scaleNegative(v,factor){
  const n=Number(v||0);
  if(n>=0) return n;
  return -Math.max(1,Math.round(Math.abs(n)*Number(factor||1)));
}

function factoryFloorFx(job,opt){
  const fx=Object.assign({},opt&&opt.fx||{});
  const profile=factoryRoleEventLoad(job);
  if(!profile || !opt || !opt.load) return fx;

  if(opt.load==="physical" && Number(fx.wellbeing)<0)
    fx.wellbeing=scaleNegative(fx.wellbeing,profile.physicalPenalty);
  if(opt.load==="mental" && Number(fx.lucidita)<0)
    fx.lucidita=scaleNegative(fx.lucidita,profile.mentalPenalty);
  return fx;
}

function effectNumber(v){
  const n=Number(v||0);
  const abs=Math.abs(n);
  const txt=Number.isInteger(abs) ? String(abs) : String(Math.round(abs*10)/10).replace(".",",");
  return (n>0?"+":"−")+txt;
}

function factoryFxLabel(fx){
  fx=fx||{};
  const parts=[];
  if(Number(fx.reliability)) parts.push(effectNumber(fx.reliability)+" affidabilità");
  if(Number(fx.wellbeing)) parts.push(effectNumber(fx.wellbeing)+" benessere");
  if(Number(fx.lucidita)) parts.push(effectNumber(fx.lucidita)+" lucidità");
  if(Number(fx.rete)) parts.push(effectNumber(fx.rete)+" rete");
  return parts.length ? parts.join(" · ") : "Nessun effetto diretto";
}

function workReliability(luogo,delta){
  if(typeof lavoroCarriera!=="function") return 0;
  const c=lavoroCarriera(luogo);
  if(!c) return 0;
  const prima=Number(c.reliability==null?50:c.reliability);
  c.reliability=nclamp(prima+Number(delta||0),0,100);
  return c.reliability-prima;
}

function applyFactoryRoleFx(fx){
  fx=fx||{};
  const out={wellbeing:0,lucidita:0,rete:0,reliability:0};
  if(fx.wellbeing){ addWellbeing(fx.wellbeing); out.wellbeing=Number(fx.wellbeing); }
  if(fx.lucidita){ addLucidity(fx.lucidita); out.lucidita=Number(fx.lucidita); }
  if(fx.rete){ addNetwork(fx.rete); out.rete=Number(fx.rete); }
  if(fx.reliability) out.reliability=workReliability("fabbrica",fx.reliability);
  return out;
}

function showFactoryRole(job,s,roll){
  if(!job || workKey(job)!=="fabbrica") return false;
  const pool=FACTORY_ROLE_EVENTS[job.id];
  if(!pool || !pool.length || !familyReady(s,"role")) return false;
  if(Number(roll)>=CFG.chance.role || !claim("work-role:"+job.id)) return false;

  if(!Array.isArray(s.roleRecent)) s.roleRecent=[];
  const disponibili=pool.filter(x=>!s.roleRecent.includes(x.id));
  const candidati=disponibili.length?disponibili:pool;
  const scena=candidati[Math.floor(Math.random()*candidati.length)];
  s.roleRecent.unshift(scena.id);
  if(s.roleRecent.length>4) s.roleRecent.length=4;

  record(s,"role",{status:"shown",roleId:job.id,eventId:scena.id});
  if(typeof showEvent!=="function") return false;

  showEvent({
    k:"Fabbrica · "+(job.n||"Ruolo"),
    t:scena.t,
    d:scena.d,
    annulla(){},
    opts:scena.opts.map(opt=>({
      n:opt.n,
      d:opt.d,
      run(){
        const fx=applyFactoryRoleFx(opt.fx);
        record(s,"role",{status:"resolved",roleId:job.id,eventId:scena.id,choice:opt.n,effects:fx});
        return {t:opt.result,c:fx.reliability>0?"good":fx.reliability<0?"bad":""};
      }
    }))
  });
  return true;
}

/* ==================== VITA DI FABBRICA ====================
   Eventi ambientali dello stabilimento, indipendenti dalla mansione.
   Sono volutamente piccoli e misti: lavorare non è una punizione automatica.
   Alcune giornate pesano, altre aprono una pausa o un'occasione per gestire
   meglio il turno. Gli eventi di responsabilità restano invece nella famiglia
   "role" sopra. */
const FACTORY_FLOOR_EVENTS = Object.freeze([
  Object.freeze({
    id:"fermo-linea",
    roles:Object.freeze(["operaio","operaio_esperto","capolinea"]),
    t:"La linea si ferma per venti minuti",
    d:"Una protezione scatta e il reparto resta fermo mentre arriva la manutenzione. Per una volta il ritmo si spezza davvero.",
    opts:Object.freeze([
      Object.freeze({n:"Stacchi un attimo",d:"+2 benessere · +1 lucidità",fx:{wellbeing:2,lucidita:1},
        result:"Hai usato il fermo per respirare invece di riempire anche quei venti minuti."}),
      Object.freeze({n:"Dai una mano a liberare l'area",d:"+1 affidabilità · −1 lucidità",load:"mental",fx:{reliability:1,lucidita:-1},
        result:"Non hai riparato la macchina, ma hai aiutato a far trovare il reparto pronto quando la manutenzione è arrivata."})
    ])
  }),
  Object.freeze({
    id:"pausa-reparto",
    t:"Alla pausa si forma il solito gruppetto",
    d:"Dieci minuti alle macchinette. Non succede niente di enorme: è uno di quei momenti in cui il posto di lavoro smette di essere solo una linea.",
    opts:Object.freeze([
      Object.freeze({n:"Resti con gli altri",d:"+0,3 rete · +1 benessere",fx:{rete:.3,wellbeing:1},
        result:"Avete parlato di niente e di tutto. Non è un contatto nuovo, ma smetti di essere uno che timbra e basta."}),
      Object.freeze({n:"Ti prendi dieci minuti da solo",d:"+2 lucidità",fx:{lucidita:2},
        result:"Hai lasciato il rumore fuori dalla pausa. Torni dentro con la testa più pulita."})
    ])
  }),
  Object.freeze({
    id:"caldo-reparto",
    roles:Object.freeze(["operaio","operaio_esperto"]),
    t:"Oggi in reparto si muore di caldo",
    d:"L'aria gira male e dopo qualche ora il turno comincia a pesare più del normale. Puoi chiedere di ruotare o stringere i denti.",
    opts:Object.freeze([
      Object.freeze({n:"Chiedi una rotazione",d:"+1 benessere",fx:{wellbeing:1},
        result:"Hai cambiato postazione per un pezzo del turno e hai evitato di arrivare cotto alla fine."}),
      Object.freeze({n:"Tieni la postazione",d:"+1 affidabilità · −2 benessere",load:"physical",fx:{reliability:1,wellbeing:-2},
        result:"Hai portato fino in fondo la postazione senza chiedere cambi. Il capo lo nota, il corpo pure."})
    ])
  }),
  Object.freeze({
    id:"protezione-allentata",
    t:"Una protezione non ti convince",
    d:"Non è un'emergenza, ma una copertura vibra più del solito. Fermare e segnalarla rallenta il reparto; ignorarla è più comodo adesso.",
    opts:Object.freeze([
      Object.freeze({n:"La segnali subito",d:"+2 affidabilità · −1 lucidità",load:"mental",fx:{reliability:2,lucidita:-1},
        result:"Hai fatto controllare la protezione prima che diventasse un problema vero."}),
      Object.freeze({n:"La lasci al controllo successivo",d:"+1 benessere · −1 affidabilità",fx:{wellbeing:1,reliability:-1},
        result:"Il turno scorre senza fermate, ma hai lasciato a qualcun altro una cosa che avevi già visto."})
    ])
  }),
  Object.freeze({
    id:"ordine-chiuso",
    roles:Object.freeze(["operaio","operaio_esperto"]),
    t:"Il lotto finisce prima del previsto",
    d:"Per una volta siete avanti. Restano minuti buoni prima della chiusura del turno e nessuno sta correndo.",
    opts:Object.freeze([
      Object.freeze({n:"Dai una mano alla linea accanto",d:"+1 affidabilità · +0,2 rete · −1 benessere",load:"physical",fx:{reliability:1,rete:.2,wellbeing:-1},
        result:"Sei andato dove erano ancora sotto. Ti sei caricato un po' di lavoro in più, ma non è passato inosservato."}),
      Object.freeze({n:"Chiudi con calma",d:"+2 benessere · +1 lucidità",fx:{wellbeing:2,lucidita:1},
        result:"Hai finito pulito, sistemato la postazione e lasciato che una giornata buona restasse una giornata buona."})
    ])
  }),
  Object.freeze({
    id:"rumore-anomalo",
    roles:Object.freeze(["operaio","operaio_esperto","capolinea"]),
    t:"Una macchina fa un rumore che ieri non faceva",
    d:"Continua a lavorare, ma il rumore è nuovo. Può essere niente oppure l'inizio del fermo che nessuno vuole.",
    opts:Object.freeze([
      Object.freeze({n:"La fai controllare",d:"+1 affidabilità · +1 lucidità",fx:{reliability:1,lucidita:1},
        result:"Il controllo non trova un guasto grave, ma hai tolto il dubbio prima che diventasse il pensiero di tutto il turno."}),
      Object.freeze({n:"Aspetti fine turno",d:"−1 lucidità",load:"mental",fx:{lucidita:-1},
        result:"La macchina ha continuato a girare. Anche tu, con quel rumore in testa fino alla sirena."})
    ])
  }),
  Object.freeze({
    id:"responsabile-visita",
    t:"Il responsabile passa più tempo del solito in reparto",
    d:"Non è un'ispezione formale. Guarda numeri, postazioni e come gira il lavoro. C'è spazio per farsi vedere, nel bene o nel male.",
    opts:Object.freeze([
      Object.freeze({n:"Gli fai una segnalazione concreta",d:"+1 affidabilità · −1 lucidità",load:"mental",fx:{reliability:1,lucidita:-1},
        result:"Hai parlato di una cosa precisa invece di fare scena. La risposta è stata corta, ma ti ha ascoltato."}),
      Object.freeze({n:"Fai il tuo e basta",d:"+1 benessere",fx:{wellbeing:1},
        result:"Non hai cercato attenzione. Hai fatto il tuo turno senza aggiungere altra pressione."})
    ])
  }),
  Object.freeze({
    id:"collega-in-calo",
    roles:Object.freeze(["operaio","operaio_esperto"]),
    t:"Quello accanto a te oggi è in difficoltà",
    d:"Lo vedi rallentare da un po'. Non è un evento da eroe: puoi coprirgli qualche passaggio oppure chiamare chi coordina il reparto.",
    opts:Object.freeze([
      Object.freeze({n:"Gli copri qualche passaggio",d:"+0,3 rete · −1 benessere",load:"physical",fx:{rete:.3,wellbeing:-1},
        result:"Gli hai tolto pressione per un pezzo del turno. A fine giornata se lo ricorda."}),
      Object.freeze({n:"Chiami chi coordina",d:"+1 affidabilità · +1 lucidità",fx:{reliability:1,lucidita:1},
        result:"Hai fatto gestire il problema a chi deve farlo invece di caricartelo tutto addosso."})
    ])
  }),
  Object.freeze({
    id:"materiale-in-ritardo",
    roles:Object.freeze(["operaio","operaio_esperto","capolinea"]),
    t:"Il materiale arriva tardi alla linea",
    d:"Per quasi mezz'ora non puoi produrre al ritmo previsto. Il ritardo non dipende da te, ma il clima del reparto cambia lo stesso.",
    opts:Object.freeze([
      Object.freeze({n:"Prepari tutto per la ripartenza",d:"+1 affidabilità · +1 lucidità",fx:{reliability:1,lucidita:1},
        result:"Quando il materiale arriva siete già pronti. Il ritardo resta, il caos no."}),
      Object.freeze({n:"Usi il buco per respirare",d:"+2 benessere",fx:{wellbeing:2},
        result:"Non puoi inventarti materiale che non c'è. Hai preso il respiro che il turno ti ha regalato."})
    ])
  }),
  Object.freeze({
    id:"giornata-liscia",
    t:"Oggi fila tutto liscio",
    d:"Nessun guasto, nessun casino, nessuno che corre urlando. Anche in Fabbrica esistono turni che fanno semplicemente il loro lavoro.",
    opts:Object.freeze([
      Object.freeze({n:"Mantieni il ritmo senza strafare",d:"+2 benessere · +1 lucidità",fx:{wellbeing:2,lucidita:1},
        result:"Hai chiuso un turno normale senza trasformarlo per forza in una prova di resistenza."}),
      Object.freeze({n:"Usi il margine per aiutare",d:"+1 affidabilità · +0,2 rete",fx:{reliability:1,rete:.2},
        result:"Hai usato il margine per dare una mano dove serviva, senza mettere il reparto sotto pressione."})
    ])
  })
]);

function showFactoryFloor(job,s,roll){
  if(!job || workKey(job)!=="fabbrica") return false;
  if(!familyReady(s,"factory") || Number(roll)>=CFG.chance.factory) return false;
  if(!claim("work-factory-floor")) return false;

  if(!Array.isArray(s.factoryRecent)) s.factoryRecent=[];
  const adatti=FACTORY_FLOOR_EVENTS.filter(x=>!Array.isArray(x.roles) || x.roles.includes(job.id));
  if(!adatti.length) return false;
  const disponibili=adatti.filter(x=>!s.factoryRecent.includes(x.id));
  const pool=disponibili.length?disponibili:adatti;
  const scena=pool[Math.floor(Math.random()*pool.length)];

  s.factoryRecent.unshift(scena.id);
  if(s.factoryRecent.length>4) s.factoryRecent.length=4;
  record(s,"factory",{status:"shown",eventId:scena.id,roleId:job.id});

  if(typeof showEvent!=="function") return false;
  showEvent({
    k:"Fabbrica · Reparto",
    t:scena.t,
    d:scena.d,
    annulla(){},
    opts:scena.opts.map(opt=>{
      const adjustedFx=factoryFloorFx(job,opt);
      return {
      n:opt.n,
      d:factoryFxLabel(adjustedFx),
      run(){
        const fx=applyFactoryRoleFx(adjustedFx);
        record(s,"factory",{
          status:"resolved",eventId:scena.id,roleId:job.id,choice:opt.n,effects:fx
        });
        const saldo=Number(fx.reliability||0)+Number(fx.wellbeing||0)+
          Number(fx.lucidita||0)+Number(fx.rete||0);
        return {t:opt.result,c:saldo>0?"good":saldo<0?"bad":""};
      }
    };
    })
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
  if(typeof stradaFabbricaLeadAttivo==="function" && stradaFabbricaLeadAttivo()) return false;

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
  const roleProfile=factoryRoleEventLoad(job);
  const wellbeing=Number(G.wellbeing==null?100:G.wellbeing);
  const lucidita=Number(G.lucidita==null?100:G.lucidita);
  /* La lucidità bassa diventa un trigger aggiuntivo solo per i ruoli Fabbrica,
     dove il carico mentale è parte esplicita della progressione. Gli altri
     lavori mantengono il comportamento precedente. */
  const overworked=Number(G.shifts||0)>=4 ||
    wellbeing<=35 ||
    (!!roleProfile && lucidita<=35);
  if(!overworked || !familyReady(s,"physical") || Number(roll)>=CFG.chance.physical)
    return false;
  if(!claim("work-physical")) return false;

  const profile=roleProfile || DEFAULT_WORK_EVENT_LOAD;
  const recovery=profile.recovery || DEFAULT_WORK_EVENT_LOAD.recovery;
  const push=profile.push || DEFAULT_WORK_EVENT_LOAD.push;

  record(s,"physical",{
    status:"shown",
    roleId:job&&job.id||null,
    shifts:Number(G.shifts||0),
    wellbeing:Number(G.wellbeing||0),
    lucidita:Number(G.lucidita||0)
  });
  if(typeof showEvent!=="function") return false;

  showEvent({
    k:(job.n||"Lavoro")+" · Stanchezza",
    t:profile.fatigueTitle || DEFAULT_WORK_EVENT_LOAD.fatigueTitle,
    d:profile.fatigueText || DEFAULT_WORK_EVENT_LOAD.fatigueText,
    annulla(){},
    opts:[
      {n:"Ti fermi qui",d:factoryFxLabel(recovery),run(){
        addWellbeing(recovery.wellbeing); addLucidity(recovery.lucidita);
        record(s,"physical",{status:"recovered",choice:"stop",roleId:job&&job.id||null,
          effects:Object.assign({},recovery)});
        return {t:"Hai deciso di non tirare ancora. <b>"+
          factoryFxLabel(recovery)+".</b>",c:"good"};
      }},
      {n:"Tiri dritto",d:factoryFxLabel(push),run(){
        addWellbeing(push.wellbeing); addLucidity(push.lucidita);
        record(s,"physical",{status:"pushed",choice:"push",roleId:job&&job.id||null,
          effects:Object.assign({},push)});
        return {t:"Hai ignorato la stanchezza. <b>"+
          factoryFxLabel(push)+".</b>",c:"bad"};
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
  const p=s && s.pendingConflictMiss;
  if(!p) return null;
  delete s.pendingConflictMiss;

  if(p.day!==absDay() || !p.voice){
    try{ if(typeof save==="function") save(); }catch(_){}
    return null;
  }
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
    endedAt:to,
    earnedPay:Number(p.pay||0),
    eventWeight:Number(p.eventWeight||1),
    attendance:p.attendance?Object.assign({},p.attendance):null
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
  if(showFactoryRole(job,s,r("role"))) return true;
  if(showFactoryFloor(job,s,r("factory"))) return true;
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