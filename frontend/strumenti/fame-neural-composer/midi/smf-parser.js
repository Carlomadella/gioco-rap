"use strict";

class MidiParseError extends Error {
  constructor(message, offset = null) {
    super(offset == null ? message : `${message} (offset ${offset})`);
    this.name = "MidiParseError";
    this.offset = offset;
  }
}

function ensure(buffer, offset, length, label) {
  if (offset < 0 || length < 0 || offset + length > buffer.length) {
    throw new MidiParseError(`MIDI troncato durante ${label}`, offset);
  }
}

function readAscii(buffer, offset, length) {
  ensure(buffer, offset, length, "lettura chunk id");
  return buffer.subarray(offset, offset + length).toString("ascii");
}

function readUInt16BE(buffer, offset) {
  ensure(buffer, offset, 2, "lettura uint16");
  return buffer.readUInt16BE(offset);
}

function readUInt32BE(buffer, offset) {
  ensure(buffer, offset, 4, "lettura uint32");
  return buffer.readUInt32BE(offset);
}

function readVlq(buffer, state, limit) {
  let value = 0;
  let count = 0;
  while (true) {
    if (state.pos >= limit) throw new MidiParseError("VLQ troncato", state.pos);
    const byte = buffer[state.pos++];
    value = (value << 7) | (byte & 0x7f);
    count += 1;
    if (!(byte & 0x80)) return value >>> 0;
    if (count >= 4) throw new MidiParseError("VLQ oltre 4 byte non supportato", state.pos - 1);
  }
}

function signedInt8(value) {
  return value > 127 ? value - 256 : value;
}

function decodeText(buffer) {
  return buffer.toString("utf8").replace(/\0/g, "").trim();
}

function channelDataLength(status) {
  const high = status & 0xf0;
  if (high === 0xc0 || high === 0xd0) return 1;
  if (high >= 0x80 && high <= 0xe0) return 2;
  return null;
}

function pushProgram(track, tick, channel, program) {
  track.programChanges.push({ tick, channel, program });
}

function noteKey(channel, note) {
  return `${channel}:${note}`;
}

function parseTrack(buffer, start, length, index) {
  const end = start + length;
  ensure(buffer, start, length, `track ${index}`);

  const state = { pos: start };
  const track = {
    index,
    name: "",
    instrumentName: "",
    notes: [],
    programChanges: [],
    pitchBends: [],
    controlChanges: [],
    meta: [],
    warnings: [],
    endTick: 0
  };

  const openNotes = new Map();
  const programByChannel = Array(16).fill(0);
  let tick = 0;
  let runningStatus = null;

  function closeNote(channel, note, velocityOff) {
    const key = noteKey(channel, note);
    const queue = openNotes.get(key);
    if (!queue || queue.length === 0) {
      track.warnings.push({ code: "UNMATCHED_NOTE_OFF", tick, channel, note });
      return;
    }
    const opened = queue.shift();
    if (queue.length === 0) openNotes.delete(key);
    track.notes.push({
      channel,
      note,
      velocity: opened.velocity,
      velocityOff,
      startTick: opened.tick,
      durationTicks: Math.max(1, tick - opened.tick),
      program: opened.program
    });
  }

  while (state.pos < end) {
    const delta = readVlq(buffer, state, end);
    tick += delta;
    track.endTick = Math.max(track.endTick, tick);

    if (state.pos >= end) throw new MidiParseError(`Evento track ${index} senza status`, state.pos);
    let status = buffer[state.pos];
    let firstData = null;

    if (status < 0x80) {
      if (runningStatus == null) throw new MidiParseError(`Running status senza status precedente nel track ${index}`, state.pos);
      status = runningStatus;
      firstData = buffer[state.pos++];
    } else {
      state.pos += 1;
      if (status < 0xf0) runningStatus = status;
      else if (status !== 0xff) runningStatus = null;
    }

    if (status === 0xff) {
      if (state.pos >= end) throw new MidiParseError("Meta event senza tipo", state.pos);
      const type = buffer[state.pos++];
      const metaLength = readVlq(buffer, state, end);
      ensure(buffer, state.pos, metaLength, `meta 0x${type.toString(16)}`);
      const data = buffer.subarray(state.pos, state.pos + metaLength);
      state.pos += metaLength;

      const meta = { tick, type };
      if (type === 0x03) {
        meta.trackName = decodeText(data);
        if (!track.name) track.name = meta.trackName;
      } else if (type === 0x04) {
        meta.instrumentName = decodeText(data);
        if (!track.instrumentName) track.instrumentName = meta.instrumentName;
      } else if (type === 0x51 && metaLength === 3) {
        const usPerQuarter = data.readUIntBE(0, 3);
        meta.usPerQuarter = usPerQuarter;
        meta.bpm = 60000000 / usPerQuarter;
      } else if (type === 0x58 && metaLength >= 2) {
        meta.numerator = data[0];
        meta.denominator = 2 ** data[1];
        if (metaLength >= 4) {
          meta.clocksPerMetronome = data[2];
          meta.thirtySecondsPerQuarter = data[3];
        }
      } else if (type === 0x59 && metaLength >= 2) {
        meta.sharpsFlats = signedInt8(data[0]);
        meta.minor = data[1] === 1;
      } else if (type === 0x2f) {
        track.meta.push(meta);
        break;
      }
      track.meta.push(meta);
      continue;
    }

    if (status === 0xf0 || status === 0xf7) {
      const sysexLength = readVlq(buffer, state, end);
      ensure(buffer, state.pos, sysexLength, "SysEx");
      state.pos += sysexLength;
      continue;
    }

    const dataLength = channelDataLength(status);
    if (dataLength == null) throw new MidiParseError(`Status MIDI non supportato 0x${status.toString(16)}`, state.pos - 1);

    const data = [];
    if (firstData != null) data.push(firstData);
    while (data.length < dataLength) {
      if (state.pos >= end) throw new MidiParseError("Evento channel MIDI troncato", state.pos);
      data.push(buffer[state.pos++]);
    }

    const high = status & 0xf0;
    const channel = status & 0x0f;
    const a = data[0];
    const b = data[1];

    if (high === 0x90) {
      if (b === 0) {
        closeNote(channel, a, b);
      } else {
        const key = noteKey(channel, a);
        const queue = openNotes.get(key) || [];
        queue.push({ tick, velocity: b, program: programByChannel[channel] });
        openNotes.set(key, queue);
      }
    } else if (high === 0x80) {
      closeNote(channel, a, b);
    } else if (high === 0xc0) {
      programByChannel[channel] = a;
      pushProgram(track, tick, channel, a);
    } else if (high === 0xe0) {
      const raw14 = (b << 7) | a;
      track.pitchBends.push({ tick, channel, value: raw14 - 8192 });
    } else if (high === 0xb0) {
      track.controlChanges.push({ tick, channel, controller: a, value: b });
    }
  }

  for (const [key, queue] of openNotes.entries()) {
    const [channelText, noteText] = key.split(":");
    for (const opened of queue) {
      track.warnings.push({
        code: "UNCLOSED_NOTE_ON",
        tick: opened.tick,
        channel: Number(channelText),
        note: Number(noteText)
      });
    }
  }

  track.notes.sort((a, b) => a.startTick - b.startTick || a.channel - b.channel || a.note - b.note);
  track.pitchBends.sort((a, b) => a.tick - b.tick || a.channel - b.channel);
  return track;
}

function parseSmf(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buffer.length < 14) throw new MidiParseError("File troppo corto per essere Standard MIDI File");
  if (readAscii(buffer, 0, 4) !== "MThd") throw new MidiParseError("Header MThd mancante", 0);

  const headerLength = readUInt32BE(buffer, 4);
  if (headerLength < 6) throw new MidiParseError(`Header MIDI invalido: ${headerLength} byte`, 4);
  ensure(buffer, 8, headerLength, "header MIDI");

  const format = readUInt16BE(buffer, 8);
  const trackCount = readUInt16BE(buffer, 10);
  const division = readUInt16BE(buffer, 12);

  if (![0, 1].includes(format)) throw new MidiParseError(`Formato MIDI ${format} non supportato (solo 0/1)`);
  if (trackCount < 1) throw new MidiParseError("MIDI senza track");
  if (division & 0x8000) throw new MidiParseError("Divisione SMPTE non supportata: serve PPQ metrica");
  if (division < 24) throw new MidiParseError(`PPQ non valido o troppo basso: ${division}`);

  let offset = 8 + headerLength;
  const tracks = [];
  for (let i = 0; i < trackCount; i += 1) {
    ensure(buffer, offset, 8, `header track ${i}`);
    if (readAscii(buffer, offset, 4) !== "MTrk") throw new MidiParseError(`Chunk MTrk ${i} mancante`, offset);
    const length = readUInt32BE(buffer, offset + 4);
    const start = offset + 8;
    tracks.push(parseTrack(buffer, start, length, i));
    offset = start + length;
  }

  const tempos = [];
  const timeSignatures = [];
  const keySignatures = [];
  const warnings = [];
  for (const track of tracks) {
    warnings.push(...track.warnings.map(w => ({ ...w, trackIndex: track.index })));
    for (const meta of track.meta) {
      if (meta.usPerQuarter) tempos.push({ tick: meta.tick, bpm: meta.bpm, usPerQuarter: meta.usPerQuarter, trackIndex: track.index });
      if (meta.numerator) timeSignatures.push({ tick: meta.tick, numerator: meta.numerator, denominator: meta.denominator, trackIndex: track.index });
      if (meta.sharpsFlats != null) keySignatures.push({ tick: meta.tick, sharpsFlats: meta.sharpsFlats, minor: meta.minor, trackIndex: track.index });
    }
  }

  const sortMeta = (a, b) => a.tick - b.tick || a.trackIndex - b.trackIndex;
  tempos.sort(sortMeta);
  timeSignatures.sort(sortMeta);
  keySignatures.sort(sortMeta);

  return {
    format,
    ppq: division,
    trackCount,
    tracks,
    tempos,
    timeSignatures,
    keySignatures,
    warnings
  };
}

module.exports = {
  MidiParseError,
  parseSmf,
  readVlq
};
