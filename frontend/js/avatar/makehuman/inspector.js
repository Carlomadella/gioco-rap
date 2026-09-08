"use strict";

function nodePath(node) {
  const parts = [];
  let current = node;
  while (current) {
    parts.push(current.name || current.type || "(unnamed)");
    current = current.parent || null;
  }
  return parts.reverse().join("/");
}

function materialList(material) {
  if (!material) return [];
  return Array.isArray(material) ? material.filter(Boolean) : [material];
}

function geometryInfo(geometry) {
  if (!geometry) return null;
  const attrs = geometry.attributes || {};
  const attributeNames = Object.keys(attrs);
  const indexCount = geometry.index?.count || 0;
  const vertexCount = attrs.position?.count || 0;

  return {
    uuid: geometry.uuid || "",
    vertexCount,
    indexCount,
    indexed: !!geometry.index,
    attributes: attributeNames,
    hasSkinIndex: !!attrs.skinIndex,
    hasSkinWeight: !!attrs.skinWeight,
    hasUv: !!attrs.uv,
    morphAttributeNames: Object.keys(geometry.morphAttributes || {})
  };
}

function materialInfo(material) {
  return {
    uuid: material.uuid || "",
    name: material.name || "",
    type: material.type || "",
    transparent: !!material.transparent,
    opacity: Number.isFinite(material.opacity) ? material.opacity : 1,
    alphaTest: Number.isFinite(material.alphaTest) ? material.alphaTest : 0,
    side: material.side,
    hasMap: !!material.map,
    hasNormalMap: !!material.normalMap,
    hasRoughnessMap: !!material.roughnessMap,
    hasMetalnessMap: !!material.metalnessMap
  };
}

function skeletonInfo(skeleton) {
  return {
    uuid: skeleton.uuid || "",
    bones: (skeleton.bones || []).map((bone, index) => ({
      index,
      uuid: bone.uuid || "",
      name: bone.name || "",
      path: nodePath(bone)
    }))
  };
}

export function inspectAvatarRoot(root) {
  if (!root?.traverse) {
    throw new TypeError("inspectAvatarRoot richiede un Object3D THREE valido.");
  }

  const nodes = [];
  const meshes = [];
  const skinnedMeshes = [];
  const materials = new Map();
  const skeletons = new Map();
  const morphTargetMap = new Map();

  root.traverse(node => {
    const entry = {
      uuid: node.uuid || "",
      name: node.name || "",
      type: node.type || "",
      path: nodePath(node),
      visible: node.visible !== false,
      isMesh: !!node.isMesh,
      isSkinnedMesh: !!node.isSkinnedMesh,
      isBone: !!node.isBone
    };

    nodes.push(entry);

    if (node.isMesh) {
      const mats = materialList(node.material);
      const geometry = geometryInfo(node.geometry);
      const morphNames = Object.keys(node.morphTargetDictionary || {});

      const meshInfo = {
        ...entry,
        geometry,
        materialUuids: mats.map(m => m.uuid || ""),
        morphTargets: morphNames,
        skeletonUuid: node.skeleton?.uuid || ""
      };

      meshes.push(meshInfo);
      if (node.isSkinnedMesh) skinnedMeshes.push(meshInfo);

      for (const mat of mats) {
        if (!materials.has(mat.uuid)) materials.set(mat.uuid, materialInfo(mat));
      }

      if (node.skeleton && !skeletons.has(node.skeleton.uuid)) {
        skeletons.set(node.skeleton.uuid, skeletonInfo(node.skeleton));
      }

      for (const morphName of morphNames) {
        if (!morphTargetMap.has(morphName)) morphTargetMap.set(morphName, []);
        morphTargetMap.get(morphName).push(nodePath(node));
      }
    }
  });

  const morphTargets = [...morphTargetMap.entries()]
    .map(([name, meshPaths]) => ({ name, meshPaths }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    summary: {
      nodeCount: nodes.length,
      meshCount: meshes.length,
      skinnedMeshCount: skinnedMeshes.length,
      boneCount: nodes.filter(n => n.isBone).length,
      materialCount: materials.size,
      skeletonCount: skeletons.size,
      morphTargetCount: morphTargets.length
    },
    nodes,
    meshes,
    skinnedMeshes,
    materials: [...materials.values()],
    skeletons: [...skeletons.values()],
    morphTargets
  };
}

export function formatInspectionReport(report) {
  if (!report) return "Nessun report.";

  const s = report.summary || {};
  const out = [];

  out.push("=== MAKEHUMAN MODEL INSPECTOR ===");
  out.push(`nodi: ${s.nodeCount || 0}`);
  out.push(`mesh: ${s.meshCount || 0}`);
  out.push(`skinned mesh: ${s.skinnedMeshCount || 0}`);
  out.push(`ossa: ${s.boneCount || 0}`);
  out.push(`materiali: ${s.materialCount || 0}`);
  out.push(`skeleton: ${s.skeletonCount || 0}`);
  out.push(`morph target unici: ${s.morphTargetCount || 0}`);
  out.push("");

  out.push("=== SKINNED MESH ===");
  for (const mesh of report.skinnedMeshes || []) {
    out.push(
      `${mesh.path}` +
      ` | vertices=${mesh.geometry?.vertexCount ?? "?"}` +
      ` | skinIndex=${mesh.geometry?.hasSkinIndex ? "si" : "no"}` +
      ` | skinWeight=${mesh.geometry?.hasSkinWeight ? "si" : "no"}` +
      ` | morph=${mesh.morphTargets?.length || 0}`
    );
  }

  out.push("");
  out.push("=== MATERIALI ===");
  for (const material of report.materials || []) {
    out.push(
      `${material.name || "(senza nome)"} | ${material.type}` +
      ` | map=${material.hasMap ? "si" : "no"}` +
      ` | normal=${material.hasNormalMap ? "si" : "no"}` +
      ` | transparent=${material.transparent ? "si" : "no"}` +
      ` | alphaTest=${material.alphaTest}`
    );
  }

  out.push("");
  out.push("=== SKELETON ===");
  for (const skeleton of report.skeletons || []) {
    out.push(`${skeleton.uuid} | bones=${skeleton.bones.length}`);
    for (const bone of skeleton.bones) {
      out.push(`  [${bone.index}] ${bone.name || "(unnamed)"} | ${bone.path}`);
    }
  }

  out.push("");
  out.push("=== MORPH TARGET ===");
  for (const morph of report.morphTargets || []) {
    out.push(`${morph.name} -> ${morph.meshPaths.join(", ")}`);
  }

  out.push("");
  out.push("=== TUTTE LE MESH ===");
  for (const mesh of report.meshes || []) {
    out.push(
      `${mesh.path}` +
      ` | ${mesh.type}` +
      ` | vertices=${mesh.geometry?.vertexCount ?? "?"}` +
      ` | materials=${mesh.materialUuids.length}`
    );
  }

  return out.join("\n");
}
