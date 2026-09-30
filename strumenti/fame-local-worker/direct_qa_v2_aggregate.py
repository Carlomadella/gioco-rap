"""Aggregate immutable Direct QA v2 run artifacts without replaying them under newer code."""
import argparse
import json
from collections import Counter
from pathlib import Path

import agent

SCHEMA='fame-direct-qa-v2-aggregate-v1'
WORKER_SCHEMA='fame-direct-qa-worker-v2'
ACCEPTED={'VALIDATED_FOR_REVIEW','VALIDATED_FOR_REVIEW_AFTER_REPAIR'}


def verify_receipt(out):
    receipt=out/'receipt.json'
    if not receipt.is_file():
        raise ValueError('Receipt mancante: '+str(out))
    hashes=agent.read(receipt).get('hashes')
    if type(hashes) is not dict:
        raise ValueError('Receipt invalida: '+str(out))
    for name in hashes:
        if not isinstance(name,str) or Path(name).name!=name or '/' in name or '\\' in name:
            raise ValueError('Nome artefatto invalido nella receipt')
    current={p.name for p in out.iterdir() if p.is_file() and p.name!='receipt.json'}
    if set(hashes)!=current:
        raise ValueError('Artefatti diversi dalla receipt: '+str(out))
    for name,expected in hashes.items():
        path=out/name
        if agent.sha(path)!=expected:
            raise ValueError('Hash artefatto non valido: '+str(path))


def load_attempt(root,number):
    out=root/f'attempt-{number}'
    if not out.exists():
        return None
    if not out.is_dir():
        raise ValueError('Attempt non e una cartella: '+str(out))
    verify_receipt(out)
    report=agent.read(out/'report.json')
    if report.get('schema')!=WORKER_SCHEMA:
        raise ValueError('Schema report v2 non valido: '+str(out))
    return report


def validation_counts(report):
    validation=report.get('validation') or {}
    assessments=validation.get('assessments') or []
    return {
        'errors':len(validation.get('errors') or []),
        'precisionWarnings':sum(len(row.get('precisionWarnings') or []) for row in assessments),
        'unreviewedEvidenceIds':sum(len(row.get('unreviewedEvidenceIds') or []) for row in assessments),
        'incorrectConclusions':sum(row.get('conclusionCorrect') is False for row in assessments),
        'insufficientCoverage':sum(row.get('coverage')=='INSUFFICIENT' for row in assessments),
        'droppedEvidenceIds':sum(len(ids) for ids in (validation.get('droppedEvidence') or {}).values()),
        'hostSalvageApplied':validation.get('hostSalvageApplied') is True,
    }


def is_clean(report):
    c=validation_counts(report)
    return (
        report.get('status') in ACCEPTED
        and c['errors']==0
        and c['precisionWarnings']==0
        and c['unreviewedEvidenceIds']==0
        and c['droppedEvidenceIds']==0
        and not c['hostSalvageApplied']
    )


def classification(first,final):
    status=final.get('status')
    salvage=validation_counts(final)['hostSalvageApplied']
    if status=='VALIDATED_FOR_REVIEW' and final.get('firstAttemptPass') is True:
        if salvage:
            return 'FIRST_PASS_SALVAGED'
        return 'FIRST_PASS_RAW_CLEAN' if is_clean(final) else 'FIRST_PASS_WITH_WARNINGS'
    if status=='VALIDATED_FOR_REVIEW_AFTER_REPAIR' and final.get('acceptedAfterRepair') is True:
        if salvage:
            return 'ACCEPTED_AFTER_REPAIR_WITH_SALVAGE'
        return 'ACCEPTED_AFTER_REPAIR_RAW_CLEAN' if is_clean(final) else 'ACCEPTED_AFTER_REPAIR_WITH_WARNINGS'
    if status=='REJECTED':
        return 'REJECTED'
    if status in ('ERROR','ERROR_AFTER_REPAIR'):
        return status
    return status or 'UNKNOWN'


def numeric_sum(reports,key,section=None):
    total=0
    seen=False
    for report in reports:
        value=(report.get(section) or {}).get(key) if section else report.get(key)
        if isinstance(value,(int,float)) and not isinstance(value,bool):
            total+=value
            seen=True
    return total if seen else None


def load_root(root):
    root=root.resolve()
    if not root.is_dir():
        raise ValueError('Root inesistente: '+str(root))
    desk=agent.read(root/'desk.json')
    if desk.get('schema')!=WORKER_SCHEMA:
        raise ValueError('Desk v2 non valida: '+str(root))
    task=desk.get('taskId')
    package_sha=desk.get('packageSha256')
    if not isinstance(task,str) or not task or not isinstance(package_sha,str) or not package_sha:
        raise ValueError('Metadati desk incompleti: '+str(root))

    first=load_attempt(root,1)
    if first is None:
        raise ValueError('Attempt-1 mancante: '+str(root))
    second=load_attempt(root,2)
    reports=[first]+([second] if second else [])
    final=second or first

    for report in reports:
        if report.get('taskId')!=task:
            raise ValueError('Task ID report/desk non coerente: '+str(root))
        if report.get('packageSha256')!=package_sha:
            raise ValueError('Package hash report/desk non coerente: '+str(root))

    final_counts=validation_counts(final)
    done_reasons=[(r.get('metrics') or {}).get('done_reason') for r in reports]
    return {
        'taskId':task,
        'root':str(root),
        'classification':classification(first,final),
        'finalStatus':final.get('status'),
        'firstAttemptStatus':first.get('status'),
        'firstAttemptPass':final.get('firstAttemptPass') is True,
        'acceptedAfterRepair':final.get('acceptedAfterRepair') is True,
        'modelCalls':final.get('modelCalls',len(reports)),
        'attempts':len(reports),
        'outputTruncatedAttempts':sum(reason=='length' for reason in done_reasons),
        'finalValidation':final_counts,
        'attemptElapsedSeconds':numeric_sum(reports,'elapsedSeconds'),
        'ollamaTotalDurationNs':numeric_sum(reports,'total_duration','metrics'),
        'ollamaLoadDurationNs':numeric_sum(reports,'load_duration','metrics'),
        'promptEvalCount':numeric_sum(reports,'prompt_eval_count','metrics'),
        'evalCount':numeric_sum(reports,'eval_count','metrics'),
        'historicalCodeHashes':desk.get('codeHashes'),
        'packageSha256':package_sha,
    }


def expand_roots(roots):
    desks=[]
    for value in roots:
        root=Path(value).resolve()
        if not root.is_dir():
            raise ValueError('Root inesistente: '+str(root))
        if (root/'desk.json').is_file():
            desks.append(root)
            continue
        queue_path=root/'queue.json'
        if queue_path.is_file() and (root/'desks').is_dir():
            queue=agent.read(queue_path)
            if queue.get('schema')!='fame-direct-qa-queue-v2':
                raise ValueError('Queue v2 non valida: '+str(root))
            tasks=queue.get('tasks')
            if type(tasks) is not list or not tasks:
                raise ValueError('Queue senza task: '+str(root))
            for task in tasks:
                if not isinstance(task,str) or not task:
                    raise ValueError('Task queue non valido: '+str(root))
                desk=root/'desks'/task
                if not desk.is_dir():
                    raise ValueError('Desk mancante nella queue: '+str(desk))
                desks.append(desk)
            continue
        raise ValueError('Root non riconosciuta come desk o queue v2: '+str(root))
    return desks


def summarize(roots):
    rows=[load_root(root) for root in expand_roots(roots)]
    tasks=[row['taskId'] for row in rows]
    if len(tasks)!=len(set(tasks)):
        raise ValueError('Task duplicato: un task consumato puo comparire una sola volta nel riepilogo')

    classes=Counter(row['classification'] for row in rows)
    accepted=sum(row['finalStatus'] in ACCEPTED for row in rows)
    return {
        'schema':SCHEMA,
        'runs':rows,
        'summary':{
            'tasks':len(rows),
            'acceptedFinal':accepted,
            'firstPassRawClean':classes['FIRST_PASS_RAW_CLEAN'],
            'firstPassSalvaged':classes['FIRST_PASS_SALVAGED'],
            'firstPassWithWarnings':classes['FIRST_PASS_WITH_WARNINGS'],
            'acceptedAfterRepair':sum(row['acceptedAfterRepair'] for row in rows),
            'rejectedFinal':sum(row['finalStatus']=='REJECTED' for row in rows),
            'errorFinal':sum(row['finalStatus'] in ('ERROR','ERROR_AFTER_REPAIR') for row in rows),
            'outputTruncatedAttempts':sum(row['outputTruncatedAttempts'] for row in rows),
            'hostSalvageTasks':sum(row['finalValidation']['hostSalvageApplied'] for row in rows),
            'droppedEvidenceIds':sum(row['finalValidation']['droppedEvidenceIds'] for row in rows),
            'precisionWarningsFinal':sum(row['finalValidation']['precisionWarnings'] for row in rows),
            'unreviewedEvidenceFinal':sum(row['finalValidation']['unreviewedEvidenceIds'] for row in rows),
            'incorrectConclusionsFinal':sum(row['finalValidation']['incorrectConclusions'] for row in rows),
            'insufficientCoverageFinal':sum(row['finalValidation']['insufficientCoverage'] for row in rows),
            'modelCalls':sum(row['modelCalls'] for row in rows if isinstance(row['modelCalls'],int)),
            'attemptElapsedSeconds':sum(row['attemptElapsedSeconds'] or 0 for row in rows),
            'ollamaTotalDurationNs':sum(row['ollamaTotalDurationNs'] or 0 for row in rows),
            'ollamaLoadDurationNs':sum(row['ollamaLoadDurationNs'] or 0 for row in rows),
            'promptEvalCount':sum(row['promptEvalCount'] or 0 for row in rows),
            'evalCount':sum(row['evalCount'] or 0 for row in rows),
            'humanReviewTimeMeasured':False,
            'humanReviewSeconds':None,
            'executionAuthorized':False,
            'trainingAuthorized':False,
            'networkProductionReady':False,
            'independentEvaluation':False,
        },
        'classificationCounts':dict(sorted(classes.items())),
    }


def build_parser():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root',action='append',required=True,type=Path,
                   help='Root FAME_DIRECT_QA_NETWORK_V2_*; ripetere per ogni run storico')
    p.add_argument('--out',type=Path,help='Nuova cartella in cui scrivere aggregate.json')
    return p


def main():
    p=build_parser()
    args=p.parse_args()
    try:
        result=summarize(args.root)
        if args.out:
            out=args.out.resolve()
            out.mkdir(parents=True,exist_ok=False)
            agent.write(out/'aggregate.json',result)
        print(json.dumps(result,ensure_ascii=False,indent=2))
    except (ValueError,OSError,KeyError) as exc:
        p.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__':
    main()
