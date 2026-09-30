import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import fame_four_role_network_v1 as n


class Fake:
    def __init__(self,replies=None,mode=None):
        self.replies=list(replies or [])
        self.mode=mode
        self.calls=[]
    def request(self,endpoint,payload=None):
        if endpoint=='/api/version':
            return {'version':'test'}
        if endpoint=='/api/tags':
            return {'models':[{'name':n.MODEL,'digest':'wrong' if self.mode=='digest' else n.DIGEST}]}
        if endpoint=='/api/show':
            return {}
        self.calls.append(payload)
        if self.mode=='timeout':
            raise TimeoutError('test')
        answer=self.replies.pop(0)
        return {
            'done':True,
            'done_reason':'stop',
            'message':{'content':json.dumps(answer,ensure_ascii=False)},
            'total_duration':100,
            'load_duration':20,
            'prompt_eval_count':10,
            'eval_count':5,
        }


class FameFourRoleNetworkTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'network'
        with contextlib.redirect_stdout(io.StringIO()):
            n.init(self.root,'source-registry-readiness-network-v1')

    def extractor(self):
        return {
            'provisionalVerdict':'CONDITIONS_REQUIRED',
            'claims':[
                {'claimId':'C1','statement':'Green consente il training commerciale solo dopo adapter/filter e provenance.','evidenceIds':['U02']},
                {'claimId':'C2','statement':'La compatibilità simbolica currentSymbolic è separata dal colore green.','evidenceIds':['U02']},
                {'claimId':'C3','statement':'Green richiede verifica, evidenze e diritti commerciali definiti.','evidenceIds':['U03']},
                {'claimId':'C4','statement':'Il processo nuova source richiede ancora adapter, preflight, provenance, curation e gate.','evidenceIds':['U05']},
            ],
        }

    def challenge(self,blocking=False):
        return {
            'applicability':[
                {'controlId':'FAME-AB-01','status':'APPLICABLE','reason':'tesi esplicita da sfidare'},
                {'controlId':'FAME-AB-02','status':'APPLICABLE','reason':'controllo selezione evidenze'},
                {'controlId':'FAME-AB-03','status':'NOT_APPLICABLE_WITH_REASON','reason':'un solo documento sorgente'},
                {'controlId':'FAME-AB-04','status':'APPLICABLE','reason':'distinguere rights da readiness simbolica'},
                {'controlId':'FAME-AB-05','status':'APPLICABLE','reason':'scope del claim'},
                {'controlId':'FAME-AB-06','status':'APPLICABLE','reason':'servono condizioni e limiti'},
            ],
            'issues':[{
                'issueId':'AB1',
                'controlId':'FAME-AB-06',
                'claimIds':['C1'],
                'severity':'BLOCKING' if blocking else 'NONBLOCKING',
                'problem':'Non confondere green con readiness simbolica completa.',
                'evidenceIds':['U02'],
                'requiredAction':'Mantenere distinta currentSymbolic e i passaggi successivi.',
            }],
            'overall':'ANTI_BIAS_REWORK_REQUIRED' if blocking else 'ANTI_BIAS_CHALLENGE_PASS_WITH_LIMITATIONS',
            'residualBiasUncertaintyExplicit':True,
        }

    def verifier(self,resolution='UPHELD'):
        return {
            'verdict':'CONDITIONS_REQUIRED',
            'decisions':[
                {'claimId':'C1','status':'SUPPORTED','evidenceIds':['U02'],'reason':'esplicito in Stati'},
                {'claimId':'C2','status':'SUPPORTED','evidenceIds':['U02'],'reason':'currentSymbolic è separato'},
                {'claimId':'C3','status':'SUPPORTED','evidenceIds':['U03'],'reason':'requisiti green elencati'},
                {'claimId':'C4','status':'SUPPORTED','evidenceIds':['U05'],'reason':'processo nuova source elencato'},
            ],
            'antiBiasResolution':[
                {'issueId':'AB1','status':resolution,'reason':'la distinzione resta esplicita'}
            ],
        }

    def integrator(self,verdict='CONDITIONS_REQUIRED',claims=None):
        return {
            'verdict':verdict,
            'usedClaimIds':claims or ['C1','C2','C3','C4'],
            'answer':'No. Green copre l ammissibilità dati/diritti, ma la readiness simbolica e operativa richiede ulteriori passaggi.',
            'limitations':['La conclusione riguarda solo lo scope del Source Registry congelato.'],
        }

    def run_network(self,replies):
        fake=Fake(replies)
        with contextlib.redirect_stdout(io.StringIO()):
            result=n.run(self.root,fake)
        return fake,result

    def test_full_four_role_pilot_passes(self):
        fake,result=self.run_network([self.extractor(),self.challenge(),self.verifier(),self.integrator()])
        self.assertEqual(result['status'],'PROPOSED_FOR_HUMAN_REVIEW')
        self.assertEqual(result['modelCalls'],4)
        self.assertEqual(len(fake.calls),4)
        self.assertTrue(result['humanReviewRequired'])
        self.assertFalse(result['executionAuthorized'])
        self.assertFalse(result['trainingAuthorized'])
        self.assertFalse(result['networkProductionReady'])
        self.assertFalse(result['independentEvaluation'])

    def test_antibias_is_role_separated_and_minimal(self):
        fake,_=self.run_network([self.extractor(),self.challenge(),self.verifier(),self.integrator()])
        extractor_request=json.dumps(fake.calls[0],ensure_ascii=False)
        antibias_request=json.dumps(fake.calls[1],ensure_ascii=False)
        self.assertNotIn('FAME-AB-01',extractor_request)
        for control in ('FAME-AB-01','FAME-AB-02','FAME-AB-03','FAME-AB-04','FAME-AB-05','FAME-AB-06'):
            self.assertIn(control,antibias_request)
        self.assertNotIn('METHOD_FAMILY_MAP',antibias_request)
        self.assertNotIn('CASCADE_ROUND_LEDGER',antibias_request)
        self.assertNotIn('language/region',antibias_request)

    def test_wrong_final_verdict_is_rejected(self):
        fake,result=self.run_network([
            self.extractor(),self.challenge(),self.verifier(),
            self.integrator(verdict='GREEN_IS_SUFFICIENT')
        ])
        self.assertEqual(len(fake.calls),4)
        self.assertEqual(result['status'],'NEEDS_REVIEW')
        self.assertIn('INTEGRATOR_INCORRECT_VERDICT',result['roles']['integrator']['errors'])

    def test_missing_required_final_evidence_is_rejected(self):
        verifier=self.verifier()
        verifier['decisions'][2]={'claimId':'C3','status':'UNSUPPORTED','evidenceIds':[],'reason':'test'}
        fake,result=self.run_network([
            self.extractor(),self.challenge(),verifier,
            self.integrator(claims=['C1','C2','C4'])
        ])
        self.assertEqual(result['status'],'NEEDS_REVIEW')
        self.assertIn('INTEGRATOR_INSUFFICIENT_FINAL_EVIDENCE',result['roles']['integrator']['errors'])

    def test_unresolved_blocking_antibias_issue_blocks_final(self):
        fake,result=self.run_network([
            self.extractor(),self.challenge(blocking=True),self.verifier(resolution='UNRESOLVED'),
            self.integrator()
        ])
        self.assertEqual(result['status'],'NEEDS_REVIEW')
        self.assertIn('INTEGRATOR_BLOCKING_ANTIBIAS_NOT_REJECTED',result['roles']['integrator']['errors'])

    def test_upheld_blocking_antibias_issue_also_blocks_final(self):
        fake,result=self.run_network([
            self.extractor(),self.challenge(blocking=True),self.verifier(resolution='UPHELD'),
            self.integrator()
        ])
        self.assertEqual(result['status'],'NEEDS_REVIEW')
        self.assertIn('INTEGRATOR_BLOCKING_ANTIBIAS_NOT_REJECTED',result['roles']['integrator']['errors'])

    def test_rejected_role_is_not_retried(self):
        bad=self.extractor()
        bad['claims'][0]['evidenceIds']=[]
        fake=Fake([bad])
        output=io.StringIO()
        with contextlib.redirect_stdout(output):
            result=n.run(self.root,fake)
        self.assertEqual(result['status'],'NEEDS_REVIEW')
        self.assertIn('"status": "NEEDS_REVIEW"',output.getvalue())
        self.assertEqual(len(fake.calls),1)
        again=Fake([self.extractor()])
        output=io.StringIO()
        with contextlib.redirect_stdout(output):
            second=n.run(self.root,again)
        self.assertEqual(second['status'],'NEEDS_REVIEW')
        self.assertIn('"status": "NEEDS_REVIEW"',output.getvalue())
        self.assertEqual(again.calls,[])

    def test_digest_preflight_failure_makes_no_model_call(self):
        fake=Fake([self.extractor()],mode='digest')
        with self.assertRaises(ValueError):
            with contextlib.redirect_stdout(io.StringIO()):
                n.run(self.root,fake)
        self.assertEqual(fake.calls,[])

    def test_status_replays_requests_and_detects_tampering(self):
        self.run_network([self.extractor(),self.challenge(),self.verifier(),self.integrator()])
        out=self.root/'roles'/'anti-bias'/'attempt-1'
        request=json.loads((out/'request.json').read_text(encoding='utf-8'))
        request['messages'][1]['content']='tampered'
        (out/'request.json').write_text(json.dumps(request,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        receipt=json.loads((out/'receipt.json').read_text(encoding='utf-8'))
        import hashlib
        receipt['hashes']['request.json']=hashlib.sha256((out/'request.json').read_bytes()).hexdigest()
        (out/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        with self.assertRaisesRegex(ValueError,'Request storica non conforme'):
            n.status(self.root)


if __name__=='__main__':
    unittest.main()
