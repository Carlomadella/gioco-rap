"""Direct QA worker v2: preserves first-attempt measurement and allows one validator-guided repair.

The v1 worker remains frozen for historical desks. V2 never exposes tools to the
model, never sends the host rubric/targets, and performs at most two Ollama
calls in the same invocation. The second call is operational recovery, not a
new independent first attempt.
"""
import argparse
import hashlib
import json
import time
from pathlib import Path

import agent
import direct_qa_worker as base

BASE=Path(__file__).resolve().parent
VERSION='fame-direct-qa-worker-v2'
MODEL=base.MODEL
DIGEST=base.DIGEST
OPTIONS=dict(base.OPTIONS)
SYSTEM=base.SYSTEM
MAXIMUM_MODEL_CALLS=2


def digest(value):
    return base.digest(value)


def code_hashes():
    names=('direct_qa_worker_v2.py','direct_qa_worker.py','agent.py')
    return {n:hashlib.sha256((BASE/n).read_text(encoding='utf-8').encode()).hexdigest() for n in names}


def package(task):
    return base.package(task)


def snapshot(p):
    return base.snapshot(p)


def schema(p):
    return base.schema(p)


def metadata(p):
    return dict(schema=VERSION,taskId=p['taskId'],packageSha256=digest(p),codeHashes=code_hashes(),
                model=MODEL,modelDigest=DIGEST,options=OPTIONS,thinking='server default; not overridden',
                systemSha256=digest(SYSTEM),maximumModelCalls=MAXIMUM_MODEL_CALLS,retries=1,
                repairPolicy='GENERIC_VALIDATOR_FEEDBACK_NO_CHECK_IDS_NO_EXPECTED_VALUES')


def init(root,task):
    p=package(task)
    root.mkdir(parents=True,exist_ok=False)
    agent.write(root/'desk.json',metadata(p))
    agent.write(root/'snapshot.json',snapshot(p))
    agent.write(root/'rubric-host-only.json',p['rubric'])
    print('Scrivania v2 creata; nessuna chiamata al modello: '+str(root))


def verify(root):
    m=agent.read(agent.safe_path(root,'desk.json'))
    p=package(m['taskId'])
    if m!=metadata(p):raise ValueError('Protocollo o codice v2 cambiato dopo init')
    if agent.read(agent.safe_path(root,'snapshot.json'))!=snapshot(p):raise ValueError('Snapshot modificato')
    if agent.read(agent.safe_path(root,'rubric-host-only.json'))!=p['rubric']:raise ValueError('Rubrica modificata')
    return p


def assess(answer,p):
    return base.assess(answer,p)


def payload(p):
    return dict(model=MODEL,stream=False,options=dict(OPTIONS),format=schema(p),messages=[
        dict(role='system',content=SYSTEM),
        dict(role='user',content=json.dumps(snapshot(p),ensure_ascii=False))
    ])


def response_grade(response,p):
    return base.response_grade(response,p)


def feedback_classes(validation):
    classes=[]
    errors=validation.get('errors',[])
    if any(e=='OUTPUT_CONTRACT' or e.endswith(':CONTRACT') or e.endswith(':CITATION_CONTRACT') for e in errors):
        classes.append('FORMAT_OR_CITATION_CONTRACT')
    if any(e.endswith(':INCORRECT_CONCLUSION') for e in errors):
        classes.append('SOME_CONCLUSION_INCORRECT')
    if any(e.endswith(':INSUFFICIENT_EVIDENCE') for e in errors):
        classes.append('SOME_EVIDENCE_COVERAGE_INSUFFICIENT')
    if any(e.endswith(':UNREVIEWED_EVIDENCE') for e in errors):
        classes.append('SOME_EVIDENCE_NOT_NEEDED_OR_UNREVIEWED')
    if any(e.startswith('INVALID_RESPONSE:') for e in errors):
        classes.append('INVALID_RESPONSE')
    return classes or ['VALIDATION_FAILED']


def repair_payload(p,first_response,validation):
    req=payload(p)
    msg=first_response.get('message',{}) if isinstance(first_response,dict) else {}
    previous=msg.get('content','') if isinstance(msg,dict) else ''
    classes=feedback_classes(validation)
    feedback=(
        'La risposta precedente non ha superato il validatore host. '
        'Non viene indicato quale check ha fallito e non viene fornita la risposta corretta. '
        'Categorie generiche di errore: '+', '.join(classes)+'. '
        'Rileggi tutte le affermazioni e tutte le unità, ricostruisci l intera risposta da zero, '
        'usa solo evidenze necessarie e restituisci esclusivamente il JSON richiesto.'
    )
    req['messages']=req['messages']+[
        dict(role='assistant',content=previous),
        dict(role='user',content=feedback)
    ]
    return req,classes


def write_review(out,p,answer):
    units={u['unitId']:u['text'] for u in p['units']}
    review=['# QA proposta — revisione umana richiesta','']
    for check,item in zip(p['checks'],answer['results']):
        review.extend([check['assertion'],'Supportata: '+str(item['supported']),''])
        for evidence_id in item['evidenceIds']:
            review.extend([evidence_id,units[evidence_id],''])
    (out/'review.md').write_text('\n'.join(review),encoding='utf-8')


def write_receipt(out):
    agent.write(out/'receipt.json',{'hashes':{f.name:agent.sha(f) for f in out.iterdir() if f.is_file()}})


def common_report(p):
    return dict(schema=VERSION,taskId=p['taskId'],status='ERROR',firstAttemptPass=False,
                acceptedAfterRepair=False,modelCalls=0,humanReviewRequired=True,
                executionAuthorized=False,trainingAuthorized=False,networkProductionReady=False,
                independentEvaluation=False,sourceCommit=p['sourceCommit'],packageSha256=digest(p))


def checked_response(response,p):
    try:
        return response_grade(response,p)
    except (ValueError,TypeError,KeyError) as exc:
        return None,dict(accepted=False,errors=['INVALID_RESPONSE:'+str(exc)],assessments=[])


def run(root,client=None):
    lock=agent.safe_path(root,'worker.lock')
    with lock.open('x') as f:f.write('Direct QA v2 attivo; rimuovere solo dopo arresto confermato.\n')
    try:
        p=verify(root)
        if agent.safe_path(root,'attempt-1').exists():
            raise FileExistsError('attempt-1 esiste gia; il task v2 non e rieseguibile')

        out1=agent.safe_path(root,'attempt-1');out1.mkdir()
        report1=common_report(p)
        started1=None
        first_response=None
        first_validation=None
        client=client or agent.Ollama()
        try:
            preflight=agent.preflight(client,MODEL)
            agent.write(out1/'preflight.json',preflight)
            if preflight['model']['digest']!=DIGEST:raise ValueError('Digest modello diverso dal protocollo')
            req1=payload(p);agent.write(out1/'request.json',req1)
            verify(root)
            print('QA diretto v2 attempt 1/2: attesa Ollama...',flush=True)
            started1=time.monotonic();report1['modelCalls']=1
            first_response=client.request('/api/chat',req1)
            agent.write(out1/'response.json',first_response)
            verify(root)
            first_answer,first_validation=checked_response(first_response,p)
            agent.write(out1/'validation.json',first_validation)
            if first_answer is not None:agent.write(out1/'candidate.json',first_answer)
            report1['metrics']={k:first_response.get(k) for k in ('total_duration','load_duration','prompt_eval_count','eval_count','done_reason')}
            if first_validation['accepted']:
                report1.update(status='VALIDATED_FOR_REVIEW',firstAttemptPass=True,acceptedAfterRepair=False,
                               validation=first_validation)
                agent.write(out1/'answer.json',first_answer);write_review(out1,p,first_answer)
                if started1 is not None:report1['elapsedSeconds']=time.monotonic()-started1
                agent.write(out1/'report.json',report1);write_receipt(out1)
                print(json.dumps(dict(status=report1['status'],modelCalls=1,report=str(out1/'report.json'))))
                return report1
            report1.update(status='REJECTED_REPAIR_PENDING',firstAttemptPass=False,
                           acceptedAfterRepair=False,validation=first_validation)
            if started1 is not None:report1['elapsedSeconds']=time.monotonic()-started1
            agent.write(out1/'report.json',report1);write_receipt(out1)
        except Exception as exc:
            report1.update(status='ERROR',error=f'{type(exc).__name__}: {exc}')
            if started1 is not None:report1['elapsedSeconds']=time.monotonic()-started1
            agent.write(out1/'report.json',report1);write_receipt(out1)
            print(json.dumps(dict(status='ERROR',modelCalls=report1['modelCalls'],report=str(out1/'report.json'))))
            return report1

        out2=agent.safe_path(root,'attempt-2');out2.mkdir()
        report2=common_report(p);report2['modelCalls']=1
        started2=None
        try:
            req2,classes=repair_payload(p,first_response,first_validation)
            agent.write(out2/'repair-feedback.json',{'classes':classes,'oracleTargetsSent':False,'checkIdsSentInFeedback':False})
            agent.write(out2/'request.json',req2)
            verify(root)
            print('QA diretto v2 attempt 2/2: correzione controllata...',flush=True)
            started2=time.monotonic();report2['modelCalls']=2
            response2=client.request('/api/chat',req2)
            agent.write(out2/'response.json',response2)
            verify(root)
            answer2,validation2=checked_response(response2,p)
            agent.write(out2/'validation.json',validation2)
            if answer2 is not None:agent.write(out2/'candidate.json',answer2)
            report2['metrics']={k:response2.get(k) for k in ('total_duration','load_duration','prompt_eval_count','eval_count','done_reason')}
            report2.update(status='VALIDATED_FOR_REVIEW_AFTER_REPAIR' if validation2['accepted'] else 'REJECTED',
                           firstAttemptPass=False,acceptedAfterRepair=validation2['accepted'],
                           validation=validation2,repairFeedbackClasses=classes)
            if validation2['accepted']:
                agent.write(out2/'answer.json',answer2);write_review(out2,p,answer2)
            if started2 is not None:report2['elapsedSeconds']=time.monotonic()-started2
            agent.write(out2/'report.json',report2);write_receipt(out2)
            print(json.dumps(dict(status=report2['status'],modelCalls=2,report=str(out2/'report.json'))))
            return report2
        except Exception as exc:
            report2.update(status='ERROR_AFTER_REPAIR',modelCalls=report2.get('modelCalls',1),
                           error=f'{type(exc).__name__}: {exc}')
            if started2 is not None:report2['elapsedSeconds']=time.monotonic()-started2
            agent.write(out2/'report.json',report2);write_receipt(out2)
            print(json.dumps(dict(status=report2['status'],modelCalls=report2['modelCalls'],report=str(out2/'report.json'))))
            return report2
    finally:
        lock.unlink()


def verify_receipt(out):
    receipt=out/'receipt.json'
    if not receipt.exists():return False
    hashes=agent.read(receipt)['hashes']
    current={f.name for f in out.iterdir() if f.is_file() and f.name!='receipt.json'}
    if set(hashes)!=current:raise ValueError('Artefatti diversi dalla ricevuta in '+out.name)
    for name,h in hashes.items():
        if agent.sha(out/name)!=h:raise ValueError('Artefatto modificato: '+out.name+'/'+name)
    return True


def status(root):
    p=verify(root)
    out1=agent.safe_path(root,'attempt-1')
    if not out1.exists():return dict(status='NOT_RUN')
    if not verify_receipt(out1):return dict(status='INTERRUPTED',retryAllowed=False)
    r1=agent.read(out1/'report.json')
    if r1['status']=='VALIDATED_FOR_REVIEW':
        _,v=checked_response(agent.read(out1/'response.json'),p)
        if v!=r1['validation'] or agent.read(out1/'validation.json')!=v:raise ValueError('Validazione attempt-1 non riproducibile')
        return r1
    if r1['status']=='ERROR':return r1
    if r1['status']!='REJECTED_REPAIR_PENDING':raise ValueError('Stato attempt-1 v2 non riconosciuto')

    out2=agent.safe_path(root,'attempt-2')
    if not out2.exists() or not verify_receipt(out2):return dict(status='INTERRUPTED',retryAllowed=False)
    r2=agent.read(out2/'report.json')
    if r2['status'] in ('VALIDATED_FOR_REVIEW_AFTER_REPAIR','REJECTED'):
        _,v1=checked_response(agent.read(out1/'response.json'),p)
        if v1!=r1['validation'] or agent.read(out1/'validation.json')!=v1:raise ValueError('Validazione attempt-1 non riproducibile')
        expected_req2,classes=repair_payload(p,agent.read(out1/'response.json'),v1)
        if agent.read(out2/'request.json')!=expected_req2:raise ValueError('Request repair non conforme')
        _,v2=checked_response(agent.read(out2/'response.json'),p)
        if v2!=r2['validation'] or agent.read(out2/'validation.json')!=v2:raise ValueError('Validazione attempt-2 non riproducibile')
        if r2.get('repairFeedbackClasses')!=classes:raise ValueError('Classi feedback repair non coerenti')
    return r2


def main():
    a=argparse.ArgumentParser(description=__doc__)
    a.add_argument('command',choices=('init','run','status'))
    a.add_argument('--root',required=True,type=Path)
    a.add_argument('--task',default='pfnmf-review-v1')
    args=a.parse_args()
    try:
        root=args.root.resolve()
        if args.command=='init':init(root,args.task)
        elif args.command=='status':print(json.dumps(status(root),ensure_ascii=False,indent=2))
        else:
            result=run(root)
            raise SystemExit(0 if result['status'] in ('VALIDATED_FOR_REVIEW','VALIDATED_FOR_REVIEW_AFTER_REPAIR') else 1)
    except (ValueError,OSError,KeyError) as exc:
        a.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__':main()
