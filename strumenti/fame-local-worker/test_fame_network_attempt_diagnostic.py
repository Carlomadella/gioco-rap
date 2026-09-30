import tempfile
import unittest
from pathlib import Path

import agent
import fame_four_role_network_v3 as network
import fame_network_attempt_diagnostic as diag


class NetworkAttemptDiagnosticTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'root'
        self.attempt=self.root/'cases'/'matched-coordinator-reject-v1'/'four-role-network'/'roles'/'verifier'/'attempt-1'
        self.attempt.mkdir(parents=True)

    def write_attempt(self,result,response=None):
        agent.write(self.attempt/'request.json',{'test':True})
        if response is not None:
            agent.write(self.attempt/'response.json',response)
        agent.write(self.attempt/'result.json',result)
        network.receipt(self.attempt)

    def response(self,output,done_reason='stop'):
        import json
        return {
            'done':True,
            'done_reason':done_reason,
            'message':{'content':json.dumps(output,ensure_ascii=False)},
            'total_duration':100,
            'load_duration':10,
            'prompt_eval_count':5,
            'eval_count':7,
        }

    def test_detects_status_evidence_contract_contradiction(self):
        output={
            'answerOptionId':'ANSWER_NO',
            'decisions':[
                {
                    'claimId':'C1',
                    'status':'EVIDENCE_DOES_NOT_SUPPORT_CLAIM',
                    'evidenceIds':['U01'],
                    'reason':'The evidence supports the claim, but this status is inconsistent.'
                }
            ],
        }
        self.write_attempt(
            {
                'role':'verifier',
                'status':'REJECTED',
                'errors':['VERIFIER_NONSUPPORTED_WITH_EVIDENCE'],
                'output':output,
                'elapsedSeconds':1,
            },
            self.response(output),
        )
        result=diag.diagnostic(self.root,'matched-coordinator-reject-v1','verifier')
        self.assertEqual(result['classification'],'VERIFIER_STATUS_EVIDENCE_CONTRACT_CONTRADICTION')
        self.assertEqual(len(result['contractContradictions']),1)
        self.assertFalse(result['modelCalledByDiagnostic'])

    def test_rejected_parseable_without_specific_contradiction_is_host_rejection(self):
        output={
            'answerOptionId':'ANSWER_NO',
            'decisions':[
                {
                    'claimId':'C1',
                    'status':'EVIDENCE_DOES_NOT_SUPPORT_CLAIM',
                    'evidenceIds':[],
                    'reason':'No direct support.'
                }
            ],
        }
        self.write_attempt(
            {'role':'verifier','status':'REJECTED','errors':['OTHER'],'output':output,'elapsedSeconds':1},
            self.response(output),
        )
        result=diag.diagnostic(self.root,'matched-coordinator-reject-v1','verifier')
        self.assertEqual(result['classification'],'HOST_VALIDATION_REJECTED')
        self.assertEqual(result['contractContradictions'],[])

    def test_detects_truncation(self):
        output={'answerOptionId':'ANSWER_NO','decisions':[]}
        self.write_attempt(
            {'role':'verifier','status':'ERROR','errors':['ValueError: Risposta incompleta'],'output':None,'elapsedSeconds':1},
            self.response(output,done_reason='length'),
        )
        result=diag.diagnostic(self.root,'matched-coordinator-reject-v1','verifier')
        self.assertEqual(result['classification'],'OUTPUT_TRUNCATED')

    def test_detects_no_response_transport_error(self):
        self.write_attempt(
            {'role':'verifier','status':'ERROR','errors':['TimeoutError: test'],'output':None,'elapsedSeconds':1},
            None,
        )
        result=diag.diagnostic(self.root,'matched-coordinator-reject-v1','verifier')
        self.assertEqual(result['classification'],'NO_RESPONSE_TRANSPORT_OR_PRE_RESPONSE_ERROR')


if __name__=='__main__':
    unittest.main()
