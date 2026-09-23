"""Direct Ollama diagnostic for the frozen Tsumugi runtime-contract audit.

This bypasses Cline completely: the host snapshots the frozen source, sends one
structured request to local Ollama, exposes no tools, then validates the answer
against the already-frozen audit rubric. It is a runtime-isolation diagnostic,
not a new independent evaluation.
"""
import argparse
import hashlib
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import agent
import cline_gptoss_tsumugi_contract_audit as frozen

VERSION = "fame-direct-tsumugi-contract-audit-v1"
MODEL_DEFAULT = "gpt-oss:20b"
NUM_CTX = 32768
NUM_PREDICT = 2048
SEED = 42
TEMPERATURE = 0

SYSTEM = """Sei un revisore statico locale di codice/configurazione FAME Neural.
Ricevi un task congelato e uno snapshot sorgente gia preparato dall'host.
Non hai strumenti: non chiamare shell, filesystem, browser, rete o tool.
Valuta soltanto il contenuto fornito.
Per ENFORCED serve un controllo runtime che blocchi una divergenza tra il
diagnostic protocol e il valore effettivamente usato prima dell'operazione
specificata. La mera presenza del valore nel JSON, la propagazione da un altro
protocollo o un test statico non costituiscono binding runtime.
Restituisci esclusivamente il JSON richiesto dallo schema.
"""

PROCEDURE = """Per ciascun check in TASK.json, nello stesso ordine:
- status=ENFORCED se il codice runtime verifica esplicitamente il vincolo contro
  il diagnostic protocol prima del model forward / audio access pertinente;
- status=NOT_ENFORCED altrimenti.
Non inferire un binding solo perche i valori correnti coincidono.
Non aggiungere spiegazioni, citazioni o chiavi extra.
"""

SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["results"],
    "properties": {
        "results": {
            "type": "array",
            "minItems": len(frozen.CHECKS),
            "maxItems": len(frozen.CHECKS),
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["code", "status"],
                "properties": {
                    "code": {"type": "string", "enum": [row["code"] for row in frozen.CHECKS]},
                    "status": {"type": "string", "enum": ["ENFORCED", "NOT_ENFORCED"]},
                },
            },
        }
    },
}


def encoded(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + "\n"


def source_snapshot():
    chunks = []
    for name, path in frozen.FILES.items():
        text = path.read_text(encoding="utf-8-sig")
        chunks.append(
            f"===== BEGIN FILE: {name} =====\n"
            + text.rstrip("\n")
            + f"\n===== END FILE: {name} ====="
        )
    return "\n\n".join(chunks) + "\n"


def desk_files():
    return {
        "TASK.json": encoded({"checks": frozen.CHECKS}).encode("utf-8"),
        "memory/procedure.md": PROCEDURE.encode("utf-8"),
        "source-audit.md": source_snapshot().encode("utf-8"),
    }


def init(root):
    root.mkdir(parents=True, exist_ok=False)
    (root / "memory").mkdir()
    (root / "runs").mkdir()
    files = desk_files()
    for rel, data in files.items():
        path = root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    agent.write(root / "desk.json", {
        "schema": VERSION,
        "diagnosticOnly": True,
        "transport": "DIRECT_OLLAMA_NO_TOOLS",
        "sourceCommit": frozen.SOURCE_COMMIT,
        "sameSemanticChecksAsClineRun": True,
        "checks": [row["code"] for row in frozen.CHECKS],
        "hashes": {rel: hashlib.sha256(data).hexdigest() for rel, data in files.items()},
    })
    print(str(root))


def verify_frozen(root):
    meta = agent.read(agent.safe_path(root, "desk.json"))
    files = desk_files()
    expected = {
        "schema": VERSION,
        "diagnosticOnly": True,
        "transport": "DIRECT_OLLAMA_NO_TOOLS",
        "sourceCommit": frozen.SOURCE_COMMIT,
        "sameSemanticChecksAsClineRun": True,
        "checks": [row["code"] for row in frozen.CHECKS],
        "hashes": {rel: hashlib.sha256(data).hexdigest() for rel, data in files.items()},
    }
    if meta != expected:
        raise ValueError("Desk metadata changed")
    for rel, data in files.items():
        if agent.safe_path(root, rel).read_bytes() != data:
            raise ValueError("Frozen input changed: " + rel)
    return meta, files


def build_messages(root):
    task = agent.read(agent.safe_path(root, "TASK.json"))
    procedure = agent.safe_path(root, "memory/procedure.md").read_text(encoding="utf-8")
    source = agent.safe_path(root, "source-audit.md").read_text(encoding="utf-8")
    return [
        {"role": "system", "content": SYSTEM + "\n\n" + procedure},
        {"role": "user", "content": json.dumps(
            {"task": task, "sourceAudit": source},
            ensure_ascii=False,
        )},
    ]


def run(root, model=MODEL_DEFAULT, client=None):
    root = root.resolve()
    meta, frozen_files = verify_frozen(root)
    runs = agent.safe_path(root, "runs")
    lock = agent.safe_path(root, "worker.lock")
    with lock.open("x", encoding="utf-8") as handle:
        handle.write("Direct Tsumugi contract audit active\n")

    out = runs / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    try:
        out.mkdir()
        report = {
            "schema": VERSION,
            "status": "STARTED",
            "model": model,
            "transport": "DIRECT_OLLAMA_NO_TOOLS",
            "modelCalls": 0,
            "diagnosticOnly": True,
            "sameSemanticChecksAsClineRun": True,
            "sourceCommit": frozen.SOURCE_COMMIT,
            "humanReviewRequired": True,
            "trainingAuthorized": False,
            "networkProductionReady": False,
        }
        try:
            client = client or agent.Ollama()
            preflight = agent.preflight(client, model)
            agent.write(out / "preflight.json", preflight)
            messages = build_messages(root)
            request = {
                "model": model,
                "messages": messages,
                "stream": False,
                "format": SCHEMA,
                "options": {
                    "num_ctx": NUM_CTX,
                    "num_predict": NUM_PREDICT,
                    "temperature": TEMPERATURE,
                    "seed": SEED,
                },
            }
            agent.write(out / "request.json", request)

            report["modelCalls"] = 1
            print("Audit diretto: attesa Ollama...", flush=True)
            started = time.monotonic()
            response = client.request("/api/chat", request)
            elapsed = time.monotonic() - started
            agent.write(out / "response.json", response)

            answer = None
            errors = []
            assessments = []
            try:
                message = response.get("message", {})
                if response.get("done") is not True or response.get("done_reason") == "length":
                    raise ValueError("Incomplete response")
                if not isinstance(message, dict) or message.get("tool_calls"):
                    raise ValueError("Unexpected tool call")
                answer = agent.parse(message["content"])
                correct, errors, assessments = frozen.assess(answer)
            except (ValueError, KeyError, TypeError) as exc:
                correct = False
                errors = ["INVALID_RESPONSE:" + str(exc)]

            agent.write(out / "validation.json", {
                "artifactCorrect": correct,
                "errors": errors,
                "assessments": assessments,
                "elapsedSeconds": elapsed,
            })

            # Inputs are immutable for this run: verify again after model response.
            current_meta, current_files = verify_frozen(root)
            if current_meta != meta or current_files != frozen_files:
                raise ValueError("Frozen inputs changed during run")

            if answer is not None:
                agent.write(out / "candidate.json", answer)
            report.update(
                status="PASS" if correct else "REJECTED",
                artifactCorrect=correct,
                answerErrors=errors,
                assessments=assessments,
                elapsedSeconds=elapsed,
            )
        except Exception as exc:
            report.update(status="ERROR", error=f"{type(exc).__name__}: {exc}")
        agent.write(out / "report.json", report)
        print(json.dumps({
            "status": report["status"],
            "artifactCorrect": report.get("artifactCorrect"),
            "modelCalls": report["modelCalls"],
            "report": str(out / "report.json"),
        }, ensure_ascii=False))
        return report
    finally:
        lock.unlink()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("init", "run"))
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--model", default=MODEL_DEFAULT)
    args = parser.parse_args()
    try:
        if args.command == "init":
            init(args.root.resolve())
        else:
            result = run(args.root.resolve(), args.model)
            raise SystemExit(0 if result["status"] == "PASS" else 1)
    except (OSError, ValueError) as exc:
        parser.exit(2, f"ERRORE: {exc}\n")


if __name__ == "__main__":
    main()
