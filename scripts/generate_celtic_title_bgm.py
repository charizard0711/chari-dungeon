"""Original 6/8 Celtic title theme: Wind over the Emerald Ruins."""
from pathlib import Path
import numpy as np,wave,json
from generate_boss_bgm import Mix,SAMPLE_RATE as SR,midi_freq
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/assets/audio/title-celtic-v1';OUT.mkdir(parents=True,exist_ok=True)
eighth=60/112/3;bar=eighth*6;length=32*bar;mix=Mix(length+4,np.random.default_rng(611));rng=np.random.default_rng(122)
def sound(n,d,k):
 t=np.arange(int(SR*d))/SR;f=midi_freq(n);phase=2*np.pi*f*t+.07*np.sin(2*np.pi*5*t)
 if k=='harp':
  s=sum(np.sin(2*np.pi*f*h*t)*np.exp(-t*(2.2+h*.55))/(h**1.5) for h in range(1,10));env=np.minimum(t/.003,1)
 elif k=='whistle':
  s=np.sin(phase)+.23*np.sin(phase*2)+.07*np.sin(phase*3);s+=rng.normal(0,.009,len(t));env=np.minimum(t/.027,1)*np.minimum((d-t)/.055,1)
 elif k=='fiddle':
  s=sum((np.sin(phase*h)+.25*np.sin(2*np.pi*f*1.003*t*h))/(h**1.45) for h in range(1,10));env=np.minimum(t/.07,1)*np.minimum((d-t)/.12,1)
 else:s=np.sin(phase)+.15*np.sin(phase*2);env=np.minimum(t/.03,1)*np.minimum((d-t)/.15,1)
 return s*env/max(np.max(abs(s)),1e-6)
def note(n,at,d,k,g,pan=0):mix.add(sound(n,d,k),at,g,pan)
# D major with a Celtic modal turn (C natural in the contrasting phrase).
chords=[(50,[62,66,69]),(47,[59,62,66]),(43,[55,59,62]),(45,[57,61,64])]
melody=[[74,76,78,81,78,76],[74,69,74,78,76,74],[71,74,78,79,78,74],[76,73,69,73,76,81],[78,81,86,85,81,78],[79,78,76,74,76,78],[74,72,71,69,71,74],[73,76,81,78,76,73]]
for b in range(32):
 at=b*bar;root,ch=chords[b%4]
 for j,n in enumerate([ch[0],ch[1],ch[2],ch[0]+12,ch[2],ch[1]]):note(n,at+j*eighth,.95,'harp',.17,(-.45 if j%2 else .4))
 for j in [0,3]:note(root,at+j*eighth,eighth*2.8,'bass',.16,-.15)
 if b>=4:
  phrase=melody[(b-4)%8]
  for j,n in enumerate(phrase):
   # Alternate flowing jig notes and longer cadences.
   if b%4==3 and j==5:continue
   dur=eighth*(1.85 if b%4==3 and j==4 else .88)
   note(n,at+j*eighth,dur,'whistle',.19 if b<12 else .24,.08)
   if b>=12 and b<28:note(n-12,at+j*eighth,dur+.04,'fiddle',.115,-.32)
 if 8<=b<28:
  for j in [0,3]:
   t=np.arange(int(SR*.36))/SR;drum=(np.sin(2*np.pi*(88*t-18*t*t))+.16*np.sin(2*np.pi*157*t))*np.exp(-t*13)*np.minimum(t/.003,1);mix.add(drum,at+j*eighth,.16 if j==0 else .09)
  for j in [2,5]:
   t=np.arange(int(SR*.1))/SR;mix.add(rng.normal(0,1,len(t))*np.exp(-t*55)*.12,at+j*eighth,.06,.25)
 # Upper harp answers introduce a new phrase without an orchestral blast.
 if b>=20 and b<28:
  for j in [1,4]:note(ch[(j+b)%3]+12,at+j*eighth,1,'harp',.07,.6)
n=int(length*SR);a=mix.audio[:n].copy();tail=mix.audio[n:];a[:len(tail)]+=tail
for delay,gain in [(.057,.1),(.137,.07),(.263,.045),(.431,.025)]:a+=np.roll(mix.audio[:n],int(SR*delay),axis=0)[:,::-1]*gain
a=np.tanh(a*.9);a*=.7/max(np.max(abs(a)),1e-9);seam=int(SR*.01);a[:seam]*=np.linspace(0,1,seam)[:,None];a[-seam:]*=np.linspace(1,0,seam)[:,None]
path=OUT/'emerald-ruins.wav'
with wave.open(str(path),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((a*32767).astype('<i2').tobytes())
print(json.dumps({'seconds':length,'peak':float(np.max(abs(a))),'loopSeam':float(np.max(abs(a[0]-a[-1])))}))
