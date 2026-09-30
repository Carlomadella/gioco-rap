"""Matched-total-budget single-agent baseline for controlled FAME Neural comparisons."""
import argparse
import hashlib
import json
import time
from pathlib import Path

import agent
import fame_four_role_network_v3 as network

BASE=Path(__file__).resolve().parent
VERSION='fame-single-agent-baseline-v2'
MODEL=network.MODEL
DIGEST=network.DIGEST
OPTIONS=dict(network.OPTIONS)
OPTIONS['num_predict']=16384
FINAL_ACCEPTED='PROPOSED_FOR_HUMAN_REVIEW'
CONSUMED_CASES=frozenset()

SYSTEM="""Sei la baseline single-agent di FAME Neural.
Rispondi usando solo domanda, opzioni di risposta e unità di evidenza fornite.
Produci una risposta finale, il minimo insieme di claim atomici che la sostengono e gli evidence ID diretti.
Non inventare fatti, non usare strumenti, non proporre azioni operative e non autorizzare training.
Mantieni espliciti limiti e incertezze materiali. Restituisci esclusivamente il JSON richiesto.
"""


def digest(value):
    return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def code_hashes():
    names=('fame_single_agent_baseline_v2.py','fame_four_role_network_v3.py','agent.py')
    return {name:hashlib.sha256((BASE/name).read_bytes()).hexdigest() for name in names}


def schema(p):
    evidence=[u['unitId'] for u in p['units']]
    return {
        'type':'object','additionalProperties':False,
        'required':['answerOptionId','claims','answer','limitations'],
        'properties':{
            'answerOptionId':{'type':'string','enum':[row['optionId'] for row in p['answerOptions']]},
            'claims':{
                'type':'array','minItems':2,'maxItems':8,
                'items':{
                    'type':'object','additionalProperties':False,
                    'required':['claimId','statement','evidenceIds'],
                    'properties':{
                        'claimId':{'type':'string','enum':['C1','C2','C3','C4','C5','C6','C7','C8']},
                        'statement':{'type':'string','minLength':1},
                        'evidenceIds':{
                            'type':'array','minItems':1,'maxItems':4,'uniqueItems':True,
                            'items':{'type':'string','enum':evidence},
                        },
                    },
                },
            },
            'answer':{'type':'string','minLength':1},
            'limitations':{'type':'array','maxItems':6,'items':{'type':'string','minLength':1}},
        },
    }


def request_for(p):
    public={
        'caseId':p['caseId'],
        'sourceCommit':p['sourceCommit'],
        'sourcePath':p['sourcePath'],
        'question':p['question'],
        'answerOptions':p['answerOptions'],
        'units':p['units'],
    }
    return {
        'model':MODEL,'stream':False,'options':dict(OPTIONS),'format':schema(p),
        'messages':[
            {'role':'system','content':SYSTEM},
            {'role':'user','content':json.dumps(public,ensure_ascii=False)},
        ],
    }


def validate(answer,p):
    errors=[]
    if type(answer) is not dict or set(answer)!={'answerOptionId','claims','answer','limitations'}:
        return ['BASELINE_OUTPUT_CONTRACT']
    option_ids={row['optionId'] for row in p['answerOptions']}
    if answer.get('answerOptionId') not in option_ids:
        errors.append('BASELINE_ANSWER_OPTION')
    if answer.get('answerOptionId')!=p['expectedAnswerOptionId']:
        errors.append('BASELINE_INCORRECT_ANSWER_OPTION')

    claims=answer.get('claims')
    allowed={u['unitId'] for u in p['units']}
    selected=set()
    if type(claims) is not list or not 2<=len(claims)<=8:
        errors.append('BASELINE_CLAIM_COUNT')
    else:
        ids=[]
        for row in claims:
            if type(row) is not dict or set(row)!={'claimId','statement','evidenceIds'}:
                errors.append('BASELINE_CLAIM_CONTRACT');continue
            ids.append(row.get('claimId'))
            if row.get('claimId') not in ('C1','C2','C3','C4','C5','C6','C7','C8'):
                errors.append('BASELINE_CLAIM_ID')
            if not isinstance(row.get('statement'),str) or not row['statement'].strip():
                errors.append('BASELINE_CLAIM_TEXT')
            eids=row.get('evidenceIds')
            if type(eids) is not list or not eids or len(eids)>4 or len(eids)!=len(set(eids)) or any(x not in allowed for x in eids):
                errors.append('BASELINE_EVIDENCE')
            else:
                selected.update(eids)
        if len(ids)!=len(set(ids)):
            errors.append('BASELINE_DUPLICATE_CLAIM')

    for group in p['requiredFinalEvidenceGroups']:
        if not any(eid in selected for eid in group):
            errors.append('BASELINE_INSUFFICIENT_FINAL_EVIDENCE')

    if not isinstance(answer.get('answer'),str) or not answer['answer'].strip():
        errors.append('BASELINE_ANSWER')
    limitations=answer.get('limitations')
    if type(limitations) is not list or len(limitations)>6 or any(not isinstance(x,str) or not x.strip() for x in limitations):
        errors.append('BASELINE_LIMITATIONS')
    return sorted(set(errors))


def metadata(p):
    return {
        'schema':VERSION,
        'caseId':p['caseId'],
        'packageSha256':network.digest(p),
        'codeHashes':code_hashes(),
        'model':MODEL,
        'modelDigest':DIGEST,
        'options':OPTIONS,
        'maximumModelCalls':1,
        'maximumGenerationTokens':OPTIONS['num_predict'],
        'retries':0,
        'humanReviewRequired':True,
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }


def init(root,case_id):
    if case_id in CONSUMED_CASES:
        raise ValueError('Case gia consumato dalla baseline: '+case_id)
    p=network.package(case_id)
    root.mkdir(parents=True,exist_ok=False)
    (root/'attempt-1').mkdir()
    (root/'sessions').mkdir()
    agent.write(root/'baseline.json',metadata(p))
    agent.write(root/'case-public.json',network.public_case(p))
    agent.write(root/'host-rubric.json',network.host_rubric(p))
    print('Baseline single-agent creata; nessuna chiamata al modello: '+str(root))


def verify(root):
    config=agent.read(agent.safe_path(root,'baseline.json'))
    p=network.package(config.get('caseId'))
    if config!=metadata(p):
        raise ValueError('Protocollo o codice baseline cambiato dopo init')
    if agent.read(agent.safe_path(root,'case-public.json'))!=network.public_case(p):
        raise ValueError('Case pubblico baseline modificato')
    if agent.read(agent.safe_path(root,'host-rubric.json'))!=network.host_rubric(p):
        raise ValueError('Rubrica host baseline modificata')
    return p


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
            raise ValueError('Request baseline storica non conforme')
        response=agent.read(response_path)
        if saved.get('status')=='ERROR':
            if saved.get('output') is not None or not saved.get('errors'):
                raise ValueError('Risultato baseline ERROR non conforme')
            expected_metrics={k:response.get(k) for k in ('total_duration','load_duration','prompt_eval_count','eval_count','done_reason')}
            if saved.get('metrics')!=expected_metrics:
                raise ValueError('Metriche baseline ERROR non riproducibili')
        else:
            expected=network.expected_core('single-agent',response,lambda a:validate(a,p))
            for key,value in expected.items():
                if saved.get(key)!=value:
                    raise ValueError('Risultato baseline non riproducibile: '+key)
    return saved


def status(root):
    p=verify(root)
    row=result(root)
    if row['status']=='PENDING':
        overall='IN_PROGRESS'
    elif row['status']=='ACCEPTED':
        overall=FINAL_ACCEPTED
    else:
        overall='NEEDS_REVIEW'
    return {
        'schema':VERSION,'caseId':p['caseId'],'status':overall,'result':row,
        'modelCalls':1 if (root/'attempt-1'/'response.json').exists() else 0,
        'humanReviewRequired':True,'executionAuthorized':False,'trainingAuthorized':False,
        'networkProductionReady':False,'independentEvaluation':False,
    }


def run(root,client=None):
    root=root.resolve()
    lock=agent.safe_path(root,'baseline.lock')
    with lock.open('x') as f:
        f.write('FAME single-agent baseline attiva\n')
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
        print('[baseline 1/1] Single agent matched-budget: attesa Ollama...',flush=True)
        started=time.monotonic()
        response=None
        try:
            response=client.request('/api/chat',req)
            agent.write(out/'response.json',response)
            answer=network.parse_complete(response)
            errors=validate(answer,p)
            row={
                'role':'single-agent',
                'status':'ACCEPTED' if not errors else 'REJECTED',
                'errors':errors,
                'output':answer,
                'elapsedSeconds':time.monotonic()-started,
                'metrics':{k:response.get(k) for k in ('total_duration','load_duration','prompt_eval_count','eval_count','done_reason')},
            }
        except Exception as exc:
            row={
                'role':'single-agent',
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
    parser.add_argument('--case')
    args=parser.parse_args()
    try:
        root=args.root.resolve()
        if args.command=='init':
            if not args.case:
                raise ValueError('--case richiesto per init')
            init(root,args.case)
        elif args.command=='status':
            print(json.dumps(status(root),ensure_ascii=False,indent=2))
        else:
            final=run(root)
            raise SystemExit(0 if final['status']==FINAL_ACCEPTED else 1)
    except (ValueError,OSError,KeyError) as exc:
        parser.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__':
    main()
