"use strict";

import * as THREE from "three";

export class BoneOverlay {
  constructor(root, options = {}) {
    if (!root) throw new Error("BoneOverlay: root mancante.");

    this.root = root;
    this.group = new THREE.Group();
    this.group.name = "MakeHumanBoneOverlay";

    this.radius = options.radius ?? 0.018;
    this.lineWidth = options.lineWidth ?? 1;

    this._sphereGeometry = new THREE.SphereGeometry(this.radius, 10, 8);
    this._sphereMaterial = new THREE.MeshBasicMaterial({
      depthTest: false,
      depthWrite: false
    });

    this._lineMaterial = new THREE.LineBasicMaterial({
      depthTest: false,
      depthWrite: false
    });

    this._bones = [];
    this._joints = [];
    this._segments = [];

    root.traverse(node => {
      if (node.isBone) this._bones.push(node);
    });

    for (const bone of this._bones) {
      const joint = new THREE.Mesh(this._sphereGeometry, this._sphereMaterial);
      joint.renderOrder = 10000;
      this.group.add(joint);
      this._joints.push({ bone, joint });

      const parentBone = bone.parent?.isBone ? bone.parent : null;
      if (!parentBone) continue;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute([0,0,0, 0,0,0], 3)
      );

      const line = new THREE.Line(geometry, this._lineMaterial);
      line.renderOrder = 9999;
      this.group.add(line);
      this._segments.push({ parentBone, bone, line });
    }

    this.update();
  }

  update() {
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();

    for (const { bone, joint } of this._joints) {
      bone.getWorldPosition(a);
      joint.position.copy(a);
    }

    for (const { parentBone, bone, line } of this._segments) {
      parentBone.getWorldPosition(a);
      bone.getWorldPosition(b);

      const attr = line.geometry.attributes.position;
      attr.setXYZ(0, a.x, a.y, a.z);
      attr.setXYZ(1, b.x, b.y, b.z);
      attr.needsUpdate = true;
      line.geometry.computeBoundingSphere();
    }
  }

  dispose() {
    for (const { line } of this._segments) {
      line.geometry.dispose();
    }

    this._sphereGeometry.dispose();
    this._sphereMaterial.dispose();
    this._lineMaterial.dispose();

    this.group.clear();
    this._bones.length = 0;
    this._joints.length = 0;
    this._segments.length = 0;
  }
}
