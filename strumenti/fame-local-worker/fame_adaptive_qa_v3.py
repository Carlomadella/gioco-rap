"""Adaptive FAME QA v3: single-agent primary, Four-Role V9 only on bounded failure triggers.

V1/V2 remain frozen for reproducibility. V3 changes only the escalation network
from Four-Role V6 to Four-Role V9; the trigger policy and call bounds remain
unchanged.
"""
import argparse
import hashlib
import json
from pathlib import Path

import agent
import fame_single_agent_baseline_v2 as baseline
import fame_four_role_network_v9 as network

BASE=Path(__file__).resolve().parent
VERSION='fame-adaptive-qa-v3'
TRIGGER_POLICY_VERSION='adaptive-escalation-policy-v1'


def package_digest(value):
    return hashlib.sha256(
        json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
    ).hexdigest()


def code_hashes():
    names=(
        'fame_adaptive_qa_v3.py',
        'fame_single_agent_baseline_v2.py',
        'fame_four_role_network_v9.py',
        'fame_four_role_network_v8.py',
        'fame_four_role_network_v7.py',
        'fame_four_role_network_v6.py',
        'fame_four_role_network_v5.py',
        'fame_four_role_network_v4.py',
        'fame_anti_bias.py',
        'agent.py',
    )
    return {name:hashlib.sha256((BASE/name).read_bytes()).hexdigest() for name in names}


def metadata(case_id):
    p=network.package(case_id)
    return {
        'schema':VERSION,
        'caseId':case_id,
        'packageSha256':package_digest(p),
        'triggerPolicyVersion':TRIGGER_POLICY_VERSION,
        'escalationNetwork':'fame-four-role-network-v9',
        'baselineModelCallsMax':1,
        'networkModelCallsMaxOnEscalation':4,
        'maximumModelCalls':5,
        'baselineNumPredict':baseline.OPTIONS['num_predict'],
        'networkNumPredictPerCall':network.OPTIONS['num_predict'],
        'model':network.MODEL,
        'modelDigest':network.DIGEST,
        'optionsShared':{
            'num_ctx':network.OPTIONS['num_ctx'],
            'temperature':network.OPTIONS['temperature'],
            'seed':network.OPTIONS['seed'],
        },
        'escalationPolicy':{
            'baselineAccepted':'NO_ESCALATION',
            'baselineRejectedWithResponse':'ESCALATE',
            'baselineErrorWithResponse':'ESCALATE',
            'baselineFailureWithoutResponse':'STOP_NO_ESCALATION',
            'automaticRetry':False,
        },
        'codeHashes':code_hashes(),
        'humanReviewRequired':True,
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }


def init(root,case_id):
    root=root.resolve()
    root.mkdir(parents=True,exist_ok=False)
    baseline.init(root/'single-agent',case_id)
    network.init(root/'four-role-network-v9',case_id)
    agent.write(root/'adaptive.json',metadata(case_id))
    print('Adaptive QA v3 creato; nessuna chiamata al modello: '+str(root))


def verify(root):
    root=root.resolve()
    saved=agent.read(agent.safe_path(root,'adaptive.json'))
    case_id=saved['caseId']
    expected=metadata(case_id)
    if saved!=expected:
        raise ValueError('Protocollo adaptive v3 o codice cambiato dopo init')
    if baseline.status(root/'single-agent')['caseId']!=case_id:
        raise ValueError('Baseline case mismatch')
    if network.status(root/'four-role-network-v9')['caseId']!=case_id:
        raise ValueError('Network V9 case mismatch')
    return case_id


def response_exists(root):
    return (root/'single-agent'/'attempt-1'/'response.json').exists()


def classify_trigger(root,base_state):
    row=base_state.get('result',{})
    if base_state['status']==baseline.FINAL_ACCEPTED:
        return {
            'decision':'NO_ESCALATION',
            'trigger':'BASELINE_ACCEPTED',
            'reason':'Baseline accepted by frozen host rubric with required coverage complete.',
        }

    has_response=response_exists(root)
    if not has_response:
        return {
            'decision':'STOP_NO_ESCALATION',
            'trigger':'NO_RESPONSE_OPERATIONAL_FAILURE',
            'reason':'Baseline did not produce a response; escalating to the same backend would not be a bounded semantic recovery.',
        }

    metrics=row.get('metrics') if type(row) is dict else {}
    if type(metrics) is dict and metrics.get('done_reason')=='length':
        return {
            'decision':'ESCALATE',
            'trigger':'OUTPUT_TRUNCATED',
            'reason':'Baseline response exhausted its generation budget before a valid accepted result.',
        }

    errors=row.get('errors',[]) if type(row) is dict else []
    if 'BASELINE_INSUFFICIENT_FINAL_EVIDENCE' in errors:
        return {
            'decision':'ESCALATE',
            'trigger':'INSUFFICIENT_FINAL_EVIDENCE',
            'reason':'Baseline answer was not accepted because required final evidence coverage was incomplete.',
        }

    if row.get('status')=='REJECTED':
        return {
            'decision':'ESCALATE',
            'trigger':'HOST_REJECTED_BASELINE',
            'reason':'Baseline produced a complete response but failed the frozen host rubric.',
        }

    if row.get('status')=='ERROR':
        return {
            'decision':'ESCALATE',
            'trigger':'POST_RESPONSE_BASELINE_ERROR',
            'reason':'Baseline produced a response but failed after response receipt.',
        }

    return {
        'decision':'STOP_NO_ESCALATION',
        'trigger':'UNCLASSIFIED_BASELINE_STATE',
        'reason':'Baseline state is not covered by the frozen adaptive escalation policy.',
    }


def result(root):
    root=root.resolve()
    case_id=verify(root)
    base=baseline.status(root/'single-agent')
    trigger=classify_trigger(root,base)

    net=network.status(root/'four-role-network-v9')
    if trigger['decision']=='NO_ESCALATION':
        overall='PROPOSED_FOR_HUMAN_REVIEW'
        selected='single-agent'
        recovered=False
    elif trigger['decision']=='STOP_NO_ESCALATION':
        overall='NEEDS_REVIEW'
        selected=None
        recovered=False
    elif net['status']=='PROPOSED_FOR_HUMAN_REVIEW':
        overall='PROPOSED_FOR_HUMAN_REVIEW'
        selected='four-role-network-v9'
        recovered=True
    elif net['status']=='IN_PROGRESS':
        overall='IN_PROGRESS'
        selected=None
        recovered=False
    else:
        overall='NEEDS_REVIEW'
        selected=None
        recovered=False

    calls=base.get('modelCalls',0)+net.get('modelCalls',0)
    return {
        'schema':VERSION,
        'caseId':case_id,
        'status':overall,
        'triggerDecision':trigger,
        'selectedPath':selected,
        'recoveredByEscalation':recovered,
        'baseline':base,
        'fourRoleNetworkV9':net,
        'modelCalls':calls,
        'humanReviewRequired':True,
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }


def run(root,client=None):
    root=root.resolve()
    verify(root)
    client=client or agent.Ollama()

    base=baseline.status(root/'single-agent')
    if base['status']=='IN_PROGRESS':
        print('=== ADAPTIVE V3 STAGE 1/2: SINGLE AGENT ===',flush=True)
        baseline.run(root/'single-agent',client)

    base=baseline.status(root/'single-agent')
    trigger=classify_trigger(root,base)
    print(json.dumps({'adaptiveTrigger':trigger},ensure_ascii=False,indent=2),flush=True)

    if trigger['decision']=='ESCALATE':
        net=network.status(root/'four-role-network-v9')
        if net['status']=='IN_PROGRESS':
            print('=== ADAPTIVE V3 STAGE 2/2: FOUR-ROLE NETWORK V9 ===',flush=True)
            network.run(root/'four-role-network-v9',client)

    final=result(root)
    out=root/'adaptive-result.json'
    if out.exists():
        if agent.read(out)!=final:
            raise ValueError('adaptive-result.json v3 non riproducibile')
    elif final['status']!='IN_PROGRESS':
        agent.write(out,final)
    print(json.dumps(final,ensure_ascii=False,indent=2))
    return final


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
                parser.error('--case richiesto con init')
            init(root,args.case)
        elif args.command=='status':
            print(json.dumps(result(root),ensure_ascii=False,indent=2))
        else:
            final=run(root)
            raise SystemExit(0 if final['status']=='PROPOSED_FOR_HUMAN_REVIEW' else 1)
    except (ValueError,OSError,KeyError) as exc:
        parser.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__':
    main()
