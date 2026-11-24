/* ==========================================================================
   ECHOES OF THE ABYSS - WHISPERING FOREST MODULE
   Whispering Woods map, wilderness paths, river, camp, sacred shrine,
   gatherables, chests, wildlife, and gate to Lantern Valley Village.
   ========================================================================== */
/* ===== HUTAN BISIKAN ===== */
(function () {
  'use strict';
  const { TAU, clamp, lerp, E, mkRng, mkCv, rc, disc, ell, hash, vnoise, h2r, mixc, dense, distPoly, person, art, S: W_ } = WORLD;
  const FW = 1800, FH0 = 720, FH = 1400;   // FH0 = tinggi hutan lama (isinya tidak berubah), FH = tinggi total setelah diperluas ke selatan
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
  /* ===== PERLUASAN SELATAN (y 720 -> 1400): Hutan Lumut, Lembah Paku, Danau Cermin =====
     Koordinat wilayah lama TIDAK berubah (kamp, kuil, pintu dungeon, gerbang desa tetap di tempat semula).
     Peta hanya bertambah ke selatan, sehingga gerbang timur (x = FW, y = 348) tetap bekerja. */
  const BR2 = [930, 996], BXA = 786, BXB = 874;                       // jembatan kedua (sungai selatan)
  const LAKE = { x: 830, y: 1318, rx: 214, ry: 62 };                  // Danau Cermin: muara sungai
  const MP = { x: 1226, y: 1196, rx: 92, ry: 42 };                    // Kolam Kabut
  const SC = { x: 320, y: 1072, r: 96 };                              // Lingkaran Batu Tua
  const HG = { x: 118, y: 1296, r: 78 };                              // Taman Peri (tersembunyi)
  const WT = { x: 1452, y: 1066, r: 84 };                             // Menara Pengawas Runtuh
  const GH = { x: 1676, y: 1318, r: 78 };                             // Gua Jamur Bercahaya (tersembunyi)
  const NK = { x: 160, y: 884, r: 46 };                               // Relung Sunyi (tersembunyi)
  const SWP = { x: 596, y: 1190, r: 104 };                            // Rawa Lumut (genangan, bisa dilewati)
  const RIVER_END = LAKE.y - LAKE.ry + 12;
  const PTH = [
    { id: 'PA', w: PS, P: [[575, 520], [588, 600], [590, 680], [574, 760], [542, 838], [504, 902], [470, 962], [432, 1016]] },
    { id: 'PB1', w: PW, P: [[1170, 378], [1128, 440], [1086, 520], [1072, 610], [1076, 700], [1094, 780], [1096, 850], [1060, 912], [998, 950], [930, 962], [874, 963]] },
    { id: 'PB2', w: PW, P: [[786, 963], [730, 968], [660, 976], [590, 960], [520, 934], [504, 902]] },
    { id: 'T1', w: PS, P: [[470, 962], [430, 1000], [388, 1030], [350, 1056]] },
    { id: 'T2', w: PS - 8, P: [[290, 1100], [236, 1130], [178, 1172], [138, 1226], [124, 1262]] },
    { id: 'T3', w: PS, P: [[504, 902], [520, 990], [552, 1070], [604, 1140], [672, 1196], [742, 1232], [790, 1244]] },
    { id: 'T4', w: PS, P: [[1096, 850], [1158, 876], [1226, 896], [1296, 928], [1360, 974], [1412, 1020], [1440, 1052]] },
    { id: 'T5', w: PS - 8, P: [[1470, 1100], [1494, 1160], [1536, 1212], [1590, 1258], [1640, 1290], [1668, 1304]] },
    { id: 'T6', w: PS, P: [[1060, 912], [1044, 990], [1050, 1070], [1096, 1136], [1100, 1160]] },
    { id: 'T7', w: PS, P: [[1340, 1184], [1400, 1186], [1470, 1178], [1494, 1160]] },
    { id: 'T8', w: PS - 10, P: [[542, 838], [486, 826], [420, 816], [350, 812], [282, 826], [222, 850], [180, 872]] }
  ];
  PTH.forEach(o => o.d = dense(o.P, 4));
  const GLADES = [SC, HG, WT, GH, NK];
  let NEWGEO = false;
  function free(x, y, m) {
    if (x < 16 || x > FW - 16 || y < 18 || y > (NEWGEO ? FH : FH0) - 18) return false;   // batas bawah lama dipertahankan saat isi hutan lama dibuat (urutan RNG tetap sama)
    if (x > cliffRect[0] - 10 - m && x < cliffRect[0] + cliffRect[2] + 10 + m && y < 128 + m) return false;
    if (distPoly(x, y, MAINd) < PW / 2 + m || distPoly(x, y, CAMPd) < PS / 2 + m || distPoly(x, y, SHRd) < PS / 2 + m) return false;
    if (Math.abs(x - rx(y)) < rhw(y) + 14 + m) return false;
    if (Math.hypot(x - CAMPC.x, y - CAMPC.y) < CAMPC.r + m || Math.hypot(x - SHRC.x, y - SHRC.y) < SHRC.r + m || Math.hypot(x - MEAD.x, (y - MEAD.y) * 1.15) < MEAD.r + m * .5) return false;
    if (((x - POND.x) / (POND.rx + 12 + m)) ** 2 + ((y - POND.y) / (POND.ry + 12 + m)) ** 2 < 1) return false;
    if (x > FW - 150 && Math.abs(y - 348) < 80) return false;
    if (CHESTS.some(c => Math.hypot(x - c.x, y - c.y) < 26 + m)) return false;
    if (SIGNP.some(c => Math.hypot(x - c[0], y - c[1] - 14) < 44 + m)) return false;
    if (NEWGEO) {   // wilayah selatan (aktif setelah isi hutan lama selesai dibuat)
      for (const o of PTH) if (distPoly(x, y, o.d) < o.w / 2 + m) return false;
      if (GLADES.some(c => Math.hypot(x - c.x, y - c.y) < c.r + m)) return false;
      if (((x - LAKE.x) / (LAKE.rx + 14 + m)) ** 2 + ((y - LAKE.y) / (LAKE.ry + 14 + m)) ** 2 < 1) return false;
      if (((x - MP.x) / (MP.rx + 12 + m)) ** 2 + ((y - MP.y) / (MP.ry + 12 + m)) ** 2 < 1) return false;
      if (x > BXA - 6 - m && x < BXB + 6 + m && y > BR2[0] - 10 - m && y < BR2[1] + 10 + m) return false;
      if (Math.hypot(x - SWP.x, (y - SWP.y) * 1.6) < SWP.r * .5 + m) return false;
    }
    return true;
  }
  F.free = free;
  F.geo = { MAINd, CAMPd, SHRd, PW, PS, POND, CAMPC, SHRC, MEAD, rx, rhw, cliffRect, FH0, FH, LAKE, MP, SC, HG, WT, GH, NK, SWP, BR2, RIVER_END,
    paths: [{ d: MAINd, w: PW }, { d: CAMPd, w: PS }, { d: SHRd, w: PS }, ...PTH.map(o => ({ d: o.d, w: o.w }))], ponds: [POND, MP, LAKE], glades: [SC, WT, NK, HG] };   // dipakai modul kedalaman

  F.build = function () {
    const rng = mkRng(2024), [bg, x] = mkCv(FW, FH); F.bg = bg;
    /* --- tanah rumput (per-piksel, cepat lewat ImageData) --- */
    const id = x.createImageData(FW, FH0), d = id.data, GD = h2r('#366e30'), GL = h2r('#68a846'), GY = h2r('#80a03c');
    for (let yy = 0; yy < FH0; yy++) for (let xx = 0; xx < FW; xx++) {
      const v = vnoise(xx / 64, yy / 64, 1) * .62 + vnoise(xx / 15, yy / 15, 2) * .38, yl = vnoise(xx / 170, yy / 170, 3), sp = hash(xx, yy, 9);
      let c = mixc(GD, GL, v); c = mixc(c, GY, yl * .22); if (sp < .05) c = mixc(c, [10, 40, 20], .3); else if (sp > .965) c = mixc(c, [210, 240, 140], .22);
      const o = (yy * FW + xx) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255
    }
    x.putImageData(id, 0, 0);
    // rumput liar & bunga tersebar
    for (let i = 0; i < 1500; i++) { const a = rng() * FW, b = rng() * FH0; art.grassTuft(x, a, b, rng) }
    const fcols = ['#ffffff', '#ffd34d', '#ff9ac0', '#b48cff', '#7ab8ff', '#ff7a7a'];
    for (let i = 0; i < 170; i++) { const a = rng() * FW, b = rng() * FH0; art.flower(x, a, b, fcols[(rng() * 6) | 0]) }
    // padang bunga
    for (let i = 0; i < 700; i++) { const an = rng() * TAU, dd = Math.sqrt(rng()) * MEAD.r; art.flower(x, MEAD.x + Math.cos(an) * dd, MEAD.y + Math.sin(an) * dd / 1.15, fcols[(rng() * 6) | 0]) }

    /* --- perkemahan: tanah injak --- */
    ell(x, 'rgba(70,48,28,.55)', CAMPC.x, CAMPC.y, 62, 40); ell(x, '#8a6a42', CAMPC.x, CAMPC.y, 58, 36); ell(x, '#9a7a4c', CAMPC.x - 4, CAMPC.y - 3, 46, 28); for (let i = 0; i < 40; i++) rc(x, rng() < .5 ? '#7a5a38' : '#b08a58', CAMPC.x + (rng() - .5) * 100, CAMPC.y + (rng() - .5) * 60, 3, 1);
    /* --- sungai --- */
    for (let yy = 0; yy < FH0; yy++) {
      const c = rx(yy), hw = rhw(yy) | 0, i0 = Math.round(c);
      rc(x, '#7a6a48', i0 - hw - 6, yy, hw * 2 + 12, 1); rc(x, '#a8946a', i0 - hw - 4, yy, hw * 2 + 8, 1); rc(x, '#2a6a8a', i0 - hw - 1, yy, hw * 2 + 2, 1); rc(x, '#3a8ab0', i0 - hw + 1, yy, hw * 2 - 2, 1); rc(x, '#4aa4cc', i0 - hw / 2, yy, hw, 1);
      if ((yy + i0) % 9 < 1) rc(x, '#7ac8e8', i0 - hw / 3 + (yy % 5), yy, 5, 1);
    }
    for (let i = 0; i < 40; i++) { const yy = rng() * FH0, side = rng() < .5 ? -1 : 1, bx = rx(yy) + side * (rhw(yy) + 5); const r = art.rock(i + 5, false); x.drawImage(r.img, bx - r.ox, yy - r.oy) }
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
    walls.push([808, -10, 44, BY0 - 4 + 10], [808, BY1 + 4, 44, BR2[0] - 4 - (BY1 + 4)], [808, BR2[1] + 4, 44, LAKE.y - LAKE.ry + 8 - (BR2[1] + 4)]);   // sungai (celah jembatan y 294..320 dan y 934..992)
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
    for (let gy = 22; gy < FH0 - 10; gy += 27) for (let gx = 8; gx < FW - 8; gx += 27) {
      const a = gx + rng() * 24, b = gy + rng() * 24, nz = vnoise(a / 150, b / 150, 5), edge = a < 90 || a > FW - 60 || b < 56 || b > FH0 - 70, dens = edge ? .95 : clamp(.18 + nz * 1.15, .08, .9);
      if (rng() > dens || !free(a, b, 6) || !canPlace(a, b, 19) || [MAINd, CAMPd, SHRd].some(P_ => distPoly(a, b - 24, P_) < 30 || distPoly(a, b - 44, P_) < 22)) continue; mark(a, b); trees.push([a, b, rng()])
    }
    trees.forEach(([a, b, k]) => {
      ell(x, 'rgba(0,12,4,.24)', a + 4, b - 2, 17, 8); ell(x, 'rgba(0,12,4,.1)', a + 2, b - 12, 28, 15);
      const s = k < .62 ? OAK[(k * 100 | 0) % OAK.length] : PINE[(k * 100 | 0) % PINE.length]; spr(s, a, b + 4, [a - 4, b - 1, 8, 5]);
    });
    // semak, batu, tunggul, kayu tumbang tersebar
    for (let i = 0; i < 160; i++) { const a = rng() * FW, b = rng() * FH0; if (!free(a, b, 8) || !canPlace(a, b, 13)) continue; mark(a, b); const k = rng(); if (k < .45) spr(rng() < .25 ? BERRY[i % 4] : BUSH[i % 4], a, b); else if (k < .78) spr(ROCK[i % 4], a, b, [a - 7, b - 4, 14, 7]); else if (k < .88) spr(BIG[i % 4], a, b + 3, [a - 12, b - 6, 24, 10]); else if (k < .95) spr(art.stump(), a, b, [a - 6, b - 4, 12, 6]); else spr(art.log(), a, b, [a - 14, b - 4, 28, 6]) }
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
    kinds.forEach((k, i) => { for (let n = 0; n < 200; n++) { let a, b; if (k === 'flower') { const an = rng() * TAU, dd = Math.sqrt(rng()) * (n < 150 ? MEAD.r - 10 : 400); a = (n < 150 ? MEAD.x : 700 + rng() * 800) + Math.cos(an) * dd; b = (n < 150 ? MEAD.y : 150 + rng() * 500) + Math.sin(an) * dd / 1.2 } else { a = 60 + rng() * (FW - 200); b = 130 + rng() * (FH0 - 170) } if (!free(a, b, 12) || F.gath.some(q => Math.hypot(q.x - a, q.y - b) < 40)) continue; if (walls.some(w => a > w[0] - 8 && a < w[0] + w[2] + 8 && b > w[1] - 8 && b < w[1] + w[3] + 8)) continue; F.gath.push({ k, x: a, y: b, got: 0, ph: rng() * 6 }); break } });
    // pendamping di jalur (lebih mudah ditemukan)
    [[300, 330, 'herb'], [650, 330, 'flower'], [700, 250, 'mush'], [940, 345, 'herb'], [1140, 412, 'mush']].forEach(([a, b, k]) => { if (!walls.some(w => a > w[0] - 8 && a < w[0] + w[2] + 8 && b > w[1] - 8 && b < w[1] + w[3] + 8)) F.gath.push({ k, x: a, y: b, got: 0, ph: rng() * 6 }) });
    /* --- percikan air --- */
    F.sparks = []; for (let i = 0; i < 90; i++) { const yy = rng() * FH0; F.sparks.push({ x: rx(yy) + (rng() - .5) * rhw(yy) * 1.6, y: yy, ph: rng() * 6 }) } for (let i = 0; i < 40; i++) { const an = rng() * TAU, dd = Math.sqrt(rng()); F.sparks.push({ x: POND.x + Math.cos(an) * dd * (POND.rx - 8), y: POND.y + Math.sin(an) * dd * (POND.ry - 6), ph: rng() * 6 }) }
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
    /* ================= PERLUASAN SELATAN =================
       Memakai RNG sendiri (mkRng(5150)) sehingga letak seluruh isi hutan lama tidak bergeser sedikit pun. */
    (function () {
      const r2 = mkRng(5150), rr = (a, b) => a + r2() * (b - a);
      const oldFree = (a, b, m) => { NEWGEO = false; const v = free(a, b, m); NEWGEO = true; return v };
      NEWGEO = true;
      const inWall = (a, b, m) => walls.some(w => a > w[0] - m && a < w[0] + w[2] + m && b > w[1] - m && b < w[1] + w[3] + m);

      /* 1) buka lorong di pagar pohon lama (y 650-720) dan di sepanjang cabang jalan baru */
      {
        const dead = objs.filter(o => o.img && !o.lamp && oldFree(o.x, o.y - 4, 0) && PTH.some(P => distPoly(o.x, o.y, P.d) < P.w / 2 + 14));
        dead.forEach(o => {
          let bi = -1, bd = 1e9; walls.forEach((w, i) => { if (w[2] > 30 || w[3] > 12) return; const dx = w[0] + w[2] / 2 - o.x, dy = w[1] + w[3] / 2 - o.y; if (Math.abs(dx) > 15 || dy < -10 || dy > 2) return; const d = dx * dx + dy * dy; if (d < bd) { bd = d; bi = i } });
          if (bi >= 0) walls.splice(bi, 1); objs.splice(objs.indexOf(o), 1)
        });
      }

      /* 2) tanah rumput wilayah selatan: menyambung mulus dari y = 720 (rumus noise sama), makin berlumut ke barat-selatan */
      {
        const H = FH - FH0, id2 = x.createImageData(FW, H), d2 = id2.data, MOSS = [34, 86, 62];
        for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < FW; xx++) {
          const Y = yy + FH0, v = vnoise(xx / 64, Y / 64, 1) * .62 + vnoise(xx / 15, Y / 15, 2) * .38, yl = vnoise(xx / 170, Y / 170, 3), sp = hash(xx, Y, 9);
          let c = mixc(GD, GL, v); c = mixc(c, GY, yl * .22); if (sp < .05) c = mixc(c, [10, 40, 20], .3); else if (sp > .965) c = mixc(c, [210, 240, 140], .22);
          const west = clamp(1 - xx / 900, 0, 1), south = clamp(yy / 220, 0, 1); if (west * south > 0) c = mixc(c, MOSS, .24 * west * south);
          const o = (yy * FW + xx) * 4; d2[o] = c[0]; d2[o + 1] = c[1]; d2[o + 2] = c[2]; d2[o + 3] = 255
        }
        x.putImageData(id2, 0, FH0);
        for (let i = 0; i < 1500; i++) art.grassTuft(x, r2() * FW, FH0 + r2() * H, r2);
        for (let i = 0; i < 190; i++) art.flower(x, r2() * FW, FH0 + r2() * H, fcols[(r2() * 6) | 0]);
        // bercak lumut gelap & tanah basah (hanya hiasan)
        for (let i = 0; i < 70; i++) { const a = rr(20, FW - 20), b = rr(FH0 + 10, FH - 20); ell(x, 'rgba(20,60,40,.18)', a, b, 18 + r2() * 30, 7 + r2() * 12) }
      }

      /* 3) sungai (lanjutan), batu tepi, danau, kolam kabut, rawa */
      for (let yy = FH0; yy < RIVER_END; yy++) {
        const c = rx(yy), hw = rhw(yy) | 0, i0 = Math.round(c);
        rc(x, '#7a6a48', i0 - hw - 6, yy, hw * 2 + 12, 1); rc(x, '#a8946a', i0 - hw - 4, yy, hw * 2 + 8, 1); rc(x, '#2a6a8a', i0 - hw - 1, yy, hw * 2 + 2, 1); rc(x, '#3a8ab0', i0 - hw + 1, yy, hw * 2 - 2, 1); rc(x, '#4aa4cc', i0 - hw / 2, yy, hw, 1);
        if ((yy + i0) % 9 < 1) rc(x, '#7ac8e8', i0 - hw / 3 + (yy % 5), yy, 5, 1)
      }
      for (let i = 0; i < 34; i++) { const yy = rr(FH0, RIVER_END - 10), side = r2() < .5 ? -1 : 1, bx = rx(yy) + side * (rhw(yy) + 5); const r = art.rock(i + 60, false); x.drawImage(r.img, bx - r.ox, yy - r.oy) }
      const pondArt = (P, lily) => {
        ell(x, '#7a6a48', P.x, P.y, P.rx + 8, P.ry + 6); ell(x, '#a8946a', P.x, P.y, P.rx + 5, P.ry + 3); ell(x, '#2a6a8a', P.x, P.y, P.rx, P.ry); ell(x, '#3a8ab0', P.x, P.y, P.rx - 4, P.ry - 3); ell(x, '#4aa4cc', P.x - 6, P.y - 3, P.rx - 22, P.ry - 14); ell(x, '#6ac0e0', P.x - 14, P.y - 6, P.rx - 50, P.ry - 26);
        for (let i = 0; i < lily; i++) { const a = P.x + (r2() - .5) * P.rx * 1.5, b = P.y + (r2() - .5) * P.ry * 1.2; ell(x, '#2f7a3a', a, b, 6, 3); ell(x, '#4aa04a', a - 1, b - 1, 4, 2); if (r2() < .5) rc(x, '#ffb0d0', a - 1, b - 2, 3, 2) }
      };
      pondArt(LAKE, 16); pondArt(MP, 7);
      for (let i = 0; i < 12; i++) { const an = r2() * TAU, dd = Math.sqrt(r2()) * SWP.r, a = SWP.x + Math.cos(an) * dd, b = SWP.y + Math.sin(an) * dd * .6, w = 10 + r2() * 16; if (Math.hypot(a - 672, b - 1196) < 40) continue; ell(x, '#27483a', a, b, w + 2, w * .4 + 2); ell(x, '#3a6a5a', a, b, w, w * .4); ell(x, '#5a8a7a', a - 2, b - 1, w * .55, w * .2) }

      /* 4) jalan tanah baru + jembatan kedua */
      const pStamp = (dn, w) => {
        dn.forEach(([a, b]) => disc(x, '#6e5030', a, b, w / 2 + 3)); dn.forEach(([a, b]) => disc(x, '#a07a4a', a, b, w / 2 + 1)); dn.forEach(([a, b], i) => { if (i % 2 == 0) disc(x, '#b48c58', a + (r2() - .5) * 4, b + (r2() - .5) * 4, w / 2 - 3) });
        dn.forEach(([a, b], i) => { if (i % 3 == 0) { rc(x, '#8a6640', a + (r2() - .5) * w * .8, b + (r2() - .5) * w * .8, 3 + r2() * 3, 1); if (r2() < .35) rc(x, '#c8a06a', a + (r2() - .5) * w * .8, b + (r2() - .5) * w * .8, 2, 1) } });
        dn.forEach(([a, b], i) => { if (i % 5 == 0) { const s = r2() < .5 ? -1 : 1, off = w / 2 + 2; art.grassTuft(x, a + s * off * (.8 + r2() * .4), b + (r2() - .5) * 4, r2) } });
        dn.forEach(([a, b], i) => { if (i % 40 == 0) art.pebbles(x, a + (r2() - .5) * w * .7, b + (r2() - .5) * w * .6, r2) })
      };
      PTH.forEach(o => pStamp(o.d, o.w));
      { const [BY0b, BY1b] = BR2;
        rc(x, 'rgba(0,0,0,.28)', BXA + 2, BY1b + 2, BXB - BXA, 7);
        for (let xx = BXA; xx < BXB; xx += 4) { rc(x, '#4a301a', xx, BY0b - 1, 4, BY1b - BY0b + 3); rc(x, xx % 8 ? '#9a7444' : '#8a6440', xx + 1, BY0b, 3, BY1b - BY0b + 1); rc(x, '#b8905a', xx + 1, BY0b, 3, 1) }
        [BY0b - 3, BY1b + 1].forEach((yy, k) => { rc(x, OLC, BXA - 3, yy - 1, BXB - BXA + 6, 5); rc(x, k ? '#8a6440' : '#a8825a', BXA - 2, yy, BXB - BXA + 4, 3); rc(x, '#c8a46a', BXA - 2, yy, BXB - BXA + 4, 1); for (let xx = BXA; xx <= BXB; xx += 18) { rc(x, OLC, xx - 1, yy - 3, 6, 10); rc(x, '#7a5434', xx, yy - 2, 4, 8); rc(x, '#b8905a', xx, yy - 2, 1, 8) } });
        // lumut di papan jembatan (lebih tua dari jembatan pertama)
        for (let i = 0; i < 40; i++) rc(x, i % 2 ? '#4a8a3a' : '#2f5a34', rr(BXA, BXB), rr(BY0b, BY1b), 3, 1);
        walls.push([BXA, BY0b - 5, BXB - BXA, 4], [BXA, BY1b + 3, BXB - BXA, 4]);
      }

      /* 5) sprite khusus wilayah baru */
      const standing = (h, k) => { const w = 16, [c, q] = mkCv(w, h + 6); rc(q, OLC, 2, 2, w - 4, h + 3); rc(q, '#6a6a78', 3, 3, w - 6, h + 1); rc(q, '#8e8e9c', 3, 3, 4, h + 1); rc(q, '#4a4a58', w - 7, 3, 3, h + 1); rc(q, '#4a8a3a', 3, 2, w - 6, 3); rc(q, '#6aaa4a', 4, 2, 5, 2); for (let i = 0; i < 4; i++) rc(q, '#3a7a3a', 4 + ((i * 5 + k) % 8), 6 + i * (h / 5 | 0), 2, 3); rc(q, '#1a2a3a', 7, h / 2 | 0, 2, 7); rc(q, '#8fe8ff', 7, (h / 2 | 0) + 1, 2, 5); return { img: c, ox: w / 2, oy: h + 3 } };
      const tower = () => {
        const W = 64, H = 96, [c, q] = mkCv(W, H), ST = ['#5e5e6c', '#6e6e7c', '#7e7e8c'], MO = ['#2f5a34', '#4a8a3a'];
        for (let xx = 6; xx < 58; xx++) { const top = 16 + (xx < 22 ? 0 : xx < 34 ? 16 : xx < 46 ? 6 : 24) + ((hash(xx, 3, 5) * 6) | 0); for (let yy = top; yy < 92; yy++) { const row = (yy / 6) | 0, mort = yy % 6 === 0 || (xx + row * 7) % 11 === 0, n = vnoise(xx / 4, yy / 4, 81); let col = mort ? '#3e3e4a' : n < .33 ? ST[0] : n < .66 ? ST[1] : ST[2]; if (xx > 50) col = mort ? '#2e2e38' : '#4a4a58'; else if (xx < 9) col = mort ? '#4a4a58' : '#9a9aa8'; if (yy - top < 2) col = MO[1]; else if (vnoise(xx / 7, yy / 6, 82) > .72 && !mort) col = MO[0]; rc(q, col, xx, yy, 1, 1) } rc(q, OLC, xx, top - 1, 1, 1) }
        rc(q, OLC, 5, 20, 1, 72); rc(q, OLC, 58, 40, 1, 52); rc(q, OLC, 6, 92, 52, 2);
        rc(q, OLC, 23, 60, 18, 32); rc(q, '#12101a', 25, 62, 14, 30); rc(q, OLC, 25, 58, 14, 4); rc(q, '#3e3e4a', 26, 59, 12, 2);
        [[12, 34], [44, 50]].forEach(([a, b]) => { rc(q, OLC, a - 1, b - 1, 7, 13); rc(q, '#0c0a14', a, b, 5, 11); rc(q, '#8a5af0', a + 1, b + 3, 3, 5) });
        for (let i = 0; i < 6; i++) { const vx = 8 + i * 8 + ((i * 3) % 5), len = 10 + ((i * 7) % 16); for (let k = 0; k < len; k++) rc(q, k % 5 < 3 ? MO[1] : MO[0], vx + (k % 6 < 3 ? 0 : 1), 20 + k + (i % 2) * 6, 1, 1) }
        return { img: c, ox: 32, oy: 90 }
      };
      const wallPiece = (w) => { const h = 26, [c, q] = mkCv(w, h); for (let xx = 0; xx < w; xx++) { const top = 4 + ((hash(xx, w, 7) * 8) | 0); for (let yy = top; yy < h; yy++) { const mort = yy % 6 === 0 || (xx + ((yy / 6) | 0) * 5) % 10 === 0, n = vnoise(xx / 4, yy / 4, 83); rc(q, yy - top < 2 ? '#4a8a3a' : mort ? '#3e3e4a' : n < .5 ? '#5e5e6c' : '#72727f', xx, yy, 1, 1) } rc(q, OLC, xx, top - 1, 1, 1) } rc(q, OLC, 0, 6, 1, 20); rc(q, OLC, w - 1, 6, 1, 20); rc(q, OLC, 0, h - 1, w, 1); return { img: c, ox: w / 2, oy: h - 3 } };
      const gShroom = (k) => { const W = 40, H = 46, [c, q] = mkCv(W, H), cap = [['#2a8a8a', '#5ad8c8', '#c8fff0'], ['#5a3aa8', '#9a7aff', '#e0d0ff'], ['#2a7a5a', '#6ae0a0', '#d8ffe8']][k % 3]; rc(q, OLC, 15, 20, 10, 24); rc(q, '#d8c8a0', 16, 21, 8, 22); rc(q, '#f4e8c8', 16, 21, 3, 22); rc(q, '#9a8a68', 22, 21, 2, 22); ell(q, OLC, 20, 18, 19, 13); ell(q, cap[0], 20, 17, 17, 11); ell(q, cap[1], 19, 15, 14, 8); ell(q, cap[2], 15, 12, 6, 3); [[10, 15], [24, 12], [28, 18], [18, 19]].forEach(([a, b]) => rc(q, '#fff8e0', a, b, 2, 2)); return { img: c, ox: 20, oy: 42 } };
      const altar = () => { const [c, q] = mkCv(30, 24); rc(q, OLC, 2, 8, 26, 15); rc(q, '#6a6a78', 3, 9, 24, 13); rc(q, '#9a9aa8', 3, 9, 24, 3); rc(q, '#4a4a58', 3, 19, 24, 3); rc(q, OLC, 6, 2, 18, 8); rc(q, '#8a8a98', 7, 3, 16, 6); rc(q, '#bcbcc8', 7, 3, 16, 2); rc(q, '#8fe8ff', 13, 4, 4, 3); rc(q, '#e0ffff', 14, 4, 2, 1); return { img: c, ox: 15, oy: 20 } };
      F.glows = [];   // titik cahaya wilayah baru (dipakai efek di F.env)

      /* 6) lantai & dekorasi wilayah khusus */
      // -- Lingkaran Batu Tua: lantai batu, altar, 9 batu berdiri (celah di timur laut & barat daya = jalan masuk/keluar)
      ell(x, 'rgba(0,0,0,.22)', SC.x, SC.y + 4, 74, 48); ell(x, '#4a4a56', SC.x, SC.y, 70, 44); ell(x, '#6a6a78', SC.x, SC.y, 66, 41); ell(x, '#7c7c8a', SC.x - 2, SC.y - 2, 58, 35);
      for (let i = 0; i < 120; i++) { const an = r2() * TAU, dd = 6 + Math.sqrt(r2()) * 58; rc(x, r2() < .5 ? '#5e5e6c' : '#8e8e9c', SC.x + Math.cos(an) * dd, SC.y + Math.sin(an) * dd * .62, 4, 1) }
      for (let i = 0; i < 60; i++) { const an = r2() * TAU, dd = 20 + r2() * 48; rc(x, r2() < .5 ? '#3a7a3a' : '#4a8a3a', SC.x + Math.cos(an) * dd, SC.y + Math.sin(an) * dd * .62, 2 + (r2() * 3 | 0), 1) }
      ell(x, '#2a5a6a', SC.x, SC.y, 22, 13); ell(x, '#3a8ab0', SC.x, SC.y, 18, 10); ell(x, '#8fe8ff', SC.x, SC.y, 10, 5);
      spr(altar(), SC.x, SC.y + 10, [SC.x - 13, SC.y + 1, 26, 10]); F.glows.push([SC.x, SC.y - 2, 60, '110,220,255', .22, 0]);
      for (let i = 0; i < 9; i++) { const an = i / 9 * TAU + .3, dx = Math.cos(an), dy = Math.sin(an); if (Math.hypot(dx - .88, dy + .47) < .62 || Math.hypot(dx + .72, dy - .7) < .62) continue; const a = SC.x + dx * 64, b = SC.y + dy * 40, h = 30 + (i % 3) * 8; spr(standing(h, i), a, b + 3, [a - 7, b - 3, 14, 6]); F.glows.push([a, b - h / 2, 18, '110,220,255', .12, i]) }
      // -- Taman Peri: pohon pusat besar, cincin bunga, kunang-kunang
      ell(x, 'rgba(10,50,30,.35)', HG.x, HG.y, HG.r - 6, HG.r * .72); for (let i = 0; i < 520; i++) { const an = r2() * TAU, dd = Math.sqrt(r2()) * (HG.r - 8); art.flower(x, HG.x + Math.cos(an) * dd, HG.y + Math.sin(an) * dd * .8, fcols[(r2() * 6) | 0]) }
      for (let i = 0; i < 14; i++) { const an = i / 14 * TAU, a = HG.x + Math.cos(an) * 40, b = HG.y + Math.sin(an) * 30, sh = gShroom(i + 1); x.drawImage(sh.img, Math.round(a - 12), Math.round(b - 14), 24, 28) }
      spr(art.oak(61, 1.55), HG.x, HG.y - 8, [HG.x - 6, HG.y - 13, 12, 6]); F.glows.push([HG.x, HG.y - 30, 90, '170,255,200', .16, 3], [HG.x, HG.y, 70, '255,230,150', .12, 5]);
      // -- Menara Pengawas Runtuh: lantai batu, menara, tembok patah, puing
      ell(x, 'rgba(0,0,0,.25)', WT.x, WT.y + 6, 72, 44); ell(x, '#5a5a66', WT.x, WT.y, 68, 41); ell(x, '#707080', WT.x, WT.y, 62, 36);
      for (let i = 0; i < 110; i++) { const an = r2() * TAU, dd = 6 + Math.sqrt(r2()) * 58; rc(x, r2() < .5 ? '#5e5e6c' : '#8a8a98', WT.x + Math.cos(an) * dd, WT.y + Math.sin(an) * dd * .6, 4, 1) }
      spr(tower(), WT.x - 4, WT.y - 6, [WT.x - 32, WT.y - 20, 56, 16]);
      [[-58, 18, 34], [52, 12, 40], [-30, 34, 30]].forEach(([dx, dy, w]) => spr(wallPiece(w), WT.x + dx, WT.y + dy, [WT.x + dx - w / 2 + 2, WT.y + dy - 7, w - 4, 8]));
      for (let i = 0; i < 9; i++) { const an = r2() * TAU, dd = 34 + r2() * 34, a = WT.x + Math.cos(an) * dd, b = WT.y + Math.sin(an) * dd * .6; if (a > WT.x - 40 && a < WT.x + 34 && b < WT.y + 6 && b > WT.y - 30) continue; spr(ROCK[i % 4], a, b, [a - 7, b - 4, 14, 7]) }
      F.glows.push([WT.x - 4 + 6, WT.y - 38, 34, '150,90,255', .12, 7]);
      // -- Gua Jamur Bercahaya: tanah ungu-kehijauan, jamur raksasa berpendar
      ell(x, 'rgba(40,20,90,.35)', GH.x, GH.y, GH.r + 4, GH.r * .72); ell(x, 'rgba(30,90,110,.28)', GH.x, GH.y, GH.r - 12, GH.r * .55);
      for (let i = 0; i < 160; i++) { const an = r2() * TAU, dd = Math.sqrt(r2()) * (GH.r - 8); rc(x, ['#5ad8c8', '#9a7aff', '#c8fff0'][(r2() * 3) | 0], GH.x + Math.cos(an) * dd, GH.y + Math.sin(an) * dd * .75, 1, 1) }
      for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + .5, dd = i % 2 ? 54 : 34, a = GH.x + Math.cos(an) * dd, b = GH.y + Math.sin(an) * dd * .7; if (Math.hypot(a - GH.x + 30, b - GH.y + 28) < 22) continue; spr(gShroom(i), a, b + 6, [a - 7, b - 1, 14, 6]); F.glows.push([a, b - 22, 40, i % 3 === 1 ? '150,120,255' : '90,255,220', .22, i]) }
      // -- Relung Sunyi: lantai tanah berlumut + kayu tumbang
      ell(x, 'rgba(20,60,30,.3)', NK.x, NK.y, NK.r, NK.r * .7); for (let i = 0; i < 60; i++) art.flower(x, NK.x + (r2() - .5) * NK.r * 1.6, NK.y + (r2() - .5) * NK.r, fcols[(r2() * 6) | 0]);
      spr(art.log(), NK.x - 22, NK.y + 18, [NK.x - 36, NK.y + 14, 28, 6]);

      /* 7) pohon, semak, batu (sebaran wilayah baru; memakai occ/canPlace yang sama supaya menyatu dengan sabuk pohon lama) */
      const SPOTS = [SC, HG, WT, GH, NK];
      const nearSpot = (a, b, d) => SPOTS.some(s => Math.hypot(a - s.x, b - s.y) < s.r + d);
      const trees2 = [], pathsAll = [MAINd, CAMPd, SHRd, ...PTH.map(o => o.d)];
      for (let gy = FH0 + 6; gy < FH - 10; gy += 27) for (let gx = 8; gx < FW - 8; gx += 27) {
        const a = gx + r2() * 24, b = gy + r2() * 24, nz = vnoise(a / 150, b / 150, 5), ring = [HG, GH, NK].some(q => Math.hypot(a - q.x, b - q.y) < q.r + 70), edge = a < 90 || a > FW - 60 || b > FH - 80 || (ring && !nearSpot(a, b, 6)), west = a < 780 ? .1 : 0, dens = edge ? .95 : clamp(.2 + nz * 1.1 + west, .08, .9);
        if (r2() > dens || !free(a, b, 6) || !canPlace(a, b, 19) || pathsAll.some(P_ => distPoly(a, b - 24, P_) < 30 || distPoly(a, b - 44, P_) < 22)) continue; mark(a, b); trees2.push([a, b, r2()])
      }
      trees2.forEach(([a, b, k]) => {
        ell(x, 'rgba(0,12,4,.24)', a + 4, b - 2, 17, 8); ell(x, 'rgba(0,12,4,.1)', a + 2, b - 12, 28, 15);
        const s = k < .55 ? OAK[(k * 100 | 0) % OAK.length] : PINE[(k * 100 | 0) % PINE.length]; spr(s, a, b + 4, [a - 4, b - 1, 8, 5])
      });
      for (let i = 0; i < 230; i++) {
        const a = rr(30, FW - 30), b = rr(FH0 + 10, FH - 30); if (!free(a, b, 8) || !canPlace(a, b, 13)) continue; mark(a, b); const k = r2();
        if (k < .42) spr(r2() < .25 ? BERRY[i % 4] : BUSH[i % 4], a, b); else if (k < .76) spr(ROCK[i % 4], a, b, [a - 7, b - 4, 14, 7]); else if (k < .88) spr(BIG[i % 4], a, b + 3, [a - 12, b - 6, 24, 10]); else if (k < .95) spr(art.stump(), a, b, [a - 6, b - 4, 12, 6]); else spr(art.log(), a, b, [a - 14, b - 4, 28, 6])
      }
      // semak penyamar di mulut jalan rahasia (tidak menghalangi)
      [['T2', 2], ['T5', 3], ['T8', 3]].forEach(([id, n]) => { const P_ = PTH.find(q => q.id === id).P, pt = P_[P_.length - 1]; for (let i = 0; i < n; i++) spr(BUSH[i % 4], pt[0] + (i - 1) * 22 + rr(-6, 6), pt[1] - 26 - (i % 2) * 8) });

      /* 8) dinding: danau, kolam kabut, batas selatan sudah ada di walls utama */
      const ellWalls = P => { for (let dy = -P.ry; dy < P.ry; dy += 10) { const k = Math.sqrt(Math.max(0, 1 - Math.pow((dy + 5) / P.ry, 2))); walls.push([P.x - P.rx * k + 6, P.y + dy, P.rx * 2 * k - 12, 10]) } };
      ellWalls(LAKE); ellWalls(MP);

      /* 9) peti baru (tersembunyi di wilayah baru) */
      [{ id: 'f5', x: WT.x + 50, y: WT.y - 30, g: 120 }, { id: 'f6', x: HG.x + 34, y: HG.y + 38, g: 160 }, { id: 'f7', x: GH.x + 36, y: GH.y + 34, g: 150 }, { id: 'f8', x: SC.x + 4, y: SC.y + 36, g: 100 }, { id: 'f9', x: NK.x + 8, y: NK.y + 6, g: 90 }].forEach(nc => {
        CHESTS.push(nc); const c = { ...nc, open: !!W_.chests[nc.id], t: 0 }; c.s0 = art.chest(false); c.s1 = art.chest(true); F.chests.push(c); walls.push([c.x - 8, c.y - 5, 16, 6]);
        for (let i = 0; i < 4; i++) { const a = c.x + (i < 2 ? -1 : 1) * (18 + r2() * 6), b = c.y + (r2() - .3) * 14; spr(BUSH[(i + c.x) % 4 | 0], a, b) } for (let i = 0; i < 8; i++) art.flower(x, c.x + (r2() - .5) * 50, c.y + 10 + (r2() - .5) * 20, fcols[(r2() * 6) | 0])
      });

      /* 10) papan petunjuk baru (interaktif, sama seperti papan lama) */
      [[1172, 462, 'Papan Jalur Selatan', ['Jalur Selatan. Jalan lebar ini menuju Hutan Lumut, Lembah Paku, dan Danau Cermin.', 'Hutan di selatan lebih lebat dan sunyi. Bawa ramuan secukupnya.']],
      [628, 742, 'Papan Hutan Lumut', ['Hutan Lumut. Batu-batu tua berdiri di barat daya, di balik jalan setapak yang berkelok.', 'Konon ada sebuah taman kecil yang tak pernah layu, tersembunyi jauh di sudut barat.']],
      [762, 1010, 'Papan Jembatan Batu', ['Jembatan Lumut. Lebih tua dari jembatan di utara, namun papannya masih kuat.', 'Ke timur: Lembah Paku dan Menara Pengawas. Ke barat: Lingkaran Batu dan Rawa Lumut.']],
      [1336, 1012, 'Papan Menara Tua', ['Menara Pengawas yang runtuh. Dulu ia menjaga jalan ke Abyss sebelum hutan menelannya.', 'Beberapa penjelajah bilang ada jalan setapak sempit di balik menara, mengarah ke cahaya aneh di tenggara.']],
      [774, 1210, 'Papan Danau Cermin', ['Danau Cermin. Sungai Sunyi berakhir di sini dan airnya tenang seperti kaca.', 'Mata Air Suci di utara adalah hulu dari sungai ini, atau begitu kata orang.']]
      ].forEach(([a, b, nm, ln]) => { SIGNP.push([a, b]); spr(art.sign(), a, b, [a - 5, b - 4, 10, 6]); F.npcs.push({ n: nm, x: a, y: b - 6, sign: 1, rng: 34, lines: ln }) });

      /* 11) bahan tanaman tambahan (baru; tidak menggeser bahan lama) */
      const zone = (k) => k === 'flower' ? [[MP.x, MP.y, 150], [HG.x, HG.y, 60], [1560, 900, 160], [NK.x, NK.y, 30]] : k === 'mush' ? [[GH.x, GH.y, 60], [SC.x, SC.y, 150], [SWP.x, SWP.y, 110], [400, 780, 150]] : [[900, 1080, 360], [1400, 880, 260], [300, 900, 220], [640, 1080, 200], [1560, 1200, 200]];
      const KN = ['herb', 'herb', 'herb', 'herb', 'herb', 'herb', 'herb', 'herb', 'mush', 'mush', 'mush', 'mush', 'mush', 'mush', 'mush', 'flower', 'flower', 'flower', 'flower', 'flower', 'flower', 'flower', 'flower', 'herb', 'mush', 'flower', 'herb', 'mush', 'flower', 'herb'];
      KN.forEach((k, i) => { for (let n = 0; n < 120; n++) { const Z = zone(k), z = Z[(r2() * Z.length) | 0], an = r2() * TAU, dd = Math.sqrt(r2()) * z[2], a = z[0] + Math.cos(an) * dd, b = z[1] + Math.sin(an) * dd * .8; if (a < 40 || a > FW - 40 || b < FH0 + 14 || b > FH - 40) continue; const inGlade = SPOTS.some(s => Math.hypot(a - s.x, b - s.y) < s.r - 6); if (!inGlade && !free(a, b, 12)) continue; if (F.gath.some(q => Math.hypot(q.x - a, q.y - b) < 40) || inWall(a, b, 8)) continue; F.gath.push({ k, x: a, y: b, got: 0, ph: r2() * 6 }); break } });
      // pendamping di jalur baru (lebih mudah ditemukan)
      [[604, 704, 'herb'], [1090, 740, 'mush'], [512, 930, 'flower'], [1300, 945, 'herb'], [1050, 1030, 'flower']].forEach(([a, b, k]) => { if (!inWall(a, b, 8)) F.gath.push({ k, x: a, y: b, got: 0, ph: r2() * 6 }) });

      /* 12) kelinci tambahan, percikan air */
      [[MP.x - 110, MP.y - 50], [MP.x + 120, MP.y - 56], [SC.x + 90, SC.y + 70], [WT.x - 100, WT.y + 90]].forEach(([a, b], i) => { if (!inWall(a, b, 6)) F.crit.push({ x: a, y: b, vx: 0, vy: 0, st: 0, tm: r2() * 3, hz: 0, fc: r2() < .5 ? -1 : 1, col: i % 2 ? '#b8a898' : '#a8845a', ph: r2() * 6 }) });
      for (let i = 0; i < 70; i++) { const yy = rr(FH0, RIVER_END); F.sparks.push({ x: rx(yy) + (r2() - .5) * rhw(yy) * 1.6, y: yy, ph: r2() * 6 }) }
      [[LAKE, 70], [MP, 30]].forEach(([P, n]) => { for (let i = 0; i < n; i++) { const an = r2() * TAU, dd = Math.sqrt(r2()); F.sparks.push({ x: P.x + Math.cos(an) * dd * (P.rx - 8), y: P.y + Math.sin(an) * dd * (P.ry - 6), ph: r2() * 6 }) } });
    })();
    F.objs.sort((a, b) => a.y - b.y);
    F.dyn = [...F.npcs.filter(n => !n.sign).map((n, i) => ({ n, i, get y() { return n.y } })), ...F.crit.map(c => ({ c, get y() { return c.y } })), ...F.chests.map(c => ({ ch: c, y: c.y }))];
    // butiran cahaya
    F.ff = []; for (let i = 0; i < 46; i++) F.ff.push({ bx: rng(), by: rng(), sx: 4 + rng() * 8, sy: (rng() - .5) * 6, ph: rng() * 6, k: rng() });
    F.lv = []; for (let i = 0; i < 16; i++) F.lv.push({ bx: rng(), by: rng(), sp: 8 + rng() * 10, ph: rng() * 6, c: ['#6aaa3a', '#a8c040', '#d8a030', '#c86a2a'][(rng() * 4) | 0] });
    F.bf = []; for (let i = 0; i < 9; i++) { const an = rng() * TAU, dd = Math.sqrt(rng()) * 90; F.bf.push({ cx: MEAD.x + Math.cos(an) * dd, cy: MEAD.y + Math.sin(an) * dd * .7, ph: rng() * 6, c: ['#ffd34d', '#ff9ac0', '#7ab8ff', '#fff'][i % 4] }) }
  };
  const OLC = '#0f1a12';

  F.enter = function () { syncWorld() };
  // pastikan batas kamera/dunia memakai ukuran hutan yang sudah diperluas (WW/WH dibaca main.js untuk membatasi kamera)
  function syncWorld() { try { if (typeof WW !== 'undefined' && WW !== FW) WW = FW; if (typeof WH !== 'undefined' && WH !== FH) WH = FH } catch (e) { } }

  /* ---------- update ---------- */
  F.tick = function (dt) {
    if (window.AREA === 'forest') syncWorld();
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
    if (vx1 > 780 && vx0 < 880) { g.save(); g.globalAlpha = .35; g.fillStyle = '#d8f4ff'; for (let i = 0; i < 52; i++) { const yy = ((i * 29 + t * 22) % RIVER_END), xx = rx(yy) + Math.sin(i * 7.3) * rhw(yy) * .7; if (yy > vy0 && yy < vy1) g.fillRect(Math.round(xx), Math.round(yy), 1, 5) } g.restore() }
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
    if (o.img) {
      const im = o.img, X = o.x - o.ox, Y = o.y - o.oy, C = F.depthCfg || {};
      if (o.tree && C.fadeCanopy) { const hit = o.y > p.y + 3 && p.x > X + 4 && p.x < X + im.width - 4 && p.y - 10 > Y && p.y - 10 < Y + im.height * .78; o.fa = (o.fa === undefined ? 1 : o.fa) + ((hit ? .4 : 1) - (o.fa === undefined ? 1 : o.fa)) * .18 }
      const al = o.fa === undefined ? 1 : o.fa; if (al < .995) { g.save(); g.globalAlpha = al }
      if (o.sway && C.sway) {   // goyang pelan: bagian atas bergeser 1px, bagian tengah setengahnya
        const w = im.width, h = im.height, s = Math.sin(t * (o.tree ? .7 : 1.5) + o.x * .05 + o.y * .02) * o.sway * (o.tree ? 1.3 : 1.1), a = Math.round(s), b2 = Math.round(s * .5), h1 = Math.round(h * (o.tree ? .45 : .5)), h2 = o.tree ? Math.round(h * .25) : 0;
        g.drawImage(im, 0, 0, w, h1, X + a, Y, w, h1); if (h2) g.drawImage(im, 0, h1, w, h2, X + b2, Y + h1, w, h2); g.drawImage(im, 0, h1 + h2, w, h - h1 - h2, X, Y + h1 + h2, w, h - h1 - h2)
      } else g.drawImage(im, X, Y);
      if (al < .995) g.restore();
      if (o.lamp) o.lamp.forEach(([a, b]) => lightL(a, b + 4, 40 + Math.sin(t * 9 + a) * 3, '255,200,110', .3)); return
    }
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

/* ===== Cahaya wilayah selatan: batu rune, jamur raksasa, taman peri, menara ===== */
(function () {
  const F = WORLD.AREAS.forest; if (!F) return;
  const lightL = WORLD.lightL, _env = F.env;
  F.env = function () {
    _env.apply(this, arguments);
    const G = F.glows; if (!G || !G.length || camY < 560) return;
    const vx0 = camX - 90, vx1 = camX + W / CAM_Z + 90, vy0 = camY - 90, vy1 = camY + H / CAM_Z + 90;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const q of G) { if (q[0] < vx0 || q[0] > vx1 || q[1] < vy0 || q[1] > vy1) continue; const night = WORLD.WX ? WORLD.WX.night : 0; lightL(q[0], q[1], q[2], q[3], q[4] * (.85 + .3 * night) * (.8 + .2 * Math.sin(t * 1.7 + q[5] * 1.9))) }
    // kunang-kunang peri di Taman Peri & Gua Jamur
    for (let i = 0; i < 14; i++) { const C = i < 8 ? F.geo.HG : F.geo.GH, a = t * .4 + i * 1.7, X = C.x + Math.sin(a * 1.3 + i) * (C.r - 14), Y = C.y - 10 + Math.cos(a * .9 + i * 2) * (C.r * .5) - Math.abs(Math.sin(a * 2)) * 6; if (X < vx0 || X > vx1 || Y < vy0 || Y > vy1) continue; const al = .4 + .5 * Math.max(0, Math.sin(t * 2.2 + i)); g.fillStyle = i < 8 ? 'rgba(200,255,190,' + al + ')' : 'rgba(150,255,235,' + al + ')'; g.fillRect(Math.round(X), Math.round(Y), 2, 2); g.fillStyle = i < 8 ? 'rgba(200,255,190,' + al * .25 + ')' : 'rgba(150,255,235,' + al * .25 + ')'; g.fillRect(Math.round(X) - 1, Math.round(Y) - 1, 4, 4) }
    g.restore()
  };
})();

/* ===== KEDALAMAN HUTAN: bayangan terarah, cahaya, pohon raksasa, semak, kabut ===== */
(function () {
  'use strict';
  const F = WORLD.AREAS.forest; if (!F || !F.geo) return;
  const { clamp, mkRng, mkCv, rc, hash, vnoise, art } = WORLD;
  const FW = 1800, GEO = F.geo, FH = GEO.FH, FH0 = GEO.FH0;
  const CFG = F.depthCfg = {
    fadeCanopy: true,   // pohon yang menutupi pemain jadi tembus pandang
    sway: true,         // tajuk pohon, pakis & rumput bergoyang pelan
    giants: 1,          // jumlah pohon raksasa (1 = normal, 0 = mati)
    undergrowth: 1,     // kepadatan pakis/rumput tinggi (0 = mati)
    dapple: .5,         // bintik cahaya matahari di lantai hutan
    clouds: .13,        // bayangan awan yang melintas
    mist: 1,            // kabut tipis dekat sungai/kolam/mata air
    vignette: .34,      // gelap halus di tepi layar
    leaves: false       // daun gelap di tepi atas layar (dimatikan)
  };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const wx = () => WORLD.WX || { night: 0, rain: 0 };
  const dayK = () => { const w = wx(); return 1 - clamp((w.night || 0) * 1.3 + (w.rain || 0) * .6, 0, 1) };

  /* ---------- sprite pohon/semak/batu: pencahayaan terarah (terang kiri-atas, gelap kanan-bawah) ---------- */
  let ACTIVE = false;
  const KINDS = { oak: 'tree', pine: 'tree', bush: 'bush', rock: 'rock', stump: 'rock', log: 'rock' };
  const LIT = { tree: { lift: .15, dark: .36 }, bush: { lift: .14, dark: .28 }, rock: { lift: .17, dark: .3 } };
  function litClone(img, kind) {
    const w = img.width, h = img.height, [c, q] = mkCv(w, h), P = LIT[kind];
    q.drawImage(img, 0, 0);
    const id = q.getImageData(0, 0, w, h), d = id.data, A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : d[(y * w + x) * 4 + 3];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4; if (d[o + 3] < 200) continue;
      let r = d[o], gg = d[o + 1], b = d[o + 2]; const lum = r * .3 + gg * .59 + b * .11; if (lum < 38) continue;   // jangan sentuh garis tepi
      const t = y / h, dark = clamp((t - .32) / .68, 0, 1) * P.dark, lift = clamp((.46 - t) / .46, 0, 1) * P.lift;
      let gain = 1 + lift - dark, ar = 0, ag = 0, ab = 0;
      if (A(x - 2, y - 2) < 40 || A(x - 3, y) < 40) { ar += 22; ag += 26; ab += 4 }   // cahaya tepi kiri-atas
      else if (A(x + 2, y + 2) < 40 || A(x + 3, y) < 40) { gain *= .8; ab += 8 }      // sisi gelap kanan-bawah
      if (kind === 'tree' && t > .88) gain *= .8;                                      // pangkal batang lebih gelap
      ab += dark * 22; ar -= dark * 12;                                                 // bayangan kebiruan
      d[o] = clamp(r * gain + ar, 0, 255); d[o + 1] = clamp(gg * gain + ag, 0, 255); d[o + 2] = clamp(b * gain + ab, 0, 255)
    }
    q.putImageData(id, 0, 0); return c
  }
  Object.keys(KINDS).forEach(k => {
    const orig = art[k]; if (typeof orig !== 'function') return;
    art[k] = function () {
      const s = orig.apply(this, arguments);
      if (!ACTIVE || !s || !s.img || s.img.__lit) return s;
      try { const img = litClone(s.img, KINDS[k]); img.__lit = 1; img.__k = k; return Object.assign({}, s, { img }) } catch (e) { return s }
    };
  });

  /* ---------- sprite tambahan: pakis, rumput tinggi, jamur hutan, ilalang air ---------- */
  function fern(seed) {
    const r = mkRng(seed), W = 28, H = 20, [c, q] = mkCv(W, H), bx = W / 2 | 0, by = H - 2, n = 6 + (r() * 3 | 0), pts = [];
    for (let f = 0; f < n; f++) {
      const ang = (f / (n - 1) - .5) * 2.5 + (r() - .5) * .3, len = 9 + r() * 5 - Math.abs(ang) * 2;
      for (let k = 0; k <= len; k++) { const tt = k / len, x = bx + Math.sin(ang) * k * 1.05, y = by - Math.cos(ang) * k * .72 + tt * tt * (2 + Math.abs(ang) * 3); pts.push([Math.round(x), Math.round(y), tt, ang]) }
    }
    pts.forEach(([x, y, tt]) => rc(q, '#0f1a12', x - 3 + (tt > .75 ? 1 : 0), y - 1, 7 - (tt > .75 ? 2 : 0), 3));
    pts.forEach(([x, y, tt]) => rc(q, '#2c6432', x - 2 + (tt > .75 ? 1 : 0), y, 5 - (tt > .75 ? 2 : 0), 1));
    pts.forEach(([x, y, tt, ang]) => { rc(q, '#4a9a46', x - 1, y, 3, 1); if (ang < .2 && tt > .25) rc(q, '#82d060', x - 2, y - 1, 2, 1); if (tt > .85) rc(q, '#a8e47a', x, y - 1, 1, 1) });
    return { img: c, ox: bx, oy: by }
  }
  function tallGrass(seed) {
    const r = mkRng(seed), W = 18, H = 18, [c, q] = mkCv(W, H), n = 5 + (r() * 3 | 0), bl = [];
    for (let i = 0; i < n; i++) { const x0 = 3 + i * (12 / n) + r() * 2, h = 8 + r() * 8, lean = (r() - .5) * 5; for (let k = 0; k <= h; k++) { const tt = k / h; bl.push([Math.round(x0 + lean * tt * tt), H - 2 - k, tt]) } }
    bl.forEach(([x, y]) => rc(q, '#0f1a12', x - 1, y, 3, 1));
    bl.forEach(([x, y, tt]) => rc(q, tt > .8 ? '#9ad868' : tt > .45 ? '#58b04e' : '#2f7438', x, y, 1, 1));
    bl.forEach(([x, y, tt], i) => { if (i % 3 === 0) rc(q, '#7acc5e', x - 1, y, 1, 1) });
    return { img: c, ox: 9, oy: 16 }
  }
  function shroom(seed) {
    const r = mkRng(seed), [c, q] = mkCv(16, 12), n = 2 + (r() * 2 | 0);
    for (let i = 0; i < n; i++) {
      const x = 3 + i * 4 + (r() * 2 | 0), h = 3 + (r() * 3 | 0), cw = 5 + (r() * 2 | 0), y = 10 - h;
      rc(q, '#0f1a12', x + 1, y, 3, h + 1); rc(q, '#d8c8a0', x + 2, y + 1, 1, h - 1); rc(q, '#0f1a12', x - 1, y - 3, cw + 2, 4); rc(q, '#8a5a34', x, y - 2, cw, 2); rc(q, '#b88050', x, y - 2, cw - 2, 1)
    }
    return { img: c, ox: 8, oy: 10 }
  }
  function cattail(seed) {
    const r = mkRng(seed), W = 16, H = 30, [c, q] = mkCv(W, H), n = 3 + (r() * 2 | 0);
    for (let i = 0; i < n; i++) {
      const x = 3 + i * 3 + (r() * 2 | 0), h = 16 + (r() * 11 | 0), lean = (r() - .5) * 3;
      for (let k = 0; k < h; k++) { const px = Math.round(x + lean * (k / h)), py = H - 2 - k; rc(q, '#0f1a12', px - 1, py, 3, 1); rc(q, k > h * .6 ? '#6aa84a' : '#3a8444', px, py, 1, 1) }
      const hx = Math.round(x + lean), hy = H - 2 - h; rc(q, '#0f1a12', hx - 1, hy - 5, 4, 7); rc(q, '#6a4228', hx, hy - 4, 2, 5); rc(q, '#9a6a40', hx, hy - 4, 1, 4)
    }
    return { img: c, ox: 8, oy: 28 }
  }
  function leafCluster(seed) {
    const r = mkRng(seed), W = 64, H = 40, [c, q] = mkCv(W, H);
    for (let i = 0; i < 16; i++) {
      const lx = 6 + r() * (W - 12), ly = 2 + r() * (H - 12), a = (r() - .5) * 1.6, len = 12 + r() * 12;
      for (let k = 0; k < len; k++) { const wd = Math.sin(k / len * Math.PI) * 4 + 1, px = lx + Math.sin(a) * k, py = ly + Math.cos(a) * k * .7; rc(q, '#07120a', px - wd - 1, py - 1, wd * 2 + 3, 3); }
    }
    q.globalCompositeOperation = 'source-atop'; q.fillStyle = '#0b1c10'; q.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { const px = r() * W, py = r() * H * .6; q.fillStyle = r() < .5 ? '#16381f' : '#1f4a28'; q.fillRect(Math.round(px), Math.round(py), 3, 1) }
    return c
  }

  /* ---------- tekstur bayangan/cahaya bertitik (pixel-art) ---------- */
  function pixelate(ctx, w, h, levels) {
    const id = ctx.getImageData(0, 0, w, h), d = id.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4, a = d[o + 3] / 255 * levels, lv = Math.floor(a) + ((a - Math.floor(a)) > BAYER[(x & 3) + ((y & 3) << 2)] / 16 ? 1 : 0); d[o + 3] = Math.min(levels, lv) / levels * 255 }
    ctx.putImageData(id, 0, 0)
  }
  function blobTile(size, count, rmin, rmax, rgb, seed) {
    const r = mkRng(seed), [c, q] = mkCv(size, size);
    for (let i = 0; i < count; i++) {
      const bx = r() * size, by = r() * size, rr = rmin + r() * (rmax - rmin);
      for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
        const x = bx + ox * size, y = by + oy * size; if (x < -rr || y < -rr || x > size + rr || y > size + rr) continue;
        const gr = q.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(' + rgb + ',.9)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)'); q.fillStyle = gr; q.fillRect(x - rr, y - rr, rr * 2, rr * 2)
      }
    }
    return [c, q]
  }

  /* ---------- BUILD: dipasang di atas build asli ---------- */
  const _build = F.build;
  F.build = function () {
    ACTIVE = true; let r;
    try { r = _build.apply(this, arguments) } finally { ACTIVE = false }
    try { depthPass() } catch (e) { if (typeof console !== 'undefined') console.warn('[forest depth]', e) }
    return r
  };

  function depthPass() {
    const rng = mkRng(31337), objs = F.objs, walls = F.walls, free = F.free, bgc = F.bg.getContext('2d');
    const { MAINd, CAMPd, SHRd, PW, PS, POND, CAMPC, SHRC, MEAD, rx, rhw, cliffRect, ponds, paths, glades, LAKE, MP, BR2, RIVER_END } = GEO;
    const addObj = (s, px, py, solid, extra) => { const o = Object.assign({ x: Math.round(px), y: Math.round(py), img: s.img, ox: s.ox, oy: s.oy, oh: s.img.height }, extra || {}); objs.push(o); if (solid) walls.push(solid); return o };
    const treeObjs = () => objs.filter(o => o.img && (o.img.__k === 'oak' || o.img.__k === 'pine'));
    const farFromTrees = (a, b, m) => !objs.some(o => o.img && o.img.__k && (o.img.__k === 'oak' || o.img.__k === 'pine') && Math.hypot(o.x - a, o.y - b) < m);
    const pathClear = (a, b, m) => paths.every(P => WORLD.distPoly(a, b, P.d) > m);

    /* 1) pohon raksasa + anakan: variasi ukuran supaya siluet hutan tidak seragam */
    ACTIVE = true;
    if (CFG.giants > 0) {
      const want = Math.round(26 * CFG.giants), giants = [];
      for (let n = 0; n < 1700 && giants.length < want; n++) {
        const a = 60 + rng() * (FW - 200), b = 150 + rng() * (FH - 190);
        if (!free(a, b, 30) || !farFromTrees(a, b, 26) || giants.some(q => Math.hypot(q[0] - a, q[1] - b) < 110)) continue;
        if (!pathClear(a, b - 50, 40) || !pathClear(a, b - 85, 30) || !pathClear(a, b, 40)) continue;
        giants.push([a, b]);
      }
      giants.forEach(([a, b], i) => { const s = i % 3 === 2 ? art.pine(120 + i, 1.55) : art.oak(100 + i, 1.5 + (i % 3) * .12); addObj(s, a, b + 4, [a - 7, b - 1, 14, 6]) })
    }
    for (let n = 0, put = 0; n < 900 && put < 72; n++) {
      const a = 40 + rng() * (FW - 120), b = 140 + rng() * (FH - 170);
      if (!free(a, b, 10) || !farFromTrees(a, b, 20) || F.gath.some(q => Math.hypot(q.x - a, q.y - b) < 22)) continue;
      addObj(rng() < .6 ? art.oak(200 + put, .55 + rng() * .15) : art.pine(220 + put, .55 + rng() * .15), a, b + 3); put++
    }
    ACTIVE = false;
    const T = treeObjs();

    /* 2) peta bayangan (S) dan cahaya (L), bersumber dari kiri-atas */
    const S = new Float32Array(FW * FH), L = new Float32Array(FW * FH);
    const stamp = (M, cx, cy, rxx, ryy, a, skew) => {
      skew = skew || 0; const ex = rxx + Math.abs(skew) * ryy, x0 = Math.max(0, Math.floor(cx - ex)), x1 = Math.min(FW - 1, Math.ceil(cx + ex)), y0 = Math.max(0, Math.floor(cy - ryy)), y1 = Math.min(FH - 1, Math.ceil(cy + ryy));
      for (let y = y0; y <= y1; y++) { const v = (y - cy) / ryy, v2 = v * v; for (let x = x0; x <= x1; x++) { const u = (x - cx - skew * (y - cy)) / rxx, dd = u * u + v2; if (dd >= 1) continue; const val = a * Math.sqrt(1 - dd), i = y * FW + x; M[i] = 1 - (1 - M[i]) * (1 - val) } }
    };
    T.forEach(o => {
      const w = o.img.width, h = o.img.height, len = h * .5, tall = o.oy;
      stamp(S, o.x + 2, o.y - 1, 12 + w * .06, 5, .5);                                           // bayangan kontak di pangkal
      stamp(S, o.x + len * .55 + 4, o.y + 1 + len * .06, len * .62 + 9, clamp(w * .1, 6, 14), .4);      // bayangan jatuh ke kanan-bawah
      stamp(S, o.x + 3, o.y - tall * .26, w * .46, w * .2, .3)                                   // lantai di bawah tajuk (menumpuk di hutan lebat)
    });
    // tanah di kaki tebing, tepi jalan, tepi sungai & kolam: sedikit lebih gelap supaya terasa cekung
    { const [cx0, , cw] = cliffRect; for (let y = 96; y < 156; y++) for (let x = cx0 - 14; x < cx0 + cw + 14; x++) { const fx = Math.min(1, Math.min(x - (cx0 - 14), cx0 + cw + 14 - x) / 24), v = .5 * Math.pow(1 - (y - 96) / 60, 1.3) * fx; if (v > 0) { const i = y * FW + x; S[i] = 1 - (1 - S[i]) * (1 - v) } } }
    const ring = (pts, w) => { const R = w / 2 + 8; pts.forEach(([px, py], k) => { if (k % 2) return; for (let y = Math.max(0, Math.floor(py - R)); y <= Math.min(FH - 1, Math.ceil(py + R)); y++) for (let x = Math.max(0, Math.floor(px - R)); x <= Math.min(FW - 1, Math.ceil(px + R)); x++) { const dd = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py)); if (dd > w / 2 + 1 && dd < R) { const v = .26 * (1 - (dd - w / 2) / 8), i = y * FW + x; S[i] = 1 - (1 - S[i]) * (1 - v) } } }) };
    paths.forEach(P => ring(P.d, P.w));
    for (let y = 0; y < RIVER_END; y++) { const c = rx(y), hw = rhw(y); for (let k = 0; k < 11; k++) { const v = .34 * (1 - k / 11);[c - hw - 7 - k, c + hw + 7 + k].forEach(xx => { xx = Math.round(xx); if (xx >= 0 && xx < FW) { const i = y * FW + xx; S[i] = 1 - (1 - S[i]) * (1 - v) } }) } }
    ponds.forEach(P => { for (let y = Math.floor(P.y - P.ry - 18); y < P.y + P.ry + 18; y++) for (let x = Math.floor(P.x - P.rx - 18); x < P.x + P.rx + 18; x++) { const dd = ((x - P.x) / (P.rx + 8)) ** 2 + ((y - P.y) / (P.ry + 6)) ** 2; if (dd > 1 && dd < 1.6) { const v = .3 * (1 - (dd - 1) / .6), i = y * FW + x; S[i] = 1 - (1 - S[i]) * (1 - v) } } });

    // gundukan tanah: terang di kiri-atas, gelap di kanan-bawah (memberi kesan ketinggian)
    const mounds = [];
    for (let n = 0; n < 700 && mounds.length < 46; n++) {
      const a = 40 + rng() * (FW - 100), b = 150 + rng() * (FH - 190), rr = 26 + rng() * 34, i = (b | 0) * FW + (a | 0);
      if (!free(a, b, 16) || S[i] > .16 || mounds.some(q => Math.hypot(q[0] - a, q[1] - b) < 90)) continue; mounds.push([a, b, rr]);
      stamp(L, a - rr * .2, b - rr * .12, rr * .66, rr * .26, .6); stamp(S, a + rr * .28, b + rr * .2, rr * .8, rr * .24, .42)
    }
    // sinar matahari: padang bunga, kuil, perkemahan, sepanjang jalan, dan celah tajuk
    stamp(L, MEAD.x, MEAD.y, MEAD.r * 1.2, MEAD.r * .9, .55); stamp(L, SHRC.x, SHRC.y, 96, 62, .38); stamp(L, CAMPC.x, CAMPC.y, 72, 46, .26);
    paths.forEach(P => P.d.forEach(([px, py], k) => { if (k % 3 === 0) stamp(L, px, py, 16, 11, .14) })); glades.forEach(G => stamp(L, G.x, G.y, G.r * 1.1, G.r * .8, .3));
    for (let gy = 150; gy < FH - 30; gy += 38) for (let gx = 40; gx < FW - 60; gx += 38) {
      const a = gx + (rng() - .5) * 20, b = gy + (rng() - .5) * 20; let sum = 0; for (let k = 0; k < 5; k++) { const sx = Math.min(FW - 1, Math.max(0, (a + (k - 2) * 12) | 0)), sy = Math.min(FH - 1, Math.max(0, (b + ((k * 7) % 5 - 2) * 6) | 0)); sum += S[sy * FW + sx] }
      if (sum / 5 < .07 && vnoise(a / 90, b / 90, 14) > .45) stamp(L, a, b, 24 + rng() * 14, 11 + rng() * 6, .3)
    }

    /* 3) satu lintasan piksel: warnai ulang tanah dengan bayangan/cahaya, lumut, serasah, gradasi wilayah */
    {
      const id = bgc.getImageData(0, 0, FW, FH), d = id.data;
      for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
        const i = y * FW + x, o = i * 4; let r = d[o], g1 = d[o + 1], b = d[o + 2]; const grass = g1 > r + 6 && g1 > b + 6, bay = BAYER[(x & 3) + ((y & 3) << 2)] / 16, s = S[i], l = L[i];
        if (grass) {
          const tx = x / FW; if (tx < .35) { const k = (.35 - tx) * .2; r += (22 - r) * k; g1 += (66 - g1) * k; b += (84 - b) * k } else if (tx > .7) { const k = (tx - .7) * .16; r += (255 - r) * k; g1 += (214 - g1) * k; b += (112 - b) * k }
          if (s > .1) { const m = vnoise(x / 22, y / 22, 61); if (m > .6) { const k = (m - .6) * .9; r += (48 - r) * k; g1 += (98 - g1) * k; b += (52 - b) * k } }
          if (s > .26) { const h = hash(x, y, 31); if (h > .992) { r = 186; g1 = 110; b = 46 } else if (h > .958) { r += (88 - r) * .55; g1 += (62 - g1) * .55; b += (34 - b) * .55 } }
        }
        if (s > 0) { const q = s * 3.3, lv = Math.min(3, Math.floor(q) + ((q - Math.floor(q)) > bay ? 1 : 0)); if (lv) { const k = lv * .13; r += (10 - r) * k; g1 += (34 - g1) * k; b += (46 - b) * k } }
        if (l > 0) { const q = l * 2.4, lv = Math.min(2, Math.floor(q) + ((q - Math.floor(q)) > bay ? 1 : 0)); if (lv) { const k = lv * .1; r += (255 - r) * k; g1 += (238 - g1) * k; b += (150 - b) * k } }
        d[o] = r; d[o + 1] = g1; d[o + 2] = b
      }
      bgc.putImageData(id, 0, 0)
    }

    /* 4) detail tanah: akar, serasah daun, rumput lebat di area terang */
    T.forEach(o => {
      const big = o.img.width > 60;
      [-1, 1].forEach(sd => { const n = big ? 3 : 2; for (let k = 0; k < n; k++) { const L0 = 5 + ((rng() * (big ? 9 : 5)) | 0), y0 = o.y - 3 + k * 2; for (let j = 0; j < L0; j++) rc(bgc, '#1b130c', o.x + sd * (3 + j), y0 + (j * .45 | 0) - 1, 1, 3); for (let j = 0; j < L0; j++) { rc(bgc, '#5a3d24', o.x + sd * (3 + j), y0 + (j * .45 | 0), 1, 1); if (j < L0 - 2) rc(bgc, '#7a5636', o.x + sd * (3 + j), y0 + (j * .45 | 0) - 1, 1, 1) } } });
      for (let k = 0; k < (big ? 14 : 7); k++) { const an = rng() * 6.283, dd = 6 + rng() * (big ? 26 : 16); rc(bgc, ['#b8742a', '#d89a3a', '#8a5a28', '#6a4a24'][(rng() * 4) | 0], o.x + Math.cos(an) * dd, o.y + Math.sin(an) * dd * .4, 2, 1) }
    });
    for (let n = 0, put = 0; n < 8000 && put < 760 * CFG.undergrowth; n++) { const a = rng() * FW, b = rng() * FH; if (L[(b | 0) * FW + (a | 0)] > .18 && free(a, b, 2)) { art.grassTuft(bgc, a, b, rng); put++ } }

    /* 5) sprite bawah-tegakan (tertata Y, menutupi kaki pemain): pakis, rumput tinggi, jamur, ilalang */
    const FERN = [], GRASS = [], SHR = [], CAT = [];
    for (let i = 0; i < 7; i++) FERN.push(fern(500 + i)); for (let i = 0; i < 6; i++) GRASS.push(tallGrass(600 + i)); for (let i = 0; i < 3; i++) SHR.push(shroom(700 + i)); for (let i = 0; i < 4; i++) CAT.push(cattail(800 + i));
    if (CFG.undergrowth > 0) {
      const cell = new Map(), key = (a, b) => ((a / 12) | 0) + ',' + ((b / 12) | 0), okSpot = (a, b) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = cell.get(((a / 12 | 0) + i) + ',' + ((b / 12 | 0) + j)); if (l && l.some(q => Math.hypot(q[0] - a, q[1] - b) < 11)) return false } return true };
      const tgt = Math.round(2000 * CFG.undergrowth);
      for (let n = 0, put = 0; n < 16000 && put < tgt; n++) {
        const a = 24 + rng() * (FW - 48), b = 130 + rng() * (FH - 160); if (!free(a, b, 5)) continue;
        const s = S[(b | 0) * FW + (a | 0)], lit = L[(b | 0) * FW + (a | 0)]; if (!okSpot(a, b) || F.gath.some(q => Math.hypot(q.x - a, q.y - b) < 18)) continue;
        const k = rng(); let spr;
        if (s > .34) spr = k < .1 ? SHR[(rng() * 3) | 0] : k < .65 ? FERN[(rng() * 7) | 0] : GRASS[(rng() * 6) | 0];
        else if (s > .12) spr = k < .45 ? FERN[(rng() * 7) | 0] : GRASS[(rng() * 6) | 0];
        else { if (k < (lit > .15 ? .55 : .3)) spr = GRASS[(rng() * 6) | 0]; else if (k < .38) spr = FERN[(rng() * 7) | 0]; else continue }
        addObj(spr, a, b, null, { sway: spr.oy > 12 ? 1 : 0 }); (cell.get(key(a, b)) || cell.set(key(a, b), []).get(key(a, b))).push([a, b]); put++
      }
      // ilalang di tepi sungai & kolam
      for (let i = 0; i < 120; i++) { const y = 20 + rng() * (RIVER_END - 30), sd = rng() < .5 ? -1 : 1, a = rx(y) + sd * (rhw(y) + 9 + rng() * 8); if (Math.abs(a - 830) < 70 && ((y > 240 && y < 360) || (y > BR2[0] - 30 && y < BR2[1] + 30))) continue; addObj(CAT[(rng() * 4) | 0], a, y, null, { sway: 1 }) }
      [[POND, 16], [MP, 16], [LAKE, 34]].forEach(([P, n]) => { for (let i = 0; i < n; i++) { const an = rng() * 6.283, a = P.x + Math.cos(an) * (P.rx + 12 + rng() * 6), b = P.y + Math.sin(an) * (P.ry + 8 + rng() * 4); if (b > FH - 14) continue; addObj(CAT[(rng() * 4) | 0], a, b, null, { sway: 1 }) } });
    }

    /* 6) tandai objek untuk goyangan & tembus pandang, buat peta topeng cahaya bintik */
    objs.forEach(o => { const k = o.img && o.img.__k; if (k === 'oak' || k === 'pine') { o.tree = 1; o.sway = o.img.width > 60 ? 1.15 : 1 } else if (k === 'bush') o.sway = .5 });
    objs.sort((a, b) => a.y - b.y);
    { const [mc, mq] = mkCv(FW, FH), mid = mq.createImageData(FW, FH), md = mid.data; for (let i = 0; i < FW * FH; i++) { md[i * 4] = md[i * 4 + 1] = md[i * 4 + 2] = 255; md[i * 4 + 3] = Math.min(255, S[i] * 2.1 * 255) } mq.putImageData(mid, 0, 0); F._mask = mc }
  }

  /* ---------- RUNTIME: bintik cahaya di lantai hutan (di bawah objek) ---------- */
  const dap = blobTile(256, 46, 3, 9, '255,236,150', 91); pixelate(dap[1], 256, 256, 3);
  const tmp = mkCv(8, 8); let tw = 0, th = 0; const pat = tmp[1].createPattern(dap[0], 'repeat');
  const _env = F.env;
  F.env = function () {
    _env.apply(this, arguments);
    if (!F._mask || CFG.dapple <= 0) return; const k = dayK(); if (k < .05) return;
    const vw = W / CAM_Z, vh = H / CAM_Z, cx0 = Math.floor(camX), cy0 = Math.floor(camY), w = Math.ceil(vw) + 2, h = Math.ceil(vh) + 2, tc = tmp[0], tx = tmp[1];
    if (tw !== w || th !== h) { tc.width = tw = w; tc.height = th = h }
    tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalCompositeOperation = 'source-over'; tx.clearRect(0, 0, w, h);
    if (pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix().translate(Math.round(t * 5 + Math.sin(t * .4) * 6), Math.round(t * 2.4)));
    tx.translate(-cx0, -cy0); tx.fillStyle = pat; tx.fillRect(cx0, cy0, w, h); tx.setTransform(1, 0, 0, 1, 0, 0);
    tx.globalCompositeOperation = 'destination-in'; tx.drawImage(F._mask, cx0, cy0, w, h, 0, 0, w, h);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = CFG.dapple * k; g.drawImage(tc, cx0, cy0); g.restore()
  };

  /* ---------- RUNTIME: bayangan awan, kabut, vignette, daun di tepi layar (di atas objek) ---------- */
  const cld = blobTile(320, 9, 60, 110, '4,16,22', 77); pixelate(cld[1], 320, 320, 3); const cpat = tmp[1].createPattern(cld[0], 'repeat');
  const misty = (() => { const [c, q] = mkCv(120, 44), gr = q.createRadialGradient(60, 22, 0, 60, 22, 60); gr.addColorStop(0, 'rgba(210,235,245,.9)'); gr.addColorStop(1, 'rgba(210,235,245,0)'); q.save(); q.translate(0, 22); q.scale(1, .37); q.translate(0, -22); q.fillStyle = gr; q.fillRect(0, 0, 120, 60); q.restore(); return c })();
  const LEAF = [leafCluster(3), leafCluster(8), leafCluster(14)];
  const _front = F.drawFront;
  F.drawFront = function () {
    _front.apply(this, arguments);
    const vw = W / CAM_Z, vh = H / CAM_Z, k = dayK(), night = wx().night || 0;
    // bayangan awan
    if (CFG.clouds > 0 && k > .1) {
      if (cpat.setTransform && typeof DOMMatrix !== 'undefined') cpat.setTransform(new DOMMatrix().translate(Math.round(t * 7), Math.round(t * 3)));
      g.save(); g.globalAlpha = CFG.clouds * k; g.fillStyle = cpat; g.fillRect(camX, camY, vw, vh); g.restore()
    }
    // kabut tipis berlapis (melintas di depan objek => kedalaman)
    if (CFG.mist > 0) {
      g.save(); g.globalAlpha = (.07 + .06 * night) * CFG.mist;
      const RIVER_END = GEO.RIVER_END, spots = [[GEO.POND.x, GEO.POND.y, 1.5], [GEO.SHRC.x, GEO.SHRC.y + 30, 1.3], [GEO.CAMPC.x - 60, GEO.CAMPC.y + 60, 1]]; for (let y = 60; y < RIVER_END; y += 110) spots.push([GEO.rx(y), y, 1.1]); spots.push([GEO.MP.x, GEO.MP.y, 1.4], [GEO.LAKE.x - 130, GEO.LAKE.y - 20, 2], [GEO.LAKE.x + 130, GEO.LAKE.y - 12, 2]);
      spots.forEach(([mx, my, sc], i) => { const X = mx + Math.sin(t * .17 + i * 1.9) * 26 - 60 * sc, Y = my - 14 + Math.sin(t * .23 + i) * 3; if (X > camX + vw || X + 120 * sc < camX || Y > camY + vh || Y + 44 * sc < camY) return; g.drawImage(misty, Math.round(X), Math.round(Y), 120 * sc, 44 * sc) });
      g.restore()
    }
    // vignette
    if (CFG.vignette > 0) { const cx = camX + vw / 2, cy = camY + vh / 2, gr = g.createRadialGradient(cx, cy, Math.min(vw, vh) * .38, cx, cy, Math.hypot(vw, vh) * .56); gr.addColorStop(0, 'rgba(4,16,14,0)'); gr.addColorStop(1, 'rgba(4,16,14,' + (CFG.vignette * (.8 + .5 * night)) + ')'); g.save(); g.fillStyle = gr; g.fillRect(camX, camY, vw, vh); g.restore() }
    // daun besar di tepi atas layar, bergerak lebih cepat dari tanah (parallax)
    if (CFG.leaves && k > .05) {
      g.save(); g.globalAlpha = .92;
      for (let i = 0; i < 7; i++) { const base = (i * .147 + .03) * (vw + 140), sx = (((base - camX * 1.35) % (vw + 140)) + vw + 140) % (vw + 140) - 70, sy = -22 - (i % 3) * 6 + Math.sin(t * .8 + i * 1.7) * 2; g.drawImage(LEAF[i % 3], Math.round(camX + sx), Math.round(camY + sy)) }
      g.restore()
    }
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
  const FW = 1800, FH = F.h, TAU = Math.PI * 2, lightL = WORLD.lightL;   // FH mengikuti tinggi hutan (diperluas) agar serigala bisa muncul di seluruh peta
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
    attackClick: false      // klik cadangan DIMATIKAN: serangan basic & skill game kini mengenai serigala lewat daftar musuh (es). Ubah ke true bila klik biasa berhenti mengenai
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
  function dmgWolf(w, dmg, fx0, fy0, kb) {
    if (w.dead) return false;
    w.hp -= dmg; w.hit = .15;
    const a = Math.atan2(w.y - fy0, w.x - fx0); if (kb > 0) move(w, Math.cos(a) * kb, Math.sin(a) * kb, .07);
    if (w.st === 'wind' || w.st === 'lunge') { w.st = 'rec'; w.tm = .5; w.cd = 1 }
    dn(w.x, w.y - 16, '-' + dmg, 0, '#ffd34d');
    for (let i = 0; i < 5; i++) dp.push({ k: 'p', x: w.x, y: w.y - 6, vx: (Math.random() - .5) * 70, vy: -20 - Math.random() * 30, life: .35, max: .35, s: 1.5, c: '#c8ccd8' });
    if (w.hp <= 0) { w.dead = 1; w.fade = 0; dn(w.x, w.y - 22, 'Serigala tumbang', 0, '#fff') }
    return true
  }
  F.hitWolves = function (x, y, r, dmg) {
    let n = 0;
    for (const w of wolves) {
      if (w.dead || Math.hypot(w.x - x, w.y - y) > r) continue;
      n++; dmgWolf(w, dmg, p.x, p.y, 160)
    }
    return n
  };
  WORLD.hitWolves = F.hitWolves;

  /* ---------- sambungkan ke serangan & SKILL game (daftar musuh `es` + fungsi hit) ----------
     Tiap serigala hidup dibuatkan "musuh bayangan" (k:'dummy', tidak punya AI/gambar) di `es`,
     sehingga semua skill/ultimate/basic attack yang memindai `es` ikut mengenai serigala.
     Fungsi hit() dicegat: bila targetnya bayangan serigala, damage diteruskan ke serigala asli. */
  const prox = new Map();
  function clearProx() {
    if (typeof es !== 'undefined' && prox.size) { const set = new Set(prox.values()); es = es.filter(x => !set.has(x)) }
    prox.clear()
  }
  function syncProx() {
    if (typeof es === 'undefined' || typeof mkDummy !== 'function') return;
    for (const [w, e] of prox) if (!wolves.includes(w) || w.dead || w.st === 'flee' || !es.includes(e)) { es = es.filter(x => x !== e); prox.delete(w) }
    for (const w of wolves) {
      if (w.dead || w.st === 'flee') continue;
      let e = prox.get(w);
      if (!e) { e = mkDummy(w.x); e.wolf = w; e.sw = 0; e.r = 12; prox.set(w, e); es.push(e) }
      e.x = w.x; e.y = w.y; e.hp = w.hp; e.mhp = w.mhp
    }
  }
  if (typeof hit === 'function') {
    const _hit = hit;
    hit = function (e, d, sx, sy, kb) {
      if (!(e && e.wolf)) return _hit.apply(this, arguments);
      const w = e.wolf; if (w.dead || !wolves.includes(w)) return;
      const c = Math.random() < .15; d = Math.max(1, Math.round(d * (c ? 2 : 1)));
      try { ultGain(Math.min(d, Math.max(0, w.hp))); SFX.hit(c) } catch (_) { }
      try { shake = Math.max(shake, c ? 5 : 2.5); HST = Math.max(HST, c ? .05 : .02) } catch (_) { }
      dmgWolf(w, d, sx, sy, Math.min((kb == null ? 70 : kb) * 2.3, 400));
      try { if (wi == 0 || wi == 4) cutMark(e); else if (wi == 1) spearMark(e); else if (wi == 2) arrowMark(e) } catch (_) { }
    };
  }
  if (typeof drawDummy === 'function') { const _dd = drawDummy; drawDummy = function (e) { if (e && e.wolf) return; return _dd.apply(this, arguments) } }
  if (typeof WORLD.start === 'function' && !WORLD.start.__wolfProx) {   // bersihkan bayangan saat pindah area
    const _st = WORLD.start; WORLD.start = function () { clearProx(); return _st.apply(this, arguments) }; WORLD.start.__wolfProx = 1
  }
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
    clearProx(); wolves.length = 0; F.dyn = F.dyn.filter(o => !o.w); S.rolled = false; S.queue = 0; S.pInv = 0; S.sh = night() > .45 ? 1 : 0; S.rip.length = 0;
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
    syncProx();
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