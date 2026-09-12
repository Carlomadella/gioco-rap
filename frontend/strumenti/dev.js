/* Il server di sviluppo.

     npm run dev        → http://localhost:8000

   Serve la cartella del gioco così com'è — file separati, niente build, niente
   attesa — e **ricarica la pagina da sola** appena tocchi un CSS, un JS o
   l'HTML. È tutto qui il motivo per cui esiste: togliere il gesto di andare sul
   browser a schiacciare F5 duecento volte al giorno.

   Nessuna dipendenza: Node e basta. Con `--porta 3000` cambia porta, con
   `--dist` serve la cartella `dist/` (per provare il build vero prima di
   impacchettarlo). */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const PORTA = Number(arg("--porta") || 8000);
const RADICE = path.resolve(__dirname, "..", process.argv.includes("--dist") ? "dist" : ".");

const TIPI = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav",
  ".bin": "application/octet-stream"
};

/* il pezzetto che si infila nelle pagine: sta in ascolto e ricarica */
const RICARICA = `
<script>
(() => {
  const s = new EventSource("/__ricarica");
  s.onmessage = e => { if(e.data === "cambiato") location.reload(); };
  s.onerror = () => setTimeout(() => location.reload(), 1500);   // il server e' ripartito
})();
</script>`;

const orecchie = new Set();
function avvisa(){
  for(const res of orecchie) res.write("data: cambiato\n\n");
}

/* ADF_DEV_WATCH_CONTENT_GUARD_V1
   Su Windows fs.watch può notificare anche accessi/variazioni di metadati
   mentre MakeHuman legge runtime e proxy JSON. Il vecchio server trattava
   QUALSIASI notifica come "file sorgente modificato" e ricaricava il parent
   della landing, distruggendo creator/app-shell.

   Regola nuova: una notifica del filesystem NON basta. Ricarichiamo soltanto
   se size o mtime del file sono realmente cambiati rispetto all'ultima
   impronta nota. Le impronte vengono registrate quando il server serve il file,
   quindi leggere lo stesso asset non può più essere scambiato per un salvataggio. */
const impronteFile = new Map();

function chiaveFile(f){
  return path.resolve(f);
}

function improntaStat(stat){
  return String(stat.size) + ":" + String(stat.mtimeMs);
}

function ricordaImpronta(f, stat){
  try{
    if(!stat || !stat.isFile()) return;
    if(!/\.(?:html|css|js|json)$/i.test(String(f))) return;
    impronteFile.set(chiaveFile(f), improntaStat(stat));
  }catch(e){}
}

function fileDavveroModificato(file){
  const f = path.resolve(RADICE, String(file));
  const key = chiaveFile(f);

  let stat;
  try{
    stat = fs.statSync(f);
  }catch(e){
    /* La rimozione di un file già noto è una modifica reale. */
    const esisteva = impronteFile.delete(key);
    return esisteva;
  }

  if(!stat.isFile()) return false;

  const next = improntaStat(stat);
  const prev = impronteFile.get(key);

  impronteFile.set(key, next);

  /* File mai visto: prudenza, consideriamo reale la notifica.
     I file caricati dal gioco sono già improntati nel server HTTP prima
     della lettura e quindi non passano da questo ramo. */
  if(prev === undefined) return true;

  return prev !== next;
}

/* si guarda la cartella, ma si sta zitti per 80 ms: salvare un file fa
   scattare l'evento due o tre volte, e ricaricare tre volte e' fastidioso */
let attesa = null;
fs.watch(RADICE, { recursive: true }, (tipo, file) => {
  if(!file || /node_modules|[\\/]dist[\\/]|\.tmp$|~$/.test(file)) return;
  if(!/\.(?:html|css|js|json)$/i.test(String(file))) return;

  if(!fileDavveroModificato(file)) return;

  clearTimeout(attesa);
  attesa = setTimeout(() => {
    console.log("  ~ " + String(file).replace(/\\/g, "/"));
    avvisa();
  }, 80);
});

/* ADF_DEV_MAKEHUMAN_CROSS_BROWSER_V1
   Non affidiamoci esclusivamente a Sec-Fetch-Dest: su browser diversi o
   configurazioni diverse l'header può non essere disponibile. Tutti gli
   HTML sotto /media/ sono documenti interni (creator/camerini/engine) e
   non devono aprire un EventSource permanente. */
function eDocumentoInterno(req, url){
  const fetchDest = String(req.headers["sec-fetch-dest"] || "").toLowerCase();

  if(fetchDest === "iframe" || fetchDest === "frame") return true;

  const pathname = String(url.pathname || "").replace(/\\/g, "/");
  if(pathname === "/media" || pathname.startsWith("/media/")) return true;

  return false;
}

function parseRange(header, size){
  const raw = String(header || "").trim();
  if(!raw) return null;

  const m = /^bytes=(\d*)-(\d*)$/i.exec(raw);
  if(!m) return null;

  let start = m[1] ? Number(m[1]) : null;
  let end = m[2] ? Number(m[2]) : null;

  if(start === null && end === null) return null;

  if(start === null){
    const suffix = Math.max(0, Number(end) || 0);
    if(!suffix) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    end = end === null ? size - 1 : Math.min(end, size - 1);
  }

  if(!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if(start < 0 || end < start || start >= size) return null;

  return { start, end };
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if(url.pathname === "/__ricarica"){
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache",
      connection: "keep-alive" });
    res.write("retry: 1000\n\n");
    orecchie.add(res);
    req.on("close", () => orecchie.delete(res));
    return;
  }

  let rel = decodeURIComponent(url.pathname);
  if(rel.endsWith("/")) rel += "index.html";
  const f = path.resolve(RADICE, "." + rel);
  if(!f.startsWith(RADICE)){ res.writeHead(403).end("no"); return; }   // niente giri fuori dalla cartella

  fs.stat(f, (err, stat) => {
    /* Un file che non c'è, qui, vuol dire un percorso sbagliato mentre si
       lavora: si dice quale ed è finita. Le pagine di errore vestite bene le
       fa il backend (`backend/risposte.js`), che è l'unico posto dove hanno
       senso — questo è un banchetto che serve file dal disco, non il server
       del gioco. */
    if(err || !stat.isFile()){
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("non c'è: " + rel);
      return;
    }

    /* Baseline per il watcher PRIMA di qualunque read/stream del file.
       Se Windows genera una notifica solo perché il browser lo sta leggendo,
       size+mtime restano identici e la notifica viene ignorata. */
    ricordaImpronta(f, stat);

    const tipo = TIPI[path.extname(f).toLowerCase()] || "application/octet-stream";

    /* Gli HTML sono l'unico caso in cui serve modificare il payload.
       Gli HTML interni /media/ non ricevono MAI RICARICA: il top-level li
       ricaricherà comunque e non consumiamo connessioni SSE negli iframe. */
    if(tipo.startsWith("text/html")){
      fs.readFile(f, (readErr, dato) => {
        if(readErr){
          res.writeHead(500, { "content-type": "text/plain; charset=utf-8" }).end("errore lettura: " + rel);
          return;
        }

        if(!eDocumentoInterno(req, url)){
          dato = Buffer.from(String(dato).replace("</body>", RICARICA + "\n</body>"));
        }

        const headers = {
          "content-type": tipo,
          "cache-control": "no-store",
          "content-length": String(dato.length)
        };

        res.writeHead(200, headers);
        if(req.method === "HEAD") res.end();
        else res.end(dato);
      });
      return;
    }

    /* Runtime MakeHuman e asset grandi: stream, Content-Length e Range.
       Evita di bufferizzare targets.bin (~145 MB) e rende la consegna uguale
       per Chrome, Firefox e Safari. */
    const range = parseRange(req.headers.range, stat.size);
    const headers = {
      "content-type": tipo,
      "cache-control": "no-store",
      "accept-ranges": "bytes"
    };

    let start = 0;
    let end = stat.size - 1;
    let status = 200;

    if(range){
      start = range.start;
      end = range.end;
      status = 206;
      headers["content-range"] = `bytes ${start}-${end}/${stat.size}`;
    }

    headers["content-length"] = String(Math.max(0, end - start + 1));
    res.writeHead(status, headers);

    if(req.method === "HEAD"){
      res.end();
      return;
    }

    const stream = fs.createReadStream(f, { start, end });
    stream.on("error", streamErr => {
      console.error("errore stream:", rel, streamErr.message);
      if(!res.headersSent) res.writeHead(500);
      res.destroy(streamErr);
    });
    stream.pipe(res);
  });
}).listen(PORTA, () => {
  console.log("Anni di Fame — http://localhost:" + PORTA);
  console.log("  cartella:  " + RADICE);
  console.log("  ricarica:  accesa (salva un file e la pagina si rifà da sola)");
});
