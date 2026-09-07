"use strict";

const { BAR_TICKS, createSequence, eventsInBar } = require("./core");

function eventSignature(seq, barIndex, type) {
  return eventsInBar(seq, barIndex, type).map(e => {
    const rel = e.tick - barIndex * BAR_TICKS;
    const dur = e.durationTicks || 0;
    const note = Number.isFinite(e.note) ? e.note : "-";
    const glide = Number.isFinite(e.glideTo) ? e.glideTo : "-";
    return `${type}:${rel}:${note}:${dur}:${glide}`;
  }).join("|");
}

function fullBarSignature(seq, barIndex) {
  return seq.events
    .filter(e => e.tick >= barIndex * BAR_TICKS && e.tick < (barIndex + 1) * BAR_TICKS)
    .map(e => `${e.type}:${e.tick - barIndex * BAR_TICKS}:${e.note ?? "-"}:${e.durationTicks ?? "-"}`)
    .join("|");
}

function density(seq, barIndex, types) {
  return seq.events.filter(e => {
    const b = Math.floor(e.tick / BAR_TICKS);
    return b === barIndex && types.includes(e.type);
  }).length;
}

function blockSignature(seq, start, size = 4) {
  return Array.from({ length: size }, (_, i) => fullBarSignature(seq, start + i)).join("||");
}

function audit(input) {
  const seq = createSequence(input);
  const findings = [];
  const add = (code, severity, message, bars) => findings.push({ code, severity, message, bars });

  // Motivo dichiarato uguale + eventi melodici identici per 3 barre consecutive.
  let literalRun = 1;
  for (let i = 1; i < seq.bars.length; i++) {
    const a = seq.bars[i - 1], b = seq.bars[i];
    const sameMotif = a.motif !== "NONE" && a.motif === b.motif;
    const prevLead = eventSignature(seq, i - 1, "lead");
    const currLead = eventSignature(seq, i, "lead");
    const sameLead = !!prevLead && prevLead === currLead;
    literalRun = sameMotif && sameLead ? literalRun + 1 : 1;
    if (literalRun === 3) add("MOTIF_LITERAL_REPEAT", "warning", "Motivo ripetuto letteralmente per almeno 3 barre: serve variazione, sottrazione o risposta.", [i - 2, i]);
  }

  // Blocchi da 4 barre esattamente identici.
  for (let start = 4; start + 3 < seq.bars.length; start += 4) {
    const current = blockSignature(seq, start);
    for (let prev = 0; prev + 3 < start; prev += 4) {
      if (current && current === blockSignature(seq, prev)) {
        add("BLOCK_IDENTICAL", "warning", `Blocco ${start}-${start + 3} identico a ${prev}-${prev + 3}.`, [prev, start + 3]);
        break;
      }
    }
  }

  // Ritorno hook: stessa funzione ma nessuna evoluzione di treatment/densità o eventi.
  const hookStarts = [];
  for (let i = 0; i < seq.bars.length; i++) {
    if (seq.bars[i].functionRole === "hook" && (i === 0 || seq.bars[i - 1].functionRole !== "hook")) hookStarts.push(i);
  }
  if (hookStarts.length > 1) {
    const first = hookStarts[0], second = hookStarts[1];
    const size = Math.min(4, seq.bars.length - second);
    if (blockSignature(seq, first, size) === blockSignature(seq, second, size)) {
      add("HOOK_RETURN_NO_EVOLUTION", "warning", "Il ritorno dell'hook è una copia letterale del primo ingresso.", [first, second + size - 1]);
    }
  }

  // Cambio improvviso grammatica 808 senza intenzione di transizione.
  for (let i = 1; i < seq.bars.length; i++) {
    const prev = eventsInBar(seq, i - 1, "808");
    const curr = eventsInBar(seq, i, "808");
    const prevDur = prev.length ? prev.reduce((s, e) => s + (e.durationTicks || 0), 0) / prev.length : 0;
    const currDur = curr.length ? curr.reduce((s, e) => s + (e.durationTicks || 0), 0) / curr.length : 0;
    const countJump = Math.abs(curr.length - prev.length) >= 3;
    const durationRatio = prevDur && currDur ? Math.max(prevDur, currDur) / Math.max(1, Math.min(prevDur, currDur)) : 1;
    const intent = seq.bars[i].transitionIntent;
    if ((countJump || durationRatio >= 3) && !["build", "release", "drop", "turnaround"].includes(intent)) {
      add("ABRUPT_808_GRAMMAR_SHIFT", "warning", "L'808 cambia grammatica bruscamente senza una transizione comune dichiarata.", [i - 1, i]);
    }
  }

  // Prehook funzionale deve risolvere in hook entro due barre dalla fine del blocco.
  for (let i = 0; i < seq.bars.length; i++) {
    if (seq.bars[i].functionRole !== "prehook") continue;
    const isEnd = i === seq.bars.length - 1 || seq.bars[i + 1].functionRole !== "prehook";
    if (isEnd) {
      const resolves = [seq.bars[i + 1], seq.bars[i + 2]].filter(Boolean).some(b => b.functionRole === "hook");
      if (!resolves) add("PREHOOK_UNRESOLVED", "warning", "Blocco etichettato prehook non risolve in un hook vicino.", [i, Math.min(seq.bars.length - 1, i + 2)]);
    }
  }

  // Spazio vocale alto ma densità foreground alta.
  for (let i = 0; i < seq.bars.length; i++) {
    const b = seq.bars[i];
    const foreground = density(seq, i, ["kick", "808", "perc", "lead", "hat_open", "fx"]);
    if (b.vocalSpace >= 0.75 && foreground >= 10) {
      add("DENSITY_VS_VOCAL_SPACE", "warning", `Barra ${i}: vocalSpace alto (${b.vocalSpace.toFixed(2)}) ma ${foreground} eventi foreground.`, [i, i]);
    }
  }

  // Più famiglie cambiano densità drasticamente ma energy/tension/transition restano piatte.
  for (let i = 1; i < seq.bars.length; i++) {
    const families = [
      ["kick", "snare", "clap", "hat_closed", "hat_open", "perc"],
      ["808"],
      ["harmony", "lead", "texture"]
    ];
    const changed = families.filter(types => Math.abs(density(seq, i, types) - density(seq, i - 1, types)) >= 3).length;
    const a = seq.bars[i - 1], b = seq.bars[i];
    const commonIntent = Math.abs(a.energy - b.energy) >= 0.15 || Math.abs(a.tension - b.tension) >= 0.15 || b.transitionIntent !== "stable";
    if (changed >= 2 && !commonIntent) add("UNMOTIVATED_MULTI_LAYER_CHANGE", "info", "Più strumenti cambiano comportamento insieme senza un cambio comune di energia/tensione/transizione.", [i - 1, i]);
  }

  return {
    ok: !findings.some(f => f.severity === "error"),
    counts: findings.reduce((acc, f) => ((acc[f.severity] = (acc[f.severity] || 0) + 1), acc), {}),
    findings
  };
}

module.exports = { audit, eventSignature, fullBarSignature };
