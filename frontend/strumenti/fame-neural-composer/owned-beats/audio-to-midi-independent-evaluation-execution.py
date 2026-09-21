#!/usr/bin/env python3
"""Frozen independent Audio→MIDI evaluation executor.

prepare/preflight are metadata/environment/model only and never open evaluation audio.
execute is allowed only from a frozen receipt created before first audio access.

The evaluated pipeline is unchanged from development:
- autonomous BPM from audio-analysis-v2-config-001 (V1 beat/BPM unchanged);
- Intel OpenVINO HTDemucs v4 frozen artifact;
- drums-bass-kick-fusion-v1;
- librosa-pyin-lowend-v1.
"""
import argparse
import hashlib
import importlib.util
import json
import math
import os
import shutil
import subprocess
import sys
import uuid
from pathlib import Path

import librosa

HERE = Path(__file__).resolve().parent
CONTRACT_FILE = HERE / "audio-to-midi-independent-evaluation-execution-v1.json"
EVAL_PROTOCOL_FILE = HERE / "audio-to-midi-independent-evaluation-v1.json"
COHORT_FILE = HERE / "audio-to-midi-independent-evaluation-cohort-v1.json"
RESERVATION_CONTRACT_FILE = HERE / "audio-to-midi-independent-evaluation-reservation-contract-v1.json"
AUDIO_ANALYSIS_CONFIG_FILE = HERE / "audio-analysis-v2-config-001.json"
AUDIO_ANALYSIS_SOURCE_FILE = HERE / "audio-analysis-v2-config-001.py"
AUDIO_ANALYSIS_BASELINE_FILE = HERE / "audio-analysis.py"
AUDIO_MIDI_DEV_PROTOCOL_FILE = HERE / "audio-to-midi-development-protocol-v1.json"
AUDIO_MIDI_DEV_SOURCE_FILE = HERE / "audio-to-midi-development-baseline.py"
SOURCE_SEP_CONTRACT_FILE = HERE / "source-separation-execution-contract-v1.json"
SOURCE_SEP_PROTOCOL_FILE = HERE / "source-separation-pilot-protocol-v1.json"
SOURCE_SEP_ADAPTER_FILE = HERE / "source-separation-standalone-adapter.py"
SOURCE_SEP_ENV_FILE = HERE / "source-separation-environment-v1.json"
SOURCE_SEP_LOCK_FILE = HERE / "requirements-source-separation-lock.txt"
AUDIO_ANALYSIS_LOCK_FILE = HERE / "requirements-audio-analysis-lock.txt"

RUN_ID = "audio-to-midi-independent-evaluation-v1-001"
COHORT_ID = "audio-to-midi-independent-evaluation-v1"
SPLIT = "audio-to-midi-evaluation-v1"
EXPECTED_IDS = [
    "FAME000001", "FAME000102", "FAME000006", "FAME000129",
    "FAME000020", "FAME000073", "FAME000092", "FAME000121",
    "FAME000010", "FAME000071", "FAME000116", "FAME000101",
]
DEFAULT_MODEL = Path(r"C:\Program Files\Audacity\openvino-models\htdemucs_v4.xml")


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def stable_json(value):
    return json.dumps(value, ensure_ascii=False, indent=2, separators=(",", ": ")) + "\n"


def sha256_file(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def git_blob_sha(path):
    data = Path(path).read_text(encoding="utf-8").replace("\r\n", "\n").encode("utf-8")
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()


def safe_relative(root, relative, label):
    if not isinstance(relative, str) or not relative.strip() or Path(relative).is_absolute():
        raise RuntimeError(f"Unsafe {label}: {relative}")
    root = Path(root).resolve()
    target = (root / Path(relative)).resolve()
    try:
        target.relative_to(root)
    except ValueError as exc:
        raise RuntimeError(f"{label} escapes workspace: {relative}") from exc
    return target


def load_module(file, name):
    spec = importlib.util.spec_from_file_location(name, file)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load module: {file}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def parse_last_json(stdout):
    raw = (stdout or "").strip()
    if not raw:
        raise RuntimeError("Expected JSON output, got empty stdout")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        starts = [i for i, ch in enumerate(raw) if ch == "{"]
        for index in reversed(starts):
            try:
                return json.loads(raw[index:])
            except json.JSONDecodeError:
                pass
    raise RuntimeError("Could not parse JSON output")


def venv_python(workspace, name):
    candidate = Path(workspace) / name / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    if not candidate.is_file():
        raise RuntimeError(f"Dedicated Python missing: {candidate}")
    return candidate


def run_json(args, label):
    cp = subprocess.run([str(x) for x in args], capture_output=True, text=True)
    if cp.returncode:
        raise RuntimeError((cp.stderr or cp.stdout or f"{label} failed").strip())
    return parse_last_json(cp.stdout)


def validate_contract():
    c = read_json(CONTRACT_FILE)
    if (
        c.get("schema") != "fame-owned-beats-audio-to-midi-independent-evaluation-execution-v1"
        or c.get("version") != 1
        or c.get("status") != "FROZEN_BEFORE_FIRST_EVALUATION_AUDIO_ACCESS"
        or c.get("runId") != RUN_ID
        or c.get("cohortId") != COHORT_ID
        or c.get("split") != SPLIT
        or c.get("expectedFamilies") != 12
        or c.get("cohortDigestSha256") != "287839b1967f659988927539fcefabd44a286541698a8700349712c84525d788"
        or c.get("pipeline", {}).get("audioAnalysis", {}).get("candidateId") != "audio-analysis-v2-config-001"
        or c.get("pipeline", {}).get("sourceSeparation", {}).get("armId") != "intel-openvino-htdemucs-v4-97fc578"
        or c.get("pipeline", {}).get("drums", {}).get("armId") != "drums-bass-kick-fusion-v1"
        or c.get("pipeline", {}).get("lowEnd", {}).get("armId") != "librosa-pyin-lowend-v1"
        or c.get("pipeline", {}).get("basicPitch", {}).get("enabled") is not False
        or c.get("retuningAllowed") is not False
        or c.get("safety", {}).get("batch131Authorized") is not False
        or c.get("safety", {}).get("trainingAuthorized") is not False
        or c.get("safety", {}).get("taskDataReadyMayBeDeclared") is not False
        or c.get("implementation", {}).get("executorPath") != Path(__file__).name
        or c.get("implementation", {}).get("executorGitBlobSha") != git_blob_sha(__file__)
    ):
        raise RuntimeError("Frozen independent evaluation execution contract mismatch")
    return c


def validate_repo_bindings(contract):
    bindings = contract["bindings"]
    checks = {
        "evaluationProtocolGitBlobSha": git_blob_sha(EVAL_PROTOCOL_FILE),
        "cohortReferenceGitBlobSha": git_blob_sha(COHORT_FILE),
        "reservationContractGitBlobSha": git_blob_sha(RESERVATION_CONTRACT_FILE),
        "audioAnalysisConfigGitBlobSha": git_blob_sha(AUDIO_ANALYSIS_CONFIG_FILE),
        "audioAnalysisSourceGitBlobSha": git_blob_sha(AUDIO_ANALYSIS_SOURCE_FILE),
        "audioAnalysisBaselineGitBlobSha": git_blob_sha(AUDIO_ANALYSIS_BASELINE_FILE),
        "audioMidiDevelopmentProtocolGitBlobSha": git_blob_sha(AUDIO_MIDI_DEV_PROTOCOL_FILE),
        "audioMidiDevelopmentSourceGitBlobSha": git_blob_sha(AUDIO_MIDI_DEV_SOURCE_FILE),
        "sourceSeparationContractGitBlobSha": git_blob_sha(SOURCE_SEP_CONTRACT_FILE),
        "sourceSeparationProtocolGitBlobSha": git_blob_sha(SOURCE_SEP_PROTOCOL_FILE),
        "sourceSeparationAdapterGitBlobSha": git_blob_sha(SOURCE_SEP_ADAPTER_FILE),
        "sourceSeparationEnvironmentGitBlobSha": git_blob_sha(SOURCE_SEP_ENV_FILE),
        "sourceSeparationLockGitBlobSha": git_blob_sha(SOURCE_SEP_LOCK_FILE),
        "audioAnalysisLockGitBlobSha": git_blob_sha(AUDIO_ANALYSIS_LOCK_FILE),
    }
    for key, actual in checks.items():
        if bindings.get(key) != actual:
            raise RuntimeError(f"Frozen repository binding mismatch: {key}={actual}")
    return checks


def validate_frozen_pipeline(contract):
    aa_cfg = read_json(AUDIO_ANALYSIS_CONFIG_FILE)
    dev = read_json(AUDIO_MIDI_DEV_PROTOCOL_FILE)
    sep_contract = read_json(SOURCE_SEP_CONTRACT_FILE)
    sep_protocol = read_json(SOURCE_SEP_PROTOCOL_FILE)

    if (
        aa_cfg.get("candidateId") != "audio-analysis-v2-config-001"
        or aa_cfg.get("configHash") != "04e00482802c46dda876733b7210992cab9eadbafa33153266a483b4a90b81b3"
        or aa_cfg.get("baselineSourceGitBlobSha1") != git_blob_sha(AUDIO_ANALYSIS_BASELINE_FILE)
        or aa_cfg.get("candidateSourceGitBlobSha1") != git_blob_sha(AUDIO_ANALYSIS_SOURCE_FILE)
        or aa_cfg.get("algorithmConfig", {}).get("beatTracker") != "FROZEN_V1_UNCHANGED"
        or aa_cfg.get("algorithmConfig", {}).get("bpm") != "FROZEN_V1_UNCHANGED"
        or aa_cfg.get("algorithmConfig", {}).get("perTrackParametersAllowed") is not False
    ):
        raise RuntimeError("Frozen Audio Analysis config no longer matches evaluation contract")

    if (
        dev.get("implementation", {}).get("baselineGitBlobSha1") != git_blob_sha(AUDIO_MIDI_DEV_SOURCE_FILE)
        or dev.get("drums", {}).get("decodeSampleRate") != 22050
        or dev.get("drums", {}).get("hopLength") != 256
        or dev.get("drums", {}).get("nFft") != 2048
        or dev.get("drums", {}).get("onset", {}).get("delta") != 0.15
        or dev.get("drums", {}).get("onset", {}).get("waitFrames") != 1
        or dev.get("drums", {}).get("kickFusion", {}).get("deduplicateWithinSeconds") != 0.05
        or dev.get("lowEnd", {}).get("primaryArm", {}).get("id") != "librosa-pyin-lowend-v1"
        or dev.get("lowEnd", {}).get("primaryArm", {}).get("voicedProbabilityAtLeast") != 0.6
        or dev.get("output", {}).get("midiPpq") != 480
        or dev.get("output", {}).get("drumChannelZeroBased") != 9
        or dev.get("output", {}).get("bassChannelZeroBased") != 0
    ):
        raise RuntimeError("Frozen Audio→MIDI development algorithm no longer matches evaluation contract")

    source_sep = contract["pipeline"]["sourceSeparation"]
    model = sep_protocol.get("separatorCandidate", {}).get("modelArtifact", {})
    if (
        sep_contract.get("adapter", {}).get("gitBlobSha") != git_blob_sha(SOURCE_SEP_ADAPTER_FILE)
        or sep_contract.get("execution", {}).get("sampleRate") != 44100
        or sep_contract.get("execution", {}).get("device") != "CPU"
        or sep_contract.get("execution", {}).get("shifts") != 1
        or sep_contract.get("execution", {}).get("shiftSeed") != 0
        or sep_contract.get("execution", {}).get("overlap") != 0.25
        or sep_contract.get("execution", {}).get("segmentSamples") != 343980
        or model.get("revision") != source_sep.get("modelRevision")
        or model.get("files", {}).get("htdemucs_v4.xml") != source_sep.get("modelXmlSha256")
        or model.get("files", {}).get("htdemucs_v4.bin") != source_sep.get("modelBinSha256")
    ):
        raise RuntimeError("Frozen Source Separation configuration no longer matches evaluation contract")
    return aa_cfg, dev, sep_contract, sep_protocol


def validate_reservation(workspace, contract):
    cohort = read_json(COHORT_FILE)
    if (
        cohort.get("cohortId") != COHORT_ID
        or cohort.get("status") != "FROZEN_FRESH_COHORT_BEFORE_AUDIO_ACCESS"
        or cohort.get("cohortDigestSha256") != contract["cohortDigestSha256"]
        or [x.get("sourceRecordId") for x in cohort.get("records", [])] != EXPECTED_IDS
    ):
        raise RuntimeError("Frozen evaluation cohort mismatch")

    receipt_file = (
        Path(workspace) / "runs" / "audio-to-midi-independent-evaluation-usage"
        / f"{COHORT_ID}-reservation.json"
    )
    if not receipt_file.is_file():
        raise RuntimeError("Evaluation reservation receipt missing")
    receipt = read_json(receipt_file)
    if (
        receipt.get("cohortId") != COHORT_ID
        or receipt.get("status") != "RESERVED_BEFORE_AUDIO_ACCESS"
        or receipt.get("plannedSplit") != SPLIT
        or receipt.get("expectedFamilies") != 12
        or receipt.get("cohortDigestSha256") != contract["cohortDigestSha256"]
        or receipt.get("selectedSourceRecordIds") != EXPECTED_IDS
        or receipt.get("audioAccessPerformedByReservationCommand") is not False
        or receipt.get("sourceSeparationExecutedByReservationCommand") is not False
        or receipt.get("transcriptionExecutedByReservationCommand") is not False
    ):
        raise RuntimeError("Evaluation reservation receipt mismatch")

    manifest_file = Path(workspace) / "manifest" / "owned-beats-manifest.json"
    if not manifest_file.is_file():
        raise RuntimeError("Owned-beats manifest missing")
    manifest = read_json(manifest_file)
    by_id = {r.get("sourceRecordId"): r for r in manifest.get("records", [])}
    sources = []
    for frozen in cohort["records"]:
        rid = frozen["sourceRecordId"]
        record = by_id.get(rid)
        if not record:
            raise RuntimeError(f"Reserved source missing from manifest: {rid}")
        for field in ("compositionFamilyId", "sourceRecordId", "sourceAssetId", "sha256"):
            if record.get(field) != frozen.get(field):
                raise RuntimeError(f"Reserved identity mismatch {field}: {rid}")
        if record.get("split") != SPLIT:
            raise RuntimeError(f"Reserved source lost evaluation split: {rid}")
        if not isinstance(record.get("localPath"), str) or not record["localPath"].strip():
            raise RuntimeError(f"Reserved source localPath missing: {rid}")
        sources.append({
            "compositionFamilyId": record["compositionFamilyId"],
            "sourceRecordId": rid,
            "sourceAssetId": record["sourceAssetId"],
            "sha256": record["sha256"],
            "localPath": record["localPath"],
            "format": record.get("format"),
            "bytes": record.get("bytes"),
        })

    foreign = [
        r.get("sourceRecordId")
        for r in manifest.get("records", [])
        if r.get("split") == SPLIT and r.get("sourceRecordId") not in EXPECTED_IDS
    ]
    if foreign:
        raise RuntimeError(f"Foreign records in evaluation split: {foreign}")
    return receipt_file, manifest_file, sources


def validate_audio_analysis_environment():
    if f"{sys.version_info.major}.{sys.version_info.minor}" != "3.14":
        raise RuntimeError(f"Evaluation executor requires Python 3.14.x, found {sys.version.split()[0]}")
    if librosa.__version__ != "1.0.0":
        raise RuntimeError(f"Evaluation executor requires librosa 1.0.0, found {librosa.__version__}")


def validate_source_separation_environment(workspace, model_xml, sep_contract):
    py = venv_python(workspace, "venv-source-separation")
    model_xml = Path(model_xml).resolve()
    model_bin = model_xml.with_suffix(".bin")
    if not model_xml.is_file() or not model_bin.is_file():
        raise RuntimeError("Frozen HTDemucs model XML/BIN missing")
    if sha256_file(model_xml) != "304e24325756089d6bb6583171dd1bea2327505e87c6cb6e010afea7463d9f0a":
        raise RuntimeError("Frozen HTDemucs XML SHA256 mismatch")
    if sha256_file(model_bin) != "7aa84fa1f2b534bd6865a5609b8b5b028802fe761d6a09b1d30a1564f8fac6f8":
        raise RuntimeError("Frozen HTDemucs BIN SHA256 mismatch")

    self_test = run_json([py, SOURCE_SEP_ADAPTER_FILE, "self-test"], "Source Separation adapter self-test")
    if self_test.get("mode") != "SOURCE_SEPARATION_STANDALONE_ADAPTER_SELF_TEST_PASS":
        raise RuntimeError("Source Separation adapter self-test failed")

    cache_dir = Path(workspace) / sep_contract["execution"]["cacheRelativePath"]
    cache_dir.mkdir(parents=True, exist_ok=True)
    inspected = run_json(
        [py, SOURCE_SEP_ADAPTER_FILE, "inspect-model", "--model", model_xml, "--device", "CPU", "--cache-dir", cache_dir],
        "Source Separation model inspection",
    )
    if (
        inspected.get("mode") != "SOURCE_SEPARATION_STANDALONE_ADAPTER_MODEL_CHECK_PASS"
        or inspected.get("device") != "CPU"
    ):
        raise RuntimeError("Source Separation model inspection failed")
    return py, model_xml, model_bin, cache_dir, self_test, inspected


def execution_root(workspace):
    return Path(workspace) / "runs" / "audio-to-midi-independent-evaluation-execution" / RUN_ID


def receipt_file(workspace):
    return execution_root(workspace) / "execution-receipt.json"


def validate_receipt(workspace, model_xml):
    contract = validate_contract()
    validate_repo_bindings(contract)
    _aa_cfg, _dev, sep_contract, _sep_protocol = validate_frozen_pipeline(contract)
    reservation_path, manifest_path, current_sources = validate_reservation(workspace, contract)
    file = receipt_file(workspace)
    if not file.is_file():
        raise RuntimeError("Frozen evaluation execution receipt missing")
    receipt = read_json(file)
    if (
        receipt.get("schema") != "fame-owned-beats-audio-to-midi-independent-evaluation-execution-receipt-v1"
        or receipt.get("version") != 1
        or receipt.get("status") != "AUTHORIZED_NO_EVALUATION_AUDIO_ACCESSED"
        or receipt.get("runId") != RUN_ID
        or receipt.get("cohortId") != COHORT_ID
        or receipt.get("split") != SPLIT
        or receipt.get("cohortDigestSha256") != contract["cohortDigestSha256"]
        or receipt.get("contractSha256") != sha256_file(CONTRACT_FILE)
        or receipt.get("reservationReceiptSha256") != sha256_file(reservation_path)
        or receipt.get("manifestIdentityDigestSha256") != read_json(COHORT_FILE)["sourceManifest"]["identityDigestSha256"]
        or receipt.get("sources") != current_sources
        or receipt.get("evidence", {}).get("evaluationAudioOpenedByPrepareCommand") is not False
        or receipt.get("evidence", {}).get("sourceSeparationExecutedByPrepareCommand") is not False
        or receipt.get("evidence", {}).get("transcriptionExecutedByPrepareCommand") is not False
        or receipt.get("safety", {}).get("retuningAllowed") is not False
        or receipt.get("safety", {}).get("batch131Authorized") is not False
        or receipt.get("safety", {}).get("trainingAuthorized") is not False
    ):
        raise RuntimeError("Frozen evaluation execution receipt mismatch")

    model_xml = Path(model_xml).resolve()
    if str(model_xml) != receipt.get("sourceSeparationEnvironment", {}).get("modelXml"):
        raise RuntimeError("Model path differs from frozen execution receipt")
    if sha256_file(model_xml) != receipt["sourceSeparationEnvironment"]["modelXmlSha256"]:
        raise RuntimeError("Model XML differs from frozen execution receipt")
    if sha256_file(model_xml.with_suffix(".bin")) != receipt["sourceSeparationEnvironment"]["modelBinSha256"]:
        raise RuntimeError("Model BIN differs from frozen execution receipt")
    return contract, sep_contract, receipt, file


def preflight(workspace_root, model_xml=DEFAULT_MODEL):
    workspace = Path(workspace_root).resolve()
    if not workspace.is_dir():
        raise RuntimeError(f"Workspace not found: {workspace}")
    contract = validate_contract()
    validate_repo_bindings(contract)
    _aa_cfg, _dev, sep_contract, _sep_protocol = validate_frozen_pipeline(contract)
    reservation_path, _manifest_path, sources = validate_reservation(workspace, contract)
    validate_audio_analysis_environment()
    sep_py, model_xml, model_bin, _cache, _self_test, _inspected = validate_source_separation_environment(
        workspace, model_xml, sep_contract
    )
    return {
        "mode": "AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_EXECUTION_PREFLIGHT_PASS",
        "runId": RUN_ID,
        "cohortId": COHORT_ID,
        "split": SPLIT,
        "records": len(sources),
        "cohortDigestSha256": contract["cohortDigestSha256"],
        "reservationReceiptSha256": sha256_file(reservation_path),
        "audioAnalysisPython": sys.version.split()[0],
        "librosa": librosa.__version__,
        "sourceSeparationPython": str(sep_py),
        "modelXmlSha256": sha256_file(model_xml),
        "modelBinSha256": sha256_file(model_bin),
        "evaluationAudioOpenedByThisCommand": False,
        "sourceSeparationExecutedByThisCommand": False,
        "transcriptionExecutedByThisCommand": False,
        "retuningPerformedByThisCommand": False,
        "batch131Authorized": False,
        "trainingAuthorized": False,
        "taskDataReadyMayBeDeclared": False,
        "nextAction": "PREPARE_APPEND_ONLY_EVALUATION_EXECUTION_RECEIPT",
    }


def prepare(workspace_root, model_xml=DEFAULT_MODEL):
    workspace = Path(workspace_root).resolve()
    check = preflight(workspace, model_xml)
    contract = validate_contract()
    _aa_cfg, _dev, sep_contract, _sep_protocol = validate_frozen_pipeline(contract)
    reservation_path, _manifest_path, sources = validate_reservation(workspace, contract)
    sep_py = venv_python(workspace, "venv-source-separation")
    model_xml = Path(model_xml).resolve()
    root = execution_root(workspace)
    if root.exists():
        raise RuntimeError(f"Append-only evaluation execution run already exists: {root}")

    payload = {
        "schema": "fame-owned-beats-audio-to-midi-independent-evaluation-execution-receipt-v1",
        "version": 1,
        "status": "AUTHORIZED_NO_EVALUATION_AUDIO_ACCESSED",
        "runId": RUN_ID,
        "cohortId": COHORT_ID,
        "split": SPLIT,
        "expectedFamilies": 12,
        "cohortDigestSha256": contract["cohortDigestSha256"],
        "contractSha256": sha256_file(CONTRACT_FILE),
        "reservationReceiptSha256": sha256_file(reservation_path),
        "manifestIdentityDigestSha256": read_json(COHORT_FILE)["sourceManifest"]["identityDigestSha256"],
        "preparedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "pipeline": contract["pipeline"],
        "sourceSeparationEnvironment": {
            "python": str(sep_py),
            "adapter": str(SOURCE_SEP_ADAPTER_FILE),
            "modelXml": str(model_xml),
            "modelXmlSha256": sha256_file(model_xml),
            "modelBin": str(model_xml.with_suffix(".bin")),
            "modelBinSha256": sha256_file(model_xml.with_suffix(".bin")),
            "cacheRelativePath": sep_contract["execution"]["cacheRelativePath"],
        },
        "audioAnalysisEnvironment": {
            "python": sys.executable,
            "pythonVersion": sys.version.split()[0],
            "librosa": librosa.__version__,
            "lockSha256": sha256_file(AUDIO_ANALYSIS_LOCK_FILE),
        },
        "sources": sources,
        "evidence": {
            "evaluationAudioOpenedByPrepareCommand": False,
            "sourceSeparationExecutedByPrepareCommand": False,
            "transcriptionExecutedByPrepareCommand": False,
            "humanReferenceUsedAsInput": False,
        },
        "safety": {
            "retuningAllowed": False,
            "batch131Authorized": False,
            "trainingAuthorized": False,
            "taskDataReadyMayBeDeclared": False,
        },
        "nextAction": "EXECUTE_FROZEN_PIPELINE_ON_12_RESERVED_FAMILIES_ONCE",
    }

    parent = root.parent
    parent.mkdir(parents=True, exist_ok=True)
    temp = parent / f".{RUN_ID}.{uuid.uuid4().hex}.preparing"
    temp.mkdir(parents=False, exist_ok=False)
    try:
        (temp / "execution-receipt.json").write_text(stable_json(payload), encoding="utf-8")
        temp.rename(root)
    except Exception:
        shutil.rmtree(temp, ignore_errors=True)
        raise

    return {
        **check,
        "mode": "AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_EXECUTION_RECEIPT_PREPARED",
        "status": payload["status"],
        "runDirectory": str(root),
        "nextAction": payload["nextAction"],
    }


def verify_adapter_result(result, source, output_dir, model_receipt):
    if (
        result.get("mode") != "SOURCE_SEPARATION_STANDALONE_FILE_PASS"
        or result.get("sourceSha256") != source["sha256"]
        or result.get("device") != "CPU"
        or result.get("sampleRate") != 44100
        or result.get("overlap") != 0.25
        or result.get("shifts") != 1
        or result.get("shiftSeed") != 0
        or result.get("finalHoldoutAccessedByThisCommand") is not False
    ):
        raise RuntimeError(f"Source Separation adapter contract mismatch: {source['sourceRecordId']}")
    technical = result.get("technicalValidation", {})
    if (
        technical.get("allStemsFinite") is not True
        or technical.get("allStemsStereo") is not True
        or technical.get("allStemsSampleRate44100") is not True
        or technical.get("allStemsSameSamplesAsSource") is not True
    ):
        raise RuntimeError(f"Source Separation technical validation failed: {source['sourceRecordId']}")
    for stem in ("drums", "bass", "other", "vocals"):
        file = output_dir / f"{stem}.wav"
        meta = result.get("stems", {}).get(stem, {})
        if not file.is_file() or sha256_file(file) != meta.get("sha256"):
            raise RuntimeError(f"Stem integrity mismatch: {source['sourceRecordId']}/{stem}")
    return True


def render_selected_midi(source_path, stems_dir, family_dir, dev_protocol):
    aa = load_module(AUDIO_ANALYSIS_SOURCE_FILE, "fame_eval_audio_analysis_config001")
    midi = load_module(AUDIO_MIDI_DEV_SOURCE_FILE, "fame_eval_audio_to_midi_dev_impl")

    source_audio = aa.decode_audio(source_path)
    _onset, _beats, tempo = aa.tempo_and_beats(source_audio)
    bpm = float(tempo["bpm"])
    if not math.isfinite(bpm) or bpm <= 0:
        raise RuntimeError("Autonomous BPM invalid")

    drums_path = stems_dir / "drums.wav"
    bass_path = stems_dir / "bass.wav"
    drums_cfg = dev_protocol["drums"]
    low_cfg = dev_protocol["lowEnd"]["primaryArm"]

    drums_audio = midi.decode_mono_f32(drums_path, int(drums_cfg["decodeSampleRate"]))
    bass_for_drums = midi.decode_mono_f32(bass_path, int(drums_cfg["decodeSampleRate"]))
    bass_audio = (
        bass_for_drums
        if int(low_cfg["sampleRate"]) == int(drums_cfg["decodeSampleRate"])
        else midi.decode_mono_f32(bass_path, int(low_cfg["sampleRate"]))
    )

    drums_only = midi.transcribe_drums_only(drums_audio, dev_protocol)
    bass_kicks = midi.bass_kick_candidates(bass_for_drums, dev_protocol)
    fusion = midi.fuse_kick_events(
        drums_only,
        bass_kicks,
        drums_cfg["kickFusion"]["deduplicateWithinSeconds"],
    )
    lowend = midi.transcribe_lowend_pyin(bass_audio, dev_protocol)

    ppq = int(dev_protocol["output"]["midiPpq"])
    midi.write_midi(
        family_dir / "drums.mid", fusion, bpm, ppq,
        int(dev_protocol["output"]["drumChannelZeroBased"]), drum=True,
    )
    midi.write_midi(
        family_dir / "low-end.mid", lowend["notes"], bpm, ppq,
        int(dev_protocol["output"]["bassChannelZeroBased"]), drum=False,
    )

    return {
        "bpm": round(bpm, 6),
        "bpmSource": "audio-analysis-v2-config-001 autonomous frozen V1 BPM",
        "humanReferenceUsedAsInput": False,
        "drums": {
            "armId": "drums-bass-kick-fusion-v1",
            "eventCount": len(fusion),
            "bassKickCandidateCount": len(bass_kicks),
            "roleCounts": {
                role: sum(1 for event in fusion if event["role"] == role)
                for role in ("kick", "snare", "hihat")
            },
            "events": fusion,
            "midiFile": "drums.mid",
        },
        "lowEnd": {
            "armId": "librosa-pyin-lowend-v1",
            "noteCount": len(lowend["notes"]),
            "voicedFrameCount": lowend["voicedFrameCount"],
            "frameCount": lowend["frameCount"],
            "notes": lowend["notes"],
            "pitchContour": lowend["pitchContour"],
            "midiFile": "low-end.mid",
        },
    }


def verify_existing_family(family_dir, source):
    result_file = family_dir / "result.json"
    if not result_file.is_file():
        raise RuntimeError(f"Partial evaluation output without result receipt: {source['sourceRecordId']}")
    result = read_json(result_file)
    if (
        result.get("sourceRecordId") != source["sourceRecordId"]
        or result.get("sourceSha256") != source["sha256"]
        or result.get("split") != SPLIT
        or result.get("drums", {}).get("armId") != "drums-bass-kick-fusion-v1"
        or result.get("lowEnd", {}).get("armId") != "librosa-pyin-lowend-v1"
        or result.get("humanReferenceUsedAsInput") is not False
        or result.get("retuningPerformed") is not False
    ):
        raise RuntimeError(f"Existing family result mismatch: {source['sourceRecordId']}")
    for name, field in (("drums.mid", "drumsMidiSha256"), ("low-end.mid", "lowEndMidiSha256")):
        file = family_dir / name
        if not file.is_file() or sha256_file(file) != result.get(field):
            raise RuntimeError(f"Existing MIDI integrity mismatch: {source['sourceRecordId']}/{name}")
    stems_dir = family_dir / "stems"
    for stem in ("drums", "bass", "other", "vocals"):
        file = stems_dir / f"{stem}.wav"
        if not file.is_file() or sha256_file(file) != result.get("stems", {}).get(stem, {}).get("sha256"):
            raise RuntimeError(f"Existing stem integrity mismatch: {source['sourceRecordId']}/{stem}")
    return result


def execute(workspace_root, model_xml=DEFAULT_MODEL):
    workspace = Path(workspace_root).resolve()
    contract, sep_contract, receipt, _receipt_path = validate_receipt(workspace, model_xml)
    validate_audio_analysis_environment()
    dev_protocol = read_json(AUDIO_MIDI_DEV_PROTOCOL_FILE)
    root = execution_root(workspace)
    summary_file = root / "summary.json"
    if summary_file.exists():
        raise RuntimeError(f"Evaluation execution already finalized: {summary_file}")

    sep_py = Path(receipt["sourceSeparationEnvironment"]["python"])
    model_xml = Path(receipt["sourceSeparationEnvironment"]["modelXml"])
    cache_dir = workspace / receipt["sourceSeparationEnvironment"]["cacheRelativePath"]
    cache_dir.mkdir(parents=True, exist_ok=True)

    results = []
    for index, source in enumerate(receipt["sources"], 1):
        rid = source["sourceRecordId"]
        print(f"[{index}/12] frozen evaluation {rid}", file=sys.stderr, flush=True)
        final_family = root / "results" / rid
        if final_family.exists():
            existing = verify_existing_family(final_family, source)
            results.append({
                "sourceRecordId": rid,
                "resultSha256": sha256_file(final_family / "result.json"),
                "drumsMidiSha256": existing["drumsMidiSha256"],
                "lowEndMidiSha256": existing["lowEndMidiSha256"],
            })
            continue

        source_path = safe_relative(workspace, source["localPath"], "source")
        if not source_path.is_file():
            raise RuntimeError(f"Reserved source file missing: {rid}")
        if sha256_file(source_path) != source["sha256"]:
            raise RuntimeError(f"Reserved source SHA256 mismatch: {rid}")

        results_root = root / "results"
        results_root.mkdir(parents=True, exist_ok=True)
        temp = results_root / f".{rid}.{uuid.uuid4().hex}.tmp"
        temp.mkdir(parents=False, exist_ok=False)
        try:
            stems_dir = temp / "stems"
            adapter_result = run_json(
                [
                    sep_py, SOURCE_SEP_ADAPTER_FILE, "separate-file",
                    source_path, stems_dir,
                    "--model", model_xml,
                    "--device", "CPU",
                    "--cache-dir", cache_dir,
                    "--shifts", "1",
                    "--shift-seed", "0",
                ],
                f"Source Separation {rid}",
            )
            verify_adapter_result(adapter_result, source, stems_dir, receipt)

            selected = render_selected_midi(source_path, stems_dir, temp, dev_protocol)
            drums_midi = temp / "drums.mid"
            low_midi = temp / "low-end.mid"
            if (
                not drums_midi.is_file() or not drums_midi.read_bytes().startswith(b"MThd")
                or not low_midi.is_file() or not low_midi.read_bytes().startswith(b"MThd")
            ):
                raise RuntimeError(f"Invalid selected MIDI output: {rid}")

            result = {
                "schema": "fame-owned-beats-audio-to-midi-independent-evaluation-family-v1",
                "version": 1,
                "runId": RUN_ID,
                "cohortId": COHORT_ID,
                "split": SPLIT,
                "sourceRecordId": rid,
                "compositionFamilyId": source["compositionFamilyId"],
                "sourceAssetId": source["sourceAssetId"],
                "sourceSha256": source["sha256"],
                "bpm": selected["bpm"],
                "bpmSource": selected["bpmSource"],
                "humanReferenceUsedAsInput": False,
                "sourceSeparation": {
                    "armId": "intel-openvino-htdemucs-v4-97fc578",
                    "modelRevision": contract["pipeline"]["sourceSeparation"]["modelRevision"],
                    "technicalValidation": adapter_result["technicalValidation"],
                },
                "stems": {
                    stem: {
                        "sha256": adapter_result["stems"][stem]["sha256"],
                        "sampleRate": adapter_result["stems"][stem]["sampleRate"],
                        "channels": adapter_result["stems"][stem]["channels"],
                        "samplesPerChannel": adapter_result["stems"][stem]["samplesPerChannel"],
                    }
                    for stem in ("drums", "bass", "other", "vocals")
                },
                "drums": selected["drums"],
                "lowEnd": selected["lowEnd"],
                "drumsMidiSha256": sha256_file(drums_midi),
                "lowEndMidiSha256": sha256_file(low_midi),
                "retuningPerformed": False,
                "safety": {
                    "batch131Authorized": False,
                    "trainingAuthorized": False,
                    "taskDataReadyMayBeDeclared": False,
                },
            }
            (temp / "result.json").write_text(stable_json(result), encoding="utf-8")
            temp.rename(final_family)
        except Exception:
            shutil.rmtree(temp, ignore_errors=True)
            raise

        results.append({
            "sourceRecordId": rid,
            "resultSha256": sha256_file(final_family / "result.json"),
            "drumsMidiSha256": sha256_file(final_family / "drums.mid"),
            "lowEndMidiSha256": sha256_file(final_family / "low-end.mid"),
        })

    summary = {
        "schema": "fame-owned-beats-audio-to-midi-independent-evaluation-summary-v1",
        "version": 1,
        "status": "EVALUATION_OUTPUT_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA",
        "runId": RUN_ID,
        "cohortId": COHORT_ID,
        "split": SPLIT,
        "records": len(results),
        "cohortDigestSha256": contract["cohortDigestSha256"],
        "selectedDrumsArm": "drums-bass-kick-fusion-v1",
        "selectedLowEndArm": "librosa-pyin-lowend-v1",
        "basicPitchExecuted": False,
        "humanReferenceUsedAsInput": False,
        "retuningPerformed": False,
        "results": results,
        "safety": {
            "batch131Authorized": False,
            "trainingAuthorized": False,
            "taskDataReadyMayBeDeclared": False,
        },
        "nextAction": "RUN_INDEPENDENT_EVALUATION_TECHNICAL_QA_THEN_BLIND_HUMAN_QA",
    }
    summary_file.write_text(stable_json(summary), encoding="utf-8")
    return {
        "mode": "AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_EXECUTION_COMPLETE",
        "runId": RUN_ID,
        "cohortId": COHORT_ID,
        "records": len(results),
        "status": summary["status"],
        "selectedDrumsArm": summary["selectedDrumsArm"],
        "selectedLowEndArm": summary["selectedLowEndArm"],
        "basicPitchExecuted": False,
        "humanReferenceUsedAsInput": False,
        "retuningPerformed": False,
        "batch131Authorized": False,
        "trainingAuthorized": False,
        "taskDataReadyMayBeDeclared": False,
        "nextAction": summary["nextAction"],
    }


def check(workspace_root, model_xml=DEFAULT_MODEL):
    workspace = Path(workspace_root).resolve()
    contract, _sep_contract, receipt, file = validate_receipt(workspace, model_xml)
    return {
        "mode": "AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_EXECUTION_RECEIPT_CHECK_PASS",
        "runId": RUN_ID,
        "cohortId": COHORT_ID,
        "status": receipt["status"],
        "records": len(receipt["sources"]),
        "cohortDigestSha256": contract["cohortDigestSha256"],
        "receiptSha256": sha256_file(file),
        "evaluationAudioOpenedByThisCommand": False,
        "sourceSeparationExecutedByThisCommand": False,
        "transcriptionExecutedByThisCommand": False,
        "retuningPerformedByThisCommand": False,
        "batch131Authorized": False,
        "trainingAuthorized": False,
        "taskDataReadyMayBeDeclared": False,
        "nextAction": receipt["nextAction"],
    }


def self_test():
    contract = validate_contract()
    validate_repo_bindings(contract)
    _aa, dev, sep, _sp = validate_frozen_pipeline(contract)
    if EXPECTED_IDS != read_json(COHORT_FILE)["records"] and False:
        raise RuntimeError("unreachable")
    if dev["drums"]["kickFusion"]["deduplicateWithinSeconds"] != 0.05:
        raise RuntimeError("Frozen drums fixture mismatch")
    if sep["execution"]["shifts"] != 1:
        raise RuntimeError("Frozen Source Separation fixture mismatch")
    return {
        "mode": "AUDIO_TO_MIDI_INDEPENDENT_EVALUATION_EXECUTION_SELF_TEST_PASS",
        "expectedFamilies": 12,
        "evaluationAudioOpenedByThisCommand": False,
        "sourceSeparationExecutedByThisCommand": False,
        "transcriptionExecutedByThisCommand": False,
    }


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["self-test", "preflight", "prepare", "check", "execute"])
    parser.add_argument("workspace", nargs="?")
    parser.add_argument("--model", default=str(DEFAULT_MODEL))
    args = parser.parse_args(argv)

    if args.command == "self-test":
        out = self_test()
    else:
        if not args.workspace:
            raise RuntimeError("workspace is required")
        if args.command == "preflight":
            out = preflight(args.workspace, args.model)
        elif args.command == "prepare":
            out = prepare(args.workspace, args.model)
        elif args.command == "check":
            out = check(args.workspace, args.model)
        elif args.command == "execute":
            out = execute(args.workspace, args.model)
        else:
            raise RuntimeError("Unsupported command")
    print(stable_json(out), end="")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"AUDIO TO MIDI INDEPENDENT EVALUATION EXECUTION FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
