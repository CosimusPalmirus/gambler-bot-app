# striscia.py <scena> <modo> <x0> <y0> <x1> <y1> t1 t2 ...  -> smash_look_1710/foto/oggetti_ai/_strip.png (7 per riga)
import sys, os
from PIL import Image
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'smash_look_1710', 'foto', 'oggetti_ai')
sc, m = sys.argv[1], sys.argv[2]; b = tuple(int(v) for v in sys.argv[3:7]); ts = [int(v) for v in sys.argv[7:]]
w, h = b[2] - b[0], b[3] - b[1]; out = Image.new('RGB', (w * min(7, len(ts)), h * ((len(ts) + 6) // 7)))
for i, t in enumerate(ts): out.paste(Image.open(os.path.join(F, f'{sc}_{m}_{t:03d}.png')).convert('RGB').crop(b), ((i % 7) * w, (i // 7) * h))
out.save(os.path.join(F, '_strip.png')); print(out.size)
