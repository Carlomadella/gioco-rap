"""Second frozen QA case; unchanged v6 engine, one model call, no retry."""
import argparse
import importlib.util
import json
from pathlib import Path
import agent

BASE = Path(__file__).resolve().parent


def build_engine():
    config = agent.read(BASE/'cases/independent-evaluation-rubric.json')
    import hashlib
    def digest(path):
        text = path.read_text(encoding='utf-8').replace('\r\n', '\n').rstrip('\n')+'\n'
        return hashlib.sha256(text.encode('utf-8')).hexdigest()
    for filename, key in [('qa_worker.py','engineSha256'), ('agent.py','transportSha256')]:
        if digest(BASE/filename) != config[key]:
            raise ValueError('Frozen dependency changed: '+filename)
    spec = importlib.util.spec_from_file_location('frozen_qa_transfer_engine', BASE/'qa_worker.py')
    engine = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(engine)
    engine.VERSION = 'fame-qa-transfer-independent-v1'
    engine.SOURCE_PATH = config['sourcePath']
    engine.SOURCE_COMMIT = config['sourceCommit']
    engine.CASE_SHA = config['caseSha256']
    engine.CATALOG = config['catalog']
    engine.CHECKS = config['checks']
    engine.RUBRIC = {code:dict(check=rule['check'],
                             required=[set(group) for group in rule['required']],
                             allowed=set(rule['allowed']))
                     for code,rule in config['rubric'].items()}
    def case_text():
        text = engine.canonical((BASE/'cases/independent-evaluation-report.md').read_text(encoding='utf-8'))
        if engine.digest(text) != engine.CASE_SHA:
            raise ValueError('Frozen transfer report changed')
        return text
    engine.case_text = case_text
    return engine


def run(root, model, client=None):
    engine = build_engine()
    # One measured run per desk: do not replace a failure with a later success.
    if any(agent.safe_path(root,'runs').iterdir()):
        raise ValueError('Desk already evaluated; preserve its first result')
    result = engine.run(root, model, attempts=1, client=client)
    out = next(agent.safe_path(root,'runs').iterdir())
    config_path = BASE/'cases/independent-evaluation-rubric.json'
    agent.write(out/'frozen-case-config.json', agent.read(config_path))
    validation_path = out/'attempt-1-validation.json'
    validation = agent.read(validation_path) if validation_path.exists() else {}
    # v6 can assemble valid findings while rejecting an extra candidate claim.
    # Record the stricter first-response criterion separately; do not alter v6.
    passed = (result['status']=='VALIDATED_FOR_REVIEW'
              and result['firstAttemptPass'] is True
              and validation.get('candidateErrors') == [])
    evaluation = {'status':'PASS' if passed else 'FAIL',
                  'criterion':'single response, all required findings, no unsupported claims',
                  'humanReviewRequired':True, 'executionAuthorized':False,
                  'droppedEvidenceCount':sum(len(r['droppedEvidenceIds']) for r in validation.get('droppedEvidence',[])),
                  'elapsedSeconds':validation.get('elapsedSeconds'),
                  'humanReviewSeconds':None, 'manualBaselineSeconds':None,
                  'netTimeSavingEstablished':False}
    agent.write(out/'transfer-evaluation.json',evaluation)
    print(json.dumps({'transferStatus':evaluation['status'],'evaluation':str(out/'transfer-evaluation.json')}))
    return evaluation


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=('init','run'))
    parser.add_argument('--root',required=True,type=Path)
    parser.add_argument('--model')
    args = parser.parse_args()
    try:
        if args.command == 'init':
            build_engine().init(args.root.resolve())
            print('Seconda scrivania creata; nessuna chiamata al modello.')
        else:
            if not args.model:
                parser.error('--model richiesto')
            result = run(args.root.resolve(),args.model)
            raise SystemExit(0 if result['status']=='PASS' else 1)
    except (ValueError,OSError) as exc:
        parser.exit(2,f'ERRORE: {exc}\n')


if __name__ == '__main__':
    main()
