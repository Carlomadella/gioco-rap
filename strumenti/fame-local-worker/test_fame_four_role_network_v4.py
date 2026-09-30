import json
import tempfile
import unittest
from pathlib import Path

import fame_four_role_network_v4 as n


class V4ContractTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.old=n.CASE_DIR
        base=n.package('model-comparison-generalization-network-v3')
        self.case='v4-contract-fixture'
        d=Path(self.tmp.name)
        p=dict(base); p['caseId']=self.case
        (d/(self.case+'.json')).write_text(json.dumps(p,ensure_ascii=False),encoding='utf-8')
        n.CASE_DIR=d
        self.addCleanup(setattr,n,'CASE_DIR',self.old)

    def extractor(self):
        return {'claims':[
            {'claimId':'C1','statement':'a','evidenceIds':['U01']},
            {'claimId':'C2','statement':'b','evidenceIds':['U02']},
        ]}

    def challenge(self):
        return {'applicability':[],'issues':[],'overall':'ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE','residualBiasUncertaintyExplicit':True}

    def verifier(self):
        return {
            'answerOptionId':'ANSWER_NO',
            'supportedClaims':[{'claimId':'C1','evidenceIds':['U01'],'reason':'ok'}],
            'unsupportedClaims':[{'claimId':'C2','reason':'no'}],
            'claimsNeedingRework':[],
        }

    def test_schema_separates_evidence(self):
        p=n.package(self.case)
        s=n.verifier_schema(p,self.extractor(),self.challenge())['properties']
        self.assertIn('evidenceIds',s['supportedClaims']['items']['properties'])
        self.assertNotIn('evidenceIds',s['unsupportedClaims']['items']['properties'])
        self.assertNotIn('evidenceIds',s['claimsNeedingRework']['items']['properties'])
        self.assertNotIn('decisions',s)

    def test_partition_valid(self):
        self.assertEqual(n.validate_verifier(self.verifier(),n.package(self.case),self.extractor(),self.challenge()),[])

    def test_duplicate_partition_rejected(self):
        v=self.verifier()
        v['claimsNeedingRework']=[{'claimId':'C1','reason':'dup'}]
        self.assertIn('VERIFIER_CLAIM_PARTITION',n.validate_verifier(v,n.package(self.case),self.extractor(),self.challenge()))

    def test_legacy_shape_rejected(self):
        v={'answerOptionId':'ANSWER_NO','decisions':[]}
        self.assertEqual(n.validate_verifier(v,n.package(self.case),self.extractor(),self.challenge()),['VERIFIER_OUTPUT_CONTRACT'])

    def test_integrator_uses_only_supported(self):
        v=self.verifier()
        answer={'answerOptionId':'ANSWER_NO','usedClaimIds':['C2'],'answer':'x','limitations':[]}
        errors=n.validate_integrator(answer,n.package(self.case),self.extractor(),self.challenge(),v)
        self.assertIn('INTEGRATOR_USED_UNSUPPORTED_CLAIM',errors)


if __name__=='__main__':
    unittest.main()
