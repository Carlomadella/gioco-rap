import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import direct_qa_queue_v2 as q
import direct_qa_worker_v2 as w


RECOVERY='recovery-protocol-v2'
AUDIT='rubric-audit-protocol-v2'


def recovery_good():
    return {'results':[
        {'code':'FIRST_PASS_IMMUTABLE','supported':True,'evidenceIds':['U04']},
        {'code':'NO_ORACLE_OR_AUTO_RETRY','supported':True,'evidenceIds':['U02','U03']},
        {'code':'RECOVERY_NOT_TRANSFER_PROOF','supported':True,'evidenceIds':['U05']},
        {'code':'RECOVERY_AUTHORIZES_TRAINING','supported':False,'evidenceIds':[]},
        {'code':'LOCAL_HASH_IS_INDEPENDENT_SIGNATURE','supported':False,'evidenceIds':[]},
    ]}


def audit_good():
    return {'results':[
        {'code':'SEMANTIC_FAIL_NOT_UNDERSTANDING_PROOF','supported':True,'evidenceIds':['U01']},
        {'code':'DIRECT_CONTEXTUAL_STRENGTH','supported':True,'evidenceIds':['U01','U03']},
        {'code':'SIDECAR_PRESERVES_HISTORY','supported':True,'evidenceIds':['U03']},
        {'code':'CONTEXTUAL_RULE_IS_UNIVERSAL','supported':False,'evidenceIds':[]},
        {'code':'AUDIT_PROMOTES_OPERATIONAL_NETWORK','supported':False,'evidenceIds':[]},
    ]}


class RecoveryAuditV2PackageTests(unittest.TestCase):
    def test_recovery_package_loads_and_reconstructs_source(self):
        p=w.package(RECOVERY)
        self.assertEqual(p['taskId'],RECOVERY)
        self.assertEqual(len(p['units']),6)
        self.assertEqual(len(p['checks']),5)

    def test_audit_package_loads_and_reconstructs_source(self):
        p=w.package(AUDIT)
        self.assertEqual(p['taskId'],AUDIT)
        self.assertEqual(len(p['units']),6)
        self.assertEqual(len(p['checks']),5)

    def test_recovery_expected_answer_is_accepted(self):
        result=w.assess(recovery_good(),w.package(RECOVERY))
        self.assertTrue(result['accepted'])
        self.assertEqual(result['errors'],[])

    def test_audit_expected_answer_is_accepted(self):
        result=w.assess(audit_good(),w.package(AUDIT))
        self.assertTrue(result['accepted'])
        self.assertEqual(result['errors'],[])

    def test_recovery_no_oracle_claim_needs_both_protocol_blocks(self):
        answer=json.loads(json.dumps(recovery_good()))
        answer['results'][1]['evidenceIds']=['U02']
        result=w.assess(answer,w.package(RECOVERY))
        self.assertFalse(result['accepted'])
        self.assertIn('NO_ORACLE_OR_AUTO_RETRY:INSUFFICIENT_EVIDENCE',result['errors'])

    def test_recovery_cannot_authorize_training(self):
        answer=json.loads(json.dumps(recovery_good()))
        answer['results'][3]={'code':'RECOVERY_AUTHORIZES_TRAINING','supported':True,'evidenceIds':['U04']}
        result=w.assess(answer,w.package(RECOVERY))
        self.assertFalse(result['accepted'])
        self.assertIn('RECOVERY_AUTHORIZES_TRAINING:INCORRECT_CONCLUSION',result['errors'])

    def test_audit_direct_contextual_claim_needs_both_blocks(self):
        answer=json.loads(json.dumps(audit_good()))
        answer['results'][1]['evidenceIds']=['U01']
        result=w.assess(answer,w.package(AUDIT))
        self.assertFalse(result['accepted'])
        self.assertIn('DIRECT_CONTEXTUAL_STRENGTH:INSUFFICIENT_EVIDENCE',result['errors'])

    def test_audit_contextual_rule_cannot_be_universalized(self):
        answer=json.loads(json.dumps(audit_good()))
        answer['results'][3]={'code':'CONTEXTUAL_RULE_IS_UNIVERSAL','supported':True,'evidenceIds':['U01']}
        result=w.assess(answer,w.package(AUDIT))
        self.assertFalse(result['accepted'])
        self.assertIn('CONTEXTUAL_RULE_IS_UNIVERSAL:INCORRECT_CONCLUSION',result['errors'])

    def test_declared_benign_context_warns_without_rejecting(self):
        answer=json.loads(json.dumps(recovery_good()))
        answer['results'][0]['evidenceIds']=['U04','U01']
        result=w.assess(answer,w.package(RECOVERY))
        self.assertTrue(result['accepted'])
        row=result['assessments'][0]
        self.assertEqual(row['precisionWarnings'],['U01'])
        self.assertEqual(row['unreviewedEvidenceIds'],[])

    def test_undeclared_extra_evidence_still_rejects(self):
        answer=json.loads(json.dumps(audit_good()))
        answer['results'][0]['evidenceIds']=['U01','U02']
        result=w.assess(answer,w.package(AUDIT))
        self.assertFalse(result['accepted'])
        self.assertIn('SEMANTIC_FAIL_NOT_UNDERSTANDING_PROOF:UNREVIEWED_EVIDENCE',result['errors'])
        self.assertEqual(result['assessments'][0]['unreviewedEvidenceIds'],['U02'])

    def test_payloads_hide_host_rubrics_and_two_desk_init_is_pending(self):
        for task in (RECOVERY,AUDIT):
            request=json.dumps(w.payload(w.package(task)),ensure_ascii=False)
            self.assertNotIn('requiredGroups',request)
            self.assertNotIn('benignContext',request)
            self.assertNotIn('"rubric"',request)
        with tempfile.TemporaryDirectory() as d,contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'q'
            q.init(root,[RECOVERY,AUDIT])
            state=q.state(root)
            self.assertEqual(state['status'],'PENDING')
            self.assertEqual(
                [(r['taskId'],r['status'],r['modelCalls']) for r in state['results']],
                [(RECOVERY,'NOT_RUN',0),(AUDIT,'NOT_RUN',0)]
            )


if __name__=='__main__':
    unittest.main()
