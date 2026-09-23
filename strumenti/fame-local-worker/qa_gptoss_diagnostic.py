"""GPT-OSS diagnostic: explicit low thinking, unchanged 4096-token budget."""
import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path
import agent
import qa_transfer

VERSION = 'fame-gptoss-low-4096-diagnostic-v1'
MODEL = 'gpt-oss:20b'
EXPECTED_DIGEST = '17052f91a42e97930aa6e28a6c6c06a983e6a58dbb00434885a0cf5313e376f7'


def engine():
    result = qa_transfer.build_engine()
    result.VERSION = VERSION
    return result


def run(root, client=None):
    qa = engine()
    runs = agent.safe_path(root, 'runs')
    lock = agent.safe_path(root, 'worker.lock')
    with lock.open('x') as f:
        f.write(VERSION)
    try:
        if any(runs.iterdir()):
            raise ValueError('Scrivania gia eseguita: conservare il primo risultato')
        out = runs / datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        out.mkdir()
        report = dict(schema=VERSION, status='ERROR', model=MODEL, modelCalls=0,
                      firstAttemptPass=False, humanReviewRequired=True,
                      executionAuthorized=False, historicalFailurePreserved=True)
        try:
            meta = agent.read(agent.safe_path(root, 'desk.json'))
            expected = dict(schema=VERSION, sourceCommit=qa.SOURCE_COMMIT,
                            sourcePath=qa.SOURCE_PATH, canonicalSha256=qa.CASE_SHA)
            text = qa.canonical(qa.text_file(root, 'report.md'))
            if meta != expected or qa.digest(text) != qa.CASE_SHA or qa.text_file(root, 'memory/procedure.md') != qa.PROCEDURE:
                raise ValueError('Input/versione/procedura alterati')
            config = agent.read(qa_transfer.BASE/'cases/independent-evaluation-rubric.json')
            agent.write(out/'frozen-case-config.json', config)
            records = qa.evidence_records(text)
            request = dict(model=MODEL, stream=False, think='low', format=qa.schema_for(records),
                           options=dict(num_ctx=16384, num_predict=4096, temperature=0, seed=42),
                           messages=[dict(role='system', content=qa.PROCEDURE),
                                     dict(role='user', content=json.dumps(dict(report=records, categories=qa.CATALOG, nextChecks=qa.CHECKS), ensure_ascii=False))])
            agent.write(out/'request.json', request)
            client = client or agent.Ollama()
            preflight = agent.preflight(client, MODEL)
            agent.write(out/'preflight.json', preflight)
            if preflight['model']['digest'] != EXPECTED_DIGEST:
                raise ValueError('Digest modello diverso dal run storico: confronto da ripianificare')
            thinking = preflight['show'].get('thinking')
            if isinstance(thinking, dict) and 'values' in thinking:
                if 'low' not in thinking['values']:
                    raise ValueError('Il server non dichiara supporto per think=low')
                report['thinkingControlEvidence'] = 'low advertised in api/show'
            else:
                report['thinkingControlEvidence'] = 'metadata absent; low requested per official docs, effective level not independently verified'
            print('Diagnostica GPT-OSS: think=low, 4096 token, una chiamata...', flush=True)
            started = time.monotonic()
            report['modelCalls'] = 1
            response = client.request('/api/chat', request)
            report['elapsedSeconds'] = time.monotonic()-started
            agent.write(out/'response.json', response)
            if (qa.canonical(qa.text_file(root,'report.md')) != text or
                qa.text_file(root,'memory/procedure.md') != qa.PROCEDURE or
                agent.read(agent.safe_path(root,'desk.json')) != meta or
                agent.read(qa_transfer.BASE/'cases/independent-evaluation-rubric.json') != config):
                raise ValueError('Materiali modificati durante la chiamata')
            msg = response.get('message', {})
            if not isinstance(msg, dict):
                raise ValueError('message non valido')
            report.update(doneReason=response.get('done_reason'),
                          contentPresent=bool(msg.get('content')),
                          thinkingPresent=bool(msg.get('thinking')),
                          metrics={k:response.get(k) for k in ('total_duration','load_duration','prompt_eval_count','prompt_eval_duration','eval_count','eval_duration')})
            errors = []
            if response.get('done_reason') == 'length':
                report['status'] = 'OUTPUT_TRUNCATED'
                errors = ['GENERATION_LIMIT_REACHED']
            elif response.get('done') is not True or msg.get('tool_calls') or not msg.get('content'):
                report['status'] = 'INVALID_RESPONSE'
                errors = ['NO_COMPLETE_FINAL_RESPONSE']
            else:
                try:
                    answer = agent.parse(msg['content'])
                    errors = qa.validate(answer, text)
                    drops = qa.evidence_drops(answer, text)
                    report['droppedEvidence'] = drops
                    report['status'] = 'SEMANTIC_FAIL' if errors else 'VALIDATED_FOR_REVIEW'
                    if not errors:
                        cleaned = {'findings':[qa.sanitize_finding(row,text) for row in answer['findings']]}
                        agent.write(out/'answer.json', qa.materialize(cleaned,text))
                        report['firstAttemptPass'] = True
                except (ValueError,TypeError,KeyError) as exc:
                    report['status'] = 'INVALID_RESPONSE'
                    errors = [str(exc)]
            agent.write(out/'validation.json', dict(errors=errors, droppedEvidence=report.get('droppedEvidence',[])))
        except Exception as exc:
            report.update(status='ERROR', error=f'{type(exc).__name__}: {exc}')
        return agent.finish(out, report)
    finally:
        lock.unlink()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('init','run'))
    parser.add_argument('--root', type=Path, required=True)
    args = parser.parse_args()
    try:
        if args.command == 'init':
            engine().init(args.root.resolve())
            print('Scrivania diagnostica creata; nessun modello eseguito.')
        else:
            result = run(args.root.resolve())
            raise SystemExit(0 if result['status']=='VALIDATED_FOR_REVIEW' else 1)
    except (ValueError,OSError) as exc:
        parser.exit(2,f'ERRORE: {exc}\n')


if __name__ == '__main__':
    main()
