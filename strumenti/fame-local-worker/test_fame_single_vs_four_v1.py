import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import fame_four_role_network_v3 as network
import fame_single_vs_four_v1 as experiment


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


class SingleVsFourTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'experiment'

        real_case=network.package('single-vs-four-coordinator-causality-v1')
        self.fixture_id='single-vs-four-regression-fixture'
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

    def baseline(self):
        return {
            'answerOptionId':'ANSWER_NO',
            'claims':[
                {'claimId':'C1','statement':'Il miglioramento non identifica da solo la causa.','evidenceIds':['U02']},
                {'claimId':'C2','statement':'Serve verifica su nuovi documenti prima di generalizzare.','evidenceIds':['U03']},
            ],
            'answer':'No. Un miglioramento non prova causalità né generalizzazione.',
            'limitations':['Il caso è già osservato.'],
        }

    def extractor(self):
        return {'claims':[
            {'claimId':'C1','statement':'Un miglioramento sosterrebbe utilità ma non causalità.','evidenceIds':['U02']},
            {'claimId':'C2','statement':'Il risultato deve essere verificato su nuovi documenti.','evidenceIds':['U03']},
        ]}

    def challenge(self):
        import fame_anti_bias as anti
        return {
            'applicability':[
                {'controlId':row['controlId'],'status':'APPLICABLE','reason':'controllo pertinente'}
                for row in anti.CONTROLS
            ],
            'issues':[{
                'issueId':'AB1',
                'controlId':'FAME-AB-06',
                'claimIds':['C1','C2'],
                'severity':'NONBLOCKING',
                'problem':'Il caso osservato non basta per generalizzare.',
                'evidenceIds':['U03'],
                'requiredAction':'Mantenere il limite di generalizzazione.',
            }],
            'overall':'ANTI_BIAS_CHALLENGE_PASS_WITH_LIMITATIONS',
            'residualBiasUncertaintyExplicit':True,
        }

    def verifier(self):
        return {
            'answerOptionId':'ANSWER_NO',
            'decisions':[
                {'claimId':'C1','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':['U02'],'reason':'U02 è diretto.'},
                {'claimId':'C2','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':['U03'],'reason':'U03 è diretto.'},
            ],
            'antiBiasResolution':[
                {'issueId':'AB1','status':'UNRESOLVED','reason':'Serve davvero un nuovo documento.'}
            ],
        }

    def integrator(self):
        return {
            'answerOptionId':'ANSWER_NO',
            'usedClaimIds':['C1','C2'],
            'answer':'No. Il miglioramento non identifica la causa e non prova generalizzazione.',
            'limitations':['Serve verifica su nuovi documenti.'],
        }

    def test_full_experiment_uses_five_calls_and_same_case(self):
        fake=Fake([self.baseline(),self.extractor(),self.challenge(),self.verifier(),self.integrator()])
        with contextlib.redirect_stdout(io.StringIO()):
            result=experiment.run(self.root,fake)
        self.assertEqual(result['status'],'COMPLETE_FOR_HUMAN_REVIEW')
        self.assertEqual(len(fake.chat_calls),5)
        self.assertEqual(result['singleAgent']['modelCalls'],1)
        self.assertEqual(result['fourRoleNetwork']['modelCalls'],4)
        self.assertTrue(result['singleAgent']['answerMatchesHostExpected'])
        self.assertTrue(result['fourRoleNetwork']['answerMatchesHostExpected'])
        self.assertTrue(result['sameFrozenQuestionAndEvidence'])
        self.assertIsNone(result['automaticWinner'])

    def test_required_evidence_coverage_is_comparable(self):
        fake=Fake([self.baseline(),self.extractor(),self.challenge(),self.verifier(),self.integrator()])
        with contextlib.redirect_stdout(io.StringIO()):
            result=experiment.run(self.root,fake)
        self.assertTrue(result['singleAgent']['requiredEvidenceCoverage']['allRequiredCovered'])
        self.assertTrue(result['fourRoleNetwork']['requiredEvidenceCoverage']['allRequiredCovered'])
        self.assertEqual(result['singleAgent']['selectedEvidenceIds'],['U02','U03'])
        self.assertEqual(result['fourRoleNetwork']['selectedEvidenceIds'],['U02','U03'])

    def test_expected_answer_never_reaches_model_requests(self):
        fake=Fake([self.baseline(),self.extractor(),self.challenge(),self.verifier(),self.integrator()])
        with contextlib.redirect_stdout(io.StringIO()):
            experiment.run(self.root,fake)
        for payload in fake.chat_calls:
            text=json.dumps(payload,ensure_ascii=False)
            self.assertNotIn('expectedAnswerOptionId',text)

    def test_comparison_records_load_separately_and_human_metrics_null(self):
        fake=Fake([self.baseline(),self.extractor(),self.challenge(),self.verifier(),self.integrator()])
        with contextlib.redirect_stdout(io.StringIO()):
            result=experiment.run(self.root,fake)
        self.assertEqual(result['singleAgent']['usage']['load_duration'],100)
        self.assertEqual(result['fourRoleNetwork']['usage']['load_duration'],400)
        self.assertEqual(result['singleAgent']['usage']['modelDurationExcludingLoadNs'],900)
        self.assertEqual(result['fourRoleNetwork']['usage']['modelDurationExcludingLoadNs'],3600)
        self.assertIsNone(result['singleAgent']['humanReviewSeconds'])
        self.assertIsNone(result['fourRoleNetwork']['humanReviewSeconds'])
        self.assertFalse(result['humanReviewMeasured'])

    def test_antibias_unresolved_nonblocking_issue_is_counted(self):
        fake=Fake([self.baseline(),self.extractor(),self.challenge(),self.verifier(),self.integrator()])
        with contextlib.redirect_stdout(io.StringIO()):
            result=experiment.run(self.root,fake)
        self.assertEqual(result['fourRoleNetwork']['antiBiasIssueCount'],1)
        self.assertEqual(result['fourRoleNetwork']['antiBiasBlockingIssueCount'],0)
        self.assertEqual(result['fourRoleNetwork']['antiBiasUnresolvedIssueCount'],1)

    def test_status_is_reproducible_without_new_calls(self):
        fake=Fake([self.baseline(),self.extractor(),self.challenge(),self.verifier(),self.integrator()])
        with contextlib.redirect_stdout(io.StringIO()):
            first=experiment.run(self.root,fake)
            second=experiment.compare(self.root)
        self.assertEqual(first,second)
        self.assertEqual(len(fake.chat_calls),5)


if __name__=='__main__':
    unittest.main()
