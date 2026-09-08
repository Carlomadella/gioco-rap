"use strict";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { inspectAvatarRoot } from "./inspector.js";
import { resolveMakeHumanContract } from "./contract.js";
import {
  cloneMakeHumanConfig,
  createEmptyMakeHumanConfig,
  normalizeMakeHumanConfig
} from "./schema.js";

const clamp01 = v => Math.max(0, Math.min(1, Number.isFinite(+v) ? +v : 0));
const clampSigned = v => Math.max(-1, Math.min(1, Number.isFinite(+v) ? +v : 0));

function disposeMaterial(material, seenTextures) {
  if (!material) return;
  for (const value of Object.values(material)) {
    if (value?.isTexture && !seenTextures.has(value.uuid)) {
      seenTextures.add(value.uuid);
      value.dispose?.();
    }
  }
  material.dispose?.();
}

export class MakeHumanAdapter {
  constructor({ gltf, modelUrl = "", config = null }) {
    if (!gltf?.scene) throw new Error("MakeHumanAdapter: GLTF non valido.");
    this.gltf = gltf;
    this.root = gltf.scene;
    this.animations = Array.isArray(gltf.animations) ? gltf.animations : [];
    this.modelUrl = modelUrl;
    this.config = config
      ? normalizeMakeHumanConfig(config)
      : createEmptyMakeHumanConfig(modelUrl);
    this._report = null;
    this._contract = null;
    this._disposed = false;
  }

  static load(modelUrl, { config = null, manager = undefined } = {}) {
    if (!modelUrl) return Promise.reject(new Error("MakeHumanAdapter.load: modelUrl mancante."));
    const loader = new GLTFLoader(manager);
    return new Promise((resolve, reject) => {
      loader.load(modelUrl, gltf => {
        try {
          const adapter = new MakeHumanAdapter({ gltf, modelUrl, config });
          adapter.resolveContract({ force: true });
          adapter.applySerializedState();
          resolve(adapter);
        } catch (error) {
          reject(error);
        }
      }, undefined, reject);
    });
  }

  inspect({ force = false } = {}) {
    if (!this._report || force) this._report = inspectAvatarRoot(this.root);
    return this._report;
  }

  resolveContract({ force = false } = {}) {
    if (!this._contract || force) {
      this._contract = resolveMakeHumanContract(this.root, this.inspect({ force }));
    }
    return this._contract;
  }

  listMorphTargets() {
    return this.inspect().morphTargets.map(x => x.name);
  }

  meshesWithMorph(name) {
    const matches = [];
    this.root.traverse(node => {
      if (!node.isMesh || !node.morphTargetDictionary || !node.morphTargetInfluences) return;
      if (Object.prototype.hasOwnProperty.call(node.morphTargetDictionary, name)) matches.push(node);
    });
    return matches;
  }

  getMorphValue(name) {
    const mesh = this.meshesWithMorph(name)[0];
    if (!mesh) return 0;
    const index = mesh.morphTargetDictionary[name];
    return Number(mesh.morphTargetInfluences?.[index] || 0);
  }

  setMorph(name, value) {
    if (!name) return 0;
    const v = clamp01(value);
    const matches = this.meshesWithMorph(name);

    for (const mesh of matches) {
      const index = mesh.morphTargetDictionary[name];
      if (Number.isInteger(index) && index >= 0 && index < mesh.morphTargetInfluences.length) {
        mesh.morphTargetInfluences[index] = v;
      }
    }

    if (matches.length) {
      this.config.morphs[name] = v;
      this.root.updateMatrixWorld(true);
    }
    return matches.length;
  }

  setMorphs(values = {}) {
    let affected = 0;
    for (const [name, value] of Object.entries(values || {})) affected += this.setMorph(name, value);
    return affected;
  }

  setSignedPair(negativeMorph, positiveMorph, signedValue) {
    const value = clampSigned(signedValue);
    const negative = value < 0 ? Math.abs(value) : 0;
    const positive = value > 0 ? value : 0;
    const a = this.setMorph(negativeMorph, negative);
    const b = this.setMorph(positiveMorph, positive);
    return { value, negativeMorph, positiveMorph, negative, positive, affectedMeshes: a + b };
  }

  setSex(sex = "neutral") {
    const normalized = sex === "male" ? "male" : sex === "female" ? "female" : "neutral";
    this.config.controls.sex = normalized;
    return {
      sex: normalized,
      masculineMeshes: this.setMorph("bodyMasculine", normalized === "male" ? 1 : 0),
      feminineMeshes: this.setMorph("bodyFeminine", normalized === "female" ? 1 : 0)
    };
  }

  setHeight(value = 0) {
    const r = this.setSignedPair("heightShorter", "heightTaller", value);
    this.config.controls.height = r.value;
    return r;
  }

  setMass(value = 0) {
    const r = this.setSignedPair("bodyThinner", "bodyHeavier", value);
    this.config.controls.mass = r.value;
    return r;
  }

  setBuild(value = 0) {
    const r = this.setSignedPair("bodySofter", "bodyMuscular", value);
    this.config.controls.build = r.value;
    return r;
  }

  resetBodyControls() {
    this.setSex("neutral");
    this.setHeight(0);
    this.setMass(0);
    this.setBuild(0);
  }

  applySerializedMorphs() {
    return this.setMorphs(this.config.morphs || {});
  }

  applySerializedControls() {
    const c = this.config.controls || {};
    this.setSex(c.sex || "neutral");
    this.setHeight(c.height || 0);
    this.setMass(c.mass || 0);
    this.setBuild(c.build || 0);
  }

  applySerializedState() {
    this.applySerializedMorphs();
    this.applySerializedControls();
  }

  serialize() {
    this.config.sourceModel.url = this.modelUrl || this.config.sourceModel.url || "";
    return cloneMakeHumanConfig(this.config);
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    const seenGeometries = new Set();
    const seenMaterials = new Set();
    const seenTextures = new Set();

    this.root.traverse(node => {
      if (!node.isMesh) return;

      const geometry = node.geometry;
      if (geometry && !seenGeometries.has(geometry.uuid)) {
        seenGeometries.add(geometry.uuid);
        geometry.dispose?.();
      }

      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) {
        if (!material || seenMaterials.has(material.uuid)) continue;
        seenMaterials.add(material.uuid);
        disposeMaterial(material, seenTextures);
      }
    });
  }
}
