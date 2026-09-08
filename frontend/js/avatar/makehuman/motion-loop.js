"use strict";

import * as THREE from "three";

/*
  MakeHumanMotionLoop V9

  Test continuo del rig post-refit.
  Non importa ancora clip esterne: genera un idle loop procedurale e reversibile.
  La rest pose viene catturata dopo il refit e ogni frame viene ricalcolato
  da quella base, quindi non c'è accumulo numerico frame-su-frame.
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

function deg(v) {
  return THREE.MathUtils.degToRad(v);
}

function worldRotate(bone, axis, degrees) {
  const axisVector =
    axis === "x" ? new THREE.Vector3(1, 0, 0) :
    axis === "y" ? new THREE.Vector3(0, 1, 0) :
    new THREE.Vector3(0, 0, 1);

  const delta = new THREE.Quaternion().setFromAxisAngle(axisVector, deg(degrees));

  const boneWorld = new THREE.Quaternion();
  bone.getWorldQuaternion(boneWorld);

  const targetWorld = delta.multiply(boneWorld);
  const parentWorld = new THREE.Quaternion();

  if (bone.parent) bone.parent.getWorldQuaternion(parentWorld);
  else parentWorld.identity();

  bone.quaternion.copy(parentWorld.invert().multiply(targetWorld).normalize());
}

export class MakeHumanMotionLoop {
  constructor(contract) {
    if (!contract?.skeleton) {
      throw new Error("MakeHumanMotionLoop: skeleton mancante.");
    }

    this.contract = contract;
    this.skeleton = contract.skeleton;
    this.bones = [...this.skeleton.bones];
    this.roles = { ...(contract.bones || {}) };

    this.rest = new Map();
    this.running = false;
    this.startedAt = 0;
    this.lastTime = 0;
    this.frames = 0;

    this._captureRest();
  }

  _root() {
    return rootOf(this.bones[0]);
  }

  _updateWorld() {
    const root = this._root();
    root?.updateMatrixWorld(true);
    this.skeleton.update();
    root?.updateMatrixWorld(true);
  }

  _captureRest() {
    this._updateWorld();
    this.rest.clear();

    for (const bone of this.bones) {
      this.rest.set(bone.uuid, cloneTransform(bone));
    }
  }

  resetPose() {
    for (const bone of this.bones) {
      const state = this.rest.get(bone.uuid);
      if (state) restoreTransform(bone, state);
    }

    this._updateWorld();
  }

  _role(name) {
    return this.roles[name] || null;
  }

  _applyAtSeconds(t, strength = 1) {
    this.resetPose();

    const s = Math.max(0, Math.min(1, Number(strength || 0)));

    // Idle principale ~4 secondi.
    const slow = Math.sin(t * Math.PI * 0.5);
    const slow2 = Math.sin(t * Math.PI * 0.5 + Math.PI / 2);

    // Respiro ~3 secondi.
    const breath = Math.sin(t * Math.PI * 0.66);

    const spine = this._role("spine");
    const spine1 = this._role("spine1");
    const spine2 = this._role("spine2");
    const neck = this._role("neck");
    const head = this._role("head");
    const leftArm = this._role("leftArm");
    const rightArm = this._role("rightArm");
    const leftForeArm = this._role("leftForeArm");
    const rightForeArm = this._role("rightForeArm");
    const leftUpLeg = this._role("leftUpLeg");
    const rightUpLeg = this._role("rightUpLeg");

    if (spine) worldRotate(spine, "y", slow * 1.2 * s);
    if (spine1) worldRotate(spine1, "x", breath * 0.7 * s);
    if (spine2) worldRotate(spine2, "z", slow2 * 0.9 * s);

    if (neck) worldRotate(neck, "y", slow * 2.2 * s);
    if (head) {
      worldRotate(head, "y", slow * 3.4 * s);
      worldRotate(head, "z", slow2 * 1.2 * s);
    }

    if (leftArm) {
      worldRotate(leftArm, "z", 2.0 * s + slow * 1.2 * s);
      worldRotate(leftArm, "x", breath * 0.7 * s);
    }

    if (rightArm) {
      worldRotate(rightArm, "z", -2.0 * s - slow * 1.2 * s);
      worldRotate(rightArm, "x", breath * 0.7 * s);
    }

    if (leftForeArm) worldRotate(leftForeArm, "x", 3.0 * s + slow2 * 1.0 * s);
    if (rightForeArm) worldRotate(rightForeArm, "x", 3.0 * s - slow2 * 1.0 * s);

    if (leftUpLeg) worldRotate(leftUpLeg, "x", slow * 0.6 * s);
    if (rightUpLeg) worldRotate(rightUpLeg, "x", -slow * 0.6 * s);

    this._updateWorld();
  }

  start(nowMs = performance.now()) {
    this.running = true;
    this.startedAt = nowMs;
    this.lastTime = nowMs;
    this.frames = 0;
  }

  stop({ reset = false } = {}) {
    this.running = false;
    if (reset) this.resetPose();
  }

  tick(nowMs, strength = 1) {
    if (!this.running) return false;

    const safeNow = Number.isFinite(nowMs)
      ? nowMs
      : performance.now();

    if (!Number.isFinite(this.startedAt) || this.startedAt <= 0) {
      this.startedAt = safeNow;
    }

    this.lastTime = safeNow;
    this.frames++;

    const t = Math.max(0, (safeNow - this.startedAt) / 1000);
    this._applyAtSeconds(t, strength);

    return true;
  }

  validateFinite() {
    const tmp = new THREE.Vector3();

    let totalVertices = 0;
    let badVertices = 0;

    for (const mesh of Object.values(this.contract.meshes || {})) {
      if (!mesh?.isSkinnedMesh || !mesh.geometry?.attributes?.position) continue;

      const count = mesh.geometry.attributes.position.count;
      totalVertices += count;

      mesh.updateMatrixWorld(true);

      for (let i = 0; i < count; i++) {
        mesh.getVertexPosition(i, tmp);
        mesh.localToWorld(tmp);

        if (
          !Number.isFinite(tmp.x) ||
          !Number.isFinite(tmp.y) ||
          !Number.isFinite(tmp.z)
        ) {
          badVertices++;
        }
      }
    }

    return {
      finite: badVertices === 0,
      totalVertices,
      badVertices,
      frames: this.frames,
      running: this.running,
      elapsedSeconds: this.startedAt ? Math.max(0, (this.lastTime - this.startedAt) / 1000) : 0
    };
  }

  formatValidation(r = this.validateFinite()) {
    return [
      "=== MOTION LOOP V9.1 ===",
      `running: ${r.running ? "SI" : "NO"}`,
      `frames: ${r.frames}`,
      `elapsed: ${r.elapsedSeconds.toFixed(2)} s`,
      "",
      `vertices checked: ${r.totalVertices}`,
      `non finite vertices: ${r.badVertices}`,
      `mesh finite: ${r.finite ? "SI" : "NO"}`
    ].join("\n");
  }
}
