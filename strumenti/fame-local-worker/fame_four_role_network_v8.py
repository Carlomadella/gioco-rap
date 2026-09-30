"""FAME Neural four-role local network v8.

V8 preserves V7 omission recovery and adds an explicit selected-option support
audit inside the existing Verifier call. No extra model role/call is added.

The Verifier must decompose the selected public answer option into material
components and bind each component to original evidence. If selected-option
support needs evidence omitted by the Extractor, that evidence must be recovered
through V7 recoveredClaims before integration.
"""
import argparse
import copy
import hashlib
import json
import time
from pathlib import Path

import agent
import fame_four_role_network_v4 as v4
import fame_four_role_network_v5 as v5
import fame_four_role_network_v6 as v6
import fame_four_role_network_v7 as v7

BASE=Path(__file__).resolve().parent
VERSION='fame-four-role-network-v8'
MODEL=v7.MODEL
DIGEST=v7.DIGEST
OPTIONS=dict(v7.OPTIONS)
ROLES=v7.ROLES
FINAL_ACCEPTED=v7.FINAL_ACCEPTED
SUPPORT_IDS=tuple(f'S{i}' for i in range(1,9))

VERIFIER_SYSTEM=v7.VERIFIER_SYSTEM+"""

V8 SELECTED-OPTION SUPPORT AUDIT:
Dopo aver scelto answerOptionId, verifica esplicitamente il SIGNIFICATO TESTUALE
dell'opzione scelta. Scomponilo in tutte le proposizioni materiali e
indipendentemente falsificabili necessarie a sostenere proprio quell'opzione.
Per ogni componente crea selectedOptionAudit.components con evidenceIds diretti.

Non limitarti ai claim gia prodotti dall'Extractor: confronta l'intera opzione
scelta con tutte le unita originali. Status formali, qualificazioni, limiti,
condizioni temporali, divieti di rerun/promozione e altre distinzioni espresse
nell'opzione sono componenti materiali quando cambiano il significato della
risposta.

Se una componente dell'opzione scelta richiede una unita presente in
hostDerivedUncoveredEvidenceIds, quell'unita deve essere recuperata tramite
recoveredClaims e omissionResolution=RECOVERED. Non dichiararla NOT_REQUIRED
solo perche l'Extractor l'aveva omessa o l'Anti-Bias l'aveva giudicata
NOT_MATERIAL: verifica tu l'opzione scelta contro l'evidenza originale.

selectedOptionAudit.fullySupported puo essere true solo se tutte le componenti
materiali dell'opzione scelta sono coperte. Se non riesci a sostenerla
interamente, scegli un'altra opzione oppure imposta fullySupported=false.
"""


def code_hashes():
    names=(
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
    return v7.package(case_id)


def public_case(p):
    return v7.public_case(p)


def host_rubric(p):
    return v7.host_rubric(p)


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
    print('Rete FAME v8 creata; nessuna chiamata al modello: '+str(root))


def verify(root):
    config=agent.read(agent.safe_path(root,'network.json'))
    p=package(config.get('caseId'))
    if config!=metadata(p):
        raise ValueError('Protocollo o codice rete V8 cambiato dopo init')
    if agent.read(agent.safe_path(root,'case-public.json'))!=public_case(p):
        raise ValueError('Case pubblico V8 modificato')
    if agent.read(agent.safe_path(root,'host-rubric.json'))!=host_rubric(p):
        raise ValueError('Rubrica host V8 modificata')
    return p


def verifier_schema(p,extractor,challenge):
    base=copy.deepcopy(v7.verifier_schema(p,extractor,challenge))
    evidence=[u['unitId'] for u in p['units']]
    base['required'].append('selectedOptionAudit')
    base['properties']['selectedOptionAudit']={
        'type':'object','additionalProperties':False,
        'required':['optionId','fullySupported','components'],
        'properties':{
            'optionId':{'type':'string','enum':[row['optionId'] for row in p['answerOptions']]},
            'fullySupported':{'type':'boolean'},
            'components':{
                'type':'array','minItems':2,'maxItems':8,
                'items':{
                    'type':'object','additionalProperties':False,
                    'required':['supportId','statement','evidenceIds'],
                    'properties':{
                        'supportId':{'type':'string','enum':list(SUPPORT_IDS)},
                        'statement':{'type':'string','minLength':1},
                        'evidenceIds':{
                            'type':'array','minItems':1,'maxItems':4,'uniqueItems':True,
                            'items':{'type':'string','enum':evidence},
                        },
                    },
                },
            },
        },
    }
    return base


def _base_verifier(answer):
    return {k:v for k,v in answer.items() if k!='selectedOptionAudit'} if type(answer) is dict else answer


def validate_selected_option_audit(answer,p,extractor):
    errors=[]
    audit=answer.get('selectedOptionAudit') if type(answer) is dict else None
    if type(audit) is not dict or set(audit)!={'optionId','fullySupported','components'}:
        return ['VERIFIER_SELECTED_OPTION_AUDIT_CONTRACT']

    if audit.get('optionId')!=answer.get('answerOptionId'):
        errors.append('VERIFIER_SELECTED_OPTION_AUDIT_MISMATCH')
    if audit.get('fullySupported') is not True:
        errors.append('VERIFIER_SELECTED_OPTION_NOT_FULLY_SUPPORTED')

    evidence={u['unitId'] for u in p['units']}
    components=audit.get('components')
    seen=[]
    audit_evidence=set()
    if type(components) is not list or not 2<=len(components)<=8:
        errors.append('VERIFIER_SELECTED_OPTION_COMPONENT_COUNT')
        components=[]
    for row in components:
        if type(row) is not dict or set(row)!={'supportId','statement','evidenceIds'}:
            errors.append('VERIFIER_SELECTED_OPTION_COMPONENT_CONTRACT')
            continue
        sid=row.get('supportId')
        seen.append(sid)
        if sid not in SUPPORT_IDS:
            errors.append('VERIFIER_SELECTED_OPTION_COMPONENT_ID')
        if not isinstance(row.get('statement'),str) or not row['statement'].strip():
            errors.append('VERIFIER_SELECTED_OPTION_COMPONENT_TEXT')
        eids=row.get('evidenceIds')
        if (type(eids) is not list or not eids or len(eids)>4 or
                len(eids)!=len(set(eids)) or any(x not in evidence for x in eids)):
            errors.append('VERIFIER_SELECTED_OPTION_COMPONENT_EVIDENCE')
        else:
            audit_evidence.update(eids)
    if len(seen)!=len(set(seen)):
        errors.append('VERIFIER_SELECTED_OPTION_DUPLICATE_COMPONENT')

    uncovered=set(v7.uncovered_evidence_ids(p,extractor))
    needed_omitted=audit_evidence & uncovered
    recovered=set()
    for row in answer.get('recoveredClaims',[]):
        if type(row) is dict:
            recovered.update(row.get('evidenceIds',[]))
    resolution={
        row.get('evidenceId'):row.get('status')
        for row in answer.get('omissionResolution',[])
        if type(row) is dict
    }
    for eid in needed_omitted:
        if eid not in recovered or resolution.get(eid)!='RECOVERED':
            errors.append('VERIFIER_SELECTED_OPTION_OMISSION_NOT_RECOVERED')
            break

    return sorted(set(errors))


def validate_verifier(answer,p,extractor,challenge):
    if type(answer) is not dict:
        return ['VERIFIER_OUTPUT_CONTRACT']
    if 'selectedOptionAudit' not in answer:
        return ['VERIFIER_SELECTED_OPTION_AUDIT_CONTRACT']

    base=_base_verifier(answer)
    errors=list(v7.validate_verifier(base,p,extractor,challenge))
    errors.extend(validate_selected_option_audit(answer,p,extractor))
    return sorted(set(errors))


def verifier_request(p,extractor,challenge):
    payload={
        'question':p['question'],
        'answerOptions':p['answerOptions'],
        'units':p['units'],
        'frozenExtractorOutput':extractor,
        'frozenAntiBiasChallenge':challenge,
        'hostDerivedUncoveredEvidenceIds':v7.uncovered_evidence_ids(p,extractor),
    }
    return {
        'model':MODEL,'stream':False,'options':dict(OPTIONS),
        'format':verifier_schema(p,extractor,challenge),
        'messages':[
            {'role':'system','content':VERIFIER_SYSTEM},
            {'role':'user','content':json.dumps(payload,ensure_ascii=False)},
        ],
    }


def usable_claim_map(verifier):
    return v7.usable_claim_map(_base_verifier(verifier))


def integrator_schema(p,verifier):
    return v7.integrator_schema(p,_base_verifier(verifier))


def validate_integrator(answer,p,extractor,challenge,verifier):
    return v7.validate_integrator(answer,p,extractor,challenge,_base_verifier(verifier))


def integrator_request(p,extractor,challenge,verifier):
    base=_base_verifier(verifier)
    payload={
        'question':p['question'],
        'answerOptions':p['answerOptions'],
        'units':p['units'],
        'frozenExtractorOutput':extractor,
        'frozenAntiBiasChallenge':challenge,
        'frozenVerifierOutput':verifier,
        'usableClaims':usable_claim_map(verifier),
    }
    return {
        'model':MODEL,'stream':False,'options':dict(OPTIONS),
        'format':integrator_schema(p,verifier),
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
    verifier=ver['output']

    int_req=integrator_request(p,extractor,challenge,verifier)
    rows['integrator']=v4.read_role(
        root,'integrator',int_req,
        lambda a:validate_integrator(a,p,extractor,challenge,verifier)
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
    calls=sum(1 for role in ROLES if (root/'roles'/role/'attempt-1'/'response.json').exists())
    return {
        'schema':VERSION,'caseId':p['caseId'],'status':overall,'roles':rows,'modelCalls':calls,
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
        f.write('FAME four-role network v8 attiva\n')
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
            print('[1/4] Extractor V8: attesa Ollama...',flush=True)
            ext=v4.execute_role(root,'extractor',v4.extractor_request(p),
                                lambda a:v4.validate_extractor(a,p),client)
        if ext['status']!='ACCEPTED':
            return emit_status(root)
        extractor=ext['output']

        ab=status(root)['roles']['anti-bias']
        if ab['status']=='PENDING':
            print('[2/4] Anti-Bias V8 + omission review: attesa Ollama...',flush=True)
            req=v7.antibias_request(p,extractor)
            ab=v4.execute_role(root,'anti-bias',req,
                               lambda a:v7.validate_antibias(a,p,extractor),client)
        if ab['status']!='ACCEPTED':
            return emit_status(root)
        challenge=ab['output']

        ver=status(root)['roles']['verifier']
        if ver['status']=='PENDING':
            print('[3/4] Verifier V8 + selected-option audit: attesa Ollama...',flush=True)
            req=verifier_request(p,extractor,challenge)
            ver=v4.execute_role(root,'verifier',req,
                                lambda a:validate_verifier(a,p,extractor,challenge),client)
        if ver['status']!='ACCEPTED':
            return emit_status(root)
        verifier=ver['output']

        integ=status(root)['roles']['integrator']
        if integ['status']=='PENDING':
            print('[4/4] Integrator V8: attesa Ollama...',flush=True)
            req=integrator_request(p,extractor,challenge,verifier)
            v4.execute_role(root,'integrator',req,
                lambda a:validate_integrator(a,p,extractor,challenge,verifier),client)

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
