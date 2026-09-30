import unittest

import fame_anti_bias as a


class FameAntiBiasTests(unittest.TestCase):
    def claims(self):
        return [
            {'claimId':'C1','statement':'Uno','evidenceIds':['U01']},
            {'claimId':'C2','statement':'Due','evidenceIds':['U02']},
        ]

    def units(self):
        return [{'unitId':'U01','text':'uno'},{'unitId':'U02','text':'due'}]

    def good(self):
        return {
            'applicability':[
                {'controlId':row['controlId'],'status':'APPLICABLE','reason':'materiale'}
                for row in a.CONTROLS
            ],
            'issues':[{
                'issueId':'AB1',
                'controlId':'FAME-AB-05',
                'claimIds':['C1'],
                'severity':'NONBLOCKING',
                'problem':'scope da mantenere',
                'evidenceIds':['U01'],
                'requiredAction':'mantenere lo scope esplicito',
            }],
            'overall':'ANTI_BIAS_CHALLENGE_PASS_WITH_LIMITATIONS',
            'residualBiasUncertaintyExplicit':True,
        }

    def test_minimal_subset_is_six_controls(self):
        self.assertEqual(len(a.CONTROLS),6)
        self.assertEqual(
            set(a.CONTROL_IDS),
            {'FAME-AB-01','FAME-AB-02','FAME-AB-03','FAME-AB-04','FAME-AB-05','FAME-AB-06'}
        )

    def test_provenance_is_read_only_scientific_method(self):
        p=a.SOURCE_PROVENANCE
        self.assertEqual(p['repository'],'mycolbraga/scientific-method-ai')
        self.assertTrue(p['readOnly'])

    def test_good_challenge_passes(self):
        self.assertEqual(a.validate(self.good(),self.claims(),self.units()),[])

    def test_missing_control_is_rejected(self):
        value=self.good()
        value['applicability']=value['applicability'][:-1]
        self.assertIn('ANTI_BIAS_APPLICABILITY_COUNT',a.validate(value,self.claims(),self.units()))

    def test_blocking_issue_requires_blocking_overall(self):
        value=self.good()
        value['issues'][0]['severity']='BLOCKING'
        value['overall']='ANTI_BIAS_CHALLENGE_PASS_WITH_LIMITATIONS'
        self.assertIn('ANTI_BIAS_BLOCKING_ISSUE_NOT_REFLECTED',a.validate(value,self.claims(),self.units()))

    def test_unknown_claim_or_evidence_is_rejected(self):
        value=self.good()
        value['issues'][0]['claimIds']=['C9']
        value['issues'][0]['evidenceIds']=['U9']
        errors=a.validate(value,self.claims(),self.units())
        self.assertIn('ANTI_BIAS_ISSUE_CLAIMS',errors)
        self.assertIn('ANTI_BIAS_ISSUE_EVIDENCE',errors)


if __name__=='__main__':
    unittest.main()
