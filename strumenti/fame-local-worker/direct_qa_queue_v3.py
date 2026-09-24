"""Sequential queue for direct QA worker v3 with fresh-reconstruction repair."""
import argparse
import json
from pathlib import Path
import agent
import direct_qa_worker_v3 as worker

SCHEMA='fame-direct-qa-queue-v3'
ACCEPTED={'VALIDATED_FOR_REVIEW','VALIDATED_FOR_REVIEW_AFTER_REPAIR'}


def init(root,tasks):
    if not tasks or len(tasks)>20 or len(set(tasks))!=len(tasks):raise ValueError('Da 1 a 20 task distinti')
    for task in tasks:worker.package(task)
    root.mkdir(parents=True,exist_ok=False);(root/'desks').mkdir()
    for task in tasks:worker.init(root/'desks'/task,task)
    agent.write(root/'queue.json',dict(
        schema=SCHEMA,
        tasks=tasks,
        packages={task:worker.digest(worker.package(task)) for task in tasks},
        executionAuthorized=False,
        maximumModelCallsPerTask=2,
        repairPolicy='FRESH_RECONSTRUCTION_NO_PREVIOUS_CANDIDATE_REPLAY',
    ))


def state(root):
    config=agent.read(agent.safe_path(root,'queue.json'));tasks=config['tasks']
    if config.get('schema')!=SCHEMA or not tasks or len(tasks)>20 or len(set(tasks))!=len(tasks):
        raise ValueError('Coda v3 invalida')
    if config.get('repairPolicy')!='FRESH_RECONSTRUCTION_NO_PREVIOUS_CANDIDATE_REPLAY':
        raise ValueError('Policy repair v3 invalida')
    if config['packages']!={t:worker.digest(worker.package(t)) for t in tasks}:raise ValueError('Pacchetti cambiati')
    rows=[]
    for task in tasks:
        r=worker.status(agent.safe_path(root,'desks/'+task))
        rows.append(dict(taskId=task,status=r['status'],modelCalls=r.get('modelCalls',0),
                         firstAttemptPass=r.get('firstAttemptPass'),acceptedAfterRepair=r.get('acceptedAfterRepair',False)))
    statuses=[r['status'] for r in rows]
    terminal_problems=[s for s in statuses if s not in ACCEPTED and s!='NOT_RUN']
    if all(s=='VALIDATED_FOR_REVIEW' for s in statuses):overall='VALIDATED_FOR_REVIEW'
    elif all(s in ACCEPTED for s in statuses):overall='VALIDATED_FOR_REVIEW_AFTER_REPAIR'
    elif terminal_problems:overall='NEEDS_REVIEW'
    elif any(s=='NOT_RUN' for s in statuses):overall='PENDING'
    else:overall='NEEDS_REVIEW'
    return dict(schema=SCHEMA,results=rows,status=overall,executionAuthorized=False)


def run(root,client=None):
    lock=agent.safe_path(root,'queue.lock')
    with lock.open('x') as f:f.write('Coda QA v3 attiva\n')
    try:
        current=state(root)
        for row in current['results']:
            if row['status']!='NOT_RUN':continue
            result=worker.run(agent.safe_path(root,'desks/'+row['taskId']),client)
            if result['status'] in ('ERROR','ERROR_AFTER_REPAIR'):break
        final=state(root);print(json.dumps(final,ensure_ascii=False,indent=2));return final
    finally:lock.unlink()


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('command',choices=('init','run','status'))
    p.add_argument('--root',required=True,type=Path)
    p.add_argument('--tasks',nargs='+',default=['pfnmf-review-v1'])
    a=p.parse_args()
    try:
        root=a.root.resolve()
        if a.command=='init':init(root,a.tasks)
        elif a.command=='status':print(json.dumps(state(root),ensure_ascii=False,indent=2))
        else:
            result=run(root)
            raise SystemExit(0 if result['status'] in ('VALIDATED_FOR_REVIEW','VALIDATED_FOR_REVIEW_AFTER_REPAIR') else 1)
    except (ValueError,OSError,KeyError) as exc:p.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__':main()
