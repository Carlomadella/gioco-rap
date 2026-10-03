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

  function vistaRecord(r){
    if(!r || typeof r!=="object" || !r.personId) return null;
    const t=TIPI[r.tipo] ? r.tipo : "conoscenza";
    const per=PERCEZIONI.has(r.percezione) ? r.percezione : null;
    return Object.freeze({
      personId:String(r.personId),
      tipo:t,
      percezione:per,
      sottotipo:r.sottotipo==null?null:String(r.sottotipo),
      reason:r.reason==null?null:String(r.reason),
      sinceWeek:settimana(r.sinceWeek),
      tipoEsplicito:TIPI[r.tipo]!=null,
      percezioneEsplicita:per!=null,
      coPresenza:TIPI[t].coPresenza===true
    });
  }

  function legami(p,opzioni){
    const opts=opzioni&&typeof opzioni==="object"?opzioni:{};
    const tipi=Array.isArray(opts.tipi)&&opts.tipi.length
      ? new Set(opts.tipi.map(tipo)) : null;
    const co=opts.coPresenza;

    const out=[];
    const seen=new Set();
    for(const r of raw(p,false)){
      const v=vistaRecord(r);
      if(!v || v.personId===p.id || seen.has(v.personId)) continue;
      seen.add(v.personId);
      if(tipi&&!tipi.has(v.tipo)) continue;
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

    /* Il primo momento noto resta stabile. I vecchi record senza tipo vengono
       arricchiti soltanto quando un evento li tocca davvero. */
    rec.tipo=t;
    if(per!=null) rec.percezione=per;
    else if(Object.prototype.hasOwnProperty.call(opts,"percezione")) delete rec.percezione;

    if(opts.sottotipo!=null && String(opts.sottotipo).trim())
      rec.sottotipo=String(opts.sottotipo).trim();
    else if(Object.prototype.hasOwnProperty.call(opts,"sottotipo")) delete rec.sottotipo;

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

    const va=upsert(a,b,{
      tipo:opts.tipoA||baseTipo,
      percezione:Object.prototype.hasOwnProperty.call(opts,"percezioneA")
        ? opts.percezioneA : opts.percezione,
      sottotipo:Object.prototype.hasOwnProperty.call(opts,"sottotipoA")
        ? opts.sottotipoA : opts.sottotipo,
      reason:opts.reason,
      sinceWeek:opts.sinceWeek
    });

    let vb=null;
    if(reciproco){
      vb=upsert(b,a,{
        tipo:opts.tipoB||baseTipo,
        percezione:Object.prototype.hasOwnProperty.call(opts,"percezioneB")
          ? opts.percezioneB : opts.percezione,
        sottotipo:Object.prototype.hasOwnProperty.call(opts,"sottotipoB")
          ? opts.sottotipoB : opts.sottotipo,
        reason:opts.reason,
        sinceWeek:opts.sinceWeek
      });
    }

    return Object.freeze({aVersoB:va,bVersoA:vb,reciproco});
  }

  function tra(a,b){
    persona(a); persona(b);
    const ab=legame(a,b.id);
    const ba=legame(b,a.id);
    return Object.freeze({
      aId:a.id,bId:b.id,
      aVersoB:ab,bVersoA:ba,
      reciproco:!!(ab&&ba),
      simmetrico:!!(ab&&ba&&
        ab.tipo===ba.tipo&&
        ab.percezione===ba.percezione&&
        ab.sottotipo===ba.sottotipo)
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
    tra,
    personeCollegate
  });
})(typeof window!=="undefined"?window:globalThis);
