# pezzi.py <png> [soglia_alpha] : trova i pezzi separati (componenti per colonne/righe di alpha) e li stampa
# uso: python pezzi.py foglio.png  -> elenco riquadri;  python pezzi.py foglio.png --salva prefisso  -> salva ogni pezzo ritagliato
import sys
from PIL import Image
import numpy as np
im = Image.open(sys.argv[1]).convert('RGBA'); a = np.array(im)[:, :, 3] > 24
from scipy import ndimage
lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=6))
box = []
for i, sl in enumerate(ndimage.find_objects(lab)):
    ys, xs = sl; area = (lab[sl] == i + 1).sum()
    if area < 400: continue
    box.append((xs.start, ys.start, xs.stop, ys.stop))
box.sort(key=lambda b: (b[1] // 200, b[0]))
for k, b in enumerate(box): print(k, b, b[2] - b[0], b[3] - b[1])
if '--salva' in sys.argv:
    pre = sys.argv[sys.argv.index('--salva') + 1]
    for k, b in enumerate(box): im.crop(b).save(f'{pre}{k}.png')
