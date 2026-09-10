"use strict";

export const MAKEHUMAN_MODEL_CONTRACT = Object.freeze({
  meshRoles: Object.freeze({
    body: "Body",
    eyes: "Eyes",
    teeth: "Teeth",
    tongue: "Tongue"
  }),
  boneRoles: Object.freeze({
    hips: "mixamorigHips",
    spine: "mixamorigSpine",
    spine1: "mixamorigSpine1",
    spine2: "mixamorigSpine2",
    neck: "mixamorigNeck",
    head: "mixamorigHead",
    leftShoulder: "mixamorigLeftShoulder",
    leftArm: "mixamorigLeftArm",
    leftForeArm: "mixamorigLeftForeArm",
    leftHand: "mixamorigLeftHand",
    rightShoulder: "mixamorigRightShoulder",
    rightArm: "mixamorigRightArm",
    rightForeArm: "mixamorigRightForeArm",
    rightHand: "mixamorigRightHand",
    leftUpLeg: "mixamorigLeftUpLeg",
    leftLeg: "mixamorigLeftLeg",
    leftFoot: "mixamorigLeftFoot",
    rightUpLeg: "mixamorigRightUpLeg",
    rightLeg: "mixamorigRightLeg",
    rightFoot: "mixamorigRightFoot"
  }),
  requiredMorphs: Object.freeze([
    "bodyMasculine", "bodyFeminine",
    "heightShorter", "heightTaller",
    "bodyThinner", "bodyHeavier",
    "bodySofter", "bodyMuscular"
  ])
});

function byName(root, predicate) {
  const map = new Map();
  root.traverse(node => {
    if (predicate(node) && node.name && !map.has(node.name)) map.set(node.name, node);
  });
  return map;
}

export function resolveMakeHumanContract(root, report = null) {
  if (!root?.traverse) throw new TypeError("Object3D THREE non valido.");

  const meshesByName = byName(root, n => !!n.isMesh);
  const bonesByName = byName(root, n => !!n.isBone);

  const meshes = {};
  const missingMeshes = [];
  for (const [role, name] of Object.entries(MAKEHUMAN_MODEL_CONTRACT.meshRoles)) {
    meshes[role] = meshesByName.get(name) || null;
    if (!meshes[role]) missingMeshes.push(name);
  }

  const bones = {};
  const missingBones = [];
  for (const [role, name] of Object.entries(MAKEHUMAN_MODEL_CONTRACT.boneRoles)) {
    bones[role] = bonesByName.get(name) || null;
    if (!bones[role]) missingBones.push(name);
  }

  const semanticMeshes = Object.values(meshes).filter(Boolean);
  const skeletons = new Set(
    semanticMeshes.map(m => m.skeleton?.uuid || "").filter(Boolean)
  );

  const morphNames = new Set(
    report?.morphTargets?.map(x => x.name) ||
    (() => {
      const names = [];
      root.traverse(n => {
        if (n.isMesh && n.morphTargetDictionary) names.push(...Object.keys(n.morphTargetDictionary));
      });
      return names;
    })()
  );

  const missingMorphs = MAKEHUMAN_MODEL_CONTRACT.requiredMorphs.filter(x => !morphNames.has(x));
  const issues = [];

  if (missingMeshes.length) issues.push(`mesh mancanti: ${missingMeshes.join(", ")}`);
  for (const [role, mesh] of Object.entries(meshes)) {
    if (mesh && !mesh.isSkinnedMesh) issues.push(`${role}/${mesh.name} non è SkinnedMesh`);
  }
  if (semanticMeshes.length && skeletons.size !== 1) {
    issues.push(`skeleton condivisi attesi=1, trovati=${skeletons.size}`);
  }
  if (missingBones.length) issues.push(`ossa principali mancanti: ${missingBones.join(", ")}`);
  if (missingMorphs.length) issues.push(`morph fondamentali mancanti: ${missingMorphs.join(", ")}`);

  return {
    valid: issues.length === 0,
    issues,
    meshes,
    bones,
    skeleton: semanticMeshes.find(m => m?.skeleton)?.skeleton || null,
    missingMeshes,
    missingBones,
    missingMorphs
  };
}

export function formatContractReport(c) {
  if (!c) return "Contratto non risolto.";
  const out = [
    "=== MAKEHUMAN CONTRACT ===",
    `valid: ${c.valid ? "SI" : "NO"}`,
    `shared skeleton: ${c.skeleton ? "SI" : "NO"}`,
    "",
    "MESH SEMANTICHE"
  ];
  for (const [role, mesh] of Object.entries(c.meshes || {})) {
    out.push(`- ${role}: ${mesh?.name || "MANCANTE"}${mesh?.isSkinnedMesh ? " [SkinnedMesh]" : ""}`);
  }
  out.push("", "OSSA PRINCIPALI");
  for (const [role, bone] of Object.entries(c.bones || {})) {
    out.push(`- ${role}: ${bone?.name || "MANCANTE"}`);
  }
  out.push("", "MORPH FONDAMENTALI");
  out.push(c.missingMorphs?.length ? `mancanti: ${c.missingMorphs.join(", ")}` : "tutti presenti");
  if (c.issues?.length) out.push("", "PROBLEMI", ...c.issues.map(x => `- ${x}`));
  return out.join("\n");
}
