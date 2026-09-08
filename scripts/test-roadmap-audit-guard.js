#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');

const GUARD = path.resolve(__dirname, 'roadmap-audit-guard.js');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'adf-roadmap-guard-'));
const tasksDir = path.join(root, 'implementazioni', 'auto', 'tasks');
fs.mkdirSync(tasksDir, { recursive: true });

function writeTask(task) {
  fs.writeFileSync(path.join(tasksDir, `${task.id}.json`), JSON.stringify(task, null, 2) + '\n', 'utf8');
}
function run(ids) {
  const idsFile = path.join(root, 'ids.txt');
  fs.writeFileSync(idsFile, ids.join('\n') + '\n', 'utf8');
  return execFileSync(process.execPath, [GUARD, 'validate-batch', idsFile], {
    cwd: root,
    env: { ...process.env, ADF_ROOT: root },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

const base = {
  schema_version: 5,
  id: 'ADF-NEW-AAAAAAAAAAAA',
  origin: 'inbox',
  title: 'voglio sistemare gli eventi ed il tempo in game',
  category: '05-carriera-e-tempo',
  source: { text: 'x', file: 'implementazioni/implementazioni.md', source_status: 'nuova', source_status_raw: 'nuova' },
  audit_state: 'audited',
  verified_status: null,
  intake_state: 'overlap',
  related_task_ids: ['ADF-LEG-BBBBBBBBBBBB'],
  intake_note: 'La task esistente copre solo una parte; resta un delta cross-system.',
  roadmap_scope: 'none', roadmap_impact: 'none', roadmap_note: '',
  plan: {
    mode: 'auto', status: 'ready', summary: 'Piano minimo', gaps: [], notes: [],
    steps: [
      { id: 'V1', title: 'Inventario', objective: 'Mappare eventi e tempo', depends_on: [], systems: ['tempo'], watch_paths: ['frontend/js/game'], acceptance_criteria: [], status: 'planned' },
      { id: 'V2', title: 'Contratto comune', objective: 'Allineare il context', depends_on: ['V1'], systems: ['eventi'], watch_paths: ['frontend/js/game'], acceptance_criteria: [], status: 'planned' }
    ]
  },
  current_state: [], systems: ['tempo', 'eventi'], watch_paths: ['frontend/js/game'],
  acceptance_criteria: [{ id: 'C1', description: 'Contratto verificato', verification: 'code_audit', status: 'satisfied', evidence: ['frontend/js/game — evidenza'] }],
  risks: [], notes: []
};

try {
  writeTask(base);
  assert.ok(run([base.id]).includes('OK: 1 task'));

  const malformed = structuredClone(base);
  delete malformed.plan.steps[0].title;
  malformed.plan.steps[0].status = 'pending';
  malformed.acceptance_criteria[0] = { id: 'C1', verification: 'code_audit', status: 'satisfied' };
  writeTask(malformed);
  assert.throws(() => run([base.id]), 'deve rifiutare lo schema malformato visto in Actions');

  const falseDuplicate = structuredClone(base);
  falseDuplicate.intake_state = 'duplicate';
  falseDuplicate.plan = { mode: 'none', status: 'not_applicable', summary: '', steps: [], gaps: [], notes: [] };
  falseDuplicate.acceptance_criteria = [];
  falseDuplicate.intake_note = 'Tema simile alla task sullo skip del tempo';
  writeTask(falseDuplicate);
  assert.throws(() => run([base.id]), 'duplicate inbox senza delta=nessuno deve essere bloccato');

  const exactDuplicate = structuredClone(falseDuplicate);
  exactDuplicate.intake_note = 'delta=nessuno; perimetro, obiettivo e risultato atteso equivalenti alla task canonica.';
  writeTask(exactDuplicate);
  assert.ok(run([base.id]).includes('OK: 1 task'));

  console.log('roadmap-audit-guard: test OK');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
