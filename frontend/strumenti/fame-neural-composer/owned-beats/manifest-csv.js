"use strict";
const ROLES = ["drums", "lowend", "tonal", "full"];

function csv(m) {
  const columns = [
    "sourceRecordId", "sourceAssetId", "compositionFamilyId", "familyStatus", "sha256",
    "localPath", "sourcePaths", "presentInScan", "nativeExports", "metadataStatus",
    "taskAdmissibility", "split", "pilotCohorts", "drums", "lowend", "tonal", "full"
  ];
  const quote = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    columns,
    ...m.records.map(r => [
      r.sourceRecordId,
      r.sourceAssetId,
      r.compositionFamilyId,
      r.familyStatus,
      r.sha256,
      r.localPath,
      (r.sourcePaths || []).join(" | "),
      r.presentInScan,
      r.nativeExports,
      r.metadataStatus,
      r.taskAdmissibility,
      r.split,
      (r.pilotCohorts || []).join(" | "),
      ...ROLES.map(k => r.roles?.[k]?.review)
    ])
  ].map(row => row.map(quote).join(",")).join("\r\n") + "\r\n";
}

module.exports = { csv };
