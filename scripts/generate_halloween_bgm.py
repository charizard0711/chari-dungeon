"""Original Halloween audition cues; synthesized instruments, no sampled music."""
from pathlib import Path
import json, wave, math, sys
import numpy as np
from generate_boss_bgm import Mix, SAMPLE_RATE as SR, kick, snare, tom, midi_freq
OUT=Path(__file__).resolve().parents[1]/'public/assets/audio/halloween-candidates-v1'
OUT.mkdir(parents=True,exist_ok=True)
SPECS=[
('map_01','マップ','真夜中のお菓子迷路',92,4,57,'musicbox','オルゴールと弦のつま弾き。かわいさの奥に不気味さ。',True),
('map_02','マップ','霧灯りのハロウィン・ワルツ',78,3,50,'celesta','ゆったりした3拍子。霧の中で幽霊が踊る。',False),
('map_03','マップ','魔女の書庫と笑うカボチャ',106,4,55,'harpsichord','チェンバロと低い木管。いたずら好きな魔女。',False),
('mid_01','中ボス','パンプキン・ナイト・マーチ',132,4,50,'brass','小太鼓と弦、金管。カボチャ騎士の行進。',True),
('mid_02','中ボス','トリック・オア・バトル！',156,4,57,'harpsichord','高速チェンバロとドラム。軽快なハロウィン戦闘。',False),
('mid_03','中ボス','亡霊たちの仮面舞踏会',126,3,53,'strings','激しい3拍子。弦とオルガンの妖しい舞踏会。',False),
('boss_01','ラスボス','呪われた収穫王の玉座',112,4,45,'organ','重いオルガンと合唱。探索の旋律が王の決戦へ。',True),
('boss_02','ラスボス','茨の王冠、終焉の収穫祭',138,4,48,'brass','低音の弦から金管と合唱へ。後半で覚醒。',False),
('boss_03','ラスボス','ジャックの最後の晩餐',124,3,50,'musicbox','不気味なオルゴールから激しい3拍子へ。',False),
('gold_01','特殊金ボス','黄金の収穫祭 ― 王の覚醒',152,4,45,'brass','王の旋律を鐘と合唱で拡張。黄金の決戦。',True),
('gold_02','特殊金ボス','金色の悪夢と氷翠の伝説',128,4,54,'celesta','澄んだ氷の音と金管。氷翠の伝説へ。',False),
('gold_03','特殊金ボス','一夜限りの黄金王',172,4,47,'strings','時計の音と高速の弦。大爆発へ向かう緊張。',False),
]
# Deliberately scored melodic phrases, in harmonic-minor semitones.
MOTIFS=[
[0,7,12,11,7,3,2,0, 3,7,8,7,3,2,11,0],
[0,3,7,12,11,7, 8,7,3,2,11,0],
[0,2,3,7,6,7,12,11, 8,7,3,2,0,11,7,0],
[0,0,7,7,12,11,7,3, 5,5,8,7,3,2,11,0],
[0,3,7,12,11,12,7,3, 2,5,8,14,12,11,7,0],
[0,7,12,11,8,7, 3,8,14,12,11,0],
[0,7,12,11,7,3,2,0, 8,7,5,3,2,11,7,0],
[0,2,3,7,12,14,15,14, 12,11,8,7,5,3,11,0],
[0,7,3,12,11,7, 8,7,2,11,7,0],
[0,7,12,11,7,3,2,0, 12,15,14,11,8,7,11,12],
[0,7,12,14,15,14,12,11, 8,12,15,19,14,11,7,12],
[0,1,0,7,8,7,11,12, 15,14,12,11,8,7,2,0],
]

def pluck(note,duration,kind):
    t=np.arange(max(1,int(duration*SR)))/SR;f=midi_freq(note);phase=2*np.pi*f*t
    if kind in ('musicbox','celesta'):
        ratios=(1,2,3.98,6.02) if kind=='musicbox' else (1,2.01,3,5.03)
        sig=sum(np.sin(phase*r)*g*np.exp(-t*d) for r,g,d in zip(ratios,(1,.34,.16,.08),(3,5,8,13)))
    else:
        sig=sum(np.sin(phase*h)/h**.85 for h in range(1,9))*np.exp(-t*9)
    attack=np.minimum(t/.003,1);release=np.minimum((duration-t)/.04,1)
    return sig*attack*np.maximum(release,0)*.65

def compose(index,spec,game_loop=False):
    key,group,title,bpm,meter,root,lead,desc,fav=spec
    beat=60/bpm;bars=16;length=bars*meter*beat;mix=Mix(length+1.8,np.random.default_rng(4040+index))
    combat=group!='マップ';royal=group in ('ラスボス','特殊金ボス');gold=group=='特殊金ボス'
    progression=[(0,[0,3,7]),(8,[0,4,7]),(5,[0,3,7]),(7,[0,4,7]),(0,[0,3,7]),(3,[0,4,7]),(8,[0,4,7]),(7,[0,4,7])]
    motif=MOTIFS[index]
    def note(n,start,dur,kind,gain,pan=0):
        if kind in ('musicbox','celesta','harpsichord','pizz'):mix.add(pluck(n,dur,'harpsichord' if kind=='pizz' else kind),start,gain,pan)
        else:mix.note(n,start,dur,kind,gain,pan)
    for bar in range(bars):
        t0=bar*meter*beat;degree,intervals=progression[bar%8];bass=root+degree-12
        # B section shifts contour and adds counterpoint, not just louder duplication.
        section=bar>=8
        chord=[root+degree+v for v in intervals]
        mix.chord(chord,t0,meter*beat*.94,'choir' if royal and section else 'strings',.065 if not combat else .12)
        if royal:mix.chord([n-12 for n in chord],t0,meter*beat*.88,'organ',.09)
        for b in range(meter):
            note(bass+(12 if b%2 else 0),t0+b*beat,beat*.75,'bass' if combat else 'organ',.10 if combat else .045,-.1)
            if not combat or index in (4,5,8):
                arp=chord[b%3]+12
                note(arp,t0+b*beat,beat*.42,'pizz' if index!=1 else 'celesta',.075,-.5)
                note(chord[(b+1)%3]+12,t0+(b+.5)*beat,beat*.42,'harpsichord' if index==2 else 'pizz',.045,.5)
        step=.5 if combat and index not in (6,8) else 1
        # Repeated two-bar phrases with written cadences and rest punctuation.
        for k in range(int(meter/step)):
            phrase=(bar%4)*int(meter/step)+k
            n=root+12+motif[phrase%len(motif)]
            if section and bar%4<2:n+=12 if gold or index in (4,7) else 3
            if bar%4==3 and k==int(meter/step)-1:continue
            kind=lead
            if index==8 and section:kind='strings'
            note(n,t0+k*step*beat,step*beat*.82,kind,.13 if not combat else .17,.18)
        if section:
            for b in (0,meter-1):note(chord[(bar+b)%3]+12,t0+(b+.25)*beat,beat*.62,'celesta' if gold else 'strings',.055,-.35)
        if combat:
            for b in (0,2) if meter==4 else (0,):mix.add(kick(),t0+b*beat,.16 if not royal else .24)
            for b in (1,3) if meter==4 else (1,2):mix.add(snare(mix.rng),t0+b*beat,.06 if index!=3 else .10,.2)
            if royal:
                for b in (0,meter-1):mix.add(tom(35+(bar%3)*2),t0+b*beat,.13,-.3)
            if bar%4==3:
                for k in range(3):mix.add(tom(45-k*3),t0+(meter-1+k*.25)*beat,.08,(-.4+k*.4))
        if gold or index in (0,1,8):
            if bar%4==0:note(root+24+degree,t0,beat*2,'bell',.09,.55)
        if index==11:
            for b in range(meter*2):mix.add(pluck(96 if b%2 else 91,.055,'harpsichord'),t0+b*.5*beat,.04,(-.6 if b%2 else .6))
    if game_loop:
        cycle=int(length*SR);audio=mix.audio[:cycle].copy();tail=mix.audio[cycle:]
        audio[:len(tail)]+=tail
        dry=audio.copy()
        for delay,gain in [(0.093,.144),(0.171,.10),(0.287,.065),(0.413,.04)]:
            audio+=np.roll(dry,int(delay*SR),axis=0)[:,::-1]*gain
        audio=np.tanh(audio);audio*=.65/max(1e-8,float(np.max(np.abs(audio))))
        destination=OUT.parent/'halloween-v1';destination.mkdir(exist_ok=True)
    else:
        audio=mix.master(.65)
        fade=int(SR*1.4);audio[-fade:]*=np.linspace(1,0,fade)[:,None]
        destination=OUT
    path=destination/f'{key}.wav'
    with wave.open(str(path),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(audio,-1,1)*32767).astype('<i2').tobytes())
    rms=float(np.sqrt(np.mean(audio**2)));peak=float(np.max(np.abs(audio)))
    assert rms>.01 and peak<.99 and np.isfinite(audio).all()
    return dict(id=key,group=group,title=title,bpm=bpm,meter=meter,description=desc,recommended=fav,duration=round(len(audio)/SR,2),rms=round(rms,4),peak=round(peak,4),url=f'../assets/audio/halloween-candidates-v1/{key}.wav')

if __name__=='__main__':
    tracks=[]
    game_loop="--game-loops" in sys.argv
    for i,spec in enumerate(SPECS):
        if game_loop and not spec[-1]:continue
        track=compose(i,spec,game_loop);tracks.append(track);print(track['id'],track['title'],track['duration'],flush=True)
    ((OUT.parent/'halloween-v1' if game_loop else OUT)/'tracks.json').write_text(json.dumps(tracks,ensure_ascii=False,indent=2),encoding='utf-8')
