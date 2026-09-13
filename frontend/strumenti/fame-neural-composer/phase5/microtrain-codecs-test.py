"""Codec isolation regressions; stdlib only, no training or torch required."""
import copy
import unittest
from microtrain_codecs import Record, TokenCodec, CompoundCodec, fit_train_codec


def record(name, units):
    return Record(name, name, "fixture", 1, units)


class CodecTests(unittest.TestCase):
    def test_token_validation_cannot_expand_vocabulary(self):
        train = [record("train", ["<EOS>", "BAR=0", "NOTE=60"])]
        codec = TokenCodec(train, 100)
        before = dict(codec.token_to_id)
        with self.assertRaisesRegex(ValueError, "TRAIN_ONLY_CODEC_OOV"):
            codec.validate_units(["NOTE=61"])
        self.assertEqual(codec.token_to_id, before)
        with self.assertRaisesRegex(ValueError, "val/held-out"):
            fit_train_codec({"train": train, "val": [record("held-out", ["NOTE=61"])]}, {})

    def test_compound_unknown_field_or_value_is_not_silently_dropped(self):
        train = [record("train", [{"kind": "EVENT", "note": 60}])]
        codec = CompoundCodec(train, {})
        before = copy.deepcopy(codec.value_to_id)
        for word in ({"kind": "EVENT", "note": 61}, {"kind": "EVENT", "newField": 1}):
            with self.assertRaisesRegex(ValueError, "TRAIN_ONLY_CODEC_OOV"):
                codec.validate_units([word])
        self.assertEqual(codec.value_to_id, before)

    def test_all_bucket_has_no_effect_on_codec_or_schema(self):
        train = [record("train", [{"kind": "EVENT", "note": 60}])]
        buckets = {"train": train, "val": copy.deepcopy(train), "test": copy.deepcopy(train),
                   "all": [record("unrelated", [{"kind": "SECRET", "hidden": 999}])]}
        codec, token = fit_train_codec(buckets, {})
        self.assertFalse(token)
        self.assertNotIn("hidden", codec.fields)
        self.assertIsNone(codec.kind_id("SECRET"))
        self.assertEqual(codec.schema_for("EVENT", None), ["kind", "note"])

    def test_empty_train_fails_before_model_allocation(self):
        with self.assertRaisesRegex(ValueError, "Training split vuoto"):
            fit_train_codec({"train": [], "all": [record("val", ["x"])]}, {})


if __name__ == "__main__":
    unittest.main()
