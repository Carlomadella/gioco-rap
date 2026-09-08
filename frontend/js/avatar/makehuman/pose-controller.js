"use strict";

import * as THREE from "three";

/*
  MakeHumanPoseController V8

  Scopo:
  verificare che il rig appena rifittato sia realmente utilizzabile.

  Regole:
  - la "rest pose" viene catturata DOPO il refit;
  - le pose sono trasformazioni relative a quella rest pose;
  - nessuna modifica alle boneInverses durante la posa;
  - resetPose() ripristina esattamente la posa post-refit.
*/

function cloneTransform(bone) {
  return {
    position: bone.position.clone(),
    quaternion: bone.quaternion.clone(),
    scale: bone.scale.clone()
  };
}

function restoreTransform(bone, state) {
  bone.position.copy(state.position);
  bone.quaternion.copy(state.quaternion);
  bone.scale.copy(state.scale);
}

function rootOf(object) {
  let root = object;
  while (root?.parent) root = root.parent;
  return root;
}

function deg(value) {
  return THREE.MathUtils.degToRad(Number(value || 0));
}

export class MakeHumanPoseController {
  constructor(contract) {
    if (!contract?.skeleton) {
      throw new Error("MakeHumanPoseController: skeleton mancante.");
    }

    this.contract = contract;
    this.skeleton = contract.skeleton;
    this.bones = [...this.skeleton.bones];
    this.roles = { ...(contract.bones || {}) };

    this.rest = null;
    this.lastPoseName = "none";
  }

  _updateWorld() {
    const anyBone = this.bones[0];
    const root = rootOf(anyBone);
    root?.updateMatrixWorld(true);
    this.skeleton.update();
    root?.updateMatrixWorld(true);
  }

  captureRestPose() {
    this._updateWorld();

    this.rest = new Map(
      this.bones.map(bone => [bone.uuid, cloneTransform(bone)])
    );

    this.lastPoseName = "rest";
    return this.rest.size;
  }

  resetPose() {
    if (!this.rest) {
      throw new Error("Pose rest non catturata.");
    }

    for (const bone of this.bones) {
      const state = this.rest.get(bone.uuid);
      if (state) restoreTransform(bone, state);
    }

    this._updateWorld();
    this.lastPoseName = "rest";
  }

  _role(role) {
    const bone = this.roles[role];
    if (!bone) throw new Error(`Osso semantico non trovato: ${role}`);
    return bone;
  }

  rotateWorld(role, axis, degrees) {
    const bone = this._role(role);

    this._updateWorld();

    const axisVector =
      axis === "x" ? new THREE.Vector3(1, 0, 0) :
      axis === "y" ? new THREE.Vector3(0, 1, 0) :
      new THREE.Vector3(0, 0, 1);

    const delta = new THREE.Quaternion().setFromAxisAngle(axisVector, deg(degrees));

    const boneWorld = new THREE.Quaternion();
    bone.getWorldQuaternion(boneWorld);

    const targetWorld = delta.multiply(boneWorld);

    const parentWorld = new THREE.Quaternion();

    if (bone.parent) {
      bone.parent.getWorldQuaternion(parentWorld);
    } else {
      parentWorld.identity();
    }

    const local = parentWorld.invert().multiply(targetWorld).normalize();
    bone.quaternion.copy(local);

    this._updateWorld();
  }

  applyTestPose(strength = 1) {
    if (!this.rest) this.captureRestPose();

    const s = Math.max(0, Math.min(1, Number(strength || 0)));

    this.resetPose();

    /*
      Posa volutamente semplice ma abbastanza aggressiva da testare:
      - spalle/braccia
      - bacino/gambe
      - collo/testa
      - gerarchia parent -> child

      Le rotazioni sono in world-space, quindi non dipendono
      dagli assi locali arbitrari esportati dal GLB.
    */

    // Braccia quasi orizzontali.
    this.rotateWorld("leftArm", "z", +48 * s);
    this.rotateWorld("rightArm", "z", -48 * s);

    // Piccola apertura in profondità.
    this.rotateWorld("leftArm", "y", -10 * s);
    this.rotateWorld("rightArm", "y", +10 * s);

    // Gomiti piegati in avanti.
    this.rotateWorld("leftForeArm", "x", -38 * s);
    this.rotateWorld("rightForeArm", "x", -38 * s);

    // Leggera asimmetria delle gambe per testare hips/leg chain.
    this.rotateWorld("leftUpLeg", "x", -12 * s);
    this.rotateWorld("rightUpLeg", "x", +7 * s);

    // Test collo/testa.
    this.rotateWorld("neck", "y", +10 * s);
    this.rotateWorld("head", "y", +12 * s);

    this.lastPoseName = "testPose";
    this._updateWorld();

    return this.validate();
  }

  validate() {
    this._updateWorld();

    let movedBones = 0;
    let maxPositionDelta = 0;
    let maxAngularDeltaDeg = 0;

    if (this.rest) {
      for (const bone of this.bones) {
        const state = this.rest.get(bone.uuid);
        if (!state) continue;

        const positionDelta = bone.position.distanceTo(state.position);
        const angle = THREE.MathUtils.radToDeg(
          bone.quaternion.angleTo(state.quaternion)
        );

        if (positionDelta > 1e-6 || angle > 1e-4) movedBones++;

        maxPositionDelta = Math.max(maxPositionDelta, positionDelta);
        maxAngularDeltaDeg = Math.max(maxAngularDeltaDeg, angle);
      }
    }

    const meshes = {};
    let totalVertices = 0;
    let nonFiniteVertices = 0;

    const tmp = new THREE.Vector3();

    for (const [role, mesh] of Object.entries(this.contract.meshes || {})) {
      if (!mesh?.isSkinnedMesh || !mesh.geometry?.attributes?.position) continue;

      mesh.updateMatrixWorld(true);

      const count = mesh.geometry.attributes.position.count;
      let bad = 0;

      const min = new THREE.Vector3(+Infinity, +Infinity, +Infinity);
      const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

      for (let i = 0; i < count; i++) {
        mesh.getVertexPosition(i, tmp);
        mesh.localToWorld(tmp);

        if (
          !Number.isFinite(tmp.x) ||
          !Number.isFinite(tmp.y) ||
          !Number.isFinite(tmp.z)
        ) {
          bad++;
          continue;
        }

        min.min(tmp);
        max.max(tmp);
      }

      totalVertices += count;
      nonFiniteVertices += bad;

      const size =
        bad === count
          ? new THREE.Vector3()
          : max.clone().sub(min);

      meshes[role] = {
        name: mesh.name || role,
        vertices: count,
        nonFiniteVertices: bad,
        size
      };
    }

    return {
      poseName: this.lastPoseName,
      bones: this.bones.length,
      movedBones,
      maxPositionDelta,
      maxAngularDeltaDeg,
      totalVertices,
      nonFiniteVertices,
      finite: nonFiniteVertices === 0,
      meshes
    };
  }

  formatValidation(report = this.validate()) {
    const f = n => Number(n || 0).toFixed(5);

    const out = [
      "=== POSE VALIDATION V8 ===",
      `pose: ${report.poseName}`,
      `bones: ${report.bones}`,
      `moved bones: ${report.movedBones}`,
      `max local position delta: ${f(report.maxPositionDelta)}`,
      `max angular delta: ${f(report.maxAngularDeltaDeg)} deg`,
      "",
      `vertices checked: ${report.totalVertices}`,
      `non finite vertices: ${report.nonFiniteVertices}`,
      `mesh finite: ${report.finite ? "SI" : "NO"}`,
      "",
      "MESH"
    ];

    for (const [role, mesh] of Object.entries(report.meshes || {})) {
      out.push(
        `- ${role}/${mesh.name}` +
        ` | vertices=${mesh.vertices}` +
        ` | bad=${mesh.nonFiniteVertices}` +
        ` | size=(${f(mesh.size.x)}, ${f(mesh.size.y)}, ${f(mesh.size.z)})`
      );
    }

    return out.join("\n");
  }
}
