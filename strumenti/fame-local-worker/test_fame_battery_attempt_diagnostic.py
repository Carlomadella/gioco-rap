import json
import tempfile
import unittest
from pathlib import Path

import agent
import fame_battery_attempt_diagnostic as diag
import fame_four_role_network_v3 as network


class BatteryAttemptDiagnosticTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'battery'
        self.attempt=self.root/'cases'/'battery-anti-bias-v1'/'single-agent'/'attempt-1'
        self.attempt.mkdir(parents=True)

    def write_attempt(self,result,response=None):
        agent.write(self.attempt/'request.json',{'test':True})
        if response is not None:
            agent.write(self.attempt/'response.json',response)
        agent.write(self.attempt/'result.json',result)
        network.receipt(self.attempt)

    def base_response(self,content='{"answerOptionId":"ANSWER_NO"}',done_reason='stop'):
        return {
            'done':True,
            'done_reason':done_reason,
            'message':{'content':content},
            'total_duration':100,
            'load_duration':10,
            'prompt_eval_count':5,
            'eval_count':7,
        }

    def test_detects_output_truncation(self):
        self.write_attempt(
            {'status':'ERROR','errors':['ValueError: Risposta incompleta'],'elapsedSeconds':3},
            self.base_response('',done_reason='length')
        )
        result=diag.diagnostic(self.root,'battery-anti-bias-v1')
        self.assertEqual(result['classification'],'OUTPUT_TRUNCATED')
        self.assertEqual(result['responseDoneReason'],'length')
        self.assertTrue(result['modelCallPerformed'])
        self.assertFalse(result['modelCalledByDiagnostic'])

    def test_detects_invalid_json_after_response(self):
        self.write_attempt(
            {'status':'ERROR','errors':['ValueError: JSON invalido'],'elapsedSeconds':2},
            self.base_response('not-json')
        )
        result=diag.diagnostic(self.root,'battery-anti-bias-v1')
        self.assertEqual(result['classification'],'INVALID_JSON_CONTENT')
        self.assertFalse(result['contentParseableJson'])

    def test_detects_host_rejection_with_parseable_json(self):
        self.write_attempt(
            {'status':'REJECTED','errors':['BASELINE_INCORRECT_ANSWER_OPTION'],'elapsedSeconds':1},
            self.base_response('{"answerOptionId":"ANSWER_YES"}')
        )
        result=diag.diagnostic(self.root,'battery-anti-bias-v1')
        self.assertEqual(result['classification'],'HOST_VALIDATION_REJECTED')
        self.assertTrue(result['contentParseableJson'])
        self.assertEqual(result['resultErrors'],['BASELINE_INCORRECT_ANSWER_OPTION'])

    def test_detects_no_response_error(self):
        self.write_attempt(
            {'status':'ERROR','errors':['TimeoutError: test'],'elapsedSeconds':10},
            None
        )
        result=diag.diagnostic(self.root,'battery-anti-bias-v1')
        self.assertEqual(result['classification'],'NO_RESPONSE_TRANSPORT_OR_PRE_RESPONSE_ERROR')
        self.assertFalse(result['modelCallPerformed'])


if __name__=='__main__':
    unittest.main()
