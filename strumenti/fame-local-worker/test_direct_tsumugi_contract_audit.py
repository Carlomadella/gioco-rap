import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import direct_tsumugi_contract_audit as audit


class FakeOllama:
    def __init__(self, reply=None, callback=None, remote=False):
        self.reply = reply
        self.callback = callback
        self.remote = remote
        self.calls = []

    def request(self, endpoint, payload=None):
        self.calls.append((endpoint, payload))
        if endpoint == "/api/version":
            return {"version": "test"}
        if endpoint == "/api/tags":
            return {"models": [{"name": "gpt-oss:20b", "digest": "digest"}]}
        if endpoint == "/api/show":
            return {"remote_host": "remote.example"} if self.remote else {"template": "test"}
        if self.callback:
            self.callback()
        return self.reply


def response(value, **extra):
    result = {"done": True, "message": {"role": "assistant", "content": json.dumps(value)}}
    result.update(extra)
    return result


def correct_answer():
    return {"results": [
        {"code": "NOTE_BIAS_RUNTIME_BINDING", "status": "ENFORCED"},
        {"code": "PAIR_GATE_THRESHOLD_RUNTIME_BINDING", "status": "NOT_ENFORCED"},
        {"code": "PAIR_TOPK_RUNTIME_BINDING", "status": "NOT_ENFORCED"},
        {"code": "FIXTURE_SET_RUNTIME_BINDING", "status": "NOT_ENFORCED"},
    ]}


class DirectTsumugiContractAuditTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "desk"
        with contextlib.redirect_stdout(io.StringIO()):
            audit.init(self.root)

    def run_audit(self, client):
        with contextlib.redirect_stdout(io.StringIO()):
            return audit.run(self.root, client=client)

    def test_init_uses_single_consolidated_source(self):
        self.assertTrue((self.root / "source-audit.md").is_file())
        self.assertFalse((self.root / "source").exists())
        text = (self.root / "source-audit.md").read_text(encoding="utf-8")
        for name in audit.frozen.FILES:
            self.assertEqual(text.count(f"===== BEGIN FILE: {name} ====="), 1)

    def test_direct_request_has_no_tools(self):
        client = FakeOllama(response(correct_answer()))
        result = self.run_audit(client)
        self.assertEqual(result["status"], "PASS")
        chats = [payload for endpoint, payload in client.calls if endpoint == "/api/chat"]
        self.assertEqual(len(chats), 1)
        self.assertNotIn("tools", chats[0])
        self.assertEqual(chats[0]["format"], audit.SCHEMA)
        self.assertEqual(chats[0]["options"]["num_ctx"], 32768)

    def test_correct_answer_passes(self):
        result = self.run_audit(FakeOllama(response(correct_answer())))
        self.assertTrue(result["artifactCorrect"])
        self.assertEqual(result["modelCalls"], 1)
        self.assertEqual(len(result["assessments"]), 4)

    def test_wrong_threshold_and_topk_are_rejected(self):
        wrong = correct_answer()
        wrong["results"][1]["status"] = "ENFORCED"
        wrong["results"][2]["status"] = "ENFORCED"
        result = self.run_audit(FakeOllama(response(wrong)))
        self.assertEqual(result["status"], "REJECTED")
        self.assertEqual(result["answerErrors"], ["RECORD_1_INCORRECT", "RECORD_2_INCORRECT"])

    def test_invalid_json_is_rejected_without_retry(self):
        client = FakeOllama({"done": True, "message": {"role": "assistant", "content": "{bad"}})
        result = self.run_audit(client)
        self.assertEqual(result["status"], "REJECTED")
        self.assertEqual(result["modelCalls"], 1)
        self.assertEqual(sum(1 for endpoint, _ in client.calls if endpoint == "/api/chat"), 1)

    def test_tool_call_is_rejected(self):
        reply = response(correct_answer())
        reply["message"]["tool_calls"] = [{"function": {"name": "shell"}}]
        result = self.run_audit(FakeOllama(reply))
        self.assertEqual(result["status"], "REJECTED")
        self.assertIn("Unexpected tool call", result["answerErrors"][0])

    def test_input_mutation_during_model_call_is_error(self):
        def mutate():
            (self.root / "source-audit.md").write_text("changed", encoding="utf-8")
        result = self.run_audit(FakeOllama(response(correct_answer()), callback=mutate))
        self.assertEqual(result["status"], "ERROR")

    def test_remote_model_is_rejected_before_chat(self):
        client = FakeOllama(response(correct_answer()), remote=True)
        result = self.run_audit(client)
        self.assertEqual(result["status"], "ERROR")
        self.assertFalse(any(endpoint == "/api/chat" for endpoint, _ in client.calls))

    def test_init_refuses_overwrite(self):
        with self.assertRaises(FileExistsError):
            audit.init(self.root)

    def test_run_lock_refuses_parallel_worker(self):
        (self.root / "worker.lock").write_text("busy", encoding="utf-8")
        with self.assertRaises(FileExistsError):
            self.run_audit(FakeOllama(response(correct_answer())))


if __name__ == "__main__":
    unittest.main()
