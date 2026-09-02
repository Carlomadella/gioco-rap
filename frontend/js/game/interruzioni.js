/*
 * ANNI DI FAME — FEEDBACK DELLE AZIONI INTERROTTE
 * Prototipo locale / drop-in module — v1.
 *
 * tempo.js v5 puo' fermare il clock a un checkpoint interno quando un evento ALTO
 * cade durante una ACTION. La logica della repo, pero', calcola gia' l'esito della
 * mossa prima di chiamare azioneFatta(). Questo bridge evita che il giocatore veda
 * subito il toast/la scena finale: li mette da parte e li mostra solo dopo che la
 * scelta alta e' stata risolta e il tempo residuo dell'azione e' ripartito.
 *
 * Non modifica la logica dell'azione, non tocca il telefono criminale e non crea
 * un secondo clock.
 */
"use strict";

(function(){
  if(typeof GAME_TIME === "undefined") return;

  function suspendedRaw(){
    const r=G.timeRuntime;
    return r && r.suspendedAction && typeof r.suspendedAction === "object"
      ? r.suspendedAction : null;
  }

  function saveNow(){ try{ if(typeof save === "function") save(); }catch(e){} }

  function setFeedback(f){
    const s=suspendedRaw();
    if(!s) return false;
    /* Una ACTION produce un solo feedback finale nella UI corrente. Se qualche
       helper secondario prova a scriverne un altro non sovrascriviamo il primo. */
    if(!s.feedback) s.feedback=f;
    saveNow();
    return true;
  }

  let ORIGINAL_TOAST=null, ORIGINAL_SCENE=null;

  if(typeof toast === "function"){
    ORIGINAL_TOAST=toast;
    window.toast=function(msg,cls,icon,tint){
      if(suspendedRaw()){
        setFeedback({kind:"toast",msg:String(msg==null?"":msg),cls:cls||"",icon:icon||"",tint:Array.isArray(tint)?tint.slice(0,2):tint||null});
        return;
      }
      return ORIGINAL_TOAST.apply(this,arguments);
    };
  }

  if(typeof mostraScena === "function"){
    ORIGINAL_SCENE=mostraScena;
    window.mostraScena=function(a,sc,msg,extra){
      if(suspendedRaw()){
        setFeedback({kind:"scene",actionId:a&&a.id||null,msg:String(msg==null?"":msg),extra:String(extra==null?"":extra)});
        return;
      }
      return ORIGINAL_SCENE.apply(this,arguments);
    };
  }

  function replay(f){
    if(!f) return false;
    if(f.kind==="toast" && ORIGINAL_TOAST){
      ORIGINAL_TOAST(f.msg||"",f.cls||"",f.icon||"",f.tint||null);
      return true;
    }
    if(f.kind==="scene" && ORIGINAL_SCENE && typeof ACTIONS!=="undefined"){
      const a=ACTIONS.find(x=>x.id===f.actionId);
      const sc=(typeof SC!=="undefined" && SC[f.actionId]) || ["#3A3F49","#22262E",""];
      if(a){ ORIGINAL_SCENE(a,sc,f.msg||"",f.extra||""); return true; }
    }
    return false;
  }

  window.addEventListener("game-time:action-resumed",ev=>{
    const f=ev.detail&&ev.detail.feedback;
    if(!f) return;
    /* La scelta dell'evento e' ancora dentro o.run(). Aspettiamo il tick dopo:
       modal.js chiude/salva/renderizza, poi mostriamo l'esito della ACTION. */
    setTimeout(()=>replay(f),0);
  });

  window.GAME_INTERRUPTS=Object.freeze({
    suspended:()=>{ const s=suspendedRaw(); return s?Object.assign({},s):null; },
    feedback:()=>{ const s=suspendedRaw(); return s&&s.feedback?Object.assign({},s.feedback):null; },
    replay
  });
})();
