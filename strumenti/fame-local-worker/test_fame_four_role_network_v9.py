import unittest

import fame_four_role_network_v9 as n


class V9HostAuditReconciliationTests(unittest.TestCase):
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
                    'reason':'Matches the real V8 diagnostic.',
                }
            ],
        }

    def raw_v8_failure(self):
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
            'recoveredClaims':[],
            'omissionResolution':[
                {
                    'evidenceId':'U01',
                    'status':'NOT_REQUIRED',
                    'reason':'Matches the real V8 contradiction.',
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
                        'statement':'The 5/5 conclusions were semantically correct.',
                        'evidenceIds':['U02'],
                    },
                    {
                        'supportId':'S3',
                        'statement':'The failure derives from an overconstrained rubric.',
                        'evidenceIds':['U04'],
                    },
                    {
                        'supportId':'S4',
                        'statement':'The generic repair could not correct the issue.',
                        'evidenceIds':['U07'],
                    },
                    {
                        'supportId':'S5',
                        'statement':'The task remains consumed.',
                        'evidenceIds':['U06'],
                    },
                    {
                        'supportId':'S6',
                        'statement':'The correction applies only to future authoring.',
                        'evidenceIds':['U05','U07'],
                    },
                ],
            },
        }

    def test_real_v8_raw_failure_is_reconciled_deterministically(self):
        raw=self.raw_v8_failure()
        effective,summary=n.effective_verifier(raw,self.p,self.extractor)
        self.assertTrue(summary['applied'])
        self.assertEqual(summary['overriddenResolutions'],['U01'])
        self.assertEqual(len(summary['derivedClaims']),1)
        claim=summary['derivedClaims'][0]
        self.assertEqual(claim['statement'],'The run remains formally REJECTED/NEEDS_REVIEW.')
        self.assertEqual(claim['evidenceIds'],['U01'])
        self.assertEqual(effective['omissionResolution'][0]['status'],'RECOVERED')
        self.assertEqual(n.validate_verifier(raw,self.p,self.extractor,self.challenge),[])

    def test_raw_verifier_output_is_not_mutated(self):
        raw=self.raw_v8_failure()
        n.effective_verifier(raw,self.p,self.extractor)
        self.assertEqual(raw['recoveredClaims'],[])
        self.assertEqual(raw['omissionResolution'][0]['status'],'NOT_REQUIRED')

    def test_mixed_evidence_component_is_not_auto_rewritten(self):
        raw=self.raw_v8_failure()
        raw['selectedOptionAudit']['components'][0]['evidenceIds']=['U01','U02']
        effective,summary=n.effective_verifier(raw,self.p,self.extractor)
        self.assertFalse(summary['applied'])
        self.assertEqual(summary['skippedMixedComponents'],['S1'])
        self.assertEqual(effective['recoveredClaims'],[])
        errors=n.validate_verifier(raw,self.p,self.extractor,self.challenge)
        self.assertIn('VERIFIER_SELECTED_OPTION_OMISSION_NOT_RECOVERED',errors)
        self.assertIn('VERIFIER_INSUFFICIENT_FINAL_EVIDENCE_AFTER_RECOVERY',errors)

    def test_mismatched_option_audit_is_never_reconciled(self):
        raw=self.raw_v8_failure()
        raw['selectedOptionAudit']['optionId']='ANSWER_MODEL_SEMANTIC_FAILURE'
        effective,summary=n.effective_verifier(raw,self.p,self.extractor)
        self.assertFalse(summary['applied'])
        self.assertEqual(effective['recoveredClaims'],[])
        errors=n.validate_verifier(raw,self.p,self.extractor,self.challenge)
        self.assertIn('VERIFIER_SELECTED_OPTION_AUDIT_MISMATCH',errors)

    def test_false_full_support_is_never_reconciled(self):
        raw=self.raw_v8_failure()
        raw['selectedOptionAudit']['fullySupported']=False
        effective,summary=n.effective_verifier(raw,self.p,self.extractor)
        self.assertFalse(summary['applied'])
        self.assertEqual(effective['recoveredClaims'],[])
        errors=n.validate_verifier(raw,self.p,self.extractor,self.challenge)
        self.assertIn('VERIFIER_SELECTED_OPTION_NOT_FULLY_SUPPORTED',errors)

    def test_integrator_can_use_host_derived_recovery(self):
        raw=self.raw_v8_failure()
        effective,summary=n.effective_verifier(raw,self.p,self.extractor)
        derived=summary['derivedClaims'][0]['claimId']
        answer={
            'answerOptionId':'ANSWER_RUBRIC_FALSE_NEGATIVE_DISCIPLINED',
            'usedClaimIds':['C1','C2','C3',derived],
            'answer':'The run remains formally rejected while the conclusions were semantically correct; the rubric failure does not justify a retroactive rerun.',
            'limitations':[],
        }
        self.assertEqual(
            n.validate_integrator(answer,self.p,self.extractor,self.challenge,raw),
            []
        )


if __name__=='__main__':
    unittest.main()
