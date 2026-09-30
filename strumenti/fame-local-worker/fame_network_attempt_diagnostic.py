"""Read-only diagnostic for a historical Four-Role Network role attempt."""
import argparse
import json
from pathlib import Path

import agent
import fame_four_role_network_v3 as network

VERSION='fame-network-attempt-diagnostic-v1'
ALLOWED_ROLES=('extractor','anti-bias','verifier','integrator')


def classify(role,result,response):
    if response is None:
        return 'NO_RESPONSE_TRANSPORT_OR_PRE_RESPONSE_ERROR'
    if response.get('done_reason')=='length':
        return 'OUTPUT_TRUNCATED'
    if response.get('done') is not True:
        return 'INCOMPLETE_RESPONSE'
    message=response.get('message')
    if type(message) is not dict:
        return 'INVALID_MESSAGE'
    content=message.get('content')
    if not isinstance(content,str) or not content.strip():
        return 'EMPTY_FINAL_CONTENT'
    try:
        parsed=agent.parse(content)
    except Exception:
        return 'INVALID_JSON_CONTENT'

    if role=='verifier':
        errors=result.get('errors',[])
        if 'VERIFIER_NONSUPPORTED_WITH_EVIDENCE' in errors and type(parsed) is dict:
            contradictions=[]
            for row in parsed.get('decisions',[]):
                if type(row) is not dict:
                    continue
                status=row.get('status')
                evidence=row.get('evidenceIds')
                if status!='EVIDENCE_SUPPORTS_CLAIM' and isinstance(evidence,list) and evidence:
                    contradictions.append({
                        'claimId':row.get('claimId'),
                        'status':status,
                        'evidenceIds':evidence,
                        'reason':row.get('reason'),
                    })
            if contradictions:
                return 'VERIFIER_STATUS_EVIDENCE_CONTRACT_CONTRADICTION'

    status=result.get('status')
    if status=='REJECTED':
        return 'HOST_VALIDATION_REJECTED'
    if status=='ERROR':
        return 'POST_RESPONSE_ERROR_WITH_PARSEABLE_JSON'
    if status=='ACCEPTED':
        return 'ACCEPTED'
    return 'UNKNOWN'


def diagnostic(root,case_id,role):
    if role not in ALLOWED_ROLES:
        raise ValueError('Ruolo non supportato: '+role)
    root=root.resolve()
    attempt=agent.safe_path(root,'cases/'+case_id+'/four-role-network/roles/'+role+'/attempt-1')
    if not network.verify_receipt(attempt):
        raise ValueError('Receipt non valida per '+role)

    result=agent.read(agent.safe_path(attempt,'result.json'))
    response_path=attempt/'response.json'
    response=agent.read(response_path) if response_path.exists() else None
    message=response.get('message') if isinstance(response,dict) else None
    content=message.get('content') if isinstance(message,dict) else None
    thinking=message.get('thinking') if isinstance(message,dict) else None

    parsed=None
    parseable=None
    if isinstance(content,str) and content.strip():
        try:
            parsed=agent.parse(content)
            parseable=True
        except Exception:
            parseable=False

    contract_contradictions=[]
    if role=='verifier' and isinstance(parsed,dict):
        for row in parsed.get('decisions',[]):
            if type(row) is not dict:
                continue
            evidence=row.get('evidenceIds')
            status=row.get('status')
            if status!='EVIDENCE_SUPPORTS_CLAIM' and isinstance(evidence,list) and evidence:
                contract_contradictions.append({
                    'claimId':row.get('claimId'),
                    'status':status,
                    'evidenceIds':evidence,
                    'reason':row.get('reason'),
                })

    return {
        'schema':VERSION,
        'caseId':case_id,
        'arm':'four-role-network',
        'role':role,
        'receiptVerified':True,
        'resultStatus':result.get('status'),
        'resultErrors':result.get('errors',[]),
        'elapsedSeconds':result.get('elapsedSeconds'),
        'output':result.get('output'),
        'hasResponse':response is not None,
        'responseDone':response.get('done') if isinstance(response,dict) else None,
        'responseDoneReason':response.get('done_reason') if isinstance(response,dict) else None,
        'contentPresent':isinstance(content,str) and bool(content.strip()),
        'contentChars':len(content) if isinstance(content,str) else 0,
        'thinkingChars':len(thinking) if isinstance(thinking,str) else 0,
        'contentParseableJson':parseable,
        'responseMetrics':{
            key:response.get(key) if isinstance(response,dict) else None
            for key in ('total_duration','load_duration','prompt_eval_count','eval_count','done_reason')
        },
        'contractContradictions':contract_contradictions,
        'classification':classify(role,result,response),
        'historicalAttemptModified':False,
        'modelCalledByDiagnostic':False,
    }


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',required=True,type=Path)
    parser.add_argument('--case',required=True)
    parser.add_argument('--role',required=True,choices=ALLOWED_ROLES)
    args=parser.parse_args()
    try:
        print(json.dumps(diagnostic(args.root,args.case,args.role),ensure_ascii=False,indent=2))
    except (ValueError,OSError,KeyError) as exc:
        parser.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__':
    main()
