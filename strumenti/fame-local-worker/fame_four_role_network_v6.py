"""FAME Neural four-role local network v6.

V6 preserves V5 and tightens bounded semantic repair:
- RESOLVED_BY_REPAIR must preserve the evidence obligations named by Anti-Bias;
- the host checks final required evidence coverage immediately after Verifier repair;
- Integrator still accepts only supported or repaired claims.

V4 and V5 remain frozen for reproducibility of their measured runs.
"""
import argparse
import hashlib
import json
import time
from pathlib import Path

import agent
import fame_anti_bias as anti_bias
import fame_four_role_network_v4 as v4
import fame_four_role_network_v5 as v5

BASE=Path(__file__).resolve().parent
VERSION='fame-four-role-network-v6'
MODEL=v4.MODEL
DIGEST=v4.DIGEST
OPTIONS=dict(v4.OPTIONS)
ROLES=v4.ROLES
FINAL_ACCEPTED=v4.FINAL_ACCEPTED

VERIFIER_SYSTEM="""Sei il verificatore indipendente della rete FAME Neural V6.
Ricevi domanda, opzioni di risposta, evidenze originali, claim congelati dell'Extractor e challenge Anti-Bias congelata.
La challenge e' materiale critico, non un'autorita'. Verifica ogni claim contro le evidenze originali.

Ogni claim originale deve comparire in ESATTAMENTE UNO tra supportedClaims, unsupportedClaims e claimsNeedingRework.
Se un claim in claimsNeedingRework e' recuperabile senza fatti esterni, puoi emettere repairedClaims atomici derivati da quel claim.

REGOLA DI REPAIR VINCOLANTE:
- RESOLVED_BY_REPAIR non significa eliminare la parte contestata;
- se una issue Anti-Bias elenca evidenceIds, ogni evidenceId elencato deve restare rappresentato da un supportedClaim coinvolto oppure da un repairedClaim derivato da uno dei claim coinvolti;
- non dichiarare RESOLVED_BY_REPAIR se rimuovi una distinzione che le evidenze originali supportano;
- se il claim sorgente contiene piu' fatti supportati da oltre quattro evidence ID, dividilo in piu' repairedClaims;
- usa al massimo 4 evidenceIds per repairedClaim e solo evidenze originali che supportano direttamente lo statement.

Status Anti-Bias:
- REJECTED: la challenge e' errata;
- RESOLVED_BY_REPAIR: la challenge era valida e il repair ne preserva/copre le evidenze;
- UPHELD: resta un problema bloccante;
- UNRESOLVED: non puoi decidere in modo affidabile.

Scegli answerOptionId dalla descrizione testuale dell'opzione e preservane le distinzioni supportate dalle evidenze.
Non autorizzare training o azioni. Restituisci esclusivamente il JSON richiesto.
"""

INTEGRATOR_SYSTEM="""Sei l'integratore finale della rete FAME Neural V6.
Usa soltanto supportedClaims e repairedClaims del Verifier.
Non usare i claim originali in unsupportedClaims o claimsNeedingRework.
Ogni issue Anti-Bias BLOCKING deve essere REJECTED oppure RESOLVED_BY_REPAIR.
Preserva tutte le distinzioni sostenute dai claim utilizzabili e non aggiungere fatti esterni.
Scegli answerOptionId dalla descrizione testuale dell'opzione.
Non dichiarare il sistema unbiased e non autorizzare training/esecuzioni.
Restituisci esclusivamente il JSON richiesto.
"""


def code_hashes():
    names=('fame_four_role_network_v6.py','fame_four_role_network_v5.py',
           'fame_four_role_network_v4.py','fame_anti_bias.py','agent.py')
    return {name:hashlib.sha256((BASE/name).read_bytes()).hexdigest() for name in names}


def package(case_id):
    return v5.package(case_id)


def public_case(p):
    return v5.public_case(p)


def host_rubric(p):
    return v5.host_rubric(p)


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
    print('Rete FAME v6 creata; nessuna chiamata al modello: '+str(root))


def verify(root):
    config=agent.read(agent.safe_path(root,'network.json'))
    p=package(config.get('caseId'))
    if config!=metadata(p):
        raise ValueError('Protocollo o codice rete V6 cambiato dopo init')
    if agent.read(agent.safe_path(root,'case-public.json'))!=public_case(p):
        raise ValueError('Case pubblico V6 modificato')
    if agent.read(agent.safe_path(root,'host-rubric.json'))!=host_rubric(p):
        raise ValueError('Rubrica host V6 modificata')
    return p


def verifier_schema(p,extractor,challenge):
    return v5.verifier_schema(p,extractor,challenge)


def _usable_evidence_by_source(answer):
    by_source={}
    for row in answer.get('supportedClaims',[]):
        if type(row) is dict and isinstance(row.get('claimId'),str):
            by_source.setdefault(row['claimId'],set()).update(row.get('evidenceIds',[]))
    for row in answer.get('repairedClaims',[]):
        if type(row) is dict and isinstance(row.get('sourceClaimId'),str):
            by_source.setdefault(row['sourceClaimId'],set()).update(row.get('evidenceIds',[]))
    return by_source


def _all_usable_evidence(answer):
    evidence=set()
    for row in answer.get('supportedClaims',[]):
        if type(row) is dict:
            evidence.update(row.get('evidenceIds',[]))
    for row in answer.get('repairedClaims',[]):
        if type(row) is dict:
            evidence.update(row.get('evidenceIds',[]))
    return evidence


def validate_verifier(answer,p,extractor,challenge):
    errors=list(v5.validate_verifier(answer,p,extractor,challenge))
    if type(answer) is not dict:
        return sorted(set(errors))

    by_source=_usable_evidence_by_source(answer)
    issue_by_id={row['issueId']:row for row in challenge.get('issues',[]) if type(row) is dict and row.get('issueId')}
    for resolution in answer.get('antiBiasResolution',[]):
        if type(resolution) is not dict or resolution.get('status')!='RESOLVED_BY_REPAIR':
            continue
        issue=issue_by_id.get(resolution.get('issueId'))
        if not issue:
            continue
        involved=[cid for cid in issue.get('claimIds',[]) if isinstance(cid,str)]
        covered=set()
        for cid in involved:
            covered.update(by_source.get(cid,set()))
        required={eid for eid in issue.get('evidenceIds',[]) if isinstance(eid,str)}
        if not required.issubset(covered):
            errors.append('VERIFIER_REPAIR_MISSING_ISSUE_EVIDENCE')

    if answer.get('answerOptionId')==p.get('expectedAnswerOptionId'):
        selected=_all_usable_evidence(answer)
        for group in p.get('requiredFinalEvidenceGroups',[]):
            if not any(eid in selected for eid in group):
                errors.append('VERIFIER_INSUFFICIENT_FINAL_EVIDENCE_AFTER_REPAIR')
                break

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
    return v5.usable_claim_map(verifier)


def integrator_schema(p,verifier):
    return v5.integrator_schema(p,verifier)


def validate_integrator(answer,p,extractor,challenge,verifier):
    return v5.validate_integrator(answer,p,extractor,challenge,verifier)


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
    rows['integrator']=v4.read_role(root,'integrator',int_req,
        lambda a:validate_integrator(a,p,extractor,challenge,verifier))
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
        f.write('FAME four-role network v6 attiva\n')
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
            print('[1/4] Extractor V6: attesa Ollama...',flush=True)
            ext=v4.execute_role(root,'extractor',v4.extractor_request(p),lambda a:v4.validate_extractor(a,p),client)
        if ext['status']!='ACCEPTED': return emit_status(root)
        extractor=ext['output']

        ab=status(root)['roles']['anti-bias']
        if ab['status']=='PENDING':
            print('[2/4] Anti-Bias indipendente V6: attesa Ollama...',flush=True)
            req=v4.antibias_request(p,extractor)
            ab=v4.execute_role(root,'anti-bias',req,lambda a:anti_bias.validate(a,extractor['claims'],p['units']),client)
        if ab['status']!='ACCEPTED': return emit_status(root)
        challenge=ab['output']

        ver=status(root)['roles']['verifier']
        if ver['status']=='PENDING':
            print('[3/4] Verifier V6 + evidence-preserving repair: attesa Ollama...',flush=True)
            req=verifier_request(p,extractor,challenge)
            ver=v4.execute_role(root,'verifier',req,lambda a:validate_verifier(a,p,extractor,challenge),client)
        if ver['status']!='ACCEPTED': return emit_status(root)
        verifier=ver['output']

        integ=status(root)['roles']['integrator']
        if integ['status']=='PENDING':
            print('[4/4] Integrator V6: attesa Ollama...',flush=True)
            req=integrator_request(p,extractor,challenge,verifier)
            integ=v4.execute_role(root,'integrator',req,
                lambda a:validate_integrator(a,p,extractor,challenge,verifier),client)

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
