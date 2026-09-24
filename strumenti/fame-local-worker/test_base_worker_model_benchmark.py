import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import base_worker_model_benchmark as w


class Fake:
    def __init__(self,mode=None):
        self.mode=mode
        self.chat_calls=[]
        self.digests={
            'gpt-oss:20b':'gpt-digest',
            'mistral-small3.2:24b':'mistral-digest',
        }

    def request(self,endpoint,payload=None):
        if endpoint=='/api/version':
            return {'version':'simulated'}
        if endpoint=='/api/tags':
            return {'models':[
                {'name':m,'model':m,'digest':d} for m,d in self.digests.items()
            ]}
        if endpoint=='/api/show':
            return {'model':payload['model']}
        if endpoint!='/api/chat':
            raise AssertionError(endpoint)

        self.chat_calls.append(payload)
        data=json.loads(payload['messages'][1]['content'])
        suite=w.load_suite()
        doc=next(d for d in suite['documents'] if d['key']==data['key'])
        model=payload['model']
        rows=[]
        for case in doc['cases']:
            target=case['expected']
            verdict=target['verdict']
            evidence=[g[0] for g in target['requiredGroups']]
            if self.mode=='mistral_better' and model=='gpt-oss:20b' and case['id']=='R03':
                verdict='SUPPORTED';evidence=['U14']
            if self.mode=='gpt_better' and model=='mistral-small3.2:24b' and case['id']=='P03':
                verdict='SUPPORTED';evidence=['U10']
            if self.mode=='timeout_one' and model=='mistral-small3.2:24b' and data['key']=='recovery':
                raise TimeoutError('simulated')
            rows.append(dict(id=case['id'],verdict=verdict,evidenceIds=evidence))
        return {'done':True,'done_reason':'stop','message':{'content':json.dumps({'results':rows})}}


class BaseWorkerModelBenchmarkTests(unittest.TestCase):
    def test_suite_is_three_real_docs_and_fifteen_claims(self):
        suite=w.load_suite()
        self.assertEqual(len(suite['documents']),3)
        self.assertEqual(sum(len(d['cases']) for d in suite['documents']),15)
        for doc in suite['documents']:
            self.assertEqual(len(doc['cases']),5)
            self.assertTrue(doc['units'])

    def test_recovery_targets_point_to_actual_support(self):
        suite=w.load_suite()
        d=next(x for x in suite['documents'] if x['key']=='recovery')
        expected={c['id']:c['expected']['requiredGroups'] for c in d['cases']}
        self.assertEqual(expected['R01'],[['U19']])
        self.assertEqual(expected['R02'],[['U15']])
        self.assertEqual(expected['R03'],[['U14']])
        self.assertEqual(expected['R04'],[['U20']])

    def test_init_freezes_both_model_digests_without_chat(self):
        with tempfile.TemporaryDirectory() as tmp,contextlib.redirect_stdout(io.StringIO()):
            root=Path(tmp)/'run';f=Fake()
            w.init(root,f)
            self.assertEqual(f.chat_calls,[])
            p=json.loads((root/'protocol.json').read_text(encoding='utf-8'))
            self.assertEqual(p['digests'],f.digests)
            self.assertEqual(p['maximumModelCalls'],6)
            self.assertEqual(p['options']['num_ctx'],8192)

    def run_fake(self,mode=None):
        td=tempfile.TemporaryDirectory();self.addCleanup(td.cleanup)
        root=Path(td.name)/'run';f=Fake(mode)
        with contextlib.redirect_stdout(io.StringIO()):
            w.init(root,f)
            result=w.run(root,f)
        return result,f,root

    def test_all_pass_is_tie_with_six_calls(self):
        result,f,_=self.run_fake()
        self.assertEqual(len(f.chat_calls),6)
        self.assertEqual(result['models']['gpt-oss:20b']['accepted'],15)
        self.assertEqual(result['models']['mistral-small3.2:24b']['accepted'],15)
        self.assertEqual(result['comparison'],'TIE_ON_ACCEPTED')

    def test_mistral_can_win_under_identical_scoring(self):
        result,_,_=self.run_fake('mistral_better')
        self.assertEqual(result['models']['gpt-oss:20b']['accepted'],14)
        self.assertEqual(result['models']['mistral-small3.2:24b']['accepted'],15)
        self.assertEqual(result['comparison'],'MISTRAL_BETTER')

    def test_gpt_can_win_under_identical_scoring(self):
        result,_,_=self.run_fake('gpt_better')
        self.assertEqual(result['models']['gpt-oss:20b']['accepted'],15)
        self.assertEqual(result['models']['mistral-small3.2:24b']['accepted'],14)
        self.assertEqual(result['comparison'],'GPT_OSS_BETTER')

    def test_targets_never_appear_in_model_requests(self):
        _,f,_=self.run_fake()
        for req in f.chat_calls:
            raw=json.dumps(req,ensure_ascii=False)
            self.assertNotIn('"expected"',raw)
            self.assertNotIn('requiredGroups',raw)
            self.assertNotIn('sourceBlob',raw)

    def test_both_models_use_same_system_options_and_ternary_labels(self):
        _,f,_=self.run_fake()
        self.assertEqual(len(f.chat_calls),6)
        for req in f.chat_calls:
            self.assertEqual(req['messages'][0]['content'],w.SYSTEM)
            self.assertEqual(req['options'],w.OPTIONS)
            labels=req['format']['properties']['results']['items']['properties']['verdict']['enum']
            self.assertEqual(labels,list(w.LABELS))

    def test_unknown_must_have_no_evidence(self):
        suite=w.load_suite()
        doc=next(d for d in suite['documents'] if d['key']=='recovery')
        case=next(c for c in doc['cases'] if c['id']=='R05')
        with self.assertRaises(ValueError):
            w.validate_row({'id':'R05','verdict':'UNKNOWN','evidenceIds':['U20']},case,doc['units'])

    def test_contradiction_requires_evidence(self):
        suite=w.load_suite()
        doc=next(d for d in suite['documents'] if d['key']=='recovery')
        case=next(c for c in doc['cases'] if c['id']=='R03')
        with self.assertRaises(ValueError):
            w.validate_row({'id':'R03','verdict':'CONTRADICTED','evidenceIds':[]},case,doc['units'])

    def test_one_transport_error_is_recorded_without_retry(self):
        result,f,_=self.run_fake('timeout_one')
        self.assertEqual(len(f.chat_calls),6)
        m=result['models']['mistral-small3.2:24b']
        self.assertEqual(m['calls'],3)
        self.assertEqual(m['errors'],1)
        self.assertEqual(m['accepted'],10)

    def test_consumed_root_cannot_run_again(self):
        result,f,root=self.run_fake()
        self.assertEqual(result['status'],'COMPLETE_FOR_REVIEW')
        with self.assertRaises(FileExistsError):
            w.run(root,f)

    def test_digest_change_after_init_blocks_run(self):
        with tempfile.TemporaryDirectory() as tmp,contextlib.redirect_stdout(io.StringIO()):
            root=Path(tmp)/'run';f=Fake();w.init(root,f)
            f.digests['mistral-small3.2:24b']='changed'
            with self.assertRaises(ValueError):
                w.run(root,f)


if __name__=='__main__':
    unittest.main()
