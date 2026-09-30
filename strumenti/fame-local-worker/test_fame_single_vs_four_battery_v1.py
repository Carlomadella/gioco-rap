import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import fame_anti_bias as anti
import fame_four_role_network_v3 as network
import fame_single_agent_baseline_v1 as baseline
import fame_single_vs_four_battery_v1 as battery


class Fake:
    def __init__(self,replies=None,fail_at=None):
        self.replies=list(replies or [])
        self.chat_calls=[]
        self.fail_at=fail_at
    def request(self,endpoint,payload=None):
        if endpoint=='/api/version':
            return {'version':'test'}
        if endpoint=='/api/tags':
            return {'models':[{'name':network.MODEL,'digest':network.DIGEST}]}
        if endpoint=='/api/show':
            return {}
        self.chat_calls.append(payload)
        if self.fail_at is not None and len(self.chat_calls)==self.fail_at:
            raise TimeoutError('test transport error')
        answer=self.replies.pop(0)
        return {
            'done':True,'done_reason':'stop',
            'message':{'content':json.dumps(answer,ensure_ascii=False)},
            'total_duration':1000,'load_duration':100,
            'prompt_eval_count':100,'eval_count':50,
        }


class BatteryTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'battery'
        self.real_network_consumed=network.CONSUMED_CASES
        self.real_baseline_consumed=baseline.CONSUMED_CASES
        network.CONSUMED_CASES=frozenset()
        baseline.CONSUMED_CASES=frozenset()
        self.addCleanup(setattr,network,'CONSUMED_CASES',self.real_network_consumed)
        self.addCleanup(setattr,baseline,'CONSUMED_CASES',self.real_baseline_consumed)
        with contextlib.redirect_stdout(io.StringIO()):
            battery.init(self.root)

    def outputs_for_case(self,case_id):
        p=network.package(case_id)
        e1=p['requiredFinalEvidenceGroups'][0][0]
        e2=p['requiredFinalEvidenceGroups'][1][0]
        baseline={
            'answerOptionId':p['expectedAnswerOptionId'],
            'claims':[
                {'claimId':'C1','statement':'Primo limite richiesto dalla fonte.','evidenceIds':[e1]},
                {'claimId':'C2','statement':'Secondo limite richiesto dalla fonte.','evidenceIds':[e2]},
            ],
            'answer':'No. Le due conclusioni forti non sono autorizzate dalle evidenze.',
            'limitations':['La conclusione resta circoscritta alle unità congelate.'],
        }
        extractor={'claims':[
            {'claimId':'C1','statement':'Primo limite richiesto dalla fonte.','evidenceIds':[e1]},
            {'claimId':'C2','statement':'Secondo limite richiesto dalla fonte.','evidenceIds':[e2]},
        ]}
        challenge={
            'applicability':[
                {'controlId':row['controlId'],'status':'APPLICABLE','reason':'controllo applicato senza issue'}
                for row in anti.CONTROLS
            ],
            'issues':[],
            'overall':'ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE',
            'residualBiasUncertaintyExplicit':True,
        }
        verifier={
            'answerOptionId':p['expectedAnswerOptionId'],
            'decisions':[
                {'claimId':'C1','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':[e1],'reason':'evidenza diretta'},
                {'claimId':'C2','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':[e2],'reason':'evidenza diretta'},
            ],
        }
        integrator={
            'answerOptionId':p['expectedAnswerOptionId'],
            'usedClaimIds':['C1','C2'],
            'answer':'No. La fonte mantiene entrambi i limiti richiesti.',
            'limitations':['Nessuna generalizzazione oltre lo scope congelato.'],
        }
        return {
            'single-agent':baseline,
            'four-role-network':[extractor,challenge,verifier,integrator],
        }

    def replies(self):
        result=[]
        for case_id,first,second in battery.CASES:
            outputs=self.outputs_for_case(case_id)
            for arm in (first,second):
                value=outputs[arm]
                if isinstance(value,list):
                    result.extend(value)
                else:
                    result.append(value)
        return result

    def test_real_battery_cases_are_consumed_outside_test_override(self):
        self.assertIn('battery-anti-bias-v1',self.real_network_consumed)
        self.assertIn('battery-anti-bias-v1',self.real_baseline_consumed)

    def test_manifest_preregisters_four_balanced_cases(self):
        meta=json.loads((self.root/'battery.json').read_text(encoding='utf-8'))
        self.assertEqual(meta['preRegisteredCaseCount'],4)
        self.assertEqual(meta['maximumModelCalls'],20)
        self.assertEqual(meta['armOrderCounts'],{'singleAgentFirst':2,'fourRoleFirst':2})
        self.assertEqual([row['caseId'] for row in meta['cases']],[row[0] for row in battery.CASES])

    def test_full_battery_runs_twenty_calls_and_aggregates(self):
        fake=Fake(self.replies())
        with contextlib.redirect_stdout(io.StringIO()):
            result=battery.run(self.root,fake)
        self.assertEqual(result['status'],'COMPLETE_FOR_HUMAN_REVIEW')
        self.assertEqual(result['completedCaseCount'],4)
        self.assertTrue(result['armOrderBalanced'])
        self.assertEqual(len(fake.chat_calls),20)
        summary=result['automaticSummary']
        self.assertEqual(summary['bothAnswerMatchHostExpected'],4)
        self.assertEqual(summary['singleOnlyAnswerMatchHostExpected'],0)
        self.assertEqual(summary['networkOnlyAnswerMatchHostExpected'],0)
        self.assertEqual(summary['singleRequiredCoverageComplete'],4)
        self.assertEqual(summary['networkRequiredCoverageComplete'],4)
        self.assertEqual(summary['singleModelCalls'],4)
        self.assertEqual(summary['networkModelCalls'],16)
        self.assertIsNone(result['automaticWinner'])
        self.assertFalse(result['architectureGeneralizationEstablished'])

    def test_expected_answer_is_host_only_in_all_twenty_requests(self):
        fake=Fake(self.replies())
        with contextlib.redirect_stdout(io.StringIO()):
            battery.run(self.root,fake)
        for payload in fake.chat_calls:
            self.assertNotIn('expectedAnswerOptionId',json.dumps(payload,ensure_ascii=False))

    def test_each_case_keeps_same_frozen_input_between_arms(self):
        fake=Fake(self.replies())
        with contextlib.redirect_stdout(io.StringIO()):
            result=battery.run(self.root,fake)
        for row in result['cases']:
            self.assertTrue(row['sameFrozenQuestionAndEvidence'])
            self.assertTrue(row['sameModelDigest'])
            self.assertTrue(row['sameGenerationOptions'])

    def test_result_replays_without_new_model_calls(self):
        fake=Fake(self.replies())
        with contextlib.redirect_stdout(io.StringIO()):
            first=battery.run(self.root,fake)
            second=battery.aggregate(self.root)
        self.assertEqual(first,second)
        self.assertEqual(len(fake.chat_calls),20)

    def test_transport_error_stops_before_second_arm(self):
        fake=Fake(self.replies(),fail_at=1)
        with contextlib.redirect_stdout(io.StringIO()):
            result=battery.run(self.root,fake)
        self.assertEqual(len(fake.chat_calls),1)
        self.assertEqual(result['status'],'IN_PROGRESS')
        first_case=result['cases'][0]
        self.assertEqual(first_case['singleAgent']['status'],'NEEDS_REVIEW')
        self.assertEqual(first_case['fourRoleNetwork']['status'],'IN_PROGRESS')


if __name__=='__main__':
    unittest.main()
