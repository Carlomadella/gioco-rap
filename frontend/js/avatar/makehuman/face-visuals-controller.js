"use strict";

import * as THREE from "three";

/*
  V24 — Face visuals

  Visual layer only:
  - re-enable helper meshes only when phenotype sync says they are safe
  - style native Eyes / Teeth / Tongue materials
  - draw irises on the real native eyeball surface
  - draw eyebrow visual assets that follow the already-working geometry morphs

  This module NEVER changes Body morph geometry.
*/

const EYE_COLORS = Object.freeze({
  brown: "#5b3a21",
  hazel: "#7a5a2a",
  green: "#4e6a3d",
  blue: "#4d6786",
  gray: "#6b7078"
});

const BROW_STYLE_PRESETS = Object.freeze({
  base: Object.freeze({
    width: .98,
    thickness: 1.54,
    arch: .12,
    tilt: .000,
    density: 1.48,
    softness: .27,
    tailLift: .00
  }),
  thin: Object.freeze({
    width: .92,
    thickness: 1.00,
    arch: .075,
    tilt: -.004,
    density: 1.08,
    softness: .18,
    tailLift: .00
  }),
  thick: Object.freeze({
    width: 1.04,
    thickness: 2.02,
    arch: .13,
    tilt: .002,
    density: 1.96,
    softness: .34,
    tailLift: .00
  }),
  arched: Object.freeze({
    width: .97,
    thickness: 1.46,
    arch: .31,
    tilt: .032,
    density: 1.55,
    softness: .29,
    tailLift: .06
  }),
  straight: Object.freeze({
    width: 1.00,
    thickness: 1.32,
    arch: .020,
    tilt: -.018,
    density: 1.38,
    softness: .25,
    tailLift: -.025
  })
});

const IRIS_VISUAL_SCALE = 1.16;

// V24.2: the white "broken" wedges seen inside the blue iris are the native
// sclera winning the depth test against parts of the curved synthetic patch.
// Keep the iris on the native eye surface, but use a denser patch and a
// visibly-safe lift above the sclera.
const IRIS_SURFACE_LIFT_MIN = 0.00105;
const IRIS_SURFACE_LIFT_DEPTH_FACTOR = 0.035;

const BROW_MIN_CENTER_GAP = 0.0065;

function materialsOf(mesh) {
  if (!mesh?.material) return [];

  return Array.isArray(mesh.material)
    ? mesh.material
    : [mesh.material];
}

function cloneMaterialSet(mesh) {
  const originals = materialsOf(mesh);

  const clones =
    originals.map(material => material?.clone?.() || material);

  if (!originals.length) {
    return {
      original: mesh?.material || null,
      clone: mesh?.material || null
    };
  }

  const clone =
    Array.isArray(mesh.material)
      ? clones
      : clones[0];

  return {
    original: mesh.material,
    clone
  };
}

function setMaterialColor(material, hex) {
  if (material?.color) {
    material.color.set(hex);
  }

  if ("metalness" in (material || {})) {
    material.metalness = 0;
  }

  material.needsUpdate = true;
}

function browCurveY(style, t) {
  const core =
    .565 - Math.sin(Math.PI * t) * style.arch;

  return core -
    (t - .5) * (style.tailLift || 0);
}

function deterministicJitter(i) {
  const x =
    Math.sin(i * 91.733 + 17.17) *
    43758.5453;

  return x - Math.floor(x);
}

function makeBrowTexture(styleKey) {
  const style =
    BROW_STYLE_PRESETS[styleKey] ||
    BROW_STYLE_PRESETS.base;

  const canvas =
    document.createElement("canvas");

  canvas.width = 768;
  canvas.height = 220;

  const ctx =
    canvas.getContext("2d");

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const x0 = 44;
  const span = 680;

  const centerY = t =>
    browCurveY(style, t) *
    canvas.height;

  ctx.save();
  ctx.filter = "blur(5px)";
  ctx.globalAlpha =
    .18 + (style.softness || 0);

  ctx.strokeStyle = "#fff";
  ctx.lineWidth =
    14.5 * style.thickness;

  ctx.beginPath();

  for (let s = 0; s <= 64; s++) {
    const t = s / 64;
    const x = x0 + t * span;
    const y = centerY(t);

    if (s === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
  ctx.restore();

  ctx.globalAlpha = 1;

  ctx.save();
  ctx.globalAlpha = .36;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth =
    6.2 * style.thickness;

  ctx.beginPath();

  for (let s = 0; s <= 64; s++) {
    const t = s / 64;
    const x = x0 + t * span;
    const y = centerY(t);

    if (s === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
  ctx.restore();

  const hairs =
    Math.round(
      300 *
      style.thickness *
      (style.density || 1)
    );

  for (let i = 0; i < hairs; i++) {
    const r1 =
      deterministicJitter(i * 3 + 1);

    const r2 =
      deterministicJitter(i * 3 + 2);

    const r3 =
      deterministicJitter(i * 3 + 3);

    const t = .04 + r1 * .92;
    const x = x0 + t * span;
    const yc = centerY(t);

    const band =
      (r2 - .5) *
      (22 * style.thickness);

    const len =
      (8 + r3 * 13) *
      style.thickness;

    const inner = 1 - t;
    const sweep = 2.2 + 6.2 * t;

    const dx =
      sweep * (r3 > .48 ? 1 : .78);

    const dy =
      -(len * (.72 + .34 * inner));

    ctx.strokeStyle =
      `rgba(255,255,255,${(.44 + r3 * .48).toFixed(3)})`;

    ctx.lineWidth =
      1.05 + r2 * 1.65;

    ctx.beginPath();
    ctx.moveTo(x, yc + band);
    ctx.lineTo(
      x + dx,
      yc + band + dy
    );
    ctx.stroke();
  }

  const flyaways =
    Math.round(36 * style.thickness);

  for (let i = 0; i < flyaways; i++) {
    const r1 =
      deterministicJitter(500 + i * 5 + 1);

    const r2 =
      deterministicJitter(500 + i * 5 + 2);

    const t = .08 + r1 * .84;
    const x = x0 + t * span;
    const yc = centerY(t);
    const len = 5 + r2 * 6;

    ctx.strokeStyle =
      "rgba(255,255,255,.20)";

    ctx.lineWidth = .75;

    ctx.beginPath();
    ctx.moveTo(x, yc - 2);
    ctx.lineTo(
      x - 2.5,
      yc - len
    );
    ctx.stroke();
  }

  // Soften both ends to avoid a painted-strip look.
  ctx.save();
  ctx.globalCompositeOperation =
    "destination-in";

  const edgeFade =
    ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      0
    );

  edgeFade.addColorStop(
    0,
    "rgba(255,255,255,0)"
  );

  edgeFade.addColorStop(
    .12,
    "rgba(255,255,255,1)"
  );

  edgeFade.addColorStop(
    .88,
    "rgba(255,255,255,1)"
  );

  edgeFade.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );

  ctx.fillStyle = edgeFade;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.restore();

  const texture =
    new THREE.CanvasTexture(canvas);

  texture.colorSpace =
    THREE.SRGBColorSpace;

  texture.needsUpdate = true;

  return texture;
}

function makeIrisTexture(colorHex) {
  const canvas =
    document.createElement("canvas");

  canvas.width = 256;
  canvas.height = 256;

  const ctx =
    canvas.getContext("2d");

  ctx.clearRect(0, 0, 256, 256);

  const cx = 128;
  const cy = 128;
  const irisR = 82;
  const pupilR = 16;

  const key =
    String(colorHex || "").toLowerCase();

  const palettes = {
    "#5b3a21": {
      dark: "#2f2016",
      mid: "#5b3a21",
      light: "#8a6544",
      ring: "#241913"
    },
    "#7a5a2a": {
      dark: "#4e3a1f",
      mid: "#7a5a2a",
      light: "#a48754",
      ring: "#34281a"
    },
    "#4e6a3d": {
      dark: "#304327",
      mid: "#4e6a3d",
      light: "#7f9a65",
      ring: "#24311e"
    },
    "#4d6786": {
      dark: "#32465d",
      mid: "#4d6786",
      light: "#86a4c6",
      ring: "#263444"
    },
    "#6b7078": {
      dark: "#43484f",
      mid: "#6b7078",
      light: "#a2a8b0",
      ring: "#31353a"
    }
  };

  let dark;
  let mid;
  let light;
  let ring;

  if (palettes[key]) {
    dark =
      new THREE.Color(
        palettes[key].dark
      );

    mid =
      new THREE.Color(
        palettes[key].mid
      );

    light =
      new THREE.Color(
        palettes[key].light
      );

    ring =
      palettes[key].ring;
  } else {
    const iris =
      new THREE.Color(
        colorHex || EYE_COLORS.brown
      );

    const hsl = {
      h: 0,
      s: 0,
      l: 0
    };

    iris.getHSL(hsl);

    mid =
      iris.clone().setHSL(
        hsl.h,
        Math.min(
          .70,
          Math.max(
            .25,
            hsl.s * 1.08
          )
        ),
        Math.min(
          .55,
          Math.max(
            .34,
            hsl.l * 1.06
          )
        )
      );

    dark =
      mid.clone().multiplyScalar(.62);

    light =
      mid.clone().lerp(
        new THREE.Color("#e7d8c4"),
        .18
      );

    ring = "#2d241f";
  }

  const irisGrad =
    ctx.createRadialGradient(
      cx,
      cy,
      18,
      cx,
      cy,
      irisR
    );

  irisGrad.addColorStop(
    0,
    `rgb(${Math.round(light.r*255)},${Math.round(light.g*255)},${Math.round(light.b*255)})`
  );

  irisGrad.addColorStop(
    .28,
    `rgb(${Math.round(mid.r*255)},${Math.round(mid.g*255)},${Math.round(mid.b*255)})`
  );

  irisGrad.addColorStop(
    .76,
    `rgb(${Math.round(dark.r*255)},${Math.round(dark.g*255)},${Math.round(dark.b*255)})`
  );

  irisGrad.addColorStop(1, ring);

  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(
    cx,
    cy,
    irisR,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation =
    "soft-light";

  for (let i = 0; i < 96; i++) {
    const a =
      Math.PI * 2 * i / 96;

    const inner =
      pupilR + 4 +
      ((i % 5) / 5) * 7;

    const outer =
      irisR - 5 -
      ((i % 7) / 7) * 8;

    const x1 =
      cx + Math.cos(a) * inner;

    const y1 =
      cy + Math.sin(a) * inner;

    const x2 =
      cx + Math.cos(a) * outer;

    const y2 =
      cy + Math.sin(a) * outer;

    ctx.strokeStyle =
      `rgba(255,255,255,${0.09+((i%9)/9)*0.10})`;

    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();

  const pupilGrad =
    ctx.createRadialGradient(
      cx - 4,
      cy - 5,
      3,
      cx,
      cy,
      pupilR
    );

  pupilGrad.addColorStop(
    0,
    "rgba(18,14,12,1)"
  );

  pupilGrad.addColorStop(
    1,
    "rgba(5,4,4,1)"
  );

  ctx.fillStyle = pupilGrad;
  ctx.beginPath();
  ctx.arc(
    cx,
    cy,
    pupilR,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeStyle =
    "rgba(255,255,255,.18)";

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(
    cx,
    cy,
    irisR - 2,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.fillStyle =
    "rgba(255,255,255,.80)";

  ctx.beginPath();
  ctx.arc(
    cx - 20,
    cy - 20,
    7,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.fillStyle =
    "rgba(255,255,255,.30)";

  ctx.beginPath();
  ctx.arc(
    cx + 14,
    cy + 14,
    3,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation =
    "destination-in";

  const fade =
    ctx.createRadialGradient(
      cx,
      cy,
      irisR * .86,
      cx,
      cy,
      irisR + 5
    );

  fade.addColorStop(
    0,
    "rgba(255,255,255,1)"
  );

  fade.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );

  ctx.fillStyle = fade;
  ctx.beginPath();
  ctx.arc(
    cx,
    cy,
    irisR + 5,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  const texture =
    new THREE.CanvasTexture(canvas);

  texture.colorSpace =
    THREE.SRGBColorSpace;

  texture.needsUpdate = true;

  return texture;
}

export class MakeHumanFaceVisualsController {
  constructor(adapter, helperSync = null) {
    if (!adapter) {
      throw new Error(
        "FaceVisualsController: adapter mancante."
      );
    }

    this.adapter = adapter;
    this.root = adapter.root;
    this.contract =
      adapter.resolveContract({ force: true });

    this.body =
      this.contract?.meshes?.body || null;

    this.eyes =
      this.contract?.meshes?.eyes || null;

    this.teeth =
      this.contract?.meshes?.teeth || null;

    this.tongue =
      this.contract?.meshes?.tongue || null;

    this.helperSync = helperSync;

    this.materialSnapshots = new Map();
    this.visibilitySnapshots = new Map();

    this.syntheticEyeRoot = null;
    this.syntheticEyeMeshes = [];

    this.syntheticBrowRoot = null;
    this.syntheticBrowMeshes = [];

    this.raycaster =
      new THREE.Raycaster();

    this.eyeColor =
      EYE_COLORS.brown;

    this.browColor =
      "#2c1b12";

    this.browStyle = "base";

    this.initialized = false;
  }

  _roleReady(role) {
    if (!this.helperSync) return false;

    return !!this.helperSync
      .getDiagnostics()
      ?.roles?.[role]
      ?.ready;
  }

  _rememberMesh(mesh) {
    if (!mesh) return;

    if (!this.visibilitySnapshots.has(mesh)) {
      this.visibilitySnapshots.set(
        mesh,
        mesh.visible
      );
    }

    if (!this.materialSnapshots.has(mesh)) {
      const snapshot =
        cloneMaterialSet(mesh);

      this.materialSnapshots.set(
        mesh,
        snapshot.original
      );

      mesh.material =
        snapshot.clone;
    }
  }

  _styleHelperMaterials() {
    this._rememberMesh(this.eyes);
    this._rememberMesh(this.teeth);
    this._rememberMesh(this.tongue);

    for (const material of materialsOf(this.eyes)) {
      setMaterialColor(
        material,
        "#f4eee7"
      );

      if ("roughness" in material) {
        material.roughness = .58;
      }

      if ("envMapIntensity" in material) {
        material.envMapIntensity = .45;
      }

      if (material.emissive) {
        material.emissive.set("#000000");
      }

      if ("emissiveIntensity" in material) {
        material.emissiveIntensity = 0;
      }
    }

    for (const material of materialsOf(this.teeth)) {
      setMaterialColor(
        material,
        "#eee9dc"
      );

      if ("roughness" in material) {
        material.roughness = .48;
      }
    }

    for (const material of materialsOf(this.tongue)) {
      setMaterialColor(
        material,
        "#a95d62"
      );

      if ("roughness" in material) {
        material.roughness = .72;
      }
    }
  }

  init() {
    this._styleHelperMaterials();

    // V25: rendered eyes come from the native HighPolyEyes proxy.
    // Canonical helper Eyes stays hidden, but its exact MakeHuman geometry
    // remains available as the brow fitter's reference.
    if (this.eyes) {
      this.eyes.visible = false;
    }

    // V26: MakeHuman itself treats Teeth and Tongue as SimpleProxyTypes.
    // Native .mhclo proxies are rendered by NativeMakeHumanFacePartsController.
    // Keep canonical GLB helper geometry hidden exactly like helper Eyes.
    if (this.teeth) {
      this.teeth.visible = false;
    }

    if (this.tongue) {
      this.tongue.visible = false;
    }

    if (this._roleReady("eyes")) {
      this.update();
    }

    this.initialized = true;

    return this.getDiagnostics();
  }

  _eyeSideBoxesLocal() {
    if (
      !this.eyes ||
      !this.eyes.geometry?.attributes?.position ||
      !this.root
    ) {
      return null;
    }

    this.root.updateMatrixWorld(true);
    this.eyes.updateMatrixWorld(true);

    const pos =
      this.eyes.geometry.attributes.position;

    const invRoot =
      this.root.matrixWorld
        .clone()
        .invert();

    const left =
      new THREE.Box3();

    const right =
      new THREE.Box3();

    left.makeEmpty();
    right.makeEmpty();

    const points = [];
    const v =
      new THREE.Vector3();

    let minX = Infinity;
    let maxX = -Infinity;

    for (let i = 0; i < pos.count; i++) {
      if (
        typeof this.eyes.getVertexPosition ===
        "function"
      ) {
        this.eyes.getVertexPosition(i, v);
      } else {
        v.fromBufferAttribute(pos, i);
      }

      v.applyMatrix4(
        this.eyes.matrixWorld
      );

      v.applyMatrix4(invRoot);

      points.push(v.clone());

      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
    }

    if (!points.length) return null;

    const mid =
      (minX + maxX) * .5;

    for (const p of points) {
      if (p.x < mid) {
        left.expandByPoint(p);
      } else {
        right.expandByPoint(p);
      }
    }

    if (
      left.isEmpty() ||
      right.isEmpty()
    ) {
      return null;
    }

    return { left, right };
  }

  _conformIrisToEyeSurface(
    mesh,
    eyeBox,
    irisX,
    irisY,
    width,
    height
  ) {
    if (
      !mesh?.geometry?.attributes?.position ||
      !eyeBox
    ) {
      return;
    }

    const eyeCenter =
      eyeBox.getCenter(
        new THREE.Vector3()
      );

    const eyeSize =
      eyeBox.getSize(
        new THREE.Vector3()
      );

    const rx =
      Math.max(
        eyeSize.x * .5,
        width * .55
      );

    const ry =
      Math.max(
        eyeSize.y * .5,
        height * .55
      );

    const rz =
      Math.max(
        eyeSize.z * .5,
        .006
      );

    const surfaceLift =
      Math.max(
        IRIS_SURFACE_LIFT_MIN,
        eyeSize.z * IRIS_SURFACE_LIFT_DEPTH_FACTOR
      );

    const pos =
      mesh.geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const gx = pos.getX(i);
      const gy = pos.getY(i);

      const px =
        irisX + gx * width;

      const py =
        irisY + gy * height;

      const nx =
        (px - eyeCenter.x) / rx;

      const ny =
        (py - eyeCenter.y) / ry;

      const radial =
        Math.max(
          0,
          1 - nx * nx - ny * ny
        );

      const pz =
        eyeCenter.z +
        rz * Math.sqrt(radial) +
        surfaceLift;

      pos.setZ(i, pz);
    }

    pos.needsUpdate = true;

    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
  }

  _ensureSyntheticEyes() {
    if (
      this.syntheticEyeRoot ||
      !this.root ||
      !this.eyes
    ) {
      return;
    }

    this.syntheticEyeRoot =
      new THREE.Group();

    this.syntheticEyeRoot.name =
      "MakeHumanSyntheticIrisesV24";

    this.root.add(
      this.syntheticEyeRoot
    );

    for (const side of [-1, 1]) {
      const texture =
        makeIrisTexture(
          this.eyeColor
        );

      const material =
        new THREE.MeshBasicMaterial({
          color: "#ffffff",
          map: texture,
          transparent: true,
          opacity: 1,
          alphaTest: .08,
          depthTest: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -2,
          side: THREE.DoubleSide,
          toneMapped: true,
          premultipliedAlpha: true
        });

      const mesh =
        new THREE.Mesh(
          new THREE.PlaneGeometry(
            1,
            1,
            64,
            48
          ),
          material
        );

      mesh.name =
        side < 0
          ? "SyntheticIrisLeftV24"
          : "SyntheticIrisRightV24";

      mesh.userData.side = side;
      mesh.renderOrder = 10;

      this.syntheticEyeRoot.add(mesh);
      this.syntheticEyeMeshes.push(mesh);
    }
  }

  _fitSyntheticEyes() {
    if (
      !this.syntheticEyeRoot ||
      !this.eyes
    ) {
      return;
    }

    const boxes =
      this._eyeSideBoxesLocal();

    if (!boxes) return;

    const leftSize =
      boxes.left.getSize(
        new THREE.Vector3()
      );

    const rightSize =
      boxes.right.getSize(
        new THREE.Vector3()
      );

    const leftCenter =
      boxes.left.getCenter(
        new THREE.Vector3()
      );

    const rightCenter =
      boxes.right.getCenter(
        new THREE.Vector3()
      );

    const avgSize =
      new THREE.Vector3()
        .addVectors(
          leftSize,
          rightSize
        )
        .multiplyScalar(.5);

    const avgY =
      (leftCenter.y + rightCenter.y) *
      .5 -
      .0022;

    const baseAbsX =
      (
        Math.abs(leftCenter.x) +
        Math.abs(rightCenter.x)
      ) *
      .5;

    const outward =
      Math.max(
        .0016,
        avgSize.x * .030
      );

    const width =
      Math.max(
        .0205,
        avgSize.x * .58
      ) * IRIS_VISUAL_SCALE;

    const height =
      Math.max(
        .0145,
        avgSize.y * .56
      ) * IRIS_VISUAL_SCALE;

    for (const mesh of this.syntheticEyeMeshes) {
      const side =
        mesh.userData.side || 1;

      const x =
        side *
        (baseAbsX + outward);

      const eyeBox =
        side < 0
          ? boxes.left
          : boxes.right;

      mesh.position.set(
        x,
        avgY,
        0
      );

      mesh.rotation.set(
        0,
        0,
        0
      );

      mesh.scale.set(
        width,
        height,
        1
      );

      this._conformIrisToEyeSurface(
        mesh,
        eyeBox,
        x,
        avgY,
        width,
        height
      );
    }
  }

  _raycastFaceLocal(x, y, startZ) {
    if (
      !this.root ||
      !this.body
    ) {
      return null;
    }

    this.root.updateMatrixWorld(true);
    this.body.updateMatrixWorld(true);

    const originLocal =
      new THREE.Vector3(
        x,
        y,
        startZ
      );

    const originWorld =
      this.root.localToWorld(
        originLocal.clone()
      );

    const directionWorld =
      new THREE.Vector3(
        0,
        0,
        -1
      ).transformDirection(
        this.root.matrixWorld
      );

    this.raycaster.set(
      originWorld,
      directionWorld
    );

    this.raycaster.near = 0;
    this.raycaster.far = 2;

    const hit =
      this.raycaster
        .intersectObject(
          this.body,
          false
        )[0];

    if (!hit) return null;

    return this.root.worldToLocal(
      hit.point.clone()
    );
  }

  _ensureSyntheticBrows() {
    if (
      this.syntheticBrowRoot ||
      !this.root ||
      !this.eyes ||
      !this.body
    ) {
      return;
    }

    this.syntheticBrowRoot =
      new THREE.Group();

    this.syntheticBrowRoot.name =
      "MakeHumanSyntheticBrowsV24";

    this.root.add(
      this.syntheticBrowRoot
    );

    for (const side of [-1, 1]) {
      const texture =
        makeBrowTexture(
          this.browStyle
        );

      const material =
        new THREE.MeshBasicMaterial({
          color:
            new THREE.Color(
              this.browColor
            ),
          map: texture,
          alphaMap: texture,
          transparent: true,
          opacity: .98,
          alphaTest: .006,
          depthTest: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: true
        });

      const mesh =
        new THREE.Mesh(
          new THREE.PlaneGeometry(
            1,
            1
          ),
          material
        );

      mesh.name =
        side < 0
          ? "SyntheticBrowLeftV24"
          : "SyntheticBrowRightV24";

      mesh.userData.side = side;
      mesh.renderOrder = 12;

      this.syntheticBrowRoot.add(mesh);
      this.syntheticBrowMeshes.push(mesh);
    }
  }

  _signedMorph(negative, positive) {
    const neg =
      this.adapter.getMorphValue(
        negative
      );

    const pos =
      this.adapter.getMorphValue(
        positive
      );

    return pos - neg;
  }

  _fitSyntheticBrows() {
    if (
      !this.syntheticBrowRoot ||
      !this.eyes ||
      !this.body
    ) {
      return;
    }

    const boxes =
      this._eyeSideBoxesLocal();

    if (!boxes) return;

    const heightMorph =
      this._signedMorph(
        "browsDown",
        "browsUp"
      );

    const angleMorph =
      this._signedMorph(
        "browsAngleDown",
        "browsAngleUp"
      );

    const style =
      BROW_STYLE_PRESETS[
        this.browStyle
      ] ||
      BROW_STYLE_PRESETS.base;

    for (const mesh of this.syntheticBrowMeshes) {
      const side =
        mesh.userData.side || 1;

      const box =
        side < 0
          ? boxes.left
          : boxes.right;

      const size =
        box.getSize(
          new THREE.Vector3()
        );

      const center =
        box.getCenter(
          new THREE.Vector3()
        );

      const browY =
        box.max.y +
        Math.max(
          .0024,
          size.y * .078
        ) +
        heightMorph * .0048;

      const inward =
        Math.max(
          .0012,
          size.x * .055
        );

      const x =
        center.x -
        side * inward;

      const startZ =
        box.max.z + .17;

      const skin =
        this._raycastFaceLocal(
          x,
          browY,
          startZ
        );

      const z =
        skin
          ? skin.z + .00135
          : box.max.z + .0032;

      mesh.position.set(
        x,
        browY,
        z
      );

      mesh.rotation.set(
        0,
        0,
        side *
        (
          angleMorph * .13 +
          style.tilt * .92
        )
      );

      const requestedBrowW =
        Math.max(
          .051,
          size.x * 1.07
        ) *
        style.width;

      // V24.1:
      // The "brow depth / arcata" morph changes the forehead surface depth.
      // The visual brow planes must NEVER be allowed to overlap the facial
      // midline while following that surface. Clamp only the visual width;
      // the native MakeHuman geometry morph remains untouched.
      const maxBrowWFromCenter =
        Math.max(
          .018,
          2 * (
            Math.abs(x) -
            BROW_MIN_CENTER_GAP
          )
        );

      const browW =
        Math.min(
          requestedBrowW,
          maxBrowWFromCenter
        );

      const browH =
        Math.max(
          .015,
          size.y * .48
        ) *
        style.thickness;

      mesh.scale.set(
        side < 0
          ? browW
          : -browW,
        browH,
        1
      );
    }
  }

  setEyeColor() {
    // V25: synthetic iris color path retired.
    return null;
  }

  setBrowStyle(style) {
    this.browStyle = style || "native";
    return this.browStyle;
  }

  setBrowColor(hex) {
    this.browColor = hex || this.browColor;
    return this.browColor;
  }

  update() {
    if (!this.initialized) {
      // init() calls update before toggling this flag.
      // The visual meshes already exist, so fitting is still safe.
    }

    // V25.2: eyebrows are a native MakeHuman .mhclo proxy.
    // No synthetic brow plane is fitted here.

    this.root?.updateMatrixWorld?.(true);

    return this.getDiagnostics();
  }

  _eyeMorphSupport() {
    const names = [
      "eyeBiggerLeft",
      "eyeBiggerRight",
      "eyeSmallerLeft",
      "eyeSmallerRight",
      "eyeInwardLeft",
      "eyeInwardRight",
      "eyeOutwardLeft",
      "eyeOutwardRight",
      "eyeOuterUpLeft",
      "eyeOuterUpRight",
      "eyeOuterDownLeft",
      "eyeOuterDownRight",
      "eyeDeepSetLeft",
      "eyeDeepSetRight",
      "eyeProtrudingLeft",
      "eyeProtrudingRight"
    ];

    const dictionary =
      this.eyes?.morphTargetDictionary || {};

    const present =
      names.filter(name =>
        Object.prototype.hasOwnProperty.call(
          dictionary,
          name
        )
      );

    return {
      expected: names.length,
      present: present.length,
      missing:
        names.filter(
          name => !present.includes(name)
        )
    };
  }

  getDiagnostics() {
    const helper =
      this.helperSync?.getDiagnostics?.() || null;

    const eyeSupport =
      this._eyeMorphSupport();

    return {
      initialized: this.initialized,
      helperSync: helper,
      eyesVisible:
        this.eyes?.visible ?? null,
      teethVisible:
        this.teeth?.visible ?? null,
      tongueVisible:
        this.tongue?.visible ?? null,
      syntheticIrises:
        0,
      nativeEyeMode:
        true,
      syntheticBrows:
        0,
      eyeColor:
        null,
      browStyle:
        this.browStyle,
      browColor:
        this.browColor,
      irisVisualScale:
        IRIS_VISUAL_SCALE,
      irisSurfaceLiftMin:
        IRIS_SURFACE_LIFT_MIN,
      irisSurfaceLiftDepthFactor:
        IRIS_SURFACE_LIFT_DEPTH_FACTOR,
      browMinCenterGap:
        BROW_MIN_CENTER_GAP,
      eyeMorphSupport:
        eyeSupport
    };
  }

  dispose() {
    for (const mesh of this.syntheticEyeMeshes) {
      mesh.material?.map?.dispose?.();
      mesh.material?.dispose?.();
      mesh.geometry?.dispose?.();
    }

    for (const mesh of this.syntheticBrowMeshes) {
      mesh.material?.map?.dispose?.();
      mesh.material?.dispose?.();
      mesh.geometry?.dispose?.();
    }

    this.syntheticEyeRoot
      ?.removeFromParent?.();

    this.syntheticBrowRoot
      ?.removeFromParent?.();

    this.syntheticEyeMeshes = [];
    this.syntheticBrowMeshes = [];

    this.syntheticEyeRoot = null;
    this.syntheticBrowRoot = null;

    for (const [mesh, material] of this.materialSnapshots.entries()) {
      const current =
        materialsOf(mesh);

      for (const m of current) {
        if (
          m &&
          m !== material &&
          !(
            Array.isArray(material) &&
            material.includes(m)
          )
        ) {
          m.dispose?.();
        }
      }

      mesh.material = material;
    }

    for (const [mesh, visible] of this.visibilitySnapshots.entries()) {
      mesh.visible = visible;
    }

    this.materialSnapshots.clear();
    this.visibilitySnapshots.clear();

    this.initialized = false;
  }
}

export {
  EYE_COLORS,
  BROW_STYLE_PRESETS
};
