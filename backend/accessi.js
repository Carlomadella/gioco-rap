/* Entrare con Steam, con Apple e con Google.

   Tutti e tre mandano un **biglietto firmato da loro**, e il nostro mestiere è
   uno solo: verificare la firma prima di dare un account a qualcuno. Se non la
   verifichi, chiunque può dire di essere chiunque — ed è il motivo per cui,
   finché non ci sono le chiavi, qui si risponde «non posso» invece di «va bene».

   Niente dipendenze: la verifica dei token di Apple e Google è JWT firmato
   RS256, e Node sa già leggere una chiave in formato JWK e verificare una
   firma. Per Steam basta una chiamata alla loro API.

   Le chiavi stanno nell'ambiente, mai nel codice:
     ADF_STEAM_CHIAVE   la publisher key di Steamworks
     ADF_STEAM_APPID    l'id del gioco su Steam
     ADF_APPLE_AUD      il bundle id dell'app (l'`aud` che ci aspettiamo)
     ADF_GOOGLE_CLIENT  il client id di Google

   Se una manca, quel canale resta chiuso e lo dice: nessun accesso a metà. */
"use strict";

const crypto = require("crypto");

const CFG = {
  steamChiave: process.env.ADF_STEAM_CHIAVE || "",
  steamAppId: process.env.ADF_STEAM_APPID || "",
  appleAud: process.env.ADF_APPLE_AUD || "",
  googleClient: process.env.ADF_GOOGLE_CLIENT || "",
  /* si possono spostare per le prove; di suo sono i loro */
  appleJwks: process.env.ADF_APPLE_JWKS || "https://appleid.apple.com/auth/keys",
  googleJwks: process.env.ADF_GOOGLE_JWKS || "https://www.googleapis.com/oauth2/v3/certs",
  steamUrl: process.env.ADF_STEAM_URL || "https://partner.steam-api.com/ISteamUserAuth/AuthenticateUserTicket/v1/"
};

/* Le chiavi pubbliche di Apple e Google cambiano ogni tanto: si tengono da
   parte per un'ora, e si vanno a riprendere se salta fuori un `kid` nuovo. */
const cassetto = new Map();                       // url -> { quando, chiavi }
async function chiaviDi(url, forza){
  const c = cassetto.get(url);
  if(!forza && c && Date.now() - c.quando < 3600e3) return c.chiavi;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if(!res.ok) throw new Error("le chiavi pubbliche non rispondono: http " + res.status);
  const dati = await res.json();
  const chiavi = (dati.keys || []).filter(k => k.kty === "RSA");
  cassetto.set(url, { quando: Date.now(), chiavi });
  return chiavi;
}

const base64url = s => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");

/* Verifica un JWT firmato RS256 e torna quello che c'è dentro, solo se:
   la firma torna, l'emittente è quello giusto, il destinatario siamo noi, e
   non è scaduto. Se una sola di queste non torna, non è valido. */
async function apriToken(token, emittente, destinatario, urlChiavi){
  const pezzi = String(token || "").split(".");
  if(pezzi.length !== 3) return null;
  let testa, corpo;
  try{
    testa = JSON.parse(base64url(pezzi[0]).toString("utf8"));
    corpo = JSON.parse(base64url(pezzi[1]).toString("utf8"));
  }catch(e){ return null; }
  if(testa.alg !== "RS256") return null;

  let chiavi = await chiaviDi(urlChiavi);
  let jwk = chiavi.find(k => k.kid === testa.kid);
  if(!jwk){                                        // magari le hanno appena cambiate
    chiavi = await chiaviDi(urlChiavi, true);
    jwk = chiavi.find(k => k.kid === testa.kid);
  }
  if(!jwk) return null;

  const pubblica = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const buona = crypto.verify("RSA-SHA256",
    Buffer.from(pezzi[0] + "." + pezzi[1]), pubblica, base64url(pezzi[2]));
  if(!buona) return null;

  const adesso = Math.floor(Date.now() / 1000);
  /* La scadenza è **obbligatoria**, non «controllata se c'è». Prima il
     controllo era `if(corpo.exp && ...)`: un biglietto senza `exp` saltava la
     riga e valeva per sempre. Apple e Google la mettono sempre, quindi non
     toglie niente a nessuno — ma un biglietto eterno, se mai ne uscisse uno,
     è esattamente la cosa che non deve entrare. */
  if(typeof corpo.exp !== "number") return null;                   // senza scadenza non si entra
  if(corpo.exp < adesso - 60) return null;                         // scaduto
  if(corpo.iat && corpo.iat > adesso + 300) return null;           // firmato nel futuro
  if(emittente && String(corpo.iss || "").replace(/^https:\/\//, "") !== emittente.replace(/^https:\/\//, "")) return null;
  const aud = Array.isArray(corpo.aud) ? corpo.aud : [corpo.aud];
  if(destinatario && aud.indexOf(destinatario) < 0) return null;   // non è per noi
  if(!corpo.sub) return null;
  return corpo;
}

/* ==================== I TRE ==================== */

/* Steam: il gioco chiede a Steamworks un biglietto e ce lo passa; noi lo
   facciamo verificare a Steam, che ci dice di chi è. */
async function steam(biglietto){
  if(!CFG.steamChiave || !CFG.steamAppId) return { chiuso: "manca ADF_STEAM_CHIAVE o ADF_STEAM_APPID" };
  if(!/^[0-9a-f]+$/i.test(String(biglietto || ""))) return { no: "biglietto-non-valido" };
  const url = CFG.steamUrl + "?key=" + encodeURIComponent(CFG.steamChiave) +
    "&appid=" + encodeURIComponent(CFG.steamAppId) + "&ticket=" + encodeURIComponent(biglietto);
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if(!res.ok) return { no: "steam-non-risponde" };
  const dati = await res.json().catch(() => null);
  const r = dati && dati.response && dati.response.params;
  if(!r || r.result !== "OK" || !r.steamid) return { no: "biglietto-rifiutato" };
  if(r.vacbanned || r.publisherbanned) return { no: "account-bandito" };
  return { id: String(r.steamid) };
}

/* Apple: «Sign in with Apple» manda un identity token, che è un JWT firmato. */
async function apple(token){
  if(!CFG.appleAud) return { chiuso: "manca ADF_APPLE_AUD" };
  const dentro = await apriToken(token, "appleid.apple.com", CFG.appleAud, CFG.appleJwks);
  return dentro ? { id: String(dentro.sub) } : { no: "biglietto-rifiutato" };
}

/* Google Play Games / Sign in with Google: stessa storia. */
async function google(token){
  if(!CFG.googleClient) return { chiuso: "manca ADF_GOOGLE_CLIENT" };
  const dentro = await apriToken(token, "accounts.google.com", CFG.googleClient, CFG.googleJwks);
  return dentro ? { id: String(dentro.sub) } : { no: "biglietto-rifiutato" };
}

/* Torna { id } se il biglietto è buono, { no } se è sbagliato, { chiuso } se
   siamo noi a non essere pronti. Chi chiama distingue: un biglietto rifiutato
   è colpa di chi lo manda, un canale chiuso è colpa nostra. */
async function verifica(tipo, biglietto){
  try{
    if(tipo === "steam") return await steam(biglietto);
    if(tipo === "apple") return await apple(biglietto);
    if(tipo === "google") return await google(biglietto);
  }catch(e){
    return { no: "verifica-non-riuscita", perche: e.message };
  }
  return { no: "tipo-sconosciuto" };
}

const collegati = () => ({
  steam: !!(CFG.steamChiave && CFG.steamAppId),
  apple: !!CFG.appleAud,
  google: !!CFG.googleClient
});

module.exports = { verifica, collegati, apriToken, CFG };
