"use strict";

import * as THREE from "three";
import { parseMakeHumanMhmat } from "./makehuman-eye-mhmat.js";

/*
  V26 — MakeHuman PHONG .mhmat bridge

  Rule:
  read the MakeHuman material instead of inventing one.

  Used by:
  - Eyelashes
  - Teeth

  The original MakeHuman material declares:
  - diffuseColor
  - specularColor
  - shininess
  - emissiveColor
  - opacity
  - transparent
  - backfaceCull
  - depthless
  - alphaToCoverage
  - diffuseTexture
  - shader = data/shaders/glsl/phong

  Three.js MeshPhongMaterial is used only as the renderer bridge for the same
  Phong model. Every material coefficient comes from the .mhmat.
*/

const MAKEHUMAN_PHONG =
  "data/shaders/glsl/phong";

async function fetchText(url) {
  const response = await fetch(url, {
    mode: "cors",
    cache: "force-cache"
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${url}`
    );
  }

  return response.text();
}

async function loadTexture(url) {
  if (!url) return null;

  const texture =
    await new THREE.TextureLoader().loadAsync(url);

  // MakeHuman's original phong shader samples the texture directly.
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  return texture;
}

function toColor(rgb, fallback = [1, 1, 1]) {
  const v =
    Array.isArray(rgb) && rgb.length >= 3
      ? rgb
      : fallback;

  return new THREE.Color(
    Number(v[0]) || 0,
    Number(v[1]) || 0,
    Number(v[2]) || 0
  );
}

export class MakeHumanPhongMhmatMaterial {
  constructor({ mhmatUrl }) {
    if (!mhmatUrl) {
      throw new Error(
        "MakeHumanPhongMhmatMaterial: mhmatUrl mancante."
      );
    }

    this.mhmatUrl = mhmatUrl;
    this.definition = null;
    this.texture = null;
    this.material = null;
    this.diffuseUrl = null;
  }

  async load() {
    const text =
      await fetchText(this.mhmatUrl);

    const def =
      parseMakeHumanMhmat(text);

    if (def.shader !== MAKEHUMAN_PHONG) {
      throw new Error(
        `Shader MakeHuman inatteso: ${def.shader || "nessuno"}`
      );
    }

    const diffuseUrl =
      def.diffuseTexture
        ? new URL(
            def.diffuseTexture,
            this.mhmatUrl
          ).href
        : null;

    const texture =
      await loadTexture(diffuseUrl);

    const material =
      new THREE.MeshPhongMaterial({
        name:
          `MakeHumanPhong_${def.name || "Material"}`,

        color:
          toColor(
            def.diffuseColor,
            [1, 1, 1]
          ),

        specular:
          toColor(
            def.specularColor,
            [0, 0, 0]
          ),

        /*
          MakeHuman phong fragment:
          shininess = specular_color.a * 255.0
          .mhmat shininess is in the 0..1 range.
        */
        shininess:
          Math.max(
            0,
            Math.min(
              255,
              Number(def.shininess || 0) * 255
            )
          ),

        emissive:
          toColor(
            def.emissiveColor,
            [0, 0, 0]
          ),

        map:
          texture,

        transparent:
          !!def.transparent,

        opacity:
          Number.isFinite(def.opacity)
            ? def.opacity
            : 1,

        side:
          def.backfaceCull
            ? THREE.FrontSide
            : THREE.DoubleSide,

        depthTest:
          !def.depthless,

        depthWrite:
          !def.depthless,

        wireframe:
          !!def.wireframe,

        alphaToCoverage:
          !!def.alphaToCoverage,

        /*
          MakeHuman shader already outputs its shaded result.
          Avoid adding the runtime ACES pass to these simple body-part assets.
        */
        toneMapped:
          false
      });

    material.userData.makehumanMhmat = {
      mhmatUrl:
        this.mhmatUrl,
      name:
        def.name,
      shader:
        def.shader,
      diffuseTexture:
        def.diffuseTexture,
      diffuseColor:
        [...def.diffuseColor],
      specularColor:
        [...def.specularColor],
      shininess:
        def.shininess,
      transparent:
        def.transparent,
      backfaceCull:
        def.backfaceCull,
      depthless:
        def.depthless,
      alphaToCoverage:
        def.alphaToCoverage
    };

    material.needsUpdate = true;

    this.definition = def;
    this.texture = texture;
    this.material = material;
    this.diffuseUrl = diffuseUrl;

    return material;
  }

  getDiagnostics() {
    return {
      loaded:
        !!this.material,
      mhmatUrl:
        this.mhmatUrl,
      name:
        this.definition?.name || null,
      shader:
        this.definition?.shader || null,
      diffuse:
        this.diffuseUrl,
      transparent:
        this.definition?.transparent ?? null,
      backfaceCull:
        this.definition?.backfaceCull ?? null,
      shininess:
        this.definition?.shininess ?? null
    };
  }

  dispose() {
    this.material?.dispose?.();
    this.texture?.dispose?.();

    this.material = null;
    this.texture = null;
    this.definition = null;
  }
}
