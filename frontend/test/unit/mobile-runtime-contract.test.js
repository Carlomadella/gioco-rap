import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");

describe("bootstrap mobile MakeHuman", () => {
  it("tiene vivo il watchdog mentre targets.bin e realmente in caricamento", () => {
    const engine = leggi("media/makehuman-camerino-v1/modifier-engine.html");

    const start = engine.indexOf("const targetHeartbeat=setInterval");
    const load = engine.indexOf("await human.loadTargets");
    const stop = engine.indexOf("clearInterval(targetHeartbeat)");

    expect(start).toBeGreaterThan(-1);
    expect(load).toBeGreaterThan(start);
    expect(stop).toBeGreaterThan(load);
    expect(engine).toContain("caricamento ancora in corso");
    expect(engine).toContain("10000");
  });

  it("annuncia il bootstrap prima di aprire il camerino locale", () => {
    const creator = leggi("media/creator-rpg-v24/creator.html");
    const start = creator.indexOf("function startQuickMakeHuman");
    const end = creator.indexOf("function openLocalEditor", start);
    const funzione = creator.slice(start, end);

    expect(funzione).toContain("adf-rpg-v24-quick-makehuman-progress");
    expect(funzione).toContain("Apro il motore MakeHuman");
    expect(funzione.indexOf("postMessage")).toBeLessThan(funzione.indexOf("openLocalEditor()"));
  });

  it("mantiene il timeout come watchdog di silenzio, non come durata massima", () => {
    const ingresso = leggi("js/gioco-ingresso.js");

    expect(ingresso).toContain("Due minuti SENZA NOTIZIE");
    expect(ingresso).toContain("120000");
    expect(ingresso).toContain('msg.type === "adf-rpg-v24-quick-makehuman-progress"');
  });
});
