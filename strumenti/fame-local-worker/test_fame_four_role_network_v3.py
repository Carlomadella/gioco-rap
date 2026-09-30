import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import fame_four_role_network_v3 as n


class Fake:
    def __init__(self,replies):
        self.replies=list(replies)
        self.calls=[]
    def request(self,endpoint,payload=None):
        if endpoint=='/api/version':
            return {'version':'test'}
        if endpoint=='/api/tags':
            return {'models':[{'name':n.MODEL,'digest':n.DIGEST}]}
        if endpoint=='/api/show':
            return {}
        self.calls.append(payload)
        answer=self.replies.pop(0)
        return {
            'done':True,'done_reason':'stop',
            'message':{'content':json.dumps(answer,ensure_ascii=False)},
            'total_duration':100,'load_duration':20,'prompt_eval_count':10,'eval_count':5,
        }


class FameFourRoleNetworkV3Tests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'network'
        with contextlib.redirect_stdout(io.StringIO()):
            n.init(self.root,'model-comparison-generalization-network-v3')

    def extractor(self):
        return {'claims':[
            {'claimId':'C1','statement':'Qwen è stato REJECTED ma ha prodotto JSON valido con 6/10 categorie validate.','evidenceIds':['U01']},
            {'claimId':'C2','statement':'GPT-OSS è stato REJECTED per esaurimento del budget di output senza risposta strutturata.','evidenceIds':['U02']},
            {'claimId':'C3','statement':'Sul protocollo congelato Qwen è stato il risultato meno debole, ma il documento esclude una generalizzazione sui modelli.','evidenceIds':['U03']},
            {'claimId':'C4','statement':'I tempi dei due run non vanno confrontati ingenuamente perché il run Qwen include carico a freddo.','evidenceIds':['U04']},
        ]}

    def challenge(self):
        import fame_anti_bias as a
        return {
            'applicability':[
                {'controlId':row['controlId'],'status':'APPLICABLE','reason':'controllo applicabile senza issue'}
                for row in a.CONTROLS
            ],
            'issues':[],
            'overall':'ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE',
            'residualBiasUncertaintyExplicit':True,
        }

    def verifier(self,option='ANSWER_NO'):
        return {
            'answerOptionId':option,
            'decisions':[
                {'claimId':'C1','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':['U01'],'reason':'U01 sostiene il claim.'},
                {'claimId':'C2','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':['U02'],'reason':'U02 sostiene il claim.'},
                {'claimId':'C3','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':['U03'],'reason':'U03 sostiene il claim.'},
                {'claimId':'C4','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':['U04'],'reason':'U04 sostiene il claim.'},
            ],
        }

    def integrator(self,option='ANSWER_NO'):
        return {
            'answerOptionId':option,
            'usedClaimIds':['C1','C2','C3','C4'],
            'answer':'No. Qwen è stato meno debole su questo protocollo, ma il confronto non dimostra superiorità generale sui modelli.',
            'limitations':['La conclusione vale solo per il protocollo congelato.'],
        }

    def run_network(self,replies):
        fake=Fake(replies)
        with contextlib.redirect_stdout(io.StringIO()):
            result=n.run(self.root,fake)
        return fake,result

    def test_full_v3_pipeline_passes(self):
        fake,result=self.run_network([self.extractor(),self.challenge(),self.verifier(),self.integrator()])
        self.assertEqual(result['status'],n.FINAL_ACCEPTED)
        self.assertEqual(result['modelCalls'],4)
        self.assertEqual(len(fake.calls),4)

    def test_extractor_does_not_see_answer_options_or_expected_answer(self):
        fake,_=self.run_network([self.extractor(),self.challenge(),self.verifier(),self.integrator()])
        payload=fake.calls[0]['messages'][1]['content']
        self.assertNotIn('answerOptions',payload)
        self.assertNotIn('expectedAnswerOptionId',payload)
        self.assertNotIn('ANSWER_NO',payload)

    def test_verifier_sees_option_meanings_but_not_expected_answer(self):
        fake,_=self.run_network([self.extractor(),self.challenge(),self.verifier(),self.integrator()])
        payload=fake.calls[2]['messages'][1]['content']
        self.assertIn('ANSWER_YES',payload)
        self.assertIn('ANSWER_NO',payload)
        self.assertIn('meaning',payload)
        self.assertNotIn('expectedAnswerOptionId',payload)

    def test_verifier_schema_has_unambiguous_claim_statuses(self):
        p=n.package('model-comparison-generalization-network-v3')
        schema=n.verifier_schema(p,self.extractor(),self.challenge())
        status_enum=schema['properties']['decisions']['items']['properties']['status']['enum']
        self.assertEqual(status_enum,[
            'EVIDENCE_SUPPORTS_CLAIM',
            'EVIDENCE_DOES_NOT_SUPPORT_CLAIM',
            'CLAIM_NEEDS_REWORK',
        ])
        self.assertNotIn('antiBiasResolution',schema['properties'])

    def test_wrong_final_answer_option_is_rejected(self):
        _,result=self.run_network([
            self.extractor(),self.challenge(),self.verifier('ANSWER_YES'),self.integrator('ANSWER_YES')
        ])
        self.assertEqual(result['status'],'NEEDS_REVIEW')
        self.assertIn('INTEGRATOR_INCORRECT_ANSWER_OPTION',result['roles']['integrator']['errors'])

    def test_integrator_must_match_verifier_answer_option(self):
        _,result=self.run_network([
            self.extractor(),self.challenge(),self.verifier('ANSWER_NO'),self.integrator('ANSWER_INSUFFICIENT')
        ])
        self.assertEqual(result['status'],'NEEDS_REVIEW')
        self.assertIn('INTEGRATOR_VERIFIER_ANSWER_MISMATCH',result['roles']['integrator']['errors'])

    def test_evidence_on_negative_status_is_rejected(self):
        verifier=self.verifier()
        verifier['decisions'][0]['status']='EVIDENCE_DOES_NOT_SUPPORT_CLAIM'
        errors=n.validate_verifier(
            verifier,n.package('model-comparison-generalization-network-v3'),self.extractor(),self.challenge()
        )
        self.assertIn('VERIFIER_NONSUPPORTED_WITH_EVIDENCE',errors)

    def test_prior_cases_are_consumed_for_v3_init(self):
        for case_id in ('agent-network-readiness-network-v2','agent-network-readiness-network-v3'):
            other=Path(self.temp.name)/case_id
            with self.assertRaisesRegex(ValueError,'Case gia consumato'):
                n.init(other,case_id)


if __name__=='__main__':
    unittest.main()
