"""One-call semantic branch probe for the FAME Four-Role Verifier V4."""
import argparse
import hashlib
import json
import time
from pathlib import Path

import agent
import fame_four_role_network_v4 as network

BASE=Path(__file__).resolve().parent
VERSION='fame-verifier-v4-branch-probe-v2'
CASE_ID='verifier-v4-branch-probe-v2'
MODEL=network.MODEL
DIGEST=network.DIGEST
OPTIONS=dict(network.OPTIONS)

FROZEN_EXTRACTOR={
    'claims':[
        {
            'claimId':'C1',
            'statement':'Il task ha restituito REJECTED con una sola chiamata al modello.',
            'evidenceIds':['U01'],
        },
        {
            'claimId':'C2',
            'statement':'Il reject è soltanto un falso negativo di packaging e non contiene alcun errore semantico reale.',
            'evidenceIds':['U02'],
        },
        {
            'claimId':'C3',
            'statement':'Il worker one-shot v1 resta utile come misura del primo tentativo e quindi è sufficiente come percorso operativo in generale.',
            'evidenceIds':['U04'],
        },
        {
            'claimId':'C4',
            'statement':'Il risultato resta consumato e non viene ritentato con il worker v1.',
            'evidenceIds':['U03'],
        },
    ]
}

FROZEN_CHALLENGE={
    'applicability':[],
    'issues':[],
    'overall':'ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE',
    'residualBiasUncertaintyExplicit':True,
}

HOST_EXPECTED={
    'answerOptionId':'ANSWER_MIXED',
    'supportedClaims':['C1','C4'],
    'unsupportedClaims':['C2'],
    'claimsNeedingRework':['C3'],
}


def digest(value):
    return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def code_hashes():
    names=('fame_verifier_v4_branch_probe_v2.py','fame_four_role_network_v4.py','fame_anti_bias.py','agent.py')
    return {name:hashlib.sha256((BASE/name).read_bytes()).hexdigest() for name in names}


def metadata(p):
    return {
        'schema':VERSION,
        'caseId':p['caseId'],
        'packageSha256':network.digest(p),
        'extractorSha256':digest(FROZEN_EXTRACTOR),
        'challengeSha256':digest(FROZEN_CHALLENGE),
        'hostExpectedSha256':digest(HOST_EXPECTED),
        'model':MODEL,
        'modelDigest':DIGEST,
        'options':OPTIONS,
        'maximumModelCalls':1,
        'retries':0,
        'humanReviewRequired':True,
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }


def init(root):
    p=network.package(CASE_ID)
    root.mkdir(parents=True,exist_ok=False)
    (root/'attempt-1').mkdir()
    (root/'sessions').mkdir()
    agent.write(root/'probe.json',metadata(p))
    agent.write(root/'case-public.json',network.public_case(p))
    agent.write(root/'frozen-extractor.json',FROZEN_EXTRACTOR)
    agent.write(root/'frozen-challenge.json',FROZEN_CHALLENGE)
    agent.write(root/'host-expected.json',HOST_EXPECTED)
    print('Probe Verifier V4 v2 creato; nessuna chiamata al modello: '+str(root))


def verify(root):
    p=network.package(CASE_ID)
    if agent.read(agent.safe_path(root,'probe.json'))!=metadata(p):
        raise ValueError('Protocollo probe cambiato dopo init')
    if agent.read(agent.safe_path(root,'case-public.json'))!=network.public_case(p):
        raise ValueError('Case pubblico probe modificato')
    if agent.read(agent.safe_path(root,'frozen-extractor.json'))!=FROZEN_EXTRACTOR:
        raise ValueError('Extractor congelato modificato')
    if agent.read(agent.safe_path(root,'frozen-challenge.json'))!=FROZEN_CHALLENGE:
        raise ValueError('Challenge congelata modificata')
    if agent.read(agent.safe_path(root,'host-expected.json'))!=HOST_EXPECTED:
        raise ValueError('Expected host modificato')
    return p


def semantic_errors(answer):
    errors=[]
    if answer.get('answerOptionId')!=HOST_EXPECTED['answerOptionId']:
        errors.append('PROBE_ANSWER_OPTION_MISMATCH')

    def ids(field):
        rows=answer.get(field,[])
        if type(rows) is not list:
            return []
        return [row.get('claimId') for row in rows if type(row) is dict]

    if ids('supportedClaims')!=HOST_EXPECTED['supportedClaims']:
        errors.append('PROBE_SUPPORTED_PARTITION_MISMATCH')
    if ids('unsupportedClaims')!=HOST_EXPECTED['unsupportedClaims']:
        errors.append('PROBE_UNSUPPORTED_PARTITION_MISMATCH')
    if ids('claimsNeedingRework')!=HOST_EXPECTED['claimsNeedingRework']:
        errors.append('PROBE_REWORK_PARTITION_MISMATCH')
    return sorted(set(errors))


def validate(answer,p):
    errors=network.validate_verifier(answer,p,FROZEN_EXTRACTOR,FROZEN_CHALLENGE)
    if not errors:
        errors.extend(semantic_errors(answer))
    return sorted(set(errors))


def request_for(p):
    return network.verifier_request(p,FROZEN_EXTRACTOR,FROZEN_CHALLENGE)


def result(root):
    out=root/'attempt-1'
    receipt=out/'receipt.json'
    if not receipt.exists():
        return {'status':'PENDING'}
    network.verify_receipt(out)
    saved=agent.read(out/'result.json')
    response_path=out/'response.json'
    if response_path.exists():
        p=verify(root)
        req=request_for(p)
        if agent.read(out/'request.json')!=req:
            raise ValueError('Request probe storica non conforme')
        expected=network.expected_core('verifier-v4-branch-probe-v2',agent.read(response_path),lambda a:validate(a,p))
        for key,value in expected.items():
            if saved.get(key)!=value:
                raise ValueError('Risultato probe non riproducibile: '+key)
    return saved


def status(root):
    p=verify(root)
    row=result(root)
    if row['status']=='PENDING':
        overall='IN_PROGRESS'
    elif row['status']=='ACCEPTED':
        overall='PROPOSED_FOR_HUMAN_REVIEW'
    else:
        overall='NEEDS_REVIEW'
    return {
        'schema':VERSION,
        'caseId':p['caseId'],
        'status':overall,
        'result':row,
        'modelCalls':1 if (root/'attempt-1'/'response.json').exists() else 0,
        'humanReviewRequired':True,
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }


def run(root,client=None):
    root=root.resolve()
    lock=agent.safe_path(root,'probe.lock')
    with lock.open('x') as f:
        f.write('FAME Verifier V4 branch probe attivo\n')
    try:
        p=verify(root)
        current=status(root)
        if current['status']!='IN_PROGRESS':
            print(json.dumps(current,ensure_ascii=False,indent=2))
            return current

        client=client or agent.Ollama()
        session=root/'sessions'/str(int(time.time()*1000))
        session.mkdir()
        preflight=agent.preflight(client,MODEL)
        agent.write(session/'preflight.json',preflight)
        if preflight['model']['digest']!=DIGEST:
            raise ValueError('Digest modello diverso dal protocollo')

        out=root/'attempt-1'
        req=request_for(p)
        agent.write(out/'request.json',req)
        print('[1/1] Verifier V4 branch probe v2: attesa Ollama...',flush=True)
        started=time.monotonic()
        response=None
        try:
            response=client.request('/api/chat',req)
            agent.write(out/'response.json',response)
            answer=network.parse_complete(response)
            errors=validate(answer,p)
            row={
                'role':'verifier-v4-branch-probe-v2',
                'status':'ACCEPTED' if not errors else 'REJECTED',
                'errors':errors,
                'output':answer,
                'elapsedSeconds':time.monotonic()-started,
                'metrics':{k:response.get(k) for k in ('total_duration','load_duration','prompt_eval_count','eval_count','done_reason')},
            }
        except Exception as exc:
            row={
                'role':'verifier-v4-branch-probe',
                'status':'ERROR',
                'errors':[f'{type(exc).__name__}: {exc}'],
                'output':None,
                'elapsedSeconds':time.monotonic()-started,
                'metrics':{k:response.get(k) for k in ('total_duration','load_duration','prompt_eval_count','eval_count','done_reason')}
                    if isinstance(response,dict) else {},
            }
        agent.write(out/'result.json',row)
        network.receipt(out)
        final=status(root)
        agent.write(session/'summary.json',final)
        print(json.dumps(final,ensure_ascii=False,indent=2))
        return final
    finally:
        lock.unlink()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=('init','run','status'))
    parser.add_argument('--root',required=True,type=Path)
    args=parser.parse_args()
    try:
        root=args.root.resolve()
        if args.command=='init':
            init(root)
        elif args.command=='status':
            print(json.dumps(status(root),ensure_ascii=False,indent=2))
        else:
            final=run(root)
            raise SystemExit(0 if final['status']=='PROPOSED_FOR_HUMAN_REVIEW' else 1)
    except (ValueError,OSError,KeyError) as exc:
        parser.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__':
    main()
