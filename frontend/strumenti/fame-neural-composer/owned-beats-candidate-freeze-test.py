"""Regression tests for the holdout boundary; no audio/ML dependencies required."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parent / 'owned-beats'))
import candidate_freeze as gate

class FreezeTests(unittest.TestCase):
    def test_config_digest_tracks_algorithm_config_not_metadata_envelope(self):
        algorithm = {"hop": 512, "threshold": 1.5}
        envelope = {
            "candidateId": "candidate-1",
            "configHash": "metadata-field-not-part-of-identity",
            "algorithmConfig": algorithm,
        }
        self.assertEqual(gate.config_digest(envelope), gate.config_digest(algorithm))

    def test_identity_and_one_shot(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            repo = root / 'code'; repo.mkdir()
            lock = repo / 'requirements-audio-analysis-lock.txt'; lock.write_text('example==1.0\n')
            (repo / '.python-version').write_text('.'.join(map(str, sys.version_info[:2])))
            (repo / 'audio-analysis-v2-protocol.json').write_text('{}')
            def git(*args):
                return subprocess.check_output(['git', *args], cwd=repo, stderr=subprocess.DEVNULL, text=True).strip()
            git('init'); git('add', '.')
            git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'fixture')
            config = {'hop':512}
            freeze = dict(candidateId='candidate-1',codeCommit=git('rev-parse','HEAD'),
                configHash=gate.config_digest(config), dependencyLockHash=gate.digest_file(lock),
                protocolDigestSha256=gate.digest_file(repo / 'audio-analysis-v2-protocol.json'),
                frozenAt='2026-01-01T00:00:00Z',ffmpegVersion='ffmpeg fixture',developmentSummaryPath='summary.json')
            summary={**freeze,'decision':'V2_WINS','split':'development'}
            summary_path=root / 'summary.json';summary_path.write_text(json.dumps(summary))
            freeze['developmentSummaryDigest']=gate.digest_file(summary_path)
            file=root / 'freeze.json';file.write_text(json.dumps(freeze))
            real = subprocess.check_output
            def command(args, **kw):
                return 'ffmpeg fixture\n' if args[0]=='ffmpeg' else real(args,**kw)
            with patch.object(gate,'version',return_value='1.0'), patch.object(gate.subprocess,'check_output',side_effect=command):
                verified=gate.verify_freeze(file,repo,config)
                # Un commit successivo che modifica solo tooling/infrastruttura e' ammesso:
                # il commit development resta antenato e l'identita' candidate viene
                # verificata separatamente.
                (repo / 'infra.txt').write_text('tooling only\n')
                git('add', 'infra.txt')
                git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid',
                    'commit', '-m', 'infra-only')
                verified=gate.verify_freeze(file,repo,config)
                with self.assertRaisesRegex(RuntimeError,'candidate-freeze'):
                    gate.verify_freeze(None,repo,config)
                with self.assertRaisesRegex(RuntimeError,'configHash'):
                    gate.verify_freeze(file,repo,{'hop':256})
                for field in ['codeCommit','dependencyLockHash','protocolDigestSha256','developmentSummaryDigest']:
                    changed={**freeze,field:'0'*(40 if field=='codeCommit' else 64)}
                    file.write_text(json.dumps(changed))
                    with self.assertRaises(RuntimeError):gate.verify_freeze(file,repo,config)
                file.write_text(json.dumps(freeze))
                with patch.object(gate,'version',return_value='2.0'):
                    with self.assertRaisesRegex(RuntimeError,'dependency'):gate.verify_freeze(file,repo,config)
                lock.write_text('example==2.0\n')
                with self.assertRaisesRegex(RuntimeError,'dirty'):gate.verify_freeze(file,repo,config)
                records=[{'compositionFamilyId':'family-1'}]
                gate.reserve_holdout(root,verified,records)
                with self.assertRaises((FileExistsError,RuntimeError)):
                    gate.reserve_holdout(root,{**verified,'candidateId':'other'},records)

if __name__ == '__main__':unittest.main()
