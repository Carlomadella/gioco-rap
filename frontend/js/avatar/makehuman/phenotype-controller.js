"use strict";

import * as THREE from "three";

/*
  MakeHumanPhenotypeController V21

  IMPORTANT ARCHITECTURE CHANGE

  The existing GLB morphs:
    bodyMasculine
    bodyFeminine
    bodyAfrican
    bodyAsian
    bodyCaucasian

  are averages of COMPLETE MakeHuman macro anchors. They are useful as
  convenient independent demo sliders, but stacking "sex average" +
  "ethnicity average" double-applies complete-body macro deformation.

  V21 does not mask those morphs.

  Instead it reconstructs the SIX original sex × ancestry anchors directly
  from the same CC0 MakeHuman source targets used by the GLB builder:

    African Male
    Asian Male
    Caucasian Male
    African Female
    Asian Female
    Caucasian Female

  The six anchors are installed on the Body primitive, matching the canonical GLB's body-morph contract. Only ONE sex triplet is active at a time, and the three ancestry weights are
  normalized to 100%.

  This reproduces the intended macro composition:
    male 60/30/10 =
      0.60 AfricanMale +
      0.30 AsianMale +
      0.10 CaucasianMale

  with bodyMasculine/bodyFeminine/bodyAfrican/bodyAsian/bodyCaucasian = 0.
*/

const SOURCE_COMMIT =
  "e1e3e2503bef0ded4d53171b6c9444e63ee5dbdd";

const SOURCE_ROOT =
  `https://raw.githubusercontent.com/nirholas/three.ws/${SOURCE_COMMIT}/avatar-sources/anny`;

const BASE_OBJ_URL =
  `${SOURCE_ROOT}/3dobjs/base.obj`;

const SCALE = 0.1;

const SUBMESH_GROUPS = Object.freeze({
  Body: Object.freeze(["body"])
});

const ANCHORS = Object.freeze({
  phenotypeAfricanMale:
    `${SOURCE_ROOT}/targets/macrodetails/african-male-young.target.gz`,
  phenotypeAsianMale:
    `${SOURCE_ROOT}/targets/macrodetails/asian-male-young.target.gz`,
  phenotypeCaucasianMale:
    `${SOURCE_ROOT}/targets/macrodetails/caucasian-male-young.target.gz`,
  phenotypeAfricanFemale:
    `${SOURCE_ROOT}/targets/macrodetails/african-female-young.target.gz`,
  phenotypeAsianFemale:
    `${SOURCE_ROOT}/targets/macrodetails/asian-female-young.target.gz`,
  phenotypeCaucasianFemale:
    `${SOURCE_ROOT}/targets/macrodetails/caucasian-female-young.target.gz`
});

const LEGACY_COMPLETE_MACROS = Object.freeze([
  "bodyMasculine",
  "bodyFeminine",
  "bodyAfrican",
  "bodyAsian",
  "bodyCaucasian"
]);

function normalizeShares(shares = {}) {
  const african = Math.max(0, Number(shares.african) || 0);
  const asian = Math.max(0, Number(shares.asian) || 0);
  const caucasian = Math.max(0, Number(shares.caucasian) || 0);

  const sum = african + asian + caucasian;

  if (sum <= 0) {
    return {
      african: 1 / 3,
      asian: 1 / 3,
      caucasian: 1 / 3
    };
  }

  return {
    african: african / sum,
    asian: asian / sum,
    caucasian: caucasian / sum
  };
}

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
  const positions = [];
  const uvs = [];
  const faces = [];

  let group = "";

  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();

    if (!line || line.startsWith("#")) continue;

    if (line.startsWith("v ")) {
      const p = line.split(/\s+/);

      positions.push([
        Number(p[1]),
        Number(p[2]),
        Number(p[3])
      ]);

      continue;
    }

    if (line.startsWith("vt ")) {
      const p = line.split(/\s+/);

      uvs.push([
        Number(p[1]),
        Number(p[2])
      ]);

      continue;
    }

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

  if (!positions.length || !faces.length) {
    throw new Error("base.obj MakeHuman non valido.");
  }

  return {
    positions,
    uvs,
    faces
  };
}

function outputOrigIndex(obj, groups) {
  const wanted = new Set(groups);
  const outIndexOf = new Map();
  const origIndex = [];

  for (const face of obj.faces) {
    if (!wanted.has(face.group)) continue;

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

function meshByName(contract, name) {
  if (name === "Body") {
    return contract?.meshes?.body || null;
  }
  return null;
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

function bindCanonicalNamesToAttributes(mesh, snapshot) {
  const morphPositions =
    mesh.geometry?.morphAttributes?.position || [];

  for (const [name, index] of Object.entries(
    snapshot.dictionary
  )) {
    if (
      Number.isInteger(index) &&
      index >= 0 &&
      index < morphPositions.length
    ) {
      // GLTFLoader assigned the canonical MakeHuman names from
      // extras.targetNames. Keep attribute metadata aligned with that
      // dictionary so the names remain stable.
      morphPositions[index].name = name;
    }
  }
}

function appendMorphPreservingDictionary(
  mesh,
  morphName,
  attribute
) {
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
      morphName
    )
  ) {
    throw new Error(
      `Phenotype: morph già esistente: ${morphName}`
    );
  }

  const index = morphPositions.length;

  attribute.name = morphName;
  morphPositions.push(attribute);

  mesh.morphTargetDictionary[morphName] = index;
  mesh.morphTargetInfluences.push(0);

  return index;
}

function verifyMorphStatePreserved(mesh, snapshot) {
  const dictionary =
    mesh.morphTargetDictionary || {};

  const influences =
    mesh.morphTargetInfluences || [];

  const lost = [];
  const moved = [];
  const changed = [];

  for (const [name, oldIndex] of Object.entries(
    snapshot.dictionary
  )) {
    const newIndex = dictionary[name];

    if (!Number.isInteger(newIndex)) {
      lost.push(name);
      continue;
    }

    if (newIndex !== oldIndex) {
      moved.push(
        `${name}:${oldIndex}->${newIndex}`
      );
      continue;
    }

    const before =
      Number(snapshot.influences[oldIndex] || 0);

    const after =
      Number(influences[newIndex] || 0);

    if (Math.abs(before - after) > 1e-7) {
      changed.push(
        `${name}:${before}->${after}`
      );
    }
  }

  if (lost.length || moved.length || changed.length) {
    throw new Error(
      "Phenotype: dizionario morph originale alterato. " +
      `lost=[${lost.join(", ")}] ` +
      `moved=[${moved.join(", ")}] ` +
      `weights=[${changed.join(", ")}]`
    );
  }

  return {
    originalMorphCount:
      Object.keys(snapshot.dictionary).length,
    preservedMorphCount:
      Object.keys(snapshot.dictionary).length,
    lostMorphCount: 0,
    movedMorphCount: 0,
    changedInfluenceCount: 0
  };
}

export class MakeHumanPhenotypeController {
  constructor(adapter) {
    if (!adapter) {
      throw new Error(
        "MakeHumanPhenotypeController: adapter mancante."
      );
    }

    this.adapter = adapter;
    this.contract = adapter.resolveContract();

    this.sex = "male";

    this.shares = {
      african: 1 / 3,
      asian: 1 / 3,
      caucasian: 1 / 3
    };

    this.installed = false;
    this.installPromise = null;

    this.stats = {
      sourceCommit: SOURCE_COMMIT,
      targetCount: 0,
      meshes: {},
      legacyMacrosZero: false
    };
  }

  async install() {
    if (this.installed) return this.getDiagnostics();
    if (this.installPromise) return this.installPromise;

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
    const [objText, ...targetTexts] = await Promise.all([
      fetchText(BASE_OBJ_URL),
      ...Object.values(ANCHORS).map(fetchGzipText)
    ]);

    const obj = parseBaseObj(objText);

    const targetEntries =
      Object.keys(ANCHORS).map((name, i) => [
        name,
        parseTarget(targetTexts[i])
      ]);

    for (const [meshName, groups] of Object.entries(
      SUBMESH_GROUPS
    )) {
      const mesh = meshByName(this.contract, meshName);

      if (!mesh?.geometry?.attributes?.position) {
        throw new Error(
          `Phenotype V21: mesh ${meshName} non disponibile.`
        );
      }

      const origIndex = outputOrigIndex(obj, groups);
      const positionCount =
        mesh.geometry.attributes.position.count;

      if (origIndex.length !== positionCount) {
        throw new Error(
          `Phenotype V21: mapping ${meshName} incompatibile: ` +
          `source ${origIndex.length} != GLB ${positionCount}.`
        );
      }

      const previous = captureMorphState(mesh);

      // IMPORTANT:
      // GLTFLoader assigned the canonical MakeHuman morph names through
      // extras.targetNames. Calling Three.Mesh.updateMorphTargets() here
      // would rebuild that dictionary from BufferAttribute.name and reset
      // the influence array.
      //
      // V22.1 does not call it. We align metadata once and append the six
      // phenotype anchors manually, preserving the original name->index map.
      bindCanonicalNamesToAttributes(mesh, previous);

      const morphPositions =
        mesh.geometry.morphAttributes.position ||
        (mesh.geometry.morphAttributes.position = []);

      let added = 0;
      const touchedByTarget = {};

      for (const [morphName, deltas] of targetEntries) {
        const array = new Float32Array(
          positionCount * 3
        );

        let touched = 0;

        for (let i = 0; i < positionCount; i++) {
          const delta = deltas.get(origIndex[i]);

          if (!delta) continue;

          array[i * 3] = delta[0] * SCALE;
          array[i * 3 + 1] = delta[1] * SCALE;
          array[i * 3 + 2] = delta[2] * SCALE;

          touched++;
        }

        touchedByTarget[morphName] = touched;

        if (!touched) continue;

        const attribute =
          new THREE.Float32BufferAttribute(
            array,
            3
          );

        appendMorphPreservingDictionary(
          mesh,
          morphName,
          attribute
        );

        added++;
      }

      if (!added) {
        throw new Error(
          `Phenotype V21: nessun anchor tocca ${meshName}.`
        );
      }

      const preservation =
        verifyMorphStatePreserved(
          mesh,
          previous
        );

      if (
        mesh.morphTargetInfluences.length !==
        morphPositions.length
      ) {
        throw new Error(
          `Phenotype: morph count incoerente su ${meshName}: ` +
          `attributes=${morphPositions.length}, ` +
          `influences=${mesh.morphTargetInfluences.length}`
        );
      }

      this.stats.meshes[meshName] = {
        vertices: positionCount,
        addedMorphs: added,
        touchedByTarget,
        ...preservation,
        finalMorphCount:
          Object.keys(
            mesh.morphTargetDictionary || {}
          ).length
      };
    }

    // The adapter caches the initial morph inventory.
    // Force refresh after dynamically installing the six anchors.
    this.adapter.inspect({ force: true });
    this.adapter.resolveContract({ force: true });

    this.installed = true;
    this.stats.targetCount = Object.keys(ANCHORS).length;

    this._zeroLegacyCompleteMacros();

    // Default phenotype = male, 33/33/33.
    this.setBlend(this.shares);

    return true;
  }

  _zeroLegacyCompleteMacros() {
    for (const name of LEGACY_COMPLETE_MACROS) {
      this.adapter.setMorph(name, 0);
    }

    this.stats.legacyMacrosZero =
      LEGACY_COMPLETE_MACROS.every(
        name => Math.abs(
          this.adapter.getMorphValue(name)
        ) < 1e-7
      );
  }

  _anchorWeights() {
    const p = this.shares;
    const male = this.sex === "male";

    return {
      phenotypeAfricanMale:
        male ? p.african : 0,
      phenotypeAsianMale:
        male ? p.asian : 0,
      phenotypeCaucasianMale:
        male ? p.caucasian : 0,

      phenotypeAfricanFemale:
        male ? 0 : p.african,
      phenotypeAsianFemale:
        male ? 0 : p.asian,
      phenotypeCaucasianFemale:
        male ? 0 : p.caucasian
    };
  }

  setSex(sex) {
    if (!this.installed) {
      throw new Error(
        "Phenotype V21 non installato."
      );
    }

    this.sex =
      sex === "female" ? "female" : "male";

    // Preserve the old config contract for skin, save state and UI,
    // but DO NOT call adapter.setSex(), because that would re-enable
    // bodyMasculine/bodyFeminine.
    this.adapter.config.controls.sex = this.sex;

    this._zeroLegacyCompleteMacros();
    this.adapter.setMorphs(this._anchorWeights());

    return this.getDiagnostics();
  }

  setBlend(shares) {
    if (!this.installed) {
      throw new Error(
        "Phenotype V21 non installato."
      );
    }

    this.shares = normalizeShares(shares);

    this.adapter.config.controls.sex = this.sex;

    this._zeroLegacyCompleteMacros();
    this.adapter.setMorphs(this._anchorWeights());

    return this.getDiagnostics();
  }

  setPreset(id) {
    if (id === "african") {
      return this.setBlend({
        african: 1,
        asian: 0,
        caucasian: 0
      });
    }

    if (id === "asian") {
      return this.setBlend({
        african: 0,
        asian: 1,
        caucasian: 0
      });
    }

    if (id === "caucasian") {
      return this.setBlend({
        african: 0,
        asian: 0,
        caucasian: 1
      });
    }

    // "balanced" is the only neutral phenotype:
    // all three ancestry anchors are equally represented.
    return this.setBlend({
      african: 1,
      asian: 1,
      caucasian: 1
    });
  }

  getDiagnostics() {
    const weights = this.installed
      ? this._anchorWeights()
      : {};

    const activeSum =
      Object.values(weights)
        .reduce((sum, value) => sum + value, 0);

    return {
      installed: this.installed,
      sourceCommit: SOURCE_COMMIT,
      sex: this.sex,
      shares: { ...this.shares },
      weights,
      activeSum,
      legacyMacrosZero:
        this.stats.legacyMacrosZero,
      targetCount:
        this.stats.targetCount,
      meshes:
        JSON.parse(JSON.stringify(
          this.stats.meshes
        ))
    };
  }
}
