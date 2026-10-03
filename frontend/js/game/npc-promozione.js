(function(root){
  "use strict";

  const MOTIVI=Object.freeze(["contatto","relazione","ricorrenza","narrativa"]);

  function testo(v,nome){
    if(typeof v!=="string" || !v.trim())
      throw new TypeError(nome+" obbligatorio");
    return v.trim();
  }

  function giorno(v){
    let n=null;
    if(typeof v==="number") n=v;
    else if(typeof v==="string" && /^\\d+$/.test(v.trim())) n=Number(v.trim());
    if(!Number.isSafeInteger(n) || n<=0)
      throw new TypeError("giorno deve essere un intero positivo");
    return n;
  }

  function personaValida(p){
    return !!(p && typeof p==="object" && !Array.isArray(p) &&
      typeof p.id==="string" && p.id.trim());
  }

  function temporaneo(raw){
    if(!raw || typeof raw!=="object" || Array.isArray(raw))
      throw new TypeError("NPC temporaneo non valido");
    const tipo=testo(raw.tipo,"tipo temporaneo");
    const id=testo(raw.id,"id temporaneo");
    return {tipo,id,chiave:tipo+":"+id};
  }

  function validaPersone(persone){
    if(!Array.isArray(persone)) throw new TypeError("persone deve essere un array");
    const ids=new Set();
    for(const p of persone){
      if(!personaValida(p)) throw new TypeError("PERSONA canonica non valida");
      if(ids.has(p.id)) throw new RangeError("ID PERSONA duplicato in G.gente: "+p.id);
      ids.add(p.id);
    }
    return ids;
  }

  function chiave(raw){ return temporaneo(raw).chiave; }

  function recordPromozione(p){
    if(!p || typeof p!=="object" || p.promozioneTemporanea==null) return null;
    const r=p.promozioneTemporanea;
    if(typeof r!=="object" || Array.isArray(r))
      throw new TypeError("promozioneTemporanea non valida per "+(p.id||"PERSONA"));
    const ref=temporaneo({tipo:r.tipo,id:r.id});
    return {...r,chiave:ref.chiave};
  }

  function risolvi(persone,raw){
    validaPersone(persone);
    const ref=temporaneo(raw);
    let trovato=null;
    for(const p of persone){
      const r=recordPromozione(p);
      if(!r || r.chiave!==ref.chiave) continue;
      if(trovato && trovato!==p)
        throw new RangeError("origine temporanea duplicata: "+ref.chiave);
      trovato=p;
    }
    return trovato;
  }

  function copiaIdentitaNota(dest,raw){
    if(typeof raw.n==="string" && raw.n.trim()) dest.n=raw.n.trim();
    if(raw.fama!=null){
      const n=Number(raw.fama);
      if(Number.isFinite(n)) dest.fama=n;
    }
    for(const k of ["eta","skin","hair","col"]){
      if(raw[k]!==undefined && raw[k]!==null) dest[k]=raw[k];
    }
  }

  function promuovi(persone,raw,meta){
    const ids=validaPersone(persone);
    const ref=temporaneo(raw);
    const gia=risolvi(persone,raw);
    if(gia) return gia;

    meta=meta&&typeof meta==="object"?meta:{};
    const motivo=testo(meta.motivo,"motivo");
    if(!MOTIVI.includes(motivo))
      throw new TypeError("motivo promozione non supportato: "+motivo);
    const g=giorno(meta.giorno);
    const fonte=testo(meta.fonte,"fonte");
    if(typeof meta.crea!=="function")
      throw new TypeError("crea deve essere una funzione");

    const p=meta.crea(raw);
    if(!personaValida(p)) throw new TypeError("crea deve restituire una PERSONA con id");
    if(ids.has(p.id)) throw new RangeError("ID PERSONA gia esistente: "+p.id);
    if(p.promozioneTemporanea!=null)
      throw new RangeError("la PERSONA creata possiede gia una origine temporanea");

    copiaIdentitaNota(p,raw);
    p.promozioneTemporanea={
      versione:1,
      tipo:ref.tipo,
      id:ref.id,
      giorno:g,
      motivo,
      fonte
    };
    persone.push(p);
    return p;
  }

  root.ADF_NPC_PROMOZIONE=Object.freeze({
    versione:1,
    motivi:()=>MOTIVI.slice(),
    chiave,
    risolvi,
    promuovi
  });
})(typeof window!=="undefined"?window:globalThis);
