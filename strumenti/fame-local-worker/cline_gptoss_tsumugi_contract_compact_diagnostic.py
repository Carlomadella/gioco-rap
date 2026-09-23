"""Compact diagnostic repeat of the Tsumugi contract audit.

Same frozen semantic checks as the consumed multi-file run, but all four source
snapshots are concatenated into one read-only source-audit.md. This is a tool/
packaging diagnostic, not a new independent evaluation.
"""
import argparse
import hashlib
import json
from pathlib import Path

import agent
import cline_gptoss_tsumugi_contract_audit as base

VERSION = "fame-cline-gptoss-tsumugi-contract-compact-diagnostic-v1"
MODEL = base.MODEL
SOURCE_COMMIT = base.SOURCE_COMMIT
PRIOR_RUN = "FAME_CLINE_GPTOSS_TSUMUGI_CONTRACT_001"
PRIOR_FAILURE_CLASS = "TOOL_LAYER_FAILURE_BEFORE_ARTIFACT"

TASK = """# FAME Neural — diagnostico compatto audit contract Tsumugi
Leggi TASK.json, memory/procedure.md e source-audit.md.
source-audit.md contiene, in sequenza e senza omissioni, i quattro file sorgente
congelati del precedente audit.
Non eseguire codice o comandi.
Per ogni check determina se il vincolo del diagnostic protocol viene verificato a runtime
contro il valore effettivamente usato prima del model forward / audio access pertinente.
Non basta che un valore sia scritto nel JSON o controllato da un test statico:
ENFORCED richiede un controllo runtime che blocchi una divergenza.
Salva soltanto audit.json nel formato richiesto.
"""

RULE = """# Scope diagnostico compatto
Lavora solo in questa desk.
Puoi leggere TASK.md, TASK.json, memory/procedure.md e source-audit.md.
Puoi scrivere soltanto audit.json.
Non usare terminale, browser, rete, MCP, altre cartelle, cronologia o workspace.
Non modificare source-audit.md.
"""

PROCEDURE = base.PROCEDURE


def encoded(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + "\n"


def combined_source():
    chunks = []
    for name, path in base.FILES.items():
        text = path.read_text(encoding="utf-8-sig")
        chunks.append(
            f"===== BEGIN FILE: {name} =====\n"
            + text.rstrip("\n")
            + f"\n===== END FILE: {name} ====="
        )
    return "\n\n".join(chunks) + "\n"


def desk_files():
    return {
        "TASK.md": TASK.encode("utf-8"),
        "TASK.json": encoded({"checks": base.CHECKS}).encode("utf-8"),
        ".clinerules/01-scope.md": RULE.encode("utf-8"),
        "memory/procedure.md": PROCEDURE.encode("utf-8"),
        "source-audit.md": combined_source().encode("utf-8"),
    }


def init(root):
    root.mkdir(parents=True, exist_ok=False)
    files = desk_files()
    for rel, data in files.items():
        path = root / "desk" / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    (root / "operator").mkdir()
    agent.write(root / "operator/protocol.json", {
        "schema": VERSION,
        "model": MODEL,
        "diagnosticOnly": True,
        "priorRun": PRIOR_RUN,
        "priorFailureClass": PRIOR_FAILURE_CLASS,
        "sameSemanticChecksAsPriorRun": True,
        "packaging": "SINGLE_CONSOLIDATED_SOURCE_FILE",
        "sourceCommit": SOURCE_COMMIT,
        "checks": [row["code"] for row in base.CHECKS],
        "graderSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "hashes": {p: hashlib.sha256(data).hexdigest() for p, data in files.items()},
        "modelCallsByThisScript": 0,
    })
    agent.write(root / "operator/session.json", {
        "model": MODEL,
        "modelDigest": None,
        "clineVersion": None,
        "ollamaVersion": None,
        "provider": "Ollama",
        "baseUrl": "http://localhost:11434",
        "contextSize": None,
        "cleanSession": None,
        "toolReadWriteObserved": None,
        "onlyLocalModelObserved": None,
        "scopeRespected": None,
        "interventions": None,
        "elapsedSeconds": None,
        "notes": "Compact packaging diagnostic; same semantic audit as consumed prior run. null = non verificato.",
    })
    print(str(root / "desk"))


def grade(root):
    root = root.resolve()
    desk = agent.safe_path(root, "desk")
    expected_files = desk_files()
    protocol = agent.read(agent.safe_path(root, "operator/protocol.json"))
    expected_hashes = {p: hashlib.sha256(data).hexdigest() for p, data in expected_files.items()}
    if (protocol.get("schema") != VERSION
            or protocol.get("diagnosticOnly") is not True
            or protocol.get("priorRun") != PRIOR_RUN
            or protocol.get("graderSha256") != hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
            or protocol.get("hashes") != expected_hashes):
        raise ValueError("Protocollo/grader diagnostico cambiato dopo init")

    integrity_errors = []
    for rel, data in expected_files.items():
        try:
            path = agent.safe_path(desk, rel)
            if path.read_bytes() != data:
                integrity_errors.append("CHANGED:" + rel)
        except (OSError, ValueError):
            integrity_errors.append("MISSING_OR_UNSAFE:" + rel)

    allowed = set(expected_files) | {"audit.json"}
    for path in desk.rglob("*"):
        rel = path.relative_to(desk).as_posix()
        if path.is_symlink() or (hasattr(path, "is_junction") and path.is_junction()):
            integrity_errors.append("LINK:" + rel)
        elif path.is_file() and rel not in allowed:
            integrity_errors.append("UNEXPECTED_FILE:" + rel)

    actual = None
    answer_errors = []
    assessments = []
    try:
        audit_path = agent.safe_path(desk, "audit.json")
        if audit_path.stat().st_size > 16000:
            raise ValueError("audit troppo grande")
        actual = agent.read(audit_path)
        correct, semantic_errors, assessments = base.assess(actual)
        answer_errors.extend(semantic_errors)
    except (OSError, ValueError) as exc:
        correct = False
        answer_errors.append(str(exc))

    session = agent.read(agent.safe_path(root, "operator/session.json"))
    attested = (
        session.get("model") == MODEL
        and session.get("provider") == "Ollama"
        and session.get("baseUrl") in ("http://localhost:11434", "http://127.0.0.1:11434")
        and all(session.get(k) is True for k in (
            "cleanSession", "toolReadWriteObserved", "onlyLocalModelObserved", "scopeRespected"))
        and type(session.get("interventions")) is int
        and session["interventions"] == 0
        and all(type(session.get(k)) is str and bool(session[k].strip())
                for k in ("clineVersion", "ollamaVersion", "modelDigest"))
    )

    result = {
        "schema": VERSION,
        "status": ("FAIL" if integrity_errors or not correct else
                   "PASS_OPERATOR_ATTESTED" if attested else
                   "ARTIFACT_PASS_SESSION_UNVERIFIED"),
        "artifactCorrect": correct,
        "diagnosticOnly": True,
        "priorRun": PRIOR_RUN,
        "priorFailureClass": PRIOR_FAILURE_CLASS,
        "sameSemanticChecksAsPriorRun": True,
        "packaging": "SINGLE_CONSOLIDATED_SOURCE_FILE",
        "sourceCommit": SOURCE_COMMIT,
        "integrityErrors": integrity_errors,
        "answerErrors": answer_errors,
        "actual": actual,
        "assessments": assessments,
        "sessionReported": session,
        "sessionIndependentlyVerified": False,
        "modelCallsByThisScript": 0,
        "humanReviewRequired": True,
        "trainingAuthorized": False,
        "networkProductionReady": False,
        "limits": (
            "Diagnostic repeat of the already-consumed Tsumugi contract audit. "
            "A success can isolate packaging/tool-flow differences but is not a new independent QA result."
        ),
    }
    agent.write(agent.safe_path(root, "operator/evaluation.json"), result)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("init", "grade"))
    parser.add_argument("--root", type=Path, required=True)
    args = parser.parse_args()
    try:
        if args.command == "init":
            init(args.root.resolve())
        else:
            result = grade(args.root.resolve())
            raise SystemExit(1 if result["status"] == "FAIL" else 0)
    except (OSError, ValueError, KeyError) as exc:
        parser.exit(2, f"ERRORE: {exc}\n")


if __name__ == "__main__":
    main()
