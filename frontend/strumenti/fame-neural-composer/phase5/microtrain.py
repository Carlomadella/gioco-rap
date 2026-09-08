from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import random
import statistics
import sys
import time
import warnings
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F

warnings.filterwarnings("ignore", message="enable_nested_tensor.*")

SEED = 3407
REPRESENTATIONS = ["flat-poc-v1", "remi-plus-v1", "compound-word-v1", "fame-compound-v1"]
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


def sha_bucket(text: str) -> int:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big") % 100


def split_name(group_id: str) -> str:
    bucket = sha_bucket(group_id)
    if bucket < 80:
        return "train"
    if bucket < 90:
        return "val"
    return "test"


def seed_all(seed: int = SEED) -> None:
    random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def human_mib(value: int) -> float:
    return round(value / (1024 * 1024), 3)


@dataclass
class Record:
    phrase_id: str
    group_id: str
    source_collection: str
    bars: int
    units: list


class TokenCodec:
    kind = "token"

    def __init__(self, all_records: Sequence[Record], declared_vocab_size: int):
        observed = sorted({str(unit) for record in all_records for unit in record.units})
        self.token_to_id = {token: idx + 1 for idx, token in enumerate(observed)}
        self.id_to_token = {idx: token for token, idx in self.token_to_id.items()}
        self.pad_id = 0
        self.declared_vocab_size = int(declared_vocab_size or 0)
        self.vocab_size = len(self.token_to_id) + 1

    def encode(self, units: list) -> torch.Tensor:
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

    def __init__(self, all_records: Sequence[Record], metadata: dict):
        field_values: Dict[str, set] = defaultdict(set)
        schema_counter: Dict[Tuple[str, Optional[str]], Counter] = defaultdict(Counter)
        fields = set()
        for record in all_records:
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

    def encode(self, units: list) -> Dict[str, torch.Tensor]:
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


class CausalBackbone(nn.Module):
    def __init__(self, d_model: int, nhead: int, layers: int, ff: int, dropout: float, max_len: int):
        super().__init__()
        self.pos = nn.Embedding(max_len, d_model)
        layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=ff,
            dropout=dropout,
            activation="gelu",
            batch_first=True,
            norm_first=True,
        )
        self.encoder = nn.TransformerEncoder(layer, num_layers=layers)
        self.norm = nn.LayerNorm(d_model)
        self.max_len = max_len

    def forward_backbone(self, x: torch.Tensor, padding_mask: Optional[torch.Tensor]) -> torch.Tensor:
        b, l, _d = x.shape
        if l > self.max_len:
            raise ValueError(f"sequence length {l} > max_len {self.max_len}")
        positions = torch.arange(l, device=x.device).unsqueeze(0)
        x = x + self.pos(positions)
        causal = torch.triu(torch.ones((l, l), dtype=torch.bool, device=x.device), diagonal=1)
        out = self.encoder(x, mask=causal, src_key_padding_mask=padding_mask)
        return self.norm(out)


class TokenModel(CausalBackbone):
    def __init__(self, vocab_size: int, **kwargs):
        d_model = kwargs["d_model"]
        super().__init__(**kwargs)
        self.embedding = nn.Embedding(vocab_size, d_model, padding_idx=0)
        self.head = nn.Linear(d_model, vocab_size)

    def forward(self, ids: torch.Tensor, padding_mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        x = self.embedding(ids)
        h = self.forward_backbone(x, padding_mask)
        return self.head(h)


class CompoundModel(CausalBackbone):
    def __init__(self, field_sizes: Dict[str, int], **kwargs):
        d_model = kwargs["d_model"]
        super().__init__(**kwargs)
        self.field_sizes = dict(field_sizes)
        self.module_key = {field: f"field__{field}" for field in field_sizes}
        self.embeddings = nn.ModuleDict({
            self.module_key[field]: nn.Embedding(size, d_model, padding_idx=0)
            for field, size in field_sizes.items()
        })
        self.heads = nn.ModuleDict({self.module_key[field]: nn.Linear(d_model, size) for field, size in field_sizes.items()})

    def hidden(self, fields: Dict[str, torch.Tensor], padding_mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        sample = next(iter(fields.values()))
        b, l = sample.shape
        x = torch.zeros((b, l, self.pos.embedding_dim), device=sample.device, dtype=self.pos.weight.dtype)
        active_counts = torch.zeros((b, l, 1), device=sample.device, dtype=x.dtype)
        for field, ids in fields.items():
            emb = self.embeddings[self.module_key[field]](ids)
            active = (ids != 0).unsqueeze(-1)
            x = x + emb
            active_counts = active_counts + active.to(x.dtype)
        x = x / active_counts.clamp_min(1.0).sqrt()
        return self.forward_backbone(x, padding_mask)

    def forward(self, fields: Dict[str, torch.Tensor], padding_mask: Optional[torch.Tensor] = None) -> Dict[str, torch.Tensor]:
        h = self.hidden(fields, padding_mask)
        return {field: self.heads[self.module_key[field]](h) for field in self.field_sizes}


class TokenBatcher:
    def __init__(self, codec: TokenCodec, records: Sequence[Record], batch_size: int, seed: int):
        self.codec = codec
        self.records = list(records)
        self.batch_size = batch_size
        self.rng = random.Random(seed)
        self.order = list(range(len(self.records)))
        self.cursor = 0
        self.rng.shuffle(self.order)

    def next(self, device: torch.device):
        if self.cursor + self.batch_size > len(self.order):
            self.rng.shuffle(self.order)
            self.cursor = 0
        indices = self.order[self.cursor:self.cursor + self.batch_size]
        self.cursor += self.batch_size
        batch = [self.records[i] for i in indices]
        encoded = [self.codec.encode(record.units) for record in batch]
        max_len = max(max(2, len(x)) for x in encoded) - 1
        x = torch.zeros((len(batch), max_len), dtype=torch.long)
        y = torch.zeros((len(batch), max_len), dtype=torch.long)
        mask = torch.ones((len(batch), max_len), dtype=torch.bool)
        units = 0
        bars = 0
        for row, (record, ids) in enumerate(zip(batch, encoded)):
            if ids.numel() < 2:
                continue
            n = ids.numel() - 1
            x[row, :n] = ids[:-1]
            y[row, :n] = ids[1:]
            mask[row, :n] = False
            units += n
            bars += record.bars
        return x.to(device), y.to(device), mask.to(device), units, bars


class CompoundBatcher:
    def __init__(self, codec: CompoundCodec, records: Sequence[Record], batch_size: int, seed: int):
        self.codec = codec
        self.records = list(records)
        self.batch_size = batch_size
        self.rng = random.Random(seed)
        self.order = list(range(len(self.records)))
        self.cursor = 0
        self.rng.shuffle(self.order)

    def next(self, device: torch.device):
        if self.cursor + self.batch_size > len(self.order):
            self.rng.shuffle(self.order)
            self.cursor = 0
        indices = self.order[self.cursor:self.cursor + self.batch_size]
        self.cursor += self.batch_size
        batch = [self.records[i] for i in indices]
        encoded = [self.codec.encode(record.units) for record in batch]
        lengths = [len(record.units) for record in batch]
        max_len = max(max(2, n) for n in lengths) - 1
        x = {field: torch.zeros((len(batch), max_len), dtype=torch.long) for field in self.codec.fields}
        y = {field: torch.zeros((len(batch), max_len), dtype=torch.long) for field in self.codec.fields}
        mask = torch.ones((len(batch), max_len), dtype=torch.bool)
        units = 0
        bars = 0
        for row, (record, fields) in enumerate(zip(batch, encoded)):
            n = len(record.units) - 1
            if n <= 0:
                continue
            for field in self.codec.fields:
                x[field][row, :n] = fields[field][:-1]
                y[field][row, :n] = fields[field][1:]
            mask[row, :n] = False
            units += n
            bars += record.bars
        return ({k: v.to(device) for k, v in x.items()},
                {k: v.to(device) for k, v in y.items()},
                mask.to(device), units, bars)


def token_loss(logits: torch.Tensor, targets: torch.Tensor) -> Tuple[torch.Tensor, int, float]:
    flat_targets = targets.reshape(-1)
    active = flat_targets != 0
    count = int(active.sum().item())
    if count == 0:
        zero = logits.sum() * 0
        return zero, 0, 0.0
    selected_logits = logits.reshape(-1, logits.size(-1))[active]
    selected_targets = flat_targets[active]
    total = F.cross_entropy(selected_logits, selected_targets, reduction="sum")
    return total / count, count, float(total.detach().item())


def compound_loss(logits: Dict[str, torch.Tensor], targets: Dict[str, torch.Tensor]) -> Tuple[torch.Tensor, int, float]:
    total_loss = None
    count = 0
    detached_sum = 0.0
    for field, field_logits in logits.items():
        target = targets[field].reshape(-1)
        active = target != 0
        n = int(active.sum().item())
        if n == 0:
            continue
        selected_logits = field_logits.reshape(-1, field_logits.size(-1))[active]
        selected_targets = target[active]
        field_sum = F.cross_entropy(selected_logits, selected_targets, reduction="sum")
        total_loss = field_sum if total_loss is None else total_loss + field_sum
        detached_sum += float(field_sum.detach().item())
        count += n
    if total_loss is None or count == 0:
        sample = next(iter(logits.values()))
        zero = sample.sum() * 0
        return zero, 0, 0.0
    return total_loss / count, count, detached_sum


def autocast_context(device: torch.device, amp_dtype: Optional[torch.dtype]):
    if device.type != "cuda" or amp_dtype is None:
        from contextlib import nullcontext
        return nullcontext()
    return torch.autocast(device_type="cuda", dtype=amp_dtype)


def choose_amp(device: torch.device) -> Tuple[Optional[torch.dtype], str, Optional[torch.amp.GradScaler]]:
    if device.type != "cuda":
        return None, "float32", None
    if torch.cuda.is_bf16_supported():
        return torch.bfloat16, "bfloat16", None
    scaler = torch.amp.GradScaler("cuda")
    return torch.float16, "float16", scaler


def count_parameters(model: nn.Module) -> int:
    return sum(p.numel() for p in model.parameters())


def train_one(rep_id: str, records: Dict[str, List[Record]], adapter_meta: dict, args, device: torch.device) -> Tuple[dict, Any, Any]:
    all_records = records["all"]
    token_rep = all_records and (not isinstance(all_records[0].units[0], dict))
    if token_rep:
        codec = TokenCodec(all_records, int(adapter_meta.get("vocabSize", 0)))
        model = TokenModel(
            vocab_size=codec.vocab_size,
            d_model=args.d_model,
            nhead=args.heads,
            layers=args.layers,
            ff=args.ff,
            dropout=args.dropout,
            max_len=args.max_len,
        )
        batcher = TokenBatcher(codec, records["train"], args.batch_size, SEED)
    else:
        codec = CompoundCodec(all_records, adapter_meta.get("metadata") or {})
        model = CompoundModel(
            field_sizes=codec.field_sizes,
            d_model=args.d_model,
            nhead=args.heads,
            layers=args.layers,
            ff=args.ff,
            dropout=args.dropout,
            max_len=args.max_len,
        )
        batcher = CompoundBatcher(codec, records["train"], args.batch_size, SEED)

    model.to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, betas=(0.9, 0.95), weight_decay=0.01)
    amp_dtype, amp_name, scaler = choose_amp(device)
    if device.type == "cuda":
        torch.cuda.empty_cache()
        torch.cuda.reset_peak_memory_stats(device)
        torch.cuda.synchronize(device)
    start = time.perf_counter()
    processed_units = 0
    processed_bars = 0
    losses = []
    model.train()

    for step in range(args.steps):
        optimizer.zero_grad(set_to_none=True)
        batch = batcher.next(device)
        inputs, targets, padding_mask, units, bars = batch
        with autocast_context(device, amp_dtype):
            outputs = model(inputs, padding_mask)
            if token_rep:
                loss, _count, _sum = token_loss(outputs, targets)
            else:
                loss, _count, _sum = compound_loss(outputs, targets)
        if scaler is not None:
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(optimizer)
            scaler.update()
        else:
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
        processed_units += units
        processed_bars += bars
        losses.append(float(loss.detach().item()))
        if args.progress and ((step + 1) % max(1, args.steps // 6) == 0 or step == 0):
            print(f"    step {step+1}/{args.steps} loss={losses[-1]:.4f}", flush=True)

    if device.type == "cuda":
        torch.cuda.synchronize(device)
    elapsed = time.perf_counter() - start

    val = evaluate(model, codec, records["val"], args, device, amp_dtype, token_rep)
    peak_alloc = torch.cuda.max_memory_allocated(device) if device.type == "cuda" else 0
    peak_reserved = torch.cuda.max_memory_reserved(device) if device.type == "cuda" else 0
    result = {
        "representation": rep_id,
        "model": {
            "backbone": "causal-transformer-encoder-v1",
            "dModel": args.d_model,
            "heads": args.heads,
            "layers": args.layers,
            "ff": args.ff,
            "dropout": args.dropout,
            "maxLen": args.max_len,
            "parameters": count_parameters(model),
            "amp": amp_name,
            "microVocabularyMode": "corpus-observed",
            "inputOutputCardinality": codec.vocab_size if token_rep else sum(codec.field_sizes.values()),
        },
        "training": {
            "steps": args.steps,
            "batchSizePhrases": args.batch_size,
            "lr": args.lr,
            "elapsedSeconds": round(elapsed, 4),
            "processedUnits": processed_units,
            "processedBars": processed_bars,
            "unitsPerSecond": round(processed_units / elapsed, 3) if elapsed > 0 else 0,
            "barsPerSecond": round(processed_bars / elapsed, 3) if elapsed > 0 else 0,
            "finalLossPerTarget": round(losses[-1], 6) if losses else None,
            "meanLossPerTarget": round(statistics.fmean(losses), 6) if losses else None,
        },
        "memory": {
            "peakAllocatedMiB": human_mib(peak_alloc),
            "peakReservedMiB": human_mib(peak_reserved),
        },
        "validation": val,
    }
    return result, model, codec


@torch.no_grad()
def evaluate(model, codec, records: Sequence[Record], args, device: torch.device, amp_dtype, token_rep: bool) -> dict:
    model.eval()
    total_nll = 0.0
    total_targets = 0
    total_bars = 0
    total_units = 0
    batch_size = args.batch_size
    for start in range(0, len(records), batch_size):
        chunk = list(records[start:start + batch_size])
        if token_rep:
            encoded = [codec.encode(record.units) for record in chunk]
            max_len = max(max(2, len(x)) for x in encoded) - 1
            x = torch.zeros((len(chunk), max_len), dtype=torch.long)
            y = torch.zeros((len(chunk), max_len), dtype=torch.long)
            mask = torch.ones((len(chunk), max_len), dtype=torch.bool)
            for row, ids in enumerate(encoded):
                n = ids.numel() - 1
                x[row, :n] = ids[:-1]
                y[row, :n] = ids[1:]
                mask[row, :n] = False
            x, y, mask = x.to(device), y.to(device), mask.to(device)
            with autocast_context(device, amp_dtype):
                logits = model(x, mask)
                _loss, count, nll = token_loss(logits, y)
        else:
            encoded = [codec.encode(record.units) for record in chunk]
            max_len = max(max(2, len(record.units)) for record in chunk) - 1
            x = {field: torch.zeros((len(chunk), max_len), dtype=torch.long) for field in codec.fields}
            y = {field: torch.zeros((len(chunk), max_len), dtype=torch.long) for field in codec.fields}
            mask = torch.ones((len(chunk), max_len), dtype=torch.bool)
            for row, fields in enumerate(encoded):
                n = len(chunk[row].units) - 1
                for field in codec.fields:
                    x[field][row, :n] = fields[field][:-1]
                    y[field][row, :n] = fields[field][1:]
                mask[row, :n] = False
            x = {k: v.to(device) for k, v in x.items()}
            y = {k: v.to(device) for k, v in y.items()}
            mask = mask.to(device)
            with autocast_context(device, amp_dtype):
                logits = model(x, mask)
                _loss, count, nll = compound_loss(logits, y)
        total_nll += nll
        total_targets += count
        total_bars += sum(record.bars for record in chunk)
        total_units += sum(max(0, len(record.units) - 1) for record in chunk)
    model.train()
    nll_target = total_nll / max(1, total_targets)
    return {
        "phrases": len(records),
        "targets": total_targets,
        "units": total_units,
        "bars": total_bars,
        "nllPerTarget": round(nll_target, 6),
        "perplexityPerTarget": round(math.exp(min(20.0, nll_target)), 6),
        "nllPerBar": round(total_nll / max(1, total_bars), 6),
        "bitsPerBar": round((total_nll / math.log(2.0)) / max(1, total_bars), 6),
    }


def sample_logits(logits: torch.Tensor, temperature: float, top_k: int, forbidden_zero: bool = False) -> int:
    values = logits.float().clone()
    if forbidden_zero and values.numel() > 0:
        values[0] = -float("inf")
    values = values / max(0.05, float(temperature))
    k = min(max(1, int(top_k)), values.numel())
    top_values, top_indices = torch.topk(values, k)
    probs = F.softmax(top_values, dim=-1)
    choice = torch.multinomial(probs, 1)
    return int(top_indices[choice].item())


@torch.no_grad()
def generate_last_bar_token(model: TokenModel, codec: TokenCodec, record: Record, args, device, amp_dtype) -> list:
    ids = codec.encode(record.units).tolist()
    start = codec.final_bar_start(record.units)
    prefix = ids[:start]
    target_budget = max(4, len(ids) - start)
    max_new = min(args.max_generation_units, int(target_budget * 1.5) + 8)
    eos = codec.eos_id()
    generated = list(prefix)
    for _ in range(max_new):
        context = generated[-args.max_len:]
        x = torch.tensor(context, dtype=torch.long, device=device).unsqueeze(0)
        mask = torch.zeros_like(x, dtype=torch.bool)
        with autocast_context(device, amp_dtype):
            logits = model(x, mask)[0, -1]
        next_id = sample_logits(logits, args.temperature, args.top_k, forbidden_zero=True)
        generated.append(next_id)
        if eos is not None and next_id == eos:
            break
    return codec.decode_ids(generated)


@torch.no_grad()
def compound_next_word(model: CompoundModel, codec: CompoundCodec, generated: list, args, device, amp_dtype) -> dict:
    encoded = codec.encode(generated)
    x = {field: tensor.to(device).unsqueeze(0) for field, tensor in encoded.items()}
    mask = torch.zeros((1, len(generated)), dtype=torch.bool, device=device)
    with autocast_context(device, amp_dtype):
        logits = model(x, mask)
    kind_logits = logits["kind"][0, -1]
    kind_idx = sample_logits(kind_logits, args.temperature, args.top_k, forbidden_zero=True)
    kind = codec.value_from_id("kind", kind_idx)
    if kind is None:
        return {"kind": "EOS"}
    word = {"kind": kind}

    event_type = None
    schema = codec.schema_for(str(kind), None)
    if str(kind) == "EVENT" and "type" in codec.fields:
        type_logits = logits["type"][0, -1]
        type_idx = sample_logits(type_logits, args.temperature, args.top_k, forbidden_zero=True)
        event_type = codec.value_from_id("type", type_idx)
        if event_type is not None:
            word["type"] = event_type
        schema = codec.schema_for(str(kind), str(event_type) if event_type is not None else None)

    for field in schema:
        if field in ("kind", "type"):
            continue
        if field not in logits:
            continue
        idx = sample_logits(logits[field][0, -1], args.temperature, args.top_k, forbidden_zero=True)
        value = codec.value_from_id(field, idx)
        if value is not None:
            word[field] = value
    return word


@torch.no_grad()
def generate_last_bar_compound(model: CompoundModel, codec: CompoundCodec, record: Record, args, device, amp_dtype) -> list:
    start = codec.final_bar_start(record.units)
    prefix = list(record.units[:start])
    target_budget = max(3, len(record.units) - start)
    max_new = min(args.max_generation_units, int(target_budget * 1.5) + 4)
    generated = list(prefix)
    for _ in range(max_new):
        if len(generated) >= args.max_len:
            break
        word = compound_next_word(model, codec, generated, args, device, amp_dtype)
        generated.append(word)
        if word.get("kind") == "EOS":
            break
    return generated


def generation_samples(rep_id: str, model, codec, val_records: Sequence[Record], args, device) -> list:
    amp_dtype, _amp_name, _scaler = choose_amp(device)
    chosen = list(val_records)[:args.generation_samples]
    samples = []
    was_training = model.training
    model.eval()
    for record in chosen:
        if isinstance(codec, TokenCodec):
            encoded = generate_last_bar_token(model, codec, record, args, device, amp_dtype)
        else:
            encoded = generate_last_bar_compound(model, codec, record, args, device, amp_dtype)
        samples.append({"phraseId": record.phrase_id, "bars": record.bars, "encoded": encoded})
    if was_training:
        model.train()
    return samples


def parse_dataset(path: Path) -> Tuple[dict, Dict[str, Dict[str, List[Record]]]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("schema") != "fame-neural-phase5-microtrain-dataset-v1":
        raise ValueError("Dataset microtrain schema non valido")
    raw_records = payload.get("records") or []
    by_rep: Dict[str, Dict[str, List[Record]]] = {}
    for rep_id in REPRESENTATIONS:
        buckets = {"train": [], "val": [], "test": [], "all": []}
        for item in raw_records:
            units = item.get("representations", {}).get(rep_id)
            if not isinstance(units, list) or len(units) < 2:
                raise ValueError(f"{rep_id}: units mancanti per {item.get('phraseId')}")
            record = Record(
                phrase_id=str(item["phraseId"]),
                group_id=str(item["groupId"]),
                source_collection=str(item.get("sourceCollection") or "unknown"),
                bars=max(1, int(item.get("bars") or 1)),
                units=units,
            )
            bucket = split_name(record.group_id)
            buckets[bucket].append(record)
            buckets["all"].append(record)
        for name in ("train", "val", "test"):
            buckets[name].sort(key=lambda r: r.phrase_id)
            if not buckets[name]:
                raise ValueError(f"Split {name} vuoto per {rep_id}")
        by_rep[rep_id] = buckets
    return payload, by_rep


def hardware(device: torch.device) -> dict:
    out = {
        "python": sys.version.split()[0],
        "torch": torch.__version__,
        "device": str(device),
        "cudaAvailable": torch.cuda.is_available(),
        "cudaRuntime": torch.version.cuda,
    }
    if device.type == "cuda":
        props = torch.cuda.get_device_properties(device)
        out.update({
            "gpuName": props.name,
            "gpuTotalMiB": human_mib(props.total_memory),
            "computeCapability": list(torch.cuda.get_device_capability(device)),
            "bf16Supported": bool(torch.cuda.is_bf16_supported()),
        })
    return out


def run_training(args) -> None:
    dataset_path = Path(args.dataset).resolve()
    output_dir = Path(args.output).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    payload, by_rep = parse_dataset(dataset_path)

    if args.device == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA non disponibile in PyTorch: il Blocco 3 richiede benchmark GPU reale")
    device = torch.device(args.device)
    seed_all(SEED)
    if device.type == "cuda":
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.set_float32_matmul_precision("high")

    print("=== FAME NEURAL / FASE 5 / BLOCCO 3 / MICRO-TRAINING ===", flush=True)
    print(f"Torch {torch.__version__} | CUDA runtime {torch.version.cuda} | device {device}", flush=True)
    if device.type == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(device)} | BF16: {torch.cuda.is_bf16_supported()}", flush=True)

    split_summary = {}
    reference = by_rep[REPRESENTATIONS[0]]
    for name in ("train", "val", "test"):
        split_summary[name] = {
            "phrases": len(reference[name]),
            "groups": len({r.group_id for r in reference[name]}),
            "bars": sum(r.bars for r in reference[name]),
        }
    print("Split:", split_summary, flush=True)

    results = []
    generated_paths = {}
    for rep_id in REPRESENTATIONS:
        print(f"\n[{rep_id}] training...", flush=True)
        seed_all(SEED)
        meta = payload.get("adapters", {}).get(rep_id, {})
        result, model, codec = train_one(rep_id, by_rep[rep_id], meta, args, device)
        print(
            f"  bars/s {result['training']['barsPerSecond']} | peak {result['memory']['peakAllocatedMiB']} MiB | "
            f"val bits/bar {result['validation']['bitsPerBar']}",
            flush=True,
        )
        seed_all(SEED + 99)
        samples = generation_samples(rep_id, model, codec, by_rep[rep_id]["val"], args, device)
        generated_file = output_dir / f"generated-{rep_id}.json"
        generated_file.write_text(json.dumps({"representation": rep_id, "samples": samples}, ensure_ascii=False) + "\n", encoding="utf-8")
        generated_paths[rep_id] = generated_file.name
        result["generation"] = {
            "samples": len(samples),
            "file": generated_file.name,
            "validation": "DEFERRED_TO_NODE_ADAPTER_VALIDATOR",
        }
        results.append(result)
        del model
        if device.type == "cuda":
            torch.cuda.empty_cache()

    report = {
        "schema": "fame-neural-phase5-block3-training-v1",
        "version": 1,
        "seed": SEED,
        "dataset": {
            "phrases": len(payload.get("records") or []),
            "groups": payload.get("corpus", {}).get("groups"),
            "split": split_summary,
        },
        "protocol": {
            "sameBackbone": True,
            "sameSplit": True,
            "sameSteps": True,
            "sameBatchSizePhrases": True,
            "steps": args.steps,
            "batchSizePhrases": args.batch_size,
            "dModel": args.d_model,
            "heads": args.heads,
            "layers": args.layers,
            "ff": args.ff,
            "maxLen": args.max_len,
            "generationSamples": args.generation_samples,
            "generationTask": "continue-final-bar-from-valid-prefix",
            "microVocabularyMode": "corpus-observed for every representation; full declared vocabulary/cardinalities remain measured in Block 2",
            "note": "Compound representations use factorized field embeddings/heads over the same Transformer backbone; total parameter count is reported because representation heads are part of cost.",
        },
        "hardware": hardware(device),
        "results": results,
    }
    out = output_dir / "phase5-block3-training.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nTraining report: {out}", flush=True)


def make_selftest_dataset(path: Path) -> None:
    token_a = ["<BOS>", "HDR=A", "BAR=0", "EV=A", "BAR=1", "EV=B", "<EOS>"]
    token_b = ["<BOS>", "HDR=B", "BAR=0", "EV=B", "BAR=1", "EV=A", "<EOS>"]
    comp_a = [
        {"kind": "HEADER", "bpm": 140}, {"kind": "BAR", "bar": 0, "energy": 5},
        {"kind": "EVENT", "bar": 0, "position": 0, "type": "kick", "velocityBin": 7},
        {"kind": "BAR", "bar": 1, "energy": 6}, {"kind": "EOS"},
    ]
    comp_b = [
        {"kind": "HEADER", "bpm": 142}, {"kind": "BAR", "bar": 0, "energy": 4},
        {"kind": "EVENT", "bar": 0, "position": 120, "type": "snare", "velocityBin": 8},
        {"kind": "BAR", "bar": 1, "energy": 7}, {"kind": "EOS"},
    ]
    records = []
    for i in range(30):
        records.append({
            "phraseId": f"self:{i}",
            "groupId": f"group:{i}",
            "sourceCollection": "selftest",
            "bars": 2,
            "representations": {
                "flat-poc-v1": token_a if i % 2 == 0 else token_b,
                "remi-plus-v1": token_b if i % 2 == 0 else token_a,
                "compound-word-v1": comp_a if i % 2 == 0 else comp_b,
                "fame-compound-v1": comp_b if i % 2 == 0 else comp_a,
            },
        })
    payload = {
        "schema": "fame-neural-phase5-microtrain-dataset-v1",
        "version": 1,
        "corpus": {"sourcePhrases": 30, "exclusionsApplied": 0, "trainingPhrases": 30, "groups": 30},
        "adapters": {
            "flat-poc-v1": {"vocabSize": 16, "metadata": None},
            "remi-plus-v1": {"vocabSize": 16, "metadata": None},
            "compound-word-v1": {"vocabSize": 32, "metadata": {"fieldCardinalities": {"kind": 5, "bpm": 201, "bar": 128, "energy": 11, "position": 32, "eventType": 11, "velocity": 10}}},
            "fame-compound-v1": {"vocabSize": 32, "metadata": {"fieldCardinalities": {"kind": 6, "bpm": 201, "bar": 128, "energy": 11, "position": 32, "eventType": 11, "velocity": 10}}},
        },
        "records": records,
    }
    path.write_text(json.dumps(payload), encoding="utf-8")


def self_test() -> None:
    import tempfile
    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)
        dataset = root / "dataset.json"
        make_selftest_dataset(dataset)
        argv = argparse.Namespace(
            dataset=str(dataset), output=str(root / "out"), device="cpu", steps=2, batch_size=2,
            d_model=24, heads=4, layers=1, ff=48, dropout=0.0, max_len=64,
            lr=3e-4, generation_samples=2, max_generation_units=16, temperature=0.9, top_k=5,
            progress=False,
        )
        run_training(argv)
        report = json.loads((root / "out" / "phase5-block3-training.json").read_text(encoding="utf-8"))
        assert len(report["results"]) == 4
        assert all(item["training"]["steps"] == 2 for item in report["results"])
        assert all(item["validation"]["phrases"] > 0 for item in report["results"])
    print("PHASE5 BLOCK3 PYTORCH SELF-TEST: OK")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset")
    parser.add_argument("--output")
    parser.add_argument("--device", default="cuda")
    parser.add_argument("--steps", type=int, default=120)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--d-model", type=int, default=192)
    parser.add_argument("--heads", type=int, default=6)
    parser.add_argument("--layers", type=int, default=4)
    parser.add_argument("--ff", type=int, default=768)
    parser.add_argument("--dropout", type=float, default=0.1)
    parser.add_argument("--max-len", type=int, default=1536)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--generation-samples", type=int, default=12)
    parser.add_argument("--max-generation-units", type=int, default=384)
    parser.add_argument("--temperature", type=float, default=0.9)
    parser.add_argument("--top-k", type=int, default=20)
    parser.add_argument("--progress", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    if args.self_test:
        self_test()
        return
    if not args.dataset or not args.output:
        raise SystemExit("--dataset e --output sono obbligatori")
    run_training(args)


if __name__ == "__main__":
    main()
