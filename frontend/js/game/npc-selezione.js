(function(root){
  "use strict";

  function testo(v,nome){
    if(typeof v!=="string" || !v.trim())
      throw new TypeError(nome+" obbligatorio");
    return v.trim();
  }

  function giorno(v){
    let n=null;
    if(typeof v==="number") n=v;
    else if(typeof v==="string" && /^\d+$/.test(v.trim())) n=Number(v.trim());
    if(!Number.isSafeInteger(n) || n<=0)
      throw new TypeError("giorno deve essere un intero positivo");
    return n;
  }

  function budget(v){
    if(v==null) return 0;
    const n=Number(v);
    if(!Number.isSafeInteger(n) || n<0)
      throw new TypeError("quanti deve essere un intero non negativo");
    return n;
  }

  function periodo(v){
    if((typeof v!=="string" && typeof v!=="number") || String(v).trim()==="")
      throw new TypeError("periodo obbligatorio");
    return String(v);
  }

  function hash32(s){
    let h=2166136261;
    const text=String(s);
    for(let i=0;i<text.length;i++){
      h^=text.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return h>>>0;
  }

  function personaValida(p){
    return !!(p && typeof p==="object" && !Array.isArray(p) &&
      typeof p.id==="string" && p.id.trim());
  }

  function snapshotValido(m,ambienteId,periodoId){
    return !!(m && typeof m==="object" && !Array.isArray(m) &&
      m.ambienteId===ambienteId &&
      String(m.periodo)===periodoId &&
      Array.isArray(m.ids));
  }

  function appartenenzaAmmessa(root,p,ambienteId,g){
    if(p.appartenenze===undefined || p.appartenenze===null) return null;
    if(!Array.isArray(p.appartenenze))
      throw new TypeError("p.appartenenze deve essere un array");
    const api=root.ADF_NPC_APPARTENENZE;
    if(!api || typeof api.attive!=="function")
      throw new Error("ADF_NPC_APPARTENENZE richiesto per appartenenze esplicite");
    return api.attive(p,g).some(e=>e && e.ambienteId===ambienteId);
  }

  function punteggioFinito(fn,p){
    if(typeof fn!=="function") return 0;
    const n=Number(fn(p));
    if(!Number.isFinite(n))
      throw new TypeError("punteggio deve restituire un numero finito");
    return n;
  }

  function legamiIds(fn,p){
    if(typeof fn!=="function") return [];
    const raw=fn(p);
    if(raw==null) return [];
    if(!Array.isArray(raw)) throw new TypeError("legami deve restituire un array");
    const out=[];
    const seen=new Set();
    for(const x of raw){
      const id=typeof x==="string" ? x : personaValida(x) ? x.id : null;
      if(id && !seen.has(id)){ seen.add(id); out.push(id); }
    }
    return out;
  }

  function seleziona(persone,richiesta){
    if(!Array.isArray(persone)) throw new TypeError("persone deve essere un array");
    const r=richiesta&&typeof richiesta==="object"?richiesta:{};
    const ambienteId=testo(r.ambienteId,"ambienteId");
    const g=giorno(r.giorno);
    const periodoId=periodo(r.periodo);
    const quanti=budget(r.quanti);
    if(typeof r.verifica!=="function")
      throw new TypeError("verifica obbligatoria");
    if(r.legacy!=null && typeof r.legacy!=="function")
      throw new TypeError("legacy deve essere una funzione");
    if(r.punteggio!=null && typeof r.punteggio!=="function")
      throw new TypeError("punteggio deve essere una funzione");
    if(r.legami!=null && typeof r.legami!=="function")
      throw new TypeError("legami deve essere una funzione");

    const byId=new Map();
    for(const p of persone){
      if(!personaValida(p)) throw new TypeError("candidato PERSONA non valido");
      if(byId.has(p.id))
        throw new RangeError("ID PERSONA duplicato nei candidati: "+p.id);
      byId.set(p.id,p);
    }

    const ammessi=[];
    for(const p of persone){
      if(p.via) continue;
      if(r.verifica(p)!==true) continue;
      const esplicita=appartenenzaAmmessa(root,p,ambienteId,g);
      if(esplicita===false) continue;
      if(esplicita===null && !(typeof r.legacy==="function" && r.legacy(p)===true))
        continue;
      ammessi.push(p);
    }

    const ammessiById=new Map(ammessi.map(p=>[p.id,p]));
    const score=new Map();
    for(const p of ammessi) score.set(p.id,punteggioFinito(r.punteggio,p));

    const base=ammessi.slice().sort((a,b)=>{
      const d=score.get(b.id)-score.get(a.id);
      if(d) return d;
      const ha=hash32(ambienteId+"|"+periodoId+"|"+a.id);
      const hb=hash32(ambienteId+"|"+periodoId+"|"+b.id);
      if(ha!==hb) return ha-hb;
      return a.id.localeCompare(b.id);
    });

    const ordine=[];
    const inseriti=new Set();
    const aggiungi=id=>{
      if(!ammessiById.has(id) || inseriti.has(id)) return;
      inseriti.add(id);
      ordine.push(id);
    };

    if(snapshotValido(r.memoria,ambienteId,periodoId)){
      for(const id of r.memoria.ids){
        if(typeof id==="string") aggiungi(id);
      }
    }

    const aggiungiConLegami=p=>{
      aggiungi(p.id);
      for(const id of legamiIds(r.legami,p)) aggiungi(id);
    };

    for(const p of base){
      if(!inseriti.has(p.id)) aggiungiConLegami(p);
    }

    const memoria={
      ambienteId,
      periodo:periodoId,
      ids:ordine.slice()
    };

    return {
      persone:ordine.slice(0,quanti).map(id=>ammessiById.get(id)),
      memoria
    };
  }

  root.ADF_NPC_SELEZIONE=Object.freeze({seleziona});
})(typeof window!=="undefined"?window:globalThis);
