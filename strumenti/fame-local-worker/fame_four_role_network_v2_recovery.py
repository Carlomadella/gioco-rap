"""Bounded transport recovery for the first FAME four-role network v2 pilot.

Reuses ACCEPTED Extractor and Anti-Bias outputs from a preserved failed v2 root.
Executes at most Verifier + Integrator with the repaired zero-issue schema.
"""
import argparse
import hashlib
import json
import time
from pathlib import Path

import agent
import fame_anti_bias as anti_bias
import fame_four_role_network_v2 as network

VERSION='fame-four-role-network-v2-transport-recovery-v1'
SOURCE_SCHEMA='fame-four-role-network-v2'
EXPECTED_CASE='agent-network-readiness-network-v2'
MAX_MODEL_CALLS=2


def sha(path):
    return agent.sha(path)


def code_hashes():
    base=Path(__file__).resolve().parent
    names=('fame_four_role_network_v2_recovery.py','fame_four_role_network_v2.py','fame_anti_bias.py','agent.py')
    return {name:hashlib.sha256((base/name).read_bytes()).hexdigest() for name in names}


def verify_source_attempt(source_root,role):
    out=source_root/'roles'/role/'attempt-1'
    if not out.is_dir():
        raise ValueError('Attempt sorgente mancante: '+role)
    if not network.verify_receipt(out):
        raise ValueError('Receipt sorgente mancante: '+role)
    result=agent.read(out/'result.json')
    return out,result


def load_source(source_root):
    source_root=source_root.resolve()
    config=agent.read(agent.safe_path(source_root,'network.json'))
    if config.get('schema')!=SOURCE_SCHEMA:
        raise ValueError('Schema sorgente non è il pilot v2 atteso')
    if config.get('caseId')!=EXPECTED_CASE:
        raise ValueError('Case sorgente diverso dal pilot v2 atteso')
    if config.get('humanReviewRequired') is not True:
        raise ValueError('humanReviewRequired sorgente non valido')
    for key in ('executionAuthorized','trainingAuthorized','networkProductionReady','independentEvaluation'):
        if config.get(key) is not False:
            raise ValueError('Flag sorgente non sicuro: '+key)

    p=network.package(EXPECTED_CASE)
    if agent.read(agent.safe_path(source_root,'case-public.json'))!=network.public_case(p):
        raise ValueError('Case pubblico sorgente non conforme')
    if agent.read(agent.safe_path(source_root,'host-rubric.json'))!=network.host_rubric(p):
        raise ValueError('Rubrica host sorgente non conforme')

    ext_out,ext_result=verify_source_attempt(source_root,'extractor')
    if ext_result.get('status')!='ACCEPTED' or network.validate_extractor(ext_result.get('output'),p):
        raise ValueError('Extractor sorgente non riutilizzabile')
    extractor=ext_result['output']

    ab_out,ab_result=verify_source_attempt(source_root,'anti-bias')
    if ab_result.get('status')!='ACCEPTED':
        raise ValueError('Anti-Bias sorgente non accettato')
    challenge=ab_result.get('output')
    if anti_bias.validate(challenge,extractor['claims'],p['units']):
        raise ValueError('Anti-Bias sorgente non riutilizzabile')

    ver_out,ver_result=verify_source_attempt(source_root,'verifier')
    if ver_result.get('status')!='ERROR':
        raise ValueError('Verifier sorgente non è un errore di trasporto')
    errors=ver_result.get('errors')
    if type(errors) is not list or not any('HTTP Error 400' in str(x) for x in errors):
        raise ValueError('Errore Verifier sorgente diverso dal 400 atteso')
    if (ver_out/'response.json').exists():
        raise ValueError('Il Verifier sorgente ha una response: recovery non ammesso')
    old_request=agent.read(ver_out/'request.json')
    old_schema=old_request.get('format',{})
    try:
        issue_enum=old_schema['properties']['antiBiasResolution']['items']['properties']['issueId']['enum']
    except Exception as exc:
        raise ValueError('Schema Verifier sorgente non corrisponde al bug noto') from exc
    if issue_enum!=[]:
        raise ValueError('Il Verifier sorgente non contiene enum vuoto')

    return {
        'sourceRoot':str(source_root),
        'case':p,
        'extractor':extractor,
        'antiBias':challenge,
        'sourceHashes':{
            'network.json':sha(source_root/'network.json'),
            'case-public.json':sha(source_root/'case-public.json'),
            'host-rubric.json':sha(source_root/'host-rubric.json'),
            'extractor.receipt.json':sha(ext_out/'receipt.json'),
            'anti-bias.receipt.json':sha(ab_out/'receipt.json'),
            'verifier.receipt.json':sha(ver_out/'receipt.json'),
        },
    }


def metadata(source):
    return {
        'schema':VERSION,
        'sourceSchema':SOURCE_SCHEMA,
        'sourceRoot':source['sourceRoot'],
        'caseId':source['case']['caseId'],
        'sourceHashes':source['sourceHashes'],
        'codeHashes':code_hashes(),
        'model':network.MODEL,
        'modelDigest':network.DIGEST,
        'options':network.OPTIONS,
        'maximumModelCalls':MAX_MODEL_CALLS,
        'retries':0,
        'humanReviewRequired':True,
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }


def init(root,source_root):
    source=load_source(source_root)
    root=root.resolve()
    root.mkdir(parents=True,exist_ok=False)
    (root/'roles').mkdir()
    (root/'sessions').mkdir()
    for role in ('verifier','integrator'):
        (root/'roles'/role).mkdir()
    agent.write(root/'recovery.json',metadata(source))
    agent.write(root/'case-public.json',network.public_case(source['case']))
    agent.write(root/'host-rubric.json',network.host_rubric(source['case']))
    agent.write(root/'source-extractor.json',source['extractor'])
    agent.write(root/'source-anti-bias.json',source['antiBias'])
    print('Recovery V2 creato; riusa Extractor + Anti-Bias senza nuove chiamate: '+str(root))


def verify(root):
    root=root.resolve()
    config=agent.read(agent.safe_path(root,'recovery.json'))
    if config.get('schema')!=VERSION or config.get('caseId')!=EXPECTED_CASE:
        raise ValueError('Recovery metadata invalido')
    if config.get('codeHashes')!=code_hashes():
        raise ValueError('Codice recovery cambiato dopo init')
    p=network.package(EXPECTED_CASE)
    if agent.read(agent.safe_path(root,'case-public.json'))!=network.public_case(p):
        raise ValueError('Case recovery modificato')
    if agent.read(agent.safe_path(root,'host-rubric.json'))!=network.host_rubric(p):
        raise ValueError('Rubrica recovery modificata')
    extractor=agent.read(agent.safe_path(root,'source-extractor.json'))
    challenge=agent.read(agent.safe_path(root,'source-anti-bias.json'))
    if network.validate_extractor(extractor,p):
        raise ValueError('Extractor congelato non valido')
    if anti_bias.validate(challenge,extractor['claims'],p['units']):
        raise ValueError('Anti-Bias congelato non valido')
    return p,extractor,challenge


def read_role(root,role,request,validator):
    out=root/'roles'/role/'attempt-1'
    if not out.exists():
        return {'status':'PENDING'}
    if not network.verify_receipt(out):
        return {'status':'INTERRUPTED'}
    saved=agent.read(out/'result.json')
    response_path=out/'response.json'
    if not response_path.exists():
        return saved
    if agent.read(out/'request.json')!=request:
        raise ValueError('Request recovery storica non conforme: '+role)
    expected=network.expected_core(role,agent.read(response_path),validator)
    for key,value in expected.items():
        if saved.get(key)!=value:
            raise ValueError('Risultato recovery non riproducibile: '+role+'/'+key)
    return saved


def status(root):
    p,extractor,challenge=verify(root)
    vreq=network.verifier_request(p,extractor,challenge)
    verifier=read_role(
        root,'verifier',vreq,
        lambda a:network.validate_verifier(a,p,extractor,challenge)
    )
    integrator={'status':'PENDING'}
    if verifier.get('status')=='ACCEPTED':
        ireq=network.integrator_request(p,extractor,challenge,verifier['output'])
        integrator=read_role(
            root,'integrator',ireq,
            lambda a:network.validate_integrator(a,p,extractor,challenge,verifier['output'])
        )
    if verifier.get('status') in ('ERROR','REJECTED','INTERRUPTED'):
        overall='NEEDS_REVIEW'
    elif verifier.get('status')=='PENDING':
        overall='IN_PROGRESS'
    elif integrator.get('status')=='ACCEPTED':
        overall=network.FINAL_ACCEPTED
    elif integrator.get('status')=='PENDING':
        overall='IN_PROGRESS'
    else:
        overall='NEEDS_REVIEW'
    calls=sum(
        1 for role in ('verifier','integrator')
        if (root/'roles'/role/'attempt-1'/'response.json').exists()
    )
    return {
        'schema':VERSION,
        'caseId':p['caseId'],
        'status':overall,
        'reusedRoles':['extractor','anti-bias'],
        'roles':{'verifier':verifier,'integrator':integrator},
        'modelCalls':calls,
        'humanReviewRequired':True,
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }


def emit(root):
    value=status(root)
    print(json.dumps(value,ensure_ascii=False,indent=2))
    return value


def run(root,client=None):
    root=root.resolve()
    lock=agent.safe_path(root,'recovery.lock')
    with lock.open('x') as f:
        f.write('FAME four-role v2 transport recovery attiva\n')
    try:
        p,extractor,challenge=verify(root)
        current=status(root)
        if current['status']!='IN_PROGRESS':
            print(json.dumps(current,ensure_ascii=False,indent=2))
            return current

        client=client or agent.Ollama()
        session=root/'sessions'/str(int(time.time()*1000))
        session.mkdir()
        preflight=agent.preflight(client,network.MODEL)
        agent.write(session/'preflight.json',preflight)
        if preflight['model']['digest']!=network.DIGEST:
            raise ValueError('Digest modello diverso dal protocollo')

        vreq=network.verifier_request(p,extractor,challenge)
        verifier=read_role(
            root,'verifier',vreq,
            lambda a:network.validate_verifier(a,p,extractor,challenge)
        )
        if verifier['status']=='PENDING':
            print('[3/4 recovery] Verifier: attesa Ollama...',flush=True)
            verifier=network.execute_role(
                root,'verifier',vreq,
                lambda a:network.validate_verifier(a,p,extractor,challenge),
                client
            )
        if verifier['status']!='ACCEPTED':
            return emit(root)

        ireq=network.integrator_request(p,extractor,challenge,verifier['output'])
        integrator=read_role(
            root,'integrator',ireq,
            lambda a:network.validate_integrator(a,p,extractor,challenge,verifier['output'])
        )
        if integrator['status']=='PENDING':
            print('[4/4 recovery] Integrator: attesa Ollama...',flush=True)
            integrator=network.execute_role(
                root,'integrator',ireq,
                lambda a:network.validate_integrator(a,p,extractor,challenge,verifier['output']),
                client
            )

        final=status(root)
        agent.write(session/'summary.json',final)
        print(json.dumps(final,ensure_ascii=False,indent=2))
        return final
    finally:
        lock.unlink()


def parser():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('command',choices=('init','run','status'))
    p.add_argument('--root',required=True,type=Path)
    p.add_argument('--source-root',type=Path)
    return p


def main():
    p=parser()
    args=p.parse_args()
    try:
        if args.command=='init':
            if args.source_root is None:
                raise ValueError('--source-root richiesto per init')
            init(args.root,args.source_root)
        elif args.command=='status':
            print(json.dumps(status(args.root.resolve()),ensure_ascii=False,indent=2))
        else:
            result=run(args.root)
            raise SystemExit(0 if result['status']==network.FINAL_ACCEPTED else 1)
    except (ValueError,OSError,KeyError) as exc:
        p.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__':
    main()
