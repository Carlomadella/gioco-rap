import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const leggi=file=>fs.readFileSync(path.join(ROOT,file),"utf8");

function ambiente({mobile}){
  const dom=new JSDOM('<!doctype html><html><body><iframe id="adf-rpg-v24-frame"></iframe></body></html>',{
    url:mobile?"http://localhost/pagine/gioco.html?nuova=rapido":"http://localhost/pagine/gioco.html",
    runScripts:"outside-only"
  });
  const {window}=dom;

  Object.defineProperty(window,"innerWidth",{value:mobile?390:1440,configurable:true});
  Object.defineProperty(window.navigator,"maxTouchPoints",{value:mobile?5:0,configurable:true});
  window.matchMedia=()=>({matches:mobile});

  const frame=window.document.getElementById("adf-rpg-v24-frame");
  frame.contentDocument.body.innerHTML=
    '<iframe id="localEditorFrame" data-makehuman-src="../makehuman-camerino-v1/index.html"></iframe>';

  let aperture=0;
  const open=()=>{ aperture+=1; };
  const openAppearance=()=>{ aperture+=1; };
  window.ADF_RPG_V24={open,openAppearance,close(){}};

  return {dom,window,frame,open,openAppearance,aperture:()=>aperture};
}

describe("MakeHuman mobile separato dal desktop",()=>{
  it("sul desktop non modifica il ponte RPG ne la sorgente MakeHuman",()=>{
    const env=ambiente({mobile:false});
    env.window.eval(leggi("js/mobile/makehuman-mobile.js"));

    expect(env.window.ADF_MAKEHUMAN_MOBILE).toBeUndefined();
    expect(env.window.ADF_RPG_V24.open).toBe(env.open);
    expect(
      env.frame.contentDocument.getElementById("localEditorFrame").dataset.makehumanSrc
    ).toBe("../makehuman-camerino-v1/index.html");
  });

  it("sul telefono usa il relay mobile lasciando intatto il creator",()=>{
    const env=ambiente({mobile:true});
    env.window.eval(leggi("js/mobile/makehuman-mobile.js"));
    env.window.ADF_RPG_V24.open();

    expect(env.aperture()).toBe(1);
    expect(env.window.ADF_MAKEHUMAN_MOBILE.attivo).toBe(true);
    expect(
      env.frame.contentDocument.getElementById("localEditorFrame").dataset.makehumanSrc
    ).toBe("../makehuman-mobile-v1/index.html?v=4&quick=1");
  });

  it("il relay protegge l'intero bootstrap rapido mobile con heartbeat limitato",()=>{
    const relay=leggi("media/makehuman-mobile-v1/index.html");

    expect(relay).toContain("../makehuman-camerino-v1/index.html?v=mobile-4&mobile=1");
    expect(relay).toContain('mobile=1');
    expect(relay).toContain('const QUICK=params.get("quick")==="1"');
    expect(relay).toContain("BOOTSTRAP_HEARTBEAT_MS=10000");
    expect(relay).toContain("BOOTSTRAP_MAX_MS=360000");
    expect(relay).toContain("avviaBootstrapHeartbeat();");
    expect(relay).toContain('ultimaFase+" · caricamento ancora in corso"');
    expect(relay).not.toContain("TARGET_HEARTBEAT_MS");
    expect(relay).not.toContain("avviaTargetHeartbeat");
    expect(relay).toContain('"adf-makehuman-progress"');
    expect(relay).toContain('"adf-makehuman-quick-preset-error"');
  });

  it("non ferma il keepalive al semplice ready del camerino",()=>{
    const relay=leggi("media/makehuman-mobile-v1/index.html");
    const stop=relay.slice(relay.indexOf("/* \"ready\" significa"),relay.indexOf("try{ parent.postMessage(msg",relay.indexOf("/* \"ready\" significa")));

    expect(stop).not.toContain('msg.type==="adf-makehuman-ready"');
    expect(stop).toContain('msg.type==="adf-makehuman-quick-preset-result"');
    expect(stop).toContain('msg.type==="adf-makehuman-quick-preset-error"');
  });

  it("anche la landing carica l'adattatore mobile dopo il ponte",()=>{
    const pagina=leggi("pagine/landing.html");
    const bridge=pagina.indexOf("js/creator/rpg-v24-bridge.js");
    const mobile=pagina.indexOf("js/mobile/makehuman-mobile.js");

    expect(bridge).toBeGreaterThan(-1);
    expect(mobile).toBeGreaterThan(bridge);
  });

  it("la pagina carica l'adattatore mobile dopo il ponte e prima dell'ingresso",()=>{
    const pagina=leggi("pagine/gioco.html");
    const bridge=pagina.indexOf("js/creator/rpg-v24-bridge.js");
    const mobile=pagina.indexOf("js/mobile/makehuman-mobile.js");
    const ingresso=pagina.indexOf('<script src="js/gioco-ingresso.js');

    expect(bridge).toBeGreaterThan(-1);
    expect(mobile).toBeGreaterThan(bridge);
    expect(ingresso).toBeGreaterThan(mobile);
  });
});
