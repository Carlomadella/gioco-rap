"use strict";

const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { spawn } = require("node:child_process");
const { setTimeout: pausa } = require("node:timers/promises");

const BASE_URL = "http://127.0.0.1:8000";
const GAME_URL = `${BASE_URL}/pagine/gioco.html`;
const ENDPOINT = `${BASE_URL}/__playwright`;
const FRONTEND_ROOT = path.resolve(__dirname, "../..");

async function giocoDisponibile(){
  try{
    const risposta = await fetch(GAME_URL, {
      signal: AbortSignal.timeout(1000)
    });
    return risposta.ok;
  }catch(e){
    return false;
  }
}

async function endpointPosseduto(token){
  try{
    const risposta = await fetch(ENDPOINT, {
      headers: { "x-playwright-token": token },
      signal: AbortSignal.timeout(1000)
    });
    return risposta.ok && (await risposta.text()) === token;
  }catch(e){
    return false;
  }
}

async function attendiAvvio(uscita, token){
  for(let tentativo = 0; tentativo < 300; tentativo++){
    if(await endpointPosseduto(token)) return;

    const risultato = await Promise.race([
      pausa(100).then(() => null),
      uscita
    ]);

    if(risultato)
      throw new Error(
        `Il server Playwright si è chiuso prima dell'avvio (codice ${risultato.code}, segnale ${risultato.signal || "nessuno"}).`
      );
  }

  throw new Error("Il server Playwright non è pronto entro 30 secondi.");
}

async function attendiUscita(uscita, millisecondi){
  return Promise.race([
    uscita,
    pausa(millisecondi).then(() => null)
  ]);
}

async function fermaServer(server, uscita, token){
  let erroreArresto = null;
  let risultato = null;

  try{
    const risposta = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "x-playwright-token": token },
      signal: AbortSignal.timeout(2000)
    });

    if(!risposta.ok)
      throw new Error("Il server Playwright ha rifiutato la chiusura.");

    await risposta.text();
  }catch(e){
    erroreArresto = e;
  }finally{
    risultato = await attendiUscita(uscita, 5000);

    if(!risultato){
      server.kill();
      risultato = await attendiUscita(uscita, 2000);
    }
  }

  if(!risultato)
    throw new Error("Il processo server Playwright non si è chiuso entro 7 secondi.", {
      cause: erroreArresto
    });

  if(erroreArresto) throw erroreArresto;

  if(risultato.code !== 0)
    throw new Error(
      `Il server Playwright è terminato con codice ${risultato.code} (segnale ${risultato.signal || "nessuno"}).`
    );
}

module.exports = async function preparaCicloServer(){
  // Un server avviato dall'utente resta esterno al ciclo di vita dei test.
  if(await giocoDisponibile()) return;

  const token = randomUUID();

  const server = spawn(
    process.execPath,
    [
      path.join(FRONTEND_ROOT, "strumenti/dev.js"),
      "--playwright",
      "--playwright-token",
      token
    ],
    {
      cwd: FRONTEND_ROOT,
      env: process.env,
      shell: false,
      stdio: ["ignore", "inherit", "inherit"],
      windowsHide: true
    }
  );

  const uscita = new Promise((resolve, reject) => {
    server.once("error", reject);
    server.once("exit", (code, signal) => resolve({ code, signal }));
  });

  try{
    await attendiAvvio(uscita, token);
  }catch(erroreAvvio){
    try{
      await fermaServer(server, uscita, token);
    }catch(erroreChiusura){
      erroreAvvio.cause = erroreChiusura;
    }

    throw erroreAvvio;
  }

  return () => fermaServer(server, uscita, token);
};

module.exports.BASE_URL = BASE_URL;
