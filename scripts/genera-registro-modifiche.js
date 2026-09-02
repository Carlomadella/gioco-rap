const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function git(args) {
    return execFileSync("git", args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
    }).trim();
}

const root = git(["rev-parse", "--show-toplevel"]);
const registroDir = path.join(root, "registro-modifiche");

const categorie = [
    {
        file: "01-mappa-e-citta.md",
        titolo: "01 â€” Mappa e cittÃ ",
        match: p => /(mappa|map|citta|city|meteo|spostament|trasfert|viagg|quartier|location)/i.test(p)
    },
    {
        file: "02-interfaccia-e-telefono.md",
        titolo: "02 â€” Interfaccia e telefono",
        match: p => /(telefono|phone|traphone|actionbar|hud|interfaccia|schermata|menu|modal|\/ui\.|ui\.js)/i.test(p)
    },
    {
        file: "03-artista-e-avatar.md",
        titolo: "03 â€” Artista e avatar",
        match: p => /(avatar|creator|character.?creator|artista|capelli|hair|outfit|vestiti|aspetto|profilo.?artista)/i.test(p)
    },
    {
        file: "04-musica-e-suoni.md",
        titolo: "04 â€” Musica e suoni",
        match: p => /(musica|music|audio|sound|sfx|beat|brano|track|studio.?musicale|recording)/i.test(p)
    },
    {
        file: "05-carriera-e-tempo.md",
        titolo: "05 â€” Carriera e tempo",
        match: p => /(tempo|time|carriera|career|lavoro|job|lifestyle|calendario|energia|fame|hardening|bilanciamento)/i.test(p)
    },
    {
        file: "06-mondo-e-personaggi.md",
        titolo: "06 â€” Mondo e personaggi",
        match: p => /(mondo|npc|evento|eventi|strada|crimine|criminal|posto|negozio|personaggi|polizia)/i.test(p)
    },
    {
        file: "07-multiplayer-e-backend.md",
        titolo: "07 â€” Multiplayer e backend",
        match: p => /(^backend\/|multiplayer|server|socket|database|\/api\/|api\.|websocket)/i.test(p)
    },
    {
        file: "08-uscita-sugli-store.md",
        titolo: "08 â€” Uscita sugli store",
        match: p => /(steam|store|release|deploy|electron|manifest|installer|distribution|pubblicazione)/i.test(p)
    },
    {
        file: "09-grafica-e-asset.md",
        titolo: "09 â€” Grafica e asset",
        match: p => /(\/css\/|\/media\/|\/assets\/|grafica|texture|font|\.png$|\.jpg$|\.jpeg$|\.webp$|\.svg$|\.gif$)/i.test(p)
    }
,

    {
        file: "10-sistemi-di-gioco.md",
        titolo: "10 — Sistemi di gioco",
        match: p => /(gameplay|sistema.?di.?gioco)/i.test(p)
    },
    {
        file: "11-strumenti-e-test.md",
        titolo: "11 — Strumenti e test",
        match: p => /(frontend\/strumenti\/|audit|build|dev|test|fix-mojibake)/i.test(p)
    }
];

const altra = {
    file: "ALTRO.md",
    titolo: "ALTRO"
};

function intestazione(titolo) {
    return `# ${titolo}

Registro automatico delle modifiche realmente entrate in \`main\`.

Non contiene idee, TODO o implementazioni future.

---

`;
}

function inizializza() {
    fs.mkdirSync(registroDir, { recursive: true });

    for (const cat of [...categorie, altra]) {
        const destinazione = path.join(registroDir, cat.file);

        if (!fs.existsSync(destinazione)) {
            fs.writeFileSync(
                destinazione,
                intestazione(cat.titolo),
                "utf8"
            );
        }
    }
}

function ignorare(file) {
    const p = file.replace(/\\/g, "/");

    if (p.startsWith("registro-modifiche/")) return true;
    if (p.startsWith("implementazioni/")) return true;
    if (p.startsWith("brainstorming-miglioramenti-ai/")) return true;
    if (p.startsWith(".githooks/")) return true;
    if (p.startsWith(".github/")) return true;
    if (p.startsWith("scripts/")) return true;

    if (p === "scripts/genera-registro-modifiche.js") return true;

    if (/\.bak$/i.test(p)) return true;
    if (/\.patch$/i.test(p)) return true;

    if (!p.includes("/") && /\.md$/i.test(p)) return true;

    if (p === ".gitignore") return true;

    return false;
}

function nomeBranchMerge() {
    try {
        const reflog = git(["reflog", "-1", "--format=%gs"]);
        const match = reflog.match(/^merge\s+(.+?):/i);

        if (match) return match[1];
    } catch {}

    try {
        const subject = git(["log", "-1", "--format=%s", "HEAD"]);

        let match = subject.match(/Merge branch '([^']+)'/i);
        if (match) return match[1];

        match = subject.match(/Merge remote-tracking branch '([^']+)'/i);
        if (match) return match[1];
    } catch {}

    return "branch non identificato";
}

function inserisciVoce(fileCategoria, titoloCategoria, voce, marker) {
    const destinazione = path.join(registroDir, fileCategoria);

    let contenuto = fs.existsSync(destinazione)
        ? fs.readFileSync(destinazione, "utf8")
        : intestazione(titoloCategoria);

    if (contenuto.includes(marker)) {
        return;
    }

    const separatore = contenuto.indexOf("---");

    if (separatore === -1) {
        contenuto =
            intestazione(titoloCategoria) +
            voce +
            "\n";
    } else {
        const fineSeparatore = separatore + 3;

        contenuto =
            contenuto.slice(0, fineSeparatore) +
            "\n\n" +
            voce +
            "\n" +
            contenuto.slice(fineSeparatore).trimStart();
    }

    fs.writeFileSync(destinazione, contenuto, "utf8");
}

inizializza();

if (process.argv.includes("--init")) {
    console.log("âœ“ File del registro inizializzati.");
    process.exit(0);
}

const branchCorrente = git(["branch", "--show-current"]);

if (branchCorrente !== "main") {
    console.log("Registro non aggiornato: il merge non Ã¨ avvenuto su main.");
    process.exit(0);
}

const rigaParents = git(["rev-list", "--parents", "-n", "1", "HEAD"]);
const parents = rigaParents.split(/\s+/);

if (parents.length < 3) {
    console.log("Registro non aggiornato: HEAD non Ã¨ un merge commit.");
    process.exit(0);
}

const mergeHash = git(["rev-parse", "--short", "HEAD"]);
const parentPrima = git(["rev-parse", "HEAD^1"]);
const parentMerge = git(["rev-parse", "HEAD^2"]);

const committer = git(["log", "-1", "--format=%cn", "HEAD"]);
const email = git(["log", "-1", "--format=%ce", "HEAD"]);
const dataISO = git(["log", "-1", "--format=%cI", "HEAD"]);

const data = new Date(dataISO).toLocaleString("it-IT", {
    dateStyle: "short",
    timeStyle: "short"
});

const branchSorgente = nomeBranchMerge();

const diffRaw = git([
    "diff",
    "--name-status",
    "-M",
    parentPrima,
    "HEAD"
]);

let modifiche = diffRaw
    .split(/\r?\n/)
    .filter(Boolean)
    .map(riga => {
        const parti = riga.split("\t");
        const stato = parti[0];
        const file = parti[parti.length - 1];

        return {
            stato,
            file,
            vecchioFile:
                stato.startsWith("R") && parti.length >= 3
                    ? parti[1]
                    : null
        };
    })
    .filter(x => !ignorare(x.file));

if (modifiche.length === 0) {
    console.log("âœ“ Merge composto solo da documentazione o file ignorati.");
    process.exit(0);
}

let commitRaw = "";

try {
    commitRaw = git([
        "log",
        "--format=%h%x09%an%x09%s",
        `${parentPrima}..${parentMerge}`
    ]);
} catch {}

const commits = commitRaw
    ? commitRaw
        .split(/\r?\n/)
        .filter(Boolean)
        .map(riga => {
            const [hash, autore, ...resto] = riga.split("\t");

            return `- \`${hash}\` â€” ${resto.join("\t")} â€” **${autore}**`;
        })
        .join("\n")
    : "- Nessun commit individuale rilevato";

const marker = `<!-- merge:${mergeHash} -->`;

function descrizioneFile(item) {
    if (item.stato.startsWith("A")) {
        return `- **Aggiunto:** \`${item.file}\``;
    }

    if (item.stato.startsWith("D")) {
        return `- **Rimosso:** \`${item.file}\``;
    }

    if (item.stato.startsWith("R")) {
        return `- **Rinominato:** \`${item.vecchioFile}\` â†’ \`${item.file}\``;
    }

    return `- **Modificato:** \`${item.file}\``;
}

const assegnazioni = new Map();

for (const modifica of modifiche) {
    const contesto = `${modifica.file} ${branchSorgente} ${commitRaw}`;

    let trovate = [];

    function aggiungiCategoria(nomeFile) {
        const categoria = categorie.find(
            c => c.file === nomeFile
        );

        if (
            categoria &&
            !trovate.includes(categoria)
        ) {
            trovate.push(categoria);
        }
    }

    // Gli strumenti tecnici non sono gameplay.
    if (
        /^(?:frontend\/)?strumenti\//i.test(modifica.file) ||
        /(audit-regressioni|build\.js|dev\.js|fix-mojibake)/i.test(modifica.file)
    ) {
        aggiungiCategoria("11-strumenti-e-test.md");
    } else {

        // Prima usa le normali regole delle categorie.
        trovate = categorie.filter(cat =>
            cat.match(contesto)
        );

        // MAPPA / CITTA
        if (
            /(mappa|\bmap\b|meteo|citt[aà]|trasfert|spostament|viagg|quartier|location)/i.test(contesto)
        ) {
            aggiungiCategoria("01-mappa-e-citta.md");
        }

        // INTERFACCIA / TELEFONO
        if (
            /(interfaccia|telefono|traphone|actionbar|hud|\bui\b|menu|schermata|modal)/i.test(contesto)
        ) {
            aggiungiCategoria("02-interfaccia-e-telefono.md");
        }

        // ARTISTA / AVATAR
        if (
            /(avatar|creator|character.?creator|artista|capelli|hair|outfit|vestiti)/i.test(contesto)
        ) {
            aggiungiCategoria("03-artista-e-avatar.md");
        }

        // MUSICA
        if (
            /(discografia|videomaker|\bsala\b|beat|brano|musica|music|audio|sound|producer|studio musicale)/i.test(contesto)
        ) {
            aggiungiCategoria("04-musica-e-suoni.md");
        }

        // CARRIERA / TEMPO
        if (
            /(tempo|\btime\b|orari|salto.?di.?tempo|carriera|career|lifestyle|energia|hardening|bilanciamento|recupero)/i.test(contesto)
        ) {
            aggiungiCategoria("05-carriera-e-tempo.md");
        }

        // MONDO / NPC / CRIMINALITA
        if (
            /(crime|criminal|crimine|carcere|jail|strada|evento|eventi|incontr|opportunit|npc|polizia)/i.test(contesto)
        ) {
            aggiungiCategoria("06-mondo-e-personaggi.md");
        }

        // BACKEND
        if (
            /(backend|server|socket|database|multiplayer|websocket|\bapi\b)/i.test(contesto)
        ) {
            aggiungiCategoria("07-multiplayer-e-backend.md");
        }

        // RELEASE
        if (
            /(steam|release|deploy|store|installer|electron|pubblicazione)/i.test(contesto)
        ) {
            aggiungiCategoria("08-uscita-sugli-store.md");
        }

        // ==========================================
        // REGOLE LEGACY PRE-FRONTEND
        // Supportano la struttura iniziale:
        // css/, js/, media/, index.html
        // ==========================================

        // Vecchi CSS e media = grafica / asset.
        if (
            /^(?:frontend\/)?(?:css|media|assets)\//i.test(modifica.file)
        ) {
            aggiungiCategoria("09-grafica-e-asset.md");
        }

        // Plancia, navbar e componenti visivi.
        if (
            /(navbar|sidebar|plancia|badge|linguett|fondale|overlay|ritratto|barra.?dell.?esperienza)/i.test(contesto)
        ) {
            aggiungiCategoria("02-interfaccia-e-telefono.md");
        }

        // Uscita/chiusura delle finestre e degli overlay.
        if (
            /(ESC|clic fuori|clic sul fondale|esce da ogni azione|chiude pi[uù]?)/i.test(contesto)
        ) {
            aggiungiCategoria("02-interfaccia-e-telefono.md");
        }

        // Scrittura musicale e contenuti collegati.
        if (
            /(strofa|versi|writer|copertin|covers|autocompletamento)/i.test(contesto)
        ) {
            aggiungiCategoria("04-musica-e-suoni.md");
        }

        // Piazza e scene del mondo di gioco.
        if (
            /(piazza)/i.test(contesto)
        ) {
            aggiungiCategoria("06-mondo-e-personaggi.md");
        }

        // Refactor strutturali e import iniziale:
        // sono parte dell'architettura del gioco.
        if (
            /(refactor|monolite|import iniziale|artifact)/i.test(contesto)
        ) {
            aggiungiCategoria("10-sistemi-di-gioco.md");
        }

        // JS di gioco che non appartiene chiaramente
        // a una categoria specifica.
        if (
            trovate.length === 0 &&
            /^(?:frontend\/)?js\/game\//i.test(modifica.file)
        ) {
            aggiungiCategoria("10-sistemi-di-gioco.md");
        }

        // HTML generico = interfaccia, salvo che il
        // contesto lo abbia già classificato meglio.
        if (
            trovate.length === 0 &&
            /^(?:frontend\/)?(?:.*\/)?[^/]+\.html$/i.test(modifica.file)
        ) {
            aggiungiCategoria("02-interfaccia-e-telefono.md");
        }
    }

    if (trovate.length === 0) {
        const lista = assegnazioni.get(altra.file) || [];
        lista.push(modifica);
        assegnazioni.set(altra.file, lista);
    } else {
        for (const cat of trovate) {
            const lista = assegnazioni.get(cat.file) || [];
            lista.push(modifica);
            assegnazioni.set(cat.file, lista);
        }
    }
}

for (const [fileCategoria, files] of assegnazioni.entries()) {
    const categoria =
        categorie.find(c => c.file === fileCategoria) || altra;

    const listaFile = files
        .map(descrizioneFile)
        .join("\n");

    const voce = `${marker}
## ${data} â€” ${branchSorgente} â†’ main

**Merge effettuato da:** ${committer} (${email})  
**Merge commit:** \`${mergeHash}\`

### Cosa Ã¨ entrato

${commits}

### File di questa categoria

${listaFile}

**File interessati in questa categoria:** ${files.length}

---
`;

    inserisciVoce(
        categoria.file,
        categoria.titolo,
        voce,
        marker
    );
}

console.log("");
console.log("âœ“ REGISTRO MODIFICHE AGGIORNATO");
console.log(`âœ“ Merge: ${branchSorgente} â†’ main`);
console.log(`âœ“ Eseguito da: ${committer}`);
console.log(`âœ“ Categorie aggiornate: ${assegnazioni.size}`);
console.log("");