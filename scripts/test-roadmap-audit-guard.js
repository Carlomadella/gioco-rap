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

  const localMulti = structuredClone(base);
  localMulti.id = 'ADF-NEW-CCCCCCCCCCCC';
  localMulti.plan = { mode: 'none', status: 'not_applicable', summary: '', steps: [], gaps: [], notes: [] };
  localMulti.related_task_ids = ['ADF-LEG-BBBBBBBBBBBB'];
  localMulti.systems = ['energia', 'hud', 'stato-player'];
  localMulti.watch_paths = ['energia.js', 'hud.js', 'player.js', 'gioco.js'];
  localMulti.acceptance_criteria = [
    { id: 'C1', description: 'valore energia visibile', verification: 'code_audit', status: 'pending', evidence: [] },
    { id: 'C2', description: 'warning sotto soglia', verification: 'code_audit', status: 'pending', evidence: [] },
    { id: 'C3', description: 'ripristino sopra soglia', verification: 'code_audit', status: 'pending', evidence: [] }
  ];
  writeTask(localMulti);
  assert.ok(run([localMulti.id]).includes('OK: 1 task'), 'una meccanica locale multi-file/multi-criterio deve poter restare plan=none');

  const broad = structuredClone(base);
  broad.id = 'ADF-NEW-DDDDDDDDDDDD';
  broad.plan = { mode: 'none', status: 'not_applicable', summary: '', steps: [], gaps: [], notes: [] };
  broad.systems = ['discografia', 'streaming', 'economia', 'carriera', 'classifica'];
  broad.watch_paths = ['release.js', 'streaming.js', 'economy.js', 'career.js', 'charts.js'];
  broad.acceptance_criteria = [
    { id: 'C1', description: 'formula pubblicazione', verification: 'code_audit', status: 'pending', evidence: [] },
    { id: 'C2', description: 'propagazione economica', verification: 'code_audit', status: 'pending', evidence: [] },
    { id: 'C3', description: 'coerenza classifica', verification: 'code_audit', status: 'pending', evidence: [] }
  ];
  writeTask(broad);
  assert.throws(() => run([broad.id]), /status|Command failed/, 'una inbox davvero cross-system + multi-criterio deve essere bloccata se plan=none');

  const oneStep = structuredClone(broad);
  oneStep.plan = {
    mode: 'auto', status: 'ready', summary: 'Piano troppo corto', gaps: [], notes: [],
    steps: [
      { id: 'V1', title: 'Unico step', objective: 'Fare tutto', depends_on: [], systems: ['discografia'], watch_paths: ['release.js'], acceptance_criteria: ['C1'], status: 'planned' }
    ]
  };
  writeTask(oneStep);
  assert.throws(() => run([oneStep.id]), /status|Command failed/, 'un auto-plan con un solo step deve essere sempre rifiutato');

  const broadValid = structuredClone(broad);
  broadValid.plan = {
    mode: 'auto', status: 'ready', summary: 'Piano minimo', gaps: [], notes: [],
    steps: [
      { id: 'V1', title: 'Contratto', objective: 'Definire il calcolo', depends_on: [], systems: ['discografia', 'classifica'], watch_paths: ['release.js', 'charts.js'], acceptance_criteria: ['C1'], status: 'planned' },
      { id: 'V2', title: 'Propagazione', objective: 'Collegare economia e carriera', depends_on: ['V1'], systems: ['streaming', 'economia', 'carriera'], watch_paths: ['streaming.js', 'economy.js', 'career.js'], acceptance_criteria: ['C2', 'C3'], status: 'planned' }
    ]
  };
  writeTask(broadValid);
  assert.ok(run([broadValid.id]).includes('OK: 1 task'), 'la stessa task deve passare con auto-plan valido da almeno due step');

  console.log('roadmap-audit-guard: test OK');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
