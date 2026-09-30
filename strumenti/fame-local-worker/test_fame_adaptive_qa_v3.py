import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import fame_anti_bias as anti
import fame_adaptive_qa_v3 as adaptive
import fame_four_role_network_v9 as network
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
        return {
            'done':True,
            'done_reason':'stop',
            'message':{'content':json.dumps(item,ensure_ascii=False)},
            'total_duration':1000,
            'load_duration':100,
            'prompt_eval_count':100,
            'eval_count':50,
        }


class AdaptiveQaV3Tests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'adaptive'
        self.case='adaptive-v3-first-attempt-pass-pilot-v1'
        self.base_consumed=baseline.CONSUMED_CASES
        baseline.CONSUMED_CASES=frozenset()
        self.addCleanup(setattr,baseline,'CONSUMED_CASES',self.base_consumed)
        with contextlib.redirect_stdout(io.StringIO()):
            adaptive.init(self.root,self.case)

    def package(self):
        return network.package(self.case)

    def baseline_answer(self,complete=True):
        claims=[
            {'claimId':'C1','statement':'One call, first-attempt pass, no repair.','evidenceIds':['U01']},
            {'claimId':'C2','statement':'All five host checks were accepted.','evidenceIds':['U02']},
        ]
        if complete:
            claims.extend([
                {'claimId':'C3','statement':'Human review remains required.','evidenceIds':['U04']},
                {'claimId':'C4','statement':'The result is limited to this frozen task and does not validate general reliability or production.','evidenceIds':['U05']},
            ])
        return {
            'answerOptionId':'ANSWER_LIMITED_FIRST_ATTEMPT_PASS',
            'claims':claims,
            'answer':'A real first-attempt pass on this task, with explicit limits.',
            'limitations':['Human review remains required.'],
        }

    def network_answers(self):
        extractor={
            'claims':[
                {'claimId':'C1','statement':'One call, first-attempt pass, no repair.','evidenceIds':['U01']},
                {'claimId':'C2','statement':'All five host checks were accepted.','evidenceIds':['U02']},
                {'claimId':'C3','statement':'Human review remains required.','evidenceIds':['U04']},
                {'claimId':'C4','statement':'The result is limited to this task and does not validate general reliability or production.','evidenceIds':['U05']},
            ]
        }
        challenge={
            'applicability':[
                {
                    'controlId':row['controlId'],
                    'status':'NOT_APPLICABLE_WITH_REASON',
                    'reason':'No material challenge for this claim set.'
                }
                for row in anti.CONTROLS
            ],
            'issues':[],
            'overall':'ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE',
            'residualBiasUncertaintyExplicit':True,
            'omissionReview':[
                {
                    'evidenceId':'U03',
                    'status':'NOT_MATERIAL',
                    'reason':'Optional detail is not required for the selected conclusion.'
                }
            ],
        }
        verifier={
            'answerOptionId':'ANSWER_LIMITED_FIRST_ATTEMPT_PASS',
            'supportedClaims':[
                {'claimId':'C1','evidenceIds':['U01'],'reason':'Direct support.'},
                {'claimId':'C2','evidenceIds':['U02'],'reason':'Direct support.'},
                {'claimId':'C3','evidenceIds':['U04'],'reason':'Direct support.'},
                {'claimId':'C4','evidenceIds':['U05'],'reason':'Direct support.'},
            ],
            'unsupportedClaims':[],
            'claimsNeedingRework':[],
            'repairedClaims':[],
            'recoveredClaims':[],
            'omissionResolution':[
                {
                    'evidenceId':'U03',
                    'status':'NOT_REQUIRED',
                    'reason':'Optional detail is not required for the selected conclusion.'
                }
            ],
            'selectedOptionAudit':{
                'optionId':'ANSWER_LIMITED_FIRST_ATTEMPT_PASS',
                'fullySupported':True,
                'components':[
                    {'supportId':'S1','statement':'The run passed on the first attempt with one call and no repair.','evidenceIds':['U01']},
                    {'supportId':'S2','statement':'All five frozen host checks were accepted.','evidenceIds':['U02']},
                    {'supportId':'S3','statement':'Human review remains required.','evidenceIds':['U04']},
                    {'supportId':'S4','statement':'The result does not establish general reliability, autonomous multi-agent validation, training, or production readiness.','evidenceIds':['U05']},
                ],
            },
        }
        integrator={
            'answerOptionId':'ANSWER_LIMITED_FIRST_ATTEMPT_PASS',
            'usedClaimIds':['C1','C2','C3','C4'],
            'answer':'ANSWER_LIMITED_FIRST_ATTEMPT_PASS',
            'limitations':['Human review remains required and the result is task-specific.'],
        }
        return [extractor,challenge,verifier,integrator]

    def test_fresh_case_loads_with_literal_units(self):
        p=self.package()
        self.assertEqual(p['expectedAnswerOptionId'],'ANSWER_LIMITED_FIRST_ATTEMPT_PASS')
        self.assertEqual(p['requiredFinalEvidenceGroups'],[['U01'],['U02'],['U04'],['U05']])
        self.assertEqual(p['optionalContext'],['U03'])

    def test_clean_baseline_uses_one_call_and_skips_v9(self):
        fake=Fake([self.baseline_answer(True)])
        with contextlib.redirect_stdout(io.StringIO()):
            result=adaptive.run(self.root,fake)
        self.assertEqual(result['status'],'PROPOSED_FOR_HUMAN_REVIEW')
        self.assertEqual(result['selectedPath'],'single-agent')
        self.assertFalse(result['recoveredByEscalation'])
        self.assertEqual(result['triggerDecision']['trigger'],'BASELINE_ACCEPTED')
        self.assertEqual(result['modelCalls'],1)
        self.assertEqual(len(fake.chat_calls),1)
        self.assertEqual(result['fourRoleNetworkV9']['status'],'IN_PROGRESS')

    def test_incomplete_baseline_escalates_and_v9_recovers(self):
        fake=Fake([self.baseline_answer(False)]+self.network_answers())
        with contextlib.redirect_stdout(io.StringIO()):
            result=adaptive.run(self.root,fake)
        self.assertEqual(result['triggerDecision']['trigger'],'INSUFFICIENT_FINAL_EVIDENCE')
        self.assertEqual(result['selectedPath'],'four-role-network-v9')
        self.assertTrue(result['recoveredByEscalation'])
        self.assertEqual(result['status'],'PROPOSED_FOR_HUMAN_REVIEW')
        self.assertEqual(result['modelCalls'],5)
        self.assertEqual(len(fake.chat_calls),5)
        self.assertFalse(result['fourRoleNetworkV9']['hostDerivedRecovery']['applied'])

    def test_no_response_transport_failure_does_not_escalate(self):
        fake=Fake(fail_at=1)
        with contextlib.redirect_stdout(io.StringIO()):
            result=adaptive.run(self.root,fake)
        self.assertEqual(result['status'],'NEEDS_REVIEW')
        self.assertEqual(result['triggerDecision']['trigger'],'NO_RESPONSE_OPERATIONAL_FAILURE')
        self.assertEqual(result['triggerDecision']['decision'],'STOP_NO_ESCALATION')
        self.assertIsNone(result['selectedPath'])
        self.assertEqual(result['fourRoleNetworkV9']['status'],'IN_PROGRESS')

    def test_manifest_freezes_v9_and_call_bounds(self):
        meta=json.loads((self.root/'adaptive.json').read_text(encoding='utf-8'))
        self.assertEqual(meta['escalationNetwork'],'fame-four-role-network-v9')
        self.assertEqual(meta['baselineModelCallsMax'],1)
        self.assertEqual(meta['networkModelCallsMaxOnEscalation'],4)
        self.assertEqual(meta['maximumModelCalls'],5)
        self.assertFalse(meta['escalationPolicy']['automaticRetry'])


if __name__=='__main__':
    unittest.main()
