# taglia.py: ritaglia i pezzi dei fogli AI (smash_look_1710/oggetti_ai/gen) e scrive le immagini del gioco in smash_1410/oggetti_ai/
#   python taglia.py            (rifà tutto)
# Ogni voce: (foglio, nome uscita, modo, dati, altezza px in uscita)
#   modo 'comp': il pezzo n. dati (stesso ordine di pezzi.py), solo i pixel di quel pezzo (niente bordi dei vicini)
#   modo 'box' : il riquadro dati=(x0,y0,x1,y1), tutti i pixel dentro
import os, sys, json
from PIL import Image
import numpy as np
from scipy import ndimage
QUI = os.path.dirname(os.path.abspath(__file__))
GEN = os.path.join(QUI, '..', '..', '..', 'smash_look_1710', 'oggetti_ai', 'gen')
OUT = os.path.join(QUI, '..')
def pezzi(im):
    a = np.array(im)[:, :, 3] > 24
    lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=6))
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        if (lab[sl] == i + 1).sum() < 400: continue
        out.append((sl, i + 1))
    out.sort(key=lambda o: (o[0][0].start // 200, o[0][1].start))
    return lab, out
def esegui(voci, cache={}):
    for fo, nome, modo, dati, alt in voci:
        if fo not in cache: im = Image.open(os.path.join(GEN, fo)).convert('RGBA'); cache[fo] = (im, *pezzi(im))
        im, lab, ps = cache[fo]
        if modo == 'comp':
            sl, li = ps[dati]; arr = np.array(im)
            m = ndimage.binary_dilation(lab == li, iterations=0) if False else (lab == li)
            arr[:, :, 3] = np.where(m, arr[:, :, 3], 0)
            pz = Image.fromarray(arr).crop((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop))
        elif modo == 'zona':
            # tutti i pezzi col centro fra x0 e x1 (e y0..y1), su una tela fissa WxH centrata in (cx, cy): stessa scala e stesso centro per i fotogrammi
            x0, x1, y0, y1, cx, cy, W, H = dati; arr = np.array(im); m = np.zeros(lab.shape, bool)
            for sl, li in ps:
                mx = (sl[1].start + sl[1].stop) / 2; my = (sl[0].start + sl[0].stop) / 2
                if x0 <= mx < x1 and y0 <= my < y1: m |= lab == li
            arr[:, :, 3] = np.where(m, arr[:, :, 3], 0)
            tela = Image.new('RGBA', (W, H)); src = Image.fromarray(arr)
            tela.alpha_composite(src.crop((cx - W // 2, cy - H // 2, cx + W // 2, cy + H // 2)))
            pz = tela
        else:
            pz = im.crop(dati)
        if modo != 'zona': bb = pz.getbbox(); pz = pz.crop(bb)
        k = alt / pz.size[1]
        pz = pz.resize((max(1, round(pz.size[0] * k)), alt), Image.LANCZOS)
        pz.save(os.path.join(OUT, nome + '.webp'), quality=88, method=6)
        print(nome, pz.size)
VOCI = {
  'torretta': [
    ('torretta_stati.png', 'torretta_chiusa', 'comp', 0, 112),
    ('torretta_stati.png', 'torretta_attesa', 'comp', 1, 128),
    ('torretta_stati.png', 'torretta_sparo', 'comp', 2, 128),
    ('torretta_stati.png', 'torretta_rotta', 'comp', 3, 160),
    ('torretta_stati.png', 'gettone_faccia', 'comp', 4, 48),
    ('torretta_stati.png', 'gettone_taglio', 'comp', 5, 48),
    ('torretta_stati.png', 'lampo_bocca', 'comp', 6, 40),
  ],
  'ruota': [
    ('ruota_varianti.png', 'ruota_anello', 'comp', 2, 192),
    ('ruota_varianti.png', 'scintilla_0', 'comp', 3, 40),
    ('ruota_varianti.png', 'scintilla_1', 'comp', 4, 44),
    ('ruota_varianti.png', 'scintilla_2', 'comp', 6, 36),
    ('ruota_varianti.png', 'scintilla_3', 'comp', 7, 48),
  ],
  'cordone': [
    ('cordone_varianti.png', 'paletto', 'comp', 0, 128),
    ('cordone_varianti.png', 'paletto_caduto', 'comp', 1, 64),
    ('cordone_varianti.png', 'velluto', 'comp', 2, 24),
    ('cordone_varianti.png', 'polvere', 'comp', 5, 40),
  ],
  'barile': [
    ('barile_varianti.png', 'barile_lato', 'comp', 0, 96),
    ('barile_varianti.png', 'barile_fronte', 'comp', 3, 128),
    ('barile_varianti.png', 'miccia_0', 'comp', 6, 40),
    ('barile_varianti.png', 'miccia_1', 'comp', 7, 40),
    ('barile_varianti.png', 'miccia_2', 'comp', 8, 40),
  ],
  'esplosione_legno': [
    ('esplosione_legno.png', 'espl_legno_0', 'zona', (0, 200, 0, 480, 102, 270, 400, 400), 160),
    ('esplosione_legno.png', 'espl_legno_1', 'zona', (200, 430, 0, 480, 313, 270, 400, 400), 160),
    ('esplosione_legno.png', 'espl_legno_2', 'zona', (430, 740, 0, 480, 580, 262, 400, 400), 160),
    ('esplosione_legno.png', 'espl_legno_3', 'zona', (740, 1024, 0, 480, 875, 270, 400, 400), 160),
    ('esplosione_legno.png', 'scheggia_legno_0', 'comp', 7, 36),
    ('esplosione_legno.png', 'scheggia_legno_1', 'comp', 9, 40),
    ('esplosione_legno.png', 'scheggia_legno_2', 'comp', 10, 36),
  ],
  'lanci1': [
    ('shuriken_carte.png', 'shuriken', 'comp', 0, 64),
    ('shuriken_carte.png', 'carta_asso', 'comp', 5, 72),
    ('pallottole_monete.png', 'pallottola', 'comp', 1, 24),
    ('pallottole_monete.png', 'moneta_faccia', 'comp', 3, 64),
    ('pallottole_monete.png', 'moneta_taglio', 'comp', 6, 64),
  ],
  'lanci2': [
    ('sfera_tarocchi.png', 'sfera', 'comp', 1, 72),
    ('sfera_tarocchi.png', 'tarocco', 'comp', 3, 72),
    ('cannone_lance.png', 'palla_cannone', 'comp', 2, 64),
    ('cannone_lance.png', 'lancia', 'comp', 4, 20),
  ],
  'lanci3': [
    ('pilastri.png', 'pilastro', 'comp', 2, 256),
    ('pilastri.png', 'sigillo', 'comp', 3, 48),
    ('rampino_tronco.png', 'rampino', 'comp', 0, 64),
    ('rampino_tronco.png', 'corda', 'comp', 2, 12),
    ('rampino_tronco.png', 'tronco', 'comp', 3, 80),
  ],
  'ulti': [
    ('ulti_777_rastrello.png', 'fiche_777', 'comp', 1, 160),
    ('ulti_777_rastrello.png', 'rastrello', 'comp', 2, 160),
    ('falange.png', 'falange', 'comp', 4, 192),
  ],
  'mina': [
    ('mina_varianti.png', 'mina_don', 'comp', 1, 96),
  ],
  'esplosione_fiche': [
    ('esplosione_fiche.png', 'espl_fiche_0', 'zona', (0, 196, 0, 480, 106, 305, 400, 400), 160),
    ('esplosione_fiche.png', 'espl_fiche_1', 'zona', (196, 446, 0, 480, 321, 305, 400, 400), 160),
    ('esplosione_fiche.png', 'espl_fiche_2', 'zona', (446, 744, 0, 480, 591, 290, 400, 400), 160),
    ('esplosione_fiche.png', 'espl_fiche_3', 'zona', (744, 1024, 0, 480, 884, 300, 400, 400), 160),
    ('esplosione_fiche.png', 'scheggia_fiche_0', 'comp', 11, 40),
    ('esplosione_fiche.png', 'scheggia_fiche_1', 'comp', 12, 32),
    ('esplosione_fiche.png', 'scheggia_fiche_2', 'comp', 14, 40),
  ],
}
if __name__ == '__main__':
    quali = sys.argv[1:] or list(VOCI)
    for q in quali: esegui(VOCI[q])
