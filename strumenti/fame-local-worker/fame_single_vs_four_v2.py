"""Controlled single-agent vs four-role FAME Neural comparison v2."""
import argparse
import hashlib
import json
from pathlib import Path

import agent
import fame_single_agent_baseline_v1 as baseline
import fame_four_role_network_v3 as network

BASE=Path(__file__).resolve().parent
VERSION='fame-single-vs-four-comparison-v2'
CASE_ID='single-vs-four-rubric-audit-generalization-v2'


def code_hashes():
    names=('fame_single_vs_four_v2.py','fame_single_agent_baseline_v1.py',
           'fame_four_role_network_v3.py','fame_anti_bias.py','agent.py')
    return {name:hashlib.sha256((BASE/name).read_bytes()).hexdigest() for name in names}


def metadata(p):
    return {
        'schema':VERSION,
        'caseId':p['caseId'],
        'packageSha256':network.digest(p),
        'model':network.MODEL,
        'modelDigest':network.DIGEST,
        'options':network.OPTIONS,
        'armOrder':['four-role-network','single-agent'],
        'maximumModelCalls':5,
        'retries':0,
        'codeHashes':code_hashes(),
        'humanReviewRequired':True,
        'automaticWinnerAssigned':False,
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }


def init(root,case_id):
    if case_id!=CASE_ID:
        raise ValueError('Case confronto non autorizzato: '+case_id)
    p=network.package(case_id)
    root.mkdir(parents=True,exist_ok=False)
    agent.write(root/'experiment.json',metadata(p))
    baseline.init(root/'single-agent',case_id)
    network.init(root/'four-role-network',case_id)
    print('Confronto single-vs-four creato; nessuna chiamata al modello: '+str(root))


def verify(root):
    config=agent.read(agent.safe_path(root,'experiment.json'))
    p=network.package(config.get('caseId'))
    if config!=metadata(p):
        raise ValueError('Protocollo confronto cambiato dopo init')
    if agent.read(root/'single-agent'/'host-rubric.json')!=network.host_rubric(p):
        raise ValueError('Rubrica baseline diversa')
    if agent.read(root/'four-role-network'/'host-rubric.json')!=network.host_rubric(p):
        raise ValueError('Rubrica network diversa')
    if agent.read(root/'single-agent'/'case-public.json')!=agent.read(root/'four-role-network'/'case-public.json'):
        raise ValueError('Case pubblici dei due bracci diversi')
    return p


def evidence_coverage(p,selected):
    groups=[]
    for group in p['requiredFinalEvidenceGroups']:
        hit=[eid for eid in group if eid in selected]
        groups.append({'group':group,'covered':bool(hit),'matched':hit})
    return {
        'allRequiredCovered':all(row['covered'] for row in groups),
        'groups':groups,
    }


def metric_sums(rows):
    total_elapsed=0.0
    totals={'total_duration':0,'load_duration':0,'prompt_eval_count':0,'eval_count':0}
    for row in rows:
        if type(row) is not dict:
            continue
        elapsed=row.get('elapsedSeconds')
        if isinstance(elapsed,(int,float)):
            total_elapsed+=elapsed
        metrics=row.get('metrics')
        if type(metrics) is dict:
            for key in totals:
                value=metrics.get(key)
                if isinstance(value,(int,float)):
                    totals[key]+=value
    totals['modelDurationExcludingLoadNs']=max(0,totals['total_duration']-totals['load_duration'])
    return total_elapsed,totals


def baseline_metrics(p,state):
    row=state['result']
    output=row.get('output') if type(row) is dict else None
    selected=set()
    if type(output) is dict:
        for claim in output.get('claims',[]):
            selected.update(claim.get('evidenceIds',[]))
    elapsed,usage=metric_sums([row])
    return {
        'status':state['status'],
        'accepted':row.get('status')=='ACCEPTED' if type(row) is dict else False,
        'answerOptionId':output.get('answerOptionId') if type(output) is dict else None,
        'answerMatchesHostExpected':type(output) is dict and output.get('answerOptionId')==p['expectedAnswerOptionId'],
        'selectedEvidenceIds':sorted(selected),
        'requiredEvidenceCoverage':evidence_coverage(p,selected),
        'optionalEvidenceIdsUsed':sorted(selected.intersection(p['optionalContext'])),
        'claimCount':len(output.get('claims',[])) if type(output) is dict else 0,
        'limitationsCount':len(output.get('limitations',[])) if type(output) is dict else 0,
        'modelCalls':state['modelCalls'],
        'elapsedSeconds':elapsed,
        'usage':usage,
        'humanReviewSeconds':None,
        'humanOverclaimCount':None,
        'humanCorrectionCount':None,
    }


def network_metrics(p,state):
    roles=state['roles']
    verifier=roles.get('verifier',{})
    integrator=roles.get('integrator',{})
    anti=roles.get('anti-bias',{})
    vout=verifier.get('output') if type(verifier) is dict else None
    iout=integrator.get('output') if type(integrator) is dict else None
    selected=set()
    if type(vout) is dict and type(iout) is dict:
        used=set(iout.get('usedClaimIds',[]))
        for decision in vout.get('decisions',[]):
            if decision.get('claimId') in used and decision.get('status')=='EVIDENCE_SUPPORTS_CLAIM':
                selected.update(decision.get('evidenceIds',[]))
    elapsed,usage=metric_sums([roles.get(role,{}) for role in network.ROLES])
    antiout=anti.get('output') if type(anti) is dict else None
    resolutions=vout.get('antiBiasResolution',[]) if type(vout) is dict else []
    return {
        'status':state['status'],
        'accepted':integrator.get('status')=='ACCEPTED' if type(integrator) is dict else False,
        'answerOptionId':iout.get('answerOptionId') if type(iout) is dict else None,
        'answerMatchesHostExpected':type(iout) is dict and iout.get('answerOptionId')==p['expectedAnswerOptionId'],
        'selectedEvidenceIds':sorted(selected),
        'requiredEvidenceCoverage':evidence_coverage(p,selected),
        'optionalEvidenceIdsUsed':sorted(selected.intersection(p['optionalContext'])),
        'extractorClaimCount':len(roles.get('extractor',{}).get('output',{}).get('claims',[]))
            if type(roles.get('extractor',{}).get('output')) is dict else 0,
        'limitationsCount':len(iout.get('limitations',[])) if type(iout) is dict else 0,
        'antiBiasIssueCount':len(antiout.get('issues',[])) if type(antiout) is dict else 0,
        'antiBiasBlockingIssueCount':sum(1 for x in antiout.get('issues',[]) if x.get('severity')=='BLOCKING')
            if type(antiout) is dict else 0,
        'antiBiasUnresolvedIssueCount':sum(1 for x in resolutions if x.get('status')=='UNRESOLVED'),
        'modelCalls':state['modelCalls'],
        'elapsedSeconds':elapsed,
        'usage':usage,
        'humanReviewSeconds':None,
        'humanOverclaimCount':None,
        'humanCorrectionCount':None,
    }


def compare(root):
    p=verify(root)
    single=baseline.status(root/'single-agent')
    four=network.status(root/'four-role-network')
    terminal=single['status']!='IN_PROGRESS' and four['status']!='IN_PROGRESS'
    result={
        'schema':VERSION+'-result',
        'caseId':p['caseId'],
        'status':'COMPLETE_FOR_HUMAN_REVIEW' if terminal else 'IN_PROGRESS',
        'singleAgent':baseline_metrics(p,single),
        'fourRoleNetwork':network_metrics(p,four),
        'sameFrozenQuestionAndEvidence':True,
        'sameModelDigest':True,
        'sameGenerationOptions':True,
        'automaticWinner':None,
        'humanReviewRequired':True,
        'humanReviewMeasured':False,
        'networkAdvantageGeneralizationEstablished':False,
        'notes':[
            'Raw elapsed time can be confounded by model load state; compare load_duration separately.',
            'A single case can show an observed difference but cannot establish general architecture superiority.',
            'Overclaim and correction burden remain null until human review is recorded.'
        ],
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }
    path=root/'comparison.json'
    if path.exists():
        existing=agent.read(path)
        if existing!=result:
            raise ValueError('comparison.json esistente diverso dal risultato riproducibile')
    elif terminal:
        agent.write(path,result)
    return result


def run(root,client=None):
    root=root.resolve()
    verify(root)
    client=client or agent.Ollama()

    four=network.status(root/'four-role-network')
    if four['status']=='IN_PROGRESS':
        print('=== BRACCIO 1/2: FOUR-ROLE NETWORK ===',flush=True)
        network.run(root/'four-role-network',client)

    single=baseline.status(root/'single-agent')
    if single['status']=='IN_PROGRESS':
        print('=== BRACCIO 2/2: SINGLE AGENT ===',flush=True)
        baseline.run(root/'single-agent',client)

    result=compare(root)
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=('init','run','status'))
    parser.add_argument('--root',required=True,type=Path)
    parser.add_argument('--case',default=CASE_ID)
    args=parser.parse_args()
    try:
        root=args.root.resolve()
        if args.command=='init':
            init(root,args.case)
        elif args.command=='status':
            print(json.dumps(compare(root),ensure_ascii=False,indent=2))
        else:
            result=run(root)
            raise SystemExit(0 if result['status']=='COMPLETE_FOR_HUMAN_REVIEW' else 1)
    except (ValueError,OSError,KeyError) as exc:
        parser.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__':
    main()
