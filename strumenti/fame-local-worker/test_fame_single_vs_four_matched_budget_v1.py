import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import fame_anti_bias as anti
import fame_four_role_network_v3 as network
import fame_single_agent_baseline_v2 as baseline
import fame_single_vs_four_matched_budget_v1 as battery


class Fake:
    def __init__(self,items,fail_at=None):
        self.items=list(items)
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
            raise TimeoutError('test transport')
        item=self.items.pop(0)
        if type(item) is dict and '__raw_response__' in item:
            return item['__raw_response__']
        return {
            'done':True,'done_reason':'stop',
            'message':{'content':json.dumps(item,ensure_ascii=False)},
            'total_duration':1000,'load_duration':100,
            'prompt_eval_count':100,'eval_count':50,
        }


class MatchedBudgetBatteryTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'matched'
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
        baseline_out={
            'answerOptionId':p['expectedAnswerOptionId'],
            'claims':[
                {'claimId':'C1','statement':'Primo limite materiale.','evidenceIds':[e1]},
                {'claimId':'C2','statement':'Secondo limite materiale.','evidenceIds':[e2]},
            ],
            'answer':'No. Le evidenze escludono entrambe le conclusioni forti.',
            'limitations':['Scope congelato.'],
        }
        extractor={'claims':[
            {'claimId':'C1','statement':'Primo limite materiale.','evidenceIds':[e1]},
            {'claimId':'C2','statement':'Secondo limite materiale.','evidenceIds':[e2]},
        ]}
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
            'answerOptionId':p['expectedAnswerOptionId'],
            'decisions':[
                {'claimId':'C1','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':[e1],'reason':'diretto'},
                {'claimId':'C2','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':[e2],'reason':'diretto'},
            ],
        }
        integrator={
            'answerOptionId':p['expectedAnswerOptionId'],
            'usedClaimIds':['C1','C2'],
            'answer':'No. I due limiti restano validi.',
            'limitations':['Scope congelato.'],
        }
        return {'single-agent':baseline_out,'four-role-network':[extractor,challenge,verifier,integrator]}

    def replies(self,truncated_first_single=False):
        result=[]
        first_single_seen=False
        for case_id,first,second in battery.CASES:
            outputs=self.outputs_for_case(case_id)
            for arm in (first,second):
                if arm=='single-agent':
                    if truncated_first_single and not first_single_seen:
                        first_single_seen=True
                        result.append({'__raw_response__':{
                            'done':True,'done_reason':'length',
                            'message':{'content':'{"answerOptionId":"ANSWER_NO"'},
                            'total_duration':2000,'load_duration':100,
                            'prompt_eval_count':120,'eval_count':16384,
                        }})
                    else:
                        first_single_seen=True
                        result.append(outputs[arm])
                else:
                    result.extend(outputs[arm])
        return result

    def test_manifest_matches_total_generation_budget(self):
        meta=json.loads((self.root/'battery.json').read_text(encoding='utf-8'))
        self.assertTrue(meta['matchedTotalGenerationBudget'])
        self.assertEqual(meta['singleAgentMaxTotalGenerationTokens'],16384)
        self.assertEqual(meta['networkMaxTotalGenerationTokens'],16384)
        self.assertEqual(meta['singleAgentMaxGenerationTokensPerCall'],16384)
        self.assertEqual(meta['networkMaxGenerationTokensPerCall'],4096)
        self.assertEqual(meta['armOrderCounts'],{'singleAgentFirst':2,'fourRoleFirst':2})

    def test_full_battery_uses_four_16384_and_sixteen_4096_requests(self):
        fake=Fake(self.replies())
        with contextlib.redirect_stdout(io.StringIO()):
            result=battery.run(self.root,fake)
        self.assertEqual(result['status'],'COMPLETE_FOR_HUMAN_REVIEW')
        self.assertEqual(len(fake.chat_calls),20)
        predicts=[call['options']['num_predict'] for call in fake.chat_calls]
        self.assertEqual(predicts.count(16384),4)
        self.assertEqual(predicts.count(4096),16)
        summary=result['automaticSummary']
        self.assertEqual(summary['bothAnswerMatchHostExpected'],4)
        self.assertEqual(summary['singleAccepted'],4)
        self.assertEqual(summary['networkAccepted'],4)
        self.assertEqual(summary['singleTruncatedCases'],0)
        self.assertEqual(summary['networkTruncatedCases'],0)
        self.assertIsNone(result['automaticWinner'])

    def test_truncated_single_response_is_outcome_and_does_not_stop_other_arm(self):
        fake=Fake(self.replies(truncated_first_single=True))
        with contextlib.redirect_stdout(io.StringIO()):
            result=battery.run(self.root,fake)
        self.assertEqual(result['status'],'COMPLETE_FOR_HUMAN_REVIEW')
        self.assertEqual(len(fake.chat_calls),20)
        self.assertEqual(result['automaticSummary']['singleTruncatedCases'],1)
        first=result['cases'][0]
        self.assertEqual(first['singleAgent']['resultStatus'],'ERROR')
        self.assertEqual(first['singleAgent']['response']['doneReason'],'length')
        self.assertEqual(first['singleAgent']['usage']['eval_count'],16384)
        self.assertTrue(first['fourRoleNetwork']['accepted'])

    def test_no_response_transport_error_stops_battery(self):
        fake=Fake(self.replies(),fail_at=1)
        with contextlib.redirect_stdout(io.StringIO()):
            result=battery.run(self.root,fake)
        self.assertEqual(len(fake.chat_calls),1)
        self.assertEqual(result['status'],'IN_PROGRESS')
        first=result['cases'][0]
        self.assertEqual(first['singleAgent']['resultStatus'],'ERROR')
        self.assertFalse(first['singleAgent']['response']['hasResponse'])
        self.assertEqual(first['fourRoleNetwork']['status'],'IN_PROGRESS')

    def test_expected_answer_is_host_only_in_all_requests(self):
        fake=Fake(self.replies())
        with contextlib.redirect_stdout(io.StringIO()):
            battery.run(self.root,fake)
        for payload in fake.chat_calls:
            self.assertNotIn('expectedAnswerOptionId',json.dumps(payload,ensure_ascii=False))

    def test_replay_is_deterministic_without_new_calls(self):
        fake=Fake(self.replies())
        with contextlib.redirect_stdout(io.StringIO()):
            first=battery.run(self.root,fake)
            second=battery.aggregate(self.root)
        self.assertEqual(first,second)
        self.assertEqual(len(fake.chat_calls),20)


if __name__=='__main__':
    unittest.main()
