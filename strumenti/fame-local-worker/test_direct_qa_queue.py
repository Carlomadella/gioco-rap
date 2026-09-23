import contextlib
import io
import tempfile
import unittest
from pathlib import Path
import direct_qa_queue as q
from test_direct_qa_worker import Fake

class QueueTests(unittest.TestCase):
    def test_run_and_resume_skip_attempted(self):
        with tempfile.TemporaryDirectory() as d,contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'queue';q.init(root,['pfnmf-review-v1'])
            f=Fake({'results':[]})
            self.assertEqual(q.run(root,f)['status'],'NEEDS_REVIEW')
            q.run(root,f);self.assertEqual(len(f.calls),1)
    def test_interrupted_never_retried(self):
        with tempfile.TemporaryDirectory() as d,contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'queue';q.init(root,['pfnmf-review-v1'])
            (root/'desks/pfnmf-review-v1/attempt-1').mkdir()
            f=Fake();r=q.run(root,f)
            self.assertEqual(r['results'][0]['status'],'INTERRUPTED');self.assertEqual(f.calls,[])
    def test_duplicate_tasks_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):q.init(Path(d)/'q',['pfnmf-review-v1']*2)
    def test_lock_blocks_concurrency(self):
        with tempfile.TemporaryDirectory() as d,contextlib.redirect_stdout(io.StringIO()):
            root=Path(d)/'queue';q.init(root,['pfnmf-review-v1']);(root/'queue.lock').write_text('active')
            with self.assertRaises(FileExistsError):q.run(root,Fake())

if __name__=='__main__':unittest.main()
