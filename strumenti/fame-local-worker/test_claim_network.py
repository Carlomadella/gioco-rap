import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
import claim_network as w

SUITE=Path(__file__).with_name('claim_network_cases.json')
class Fake:
    def __init__(self, mode=None): self.mode=mode; self.calls=[]
    def request(self, endpoint, payload=None):
        if endpoint=='/api/version': return {'version':'simulated'}
        if endpoint=='/api/tags': return {'models':[{'name':w.MODEL,'digest':'wrong' if self.mode=='digest' else w.DIGEST}]}
        if endpoint=='/api/show': return {}
        self.calls.append(payload)
        if self.mode=='timeout': raise TimeoutError('simulated')
        data=json.loads(payload['messages'][1]['content'])
        suite=w.load_suite(SUITE)
        targets={c['id']:c for c in suite['cases']}
        if isinstance(data,list):
            answer={'results':[{'id':c['id'],'supported':False,'evidenceIds':[]} for c in data]}
        elif 'verdict' in payload['format']['properties']:
            t=targets[data['id']]['expected']
            answer={'verdict':t['verdict'],'evidenceIds':[g[0] for g in t['requiredGroups']]}
            if self.mode=='bad': answer['verdict']='SUPPORTED';answer['evidenceIds']=[data['units'][0]['id']]
        else: answer={'evidenceIds':[]}
        return {'done':True,'done_reason':'stop','message':{'content':json.dumps(answer)}}

class Tests(unittest.TestCase):
    def run_fake(self,mode=None):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)/'run'; f=Fake(mode)
            with contextlib.redirect_stdout(io.StringIO()): result=w.execute(root,SUITE,f)
            self.assertTrue((root/'report.json').exists())
            self.assertTrue((root/'receipt.json').exists())
            with self.assertRaises(FileExistsError): w.execute(root,SUITE,f)
            return result,f
    def test_full_cycle_and_no_oracle(self):
        r,f=self.run_fake(); self.assertEqual(r['calls'],13);self.assertEqual(r['stagedAccepted'],6)
        for req in f.calls:
            self.assertNotIn('expected',json.dumps(req));self.assertNotIn('requiredGroups',json.dumps(req))
            self.assertNotIn('tools',req)
    def test_wrong_answers_not_accepted(self):
        r,_=self.run_fake('bad');self.assertFalse(r['stagedAllPass'])
    def test_bad_digest_no_call(self):
        r,f=self.run_fake('digest');self.assertEqual(r['status'],'ERROR');self.assertEqual(len(f.calls),0)
    def test_timeout_stops_without_retry(self):
        r,f=self.run_fake('timeout');self.assertEqual(r['status'],'ERROR');self.assertEqual(len(f.calls),1)
    def test_unknown_requires_empty(self):
        with self.assertRaises(ValueError):w.check_answer({'verdict':'UNKNOWN','evidenceIds':['X']},[{'id':'X'}])
    def test_bad_id(self):
        with self.assertRaises(ValueError):w.check_answer({'verdict':'SUPPORTED','evidenceIds':['Y']},[{'id':'X'}])
    def test_contradiction_requires_evidence(self):
        with self.assertRaises(ValueError):w.check_answer({'verdict':'CONTRADICTED','evidenceIds':[]},[{'id':'X'}])
    def test_citations_not_sufficient_for_truth(self):
        suite=w.load_suite(SUITE);c=suite['cases'][0]
        r=w.score({'verdict':'SUPPORTED','evidenceIds':['EX1']},c,suite['documents']['export'])
        self.assertFalse(r['accepted'])
    def test_judge_keeps_full_context(self):
        _,f=self.run_fake()
        for req in f.calls:
            d=json.loads(req['messages'][1]['content'])
            if isinstance(d,dict) and 'suggestedEvidenceIds' in d:
                self.assertEqual(d['suggestedEvidenceIds'],[]); self.assertEqual(len(d['units']),2)

if __name__=='__main__': unittest.main()
