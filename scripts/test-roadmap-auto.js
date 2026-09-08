#!/usr/bin/env node
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');
const SCRIPT = path.resolve(__dirname, 'roadmap-auto.js');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'adf-roadmap-v12-'));
function write(p, text) { const f=path.join(root,p); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,text,'utf8'); }
function run(cmd, extraEnv={}) { return execFileSync(process.execPath,[SCRIPT,cmd],{cwd:root,env:{...process.env,ADF_ROOT:root,ADF_CHANGED_FILES:'',...extraEnv},encoding:'utf8'}); }
try {
  write('ROADMAP.md','# Roadmap ufficiale\n');
  write('implementazioni/README.md',`# I punti\n\n| | punto | stato | dove |\n| --- | --- | --- | --- |\n| **1** | Cosa si può simulare | fatto | [carriera-e-tempo](05-carriera-e-tempo.md) |\n| **22** | L'energia cresce col livello | da fare | [carriera-e-tempo](05-carriera-e-tempo.md) |\n| **42** | Il telefono è un iPhone vero | in parte | [interfaccia-e-telefono](02-interfaccia-e-telefono.md) |\n| **—** | La giornata | risposto, da fare | [carriera-e-tempo](05-carriera-e-tempo.md) |\n`);
  write('implementazioni/implementazioni.md',`# Punti nuovi\n\n### Inbox automatica\n<!-- ADF-AUTO-INBOX:BEGIN -->\n- [ ] voglio cambiare il tempo del turno in fabbrica\n- [ ] L'energia cresce col livello\n<!-- ADF-AUTO-INBOX:END -->\n`);
  write('implementazioni/05-carriera-e-tempo.md','# Carriera\n');
  write('implementazioni/02-interfaccia-e-telefono.md','# UI\n');
  run('bootstrap');
  let taskFiles = fs.readdirSync(path.join(root,'implementazioni/auto/tasks')).filter(x=>x.endsWith('.json'));
  assert.equal(taskFiles.length,6,'4 legacy + 2 inbox devono essere importate');
  const tasks = taskFiles.map(n=>JSON.parse(fs.readFileSync(path.join(root,'implementazioni/auto/tasks',n),'utf8')));
  assert.equal(tasks.filter(t=>t.origin==='legacy').length,4);
  assert.equal(tasks.filter(t=>t.origin==='inbox').length,2);
  const duplicate = tasks.find(t=>t.origin==='inbox' && t.source.text === "L'energia cresce col livello");
  assert.ok(duplicate,'duplicato esatto deve esistere come record di intake');
  assert.equal(duplicate.intake_state,'duplicate');
  assert.equal(duplicate.audit_state,'audited');
  assert.equal(duplicate.related_task_ids.length,1);
  assert.equal(duplicate.acceptance_criteria.length,0);
  const beforeRoadmap = fs.readFileSync(path.join(root,'ROADMAP.md'),'utf8');
  const fresh = tasks.find(t=>t.origin==='inbox' && t.intake_state==='pending');
  fresh.audit_state='audited';
  fresh.intake_state='overlap';
  fresh.related_task_ids=[duplicate.related_task_ids[0]];
  fresh.intake_note='Esempio di estensione collegata alla task energia; conserva solo il delta.';
  fresh.category='05-carriera-e-tempo';
  fresh.systems=['tempo','energia','economia'];
  fresh.watch_paths=['frontend/js/game/actions.js'];
  fresh.acceptance_criteria=[
    {id:'C1',description:'durata corretta',verification:'code_audit',status:'satisfied',evidence:['frontend/js/game/actions.js — turnoFabbrica']},
    {id:'C2',description:'bilanciamento',verification:'playtest',status:'needs_validation',evidence:[]}
  ];
  fs.writeFileSync(path.join(root,'implementazioni/auto/tasks',`${fresh.id}.json`),JSON.stringify(fresh,null,2)+'\n');
  run('finalize');
  run('check');
  const inbox = fs.readFileSync(path.join(root,'implementazioni/implementazioni.md'),'utf8');
  assert.ok(inbox.includes(`- [x] voglio cambiare il tempo del turno in fabbrica <!-- ADF-TASK:${fresh.id} --> — **🟡 ESTENSIONE`));
  assert.ok(inbox.includes(`- [x] L'energia cresce col livello <!-- ADF-TASK:${duplicate.id} --> — **🔁 DUPLICATA`));
  const auto = fs.readFileSync(path.join(root,'implementazioni/auto/README.md'),'utf8');
  assert.ok(auto.includes('Schede importate:** 6'));
  assert.ok(auto.includes('Duplicati intercettati:** 1'));
  assert.ok(auto.includes('Estensioni/sovrapposizioni:** 1'));
  assert.ok(auto.includes('`ROADMAP.md` resta la roadmap ufficiale'));
  assert.equal(fs.readFileSync(path.join(root,'ROADMAP.md'),'utf8'),beforeRoadmap,'ROADMAP.md non deve cambiare');
  console.log('roadmap-auto v1.2: test OK');
} finally { fs.rmSync(root,{recursive:true,force:true}); }