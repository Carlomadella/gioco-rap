import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import fame_four_role_network_v3 as network
import fame_single_vs_four_v2 as experiment


class Fake:
    def __init__(self,replies):
        self.replies=list(replies)
        self.chat_calls=[]
    def request(self,endpoint,payload=None):
        if endpoint=='/api/version':
            return {'version':'test'}
        if endpoint=='/api/tags':
            return {'models':[{'name':network.MODEL,'digest':network.DIGEST}]}
        if endpoint=='/api/show':
            return {}
        self.chat_calls.append(payload)
        answer=self.replies.pop(0)
        return {
            'done':True,'done_reason':'stop',
            'message':{'content':json.dumps(answer,ensure_ascii=False)},
            'total_duration':1000,'load_duration':100,
            'prompt_eval_count':100,'eval_count':50,
        }


class SingleVsFourV2Tests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'experiment'

        real_case=network.package('single-vs-four-rubric-audit-generalization-v2')
        self.fixture_id='single-vs-four-v2-regression-fixture'
        fixture=dict(real_case)
        fixture['caseId']=self.fixture_id
        fixture_dir=Path(self.temp.name)/'cases'
        fixture_dir.mkdir()
        (fixture_dir/(self.fixture_id+'.json')).write_text(
            json.dumps(fixture,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'
        )

        self.old_case_dir=network.CASE_DIR
        self.old_experiment_case=experiment.CASE_ID
        network.CASE_DIR=fixture_dir
        experiment.CASE_ID=self.fixture_id
        self.addCleanup(setattr,network,'CASE_DIR',self.old_case_dir)
        self.addCleanup(setattr,experiment,'CASE_ID',self.old_experiment_case)

        with contextlib.redirect_stdout(io.StringIO()):
            experiment.init(self.root,self.fixture_id)

    def extractor(self):
        return {'claims':[
            {'claimId':'C1','statement':'Il sidecar non promuove la rete originale a 14/14 al primo tentativo.','evidenceIds':['U03']},
            {'claimId':'C2','statement':'Il supporto contestuale resta distinto dalla prova diretta e non va generalizzato automaticamente.','evidenceIds':['U01','U02']},
        ]}

    def challenge(self):
        import fame_anti_bias as anti
        return {
            'applicability':[
                {'controlId':row['controlId'],'status':'APPLICABLE','reason':'controllo pertinente'}
                for row in anti.CONTROLS
            ],
            'issues':[],
            'overall':'ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE',
            'residualBiasUncertaintyExplicit':True,
        }

    def verifier(self):
        return {
            'answerOptionId':'ANSWER_NO',
            'decisions':[
                {'claimId':'C1','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':['U03'],'reason':'U03 lo vieta esplicitamente.'},
                {'claimId':'C2','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':['U01','U02'],'reason':'U01 e U02 distinguono forza e generalizzabilità.'},
            ],
        }

    def integrator(self):
        return {
            'answerOptionId':'ANSWER_NO',
            'usedClaimIds':['C1','C2'],
            'answer':'No. Il sidecar conserva 13/14 e il supporto contestuale resta specifico e distinto dalla prova diretta.',
            'limitations':['La rivalutazione 2/2 riguarda il recovery, non riscrive il first attempt originale.'],
        }

    def baseline(self):
        return {
            'answerOptionId':'ANSWER_NO',
            'claims':[
                {'claimId':'C1','statement':'La rete originale resta 13/14, non 14/14 al primo tentativo.','evidenceIds':['U03']},
                {'claimId':'C2','statement':'Il supporto contestuale non è una regola universale equivalente alla prova diretta.','evidenceIds':['U02']},
            ],
            'answer':'No. Il sidecar preserva il risultato storico e non generalizza il supporto contestuale.',
            'limitations':['La rivalutazione è specifica al report congelato.'],
        }

    def replies(self):
        return [self.extractor(),self.challenge(),self.verifier(),self.integrator(),self.baseline()]

    def test_network_runs_before_single_agent_and_total_calls_are_five(self):
        fake=Fake(self.replies())
        stream=io.StringIO()
        with contextlib.redirect_stdout(stream):
            result=experiment.run(self.root,fake)
        self.assertEqual(result['status'],'COMPLETE_FOR_HUMAN_REVIEW')
        self.assertEqual(len(fake.chat_calls),5)
        text=stream.getvalue()
        self.assertLess(text.index('BRACCIO 1/2: FOUR-ROLE NETWORK'),text.index('BRACCIO 2/2: SINGLE AGENT'))
        meta=json.loads((self.root/'experiment.json').read_text(encoding='utf-8'))
        self.assertEqual(meta['armOrder'],['four-role-network','single-agent'])

    def test_both_arms_use_same_case_and_cover_required_evidence(self):
        fake=Fake(self.replies())
        with contextlib.redirect_stdout(io.StringIO()):
            result=experiment.run(self.root,fake)
        self.assertTrue(result['sameFrozenQuestionAndEvidence'])
        self.assertTrue(result['singleAgent']['answerMatchesHostExpected'])
        self.assertTrue(result['fourRoleNetwork']['answerMatchesHostExpected'])
        self.assertTrue(result['singleAgent']['requiredEvidenceCoverage']['allRequiredCovered'])
        self.assertTrue(result['fourRoleNetwork']['requiredEvidenceCoverage']['allRequiredCovered'])
        self.assertEqual(result['singleAgent']['selectedEvidenceIds'],['U02','U03'])
        self.assertEqual(result['fourRoleNetwork']['selectedEvidenceIds'],['U01','U02','U03'])

    def test_expected_answer_remains_host_only(self):
        fake=Fake(self.replies())
        with contextlib.redirect_stdout(io.StringIO()):
            experiment.run(self.root,fake)
        for payload in fake.chat_calls:
            self.assertNotIn('expectedAnswerOptionId',json.dumps(payload,ensure_ascii=False))

    def test_no_automatic_winner_and_human_metrics_remain_null(self):
        fake=Fake(self.replies())
        with contextlib.redirect_stdout(io.StringIO()):
            result=experiment.run(self.root,fake)
        self.assertIsNone(result['automaticWinner'])
        self.assertFalse(result['humanReviewMeasured'])
        self.assertIsNone(result['singleAgent']['humanReviewSeconds'])
        self.assertIsNone(result['fourRoleNetwork']['humanReviewSeconds'])

    def test_comparison_is_reproducible_without_additional_calls(self):
        fake=Fake(self.replies())
        with contextlib.redirect_stdout(io.StringIO()):
            first=experiment.run(self.root,fake)
            second=experiment.compare(self.root)
        self.assertEqual(first,second)
        self.assertEqual(len(fake.chat_calls),5)


if __name__=='__main__':
    unittest.main()
