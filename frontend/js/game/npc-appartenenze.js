(function(root){
  "use strict";

  const TIPI=Object.freeze([
    "musica","lavoro","strada","carcere","quartiere","attivita","evento"
  ]);

  function testo(v,nome){
    if(typeof v!=="string" || !v.trim())
      throw new TypeError(nome+" obbligatorio");
    return v.trim();
  }

  function giorno(v,nome,{nullable=false}={}){
    if(nullable && v==null) return null;
    let n=null;
    if(typeof v==="number") n=v;
    else if(typeof v==="string" && /^\d+$/.test(v.trim())) n=Number(v.trim());
    if(!Number.isSafeInteger(n) || n<=0)
      throw new TypeError(nome+" deve essere un giorno assoluto positivo");
    return n;
  }

  function copia(e){
    return {
      ambienteId:e.ambienteId,
      tipo:e.tipo,
      fonte:e.fonte,
      dalGiorno:e.dalGiorno,
      alGiorno:e.alGiorno==null?null:e.alGiorno,
      fonteFine:e.fonteFine==null?null:e.fonteFine
    };
  }

  function normalizza(raw,{esistente=false}={}){
    if(!raw || typeof raw!=="object" || Array.isArray(raw))
      throw new TypeError("episodio appartenenza non valido");

    const ambienteId=testo(raw.ambienteId,"ambienteId");
    const tipo=testo(raw.tipo,"tipo");
    if(!TIPI.includes(tipo)) throw new TypeError("tipo appartenenza non supportato: "+tipo);
    const fonte=testo(raw.fonte,"fonte");
    const dalGiorno=giorno(raw.dalGiorno,"dalGiorno");
    const alGiorno=giorno(raw.alGiorno,"alGiorno",{nullable:true});
    if(alGiorno!=null && alGiorno<=dalGiorno)
      throw new RangeError("alGiorno deve essere successivo a dalGiorno");

    let fonteFine=null;
    if(raw.fonteFine!=null) fonteFine=testo(raw.fonteFine,"fonteFine");
    if(!esistente && fonteFine!=null && alGiorno==null)
      throw new RangeError("fonteFine richiede alGiorno");
    if(esistente && fonteFine!=null && alGiorno==null)
      throw new RangeError("episodio incoerente: fonteFine senza alGiorno");

    return {ambienteId,tipo,fonte,dalGiorno,alGiorno,fonteFine};
  }

  function lista(p,{crea=false}={}){
    if(!p || typeof p!=="object" || Array.isArray(p) || !p.id)
      throw new TypeError("PERSONA valida con id obbligatorio");
    if(p.appartenenze==null){
      if(!crea) return [];
      p.appartenenze=[];
    }
    if(!Array.isArray(p.appartenenze))
      throw new TypeError("p.appartenenze deve essere un array");
    return p.appartenenze;
  }

  function storiaValidata(p){
    return lista(p).map(e=>normalizza(e,{esistente:true}));
  }

  function perPersona(p){
    return storiaValidata(p).map(copia);
  }

  function attive(p,g){
    const oggi=giorno(g,"giorno");
    return storiaValidata(p)
      .filter(e=>e.dalGiorno<=oggi && (e.alGiorno==null || oggi<e.alGiorno))
      .map(copia);
  }

  function sovrappone(a,b){
    const aFine=a.alGiorno==null?Infinity:a.alGiorno;
    const bFine=b.alGiorno==null?Infinity:b.alGiorno;
    return a.dalGiorno<bFine && b.dalGiorno<aFine;
  }

  function registra(p,raw){
    const nuovo=normalizza(raw);
    const dest=lista(p,{crea:true});
    const storia=dest.map(e=>normalizza(e,{esistente:true}));

    const identico=storia.find(e=>
      e.ambienteId===nuovo.ambienteId &&
      e.tipo===nuovo.tipo &&
      e.fonte===nuovo.fonte &&
      e.dalGiorno===nuovo.dalGiorno
    );
    if(identico) return copia(identico);

    const stessoAmbiente=storia.filter(e=>e.ambienteId===nuovo.ambienteId);
    if(stessoAmbiente.some(e=>e.tipo!==nuovo.tipo))
      throw new RangeError("tipo incoerente per ambiente "+nuovo.ambienteId);
    if(stessoAmbiente.some(e=>sovrappone(e,nuovo)))
      throw new RangeError("episodi sovrapposti per ambiente "+nuovo.ambienteId);

    const persistito=copia(nuovo);
    dest.push(persistito);
    return copia(persistito);
  }

  function chiudi(p,ambienteId,g,fonteFine){
    const id=testo(ambienteId,"ambienteId");
    const quando=giorno(g,"giorno");
    const fonte=testo(fonteFine,"fonteFine");
    const dest=lista(p);
    const storia=dest.map(e=>normalizza(e,{esistente:true}));

    const candidati=storia
      .map((e,index)=>({e,index}))
      .filter(x=>
        x.e.ambienteId===id &&
        x.e.dalGiorno<quando &&
        (x.e.alGiorno==null || quando<x.e.alGiorno)
      )
      .sort((a,b)=>b.e.dalGiorno-a.e.dalGiorno);

    if(!candidati.length) return null;
    const {e,index}=candidati[0];
    const chiuso={...e,alGiorno:quando,fonteFine:fonte};
    dest[index]=copia(chiuso);
    return copia(chiuso);
  }

  const api=Object.freeze({
    TIPI,
    perPersona,
    attive,
    registra,
    chiudi
  });

  root.ADF_NPC_APPARTENENZE=api;
})(typeof window!=="undefined"?window:globalThis);
