"use strict";

import {
  MakeHumanProxyEngine
} from "./proxy-engine.js";

import {
  MakeHumanAssetPackLoader
} from "./makehuman-asset-pack-loader.js";

import {
  MakeHumanPackMaterial
} from "./makehuman-pack-material.js";

/*
  V27 — MakeHuman Community facial personalization.

  Facial hair:
    official Bodyparts05 CC0 pack.
    MakeHuman/MPFB categorizes these as CLOTHES MHCLO assets.

  Facial jewelry:
    official Jewelry01 CC0 pack.
    Also native CLOTHES MHCLO assets.

  There is intentionally:
  - no synthetic beard plane;
  - no hard-coded positioning;
  - no manually modeled piercing;
  - no bone-parent approximation.

  The existing generic HM08 MHCLO engine performs the native fitting.
*/

export const FACIAL_HAIR_PRESETS =
  Object.freeze([
    Object.freeze({
      id: "culturalibre_faun_beard",
      label: "Faun beard"
    }),
    Object.freeze({
      id: "grinsegold_beard_sigmund_wip",
      label: "Sigmund"
    }),
    Object.freeze({
      id: "rehmanpolanski_beard_viking",
      label: "Viking beard"
    }),
    Object.freeze({
      id: "rehmanpolanski_moustache_viking",
      label: "Viking moustache"
    }),
    Object.freeze({
      id: "wdg_scruffy_beard",
      label: "Scruffy"
    })
  ]);

export const FACE_JEWELRY_PRESETS =
  Object.freeze([
    Object.freeze({
      id: "ews_septum_ring",
      label: "Septum"
    }),
    Object.freeze({
      id: "ews_industrial_piercing_left_ear_",
      label: "Industrial SX"
    }),
    Object.freeze({
      id: "ews_industrial_piercing_right_ear_",
      label: "Industrial DX"
    }),
    Object.freeze({
      id: "ews_hoop_earrings",
      label: "Hoop"
    }),
    Object.freeze({
      id: "toigo_pearl_earrings",
      label: "Perle"
    }),
    Object.freeze({
      id: "culturalibre_heroine_lightning_earrings",
      label: "Lightning"
    })
  ]);

class NativeCommunitySlot {
  constructor({
    adapter,
    packLoader,
    packId,
    role
  }) {
    this.adapter = adapter;
    this.packLoader = packLoader;
    this.packId = packId;
    this.role = role;

    this.engine =
      new MakeHumanProxyEngine(adapter);

    this.materialBridge = null;

    this.assetId = null;
    this.assetMeta = null;
    this.enabled = false;
  }

  async load(assetId) {
    const pack =
      await this.packLoader.load(
        this.packId
      );

    const asset =
      await pack.getMhcloAsset(
        assetId
      );

    await this.engine.load({
      id:
        `${this.role}-${assetId}`,
      objUrl:
        asset.objUrl,
      proxyUrl:
        asset.proxyUrl,
      diffuseUrl:
        null,
      normalUrl:
        null,
      material:
        Object.freeze({})
    });

    const oldMaterial =
      this.engine.material;

    this.engine.materialController?.dispose?.();
    this.engine.materialController = null;

    this.materialBridge?.dispose?.();

    this.materialBridge =
      new MakeHumanPackMaterial({
        pack,
        mhmatEntry:
          asset.mhmatEntry,
        label:
          assetId
      });

    const nativeMaterial =
      await this.materialBridge.load();

    this.engine.material =
      nativeMaterial;

    this.engine.mesh.material =
      nativeMaterial;

    if (
      oldMaterial &&
      oldMaterial !== nativeMaterial
    ) {
      oldMaterial.dispose?.();
    }

    this.engine.mesh.frustumCulled = false;
    this.engine.mesh.castShadow = true;
    this.engine.mesh.receiveShadow = true;

    this.assetId = assetId;
    this.assetMeta = asset;
    this.enabled = true;

    this.engine.root.visible = true;

    this.update();

    return assetId;
  }

  setEnabled(enabled) {
    this.enabled =
      !!enabled;

    if (this.engine?.root) {
      this.engine.root.visible =
        this.enabled;
    }

    return this.enabled;
  }

  update() {
    if (
      !this.assetId ||
      !this.engine?.mesh
    ) {
      return false;
    }

    const result =
      this.engine.update();

    if (this.engine.root) {
      this.engine.root.visible =
        this.enabled;
    }

    return result;
  }

  getDiagnostics() {
    const d =
      this.engine?.getDiagnostics?.() || {};

    return {
      role:
        this.role,
      packId:
        this.packId,
      assetId:
        this.assetId,
      enabled:
        this.enabled,
      mhclo:
        this.assetMeta?.mhcloEntry || null,
      obj:
        this.assetMeta?.objEntry || null,
      mhmat:
        this.assetMeta?.mhmatEntry || null,
      proxyVertices:
        d.proxyVertices ?? null,
      renderVertices:
        d.renderVertices ?? null,
      missingHm08:
        d.missingReferencedHm08Vertices || [],
      finite:
        d.finite ?? null,
      material:
        this.materialBridge?.getDiagnostics?.() || null
    };
  }

  async dispose() {
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

    this.assetId = null;
    this.assetMeta = null;
    this.enabled = false;
  }
}

export class NativeMakeHumanFaceAccessoriesController {
  constructor(adapter) {
    this.adapter = adapter;

    this.packLoader =
      new MakeHumanAssetPackLoader();

    this.facialHair =
      new NativeCommunitySlot({
        adapter,
        packLoader:
          this.packLoader,
        packId:
          "bodyparts05",
        role:
          "facial-hair"
      });

    this.jewelry =
      new Map();

    this.selectedFacialHair =
      "none";
  }

  async setFacialHair(assetId) {
    if (
      !assetId ||
      assetId === "none"
    ) {
      this.selectedFacialHair =
        "none";

      this.facialHair.setEnabled(false);

      return "none";
    }

    if (
      !FACIAL_HAIR_PRESETS.some(
        item => item.id === assetId
      )
    ) {
      throw new Error(
        `Barba/baffi MakeHuman non previsti: ${assetId}`
      );
    }

    await this.facialHair.load(assetId);

    this.selectedFacialHair =
      assetId;

    return assetId;
  }

  async setJewelry(assetId, enabled) {
    const valid =
      FACE_JEWELRY_PRESETS.some(
        item => item.id === assetId
      );

    if (!valid) {
      throw new Error(
        `Accessorio viso MakeHuman non previsto: ${assetId}`
      );
    }

    let slot =
      this.jewelry.get(assetId);

    if (!enabled) {
      slot?.setEnabled(false);
      return false;
    }

    if (!slot) {
      slot =
        new NativeCommunitySlot({
          adapter:
            this.adapter,
          packLoader:
            this.packLoader,
          packId:
            "jewelry01",
          role:
            "face-jewelry"
        });

      this.jewelry.set(
        assetId,
        slot
      );
    }

    if (!slot.assetId) {
      await slot.load(assetId);
    }

    slot.setEnabled(true);
    slot.update();

    return true;
  }

  update() {
    this.facialHair.update();

    for (const slot of this.jewelry.values()) {
      slot.update();
    }

    return true;
  }

  getDiagnostics() {
    const jewelry =
      {};

    for (const [id, slot] of this.jewelry) {
      jewelry[id] =
        slot.getDiagnostics();
    }

    return {
      selectedFacialHair:
        this.selectedFacialHair,
      facialHair:
        this.facialHair.getDiagnostics(),
      jewelry,
      packs:
        this.packLoader.getDiagnostics()
    };
  }

  async dispose() {
    await this.facialHair.dispose();

    for (const slot of this.jewelry.values()) {
      await slot.dispose();
    }

    this.jewelry.clear();

    this.packLoader.dispose();
  }
}
