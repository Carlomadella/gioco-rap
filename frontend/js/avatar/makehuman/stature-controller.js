"use strict";

import * as THREE from "three";

const clamp01 = value =>
  Math.max(0, Math.min(1, Number.isFinite(+value) ? +value : 0));

const clampSigned = value =>
  Math.max(-1, Math.min(1, Number.isFinite(+value) ? +value : 0));

/*
  V16 EXPERIMENTAL STATURE CONTROLLER

  This is intentionally separate from MakeHumanAdapter.setHeight().

  MakeHuman's height macro behaves much closer to a dwarf/giant macro:
  it changes body width/depth and head size substantially.

  Here we test a different idea:
  - keep heightShorter / heightTaller at ZERO;
  - vary anatomical length morphs instead;
  - never apply head-size morphs.

  V24.1 correction:
  the previous controller drove neckLonger / neckShorter with the SAME
  signed amount used for legs and torso. That assumption can produce an
  obviously elongated neck on tall female phenotypes.

  Stature now drives:
  - legsLonger / legsShorter
  - chestTaller / chestShorter
  - armsLonger / armsShorter

  Neck length is intentionally left neutral. Height in cm is recalibrated
  numerically from the resulting Body, so target stature is still solved
  against the actually deformed character.

  This is a TEST controller, not yet production balancing.
*/

const STATURE_PAIRS = Object.freeze([
  Object.freeze({
    role: "legs",
    negative: "legsShorter",
    positive: "legsLonger"
  }),
  Object.freeze({
    role: "torso",
    negative: "chestShorter",
    positive: "chestTaller"
  }),
  Object.freeze({
    role: "arms",
    negative: "armsShorter",
    positive: "armsLonger"
  })
]);

export class MakeHumanStatureController {
  constructor(adapter) {
    if (!adapter) {
      throw new Error("MakeHumanStatureController: adapter mancante.");
    }

    this.adapter = adapter;
    this.contract = adapter.resolveContract();
    this.body = this.contract?.meshes?.body || null;

    if (!this.body?.isSkinnedMesh) {
      throw new Error("MakeHumanStatureController: Body SkinnedMesh mancante.");
    }

    this.availablePairs = STATURE_PAIRS.filter(pair =>
      adapter.meshesWithMorph(pair.negative).length &&
      adapter.meshesWithMorph(pair.positive).length
    );

    if (!this.availablePairs.length) {
      throw new Error("Nessuna coppia morph anatomica per la statura.");
    }

    this.calibration = null;
    this.signedValue = 0;
    this.targetCm = null;
  }

  listPairs() {
    return this.availablePairs.map(x => ({ ...x }));
  }

  measureHeightCm() {
    const count =
      this.body.geometry?.attributes?.position?.count || 0;

    if (!count) return NaN;

    const p = new THREE.Vector3();
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < count; i++) {
      this.body.getVertexPosition(i, p);

      if (!Number.isFinite(p.y)) continue;

      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
      return NaN;
    }

    return (maxY - minY) * 100;
  }

  _zeroAnatomicalPairs() {
    for (const pair of this.availablePairs) {
      this.adapter.setMorph(pair.negative, 0);
      this.adapter.setMorph(pair.positive, 0);
    }
  }

  setSigned(value = 0) {
    const v = clampSigned(value);

    // Critical: the old dwarf/giant macro must not participate.
    this.adapter.setHeight(0);

    const amount = Math.abs(v);
    const positive = v > 0;
    const negative = v < 0;

    for (const pair of this.availablePairs) {
      this.adapter.setMorph(
        pair.positive,
        positive ? amount : 0
      );

      this.adapter.setMorph(
        pair.negative,
        negative ? amount : 0
      );
    }

    this.signedValue = v;
    this.targetCm = null;

    this.adapter.root.updateMatrixWorld(true);

    return {
      signedValue: v,
      heightCm: this.measureHeightCm()
    };
  }

  reset() {
    this.adapter.setHeight(0);
    this._zeroAnatomicalPairs();

    this.signedValue = 0;
    this.targetCm = null;

    this.adapter.root.updateMatrixWorld(true);

    return this.measureHeightCm();
  }

  calibrate() {
    const previous = this.signedValue;

    this.reset();
    const neutralCm = this.measureHeightCm();

    this.setSigned(1);
    const maxCm = this.measureHeightCm();

    this.setSigned(-1);
    const minCm = this.measureHeightCm();

    this.setSigned(previous);

    this.calibration = {
      minCm,
      neutralCm,
      maxCm,
      pairCount: this.availablePairs.length,
      pairs: this.listPairs()
    };

    return { ...this.calibration };
  }

  setTargetCm(targetCm, {
    iterations = 20,
    toleranceCm = 0.02
  } = {}) {
    if (!this.calibration) {
      this.calibrate();
    }

    const { minCm, neutralCm, maxCm } = this.calibration;

    const requested = Number(targetCm);
    const target = Math.max(
      minCm,
      Math.min(maxCm, Number.isFinite(requested) ? requested : neutralCm)
    );

    if (Math.abs(target - neutralCm) <= toleranceCm) {
      const r = this.setSigned(0);
      this.targetCm = target;

      return {
        ...r,
        requestedCm: requested,
        targetCm: target,
        clamped: target !== requested,
        errorCm: r.heightCm - target,
        calibration: { ...this.calibration }
      };
    }

    const sign = target > neutralCm ? 1 : -1;

    let lo = 0;
    let hi = 1;
    let bestT = 0;
    let bestHeight = neutralCm;
    let bestError = Math.abs(neutralCm - target);

    for (let i = 0; i < iterations; i++) {
      const t = (lo + hi) * 0.5;

      this.setSigned(sign * t);

      const measured = this.measureHeightCm();
      const error = Math.abs(measured - target);

      if (error < bestError) {
        bestError = error;
        bestT = t;
        bestHeight = measured;
      }

      if (error <= toleranceCm) {
        break;
      }

      if (sign > 0) {
        if (measured < target) lo = t;
        else hi = t;
      } else {
        if (measured > target) lo = t;
        else hi = t;
      }
    }

    this.setSigned(sign * bestT);

    const actualCm = this.measureHeightCm();
    this.targetCm = target;

    return {
      signedValue: this.signedValue,
      requestedCm: requested,
      targetCm: target,
      actualCm,
      heightCm: actualCm,
      errorCm: actualCm - target,
      clamped: Math.abs(target - requested) > 1e-9,
      calibration: { ...this.calibration },
      activeMorphs: this.availablePairs.map(pair => ({
        role: pair.role,
        morph:
          this.signedValue > 0
            ? pair.positive
            : this.signedValue < 0
              ? pair.negative
              : null,
        weight: Math.abs(this.signedValue)
      }))
    };
  }

  getDiagnostics() {
    return {
      signedValue: this.signedValue,
      targetCm: this.targetCm,
      currentHeightCm: this.measureHeightCm(),
      calibration: this.calibration ? { ...this.calibration } : null,
      pairs: this.listPairs(),
      neckDrivenByStature: false
    };
  }
}
