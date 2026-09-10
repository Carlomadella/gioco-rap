"use strict";

import * as THREE from "three";

/*
  V22.2 — Native MakeHuman cheek target installer

  The canonical GLB already contains:
    cheekBonesLeft / cheekBonesRight      -> cheek-bones-incr
    cheekFullerLeft / Right              -> cheek-volume-incr
    cheekHollowLeft / Right              -> cheek-volume-decr

  The source MakeHuman data also contains the complementary native targets:
    cheek-bones-decr
    cheek-trans-up
    cheek-trans-down

  V22.2 exposes those original targets directly instead of amplifying,
  masking or inventing geometry.

  IMPORTANT:
  - Body only
  - same pinned MakeHuman source commit as the phenotype runtime
  - never rebuild the Three.js morph target dictionary
  - original morph dictionary + weights must remain unchanged
*/

const SOURCE_COMMIT =
  "e1e3e2503bef0ded4d53171b6c9444e63ee5dbdd";

const SOURCE_ROOT =
  `https://raw.githubusercontent.com/nirholas/three.ws/${SOURCE_COMMIT}/avatar-sources/anny`;

const BASE_OBJ_URL =
  `${SOURCE_ROOT}/3dobjs/base.obj`;

const SCALE = 0.1;

const TARGETS = Object.freeze({
  cheekBonesNarrowLeft:
    `${SOURCE_ROOT}/targets/cheek/l-cheek-bones-decr.target.gz`,
  cheekBonesNarrowRight:
    `${SOURCE_ROOT}/targets/cheek/r-cheek-bones-decr.target.gz`,

  cheekHigherLeft:
    `${SOURCE_ROOT}/targets/cheek/l-cheek-trans-up.target.gz`,
  cheekHigherRight:
    `${SOURCE_ROOT}/targets/cheek/r-cheek-trans-up.target.gz`,

  cheekLowerLeft:
    `${SOURCE_ROOT}/targets/cheek/l-cheek-trans-down.target.gz`,
  cheekLowerRight:
    `${SOURCE_ROOT}/targets/cheek/r-cheek-trans-down.target.gz`
});

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

async function fetchGzipText(url) {
  const response = await fetch(url, {
    mode: "cors",
    cache: "force-cache"
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  if (typeof DecompressionStream !== "function") {
    throw new Error(
      "Browser senza DecompressionStream(gzip): impossibile leggere i target MakeHuman."
    );
  }

  const compressed = await response.blob();

  const stream = compressed
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));

  return new Response(stream).text();
}

function parseBaseObj(text) {
  const faces = [];
  let group = "";

  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();

    if (!line || line.startsWith("#")) continue;

    if (line.startsWith("g ")) {
      group = line.slice(2).trim();
      continue;
    }

    if (line.startsWith("f ")) {
      const corners = line
        .slice(2)
        .trim()
        .split(/\s+/)
        .map(token => {
          const [v, vt] = token.split("/");

          return [
            Number(v) - 1,
            vt ? Number(vt) - 1 : -1
          ];
        });

      faces.push({
        group,
        corners
      });
    }
  }

  if (!faces.length) {
    throw new Error("base.obj MakeHuman non valido.");
  }

  return { faces };
}

function bodyOrigIndex(obj) {
  const outIndexOf = new Map();
  const origIndex = [];

  for (const face of obj.faces) {
    if (face.group !== "body") continue;

    for (const [v, vt] of face.corners) {
      const key = `${v}/${vt}`;

      if (outIndexOf.has(key)) continue;

      outIndexOf.set(key, origIndex.length);
      origIndex.push(v);
    }
  }

  return origIndex;
}

function parseTarget(text) {
  const deltas = new Map();

  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();

    if (!line || line.startsWith("#")) continue;

    const p = line.split(/\s+/);

    if (p.length < 4) continue;

    const index = Number(p[0]);
    const dx = Number(p[1]);
    const dy = Number(p[2]);
    const dz = Number(p[3]);

    if (
      !Number.isInteger(index) ||
      !Number.isFinite(dx) ||
      !Number.isFinite(dy) ||
      !Number.isFinite(dz)
    ) {
      continue;
    }

    deltas.set(index, [dx, dy, dz]);
  }

  if (!deltas.size) {
    throw new Error("Target MakeHuman privo di delta.");
  }

  return deltas;
}

function captureMorphState(mesh) {
  return {
    dictionary: {
      ...(mesh.morphTargetDictionary || {})
    },
    influences: Array.from(
      mesh.morphTargetInfluences || []
    )
  };
}

function appendMorph(mesh, name, attribute) {
  const morphPositions =
    mesh.geometry.morphAttributes.position ||
    (mesh.geometry.morphAttributes.position = []);

  if (!mesh.morphTargetDictionary) {
    mesh.morphTargetDictionary = {};
  }

  if (!mesh.morphTargetInfluences) {
    mesh.morphTargetInfluences = [];
  }

  if (
    Object.prototype.hasOwnProperty.call(
      mesh.morphTargetDictionary,
      name
    )
  ) {
    return false;
  }

  const index = morphPositions.length;

  attribute.name = name;
  morphPositions.push(attribute);

  mesh.morphTargetDictionary[name] = index;
  mesh.morphTargetInfluences.push(0);

  return true;
}

function verifyPreserved(mesh, before) {
  const dictionary =
    mesh.morphTargetDictionary || {};

  const influences =
    mesh.morphTargetInfluences || [];

  const lost = [];
  const moved = [];
  const weightsChanged = [];

  for (const [name, oldIndex] of Object.entries(
    before.dictionary
  )) {
    const newIndex = dictionary[name];

    if (!Number.isInteger(newIndex)) {
      lost.push(name);
      continue;
    }

    if (newIndex !== oldIndex) {
      moved.push(`${name}:${oldIndex}->${newIndex}`);
      continue;
    }

    const oldValue =
      Number(before.influences[oldIndex] || 0);

    const newValue =
      Number(influences[newIndex] || 0);

    if (Math.abs(oldValue - newValue) > 1e-7) {
      weightsChanged.push(
        `${name}:${oldValue}->${newValue}`
      );
    }
  }

  if (
    lost.length ||
    moved.length ||
    weightsChanged.length
  ) {
    throw new Error(
      "Face native targets: contratto morph originale alterato. " +
      `lost=[${lost.join(", ")}] ` +
      `moved=[${moved.join(", ")}] ` +
      `weights=[${weightsChanged.join(", ")}]`
    );
  }

  return {
    originalMorphCount:
      Object.keys(before.dictionary).length,
    preservedMorphCount:
      Object.keys(before.dictionary).length
  };
}

export class MakeHumanFaceNativeTargetInstaller {
  constructor(adapter) {
    if (!adapter) {
      throw new Error(
        "FaceNativeTargetInstaller: adapter mancante."
      );
    }

    this.adapter = adapter;
    this.installed = false;
    this.installPromise = null;

    this.stats = {
      sourceCommit: SOURCE_COMMIT,
      added: [],
      touched: {},
      originalMorphCount: 0,
      preservedMorphCount: 0,
      finalMorphCount: 0
    };
  }

  async install() {
    if (this.installed) {
      return this.getDiagnostics();
    }

    if (this.installPromise) {
      return this.installPromise;
    }

    this.installPromise = this._install();

    try {
      await this.installPromise;
      return this.getDiagnostics();
    } catch (error) {
      this.installPromise = null;
      throw error;
    }
  }

  async _install() {
    const contract =
      this.adapter.resolveContract({ force: true });

    const body = contract?.meshes?.body;

    if (!body?.geometry?.attributes?.position) {
      throw new Error(
        "Face native targets: mesh Body non disponibile."
      );
    }

    const [objText, ...targetTexts] =
      await Promise.all([
        fetchText(BASE_OBJ_URL),
        ...Object.values(TARGETS)
          .map(fetchGzipText)
      ]);

    const obj = parseBaseObj(objText);
    const origIndex = bodyOrigIndex(obj);

    const positionCount =
      body.geometry.attributes.position.count;

    if (origIndex.length !== positionCount) {
      throw new Error(
        "Face native targets: mapping Body incompatibile: " +
        `source=${origIndex.length}, GLB=${positionCount}`
      );
    }

    const before = captureMorphState(body);

    const entries =
      Object.keys(TARGETS).map(
        (name, i) => [
          name,
          parseTarget(targetTexts[i])
        ]
      );

    for (const [name, deltas] of entries) {
      const array =
        new Float32Array(positionCount * 3);

      let touched = 0;

      for (let i = 0; i < positionCount; i++) {
        const delta = deltas.get(origIndex[i]);

        if (!delta) continue;

        array[i * 3] = delta[0] * SCALE;
        array[i * 3 + 1] = delta[1] * SCALE;
        array[i * 3 + 2] = delta[2] * SCALE;
        touched++;
      }

      if (!touched) {
        throw new Error(
          `Face native targets: ${name} non tocca Body.`
        );
      }

      const attribute =
        new THREE.Float32BufferAttribute(
          array,
          3
        );

      const didAdd =
        appendMorph(
          body,
          name,
          attribute
        );

      if (didAdd) {
        this.stats.added.push(name);
      }

      this.stats.touched[name] = touched;
    }

    const preservation =
      verifyPreserved(body, before);

    if (
      body.morphTargetInfluences.length !==
      body.geometry.morphAttributes.position.length
    ) {
      throw new Error(
        "Face native targets: conteggio morph incoerente."
      );
    }

    this.stats.originalMorphCount =
      preservation.originalMorphCount;

    this.stats.preservedMorphCount =
      preservation.preservedMorphCount;

    this.stats.finalMorphCount =
      Object.keys(
        body.morphTargetDictionary || {}
      ).length;

    this.adapter.inspect({ force: true });
    this.adapter.resolveContract({ force: true });

    this.installed = true;

    return true;
  }

  getDiagnostics() {
    return {
      installed: this.installed,
      sourceCommit:
        this.stats.sourceCommit,
      added: [...this.stats.added],
      touched: {
        ...this.stats.touched
      },
      originalMorphCount:
        this.stats.originalMorphCount,
      preservedMorphCount:
        this.stats.preservedMorphCount,
      finalMorphCount:
        this.stats.finalMorphCount
    };
  }
}
