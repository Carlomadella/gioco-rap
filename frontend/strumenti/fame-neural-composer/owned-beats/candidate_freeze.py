"""Verify evaluation authority before any holdout audio is opened (stdlib only)."""
import hashlib
import json
import re
import subprocess
from datetime import datetime, timezone
from importlib.metadata import version
from pathlib import Path
import sys


def digest_file(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()


def config_digest(config):
    # Le config V2 includono anche metadati/provenance; il configHash ufficiale
    # e' definito sull'algorithmConfig, come nell'evaluator V2. Le fixture legacy
    # senza algorithmConfig continuano a hashare direttamente il valore passato.
    value = (
        config["algorithmConfig"]
        if isinstance(config, dict) and "algorithmConfig" in config
        else config
    )
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"),
                                     ensure_ascii=True).encode()).hexdigest()


def verify_freeze(file, tool_dir, config):
    if not file:
        raise RuntimeError("evaluation-holdout requires --candidate-freeze")
    file = Path(file).resolve()
    tool_dir = Path(tool_dir).resolve()
    freeze = json.loads(file.read_text(encoding="utf-8-sig"))
    for field in ("candidateId", "codeCommit", "configHash", "dependencyLockHash",
                  "developmentSummaryDigest", "developmentSummaryPath", "frozenAt",
                  "protocolDigestSha256", "ffmpegVersion"):
        if not isinstance(freeze.get(field), str) or not freeze[field].strip():
            raise RuntimeError(f"Missing freeze field: {field}")
    for field in ("configHash", "dependencyLockHash", "developmentSummaryDigest", "protocolDigestSha256"):
        if not re.fullmatch(r"[0-9a-f]{64}", freeze[field]):
            raise RuntimeError(f"Invalid freeze hash: {field}")
    frozen_at = datetime.fromisoformat(freeze["frozenAt"].replace("Z", "+00:00"))
    if frozen_at.tzinfo is None or frozen_at > datetime.now(timezone.utc):
        raise RuntimeError("Invalid frozenAt")
    def git(*args):
        return subprocess.check_output(["git", *args], cwd=tool_dir, text=True).strip()
    current_head = git("rev-parse", "HEAD")
    if freeze["codeCommit"] != current_head:
        ancestry = subprocess.run(
            ["git", "merge-base", "--is-ancestor", freeze["codeCommit"], current_head],
            cwd=tool_dir,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        if ancestry.returncode != 0:
            raise RuntimeError("Frozen codeCommit is not an ancestor of checkout")
    # Infrastructure-only descendant commits are allowed; candidate/config/protocol
    # identity is verified independently below.
    # Includes staged, unstaged and untracked implementation/configuration files.
    if git("status", "--porcelain", "--untracked-files=all", "--", "."):
        raise RuntimeError("Owned-beats code/config checkout is dirty")
    if freeze["configHash"] != config_digest(config):
        raise RuntimeError("Frozen configHash mismatch")
    if isinstance(config, dict):
        declared_hash = config.get("configHash")
        if declared_hash is not None and declared_hash != freeze["configHash"]:
            raise RuntimeError("Config-declared configHash differs from freeze")
        declared_candidate = config.get("candidateId")
        if declared_candidate is not None and declared_candidate != freeze["candidateId"]:
            raise RuntimeError("Config candidateId differs from freeze")
    lock = tool_dir / "requirements-audio-analysis-lock.txt"
    if freeze["dependencyLockHash"] != digest_file(lock):
        raise RuntimeError("Frozen dependencyLockHash mismatch")
    if freeze["protocolDigestSha256"] != digest_file(tool_dir / "audio-analysis-v2-protocol.json"):
        raise RuntimeError("Frozen protocol digest mismatch")
    expected_python = (tool_dir / ".python-version").read_text().strip()
    if ".".join(map(str, sys.version_info[:2])) != expected_python:
        raise RuntimeError("Python differs from frozen environment")
    for line in lock.read_text().splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        name, expected = line.split("==", 1)
        if version(name) != expected:
            raise RuntimeError(f"Installed dependency differs from lock: {name}")
    ffmpeg = subprocess.check_output(["ffmpeg", "-version"], text=True).splitlines()[0].strip()
    if ffmpeg != freeze["ffmpegVersion"]:
        raise RuntimeError("FFmpeg differs from frozen environment")
    summary_path = file.parent / freeze["developmentSummaryPath"]
    if digest_file(summary_path) != freeze["developmentSummaryDigest"]:
        raise RuntimeError("Development summary digest mismatch")
    summary = json.loads(summary_path.read_text(encoding="utf-8-sig"))
    if summary.get("decision") != "V2_WINS" or summary.get("split") != "development":
        raise RuntimeError("Development summary must report development V2_WINS")
    for field in ("candidateId", "codeCommit", "configHash", "dependencyLockHash", "protocolDigestSha256"):
        if summary.get(field) != freeze[field]:
            raise RuntimeError(f"Development summary candidate mismatch: {field}")

    # Un commit tooling-only successivo alla review development non deve invalidare
    # il candidate, ma la sorgente valutata deve restare byte-identica come Git blob.
    if isinstance(config, dict) and config.get("candidateSourceFile"):
        candidate_rel = config["candidateSourceFile"]
        expected_blob = summary.get("evaluatedCandidateSourceGitBlobSha1")
        declared_blob = config.get("candidateSourceGitBlobSha1")
        if not isinstance(expected_blob, str) or not re.fullmatch(r"[0-9a-f]{40}", expected_blob):
            raise RuntimeError("Development summary missing evaluated candidate blob")
        if declared_blob != expected_blob:
            raise RuntimeError("Config candidate source blob differs from development summary")
        candidate_file = (tool_dir / candidate_rel).resolve()
        try:
            candidate_file.relative_to(tool_dir)
        except ValueError as exc:
            raise RuntimeError("Candidate source path escapes tool directory") from exc
        if not candidate_file.is_file():
            raise RuntimeError("Candidate source file missing")
        actual_blob = git("hash-object", str(candidate_file))
        if actual_blob != expected_blob:
            raise RuntimeError("Candidate source blob differs from development evaluation")

    # Integrity/identity gate only: the future evaluator must produce and substantiate
    # this decision using the paired metrics, reference digests and review policy.
    return {**freeze, "freezeDigestSha256": digest_file(file)}


def reserve_holdout(workspace, freeze, records):
    """One attempt per family set, even if candidateId changes; never auto-release."""
    identities = sorted({r["compositionFamilyId"] for r in records})
    if not identities or any(not f for f in identities):
        raise RuntimeError("Missing holdout families")
    key = config_digest(identities)
    root = Path(workspace) / "runs" / "evaluation-holdout-usage"
    root.mkdir(parents=True, exist_ok=True)
    lock = root / "reservation.lock"
    # A single writer checks ALL prior sets: subsets or expanded sets must not
    # silently reuse observed families under another candidate identity.
    handle = lock.open("x", encoding="utf-8")
    try:
        for previous in root.glob("*.json"):
            used = json.loads(previous.read_text(encoding="utf-8"))
            if set(identities).intersection(used["families"]):
                raise RuntimeError("Holdout families already reserved/observed")
        reservation = root / (key + ".json")
        with reservation.open("x", encoding="utf-8") as out:
            json.dump({"status": "RESERVED_BEFORE_AUDIO_ACCESS", "families": identities,
                       "freezeDigestSha256": freeze["freezeDigestSha256"],
                       "candidateId": freeze["candidateId"],
                       "reservedAt": datetime.now(timezone.utc).isoformat()}, out, indent=2)
    finally:
        handle.close()
        lock.unlink()
    return str(reservation)
