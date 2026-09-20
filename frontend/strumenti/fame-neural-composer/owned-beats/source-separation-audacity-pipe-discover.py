#!/usr/bin/env python3
"""Audacity mod-script-pipe discovery for FAME Neural Source Separation.

Metadata/UI discovery only:
- requires Audacity already running with mod-script-pipe enabled;
- sends GetInfo scripting commands;
- does not import audio;
- does not invoke OpenVINO Music Separation;
- does not change Audacity preferences.

Windows named pipes are opened with CreateFileW because Python's normal
open() can return EINVAL on Audacity pipe endpoints.
"""
from __future__ import annotations

import argparse
import ctypes
from ctypes import wintypes
import json
import os
import sys

if sys.platform == "win32":
    import msvcrt
else:
    msvcrt = None

TARGET_TEXT = "openvino music separation"
GENERIC_READ = 0x80000000
GENERIC_WRITE = 0x40000000
OPEN_EXISTING = 3
ERROR_PIPE_BUSY = 231
PIPE_WAIT_MS = 5000
INVALID_HANDLE_VALUE = ctypes.c_void_p(-1).value

kernel32 = ctypes.WinDLL("kernel32", use_last_error=True) if sys.platform == "win32" else None

if kernel32 is not None:
    kernel32.CreateFileW.argtypes = (
        wintypes.LPCWSTR,
        wintypes.DWORD,
        wintypes.DWORD,
        wintypes.LPVOID,
        wintypes.DWORD,
        wintypes.DWORD,
        wintypes.HANDLE,
    )
    kernel32.CreateFileW.restype = wintypes.HANDLE
    kernel32.WaitNamedPipeW.argtypes = (wintypes.LPCWSTR, wintypes.DWORD)
    kernel32.WaitNamedPipeW.restype = wintypes.BOOL
    kernel32.CloseHandle.argtypes = (wintypes.HANDLE,)
    kernel32.CloseHandle.restype = wintypes.BOOL


def decode_first_json(text: str):
    decoder = json.JSONDecoder()
    for i, ch in enumerate(text):
        if ch not in "[{":
            continue
        try:
            value, _ = decoder.raw_decode(text[i:])
            return value
        except json.JSONDecodeError:
            continue
    raise RuntimeError("Audacity GetInfo response does not contain decodable JSON")


def contains_target(value):
    if isinstance(value, dict):
        haystack = " ".join(str(value.get(k, "")) for k in ("id", "name", "label", "tip", "url"))
        return TARGET_TEXT in haystack.lower()
    return TARGET_TEXT in str(value).lower()


def exact_matches(value):
    if not isinstance(value, list):
        return []
    return [item for item in value if contains_target(item)]


def _create_file_handle(name: str, access: int):
    handle = kernel32.CreateFileW(name, access, 0, None, OPEN_EXISTING, 0, None)
    if handle == INVALID_HANDLE_VALUE:
        error = ctypes.get_last_error()
        if error == ERROR_PIPE_BUSY:
            if not kernel32.WaitNamedPipeW(name, PIPE_WAIT_MS):
                raise ctypes.WinError(ctypes.get_last_error())
            handle = kernel32.CreateFileW(name, access, 0, None, OPEN_EXISTING, 0, None)
        if handle == INVALID_HANDLE_VALUE:
            raise ctypes.WinError(ctypes.get_last_error())
    return handle


def _handle_to_binary_file(handle, flags: int, mode: str):
    try:
        fd = msvcrt.open_osfhandle(handle, flags | os.O_BINARY)
    except Exception:
        kernel32.CloseHandle(handle)
        raise
    if fd == -1:
        kernel32.CloseHandle(handle)
        raise OSError("open_osfhandle failed")
    return os.fdopen(fd, mode, buffering=0)


def open_pipe():
    if sys.platform != "win32":
        raise RuntimeError("This discovery helper currently supports Windows only")

    to_name = r"\\.\pipe\ToSrvPipe"
    from_name = r"\\.\pipe\FromSrvPipe"

    try:
        to_handle = _create_file_handle(to_name, GENERIC_WRITE)
    except OSError as exc:
        raise RuntimeError(
            "Audacity ToSrvPipe not ready. Enable mod-script-pipe, restart Audacity and leave it open."
        ) from exc

    try:
        from_handle = _create_file_handle(from_name, GENERIC_READ)
    except Exception:
        kernel32.CloseHandle(to_handle)
        raise

    try:
        to_file = _handle_to_binary_file(to_handle, os.O_WRONLY, "wb")
    except Exception:
        kernel32.CloseHandle(from_handle)
        raise

    try:
        from_file = _handle_to_binary_file(from_handle, os.O_RDONLY, "rb")
    except Exception:
        to_file.close()
        raise

    return to_file, from_file


def send(to_file, from_file, command: str):
    to_file.write((command + "\r\n\0").encode("utf-8"))
    to_file.flush()

    chunks = []
    while True:
        line = from_file.readline()
        if line == b"":
            raise RuntimeError("Audacity script pipe closed while waiting for response")
        if line in (b"\n", b"\r\n") and chunks:
            break
        chunks.append(line)

    return b"".join(chunks).decode("utf-8", errors="replace")


def self_test():
    commands = """
noise before
[
  {"id":"Normalize","name":"Normalize","params":[]},
  {"id":"OpenVINOMusicSeparation","name":"OpenVINO Music Separation","params":[],"tip":"Split stems"}
]
BatchCommand finished: OK
"""
    menus = """
[
 {"label":"OpenVINO Music Separation...","id":"Effect_Audacity_OpenVINO AI Effects_OpenVINO Music Separation_Built-in Effect: OpenVINO Music Separation"},
 {"label":"OpenVINO Whisper Transcription...","id":"other"}
]
"""
    c = exact_matches(decode_first_json(commands))
    m = exact_matches(decode_first_json(menus))
    assert len(c) == 1 and c[0]["id"] == "OpenVINOMusicSeparation"
    assert len(m) == 1 and "Music Separation" in m[0]["label"]
    print("source-separation-audacity-pipe-discover self-test: PASS")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        self_test()
        return

    to_file, from_file = open_pipe()
    try:
        commands_raw = send(to_file, from_file, "GetInfo: Type=Commands")
        menus_raw = send(to_file, from_file, "GetInfo: Type=Menus")

        commands = exact_matches(decode_first_json(commands_raw))
        menus = exact_matches(decode_first_json(menus_raw))

        command = commands[0] if len(commands) == 1 else None
        params = command.get("params", []) if isinstance(command, dict) else []
        has_params = bool(params)

        if len(commands) == 1 and has_params:
            next_action = "FREEZE_BATCH_COMMAND_PARAMETERS"
        elif len(commands) == 1:
            next_action = "SCRIPTING_COMMAND_HAS_NO_AUTOMATABLE_PARAMS_REVIEW_BACKEND"
        else:
            next_action = "TARGET_COMMAND_NOT_UNIQUELY_EXPOSED_REVIEW_BACKEND"

        print(json.dumps({
            "mode": "SOURCE_SEPARATION_AUDACITY_PIPE_TARGET_DISCOVERY",
            "pipeReady": True,
            "pipeTransport": "WIN32_CREATEFILEW_BINARY",
            "target": "OpenVINO Music Separation",
            "targetCommandMatches": commands,
            "targetMenuMatches": menus,
            "targetCommandUnique": len(commands) == 1,
            "targetHasAutomatableParams": has_params,
            "targetAutomatableParams": params,
            "audioOpenedByThisCommand": False,
            "sourceSeparationExecutedByThisCommand": False,
            "preferencesModifiedByThisCommand": False,
            "nextAction": next_action,
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
