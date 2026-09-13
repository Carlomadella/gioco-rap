"""Train-only microbenchmark codecs. No model initialization or torch import at fit time."""
from __future__ import annotations
import json
from collections import Counter, defaultdict
from dataclasses import dataclass
from typing import Any, Dict, Optional, Sequence, Tuple

NA = "__FAME_NA__"
FIELD_CARDINALITY_ALIAS = {
    "kind": "kind",
    "bpm": "bpm",
    "key": "key",
    "mode": "mode",
    "lineage": "lineage",
    "bar": "bar",
    "position": "position",
    "type": "eventType",
    "velocityBin": "velocity",
    "note": "note",
    "duration": "duration",
    "role": "role",
    "motif": "motif",
    "glideTo": "glideTo",
    "glideDuration": "glideDuration",
    "rootPitchClass": "chordRoot",
    "quality": "chordQuality",
    "bassPitchClass": "chordBass",
    "energy": "energy",
    "vocalSpace": "vocalSpace",
    "tension": "tension",
    "density": "density",
    "transitionFrom": "scalar01",
    "transitionTo": "scalar01",
    "motifSimilarity": "scalar01",
    "kickExact": "scalar01",
    "kickProximity": "scalar01",
    "kickStrength": "scalar01",
    "motifFamily": "motifFamily",
    "motifRelation": "motifRelation",
    "kick808Available": "kick808Available",
    "kickCount": "kickBassCount",
    "bassCount": "kickBassCount",
    "kickLag": "kickLag",
    "hatRollCount": "hatRollCount",
    "hatMaxRollNotes": "hatRollNotes",
    "start": "position",
    "end": "position",
    "notes": "hatRollNotes",
}


def jdump(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def jload(value: str) -> Any:
    return json.loads(value)


@dataclass
class Record:
    phrase_id: str
    group_id: str
    source_collection: str
    bars: int
    units: list


class TokenCodec:
    kind = "token"

    def __init__(self, train_records: Sequence[Record], declared_vocab_size: int):
        observed = sorted({str(unit) for record in train_records for unit in record.units})
        self.token_to_id = {token: idx + 1 for idx, token in enumerate(observed)}
        self.id_to_token = {idx: token for token, idx in self.token_to_id.items()}
        self.pad_id = 0
        self.declared_vocab_size = int(declared_vocab_size or 0)
        self.vocab_size = len(self.token_to_id) + 1

    def validate_units(self, units: list) -> None:
        missing = sorted({str(unit) for unit in units} - self.token_to_id.keys())
        if missing:
            raise ValueError(f"TRAIN_ONLY_CODEC_OOV: token non osservati nel train: {missing[:8]}")

    def encode(self, units: list) -> torch.Tensor:
        import torch
        self.validate_units(units)
        return torch.tensor([self.token_to_id[str(unit)] for unit in units], dtype=torch.long)

    def decode_ids(self, ids: Sequence[int]) -> list:
        out = []
        for idx in ids:
            token = self.id_to_token.get(int(idx))
            if token is None:
                token = "<FAME_UNUSED_TOKEN>"
            out.append(token)
        return out

    def eos_id(self) -> Optional[int]:
        return self.token_to_id.get("<EOS>")

    def final_bar_start(self, units: list) -> int:
        indices = [i for i, unit in enumerate(units) if str(unit).startswith("BAR=")]
        return indices[-1] if indices else max(1, len(units) - 2)


class CompoundCodec:
    kind = "compound"

    def __init__(self, train_records: Sequence[Record], metadata: dict):
        field_values: Dict[str, set] = defaultdict(set)
        schema_counter: Dict[Tuple[str, Optional[str]], Counter] = defaultdict(Counter)
        fields = set()
        for record in train_records:
            for word in record.units:
                if not isinstance(word, dict):
                    raise ValueError("Compound unit non oggetto")
                kind = str(word.get("kind", ""))
                event_type = str(word.get("type")) if kind == "EVENT" and word.get("type") is not None else None
                signature = tuple(sorted(word.keys()))
                schema_counter[(kind, event_type)][signature] += 1
                for key, value in word.items():
                    fields.add(key)
                    field_values[key].add(jdump(value))
        self.fields = sorted(fields, key=lambda x: (x != "kind", x))
        self.value_to_id: Dict[str, Dict[str, int]] = {}
        self.id_to_value: Dict[str, Dict[int, Any]] = {}
        declared = metadata.get("fieldCardinalities", {}) if isinstance(metadata, dict) else {}
        self.field_sizes: Dict[str, int] = {}
        for field in self.fields:
            values = sorted(field_values[field])
            mapping = {value: idx + 1 for idx, value in enumerate(values)}
            self.value_to_id[field] = mapping
            self.id_to_value[field] = {idx: jload(value) for value, idx in mapping.items()}
            alias = FIELD_CARDINALITY_ALIAS.get(field)
            _declared_size = int(declared.get(alias, 0) or 0)
            self.field_sizes[field] = len(mapping) + 1
        self.schemas: Dict[str, list] = {}
        for (kind, event_type), counter in schema_counter.items():
            signature, _count = counter.most_common(1)[0]
            key = self.schema_key(kind, event_type)
            self.schemas[key] = list(signature)
        self.kind_field = "kind"

    @staticmethod
    def schema_key(kind: str, event_type: Optional[str]) -> str:
        return f"{kind}|{event_type or '*'}"

    def validate_units(self, units: list) -> None:
        for word in units:
            if not isinstance(word, dict):
                raise ValueError("Compound unit non oggetto")
            for field, value in word.items():
                if field not in self.value_to_id or jdump(value) not in self.value_to_id[field]:
                    raise ValueError(f"TRAIN_ONLY_CODEC_OOV: {field}={value!r} non osservato nel train")

    def encode(self, units: list) -> Dict[str, torch.Tensor]:
        import torch
        self.validate_units(units)
        tensors = {field: [] for field in self.fields}
        for word in units:
            for field in self.fields:
                if field not in word:
                    tensors[field].append(0)
                else:
                    key = jdump(word[field])
                    idx = self.value_to_id[field].get(key)
                    if idx is None:
                        raise KeyError(f"Valore compound fuori mapping {field}={word[field]!r}")
                    tensors[field].append(idx)
        return {field: torch.tensor(values, dtype=torch.long) for field, values in tensors.items()}

    def kind_id(self, kind: str) -> Optional[int]:
        return self.value_to_id.get("kind", {}).get(jdump(kind))

    def value_from_id(self, field: str, idx: int) -> Any:
        return self.id_to_value.get(field, {}).get(int(idx), None)

    def schema_for(self, kind: str, event_type: Optional[str]) -> list:
        key = self.schema_key(kind, event_type)
        if key in self.schemas:
            return self.schemas[key]
        generic = self.schema_key(kind, None)
        return self.schemas.get(generic, ["kind"])

    def final_bar_start(self, units: list) -> int:
        indices = [i for i, word in enumerate(units) if isinstance(word, dict) and word.get("kind") == "BAR"]
        return indices[-1] if indices else max(1, len(units) - 2)


def fit_train_codec(records, adapter_meta):
    train = records.get("train") or []
    if not train or not train[0].units:
        raise ValueError("Training split vuoto: impossibile costruire il codec")
    token_rep = not isinstance(train[0].units[0], dict)
    codec = (TokenCodec(train, int(adapter_meta.get("vocabSize", 0))) if token_rep
             else CompoundCodec(train, adapter_meta.get("metadata") or {}))
    # Validate every split before allocating/training any model. No silent UNK,
    # target dropping or vocabulary fitting on validation/test.
    for split in ("train", "val", "test"):
        for record in records.get(split, []):
            try:
                codec.validate_units(record.units)
            except ValueError as exc:
                raise ValueError(f"{split}/{record.phrase_id}: {exc}") from exc
    return codec, token_rep
