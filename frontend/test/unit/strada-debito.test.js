import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const source=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");

function helperDebito(){
  const start=source.indexOf("function stradaAddebitaPuliti(importo){");
  const end=source.indexOf("function stradaFalloutAttivitaCandidata(){",start);
  if(start<0 || end<0) throw new Error("helper debito Strada non trovato");
  return source.slice(start,end);
}

function contesto(money=-500,sporchi=0){
  const ctx={G:{money,strada:{sporchi}},Math,Number,Object};
  vm.createContext(ctx);
  vm.runInContext(helperDebito(),ctx);
  return ctx;
}

describe("Strada · regressione debito",()=>{
  it("una multa peggiora il debito invece di azzerarlo",()=>{
    const ctx=contesto(-500,0);
    const addebitato=vm.runInContext("stradaAddebitaPuliti(96)",ctx);
    expect(addebitato).toBe(96);
    expect(ctx.G.money).toBe(-596);
  });

  it("una perdita limitata ai contanti disponibili non cancella un debito esistente",()=>{
    const ctx=contesto(-500,0);
    const out=vm.runInContext("stradaFalloutPerdiDenaro(96)",ctx);
    expect(out).toEqual({totale:0,sporchi:0,puliti:0});
    expect(ctx.G.money).toBe(-500);
  });

  it("il fallout consuma prima sporchi e poi solo contanti puliti realmente disponibili",()=>{
    const ctx=contesto(50,20);
    const out=vm.runInContext("stradaFalloutPerdiDenaro(100)",ctx);
    expect(out).toEqual({totale:70,sporchi:20,puliti:50});
    expect(ctx.G.strada.sporchi).toBe(0);
    expect(ctx.G.money).toBe(0);
  });

  it("tutti i rami di multa criminale passano dall'addebito che conserva il debito",()=>{
    expect((source.match(/stradaAddebitaPuliti\(multa\);/g)||[]).length).toBe(3);
    expect(source).not.toContain("G.money=Math.max(0,Number(G.money||0)-multa)");
    expect(source).not.toContain("G.money = Math.max(0, G.money - multa)");
  });
});
