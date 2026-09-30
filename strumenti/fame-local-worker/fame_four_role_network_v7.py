"""FAME Neural four-role local network v7.

V7 preserves V6 and adds bounded recovery for evidence omitted entirely by
the Extractor. The host derives uncovered evidence IDs only from the public
case units and the Extractor citations; the private host rubric is never sent
to any model role.

Topology stays four calls:
Extractor -> independent Anti-Bias -> Verifier -> Integrator.
"""
import argparse
import copy
import hashlib
import json
import time
from pathlib import Path

import agent
import fame_anti_bias as anti_bias
import fame_four_role_network_v4 as v4
import fame_four_role_network_v5 as v5
import fame_four_role_network_v6 as v6

BASE=Path(__file__).resolve().parent
VERSION='fame-four-role-network-v7'
MODEL=v4.MODEL
DIGEST=v4.DIGEST
OPTIONS=dict(v4.OPTIONS)
ROLES=v4.ROLES
FINAL_ACCEPTED=v4.FINAL_ACCEPTED
RECOVERY_IDS=tuple(f'O{i}' for i in range(1,9))
OMISSION_STATUSES=('MATERIAL_FOR_ANSWER','NOT_MATERIAL','UNCERTAIN_MATERIALITY')
OMISSION_RESOLUTIONS=('RECOVERED','NOT_REQUIRED','UNRESOLVED')

ANTIBIAS_SYSTEM=anti_bias.SYSTEM+"""

V7 OMISSION REVIEW:
Il controller host calcola uncoveredEvidenceIds esclusivamente come unita pubbliche
non citate da alcun claim dell'Extractor. Non e una rubrica privata e non indica
quali unita debbano essere usate.
Per OGNI uncoveredEvidenceId produci omissionReview:
- MATERIAL_FOR_ANSWER: l'unita contiene una distinzione materiale per rispondere;
- NOT_MATERIAL: puo essere omessa senza cambiare risposta o limiti materiali;
- UNCERTAIN_MATERIALITY: non puoi stabilirlo in modo affidabile.
Valuta il testo dell'unita rispetto alla domanda, non rispetto a target nascosti.
omissionReview e separato dagli issues sui claim: non inventare un issue solo per
riempire la lista e non cambiare overall per la sola presenza di omissionReview.
"""

VERIFIER_SYSTEM="""Sei il verificatore indipendente della rete FAME Neural V7.
Ricevi domanda, opzioni, evidenze originali, claim congelati dell'Extractor,
challenge Anti-Bias e review delle unita pubbliche non citate dall'Extractor.

Mantieni le regole V6:
- ogni claim originale va in ESATTAMENTE UNO tra supportedClaims,
  unsupportedClaims e claimsNeedingRework;
- repairedClaims puo riscrivere/splittare solo claim in rework;
- RESOLVED_BY_REPAIR non significa eliminare la parte contestata;
- se una issue Anti-Bias elenca evidenceIds, il repair deve preservarne la
  copertura quando la issue e valida.

In piu, esamina indipendentemente OGNI omissionReview:
- RECOVERED: l'unita omessa e materialmente necessaria; crea uno o piu
  recoveredClaims O1..O8 che la rappresentino direttamente;
- NOT_REQUIRED: l'unita puo essere omessa senza perdere una distinzione materiale;
- UNRESOLVED: non puoi decidere in modo affidabile.

I recoveredClaims:
- non derivano da un claim precedente;
- possono citare SOLO evidence ID che erano davvero scoperti dopo l'Extractor;
- devono essere atomici, con massimo 4 evidenceIds;
- non possono inventare fatti o usare la rubrica host privata.

Se l'Anti-Bias giudica una omissione NOT_MATERIAL puoi comunque recuperarla se,
rileggendo l'evidenza, la ritieni materiale. La challenge non e un'autorita.
Scegli answerOptionId dal significato testuale delle opzioni.
Non autorizzare training o azioni. Restituisci esclusivamente il JSON richiesto.
"""

INTEGRATOR_SYSTEM="""Sei l'integratore finale della rete FAME Neural V7.
Usa soltanto:
- supportedClaims originali;
- repairedClaims V6;
- recoveredClaims V7.
Non usare claim originali unsupported o in rework.
Ogni issue Anti-Bias BLOCKING deve essere REJECTED oppure RESOLVED_BY_REPAIR.
Ogni omissione deve essere risolta dal Verifier; non usare omissioni UNRESOLVED.
Preserva tutte le distinzioni sostenute dai claim utilizzabili senza aggiungere
fatti esterni. Scegli answerOptionId dal significato testuale dell'opzione.
Non dichiarare il sistema unbiased e non autorizzare training/esecuzioni.
Restituisci esclusivamente il JSON richiesto.
"""


def code_hashes():
    names=(
        'fame_four_role_network_v7.py',
        'fame_four_role_network_v6.py',
        'fame_four_role_network_v5.py',
        'fame_four_role_network_v4.py',
        'fame_anti_bias.py',
        'agent.py',
    )
    return {name:hashlib.sha256((BASE/name).read_bytes()).hexdigest() for name in names}


def package(case_id):
    return v6.package(case_id)


def public_case(p):
    return v6.public_case(p)


def host_rubric(p):
    return v6.host_rubric(p)


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
        'antiBias':anti_bias.snapshot(),
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
    print('Rete FAME v7 creata; nessuna chiamata al modello: '+str(root))


def verify(root):
    config=agent.read(agent.safe_path(root,'network.json'))
    p=package(config.get('caseId'))
    if config!=metadata(p):
        raise ValueError('Protocollo o codice rete V7 cambiato dopo init')
    if agent.read(agent.safe_path(root,'case-public.json'))!=public_case(p):
        raise ValueError('Case pubblico V7 modificato')
    if agent.read(agent.safe_path(root,'host-rubric.json'))!=host_rubric(p):
        raise ValueError('Rubrica host V7 modificata')
    return p


def uncovered_evidence_ids(p,extractor):
    all_ids=[u['unitId'] for u in p['units']]
    used=set()
    for claim in extractor.get('claims',[]):
        if type(claim) is dict:
            used.update(claim.get('evidenceIds',[]))
    return [eid for eid in all_ids if eid not in used]


def antibias_schema(p,extractor):
    schema=copy.deepcopy(anti_bias.schema(extractor['claims'],p['units']))
    uncovered=uncovered_evidence_ids(p,extractor)
    allowed=uncovered or [u['unitId'] for u in p['units']]
    schema['required'].append('omissionReview')
    schema['properties']['omissionReview']={
        'type':'array',
        'minItems':len(uncovered),
        'maxItems':len(uncovered),
        'items':{
            'type':'object',
            'additionalProperties':False,
            'required':['evidenceId','status','reason'],
            'properties':{
                'evidenceId':{'type':'string','enum':allowed},
                'status':{'type':'string','enum':list(OMISSION_STATUSES)},
                'reason':{'type':'string','minLength':1},
            },
        },
    }
    return schema


def antibias_request(p,extractor):
    uncovered=uncovered_evidence_ids(p,extractor)
    payload={
        'question':p['question'],
        'units':p['units'],
        'frozenExtractorOutput':extractor,
        'uncoveredEvidenceIds':uncovered,
        'controls':anti_bias.CONTROLS,
    }
    return {
        'model':MODEL,
        'stream':False,
        'options':dict(OPTIONS),
        'format':antibias_schema(p,extractor),
        'messages':[
            {'role':'system','content':ANTIBIAS_SYSTEM},
            {'role':'user','content':json.dumps(payload,ensure_ascii=False)},
        ],
    }


def validate_antibias(answer,p,extractor):
    if type(answer) is not dict:
        return ['ANTI_BIAS_OUTPUT_CONTRACT']
    base={k:v for k,v in answer.items() if k!='omissionReview'}
    errors=list(anti_bias.validate(base,extractor['claims'],p['units']))

    uncovered=uncovered_evidence_ids(p,extractor)
    rows=answer.get('omissionReview')
    if type(rows) is not list or len(rows)!=len(uncovered):
        errors.append('ANTI_BIAS_OMISSION_REVIEW_COUNT')
        rows=[]

    seen=[]
    for row in rows:
        if type(row) is not dict or set(row)!={'evidenceId','status','reason'}:
            errors.append('ANTI_BIAS_OMISSION_REVIEW_CONTRACT')
            continue
        eid=row.get('evidenceId')
        seen.append(eid)
        if eid not in uncovered:
            errors.append('ANTI_BIAS_OMISSION_REVIEW_EVIDENCE')
        if row.get('status') not in OMISSION_STATUSES:
            errors.append('ANTI_BIAS_OMISSION_REVIEW_STATUS')
        if not isinstance(row.get('reason'),str) or not row['reason'].strip():
            errors.append('ANTI_BIAS_OMISSION_REVIEW_REASON')
    if set(seen)!=set(uncovered) or len(seen)!=len(set(seen)):
        errors.append('ANTI_BIAS_OMISSION_REVIEW_COVERAGE')
    return sorted(set(errors))


def _base_challenge(challenge):
    return {k:v for k,v in challenge.items() if k!='omissionReview'}


def verifier_schema(p,extractor,challenge):
    base=copy.deepcopy(v5.verifier_schema(p,extractor,_base_challenge(challenge)))
    evidence=[u['unitId'] for u in p['units']]
    uncovered=uncovered_evidence_ids(p,extractor)
    base['required'] += ['recoveredClaims','omissionResolution']
    base['properties']['recoveredClaims']={
        'type':'array','minItems':0,'maxItems':8,
        'items':{
            'type':'object','additionalProperties':False,
            'required':['claimId','statement','evidenceIds','reason'],
            'properties':{
                'claimId':{'type':'string','enum':list(RECOVERY_IDS)},
                'statement':{'type':'string','minLength':1},
                'evidenceIds':{
                    'type':'array','minItems':1,'maxItems':4,'uniqueItems':True,
                    'items':{'type':'string','enum':evidence},
                },
                'reason':{'type':'string','minLength':1},
            },
        },
    }
    base['properties']['omissionResolution']={
        'type':'array','minItems':len(uncovered),'maxItems':len(uncovered),
        'items':{
            'type':'object','additionalProperties':False,
            'required':['evidenceId','status','reason'],
            'properties':{
                'evidenceId':{'type':'string','enum':evidence},
                'status':{'type':'string','enum':list(OMISSION_RESOLUTIONS)},
                'reason':{'type':'string','minLength':1},
            },
        },
    }
    return base


def _base_verifier(answer):
    keep={'answerOptionId','supportedClaims','unsupportedClaims','claimsNeedingRework',
          'repairedClaims','antiBiasResolution'}
    return {k:v for k,v in answer.items() if k in keep}


def _all_usable_evidence(answer):
    evidence=set()
    for field in ('supportedClaims','repairedClaims','recoveredClaims'):
        for row in answer.get(field,[]) if type(answer) is dict else []:
            if type(row) is dict:
                evidence.update(row.get('evidenceIds',[]))
    return evidence


def validate_verifier(answer,p,extractor,challenge):
    if type(answer) is not dict:
        return ['VERIFIER_OUTPUT_CONTRACT']

    expected={'answerOptionId','supportedClaims','unsupportedClaims','claimsNeedingRework',
              'repairedClaims','recoveredClaims','omissionResolution'}
    if _base_challenge(challenge).get('issues'):
        expected.add('antiBiasResolution')
    if set(answer)!=expected:
        return ['VERIFIER_OUTPUT_CONTRACT']

    base_answer=_base_verifier(answer)
    base_challenge=_base_challenge(challenge)
    errors=list(v5.validate_verifier(base_answer,p,extractor,base_challenge))

    # Preserve V6 evidence obligations for valid RESOLVED_BY_REPAIR decisions.
    by_source=v6._usable_evidence_by_source(base_answer)
    issue_by_id={row['issueId']:row for row in base_challenge.get('issues',[])
                 if type(row) is dict and row.get('issueId')}
    for resolution in base_answer.get('antiBiasResolution',[]):
        if type(resolution) is not dict or resolution.get('status')!='RESOLVED_BY_REPAIR':
            continue
        issue=issue_by_id.get(resolution.get('issueId'))
        if not issue:
            continue
        covered=set()
        for cid in issue.get('claimIds',[]):
            covered.update(by_source.get(cid,set()))
        required={eid for eid in issue.get('evidenceIds',[]) if isinstance(eid,str)}
        if not required.issubset(covered):
            errors.append('VERIFIER_REPAIR_MISSING_ISSUE_EVIDENCE')

    uncovered=set(uncovered_evidence_ids(p,extractor))
    evidence_ids={u['unitId'] for u in p['units']}
    recovered=answer.get('recoveredClaims')
    recovered_ids=[]
    recovered_evidence=set()
    if type(recovered) is not list or len(recovered)>8:
        errors.append('VERIFIER_RECOVERED_CLAIMS_CONTRACT')
        recovered=[]
    for row in recovered:
        if type(row) is not dict or set(row)!={'claimId','statement','evidenceIds','reason'}:
            errors.append('VERIFIER_RECOVERED_CLAIM_CONTRACT')
            continue
        rid=row.get('claimId')
        eids=row.get('evidenceIds')
        recovered_ids.append(rid)
        if rid not in RECOVERY_IDS:
            errors.append('VERIFIER_RECOVERED_CLAIM_ID')
        if not isinstance(row.get('statement'),str) or not row['statement'].strip():
            errors.append('VERIFIER_RECOVERED_CLAIM_TEXT')
        if (type(eids) is not list or not eids or len(eids)>4 or
                len(eids)!=len(set(eids)) or any(x not in evidence_ids for x in eids)):
            errors.append('VERIFIER_RECOVERED_EVIDENCE')
        else:
            if any(x not in uncovered for x in eids):
                errors.append('VERIFIER_RECOVERY_USED_NONOMITTED_EVIDENCE')
            recovered_evidence.update(eids)
        if not isinstance(row.get('reason'),str) or not row['reason'].strip():
            errors.append('VERIFIER_RECOVERED_REASON')
    if len(recovered_ids)!=len(set(recovered_ids)):
        errors.append('VERIFIER_DUPLICATE_RECOVERY_ID')

    resolutions=answer.get('omissionResolution')
    if type(resolutions) is not list or len(resolutions)!=len(uncovered):
        errors.append('VERIFIER_OMISSION_RESOLUTION_COUNT')
        resolutions=[]
    seen=[]
    for row in resolutions:
        if type(row) is not dict or set(row)!={'evidenceId','status','reason'}:
            errors.append('VERIFIER_OMISSION_RESOLUTION_CONTRACT')
            continue
        eid=row.get('evidenceId')
        status=row.get('status')
        seen.append(eid)
        if eid not in uncovered:
            errors.append('VERIFIER_OMISSION_RESOLUTION_EVIDENCE')
        if status not in OMISSION_RESOLUTIONS:
            errors.append('VERIFIER_OMISSION_RESOLUTION_STATUS')
        if not isinstance(row.get('reason'),str) or not row['reason'].strip():
            errors.append('VERIFIER_OMISSION_RESOLUTION_REASON')
        if status=='RECOVERED' and eid not in recovered_evidence:
            errors.append('VERIFIER_OMISSION_RECOVERY_MISSING_CLAIM')
        if status=='UNRESOLVED':
            errors.append('VERIFIER_OMISSION_UNRESOLVED')
    if set(seen)!=uncovered or len(seen)!=len(set(seen)):
        errors.append('VERIFIER_OMISSION_RESOLUTION_COVERAGE')

    # Private host rubric remains a host-only acceptance gate.
    if answer.get('answerOptionId')==p.get('expectedAnswerOptionId'):
        selected=_all_usable_evidence(answer)
        for group in p.get('requiredFinalEvidenceGroups',[]):
            if not any(eid in selected for eid in group):
                errors.append('VERIFIER_INSUFFICIENT_FINAL_EVIDENCE_AFTER_RECOVERY')
                break

    return sorted(set(errors))


def verifier_request(p,extractor,challenge):
    payload={
        'question':p['question'],
        'answerOptions':p['answerOptions'],
        'units':p['units'],
        'frozenExtractorOutput':extractor,
        'frozenAntiBiasChallenge':challenge,
        'hostDerivedUncoveredEvidenceIds':uncovered_evidence_ids(p,extractor),
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
    result=v5.usable_claim_map(verifier)
    for row in verifier.get('recoveredClaims',[]):
        if type(row) is dict and row.get('claimId'):
            result[row['claimId']]={
                'claimId':row['claimId'],
                'statement':row.get('statement'),
                'evidenceIds':row.get('evidenceIds',[]),
                'source':'recovered',
            }
    return result


def integrator_schema(p,verifier):
    claims=list(usable_claim_map(verifier))
    return {
        'type':'object','additionalProperties':False,
        'required':['answerOptionId','usedClaimIds','answer','limitations'],
        'properties':{
            'answerOptionId':{'type':'string','enum':[row['optionId'] for row in p['answerOptions']]},
            'usedClaimIds':{'type':'array','minItems':1,'uniqueItems':True,
                            'items':{'type':'string','enum':claims}},
            'answer':{'type':'string','minLength':1},
            'limitations':{'type':'array','maxItems':6,
                           'items':{'type':'string','minLength':1}},
        },
    }


def validate_integrator(answer,p,extractor,challenge,verifier):
    errors=[]
    if type(answer) is not dict or set(answer)!={'answerOptionId','usedClaimIds','answer','limitations'}:
        return ['INTEGRATOR_OUTPUT_CONTRACT']
    option_ids={row['optionId'] for row in p['answerOptions']}
    if answer.get('answerOptionId') not in option_ids:
        errors.append('INTEGRATOR_ANSWER_OPTION')
    if answer.get('answerOptionId')!=p['expectedAnswerOptionId']:
        errors.append('INTEGRATOR_INCORRECT_ANSWER_OPTION')
    if answer.get('answerOptionId')!=verifier.get('answerOptionId'):
        errors.append('INTEGRATOR_VERIFIER_ANSWER_MISMATCH')

    usable=usable_claim_map(verifier)
    used=answer.get('usedClaimIds')
    if type(used) is not list or not used or len(used)!=len(set(used)):
        errors.append('INTEGRATOR_USED_CLAIMS')
        used=[]
    if any(cid not in usable for cid in used):
        errors.append('INTEGRATOR_USED_UNSUPPORTED_CLAIM')

    evidence=set()
    for cid in used:
        row=usable.get(cid)
        if row:
            evidence.update(row['evidenceIds'])
    for group in p['requiredFinalEvidenceGroups']:
        if not any(eid in evidence for eid in group):
            errors.append('INTEGRATOR_INSUFFICIENT_FINAL_EVIDENCE')

    issue_by_id={row['issueId']:row for row in challenge.get('issues',[])}
    for resolution in verifier.get('antiBiasResolution',[]):
        issue=issue_by_id.get(resolution.get('issueId'))
        if (issue and issue.get('severity')=='BLOCKING' and
                resolution.get('status') not in ('REJECTED','RESOLVED_BY_REPAIR')):
            errors.append('INTEGRATOR_BLOCKING_ANTIBIAS_UNRESOLVED')
    if challenge.get('overall') in ('ANTI_BIAS_EVIDENCE_INSUFFICIENT','ANTI_BIAS_RESULTS_CONTRADICTORY'):
        errors.append('INTEGRATOR_ANTIBIAS_HARD_STOP')
    if any(row.get('status')=='UNRESOLVED' for row in verifier.get('omissionResolution',[])
           if type(row) is dict):
        errors.append('INTEGRATOR_OMISSION_UNRESOLVED')

    if not isinstance(answer.get('answer'),str) or not answer['answer'].strip():
        errors.append('INTEGRATOR_ANSWER')
    limitations=answer.get('limitations')
    if (type(limitations) is not list or len(limitations)>6 or
            any(not isinstance(x,str) or not x.strip() for x in limitations)):
        errors.append('INTEGRATOR_LIMITATIONS')
    return sorted(set(errors))


def integrator_request(p,extractor,challenge,verifier):
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
            {'role':'system','content':INTEGRATOR_SYSTEM},
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

    ab_req=antibias_request(p,extractor)
    ab=v4.read_role(root,'anti-bias',ab_req,lambda a:validate_antibias(a,p,extractor))
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
            overall='NEEDS_REVIEW'
            break
        if state=='PENDING':
            overall='IN_PROGRESS'
            break
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
        f.write('FAME four-role network v7 attiva\n')
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
            print('[1/4] Extractor V7: attesa Ollama...',flush=True)
            ext=v4.execute_role(root,'extractor',v4.extractor_request(p),
                                lambda a:v4.validate_extractor(a,p),client)
        if ext['status']!='ACCEPTED':
            return emit_status(root)
        extractor=ext['output']

        ab=status(root)['roles']['anti-bias']
        if ab['status']=='PENDING':
            print('[2/4] Anti-Bias V7 + omission review: attesa Ollama...',flush=True)
            req=antibias_request(p,extractor)
            ab=v4.execute_role(root,'anti-bias',req,
                               lambda a:validate_antibias(a,p,extractor),client)
        if ab['status']!='ACCEPTED':
            return emit_status(root)
        challenge=ab['output']

        ver=status(root)['roles']['verifier']
        if ver['status']=='PENDING':
            print('[3/4] Verifier V7 + repair/recovery: attesa Ollama...',flush=True)
            req=verifier_request(p,extractor,challenge)
            ver=v4.execute_role(root,'verifier',req,
                                lambda a:validate_verifier(a,p,extractor,challenge),client)
        if ver['status']!='ACCEPTED':
            return emit_status(root)
        verifier=ver['output']

        integ=status(root)['roles']['integrator']
        if integ['status']=='PENDING':
            print('[4/4] Integrator V7: attesa Ollama...',flush=True)
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
