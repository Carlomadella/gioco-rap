const fs = require('fs');
const path = require('path');

const root = __dirname;
const required = [
  'index.html',
  'style.css',
  'app.js',
  path.join('vendor','three.js'),
  path.join('vendor','OrbitControls.js'),
  path.join('vendor','makehuman.js'),
  path.join('data','resources.json'),
  path.join('data','targets','targets.bin')
];

let fail = 0;
for (const rel of required) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error('FAIL manca:', rel);
    fail++;
  } else {
    console.log('OK  ', rel);
  }
}

const resourcesPath = path.join(root, 'data', 'resources.json');
if (fs.existsSync(resourcesPath)) {
  const r = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
  const proxies = Array.isArray(r.proxies) ? r.proxies.length : 0;
  const skins = Array.isArray(r.skins) ? r.skins.length : 0;
  console.log('INFO proxy registrati:', proxies);
  console.log('INFO skin registrate:', skins);
  if (proxies < 50) { console.error('FAIL catalogo proxy troppo piccolo'); fail++; }
  if (skins < 10) { console.error('FAIL catalogo skin troppo piccolo'); fail++; }
}

const targetPath = path.join(root, 'data', 'targets', 'targets.bin');
if (fs.existsSync(targetPath)) {
  const mb = fs.statSync(targetPath).size / 1024 / 1024;
  console.log('INFO targets.bin:', mb.toFixed(1), 'MB');
  if (mb < 100) { console.error('FAIL targets.bin sembra incompleto'); fail++; }
}

const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
for (const token of [
  'state.human.modifiers.children',
  'state.human.proxies.children',
  'state.human.loadTargets',
  'proxy.toggle',
  'state.human.setSkin',
  'macrodetails/Gender'
]) {
  if (!app.includes(token)) {
    console.error('FAIL app.js non contiene:', token);
    fail++;
  }
}

if (fail) {
  console.error(`\nVERIFICA FALLITA: ${fail} problema/i`);
  process.exit(1);
}
console.log('\nVERIFICA EDITOR: OK');
