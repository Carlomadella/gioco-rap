"""Bounded V3 continuation after the preserved V2 transport + semantic failures.

Reuses only ACCEPTED Extractor and Anti-Bias outputs from the original V2 root.
Requires evidence of the rejected V2 recovery verifier before starting.
Executes at most the V3 Verifier + Integrator.
"""
import argparse
import hashlib
import json
import time
from pathlib import Path

import agent
import fame_anti_bias as anti_bias
import fame_four_role_network_v3 as network

VERSION='fame-four-role-network-v3-continuation-v1'
SOURCE_SCHEMA='fame-four-role-network-v2'
SOURCE_CASE='agent-network-readiness-network-v2'
TARGET_CASE='agent-network-readiness-network-v3'
FAILED_RECOVERY_SCHEMA='fame-four-role-network-v2-transport-recovery-v1'
MAX_MODEL_CALLS=2


def code_hashes():
    base=Path(__file__).resolve().parent
    names=('fame_four_role_network_v3_continuation.py','fame_four_role_network_v3.py','fame_anti_bias.py','agent.py')
    return {name:hashlib.sha256((base/name).read_bytes()).hexdigest() for name in names}


def verify_receipt(out):
    path=out/'receipt.json'
    if not path.is_file():
        raise ValueError('Receipt mancante: '+str(out))
    saved=agent.read(path).get('hashes',{})
    current={f.name for f in out.iterdir() if f.is_file() and f.name!='receipt.json'}
    if set(saved)!=current:
        raise ValueError('Artefatti diversi dalla receipt: '+str(out))
    for name,value in saved.items():
        if agent.sha(out/name)!=value:
            raise ValueError('Artefatto modificato: '+str(out/name))


def source_role(source_root,role):
    out=source_root/'roles'/role/'attempt-1'
    if not out.is_dir():
        raise ValueError('Ruolo sorgente mancante: '+role)
    verify_receipt(out)
    return out,agent.read(out/'result.json')


def same_source_case(source_case,target):
    keys=('sourceCommit','sourcePath','question','units')
    return all(source_case.get(k)==target.get(k) for k in keys)


def load_chain(source_root,failed_recovery_root):
    source_root=source_root.resolve()
    failed_recovery_root=failed_recovery_root.resolve()
    p=network.package(TARGET_CASE)

    config=agent.read(agent.safe_path(source_root,'network.json'))
    if config.get('schema')!=SOURCE_SCHEMA or config.get('caseId')!=SOURCE_CASE:
        raise ValueError('Root V2 sorgente non riconosciuta')
    for key in ('executionAuthorized','trainingAuthorized','networkProductionReady','independentEvaluation'):
        if config.get(key) is not False:
            raise ValueError('Flag sorgente non sicuro: '+key)
    if config.get('humanReviewRequired') is not True:
        raise ValueError('humanReviewRequired sorgente non valido')

    source_case=agent.read(agent.safe_path(source_root,'case-public.json'))
    if not same_source_case(source_case,p):
        raise ValueError('Il case V2 e il target V3 non condividono la stessa sorgente/domanda/unità')

    ext_out,ext=source_role(source_root,'extractor')
    if ext.get('status')!='ACCEPTED':
        raise ValueError('Extractor V2 non accettato')
    extractor=ext.get('output')
    if network.validate_extractor(extractor,p):
        raise ValueError('Extractor V2 incompatibile con V3')

    ab_out,ab=source_role(source_root,'anti-bias')
    if ab.get('status')!='ACCEPTED':
        raise ValueError('Anti-Bias V2 non accettato')
    challenge=ab.get('output')
    if anti_bias.validate(challenge,extractor['claims'],p['units']):
        raise ValueError('Anti-Bias V2 incompatibile con V3')

    recovery=agent.read(agent.safe_path(failed_recovery_root,'recovery.json'))
    if recovery.get('schema')!=FAILED_RECOVERY_SCHEMA or recovery.get('caseId')!=SOURCE_CASE:
        raise ValueError('Recovery V2 fallito non riconosciuto')
    if Path(recovery.get('sourceRoot','')).resolve()!=source_root:
        raise ValueError('Il recovery V2 non deriva dalla root sorgente indicata')
    for key in ('executionAuthorized','trainingAuthorized','networkProductionReady','independentEvaluation'):
        if recovery.get(key) is not False:
            raise ValueError('Flag recovery V2 non sicuro: '+key)
    if recovery.get('humanReviewRequired') is not True:
        raise ValueError('humanReviewRequired recovery V2 non valido')

    ver_out=failed_recovery_root/'roles'/'verifier'/'attempt-1'
    verify_receipt(ver_out)
    ver=agent.read(ver_out/'result.json')
    if ver.get('status')!='REJECTED':
        raise ValueError('Verifier recovery V2 non è REJECTED')
    errors=ver.get('errors')
    if type(errors) is not list or 'VERIFIER_NONSUPPORTED_WITH_EVIDENCE' not in errors:
        raise ValueError('Failure semantico V2 atteso non presente')
    if not (ver_out/'response.json').is_file():
        raise ValueError('Response semantica V2 mancante')

    return {
        'case':p,
        'extractor':extractor,
        'antiBias':challenge,
        'sourceRoot':str(source_root),
        'failedRecoveryRoot':str(failed_recovery_root),
        'sourceHashes':{
            'source.network.json':agent.sha(source_root/'network.json'),
            'source.extractor.receipt.json':agent.sha(ext_out/'receipt.json'),
            'source.anti-bias.receipt.json':agent.sha(ab_out/'receipt.json'),
            'failed-recovery.recovery.json':agent.sha(failed_recovery_root/'recovery.json'),
            'failed-recovery.verifier.receipt.json':agent.sha(ver_out/'receipt.json'),
        },
    }


def metadata(chain):
    return {
        'schema':VERSION,
        'sourceSchema':SOURCE_SCHEMA,
        'sourceCaseId':SOURCE_CASE,
        'targetCaseId':TARGET_CASE,
        'sourceRoot':chain['sourceRoot'],
        'failedRecoveryRoot':chain['failedRecoveryRoot'],
        'sourceHashes':chain['sourceHashes'],
        'codeHashes':code_hashes(),
        'model':network.MODEL,
        'modelDigest':network.DIGEST,
        'options':network.OPTIONS,
        'maximumModelCalls':MAX_MODEL_CALLS,
        'retries':0,
        'reusedRoles':['extractor','anti-bias'],
        'humanReviewRequired':True,
        'executionAuthorized':False,
        'trainingAuthorized':False,
        'networkProductionReady':False,
        'independentEvaluation':False,
    }


def init(root,source_root,failed_recovery_root):
    chain=load_chain(source_root,failed_recovery_root)
    root=root.resolve()
    root.mkdir(parents=True,exist_ok=False)
    (root/'roles').mkdir()
    (root/'sessions').mkdir()
    for role in ('verifier','integrator'):
        (root/'roles'/role).mkdir()
    agent.write(root/'continuation.json',metadata(chain))
    agent.write(root/'case-public.json',network.public_case(chain['case']))
    agent.write(root/'host-rubric.json',network.host_rubric(chain['case']))
    agent.write(root/'source-extractor.json',chain['extractor'])
    agent.write(root/'source-anti-bias.json',chain['antiBias'])
    print('Continuazione V3 creata; riusa Extractor + Anti-Bias V2: '+str(root))


def verify(root):
    root=root.resolve()
    meta=agent.read(agent.safe_path(root,'continuation.json'))
    if meta.get('schema')!=VERSION or meta.get('targetCaseId')!=TARGET_CASE:
        raise ValueError('Metadata continuazione V3 invalido')
    if meta.get('codeHashes')!=code_hashes():
        raise ValueError('Codice V3 cambiato dopo init')
    p=network.package(TARGET_CASE)
    if agent.read(agent.safe_path(root,'case-public.json'))!=network.public_case(p):
        raise ValueError('Case V3 modificato')
    if agent.read(agent.safe_path(root,'host-rubric.json'))!=network.host_rubric(p):
        raise ValueError('Rubrica host V3 modificata')
    extractor=agent.read(agent.safe_path(root,'source-extractor.json'))
    challenge=agent.read(agent.safe_path(root,'source-anti-bias.json'))
    if network.validate_extractor(extractor,p):
        raise ValueError('Extractor riusato non valido')
    if anti_bias.validate(challenge,extractor['claims'],p['units']):
        raise ValueError('Anti-Bias riusato non valido')
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
        raise ValueError('Request V3 storica non conforme: '+role)
    expected=network.expected_core(role,agent.read(response_path),validator)
    for key,value in expected.items():
        if saved.get(key)!=value:
            raise ValueError('Risultato V3 non riproducibile: '+role+'/'+key)
    return saved


def status(root):
    p,extractor,challenge=verify(root)
    vreq=network.verifier_request(p,extractor,challenge)
    verifier=read_role(root,'verifier',vreq,lambda a:network.validate_verifier(a,p,extractor,challenge))
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
        'caseId':TARGET_CASE,
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
    result=status(root)
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return result


def run(root,client=None):
    root=root.resolve()
    lock=agent.safe_path(root,'continuation.lock')
    with lock.open('x') as f:
        f.write('FAME four-role V3 continuation attiva\n')
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
        verifier=read_role(root,'verifier',vreq,lambda a:network.validate_verifier(a,p,extractor,challenge))
        if verifier['status']=='PENDING':
            print('[3/4 V3] Verifier: attesa Ollama...',flush=True)
            verifier=network.execute_role(
                root,'verifier',vreq,
                lambda a:network.validate_verifier(a,p,extractor,challenge),client
            )
        if verifier['status']!='ACCEPTED':
            return emit(root)

        ireq=network.integrator_request(p,extractor,challenge,verifier['output'])
        integrator=read_role(
            root,'integrator',ireq,
            lambda a:network.validate_integrator(a,p,extractor,challenge,verifier['output'])
        )
        if integrator['status']=='PENDING':
            print('[4/4 V3] Integrator: attesa Ollama...',flush=True)
            integrator=network.execute_role(
                root,'integrator',ireq,
                lambda a:network.validate_integrator(a,p,extractor,challenge,verifier['output']),client
            )

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
    p.add_argument('--source-root',type=Path)
    p.add_argument('--failed-recovery-root',type=Path)
    return p


def main():
    p=build_parser()
    args=p.parse_args()
    try:
        if args.command=='init':
            if args.source_root is None or args.failed_recovery_root is None:
                raise ValueError('--source-root e --failed-recovery-root richiesti per init')
            init(args.root,args.source_root,args.failed_recovery_root)
        elif args.command=='status':
            print(json.dumps(status(args.root.resolve()),ensure_ascii=False,indent=2))
        else:
            result=run(args.root)
            raise SystemExit(0 if result['status']==network.FINAL_ACCEPTED else 1)
    except (ValueError,OSError,KeyError) as exc:
        p.exit(2,f'ERRORE: {exc}\n')


if __name__=='__main__':
    main()
