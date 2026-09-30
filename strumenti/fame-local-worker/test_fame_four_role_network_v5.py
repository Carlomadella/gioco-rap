import unittest

import fame_four_role_network_v5 as n


class V5BoundedRepairTests(unittest.TestCase):
    def setUp(self):
        self.p=n.package('adaptive-transfer-protocol-pilot-v1')
        self.extractor={'claims':[
            {'claimId':'C1','statement':'Il run e un first-attempt raw-clean PASS.','evidenceIds':['U01']},
            {'claimId':'C2','statement':'Distinzioni transfer, salvage, costo umano, difetto rubrica e task consumato.','evidenceIds':['U02','U03','U04','U05']},
        ]}
        self.challenge={
            'issues':[
                {'issueId':'I1','claimIds':['C2'],'severity':'BLOCKING'},
                {'issueId':'I2','claimIds':['C2'],'severity':'BLOCKING'},
                {'issueId':'I3','claimIds':['C2'],'severity':'BLOCKING'},
            ],
            'overall':'ANTI_BIAS_REWORK_REQUIRED',
        }

    def verifier(self):
        return {
            'answerOptionId':'ANSWER_DISCIPLINED_TRANSFER_PASS',
            'supportedClaims':[
                {'claimId':'C1','evidenceIds':['U01'],'reason':'U01 supporta direttamente il PASS raw-clean.'},
            ],
            'unsupportedClaims':[],
            'claimsNeedingRework':[
                {'claimId':'C2','reason':'Claim troppo ampio e con coverage incompleta.'},
            ],
            'repairedClaims':[
                {'claimId':'R1','sourceClaimId':'C2','statement':'Il worker distingue nuovo caso, transfer, salvage e costo umano misurato.',
                 'evidenceIds':['U02','U03','U04','U05'],'reason':'Split atomico entro il limite di quattro evidenze.'},
                {'claimId':'R2','sourceClaimId':'C2','statement':'Il report distingue un difetto reale della rubrica dalla promozione retroattiva.',
                 'evidenceIds':['U06'],'reason':'Supporto diretto U06.'},
                {'claimId':'R3','sourceClaimId':'C2','statement':'Il task e consumato e non va rilanciato come nuovo first attempt.',
                 'evidenceIds':['U07'],'reason':'Supporto diretto U07.'},
            ],
            'antiBiasResolution':[
                {'issueId':'I1','status':'RESOLVED_BY_REPAIR','reason':'Il claim ampio e stato diviso e ricoperto da U02-U07.'},
                {'issueId':'I2','status':'RESOLVED_BY_REPAIR','reason':'La mappa evidenze ora corrisponde ai claim riparati.'},
                {'issueId':'I3','status':'RESOLVED_BY_REPAIR','reason':'Le condizioni contestate sono esplicitate in claim separati.'},
            ],
        }

    def test_repair_contract_accepts_split_claim(self):
        self.assertEqual(n.validate_verifier(self.verifier(),self.p,self.extractor,self.challenge),[])

    def test_repair_must_come_from_rework_claim(self):
        value=self.verifier()
        value['repairedClaims'][0]['sourceClaimId']='C1'
        self.assertIn('VERIFIER_REPAIR_SOURCE_NOT_REWORK',
                      n.validate_verifier(value,self.p,self.extractor,self.challenge))

    def test_resolved_by_repair_requires_actual_repair(self):
        value=self.verifier()
        value['repairedClaims']=[]
        self.assertIn('VERIFIER_REPAIR_DOES_NOT_RESOLVE_ISSUE',
                      n.validate_verifier(value,self.p,self.extractor,self.challenge))

    def test_integrator_accepts_complete_repaired_coverage(self):
        answer={
            'answerOptionId':'ANSWER_DISCIPLINED_TRANSFER_PASS',
            'usedClaimIds':['C1','R1','R2','R3'],
            'answer':'Sintesi disciplinata completa.',
            'limitations':[],
        }
        self.assertEqual(
            n.validate_integrator(answer,self.p,self.extractor,self.challenge,self.verifier()),
            []
        )

    def test_integrator_blocks_unresolved_blocking_issue(self):
        value=self.verifier()
        value['antiBiasResolution'][0]['status']='UPHELD'
        answer={
            'answerOptionId':'ANSWER_DISCIPLINED_TRANSFER_PASS',
            'usedClaimIds':['C1','R1','R2','R3'],
            'answer':'Sintesi disciplinata completa.',
            'limitations':[],
        }
        self.assertIn(
            'INTEGRATOR_BLOCKING_ANTIBIAS_UNRESOLVED',
            n.validate_integrator(answer,self.p,self.extractor,self.challenge,value)
        )


if __name__=='__main__':
    unittest.main()
