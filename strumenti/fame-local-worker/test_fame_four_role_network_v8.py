import unittest

import fame_four_role_network_v8 as n


class V8SelectedOptionAuditTests(unittest.TestCase):
    def setUp(self):
        self.p=n.package('adaptive-v2-tsumugi-architecture-pilot-v1')
        self.extractor={
            'claims':[
                {
                    'claimId':'C1',
                    'statement':'The formal failure is caused by the overconstrained rubric.',
                    'evidenceIds':['U02','U03','U04'],
                },
                {
                    'claimId':'C2',
                    'statement':'Both attempts produced 5/5 correct conclusions.',
                    'evidenceIds':['U02'],
                },
                {
                    'claimId':'C3',
                    'statement':'The correction applies only to future authoring and the task remains consumed.',
                    'evidenceIds':['U05','U06','U07'],
                },
            ]
        }
        self.challenge={
            'applicability':[
                {
                    'controlId':row['controlId'],
                    'status':'NOT_APPLICABLE_WITH_REASON',
                    'reason':'No issue found.'
                }
                for row in n.v7.anti_bias.CONTROLS
            ],
            'issues':[],
            'overall':'ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE',
            'residualBiasUncertaintyExplicit':True,
            'omissionReview':[
                {
                    'evidenceId':'U01',
                    'status':'NOT_MATERIAL',
                    'reason':'Matches the real V7 diagnostic failure.',
                }
            ],
        }

    def accepted_verifier(self):
        return {
            'answerOptionId':'ANSWER_RUBRIC_FALSE_NEGATIVE_DISCIPLINED',
            'supportedClaims':[
                {'claimId':'C1','evidenceIds':['U02','U03','U04'],'reason':'direct'},
                {'claimId':'C2','evidenceIds':['U02'],'reason':'direct'},
                {'claimId':'C3','evidenceIds':['U05','U06','U07'],'reason':'direct'},
            ],
            'unsupportedClaims':[],
            'claimsNeedingRework':[],
            'repairedClaims':[],
            'recoveredClaims':[
                {
                    'claimId':'O1',
                    'statement':'The run remains formally REJECTED/NEEDS_REVIEW.',
                    'evidenceIds':['U01'],
                    'reason':'U01 directly supports the formal-status clause of the selected option.',
                }
            ],
            'omissionResolution':[
                {
                    'evidenceId':'U01',
                    'status':'RECOVERED',
                    'reason':'Selected-option support requires the formal-status distinction.',
                }
            ],
            'selectedOptionAudit':{
                'optionId':'ANSWER_RUBRIC_FALSE_NEGATIVE_DISCIPLINED',
                'fullySupported':True,
                'components':[
                    {
                        'supportId':'S1',
                        'statement':'The run remains formally REJECTED/NEEDS_REVIEW.',
                        'evidenceIds':['U01'],
                    },
                    {
                        'supportId':'S2',
                        'statement':'All 5/5 conclusions were semantically correct.',
                        'evidenceIds':['U02'],
                    },
                    {
                        'supportId':'S3',
                        'statement':'The failure is a rubric/packaging false negative from overconstrained evidence coverage.',
                        'evidenceIds':['U03','U04','U05'],
                    },
                    {
                        'supportId':'S4',
                        'statement':'Generic repair could not fix a validator that imposed unnecessary coverage.',
                        'evidenceIds':['U07'],
                    },
                    {
                        'supportId':'S5',
                        'statement':'The task stays consumed and the correction applies only to future authoring.',
                        'evidenceIds':['U06','U07'],
                    },
                ],
            },
        }

    def test_real_v7_pattern_passes_when_selected_option_recovers_u01(self):
        value=self.accepted_verifier()
        self.assertEqual(n.validate_verifier(value,self.p,self.extractor,self.challenge),[])

    def test_selected_option_audit_requires_omitted_evidence_to_be_recovered(self):
        value=self.accepted_verifier()
        value['recoveredClaims']=[]
        value['omissionResolution'][0]['status']='NOT_REQUIRED'
        errors=n.validate_verifier(value,self.p,self.extractor,self.challenge)
        self.assertIn('VERIFIER_SELECTED_OPTION_OMISSION_NOT_RECOVERED',errors)
        self.assertIn('VERIFIER_INSUFFICIENT_FINAL_EVIDENCE_AFTER_RECOVERY',errors)

    def test_selected_option_audit_must_match_selected_option(self):
        value=self.accepted_verifier()
        value['selectedOptionAudit']['optionId']='ANSWER_MODEL_SEMANTIC_FAILURE'
        errors=n.validate_verifier(value,self.p,self.extractor,self.challenge)
        self.assertIn('VERIFIER_SELECTED_OPTION_AUDIT_MISMATCH',errors)

    def test_selected_option_cannot_claim_full_support_false(self):
        value=self.accepted_verifier()
        value['selectedOptionAudit']['fullySupported']=False
        errors=n.validate_verifier(value,self.p,self.extractor,self.challenge)
        self.assertIn('VERIFIER_SELECTED_OPTION_NOT_FULLY_SUPPORTED',errors)

    def test_integrator_can_use_v8_recovered_claim(self):
        verifier=self.accepted_verifier()
        answer={
            'answerOptionId':'ANSWER_RUBRIC_FALSE_NEGATIVE_DISCIPLINED',
            'usedClaimIds':['C1','C2','C3','O1'],
            'answer':'The run remains formally rejected while the semantic conclusions were correct; the rubric false negative is not retroactively promoted.',
            'limitations':[],
        }
        self.assertEqual(
            n.validate_integrator(answer,self.p,self.extractor,self.challenge,verifier),
            []
        )


if __name__=='__main__':
    unittest.main()
