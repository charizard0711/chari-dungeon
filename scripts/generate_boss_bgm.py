from __future__ import annotations

import math
import wave
from dataclasses import dataclass
from pathlib import Path

import numpy as np


SAMPLE_RATE = 32_000
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public" / "assets" / "audio" / "boss-candidates"


def midi_freq(note: float) -> float:
    return 440.0 * (2.0 ** ((note - 69.0) / 12.0))


def envelope(length: int, attack: float, release: float, sustain: float = 0.78) -> np.ndarray:
    env = np.ones(length, dtype=np.float64) * sustain
    attack_n = min(length, max(1, int(attack * SAMPLE_RATE)))
    release_n = min(length, max(1, int(release * SAMPLE_RATE)))
    env[:attack_n] = np.linspace(0.0, 1.0, attack_n, endpoint=False)
    decay_n = min(max(0, length - attack_n - release_n), int(0.12 * SAMPLE_RATE))
    if decay_n:
        env[attack_n:attack_n + decay_n] = np.linspace(1.0, sustain, decay_n, endpoint=False)
    env[-release_n:] *= np.linspace(1.0, 0.0, release_n)
    return env


def synth_tone(note: float, duration: float, kind: str, velocity: float = 1.0) -> np.ndarray:
    n = max(1, int(duration * SAMPLE_RATE))
    t = np.arange(n, dtype=np.float64) / SAMPLE_RATE
    freq = midi_freq(note)
    vibrato = 1.0 + 0.0025 * np.sin(2 * np.pi * 5.1 * t)
    phase = 2 * np.pi * freq * t * vibrato

    if kind == "bass":
        sig = sum(np.sin(phase * h) / (h ** 1.15) for h in range(1, 7))
        sig = np.tanh(sig * 0.82)
        env = envelope(n, 0.008, min(0.10, duration * 0.3), 0.72)
    elif kind == "strings":
        sig = sum(np.sin(phase * h) / h for h in range(1, 8))
        sig += 0.42 * sum(np.sin(phase * 1.006 * h) / h for h in range(1, 6))
        env = envelope(n, 0.09, min(0.25, duration * 0.35), 0.68)
    elif kind == "organ":
        sig = (np.sin(phase) + 0.58 * np.sin(phase * 2) + 0.36 * np.sin(phase * 3)
               + 0.22 * np.sin(phase * 4) + 0.14 * np.sin(phase * 6))
        env = envelope(n, 0.055, min(0.32, duration * 0.35), 0.88)
    elif kind == "choir":
        formant = 0.72 * np.sin(phase) + 0.42 * np.sin(phase * 2.01) + 0.23 * np.sin(phase * 3.02)
        breath = 0.05 * np.sin(phase * 0.5) * np.sin(2 * np.pi * 2.7 * t)
        sig = formant + breath
        env = envelope(n, 0.18, min(0.38, duration * 0.35), 0.82)
    elif kind == "brass":
        sig = sum(np.sin(phase * h) / (h ** 0.82) for h in range(1, 8))
        sig = np.tanh(sig * (0.75 + 0.22 * np.minimum(t / 0.18, 1.0)))
        env = envelope(n, 0.035, min(0.24, duration * 0.35), 0.74)
    elif kind == "pulse":
        sig = np.sign(np.sin(phase)) * 0.72 + np.sin(phase * 0.5) * 0.22
        gate = (np.sin(2 * np.pi * 8.0 * t) > -0.15).astype(np.float64)
        sig *= 0.42 + 0.58 * gate
        env = envelope(n, 0.004, min(0.08, duration * 0.25), 0.76)
    elif kind == "bell":
        sig = (np.sin(phase) + 0.64 * np.sin(phase * 2.71) + 0.38 * np.sin(phase * 4.18)
               + 0.18 * np.sin(phase * 6.63))
        env = np.exp(-t * (3.3 / max(0.25, duration)))
        env *= envelope(n, 0.002, min(0.12, duration * 0.25), 1.0)
    else:  # lead
        sig = sum(np.sin(phase * h) / (h ** 1.05) for h in range(1, 6))
        sig += 0.16 * np.sin(phase * 0.5)
        env = envelope(n, 0.018, min(0.16, duration * 0.32), 0.74)

    peak = max(1e-6, float(np.max(np.abs(sig))))
    return (sig / peak) * env * velocity


def kick(duration: float = 0.34) -> np.ndarray:
    n = int(duration * SAMPLE_RATE)
    t = np.arange(n, dtype=np.float64) / SAMPLE_RATE
    phase = 2 * np.pi * (92 * t - 31 * t * t)
    return np.sin(phase) * np.exp(-t * 13.5) + 0.14 * np.sin(2 * np.pi * 180 * t) * np.exp(-t * 35)


def snare(rng: np.random.Generator, duration: float = 0.28) -> np.ndarray:
    n = int(duration * SAMPLE_RATE)
    t = np.arange(n, dtype=np.float64) / SAMPLE_RATE
    noise = rng.normal(0, 1, n)
    high = np.concatenate(([noise[0]], np.diff(noise)))
    return (0.52 * high * np.exp(-t * 17) + 0.32 * np.sin(2 * np.pi * 178 * t) * np.exp(-t * 19))


def hat(rng: np.random.Generator, duration: float = 0.09) -> np.ndarray:
    n = int(duration * SAMPLE_RATE)
    t = np.arange(n, dtype=np.float64) / SAMPLE_RATE
    noise = rng.normal(0, 1, n)
    high = np.concatenate(([noise[0]], np.diff(noise)))
    return high * np.exp(-t * 48) * 0.24


def tom(note: float, duration: float = 0.32) -> np.ndarray:
    n = int(duration * SAMPLE_RATE)
    t = np.arange(n, dtype=np.float64) / SAMPLE_RATE
    freq = midi_freq(note)
    phase = 2 * np.pi * (freq * t - freq * 0.16 * t * t)
    return (np.sin(phase) + 0.2 * np.sin(phase * 2)) * np.exp(-t * 11)


def metal_hit(rng: np.random.Generator, duration: float = 0.24) -> np.ndarray:
    n = int(duration * SAMPLE_RATE)
    t = np.arange(n, dtype=np.float64) / SAMPLE_RATE
    base = 410 + rng.uniform(-35, 35)
    sig = sum(np.sin(2 * np.pi * base * ratio * t) / (i + 1)
              for i, ratio in enumerate((1.0, 1.47, 2.19, 3.05)))
    return sig * np.exp(-t * 13) * 0.52


@dataclass
class Mix:
    seconds: float
    rng: np.random.Generator

    def __post_init__(self) -> None:
        self.audio = np.zeros((int(self.seconds * SAMPLE_RATE), 2), dtype=np.float64)

    def add(self, signal: np.ndarray, start: float, gain: float = 1.0, pan: float = 0.0) -> None:
        start_n = max(0, int(start * SAMPLE_RATE))
        if start_n >= len(self.audio):
            return
        end_n = min(len(self.audio), start_n + len(signal))
        signal = signal[:end_n - start_n] * gain
        angle = (pan + 1.0) * math.pi / 4.0
        self.audio[start_n:end_n, 0] += signal * math.cos(angle)
        self.audio[start_n:end_n, 1] += signal * math.sin(angle)

    def note(self, midi: float, start: float, duration: float, kind: str, gain: float, pan: float = 0.0) -> None:
        self.add(synth_tone(midi, duration, kind), start, gain, pan)

    def chord(self, midi_notes: list[float], start: float, duration: float, kind: str, gain: float) -> None:
        spread = np.linspace(-0.56, 0.56, len(midi_notes))
        for note, pan in zip(midi_notes, spread):
            self.note(note, start, duration, kind, gain / max(1.0, len(midi_notes) * 0.62), float(pan))

    def add_reverb(self, amount: float) -> None:
        dry = self.audio.copy()
        for delay, gain, swap in ((0.093, 0.20, False), (0.171, 0.14, True),
                                  (0.287, 0.09, False), (0.413, 0.055, True)):
            d = int(delay * SAMPLE_RATE)
            echo = dry[:-d, ::-1] if swap else dry[:-d]
            self.audio[d:] += echo * gain * amount

    def master(self, target_peak: float = 0.48) -> np.ndarray:
        self.audio = np.tanh(self.audio * 1.08)
        self.add_reverb(0.72)
        self.audio = np.tanh(self.audio * 0.92)
        fade_n = int(0.025 * SAMPLE_RATE)
        self.audio[:fade_n] *= np.linspace(0.0, 1.0, fade_n)[:, None]
        self.audio[-fade_n:] *= np.linspace(1.0, 0.0, fade_n)[:, None]
        peak = max(1e-8, float(np.max(np.abs(self.audio))))
        self.audio *= target_peak / peak
        return self.audio


def add_drums(mix: Mix, beat: float, bars: int, style: str) -> None:
    for bar in range(bars):
        t0 = bar * 4 * beat
        if style in {"iron", "void", "dragon", "worldbreaker"}:
            kicks = (0, 1.5, 2, 3.25) if bar % 4 != 3 else (0, 1, 2, 2.75, 3.5)
            snares = (1, 3)
        elif style == "ritual":
            kicks = (0, 2.5)
            snares = (2,)
        else:
            kicks = (0, 2, 3.5) if bar % 4 else (0, 1.5, 2, 3)
            snares = (1, 3)
        for pos in kicks:
            mix.add(kick(), t0 + pos * beat, 0.48 if style != "dragon" else 0.58, 0)
        for pos in snares:
            mix.add(snare(mix.rng), t0 + pos * beat, 0.22, (-0.14 if bar % 2 else 0.14))
        hat_step = 0.5 if style not in {"ritual", "throne", "tyrant"} else 1.0
        pos = 0.5
        while pos < 4:
            mix.add(hat(mix.rng), t0 + pos * beat, 0.22 if int(pos * 2) % 2 else 0.15, 0.45)
            pos += hat_step

        if style == "ritual":
            for idx, pos in enumerate((0, 1.333, 2.666, 3.333)):
                mix.add(tom(42 - idx * 2), t0 + pos * beat, 0.24, -0.45 + idx * 0.3)
        if style == "iron":
            for pos in (0.75, 2.75):
                mix.add(metal_hit(mix.rng), t0 + pos * beat, 0.19, -0.55 if pos < 2 else 0.55)
        if style in {"throne", "sanctum", "tyrant", "eclipse"} and bar % 2 == 0:
            mix.add(tom(38), t0, 0.31, -0.35)
            mix.add(tom(35), t0 + 0.5 * beat, 0.28, 0.35)


def compose_candidate(name: str, tempo: float, bars: int, root: int, style: str, seed: int) -> Path:
    beat = 60.0 / tempo
    seconds = bars * 4 * beat
    mix = Mix(seconds, np.random.default_rng(seed))
    minor = [0, 2, 3, 5, 7, 8, 10, 12]
    phrygian = [0, 1, 3, 5, 7, 8, 10, 12]
    harmonic = [0, 2, 3, 5, 7, 8, 11, 12]
    scale = phrygian if style in {"ritual", "void", "eclipse"} else harmonic if style in {"throne", "sanctum", "tyrant"} else minor
    progressions = {
        "iron": [0, -2, -4, -2],
        "ritual": [0, 1, -2, -1],
        "void": [0, -1, -5, -2],
        "throne": [0, -2, -4, -1],
        "dragon": [0, -4, -2, -5],
        "sanctum": [0, -5, -1, -4],
        "tyrant": [0, -1, -5, -2],
        "worldbreaker": [0, -3, -4, -1],
        "eclipse": [0, -4, 1, -5],
    }
    progression = progressions[style]
    motifs = {
        "iron": [0, 2, 1, 4, 2, 5, 4, 1],
        "ritual": [0, 1, 4, 3, 1, 6, 4, 2],
        "void": [0, 4, 1, 5, 3, 7, 6, 1],
        "throne": [0, 2, 4, 7, 6, 4, 3, 1],
        "dragon": [0, 4, 2, 5, 4, 7, 5, 2],
        "sanctum": [0, 3, 6, 7, 5, 4, 2, 1],
        "tyrant": [0, 1, 4, 6, 5, 3, 2, 7],
        "worldbreaker": [0, 4, 7, 5, 2, 6, 4, 1],
        "eclipse": [0, 5, 1, 6, 4, 7, 3, 1],
    }

    add_drums(mix, beat, bars, style)
    for bar in range(bars):
        t0 = bar * 4 * beat
        shift = progression[bar % len(progression)]
        chord_root = root + shift
        third = 3 if style != "sanctum" or bar % 4 else 4
        chord_notes = [chord_root, chord_root + third, chord_root + 7]

        if style in {"throne", "sanctum"}:
            mix.chord([n + 12 for n in chord_notes], t0, 4 * beat, "organ", 0.34)
            mix.chord([n + 24 for n in chord_notes], t0, 3.85 * beat, "choir", 0.17)
        elif style == "tyrant":
            mix.chord([n + 12 for n in chord_notes], t0, 4 * beat, "organ", 0.30)
            mix.chord([n + 24 for n in chord_notes], t0 + beat, 2.8 * beat, "strings", 0.20)
            if bar % 2 == 1:
                mix.chord([n + 24 for n in chord_notes], t0 + 2 * beat, 1.85 * beat, "choir", 0.14)
        elif style == "eclipse":
            mix.chord([n + 12 for n in chord_notes], t0, 3.9 * beat, "choir", 0.23)
            mix.chord([n + 24 for n in chord_notes], t0, 3.8 * beat, "pulse", 0.12)
            if bar % 2 == 0:
                mix.note(chord_root + 36, t0, beat * 1.4, "bell", 0.12, 0.42)
        elif style == "ritual":
            mix.chord([n + 12 for n in chord_notes], t0, 3.8 * beat, "choir", 0.18)
            mix.note(chord_root, t0, 3.7 * beat, "bass", 0.18)
        elif style == "void":
            mix.chord([n + 12 for n in chord_notes], t0, 3.9 * beat, "pulse", 0.18)
        else:
            mix.chord([n + 12 for n in chord_notes], t0, 3.8 * beat, "strings", 0.20)
            if style in {"dragon", "worldbreaker"} and bar % 2 == 0:
                mix.chord([n + 12 for n in chord_notes], t0, 1.4 * beat, "brass", 0.27)

        bass_pattern = (0, 0, 7, 0, 3, 0, 7, 10)
        for step, interval in enumerate(bass_pattern):
            if style == "ritual" and step % 2:
                continue
            duration = beat * (0.42 if style in {"iron", "dragon", "void", "worldbreaker"} else 0.72)
            mix.note(chord_root - 12 + interval, t0 + step * beat * 0.5, duration, "bass", 0.19, -0.08)

        motif = motifs[style]
        if bar >= (2 if style in {"throne", "sanctum", "tyrant", "eclipse"} else 0):
            for step, degree in enumerate(motif):
                if style == "ritual" and step not in (0, 2, 3, 6):
                    continue
                lead_kind = "brass" if style in {"throne", "dragon", "worldbreaker"} else "bell" if style in {"sanctum", "eclipse"} else "lead"
                lead_gain = 0.15 if style in {"throne", "dragon", "worldbreaker"} else 0.12
                mix.note(root + 12 + scale[degree % len(scale)], t0 + step * beat * 0.5,
                         beat * (0.38 if lead_kind != "bell" else 0.82), lead_kind, lead_gain,
                         -0.36 + (step % 4) * 0.24)

        if style == "void":
            for pos in (0.25, 1.25, 2.25, 3.25):
                mix.add(metal_hit(mix.rng), t0 + pos * beat, 0.08, mix.rng.uniform(-0.8, 0.8))
        if style == "sanctum" and bar % 2 == 1:
            mix.note(root + 36 + scale[(bar // 2) % 6], t0 + 3 * beat, beat * 1.2, "bell", 0.13, 0.55)
        if style == "tyrant" and bar % 4 == 3:
            for pos, note in zip((2.5, 3.0, 3.5), (root + 19, root + 20, root + 23)):
                mix.note(note, t0 + pos * beat, beat * 0.42, "brass", 0.18, -0.3 + (pos - 2.5) * 0.6)
        if style == "worldbreaker":
            for pos in (0.75, 1.75, 2.75, 3.75):
                mix.add(tom(40 if pos < 2 else 37), t0 + pos * beat, 0.15, -0.35 if pos % 2 else 0.35)
        if style == "eclipse" and bar % 2 == 1:
            mix.note(root + 31 + scale[(bar + 2) % 7], t0 + 3.25 * beat, beat * 0.9, "bell", 0.14, -0.52)

    audio = mix.master(0.46 if style not in {"throne", "dragon", "tyrant", "worldbreaker"} else 0.50)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / f"{name}.wav"
    pcm = np.clip(audio * 32767.0, -32768, 32767).astype("<i2")
    with wave.open(str(path), "wb") as out:
        out.setnchannels(2)
        out.setsampwidth(2)
        out.setframerate(SAMPLE_RATE)
        out.writeframes(pcm.tobytes())
    return path


def main() -> None:
    candidates = [
        ("midboss_01_iron_pursuit", 148, 12, 50, "iron", 101),
        ("midboss_02_ritual_hunt", 132, 12, 45, "ritual", 202),
        ("midboss_03_void_pressure", 156, 12, 48, "void", 303),
        ("boss_01_abyss_throne", 124, 12, 48, "throne", 404),
        ("boss_02_dragon_cataclysm", 160, 12, 50, "dragon", 505),
        ("boss_03_last_sanctum", 116, 12, 47, "sanctum", 606),
        ("boss_04_tyrant_requiem", 136, 14, 46, "tyrant", 707),
        ("boss_05_worldbreaker", 168, 14, 49, "worldbreaker", 808),
        ("boss_06_eclipse_choir", 128, 14, 45, "eclipse", 909),
    ]
    for spec in candidates:
        path = compose_candidate(*spec)
        with wave.open(str(path), "rb") as source:
            duration = source.getnframes() / source.getframerate()
        print(f"{path.name}: {duration:.2f}s, {path.stat().st_size / 1024 / 1024:.2f} MiB")


if __name__ == "__main__":
    main()
