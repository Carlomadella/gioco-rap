"use strict";

import * as THREE from "three";
import { MakeHumanHairMaterialController } from "./hair-material.js";
import { HM08VertexResolver } from "./hm08-vertex-resolver.js";

/*
  MakeHumanProxyEngine V15.3

  Layer proxy MakeHuman con resolver HM08 generico per Body + HelperGeometry/JointCubes.

  Principi:
  - nessuna logica UI;
  - nessun nome asset hardcoded;
  - nessun "refine short hair";
  - helper/cage HM08 risolti dal modulo hm08-vertex-resolver.js;
  - nessuna logica legata al nome della pettinatura;
  - fallimento esplicito solo per indici realmente non risolvibili.
*/

const HM08_BASE_OBJ_URL =
  "https://raw.githubusercontent.com/nirholas/three.ws/5bbc306c1b305378e14366e5bbf3ca8928508538/avatar-sources/anny/3dobjs/base.obj";

async function fetchText(url) {
  const response = await fetch(url, {
    mode: "cors",
    cache: "force-cache"
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  return response.text();
}

function parseObj(text) {
  const positions = [];
  const uvs = [];
  const faces = [];

  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const parts = line.split(/\s+/);

    if (parts[0] === "v" && parts.length >= 4) {
      positions.push([
        Number(parts[1]),
        Number(parts[2]),
        Number(parts[3])
      ]);
      continue;
    }

    if (parts[0] === "vt" && parts.length >= 3) {
      uvs.push([
        Number(parts[1]),
        Number(parts[2])
      ]);
      continue;
    }

    if (parts[0] === "f" && parts.length >= 4) {
      const corners = parts.slice(1).map(token => {
        const split = token.split("/");

        return {
          v: Number(split[0]) - 1,
          vt: split[1] ? Number(split[1]) - 1 : -1
        };
      });

      faces.push(corners);
    }
  }

  if (!positions.length) {
    throw new Error("OBJ privo di vertici.");
  }

  if (!faces.length) {
    throw new Error("OBJ privo di facce.");
  }

  return { positions, uvs, faces };
}

function parseMhclo(text, expectedVertices) {
  const scaleData = [null, null, null];
  const refs = [];
  let inVerts = false;

  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();

    if (!line || line.startsWith("#")) continue;

    const p = line.split(/\s+/);
    const key = p[0];

    if (key === "x_scale") {
      scaleData[0] = {
        v1: Number(p[1]),
        v2: Number(p[2]),
        denominator: Number(p[3])
      };
      continue;
    }

    if (key === "y_scale") {
      scaleData[1] = {
        v1: Number(p[1]),
        v2: Number(p[2]),
        denominator: Number(p[3])
      };
      continue;
    }

    if (key === "z_scale") {
      scaleData[2] = {
        v1: Number(p[1]),
        v2: Number(p[2]),
        denominator: Number(p[3])
      };
      continue;
    }

    if (key === "verts") {
      inVerts = true;
      continue;
    }

    if (!inVerts || refs.length >= expectedVertices) continue;

    /*
      MakeHuman native .mhclo accepts two valid vertex-reference forms.

      Exact fitting:
        14742

      Weighted fitting:
        v0 v1 v2 w0 w1 w2 [dx dy dz]

      This mirrors MakeHuman ProxyRefVert.fromSingle()/fromTriple().
    */
    if (
      p.length === 1 &&
      /^-?\d+$/.test(p[0])
    ) {
      const v0 =
        Number(p[0]);

      refs.push({
        v0,
        v1: 0,
        v2: 1,
        w0: 1,
        w1: 0,
        w2: 0,
        dx: 0,
        dy: 0,
        dz: 0,
        refMode: "single"
      });

      continue;
    }

    if (
      p.length >= 6 &&
      /^-?\d+$/.test(p[0]) &&
      /^-?\d+$/.test(p[1]) &&
      /^-?\d+$/.test(p[2])
    ) {
      refs.push({
        v0: Number(p[0]),
        v1: Number(p[1]),
        v2: Number(p[2]),
        w0: Number(p[3]),
        w1: Number(p[4]),
        w2: Number(p[5]),
        dx:
          p.length > 6
            ? Number(p[6])
            : 0,
        dy:
          p.length > 7
            ? Number(p[7])
            : 0,
        dz:
          p.length > 8
            ? Number(p[8])
            : 0,
        refMode: "triple"
      });
    }
  }

  if (refs.length !== expectedVertices) {
    throw new Error(
      `MHCLO incompatibile: refs=${refs.length}, OBJ vertices=${expectedVertices}`
    );
  }

  if (scaleData.some(item => !item)) {
    throw new Error("MHCLO privo di x_scale/y_scale/z_scale completi.");
  }

  return { scaleData, refs };
}

function createRenderGeometry(obj) {
  const uniqueCorner = new Map();
  const outputProxyVertex = [];
  const uvArray = [];
  const indices = [];

  function resolveCorner(corner) {
    const key = `${corner.v}/${corner.vt}`;

    let out = uniqueCorner.get(key);

    if (out !== undefined) {
      return out;
    }

    out = outputProxyVertex.length;
    uniqueCorner.set(key, out);

    outputProxyVertex.push(corner.v);

    const uv =
      corner.vt >= 0 && obj.uvs[corner.vt]
        ? obj.uvs[corner.vt]
        : [0, 0];

    uvArray.push(uv[0], uv[1]);

    return out;
  }

  for (const face of obj.faces) {
    const corners = face.map(resolveCorner);

    for (let i = 2; i < corners.length; i++) {
      indices.push(corners[0], corners[i - 1], corners[i]);
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      new Float32Array(outputProxyVertex.length * 3),
      3
    )
  );

  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(
      new Float32Array(uvArray),
      2
    )
  );

  geometry.setIndex(indices);

  return {
    geometry,
    outputProxyVertex
  };
}

function materialFromAsset(asset) {
  const p = asset.material || {};

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#ffffff"),
    roughness: p.roughness ?? 0.82,
    metalness: p.metalness ?? 0,
    side: p.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    transparent: false,
    alphaTest: p.alphaTest ?? 0.15,
    alphaToCoverage: p.alphaToCoverage ?? true,
    depthWrite: true,
    depthTest: true
  });

  return material;
}

async function loadTexture(url, colorSpace) {
  if (!url) return null;

  const texture = await new THREE.TextureLoader().loadAsync(url);

  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  return texture;
}

export class MakeHumanProxyEngine {
  constructor(adapter) {
    if (!adapter?.resolveContract) {
      throw new Error("MakeHumanProxyEngine richiede MakeHumanAdapter.");
    }

    this.adapter = adapter;
    this.contract = adapter.resolveContract();
    this.body = this.contract.meshes.body;

    if (!this.body?.isSkinnedMesh) {
      throw new Error("Body SkinnedMesh non disponibile.");
    }

    this.parent = this.body.parent;

    if (!this.parent) {
      throw new Error("Body senza parent: impossibile montare proxy.");
    }

    this.asset = null;

    this.root = null;
    this.mesh = null;
    this.geometry = null;
    this.material = null;

    this.obj = null;
    this.proxy = null;
    this.outputProxyVertex = null;

    this.hm08BasePositions = null;
    this.hm08Resolver = null;

    this.diffuseTexture = null;
    this.normalTexture = null;
    this.materialController = null;

    this.loaded = false;
    this.updateCount = 0;

    this.diagnostics = {
      mappedHm08Vertices: 0,
      hm08VisibleVertices: 0,
      hm08TotalVertices: 0,
      mappingRatio: 0,
      helperVerticesPrepared: 0,
      helperBlend: 0,
      helperResolvedThisUpdate: 0,
      proxyVertices: 0,
      renderVertices: 0,
      maxReferencedHm08Vertex: -1,
      missingReferencedHm08Vertices: [],
      finite: true
    };

    this._tmp0 = new THREE.Vector3();
    this._tmp1 = new THREE.Vector3();
    this._tmp2 = new THREE.Vector3();
    this._tmpOut = new THREE.Vector3();
  }


async _ensureHm08Resolver() {
  if (this.hm08Resolver && this.hm08BasePositions) {
    return;
  }

  const baseText = await fetchText(
    HM08_BASE_OBJ_URL
  );

  const baseObj = parseObj(baseText);

  this.hm08BasePositions =
    baseObj.positions;

  this.hm08Resolver =
    new HM08VertexResolver(
      this.body,
      this.hm08BasePositions
    );

  const d =
    this.hm08Resolver.getDiagnostics();

  this.diagnostics.mappedHm08Vertices =
    d.mappedVisible;

  this.diagnostics.hm08VisibleVertices =
    d.visibleCount;

  this.diagnostics.hm08TotalVertices =
    d.totalBaseVertices;

  this.diagnostics.mappingRatio =
    d.visibleCount
      ? d.mappedVisible / d.visibleCount
      : 0;
}


_validateProxyReferences() {
  const required = new Set();
  let maxRef = -1;

  for (const ref of this.proxy.refs) {
    for (const index of [
      ref.v0,
      ref.v1,
      ref.v2
    ]) {
      required.add(index);
      maxRef = Math.max(
        maxRef,
        index
      );
    }
  }

  for (const scale of this.proxy.scaleData) {
    required.add(scale.v1);
    required.add(scale.v2);

    maxRef = Math.max(
      maxRef,
      scale.v1,
      scale.v2
    );
  }

  const missing =
    this.hm08Resolver.prepare(
      [...required]
    );

  const d =
    this.hm08Resolver.getDiagnostics();

  this.diagnostics.maxReferencedHm08Vertex =
    maxRef;

  this.diagnostics.missingReferencedHm08Vertices =
    missing;

  this.diagnostics.helperVerticesPrepared =
    d.helperPrepared;

  this.diagnostics.helperAffine =
    d.helperAffine;

  this.diagnostics.helperFallback =
    d.helperFallback;

  if (missing.length) {
    throw new Error(
      `Proxy richiede ${missing.length} vertici HM08 non risolvibili. ` +
      `Primi: ${missing.slice(0, 20).join(", ")}`
    );
  }
}


_getCurrentHm08Vertex(index, target) {
  return (
    this.hm08Resolver?.getCurrentVertex(
      index,
      target
    ) || false
  );
}

  _proxyScale() {
    const scale = new THREE.Vector3(1, 1, 1);

    for (let axis = 0; axis < 3; axis++) {
      const data = this.proxy.scaleData[axis];

      if (
        !this._getCurrentHm08Vertex(data.v1, this._tmp0) ||
        !this._getCurrentHm08Vertex(data.v2, this._tmp1)
      ) {
        throw new Error("Impossibile calcolare scala proxy.");
      }

      const numerator =
        axis === 0
          ? Math.abs(this._tmp0.x - this._tmp1.x)
          : axis === 1
            ? Math.abs(this._tmp0.y - this._tmp1.y)
            : Math.abs(this._tmp0.z - this._tmp1.z);

      const value =
        numerator /
        Math.max(Math.abs(data.denominator), 1e-9);

      if (axis === 0) scale.x = value;
      if (axis === 1) scale.y = value;
      if (axis === 2) scale.z = value;
    }

    return scale;
  }

  _calculateProxyVertices() {
    this.hm08Resolver?.beginUpdate();

    const scale = this._proxyScale();

    const result = new Array(this.proxy.refs.length);

    for (let i = 0; i < this.proxy.refs.length; i++) {
      const ref = this.proxy.refs[i];

      if (
        !this._getCurrentHm08Vertex(ref.v0, this._tmp0) ||
        !this._getCurrentHm08Vertex(ref.v1, this._tmp1) ||
        !this._getCurrentHm08Vertex(ref.v2, this._tmp2)
      ) {
        throw new Error(`MHCLO reference non risolvibile al vertice ${i}.`);
      }

      result[i] = new THREE.Vector3(
        this._tmp0.x * ref.w0 +
          this._tmp1.x * ref.w1 +
          this._tmp2.x * ref.w2 +
          ref.dx * scale.x,

        this._tmp0.y * ref.w0 +
          this._tmp1.y * ref.w1 +
          this._tmp2.y * ref.w2 +
          ref.dy * scale.y,

        this._tmp0.z * ref.w0 +
          this._tmp1.z * ref.w1 +
          this._tmp2.z * ref.w2 +
          ref.dz * scale.z
      );
    }

    return result;
  }

  async load(asset) {
    if (!asset) {
      throw new Error("Asset proxy mancante.");
    }

    await this.dispose();

    this.asset = asset;

    await this._ensureHm08Resolver();

    const [objText, proxyText] = await Promise.all([
      fetchText(asset.objUrl),
      fetchText(asset.proxyUrl)
    ]);

    this.obj = parseObj(objText);
    this.proxy = parseMhclo(
      proxyText,
      this.obj.positions.length
    );

    this._validateProxyReferences();

    const built = createRenderGeometry(this.obj);

    this.geometry = built.geometry;
    this.outputProxyVertex = built.outputProxyVertex;

    this.material = materialFromAsset(asset);
    this.materialController = new MakeHumanHairMaterialController(this.material);

    this.mesh = new THREE.Mesh(
      this.geometry,
      this.material
    );

    this.mesh.name = `MakeHumanProxy_${asset.id}`;
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.root = new THREE.Group();
    this.root.name = `MakeHumanProxyRoot_${asset.id}`;
    this.root.add(this.mesh);

    /*
      Parent = Body.parent.
      Le coordinate proxy sono generate nello spazio locale del Body.
      Nel modello testato Body non ha una trasformazione locale separata
      rispetto al suo parent; verifichiamo questa assunzione e falliamo
      chiaramente se un futuro modello cambia struttura.
    */
    const bodyMatrix = this.body.matrix.clone();
    const identity = new THREE.Matrix4();

    if (!bodyMatrix.equals(identity)) {
      throw new Error(
        "Body possiede una trasformazione locale non identità. " +
        "Serve conversione di spazio esplicita prima di usare questo modello."
      );
    }

    this.parent.add(this.root);

    this.diagnostics.proxyVertices = this.proxy.refs.length;
    this.diagnostics.renderVertices =
      this.geometry.attributes.position.count;

    this.diagnostics.refModes = {
      single:
        this.proxy.refs.filter(
          ref => ref.refMode === "single"
        ).length,
      triple:
        this.proxy.refs.filter(
          ref => ref.refMode === "triple"
        ).length
    };

    await this.update();

    /*
      Le texture sono visuali, non fanno parte della matematica proxy.
      Un errore texture non rende invalida la geometria.
    */
    try {
      this.diffuseTexture = await loadTexture(
        asset.diffuseUrl,
        THREE.SRGBColorSpace
      );

      if (this.diffuseTexture) {
        await this.materialController.setDiffuseTexture(this.diffuseTexture);
      }
    } catch (error) {
      console.warn("Diffuse hair non caricata:", error);
    }

    try {
      this.normalTexture = await loadTexture(
        asset.normalUrl,
        THREE.NoColorSpace
      );

      if (this.normalTexture) {
        this.material.normalMap = this.normalTexture;

        const amount =
          asset.material?.normalScale ?? 0.08;

        this.material.normalScale.set(amount, amount);
        this.material.needsUpdate = true;
      }
    } catch (error) {
      console.warn("Normal hair non caricata:", error);
    }

    this.loaded = true;

    return this.getDiagnostics();
  }

  update() {
    if (!this.geometry || !this.proxy || !this.outputProxyVertex) {
      return false;
    }

    this.body.updateMatrixWorld(true);
    this.body.skeleton?.update?.();

    const positions = this._calculateProxyVertices();
    const attr = this.geometry.attributes.position;

    let finite = true;

    for (let i = 0; i < this.outputProxyVertex.length; i++) {
      const sourceIndex = this.outputProxyVertex[i];
      const p = positions[sourceIndex];

      if (
        !p ||
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        !Number.isFinite(p.z)
      ) {
        finite = false;
        continue;
      }

      attr.setXYZ(i, p.x, p.y, p.z);
    }

    attr.needsUpdate = true;

    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingBox();
    this.geometry.computeBoundingSphere();

    this.updateCount++;
    this.diagnostics.finite = finite;

    if (this.hm08Resolver) {
      const d =
        this.hm08Resolver.getDiagnostics();

      this.diagnostics.helperVerticesPrepared =
        d.helperPrepared;

      this.diagnostics.helperAffine =
        d.helperAffine;

      this.diagnostics.helperFallback =
        d.helperFallback;

      this.diagnostics.helperResolvedThisUpdate =
        d.helperResolvedThisUpdate;
    }

    return finite;
  }

  setColor(hex) {
    if (!this.materialController) return;
    this.materialController.setColor(hex || "#ffffff");
  }


  compareCurrentGeometryToSourceObj() {
    if (
      !this.geometry ||
      !this.obj ||
      !this.outputProxyVertex ||
      !this.hm08Resolver
    ) {
      return null;
    }

    const attr =
      this.geometry.attributes.position;

    const yShift =
      -this.hm08Resolver.sourceMinY +
      this.hm08Resolver.bodyMinY;

    let maxError = 0;
    let sum = 0;
    let sumSq = 0;
    let worstRenderVertex = -1;
    let worstProxyVertex = -1;

    for (
      let i = 0;
      i < this.outputProxyVertex.length;
      i++
    ) {
      const proxyVertex =
        this.outputProxyVertex[i];

      const source =
        this.obj.positions[proxyVertex];

      if (!source) continue;

      const ex = source[0] * 0.1;
      const ey = source[1] * 0.1 + yShift;
      const ez = source[2] * 0.1;

      const dx = attr.getX(i) - ex;
      const dy = attr.getY(i) - ey;
      const dz = attr.getZ(i) - ez;

      const error = Math.hypot(dx, dy, dz);

      sum += error;
      sumSq += error * error;

      if (error > maxError) {
        maxError = error;
        worstRenderVertex = i;
        worstProxyVertex = proxyVertex;
      }
    }

    const count =
      this.outputProxyVertex.length;

    return {
      count,
      meanError:
        count ? sum / count : 0,
      rmsError:
        count ? Math.sqrt(sumSq / count) : 0,
      maxError,
      worstRenderVertex,
      worstProxyVertex
    };
  }

  showOriginalObjGeometry(enabled = true) {
    if (
      !this.geometry ||
      !this.obj ||
      !this.outputProxyVertex ||
      !this.hm08Resolver
    ) {
      return false;
    }

    const attr =
      this.geometry.attributes.position;

    if (enabled) {
      const yShift =
        -this.hm08Resolver.sourceMinY +
        this.hm08Resolver.bodyMinY;

      for (
        let i = 0;
        i < this.outputProxyVertex.length;
        i++
      ) {
        const proxyVertex =
          this.outputProxyVertex[i];

        const p =
          this.obj.positions[proxyVertex];

        if (!p) continue;

        attr.setXYZ(
          i,
          p[0] * 0.1,
          p[1] * 0.1 + yShift,
          p[2] * 0.1
        );
      }

      attr.needsUpdate = true;

      this.geometry.computeVertexNormals();
      this.geometry.computeBoundingBox();
      this.geometry.computeBoundingSphere();

      return true;
    }

    return this.update();
  }

  getDiagnostics() {
    const box = this.geometry?.boundingBox;
    const size = box
      ? box.getSize(new THREE.Vector3())
      : new THREE.Vector3();

    return {
      assetId: this.asset?.id || "",
      loaded: this.loaded,
      updateCount: this.updateCount,

      ...this.diagnostics,

      missingReferencedHm08Count:
        this.diagnostics.missingReferencedHm08Vertices.length,

      hm08TotalVertices:
        this.diagnostics.hm08TotalVertices,

      helperVerticesPrepared:
        this.diagnostics.helperVerticesPrepared,

      helperAffine:
        this.diagnostics.helperAffine,

      helperFallback:
        this.diagnostics.helperFallback,

      helperResolvedThisUpdate:
        this.diagnostics.helperResolvedThisUpdate,

      boundingSize: {
        x: size.x,
        y: size.y,
        z: size.z
      },

      materialNeutralization:
        this.materialController?.getNeutralizationDiagnostics?.() || null,

      materialAlphaTest:
        this.material?.alphaTest ?? 0,

      materialAlphaToCoverage:
        !!this.material?.alphaToCoverage,

      sourceObjComparison:
        this.compareCurrentGeometryToSourceObj()
    };
  }

  formatDiagnostics() {
    const d = this.getDiagnostics();
    const f = value => Number(value || 0).toFixed(5);
    const pct = value =>
      `${(Number(value || 0) * 100).toFixed(2)}%`;

    const lines = [
      "=== MAKEHUMAN PROXY ENGINE V15.3 ===",
      `asset: ${d.assetId || "-"}`,
      `loaded: ${d.loaded ? "SI" : "NO"}`,
      `finite: ${d.finite ? "SI" : "NO"}`,
      `updates: ${d.updateCount}`,
      "",
      "HM08 SOURCE",
      `visible mapped: ${d.mappedHm08Vertices}/${d.hm08VisibleVertices}`,
      `visible ratio: ${pct(d.mappingRatio)}`,
      `total source vertices: ${d.hm08TotalVertices}`,
      `helper prepared: ${d.helperVerticesPrepared}`,
      `helper affine: ${d.helperAffine}`,
      `helper fallback: ${d.helperFallback}`,
      `helper resolved/update: ${d.helperResolvedThisUpdate}`,
      "",
      "PROXY",
      `proxy vertices: ${d.proxyVertices}`,
      `render vertices: ${d.renderVertices}`,
      `max hm08 reference: ${d.maxReferencedHm08Vertex}`,
      `missing hm08 references: ${d.missingReferencedHm08Count}`,
      "",
      "BOUNDS",
      `x=${f(d.boundingSize.x)}`,
      `y=${f(d.boundingSize.y)}`,
      `z=${f(d.boundingSize.z)}`,
      "",
      "HAIR MATERIAL",
      `alphaTest: ${f(d.materialAlphaTest)}`,
      `alphaToCoverage: ${d.materialAlphaToCoverage ? "SI" : "NO"}`,
      "",
      "SOURCE OBJ CHECK"
    ];

    if (d.sourceObjComparison) {
      lines.push(
        `mean error: ${f(d.sourceObjComparison.meanError)}`,
        `rms error: ${f(d.sourceObjComparison.rmsError)}`,
        `max error: ${f(d.sourceObjComparison.maxError)}`,
        `worst proxy vertex: ${d.sourceObjComparison.worstProxyVertex}`
      );
    } else {
      lines.push("not available");
    }

    if (d.materialNeutralization) {
      lines.push(
        "adaptive neutralization: SI",
        `luma p06=${f(d.materialNeutralization.lowPercentile)} p94=${f(d.materialNeutralization.highPercentile)}`
      );
    } else {
      lines.push("adaptive neutralization: NO");
    }

    return lines.join("\n");
  }

  async dispose() {
    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }

    this.geometry?.dispose?.();
    this.materialController?.dispose?.();
    this.material?.dispose?.();
    this.diffuseTexture?.dispose?.();
    this.normalTexture?.dispose?.();

    this.root = null;
    this.mesh = null;
    this.geometry = null;
    this.material = null;
    this.obj = null;
    this.proxy = null;
    this.outputProxyVertex = null;
    this.diffuseTexture = null;
    this.normalTexture = null;
    this.materialController = null;

    this.loaded = false;
    this.updateCount = 0;
  }
}
