"use strict";
// Inventory/copy only. No audio decoding, conversion, family inference or training.
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { csv } = require("./manifest-csv");
const SCHEMA = "fame-owned-beats-workspace-v1";
const roles = ["drums", "lowend", "tonal", "full"];
function hash(file) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash("sha256"), stream = fs.createReadStream(file);
    stream.on("data", chunk => h.update(chunk));
    stream.on("error", reject); stream.on("end", () => resolve(h.digest("hex")));
  });
}
function within(parent, child) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith(".." + path.sep) && rel !== ".." && !path.isAbsolute(rel));
}
function resolved(file) {
  if (fs.existsSync(file)) return fs.realpathSync(file);
  const parent = path.dirname(file);
  if (parent === file) throw new Error("Cannot resolve workspace path");
  return path.join(resolved(parent), path.basename(file));
}
function assertOutsideGit(dir) {
  for (let current = dir;; current = path.dirname(current)) {
    if (fs.existsSync(path.join(current, ".git"))) throw new Error("Workspace must be outside a Git repository");
    if (current === path.dirname(current)) break;
  }
}
function scan(dir, prefix = "") {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Symlink not supported in source inventory: ${rel}`);
    if (entry.isDirectory()) files.push(...scan(path.join(dir, entry.name), rel));
    else if (entry.isFile() && /\.(wav|mp3)$/i.test(entry.name)) files.push(rel);
  }
  return files;
}
function validate(m) {
  if (m.schema !== SCHEMA || m.version !== 1 || !Array.isArray(m.records)) throw new Error("Unsupported manifest schema");
  const ids = new Set(), hashes = new Set();
  const familySplits = new Map();
  for (const r of m.records) {
    if (!/^FAME\d{6,}$/.test(r.sourceRecordId) || !/^[a-f0-9]{64}$/.test(r.sha256)
      || ids.has(r.sourceRecordId) || hashes.has(r.sha256)
      || r.sourceAssetId !== `sha256:${r.sha256}` || !Array.isArray(r.sourcePaths)
      || r.sourcePaths.some(p => typeof p !== "string" || p.split(/[\\/]/).includes("..") || path.isAbsolute(p))
      || !/^sources\/[a-f0-9]{64}\/source\.(wav|mp3)$/.test(r.localPath)
      || r.localPath.split("/")[1] !== r.sha256 || !r.roles) throw new Error("Invalid or duplicate manifest record");
    ids.add(r.sourceRecordId); hashes.add(r.sha256);
    if (r.compositionFamilyId && r.split) {
      const priorSplit = familySplits.get(r.compositionFamilyId);
      if (priorSplit && priorSplit !== r.split) {
        throw new Error(
          `Composition family crosses splits: ${r.compositionFamilyId} (${priorSplit} vs ${r.split})`
        );
      }
      familySplits.set(r.compositionFamilyId, r.split);
    }
  }
  return m;
}
function atomic(file, content) {
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  try { fs.writeFileSync(temp, content, { flag: "wx" }); fs.renameSync(temp, file); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}
async function bootstrap(sourceRoot, workspaceRoot, apply = false) {
  const source = fs.realpathSync(path.resolve(sourceRoot));
  const workspace = resolved(path.resolve(workspaceRoot));
  if (within(source, workspace) || within(workspace, source)) throw new Error("Source and workspace must be disjoint");
  assertOutsideGit(workspace);
  const manifestPath = path.join(workspace, "manifest", "owned-beats-manifest.json");
  let lockFd, lock;
  if (apply) {
    fs.mkdirSync(workspace, { recursive: true });
    lock = path.join(workspace, "bootstrap.lock");
    lockFd = fs.openSync(lock, "wx"); // no automatic removal of another/stale lock
    fs.writeFileSync(lockFd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
  }
  try {
    const m = fs.existsSync(manifestPath) ? validate(JSON.parse(fs.readFileSync(manifestPath,"utf8")))
      : { schema: SCHEMA, version: 1, sourceCollectionId: "fame-owned-beats-v1", records: [] };
    const files = scan(source), byHash = new Map(m.records.map(r=>[r.sha256,r]));
    let next = Math.max(0,...m.records.map(r=>Number(r.sourceRecordId.slice(4)))) + 1;
    const oldPaths = new Map(m.records.flatMap(r=>r.sourcePaths.map(p=>[p,r.sourceAssetId])));
    const copies = [], changes = [];
    for (const r of m.records) r.presentInScan = false;
    for (const rel of files) {
      const input = path.join(source, rel), sha = await hash(input);
      let r = byHash.get(sha);
      if (!r) {
        const extension = path.extname(rel).toLowerCase();
        r = { sourceRecordId: `FAME${String(next++).padStart(6,"0")}`, sourceAssetId: `sha256:${sha}`,
          compositionFamilyId: null, familyStatus: "NEEDS_REVIEW", sha256: sha,
          bytes: fs.statSync(input).size, format: extension.slice(1), sourcePaths: [],
          localPath: `sources/${sha}/source${extension}`, rightsStatus: "OWNER_DECLARED",
          metadataStatus: "NOT_ANALYZED", nativeExports: "UNKNOWN", taskAdmissibility: "candidate",
          roles: Object.fromEntries(roles.map(k=>[k,{ processing:"PENDING", review:"NOT_PROCESSED", artifactId:null }])),
          qa: {}, notes: [], relatedPriorAssets: [] };
        m.records.push(r); byHash.set(sha,r); changes.push({ action:"new-asset", id:r.sourceRecordId });
      }
      if (oldPaths.has(rel) && oldPaths.get(rel) !== r.sourceAssetId) {
        r.relatedPriorAssets ||= [];
        if (!r.relatedPriorAssets.includes(oldPaths.get(rel))) r.relatedPriorAssets.push(oldPaths.get(rel));
        changes.push({ action:"changed-source-path", path:rel, id:r.sourceRecordId });
      }
      if (!r.sourcePaths.includes(rel)) r.sourcePaths.push(rel);
      r.sourcePaths.sort(); r.presentInScan = true;
      copies.push({ input, record:r });
    }
    validate(m);
    const result = { mode:apply ? "APPLIED":"PREVIEW", files:files.length, uniqueAssets:m.records.length,
      activeAssets:m.records.filter(r=>r.presentInScan).length, changes, manifest:manifestPath, converted:0 };
    if (!apply) return result;
    for (const folder of ["manifest", "sources", "runs", "exports"]) fs.mkdirSync(path.join(workspace,folder),{recursive:true});
    // Reserve estimate before copying. Existing outputs are always hash-checked below.
    const unique = [...new Map(copies.map(c=>[c.record.sha256,c])).values()];
    const required = unique.filter(c=>!fs.existsSync(path.join(workspace,c.record.localPath))).reduce((sum,c)=>sum+c.record.bytes,0);
    if (fs.statfsSync) {
      const stat = fs.statfsSync(workspace);
      if (stat.bavail * stat.bsize < required + 1024*1024) throw new Error("Insufficient free space for source copies");
    }
    for (const {input,record:r} of unique) {
      const output = path.join(workspace,r.localPath);
      fs.mkdirSync(path.dirname(output),{recursive:true});
      if (!within(workspace,fs.realpathSync(path.dirname(output)))) throw new Error("Output path escapes workspace");
      if (fs.existsSync(output)) {
        if (fs.lstatSync(output).isSymbolicLink() || await hash(output) !== r.sha256) throw new Error(`Existing source copy mismatch: ${r.sourceRecordId}`);
      } else {
        const temp = `${output}.copying`;
        // A previous interrupted copy is expendable; verified source originals are untouched.
        if (fs.existsSync(temp)) fs.unlinkSync(temp);
        fs.copyFileSync(input,temp,fs.constants.COPYFILE_EXCL);
        if (await hash(temp) !== r.sha256) throw new Error(`Source changed during copy: ${r.sourceRecordId}`);
        fs.renameSync(temp,output);
      }
    }
    atomic(manifestPath,JSON.stringify(m,null,2)+"\n");
    atomic(path.join(workspace,"manifest","owned-beats-manifest.csv"),csv(m));
    atomic(path.join(workspace,"manifest","last-bootstrap-report.json"),JSON.stringify(result,null,2)+"\n");
    return result;
  } finally {
    if (lockFd !== undefined) { fs.closeSync(lockFd); fs.unlinkSync(lock); }
  }
}
async function main(args=process.argv.slice(2)) {
  if (args.length < 2 || args.length > 3 || (args[2] && args[2] !== "--apply")) throw new Error("Usage: node bootstrap.js <source-folder> <workspace-folder> [--apply]; default PREVIEW");
  console.log(JSON.stringify(await bootstrap(args[0],args[1],args[2] === "--apply"),null,2));
}
if (require.main === module) main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={bootstrap,validate,hash};
