import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import fame_four_role_network_v2 as n


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


class FameFourRoleNetworkV2Tests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'network'
        with contextlib.redirect_stdout(io.StringIO()):
            n.init(self.root,'agent-network-readiness-network-v2')

    def extractor(self):
        return {
            'claims':[
                {'claimId':'C1','statement':'Qwen + Direct Worker ha ottenuto 3/3 PASS first-attempt sul task demo.','evidenceIds':['U02']},
                {'claimId':'C2','statement':'Il recap dice esplicitamente che non è dimostrato che Qwen sia il modello migliore.','evidenceIds':['U03']},
                {'claimId':'C3','statement':'Il QA worker v6 ha avuto un run reale VALIDATED_FOR_REVIEW al primo tentativo.','evidenceIds':['U04']},
                {'claimId':'C4','statement':'Il recap richiede un secondo task reale differente prima di considerare stabile il pattern e passare alla vera orchestrazione multi-agent.','evidenceIds':['U05']},
            ],
        }

    def clean_challenge(self):
        return {
            'applicability':[
                {'controlId':'FAME-AB-01','status':'APPLICABLE','reason':'la conclusione generale va sfidata'},
                {'controlId':'FAME-AB-02','status':'APPLICABLE','reason':'serve conservare sia PASS sia limiti'},
                {'controlId':'FAME-AB-03','status':'NOT_APPLICABLE_WITH_REASON','reason':'non si aggregano evidenze come repliche indipendenti'},
                {'controlId':'FAME-AB-04','status':'APPLICABLE','reason':'evitare inferenze da casi limitati'},
                {'controlId':'FAME-AB-05','status':'APPLICABLE','reason':'scope dei claim deve restare quello del recap'},
                {'controlId':'FAME-AB-06','status':'APPLICABLE','reason':'il recap contiene limiti e next step'},
            ],
            'issues':[],
            'overall':'ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE',
            'residualBiasUncertaintyExplicit':True,
        }

    def verifier(self):
        return {
            'verdict':'NOT_ESTABLISHED',
            'decisions':[
                {'claimId':'C1','status':'SUPPORTED','evidenceIds':['U02'],'reason':'risultato demo esplicito'},
                {'claimId':'C2','status':'SUPPORTED','evidenceIds':['U03'],'reason':'limite esplicito'},
                {'claimId':'C3','status':'SUPPORTED','evidenceIds':['U04'],'reason':'stato QA v6 esplicito'},
                {'claimId':'C4','status':'SUPPORTED','evidenceIds':['U05'],'reason':'next step esplicito'},
            ],
            'antiBiasResolution':[],
        }

    def integrator(self,verdict='NOT_ESTABLISHED',claims=None):
        return {
            'verdict':verdict,
            'usedClaimIds':claims or ['C1','C2','C3','C4'],
            'answer':'No. Il recap documenta risultati positivi circoscritti, ma dichiara che non è dimostrato che Qwen sia il migliore e richiede ulteriori prove prima di considerare stabile il sistema.',
            'limitations':['La conclusione vale per il recap congelato e non prova affidabilità generale.'],
        }

    def run_network(self,replies):
        fake=Fake(replies)
        with contextlib.redirect_stdout(io.StringIO()):
            result=n.run(self.root,fake)
        return fake,result

    def test_full_generic_v2_pipeline_passes(self):
        fake,result=self.run_network([
            self.extractor(),self.clean_challenge(),self.verifier(),self.integrator()
        ])
        self.assertEqual(result['status'],'PROPOSED_FOR_HUMAN_REVIEW')
        self.assertEqual(result['modelCalls'],4)
        self.assertEqual(len(fake.calls),4)
        self.assertTrue(result['humanReviewRequired'])
        self.assertFalse(result['executionAuthorized'])
        self.assertFalse(result['trainingAuthorized'])
        self.assertFalse(result['networkProductionReady'])
        self.assertFalse(result['independentEvaluation'])

    def test_extractor_has_no_verdict_and_never_sees_host_expected_verdict(self):
        fake,_=self.run_network([
            self.extractor(),self.clean_challenge(),self.verifier(),self.integrator()
        ])
        request=fake.calls[0]
        schema=request['format']
        self.assertEqual(schema['required'],['claims'])
        payload=request['messages'][1]['content']
        self.assertNotIn('expectedVerdict',payload)
        self.assertNotIn('NOT_ESTABLISHED',payload)

    def test_verdict_enum_is_case_owned_not_runner_hardcoded(self):
        p=n.package('agent-network-readiness-network-v2')
        self.assertEqual(
            n.verifier_schema(p,self.extractor(),self.clean_challenge())['properties']['verdict']['enum'],
            ['ESTABLISHED','NOT_ESTABLISHED','INSUFFICIENT_EVIDENCE']
        )

    def test_consumed_v1_case_cannot_be_reinitialized(self):
        other=Path(self.temp.name)/'old'
        with self.assertRaisesRegex(ValueError,'Case gia consumato'):
            n.init(other,'source-registry-readiness-network-v1')

    def test_wrong_final_verdict_is_rejected(self):
        fake,result=self.run_network([
            self.extractor(),self.clean_challenge(),self.verifier(),self.integrator(verdict='ESTABLISHED')
        ])
        self.assertEqual(len(fake.calls),4)
        self.assertEqual(result['status'],'NEEDS_REVIEW')
        self.assertIn('INTEGRATOR_INCORRECT_VERDICT',result['roles']['integrator']['errors'])

    def test_required_evidence_groups_remain_host_owned(self):
        verifier=self.verifier()
        verifier['decisions'][3]={'claimId':'C4','status':'UNSUPPORTED','evidenceIds':[],'reason':'test'}
        fake,result=self.run_network([
            self.extractor(),self.clean_challenge(),verifier,
            self.integrator(claims=['C1','C2','C3'])
        ])
        self.assertEqual(result['status'],'NEEDS_REVIEW')
        self.assertIn('INTEGRATOR_INSUFFICIENT_FINAL_EVIDENCE',result['roles']['integrator']['errors'])

    def test_digest_failure_makes_no_semantic_call(self):
        fake=Fake([self.extractor()],mode='digest')
        with self.assertRaises(ValueError):
            with contextlib.redirect_stdout(io.StringIO()):
                n.run(self.root,fake)
        self.assertEqual(fake.calls,[])


if __name__=='__main__':
    unittest.main()
