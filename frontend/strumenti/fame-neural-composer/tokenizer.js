"use strict";

const { BAR_TICKS, createSequence, harmonySlicesInBar } = require("./core");
const { TOKEN_TO_ID, ID_TO_TOKEN, DURATION_TICKS, POSITION_TICKS } = require("./vocabulary");
const { validateTokenGrammar } = require("./grammar");

function bin01(value) {
  return Math.max(0, Math.min(9, Math.round(Number(value || 0) * 9)));
}

function unbin01(value) {
  return Math.max(0, Math.min(9, Number(value) || 0)) / 9;
}

function nearestFromSorted(value, values) {
  let best = values[0];
  let bestDistance = Math.abs(value - best);
  for (let i = 1; i < values.length; i++) {
    const distance = Math.abs(value - values[i]);
    if (distance < bestDistance || (distance === bestDistance && values[i] < best)) {
      best = values[i];
      bestDistance = distance;
    }
  }
  return best;
}

function nearestDurationToken(durationTicks) {
  const d = Math.max(DURATION_TICKS[0], Math.min(DURATION_TICKS.at(-1), Math.round(Number(durationTicks) || DURATION_TICKS[0])));
  return nearestFromSorted(d, DURATION_TICKS);
}

function nearestPositionToken(relativeTick) {
  const rel = Math.max(0, Math.min(BAR_TICKS - 1, Math.round(Number(relativeTick) || 0)));
  return nearestFromSorted(rel, POSITION_TICKS);
}

function valueOf(token) {
  return token.slice(token.indexOf("=") + 1);
}

function intValue(token) {
  return Number.parseInt(valueOf(token), 10);
}

function tokenForChord(chord, barIndex) {
  return [
    "<CH_START>",
    `POS=${nearestPositionToken(chord.startTick - barIndex * BAR_TICKS)}`,
    `DUR=${nearestDurationToken(chord.durationTicks)}`,
    `CH_ROOT=${chord.rootPitchClass}`,
    `CH_QUALITY=${chord.quality}`,
    `CH_BASS=${chord.bassPitchClass}`,
    "<CH_END>"
  ];
}

function tokenForEvent(event, barIndex) {
  const tokens = [
    `EV=${event.type}`,
    `POS=${nearestPositionToken(event.tick - barIndex * BAR_TICKS)}`,
    `VEL=${bin01(event.velocity)}`
  ];

  if (event.type === "kick") {
    tokens.push(`KICK_ROLE=${event.role || "none"}`);
  } else if (event.type === "808") {
    tokens.push(
      `NOTE=${Math.max(0, Math.min(127, Math.round(event.note)))}`,
      `DUR=${nearestDurationToken(event.durationTicks)}`,
      `BASS_ROLE=${event.role || "none"}`
    );
    if (Number.isFinite(event.glideTo) && Number.isFinite(event.glideTicks)) {
      tokens.push(
        `GLIDE_TO=${Math.max(0, Math.min(127, Math.round(event.glideTo)))}`,
        `GLIDE_DUR=${nearestDurationToken(event.glideTicks)}`
      );
    } else {
      tokens.push("GLIDE_TO=NONE", "GLIDE_DUR=NONE");
    }
  } else if (event.type === "lead") {
    tokens.push(
      `NOTE=${Math.max(0, Math.min(127, Math.round(event.note)))}`,
      `DUR=${nearestDurationToken(event.durationTicks)}`,
      `EV_MOTIF=${event.motif || "NONE"}`
    );
  } else if (event.type === "harmony") {
    tokens.push(
      `NOTE=${Math.max(0, Math.min(127, Math.round(event.note)))}`,
      `DUR=${nearestDurationToken(event.durationTicks)}`
    );
  }

  tokens.push("<EV_END>");
  return tokens;
}

function encode(input) {
  const seq = createSequence(input);
  const tokens = [
    "<BOS>",
    "GENRE=trap",
    `LINEAGE=${seq.meta.lineage}`,
    `BPM=${seq.timing.bpm}`,
    `KEY_PC=${seq.tonality.rootPitchClass}`,
    `MODE=${seq.tonality.mode}`
  ];

  for (const bar of seq.bars) {
    tokens.push(
      `BAR=${bar.index}`,
      `ENERGY=${bin01(bar.energy)}`,
      `VSPACE=${bin01(bar.vocalSpace)}`,
      `TENSION=${bin01(bar.tension)}`,
      `LOWEND=${bin01(bar.lowEndDensity)}`,
      `DRUMS=${bin01(bar.drumDensity)}`,
      `MELODY=${bin01(bar.melodicDensity)}`,
      `MOTIF=${bar.motif}`,
      `TREAT=${bar.motifTreatment}`,
      `TRANSITION=${bar.transitionIntent}`,
      `FUNCTION=${bar.functionRole}`
    );

    harmonySlicesInBar(seq, bar.index).forEach(chord => tokens.push(...tokenForChord(chord, bar.index)));

    const start = bar.index * BAR_TICKS;
    const end = start + BAR_TICKS;
    seq.events.filter(e => e.tick >= start && e.tick < end).forEach(e => tokens.push(...tokenForEvent(e, bar.index)));
    tokens.push("<BAR_END>");
  }

  tokens.push("<EOS>");
  return tokens;
}

function toIds(tokens) {
  return tokens.map((token, i) => {
    const id = TOKEN_TO_ID.get(token);
    if (id == null) throw new Error(`token fuori vocabolario a indice ${i}: ${token}`);
    return id;
  });
}

function fromIds(ids) {
  return ids.map((id, i) => {
    if (!Number.isInteger(id) || id < 0 || id >= ID_TO_TOKEN.length) throw new Error(`id fuori vocabolario a indice ${i}: ${id}`);
    return ID_TO_TOKEN[id];
  });
}

function mergeHarmonySlices(slices) {
  const sorted = [...slices].sort((a, b) => a.startTick - b.startTick || a.rootPitchClass - b.rootPitchClass);
  const merged = [];
  for (const chord of sorted) {
    const prev = merged.at(-1);
    const sameIdentity = prev
      && prev.rootPitchClass === chord.rootPitchClass
      && prev.quality === chord.quality
      && prev.bassPitchClass === chord.bassPitchClass;
    if (sameIdentity && prev.startTick + prev.durationTicks === chord.startTick) {
      prev.durationTicks += chord.durationTicks;
    } else {
      merged.push({ ...chord });
    }
  }
  return merged;
}

function decode(inputTokens) {
  const grammar = validateTokenGrammar(inputTokens);
  if (!grammar.ok) throw new Error(grammar.error);

  const tokens = [...inputTokens];
  let i = 0;
  const take = () => tokens[i++];

  take(); // BOS
  take(); // GENRE
  const lineage = valueOf(take());
  const bpm = intValue(take());
  const rootPitchClass = intValue(take());
  const mode = valueOf(take());

  const bars = [];
  const events = [];
  const harmonySlices = [];

  while (tokens[i] !== "<EOS>") {
    const barIndex = intValue(take());
    const bar = {
      index: barIndex,
      energy: unbin01(intValue(take())),
      vocalSpace: unbin01(intValue(take())),
      tension: unbin01(intValue(take())),
      lowEndDensity: unbin01(intValue(take())),
      drumDensity: unbin01(intValue(take())),
      melodicDensity: unbin01(intValue(take())),
      motif: valueOf(take()),
      motifTreatment: valueOf(take()),
      transitionIntent: valueOf(take()),
      functionRole: valueOf(take())
    };
    bars.push(bar);

    while (tokens[i] !== "<BAR_END>") {
      if (tokens[i] === "<CH_START>") {
        take();
        const pos = intValue(take());
        const durationTicks = intValue(take());
        const chord = {
          startTick: barIndex * BAR_TICKS + pos,
          durationTicks,
          rootPitchClass: intValue(take()),
          quality: valueOf(take()),
          bassPitchClass: intValue(take())
        };
        take(); // CH_END
        harmonySlices.push(chord);
        continue;
      }

      const type = valueOf(take());
      const pos = intValue(take());
      const velocity = unbin01(intValue(take()));
      const event = { type, tick: barIndex * BAR_TICKS + pos, velocity };

      if (type === "kick") {
        event.role = valueOf(take());
        if (event.role === "none") delete event.role;
      } else if (type === "808") {
        event.note = intValue(take());
        event.durationTicks = intValue(take());
        event.role = valueOf(take());
        if (event.role === "none") delete event.role;
        const glideTo = take();
        const glideDur = take();
        if (glideTo !== "GLIDE_TO=NONE") {
          event.glideTo = intValue(glideTo);
          event.glideTicks = intValue(glideDur);
        }
      } else if (type === "lead") {
        event.note = intValue(take());
        event.durationTicks = intValue(take());
        event.motif = valueOf(take());
        if (event.motif === "NONE") delete event.motif;
      } else if (type === "harmony") {
        event.note = intValue(take());
        event.durationTicks = intValue(take());
      }

      take(); // EV_END
      events.push(event);
    }

    take(); // BAR_END
  }
  take(); // EOS

  return createSequence({
    meta: { seed: "decoded", source: "tokenizer", genre: "trap", lineage, prompt: "" },
    timing: { ppq: 960, bpm, bars: bars.length },
    tonality: { rootPitchClass, mode },
    harmony: mergeHarmonySlices(harmonySlices),
    bars,
    events
  });
}

module.exports = {
  encode,
  decode,
  toIds,
  fromIds,
  bin01,
  unbin01,
  nearestDurationToken,
  nearestPositionToken,
  mergeHarmonySlices
};
