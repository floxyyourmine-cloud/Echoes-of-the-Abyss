/* ==========================================================================
   ECHOES OF THE ABYSS - WHISPERING FOREST MODULE
   Whispering Woods map, wilderness paths, river, camp, sacred shrine,
   gatherables, chests, wildlife, and gate to Lantern Valley Village.
   ========================================================================== */
/* ===== HUTAN BISIKAN ===== */
(function () {
  'use strict';
  const { TAU, clamp, lerp, E, mkRng, mkCv, rc, disc, ell, hash, vnoise, h2r, mixc, dense, distPoly, person, art, S: W_ } = WORLD;
  const FW = 1800, FH = 720;
  const MAIN = [[210, 96], [210, 168], [236, 236], [330, 290], [470, 312], [600, 292], [700, 276], [790, 298], [870, 302], [960, 322], [1060, 362], [1170, 378], [1290, 350], [1410, 322], [1530, 326], [1650, 346], [1800, 348]];
  const CAMP = [[470, 312], [500, 372], [540, 430], [565, 468]];
  const SHR = [[1060, 362], [1030, 300], [1010, 236], [1008, 192]];
  const PW = 66, PS = 46;
  const POND = { x: 400, y: 600, rx: 96, ry: 46 }, CAMPC = { x: 570, y: 478, r: 98 }, SHRC = { x: 1008, y: 166, r: 100 }, MEAD = { x: 1260, y: 585, r: 130 };
  const SIGNP = [[256, 134], [770, 330], [536, 352], [1090, 322], [1670, 396]];
  const rx = y => 830 + 14 * Math.sin(y / 55) + 6 * Math.sin(y / 23), rhw = y => 24 + 3 * Math.sin(y / 31);
  const CHESTS = [{ id: 'f1', x: 1510, y: 650, g: 110 }, { id: 'f2', x: 318, y: 664, g: 80 }, { id: 'f3', x: 1300, y: 104, g: 95 }, { id: 'f4', x: 700, y: 570, g: 70 }];
  const KIND = { herb: ['Herba Hutan', '#58c05a'], mush: ['Jamur Cahaya', '#ff7a8a'], flower: ['Bunga Kristal', '#7ab8ff'] };

  const F = WORLD.AREAS.forest = {
    name: 'HUTAN BISIKAN', sub: 'Whispering Woods', w: FW, h: FH, spawn: [210, 124], door: { x: 210, y: 100 }, doorO: 0, ready: 0, objs: [], dyn: [], npcs: [], walls: [], bg: null, gath: [], chests: [], crit: [], sparks: [], _L: []
  };
  const MAINd = dense(MAIN, 4), CAMPd = dense(CAMP, 4), SHRd = dense(SHR, 4);
  const cliffRect = [30, 0, 362, 94];
  function free(x, y, m) {
    if (x < 16 || x > FW - 16 || y < 18 || y > FH - 18) return false;
    if (x > cliffRect[0] - 10 - m && x < cliffRect[0] + cliffRect[2] + 10 + m && y < 128 + m) return false;
    if (distPoly(x, y, MAINd) < PW / 2 + m || distPoly(x, y, CAMPd) < PS / 2 + m || distPoly(x, y, SHRd) < PS / 2 + m) return false;
    if (Math.abs(x - rx(y)) < rhw(y) + 14 + m) return false;
    if (Math.hypot(x - CAMPC.x, y - CAMPC.y) < CAMPC.r + m || Math.hypot(x - SHRC.x, y - SHRC.y) < SHRC.r + m || Math.hypot(x - MEAD.x, (y - MEAD.y) * 1.15) < MEAD.r + m * .5) return false;
    if (((x - POND.x) / (POND.rx + 12 + m)) ** 2 + ((y - POND.y) / (POND.ry + 12 + m)) ** 2 < 1) return false;
    if (x > FW - 150 && Math.abs(y - 348) < 80) return false;
    if (CHESTS.some(c => Math.hypot(x - c.x, y - c.y) < 26 + m)) return false;
    if (SIGNP.some(c => Math.hypot(x - c[0], y - c[1] - 14) < 44 + m)) return false;
    return true;
  }
  F.free = free;

  F.build = function () {
    const rng = mkRng(2024), [bg, x] = mkCv(FW, FH); F.bg = bg;
    /* --- tanah rumput (per-piksel, cepat lewat ImageData) --- */
    const id = x.createImageData(FW, FH), d = id.data, GD = h2r('#366e30'), GL = h2r('#68a846'), GY = h2r('#80a03c');
    for (let yy = 0; yy < FH; yy++) for (let xx = 0; xx < FW; xx++) {
      const v = vnoise(xx / 64, yy / 64, 1) * .62 + vnoise(xx / 15, yy / 15, 2) * .38, yl = vnoise(xx / 170, yy / 170, 3), sp = hash(xx, yy, 9);
      let c = mixc(GD, GL, v); c = mixc(c, GY, yl * .22); if (sp < .05) c = mixc(c, [10, 40, 20], .3); else if (sp > .965) c = mixc(c, [210, 240, 140], .22);
      const o = (yy * FW + xx) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255
    }
    x.putImageData(id, 0, 0);
    // rumput liar & bunga tersebar
    for (let i = 0; i < 1500; i++) { const a = rng() * FW, b = rng() * FH; art.grassTuft(x, a, b, rng) }
    const fcols = ['#ffffff', '#ffd34d', '#ff9ac0', '#b48cff', '#7ab8ff', '#ff7a7a'];
    for (let i = 0; i < 170; i++) { const a = rng() * FW, b = rng() * FH; art.flower(x, a, b, fcols[(rng() * 6) | 0]) }
    // padang bunga
    for (let i = 0; i < 700; i++) { const an = rng() * TAU, dd = Math.sqrt(rng()) * MEAD.r; art.flower(x, MEAD.x + Math.cos(an) * dd, MEAD.y + Math.sin(an) * dd / 1.15, fcols[(rng() * 6) | 0]) }

    /* --- perkemahan: tanah injak --- */
    ell(x, 'rgba(70,48,28,.55)', CAMPC.x, CAMPC.y, 62, 40); ell(x, '#8a6a42', CAMPC.x, CAMPC.y, 58, 36); ell(x, '#9a7a4c', CAMPC.x - 4, CAMPC.y - 3, 46, 28); for (let i = 0; i < 40; i++) rc(x, rng() < .5 ? '#7a5a38' : '#b08a58', CAMPC.x + (rng() - .5) * 100, CAMPC.y + (rng() - .5) * 60, 3, 1);
    /* --- sungai --- */
    for (let yy = 0; yy < FH; yy++) {
      const c = rx(yy), hw = rhw(yy) | 0, i0 = Math.round(c);
      rc(x, '#7a6a48', i0 - hw - 6, yy, hw * 2 + 12, 1); rc(x, '#a8946a', i0 - hw - 4, yy, hw * 2 + 8, 1); rc(x, '#2a6a8a', i0 - hw - 1, yy, hw * 2 + 2, 1); rc(x, '#3a8ab0', i0 - hw + 1, yy, hw * 2 - 2, 1); rc(x, '#4aa4cc', i0 - hw / 2, yy, hw, 1);
      if ((yy + i0) % 9 < 1) rc(x, '#7ac8e8', i0 - hw / 3 + (yy % 5), yy, 5, 1);
    }
    for (let i = 0; i < 40; i++) { const yy = rng() * FH, side = rng() < .5 ? -1 : 1, bx = rx(yy) + side * (rhw(yy) + 5); const r = art.rock(i + 5, false); x.drawImage(r.img, bx - r.ox, yy - r.oy) }
    /* --- kolam --- */
    ell(x, '#7a6a48', POND.x, POND.y, POND.rx + 8, POND.ry + 6); ell(x, '#a8946a', POND.x, POND.y, POND.rx + 5, POND.ry + 3); ell(x, '#2a6a8a', POND.x, POND.y, POND.rx, POND.ry); ell(x, '#3a8ab0', POND.x, POND.y, POND.rx - 4, POND.ry - 3); ell(x, '#4aa4cc', POND.x - 6, POND.y - 3, POND.rx - 22, POND.ry - 14); ell(x, '#6ac0e0', POND.x - 14, POND.y - 6, POND.rx - 50, POND.ry - 26);
    for (let i = 0; i < 7; i++) { const a = POND.x + (rng() - .5) * 120, b = POND.y + (rng() - .5) * 50; ell(x, '#2f7a3a', a, b, 6, 3); ell(x, '#4aa04a', a - 1, b - 1, 4, 2); if (rng() < .5) { rc(x, '#ffb0d0', a - 1, b - 2, 3, 2) } }
    /* --- jalur tanah --- */
    const stamp = (dn, w) => {
      dn.forEach(([a, b]) => disc(x, '#6e5030', a, b, w / 2 + 3)); dn.forEach(([a, b]) => disc(x, '#a07a4a', a, b, w / 2 + 1)); dn.forEach(([a, b], i) => { if (i % 2 == 0) disc(x, '#b48c58', a + (rng() - .5) * 4, b + (rng() - .5) * 4, w / 2 - 3) });
      dn.forEach(([a, b], i) => { if (i % 3 == 0) { rc(x, '#8a6640', a + (rng() - .5) * w * .8, b + (rng() - .5) * w * .8, 3 + rng() * 3, 1); if (rng() < .35) rc(x, '#c8a06a', a + (rng() - .5) * w * .8, b + (rng() - .5) * w * .8, 2, 1) } });
      dn.forEach(([a, b], i) => { if (i % 5 == 0) { const s = rng() < .5 ? -1 : 1, off = w / 2 + 2; art.grassTuft(x, a + s * off * (.8 + rng() * .4), b + (rng() - .5) * 4, rng) } });
      dn.forEach(([a, b], i) => { if (i % 40 == 0) art.pebbles(x, a + (rng() - .5) * w * .7, b + (rng() - .5) * w * .6, rng) })
    };
    stamp(CAMPd, PS); stamp(SHRd, PS); stamp(MAINd, PW);
    /* --- jembatan --- */
    const BX0 = 786, BX1 = 874, BY0 = 266, BY1 = 332;
    rc(x, 'rgba(0,0,0,.28)', BX0 + 2, BY1 + 2, BX1 - BX0, 7);
    for (let xx = BX0; xx < BX1; xx += 4) { rc(x, '#4a301a', xx, BY0 - 1, 4, BY1 - BY0 + 3); rc(x, xx % 8 ? '#9a7444' : '#8a6440', xx + 1, BY0, 3, BY1 - BY0 + 1); rc(x, '#b8905a', xx + 1, BY0, 3, 1) }
    [BY0 - 3, BY1 + 1].forEach((yy, k) => { rc(x, OLC, BX0 - 3, yy - 1, BX1 - BX0 + 6, 5); rc(x, k ? '#8a6440' : '#a8825a', BX0 - 2, yy, BX1 - BX0 + 4, 3); rc(x, '#c8a46a', BX0 - 2, yy, BX1 - BX0 + 4, 1); for (let xx = BX0; xx <= BX1; xx += 18) { rc(x, OLC, xx - 1, yy - 3, 6, 10); rc(x, '#7a5434', xx, yy - 2, 4, 8); rc(x, '#b8905a', xx, yy - 2, 1, 8) } });

    // tanah di depan bukit sedikit menggelap (halus)
    { const gr = x.createRadialGradient(210, 104, 30, 210, 104, 190); gr.addColorStop(0, 'rgba(16,6,30,.5)'); gr.addColorStop(1, 'rgba(24,10,40,0)'); x.fillStyle = gr; x.fillRect(0, 0, 440, 260); }
    /* --- tebing + pintu dungeon --- */
    const cx0 = cliffRect[0], cx1 = cliffRect[0] + cliffRect[2];
    for (let cx = cx0; cx <= cx1; cx++) {
      const edge = Math.min(cx - cx0, cx1 - cx), rnd = edge < 16 ? Math.sqrt(1 - Math.pow((16 - edge) / 16, 2)) : 1, hh = Math.round((82 + vnoise(cx / 16, 0, 9) * 12) * (.55 + .45 * rnd));
      for (let yy = 0; yy < hh; yy++) { const n = vnoise(cx / 9, yy / 5, 11), n2 = vnoise(cx / 40, yy / 30, 12); let col = n < .33 ? '#1d1729' : n < .68 ? '#292139' : '#382e4e'; if (n2 > .66) col = n < .5 ? '#1d1729' : '#2d2540'; if (yy < 4) col = '#4c4068'; if (yy > hh - 5) col = n < .5 ? '#0f0b18' : '#1d1729'; rc(x, col, cx, yy, 1, 1) }
      rc(x, OLC, cx, hh, 1, 2)
    }
    for (let i = 0; i < 22; i++) { const a = cx0 + 10 + rng() * (cx1 - cx0 - 20), b = 6 + rng() * 70, l = 6 + rng() * 16; rc(x, '#34303c', a, b, 1, l); rc(x, '#8a8696', a + 1, b, 1, l * .6) }
    for (let i = 0; i < 60; i++) { const a = cx0 + rng() * (cx1 - cx0), b = rng() * 86; if (vnoise(a / 12, b / 8, 21) > .55) { rc(x, '#3a2a58', a, b, 3, 2); rc(x, '#5a3a78', a, b, 2, 1) } }
    for (let i = 0; i < 28; i++) { const a = cx0 + 8 + rng() * (cx1 - cx0 - 16), b = 80 + rng() * 10; rc(x, '#2a1a40', a, b - 6, 1, 8); rc(x, '#4a2a68', a + 1, b - 4, 1, 6) }
    ell(x, 'rgba(0,0,0,.32)', 210, 98, 190, 6);
    // --- reruntuhan benteng Abyss: batu gelap menyatu dengan tebing, berlumut & dililit sulur hutan ---
    // (pakai RNG terpisah supaya letak pohon/tanaman/satwa di hutan tidak berubah)
    F.castle = { wins: [], torches: [], runes: [] };
    {
      const cr = mkRng(7777), ZK = '#09060f', Z0 = '#14101e', Z1 = '#1d1729', Z2 = '#292139', Z3 = '#382e4e', Z4 = '#4c4068', MO = ['#1f3a26', '#2f5a34', '#4a8a3a'], wins = F.castle.wins, D0 = F.door.x, TOP = {};
      // tembok batu bersusun: lumut di sisi atas, bercak lumut, retakan; jag = bentuk puncak (merlon / runtuh)
      const stone = (a, b, w, h, jag) => {
        const j0 = jag ? jag(0) | 0 : 0, j1 = jag ? jag(w - 1) | 0 : 0;
        for (let xx = 0; xx < w; xx++) {
          const top = jag ? jag(xx) | 0 : 0, md = 1 + vnoise((a + xx) / 7, 0, 33) * 4, k = a + xx; TOP[k] = TOP[k] === undefined ? b + top : Math.min(TOP[k], b + top);
          for (let yy = top; yy < h; yy++) {
            const row = (yy / 7) | 0, mort = yy % 7 === 0 || (xx + row * 5) % 13 === 0, n = vnoise((a + xx) / 5, (b + yy) / 4, 31), m = vnoise((a + xx) / 9, (b + yy) / 7, 41);
            let c = mort ? Z0 : n < .3 ? Z1 : n < .66 ? Z2 : Z3;
            if (xx > w - 5) c = mort ? ZK : Z1; else if (xx < 2) c = Z4;
            if (yy - top < md) c = MO[(n * 3) | 0]; else if (m > .74 && !mort) c = MO[n < .5 ? 0 : 1]; else if (hash(a + xx, b + yy, 7) > .993) c = ZK;
            rc(x, c, a + xx, b + yy, 1, 1)
          }
          rc(x, ZK, a + xx, b + top - 1, 1, 1)
        }
        rc(x, ZK, a - 1, b + j0, 1, h - j0); rc(x, ZK, a + w, b + j1, 1, h - j1)
      };
      const slit = (cx, cy, h) => { rc(x, ZK, cx - 3, cy - 2, 7, h + 3); rc(x, ZK, cx - 2, cy - 3, 5, 1); rc(x, '#4a2090', cx - 2, cy - 1, 5, h); rc(x, '#a070ff', cx - 1, cy, 3, h - 1); rc(x, '#e0d0ff', cx, cy + 1, 1, 2); wins.push([cx, cy + h / 2, 10]) };
      // 1) tembok runtuh yang tenggelam ke dalam tebing, menara kiri utuh, menara kanan patah, gerbang tengah paling tinggi
      stone(58, 46, 112, 51, xx => 3 + vnoise(xx / 4, 1, 52) * 9 + (xx < 16 ? (16 - xx) * 1.1 : 0));
      stone(250, 46, 112, 51, xx => 3 + vnoise(xx / 4, 2, 53) * 9 + (xx > 95 ? (xx - 95) * 1.1 : 0));
      stone(D0 - 109, 22, 34, 75, xx => xx % 10 < 6 ? 0 : 5); rc(x, ZK, D0 - 111, 34, 38, 3); rc(x, Z3, D0 - 110, 35, 36, 1);
      stone(D0 + 75, 30, 34, 67, xx => 3 + vnoise(xx / 3, 7, 54) * 13);
      stone(D0 - 46, 8, 92, 90, xx => (xx + 2) % 14 < 9 ? 0 : 6);
      // 2) pilaster, tympanum gotik dengan segel rune, ambang & kusen pintu (batu gelap, bukan krem)
      [D0 - 35, D0 + 29].forEach((a, i) => { rc(x, ZK, a - 1, 26, 9, 72); rc(x, Z3, a, 27, 7, 71); rc(x, i ? Z2 : Z4, i ? a + 5 : a, 27, i ? 2 : 1, 71); for (let j = 0; j < 8; j++) rc(x, Z0, a, 34 + j * 8, 7, 1); rc(x, Z4, a - 1, 26, 9, 3); rc(x, ZK, a - 1, 29, 9, 1) });
      for (let yy = 16; yy <= 33; yy++) { const hw = Math.min(22, Math.round((yy - 16) * 1.3)); rc(x, ZK, D0 - hw - 2, yy, hw * 2 + 5, 1); rc(x, Z4, D0 - hw - 1, yy, hw * 2 + 3, 1); if (hw > 0) rc(x, Z0, D0 - hw + 1, yy, hw * 2 - 1, 1) }
      disc(x, ZK, D0, 26, 8); disc(x, '#2a1858', D0, 26, 7); disc(x, '#6a3ad8', D0, 26, 5); disc(x, '#b090ff', D0, 26, 3); disc(x, '#f0e0ff', D0, 26, 1);
      for (let i = 0; i < 8; i++) { const an = i / 8 * TAU; rc(x, '#a888ff', Math.round(D0 + Math.cos(an) * 6), Math.round(26 + Math.sin(an) * 6), 1, 1) }
      F.castle.runes.push([D0, 26, 34]);
      rc(x, ZK, D0 - 28, 33, 56, 12); rc(x, Z3, D0 - 27, 34, 54, 10); rc(x, Z4, D0 - 27, 34, 54, 1); rc(x, Z2, D0 - 27, 42, 54, 2);
      rc(x, ZK, D0 - 6, 33, 12, 10); rc(x, Z4, D0 - 5, 34, 10, 8); rc(x, '#b090ff', D0 - 1, 36, 3, 3); rc(x, '#e0d0ff', D0, 37, 1, 1);
      [-22, -16, -11, 11, 16, 22].forEach(o => { rc(x, '#7a4ae0', D0 + o, 37, 1, 4); rc(x, '#7a4ae0', D0 + o - 1, 38, 3, 1) });
      [D0 - 27, D0 + 18].forEach((a, i) => { rc(x, ZK, a, 44, 9, 54); rc(x, Z3, a + 1, 44, 7, 53); rc(x, i ? Z2 : Z4, i ? a + 7 : a + 1, 44, 1, 53); for (let j = 0; j < 6; j++) rc(x, Z0, a + 1, 52 + j * 8, 7, 1); for (let j = 0; j < 3; j++) rc(x, '#8a5af0', a + 4, 56 + j * 14, 1, 3) });
      rc(x, ZK, D0 - 28, 96, 56, 4); rc(x, Z3, D0 - 27, 97, 54, 2); rc(x, Z4, D0 - 27, 97, 54, 1);
      // 3) obor besi di sisi gerbang, panji sobek, celah jendela berpendar
      [-41, 41].forEach(dx => { const tx = D0 + dx; rc(x, ZK, tx - 2, 73, 5, 6); rc(x, '#4a4458', tx - 1, 73, 3, 5); rc(x, ZK, tx - 5, 66, 11, 8); rc(x, '#2a2438', tx - 4, 67, 9, 6); rc(x, '#4a4458', tx - 4, 67, 9, 1); F.castle.torches.push([tx, 65]) });
      const banner = (cx, ty, len) => { rc(x, ZK, cx - 8, ty - 1, 17, 4); rc(x, '#6a5238', cx - 7, ty, 15, 2); for (let i = 0; i < 13; i++) { const l = len - (i % 3 === 1 ? 5 : i % 5 === 0 ? 8 : 0); rc(x, ZK, cx - 6 + i, ty + 2, 1, l + 1); rc(x, i % 4 === 0 ? '#25123e' : '#3a1f5a', cx - 6 + i, ty + 2, 1, l) } rc(x, '#b090ff', cx - 1, ty + 9, 3, 3); rc(x, '#6a3ad8', cx, ty + 12, 1, 3) };
      banner(149, 52, 26); banner(271, 54, 22);
      slit(D0 - 92, 52, 12); slit(D0 + 92, 52, 12); slit(D0 - 38, 18, 8); slit(D0 + 38, 18, 8); slit(78, 64, 10); slit(340, 64, 10);
      // 4) sulur & lumut menjuntai dari puncak reruntuhan
      for (let i = 0; i < 44; i++) {
        const xv = 56 + ((cr() * 310) | 0), ay = TOP[xv]; if (ay === undefined || Math.abs(xv - D0) < 31) continue;
        const len = 6 + ((cr() * 26) | 0), ph = cr() * 6;
        for (let k = 0; k < len; k++) { const vx = xv + Math.round(Math.sin(k / 4 + ph) * 1.4); rc(x, k % 6 < 3 ? MO[1] : MO[0], vx, ay + k, 1, 1); if (k % 4 === 2) rc(x, MO[2], vx + (k % 8 < 4 ? 1 : -2), ay + k, 2, 2) }
      }
      // 5) puing, semak, rumput & jamur bercahaya di kaki benteng
      for (let i = 0; i < 26; i++) { const a = ([118, 302][i % 2] + (cr() - .5) * 90) | 0, b = (96 + cr() * 6) | 0, w = 3 + ((cr() * 5) | 0); rc(x, ZK, a - 1, b - 1, w + 2, 5); rc(x, cr() < .5 ? Z2 : Z3, a, b, w, 3); rc(x, Z4, a, b, w, 1) }
      for (let i = 0; i < 70; i++) { const a = 40 + cr() * 340; if (Math.abs(a - D0) < 52) continue; art.grassTuft(x, a, 96 + cr() * 6, cr) }
      [70, 108, 146, 262, 300, 340, 364].forEach((a, i) => { const s = art.bush(i + 21); x.drawImage(s.img, Math.round(a + (cr() - .5) * 8 - s.ox), Math.round(99 + cr() * 3 - s.oy)) });
      [[128, 101], [291, 102], [334, 100], [87, 101]].forEach(([a, b]) => { for (let k = 0; k < 3; k++) { const mx = a + k * 5 - 5, my = b - (k % 2) * 2; rc(x, ZK, mx - 2, my - 5, 6, 4); rc(x, '#8a5af0', mx - 1, my - 4, 4, 2); rc(x, '#d0b0ff', mx, my - 4, 1, 1); rc(x, '#c8c0d8', mx, my - 2, 2, 3) } F.castle.runes.push([a, b - 3, 14]) });
      // 6) tangga batu lebar berlumut menuju pintu, menyambung ke jalan tanah
      [[D0 - 31, 100, 62], [D0 - 40, 104, 80], [D0 - 49, 108, 98]].forEach(([a, b, w], i) => {
        rc(x, ZK, a - 1, b, w + 2, 6); rc(x, i % 2 ? Z2 : Z3, a, b + 1, w, 4); rc(x, Z4, a, b + 1, w, 1); rc(x, Z1, a, b + 4, w, 1);
        for (let k = 0; k < 5; k++) rc(x, MO[(cr() * 3) | 0], (a + cr() * w) | 0, (b + 1 + cr() * 3) | 0, 2 + ((cr() * 3) | 0), 1);
        rc(x, ZK, a + ((cr() * w) | 0), b + 2, 1, 3)
      });
    }

    /* --- lantai kuil mata air --- */
    ell(x, 'rgba(0,0,0,.3)', SHRC.x, SHRC.y + 4, 56, 36); ell(x, '#6a6a78', SHRC.x, SHRC.y, 54, 34); ell(x, '#8a8a98', SHRC.x, SHRC.y, 51, 31);
    for (let i = 0; i < 90; i++) { const an = rng() * TAU, dd = 8 + Math.sqrt(rng()) * 42; rc(x, rng() < .5 ? '#7a7a88' : '#9a9aa8', SHRC.x + Math.cos(an) * dd, SHRC.y + Math.sin(an) * dd * .62, 4, 1) }
    ell(x, '#4a4a58', SHRC.x, SHRC.y, 22, 13); ell(x, '#3a8ab0', SHRC.x, SHRC.y, 19, 10); ell(x, '#6ac8f0', SHRC.x, SHRC.y, 14, 7); ell(x, '#bff0ff', SHRC.x - 3, SHRC.y - 1, 8, 3);
    for (let i = 0; i < 40; i++) { const an = rng() * TAU, dd = 30 + rng() * 24; if (rng() < .7) art.grassTuft(x, SHRC.x + Math.cos(an) * dd, SHRC.y + Math.sin(an) * dd * .65, rng, ['#4a8a3a', '#6aaa4a', '#9ad06a']) }
    // api unggun (alas batu)
    for (let i = 0; i < 10; i++) { const an = i / 10 * TAU; const r = art.rock(i + 40, false); x.drawImage(r.img, CAMPC.x + Math.cos(an) * 15 - 6, CAMPC.y - 8 + Math.sin(an) * 8 - 6, 12, 9) }
    ell(x, '#2a1c12', CAMPC.x, CAMPC.y - 8, 10, 5);

    /* ---------- objek ---------- */
    const walls = [[-20, -20, FW + 40, 28], [-20, FH - 8, FW + 40, 30], [-20, -20, 28, FH + 40], [FW - 8, -20, 28, 300], [FW - 8, 410, 28, FH]];
    walls.push([cliffRect[0], -10, cliffRect[2], 92]);
    walls.push([808, -10, 44, BY0 - 4 + 10], [808, BY1 + 4, 44, FH]);   // sungai (celah jembatan y 294..320)
    walls.push([BX0, BY0 - 5, BX1 - BX0, 4], [BX0, BY1 + 3, BX1 - BX0, 4]);   // pagar jembatan
    for (let dy = -POND.ry; dy < POND.ry; dy += 10) { const k = Math.sqrt(1 - Math.pow((dy + 5) / POND.ry, 2)); walls.push([POND.x - POND.rx * k + 6, POND.y + dy, POND.rx * 2 * k - 12, 10]) }
    walls.push([SHRC.x - 18, SHRC.y - 8, 36, 20]);   // kolam mata air
    const objs = F.objs = [], addObj = (o, solid) => { objs.push(o); if (solid) walls.push(solid) };
    const spr = (s, px, py, solid) => addObj({ x: Math.round(px), y: Math.round(py), img: s.img, ox: s.ox, oy: s.oy, oh: s.img.height }, solid);
    // cache sprite variasi
    const OAK = [], PINE = [], BUSH = [], BERRY = [], ROCK = [], BIG = [];
    for (let i = 0; i < 7; i++) OAK.push(art.oak(i + 1, .85 + (i % 3) * .14)); for (let i = 0; i < 5; i++) PINE.push(art.pine(i + 1, .9 + (i % 3) * .12)); for (let i = 0; i < 4; i++) { BUSH.push(art.bush(i + 1)); BERRY.push(art.bush(i + 11, true)) } for (let i = 0; i < 4; i++) { ROCK.push(art.rock(i + 1)); BIG.push(art.rock(i + 9, true)) }
    // pohon
    const occ = new Map(), ck = (a, b) => ((a / 22) | 0) + ',' + ((b / 22) | 0), canPlace = (a, b, r) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = occ.get(((a / 22 | 0) + i) + ',' + ((b / 22 | 0) + j)); if (l && l.some(q => Math.hypot(q[0] - a, q[1] - b) < r)) return false } return true }, mark = (a, b) => { const k = ck(a, b); (occ.get(k) || occ.set(k, []).get(k)).push([a, b]) };
    const trees = [];
    for (let gy = 22; gy < FH - 10; gy += 27) for (let gx = 8; gx < FW - 8; gx += 27) {
      const a = gx + rng() * 24, b = gy + rng() * 24, nz = vnoise(a / 150, b / 150, 5), edge = a < 90 || a > FW - 60 || b < 56 || b > FH - 70, dens = edge ? .95 : clamp(.18 + nz * 1.15, .08, .9);
      if (rng() > dens || !free(a, b, 6) || !canPlace(a, b, 19) || [MAINd, CAMPd, SHRd].some(P_ => distPoly(a, b - 24, P_) < 30 || distPoly(a, b - 44, P_) < 22)) continue; mark(a, b); trees.push([a, b, rng()])
    }
    trees.forEach(([a, b, k]) => {
      ell(x, 'rgba(0,12,4,.24)', a + 4, b - 2, 17, 8); ell(x, 'rgba(0,12,4,.1)', a + 2, b - 12, 28, 15);
      const s = k < .62 ? OAK[(k * 100 | 0) % OAK.length] : PINE[(k * 100 | 0) % PINE.length]; spr(s, a, b + 4, [a - 4, b - 1, 8, 5]);
    });
    // semak, batu, tunggul, kayu tumbang tersebar
    for (let i = 0; i < 160; i++) { const a = rng() * FW, b = rng() * FH; if (!free(a, b, 8) || !canPlace(a, b, 13)) continue; mark(a, b); const k = rng(); if (k < .45) spr(rng() < .25 ? BERRY[i % 4] : BUSH[i % 4], a, b); else if (k < .78) spr(ROCK[i % 4], a, b, [a - 7, b - 4, 14, 7]); else if (k < .88) spr(BIG[i % 4], a, b + 3, [a - 12, b - 6, 24, 10]); else if (k < .95) spr(art.stump(), a, b, [a - 6, b - 4, 12, 6]); else spr(art.log(), a, b, [a - 14, b - 4, 28, 6]) }
    // perkemahan
    spr(art.tent(), CAMPC.x - 42, CAMPC.y - 14, [CAMPC.x - 70, CAMPC.y - 36, 56, 22]); spr(art.rack(), CAMPC.x + 48, CAMPC.y - 2, [CAMPC.x + 30, CAMPC.y - 8, 36, 8]);
    spr(art.log(), CAMPC.x - 28, CAMPC.y + 16, [CAMPC.x - 42, CAMPC.y + 12, 28, 6]); spr(art.log(), CAMPC.x + 22, CAMPC.y + 22, [CAMPC.x + 8, CAMPC.y + 18, 28, 6]); walls.push([CAMPC.x - 11, CAMPC.y - 14, 22, 12]);
    // pilar patah kuil
    [[-46, -14], [46, -14], [-34, 24], [34, 24]].forEach(([dx, dy], i) => { const [c, q] = mkCv(20, 40), h = i < 2 ? 30 : 16; rc(q, OLC, 3, 40 - h - 4, 14, h + 4); rc(q, '#9a9aa8', 4, 40 - h - 3, 12, h + 2); rc(q, '#bcbcc8', 4, 40 - h - 3, 4, h + 2); rc(q, '#6a6a78', 13, 40 - h - 3, 3, h + 2); rc(q, '#b0b0bc', 2, 38 - h - 4, 16, 3); rc(q, '#7a8a6a', 5, 40 - h, 3, 3); rc(q, '#4a8a3a', 4, 40 - h - 4, 6, 2); rc(q, '#6a6a78', 2, 34, 16, 4); rc(q, '#3a8a4a', 6, 30, 2, 5); spr({ img: c, ox: 10, oy: 36 }, SHRC.x + dx, SHRC.y + dy, [SHRC.x + dx - 7, SHRC.y + dy - 5, 14, 7]) });
    // gerbang desa (timur)
    (function () {
      const gx = FW - 64, mk = (h) => { const [c, q] = mkCv(20, h); rc(q, OLC, 3, 0, 14, h); rc(q, '#6a4a2c', 4, 1, 12, h - 2); rc(q, '#8a6440', 4, 1, 4, h - 2); rc(q, '#4a301a', 13, 1, 3, h - 2); rc(q, '#a8825a', 2, 2, 16, 4); rc(q, '#c8a46a', 2, 2, 16, 1); rc(q, '#5a5a66', 2, h - 6, 16, 6); return c };
      const post = mk(64); spr({ img: post, ox: 10, oy: 62 }, gx, 316, [gx - 9, 308, 18, 10]); spr({ img: post, ox: 10, oy: 62 }, gx, 390, [gx - 9, 382, 18, 10]);
      const [bc, bq] = mkCv(34, 56); rc(bq, OLC, 0, 8, 34, 14); rc(bq, '#7a5434', 1, 9, 32, 12); rc(bq, '#a8825a', 1, 9, 32, 3); rc(bq, '#4a301a', 1, 18, 32, 3); rc(bq, OLC, 2, 22, 30, 12); rc(bq, '#9a7444', 3, 23, 28, 10); rc(bq, '#b8905a', 3, 23, 28, 1); for (let i = 0; i < 8; i++) rc(bq, '#3a2414', 6 + i * 3, 27, 2, 3);
      rc(bq, OLC, 6, 34, 3, 8); rc(bq, '#5a5a66', 7, 34, 1, 7); rc(bq, OLC, 25, 34, 3, 8); rc(bq, '#5a5a66', 26, 34, 1, 7);[[7, 42], [26, 42]].forEach(([a, b]) => { rc(bq, OLC, a - 4, b, 9, 11); rc(bq, '#ffd870', a - 3, b + 1, 7, 9); rc(bq, '#fff3b8', a - 2, b + 2, 3, 5) });
      objs.push({ x: gx + 1, y: 296, img: bc, ox: 17, oy: 52, oh: 56, lamp: [[gx - 9, 292], [gx + 10, 292]] });
    })();
    // papan petunjuk (interaktif)
    const SIGNS = [[256, 134, 'Papan Petunjuk', ['â† Pintu Dungeon (Aula Kuno) ada di belakangmu. Hampiri pintunya lalu melangkahlah masuk bila ingin kembali ke Dungeon.', 'â†’ Desa Lembah Lentera, ke arah timur lewat jalan tanah. Hati-hati di perjalanan, pengelana.']], [770, 330, 'Papan Jembatan', ['Jembatan Tua Sungai Sunyi. Papannya lapuk, tapi masih kuat menahan seorang pahlawan.', 'â†’ Desa Lembah Lentera. Sebentar lagi sampai!']], [536, 352, 'Papan Perkemahan', ['â†“ Perkemahan Pemburu. Api unggun menyala dan ramah pada musafir yang lelah.']], [1090, 322, 'Papan Mata Air', ['â†‘ Mata Air Suci. Air yang mengalir dari bawah Dungeon. Minumlah untuk memulihkan diri.']], [FW - 130, 396, 'Papan Gerbang', ['Gerbang Desa Lembah Lentera. Gerbang Desa Lembah Lentera terbuka! Melangkahlah ke timur untuk memasuki desa.']]];
    SIGNS.forEach(([a, b, nm, ln]) => { spr(art.sign(), a, b, [a - 5, b - 4, 10, 6]); F.npcs.push({ n: nm, x: a, y: b - 6, sign: 1, rng: 34, lines: ln }) });
    // peti harta
    F.chests = CHESTS.map(c => ({ ...c, open: !!W_.chests[c.id], t: 0 }));
    F.chests.forEach(c => { const s0 = art.chest(false), s1 = art.chest(true); c.s0 = s0; c.s1 = s1; walls.push([c.x - 8, c.y - 5, 16, 6]); for (let i = 0; i < 4; i++) { const a = c.x + (i < 2 ? -1 : 1) * (18 + rng() * 6), b = c.y + (rng() - .3) * 14; spr(BUSH[(i + c.x) % 4 | 0], a, b) } for (let i = 0; i < 8; i++) art.flower(x, c.x + (rng() - .5) * 50, c.y + 10 + (rng() - .5) * 20, fcols[(rng() * 6) | 0]) });
    // penghalang kecil di dasar peti agar tidak tertimpa pohon
    F.walls = walls;
    /* --- bahan tanaman --- */
    const kinds = ['herb', 'herb', 'herb', 'herb', 'herb', 'herb', 'herb', 'herb', 'mush', 'mush', 'mush', 'mush', 'mush', 'mush', 'flower', 'flower', 'flower', 'flower', 'flower', 'flower', 'flower', 'flower'];
    F.gath = [];
    kinds.forEach((k, i) => { for (let n = 0; n < 200; n++) { let a, b; if (k === 'flower') { const an = rng() * TAU, dd = Math.sqrt(rng()) * (n < 150 ? MEAD.r - 10 : 400); a = (n < 150 ? MEAD.x : 700 + rng() * 800) + Math.cos(an) * dd; b = (n < 150 ? MEAD.y : 150 + rng() * 500) + Math.sin(an) * dd / 1.2 } else { a = 60 + rng() * (FW - 200); b = 130 + rng() * (FH - 170) } if (!free(a, b, 12) || F.gath.some(q => Math.hypot(q.x - a, q.y - b) < 40)) continue; if (walls.some(w => a > w[0] - 8 && a < w[0] + w[2] + 8 && b > w[1] - 8 && b < w[1] + w[3] + 8)) continue; F.gath.push({ k, x: a, y: b, got: 0, ph: rng() * 6 }); break } });
    // pendamping di jalur (lebih mudah ditemukan)
    [[300, 330, 'herb'], [650, 330, 'flower'], [700, 250, 'mush'], [940, 345, 'herb'], [1140, 412, 'mush']].forEach(([a, b, k]) => { if (!walls.some(w => a > w[0] - 8 && a < w[0] + w[2] + 8 && b > w[1] - 8 && b < w[1] + w[3] + 8)) F.gath.push({ k, x: a, y: b, got: 0, ph: rng() * 6 }) });
    /* --- percikan air --- */
    F.sparks = []; for (let i = 0; i < 90; i++) { const yy = rng() * FH; F.sparks.push({ x: rx(yy) + (rng() - .5) * rhw(yy) * 1.6, y: yy, ph: rng() * 6 }) } for (let i = 0; i < 40; i++) { const an = rng() * TAU, dd = Math.sqrt(rng()); F.sparks.push({ x: POND.x + Math.cos(an) * dd * (POND.rx - 8), y: POND.y + Math.sin(an) * dd * (POND.ry - 6), ph: rng() * 6 }) }
    /* --- NPC --- */
    F.npcs.push({
      n: 'Torvald, Pemburu', x: CAMPC.x + 14, y: CAMPC.y + 6, fc: -1, sk: '#d9a07a', hair: '#6a4a2c', beard: '#6a4a2c', hat: 'hood', hc: '#3a5a3a', c1: '#4a6a3a', c2: '#c2a06b', c3: '#3a3226', prop: 'pack', fresh: 1,
      get lines() { return this.seen ? ['Hutan ini tenang sekarang. Tapi bisikan di antara pohon itu... aku tak yakin itu cuma angin.', 'Jalan ke desa lurus ke timur, lewat jembatan. Bawa potion, dan jangan lupa kumpulkan bahan di sepanjang jalan.'] : ['Hm? Seseorang keluar dari pintu Dungeon... Jarang ada yang naik kembali dengan kaki sendiri.', 'Aku Torvald, pemburu. Hutan Bisikan ini satu-satunya jalan ke Desa Lembah Lentera. Ikuti jalur tanah ke timur, seberangi jembatan tua.', 'Petik herba, jamur cahaya, dan bunga kristal di sepanjang jalan. Pedagang di desa membeli semuanya dengan harga bagus.', 'Dan kalau kau menemukan peti kayu di balik semak... anggap saja itu rezeki untuk yang cukup jeli.'] }, act() { this.seen = 1; this.fresh = 0 }
    });
    F.npcs.push({
      n: 'Elowen, Penjaga Mata Air', x: SHRC.x + 34, y: SHRC.y + 14, fc: -1, sk: '#e8c8a8', hair: '#d8e0f0', hs: 'long', hat: 'hood', hc: '#cfd8ee', c1: '#cfd8ee', c2: '#8fe8ff', c3: '#8a98b8', robe: 1, prop: 'staff', pc: '#8fe8ff', fresh: 1,
      get lines() { return this.seen ? ['Air itu masih mengingat cahaya yang hilang. Minumlah kapan pun kau perlu.'] : ['Selamat datang, pengelana. Mata air ini mengalir dari jauh di bawah Dungeon, dan airnya masih mengingat cahaya yang hilang.', 'Minumlah, dan pulihkan dirimu. Mata air ini tak pernah kering bagi mereka yang pulang dari kegelapan.'] }, act() { this.seen = 1; this.fresh = 0; spring.act() }
    });
    const spring = { n: 'Mata Air Suci', x: SHRC.x, y: SHRC.y + 20, rng: 38, sign: 1, verb: 'Minum', cd: 0, get lines() { return t - this.cd < 25 ? ['Air jernih berkilau pelan. Kau sudah meminumnya baru-baru ini.'] : ['Air jernih berkilau biru. Kau menciduknya dengan tangan dan meminumnya... hangat mengalir ke seluruh tubuh.'] }, act() { if (t - this.cd < 25) return; this.cd = t; p.hp = mhp(); p.st = 100; p.sc = [0, 0, 0]; p.ec = 0; try { SFX.potion(); SFX.focus() } catch (e) { } fx.push({ k: 'ring', x: p.x, y: p.y, r: 20, w: 3, life: .5, max: .5, col: '#8fe8ff' }, { k: 'gl', x: p.x, y: p.y, r: 40, c: '120,240,255', life: .5, max: .5 }); dn(p.x, p.y - 14, 'HP & Stamina pulih', 0, '#8fe8ff') } };
    F.npcs.push(spring); F.spring = spring;
    /* --- kelinci --- */
    F.crit = []; for (let i = 0; i < 6; i++) { const base = i < 3 ? MEAD : CAMPC; let a, b; for (let n = 0; n < 60; n++) { const an = rng() * TAU, dd = Math.sqrt(rng()) * (base.r - 20); a = base.x + Math.cos(an) * dd; b = base.y + Math.sin(an) * dd * .8; if (!walls.some(w => a > w[0] - 6 && a < w[0] + w[2] + 6 && b > w[1] - 6 && b < w[1] + w[3] + 6)) break } F.crit.push({ x: a, y: b, vx: 0, vy: 0, st: 0, tm: rng() * 3, hz: 0, fc: rng() < .5 ? -1 : 1, col: i % 2 ? '#b8a898' : '#a8845a', ph: rng() * 6 }) }
    F.objs.sort((a, b) => a.y - b.y);
    F.dyn = [...F.npcs.filter(n => !n.sign).map((n, i) => ({ n, i, get y() { return n.y } })), ...F.crit.map(c => ({ c, get y() { return c.y } })), ...F.chests.map(c => ({ ch: c, y: c.y }))];
    // butiran cahaya
    F.ff = []; for (let i = 0; i < 46; i++) F.ff.push({ bx: rng(), by: rng(), sx: 4 + rng() * 8, sy: (rng() - .5) * 6, ph: rng() * 6, k: rng() });
    F.lv = []; for (let i = 0; i < 16; i++) F.lv.push({ bx: rng(), by: rng(), sp: 8 + rng() * 10, ph: rng() * 6, c: ['#6aaa3a', '#a8c040', '#d8a030', '#c86a2a'][(rng() * 4) | 0] });
    F.bf = []; for (let i = 0; i < 9; i++) { const an = rng() * TAU, dd = Math.sqrt(rng()) * 90; F.bf.push({ cx: MEAD.x + Math.cos(an) * dd, cy: MEAD.y + Math.sin(an) * dd * .7, ph: rng() * 6, c: ['#ffd34d', '#ff9ac0', '#7ab8ff', '#fff'][i % 4] }) }
  };
  const OLC = '#0f1a12';

  F.enter = function () { };

  /* ---------- update ---------- */
  F.tick = function (dt) {
    if (TR_on()) return;
    // tanaman
    for (const q of F.gath) { if (q.got) continue; if (Math.hypot(q.x - p.x, q.y - p.y) < 13) { q.got = 1; W_.inv[q.k]++; WORLD.save(); try { SFX.pickup() } catch (e) { } dn(p.x, p.y - 18, '+' + KIND[q.k][0], 0, KIND[q.k][1]); for (let i = 0; i < 6; i++)dp.push({ k: 'p', x: q.x, y: q.y - 4, vx: (Math.random() - .5) * 40, vy: -20 - Math.random() * 30, life: .5, max: .5, s: 1.5, c: KIND[q.k][1] }) } }
    // peti
    for (const c of F.chests) { c.t += dt; if (!c.open && Math.hypot(c.x - p.x, c.y - 4 - p.y) < 20) { c.open = 1; c.t = 0; W_.chests[c.id] = 1; const v = Math.round(c.g * (.85 + Math.random() * .3)); WORLD.addGold(v); try { SFX.pickup(); SFX.point() } catch (e) { } msg('Peti harta terbuka! +' + v + ' Emas'); fx.push({ k: 'gl', x: c.x, y: c.y - 8, r: 36, c: '255,210,90', life: .6, max: .6 }); for (let i = 0; i < 14; i++)dp.push({ k: 'p', x: c.x, y: c.y - 8, vx: (Math.random() - .5) * 90, vy: -40 - Math.random() * 60, life: .7, max: .7, s: 2, c: i % 2 ? '#ffd34d' : '#fff3a0' }) } }
    // kelinci
    for (const c of F.crit) {
      const d = Math.hypot(c.x - p.x, c.y - p.y); c.tm -= dt;
      if (c.st === 0) { if (d < 62) { c.st = 1; c.tm = .34; const a = Math.atan2(c.y - p.y, c.x - p.x) + (Math.random() - .5) * .8; c.vx = Math.cos(a) * 95; c.vy = Math.sin(a) * 70; c.fc = c.vx > 0 ? 1 : -1; c.hz = 0 } else if (c.tm <= 0) { c.tm = 1 + Math.random() * 3; if (Math.random() < .35) { c.st = 1; c.tm = .28; const a = Math.random() * TAU; c.vx = Math.cos(a) * 36; c.vy = Math.sin(a) * 26; c.fc = c.vx > 0 ? 1 : -1; c.hz = 0 } } }
      else { c.hz += dt; const nx = c.x + c.vx * dt, ny = c.y + c.vy * dt; if (!blk(nx, ny, 3)) { c.x = nx; c.y = ny } if (c.tm <= 0) { c.st = 0; c.tm = d < 70 ? .15 : 1 + Math.random() * 2 } }
    }
    // pintu dungeon (kembali ke lobby)
    if (!dlg && p.y < F.door.y + 8 && Math.abs(p.x - F.door.x) < 15 && p.vy < -6) { p.y = F.door.y + 14; p.vy = 0; if (typeof WORLD.onDungeonDoor === 'function') WORLD.onDungeonDoor(); else msg('Pintu Dungeon terkunci rapat dari dalam.') }
    // gerbang desa
    if (TR_cool() <= 0 && p.x > FW - 30 && Math.abs(p.y - 348) < 40 && p.vx > 8) { const V = WORLD.AREAS.village; if (V) { if (!V.ready) { V.ready = 1; V.build(); } WORLD.start('gate', { to: 'village', dx: 1, spawn: V.spawn }); msg('Memasuki Desa Lembah Lentera...'); return; } else { p.x = FW - 34; p.vx = 0; WORLD.TR.cool = 2.5; msg('Gerbang timur tertutup rapat.'); } }
  };
  const TR_on = () => WORLD.TR.on, TR_cool = () => WORLD.TR.cool;

  /* ---------- gambar ---------- */
  function lightL(a, b, rr, col, al) { g.save(); g.globalCompositeOperation = 'lighter'; const q = g.createRadialGradient(a, b, 0, a, b, rr); q.addColorStop(0, 'rgba(' + col + ',' + al + ')'); q.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = q; g.fillRect(a - rr, b - rr, rr * 2, rr * 2); g.restore() }
  WORLD.lightL = lightL;
  function drawDoor(o) {
    const DX = F.door.x, x0 = DX - 18, y0 = 44, w = 36, h = 52, R = (c, a, b, ww, hh) => { g.fillStyle = c; g.fillRect(a, b, ww, hh) };
    R('#07060c', x0, y0, w, h);
    if (o > .02) { [[120, 70, 30], [205, 122, 52], [255, 192, 112], [255, 232, 170]].forEach((c, i) => R('rgb(' + (7 + (c[0] - 7) * o | 0) + ',' + (6 + (c[1] - 6) * o | 0) + ',' + (12 + (c[2] - 12) * o | 0) + ')', x0 + i * 4, y0 + i * 3, w - i * 8, h - i * 3)) }
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); const off = Math.round(o * 18);
    [x0 - off, DX + off].forEach(a => { R('#6b5f55', a, y0, 18, h); R('#8a7d70', a, y0, 18, 1); R('#4f463e', a + 5, y0, 1, h); R('#4f463e', a + 12, y0, 1, h); R('#3a342e', a, y0 + 22, 18, 3); R('#3a342e', a, y0 + 38, 18, 2); R('#b18b59', a + 2, y0 + 23, 1, 1); R('#b18b59', a + 15, y0 + 23, 1, 1); R('#2b2620', a, y0 + h - 1, 18, 1) });
    if (off < 3) { R('#b18b59', DX - 1, y0, 2, h); R('#c39a5d', DX - 3, y0 + 28, 6, 8) }
    g.restore();
    if (o > .02) { g.save(); g.globalCompositeOperation = 'lighter'; for (let yy = 96; yy < 150; yy += 2) { const tt = (yy - 96) / 54, half = Math.round(17 + tt * 22), a = Math.round(.28 * o * (1 - tt) * 25) / 25; if (a > 0) { g.fillStyle = 'rgba(255,205,140,' + a + ')'; g.fillRect(DX - half, yy, half * 2, 2) } } g.restore(); lightL(DX, 100, 70, '255,200,130', .22 * o) }
  }
  F.env = function () {
    const vx0 = camX - 20, vx1 = camX + W / CAM_Z + 20, vy0 = camY - 20, vy1 = camY + H / CAM_Z + 20;
    // pintu
    if (vy0 < 110 && vx1 > 150 && vx0 < 270) drawDoor(F.doorO);
    // percikan air
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const s of F.sparks) { if (s.x < vx0 || s.x > vx1 || s.y < vy0 || s.y > vy1) continue; const a = Math.max(0, Math.sin(t * 2.2 + s.ph)); if (a < .3) continue; g.fillStyle = 'rgba(255,255,255,' + (a * .55) + ')'; g.fillRect(Math.round(s.x), Math.round(s.y), 3, 1); g.fillRect(Math.round(s.x + 1), Math.round(s.y - 1), 1, 3) }
    g.restore();
    // aliran sungai (garis bergerak)
    if (vx1 > 780 && vx0 < 880) { g.save(); g.globalAlpha = .35; g.fillStyle = '#d8f4ff'; for (let i = 0; i < 26; i++) { const yy = ((i * 29 + t * 22) % FH), xx = rx(yy) + Math.sin(i * 7.3) * rhw(yy) * .7; if (yy > vy0 && yy < vy1) g.fillRect(Math.round(xx), Math.round(yy), 1, 5) } g.restore() }
    // kolam mata air bersinar
    if (Math.abs(camX + W / CAM_Z / 2 - SHRC.x) < 400) { lightL(SHRC.x, SHRC.y, 70, '120,220,255', .22 + .06 * Math.sin(t * 2)); g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 8; i++) { const k = (t * .35 + i / 8) % 1, a = Math.sin(k * Math.PI); g.fillStyle = 'rgba(190,245,255,' + (.8 * a) + ')'; g.fillRect(Math.round(SHRC.x + Math.sin(i * 2.3 + t) * 12), Math.round(SHRC.y - k * 40), 2, 2) } g.restore() }
    // api unggun
    if (Math.abs(camX + W / CAM_Z / 2 - CAMPC.x) < 400) {
      const fx0 = CAMPC.x, fy0 = CAMPC.y - 8; lightL(fx0, fy0, 90 + Math.sin(t * 11) * 6, '255,150,60', .34);
      for (let i = 0; i < 3; i++) { const h = Math.round(7 + Math.sin(t * 13 + i * 2) * 2 + (i == 1 ? 4 : 0)), a = fx0 - 5 + i * 5; g.fillStyle = '#e8561f'; g.fillRect(a - 2, fy0 - h, 5, h + 2); g.fillStyle = '#ff9a3c'; g.fillRect(a - 1, fy0 - h + 2, 3, h - 1); g.fillStyle = '#ffe28a'; g.fillRect(a, fy0 - 4, 1, 3) }
      g.fillStyle = '#3a2412'; g.fillRect(fx0 - 9, fy0 - 1, 18, 3); g.fillStyle = '#5a3a22'; g.fillRect(fx0 - 7, fy0 - 2, 14, 2);
      if (Math.random() < .13) dp.push({ k: 'p', x: fx0 + (Math.random() - .5) * 8, y: fy0 - 6, vx: (Math.random() - .5) * 12, vy: -24 - Math.random() * 20, life: .8, max: .8, s: 1.5, c: Math.random() < .5 ? '#ffb050' : '#ff7a2a' })
    }
    // tanaman & peti (di tanah)
    for (const q of F.gath) {
      if (q.got || q.x < vx0 || q.x > vx1 || q.y < vy0 || q.y > vy1) continue; const bob = Math.round(Math.sin(t * 2.4 + q.ph) * 1), X = Math.round(q.x), Y = Math.round(q.y);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(X - 4, Y + 2, 8, 2);
      if (q.k === 'herb') { [[-3, -2, '#3a9a44'], [3, -2, '#3a9a44'], [0, -5, '#58c05a'], [-2, 0, '#58c05a'], [2, 0, '#58c05a']].forEach(([a, b, c]) => { g.fillStyle = '#0f2412'; g.fillRect(X + a - 2, Y + b + bob - 1, 5, 4); g.fillStyle = c; g.fillRect(X + a - 1, Y + b + bob, 3, 2) }); g.fillStyle = '#c8f8a0'; g.fillRect(X, Y - 5 + bob, 1, 1) }
      else if (q.k === 'mush') { g.fillStyle = '#0f1a12'; g.fillRect(X - 4, Y - 6 + bob, 9, 5); g.fillRect(X - 1, Y - 2 + bob, 3, 4); g.fillStyle = '#e0485b'; g.fillRect(X - 3, Y - 5 + bob, 7, 3); g.fillStyle = '#ff8a9a'; g.fillRect(X - 2, Y - 5 + bob, 2, 1); g.fillStyle = '#fff'; g.fillRect(X + 1, Y - 4 + bob, 1, 1); g.fillStyle = '#f4e8d0'; g.fillRect(X - 1, Y - 2 + bob, 2, 3) }
      else { g.fillStyle = '#0f1a12'; g.fillRect(X - 4, Y - 5 + bob, 9, 7); g.fillStyle = '#7ab8ff'; g.fillRect(X - 3, Y - 4 + bob, 7, 2); g.fillRect(X - 1, Y - 6 + bob, 3, 7); g.fillStyle = '#cfe8ff'; g.fillRect(X - 1, Y - 4 + bob, 2, 2); g.fillStyle = '#ffe28a'; g.fillRect(X, Y - 3 + bob, 1, 1) }
      const a = .35 + .35 * Math.sin(t * 3 + q.ph); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(' + (q.k === 'herb' ? '140,255,140' : q.k === 'mush' ? '255,150,180' : '150,200,255') + ',' + a + ')'; g.fillRect(X - 6, Y - 3 + bob, 1, 1); g.fillRect(X + 6, Y - 5 + bob, 1, 1); g.fillRect(X + 1, Y - 9 + bob, 1, 3); g.fillRect(X, Y - 8 + bob, 3, 1); g.restore()
    }
  };

  function drawObj(o) {
    if (o.img) { g.drawImage(o.img, o.x - o.ox, o.y - o.oy); if (o.lamp) o.lamp.forEach(([a, b]) => lightL(a, b + 4, 40 + Math.sin(t * 9 + a) * 3, '255,200,110', .3)); return }
    if (o.n) { person(o.n, o.i); return }
    if (o.w) { if (F.drawWolf) F.drawWolf(o.w); return }
    if (o.c) {
      const c = o.c, hop = c.st ? Math.abs(Math.sin(Math.min(1, c.hz / .34) * Math.PI)) * 6 : 0, X = Math.round(c.x), Y = Math.round(c.y); g.save(); g.translate(X, Y); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-4, 1, 9, 2); g.translate(0, -Math.round(hop)); g.scale(c.fc, 1);
      const R = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(a, b, w, h) }; R(-5, -5, 11, 6, '#1a1210'); R(-4, -4, 9, 5, c.col); R(-4, -4, 9, 2, 'rgba(255,255,255,.18)'); R(2, -8, 5, 5, '#1a1210'); R(3, -7, 3, 4, c.col); R(3, -12, 2, 5, '#1a1210'); R(3, -11, 1, 4, c.col); R(5, -11, 2, 4, '#1a1210'); R(5, -10, 1, 3, '#e8b8b0'); R(5, -6, 1, 1, '#1a1210'); R(-7, -4, 3, 3, '#f4efe6'); R(-3, 0, 2, 1, '#1a1210'); R(2, 0, 2, 1, '#1a1210'); g.restore(); return
    }
    if (o.ch) { const c = o.ch, s = c.open ? c.s1 : c.s0; g.drawImage(s.img, Math.round(c.x - s.ox), Math.round(c.y - s.oy)); if (c.open && c.t < 1.2) { lightL(c.x, c.y - 8, 30, '255,210,90', .4 * (1 - c.t / 1.2)) } else if (!c.open) { const a = .5 + .5 * Math.sin(t * 3 + c.x); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,240,170,' + a + ')'; g.fillRect(Math.round(c.x) + 5, Math.round(c.y) - 14, 1, 3); g.fillRect(Math.round(c.x) + 4, Math.round(c.y) - 13, 3, 1); g.restore() } }
  }
  function renderList() {
    const x0 = camX - 70, x1 = camX + W / CAM_Z + 70, y0 = camY - 10, y1 = camY + H / CAM_Z + 90, L = [];
    for (const o of F.objs) { if (o.x < x0 || o.x > x1 || o.y < y0 || o.y - o.oy > y1) continue; L.push(o) }
    for (const o of F.dyn) { const y = o.y; if (y < y0 - 20 || y > y1) continue; const s = o.n || o.c || o.ch || o.w; if (s.x < x0 || s.x > x1) continue; if (o.n) { const n = o.n; L.push({ y: n.y + (n.sit ? 0 : 0), n, i: o.i }) } else if (o.c) L.push({ y: o.c.y, c: o.c }); else if (o.w) L.push({ y: o.w.y, w: o.w }); else L.push({ y: o.y, ch: o.ch }) }
    L.sort((a, b) => a.y - b.y); return L;
  }
  F.drawBack = function () { F._L = renderList(); const py = p.y + 3; for (const o of F._L) if (o.y <= py) drawObj(o) };
  F.drawFront = function () {
    const py = p.y + 3; for (const o of F._L) if (o.y > py) drawObj(o);
    // label NPC
    g.font = '8px monospace'; for (const n of NP) { const d = dist(n, p); if (d < 90) { if (!n.sign) txt(n.n.split(',')[0], n.x, n.y - 28, '#ffe9a8', 'center'); if (d < (n.rng || 36) && !dlg) txt('[G] ' + (n.verb || (n.sign ? 'Baca' : 'Bicara')), n.x, n.y - (n.sign ? 22 : 38), '#fff', 'center') } if (n.fresh && !dlg && !n.sign) { g.fillStyle = '#ffd34d'; g.fillRect(Math.round(n.x) - 1, Math.round(n.y - 36 + Math.sin(t * 4)), 3, 6); g.fillRect(Math.round(n.x) - 1, Math.round(n.y - 28 + Math.sin(t * 4)), 3, 2) } }
    // kupu-kupu
    for (const b of (WORLD.WX && (WORLD.WX.night > .5 || WORLD.WX.rain > .25) ? [] : F.bf)) { const a = t * .5 + b.ph, X = b.cx + Math.sin(a * 1.3) * 40 + Math.cos(a * .7) * 20, Y = b.cy + Math.sin(a * .9) * 20 - 14 + Math.sin(t * 5 + b.ph) * 2; if (X < camX - 10 || X > camX + W / CAM_Z + 10 || Y < camY - 10 || Y > camY + H / CAM_Z + 10) continue; const fl = Math.abs(Math.sin(t * 14 + b.ph)); g.fillStyle = b.c; g.fillRect(Math.round(X) - 2 - (fl > .5 ? 1 : 0), Math.round(Y), 2, 2); g.fillRect(Math.round(X) + 1, Math.round(Y), 2 + (fl > .5 ? 1 : 0), 2); g.fillStyle = '#2a1a10'; g.fillRect(Math.round(X), Math.round(Y), 1, 2) }
    const vw = W / CAM_Z, vh = H / CAM_Z;
    // berkas cahaya matahari
    g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const bx = camX + ((i * .27 + .08 + Math.sin(t * .13 + i) * .03) * vw), wd = 30 + i * 9, al = (.045 + .02 * Math.sin(t * .6 + i * 1.7)) * (1 - Math.min(1, WORLD.WX ? WORLD.WX.night * 1.4 + WORLD.WX.rain * .8 : 0)), gr = g.createLinearGradient(bx, camY, bx + wd, camY + vh); gr.addColorStop(0, 'rgba(255,240,170,' + al + ')'); gr.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(bx, camY); g.lineTo(bx + wd, camY); g.lineTo(bx + wd - vh * .45, camY + vh); g.lineTo(bx - vh * .45, camY + vh); g.fill() }
    // kunang-kunang & serbuk sari
    for (const f of F.ff) { const X = camX + (((f.bx * vw - t * f.sx * .5 - camX * .15) % vw) + vw) % vw, Y = camY + (((f.by * vh + Math.sin(t * .8 + f.ph) * 12 + f.sy * t * .3) % vh) + vh) % vh, a = .35 + .5 * Math.max(0, Math.sin(t * 2 + f.ph)); g.fillStyle = f.k < .5 ? 'rgba(255,245,160,' + a + ')' : 'rgba(255,255,255,' + a * .6 + ')'; g.fillRect(Math.round(X), Math.round(Y), 2, 2); if (f.k < .5) { g.fillStyle = 'rgba(255,240,140,' + a * .25 + ')'; g.fillRect(Math.round(X) - 1, Math.round(Y) - 1, 4, 4) } }
    g.restore();
    // daun berguguran
    for (const l of F.lv) { const X = camX + (((l.bx * vw + t * l.sp * .6 + Math.sin(t * 1.3 + l.ph) * 14) % vw) + vw) % vw, Y = camY + (((l.by * vh + t * l.sp) % vh) + vh) % vh, r = Math.sin(t * 3 + l.ph); g.fillStyle = l.c; g.fillRect(Math.round(X), Math.round(Y), r > 0 ? 3 : 2, r > 0 ? 2 : 3); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(Math.round(X), Math.round(Y) + (r > 0 ? 1 : 2), r > 0 ? 3 : 2, 1) }
  };
})();


/* ===== Efek halus benteng gelap: jendela menyala, obor ungu, aura tipis ===== */
(function () {
  const F = WORLD.AREAS.forest; if (!F) return;
  const lightL = WORLD.lightL, DX = F.door.x, _env = F.env;
  F.env = function () {
    _env.call(this);
    const C = F.castle; if (!C || camY > 220 || camX > 470) return;
    const vx0 = camX - 60, vx1 = camX + W / CAM_Z + 60;
    g.save(); g.globalCompositeOperation = 'lighter';
    lightL(DX, 50, 190, '110,30,190', .07 + .02 * Math.sin(t * .9));
    for (const r of (C.runes || [])) { if (r[0] < vx0 || r[0] > vx1) continue; lightL(r[0], r[1], r[2], '170,110,255', r[2] > 20 ? .26 + .08 * Math.sin(t * 1.6) : .2 + .06 * Math.sin(t * 2.2 + r[0])) }
    for (let i = 0; i < 6; i++) { const mx = ((t * 5 + i * 67) % 440) - 20, my = 96 + Math.sin(t * .4 + i * 2) * 5; if (mx > vx0 - 40 && mx < vx1 + 40) lightL(mx, my, 46, '140,110,220', .05) }
    for (let i = 0; i < 7; i++) { const k = (t * .22 + i / 7) % 1, mx = DX + Math.sin(i * 2.7 + t * .8) * 16, my = 92 - k * 56; g.fillStyle = 'rgba(190,150,255,' + (.7 * Math.sin(k * Math.PI)) + ')'; g.fillRect(Math.round(mx), Math.round(my), 2, 2) }
    for (const w of C.wins) { if (w[0] < vx0 || w[0] > vx1) continue; lightL(w[0], w[1], w[2], '170,90,255', .2 * (.8 + .2 * Math.sin(t * 2.3 + w[0] * .3))) }
    for (const q of C.torches) {
      const X = q[0], Y = q[1]; if (X < vx0 || X > vx1) continue;
      lightL(X, Y - 4, 44 + Math.sin(t * 9 + X) * 3, '150,90,255', .26 + .05 * Math.sin(t * 13 + X));
      for (let i = 0; i < 3; i++) { const h = Math.round(5 + Math.sin(t * 12 + i * 2 + X) * 1.5 + (i === 1 ? 3 : 0)), a = X - 2 + i * 2; g.fillStyle = '#6a2ad8'; g.fillRect(a - 1, Y - h, 3, h + 1); g.fillStyle = '#b090ff'; g.fillRect(a, Y - h + 2, 1, h - 2) }
    }
    g.restore();
  };
})();

/* ===== Pintu tebing hutan -> kembali ke lobby Dungeon ===== */
(function () {
  WORLD.onDungeonDoor = function () { WORLD.start('toLobby', { x0: p.x, y0: p.y }); msg('Kau kembali masuk ke Dungeon...') };
})();

/* ===== Gerbang timur hutan -> desa ===== */
(function () {
  const F = WORLD.AREAS.forest, FW = 1800, _tick = F.tick;
  F.tick = function (dt) {
    if (!WORLD.TR.on && WORLD.TR.cool <= 0 && p.x > FW - 30 && Math.abs(p.y - 348) < 40 && p.vx > 8) {
      const V = WORLD.AREAS.village; if (!V.ready) { V.ready = 1; V.build() }
      WORLD.start('gate', { to: 'village', dx: 1, spawn: V.spawn }); msg('Memasuki Desa Lembah Lentera...'); return
    }
    return _tick.call(this, dt)
  };
})();

/* ===== SERIGALA MALAM: tiap malam 50% muncul (1-3 ekor acak), 50% tidak muncul ===== */
(function () {
  'use strict';
  const F = WORLD.AREAS.forest; if (!F) return;
  const FW = 1800, FH = 720, TAU = Math.PI * 2, lightL = WORLD.lightL;
  const WOLF = {
    chance: .5,             // peluang ada serigala tiap malam (0.5 = 50%)
    minPack: 1, maxPack: 3, // jumlah serigala sekali muncul (acak, rata)
    hp: 30,
    volume: .12,            // volume lolongan serigala (0 = tanpa suara)
    shieldBlocksWolves: true, // perisai Mata Air Suci di malam hari menahan serigala (pemain di dalamnya aman)
    speed: 96, lungeSpeed: 230,
    dmgPct: .08,            // damage gigitan = 8% HP maksimum pemain (minimal 3)
    playerDmg: 12,          // damage serangan cadangan ke serigala (lihat attackKey)
    attackKeys: [], // tombol serang ke serigala (kosongkan [] bila serangan game sudah memanggil F.hitWolves)
    attackClick: true       // klik kiri mouse juga menyerang
  };
  const S = { sh: 0, rip: [], rolled: false, queue: 0, base: 0, spawnCd: 0, fails: 0, told: false, pInv: 0, atk: 0, tk: 0 };
  const wolves = [];
  const night = () => (WORLD.WX ? WORLD.WX.night : 0);
  const { mkCv, rc } = WORLD;

  /* ---------- Mata Air Suci: lentera kristal & perisai pelindung malam hari ---------- */
  const SX = 1008, SY = 166, CX = SX, CY = SY + 12, RX = 74, RY = 42, DH = 70, LAMPS = [[-70, 2], [70, 2], [-28, -46], [28, -46]];
  const inShield = (x, y) => ((x - CX) / (RX + 6)) ** 2 + ((y - CY) / (RY + 6)) ** 2 < 1;
  const shOn = () => WOLF.shieldBlocksWolves && S.sh > .6;
  const shBlock = (x, y) => { if (!shOn() || !inShield(x, y)) return false; if (S.rip.length < 10 && Math.random() < .3) S.rip.push({ x, y, t: 0 }); return true };

  /* ---------- damage ke pemain ---------- */
  function hurtPlayer(dmg, fx0, fy0) {
    // sambungkan ke fungsi damage game kamu lewat WORLD.hurtPlayer(dmg, dariX, dariY)
    if (typeof WORLD.hurtPlayer === 'function') { WORLD.hurtPlayer(dmg, fx0, fy0); return }
    // cadangan: kurangi HP langsung (tidak sampai mati)
    p.hp = Math.max(1, p.hp - dmg);
    dn(p.x, p.y - 18, '-' + dmg, 0, '#ff5a5a');
    for (let i = 0; i < 6; i++) dp.push({ k: 'p', x: p.x, y: p.y - 8, vx: (Math.random() - .5) * 60, vy: -20 - Math.random() * 30, life: .4, max: .4, s: 1.5, c: '#c83030' });
  }

  /* ---------- muncul di luar layar ---------- */
  function trySpawn() {
    const R = Math.hypot(W / CAM_Z, H / CAM_Z) / 2 + 40;
    for (let k = 0; k < 30; k++) {
      const a = S.base + (Math.random() - .5) * (.7 + k * .2), d = R + Math.random() * 70, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
      if (x < 40 || x > FW - 40 || y < 150 || y > FH - 30 || blk(x, y, 6) || (shOn() && inShield(x, y))) continue;
      const w = { x, y, vx: 0, vy: 0, hp: WOLF.hp, mhp: WOLF.hp, fc: x < p.x ? 1 : -1, st: 'chase', tm: 0, cd: .6 + Math.random() * .8, fl: Math.random() * TAU, ph: Math.random() * 6, hit: 0, fade: 0, dead: 0, bit: 0, sk: 0, jit: 0, ja: 0, br: 0, pitch: .85 + Math.random() * .3, hw: .2 + Math.random() * 1.3 };
      wolves.push(w); F.dyn.push({ w, get y() { return w.y } }); return true
    }
    return false
  }

  /* ---------- suara lolongan "auuuu" (disintesis lewat WebAudio, tanpa file) ---------- */
  let AC = null;
  function howl(w) {
    if (WOLF.volume <= 0) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      const d = Math.hypot(w.x - p.x, w.y - p.y), vol = WOLF.volume * Math.max(.25, 1 - d / 520), now = AC.currentTime, k = w.pitch || 1, dur = 2.6;
      const f = AC.createBiquadFilter(), gn = AC.createGain(), dl = AC.createDelay(), fb = AC.createGain(), eg = AC.createGain(), vg = AC.createGain(), lfo = AC.createOscillator();
      f.type = 'lowpass'; f.frequency.value = 1400; f.Q.value = .7;
      gn.gain.setValueAtTime(.0001, now); gn.gain.linearRampToValueAtTime(vol, now + .3); gn.gain.setValueAtTime(vol, now + 1.5); gn.gain.exponentialRampToValueAtTime(.0001, now + dur);
      dl.delayTime.value = .32; fb.gain.value = .35; eg.gain.value = .4;   // gema jauh
      const pan = AC.createStereoPanner ? AC.createStereoPanner() : null;
      if (pan) { pan.pan.value = Math.max(-1, Math.min(1, (w.x - p.x) / 300)); pan.connect(AC.destination) }
      const dest = pan || AC.destination;
      f.connect(gn); gn.connect(dest); gn.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(eg); eg.connect(dest);
      lfo.frequency.value = 5.5; vg.gain.setValueAtTime(0, now); vg.gain.linearRampToValueAtTime(10 * k, now + 1); lfo.connect(vg);
      [['sawtooth', 0], ['triangle', 9]].forEach(([type, cents]) => {
        const o = AC.createOscillator(); o.type = type; o.detune.value = cents;
        // nada naik cepat, ditahan bergetar, lalu turun pelan: "au-uuuu"
        o.frequency.setValueAtTime(250 * k, now); o.frequency.exponentialRampToValueAtTime(560 * k, now + .75); o.frequency.linearRampToValueAtTime(600 * k, now + 1.5); o.frequency.exponentialRampToValueAtTime(320 * k, now + dur);
        vg.connect(o.frequency); o.connect(f); o.start(now); o.stop(now + dur + .1)
      });
      lfo.start(now); lfo.stop(now + dur + .1)
    } catch (e) { }
  }

  /* ---------- gerak & AI ---------- */
  function move(w, vx, vy, dt) {
    const ox = w.x, oy = w.y, nx = w.x + vx * dt, ny = w.y + vy * dt;
    if (!blk(nx, w.y, 5) && !shBlock(nx, w.y)) w.x = nx; if (!blk(w.x, ny, 5) && !shBlock(w.x, ny)) w.y = ny;
    return Math.hypot(w.x - ox, w.y - oy)
  }
  // kalau pemain di seberang sungai, serigala menyeberang lewat jembatan
  function goal(w) {
    const sw = w.x < 830, sp = p.x < 830;
    if (sw === sp) { w.br = 0; return null }
    const ax = sw ? 768 : 892, bx = sw ? 892 : 768;
    if (!w.br && Math.hypot(w.x - ax, w.y - 300) < 18) w.br = 1;
    return w.br ? [bx, 300] : [ax, 300]
  }
  function upd(w, dt) {
    w.hit = Math.max(0, w.hit - dt); w.cd -= dt;
    if (w.dead) { w.fade += dt; return }
    if (shOn() && inShield(w.x, w.y)) { const a = Math.atan2(w.y - CY, w.x - SX); w.x += Math.cos(a) * 140 * dt; w.y += Math.sin(a) * 140 * dt }   // terdorong keluar dari perisai
    const dx = p.x - w.x, dy = p.y - w.y, d = Math.hypot(dx, dy) || 1;
    if (w.st === 'flee') { w.fade += dt; move(w, -dx / d * 120, -dy / d * 120, dt); w.fc = dx < 0 ? 1 : -1; return }
    if (w.st === 'chase') {
      const wp = goal(w), safe = shOn() && inShield(p.x, p.y); let tx, ty;
      if (wp) { tx = wp[0]; ty = wp[1] } else if (safe) { tx = CX + Math.cos(w.fl + t * .25) * (RX + 28); ty = CY + Math.sin(w.fl + t * .25) * (RY + 22) } else { const r = d > 90 ? 0 : 30; tx = p.x + Math.cos(w.fl + t * .6) * r; ty = p.y + Math.sin(w.fl + t * .6) * r * .8 }
      let hx = tx - w.x, hy = ty - w.y; const hd = Math.hypot(hx, hy) || 1; hx /= hd; hy /= hd;
      if (w.jit > 0) { w.jit -= dt; const c = Math.cos(w.ja), s = Math.sin(w.ja); const nx = hx * c - hy * s; hy = hx * s + hy * c; hx = nx }
      const sp = hd < 6 ? 0 : WOLF.speed, mv = move(w, hx * sp, hy * sp, dt);
      if (sp && mv < sp * dt * .3) { w.sk += dt; if (w.sk > .5) { w.sk = 0; w.jit = .6; w.ja = (Math.random() < .5 ? 1 : -1) * 1.4 } } else w.sk = Math.max(0, w.sk - dt * 2);
      w.fc = (d < 80 ? dx : hx) >= 0 ? 1 : -1;
      w.hw -= dt; if (w.hw <= 0) { w.hw = 7 + Math.random() * 5; if (d > 110) howl(w) }   // melolong saat menuju pemain
      if (d < 60 && w.cd <= 0 && !wp && !safe) { w.st = 'wind'; w.tm = .4 }
    } else if (w.st === 'wind') {            // merunduk, mata merah
      w.fc = dx >= 0 ? 1 : -1; w.tm -= dt;
      if (w.tm <= 0) { w.st = 'lunge'; w.tm = .22; w.vx = dx / d * WOLF.lungeSpeed; w.vy = dy / d * WOLF.lungeSpeed; w.bit = 0 }
    } else if (w.st === 'lunge') {           // terkam
      move(w, w.vx, w.vy, dt); w.tm -= dt;
      if (!w.bit && d < 15 && S.pInv <= 0 && !(shOn() && inShield(p.x, p.y))) { w.bit = 1; S.pInv = .7; hurtPlayer(Math.max(3, Math.round(mhp() * WOLF.dmgPct)), w.x, w.y) }
      if (w.tm <= 0) { w.st = 'rec'; w.tm = .55; w.cd = 1 + Math.random() * .9 }
    } else if (w.st === 'rec') {             // mundur sebentar
      w.fc = dx >= 0 ? 1 : -1; move(w, -dx / d * 38, -dy / d * 38, dt); w.tm -= dt;
      if (w.tm <= 0) w.st = 'chase'
    }
  }

  /* ---------- serangan pemain ke serigala ---------- */
  F.hitWolves = function (x, y, r, dmg) {
    let n = 0;
    for (const w of wolves) {
      if (w.dead || Math.hypot(w.x - x, w.y - y) > r) continue;
      n++; w.hp -= dmg; w.hit = .15;
      const a = Math.atan2(w.y - p.y, w.x - p.x); move(w, Math.cos(a) * 160, Math.sin(a) * 160, .07);
      if (w.st === 'wind' || w.st === 'lunge') { w.st = 'rec'; w.tm = .5; w.cd = 1 }
      dn(w.x, w.y - 16, '-' + dmg, 0, '#ffd34d');
      for (let i = 0; i < 5; i++) dp.push({ k: 'p', x: w.x, y: w.y - 6, vx: (Math.random() - .5) * 70, vy: -20 - Math.random() * 30, life: .35, max: .35, s: 1.5, c: '#c8ccd8' });
      if (w.hp <= 0) { w.dead = 1; w.fade = 0; dn(w.x, w.y - 22, 'Serigala tumbang', 0, '#fff') }
    }
    return n
  };
  WORLD.hitWolves = F.hitWolves;
  // uji coba dari konsol browser: WORLD.spawnWolves(2) memunculkan 2 serigala sekarang juga (abaikan jam & peluang)
  WORLD.spawnWolves = function (n) { S.base = Math.random() * TAU; S.queue = n || 1; S.fails = 0; S.told = false };
  const swing = () => {
    if (performance.now() - S.tk > 200 || dlg || WORLD.TR.on || S.atk > 0) return;
    S.atk = .4; fx.push({ k: 'ring', x: p.x, y: p.y - 4, r: 16, w: 2, life: .18, max: .18, col: '#ffffff' });
    F.hitWolves(p.x, p.y - 4, 44, WOLF.playerDmg)
  };
  if (WOLF.attackKeys.length) addEventListener('keydown', e => { if (!e.repeat && WOLF.attackKeys.includes(e.code)) swing() });
  if (WOLF.attackClick) addEventListener('mousedown', e => { if (e.button === 0) swing() });

  /* ---------- siklus malam ---------- */
  const _enter = F.enter;
  F.enter = function () {
    const r = _enter && _enter.apply(this, arguments);
    wolves.length = 0; F.dyn = F.dyn.filter(o => !o.w); S.rolled = false; S.queue = 0; S.pInv = 0; S.sh = night() > .45 ? 1 : 0; S.rip.length = 0;
    return r
  };
  const _tick = F.tick;
  F.tick = function (dt) {
    const r = _tick.call(this, dt);
    if (WORLD.TR.on) return r;
    S.tk = performance.now(); S.pInv -= dt; S.atk -= dt;
    S.sh = Math.max(0, Math.min(1, S.sh + (night() > .45 ? 1 : -1) * dt * .8));   // perisai menyala saat malam
    for (let i = S.rip.length - 1; i >= 0; i--) { S.rip[i].t += dt; if (S.rip[i].t > .5) S.rip.splice(i, 1) }
    const nt = night();
    if (nt < .3) {                           // pagi: serigala kabur, undian direset
      S.rolled = false; S.queue = 0;
      for (const w of wolves) if (!w.dead && w.st !== 'flee') { w.st = 'flee'; w.fade = 0 }
    } else if (nt > .5 && !S.rolled) {       // malam tiba: undi sekali per malam
      S.rolled = true; S.fails = 0; S.told = false;
      if (Math.random() < WOLF.chance) { S.queue = WOLF.minPack + (Math.random() * (WOLF.maxPack - WOLF.minPack + 1) | 0); S.base = Math.random() * TAU }
    }
    if (!dlg) {
      S.spawnCd -= dt;
      if (S.queue > 0 && S.spawnCd <= 0) {
        S.spawnCd = .4;
        if (trySpawn()) { S.queue--; S.fails = 0; if (!S.told) { S.told = true; msg('Lolongan serigala menggema di antara pepohonan...') } }
        else if (++S.fails > 25) S.queue = 0
      }
      for (const w of wolves) upd(w, dt)
    }
    for (let i = wolves.length - 1; i >= 0; i--) {
      const w = wolves[i];
      if ((w.dead && w.fade > .8) || (w.st === 'flee' && w.fade > 1.4)) { wolves.splice(i, 1); const j = F.dyn.findIndex(o => o.w === w); if (j >= 0) F.dyn.splice(j, 1) }
    }
    return r
  };

  /* ---------- gambar serigala (pixel art) ---------- */
  F.drawWolf = function (w) {
    const X = Math.round(w.x), Y = Math.round(w.y), run = (w.st === 'chase' || w.st === 'lunge' || w.st === 'flee') ? Math.sin(t * 16 + w.ph) : 0;
    const al = w.dead ? Math.max(0, 1 - w.fade / .8) : w.st === 'flee' ? Math.max(0, 1 - w.fade / 1.4) : 1;
    const dk = '#14101a', B = w.hit > 0 ? '#ffffff' : '#6e727e', D = '#474a55', L = '#a4a8b4', hot = w.st === 'wind' || w.st === 'lunge', eye = hot ? '#ff3a3a' : '#ffd34d';
    const R = (a, b, ww, hh, c) => { g.fillStyle = c; g.fillRect(a, b, ww, hh) };
    g.save(); g.globalAlpha = al; g.translate(X, Y); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-9, 0, 19, 3);
    g.scale(w.fc, w.dead ? .4 : 1);
    const cr = w.st === 'wind' ? 2 : 0; g.translate(0, cr);
    R(-13, -12, 5, 6, dk); R(-12, -11, 3, 4, D);                                                              // ekor
    [[-8, run], [-5, -run], [3, -run], [6, run]].forEach(([a, s]) => { const o = Math.round(s * 2); R(a + o, -3, 3, 4 - cr, dk); R(a + o + 1, -3, 1, 3 - cr, D) });   // kaki
    R(-9, -10, 18, 8, dk); R(-8, -9, 16, 6, B); R(-8, -9, 16, 2, 'rgba(255,255,255,.14)'); R(-6, -4, 11, 1, L); // badan
    R(6, -14, 9, 8, dk); R(7, -13, 7, 6, B); R(13, -10, 5, 4, dk); R(13, -9, 4, 2, L); R(17, -10, 1, 1, '#000'); // kepala & moncong
    R(7, -17, 3, 4, dk); R(8, -16, 1, 2, D); R(11, -17, 3, 4, dk); R(12, -16, 1, 2, D);                       // telinga
    R(11, -11, 2, 1, eye);                                                                                     // mata
    g.restore();
    if (!w.dead && al > .3) {
      lightL(X + w.fc * 11, Y - 11 + cr, 12, hot ? '255,60,60' : '255,210,80', .28);
      if (w.hp < w.mhp) { const bw = 16; g.fillStyle = '#14101a'; g.fillRect(X - bw / 2 - 1, Y - 24, bw + 2, 4); g.fillStyle = '#5a1a1a'; g.fillRect(X - bw / 2, Y - 23, bw, 2); g.fillStyle = '#e04848'; g.fillRect(X - bw / 2, Y - 23, Math.max(0, Math.round(bw * w.hp / w.mhp)), 2) }
    }
  };
  /* ---------- lentera kristal di sekitar mata air ---------- */
  function lampSprite() {
    const [c, q] = mkCv(16, 40), OL = '#0f1a12';
    rc(q, OL, 2, 34, 12, 6); rc(q, '#6a6a78', 3, 35, 10, 4); rc(q, '#8a8a98', 3, 35, 10, 1); rc(q, '#3a8a4a', 3, 36, 3, 2);   // alas
    rc(q, OL, 5, 12, 6, 24); rc(q, '#7a7a88', 6, 13, 4, 22); rc(q, '#9a9aa8', 6, 13, 1, 22);                                  // tiang
    rc(q, OL, 2, 3, 12, 11); rc(q, '#4a4a58', 3, 4, 10, 9); rc(q, '#3a8ab0', 4, 5, 8, 7); rc(q, '#8fe8ff', 5, 6, 6, 5); rc(q, '#e8fcff', 7, 7, 2, 3);   // rumah lentera & kristal
    rc(q, OL, 1, 1, 14, 3); rc(q, '#6a6a78', 2, 2, 12, 2); rc(q, OL, 6, 0, 4, 2);                                             // atap
    return { img: c, ox: 8, oy: 38 };
  }
  const _build = F.build;
  F.build = function () {
    const r = _build.apply(this, arguments), sp = lampSprite();
    for (const [dx, dy] of LAMPS) { const x = SX + dx, y = SY + dy + 8; F.objs.push({ x, y, img: sp.img, ox: sp.ox, oy: sp.oy, oh: sp.img.height }); F.walls.push([x - 4, y - 4, 8, 5]) }
    F.objs.sort((a, b) => a.y - b.y); return r;
  };
  const _env = F.env;
  F.env = function () {
    _env.call(this);
    if (Math.abs(camX + W / CAM_Z / 2 - SX) > 420) return;
    const n = Math.max(0, Math.min(1, night())), sh = S.sh;
    for (const [dx, dy] of LAMPS) { lightL(SX + dx, SY + dy - 22, 44 + Math.sin(t * 3 + dx) * 2, '140,225,255', .14 + .2 * n); lightL(SX + dx, SY + dy + 8, 36, '120,200,240', .05 + .1 * n) }
    if (n > .05) lightL(SX, SY, 120, '120,220,255', .1 * n);
    if (sh > .01) {
      const el = F.npcs.find(q => q.n && q.n.indexOf('Elowen') === 0); if (el) lightL(el.x, el.y - 14, 28, '143,232,255', .2 * sh);
      [[-46, -14], [46, -14], [-34, 24], [34, 24]].forEach(([dx, dy]) => lightL(SX + dx, SY + dy - 26, 18, '140,230,255', .16 * sh));
      lightL(CX, CY, 96, '120,220,255', .1 * sh * (.85 + .15 * Math.sin(t * 2.2)));
      g.save(); g.globalCompositeOperation = 'lighter';   // cincin segel di lantai
      for (let i = 0; i < 20; i++) { const an = i / 20 * TAU + t * .2; g.fillStyle = 'rgba(160,240,255,' + (.7 * sh * (.5 + .5 * Math.sin(t * 2 + i))) + ')'; g.fillRect(Math.round(CX + Math.cos(an) * RX * .9), Math.round(CY + Math.sin(an) * RY * .9), 3, 1) }
      g.restore()
    }
  };
  /* ---------- kubah perisai (digambar di atas objek) ---------- */
  function drawShield() {
    const a = S.sh; if (a <= .01) return;
    const vw = W / CAM_Z, vh = H / CAM_Z; if (camX > CX + RX + 40 || camX + vw < CX - RX - 40 || camY > CY + RY + 20 || camY + vh < CY - DH - 20) return;
    const pulse = .85 + .15 * Math.sin(t * 2.2), dome = () => { g.beginPath(); g.ellipse(CX, CY, RX, DH, 0, Math.PI, TAU); g.ellipse(CX, CY, RX, RY, 0, 0, Math.PI); g.closePath() };
    g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(CX, CY - 22, 8, CX, CY - 22, 90); gr.addColorStop(0, 'rgba(140,225,255,.03)'); gr.addColorStop(.55, 'rgba(130,220,255,.08)'); gr.addColorStop(.85, 'rgba(180,240,255,.2)'); gr.addColorStop(1, 'rgba(190,245,255,.3)');
    g.fillStyle = gr; dome(); g.fill();
    g.save(); dome(); g.clip();
    const by = CY - DH + ((t * 26) % (DH + RY + 40)) - 20, bg = g.createLinearGradient(0, by - 14, 0, by + 14); bg.addColorStop(0, 'rgba(200,250,255,0)'); bg.addColorStop(.5, 'rgba(200,250,255,.22)'); bg.addColorStop(1, 'rgba(200,250,255,0)'); g.fillStyle = bg; g.fillRect(CX - RX, by - 14, RX * 2, 28);   // pita cahaya naik
    g.lineWidth = 1; g.strokeStyle = 'rgba(180,240,255,.12)';
    for (let i = 0; i < 6; i++) { const kx = Math.abs(Math.cos((t * .25 + i / 6) * Math.PI)); g.beginPath(); g.ellipse(CX, CY, Math.max(2, kx * RX), DH, 0, Math.PI, TAU); g.stroke() }   // garis bujur berputar
    for (let j = 1; j < 4; j++) { const hh = j / 4 * DH, k = Math.sqrt(1 - (hh / DH) ** 2); g.beginPath(); g.ellipse(CX, CY - hh, RX * k, RY * k, 0, 0, TAU); g.stroke() }   // garis lintang
    g.restore();
    g.strokeStyle = 'rgba(170,240,255,' + (.55 * pulse) + ')'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(CX, CY, RX, RY, 0, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(200,250,255,.3)'; g.lineWidth = 1; g.beginPath(); g.ellipse(CX, CY, RX, DH, 0, Math.PI, TAU); g.stroke();
    for (let i = 0; i < 14; i++) { const u = (t * .15 + i * .071) % 1, an = i * 2.4 + t * .3; g.fillStyle = 'rgba(220,252,255,' + (.8 * Math.sin(u * Math.PI)) + ')'; g.fillRect(Math.round(CX + Math.cos(an) * RX * .92), Math.round(CY + Math.sin(an) * RY * .92 - u * DH * .9), 2, 2) }
    for (const r of S.rip) { g.strokeStyle = 'rgba(220,250,255,' + (.85 * (1 - r.t / .5)) + ')'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(r.x, r.y - 8, 6 + r.t * 40, 4 + r.t * 26, 0, 0, TAU); g.stroke() }   // riak saat serigala menabrak
    g.restore()
  }
  const atkLabel = () => (WOLF.attackKeys.length ? '[' + WOLF.attackKeys[0].replace('Key', '').replace('Space', 'Spasi') + '] / klik' : 'Klik') + ': Serang';
  const _front = F.drawFront;
  F.drawFront = function () {
    _front.apply(this, arguments);
    drawShield();
    if (!dlg && (WOLF.attackKeys.length || WOLF.attackClick) && wolves.some(w => !w.dead && w.st !== 'flee' && Math.hypot(w.x - p.x, w.y - p.y) < 90)) { g.font = '8px monospace'; txt(atkLabel(), p.x, p.y - 34, '#ffd6d6', 'center') }
  };
})();