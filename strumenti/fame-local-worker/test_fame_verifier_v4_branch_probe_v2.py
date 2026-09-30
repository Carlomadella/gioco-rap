import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import fame_four_role_network_v4 as network
import fame_verifier_v4_branch_probe_v2 as probe


class Fake:
    def __init__(self,answer):
        self.answer=answer
        self.calls=[]
    def request(self,endpoint,payload=None):
        if endpoint=='/api/version':
            return {'version':'test'}
        if endpoint=='/api/tags':
            return {'models':[{'name':network.MODEL,'digest':network.DIGEST}]}
        if endpoint=='/api/show':
            return {}
        self.calls.append(payload)
        return {
            'done':True,
            'done_reason':'stop',
            'message':{'content':json.dumps(self.answer,ensure_ascii=False)},
            'total_duration':1000,
            'load_duration':100,
            'prompt_eval_count':100,
            'eval_count':50,
        }


class VerifierV4BranchProbeV2Tests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'probe'
        with contextlib.redirect_stdout(io.StringIO()):
            probe.init(self.root)

    def correct(self):
        return {
            'answerOptionId':'ANSWER_MIXED',
            'supportedClaims':[
                {'claimId':'C1','evidenceIds':['U01'],'reason':'U01 supporta C1.'},
                {'claimId':'C4','evidenceIds':['U03'],'reason':'U03 supporta C4.'},
            ],
            'unsupportedClaims':[
                {'claimId':'C2','reason':'U02 contraddice C2.'},
            ],
            'claimsNeedingRework':[
                {
                    'claimId':'C3',
                    'reason':'U04 supporta che il worker resta utile come misura del primo tentativo ma nega che sia sufficiente come percorso operativo generale.'
                },
            ],
        }

    def test_package_and_host_target_are_consistent(self):
        p=network.package(probe.CASE_ID)
        self.assertEqual(p['expectedAnswerOptionId'],'ANSWER_MIXED')
        self.assertEqual(probe.HOST_EXPECTED,{
            'answerOptionId':'ANSWER_MIXED',
            'supportedClaims':['C1','C4'],
            'unsupportedClaims':['C2'],
            'claimsNeedingRework':['C3'],
        })
        self.assertEqual(probe.FROZEN_EXTRACTOR['claims'][3]['evidenceIds'],['U03'])

    def test_three_way_partition_passes(self):
        fake=Fake(self.correct())
        with contextlib.redirect_stdout(io.StringIO()):
            result=probe.run(self.root,fake)
        self.assertEqual(result['status'],'PROPOSED_FOR_HUMAN_REVIEW')
        self.assertEqual(result['result']['status'],'ACCEPTED')
        self.assertEqual(len(fake.calls),1)

    def test_rework_claim_cannot_be_moved_to_unsupported(self):
        value=self.correct()
        value['claimsNeedingRework']=[]
        value['unsupportedClaims'].append({'claimId':'C3','reason':'errato'})
        errors=probe.validate(value,network.package(probe.CASE_ID))
        self.assertIn('PROBE_UNSUPPORTED_PARTITION_MISMATCH',errors)
        self.assertIn('PROBE_REWORK_PARTITION_MISMATCH',errors)

    def test_host_expected_not_sent_to_model(self):
        fake=Fake(self.correct())
        with contextlib.redirect_stdout(io.StringIO()):
            probe.run(self.root,fake)
        payload=json.dumps(fake.calls[0],ensure_ascii=False)
        self.assertNotIn('hostExpected',payload)
        self.assertNotIn('expectedAnswerOptionId',payload)

    def test_status_replay_uses_no_new_call(self):
        fake=Fake(self.correct())
        with contextlib.redirect_stdout(io.StringIO()):
            first=probe.run(self.root,fake)
            second=probe.status(self.root)
        self.assertEqual(first,second)
        self.assertEqual(len(fake.calls),1)


if __name__=='__main__':
    unittest.main()
