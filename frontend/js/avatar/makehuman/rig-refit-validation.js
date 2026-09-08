"use strict";

export function compareRefitIntegrity(beforeSnapshot, afterSnapshot, options = {}) {
  if (!beforeSnapshot?.body?.positions || !afterSnapshot?.body?.positions) {
    throw new Error("compareRefitIntegrity: snapshot Body mancanti.");
  }

  const before = beforeSnapshot.body;
  const after = afterSnapshot.body;

  if (before.vertexCount !== after.vertexCount) {
    throw new Error(
      `Numero vertici differente: ${before.vertexCount} -> ${after.vertexCount}`
    );
  }

  const epsilon = options.epsilon ?? 1e-5;
  const maxAllowedShapeDrift = options.maxAllowedShapeDrift ?? 1e-3;
  const count = before.vertexCount;

  /*
    Prima passata: vettore medio di spostamento.
    Se tutti i vertici hanno praticamente lo stesso delta,
    abbiamo una traslazione rigida, non una deformazione.
  */
  let meanDx = 0;
  let meanDy = 0;
  let meanDz = 0;

  for (let i = 0; i < count; i++) {
    const j = i * 3;
    meanDx += after.positions[j] - before.positions[j];
    meanDy += after.positions[j + 1] - before.positions[j + 1];
    meanDz += after.positions[j + 2] - before.positions[j + 2];
  }

  if (count) {
    meanDx /= count;
    meanDy /= count;
    meanDz /= count;
  }

  const rigidTranslationLength = Math.hypot(meanDx, meanDy, meanDz);

  let movedVertices = 0;
  let maxDrift = 0;
  let sumDrift = 0;
  let squaredDrift = 0;

  let shapeMovedVertices = 0;
  let maxShapeDrift = 0;
  let sumShapeDrift = 0;
  let squaredShapeDrift = 0;

  for (let i = 0; i < count; i++) {
    const j = i * 3;

    const dx = after.positions[j] - before.positions[j];
    const dy = after.positions[j + 1] - before.positions[j + 1];
    const dz = after.positions[j + 2] - before.positions[j + 2];

    const d = Math.hypot(dx, dy, dz);

    if (d > epsilon) movedVertices++;
    maxDrift = Math.max(maxDrift, d);
    sumDrift += d;
    squaredDrift += d * d;

    /*
      Residuo dopo aver rimosso la traslazione media.
      È questo che ci dice se la FORMA è stata alterata.
    */
    const rdx = dx - meanDx;
    const rdy = dy - meanDy;
    const rdz = dz - meanDz;
    const rd = Math.hypot(rdx, rdy, rdz);

    if (rd > epsilon) shapeMovedVertices++;
    maxShapeDrift = Math.max(maxShapeDrift, rd);
    sumShapeDrift += rd;
    squaredShapeDrift += rd * rd;
  }

  const meanDrift = count ? sumDrift / count : 0;
  const rmsDrift = count ? Math.sqrt(squaredDrift / count) : 0;

  const meanShapeDrift = count ? sumShapeDrift / count : 0;
  const rmsShapeDrift = count ? Math.sqrt(squaredShapeDrift / count) : 0;

  const sizeDx = after.size.x - before.size.x;
  const sizeDy = after.size.y - before.size.y;
  const sizeDz = after.size.z - before.size.z;
  const maxSizeDrift = Math.max(
    Math.abs(sizeDx),
    Math.abs(sizeDy),
    Math.abs(sizeDz)
  );

  const shapeNonDestructive =
    maxShapeDrift <= maxAllowedShapeDrift &&
    maxSizeDrift <= (options.maxAllowedSizeDrift ?? 1e-3);

  const worldStable =
    maxDrift <= (options.maxAllowedWorldDrift ?? 1e-3);

  return {
    vertexCount: count,

    movedVertices,
    movedRatio: count ? movedVertices / count : 0,
    maxDrift,
    meanDrift,
    rmsDrift,

    rigidTranslation: {
      x: meanDx,
      y: meanDy,
      z: meanDz,
      length: rigidTranslationLength
    },

    shapeMovedVertices,
    shapeMovedRatio: count ? shapeMovedVertices / count : 0,
    maxShapeDrift,
    meanShapeDrift,
    rmsShapeDrift,

    sizeDrift: {
      x: sizeDx,
      y: sizeDy,
      z: sizeDz,
      max: maxSizeDrift
    },

    shapeNonDestructive,
    worldStable,

    /*
      Per il runtime finale vogliamo entrambe vere:
      stessa forma + nessuno scivolamento globale.
    */
    nonDestructive: shapeNonDestructive && worldStable
  };
}

export function formatRefitIntegrity(result) {
  if (!result) return "Nessun test integrità refit.";

  const f = n => Number(n || 0).toFixed(6);
  const pct = n => `${(Number(n || 0) * 100).toFixed(2)}%`;

  return [
    "=== REFIT INTEGRITY V7 ===",
    `shape non destructive: ${result.shapeNonDestructive ? "SI" : "NO"}`,
    `world stable: ${result.worldStable ? "SI" : "NO"}`,
    `FINAL non destructive: ${result.nonDestructive ? "SI" : "NO"}`,
    "",
    "WORLD DRIFT",
    `vertices moved: ${result.movedVertices} (${pct(result.movedRatio)})`,
    `max drift: ${f(result.maxDrift)}`,
    `mean drift: ${f(result.meanDrift)}`,
    "",
    "RIGID TRANSLATION COMPONENT",
    `dx=${f(result.rigidTranslation.x)}`,
    `dy=${f(result.rigidTranslation.y)}`,
    `dz=${f(result.rigidTranslation.z)}`,
    `length=${f(result.rigidTranslation.length)}`,
    "",
    "SHAPE DRIFT (translation removed)",
    `vertices changed: ${result.shapeMovedVertices} (${pct(result.shapeMovedRatio)})`,
    `max shape drift: ${f(result.maxShapeDrift)}`,
    `mean shape drift: ${f(result.meanShapeDrift)}`,
    `rms shape drift: ${f(result.rmsShapeDrift)}`,
    "",
    "BODY SIZE DRIFT",
    `dx=${f(result.sizeDrift.x)}`,
    `dy=${f(result.sizeDrift.y)}`,
    `dz=${f(result.sizeDrift.z)}`,
    `max=${f(result.sizeDrift.max)}`
  ].join("\n");
}
