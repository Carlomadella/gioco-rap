"use strict";

import * as THREE from "three";

function hexToColor(hex) {
  try {
    return new THREE.Color(hex || "#ffffff");
  } catch {
    return new THREE.Color("#ffffff");
  }
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return 0;

  const index = THREE.MathUtils.clamp(
    (sortedValues.length - 1) * p,
    0,
    sortedValues.length - 1
  );

  const lo = Math.floor(index);
  const hi = Math.ceil(index);

  if (lo === hi) return sortedValues[lo];

  const t = index - lo;
  return sortedValues[lo] * (1 - t) + sortedValues[hi] * t;
}

function luminance01(r, g, b) {
  return (
    0.2126 * (r / 255) +
    0.7152 * (g / 255) +
    0.0722 * (b / 255)
  );
}

export async function createNeutralizedHairTexture(sourceTexture) {
  if (!sourceTexture?.image) {
    throw new Error("Texture diffuse non pronta.");
  }

  const image = sourceTexture.image;
  const width =
    image.width ||
    image.videoWidth ||
    image.naturalWidth;

  const height =
    image.height ||
    image.videoHeight ||
    image.naturalHeight;

  if (!width || !height) {
    throw new Error("Dimensioni texture diffuse non valide.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", {
    willReadFrequently: true
  });

  if (!ctx) {
    throw new Error("Canvas 2D non disponibile.");
  }

  ctx.drawImage(image, 0, 0, width, height);

  const data = ctx.getImageData(0, 0, width, height);
  const px = data.data;
  const visibleLuminance = [];

  for (let i = 0; i < px.length; i += 4) {
    const alpha = px[i + 3];

    // Ignore nearly-transparent pixels: many PNGs store black RGB there.
    if (alpha < 24) continue;

    visibleLuminance.push(
      luminance01(px[i], px[i + 1], px[i + 2])
    );
  }

  if (!visibleLuminance.length) {
    throw new Error("Diffuse hair senza pixel visibili.");
  }

  visibleLuminance.sort((a, b) => a - b);

  let low = percentile(visibleLuminance, 0.06);
  let high = percentile(visibleLuminance, 0.94);

  if (!Number.isFinite(low)) low = 0;
  if (!Number.isFinite(high)) high = 1;

  if (high - low < 0.04) {
    const median = percentile(visibleLuminance, 0.50);
    low = Math.max(0, median - 0.08);
    high = Math.min(1, median + 0.08);
  }

  const range = Math.max(high - low, 1e-6);

  /*
    The diffuse becomes a DETAIL map, not a base-color map.
    This is generic and texture-adaptive:
    - white should stay genuinely light even if source diffuse is dark;
    - highlights/shadows remain visible;
    - selected color is still applied through material.color.
  */
  const SHADOW_FLOOR = 0.58;
  const HIGHLIGHT_CEILING = 1.00;

  for (let i = 0; i < px.length; i += 4) {
    const alpha = px[i + 3];

    if (alpha === 0) continue;

    const lum = luminance01(
      px[i],
      px[i + 1],
      px[i + 2]
    );

    let t = THREE.MathUtils.clamp(
      (lum - low) / range,
      0,
      1
    );

    t = Math.pow(t, 0.78);

    const neutral =
      SHADOW_FLOOR +
      (HIGHLIGHT_CEILING - SHADOW_FLOOR) * t;

    const value = Math.round(
      THREE.MathUtils.clamp(neutral, 0, 1) * 255
    );

    px[i] = value;
    px[i + 1] = value;
    px[i + 2] = value;
    // Preserve original alpha.
  }

  ctx.putImageData(data, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = sourceTexture.wrapS;
  texture.wrapT = sourceTexture.wrapT;
  texture.minFilter = sourceTexture.minFilter;
  texture.magFilter = sourceTexture.magFilter;
  texture.flipY = sourceTexture.flipY;

  texture.userData.hairNeutralization = {
    version: "12.1",
    visiblePixels: visibleLuminance.length,
    lowPercentile: low,
    highPercentile: high,
    shadowFloor: SHADOW_FLOOR,
    highlightCeiling: HIGHLIGHT_CEILING
  };

  texture.needsUpdate = true;

  return texture;
}

export class MakeHumanHairMaterialController {
  constructor(material) {
    if (!material) {
      throw new Error(
        "MakeHumanHairMaterialController: material mancante."
      );
    }

    this.material = material;
    this.sourceDiffuse = null;
    this.neutralDiffuse = null;
    this.color = new THREE.Color("#ffffff");
  }

  async setDiffuseTexture(texture) {
    this.sourceDiffuse = texture || null;

    if (this.neutralDiffuse) {
      this.neutralDiffuse.dispose();
      this.neutralDiffuse = null;
    }

    if (!texture) {
      this.material.map = null;
      this.material.needsUpdate = true;
      return;
    }

    this.neutralDiffuse =
      await createNeutralizedHairTexture(texture);

    this.material.map = this.neutralDiffuse;
    this.material.needsUpdate = true;
  }

  setColor(hex) {
    this.color.copy(hexToColor(hex));
    this.material.color.copy(this.color);
    this.material.needsUpdate = true;
  }

  getColorHex() {
    return "#" + this.color.getHexString();
  }

  getNeutralizationDiagnostics() {
    return (
      this.neutralDiffuse?.userData?.hairNeutralization ||
      null
    );
  }

  dispose() {
    this.neutralDiffuse?.dispose?.();
    this.neutralDiffuse = null;
    this.sourceDiffuse = null;
  }
}
