"use strict";

import * as THREE from "three";
import {
  parseMakeHumanMhmat
} from "./makehuman-eye-mhmat.js";

/*
  V27 — material bridge for original MakeHuman Community pack assets.

  If an asset has .mhmat:
    read its actual MakeHuman properties.

  If it has no .mhmat:
    use the actual defaults from MakeHuman Material.__init__:
      diffuse 1 1 1
      specular 1 1 1
      shininess 0.2
      opacity 1
      transparent False
      backfaceCull True
      depthless False
      alphaToCoverage True

  No PBR roughness/metalness guessing.
*/

const MAKEHUMAN_DEFAULTS = Object.freeze({
  name: "MakeHumanDefault",
  diffuseColor: [1, 1, 1],
  specularColor: [1, 1, 1],
  emissiveColor: [0, 0, 0],
  shininess: 0.2,
  opacity: 1,
  transparent: false,
  backfaceCull: true,
  depthless: false,
  alphaToCoverage: true,
  wireframe: false,
  diffuseTexture: null,
  bumpTexture: null,
  normalmapTexture: null,
  shader: null
});

function stripComment(line) {
  const i =
    line.indexOf("#");

  return (
    i >= 0
      ? line.slice(0, i)
      : line
  ).trim();
}

function extendTextureFields(def, text) {
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line =
      stripComment(raw);

    if (!line) continue;

    const p =
      line.split(/\s+/);

    const key =
      p.shift();

    const value =
      p.join(" ");

    if (
      key === "bumpmapTexture" ||
      key === "bumpTexture"
    ) {
      def.bumpTexture = value;
    }

    if (
      key === "normalmapTexture" ||
      key === "normalTexture"
    ) {
      def.normalmapTexture = value;
    }

    if (key === "specularmapTexture") {
      def.specularmapTexture = value;
    }

    if (key === "transparencymapTexture") {
      def.transparencymapTexture = value;
    }

    if (key === "aomapTexture") {
      def.aomapTexture = value;
    }
  }

  return def;
}

function color(rgb, fallback) {
  const v =
    Array.isArray(rgb) &&
    rgb.length >= 3
      ? rgb
      : fallback;

  return new THREE.Color(
    Number(v[0]) || 0,
    Number(v[1]) || 0,
    Number(v[2]) || 0
  );
}

async function textureFromPack(
  pack,
  mhmatEntry,
  relative,
  {
    colorSpace = THREE.NoColorSpace
  } = {}
) {
  if (!relative) return null;

  let path =
    pack.resolve(
      mhmatEntry,
      relative
    );

  if (!path || !pack.has(path)) {
    const fileName =
      String(relative)
        .replace(/\\/g, "/")
        .split("/")
        .pop()
        .toLowerCase();

    path =
      pack.list().find(
        entry =>
          entry.split("/").pop().toLowerCase() === fileName
      ) || null;
  }

  if (!path) {
    throw new Error(
      `Texture MakeHuman non trovata nel pack: ${relative}`
    );
  }

  const url =
    await pack.objectUrl(path);

  const texture =
    await new THREE.TextureLoader()
      .loadAsync(url);

  texture.colorSpace =
    colorSpace;

  texture.wrapS =
    THREE.ClampToEdgeWrapping;

  texture.wrapT =
    THREE.ClampToEdgeWrapping;

  texture.needsUpdate = true;

  return texture;
}

export class MakeHumanPackMaterial {
  constructor({
    pack,
    mhmatEntry = null,
    label = "MakeHumanPackMaterial"
  }) {
    this.pack =
      pack;

    this.mhmatEntry =
      mhmatEntry;

    this.label =
      label;

    this.definition = null;
    this.material = null;
    this.textures = [];
  }

  async load() {
    let def;
    let sourceText = null;

    if (this.mhmatEntry) {
      sourceText =
        await this.pack.text(
          this.mhmatEntry
        );

      def =
        extendTextureFields(
          parseMakeHumanMhmat(sourceText),
          sourceText
        );
    } else {
      def =
        JSON.parse(
          JSON.stringify(
            MAKEHUMAN_DEFAULTS
          )
        );
    }

    /*
      These accessory packs use MakeHuman's standard material model.
      If a future asset requests a specialized shader, fail instead of
      silently inventing a rendering interpretation.
    */
    if (
      def.shader &&
      def.shader !== "data/shaders/glsl/phong"
    ) {
      throw new Error(
        `${this.label}: shader MakeHuman non ancora portato fedelmente: ${def.shader}`
      );
    }

    const [
      diffuse,
      bump,
      normal
    ] =
      await Promise.all([
        textureFromPack(
          this.pack,
          this.mhmatEntry,
          def.diffuseTexture
        ),
        textureFromPack(
          this.pack,
          this.mhmatEntry,
          def.bumpTexture
        ),
        textureFromPack(
          this.pack,
          this.mhmatEntry,
          def.normalmapTexture
        )
      ]);

    for (const t of [
      diffuse,
      bump,
      normal
    ]) {
      if (t) this.textures.push(t);
    }

    const material =
      new THREE.MeshPhongMaterial({
        name:
          `MakeHumanPack_${def.name || this.label}`,

        color:
          color(
            def.diffuseColor,
            [1, 1, 1]
          ),

        specular:
          color(
            def.specularColor,
            [1, 1, 1]
          ),

        emissive:
          color(
            def.emissiveColor,
            [0, 0, 0]
          ),

        shininess:
          Math.max(
            0,
            Math.min(
              255,
              Number(
                def.shininess ?? 0.2
              ) * 255
            )
          ),

        map:
          diffuse,

        bumpMap:
          bump,

        normalMap:
          normal,

        transparent:
          !!def.transparent,

        opacity:
          Number.isFinite(def.opacity)
            ? def.opacity
            : 1,

        side:
          def.backfaceCull === false
            ? THREE.DoubleSide
            : THREE.FrontSide,

        depthTest:
          def.depthless !== true,

        depthWrite:
          def.depthless !== true,

        alphaToCoverage:
          def.alphaToCoverage !== false,

        wireframe:
          !!def.wireframe,

        toneMapped:
          false
      });

    if (
      def.transparent &&
      diffuse
    ) {
      /*
        MakeHuman transparent assets generally keep alpha in diffuse.
        Keep the exact image alpha rather than synthesizing another mask.
      */
      material.alphaTest = 0.001;
    }

    material.userData.makehumanPack = {
      pack:
        this.pack.packId,
      mhmat:
        this.mhmatEntry,
      shader:
        def.shader,
      nativeDefaults:
        !this.mhmatEntry
    };

    material.needsUpdate = true;

    this.definition = def;
    this.material = material;

    return material;
  }

  getDiagnostics() {
    return {
      loaded:
        !!this.material,
      pack:
        this.pack?.packId || null,
      mhmat:
        this.mhmatEntry,
      name:
        this.definition?.name || null,
      shader:
        this.definition?.shader || null,
      transparent:
        this.definition?.transparent ?? null,
      backfaceCull:
        this.definition?.backfaceCull ?? null,
      textureCount:
        this.textures.length,
      nativeDefault:
        !this.mhmatEntry
    };
  }

  dispose() {
    this.material?.dispose?.();

    for (const texture of this.textures) {
      texture?.dispose?.();
    }

    this.textures.length = 0;
    this.material = null;
    this.definition = null;
  }
}
