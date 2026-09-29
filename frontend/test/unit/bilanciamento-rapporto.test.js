import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

/* Il rapporto del simulatore di bilanciamento su carriere finte: il simulatore vero
   dura ore e non entra nella verifica, ma i controlli che leggono i suoi numeri sì. */
const require = createRequire(import.meta.url);
const { scriviRapporto, leggi } = require("../../strumenti/bilanciamento/rapporto.js");

function carriera(n, strategia, fine, extra) {
  const base = { fan: 0, soldi: 0, hype: 0, hypeCap: 100, ben: 60, luc: 90, fase: 0, pezzi: 0, stream: 0,
    abilita: { scrittura: 10 }, rep: 0, calore: 0, carcere: false, contratto: false, lavoro: null };
  return Object.assign({ n, strategia, seme: n, giorni: 28, azioni: {}, rifiuti: {}, erroriJS: [], console: [],
    blocchi: [], invarianti: [], salti: { ok: 28 }, eventi: 0, colpi: 0, arresti: 0, giorniInCarcere: 0, note: [],
    secondi: 1, settimane: [7, 14, 21, 28].map((g, i) => Object.assign({ g }, base, fine, { fan: Math.round((fine.fan || 0) * (i + 1) / 4) })) }, extra);
}

function giro(righe) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bilanciamento-"));
  const file = path.join(dir, "carriere.jsonl");
  fs.writeFileSync(file, righe.map(r => JSON.stringify(r)).join("\n") + "\n");
  const esito = scriviRapporto(file, dir, { giorni: 28 });
  return { esito, md: fs.readFileSync(path.join(dir, "rapporto.md"), "utf8"), json: JSON.parse(fs.readFileSync(path.join(dir, "rapporto.json"), "utf8")) };
}

describe("rapporto del simulatore di bilanciamento", () => {
  it("vede i fan che crescono da soli e il crimine che paga troppo", () => {
    const { md, json } = giro([
      carriera(1, "musicista", { fan: 1000, soldi: 300 }),
      carriera(2, "fermo", { fan: 800, soldi: 200 }),
      carriera(3, "lavoratore", { fan: 200, soldi: 1000 }),
      carriera(4, "criminale", { fan: 50, soldi: 9000 })
    ]);
    expect(md).toContain("I fan crescono da soli");
    expect(md).toContain("Il crimine paga troppo");
    expect(json.sospetti.length).toBe(2);
    expect(json.curve.musicista.map(r => r.g)).toEqual([7, 14, 21, 28]);
  });

  it("separa i guasti veri dai sospetti, e una carriera ripresa conta una volta", () => {
    const rotta = carriera(1, "musicista", { fan: 10 }, { interrotta: true, note: ["giorno 3 fermo da un minuto"],
      erroriJS: [{ g: 3, m: "G.songs is undefined" }], invarianti: [{ g: 3, p: ["hype 140"] }] });
    const { md, esito } = giro([carriera(1, "musicista", { fan: 5 }), rotta]);
    expect(md).toContain("1 carriere interrotte");
    expect(md).toContain("G.songs is undefined");
    expect(md).toContain("hype N");
    expect(esito).toContain("1 carriere,");
  });

  it("il rallentamento lo dice il «+1» da solo, non la giornata col bot dentro", () => {
    const lenta = (n, salto) => carriera(n, "lavoratore", { fan: 10 }, { settimane: Array.from({ length: 10 }, (_, i) => ({
      g: (i + 1) * 7, fan: 10, soldi: 0, ms: 500 + i * 400, msSalto: salto ? 100 + i * 150 : 100, abilita: {} })) });
    expect(giro([lenta(1, false)]).md).not.toContain("Il gioco rallenta");
    const { md } = giro([lenta(1, true)]);
    expect(md).toContain("Il gioco rallenta");
    expect(md).toContain("per il «+1»");
  });

  it("senza righe non scrive niente e lo dice", () => {
    expect(leggi(path.join(os.tmpdir(), "non-esiste-" + Date.now() + ".jsonl"))).toEqual([]);
    expect(scriviRapporto(path.join(os.tmpdir(), "non-esiste.jsonl"), os.tmpdir())).toMatch(/nessuna carriera/);
  });
});
