# foglio_impatti.py: foglio prima/dopo degli impatti (foto/oggetti_ai/impatti_prima_dopo.png), un rigo per lottatore,
# fotogramma = primo colpo + 1 (il momento più carico). Uso: python foglio_impatti.py id:t id:t ...
import sys, os
from PIL import Image, ImageDraw
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'smash_look_1710', 'foto', 'oggetti_ai')
voci = [a.split(':') for a in sys.argv[1:]]
W, H, box = 560, 260, (200, 230, 1100, 648)
out = Image.new('RGB', (W * 2 + 150, H * len(voci) + 30), (12, 8, 20)); d = ImageDraw.Draw(out)
d.text((160, 8), 'PRIMA (effetti vecchi)', fill=(255, 220, 90)); d.text((160 + W, 8), 'DOPO (impatto pulito)', fill=(255, 220, 90))
for i, (sc, t) in enumerate(voci):
    t = int(t); y = 30 + i * H
    d.text((8, y + H // 2 - 6), sc, fill=(230, 230, 240))
    for j, m in enumerate(['prima', 'dopo']):
        im = Image.open(os.path.join(F, f'imp_{sc}_{m}_{t:03d}.png')).convert('RGB').crop(box).resize((W - 6, H - 6), Image.LANCZOS)
        out.paste(im, (150 + j * W, y))
out.save(os.path.join(F, 'impatti_prima_dopo.png')); print(out.size)
