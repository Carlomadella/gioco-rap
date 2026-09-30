import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import agent
import fame_four_role_network_v2 as n
import fame_four_role_network_v2_recovery as r


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
            'done':True,
            'done_reason':'stop',
            'message':{'content':json.dumps(answer,ensure_ascii=False)},
            'total_duration':100,
            'load_duration':20,
            'prompt_eval_count':10,
            'eval_count':5,
        }


class RecoveryTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base=Path(self.temp.name)
        self.source=self.base/'source'
        self.recovery=self.base/'recovery'
        self.make_source()

    def extractor(self):
        return {'claims':[
            {'claimId':'C1','statement':'Demo 3/3 first-attempt.','evidenceIds':['U02']},
            {'claimId':'C2','statement':'Non dimostrato che Qwen sia il migliore.','evidenceIds':['U03']},
            {'claimId':'C3','statement':'QA v6 validato al primo tentativo.','evidenceIds':['U04']},
            {'claimId':'C4','statement':'Serve un secondo task prima di stabilità generale.','evidenceIds':['U05']},
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

    def verifier(self):
        return {
            'verdict':'NOT_ESTABLISHED',
            'decisions':[
                {'claimId':'C1','status':'SUPPORTED','evidenceIds':['U02'],'reason':'diretto'},
                {'claimId':'C2','status':'SUPPORTED','evidenceIds':['U03'],'reason':'diretto'},
                {'claimId':'C3','status':'SUPPORTED','evidenceIds':['U04'],'reason':'diretto'},
                {'claimId':'C4','status':'SUPPORTED','evidenceIds':['U05'],'reason':'diretto'},
            ],
        }

    def integrator(self):
        return {
            'verdict':'NOT_ESTABLISHED',
            'usedClaimIds':['C1','C2','C3','C4'],
            'answer':'No. I risultati sono circoscritti e il recap non stabilisce superiorità del modello o affidabilità generale.',
            'limitations':['Vale per il recap congelato.'],
        }

    def write_attempt(self,role,result,request,response=None):
        out=self.source/'roles'/role/'attempt-1'
        out.mkdir(parents=True)
        agent.write(out/'request.json',request)
        if response is not None:
            agent.write(out/'response.json',response)
        agent.write(out/'result.json',result)
        n.receipt(out)

    def make_source(self):
        p=n.package(r.EXPECTED_CASE)
        self.source.mkdir()
        (self.source/'roles').mkdir()
        agent.write(self.source/'network.json',{
            'schema':r.SOURCE_SCHEMA,
            'caseId':r.EXPECTED_CASE,
            'humanReviewRequired':True,
            'executionAuthorized':False,
            'trainingAuthorized':False,
            'networkProductionReady':False,
            'independentEvaluation':False,
        })
        agent.write(self.source/'case-public.json',n.public_case(p))
        agent.write(self.source/'host-rubric.json',n.host_rubric(p))

        ext=self.extractor()
        self.write_attempt('extractor',{
            'role':'extractor','status':'ACCEPTED','errors':[],'output':ext,
            'elapsedSeconds':1,'metrics':{'done_reason':'stop'}
        },{'historical':'extractor'},{'historical':'response'})

        ab=self.challenge()
        self.write_attempt('anti-bias',{
            'role':'anti-bias','status':'ACCEPTED','errors':[],'output':ab,
            'elapsedSeconds':1,'metrics':{'done_reason':'stop'}
        },{'historical':'anti-bias'},{'historical':'response'})

        malformed=n.verifier_request(p,ext,ab)
        malformed['format']['required'].append('antiBiasResolution')
        malformed['format']['properties']['antiBiasResolution']={
            'type':'array','minItems':0,'maxItems':0,
            'items':{
                'type':'object','properties':{
                    'issueId':{'type':'string','enum':[]}
                }
            }
        }
        self.write_attempt('verifier',{
            'role':'verifier','status':'ERROR',
            'errors':['HTTPError: HTTP Error 400: Bad Request'],
            'output':None,'elapsedSeconds':0.01
        },malformed)

    def test_init_reuses_only_accepted_pretransport_roles(self):
        with contextlib.redirect_stdout(io.StringIO()):
            r.init(self.recovery,self.source)
        self.assertEqual(agent.read(self.recovery/'source-extractor.json'),self.extractor())
        self.assertEqual(agent.read(self.recovery/'source-anti-bias.json'),self.challenge())
        meta=agent.read(self.recovery/'recovery.json')
        self.assertEqual(meta['maximumModelCalls'],2)
        self.assertFalse(meta['trainingAuthorized'])

    def test_recovery_executes_only_verifier_and_integrator(self):
        with contextlib.redirect_stdout(io.StringIO()):
            r.init(self.recovery,self.source)
        fake=Fake([self.verifier(),self.integrator()])
        with contextlib.redirect_stdout(io.StringIO()):
            result=r.run(self.recovery,fake)
        self.assertEqual(result['status'],n.FINAL_ACCEPTED)
        self.assertEqual(result['reusedRoles'],['extractor','anti-bias'])
        self.assertEqual(result['modelCalls'],2)
        self.assertEqual(len(fake.calls),2)
        self.assertNotIn('antiBiasResolution',fake.calls[0]['format']['properties'])

    def test_source_verifier_response_would_forbid_recovery(self):
        out=self.source/'roles'/'verifier'/'attempt-1'
        agent.write(out/'response.json',{'unexpected':True})
        (out/'receipt.json').unlink()
        n.receipt(out)
        with self.assertRaisesRegex(ValueError,'response'):
            r.init(self.recovery,self.source)

    def test_non_400_source_error_would_forbid_recovery(self):
        out=self.source/'roles'/'verifier'/'attempt-1'
        result=agent.read(out/'result.json')
        result['errors']=['TimeoutError: test']
        (out/'result.json').unlink()
        agent.write(out/'result.json',result)
        (out/'receipt.json').unlink()
        n.receipt(out)
        with self.assertRaisesRegex(ValueError,'400'):
            r.init(self.recovery,self.source)


if __name__=='__main__':
    unittest.main()
