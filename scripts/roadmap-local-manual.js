#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TASKS_DIR = path.join(ROOT, 'implementazioni', 'auto', 'tasks');
const ROADMAP = path.join(ROOT, 'ROADMAP.md');
const INBOX = path.join(ROOT, 'implementazioni', 'implementazioni.md');
const AUTO_DIR = path.join(ROOT, 'implementazioni', 'auto');

process.env.ADF_LOCAL_AI_BASE_URL ||= 'http://127.0.0.1:11434/v1';
process.env.ADF_LOCAL_AI_MODEL ||= 'gpt-oss:20b';

function run(cmd, args, capture = false) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    env: process.env,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = capture ? '\n' + String(result.stderr || result.stdout || '').trim() : '';
    throw new Error(cmd + ' ' + args.join(' ') + ' -> exit ' + result.status + detail);
  }
  return capture ? String(result.stdout || '') : '';
}

const git = (args, capture = true) => run('git', args, capture);
const node = (script, args = [], capture = false) =>
  run(process.execPath, [path.join(ROOT, script), ...args], capture);

function copyIfExists(src, dst) {
  if (fs.existsSync(src)) fs.cpSync(src, dst, { recursive: true });
}

function restoreSnapshot(snapshot) {
  for (const target of [AUTO_DIR, INBOX, ROADMAP]) fs.rmSync(target, { recursive: true, force: true });
  copyIfExists(path.join(snapshot, 'auto'), AUTO_DIR);
  copyIfExists(path.join(snapshot, 'implementazioni.md'), INBOX);
  copyIfExists(path.join(snapshot, 'ROADMAP.md'), ROADMAP);
}

function ensureClean() {
  const status = git(['status', '--porcelain']).trim();
  if (status) throw new Error('Working tree non pulito:\n' + status);
}

async function verifyOllama() {
  const base = String(process.env.ADF_LOCAL_AI_BASE_URL || '').replace(/\/+$/, '');
  const model = process.env.ADF_LOCAL_AI_MODEL || 'gpt-oss:20b';
  const response = await fetch(base + '/models');
  if (!response.ok) throw new Error('Ollama non raggiungibile: HTTP ' + response.status);
  const data = await response.json();
  const ids = (data.data || []).map(x => x.id || x.model || x.name).filter(Boolean);
  if (!ids.includes(model)) throw new Error('Modello locale non trovato: ' + model);
  console.log('[manual] Ollama OK:', base, 'modello:', model);
}

function writePromptFiles(tmp) {
  const head = git(['rev-parse', 'HEAD']).trim();
  let changed = '';
  try { changed = git(['diff', '--name-only', head + '^1', head]); } catch {}
  process.env.ADF_CHANGED_FILES = changed;
  process.env.ADF_COMMIT_SUBJECT = git(['log', '-1', '--format=%s', head]).trim();

  const prompt = node('scripts/roadmap-auto.js', ['prompt'], true);
  const promptFile = path.join(tmp, 'roadmap-prompt.txt');
  const idsFile = path.join(tmp, 'audit-ids.txt');
  fs.writeFileSync(promptFile, prompt, 'utf8');

  const ids = [];
  const re = /JSON:\s+implementazioni\/auto\/tasks\/(ADF-(?:LEG|NEW)-[A-F0-9]{12})\.json/g;
  for (const match of prompt.matchAll(re)) if (!ids.includes(match[1])) ids.push(match[1]);
  fs.writeFileSync(idsFile, ids.join('\n') + (ids.length ? '\n' : ''), 'utf8');
  return { promptFile, idsFile, ids, prompt };
}

function validateBatch(idsFile, validationFile) {
  const result = spawnSync(process.execPath, [
    path.join(ROOT, 'scripts/roadmap-audit-guard.js'),
    'validate-batch',
    idsFile
  ], { cwd: ROOT, env: process.env, encoding: 'utf8' });

  const output = String(result.stdout || '') + String(result.stderr || '');
  fs.writeFileSync(validationFile, output, 'utf8');
  if (result.status !== 0) {
    const e = new Error('validazione batch fallita');
    e.output = output;
    throw e;
  }
  process.stdout.write(output);
}

function buildRoadmapPrompt() {
  if (!fs.existsSync(TASKS_DIR)) return '';
  const tasks = fs.readdirSync(TASKS_DIR)
    .filter(n => n.endsWith('.json'))
    .map(n => JSON.parse(fs.readFileSync(path.join(TASKS_DIR, n), 'utf8')))
    .filter(t => t.audit_state === 'audited' &&
      t.roadmap_scope === 'official_gap' &&
      t.roadmap_impact === 'minor' &&
      String(t.roadmap_note || '').trim());
  if (!tasks.length) return '';

  return `Sei il manutentore della roadmap UFFICIALE di Anni di Fame.

OBIETTIVO
Migliora ROADMAP.md solo dove l'audit del repository ha trovato buchi MINORI e verificabili.

REGOLE RIGIDE
- NON creare/cambiare branch e NON fare commit/pull/push.
- Prima leggi ROADMAP.md, le task indicate e il codice collegato.
- Puoi modificare SOLO ROADMAP.md.
- Non cancellare macro-fasi, città, principi permanenti o decisioni già approvate.
- Non cambiare la direzione del gioco.
- NON aggiungere bugfix, patch, regressioni, fix CSS/UI locali, refactor, migrazioni tecniche, test o tooling.
- Non duplicare contenuti già presenti.
- Se il buco è già coperto, non modificare niente.
- Se servirebbe cambiare una decisione strutturale, NON farlo.
- Mantieni tono, struttura e lingua italiana già usati in ROADMAP.md.

BUCHI MINORI RILEVATI:
${tasks.map(t => '- ' + t.id + ' — ' + t.title + ': ' + t.roadmap_note).join('\n')}
`;
}

function protectRoadmap(before) {
  const after = fs.readFileSync(ROADMAP, 'utf8');
  const headings = before.match(/^##\s+.+$/gm) || [];
  const missing = headings.filter(h => !after.includes(h));
  if (missing.length) throw new Error('ROADMAP: sezioni rimosse: ' + missing.join(' | '));
  if (after.length < before.length * 0.95) throw new Error('ROADMAP: possibile riscrittura distruttiva');
  const permanent = [
    "Tutto dev'essere interattivo",
    'Tutto personalizzabile',
    'Si sblocca un mondo, non un menu',
    'Niente studio personale'
  ];
  const lost = permanent.filter(x => before.includes(x) && !after.includes(x));
  if (lost.length) throw new Error('ROADMAP: regole permanenti rimosse: ' + lost.join(' | '));
}

function ensureAllowedDiff() {
  const files = git(['diff', '--name-only']).trim().split(/\r?\n/).filter(Boolean);
  const outside = files.filter(file =>
    !file.startsWith('implementazioni/auto/') &&
    file !== 'implementazioni/implementazioni.md' &&
    file !== 'ROADMAP.md'
  );
  if (outside.length) throw new Error('Modifiche fuori perimetro: ' + outside.join(', '));
}

async function main() {
  console.log('[manual] Roadmap AI locale — nessun runner GitHub richiesto');
  ensureClean();
  await verifyOllama();

  node('scripts/test-roadmap-auto.js');
  node('scripts/test-roadmap-audit-guard.js');
  node('scripts/roadmap-local-agent.js', ['self-test']);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'adf-roadmap-manual-'));
  const snapshot = path.join(tmp, 'before');
  fs.mkdirSync(snapshot, { recursive: true });
  copyIfExists(AUTO_DIR, path.join(snapshot, 'auto'));
  copyIfExists(INBOX, path.join(snapshot, 'implementazioni.md'));
  copyIfExists(ROADMAP, path.join(snapshot, 'ROADMAP.md'));

  try {
    node('scripts/roadmap-auto.js', ['bootstrap']);
    const { promptFile, idsFile, ids, prompt } = writePromptFiles(tmp);

    if (prompt.trim() && ids.length) {
      console.log('[manual] audit locale:', ids.length, 'task');
      node('scripts/roadmap-local-agent.js', ['audit', '--prompt-file', promptFile, '--ids-file', idsFile]);

      const validationFile = path.join(tmp, 'audit-validation.log');
      try {
        validateBatch(idsFile, validationFile);
      } catch (first) {
        console.log('[manual] primo audit non conforme: avvio un solo repair');
        process.stdout.write(first.output || '');
        node('scripts/roadmap-local-agent.js', [
          'repair', '--prompt-file', promptFile, '--ids-file', idsFile, '--validation-file', validationFile
        ]);
        validateBatch(idsFile, validationFile);
      }
    } else {
      console.log('[manual] nessuna task AI da auditare in questo batch');
    }

    const roadmapBefore = fs.readFileSync(ROADMAP, 'utf8');
    const roadmapPrompt = buildRoadmapPrompt();
    if (roadmapPrompt) {
      const roadmapPromptFile = path.join(tmp, 'roadmap-maintenance-prompt.txt');
      fs.writeFileSync(roadmapPromptFile, roadmapPrompt, 'utf8');
      try {
        node('scripts/roadmap-local-agent.js', ['roadmap', '--prompt-file', roadmapPromptFile]);
        protectRoadmap(roadmapBefore);
      } catch (error) {
        fs.writeFileSync(ROADMAP, roadmapBefore, 'utf8');
        console.warn('[manual] manutenzione ROADMAP saltata:', error.message);
      }
    }

    ensureAllowedDiff();
    node('scripts/roadmap-auto.js', ['finalize']);
    node('scripts/roadmap-auto.js', ['check']);
    git(['diff', '--check'], false);
    ensureAllowedDiff();

    console.log('\n[manual] COMPLETATO. Nessun commit/push automatico.');
    process.stdout.write(git(['status', '--short']));
    console.log('\n[manual] Riepilogo diff:');
    process.stdout.write(git(['diff', '--stat']));
  } catch (error) {
    restoreSnapshot(snapshot);
    console.error('\n[manual] FALLITO: ripristinato lo stato iniziale.');
    throw error;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
