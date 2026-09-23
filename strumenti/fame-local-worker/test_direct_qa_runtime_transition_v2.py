import json
import unittest

import direct_qa_worker_v2 as w


TASK='local-worker-runtime-transition-v2'


def good():
    return {'results':[
        {'code':'CLINE_FAILURE_CLASSES','supported':True,'evidenceIds':['U02','U03']},
        {'code':'DIRECT_RUNTIME_CONTRACT','supported':True,'evidenceIds':['U05']},
        {'code':'DIRECT_ISOLATION_RESULT','supported':True,'evidenceIds':['U08']},
        {'code':'CLINE_EXCLUSIVE_CAUSE','supported':False,'evidenceIds':[]},
        {'code':'AUTONOMOUS_PRODUCTION_AUTHORIZED','supported':False,'evidenceIds':[]},
    ]}


class RuntimeTransitionV2PackageTests(unittest.TestCase):
    def test_package_is_frozen_and_reconstructs_source(self):
        p=w.package(TASK)
        self.assertEqual(p['taskId'],TASK)
        self.assertEqual(len(p['units']),10)
        self.assertEqual(len(p['checks']),5)

    def test_expected_answer_is_accepted(self):
        p=w.package(TASK)
        result=w.assess(good(),p)
        self.assertTrue(result['accepted'])
        self.assertEqual(result['errors'],[])

    def test_compound_cline_failure_needs_both_semantic_blocks(self):
        p=w.package(TASK)
        answer=json.loads(json.dumps(good()))
        answer['results'][0]['evidenceIds']=['U02']
        result=w.assess(answer,p)
        self.assertFalse(result['accepted'])
        self.assertIn('CLINE_FAILURE_CLASSES:INSUFFICIENT_EVIDENCE',result['errors'])

    def test_direct_pass_cannot_be_promoted_to_exclusive_causality(self):
        p=w.package(TASK)
        answer=json.loads(json.dumps(good()))
        answer['results'][3]={'code':'CLINE_EXCLUSIVE_CAUSE','supported':True,'evidenceIds':['U09']}
        result=w.assess(answer,p)
        self.assertFalse(result['accepted'])
        self.assertIn('CLINE_EXCLUSIVE_CAUSE:INCORRECT_CONCLUSION',result['errors'])

    def test_payload_does_not_expose_host_rubric(self):
        p=w.package(TASK)
        request=json.dumps(w.payload(p),ensure_ascii=False)
        self.assertNotIn('requiredGroups',request)
        self.assertNotIn('benignContext',request)
        self.assertNotIn('"rubric"',request)


if __name__=='__main__':
    unittest.main()
