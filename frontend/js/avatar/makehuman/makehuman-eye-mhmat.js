"use strict";

import * as THREE from "three";

/*
  V25.1 — MakeHuman eye .mhmat bridge

  This is intentionally NOT a generic Three.js eye material.

  It reads the MakeHuman .mhmat and ports the material settings actually
  declared there:

    diffuseTexture
    transparent
    alphaToCoverage
    backfaceCull
    depthless
    opacity
    shader
    shaderParam AdditiveShading
    shaderParam litsphereTexture
    shaderConfig diffuse / transparency

  The MakeHuman eye material uses:
    shader data/shaders/glsl/litsphere

  The GLSL below is a syntax port of MakeHuman's litsphere vertex/fragment
  shader to Three.js ShaderMaterial. The shading math is kept equivalent.

  Deliberately NOT used:
    MeshStandardMaterial
    roughness guesses
    metalness guesses
    invented specularity
    custom iris tinting
*/

const MAKEHUMAN_LITSPHERE_SHADER =
  "data/shaders/glsl/litsphere";

function boolValue(raw, fallback = false) {
  if (raw == null) return fallback;

  const s =
    String(raw).trim().toLowerCase();

  if (s === "true") return true;
  if (s === "false") return false;

  return fallback;
}

function floatValue(raw, fallback = 0) {
  const n = Number(raw);

  return Number.isFinite(n)
    ? n
    : fallback;
}

function parseVec3(tokens, fallback = [1, 1, 1]) {
  if (!Array.isArray(tokens) || tokens.length < 3) {
    return [...fallback];
  }

  const out =
    tokens.slice(0, 3).map(Number);

  if (out.some(v => !Number.isFinite(v))) {
    return [...fallback];
  }

  return out;
}

function stripComment(line) {
  const i = line.indexOf("#");

  return (
    i >= 0
      ? line.slice(0, i)
      : line
  ).trim();
}

export function parseMakeHumanMhmat(text) {
  const material = {
    name: null,

    ambientColor: [0.11, 0.11, 0.11],
    diffuseColor: [1, 1, 1],
    specularColor: [1, 1, 1],
    emissiveColor: [0, 0, 0],

    shininess: 1,
    opacity: 1,
    translucency: 0,

    shadeless: false,
    wireframe: false,
    transparent: false,
    alphaToCoverage: false,
    backfaceCull: true,
    depthless: false,

    castShadows: true,
    receiveShadows: true,

    diffuseTexture: null,

    shader: null,
    shaderParams: {},
    shaderConfig: {}
  };

  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line =
      stripComment(rawLine);

    if (!line) continue;

    const tokens =
      line.split(/\s+/);

    const key =
      tokens.shift();

    if (!key) continue;

    if (key === "name") {
      material.name =
        tokens.join(" ");
      continue;
    }

    if (key === "ambientColor") {
      material.ambientColor =
        parseVec3(tokens, material.ambientColor);
      continue;
    }

    if (key === "diffuseColor") {
      material.diffuseColor =
        parseVec3(tokens, material.diffuseColor);
      continue;
    }

    if (key === "specularColor") {
      material.specularColor =
        parseVec3(tokens, material.specularColor);
      continue;
    }

    if (key === "emissiveColor") {
      material.emissiveColor =
        parseVec3(tokens, material.emissiveColor);
      continue;
    }

    if (key === "shininess") {
      material.shininess =
        floatValue(tokens[0], material.shininess);
      continue;
    }

    if (key === "opacity") {
      material.opacity =
        floatValue(tokens[0], material.opacity);
      continue;
    }

    if (key === "translucency") {
      material.translucency =
        floatValue(tokens[0], material.translucency);
      continue;
    }

    for (const boolKey of [
      "shadeless",
      "wireframe",
      "transparent",
      "alphaToCoverage",
      "backfaceCull",
      "depthless",
      "castShadows",
      "receiveShadows"
    ]) {
      if (key === boolKey) {
        material[boolKey] =
          boolValue(tokens[0], material[boolKey]);
      }
    }

    if (key === "diffuseTexture") {
      material.diffuseTexture =
        tokens.join(" ");
      continue;
    }

    if (key === "shader") {
      material.shader =
        tokens.join(" ");
      continue;
    }

    if (key === "shaderParam") {
      const paramName =
        tokens.shift();

      if (!paramName) continue;

      const raw =
        tokens.join(" ");

      const numeric =
        Number(raw);

      material.shaderParams[paramName] =
        Number.isFinite(numeric)
          ? numeric
          : raw;

      continue;
    }

    if (key === "shaderConfig") {
      const configName =
        tokens.shift();

      if (!configName) continue;

      material.shaderConfig[configName] =
        boolValue(tokens[0], false);

      continue;
    }
  }

  return material;
}

function absoluteUrl(base, value) {
  if (!value) return null;

  return new URL(
    value,
    base
  ).href;
}

function repositoryDataUrl(repoRoot, value) {
  if (!value) return null;

  if (
    /^https?:\/\//i.test(value)
  ) {
    return value;
  }

  if (value.startsWith("data/")) {
    return new URL(
      value,
      repoRoot.endsWith("/")
        ? repoRoot
        : `${repoRoot}/`
    ).href;
  }

  return null;
}

async function fetchText(url) {
  const response =
    await fetch(url, {
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

async function loadTextureRaw(url) {
  const texture =
    await new THREE.TextureLoader()
      .loadAsync(url);

  /*
    MakeHuman's GLSL samples these textures directly.
    Do not run them through our earlier PBR/sRGB material interpretation.
  */
  texture.colorSpace =
    THREE.NoColorSpace;

  texture.wrapS =
    THREE.ClampToEdgeWrapping;

  texture.wrapT =
    THREE.ClampToEdgeWrapping;

  texture.needsUpdate = true;

  return texture;
}

const VERTEX_SHADER = `
  varying vec2 vMhUv;
  varying vec3 vMhNormal;

  void main() {
    vMhUv = uv;

    // MakeHuman litsphere shader:
    // vNormal = normalize(gl_NormalMatrix * gl_Normal)
    vMhNormal =
      normalize(normalMatrix * normal);

    gl_Position =
      projectionMatrix *
      modelViewMatrix *
      vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D diffuseTexture;
  uniform sampler2D litsphereTexture;

  uniform float AdditiveShading;
  uniform float materialOpacity;

  uniform vec3 customIrisColor;
  uniform float customIrisEnabled;

  uniform sampler2D irisMaskTextureA;
  uniform sampler2D irisMaskTextureB;
  uniform float irisMaskReady;

  varying vec2 vMhUv;
  varying vec3 vMhNormal;

  void main() {
    vec3 normal =
      normalize(vMhNormal);

    vec3 shading =
      texture2D(
        litsphereTexture,
        normal.xy * 0.495 + vec2(0.5)
      ).rgb;

    vec4 diffuse =
      texture2D(
        diffuseTexture,
        vMhUv
      );

    /*
      V25.4 custom eye color.

      Do NOT guess the iris area from saturation.
      Build the mask from TWO ORIGINAL MakeHuman eye textures with the same UV:
      wherever brown_eye and green_eye differ, MakeHuman itself tells us
      "this pixel belongs to the colored iris".

      Therefore:
      - sclera stays untouched;
      - pupil stays untouched;
      - eyelid/alpha stays untouched;
      - only the MakeHuman-native iris region is recolored.
    */
    if (
      customIrisEnabled > 0.5 &&
      irisMaskReady > 0.5
    ) {
      vec3 maskA =
        texture2D(
          irisMaskTextureA,
          vMhUv
        ).rgb;

      vec3 maskB =
        texture2D(
          irisMaskTextureB,
          vMhUv
        ).rgb;

      float nativeDifference =
        length(maskA - maskB);

      float mask =
        smoothstep(
          0.025,
          0.115,
          nativeDifference
        );

      float lum =
        dot(
          diffuse.rgb,
          vec3(0.2126, 0.7152, 0.0722)
        );

      /*
        Preserve native iris detail/luminance, replace only hue/chroma.
        A small floor keeps dark irises visibly colored without touching pupil,
        because pupil is already rejected by the native-difference mask.
      */
      vec3 target =
        customIrisColor *
        max(
          0.18,
          min(1.20, lum * 1.65)
        );

      diffuse.rgb =
        mix(
          diffuse.rgb,
          target,
          clamp(mask, 0.0, 1.0)
        );
    }

    vec4 outColor;

    // Direct port of:
    // makehuman/data/shaders/glsl/litsphere_fragment_shader.txt
    outColor.rgb =
      (1.0 - AdditiveShading) *
      shading *
      diffuse.rgb *
      vec3(
        2.0 -
        (shading.r + shading.g + shading.b) / 3.0
      );

    outColor.rgb +=
      AdditiveShading *
      (shading + diffuse.rgb);

    outColor.a =
      diffuse.a *
      materialOpacity;

    gl_FragColor =
      outColor;
  }
`;

export class MakeHumanEyeMhmatMaterial {
  constructor({
    mhmatUrl,
    repositoryRoot,
    irisMaskAUrl = null,
    irisMaskBUrl = null
  }) {
    if (!mhmatUrl) {
      throw new Error(
        "MakeHumanEyeMhmatMaterial: mhmatUrl mancante."
      );
    }

    if (!repositoryRoot) {
      throw new Error(
        "MakeHumanEyeMhmatMaterial: repositoryRoot mancante."
      );
    }

    this.mhmatUrl =
      mhmatUrl;

    this.repositoryRoot =
      repositoryRoot;

    this.irisMaskAUrl =
      irisMaskAUrl;

    this.irisMaskBUrl =
      irisMaskBUrl;

    this.definition = null;
    this.material = null;

    this.diffuseTexture = null;
    this.litsphereTexture = null;
    this.irisMaskATexture = null;
    this.irisMaskBTexture = null;

    this.urls = {
      diffuse: null,
      litsphere: null,
      irisMaskA: null,
      irisMaskB: null
    };
  }

  async load() {
    const text =
      await fetchText(
        this.mhmatUrl
      );

    const def =
      parseMakeHumanMhmat(text);

    if (
      def.shader !==
      MAKEHUMAN_LITSPHERE_SHADER
    ) {
      throw new Error(
        `Shader MakeHuman occhi inatteso: ${def.shader || "nessuno"}`
      );
    }

    if (
      def.shaderConfig.diffuse !== true
    ) {
      throw new Error(
        "Materiale MakeHuman occhi senza shaderConfig diffuse True."
      );
    }

    const diffuseUrl =
      absoluteUrl(
        this.mhmatUrl,
        def.diffuseTexture
      );

    const litspherePath =
      def.shaderParams.litsphereTexture;

    const litsphereUrl =
      repositoryDataUrl(
        this.repositoryRoot,
        litspherePath
      );

    if (!diffuseUrl) {
      throw new Error(
        "diffuseTexture MakeHuman occhi mancante."
      );
    }

    if (!litsphereUrl) {
      throw new Error(
        "litsphereTexture MakeHuman occhi mancante."
      );
    }

    const loadMaskA =
      this.irisMaskAUrl
        ? loadTextureRaw(this.irisMaskAUrl)
        : Promise.resolve(null);

    const loadMaskB =
      this.irisMaskBUrl
        ? loadTextureRaw(this.irisMaskBUrl)
        : Promise.resolve(null);

    const [
      diffuseTexture,
      litsphereTexture,
      irisMaskATexture,
      irisMaskBTexture
    ] =
      await Promise.all([
        loadTextureRaw(diffuseUrl),
        loadTextureRaw(litsphereUrl),
        loadMaskA,
        loadMaskB
      ]);

    const additive =
      floatValue(
        def.shaderParams.AdditiveShading,
        0
      );

    const material =
      new THREE.ShaderMaterial({
        name:
          `MakeHumanMhmat_${def.name || "Eye"}`,

        uniforms: {
          diffuseTexture: {
            value: diffuseTexture
          },

          litsphereTexture: {
            value: litsphereTexture
          },

          AdditiveShading: {
            value: additive
          },

          materialOpacity: {
            value: def.opacity
          },

          customIrisColor: {
            value: new THREE.Color("#4e6a3d")
          },

          customIrisEnabled: {
            value: 0
          },

          irisMaskTextureA: {
            value: irisMaskATexture
          },

          irisMaskTextureB: {
            value: irisMaskBTexture
          },

          irisMaskReady: {
            value:
              irisMaskATexture &&
              irisMaskBTexture
                ? 1
                : 0
          }
        },

        vertexShader:
          VERTEX_SHADER,

        fragmentShader:
          FRAGMENT_SHADER,

        transparent:
          def.transparent,

        alphaToCoverage:
          def.alphaToCoverage,

        side:
          def.backfaceCull
            ? THREE.FrontSide
            : THREE.DoubleSide,

        depthTest:
          !def.depthless,

        depthWrite:
          !def.depthless,

        wireframe:
          def.wireframe,

        /*
          MakeHuman's litsphere shader is already the final shading model.
          Do not run ACES/PBR tone mapping on top of it.
        */
        toneMapped:
          false
      });

    material.userData.makehumanMhmat = {
      name: def.name,
      mhmatUrl:
        this.mhmatUrl,
      shader:
        def.shader,
      transparent:
        def.transparent,
      alphaToCoverage:
        def.alphaToCoverage,
      backfaceCull:
        def.backfaceCull,
      depthless:
        def.depthless,
      additiveShading:
        additive,
      diffuseTexture:
        def.diffuseTexture,
      litsphereTexture:
        litspherePath,
      shaderConfig: {
        ...def.shaderConfig
      }
    };

    material.needsUpdate = true;

    this.definition = def;
    this.material = material;

    this.diffuseTexture =
      diffuseTexture;

    this.litsphereTexture =
      litsphereTexture;

    this.irisMaskATexture =
      irisMaskATexture;

    this.irisMaskBTexture =
      irisMaskBTexture;

    this.urls.diffuse =
      diffuseUrl;

    this.urls.litsphere =
      litsphereUrl;

    this.urls.irisMaskA =
      this.irisMaskAUrl;

    this.urls.irisMaskB =
      this.irisMaskBUrl;

    return material;
  }


  setCustomIrisColor(hex) {
    if (!this.material?.uniforms) return null;

    const color =
      new THREE.Color(hex || "#4e6a3d");

    this.material.uniforms.customIrisColor.value
      .copy(color);

    this.material.uniforms.customIrisEnabled.value = 1;

    return "#" + color.getHexString();
  }

  clearCustomIrisColor() {
    if (!this.material?.uniforms) return false;

    this.material.uniforms.customIrisEnabled.value = 0;

    return true;
  }

  getDiagnostics() {
    const d =
      this.definition;

    return {
      loaded:
        !!this.material,
      name:
        d?.name || null,
      mhmatUrl:
        this.mhmatUrl,
      shader:
        d?.shader || null,
      transparent:
        d?.transparent ?? null,
      alphaToCoverage:
        d?.alphaToCoverage ?? null,
      backfaceCull:
        d?.backfaceCull ?? null,
      depthless:
        d?.depthless ?? null,
      opacity:
        d?.opacity ?? null,
      additiveShading:
        d
          ? floatValue(
              d.shaderParams.AdditiveShading,
              0
            )
          : null,
      diffuseTexture:
        this.urls.diffuse,
      litsphereTexture:
        this.urls.litsphere,
      shaderConfig:
        d
          ? { ...d.shaderConfig }
          : null,
      customIrisEnabled:
        this.material?.uniforms?.customIrisEnabled?.value > 0.5,
      customIrisColor:
        this.material?.uniforms?.customIrisColor?.value
          ? "#" + this.material.uniforms.customIrisColor.value.getHexString()
          : null,
      irisMaskReady:
        this.material?.uniforms?.irisMaskReady?.value > 0.5,
      irisMaskA:
        this.urls.irisMaskA,
      irisMaskB:
        this.urls.irisMaskB
    };
  }

  dispose() {
    this.material?.dispose?.();
    this.diffuseTexture?.dispose?.();
    this.litsphereTexture?.dispose?.();
    this.irisMaskATexture?.dispose?.();
    this.irisMaskBTexture?.dispose?.();

    this.material = null;
    this.diffuseTexture = null;
    this.litsphereTexture = null;
    this.irisMaskATexture = null;
    this.irisMaskBTexture = null;
    this.definition = null;
  }
}
