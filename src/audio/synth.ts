// ========================================================================
// 仮BGM/効果音のチップチューン合成
// 音源ファイル(assets/audio/*.mp3)が無い場合に、WebAudioの
// OfflineAudioContextでレトロ風のループ音源を生成する。
// 生成したAudioBufferはPhaserのオーディオキャッシュに登録して使う。
// ========================================================================
import type { BgmName, SeName } from './config';

// MIDIノート番号 → 周波数
const F = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

type Osc = OscillatorType | 'noise';

interface NoteEv { t: number; d: number; m: number } // 拍単位
interface Track { type: Osc; vol: number; decay?: number; notes: NoteEv[] }
interface Song { bpm: number; beats: number; tail?: number; tracks: Track[] }

// パターン配列を等間隔で並べる（nullは休符）
function seq(step: number, start: number, dur: number, pattern: (number | null)[]): NoteEv[] {
  const out: NoteEv[] = [];
  pattern.forEach((m, i) => {
    if (m !== null) out.push({ t: start + i * step, d: dur, m });
  });
  return out;
}

function loopPat(step: number, start: number, dur: number, pattern: (number | null)[], times: number): NoteEv[] {
  const span = pattern.length * step;
  const out: NoteEv[] = [];
  for (let i = 0; i < times; i++) out.push(...seq(step, start + i * span, dur, pattern));
  return out;
}

// ---------------- 楽曲定義 ----------------

// タイトル：明るく不思議なレトロ
function songTitle(): Song {
  const bass: NoteEv[] = [];
  const roots = [48, 53, 57, 55]; // C3 F3 A3 G3
  for (let b = 0; b < 8; b++) {
    const r = roots[b % 4];
    bass.push({ t: b * 4, d: 1.8, m: r }, { t: b * 4 + 2, d: 1.8, m: r + 7 });
  }
  const mel = loopPat(0.5, 0, 0.45, [
    72, null, 76, null, 79, null, 81, 79,
    76, null, 72, null, 74, 76, 74, null,
    69, null, 72, null, 76, null, 79, 76,
    72, null, 74, null, 72, null, null, null
  ], 2);
  const spark = seq(8, 3.5, 0.4, [96, 100, 96, 103]);
  return {
    bpm: 112, beats: 32, tracks: [
      { type: 'triangle', vol: 0.22, notes: bass },
      { type: 'square', vol: 0.11, notes: mel },
      { type: 'sine', vol: 0.1, notes: spark }
    ]
  };
}

// 1-10F 地下遺跡：探索感のある16bit風
function songRuins(): Song {
  const bass: NoteEv[] = [];
  const roots = [45, 45, 43, 43, 41, 41, 40, 40]; // Am Am G G F F E E
  for (let b = 0; b < 8; b++) {
    const r = roots[b];
    [r, r + 7, r + 12, r + 7].forEach((m, i) => bass.push({ t: b * 4 + i, d: 0.9, m }));
  }
  const lead: NoteEv[] = [
    { t: 0, d: 1.5, m: 69 }, { t: 2, d: 1, m: 72 }, { t: 4, d: 1.5, m: 71 }, { t: 6, d: 1, m: 74 },
    { t: 8, d: 2, m: 76 }, { t: 11, d: 1, m: 74 }, { t: 12, d: 2, m: 72 }, { t: 16, d: 1.5, m: 69 },
    { t: 18, d: 1, m: 67 }, { t: 20, d: 3, m: 64 }, { t: 24, d: 2, m: 69 }, { t: 26.5, d: 0.5, m: 71 },
    { t: 28, d: 3.5, m: 69 }
  ];
  const hat = loopPat(1, 0.5, 0.08, [110], 32);
  return {
    bpm: 96, beats: 32, tracks: [
      { type: 'triangle', vol: 0.22, notes: bass },
      { type: 'square', vol: 0.1, notes: lead },
      { type: 'noise', vol: 0.045, decay: 0.3, notes: hat }
    ]
  };
}

// 11-20F 機械迷宮：緊張感のある機械的リズム
function songMachine(): Song {
  const bass: NoteEv[] = [];
  for (let b = 0; b < 8; b++) {
    const pat = b % 4 === 3 ? [41, 41, 48, 41, 43, 41, 48, 50] : [40, 40, 47, 40, 43, 40, 47, 48];
    pat.forEach((m, i) => bass.push({ t: b * 4 + i * 0.5, d: 0.4, m }));
  }
  const blip: NoteEv[] = [];
  for (let b = 0; b < 8; b++) {
    blip.push(
      { t: b * 4 + 1.75, d: 0.15, m: b % 2 ? 79 : 76 },
      { t: b * 4 + 3.75, d: 0.15, m: b % 2 ? 83 : 79 }
    );
  }
  const kick = loopPat(2, 0, 0.2, [45], 16);
  const snare = [...loopPat(4, 1, 0.15, [80], 8), ...loopPat(4, 3, 0.15, [80], 8)];
  const hat = loopPat(0.5, 0.25, 0.06, [108], 64);
  return {
    bpm: 128, beats: 32, tracks: [
      { type: 'square', vol: 0.15, notes: bass },
      { type: 'square', vol: 0.08, notes: blip },
      { type: 'noise', vol: 0.14, decay: 0.4, notes: kick },
      { type: 'noise', vol: 0.07, decay: 0.35, notes: snare },
      { type: 'noise', vol: 0.035, decay: 0.25, notes: hat }
    ]
  };
}

// 21-29F 深層コア：危険で重い雰囲気
function songCore(): Song {
  const drone: NoteEv[] = [];
  const roots = [38, 39, 38, 36]; // D2 Eb2 D2 C2（フリジアン的な不穏さ）
  for (let b = 0; b < 8; b++) drone.push({ t: b * 4, d: 3.9, m: roots[b % 4] });
  const mel: NoteEv[] = [
    { t: 0, d: 3, m: 62 }, { t: 4, d: 2, m: 63 }, { t: 8, d: 3, m: 65 }, { t: 12, d: 2, m: 60 },
    { t: 16, d: 3, m: 62 }, { t: 20, d: 2, m: 58 }, { t: 24, d: 4, m: 57 }, { t: 28, d: 4, m: 50 }
  ];
  const rumble = loopPat(8, 0, 1.5, [40], 4);
  return {
    bpm: 76, beats: 32, tracks: [
      { type: 'sawtooth', vol: 0.12, notes: drone },
      { type: 'triangle', vol: 0.12, notes: mel },
      { type: 'noise', vol: 0.06, decay: 0.9, notes: rumble }
    ]
  };
}

// 30F 最深部：ラスボス前の緊張感
function songFinal(): Song {
  const bass: NoteEv[] = [];
  for (let b = 0; b < 8; b++) {
    const pat = [35, 35, 35, 35, 38, 38, 35, 34];
    pat.forEach((m, i) => bass.push({ t: b * 4 + i * 0.5, d: 0.4, m: b % 4 === 3 ? m + 1 : m }));
  }
  const arp: NoteEv[] = [];
  const chord = [59, 62, 65, 68]; // ディミニッシュ
  for (let b = 0; b < 8; b++) {
    for (let i = 0; i < 16; i++) {
      const idx = i < 8 ? i % 4 : 3 - (i % 4);
      arp.push({ t: b * 4 + i * 0.25, d: 0.2, m: chord[idx] + (b % 2 ? 1 : 0) });
    }
  }
  const kick = loopPat(1, 0, 0.18, [43], 32);
  const hat = loopPat(0.5, 0.25, 0.05, [110], 64);
  return {
    bpm: 150, beats: 32, tracks: [
      { type: 'sawtooth', vol: 0.17, notes: bass },
      { type: 'square', vol: 0.07, notes: arp },
      { type: 'noise', vol: 0.13, decay: 0.35, notes: kick },
      { type: 'noise', vol: 0.035, decay: 0.25, notes: hat }
    ]
  };
}

// クリア：勝利ジングル
function songClear(): Song {
  return {
    bpm: 140, beats: 8, tail: 1, tracks: [
      {
        type: 'square', vol: 0.15, notes: [
          { t: 0, d: 0.4, m: 72 }, { t: 0.5, d: 0.4, m: 76 }, { t: 1, d: 0.4, m: 79 }, { t: 1.5, d: 0.4, m: 84 },
          { t: 2, d: 1.4, m: 88 }, { t: 3.5, d: 0.4, m: 84 }, { t: 4, d: 3.5, m: 91 }
        ]
      },
      { type: 'triangle', vol: 0.2, notes: [{ t: 0, d: 2, m: 48 }, { t: 2, d: 2, m: 55 }, { t: 4, d: 3.5, m: 60 }] },
      { type: 'sine', vol: 0.1, notes: [{ t: 4.5, d: 0.3, m: 96 }, { t: 5, d: 0.3, m: 100 }, { t: 5.5, d: 2, m: 103 }] }
    ]
  };
}

// ゲームオーバー：敗北ジングル
function songGameover(): Song {
  return {
    bpm: 90, beats: 8, tail: 1.2, tracks: [
      {
        type: 'square', vol: 0.12, notes: [
          { t: 0, d: 1.2, m: 64 }, { t: 1.5, d: 1.2, m: 62 }, { t: 3, d: 1.2, m: 60 }, { t: 4.5, d: 3, m: 57 }
        ]
      },
      { type: 'sawtooth', vol: 0.09, notes: [{ t: 0, d: 7.5, m: 33 }] }
    ]
  };
}

const SONGS: Record<BgmName, () => Song> = {
  title: songTitle,
  ruins: songRuins,
  machine: songMachine,
  core: songCore,
  final: songFinal,
  clear: songClear,
  gameover: songGameover
};

// ---------------- レンダリング ----------------

function makeNoise(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function scheduleNote(ctx: OfflineAudioContext, noise: AudioBuffer, tr: Track, ev: NoteEv, spb: number) {
  const t0 = ev.t * spb;
  const d = ev.d * spb;
  const g = ctx.createGain();
  g.connect(ctx.destination);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(tr.vol, t0 + 0.008);
  const rel = Math.max(0.02, d * (tr.decay ?? 0.85));
  g.gain.setTargetAtTime(0, t0 + rel, 0.045);

  if (tr.type === 'noise') {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = F(ev.m);
    bp.Q.value = 1;
    src.connect(bp);
    bp.connect(g);
    src.start(t0);
    src.stop(t0 + d + 0.2);
  } else {
    const o = ctx.createOscillator();
    o.type = tr.type;
    o.frequency.value = F(ev.m);
    o.connect(g);
    o.start(t0);
    o.stop(t0 + d + 0.3);
  }
}

// 仮BGMを合成して AudioBuffer を返す
export async function renderBgm(name: BgmName): Promise<AudioBuffer> {
  const song = SONGS[name]();
  const sr = 44100;
  const spb = 60 / song.bpm;
  const len = song.beats * spb + (song.tail ?? 0);
  const ctx = new OfflineAudioContext(1, Math.ceil(sr * len), sr);
  const noise = makeNoise(ctx, 1);
  for (const tr of song.tracks) {
    for (const ev of tr.notes) scheduleNote(ctx, noise, tr, ev, spb);
  }
  return ctx.startRendering();
}

// ---------------- 効果音 ----------------

interface SeSeg { type: Osc; f0: number; f1?: number; t: number; d: number; vol: number }

const SE_SPECS: Record<SeName, { len: number; segs: SeSeg[] }> = {
  click: { len: 0.08, segs: [{ type: 'square', f0: 900, t: 0, d: 0.05, vol: 0.3 }] },
  step: { len: 0.08, segs: [{ type: 'noise', f0: 220, t: 0, d: 0.05, vol: 0.25 }] },
  attack: {
    len: 0.16, segs: [
      { type: 'square', f0: 700, f1: 180, t: 0, d: 0.12, vol: 0.25 },
      { type: 'noise', f0: 2500, t: 0, d: 0.06, vol: 0.12 }
    ]
  },
  hit: {
    len: 0.18, segs: [
      { type: 'noise', f0: 300, t: 0, d: 0.12, vol: 0.35 },
      { type: 'square', f0: 120, t: 0, d: 0.08, vol: 0.25 }
    ]
  },
  hurt: { len: 0.3, segs: [{ type: 'sawtooth', f0: 320, f1: 70, t: 0, d: 0.25, vol: 0.3 }] },
  kill: {
    len: 0.3, segs: [
      { type: 'square', f0: 660, t: 0, d: 0.07, vol: 0.22 },
      { type: 'square', f0: 880, t: 0.08, d: 0.07, vol: 0.22 },
      { type: 'square', f0: 1320, t: 0.16, d: 0.1, vol: 0.22 }
    ]
  },
  coin: {
    len: 0.26, segs: [
      { type: 'square', f0: 988, t: 0, d: 0.06, vol: 0.2 },
      { type: 'square', f0: 1319, t: 0.07, d: 0.16, vol: 0.2 }
    ]
  },
  pickup: {
    len: 0.2, segs: [
      { type: 'square', f0: 660, t: 0, d: 0.07, vol: 0.2 },
      { type: 'square', f0: 990, t: 0.08, d: 0.1, vol: 0.2 }
    ]
  },
  chest: {
    len: 0.3, segs: [
      { type: 'square', f0: 523, t: 0, d: 0.07, vol: 0.2 },
      { type: 'square', f0: 659, t: 0.08, d: 0.07, vol: 0.2 },
      { type: 'square', f0: 784, t: 0.16, d: 0.1, vol: 0.2 }
    ]
  },
  stairs: {
    // 階段を下りる足音（低くなるノイズのthud×4）＋降りた先の反響
    len: 0.85, segs: [
      { type: 'noise', f0: 260, t: 0.00, d: 0.06, vol: 0.32 },
      { type: 'noise', f0: 215, t: 0.15, d: 0.06, vol: 0.32 },
      { type: 'noise', f0: 175, t: 0.30, d: 0.06, vol: 0.32 },
      { type: 'noise', f0: 145, t: 0.45, d: 0.07, vol: 0.34 },
      { type: 'sine', f0: 620, f1: 300, t: 0.52, d: 0.28, vol: 0.16 },
      { type: 'triangle', f0: 300, f1: 190, t: 0.58, d: 0.22, vol: 0.12 }
    ]
  },
  levelup: {
    len: 0.5, segs: [
      { type: 'square', f0: 523, t: 0, d: 0.09, vol: 0.2 },
      { type: 'square', f0: 659, t: 0.09, d: 0.09, vol: 0.2 },
      { type: 'square', f0: 784, t: 0.18, d: 0.09, vol: 0.2 },
      { type: 'square', f0: 1047, t: 0.27, d: 0.18, vol: 0.22 }
    ]
  },
  heal: { len: 0.36, segs: [{ type: 'sine', f0: 400, f1: 900, t: 0, d: 0.3, vol: 0.25 }] },
  bomb: {
    len: 0.6, segs: [
      { type: 'noise', f0: 110, t: 0, d: 0.45, vol: 0.45 },
      { type: 'sine', f0: 70, f1: 40, t: 0, d: 0.3, vol: 0.35 }
    ]
  },
  warp: {
    len: 0.52, segs: [
      { type: 'sine', f0: 300, f1: 1200, t: 0, d: 0.22, vol: 0.22 },
      { type: 'sine', f0: 1200, f1: 300, t: 0.24, d: 0.22, vol: 0.22 }
    ]
  },
  break: {
    len: 0.3, segs: [
      { type: 'noise', f0: 800, t: 0, d: 0.18, vol: 0.35 },
      { type: 'square', f0: 160, f1: 90, t: 0.02, d: 0.15, vol: 0.2 }
    ]
  },
  seal: {
    len: 0.5, segs: [
      { type: 'triangle', f0: 220, t: 0, d: 0.4, vol: 0.25 },
      { type: 'triangle', f0: 330, t: 0.05, d: 0.35, vol: 0.15 }
    ]
  },
  deny: {
    len: 0.26, segs: [
      { type: 'square', f0: 130, t: 0, d: 0.08, vol: 0.25 },
      { type: 'square', f0: 110, t: 0.12, d: 0.1, vol: 0.25 }
    ]
  }
};

// 仮効果音を合成して AudioBuffer を返す
export async function renderSe(name: SeName): Promise<AudioBuffer> {
  const spec = SE_SPECS[name];
  const sr = 44100;
  const ctx = new OfflineAudioContext(1, Math.ceil(sr * (spec.len + 0.15)), sr);
  const noise = makeNoise(ctx, 0.8);
  for (const s of spec.segs) {
    const g = ctx.createGain();
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0, s.t);
    g.gain.linearRampToValueAtTime(s.vol, s.t + 0.005);
    g.gain.setTargetAtTime(0, s.t + s.d * 0.7, 0.04);
    if (s.type === 'noise') {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = s.f0;
      bp.Q.value = 0.9;
      src.connect(bp);
      bp.connect(g);
      src.start(s.t);
      src.stop(s.t + s.d + 0.1);
    } else {
      const o = ctx.createOscillator();
      o.type = s.type;
      o.frequency.setValueAtTime(s.f0, s.t);
      if (s.f1 !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(20, s.f1), s.t + s.d);
      o.connect(g);
      o.start(s.t);
      o.stop(s.t + s.d + 0.15);
    }
  }
  return ctx.startRendering();
}
