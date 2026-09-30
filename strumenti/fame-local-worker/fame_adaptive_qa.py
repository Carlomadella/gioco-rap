"""Stable front door for Adaptive FAME QA.

Delegates execution to the frozen Adaptive QA V3 protocol while adding a
consumption guard outside the measured protocol files.

Why this wrapper exists:
- measured protocols (Adaptive V3 / V9) must remain reproducible and unchanged;
- consumed cases must not be re-initialized accidentally in a new root;
- local interrupted/finished runs should block a second fresh init on the same
  machine even before the repository registry is updated.

Only `init` is blocked by consumption state. `run` and `status` on an
existing root remain available so interrupted work can be resumed or inspected.
"""
import argparse
import json
import os
from pathlib import Path

import agent
import fame_adaptive_qa_v3 as v3

BASE=Path(__file__).resolve().parent
REGISTRY=BASE/'adaptive_consumed_cases.json'
REGISTRY_SCHEMA='fame-adaptive-consumed-cases-v1'
LOCAL_SCHEMA='fame-adaptive-local-consumed-v1'
TARGET_PROTOCOL='fame-adaptive-qa-v3'


def _state_dir():
    override=os.environ.get('FAME_ADAPTIVE_STATE_DIR')
    return Path(override).expanduser().resolve() if override else Path.home()/'.fame-neural'


def _local_path():
    return _state_dir()/'adaptive-consumed-v1.json'


def _read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def committed_consumed():
    data=_read_json(REGISTRY)
    if (type(data) is not dict or set(data)!={'schema','caseIds'} or
            data.get('schema')!=REGISTRY_SCHEMA or type(data.get('caseIds')) is not list):
        raise ValueError('Registro case consumati adaptive invalido')
    ids=data['caseIds']
    if any(not isinstance(x,str) or not x for x in ids) or len(ids)!=len(set(ids)):
        raise ValueError('Registro case consumati adaptive invalido')
    return frozenset(ids)


def local_consumed():
    path=_local_path()
    if not path.exists():
        return frozenset()
    data=_read_json(path)
    if (type(data) is not dict or set(data)!={'schema','caseIds'} or
            data.get('schema')!=LOCAL_SCHEMA or type(data.get('caseIds')) is not list):
        raise ValueError('Registro locale case consumati adaptive invalido')
    ids=data['caseIds']
    if any(not isinstance(x,str) or not x for x in ids) or len(ids)!=len(set(ids)):
        raise ValueError('Registro locale case consumati adaptive invalido')
    return frozenset(ids)


def all_consumed():
    return committed_consumed() | local_consumed()


def _write_local(ids):
    path=_local_path()
    path.parent.mkdir(parents=True,exist_ok=True)
    payload={'schema':LOCAL_SCHEMA,'caseIds':sorted(set(ids))}
    tmp=path.with_suffix('.tmp')
    tmp.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    tmp.replace(path)


def mark_local(case_id):
    ids=set(local_consumed())
    if case_id not in ids:
        ids.add(case_id)
        _write_local(ids)


def _case_from_root(root):
    path=root/'adaptive.json'
    if not path.is_file():
        return None
    data=agent.read(path)
    case_id=data.get('caseId') if type(data) is dict else None
    return case_id if isinstance(case_id,str) and case_id else None


def _has_model_response(root):
    if (root/'single-agent'/'attempt-1'/'response.json').is_file():
        return True
    roles=root/'four-role-network-v9'/'roles'
    if roles.is_dir():
        for path in roles.glob('*/attempt-1/response.json'):
            if path.is_file():
                return True
    return False


def record_consumed_from_root(root):
    root=root.resolve()
    case_id=_case_from_root(root)
    if case_id and _has_model_response(root):
        mark_local(case_id)
        return case_id
    return None


def init(root,case_id):
    if v3.VERSION!=TARGET_PROTOCOL:
        raise ValueError('Protocollo target adaptive inatteso: '+str(v3.VERSION))
    consumed=all_consumed()
    if case_id in consumed:
        raise ValueError('Case adaptive gia consumato: '+case_id)
    v3.init(root.resolve(),case_id)


def run(root):
    root=root.resolve()
    try:
        return v3.run(root)
    finally:
        # A response means the case has had its first measured model attempt.
        # Block only future init in a new root; continuing this root stays legal.
        record_consumed_from_root(root)


def status(root):
    return v3.result(root.resolve())


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=('init','run','status','consumed'))
    parser.add_argument('--root',type=Path)
    parser.add_argument('--case')
    args=parser.parse_args()
    try:
        if args.command=='consumed':
            print(json.dumps({
                'schema':'fame-adaptive-consumption-status-v1',
                'committedCaseIds':sorted(committed_consumed()),
                'localCaseIds':sorted(local_consumed()),
                'allCaseIds':sorted(all_consumed()),
            },ensure_ascii=False,indent=2))
            return
        if args.root is None:
            parser.error('--root richiesto')
        root=args.root.resolve()
        if args.command=='init':
            if not args.case:
                parser.error('--case richiesto con init')
            init(root,args.case)
        elif args.command=='run':
            final=run(root)
            raise SystemExit(0 if final['status']=='PROPOSED_FOR_HUMAN_REVIEW' else 1)
        else:
            print(json.dumps(status(root),ensure_ascii=False,indent=2))
    except (ValueError,OSError,KeyError,json.JSONDecodeError) as exc:
        parser.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__':
    main()
