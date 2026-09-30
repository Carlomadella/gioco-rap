"""Pre-registered matched-total-generation-budget comparison battery v1."""
import argparse
import hashlib
import json
from pathlib import Path

import agent
import fame_four_role_network_v3 as network
import fame_single_agent_baseline_v2 as baseline

BASE=Path(__file__).resolve().parent
VERSION='fame-single-vs-four-matched-budget-v1'
CASES=(
    ('matched-package-authoring-v1','single-agent','four-role-network'),
    ('matched-qa-review-v1','four-role-network','single-agent'),
    ('matched-cline-real-qa-v1','single-agent','four-role-network'),
    ('matched-coordinator-reject-v1','four-role-network','single-agent'),
)
SINGLE_MAX_GENERATION_TOKENS=baseline.OPTIONS['num_predict']
NETWORK_PER_CALL_MAX_GENERATION_TOKENS=network.OPTIONS['num_predict']
NETWORK_MAX_CALLS=4
NETWORK_MAX_TOTAL_GENERATION_TOKENS=NETWORK_PER_CALL_MAX_GENERATION_TOKENS*NETWORK_MAX_CALLS
MAX_MODEL_CALLS=len(CASES)*(1+NETWORK_MAX_CALLS)


def code_hashes():
    names=(
        'fame_single_vs_four_matched_budget_v1.py',
        'fame_single_agent_baseline_v2.py',
        'fame_four_role_network_v3.py',
        'fame_anti_bias.py',
        'agent.py',
    )
    return {name:hashlib.sha256((BASE/name).read_bytes()).hexdigest() for name in names}


def manifest():
    if SINGLE_MAX_GENERATION_TOKENS!=NETWORK_MAX_TOTAL_GENERATION_TOKENS:
        raise ValueError('Budget totale di generazione non equivalente')
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
        'numCtx':network.OPTIONS['num_ctx'],
        'temperature':network.OPTIONS['temperature'],
        'seed':network.OPTIONS['seed'],
        'singleAgentMaxCalls':1,
        'singleAgentMaxGenerationTokensPerCall':SINGLE_MAX_GENERATION_TOKENS,
        'singleAgentMaxTotalGenerationTokens':SINGLE_MAX_GENERATION_TOKENS,
        'networkMaxCalls':NETWORK_MAX_CALLS,
        'networkMaxGenerationTokensPerCall':NETWORK_PER_CALL_MAX_GENERATION_TOKENS,
        'networkMaxTotalGenerationTokens':NETWORK_MAX_TOTAL_GENERATION_TOKENS,
        'matchedTotalGenerationBudget':True,
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
    print('Batteria matched-budget creata; nessuna chiamata al modello: '+str(root))


def verify(root):
    root=root.resolve()
    saved=agent.read(agent.safe_path(root,'battery.json'))
    expected=manifest()
    if saved!=expected:
        raise ValueError('Manifest matched-budget o codice cambiato dopo init')
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


def evidence_coverage(p,selected):
    groups=[]
    for group in p['requiredFinalEvidenceGroups']:
        matched=[eid for eid in group if eid in selected]
        groups.append({'group':group,'covered':bool(matched),'matched':matched})
    return {'allRequiredCovered':all(row['covered'] for row in groups),'groups':groups}


def usage_from_rows(rows):
    totals={'total_duration':0,'load_duration':0,'prompt_eval_count':0,'eval_count':0}
    elapsed=0.0
    for row in rows:
        if type(row) is not dict:
            continue
        value=row.get('elapsedSeconds')
        if isinstance(value,(int,float)):
            elapsed+=value
        metrics=row.get('metrics')
        if type(metrics) is dict:
            for key in totals:
                v=metrics.get(key)
                if isinstance(v,(int,float)):
                    totals[key]+=v
    totals['modelDurationExcludingLoadNs']=max(0,totals['total_duration']-totals['load_duration'])
    return elapsed,totals


def read_response_summary(path):
    if not path.exists():
        return {
            'hasResponse':False,'done':None,'doneReason':None,'contentChars':0,
            'thinkingChars':0,'evalCount':None,'promptEvalCount':None,
        }
    response=agent.read(path)
    message=response.get('message') if type(response) is dict else None
    content=message.get('content') if type(message) is dict else None
    thinking=message.get('thinking') if type(message) is dict else None
    return {
        'hasResponse':True,
        'done':response.get('done'),
        'doneReason':response.get('done_reason'),
        'contentChars':len(content) if isinstance(content,str) else 0,
        'thinkingChars':len(thinking) if isinstance(thinking,str) else 0,
        'evalCount':response.get('eval_count'),
        'promptEvalCount':response.get('prompt_eval_count'),
    }


def baseline_metrics(p,root,state):
    row=state.get('result',{})
    output=row.get('output') if type(row) is dict else None
    selected=set()
    if type(output) is dict:
        for claim in output.get('claims',[]):
            selected.update(claim.get('evidenceIds',[]))
    elapsed,usage=usage_from_rows([row])
    response=read_response_summary(root/'attempt-1'/'response.json')
    return {
        'status':state['status'],
        'resultStatus':row.get('status') if type(row) is dict else None,
        'errors':row.get('errors',[]) if type(row) is dict else [],
        'accepted':row.get('status')=='ACCEPTED' if type(row) is dict else False,
        'answerOptionId':output.get('answerOptionId') if type(output) is dict else None,
        'answerMatchesHostExpected':type(output) is dict and output.get('answerOptionId')==p['expectedAnswerOptionId'],
        'selectedEvidenceIds':sorted(selected),
        'requiredEvidenceCoverage':evidence_coverage(p,selected),
        'optionalEvidenceIdsUsed':sorted(selected.intersection(p['optionalContext'])),
        'claimCount':len(output.get('claims',[])) if type(output) is dict else 0,
        'limitationsCount':len(output.get('limitations',[])) if type(output) is dict else 0,
        'modelCalls':state['modelCalls'],
        'maxGenerationTokensPerCall':SINGLE_MAX_GENERATION_TOKENS,
        'maxTotalGenerationTokens':SINGLE_MAX_GENERATION_TOKENS,
        'elapsedSeconds':elapsed,
        'usage':usage,
        'response':response,
        'outputTruncated':response['doneReason']=='length',
        'humanReviewSeconds':None,
        'humanOverclaimCount':None,
        'humanCorrectionCount':None,
    }


def network_metrics(p,root,state):
    roles=state.get('roles',{})
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
    elapsed,usage=usage_from_rows([roles.get(role,{}) for role in network.ROLES])
    antiout=anti.get('output') if type(anti) is dict else None
    resolutions=vout.get('antiBiasResolution',[]) if type(vout) is dict else []
    role_diagnostics={}
    truncated=[]
    errors=[]
    for role in network.ROLES:
        row=roles.get(role,{})
        response=read_response_summary(root/'roles'/role/'attempt-1'/'response.json')
        role_diagnostics[role]={
            'status':row.get('status') if type(row) is dict else None,
            'errors':row.get('errors',[]) if type(row) is dict else [],
            'response':response,
        }
        if response['doneReason']=='length':
            truncated.append(role)
        if type(row) is dict and row.get('errors'):
            errors.extend(f"{role}:{value}" for value in row['errors'])
    return {
        'status':state['status'],
        'errors':errors,
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
        'maxGenerationTokensPerCall':NETWORK_PER_CALL_MAX_GENERATION_TOKENS,
        'maxTotalGenerationTokens':NETWORK_MAX_TOTAL_GENERATION_TOKENS,
        'elapsedSeconds':elapsed,
        'usage':usage,
        'roleDiagnostics':role_diagnostics,
        'truncatedRoles':truncated,
        'outputTruncated':bool(truncated),
        'humanReviewSeconds':None,
        'humanOverclaimCount':None,
        'humanCorrectionCount':None,
    }


def case_result(root,case_id,arm_order):
    p=network.package(case_id)
    case_root=root/'cases'/case_id
    single=baseline.status(case_root/'single-agent')
    four=network.status(case_root/'four-role-network')
    terminal=single['status']!='IN_PROGRESS' and four['status']!='IN_PROGRESS'
    return {
        'schema':VERSION+'-case-result',
        'caseId':case_id,
        'armOrder':list(arm_order),
        'status':'COMPLETE_FOR_HUMAN_REVIEW' if terminal else 'IN_PROGRESS',
        'singleAgent':baseline_metrics(p,case_root/'single-agent',single),
        'fourRoleNetwork':network_metrics(p,case_root/'four-role-network',four),
        'sameFrozenQuestionAndEvidence':True,
        'sameModelDigest':True,
        'sameNumCtx':baseline.OPTIONS['num_ctx']==network.OPTIONS['num_ctx'],
        'sameTemperature':baseline.OPTIONS['temperature']==network.OPTIONS['temperature'],
        'sameSeed':baseline.OPTIONS['seed']==network.OPTIONS['seed'],
        'matchedTotalGenerationBudget':SINGLE_MAX_GENERATION_TOKENS==NETWORK_MAX_TOTAL_GENERATION_TOKENS,
        'automaticWinner':None,
        'humanReviewRequired':True,
        'humanReviewMeasured':False,
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }


def aggregate(root):
    verify(root)
    rows=[case_result(root,case_id,(first,second)) for case_id,first,second in CASES]
    complete=[row for row in rows if row['status']=='COMPLETE_FOR_HUMAN_REVIEW']
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
        'matchedTotalGenerationBudget':True,
        'cases':rows,
        'automaticSummary':{
            'bothAnswerMatchHostExpected':count(lambda r:r['singleAgent']['answerMatchesHostExpected'] and r['fourRoleNetwork']['answerMatchesHostExpected']),
            'singleOnlyAnswerMatchHostExpected':count(lambda r:r['singleAgent']['answerMatchesHostExpected'] and not r['fourRoleNetwork']['answerMatchesHostExpected']),
            'networkOnlyAnswerMatchHostExpected':count(lambda r:not r['singleAgent']['answerMatchesHostExpected'] and r['fourRoleNetwork']['answerMatchesHostExpected']),
            'neitherAnswerMatchHostExpected':count(lambda r:not r['singleAgent']['answerMatchesHostExpected'] and not r['fourRoleNetwork']['answerMatchesHostExpected']),
            'singleAccepted':count(lambda r:r['singleAgent']['accepted']),
            'networkAccepted':count(lambda r:r['fourRoleNetwork']['accepted']),
            'singleRequiredCoverageComplete':count(lambda r:r['singleAgent']['requiredEvidenceCoverage']['allRequiredCovered']),
            'networkRequiredCoverageComplete':count(lambda r:r['fourRoleNetwork']['requiredEvidenceCoverage']['allRequiredCovered']),
            'singleTruncatedCases':count(lambda r:r['singleAgent']['outputTruncated']),
            'networkTruncatedCases':count(lambda r:r['fourRoleNetwork']['outputTruncated']),
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
            'All four cases, rubrics and arm orders were frozen before any matched-budget inference.',
            'Single-agent receives one call with num_predict=16384; network receives four calls with num_predict=4096 each.',
            'Maximum total generation budget is equal, but decomposition changes prompt structure and number of independent decoding episodes.',
            'Automatic metrics do not assign an architecture winner.',
        ],
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }
    out=root/'matched-budget-result.json'
    if out.exists():
        if agent.read(out)!=result:
            raise ValueError('matched-budget-result.json non riproducibile')
    elif terminal:
        agent.write(out,result)
    return result


def hard_transport_failure(case_root,arm):
    if arm=='single-agent':
        state=baseline.status(case_root/'single-agent')
        row=state.get('result',{})
        if row.get('status')=='INTERRUPTED':
            return True
        if row.get('status')=='ERROR' and not (case_root/'single-agent'/'attempt-1'/'response.json').exists():
            return True
        return False
    state=network.status(case_root/'four-role-network')
    roles=state.get('roles',{})
    for role in network.ROLES:
        row=roles.get(role,{})
        if row.get('status')=='INTERRUPTED':
            return True
        if row.get('status')=='ERROR':
            response=case_root/'four-role-network'/'roles'/role/'attempt-1'/'response.json'
            if not response.exists():
                return True
    return False


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
        print(f'=== MATCHED BUDGET {index}/{len(CASES)}: {case_id} ===',flush=True)
        print(f'--- ARM 1/2: {first} ---',flush=True)
        run_arm(case_root,first,client)
        if hard_transport_failure(case_root,first):
            result=aggregate(root)
            print(json.dumps(result,ensure_ascii=False,indent=2))
            return result
        print(f'--- ARM 2/2: {second} ---',flush=True)
        run_arm(case_root,second,client)
        if hard_transport_failure(case_root,second):
            result=aggregate(root)
            print(json.dumps(result,ensure_ascii=False,indent=2))
            return result

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
