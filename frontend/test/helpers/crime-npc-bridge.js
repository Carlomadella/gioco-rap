/* Carica il bridge reale anche nei test che isolano un blocco della Strada. */
export function crimeNpcBridge(source){
  const start=source.indexOf("const STRADA_NPC_CONTRACT_VERSION = 1;");
  const end=source.indexOf("function stradaPersonaDaId(id)",start);
  if(start<0 || end<0) throw new Error("bridge NPC crime non trovato");
  return source.slice(start,end);
}
