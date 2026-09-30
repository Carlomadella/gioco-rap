import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import fame_anti_bias as anti
import fame_adaptive_qa_v2 as adaptive
import fame_four_role_network_v6 as network
import fame_single_agent_baseline_v2 as baseline


class Fake:
    def __init__(self,items=None,fail_at=None):
        self.items=list(items or [])
        self.fail_at=fail_at
        self.chat_calls=[]

    def request(self,endpoint,payload=None):
        if endpoint=='/api/version':
            return {'version':'test'}
        if endpoint=='/api/tags':
            return {'models':[{'name':network.MODEL,'digest':network.DIGEST}]}
        if endpoint=='/api/show':
            return {}
        self.chat_calls.append(payload)
        if self.fail_at is not None and len(self.chat_calls)==self.fail_at:
            raise TimeoutError('test transport')
        item=self.items.pop(0)
        if type(item) is dict and '__raw__' in item:
            return item['__raw__']
        return {
            'done':True,
            'done_reason':'stop',
            'message':{'content':json.dumps(item,ensure_ascii=False)},
            'total_duration':1000,
            'load_duration':100,
            'prompt_eval_count':100,
            'eval_count':50,
        }


class AdaptiveQaV2Tests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'adaptive'
        self.case='adaptive-v2-tsumugi-architecture-pilot-v1'
        self.base_consumed=baseline.CONSUMED_CASES
        baseline.CONSUMED_CASES=frozenset()
        self.addCleanup(setattr,baseline,'CONSUMED_CASES',self.base_consumed)
        with contextlib.redirect_stdout(io.StringIO()):
            adaptive.init(self.root,self.case)

    def package(self):
        return network.package(self.case)

    def claims(self,all_groups=True):
        groups=self.package()['requiredFinalEvidenceGroups']
        if not all_groups:
            groups=groups[:1]
        return [
            {'claimId':f'C{i+1}','statement':f'Claim {i+1}.','evidenceIds':[group[0]]}
            for i,group in enumerate(groups)
        ]

    def baseline_answer(self,all_groups=True):
        return {
            'answerOptionId':self.package()['expectedAnswerOptionId'],
            'claims':self.claims(all_groups),
            'answer':'Risposta coerente con la rubrica congelata.',
            'limitations':['Scope limitato al caso.'],
        }

    def network_answers(self):
        claims=self.claims(True)
        extractor={'claims':claims}
        challenge={
            'applicability':[
                {'controlId':row['controlId'],'status':'APPLICABLE','reason':'controllo applicato'}
                for row in anti.CONTROLS
            ],
            'issues':[],
            'overall':'ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE',
            'residualBiasUncertaintyExplicit':True,
        }
        verifier={
            'answerOptionId':self.package()['expectedAnswerOptionId'],
            'supportedClaims':[
                {'claimId':row['claimId'],'evidenceIds':row['evidenceIds'],'reason':'evidenza diretta'}
                for row in claims
            ],
            'unsupportedClaims':[],
            'claimsNeedingRework':[],
            'repairedClaims':[],
        }
        integrator={
            'answerOptionId':self.package()['expectedAnswerOptionId'],
            'usedClaimIds':[row['claimId'] for row in claims],
            'answer':'Risposta finale coerente.',
            'limitations':['Scope limitato al caso.'],
        }
        return [extractor,challenge,verifier,integrator]

    def test_clean_baseline_uses_one_call_and_skips_v6(self):
        fake=Fake([self.baseline_answer(True)])
        with contextlib.redirect_stdout(io.StringIO()):
            result=adaptive.run(self.root,fake)
        self.assertEqual(result['status'],'PROPOSED_FOR_HUMAN_REVIEW')
        self.assertEqual(result['selectedPath'],'single-agent')
        self.assertFalse(result['recoveredByEscalation'])
        self.assertEqual(result['triggerDecision']['trigger'],'BASELINE_ACCEPTED')
        self.assertEqual(result['modelCalls'],1)
        self.assertEqual(len(fake.chat_calls),1)
        self.assertEqual(result['fourRoleNetworkV6']['status'],'IN_PROGRESS')

    def test_insufficient_coverage_escalates_and_v6_recovers(self):
        fake=Fake([self.baseline_answer(False)]+self.network_answers())
        with contextlib.redirect_stdout(io.StringIO()):
            result=adaptive.run(self.root,fake)
        self.assertEqual(result['triggerDecision']['trigger'],'INSUFFICIENT_FINAL_EVIDENCE')
        self.assertEqual(result['selectedPath'],'four-role-network-v6')
        self.assertTrue(result['recoveredByEscalation'])
        self.assertEqual(result['status'],'PROPOSED_FOR_HUMAN_REVIEW')
        self.assertEqual(result['modelCalls'],5)
        self.assertEqual(len(fake.chat_calls),5)

    def test_no_response_transport_failure_does_not_escalate(self):
        fake=Fake(fail_at=1)
        with contextlib.redirect_stdout(io.StringIO()):
            result=adaptive.run(self.root,fake)
        self.assertEqual(result['status'],'NEEDS_REVIEW')
        self.assertEqual(result['triggerDecision']['trigger'],'NO_RESPONSE_OPERATIONAL_FAILURE')
        self.assertEqual(result['triggerDecision']['decision'],'STOP_NO_ESCALATION')
        self.assertIsNone(result['selectedPath'])
        self.assertEqual(result['modelCalls'],0)
        self.assertEqual(len(fake.chat_calls),1)
        self.assertEqual(result['fourRoleNetworkV6']['status'],'IN_PROGRESS')

    def test_manifest_freezes_v6_and_call_bounds(self):
        meta=json.loads((self.root/'adaptive.json').read_text(encoding='utf-8'))
        self.assertEqual(meta['escalationNetwork'],'fame-four-role-network-v6')
        self.assertEqual(meta['baselineModelCallsMax'],1)
        self.assertEqual(meta['networkModelCallsMaxOnEscalation'],4)
        self.assertEqual(meta['maximumModelCalls'],5)
        self.assertFalse(meta['escalationPolicy']['automaticRetry'])


if __name__=='__main__':
    unittest.main()
