"use strict";

import * as THREE from "three";

/*
  MakeHumanRigRefitter V7

  V6 ha mostrato che il refit V5/V6 non deformava la SAGOMA:
  tutti i vertici ricevevano lo stesso offset e il BODY SIZE restava identico.

  Causa:
  - il modello usa SkinnedMesh in AttachedBindMode;
  - runtime.attach() riposiziona il root per centrare/mettere a terra il personaggio;
  - dopo il refit ricalcolavamo boneInverses nello spazio world corrente,
    ma lasciavamo bindMatrix al bind originale del GLB;
  - il risultato era un offset rigido globale.

  Fix V7:
  - snapshot delle bind matrices originali di TUTTE le SkinnedMesh semantiche;
  - dopo aver spostato le ossa e ricalcolato le boneInverses,
    rebinding esplicito di ogni SkinnedMesh con la sua matrixWorld corrente;
  - restoreBaseRig() ripristina anche bindMatrix/bindMatrixInverse originali.

  Nessuna coordinata ossea hardcoded.
*/

function cloneBoneTransform(bone) {
  return {
    position: bone.position.clone(),
    quaternion: bone.quaternion.clone(),
    scale: bone.scale.clone()
  };
}

function restoreBoneTransform(bone, state) {
  bone.position.copy(state.position);
  bone.quaternion.copy(state.quaternion);
  bone.scale.copy(state.scale);
}

function getWorldPosition(object) {
  const v = new THREE.Vector3();
  object.getWorldPosition(v);
  return v;
}

function setWorldPosition(object, worldTarget) {
  const parent = object.parent;

  if (!parent) {
    object.position.copy(worldTarget);
    return;
  }

  parent.updateWorldMatrix(true, false);

  const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
  object.position.copy(worldTarget).applyMatrix4(inv);
}

function boneDepth(bone) {
  let depth = 0;
  let p = bone.parent;

  while (p) {
    if (p.isBone) depth++;
    p = p.parent;
  }

  return depth;
}

function uniqueSkinnedMeshes(contract) {
  const out = [];
  const seen = new Set();

  for (const mesh of Object.values(contract?.meshes || {})) {
    if (!mesh?.isSkinnedMesh || seen.has(mesh.uuid)) continue;
    seen.add(mesh.uuid);
    out.push(mesh);
  }

  return out;
}

export class MakeHumanRigRefitter {
  constructor(contract, options = {}) {
    if (!contract?.meshes?.body?.isSkinnedMesh) {
      throw new Error("MakeHumanRigRefitter: Body SkinnedMesh mancante.");
    }

    if (!contract?.skeleton) {
      throw new Error("MakeHumanRigRefitter: skeleton mancante.");
    }

    this.contract = contract;
    this.body = contract.meshes.body;
    this.skeleton = contract.skeleton;
    this.skinnedMeshes = uniqueSkinnedMeshes(contract);

    this.minWeight = options.minWeight ?? 0.02;

    this.bones = [...this.skeleton.bones];

    /*
      Lo snapshot viene preso DOPO runtime.attach(), quindi nel medesimo
      spazio world in cui lavorerà il refit.
    */
    this._updateWholeModelWorld();

    this.baseBoneTransforms = this.bones.map(cloneBoneTransform);
    this.baseBoneWorldPositions = this.bones.map(getWorldPosition);
    this.baseBoneInverses = this.skeleton.boneInverses.map(m => m.clone());

    this.baseMeshBindings = this.skinnedMeshes.map(mesh => ({
      mesh,
      bindMode: mesh.bindMode,
      bindMatrix: mesh.bindMatrix.clone(),
      bindMatrixInverse: mesh.bindMatrixInverse.clone()
    }));

    this.vertexInfluences = this._buildVertexInfluenceTable();
    this.baseAnchors = this._captureAnchors();

    this.lastReport = null;
  }

  _updateWholeModelWorld() {
    /*
      Bones e SkinnedMesh sono fratelli/parenti nello stesso albero.
      Aggiornare solo Body non basta: risaliamo al root effettivo.
    */
    let root = this.body;
    while (root.parent) root = root.parent;

    root.updateMatrixWorld(true);
  }

  _restoreOriginalInverses() {
    this.skeleton.boneInverses = this.baseBoneInverses.map(m => m.clone());
    this.skeleton.update();
  }

  _restoreOriginalBindings() {
    for (const state of this.baseMeshBindings) {
      state.mesh.bindMode = state.bindMode;
      state.mesh.bindMatrix.copy(state.bindMatrix);
      state.mesh.bindMatrixInverse.copy(state.bindMatrixInverse);
    }
  }

  restoreBaseRig() {
    for (let i = 0; i < this.bones.length; i++) {
      restoreBoneTransform(this.bones[i], this.baseBoneTransforms[i]);
    }

    this._restoreOriginalInverses();
    this._restoreOriginalBindings();

    this._updateWholeModelWorld();
    this.skeleton.update();
    this._updateWholeModelWorld();
  }

  _buildVertexInfluenceTable() {
    const geometry = this.body.geometry;
    const skinIndex = geometry?.attributes?.skinIndex;
    const skinWeight = geometry?.attributes?.skinWeight;
    const position = geometry?.attributes?.position;

    if (!skinIndex || !skinWeight || !position) {
      throw new Error("Body senza skinIndex/skinWeight/position.");
    }

    const perBone = Array.from({ length: this.bones.length }, () => []);

    for (let vertexIndex = 0; vertexIndex < position.count; vertexIndex++) {
      for (let slot = 0; slot < 4; slot++) {
        const boneIdx = skinIndex.getComponent(vertexIndex, slot);
        const weight = skinWeight.getComponent(vertexIndex, slot);

        if (
          Number.isInteger(boneIdx) &&
          boneIdx >= 0 &&
          boneIdx < perBone.length &&
          weight >= this.minWeight
        ) {
          perBone[boneIdx].push({ vertexIndex, weight });
        }
      }
    }

    return perBone;
  }

  _captureAnchors() {
    this._updateWholeModelWorld();

    const anchors = Array.from({ length: this.bones.length }, () => null);
    const tmp = new THREE.Vector3();

    for (let boneIdx = 0; boneIdx < this.bones.length; boneIdx++) {
      const influences = this.vertexInfluences[boneIdx];
      if (!influences.length) continue;

      const sum = new THREE.Vector3();
      let totalWeight = 0;

      for (const { vertexIndex, weight } of influences) {
        this.body.getVertexPosition(vertexIndex, tmp);
        this.body.localToWorld(tmp);

        sum.addScaledVector(tmp, weight);
        totalWeight += weight;
      }

      if (totalWeight > 0) {
        anchors[boneIdx] = sum.multiplyScalar(1 / totalWeight);
      }
    }

    return anchors;
  }

  analyzeCurrentMorph() {
    /*
      Misuriamo sempre il morph partendo dal bind originale:
      nessun accumulo fra un refit e il successivo.
    */
    this.restoreBaseRig();

    const currentAnchors = this._captureAnchors();
    const perBone = [];

    for (let i = 0; i < this.bones.length; i++) {
      const bone = this.bones[i];
      const baseAnchor = this.baseAnchors[i];
      const currentAnchor = currentAnchors[i];

      const delta =
        baseAnchor && currentAnchor
          ? currentAnchor.clone().sub(baseAnchor)
          : new THREE.Vector3();

      perBone.push({
        index: i,
        bone,
        name: bone.name || `bone_${i}`,
        depth: boneDepth(bone),
        influenceCount: this.vertexInfluences[i].length,
        delta,
        deltaLength: delta.length()
      });
    }

    return perBone;
  }

  _rebindMeshesAtCurrentWorldPose() {
    /*
      Three.js SkinnedMesh.bind(skeleton, bindMatrix):
      con bindMatrix esplicita NON ricalcola le boneInverses.
      Quindi:
      1) abbiamo già calcolato le nuove inverses;
      2) leghiamo ogni mesh alla SUA matrixWorld corrente.

      Questo mantiene coerenti bindMatrix e bindMatrixInverse con lo
      spazio world usato dalle nuove boneInverses.
    */
    this._updateWholeModelWorld();

    for (const mesh of this.skinnedMeshes) {
      mesh.updateWorldMatrix(true, false);
      mesh.bind(this.skeleton, mesh.matrixWorld.clone());
    }

    this.skeleton.update();
    this._updateWholeModelWorld();
  }

  refitCurrentMorph() {
    const analysis = this.analyzeCurrentMorph();
    const ordered = [...analysis].sort((a, b) => a.depth - b.depth);

    let movedBones = 0;
    let maxMove = 0;
    let sumMove = 0;

    /*
      Target WORLD assoluti = bind world originario + delta del relativo
      cluster di vertici morfati.
    */
    for (const item of ordered) {
      const baseWorld = this.baseBoneWorldPositions[item.index];
      if (!baseWorld) continue;

      const targetWorld = baseWorld.clone().add(item.delta);

      setWorldPosition(item.bone, targetWorld);
      item.bone.updateWorldMatrix(true, true);

      const move = item.deltaLength;

      if (move > 1e-5) movedBones++;
      maxMove = Math.max(maxMove, move);
      sumMove += move;
    }

    /*
      Nuovo bind pose:
      prima nuove inverse bones, POI nuova bindMatrix per ogni SkinnedMesh.
    */
    this._updateWholeModelWorld();
    this.skeleton.calculateInverses();
    this.skeleton.update();

    this._rebindMeshesAtCurrentWorldPose();

    const report = {
      movedBones,
      totalBones: this.bones.length,
      reboundMeshes: this.skinnedMeshes.map(mesh => mesh.name || mesh.uuid),
      maxMove,
      meanMove: this.bones.length ? sumMove / this.bones.length : 0,
      bones: analysis.map(item => ({
        index: item.index,
        name: item.name,
        influenceCount: item.influenceCount,
        deltaLength: item.deltaLength,
        delta: item.delta.clone()
      }))
    };

    this.lastReport = report;
    return report;
  }

  formatReport(report = this.lastReport) {
    if (!report) return "Nessun refit eseguito.";

    const f = n => Number(n || 0).toFixed(5);

    const out = [
      "=== RIG REFIT V7 ===",
      `bones: ${report.totalBones}`,
      `moved bones: ${report.movedBones}`,
      `rebound meshes: ${report.reboundMeshes.join(", ")}`,
      `max move: ${f(report.maxMove)}`,
      `mean move: ${f(report.meanMove)}`,
      "",
      "BONES"
    ];

    for (const bone of report.bones) {
      out.push(
        `- ${bone.name}` +
        ` | influences=${bone.influenceCount}` +
        ` | move=${f(bone.deltaLength)}` +
        ` | dx=${f(bone.delta.x)}` +
        ` dy=${f(bone.delta.y)}` +
        ` dz=${f(bone.delta.z)}`
      );
    }

    return out.join("\n");
  }
}
