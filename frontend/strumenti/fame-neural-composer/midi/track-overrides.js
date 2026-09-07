"use strict";

const MELODIC_ROLES = new Set(["808", "harmony", "lead", "unknown", "none"]);

function normalizeTrackOverrides(input) {
  const source = input && typeof input === "object" ? input : {};
  const byIndex = new Map();
  const byName = new Map();
  const errors = [];

  const entries = Array.isArray(source.tracks) ? source.tracks : [];
  entries.forEach((raw, i) => {
    const item = raw && typeof raw === "object" ? raw : {};
    const hasIndex = Number.isInteger(item.trackIndex) && item.trackIndex >= 0;
    const hasName = typeof item.trackName === "string" && item.trackName.trim().length > 0;
    if (!hasIndex && !hasName) {
      errors.push(`tracks[${i}] richiede trackIndex o trackName`);
      return;
    }
    if (!MELODIC_ROLES.has(item.melodicRole)) {
      errors.push(`tracks[${i}].melodicRole non valido: ${String(item.melodicRole)}`);
      return;
    }
    const normalized = {
      melodicRole: item.melodicRole,
      pitchBendRangeSemitones: Number.isFinite(Number(item.pitchBendRangeSemitones))
        ? Math.max(0.25, Math.min(24, Number(item.pitchBendRangeSemitones)))
        : null,
      reason: typeof item.reason === "string" && item.reason.trim() ? item.reason.trim() : "manual override"
    };
    if (hasIndex) byIndex.set(item.trackIndex, normalized);
    if (hasName) byName.set(item.trackName.trim().toLowerCase(), normalized);
  });

  return { valid: errors.length === 0, errors, byIndex, byName };
}

function resolveTrackOverride(track, normalizedOverrides) {
  if (!normalizedOverrides) return null;
  const byIndex = normalizedOverrides.byIndex && normalizedOverrides.byIndex.get(track.index);
  if (byIndex) return byIndex;
  const name = String(track.name || "").trim().toLowerCase();
  if (name && normalizedOverrides.byName) return normalizedOverrides.byName.get(name) || null;
  return null;
}

module.exports = {
  MELODIC_ROLES,
  normalizeTrackOverrides,
  resolveTrackOverride
};
