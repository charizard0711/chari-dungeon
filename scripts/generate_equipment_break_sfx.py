from pathlib import Path
import numpy as np, wave, json
SR=44100
root=Path(__file__).resolve().parents[1]
out=root/'public/assets/audio/equipment-break-candidates-v1';out.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(104)
def noise(d,decay,high=False):
 t=np.arange(int(SR*d))/SR;n=rng.normal(0,1,len(t))
 if high:n=np.r_[0,np.diff(n)]*.5
 else:n=np.convolve(n,np.ones(7)/7,'same')
 return n*np.exp(-t*decay)*np.minimum(t/.001,1)
def ring(d,f,decay):
 t=np.arange(int(SR*d))/SR
 return sum(np.sin(2*np.pi*f*r*t)*np.exp(-t*(decay+i*2))/(i+1) for i,r in enumerate([1,1.49,2.13,2.87,4.11]))*np.minimum(t/.001,1)
def make(key,name,kind,style):
 a=np.zeros(int(SR*1.6))
 def add(s,at,g):
  start=int(at*SR);n=min(len(s),len(a)-start);a[start:start+n]+=s[:n]*g
 if kind=='weapon':
  add(noise(.13,40,True),.015,.8);add(ring(.65,[720,410,1080][style],9),.015,.65)
  for i in range(5):add(ring(.23,1100+i*211,19),.14+i*.052,.11)
  if style==1:add(noise(.25,22),.015,1.1);add(ring(.35,135,16),.02,.5)
  if style==2:
   for i in range(7):add(ring(.55,1800+i*390,7),.05+i*.03,.12)
 else:
  add(ring(.5,[115,78,180][style],13),.015,.85);add(noise(.24,24),.015,1.4)
  for i in range(8):add(noise(.12,35,True),.11+i*.045,.22);add(ring(.35,520+i*157,14),.11+i*.045,.15)
  if style==2:
   for i in range(7):add(ring(.65,1500+i*275,6),.03+i*.042,.14)
 # Short room reflections, then soft limiter and common listening peak.
 dry=a.copy()
 for delay,gain in [(.031,.16),(.061,.09)]:
  n=int(delay*SR);a[n:]+=dry[:-n]*gain
 a=np.tanh(a*1.1);a*=.72/max(np.max(np.abs(a)),1e-9)
 a[-int(.15*SR):]*=np.linspace(1,0,int(.15*SR))
 last=np.flatnonzero(np.abs(a)>.0004);a=a[:min(len(a),last[-1]+int(.08*SR))]
 with wave.open(str(out/(key+'.wav')),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((a*32767).astype('<i2').tobytes())
 return {'key':key,'name':name,'duration':round(len(a)/SR,2),'peak':round(float(np.max(abs(a))),3)}
specs=[('weapon_01','武器① 鋼の刃が折れる（おすすめ）','weapon',0),('weapon_02','武器② 重い武器がへし折れる','weapon',1),('weapon_03','武器③ 魔法の刃が砕ける','weapon',2),('shield_01','盾① 金属の盾が割れる（おすすめ）','shield',0),('shield_02','盾② 重い盾が崩れる','shield',1),('shield_03','盾③ 魔法の盾が砕ける','shield',2)]
results=[make(*s) for s in specs]
(out/'manifest.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
html='''<!doctype html><html lang="ja"><meta charset="utf-8"><title>装備破損音の試聴</title><style>body{background:#111722;color:#eee;font-family:Meiryo,sans-serif;max-width:850px;margin:40px auto;padding:20px}h1{color:#e6c883}section{padding:16px;background:#222c3e;border-radius:12px;margin:14px 0}audio{width:100%}p{color:#b7c5d8}</style><h1>武器・盾が壊れる音</h1><p>各3種類。ゲームにはまだ組み込んでいません。最初は音量控えめでお試しください。</p>'''
for r in results:html+=f'<section><h2>{r["name"]}</h2><audio controls preload="metadata" src="../assets/audio/equipment-break-candidates-v1/{r["key"]}.wav"></audio></section>'
html+='''<script>document.querySelectorAll('audio').forEach(a=>{a.volume=.6;a.addEventListener('play',()=>document.querySelectorAll('audio').forEach(b=>{if(a!==b)b.pause()}))})</script></html>'''
(root/'qa/equipment-break-sfx.html').write_text(html,encoding='utf-8')
print(json.dumps(results,ensure_ascii=False))

