"""Deterministic sequential queue for independent direct QA desks."""
import argparse
import json
from pathlib import Path
import agent
import direct_qa_worker as worker


def init(root,tasks):
    if not tasks or len(tasks)>20 or len(set(tasks))!=len(tasks):raise ValueError('Da 1 a 20 task distinti')
    for task in tasks:worker.package(task)
    root.mkdir(parents=True,exist_ok=False)
    (root/'desks').mkdir()
    for task in tasks:worker.init(root/'desks'/task,task)
    agent.write(root/'queue.json',dict(schema='fame-direct-qa-queue-v1',tasks=tasks,
        packages={task:worker.digest(worker.package(task)) for task in tasks},executionAuthorized=False))


def state(root):
    config=agent.read(agent.safe_path(root,'queue.json'));tasks=config['tasks']
    if config.get('schema')!='fame-direct-qa-queue-v1' or not tasks or len(tasks)>20 or len(set(tasks))!=len(tasks):raise ValueError('Coda invalida')
    if config['packages']!={t:worker.digest(worker.package(t)) for t in tasks}:raise ValueError('Pacchetti cambiati')
    rows=[]
    for task in tasks:
        r=worker.status(agent.safe_path(root,'desks/'+task))
        rows.append(dict(taskId=task,status=r['status'],modelCalls=r.get('modelCalls',0)))
    return dict(schema='fame-direct-qa-queue-v1',results=rows,
                status='VALIDATED_FOR_REVIEW' if all(r['status']=='VALIDATED_FOR_REVIEW' for r in rows) else
                'PENDING' if any(r['status']=='NOT_RUN' for r in rows) else 'NEEDS_REVIEW',
                executionAuthorized=False)


def run(root,client=None):
    lock=agent.safe_path(root,'queue.lock')
    with lock.open('x') as f:f.write('Coda attiva\n')
    try:
        current=state(root)
        for row in current['results']:
            if row['status']!='NOT_RUN':continue
            r=worker.run(agent.safe_path(root,'desks/'+row['taskId']),client)
            if r['status']=='ERROR':break
        result=state(root);print(json.dumps(result,ensure_ascii=False,indent=2));return result
    finally:lock.unlink()


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=('init','run','status'))
    p.add_argument('--root',required=True,type=Path);p.add_argument('--tasks',nargs='+',default=['pfnmf-review-v1']);a=p.parse_args()
    try:
        root=a.root.resolve()
        if a.command=='init':init(root,a.tasks)
        elif a.command=='status':print(json.dumps(state(root),ensure_ascii=False,indent=2))
        else:raise SystemExit(0 if run(root)['status']=='VALIDATED_FOR_REVIEW' else 1)
    except (ValueError,OSError,KeyError) as exc:p.exit(2,f'ERRORE: {exc}\n')

if __name__=='__main__':main()
