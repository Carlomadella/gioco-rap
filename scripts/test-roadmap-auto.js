#!/usr/bin/env node
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');
const SCRIPT = path.resolve(__dirname, 'roadmap-auto.js');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'adf-roadmap-v13-'));
function write(p, text) { const f=path.join(root,p); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,text,'utf8'); }
function run(cmd, extraEnv={}) { return execFileSync(process.execPath,[SCRIPT,cmd],{cwd:root,env:{...process.env,ADF_ROOT:root,ADF_CHANGED_FILES:'',...extraEnv},encoding:'utf8'}); }
function loadTasks() {
  const dir=path.join(root,'implementazioni/auto/tasks');
  return fs.readdirSync(dir).filter(x=>x.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8')));
}
try {
  write('ROADMAP.md','# Roadmap ufficiale\n\n## Provincia\n');
  write('implementazioni/README.md',`# I punti

5 voci in tutto: **1 chiusa**, 1 a metà, 1 da fare e 2 con la sola risposta scritta

| | punto | stato | dove |
| --- | --- | --- | --- |
| **1** | Cosa si può simulare | fatto | [carriera-e-tempo](05-carriera-e-tempo.md) |
| **22** | L'energia cresce col livello | da fare | [carriera-e-tempo](05-carriera-e-tempo.md) |
| **42** | Il telefono è un iPhone vero | in parte | [interfaccia-e-telefono](02-interfaccia-e-telefono.md) |
| **—** | La giornata | risposto, da fare | [carriera-e-tempo](05-carriera-e-tempo.md) |
| **—** | Una pagina per ogni azione? | risposto, da fare | [pagine-azioni](../documentazione/pagine-azioni/README.md) |
`);
  write('implementazioni/implementazioni.md',`# Punti nuovi

### Inbox automatica
<!-- ADF-AUTO-INBOX:BEGIN -->
- [ ] voglio cambiare il tempo del turno in fabbrica
- [ ] L'energia cresce col livello
- [ ] voglio sistemare gli eventi ed il tempo in game
  V1 — inventario completo di tutto ciò che succede in game; nessun cambio comportamento
  V2 — contratto minimo dell'identità dell'azione + correzione del turno Fabbrica
  V3 — context comune dell'attività
  V4 — collegamento delle ACTION normali al nuovo context
<!-- ADF-AUTO-INBOX:END -->
`);
  write('implementazioni/05-carriera-e-tempo.md','# Carriera\n');
  write('implementazioni/02-interfaccia-e-telefono.md','# UI\n');
  write('documentazione/pagine-azioni/README.md','# Pagine azioni\n');

  run('bootstrap');
  let tasks = loadTasks();
  assert.equal(tasks.filter(t=>t.origin==='legacy').length,5,'deve importare anche la voce storica che punta in documentazione/');
  assert.equal(tasks.filter(t=>t.origin==='inbox').length,3);

  const duplicate = tasks.find(t=>t.origin==='inbox' && t.source.text === "L'energia cresce col livello");
  assert.equal(duplicate.intake_state,'duplicate');
  assert.equal(duplicate.audit_state,'audited');
  assert.equal(duplicate.related_task_ids.length,1);

  const userPlan = tasks.find(t=>t.origin==='inbox' && t.source.text.startsWith('voglio sistemare gli eventi'));
  assert.ok(userPlan,'richiesta con V1...V4 non trovata');
  assert.equal(userPlan.plan.mode,'user_defined');
  assert.equal(userPlan.plan.steps.length,4);
  assert.deepEqual(userPlan.plan.steps.map(s=>s.id),['V1','V2','V3','V4']);

  const fresh = tasks.find(t=>t.origin==='inbox' && t.source.text === 'voglio cambiare il tempo del turno in fabbrica');
  assert.equal(fresh.plan.mode,'none','una richiesta piccola non deve ricevere un piano tecnico a cascata');

  const prompt = run('prompt',{ADF_AUDIT_BATCH:'20'});
  assert.ok(prompt.includes('plan.mode="user_defined"'));
  assert.ok(prompt.includes('NON aggiungere, rimuovere, rinumerare o riordinare step'));
  assert.ok(prompt.includes('Bugfix, patch, regressioni'));
  assert.ok(prompt.includes('Un piano tecnico V1...Vn di un progetto NON va copiato automaticamente in ROADMAP.md'));

  const beforeRoadmap = fs.readFileSync(path.join(root,'ROADMAP.md'),'utf8');

  fresh.audit_state='audited';
  fresh.intake_state='overlap';
  fresh.related_task_ids=[duplicate.related_task_ids[0]];
  fresh.intake_note='Estensione collegata alla task energia; conserva solo il delta.';
  fresh.category='05-carriera-e-tempo';
  fresh.systems=['tempo','energia'];
  fresh.watch_paths=['frontend/js/game/actions.js'];
  fresh.acceptance_criteria=[
    {id:'C1',description:'durata corretta',verification:'code_audit',status:'satisfied',evidence:['frontend/js/game/actions.js — turnoFabbrica']},
    {id:'C2',description:'bilanciamento',verification:'playtest',status:'needs_validation',evidence:[]}
  ];
  fresh.roadmap_scope='none';
  fresh.roadmap_impact='none';

  userPlan.audit_state='audited';
  userPlan.intake_state='unique';
  userPlan.category='05-carriera-e-tempo';
  userPlan.systems=['tempo','eventi'];
  userPlan.watch_paths=['frontend/js/game'];
  userPlan.acceptance_criteria=[{id:'C1',description:'piano tecnico verificato contro il repo',verification:'code_audit',status:'satisfied',evidence:['frontend/js/game — inventario verificato']}];
  userPlan.plan.status='ready';
  userPlan.plan.steps.forEach((s,i)=>{ s.objective=s.title; s.depends_on=i?[`V${i}`]:[]; s.status='planned'; });
  userPlan.roadmap_scope='none';
  userPlan.roadmap_impact='none';

  for (const t of [fresh,userPlan]) fs.writeFileSync(path.join(root,'implementazioni/auto/tasks',`${t.id}.json`),JSON.stringify(t,null,2)+'\n');

  run('finalize');
  run('check');

  tasks=loadTasks();
  const finalPlan=tasks.find(t=>t.id===userPlan.id);
  assert.deepEqual(finalPlan.plan.steps.map(s=>s.id),['V1','V2','V3','V4'],'il finalize non deve espandere un piano definito dall’utente');
  const auto = fs.readFileSync(path.join(root,'implementazioni/auto/README.md'),'utf8');
  assert.ok(auto.includes('Schede importate:** 8'));
  assert.ok(auto.includes('Progetti con piano V1→Vn:** 1'));
  assert.ok(auto.includes('roadmap ufficiale contiene evoluzione del gioco, non bugfix/patch/refactor'));
  assert.equal(fs.readFileSync(path.join(root,'ROADMAP.md'),'utf8'),beforeRoadmap,'il motore locale non deve modificare ROADMAP.md');

  console.log('roadmap-auto v1.3: test OK');
} finally { fs.rmSync(root,{recursive:true,force:true}); }