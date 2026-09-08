"use strict";

import * as THREE from "three";
import {
  getMakeHumanSkin,
  listMakeHumanSkinTextureFamilies
} from "./skin-catalog.js";
import {
  getMakeHumanAge,
  listMakeHumanAges
} from "./age-catalog.js";

function configureTexture(texture) {
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

async function loadTextureFromUrls(loader, urls) {
  let lastError = null;

  for (const url of urls) {
    try {
      return configureTexture(await loader.loadAsync(url));
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Texture pelle/età non caricabile.");
}

export class MakeHumanSkinController {
  constructor(adapter) {
    if (!adapter) {
      throw new Error("MakeHumanSkinController: adapter mancante.");
    }

    this.adapter = adapter;
    this.contract = adapter.resolveContract();
    this.body = this.contract?.meshes?.body || null;

    if (!this.body?.isSkinnedMesh) {
      throw new Error("MakeHumanSkinController: Body SkinnedMesh mancante.");
    }

    this.loader = new THREE.TextureLoader();
    this.loader.setCrossOrigin("anonymous");

    this.originalMaterial = this.body.material;
    this.textureCache = new Map();
    this.preloadPromise = null;

    this.skinId = "light";
    this.ageId = "young";
    this.sex = "male";

    const base = Array.isArray(this.originalMaterial)
      ? this.originalMaterial[0]
      : this.originalMaterial;

    this.material =
      base?.clone?.() ||
      new THREE.MeshStandardMaterial();

    this.material.name = "ADF_MakeHuman_Skin_Age_Cached";
    this.material.color.set(0xffffff);
    this.material.metalness = 0;
    this.material.roughness = 0.78;
    this.material.transparent = false;
    this.material.opacity = 1;
    this.material.depthWrite = true;
    this.material.needsUpdate = true;

    this.body.material = this.material;
  }

  _key(ageId, textureFamily, sex) {
    return `${ageId}:${textureFamily}:${sex}`;
  }

  _urls(ageId, textureFamily, sex) {
    const age = getMakeHumanAge(ageId);

    if (!age) {
      throw new Error(`Età/aspetto sconosciuto: ${ageId}`);
    }

    const urls = age.textures?.[sex]?.[textureFamily];

    if (!urls?.length) {
      throw new Error(
        `Texture età assente: ${ageId}/${textureFamily}/${sex}`
      );
    }

    return urls;
  }

  async _ensureTexture(ageId, textureFamily, sex) {
    const key = this._key(ageId, textureFamily, sex);
    const cached = this.textureCache.get(key);

    if (cached) return cached;

    const texture = await loadTextureFromUrls(
      this.loader,
      this._urls(ageId, textureFamily, sex)
    );

    this.textureCache.set(key, texture);
    return texture;
  }

  async preloadAll() {
    if (this.preloadPromise) return this.preloadPromise;

    const families = listMakeHumanSkinTextureFamilies().map(
      family => family.id
    );

    this.preloadPromise = Promise.all(
      listMakeHumanAges().flatMap(age =>
        families.flatMap(textureFamily => [
          this._ensureTexture(
            age.id,
            textureFamily,
            "male"
          ),
          this._ensureTexture(
            age.id,
            textureFamily,
            "female"
          )
        ])
      )
    );

    try {
      await this.preloadPromise;
      return true;
    } catch (error) {
      this.preloadPromise = null;
      throw error;
    }
  }

  async _apply() {
    const preset = getMakeHumanSkin(this.skinId);

    if (!preset) {
      throw new Error(`Skin sconosciuta: ${this.skinId}`);
    }

    const texture = await this._ensureTexture(
      this.ageId,
      preset.textureFamily,
      this.sex
    );

    this.material.map = texture;
    this.material.color.set(preset.tint || "#ffffff");
    this.material.needsUpdate = true;

    return true;
  }

  async setSkin(id, sex = this.sex) {
    const preset = getMakeHumanSkin(id);

    if (!preset) {
      throw new Error(`Skin sconosciuta: ${id}`);
    }

    this.skinId = id;
    this.sex = sex === "female" ? "female" : "male";

    return this._apply();
  }

  async setAge(id) {
    if (!getMakeHumanAge(id)) {
      throw new Error(`Età/aspetto sconosciuto: ${id}`);
    }

    this.ageId = id;
    return this._apply();
  }

  async setSex(sex) {
    this.sex = sex === "female" ? "female" : "male";
    return this._apply();
  }

  getDiagnostics() {
    const preset = getMakeHumanSkin(this.skinId);
    const age = getMakeHumanAge(this.ageId);

    return {
      skinId: this.skinId,
      ageId: this.ageId,
      ageLabel: age?.label || null,
      sex: this.sex,
      textureFamily: preset?.textureFamily || null,
      tint: preset?.tint || null,
      bodyMesh: this.body?.name || null,
      textureLoaded: !!this.material?.map,
      bodyMaterialIsSkin: this.body?.material === this.material,
      cachedTextures: this.textureCache.size,
      preloadComplete: this.textureCache.size === 18
    };
  }

  restoreOriginal() {
    this.body.material = this.originalMaterial;
  }

  dispose() {
    this.restoreOriginal();

    for (const texture of this.textureCache.values()) {
      texture.dispose();
    }

    this.textureCache.clear();

    if (this.material) {
      this.material.map = null;
      this.material.dispose();
      this.material = null;
    }

    this.preloadPromise = null;
  }
}
