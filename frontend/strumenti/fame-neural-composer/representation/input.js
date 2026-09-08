"use strict";

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sourceCollection(phrase) {
  const sourceId = String(phrase && phrase.provenance && phrase.provenance.sourceId || "unknown");
  const colon = sourceId.indexOf(":");
  return colon > 0 ? sourceId.slice(0, colon) : sourceId;
}

function validatePair(phrase, annotation) {
  const errors = [];
  if (!phrase || phrase.schema !== "fame-neural-phrase-item-v1") errors.push("phrase schema non valido");
  if (!phrase || !phrase.phraseId) errors.push("phraseId mancante");
  if (!phrase || !phrase.canonical || phrase.canonical.schema !== "fame-neural-sequence-v1") errors.push("canonical sequence mancante/non valida");
  if (!annotation || annotation.schema !== "fame-neural-musical-annotation-v1") errors.push("annotation schema non valido");
  if (phrase && annotation && phrase.phraseId !== annotation.phraseId) errors.push("phraseId annotation non corrispondente");
  return errors;
}

function buildRepresentationInput(phrase, annotation) {
  const errors = validatePair(phrase, annotation);
  if (errors.length) throw new Error(`Representation input non valido: ${errors.join(" | ")}`);
  return {
    schema: "fame-neural-representation-input-v1",
    version: 1,
    phraseId: phrase.phraseId,
    sourceCollection: annotation.sourceCollection || sourceCollection(phrase),
    phraseBars: Number(phrase.phraseBars) || Number(phrase.canonical.timing && phrase.canonical.timing.bars) || 1,
    sequence: deepClone(phrase.canonical),
    annotation: deepClone(annotation)
  };
}

function overlayFlatCompatibleAnnotations(input) {
  const sequence = deepClone(input.sequence);
  const annotationBars = Array.isArray(input.annotation && input.annotation.bars) ? input.annotation.bars : [];
  const sequenceBars = Array.isArray(sequence.bars) ? sequence.bars : [];
  const bars = Math.max(
    Number(sequence.timing && sequence.timing.bars) || 0,
    Number(input.phraseBars) || 0,
    annotationBars.length,
    sequenceBars.length,
    1
  );

  sequence.bars = Array.from({ length: bars }, (_, index) => {
    const source = sequenceBars[index] ? deepClone(sequenceBars[index]) : { index };
    const annotation = annotationBars[index] || null;
    source.index = index;
    if (annotation) {
      // Solo equivalenze semantiche dirette con il Flat PoC esistente.
      source.energy = annotation.energy;
      source.vocalSpace = annotation.vocalSpace;
      source.tension = annotation.tension;
    }
    return source;
  });
  sequence.timing = { ...(sequence.timing || {}), bars };
  return sequence;
}

module.exports = {
  buildRepresentationInput,
  overlayFlatCompatibleAnnotations,
  validatePair,
  sourceCollection
};
