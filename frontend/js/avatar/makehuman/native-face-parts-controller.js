"use strict";

import { MakeHumanProxyEngine } from "./proxy-engine.js";
import { MakeHumanPhongMhmatMaterial } from "./makehuman-phong-mhmat.js";
import { MakeHumanEyeMhmatMaterial } from "./makehuman-eye-mhmat.js";

/*
  V26 — Remaining native MakeHuman face parts

  MakeHuman's own SimpleProxyTypes are:
    Hair, Eyes, Eyebrows, Eyelashes, Teeth, Tongue.

  Hair, Eyes and Eyebrows were already native in our runtime.
  V26 adds the remaining three categories exactly as MakeHuman proxies:

  - Eyelashes: eyelashes01 ... eyelashes04
  - Teeth: teeth_base + teeth_shape01 ... teeth_shape05
  - Tongue: tongue01

  Source mirror is the same MakeHuman 1.2 base data used for native eyebrows.
  No synthetic geometry and no coordinate fitting invented by us.
*/

const COMMIT =
  "8d806798841f6e77368cbb2cd2b43d3d4a8f42d1";

const REPO_ROOT =
  `https://raw.githubusercontent.com/dmaugis/makehuman-custom/${COMMIT}/makehuman`;

const DATA_ROOT =
  `${REPO_ROOT}/data`;

function proxyAsset({
  id,
  folder,
  file = id
}) {
  return Object.freeze({
    id,
    objUrl:
      `${DATA_ROOT}/${folder}/${id}/${file}.obj`,
    proxyUrl:
      `${DATA_ROOT}/${folder}/${id}/${file}.mhclo`,
    diffuseUrl: null,
    normalUrl: null,
    material: Object.freeze({})
  });
}

export const MAKEHUMAN_EYELASH_PRESETS =
  Object.freeze([
    "eyelashes01",
    "eyelashes02",
    "eyelashes03",
    "eyelashes04"
  ]);

export const MAKEHUMAN_TEETH_PRESETS =
  Object.freeze([
    "teeth_base",
    "teeth_shape01",
    "teeth_shape02",
    "teeth_shape03",
    "teeth_shape04",
    "teeth_shape05"
  ]);

class NativeProxySlot {
  constructor({
    adapter,
    role,
    helperMesh = null
  }) {
    this.adapter = adapter;
    this.role = role;
    this.helperMesh = helperMesh;

    this.engine =
      new MakeHumanProxyEngine(adapter);

    this.materialBridge = null;

    this.preset = null;
    this.enabled = true;
    this.loaded = false;
    this.updateCount = 0;
  }

  async _replaceMaterial(bridge) {
    const material =
      await bridge.load();

    const oldMaterial =
      this.engine.material;

    this.engine.materialController?.dispose?.();
    this.engine.materialController = null;

    this.materialBridge?.dispose?.();

    this.materialBridge = bridge;

    this.engine.material = material;
    this.engine.mesh.material = material;

    if (
      oldMaterial &&
      oldMaterial !== material
    ) {
      oldMaterial.dispose?.();
    }

    const def =
      bridge.definition || {};

    this.engine.mesh.castShadow =
      def.castShadows !== false;

    this.engine.mesh.receiveShadow =
      def.receiveShadows !== false;

    this.engine.mesh.frustumCulled = false;

    material.needsUpdate = true;
  }

  setEnabled(enabled = true) {
    this.enabled = !!enabled;

    if (this.engine?.root) {
      this.engine.root.visible =
        this.enabled;
    }

    return this.enabled;
  }

  update() {
    if (!this.loaded) return false;

    const result =
      this.engine.update();

    this.updateCount++;

    if (this.engine?.root) {
      this.engine.root.visible =
        this.enabled;
    }

    if (this.helperMesh) {
      this.helperMesh.visible = false;
    }

    return result;
  }

  getDiagnostics() {
    const d =
      this.engine?.getDiagnostics?.() || {};

    return {
      role:
        this.role,
      loaded:
        this.loaded,
      enabled:
        this.enabled,
      preset:
        this.preset,
      proxyMesh:
        this.engine?.mesh?.name || null,
      proxyVertices:
        d.proxyVertices ?? null,
      renderVertices:
        d.renderVertices ?? null,
      missingHm08:
        d.missingReferencedHm08Vertices || [],
      finite:
        d.finite ?? null,
      updates:
        this.updateCount,
      mhmat:
        this.materialBridge?.getDiagnostics?.() || null
    };
  }

  async dispose() {
    /*
      Prevent double-disposal of a material owned by the bridge.
    */
    if (
      this.engine &&
      this.materialBridge?.material &&
      this.engine.material ===
        this.materialBridge.material
    ) {
      this.engine.material = null;
    }

    this.materialBridge?.dispose?.();
    this.materialBridge = null;

    await this.engine?.dispose?.();

    this.loaded = false;
  }
}

export class NativeMakeHumanFacePartsController {
  constructor(adapter) {
    if (!adapter?.resolveContract) {
      throw new Error(
        "NativeMakeHumanFacePartsController richiede MakeHumanAdapter."
      );
    }

    this.adapter = adapter;

    const contract =
      adapter.resolveContract({ force: true });

    this.helperTeeth =
      contract?.meshes?.teeth || null;

    this.helperTongue =
      contract?.meshes?.tongue || null;

    this.eyelashes =
      new NativeProxySlot({
        adapter,
        role: "eyelashes"
      });

    this.teeth =
      new NativeProxySlot({
        adapter,
        role: "teeth",
        helperMesh:
          this.helperTeeth
      });

    this.tongue =
      new NativeProxySlot({
        adapter,
        role: "tongue",
        helperMesh:
          this.helperTongue
      });
  }

  async init() {
    await this.setEyelashes(
      "eyelashes01"
    );

    await this.setTeeth(
      "teeth_base"
    );

    await this._loadTongue();

    this._hideHelpers();

    return this.getDiagnostics();
  }

  _hideHelpers() {
    if (this.helperTeeth) {
      this.helperTeeth.visible = false;
    }

    if (this.helperTongue) {
      this.helperTongue.visible = false;
    }
  }

  async setEyelashes(id) {
    if (id === "none") {
      this.eyelashes.setEnabled(false);
      return "none";
    }

    const normalized =
      MAKEHUMAN_EYELASH_PRESETS.includes(id)
        ? id
        : "eyelashes01";

    const asset =
      proxyAsset({
        id: normalized,
        folder: "eyelashes"
      });

    await this.eyelashes.engine.load(
      asset
    );

    const mhmat =
      `${DATA_ROOT}/eyelashes/${normalized}/${normalized}.mhmat`;

    await this.eyelashes._replaceMaterial(
      new MakeHumanPhongMhmatMaterial({
        mhmatUrl: mhmat
      })
    );

    this.eyelashes.preset =
      normalized;

    this.eyelashes.loaded = true;
    this.eyelashes.setEnabled(true);
    this.eyelashes.update();

    return normalized;
  }

  async setTeeth(id) {
    const normalized =
      MAKEHUMAN_TEETH_PRESETS.includes(id)
        ? id
        : "teeth_base";

    const asset =
      proxyAsset({
        id: normalized,
        folder: "teeth"
      });

    await this.teeth.engine.load(
      asset
    );

    /*
      Every stock MakeHuman teeth shape points to:
        ../materials/teeth.mhmat
    */
    const mhmat =
      `${DATA_ROOT}/teeth/materials/teeth.mhmat`;

    await this.teeth._replaceMaterial(
      new MakeHumanPhongMhmatMaterial({
        mhmatUrl: mhmat
      })
    );

    this.teeth.preset =
      normalized;

    this.teeth.loaded = true;
    this.teeth.setEnabled(true);
    this.teeth.update();

    this._hideHelpers();

    return normalized;
  }

  async _loadTongue() {
    const id =
      "tongue01";

    const asset =
      proxyAsset({
        id,
        folder: "tongue"
      });

    await this.tongue.engine.load(
      asset
    );

    /*
      tongue01 uses MakeHuman's litsphere shader.
      Reuse the exact same .mhmat/litsphere bridge already validated
      by HighPolyEyes. Custom iris features remain disabled.
    */
    const bridge =
      new MakeHumanEyeMhmatMaterial({
        mhmatUrl:
          `${DATA_ROOT}/tongue/${id}/${id}.mhmat`,
        repositoryRoot:
          REPO_ROOT
      });

    await this.tongue._replaceMaterial(
      bridge
    );

    this.tongue.preset = id;
    this.tongue.loaded = true;
    this.tongue.setEnabled(true);
    this.tongue.update();

    this._hideHelpers();

    return id;
  }

  update() {
    this._hideHelpers();

    this.eyelashes.update();
    this.teeth.update();
    this.tongue.update();

    return true;
  }

  getDiagnostics() {
    return {
      sourceCommit:
        COMMIT,
      eyelashes:
        this.eyelashes.getDiagnostics(),
      teeth:
        this.teeth.getDiagnostics(),
      tongue:
        this.tongue.getDiagnostics(),
      helperTeethVisible:
        this.helperTeeth?.visible ?? null,
      helperTongueVisible:
        this.helperTongue?.visible ?? null
    };
  }

  async dispose() {
    await this.eyelashes.dispose();
    await this.teeth.dispose();
    await this.tongue.dispose();
  }
}
