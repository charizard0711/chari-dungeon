from pathlib import Path
import math, random, struct, wave
from PIL import Image

root = Path(__file__).resolve().parents[1]
im = Image.open(root / 'art/skill-v2/effects-original.png')
assert im.size == (1774, 887) and im.mode == 'RGBA'
im.save(root / 'public/assets/skills/painted-v2/effects.webp', quality=92)
# A short mechanical tick: a hammer impulse, metallic resonances, and a softer rebound.
rate = 44100
rng = random.Random(6)
samples = []
for n in range(int(rate * .18)):
    t = n / rate
    impulse = rng.uniform(-1, 1) * math.exp(-t * 420) * .38
    ring = sum(math.sin(2 * math.pi * freq * t) * math.exp(-t * decay) * gain
               for freq, decay, gain in [(1850, 135, .28), (3120, 180, .12), (740, 90, .12)])
    rebound = .08 * math.sin(2 * math.pi * 1250 * t) * math.exp(-(t-.027) * 180) if t >= .027 else 0
    samples.append(struct.pack('<h', int(max(-1, min(1, impulse+ring+rebound)) * 29000)))
with wave.open(str(root / 'public/assets/audio/se_clock_tick.wav'), 'wb') as out:
    out.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
    out.writeframes(b''.join(samples))
print('Prepared 2-frame transparent VFX atlas and mechanical clock tick')
