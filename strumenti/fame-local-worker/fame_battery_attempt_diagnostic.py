"""Read-only diagnostic for a historical single-agent battery attempt."""
import argparse
import json
from pathlib import Path

import agent
import fame_four_role_network_v3 as network

VERSION='fame-battery-attempt-diagnostic-v1'


def classify(result,response):
    if response is None:
        return 'NO_RESPONSE_TRANSPORT_OR_PRE_RESPONSE_ERROR'
    if response.get('done_reason')=='length':
        return 'OUTPUT_TRUNCATED'
    if response.get('done') is not True:
        return 'INCOMPLETE_RESPONSE'
    message=response.get('message')
    if type(message) is not dict:
        return 'INVALID_MESSAGE'
    if message.get('tool_calls'):
        return 'UNEXPECTED_TOOL_CALL'
    content=message.get('content')
    if not isinstance(content,str) or not content.strip():
        return 'EMPTY_FINAL_CONTENT'
    try:
        agent.parse(content)
        parseable=True
    except Exception:
        parseable=False
    if not parseable:
        return 'INVALID_JSON_CONTENT'
    status=result.get('status')
    if status=='REJECTED':
        return 'HOST_VALIDATION_REJECTED'
    if status=='ERROR':
        return 'POST_RESPONSE_ERROR_WITH_PARSEABLE_JSON'
    if status=='ACCEPTED':
        return 'ACCEPTED'
    return 'UNKNOWN'


def diagnostic(root,case_id):
    root=root.resolve()
    case_root=agent.safe_path(root,'cases',case_id)
    baseline_root=agent.safe_path(case_root,'single-agent')
    attempt=agent.safe_path(baseline_root,'attempt-1')
    network.verify_receipt(attempt)

    result=agent.read(agent.safe_path(attempt,'result.json'))
    response_path=attempt/'response.json'
    response=agent.read(response_path) if response_path.exists() else None
    message=response.get('message') if isinstance(response,dict) else None
    content=message.get('content') if isinstance(message,dict) else None
    thinking=message.get('thinking') if isinstance(message,dict) else None

    parseable=None
    if isinstance(content,str) and content.strip():
        try:
            agent.parse(content)
            parseable=True
        except Exception:
            parseable=False

    output={
        'schema':VERSION,
        'caseId':case_id,
        'arm':'single-agent',
        'receiptVerified':True,
        'resultStatus':result.get('status'),
        'resultErrors':result.get('errors',[]),
        'elapsedSeconds':result.get('elapsedSeconds'),
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
        'classification':classify(result,response),
        'modelCallPerformed':response is not None,
        'historicalAttemptModified':False,
        'modelCalledByDiagnostic':False,
    }
    return output


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',required=True,type=Path)
    parser.add_argument('--case',default='battery-anti-bias-v1')
    args=parser.parse_args()
    try:
        print(json.dumps(diagnostic(args.root,args.case),ensure_ascii=False,indent=2))
    except (ValueError,OSError,KeyError) as exc:
        parser.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__':
    main()
