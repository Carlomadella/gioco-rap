"use strict";

import * as THREE from "three";
import { MakeHumanProxyEngine } from "./proxy-engine.js";
import { MakeHumanEyeMhmatMaterial } from "./makehuman-eye-mhmat.js";

/*
  V25 — Native MakeHuman eyes

  Geometry:
    official MakeHuman HighPolyEyes HM08 proxy.

  Material presets:
    original MakeHuman eye textures.

  No synthetic iris planes, no bbox-derived iris sizing, no sex-specific
  offsets. Male and female use the same MakeHuman eye proxy; the .mhclo
  fitting follows the current HM08 character geometry.
*/

const OFFICIAL_COMMIT =
  "a8bc2d54ff0ac92e78ff71431b1023eda42bf482";

const OFFICIAL_ROOT =
  `https://raw.githubusercontent.com/makehumancommunity/makehuman/${OFFICIAL_COMMIT}/makehuman/data/eyes`;

const LEGACY_MIRROR_COMMIT =
  "8b0c95acad9f53629513bdebea39ac84ee8780a7";

const LEGACY_REPOSITORY_ROOT =
  `https://raw.githubusercontent.com/intoro/MakeHumanForBlender/${LEGACY_MIRROR_COMMIT}/makehuman-1.1.1-win32`;

const LEGACY_MATERIAL_ROOT =
  `${LEGACY_REPOSITORY_ROOT}/data/eyes/materials`;

const OFFICIAL_REPOSITORY_ROOT =
  `https://raw.githubusercontent.com/makehumancommunity/makehuman/${OFFICIAL_COMMIT}/makehuman`;

/*
  V25.4 custom-color mask references.
  Both are original MakeHuman eye textures with identical UV layout.
  Their pixel difference is used only to identify the iris region.
*/
const CUSTOM_IRIS_MASK_A =
  `${OFFICIAL_ROOT}/materials/brown_eye.png`;

const CUSTOM_IRIS_MASK_B =
  `${LEGACY_MATERIAL_ROOT}/green_eye.png`;

const EYE_ASSET = Object.freeze({
  id: "makehuman-high-poly-eyes",
  objUrl:
    `${OFFICIAL_ROOT}/high-poly/high-poly.obj`,
  proxyUrl:
    `${OFFICIAL_ROOT}/high-poly/high-poly.mhclo`,
  diffuseUrl: null,
  normalUrl: null,
  material: Object.freeze({
    roughness: 0.42,
    metalness: 0,
    doubleSide: false,
    alphaTest: 0,
    alphaToCoverage: false
  })
});

const NATIVE_EYE_PRESETS = Object.freeze({
  brown: Object.freeze({
    label: "Marroni",
    mhmatUrl:
      `${OFFICIAL_ROOT}/materials/brown.mhmat`,
    repositoryRoot:
      OFFICIAL_REPOSITORY_ROOT,
    source:
      "makehuman-current"
  }),

  lightBrown: Object.freeze({
    label: "Nocciola",
    mhmatUrl:
      `${LEGACY_MATERIAL_ROOT}/brownlight.mhmat`,
    repositoryRoot:
      LEGACY_REPOSITORY_ROOT,
    source:
      "makehuman-1.1.1"
  }),

  green: Object.freeze({
    label: "Verdi",
    mhmatUrl:
      `${LEGACY_MATERIAL_ROOT}/green.mhmat`,
    repositoryRoot:
      LEGACY_REPOSITORY_ROOT,
    source:
      "makehuman-1.1.1"
  }),

  blueGreen: Object.freeze({
    label: "Verde-azzurri",
    mhmatUrl:
      `${LEGACY_MATERIAL_ROOT}/bluegreen.mhmat`,
    repositoryRoot:
      LEGACY_REPOSITORY_ROOT,
    source:
      "makehuman-1.1.1"
  }),

  lightBlue: Object.freeze({
    label: "Azzurri",
    mhmatUrl:
      `${LEGACY_MATERIAL_ROOT}/lightblue.mhmat`,
    repositoryRoot:
      LEGACY_REPOSITORY_ROOT,
    source:
      "makehuman-1.1.1"
  }),

  deepBlue: Object.freeze({
    label: "Blu scuro",
    mhmatUrl:
      `${LEGACY_MATERIAL_ROOT}/deepblue.mhmat`,
    repositoryRoot:
      LEGACY_REPOSITORY_ROOT,
    source:
      "makehuman-1.1.1"
  }),

  grey: Object.freeze({
    label: "Grigi",
    mhmatUrl:
      `${LEGACY_MATERIAL_ROOT}/grey.mhmat`,
    repositoryRoot:
      LEGACY_REPOSITORY_ROOT,
    source:
      "makehuman-1.1.1"
  })
});

export class NativeMakeHumanEyeProxyController {
  constructor(adapter) {
    if (!adapter?.resolveContract) {
      throw new Error(
        "NativeMakeHumanEyeProxyController richiede MakeHumanAdapter."
      );
    }

    this.adapter = adapter;

    this.contract =
      adapter.resolveContract({ force: true });

    this.helperEyes =
      this.contract?.meshes?.eyes || null;

    this.engine =
      new MakeHumanProxyEngine(adapter);

    this.mhmatMaterial = null;
    this.preset = "brown";
    this.customColor = null;
    this.loaded = false;
    this.updateCount = 0;
  }

  async init(preset = "brown") {
    await this.engine.load(EYE_ASSET);

    if (!this.engine?.mesh || !this.engine?.material) {
      throw new Error(
        "HighPolyEyes MakeHuman non montati."
      );
    }

    // Native proxy replaces rendered canonical helper Eyes.
    // The hidden helper is kept only as geometry reference for brows.
    if (this.helperEyes) {
      this.helperEyes.visible = false;
    }

    // Dispose the generic proxy-engine material immediately.
    // V25.1 will replace it from the MakeHuman .mhmat.
    this.engine.materialController?.dispose?.();
    this.engine.materialController = null;

    this.engine.mesh.castShadow = true;
    this.engine.mesh.receiveShadow = true;
    this.engine.mesh.renderOrder = 4;

    await this.setPreset(preset);

    this.update();

    this.loaded = true;

    return this.getDiagnostics();
  }

  async setPreset(key) {
    const normalized =
      Object.prototype.hasOwnProperty.call(
        NATIVE_EYE_PRESETS,
        key
      )
        ? key
        : "brown";

    const preset =
      NATIVE_EYE_PRESETS[normalized];

    const next =
      new MakeHumanEyeMhmatMaterial({
        mhmatUrl:
          preset.mhmatUrl,
        repositoryRoot:
          preset.repositoryRoot,
        irisMaskAUrl:
          CUSTOM_IRIS_MASK_A,
        irisMaskBUrl:
          CUSTOM_IRIS_MASK_B
      });

    const material =
      await next.load();

    const previousMhmat =
      this.mhmatMaterial;

    const previousMaterial =
      this.engine.material;

    this.mhmatMaterial =
      next;

    this.preset =
      normalized;

    this.engine.material =
      material;

    this.engine.mesh.material =
      material;

    this.engine.mesh.castShadow =
      next.definition?.castShadows !== false;

    this.engine.mesh.receiveShadow =
      next.definition?.receiveShadows !== false;

    /*
      The previous generic material belongs to ProxyEngine and must be
      disposed exactly once. After the first preset swap, the previous
      material belongs to previousMhmat, whose dispose handles it.
    */
    if (previousMhmat) {
      previousMhmat.dispose();
    } else if (
      previousMaterial &&
      previousMaterial !== material
    ) {
      previousMaterial.dispose?.();
    }

    if (this.customColor) {
      this.mhmatMaterial.setCustomIrisColor(
        this.customColor
      );
    } else {
      this.mhmatMaterial.clearCustomIrisColor();
    }

    material.needsUpdate = true;

    return this.preset;
  }


  setCustomColor(hex) {
    const color =
      new THREE.Color(hex || "#4e6a3d");

    this.customColor =
      "#" + color.getHexString();

    this.mhmatMaterial?.setCustomIrisColor(
      this.customColor
    );

    return this.customColor;
  }

  clearCustomColor() {
    this.customColor = null;

    this.mhmatMaterial?.clearCustomIrisColor?.();

    return true;
  }

  update() {
    if (!this.engine) return false;

    if (this.helperEyes) {
      this.helperEyes.visible = false;
    }

    const result =
      this.engine.update();

    this.updateCount++;

    return result;
  }

  getPreset() {
    return this.preset;
  }

  getDiagnostics() {
    const preset =
      NATIVE_EYE_PRESETS[this.preset];

    const engine =
      this.engine?.getDiagnostics?.() || null;

    return {
      loaded: this.loaded,
      preset: this.preset,
      presetLabel:
        preset?.label || this.preset,
      materialSource:
        preset?.source || null,
      mhmat:
        this.mhmatMaterial?.getDiagnostics?.() || null,
      customColor:
        this.customColor,
      officialCommit:
        OFFICIAL_COMMIT,
      legacyMirrorCommit:
        LEGACY_MIRROR_COMMIT,
      helperEyesFound:
        !!this.helperEyes,
      helperEyesVisible:
        this.helperEyes?.visible ?? null,
      proxyMesh:
        this.engine?.mesh?.name || null,
      proxyVertices:
        engine?.proxyVertices ?? null,
      renderVertices:
        engine?.renderVertices ?? null,
      missingHm08:
        engine?.missingReferencedHm08Vertices || [],
      finite:
        engine?.finite ?? null,
      updateCount:
        this.updateCount
    };
  }

  async dispose() {
    /*
      Prevent ProxyEngine.dispose() from disposing the .mhmat material
      a second time after our bridge releases its textures + shader.
    */
    if (
      this.engine &&
      this.mhmatMaterial?.material &&
      this.engine.material ===
        this.mhmatMaterial.material
    ) {
      this.engine.material = null;
    }

    this.mhmatMaterial?.dispose?.();
    this.mhmatMaterial = null;

    await this.engine?.dispose?.();

    this.loaded = false;
  }
}

export {
  NATIVE_EYE_PRESETS
};
