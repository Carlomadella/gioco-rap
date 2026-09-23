"""Bounded recovery of a compound claim; original network remains read-only."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace
import agent
import qa_coordinator as original
import qa_transfer

BASE = Path(__file__).resolve().parent
VERSION = 'fame-qa-lowend-recovery-v1'
PARENT = 'LOWEND_CAUSES_UNPROVEN'
CHILDREN = {
    'RELEASE_CAUSE_UNPROVEN': ('La causa della release corta del low-end resta da verificare.', 217, {215,217,250}),
    'HIGH_NOTE_CAUSE_UNPROVEN': ('La causa dei silenzi sulle note alte del low-end resta da verificare.', 235, {232,233,235,250}),
}


def build_engine():
    qa = qa_transfer.build_engine()
    qa.CATALOG = {code: item[0] for code,item in CHILDREN.items()}
    qa.RUBRIC = {code:dict(check='PLAN_CONTOUR_DIAGNOSTICS',required=[{item[1]}],allowed=item[2])
                 for code,item in CHILDREN.items()}
    return qa


def coordinator():
    # Separate module globals: never patch the original network or frozen engine.
    spec = importlib.util.spec_from_file_location('isolated_recovery_coordinator', BASE/'qa_coordinator.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.VERSION = VERSION
    module.qa_transfer = SimpleNamespace(build_engine=build_engine, BASE=BASE)
    return module


def source_state(source):
    qa = qa_transfer.build_engine()
    text = original.verify(source,qa)
    state = original.collect(source,qa,text)
    failed = [r for r in state['results'] if not r['status'].startswith('ACCEPTED_')]
    if (state['acceptedDecisions'] != 13 or len(failed) != 1 or
        failed[0]['code'] != PARENT or failed[0]['status'] != 'SEMANTIC_FAIL'):
        raise ValueError('Recovery applicabile solo a 13/14 con LOWEND_CAUSES_UNPROVEN SEMANTIC_FAIL')
    return qa,text,state


def input_snapshot(source):
    # Pin all authoritative source artifacts, excluding summaries and ephemeral locks.
    paths = ['network.json','report.md']
    for code in qa_transfer.build_engine().CATALOG:
        prefix = 'desks/'+code+'/'
        paths += [prefix+'TASK.json',prefix+'memory/procedure.md']
        paths += [prefix+'attempt-1/'+name for name in ('request.json','response.json','result.json','receipt.json')]
    return {rel:agent.sha(agent.safe_path(source,rel)) for rel in paths}


def code_snapshot():
    # Canonical hashes tolerate Windows Git newline conversion.
    return {name:hashlib.sha256((BASE/name).read_text(encoding='utf-8').replace('\r\n','\n').encode()).hexdigest()
            for name in ('qa_recovery.py','qa_coordinator.py','qa_transfer.py','qa_worker.py','agent.py',
                         'cases/independent-evaluation-rubric.json')}


def init(root, source):
    root,source = root.resolve(),source.resolve()
    if root == source or source in root.parents or root in source.parents:
        raise ValueError('Usare cartelle separate, non annidate')
    _,_,state = source_state(source)
    snapshot = input_snapshot(source)
    coordinator().init(root)
    agent.write(root/'origin.json',dict(schema=VERSION,source=str(source),sourceHashes=snapshot,
                codeHashes=code_snapshot(),firstPass=state,maximumAdditionalModelCalls=2,
                developmentRecovery=True,independentEvaluation=False))


def verify_origin(root):
    origin = agent.read(agent.safe_path(root,'origin.json'))
    if origin['schema'] != VERSION or origin['codeHashes'] != code_snapshot():
        raise ValueError('Protocollo recovery modificato')
    source = Path(origin['source'])
    qa,text,state = source_state(source)
    if input_snapshot(source) != origin['sourceHashes'] or state != origin['firstPass']:
        raise ValueError('Risultato originale modificato dopo init')
    return qa,text,state


def evaluate(root):
    qa,text,first = verify_origin(root)
    child_qa = build_engine()
    worker = coordinator()
    children = worker.collect(root,child_qa,worker.verify(root,child_qa))
    errors = []
    recovered = None
    if children['status'] == 'VALIDATED_FOR_REVIEW':
        ids = list(dict.fromkeys(e for f in children['findings'] for e in f['evidenceIds']))
        candidate = dict(code=PARENT,evidenceIds=ids)
        errors = qa.validate_finding(candidate,text)
        if not errors:
            recovered = qa.sanitize_finding(candidate,text)
    findings = first['findings'] + ([recovered] if recovered else [])
    if recovered:
        errors += qa.validate(dict(findings=findings),text)
    passed = recovered is not None and not errors
    return dict(schema=VERSION,status='VALIDATED_AFTER_RECOVERY' if passed else 'NEEDS_REVIEW',
                firstPassAccepted=first['acceptedDecisions'],firstPassTotal=first['totalDecisions'],
                firstPassStatus=first['status'],firstPassPassed=False,
                afterRecoveryAccepted=first['acceptedDecisions']+int(passed),
                recoveredCode=PARENT if passed else None,errors=errors,
                recovery=children,findings=findings if passed else first['findings'],
                firstPassModelSeconds=first['elapsedModelSeconds'],
                recoveryModelSeconds=children['elapsedModelSeconds'],
                totalModelSeconds=first['elapsedModelSeconds']+children['elapsedModelSeconds'],
                humanReviewRequired=True,executionAuthorized=False,
                independentEvaluation=False,netTimeSavingEstablished=False)


def run(root, client=None):
    verify_origin(root)
    raw_client = client or agent.Ollama()
    class CheckedClient:
        def request(self,endpoint,payload=None):
            verify_origin(root)
            response = raw_client.request(endpoint,payload)
            verify_origin(root)
            return response
    coordinator().run(root,max_tasks=2,client=CheckedClient())
    result = evaluate(root)
    folder = agent.safe_path(root,'recovery-results')
    folder.mkdir(exist_ok=True)
    out = folder/original.stamp()
    out.mkdir()
    agent.write(out/'evaluation.json',result)
    if result['status']=='VALIDATED_AFTER_RECOVERY':
        qa,text,_ = verify_origin(root)
        answer = qa.materialize(dict(findings=result['findings']),text)
        agent.write(out/'answer.json',answer)
        (out/'review.md').write_text(qa.render(answer),encoding='utf-8')
    print(json.dumps(dict(status=result['status'],firstPass='13/14',
                         afterRecovery=str(result['afterRecoveryAccepted'])+'/14',
                         evaluation=str(out/'evaluation.json'))))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=('init','run','status'))
    parser.add_argument('--root',required=True,type=Path)
    parser.add_argument('--source',type=Path)
    args = parser.parse_args()
    try:
        if args.command=='init':
            if args.source is None: parser.error('--source richiesto per init')
            init(args.root,args.source)
            print('Recovery preparato: 2 scrivanie; originale conservato; nessuna chiamata al modello.')
        elif args.command=='status':
            print(json.dumps(evaluate(args.root.resolve()),ensure_ascii=False,indent=2))
        else:
            result = run(args.root.resolve())
            raise SystemExit(0 if result['status']=='VALIDATED_AFTER_RECOVERY' else 1)
    except (ValueError,OSError,KeyError) as exc:
        parser.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__': main()
