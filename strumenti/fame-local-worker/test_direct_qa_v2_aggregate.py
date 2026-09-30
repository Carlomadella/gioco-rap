import hashlib
import json
import tempfile
import unittest
from pathlib import Path

import direct_qa_v2_aggregate as a


def write_json(path,value):
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')


def sha(path):
    h=hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


class DirectQaV2AggregateTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.base=Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def validation(self,salvage=False,warnings=0,dropped=0):
        row={
            'code':'C1',
            'conclusionCorrect':True,
            'coverage':'SUFFICIENT',
            'precisionWarnings':['U2']*warnings,
            'unreviewedEvidenceIds':[],
        }
        out={'accepted':True,'errors':[],'assessments':[row]}
        if salvage:
            out['hostSalvageApplied']=True
            out['droppedEvidence']={'C1':['UX']*dropped}
        return out

    def report(self,task,status='VALIDATED_FOR_REVIEW',first=True,repair=False,
               salvage=False,warnings=0,dropped=0,done_reason='stop',calls=1):
        return {
            'schema':'fame-direct-qa-worker-v2',
            'taskId':task,
            'status':status,
            'firstAttemptPass':first,
            'acceptedAfterRepair':repair,
            'modelCalls':calls,
            'humanReviewRequired':True,
            'executionAuthorized':False,
            'trainingAuthorized':False,
            'networkProductionReady':False,
            'independentEvaluation':False,
            'sourceCommit':'source',
            'packageSha256':'pkg-'+task,
            'metrics':{
                'total_duration':100,
                'load_duration':20,
                'prompt_eval_count':10,
                'eval_count':5,
                'done_reason':done_reason,
            },
            'validation':self.validation(salvage,warnings,dropped),
            'elapsedSeconds':1.5,
        }

    def make_attempt(self,root,number,report):
        out=root/f'attempt-{number}'
        out.mkdir()
        write_json(out/'report.json',report)
        write_json(out/'validation.json',report.get('validation',{}))
        write_json(out/'receipt.json',{'hashes':{
            'report.json':sha(out/'report.json'),
            'validation.json':sha(out/'validation.json'),
        }})

    def make_root(self,task,first,second=None,old_hash='historical-hash'):
        root=self.base/task
        root.mkdir()
        write_json(root/'desk.json',{
            'schema':'fame-direct-qa-worker-v2',
            'taskId':task,
            'packageSha256':'pkg-'+task,
            'codeHashes':{'direct_qa_worker_v2.py':old_hash},
        })
        self.make_attempt(root,1,first)
        if second is not None:
            self.make_attempt(root,2,second)
        return root

    def test_aggregates_raw_salvaged_and_repaired_without_replaying_old_code(self):
        raw=self.make_root('raw',self.report('raw'))
        salvaged=self.make_root('salvaged',self.report('salvaged',salvage=True,dropped=1))
        first=self.report('repaired',status='REJECTED_REPAIR_PENDING',first=False,calls=1)
        first['validation']={'accepted':False,'errors':['C1:INSUFFICIENT_EVIDENCE'],'assessments':[{
            'code':'C1','conclusionCorrect':True,'coverage':'INSUFFICIENT',
            'precisionWarnings':[],'unreviewedEvidenceIds':[]
        }]}
        second=self.report('repaired',status='VALIDATED_FOR_REVIEW_AFTER_REPAIR',
                           first=False,repair=True,calls=2)
        repaired=self.make_root('repaired',first,second)

        result=a.summarize([raw,salvaged,repaired])
        s=result['summary']
        self.assertEqual(s['tasks'],3)
        self.assertEqual(s['acceptedFinal'],3)
        self.assertEqual(s['firstPassRawClean'],1)
        self.assertEqual(s['firstPassSalvaged'],1)
        self.assertEqual(s['acceptedAfterRepair'],1)
        self.assertEqual(s['hostSalvageTasks'],1)
        self.assertEqual(s['droppedEvidenceIds'],1)
        self.assertEqual(s['modelCalls'],4)
        self.assertEqual(s['attemptElapsedSeconds'],6.0)
        self.assertFalse(s['humanReviewTimeMeasured'])
        self.assertIsNone(s['humanReviewSeconds'])
        self.assertEqual(
            next(row for row in result['runs'] if row['taskId']=='raw')['historicalCodeHashes'],
            {'direct_qa_worker_v2.py':'historical-hash'}
        )

    def test_counts_output_truncation_from_attempt_metrics(self):
        first=self.report('truncated',status='REJECTED_REPAIR_PENDING',first=False,
                          done_reason='length',calls=1)
        first['validation']={'accepted':False,'errors':['INVALID_RESPONSE:Risposta incompleta'],'assessments':[]}
        second=self.report('truncated',status='REJECTED',first=False,repair=False,calls=2)
        second['validation']={'accepted':False,'errors':['C1:INSUFFICIENT_EVIDENCE'],'assessments':[{
            'code':'C1','conclusionCorrect':True,'coverage':'INSUFFICIENT',
            'precisionWarnings':[],'unreviewedEvidenceIds':[]
        }]}
        root=self.make_root('truncated',first,second)
        result=a.summarize([root])
        self.assertEqual(result['summary']['outputTruncatedAttempts'],1)
        self.assertEqual(result['summary']['rejectedFinal'],1)
        self.assertEqual(result['runs'][0]['classification'],'REJECTED')

    def test_tampered_attempt_receipt_is_rejected(self):
        root=self.make_root('tampered',self.report('tampered'))
        (root/'attempt-1'/'report.json').write_text('{}\n',encoding='utf-8')
        with self.assertRaisesRegex(ValueError,'Hash artefatto non valido'):
            a.summarize([root])

    def test_duplicate_task_is_rejected(self):
        one=self.make_root('dup',self.report('dup'))
        other=self.base/'other'
        other.mkdir()
        write_json(other/'desk.json',{
            'schema':'fame-direct-qa-worker-v2','taskId':'dup',
            'packageSha256':'pkg-dup','codeHashes':{'old':'x'}
        })
        self.make_attempt(other,1,self.report('dup'))
        with self.assertRaisesRegex(ValueError,'Task duplicato'):
            a.summarize([one,other])


if __name__=='__main__':
    unittest.main()
