(function(root){
  "use strict";

  function testo(v,nome){
    if(typeof v!=="string" || !v.trim())
      throw new TypeError(nome+" obbligatorio");
    return v.trim();
  }

  function giorno(v,nome="giorno"){
    let n=null;
    if(typeof v==="number") n=v;
    else if(typeof v==="string" && /^\d+$/.test(v.trim())) n=Number(v.trim());
    if(!Number.isSafeInteger(n) || n<=0)
      throw new TypeError(nome+" deve essere un giorno assoluto positivo");
    return n;
  }

  function persona(p){
    if(!p || typeof p!=="object" || Array.isArray(p) ||
       typeof p.id!=="string" || !p.id.trim())
      throw new TypeError("PERSONA valida con id obbligatorio");
    return p;
  }

  function registro(v){
    if(!Array.isArray(v))
      throw new TypeError("registro gruppi deve essere un array");
    return v;
  }

  function cerchieApi(){
    const api=root&&root.ADF_NPC_CERCHIE;
    if(!api || typeof api.cerchie!=="function")
      throw new Error("ADF_NPC_CERCHIE non disponibile");
    return api;
  }

  function legamiApi(){
    const api=root&&root.ADF_NPC_LEGAMI;
    if(!api || typeof api.legami!=="function")
      throw new Error("ADF_NPC_LEGAMI non disponibile");
    return api;
  }

  function trova(reg,id){
    const gid=testo(id,"groupId");
    return registro(reg).find(g=>g&&g.groupId===gid)||null;
  }

  function membriAttivi(g){
    if(!g || !Array.isArray(g.membri)) return Object.freeze([]);
    return Object.freeze(
      g.membri.filter(m=>m&&m.uscitoGiorno==null).map(m=>m.personId)
    );
  }

  function stessoSet(a,b){
    const aa=[...a].sort(),bb=[...b].sort();
    return aa.length===bb.length&&aa.every((v,i)=>v===bb[i]);
  }

  function validaPersone(persone){
    if(!Array.isArray(persone))
      throw new TypeError("persone deve essere un array");
    const byId=new Map();
    for(const p of persone){
      persona(p);
      if(byId.has(p.id)) throw new RangeError("id PERSONA duplicato: "+p.id);
      byId.set(p.id,p);
    }
    return byId;
  }

  function candidati(reg,persone){
    const groups=registro(reg);
    const circles=cerchieApi().cerchie(persone);
    return Object.freeze(circles.filter(c=>{
      const ids=c.memberIds;
      return !groups.some(g=>
        g&&g.stato!=="sciolto"&&(
          g.origineCerchiaKey===c.key ||
          stessoSet(membriAttivi(g),ids)
        )
      );
    }));
  }

  function promuoviCerchia(reg,persone,cerchiaKey,meta){
    const groups=registro(reg);
    const byId=validaPersone(persone);
    meta=meta&&typeof meta==="object"?meta:{};

    const key=testo(cerchiaKey,"cerchiaKey");
    const circle=cerchieApi().cerchie(persone).find(c=>c.key===key);
    if(!circle)
      throw new RangeError("cerchia corrente non trovata: "+key);

    const groupId=testo(meta.groupId,"groupId");
    if(trova(groups,groupId))
      throw new RangeError("groupId gia esistente: "+groupId);

    if(groups.some(g=>g&&g.stato!=="sciolto"&&(
      g.origineCerchiaKey===circle.key ||
      stessoSet(membriAttivi(g),circle.memberIds)
    ))) throw new RangeError("cerchia gia promossa a gruppo attivo");

    const d=giorno(meta.giorno);
    const fonte=testo(meta.fonte,"fonte");
    const tipo=testo(meta.tipo,"tipo");
    const nome=meta.nome==null?null:testo(meta.nome,"nome");
    const contesto=meta.contesto==null?null:testo(meta.contesto,"contesto");

    for(const id of circle.memberIds)
      if(!byId.has(id)) throw new RangeError("membro PERSONA mancante: "+id);

    const g={
      groupId,
      nome,
      tipo,
      contesto,
      stato:"attivo",
      creatoGiorno:d,
      fonte,
      origineCerchiaKey:circle.key,
      membri:circle.memberIds.map(personId=>({
        personId,
        entratoGiorno:d,
        fonte,
        uscitoGiorno:null,
        uscitaFonte:null
      })),
      luoghi:[]
    };

    if(meta.cittaId!=null || meta.ambienteId!=null){
      g.luoghi.push({
        dalGiorno:d,
        cittaId:meta.cittaId==null?null:testo(meta.cittaId,"cittaId"),
        ambienteId:meta.ambienteId==null?null:testo(meta.ambienteId,"ambienteId"),
        fonte
      });
    }

    groups.push(g);
    return g;
  }

  function aggiungiMembro(reg,groupId,p,meta){
    const g=trova(reg,groupId);
    if(!g) throw new RangeError("gruppo non trovato: "+groupId);
    if(g.stato==="sciolto") throw new RangeError("gruppo sciolto");
    persona(p);
    meta=meta&&typeof meta==="object"?meta:{};
    const d=giorno(meta.giorno);
    const fonte=testo(meta.fonte,"fonte");
    if(d<Number(g.creatoGiorno))
      throw new RangeError("ingresso precedente alla creazione del gruppo");

    const corrente=(g.membri||[]).find(m=>m&&m.personId===p.id&&m.uscitoGiorno==null);
    if(corrente) return corrente;

    g.membri=g.membri||[];
    const ultimo=[...g.membri].reverse().find(m=>m&&m.personId===p.id);
    if(ultimo&&ultimo.uscitoGiorno!=null&&d<=Number(ultimo.uscitoGiorno))
      throw new RangeError("rientro precedente all'uscita");

    const m={
      personId:p.id,
      entratoGiorno:d,
      fonte,
      uscitoGiorno:null,
      uscitaFonte:null
    };
    g.membri.push(m);
    return m;
  }

  function rimuoviMembro(reg,groupId,personId,meta){
    const g=trova(reg,groupId);
    if(!g) throw new RangeError("gruppo non trovato: "+groupId);
    if(g.stato==="sciolto") throw new RangeError("gruppo gia sciolto");
    const id=testo(personId,"personId");
    meta=meta&&typeof meta==="object"?meta:{};
    const d=giorno(meta.giorno);
    const fonte=testo(meta.fonte,"fonte");

    const m=(g.membri||[]).find(x=>x&&x.personId===id&&x.uscitoGiorno==null);
    if(!m) throw new RangeError("membro attivo non trovato: "+id);
    if(d<Number(m.entratoGiorno))
      throw new RangeError("uscita precedente all'ingresso");
    m.uscitoGiorno=d;
    m.uscitaFonte=fonte;
    return m;
  }

  function sciogli(reg,groupId,meta){
    const g=trova(reg,groupId);
    if(!g) throw new RangeError("gruppo non trovato: "+groupId);
    meta=meta&&typeof meta==="object"?meta:{};
    const d=giorno(meta.giorno);
    const fonte=testo(meta.fonte,"fonte");
    if(g.stato==="sciolto") return g;
    if(d<Number(g.creatoGiorno))
      throw new RangeError("scioglimento precedente alla creazione");
    g.stato="sciolto";
    g.scioltoGiorno=d;
    g.scioltoFonte=fonte;
    for(const m of g.membri||[]){
      if(m&&m.uscitoGiorno==null){
        m.uscitoGiorno=d;
        m.uscitaFonte=fonte;
      }
    }
    return g;
  }

  function sposta(reg,groupId,meta){
    const g=trova(reg,groupId);
    if(!g) throw new RangeError("gruppo non trovato: "+groupId);
    if(g.stato==="sciolto") throw new RangeError("gruppo sciolto");
    meta=meta&&typeof meta==="object"?meta:{};
    const d=giorno(meta.giorno);
    const fonte=testo(meta.fonte,"fonte");
    if(d<Number(g.creatoGiorno))
      throw new RangeError("spostamento precedente alla creazione del gruppo");
    if(meta.cittaId==null && meta.ambienteId==null)
      throw new TypeError("cittaId o ambienteId obbligatorio");

    g.luoghi=Array.isArray(g.luoghi)?g.luoghi:[];
    const stessoGiorno=g.luoghi.find(x=>x&&Number(x.dalGiorno)===d);
    const nuovo={
      dalGiorno:d,
      cittaId:meta.cittaId==null?null:testo(meta.cittaId,"cittaId"),
      ambienteId:meta.ambienteId==null?null:testo(meta.ambienteId,"ambienteId"),
      fonte
    };
    if(stessoGiorno){
      const uguale=stessoGiorno.cittaId===nuovo.cittaId &&
        stessoGiorno.ambienteId===nuovo.ambienteId;
      if(uguale) return stessoGiorno;
      throw new RangeError("due luoghi diversi nello stesso giorno");
    }
    g.luoghi.push(nuovo);
    g.luoghi.sort((a,b)=>Number(a.dalGiorno)-Number(b.dalGiorno));
    return nuovo;
  }

  function luogo(reg,groupId,giornoRichiesto){
    const g=trova(reg,groupId);
    if(!g) return null;
    const d=giorno(giornoRichiesto);
    let out=null;
    for(const x of Array.isArray(g.luoghi)?g.luoghi:[]){
      if(Number(x.dalGiorno)>d) break;
      out=x;
    }
    return out?Object.freeze({...out}):null;
  }

  function gruppiPerPersona(reg,personId,opts){
    const id=testo(personId,"personId");
    const includeSciolti=!!(opts&&opts.includeSciolti);
    return Object.freeze(registro(reg).filter(g=>{
      if(!g || (!includeSciolti&&g.stato==="sciolto")) return false;
      const membri=Array.isArray(g.membri)?g.membri:[];
      return includeSciolti
        ? membri.some(m=>m&&m.personId===id)
        : membri.some(m=>m&&m.personId===id&&m.uscitoGiorno==null);
    }));
  }

  function coesione(g,persone){
    if(!g||typeof g!=="object") throw new TypeError("gruppo non valido");
    const byId=validaPersone(persone);
    const ids=membriAttivi(g).filter(id=>byId.has(id));
    if(ids.length<2) return 0;

    const api=legamiApi();
    let archi=0;
    for(let i=0;i<ids.length;i++){
      const a=byId.get(ids[i]);
      const versoA=new Set(
        api.legami(a,{coPresenza:true}).map(x=>String(x.personId))
      );
      for(let j=i+1;j<ids.length;j++){
        const b=byId.get(ids[j]);
        if(!versoA.has(b.id)) continue;
        const reciproco=api.legami(b,{coPresenza:true})
          .some(x=>String(x.personId)===a.id);
        if(reciproco) archi++;
      }
    }
    const possibili=ids.length*(ids.length-1)/2;
    return possibili?archi/possibili:0;
  }

  function vista(g,persone,giornoRichiesto){
    if(!g||typeof g!=="object") throw new TypeError("gruppo non valido");
    const loc=giornoRichiesto==null?null:luogo([g],g.groupId,giornoRichiesto);
    return Object.freeze({
      groupId:g.groupId,
      nome:g.nome||null,
      tipo:g.tipo,
      contesto:g.contesto||null,
      stato:g.stato||"attivo",
      memberIds:membriAttivi(g),
      coesione:coesione(g,persone),
      luogo:loc
    });
  }

  root.ADF_NPC_GRUPPI=Object.freeze({
    candidati,
    promuoviCerchia,
    aggiungiMembro,
    rimuoviMembro,
    sciogli,
    sposta,
    luogo,
    trova,
    membriAttivi,
    gruppiPerPersona,
    coesione,
    vista
  });
})(typeof window!=="undefined"?window:globalThis);
