"""Freeze/provenance validation helpers for P3 controlled Audio-to-MIDI."""
import hashlib, importlib.util, json, sys
from pathlib import Path
import librosa

HERE=Path(__file__).resolve().parent
FIXTURE_PROTOCOL_FILE=HERE/"audio-to-midi-p3-controlled-fixtures-v1.json"
FIXTURE_GENERATOR_FILE=HERE/"audio-to-midi-p3-fixtures.py"
SYNTH_HELPER_FILE=HERE/"audio_to_midi_p3_synth.py"
DEV_PROTOCOL_FILE=HERE/"audio-to-midi-development-protocol-v1.json"
BASELINE_FILE=HERE/"audio-to-midi-development-baseline.py"
FIXTURE_RUN_ID="audio-to-midi-p3-fixtures-v1"
RUN_ID="audio-to-midi-p3-controlled-baseline-v1-001"

def stable_json(v): return json.dumps(v,ensure_ascii=False,indent=2,separators=(",",": "))+"\n"
def read_json(p): return json.loads(Path(p).read_text(encoding="utf-8-sig"))

def sha256_file(p):
    h=hashlib.sha256()
    with Path(p).open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""): h.update(chunk)
    return h.hexdigest()

def git_blob_sha1(p):
    data=Path(p).read_bytes().replace(b"\r\n",b"\n")
    return hashlib.sha1(b"blob "+str(len(data)).encode("ascii")+b"\0"+data).hexdigest()

def load_module(p,name):
    spec=importlib.util.spec_from_file_location(name,p)
    if spec is None or spec.loader is None: raise RuntimeError(f"Cannot load module: {p}")
    module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module); return module

def validate_environment_and_frozen_baseline(dev):
    expected=dev.get("implementation",{}).get("baselineGitBlobSha1"); actual=git_blob_sha1(BASELINE_FILE)
    if not expected or actual!=expected: raise RuntimeError(f"Frozen baseline Git blob mismatch: {actual} != {expected}")
    required_py=str(dev["baselineEnvironment"]["python"])
    if f"{sys.version_info.major}.{sys.version_info.minor}"!=required_py: raise RuntimeError(f"P3 runner requires Python {required_py}.x, found {sys.version.split()[0]}")
    required_librosa=str(dev["baselineEnvironment"]["requiredLibrosa"])
    if librosa.__version__!=required_librosa: raise RuntimeError(f"P3 runner requires librosa {required_librosa}, found {librosa.__version__}")
    return actual

def fixture_root(workspace): return Path(workspace).resolve()/"runs"/"audio-to-midi-p3-controlled-fixtures"/FIXTURE_RUN_ID
def run_root(workspace): return Path(workspace).resolve()/"runs"/"audio-to-midi-p3-controlled-baseline"/RUN_ID

def validate_fixture_manifest(workspace,protocol):
    root=fixture_root(workspace); file=root/"fixture-manifest.json"
    if not file.is_file(): raise RuntimeError("P3 fixture manifest missing; run prepare first")
    m=read_json(file)
    if m.get("schema")!="fame-owned-beats-audio-to-midi-p3-controlled-fixture-manifest-v1" or m.get("runId")!=FIXTURE_RUN_ID or m.get("records")!=12 or m.get("status")!="PREPARED_AND_HASH_FROZEN_BEFORE_BASELINE": raise RuntimeError("P3 fixture manifest freeze mismatch")
    if m.get("protocolSha256")!=sha256_file(FIXTURE_PROTOCOL_FILE): raise RuntimeError("P3 fixture protocol SHA mismatch")
    generators=m.get("generatorFiles",{})
    if generators.get("orchestratorSha256")!=sha256_file(FIXTURE_GENERATOR_FILE) or generators.get("synthHelperSha256")!=sha256_file(SYNTH_HELPER_FILE): raise RuntimeError("P3 fixture generator SHA mismatch")
    by_id={x["fixtureId"]:x for x in m["fixtures"]}; expected=[x["id"] for x in protocol["fixtures"]]
    if list(by_id)!=expected: raise RuntimeError("P3 fixture identity/order mismatch")
    for row in m["fixtures"]:
        for info in row["files"].values():
            target=root/info["relativePath"]
            if not target.is_file() or sha256_file(target)!=info["sha256"]: raise RuntimeError(f"P3 fixture hash mismatch: {row['fixtureId']}/{info['relativePath']}")
    return root,m,by_id
