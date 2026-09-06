/* ADF_BEAT_PROJECT_V1
   Formato dati dei beat: separato dal backend audio. Un progetto deve poter
   essere suonato oggi con Web Audio e domani da un backend desktop nativo. */
"use strict";
(() => {
  const SCHEMA = "adf-beat-v1";
  const clone = x => JSON.parse(JSON.stringify(x));
  const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
    "beat-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,9);

  function track(input){
    const t = input || {};
    return {
      id: t.id || uid(),
      type: t.type || "instrument",
      name: t.name || "Traccia",
      instrument: t.instrument || "",
      volume: Number.isFinite(+t.volume) ? +t.volume : 1,
      pan: Number.isFinite(+t.pan) ? Math.max(-1, Math.min(1, +t.pan)) : 0,
      mute: !!t.mute,
      solo: !!t.solo,
      steps: Array.isArray(t.steps) ? clone(t.steps) : [],
      notes: Array.isArray(t.notes) ? clone(t.notes) : [],
      effects: Array.isArray(t.effects) ? clone(t.effects) : []
    };
  }
  function create(input){
    const p = input || {};
    return {
      schema: SCHEMA,
      id: p.id || uid(),
      name: p.name || "Nuovo beat",
      genre: p.genre || "rap",
      bpm: Math.max(20, Math.min(400, Number(p.bpm) || 120)),
      key: p.key || null,
      bars: Math.max(1, Math.min(256, Math.round(Number(p.bars) || 4))),
      swing: Math.max(0, Math.min(.75, Number(p.swing) || 0)),
      tracks: Array.isArray(p.tracks) ? p.tracks.map(track) : [],
      meta: p.meta && typeof p.meta === "object" ? clone(p.meta) : {},
      legacy: p.legacy && typeof p.legacy === "object" ? clone(p.legacy) : null
    };
  }
  function normalize(p){ return create(p); }
  function validate(p){
    if(!p || typeof p !== "object") return {ok:false, errors:["progetto mancante"]};
    const e = [];
    if(p.schema && p.schema !== SCHEMA) e.push("schema non supportato: " + p.schema);
    if(!(Number(p.bpm) >= 20 && Number(p.bpm) <= 400)) e.push("bpm fuori intervallo");
    if(!Array.isArray(p.tracks)) e.push("tracks deve essere un array");
    return {ok:e.length === 0, errors:e};
  }
  function serialize(p){ return JSON.stringify(normalize(p)); }
  function deserialize(text){ const p = JSON.parse(text); const v = validate(p); if(!v.ok) throw new Error(v.errors.join(", ")); return normalize(p); }
  function fromLegacy(b, extra){
    b = b || {}; extra = extra || {};
    return create({
      id: extra.id,
      name: b.n || extra.name || "Beat",
      genre: b.gen || extra.genre || "rap",
      bpm: extra.bpm || 120,
      bars: extra.bars || 4,
      tracks: [],
      meta: {source:"legacy-procedural", quality:Number(b.q) || 0, price:Number(b.price) || 0},
      legacy: {seed:Number(b.seed) || 0, quality:Number(b.q) || 0, genre:b.gen || "rap"}
    });
  }

  window.ADF_BEAT_PROJECT = {SCHEMA, track, create, normalize, validate, serialize, deserialize, fromLegacy};
})();
