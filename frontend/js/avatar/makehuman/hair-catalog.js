"use strict";

/*
  MakeHuman hair catalog V17.

  Database pinned to:
  dmaugis/makehuman-custom
  commit 8d806798841f6e77368cbb2cd2b43d3d4a8f42d1

  Already validated:
  - short01
  - short02
  - afro01
  - long01 (female perfect; male nearly perfect with anatomical Stature)

  Batch under test:
  - bob01
  - bob02
  - ponytail01
  - short03
  - short04
  - braid01

  No geometry logic lives here.
*/

const COMMIT = "8d806798841f6e77368cbb2cd2b43d3d4a8f42d1";
const ROOT =
  `https://raw.githubusercontent.com/dmaugis/makehuman-custom/${COMMIT}/makehuman/data/hair`;

function sourceFor(note = "") {
  return Object.freeze({
    repository: "dmaugis/makehuman-custom",
    commit: COMMIT,
    licenseNote:
      note ||
      "Asset MakeHuman tecnico di test; i file originali dichiarano AGPLv3 nei rispettivi header."
  });
}

function standardHair(id, {
  label = id,
  alphaTest = 0.22,
  roughness = 0.84,
  normalUrl = null,
  normalScale = 0
} = {}) {
  return Object.freeze({
    id,
    label,
    basemesh: "hm08",
    objUrl: `${ROOT}/${id}/${id}.obj`,
    proxyUrl: `${ROOT}/${id}/${id}.mhclo`,
    diffuseUrl: `${ROOT}/${id}/${id}_diffuse.png`,
    normalUrl: normalUrl
      ? `${ROOT}/${id}/${normalUrl}`
      : null,

    material: Object.freeze({
      alphaTest,
      alphaToCoverage: true,
      roughness,
      metalness: 0,
      doubleSide: true,
      normalScale
    }),

    source: sourceFor()
  });
}

export const MAKEHUMAN_HAIR_CATALOG = Object.freeze({
  short01: standardHair("short01", {
    label: "Corto 01 · short01",
    alphaTest: 0.22,
    roughness: 0.82,
    normalScale: 0.08
  }),

  short02: standardHair("short02", {
    label: "Corto 02 · short02",
    alphaTest: 0.22,
    roughness: 0.82,
    normalUrl: "short02_normal.png",
    normalScale: 0.08
  }),

  short03: standardHair("short03", {
    label: "Corto 03 · short03",
    alphaTest: 0.22,
    roughness: 0.82
  }),

  short04: standardHair("short04", {
    label: "Corto 04 · short04",
    alphaTest: 0.22,
    roughness: 0.82
  }),

  afro01: Object.freeze({
    id: "afro01",
    label: "Afro 01 · afro01",
    basemesh: "hm08",
    objUrl: `${ROOT}/afro01/afro01.obj`,
    proxyUrl: `${ROOT}/afro01/afro01.mhclo`,
    diffuseUrl: `${ROOT}/afro01/afro_diffuse.png`,
    normalUrl: null,

    material: Object.freeze({
      alphaTest: 0.28,
      alphaToCoverage: true,
      roughness: 0.90,
      metalness: 0,
      doubleSide: true,
      normalScale: 0
    }),

    source: sourceFor()
  }),

  long01: standardHair("long01", {
    label: "Lungo 01 · long01",
    alphaTest: 0.24,
    roughness: 0.86
  }),

  bob01: standardHair("bob01", {
    label: "Bob 01 · bob01",
    alphaTest: 0.24,
    roughness: 0.86
  }),

  bob02: standardHair("bob02", {
    label: "Bob 02 · bob02",
    alphaTest: 0.24,
    roughness: 0.86
  }),

  ponytail01: standardHair("ponytail01", {
    label: "Coda 01 · ponytail01",
    alphaTest: 0.24,
    roughness: 0.86
  })
});

export function getMakeHumanHairAsset(id) {
  return MAKEHUMAN_HAIR_CATALOG[id] || null;
}

export function listMakeHumanHairAssets() {
  return Object.values(MAKEHUMAN_HAIR_CATALOG);
}
