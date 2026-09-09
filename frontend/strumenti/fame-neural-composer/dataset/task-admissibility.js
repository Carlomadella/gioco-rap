"use strict";

const {
  OBSERVED_CONTENT_KEYS,
  CAPABILITY_KEYS,
  USAGE_KEYS,
  QUALITY_KEYS
} = require("./content-capabilities");

const POLICY_REGISTRY_SCHEMA = "fame-neural-task-admissibility-policy-registry-v1";
const DECISION_SCHEMA = "fame-neural-task-admissibility-decision-v1";

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function unique(values) {
  return [...new Set(values)];
}

function assertionState(map, key) {
  return map && map[key] && nonEmptyString(map[key].state) ? map[key].state : "unknown";
}

function assertionEvidenceRefs(map, key) {
  return map && map[key] && Array.isArray(map[key].evidenceRefs)
    ? map[key].evidenceRefs.filter(nonEmptyString)
    : [];
}

function normalizeSourceCollections(value) {
  return Array.isArray(value)
    ? unique(value.filter(nonEmptyString).map(item => item.trim())).sort()
    : [];
}

function validateTaskPolicyRegistry(input = {}) {
  const errors = [];
  if (input.schema !== POLICY_REGISTRY_SCHEMA) {
    errors.push(`schema non valido: ${String(input.schema)}`);
  }
  if (input.version !== 1) {
    errors.push(`version non valida: ${String(input.version)}`);
  }

  const tasks = input.tasks && typeof input.tasks === "object" ? input.tasks : {};
  if (!Object.keys(tasks).length) errors.push("tasks vuoto");

  for (const [taskId, task] of Object.entries(tasks)) {
    if (!nonEmptyString(taskId)) errors.push("taskId vuoto");
    if (!task || typeof task !== "object") {
      errors.push(`${taskId}: task non valido`);
      continue;
    }
    if (task.taskId !== taskId) errors.push(`${taskId}: task.taskId deve coincidere con la chiave`);
    if (typeof task.trainingTask !== "boolean") errors.push(`${taskId}: trainingTask deve essere boolean`);
    if (!USAGE_KEYS.includes(task.usageKey)) {
      errors.push(`${taskId}: usageKey non valido (${String(task.usageKey)})`);
    }

    for (const key of Object.keys(task.observedContent || {})) {
      if (!OBSERVED_CONTENT_KEYS.includes(key)) errors.push(`${taskId}: observedContent non riconosciuto (${key})`);
      if (task.observedContent[key] !== "present") {
        errors.push(`${taskId}: observedContent.${key} supporta solo requisito present in V1`);
      }
    }
    for (const key of Object.keys(task.capabilities || {})) {
      if (!CAPABILITY_KEYS.includes(key)) errors.push(`${taskId}: capability non riconosciuta (${key})`);
      if (task.capabilities[key] !== "verified") {
        errors.push(`${taskId}: capabilities.${key} supporta solo requisito verified in V1`);
      }
    }
    for (const key of Object.keys(task.quality || {})) {
      if (!QUALITY_KEYS.includes(key)) errors.push(`${taskId}: quality non riconosciuta (${key})`);
      if (task.quality[key] !== "pass") {
        errors.push(`${taskId}: quality.${key} supporta solo requisito pass in V1`);
      }
    }

    const sourceCollections = task.sourceCollections || {};
    const allow = normalizeSourceCollections(sourceCollections.allow);
    const block = normalizeSourceCollections(sourceCollections.block);
    const overlap = allow.filter(item => block.includes(item));
    if (overlap.length) errors.push(`${taskId}: source collection sia allow che block (${overlap.join(", ")})`);
  }

  return { ok: errors.length === 0, errors };
}

function getTaskPolicy(registry, taskId) {
  const validation = validateTaskPolicyRegistry(registry);
  if (!validation.ok) {
    throw new Error(`Task policy registry non valido: ${validation.errors.join("; ")}`);
  }
  const task = registry.tasks[taskId];
  if (!task) throw new Error(`Task policy non trovata: ${taskId}`);
  return JSON.parse(JSON.stringify(task));
}

function makeReason(code, field, actual, expected, evidenceRefs = []) {
  return {
    code,
    field,
    actual: actual == null ? null : actual,
    expected: expected == null ? null : expected,
    evidenceRefs: unique(evidenceRefs)
  };
}

function evaluateTaskAdmissibility(overlayItem, taskPolicy, context = {}) {
  const cc = overlayItem && overlayItem.contentCapabilities
    ? overlayItem.contentCapabilities
    : overlayItem || {};
  const linkage = overlayItem && overlayItem.linkage || {};
  const phrase = context.phrase || null;
  const sourceCollectionId = nonEmptyString(context.sourceCollectionId)
    ? context.sourceCollectionId.trim()
    : null;

  const blocked = [];
  const unknown = [];
  const usedEvidenceRefs = [];

  function addBlocked(code, field, actual, expected, refs = []) {
    blocked.push(makeReason(code, field, actual, expected, refs));
    usedEvidenceRefs.push(...refs);
  }
  function addUnknown(code, field, actual, expected, refs = []) {
    unknown.push(makeReason(code, field, actual, expected, refs));
    usedEvidenceRefs.push(...refs);
  }
  function markEvidence(refs) {
    usedEvidenceRefs.push(...refs);
  }

  if (!taskPolicy || typeof taskPolicy !== "object" || !nonEmptyString(taskPolicy.taskId)) {
    addUnknown("TASK_POLICY_MISSING", "taskPolicy", null, "valid task policy");
  }

  if (taskPolicy.requireProvenance !== false) {
    if (!nonEmptyString(overlayItem && overlayItem.phraseId)) {
      addUnknown("PROVENANCE_PHRASE_ID_MISSING", "phraseId", null, "non-empty");
    }
    if (!nonEmptyString(linkage.sourceId)) {
      addUnknown("PROVENANCE_SOURCE_ID_MISSING", "linkage.sourceId", null, "non-empty");
    }
    if (!nonEmptyString(linkage.compositionFamily)) {
      addUnknown("PROVENANCE_COMPOSITION_FAMILY_MISSING", "linkage.compositionFamily", null, "non-empty");
    }
  }

  const usageKey = taskPolicy.usageKey;
  const usageState = USAGE_KEYS.includes(usageKey)
    ? assertionState(cc.usage, usageKey)
    : "unknown";
  const usageRefs = USAGE_KEYS.includes(usageKey)
    ? assertionEvidenceRefs(cc.usage, usageKey)
    : [];
  markEvidence(usageRefs);

  if (usageState === "blocked") {
    addBlocked("USAGE_BLOCKED", `usage.${usageKey}`, usageState, "allowed", usageRefs);
  } else if (usageState === "candidate") {
    addUnknown("USAGE_CANDIDATE", `usage.${usageKey}`, usageState, "allowed", usageRefs);
  } else if (usageState !== "allowed") {
    addUnknown("USAGE_UNKNOWN", `usage.${usageKey}`, usageState, "allowed", usageRefs);
  }

  const rightsPolicy = taskPolicy.rights || {};
  if (rightsPolicy.commercialTrainingAllowed === true) {
    if (!phrase) {
      addUnknown("RIGHTS_TRAINING_UNKNOWN", "rights.commercialTrainingAllowed", null, true);
    } else {
      const rights = phrase.rights && phrase.rights.commercialTrainingAllowed;
      const provenanceRights = phrase.provenance && phrase.provenance.commercialTrainingAllowed;
      if (rights === false || provenanceRights === false) {
        addBlocked(
          "RIGHTS_TRAINING_BLOCKED",
          "rights.commercialTrainingAllowed",
          { rights, provenance: provenanceRights },
          { rights: true, provenance: true }
        );
      } else if (rights !== true || provenanceRights !== true) {
        addUnknown(
          "RIGHTS_TRAINING_UNKNOWN",
          "rights.commercialTrainingAllowed",
          { rights, provenance: provenanceRights },
          { rights: true, provenance: true }
        );
      }
    }
  }

  if (rightsPolicy.commercialOutputAllowed === true) {
    if (!phrase) {
      addUnknown("RIGHTS_OUTPUT_UNKNOWN", "rights.commercialOutputAllowed", null, true);
    } else {
      const rights = phrase.rights && phrase.rights.commercialOutputAllowed;
      const provenanceRights = phrase.provenance && phrase.provenance.commercialOutputAllowed;
      if (rights === false || provenanceRights === false) {
        addBlocked(
          "RIGHTS_OUTPUT_BLOCKED",
          "rights.commercialOutputAllowed",
          { rights, provenance: provenanceRights },
          { rights: true, provenance: true }
        );
      } else if (rights !== true || provenanceRights !== true) {
        addUnknown(
          "RIGHTS_OUTPUT_UNKNOWN",
          "rights.commercialOutputAllowed",
          { rights, provenance: provenanceRights },
          { rights: true, provenance: true }
        );
      }
    }
  }

  for (const [key, expected] of Object.entries(taskPolicy.observedContent || {})) {
    const actual = assertionState(cc.observedContent, key);
    const refs = assertionEvidenceRefs(cc.observedContent, key);
    markEvidence(refs);
    if (expected === "present") {
      if (actual === "not_observed") {
        addBlocked("OBSERVED_CONTENT_NOT_PRESENT", `observedContent.${key}`, actual, expected, refs);
      } else if (actual !== "present") {
        addUnknown("OBSERVED_CONTENT_UNKNOWN", `observedContent.${key}`, actual, expected, refs);
      }
    }
  }

  for (const [key, expected] of Object.entries(taskPolicy.capabilities || {})) {
    const actual = assertionState(cc.capabilities, key);
    const refs = assertionEvidenceRefs(cc.capabilities, key);
    markEvidence(refs);
    if (expected === "verified") {
      if (actual === "absent") {
        addBlocked("CAPABILITY_ABSENT", `capabilities.${key}`, actual, expected, refs);
      } else if (actual === "candidate") {
        addUnknown("CAPABILITY_CANDIDATE", `capabilities.${key}`, actual, expected, refs);
      } else if (actual !== "verified") {
        addUnknown("CAPABILITY_UNKNOWN", `capabilities.${key}`, actual, expected, refs);
      }
    }
  }

  for (const [key, expected] of Object.entries(taskPolicy.quality || {})) {
    const actual = assertionState(cc.quality, key);
    const refs = assertionEvidenceRefs(cc.quality, key);
    markEvidence(refs);
    if (expected === "pass") {
      if (actual === "fail") {
        addBlocked("QUALITY_FAIL", `quality.${key}`, actual, expected, refs);
      } else if (actual === "candidate") {
        addUnknown("QUALITY_CANDIDATE", `quality.${key}`, actual, expected, refs);
      } else if (actual !== "pass") {
        addUnknown("QUALITY_UNKNOWN", `quality.${key}`, actual, expected, refs);
      }
    }
  }

  const sourcePolicy = taskPolicy.sourceCollections || {};
  const allow = normalizeSourceCollections(sourcePolicy.allow);
  const block = normalizeSourceCollections(sourcePolicy.block);

  if (block.length && sourceCollectionId && block.includes(sourceCollectionId)) {
    addBlocked("SOURCE_COLLECTION_BLOCKED", "sourceCollectionId", sourceCollectionId, "not blocked");
  }
  if (allow.length) {
    if (!sourceCollectionId) {
      addUnknown("SOURCE_COLLECTION_UNKNOWN", "sourceCollectionId", null, allow);
    } else if (!allow.includes(sourceCollectionId)) {
      addBlocked("SOURCE_COLLECTION_NOT_ALLOWED", "sourceCollectionId", sourceCollectionId, allow);
    }
  }

  const decision = blocked.length
    ? "blocked"
    : unknown.length
      ? "unknown"
      : "allowed";

  const reasons = decision === "blocked"
    ? [...blocked, ...unknown]
    : unknown;

  return {
    schema: DECISION_SCHEMA,
    version: 1,
    taskId: taskPolicy && taskPolicy.taskId || null,
    subjectPhraseId: overlayItem && overlayItem.phraseId || null,
    sourceCollectionId,
    decision,
    reasons,
    evidenceRefs: unique(usedEvidenceRefs).sort()
  };
}

function summarizeDecisions(decisions) {
  const counts = { allowed: 0, blocked: 0, unknown: 0 };
  const reasonCodes = {};
  for (const decision of decisions || []) {
    const state = decision && decision.decision || "unknown";
    counts[state] = (counts[state] || 0) + 1;
    for (const reason of Array.isArray(decision && decision.reasons) ? decision.reasons : []) {
      reasonCodes[reason.code] = (reasonCodes[reason.code] || 0) + 1;
    }
  }
  return {
    counts,
    reasonCodes: Object.fromEntries(Object.entries(reasonCodes).sort(([a], [b]) => a.localeCompare(b)))
  };
}

function selectAllowedDecisions(decisions) {
  return (decisions || []).filter(item => item && item.decision === "allowed");
}

function readinessForTask(taskPolicy, decisionCounts = {}) {
  const taskReady = Number(decisionCounts.allowed || 0) > 0;
  return {
    taskReady,
    trainingReady: taskPolicy && taskPolicy.trainingTask === true ? taskReady : null
  };
}

module.exports = {
  POLICY_REGISTRY_SCHEMA,
  DECISION_SCHEMA,
  validateTaskPolicyRegistry,
  getTaskPolicy,
  evaluateTaskAdmissibility,
  summarizeDecisions,
  selectAllowedDecisions,
  readinessForTask
};
