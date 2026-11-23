/* GAMBLER SMASH online — matematica DETERMINISTICA (17/10/2026).
   sin, cos, tan, atan, atan2, acos portate in JS puro da fdlibm (FreeBSD msun / V8 base/ieee754.cc):
   solo + - * /, Math.sqrt (IEEE, esatta), confronti, e lettura/scrittura delle parole alta/bassa di un
   double con un Float64Array condiviso. Niente funzioni native trascendenti: il risultato e' IDENTICO
   bit per bit su V8 (Chrome, Android, node), JavaScriptCore (Safari, iPhone, Telegram iOS), SpiderMonkey.
   Le native NON lo sono: ogni motore usa la sua libm. Ogni NaN che esce e' il NaN canonico (niente carico
   del NaN d'ingresso, che i motori trattano in modo diverso).
   GSMAT.installa() sostituisce Math.sin/cos/tan/atan/atan2/acos (idempotente); le native restano in GSMAT.nativo.
   Va caricato PRIMA dei file del motore (nella pagina e nel verificatore). */
(function (root) {
  'use strict';
  // ---- parole del double (indipendente dall'endianness: si misura una volta) ----
  const F = new Float64Array(1), U = new Uint32Array(F.buffer), I = new Int32Array(F.buffer);
  F[0] = 1;
  const HI = U[1] === 0x3ff00000 ? 1 : 0, LO = 1 - HI;
  function hi(x) { F[0] = x; return I[HI]; }          // parola alta con segno (int32)
  function lo(x) { F[0] = x; return U[LO]; }          // parola bassa senza segno
  function mk(h, l) { I[HI] = h | 0; U[LO] = l >>> 0; return F[0]; }
  function setLo0(x) { F[0] = x; U[LO] = 0; return F[0]; }
  // moltiplicazione esatta per 2^n (fuori dai subnormali)
  function scalbn(x, n) {
    while (n > 1023) { x *= 8.98846567431158e307; n -= 1023; }
    while (n < -1022) { x *= 2.2250738585072014e-308; n += 1022; }
    return x * mk((n + 1023) << 20, 0);
  }
  const two24 = 16777216.0, twon24 = 5.9604644775390625e-08;

  // ---- __kernel_sin / __kernel_cos (fdlibm, come V8) ----
  const S1 = -1.66666666666666324348e-01, S2 = 8.33333333332248946124e-03, S3 = -1.98412698298579493134e-04,
    S4 = 2.75573137070700676789e-06, S5 = -2.50507602534068634195e-08, S6 = 1.58969099521155010221e-10;
  function kSin(x, y, iy) {
    const ix = hi(x) & 0x7fffffff;
    if (ix < 0x3e400000) return x;                   // |x| < 2^-27
    const z = x * x, v = z * x;
    const r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)));
    if (iy === 0) return x + v * (S1 + z * r);
    return x - ((z * (0.5 * y - v * r) - y) - v * S1);
  }
  const C1 = 4.16666666666666019037e-02, C2 = -1.38888888888741095749e-03, C3 = 2.48015872894767294178e-05,
    C4 = -2.75573143513906633035e-07, C5 = 2.08757232129817482790e-09, C6 = -1.13596475577881948265e-11;
  function kCos(x, y) {
    const ix = hi(x) & 0x7fffffff;
    if (ix < 0x3e400000) return 1.0;                 // |x| < 2^-27
    const z = x * x;
    const r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
    if (ix < 0x3FD33333) return 1.0 - (0.5 * z - (z * r - x * y));
    let qx;
    if (ix > 0x3fe90000) qx = 0.28125;
    else qx = mk(ix - 0x00200000, 0);
    const hz = 0.5 * z - qx, a = 1.0 - qx;
    return a - (hz - (z * r - x * y));
  }

  // ---- __kernel_rem_pio2 (argomenti enormi), prec = 2 ----
  const IPIO2 = [
    0xA2F983, 0x6E4E44, 0x1529FC, 0x2757D1, 0xF534DD, 0xC0DB62, 0x95993C, 0x439041, 0xFE5163, 0xABDEBB, 0xC561B7,
    0x246E3A, 0x424DD2, 0xE00649, 0x2EEA09, 0xD1921C, 0xFE1DEB, 0x1CB129, 0xA73EE8, 0x8235F5, 0x2EBB44, 0x84E99C,
    0x7026B4, 0x5F7E41, 0x3991D6, 0x398353, 0x39F49C, 0x845F8B, 0xBDF928, 0x3B1FF8, 0x97FFDE, 0x05980F, 0xEF2F11,
    0x8B5A0A, 0x6D1F6D, 0x367ECF, 0x27CB09, 0xB74F46, 0x3F669E, 0x5FEA2D, 0x7527BA, 0xC7EBE5, 0xF17B3D, 0x0739F7,
    0x8A5292, 0xEA6BFB, 0x5FB11F, 0x8D5D08, 0x560330, 0x46FC7B, 0x6BABF0, 0xCFBC20, 0x9AF436, 0x1DA9E3, 0x91615E,
    0xE61B08, 0x659985, 0x5F14A0, 0x68408D, 0xFFD880, 0x4D7327, 0x310606, 0x1556CA, 0x73A8C9, 0x60E27B, 0xC08C6B];
  const PIO2 = [1.57079625129699707031e+00, 7.54978941586159635335e-08, 5.39030252995776476554e-15,
    3.28200341580791294123e-22, 1.27065575308067607349e-29, 1.22933308981111328932e-36,
    2.73370053816464559624e-44, 2.16741683877804819444e-51];
  const kf = new Float64Array(20), kq = new Float64Array(20), kfq = new Float64Array(20), kiq = new Int32Array(20);
  function kRemPio2(x, nx, e0, y) {
    const jk = 4, jp = jk, jx = nx - 1;
    let jv = ((e0 - 3) / 24) | 0; if (jv < 0) jv = 0;
    let q0 = e0 - 24 * (jv + 1);
    let i, j, k, m = jx + jk, n, ih, carry, z, fw, jz;
    const f = kf, q = kq, fq = kfq, iq = kiq;
    j = jv - jx;
    for (i = 0; i <= m; i++, j++) f[i] = j < 0 ? 0.0 : IPIO2[j];
    for (i = 0; i <= jk; i++) { fw = 0.0; for (j = 0; j <= jx; j++) fw += x[j] * f[jx + i - j]; q[i] = fw; }
    jz = jk;
    for (;;) {
      for (i = 0, j = jz, z = q[jz]; j > 0; i++, j--) {
        fw = ((twon24 * z) | 0);
        iq[i] = (z - two24 * fw) | 0;
        z = q[j - 1] + fw;
      }
      z = scalbn(z, q0);
      z -= 8.0 * Math.floor(z * 0.125);
      n = z | 0;
      z -= n;
      ih = 0;
      if (q0 > 0) {
        i = iq[jz - 1] >> (24 - q0); n += i; iq[jz - 1] -= i << (24 - q0);
        ih = iq[jz - 1] >> (23 - q0);
      } else if (q0 === 0) ih = iq[jz - 1] >> 23;
      else if (z >= 0.5) ih = 2;
      if (ih > 0) {
        n += 1; carry = 0;
        for (i = 0; i < jz; i++) {
          j = iq[i];
          if (carry === 0) { if (j !== 0) { carry = 1; iq[i] = 0x1000000 - j; } }
          else iq[i] = 0xffffff - j;
        }
        if (q0 > 0) {
          if (q0 === 1) iq[jz - 1] &= 0x7fffff;
          else if (q0 === 2) iq[jz - 1] &= 0x3fffff;
        }
        if (ih === 2) { z = 1.0 - z; if (carry !== 0) z -= scalbn(1.0, q0); }
      }
      if (z === 0.0) {
        j = 0;
        for (i = jz - 1; i >= jk; i--) j |= iq[i];
        if (j === 0) {
          for (k = 1; iq[jk - k] === 0; k++);
          for (i = jz + 1; i <= jz + k; i++) {
            f[jx + i] = IPIO2[jv + i];
            fw = 0.0; for (j = 0; j <= jx; j++) fw += x[j] * f[jx + i - j];
            q[i] = fw;
          }
          jz += k;
          continue;
        }
      }
      break;
    }
    if (z === 0.0) {
      jz -= 1; q0 -= 24;
      while (iq[jz] === 0) { jz--; q0 -= 24; }
    } else {
      z = scalbn(z, -q0);
      if (z >= two24) {
        fw = ((twon24 * z) | 0);
        iq[jz] = (z - two24 * fw) | 0;
        jz += 1; q0 += 24;
        iq[jz] = fw | 0;
      } else iq[jz] = z | 0;
    }
    fw = scalbn(1.0, q0);
    for (i = jz; i >= 0; i--) { q[i] = fw * iq[i]; fw *= twon24; }
    for (i = jz; i >= 0; i--) {
      fw = 0.0;
      for (k = 0; k <= jp && k <= jz - i; k++) fw += PIO2[k] * q[i + k];
      fq[jz - i] = fw;
    }
    fw = 0.0;
    for (i = jz; i >= 0; i--) fw += fq[i];
    y[0] = ih === 0 ? fw : -fw;
    fw = fq[0] - fw;
    for (i = 1; i <= jz; i++) fw += fq[i];
    y[1] = ih === 0 ? fw : -fw;
    return n & 7;
  }

  // ---- __ieee754_rem_pio2: n e y[0]+y[1] = x - n*pi/2 ----
  const invpio2 = 6.36619772367581382433e-01, pio2_1 = 1.57079632673412561417e+00, pio2_1t = 6.07710050650619224932e-11,
    pio2_2 = 6.07710050630396597660e-11, pio2_2t = 2.02226624879595063154e-21, pio2_3 = 2.02226624871116645580e-21,
    pio2_3t = 8.47842766036889956997e-32;
  const NPIO2_HW = [
    0x3FF921FB, 0x400921FB, 0x4012D97C, 0x401921FB, 0x401F6A7A, 0x4022D97C, 0x4025FDBB, 0x402921FB, 0x402C463A, 0x402F6A7A,
    0x4031475C, 0x4032D97C, 0x40346B9C, 0x4035FDBB, 0x40378FDB, 0x403921FB, 0x403AB41B, 0x403C463A, 0x403DD85A, 0x403F6A7A,
    0x40407E4C, 0x4041475C, 0x4042106C, 0x4042D97C, 0x4043A28C, 0x40446B9C, 0x404534AC, 0x4045FDBB, 0x4046C6CB, 0x40478FDB,
    0x404858EB, 0x404921FB];
  const Y = new Float64Array(2), TX = new Float64Array(3);
  function remPio2(x) {
    const hx = hi(x), ix = hx & 0x7fffffff;
    let z, w, t, r, fn, n, i, j;
    if (ix <= 0x3fe921fb) { Y[0] = x; Y[1] = 0; return 0; }
    if (ix < 0x4002d97c) {
      if (hx > 0) {
        z = x - pio2_1;
        if (ix !== 0x3ff921fb) { Y[0] = z - pio2_1t; Y[1] = (z - Y[0]) - pio2_1t; }
        else { z -= pio2_2; Y[0] = z - pio2_2t; Y[1] = (z - Y[0]) - pio2_2t; }
        return 1;
      }
      z = x + pio2_1;
      if (ix !== 0x3ff921fb) { Y[0] = z + pio2_1t; Y[1] = (z - Y[0]) + pio2_1t; }
      else { z += pio2_2; Y[0] = z + pio2_2t; Y[1] = (z - Y[0]) + pio2_2t; }
      return -1;
    }
    if (ix <= 0x413921fb) {
      t = Math.abs(x);
      n = (t * invpio2 + 0.5) | 0;
      fn = n;
      r = t - fn * pio2_1;
      w = fn * pio2_1t;
      if (n < 32 && ix !== NPIO2_HW[n - 1]) {
        Y[0] = r - w;
      } else {
        j = ix >> 20;
        Y[0] = r - w;
        i = j - ((hi(Y[0]) >> 20) & 0x7ff);
        if (i > 16) {
          t = r; w = fn * pio2_2; r = t - w; w = fn * pio2_2t - ((t - r) - w); Y[0] = r - w;
          i = j - ((hi(Y[0]) >> 20) & 0x7ff);
          if (i > 49) { t = r; w = fn * pio2_3; r = t - w; w = fn * pio2_3t - ((t - r) - w); Y[0] = r - w; }
        }
      }
      Y[1] = (r - Y[0]) - w;
      if (hx < 0) { Y[0] = -Y[0]; Y[1] = -Y[1]; return -n; }
      return n;
    }
    if (ix >= 0x7ff00000) { Y[0] = Y[1] = NaN; return 0; }
    const e0 = (ix >> 20) - 1046;
    z = mk(ix - (e0 << 20), lo(x));
    for (i = 0; i < 2; i++) { TX[i] = (z | 0); z = (z - TX[i]) * two24; }
    TX[2] = z;
    let nx = 3;
    while (TX[nx - 1] === 0.0) nx--;
    n = kRemPio2(TX, nx, e0, Y);
    if (hx < 0) { Y[0] = -Y[0]; Y[1] = -Y[1]; return -n; }
    return n;
  }

  function sin(x) {
    x = +x;
    const ix = hi(x) & 0x7fffffff;
    if (ix <= 0x3fe921fb) return kSin(x, 0, 0);
    if (ix >= 0x7ff00000) return NaN;
    const n = remPio2(x);
    switch (n & 3) {
      case 0: return kSin(Y[0], Y[1], 1);
      case 1: return kCos(Y[0], Y[1]);
      case 2: return -kSin(Y[0], Y[1], 1);
      default: return -kCos(Y[0], Y[1]);
    }
  }
  function cos(x) {
    x = +x;
    const ix = hi(x) & 0x7fffffff;
    if (ix <= 0x3fe921fb) return kCos(x, 0);
    if (ix >= 0x7ff00000) return NaN;
    const n = remPio2(x);
    switch (n & 3) {
      case 0: return kCos(Y[0], Y[1]);
      case 1: return -kSin(Y[0], Y[1], 1);
      case 2: return -kCos(Y[0], Y[1]);
      default: return kSin(Y[0], Y[1], 1);
    }
  }

  // ---- __kernel_tan + tan (fdlibm) ----
  const T = [3.33333333333334091986e-01, 1.33333333333201242699e-01, 5.39682539762260521377e-02,
    2.18694882948595424599e-02, 8.86323982359930005737e-03, 3.59207910759131235356e-03,
    1.45620945432529025516e-03, 5.88041240820264096874e-04, 2.46463134818469906812e-04,
    7.81794442939557092300e-05, 7.14072491382608190305e-05, -1.85586374855275456654e-05,
    2.59073051863633712884e-05];
  const pio4 = 7.85398163397448278999e-01, pio4lo = 3.06161699786838301793e-17;
  function kTan(x, y, iy) {
    let z, r, v, w, s;
    const hx = hi(x), ix = hx & 0x7fffffff;
    if (ix < 0x3e300000) {
      if ((x | 0) === 0) {
        if (((ix | lo(x)) | (iy + 1)) === 0) return 1.0 / Math.abs(x);
        if (iy === 1) return x;
        w = x + y; z = setLo0(w); v = y - (z - x);
        const a = -1.0 / w; let t = setLo0(a); s = 1.0 + t * z;
        return t + a * (s + t * v);
      }
    }
    if (ix >= 0x3FE59428) {
      if (hx < 0) { x = -x; y = -y; }
      z = pio4 - x; w = pio4lo - y; x = z + w; y = 0.0;
    }
    z = x * x; w = z * z;
    r = T[1] + w * (T[3] + w * (T[5] + w * (T[7] + w * (T[9] + w * T[11]))));
    v = z * (T[2] + w * (T[4] + w * (T[6] + w * (T[8] + w * (T[10] + w * T[12])))));
    s = z * x;
    r = y + z * (s * (r + v) + y);
    r += T[0] * s;
    w = x + r;
    if (ix >= 0x3FE59428) {
      v = iy;
      return (1 - ((hx >> 30) & 2)) * (v - 2.0 * (x - (w * w / (w + v) - r)));
    }
    if (iy === 1) return w;
    z = setLo0(w); v = r - (z - x);
    const a = -1.0 / w; const t = setLo0(a); s = 1.0 + t * z;
    return t + a * (s + t * v);
  }
  function tan(x) {
    x = +x;
    const ix = hi(x) & 0x7fffffff;
    if (ix <= 0x3fe921fb) return kTan(x, 0, 1);
    if (ix >= 0x7ff00000) return NaN;
    const n = remPio2(x);
    return kTan(Y[0], Y[1], 1 - ((n & 1) << 1));
  }

  // ---- atan, atan2 (fdlibm) ----
  const ATANHI = [4.63647609000806093515e-01, 7.85398163397448278999e-01, 9.82793723247329054082e-01, 1.57079632679489655800e+00];
  const ATANLO = [2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17];
  const AT = [3.33333333333329318027e-01, -1.99999999998764832476e-01, 1.42857142725034663711e-01,
    -1.11111104054623557880e-01, 9.09088713343650656196e-02, -7.69187620504482999495e-02,
    6.66107313738753120669e-02, -5.83357013379057348645e-02, 4.97687799461593236017e-02,
    -3.65315727442169155270e-02, 1.62858201153657823623e-02];
  function atan(x) {
    x = +x;
    const hx = hi(x), ix = hx & 0x7fffffff;
    let id;
    if (ix >= 0x44100000) {
      if (ix > 0x7ff00000 || (ix === 0x7ff00000 && lo(x) !== 0)) return NaN;
      return hx > 0 ? ATANHI[3] + ATANLO[3] : -ATANHI[3] - ATANLO[3];
    }
    if (ix < 0x3fdc0000) {
      if (ix < 0x3e400000) return x;
      id = -1;
    } else {
      x = Math.abs(x);
      if (ix < 0x3ff30000) {
        if (ix < 0x3fe60000) { id = 0; x = (2.0 * x - 1.0) / (2.0 + x); }
        else { id = 1; x = (x - 1.0) / (x + 1.0); }
      } else if (ix < 0x40038000) { id = 2; x = (x - 1.5) / (1.0 + 1.5 * x); }
      else { id = 3; x = -1.0 / x; }
    }
    const z = x * x, w = z * z;
    const s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))));
    const s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))));
    if (id < 0) return x - x * (s1 + s2);
    const r = ATANHI[id] - ((x * (s1 + s2) - ATANLO[id]) - x);
    return hx < 0 ? -r : r;
  }
  const tiny = 1.0e-300, pi_o_4 = 7.8539816339744827900E-01, pi_o_2 = 1.5707963267948965580E+00,
    PI = 3.1415926535897931160E+00, pi_lo = 1.2246467991473531772E-16;
  function atan2(y, x) {
    y = +y; x = +x;
    const hx = hi(x), lx = lo(x), ix = hx & 0x7fffffff;
    const hy = hi(y), ly = lo(y), iy = hy & 0x7fffffff;
    if ((ix | ((lx | -lx) >>> 31)) > 0x7ff00000 || (iy | ((ly | -ly) >>> 31)) > 0x7ff00000) return NaN;
    if (hx === 0x3ff00000 && lx === 0) return atan(y);
    let m = ((hy >> 31) & 1) | ((hx >> 30) & 2);
    if ((iy | ly) === 0) {
      if (m < 2) return y;
      return m === 2 ? PI + tiny : -PI - tiny;
    }
    if ((ix | lx) === 0) return hy < 0 ? -pi_o_2 - tiny : pi_o_2 + tiny;
    if (ix === 0x7ff00000) {
      if (iy === 0x7ff00000) {
        switch (m) { case 0: return pi_o_4 + tiny; case 1: return -pi_o_4 - tiny; case 2: return 3.0 * pi_o_4 + tiny; default: return -3.0 * pi_o_4 - tiny; }
      }
      switch (m) { case 0: return 0.0; case 1: return -0.0; case 2: return PI + tiny; default: return -PI - tiny; }
    }
    if (iy === 0x7ff00000) return hy < 0 ? -pi_o_2 - tiny : pi_o_2 + tiny;
    const k = (iy - ix) >> 20;
    let z;
    if (k > 60) { z = pi_o_2 + 0.5 * pi_lo; m &= 1; }
    else if (hx < 0 && k < -60) z = 0.0;
    else z = atan(Math.abs(y / x));
    switch (m) {
      case 0: return z;
      case 1: return -z;
      case 2: return PI - (z - pi_lo);
      default: return (z - pi_lo) - PI;
    }
  }

  // ---- acos (fdlibm) ----
  const pio2_hi = 1.57079632679489655800e+00, pio2_lo = 6.12323399573676603587e-17,
    pS0 = 1.66666666666666657415e-01, pS1 = -3.25565818622400915405e-01, pS2 = 2.01212532134862925881e-01,
    pS3 = -4.00555345006794114027e-02, pS4 = 7.91534994289814532176e-04, pS5 = 3.47933107596021167570e-05,
    qS1 = -2.40339491173441421878e+00, qS2 = 2.02094576023350569471e+00, qS3 = -6.88283971605453293030e-01,
    qS4 = 7.70381505559019352791e-02;
  function acos(x) {
    x = +x;
    const hx = hi(x), ix = hx & 0x7fffffff;
    let z, p, q, r, w, s, c, df;
    if (ix >= 0x3ff00000) {
      if (((ix - 0x3ff00000) | lo(x)) === 0) return hx > 0 ? 0.0 : PI + 2.0 * pio2_lo;
      return NaN;
    }
    if (ix < 0x3fe00000) {
      if (ix <= 0x3c600000) return pio2_hi + pio2_lo;
      z = x * x;
      p = z * (pS0 + z * (pS1 + z * (pS2 + z * (pS3 + z * (pS4 + z * pS5)))));
      q = 1.0 + z * (qS1 + z * (qS2 + z * (qS3 + z * qS4)));
      r = p / q;
      return pio2_hi - (x - (pio2_lo - x * r));
    }
    if (hx < 0) {
      z = (1.0 + x) * 0.5;
      p = z * (pS0 + z * (pS1 + z * (pS2 + z * (pS3 + z * (pS4 + z * pS5)))));
      q = 1.0 + z * (qS1 + z * (qS2 + z * (qS3 + z * qS4)));
      s = Math.sqrt(z);
      r = p / q;
      w = r * s - pio2_lo;
      return PI - 2.0 * (s + w);
    }
    z = (1.0 - x) * 0.5;
    s = Math.sqrt(z);
    df = setLo0(s);
    c = (z - df * df) / (s + df);
    p = z * (pS0 + z * (pS1 + z * (pS2 + z * (pS3 + z * (pS4 + z * pS5)))));
    q = 1.0 + z * (qS1 + z * (qS2 + z * (qS3 + z * qS4)));
    r = p / q;
    w = r * s + c;
    return 2.0 * (df + w);
  }

  const nativo = { sin: Math.sin, cos: Math.cos, tan: Math.tan, atan: Math.atan, atan2: Math.atan2, acos: Math.acos };
  let installato = false;
  function installa() {
    if (installato) return false;
    installato = true;
    Math.sin = sin; Math.cos = cos; Math.tan = tan; Math.atan = atan; Math.atan2 = atan2; Math.acos = acos;
    return true;
  }
  const GSMAT = { sin, cos, tan, atan, atan2, acos, installa, nativo, get installato() { return installato; }, _remPio2: remPio2, _Y: Y };
  root.GSMAT = GSMAT;
  if (typeof module !== 'undefined' && module.exports) module.exports = GSMAT;
})(typeof window !== 'undefined' ? window : globalThis);
