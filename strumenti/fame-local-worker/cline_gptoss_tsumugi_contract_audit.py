"""Cline audit of frozen Tsumugi score-diagnostic contract enforcement."""
import argparse
import hashlib
import json
from pathlib import Path

import agent

VERSION = "fame-cline-gptoss-tsumugi-contract-audit-v1"
MODEL = "gpt-oss:20b"
SOURCE_COMMIT = "1e555d6c52b16f3b14ccdaf75574edb196a6c900"
HERE = Path(__file__).resolve().parent
CASE_DIR = HERE / "cases" / "cline-tsumugi-contract-audit"

FILES = {
    "diagnostic-protocol.json": CASE_DIR / "diagnostic-protocol.json",
    "controlled-protocol.json": CASE_DIR / "controlled-protocol.json",
    "score-diagnostic.py": CASE_DIR / "score-diagnostic.py",
    "static-test.py": CASE_DIR / "static-test.py",
}

CHECKS = [
    {
        "code": "NOTE_BIAS_RUNTIME_BINDING",
        "question": (
            "Prima del model forward, il runtime verifica che il noteBias risolto "
            "coincida con il valore congelato nel diagnostic protocol?"
        ),
    },
    {
        "code": "PAIR_GATE_THRESHOLD_RUNTIME_BINDING",
        "question": (
            "Prima del model forward, il runtime verifica che instrumentPairGateThreshold "
            "risolto coincida con il valore congelato nel diagnostic protocol?"
        ),
    },
    {
        "code": "PAIR_TOPK_RUNTIME_BINDING",
        "question": (
            "Prima del model forward, il runtime verifica che instrumentPairInferTopk "
            "risolto coincida esattamente con il valore congelato nel diagnostic protocol?"
        ),
    },
    {
        "code": "FIXTURE_SET_RUNTIME_BINDING",
        "question": (
            "Prima di aprire fixture audio, il runtime verifica che la lista fixtures del "
            "diagnostic protocol coincida esattamente con quella del controlled protocol?"
        ),
    },
]

EXPECTED = {
    "NOTE_BIAS_RUNTIME_BINDING": "ENFORCED",
    "PAIR_GATE_THRESHOLD_RUNTIME_BINDING": "NOT_ENFORCED",
    "PAIR_TOPK_RUNTIME_BINDING": "NOT_ENFORCED",
    "FIXTURE_SET_RUNTIME_BINDING": "NOT_ENFORCED",
}

TASK = """# FAME Neural — audit reale contract enforcement Tsumugi
Leggi TASK.json, memory/procedure.md e i quattro file sotto source/.
Non eseguire codice o comandi.
Per ogni check determina se il vincolo del diagnostic protocol viene verificato a runtime
contro il valore effettivamente usato prima del model forward / audio access pertinente.
Non basta che un valore sia scritto nel JSON o controllato da un test statico:
ENFORCED richiede un controllo runtime che blocchi una divergenza.
Salva soltanto audit.json nel formato richiesto.
"""

RULE = """# Scope
Lavora solo in questa desk.
Puoi leggere TASK.md, TASK.json, memory/procedure.md e source/*.
Puoi scrivere soltanto audit.json.
Non usare terminale, browser, rete, MCP, altre cartelle, cronologia o workspace.
Non modificare i file source.
"""

PROCEDURE = """Restituisci:
{"results":[{"code":"...","status":"ENFORCED oppure NOT_ENFORCED"}]}
Mantieni esattamente l'ordine di TASK.json e nessuna chiave aggiuntiva.
Valuta il codice realmente presente, distinguendo test statici da enforcement runtime.
Un valore coincidente oggi non equivale a un binding: chiediti se una divergenza futura
tra diagnostic protocol e controlled/runtime verrebbe bloccata prima dell'operazione.
"""


def encoded(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + "\n"


def source_bytes():
    out = {}
    for name, path in FILES.items():
        out[name] = path.read_bytes()
    return out


def desk_files():
    src = source_bytes()
    files = {
        "TASK.md": TASK.encode("utf-8"),
        "TASK.json": encoded({"checks": CHECKS}).encode("utf-8"),
        ".clinerules/01-scope.md": RULE.encode("utf-8"),
        "memory/procedure.md": PROCEDURE.encode("utf-8"),
    }
    for name, data in src.items():
        files[f"source/{name}"] = data
    return files


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
        "sourceCommit": SOURCE_COMMIT,
        "checks": [row["code"] for row in CHECKS],
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
        "notes": "Real code/config audit; null = non verificato.",
    })
    print(str(root / "desk"))


def assess(value):
    errors = []
    assessments = []
    if type(value) is not dict or set(value) != {"results"} or type(value["results"]) is not list:
        return False, ["ANSWER_CONTRACT"], assessments
    if len(value["results"]) != len(CHECKS):
        return False, ["ANSWER_CONTRACT"], assessments

    for index, (check, item) in enumerate(zip(CHECKS, value["results"])):
        prefix = f"RECORD_{index}_"
        if (type(item) is not dict or set(item) != {"code", "status"}
                or item.get("code") != check["code"]
                or item.get("status") not in {"ENFORCED", "NOT_ENFORCED"}):
            errors.append(prefix + "CONTRACT")
            continue
        expected = EXPECTED[check["code"]]
        correct = item["status"] == expected
        assessments.append({
            "code": check["code"],
            "status": item["status"],
            "expected": expected,
            "correct": correct,
        })
        if not correct:
            errors.append(prefix + "INCORRECT")
    return not errors, errors, assessments


def grade(root):
    root = root.resolve()
    desk = agent.safe_path(root, "desk")
    expected_files = desk_files()
    protocol = agent.read(agent.safe_path(root, "operator/protocol.json"))
    if protocol.get("schema") != VERSION:
        raise ValueError("Protocol schema changed")
    if protocol.get("graderSha256") != hashlib.sha256(Path(__file__).read_bytes()).hexdigest():
        raise ValueError("Grader changed after init")
    expected_hashes = {p: hashlib.sha256(data).hexdigest() for p, data in expected_files.items()}
    if protocol.get("hashes") != expected_hashes:
        raise ValueError("Frozen desk hashes changed after init")

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
        correct, semantic_errors, assessments = assess(actual)
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
            "Static read-only audit of frozen repository snapshots. A pass shows correct "
            "classification of these four enforcement checks, not general coding reliability."
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
