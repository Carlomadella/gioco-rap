"""FAME Neural four-role local network v5.

V5 preserves the V4 four-role topology but adds bounded semantic repair in the
Verifier. Anti-Bias findings remain frozen: the Verifier may either reject an
issue, leave it unresolved/upheld, or resolve it by replacing an over-broad or
under-cited Extractor claim with smaller repaired claims grounded only in the
original evidence units. The Integrator may use only directly supported or
Verifier-repaired claims.
"""
import argparse
import hashlib
import json
import time
from pathlib import Path

import agent
import fame_anti_bias as anti_bias
import fame_four_role_network_v4 as v4

BASE=Path(__file__).resolve().parent
VERSION='fame-four-role-network-v5'
MODEL=v4.MODEL
DIGEST=v4.DIGEST
OPTIONS=dict(v4.OPTIONS)
ROLES=v4.ROLES
FINAL_ACCEPTED=v4.FINAL_ACCEPTED
CASE_DIR=v4.CASE_DIR

VERIFIER_SYSTEM="""Sei il verificatore indipendente della rete FAME Neural V5.
Ricevi domanda, opzioni di risposta, evidenze originali, claim congelati dell'Extractor e challenge Anti-Bias congelata.
La challenge e' materiale critico, non un'autorita'. Verifica ogni claim contro le evidenze originali.

Ogni claim originale deve comparire in ESATTAMENTE UNO tra:
- supportedClaims: il claim originale e' sostenuto cosi' com'e'; indica evidenceIds diretti;
- unsupportedClaims: il claim non e' sostenuto;
- claimsNeedingRework: il claim e' troppo ampio, ambiguo o ha una mappa evidenze incompleta.

Se un claim in claimsNeedingRework e' recuperabile SENZA aggiungere fatti esterni, puoi emettere repairedClaims.
Ogni repairedClaim deve:
- derivare da un solo sourceClaimId presente in claimsNeedingRework;
- essere atomico e piu' stretto del claim sorgente quando serve;
- citare soltanto evidenze originali che lo supportano direttamente;
- usare al massimo 4 evidenceIds.
Puoi dividere un claim sorgente in piu' repairedClaims per preservare distinzioni che non entrano in una sola mappa evidenze.

Per ogni issue Anti-Bias usa uno status:
- REJECTED: la challenge e' errata rispetto alle evidenze;
- RESOLVED_BY_REPAIR: la challenge era valida ma i repairedClaims la risolvono;
- UPHELD: la challenge e' valida e resta bloccante;
- UNRESOLVED: non puoi decidere in modo affidabile.
Non usare RESOLVED_BY_REPAIR se i claim coinvolti non sono realmente coperti da repairedClaims/supportedClaims.
Scegli answerOptionId dalla descrizione testuale dell'opzione. Non autorizzare training o azioni.
Restituisci esclusivamente il JSON richiesto.
"""

INTEGRATOR_SYSTEM="""Sei l'integratore finale della rete FAME Neural V5.
Usa soltanto i claim direttamente supportedClaims del Verifier e i repairedClaims prodotti dal Verifier.
Non usare i claim originali presenti in unsupportedClaims o claimsNeedingRework.
Non ignorare issue Anti-Bias BLOCKING: puoi procedere solo se ciascuna e' REJECTED oppure RESOLVED_BY_REPAIR.
Scegli answerOptionId usando la descrizione testuale dell'opzione ricevuta.
Rispondi in modo breve e preciso, mantenendo limiti e condizioni.
Non dichiarare il sistema unbiased, non autorizzare training/esecuzioni e non aggiungere fatti esterni.
Restituisci esclusivamente il JSON richiesto.
"""

REPAIR_IDS=tuple(f'R{i}' for i in range(1,9))
RESOLUTION_STATUSES=('UPHELD','REJECTED','RESOLVED_BY_REPAIR','UNRESOLVED')


def code_hashes():
    names=('fame_four_role_network_v5.py','fame_four_role_network_v4.py','fame_anti_bias.py','agent.py')
    return {name:hashlib.sha256((BASE/name).read_bytes()).hexdigest() for name in names}


def package(case_id):
    return v4.package(case_id)


def public_case(p):
    return v4.public_case(p)


def host_rubric(p):
    return v4.host_rubric(p)


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
        'semanticRepair':'verifier-bounded-v1',
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
    print('Rete FAME v5 creata; nessuna chiamata al modello: '+str(root))


def verify(root):
    config=agent.read(agent.safe_path(root,'network.json'))
    p=package(config.get('caseId'))
    if config!=metadata(p):
        raise ValueError('Protocollo o codice rete V5 cambiato dopo init')
    if agent.read(agent.safe_path(root,'case-public.json'))!=public_case(p):
        raise ValueError('Case pubblico V5 modificato')
    if agent.read(agent.safe_path(root,'host-rubric.json'))!=host_rubric(p):
        raise ValueError('Rubrica host V5 modificata')
    return p


def verifier_schema(p,extractor,challenge):
    claims=[c['claimId'] for c in extractor['claims']]
    evidence=[u['unitId'] for u in p['units']]
    issues=[i['issueId'] for i in challenge['issues']]
    supported_item={
        'type':'object','additionalProperties':False,
        'required':['claimId','evidenceIds','reason'],
        'properties':{
            'claimId':{'type':'string','enum':claims},
            'evidenceIds':{'type':'array','minItems':1,'maxItems':4,'uniqueItems':True,
                           'items':{'type':'string','enum':evidence}},
            'reason':{'type':'string','minLength':1},
        },
    }
    no_evidence_item={
        'type':'object','additionalProperties':False,
        'required':['claimId','reason'],
        'properties':{
            'claimId':{'type':'string','enum':claims},
            'reason':{'type':'string','minLength':1},
        },
    }
    repaired_item={
        'type':'object','additionalProperties':False,
        'required':['claimId','sourceClaimId','statement','evidenceIds','reason'],
        'properties':{
            'claimId':{'type':'string','enum':list(REPAIR_IDS)},
            'sourceClaimId':{'type':'string','enum':claims},
            'statement':{'type':'string','minLength':1},
            'evidenceIds':{'type':'array','minItems':1,'maxItems':4,'uniqueItems':True,
                           'items':{'type':'string','enum':evidence}},
            'reason':{'type':'string','minLength':1},
        },
    }
    required=['answerOptionId','supportedClaims','unsupportedClaims','claimsNeedingRework','repairedClaims']
    properties={
        'answerOptionId':{'type':'string','enum':[row['optionId'] for row in p['answerOptions']]},
        'supportedClaims':{'type':'array','minItems':0,'maxItems':len(claims),'items':supported_item},
        'unsupportedClaims':{'type':'array','minItems':0,'maxItems':len(claims),'items':no_evidence_item},
        'claimsNeedingRework':{'type':'array','minItems':0,'maxItems':len(claims),'items':no_evidence_item},
        'repairedClaims':{'type':'array','minItems':0,'maxItems':8,'items':repaired_item},
    }
    if issues:
        required.append('antiBiasResolution')
        properties['antiBiasResolution']={
            'type':'array','minItems':len(issues),'maxItems':len(issues),
            'items':{
                'type':'object','additionalProperties':False,
                'required':['issueId','status','reason'],
                'properties':{
                    'issueId':{'type':'string','enum':issues},
                    'status':{'type':'string','enum':list(RESOLUTION_STATUSES)},
                    'reason':{'type':'string','minLength':1},
                },
            },
        }
    return {'type':'object','additionalProperties':False,'required':required,'properties':properties}


def _partition_rows(answer):
    for field in ('supportedClaims','unsupportedClaims','claimsNeedingRework'):
        rows=answer.get(field,[]) if type(answer) is dict else []
        if type(rows) is list:
            for row in rows:
                if type(row) is dict:
                    yield field,row


def validate_verifier(answer,p,extractor,challenge):
    errors=[]
    issue_ids={i['issueId'] for i in challenge['issues']}
    expected={'answerOptionId','supportedClaims','unsupportedClaims','claimsNeedingRework','repairedClaims'} | ({'antiBiasResolution'} if issue_ids else set())
    if type(answer) is not dict or set(answer)!=expected:
        return ['VERIFIER_OUTPUT_CONTRACT']

    option_ids={row['optionId'] for row in p['answerOptions']}
    if answer.get('answerOptionId') not in option_ids:
        errors.append('VERIFIER_ANSWER_OPTION')

    claim_ids={c['claimId'] for c in extractor['claims']}
    evidence={u['unitId'] for u in p['units']}
    seen=[]
    rework_ids=set()
    supported_ids=set()

    for field,row in _partition_rows(answer):
        cid=row.get('claimId')
        seen.append(cid)
        if cid not in claim_ids:
            errors.append('VERIFIER_UNKNOWN_CLAIM')
        if not isinstance(row.get('reason'),str) or not row['reason'].strip():
            errors.append('VERIFIER_REASON')
        expected_keys={'claimId','evidenceIds','reason'} if field=='supportedClaims' else {'claimId','reason'}
        if set(row)!=expected_keys:
            errors.append('VERIFIER_SUPPORTED_CLAIM_CONTRACT' if field=='supportedClaims' else 'VERIFIER_PARTITION_CLAIM_CONTRACT')
            continue
        if field=='supportedClaims':
            supported_ids.add(cid)
            eids=row.get('evidenceIds')
            if type(eids) is not list or not eids or len(eids)>4 or len(eids)!=len(set(eids)) or any(x not in evidence for x in eids):
                errors.append('VERIFIER_SUPPORTED_EVIDENCE')
        elif field=='claimsNeedingRework':
            rework_ids.add(cid)

    for field in ('supportedClaims','unsupportedClaims','claimsNeedingRework'):
        if type(answer.get(field)) is not list:
            errors.append('VERIFIER_PARTITION_CONTRACT')
    if set(seen)!=claim_ids or len(seen)!=len(set(seen)):
        errors.append('VERIFIER_CLAIM_PARTITION')

    repaired=answer.get('repairedClaims')
    repaired_sources=set()
    repair_ids=[]
    if type(repaired) is not list or len(repaired)>8:
        errors.append('VERIFIER_REPAIRED_CLAIMS_CONTRACT')
        repaired=[]
    for row in repaired:
        if type(row) is not dict or set(row)!={'claimId','sourceClaimId','statement','evidenceIds','reason'}:
            errors.append('VERIFIER_REPAIRED_CLAIM_CONTRACT');continue
        rid=row.get('claimId'); source=row.get('sourceClaimId'); eids=row.get('evidenceIds')
        repair_ids.append(rid)
        if rid not in REPAIR_IDS:
            errors.append('VERIFIER_REPAIRED_CLAIM_ID')
        if source not in rework_ids:
            errors.append('VERIFIER_REPAIR_SOURCE_NOT_REWORK')
        else:
            repaired_sources.add(source)
        if not isinstance(row.get('statement'),str) or not row['statement'].strip():
            errors.append('VERIFIER_REPAIRED_CLAIM_TEXT')
        if type(eids) is not list or not eids or len(eids)>4 or len(eids)!=len(set(eids)) or any(x not in evidence for x in eids):
            errors.append('VERIFIER_REPAIRED_EVIDENCE')
        if not isinstance(row.get('reason'),str) or not row['reason'].strip():
            errors.append('VERIFIER_REPAIRED_REASON')
    if len(repair_ids)!=len(set(repair_ids)):
        errors.append('VERIFIER_DUPLICATE_REPAIR_ID')

    issue_by_id={i['issueId']:i for i in challenge['issues']}
    resolutions=answer.get('antiBiasResolution',[])
    if type(resolutions) is not list or len(resolutions)!=len(issue_ids):
        errors.append('VERIFIER_ANTIBIAS_RESOLUTION_COUNT')
        resolutions=[]
    seen_issues=[]
    for row in resolutions:
        if type(row) is not dict or set(row)!={'issueId','status','reason'}:
            errors.append('VERIFIER_ANTIBIAS_RESOLUTION_CONTRACT');continue
        iid=row.get('issueId'); status=row.get('status')
        seen_issues.append(iid)
        if iid not in issue_ids:
            errors.append('VERIFIER_UNKNOWN_ANTIBIAS_ISSUE')
        if status not in RESOLUTION_STATUSES:
            errors.append('VERIFIER_ANTIBIAS_STATUS')
        if not isinstance(row.get('reason'),str) or not row['reason'].strip():
            errors.append('VERIFIER_ANTIBIAS_REASON')
        if status=='RESOLVED_BY_REPAIR':
            issue=issue_by_id.get(iid,{})
            involved=set(issue.get('claimIds',[]))
            if not involved or any(cid not in supported_ids and cid not in repaired_sources for cid in involved):
                errors.append('VERIFIER_REPAIR_DOES_NOT_RESOLVE_ISSUE')
    if set(seen_issues)!=issue_ids or len(seen_issues)!=len(set(seen_issues)):
        errors.append('VERIFIER_ANTIBIAS_RESOLUTION_COVERAGE')
    return sorted(set(errors))


def verifier_request(p,extractor,challenge):
    payload={'question':p['question'],'answerOptions':p['answerOptions'],'units':p['units'],
             'frozenExtractorOutput':extractor,'frozenAntiBiasChallenge':challenge}
    return {
        'model':MODEL,'stream':False,'options':dict(OPTIONS),'format':verifier_schema(p,extractor,challenge),
        'messages':[{'role':'system','content':VERIFIER_SYSTEM},
                    {'role':'user','content':json.dumps(payload,ensure_ascii=False)}],
    }


def usable_claim_map(verifier):
    result={}
    for row in verifier.get('supportedClaims',[]):
        if type(row) is dict and row.get('claimId'):
            result[row['claimId']]={'claimId':row['claimId'],'statement':None,'evidenceIds':row.get('evidenceIds',[]),'source':'supported'}
    for row in verifier.get('repairedClaims',[]):
        if type(row) is dict and row.get('claimId'):
            result[row['claimId']]={'claimId':row['claimId'],'statement':row.get('statement'),'evidenceIds':row.get('evidenceIds',[]),'source':'repaired'}
    return result


def integrator_schema(p,verifier):
    claims=list(usable_claim_map(verifier))
    return {
        'type':'object','additionalProperties':False,
        'required':['answerOptionId','usedClaimIds','answer','limitations'],
        'properties':{
            'answerOptionId':{'type':'string','enum':[row['optionId'] for row in p['answerOptions']]},
            'usedClaimIds':{'type':'array','minItems':1,'uniqueItems':True,'items':{'type':'string','enum':claims}},
            'answer':{'type':'string','minLength':1},
            'limitations':{'type':'array','maxItems':6,'items':{'type':'string','minLength':1}},
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
        errors.append('INTEGRATOR_USED_CLAIMS');used=[]
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

    issue_by_id={row['issueId']:row for row in challenge['issues']}
    for resolution in verifier.get('antiBiasResolution',[]):
        issue=issue_by_id.get(resolution.get('issueId'))
        if issue and issue.get('severity')=='BLOCKING' and resolution.get('status') not in ('REJECTED','RESOLVED_BY_REPAIR'):
            errors.append('INTEGRATOR_BLOCKING_ANTIBIAS_UNRESOLVED')
    if challenge.get('overall') in ('ANTI_BIAS_EVIDENCE_INSUFFICIENT','ANTI_BIAS_RESULTS_CONTRADICTORY'):
        errors.append('INTEGRATOR_ANTIBIAS_HARD_STOP')

    if not isinstance(answer.get('answer'),str) or not answer['answer'].strip():
        errors.append('INTEGRATOR_ANSWER')
    limitations=answer.get('limitations')
    if type(limitations) is not list or len(limitations)>6 or any(not isinstance(x,str) or not x.strip() for x in limitations):
        errors.append('INTEGRATOR_LIMITATIONS')
    return sorted(set(errors))


def integrator_request(p,extractor,challenge,verifier):
    payload={'question':p['question'],'answerOptions':p['answerOptions'],'units':p['units'],
             'frozenExtractorOutput':extractor,'frozenAntiBiasChallenge':challenge,
             'frozenVerifierOutput':verifier,'usableClaims':usable_claim_map(verifier)}
    return {
        'model':MODEL,'stream':False,'options':dict(OPTIONS),'format':integrator_schema(p,verifier),
        'messages':[{'role':'system','content':INTEGRATOR_SYSTEM},
                    {'role':'user','content':json.dumps(payload,ensure_ascii=False)}],
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

    ab_req=v4.antibias_request(p,extractor)
    ab=v4.read_role(root,'anti-bias',ab_req,lambda a:anti_bias.validate(a,extractor['claims'],p['units']))
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
    rows['integrator']=v4.read_role(root,'integrator',int_req,lambda a:validate_integrator(a,p,extractor,challenge,verifier))
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
    return {'schema':VERSION,'caseId':p['caseId'],'status':overall,'roles':rows,'modelCalls':calls,
            'humanReviewRequired':True,'executionAuthorized':False,'trainingAuthorized':False,
            'networkProductionReady':False,'independentEvaluation':False}


def emit_status(root):
    final=status(root)
    print(json.dumps(final,ensure_ascii=False,indent=2))
    return final


def run(root,client=None):
    root=root.resolve()
    lock=agent.safe_path(root,'network.lock')
    with lock.open('x') as f:
        f.write('FAME four-role network v5 attiva\n')
    try:
        p=verify(root)
        current=status(root)
        if current['status']!='IN_PROGRESS':
            print(json.dumps(current,ensure_ascii=False,indent=2));return current
        client=client or agent.Ollama()
        session=root/'sessions'/str(int(time.time()*1000));session.mkdir()
        preflight=agent.preflight(client,MODEL);agent.write(session/'preflight.json',preflight)
        if preflight['model']['digest']!=DIGEST:
            raise ValueError('Digest modello diverso dal protocollo')

        ext=status(root)['roles']['extractor']
        if ext['status']=='PENDING':
            print('[1/4] Extractor V5: attesa Ollama...',flush=True)
            ext=v4.execute_role(root,'extractor',v4.extractor_request(p),lambda a:v4.validate_extractor(a,p),client)
        if ext['status']!='ACCEPTED': return emit_status(root)
        extractor=ext['output']

        ab=status(root)['roles']['anti-bias']
        if ab['status']=='PENDING':
            print('[2/4] Anti-Bias indipendente V5: attesa Ollama...',flush=True)
            req=v4.antibias_request(p,extractor)
            ab=v4.execute_role(root,'anti-bias',req,lambda a:anti_bias.validate(a,extractor['claims'],p['units']),client)
        if ab['status']!='ACCEPTED': return emit_status(root)
        challenge=ab['output']

        ver=status(root)['roles']['verifier']
        if ver['status']=='PENDING':
            print('[3/4] Verifier V5 + bounded repair: attesa Ollama...',flush=True)
            req=verifier_request(p,extractor,challenge)
            ver=v4.execute_role(root,'verifier',req,lambda a:validate_verifier(a,p,extractor,challenge),client)
        if ver['status']!='ACCEPTED': return emit_status(root)
        verifier=ver['output']

        integ=status(root)['roles']['integrator']
        if integ['status']=='PENDING':
            print('[4/4] Integrator V5: attesa Ollama...',flush=True)
            req=integrator_request(p,extractor,challenge,verifier)
            integ=v4.execute_role(root,'integrator',req,lambda a:validate_integrator(a,p,extractor,challenge,verifier),client)

        final=status(root);agent.write(session/'summary.json',final)
        print(json.dumps(final,ensure_ascii=False,indent=2));return final
    finally:
        lock.unlink()


def build_parser():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('command',choices=('init','run','status'))
    p.add_argument('--root',required=True,type=Path)
    p.add_argument('--case')
    return p


def main():
    parser=build_parser();args=parser.parse_args()
    try:
        root=args.root.resolve()
        if args.command=='init':
            if not args.case: raise ValueError('--case richiesto per init')
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
