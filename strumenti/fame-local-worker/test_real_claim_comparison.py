import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import real_claim_comparison as w


SUITE=Path(__file__).with_name('real_claim_comparison_cases.json')


class Fake:
    def __init__(self,mode=None):
        self.mode=mode
        self.calls=[]

    def request(self,endpoint,payload=None):
        if endpoint=='/api/version':return {'version':'simulated'}
        if endpoint=='/api/tags':
            return {'models':[{'name':w.MODEL,'digest':'wrong' if self.mode=='digest' else w.DIGEST}]}
        if endpoint=='/api/show':return {}
        self.calls.append(payload)
        if self.mode=='timeout':raise TimeoutError('simulated')

        data=json.loads(payload['messages'][1]['content'])
        suite=w.load_suite(SUITE)
        targets={c['id']:c['expected'] for c in suite['cases']}

        if isinstance(data,dict) and 'claims' in data:
            rows=[]
            for c in data['claims']:
                target=targets[c['id']]
                verdict=target['verdict']
                evidence=[g[0] for g in target['requiredGroups']]
                if self.mode=='baseline_bad' and c['id']=='R03':
                    verdict='SUPPORTED'
                    evidence=['U23']
                rows.append(dict(id=c['id'],verdict=verdict,evidenceIds=evidence))
            answer={'results':rows}
        elif isinstance(data,dict) and 'suggestedEvidenceIds' in data:
            target=targets[data['id']]
            verdict=target['verdict']
            evidence=[g[0] for g in target['requiredGroups']]
            if self.mode=='staged_bad' and data['id']=='R03':
                verdict='SUPPORTED'
                evidence=['U23']
            answer=dict(verdict=verdict,evidenceIds=evidence)
        else:
            target=targets[data['id']]
            answer={'evidenceIds':[g[0] for g in target['requiredGroups']]}

        return {'done':True,'done_reason':'stop','message':{'content':json.dumps(answer)}}


class RealClaimComparisonTests(unittest.TestCase):
    def run_fake(self,mode=None):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)/'run'
            fake=Fake(mode)
            with contextlib.redirect_stdout(io.StringIO()):
                result=w.execute(root,SUITE,fake)
            self.assertTrue((root/'report.json').exists())
            self.assertTrue((root/'receipt.json').exists())
            return result,fake,root

    def test_suite_reconstructs_frozen_real_source(self):
        suite=w.load_suite(SUITE)
        self.assertEqual(len(suite['units']),29)
        self.assertEqual(len(suite['cases']),6)
        self.assertEqual(
            [c['expected']['verdict'] for c in suite['cases']],
            ['SUPPORTED','SUPPORTED','CONTRADICTED','CONTRADICTED','UNKNOWN','UNKNOWN'],
        )

    def test_full_cycle_same_semantics_all_pass(self):
        result,fake,_=self.run_fake()
        self.assertEqual(result['calls'],13)
        self.assertEqual(result['baselineAccepted'],6)
        self.assertEqual(result['stagedAccepted'],6)
        self.assertTrue(result['baselineAllPass'])
        self.assertTrue(result['stagedAllPass'])
        self.assertEqual(result['comparison'],'NO_GAIN')
        self.assertTrue(result['sameSemantics'])
        self.assertTrue(result['sameRubric'])
        self.assertEqual(len(fake.calls),13)

    def test_targets_and_rubrics_never_sent(self):
        _,fake,_=self.run_fake()
        for request in fake.calls:
            serialized=json.dumps(request,ensure_ascii=False)
            self.assertNotIn('"expected"',serialized)
            self.assertNotIn('requiredGroups',serialized)
            self.assertNotIn('sourceSha256',serialized)
            self.assertNotIn('executionAuthorized',serialized)

    def test_baseline_and_judges_share_ternary_system_and_labels(self):
        _,fake,_=self.run_fake()
        baseline=fake.calls[0]
        self.assertEqual(baseline['messages'][0]['content'],w.SYSTEM)
        self.assertEqual(
            baseline['format']['properties']['results']['items']['properties']['verdict']['enum'],
            w.LABELS,
        )
        judges=[
            req for req in fake.calls[1:]
            if 'verdict' in req['format'].get('properties',{})
        ]
        self.assertEqual(len(judges),6)
        for req in judges:
            self.assertEqual(req['messages'][0]['content'],w.SYSTEM)
            self.assertEqual(req['format']['properties']['verdict']['enum'],w.LABELS)

    def test_judge_keeps_full_document_and_selector_is_non_authoritative(self):
        _,fake,_=self.run_fake()
        judges=[
            req for req in fake.calls
            if 'verdict' in req['format'].get('properties',{})
        ]
        for req in judges:
            data=json.loads(req['messages'][1]['content'])
            self.assertTrue(data['selectionIsNotAuthoritative'])
            self.assertEqual(len(data['units']),29)

    def test_staged_can_be_worse_under_same_score(self):
        result,_,_=self.run_fake('staged_bad')
        self.assertEqual(result['baselineAccepted'],6)
        self.assertEqual(result['stagedAccepted'],5)
        self.assertEqual(result['comparison'],'STAGED_WORSE')

    def test_staged_can_be_better_under_same_score(self):
        result,_,_=self.run_fake('baseline_bad')
        self.assertEqual(result['baselineAccepted'],5)
        self.assertEqual(result['stagedAccepted'],6)
        self.assertEqual(result['comparison'],'STAGED_BETTER')

    def test_contradiction_requires_evidence(self):
        suite=w.load_suite(SUITE)
        with self.assertRaises(ValueError):
            w.check_answer({'verdict':'CONTRADICTED','evidenceIds':[]},suite['units'])

    def test_unknown_requires_no_evidence(self):
        suite=w.load_suite(SUITE)
        with self.assertRaises(ValueError):
            w.check_answer({'verdict':'UNKNOWN','evidenceIds':['U03']},suite['units'])

    def test_bad_digest_stops_before_model_call(self):
        result,fake,_=self.run_fake('digest')
        self.assertEqual(result['status'],'ERROR')
        self.assertEqual(len(fake.calls),0)

    def test_timeout_stops_without_retry(self):
        result,fake,_=self.run_fake('timeout')
        self.assertEqual(result['status'],'ERROR')
        self.assertEqual(len(fake.calls),1)

    def test_root_cannot_be_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)/'run'
            fake=Fake()
            with contextlib.redirect_stdout(io.StringIO()):
                w.execute(root,SUITE,fake)
            with self.assertRaises(FileExistsError):
                w.execute(root,SUITE,fake)


if __name__=='__main__':
    unittest.main()
