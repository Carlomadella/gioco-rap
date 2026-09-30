"""Pre-registered four-case single-agent vs Four-Role Network battery v1."""
import argparse
import hashlib
import json
from pathlib import Path

import agent
import fame_four_role_network_v3 as network
import fame_single_agent_baseline_v1 as baseline
import fame_single_vs_four_v1 as metrics

BASE=Path(__file__).resolve().parent
VERSION='fame-single-vs-four-battery-v1'
CASES=(
    ('battery-qa-transfer-v1','single-agent','four-role-network'),
    ('battery-recovery-v1','four-role-network','single-agent'),
    ('battery-gptoss-diagnostic-v1','single-agent','four-role-network'),
    ('battery-anti-bias-v1','four-role-network','single-agent'),
)
MAX_MODEL_CALLS=len(CASES)*5


def code_hashes():
    names=(
        'fame_single_vs_four_battery_v1.py',
        'fame_single_agent_baseline_v1.py',
        'fame_single_vs_four_v1.py',
        'fame_four_role_network_v3.py',
        'fame_anti_bias.py',
        'agent.py',
    )
    return {name:hashlib.sha256((BASE/name).read_bytes()).hexdigest() for name in names}


def manifest():
    rows=[]
    for case_id,first,second in CASES:
        p=network.package(case_id)
        rows.append({
            'caseId':case_id,
            'packageSha256':network.digest(p),
            'armOrder':[first,second],
        })
    return {
        'schema':VERSION,
        'cases':rows,
        'preRegisteredCaseCount':len(rows),
        'maximumModelCalls':MAX_MODEL_CALLS,
        'model':network.MODEL,
        'modelDigest':network.DIGEST,
        'options':network.OPTIONS,
        'armOrderCounts':{
            'singleAgentFirst':sum(1 for _,first,_ in CASES if first=='single-agent'),
            'fourRoleFirst':sum(1 for _,first,_ in CASES if first=='four-role-network'),
        },
        'codeHashes':code_hashes(),
        'humanReviewRequired':True,
        'automaticWinnerAssigned':False,
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }


def init(root):
    root=root.resolve()
    root.mkdir(parents=True,exist_ok=False)
    (root/'cases').mkdir()
    agent.write(root/'battery.json',manifest())
    for case_id,_,_ in CASES:
        case_root=root/'cases'/case_id
        case_root.mkdir()
        baseline.init(case_root/'single-agent',case_id)
        network.init(case_root/'four-role-network',case_id)
    print('Batteria single-vs-four creata; nessuna chiamata al modello: '+str(root))


def verify(root):
    root=root.resolve()
    saved=agent.read(agent.safe_path(root,'battery.json'))
    expected=manifest()
    if saved!=expected:
        raise ValueError('Manifest batteria o codice cambiato dopo init')
    for case_id,_,_ in CASES:
        p=network.package(case_id)
        case_root=root/'cases'/case_id
        single_case=agent.read(agent.safe_path(case_root/'single-agent','case-public.json'))
        network_case=agent.read(agent.safe_path(case_root/'four-role-network','case-public.json'))
        if single_case!=network.public_case(p) or network_case!=network.public_case(p):
            raise ValueError('Case congelato non conforme: '+case_id)
        single_rubric=agent.read(agent.safe_path(case_root/'single-agent','host-rubric.json'))
        network_rubric=agent.read(agent.safe_path(case_root/'four-role-network','host-rubric.json'))
        if single_rubric!=network.host_rubric(p) or network_rubric!=network.host_rubric(p):
            raise ValueError('Rubrica congelata non conforme: '+case_id)
    return saved


def transport_error(single_state,four_state):
    row=single_state.get('result',{})
    if isinstance(row,dict) and row.get('status') in ('ERROR','INTERRUPTED'):
        return True
    roles=four_state.get('roles',{})
    return any(
        isinstance(roles.get(role),dict) and roles[role].get('status') in ('ERROR','INTERRUPTED')
        for role in network.ROLES
    )


def case_result(root,case_id,arm_order):
    p=network.package(case_id)
    case_root=root/'cases'/case_id
    single=baseline.status(case_root/'single-agent')
    four=network.status(case_root/'four-role-network')
    terminal=single['status']!='IN_PROGRESS' and four['status']!='IN_PROGRESS'
    result={
        'schema':VERSION+'-case-result',
        'caseId':case_id,
        'armOrder':list(arm_order),
        'status':'COMPLETE_FOR_HUMAN_REVIEW' if terminal else 'IN_PROGRESS',
        'singleAgent':metrics.baseline_metrics(p,single),
        'fourRoleNetwork':metrics.network_metrics(p,four),
        'sameFrozenQuestionAndEvidence':True,
        'sameModelDigest':True,
        'sameGenerationOptions':True,
        'automaticWinner':None,
        'humanReviewRequired':True,
        'humanReviewMeasured':False,
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }
    out=case_root/'comparison.json'
    if out.exists():
        if agent.read(out)!=result:
            raise ValueError('comparison.json non riproducibile: '+case_id)
    elif terminal:
        agent.write(out,result)
    return result


def aggregate(root):
    verify(root)
    case_results=[
        case_result(root,case_id,(first,second))
        for case_id,first,second in CASES
    ]
    complete=[row for row in case_results if row['status']=='COMPLETE_FOR_HUMAN_REVIEW']
    terminal=len(complete)==len(CASES)

    def count(pred):
        return sum(1 for row in complete if pred(row))

    def sum_metric(arm,path):
        total=0
        for row in complete:
            value=row[arm]
            for key in path:
                value=value[key]
            if isinstance(value,(int,float)):
                total+=value
        return total

    result={
        'schema':VERSION+'-result',
        'status':'COMPLETE_FOR_HUMAN_REVIEW' if terminal else 'IN_PROGRESS',
        'preRegisteredCaseCount':len(CASES),
        'completedCaseCount':len(complete),
        'armOrderBalanced':manifest()['armOrderCounts']=={'singleAgentFirst':2,'fourRoleFirst':2},
        'cases':case_results,
        'automaticSummary':{
            'bothAnswerMatchHostExpected':count(lambda r:r['singleAgent']['answerMatchesHostExpected'] and r['fourRoleNetwork']['answerMatchesHostExpected']),
            'singleOnlyAnswerMatchHostExpected':count(lambda r:r['singleAgent']['answerMatchesHostExpected'] and not r['fourRoleNetwork']['answerMatchesHostExpected']),
            'networkOnlyAnswerMatchHostExpected':count(lambda r:not r['singleAgent']['answerMatchesHostExpected'] and r['fourRoleNetwork']['answerMatchesHostExpected']),
            'neitherAnswerMatchHostExpected':count(lambda r:not r['singleAgent']['answerMatchesHostExpected'] and not r['fourRoleNetwork']['answerMatchesHostExpected']),
            'singleRequiredCoverageComplete':count(lambda r:r['singleAgent']['requiredEvidenceCoverage']['allRequiredCovered']),
            'networkRequiredCoverageComplete':count(lambda r:r['fourRoleNetwork']['requiredEvidenceCoverage']['allRequiredCovered']),
            'singleAccepted':count(lambda r:r['singleAgent']['accepted']),
            'networkAccepted':count(lambda r:r['fourRoleNetwork']['accepted']),
            'singleModelCalls':sum_metric('singleAgent',['modelCalls']),
            'networkModelCalls':sum_metric('fourRoleNetwork',['modelCalls']),
            'singlePromptEvalCount':sum_metric('singleAgent',['usage','prompt_eval_count']),
            'networkPromptEvalCount':sum_metric('fourRoleNetwork',['usage','prompt_eval_count']),
            'singleEvalCount':sum_metric('singleAgent',['usage','eval_count']),
            'networkEvalCount':sum_metric('fourRoleNetwork',['usage','eval_count']),
            'singleModelDurationExcludingLoadNs':sum_metric('singleAgent',['usage','modelDurationExcludingLoadNs']),
            'networkModelDurationExcludingLoadNs':sum_metric('fourRoleNetwork',['usage','modelDurationExcludingLoadNs']),
            'networkAntiBiasIssueCount':sum_metric('fourRoleNetwork',['antiBiasIssueCount']),
            'networkAntiBiasUnresolvedIssueCount':sum_metric('fourRoleNetwork',['antiBiasUnresolvedIssueCount']),
        },
        'automaticWinner':None,
        'humanReviewRequired':True,
        'humanReviewMeasured':False,
        'humanCaseAssessments':None,
        'architectureGeneralizationEstablished':False,
        'notes':[
            'All four cases and arm orders were frozen before any battery inference.',
            'Automatic metrics do not assign an architecture winner.',
            'Human overclaim, parsimony and correction burden must be reviewed after the full battery.',
        ],
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }
    out=root/'battery-result.json'
    if out.exists():
        if agent.read(out)!=result:
            raise ValueError('battery-result.json non riproducibile')
    elif terminal:
        agent.write(out,result)
    return result


def run_arm(case_root,arm,client):
    if arm=='single-agent':
        state=baseline.status(case_root/'single-agent')
        if state['status']=='IN_PROGRESS':
            baseline.run(case_root/'single-agent',client)
    elif arm=='four-role-network':
        state=network.status(case_root/'four-role-network')
        if state['status']=='IN_PROGRESS':
            network.run(case_root/'four-role-network',client)
    else:
        raise ValueError('Arm sconosciuto: '+arm)


def run(root,client=None):
    root=root.resolve()
    verify(root)
    client=client or agent.Ollama()
    for index,(case_id,first,second) in enumerate(CASES,1):
        case_root=root/'cases'/case_id
        single=baseline.status(case_root/'single-agent')
        four=network.status(case_root/'four-role-network')
        if single['status']!='IN_PROGRESS' and four['status']!='IN_PROGRESS':
            continue
        print(f'=== BATTERIA {index}/{len(CASES)}: {case_id} ===',flush=True)
        print(f'--- ARM 1/2: {first} ---',flush=True)
        run_arm(case_root,first,client)
        single=baseline.status(case_root/'single-agent')
        four=network.status(case_root/'four-role-network')
        if transport_error(single,four):
            print(json.dumps(aggregate(root),ensure_ascii=False,indent=2))
            return aggregate(root)
        print(f'--- ARM 2/2: {second} ---',flush=True)
        run_arm(case_root,second,client)
        single=baseline.status(case_root/'single-agent')
        four=network.status(case_root/'four-role-network')
        if transport_error(single,four):
            print(json.dumps(aggregate(root),ensure_ascii=False,indent=2))
            return aggregate(root)

    result=aggregate(root)
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return result


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
            print(json.dumps(aggregate(root),ensure_ascii=False,indent=2))
        else:
            result=run(root)
            raise SystemExit(0 if result['status']=='COMPLETE_FOR_HUMAN_REVIEW' else 1)
    except (ValueError,OSError,KeyError) as exc:
        parser.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__':
    main()
