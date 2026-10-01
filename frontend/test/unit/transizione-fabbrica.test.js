import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");

describe("cinematica ingresso Fabbrica", () => {
  it("collega il cartello Fabbrica alla sequenza a tre schermate", () => {
    const transizioni = leggi("js/game/transizioni-video.js");
    const hub = leggi("js/game/hub.js");

    expect(transizioni).toContain('fabbrica_01_arrivo.png');
    expect(transizioni).toContain('fabbrica_02_spogliatoio.png');
    expect(transizioni).toContain('fabbrica_03_timbratura.png');
    expect(transizioni).toContain('fabbrica:"fabbrica"');
    expect(hub).toMatch(/id:"fabbrica"[\s\S]*transizioneVideo\("fabbrica",\s*\(\) => apriLuogo\("fabbrica"\)\)/);
  });

  it("mantiene il fallback se gli asset non si caricano", () => {
    const transizioni = leggi("js/game/transizioni-video.js");
    expect(transizioni).toContain("Promise.all(slides.map(carica))");
    expect(transizioni).toContain("catch(fine)");
    expect(transizioni).toContain("setTimeout(fine, TRANSIZIONE_ATTESA)");
  });
});
