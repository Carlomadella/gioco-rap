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
        titolo: "01 — Mappa e città",
        match: p => /(mappa|map|citta|city|meteo|spostament|trasfert|viagg|quartier|location)/i.test(p)
    },
    {
        file: "02-interfaccia-e-telefono.md",
        titolo: "02 — Interfaccia e telefono",
        match: p => /(telefono|phone|traphone|actionbar|hud|interfaccia|schermata|menu|modal|\/ui\.|ui\.js)/i.test(p)
    },
    {
        file: "03-artista-e-avatar.md",
        titolo: "03 — Artista e avatar",
        match: p => /(avatar|creator|character.?creator|artista|capelli|hair|outfit|vestiti|aspetto|profilo.?artista)/i.test(p)
    },
    {
        file: "04-musica-e-suoni.md",
        titolo: "04 — Musica e suoni",
        match: p => /(musica|music|audio|sound|sfx|beat|brano|track|studio.?musicale|recording)/i.test(p)
    },
    {
        file: "05-carriera-e-tempo.md",
        titolo: "05 — Carriera e tempo",
        match: p => /(tempo|time|carriera|career|lavoro|job|lifestyle|calendario|energia|fame|hardening|bilanciamento)/i.test(p)
    },
    {
        file: "06-mondo-e-personaggi.md",
        titolo: "06 — Mondo e personaggi",
        match: p => /(mondo|npc|evento|eventi|strada|crimine|criminal|posto|negozio|personaggi|polizia)/i.test(p)
    },
    {
        file: "07-multiplayer-e-backend.md",
        titolo: "07 — Multiplayer e backend",
        match: p => /(^backend\/|multiplayer|server|socket|database|\/api\/|api\.|websocket)/i.test(p)
    },
    {
        file: "08-uscita-sugli-store.md",
        titolo: "08 — Uscita sugli store",
        match: p => /(steam|store|release|deploy|electron|manifest|installer|distribution|pubblicazione)/i.test(p)
    },
    {
        file: "09-grafica-e-asset.md",
        titolo: "09 — Grafica e asset",
        match: p => /(\/css\/|\/media\/|\/assets\/|grafica|texture|font|\.png$|\.jpg$|\.jpeg$|\.webp$|\.svg$|\.gif$)/i.test(p)
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
    console.log("✓ File del registro inizializzati.");
    process.exit(0);
}

const branchCorrente = git(["branch", "--show-current"]);

if (branchCorrente !== "main") {
    console.log("Registro non aggiornato: il merge non è avvenuto su main.");
    process.exit(0);
}

const rigaParents = git(["rev-list", "--parents", "-n", "1", "HEAD"]);
const parents = rigaParents.split(/\s+/);

if (parents.length < 3) {
    console.log("Registro non aggiornato: HEAD non è un merge commit.");
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
    console.log("✓ Merge composto solo da documentazione o file ignorati.");
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

            return `- \`${hash}\` — ${resto.join("\t")} — **${autore}**`;
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
        return `- **Rinominato:** \`${item.vecchioFile}\` → \`${item.file}\``;
    }

    return `- **Modificato:** \`${item.file}\``;
}

const assegnazioni = new Map();

for (const modifica of modifiche) {
    const trovate = categorie.filter(cat => cat.match(modifica.file));

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
## ${data} — ${branchSorgente} → main

**Merge effettuato da:** ${committer} (${email})  
**Merge commit:** \`${mergeHash}\`

### Cosa è entrato

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
console.log("✓ REGISTRO MODIFICHE AGGIORNATO");
console.log(`✓ Merge: ${branchSorgente} → main`);
console.log(`✓ Eseguito da: ${committer}`);
console.log(`✓ Categorie aggiornate: ${assegnazioni.size}`);
console.log("");