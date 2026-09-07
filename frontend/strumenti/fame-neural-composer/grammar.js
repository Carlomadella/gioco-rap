"use strict";

const { TOKENS } = require("./vocabulary");
const { EVENT_TYPE_ORDER } = require("./core");

const PREFIX_CACHE = new Map();
function tokensWithPrefix(prefix) {
  if (!PREFIX_CACHE.has(prefix)) PREFIX_CACHE.set(prefix, Object.freeze(TOKENS.filter(t => t.startsWith(prefix))));
  return PREFIX_CACHE.get(prefix);
}

function grammarError(index, token, expected) {
  const err = new Error(`token grammar non valida a indice ${index}: ${String(token)}; atteso ${expected}`);
  err.index = index;
  err.token = token;
  err.expected = expected;
  return err;
}

function analyzePrefix(inputTokens) {
  const tokens = Array.isArray(inputTokens) ? inputTokens : [];
  let i = 0;

  function takeAllowed(allowed, expected) {
    if (i >= tokens.length) return { pending: true, allowed: [...allowed], expected };
    const token = tokens[i];
    if (!allowed.includes(token)) throw grammarError(i, token, expected);
    i += 1;
    return { pending: false, token };
  }

  function takeExact(token) {
    return takeAllowed([token], token);
  }

  function takePrefix(prefix) {
    return takeAllowed(tokensWithPrefix(prefix), `${prefix}*`);
  }

  function pending(result) {
    if (!result.pending) return null;
    return { complete: false, allowed: result.allowed, expected: result.expected, index: i };
  }

  let r = takeExact("<BOS>"); if (r.pending) return pending(r);
  r = takeExact("GENRE=trap"); if (r.pending) return pending(r);
  r = takePrefix("LINEAGE="); if (r.pending) return pending(r);
  r = takePrefix("BPM="); if (r.pending) return pending(r);
  r = takePrefix("KEY_PC="); if (r.pending) return pending(r);
  r = takePrefix("MODE="); if (r.pending) return pending(r);

  let completedBars = 0;

  function parseChord() {
    let x = takeExact("<CH_START>"); if (x.pending) return pending(x);
    x = takePrefix("POS="); if (x.pending) return pending(x);
    x = takePrefix("DUR="); if (x.pending) return pending(x);
    x = takePrefix("CH_ROOT="); if (x.pending) return pending(x);
    x = takePrefix("CH_QUALITY="); if (x.pending) return pending(x);
    x = takePrefix("CH_BASS="); if (x.pending) return pending(x);
    x = takeExact("<CH_END>"); if (x.pending) return pending(x);
    return null;
  }

  function parseEvent() {
    let x = takeAllowed(EVENT_TYPE_ORDER.map(type => `EV=${type}`), "EV=<type>");
    if (x.pending) return pending(x);
    const type = x.token.slice(3);

    x = takePrefix("POS="); if (x.pending) return pending(x);
    x = takePrefix("VEL="); if (x.pending) return pending(x);

    if (type === "kick") {
      x = takePrefix("KICK_ROLE="); if (x.pending) return pending(x);
    } else if (type === "808") {
      x = takePrefix("NOTE="); if (x.pending) return pending(x);
      x = takePrefix("DUR="); if (x.pending) return pending(x);
      x = takePrefix("BASS_ROLE="); if (x.pending) return pending(x);
      x = takeAllowed(["GLIDE_TO=NONE", ...tokensWithPrefix("GLIDE_TO=").filter(t => t !== "GLIDE_TO=NONE")], "GLIDE_TO=<note|NONE>");
      if (x.pending) return pending(x);
      const hasGlide = x.token !== "GLIDE_TO=NONE";
      x = takeAllowed(hasGlide ? tokensWithPrefix("GLIDE_DUR=").filter(t => t !== "GLIDE_DUR=NONE") : ["GLIDE_DUR=NONE"], hasGlide ? "GLIDE_DUR=<ticks>" : "GLIDE_DUR=NONE");
      if (x.pending) return pending(x);
    } else if (type === "lead") {
      x = takePrefix("NOTE="); if (x.pending) return pending(x);
      x = takePrefix("DUR="); if (x.pending) return pending(x);
      x = takePrefix("EV_MOTIF="); if (x.pending) return pending(x);
    } else if (type === "harmony") {
      x = takePrefix("NOTE="); if (x.pending) return pending(x);
      x = takePrefix("DUR="); if (x.pending) return pending(x);
    }

    x = takeExact("<EV_END>"); if (x.pending) return pending(x);
    return null;
  }

  while (true) {
    if (completedBars > 0) {
      if (i >= tokens.length) {
        return { complete: false, allowed: ["<EOS>", `BAR=${completedBars}`], expected: `<EOS> oppure BAR=${completedBars}`, index: i };
      }
      if (tokens[i] === "<EOS>") {
        i += 1;
        if (i !== tokens.length) throw grammarError(i, tokens[i], "fine sequenza");
        return { complete: true, allowed: [], expected: null, index: i };
      }
    }

    if (completedBars >= 128) throw grammarError(i, tokens[i], "<EOS> (massimo 128 barre)");
    r = takeExact(`BAR=${completedBars}`); if (r.pending) return pending(r);

    for (const prefix of ["ENERGY=", "VSPACE=", "TENSION=", "LOWEND=", "DRUMS=", "MELODY=", "MOTIF=", "TREAT=", "TRANSITION=", "FUNCTION="]) {
      r = takePrefix(prefix); if (r.pending) return pending(r);
    }

    while (true) {
      if (i >= tokens.length) {
        return {
          complete: false,
          allowed: ["<CH_START>", ...EVENT_TYPE_ORDER.map(type => `EV=${type}`), "<BAR_END>"],
          expected: "<CH_START>, EV=<type> oppure <BAR_END>",
          index: i
        };
      }

      const token = tokens[i];
      if (token === "<CH_START>") {
        const p = parseChord(); if (p) return p;
      } else if (token.startsWith("EV=")) {
        const p = parseEvent(); if (p) return p;
      } else if (token === "<BAR_END>") {
        i += 1;
        completedBars += 1;
        break;
      } else {
        throw grammarError(i, token, "<CH_START>, EV=<type> oppure <BAR_END>");
      }
    }
  }
}

function validateTokenGrammar(tokens) {
  try {
    const state = analyzePrefix(tokens);
    if (!state.complete) {
      return { ok: false, error: `sequenza incompleta a indice ${state.index}: atteso ${state.expected}`, index: state.index, allowed: state.allowed };
    }
    return { ok: true, error: null, index: state.index, allowed: [] };
  } catch (error) {
    return { ok: false, error: error.message, index: error.index, allowed: [] };
  }
}

function allowedNextTokens(prefixTokens) {
  try {
    return analyzePrefix(prefixTokens).allowed;
  } catch (_error) {
    return [];
  }
}

module.exports = { validateTokenGrammar, allowedNextTokens, analyzePrefix };
