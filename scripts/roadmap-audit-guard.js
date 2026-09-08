#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.env.ADF_ROOT || path.join(__dirname, '..'));
const TASKS_DIR = path.join(ROOT, 'implementazioni', 'auto', 'tasks');

const AUDIT_STATE = new Set(['not_audited', 'audited']);
const INTAKE_STATE = new Set(['canonical', 'pending', 'unique', 'duplicate', 'overlap', 'already_implemented']);
const PLAN_MODE = new Set(['none', 'auto', 'user_defined']);
const PLAN_STATUS = new Set(['not_applicable', 'draft', 'ready', 'gap_found', 'conflict']);
const PLAN_STEP_STATUS = new Set(['planned', 'in_progress', 'needs_validation', 'complete', 'blocked']);
const CRITERION_STATUS = new Set(['pending', 'satisfied', 'needs_validation', 'blocked']);
const VERIFICATION = new Set(['automatic', 'code_audit', 'playtest']);

function fail(message) {
  console.error('[roadmap-audit-guard] ' + message);
  process.exit(1);
}

function batchIds(file) {
  if (!file || !fs.existsSync(file)) fail('file batch mancante: ' + (file || '(vuoto)'));
  const ids = fs.readFileSync(file, 'utf8').split(/\r?\n/).map(v => v.trim()).filter(Boolean);
  if (!ids.length) fail('batch vuoto');
  return ids;
}

function validateCriterion(c, prefix, errors) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) {
    errors.push(prefix + ' non valido');
    return;
  }
  if (typeof c.id !== 'string' || !c.id.trim()) errors.push(prefix + '.id mancante');
  if (typeof c.description !== 'string' || !c.description.trim()) errors.push(prefix + '.description mancante');
  if (!VERIFICATION.has(c.verification)) errors.push(prefix + '.verification non valida: ' + c.verification);
  if (!CRITERION_STATUS.has(c.status)) errors.push(prefix + '.status non valido: ' + c.status);
  if (!Array.isArray(c.evidence)) errors.push(prefix + '.evidence deve essere array');
  if (c.status === 'satisfied' && c.verification !== 'playtest' && (!Array.isArray(c.evidence) || c.evidence.length === 0)) {
    errors.push(prefix + ': satisfied richiede evidence');
  }
  if (c.status === 'satisfied' && c.verification === 'playtest' && !(c.evidence || []).some(v => typeof v === 'string' && v.startsWith('manual:'))) {
    errors.push(prefix + ': playtest satisfied richiede evidence manual:');
  }
}

function distinctStrings(values) {
  return new Set((Array.isArray(values) ? values : []).filter(v => typeof v === 'string' && v.trim()).map(v => v.trim())).size;
}

function autoPlanSignals(task) {
  if (task.origin !== 'inbox') return [];
  if (!['unique', 'overlap'].includes(task.intake_state)) return [];

  const signals = [];
  const systems = distinctStrings(task.systems);
  const watchPaths = distinctStrings(task.watch_paths);
  const criteria = Array.isArray(task.acceptance_criteria) ? task.acceptance_criteria.length : 0;
  const related = distinctStrings(task.related_task_ids);

  // Backstop conservativo: il guard NON deve trasformare una modifica locale
  // in un progetto solo perché tocca più file o ha più criteri.
  // "cross-system" scatta solo con superficie forte su ENTRAMBI i segnali.
  if (systems >= 4 && watchPaths >= 4) signals.push('cross-system-forte');

  // Due criteri possono descrivere semplicemente andata/ritorno dello stesso comportamento.
  // Da tre in su è un segnale più affidabile, ma da solo non basta.
  if (criteria >= 3) signals.push('multi-criterio-forte');

  // Più task canoniche che coprono pezzi diversi indicano delta distribuito.
  if (related >= 2) signals.push('copertura-distribuita');

  return signals;
}

function validateTask(task, id) {
  const errors = [];
  if (!task || typeof task !== 'object' || Array.isArray(task)) return ['JSON task non oggetto'];
  if (task.id !== id) errors.push('id atteso ' + id + ', trovato ' + task.id);
  if (!AUDIT_STATE.has(task.audit_state)) errors.push('audit_state non valido: ' + task.audit_state);
  if (task.audit_state !== 'audited') errors.push('audit_state=' + task.audit_state + '; il batch deve risultare audited');
  if (!INTAKE_STATE.has(task.intake_state)) errors.push('intake_state non valido: ' + task.intake_state);

  if (!Array.isArray(task.related_task_ids)) errors.push('related_task_ids deve essere array');
  if (typeof task.intake_note !== 'string') errors.push('intake_note deve essere stringa');

  if (task.origin === 'inbox' && task.intake_state === 'duplicate') {
    if (!Array.isArray(task.related_task_ids) || task.related_task_ids.length !== 1) {
      errors.push('duplicate inbox richiede esattamente una task canonica equivalente');
    }
    if (!/\bdelta\s*=\s*nessuno\b/i.test(String(task.intake_note || ''))) {
      errors.push('duplicate inbox richiede intake_note con delta=nessuno');
    }
  }

  const plan = task.plan;
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
    errors.push('plan mancante/non valido');
  } else {
    if (!PLAN_MODE.has(plan.mode)) errors.push('plan.mode non valido: ' + plan.mode);
    if (!PLAN_STATUS.has(plan.status)) errors.push('plan.status non valido: ' + plan.status);
    if (typeof plan.summary !== 'string') errors.push('plan.summary deve essere stringa');
    for (const k of ['steps', 'gaps', 'notes']) if (!Array.isArray(plan[k])) errors.push('plan.' + k + ' deve essere array');

    if (Array.isArray(plan.steps)) {
      const ids = new Set();
      plan.steps.forEach((step, i) => {
        const p = 'plan.steps[' + i + ']';
        if (!step || typeof step !== 'object' || Array.isArray(step)) {
          errors.push(p + ' non valido');
          return;
        }
        if (!/^V\d+$/.test(step.id || '')) errors.push(p + '.id deve essere V1, V2...');
        if (ids.has(step.id)) errors.push(p + '.id duplicato');
        ids.add(step.id);
        if (typeof step.title !== 'string' || !step.title.trim()) errors.push(p + '.title mancante');
        if (typeof step.objective !== 'string') errors.push(p + '.objective deve essere stringa');
        for (const k of ['depends_on', 'systems', 'watch_paths', 'acceptance_criteria']) {
          if (!Array.isArray(step[k])) errors.push(p + '.' + k + ' deve essere array');
        }
        if (!PLAN_STEP_STATUS.has(step.status)) errors.push(p + '.status non valido: ' + step.status);
      });
      if (plan.mode === 'none' && plan.steps.length) errors.push('plan.mode none non può avere steps');
      if (plan.mode !== 'none' && plan.steps.length < 2) errors.push('piano tecnico richiede almeno due step');
    }

    const signals = autoPlanSignals(task);
    if (plan.mode === 'none' && signals.length >= 2) {
      errors.push(
        'richiesta inbox ampia/cross-system: plan.mode=none non ammesso; richiede auto o user_defined; ' +
        'se mode=auto il piano deve avere almeno due step ordinati (V1 e V2 minimo) ' +
        '(segnali: ' + signals.join(', ') + ')'
      );
    }
  }

  for (const key of ['current_state', 'systems', 'watch_paths', 'acceptance_criteria', 'risks', 'notes']) {
    if (!Array.isArray(task[key])) errors.push(key + ' deve essere array');
  }
  if (Array.isArray(task.acceptance_criteria)) {
    task.acceptance_criteria.forEach((c, i) => validateCriterion(c, 'acceptance_criteria[' + i + ']', errors));
  }

  return errors;
}

function validateBatch(idsFile) {
  const ids = batchIds(idsFile);
  const failures = [];
  for (const id of ids) {
    const file = path.join(TASKS_DIR, id + '.json');
    if (!fs.existsSync(file)) {
      failures.push(id + ': JSON mancante');
      continue;
    }
    let task;
    try { task = JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch (error) { failures.push(id + ': JSON non valido: ' + error.message); continue; }
    const errors = validateTask(task, id);
    if (errors.length) failures.push(id + ': ' + errors.join(' | '));
  }
  if (failures.length) {
    console.error('[roadmap-audit-guard] batch non conforme:');
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log('[roadmap-audit-guard] OK: ' + ids.length + ' task auditate e conformi.');
}

const command = process.argv[2];
if (command === 'validate-batch') validateBatch(process.argv[3] || process.env.ADF_AUDIT_IDS_FILE);
else fail('Uso: node scripts/roadmap-audit-guard.js validate-batch <audit-ids.txt>');
