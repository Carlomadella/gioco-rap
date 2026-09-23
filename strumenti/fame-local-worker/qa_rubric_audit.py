"""Offline sidecar reassessment; no Ollama calls and no historical result changes."""
import argparse
import json
from pathlib import Path
import agent
import qa_coordinator as coord
import qa_recovery as recovery
import qa_transfer

VERSION='fame-qa-rubric-audit-v1'


def grade(qa,text,code,response):
    legacy=coord.grade(qa,text,code,response)
    result=dict(code=code,originalStatus=legacy['status'],originalErrors=legacy['errors'],
                conclusion='UNKNOWN',evidence='NOT_ASSESSED',surplusEvidenceIds=[],
                status='INVALID_OUTPUT')
    if legacy['status'] in ('INVALID_RESPONSE','OUTPUT_TRUNCATED'):
        return result
    answer=agent.parse(response['message']['content'])
    expected=code in qa.RUBRIC
    if answer['supported'] != expected:
        return dict(result,conclusion='INCORRECT',status='INCORRECT_CONCLUSION')
    result['conclusion']='CORRECT'
    if not expected:
        return dict(result,evidence='NOT_REQUIRED',status='CORRECT_UNSUPPORTED')
    ids=answer['evidenceIds']
    records={r['evidenceId']:r for r in qa.evidence_records(text)}
    if (not 1<=len(ids)<=8 or any(type(e) is not str or e not in records for e in ids)
            or len(set(ids))!=len(ids)):
        return result
    lines={records[e]['line'] for e in ids}
    rule=qa.RUBRIC[code]
    direct=all(lines.intersection(group) for group in rule['required'])
    contextual=False
    allowed=set(rule['allowed'])
    # All three lines are required as a contextual bundle. Numeric settings alone
    # and bare hypotheses without their qualification do not establish uncertainty.
    if code in (recovery.PARENT,'HIGH_NOTE_CAUSE_UNPROVEN'):
        contextual={230,232,233}<=lines and (code!='LOWEND_CAUSES_UNPROVEN' or 217 in lines)
        allowed.add(230)
    result['surplusEvidenceIds']=[e for e in ids if records[e]['line'] not in allowed]
    if direct:
        return dict(result,evidence='DIRECT',status='SUPPORTED_DIRECT')
    if contextual:
        return dict(result,evidence='CONTEXTUAL',status='SUPPORTED_CONTEXTUAL')
    return dict(result,evidence='INSUFFICIENT',status='INSUFFICIENT_EVIDENCE')


def audit(source,out):
    source,out=source.resolve(),out.resolve()
    if source==out or source in out.parents or out in source.parents:
        raise ValueError('Output e fonte devono essere cartelle separate')
    network=agent.read(agent.safe_path(source,'network.json'))
    if network['schema']==coord.VERSION:
        qa=qa_transfer.build_engine()
        text=coord.verify(source,qa)
        historical=coord.collect(source,qa,text)
    elif network['schema']==recovery.VERSION:
        recovery.verify_origin(source)
        qa=recovery.build_engine()
        worker=recovery.coordinator()
        text=worker.verify(source,qa)
        historical=worker.collect(source,qa,text)
    else:
        raise ValueError('Protocollo sorgente non supportato')
    if historical['pending']:
        raise ValueError('Completare la registrazione originale prima della rivalutazione')
    rows=[]
    hashes={}
    for row in historical['results']:
        code=row['code']
        rel='desks/'+code+'/attempt-1/response.json'
        path=agent.safe_path(source,rel)
        if not path.exists() or row['status'] in ('ERROR','INTERRUPTED'):
            rows.append(dict(code=code,status='NOT_ASSESSED',originalStatus=row['status']))
            continue
        hashes[rel]=agent.sha(path)
        rows.append(grade(qa,text,code,agent.read(path)))
    accepted={'SUPPORTED_DIRECT','SUPPORTED_CONTEXTUAL','CORRECT_UNSUPPORTED'}
    report=dict(schema=VERSION,source=str(source),caseSha256=qa.CASE_SHA,
                originalAccepted=historical['acceptedDecisions'],originalTotal=historical['totalDecisions'],
                reassessedAccepted=sum(r['status'] in accepted for r in rows),results=rows,
                sourceResponseHashes=hashes,postHoc=True,independentEvaluation=False,
                humanReviewRequired=True,executionAuthorized=False,modelCalls=0,
                historicalResultChanged=False)
    out.mkdir(parents=True,exist_ok=False)
    agent.write(out/'audit.json',report)
    print(json.dumps(report,ensure_ascii=False,indent=2))
    return report


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    a=p.parse_args()
    try: audit(a.source,a.out)
    except (ValueError,OSError,KeyError) as exc: p.exit(2,f'ERRORE: {exc}\n')

if __name__=='__main__': main()
