"""Metrics and full-frame diagnostics for P3 controlled Audio-to-MIDI."""
import librosa
import numpy as np

def prf(tp,fp,fn):
    p=tp/(tp+fp) if tp+fp else 0.0; r=tp/(tp+fn) if tp+fn else 0.0
    f=2*p*r/(p+r) if p+r else 0.0
    return {"tp":int(tp),"fp":int(fp),"fn":int(fn),"precision":round(p,6),"recall":round(r,6),"f1":round(f,6)}

def match(adjacency,n_est):
    owner=[-1]*n_est
    def visit(i,seen):
        for j in adjacency[i]:
            if seen[j]: continue
            seen[j]=True
            if owner[j]<0 or visit(owner[j],seen): owner[j]=i; return True
        return False
    tp=sum(1 for i in range(len(adjacency)) if visit(i,[False]*n_est))
    pairs=sorted((i,j) for j,i in enumerate(owner) if i>=0)
    return tp,pairs

def drum_metrics(refs,ests,tol):
    roles={"kick","snare","hihat"}; refs=[x for x in refs if x.get("role") in roles]
    adj=[[j for j,e in enumerate(ests) if e.get("role")==r.get("role") and abs(float(e["timeSeconds"])-float(r["timeSeconds"]))<=tol] for r in refs]
    tp,pairs=match(adj,len(ests)) if refs else (0,[])
    out=prf(tp,len(ests)-tp,len(refs)-tp)
    out.update({"referenceSupportedEvents":len(refs),"estimatedEvents":len(ests),"onsetToleranceSeconds":tol,
      "matches":[{"referenceIndex":i,"estimatedIndex":j,"role":refs[i]["role"],"referenceTimeSeconds":refs[i]["timeSeconds"],"estimatedTimeSeconds":ests[j]["timeSeconds"],"absoluteErrorSeconds":round(abs(float(ests[j]["timeSeconds"])-float(refs[i]["timeSeconds"])),6)} for i,j in pairs]})
    by={}
    for role in sorted(roles):
        rr=[x for x in refs if x["role"]==role]; ee=[x for x in ests if x.get("role")==role]
        aa=[[j for j,e in enumerate(ee) if abs(float(e["timeSeconds"])-float(r["timeSeconds"]))<=tol] for r in rr]
        t,_=match(aa,len(ee)) if rr else (0,[])
        by[role]=prf(t,len(ee)-t,len(rr)-t)
    out["byClass"]=by
    return out

def unsupported_drum(refs,ests,tol):
    rows=[]
    for r in [x for x in refs if x.get("unsupportedByBaseline") is True]:
        near=[{"role":e.get("role"),"timeSeconds":e.get("timeSeconds"),"absoluteErrorSeconds":round(abs(float(e["timeSeconds"])-float(r["timeSeconds"])),6)} for e in ests if abs(float(e["timeSeconds"])-float(r["timeSeconds"]))<=tol]
        rows.append({"referenceRole":r.get("role"),"referenceTimeSeconds":r.get("timeSeconds"),"predictedSupportedRolesNearReference":near})
    return {"unsupportedReferenceEvents":len(rows),"mappedToSupportedRoleCount":sum(bool(x["predictedSupportedRolesNearReference"]) for x in rows),"events":rows,"policy":"diagnostic only; unsupported clap/rim are not relabeled for scoring"}

def lowend_metrics(refs,ests,cfg):
    on=float(cfg["onsetToleranceSeconds"]); pc=float(cfg["pitchToleranceCents"]); ratio=float(cfg["offsetRatio"]); minimum=float(cfg["offsetMinimumSeconds"])
    adj=[]; details={}
    for i,r in enumerate(refs):
        cand=[]
        for j,e in enumerate(ests):
            oe=abs(float(e["startSeconds"])-float(r["startSeconds"])); pe=abs(float(e["midiNote"])-float(r["midiNote"]))*100
            od=abs(float(e["endSeconds"])-float(r["endSeconds"])); ot=max(minimum,ratio*(float(r["endSeconds"])-float(r["startSeconds"])))
            if oe<=on and pe<=pc and od<=ot: cand.append(j); details[(i,j)]=(oe,pe,od,ot)
        adj.append(cand)
    tp,pairs=match(adj,len(ests)) if refs else (0,[])
    out=prf(tp,len(ests)-tp,len(refs)-tp)
    out.update({"referenceNotes":len(refs),"estimatedNotes":len(ests),"matches":[{"referenceIndex":i,"estimatedIndex":j,"onsetErrorSeconds":round(details[(i,j)][0],6),"pitchErrorCents":round(details[(i,j)][1],6),"offsetErrorSeconds":round(details[(i,j)][2],6),"offsetToleranceSeconds":round(details[(i,j)][3],6)} for i,j in pairs]})
    return out

def full_pyin(y,protocol):
    c=protocol["lowEnd"]["primaryArm"]; sr=int(c["sampleRate"]); hop=int(c["hopLength"])
    f0,flag,prob=librosa.pyin(y=y,sr=sr,fmin=float(c["fminHz"]),fmax=float(c["fmaxHz"]),frame_length=int(c["frameLength"]),hop_length=hop,resolution=.1)
    f0=np.asarray(f0,float); flag=np.asarray(flag,bool); prob=np.asarray(prob,float); times=librosa.times_like(f0,sr=sr,hop_length=hop); threshold=float(c["voicedProbabilityAtLeast"])
    rows=[]; counts={"accepted":0,"nonFiniteF0":0,"unvoicedFlag":0,"belowProbabilityThreshold":0}
    for i,t in enumerate(times):
        finite=bool(np.isfinite(f0[i])); p=float(prob[i]) if np.isfinite(prob[i]) else 0.0
        reason="nonFiniteF0" if not finite else "unvoicedFlag" if not bool(flag[i]) else "belowProbabilityThreshold" if p<threshold else "accepted"; counts[reason]+=1
        rows.append({"frame":i,"timeSeconds":round(float(t),6),"f0Hz":round(float(f0[i]),6) if finite else None,"midiFloat":round(float(librosa.hz_to_midi(f0[i])),6) if finite else None,"voicedFlag":bool(flag[i]),"voicedProbability":round(p,6),"decision":reason})
    return {"frameCount":len(rows),"decisionCounts":counts,"frames":rows}

def glide_diagnostic(refs,diag):
    if not refs: return None
    accepted=[x for x in diag["frames"] if x["decision"]=="accepted" and x["midiFloat"] is not None]
    if not accepted: return {"acceptedFramesInRange":0,"medianAbsolutePitchErrorCents":None,"p90AbsolutePitchErrorCents":None}
    rt=np.asarray([float(x["timeSeconds"]) for x in refs]); rm=np.asarray([float(x["midiFloat"]) for x in refs]); lo,hi=rt[0],rt[-1]; errors=[]
    for f in accepted:
        t=float(f["timeSeconds"])
        if lo<=t<=hi: errors.append(abs(float(f["midiFloat"])-float(np.interp(t,rt,rm)))*100)
    return {"acceptedFramesInRange":len(errors),"medianAbsolutePitchErrorCents":round(float(np.median(errors)),6) if errors else None,"p90AbsolutePitchErrorCents":round(float(np.percentile(errors,90)),6) if errors else None}
