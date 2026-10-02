"""Original layered game explosion; deterministic DSP, no sampled recordings."""
from pathlib import Path
import wave
import numpy as np
SR=48000
N=int(SR*1.35)
t=np.arange(N)/SR
rng=np.random.default_rng(20261002)
def band(lo,hi):
    noise=rng.normal(size=N)
    freq=np.fft.rfftfreq(N,1/SR)
    window=np.clip((freq-lo)/max(10,lo*.4),0,1)*np.clip((hi-freq)/max(30,hi*.4),0,1)
    out=np.fft.irfft(np.fft.rfft(noise)*window,n=N)
    return out/(np.std(out)+1e-9)
attack=1-np.exp(-t/.0008)
crack=band(900,7000)*np.exp(-t/.025)*.27
body=band(100,1800)*np.exp(-t/.14)*.31
rumble=band(25,180)*np.exp(-t/.40)*.30
low=np.sin(2*np.pi*(45*t+38*.09*(1-np.exp(-t/.09))))*np.exp(-t/.24)*.24
mono=(crack+body+rumble+low)*attack
# The short reflections broaden the impact, while the low end remains centered.
left=mono.copy();right=mono.copy()
for delay,gain in [(0.034,.12),(0.067,.08),(0.11,.045)]:
    shift=int(delay*SR)
    left[shift:]+=mono[:-shift]*gain
    right[shift+67:]+=mono[:-(shift+67)]*gain
stereo=np.stack([left,right],axis=1)
stereo-=np.mean(stereo,axis=0)
stereo*=np.minimum(1,(1.35-t)/.14)[:,None]
stereo*=.84/np.max(np.abs(stereo))
path=Path(__file__).resolve().parents[1]/'public/assets/audio/se_dynamite.wav'
with wave.open(str(path),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR)
    f.writeframes(np.rint(stereo*32767).astype('<i2').tobytes())
print(f'{path}: 1.35s stereo, peak {np.max(np.abs(stereo)):.2f}, RMS {np.sqrt(np.mean(stereo**2)):.3f}')
