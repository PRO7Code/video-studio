"""Original music bed for the reel (generated procedurally -> no licensing issues).
120 BPM, A minor. Section times are aligned with scene cuts in src/timeline.ts."""
import numpy as np, wave, sys
SR=44100; BPM=120; BEAT=60/BPM; DUR=39.6
N=int(SR*DUR); t=np.arange(N)/SR
L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(7)
def midi(m): return 440*2**((m-69)/12)
def add(sig,start,pan=0.0,gain=1.0):
    i=int(start*SR); j=min(N,i+len(sig)); 
    if i>=N: return
    s=sig[:j-i]*gain; L[i:j]+=s*np.sqrt((1-pan)/2); R[i:j]+=s*np.sqrt((1+pan)/2)
def env(n,a,d):
    e=np.ones(n); na=max(1,int(a*SR)); e[:na]=np.linspace(0,1,na)
    e*=np.exp(-np.arange(n)/SR/d) if d else 1; return e
# sections (s)
TITLE=2.8; ACT1=6.0; LAPTOP=15.4; ACT2=17.4; ACT3=22.0; OUTRO=31.6
# --- pad: chord progression Am F C G (2 bars each = 4s)
chords=[[57,60,64,69],[53,57,60,65],[48,55,60,64],[55,59,62,67]]
def pad_level(x):
    lv=np.interp(x,[0,0.4,TITLE,ACT1,ACT2,ACT2+0.5,ACT3,OUTRO,DUR-2.5,DUR],[0.0,0.55,0.6,0.5,0.5,0.75,0.45,0.7,0.6,0])
    return lv
pad=np.zeros(N)
for k in range(int(DUR/4)+1):
    ch=chords[k%4]; s=k*4.0; n=int(4.6*SR); tt=np.arange(n)/SR
    e=np.minimum(1,tt/0.6)*np.minimum(1,np.maximum(0,(4.6-tt)/0.8))
    sig=sum(np.sin(2*np.pi*midi(m)*tt*(1+d))+0.0 for m in ch for d in (-0.003,0.003))
    sig+=0.4*sum(np.sin(2*np.pi*midi(m)*2*tt) for m in ch)*0.3
    i=int(s*SR); j=min(N,i+n)
    if i<N: pad[i:j]+=(sig*e)[:j-i]
# soft lowpass via moving avg
pad=np.convolve(pad,np.ones(12)/12,'same')*pad_level(t)*0.05
L+=pad; R+=pad
# --- bass (root, 8th pulse) from ACT1
roots=[45,41,36,43]
for b in range(int(ACT1/BEAT*2),int(OUTRO/BEAT*2)):
    st=b*BEAT/2; root=roots[int(st//4)%4]; n=int(0.24*SR); tt=np.arange(n)/SR
    sig=np.tanh(2*np.sin(2*np.pi*midi(root)*tt))*np.exp(-tt/0.12)
    g=0.10 if not (ACT2<=st<ACT3) else 0.05
    add(sig,st,0,g)
# --- kick
def kick():
    n=int(0.45*SR); tt=np.arange(n)/SR
    f=48+110*np.exp(-tt/0.035); ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-tt/0.16)
K=kick()
for b in range(int(ACT1/BEAT),int(OUTRO/BEAT)):
    st=b*BEAT
    if ACT2<=st<ACT3 and b%2: continue
    if ACT3-1.0<=st<ACT3: continue  # break before drop
    add(K,st,0,0.42)
# --- hats (16ths in act3, 8ths in act1)
def hat(d=0.04):
    n=int(0.08*SR); x=rng.standard_normal(n); x=np.diff(x,prepend=0); return x*np.exp(-np.arange(n)/SR/d)
for s16 in range(int(ACT1/BEAT*4),int(OUTRO/BEAT*4)):
    st=s16*BEAT/4
    if ACT3-1.0<=st<ACT3: continue
    if st<ACT3 and s16%2: continue
    acc=0.05 if s16%4==2 else 0.025
    add(hat(),st,0.3 if s16%2 else -0.3,acc)
# --- arpeggio pluck (Am pentatonic-ish over chord)
for s16 in range(int(TITLE/BEAT*4),int((DUR-2)/BEAT*4)):
    st=s16*BEAT/4
    if st<ACT1 and s16%2: continue
    ch=chords[int(st//4)%4]; m=ch[[0,2,1,3,2,1,3,2][s16%8]]+12
    n=int(0.35*SR); tt=np.arange(n)/SR
    sig=(np.sin(2*np.pi*midi(m)*tt)+0.3*np.sin(2*np.pi*midi(m)*2*tt))*np.exp(-tt/0.09)
    g=0.035 if st<ACT3 else 0.045
    if ACT2<=st<ACT3: g=0.022
    add(sig,st+0.0,0.45*np.sin(s16*0.7),g)
# --- impacts & riser
def impact():
    n=int(2.5*SR); tt=np.arange(n)/SR
    boom=np.sin(2*np.pi*(38+60*np.exp(-tt/0.08))*tt)*np.exp(-tt/0.7)
    nz=rng.standard_normal(n)*np.exp(-tt/0.25); nz=np.convolve(nz,np.ones(30)/30,'same')
    return boom*0.9+nz*0.6
for s,g in [(0,0.6),(ACT3,0.55),(OUTRO,0.35)]: add(impact(),s,0,g)
for s,g in [(TITLE,0.18),(ACT1,0.2),(LAPTOP,0.15),(ACT2,0.18)]:
    add(hat(0.25)*1.2,s,0,g)  # whoosh-ish ticks on cuts
# riser into act3
n=int(2.0*SR); tt=np.arange(n)/SR; nz=rng.standard_normal(n)
w=int(1); riser=np.zeros(n)
for k in range(8):
    seg=slice(k*n//8,(k+1)*n//8); win=max(2,int(40-k*4.5))
    riser[seg]=np.convolve(nz,np.ones(win)/win,'same')[seg]
riser*=(tt/2.0)**2*0.5
add(riser,ACT3-2.0,0,1.0)
# --- simple reverb (exp-decaying noise IR via FFT)
ir_n=int(1.6*SR); ir=rng.standard_normal(ir_n)*np.exp(-np.arange(ir_n)/SR/0.45); ir/=np.sqrt((ir**2).sum())
def conv(x): 
    m=len(x)+ir_n; F=np.fft.rfft; return np.fft.irfft(F(x,m)*F(ir,m),m)[:len(x)]
L=L+0.22*conv(L); R=R+0.22*conv(R)
# master: fade, soft clip, normalize
fade=np.minimum(1,np.maximum(0,(DUR-t)/2.0)); L*=fade; R*=fade
peak=max(abs(L).max(),abs(R).max()); L=np.tanh(L/peak*1.3)*0.85; R=np.tanh(R/peak*1.3)*0.85
data=(np.stack([L,R],1)*32767).astype(np.int16)
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
print("ok",DUR)
