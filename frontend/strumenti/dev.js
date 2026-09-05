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
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav"
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

/* si guarda la cartella, ma si sta zitti per 80 ms: salvare un file fa
   scattare l'evento due o tre volte, e ricaricare tre volte e' fastidioso */
let attesa = null;
fs.watch(RADICE, { recursive: true }, (tipo, file) => {
  if(!file || /node_modules|[\\/]dist[\\/]|\.tmp$|~$/.test(file)) return;
  if(!/\.(?:html|css|js|json)$/i.test(String(file))) return;
  clearTimeout(attesa);
  attesa = setTimeout(() => {
    console.log("  ~ " + String(file).replace(/\\/g, "/"));
    avvisa();
  }, 80);
});

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

  fs.readFile(f, (err, dato) => {
    if(err){
      /* la pagina 404 vera se c'è, il testo secco se manca anche quella:
         il server di sviluppo deve far vedere quello che vedrà chi gioca. */
      fs.readFile(path.join(RADICE, "404.html"), (e2, pagina) => {
        if(e2){ res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("non c'è: " + rel); return; }
        res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(pagina);
      });
      return;
    }
    const tipo = TIPI[path.extname(f).toLowerCase()] || "application/octet-stream";
    if(tipo.startsWith("text/html")){
      dato = Buffer.from(String(dato).replace("</body>", RICARICA + "\n</body>"));
    }
    res.writeHead(200, { "content-type": tipo, "cache-control": "no-store" });
    res.end(dato);
  });
}).listen(PORTA, () => {
  console.log("Anni di Fame — http://localhost:" + PORTA);
  console.log("  cartella:  " + RADICE);
  console.log("  ricarica:  accesa (salva un file e la pagina si rifà da sola)");
});
