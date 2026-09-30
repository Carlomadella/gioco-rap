"""FAME Neural four-role local network v9.

V9 preserves V8 and reconciles one narrow internal inconsistency
deterministically on the host:

If the Verifier's own selectedOptionAudit says that a material component of the
selected public answer option is fully supported exclusively by evidence units
that were omitted by the Extractor, the host derives the corresponding
recoveredClaim and marks those omission resolutions RECOVERED.

No new model call is added. Raw Verifier output is preserved in the role
artifacts; the derived effective verifier is used only for host validation and
the Integrator request.
"""
import argparse
import copy
import hashlib
import json
import time
from pathlib import Path

import agent
import fame_four_role_network_v4 as v4
import fame_four_role_network_v7 as v7
import fame_four_role_network_v8 as v8

BASE=Path(__file__).resolve().parent
VERSION='fame-four-role-network-v9'
MODEL=v8.MODEL
DIGEST=v8.DIGEST
OPTIONS=dict(v8.OPTIONS)
ROLES=v8.ROLES
FINAL_ACCEPTED=v8.FINAL_ACCEPTED


def code_hashes():
    names=(
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


def package(case_id):
    return v8.package(case_id)


def public_case(p):
    return v8.public_case(p)


def host_rubric(p):
    return v8.host_rubric(p)


def metadata(p):
    return {
        'schema':VERSION,
        'caseId':p['caseId'],
        'packageSha256':v4.digest(p),
        'codeHashes':code_hashes(),
        'model':MODEL,
        'modelDigest':DIGEST,
        'options':OPTIONS,
        'roles':list(ROLES),
        'maximumModelCalls':4,
        'retries':0,
        'semanticRepair':'verifier-bounded-v2-evidence-preserving',
        'omissionRecovery':'public-uncovered-evidence-v1',
        'selectedOptionAudit':'verifier-public-option-entailment-v1',
        'hostAuditReconciliation':'exclusive-omitted-evidence-v1',
        'antiBias':v7.anti_bias.snapshot(),
        'humanReviewRequired':True,
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }


def init(root,case_id):
    p=package(case_id)
    root.mkdir(parents=True,exist_ok=False)
    (root/'roles').mkdir()
    (root/'sessions').mkdir()
    for role in ROLES:
        (root/'roles'/role).mkdir()
    agent.write(root/'network.json',metadata(p))
    agent.write(root/'case-public.json',public_case(p))
    agent.write(root/'host-rubric.json',host_rubric(p))
    print('Rete FAME v9 creata; nessuna chiamata al modello: '+str(root))


def verify(root):
    config=agent.read(agent.safe_path(root,'network.json'))
    p=package(config.get('caseId'))
    if config!=metadata(p):
        raise ValueError('Protocollo o codice rete V9 cambiato dopo init')
    if agent.read(agent.safe_path(root,'case-public.json'))!=public_case(p):
        raise ValueError('Case pubblico V9 modificato')
    if agent.read(agent.safe_path(root,'host-rubric.json'))!=host_rubric(p):
        raise ValueError('Rubrica host V9 modificata')
    return p


def verifier_schema(p,extractor,challenge):
    return v8.verifier_schema(p,extractor,challenge)


def verifier_request(p,extractor,challenge):
    return v8.verifier_request(p,extractor,challenge)


def _next_recovery_id(used):
    for rid in v7.RECOVERY_IDS:
        if rid not in used:
            return rid
    return None


def effective_verifier(raw,p,extractor):
    """Return deterministic host reconciliation plus an audit summary.

    Safety boundary: synthesize only when an option-audit component:
    - belongs to the selected option;
    - is inside a fullySupported audit;
    - cites one or more evidence IDs;
    - and ALL cited evidence IDs are public units omitted by the Extractor.

    Mixed components (omitted + already-used evidence) are not rewritten,
    because the host cannot infer that the omitted subset alone entails the
    component statement.
    """
    if type(raw) is not dict:
        return raw,{'applied':False,'derivedClaims':[],'overriddenResolutions':[],
                    'skippedMixedComponents':[]}

    value=copy.deepcopy(raw)
    audit=value.get('selectedOptionAudit')
    summary={
        'applied':False,
        'derivedClaims':[],
        'overriddenResolutions':[],
        'skippedMixedComponents':[],
    }
    if (type(audit) is not dict or
            audit.get('optionId')!=value.get('answerOptionId') or
            audit.get('fullySupported') is not True):
        return value,summary

    uncovered=set(v7.uncovered_evidence_ids(p,extractor))
    recovered=value.get('recoveredClaims')
    resolutions=value.get('omissionResolution')
    components=audit.get('components')
    if type(recovered) is not list or type(resolutions) is not list or type(components) is not list:
        return value,summary

    used_ids={row.get('claimId') for row in recovered if type(row) is dict}
    already_recovered=set()
    for row in recovered:
        if type(row) is dict:
            already_recovered.update(row.get('evidenceIds',[]))

    resolution_by_eid={
        row.get('evidenceId'):row
        for row in resolutions
        if type(row) is dict and isinstance(row.get('evidenceId'),str)
    }

    for component in components:
        if type(component) is not dict:
            continue
        eids=component.get('evidenceIds')
        statement=component.get('statement')
        sid=component.get('supportId')
        if (type(eids) is not list or not eids or
                not isinstance(statement,str) or not statement.strip()):
            continue
        eid_set=set(eids)
        omitted=eid_set & uncovered
        if not omitted:
            continue
        if not eid_set.issubset(uncovered):
            summary['skippedMixedComponents'].append(sid)
            continue

        missing=sorted(omitted-already_recovered)
        if missing:
            rid=_next_recovery_id(used_ids)
            if rid is None:
                break
            claim={
                'claimId':rid,
                'statement':statement,
                'evidenceIds':missing,
                'reason':'Host-derived from fully supported selected-option audit component '+str(sid)+'.',
            }
            recovered.append(claim)
            used_ids.add(rid)
            already_recovered.update(missing)
            summary['derivedClaims'].append(claim)

        for eid in sorted(omitted):
            row=resolution_by_eid.get(eid)
            if row is not None and row.get('status')!='RECOVERED':
                row['status']='RECOVERED'
                row['reason']='Host reconciliation: selected-option audit explicitly requires '+eid+'.'
                summary['overriddenResolutions'].append(eid)

    summary['applied']=bool(summary['derivedClaims'] or summary['overriddenResolutions'])
    return value,summary


def validate_verifier(raw,p,extractor,challenge):
    effective,_=effective_verifier(raw,p,extractor)
    return v8.validate_verifier(effective,p,extractor,challenge)


def usable_claim_map(raw,p,extractor):
    effective,_=effective_verifier(raw,p,extractor)
    return v8.usable_claim_map(effective)


def integrator_schema(p,extractor,raw):
    effective,_=effective_verifier(raw,p,extractor)
    return v8.integrator_schema(p,effective)


def validate_integrator(answer,p,extractor,challenge,raw):
    effective,_=effective_verifier(raw,p,extractor)
    return v8.validate_integrator(answer,p,extractor,challenge,effective)


def integrator_request(p,extractor,challenge,raw):
    effective,summary=effective_verifier(raw,p,extractor)
    payload={
        'question':p['question'],
        'answerOptions':p['answerOptions'],
        'units':p['units'],
        'frozenExtractorOutput':extractor,
        'frozenAntiBiasChallenge':challenge,
        'rawVerifierOutput':raw,
        'effectiveVerifierOutput':effective,
        'hostDerivedRecovery':summary,
        'usableClaims':v8.usable_claim_map(effective),
    }
    return {
        'model':MODEL,'stream':False,'options':dict(OPTIONS),
        'format':v8.integrator_schema(p,effective),
        'messages':[
            {'role':'system','content':v7.INTEGRATOR_SYSTEM},
            {'role':'user','content':json.dumps(payload,ensure_ascii=False)},
        ],
    }


def replay_roles(root,p):
    rows={}
    ext=v4.read_role(root,'extractor',v4.extractor_request(p),lambda a:v4.validate_extractor(a,p))
    rows['extractor']=ext
    if ext['status']!='ACCEPTED':
        for role in ROLES[1:]:
            rows[role]=v4.read_role(root,role) if (root/'roles'/role/'attempt-1').exists() else {'status':'PENDING'}
        return rows
    extractor=ext['output']

    ab_req=v7.antibias_request(p,extractor)
    ab=v4.read_role(root,'anti-bias',ab_req,lambda a:v7.validate_antibias(a,p,extractor))
    rows['anti-bias']=ab
    if ab['status']!='ACCEPTED':
        for role in ROLES[2:]:
            rows[role]=v4.read_role(root,role) if (root/'roles'/role/'attempt-1').exists() else {'status':'PENDING'}
        return rows
    challenge=ab['output']

    ver_req=verifier_request(p,extractor,challenge)
    ver=v4.read_role(root,'verifier',ver_req,lambda a:validate_verifier(a,p,extractor,challenge))
    rows['verifier']=ver
    if ver['status']!='ACCEPTED':
        rows['integrator']=v4.read_role(root,'integrator') if (root/'roles'/'integrator'/'attempt-1').exists() else {'status':'PENDING'}
        return rows
    raw_verifier=ver['output']

    int_req=integrator_request(p,extractor,challenge,raw_verifier)
    rows['integrator']=v4.read_role(
        root,'integrator',int_req,
        lambda a:validate_integrator(a,p,extractor,challenge,raw_verifier)
    )
    return rows


def status(root):
    p=verify(root)
    rows=replay_roles(root,p)
    for role in ROLES:
        state=rows[role]['status']
        if state in ('REJECTED','ERROR','INTERRUPTED'):
            overall='NEEDS_REVIEW';break
        if state=='PENDING':
            overall='IN_PROGRESS';break
    else:
        overall=FINAL_ACCEPTED if rows['integrator']['status']=='ACCEPTED' else 'NEEDS_REVIEW'

    host_recovery={'applied':False,'derivedClaims':[],'overriddenResolutions':[],
                   'skippedMixedComponents':[]}
    ext=rows.get('extractor',{})
    ver=rows.get('verifier',{})
    if ext.get('status')=='ACCEPTED' and isinstance(ver.get('output'),dict):
        _,host_recovery=effective_verifier(ver['output'],p,ext['output'])

    calls=sum(1 for role in ROLES if (root/'roles'/role/'attempt-1'/'response.json').exists())
    return {
        'schema':VERSION,'caseId':p['caseId'],'status':overall,'roles':rows,
        'hostDerivedRecovery':host_recovery,
        'modelCalls':calls,
        'humanReviewRequired':True,'executionAuthorized':False,'trainingAuthorized':False,
        'networkProductionReady':False,'independentEvaluation':False,
    }


def emit_status(root):
    final=status(root)
    print(json.dumps(final,ensure_ascii=False,indent=2))
    return final


def run(root,client=None):
    root=root.resolve()
    lock=agent.safe_path(root,'network.lock')
    with lock.open('x') as f:
        f.write('FAME four-role network v9 attiva\n')
    try:
        p=verify(root)
        current=status(root)
        if current['status']!='IN_PROGRESS':
            print(json.dumps(current,ensure_ascii=False,indent=2))
            return current

        client=client or agent.Ollama()
        session=root/'sessions'/str(int(time.time()*1000))
        session.mkdir()
        preflight=agent.preflight(client,MODEL)
        agent.write(session/'preflight.json',preflight)
        if preflight['model']['digest']!=DIGEST:
            raise ValueError('Digest modello diverso dal protocollo')

        ext=status(root)['roles']['extractor']
        if ext['status']=='PENDING':
            print('[1/4] Extractor V9: attesa Ollama...',flush=True)
            ext=v4.execute_role(root,'extractor',v4.extractor_request(p),
                                lambda a:v4.validate_extractor(a,p),client)
        if ext['status']!='ACCEPTED':
            return emit_status(root)
        extractor=ext['output']

        ab=status(root)['roles']['anti-bias']
        if ab['status']=='PENDING':
            print('[2/4] Anti-Bias V9 + omission review: attesa Ollama...',flush=True)
            req=v7.antibias_request(p,extractor)
            ab=v4.execute_role(root,'anti-bias',req,
                               lambda a:v7.validate_antibias(a,p,extractor),client)
        if ab['status']!='ACCEPTED':
            return emit_status(root)
        challenge=ab['output']

        ver=status(root)['roles']['verifier']
        if ver['status']=='PENDING':
            print('[3/4] Verifier V9 + option audit/reconciliation: attesa Ollama...',flush=True)
            req=verifier_request(p,extractor,challenge)
            ver=v4.execute_role(root,'verifier',req,
                                lambda a:validate_verifier(a,p,extractor,challenge),client)
        if ver['status']!='ACCEPTED':
            return emit_status(root)
        raw_verifier=ver['output']

        integ=status(root)['roles']['integrator']
        if integ['status']=='PENDING':
            print('[4/4] Integrator V9: attesa Ollama...',flush=True)
            req=integrator_request(p,extractor,challenge,raw_verifier)
            v4.execute_role(root,'integrator',req,
                lambda a:validate_integrator(a,p,extractor,challenge,raw_verifier),client)

        final=status(root)
        agent.write(session/'summary.json',final)
        print(json.dumps(final,ensure_ascii=False,indent=2))
        return final
    finally:
        lock.unlink()


def build_parser():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('command',choices=('init','run','status'))
    p.add_argument('--root',required=True,type=Path)
    p.add_argument('--case')
    return p


def main():
    parser=build_parser()
    args=parser.parse_args()
    try:
        root=args.root.resolve()
        if args.command=='init':
            if not args.case:
                raise ValueError('--case richiesto per init')
            init(root,args.case)
        elif args.command=='status':
            print(json.dumps(status(root),ensure_ascii=False,indent=2))
        else:
            result=run(root)
            raise SystemExit(0 if result['status']==FINAL_ACCEPTED else 1)
    except (ValueError,OSError,KeyError) as exc:
        parser.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__':
    main()
