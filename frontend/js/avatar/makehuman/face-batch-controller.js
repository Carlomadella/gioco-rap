"use strict";

/*
  V23 — Face Batch Controller

  Espone in una sezione separata tutti i controlli geometrici del volto
  ancora da validare.

  Regole:
  - solo morph MakeHuman canonici già presenti nel GLB
  - nessuna maschera
  - nessuna geometria sintetica
  - nessuna amplificazione
  - non ricostruisce mai il dizionario morph Three.js
  - un controllo mancante si disabilita da solo senza bloccare la demo
*/

const CONTROL_DEFS = Object.freeze({
  jawStructure: {
    group: "jaw",
    label: "Struttura mandibola",
    kind: "signed",
    negative: ["jawBonesSofter"],
    positive: ["jawBonesStronger"]
  },

  noseWidth: {
    group: "nose",
    label: "Larghezza naso",
    kind: "signed",
    negative: ["noseNarrower"],
    positive: ["noseWider"]
  },
  noseLength: {
    group: "nose",
    label: "Lunghezza naso",
    kind: "signed",
    negative: ["noseShorter"],
    positive: ["noseLonger"]
  },
  noseVolume: {
    group: "nose",
    label: "Volume naso",
    kind: "signed",
    negative: ["noseSmaller"],
    positive: ["noseBigger"]
  },
  noseTip: {
    group: "nose",
    label: "Punta naso",
    kind: "signed",
    negative: ["noseTipDown"],
    positive: ["noseTipUp"]
  },
  noseProfile: {
    group: "nose",
    label: "Profilo naso",
    kind: "signed",
    negative: ["noseConcave"],
    positive: ["noseConvex"]
  },
  noseNostrils: {
    group: "nose",
    label: "Larghezza narici",
    kind: "signed",
    negative: ["noseNostrilsNarrower"],
    positive: ["noseNostrilsWider"]
  },

  eyeSize: {
    group: "eyes",
    label: "Dimensione occhi",
    kind: "mirroredSigned",
    negative: ["eyeSmallerLeft", "eyeSmallerRight"],
    positive: ["eyeBiggerLeft", "eyeBiggerRight"]
  },
  eyeSpacing: {
    group: "eyes",
    label: "Distanza occhi",
    kind: "mirroredSigned",
    negative: ["eyeInwardLeft", "eyeInwardRight"],
    positive: ["eyeOutwardLeft", "eyeOutwardRight"]
  },
  eyeTilt: {
    group: "eyes",
    label: "Inclinazione occhi",
    kind: "mirroredSigned",
    negative: ["eyeOuterDownLeft", "eyeOuterDownRight"],
    positive: ["eyeOuterUpLeft", "eyeOuterUpRight"]
  },
  eyeDepth: {
    group: "eyes",
    label: "Profondità occhi",
    kind: "mirroredSigned",
    negative: ["eyeDeepSetLeft", "eyeDeepSetRight"],
    positive: ["eyeProtrudingLeft", "eyeProtrudingRight"]
  },

  browHeight: {
    group: "brows",
    label: "Altezza sopracciglia",
    kind: "signed",
    negative: ["browsDown"],
    positive: ["browsUp"]
  },
  browAngle: {
    group: "brows",
    label: "Inclinazione sopracciglia",
    kind: "signed",
    negative: ["browsAngleDown"],
    positive: ["browsAngleUp"]
  },
  mouthWidth: {
    group: "mouth",
    label: "Larghezza bocca",
    kind: "signed",
    negative: ["mouthNarrower"],
    positive: ["mouthWider"]
  },
  mouthUpperLip: {
    group: "mouth",
    label: "Volume labbro superiore",
    kind: "signed",
    negative: ["mouthUpperLipThinner"],
    positive: ["mouthUpperLipFuller"]
  },
  mouthLowerLip: {
    group: "mouth",
    label: "Volume labbro inferiore",
    kind: "signed",
    negative: ["mouthLowerLipThinner"],
    positive: ["mouthLowerLipFuller"]
  },
  mouthCorners: {
    group: "mouth",
    label: "Angoli bocca",
    kind: "signed",
    negative: ["mouthCornersDown"],
    positive: ["mouthCornersUp"]
  },
  mouthProjection: {
    group: "mouth",
    label: "Proiezione bocca",
    kind: "signed",
    negative: ["mouthBackward"],
    positive: ["mouthForward"]
  },

  earSize: {
    group: "ears",
    label: "Dimensione orecchie",
    kind: "mirroredSigned",
    negative: ["earSmallerLeft", "earSmallerRight"],
    positive: ["earScaleLeft", "earScaleRight"]
  },
  earWing: {
    group: "ears",
    label: "Sporgenza orecchie",
    kind: "positive",
    negative: [],
    positive: ["earWingOutLeft", "earWingOutRight"]
  },
  earHeight: {
    group: "ears",
    label: "Altezza orecchie",
    kind: "mirroredSigned",
    negative: ["earLowerLeft", "earLowerRight"],
    positive: ["earHigherLeft", "earHigherRight"]
  },
  earLobe: {
    group: "ears",
    label: "Dimensione lobo",
    kind: "mirroredSigned",
    negative: ["earLobeSmallerLeft", "earLobeSmallerRight"],
    positive: ["earLobeBiggerLeft", "earLobeBiggerRight"]
  }
});

function clampSigned(v) {
  const n = Number(v) || 0;
  return Math.max(-1, Math.min(1, n));
}

function clamp01(v) {
  const n = Number(v) || 0;
  return Math.max(0, Math.min(1, n));
}

function allMorphs(def) {
  return [
    ...(def.negative || []),
    ...(def.positive || [])
  ];
}

export class MakeHumanFaceBatchController {
  constructor(adapter) {
    if (!adapter) {
      throw new Error("FaceBatchController: adapter mancante.");
    }

    this.adapter = adapter;
    this.inventory = new Set(adapter.listMorphTargets());
    this.controls = {};

    for (const [key, def] of Object.entries(CONTROL_DEFS)) {
      const required = allMorphs(def);
      const missing = required.filter(
        name => !this.inventory.has(name)
      );

      this.controls[key] = {
        ...def,
        key,
        required,
        missing,
        available: missing.length === 0
      };
    }

    // V24.2:
    // This pair is deliberately NOT exposed. When active it produced the
    // forehead-centre artifact reported in testing. Zero it explicitly so
    // hiding/removing the UI can never leave a stale weight behind.
    this.adapter.setMorph("browsBackward", 0);
    this.adapter.setMorph("browsForward", 0);
  }

  isAvailable(key) {
    return !!this.controls[key]?.available;
  }

  apply(key, rawValue) {
    const def = this.controls[key];

    if (!def) {
      return { ok: false, reason: "unknown-control", key };
    }

    if (!def.available) {
      return {
        ok: false,
        reason: "missing-morphs",
        key,
        missing: [...def.missing]
      };
    }

    if (def.kind === "positive") {
      const value = clamp01(rawValue);

      for (const name of def.positive) {
        this.adapter.setMorph(name, value);
      }

      return { ok: true, key, value };
    }

    const value = clampSigned(rawValue);
    const negative = value < 0 ? Math.abs(value) : 0;
    const positive = value > 0 ? value : 0;

    for (const name of def.negative) {
      this.adapter.setMorph(name, negative);
    }

    for (const name of def.positive) {
      this.adapter.setMorph(name, positive);
    }

    return {
      ok: true,
      key,
      value,
      negative,
      positive
    };
  }

  resetKey(key) {
    const def = this.controls[key];

    if (!def) return false;

    for (const name of def.required) {
      this.adapter.setMorph(name, 0);
    }

    return true;
  }

  resetGroup(group) {
    for (const [key, def] of Object.entries(this.controls)) {
      if (def.group === group) {
        this.resetKey(key);
      }
    }
  }

  resetAll() {
    for (const key of Object.keys(this.controls)) {
      this.resetKey(key);
    }
  }

  getDiagnostics() {
    const controls = {};
    const active = [];

    for (const [key, def] of Object.entries(this.controls)) {
      const values = {};

      for (const name of def.required) {
        values[name] = this.adapter.getMorphValue(name);
      }

      const hasActive = Object.values(values)
        .some(v => Math.abs(v) > 1e-6);

      if (hasActive) {
        active.push({
          key,
          label: def.label,
          values
        });
      }

      controls[key] = {
        group: def.group,
        label: def.label,
        available: def.available,
        missing: [...def.missing],
        values
      };
    }

    const entries = Object.values(controls);

    return {
      total: entries.length,
      available: entries.filter(x => x.available).length,
      unavailable: entries.filter(x => !x.available).length,
      controls,
      active
    };
  }
}
