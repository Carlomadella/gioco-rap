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

const branchCorrente = git(["branch", "--show-current"]);

if (branchCorrente !== "main") {
    console.error("");
    console.error("ERRORE: l'importazione storica può essere eseguita solo su main.");
    console.error(`Branch corrente: ${branchCorrente}`);
    console.error("");
    process.exit(1);
}

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
        const file = path.join(registroDir, cat.file);

        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, intestazione(cat.titolo), "utf8");
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

    if (/\.bak$/i.test(p)) return true;
    if (/\.patch$/i.test(p)) return true;

    // Markdown nella radice = documentazione/progettazione.
    if (!p.includes("/") && /\.md$/i.test(p)) return true;

    if (p === ".gitignore") return true;

    return false;
}

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

function inserisciVoce(fileCategoria, titoloCategoria, voce, marker) {
    const destinazione = path.join(registroDir, fileCategoria);

    let contenuto = fs.existsSync(destinazione)
        ? fs.readFileSync(destinazione, "utf8")
        : intestazione(titoloCategoria);

    // Se abbiamo già registrato questo commit, non lo duplichiamo.
    if (contenuto.includes(marker)) {
        return false;
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

    return true;
}

inizializza();

const EMPTY_TREE =
    "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

// IMPORTANTE:
// --first-parent segue la storia principale di main.
// In questo modo un feature branch mergiato viene contato una volta sola.
const commits = git([
    "rev-list",
    "--first-parent",
    "--reverse",
    "main"
])
    .split(/\r?\n/)
    .filter(Boolean);

let analizzati = 0;
let utili = 0;
let vociScritte = 0;

for (const commit of commits) {
    analizzati++;

    const parentLine = git([
        "rev-list",
        "--parents",
        "-n",
        "1",
        commit
    ]);

    const parts = parentLine.split(/\s+/);

    const isMerge = parts.length >= 3;

    const parentPrima =
        parts.length >= 2
            ? parts[1]
            : EMPTY_TREE;

    const shortHash = git([
        "rev-parse",
        "--short",
        commit
    ]);

    let diffRaw = "";

    try {
        diffRaw = git([
            "diff",
            "--name-status",
            "-M",
            parentPrima,
            commit
        ]);
    } catch {}

    const modifiche = diffRaw
        .split(/\r?\n/)
        .filter(Boolean)
        .map(riga => {
            const colonne = riga.split("\t");

            return {
                stato: colonne[0],
                file: colonne[colonne.length - 1],
                vecchioFile:
                    colonne[0].startsWith("R") &&
                    colonne.length >= 3
                        ? colonne[1]
                        : null
            };
        })
        .filter(x => !ignorare(x.file));

    // Commit composto solo da documentazione/file tecnici.
    if (modifiche.length === 0) {
        continue;
    }

    utili++;

    const autore = git([
        "show",
        "-s",
        "--format=%an",
        commit
    ]);

    const emailAutore = git([
        "show",
        "-s",
        "--format=%ae",
        commit
    ]);

    const committer = git([
        "show",
        "-s",
        "--format=%cn",
        commit
    ]);

    const emailCommitter = git([
        "show",
        "-s",
        "--format=%ce",
        commit
    ]);

    const dataISO = git([
        "show",
        "-s",
        "--format=%cI",
        commit
    ]);

    const subject = git([
        "show",
        "-s",
        "--format=%s",
        commit
    ]);

    const data = new Date(dataISO).toLocaleString("it-IT", {
        dateStyle: "short",
        timeStyle: "short"
    });

    const marker = isMerge
        ? `<!-- merge:${shortHash} -->`
        : `<!-- commit:${shortHash} -->`;

    let commitsMerge = "";

    if (isMerge) {
        const secondoParent = parts[2];

        try {
            commitsMerge = git([
                "log",
                "--format=- `%h` — %s — **%an**",
                `${parentPrima}..${secondoParent}`
            ]);
        } catch {}
    }

    const assegnazioni = new Map();

    for (const modifica of modifiche) {
        const trovate = categorie.filter(cat =>
            cat.match(modifica.file)
        );

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

        let dettagliAutore = `**Autore:** ${autore} (${emailAutore})`;

        if (
            committer !== autore ||
            emailCommitter !== emailAutore
        ) {
            dettagliAutore +=
                `  \n**Commit effettuato da:** ${committer} (${emailCommitter})`;
        }

        let bloccoMerge = "";

        if (isMerge && commitsMerge) {
            bloccoMerge = `
### Commit contenuti nel merge

${commitsMerge}
`;
        }

        const voce = `${marker}
## ${data} — ${subject}

**Tipo:** ${isMerge ? "Merge" : "Commit diretto su main"}  
${dettagliAutore}  
**Commit:** \`${shortHash}\`

${bloccoMerge}
### File di questa categoria

${listaFile}

**File interessati in questa categoria:** ${files.length}

---
`;

        const scritto = inserisciVoce(
            categoria.file,
            categoria.titolo,
            voce,
            marker
        );

        if (scritto) {
            vociScritte++;
        }
    }
}

console.log("");
console.log("==========================================");
console.log(" IMPORTAZIONE STORICO COMPLETATA");
console.log("==========================================");
console.log("");
console.log(`Commit di main analizzati: ${analizzati}`);
console.log(`Commit con modifiche reali: ${utili}`);
console.log(`Voci scritte nei registri: ${vociScritte}`);
console.log("");
console.log("✓ Nessuna idea/TODO importata");
console.log("✓ Nessun file implementazioni/ importato");
console.log("✓ Nessun .bak/.patch importato");
console.log("✓ Merge conteggiati una sola volta");
console.log("");