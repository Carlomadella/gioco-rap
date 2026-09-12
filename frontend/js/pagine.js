/* Le pagine del gioco, e come si va dall'una all'altra (punto 27).

   Sono tre e stanno in `pagine/`: la landing, l'accesso, la partita. Prima
   erano tre `<section>` dello stesso documento e «andare» voleva dire togliere
   una classe; adesso sono tre file, e andare vuol dire caricare una pagina.

   I nomi stanno scritti qui e in nessun altro posto. Non è pignoleria: il
   build della demo in un file solo (`npm run demo`) li riscrive, perché lì le
   pagine finiscono tutte nella stessa cartella con altri nomi. Se i percorsi
   fossero sparsi in cinque file, riscriverli vorrebbe dire cercarli a mano.

   `document.baseURI` è la cartella del gioco — le pagine hanno `<base href="../">`
   in testa — quindi qui i percorsi si scrivono come li scriverebbe index.html. */
"use strict";

const PAGINE = {
  landing: "pagine/landing.html",
  accesso: "pagine/accesso.html",
  gioco:   "pagine/gioco.html"
};

/* L'indirizzo di una pagina, con la domanda attaccata se serve
   (`vaiA("gioco", "vai=profilo")`). */
function indirizzoPagina(quale, domanda){
  const f = PAGINE[quale] || PAGINE.landing;
  return new URL(f + (domanda ? "?" + domanda : ""), document.baseURI).href;
}
let navigazioneInCorso = false; /* ADF_APP_SHELL_V1 */

function paginaCorrenteE(quale){
  try{
    const file = PAGINE[quale];
    if(!file) return false;

    const qui = new URL(location.href);
    const target = new URL(file, document.baseURI);

    return qui.pathname === target.pathname;
  }catch(e){
    return false;
  }
}

/* La landing diventa il contenitore persistente dell'app.
   Audio e stato JS della landing restano vivi mentre gioco/accesso
   cambiano dentro al frame. */
function creaAppShell(){
  if(window.parent !== window) return null;
  if(!paginaCorrenteE("landing")) return null;

  if(window.ADF_APP_SHELL)
    return window.ADF_APP_SHELL;

  let frame = null;

  const htmlOverflow =
    document.documentElement.style.overflow;

  const bodyOverflow =
    document.body ? document.body.style.overflow : "";

  function preparaFrame(){
    if(frame) return frame;

    frame = document.createElement("iframe");
    frame.id = "adf-app-frame";
    frame.title = "Anni di Fame";
    frame.setAttribute("allow", "autoplay");
    frame.setAttribute("frameborder", "0");

    Object.assign(frame.style,{
      position:"fixed",
      inset:"0",
      width:"100vw",
      height:"100dvh",
      minHeight:"100vh",
      border:"0",
      margin:"0",
      padding:"0",
      display:"block",
      background:"#0B0B0D",
      zIndex:"2147483000"
    });

    document.documentElement.style.overflow = "hidden";

    if(document.body)
      document.body.style.overflow = "hidden";

    document.body.appendChild(frame);

    return frame;
  }

  function navigate(href){
    const f = preparaFrame();

    f.onload = () => {
      navigazioneInCorso = false;

      try{
        f.contentWindow.focus();
      }catch(e){}
    };

    f.src = href;
    return true;
  }

  function close(){
    /* Gioco/accesso vivono in un iframe con una propria copia di SET. Prima
       di riattivare il player persistente, il parent rilegge sincronicamente
       il localStorage condiviso: master, volumi e mute menu non restano quelli
       presenti quando il frame era stato aperto. */
    try{
      if(window.ADF_SETTINGS && typeof ADF_SETTINGS.reload === "function")
        ADF_SETTINGS.reload();
    }catch(e){}

    if(frame){
      try{
        frame.remove();
      }catch(e){}

      frame = null;
    }

    document.documentElement.style.overflow =
      htmlOverflow;

    if(document.body)
      document.body.style.overflow =
        bodyOverflow;

    navigazioneInCorso = false;

    /* La landing top-level e il suo player sono rimasti vivi sotto il frame.
       Il ritorno e' una vera transizione al pregame, anche se il gioco aveva
       lasciato il parent in gameplay o cinematic. */
    try{
      const audio = window.ADF_AUDIO;
      if(audio){
        audio.setMode("pregame");
        if(audio.music && typeof audio.music.ensureMenu === "function")
          audio.music.ensureMenu();
      }
    }catch(e){}
  }

  const api = {
    navigate,
    close,

    get active(){
      return !!frame;
    },

    get frame(){
      return frame;
    }
  };

  window.ADF_APP_SHELL = api;

  return api;
}

const appShell = creaAppShell();

function vaiA(quale, domanda){
  if(navigazioneInCorso) return;

  const href =
    indirizzoPagina(quale, domanda);

  /* Dalla landing non distruggiamo più la pagina:
     montiamo gioco/accesso sopra di lei. */
  if(appShell && quale !== "landing"){
    navigazioneInCorso = true;
    appShell.navigate(href);
    return;
  }

  /* Se una pagina interna chiede di tornare alla landing,
     chiudiamo semplicemente il frame e torniamo al menu
     persistente che era rimasto sotto. */
  if(window.parent !== window && quale === "landing"){
    try{
      const shell =
        window.parent.ADF_APP_SHELL;

      if(shell && typeof shell.close === "function"){
        shell.close();
        return;
      }
    }catch(e){}
  }

  navigazioneInCorso = true;

  /* Fallback per apertura diretta delle pagine senza shell. */
  try{
    const m =
      window.ADF_AUDIO &&
      ADF_AUDIO.music;

    if(m &&
       typeof m.preparePageHandoff === "function"){
      m.preparePageHandoff();
    }
  }catch(e){}

  location.href = href;
}
window.PAGINE = PAGINE;
window.vaiA = vaiA;
