"use strict";

import * as THREE from "three";

/*
  V24 — Facial helper phenotype sync

  Problem already observed in V21.2:
  Body receives the six sex × ancestry macro anchors, while Eyes / Teeth /
  Tongue remain at their neutral helper geometry and can float after strong
  phenotype changes.

  This module does NOT infer a mask and does NOT copy Body deformation.

  It reconstructs the SAME SIX ORIGINAL MakeHuman macro target deltas on the
  original helper groups used by the canonical GLB builder:

    Eyes   -> helper-l-eye + helper-r-eye
    Teeth  -> helper-upper-teeth + helper-lower-teeth
    Tongue -> helper-tongue

  Every helper is handled independently:
  - exact source vertex mapping
  - append-only morph dictionary
  - no updateMorphTargets()
  - original dictionary/indexes/weights verified unchanged
  - a failed helper stays unavailable without killing the whole runtime
*/

const SOURCE_COMMIT =
  "e1e3e2503bef0ded4d53171b6c9444e63ee5dbdd";

const SOURCE_ROOT =
  `https://raw.githubusercontent.com/nirholas/three.ws/${SOURCE_COMMIT}/avatar-sources/anny`;

const BASE_OBJ_URL =
  `${SOURCE_ROOT}/3dobjs/base.obj`;

const SCALE = 0.1;

const HELPERS = Object.freeze({
  eyes: Object.freeze({
    groups: Object.freeze(["helper-l-eye", "helper-r-eye"])
  }),
  teeth: Object.freeze({
    groups: Object.freeze(["helper-upper-teeth", "helper-lower-teeth"])
  }),
  tongue: Object.freeze({
    groups: Object.freeze(["helper-tongue"])
  })
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

const ANCHOR_NAMES =
  Object.freeze(Object.keys(ANCHORS));

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
      "Browser senza DecompressionStream(gzip): helper phenotype non caricabili."
    );
  }

  const blob = await response.blob();
  const stream = blob
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

    if (!line.startsWith("f ")) continue;

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

    faces.push({ group, corners });
  }

  if (!faces.length) {
    throw new Error("base.obj MakeHuman senza facce.");
  }

  return { faces };
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

function verifyOriginalMorphState(mesh, before) {
  const dictionary =
    mesh.morphTargetDictionary || {};

  const influences =
    mesh.morphTargetInfluences || [];

  const lost = [];
  const moved = [];
  const changed = [];

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

    const a =
      Number(before.influences[oldIndex] || 0);

    const b =
      Number(influences[newIndex] || 0);

    if (Math.abs(a - b) > 1e-7) {
      changed.push(`${name}:${a}->${b}`);
    }
  }

  if (lost.length || moved.length || changed.length) {
    throw new Error(
      "contratto morph helper alterato: " +
      `lost=[${lost.join(",")}] ` +
      `moved=[${moved.join(",")}] ` +
      `weights=[${changed.join(",")}]`
    );
  }
}

function helperMesh(contract, role) {
  return contract?.meshes?.[role] || null;
}

export class FacialHelperPhenotypeSync {
  constructor(adapter) {
    if (!adapter) {
      throw new Error(
        "FacialHelperPhenotypeSync: adapter mancante."
      );
    }

    this.adapter = adapter;
    this.contract =
      adapter.resolveContract({ force: true });

    this.installed = false;
    this.installPromise = null;

    this.report = {
      sourceCommit: SOURCE_COMMIT,
      roles: {}
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
    // Preserve the currently-active body anchor weights BEFORE helpers
    // receive morphs with the same names.
    const currentWeights = {};

    for (const name of ANCHOR_NAMES) {
      currentWeights[name] =
        this.adapter.getMorphValue(name);
    }

    const [objText, ...targetTexts] =
      await Promise.all([
        fetchText(BASE_OBJ_URL),
        ...Object.values(ANCHORS).map(fetchGzipText)
      ]);

    const obj = parseBaseObj(objText);

    const targets =
      ANCHOR_NAMES.map((name, i) => [
        name,
        parseTarget(targetTexts[i])
      ]);

    for (const [role, spec] of Object.entries(HELPERS)) {
      const mesh = helperMesh(this.contract, role);

      const roleReport = {
        role,
        mesh: mesh?.name || null,
        ready: false,
        sourceVertexCount: 0,
        glbVertexCount:
          mesh?.geometry?.attributes?.position?.count || 0,
        addedMorphs: [],
        existingMorphs: [],
        touchedByTarget: {},
        error: null
      };

      this.report.roles[role] = roleReport;

      try {
        if (!mesh?.geometry?.attributes?.position) {
          throw new Error("mesh helper non disponibile");
        }

        const origIndex =
          outputOrigIndex(obj, spec.groups);

        const positionCount =
          mesh.geometry.attributes.position.count;

        roleReport.sourceVertexCount =
          origIndex.length;

        if (origIndex.length !== positionCount) {
          throw new Error(
            `mapping source=${origIndex.length} GLB=${positionCount}`
          );
        }

        const before = captureMorphState(mesh);

        for (const [name, deltas] of targets) {
          if (
            Object.prototype.hasOwnProperty.call(
              mesh.morphTargetDictionary || {},
              name
            )
          ) {
            roleReport.existingMorphs.push(name);
            roleReport.touchedByTarget[name] = "esistente";
            continue;
          }

          const array =
            new Float32Array(positionCount * 3);

          let touched = 0;

          for (let i = 0; i < positionCount; i++) {
            const delta =
              deltas.get(origIndex[i]);

            if (!delta) continue;

            array[i * 3] = delta[0] * SCALE;
            array[i * 3 + 1] = delta[1] * SCALE;
            array[i * 3 + 2] = delta[2] * SCALE;

            touched++;
          }

          roleReport.touchedByTarget[name] = touched;

          if (!touched) continue;

          const attribute =
            new THREE.Float32BufferAttribute(
              array,
              3
            );

          if (appendMorph(mesh, name, attribute)) {
            roleReport.addedMorphs.push(name);
          }
        }

        verifyOriginalMorphState(mesh, before);

        const missing =
          ANCHOR_NAMES.filter(
            name =>
              !Object.prototype.hasOwnProperty.call(
                mesh.morphTargetDictionary || {},
                name
              )
          );

        if (missing.length) {
          throw new Error(
            "anchor helper mancanti: " +
            missing.join(", ")
          );
        }

        if (
          mesh.morphTargetInfluences.length !==
          mesh.geometry.morphAttributes.position.length
        ) {
          throw new Error(
            "conteggio morph/influences incoerente"
          );
        }

        roleReport.ready = true;
      } catch (error) {
        roleReport.ready = false;
        roleReport.error =
          error?.message || String(error);
      }
    }

    // Refresh adapter inventory after append.
    this.adapter.inspect({ force: true });
    this.adapter.resolveContract({ force: true });

    // Apply the body anchor weights to all newly-synced helper meshes.
    for (const [name, value] of Object.entries(
      currentWeights
    )) {
      this.adapter.setMorph(name, value);
    }

    this.installed = true;

    return true;
  }

  isReady(role) {
    return !!this.report.roles?.[role]?.ready;
  }

  getDiagnostics() {
    return JSON.parse(JSON.stringify({
      installed: this.installed,
      sourceCommit: SOURCE_COMMIT,
      roles: this.report.roles
    }));
  }
}
