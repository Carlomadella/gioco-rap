import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import agent


class FakeOllama:
    def __init__(self, replies=None, callback=None, remote=False):
        self.replies = list(replies or [])
        self.calls = []
        self.callback = callback
        self.remote = remote

    def request(self, endpoint, payload=None):
        self.calls.append((endpoint, payload))
        if endpoint == '/api/version':
            return {'version': 'test-only'}
        if endpoint == '/api/tags':
            return {'models': [{'name': 'test:local', 'digest': 'test-digest'}]}
        if endpoint == '/api/show':
            return {'remote_host': 'example.com'} if self.remote else {'template': 'test-template'}
        if self.callback:
            self.callback()
        return self.replies.pop(0)


def response(value):
    return {'done': True, 'message': {'role': 'assistant', 'content': json.dumps(value)}}


class WorkerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)/'desk'
        agent.init(self.root)
        self.target = {'procedure_status': 'APPLIED', 'results': [
            {'id': 'present', 'status': 'READY'}, {'id': 'missing', 'status': 'MISSING'},
            {'id': 'mismatch', 'status': 'HASH_MISMATCH'}, {'id': 'bad-path', 'status': 'INVALID'}]}

    def run_worker(self, client, **kw):
        with contextlib.redirect_stdout(io.StringIO()):
            return agent.run(self.root, 'test:local', client=client, **kw)

    def test_accept_and_exact_request_logged(self):
        client = FakeOllama([response(self.target)])
        result = self.run_worker(client)
        self.assertEqual(result['status'], 'ACCEPTED')
        self.assertTrue(result['firstAttemptPass'])
        run = next((self.root/'runs').iterdir())
        self.assertEqual(agent.read(run/'answer.json'), self.target)
        request = agent.read(run/'attempt-1-request.json')
        self.assertEqual(request['format'], agent.SCHEMA)
        self.assertNotIn('tools', request)
        self.assertEqual(len(request['messages']), 2)

    def test_retry_preserves_first_failure(self):
        client = FakeOllama([response(self.target['results']), response(self.target)])
        result = self.run_worker(client)
        self.assertFalse(result['firstAttemptPass'])
        self.assertTrue(result['acceptedAfterRetry'])
        self.assertEqual(result['modelCalls'], 2)
        run = next((self.root/'runs').iterdir())
        self.assertTrue((run/'attempt-1-validation.json').exists())
        self.assertEqual(len(agent.read(run/'attempt-2-request.json')['messages']), 4)

    def test_wrong_semantics_rejected_even_valid_json(self):
        wrong = json.loads(json.dumps(self.target))
        wrong['results'][0]['status'] = 'MISSING'
        result = self.run_worker(FakeOllama([response(wrong), response(wrong)]))
        self.assertEqual(result['status'], 'REJECTED')
        self.assertEqual(result['modelCalls'], 2)
        self.assertFalse(list((self.root/'runs').glob('*/answer.json')))

    def test_missing_memory_host_does_not_call_model(self):
        (self.root/'memory/procedure.md').unlink()
        client = FakeOllama()
        result = self.run_worker(client)
        self.assertEqual(result['status'], 'NEED_RULE')
        self.assertEqual(client.calls, [])
        self.assertIsNone(result['firstAttemptPass'])
        self.assertFalse(result['modelLearningMeasured'])

    def test_changed_procedure_rejected(self):
        (self.root/'memory/procedure.md').write_text('invented')
        client = FakeOllama()
        self.assertEqual(self.run_worker(client)['status'], 'ERROR')
        self.assertEqual(client.calls, [])

    def test_paths_and_symlink(self):
        for path in ('../secret', '/etc/passwd', 'C:/secret', 'assets/../../secret', 'assets\\secret'):
            with self.assertRaises(ValueError):
                agent.safe_path(self.root, path)
        outside = Path(self.tmp.name)/'secret'
        outside.write_text('secret')
        try:
            (self.root/'assets/link').symlink_to(outside)
        except OSError:
            self.skipTest('Symlink unavailable')
        rows = [{'id':'link', 'path':'assets/link', 'expectedSha256':'0'*64}]
        self.assertEqual(agent.observe(self.root, rows)[0]['pathStatus'], 'INVALID')

    def test_input_changes_during_run_rejected(self):
        def mutate():
            (self.root/'assets/example.txt').write_text('changed')
        result = self.run_worker(FakeOllama([response(self.target)], callback=mutate))
        self.assertEqual(result['status'], 'ERROR')
        self.assertFalse(list((self.root/'runs').glob('*/answer.json')))

    def test_remote_model_and_missing_model_rejected(self):
        result = self.run_worker(FakeOllama(remote=True))
        self.assertEqual(result['status'], 'ERROR')
        with self.assertRaises(ValueError):
            agent.preflight(FakeOllama(), 'other:local')
        with self.assertRaises(ValueError):
            agent.preflight(FakeOllama(), 'model:cloud')

    def test_unavailable_server_records_error(self):
        class Broken:
            def request(self, *args):
                raise OSError('offline test')
        result = self.run_worker(Broken())
        self.assertEqual(result['status'], 'ERROR')
        self.assertFalse((self.root/'worker.lock').exists())

    def test_lock_and_init_refuse_overwrite(self):
        with self.assertRaises(FileExistsError):
            agent.init(self.root)
        (self.root/'worker.lock').write_text('busy')
        with self.assertRaises(FileExistsError):
            self.run_worker(FakeOllama())
        self.assertEqual((self.root/'worker.lock').read_text(), 'busy')

    def test_invalid_duplicate_json_tool_calls_and_truncation(self):
        for text in ('{"x":1,"x":2}', '{"x":NaN}'):
            with self.assertRaises(ValueError):
                agent.parse(text)
        for resp in ({'done':False, 'message':{'content':json.dumps(self.target)}},
                     {'done':True, 'message':{'content':json.dumps(self.target), 'tool_calls':[{'function':{'name':'run'}}]}},
                     {'done':True, 'done_reason':'length', 'message':{'content':json.dumps(self.target)}}):
            self.assertEqual(self.run_worker(FakeOllama([resp]), attempts=1)['status'], 'REJECTED')

    def test_host_observer_and_validation_edges(self):
        rows = [{'id':'bad-hash', 'path':'assets/absent.txt', 'expectedSha256':True}]
        self.assertEqual(agent.expected(agent.observe(self.root, rows))['results'][0]['status'], 'INVALID')
        with self.assertRaises(ValueError):
            agent.observe(self.root, rows + rows)
        self.assertTrue(agent.validate({'procedure_status':'APPLIED','results':[]}, self.target))

    def test_http_transport_loopback_and_no_redirect(self):
        class Reply:
            def __enter__(self): return self
            def __exit__(self, *a): pass
            def read(self, n): return b'{"version":"fake"}'
        client = agent.Ollama()
        with patch.object(client.opener, 'open', return_value=Reply()) as opened:
            self.assertEqual(client.request('/api/version'), {'version':'fake'})
            self.assertEqual(opened.call_args.args[0].full_url, 'http://127.0.0.1:11434/api/version')
        with self.assertRaises(ValueError):
            client.request('/api/pull')
        with self.assertRaises(ValueError):
            agent.NoRedirect().redirect_request(None, None, None, None, None, None)


if __name__ == '__main__':
    unittest.main()
