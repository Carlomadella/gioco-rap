# Tsumugi drums_v1_5 — checkpoint metadata confirmed

Data: 23 settembre 2026.

Environment doctor operator-reported against the frozen checkpoint:

- source commit: `f7411471a4de0ad3d430191de11b8623d67e5b38`;
- checkpoint SHA256: `65138ad1dd919f33fb0ce56e54c0c23c87deaad6511132d69137cf4901ee9319`;
- checkpoint bytes: `57150497`;
- `sample_rate=22050`;
- `hop_length=512`;
- `n_fft=2048`;
- **`semi_crf_version=v1`**;
- **`num_pitch_slots=1`**;
- `num_instrument_classes=36`;
- input audio channels: 2;
- CUDA available on NVIDIA GeForce RTX 5070 Ti;
- source/fixture audio opened by doctor: no;
- transcription/source separation/training: no.

The local doctor output was pasted by the operator; this repository record does not independently read the local checkpoint bytes. The reported SHA/byte size match the already-frozen environment specification.

## Consequence

The earlier pair-gate diagnostic design was incompatible with this checkpoint. `pair_gate_logits` belongs to the V2 head. The V1 checkpoint must be diagnosed through its actual pitch-wise outputs: `interval_query`, `interval_key`, `interval_diag` and persisted decoder/final-note statistics.
