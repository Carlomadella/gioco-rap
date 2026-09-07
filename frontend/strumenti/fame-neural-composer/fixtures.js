"use strict";

const { BAR_TICKS, createSequence } = require("./core");

const t = (bar, step32) => bar * BAR_TICKS + step32 * 120;
const ev = (type, bar, step32, extra = {}) => ({ type, tick: t(bar, step32), velocity: 0.82, ...extra });

function commonHarmony(rootPitchClass, mode = "minor") {
  return [{ startTick: 0, durationTicks: BAR_TICKS * 8, rootPitchClass, mode }];
}

const barsAggressive = [
  [0.82,0.48,0.72,"A","establish","drop","hook"],
  [0.86,0.42,0.76,"A","variation","stable","hook"],
  [0.72,0.62,0.58,"A","fragment","release","hook"],
  [0.90,0.38,0.84,"A","return","turnaround","hook"],
  [0.58,0.86,0.38,"B","establish","release","verse"],
  [0.62,0.82,0.42,"B","variation","stable","verse"],
  [0.52,0.90,0.30,"B","silence","release","verse"],
  [0.70,0.76,0.66,"B","fragment","build","verse"]
];

const barsRappable = [
  [0.48,0.92,0.30,"A","establish","stable","verse"],
  [0.52,0.90,0.34,"A","variation","stable","verse"],
  [0.45,0.96,0.28,"A","fragment","release","verse"],
  [0.60,0.84,0.50,"A","return","turnaround","verse"],
  [0.55,0.92,0.36,"B","establish","stable","verse"],
  [0.62,0.86,0.44,"B","variation","stable","verse"],
  [0.50,0.96,0.30,"B","silence","release","verse"],
  [0.74,0.76,0.68,"B","return","build","verse"]
];

const barsMelodic = [
  [0.46,0.82,0.32,"A","establish","stable","verse"],
  [0.52,0.78,0.40,"A","variation","stable","verse"],
  [0.58,0.74,0.48,"A","fragment","build","verse"],
  [0.50,0.88,0.44,"A","silence","release","verse"],
  [0.62,0.72,0.58,"B","establish","build","prehook"],
  [0.70,0.62,0.70,"B","variation","build","prehook"],
  [0.78,0.52,0.80,"B","fragment","build","prehook"],
  [0.88,0.44,0.72,"A","return","drop","hook"]
];

function barsFrom(rows) {
  return rows.map((r, index) => ({
    index,
    energy:r[0], vocalSpace:r[1], tension:r[2], motif:r[3], motifTreatment:r[4], transitionIntent:r[5], functionRole:r[6],
    lowEndDensity: Math.max(0.25, r[0] - 0.08), drumDensity: Math.max(0.25, r[0] - 0.03), melodicDensity: Math.max(0.18, 1 - r[1])
  }));
}

function hatsEveryEighth(events, bar, holes = []) {
  [0,4,8,12,16,20,24,28].filter(step => !holes.includes(step)).forEach((step, i) => events.push(ev("hat_closed", bar, step, { velocity: i % 2 ? 0.62 : 0.78 })));
}

function aggressiveEvents() {
  const e = [];
  for (let bar = 0; bar < 8; bar++) hatsEveryEighth(e, bar, bar === 2 ? [20,24] : []);
  [0,1,3].forEach(bar => {
    e.push(ev("kick",bar,0,{velocity:.96,role:"REINFORCE"}), ev("808",bar,0,{note:37,durationTicks:1320,velocity:.92,role:"root"}));
    e.push(ev("kick",bar,11,{velocity:.91,role:"RESPONSE"}), ev("808",bar,14,{note:44,durationTicks:840,velocity:.86,role:"fifth"}));
    e.push(ev("snare",bar,16,{velocity:.91}));
  });
  for (let bar = 4; bar < 8; bar++) {
    e.push(ev("snare",bar,16,{velocity:.88}));
    if (bar !== 6) e.push(ev("808",bar,0,{note:37,durationTicks:1800,velocity:.82,role:"root"}));
    if ([4,5,7].includes(bar)) e.push(ev("kick",bar,bar === 7 ? 14 : 2,{velocity:.84,role:bar === 7 ? "ANTICIPATE" : "RESPONSE"}));
  }
  [0,1,3].forEach(bar => e.push(ev("lead",bar,4,{note:73,durationTicks:480,velocity:.68,motif:"A"}), ev("lead",bar,22,{note:68,durationTicks:360,velocity:.58,motif:"A"})));
  e.push(ev("lead",1,23,{note:70,durationTicks:240,velocity:.55,motif:"A"}));
  return e;
}

function rappableEvents() {
  const e = [];
  for (let bar = 0; bar < 8; bar++) {
    hatsEveryEighth(e, bar, bar % 2 ? [12,28] : [20]);
    e.push(ev("snare",bar,16,{velocity:.86}));
    if (![2,6].includes(bar)) e.push(ev("808",bar,0,{note:34,durationTicks:bar % 2 ? 2280 : 1800,velocity:.78,role:"root"}));
    if ([1,3,5,7].includes(bar)) e.push(ev("kick",bar,12,{velocity:.82,role:"RESPONSE"}));
  }
  e.push(ev("lead",0,4,{note:70,durationTicks:360,velocity:.50,motif:"A"}));
  e.push(ev("lead",1,24,{note:68,durationTicks:360,velocity:.46,motif:"A"}));
  e.push(ev("lead",4,6,{note:73,durationTicks:360,velocity:.48,motif:"B"}));
  e.push(ev("lead",5,26,{note:70,durationTicks:240,velocity:.45,motif:"B"}));
  return e;
}

function melodicEvents() {
  const e = [];
  for (let bar = 0; bar < 8; bar++) {
    hatsEveryEighth(e, bar, bar < 4 ? [8,24] : [12]);
    e.push(ev("snare",bar,16,{velocity:.84}));
    if (bar !== 3) e.push(ev("808",bar,0,{note:40,durationTicks:bar >= 4 ? 1320 : 2040,velocity:.76,role:"root"}));
    if ([2,5,6,7].includes(bar)) e.push(ev("kick",bar,bar === 7 ? 0 : 12,{velocity:.80,role:bar === 7 ? "REINFORCE" : "RESPONSE"}));
  }
  const motif = [[4,76],[12,72],[22,71]];
  [0,1,2].forEach(bar => motif.forEach(([step,note],j) => e.push(ev("lead",bar,step,{note:note + (bar === 1 && j === 2 ? 2 : 0),durationTicks:j===2?600:360,velocity:.58,motif:"A"}))));
  [[4,77],[10,76],[18,72],[27,74]].forEach(([step,note]) => e.push(ev("lead",4,step,{note,durationTicks:360,velocity:.62,motif:"B"})));
  [[4,77],[12,76],[23,74]].forEach(([step,note]) => e.push(ev("lead",5,step,{note,durationTicks:360,velocity:.64,motif:"B"})));
  e.push(ev("lead",6,26,{note:79,durationTicks:480,velocity:.68,motif:"B"}));
  motif.forEach(([step,note]) => e.push(ev("lead",7,step,{note,durationTicks:step===22?720:360,velocity:.70,motif:"A"})));
  return e;
}

const fixtures = [
  createSequence({ meta:{seed:"poc-hook-first-001",genre:"trap",lineage:"cinematic_street",prompt:"hook-first aggressivo"}, timing:{ppq:960,bpm:146,bars:8}, harmony:commonHarmony(1), bars:barsFrom(barsAggressive), events:aggressiveEvents() }),
  createSequence({ meta:{seed:"poc-verse-first-002",genre:"trap",lineage:"dark_minimal",prompt:"verse-first rappabile"}, timing:{ppq:960,bpm:140,bars:8}, harmony:commonHarmony(10), bars:barsFrom(barsRappable), events:rappableEvents() }),
  createSequence({ meta:{seed:"poc-melodic-003",genre:"trap",lineage:"melodic_emo",prompt:"melodico con prehook opzionale"}, timing:{ppq:960,bpm:136,bars:8}, harmony:commonHarmony(4), bars:barsFrom(barsMelodic), events:melodicEvents() })
];

module.exports = { fixtures };
