#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(process.env.ADF_ROOT || path.join(__dirname, '..'));
const IMPL_DIR = path.join(ROOT, 'implementazioni');
const INBOX = path.join(IMPL_DIR, 'implementazioni.md');
const LEGACY_INDEX = path.join(IMPL_DIR, 'README.md');
const AUTO_DIR = path.join(IMPL_DIR, 'auto');
const TASKS_DIR = path.join(AUTO_DIR, 'tasks');
const AUTO_README = path.join(AUTO_DIR, 'README.md');
const ROADMAP = path.join(ROOT, 'ROADMAP.md');

const BEGIN = '<!-- ADF-AUTO-INBOX:BEGIN -->';
const END = '<!-- ADF-AUTO-INBOX:END -->';
const SCHEMA_VERSION = 5;
const CRITERION_STATUS = new Set(['pending', 'satisfied', 'needs_validation', 'blocked']);
const VERIFICATION = new Set(['automatic', 'code_audit', 'playtest']);
const VERIFIED_STATUS = new Set(['planned', 'in_progress', 'needs_validation', 'complete', 'blocked']);
const AUDIT_STATE = new Set(['not_audited', 'audited']);
const INTAKE_STATE = new Set(['canonical', 'pending', 'unique', 'duplicate', 'overlap', 'already_implemented']);
const PLAN_MODE = new Set(['none', 'auto', 'user_defined']);
const PLAN_STATUS = new Set(['not_applicable', 'draft', 'ready', 'gap_found', 'conflict']);
const PLAN_STEP_STATUS = new Set(['planned', 'in_progress', 'needs_validation', 'complete', 'blocked']);
const ROADMAP_SCOPE = new Set(['none', 'official_gap', 'major_proposal']);

function die(message) {
  console.error(`[roadmap-auto] ${message}`);
  process.exit(1);
}
function read(file) { return fs.readFileSync(file, 'utf8'); }
function writeIfChanged(file, content) {
  const normalized = content.endsWith('\n') ? content : `${content}\n`;
  let before = null;
  try { before = read(file); } catch {}
  if (before === normalized) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, normalized, 'utf8');
  return true;
}
function normalizeText(text) {
  return String(text || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n\s*/g, '\n').trim();
}
function shortHash(text) {
  return crypto.createHash('sha256').update(normalizeText(text), 'utf8').digest('hex').slice(0, 12);
}
function comparisonKey(text) {
  return normalizeText(text)
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function stableId(kind, sourceFile, title) {
  return `ADF-${kind}-${shortHash(`${sourceFile}\n${title}`).toUpperCase()}`;
}
function emptyPlan() {
  return { mode: 'none', status: 'not_applicable', summary: '', steps: [], gaps: [], notes: [] };
}
function detectUserDefinedPlan(text) {
  const steps = [];
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match = line.match(/^(?:\d+[.)]\s*)?\*{0,2}(V\d+)\*{0,2}\s*(?:[—–:\-]\s*)?(.+)$/i);
    if (!match) continue;
    const id = match[1].toUpperCase();
    const title = match[2].replace(/\*+/g, '').trim();
    if (!title || steps.some(s => s.id === id)) continue;
    steps.push({ id, title, objective: '', depends_on: [], systems: [], watch_paths: [], acceptance_criteria: [], status: 'planned' });
  }
  if (steps.length < 2) return emptyPlan();
  return {
    mode: 'user_defined',
    status: 'draft',
    summary: 'Piano tecnico fornito dall’utente: preservare numerazione, ordine e perimetro; eventuali buchi vanno segnalati, non aggiunti automaticamente.',
    steps,
    gaps: [],
    notes: []
  };
}
function normalizeLegacyStatus(raw) {
  const v = String(raw || '').toLowerCase().replace(/\*+/g, '').trim();
  if (v === 'fatto' || v.startsWith('fatto ')) return 'fatto';
  if (v.startsWith('in parte')) return 'in_parte';
  if (v.startsWith('da fare')) return 'da_fare';
  if (v.startsWith('risposto')) return 'risposto';
  return v || 'sconosciuto';
}
function splitMarkdownRow(line) {
  const cells = [];
  let current = '';
  let escaped = false;
  for (let i = 1; i < line.length - 1; i++) {
    const ch = line[i];
    if (escaped) { current += ch; escaped = false; continue; }
    if (ch === '\\') { current += ch; escaped = true; continue; }
    if (ch === '|') { cells.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}
function resolveLegacySource(link) {
  const raw = String(link || '').replace(/\\/g, '/').replace(/^\.\/+/, '');
  const repoRelative = path.posix.normalize(path.posix.join('implementazioni', raw));
  if (!repoRelative.endsWith('.md')) return null;
  if (repoRelative.startsWith('../') || path.posix.isAbsolute(repoRelative)) return null;
  if (!(repoRelative.startsWith('implementazioni/') || repoRelative.startsWith('documentazione/'))) return null;
  if (!fs.existsSync(path.join(ROOT, ...repoRelative.split('/')))) return null;
  return repoRelative;
}
function categoryFromSource(file) {
  if (file.startsWith('implementazioni/')) return path.posix.basename(file).replace(/\.md$/i, '');
  const dir = path.posix.dirname(file);
  return path.posix.basename(dir) || path.posix.basename(file).replace(/\.md$/i, '');
}
function legacyHeadlineTotal() {
  const match = read(LEGACY_INDEX).match(/(\d+)\s+voci in tutto/i);
  return match ? Number(match[1]) : null;
}
function parseLegacyIndex() {
  const text = read(LEGACY_INDEX);
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('|')) continue;
    const cols = splitMarkdownRow(line);
    if (cols.length < 4) continue;
    const point = cols[0].replace(/\*+/g, '').trim();
    const title = cols[1].replace(/\\\|/g, '|').trim();
    const statusRaw = cols[2].trim();
    const where = cols[3].trim();
    if (!title || title === 'punto' || /^-+$/.test(title)) continue;
    const match = where.match(/\]\(([^)]+\.md)\)/i);
    if (!match) continue;
    const sourceFile = resolveLegacySource(match[1]);
    if (!sourceFile) continue;
    rows.push({
      point,
      title,
      source_status: normalizeLegacyStatus(statusRaw),
      source_status_raw: statusRaw.replace(/\*+/g, '').trim(),
      source_file: sourceFile,
      category: categoryFromSource(sourceFile)
    });
  }
  return rows;
}
function legacyTaskSeed(row) {
  const id = stableId('LEG', row.source_file, row.title);
  return {
    schema_version: SCHEMA_VERSION,
    id,
    origin: 'legacy',
    title: row.title,
    category: row.category,
    source: {
      point: row.point,
      text: row.title,
      file: row.source_file,
      source_status: row.source_status,
      source_status_raw: row.source_status_raw
    },
    audit_state: 'not_audited',
    verified_status: null,
    intake_state: 'canonical',
    related_task_ids: [],
    intake_note: '',
    roadmap_scope: 'none',
    roadmap_impact: 'none',
    roadmap_note: '',
    plan: emptyPlan(),
    current_state: [],
    systems: [],
    watch_paths: [],
    acceptance_criteria: [],
    risks: [],
    notes: ['Importata automaticamente dal lavoro già presente in implementazioni/README.md. Nessun contenuto storico è stato riscritto.']
  };
}
function parseInbox() {
  const content = read(INBOX);
  const start = content.indexOf(BEGIN);
  const stop = content.indexOf(END);
  if (start === -1 || stop === -1 || stop <= start) return { content, items: [], lines: [], start: -1, stop: -1 };
  const before = content.slice(0, start + BEGIN.length);
  const body = content.slice(start + BEGIN.length, stop);
  const after = content.slice(stop);
  const lines = body.replace(/^\r?\n/, '').replace(/\r/g, '').split('\n');
  const items = [];
  let current = null;
  lines.forEach((line, index) => {
    const match = line.match(/^(\s*)-\s*\[([ xX])\]\s+(.+?)\s*$/);
    if (match) {
      if (current) items.push(current);
      current = { checked: match[2].toLowerCase() === 'x', firstLineIndex: index, indent: match[1], firstLine: match[3], continuation: [] };
      return;
    }
    if (current && (/^\s{2,}\S/.test(line) || /^\s*$/.test(line))) current.continuation.push(line);
    else if (current) { items.push(current); current = null; }
  });
  if (current) items.push(current);
  for (const item of items) {
    const cleanFirst = item.firstLine.replace(/\s*<!--\s*ADF-TASK:[^>]+-->\s*$/i, '').trim();
    const continuation = item.continuation.map(line => line.replace(/^\s{2,}/, '')).join('\n').trim();
    item.text = normalizeText([cleanFirst, continuation].filter(Boolean).join('\n'));
    item.id = stableId('NEW', 'implementazioni/implementazioni.md', item.text);
  }
  return { content, before, body, after, lines, items, start, stop };
}
function inboxTaskSeed(item) {
  return {
    schema_version: SCHEMA_VERSION,
    id: item.id,
    origin: 'inbox',
    title: item.text.split('\n')[0].slice(0, 140),
    category: 'da_classificare',
    source: { point: '', text: item.text, file: 'implementazioni/implementazioni.md', source_status: 'nuova', source_status_raw: 'nuova' },
    audit_state: 'not_audited',
    verified_status: null,
    intake_state: 'pending',
    related_task_ids: [],
    intake_note: '',
    roadmap_scope: 'none',
    roadmap_impact: 'none',
    roadmap_note: '',
    plan: detectUserDefinedPlan(item.text),
    current_state: [], systems: [], watch_paths: [], acceptance_criteria: [], risks: [], notes: []
  };
}
function listTaskFiles() {
  if (!fs.existsSync(TASKS_DIR)) return [];
  return fs.readdirSync(TASKS_DIR).filter(n => n.endsWith('.json')).sort().map(n => path.join(TASKS_DIR, n));
}
function readTask(file) {
  try { return JSON.parse(read(file)); }
  catch (error) { throw new Error(`${path.relative(ROOT, file)} non contiene JSON valido: ${error.message}`); }
}
function validateTask(task, file = '(task)') {
  const errors = [];
  const rel = path.relative(ROOT, file);
  const reqString = key => { if (typeof task[key] !== 'string' || !task[key].trim()) errors.push(`${key} mancante`); };
  if (![2,3,4,SCHEMA_VERSION].includes(task.schema_version)) errors.push(`schema_version deve essere 2, 3, 4 o ${SCHEMA_VERSION}`);
  reqString('id'); reqString('origin'); reqString('title'); reqString('category');
  if (!/^ADF-(LEG|NEW)-[A-F0-9]{12}$/.test(task.id || '')) errors.push('id non valido');
  if (!task.source || typeof task.source !== 'object') errors.push('source mancante');
  else {
    if (typeof task.source.text !== 'string' || !task.source.text.trim()) errors.push('source.text mancante');
    if (typeof task.source.file !== 'string' || !task.source.file.trim()) errors.push('source.file mancante');
  }
  if (!AUDIT_STATE.has(task.audit_state)) errors.push(`audit_state non valido: ${task.audit_state}`);
  if (task.verified_status !== null && !VERIFIED_STATUS.has(task.verified_status)) errors.push(`verified_status non valido: ${task.verified_status}`);
  if (!INTAKE_STATE.has(task.intake_state)) errors.push(`intake_state non valido: ${task.intake_state}`);
  if (!ROADMAP_SCOPE.has(task.roadmap_scope)) errors.push(`roadmap_scope non valido: ${task.roadmap_scope}`);
  if (!task.plan || typeof task.plan !== 'object') errors.push('plan mancante');
  else {
    if (!PLAN_MODE.has(task.plan.mode)) errors.push(`plan.mode non valido: ${task.plan.mode}`);
    if (!PLAN_STATUS.has(task.plan.status)) errors.push(`plan.status non valido: ${task.plan.status}`);
    if (typeof task.plan.summary !== 'string') errors.push('plan.summary deve essere stringa');
    if (!Array.isArray(task.plan.steps)) errors.push('plan.steps deve essere un array');
    if (!Array.isArray(task.plan.gaps)) errors.push('plan.gaps deve essere un array');
    if (!Array.isArray(task.plan.notes)) errors.push('plan.notes deve essere un array');
    const stepIds = new Set();
    for (let i = 0; i < (task.plan.steps || []).length; i++) {
      const step = task.plan.steps[i];
      const pp = `plan.steps[${i}]`;
      if (!step || typeof step !== 'object') { errors.push(`${pp} non valido`); continue; }
      if (!/^V\d+$/.test(step.id || '')) errors.push(`${pp}.id deve essere V1, V2...`);
      if (stepIds.has(step.id)) errors.push(`${pp}.id duplicato`);
      stepIds.add(step.id);
      if (typeof step.title !== 'string' || !step.title.trim()) errors.push(`${pp}.title mancante`);
      if (typeof step.objective !== 'string') errors.push(`${pp}.objective deve essere stringa`);
      for (const key of ['depends_on','systems','watch_paths','acceptance_criteria']) if (!Array.isArray(step[key])) errors.push(`${pp}.${key} deve essere array`);
      if (!PLAN_STEP_STATUS.has(step.status)) errors.push(`${pp}.status non valido: ${step.status}`);
    }
    if (task.plan.mode === 'none' && task.plan.steps.length) errors.push('plan.mode none non può avere steps');
    if (task.plan.mode !== 'none' && task.plan.steps.length < 2) errors.push('un piano tecnico richiede almeno due step');
  }
  if (!Array.isArray(task.related_task_ids)) errors.push('related_task_ids deve essere un array');
  if (typeof task.intake_note !== 'string') errors.push('intake_note deve essere una stringa');
  for (const key of ['current_state','systems','watch_paths','acceptance_criteria','risks','notes']) if (!Array.isArray(task[key])) errors.push(`${key} deve essere un array`);
  const terminalIntake = task.intake_state === 'duplicate' || task.intake_state === 'already_implemented';
  if (task.audit_state === 'audited' && !terminalIntake && (!Array.isArray(task.acceptance_criteria) || task.acceptance_criteria.length === 0)) errors.push('task audited deve avere acceptance_criteria');
  if (task.intake_state === 'duplicate' && (!task.related_task_ids || task.related_task_ids.length === 0)) errors.push('duplicate richiede related_task_ids');
  if ((task.intake_state === 'duplicate' || task.intake_state === 'overlap' || task.intake_state === 'already_implemented') && !String(task.intake_note || '').trim()) errors.push(`${task.intake_state} richiede intake_note`);
  const ids = new Set();
  for (let i = 0; i < (task.acceptance_criteria || []).length; i++) {
    const c = task.acceptance_criteria[i];
    const p = `acceptance_criteria[${i}]`;
    if (!c || typeof c !== 'object') { errors.push(`${p} non valido`); continue; }
    if (typeof c.id !== 'string' || !c.id.trim()) errors.push(`${p}.id mancante`);
    if (ids.has(c.id)) errors.push(`${p}.id duplicato`); ids.add(c.id);
    if (typeof c.description !== 'string' || !c.description.trim()) errors.push(`${p}.description mancante`);
    if (!VERIFICATION.has(c.verification)) errors.push(`${p}.verification non valida`);
    if (!CRITERION_STATUS.has(c.status)) errors.push(`${p}.status non valido`);
    if (!Array.isArray(c.evidence)) errors.push(`${p}.evidence deve essere un array`);
    if (c.status === 'satisfied' && c.verification !== 'playtest' && (!c.evidence || c.evidence.length === 0)) errors.push(`${p}: satisfied richiede evidence`);
    if (c.verification === 'playtest' && c.status === 'satisfied' && !(c.evidence || []).some(v => typeof v === 'string' && v.startsWith('manual:'))) errors.push(`${p}: playtest soddisfatto richiede evidence manual:`);
  }
  if (errors.length) throw new Error(`${rel}:\n- ${errors.join('\n- ')}`);
}
function recomputeVerifiedStatus(task) {
  if (task.audit_state !== 'audited') return null;
  if (task.intake_state === 'duplicate' || task.intake_state === 'already_implemented') return 'complete';
  const criteria = task.acceptance_criteria || [];
  if (criteria.some(c => c.status === 'blocked')) return 'blocked';
  if (criteria.length && criteria.every(c => c.status === 'satisfied')) return 'complete';
  const codeCriteria = criteria.filter(c => c.verification !== 'playtest');
  const playtests = criteria.filter(c => c.verification === 'playtest');
  const codeDone = codeCriteria.length > 0 && codeCriteria.every(c => c.status === 'satisfied');
  if (codeDone && playtests.length > 0) return 'needs_validation';
  if (criteria.some(c => c.status === 'satisfied' || c.status === 'needs_validation')) return 'in_progress';
  return 'planned';
}
function normalizeTask(task) {
  const next = { ...task };
  if (!next.intake_state) next.intake_state = next.origin === 'legacy' ? 'canonical' : 'pending';
  if (!Array.isArray(next.related_task_ids)) next.related_task_ids = [];
  if (typeof next.intake_note !== 'string') next.intake_note = '';
  if (!ROADMAP_SCOPE.has(next.roadmap_scope)) next.roadmap_scope = 'none';
  if (!next.plan || typeof next.plan !== 'object') next.plan = next.origin === 'inbox' ? detectUserDefinedPlan(next.source && next.source.text) : emptyPlan();
  else {
    next.plan = {
      ...emptyPlan(),
      ...next.plan,
      steps: Array.isArray(next.plan.steps) ? next.plan.steps : [],
      gaps: Array.isArray(next.plan.gaps) ? next.plan.gaps : [],
      notes: Array.isArray(next.plan.notes) ? next.plan.notes : []
    };
  }
  if (next.schema_version < SCHEMA_VERSION) next.schema_version = SCHEMA_VERSION;
  if (next.audit_state === 'audited') next.verified_status = recomputeVerifiedStatus(next);
  else next.verified_status = null;
  return next;
}
function loadTasks({ normalize = false } = {}) {
  const result = [];
  for (const file of listTaskFiles()) {
    let task = normalizeTask(readTask(file));
    validateTask(task, file);
    if (normalize) writeIfChanged(file, JSON.stringify(task, null, 2));
    result.push({ file, task });
  }
  return result;
}
function bootstrap() {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
  const existing = new Map(loadTasks().map(x => [x.task.id, x]));
  let created = 0;
  for (const row of parseLegacyIndex()) {
    const seed = legacyTaskSeed(row);
    const file = path.join(TASKS_DIR, `${seed.id}.json`);
    if (!existing.has(seed.id)) { writeIfChanged(file, JSON.stringify(seed, null, 2)); created++; }
    else {
      const current = existing.get(seed.id).task;
      // Aggiorna solo i metadati provenienti dall'indice; non cancella audit/evidence già raccolti.
      const merged = { ...current, title: seed.title, category: seed.category, source: seed.source };
      writeIfChanged(file, JSON.stringify(merged, null, 2));
    }
  }
  const inbox = parseInbox();
  const now = new Map(loadTasks().map(x => [x.task.id, x]));
  for (const item of inbox.items) {
    if (item.checked || now.has(item.id)) continue;
    const seed = inboxTaskSeed(item);
    const key = comparisonKey(item.text);
    const exact = [...now.values()]
      .map(x => x.task)
      .find(t => t.id !== seed.id && (comparisonKey(t.source && t.source.text) === key || comparisonKey(t.title) === key));
    if (exact) {
      seed.intake_state = 'duplicate';
      seed.related_task_ids = [exact.id];
      seed.intake_note = `Richiesta uguale a "${exact.title}" (${exact.id}).`;
      seed.audit_state = 'audited';
      seed.current_state = [`duplicate:${exact.id} — ${exact.source.file}`];
      seed.notes = ['Duplicato esatto intercettato deterministicamente prima dell’audit AI.'];
    }
    const normalized = normalizeTask(seed);
    writeIfChanged(path.join(TASKS_DIR, `${seed.id}.json`), JSON.stringify(normalized, null, 2));
    created++;
    now.set(seed.id, { file: path.join(TASKS_DIR, `${seed.id}.json`), task: normalized });
  }
  console.log(`[roadmap-auto] bootstrap: ${created} nuove schede create; ${parseLegacyIndex().length} voci storiche riconosciute.`);
}
function git(args) {
  try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim(); }
  catch { return ''; }
}
function changedFiles() {
  const explicit = process.env.ADF_CHANGED_FILES;
  if (explicit !== undefined) return explicit.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
  const diff = git(['diff','HEAD^','HEAD','--name-only']);
  return diff ? diff.split(/\r?\n/).filter(Boolean) : [];
}
function commitSubject() { return process.env.ADF_COMMIT_SUBJECT || git(['log','-1','--format=%s']); }
function pathMatches(watch, changed) {
  const w = String(watch || '').replace(/\\/g,'/').replace(/^\.\//,'');
  const c = String(changed || '').replace(/\\/g,'/').replace(/^\.\//,'');
  if (!w || !c) return false;
  if (w.includes('*')) {
    const escaped = w.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*\*/g,'§§').replace(/\*/g,'[^/]*').replace(/§§/g,'.*');
    return new RegExp(`^${escaped}(?:$|/)`).test(c);
  }
  return c === w || c.startsWith(`${w.replace(/\/$/,'')}/`) || w.startsWith(`${c.replace(/\/$/,'')}/`);
}
function priority(task) {
  const s = task.source && task.source.source_status;
  if (task.origin === 'inbox') return 0;
  if (s === 'in_parte') return 1;
  if (s === 'da_fare' || s === 'risposto') return 2;
  if (s === 'fatto') return 3;
  return 4;
}
function selectAuditBatch(tasks) {
  const limit = Math.max(1, Number(process.env.ADF_AUDIT_BATCH || 8));
  const changed = changedFiles();
  const subject = commitSubject();
  const selected = new Map();
  for (const x of tasks) {
    const t = x.task;
    if (t.audit_state !== 'audited') continue;
    if (subject && subject.includes(t.id)) selected.set(t.id, x);
    else if ((t.watch_paths || []).some(w => changed.some(c => pathMatches(w,c)))) selected.set(t.id, x);
  }
  const candidates = tasks.filter(x => x.task.audit_state !== 'audited').sort((a,b) => priority(a.task)-priority(b.task) || a.task.title.localeCompare(b.task.title));
  for (const x of candidates) {
    if (selected.size >= limit) break;
    selected.set(x.task.id, x);
  }
  return [...selected.values()];
}
function buildPrompt() {
  bootstrap();
  const tasks = loadTasks();
  const batch = selectAuditBatch(tasks);
  if (!batch.length) return '';
  const changed = changedFiles();
  return `Sei l'auditor automatico delle implementazioni di Anni di Fame.\n\nFONTE DI VERITA' E VINCOLI\n- La repository checkout corrente, soprattutto main, e' la fonte tecnica.\n- ROADMAP.md e' la roadmap UFFICIALE: leggila per capire la direzione. In QUESTO audit task non modificarla; un secondo passaggio dedicato puo' colmare buchi minori coerenti con la direzione approvata.\n- Non modificare nessun file storico in implementazioni/*.md e non riscrivere il lavoro esistente.\n- Puoi modificare SOLO i JSON elencati sotto dentro implementazioni/auto/tasks/.\n- Prima di cambiare una task apri il suo source.file, cerca il testo originale, poi controlla il codice reale e i sistemi collegati.\n- Non trasformare deduzioni in fatti. Ogni criterio code_audit/automatic soddisfatto deve avere evidence concreta: percorso + funzione/simbolo/comportamento verificato.\n- Se una cosa richiede gusto, bilanciamento, browser, telefono o gameplay, usa verification=playtest e non segnarla satisfied senza evidence che inizi per manual:.\n- Se la vecchia documentazione dice FATTO ma il codice non lo dimostra, NON cancellare source.source_status: quello e' lo storico. Metti invece i criteri e verified_status verra' ricalcolato dallo script.\n- Per ogni task origin="inbox", PRIMA di espanderla fai un controllo di ridondanza contro TUTTE le task in implementazioni/auto/tasks/, i file storici implementazioni/*.md, ROADMAP.md e il codice pertinente.\n- Classifica intake_state così: unique = requisito realmente nuovo; duplicate = la stessa esigenza esiste già sostanzialmente in una task; overlap = una task esistente copre una parte ma la nuova richiesta aggiunge un requisito reale; already_implemented = non trovi una task equivalente ma il comportamento richiesto è già presente nel codice reale.\n- Per duplicate: related_task_ids deve indicare la task canonica e intake_note deve spiegare il match. Se esiste una task equivalente, preferisci duplicate anche se è già FATTA.\n- Per overlap: collega related_task_ids alla task esistente e crea criteri SOLO per la parte nuova, senza ricopiare ciò che è già coperto.\n- Per already_implemented: intake_note e current_state devono citare file/simboli/comportamento che lo provano; usalo solo se non esiste già una task equivalente.\n- Per duplicate e already_implemented imposta audit_state="audited" e acceptance_criteria=[]; non inventare una nuova roadmap di lavoro. Per unique e overlap continua con l'audit normale.\n- DOPO il controllo ridondanza, decidi se serve un piano tecnico ordinato.\n- Richiesta piccola/localizzata: plan.mode="none". Non creare V1/V2 inutili.\n- Richiesta ampia, cross-system, migrazione o refactor che richiede ordine: se l'utente NON ha fornito un piano, usa plan.mode="auto" e costruisci il MINIMO numero di step V1...Vn realmente necessario. Ogni step deve avere obiettivo, dipendenze, sistemi/file da osservare, criteri e stato.\n- Se plan.mode="user_defined", il piano V1...Vn arriva dall'utente: NON aggiungere, rimuovere, rinumerare o riordinare step. Puoi arricchire obiettivi/dipendenze/criteri. Se il repo mostra lavoro indispensabile non coperto, aggiungilo a plan.gaps e usa plan.status="gap_found"; non inventare V(n+1). Se il piano contraddice il repo usa plan.status="conflict". Se copre tutto usa plan.status="ready".\n- Per plan.mode="auto", non continuare a cascata: quando gli step coprono il percorso necessario imposta plan.status="ready". Aggiungi nuovi step solo se un gap tecnico reale e verificato lo richiede.\n- Spezza acceptance_criteria nella task per le condizioni globali; usa i criteri degli step per il progresso della singola V.\n- watch_paths deve coprire i file/cartelle che devono riattivare l'audit in futuro.\n- ROADMAP.md ufficiale NON e' il backlog tecnico. Bugfix, patch, regressioni, fix CSS/UI locali, correzioni di null/errori, refactor interni, migrazioni tecniche, test, tooling e manutenzione devono avere roadmap_scope="none" e roadmap_impact="none".\n- Usa roadmap_scope="official_gap" + roadmap_impact="minor" SOLO quando manca nella roadmap ufficiale un passaggio di evoluzione del GIOCO coerente con una decisione gia' approvata (nuovo sistema di gameplay, prerequisito di una macro-fase, progressione del mondo/citta', capacita' strutturale visibile al giocatore).\n- Usa roadmap_scope="major_proposal" + roadmap_impact="major" se servirebbe cambiare direzione, macro-fase o decisione ufficiale. Non applicarlo automaticamente.\n- Un piano tecnico V1...Vn di un progetto NON va copiato automaticamente in ROADMAP.md: puo' restare interamente nelle implementazioni.\n- roadmap_note deve spiegare l'eventuale impatto ufficiale; con roadmap_scope="none" lascialo vuoto.\n- Alla fine imposta audit_state="audited". Non forzare verified_status: lo ricalcola lo script.\n\nStati criterio: pending, satisfied, needs_validation, blocked. Verification: automatic, code_audit, playtest.\n\nULTIMO COMMIT: ${commitSubject() || '(non disponibile)'}\nFILE CAMBIATI:\n${changed.map(f=>`- ${f}`).join('\n') || '- nessuno / bootstrap'}\n\nTASK DA ANALIZZARE (${batch.length}):\n${batch.map(({task}) => `- ${task.id} — ${task.title}\n  JSON: implementazioni/auto/tasks/${task.id}.json\n  Fonte: ${task.source.file}\n  Stato storico: ${task.source.source_status_raw || task.source.source_status}`).join('\n')}\n\nPer ogni JSON: preserva id, origin e source; aggiorna title/category se necessario, intake_state, related_task_ids, intake_note, current_state, systems, watch_paths, acceptance_criteria, risks, notes, plan, roadmap_scope, roadmap_impact, roadmap_note e audit_state. Per le nuove richieste: prima ridondanza, poi piano tecnico se serve, poi criteri. Se plan.mode="user_defined" preserva rigorosamente gli ID V1...Vn esistenti e segnala i gap senza aggiungere step. Non creare né modificare altri file.`;
}
function intakeAnnotation(task) {
  const related = (task.related_task_ids || []).join(', ');
  if (task.intake_state === 'duplicate') return ` — **🔁 DUPLICATA → ${related}**${task.intake_note ? ` · ${task.intake_note}` : ''}`;
  if (task.intake_state === 'overlap') return ` — **🟡 ESTENSIONE → ${related || 'task collegata'}**${task.intake_note ? ` · ${task.intake_note}` : ''}`;
  if (task.intake_state === 'already_implemented') return ` — **✅ GIÀ IMPLEMENTATA**${task.intake_note ? ` · ${task.intake_note}` : ''}`;
  return '';
}
function markProcessedInbox(tasks) {
  const parsed = parseInbox();
  if (parsed.start === -1) return false;
  const byId = new Map(tasks.map(x => [x.task.id, x.task]));
  const lines = [...parsed.lines];
  for (const item of parsed.items) {
    if (item.checked) continue;
    const task = byId.get(item.id);
    if (!task || task.audit_state !== 'audited') continue;
    const line = lines[item.firstLineIndex];
    if (!line) continue;
    const withoutMarker = line.replace(/\s*<!--\s*ADF-TASK:[^>]+-->\s*$/i,'');
    lines[item.firstLineIndex] = withoutMarker.replace(/\[ \]/,'[x]') + ` <!-- ADF-TASK:${task.id} -->` + intakeAnnotation(task);
  }
  const body = `\n${lines.join('\n').replace(/^\n+|\n+$/g,'')}\n`;
  return writeIfChanged(INBOX, parsed.before + body + parsed.after);
}
function statusLabel(task) {
  const sourceMap = { fatto:'✅ fatto', in_parte:'🔶 in parte', da_fare:'⬜ da fare', risposto:'📝 risposto', nuova:'💡 nuova' };
  const verifiedMap = { planned:'⬜ da fare', in_progress:'🔨 in sviluppo', needs_validation:'👁 da validare', complete:'✅ verificata', blocked:'⛔ bloccata' };
  return { source: sourceMap[task.source.source_status] || task.source.source_status, verified: task.audit_state === 'audited' ? (verifiedMap[task.verified_status] || task.verified_status) : '— non ancora auditata' };
}
function progress(task) {
  if (task.audit_state !== 'audited') return '—';
  const total = task.acceptance_criteria.length;
  const done = task.acceptance_criteria.filter(c=>c.status==='satisfied').length;
  return `${done}/${total}`;
}
function renderReadme(tasks) {
  const sourceCounts = {};
  for (const x of tasks) sourceCounts[x.task.source.source_status] = (sourceCounts[x.task.source.source_status] || 0) + 1;
  const audited = tasks.filter(x=>x.task.audit_state==='audited').length;
  const duplicates = tasks.filter(x=>x.task.intake_state==='duplicate').length;
  const overlaps = tasks.filter(x=>x.task.intake_state==='overlap').length;
  const alreadyImplemented = tasks.filter(x=>x.task.intake_state==='already_implemented').length;
  const effectiveTasks = tasks.filter(x=>x.task.intake_state!=='duplicate');
  const openVerified = tasks.filter(x=>x.task.audit_state==='audited' && x.task.verified_status!=='complete' && x.task.intake_state!=='duplicate').length;
  const roadmapImpacts = tasks.filter(x=>x.task.audit_state==='audited' && x.task.roadmap_scope && x.task.roadmap_scope!=='none');
  const plannedProjects = tasks.filter(x=>x.task.plan && x.task.plan.mode!=='none').length;
  const userPlans = tasks.filter(x=>x.task.plan && x.task.plan.mode==='user_defined').length;
  const planGaps = tasks.filter(x=>x.task.plan && ['gap_found','conflict'].includes(x.task.plan.status)).length;
  const lines = [
    '# Stato automatico delle implementazioni', '',
    "> **`ROADMAP.md` resta la roadmap ufficiale di Anni di Fame.** Il cruscotto non la sostituisce: l'automazione può colmare **buchi minori** della roadmap quando sono supportati dal repo e coerenti con decisioni già approvate. Cambi di direzione, rimozioni di macro-fasi o decisioni strutturali restano invece da revisionare esplicitamente.", '',
    '## Copertura', '',
    `- **Schede importate:** ${tasks.length}`,
    `- **Task effettive (duplicati esclusi):** ${effectiveTasks.length}`,
    `- **Auditate contro il repo:** ${audited}/${tasks.length}`,
    `- **Duplicati intercettati:** ${duplicates}`,
    `- **Estensioni/sovrapposizioni:** ${overlaps}`,
    `- **Richieste già implementate senza task equivalente:** ${alreadyImplemented}`,
    `- **Progetti con piano V1→Vn:** ${plannedProjects} (forniti dall'utente: ${userPlans})`,
    `- **Piani con gap/conflitti da rivedere:** ${planGaps}`,
    `- **Auditate ma non complete:** ${openVerified}`,
    `- Stato storico importato: ${Object.entries(sourceCounts).map(([k,v])=>`${k} ${v}`).join(' · ') || '—'}`,
    '',
    '## Tutte le task e richieste', '',
    '| id | richiesta | ingresso | collegata a | fonte | stato storico | verifica repo | criteri |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | ---: |'
  ];
  for (const {task} of [...tasks].sort((a,b)=>priority(a.task)-priority(b.task) || a.task.title.localeCompare(b.task.title))) {
    const labels = statusLabel(task);
    const intakeMap = { canonical:'storica', pending:'da classificare', unique:'nuova', duplicate:'🔁 duplicata', overlap:'🟡 estensione', already_implemented:'✅ già implementata' };
    lines.push(`| \`${task.id}\` | ${task.title.replace(/\|/g,'\\|')} | ${intakeMap[task.intake_state] || task.intake_state} | ${(task.related_task_ids || []).join(', ') || '—'} | ${task.source.file} | ${labels.source} | ${labels.verified} | ${progress(task)} |`);
  }
  const intakeFindings = tasks.filter(x => ['duplicate','overlap','already_implemented'].includes(x.task.intake_state));
  lines.push('', '## Ridondanze e richieste già coperte', '');
  if (!intakeFindings.length) lines.push('_Nessuna ridondanza rilevata._');
  else for (const {task} of intakeFindings) {
    const related = (task.related_task_ids || []).join(', ');
    lines.push(`- **${task.id} — ${task.title}**: ${task.intake_state}${related ? ` → ${related}` : ''}${task.intake_note ? ` — ${task.intake_note}` : ''}`);
  }
  const plans = tasks.filter(x => x.task.plan && x.task.plan.mode !== 'none');
  lines.push('', '## Piani tecnici dei progetti', '');
  if (!plans.length) lines.push('_Nessun piano tecnico strutturato al momento._');
  else for (const {task} of plans) {
    const plan = task.plan;
    lines.push(`### ${task.id} — ${task.title}`, '', `Piano: **${plan.mode}** · stato: **${plan.status}**`, '');
    for (const step of plan.steps) lines.push(`- **${step.id} — ${step.title}** · ${step.status}${step.depends_on.length ? ` · dipende da ${step.depends_on.join(', ')}` : ''}`);
    for (const gap of plan.gaps || []) lines.push(`- ⚠️ Gap: ${typeof gap === 'string' ? gap : JSON.stringify(gap)}`);
    lines.push('');
  }
  lines.push('', '## Impatto possibile sulla roadmap ufficiale', '');
  if (!roadmapImpacts.length) lines.push('_Nessuna task auditata richiede al momento una revisione della roadmap._');
  else for (const {task} of roadmapImpacts) lines.push(`- **${task.id} — ${task.title}** (${task.roadmap_scope}/${task.roadmap_impact}): ${task.roadmap_note || 'da valutare'}`);
  lines.push('', '> La roadmap ufficiale contiene evoluzione del gioco, non bugfix/patch/refactor. Solo `official_gap/minor` può essere incorporato automaticamente; `major_proposal/major` richiede revisione esplicita.', '', '## Nuove idee', '', 'Scrivile nella sezione **Inbox automatica** di `../implementazioni.md` come checkbox, anche in una frase sola. Il workflow controllerà ridondanze, repo reale e ampiezza: task piccola oppure piano tecnico V1→Vn quando serve.');
  return lines.join('\n') + '\n';
}
function finalize() {
  bootstrap();
  const tasks = loadTasks({ normalize:true });
  markProcessedInbox(tasks);
  const refreshed = loadTasks({ normalize:true });
  writeIfChanged(AUTO_README, renderReadme(refreshed));
  console.log(`[roadmap-auto] finalize: ${refreshed.length} task, ${refreshed.filter(x=>x.task.audit_state==='audited').length} auditate.`);
}
function check() {
  const tasks = loadTasks();
  const byId = new Set(tasks.map(x => x.task.id));
  for (const {task} of tasks) {
    for (const related of task.related_task_ids || []) {
      if (related === task.id) die(`${task.id}: related_task_ids non può contenere se stessa`);
      if (!byId.has(related)) die(`${task.id}: task collegata inesistente ${related}`);
    }
  }
  const legacyRows = parseLegacyIndex();
  const headlineTotal = legacyHeadlineTotal();
  if (headlineTotal !== null && legacyRows.length !== headlineTotal) {
    die(`inventario storico incompleto: README dichiara ${headlineTotal} voci ma il parser ne riconosce ${legacyRows.length}`);
  }
  const missingLegacy = legacyRows
    .map(legacyTaskSeed)
    .filter(seed => !byId.has(seed.id));
  if (missingLegacy.length) die(`bootstrap incompleto: mancano ${missingLegacy.length} voci storiche: ${missingLegacy.map(x => x.title).join(' | ')}`);
  const inbox = parseInbox();
  const missingInbox = inbox.items.filter(item => !item.checked && !byId.has(item.id));
  if (missingInbox.length) die(`bootstrap incompleto: mancano ${missingInbox.length} richieste inbox`);
  const expected = renderReadme(tasks);
  if (!fs.existsSync(AUTO_README) || read(AUTO_README) !== expected) die('implementazioni/auto/README.md non aggiornato');
  if (!fs.existsSync(ROADMAP)) die('ROADMAP.md ufficiale mancante');
  console.log(`[roadmap-auto] OK: ${tasks.length} task importate; ${legacyRows.length} voci storiche coperte; ROADMAP.md resta ufficiale ed e' modificabile solo dal passaggio roadmap dedicato.`);
}
const command = process.argv[2] || 'help';
if (command === 'bootstrap') bootstrap();
else if (command === 'prompt') process.stdout.write(buildPrompt());
else if (command === 'finalize') finalize();
else if (command === 'check') check();
else if (command === 'list') { bootstrap(); const tasks=loadTasks(); console.log(JSON.stringify({total:tasks.length,audited:tasks.filter(x=>x.task.audit_state==='audited').length,batch:selectAuditBatch(tasks).map(x=>x.task.id)},null,2)); }
else console.log('Uso: node scripts/roadmap-auto.js <bootstrap|prompt|finalize|check|list>');