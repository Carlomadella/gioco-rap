import unittest

import fame_anti_bias as anti
import fame_four_role_network_v7 as n


class V7OmissionRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.p=n.package('adaptive-v2-tsumugi-architecture-pilot-v1')
        self.extractor={
            'claims':[
                {
                    'claimId':'C1',
                    'statement':'Formal failure caused by overconstrained rubric and evidence choice.',
                    'evidenceIds':['U02','U03','U04'],
                },
                {
                    'claimId':'C2',
                    'statement':'Both attempts had 5/5 correct conclusions.',
                    'evidenceIds':['U02'],
                },
                {
                    'claimId':'C3',
                    'statement':'Future authoring changes only; task remains consumed.',
                    'evidenceIds':['U05','U06','U07'],
                },
            ]
        }
        self.challenge={
            'applicability':[
                {'controlId':row['controlId'],'status':'APPLICABLE','reason':'checked'}
                for row in anti.CONTROLS
            ],
            'issues':[],
            'overall':'ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE',
            'residualBiasUncertaintyExplicit':True,
            'omissionReview':[
                {
                    'evidenceId':'U01',
                    'status':'MATERIAL_FOR_ANSWER',
                    'reason':'Formal queue/task status is a material distinction in the question.',
                }
            ],
        }

    def verifier(self,recover=True):
        value={
            'answerOptionId':'ANSWER_RUBRIC_FALSE_NEGATIVE_DISCIPLINED',
            'supportedClaims':[
                {'claimId':'C1','evidenceIds':['U02','U03','U04'],'reason':'direct'},
                {'claimId':'C2','evidenceIds':['U02'],'reason':'direct'},
                {'claimId':'C3','evidenceIds':['U05','U06','U07'],'reason':'direct'},
            ],
            'unsupportedClaims':[],
            'claimsNeedingRework':[],
            'repairedClaims':[],
            'recoveredClaims':[],
            'omissionResolution':[
                {'evidenceId':'U01','status':'NOT_REQUIRED','reason':'not recovered'}
            ],
        }
        if recover:
            value['recoveredClaims']=[
                {
                    'claimId':'O1',
                    'statement':'The run remained formally NEEDS_REVIEW/REJECTED.',
                    'evidenceIds':['U01'],
                    'reason':'U01 directly preserves the formal result.',
                }
            ]
            value['omissionResolution']=[
                {'evidenceId':'U01','status':'RECOVERED','reason':'Recovered as O1.'}
            ]
        return value

    def test_host_detects_u01_as_public_uncovered_evidence(self):
        self.assertEqual(n.uncovered_evidence_ids(self.p,self.extractor),['U01'])

    def test_antibias_omission_review_accepts_exact_public_coverage(self):
        self.assertEqual(n.validate_antibias(self.challenge,self.p,self.extractor),[])

    def test_verifier_recovers_exact_fresh_pilot_omission(self):
        self.assertEqual(n.validate_verifier(self.verifier(True),self.p,self.extractor,self.challenge),[])

    def test_private_final_gate_still_blocks_if_material_u01_is_dismissed(self):
        errors=n.validate_verifier(self.verifier(False),self.p,self.extractor,self.challenge)
        self.assertIn('VERIFIER_INSUFFICIENT_FINAL_EVIDENCE_AFTER_RECOVERY',errors)

    def test_recovery_cannot_relabel_already_used_evidence_as_omitted(self):
        value=self.verifier(True)
        value['recoveredClaims'][0]['evidenceIds']=['U02']
        errors=n.validate_verifier(value,self.p,self.extractor,self.challenge)
        self.assertIn('VERIFIER_RECOVERY_USED_NONOMITTED_EVIDENCE',errors)
        self.assertIn('VERIFIER_OMISSION_RECOVERY_MISSING_CLAIM',errors)

    def test_integrator_can_use_recovered_claim(self):
        verifier=self.verifier(True)
        answer={
            'answerOptionId':'ANSWER_RUBRIC_FALSE_NEGATIVE_DISCIPLINED',
            'usedClaimIds':['C1','C2','C3','O1'],
            'answer':'Formal rejection, semantic correctness, rubric false negative, future-only correction.',
            'limitations':[],
        }
        self.assertEqual(
            n.validate_integrator(answer,self.p,self.extractor,self.challenge,verifier),
            []
        )


if __name__=='__main__':
    unittest.main()
