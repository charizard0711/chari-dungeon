from __future__ import annotations

import math
import wave
from pathlib import Path

import numpy as np


SAMPLE_RATE = 32_000
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public" / "assets" / "audio"


def shaped_noise(duration: float, low: float, high: float, seed: int) -> np.ndarray:
    n = max(1, int(duration * SAMPLE_RATE))
    rng = np.random.default_rng(seed)
    noise = rng.normal(0, 1, n)
    spectrum = np.fft.rfft(noise)
    freqs = np.fft.rfftfreq(n, 1 / SAMPLE_RATE)
    mask = np.zeros_like(freqs)
    band = (freqs >= low) & (freqs <= high)
    mask[band] = 1.0
    edge = max(80.0, (high - low) * 0.12)
    lower = (freqs >= max(0, low - edge)) & (freqs < low)
    upper = (freqs > high) & (freqs <= high + edge)
    mask[lower] = (freqs[lower] - (low - edge)) / edge
    mask[upper] = 1 - (freqs[upper] - high) / edge
    signal = np.fft.irfft(spectrum * mask, n)
    peak = max(1e-8, float(np.max(np.abs(signal))))
    return signal / peak


def whoosh(duration: float, low: float, high: float, seed: int, weight: float = 1.0) -> np.ndarray:
    n = int(duration * SAMPLE_RATE)
    t = np.arange(n, dtype=np.float64) / SAMPLE_RATE
    x = np.clip(t / duration, 0, 1)
    env = np.sin(np.pi * x) ** 1.45
    noise = shaped_noise(duration, low, high, seed)
    center = (low + high) * 0.34
    chirp_phase = 2 * np.pi * (center * t + (high * 0.28 - center) * t * t / (2 * duration))
    return (noise * 0.82 + np.sin(chirp_phase) * 0.18) * env * weight


def metal_ring(duration: float, base: float, brightness: float = 1.0) -> np.ndarray:
    n = int(duration * SAMPLE_RATE)
    t = np.arange(n, dtype=np.float64) / SAMPLE_RATE
    sig = np.zeros(n)
    for index, ratio in enumerate((1.0, 1.43, 2.17, 3.31, 4.72)):
        sig += np.sin(2 * np.pi * base * ratio * t) * (brightness ** index) / (index + 1)
    sig *= np.exp(-t * (7.5 / max(0.12, duration)))
    sig *= np.minimum(1.0, t / 0.0025)
    return sig / max(1e-8, float(np.max(np.abs(sig))))


def bass_impact(duration: float, start_freq: float, end_freq: float) -> np.ndarray:
    n = int(duration * SAMPLE_RATE)
    t = np.arange(n, dtype=np.float64) / SAMPLE_RATE
    k = (end_freq - start_freq) / duration
    phase = 2 * np.pi * (start_freq * t + 0.5 * k * t * t)
    return np.sin(phase) * np.exp(-t * 12.5)


def string_pluck(duration: float, base: float) -> np.ndarray:
    n = int(duration * SAMPLE_RATE)
    t = np.arange(n, dtype=np.float64) / SAMPLE_RATE
    sig = sum(np.sin(2 * np.pi * base * harmonic * t) / (harmonic ** 1.15) for harmonic in range(1, 9))
    sig *= np.exp(-t * 15.5)
    sig *= np.minimum(1.0, t / 0.0018)
    return sig / max(1e-8, float(np.max(np.abs(sig))))


class SoundMix:
    def __init__(self, duration: float):
        self.audio = np.zeros((int(duration * SAMPLE_RATE), 2), dtype=np.float64)

    def add(self, signal: np.ndarray, start: float, gain: float, pan: float = 0.0) -> None:
        begin = int(start * SAMPLE_RATE)
        end = min(len(self.audio), begin + len(signal))
        if begin >= end:
            return
        signal = signal[:end - begin] * gain
        angle = (pan + 1) * math.pi / 4
        self.audio[begin:end, 0] += signal * math.cos(angle)
        self.audio[begin:end, 1] += signal * math.sin(angle)

    def finish(self, target_peak: float = 0.48) -> np.ndarray:
        delay = int(0.013 * SAMPLE_RATE)
        self.audio[delay:, 1] += self.audio[:-delay, 0] * 0.10
        self.audio[delay * 2:, 0] += self.audio[:-delay * 2, 1] * 0.055
        self.audio -= np.mean(self.audio, axis=0, keepdims=True)
        self.audio = np.tanh(self.audio * 1.1)
        fade = int(0.002 * SAMPLE_RATE)
        self.audio[:fade] *= np.linspace(0, 1, fade)[:, None]
        self.audio[-fade:] *= np.linspace(1, 0, fade)[:, None]
        peak = max(1e-8, float(np.max(np.abs(self.audio))))
        self.audio *= target_peak / peak
        return self.audio


def dagger() -> np.ndarray:
    mix = SoundMix(0.27)
    mix.add(whoosh(0.16, 750, 6200, 11), 0.0, 0.72, -0.2)
    mix.add(metal_ring(0.15, 1480, 0.78), 0.075, 0.42, 0.25)
    mix.add(bass_impact(0.10, 240, 105), 0.075, 0.18, 0)
    return mix.finish(0.45)


def longsword() -> np.ndarray:
    mix = SoundMix(0.39)
    mix.add(whoosh(0.25, 330, 4300, 22), 0.0, 0.76, -0.12)
    mix.add(metal_ring(0.24, 820, 0.85), 0.105, 0.48, 0.18)
    mix.add(bass_impact(0.16, 190, 82), 0.09, 0.22, 0)
    return mix.finish(0.48)


def lance() -> np.ndarray:
    mix = SoundMix(0.38)
    thrust = whoosh(0.23, 520, 7600, 33)
    thrust *= np.linspace(0.25, 1.0, len(thrust)) ** 1.4
    mix.add(thrust, 0.0, 0.74, 0.05)
    mix.add(metal_ring(0.17, 1220, 0.82), 0.155, 0.38, -0.15)
    mix.add(bass_impact(0.15, 260, 78), 0.145, 0.30, 0)
    return mix.finish(0.48)


def bow() -> np.ndarray:
    mix = SoundMix(0.46)
    mix.add(string_pluck(0.24, 182), 0.0, 0.62, -0.18)
    mix.add(string_pluck(0.18, 356), 0.008, 0.26, 0.2)
    flight = whoosh(0.31, 1800, 10_500, 44, 0.72)
    flight *= np.linspace(0.35, 1.0, len(flight))
    mix.add(flight, 0.045, 0.56, 0.18)
    mix.add(metal_ring(0.11, 2120, 0.7), 0.02, 0.18, -0.35)
    return mix.finish(0.46)


def handgun() -> np.ndarray:
    mix = SoundMix(0.36)
    blast = shaped_noise(0.075, 180, 12_500, 45)
    blast *= np.exp(-np.linspace(0, 8.0, len(blast)))
    smoke = shaped_noise(0.22, 70, 1_300, 46)
    smoke *= np.exp(-np.linspace(0, 5.8, len(smoke)))
    mix.add(blast, 0.0, 0.92, -0.04)
    mix.add(bass_impact(0.15, 310, 52), 0.0, 0.58, 0.02)
    mix.add(metal_ring(0.17, 1_260, 0.72), 0.018, 0.23, 0.18)
    mix.add(smoke, 0.042, 0.24, -0.14)
    return mix.finish(0.52)


def greatsword() -> np.ndarray:
    mix = SoundMix(0.58)
    mix.add(whoosh(0.40, 95, 2300, 55, 1.15), 0.0, 0.84, -0.08)
    mix.add(bass_impact(0.30, 150, 42), 0.21, 0.56, 0)
    mix.add(metal_ring(0.27, 510, 0.76), 0.22, 0.36, 0.22)
    mix.add(shaped_noise(0.18, 120, 1300, 56) * np.exp(-np.linspace(0, 4.5, int(0.18 * SAMPLE_RATE))), 0.23, 0.25, -0.25)
    return mix.finish(0.50)


def dual() -> np.ndarray:
    mix = SoundMix(0.44)
    mix.add(whoosh(0.15, 720, 6700, 66), 0.0, 0.66, -0.55)
    mix.add(metal_ring(0.12, 1540, 0.74), 0.062, 0.29, -0.30)
    mix.add(whoosh(0.17, 620, 7200, 67), 0.105, 0.70, 0.55)
    mix.add(metal_ring(0.14, 1760, 0.72), 0.178, 0.31, 0.32)
    mix.add(bass_impact(0.13, 225, 90), 0.175, 0.19, 0)
    return mix.finish(0.47)


def write_wav(name: str, audio: np.ndarray) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / name
    pcm = np.clip(audio * 32767, -32768, 32767).astype("<i2")
    with wave.open(str(path), "wb") as out:
        out.setnchannels(2)
        out.setsampwidth(2)
        out.setframerate(SAMPLE_RATE)
        out.writeframes(pcm.tobytes())
    print(f"{path.name}: {len(audio) / SAMPLE_RATE:.2f}s, {path.stat().st_size / 1024:.1f} KiB")


def main() -> None:
    sounds = {
        "se_weapon_dagger.wav": dagger(),
        "se_weapon_longsword.wav": longsword(),
        "se_weapon_lance.wav": lance(),
        "se_weapon_bow.wav": bow(),
        "se_weapon_handgun.wav": handgun(),
        "se_weapon_greatsword.wav": greatsword(),
        "se_weapon_dual.wav": dual(),
    }
    for name, audio in sounds.items():
        write_wav(name, audio)


if __name__ == "__main__":
    main()
