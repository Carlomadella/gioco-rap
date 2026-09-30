import unittest

import fame_four_role_network_v6 as n


class V6EvidencePreservingRepairTests(unittest.TestCase):
    def setUp(self):
        self.p=n.package('adaptive-transfer-protocol-pilot-v1')
        self.extractor={'claims':[
            {'claimId':'C1','statement':'Il run e un first-attempt raw-clean PASS.','evidenceIds':['U01']},
            {'claimId':'C2','statement':'Distinzioni transfer, salvage, costo umano, difetto rubrica e task consumato.',
             'evidenceIds':['U02','U03','U04','U05']},
        ]}
        self.challenge={
            'issues':[
                {'issueId':'ISSUE-01','controlId':'FAME-AB-04','claimIds':['C2'],'severity':'BLOCKING',
                 'problem':'Hidden assumption','evidenceIds':['U06','U07'],'requiredAction':'Provide evidence or remove.'},
                {'issueId':'ISSUE-02','controlId':'FAME-AB-05','claimIds':['C2'],'severity':'BLOCKING',
                 'problem':'Scope exceeds evidence','evidenceIds':['U02','U03','U04','U05'],'requiredAction':'Align scope.'},
                {'issueId':'ISSUE-03','controlId':'FAME-AB-06','claimIds':['C2'],'severity':'BLOCKING',
                 'problem':'Alternative limits','evidenceIds':[],'requiredAction':'Clarify conditions.'},
            ],
            'overall':'ANTI_BIAS_REWORK_REQUIRED',
        }

    def bad_v5_verifier(self):
        return {
            'answerOptionId':'ANSWER_DISCIPLINED_TRANSFER_PASS',
            'supportedClaims':[
                {'claimId':'C1','evidenceIds':['U01'],'reason':'Supported U01.'},
            ],
            'unsupportedClaims':[],
            'claimsNeedingRework':[
                {'claimId':'C2','reason':'Claim too broad.'},
            ],
            'repairedClaims':[
                {'claimId':'R1','sourceClaimId':'C2','statement':'Nuovo caso sperimentale.',
                 'evidenceIds':['U02'],'reason':'U02.'},
                {'claimId':'R2','sourceClaimId':'C2','statement':'Metrica transfer.',
                 'evidenceIds':['U03'],'reason':'U03.'},
                {'claimId':'R3','sourceClaimId':'C2','statement':'Salvage.',
                 'evidenceIds':['U04'],'reason':'U04.'},
                {'claimId':'R4','sourceClaimId':'C2','statement':'Costo umano misurato.',
                 'evidenceIds':['U05'],'reason':'U05.'},
            ],
            'antiBiasResolution':[
                {'issueId':'ISSUE-01','status':'RESOLVED_BY_REPAIR','reason':'Unsupported parts removed.'},
                {'issueId':'ISSUE-02','status':'RESOLVED_BY_REPAIR','reason':'Scope aligned.'},
                {'issueId':'ISSUE-03','status':'RESOLVED_BY_REPAIR','reason':'Conditions removed.'},
            ],
        }

    def good_verifier(self):
        value=self.bad_v5_verifier()
        value['repairedClaims'] += [
            {'claimId':'R5','sourceClaimId':'C2','statement':'La sintesi include il difetto reale della rubrica da promozione retroattiva.',
             'evidenceIds':['U06'],'reason':'U06 supporta direttamente questa distinzione.'},
            {'claimId':'R6','sourceClaimId':'C2','statement':'Il task e consumato e non va rilanciato come nuovo first attempt.',
             'evidenceIds':['U07'],'reason':'U07 supporta direttamente questa distinzione.'},
        ]
        value['antiBiasResolution'][0]['reason']='U06 e U07 sono ora preservati da R5 e R6.'
        return value

    def test_rejects_exact_v5_false_resolution_pattern(self):
        errors=n.validate_verifier(self.bad_v5_verifier(),self.p,self.extractor,self.challenge)
        self.assertIn('VERIFIER_REPAIR_MISSING_ISSUE_EVIDENCE',errors)
        self.assertIn('VERIFIER_INSUFFICIENT_FINAL_EVIDENCE_AFTER_REPAIR',errors)

    def test_accepts_repair_that_preserves_u06_u07(self):
        self.assertEqual(n.validate_verifier(self.good_verifier(),self.p,self.extractor,self.challenge),[])

    def test_host_final_coverage_is_checked_before_integrator(self):
        value=self.good_verifier()
        value['repairedClaims']=[r for r in value['repairedClaims'] if r['claimId']!='R6']
        value['antiBiasResolution'][0]['status']='UPHELD'
        errors=n.validate_verifier(value,self.p,self.extractor,self.challenge)
        self.assertIn('VERIFIER_INSUFFICIENT_FINAL_EVIDENCE_AFTER_REPAIR',errors)

    def test_integrator_accepts_complete_evidence_preserving_repair(self):
        verifier=self.good_verifier()
        answer={
            'answerOptionId':'ANSWER_DISCIPLINED_TRANSFER_PASS',
            'usedClaimIds':['C1','R1','R2','R3','R4','R5','R6'],
            'answer':'Sintesi completa e disciplinata.',
            'limitations':[],
        }
        self.assertEqual(
            n.validate_integrator(answer,self.p,self.extractor,self.challenge,verifier),
            []
        )


if __name__=='__main__':
    unittest.main()
