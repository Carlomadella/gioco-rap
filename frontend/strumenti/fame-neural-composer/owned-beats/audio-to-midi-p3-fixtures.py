#!/usr/bin/env python3
"""Prepare and hash-freeze deterministic P3 controlled fixtures."""
import argparse, hashlib, json, shutil, tempfile, uuid
from pathlib import Path
from audio_to_midi_p3_synth import build_fixture, write_wav

HERE=Path(__file__).resolve().parent
PROTOCOL_FILE=HERE/'audio-to-midi-p3-controlled-fixtures-v1.json'
RUN_ID='audio-to-midi-p3-fixtures-v1'
SCHEMA='fame-owned-beats-audio-to-midi-p3-controlled-fixture-manifest-v1'

def stable_json(v): return json.dumps(v,ensure_ascii=False,indent=2,separators=(',',': '))+'\n'
def read_json(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha256_file(p):
    h=hashlib.sha256()
    with Path(p).open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()

def validate_protocol(p):
    if p.get('schema')!='fame-owned-beats-audio-to-midi-p3-controlled-fixtures-v1' or p.get('version')!=1: raise RuntimeError('Unsupported P3 fixture protocol')
    if p.get('status')!='FROZEN_BEFORE_FIRST_P3_FIXTURE_BASELINE_RUN': raise RuntimeError('P3 fixture protocol is not frozen')
    fixtures=p.get('fixtures')
    if not isinstance(fixtures,list) or len(fixtures)!=12 or len({x.get('id') for x in fixtures})!=12: raise RuntimeError('Expected 12 unique P3 fixtures')
    if p.get('safety',{}).get('freshOwnedBeatFamiliesConsumed')!=0: raise RuntimeError('P3 controlled stage must consume zero fresh owned beats')
    return p

def output_root(workspace): return Path(workspace).resolve()/'runs'/'audio-to-midi-p3-controlled-fixtures'/RUN_ID

def validate_existing(root,manifest):
    if manifest.get('schema')!=SCHEMA or manifest.get('version')!=1 or manifest.get('runId')!=RUN_ID or manifest.get('records')!=12: raise RuntimeError('Existing P3 fixture manifest mismatch')
    for row in manifest.get('fixtures',[]):
        for name,info in row['files'].items():
            file=root/info['relativePath']
            if not file.is_file() or sha256_file(file)!=info['sha256']: raise RuntimeError(f"Existing fixture mismatch: {row['fixtureId']}/{name}")
    return True

def prepare(workspace):
    protocol=validate_protocol(read_json(PROTOCOL_FILE)); root=output_root(workspace); manifest_file=root/'fixture-manifest.json'
    if manifest_file.exists():
        manifest=read_json(manifest_file); validate_existing(root,manifest)
        return {'mode':'FAME_NEURAL_P3_CONTROLLED_FIXTURES_ALREADY_PREPARED','runId':RUN_ID,'records':12,'manifestSha256':sha256_file(manifest_file),'freshOwnedBeatFamiliesConsumed':0,'sourceSeparationExecutedByThisCommand':False,'transcriptionExecutedByThisCommand':False,'nextAction':'RUN_FROZEN_BASELINE_ON_PREPARED_CONTROLLED_FIXTURES'}
    if root.exists(): raise RuntimeError(f'Partial P3 fixture root exists without manifest: {root}')
    root.parent.mkdir(parents=True,exist_ok=True); temp=root.parent/f'.{RUN_ID}.tmp-{uuid.uuid4().hex}'; temp.mkdir(); rows=[]
    try:
        for fixture in protocol['fixtures']:
            d=temp/fixture['id']; d.mkdir(); drums,bass,mix,ref=build_fixture(fixture,protocol['audio'])
            files={'drums':d/'drums.wav','bass':d/'bass.wav','mix':d/'mix.wav','annotation':d/'reference.json'}
            sr=int(protocol['audio']['sampleRate']); write_wav(files['drums'],drums,sr); write_wav(files['bass'],bass,sr); write_wav(files['mix'],mix,sr); files['annotation'].write_text(stable_json(ref),encoding='utf-8')
            rows.append({'fixtureId':fixture['id'],'domain':fixture['domain'],'factor':fixture['factor'],'files':{k:{'relativePath':str(v.relative_to(temp)).replace('\\','/'),'sha256':sha256_file(v),'bytes':v.stat().st_size} for k,v in files.items()}})
        manifest={'schema':SCHEMA,'version':1,'status':'PREPARED_AND_HASH_FROZEN_BEFORE_BASELINE','runId':RUN_ID,'protocolSha256':sha256_file(PROTOCOL_FILE),'generatorFiles':{'orchestratorSha256':sha256_file(__file__),'synthHelperSha256':sha256_file(HERE/'audio_to_midi_p3_synth.py')},'records':len(rows),'fixtures':rows,'safety':{'freshOwnedBeatFamiliesConsumed':0,'sourceSeparationExecuted':False,'transcriptionExecuted':False,'trainingAuthorized':False,'batch131Authorized':False,'taskDataReadyMayBeDeclared':False}}
        (temp/'fixture-manifest.json').write_text(stable_json(manifest),encoding='utf-8'); temp.rename(root)
    except Exception:
        shutil.rmtree(temp,ignore_errors=True); raise
    return {'mode':'FAME_NEURAL_P3_CONTROLLED_FIXTURES_PREPARED','runId':RUN_ID,'records':12,'manifestSha256':sha256_file(root/'fixture-manifest.json'),'freshOwnedBeatFamiliesConsumed':0,'sourceSeparationExecutedByThisCommand':False,'transcriptionExecutedByThisCommand':False,'nextAction':'RUN_FROZEN_BASELINE_ON_PREPARED_CONTROLLED_FIXTURES'}

def self_test():
    p=validate_protocol(read_json(PROTOCOL_FILE)); kick=next(x for x in p['fixtures'] if x['id']=='D01_KICK_ISOLATED'); drums,bass,mix,ref=build_fixture(kick,p['audio'])
    if len(drums)!=88200 or len(bass)!=88200 or len(mix)!=88200 or len(ref['drumEvents'])!=4 or max(abs(x) for x in drums)<=0: raise RuntimeError('Fixture synth self-test failed')
    with tempfile.TemporaryDirectory(prefix='fame-p3-fixture-test-') as tmp:
        first=prepare(tmp); second=prepare(tmp)
        if first['records']!=12 or second['mode']!='FAME_NEURAL_P3_CONTROLLED_FIXTURES_ALREADY_PREPARED': raise RuntimeError('Fixture prepare self-test failed')
    return {'mode':'FAME_NEURAL_P3_CONTROLLED_FIXTURE_SELF_TEST_PASS','fixtures':12,'durationSeconds':p['audio']['durationSeconds'],'sampleRate':p['audio']['sampleRate'],'freshOwnedBeatFamiliesConsumed':0}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('command',choices=['self-test','prepare']); ap.add_argument('workspace',nargs='?'); a=ap.parse_args()
    if a.command=='self-test': result=self_test()
    else:
        if not a.workspace: raise RuntimeError('prepare requires workspace')
        result=prepare(a.workspace)
    print(stable_json(result),end='')
if __name__=='__main__': main()
