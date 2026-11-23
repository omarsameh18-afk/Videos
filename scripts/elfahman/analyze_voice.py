# Per-sentence clip analysis: speech start/end and internal pauses (RMS envelope, 10 ms hops).
import subprocess, sys, json, numpy as np
SR = 44100
def load(p):
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar',str(SR),'-f','s16le','-'],capture_output=True).stdout
    return np.frombuffer(raw,dtype=np.int16).astype(np.float32)/32768
def segments(x, thr_db=-40, hop=0.01, min_sil=0.08):
    n=int(SR*hop); frames=len(x)//n
    rms=np.sqrt(np.mean(x[:frames*n].reshape(frames,n)**2,axis=1)+1e-12)
    db=20*np.log10(rms); peak=db.max()
    voiced=db>max(thr_db, peak-38)
    idx=np.where(voiced)[0]
    start,end=idx[0]*hop,(idx[-1]+1)*hop
    sils=[]; i=idx[0]
    while i<idx[-1]:
        if not voiced[i]:
            j=i
            while j<idx[-1] and not voiced[j]: j+=1
            if (j-i)*hop>=min_sil: sils.append((round(i*hop,3),round(j*hop,3)))
            i=j
        else: i+=1
    return start,end,sils
if __name__=='__main__':
    out={}
    for p in sys.argv[1:]:
        x=load(p); s,e,sil=segments(x)
        out[p]=dict(dur=len(x)/SR,start=s,end=e,sils=sil)
        print(p, f"dur={len(x)/SR:.2f} speech={s:.2f}-{e:.2f}", [(a,b,round(b-a,2)) for a,b in sil])
