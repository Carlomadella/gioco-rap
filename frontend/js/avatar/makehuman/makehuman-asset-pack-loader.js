"use strict";

/*
  V27 — MakeHuman asset-pack loader.

  Golden rule:
  these are the ORIGINAL checked MakeHuman Community asset packs.
  The loader only does what MPFB does when installing an asset-pack ZIP:
  unpack files and expose the native .mhclo/.obj/.mhmat resources.

  No geometry conversion, no hand-authored fitting, no replacement assets.
*/

const PACKS = Object.freeze({
  bodyparts05: Object.freeze({
    id: "bodyparts05",
    license: "CC0",
    urls: Object.freeze([
      "https://files2.makehumancommunity.org/asset_packs/bodyparts05/bodyparts05_cc0.zip",
      "https://files.makehumancommunity.org/asset_packs/bodyparts05/bodyparts05_cc0.zip"
    ])
  }),

  jewelry01: Object.freeze({
    id: "jewelry01",
    license: "CC0",
    urls: Object.freeze([
      "https://files2.makehumancommunity.org/asset_packs/jewelry01/jewelry01_cc0.zip",
      "https://files.makehumancommunity.org/asset_packs/jewelry01/jewelry01_cc0.zip"
    ])
  })
});

function u16(view, offset) {
  return view.getUint16(offset, true);
}

function u32(view, offset) {
  return view.getUint32(offset, true);
}

function normalizePath(value) {
  const parts = [];

  for (const raw of String(value || "").replace(/\\/g, "/").split("/")) {
    const part = raw.trim();

    if (!part || part === ".") continue;

    if (part === "..") {
      parts.pop();
      continue;
    }

    parts.push(part);
  }

  return parts.join("/");
}

function dirname(path) {
  const p = normalizePath(path);
  const i = p.lastIndexOf("/");
  return i >= 0 ? p.slice(0, i) : "";
}

function basename(path) {
  const p = normalizePath(path);
  const i = p.lastIndexOf("/");
  return i >= 0 ? p.slice(i + 1) : p;
}

function resolveRelative(baseFile, relative) {
  const rel = String(relative || "").trim();

  if (!rel) return null;

  if (/^https?:\/\//i.test(rel)) {
    return rel;
  }

  return normalizePath(
    `${dirname(baseFile)}/${rel}`
  );
}

function mimeFor(path) {
  const p = String(path || "").toLowerCase();

  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  if (p.endsWith(".webp")) return "image/webp";
  if (p.endsWith(".obj")) return "text/plain";
  if (p.endsWith(".mhclo")) return "text/plain";
  if (p.endsWith(".mhmat")) return "text/plain";
  if (p.endsWith(".json")) return "application/json";

  return "application/octet-stream";
}

async function inflateRaw(bytes) {
  if (typeof DecompressionStream !== "function") {
    throw new Error(
      "Questo browser non espone DecompressionStream: impossibile aprire il pack ZIP MakeHuman."
    );
  }

  const stream =
    new Blob([bytes])
      .stream()
      .pipeThrough(
        new DecompressionStream("deflate-raw")
      );

  const out =
    await new Response(stream).arrayBuffer();

  return new Uint8Array(out);
}

class ZipArchive {
  constructor(arrayBuffer) {
    this.bytes =
      new Uint8Array(arrayBuffer);

    this.view =
      new DataView(
        this.bytes.buffer,
        this.bytes.byteOffset,
        this.bytes.byteLength
      );

    this.entries =
      new Map();

    this._cache =
      new Map();

    this._parseCentralDirectory();
  }

  _findEocd() {
    const signature = 0x06054b50;

    const min =
      Math.max(
        0,
        this.bytes.length - 65557
      );

    for (
      let offset = this.bytes.length - 22;
      offset >= min;
      offset--
    ) {
      if (u32(this.view, offset) === signature) {
        return offset;
      }
    }

    throw new Error(
      "ZIP MakeHuman: End Of Central Directory non trovato."
    );
  }

  _parseCentralDirectory() {
    const eocd =
      this._findEocd();

    const totalEntries =
      u16(this.view, eocd + 10);

    const centralOffset =
      u32(this.view, eocd + 16);

    let offset =
      centralOffset;

    const decoder =
      new TextDecoder("utf-8");

    for (let i = 0; i < totalEntries; i++) {
      if (
        u32(this.view, offset) !== 0x02014b50
      ) {
        throw new Error(
          `ZIP MakeHuman: central directory corrotta all'entry ${i}.`
        );
      }

      const flags =
        u16(this.view, offset + 8);

      const method =
        u16(this.view, offset + 10);

      const compressedSize =
        u32(this.view, offset + 20);

      const uncompressedSize =
        u32(this.view, offset + 24);

      const fileNameLength =
        u16(this.view, offset + 28);

      const extraLength =
        u16(this.view, offset + 30);

      const commentLength =
        u16(this.view, offset + 32);

      const localHeaderOffset =
        u32(this.view, offset + 42);

      const nameBytes =
        this.bytes.subarray(
          offset + 46,
          offset + 46 + fileNameLength
        );

      const name =
        normalizePath(
          decoder.decode(nameBytes)
        );

      if (
        name &&
        !name.endsWith("/")
      ) {
        this.entries.set(name, {
          name,
          flags,
          method,
          compressedSize,
          uncompressedSize,
          localHeaderOffset
        });
      }

      offset +=
        46 +
        fileNameLength +
        extraLength +
        commentLength;
    }

    if (!this.entries.size) {
      throw new Error(
        "ZIP MakeHuman privo di file."
      );
    }
  }

  list() {
    return [...this.entries.keys()];
  }

  has(path) {
    return this.entries.has(
      normalizePath(path)
    );
  }

  async bytesFor(path) {
    const key =
      normalizePath(path);

    if (this._cache.has(key)) {
      return this._cache.get(key);
    }

    const entry =
      this.entries.get(key);

    if (!entry) {
      throw new Error(
        `File non presente nel pack MakeHuman: ${key}`
      );
    }

    const off =
      entry.localHeaderOffset;

    if (
      u32(this.view, off) !== 0x04034b50
    ) {
      throw new Error(
        `ZIP MakeHuman: local header invalido per ${key}`
      );
    }

    const nameLength =
      u16(this.view, off + 26);

    const extraLength =
      u16(this.view, off + 28);

    const start =
      off + 30 + nameLength + extraLength;

    const compressed =
      this.bytes.subarray(
        start,
        start + entry.compressedSize
      );

    let out;

    if (entry.method === 0) {
      out =
        new Uint8Array(compressed);
    } else if (entry.method === 8) {
      out =
        await inflateRaw(compressed);
    } else {
      throw new Error(
        `ZIP MakeHuman: metodo compressione ${entry.method} non supportato (${key}).`
      );
    }

    if (
      entry.uncompressedSize &&
      out.length !== entry.uncompressedSize
    ) {
      throw new Error(
        `ZIP MakeHuman: dimensione estratta non coerente per ${key}.`
      );
    }

    this._cache.set(key, out);

    return out;
  }

  async textFor(path) {
    const bytes =
      await this.bytesFor(path);

    return new TextDecoder("utf-8")
      .decode(bytes);
  }
}

export class MakeHumanPackResources {
  constructor({
    packId,
    license,
    sourceUrl,
    arrayBuffer
  }) {
    this.packId =
      packId;

    this.license =
      license;

    this.sourceUrl =
      sourceUrl;

    this.archive =
      new ZipArchive(arrayBuffer);

    this.objectUrls =
      new Map();

    this.assetCache =
      new Map();
  }

  list() {
    return this.archive.list();
  }

  has(path) {
    return this.archive.has(path);
  }

  async text(path) {
    return this.archive.textFor(path);
  }

  async objectUrl(path) {
    const key =
      normalizePath(path);

    if (this.objectUrls.has(key)) {
      return this.objectUrls.get(key);
    }

    const bytes =
      await this.archive.bytesFor(key);

    const url =
      URL.createObjectURL(
        new Blob(
          [bytes],
          { type: mimeFor(key) }
        )
      );

    this.objectUrls.set(key, url);

    return url;
  }

  resolve(baseFile, relative) {
    return resolveRelative(
      baseFile,
      relative
    );
  }

  _findByBasename(fileName) {
    const target =
      String(fileName || "").toLowerCase();

    return (
      this.list().find(
        path =>
          basename(path).toLowerCase() === target
      ) || null
    );
  }

  _resolveExisting(baseFile, relative) {
    const first =
      this.resolve(
        baseFile,
        relative
      );

    if (
      first &&
      this.has(first)
    ) {
      return first;
    }

    const byBase =
      this._findByBasename(
        basename(relative)
      );

    return byBase;
  }

  async getMhcloAsset(assetId) {
    const normalizedId =
      String(assetId || "")
        .trim()
        .toLowerCase();

    if (!normalizedId) {
      throw new Error(
        "Asset MakeHuman senza id."
      );
    }

    if (this.assetCache.has(normalizedId)) {
      return this.assetCache.get(normalizedId);
    }

    const candidates =
      this.list()
        .filter(path =>
          path.toLowerCase().endsWith(".mhclo")
        );

    let mhcloEntry =
      candidates.find(path => {
        const p =
          path.toLowerCase();

        const parent =
          dirname(p);

        return (
          basename(parent) === normalizedId ||
          basename(path)
            .replace(/\.mhclo$/i, "") === normalizedId
        );
      });

    if (!mhcloEntry) {
      mhcloEntry =
        candidates.find(path =>
          path.toLowerCase()
            .includes(`/${normalizedId}/`)
        );
    }

    if (!mhcloEntry) {
      throw new Error(
        `${assetId}: .mhclo non trovato nel pack ${this.packId}.`
      );
    }

    const mhcloText =
      await this.text(mhcloEntry);

    let objDirective = null;
    let materialDirective = null;

    for (const raw of mhcloText.split(/\r?\n/)) {
      const line =
        raw.trim();

      if (!line || line.startsWith("#")) continue;

      const p =
        line.split(/\s+/);

      if (p[0] === "obj_file" && p[1]) {
        objDirective = p.slice(1).join(" ");
      }

      if (p[0] === "material" && p[1]) {
        materialDirective = p.slice(1).join(" ");
      }
    }

    let objEntry =
      objDirective
        ? this._resolveExisting(
            mhcloEntry,
            objDirective
          )
        : null;

    if (!objEntry) {
      const dir =
        dirname(mhcloEntry);

      objEntry =
        this.list().find(
          path =>
            dirname(path) === dir &&
            path.toLowerCase().endsWith(".obj")
        ) || null;
    }

    if (!objEntry) {
      throw new Error(
        `${assetId}: OBJ indicato dal MHCLO non trovato.`
      );
    }

    let mhmatEntry =
      materialDirective
        ? this._resolveExisting(
            mhcloEntry,
            materialDirective.toLowerCase().endsWith(".mhmat")
              ? materialDirective
              : `${materialDirective}.mhmat`
          )
        : null;

    if (!mhmatEntry) {
      const dir =
        dirname(mhcloEntry);

      mhmatEntry =
        this.list().find(
          path =>
            dirname(path) === dir &&
            path.toLowerCase().endsWith(".mhmat")
        ) || null;
    }

    const asset = {
      id: assetId,
      packId: this.packId,
      license: this.license,
      mhcloEntry,
      mhcloText,
      objEntry,
      mhmatEntry,
      objUrl:
        await this.objectUrl(objEntry),
      proxyUrl:
        await this.objectUrl(mhcloEntry)
    };

    this.assetCache.set(
      normalizedId,
      asset
    );

    return asset;
  }

  getDiagnostics() {
    return {
      packId:
        this.packId,
      license:
        this.license,
      sourceUrl:
        this.sourceUrl,
      files:
        this.archive.entries.size,
      objectUrls:
        this.objectUrls.size,
      cachedAssets:
        this.assetCache.size
    };
  }

  dispose() {
    for (const url of this.objectUrls.values()) {
      URL.revokeObjectURL(url);
    }

    this.objectUrls.clear();
    this.assetCache.clear();
  }
}

export class MakeHumanAssetPackLoader {
  constructor() {
    this.cache =
      new Map();
  }

  async load(packId) {
    const def =
      PACKS[packId];

    if (!def) {
      throw new Error(
        `Pack MakeHuman sconosciuto: ${packId}`
      );
    }

    if (this.cache.has(packId)) {
      return this.cache.get(packId);
    }

    let lastError = null;

    for (const url of def.urls) {
      try {
        const response =
          await fetch(url, {
            mode: "cors",
            cache: "force-cache"
          });

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const arrayBuffer =
          await response.arrayBuffer();

        const pack =
          new MakeHumanPackResources({
            packId,
            license: def.license,
            sourceUrl: url,
            arrayBuffer
          });

        this.cache.set(
          packId,
          pack
        );

        return pack;
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(
      `${packId}: download pack MakeHuman fallito su entrambi i mirror. ` +
      `${lastError?.message || String(lastError)}`
    );
  }

  getDiagnostics() {
    return {
      loadedPacks:
        [...this.cache.values()]
          .map(pack => pack.getDiagnostics())
    };
  }

  dispose() {
    for (const pack of this.cache.values()) {
      pack.dispose();
    }

    this.cache.clear();
  }
}

export {
  PACKS,
  normalizePath,
  dirname,
  basename
};
