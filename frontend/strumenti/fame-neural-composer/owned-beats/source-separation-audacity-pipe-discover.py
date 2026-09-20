#!/usr/bin/env python3
"""Audacity mod-script-pipe discovery for FAME Neural Source Separation.

Metadata/UI discovery only:
- requires Audacity already running with mod-script-pipe enabled;
- sends GetInfo/Help scripting commands;
- does not import audio;
- does not invoke OpenVINO Music Separation;
- does not change Audacity preferences.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

KEYWORDS = ("openvino", "music separation", "separation")

def matching_lines(text: str):
    lines = []
    for line in text.splitlines():
        low = line.lower()
        if any(k in low for k in KEYWORDS):
            lines.append(line)
    return lines

def open_pipe():
    if sys.platform != "win32":
        raise RuntimeError("This discovery helper currently supports Windows only")
    to_name = r"\\.\pipe\ToSrvPipe"
    from_name = r"\\.\pipe\FromSrvPipe"
    if not os.path.exists(to_name) or not os.path.exists(from_name):
        raise RuntimeError(
            "Audacity script pipe not ready. Enable mod-script-pipe, restart Audacity and leave it open."
        )
    to_file = open(to_name, "w", encoding="utf-8", newline="")
    from_file = open(from_name, "r", encoding="utf-8", newline="")
    return to_file, from_file

def send(to_file, from_file, command: str):
    to_file.write(command + "\r\n\0")
    to_file.flush()
    chunks = []
    while True:
        line = from_file.readline()
        if line == "":
            raise RuntimeError("Audacity script pipe closed while waiting for response")
        if line == "\n" and chunks:
            break
        chunks.append(line)
    return "".join(chunks)

def main():
    ap = argparse.ArgumentParser()
    ap.parse_args()

    to_file, from_file = open_pipe()
    try:
        responses = {}
        for name, command in (
            ("getInfoHelp", 'Help: Command="GetInfo"'),
            ("commands", "GetInfo: Type=Commands"),
            ("menus", "GetInfo: Type=Menus"),
        ):
            responses[name] = send(to_file, from_file, command)

        matches = {
            key: matching_lines(value)
            for key, value in responses.items()
        }

        print(json.dumps({
            "mode": "SOURCE_SEPARATION_AUDACITY_PIPE_DISCOVERY",
            "pipeReady": True,
            "audioOpenedByThisCommand": False,
            "sourceSeparationExecutedByThisCommand": False,
            "preferencesModifiedByThisCommand": False,
            "matches": matches,
            "rawResponseLengths": {k: len(v) for k, v in responses.items()},
            "nextAction": (
                "BUILD_BATCH_ADAPTER_FROM_DISCOVERED_COMMAND"
                if any(matches.values())
                else "INSPECT_RAW_AUDACITY_COMMAND_SURFACE"
            ),
        }, indent=2))
    finally:
        to_file.close()
        from_file.close()

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"SOURCE SEPARATION PIPE DISCOVERY FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
