"use strict";

const fs = require("node:fs");
const fsp = fs.promises;
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");

const FRONTEND = path.resolve(__dirname, "..");
const DEFAULT_ROOT = path.join(
  FRONTEND,
  "media",
  "makehuman-editor-v1"
);

const MANIFEST_PATH = path.join(
  DEFAULT_ROOT,
  "makehuman-runtime-v29.manifest.json"
);

const RELEASE_BASE =
  process.env.ADF_MAKEHUMAN_RELEASE_BASE ||
  "https://github.com/Carlomadella/gioco-rap/releases/download/makehuman-v29";

function valoreArgomento(nome) {
  const i = process.argv.indexOf(nome);
  if (i === -1) return null;

  const valore = process.argv[i + 1];

  if (!valore || valore.startsWith("--")) {
    throw new Error(`Manca il valore per ${nome}`);
  }

  return valore;
}

const sourceDirArg = valoreArgomento("--source");
const destArg = valoreArgomento("--dest");
const force = process.argv.includes("--force");

const sourceDir = sourceDirArg
  ? path.resolve(sourceDirArg)
  : null;

const runtimeRoot = destArg
  ? path.resolve(destArg)
  : DEFAULT_ROOT;

const dataDir = path.join(runtimeRoot, "data");
const targetPath = path.join(
  dataDir,
  "targets",
  "targets.bin"
);

const markerPath = path.join(
  dataDir,
  ".adf-runtime-v29.json"
);

const cacheDir = path.join(
  runtimeRoot,
  ".runtime-cache-v29"
);

const archivePath = path.join(
  cacheDir,
  "makehuman-runtime-v29.tar.gz"
);

function esiste(p) {
  return fsp.access(p)
    .then(() => true)
    .catch(() => false);
}

async function hashFile(file) {
  const hash = crypto.createHash("sha256");
  const input = fs.createReadStream(file);

  for await (const chunk of input) {
    hash.update(chunk);
  }

  return hash.digest("hex");
}

async function verificaFile(file, bytes, sha256) {
  if (!(await esiste(file))) return false;

  const stat = await fsp.stat(file);

  if (stat.size !== Number(bytes)) {
    return false;
  }

  const hash = await hashFile(file);

  return hash.toLowerCase() === sha256.toLowerCase();
}

async function scriviMarker(manifest) {
  const marker = {
    schema: "adf.makehuman.runtime-install.v1",
    version: manifest.version,
    archiveSha256: manifest.archive.sha256,
    installedAt: new Date().toISOString()
  };

  await fsp.writeFile(
    markerPath,
    JSON.stringify(marker, null, 2) + "\n",
    "utf8"
  );
}

async function installazioneGiaValida(manifest) {
  if (force) return false;

  const proxies = path.join(dataDir, "proxies");
  const skins = path.join(dataDir, "skins");

  if (
    !(await esiste(proxies)) ||
    !(await esiste(skins))
  ) {
    return false;
  }

  const targetOk = await verificaFile(
    targetPath,
    manifest.verification.targetsBinBytes,
    manifest.verification.targetsBinSha256
  );

  if (!targetOk) return false;

  if (!(await esiste(markerPath))) {
    await scriviMarker(manifest);
  }

  return true;
}

async function scarica(url, destinazione) {
  const temporaneo = destinazione + ".tmp";

  await fsp.rm(temporaneo, {
    force: true
  });

  const risposta = await fetch(url);

  if (!risposta.ok) {
    throw new Error(
      `Download fallito ${risposta.status}: ${url}`
    );
  }

  if (!risposta.body) {
    throw new Error(
      `Risposta senza contenuto: ${url}`
    );
  }

  await pipeline(
    Readable.fromWeb(risposta.body),
    fs.createWriteStream(temporaneo)
  );

  await fsp.rename(
    temporaneo,
    destinazione
  );
}

async function preparaChunk(manifest) {
  await fsp.mkdir(cacheDir, {
    recursive: true
  });

  const files = [];

  for (
    let i = 0;
    i < manifest.chunks.length;
    i++
  ) {
    const chunk = manifest.chunks[i];

    const destinazione = path.join(
      cacheDir,
      chunk.file
    );

    process.stdout.write(
      `[${i + 1}/${manifest.chunks.length}] ${chunk.file} `
    );

    if (
      await verificaFile(
        destinazione,
        chunk.bytes,
        chunk.sha256
      )
    ) {
      console.log("già presente");
      files.push(destinazione);
      continue;
    }

    await fsp.rm(destinazione, {
      force: true
    });

    if (sourceDir) {
      const sorgente = path.join(
        sourceDir,
        chunk.file
      );

      if (!(await esiste(sorgente))) {
        throw new Error(
          `Chunk locale mancante: ${sorgente}`
        );
      }

      await fsp.copyFile(
        sorgente,
        destinazione
      );
    } else {
      const url =
        `${RELEASE_BASE}/${encodeURIComponent(chunk.file)}`;

      await scarica(
        url,
        destinazione
      );
    }

    const valido = await verificaFile(
      destinazione,
      chunk.bytes,
      chunk.sha256
    );

    if (!valido) {
      throw new Error(
        `Hash non valido: ${chunk.file}`
      );
    }

    console.log("OK");
    files.push(destinazione);
  }

  return files;
}

async function ricostruisciArchivio(files, manifest) {
  await fsp.rm(archivePath, {
    force: true
  });

  const output = fs.createWriteStream(
    archivePath
  );

  try {
    for (const file of files) {
      const input = fs.createReadStream(file);

      for await (const chunk of input) {
        if (!output.write(chunk)) {
          await new Promise(resolve =>
            output.once("drain", resolve)
          );
        }
      }
    }
  } finally {
    await new Promise((resolve, reject) => {
      output.end(error =>
        error ? reject(error) : resolve()
      );
    });
  }

  const valido = await verificaFile(
    archivePath,
    manifest.archive.bytes,
    manifest.archive.sha256
  );

  if (!valido) {
    throw new Error(
      "Archivio ricostruito diverso dal manifest."
    );
  }
}

function estraiArchivio(stage) {
  const result = spawnSync(
    "tar",
    [
      "-xzf",
      archivePath,
      "-C",
      stage
    ],
    {
      stdio: "inherit"
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `tar terminato con codice ${result.status}`
    );
  }
}

async function installa(manifest) {
  const stage = path.join(
    runtimeRoot,
    `.runtime-install-v29-${process.pid}`
  );

  const oldData = path.join(
    runtimeRoot,
    `.runtime-old-v29-${Date.now()}`
  );

  await fsp.rm(stage, {
    recursive: true,
    force: true
  });

  await fsp.mkdir(stage, {
    recursive: true
  });

  console.log("\nRicostruzione archivio...");
  const chunks = await preparaChunk(manifest);

  await ricostruisciArchivio(
    chunks,
    manifest
  );

  console.log("Archivio verificato.");

  console.log("\nEstrazione...");
  estraiArchivio(stage);

  const stagedData = path.join(
    stage,
    "data"
  );

  const stagedTarget = path.join(
    stagedData,
    "targets",
    "targets.bin"
  );

  const targetOk = await verificaFile(
    stagedTarget,
    manifest.verification.targetsBinBytes,
    manifest.verification.targetsBinSha256
  );

  if (!targetOk) {
    throw new Error(
      "targets.bin estratto non corrisponde all'originale."
    );
  }

  let vecchioSpostato = false;

  try {
    if (await esiste(dataDir)) {
      await fsp.rename(
        dataDir,
        oldData
      );

      vecchioSpostato = true;
    }

    await fsp.rename(
      stagedData,
      dataDir
    );

    await scriviMarker(manifest);

    if (vecchioSpostato) {
      await fsp.rm(oldData, {
        recursive: true,
        force: true
      });
    }
  } catch (errore) {
    if (
      vecchioSpostato &&
      !(await esiste(dataDir)) &&
      await esiste(oldData)
    ) {
      await fsp.rename(
        oldData,
        dataDir
      );
    }

    throw errore;
  } finally {
    await fsp.rm(stage, {
      recursive: true,
      force: true
    });
  }

  await fsp.rm(cacheDir, {
    recursive: true,
    force: true
  });

  console.log("\nMakeHuman runtime V29 installato.");
  console.log(`Destinazione: ${dataDir}`);
}

async function main() {
  if (!(await esiste(MANIFEST_PATH))) {
    throw new Error(
      `Manifest mancante: ${MANIFEST_PATH}`
    );
  }

  const manifest = JSON.parse(
    await fsp.readFile(
      MANIFEST_PATH,
      "utf8"
    )
  );

  if (
    await installazioneGiaValida(
      manifest
    )
  ) {
    console.log(
      "MakeHuman runtime V29 già installato e valido."
    );

    console.log(
      "Nessun download necessario."
    );

    return;
  }

  console.log(
    `MakeHuman runtime V${manifest.version}`
  );

  console.log(
    sourceDir
      ? `Sorgente locale: ${sourceDir}`
      : `Release: ${RELEASE_BASE}`
  );

  await installa(manifest);
}

main().catch(error => {
  console.error(
    "\nERRORE SETUP MAKEHUMAN:"
  );

  console.error(
    error && error.stack
      ? error.stack
      : error
  );

  process.exitCode = 1;
});
