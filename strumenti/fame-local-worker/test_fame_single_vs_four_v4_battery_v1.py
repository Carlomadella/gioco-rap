import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import fame_anti_bias as anti
import fame_four_role_network_v4 as network
import fame_single_agent_baseline_v2 as baseline
import fame_single_vs_four_v4_battery_v1 as battery


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


class V4BatteryTests(unittest.TestCase):
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
        evidence=[group[0] for group in p['requiredFinalEvidenceGroups']]
        baseline_claims=[
            {'claimId':f'C{i+1}','statement':f'Claim richiesto {i+1}.','evidenceIds':[eid]}
            for i,eid in enumerate(evidence)
        ]
        extractor={'claims':[dict(row) for row in baseline_claims]}
        challenge={
            'applicability':[
                {'controlId':row['controlId'],'status':'APPLICABLE','reason':'controllo applicato'}
                for row in anti.CONTROLS
            ],
            'issues':[],
            'overall':'ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE',
            'residualBiasUncertaintyExplicit':True,
        }
        supported=[
            {'claimId':row['claimId'],'evidenceIds':row['evidenceIds'],'reason':'evidenza diretta'}
            for row in baseline_claims
        ]
        verifier={
            'answerOptionId':p['expectedAnswerOptionId'],
            'supportedClaims':supported,
            'unsupportedClaims':[],
            'claimsNeedingRework':[],
        }
        ids=[row['claimId'] for row in baseline_claims]
        integrator={
            'answerOptionId':p['expectedAnswerOptionId'],
            'usedClaimIds':ids,
            'answer':'Sintesi coerente con le evidenze congelate.',
            'limitations':['Scope limitato al caso.'],
        }
        baseline_out={
            'answerOptionId':p['expectedAnswerOptionId'],
            'claims':baseline_claims,
            'answer':'Sintesi coerente con le evidenze congelate.',
            'limitations':['Scope limitato al caso.'],
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
                            'message':{'content':'{"answerOptionId":"x"'},
                            'total_duration':2000,'load_duration':100,
                            'prompt_eval_count':120,'eval_count':16384,
                        }})
                    else:
                        first_single_seen=True
                        result.append(outputs[arm])
                else:
                    result.extend(outputs[arm])
        return result

    def test_manifest_is_balanced_and_budget_matched(self):
        meta=json.loads((self.root/'battery.json').read_text(encoding='utf-8'))
        self.assertEqual(meta['preRegisteredCaseCount'],4)
        self.assertEqual(meta['armOrderCounts'],{'singleAgentFirst':2,'fourRoleFirst':2})
        self.assertEqual(meta['singleAgentMaxTotalGenerationTokens'],16384)
        self.assertEqual(meta['networkMaxTotalGenerationTokens'],16384)
        self.assertTrue(meta['matchedTotalGenerationBudget'])

    def test_full_v4_battery_runs_twenty_calls(self):
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
        self.assertEqual(summary['singleRequiredCoverageComplete'],4)
        self.assertEqual(summary['networkRequiredCoverageComplete'],4)
        self.assertEqual(summary['networkVerifierUnsupportedCount'],0)
        self.assertEqual(summary['networkVerifierReworkCount'],0)

    def test_v4_network_coverage_comes_from_supported_claims(self):
        fake=Fake(self.replies())
        with contextlib.redirect_stdout(io.StringIO()):
            result=battery.run(self.root,fake)
        for row in result['cases']:
            expected=sorted(group[0] for group in network.package(row['caseId'])['requiredFinalEvidenceGroups'])
            self.assertEqual(row['fourRoleNetwork']['selectedEvidenceIds'],expected)
            self.assertTrue(row['fourRoleNetwork']['requiredEvidenceCoverage']['allRequiredCovered'])

    def test_truncated_single_is_recorded_and_network_still_runs(self):
        fake=Fake(self.replies(truncated_first_single=True))
        with contextlib.redirect_stdout(io.StringIO()):
            result=battery.run(self.root,fake)
        self.assertEqual(result['status'],'COMPLETE_FOR_HUMAN_REVIEW')
        self.assertEqual(len(fake.chat_calls),20)
        self.assertEqual(result['automaticSummary']['singleTruncatedCases'],1)
        first=result['cases'][0]
        self.assertEqual(first['singleAgent']['resultStatus'],'ERROR')
        self.assertEqual(first['singleAgent']['response']['doneReason'],'length')
        self.assertTrue(first['fourRoleNetwork']['accepted'])

    def test_transport_error_without_response_stops(self):
        fake=Fake(self.replies(),fail_at=1)
        with contextlib.redirect_stdout(io.StringIO()):
            result=battery.run(self.root,fake)
        self.assertEqual(len(fake.chat_calls),1)
        self.assertEqual(result['status'],'IN_PROGRESS')

    def test_expected_answer_is_host_only(self):
        fake=Fake(self.replies())
        with contextlib.redirect_stdout(io.StringIO()):
            battery.run(self.root,fake)
        for payload in fake.chat_calls:
            self.assertNotIn('expectedAnswerOptionId',json.dumps(payload,ensure_ascii=False))

    def test_replay_does_not_call_model(self):
        fake=Fake(self.replies())
        with contextlib.redirect_stdout(io.StringIO()):
            first=battery.run(self.root,fake)
            second=battery.aggregate(self.root)
        self.assertEqual(first,second)
        self.assertEqual(len(fake.chat_calls),20)


if __name__=='__main__':
    unittest.main()
