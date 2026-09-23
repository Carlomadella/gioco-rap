import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import direct_qa_queue_v2 as q
import direct_qa_worker_v2 as w


TRANSFER='transfer-protocol-v2'
REVIEW='review-boundary-v2'


def transfer_good():
    return {'results':[
        {'code':'FROZEN_ENGINE_NEW_CASE_ONLY','supported':True,'evidenceIds':['U02']},
        {'code':'PRIMARY_TRANSFER_PASS_STRICT','supported':True,'evidenceIds':['U03']},
        {'code':'HUMAN_REVIEW_STILL_REQUIRED','supported':True,'evidenceIds':['U03']},
        {'code':'TRANSFER_IS_BLIND','supported':False,'evidenceIds':[]},
        {'code':'RUBRIC_DEFECT_RETRO_PASS','supported':False,'evidenceIds':[]},
        {'code':'PASS_CERTIFIES_MULTIAGENT','supported':False,'evidenceIds':[]},
    ]}


def review_good():
    return {'results':[
        {'code':'HOST_OWNS_ACTION_POLICY','supported':True,'evidenceIds':['U03']},
        {'code':'VALIDATED_NOT_EXECUTION_AUTH','supported':True,'evidenceIds':['U03']},
        {'code':'RETRY_ASSISTED_NOT_SPONTANEOUS','supported':True,'evidenceIds':['U04']},
        {'code':'V6_SALVAGE_IF_COVERAGE_COMPLETE','supported':True,'evidenceIds':['U08']},
        {'code':'V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING','supported':False,'evidenceIds':[]},
        {'code':'MODEL_HAS_REPO_SHELL','supported':False,'evidenceIds':[]},
        {'code':'SINGLE_REPORT_PROVES_NETWORK_READY','supported':False,'evidenceIds':[]},
    ]}


class TransferReviewV2PackageTests(unittest.TestCase):
    def test_transfer_package_loads(self):
        p=w.package(TRANSFER)
        self.assertEqual(p['taskId'],TRANSFER)
        self.assertEqual(len(p['units']),6)
        self.assertEqual(len(p['checks']),6)

    def test_review_package_loads(self):
        p=w.package(REVIEW)
        self.assertEqual(p['taskId'],REVIEW)
        self.assertEqual(len(p['units']),8)
        self.assertEqual(len(p['checks']),7)

    def test_transfer_expected_answer_is_accepted(self):
        result=w.assess(transfer_good(),w.package(TRANSFER))
        self.assertTrue(result['accepted'])
        self.assertEqual(result['errors'],[])

    def test_review_expected_answer_is_accepted(self):
        result=w.assess(review_good(),w.package(REVIEW))
        self.assertTrue(result['accepted'])
        self.assertEqual(result['errors'],[])

    def test_transfer_primary_metric_requires_u03(self):
        answer=json.loads(json.dumps(transfer_good()))
        answer['results'][1]['evidenceIds']=['U05']
        result=w.assess(answer,w.package(TRANSFER))
        self.assertFalse(result['accepted'])
        self.assertIn('PRIMARY_TRANSFER_PASS_STRICT:INSUFFICIENT_EVIDENCE',result['errors'])

    def test_transfer_cannot_be_promoted_to_blind_test(self):
        answer=json.loads(json.dumps(transfer_good()))
        answer['results'][3]={'code':'TRANSFER_IS_BLIND','supported':True,'evidenceIds':['U02']}
        result=w.assess(answer,w.package(TRANSFER))
        self.assertFalse(result['accepted'])
        self.assertIn('TRANSFER_IS_BLIND:INCORRECT_CONCLUSION',result['errors'])

    def test_rubric_defect_cannot_retroactively_create_pass(self):
        answer=json.loads(json.dumps(transfer_good()))
        answer['results'][4]={'code':'RUBRIC_DEFECT_RETRO_PASS','supported':True,'evidenceIds':['U05']}
        result=w.assess(answer,w.package(TRANSFER))
        self.assertFalse(result['accepted'])
        self.assertIn('RUBRIC_DEFECT_RETRO_PASS:INCORRECT_CONCLUSION',result['errors'])

    def test_review_host_action_policy_requires_u03(self):
        answer=json.loads(json.dumps(review_good()))
        answer['results'][0]['evidenceIds']=['U07']
        result=w.assess(answer,w.package(REVIEW))
        self.assertFalse(result['accepted'])
        self.assertIn('HOST_OWNS_ACTION_POLICY:INSUFFICIENT_EVIDENCE',result['errors'])

    def test_review_v6_salvage_rule_accepts_complete_u08(self):
        result=w.assess(review_good(),w.package(REVIEW))
        row=next(x for x in result['assessments'] if x['code']=='V6_SALVAGE_IF_COVERAGE_COMPLETE')
        self.assertTrue(result['accepted'])
        self.assertEqual(row['coverage'],'SUFFICIENT')

    def test_review_cannot_drop_irrelevant_evidence_when_coverage_missing(self):
        answer=json.loads(json.dumps(review_good()))
        answer['results'][4]={
            'code':'V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING',
            'supported':True,
            'evidenceIds':['U08'],
        }
        result=w.assess(answer,w.package(REVIEW))
        self.assertFalse(result['accepted'])
        self.assertIn('V6_DROPS_EXTRA_WHEN_COVERAGE_MISSING:INCORRECT_CONCLUSION',result['errors'])

    def test_declared_benign_context_warns_without_rejecting(self):
        answer=json.loads(json.dumps(transfer_good()))
        answer['results'][1]['evidenceIds']=['U03','U05']
        result=w.assess(answer,w.package(TRANSFER))
        self.assertTrue(result['accepted'])
        row=result['assessments'][1]
        self.assertEqual(row['precisionWarnings'],['U05'])
        self.assertEqual(row['unreviewedEvidenceIds'],[])

    def test_undeclared_extra_evidence_is_rejected(self):
        answer=json.loads(json.dumps(review_good()))
        answer['results'][0]['evidenceIds']=['U03','U01']
        result=w.assess(answer,w.package(REVIEW))
        self.assertFalse(result['accepted'])
        self.assertIn('HOST_OWNS_ACTION_POLICY:UNREVIEWED_EVIDENCE',result['errors'])
        self.assertEqual(result['assessments'][0]['unreviewedEvidenceIds'],['U01'])

    def test_payloads_hide_rubrics_and_two_desk_init_is_pending(self):
        for task in (TRANSFER,REVIEW):
            request=json.dumps(w.payload(w.package(task)),ensure_ascii=False)
            self.assertNotIn('requiredGroups',request)
            self.assertNotIn('benignContext',request)
            self.assertNotIn('"rubric"',request)
        with tempfile.TemporaryDirectory() as d,contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'q'
            q.init(root,[TRANSFER,REVIEW])
            state=q.state(root)
            self.assertEqual(state['status'],'PENDING')
            self.assertEqual(
                [(r['taskId'],r['status'],r['modelCalls']) for r in state['results']],
                [(TRANSFER,'NOT_RUN',0),(REVIEW,'NOT_RUN',0)]
            )


if __name__=='__main__':
    unittest.main()
