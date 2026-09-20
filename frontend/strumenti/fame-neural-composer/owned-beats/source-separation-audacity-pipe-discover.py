#!/usr/bin/env python3
"""Audacity mod-script-pipe discovery for FAME Neural Source Separation.

Metadata/UI discovery only:
- requires Audacity already running with mod-script-pipe enabled;
- sends GetInfo/Help scripting commands;
- does not import audio;
- does not invoke OpenVINO Music Separation;
- does not change Audacity preferences.

Windows note:
Python's normal open() can return EINVAL on Audacity named-pipe endpoints.
This helper opens the pipes with CreateFileW and then wraps the Win32
handles as binary Python file objects.
"""
from __future__ import annotations

import argparse
import ctypes
from ctypes import wintypes
import json
import msvcrt
import os
import sys

KEYWORDS = ("openvino", "music separation", "separation")

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


def matching_lines(text: str):
    lines = []
    for line in text.splitlines():
        low = line.lower()
        if any(k in low for k in KEYWORDS):
            lines.append(line)
    return lines


def _create_file_handle(name: str, access: int):
    handle = kernel32.CreateFileW(
        name,
        access,
        0,
        None,
        OPEN_EXISTING,
        0,
        None,
    )
    if handle == INVALID_HANDLE_VALUE:
        error = ctypes.get_last_error()
        if error == ERROR_PIPE_BUSY:
            if not kernel32.WaitNamedPipeW(name, PIPE_WAIT_MS):
                raise ctypes.WinError(ctypes.get_last_error())
            handle = kernel32.CreateFileW(
                name,
                access,
                0,
                None,
                OPEN_EXISTING,
                0,
                None,
            )
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
    payload = (command + "\r\n\0").encode("utf-8")
    to_file.write(payload)
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
            "pipeTransport": "WIN32_CREATEFILEW_BINARY",
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
