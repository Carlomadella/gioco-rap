#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const MODEL = process.env.ADF_LOCAL_AI_MODEL || 'gpt-oss:20b';
const BASE_URL = String(process.env.ADF_LOCAL_AI_BASE_URL || 'http://127.0.0.1:11434/v1').replace(/\/+$/, '');
const API_KEY = process.env.ADF_LOCAL_AI_API_KEY || 'ollama';
const MAX_TURNS = Math.max(2, Math.min(Number(process.env.ADF_LOCAL_AI_MAX_TURNS || 18), 40));
const TIMEOUT_MS = Math.max(30000, Math.min(Number(process.env.ADF_LOCAL_AI_TIMEOUT_MS || 600000), 1800000));
const TASK_KEYS = new Set([
  'title', 'category', 'audit_state', 'intake_state', 'related_task_ids', 'intake_note',
  'roadmap_scope', 'roadmap_impact', 'roadmap_note', 'plan', 'current_state', 'systems',
  'watch_paths', 'acceptance_criteria', 'risks', 'notes'
]);

function arg(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
}

function clip(value, max = 36000) {
  const text = String(value ?? '');
  return text.length <= max ? text : text.slice(0, max) + '\n...[troncato]';
}

function git(root, args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function safePath(root, value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('path mancante');
  const rel = value.replace(/\\/g, '/').replace(/^\.\//, '');
  const base = path.resolve(root);
  const abs = path.resolve(base, rel);
  if (path.isAbsolute(value) || !(abs === base || abs.startsWith(base + path.sep))) {
    throw new Error('path fuori repository: ' + value);
  }
  return { rel, abs };
}

function readIds(file) {
  if (!file || !fs.existsSync(file)) throw new Error('file ids mancante');
  const ids = fs.readFileSync(file, 'utf8').split(/\r?\n/).map(v => v.trim()).filter(Boolean);
  if (!ids.length) throw new Error('batch ids vuoto');
  for (const id of ids) {
    if (!/^ADF-(LEG|NEW)-[A-F0-9]{12}$/.test(id)) throw new Error('id non valido: ' + id);
  }
  return ids;
}

function makeRuntime(root, mode, ids) {
  const allowedIds = new Set(ids);
  const taskDir = path.join(root, 'implementazioni', 'auto', 'tasks');

  function readFile(args) {
    const file = safePath(root, args.path);
    if (!fs.existsSync(file.abs)) throw new Error('file inesistente: ' + file.rel);
    const lines = fs.readFileSync(file.abs, 'utf8').split(/\r?\n/);
    const start = Math.max(1, Number(args.start_line || 1));
    const end = Math.min(lines.length, Number(args.end_line || start + 219));
    return clip(
      file.rel + ' [' + start + '-' + end + '/' + lines.length + ']\n' +
      lines.slice(start - 1, end).map((line, i) => (start + i) + ': ' + line).join('\n')
    );
  }

  function listFiles(args) {
    const prefix = String(args.path_prefix || '').replace(/\\/g, '/').replace(/^\.\//, '');
    const contains = String(args.contains || '').toLowerCase();
    const limit = Math.max(1, Math.min(Number(args.limit || 120), 300));
    let rows = git(root, ['ls-files']).split(/\r?\n/).filter(Boolean);
    if (prefix) rows = rows.filter(v => v.startsWith(prefix));
    if (contains) rows = rows.filter(v => v.toLowerCase().includes(contains));
    const shown = rows.slice(0, limit);
    return shown.join('\n') + (rows.length > limit ? '\n... ' + (rows.length - limit) + ' altri file' : '');
  }

  function searchText(args) {
    const query = String(args.query || '').trim();
    if (!query) throw new Error('query vuota');
    const prefix = String(args.path_prefix || '').replace(/\\/g, '/').replace(/^\.\//, '');
    const cmd = ['grep', '-n', '-I', '-F', '--', query];
    if (prefix) cmd.push(prefix);
    try {
      const output = git(root, cmd);
      return clip(output || '(nessun risultato)');
    } catch (error) {
      const output = String(error.stdout || '');
      return output ? clip(output) : '(nessun risultato)';
    }
  }

  function gitDiff(args) {
    const cmd = ['diff', 'HEAD^', 'HEAD', '--'];
    if (args.path) cmd.push(safePath(root, args.path).rel);
    try {
      return clip(git(root, cmd) || '(nessuna differenza)');
    } catch (error) {
      return clip(String(error.stdout || error.stderr || error.message));
    }
  }

  function updateTask(args) {
    if (!['audit', 'repair'].includes(mode)) throw new Error('update_task non consentito in modalità ' + mode);
    const id = String(args.id || '');
    if (!allowedIds.has(id)) throw new Error('task non autorizzata: ' + id);
    if (!args.updates || typeof args.updates !== 'object' || Array.isArray(args.updates)) {
      throw new Error('updates deve essere un oggetto');
    }
    const bad = Object.keys(args.updates).filter(key => !TASK_KEYS.has(key));
    if (bad.length) throw new Error('campi non autorizzati: ' + bad.join(', '));
    const file = path.join(taskDir, id + '.json');
    const before = JSON.parse(fs.readFileSync(file, 'utf8'));
    const next = JSON.parse(JSON.stringify(before));
    for (const [key, value] of Object.entries(args.updates)) next[key] = value;
    next.id = before.id;
    next.origin = before.origin;
    next.source = before.source;
    next.schema_version = before.schema_version;
    fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n', 'utf8');
    return 'aggiornata ' + id + ': ' + Object.keys(args.updates).join(', ');
  }

  function replaceText(args) {
    if (mode !== 'roadmap') throw new Error('replace_text non consentito in modalità ' + mode);
    const file = safePath(root, args.path);
    if (file.rel !== 'ROADMAP.md') throw new Error('si può modificare solo ROADMAP.md');
    const oldText = String(args.old_text || '');
    const newText = String(args.new_text || '');
    if (!oldText) throw new Error('old_text vuoto');
    const text = fs.readFileSync(file.abs, 'utf8');
    const first = text.indexOf(oldText);
    if (first < 0) throw new Error('old_text non trovato');
    if (text.indexOf(oldText, first + oldText.length) >= 0) throw new Error('old_text non univoco');
    fs.writeFileSync(file.abs, text.slice(0, first) + newText + text.slice(first + oldText.length), 'utf8');
    return 'ROADMAP.md aggiornata';
  }

  return { read_file: readFile, list_files: listFiles, search_text: searchText, git_diff: gitDiff, update_task: updateTask, replace_text: replaceText };
}

function toolDefinitions(mode) {
  const defs = [
    ['read_file', 'Legge linee di un file della repository', {
      path: { type: 'string' }, start_line: { type: 'integer' }, end_line: { type: 'integer' }
    }, ['path']],
    ['list_files', 'Elenca file tracciati, filtrabili per prefisso o sottostringa', {
      path_prefix: { type: 'string' }, contains: { type: 'string' }, limit: { type: 'integer' }
    }, []],
    ['search_text', 'Cerca una stringa letterale nei file tracciati', {
      query: { type: 'string' }, path_prefix: { type: 'string' }
    }, ['query']],
    ['git_diff', 'Mostra la diff HEAD^..HEAD, opzionalmente limitata a un percorso', {
      path: { type: 'string' }
    }, []]
  ];
  if (['audit', 'repair'].includes(mode)) {
    defs.push(['update_task', 'Aggiorna esclusivamente i campi audit autorizzati di una task del batch', {
      id: { type: 'string' }, updates: { type: 'object', additionalProperties: true }
    }, ['id', 'updates']]);
  }
  if (mode === 'roadmap') {
    defs.push(['replace_text', 'Sostituisce un blocco univoco esclusivamente in ROADMAP.md', {
      path: { type: 'string', enum: ['ROADMAP.md'] }, old_text: { type: 'string' }, new_text: { type: 'string' }
    }, ['path', 'old_text', 'new_text']]);
  }
  return defs.map(([name, description, properties, required]) => ({
    type: 'function',
    function: {
      name,
      description,
      parameters: { type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) }
    }
  }));
}

function systemPrompt(mode, ids) {
  const common = [
    "Sei l'agente locale controllato di Anni di Fame.",
    "La repository checkout è la fonte di verità.",
    "Usa solo i tool forniti: niente shell, commit, pull o push.",
    "Prima di scrivere verifica fonte, codice pertinente e sistemi collegati.",
    "Non inventare file, simboli, test, evidenze o stato del codice.",
    "Il validatore deterministico decide il PASS finale."
  ];
  if (mode === 'audit') {
    common.push("Modalità AUDIT. Task autorizzate: " + ids.join(', ') + ". Aggiorna solo queste task con update_task. audit_state=audited solo dopo verifica reale.");
  } else if (mode === 'repair') {
    common.push("Modalità REPAIR. Task autorizzate: " + ids.join(', ') + ". Correggi esclusivamente errori del validatore senza inventare evidenze.");
  } else {
    common.push("Modalità ROADMAP. Puoi modificare solo ROADMAP.md con replace_text. Applica solo buchi minori realmente supportati; se è già coperto non modificare nulla.");
  }
  return common.join(' ');
}

async function chat(messages, tools) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(API_KEY ? { authorization: 'Bearer ' + API_KEY } : {})
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.1,
        stream: false
      }),
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + clip(text, 3000));
    const data = JSON.parse(text);
    const message = data?.choices?.[0]?.message;
    if (!message) throw new Error('risposta senza choices[0].message');
    return message;
  } finally {
    clearTimeout(timer);
  }
}

async function runAgent(root, mode, ids, prompt, validation) {
  const runtime = makeRuntime(root, mode, ids);
  const tools = toolDefinitions(mode);
  const user = mode === 'repair'
    ? prompt + '\n\nERRORI DEL VALIDATORE:\n' + (validation || '(non disponibili)')
    : prompt;
  const messages = [
    { role: 'system', content: systemPrompt(mode, ids) },
    { role: 'user', content: user }
  ];
  let toolCalls = 0;

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const message = await chat(messages, tools);
    const calls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
    messages.push({
      role: 'assistant',
      content: message.content ?? '',
      ...(calls.length ? { tool_calls: calls } : {})
    });

    if (!calls.length) {
      console.log('[roadmap-local-agent] fine turno=' + turn + ' tool_calls=' + toolCalls);
      if (String(message.content || '').trim()) console.log(clip(message.content, 5000));
      return;
    }

    for (const call of calls) {
      toolCalls++;
      const name = call?.function?.name;
      let args = {};
      try {
        args = typeof call?.function?.arguments === 'string'
          ? JSON.parse(call.function.arguments || '{}')
          : (call?.function?.arguments || {});
        if (!runtime[name]) throw new Error('tool non consentito: ' + name);
        const output = runtime[name](args);
        messages.push({ role: 'tool', tool_call_id: call.id || ('tool-' + toolCalls), content: clip(output) });
      } catch (error) {
        messages.push({ role: 'tool', tool_call_id: call.id || ('tool-' + toolCalls), content: 'ERRORE TOOL: ' + error.message });
      }
    }
  }
  throw new Error('limite turni superato (' + MAX_TURNS + ')');
}

function selfTest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'adf-roadmap-local-agent-'));
  const id = 'ADF-NEW-ABCDEF123456';
  fs.mkdirSync(path.join(root, 'implementazioni', 'auto', 'tasks'), { recursive: true });
  fs.writeFileSync(path.join(root, 'ROADMAP.md'), '# Roadmap\nTESTO\n', 'utf8');
  fs.writeFileSync(path.join(root, 'demo.js'), 'const provaLocale = true;\n', 'utf8');
  fs.writeFileSync(path.join(root, 'implementazioni', 'auto', 'tasks', id + '.json'), JSON.stringify({
    schema_version: 5,
    id,
    origin: 'inbox',
    source: { text: 'x', file: 'x' },
    audit_state: 'not_audited'
  }, null, 2));
  execFileSync('git', ['init'], { cwd: root, stdio: 'ignore' });
  execFileSync('git', ['add', '.'], { cwd: root, stdio: 'ignore' });

  const audit = makeRuntime(root, 'audit', [id]);
  if (!audit.list_files({ contains: 'demo' }).includes('demo.js')) throw new Error('list_files KO');
  if (!audit.search_text({ query: 'provaLocale' }).includes('demo.js')) throw new Error('search_text KO');
  audit.update_task({ id, updates: { audit_state: 'audited', systems: ['frontend'] } });
  const task = JSON.parse(fs.readFileSync(path.join(root, 'implementazioni', 'auto', 'tasks', id + '.json'), 'utf8'));
  if (task.id !== id || task.origin !== 'inbox' || task.source.text !== 'x' || task.audit_state !== 'audited') throw new Error('update_task KO');

  let blocked = false;
  try { audit.update_task({ id, updates: { source: { text: 'y' } } }); } catch { blocked = true; }
  if (!blocked) throw new Error('protezione source KO');

  const roadmap = makeRuntime(root, 'roadmap', []);
  roadmap.replace_text({ path: 'ROADMAP.md', old_text: 'TESTO', new_text: 'NUOVO' });
  if (!fs.readFileSync(path.join(root, 'ROADMAP.md'), 'utf8').includes('NUOVO')) throw new Error('replace_text KO');

  blocked = false;
  try { safePath(root, '../fuori'); } catch { blocked = true; }
  if (!blocked) throw new Error('safePath KO');

  fs.rmSync(root, { recursive: true, force: true });
  console.log('roadmap-local-agent: self-test OK');
}

async function main() {
  const argv = process.argv.slice(2);
  const mode = argv[0];
  if (mode === 'self-test') return selfTest();
  if (!['audit', 'repair', 'roadmap'].includes(mode)) {
    throw new Error('uso: roadmap-local-agent.js <audit|repair|roadmap|self-test> --prompt-file FILE [--ids-file FILE] [--validation-file FILE]');
  }

  const root = path.resolve(process.env.ADF_ROOT || path.join(__dirname, '..'));
  const promptFile = arg(argv, '--prompt-file');
  const idsFile = arg(argv, '--ids-file');
  const validationFile = arg(argv, '--validation-file');
  if (!promptFile || !fs.existsSync(promptFile)) throw new Error('prompt file mancante');
  const prompt = fs.readFileSync(promptFile, 'utf8');
  if (!prompt.trim()) {
    console.log('[roadmap-local-agent] prompt vuoto');
    return;
  }
  const ids = mode === 'roadmap' ? [] : readIds(idsFile);
  const validation = validationFile && fs.existsSync(validationFile) ? fs.readFileSync(validationFile, 'utf8') : '';

  console.log('[roadmap-local-agent] mode=' + mode + ' model=' + MODEL + ' endpoint=' + BASE_URL + ' tasks=' + ids.length);
  await runAgent(root, mode, ids, prompt, validation);
}

main().catch(error => {
  console.error('[roadmap-local-agent] ERRORE: ' + (error.stack || error));
  process.exit(2);
});
