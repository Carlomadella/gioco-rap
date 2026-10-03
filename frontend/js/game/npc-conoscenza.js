(function(root){
  "use strict";

  const TIPI=new Set([
    "carattere-legacy","tratto","interesse","appartenenza",
    "legame-esistenza","legame-tipo","legame-percezione","legame-sottotipo",
    "provenienza"
  ]);

  function persona(p){
    if(!p || typeof p!=="object" || Array.isArray(p) ||
       typeof p.id!=="string" || !p.id.trim())
      throw new TypeError("PERSONA valida con id obbligatorio");
    return p;
  }

  function testo(v,nome){
    if(typeof v!=="string" || !v.trim())
      throw new TypeError(nome+" obbligatorio");
    return v.trim();
  }

  function giorno(v){
    if(v==null) return null;
    let n=null;
    if(typeof v==="number") n=v;
    else if(typeof v==="string" && /^\d+$/.test(v.trim())) n=Number(v.trim());
    if(!Number.isSafeInteger(n) || n<=0)
      throw new TypeError("giorno deve essere un intero positivo");
    return n;
  }

  function normalizzaFatto(f){
    if(!f || typeof f!=="object" || Array.isArray(f))
      throw new TypeError("fatto non valido");
    const tipo=testo(f.tipo,"tipo");
    if(!TIPI.has(tipo)) throw new RangeError("tipo conoscenza sconosciuto: "+tipo);

    let id=null;
    if(tipo!=="provenienza") id=testo(f.id,"id");
    let valore=null;
    if(tipo==="legame-tipo" || tipo==="legame-percezione" || tipo==="legame-sottotipo")
      valore=testo(f.valore,"valore");
    return Object.freeze({tipo,id,valore});
  }

  function chiave(f){
    const n=normalizzaFatto(f);
    return n.tipo+
      (n.id==null?"":":"+n.id)+
      (n.valore==null?"":":"+n.valore);
  }

  function trattiReali(p){
    const x=p.personalita&&p.personalita.tratti;
    return Array.isArray(x)?x.filter(v=>typeof v==="string"):[];
  }

  function interessiReali(p){
    const x=p.personalita&&p.personalita.interessi;
    return Array.isArray(x)?x.filter(v=>typeof v==="string"):[];
  }

  function appartenenzaReale(p,id){
    return Array.isArray(p.appartenenze) &&
      p.appartenenze.some(x=>x&&x.ambienteId===id);
  }

  function legameReale(p,personId){
    if(!Array.isArray(p.reteLegami)) return null;
    return p.reteLegami.find(x=>x&&String(x.personId)===personId)||null;
  }

  function provenienzaReale(p){
    return !!(p.identita&&p.identita.provenienza);
  }

  function esiste(p,f){
    persona(p);
    const n=normalizzaFatto(f);
    switch(n.tipo){
      case "carattere-legacy":
        return typeof p.car==="string" && p.car===n.id;
      case "tratto":
        return trattiReali(p).includes(n.id);
      case "interesse":
        return interessiReali(p).includes(n.id);
      case "appartenenza":
        return appartenenzaReale(p,n.id);
      case "legame-esistenza":
        return !!legameReale(p,n.id);
      case "legame-tipo":{
        const r=legameReale(p,n.id);
        return !!(r&&typeof r.tipo==="string"&&r.tipo===n.valore);
      }
      case "legame-percezione":{
        const r=legameReale(p,n.id);
        return !!(r&&typeof r.percezione==="string"&&r.percezione===n.valore);
      }
      case "legame-sottotipo":{
        const r=legameReale(p,n.id);
        return !!(r&&typeof r.sottotipo==="string"&&r.sottotipo===n.valore);
      }
      case "provenienza":
        return provenienzaReale(p);
      default:
        return false;
    }
  }

  function contenitore(p,crea){
    persona(p);
    if(p.conoscenza==null){
      if(!crea) return null;
      p.conoscenza={versione:1,fatti:{}};
    }
    if(typeof p.conoscenza!=="object" || Array.isArray(p.conoscenza))
      throw new TypeError("p.conoscenza deve essere un oggetto");
    if(p.conoscenza.fatti==null){
      if(!crea) return null;
      p.conoscenza.fatti={};
    }
    if(typeof p.conoscenza.fatti!=="object" || Array.isArray(p.conoscenza.fatti))
      throw new TypeError("p.conoscenza.fatti deve essere un oggetto");
    return p.conoscenza;
  }

  function scopri(p,f,meta){
    persona(p);
    const n=normalizzaFatto(f);
    if(!esiste(p,n))
      throw new RangeError("non si puo scoprire un fatto non presente nella PERSONA");

    meta=meta&&typeof meta==="object"?meta:{};
    const source=testo(meta.fonte,"fonte");
    const day=giorno(meta.giorno);
    const key=chiave(n);
    const box=contenitore(p,true);

    if(box.fatti[key]) return Object.freeze({...box.fatti[key]});

    box.versione=1;
    box.fatti[key]={
      fonte:source,
      giorno:day
    };
    return Object.freeze({...box.fatti[key]});
  }

  function legacySa(p,n){
    return n.tipo==="carattere-legacy" &&
      typeof p.car==="string" && p.car===n.id && p.scoperto===true;
  }

  function sa(p,f){
    persona(p);
    const n=normalizzaFatto(f);
    if(legacySa(p,n)) return true;
    const box=contenitore(p,false);
    return !!(box&&box.fatti&&box.fatti[chiave(n)]);
  }

  function prove(p){
    persona(p);
    const box=contenitore(p,false);
    if(!box) return Object.freeze([]);
    return Object.freeze(Object.entries(box.fatti).map(([key,v])=>Object.freeze({
      key,
      fonte:v&&v.fonte!=null?String(v.fonte):null,
      giorno:v&&v.giorno!=null?Number(v.giorno):null
    })));
  }

  function trattiConosciuti(p){
    persona(p);
    return Object.freeze(trattiReali(p).filter(id=>sa(p,{tipo:"tratto",id})));
  }

  function interessiConosciuti(p){
    persona(p);
    return Object.freeze(interessiReali(p).filter(id=>sa(p,{tipo:"interesse",id})));
  }

  function appartenenzeConosciute(p){
    persona(p);
    if(!Array.isArray(p.appartenenze)) return Object.freeze([]);
    const out=[];
    const seen=new Set();
    for(const e of p.appartenenze){
      if(!e||typeof e.ambienteId!=="string"||seen.has(e.ambienteId)) continue;
      if(sa(p,{tipo:"appartenenza",id:e.ambienteId})){
        seen.add(e.ambienteId);
        out.push(e.ambienteId);
      }
    }
    return Object.freeze(out);
  }

  function legamiConosciuti(p){
    persona(p);
    if(!Array.isArray(p.reteLegami)) return Object.freeze([]);
    const out=[];
    const seen=new Set();

    for(const r of p.reteLegami){
      if(!r||!r.personId) continue;
      const id=String(r.personId);
      if(seen.has(id)||!sa(p,{tipo:"legame-esistenza",id})) continue;
      seen.add(id);

      const item={personId:id};
      if(typeof r.tipo==="string" &&
         sa(p,{tipo:"legame-tipo",id,valore:r.tipo}))
        item.tipo=r.tipo;
      if(typeof r.percezione==="string" &&
         sa(p,{tipo:"legame-percezione",id,valore:r.percezione}))
        item.percezione=r.percezione;
      if(typeof r.sottotipo==="string" &&
         sa(p,{tipo:"legame-sottotipo",id,valore:r.sottotipo}))
        item.sottotipo=r.sottotipo;
      out.push(Object.freeze(item));
    }

    return Object.freeze(out);
  }

  function profilo(p){
    persona(p);
    const legacyCar=(typeof p.car==="string" &&
      sa(p,{tipo:"carattere-legacy",id:p.car})) ? p.car : null;

    return Object.freeze({
      personId:p.id,
      carattereLegacy:legacyCar,
      tratti:trattiConosciuti(p),
      interessi:interessiConosciuti(p),
      provenienza:sa(p,{tipo:"provenienza"})
        ? (p.identita&&p.identita.provenienza)||null
        : null,
      appartenenze:appartenenzeConosciute(p),
      legami:legamiConosciuti(p)
    });
  }

  root.ADF_NPC_CONOSCENZA=Object.freeze({
    chiave,
    esiste,
    sa,
    scopri,
    prove,
    trattiConosciuti,
    interessiConosciuti,
    appartenenzeConosciute,
    legamiConosciuti,
    profilo
  });
})(typeof window!=="undefined"?window:globalThis);
