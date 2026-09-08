"use strict";

import * as THREE from "three";
import { MakeHumanProxyEngine } from "./proxy-engine.js";

/*
  V25.2 — Native MakeHuman eyebrows

  No canvas eyebrow planes.
  No raycast fitting.
  No manual forehead offsets.

  Every eyebrow style is a real MakeHuman HM08 .mhclo proxy.
  Source:
    dmaugis/makehuman-custom
    commit 8d806798841f6e77368cbb2cd2b43d3d4a8f42d1
    makehuman/data/eyebrows/eyebrow001 ... eyebrow012

  Material semantics come from the original eyebrow .mhmat:
    diffuseTexture
    bumpTexture
    transparent
    backfaceCull
    castShadows
    receiveShadows
    diffuseColor

  Custom color changes only the material diffuse color multiplier.
  Geometry and alpha texture remain the original MakeHuman asset.
*/

const COMMIT =
  "8d806798841f6e77368cbb2cd2b43d3d4a8f42d1";

const ROOT =
  `https://raw.githubusercontent.com/dmaugis/makehuman-custom/${COMMIT}/makehuman/data/eyebrows`;

function eyebrowAsset(id) {
  return Object.freeze({
    id,
    label: id,
    objUrl: `${ROOT}/${id}/${id}.obj`,
    proxyUrl: `${ROOT}/${id}/${id}.mhclo`,
    diffuseUrl: `${ROOT}/${id}/${id}.png`,
    normalUrl: null,
    material: Object.freeze({
      alphaTest: 0.01,
      alphaToCoverage: true,
      roughness: 1,
      metalness: 0,
      doubleSide: true
    })
  });
}

export const MAKEHUMAN_EYEBROW_PRESETS =
  Object.freeze(
    Array.from(
      { length: 12 },
      (_, i) => {
        const id =
          `eyebrow${String(i + 1).padStart(3, "0")}`;

        return eyebrowAsset(id);
      }
    )
  );

function hexColor(hex) {
  try {
    return new THREE.Color(hex || "#2c1b12");
  } catch {
    return new THREE.Color("#2c1b12");
  }
}

async function loadTexture(url) {
  const texture =
    await new THREE.TextureLoader().loadAsync(url);

  texture.colorSpace =
    THREE.SRGBColorSpace;

  texture.wrapS =
    THREE.ClampToEdgeWrapping;

  texture.wrapT =
    THREE.ClampToEdgeWrapping;

  texture.needsUpdate = true;

  return texture;
}


const BROW_VERTEX_SHADER = `
  varying vec2 vBrowUv;
  varying vec3 vBrowNormal;

  void main() {
    vBrowUv = uv;
    vBrowNormal = normalize(normalMatrix * normal);

    gl_Position =
      projectionMatrix *
      modelViewMatrix *
      vec4(position, 1.0);
  }
`;

const BROW_FRAGMENT_SHADER = `
  uniform sampler2D browTexture;
  uniform vec3 browColor;

  varying vec2 vBrowUv;
  varying vec3 vBrowNormal;

  void main() {
    vec4 tex = texture2D(browTexture, vBrowUv);

    // Native MakeHuman eyebrow PNG supplies the silhouette / hair alpha.
    // RGB is intentionally NOT multiplied into the requested color:
    // the source hairs are near-black, so black * customColor would stay black.
    if (tex.a <= 0.008) discard;

    vec3 N = normalize(vBrowNormal);
    vec3 L = normalize(vec3(0.22, 0.48, 1.0));

    float ndl = max(dot(N, L), 0.0);
    float shade = 0.78 + 0.22 * ndl;

    // Preserve subtle strand density using alpha, but keep hue exactly user-driven.
    float strand = mix(0.88, 1.04, clamp(tex.a, 0.0, 1.0));

    gl_FragColor = vec4(
      browColor * shade * strand,
      tex.a
    );
  }
`;

function createBrowColorMaterial(texture, colorHex) {
  const material = new THREE.ShaderMaterial({
    name: 'MakeHumanNativeEyebrowColorV253',

    uniforms: {
      browTexture: {
        value: texture
      },
      browColor: {
        value: hexColor(colorHex)
      }
    },

    vertexShader: BROW_VERTEX_SHADER,
    fragmentShader: BROW_FRAGMENT_SHADER,

    transparent: true,
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: true,
    toneMapped: false
  });

  material.userData.makehumanNativeEyebrow = true;
  material.userData.colorLayer = 'alpha-mask-only';
  material.needsUpdate = true;

  return material;
}

export class NativeMakeHumanEyebrowProxyController {
  constructor(adapter) {
    if (!adapter?.resolveContract) {
      throw new Error(
        "NativeMakeHumanEyebrowProxyController richiede MakeHumanAdapter."
      );
    }

    this.adapter = adapter;
    this.engine = new MakeHumanProxyEngine(adapter);

    this.preset = "eyebrow001";
    this.customColor = "#2c1b12";

    this.sourceTexture = null;
    this.loaded = false;
    this.updateCount = 0;
  }

  _asset(id) {
    return (
      MAKEHUMAN_EYEBROW_PRESETS.find(
        item => item.id === id
      ) ||
      MAKEHUMAN_EYEBROW_PRESETS[0]
    );
  }

  async init(id = "eyebrow001") {
    await this.setPreset(id);
    this.loaded = true;

    return this.getDiagnostics();
  }

  async setPreset(id) {
    const asset = this._asset(id);

    await this.engine.load(asset);

    if (!this.engine?.mesh || !this.engine?.material) {
      throw new Error(
        "Proxy sopracciglia MakeHuman non montato."
      );
    }

    /*
      V25.3 color fix.

      The native MakeHuman eyebrow diffuse is visually near-black.
      V25.2 used material.color as a multiplier, therefore:

        black texture × brown/blonde/red = black

      Geometry, .mhclo and original PNG remain MakeHuman-native.
      For the USER-REQUESTED color extension we use the original PNG only as
      the hair/alpha mask and drive RGB with an explicit uniform.
    */
    const oldMaterial = this.engine.material;

    this.engine.materialController?.dispose?.();
    this.engine.materialController = null;

    const material = createBrowColorMaterial(
      this.engine.diffuseTexture,
      this.customColor
    );

    this.engine.material = material;
    this.engine.mesh.material = material;

    if (oldMaterial && oldMaterial !== material) {
      oldMaterial.dispose?.();
    }

    this.engine.mesh.castShadow = false;
    this.engine.mesh.receiveShadow = true;
    this.engine.mesh.renderOrder = 6;

    this.preset = asset.id;
    this.update();

    return this.preset;
  }

  setColor(hex) {
    this.customColor =
      `#${hexColor(hex).getHexString()}`;

    const uniform =
      this.engine?.material?.uniforms?.browColor;

    if (uniform?.value) {
      uniform.value.copy(
        hexColor(this.customColor)
      );

      this.engine.material.needsUpdate = true;
    }

    return this.customColor;
  }

  update() {
    if (!this.engine?.mesh) return false;

    const result = this.engine.update();
    this.updateCount++;

    return result;
  }

  getDiagnostics() {
    const d =
      this.engine?.getDiagnostics?.() || {};

    return {
      loaded: this.loaded,
      preset: this.preset,
      customColor: this.customColor,
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
      updateCount:
        this.updateCount,
      sourceCommit: COMMIT,
      synthetic: false,
      colorMaterial:
        this.engine?.material?.name || null,
      colorLayer:
        this.engine?.material?.userData?.colorLayer || null,
      colorUniform:
        this.engine?.material?.uniforms?.browColor?.value
          ? "#" + this.engine.material.uniforms.browColor.value.getHexString()
          : null
    };
  }

  async dispose() {
    await this.engine?.dispose?.();
    this.loaded = false;
  }
}
