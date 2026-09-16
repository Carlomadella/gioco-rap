/* Entrare con Steam, con Apple e con Google.

   Tutti e tre mandano un **biglietto firmato da loro**, e il nostro mestiere è
   uno solo: verificare la firma prima di dare un account a qualcuno. Se non la
   verifichi, chiunque può dire di essere chiunque — ed è il motivo per cui,
   finché non ci sono le chiavi, qui si risponde «non posso» invece di «va bene».

   La verifica dei token di Apple e Google la fa `jose` (16/09/2026): prima era
   scritta a mano — base64url, firma RS256, chiavi JWKS con la rotazione,
   `iss`/`aud`/`exp` — ed era scritta bene, ma è il posto peggiore del progetto
   dove tenere codice proprio: un errore lì non lo prende nessun test e si
   scopre quando qualcuno entra nell'account di un altro. `jose` fa esattamente
   quello, lo fa da anni e lo leggono in tanti. Il perché per esteso sta in
   documentazione/dipendenze.md. Per Steam basta una chiamata alla loro API.

   Le chiavi stanno nell'ambiente, mai nel codice:
     ADF_STEAM_CHIAVE   la publisher key di Steamworks
     ADF_STEAM_APPID    l'id del gioco su Steam
     ADF_APPLE_AUD      il bundle id dell'app (l'`aud` che ci aspettiamo)
     ADF_GOOGLE_CLIENT  il client id di Google

   Se una manca, quel canale resta chiuso e lo dice: nessun accesso a metà. */
"use strict";

const { createRemoteJWKSet, jwtVerify } = require("jose");

/* Gli errori di `jose` che parlano del BIGLIETTO: firma che non torna, chiave
   sconosciuta, scaduto, non per noi, algoritmo non ammesso, JWT malformato.
   Tutto il resto — il server delle chiavi che va in timeout, che risponde 503
   o con una pagina HTML invece del JSON, la rete che non c'è — è colpa nostra,
   e si racconta come «verifica non riuscita», non come «biglietto rifiutato».
   Prima si guardava il messaggio con una regex, e un 503 di Apple passava per
   un biglietto falso. */
const COLPA_DEL_BIGLIETTO = /^ERR_(JWT_|JWS_|JWKS_NO_MATCHING_KEY|JWKS_MULTIPLE_MATCHING_KEYS|JOSE_ALG_NOT_ALLOWED|JOSE_NOT_SUPPORTED)/;
const colpaDelBiglietto = e => !!(e && COLPA_DEL_BIGLIETTO.test(String(e.code || "")));

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

/* Le chiavi pubbliche di Apple e Google cambiano ogni tanto: `jose` le tiene
   da parte per un'ora e se le va a riprendere da solo quando salta fuori un
   `kid` che non conosce. Un mazzo per indirizzo, aperto la prima volta che
   serve. */
const mazzi = new Map();                          // url -> JWKS remoto
function mazzoDi(url){
  let m = mazzi.get(url);
  if(!m){
    m = createRemoteJWKSet(new URL(url), { cacheMaxAge: 3600e3, timeoutDuration: 6000 });
    mazzi.set(url, m);
  }
  return m;
}

/* Verifica un JWT firmato RS256 e torna quello che c'è dentro, solo se:
   la firma torna, l'emittente è quello giusto, il destinatario siamo noi, e
   non è scaduto. Se una sola di queste non torna, non è valido.

   La scadenza è **obbligatoria**, non «controllata se c'è» (`requiredClaims`):
   un biglietto senza `exp` varrebbe per sempre. Apple e Google la mettono
   sempre, quindi non toglie niente a nessuno — ma un biglietto eterno, se mai
   ne uscisse uno, è esattamente la cosa che non deve entrare. Il minuto di
   tolleranza sull'orologio è lo stesso di prima. */
async function apriToken(token, emittente, destinatario, urlChiavi){
  if(typeof token !== "string" || token.split(".").length !== 3) return null;
  const iss = String(emittente || "").replace(/^https:\/\//, "");
  try{
    const { payload } = await jwtVerify(token, mazzoDi(urlChiavi), {
      algorithms: ["RS256"],
      /* Google firma con `accounts.google.com` o con `https://accounts.google.com`:
         valgono tutti e due, e così anche per Apple */
      issuer: iss ? [iss, "https://" + iss] : undefined,
      audience: destinatario || undefined,
      requiredClaims: ["exp", "sub"],
      clockTolerance: 60
    });
    /* firmato nel futuro: non è un caso che `jose` guardi da solo */
    const adesso = Math.floor(Date.now() / 1000);
    if(typeof payload.iat === "number" && payload.iat > adesso + 300) return null;
    if(!payload.sub) return null;
    return payload;
  }catch(e){
    /* per chi chiama un biglietto sbagliato è «rifiutato»; se invece sono le
       chiavi pubbliche a non rispondere è un guaio nostro e si rilancia: chi
       chiama lo racconta come verifica non riuscita */
    if(colpaDelBiglietto(e)) return null;
    throw new Error("le chiavi pubbliche non rispondono: " + (e && e.message || e));
  }
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
