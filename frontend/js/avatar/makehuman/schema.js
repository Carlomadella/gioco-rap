"use strict";

export const MAKEHUMAN_ENGINE = "makehuman";
export const MAKEHUMAN_SCHEMA_VERSION = 2;

export function createEmptyMakeHumanConfig(modelUrl = "") {
  return {
    engine: MAKEHUMAN_ENGINE,
    schemaVersion: MAKEHUMAN_SCHEMA_VERSION,
    sourceModel: { url: String(modelUrl || "") },
    controls: { sex: "neutral", height: 0, mass: 0, build: 0 },
    morphs: {},
    materials: {},
    attachments: { hair: null, top: null, bottom: null, shoes: null }
  };
}

export function normalizeMakeHumanConfig(value = {}) {
  const input = value && typeof value === "object" ? value : {};
  const base = createEmptyMakeHumanConfig(input?.sourceModel?.url || input?.modelUrl || "");
  return {
    ...base,
    ...input,
    engine: MAKEHUMAN_ENGINE,
    schemaVersion: MAKEHUMAN_SCHEMA_VERSION,
    sourceModel: { ...base.sourceModel, ...(input.sourceModel || {}) },
    controls: { ...base.controls, ...(input.controls || {}) },
    morphs: { ...(input.morphs || {}) },
    materials: { ...(input.materials || {}) },
    attachments: { ...base.attachments, ...(input.attachments || {}) }
  };
}

export function cloneMakeHumanConfig(value = {}) {
  return JSON.parse(JSON.stringify(normalizeMakeHumanConfig(value)));
}
