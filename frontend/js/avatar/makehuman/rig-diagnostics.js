"use strict";

import * as THREE from "three";

function worldPosition(object) {
  const v = new THREE.Vector3();
  object.getWorldPosition(v);
  return v;
}

function captureDeformedMesh(mesh) {
  if (!mesh?.isMesh || !mesh.geometry?.attributes?.position) {
    throw new Error("captureDeformedMesh: mesh non valida.");
  }

  mesh.updateMatrixWorld(true);

  const positionAttr = mesh.geometry.attributes.position;
  const count = positionAttr.count;
  const positions = new Float32Array(count * 3);

  const min = new THREE.Vector3(+Infinity, +Infinity, +Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    // Mesh.getVertexPosition applica i morph target.
    // SkinnedMesh.getVertexPosition aggiunge anche lo skinning.
    mesh.getVertexPosition(i, v);
    mesh.localToWorld(v);

    const j = i * 3;
    positions[j] = v.x;
    positions[j + 1] = v.y;
    positions[j + 2] = v.z;

    min.min(v);
    max.max(v);
  }

  return {
    vertexCount: count,
    positions,
    min,
    max,
    size: max.clone().sub(min),
    center: min.clone().add(max).multiplyScalar(0.5)
  };
}

export function captureRigSnapshot(contract) {
  const body = contract?.meshes?.body;
  if (!body) {
    throw new Error("captureRigSnapshot: Body non disponibile.");
  }

  const bones = {};
  for (const [role, bone] of Object.entries(contract.bones || {})) {
    if (!bone) continue;
    bones[role] = worldPosition(bone);
  }

  return {
    body: captureDeformedMesh(body),
    bones
  };
}

export function compareRigSnapshots(before, after, options = {}) {
  if (!before || !after) {
    throw new Error("compareRigSnapshots: snapshot mancanti.");
  }

  if (before.body.vertexCount !== after.body.vertexCount) {
    throw new Error(
      `Vertici Body differenti: ${before.body.vertexCount} -> ${after.body.vertexCount}`
    );
  }

  const vertexEpsilon = options.vertexEpsilon ?? 1e-5;
  const boneEpsilon = options.boneEpsilon ?? 1e-5;

  let movedVertices = 0;
  let maxVertexDelta = 0;
  let sumVertexDelta = 0;

  const a = before.body.positions;
  const b = after.body.positions;
  const vertexCount = before.body.vertexCount;

  for (let i = 0; i < vertexCount; i++) {
    const j = i * 3;
    const dx = b[j] - a[j];
    const dy = b[j + 1] - a[j + 1];
    const dz = b[j + 2] - a[j + 2];
    const d = Math.hypot(dx, dy, dz);

    if (d > vertexEpsilon) movedVertices++;
    if (d > maxVertexDelta) maxVertexDelta = d;
    sumVertexDelta += d;
  }

  const meanVertexDelta = vertexCount
    ? sumVertexDelta / vertexCount
    : 0;

  const boneDeltas = {};
  let maxBoneDelta = 0;
  let movedBones = 0;

  for (const role of Object.keys(before.bones || {})) {
    const p0 = before.bones[role];
    const p1 = after.bones?.[role];

    if (!p0 || !p1) continue;

    const d = p0.distanceTo(p1);
    boneDeltas[role] = d;

    if (d > boneEpsilon) movedBones++;
    if (d > maxBoneDelta) maxBoneDelta = d;
  }

  const bodySizeDelta = after.body.size.clone().sub(before.body.size);
  const bodyCenterDelta = after.body.center.clone().sub(before.body.center);

  const geometryChanged = movedVertices > 0;
  const bonesEffectivelyStatic = maxBoneDelta <= boneEpsilon;

  return {
    geometryChanged,
    bonesEffectivelyStatic,
    likelyNeedsRefit: geometryChanged && bonesEffectivelyStatic,

    vertexCount,
    movedVertices,
    movedVertexRatio: vertexCount ? movedVertices / vertexCount : 0,
    maxVertexDelta,
    meanVertexDelta,

    movedBones,
    maxBoneDelta,
    boneDeltas,

    bodySizeBefore: before.body.size,
    bodySizeAfter: after.body.size,
    bodySizeDelta,
    bodyCenterDelta
  };
}

export function formatRigComparison(result) {
  if (!result) return "Nessun confronto rig.";

  const f = n => Number(n || 0).toFixed(5);
  const pct = n => `${(Number(n || 0) * 100).toFixed(1)}%`;

  const lines = [
    "=== RIG DIAGNOSTICS V4 ===",
    `geometry changed: ${result.geometryChanged ? "SI" : "NO"}`,
    `bones effectively static: ${result.bonesEffectivelyStatic ? "SI" : "NO"}`,
    `likely needs refit: ${result.likelyNeedsRefit ? "SI" : "NO"}`,
    "",
    "DEFORMED BODY",
    `vertices: ${result.vertexCount}`,
    `moved vertices: ${result.movedVertices} (${pct(result.movedVertexRatio)})`,
    `max vertex delta: ${f(result.maxVertexDelta)}`,
    `mean vertex delta: ${f(result.meanVertexDelta)}`,
    "",
    "BODY SIZE (deformed vertices)",
    `before: x=${f(result.bodySizeBefore.x)} y=${f(result.bodySizeBefore.y)} z=${f(result.bodySizeBefore.z)}`,
    `after:  x=${f(result.bodySizeAfter.x)} y=${f(result.bodySizeAfter.y)} z=${f(result.bodySizeAfter.z)}`,
    `delta:  x=${f(result.bodySizeDelta.x)} y=${f(result.bodySizeDelta.y)} z=${f(result.bodySizeDelta.z)}`,
    "",
    "RIG",
    `moved bones: ${result.movedBones}`,
    `max bone delta: ${f(result.maxBoneDelta)}`,
    "",
    "BONE DELTAS"
  ];

  for (const [role, delta] of Object.entries(result.boneDeltas || {})) {
    lines.push(`- ${role}: ${f(delta)}`);
  }

  return lines.join("\n");
}
