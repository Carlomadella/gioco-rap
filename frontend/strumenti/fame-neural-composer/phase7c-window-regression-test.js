"use strict";
const assert = require("node:assert/strict");
const { resolveWindow } = require("./dataset/drum-view-v2");
const source = {
  sourcePpq: 960,
  timeSignatures: [
    { tick: 0, numerator: 4, denominator: 4 },
    { tick: 10000, numerator: 3, denominator: 4 }
  ]
};
const before = resolveWindow(source, { sourceStartTick: 0, sourceEndTick: 7680 });
assert.equal(before.meter.numerator, 4);
assert.equal(before.sourceEndTick, 7680);
const after = resolveWindow(source, { sourceStartTick: 10000, bars: 2 });
assert.equal(after.meter.numerator, 3);
assert.equal(after.sourceEndTick, 15760);
assert.throws(() => resolveWindow(source, { sourceStartTick: 9000, sourceEndTick: 12000 }), /metro stabile/);
assert.throws(() => resolveWindow(source, { startBar: 3 }), /startBar ambiguo/);
assert.equal(resolveWindow(source, { startBar: 1, bars: 1 }).sourceStartTick, 3840);
assert.throws(() => resolveWindow(source, { sourceStartTick: 5, sourceEndTick: 5 }), /deve seguire/);
assert.throws(() => resolveWindow(source, { sourceStartTick: "bad" }), /finito/);
console.log("DRUM VIEW WINDOW REGRESSION: PASS (before, inside, after, mixed-meter startBar, invalid ticks)");
