"use strict";

const { createSequence } = require("../core");
const tokenizer = require("../tokenizer");
const vocabulary = require("../vocabulary");
const { validateTokenGrammar } = require("../grammar");
const { overlayFlatCompatibleAnnotations } = require("./input");
const { phase4Snapshot } = require("./common");

const PHASE4_FEATURES = ["energy", "vocalSpace", "tension"];

const CAPABILITIES = Object.freeze({
  canonicalEvents: true,
  timing: true,
  harmony: true,
  velocity: "10-bin",
  bass808Glide: true,
  phase4Energy: "10-bin-per-bar",
  phase4VocalSpace: "10-bin-per-bar",
  phase4Tension: "10-bin-per-bar",
  phase4Density: false,
  phase4MotifFamilies: false,
  phase4Kick808Relation: false,
  phase4HatRolls: false,
  phase4TransitionStrength: false,
  note: "Baseline Flat PoC FASE 1: le annotazioni FASE 4 entrano solo dove esiste una equivalenza semantica diretta."
});

function prepare(input) {
  return createSequence(overlayFlatCompatibleAnnotations(input));
}

function encode(preparedSequence) {
  return tokenizer.encode(preparedSequence);
}

function decode(encoded) {
  return tokenizer.decode(encoded);
}

function validateEncoded(encoded) {
  return validateTokenGrammar(encoded);
}

function validateVocabulary(encoded) {
  tokenizer.toIds(encoded);
  return true;
}

module.exports = {
  id: "flat-poc-v1",
  family: "flat-token",
  version: 1,
  unitName: "token",
  vocabSize: vocabulary.vocabSize,
  metadata: {
    phase4FeatureCoverage: PHASE4_FEATURES.length
  },
  capabilities: CAPABILITIES,
  phase4Features: PHASE4_FEATURES,
  phase4Snapshot: sequence => phase4Snapshot(sequence, PHASE4_FEATURES),
  prepare,
  encode,
  decode,
  validateEncoded,
  validateVocabulary
};
