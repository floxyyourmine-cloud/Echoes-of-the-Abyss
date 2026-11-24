/* ==========================================================================
   ECHOES OF THE ABYSS - LANTERN VALLEY VILLAGE MODULE
   Village map, market, inn, forge, NPCs, dynamic weather & day/night cycle,
   and Ancient Plaza portal teleport to Lobby.
   ========================================================================== */
/* =====================================================================
   TAMBAHAN: DESA LEMBAH LENTERA + TOKO
   ---------------------------------------------------------------------
   Ditambahkan di akhir file tanpa mengubah kode game sebelumnya.
   - Gerbang timur Hutan Bisikan kini terbuka menuju Desa Lembah Lentera.
   - Desa: pasar, penginapan, bengkel, NPC. Toko: beli, jual, upgrade.
   ===================================================================== */
/* ===== DESA LEMBAH LENTERA ===== */
(function () {
  'use strict';
  const { TAU, clamp, lerp, mkRng, mkCv, rc, disc, ell, hash, vnoise, h2r, mixc, dense, distPoly, person, art, lightL, S: W_ } = WORLD;
  const VW = 1800, VH = 940, OLC = '#14100c';
  const V = WORLD.AREAS.village = { name: 'DESA LEMBAH LENTERA', sub: 'Lanternvale Village', w: VW, h: VH, spawn: [96, 384], ready: 0, objs: [], dyn: [], npcs: [], walls: [], bg: null, _L: [] };
  const MAINST = [[0, 380], [200, 380], [420, 380], [640, 380], [900, 380], [1100, 380], [1320, 380], [1520, 380], [1800, 380]];
  const NS = [[640, 90], [640, 250], [640, 380], [640, 520], [640, 740], [640, 842]];
  const SIDE = [[[330, 380], [330, 268]], [[930, 380], [930, 282]], [[640, 520], [800, 520], [800, 600]], [[200, 380], [200, 470]], [[420, 380], [380, 560], [312, 606]], [[1100, 380], [1100, 470]],
  [[150, 224], [150, 380]], [[1040, 254], [1040, 380]], [[1180, 254], [1180, 380]], [[280, 526], [280, 548], [376, 548]], [[460, 604], [460, 642]]];
  const PLAZA = { x: 640, y: 380, r: 86 };
  const PZ = V.PZ = { x: 482, y: 694, rx: 128, ry: 46 };   // PLAZA PORTAL: lahan lapang khusus teleport (selatan-tengah desa)

  const NEWH = [
    [1330, 268, 92, 'm'], [1500, 260, 86, 'm'], [1650, 268, 96, 'm'],
    [500, 190, 88, 'n'], [790, 190, 92, 'n'],
    [1500, 576, 90, 'e'], [1640, 576, 86, 'e'],
    [150, 822, 84, 's'], [320, 822, 96, 's'], [490, 822, 80, 's'], [790, 822, 100, 's'], [950, 822, 88, 's'], [1110, 822, 92, 's'], [1250, 822, 84, 's'], [1420, 822, 90, 's'], [1580, 822, 84, 's']
  ];
  const LANE = [
    [[90, 852], [1700, 852]],
    [[1410, 380], [1410, 608], [1700, 608]],
    [[1700, 608], [1700, 852]]
  ];
  NEWH.forEach(([a, b, w, ln]) => SIDE.push(ln === 'm' ? [[a, 380], [a, b + 4]] : ln === 'n' ? [[640, 252], [a, 254], [a, b + 4]] : ln === 'e' ? [[a, 608], [a, b + 4]] : [[a, 852], [a, b + 4]]));
  /* tikungan jalan dibulatkan (fillet kuadratik) supaya belokan halus, bukan siku-siku tajam */
  const fillet = (pts, rmax) => {
    if (pts.length < 3) return pts;
    const out = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1], l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), r = Math.min(rmax, l1 * .45, l2 * .45);
      const a = [p1[0] + (p0[0] - p1[0]) * r / l1, p1[1] + (p0[1] - p1[1]) * r / l1], b = [p1[0] + (p2[0] - p1[0]) * r / l2, p1[1] + (p2[1] - p1[1]) * r / l2];
      for (let k = 0; k <= 10; k++) { const u = k / 10, w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u; out.push([a[0] * w0 + p1[0] * w1 + b[0] * w2, a[1] * w0 + p1[1] * w1 + b[1] * w2]) }
    }
    out.push(pts[pts.length - 1]); return out;
  };
  const MAINd = dense(MAINST, 4), NSd = dense(NS, 4), SIDEd = SIDE.map(s => dense(fillet(s, 56), 4)), LANEd = LANE.map(s => dense(fillet(s, 40), 4));
  const BLD = [];
  const POND = { x: 210, y: 650, rx: 96, ry: 44 }, POND2 = { x: 1580, y: 690, rx: 78, ry: 30 };

  function houseOld(w, o) {
    const rh = 40, wh = 34, H = rh + wh + 6, Wd = w + 10, [c, x] = mkCv(Wd, H), cx = Wd / 2;
    const roof = h2r(o.roof), roofL = mixc(roof, [255, 220, 170], .22), roofD = mixc(roof, [20, 10, 20], .35);

    const wy = rh - 2; rc(x, OLC, 4, wy, Wd - 8, wh + 2); rc(x, o.wall, 5, wy + 1, Wd - 10, wh); rc(x, 'rgba(255,255,255,.1)', 5, wy + 1, Wd - 10, 3); rc(x, 'rgba(0,0,0,.14)', Wd - 12, wy + 1, 7, wh);
    for (let i = 0; i < 4; i++) { const px = 5 + i * (Wd - 13) / 3; rc(x, o.trim, px, wy + 1, 3, wh); }
    rc(x, o.trim, 5, wy + 1, Wd - 10, 3); rc(x, o.trim, 5, wy + 14, Wd - 10, 2);
    rc(x, '#6a6660', 5, wy + wh - 4, Wd - 10, 5); rc(x, '#8a867c', 5, wy + wh - 4, Wd - 10, 1); for (let i = 0; i < Wd - 10; i += 7) rc(x, '#55524a', 7 + i, wy + wh - 3, 1, 3);

    for (let j = 0; j < rh; j++) { const wj = Math.round(w * .34 + (Wd - 2 - w * .34) * (j / rh)); rc(x, OLC, cx - wj / 2 - 1, j, wj + 2, 1) }
    for (let j = 0; j < rh; j++) {
      const wj = Math.round(w * .34 + (Wd - 2 - w * .34) * (j / rh)), x0 = cx - wj / 2, band = Math.floor(j / 5);
      rc(x, o.roof, x0, j, wj, 1); rc(x, rgbS(roofL), x0, j, wj / 2, 1); rc(x, rgbS(roofD), cx, j, wj / 2, 1);
      if (j % 5 === 4) { rc(x, rgbS(roofD), x0, j, wj, 1) } else if (j % 5 === 0) { rc(x, 'rgba(255,255,255,.1)', x0, j, wj, 1) }
      for (let k = (band % 2) * 4; k < wj; k += 8) rc(x, rgbS(roofD), x0 + k, j, 1, 4)
    }
    rc(x, OLC, cx - 2, 0, 4, 2); rc(x, rgbS(roofL), cx - 1, 0, 2, 1); rc(x, 'rgba(0,0,0,.35)', 4, rh - 1, Wd - 8, 3);
    if (o.chimney) { const cxp = cx + w * .22; rc(x, OLC, cxp - 1, 6, 9, 16); rc(x, '#8a6a58', cxp, 7, 7, 14); rc(x, '#a8887a', cxp, 7, 3, 14); rc(x, '#4a3a30', cxp - 1, 6, 9, 2) }

    const win = (a, b) => { rc(x, OLC, a - 1, b - 1, 12, 12); rc(x, '#6a4a2c', a, b, 10, 10); rc(x, '#ffd870', a + 1, b + 1, 8, 8); rc(x, '#fff3b8', a + 1, b + 1, 3, 3); rc(x, '#6a4a2c', a + 4, b + 1, 1, 8); rc(x, '#6a4a2c', a + 1, b + 4, 8, 1); rc(x, '#8a6440', a - 2, b + 10, 14, 2) };
    const dx = o.dx != null ? o.dx : cx, lamp = [];
    rc(x, OLC, dx - 7, wy + wh - 22, 15, 22); rc(x, '#5a3418', dx - 6, wy + wh - 21, 13, 21); rc(x, '#7a4a28', dx - 6, wy + wh - 21, 4, 21); rc(x, '#3a200e', dx + 3, wy + wh - 21, 3, 21); rc(x, '#3a200e', dx - 6, wy + wh - 12, 13, 1); rc(x, '#d8b84a', dx + 3, wy + wh - 11, 2, 2); rc(x, OLC, dx - 8, wy + wh - 24, 17, 3); rc(x, o.trim, dx - 7, wy + wh - 23, 15, 2);
    const wins = o.wins || [-1, 1]; wins.forEach(s => { if (s === 0) return; const a = dx + s * (w * .3) - 5; win(a | 0, wy + 10); lamp.push([a + 5, wy + 15]) });

    if (o.sign) {
      const sx = o.sx != null ? o.sx : Wd - 14, sy = wy + 6; rc(x, OLC, sx - 1, sy - 4, 2, 14); rc(x, '#5a4630', sx, sy - 4, 1, 13); rc(x, OLC, sx - 10, sy + 4, 14, 12); rc(x, '#8a6440', sx - 9, sy + 5, 12, 10); rc(x, '#b8905a', sx - 9, sy + 5, 12, 1);
      const ic = { inn: [['#e8d8a0', 2, 4, 6, 5], ['#c8a040', 2, 3, 6, 2], ['#e8d8a0', 8, 5, 2, 3]], smith: [['#4a4a54', 1, 4, 9, 3], ['#6a6a78', 3, 7, 5, 3], ['#8a8a98', 1, 4, 9, 1]], potion: [['#5ad06a', 3, 6, 5, 5], ['#c8ccd6', 4, 3, 3, 3], ['#bfffc8', 4, 7, 1, 2]], store: [['#e0485b', 2, 5, 8, 5], ['#ffd34d', 3, 3, 6, 2]] }[o.sign]; ic.forEach(([col, a, b, ww, hh]) => rc(x, col, sx - 9 + a, sy + 5 + b - 3, ww, hh))
    }
    return { img: c, ox: cx, oy: H - 1, w: Wd, lamp: lamp.map(l => [l[0] - cx, l[1] - H + 1]), chim: o.chimney ? [cx + w * .22 + 3 - cx, 4 - H] : null };
  }
  const rgbS = a => 'rgb(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ')';
  function house(w, o) { try { return fHouse(w, o) } catch (e) { return houseOld(w, o) } }
  WORLD.mkHouse = house;   // dipakai area Kerajaan

  /* ===== RUMAH FEODAL-FANTASI: half-timbered, lantai bertingkat, atap curam, bendera ===== */
  function fHouse(w, o) {
    const fl = o.fl || (w >= 92 ? 2 : 1), wh = 24 * fl + 9, rh = Math.round(w * .5) + 14, pt = 18, Wd = w + 10, H = pt + rh + wh + 6, [c, x] = mkCv(Wd, H), cx = Wd / 2;
    x.translate(0, pt);
    const BM = '#4a2e1a', roof = h2r(o.roof), roofL = mixc(roof, [255, 220, 170], .22), roofD = mixc(roof, [20, 10, 20], .35), wy = rh - 2, base = wy + wh - 9, lamps = [];
    for (let i = fl - 1; i >= 0; i--) {
      const y0 = wy + i * 24, hh = i === fl - 1 ? 33 : 24, up = fl > 1 && i === 0, x0 = up ? 2 : 5, ww = Wd - 2 * x0, ph = hh - (i === fl - 1 ? 9 : 0);
      rc(x, OLC, x0 - 1, y0, ww + 2, hh + 1); rc(x, o.wall, x0, y0 + 1, ww, hh); rc(x, 'rgba(255,255,255,.1)', x0, y0 + 1, ww, 2); rc(x, 'rgba(0,0,0,.13)', x0 + ww - 7, y0 + 1, 7, hh);
      const n = Math.max(2, Math.round(ww / 24)), pw = (ww - 3) / n;
      for (let k = 0; k <= n; k++) rc(x, BM, x0 + k * pw, y0 + 1, 3, ph);
      rc(x, BM, x0, y0 + 1, ww, 3); rc(x, BM, x0, y0 + ph - 1, ww, 3);
      for (let k = 0; k < n; k++) for (let t = 0; t < ph - 6; t++) rc(x, BM, x0 + k * pw + 3 + (k % 2 ? (ph - 7 - t) : t) * (pw - 5) / (ph - 6), y0 + 4 + t, 2, 1);
      if (up) rc(x, 'rgba(0,0,0,.3)', x0, y0 + hh + 1, ww, 3)
    }
    rc(x, OLC, 4, base - 1, Wd - 8, 11); rc(x, '#7e7a70', 5, base, Wd - 10, 9); rc(x, '#a29e92', 5, base, Wd - 10, 1); rc(x, '#5e5a50', 5, base + 4, Wd - 10, 1);
    for (let k = 0; k < Wd - 10; k += 8) { rc(x, '#5e5a50', 7 + k, base + 1, 1, 3); rc(x, '#5e5a50', 11 + k, base + 5, 1, 4) }
    rc(x, 'rgba(0,0,0,.28)', 4, wy + wh, Wd - 8, 4);
    const sh = o.shut || '#3a5a7a', win = (a, b) => { rc(x, OLC, a - 1, b - 1, 12, 13); rc(x, '#3a2410', a, b, 10, 11); rc(x, '#ffd870', a + 1, b + 1, 8, 9); rc(x, '#fff3b8', a + 1, b + 1, 3, 3); rc(x, BM, a + 4, b + 1, 1, 9); rc(x, BM, a + 1, b + 4, 8, 1); rc(x, sh, a - 4, b, 3, 11); rc(x, sh, a + 11, b, 3, 11); rc(x, '#6a4a2c', a - 2, b + 11, 14, 2); rc(x, '#c8483a', a - 1, b + 12, 3, 2); rc(x, '#e8b0c0', a + 4, b + 12, 2, 1); rc(x, '#7ab84a', a + 8, b + 12, 2, 1) };
    const dx = o.dx != null ? o.dx : cx, wins = o.wins || [-1, 1], db = wy + wh;
    for (let i = 0; i < fl; i++) { const yy = wy + i * 24 + 7; (i === fl - 1 ? wins : [-1, 0, 1]).forEach(s => { if (s === 0 && i === fl - 1) return; const a = (dx + s * w * .3 - 5) | 0; win(a, yy); lamps.push([a + 5, yy + 9]) }) }
    rc(x, OLC, dx - 8, db - 25, 17, 25); rc(x, '#5a3418', dx - 7, db - 24, 15, 24); rc(x, '#7a4a28', dx - 7, db - 24, 5, 24); rc(x, '#3a200e', dx + 3, db - 24, 4, 24); rc(x, '#2a2a30', dx - 7, db - 17, 15, 1); rc(x, '#2a2a30', dx - 7, db - 9, 15, 1); rc(x, '#d8b84a', dx + 3, db - 12, 2, 2); rc(x, '#7a766c', dx - 10, db - 28, 21, 4); rc(x, '#a29e92', dx - 10, db - 28, 21, 1); rc(x, '#8a867c', dx - 10, db - 1, 21, 3);
    lamps.push([dx + 12, db - 20]);
    const thatch = !!o.thatch, rc0 = thatch ? '#c9a85a' : o.roof, rL = thatch ? '#e0c478' : rgbS(roofL), rD = thatch ? '#a8863a' : rgbS(roofD);
    for (let j = 0; j < rh; j++) { const wj = Math.round(w * .1 + (Wd - w * .1) * (j / rh)); rc(x, OLC, cx - wj / 2 - 1, j, wj + 2, 1) }
    for (let j = 0; j < rh; j++) {
      const wj = Math.round(w * .1 + (Wd - w * .1) * (j / rh)), x0 = cx - wj / 2, band = Math.floor(j / 5);
      rc(x, rc0, x0, j, wj, 1); rc(x, rL, x0, j, wj / 2, 1); rc(x, rD, cx, j, wj / 2, 1);
      if (thatch) { for (let k = (j % 3); k < wj; k += 3) rc(x, rD, x0 + k, j, 1, 2) } else { if (j % 5 === 4) rc(x, rD, x0, j, wj, 1); else if (j % 5 === 0) rc(x, 'rgba(255,255,255,.1)', x0, j, wj, 1); for (let k = (band % 2) * 4; k < wj; k += 8) rc(x, rD, x0 + k, j, 1, 4) }
    }
    if (thatch) for (let k = 2; k < Wd - 2; k += 3) rc(x, '#8a6a2a', k, rh - 1, 2, 2 + (k % 2));
    rc(x, 'rgba(0,0,0,.35)', 4, rh, Wd - 8, 3); rc(x, OLC, cx - 2, 0, 4, 2);
    if (w >= 84) { const dy = Math.round(rh * .52); rc(x, OLC, cx - 8, dy, 17, 14); rc(x, o.wall, cx - 7, dy + 1, 15, 13); rc(x, '#ffd870', cx - 4, dy + 3, 9, 8); rc(x, BM, cx, dy + 3, 1, 8); rc(x, BM, cx - 7, dy + 1, 15, 2); for (let j = 0; j < 8; j++) { rc(x, OLC, cx - j - 2, dy - 8 + j, 2 * j + 5, 1); rc(x, rc0, cx - j - 1, dy - 8 + j, 2 * j + 3, 1) } lamps.push([cx, dy + 7]) }
    let chim = null;
    if (o.chimney) { const cxp = (cx + w * .27) | 0, chh = Math.round(rh * .62); rc(x, OLC, cxp - 1, 3, 10, chh); rc(x, '#8a8478', cxp, 4, 8, chh - 2); rc(x, '#aaa498', cxp, 4, 3, chh - 2); rc(x, '#5e5a50', cxp, 12, 8, 1); rc(x, '#4a4640', cxp - 1, 3, 10, 3); chim = [cxp + 4 - cx, pt + 3 - H] }
    if (o.flag) { rc(x, OLC, cx - 1, -16, 3, 17); rc(x, '#5a4630', cx, -16, 1, 17); rc(x, OLC, cx + 1, -16, 11, 8); rc(x, o.flag, cx + 2, -15, 9, 6); rc(x, 'rgba(255,255,255,.3)', cx + 2, -15, 9, 1) }
    if (o.sign) { const sx = o.sx != null ? o.sx : Wd - 14, sy = wy + 6; rc(x, OLC, sx - 1, sy - 4, 2, 14); rc(x, '#5a4630', sx, sy - 4, 1, 13); rc(x, OLC, sx - 10, sy + 4, 14, 12); rc(x, '#8a6440', sx - 9, sy + 5, 12, 10); rc(x, '#b8905a', sx - 9, sy + 5, 12, 1); const ic = { inn: [['#e8d8a0', 2, 4, 6, 5], ['#c8a040', 2, 3, 6, 2], ['#e8d8a0', 8, 5, 2, 3]], smith: [['#4a4a54', 1, 4, 9, 3], ['#6a6a78', 3, 7, 5, 3], ['#8a8a98', 1, 4, 9, 1]], potion: [['#5ad06a', 3, 6, 5, 5], ['#c8ccd6', 4, 3, 3, 3], ['#bfffc8', 4, 7, 1, 2]], store: [['#e0485b', 2, 5, 8, 5], ['#ffd34d', 3, 3, 6, 2]] }[o.sign]; ic.forEach(([col, a, b, ww, hh]) => rc(x, col, sx - 9 + a, sy + 5 + b - 3, ww, hh)) }
    return { img: c, ox: cx, oy: H - 1, w: Wd, lamp: lamps.map(l => [l[0] - cx, l[1] + pt - H + 1]), chim };
  }
  /* menara batu beratap kerucut (menara penyihir / pos jaga) */
  function fTower(col, flag) {
    const W = 46, H = 132, [c, x] = mkCv(W, H), cx = 23, rf = h2r(col), rL = rgbS(mixc(rf, [255, 220, 170], .25)), rD = rgbS(mixc(rf, [20, 10, 20], .35));
    x.translate(0, 14); rc(x, 'rgba(0,0,0,.3)', 2, 112, 42, 5);
    rc(x, OLC, 5, 50, 36, 67); rc(x, '#9a968a', 6, 51, 34, 65); rc(x, 'rgba(255,255,255,.14)', 6, 51, 7, 65); rc(x, 'rgba(0,0,0,.22)', 28, 51, 12, 65);
    for (let j = 0; j < 10; j++) { rc(x, '#6e6a60', 6, 54 + j * 6, 34, 1); for (let k = (j % 2) * 5; k < 34; k += 10) rc(x, '#6e6a60', 6 + k, 54 + j * 6, 1, 6) }
    rc(x, OLC, 3, 44, 40, 7); rc(x, '#7a766c', 4, 45, 38, 5); for (let k = 0; k < 38; k += 8) rc(x, '#5e5a50', 5 + k, 50, 3, 2);
    for (let j = 0; j < 42; j++) { const wd = Math.round(2 + j * .95); rc(x, OLC, cx - wd / 2 - 1, 3 + j, wd + 2, 1) }
    for (let j = 0; j < 42; j++) { const wd = Math.round(2 + j * .95), x0 = cx - wd / 2; rc(x, col, x0, 3 + j, wd, 1); rc(x, rL, x0, 3 + j, wd / 2, 1); rc(x, rD, cx, 3 + j, wd / 2, 1); if (j % 5 === 4) rc(x, rD, x0, 3 + j, wd, 1) }
    rc(x, 'rgba(0,0,0,.3)', 4, 44, 38, 2);
    rc(x, OLC, cx - 1, -12, 3, 16); rc(x, '#5a4630', cx, -12, 1, 16); rc(x, OLC, cx + 1, -12, 11, 8); rc(x, flag, cx + 2, -11, 9, 6);
    [[64], [84]].forEach(([b]) => { rc(x, OLC, 20, b - 1, 6, 12); rc(x, '#ffd870', 21, b, 4, 10); rc(x, '#fff3b8', 21, b, 1, 4) });
    rc(x, OLC, 17, 96, 12, 21); rc(x, '#5a3418', 18, 97, 10, 20); rc(x, '#7a766c', 16, 95, 14, 2); rc(x, '#d8b84a', 25, 108, 2, 2);
    return { img: c, ox: cx, oy: H - 2, lamp: [[0, -48], [0, -28]] };
  }
  function stall(c1, c2, goods) {
    const [c, x] = mkCv(64, 64), cx = 32; rc(x, 'rgba(0,0,0,.3)', 4, 59, 56, 4);
    rc(x, OLC, 6, 14, 4, 46); rc(x, '#6a4a2c', 7, 14, 2, 45); rc(x, OLC, 54, 14, 4, 46); rc(x, '#6a4a2c', 55, 14, 2, 45);

    for (let j = 0; j < 16; j++) { const inset = Math.round((16 - j) * .35); rc(x, OLC, 2 + inset, j + 1, 60 - inset * 2, 1) }
    for (let j = 0; j < 16; j++) { const inset = Math.round((16 - j) * .35); for (let i = 0; i < 10; i++) rc(x, i % 2 ? c2 : c1, 3 + inset + i * (58 - inset * 2) / 10, j + 1, (58 - inset * 2) / 10 + .5, 1); rc(x, 'rgba(255,255,255,.14)', 3 + inset, j + 1, 58 - inset * 2, 1) }
    for (let i = 0; i < 10; i++) { const a = 3 + i * 5.8; rc(x, OLC, a, 17, 6, 3); rc(x, i % 2 ? c2 : c1, a + .5, 17, 5, 2) } rc(x, 'rgba(0,0,0,.3)', 3, 20, 58, 3);

    rc(x, OLC, 3, 42, 58, 19); rc(x, '#8a5a30', 4, 43, 56, 17); rc(x, '#b8824a', 4, 43, 56, 3); rc(x, '#5a3a1c', 4, 54, 56, 6); for (let i = 0; i < 6; i++) rc(x, '#6a4020', 8 + i * 9, 47, 1, 7);
    goods(x); return { img: c, ox: cx, oy: 62 };
  }
  const potions = x => { [['#e0485b', 10], ['#5ad06a', 17], ['#5aa0ff', 24], ['#b48cff', 31], ['#ffd34d', 38], ['#e0485b', 45]].forEach(([col, a], i) => { rc(x, OLC, a, 33 + (i % 2), 6, 10); rc(x, col, a + 1, 35 + (i % 2), 4, 7); rc(x, '#fff', a + 1, 36 + (i % 2), 1, 2); rc(x, '#c8ccd6', a + 2, 31 + (i % 2), 2, 3) }) };
  const wares = x => { rc(x, OLC, 8, 32, 14, 11); rc(x, '#a8743c', 9, 33, 12, 9); rc(x, '#6a4020', 9, 37, 12, 1); rc(x, OLC, 26, 34, 12, 9); rc(x, '#c9a95a', 27, 35, 10, 7); rc(x, '#e6cc7a', 27, 35, 10, 2); rc(x, OLC, 42, 33, 14, 10);[[44, '#e04b3a'], [49, '#e8a030'], [53, '#7ab840']].forEach(([a, col]) => { rc(x, col, a, 35, 4, 4); rc(x, 'rgba(255,255,255,.4)', a, 35, 1, 1) }); rc(x, '#6a4020', 42, 39, 14, 4) };

  V.build = function () {
    const rng = mkRng(777), [bg, x] = mkCv(VW, VH); V.bg = bg;
    const id = x.createImageData(VW, VH), d = id.data, GD = h2r('#4a7a34'), GL = h2r('#7aa848'), GW = h2r('#9aa040'), GLUSH = h2r('#2f6a30'), GEDGE = h2r('#1f4a2a');
    for (let yy = 0; yy < VH; yy++) for (let xx = 0; xx < VW; xx++) { const v = vnoise(xx / 70, yy / 70, 4) * .6 + vnoise(xx / 14, yy / 14, 5) * .4, wm = vnoise(xx / 160, yy / 160, 6), sp = hash(xx, yy, 10); let c = mixc(GD, GL, v); c = mixc(c, GW, wm * .25); const lu = vnoise(xx / 240, yy / 240, 9); if (lu > .58) c = mixc(c, GLUSH, Math.min(.5, (lu - .58) * 1.6)); const ed = Math.min(xx, VW - xx, yy, VH - yy); if (ed < 120) c = mixc(c, GEDGE, (1 - ed / 120) * .42); if (sp < .05) c = mixc(c, [10, 40, 20], .28); else if (sp > .965) c = mixc(c, [230, 240, 150], .2); const o = (yy * VW + xx) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255 }
    x.putImageData(id, 0, 0);
    for (let i = 0; i < 2700; i++) art.grassTuft(x, rng() * VW, rng() * VH, rng);
    const fc = ['#ffffff', '#ffd34d', '#ff9ac0', '#b48cff', '#7ab8ff'];
    for (let i = 0; i < 360; i++) art.flower(x, rng() * VW, rng() * VH, fc[(rng() * 5) | 0]);

    ell(x, '#6a5a3a', POND.x, POND.y, POND.rx + 8, POND.ry + 6); ell(x, '#a8946a', POND.x, POND.y, POND.rx + 4, POND.ry + 3); ell(x, '#2a6a8a', POND.x, POND.y, POND.rx, POND.ry); ell(x, '#3a8ab0', POND.x, POND.y, POND.rx - 4, POND.ry - 3); ell(x, '#4aa4cc', POND.x - 6, POND.y - 3, POND.rx - 24, POND.ry - 14); ell(x, '#6ac0e0', POND.x - 14, POND.y - 6, POND.rx - 52, POND.ry - 26);
    for (let i = 0; i < 5; i++) { const a = POND.x + (rng() - .5) * 120, b = POND.y + (rng() - .5) * 50; ell(x, '#2f7a3a', a, b, 6, 3); ell(x, '#4aa04a', a - 1, b - 1, 4, 2) }

    ell(x, '#6a5a3a', POND2.x, POND2.y, POND2.rx + 8, POND2.ry + 6); ell(x, '#a8946a', POND2.x, POND2.y, POND2.rx + 4, POND2.ry + 3); ell(x, '#2a6a8a', POND2.x, POND2.y, POND2.rx, POND2.ry); ell(x, '#3a8ab0', POND2.x, POND2.y, POND2.rx - 4, POND2.ry - 3); ell(x, '#4aa4cc', POND2.x - 6, POND2.y - 3, POND2.rx - 24, POND2.ry - 11); ell(x, '#6ac0e0', POND2.x - 14, POND2.y - 5, POND2.rx - 52, POND2.ry - 19);
    for (let i = 0; i < 6; i++) { const a = POND2.x + (rng() - .5) * 120, b = POND2.y + (rng() - .5) * 40; ell(x, '#2f7a3a', a, b, 6, 3); ell(x, '#4aa04a', a - 1, b - 1, 4, 2) }

    const FARM = { x: 990, y: 470, w: 300, h: 250 }; rc(x, '#4a3020', FARM.x - 2, FARM.y - 2, FARM.w + 4, FARM.h + 4); rc(x, '#6a4a2c', FARM.x, FARM.y, FARM.w, FARM.h);
    for (let r = 0; r < 10; r++) { const yy = FARM.y + 12 + r * 23; rc(x, '#4a301a', FARM.x + 6, yy + 12, FARM.w - 12, 4); rc(x, '#7a5836', FARM.x + 6, yy + 2, FARM.w - 12, 8); for (let i = 0; i < 22; i++) { const a = FARM.x + 12 + i * 13; if (r < 4) { rc(x, '#3a8a34', a, yy - 3, 4, 8); rc(x, '#58b04a', a + 1, yy - 4, 2, 6); rc(x, '#8ad070', a + 1, yy - 4, 1, 2) } else if (r < 7) { rc(x, '#c9a02a', a + 1, yy - 6, 2, 11); rc(x, '#e8c850', a, yy - 8, 4, 4); rc(x, '#a8841a', a + 3, yy - 2, 1, 5) } else { rc(x, '#2a7a2a', a - 1, yy - 2, 7, 6); rc(x, '#4aa83a', a, yy - 3, 5, 4); rc(x, '#8ad070', a + 1, yy - 3, 2, 1) } } }

    /* ===== JALAN v2: semua jalan digabung dalam satu mask -> persimpangan mulus, batu tersusun rapi (grid dunia),
       trotoar/curb bercahaya, bahu jalan tanah, lumut halus. Dilukis sekali di akhir (lihat paintRoads). ===== */
    const STUBS = [];
    const paintRoads = () => {
      const roads = [...SIDEd.map(d => [d, 22, 1]), ...LANEd.map(d => [d, 30, 2]), [NSd, 44, 2], [MAINd, 46, 2],
      [dense([[626, 694], [592, 694]], 4), 34, 2], [[[312, 606]], 36, 1], ...STUBS.map(d => [d, 18, 1])];
      const N = VW * VH, cls = new Uint8Array(N);
      const stamp = (a, b, r, k) => {
        const r2 = r * r, ya = Math.max(0, Math.floor(b - r)), yb = Math.min(VH - 1, Math.ceil(b + r)), xa = Math.max(0, Math.floor(a - r)), xb = Math.min(VW - 1, Math.ceil(a + r));
        for (let yy = ya; yy <= yb; yy++) for (let xx = xa; xx <= xb; xx++) { const dx = xx - a, dy = yy - b; if (dx * dx + dy * dy <= r2) { const o = yy * VW + xx; if (cls[o] < k) cls[o] = k } }
      };
      roads.forEach(([dn, w, k]) => dn.forEach(([a, b]) => stamp(a, b, w / 2 + .5, k)));
      const PX = PLAZA.x, PY = PLAZA.y, PR = PLAZA.r, PRY = PR * .7;
      for (let yy = Math.floor(PY - PRY) - 1; yy <= PY + PRY + 1; yy++) for (let xx = Math.floor(PX - PR) - 1; xx <= PX + PR + 1; xx++) if (((xx - PX) / PR) ** 2 + ((yy - PY) / PRY) ** 2 <= 1) cls[yy * VW + xx] = 3;
      /* jarak ke tepi terdekat (chamfer 3-4): dalam jalan = tebal trotoar, di luar = lebar bahu jalan */
      const D = new Uint16Array(N), INF = 60000;
      for (let yy = 0; yy < VH; yy++) for (let xx = 0; xx < VW; xx++) {
        const o = yy * VW + xx, v = cls[o] > 0;
        D[o] = ((xx > 0 && (cls[o - 1] > 0) !== v) || (xx < VW - 1 && (cls[o + 1] > 0) !== v) || (yy > 0 && (cls[o - VW] > 0) !== v) || (yy < VH - 1 && (cls[o + VW] > 0) !== v)) ? 3 : INF;
      }
      for (let yy = 0; yy < VH; yy++) for (let xx = 0; xx < VW; xx++) {
        const o = yy * VW + xx; let d = D[o];
        if (xx > 0) d = Math.min(d, D[o - 1] + 3);
        if (yy > 0) { d = Math.min(d, D[o - VW] + 3); if (xx > 0) d = Math.min(d, D[o - VW - 1] + 4); if (xx < VW - 1) d = Math.min(d, D[o - VW + 1] + 4) }
        D[o] = Math.min(d, INF);
      }
      for (let yy = VH - 1; yy >= 0; yy--) for (let xx = VW - 1; xx >= 0; xx--) {
        const o = yy * VW + xx; let d = D[o];
        if (xx < VW - 1) d = Math.min(d, D[o + 1] + 3);
        if (yy < VH - 1) { d = Math.min(d, D[o + VW] + 3); if (xx < VW - 1) d = Math.min(d, D[o + VW + 1] + 4); if (xx > 0) d = Math.min(d, D[o + VW - 1] + 4) }
        D[o] = Math.min(d, INF);
      }
      const img = x.getImageData(0, 0, VW, VH), d = img.data, H = c => h2r(c);
      const PAL = {
        1: { st: ['#b29c74', '#a38d66', '#bda985', '#96815c'].map(H), mo: H('#6f6046'), cu: H('#cdbb92'), gw: 7, gh: 4 },
        2: { st: ['#9d978b', '#8f8a7f', '#aaa496', '#858074'].map(H), mo: H('#625d54'), cu: H('#bdb7a8'), gw: 9, gh: 5 },
        3: { st: ['#b9b3a3', '#aea898', '#c4bdac', '#a39d8e'].map(H), mo: H('#6c675e'), cu: H('#d2ccbb'), gw: 9, gh: 5 }
      };
      const DIRT = H('#7d6d4c'), OUT = H('#4a463e'), MOSS = [74, 120, 52], PEB = [168, 162, 148], GOLD = H('#c9a85a'), SLATE = H('#5b564d');
      const put = (o, c, sh) => { d[o * 4] = Math.max(0, Math.min(255, c[0] + sh)); d[o * 4 + 1] = Math.max(0, Math.min(255, c[1] + sh)); d[o * 4 + 2] = Math.max(0, Math.min(255, c[2] + sh)) };
      const mix = (o, c, t) => { d[o * 4] += (c[0] - d[o * 4]) * t; d[o * 4 + 1] += (c[1] - d[o * 4 + 1]) * t; d[o * 4 + 2] += (c[2] - d[o * 4 + 2]) * t };
      for (let yy = 0; yy < VH; yy++) for (let xx = 0; xx < VW - 28; xx++) {   // 28px terakhir = daun pintu gerbang timur, jangan ditimpa
        const o = yy * VW + xx, k = cls[o], dd = D[o];
        if (k === 0) {                                              // bahu jalan di luar tepi
          if (dd > 21) continue; const dist = (dd + 2) / 3 | 0, h = hash(xx, yy, 3);
          if (dist === 1) put(o, OUT, 0);
          else if (dist <= 3) { if (h < .82) mix(o, DIRT, dist === 2 ? .55 : .38) }
          else if (h < .4 - (dist - 4) * .13) mix(o, DIRT, .3); else if (h > .987) put(o, PEB, 0);
          continue;
        }
        const P = PAL[k], din = (dd + 2) / 3 | 0;
        if (din <= 2) {                                             // trotoar (curb) dengan penyinaran dari atas
          const top = !cls[o - VW] || (din === 2 && !cls[o - 2 * VW]), bot = !cls[o + VW] || (din === 2 && !cls[o + 2 * VW]);
          put(o, P.cu, (top ? 16 : bot ? -30 : -4) + (din === 2 ? -10 : 0) + ((((xx >> 2) + (yy >> 2)) & 1) ? -9 : 0)); continue;
        }
        let c, sh = 0;
        if (k === 3) {                                              // plaza: cincin & irisan radial
          const rx = (xx - PX) / PR, ry = (yy - PY) / PRY, rho = Math.sqrt(rx * rx + ry * ry), an = (Math.atan2(ry, rx) + Math.PI) / (Math.PI * 2);
          if (rho > .9) { const f = (an * 56) % 1, si = (an * 56) | 0; c = f < .07 ? P.mo : P.st[(si & 1) ? 0 : 2]; sh = f < .07 ? 0 : ((si & 1) ? -6 : 6) }
          else if (rho > .86) { c = (rho > .875 && rho < .89) ? GOLD : SLATE }
          else if (rho > .62) { const f = (an * 16) % 1, wi = (an * 16) | 0; if (f < .035) { c = P.mo } else { const gw = 9, gh = 5, row = (yy / gh) | 0, ox = (row & 1) ? 4 : 0, cx = ((xx + ox) / gw) | 0, lx = (xx + ox) % gw, ly = yy % gh; if (lx === 0 || ly === 0) c = P.mo; else { c = P.st[(hash(cx, row, 27) * 4) | 0]; sh = ((wi & 1) ? -7 : 7) + (ly === 1 ? 10 : 0) } } }
          else if (rho > .6) { c = GOLD }
          else if (rho > .575) { c = SLATE }
          else { const gw = 9, gh = 5, row = (yy / gh) | 0, ox = (row & 1) ? 4 : 0, cx = ((xx + ox) / gw) | 0, lx = (xx + ox) % gw, ly = yy % gh; if (lx === 0 || ly === 0) c = SLATE; else { c = P.st[(hash(cx, row, 29) * 4) | 0]; sh = -26 } }
        } else {                                                    // batu jalan: grid dunia + selang-seling
          const gw = P.gw, gh = P.gh, row = (yy / gh) | 0, ox = (row & 1) ? (gw >> 1) : 0, cx = ((xx + ox) / gw) | 0, lx = (xx + ox) % gw, ly = yy % gh;
          if (lx === 0 || ly === 0) { c = P.mo }
          else { const h = hash(cx, row, 21 + k); c = P.st[(h * 4) | 0]; sh = ((h * 2 - 1) * 7) + (ly === 1 ? 13 : 0) + (lx === 1 ? 7 : 0) + (ly === gh - 1 ? -11 : 0) + (lx === gw - 1 ? -7 : 0); if (din <= 8 && hash(cx, row, 63) > .9) { put(o, c, sh); mix(o, MOSS, .3 + (hash(xx, yy, 5) - .5) * .2); continue } }
        }
        put(o, c, sh + (vnoise(xx / 11, yy / 11, 41) - .5) * 16 + (hash(xx, yy, 55) > .988 ? -14 : 0));
      }
      x.putImageData(img, 0, 0);
      /* hiasan tepi jalan: rumput & bunga kecil menyatukan jalan dengan tanah */
      const fr = mkRng(2468), FCs = ['#ffffff', '#ffd34d', '#ff9ac0', '#b48cff', '#7ab8ff'];
      const okDeco = (a, b) => a > 56 && a < VW - 56 && b > 66 && b < VH - 58 && ((a - POND.x) / (POND.rx + 16)) ** 2 + ((b - POND.y) / (POND.ry + 14)) ** 2 > 1 && ((a - POND2.x) / (POND2.rx + 16)) ** 2 + ((b - POND2.y) / (POND2.ry + 14)) ** 2 > 1 && !(a > FARM.x - 10 && a < FARM.x + FARM.w + 10 && b > FARM.y - 10 && b < FARM.y + FARM.h + 10) && ((a - PZ.x) / (PZ.rx + 14)) ** 2 + ((b - PZ.y) / (PZ.ry + 14)) ** 2 > 1;
      for (let yy = 70; yy < VH - 60; yy += 3) for (let xx = 56; xx < VW - 56; xx += 3) {
        const o = yy * VW + xx; if (cls[o]) continue; const dist = (D[o] + 2) / 3 | 0; if (dist < 6 || dist > 11 || fr() > .04) continue;
        const a = xx + fr() * 3, b = yy + fr() * 3; if (!okDeco(a, b)) continue;
        if (fr() < .55) art.grassTuft(x, a, b, fr); else art.flower(x, a, b, FCs[(fr() * 5) | 0]);
      }
    };

    const walls = V.walls = [[-20, -20, VW + 40, 44], [-20, VH - 42, VW + 40, 60], [-20, -20, 48, 344], [-20, 440, 48, VH], [VW - 28, -20, 48, 344], [VW - 28, 440, 48, VH], [VW - 28, 320, 48, 124]];
    const objs = V.objs = [], spr = (s, a, b, solid, extra) => { objs.push({ x: Math.round(a), y: Math.round(b), img: s.img, ox: s.ox, oy: s.oy, oh: s.img.height, ...extra }); if (solid) walls.push(solid) };
    const place = (kind, a, b, w, o) => { const s = house(w, o); spr(s, a, b, [a - w / 2 + 2, b - 30, w - 4, 30], { lamp: s.lamp.map(l => [a + l[0], b + l[1]]), chim: s.chim ? [a + s.chim[0], b + s.chim[1]] : null }); BLD.push({ x: a, y: b, w, kind }); return s };

    /* ===== BENTENG v2 (rapi): ritme seragam 20px (gigi) / 120px (pilaster) / 60px (panji), pagar tanaman di sisi dalam ===== */
    try {
      const SH0 = '#9a968a', SHL = '#b9b5a8', SHD = '#7e7a70', SHM = '#aaa69a', SHC = '#cfcbbd', BAK = '#4e4a42', MO = 'rgba(60,56,48,.32)', BAN = ['#2f5aa8', '#a8283e', '#3a7a5a', '#7a3a8a'], RF = ['#3a5a9a', '#a8483a', '#3a7a5a', '#7a3a8a'];
      const R = (c, a, b, w, h) => rc(x, c, Math.round(a), Math.round(b), Math.round(w), Math.round(h));
      const mortar = (x0, y0, w, h, per) => { for (let j = 0; j * 6 < h; j++) { R(MO, x0, y0 + j * 6 + 5, w, 1); for (let k = (j % 2) * per / 2; k < w; k += per) R(MO, x0 + k, y0 + j * 6, 1, 6) } };

      /* --- tembok utara & selatan (tinggi 42px) --- */
      const wallH = (y0, shadow) => {
        if (shadow) R('rgba(0,0,0,.26)', 0, y0 + 42, VW, 6);
        R(OLC, 0, y0, VW, 42);                                   // dasar kontur
        R(BAK, 0, y0 + 1, VW, 11);                               // latar celah gigi benteng
        for (let k = 5; k < VW; k += 20) { R(OLC, k - 1, y0, 12, 13); R(SHL, k, y0 + 1, 10, 11); R(SHC, k, y0 + 1, 10, 2); R(SHD, k + 7, y0 + 3, 3, 9) }   // gigi benteng teratur
        R(SH0, 0, y0 + 13, VW, 20); mortar(0, y0 + 14, VW, 19, 12);   // muka tembok + susunan batu
        R(SHC, 0, y0 + 13, VW, 1); R(SHL, 0, y0 + 14, VW, 1); R('rgba(0,0,0,.18)', 0, y0 + 15, VW, 2);   // lis atas
        R(SHD, 0, y0 + 33, VW, 6); R('#6a665c', 0, y0 + 33, VW, 1);   // alas tembok
        for (let k = 120; k < VW; k += 120) {                    // pilaster: tepat di celah gigi, tiap 120px
          R(OLC, k - 6, y0 + 3, 12, 38); R(SHM, k - 5, y0 + 4, 10, 36); R(SHL, k - 5, y0 + 4, 3, 36); R(SHD, k + 2, y0 + 4, 3, 36); R(SHC, k - 5, y0 + 4, 10, 2);
          for (let j = 0; j < 4; j++) R('rgba(60,56,48,.35)', k - 5, y0 + 10 + j * 6, 10, 1);
          R('#6e6a60', k - 6, y0 + 34, 12, 6); R('#8a867a', k - 6, y0 + 34, 12, 1)
        }
        for (let k = 60, n = 0; k < VW; k += 120, n++) {         // panji: di tengah-tengah antar pilaster
          const c = BAN[n % 4];
          R(OLC, k - 6, y0 + 15, 12, 19); R(c, k - 5, y0 + 16, 10, 14); R('rgba(255,255,255,.18)', k - 5, y0 + 16, 3, 14); R('#d8b84a', k - 5, y0 + 16, 10, 1); R('#d8b84a', k - 2, y0 + 21, 4, 5); R(c, k - 5, y0 + 30, 4, 3); R(c, k + 1, y0 + 30, 4, 3)
        }
        R(OLC, 0, y0 + 39, VW, 3);                               // garis bawah
      };

      /* --- tembok barat & timur (lebar 28px), gigi benteng di kedua sisi, selaras grid 20px --- */
      const wallV = (x0, ya, yb, dir) => {
        const h = yb - ya; R('rgba(0,0,0,.24)', dir > 0 ? x0 + 28 : x0 - 7, ya, 7, h);
        R(OLC, x0, ya, 28, h); R(SH0, x0 + 1, ya, 26, h); R(SHD, x0 + 8, ya, 12, h); R(SHM, x0 + 9, ya, 10, h); mortar(x0 + 9, ya, 10, h, 10);
        for (let k = 3 + 20 * Math.ceil((ya - 1) / 20); k + 14 <= yb; k += 20) [x0, x0 + 19].forEach(mx => { R(OLC, mx, k, 9, 14); R(SHL, mx + 1, k + 1, 7, 12); R(SHC, mx + 1, k + 1, 7, 2); R(SHD, mx + 1, k + 9, 7, 3) })
      };
      wallH(0, 1); wallH(VH - 42, 0);
      wallV(0, 40, 324, 1); wallV(0, 440, VH - 40, 1); wallV(VW - 28, 40, 324, -1); wallV(VW - 28, 440, VH - 40, -1);

      /* --- tiang ujung gerbang (barat terbuka, timur berdaun pintu), bukaan y 324..440 --- */
      const cap = (gx, gy) => { R(OLC, gx, gy, 28, 9); R(SHL, gx + 1, gy + 1, 26, 7); R(SHC, gx + 1, gy + 1, 26, 2); R(SHD, gx + 1, gy + 5, 26, 3) };
      [0, VW - 28].forEach(gx => { cap(gx, 316); cap(gx, 440) });
      (function () { const gx = VW - 28; R(OLC, gx, 325, 28, 114); for (let j = 0; j < 8; j++) { R(j % 2 ? '#6a4220' : '#5a3418', gx + 1, 326 + j * 14, 26, 13); R('rgba(255,255,255,.1)', gx + 1, 326 + j * 14, 26, 1) } [6, 19].forEach(q => { R('#2a2a30', gx + q, 326, 3, 112); for (let j = 0; j < 8; j++) R('#b18b59', gx + q + 1, 332 + j * 14, 1, 1) }); R(OLC, gx + 9, 374, 10, 14); R('#c39a5d', gx + 10, 375, 8, 12); R('#2b2620', gx + 13, 379, 2, 4) })();

      [[VW - 46, 332], [VW - 46, 432], [46, 332], [46, 432]].forEach(([a, b]) => spr(art.lantern(), a, b, [a - 3, b - 5, 6, 5], { glow: 1 }));

      /* --- pagar tanaman rapi di sisi dalam tembok (menggantikan pohon acak yang menumpuk) --- */
      const hedge = (hx, hy, hw, hh) => {
        R('rgba(0,0,0,.22)', hx + 1, hy + hh, hw, 3); R('#18301a', hx, hy, hw, hh); R('#2f6a2c', hx + 1, hy + 1, hw - 2, hh - 2); R('#4a8a3c', hx + 1, hy + 1, hw - 2, 3);
        for (let a = 0; a < hw; a += 3) for (let b = 0; b < hh; b += 3) if (((hx + a) * 7 + (hy + b) * 13) % 9 < 2) R('#5aa04a', hx + a, hy + b, 2, 1);
      };
      hedge(28, 50, VW - 56, 10); hedge(30, 884, VW - 60, 10);
      [30, VW - 42].forEach(hx => { hedge(hx, 60, 12, 256); hedge(hx, 448, 12, 436) });
      walls.push([28, 50, VW - 56, 10], [30, 884, VW - 60, 10]);
      [28, VW - 44].forEach(hx => walls.push([hx, 60, 16, 256], [hx, 448, 16, 436]));
    } catch (e) { console.warn('[benteng]', e) }
    place('inn', 330, 262, 120, { wall: '#d8c8a8', trim: '#6a4a2c', roof: '#a8483a', chimney: 1, wins: [-1, 1], sign: 'inn', sx: 100, dx: 60 });
    place('smith', 930, 276, 112, { wall: '#a89c8c', trim: '#4a4038', roof: '#4a5060', chimney: 1, wins: [1], sign: 'smith', dx: 50, sx: 96 });
    place('elder', 800, 610, 116, { wall: '#e0d4b8', trim: '#7a5a38', roof: '#3a7a5a', chimney: 1, wins: [-1, 1], dx: 58 });
    place('house', 150, 220, 84, { wall: '#d8b898', trim: '#6a4a2c', roof: '#7a4a8a', wins: [-1, 1] }); place('house', 1040, 250, 88, { wall: '#c8c0a8', trim: '#5a4a30', roof: '#b87a38', chimney: 1, wins: [-1, 1] }); place('house', 460, 600, 90, { wall: '#d8c8a0', trim: '#6a4a2c', roof: '#3a6a8a', chimney: 1, wins: [-1, 1] });
    place('house', 1180, 250, 80, { wall: '#c8a888', trim: '#5a3a28', roof: '#8a3a3a', wins: [1] }); place('house', 280, 520, 70, { wall: '#e0d0b0', trim: '#6a4a2c', roof: '#5a7a3a', wins: [-1, 1] });

    const hr = mkRng(5150), pick = arr => arr[(hr() * arr.length) | 0];
    const WALLC = ['#d8c8a8', '#e0d4b8', '#c8c0a8', '#d8b898', '#e0d0b0', '#c8a888', '#d8c8a0', '#e4d8c0', '#cfc4a8', '#bfb49c'];
    const TRIMC = ['#6a4a2c', '#5a4a30', '#7a5a38', '#5a3a28'];
    const ROOFC = ['#a8483a', '#3a7a5a', '#7a4a8a', '#b87a38', '#3a6a8a', '#8a3a3a', '#5a7a3a', '#4a5060', '#c0583a', '#2f6a7a'];
    const WINS = [[-1, 1], [-1, 1], [1], [-1]];
    NEWH.forEach(([a, b, w, ln], i) => {
      place('house', a, b, w, { wall: pick(WALLC), trim: pick(TRIMC), roof: ROOFC[(i * 3 + 1) % ROOFC.length], chimney: hr() < .6 ? 1 : 0, wins: pick(WINS) });
      const side = hr() < .5 ? -1 : 1, k = hr(), px = a + side * (w / 2 + 14), fx = a - side * (w / 2 + 26);
      if (k < .3) spr(art.barrel(), px, b, [px - 6, b - 4, 12, 5]);
      else if (k < .55) spr(art.crate(), px, b, [px - 7, b - 4, 14, 5]);
      else if (k < .85) spr(art.flowerbed(i + 20, 40, 22), fx, b + 2, [fx - 18, b - 4, 36, 8]);
    });

    const well = (() => {
      const [c, q] = mkCv(34, 40); rc(q, 'rgba(0,0,0,.3)', 3, 36, 28, 4);
      rc(q, OLC, 4, 18, 26, 20); rc(q, '#8a8478', 5, 19, 24, 18); rc(q, '#b4aea0', 5, 19, 24, 3); for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) rc(q, (i + j) % 2 ? '#7a7468' : '#9a9488', 6 + i * 4, 23 + j * 4, 3, 3);
      rc(q, OLC, 8, 14, 18, 6); rc(q, '#2a5a7a', 9, 15, 16, 4); rc(q, '#4a8ab0', 11, 16, 8, 2);
      rc(q, OLC, 5, 4, 3, 20); rc(q, '#6a4a2c', 6, 4, 1, 19); rc(q, OLC, 26, 4, 3, 20); rc(q, '#6a4a2c', 27, 4, 1, 19);
      rc(q, OLC, 2, 0, 30, 6); rc(q, '#a8483a', 3, 1, 28, 4); rc(q, '#c8685a', 3, 1, 28, 1); rc(q, OLC, 15, 6, 4, 10); rc(q, '#8a6440', 16, 6, 2, 8); rc(q, OLC, 13, 14, 8, 5); rc(q, '#6a4a2c', 14, 15, 6, 3);
      return { img: c, ox: 17, oy: 38 }
    })();
    [[1460, 440], [480, 893]].forEach(([a, b]) => spr(well, a, b, [a - 14, b - 8, 28, 8]));

    const GD2 = { x: 1415, y: 690, rx: 70, ry: 36 };
    ell(x, '#3f6e2e', GD2.x, GD2.y + 2, GD2.rx + 6, GD2.ry + 5); ell(x, '#5e9a3c', GD2.x, GD2.y, GD2.rx + 3, GD2.ry + 2);
    for (let i = 0; i < 300; i++) { const an = rng() * TAU, dd = Math.sqrt(rng()); art.flower(x, GD2.x + Math.cos(an) * dd * GD2.rx, GD2.y + Math.sin(an) * dd * GD2.ry, fc[(rng() * 5) | 0]) }
    [[1370, 650], [1460, 650]].forEach(([a, b]) => { const [c, q] = mkCv(34, 18); rc(q, 'rgba(0,0,0,.28)', 2, 15, 30, 3); rc(q, OLC, 1, 2, 32, 7); rc(q, '#9a7444', 2, 3, 30, 5); rc(q, '#b8905a', 2, 3, 30, 1); rc(q, OLC, 1, 9, 32, 5); rc(q, '#8a6440', 2, 10, 30, 3); rc(q, OLC, 3, 12, 3, 5); rc(q, OLC, 28, 12, 3, 5); spr({ img: c, ox: 17, oy: 15 }, a, b, [a - 16, b - 6, 32, 6]) });

    [[220, 872], [400, 872], [570, 872], [720, 872], [880, 874], [1040, 874], [1180, 872], [1340, 872], [1500, 872], [1640, 872],
    [1370, 404], [1415, 346], [1500, 404], [1575, 346], [1650, 404], [1725, 346], [1758, 404],
    [1460, 632], [334, 600], [1600, 636], [1690, 632], [1735, 730], [1690, 790], [1415, 646], [1380, 520]].forEach(([a, b]) => spr(art.lantern(), a, b, [a - 3, b - 5, 6, 5], { glow: 1 }));

    [[1752, 432], [1730, 438]].forEach(([a, b]) => spr(art.haybale(), a, b, [a - 10, b - 6, 20, 8])); spr(art.crate(), 1752, 336, [1745, 332, 14, 5]); spr(art.barrel(), 1734, 336, [1728, 332, 12, 5]);

    (function () { const [c, q] = mkCv(40, 34); rc(q, OLC, 2, 12, 36, 21); rc(q, '#a8743c', 3, 13, 34, 19); rc(q, '#c8924c', 3, 13, 34, 3); for (let i = 0; i < 6; i++) rc(q, '#6a4020', 8 + i * 5, 14, 1, 18); rc(q, OLC, 0, 4, 40, 10); rc(q, '#8a5a30', 1, 5, 38, 8); rc(q, '#b8824a', 1, 5, 38, 2); rc(q, '#2a1a10', 16, 20, 8, 12); spr({ img: c, ox: 20, oy: 32 }, 160, 440, [142, 424, 36, 16]) })();

    spr(stall('#2f8a5a', '#e8e4d8', potions), 540, 334, [510, 322, 60, 12]); spr(stall('#c8283e', '#e8d890', wares), 740, 334, [710, 322, 60, 12]);

    (function () { const [c, q] = mkCv(24, 20); rc(q, 'rgba(0,0,0,.3)', 2, 17, 20, 3); rc(q, OLC, 3, 8, 18, 10); rc(q, '#6a4a2c', 7, 12, 10, 6); rc(q, OLC, 1, 3, 22, 8); rc(q, '#4a4a54', 2, 4, 20, 6); rc(q, '#8a8a98', 2, 4, 20, 2); rc(q, '#4a4a54', 18, 6, 5, 3); spr({ img: c, ox: 12, oy: 18 }, 898, 306, [888, 298, 20, 8]) })();
    (function () { const [c, q] = mkCv(34, 34); rc(q, 'rgba(0,0,0,.3)', 2, 31, 30, 3); rc(q, OLC, 2, 6, 30, 26); rc(q, '#7a7068', 3, 7, 28, 24); rc(q, '#9a9088', 3, 7, 28, 3); rc(q, OLC, 8, 14, 18, 14); rc(q, '#1a0a06', 9, 15, 16, 12); rc(q, '#c8481a', 10, 19, 14, 7); rc(q, '#ff9a3c', 12, 21, 10, 5); rc(q, '#ffe28a', 15, 23, 4, 3); rc(q, OLC, 11, 0, 12, 8); rc(q, '#6a6058', 12, 1, 10, 7); spr({ img: c, ox: 17, oy: 32 }, 982, 306, [966, 296, 34, 12], { forge: [982, 292] }) })();
    (function () { const [c, q] = mkCv(34, 30); rc(q, OLC, 2, 4, 3, 26); rc(q, '#6a4a2c', 3, 4, 1, 25); rc(q, OLC, 29, 4, 3, 26); rc(q, '#6a4a2c', 30, 4, 1, 25); rc(q, OLC, 1, 8, 32, 3); rc(q, '#8a6440', 2, 9, 30, 1); rc(q, OLC, 1, 18, 32, 3); rc(q, '#8a6440', 2, 19, 30, 1);[[6, 0], [14, 1], [22, 0]].forEach(([a, b]) => { rc(q, OLC, a, 1 + b, 4, 14); rc(q, '#cfd6e2', a + 1, 2 + b, 2, 12); rc(q, '#8a6a3a', a, 12 + b, 4, 3) }); spr({ img: c, ox: 17, oy: 29 }, 870, 330, [855, 326, 32, 6]) })();

    [[120, 352], [250, 410], [380, 352], [500, 410], [780, 410], [900, 352], [1020, 410], [1140, 350], [600, 120], [680, 200], [600, 560], [680, 640], [372, 338], [968, 340]].forEach(([a, b]) => spr(art.lantern(), a, b, [a - 3, b - 5, 6, 5], { glow: 1 }));

    [[1040, 396], [440, 330], [820, 400], [520, 440], [760, 440], [610, 330], [210, 346]].forEach(([a, b], i) => { if (i < 3) spr(art.barrel(), a, b, [a - 6, b - 4, 12, 5]); else if (i < 5) spr(art.crate(), a, b, [a - 7, b - 4, 14, 5]) });
    spr(art.barrel(), 1010, 300, [1004, 296, 12, 5]); spr(art.crate(), 1020, 296, [1013, 292, 14, 5]); spr(art.barrel(), 310, 300, [304, 296, 12, 5]); spr(art.crate(), 560, 340, [553, 336, 14, 5]);

    [[1006, 456], [1030, 456], [1320, 738]].forEach(([a, b]) => spr(art.haybale(), a, b, [a - 10, b - 6, 20, 8])); spr(art.haybale(), 1280, 456, [1270, 450, 20, 8]);
    spr(art.fence(95), 990, 468, [990, 462, 95, 6]); spr(art.fence(175), 1115, 468, [1115, 462, 175, 6]); spr(art.fence(110), 990, 724, null);

    (function () { const [c, q] = mkCv(28, 40); rc(q, 'rgba(0,0,0,.28)', 6, 37, 16, 3); rc(q, OLC, 12, 8, 5, 30); rc(q, '#7a5230', 13, 8, 3, 29); rc(q, OLC, 2, 14, 25, 5); rc(q, '#7a5230', 3, 15, 23, 3); rc(q, OLC, 8, 15, 13, 12); rc(q, '#a83a3a', 9, 16, 11, 10); rc(q, '#c85a5a', 9, 16, 4, 10); rc(q, OLC, 9, 2, 11, 10); rc(q, '#d8b45a', 10, 4, 9, 7); rc(q, OLC, 6, 6, 17, 3); rc(q, '#c8a040', 7, 6, 15, 2); rc(q, '#2a1a10', 12, 7, 2, 2); rc(q, '#2a1a10', 16, 7, 2, 2); rc(q, '#c9a95a', 1, 18, 3, 6); rc(q, '#c9a95a', 25, 18, 3, 6); spr({ img: c, ox: 14, oy: 37 }, 1140, 560, [1136, 554, 8, 6]) })();

    (function () { const [c, q] = mkCv(64, 90); rc(q, 'rgba(0,0,0,.28)', 8, 86, 48, 4); for (let j = 0; j < 70; j++) { const wd = 16 - Math.round(j * .1); rc(q, OLC, 32 - wd - 1, 20 + j, wd * 2 + 2, 1) } for (let j = 0; j < 70; j++) { const wd = 16 - Math.round(j * .1); rc(q, j % 6 < 3 ? '#e0d4b8' : '#d0c4a4', 32 - wd, 20 + j, wd * 2, 1); rc(q, 'rgba(0,0,0,.18)', 32, 20 + j, wd, 1) } rc(q, OLC, 25, 62, 14, 28); rc(q, '#5a3418', 26, 63, 12, 27); rc(q, '#d8b84a', 34, 76, 2, 2); rc(q, OLC, 22, 14, 20, 8); rc(q, '#8a3a3a', 23, 15, 18, 6); rc(q, OLC, 28, 8, 8, 8); rc(q, '#a84a4a', 29, 9, 6, 6);[[22, 40], [38, 40]].forEach(([a, b]) => { rc(q, OLC, a - 1, b - 1, 8, 10); rc(q, '#ffd870', a, b, 6, 8) }); spr({ img: c, ox: 32, oy: 88 }, 1130, 200, [1114, 180, 32, 20], { mill: [1130, 200 - 70] }) })();

    objs.push({ x: PLAZA.x, y: PLAZA.y + 8, fountain: 1, oh: 40, ox: 0, oy: 0 }); walls.push([PLAZA.x - 40, PLAZA.y - 14, 80, 30]);

    [[PLAZA.x - 60, PLAZA.y + 56], [PLAZA.x + 60, PLAZA.y + 56]].forEach(([a, b]) => { const [c, q] = mkCv(34, 18); rc(q, 'rgba(0,0,0,.28)', 2, 15, 30, 3); rc(q, OLC, 1, 2, 32, 7); rc(q, '#9a7444', 2, 3, 30, 5); rc(q, '#b8905a', 2, 3, 30, 1); rc(q, OLC, 1, 9, 32, 5); rc(q, '#8a6440', 2, 10, 30, 3); rc(q, OLC, 3, 12, 3, 5); rc(q, OLC, 28, 12, 3, 5); spr({ img: c, ox: 17, oy: 15 }, a, b, [a - 16, b - 6, 32, 6]) });

    [[420, 330], [860, 440], [320, 430], [580, 500]].forEach(([a, b], i) => spr(art.flowerbed(i + 3, 40, 22), a, b, [a - 18, b - 6, 36, 8]));

    /* ===== PADATKAN DESA: rumah feodal-fantasi mengisi lahan kosong di sepanjang jalan ===== */
    try {
      const h2 = mkRng(9091), pk = arr => arr[(h2() * arr.length) | 0];
      const ROOFF = ['#a8483a', '#3a6a8a', '#7a4a8a', '#3a7a5a', '#8a3a3a', '#4a5060', '#2f6a7a', '#b0522e'], SHUT = ['#3a5a7a', '#3a6a4a', '#7a3a3a', '#5a3a7a'], FLAG = ['#c8283e', '#2f5aa8', '#d8b84a', '#3a8a5a'];
      const NPCP = [[92, 352], [540, 322], [740, 322], [928, 308], [304, 306], [192, 452], [826, 638], [1098, 540], [600, 420], [700, 430], [1540, 430], [1750, 388], [1494, 456], [1415, 704], [872, 846], [45, 330]];
      const ROADS = [[MAINd, 30], [NSd, 28], ...SIDEd.map(s => [s, 17]), ...LANEd.map(s => [s, 22])];
      const blk = (px, py, m) => {
        if (px < 66 || px > VW - 66 || py < 70 || py > VH - 66) return true;
        if (((px - POND.x) / (POND.rx + 16 + m)) ** 2 + ((py - POND.y) / (POND.ry + 14 + m)) ** 2 < 1) return true;
        if (((px - POND2.x) / (POND2.rx + 16 + m)) ** 2 + ((py - POND2.y) / (POND2.ry + 14 + m)) ** 2 < 1) return true;
        if (px > FARM.x - 26 - m && py > FARM.y - 30 - m && px < FARM.x + FARM.w + 26 + m && py < FARM.y + FARM.h + 34 + m) return true;
        if (px > 1320 - m && px < 1510 + m && py > 616 - m && py < 750 + m) return true;
        if (px > 1440 - m && px < 1700 + m && py > 390 - m && py < 535 + m) return true;
        if (px < 140 && Math.abs(py - 382) < 90) return true;
        if (px > 340 - m && px < 626 + m && py > 596 - m && py < 836 + m) return true;   // plaza portal (+ ruang atap rumah di selatannya)
        if (px > 150 && px < 280 && py > 580 && py < 750) return true;
        if (Math.hypot(px - PLAZA.x, (py - PLAZA.y) * 1.4) < PLAZA.r + 16 + m) return true;
        return false;
      };
      const inR = (px, py, h, m) => px > h.x - h.w / 2 - m && px < h.x + h.w / 2 + m && py > h.y - 34 - m && py < h.y + 8 + m;
      let placed = 0;
      for (let t = 0; t < 30000 && placed < 120; t++) {
        const tw = placed % 10 === 6, w = tw ? 40 : 60 + ((h2() * 40) | 0), a = Math.round(40 + h2() * (VW - 80)), b = Math.round(130 + h2() * (VH - 160));
        if (b < 196) continue;   // sisakan ruang agar atap/menara tidak menimpa tembok utara
        const r = [a - w / 2 - 8, b - 32, w + 16, 38];
        if ([[r[0], r[1]], [a, r[1]], [r[0] + r[2], r[1]], [r[0], b + 6], [a, b + 6], [r[0] + r[2], b + 6]].some(p => blk(p[0], p[1], 0))) continue;
        if (BLD.some(h => Math.abs(a - h.x) < (w + h.w) / 2 + 6 && Math.abs(b - h.y) < 52)) continue;
        if (objs.some(o => !o.fountain && Math.abs(o.x - a) < w / 2 + 14 && Math.abs(o.y - b) < 30)) continue;
        if (NPCP.some(n => n[0] > r[0] - 14 && n[0] < r[0] + r[2] + 14 && n[1] > r[1] - 14 && n[1] < b + 22)) continue;
        let bad = false, best = 1e9, np = null;
        for (const [rd, hw] of ROADS) { for (const p of rd) { const ddx = Math.max(r[0] - p[0], 0, p[0] - (r[0] + r[2])), ddy = Math.max(r[1] - p[1], 0, p[1] - (b + 6)); if (Math.hypot(ddx, ddy) < hw + 3) { bad = true; break } const d = Math.hypot(p[0] - a, p[1] - (b + 16)); if (d < best) { best = d; np = p } } if (bad) break }
        if (bad || !np || best > 175) continue;
        const stub = dense([[a, b + 4], [a, b + 16], [np[0], np[1]]], 4);
        if (stub.slice(4).some(p => blk(p[0], p[1], -8) || BLD.some(h => inR(p[0], p[1], h, 4)) || (p[0] > r[0] && p[0] < r[0] + r[2] && p[1] > r[1] && p[1] < b + 2))) continue;
        STUBS.push(stub);
        if (tw) { const s = fTower(pk(['#3a5a9a', '#7a3a8a', '#2f6a7a', '#8a3a3a']), pk(FLAG)); spr(s, a, b, [a - 16, b - 14, 32, 14], { lamp: s.lamp.map(l => [a + l[0], b + l[1]]) }); BLD.push({ x: a, y: b, w: 40, kind: 'tower' }) }
        else {
          place('house', a, b, w, { wall: pick(WALLC), trim: pick(TRIMC), roof: pk(ROOFF), thatch: h2() < .25, flag: h2() < .22 ? pk(FLAG) : 0, shut: pk(SHUT), fl: h2() < .45 ? 2 : 1, chimney: h2() < .65 ? 1 : 0, wins: pick(WINS) });
          const side = h2() < .5 ? -1 : 1, k = h2(), px = a + side * (w / 2 + 12), fx = a - side * (w / 2 + 24);
          if (k < .25) spr(art.barrel(), px, b, [px - 6, b - 4, 12, 5]); else if (k < .45) spr(art.crate(), px, b, [px - 7, b - 4, 14, 5]); else if (k < .75) spr(art.flowerbed(placed + 60, 40, 22), fx, b + 2, null);
        }
        placed++;
      }
    } catch (e) { console.warn('[padat-desa]', e) }
    try { paintRoads() } catch (e) { console.warn('[jalan]', e) }
    for (let yy = 626; yy < 706; yy += 4) { rc(x, '#4a301a', 196, yy, 32, 4); rc(x, yy % 8 ? '#9a7444' : '#8a6440', 197, yy, 30, 3) } rc(x, '#4a301a', 194, 626, 2, 80); rc(x, '#4a301a', 228, 626, 2, 80);
    const OAK = [], PINE = []; for (let i = 0; i < 5; i++) OAK.push(art.oak(i + 20, .85 + (i % 3) * .12)); for (let i = 0; i < 3; i++) PINE.push(art.pine(i + 20, .9));
    const occ = []; const free = (a, b, m) => { if (a < 52 || a > VW - 52 || b < 62 || b > VH - 54) return false; if (((a - PZ.x) / (PZ.rx + 26 + m)) ** 2 + ((b - PZ.y) / (PZ.ry + 30 + m)) ** 2 < 1) return false; if (distPoly(a, b, MAINd) < 32 + m || distPoly(a, b, NSd) < 30 + m || SIDEd.some(s => distPoly(a, b, s) < 20 + m) || LANEd.some(s => distPoly(a, b, s) < 26 + m)) return false; if (Math.hypot(a - PLAZA.x, (b - PLAZA.y) * 1.4) < PLAZA.r + m) return false; if (((a - POND.x) / (POND.rx + 22 + m)) ** 2 + ((b - POND.y) / (POND.ry + 18 + m)) ** 2 < 1) return false; if (((a - POND2.x) / (POND2.rx + 22 + m)) ** 2 + ((b - POND2.y) / (POND2.ry + 18 + m)) ** 2 < 1) return false; if (a > 1330 && a < 1500 && b > 626 && b < 740) return false; if (a > 1470 && a < 1670 && b > 400 && b < 520) return false; if (a > FARM.x - 24 - m && b > FARM.y - 24 - m && a < FARM.x + FARM.w + 24 && b < FARM.y + FARM.h + 30) return false; if (BLD.some(h => Math.abs(a - h.x) < h.w / 2 + 18 + m && b > h.y - 78 - m && b < h.y + 30 + m)) return false; if (a < 120 && Math.abs(b - 382) < 70) return false; if (a > 160 && a < 270 && b > 590 && b < 745) return false; if (objs.some(o => !o.fountain && Math.abs(o.x - a) < 28 + m && Math.abs(o.y - b) < 20 + m)) return false; return true };
    V.free = free;
    for (let gy = 28; gy < VH - 10; gy += 30) for (let gx = 10; gx < VW - 10; gx += 30) { const a = gx + rng() * 26, b = gy + rng() * 26, edge = a < 100 || a > VW - 100 || b < 120 || b > VH - 96, dens = edge ? 0 : .07; if (rng() > dens || !free(a, b, 8) || occ.some(q => Math.hypot(q[0] - a, q[1] - b) < 30)) continue; occ.push([a, b]); ell(x, 'rgba(0,12,4,.22)', a + 4, b - 2, 16, 7); const k = rng(), s = k < .65 ? OAK[(k * 100 | 0) % 5] : PINE[(k * 100 | 0) % 3]; spr(s, a, b + 4, [a - 4, b - 1, 8, 5]) }
    /* barisan pohon rapi di sisi dalam tembok: jarak seragam, selang-seling ek & cemara, otomatis lewati jalan/rumah/objek */
    (function () {
      const row = (a0, b0, da, db, n) => { for (let i = 0; i < n; i++) { const a = a0 + da * i, b = b0 + db * i; if (!free(a, b, 4) || occ.some(q => Math.hypot(q[0] - a, q[1] - b) < 34)) continue; occ.push([a, b]); ell(x, 'rgba(0,12,4,.22)', a + 4, b - 2, 16, 7); spr(i % 2 ? PINE[i % 3] : OAK[i % 5], a, b + 4, [a - 4, b - 1, 8, 5]) } };
      row(110, 128, 64, 0, Math.floor((VW - 220) / 64) + 1);
      row(70, 200, 0, 64, Math.floor((VH - 330) / 64) + 1);
      row(VW - 70, 200, 0, 64, Math.floor((VH - 330) / 64) + 1);
    })();

    (function () {
      const pillar = () => {
        const W = 22, H = 60, [c, q] = mkCv(W, H), Q = (cc, a, b, w, h) => rc(q, cc, a, b, w, h);
        Q('rgba(0,0,0,.3)', 2, H - 5, 18, 4);
        Q(OLC, 2, H - 14, 18, 12); Q('#7e7a70', 3, H - 13, 16, 10); Q('#b9b5a8', 3, H - 13, 16, 1);
        Q(OLC, 4, 17, 14, H - 30); Q('#9a968a', 5, 17, 12, H - 30); Q('#b9b5a8', 5, 17, 3, H - 30); Q('#7e7a70', 13, 17, 4, H - 30);
        for (let j = 0; j < 6; j++) Q('rgba(60,56,48,.35)', 5, 23 + j * 6, 12, 1);
        Q(OLC, 1, 12, 20, 6); Q('#b9b5a8', 2, 13, 18, 4); Q('#cfcbbd', 2, 13, 18, 1);
        Q(OLC, 6, 2, 10, 11); Q('#ffd870', 7, 3, 8, 9); Q('#fff3b8', 7, 3, 3, 3); Q('#5a4630', 10, 3, 2, 9);
        Q(OLC, 5, 0, 12, 4); Q('#a8483a', 6, 1, 10, 2);
        return { img: c, ox: 11, oy: H - 2 };
      };

      const [bc, bq] = mkCv(34, 40); rc(bq, OLC, 0, 8, 34, 14); rc(bq, '#7a5434', 1, 9, 32, 12); rc(bq, '#a8825a', 1, 9, 32, 3); rc(bq, '#4a301a', 1, 18, 32, 3); rc(bq, OLC, 2, 22, 30, 12); rc(bq, '#9a7444', 3, 23, 28, 10); for (let i = 0; i < 8; i++) rc(bq, '#3a2414', 6 + i * 3, 27, 2, 3); objs.push({ x: 84, y: 322, img: bc, ox: 17, oy: 36, oh: 40 })
    })();
    V.objs.sort((a, b) => a.y - b.y);

    V.sparks = []; for (let i = 0; i < 40; i++) { const an = rng() * TAU, dd = Math.sqrt(rng()); V.sparks.push({ x: POND.x + Math.cos(an) * dd * (POND.rx - 8), y: POND.y + Math.sin(an) * dd * (POND.ry - 6), ph: rng() * 6 }) }
    for (let dy = -POND.ry; dy < POND.ry; dy += 10) { const k = Math.sqrt(1 - Math.pow((dy + 5) / POND.ry, 2)), L = POND.x - POND.rx * k + 6, R = POND.x + POND.rx * k - 6; if (POND.y + dy > 620 && POND.y + dy < 700) { walls.push([L, POND.y + dy, 194 - L, 10], [230, POND.y + dy, R - 230, 10]) } else walls.push([L, POND.y + dy, R - L, 10]) }
    walls.push([192, 626, 4, 82], [228, 626, 4, 82]);
    walls.push([190, 706, 44, 6]);
    for (let dy = -POND2.ry; dy < POND2.ry; dy += 10) { const k = Math.sqrt(1 - Math.pow((dy + 5) / POND2.ry, 2)); walls.push([POND2.x - POND2.rx * k + 6, POND2.y + dy, POND2.rx * 2 * k - 12, 10]) }

    const N = V.npcs, mkN = (o) => { N.push(o); return o };
    const shopNPC = (o, shop, intro, short) => mkN({ ...o, fresh: 1, shop, get lines() { return this.seen ? short : intro }, act() { this.seen = 1; this.fresh = 0; WORLD.openShop(shop) } });
    mkN({ n: 'Kael, Penjaga Gerbang', x: 92, y: 352, fc: 1, sk: '#d9a07a', hair: '#3a2a1a', hat: 'helm', armor: 1, c1: '#4b5aa0', c2: '#c2a06b', c3: '#3a3d48', prop: 'spear', lines: ['Selamat datang di Desa Lembah Lentera, pahlawan! Aku Kael, penjaga gerbang barat.', 'Setiap senja, lentera di sepanjang jalan dinyalakan. Para tetua bilang cahayanya menjaga bisikan Abyss tetap jauh dari desa.', 'Pasar ada di tengah desa. Pandai besi di timur laut, penginapan di barat laut. Jangan lupa mampir!'] });
    shopNPC({ n: 'Mira, Peracik Ramuan', x: 540, y: 322, fc: 1, sk: '#e8c0a0', hair: '#7a3a8a', hs: 'long', c1: '#2f8a5a', c2: '#e8e4d8', c3: '#2a3a30', apron: '#e8e4d8', prop: 'bottle', pc: '#5ad06a', rng: 44 }, 'alchemist', ['Wah, wajah baru! Aku Mira, peracik ramuan. Ramuanku dibuat dari herba hutan yang dipetik sendiri.', 'Kalau kau punya herba, jamur cahaya, atau bunga kristal, aku beli dengan harga lebih tinggi dari pedagang lain. Silakan lihat daganganku!'], ['Selamat datang kembali! Mau ramuan, atau menjual hasil petikanmu?']);
    shopNPC({ n: 'Tamsin, Pedagang Umum', x: 740, y: 322, fc: -1, sk: '#d0986c', hair: '#3a2a1a', stache: '#3a2a1a', hat: 'feather', hc: '#8a3a3a', c1: '#8a3a3a', c2: '#e8d890', c3: '#3a2a24', vest: '#c8a040', prop: 'scroll', rng: 44 }, 'general', ['Hohoho! Pelanggan baru! Tamsin pedagang umum, apa pun ada, apa pun kubeli!', 'Ramuan, bahan hutan, semuanya. Harga adil, senyum gratis. Silakan, silakan!'], ['Ah, pelanggan setia! Ada yang bisa kubantu hari ini?']);
    shopNPC({ n: 'Borin, Pandai Besi', x: 928, y: 308, fc: -1, sk: '#c0845c', hair: '#6a6a72', hs: 'bald', beard: '#8a8a92', c1: '#6a4a3a', c2: '#c2a06b', c3: '#3a3028', apron: '#5a3a22', prop: 'hammer', rng: 44 }, 'smith', ['Hm. Kau yang keluar dari Dungeon itu? Lengan yang bagus, pedang yang... kusam.', 'Aku Borin. Kutempa senjata dan zirah sampai musuh menyesal lahir. Beri aku emas, kuberi kau baja yang lebih baik.', 'Asah senjatamu untuk memperkuat serangan, atau tempa zirah untuk mengurangi luka. Dua-duanya permanen.'], ['Kembali untuk baja yang lebih baik? Bagus.']);
    shopNPC({ n: 'Hanna, Pemilik Penginapan', x: 304, y: 306, fc: 1, sk: '#e8b898', hair: '#8a5a2a', hs: 'bun', hat: 'bonnet', c1: '#b8553a', c2: '#e8d8a0', c3: '#4a2a1a', apron: '#f0e8dc', rng: 44 }, 'inn', ['Selamat datang di Penginapan Rusa Emas! Aku Hanna. Sup hangat dan ranjang empuk, itu keahlianku.', 'Kalau lelah, bermalamlah. HP, stamina, dan semua skill-mu pulih sepenuhnya. Aku juga menjual sup daging yang mengenyangkan!'], ['Selamat datang kembali! Mau makan atau beristirahat?']);
    shopNPC({ n: 'Wren, Nenek Telur', x: 192, y: 452, fc: 1, sk: '#e8c0a8', hair: '#d8d8e0', hs: 'bun', hat: 'bonnet', c1: '#6a5aa0', c2: '#e8d8a0', c3: '#3a2a4a', apron: '#e8e0d0', prop: 'basket', rng: 44 }, 'food', ['Oh, anak muda yang kurus! Nenek Wren punya telur rebus dan roti madu hangat, baru keluar oven.', 'Makan dulu sebelum bertarung lagi. Perut kenyang, nyawa panjang!'], ['Mau telur atau roti, sayang?']);
    mkN({
      n: 'Aldous, Kepala Desa', x: 826, y: 638, fc: -1, sk: '#e0b898', hair: '#e8e8f0', hs: 'bald', beard: '#e8e8f0', c1: '#3a7a5a', c2: '#d8b84a', c3: '#4a3a2a', robe: 1, prop: 'staff', pc: '#ffd34d', fresh: 1,
      get lines() { return this.seen ? ['Semoga langkahmu ringan, pahlawan. Desa ini berutang budi pada keberanianmu.'] : ['Ah, pahlawan dari bawah tanah! Aku Aldous, kepala desa Lembah Lentera. Sudah lama kami tidak melihat seseorang keluar dari Aula Kuno.', 'Dulu, desa ini hidup dari para penjelajah dungeon. Lalu Morvath bangkit, dan jalan hutan menjadi sepi.', 'Kau memberi kami harapan. Terimalah sedikit bekal dari desa kami, 50 emas, untuk perjalananmu.'] }, act() { if (!this.seen) { WORLD.addGold(50); try { SFX.point() } catch (e) { } } this.seen = 1; this.fresh = 0; W_.seen.aldous = 1; WORLD.save() }
    });
    mkN({ n: 'Hendra, Penyair Keliling', x: PLAZA.x - 62, y: PLAZA.y + 46, sit: 1, fc: 1, sk: '#e0b090', hair: '#a8622c', hs: 'short', hat: 'feather', hc: '#3a6a8a', c1: '#3a6a8a', c2: '#e8d890', c3: '#2a2a40', prop: 'lute', lines: ['Dengarlah, dengarlah! Kisah pahlawan yang keluar dari kegelapan... masih kurang bait terakhirnya.', 'Aku menggubah lagu tentang Morvath si Banteng Abyss. Sayangnya aku belum pernah melihatnya, dan tak mau melihatnya.', 'Kalau kau mengalahkannya, datanglah ke sini. Kau akan jadi bait terakhirku!'] });
    mkN({ n: 'Gaspar, Petani', x: 1098, y: 540, fc: -1, sk: '#c9946e', hair: '#5a3a1a', hat: 'straw', c1: '#5a8a4a', c2: '#c9a95a', c3: '#4a3a2a', prop: 'pitchfork', lines: ['Panen tahun ini bagus! Kol, gandum, dan labu, semuanya subur.', 'Orang-orangan sawah itu? Anakku yang menggambar wajahnya. Burung gagak malah makin berani.', 'Kalau di hutan kau lihat herba, petik saja. Tak ada yang melarang.'] });
    mkN({ n: 'Finn, Nelayan', x: 212, y: 688, sit: 1, fc: 1, sk: '#d9a07a', hair: '#2a1a14', hat: 'cap', hc: '#6a5a3a', c1: '#4a6a8a', c2: '#c9a95a', c3: '#3a3a30', prop: 'rod', lines: ['Sst... jangan keras-keras. Ikan di kolam ini pemalu.', 'Sudah tiga hari aku di sini dan baru dapat satu sepatu bot. Tapi kolam ini menenangkan.'] });
    const kid = (o, path) => mkN({ ...o, kid: 1, hs: 'short', path, pi: 0, mv: 0 });
    kid({ n: 'Nia, Anak Desa', x: 600, y: 420, sk: '#e8c0a0', hair: '#c8483a', hs: 'bun', c1: '#e08aa0', c2: '#fff', c3: '#4a3a5a', lines: ['Kakak pahlawan! Lihat, aku bisa lari lebih cepat dari Tobi!', 'Katanya di dungeon ada banteng raksasa. Aku tidak takut! ...sedikit.'] }, [[600, 420], [700, 430], [690, 500], [590, 480]]);
    kid({ n: 'Tobi, Anak Desa', x: 700, y: 430, sk: '#d9a07a', hair: '#3a2a1a', c1: '#4a8aa8', c2: '#fff', c3: '#5a4a2a', lines: ['Nia curang! Dia mulai lari duluan!', 'Aku mau jadi pahlawan juga, dengan pedang kayu yang besar.'] }, [[700, 430], [590, 480], [610, 410], [720, 470]]);
    kid({ n: 'Rafi, Anak Desa', x: 1540, y: 430, sk: '#d9a07a', hair: '#2a1a14', c1: '#d8a040', c2: '#fff', c3: '#4a3a2a', lines: ['Kakak pahlawan! Di sini ada kolam, aku sering lihat katak besar!', 'Nia dan Tobi tidak pernah ke sini. Mereka takut sama anjing Pak Doran.'] }, [[1540, 430], [1640, 436], [1620, 500], [1530, 480]]);

    mkN({ n: 'Joko, Penjaga Timur', x: 1750, y: 388, fc: -1, sk: '#c9946e', hair: '#2a1a14', hat: 'helm', armor: 1, c1: '#4b5aa0', c2: '#c2a06b', c3: '#3a3d48', prop: 'spear', lines: ['Ujung timur desa. Di balik pagar kayu itu hutan lebat, jarang ada yang berani ke sana.', 'Sejak kau keluar dari dungeon, aku tidur lebih nyenyak. Terima kasih, pahlawan.'] });
    mkN({ n: 'Rina, Penjahit', x: 1578, y: 424, fc: -1, sk: '#e8c0a0', hair: '#3a2a3a', hs: 'long', c1: '#7a4aa0', c2: '#e8d890', c3: '#3a2a4a', apron: '#f0e8dc', prop: 'scroll', lines: ['Kain dari Lembah Lentera terkenal halus. Sayang, pelanggan terbesarku para penjelajah dungeon, dan mereka jarang pulang.', 'Kalau bajumu robek, jangan sungkan datang. Tapi zirahmu urusan Borin, ya!'] });
    mkN({ n: 'Doran, Penebang Kayu', x: 1494, y: 456, fc: -1, sk: '#c0845c', hair: '#5a3a1a', beard: '#5a3a1a', hat: 'cap', hc: '#6a5a3a', c1: '#8a4a3a', c2: '#c9a95a', c3: '#3a3028', prop: 'hammer', lines: ['Kayu untuk rumah-rumah baru di sisi timur ini semuanya dari hutan, tentu saja bukan dari Hutan Bisikan. Itu terlarang!', 'Desa makin ramai. Dulu cuma segelintir rumah, sekarang sudah seperti kota kecil.'] });
    mkN({ n: 'Sela, Tukang Taman', x: 1415, y: 704, fc: 1, sk: '#d9a07a', hair: '#8a3a2a', hs: 'bun', hat: 'straw', c1: '#4a8a5a', c2: '#e8d890', c3: '#3a4a2a', apron: '#f0e8dc', prop: 'basket', lines: ['Bunga-bunga ini kutanam sendiri. Mekarnya paling indah menjelang senja.', 'Kalau kau menemukan bunga kristal di hutan, Mira pasti mau membelinya. Aku cuma menanam bunga biasa.'] });
    mkN({ n: 'Bima, Peternak', x: 872, y: 846, fc: 1, sk: '#d0986c', hair: '#3a2a1a', hat: 'straw', c1: '#5a8a4a', c2: '#c9a95a', c3: '#4a3a2a', prop: 'pitchfork', lines: ['Ayam-ayamku sering kabur ke jalan. Tolong jangan diinjak, ya!', 'Rumah-rumah di lorong selatan ini baru dibangun. Dulu semuanya cuma padang rumput.'] });

    V.crit = []; for (let i = 0; i < 5; i++) V.crit.push({ kind: 'chicken', x: 150 + rng() * 60, y: 450 + rng() * 40, fc: rng() < .5 ? -1 : 1, tm: rng() * 3, st: 0, vx: 0, vy: 0, ph: rng() * 6 });
    V.crit.push({ kind: 'cat', x: 292, y: 322, fc: 1, tm: 2, st: 0, vx: 0, vy: 0, ph: 1 }, { kind: 'dog', x: 840, y: 650, fc: -1, tm: 1, st: 0, vx: 0, vy: 0, ph: 2 });
    for (let i = 0; i < 4; i++) V.crit.push({ kind: 'chicken', x: 900 + rng() * 50, y: 840 + rng() * 14, fc: rng() < .5 ? -1 : 1, tm: rng() * 3, st: 0, vx: 0, vy: 0, ph: rng() * 6 });
    V.crit.push({ kind: 'cat', x: 1530, y: 422, fc: 1, tm: 1, st: 0, vx: 0, vy: 0, ph: 3 }, { kind: 'dog', x: 1400, y: 440, fc: 1, tm: 2, st: 0, vx: 0, vy: 0, ph: 4 }, { kind: 'cat', x: 380, y: 840, fc: -1, tm: 2, st: 0, vx: 0, vy: 0, ph: 5 });
    V.dyn = [...V.npcs.filter(n => !n.sign).map((n, i) => ({ n, i, get y() { return n.y } })), ...V.crit.map(c => ({ c, get y() { return c.y } }))];
    V.ff = []; for (let i = 0; i < 30; i++) V.ff.push({ bx: rng(), by: rng(), sx: 3 + rng() * 6, ph: rng() * 6 });
    for (let i = 0; i < 24; i++) { const an = rng() * TAU, dd = Math.sqrt(rng()); V.sparks.push({ x: POND2.x + Math.cos(an) * dd * (POND2.rx - 8), y: POND2.y + Math.sin(an) * dd * (POND2.ry - 6), ph: rng() * 6 }) }
    V.smoke = [];
  };

  V.tick = function (dt) {
    const T = WORLD.TR; if (T.on) return;

    for (const n of V.npcs) {
      if (!n.path) continue;
      // [animasi-npc] gerak halus: akselerasi/perlambatan, jeda acak, belokan melengkung, langkah mengikuti kecepatan
      if (n._base === undefined) { n._base = (n.kid ? 52 : 32) + Math.random() * 12; n.vx = n.vy = 0; n.spd = 0; n.wait = Math.random() * 1.5; n.stopHere = 0; n._ph = Math.random() * 6.28; n.jx = n.jy = 0 }
      const ddt = Math.min(dt, .05), talk = dlg && dlg.n === n, tg = n.path[n.pi], dx = tg[0] + n.jx - n.x, dy = tg[1] + n.jy - n.y, d = Math.hypot(dx, dy);
      let want = 0;
      if (talk) { }
      else if (n.wait > 0) { n.wait -= ddt; if (n._look && n.wait < n._wl) { n.fc = -(n.fc || 1); n._look = 0 } }
      else if (d < (n.stopHere ? 4 : 16)) {
        const stop = n.stopHere;
        n.pi = (n.pi + 1) % n.path.length; n.jx = (Math.random() - .5) * 18; n.jy = (Math.random() - .5) * 10;
        n.stopHere = Math.random() < (n.kid ? .25 : .4) ? 1 : 0;
        if (stop) { n.wait = n.kid ? .2 + Math.random() * .8 : 1 + Math.random() * 2.6; n._wl = n.wait * .5; n._look = Math.random() < .6 ? 1 : 0 }
      }
      else want = n._base * (n.stopHere ? Math.min(1, .25 + d / 48) : Math.min(1, .65 + d / 90));
      const k = Math.min(1, ddt * (talk ? 10 : want > 0 ? 4.5 : 7)), ux = d > .001 ? dx / d * want : 0, uy = d > .001 ? dy / d * want : 0;
      n.vx += (ux - n.vx) * k; n.vy += (uy - n.vy) * k; n.x += n.vx * ddt; n.y += n.vy * ddt;
      n.spd = Math.hypot(n.vx, n.vy); n.mv = n.spd > 3 ? 1 : 0; n._ph += n.spd * ddt * .34;
      if (Math.abs(n.vx) > 7) n.fc = n.vx > 0 ? 1 : -1
    }

    for (const c of V.crit) {
      c.tm -= dt; const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (c.st === 0) { if (c.tm <= 0) { c.tm = 1 + Math.random() * 2.5; if (Math.random() < .5) { c.st = 1; const a = Math.random() * TAU, sp = c.kind === 'dog' ? 22 : 18; c.vx = Math.cos(a) * sp; c.vy = Math.sin(a) * sp * .7; c.fc = c.vx > 0 ? 1 : -1; c.tm = .6 + Math.random() } } if (d < 40 && c.kind === 'chicken') { c.st = 1; c.tm = .5; const a = Math.atan2(c.y - p.y, c.x - p.x); c.vx = Math.cos(a) * 50; c.vy = Math.sin(a) * 40; c.fc = c.vx > 0 ? 1 : -1 } }
      else { const nx = c.x + c.vx * dt, ny = c.y + c.vy * dt; if (!blk(nx, ny, 3)) { c.x = nx; c.y = ny } else { c.vx *= -1; c.vy *= -1 } if (c.tm <= 0) { c.st = 0; c.tm = 1 + Math.random() * 2 } }
    }
    if (T.cool <= 0 && p.x < 26 && Math.abs(p.y - 382) < 42 && p.vx < -8) { const Fo = WORLD.AREAS.forest; WORLD.start('gate', { to: 'forest', dx: -1, spawn: [Fo.w - 96, 348] }); msg('Kembali ke Hutan Bisikan...') }
  };

  function drawObj(o) {
    if (o.draw) { o.draw(o); return }
    if (o.img) {
      g.drawImage(o.img, o.x - o.ox, o.y - o.oy);
      if (o.mill) { const [mx, my] = o.mill; g.save(); g.translate(mx, my); g.rotate(t * .35); for (let i = 0; i < 4; i++) { g.save(); g.rotate(i * Math.PI / 2); g.fillStyle = OLC; g.fillRect(-2, -34, 4, 34); g.fillStyle = '#7a5230'; g.fillRect(-1, -33, 2, 32); g.fillStyle = OLC; g.fillRect(2, -34, 12, 24); g.fillStyle = '#e8dcc0'; g.fillRect(3, -33, 10, 22); g.fillStyle = '#c8bc9c'; g.fillRect(3, -33, 2, 22); g.fillStyle = '#a89c7c'; g.fillRect(3, -22, 10, 1); g.restore() } g.fillStyle = OLC; g.fillRect(-4, -4, 8, 8); g.fillStyle = '#8a6a3a'; g.fillRect(-3, -3, 6, 6); g.restore() }
      return
    }
    if (o.fountain) {
      const X = o.x, Y = o.y, P2 = 6.2832, E = (cx, cy, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.fill() }, Rr = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(a), Math.round(b), w, h) };
      const post = (px, py) => { Rr(px - 3, py - 3, 6, 3, OLC); Rr(px - 2, py - 3, 4, 2, '#7a766c'); Rr(px - 2, py - 18, 4, 16, OLC); Rr(px - 1, py - 18, 2, 15, '#6a665c'); Rr(px - 4, py - 25, 8, 8, OLC); Rr(px - 3, py - 24, 6, 6, '#ffd870'); Rr(px - 3, py - 24, 2, 2, '#fff3b8'); Rr(px - 5, py - 28, 10, 3, OLC); Rr(px - 4, py - 27, 8, 1, '#a8483a'); const f = .22 + .06 * Math.sin(t * 7 + px); g.save(); g.globalCompositeOperation = 'lighter'; const q = g.createRadialGradient(px, py - 21, 1, px, py - 21, 22); q.addColorStop(0, 'rgba(255,200,110,' + f + ')'); q.addColorStop(1, 'rgba(255,200,110,0)'); g.fillStyle = q; g.fillRect(px - 22, py - 43, 44, 44); g.restore() };
      E(X, Y + 8, 50, 21, 'rgba(0,0,0,.32)'); post(X - 26, Y - 17); post(X + 26, Y - 17);
      E(X, Y + 6, 46, 18, OLC); E(X, Y + 5, 44, 16, '#6a665c'); E(X, Y + 3, 44, 16, '#8a867a');
      E(X, Y + 2, 37, 13, OLC); Rr(X - 37, Y - 8, 74, 10, OLC); Rr(X - 36, Y - 8, 72, 10, '#7e7a70'); Rr(X - 36, Y - 8, 72, 2, '#9a968a'); E(X, Y + 2, 36, 12.5, '#7e7a70');
      for (let i = -8; i <= 8; i++) { const px = X + i * 4.4, yy = Y - 8 + 12.5 * Math.sqrt(Math.max(0, 1 - (i * 4.4 / 36) ** 2)); Rr(px, yy, 1, 10, '#5e5a50') }
      E(X, Y - 8, 38, 14, OLC); E(X, Y - 8, 36.5, 13, '#a29e92'); E(X, Y - 8, 33, 11.5, '#7e7a70'); E(X, Y - 8, 31, 10, '#2a78a0'); E(X, Y - 8, 28, 8.6, '#3a9ac8'); E(X - 4, Y - 9, 18, 5, '#6ac8f0');
      for (let i = 0; i < 7; i++) Rr(X + Math.sin(t * 1.2 + i * 1.7) * 21, Y - 8 + Math.cos(t * 1.05 + i * 2.3) * 6.5, 5, 1, 'rgba(255,255,255,.5)');
      E(X - 21, Y - 6, 4, 1.6, '#2f7a3a'); E(X - 20, Y - 6.5, 2.5, 1, '#4aa04a'); E(X + 22, Y - 11, 3.5, 1.4, '#2f7a3a'); Rr(X + 22, Y - 12, 2, 1, '#ff9ac0');
      if (Math.sin(t * 2.3) > .75) Rr(X + 12, Y - 5, 2, 2, '#ffd34d'); if (Math.sin(t * 1.7 + 2) > .8) Rr(X - 14, Y - 11, 2, 2, '#ffd34d');
      g.strokeStyle = 'rgba(220,250,255,.75)'; for (let i = 0; i < 3; i++) { const k = (t * .5 + i / 3) % 1; g.globalAlpha = (1 - k) * .9; g.beginPath(); g.ellipse(X, Y - 8, 6 + k * 24, 2.4 + k * 8.5, 0, 0, 7); g.stroke() } g.globalAlpha = 1;
      Rr(X - 11, Y - 16, 22, 9, OLC); Rr(X - 10, Y - 15, 20, 8, '#8a867a'); Rr(X - 10, Y - 15, 6, 8, '#a29e92'); Rr(X + 4, Y - 15, 6, 8, '#6a665c'); Rr(X - 12, Y - 18, 24, 4, OLC); Rr(X - 11, Y - 17, 22, 2, '#b4aea0');
      Rr(X - 5, Y - 32, 10, 16, OLC); Rr(X - 4, Y - 31, 8, 15, '#9a9488'); Rr(X - 4, Y - 31, 3, 15, '#c8c2b4'); Rr(X + 1, Y - 31, 3, 15, '#7a766c');
      E(X, Y - 26, 11, 5, OLC); E(X, Y - 26, 10, 4, '#7a766c'); E(X, Y - 33, 20, 7.5, OLC); E(X, Y - 33.5, 19, 6.5, '#b4aea0'); E(X, Y - 33, 17, 5.4, '#7e7a70'); E(X, Y - 33.5, 15.5, 4.6, '#3a9ac8'); E(X - 2, Y - 34, 9, 2.4, '#8ae0ff');
      Rr(X - 3, Y - 50, 6, 17, OLC); Rr(X - 2, Y - 49, 4, 16, '#9a9488'); Rr(X - 2, Y - 49, 1, 16, '#c8c2b4');
      E(X, Y - 49, 11, 4, OLC); E(X, Y - 50, 10, 3.2, '#b4aea0'); E(X, Y - 50, 8, 2.4, '#5ab8e0');
      for (let i = 0; i < 16; i++) { const a = i * 2.4, k = ((t * .75 + i / 16) % 1) * .62, d = 15 + k * 14, px = X + Math.cos(a) * d, py = Y - 33 + Math.sin(a) * 5.2 * (d / 15) + k * k * 70, al = 1 - k * 1.1; if (py > Y - 8) continue; g.fillStyle = 'rgba(205,245,255,' + Math.max(.1, al) + ')'; g.fillRect(Math.round(px), Math.round(py), 2, 2 + (k > .3 ? 2 : 0)) }
      for (let i = 0; i < 12; i++) { const a = i * 2.7 + 1, k = ((t * .9 + i / 12) % 1) * .85, d = 9 + k * 7, px = X + Math.cos(a) * d, py = Y - 50 + Math.sin(a) * 3.2 + k * k * 24; g.fillStyle = 'rgba(205,245,255,' + Math.max(.1, 1 - k) + ')'; g.fillRect(Math.round(px), Math.round(py), 2, 2) }
      const cy = Y - 66 + Math.sin(t * 2) * 2.5, sh = .5 + .5 * Math.sin(t * 3.1), sh2 = .5 + .5 * Math.sin(t * 5.3 + 1);
      g.save(); g.globalCompositeOperation = 'lighter';
      const gq = g.createRadialGradient(X, cy, 2, X, cy, 74); gq.addColorStop(0, 'rgba(170,244,255,' + (.62 + .18 * sh) + ')'); gq.addColorStop(.35, 'rgba(100,205,255,' + (.24 + .08 * sh) + ')'); gq.addColorStop(1, 'rgba(90,170,255,0)'); g.fillStyle = gq; g.fillRect(X - 74, cy - 74, 148, 148);
      const bm = g.createLinearGradient(0, cy, 0, Y - 34); bm.addColorStop(0, 'rgba(150,236,255,' + (.3 + .1 * sh) + ')'); bm.addColorStop(1, 'rgba(150,236,255,0)'); g.fillStyle = bm; g.beginPath(); g.moveTo(X - 5, cy + 6); g.lineTo(X + 5, cy + 6); g.lineTo(X + 16, Y - 34); g.lineTo(X - 16, Y - 34); g.fill();
      for (let i = 0; i < 8; i++) { const a = t * .5 + i * P2 / 8, L = 30 + (i % 2 ? 0 : 16) + 12 * Math.sin(t * 2 + i * 1.3); g.fillStyle = 'rgba(205,249,255,' + (.15 + .1 * sh2) + ')'; g.beginPath(); g.moveTo(X + Math.cos(a - .07) * 7, cy + Math.sin(a - .07) * 7); g.lineTo(X + Math.cos(a) * L, cy + Math.sin(a) * L); g.lineTo(X + Math.cos(a + .07) * 7, cy + Math.sin(a + .07) * 7); g.fill() }
      const fl = 11 + 9 * sh; g.fillStyle = 'rgba(238,253,255,' + (.65 + .3 * sh2) + ')'; g.fillRect(Math.round(X - fl), Math.round(cy), Math.round(fl * 2), 1); g.fillRect(Math.round(X), Math.round(cy - fl * 1.25), 1, Math.round(fl * 2.5));
      g.restore();
      g.fillStyle = OLC; g.beginPath(); g.moveTo(X, cy - 13); g.lineTo(X + 8, cy); g.lineTo(X, cy + 13); g.lineTo(X - 8, cy); g.fill();
      g.fillStyle = '#7ae0ff'; g.beginPath(); g.moveTo(X, cy - 11); g.lineTo(X + 6, cy); g.lineTo(X, cy + 11); g.lineTo(X - 6, cy); g.fill();
      g.fillStyle = '#3ab4e8'; g.beginPath(); g.moveTo(X, cy - 11); g.lineTo(X + 6, cy); g.lineTo(X, cy + 11); g.fill();
      g.fillStyle = 'rgba(216,251,255,' + (.8 + .2 * sh) + ')'; g.beginPath(); g.moveTo(X, cy - 11); g.lineTo(X - 6, cy); g.lineTo(X, cy + 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,' + (.35 + .6 * sh2) + ')'; g.fillRect(Math.round(X - 3), Math.round(cy - 6), 2, 4); g.fillRect(Math.round(X + 2 + Math.sin(t * 3) * 1), Math.round(cy + 3), 1, 3);
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 10; i++) { const a = t * 1.4 + i * .63, r = 14 + 4 * Math.sin(t * 2 + i); g.fillStyle = 'rgba(215,251,255,' + (.45 + .55 * Math.sin(t * 5 + i)) + ')'; g.fillRect(Math.round(X + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * .5), i % 3 ? 1 : 2, i % 3 ? 1 : 2) }
      for (let i = 0; i < 8; i++) { const k = (t * .5 + i / 8) % 1; g.fillStyle = 'rgba(190,245,255,' + (1 - k) * .8 + ')'; g.fillRect(Math.round(X + Math.sin(i * 2.1 + t) * (5 + k * 10)), Math.round(cy + 12 + k * (Y - 12 - cy)), 1, 2) }
      g.restore();
      post(X - 46, Y + 2); post(X + 46, Y + 2); return
    }
    if (o.n) { person(o.n, o.i); return }
    if (o.c) {
      const c = o.c, X = Math.round(c.x), Y = Math.round(c.y), mvg = c.st === 1, hop = mvg ? Math.abs(Math.sin(t * 12 + c.ph)) * 1.5 : 0; g.save(); g.translate(X, Y); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-5, 1, 10, 2); g.translate(0, -Math.round(hop)); g.scale(c.fc, 1); const R = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(a, b, w, h) };
      if (c.kind === 'chicken') { const peck = !mvg && Math.sin(t * 5 + c.ph) > .6 ? 2 : 0; R(-5, -7, 10, 8, '#1a1210'); R(-4, -6, 8, 6, '#f4efe6'); R(-4, -6, 8, 2, '#fff'); R(-5, -5, 3, 4, '#d8d0c0'); R(2, -10 + peck, 5, 5, '#1a1210'); R(3, -9 + peck, 3, 3, '#f4efe6'); R(3, -12 + peck, 3, 3, '#e0283e'); R(6, -8 + peck, 2, 1, '#e8a020'); R(4, -9 + peck, 1, 1, '#1a1210'); R(-1, 0, 1, 3, '#e8a020'); R(2, 0, 1, 3, '#e8a020'); R(-7, -8, 3, 3, '#f4efe6') }
      else if (c.kind === 'cat') { const sit = !mvg; R(-5, sit ? -8 : -6, 10, sit ? 9 : 6, '#1a1210'); R(-4, sit ? -7 : -5, 8, sit ? 8 : 5, '#d8883a'); R(-4, sit ? -7 : -5, 8, 2, '#f0a85a'); R(-1, sit ? -5 : -3, 2, 4, '#a8601a'); R(2, -12, 6, 6, '#1a1210'); R(3, -11, 4, 4, '#d8883a'); R(2, -14, 2, 3, '#1a1210'); R(6, -14, 2, 3, '#1a1210'); R(4, -9, 1, 1, '#4ad04a'); R(6, -9, 1, 1, '#4ad04a'); R(-8, sit ? -4 : -6, 4, 2, '#1a1210'); R(-8 + (Math.sin(t * 3) > 0 ? 0 : 1), sit ? -5 : -7, 3, 2, '#d8883a') }
      else { R(-7, -7, 14, 8, '#1a1210'); R(-6, -6, 12, 6, '#a8743c'); R(-6, -6, 12, 2, '#c8944c'); R(5, -11, 6, 7, '#1a1210'); R(6, -10, 4, 5, '#a8743c'); R(5, -13, 2, 4, '#1a1210'); R(5, -12, 1, 3, '#5a3a1c'); R(10, -8, 2, 2, '#1a1210'); R(7, -9, 1, 1, '#1a1210'); R(-9, -9 + Math.round(Math.sin(t * 9)), 3, 3, '#a8743c'); R(-5, 0, 2, 3, '#1a1210'); R(3, 0, 2, 3, '#1a1210'); R(-5, 0, 1, 2, '#a8743c'); R(3, 0, 1, 2, '#a8743c') }
      g.restore()
    }
  }
  function renderList() {
    const x0 = camX - 80, x1 = camX + W / CAM_Z + 80, y0 = camY - 10, y1 = camY + H / CAM_Z + 100, L = [];
    for (const o of V.objs) { if (o.x < x0 || o.x > x1 || o.y < y0 || o.y - (o.oy || 40) > y1) continue; L.push(o) }
    for (const o of V.dyn) { const s = o.n || o.c; if (s.x < x0 || s.x > x1 || s.y < y0 || s.y > y1) continue; L.push(o.n ? { y: o.n.y, n: o.n, i: o.i } : { y: o.c.y, c: o.c }) }
    L.sort((a, b) => a.y - b.y); return L
  }
  V.env = function () {
    const vx0 = camX - 20, vx1 = camX + W / CAM_Z + 20, vy0 = camY - 20, vy1 = camY + H / CAM_Z + 20;
    g.save(); g.globalCompositeOperation = 'lighter'; for (const s of V.sparks) { if (s.x < vx0 || s.x > vx1 || s.y < vy0 || s.y > vy1) continue; const a = Math.max(0, Math.sin(t * 2.2 + s.ph)); if (a < .3) continue; g.fillStyle = 'rgba(255,230,200,' + (a * .5) + ')'; g.fillRect(Math.round(s.x), Math.round(s.y), 3, 1) } g.restore();
  };
  V.drawBack = function () { V._L = renderList(); const py = p.y + 3; for (const o of V._L) if (o.y <= py) drawObj(o) };
  V.drawFront = function () {
    const py = p.y + 3; for (const o of V._L) if (o.y > py) drawObj(o);

    const vw = W / CAM_Z, vh = H / CAM_Z;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const o of V.objs) { if (o.x < camX - 100 || o.x > camX + vw + 100 || o.y < camY - 60 || o.y > camY + vh + 140) continue; if (o.glow) lightL(o.x, o.y - 32, 52 + Math.sin(t * 7 + o.x) * 2, '255,200,110', .36); if (o.lamp) o.lamp.forEach(([a, b]) => lightL(a, b + 4, 26, '255,200,110', .2)); if (o.forge) { lightL(o.forge[0], o.forge[1], 46 + Math.sin(t * 12) * 4, '255,120,40', .4) } }
    g.restore();

    for (const o of V.objs) { if (o.x < camX - 100 || o.x > camX + vw + 100 || o.y < camY - 60 || o.y > camY + vh + 140) continue; const sm = o.chim || (o.forge ? [o.forge[0] - 4, o.forge[1] - 26] : null); if (!sm) continue; for (let i = 0; i < 4; i++) { const k = (t * .3 + i / 4 + (o.x % 7) * .1) % 1; g.globalAlpha = (1 - k) * .45; g.fillStyle = '#d8d4dc'; const s = 3 + k * 5; g.fillRect(Math.round(sm[0] + Math.sin(k * 5 + i) * 4 + k * 10), Math.round(sm[1] - k * 34), s, s) } g.globalAlpha = 1 }

    g.font = '8px monospace'; for (const n of NP) { const d = dist(n, p); if (d < 90) { txt(n.n.split(',')[0], n.x, n.y - (n.kid ? 24 : 28), '#ffe9a8', 'center'); if (d < (n.rng || 36) && !dlg) txt('[G] ' + (n.verb || (n.shop ? 'Dagang' : 'Bicara')), n.x, n.y - (n.kid ? 34 : 38), '#fff', 'center') } if (n.fresh && !dlg) { g.fillStyle = '#ffd34d'; const by = Math.sin(t * 4); g.fillRect(Math.round(n.x) - 1, Math.round(n.y - 38 + by), 3, 6); g.fillRect(Math.round(n.x) - 1, Math.round(n.y - 30 + by), 3, 2) } }

    g.save(); g.globalCompositeOperation = 'lighter'; for (const f of V.ff) { const X = camX + (((f.bx * vw - t * f.sx * .5 - camX * .15) % vw) + vw) % vw, Y = camY + (((f.by * vh + Math.sin(t * .8 + f.ph) * 12) % vh) + vh) % vh, a = .3 + .5 * Math.max(0, Math.sin(t * 2 + f.ph)); g.fillStyle = 'rgba(255,225,140,' + a + ')'; g.fillRect(Math.round(X), Math.round(Y), 2, 2) } g.restore();

    g.fillStyle = 'rgba(120,50,110,.10)'; g.fillRect(camX, camY, vw, vh); g.fillStyle = 'rgba(255,150,60,.05)'; g.fillRect(camX, camY, vw, vh * .5);
  };
})();

/* ===== TOKO: beli, jual, upgrade ===== */
(function () {
  'use strict';
  const { S: W_ } = WORLD;
  const PX = rows => { let d = ''; rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] == '#') d += 'M' + x + ' ' + y + 'h1v1h-1z' }); return '<svg viewBox="0 0 ' + rows[0].length + ' ' + rows.length + '" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="' + d + '"/></svg>' };
  const IC = {
    potion: PX(['..####..', '...##...', '...##...', '..####..', '.######.', '.######.', '.######.', '..####..']),
    sword: PX(['......##', '.....###', '....###.', '#..###..', '.####...', '..##....', '.#.##...', '#...#...']),
    shield: PX(['########', '########', '########', '########', '.######.', '.######.', '..####..', '...##...']),
    gem: PX(['..####..', '.######.', '########', '########', '.######.', '..####..', '...##...', '........']),
    bolt: PX(['....##..', '...##...', '..###...', '.######.', '...###..', '...##...', '..##....', '..#.....']),
    bed: PX(['........', '#.......', '#.......', '########', '########', '#######.', '#.....#.', '#.....#.']),
    bowl: PX(['..#.#...', '...#.#..', '........', '########', '########', '.######.', '..####..', '........']),
    egg: PX(['...##...', '..####..', '.######.', '.######.', '########', '########', '.######.', '..####..']),
    bread: PX(['........', '..####..', '.######.', '########', '########', '########', '.######.', '........']),
    herb: PX(['..#..#..', '.###.##.', '..#####.', '...###..', '..####..', '...##...', '...##...', '...#....']),
    mush: PX(['..####..', '.######.', '########', '########', '..####..', '...##...', '...##...', '...##...']),
    flower: PX(['..#..#..', '.######.', '..####..', '.######.', '..#..#..', '...##...', '...##...', '...##...']),
    coin: PX(['..####..', '.######.', '########', '###..###', '###..###', '########', '.######.', '..####..'])
  };
  const SELL = { herb: ['Herba Hutan', 8, '#58c05a'], mush: ['Jamur Cahaya', 12, '#ff7a8a'], flower: ['Bunga Kristal', 10, '#7ab8ff'] };
  const CW = [120, 240, 400, 650, 1000], CA = [100, 200, 350, 550, 850];
  const ITEMS = {
    potion: { name: 'Ramuan Penyembuh', desc: 'Pulihkan 60 HP saat diminum [R]. Maksimal 5.', ic: 'potion', col: '#ff6b8a', price: () => 30, can: () => p.pot >= 5 ? 'Penuh' : null, buy() { p.pot++ } },
    potion3: { name: 'Paket Ramuan x3', desc: 'Tiga ramuan sekaligus, lebih hemat.', ic: 'potion', col: '#ff9ac0', price: () => 80, can: () => p.pot >= 5 ? 'Penuh' : null, buy() { p.pot = Math.min(5, p.pot + 3) } },
    elixir: { name: 'Elixir Bara', desc: 'Langsung mengisi penuh bar ULT.', ic: 'bolt', col: '#ffd34d', price: () => 90, can: () => null, buy() { try { ultAdd(ULT_MAX) } catch (e) { } } },
    crystal: { name: 'Kristal Atribut', desc: '+1 poin atribut. Bagi lewat Kitab Status Ketua Orin.', ic: 'gem', col: '#b48cff', price: () => 180 + 90 * (W_.bought.crystal | 0), can: () => null, buy() { pts++; W_.bought.crystal = (W_.bought.crystal | 0) + 1 } },
    weapon: { name: () => 'Asah Senjata ' + (W_.gear.w >= 5 ? 'MAKS' : 'Lv ' + (W_.gear.w + 1)), desc: () => 'Damage semua senjata +8% per level. Sekarang: +' + W_.gear.w * 8 + '%.', ic: 'sword', col: '#cfd6e2', price: () => CW[W_.gear.w] || 0, can: () => W_.gear.w >= 5 ? 'Maks' : null, buy() { W_.gear.w++ } },
    armor: { name: () => 'Tempa Zirah ' + (W_.gear.a >= 5 ? 'MAKS' : 'Lv ' + (W_.gear.a + 1)), desc: () => 'Damage diterima -6% per level. Sekarang: -' + W_.gear.a * 6 + '%.', ic: 'shield', col: '#8fb8ff', price: () => CA[W_.gear.a] || 0, can: () => W_.gear.a >= 5 ? 'Maks' : null, buy() { W_.gear.a++ } },
    rest: { name: 'Bermalam', desc: 'HP, stamina, dan semua skill pulih penuh.', ic: 'bed', col: '#8fe8ff', price: () => 25, can: () => null, buy() { p.hp = mhp(); p.st = 100; p.sc = [0, 0, 0]; p.ec = 0; try { SFX.potion(); SFX.focus() } catch (e) { } } },
    soup: { name: 'Sup Daging Hanna', desc: 'Pulihkan HP sepenuhnya.', ic: 'bowl', col: '#ffb070', price: () => 40, can: () => p.hp >= mhp() ? 'HP penuh' : null, buy() { p.hp = mhp(); try { SFX.potion() } catch (e) { } } },
    egg: { name: 'Telur Rebus', desc: 'Pulihkan 35 HP.', ic: 'egg', col: '#f4efe6', price: () => 8, can: () => p.hp >= mhp() ? 'HP penuh' : null, buy() { p.hp = Math.min(mhp(), p.hp + 35); try { SFX.potion() } catch (e) { } } },
    bread: { name: 'Roti Madu', desc: 'Pulihkan 70 HP.', ic: 'bread', col: '#e8b060', price: () => 14, can: () => p.hp >= mhp() ? 'HP penuh' : null, buy() { p.hp = Math.min(mhp(), p.hp + 70); try { SFX.potion() } catch (e) { } } }
  };
  const SHOPS = {
    alchemist: { title: 'TOKO RAMUAN MIRA', sub: 'Membeli bahan hutan dengan harga +25%', mul: 1.25, stock: ['potion', 'potion3', 'elixir', 'crystal'] },
    general: { title: 'SERBA ADA TAMSIN', sub: 'Apa pun ada, apa pun kubeli!', mul: 1, stock: ['potion', 'potion3'] },
    smith: { title: 'BENGKEL BORIN', sub: 'Baja terbaik di Lembah Lentera', mul: 0, stock: ['weapon', 'armor'] },
    inn: { title: 'PENGINAPAN RUSA EMAS', sub: 'Hangat, bersih, dan kenyang', mul: 0, stock: ['rest', 'soup'] },
    food: { title: 'WARUNG NENEK WREN', sub: 'Masakan rumahan, selalu hangat', mul: 0, stock: ['egg', 'bread'] }
  };
  const css = document.createElement('style'); css.textContent = `
  #wshop{position:fixed;inset:0;z-index:99998;display:none;align-items:center;justify-content:center;background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0 2px,transparent 2px 4px),radial-gradient(ellipse at 50% 35%,rgba(110,70,30,.5),rgba(6,4,10,.94) 75%);font-family:'Press Start 2P','Courier New',monospace;color:#f1e6cf;padding:env(safe-area-inset-top,0) 14px env(safe-area-inset-bottom,0);image-rendering:pixelated}
  #wshop.on{display:flex}
  #wshop .bx{--b:#c2a06b;width:min(640px,96vw);max-height:92vh;overflow:auto;padding:clamp(12px,2.6vh,22px) clamp(12px,2.6vw,22px);background-color:#1e1710;background-image:conic-gradient(rgba(255,255,255,.03) 25%,transparent 0 50%,rgba(255,255,255,.03) 0 75%,transparent 0);background-size:8px 8px;box-shadow:0 -4px 0 0 var(--b),0 4px 0 0 var(--b),-4px 0 0 0 var(--b),4px 0 0 0 var(--b),inset 4px 4px 0 rgba(255,255,255,.07),inset -4px -4px 0 rgba(0,0,0,.45),0 14px 0 0 rgba(0,0,0,.5);scrollbar-width:thin;scrollbar-color:#c2a06b #1e1710}
  #wshop h2{margin:0;text-align:center;font:400 clamp(11px,2.8vh,17px)/1.4 'Press Start 2P',monospace;color:#ffd34d;text-shadow:3px 3px 0 #7a2a0c,5px 5px 0 #000;letter-spacing:.06em}
  #wshop .sb{text-align:center;margin:6px 0 10px;font:400 clamp(7px,1.4vh,9px)/1.5 'Press Start 2P',monospace;color:#b8a888}
  #wshop .gd{display:flex;justify-content:center;align-items:center;gap:8px;margin:0 auto 12px;padding:8px 12px;width:max-content;background:#120d08;box-shadow:0 0 0 3px #4a3a22;font-size:clamp(9px,1.8vh,12px);color:#ffe28a}
  #wshop .gd svg{width:16px;height:16px;color:#f2c230}
  #wshop .sec{display:flex;align-items:center;gap:8px;margin:12px 0 8px;font-size:clamp(7px,1.4vh,9px);color:#a89878;letter-spacing:.1em}
  #wshop .sec::before,#wshop .sec::after{content:"";flex:1;height:3px;background:repeating-linear-gradient(90deg,#5a4a30 0 6px,transparent 6px 10px)}
  #wshop .it{display:flex;align-items:center;gap:10px;margin:0 0 8px;padding:9px 10px;background:#2a2016;box-shadow:0 0 0 3px #4a3a22}
  #wshop .ic{flex:0 0 34px;height:34px;display:flex;align-items:center;justify-content:center;background:#120d08;box-shadow:0 0 0 2px #3a2c1a}
  #wshop .ic svg{width:24px;height:24px}
  #wshop .tx{flex:1;min-width:0;text-align:left}
  #wshop .tx b{display:block;font-weight:400;font-size:clamp(8px,1.6vh,10px);color:#fff3d0;margin-bottom:4px;line-height:1.4}
  #wshop .tx small{display:block;font-size:clamp(6px,1.25vh,8px);color:#a89878;line-height:1.6}
  #wshop button{font:400 clamp(7px,1.4vh,9px)/1 'Press Start 2P',monospace;cursor:pointer;color:#fff3d0;background:#5a7a2a;border:0;padding:9px 10px;box-shadow:inset -3px -3px 0 rgba(0,0,0,.4),inset 3px 3px 0 rgba(255,255,255,.2),0 0 0 2px #1a2a0a;white-space:nowrap}
  #wshop button:active{transform:translateY(1px)}
  #wshop button.sl{background:#8a5a22;box-shadow:inset -3px -3px 0 rgba(0,0,0,.4),inset 3px 3px 0 rgba(255,255,255,.2),0 0 0 2px #2a1a0a}
  #wshop button:disabled{background:#3a3a3a;color:#777;cursor:not-allowed;box-shadow:inset -3px -3px 0 rgba(0,0,0,.4),0 0 0 2px #1a1a1a}
  #wshop .pr{display:flex;flex-direction:column;gap:6px;align-items:flex-end}
  #wshop .pr em{font-style:normal;color:#ffe28a;font-size:clamp(7px,1.5vh,10px)}
  #wshop .ft{display:flex;justify-content:center;margin-top:14px}
  #wshop .ft button{background:#7a2a2a;padding:11px 22px}
  #wshop .hint{text-align:center;margin-top:10px;font-size:7px;color:#6a5a40}`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'wshop'; document.body.appendChild(el);
  let cur = null, on = false;
  const val = (v) => typeof v === 'function' ? v() : v;
  function render() {
    const S = SHOPS[cur]; let h = '<div class="bx"><h2>' + S.title + '</h2><div class="sb">' + S.sub + '</div><div class="gd"><i style="display:flex">' + IC.coin + '</i><span>' + W_.gold + ' EMAS</span></div>';
    h += '<div class="sec">BELI</div>';
    S.stock.forEach(id => {
      const it = ITEMS[id], pr = it.price(), why = it.can(), max = (id === 'weapon' && W_.gear.w >= 5) || (id === 'armor' && W_.gear.a >= 5), dis = !!why || W_.gold < pr;
      h += '<div class="it"><div class="ic" style="color:' + it.col + '">' + IC[it.ic] + '</div><div class="tx"><b>' + val(it.name) + '</b><small>' + val(it.desc) + '</small></div><div class="pr">' + (max ? '' : '<em>' + pr + ' G</em>') + '<button data-b="' + id + '"' + (dis ? ' disabled' : '') + '>' + (why ? why.toUpperCase() : (W_.gold < pr ? 'KURANG' : 'BELI')) + '</button></div></div>'
    });
    if (S.mul > 0) {
      h += '<div class="sec">JUAL BAHAN HUTAN</div>'; let any = 0;
      Object.keys(SELL).forEach(k => { const n = W_.inv[k] | 0, v = Math.round(SELL[k][1] * S.mul); any += n; h += '<div class="it"><div class="ic" style="color:' + SELL[k][2] + '">' + IC[k] + '</div><div class="tx"><b>' + SELL[k][0] + ' x' + n + '</b><small>Harga ' + v + ' G per buah</small></div><div class="pr"><button class="sl" data-s="' + k + '|1"' + (n ? '' : ' disabled') + '>JUAL 1</button><button class="sl" data-s="' + k + '|all"' + (n ? '' : ' disabled') + '>SEMUA +' + n * v + '</button></div></div>' });
      if (!any) h += '<div class="sb">Tasmu kosong. Petik herba, jamur, dan bunga di Hutan Bisikan!</div>'
    }
    h += '<div class="ft"><button data-c="1">TUTUP</button></div><div class="hint">ESC / G UNTUK TUTUP</div></div>'; el.innerHTML = h
  }
  function clr() { try { Object.keys(K).forEach(k => K[k] = 0); M.d = 0; for (const k in P) delete P[k]; touchJoy.active = false; touchAttack.active = false } catch (e) { } }
  function close() { if (!on) return; on = false; el.classList.remove('on'); clr(); playing = true; try { cv.focus() } catch (e) { } WORLD.save() }
  WORLD.openShop = function (id) { if (!SHOPS[id]) return; cur = id; on = true; clr(); playing = false; render(); el.classList.add('on'); try { SFX.pickup() } catch (e) { } };
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.c) return close();
    if (b.dataset.b) { const it = ITEMS[b.dataset.b], pr = it.price(); if (it.can() || W_.gold < pr) return; W_.gold -= pr; it.buy(); WORLD.save(); try { SFX.point() } catch (e) { } msg('Dibeli: ' + val(it.name)); render(); return }
    if (b.dataset.s) { const [k, m] = b.dataset.s.split('|'), n = m === 'all' ? W_.inv[k] : Math.min(1, W_.inv[k]), v = Math.round(SELL[k][1] * SHOPS[cur].mul) * n; if (n <= 0) return; W_.inv[k] -= n; W_.gold += v; WORLD.save(); try { SFX.pickup() } catch (e) { } msg('Terjual: ' + n + ' ' + SELL[k][0] + ' (+' + v + ' G)'); render() }
  });
  document.addEventListener('keydown', e => { if (!on) return; e.stopPropagation(); e.preventDefault(); if (e.code === 'Escape' || e.code === 'KeyG' || e.code === 'Enter') close() }, true);
})();

/* ===== UPGRADE DESA LEMBAH LENTERA: HIDUP =====
   Siklus siang-malam, hujan, satwa (merpati, bebek, ikan, kupu-kupu), rumput bergoyang,
   bendera hias + lampu, warga berjalan, bubble obrolan, warga tidur di malam hari, jam di HUD.
   Ditambahkan di akhir file tanpa mengubah kode sebelumnya. */
(function () {
  const V = WORLD.AREAS.village; if (!V) return;
  const { lightL, mkRng, TAU } = WORLD;
  const R = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h) };
  const guard = f => { try { f() } catch (e) { if (!guard.w) { guard.w = 1; console.warn('[desa-hidup]', e) } } };
  const sm = x => x * x * (3 - 2 * x), cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const POND = { x: 210, y: 650, rx: 96, ry: 44 }, POND2 = { x: 1580, y: 690, rx: 78, ry: 30 }, PLAZA = { x: 640, y: 380, r: 86 };
  const DAY = 420; // detik nyata per 24 jam desa
  const STAYS = /Penjaga|Pemilik Penginapan/;   // penjaga gerbang & pemilik penginapan tetap di luar saat malam; warga lain pulang ke rumah
  const HOME_AT = 17.5, WAKE_AT = 5.5;          // jam mulai pulang (tiap warga +0..2 jam acak) & jam keluar rumah (+0..1 jam acak)
  V.clock = 15; V.night = 0; V.rain = 0; V.rainOn = 0; V.rainT = 90 + Math.random() * 60;
  /* cuaca acak: V.wx = 0 cerah | 1 hujan biasa | 2 hujan petir. V.rain = intensitas hujan, V.storm = intensitas badai (0..1) */
  const P_STORM = .4;          // peluang hujan yang datang berupa badai petir
  const THUNDER_SFX = true;    // false = matikan suara guntur
  const CAM_SHAKE = 1;         // kekuatan getar kamera saat guntur (0 = mati, 1 = halus, 2 = lebih terasa)
  V.wx = 0; V.storm = 0; V._ltT = 3; V._fl = 0; V._bolt = null; V._th = null; V._re = null; V._rb = 0; V._rbT = 1; V._pw = 0;
  const nightOf = h => (h >= 20 || h < 4) ? 1 : h >= 18 ? sm((h - 18) / 2) : h < 6 ? 1 - sm((h - 4) / 2) : 0;

  const rng = mkRng(4242), FC = [0, '#ffffff', '#ffd34d', '#ff9ac0', '#b48cff'];
  const GC = [['#3f7a30', '#5aa040'], ['#4a8a34', '#7ab848'], ['#356a2c', '#58983c']];
  let tufts = [], pigeons = [], ducks = [], fishes = [], bfly = [];

  const CH = {
    Mira: ['Herba segar, herba segar!', 'Ramuan baru sudah matang~'], Tamsin: ['Harga adil, senyum gratis!', 'Apa pun ada, apa pun kubeli!'],
    Borin: ['*TANG! TANG!*', 'Baja panas, tangan sabar.'], Hanna: ['Sup hangat siap disajikan!', 'Kamar kosong masih ada~'],
    Wren: ['Telur rebus, masih hangat!', 'Roti madu baru keluar oven~'], Hendra: ['\u266a la la la ~', 'Satu bait lagi...'],
    Gaspar: ['Gagak-gagak itu lagi...', 'Labunya gemuk tahun ini!'], Finn: ['...', 'Sst. Ada yang menggigit!'],
    Nia: ['Kejar aku!', 'Hore!'], Tobi: ['Aku menang!', 'Nia curang!'], Rafi: ['Ada katak besar!', 'Kwek kwek!'],
    Kael: ['Semua aman.', 'Siapa di sana?'], Joko: ['Timur aman.', 'Hmm, tenang sekali.'],
    Rina: ['Kain halus, jahitan rapi~', 'Benangnya kurang satu warna.'], Doran: ['Kayu ini berat!', 'Satu kayu lagi...'],
    Sela: ['Bunga-bunga cantik~', 'Sedikit air lagi...'], Bima: ['Mana ayamku?', 'Jangan injak ayamnya!'],
    Aldous: ['Desa ini damai...', 'Pahlawan kita...'], Marta: ['Belanja dulu, ya.', 'Roti atau telur, ya?'],
    Salim: ['Pasar ramai hari ini!', 'Untung besar, untung besar.'], Nox: ['Lentera menyala, bisikan menjauh.', 'Malam yang tenang.']
  };
  const STORML = ['Petir! Kaget aku!', 'Duar! Masuk, masuk!', 'Badainya ganas...'];
  const RAINL = ['Hujan!', 'Basah semua...', 'Cepat berteduh!'], NIGHTL = ['Sudah malam...', 'Dingin ya.'];
  const say = n => { const a = CH[n.n.split(',')[0]] || ['...'], r = Math.random(); if (V.storm > .5 && r < .6) return STORML[(Math.random() * 3) | 0]; if (V.rain > .4 && r < .6) return RAINL[(Math.random() * 3) | 0]; if (V.night > .6 && r < .3) return NIGHTL[(Math.random() * 2) | 0]; return a[(Math.random() * a.length) | 0] };

  /* ================= EKSPRESI WARGA =================
     n._em = emosi, n._emT = sisa detik, n._emA = umur emosi (dipakai person() untuk wajah + ikon).
     Pemicu: petir, hujan mulai/reda, hero mendekat/mengajak bicara, kalimat bubble, dan sesekali spontan. */
  const EMP = { kaget: 5, takut: 4, marah: 3, sedih: 2, bingung: 2, senang: 1 }, BRAVE = /Kael|Joko/;
  const EML = {   // kalimat bubble -> emosi
    'Hujan!': 'kaget', 'Basah semua...': 'sedih', 'Cepat berteduh!': 'kaget',
    'Petir! Kaget aku!': 'kaget', 'Duar! Masuk, masuk!': 'takut', 'Badainya ganas...': 'takut',
    'Gagak-gagak itu lagi...': 'marah', 'Nia curang!': 'marah', 'Aku menang!': 'senang', 'Kejar aku!': 'senang', 'Hore!': 'senang',
    'Ada katak besar!': 'kaget', 'Kwek kwek!': 'senang', 'Mana ayamku?': 'bingung', 'Jangan injak ayamnya!': 'kaget',
    'Sst. Ada yang menggigit!': 'kaget', 'Siapa di sana?': 'kaget', 'Hmm, tenang sekali.': 'bingung',
    'Kayu ini berat!': 'sedih', 'Satu kayu lagi...': 'sedih', 'Benangnya kurang satu warna.': 'sedih',
    'Untung besar, untung besar.': 'senang', 'Pasar ramai hari ini!': 'senang', 'Harga adil, senyum gratis!': 'senang',
    'Desa ini damai...': 'senang', 'Pahlawan kita...': 'senang', 'Satu bait lagi...': 'senang', '\u266a la la la ~': 'senang'
  };
  function feel(n, em, dur, force) {
    if (!n || NP.indexOf(n) < 0) return;
    if (n._emT > 0 && !force && (EMP[n._em] || 0) > (EMP[em] || 0)) return;
    n._em = em; n._emT = dur; n._emA = 0;
  }
  const later = (n, em, dur, delay, force) => { n._emL = { em, dur, t: delay, f: force } };
  function moodFor(n, s) {
    let em = EML[s];
    if (!em && /[!~\u266a]/.test(s) && Math.random() < .45) em = 'senang';
    if (em) feel(n, em, 3.4);
  }
  function weatherMood(a, b) {       // a = cuaca sebelumnya, b = cuaca sekarang (0 cerah, 1 hujan biasa, 2 petir)
    V.npcs.forEach(n => {
      if (NP.indexOf(n) < 0) return; const kid = n.kid, brave = BRAVE.test(n.n), r = Math.random(), d = Math.random() * 2.5;
      if (b === 1) { if (kid) { if (r < .75) later(n, 'senang', 7 + Math.random() * 5, d) } else if (r < .35) later(n, 'sedih', 5 + Math.random() * 4, d); else if (r < .5) later(n, 'bingung', 3, d) }
      else if (b === 2) { if (brave) { if (r < .4) later(n, 'bingung', 4, d) } else if (r < (kid ? .85 : .55)) { later(n, 'kaget', 1, d, 1); n._emQ = ['takut', 8 + Math.random() * 6] } else if (r < .8) later(n, 'sedih', 6, d) }
      else if (b === 0 && a) { if (r < .6) later(n, 'senang', 3 + Math.random() * 3, d, 1) }       // hujan reda: lega
    });
  }
  function reactStrike() {            // petir menyambar: kaget, lalu sebagian jadi takut
    V.npcs.forEach(n => {
      if (NP.indexOf(n) < 0) return; const brave = BRAVE.test(n.n);
      if (Math.random() < (n.kid ? .9 : brave ? .3 : .6)) { later(n, 'kaget', .9 + Math.random() * .5, Math.random() * .25, 1); if (!brave && Math.random() < .65) n._emQ = ['takut', 5 + Math.random() * 6] }
    });
  }
  function moods(dt) {
    for (const n of V.npcs) {
      if (n._emL && (n._emL.t -= dt) <= 0) { const q = n._emL; n._emL = null; feel(n, q.em, q.dur, q.f) }
      if (n._emT > 0) {
        n._emT -= dt; n._emA += dt;
        if (n._emT <= 0) { n._em = ''; if (n._emQ) { const q = n._emQ; n._emQ = null; n._em = q[0]; n._emT = q[1]; n._emA = 0 } }
      }
      if (NP.indexOf(n) < 0) continue;
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < 58) { if (!n._nr && t > (n._gc || 0) && !(n._emT > 0)) { n._gc = t + 25 + Math.random() * 15; const r = Math.random(); if (r < .55) feel(n, 'senang', 2.4); else if (r < .7) feel(n, 'kaget', 1) } n._nr = 1 }
      else if (d > 95) n._nr = 0;
      if (dlg && dlg.n === n) { if (!n._tk) { n._tk = 1; if (!(n._emT > 0) && Math.random() < .5) feel(n, 'senang', 2.5) } } else n._tk = 0;
      if (n._ie === undefined) n._ie = t + Math.random() * 30;
      if (!(n._emT > 0) && V.wx === 0 && t > n._ie) { n._ie = t + 18 + Math.random() * 30; if (d < 360) { const r = Math.random(); if (r < .4) feel(n, 'senang', 2.2); else if (r < .6) feel(n, 'bingung', 2.2) } }   // ekspresi spontan
    }
  }

  function addLife() {
    tufts = []; for (let n = 0; tufts.length < 190 && n < 3000; n++) { const a = 24 + rng() * 1750, b = 50 + rng() * 870; if (V.free && !V.free(a, b, 4)) continue; tufts.push({ x: a, y: b, h: 5 + ((rng() * 5) | 0), k: rng() < .24 ? 1 + ((rng() * 4) | 0) : 0, ph: rng() * 6, c: GC[(rng() * 3) | 0] }) }
    pigeons = []; for (let i = 0; i < 6; i++) { const a = rng() * TAU, d = 60 + rng() * 26, hx = PLAZA.x + Math.cos(a) * d, hy = PLAZA.y + 8 + Math.sin(a) * d * .62; pigeons.push({ hx, hy, x: hx, y: hy, st: 0, k: 0, tm: 0, ph: rng() * 6, vx: 1, vy: 0, z: 0 }) }
    ducks = [[POND, 0, .5], [POND, 2.2, -.38], [POND, 4, .42], [POND2, 1, .55], [POND2, 3.6, -.45]].map(([P, a, sp]) => ({ P, a, sp, x: P.x, y: P.y, fc: 1 }));
    fishes = [{ P: POND, nx: 4, j: null }, { P: POND2, nx: 7, j: null }];
    bfly = [[1415, 690], [1415, 690], [1330, 700], [420, 330], [860, 440], [320, 430], [580, 500], [1100, 500], [1190, 590], [300, 480], [1500, 560], [160, 560]].map(([hx, hy], i) => ({ hx, hy, ph: rng() * 6, c: ['#ffd34d', '#ff9ac0', '#7ab8ff', '#ffffff', '#ff8a4a'][i % 5] }));

    // warga baru yang berjalan menyusuri jalan utama (+ penyala lentera di malam hari)
    const ST = [[110, 374], [420, 378], [570, 402], [640, 416], [712, 402], [880, 380], [1100, 374], [1320, 370], [1520, 372], [1700, 372]];
    const mk = (o, k) => { const f = ST.concat(ST.slice(1, -1).reverse()), n = { ...o, path: f, pi: (k + 1) % f.length, mv: 0, x: ST[k][0], y: ST[k][1] }; V.npcs.push(n); V.dyn.push({ n, i: V.dyn.length, get y() { return n.y } }); return n };
    mk({ n: 'Marta, Pembawa Keranjang', fc: 1, sk: '#e8c0a0', hair: '#8a5a2a', hs: 'bun', hat: 'bonnet', c1: '#a8483a', c2: '#e8d8a0', c3: '#4a2a1a', apron: '#f0e8dc', prop: 'basket', lines: ['Aku belanja untuk makan malam. Telur Wren paling segar di desa ini!', 'Jalan utama ramai sekali sejak kau muncul, pahlawan. Semua orang membicarakanmu.'] }, 2);
    mk({ n: 'Salim, Saudagar Kain', fc: -1, sk: '#c9946e', hair: '#3a2a1a', hs: 'bald', beard: '#3a2a1a', c1: '#5a3a7a', c2: '#d8b84a', c3: '#2a2a40', vest: '#c8a040', prop: 'scroll', lines: ['Salim, saudagar kain dari kota seberang. Aku singgah menjual sutra pada Rina.', 'Kudengar Tamsin membeli apa saja. Kalau kau punya herba berlebih, jual padanya!'] }, 7);
    mk({ n: 'Nox, Penyala Lentera', fc: 1, sk: '#d0986c', hair: '#2a1a14', hs: 'short', hat: 'cap', hc: '#3a3a4a', c1: '#2a3a5a', c2: '#c9a95a', c3: '#1a1a28', prop: 'staff', pc: '#ffd34d', nightOnly: 1, lines: ['Aku Nox. Tiap malam kuperiksa semua lentera desa, supaya bisikan Abyss tak berani mendekat.', 'Kalau malam begini kau ingin tenang, bermalamlah di penginapan Hanna. Pagi di sini indah.'] }, 5);
    V.npcs.forEach(n => { if (!n.nightOnly && !STAYS.test(n.n)) { n.sleeps = 1; n._hx = n.x; n._hy = n.y; n._orig = n.path || null; n._lv = Math.random() * 2; n._wk = Math.random() } });
    V._all = V.dyn.slice();
    V.npcs.forEach(n => { if (n.nightOnly) { const k = NP.indexOf(n); if (k >= 0) NP.splice(k, 1) } });
    V._nt = false; V.dyn = V._all.filter(o => !(o.n && o.n.nightOnly));
  }

  // malam hari: warga berjalan pulang lalu masuk rumah (desa sepi); pagi hari mereka keluar lagi
  const isHomeTime = (n, h) => h >= HOME_AT + n._lv || h < WAKE_AT + n._wk;
  function shift(force) {
    if (!V._all) return; const h = V.clock, nt = !!V._nt;
    V.npcs.forEach(n => {
      if (dlg && dlg.n === n) return; const k = NP.indexOf(n), shown = k >= 0, d = Math.hypot(n.x - p.x, n.y - p.y);
      if (n.nightOnly) {                                   // penyala lentera: hanya muncul di malam hari
        if (nt === shown) return; if (!force && d < 240 && (nt ? V.night < .95 : V.night > .05)) return;
        if (nt) NP.push(n); else NP.splice(k, 1); return
      }
      if (!n.sleeps || n._hx === undefined) return;
      const hide = () => { NP.splice(NP.indexOf(n), 1); n.x = n._hx; n.y = n._hy; n.vx = n.vy = 0; n.spd = 0; n.mv = 0; n._b = null };
      if (isHomeTime(n, h)) {
        if (!shown) return;
        if (!n._going) { n._going = 1; if (n.path) { n.path = [[n._hx, n._hy]]; n.pi = 0; n.stopHere = 1; n.wait = 0 } }   // jalan pulang ke rumah
        const dh = Math.hypot(n.x - n._hx, n.y - n._hy);
        if (n.path ? (dh < 22 || (force && d > 260)) : (d > 200 || V.night > .95)) hide()   // tiba di rumah -> masuk; yang diam di tempat masuk saat tak terlihat pemain
      } else {
        if (n._going) { n._going = 0; if (n._orig) { let bi = 0, bd = 1e9; n._orig.forEach((q, i) => { const dd = Math.hypot(q[0] - n._hx, q[1] - n._hy); if (dd < bd) { bd = dd; bi = i } }); n.path = n._orig; n.pi = bi; n.wait = Math.random() * 2; n.stopHere = 0 } }
        if (!shown) { n.x = n._hx; n.y = n._hy; NP.push(n) }                                              // pagi: keluar dari rumah
      }
    });
    V.dyn = V._all.filter(o => { const s = o.n; return !s || NP.indexOf(s) >= 0 })
  }

  /* ---------- petir & guntur ---------- */
  let AC = null;
  function thunder() {
    if (!THUNDER_SFX) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      const dur = 1.8 + Math.random() * 1.4, n = (AC.sampleRate * dur) | 0, buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0);
      let lp = 0, ph = Math.random() * 6;
      for (let i = 0; i < n; i++) {
        const k = i / n; lp += ((Math.random() * 2 - 1) - lp) * .02;
        d[i] = lp * 6 * Math.min(1, k * 40) * Math.pow(1 - k, 1.7) * (.65 + .35 * Math.sin(k * 26 + ph));
      }
      const s = AC.createBufferSource(), f = AC.createBiquadFilter(), gn = AC.createGain();
      s.buffer = buf; f.type = 'lowpass'; f.frequency.value = 240 + Math.random() * 120; gn.gain.value = .5;
      s.connect(f); f.connect(gn); gn.connect(AC.destination); s.start();
    } catch (e) { }
  }
  function strike() {
    V._ltT = 2.5 + Math.random() * 6.5;                       // jeda ke petir berikutnya
    const vw = W / CAM_Z, vh = H / CAM_Z, pts = [], fk = [];
    let x = camX + vw * (.1 + Math.random() * .8), y = camY - 10;
    const endY = camY + vh * (.35 + Math.random() * .4);
    pts.push([x, y]);
    while (y < endY) { y += 14 + Math.random() * 18; x += (Math.random() - .5) * 34; pts.push([x, y]) }
    for (let c = 0, nf = 1 + ((Math.random() * 2) | 0); c < nf; c++) {
      const s = pts[1 + ((Math.random() * (pts.length - 2)) | 0)], dir = Math.random() < .5 ? -1 : 1, br = [[s[0], s[1]]];
      let bx = s[0], by = s[1]; for (let k = 0; k < 3; k++) { bx += dir * (8 + Math.random() * 12); by += 8 + Math.random() * 12; br.push([bx, by]) }
      fk.push(br);
    }
    V._bolt = { pts, fk }; V._fl = 1; reactStrike();
    V._re = Math.random() < .5 ? .12 : null;                   // kilat susulan
    V._th = .25 + Math.random() * 1.5;                         // guntur menyusul setelah kilat
  }

  function wxTick(dt) {   // cuaca + jam dunia: dipakai bersama oleh Desa dan Hutan
    V.clock = (V.clock + dt * 24 / DAY) % 24; V.night = nightOf(V.clock); V._nt = V.night > (V._nt ? .5 : .62);
    V.rainT -= dt;
    if (V.rainT <= 0) {
      V.rainOn = !V.rainOn;
      if (V.rainOn) { V.wx = Math.random() < P_STORM ? 2 : 1; V.rainT = 30 + Math.random() * 30 }   // hujan datang: biasa atau petir
      else { V.wx = 0; V.rainT = 110 + Math.random() * 120 }                                      // kembali cerah
    }
    V.rain += ((!V.rainOn ? 0 : V.wx === 2 ? 1 : .7) - V.rain) * Math.min(1, dt * .5);
    V.storm += ((V.rainOn && V.wx === 2 ? 1 : 0) - V.storm) * Math.min(1, dt * .4);
    V._fl = Math.max(0, V._fl - dt * 2.6);
    if (V._re != null && (V._re -= dt) <= 0) { V._re = null; V._fl = .8 }
    if (V._th != null && (V._th -= dt) <= 0) { V._th = null; thunder(); V._rbT = V._rb = 1.6 + Math.random() * .8; shake = Math.max(shake, 1.8 * CAM_SHAKE) }
    if (V._rb > 0) { V._rb -= dt; shake = Math.max(shake, 1.1 * CAM_SHAKE * Math.max(0, V._rb) / V._rbT) }   // gemuruh guntur: getar halus yang memudar
    if (V.storm > .5) { if ((V._ltT -= dt) <= 0) strike() } else V._ltT = 2 + Math.random() * 3;
    if (V.wx !== V._pw) { if (window.AREA === 'village') weatherMood(V._pw, V.wx); V._pw = V.wx }
  }
  function life(dt) {
    wxTick(dt);
    V._sc = (V._sc || 0) - dt; if (V._sc <= 0) { V._sc = .25; shift() }
    moods(dt);
    for (const b of pigeons) {
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (b.st === 0) { if (d < 44) { b.st = 1; b.tm = 1.6 + Math.random(); const a = Math.atan2(b.y - p.y, b.x - p.x); b.vx = Math.cos(a) * 70; b.vy = Math.sin(a) * 40 } }
      else if (b.st === 1) { b.x += b.vx * dt; b.y += b.vy * dt; b.z = Math.min(26, b.z + dt * 60); if ((b.tm -= dt) <= 0) b.st = 2 }
      else { const dx = b.hx - b.x, dy = b.hy - b.y, dd = Math.hypot(dx, dy); b.z = Math.min(26, dd * .5); if (d > 80) { if (dd < 3) { b.st = 0; b.z = 0 } else { b.x += dx / dd * 62 * dt; b.y += dy / dd * 62 * dt; b.vx = dx } } }
    }
    for (const d of ducks) { d.a += d.sp * dt * .6; const P = d.P; d.x = P.x + Math.cos(d.a) * (P.rx - 26) * .85; d.y = P.y + Math.sin(d.a) * (P.ry - 14) * .8; d.fc = (-Math.sin(d.a) * d.sp) > 0 ? 1 : -1 }
    for (const f of fishes) { if (!f.j && t > f.nx) { const a = rng() * TAU, r = Math.sqrt(rng()); f.j = { x: f.P.x + Math.cos(a) * r * (f.P.rx - 22), y: f.P.y + Math.sin(a) * r * (f.P.ry - 12), t0: t }; f.nx = t + 3 + Math.random() * 6 } if (f.j && t - f.j.t0 > .8) f.j = null }
    for (const n of V.npcs) {
      if (n._b && (n._b.t -= dt) <= 0) n._b = null; if (n._b || dlg || t < (n._bn || 0) || NP.indexOf(n) < 0) continue;
      n._bn = t + 5 + Math.random() * 8; if (Math.hypot(n.x - p.x, n.y - p.y) < 190 && Math.random() < .6) { n._b = { s: say(n), t: 3.4 }; moodFor(n, n._b.s) }
    }
  }

  function ground() {
    const vw = W / CAM_Z, vh = H / CAM_Z, x0 = camX - 30, x1 = camX + vw + 30, y0 = camY - 30, y1 = camY + vh + 30, wet = V.rain, see = (x, y) => x > x0 && x < x1 && y > y0 && y < y1;
    for (const f of tufts) {
      if (!see(f.x, f.y)) continue;
      const dx = f.x - p.x, dy = f.y - p.y, d = Math.hypot(dx, dy), push = d < 26 ? (dx / (d + 1)) * (1 - d / 26) * 5 : 0, sw = Math.sin(t * 1.7 + f.ph + f.x * .02) * (1.1 + wet * 1.6 + V.storm * 2.2) + push;
      for (let i = 0; i < 4; i++) { const bh = f.h - (i % 2) * 2, o = Math.round(sw * (.55 + i * .12)), bx = f.x + i * 2 - 3; R(f.c[i % 2], bx, f.y - bh / 2, 1, bh / 2 + 1); R(f.c[(i + 1) % 2], bx + o, f.y - bh, 1, bh / 2 + 1) }
      if (f.k) { const o = Math.round(sw * .9); R(FC[f.k], f.x + o - 1, f.y - f.h - 2, 3, 3); R('rgba(255,255,255,.8)', f.x + o, f.y - f.h - 2, 1, 1) }
    }
    for (const d of ducks) {
      if (!see(d.x, d.y)) continue; g.save(); g.translate(Math.round(d.x), Math.round(d.y)); g.scale(d.fc, 1);
      g.strokeStyle = 'rgba(225,246,255,.4)'; g.beginPath(); g.ellipse(-1, 1, 8 + Math.sin(t * 3 + d.a) * 1.5, 3, 0, 0, 7); g.stroke();
      R('#d8d0c0', -5, -3, 10, 4); R('#f4efe6', -5, -5, 10, 3); R('#f4efe6', -7, -6, 3, 3); R('#2f7a4a', 4, -9, 4, 4); R('#e8a020', 8, -7, 3, 1); R('#1a1210', 6, -8, 1, 1); g.restore()
    }
    for (const f of fishes) {
      const j = f.j; if (!j) continue; const k = (t - j.t0) / .8, z = Math.sin(k * Math.PI) * 15, X = j.x + (k - .5) * 8; g.strokeStyle = 'rgba(235,250,255,.7)';
      g.globalAlpha = 1 - k; g.beginPath(); g.ellipse(j.x, j.y, 1 + k * 14, .5 + k * 5, 0, 0, 7); g.stroke();
      if (k > .7) { g.globalAlpha = 1 - (k - .7) * 3; g.beginPath(); g.ellipse(X, j.y, 1 + (k - .7) * 30, .5 + (k - .7) * 10, 0, 0, 7); g.stroke() } g.globalAlpha = 1;
      R('#cfd8e8', X - 2, j.y - z - 1, 5, 2); R('#7a90b0', X - 2, j.y - z + 1, 5, 1); R('#cfd8e8', X + (k < .5 ? -4 : 3), j.y - z - 2, 2, 4)
    }
    for (const b of pigeons) {
      if (!see(b.x, b.y)) continue; const X = Math.round(b.x), Y = Math.round(b.y), z = Math.round(b.z), fl = b.st > 0, dr = b.vx < 0 ? -1 : 1, pk = !fl && Math.sin(t * 6 + b.ph) > .55 ? 2 : 0;
      R('rgba(0,0,0,.25)', X - 3, Y + 1, 7, 2); R('#7a8094', X - 3, Y - 4 - z, 7, 4); R('#9aa0b4', X - 3, Y - 4 - z, 7, 1);
      R('#5a6074', X + dr * 3 - (dr < 0 ? 1 : 0), Y - 6 - z + pk, 2, 2); R('#58b898', X + dr * 2 - (dr < 0 ? 1 : 0), Y - 5 - z + pk, 2, 1); R('#e8a020', X + dr * 5 - (dr < 0 ? 1 : 0), Y - 5 - z + pk, 1, 1);
      if (fl) R('#aab0c4', X - 3, Y - 7 - z - (Math.sin(t * 30 + b.ph) > 0 ? 2 : 0), 5, 2); else { R('#c86a6a', X - 1, Y, 1, 1); R('#c86a6a', X + 1, Y, 1, 1) }
    }
  }

  // bendera hias sepanjang jalan, lampu kecil menyala di malam hari
  const BUNT = [[120, 352, 380, 352], [900, 352, 1140, 350], [250, 410, 500, 410], [780, 410, 1020, 410], [1370, 404, 1500, 404], [1500, 404, 1650, 404], [1415, 346, 1575, 346], [1575, 346, 1725, 346]], BC = ['#e0485b', '#ffd34d', '#5aa0ff', '#5ad06a', '#b48cff'];
  function bunting(pass) {
    const vw = W / CAM_Z;
    for (const [a, b, c, d] of BUNT) {
      if (c < camX - 20 || a > camX + vw + 20) continue;
      const L = Math.hypot(c - a, d - b), N = Math.max(4, Math.round(L / 15)), sag = 9 + L * .05, pt = u => [a + (c - a) * u, b - 36 + (d - b) * u + Math.sin(u * Math.PI) * sag];
      if (pass) { for (let k = 1; k < N; k += 2) { const [x, y] = pt(k / N); lightL(x, y + 3, 11, '255,215,130', .55 * V.night) } continue }
      g.strokeStyle = '#3a2a1a'; g.lineWidth = 1; g.beginPath(); for (let k = 0; k <= N; k++) { const [x, y] = pt(k / N); k ? g.lineTo(x, y) : g.moveTo(x, y) } g.stroke();
      for (let k = 1; k < N; k++) { const u = k / N, [x, y] = pt(u), sw = Math.sin(t * 2 + u * 7 + a * .01) * (1 + V.rain * 2 + V.storm * 3); g.fillStyle = BC[(k + (a | 0)) % 5]; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 3, y); g.lineTo(x + sw * .6, y + 8); g.fill() }
    }
  }

  /* atmosfer bersama: malam, senja, kabut, hujan, badai, petir. A = area (desa/hutan), vil = true bila di desa */
  function atmo(A, vil) {
    const vw = W / CAM_Z, vh = H / CAM_Z, n = V.night, r = V.rain, h = V.clock;
    g.save();
    const mist = cl(1 - Math.abs(h - 5.2) / 2.2, 0, 1);
    if (mist > .02) for (let i = 0; i < 6; i++) { const X = ((t * 4 + i * 390) % 2400) - 300, Y = 260 + i * 120; g.fillStyle = 'rgba(232,240,255,' + .11 * mist + ')'; g.beginPath(); g.ellipse(X, Y, 230, 36, 0, 0, 7); g.fill() }
    const gold = Math.max(cl(1 - Math.abs(h - 17.8) / 1.8, 0, 1), cl(1 - Math.abs(h - 6.4) / 1.3, 0, 1));
    if (gold > .02) { g.fillStyle = 'rgba(255,140,50,' + .13 * gold + ')'; g.fillRect(camX, camY, vw, vh) }
    if (n > .01) { g.fillStyle = 'rgba(5,9,42,' + .52 * n + ')'; g.fillRect(camX, camY, vw, vh) }
    if (r > .02) { g.fillStyle = 'rgba(30,40,70,' + .16 * r + ')'; g.fillRect(camX, camY, vw, vh) }
    if (V.storm > .02) { g.fillStyle = 'rgba(8,12,32,' + .3 * V.storm + ')'; g.fillRect(camX, camY, vw, vh) }
    if (n > .04) {
      g.globalCompositeOperation = 'lighter';
      for (const o of A.objs) {
        if (o.x < camX - 100 || o.x > camX + vw + 100 || o.y < camY - 60 || o.y > camY + vh + 140) continue;
        if (o.glow) lightL(o.x, o.y - 32, 64 + Math.sin(t * 6 + o.x) * 3, '255,196,100', .5 * n);
        if (o.lamp) o.lamp.forEach(([a, b]) => lightL(a, b + 4, 34, '255,205,120', .5 * n));
        if (o.forge) lightL(o.forge[0], o.forge[1], 52 + Math.sin(t * 11) * 4, '255,120,40', .35 * n)
      }
      lightL(p.x, p.y - 12, 80, '255,214,150', .26 * n); if (vil === 2) { } else if (vil) bunting(1); else { lightL(570, 470, 100 + Math.sin(t * 11) * 6, '255,150,60', .5 * n); lightL(1008, 166, 80, '120,220,255', .4 * n) }
      for (let i = 0; A.ff && i < 36; i++) {
        const f = A.ff[i % A.ff.length], X = camX + (((f.bx * vw - t * f.sx * .4 - camX * .12 + i * 7) % vw) + vw) % vw, Y = camY + (((f.by * vh + Math.sin(t * .7 + f.ph + i) * 14) % vh) + vh) % vh, a = n * (1 - r) * (.35 + .6 * Math.max(0, Math.sin(t * 2.4 + f.ph + i)));
        g.fillStyle = 'rgba(190,255,140,' + a + ')'; g.fillRect(Math.round(X), Math.round(Y), 2, 2); g.fillStyle = 'rgba(190,255,140,' + a * .25 + ')'; g.fillRect(Math.round(X) - 1, Math.round(Y) - 1, 4, 4)
      }
      g.globalCompositeOperation = 'source-over'
    }
    if (r > .03) {
      const S = V.storm, cnt = Math.round(150 * r + 120 * S), sl = 3 + 6 * S, ln = 9 + 5 * S, wd = 60 + 110 * S; g.strokeStyle = 'rgba(195,215,245,' + (.38 * r + .12 * S) + ')'; g.lineWidth = 1; g.beginPath();
      for (let i = 0; i < cnt; i++) { const X = camX + ((((i * 131.7 - t * wd) % vw) + vw) % vw), Y = camY + ((i * 79.3 + t * (430 + 150 * S)) % vh); g.moveTo(X, Y); g.lineTo(X - sl, Y + ln) } g.stroke();
      g.strokeStyle = 'rgba(210,230,255,.6)'; for (let i = 0; i < 24; i++) { const k = (t * 1.4 + i * .41) % 1; g.globalAlpha = (1 - k) * r; g.beginPath(); g.ellipse(camX + ((i * 211.3) % vw), camY + ((i * 97.7 + 60) % vh), 1 + k * 6, .5 + k * 2.4, 0, 0, 7); g.stroke() } g.globalAlpha = 1
    }
    if (V._fl > .01) {
      const b = V._bolt;
      if (b && V._fl > .25) {
        g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = g.lineCap = 'round';
        const al = cl((V._fl - .25) / .5, 0, 1), line = pts => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke() };
        [[6, .15], [3, .45], [1.3, 1]].forEach(([w, a]) => { g.lineWidth = w; g.strokeStyle = 'rgba(225,235,255,' + a * al + ')'; line(b.pts) });
        g.lineWidth = 1; g.strokeStyle = 'rgba(225,235,255,' + .6 * al + ')'; b.fk.forEach(line);
        g.restore();
      }
      g.fillStyle = 'rgba(210,222,255,' + .42 * V._fl + ')'; g.fillRect(camX, camY, vw, vh);
    }
    g.restore();
  }

  function sky() {
    const vw = W / CAM_Z, vh = H / CAM_Z, n = V.night, r = V.rain, h = V.clock;
    g.save(); bunting(0);
    if (n < .5 && r < .25) for (const b of bfly) {
      const X = b.hx + Math.sin(t * .7 + b.ph * 1.3) * 52, Y = b.hy - 16 + Math.cos(t * .55 + b.ph) * 26 + Math.sin(t * 3 + b.ph) * 3;
      if (X < camX - 20 || X > camX + vw + 20 || Y < camY - 20 || Y > camY + vh + 20) continue; const w = Math.abs(Math.sin(t * 16 + b.ph)) * 3;
      R('rgba(0,0,0,.18)', X, Y + 14, 3, 1); R(b.c, X - w, Y - 2, w, 3); R(b.c, X + 1, Y - 2, w, 3); R('#2a1a10', X, Y - 1, 1, 3)
    }
    const ca = .075 * (1 - n) * (1 - r * .4);
    if (ca > .005) for (let i = 0; i < 5; i++) { const X = ((t * 7 + i * 470) % 2300) - 250, Y = 120 + i * 190 + Math.sin(i * 2.3) * 50, rx = 150 + (i % 3) * 40, ry = 55 + (i % 2) * 20; g.fillStyle = 'rgba(8,24,40,' + ca + ')'; g.beginPath(); g.ellipse(X, Y, rx, ry, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(X + 12, Y - 4, rx * .62, ry * .6, 0, 0, 7); g.fill() }
    atmo(V, 1);
    g.restore();
    // bubble obrolan di atas segalanya
    g.save(); g.font = '7px monospace'; g.textAlign = 'center';
    for (const q of V.npcs) {
      const b = q._b; if (!b || NP.indexOf(q) < 0) continue; const al = cl(Math.min(b.t / .35, (3.4 - b.t) / .2), 0, 1), w = Math.round(g.measureText(b.s).width + 10), x = Math.round(q.x - w / 2), y = Math.round(q.y - (q.kid ? 62 : 70) - (1 - al) * 4);
      g.globalAlpha = al; R('#2a1a10', x - 1, y - 1, w + 2, 14); R('#fff8e6', x, y, w, 12); g.fillStyle = '#2a1a10'; g.beginPath(); g.moveTo(q.x - 3, y + 13); g.lineTo(q.x + 3, y + 13); g.lineTo(q.x, y + 18); g.fill();
      g.fillStyle = '#fff8e6'; g.beginPath(); g.moveTo(q.x - 2, y + 12); g.lineTo(q.x + 2, y + 12); g.lineTo(q.x, y + 16); g.fill(); g.fillStyle = '#3a2210'; g.fillText(b.s, q.x, y + 9)
    }
    g.restore()
  }

  const _b = V.build; V.build = function () { _b.apply(this, arguments); guard(addLife) }; if (V.ready) guard(addLife);
  const _en = V.enter; V.enter = function () { if (_en) _en.apply(this, arguments); V._sc = 0; guard(() => shift(1)) };
  const _t = V.tick; V.tick = function (dt) { _t.call(this, dt); if (!WORLD.TR.on) guard(() => life(dt)) };
  const _db = V.drawBack; V.drawBack = function () { guard(ground); _db.call(this) };
  const _df = V.drawFront; V.drawFront = function () { _df.call(this); guard(sky) };
  WORLD.WX = V;   // cuaca & jam dunia bersama (dipakai Hutan juga)
  WORLD.wxTick = wxTick; WORLD.atmo = atmo; WORLD.homeTime = (n, h) => isHomeTime(n, h);   // dipakai Kerajaan juga
  const C_ = WORLD.AREAS.corridor;
  if (C_) { const _ct = C_.tick; C_.tick = function (dt) { _ct.call(this, dt); if (!WORLD.TR.on) guard(() => wxTick(dt)) } }
  const F_ = WORLD.AREAS.forest;
  if (F_) {
    const _ft = F_.tick; F_.tick = function (dt) { _ft.call(this, dt); if (!WORLD.TR.on) guard(() => wxTick(dt)) };
    const _fd = F_.drawFront; F_.drawFront = function () { _fd.call(this); guard(() => atmo(F_, 0)) };
  }

  // jam desa di HUD (di bawah pill emas)
  const _dr = draw;
  draw = function () {
    _dr.apply(this, arguments);
    if ((window.AREA !== 'village' && window.AREA !== 'forest' && window.AREA !== 'kingdom') || !p || typeof W === 'undefined') return;
    guard(() => {
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      const hh = V.clock | 0, mm = (((V.clock % 1) * 6) | 0) * 10, s = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; g.font = 'bold 9px monospace';
      const tw = g.measureText(s).width + 24, X = W - 10 - tw, Y = 94;
      g.fillStyle = 'rgba(10,8,20,.62)'; g.fillRect(X, Y, tw, 14); g.fillStyle = '#c2a06b'; g.fillRect(X, Y, tw, 1); g.fillRect(X, Y + 13, tw, 1);
      if (V.storm > .4) { R('#6a7898', X + 4, Y + 2, 9, 4); R('#8a98b8', X + 5, Y + 1, 6, 2); R('#ffe45a', X + 9, Y + 6, 2, 2); R('#ffe45a', X + 7, Y + 8, 3, 2); R('#ffe45a', X + 8, Y + 10, 2, 2) }
      else if (V.rain > .4) { R('#9ab0d0', X + 4, Y + 3, 8, 4); R('#cfe0ff', X + 5, Y + 2, 5, 2); R('#7ab8ff', X + 5, Y + 8, 1, 3); R('#7ab8ff', X + 9, Y + 8, 1, 3) }
      else if (V.night > .5) { R('#dfe8ff', X + 6, Y + 3, 5, 8); R('#dfe8ff', X + 4, Y + 5, 3, 4); R('rgba(10,8,20,1)', X + 8, Y + 4, 4, 5) }
      else { R('#ffd34d', X + 5, Y + 4, 6, 6); R('#fff3b0', X + 6, Y + 5, 2, 2); R('#ffd34d', X + 7, Y + 2, 2, 1); R('#ffd34d', X + 7, Y + 11, 2, 1); R('#ffd34d', X + 3, Y + 6, 1, 2); R('#ffd34d', X + 12, Y + 6, 1, 2) }
      g.textAlign = 'right'; g.fillStyle = '#ffe28a'; g.fillText(s, W - 14, Y + 10); g.restore()
    })
  };
})();


/* =====================================================================
   TAMBAHAN: PORTAL LOBBY DI DESA LEMBAH LENTERA
   ---------------------------------------------------------------------
   - Model portal batu: cincin rune + pusaran ungu + kristal kunci + lantai rune,
     dipasang di PLAZA PORTAL (lahan lapang khusus + hiasan: lantai batu berrune, panggung, panji, obelisk kristal, lentera, bangku, bunga).
   - Spawn desa tetap di gerbang desa (tidak diubah).
   - Interaksi: melangkah ke lantai rune portal = langsung teleport (tanpa tombol). [G] tetap bisa dipakai.
   - Transisi 'portalLobby': pahlawan berputar & tersedot ke pusaran -> kilat ungu ->
     muncul di lingkaran rune di Lobby.
   Posisi portal dicari otomatis (bebas tembok/pohon/NPC), lihat console: [portal-lobby].
   ===================================================================== */
(function () {
  'use strict';
  const V = WORLD.AREAS.village, SEQ = WORLD.SEQ;
  if (!V || !SEQ) return;
  const { TAU, E, lightL, mkCv, rc, hash, mkRng, art, ell: ellc } = WORLD;
  const OLC = '#14100c';
  const POND = { x: 210, y: 650, rx: 96, ry: 44 };          // kolam pemancingan (sama dengan kolam desa)
  const LOBBY_SPAWN = [320, 322];                           // titik muncul di Lobby (sama dengan WORLD.go('lobby'))
  const SW = 1.9;                                           // detik: saat layar tertutup kilat -> pindah ke Lobby
  const PORTAL_ANCHOR = [V.PZ ? V.PZ.x : 482, V.PZ ? V.PZ.y - 8 : 686];   // di tengah-belakang Plaza Portal
  const PT = V.portal = { x: PORTAL_ANCHOR[0], y: PORTAL_ANCHOR[1], boost: 0, near: 0, done: 0, cd: 2.5 };

  const guard = f => { try { f() } catch (e) { if (!guard.w) { guard.w = 1; console.warn('[portal-lobby]', e) } } };
  const cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const R = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h) };
  const ell = (cx, cy, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill() };

  /* ---------- penempatan: spawn dekat kolam + portal di tepi timur kolam ---------- */
  function wallHit(x0, y0, x1, y1) {
    const w = V.walls; if (!w) return false;
    for (let i = 0; i < w.length; i++) { const r = w[i]; if (x1 > r[0] && x0 < r[0] + r[2] && y1 > r[1] && y0 < r[1] + r[3]) return true }
    return false;
  }
  const rimD = (x, y, m) => ((x - POND.x) / (POND.rx + m)) ** 2 + ((y - POND.y) / (POND.ry + m)) ** 2;
  const npcHit = (x, y, r) => V.npcs.some(n => Math.hypot(n.x - x, n.y - y) < r);
  const spotOK = (x, y) => x > 70 && x < 1730 && y > 90 && y < 880 && rimD(x, y, 14) >= 1 && !wallHit(x - 8, y - 8, x + 8, y + 8) && !npcHit(x, y, 32);
  function scan(ax, ay, dx0, dx1, dy0, dy1, test) {
    const c = [];
    for (let dy = dy0; dy <= dy1; dy += 6) for (let dx = dx0; dx <= dx1; dx += 6) c.push([ax + dx, ay + dy, Math.hypot(dx, dy)]);
    c.sort((a, b) => a[2] - b[2]);
    for (const q of c) if (test(q[0], q[1])) return [q[0], q[1]];
    return null;
  }

  function setup() {
    if (PT.done) return; PT.done = 1;
    // spawn desa TIDAK diubah: pemain tetap muncul di gerbang desa (V.spawn asli).
    // portal: dekat kolam pemancingan, tidak menimpa jalan/rumah/pohon
    PT.x = PORTAL_ANCHOR[0]; PT.y = PORTAL_ANCHOR[1];
    guard(paintPlaza); guard(addDecor);   // lantai plaza digambar ke latar desa, hiasan masuk daftar objek

    // tabrakan: dua kaki batu + dinding belakang (lantai rune di depan tetap bisa dipijak)
    V.walls.push([PT.x - 32, PT.y - 11, 15, 11], [PT.x + 17, PT.y - 11, 15, 11], [PT.x - 32, PT.y - 20, 64, 9]);
    // model portal ikut urutan-y (di belakang/depan pahlawan) lewat daftar render desa
    V.objs.push({ x: PT.x, y: PT.y, oy: 92, draw: drawPortal, portal: 1 });
    // titik interaksi (pola sama seperti 'Mata Air Suci': sign + verb + act)
    V.npcs.push({
      n: 'Portal Lobby', x: PT.x, y: PT.y + 22, sign: 1, rng: 44, verb: 'Masuk', _bn: Infinity,
      lines: ['Lingkaran rune itu berdenyut pelan. Cahaya ungu di dalamnya menuju Lobby, zona aman tempat para petualang berkumpul. Melangkahlah masuk?'],
      act() { startTeleport() }
    });
  }
  const _b = V.build; V.build = function () { _b.apply(this, arguments); guard(setup) };
  if (V.ready) guard(setup);

  /* ---------- PLAZA PORTAL: lantai batu, panggung, rune, jalan penghubung ---------- */
  const PZC = ['#a29e92', '#9a9488', '#8e897d', '#b0aa9c'];
  function paintPlaza() {
    const P = V.PZ, c = V.bg.getContext('2d'), X0 = P.x, Y0 = P.y, px = (col, a, b, w, h) => rc(c, col, Math.round(a), Math.round(b), w, h);
    ellc(c, 'rgba(0,0,0,.20)', X0, Y0 + 4, P.rx + 9, P.ry + 8);
    ellc(c, '#4a463e', X0, Y0, P.rx + 3, P.ry + 3);
    ellc(c, '#7a7468', X0, Y0, P.rx, P.ry);
    for (let yy = -P.ry; yy < P.ry; yy += 6) for (let xx = -P.rx; xx < P.rx; xx += 9) {
      const tx = xx + (Math.round(yy / 6) & 1) * 4;
      if ((tx / (P.rx - 3)) ** 2 + ((yy + 2) / (P.ry - 2)) ** 2 > 1) continue;
      const h = hash((tx + 999) | 0, (yy + 999) | 0, 31);
      px(PZC[(h * 4) | 0], X0 + tx, Y0 + yy, 8, 5); if (h > .8) px('rgba(255,255,255,.14)', X0 + tx, Y0 + yy, 8, 1);
    }
    // cincin rune ungu & bintang emas
    const ring = (rx, ry, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.ellipse(X0, Y0, rx, ry, 0, 0, TAU); c.stroke() };
    ring(P.rx - 14, P.ry - 9, '#2a2040', 6); ring(P.rx - 14, P.ry - 9, '#5a4a98', 4); ring(P.rx - 14, P.ry - 9, '#a894ee', 1);
    ring(72, 26, '#2a2040', 4); ring(72, 26, '#6a5aa8', 2);
    c.strokeStyle = 'rgba(214,176,88,.7)'; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + TAU / 16; c.moveTo(X0 + Math.cos(a) * 72, Y0 + Math.sin(a) * 26); c.lineTo(X0 + Math.cos(a) * (P.rx - 14), Y0 + Math.sin(a) * (P.ry - 9)) }
    c.stroke();
    for (let i = 0; i < 24; i++) { const a = i * TAU / 24, qx = X0 + Math.cos(a) * (P.rx - 14), qy = Y0 + Math.sin(a) * (P.ry - 9); px('#2a2040', qx - 2, qy - 2, 5, 4); px(i % 2 ? '#d8c8ff' : '#8a6ae0', qx - 1, qy - 1, 3, 2) }
    // batu tepi plaza
    for (let i = 0; i < 52; i++) { const a = i * TAU / 52, sx = X0 + Math.cos(a) * (P.rx - 1), sy = Y0 + Math.sin(a) * (P.ry - 1); px(i % 2 ? '#b4aea0' : '#8a867a', sx - 3, sy - 2, 6, 4); px('rgba(0,0,0,.25)', sx - 3, sy + 1, 6, 1) }
    // panggung dua tingkat di bawah portal
    const bx = PT.x, by = PT.y;
    ellc(c, '#4a463e', bx, by + 8, 66, 23); ellc(c, '#7a7468', bx, by + 7, 64, 21.5); ellc(c, '#a29e92', bx, by + 5, 62, 20);
    ellc(c, '#4a463e', bx, by + 5, 53, 17); ellc(c, '#8a867a', bx, by + 4, 51, 15.5); ellc(c, '#b4aea0', bx, by + 3, 49, 14.5);
    // karpet ungu dari panggung ke tepi selatan
    px('#1c1430', bx - 14, by + 24, 28, 28); px('#5a2a8a', bx - 12, by + 24, 24, 27); px('#c8a050', bx - 12, by + 24, 1, 27); px('#c8a050', bx + 11, by + 24, 1, 27);
    for (let j = 0; j < 3; j++) { px('#c8a050', bx - 1, by + 28 + j * 8, 2, 2); px('#8a5ad0', bx - 3, by + 29 + j * 8, 6, 1) }
    // bunga liar mengelilingi plaza
    const rg = mkRng(4242), FC = ['#ffffff', '#b48cff', '#7ab8ff', '#ff9ac0'];
    for (let i = 0; i < 80; i++) { const a = rg() * TAU, d = 1.05 + rg() * .16, fx = X0 + Math.cos(a) * P.rx * d, fy = Y0 + Math.sin(a) * P.ry * d + 2; if ((fx > 586 && Math.abs(fy - 694) < 22) || (Math.abs(fx - 460) < 18 && fy < Y0 - 30)) continue; art.flower(c, fx, fy, FC[(rg() * 4) | 0]) }
  }

  /* ---------- hiasan plaza: panji, lentera, obelisk kristal, bangku, bunga, pohon ---------- */
  function obelisk() {
    const [c, q] = mkCv(24, 62); rc(q, 'rgba(0,0,0,.3)', 2, 57, 20, 4);
    rc(q, OLC, 2, 47, 20, 12); rc(q, '#7e7a70', 3, 48, 18, 10); rc(q, '#b9b5a8', 3, 48, 18, 1); rc(q, '#6a665c', 3, 55, 18, 3);
    rc(q, OLC, 6, 31, 12, 18); rc(q, '#8a867a', 7, 32, 10, 16); rc(q, '#a29e92', 7, 32, 3, 16); rc(q, '#6e6a60', 14, 32, 3, 16); rc(q, '#5a4a98', 7, 38, 10, 1); rc(q, '#b8a4ff', 11, 41, 2, 3);
    q.fillStyle = OLC; q.beginPath(); q.moveTo(12, 1); q.lineTo(20, 17); q.lineTo(12, 33); q.lineTo(4, 17); q.fill();
    q.fillStyle = '#8a5aff'; q.beginPath(); q.moveTo(12, 4); q.lineTo(18, 17); q.lineTo(12, 30); q.lineTo(6, 17); q.fill();
    q.fillStyle = '#c8a8ff'; q.beginPath(); q.moveTo(12, 4); q.lineTo(6, 17); q.lineTo(12, 30); q.fill();
    q.fillStyle = '#f0e4ff'; q.fillRect(9, 9, 2, 5);
    return { img: c, ox: 12, oy: 57 };
  }
  function banner() {
    const [c, q] = mkCv(28, 78); rc(q, 'rgba(0,0,0,.28)', 8, 74, 12, 3);
    rc(q, OLC, 12, 6, 4, 70); rc(q, '#6a4a2c', 13, 6, 2, 69);
    rc(q, OLC, 2, 4, 24, 5); rc(q, '#8a6440', 3, 5, 22, 3); rc(q, '#d8b84a', 1, 3, 3, 5); rc(q, '#d8b84a', 24, 3, 3, 5);
    rc(q, OLC, 5, 9, 18, 36); rc(q, '#4a2a98', 6, 9, 16, 33); rc(q, '#6a4ac8', 6, 9, 5, 33); rc(q, '#d8b84a', 6, 10, 16, 1);
    rc(q, OLC, 5, 42, 8, 6); rc(q, '#4a2a98', 6, 42, 6, 4); rc(q, OLC, 15, 42, 8, 6); rc(q, '#4a2a98', 16, 42, 6, 4);
    q.strokeStyle = '#e8c860'; q.lineWidth = 1.5; q.beginPath(); q.ellipse(14, 24, 5, 6, 0, 0, TAU); q.stroke(); rc(q, '#cbb4ff', 13, 22, 2, 4);
    return { img: c, ox: 14, oy: 75 };
  }
  function bench() {
    const [c, q] = mkCv(34, 18); rc(q, 'rgba(0,0,0,.28)', 2, 15, 30, 3);
    rc(q, OLC, 1, 2, 32, 7); rc(q, '#9a968a', 2, 3, 30, 5); rc(q, '#c0bcae', 2, 3, 30, 1); rc(q, OLC, 1, 9, 32, 5); rc(q, '#8a867a', 2, 10, 30, 3); rc(q, OLC, 3, 12, 3, 5); rc(q, OLC, 28, 12, 3, 5);
    return { img: c, ox: 17, oy: 15 };
  }
  function addDecor() {
    const O = V.objs, W = V.walls, add = (s, a, b, solid, extra) => { O.push({ x: Math.round(a), y: Math.round(b), img: s.img, ox: s.ox, oy: s.oy, oh: s.img.height, ...extra }); if (solid) W.push(solid) };
    const OB = obelisk(), BN = banner(), BC = bench(); PT.obs = [];
    [-1, 1].forEach((sd, i) => {
      let a = PT.x + sd * 62, b = PT.y - 14; add(BN, a, b, [a - 2, b - 3, 4, 4]);                               // panji di kiri-kanan portal
      a = PT.x + sd * 114; b = PT.y - 2; add(art.lantern(), a, b, [a - 3, b - 5, 6, 5], { glow: 1 });         // lentera tepi plaza
      a = PT.x + sd * 96; b = PT.y + 30; add(OB, a, b, [a - 7, b - 4, 14, 6]); PT.obs.push([a, b]);            // obelisk kristal
      a = PT.x + sd * 58; b = PT.y + 40; add(BC, a, b, [a - 16, b - 6, 32, 6]);                                // bangku batu
      a = PT.x + sd * 102; b = PT.y - 40; add(art.flowerbed(71 + i, 40, 22), a, b, [a - 18, b - 6, 36, 8]);    // petak bunga
    });
    const o = art.oak(91, .9), pn = art.pine(92, .9);
    add(o, 352, 726, [348, 725, 8, 5]); add(pn, 606, 732, [602, 731, 8, 5]);
    V.objs.sort((a, b) => a.y - b.y);
  }

  /* ---------- MODEL PORTAL ---------- */
  function drawPortal() {
    const X = PT.x, Y = PT.y, rx = 27, ry = 35, cy = Y - 38, I = .55 + PT.near * .25 + PT.boost * .75;
    const spin = t * (1.1 + PT.near * .6 + PT.boost * 5), pulse = .5 + .5 * Math.sin(t * 2.4);

    // lantai rune (lingkaran batu di tanah)
    ell(X, Y + 5, 42, 15, 'rgba(0,0,0,.30)');
    ell(X, Y + 3, 37, 13.5, OLC); ell(X, Y + 2, 35.5, 12.5, '#6a665c'); ell(X, Y + 1, 35.5, 12.5, '#8a867a');
    ell(X, Y + 1, 29, 10, OLC); ell(X, Y + 1, 28, 9.2, '#3a3550'); ell(X, Y + 1, 22, 7, '#2a2640');
    ell(X, Y + 1, 20, 6.4, 'rgba(120,80,255,' + (.16 + .2 * I) + ')');
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12 + spin * .15, b = .3 + .7 * Math.max(0, Math.sin(t * 3 - i * .9)) * (.5 + .5 * I);
      R('rgba(205,175,255,' + b + ')', X + Math.cos(a) * 25.5 - 1, Y + 1 + Math.sin(a) * 8.3 - 1, 2, 2);
    }

    // cincin batu
    ell(X, cy, rx + 2, ry + 2, OLC); ell(X, cy, rx, ry, '#8a867a');
    g.save(); g.beginPath(); g.rect(X - rx - 3, cy - ry - 3, rx - 3, 2 * ry + 6); g.clip(); ell(X, cy, rx, ry, '#a29e92'); g.restore();
    g.save(); g.beginPath(); g.rect(X + 8, cy - ry - 3, rx, 2 * ry + 6); g.clip(); ell(X, cy, rx, ry, '#6e6a60'); g.restore();
    g.strokeStyle = 'rgba(20,16,12,.6)'; g.lineWidth = 1; g.beginPath();
    for (let i = 0; i < 14; i++) { const a = i * TAU / 14 + .2; g.moveTo(X + Math.cos(a) * (rx - 7), cy + Math.sin(a) * (ry - 7)); g.lineTo(X + Math.cos(a) * rx, cy + Math.sin(a) * ry) }
    g.stroke();
    ell(X, cy, rx - 5.5, ry - 5.5, OLC);

    // pusaran (dipotong bentuk elips bukaan)
    const vx = rx - 9, vy = ry - 9;
    g.save(); g.beginPath(); g.ellipse(X, cy, vx, vy, 0, 0, TAU); g.clip();
    const gr = g.createRadialGradient(X, cy, 1, X, cy, vy), c0 = cl(.08 + .1 * I, 0, .3);
    gr.addColorStop(0, '#f4eaff'); gr.addColorStop(c0, '#b890ff'); gr.addColorStop(.5, '#6a3ae0'); gr.addColorStop(.85, '#2a1670'); gr.addColorStop(1, '#120a38');
    g.fillStyle = gr; g.fillRect(X - vx, cy - vy, vx * 2, vy * 2);
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      for (let j = 0; j <= 18; j++) { const r = 2 + j * 1.4, a = k * Math.PI / 2 + spin + r * .17, px = X + Math.cos(a) * r * (vx / vy), py = cy + Math.sin(a) * r; j ? g.lineTo(px, py) : g.moveTo(px, py) }
      g.strokeStyle = 'rgba(214,190,255,' + (.3 + .25 * I) + ')'; g.lineWidth = 2; g.stroke();
      g.beginPath();
      for (let j = 0; j <= 18; j++) { const r = 2 + j * 1.4, a = k * Math.PI / 2 + spin + r * .17 + .5, px = X + Math.cos(a) * r * (vx / vy), py = cy + Math.sin(a) * r; j ? g.lineTo(px, py) : g.moveTo(px, py) }
      g.strokeStyle = 'rgba(255,255,255,' + (.18 + .2 * I) + ')'; g.lineWidth = 1; g.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4 + spin * .3, d = 4 + (i * 7) % 14, tw = Math.max(0, Math.sin(t * 4 + i * 1.7));
      R('rgba(255,255,255,' + (.35 + .6 * tw) + ')', X + Math.cos(a) * d * (vx / vy) * 1.2, cy + Math.sin(a) * (6 + (i * 5) % 18), 1, 1);
    }
    ell(X, cy, 3 + 2.5 * I + pulse, 4.5 + 3 * I + pulse, 'rgba(255,250,255,.85)');
    g.restore();

    // rune pada cincin
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8 + TAU / 16, px = X + Math.cos(a) * (rx - 3.5), py = cy + Math.sin(a) * (ry - 3.5), b = (.35 + .65 * Math.max(0, Math.sin(t * 2.6 - i * .8))) * (.6 + .4 * I);
      R('#2a1a50', px - 2, py - 2, 4, 4); R('rgba(195,155,255,' + b + ')', px - 1, py - 1, 2, 2);
    }

    // kaki batu penyangga + lumut
    [-1, 1].forEach(s => {
      const bx = X + s * 24 - 8;
      R(OLC, bx - 1, Y - 12, 18, 14); R('#8a867a', bx, Y - 11, 16, 12); R('#a29e92', bx, Y - 11, 16, 2);
      R('rgba(0,0,0,.2)', bx + 10, Y - 9, 6, 10); R('rgba(255,255,255,.08)', bx, Y - 9, 3, 10); R('#4a463e', bx + 5, Y - 6, 1, 4);
    });
    R('#4aa04a', X - 31, Y - 12, 3, 4); R('#2f7a3a', X - 29, Y - 9, 2, 5); R('#4aa04a', X + 28, Y - 11, 3, 3); R('#2f7a3a', X + 27, Y - 8, 2, 4);

    // kristal kunci melayang di puncak cincin
    const ky = cy - ry - 9 + Math.sin(t * 2) * 1.5;
    g.fillStyle = OLC; g.beginPath(); g.moveTo(X, ky - 9); g.lineTo(X + 6, ky); g.lineTo(X, ky + 9); g.lineTo(X - 6, ky); g.fill();
    g.fillStyle = '#7ae0ff'; g.beginPath(); g.moveTo(X, ky - 7); g.lineTo(X + 4, ky); g.lineTo(X, ky + 7); g.lineTo(X - 4, ky); g.fill();
    g.fillStyle = '#d8fbff'; g.beginPath(); g.moveTo(X, ky - 7); g.lineTo(X - 4, ky); g.lineTo(X, ky + 1); g.fill();
  }

  /* cahaya & partikel aditif portal (digambar paling akhir agar tetap menyala di malam hari) */
  function portalGlow() {
    const X = PT.x, Y = PT.y, cy = Y - 38, I = .55 + PT.near * .25 + PT.boost * .75;
    lightL(X, cy, 74 + 8 * I + 3 * Math.sin(t * 5), '160,110,255', .2 + .2 * I);
    lightL(X, Y + 1, 46, '150,100,255', .2 + .14 * I);
    g.save(); g.globalCompositeOperation = 'lighter';
    const P = V.PZ;
    if (P) {   // rune di cincin plaza menyala berurutan + kristal obelisk berdenyut
      for (let i = 0; i < 24; i++) {
        const a = i * TAU / 24, b = Math.max(0, Math.sin(t * 2.2 - i * .55)) * (.55 + .45 * I); if (b < .08) continue;
        const qx = P.x + Math.cos(a) * (P.rx - 14), qy = P.y + Math.sin(a) * (P.ry - 9);
        lightL(qx, qy, 10 + 6 * b, '170,120,255', .16 * b + .04); g.fillStyle = 'rgba(220,200,255,' + (.35 + .5 * b) + ')'; g.fillRect(Math.round(qx) - 1, Math.round(qy) - 1, 3, 2);
      }
      (PT.obs || []).forEach(o => lightL(o[0], o[1] - 40, 26 + 3 * Math.sin(t * 3 + o[0]), '170,120,255', .34 + .08 * Math.sin(t * 2.6 + o[0])));
    }
    for (let i = 0; i < 12; i++) {
      const k = (t * .32 + i / 12) % 1, px = X + Math.sin(i * 2.7 + t * 1.1) * (14 + 8 * k), py = Y - 4 - k * 68;
      g.fillStyle = 'rgba(215,190,255,' + ((1 - k) * (.3 + .4 * I)) + ')'; g.fillRect(Math.round(px), Math.round(py), 2, k > .5 ? 3 : 2);
    }
    for (let i = 0; i < 3; i++) {
      const a = t * .9 + i * TAU / 3, ox = X + Math.cos(a) * 38, oy = cy + Math.sin(a) * 44;
      g.fillStyle = 'rgba(170,230,255,.65)'; g.fillRect(Math.round(ox) - 1, Math.round(oy) - 1, 3, 3);
      g.fillStyle = 'rgba(170,230,255,.25)'; g.fillRect(Math.round(X + Math.cos(a - .25) * 38) - 1, Math.round(cy + Math.sin(a - .25) * 44) - 1, 2, 2);
    }
    g.restore();
  }
  /* sinar, pilar cahaya & partikel portal (menyala terus; makin dahsyat saat teleport) */
  function portalFx() {
    const TR = WORLD.TR, act = TR.on && TR.k === 'portalLobby' && window.AREA === 'village', T = act ? (TR.fxT || 0) : 0;
    const X = PT.x, Y = PT.y, cy = Y - 38, I = .55 + PT.near * .25 + PT.boost * .75, pulse = .5 + .5 * Math.sin(t * 2.4);
    const bm = act ? E(cl((T - .45) / .55, 0, 1)) * (1 - E(cl((T - 1.8) / .2, 0, 1))) : 0;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {      // sinar berputar dari pusaran
      const a = t * (.22 + PT.boost * 1.5) + i * TAU / 9, L = 62 + 22 * Math.sin(t * 1.7 + i * 2.1) + 50 * PT.boost + 40 * bm, hw = .06 + .015 * Math.sin(t * 2 + i), al = .05 + .05 * I;
      for (let l = 0; l < 2; l++) { const LL = L * (l ? .55 : 1); g.fillStyle = 'rgba(190,150,255,' + (l ? al * 1.6 : al) + ')'; g.beginPath(); g.moveTo(X + Math.cos(a - hw) * 6, cy + Math.sin(a - hw) * 5); g.lineTo(X + Math.cos(a) * LL, cy + Math.sin(a) * LL * .9); g.lineTo(X + Math.cos(a + hw) * 6, cy + Math.sin(a + hw) * 5); g.fill() }
    }
    const top = cy - 158 - 80 * bm, w0 = 7 + 4 * pulse + 3 * PT.near, w1 = w0 + 26 * bm;      // pilar sinar
    const gr = g.createLinearGradient(0, Y + 2, 0, top); gr.addColorStop(0, 'rgba(225,205,255,' + (.2 + .12 * I + .55 * bm) + ')'); gr.addColorStop(.55, 'rgba(180,140,255,' + (.07 + .05 * I + .3 * bm) + ')'); gr.addColorStop(1, 'rgba(180,140,255,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(X - w1 / 2, Y + 2); g.lineTo(X + w1 / 2, Y + 2); g.lineTo(X + w0 / 3, top); g.lineTo(X - w0 / 3, top); g.fill();
    if (bm > .02) { g.fillStyle = 'rgba(255,255,255,' + .5 * bm + ')'; g.fillRect(Math.round(X - 3 - 3 * bm), Math.round(top + 20), Math.round(6 + 6 * bm), Math.round(Y - top - 18)) }
    for (let i = 0; i < 18; i++) {      // partikel mengorbit lantai rune
      const a = t * (.9 + PT.boost * 3) * (i % 2 ? 1 : -1) + i * 2.4, rr = 24 + (i % 4) * 3.5, px = X + Math.cos(a) * rr, py = Y + 1 + Math.sin(a) * rr * .3 - 3 - (1 + Math.sin(t * 2 + i)) * 4;
      g.fillStyle = 'rgba(' + (i % 3 ? '215,190,255' : '170,230,255') + ',' + (.35 + .4 * I) + ')'; g.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
    for (let i = 0; i < 22; i++) {      // partikel naik
      const k = (t * .4 + i / 22) % 1, px = X + Math.sin(i * 2.1 + t * 1.3) * (10 + 16 * k), py = Y - 2 - k * 110;
      g.fillStyle = 'rgba(225,205,255,' + ((1 - k) * (.35 + .4 * I)) + ')'; g.fillRect(Math.round(px), Math.round(py), i % 3 ? 2 : 3, 2);
    }
    for (let i = 0; i < 4; i++) {      // percikan petir kecil dari tepi cincin
      const q = (t * .9 + i * .27) % 1; if (q > .16) continue;
      const a = i * 1.7 + Math.floor(t * .9 + i * .27) * 2.3, sx = X + Math.cos(a) * 27, sy = cy + Math.sin(a) * 35; g.strokeStyle = 'rgba(225,205,255,' + (1 - q / .16) * .9 + ')'; g.lineWidth = 1; g.beginPath(); g.moveTo(sx, sy);
      for (let j = 1; j <= 4; j++) g.lineTo(sx + Math.cos(a) * j * 6 + (hash(i * 7 + j, Math.floor(t * 12), 3) - .5) * 8, sy + Math.sin(a) * j * 6 + (hash(i * 5 + j, Math.floor(t * 12), 4) - .5) * 8);
      g.stroke();
    }
    if (act) {      // efek khusus saat teleport: gelombang kejut, pusaran partikel, aura pahlawan
      const hx = p.x, hyy = p.y - 14 - (TR.hy || 0);
      [.55, 1.1, 1.55].forEach(s0 => { const q = (T - s0) / .9; if (q > 0 && q < 1) { g.lineWidth = 2.4 * (1 - q) + .5; g.strokeStyle = 'rgba(225,205,255,' + (1 - q) * .9 + ')'; g.beginPath(); g.ellipse(X, Y + 1, 18 + 84 * q, 6 + 29 * q, 0, 0, TAU); g.stroke() } });
      const sT = E(cl((T - .45) / .45, 0, 1));
      for (let i = 0; i < 40; i++) { const u = (i / 40 + T * .8) % 1, a = i * 2.4 + T * 7 * (1 + u), r = 66 * (1 - u) + 4; g.fillStyle = 'rgba(' + (i % 3 ? '220,195,255' : '170,230,255') + ',' + (u * .95 * sT) + ')'; g.fillRect(Math.round(hx + Math.cos(a) * r), Math.round(hyy + Math.sin(a) * r * .5), 2, 2) }
      lightL(hx, hyy, 36 + 40 * bm, '225,205,255', .45 * bm);
      if (T > 1.3) { const f = E(cl((T - 1.3) / .6, 0, 1)) * 40; g.fillStyle = 'rgba(255,255,255,' + .8 * (1 - E(cl((T - 1.85) / .15, 0, 1))) + ')'; g.fillRect(Math.round(hx - f), Math.round(hyy), Math.round(f * 2), 1); g.fillRect(Math.round(hx), Math.round(hyy - f), 1, Math.round(f * 2)) }
    }
    g.restore();
  }

  /* kristal air mancur: cahaya & kilau digambar paling akhir agar tetap bersinar di malam hari */
  function fountainGlow() {
    const o = V.objs.find(q => q.fountain); if (!o) return;
    const vw = W / CAM_Z, vh = H / CAM_Z; if (o.x < camX - 140 || o.x > camX + vw + 140 || o.y < camY - 60 || o.y > camY + vh + 200) return;
    const X = o.x, cy = o.y - 66 + Math.sin(t * 2) * 2.5, sh = .5 + .5 * Math.sin(t * 3.1), sh2 = .5 + .5 * Math.sin(t * 5.3 + 1), n = V.night || 0;
    lightL(X, cy, 90 + 10 * sh, '120,225,255', .26 + .22 * n + .08 * sh);
    lightL(X, o.y - 8, 60, '110,210,255', .1 + .12 * n);
    g.save(); g.globalCompositeOperation = 'lighter';
    const fl = (14 + 12 * sh) * (1 + .5 * n); g.fillStyle = 'rgba(235,253,255,' + (.35 + .35 * sh2 + .2 * n) + ')'; g.fillRect(Math.round(X - fl), Math.round(cy), Math.round(fl * 2), 1); g.fillRect(Math.round(X), Math.round(cy - fl), 1, Math.round(fl * 2));
    for (let i = 0; i < 14; i++) { const k = (t * .45 + i / 14) % 1, ang = i * 2.4 + t * .6, r = 6 + k * 16; g.fillStyle = 'rgba(190,245,255,' + ((1 - k) * (.5 + .4 * n)) + ')'; g.fillRect(Math.round(X + Math.cos(ang) * r), Math.round(cy + 8 + k * (o.y - 14 - cy)), i % 3 ? 1 : 2, 2) }
    for (let i = 0; i < 6; i++) { const k = (t * .3 + i / 6) % 1; g.fillStyle = 'rgba(215,250,255,' + (1 - k) * .7 + ')'; g.fillRect(Math.round(X + Math.sin(i * 3.3 + t) * (4 + k * 14)), Math.round(cy - 4 - k * 36), 2, 2) }
    g.restore();
  }
  const _df = V.drawFront;
  V.drawFront = function () {
    _df.apply(this, arguments);
    guard(fountainGlow);
    if (PT.done && !(WORLD.TR.on && WORLD.TR.k === 'portalLobby' && window.AREA !== 'village')) {
      const vw = W / CAM_Z, vh = H / CAM_Z;
      if (PT.x > camX - 200 && PT.x < camX + vw + 200 && PT.y > camY - 140 && PT.y < camY + vh + 200) { guard(portalGlow); guard(portalFx) }
    }
  };
  const _tk = V.tick;
  V.tick = function (dt) {
    _tk.call(this, dt);
    if (!PT.done) return;
    const d = Math.hypot(p.x - PT.x, p.y - (PT.y + 10));
    PT.near += ((d < 110 ? 1 : 0) - PT.near) * Math.min(1, dt * 3);
    const TR = WORLD.TR;      // menginjak lantai rune = langsung teleport (tanpa tombol)
    if (TR.on) PT.cd = 2; else if (PT.cd > 0) PT.cd -= dt;
    else if (!(typeof dlg !== 'undefined' && dlg) && p && !(p.dead > 0) && Math.hypot(p.x - PT.x, (p.y - (PT.y + 3)) * 1.7) < 30) startTeleport();
  };

  /* ---------- TELEPORT: Desa -> Lobby ---------- */
  function startTeleport() {
    const TR = WORLD.TR; if (TR.on || !p || p.dead > 0) return;
    WORLD.start('portalLobby', { x0: p.x, y0: p.y, hs: 1, hy: 0, hr: 0, pf: 0, lob: 0 });
    msg('Portal Lobby bersinar... kau melangkah masuk.');
  }
  WORLD.teleportToLobby = startTeleport;

  const walk = (dt, moving) => { p.wb += ((moving ? 1 : 0) - p.wb) * Math.min(1, dt * 12); p.wph += dt * 12 * (.2 + p.wb * .8) * 1.2; p.idt += dt * 3 };
  SEQ.portalLobby = {
    dur: 4.3,
    f(T, dt) {
      const TR = WORLD.TR, ph = (a, b) => cl((T - a) / (b - a), 0, 1);
      TR.fxT = T;
      if (T < SW) {
        // di Desa: melangkah ke lantai rune -> portal menyala, gelombang kejut, pahlawan melayang & berputar cepat di pilar sinar -> mengecil -> kilat
        const k = E(ph(0, .7)), s = ph(.7, 1.85), se = E(s), mv = k > 0 && k < 1;
        p.x = TR.x0 + (PT.x - TR.x0) * k; p.y = TR.y0 + ((PT.y + 2) - TR.y0) * k;
        p.vx = 0; p.vy = mv ? -60 : 0; p.face = -Math.PI / 2; walk(dt, mv);
        TR.hs = 1 - E(ph(1.1, 1.85)); TR.hy = 54 * se; TR.hr = 20 * s * s;
        PT.boost = E(ph(0, .9)); TR.vg = E(ph(.4, 1.5)) * (1 - E(ph(1.8, SW))); TR.pf = E(ph(1.5, SW));
        if (!TR.s1) { TR.s1 = 1; try { SFX.focus() } catch (e) { } }
        if (T > 1.15 && !TR.s2) { TR.s2 = 1; try { SFX.focus() } catch (e) { } }
      } else {
        if (!TR.sw) {
          TR.sw = 1; PT.boost = 0;
          WORLD.setLobby(); WORLD._toLobbyArea();
          p.x = LOBBY_SPAWN[0]; p.y = LOBBY_SPAWN[1]; p.vx = p.vy = 0; p.face = Math.PI / 2;
          camInit = false; camUpd(0);
          WORLD.banner.t = 0; WORLD.banner.a = 'LOBBY'; WORLD.banner.b = 'Sanctum Hall \u2014 Zona Aman';
          try { SFX.door() } catch (e) { }
          msg('Kau tiba di Lobby \u2014 Zona Aman.');
        }
        // di Lobby: pilar sinar turun, gelombang kejut + ledakan partikel, pahlawan muncul berputar & turun perlahan, lingkaran menutup
        const s = ph(2.35, 3.4), se = E(s);
        TR.vg = 0; TR.pf = 1 - E(ph(SW, 2.85)); TR.lob = E(ph(SW, 2.5)) * (1 - E(ph(3.6, 4.25)));
        TR.hs = E(ph(2.35, 3.0)); TR.hy = 48 * (1 - se); TR.hr = -20 * (1 - s) * (1 - s);
        p.vx = p.vy = 0; p.face = Math.PI / 2; walk(dt, false);
      }
    }
  };

  /* pahlawan mengecil/berputar saat tersedot & muncul */
  const xf = fn => function () {
    const TR = WORLD.TR;
    if (TR.on && TR.k === 'portalLobby' && TR.hs != null) {
      if (TR.hs < .03) return;
      const cx = p.x, cy = p.y - 12;
      g.save(); g.translate(cx, cy - (TR.hy || 0)); g.rotate(TR.hr || 0); g.scale(TR.hs, TR.hs); g.translate(-cx, -cy);
      try { return fn.apply(this, arguments) } finally { g.restore() }
    }
    return fn.apply(this, arguments);
  };
  drawHero = xf(drawHero); drawArmed = xf(drawArmed);

  /* lingkaran rune tempat pahlawan muncul di Lobby (lantai di bawah pahlawan + pilar cahaya di atasnya) */
  const LX = LOBBY_SPAWN[0], LY = LOBBY_SPAWN[1];
  function lobbyRingGround(k) {
    const T = WORLD.TR.fxT || 0;
    ell(LX, LY + 3, 38 * k, 13 * k, 'rgba(10,4,30,.5)');
    g.lineWidth = 1.5; g.strokeStyle = 'rgba(190,150,255,' + .85 * k + ')'; g.beginPath(); g.ellipse(LX, LY + 3, 32 * k, 11 * k, 0, 0, TAU); g.stroke();
    g.lineWidth = 1; g.strokeStyle = 'rgba(150,200,255,' + .6 * k + ')'; g.beginPath(); g.ellipse(LX, LY + 3, 22 * k, 7.5 * k, 0, 0, TAU); g.stroke();
    for (let i = 0; i < 14; i++) { const a = i * TAU / 14 + t * 1.2; R('rgba(225,205,255,' + .9 * k + ')', LX + Math.cos(a) * 27 * k, LY + 3 + Math.sin(a) * 9.2 * k, 2, 2) }
    [2.3, 2.75].forEach(s0 => { const q = (T - s0) / .85; if (q > 0 && q < 1) { g.lineWidth = 2.2 * (1 - q) + .5; g.strokeStyle = 'rgba(225,205,255,' + (1 - q) * .9 + ')'; g.beginPath(); g.ellipse(LX, LY + 3, 16 + 92 * q, 5 + 31 * q, 0, 0, TAU); g.stroke() } });
  }
  function lobbyRingLight(k) {
    const T = WORLD.TR.fxT || 0, burst = E(cl((T - 2.2) / .5, 0, 1));
    lightL(LX, LY - 10, 70 * k + 6 + 40 * burst * (1 - E(cl((T - 3.6) / .65, 0, 1))), '170,120,255', .5 * k);
    g.save(); g.globalCompositeOperation = 'lighter';
    const bw = (10 + 22 * burst) * k, gr = g.createLinearGradient(0, LY + 3, 0, LY - 170); gr.addColorStop(0, 'rgba(235,220,255,' + .7 * k + ')'); gr.addColorStop(.5, 'rgba(190,150,255,' + .38 * k + ')'); gr.addColorStop(1, 'rgba(190,150,255,0)');
    g.fillStyle = gr; g.fillRect(LX - bw / 2, LY - 170, bw, 173); g.fillStyle = 'rgba(255,255,255,' + .35 * k * burst + ')'; g.fillRect(Math.round(LX - bw * .17), LY - 140, Math.max(1, Math.round(bw * .34)), 143);
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i - 4.5) * .22 + Math.sin(t * .7 + i) * .05, L = (70 + 40 * Math.sin(t * 1.9 + i * 2)) * k * (.4 + .6 * burst), hw = .05; g.fillStyle = 'rgba(215,190,255,' + .11 * k * burst + ')'; g.beginPath(); g.moveTo(LX + Math.cos(a - hw) * 4, LY - 6); g.lineTo(LX + Math.cos(a) * L, LY - 6 + Math.sin(a) * L); g.lineTo(LX + Math.cos(a + hw) * 4, LY - 6); g.fill() }
    const q0 = cl((T - 2.3) / 1.3, 0, 1);
    for (let i = 0; i < 34; i++) { const a = i * 2.39996, sp = 30 + (i * 37) % 50, r = E(q0) * sp; g.fillStyle = 'rgba(' + (i % 3 ? '225,205,255' : '170,230,255') + ',' + (1 - q0) * .95 + ')'; g.fillRect(Math.round(LX + Math.cos(a) * r), Math.round(LY - 18 + Math.sin(a) * r * .55 - q0 * 30 + q0 * q0 * 26), 2, 2) }
    for (let i = 0; i < 22; i++) { const q = (t * .9 + i / 22) % 1; g.fillStyle = 'rgba(225,205,255,' + (1 - q) * .8 * k + ')'; g.fillRect(Math.round(LX + Math.sin(i * 3.1 + t * 2) * 14 * (1 - q * .4)), Math.round(LY + 2 - q * 80), 2, 2) }
    g.restore();
  }
  const inLobbyFx = () => { const TR = WORLD.TR; return TR.on && TR.k === 'portalLobby' && TR.lob > .01 && window.AREA === 'lobby' };
  const _ld = lobbyDraw;
  lobbyDraw = function () { _ld.apply(this, arguments); guard(() => { if (inLobbyFx()) lobbyRingGround(WORLD.TR.lob) }) };
  const _of = window.outFront;
  window.outFront = function () { if (_of) _of.apply(this, arguments); guard(() => { if (inLobbyFx()) lobbyRingLight(WORLD.TR.lob) }) };

  /* kilat ungu layar penuh (di atas HUD) */
  const _dr = draw;
  draw = function () {
    _dr.apply(this, arguments);
    guard(() => {
      const TR = WORLD.TR; if (!(TR.on && TR.k === 'portalLobby')) return;
      if (TR.vg > .01) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .2, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, 'rgba(120,70,220,0)'); vg.addColorStop(1, 'rgba(90,40,190,' + .55 * TR.vg + ')'); g.fillStyle = vg; g.fillRect(0, 0, W, H); g.restore() }
      if (TR.pf > .003) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(232,218,255,' + cl(TR.pf, 0, 1) + ')'; g.fillRect(0, 0, W, H); g.restore() }
    });
  };
})();

/* =====================================================================
   TAMBAHAN: GERBANG UTARA DESA -> KERAJAAN AURELIA
   ---------------------------------------------------------------------
   DESA
   - Tembok utara & pagar tanaman dibuka di ujung Jalan Utara (x=640).
   - Gerbang batu + panji mahkota + lentera + dua prajurit kerajaan.
   - Berjalan ke utara melewati gerbang -> area 'kingdom'.
   KERAJAAN (dibuat hanya bila game belum punya WORLD.AREAS.kingdom)
   - Istana besar (menara, panji berkibar, jendela menyala di malam hari).
   - Tembok kota + gerbang selatan, jalan raya, plaza & monumen raja,
     taman istana, rumah-rumah kota, pohon, lentera.
   - NPC: prajurit (model sama seperti penjaga desa), pengawal istana,
     warga yang berjalan, pulang ke rumah saat malam, penyala lentera.
   - JAM, CUACA, HUJAN, PETIR, MALAM memakai satu timeline yang sama dengan
     Desa & Hutan (WORLD.WX), jadi waktu terus berlanjut saat pindah area.
   ===================================================================== */
(function () {
  'use strict';
  const V = WORLD.AREAS.village;
  if (!V) return;
  const { TAU, mkCv, rc, ell, hash, vnoise, mkRng, mixc, h2r, lightL, art } = WORLD;
  const OLC = '#14100c';
  const guard = f => { try { f() } catch (e) { if (!guard.w) { guard.w = 1; console.warn('[kerajaan]', e) } } };
  const cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const rgb = a => 'rgb(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ')';
  const Rr = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h) };
  const Qc = (q, c, a, b, w, h) => rc(q, c, Math.round(a), Math.round(b), Math.round(w), Math.round(h));
  const SH0 = '#9a968a', SHL = '#b9b5a8', SHD = '#7e7a70', SHM = '#aaa69a', SHC = '#cfcbbd', BAK = '#4e4a42', MO = 'rgba(60,56,48,.32)';
  const GOLD = '#d8b84a', CR = '#a8283e', CRD = '#7a1a2a', BLU = '#2f5aa8';
  const PZC = ['#a29e92', '#9a9488', '#8e897d', '#b0aa9c'];

  /* ---------------- helper gambar umum ---------------- */
  const mortarC = (q, x0, y0, w, h, per) => { for (let j = 0; j * 6 < h; j++) { Qc(q, MO, x0, y0 + j * 6 + 5, w, 1); for (let k = (j % 2) * per / 2; k < w; k += per) Qc(q, MO, x0 + k, y0 + j * 6, 1, Math.min(6, h - j * 6)) } };
  const coneC = (q, ccx, yTop, yBot, wb, col) => {      // atap kerucut bersisik + tiang puncak emas
    const r0 = h2r(col), L = rgb(mixc(r0, [255, 220, 170], .25)), D = rgb(mixc(r0, [20, 10, 20], .35)), hh = yBot - yTop;
    for (let j = 0; j < hh; j++) { const wj = Math.round(4 + (wb - 4) * (j / hh)); Qc(q, OLC, ccx - wj / 2 - 1, yTop + j, wj + 2, 1) }
    for (let j = 0; j < hh; j++) {
      const wj = Math.round(4 + (wb - 4) * (j / hh)), x0 = ccx - wj / 2, band = Math.floor(j / 5);
      Qc(q, col, x0, yTop + j, wj, 1); Qc(q, L, x0, yTop + j, wj / 2, 1); Qc(q, D, ccx, yTop + j, wj / 2, 1);
      if (j % 5 === 4) Qc(q, D, x0, yTop + j, wj, 1); else if (j % 5 === 0) Qc(q, 'rgba(255,255,255,.1)', x0, yTop + j, wj, 1);
      for (let k = (band % 2) * 4; k < wj; k += 8) Qc(q, D, x0 + k, yTop + j, 1, 4)
    }
    Qc(q, OLC, ccx - wb / 2 - 3, yBot - 1, wb + 6, 5); Qc(q, D, ccx - wb / 2 - 2, yBot, wb + 4, 3); Qc(q, 'rgba(0,0,0,.3)', ccx - wb / 2 - 2, yBot + 3, wb + 4, 2);
    Qc(q, OLC, ccx - 1, yTop - 16, 3, 18); Qc(q, '#6a5a3a', ccx, yTop - 15, 1, 17); Qc(q, OLC, ccx - 3, yTop - 5, 7, 6); Qc(q, GOLD, ccx - 2, yTop - 4, 5, 4); Qc(q, '#fff0a0', ccx - 2, yTop - 4, 2, 2)
  };
  const crenelC = (q, x0, y0, w) => { for (let k = 0; k + 10 <= w; k += 14) { Qc(q, OLC, x0 + k - 1, y0 - 10, 12, 11); Qc(q, SHL, x0 + k, y0 - 9, 10, 10); Qc(q, SHC, x0 + k, y0 - 9, 10, 2); Qc(q, SHD, x0 + k + 7, y0 - 7, 3, 8) } };
  const blockC = (q, x0, y0, w, h) => { Qc(q, OLC, x0 - 1, y0 - 1, w + 2, h + 2); Qc(q, SH0, x0, y0, w, h); mortarC(q, x0, y0, w, h, 14); Qc(q, SHL, x0, y0, 3, h); Qc(q, SHD, x0 + w - 6, y0, 6, h); Qc(q, 'rgba(255,255,255,.10)', x0, y0, w, 2) };
  const crownC = (q, cx, y, col) => { Qc(q, col, cx - 5, y + 6, 10, 3); Qc(q, col, cx - 5, y, 2, 8); Qc(q, col, cx - 1, y - 2, 2, 10); Qc(q, col, cx + 3, y, 2, 8) };

  /* =================================================================
     BAGIAN 1 - GERBANG UTARA DI DESA
     ================================================================= */
  const GX = 640, GW = 116, GL = GX - GW / 2, GR = GX + GW / 2;

  function carve() {
    const W = V.walls; if (!W) return;
    for (let i = W.length - 1; i >= 0; i--) { const r = W[i]; if (r[1] <= 50 && r[1] + r[3] <= 64 && r[2] > 400) W.splice(i, 1) }   // tembok utara & pagar utara
    W.push([-20, -20, GL + 20, 44], [GR, -20, V.w - GR + 20, 44]);        // tembok kiri & kanan gerbang
    W.push([28, 50, GL - 28, 10], [GR, 50, V.w - 28 - GR, 10]);            // pagar tanaman kiri & kanan
    W.push([GL - 14, -20, 14, 60], [GR, -20, 14, 60]);                     // tiang gerbang
  }

  function paintGate() {
    const c = V.bg.getContext('2d'), R = (col, a, b, w, h) => rc(c, col, Math.round(a), Math.round(b), Math.round(w), Math.round(h));
    R('#6f5f42', GL, 0, GW, 64);
    for (let yy = 0; yy < 64; yy += 4) for (let xx = 0; xx < GW; xx += 6) if (hash(GL + xx, yy, 71) > .55) R('#7d6d4c', GL + xx, yy, 4, 2);
    for (let yy = 4; yy < 44; yy += 8) for (let xx = 0; xx < GW; xx += 12) R((xx / 12 + yy / 8) % 2 ? '#8e897d' : '#a29e92', GL + xx + ((yy / 8) % 2 ? 6 : 0), yy, 11, 7);
    R('#7d6d4c', GX - 28, 60, 56, 40);                                      // sambungan ke Jalan Utara
    for (let yy = 60; yy < 100; yy += 4) for (let xx = -28; xx < 28; xx += 6) if (hash(GX + xx, yy, 72) > .6) R('#8d7d5c', GX + xx, yy, 4, 2);
    [GL - 14, GR].forEach(px => {
      R(OLC, px - 1, 0, 16, 50); R(SH0, px, 0, 14, 49); R(SHL, px, 0, 4, 49); R(SHD, px + 10, 0, 4, 49);
      for (let j = 0; j < 8; j++) R(MO, px, 6 + j * 6, 14, 1);
      R(OLC, px - 3, 44, 20, 8); R(SHM, px - 2, 45, 18, 6); R(SHC, px - 2, 45, 18, 2);
      R(OLC, px - 3, 0, 20, 7); R(SHC, px - 2, 1, 18, 4);
    });
    R(OLC, GL - 14, 0, GW + 28, 20); R(SH0, GL - 13, 1, GW + 26, 18); R(SHC, GL - 13, 1, GW + 26, 2); R(SHD, GL - 13, 15, GW + 26, 4);
    for (let k = GL - 8; k < GR + 8; k += 12) { R(SHL, k, 3, 10, 6); R(SHD, k + 7, 4, 3, 5) }
    R(OLC, GX - 13, 2, 26, 30); R(CR, GX - 12, 3, 24, 26); R(GOLD, GX - 12, 3, 24, 2); R(GOLD, GX - 12, 27, 24, 2);
    R(GOLD, GX - 6, 16, 12, 3); R(GOLD, GX - 6, 10, 3, 9); R(GOLD, GX - 1, 8, 3, 11); R(GOLD, GX + 3, 10, 3, 9);          // lambang mahkota
    R(CR, GX - 12, 29, 8, 5); R(CR, GX + 4, 29, 8, 5);
    R('rgba(0,0,0,.25)', GL, 44, GW, 6);
    [[GL - 20, 58], [GR + 20, 58]].forEach(([a, b]) => { const s = art.lantern(); V.objs.push({ x: a, y: b, img: s.img, ox: s.ox, oy: s.oy, oh: s.img.height, glow: 1 }) });
  }

  function addGatePeople() {
    const N = V.npcs;
    const gd = (n, x, y, fc, lines) => ({ n, x, y, fc, sk: '#d9a07a', hair: '#3a2a1a', hat: 'helm', armor: 1, c1: CR, c2: GOLD, c3: '#3a3d48', prop: 'spear', lines });
    [gd('Prajurit Kerajaan, Darto', GL - 4, 74, 1, ['Jalan ini menuju Kerajaan Aurelia. Raja menerima siapa pun yang datang dengan niat baik.', 'Di balik tembok kota ada ibu kota, kastil, dan plaza para bangsawan. Jaga sikapmu, pahlawan.']),
    gd('Prajurit Kerajaan, Wira', GR + 4, 74, -1, ['Kami berjaga siang dan malam. Sejak pahlawan keluar dari Aula Kuno, para pejabat istana sering menanyakan kabarmu.', 'Silakan lewat. Jalan utara aman sampai gerbang ibu kota.'])].forEach(q => {
      N.push(q); const e = { n: q, i: V.dyn.length, get y() { return q.y } }; V.dyn.push(e); if (V._all) V._all.push(e)      // _all: agar tidak hilang saat jadwal warga berjalan
    });
    N.push({ n: 'Papan Jalan', x: GX + 52, y: 100, sign: 1, rng: 40, verb: 'Baca', _bn: Infinity, lines: ['\u2191 KERAJAAN AURELIA \u2014 Ibu Kota', '\u2193 Desa Lembah Lentera'] });
  }

  const _vb = V.build;
  V.build = function () { _vb.apply(this, arguments); guard(carve); guard(paintGate); guard(addGatePeople); guard(() => { V.objs.sort((a, b) => a.y - b.y) }) };
  if (V.ready) { guard(carve); guard(paintGate); guard(addGatePeople) }

  const _vt = V.tick;
  V.tick = function (dt) {
    _vt.call(this, dt);
    const T = WORLD.TR; if (T.on || !p) return;
    if (T.cool <= 0 && p.y < 30 && Math.abs(p.x - GX) < GW / 2 && p.vy < -8) {
      const K = WORLD.AREAS.kingdom;
      WORLD.start('gate', { to: 'kingdom', dx: 0, dy: -1, spawn: K ? K.spawn.slice() : [900, 1040] });
      msg('Menuju Kerajaan Aurelia...');
    }
  };

  /* =================================================================
     BAGIAN 2 - AREA KERAJAAN AURELIA
     ================================================================= */
  if (WORLD.AREAS.kingdom) return;          // game sudah punya area kerajaan sendiri -> jangan ditimpa
  const KW = 1800, KH = 1160, AX = 900, PY = 420, G0 = 840, G1 = 960;
  const K = WORLD.AREAS.kingdom = { name: 'KERAJAAN AURELIA', sub: 'Kingdom of Aurelia', w: KW, h: KH, spawn: [AX, KH - 120], ready: 0, objs: [], dyn: [], npcs: [], walls: [], bg: null, _L: [], ff: [] };

  /* ---------- sprite: istana ---------- */
  function palaceSprite() {
    const Wd = 720, H = 394, [c, q] = mkCv(Wd, H), cx = 360, GY = 364, lamps = [], flags = [], Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h);
    const win = (wx, wy) => {
      Q(OLC, wx - 2, wy - 2, 18, 33); Q('#5a4630', wx - 1, wy - 1, 16, 31); Q('#ffd870', wx, wy + 2, 14, 27); Q('#ffe9a0', wx, wy + 2, 14, 4);
      Q(SH0, wx - 1, wy - 1, 3, 3); Q(SH0, wx + 12, wy - 1, 3, 3); Q('#6a4a2c', wx + 6, wy + 2, 2, 27); Q('#6a4a2c', wx, wy + 13, 14, 2); Q('#fff3b8', wx + 1, wy + 3, 4, 5);
      Q(OLC, wx - 4, wy + 29, 22, 4); Q(SHC, wx - 3, wy + 29, 20, 3); lamps.push([wx + 7, wy + 16]);
    };
    const banner = (bx, by) => {
      Q(OLC, bx - 1, by, 22, 52); Q(CR, bx, by + 1, 20, 46); Q('rgba(255,255,255,.18)', bx, by + 1, 5, 46); Q(GOLD, bx, by + 1, 20, 2); Q(GOLD, bx, by + 44, 20, 2);
      crownC(q, bx + 10, by + 14, GOLD); Q(CR, bx, by + 47, 8, 5); Q(CR, bx + 12, by + 47, 8, 5);
    };
    const tower = (x0, roofCol) => {
      const w = 96, tc = x0 + w / 2;
      blockC(q, x0, 92, w, GY - 92); Q('rgba(255,255,255,.14)', x0 + 2, 92, 8, GY - 92); Q('rgba(0,0,0,.22)', x0 + w - 14, 92, 14, GY - 92);
      [128, 196, 262].forEach(yy => { Q(OLC, tc - 3, yy, 7, 17); Q('#ffd870', tc - 2, yy + 1, 5, 15); lamps.push([tc, yy + 9]) });
      win(tc - 7, 300);
      Q(OLC, x0 - 6, 86, w + 12, 10); Q(SHL, x0 - 5, 87, w + 10, 5); Q(GOLD, x0 - 5, 92, w + 10, 2);
      coneC(q, tc, 22, 90, w + 28, roofCol); flags.push([tc + 1, 7, CR, 24]);
    };
    /* aula utama */
    blockC(q, 120, 186, 480, GY - 186); Q(OLC, 112, 180, 496, 10); Q(SHC, 113, 181, 494, 6); Q(GOLD, 113, 187, 494, 2); crenelC(q, 120, 180, 480);
    Q(OLC, 114, GY - 10, 492, 12); Q(SHD, 115, GY - 9, 490, 10); Q(SH0, 115, GY - 9, 490, 1);
    [206, 280].forEach(wy => [150, 196, 242, 464, 510, 556].forEach(wx => win(wx, wy)));
    banner(168, 198); banner(532, 198);
    /* menara samping */
    tower(36, BLU); tower(588, BLU);
    /* menara utama (keep) */
    blockC(q, 280, 90, 160, GY - 90); Q(OLC, 274, 84, 172, 10); Q(SHL, 275, 85, 170, 5); Q(GOLD, 275, 90, 170, 2);
    coneC(q, cx, 22, 94, 196, CR); flags.push([cx + 1, 5, GOLD, 28]);
    q.fillStyle = OLC; q.beginPath(); q.arc(cx, 138, 23, 0, TAU); q.fill(); q.fillStyle = SHC; q.beginPath(); q.arc(cx, 138, 21, 0, TAU); q.fill();
    q.fillStyle = GOLD; q.beginPath(); q.arc(cx, 138, 17, 0, TAU); q.fill(); q.fillStyle = '#ffd870'; q.beginPath(); q.arc(cx, 138, 13, 0, TAU); q.fill();
    q.strokeStyle = '#6a4a2c'; q.lineWidth = 1; q.beginPath(); for (let i = 0; i < 8; i++) { q.moveTo(cx, 138); q.lineTo(cx + Math.cos(i * TAU / 8) * 13, 138 + Math.sin(i * TAU / 8) * 13) } q.stroke();
    q.fillStyle = '#fff3b8'; q.beginPath(); q.arc(cx, 138, 3, 0, TAU); q.fill(); lamps.push([cx, 138]);
    win(308, 176); win(398, 176);
    Q(OLC, 294, 232, 132, 11); Q(SHC, 295, 233, 130, 6); Q(GOLD, 296, 226, 128, 2); for (let k = 0; k < 12; k++) Q('#8a7a4a', 298 + k * 10, 227, 2, 7);
    Q(OLC, cx - 10, 246, 20, 25); Q(CR, cx - 9, 247, 18, 20); Q(GOLD, cx - 6, 252, 12, 3); Q(GOLD, cx - 1, 252, 2, 11); Q(CR, cx - 5, 267, 10, 3);
    /* pintu agung */
    Q(OLC, cx - 34, 282, 68, GY - 282 + 2); Q(SHC, cx - 32, 284, 64, GY - 284);
    const dx0 = cx - 26; Q('#4a2e1a', dx0, 294, 52, GY - 294); Q('#6a4220', dx0, 294, 26, GY - 294); Q('#5a3418', cx, 294, 26, GY - 294);
    for (let j = 0; j < 5; j++) Q('rgba(255,255,255,.08)', dx0, 296 + j * 14, 52, 1);
    Q(GOLD, cx - 1, 294, 2, GY - 294); Q(GOLD, dx0, 320, 52, 2); Q(GOLD, dx0, 344, 52, 2);
    for (let j = 0; j < 3; j++) { Q('#fff0a0', dx0 + 5, 326 + j * 8, 2, 2); Q('#fff0a0', dx0 + 45, 326 + j * 8, 2, 2) }
    Q(SHC, dx0, 294, 5, 5); Q(SHC, dx0 + 47, 294, 5, 5);
    [-50, 50].forEach(o => { Q(OLC, cx + o - 5, 302, 10, 16); Q('#ffd870', cx + o - 4, 303, 8, 14); Q('#fff3b8', cx + o - 4, 303, 3, 3); Q(OLC, cx + o - 6, 300, 12, 3); lamps.push([cx + o, 311]) });
    /* tangga + karpet merah */
    for (let i = 0; i < 3; i++) { Q(OLC, cx - 72 - i * 10, GY + i * 7, 144 + i * 20, 9); Q('#a29e92', cx - 71 - i * 10, GY + 1 + i * 7, 142 + i * 20, 7); Q('#c4bfb0', cx - 71 - i * 10, GY + 1 + i * 7, 142 + i * 20, 1) }
    Q(CR, cx - 22, GY, 44, 23); Q(GOLD, cx - 22, GY, 2, 23); Q(GOLD, cx + 20, GY, 2, 23);
    return { img: c, ox: cx, oy: 370, lamps, flags };
  }

  function towerSprite(w, h, roofCol) {
    const rh = Math.round(w * .95), pad = 20, Wd = w + 16, Ht = pad + rh + h + 6, [c, q] = mkCv(Wd, Ht), cx = Wd / 2, x0 = 8, y0 = pad + rh, Q = (col, a, b, ww, hh) => Qc(q, col, a, b, ww, hh), lamps = [];
    Q(OLC, x0 - 1, y0 - 1, w + 2, h + 2); Q(SH0, x0, y0, w, h); mortarC(q, x0, y0, w, h, 12); Q('rgba(255,255,255,.14)', x0, y0, 7, h); Q('rgba(0,0,0,.22)', x0 + w - 12, y0, 12, h); Q(SHL, x0, y0, w, 2);
    for (let yy = y0 + 22; yy < y0 + h - 24; yy += 44) { Q(OLC, cx - 3, yy, 6, 16); Q('#ffd870', cx - 2, yy + 1, 4, 14); lamps.push([cx, yy + 8]) }
    Q(OLC, x0 - 5, y0 - 5, w + 10, 9); Q(SHL, x0 - 4, y0 - 4, w + 8, 5); Q(GOLD, x0 - 4, y0, w + 8, 2); Q('#6e6a60', x0 - 1, y0 + h - 8, w + 2, 8);
    coneC(q, cx, pad, y0 - 2, w + 22, roofCol);
    return { img: c, ox: cx, oy: Ht - 3, tip: [cx + 1, pad - 15], lamps };
  }

  function archSprite() {
    const Wd = 150, H = 76, [c, q] = mkCv(Wd, H), cx = 75, Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h);
    blockC(q, 8, 30, 134, 30); Q(GOLD, 8, 57, 134, 2); crenelC(q, 8, 30, 134); Q('rgba(0,0,0,.35)', 8, 60, 134, 6);
    Q(OLC, cx - 14, 34, 28, 40); Q(CR, cx - 13, 35, 26, 34); Q('rgba(255,255,255,.16)', cx - 13, 35, 6, 34); Q(GOLD, cx - 13, 35, 26, 2); crownC(q, cx, 46, GOLD); Q(CR, cx - 13, 69, 9, 5); Q(CR, cx + 4, 69, 9, 5);
    return { img: c, ox: cx, oy: 72 };
  }

  function knightSprite() {
    const [c, q] = mkCv(26, 54), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h);
    Q(OLC, 2, 42, 22, 12); Q('#a29e92', 3, 43, 20, 10); Q(SHC, 3, 43, 20, 2); Q(SHD, 17, 43, 6, 10);
    Q(OLC, 7, 14, 12, 30); Q('#aab0c0', 8, 15, 10, 28); Q('#cfd6e4', 8, 15, 3, 28); Q('#7a8090', 15, 15, 3, 28); Q(GOLD, 8, 26, 10, 2);
    Q(OLC, 8, 6, 10, 10); Q('#aab0c0', 9, 7, 8, 8); Q('#3a3d48', 10, 10, 6, 2); Q(CR, 12, 1, 2, 6);
    Q(OLC, 20, 4, 3, 40); Q('#6a5a3a', 21, 6, 1, 38); Q('#cfd6e4', 20, 0, 3, 7);
    return { img: c, ox: 13, oy: 52 };
  }

  function monumentSprite() {
    const [c, q] = mkCv(128, 142), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h), cx = 64;
    ell(q, 'rgba(0,0,0,.28)', cx, 126, 58, 18); ell(q, OLC, cx, 108, 54, 20); ell(q, '#8a867a', cx, 107, 52, 18.5); ell(q, '#b4aea0', cx, 105, 50, 17);
    ell(q, '#7e7a70', cx, 105, 45, 14.5); ell(q, '#2a78a0', cx, 104, 43, 13.5); ell(q, '#3a9ac8', cx, 103, 39, 11.5); ell(q, '#6ac8f0', cx - 6, 102, 20, 4.5);
    Q(OLC, 42, 74, 44, 34); Q('#a29e92', 43, 75, 42, 32); Q(SHC, 43, 75, 12, 32); Q(SHD, 74, 75, 11, 32); Q(OLC, 38, 66, 52, 11); Q('#b9b5a8', 39, 67, 50, 8); Q(SHC, 39, 67, 50, 2);
    Q(GOLD, 44, 84, 40, 2); crownC(q, cx, 90, GOLD);
    Q(OLC, 54, 40, 20, 28); Q('#a8883a', 55, 41, 18, 26); Q(GOLD, 55, 41, 8, 26); Q('#fff0a0', 55, 41, 3, 26);              // kaki & jubah emas
    Q(OLC, 52, 22, 24, 24); Q('#a8883a', 53, 23, 22, 22); Q(GOLD, 53, 23, 12, 22); Q('#fff0a0', 53, 23, 3, 22); Q(CR, 53, 33, 22, 3);
    Q(OLC, 56, 8, 16, 16); Q('#e8c860', 57, 9, 14, 14); Q('#fff0a0', 57, 9, 5, 14);
    Q(OLC, 55, 3, 18, 7); Q(GOLD, 56, 4, 16, 5); Q(GOLD, 56, 0, 3, 5); Q(GOLD, 62, -1, 4, 6); Q(GOLD, 69, 0, 3, 5);
    Q(OLC, 76, 4, 5, 38); Q('#e8e4d4', 77, 5, 3, 36); Q(OLC, 72, 40, 13, 5); Q(GOLD, 73, 41, 11, 3);
    return { img: c, ox: cx, oy: 120 };
  }

  /* ---------- gambar objek ---------- */
  function flag(fx, fy, col, len) {
    const w = 1 + V.rain * 1.2 + V.storm * 2;
    for (let i = 0; i < len; i++) {
      const u = i / len, yy = fy + Math.sin(t * 5 - u * 6 + fx * .1) * (.8 + u * 2.4) * w, hh = 11 - Math.round(u * 4);
      Rr(OLC, fx + i, yy - 1, 1, 1); Rr(col, fx + i, yy, 1, hh); Rr('rgba(255,255,255,.18)', fx + i, yy, 1, 2); if (col !== GOLD) Rr(GOLD, fx + i, yy + 4, 1, 2); Rr(OLC, fx + i, yy + hh, 1, 1)
    }
  }
  function drawObj(o) {
    if (o.n) { person(o.n, o.i); if (o.n.crown) crown(o.n); return }
    if (!o.img) return;
    g.drawImage(o.img, o.x - o.ox, o.y - o.oy);
    if (o.flags) for (const f of o.flags) flag(f[0], f[1], f[2], f[3]);
    if (o.fount) {
      const fy = o.y - 17; g.strokeStyle = 'rgba(220,250,255,.75)';
      for (let i = 0; i < 3; i++) { const k = (t * .5 + i / 3) % 1; g.globalAlpha = (1 - k) * .8; g.beginPath(); g.ellipse(o.x, fy, 6 + k * 30, 2.4 + k * 10, 0, 0, 7); g.stroke() } g.globalAlpha = 1;
      for (let i = 0; i < 5; i++) if (Math.sin(t * 2 + i * 1.9) > .82) Rr('#fff0a0', o.x - 28 + i * 14, fy - 4 + Math.sin(i) * 4, 2, 2);
    }
  }
  const person = (...a) => WORLD.person(...a);

  function renderList(A) {
    const x0 = camX - 90, x1 = camX + W / CAM_Z + 90, y0 = camY - 10, y1 = camY + H / CAM_Z + 100, L = [];
    for (const o of A.objs) { if (o.x < x0 - 200 || o.x > x1 + 200 || o.y < y0 || o.y - (o.oh || 40) > y1) continue; L.push(o) }
    for (const o of A.dyn) { const s = o.n; if (s.x < x0 || s.x > x1 || s.y < y0 || s.y > y1) continue; L.push({ y: s.y, n: s, i: o.i }) }
    L.sort((a, b) => a.y - b.y); return L;
  }

  /* ---------- NPC: dialog percakapan & obrolan ---------- */
  const RAINL = ['Hujan lagi...', 'Cepat berteduh!', 'Jubahku basah.'], STORML = ['Petir itu keras sekali!', 'Masuk, masuk!', 'Semoga istana aman.'];
  const SAYS = n => { if (V.storm > .5 && Math.random() < .6) return RAINL[0] && STORML[(Math.random() * 3) | 0]; if (V.rain > .4 && Math.random() < .6) return RAINL[(Math.random() * 3) | 0]; const a = n.chat || ['...']; return a[(Math.random() * a.length) | 0] };

  /* ---------- gerak warga, obrolan, label, gelembung (dipakai kota & istana) ---------- */
  function walkAll(list, dt) {
    for (const n of list) {
      if (!n.path) continue;
      if (n._base === undefined) { n._base = (n.kid ? 52 : 32) + Math.random() * 12; n.vx = n.vy = 0; n.spd = 0; n.wait = Math.random() * 1.5; n._ph = Math.random() * 6.28; n.pi = n.pi || 0; n.mv = 0 }
      const ddt = Math.min(dt, .05), talk = dlg && dlg.n === n, tg = n.path[n.pi % n.path.length], dx = tg[0] - n.x, dy = tg[1] - n.y, d = Math.hypot(dx, dy);
      let want = 0;
      if (talk) want = 0;
      else if (n.wait > 0) n.wait -= ddt;
      else if (d < 5) { n.pi = (n.pi + 1) % n.path.length; if (Math.random() < (n.kid ? .25 : .35)) n.wait = n.kid ? .2 + Math.random() * .8 : 1 + Math.random() * 2.6 }
      else want = n._base * Math.min(1, .45 + d / 70);
      const k = Math.min(1, ddt * (talk ? 10 : want > 0 ? 4.5 : 7)), ux = d > .001 ? dx / d * want : 0, uy = d > .001 ? dy / d * want : 0;
      n.vx += (ux - n.vx) * k; n.vy += (uy - n.vy) * k; n.x += n.vx * ddt; n.y += n.vy * ddt;
      n.spd = Math.hypot(n.vx, n.vy); n.mv = n.spd > 3 ? 1 : 0; n._ph += n.spd * ddt * .34; if (Math.abs(n.vx) > 7) n.fc = n.vx > 0 ? 1 : -1;
    }
  }
  function chatTick(list, dt) {
    for (const n of list) {
      if (n._b && (n._b.t -= dt) <= 0) n._b = null; if (n._b || dlg || t < (n._bn || 0) || NP.indexOf(n) < 0 || n.sign) continue;
      n._bn = t + 5 + Math.random() * 8; if (Math.hypot(n.x - p.x, n.y - p.y) < 190 && Math.random() < .6) n._b = { s: SAYS(n), t: 3.4 }
    }
  }
  function drawLabels() {
    g.font = '8px monospace'; for (const n of NP) { const d = dist(n, p); if (d < 90) { txt(n.n.split(',')[0], n.x, n.y - (n.kid ? 24 : 28), '#ffe9a8', 'center'); if (d < (n.rng || 36) && !dlg) txt('[G] ' + (n.verb || (n.shop ? 'Dagang' : 'Bicara')), n.x, n.y - (n.kid ? 34 : 38), '#fff', 'center') } if (n.fresh && !dlg) { g.fillStyle = '#ffd34d'; const by = Math.sin(t * 4); g.fillRect(Math.round(n.x) - 1, Math.round(n.y - 38 + by), 3, 6); g.fillRect(Math.round(n.x) - 1, Math.round(n.y - 30 + by), 3, 2) } }
  }
  function drawBubbles(list) {
    return () => {
      g.save(); g.font = '7px monospace'; g.textAlign = 'center';
      for (const q of list) {
        const b = q._b; if (!b || NP.indexOf(q) < 0) continue; const al = cl(Math.min(b.t / .35, (3.4 - b.t) / .2), 0, 1), w = Math.round(g.measureText(b.s).width + 10), xx = Math.round(q.x - w / 2), yy = Math.round(q.y - (q.kid ? 62 : 70) - (1 - al) * 4);
        g.globalAlpha = al; Rr('#2a1a10', xx - 1, yy - 1, w + 2, 14); Rr('#fff8e6', xx, yy, w, 12); g.fillStyle = '#2a1a10'; g.beginPath(); g.moveTo(q.x - 3, yy + 13); g.lineTo(q.x + 3, yy + 13); g.lineTo(q.x, yy + 18); g.fill();
        g.fillStyle = '#fff8e6'; g.beginPath(); g.moveTo(q.x - 2, yy + 12); g.lineTo(q.x + 2, yy + 12); g.lineTo(q.x, yy + 16); g.fill(); g.fillStyle = '#3a2210'; g.fillText(b.s, q.x, yy + 9)
      }
      g.restore();
    };
  }

  /* ---------- BUILD ---------- */
  K.build = function () {
    const rng = mkRng(9153), [bg, x] = mkCv(KW, KH); K.bg = bg;
    const walls = K.walls = [], objs = K.objs = [], N = K.npcs = [], occ = [];
    const spr = (s, a, b, solid, extra) => { objs.push({ x: Math.round(a), y: Math.round(b), img: s.img, ox: s.ox, oy: s.oy, oh: s.img.height, ...extra }); if (solid) walls.push(solid) };
    const R = (c, a, b, w, h) => rc(x, c, Math.round(a), Math.round(b), Math.round(w), Math.round(h));
    const noGo = (a, b, w, h) => occ.push([a, b, w, h]);

    /* rumput */
    const GD = h2r('#4a7a34'), GL2 = h2r('#7aa848'), GWm = h2r('#9aa040'), id = x.createImageData(KW, KH), d = id.data;
    for (let yy = 0; yy < KH; yy++) for (let xx = 0; xx < KW; xx++) {
      const v = vnoise(xx / 70, yy / 70, 14) * .6 + vnoise(xx / 14, yy / 14, 15) * .4, wm = vnoise(xx / 160, yy / 160, 16);
      let cc = mixc(GD, GL2, v); cc = mixc(cc, GWm, wm * .25); const sh = (hash(xx, yy, 20) - .5) * 12, o = (yy * KW + xx) * 4;
      d[o] = cc[0] + sh; d[o + 1] = cc[1] + sh; d[o + 2] = cc[2] + sh; d[o + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    for (let i = 0; i < 3200; i++) art.grassTuft(x, rng() * KW, rng() * KH, rng);
    const fc = ['#ffffff', '#ffd34d', '#ff9ac0', '#b48cff', '#7ab8ff'];
    for (let i = 0; i < 420; i++) art.flower(x, rng() * KW, rng() * KH, fc[(rng() * 5) | 0]);

    /* jalan batu */
    const cobble = (x0, y0, w, h) => {
      R('rgba(0,0,0,.18)', x0 - 4, y0 - 3, w + 8, h + 8); R('#4a463e', x0 - 3, y0 - 3, w + 6, h + 6); R('#7a7468', x0, y0, w, h);
      for (let yy = 0; yy < h; yy += 6) for (let xx = 0; xx < w; xx += 9) {
        const tx = xx + (((yy / 6) | 0) & 1) * 4, tw = Math.min(8, w - tx); if (tw <= 0) continue;
        const hv = hash((x0 + tx) | 0, (y0 + yy) | 0, 31); R(PZC[(hv * 4) | 0], x0 + tx, y0 + yy, tw, Math.min(5, h - yy)); if (hv > .8) R('rgba(255,255,255,.14)', x0 + tx, y0 + yy, tw, 1)
      }
      R('#b4aea0', x0 - 1, y0 - 1, w + 2, 1);
    };
    cobble(G0, PY + 14, G1 - G0, KH - PY - 14);                 // jalan raya kerajaan
    cobble(28, 800, KW - 56, 66);                                // jalan melintang
    cobble(28, 1036, KW - 56, 44);                               // jalan selatan
    cobble(258, 460, 44, 620); cobble(KW - 302, 460, 44, 620);   // lorong barat & timur
    [[G0 - 4, PY, G1 - G0 + 8, KH - PY], [28, 796, KW - 56, 74], [28, 1032, KW - 56, 52], [254, 456, 52, 628], [KW - 306, 456, 52, 628]].forEach(r => noGo(...r));
    R(CR, AX - 28, PY + 14, 56, 340); R(GOLD, AX - 28, PY + 14, 2, 340); R(GOLD, AX + 26, PY + 14, 2, 340);      // karpet merah ke tangga istana
    for (let yy = PY + 22; yy < PY + 340; yy += 20) { R('rgba(255,255,255,.08)', AX - 26, yy, 52, 1); R(GOLD, AX - 3, yy, 6, 2) }

    /* plaza + monumen */
    const P = { x: AX, y: 722, rx: 200, ry: 74 };
    ell(x, 'rgba(0,0,0,.2)', P.x, P.y + 4, P.rx + 9, P.ry + 8); ell(x, '#4a463e', P.x, P.y, P.rx + 3, P.ry + 3); ell(x, '#7a7468', P.x, P.y, P.rx, P.ry);
    for (let yy = -P.ry; yy < P.ry; yy += 6) for (let xx = -P.rx; xx < P.rx; xx += 9) {
      const tx = xx + (Math.round(yy / 6) & 1) * 4; if ((tx / (P.rx - 3)) ** 2 + ((yy + 2) / (P.ry - 2)) ** 2 > 1) continue;
      const hv = hash((tx + 999) | 0, (yy + 999) | 0, 33); R(PZC[(hv * 4) | 0], P.x + tx, P.y + yy, 8, 5); if (hv > .8) R('rgba(255,255,255,.14)', P.x + tx, P.y + yy, 8, 1)
    }
    const ring = (rx, ry, col, w) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.ellipse(P.x, P.y, rx, ry, 0, 0, TAU); x.stroke() };
    ring(P.rx - 18, P.ry - 11, '#3a0e18', 6); ring(P.rx - 18, P.ry - 11, CR, 4); ring(P.rx - 18, P.ry - 11, GOLD, 1); ring(110, 40, '#3a0e18', 4); ring(110, 40, '#8a3a4a', 2);
    x.strokeStyle = 'rgba(216,184,74,.7)'; x.lineWidth = 1; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + TAU / 16; x.moveTo(P.x + Math.cos(a) * 110, P.y + Math.sin(a) * 40); x.lineTo(P.x + Math.cos(a) * (P.rx - 18), P.y + Math.sin(a) * (P.ry - 11)) } x.stroke();
    for (let i = 0; i < 56; i++) { const a = i * TAU / 56, sx = P.x + Math.cos(a) * (P.rx - 1), sy = P.y + Math.sin(a) * (P.ry - 1); R(i % 2 ? '#b4aea0' : '#8a867a', sx - 3, sy - 2, 6, 4); R('rgba(0,0,0,.25)', sx - 3, sy + 1, 6, 1) }
    noGo(P.x - P.rx - 20, P.y - P.ry - 20, P.rx * 2 + 40, P.ry * 2 + 40);
    spr(monumentSprite(), AX, 718, [AX - 52, 690, 104, 30], { fount: 1 });
    N.push({ n: 'Monumen Raja Aurelius', x: AX, y: 752, sign: 1, rng: 56, verb: 'Baca', _bn: Infinity, lines: ['Raja Aurelius I, Pemersatu Lembah-Lembah. Ia membangun jalan, jembatan, dan menara lentera agar tak seorang pun tersesat dalam gelap.', 'Di dasar patung terukir: "Terang yang dijaga bersama tak akan padam."'] });

    /* tembok kota (gaya sama dengan benteng desa, warna kerajaan) */
    const BAN = [CR, BLU, CR, GOLD];
    const wallH = (y0, shadow) => {
      if (shadow) R('rgba(0,0,0,.26)', 0, y0 + 42, KW, 6);
      R(OLC, 0, y0, KW, 42); R(BAK, 0, y0 + 1, KW, 11);
      for (let k = 5; k < KW; k += 20) { R(OLC, k - 1, y0, 12, 13); R(SHL, k, y0 + 1, 10, 11); R(SHC, k, y0 + 1, 10, 2); R(SHD, k + 7, y0 + 3, 3, 9) }
      R(SH0, 0, y0 + 13, KW, 20); mortarC(x, 0, y0 + 14, KW, 19, 12);
      R(SHC, 0, y0 + 13, KW, 1); R(SHL, 0, y0 + 14, KW, 1); R('rgba(0,0,0,.18)', 0, y0 + 15, KW, 2); R(SHD, 0, y0 + 33, KW, 6); R('#6a665c', 0, y0 + 33, KW, 1);
      for (let k = 120; k < KW; k += 120) { R(OLC, k - 6, y0 + 3, 12, 38); R(SHM, k - 5, y0 + 4, 10, 36); R(SHL, k - 5, y0 + 4, 3, 36); R(SHD, k + 2, y0 + 4, 3, 36); R(SHC, k - 5, y0 + 4, 10, 2); R('#6e6a60', k - 6, y0 + 34, 12, 6) }
      for (let k = 60, n = 0; k < KW; k += 120, n++) { const cc = BAN[n % 4]; R(OLC, k - 6, y0 + 15, 12, 19); R(cc, k - 5, y0 + 16, 10, 14); R('rgba(255,255,255,.18)', k - 5, y0 + 16, 3, 14); R(GOLD, k - 5, y0 + 16, 10, 1); R(GOLD, k - 2, y0 + 21, 4, 5); R(cc, k - 5, y0 + 30, 4, 3); R(cc, k + 1, y0 + 30, 4, 3) }
      R(OLC, 0, y0 + 39, KW, 3);
    };
    const wallV = (x0, ya, yb, dir) => {
      const h = yb - ya; R('rgba(0,0,0,.24)', dir > 0 ? x0 + 28 : x0 - 7, ya, 7, h);
      R(OLC, x0, ya, 28, h); R(SH0, x0 + 1, ya, 26, h); R(SHD, x0 + 8, ya, 12, h); R(SHM, x0 + 9, ya, 10, h); mortarC(x, x0 + 9, ya, 10, h, 10);
      for (let k = 3 + 20 * Math.ceil((ya - 1) / 20); k + 14 <= yb; k += 20) [x0, x0 + 19].forEach(mx => { R(OLC, mx, k, 9, 14); R(SHL, mx + 1, k + 1, 7, 12); R(SHC, mx + 1, k + 1, 7, 2); R(SHD, mx + 1, k + 9, 7, 3) })
    };
    wallH(0, 1); wallH(KH - 42, 0); wallV(0, 40, KH - 80, 1); wallV(KW - 28, 40, KH - 80, -1);
    cobble(G0, KH - 60, G1 - G0, 60);                                         // gerbang selatan terbuka
    walls.push([-20, -20, KW + 40, 46], [-20, -20, 48, KH + 40], [KW - 28, -20, 48, KH + 40], [-20, KH - 42, G0 + 20, 60], [G1, KH - 42, KW - G1 + 20, 60]);
    noGo(0, 0, KW, 66); noGo(0, KH - 66, KW, 66); noGo(0, 0, 66, KH); noGo(KW - 66, 0, 66, KH);

    /* menara gerbang & sudut kota + lengkung gerbang */
    const flagsOf = (s, a, b, col) => [[a + (s.tip[0] - s.ox), b + (s.tip[1] - s.oy), col, 22]];
    const lampsOf = (s, a, b) => s.lamps.map(l => [a + l[0] - s.ox, b + l[1] - s.oy]);
    const gt = towerSprite(56, 128, BLU);
    [G0 - 28, G1 + 28].forEach(a => { const b = KH - 24; spr(gt, a, b, [a - 28, KH - 76, 56, 36], { lamp: lampsOf(gt, a, b), flags: flagsOf(gt, a, b, CR) }) });
    const ct = towerSprite(64, 110, CR);
    [48, KW - 48].forEach(a => { const b = KH - 20; spr(ct, a, b, null, { lamp: lampsOf(ct, a, b), flags: flagsOf(ct, a, b, GOLD) }) });
    spr(archSprite(), AX, KH - 38, null, {});

    /* istana */
    const pal = palaceSprite();
    spr(pal, AX, PY, null, { lamp: pal.lamps.map(l => [AX + l[0] - pal.ox, PY + l[1] - pal.oy]), flags: pal.flags.map(f => [AX + f[0] - pal.ox, PY + f[1] - pal.oy, f[2], f[3]]) });
    walls.push([AX - 324, PY - 64, 294, 64], [AX + 30, PY - 64, 294, 64], [AX - 30, PY - 86, 60, 12]);     // pintu istana tetap terbuka di tengah
    noGo(AX - 340, 40, 680, PY - 30);

    /* taman halaman istana: pagar tanaman rapi + petak bunga + pohon */
    const hedge = (hx, hy, hw, hh) => {
      R('rgba(0,0,0,.22)', hx + 1, hy + hh, hw, 3); R('#18301a', hx, hy, hw, hh); R('#2f6a2c', hx + 1, hy + 1, hw - 2, hh - 2); R('#4a8a3c', hx + 1, hy + 1, hw - 2, 3);
      for (let a = 0; a < hw; a += 3) for (let b = 0; b < hh; b += 3) if (((hx + a) * 7 + (hy + b) * 13) % 9 < 2) R('#5aa04a', hx + a, hy + b, 2, 1);
      walls.push([hx, hy, hw, hh]);
    };
    const OAK = [], PINE = []; for (let i = 0; i < 5; i++) OAK.push(art.oak(i + 40, .85 + (i % 3) * .12)); for (let i = 0; i < 3; i++) PINE.push(art.pine(i + 40, .9));
    [[596, 484], [984, 484]].forEach(([gx, gy], gi) => {
      hedge(gx, gy, 220, 12); hedge(gx, gy + 158, 220, 12); hedge(gx, gy, 12, 170); hedge(gx + 208, gy, 12, 170); noGo(gx - 6, gy - 6, 232, 192);
      [[gx + 60, gy + 60], [gx + 160, gy + 60], [gx + 60, gy + 126], [gx + 160, gy + 126]].forEach(([a, b], i) => spr(art.flowerbed(80 + gi * 4 + i, 54, 26), a, b, null, {}));
      const s = OAK[(gi * 2) % 5]; ell(x, 'rgba(0,12,4,.22)', gx + 114, gy + 90, 18, 8); spr(s, gx + 110, gy + 96, [gx + 106, gy + 92, 8, 5]);
    });
    const ks = knightSprite();[[826, 462], [974, 462]].forEach(([a, b]) => spr(ks, a, b, [a - 9, b - 6, 18, 8]));

    /* rumah kota */
    const mkH = WORLD.mkHouse;
    if (mkH) {
      const WALLC = ['#d8c8a8', '#e0d4b8', '#c8c0a8', '#d8b898', '#e0d0b0', '#c8a888', '#d8c8a0', '#e4d8c0'], TRIMC = ['#6a4a2c', '#5a4a30', '#7a5a38', '#5a3a28'];
      const ROOFC = ['#a8483a', '#3a7a5a', '#7a4a8a', '#b87a38', '#3a6a8a', '#8a3a3a', '#5a7a3a', '#4a5060'], SHUTC = ['#3a5a7a', '#3a6a4a', '#7a3a3a', '#5a3a7a'], WINS = [[-1, 1], [-1, 1], [1], [-1]];
      const HS = [[170, 520, 96], [390, 530, 92], [150, 770, 92, 'store'], [390, 775, 96, 'inn'], [540, 770, 88], [150, 1020, 100], [390, 1025, 92, 'smith'], [540, 1020, 96]];
      const all = HS.concat(HS.map(([a, b, w, s], i) => [KW - a, b + (i % 2 ? -6 : 6), w + (i % 3 === 0 ? -4 : 4), (i === 2 ? 'potion' : null)]));
      all.forEach(([a, b, w, sg], i) => {
        const o = { wall: WALLC[(i * 3) % 8], trim: TRIMC[i % 4], roof: ROOFC[(i * 5 + 1) % 8], shut: SHUTC[i % 4], chimney: i % 3 ? 1 : 0, wins: WINS[i % 4] }; if (sg) { o.sign = sg; o.sx = 100; o.dx = 60 }
        const s = mkH(w, o); spr(s, a, b, [a - w / 2 + 2, b - 30, w - 4, 30], { lamp: s.lamp.map(l => [a + l[0], b + l[1]]), chim: s.chim ? [a + s.chim[0], b + s.chim[1]] : null }); noGo(a - w / 2 - 12, b - 150, w + 24, 170)
      });
    }

    /* lentera sepanjang jalan, tong & peti */
    [[826, 520], [974, 520], [826, 640], [974, 640], [826, 780], [974, 780], [826, 920], [974, 920], [826, 1010], [974, 1010], [700, 800], [1100, 800], [470, 850], [1330, 850], [250, 850], [1550, 850], [250, 1090], [1550, 1090]].forEach(([a, b]) => spr(art.lantern(), a, b, [a - 3, b - 5, 6, 5], { glow: 1 }));
    [[236, 802], [1560, 802], [470, 1034], [1330, 1034]].forEach(([a, b], i) => spr(i % 2 ? art.crate() : art.barrel(), a, b, [a - 6, b - 4, 12, 5]));

    /* pohon: tersebar rapi, menghindari jalan/rumah/istana/plaza */
    const free = (a, b, m) => { if (a < 56 || a > KW - 56 || b < 70 || b > KH - 70) return false; if (((a - P.x) / (P.rx + 30 + m)) ** 2 + ((b - P.y) / (P.ry + 30 + m)) ** 2 < 1) return false; return !occ.some(r => a > r[0] - m && a < r[0] + r[2] + m && b > r[1] - m && b < r[1] + r[3] + m) };
    K.free = free; const used = [];
    for (let gy = 80; gy < KH - 80; gy += 30) for (let gx = 70; gx < KW - 70; gx += 30) {
      const a = gx + rng() * 26, b = gy + rng() * 26; if (rng() > .1 || !free(a, b, 10) || used.some(q => Math.hypot(q[0] - a, q[1] - b) < 34)) continue;
      used.push([a, b]); const k = rng(), s = k < .65 ? OAK[(k * 100 | 0) % 5] : PINE[(k * 100 | 0) % 3]; ell(x, 'rgba(0,12,4,.22)', a + 4, b - 2, 16, 7); spr(s, a, b + 4, [a - 4, b - 1, 8, 5])
    }
    for (let yy = 120; yy < KH - 120; yy += 64) [74, KW - 74].forEach((a, i) => { if (!free(a, yy, 4) || used.some(q => Math.hypot(q[0] - a, q[1] - yy) < 34)) return; used.push([a, yy]); ell(x, 'rgba(0,12,4,.22)', a + 4, yy - 2, 16, 7); spr(i ? PINE[yy % 3] : OAK[yy % 5], a, yy + 4, [a - 4, yy - 1, 8, 5]) });
    objs.sort((a, b) => a.y - b.y);

    /* ---------- NPC ---------- */
    const mkN = o => { N.push(o); return o };
    const guardN = (n, ax, ay, fc, lines, chat, extra) => mkN({ n, x: ax, y: ay, fc, sk: '#d9a07a', hair: '#3a2a1a', hat: 'helm', armor: 1, c1: CR, c2: GOLD, c3: '#3a3d48', prop: 'spear', lines, chat, ...extra });
    guardN('Prajurit Gerbang, Hasan', G0 - 14, KH - 112, 1, ['Selamat datang di Aurelia, pahlawan! Aku Hasan, penjaga gerbang selatan.', 'Dari gerbang ini jalan raya lurus ke utara sampai istana. Tiap senja lenteranya dinyalakan satu per satu.', 'Mau kembali ke Lembah Lentera? Lewat gerbang ini, lalu jalan selatan menuju desa.'], ['Gerbang aman.', 'Ada musafir lewat...']);
    guardN('Prajurit Gerbang, Bram', G1 + 14, KH - 112, -1, ['Setiap pendatang kami catat, tapi pahlawan dari Aula Kuno disambut tanpa banyak tanya.', 'Dengar-dengar ada bisikan aneh dari bawah tanah. Raja ingin menanyakannya padamu.'], ['Tetap waspada.', 'Gerbang ditutup saat badai.'], { sk: '#c9946e' });
    guardN('Pengawal Istana, Arga', AX - 40, PY + 40, 1, ['Silakan masuk, pahlawan. Raja Aurelius menunggu di aula singgasana.', 'Naiki tangga, lewati karpet merah, lalu masuk lewat pintu agung.'], ['Berdiri tegap.', 'Demi mahkota.'], { c1: '#7a1a2a' });
    guardN('Pengawal Istana, Surya', AX + 40, PY + 40, -1, ['Aku bersumpah menjaga pintu ini sampai napas terakhir.', 'Hormatlah di hadapan raja, dan jangan memotong ucapan baginda.'], ['Diam dan siaga.', 'Pintu terkunci.'], { c1: '#7a1a2a', sk: '#c0845c' });
    guardN('Kapten Pengawal, Leon', AX, PY + 96, 1, ['Aku Leon, kapten pengawal raja. Kau pasti pahlawan yang diceritakan Kael dan Darto di perbatasan.', 'Kerajaan ini berdiri di atas empat lentera abadi. Selama apinya menyala, bisikan Abyss tak sanggup menembus tembok.', 'Raja menunggumu di aula singgasana. Masuk saja lewat pintu agung di belakangku, pahlawan.'], ['Disiplin adalah perisai.', 'Kota ini aman selama kami berjaga.'], { c1: '#7a1a2a', c2: '#e8e4d8', hair: '#2a2a3a' });
    guardN('Prajurit Patroli, Ganesh', 120, 834, 1, ['Patroliku dari tembok barat sampai timur, bolak-balik sampai matahari terbit.', 'Kalau kau lihat sesuatu mencurigakan di gelap, teriak saja.'], ['Patroli malam...', 'Semua aman.'], { path: [[120, 834], [560, 834], [900, 840], [1340, 834], [1680, 834], [1340, 834], [900, 840], [560, 834]], pi: 1 });
    guardN('Prajurit Patroli, Dimas', 1680, 1058, -1, ['Jalan selatan sepi, tapi aku tak pernah lengah.', 'Dulu aku petani. Sekarang aku menjaga petani lain tidur nyenyak.'], ['Sepi...', 'Angin dingin.'], { path: [[1680, 1058], [1200, 1058], [900, 1066], [560, 1058], [120, 1058], [560, 1058], [900, 1066], [1200, 1058]], pi: 1 });

    const cit = (o, extra) => mkN({ fc: 1, ...o, ...extra });
    const shopN = (o, shop, intro, short) => mkN({ ...o, fresh: 1, shop, rng: 44, get lines() { return this.seen ? short : intro }, act() { this.seen = 1; this.fresh = 0; WORLD.openShop(shop) } });
    shopN({ n: 'Hamid, Saudagar Istana', x: 690, y: 846, fc: 1, sk: '#c9946e', hair: '#3a2a1a', stache: '#3a2a1a', hat: 'feather', hc: CR, c1: '#5a3a7a', c2: GOLD, c3: '#2a2a40', vest: '#c8a040', prop: 'scroll', chat: ['Barang istana, harga rakyat!', 'Kain, ramuan, apa saja!'] }, 'general', ['Selamat datang, pahlawan! Hamid, pemasok istana. Apa pun yang kau bawa dari dungeon, aku beli dengan harga adil.'], ['Ada yang bisa kubantu lagi?']);
    cit({ n: 'Edric, Bangsawan', x: 740, y: 746, sk: '#e0b898', hair: '#8a5a2a', hs: 'short', hat: 'feather', hc: BLU, c1: '#3a3a8a', c2: GOLD, c3: '#2a2a40', vest: '#c8a040', prop: 'scroll', lines: ['Aku Edric, kemenakan menteri istana. Plaza ini tempat terbaik melihat siapa datang dan pergi.', 'Konon pahlawan dari bawah tanah dapat menenangkan bisikan Abyss. Kuharap itu benar.'], chat: ['Hm, menarik.', 'Cuaca yang indah, bukan?'], path: [[740, 746], [800, 790], [900, 800], [1000, 790], [1060, 746], [1000, 676], [900, 662], [800, 676]], pi: 1 });
    cit({ n: 'Lila, Pelayan Istana', x: 868, y: 540, sk: '#e8c0a0', hair: '#8a5a2a', hs: 'bun', hat: 'bonnet', c1: CR, c2: '#e8d8a0', c3: '#4a2a1a', apron: '#f0e8dc', prop: 'basket', lines: ['Aku membawa bunga segar untuk ruang singgasana. Raja suka mawar kuning.', 'Jangan injak karpet merahnya, ya, pahlawan. Baru dicuci kemarin!'], chat: ['Bunga untuk raja~', 'Banyak tugas hari ini!'], path: [[868, 540], [868, 640], [932, 640], [932, 540]], pi: 1 });
    cit({ n: 'Orlan, Penyair Istana', x: 1010, y: 770, sit: 1, fc: -1, sk: '#e0b090', hair: '#a8622c', hs: 'short', hat: 'feather', hc: '#3a6a8a', c1: '#3a6a8a', c2: '#e8d890', c3: '#2a2a40', prop: 'lute', lines: ['Dengarlah, dengarlah! Kisah Raja Aurelius dan empat lentera abadi!', 'Hendra di Lembah Lentera itu muridku dulu. Ia memetik dawai dengan hati, tapi kurang latihan.'], chat: ['\u266a la la la ~', 'Bait baru untuk raja...'] });
    cit({ n: 'Tobias, Juru Warta', x: 1020, y: 640, sk: '#d0986c', hair: '#2a1a14', hs: 'short', hat: 'cap', hc: CR, c1: CR, c2: GOLD, c3: '#2a2a40', prop: 'scroll', lines: ['Dengar, dengar! Titah raja: penjaga gerbang diperkuat sampai musim hujan berakhir!', 'Kabar baru: seorang pahlawan keluar dari Aula Kuno. Jangan-jangan itu kau?'], chat: ['Dengar, dengar!', 'Titah raja hari ini!'] });
    cit({ n: 'Sari, Penjual Bunga', x: 1240, y: 846, fc: -1, sk: '#e8c0a8', hair: '#d8d8e0', hs: 'bun', hat: 'bonnet', c1: '#6a5aa0', c2: '#e8d8a0', c3: '#3a2a4a', apron: '#e8e0d0', prop: 'basket', lines: ['Bunga dari taman istana, nak. Kuperoleh dari tukang kebun raja yang baik hati.', 'Kalau kau sedang sedih, bunga kuning bisa membantu.'], chat: ['Bunga segar~', 'Mawar kuning, mawar merah!'] });
    cit({ n: 'Dewi, Anak Kota', x: 300, y: 880, kid: 1, hs: 'short', sk: '#e8c0a0', hair: '#c8483a', c1: '#e08aa0', c2: '#fff', c3: '#4a3a5a', lines: ['Kakak pahlawan! Aku pernah melihat raja dari jauh, mahkotanya berkilau!', 'Prajurit-prajurit itu keren, tapi mereka tak mau main.'], chat: ['Kejar aku!', 'Hehe!'], path: [[300, 880], [420, 900], [600, 880], [420, 860]], pi: 1 });
    cit({ n: 'Kiki, Anak Kota', x: 1500, y: 880, kid: 1, hs: 'short', sk: '#d9a07a', hair: '#2a1a14', c1: '#4a8aa8', c2: '#fff', c3: '#5a4a2a', lines: ['Aku mau jadi pengawal raja! Atau penyair, atau pahlawan!', 'Dewi curang! Dia lari duluan lagi.'], chat: ['Tunggu aku!', 'Haha!'], path: [[1500, 880], [1380, 900], [1200, 880], [1380, 860]], pi: 1 });
    mkN({ n: 'Rangga, Penyala Lentera', x: 838, y: 1000, fc: 1, sk: '#d0986c', hair: '#2a1a14', hs: 'short', hat: 'cap', hc: '#3a3a4a', c1: '#2a3a5a', c2: '#c9a95a', c3: '#1a1a28', prop: 'staff', pc: '#ffd34d', nightOnly: 1, lines: ['Aku Rangga. Tiap malam kunyalakan lentera jalan raya, dari gerbang sampai tangga istana.', 'Lentera di kerajaan bersaudara dengan lentera desa. Cahaya yang satu menjaga yang lain.'], chat: ['Satu lentera lagi...', 'Terang, terang~'], path: [[838, 1000], [838, 520], [962, 520], [962, 1000]], pi: 1 });

    N.forEach(n => { if (!n.nightOnly && !n.sign && !/Prajurit|Pengawal|Kapten/.test(n.n)) { n.sleeps = 1; n._hx = n.x; n._hy = n.y; n._orig = n.path || null; n._lv = Math.random() * 2; n._wk = Math.random() } });
    K.dyn = N.filter(n => !n.sign).map((n, i) => ({ n, i, get y() { return n.y } })); K._all = K.dyn.slice();
    for (let i = 0; i < 30; i++) K.ff.push({ bx: rng(), by: rng(), sx: 3 + rng() * 6, ph: rng() * 6 });
  };

  /* ---------- jadwal warga (pulang saat malam, keluar saat pagi) ---------- */
  function shift(force) {
    if (!K._all) return; const h = V.clock, nt = !!V._nt;
    K.npcs.forEach(n => {
      if (dlg && dlg.n === n) return; const k = NP.indexOf(n), shown = k >= 0, d = Math.hypot(n.x - p.x, n.y - p.y);
      if (n.nightOnly) { if (nt === shown) return; if (!force && d < 240 && (nt ? V.night < .95 : V.night > .05)) return; if (nt) NP.push(n); else NP.splice(k, 1); return }
      if (!n.sleeps || n._hx === undefined) return;
      const hide = () => { NP.splice(NP.indexOf(n), 1); n.x = n._hx; n.y = n._hy; n.vx = n.vy = 0; n.spd = 0; n.mv = 0; n._b = null };
      if (WORLD.homeTime(n, h)) {
        if (!shown) return;
        if (!n._going) { n._going = 1; if (n.path) { n.path = [[n._hx, n._hy]]; n.pi = 0; n.wait = 0 } }
        const dh = Math.hypot(n.x - n._hx, n.y - n._hy);
        if (n.path ? (dh < 22 || (force && d > 260)) : (d > 200 || V.night > .95)) hide()
      } else {
        if (n._going) { n._going = 0; if (n._orig) { let bi = 0, bd = 1e9; n._orig.forEach((q, i) => { const dd = Math.hypot(q[0] - n._hx, q[1] - n._hy); if (dd < bd) { bd = dd; bi = i } }); n.path = n._orig; n.pi = bi; n.wait = Math.random() * 2 } }
        if (!shown) { n.x = n._hx; n.y = n._hy; NP.push(n) }
      }
    });
    K.dyn = K._all.filter(o => { const s = o.n; return !s || NP.indexOf(s) >= 0 });
  }
  const _en = K.enter; K.enter = function () { if (_en) _en.apply(this, arguments); K._sc = 0; guard(() => shift(1)) };

  /* ---------- TICK: jam & cuaca bersama + gerak warga + obrolan + pintu keluar ---------- */
  K.tick = function (dt) {
    const T = WORLD.TR; if (T.on) return;
    guard(() => WORLD.wxTick(dt));
    K._sc = (K._sc || 0) - dt; if (K._sc <= 0) { K._sc = .25; guard(() => shift()) }
    walkAll(K.npcs, dt); guard(() => chatTick(K.npcs, dt));
    if (T.cool <= 0 && p.y < PY - 44 && Math.abs(p.x - AX) < 28 && p.vy < -8) { WORLD.start('gate', { to: 'palace', dx: 0, dy: -1, spawn: WORLD.AREAS.palace.spawn.slice() }); msg('Memasuki Istana Aurelia...'); return }
    if (T.cool <= 0 && p.y > KH - 28 && Math.abs(p.x - AX) < 60 && p.vy > 8) {
      WORLD.start('gate', { to: 'village', dx: 0, dy: 1, spawn: [GX, 120] }); msg('Kembali ke Desa Lembah Lentera...');
    }
  };

  /* ---------- GAMBAR ---------- */
  K.env = function () { };
  K.drawBack = function () { K._L = renderList(K); const py = p.y + 3; for (const o of K._L) if (o.y <= py) drawObj(o) };
  K.drawFront = function () {
    const py = p.y + 3; for (const o of K._L) if (o.y > py) drawObj(o);
    const vw = W / CAM_Z, vh = H / CAM_Z;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const o of K.objs) { if (o.x < camX - 300 || o.x > camX + vw + 300 || o.y < camY - 60 || o.y > camY + vh + 340) continue; if (o.glow) lightL(o.x, o.y - 32, 52 + Math.sin(t * 7 + o.x) * 2, '255,200,110', .36); if (o.lamp) o.lamp.forEach(([a, b]) => lightL(a, b + 4, 26, '255,200,110', .2)) }
    g.restore();
    for (const o of K.objs) { if (!o.chim || o.x < camX - 100 || o.x > camX + vw + 100 || o.y < camY - 60 || o.y > camY + vh + 140) continue; const sm = o.chim; for (let i = 0; i < 4; i++) { const k = (t * .3 + i / 4 + (o.x % 7) * .1) % 1; g.globalAlpha = (1 - k) * .45; g.fillStyle = '#d8d4dc'; const s = 3 + k * 5; g.fillRect(Math.round(sm[0] + Math.sin(k * 5 + i) * 4 + k * 10), Math.round(sm[1] - k * 34), s, s) } g.globalAlpha = 1 }
    drawLabels();
    g.save(); g.globalCompositeOperation = 'lighter'; for (const f of K.ff) { const X = camX + (((f.bx * vw - t * f.sx * .5 - camX * .15) % vw) + vw) % vw, Y = camY + (((f.by * vh + Math.sin(t * .8 + f.ph) * 12) % vh) + vh) % vh, a = (.3 + .5 * Math.max(0, Math.sin(t * 2 + f.ph))) * V.night; g.fillStyle = 'rgba(255,225,140,' + a + ')'; g.fillRect(Math.round(X), Math.round(Y), 2, 2) } g.restore();
    g.fillStyle = 'rgba(120,50,110,.10)'; g.fillRect(camX, camY, vw, vh); g.fillStyle = 'rgba(255,150,60,.05)'; g.fillRect(camX, camY, vw, vh * .5);
    guard(() => {      // bayangan awan + atmosfer (malam, senja, kabut, hujan, badai, petir) = sama persis dengan desa
      const n = V.night, r = V.rain; g.save();
      const ca = .075 * (1 - n) * (1 - r * .4);
      if (ca > .005) for (let i = 0; i < 5; i++) { const X = ((t * 7 + i * 470) % 2300) - 250, Y = 120 + i * 190 + Math.sin(i * 2.3) * 50, rx = 150 + (i % 3) * 40, ry = 55 + (i % 2) * 20; g.fillStyle = 'rgba(8,24,40,' + ca + ')'; g.beginPath(); g.ellipse(X, Y, rx, ry, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(X + 12, Y - 4, rx * .62, ry * .6, 0, 0, 7); g.fill() }
      WORLD.atmo(K, 2); g.restore();
    });
    guard(drawBubbles(K.npcs));
  };

  /* =================================================================
     BAGIAN 3 - ISTANA AURELIA (INTERIOR): aula singgasana, raja, menteri, interior kerajaan
     Versi diperkaya: lantai marmer berurat + inlay emas, tirai & mimbar singgasana, lampu gantung
     bertingkat berkristal, kandil, obor dinding, tanaman, globe, meja bundar berbunga, kaca patri
     (sinar siang & cahaya bulan), debu berkilau, bara anglo, bayangan & pantulan lantai.
     ================================================================= */
  const PW = 1280, PH = 860, MX = 640;
  const IN = WORLD.AREAS.palace = { name: 'ISTANA AURELIA', sub: 'Aula Singgasana', w: PW, h: PH, spawn: [MX, PH - 120], ready: 0, objs: [], dyn: [], npcs: [], walls: [], bg: null, _L: [] };
  const WOOD = '#6a4220', WOODD = '#4a2e1a', WOODL = '#8a5a30';
  const WINX = [150, 310, 970, 1130], CHAN = [[MX, 340], [MX, 600], [190, 330], [1090, 330]];

  function throneSprite() {
    const [c, q] = mkCv(120, 150), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h);
    Q(OLC, 26, 14, 68, 100); Q(GOLD, 27, 15, 66, 98); Q(CR, 33, 22, 54, 88); Q('rgba(255,255,255,.15)', 33, 22, 10, 88); Q(CRD, 77, 22, 10, 88);
    Q(OLC, 40, 6, 40, 12); Q(GOLD, 41, 7, 38, 10); Q(OLC, 52, 0, 16, 10); Q(GOLD, 53, 1, 14, 8); Q('#fff0a0', 53, 1, 5, 3);
    for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) Q('#fff0a0', 38 + k * 14, 30 + j * 20, 3, 3);
    crownC(q, 60, 44, GOLD);
    Q(OLC, 24, 104, 72, 26); Q(GOLD, 25, 105, 70, 24); Q(CRD, 30, 108, 60, 16); Q(CR, 30, 108, 60, 5);
    Q(OLC, 18, 92, 14, 38); Q(GOLD, 19, 93, 12, 36); Q(OLC, 88, 92, 14, 38); Q(GOLD, 89, 93, 12, 36); Q('#fff0a0', 19, 93, 4, 36);
    Q(OLC, 22, 128, 76, 12); Q('#a8883a', 23, 129, 74, 10);
    return { img: c, ox: 60, oy: 138 };
  }
  function columnSprite() {
    /* pilar agung: alas bertingkat berpanel merah-emas, batang beralur dengan cincin permata,
       kepala bergaya Korintus (daun akantus emas, gulungan voluta, abakus berhias) */
    const W = 58, H = 190, cx = 29, [c, q] = mkCv(W, H), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h);
    const ST = '#e6e2d2', STL = '#f4f0e2', STD = '#b9b5a8', GL = '#fff0a0', GD = '#a8883a';
    const slab = (x0, y0, w, h, base, hi, sh) => { Q(OLC, x0 - 1, y0 - 1, w + 2, h + 2); Q(base, x0, y0, w, h); Q(hi, x0, y0, w, 2); Q(hi, x0, y0, 3, h); Q(sh, x0 + w - 5, y0 + 2, 5, h - 2); Q('rgba(0,0,0,.18)', x0, y0 + h - 2, w, 2) };

    /* batang: silinder beralur + bayangan bulat */
    const sx = cx - 15, sw = 30, sy = 50, sh = 100;
    Q(OLC, sx - 1, sy, sw + 2, sh); Q(ST, sx, sy, sw, sh);
    Q('rgba(255,255,255,.45)', sx, sy, 8, sh); Q('rgba(255,255,255,.2)', sx + 8, sy, 4, sh);
    Q('rgba(0,0,0,.10)', sx + 18, sy, 5, sh); Q('rgba(0,0,0,.24)', sx + 23, sy, 7, sh);
    for (let k = 0; k < 6; k++) { const fx = sx + 3 + k * 5; Q('rgba(0,0,0,.14)', fx, sy + 2, 1, sh - 4); Q('rgba(255,255,255,.28)', fx + 1, sy + 2, 1, sh - 4) }
    // cincin emas atas & bawah batang
    [[sy + 4, 6], [sy + sh - 12, 6]].forEach(([y0, h]) => { Q(OLC, sx - 3, y0 - 1, sw + 6, h + 2); Q(GOLD, sx - 2, y0, sw + 4, h); Q(GL, sx - 2, y0, sw + 4, 1); Q(GD, sx - 2, y0 + h - 2, sw + 4, 2); Q('rgba(0,0,0,.22)', sx + sw - 6, y0, 8, h) });
    // pita kerajaan di tengah batang: merah tua + bingkai emas + permata
    const my = sy + 40;
    Q(OLC, sx - 3, my - 1, sw + 6, 16); Q(CRD, sx - 2, my, sw + 4, 14); Q(CR, sx - 2, my + 1, sw + 4, 4); Q('rgba(0,0,0,.25)', sx + sw - 6, my, 8, 14);
    Q(GOLD, sx - 2, my, sw + 4, 1); Q(GOLD, sx - 2, my + 13, sw + 4, 1);
    [-9, 0, 9].forEach((o, i) => { ell(q, OLC, cx + o, my + 7, 4.2, 4.2); ell(q, GOLD, cx + o, my + 7, 3.4, 3.4); ell(q, i === 1 ? '#6ad0ff' : '#ff5a6a', cx + o, my + 7, 2.2, 2.2); Q('#fff', cx + o - 1, my + 5, 1, 1) });

    /* alas: 3 tingkat + panel merah berbingkai emas */
    slab(cx - 18, 150, 36, 9, '#d8d4c4', '#f0ecde', '#a9a597');                        // torus
    Q(GOLD, cx - 18, 154, 36, 2); Q(GL, cx - 18, 154, 36, 1);
    slab(cx - 22, 158, 44, 10, '#c4c0b2', SHC, '#9a968a');                              // tingkat 1
    slab(cx - 27, 167, 54, 19, '#b0ac9e', '#d4d0c2', '#8a867a');                        // plinth
    Q(GOLD, cx - 27, 170, 54, 2); Q(GL, cx - 27, 170, 54, 1);
    Q(OLC, cx - 17, 175, 34, 9); Q(CRD, cx - 16, 176, 32, 7); Q(GOLD, cx - 16, 176, 32, 1); Q(GOLD, cx - 16, 182, 32, 1);
    Q(GOLD, cx - 1, 177, 2, 5); Q(GL, cx - 3, 179, 6, 1); Q(GL, cx - 18, 178, 2, 2); Q(GL, cx + 16, 178, 2, 2);

    /* kepala pilar */
    Q(OLC, sx - 4, 41, sw + 8, 11); Q(GOLD, sx - 3, 42, sw + 6, 9); Q(GL, sx - 3, 42, sw + 6, 2); Q(GD, sx - 3, 48, sw + 6, 3);   // leher emas
    for (let k = 0; k < 7; k++) Q(OLC, sx - 1 + k * 5, 44, 1, 5);
    for (let j = 0; j < 22; j++) {                                                      // lonceng melebar ke atas
      const wj = Math.round(36 + (22 - j) * .9), x0 = cx - wj / 2, y0 = 20 + j;
      Q(OLC, x0 - 1, y0, wj + 2, 1); Q(ST, x0, y0, wj, 1); Q('rgba(255,255,255,.4)', x0, y0, Math.round(wj * .28), 1); Q('rgba(0,0,0,.22)', x0 + Math.round(wj * .72), y0, Math.round(wj * .28), 1)
    }
    // daun akantus emas (dua baris) + tulang daun
    [[-12, 40, 6, 11, GOLD], [0, 38, 6.5, 13, GOLD], [12, 40, 6, 11, GOLD]].forEach(([o, y0, rx, ry, col]) => { ell(q, OLC, cx + o, y0 - 3, rx + 1, ry + 1); ell(q, col, cx + o, y0 - 3, rx, ry); ell(q, GL, cx + o - 2, y0 - 6, rx * .35, ry * .55); Q(GD, cx + o, y0 - 12, 1, 18) });
    [[-6, 31, 4.5, 8], [6, 31, 4.5, 8]].forEach(([o, y0, rx, ry]) => { ell(q, OLC, cx + o, y0 - 2, rx + 1, ry + 1); ell(q, GD, cx + o, y0 - 2, rx, ry); ell(q, GOLD, cx + o - 1, y0 - 4, rx * .6, ry * .6); Q(GL, cx + o - 1, y0 - 8, 1, 6) });
    // voluta (gulungan) di sudut
    [-1, 1].forEach(sd => { const vx = cx + sd * 22; ell(q, OLC, vx, 27, 6.5, 6.5); ell(q, GOLD, vx, 27, 5.5, 5.5); ell(q, GD, vx, 27, 3.4, 3.4); ell(q, GL, vx - sd, 25, 1.6, 1.6); ell(q, OLC, vx, 27, 1.2, 1.2) });
    // abakus (pelat atas) berhias
    Q(OLC, cx - 29, 8, 58, 14); Q(ST, cx - 28, 9, 56, 12); Q(STL, cx - 28, 9, 56, 2); Q('rgba(0,0,0,.2)', cx + 18, 11, 10, 10);
    Q(GOLD, cx - 28, 12, 56, 3); Q(GL, cx - 28, 12, 56, 1); Q(GD, cx - 28, 14, 56, 1); Q(GOLD, cx - 28, 19, 56, 2);
    for (let k = -24; k <= 24; k += 8) Q(CRD, cx + k - 1, 15, 3, 3);
    Q(OLC, cx - 5, 3, 10, 7); Q(GOLD, cx - 4, 4, 8, 5); ell(q, '#ff5a6a', cx, 6, 2.2, 2.2); Q(GL, cx - 1, 5, 1, 1);   // permata mahkota
    return { img: c, ox: cx, oy: 184 };
  }
  function shelfSprite() {
    const [c, q] = mkCv(124, 100), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h), BC = ['#a8283e', '#2f5aa8', '#3a8a5a', '#d8b84a', '#7a4a8a', '#c8783a', '#e8e0d0'];
    Q(OLC, 0, 0, 124, 98); Q(WOODD, 1, 1, 122, 96); Q(WOOD, 1, 1, 122, 4); Q(GOLD, 1, 5, 122, 1);
    for (let r = 0; r < 3; r++) {
      const y0 = 6 + r * 30; Q('#2a1a10', 5, y0, 114, 26);
      for (let x0 = 6, i = 0; x0 < 114; i++) { const w = 4 + ((hash(x0, y0, 5) * 5) | 0), h = 18 + ((hash(x0, y0, 6) * 7) | 0); Q(BC[(i + r * 3) % 7], x0, y0 + 26 - h, w, h); Q('rgba(255,255,255,.2)', x0, y0 + 26 - h, 1, h); Q(GOLD, x0, y0 + 26 - h + 3, w, 1); x0 += w + 1 }
      Q(WOODL, 3, y0 + 26, 118, 4);
    }
    Q(OLC, 0, 96, 124, 4); return { img: c, ox: 62, oy: 98 };
  }
  function tableSprite() {
    const [c, q] = mkCv(224, 84), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h);
    Q('rgba(0,0,0,.22)', 8, 70, 210, 10); Q(OLC, 8, 50, 14, 28); Q(WOODD, 9, 51, 12, 26); Q(OLC, 202, 50, 14, 28); Q(WOODD, 203, 51, 12, 26);
    Q(OLC, 2, 12, 220, 44); Q(WOOD, 3, 13, 218, 42); Q(WOODL, 3, 13, 218, 4); Q(WOODD, 3, 50, 218, 5); Q(GOLD, 3, 17, 218, 1);
    Q('#e8d8a8', 62, 18, 100, 30); Q('#c8b078', 62, 18, 100, 2); Q('#a8283e', 80, 28, 4, 4); Q('#2f5aa8', 120, 24, 4, 4); Q('#3a8a5a', 140, 34, 4, 4); Q('#d8b84a', 100, 38, 3, 3);
    Q('rgba(60,40,20,.5)', 70, 32, 80, 1); Q('rgba(60,40,20,.5)', 110, 20, 1, 26);
    [24, 188].forEach(cx2 => { Q(OLC, cx2 - 3, 0, 7, 16); Q('#f4efe6', cx2 - 2, 4, 5, 11); Q(GOLD, cx2 - 4, 14, 9, 3) });
    return { img: c, ox: 112, oy: 74, fl: [[24, 0], [188, 0]] };
  }
  function chairSprite() {
    const [c, q] = mkCv(26, 42), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h);
    Q(OLC, 3, 2, 20, 22); Q(WOOD, 4, 3, 18, 20); Q(CR, 6, 5, 14, 14); Q(GOLD, 6, 5, 14, 1); Q(OLC, 2, 22, 22, 12); Q(WOODL, 3, 23, 20, 8); Q(OLC, 4, 32, 4, 8); Q(OLC, 18, 32, 4, 8);
    return { img: c, ox: 13, oy: 38 };
  }
  function deskSprite() {
    const [c, q] = mkCv(92, 62), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h);
    Q('rgba(0,0,0,.22)', 6, 52, 82, 8); Q(OLC, 4, 40, 10, 18); Q(OLC, 78, 40, 10, 18); Q(OLC, 0, 10, 92, 34); Q(WOOD, 1, 11, 90, 32); Q(WOODL, 1, 11, 90, 3);
    Q('#e8d8a8', 10, 14, 30, 20); Q('#cbb27a', 10, 14, 30, 2); Q('#2a1a10', 52, 18, 14, 8); Q('#fff', 70, 8, 3, 18); Q('#d0b090', 69, 5, 5, 4);
    return { img: c, ox: 46, oy: 54 };
  }
  function chestSprite() {
    const [c, q] = mkCv(34, 28), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h);
    Q(OLC, 1, 6, 32, 22); Q(WOOD, 2, 7, 30, 20); Q(WOODL, 2, 7, 30, 6); Q(GOLD, 2, 13, 30, 2); Q(GOLD, 15, 11, 4, 8); Q('#fff0a0', 16, 12, 2, 3); Q(GOLD, 6, 7, 2, 20); Q(GOLD, 26, 7, 2, 20);
    Q('#fff0a0', 8, 4, 4, 3); Q(GOLD, 16, 3, 5, 4); Q('#fff0a0', 22, 5, 3, 3);
    return { img: c, ox: 17, oy: 26 };
  }
  function brazierSprite() {
    const [c, q] = mkCv(30, 44), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h);
    Q(OLC, 12, 24, 6, 18); Q('#6a5a3a', 13, 25, 4, 16); Q(OLC, 5, 38, 20, 6); Q('#6a5a3a', 6, 39, 18, 4);
    Q(OLC, 2, 14, 26, 14); Q('#8a7a4a', 3, 15, 24, 12); Q(GOLD, 3, 15, 24, 3); Q('#3a1a10', 5, 13, 20, 4); Q('#ff7a1a', 8, 13, 14, 2);
    return { img: c, ox: 15, oy: 42 };
  }
  function candelabraSprite() {
    const [c, q] = mkCv(34, 72), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h), cx = 17;
    Q(OLC, cx - 9, 63, 18, 8); Q('#a8883a', cx - 8, 64, 16, 6); Q(GOLD, cx - 8, 64, 16, 2);
    Q(OLC, cx - 4, 54, 8, 11); Q('#a8883a', cx - 3, 55, 6, 9); Q(OLC, cx - 3, 28, 6, 28); Q(GOLD, cx - 2, 29, 4, 26); Q('#fff0a0', cx - 2, 29, 1, 26);
    Q(OLC, cx - 14, 26, 29, 5); Q(GOLD, cx - 13, 27, 27, 3);
    [[-12, 12], [0, 6], [12, 12]].forEach(([o, top]) => { Q(OLC, cx + o - 4, 22, 8, 7); Q(GOLD, cx + o - 3, 23, 6, 4); Q(OLC, cx + o - 3, top, 6, 14); Q('#f4efe6', cx + o - 2, top + 1, 4, 13); Q('#ffd870', cx + o - 2, top + 1, 4, 2) });
    return { img: c, ox: cx, oy: 70, fl: [[cx - 12, 9], [cx, 3], [cx + 12, 9]] };
  }
  function plantSprite() {
    const [c, q] = mkCv(44, 64), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h), cx = 22;
    Q(OLC, cx - 12, 46, 24, 17); Q('#8a3a2a', cx - 11, 47, 22, 15); Q('#b85a3a', cx - 11, 47, 8, 15); Q('rgba(0,0,0,.25)', cx + 4, 47, 7, 15); Q(GOLD, cx - 12, 48, 24, 3);
    Q(OLC, cx - 2, 28, 5, 20); Q('#5a3a1a', cx - 1, 29, 3, 18);
    ell(q, OLC, cx, 20, 19, 17); ell(q, '#1f4a22', cx, 20, 17.5, 15.5); ell(q, '#2f6a2c', cx - 2, 18, 15, 13); ell(q, '#4a8a3c', cx - 5, 14, 10, 8.5);
    for (let i = 0; i < 16; i++) Q('#7ac05a', cx + (((hash(i, 1, 3) - .5) * 26) | 0), 6 + ((hash(i, 2, 3) * 24) | 0), 2, 1);
    ell(q, '#ffd34d', cx + 8, 12, 2.2, 2.2); ell(q, '#ff9ac0', cx - 9, 22, 2.2, 2.2); ell(q, '#fff', cx + 3, 26, 1.8, 1.8);
    return { img: c, ox: cx, oy: 62 };
  }
  function roundTableSprite() {
    const [c, q] = mkCv(72, 76), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h), cx = 36;
    ell(q, 'rgba(0,0,0,.22)', cx, 70, 28, 6); Q(OLC, cx - 4, 46, 9, 24); Q(WOODD, cx - 3, 47, 7, 22); Q(OLC, cx - 13, 66, 26, 6); Q(WOOD, cx - 12, 67, 24, 4);
    ell(q, OLC, cx, 44, 31, 13.5); ell(q, CRD, cx, 43, 30, 12.5); ell(q, GOLD, cx, 42, 28, 11); ell(q, CR, cx, 42, 26.5, 10);
    Q(OLC, cx - 6, 28, 12, 15); Q('#3a6aa8', cx - 5, 29, 10, 13); Q(GOLD, cx - 5, 31, 10, 2); Q('rgba(255,255,255,.3)', cx - 5, 29, 3, 13);
    [[-5, 14], [0, 11], [5, 15], [-2, 18]].forEach(([dx, dy], i) => { Q('#2f7a3a', cx + dx, dy + 4, 1, 26 - dy); ell(q, i % 2 ? '#ffd34d' : '#ffe680', cx + dx, dy, 3.2, 3.2); ell(q, '#fff3b8', cx + dx - 1, dy - 1, 1.2, 1.2) });
    return { img: c, ox: cx, oy: 68 };
  }
  function globeSprite() {
    const [c, q] = mkCv(44, 64), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h), cx = 22;
    Q(OLC, cx - 13, 55, 26, 8); Q(WOODD, cx - 12, 56, 24, 6); Q(OLC, cx - 3, 40, 6, 17); Q(WOOD, cx - 2, 41, 4, 15);
    ell(q, OLC, cx, 24, 17, 17); ell(q, '#2a78a0', cx, 24, 16, 16); ell(q, '#3a8a4a', cx - 6, 20, 6.5, 5); ell(q, '#3a8a4a', cx + 5, 29, 5, 6); ell(q, '#c8b078', cx + 7, 18, 3.2, 3.2); ell(q, '#e8e4d4', cx, 10, 6, 2);
    ell(q, 'rgba(255,255,255,.3)', cx - 6, 16, 5, 4); q.strokeStyle = GOLD; q.lineWidth = 2; q.beginPath(); q.ellipse(cx, 24, 18, 18, .45, 0, TAU); q.stroke();
    return { img: c, ox: cx, oy: 62 };
  }
  function torchSprite() {
    const [c, q] = mkCv(18, 38), Q = (col, a, b, w, h) => Qc(q, col, a, b, w, h), cx = 9;
    Q(OLC, cx - 5, 24, 10, 12); Q('#5a4a3a', cx - 4, 25, 8, 10); Q('#8a7a5a', cx - 4, 25, 8, 2);
    Q(OLC, cx - 3, 10, 6, 16); Q(WOOD, cx - 2, 11, 4, 14); Q(OLC, cx - 5, 8, 10, 5); Q('#3a2a1a', cx - 4, 9, 8, 3);
    return { img: c, ox: cx, oy: 36, fl: [[cx, 5]] };
  }
  const crown = n => { const dy = n.sit ? 27 : 32, X = Math.round(n.x), Y = Math.round(n.y - dy); Rr(OLC, X - 6, Y - 1, 12, 5); Rr(GOLD, X - 5, Y, 10, 3); Rr(GOLD, X - 5, Y - 3, 2, 3); Rr(GOLD, X - 1, Y - 4, 2, 4); Rr(GOLD, X + 3, Y - 3, 2, 3); Rr('#fff0a0', X - 5, Y, 3, 1); Rr(CR, X - 1, Y + 1, 2, 1) };
  /* api animasi: dipakai obor, kandil, lilin, anglo */
  function flameAt(fx, fy, big) {
    const s = big ? 1.5 : 1, fk = Math.sin(t * 14 + fx * .7) * 1.4, fh = 1 + .25 * Math.sin(t * 11 + fx);
    g.save(); g.globalCompositeOperation = 'lighter';
    lightL(fx, fy + 4, (big ? 62 : 26) + Math.sin(t * 12 + fx) * 3, '255,170,70', big ? .42 : .26);
    Rr('#ff6a10', fx - 3 * s + fk * .5, fy + 1, 6 * s, Math.round(5 * s * fh)); Rr('#ffb030', fx - 2 * s + fk * .7, fy - 2 * s, 4 * s, Math.round(6 * s * fh)); Rr('#ffec90', fx - 1 + fk, fy - 4 * s, 2 * s, Math.round(5 * s * fh));
    g.restore();
  }
  function chandelier(a, b) {
    const sw = Math.sin(t * .8 + a * .01) * 1.5, X = a + sw;
    Rr(OLC, X, b - 240, 2, 240); Rr('#6a5a3a', X, b - 240, 1, 240);
    [[34, 8, 0], [22, 6, -9], [11, 4, -16]].forEach(([rx, ry, dy], k) => { g.fillStyle = OLC; g.beginPath(); g.ellipse(X, b + dy, rx + 2, ry + 2, 0, 0, 7); g.fill(); g.fillStyle = k ? '#a8883a' : GOLD; g.beginPath(); g.ellipse(X, b + dy - 1, rx, ry, 0, 0, 7); g.fill(); g.fillStyle = '#fff0a0'; g.beginPath(); g.ellipse(X - rx * .3, b + dy - 2, rx * .5, ry * .35, 0, 0, 7); g.fill() });
    Rr(OLC, X - 2, b - 16, 5, 16); Rr(GOLD, X - 1, b - 16, 3, 16);
    for (let i = 0; i < 10; i++) { const ang = i * Math.PI / 5, cx2 = X + Math.cos(ang) * 31, cy2 = b + Math.sin(ang) * 7; if (Math.sin(ang) < -.1) { } Rr(OLC, cx2 - 2, cy2 - 8, 5, 9); Rr('#f4efe6', cx2 - 1, cy2 - 7, 3, 8); flameAt(cx2, cy2 - 11, 0) }
    for (let i = 0; i < 12; i++) { const ang = i * Math.PI / 6 + .2, px = X + Math.cos(ang) * 26, py = b + 6 + Math.sin(ang) * 6, tw = Math.max(0, Math.sin(t * 4 + i * 1.9)); Rr('rgba(' + (i % 2 ? '190,240,255' : '255,255,255') + ',' + (.55 + .45 * tw) + ')', px - 1, py, 2, 5 + (i % 3)); if (tw > .8) Rr('#fff', px - 1, py + 7, 3, 1) }
    g.save(); g.globalCompositeOperation = 'lighter'; lightL(X, b + 18, 150 + Math.sin(t * 5 + a) * 5, '255,210,140', .26); g.restore();
  }

  IN.build = function () {
    const [bg, x] = mkCv(PW, PH); IN.bg = bg;
    const walls = IN.walls = [], objs = IN.objs = [], N = IN.npcs = [];
    const R = (c, a, b, w, h) => rc(x, c, Math.round(a), Math.round(b), Math.round(w), Math.round(h));
    const spr = (s, a, b, solid, extra) => {
      const swd = Math.max(8, (s.img.width * .36) | 0); if (!(extra && extra.noSh)) ell(x, 'rgba(0,0,0,.22)', a, b - 2, swd, Math.max(3, swd * .24));
      const o = { x: Math.round(a), y: Math.round(b), img: s.img, ox: s.ox, oy: s.oy, oh: s.img.height, ...extra };
      if (s.fl) o.fl = s.fl.map(f => [Math.round(a + f[0] - s.ox), Math.round(b + f[1] - s.oy)]);
      objs.push(o); if (solid) walls.push(solid);
    };

    /* lantai marmer: ubin catur, urat batu, inlay emas, pantulan */
    for (let yy = 120; yy < PH; yy += 40) for (let xx = 0; xx < PW; xx += 40) {
      const ck = ((xx / 40 + yy / 40) & 1), hv = hash(xx, yy, 41);
      R(ck ? '#d8d0c0' : '#b9b0a0', xx, yy, 40, 40); R(ck ? '#e4dccc' : '#c4bbab', xx, yy, 40, 2); R('rgba(0,0,0,.10)', xx, yy + 38, 40, 2); R('rgba(0,0,0,.08)', xx + 38, yy, 2, 40);
      R('rgba(255,255,255,' + (.05 + hv * .08) + ')', xx + 2, yy + 2, 18, 18);
      if (hv > .45) { x.strokeStyle = ck ? 'rgba(120,108,96,.22)' : 'rgba(80,70,60,.22)'; x.lineWidth = 1; x.beginPath(); const ax = xx + hash(xx, yy, 7) * 40, bx = xx + hash(xx, yy, 8) * 40; x.moveTo(ax, yy); x.quadraticCurveTo(xx + 20 + (hv - .5) * 24, yy + 20, bx, yy + 40); x.stroke() }
    }
    R('rgba(0,0,0,.25)', 0, 128, PW, 14);
    const band = (bx, by, bw, bh, vert) => {
      R(OLC, bx - 1, by - 1, bw + 2, bh + 2); R('#34283e', bx, by, bw, bh); R(GOLD, vert ? bx + 3 : bx, vert ? by : by + 3, vert ? 1 : bw, vert ? bh : 1); R(GOLD, vert ? bx + bw - 4 : bx, vert ? by : by + bh - 4, vert ? 1 : bw, vert ? bh : 1);
      for (let k = 12; k < (vert ? bh : bw) - 6; k += 36) { const dx = vert ? bx + bw / 2 : bx + k, dy = vert ? by + k : by + bh / 2; R(GOLD, dx - 3, dy - 1, 6, 2); R(GOLD, dx - 1, dy - 3, 2, 6); R('#fff0a0', dx - 1, dy - 1, 2, 2) }
    };
    band(52, 140, 24, PH - 200, 1); band(PW - 76, 140, 24, PH - 200, 1); band(76, PH - 86, 504, 24, 0); band(700, PH - 86, 504, 24, 0);
    [[330, 300], [330, 440], [330, 580], [330, 720], [950, 300], [950, 440], [950, 580], [950, 720]].forEach(([a, b]) => { R(OLC, a - 35, b - 12, 70, 15); R(CRD, a - 34, b - 11, 68, 13); R(GOLD, a - 34, b - 11, 68, 1); R(GOLD, a - 34, b + 1, 68, 1); for (let k = 0; k < 12; k++) R('rgba(255,255,255,' + (.16 - k * .012) + ')', a - 14, b + 4 + k * 3, 28, 3) });   // alas karpet beremas + pantulan pilar

    /* dinding belakang */
    R(OLC, 0, 0, PW, 130); R(SH0, 0, 2, PW, 98); mortarC(x, 0, 2, PW, 98, 20); R(SHL, 0, 2, PW, 3);
    R(OLC, 0, 98, PW, 32); R(WOODD, 0, 100, PW, 28); for (let k = 0; k < PW; k += 64) { R(WOOD, k + 2, 103, 60, 22); R(WOODL, k + 2, 103, 60, 2); R('rgba(0,0,0,.25)', k + 2, 120, 60, 5); R(GOLD, k + 30, 112, 3, 3) }
    R(GOLD, 0, 98, PW, 3); R('rgba(0,0,0,.3)', 0, 128, PW, 2);
    for (let k = 0; k < PW; k += 100) R('rgba(0,0,0,' + (.1 + .08 * hash(k, 3, 9)) + ')', k, 2, 100, 96);           // variasi batu dinding
    const g1 = x.createLinearGradient(0, 0, 0, 100); g1.addColorStop(0, 'rgba(10,4,16,.5)'); g1.addColorStop(1, 'rgba(10,4,16,0)'); x.fillStyle = g1; x.fillRect(0, 0, PW, 100);
    const WINC = ['#3a6aa8', '#a8283e', '#d8b84a', '#3a8a5a', '#7a4a8a'];
    const win = wx => {
      R(OLC, wx - 31, 12, 62, 88); R(SHC, wx - 29, 14, 58, 84);
      for (let j = 0; j < 7; j++) for (let k = 0; k < 4; k++) R(WINC[(j * 2 + k + (wx >> 5)) % 5], wx - 26 + k * 13, 24 + j * 10, 12, 9);
      R(SHC, wx - 29, 14, 58, 12); R(OLC, wx - 27, 22, 54, 2); R('#2a2018', wx - 1, 24, 2, 72); for (let j = 0; j < 7; j++) R('#2a2018', wx - 26, 33 + j * 10, 52, 1);
      R(OLC, wx - 33, 96, 66, 6); R(SHC, wx - 32, 97, 64, 3); R('rgba(255,255,255,.18)', wx - 26, 24, 8, 72); R(GOLD, wx - 29, 13, 58, 1)
    };
    WINX.forEach(win);
    x.fillStyle = OLC; x.beginPath(); x.arc(MX, 62, 50, 0, TAU); x.fill(); x.fillStyle = SHC; x.beginPath(); x.arc(MX, 62, 47, 0, TAU); x.fill();
    for (let i = 0; i < 12; i++) { x.fillStyle = WINC[i % 5]; x.beginPath(); x.moveTo(MX, 62); x.arc(MX, 62, 42, i * TAU / 12, (i + 1) * TAU / 12); x.closePath(); x.fill() }
    x.strokeStyle = '#2a2018'; x.lineWidth = 2; x.beginPath(); for (let i = 0; i < 12; i++) { x.moveTo(MX, 62); x.lineTo(MX + Math.cos(i * TAU / 12) * 42, 62 + Math.sin(i * TAU / 12) * 42) } x.stroke();
    x.beginPath(); x.arc(MX, 62, 28, 0, TAU); x.stroke(); x.fillStyle = GOLD; x.beginPath(); x.arc(MX, 62, 12, 0, TAU); x.fill(); x.fillStyle = '#fff0a0'; x.beginPath(); x.arc(MX, 62, 6, 0, TAU); x.fill();
    const tap = (tx, kind) => {
      R(OLC, tx - 21, 8, 42, 90); R(CR, tx - 20, 9, 40, 84); R('rgba(255,255,255,.14)', tx - 20, 9, 8, 84); R(GOLD, tx - 20, 9, 40, 3); R(GOLD, tx - 20, 86, 40, 3); R('rgba(0,0,0,.2)', tx + 10, 12, 10, 74);
      if (kind === 0) crownC(x, tx, 36, GOLD);
      else if (kind === 1) { R(OLC, tx - 3, 22, 6, 44); R('#e8e4d4', tx - 2, 23, 4, 42); R(GOLD, tx - 12, 56, 24, 4); R(GOLD, tx - 3, 60, 6, 12) }
      else if (kind === 2) { x.fillStyle = GOLD; x.beginPath(); x.arc(tx, 44, 11, 0, TAU); x.fill(); x.fillStyle = '#fff0a0'; x.beginPath(); x.arc(tx, 44, 6, 0, TAU); x.fill(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; R(GOLD, tx + Math.cos(a) * 16 - 1, 44 + Math.sin(a) * 16 - 1, 3, 3) } }
      else { x.fillStyle = GOLD; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 14; x.lineTo(tx + Math.cos(a) * r, 44 + Math.sin(a) * r) } x.closePath(); x.fill() }
      R(GOLD, tx - 8, 72, 16, 2); R(CR, tx - 20, 93, 14, 6); R(CR, tx + 6, 93, 14, 6); R('#6a5a3a', tx - 24, 6, 48, 3); for (let k = -18; k <= 18; k += 6) R(GOLD, tx + k, 99, 2, 4);
    };
    [[230, 0], [470, 1], [810, 2], [1050, 3]].forEach(([a, k]) => tap(a, k));
    /* tirai beludru di sisi singgasana */
    const curtain = cx0 => {
      R('#6a5a3a', cx0 - 34, 5, 68, 4); R(GOLD, cx0 - 36, 4, 4, 6); R(GOLD, cx0 + 32, 4, 4, 6);
      for (let yy = 9; yy < 128; yy++) {
        const w = yy < 70 ? 30 : yy < 90 ? 30 - (yy - 70) * .8 : 14 + (yy - 90) * .3;
        for (let k = -w; k < w; k += 5) { const sh = Math.sin((k + yy * .05) * .5); R(sh > .2 ? CR : (sh > -.4 ? '#8a1e34' : CRD), cx0 + k, yy, 5, 1) }
      }
      R(OLC, cx0 - 16, 80, 32, 4); R(GOLD, cx0 - 15, 81, 30, 2); R(GOLD, cx0 - 2, 84, 4, 12); R('#fff0a0', cx0 - 1, 96, 2, 6);
    };
    curtain(535); curtain(745);
    /* dinding samping + pintu bawah */
    [[0, 1], [PW - 44, -1]].forEach(([wx, dr]) => { R(OLC, wx, 0, 44, PH); R(SH0, wx + (dr > 0 ? 0 : 3), 0, 41, PH); mortarC(x, wx + (dr > 0 ? 0 : 3), 0, 41, PH, 14); R(SHD, wx + (dr > 0 ? 28 : 3), 0, 13, PH); R(GOLD, wx + (dr > 0 ? 40 : 3), 130, 1, PH - 130) });
    R(OLC, 0, PH - 50, PW, 50); R(SH0, 0, PH - 48, PW, 44); mortarC(x, 0, PH - 48, PW, 44, 20); R(SHD, 0, PH - 14, PW, 14); R(GOLD, 0, PH - 50, PW, 3);
    for (let k = 120; k < PW; k += 160) if (Math.abs(k - MX) > 160) { crownC(x, k, PH - 34, GOLD); R(GOLD, k - 12, PH - 24, 24, 2) }
    const GA = 580, GB = 700; R('#e8e0c8', GA, PH - 50, GB - GA, 50); R('#fff6d8', GA + 6, PH - 50, GB - GA - 12, 50);
    [[GA - 34, 1], [GB, -1]].forEach(([dx, dr]) => { R(OLC, dx, PH - 108, 36, 62); R(WOODD, dx + 1, PH - 107, 34, 60); R(WOOD, dx + 1, PH - 107, 17, 60); R(GOLD, dx + 17, PH - 107, 2, 60); R(GOLD, dx + 1, PH - 80, 34, 2); R(GOLD, dx + 1, PH - 60, 34, 2) });
    R(OLC, GA - 36, PH - 114, GB - GA + 72, 10); R(SHC, GA - 35, PH - 113, GB - GA + 70, 6); R(GOLD, GA - 35, PH - 108, GB - GA + 70, 2);
    walls.push([-20, -20, PW + 40, 140], [-20, -20, 44, PH + 40], [PW - 44, -20, 64, PH + 40], [-20, PH - 50, GA + 20, 70], [GB, PH - 50, PW - GB + 20, 70]);

    /* karpet merah panjang bermotif + permadani lambang */
    R(OLC, 580, 130, 120, PH - 180); R(CR, 584, 130, 112, PH - 180); R(GOLD, 584, 130, 4, PH - 180); R(GOLD, 692, 130, 4, PH - 180); R(CRD, 592, 130, 2, PH - 180); R(CRD, 686, 130, 2, PH - 180);
    for (let yy = 150; yy < PH - 60; yy += 56) { R(GOLD, 636, yy, 8, 2); R(GOLD, 638, yy - 4, 4, 10); R(GOLD, 604, yy + 4, 2, 2); R(GOLD, 674, yy + 4, 2, 2); R('rgba(255,255,255,.07)', 596, yy, 88, 1) }
    for (let yy = PH - 60; yy < PH - 50; yy += 3) R(GOLD, 586 + (yy % 6), yy, 2, 2);
    ell(x, 'rgba(0,0,0,.2)', MX, 504, 98, 54); ell(x, OLC, MX, 500, 96, 52); ell(x, CRD, MX, 500, 93, 49); ell(x, CR, MX, 500, 86, 44); ell(x, GOLD, MX, 500, 74, 36); ell(x, CR, MX, 500, 70, 33);
    x.strokeStyle = 'rgba(216,184,74,.7)'; x.lineWidth = 1; x.beginPath(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; x.moveTo(MX + Math.cos(a) * 40, 500 + Math.sin(a) * 19); x.lineTo(MX + Math.cos(a) * 68, 500 + Math.sin(a) * 32) } x.stroke();
    crownC(x, MX, 492, GOLD); R(GOLD, MX - 22, 504, 44, 3); R(GOLD, MX - 14, 510, 28, 2);
    /* panggung singgasana + pagar emas */
    R('rgba(0,0,0,.3)', 438, 252, 404, 10);
    [[440, 232, 400, 22, '#a89e8a'], [460, 210, 360, 22, '#b9b0a0'], [480, 128, 320, 82, '#cfc6b4']].forEach(([a, b, w, h, col]) => { R(OLC, a - 2, b - 1, w + 4, h + 2); R(col, a, b, w, h); R('rgba(255,255,255,.22)', a, b, w, 3); R('rgba(0,0,0,.18)', a, b + h - 4, w, 4) });
    R(CRD, 480, 130, 320, 78); R(CR, 484, 130, 312, 78); R(GOLD, 484, 130, 3, 78); R(GOLD, 793, 130, 3, 78);
    for (let k = 490; k < 800; k += 20) { if (k > 560 && k < 704) continue; R(OLC, k - 1, 200, 5, 12); R(GOLD, k, 201, 3, 10); R('#fff0a0', k, 200, 3, 2) }
    R(CR, 584, 130, 112, 124); R(GOLD, 584, 210, 4, 44); R(GOLD, 692, 210, 4, 44);

    /* perabot */
    spr(throneSprite(), MX, 176, [MX - 46, 132, 92, 52], { noSh: 1 });
    const col = columnSprite();[330, 950].forEach(a => [300, 440, 580, 720].forEach(b => spr(col, a, b, [a - 14, b - 8, 28, 12])));
    const br = brazierSprite();[[490, 252], [790, 252], [538, PH - 70], [742, PH - 70]].forEach(([a, b]) => spr(br, a, b, [a - 9, b - 6, 18, 8], { flame: [a, b - 44], glow: 1, ember: 1 }));
    const cd = candelabraSprite();[[560, 410], [720, 410], [560, 640], [720, 640]].forEach(([a, b]) => spr(cd, a, b, [a - 7, b - 6, 14, 8]));
    const pl = plantSprite();[[290, 300], [990, 300], [290, 720], [990, 720], [90, 790], [1190, 790], [300, 150], [980, 150]].forEach(([a, b]) => spr(pl, a, b, [a - 12, b - 8, 24, 10]));
    const rt = roundTableSprite();[[200, 640], [1100, 660], [190, 250]].forEach(([a, b]) => spr(rt, a, b, [a - 22, b - 10, 44, 12]));
    spr(globeSprite(), 128, 366, [114, 356, 28, 10]);
    spr(tableSprite(), 190, 480, [96, 456, 188, 26]); const ch = chairSprite();[[124, 444], [190, 444], [256, 444], [124, 526], [190, 526], [256, 526]].forEach(([a, b]) => spr(ch, a, b, [a - 8, b - 6, 16, 8]));
    spr(shelfSprite(), 1110, 332, [1052, 296, 120, 38]); spr(shelfSprite(), 1110, 590, [1052, 554, 120, 38]);
    spr(deskSprite(), 1120, 470, [1076, 446, 88, 26]);
    const cs = chestSprite();[[1196, 720], [1160, 726], [96, 720]].forEach(([a, b]) => spr(cs, a, b, [a - 14, b - 8, 28, 10]));
    const ks = knightSprite();[[90, 640], [1190, 640], [90, 330], [1190, 330]].forEach(([a, b]) => spr(ks, a, b, [a - 9, b - 6, 18, 8]));
    const tc = torchSprite();[230, 380, 530, 680, 790].forEach(b => [58, PW - 58].forEach(a => spr(tc, a, b, null, { noSh: 1, glow: 0 })));
    objs.sort((a, b) => a.y - b.y);

    /* ---------- NPC & papan info ---------- */
    const mkN = o => { N.push(o); return o };
    const sign = (n, a, b, lines) => mkN({ n, x: a, y: b, sign: 1, rng: 56, verb: 'Lihat', _bn: Infinity, lines });
    const gd = (n, ax, ay, fc, lines, chat, extra) => mkN({ n, x: ax, y: ay, fc, sk: '#d9a07a', hair: '#3a2a1a', hat: 'helm', armor: 1, c1: '#7a1a2a', c2: GOLD, c3: '#3a3d48', prop: 'spear', lines, chat, ...extra });
    mkN({
      n: 'Raja Aurelius I', x: MX, y: 181, sit: 1, fc: 1, crown: 1, rng: 70, verb: 'Menghadap', sk: '#e0b898', hair: '#c8c8d0', hs: 'short', beard: '#c8c8d0', c1: CR, c2: GOLD, c3: '#3a0e18', vest: GOLD, prop: 'staff', pc: GOLD, chat: ['Hmm...', 'Negeriku, tanggung jawabku.'],
      lines: ['Selamat datang di Istana Aurelia, wahai pahlawan dari Aula Kuno. Akulah Aurelius, raja negeri ini.', 'Para tetua Lembah Lentera mengirim kabar: lentera mereka berkedip tak wajar sejak bisikan dari Abyss makin keras.', 'Kau telah melangkah lebih dalam dari siapa pun yang pernah kami kenal. Kerajaan ini berutang budi padamu.', 'Pintu istanaku selalu terbuka bagimu. Pergilah dengan restuku, dan ingatlah: terang yang dijaga bersama tak akan padam.']
    });
    mkN({ n: 'Putri Seraphine', x: 540, y: 262, fc: 1, crown: 1, sk: '#e8c0a0', hair: '#e8c860', hs: 'long', c1: '#d878a8', c2: '#fff', c3: '#6a3a5a', chat: ['Ayah sibuk lagi...', 'Aku ingin keluar tembok!'], lines: ['Kau pahlawan itu? Aku Seraphine, putri raja. Aku selalu ingin keluar tembok dan melihat desa-desa kecil.', 'Ayah bilang di luar berbahaya. Tapi cerita Hendra si penyair membuatku penasaran.'] });
    mkN({ n: 'Menteri Halim', x: 748, y: 266, fc: -1, sk: '#c9946e', hair: '#d8d8e0', hs: 'bald', beard: '#d8d8e0', hat: 'cap', hc: '#2a3a6a', c1: '#2a3a6a', c2: GOLD, c3: '#1a1a30', vest: '#c8a040', prop: 'scroll', chat: ['Anggaran lagi...', 'Hmm, laporan ini.'], lines: ['Halim, menteri besar. Aku mengurus pajak, jalan, dan lentera kerajaan, semuanya lebih mahal dari kelihatannya.', 'Raja jarang tidur belakangan ini. Bisikan itu mengusiknya, pahlawan.'] });
    gd('Jenderal Brata', 400, 350, 1, ['Brata, jenderal pasukan Aurelia. Pasukanku siap, tapi pedang tak berguna melawan bisikan.', 'Kalau kau butuh senjata atau baju zirah, bengkel Borin di desa tempat terbaik. Dia tukang besi andalanku.'], ['Disiplin adalah segalanya.', 'Pasukan siap.'], { c1: '#4a1a2a', hair: '#8a8a90', c2: '#e8e4d8' });
    mkN({
      n: 'Elara, Penyihir Istana', x: 270, y: 380, fc: 1, sk: '#e8c0a8', hair: '#7a3a9a', hs: 'long', hat: 'feather', hc: '#5a2a8a', c1: '#5a2a8a', c2: '#e8d890', c3: '#2a1a3a', prop: 'staff', pc: '#b48cff', chat: ['Aura aneh...', 'Kristal-kristal bergetar.'], path: [[270, 380], [270, 600], [270, 790], [270, 600]], pi: 1,
      lines: ['Elara, penyihir istana. Kristal ramalan di menara bergetar sejak kau keluar dari Aula Kuno.', 'Bisikan Abyss berbicara lewat lentera. Itu sebabnya raja menjaga lentera-lentera tetap menyala.']
    });
    mkN({ n: 'Bima, Juru Tulis', x: 1120, y: 500, fc: -1, sk: '#d0986c', hair: '#2a1a14', hs: 'short', c1: '#4a3a2a', c2: '#e8d890', c3: '#2a2a20', prop: 'scroll', chat: ['Menyalin titah...', 'Tinta habis lagi.'], lines: ['Bima, juru tulis istana. Setiap titah raja kucatat, setiap tamu kuregistrasi. Namamu sudah kutulis, pahlawan.', 'Perpustakaan di sebelah sana menyimpan catatan tentang Aula Kuno. Silakan lihat, tapi jangan menumpahkan tinta.'] });
    gd('Pengawal Singgasana, Aryo', 548, 312, 1, ['Aku berdiri di sini sejak fajar demi raja.', 'Hormatlah di hadapan baginda.'], ['Siaga.', 'Demi mahkota.'], { c2: '#e8e4d8' });
    gd('Pengawal Singgasana, Bayu', 732, 312, -1, ['Tidak ada yang melewati karpet ini tanpa izin raja.', 'Kau tamu istimewa, tentu boleh mendekat.'], ['Diam dan tegap.', 'Aman.'], { sk: '#c0845c' });
    gd('Pengawal Pintu, Cakra', 556, PH - 96, 1, ['Selamat datang, pahlawan. Hati-hati menghadap raja, jangan memotong ucapannya.', 'Jalan keluar ada di belakangmu, kembali ke jalan raya.'], ['Pintu aman.', 'Hmm.'], {});
    gd('Pengawal Pintu, Danu', 724, PH - 96, -1, ['Aula ini dibangun tiga generasi lalu. Lihat jendela kacanya, hanya itu yang tersisa dari raja pertama.'], ['Tetap siaga.', 'Sepi hari ini.'], { sk: '#c9946e' });
    mkN({
      n: 'Rina, Pelayan Istana', x: 400, y: 620, fc: 1, sk: '#e8c0a0', hair: '#8a5a2a', hs: 'bun', hat: 'bonnet', c1: CR, c2: '#e8d8a0', c3: '#4a2a1a', apron: '#f0e8dc', prop: 'basket', chat: ['Teh untuk raja~', 'Banyak tugas!'], path: [[400, 620], [400, 780], [840, 780], [870, 620], [870, 400], [870, 620]], pi: 1,
      lines: ['Aku Rina, pelayan istana. Aku membawa teh dan kue untuk para menteri.', 'Karpet ini disikat tiap pagi. Tolong jangan bawa lumpur dari hutan, pahlawan!']
    });
    mkN({ n: 'Mbok Tari, Juru Masak', x: 1140, y: 700, fc: -1, fresh: 1, shop: 'food', rng: 44, sk: '#d9a07a', hair: '#d8d8e0', hs: 'bun', hat: 'bonnet', c1: '#e8e0d0', c2: '#c8b080', c3: '#4a3a2a', apron: '#f0e8dc', prop: 'basket', chat: ['Sup panas, sup panas!', 'Sedap~'], get lines() { return this.seen ? ['Mau tambah lagi, nak?'] : ['Mbok Tari, juru masak istana. Pahlawan harus makan yang cukup. Ini, silakan pilih!'] }, act() { this.seen = 1; this.fresh = 0; WORLD.openShop('food') } });
    mkN({
      n: 'Pipo, Badut Istana', x: 470, y: 440, fc: 1, kid: 0, sk: '#e8c0a0', hair: '#c8483a', hs: 'short', hat: 'feather', hc: '#3a8a5a', c1: '#a8283e', c2: '#2f5aa8', c3: '#d8b84a', vest: '#d8b84a', chat: ['Hehehe!', 'Tahu kenapa ayam menyeberang?', 'Ayo tertawa, nak!'], path: [[470, 440], [470, 650], [820, 650], [820, 440]], pi: 1,
      lines: ['Aku Pipo, badut istana! Raja tertawa sekali setahun, dan akulah penyebabnya!', 'Tahu kenapa ksatria tak pernah takut gelap? Karena lenterany... ah, lupa lanjutannya. Hehe.']
    });
    mkN({ n: 'Lady Marissa', x: 1040, y: 420, fc: -1, sk: '#e8c0a8', hair: '#3a1a2a', hs: 'bun', c1: '#2f6a8a', c2: '#e8d890', c3: '#1a2a3a', vest: '#d8b84a', prop: 'scroll', chat: ['Gosip terbaru...', 'Sungguh membosankan.'], lines: ['Marissa, bangsawan Aurelia. Pesta musim gugur istana bulan depan, aku harap kau hadir, pahlawan.', 'Konon pahlawan datang dari Aula Kuno. Romantis sekali!'] });
    mkN({ n: 'Lord Cedric', x: 300, y: 560, fc: 1, sk: '#d9a07a', hair: '#8a5a2a', hs: 'short', beard: '#8a5a2a', hat: 'feather', hc: '#7a1a2a', c1: '#5a3a7a', c2: GOLD, c3: '#2a2a40', vest: '#c8a040', chat: ['Hmph.', 'Anggur yang bagus...'], lines: ['Cedric, penasihat pertanian raja. Panen tahun ini bagus, berkat lentera yang terjaga.', 'Para petani Lembah Lentera mengirim hasil bumi tiap bulan. Ada yang bilang itu lebih bernilai dari emas.'] });
    sign('Peta Kerajaan', 190, 500, ['Peta besar Kerajaan Aurelia terbentang di meja: ibu kota di tengah, Lembah Lentera di selatan, hutan di sisi barat.', 'Ada tanda lingkaran ungu di bawah Aula Kuno, ditulis tangan: "Sumber bisikan?"']);
    sign('Globe Dunia', 128, 392, ['Globe tua berlapis emas. Sebagian besar benua belum digambar; para pelaut hanya menandai "Di sini, ada naga."']);
    sign('Rak Arsip Kerajaan', 1110, 358, ['Gulungan dan buku titah raja sepanjang tiga generasi. Tertulis di punggung buku: "Pajak Lentera", "Perjanjian Hutan", "Kronik Aula Kuno".']);
    sign('Rak Sejarah', 1110, 616, ['Kronik tentang empat lentera abadi: Aurelius pertama menyalakannya dengan api dari dasar jurang, dan bersumpah menjaganya agar bisikan Abyss tak keluar.']);
    sign('Lambang Kerajaan', MX, 560, ['Mahkota di atas dua lentera bersilang. Mahkota berarti kewajiban, lentera berarti cahaya yang dijaga bersama. Para raja bersumpah di atas lambang ini.']);
    N.forEach(n => { n.sleeps = 0 });
    IN.dyn = N.filter(n => !n.sign).map((n, i) => ({ n, i, get y() { return n.y } }));
    IN.dust = []; for (let i = 0; i < 44; i++) IN.dust.push({ w: i % 4, u: hash(i, 5, 11), s: .02 + hash(i, 6, 11) * .04, ph: hash(i, 7, 11) * 6 });
  };

  IN.tick = function (dt) {
    const T = WORLD.TR; if (T.on) return;
    guard(() => WORLD.wxTick(dt)); walkAll(IN.npcs, dt); guard(() => chatTick(IN.npcs, dt));
    if (T.cool <= 0 && p.y > PH - 34 && Math.abs(p.x - MX) < 52 && p.vy > 8) { WORLD.start('gate', { to: 'kingdom', dx: 0, dy: 1, spawn: [AX, PY + 76] }); msg('Keluar dari istana...') }
  };

  IN.env = function () { };
  IN.drawBack = function () { IN._L = renderList(IN); const py = p.y + 3; for (const o of IN._L) if (o.y <= py) drawObj(o) };
  IN.drawFront = function () {
    const py = p.y + 3; for (const o of IN._L) if (o.y > py) drawObj(o);
    const vw = W / CAM_Z, vh = H / CAM_Z, night = V.night || 0, day = (1 - night) * (1 - V.rain * .55);
    g.save(); g.globalCompositeOperation = 'lighter';
    /* sinar kaca patri (siang) / cahaya bulan (malam) + bercak di lantai */
    const shaft = (wx, c, a) => { g.fillStyle = 'rgba(' + c + ',' + a + ')'; g.beginPath(); g.moveTo(wx - 28, 130); g.lineTo(wx + 28, 130); g.lineTo(wx + 150, 470); g.lineTo(wx + 60, 470); g.closePath(); g.fill(); g.beginPath(); g.ellipse(wx + 105, 474, 62, 20, 0, 0, 7); g.fill() };
    if (day > .02) { [[150, '255,200,120'], [310, '255,170,140'], [970, '170,200,255'], [1130, '170,255,190']].forEach(([wx, c]) => shaft(wx, c, .08 * day)); g.fillStyle = 'rgba(255,230,170,' + .06 * day + ')'; g.beginPath(); g.moveTo(MX - 40, 110); g.lineTo(MX + 40, 110); g.lineTo(MX + 120, 420); g.lineTo(MX - 120, 420); g.closePath(); g.fill() }
    if (night > .05) { const mo = night * (1 - V.rain * .6) * .05; WINX.forEach(wx => shaft(wx, '130,160,255', mo)) }
    g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    if (day > .02 || night > .05) for (const d of IN.dust) {       // debu berkilau dalam sinar
      const u = (t * d.s + d.u) % 1, wx = WINX[d.w], X = wx - 12 + u * 124 + Math.sin(t * .7 + d.ph) * 8, Y = 136 + u * 330 + Math.cos(t * .9 + d.ph) * 4, a = (.25 + .35 * Math.max(0, Math.sin(t * 2 + d.ph))) * (day > .02 ? day : night * .6);
      g.fillStyle = (day > .02 ? 'rgba(255,240,200,' : 'rgba(170,200,255,') + a + ')'; g.fillRect(Math.round(X), Math.round(Y), 1, 1)
    }
    g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const o of IN.objs) {
      if (o.x < camX - 120 || o.x > camX + vw + 120 || o.y < camY - 60 || o.y > camY + vh + 160) continue;
      if (o.glow) lightL(o.x, o.y - 32, 56 + Math.sin(t * 7 + o.x) * 3, '255,200,110', .4);
      if (o.ember) for (let i = 0; i < 6; i++) { const k = (t * .5 + i / 6 + o.x * .01) % 1; g.fillStyle = 'rgba(255,' + (140 + i * 15) + ',60,' + (1 - k) * .9 + ')'; g.fillRect(Math.round(o.x + Math.sin(i * 2.7 + t * 2) * (4 + k * 8)), Math.round(o.y - 48 - k * 38), 1 + (i % 2), 1 + (i % 2)) }
    }
    g.restore();
    for (const o of IN.objs) {
      if (o.x < camX - 120 || o.x > camX + vw + 120 || o.y < camY - 60 || o.y > camY + vh + 160) continue;
      if (o.flame) flameAt(o.flame[0], o.flame[1] + 4, 1);
      if (o.fl) for (const f of o.fl) flameAt(f[0], f[1], 0);
    }
    CHAN.forEach(([a, b]) => { if (a < camX - 80 || a > camX + vw + 80 || b < camY - 260 || b > camY + vh + 80) return; chandelier(a, b) });
    g.save(); g.globalCompositeOperation = 'lighter';
    lightL(MX, 176, 170, '255,225,160', .2 + .06 * Math.sin(t * 2));
    for (let i = 0; i < 12; i++) { const a = t * .5 + i * .52, r = 56 + 6 * Math.sin(t + i), px = MX + Math.cos(a) * r, py = 170 + Math.sin(a) * r * .38 - ((t * 8 + i * 9) % 40); g.fillStyle = 'rgba(255,230,140,' + (.3 + .4 * Math.sin(t * 3 + i)) + ')'; g.fillRect(Math.round(px), Math.round(py), 1, 1) }
    g.restore();
    drawLabels();
    g.fillStyle = 'rgba(60,20,40,.08)'; g.fillRect(camX, camY, vw, vh);
    if (night > .02) { g.fillStyle = 'rgba(8,10,40,' + .22 * night + ')'; g.fillRect(camX, camY, vw, vh) }
    const vg = g.createRadialGradient(camX + vw / 2, camY + vh / 2, Math.min(vw, vh) * .35, camX + vw / 2, camY + vh / 2, Math.max(vw, vh) * .72); vg.addColorStop(0, 'rgba(20,6,10,0)'); vg.addColorStop(1, 'rgba(20,6,10,.3)'); g.fillStyle = vg; g.fillRect(camX, camY, vw, vh);
    guard(drawBubbles(IN.npcs));
  };
})();