"use strict";

/*
  V22.2 — Native Face Structure Controller

  Mapping is semantic, not label-driven:

  Larghezza zigomatica:
    negative -> cheek-bones-decr (native source target)
    positive -> cheek-bones-incr (already in canonical GLB)

  Altezza guance:
    negative -> cheek-trans-down (native source target)
    positive -> cheek-trans-up (native source target)

  Volume guance:
    negative -> cheek-volume-decr (already in canonical GLB)
    positive -> cheek-volume-incr (already in canonical GLB)

  No amplification, no masks, no custom geometry.
*/

const REQUIRED = Object.freeze([
  "headWider",
  "headNarrower",
  "headTaller",
  "headShorter",
  "headDeeper",
  "headShallower",
  "headRound",
  "headSquare",
  "headOval",

  "jawWider",
  "jawNarrower",
  "jawChinLonger",
  "jawChinShorter",
  "jawChinForward",
  "jawChinBack",
  "jawChinPointed",
  "jawChinCleft",

  "cheekBonesLeft",
  "cheekBonesRight",
  "cheekBonesNarrowLeft",
  "cheekBonesNarrowRight",

  "cheekHigherLeft",
  "cheekHigherRight",
  "cheekLowerLeft",
  "cheekLowerRight",

  "cheekFullerLeft",
  "cheekFullerRight",
  "cheekHollowLeft",
  "cheekHollowRight"
]);

const STRUCTURE_MORPHS =
  Object.freeze([...REQUIRED]);

function clamp01(v) {
  const n = Number(v) || 0;
  return Math.max(0, Math.min(1, n));
}

function clampSigned(v) {
  const n = Number(v) || 0;
  return Math.max(-1, Math.min(1, n));
}

function mirroredSigned(
  adapter,
  negativeLeft,
  negativeRight,
  positiveLeft,
  positiveRight,
  value
) {
  const v = clampSigned(value);

  const negative =
    v < 0 ? Math.abs(v) : 0;

  const positive =
    v > 0 ? v : 0;

  adapter.setMorphs({
    [negativeLeft]: negative,
    [negativeRight]: negative,
    [positiveLeft]: positive,
    [positiveRight]: positive
  });

  return v;
}

export class MakeHumanFaceStructureController {
  constructor(adapter) {
    if (!adapter) {
      throw new Error(
        "FaceStructureController: adapter mancante."
      );
    }

    this.adapter = adapter;

    const inventory =
      new Set(adapter.listMorphTargets());

    this.missing =
      REQUIRED.filter(
        name => !inventory.has(name)
      );

    if (this.missing.length) {
      throw new Error(
        "FaceStructureController: morph nativi mancanti: " +
        this.missing.join(", ")
      );
    }

    this.shape = "base";
  }

  resetAll() {
    const values = {};

    for (const name of STRUCTURE_MORPHS) {
      values[name] = 0;
    }

    this.adapter.setMorphs(values);
    this.shape = "base";

    return this.getDiagnostics();
  }

  setHeadShape(shape = "base") {
    this.adapter.setMorphs({
      headRound: 0,
      headSquare: 0,
      headOval: 0
    });

    if (shape === "round") {
      this.adapter.setMorph("headRound", 1);
      this.shape = "round";
    } else if (shape === "square") {
      this.adapter.setMorph("headSquare", 1);
      this.shape = "square";
    } else if (shape === "oval") {
      this.adapter.setMorph("headOval", 1);
      this.shape = "oval";
    } else {
      this.shape = "base";
    }

    return this.getDiagnostics();
  }

  setHeadWidth(v) {
    return this.adapter.setSignedPair(
      "headNarrower",
      "headWider",
      clampSigned(v)
    );
  }

  setHeadHeight(v) {
    return this.adapter.setSignedPair(
      "headShorter",
      "headTaller",
      clampSigned(v)
    );
  }

  setHeadDepth(v) {
    return this.adapter.setSignedPair(
      "headShallower",
      "headDeeper",
      clampSigned(v)
    );
  }

  setJawWidth(v) {
    return this.adapter.setSignedPair(
      "jawNarrower",
      "jawWider",
      clampSigned(v)
    );
  }

  setChinHeight(v) {
    return this.adapter.setSignedPair(
      "jawChinShorter",
      "jawChinLonger",
      clampSigned(v)
    );
  }

  setChinProjection(v) {
    return this.adapter.setSignedPair(
      "jawChinBack",
      "jawChinForward",
      clampSigned(v)
    );
  }

  setCheekWidth(v) {
    return mirroredSigned(
      this.adapter,
      "cheekBonesNarrowLeft",
      "cheekBonesNarrowRight",
      "cheekBonesLeft",
      "cheekBonesRight",
      v
    );
  }

  setCheekHeight(v) {
    return mirroredSigned(
      this.adapter,
      "cheekLowerLeft",
      "cheekLowerRight",
      "cheekHigherLeft",
      "cheekHigherRight",
      v
    );
  }

  setCheekVolume(v) {
    return mirroredSigned(
      this.adapter,
      "cheekHollowLeft",
      "cheekHollowRight",
      "cheekFullerLeft",
      "cheekFullerRight",
      v
    );
  }

  setChinPointed(v) {
    const value = clamp01(v);

    this.adapter.setMorph(
      "jawChinPointed",
      value
    );

    return value;
  }

  setChinCleft(v) {
    const value = clamp01(v);

    this.adapter.setMorph(
      "jawChinCleft",
      value
    );

    return value;
  }

  getDiagnostics() {
    const values = {};

    for (const name of STRUCTURE_MORPHS) {
      values[name] =
        this.adapter.getMorphValue(name);
    }

    return {
      ok: this.missing.length === 0,
      missing: [...this.missing],
      shape: this.shape,
      values
    };
  }
}
