"""Deterministic synthetic audio helpers for P3 controlled fixtures."""
import hashlib, math, random, struct, wave
from pathlib import Path


def seed_for(text):
    return int.from_bytes(hashlib.sha256(text.encode("utf-8")).digest()[:8], "big")


def midi_hz(note):
    return 440.0 * (2.0 ** ((float(note) - 69.0) / 12.0))


def add_signal(target, start_index, signal):
    for i, value in enumerate(signal):
        j = start_index + i
        if 0 <= j < len(target):
            target[j] += value


def kick(sr, seed):
    out=[0.0]*int(round(.28*sr)); phase=0.0; rnd=random.Random(seed)
    for i in range(len(out)):
        t=i/sr; env=math.exp(-t*17); freq=48+105*math.exp(-t*23); phase+=2*math.pi*freq/sr
        out[i]=.88*env*math.sin(phase)+(rnd.random()*2-1)*math.exp(-t*115)*.12
    return out


def snare(sr, seed):
    out=[0.0]*int(round(.20*sr)); phase=0.0; prev=0.0; rnd=random.Random(seed)
    for i in range(len(out)):
        t=i/sr; env=math.exp(-t*20); x=rnd.random()*2-1; hp=x-.72*prev; prev=x; phase+=2*math.pi*185/sr
        out[i]=.58*env*hp+.24*env*math.sin(phase)
    return out


def hihat(sr, seed):
    out=[0.0]*int(round(.085*sr)); prev=0.0; rnd=random.Random(seed)
    for i in range(len(out)):
        t=i/sr; env=math.exp(-t*52); x=rnd.random()*2-1; hp=x-.985*prev; prev=x; out[i]=.42*env*hp
    return out


def clap(sr, seed):
    out=[0.0]*int(round(.14*sr)); rnd=random.Random(seed)
    for offset in (0.0,.012,.026):
        start=int(round(offset*sr))
        for j in range(int(round(.06*sr))):
            i=start+j
            if i>=len(out): break
            out[i]+=.28*math.exp(-(j/sr)*34)*(rnd.random()*2-1)
    return out


def rim(sr, seed):
    out=[0.0]*int(round(.065*sr)); a=b=0.0
    for i in range(len(out)):
        t=i/sr; env=math.exp(-t*62); a+=2*math.pi*1720/sr; b+=2*math.pi*930/sr
        out[i]=env*(.50*math.sin(a)+.24*math.sin(b))
    return out


def add_bass_note(target, sr, start_s, end_s, midi_note):
    start=max(0,int(round(start_s*sr))); end=min(len(target),int(round(end_s*sr))); phase=0.0; freq=midi_hz(midi_note); total=max(1,end-start)
    for j,i in enumerate(range(start,end)):
        env=min(1.0,(j/sr)/.012,((total-j)/sr)/.045); phase+=2*math.pi*freq/sr
        target[i]+=.62*env*(math.sin(phase)+.16*math.sin(2*phase))


def add_bass_glide(target, sr, glide):
    start=max(0,int(round(float(glide["startSeconds"])*sr))); end=min(len(target),int(round(float(glide["endSeconds"])*sr)))
    count=max(1,end-start); phase=0.0; lo=float(glide["startMidi"]); hi=float(glide["endMidi"])
    for j,i in enumerate(range(start,end)):
        u=j/max(1,count-1); freq=midi_hz(lo+(hi-lo)*u); env=min(1.0,(j/sr)/.012,((count-j)/sr)/.045); phase+=2*math.pi*freq/sr
        target[i]+=.58*env*(math.sin(phase)+.12*math.sin(2*phase))


def normalize(drums,bass):
    mix=[a+b for a,b in zip(drums,bass)]; peak=max([1e-9]+[abs(x) for x in drums]+[abs(x) for x in bass]+[abs(x) for x in mix]); scale=min(1.0,.92/peak)
    return [x*scale for x in drums],[x*scale for x in bass],[x*scale for x in mix]


def write_wav(path,samples,sr):
    pcm=bytearray()
    for sample in samples:
        value=int(round(max(-1.0,min(1.0,float(sample)))*32767)); pcm.extend(struct.pack("<h",value))
    with wave.open(str(Path(path)),"wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(bytes(pcm))


def glide_reference(glide):
    start=float(glide["startSeconds"]); end=float(glide["endSeconds"]); lo=float(glide["startMidi"]); hi=float(glide["endMidi"]); step=float(glide["referencePointStepSeconds"]); out=[]; t=start
    while t<=end+1e-9:
        u=max(0.0,min(1.0,(t-start)/(end-start))); midi=lo+(hi-lo)*u
        out.append({"timeSeconds":round(t,6),"midiFloat":round(midi,6),"frequencyHz":round(midi_hz(midi),6)}); t+=step
    return out


def build_fixture(fixture,audio_cfg):
    sr=int(audio_cfg["sampleRate"]); duration=float(audio_cfg["durationSeconds"]); count=int(round(sr*duration)); drums=[0.0]*count; bass=[0.0]*count
    makers={"kick":kick,"snare":snare,"hihat":hihat,"clap":clap,"rim":rim}
    for idx,event in enumerate(fixture.get("drumEvents",[])):
        role=event["role"]
        if role not in makers: raise RuntimeError(f"Unknown fixture drum role: {role}")
        add_signal(drums,int(round(float(event["timeSeconds"])*sr)),makers[role](sr,seed_for(f"{fixture['id']}|{idx}|{role}")))
    for note in fixture.get("lowEndNotes",[]): add_bass_note(bass,sr,float(note["startSeconds"]),float(note["endSeconds"]),float(note["midiNote"]))
    glide=fixture.get("lowEndGlide")
    if glide: add_bass_glide(bass,sr,glide)
    drums,bass,mix=normalize(drums,bass)
    ref={"schema":"fame-owned-beats-audio-to-midi-p3-controlled-reference-v1","version":1,"fixtureId":fixture["id"],"domain":fixture["domain"],"factor":fixture["factor"],"durationSeconds":duration,"sampleRate":sr,"drumEvents":fixture.get("drumEvents",[]),"lowEndNotes":fixture.get("lowEndNotes",[]),"lowEndGlide":glide,"lowEndPitchReference":glide_reference(glide) if glide else []}
    return drums,bass,mix,ref
