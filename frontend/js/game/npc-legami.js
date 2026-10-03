(function(root){
  "use strict";

  const TIPI=Object.freeze({
    conoscenza:Object.freeze({id:"conoscenza",coPresenza:true}),
    amicizia:Object.freeze({id:"amicizia",coPresenza:true}),
    collaborazione:Object.freeze({id:"collaborazione",coPresenza:true}),
    rivalita:Object.freeze({id:"rivalita",coPresenza:false}),
    parentela:Object.freeze({id:"parentela",coPresenza:true})
  });
  const PERCEZIONI=new Set(["positiva","neutra","negativa","ambivalente"]);

  function persona(p){
    if(!p || typeof p!=="object" || Array.isArray(p) ||
       typeof p.id!=="string" || !p.id.trim())
      throw new TypeError("PERSONA valida con id obbligatorio");
    return p;
  }

  function tipo(v){
    const id=String(v||"conoscenza");
    if(!TIPI[id]) throw new RangeError("tipo legame sconosciuto: "+id);
    return id;
  }

  function percezione(v){
    if(v==null || v==="") return null;
    const id=String(v);
    if(!PERCEZIONI.has(id))
      throw new RangeError("percezione legame sconosciuta: "+id);
    return id;
  }

  function settimana(v){
    const n=Number(v);
    return Number.isFinite(n) && n>0 ? Math.trunc(n) : null;
  }

  function raw(p,crea){
    persona(p);
    if(!Array.isArray(p.reteLegami)){
      if(!crea) return [];
      p.reteLegami=[];
    }
    return p.reteLegami;
  }

  function tipiRecord(r){
    const out=[];
    const add=v=>{
      if(TIPI[v] && !out.includes(v)) out.push(v);
    };
    if(r&&Array.isArray(r.tipi)) r.tipi.forEach(add);
    if(r&&TIPI[r.tipo]) add(r.tipo);
    if(!out.length) out.push("conoscenza");
    return out;
  }

  function vistaRecord(r){
    if(!r || typeof r!=="object" || !r.personId) return null;
    const ts=tipiRecord(r);
    const per=PERCEZIONI.has(r.percezione) ? r.percezione : null;
    return Object.freeze({
      personId:String(r.personId),
      tipi:Object.freeze(ts.slice()),
      /* `tipo` e' una comodita' solo quando non e' ambiguo. */
      tipo:ts.length===1?ts[0]:null,
      percezione:per,
      sottotipo:r.sottotipo==null?null:String(r.sottotipo),
      reason:r.reason==null?null:String(r.reason),
      sinceWeek:settimana(r.sinceWeek),
      tipoEsplicito:!!(
        (Array.isArray(r.tipi)&&r.tipi.some(x=>TIPI[x])) || TIPI[r.tipo]
      ),
      percezioneEsplicita:per!=null,
      coPresenza:ts.some(x=>TIPI[x].coPresenza===true)
    });
  }

  function legami(p,opzioni){
    persona(p);
    const opts=opzioni&&typeof opzioni==="object"?opzioni:{};
    const richiesti=Array.isArray(opts.tipi)&&opts.tipi.length
      ? new Set(opts.tipi.map(tipo)) : null;
    const co=opts.coPresenza;

    const out=[];
    const seen=new Set();
    for(const r of raw(p,false)){
      const v=vistaRecord(r);
      if(!v || v.personId===p.id || seen.has(v.personId)) continue;
      seen.add(v.personId);
      if(richiesti && !v.tipi.some(x=>richiesti.has(x))) continue;
      if(co===true&&!v.coPresenza) continue;
      if(co===false&&v.coPresenza) continue;
      out.push(v);
    }
    return Object.freeze(out);
  }

  function legame(p,personId){
    const id=String(personId||"");
    return legami(p).find(x=>x.personId===id)||null;
  }

  function nuoviTipi(rec,t,sostituisci){
    if(sostituisci) return [t];
    let ts=tipiRecord(rec);

    /* conoscenza e' il fallback generico: un fatto piu' specifico la rende
       ridondante, ma gli altri tipi specifici possono convivere. */
    if(t!=="conoscenza"){
      ts=ts.filter(x=>x!=="conoscenza");
      if(!ts.includes(t)) ts.push(t);
    }else if(!ts.length){
      ts=["conoscenza"];
    }
    return ts.length?ts:["conoscenza"];
  }

  function upsert(da,aChi,opts){
    persona(da); persona(aChi);
    if(da===aChi || da.id===aChi.id)
      throw new RangeError("un NPC non puo avere un legame con se stesso");

    opts=opts&&typeof opts==="object"?opts:{};
    const t=tipo(opts.tipo);
    const per=percezione(opts.percezione);
    const list=raw(da,true);
    let rec=list.find(x=>x&&String(x.personId)===aChi.id);

    if(!rec){
      rec={personId:aChi.id};
      list.push(rec);
    }

    rec.tipi=nuoviTipi(rec,t,opts.sostituisciTipi===true);
    delete rec.tipo;

    if(opts.hasPercezione===true){
      if(per!=null) rec.percezione=per;
      else delete rec.percezione;
    }

    if(opts.hasSottotipo===true){
      if(opts.sottotipo!=null && String(opts.sottotipo).trim())
        rec.sottotipo=String(opts.sottotipo).trim();
      else delete rec.sottotipo;
    }

    if(opts.reason!=null && String(opts.reason).trim())
      rec.reason=String(opts.reason);
    else if(!rec.reason) rec.reason="contatto-comune";

    const sw=settimana(opts.sinceWeek);
    if(rec.sinceWeek==null && sw!=null) rec.sinceWeek=sw;

    return vistaRecord(rec);
  }

  function collega(a,b,opzioni){
    persona(a); persona(b);
    if(a===b || a.id===b.id)
      throw new RangeError("un NPC non puo avere un legame con se stesso");

    const opts=opzioni&&typeof opzioni==="object"?opzioni:{};
    const baseTipo=tipo(opts.tipo);
    const reciproco=opts.reciproco!==false;
    const haValore=(obj,key)=>
      Object.prototype.hasOwnProperty.call(obj,key) && obj[key]!==undefined;
    const hasPerA=haValore(opts,"percezioneA") || haValore(opts,"percezione");
    const hasPerB=haValore(opts,"percezioneB") || haValore(opts,"percezione");
    const hasSubA=haValore(opts,"sottotipoA") || haValore(opts,"sottotipo");
    const hasSubB=haValore(opts,"sottotipoB") || haValore(opts,"sottotipo");

    const va=upsert(a,b,{
      tipo:opts.tipoA||baseTipo,
      sostituisciTipi:opts.sostituisciTipi===true,
      percezione:Object.prototype.hasOwnProperty.call(opts,"percezioneA")
        ? opts.percezioneA : opts.percezione,
      hasPercezione:hasPerA,
      sottotipo:Object.prototype.hasOwnProperty.call(opts,"sottotipoA")
        ? opts.sottotipoA : opts.sottotipo,
      hasSottotipo:hasSubA,
      reason:opts.reason,
      sinceWeek:opts.sinceWeek
    });

    let vb=null;
    if(reciproco){
      vb=upsert(b,a,{
        tipo:opts.tipoB||baseTipo,
        sostituisciTipi:opts.sostituisciTipi===true,
        percezione:Object.prototype.hasOwnProperty.call(opts,"percezioneB")
          ? opts.percezioneB : opts.percezione,
        hasPercezione:hasPerB,
        sottotipo:Object.prototype.hasOwnProperty.call(opts,"sottotipoB")
          ? opts.sottotipoB : opts.sottotipo,
        hasSottotipo:hasSubB,
        reason:opts.reason,
        sinceWeek:opts.sinceWeek
      });
    }

    return Object.freeze({aVersoB:va,bVersoA:vb,reciproco});
  }

  function rimuoviTipo(da,aChi,tipoId){
    persona(da); persona(aChi);
    const t=tipo(tipoId);
    const list=raw(da,false);
    const idx=list.findIndex(x=>x&&String(x.personId)===aChi.id);
    if(idx<0) return false;
    const rec=list[idx];
    const ts=tipiRecord(rec).filter(x=>x!==t);
    if(!ts.length){
      list.splice(idx,1);
      return true;
    }
    rec.tipi=ts;
    delete rec.tipo;
    return true;
  }

  function tra(a,b){
    persona(a); persona(b);
    const ab=legame(a,b.id);
    const ba=legame(b,a.id);
    const key=v=>v?v.tipi.slice().sort().join("|")+";"+String(v.percezione)+";"+String(v.sottotipo):"";
    return Object.freeze({
      aId:a.id,bId:b.id,
      aVersoB:ab,bVersoA:ba,
      reciproco:!!(ab&&ba),
      simmetrico:!!(ab&&ba&&key(ab)===key(ba))
    });
  }

  function personeCollegate(p,persone,opzioni){
    persona(p);
    if(!Array.isArray(persone)) throw new TypeError("persone deve essere un array");
    const ids=new Set(legami(p,opzioni).map(x=>x.personId));
    return persone.filter(x=>x&&x.id!==p.id&&!x.via&&ids.has(x.id));
  }

  root.ADF_NPC_LEGAMI=Object.freeze({
    tipi:()=>TIPI,
    legami,
    legame,
    collega,
    rimuoviTipo,
    tra,
    personeCollegate
  });
})(typeof window!=="undefined"?window:globalThis);
