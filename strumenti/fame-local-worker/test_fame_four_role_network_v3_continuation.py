import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import agent
import fame_anti_bias as anti_bias
import fame_four_role_network_v3 as n
import fame_four_role_network_v3_continuation as c


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


class V3ContinuationTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base=Path(self.temp.name)
        self.source=self.base/'source-v2'
        self.failed=self.base/'failed-recovery-v2'
        self.root=self.base/'v3'
        self.make_chain()

    def extractor(self):
        return {'claims':[
            {'claimId':'C1','statement':'Qwen3-Coder 30B achieved 3/3 PASS on first attempt.','evidenceIds':['U02','U04']},
            {'claimId':'C2','statement':'The recap does not demonstrate Qwen is the best model.','evidenceIds':['U03']},
            {'claimId':'C3','statement':'The recap does not demonstrate general reliability.','evidenceIds':['U04']},
        ]}

    def challenge(self):
        return {
            'applicability':[
                {'controlId':row['controlId'],'status':'APPLICABLE','reason':'controllato senza issue'}
                for row in anti_bias.CONTROLS
            ],
            'issues':[],
            'overall':'ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE',
            'residualBiasUncertaintyExplicit':True,
        }

    def verifier_v3(self):
        return {
            'answerOptionId':'ANSWER_NO',
            'decisions':[
                {'claimId':'C1','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':['U02','U04'],'reason':'Le unità sostengono il claim.'},
                {'claimId':'C2','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':['U03'],'reason':'U03 lo dice esplicitamente.'},
                {'claimId':'C3','status':'EVIDENCE_SUPPORTS_CLAIM','evidenceIds':['U04'],'reason':'U04 mostra risultati misti e non affidabilità generale.'},
            ],
        }

    def integrator_v3(self):
        return {
            'answerOptionId':'ANSWER_NO',
            'usedClaimIds':['C1','C2','C3'],
            'answer':'No. Il recap documenta risultati circoscritti ma non stabilisce superiorità di Qwen o affidabilità generale.',
            'limitations':['Il recap richiede ulteriori verifiche prima della stabilità generale.'],
        }

    def write_role(self,base,role,result,response=True):
        out=base/'roles'/role/'attempt-1'
        out.mkdir(parents=True)
        agent.write(out/'request.json',{'historical':role})
        if response:
            agent.write(out/'response.json',{'historical':role})
        agent.write(out/'result.json',result)
        n.receipt(out)

    def make_chain(self):
        p=n.package(c.TARGET_CASE)
        self.source.mkdir()
        (self.source/'roles').mkdir()
        agent.write(self.source/'network.json',{
            'schema':c.SOURCE_SCHEMA,
            'caseId':c.SOURCE_CASE,
            'humanReviewRequired':True,
            'executionAuthorized':False,
            'trainingAuthorized':False,
            'networkProductionReady':False,
            'independentEvaluation':False,
        })
        source_case=n.extractor_case(p)
        source_case['caseId']=c.SOURCE_CASE
        agent.write(self.source/'case-public.json',source_case)

        ext=self.extractor()
        self.write_role(self.source,'extractor',{
            'role':'extractor','status':'ACCEPTED','errors':[],'output':ext,
            'elapsedSeconds':1,'metrics':{'done_reason':'stop'},
        })
        ab=self.challenge()
        self.write_role(self.source,'anti-bias',{
            'role':'anti-bias','status':'ACCEPTED','errors':[],'output':ab,
            'elapsedSeconds':1,'metrics':{'done_reason':'stop'},
        })

        self.failed.mkdir()
        (self.failed/'roles').mkdir()
        agent.write(self.failed/'recovery.json',{
            'schema':c.FAILED_RECOVERY_SCHEMA,
            'caseId':c.SOURCE_CASE,
            'sourceRoot':str(self.source.resolve()),
            'humanReviewRequired':True,
            'executionAuthorized':False,
            'trainingAuthorized':False,
            'networkProductionReady':False,
            'independentEvaluation':False,
        })
        self.write_role(self.failed,'verifier',{
            'role':'verifier','status':'REJECTED',
            'errors':['VERIFIER_NONSUPPORTED_WITH_EVIDENCE'],
            'output':{
                'verdict':'ESTABLISHED',
                'decisions':[{
                    'claimId':'C1','status':'UNSUPPORTED','evidenceIds':['U02'],
                    'reason':'Evidence supports the claim.'
                }],
            },
            'elapsedSeconds':1,'metrics':{'done_reason':'stop'},
        })

    def test_init_binds_full_failure_chain_and_reuses_only_accepted_roles(self):
        with contextlib.redirect_stdout(io.StringIO()):
            c.init(self.root,self.source,self.failed)
        meta=agent.read(self.root/'continuation.json')
        self.assertEqual(meta['reusedRoles'],['extractor','anti-bias'])
        self.assertEqual(meta['maximumModelCalls'],2)
        self.assertEqual(meta['targetCaseId'],c.TARGET_CASE)
        self.assertFalse(meta['trainingAuthorized'])

    def test_continuation_runs_only_v3_verifier_and_integrator(self):
        with contextlib.redirect_stdout(io.StringIO()):
            c.init(self.root,self.source,self.failed)
        fake=Fake([self.verifier_v3(),self.integrator_v3()])
        with contextlib.redirect_stdout(io.StringIO()):
            result=c.run(self.root,fake)
        self.assertEqual(result['status'],n.FINAL_ACCEPTED)
        self.assertEqual(result['modelCalls'],2)
        self.assertEqual(len(fake.calls),2)
        verifier_schema=fake.calls[0]['format']
        statuses=verifier_schema['properties']['decisions']['items']['properties']['status']['enum']
        self.assertIn('EVIDENCE_SUPPORTS_CLAIM',statuses)
        self.assertNotIn('SUPPORTED',statuses)

    def test_v3_verifier_gets_meanings_and_not_expected_answer(self):
        with contextlib.redirect_stdout(io.StringIO()):
            c.init(self.root,self.source,self.failed)
        fake=Fake([self.verifier_v3(),self.integrator_v3()])
        with contextlib.redirect_stdout(io.StringIO()):
            c.run(self.root,fake)
        payload=fake.calls[0]['messages'][1]['content']
        self.assertIn('ANSWER_YES',payload)
        self.assertIn('ANSWER_NO',payload)
        self.assertNotIn('expectedAnswerOptionId',payload)

    def test_missing_semantic_failure_marker_blocks_continuation(self):
        out=self.failed/'roles'/'verifier'/'attempt-1'
        result=agent.read(out/'result.json')
        result['errors']=['OTHER']
        (out/'result.json').unlink()
        agent.write(out/'result.json',result)
        (out/'receipt.json').unlink()
        n.receipt(out)
        with self.assertRaisesRegex(ValueError,'Failure semantico V2 atteso'):
            c.init(self.root,self.source,self.failed)

    def test_failed_recovery_must_point_to_same_source_root(self):
        meta=agent.read(self.failed/'recovery.json')
        meta['sourceRoot']=str((self.base/'other').resolve())
        (self.failed/'recovery.json').unlink()
        agent.write(self.failed/'recovery.json',meta)
        with self.assertRaisesRegex(ValueError,'non deriva'):
            c.init(self.root,self.source,self.failed)


if __name__=='__main__':
    unittest.main()
