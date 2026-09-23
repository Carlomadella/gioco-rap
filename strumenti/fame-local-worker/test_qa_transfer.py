import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
import agent
import qa_worker
import qa_transfer
from test_agent import FakeOllama, response


def golden(engine):
    ids = {r['line']:r['evidenceId'] for r in engine.evidence_records(engine.case_text())}
    lines = [ [43],[262],[263],[23],[307],[147],[166,168],[266],[217,235],[245,250] ]
    return {'findings':[{'code':code,'evidenceIds':[ids[n] for n in nums]}
                        for code,nums in zip(engine.RUBRIC,lines)]}


class TransferTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)/'desk'
        self.engine = qa_transfer.build_engine()
        self.engine.init(self.root)

    def execute(self, answer):
        client = FakeOllama([response(answer)])
        with contextlib.redirect_stdout(io.StringIO()):
            result = qa_transfer.run(self.root,'test:local',client)
        return result, next((self.root/'runs').iterdir())

    def test_valid_single_call_and_no_oracle_leak(self):
        result,out = self.execute(golden(self.engine))
        self.assertEqual(result['status'],'PASS')
        request = agent.read(out/'attempt-1-request.json')
        user = json.loads(request['messages'][1]['content'])
        self.assertEqual(set(user),{'report','categories','nextChecks'})
        self.assertNotIn('tools',request)
        self.assertEqual(agent.read(out/'report.json')['modelCalls'],1)
        self.assertEqual(qa_worker.VERSION,'fame-qa-review-v6')
        self.assertFalse(result['executionAuthorized'])
        with self.assertRaises(ValueError):
            qa_transfer.run(self.root,'test:local',FakeOllama())

    def test_missing_and_unsupported_do_not_pass(self):
        answer = golden(self.engine)
        answer['findings'][-1]['code']='BATCH_AUTHORIZED'
        result,out = self.execute(answer)
        self.assertEqual(result['status'],'FAIL')
        self.assertFalse((out/'attempt-2-request.json').exists())

    def test_partial_claim_and_context_drop(self):
        answer = golden(self.engine)
        ids = {r['line']:r['evidenceId'] for r in self.engine.evidence_records(self.engine.case_text())}
        answer['findings'][6]['evidenceIds']=[ids[166]]
        self.assertIn('SINGLE_LABEL_LIMIT_INSUFFICIENT_EVIDENCE',self.engine.validate(answer,self.engine.case_text()))
        answer = golden(self.engine)
        answer['findings'][0]['evidenceIds'].append(ids[1])
        result,out = self.execute(answer)
        self.assertEqual(result['status'],'PASS')
        self.assertEqual(result['droppedEvidenceCount'],1)

    def test_tampering_stops_before_model(self):
        (self.root/'report.md').write_text('changed',encoding='utf-8')
        client = FakeOllama()
        with contextlib.redirect_stdout(io.StringIO()):
            result = qa_transfer.run(self.root,'test:local',client)
        self.assertEqual(result['status'],'FAIL')
        self.assertEqual(client.calls,[])


if __name__ == '__main__':
    unittest.main()
