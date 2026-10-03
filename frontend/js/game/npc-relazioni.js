(function(root){
  "use strict";

  const STREET_STATUS=new Set(["active","inactive","unreachable","cold"]);

  function persona(p){
    if(!p || typeof p!=="object" || Array.isArray(p) ||
       typeof p.id!=="string" || !p.id.trim())
      throw new TypeError("PERSONA valida con id obbligatorio");
    return p;
  }

  function numero(v,fallback=null){
    if(v==null || v==="") return fallback;
    const n=Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function intero(v,fallback=0){
    const n=numero(v,null);
    return n==null ? fallback : Math.trunc(n);
  }

  function clamp(v,min,max){
    return Math.max(min,Math.min(max,v));
  }

  function freeze(v){
    return v==null ? null : Object.freeze(v);
  }

  function haSociale(p){
    return ["rel","pt","numero","numDa"].some(k=>Object.prototype.hasOwnProperty.call(p,k));
  }

  function sociale(p){
    persona(p);
    if(!haSociale(p)) return null;

    return freeze({
      /* Rapporto sociale generale usato da Sala, lavoro, Trasferte e chat.
         Non è fiducia criminale e non è il rapporto costruito in carcere. */
      livello:clamp(intero(p.rel,0),0,5),
      progresso:numero(p.pt,0),
      numero:p.numero===true,
      numeroDa:p.numDa==null?null:p.numDa
    });
  }

  function strada(p){
    persona(p);
    const st=p.strada;
    if(!st || typeof st!=="object" || Array.isArray(st)) return null;

    const fid=numero(st.fiducia,null);
    const status=typeof st.streetStatus==="string" && STREET_STATUS.has(st.streetStatus)
      ? st.streetStatus : null;

    return freeze({
      /* Questa è fiducia NEL GIRO: abilita squadra, favori, protezione e altre
         conseguenze crime. Non viene convertita in p.rel. */
      conosciuto:st.known===true,
      fiducia:fid==null?null:clamp(fid,0,100),
      stato:status,
      favori:clamp(intero(st.favori,0),0,3),
      colpiInsieme:Math.max(0,intero(st.colpiInsieme,0)),
      debitiGiocatore:clamp(intero(st.debitiGiocatore,0),0,3),
      tensione:clamp(intero(st.tensione,0),0,3),
      rivalita:st.rivalita===true,
      cautelaHeat:st.heatCaution===true
    });
  }

  function carcere(p){
    persona(p);
    const st=p.carcere;
    if(!st || typeof st!=="object" || Array.isArray(st)) return null;

    const rapporto=numero(st.rapporto,null);
    return freeze({
      /* Memoria del rapporto nato durante la detenzione. Può essere negativa.
         Non sostituisce né p.rel né p.strada.fiducia. */
      conosciuto:st.conosciuto===true,
      rapporto:rapporto==null?null:clamp(rapporto,-10,10),
      currentJailId:st.currentJailId==null?null:String(st.currentJailId),
      linkedStreet:st.linkedStreet===true,
      releasedAbsoluteDay:numero(st.releasedAbsoluteDay,null),
      returnAfterAbsoluteDay:numero(st.returnAfterAbsoluteDay,null),
      outsideFollowupDone:st.outsideFollowupDone===true
    });
  }

  function dimensione(p,id){
    if(id==="sociale") return sociale(p);
    if(id==="strada") return strada(p);
    if(id==="carcere") return carcere(p);
    throw new RangeError("dimensione relazione sconosciuta: "+String(id));
  }

  function vista(p){
    persona(p);
    return Object.freeze({
      personId:p.id,
      sociale:sociale(p),
      strada:strada(p),
      carcere:carcere(p)
    });
  }

  function fatti(p){
    const v=vista(p);
    return Object.freeze({
      /* Fatti separati per i futuri contratti comportamentali. Nessuno è un
         "relationship score" e nessun tratto viene trasformato in fiducia. */
      socialeAvviato:!!v.sociale &&
        (v.sociale.livello>0 || v.sociale.progresso!==0 || v.sociale.numero),
      stradaConosciuta:!!v.strada && v.strada.conosciuto,
      stradaFiducia:v.strada ? v.strada.fiducia : null,
      stradaTensione:v.strada ? v.strada.tensione : 0,
      stradaRivalita:!!(v.strada&&v.strada.rivalita),
      carcereConosciuto:!!v.carcere && v.carcere.conosciuto,
      carcereRapporto:v.carcere ? v.carcere.rapporto : null,
      carcereTensione:!!(v.carcere&&v.carcere.rapporto!=null&&v.carcere.rapporto<=-2)
    });
  }

  root.ADF_NPC_RELAZIONI=Object.freeze({
    sociale,
    strada,
    carcere,
    dimensione,
    vista,
    fatti
  });
})(typeof window!=="undefined"?window:globalThis);
