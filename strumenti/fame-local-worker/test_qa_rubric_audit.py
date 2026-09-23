import json
import contextlib
import io
import tempfile
from pathlib import Path
import qa_coordinator
from test_qa_coordinator import Fake
from test_qa_recovery import OriginalFake
import unittest
import qa_rubric_audit as audit
import qa_transfer
import qa_recovery

class AuditTests(unittest.TestCase):
    def response(self,ids,supported=True):
        return dict(done=True,done_reason='stop',message=dict(content=json.dumps(dict(supported=supported,evidenceIds=ids))))
    def test_all_fourteen_reference_decisions(self):
        qa=qa_transfer.build_engine(); text=qa.case_text()
        by_line={r['line']:r['evidenceId'] for r in qa.evidence_records(text)}
        for code in qa.CATALOG:
            with self.subTest(code=code):
                rule=qa.RUBRIC.get(code)
                ids=list(dict.fromkeys(by_line[min(g)] for g in rule['required'])) if rule else []
                self.assertEqual(audit.grade(qa,text,code,self.response(ids,bool(rule)))['status'],
                                 'SUPPORTED_DIRECT' if rule else 'CORRECT_UNSUPPORTED')
    def test_false_claims_rejected(self):
        qa=qa_transfer.build_engine()
        for code in set(qa.CATALOG)-set(qa.RUBRIC):
            self.assertEqual(audit.grade(qa,qa.case_text(),code,self.response(['E031']))['status'],'INCORRECT_CONCLUSION')
    def test_actual_recovery_contextual_and_original_preserved(self):
        qa=qa_recovery.build_engine()
        r=audit.grade(qa,qa.case_text(),'HIGH_NOTE_CAUSE_UNPROVEN',self.response([f'E{i}' for i in range(147,155)]))
        self.assertEqual(r['originalStatus'],'SEMANTIC_FAIL')
        self.assertEqual(r['status'],'SUPPORTED_CONTEXTUAL')
        self.assertEqual(len(r['surplusEvidenceIds']),5)
    def test_each_contextual_component_required(self):
        qa=qa_recovery.build_engine()
        for ids in (['E153','E154'],['E152','E153'],['E152','E154'],['E150','E151']):
            self.assertEqual(audit.grade(qa,qa.case_text(),'HIGH_NOTE_CAUSE_UNPROVEN',self.response(ids))['status'],'INSUFFICIENT_EVIDENCE')
    def test_compound_still_requires_release(self):
        qa=qa_transfer.build_engine();text=qa.case_text()
        for ids in (['E155'],['E152','E153','E154']):
            self.assertEqual(audit.grade(qa,text,qa_recovery.PARENT,self.response(ids))['status'],'INSUFFICIENT_EVIDENCE')
        self.assertEqual(audit.grade(qa,text,qa_recovery.PARENT,self.response(['E145','E152','E153','E154']))['status'],'SUPPORTED_CONTEXTUAL')
    def test_sidecar_keeps_original_bytes_and_never_calls_model(self):
        with tempfile.TemporaryDirectory() as tmp, contextlib.redirect_stdout(io.StringIO()):
            root=Path(tmp)/'source'; out=Path(tmp)/'audit'
            qa_coordinator.init(root)
            qa_coordinator.run(root,client=OriginalFake(qa_transfer.build_engine()))
            before={str(p.relative_to(root)):p.read_bytes() for p in root.rglob('*') if p.is_file()}
            result=audit.audit(root,out)
            self.assertEqual(result['originalAccepted'],13)
            self.assertEqual(result['reassessedAccepted'],13)
            self.assertEqual(result['modelCalls'],0)
            self.assertEqual(before,{str(p.relative_to(root)):p.read_bytes() for p in root.rglob('*') if p.is_file()})
            self.assertTrue((out/'audit.json').exists())

    def test_bad_ids_invalid(self):
        qa=qa_recovery.build_engine()
        for ids in (['E155','E155'],['BAD'],[]):
            self.assertEqual(audit.grade(qa,qa.case_text(),'HIGH_NOTE_CAUSE_UNPROVEN',self.response(ids))['status'],'INVALID_OUTPUT')

if __name__=='__main__': unittest.main()
