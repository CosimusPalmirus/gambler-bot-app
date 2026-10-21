# foto.py <scena> <t> <x0> <y0> <x1> <y1> [gif_da gif_a]
#   -> smash_look_1710/foto/oggetti_ai/<scena>_prima_dopo.png (ritaglio affiancato, ingrandito 2x) e <scena>.gif (fotogrammi "dopo")
import sys, os, glob
from PIL import Image, ImageDraw
QUI = os.path.dirname(os.path.abspath(__file__))
F = os.path.join(QUI, '..', '..', '..', 'smash_look_1710', 'foto', 'oggetti_ai')
sc, t = sys.argv[1], int(sys.argv[2]); box = tuple(int(v) for v in sys.argv[3:7])
w, h = box[2] - box[0], box[3] - box[1]; k = 2 if w <= 640 else 1
out = Image.new('RGB', (w * k * 2 + 12, h * k + 30), (12, 8, 20)); d = ImageDraw.Draw(out)
for i, m in enumerate(['prima', 'dopo']):
    im = Image.open(os.path.join(F, f'{sc}_{m}_{t:03d}.png')).convert('RGB').crop(box).resize((w * k, h * k), Image.LANCZOS)
    out.paste(im, (i * (w * k + 12), 30)); d.text((i * (w * k + 12) + 8, 8), m.upper() + ('  (vecchio disegno)' if m == 'prima' else '  (oggetti AI)'), fill=(255, 220, 90))
out.save(os.path.join(F, f'{sc}_prima_dopo.png')); print('foto', out.size)
if len(sys.argv) > 8:
    a, b = int(sys.argv[7]), int(sys.argv[8])
    fs = sorted(glob.glob(os.path.join(F, f'{sc}_dopo_*.png')))
    fr = []
    for f in fs:
        n = int(f[-7:-4])
        if a <= n <= b: fr.append(Image.open(f).convert('RGB').crop(box).resize((min(640, w), int(h * min(640, w) / w)), Image.LANCZOS))
    step = int(fs[1][-7:-4]) - int(fs[0][-7:-4]) if len(fs) > 1 else 1
    pal = [f.quantize(colors=200, method=Image.Quantize.MEDIANCUT) for f in fr]
    pal[0].save(os.path.join(F, f'{sc}.gif'), save_all=True, append_images=pal[1:], duration=int(1000 / 60 * step), loop=0, optimize=True)
    print('gif', len(fr), 'fotogrammi')
