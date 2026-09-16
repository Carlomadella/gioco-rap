/* La forma dei corpi delle richieste, tutta in un posto.

   Prima ogni rotta di server.js si leggeva il corpo a mano — `String(b.x || "")`,
   `typeof b.stato !== "object"`, `b.tipo === "legacy"` — e chi sbagliava un
   campo si prendeva un 403 «non è tuo» o un 500 dalla chiave esterna invece
   di sentirsi dire qual era il campo storto. Da qui (16/09/2026) ogni corpo
   passa per la sua forma, scritta con `zod`: se non torna, la risposta è un
   400 che dice **quale campo** e **perché**. La pulizia dei testi (caratteri
   invisibili, spazi doppi, lunghezza) resta a `nomePulito` in server.js, e i
   controlli che hanno bisogno del database (nome libero, artista tuo,
   moderazione) restano nelle rotte: qui si guarda solo la forma.

   Come si legge la risposta di un corpo storto:
     400 { "errore": "dati-non-validi", "campi": [{ "campo": "email", "problema": "…" }] }
   Se la forma lo dice, l'errore ha il nome di sempre — `email-non-valida`,
   `segreto-troppo-corto`, `stato-mancante`, `serve-la-conferma` — così i
   client e README-API.md non cambiano.

   Le forme sono **larghe** (`looseObject`): un campo in più non è un errore,
   perché i client vecchi ne mandano e quelli nuovi ne manderanno. E sono
   larghe anche sui tipi dove il gioco è sempre stato libero (`stream`, `deal`,
   `dispositivo`): lì il freno vero sta in archivio.js e plausibilita.js. */
"use strict";

const { z } = require("zod");
/* i messaggi di zod in italiano, come tutto il resto del server */
z.config(z.locales.it());

/* ---- i mattoni ---- */
/* un id: quello che il gioco manda come `artistaId`, `altroId`, `accountId`.
   Non si pretende un UUID perché i bot ne hanno di loro; si pretende che ci
   sia e che non sia un romanzo */
const id = z.string().min(1).max(80);
const testo = max => z.string().max(max);
/* un numero che può arrivare anche come stringa ("12") o mancare del tutto:
   la stretta (min/max/arrotondamento) la fa `nInt` in server.js */
const numero = z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/)]).nullish();
const dispositivo = z.union([z.looseObject({}), z.string().max(200)]).nullish();

const TIPI_ACCOUNT = ["ospite", "email", "steam", "apple", "google"];

/* ---- le forme, una per rotta ---- */
const FORME = {
  /* POST /api/relazione */
  relazione: z.looseObject({
    artistaId: id,
    altroId: id.optional(),
    tipo: testo(30).optional(),
    era: testo(30).optional(),
    nota: testo(400).nullish()
  }),

  /* POST /api/account */
  account: z.looseObject({
    tipo: z.enum(TIPI_ACCOUNT).optional(),
    email: z.string().max(200).optional(),
    segreto: z.string().max(200).optional(),
    biglietto: z.string().max(8000).optional(),
    dispositivo
  }).superRefine((b, ctx) => {
    if(b.tipo === "email"){
      const email = String(b.email || "").trim().toLowerCase();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
        ctx.addIssue({ code: "custom", path: ["email"], message: "email-non-valida" });
      if(String(b.segreto || "").length < 8)
        ctx.addIssue({ code: "custom", path: ["segreto"], message: "segreto-troppo-corto" });
    }
    if(["steam", "apple", "google"].indexOf(b.tipo) >= 0 && !b.biglietto)
      ctx.addIssue({ code: "custom", path: ["biglietto"], message: "biglietto-mancante" });
  }),

  /* POST /api/sessione */
  sessione: z.looseObject({
    tipo: z.enum(TIPI_ACCOUNT.concat(["legacy"])).optional(),
    email: z.string().max(200).optional(),
    segreto: z.string().max(200).optional(),
    idEsterno: z.string().max(200).optional(),
    biglietto: z.string().max(8000).optional(),
    artistaId: z.string().max(80).optional(),
    chiave: z.string().max(200).optional(),
    dispositivo
  }).superRefine((b, ctx) => {
    if(b.tipo === "legacy" && !b.artistaId)
      ctx.addIssue({ code: "custom", path: ["artistaId"], message: "artistaId-mancante" });
    if(["steam", "apple", "google"].indexOf(b.tipo) >= 0 && !b.biglietto)
      ctx.addIssue({ code: "custom", path: ["biglietto"], message: "biglietto-mancante" });
  }),

  /* DELETE /api/account: la conferma scritta per esteso, come chiedono gli store */
  cancellaAccount: z.looseObject({
    conferma: z.literal("cancella", { error: "serve-la-conferma" })
  }),

  /* POST /api/artista */
  artista: z.looseObject({
    nome: z.string({ error: "nome-non-valido" }).max(200),
    citta: testo(200).nullish(),
    genere: testo(60).nullish(),
    storia: testo(1000).nullish(),
    seed: numero,
    difficolta: testo(60).nullish(),
    dispositivo
  }),

  /* PUT /api/artista/:id — tutto facoltativo: si manda quello che cambia */
  aggiornaArtista: z.looseObject({
    nome: testo(200).nullish(),
    citta: testo(200).nullish(),
    genere: testo(60).nullish(),
    storia: testo(1000).nullish()
  }),

  /* POST /api/punteggio: i numeri della settimana. `stream` e `deal` restano
     liberi come sono sempre stati — li giudica plausibilita.js */
  punteggio: z.looseObject({
    id,
    stream: z.unknown().optional(),
    fan: numero, livello: numero, fase: numero, uscite: numero, seed: numero,
    live: numero, feat: numero,
    deal: z.unknown().optional(),
    ultima: testo(300).nullish(),
    difficolta: testo(60).nullish()
  }),

  /* PUT /api/carriera/:n: la partita in cloud. Il tetto (2 MiB) lo mette l'archivio */
  carriera: z.looseObject({
    stato: z.record(z.string(), z.unknown(), { error: "stato-mancante" }),
    artistaId: z.union([z.string().max(80), z.literal("")]).nullish(),
    settimana: numero, anno: numero,
    forza: z.boolean().optional()
  }),

  /* POST /api/traguardo */
  traguardo: z.looseObject({ artistaId: id, codice: testo(80) }),

  /* POST /api/segnalazione */
  segnalazione: z.looseObject({
    artistaId: id,
    motivo: testo(40).optional(),
    nota: testo(600).nullish()
  }),

  /* ---- le rotte dell'admin ---- */
  chiudiStagione: z.looseObject({ quanti: numero }),
  sanzione: z.looseObject({
    accountId: id,
    tipo: testo(40),
    motivo: testo(400).nullish(),
    giorni: numero
  }),
  moderazione: z.looseObject({
    artistaId: id,
    azione: z.enum(["rinomina", "respingi"], { error: "azione-sconosciuta" })
  }),
  spinto: z.looseObject({ artistaId: id, codice: testo(80) })
};

/* Controlla `dato` contro la forma `nome`. Torna { ok: dato } se torna, se no
   { errore, campi } pronto per la risposta: `errore` è il nome di sempre se la
   forma lo dice, altrimenti `dati-non-validi`. */
function controlla(nome, dato){
  const forma = FORME[nome];
  if(!forma) throw new Error("forma sconosciuta: " + nome);
  const r = forma.safeParse(dato == null ? {} : dato);
  if(r.success) return { ok: r.data };
  const campi = r.error.issues.map(i => ({
    campo: i.path.length ? i.path.join(".") : "(corpo)",
    problema: i.message
  }));
  const conNome = campi.find(c => /^[a-z][a-z0-9-]*$/.test(c.problema) && c.problema.includes("-"));
  return { errore: conNome ? conNome.problema : "dati-non-validi", campi };
}

module.exports = { controlla, FORME };
