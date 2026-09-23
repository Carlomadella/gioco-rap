import contextlib
import io
import tempfile
import unittest
from pathlib import Path
import agent
import qa_gptoss_diagnostic as diag
from test_agent import FakeOllama, response
from test_qa_transfer import golden


class Client(FakeOllama):
    digest = diag.EXPECTED_DIGEST
    values = ['low','medium','high']
    def request(self, endpoint, payload=None):
        if endpoint == '/api/tags':
            return {'models':[{'name':diag.MODEL,'digest':self.digest}]}
        if endpoint == '/api/show':
            return {'thinking':{'values':self.values,'default':'medium'}}
        return super().request(endpoint,payload)


class DiagnosticTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)/'diag'
        self.qa = diag.engine()
        self.qa.init(self.root)

    def execute(self, client):
        with contextlib.redirect_stdout(io.StringIO()):
            return diag.run(self.root,client)

    def test_low_and_same_budget_exact_request_saved(self):
        client = Client([response(golden(self.qa))])
        result = self.execute(client)
        self.assertEqual(result['status'],'VALIDATED_FOR_REVIEW')
        out = next((self.root/'runs').iterdir())
        saved = agent.read(out/'request.json')
        sent = next(p for e,p in client.calls if e == '/api/chat')
        self.assertEqual(saved,sent)
        self.assertEqual(saved['think'],'low')
        self.assertEqual(saved['options']['num_predict'],4096)
        self.assertEqual(result['modelCalls'],1)
        self.assertFalse(result['executionAuthorized'])
        with self.assertRaises(ValueError): self.execute(Client())

    def test_length_is_not_semantic_failure(self):
        r = response({})
        r.update(done_reason='length',eval_count=4096)
        r['message']={'content':'','thinking':'fake reasoning'}
        result = self.execute(Client([r]))
        self.assertEqual(result['status'],'OUTPUT_TRUNCATED')
        self.assertFalse(result['firstAttemptPass'])
        self.assertFalse(list((self.root/'runs').glob('*/answer.json')))

    def test_semantic_failure_is_preserved(self):
        result = self.execute(Client([response({'findings':[]})]))
        self.assertEqual(result['status'],'SEMANTIC_FAIL')

    def test_changed_digest_and_unsupported_control_stop(self):
        client = Client()
        client.digest = 'different'
        self.assertEqual(self.execute(client)['status'],'ERROR')
        self.assertFalse(any(e == '/api/chat' for e,p in client.calls))

    def test_unsupported_low_stops(self):
        client = Client()
        client.values = ['medium','high']
        self.assertEqual(self.execute(client)['status'],'ERROR')
        self.assertFalse(any(e == '/api/chat' for e,p in client.calls))

    def test_tampering_during_call(self):
        client = Client([response(golden(self.qa))],callback=lambda:(self.root/'report.md').write_text('changed'))
        self.assertEqual(self.execute(client)['status'],'ERROR')
        self.assertFalse(list((self.root/'runs').glob('*/answer.json')))


if __name__ == '__main__': unittest.main()
