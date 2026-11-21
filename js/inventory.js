/* ==========================================================================
   ECHOES OF THE ABYSS - INVENTORY & VILLAGE SHOPS MODULE
   Potions, item drops, Blacksmith Brokk, Alchemist Seraphine, Merchant Zephyr.
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
      const NS = [[640, 90], [640, 250], [640, 380], [640, 520], [640, 740], [640, 850]];
      const SIDE = [[[330, 380], [330, 292]], [[930, 380], [930, 300]], [[640, 520], [800, 520], [800, 600]], [[200, 380], [200, 470]], [[420, 380], [380, 560], [250, 640]], [[1100, 380], [1100, 470]]];
      const PLAZA = { x: 640, y: 380, r: 86 };

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
      const MAINd = dense(MAINST, 4), NSd = dense(NS, 4), SIDEd = SIDE.map(s => dense(s, 4)), LANEd = LANE.map(s => dense(s, 4));
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
        const id = x.createImageData(VW, VH), d = id.data, GD = h2r('#4a7a34'), GL = h2r('#7aa848'), GW = h2r('#9aa040');
        for (let yy = 0; yy < VH; yy++) for (let xx = 0; xx < VW; xx++) { const v = vnoise(xx / 70, yy / 70, 4) * .6 + vnoise(xx / 14, yy / 14, 5) * .4, wm = vnoise(xx / 160, yy / 160, 6), sp = hash(xx, yy, 10); let c = mixc(GD, GL, v); c = mixc(c, GW, wm * .25); if (sp < .05) c = mixc(c, [10, 40, 20], .28); else if (sp > .965) c = mixc(c, [230, 240, 150], .2); const o = (yy * VW + xx) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255 }
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

        const RC = { side: ['#a08a64', '#8a7650', '#b8a47c'], main: ['#9a9488', '#85807a', '#b4aea0'] };
        const unit = (dn, i) => { const p = dn[Math.max(0, i - 1)], q = dn[Math.min(dn.length - 1, i + 1)], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l] };
        const roadOutline = (dn, w) => dn.forEach(([a, b]) => disc(x, '#4a463e', a, b, w / 2 + 3));
        const roadFill = (dn, w, col) => {
          dn.forEach(([a, b]) => disc(x, col[0], a, b, w / 2 + 1)); const rows = Math.max(2, Math.floor((w - 4) / 6));
          dn.forEach(([a, b], i) => { if (i % 2) return; const [ux, uy] = unit(dn, i), nx = -uy, ny = ux; for (let r = 0; r < rows; r++) { const off = (r - (rows - 1) / 2) * 6, sh = ((i / 2 + r) % 2) * 4, px = a + nx * off + ux * sh, py = b + ny * off + uy * sh; rc(x, col[1], px - 2, py - 1, 5, 3); rc(x, col[2], px - 2, py - 1, 4, 2) } })
        };
        const cobble = (dn, w, col, fo) => { roadOutline(fo ? dn.filter(fo) : dn, w); roadFill(dn, w, col) };
        const RDS = [...SIDEd.map(d => [d, 22, RC.side]), ...LANEd.map(d => [d, 30, RC.main]), [NSd, 44, RC.main], [MAINd, 46, RC.main]];
        RDS.forEach(([d, w]) => roadOutline(d, w)); RDS.forEach(([d, w, c]) => roadFill(d, w, c));
        RDS.forEach(([d, w]) => d.forEach(([a, b], i) => { if (i % 2) return; const [ux, uy] = unit(d, i), nx = -uy, ny = ux;[-1, 1].forEach(sd => { const px = a + nx * sd * (w / 2 + 1), py = b + ny * sd * (w / 2 + 1); if (RDS.some(r => r[0] !== d && distPoly(px, py, r[0]) < r[1] / 2 + 1)) return; rc(x, '#5e5a50', px - 2, py - 1, 4, 3); rc(x, '#a29e92', px - 2, py - 1, 4, 1) }) }));
        ell(x, '#4a463e', PLAZA.x, PLAZA.y, PLAZA.r + 3, PLAZA.r * .7 + 3); ell(x, '#9a9488', PLAZA.x, PLAZA.y, PLAZA.r, PLAZA.r * .7);
        for (let i = 0; i < 360; i++) { const an = rng() * TAU, dd = Math.sqrt(rng()) * PLAZA.r * .97; rc(x, rng() < .5 ? '#85807a' : '#b8b2a4', PLAZA.x + Math.cos(an) * dd, PLAZA.y + Math.sin(an) * dd * .7, 5, 3) }
        ell(x, 'rgba(255,255,255,.06)', PLAZA.x, PLAZA.y, PLAZA.r * .55, PLAZA.r * .38); ell(x, '#7a7468', PLAZA.x, PLAZA.y, 40, 28);

        for (let yy = 626; yy < 706; yy += 4) { rc(x, '#4a301a', 196, yy, 32, 4); rc(x, yy % 8 ? '#9a7444' : '#8a6440', 197, yy, 30, 3) } rc(x, '#4a301a', 194, 626, 2, 80); rc(x, '#4a301a', 228, 626, 2, 80);

        const walls = V.walls = [[-20, -20, VW + 40, 44], [-20, VH - 42, VW + 40, 60], [-20, -20, 48, 344], [-20, 440, 48, VH], [VW - 28, -20, 48, 344], [VW - 28, 440, 48, VH], [VW - 28, 320, 48, 124]];
        const objs = V.objs = [], spr = (s, a, b, solid, extra) => { objs.push({ x: Math.round(a), y: Math.round(b), img: s.img, ox: s.ox, oy: s.oy, oh: s.img.height, ...extra }); if (solid) walls.push(solid) };
        const place = (kind, a, b, w, o) => { const s = house(w, o); spr(s, a, b, [a - w / 2 + 2, b - 30, w - 4, 30], { lamp: s.lamp.map(l => [a + l[0], b + l[1]]), chim: s.chim ? [a + s.chim[0], b + s.chim[1]] : null }); BLD.push({ x: a, y: b, w, kind }); return s };

        /* ===== BENTENG (rapi): tembok bergigi, pilaster, panji, menara beratap kerucut, gerbang ===== */
        try {
          const SH0 = '#9a968a', SHL = '#b9b5a8', SHD = '#7e7a70', MO = 'rgba(60,56,48,.32)', BAN = ['#2f5aa8', '#a8283e', '#3a7a5a', '#7a3a8a'], RF = ['#3a5a9a', '#a8483a', '#3a7a5a', '#7a3a8a'];
          const R = (c, a, b, w, h) => rc(x, c, Math.round(a), Math.round(b), Math.round(w), Math.round(h));
          const mortar = (x0, y0, w, h, per) => { for (let j = 0; j * 6 < h; j++) { R(MO, x0, y0 + j * 6 + 5, w, 1); for (let k = (j % 2) * per / 2; k < w; k += per) R(MO, x0 + k, y0 + j * 6, 1, 6) } };
          const wallH = (y0, shadow) => {
            if (shadow) R('rgba(0,0,0,.26)', 0, y0 + 42, VW, 7);
            R(OLC, 0, y0, VW, 42); R(SHD, 0, y0 + 7, VW, 5); R(SH0, 0, y0 + 12, VW, 28); mortar(0, y0 + 12, VW, 28, 12); R(SHL, 0, y0 + 12, VW, 1); R(SHD, 0, y0 + 34, VW, 6); R('#6a665c', 0, y0 + 34, VW, 1);
            for (let k = 0; k < VW; k += 20) { R(OLC, k, y0, 14, 12); R(SHL, k + 1, y0 + 1, 12, 10); R('#cfcbbd', k + 1, y0 + 1, 12, 2); R(SHD, k + 10, y0 + 3, 3, 8) }
            for (let k = 120; k < VW; k += 120) { R(OLC, k - 8, y0 + 7, 16, 35); R('#aaa69a', k - 7, y0 + 8, 14, 33); R(SHL, k - 7, y0 + 8, 4, 33); R(SHD, k + 3, y0 + 8, 4, 33); R('#cfcbbd', k - 7, y0 + 8, 14, 2) }
            for (let k = 60, n = 0; k < VW; k += 120, n++) { const c = BAN[n % 4]; R(OLC, k - 6, y0 + 14, 12, 24); R(c, k - 5, y0 + 15, 10, 19); R('rgba(255,255,255,.18)', k - 5, y0 + 15, 3, 19); R('#d8b84a', k - 5, y0 + 15, 10, 1); R('#d8b84a', k - 2, y0 + 21, 4, 5); R(c, k - 5, y0 + 34, 4, 3); R(c, k + 1, y0 + 34, 4, 3) }
          };
          const wallV = (x0, ya, yb, dir) => {
            const h = yb - ya; R('rgba(0,0,0,.24)', dir > 0 ? x0 + 28 : x0 - 7, ya, 7, h);
            R(OLC, x0, ya, 28, h); R(SH0, x0 + 1, ya, 26, h); mortar(x0 + 1, ya, 26, h, 13); R(SHD, x0 + 8, ya, 12, h); R('#aaa69a', x0 + 9, ya, 10, h);
            for (let k = ya + 4; k < yb - 14; k += 20) [x0, x0 + 19].forEach(mx => { R(OLC, mx, k, 9, 14); R(SHL, mx + 1, k + 1, 7, 12); R('#cfcbbd', mx + 1, k + 1, 7, 2); R(SHD, mx + 1, k + 9, 7, 3) })
          };
          wallH(0, 1); wallH(VH - 42, 0);
          wallV(0, 40, 324, 1); wallV(0, 440, VH - 40, 1); wallV(VW - 28, 40, 324, -1); wallV(VW - 28, 440, VH - 40, -1);
          [0, VW - 28].forEach(gx => { R(SHL, gx, 320, 28, 5); R(SHD, gx, 325, 28, 2); R(SHL, gx, 437, 28, 5); R(SHD, gx, 435, 28, 2) });
          (function () { const gx = VW - 28; R(OLC, gx, 327, 28, 108); for (let j = 0; j < 7; j++) { R(j % 2 ? '#6a4220' : '#5a3418', gx + 1, 328 + j * 15, 26, 14); R('rgba(255,255,255,.1)', gx + 1, 328 + j * 15, 26, 1) } [6, 19].forEach(q => { R('#2a2a30', gx + q, 328, 3, 105); for (let j = 0; j < 7; j++) R('#b18b59', gx + q + 1, 334 + j * 15, 1, 1) }); R(OLC, gx + 9, 374, 10, 14); R('#c39a5d', gx + 10, 375, 8, 12); R('#2b2620', gx + 13, 379, 2, 4) })();
          const tw = (col, roof) => {
            const W = 52, H = 72, [c, q] = mkCv(W, H), cx = 26, Q = (cc, a, b, w, h) => rc(q, cc, a, b, w, h);
            Q('rgba(0,0,0,.28)', 3, H - 5, 46, 4);
            Q(OLC, 5, 32, 42, H - 34); Q('#9a968a', 6, 33, 40, H - 37); Q('#b9b5a8', 6, 33, 9, H - 37); Q('#aaa69a', 15, 33, 8, H - 37); Q('#7e7a70', 32, 33, 8, H - 37); Q('#6e6a60', 40, 33, 6, H - 37);
            for (let j = 0; j < 6; j++) { Q('rgba(60,56,48,.32)', 6, 38 + j * 6, 40, 1); for (let k = (j % 2) * 6; k < 40; k += 12) Q('rgba(60,56,48,.32)', 6 + k, 33 + j * 6, 1, 5) }
            Q('#6e6a60', 5, H - 10, 42, 6); Q('#8a867a', 5, H - 10, 42, 1);
            Q(col, 6, 54, 40, 5); Q('rgba(255,255,255,.2)', 6, 54, 40, 1); Q('#d8b84a', 6, 59, 40, 1);
            Q(OLC, 24, 41, 5, 11); Q('#ffd870', 25, 42, 3, 9);
            Q('#7e7a70', 4, 32, 44, 3); Q('#b9b5a8', 4, 32, 44, 1);
            const rf = h2r(roof), rL = rgbS(mixc(rf, [255, 220, 170], .25)), rD = rgbS(mixc(rf, [20, 10, 20], .35));
            for (let j = 0; j < 26; j++) { const wd = Math.round(2 + j * 1.8); Q(OLC, cx - Math.round(wd / 2) - 1, 8 + j, wd + 2, 1) }
            for (let j = 0; j < 26; j++) { const wd = Math.round(2 + j * 1.8), x0 = cx - Math.round(wd / 2); Q(roof, x0, 8 + j, wd, 1); Q(rL, x0, 8 + j, Math.round(wd / 2), 1); Q(rD, cx, 8 + j, Math.round(wd / 2), 1); if (j % 4 === 3) Q(rD, x0, 8 + j, wd, 1) }
            Q('rgba(0,0,0,.3)', 2, 34, 48, 2);
            Q(OLC, 25, 0, 3, 10); Q('#5a4630', 26, 0, 1, 10); Q(OLC, 27, 0, 10, 6); Q(col, 28, 1, 8, 4);
            return { img: c, ox: cx, oy: H - 2 };
          };
          [[25, 72, 0], [VW - 25, 72, 1], [25, VH - 4, 2], [VW - 25, VH - 4, 3], [25, 304, 1], [25, 502, 2], [VW - 25, 304, 0], [VW - 25, 502, 3]].forEach(([a, b, i]) => spr(tw(BAN[i], RF[i]), a, b, [a - 21, b - 34, 42, 34], { lamp: [[a, b - 23]] }));
          [[VW - 46, 332], [VW - 46, 432]].forEach(([a, b]) => spr(art.lantern(), a, b, [a - 3, b - 5, 6, 5], { glow: 1 }));
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
        [1460, 632], [1600, 636], [1690, 632], [1735, 730], [1690, 790], [1415, 646], [1380, 520]].forEach(([a, b]) => spr(art.lantern(), a, b, [a - 3, b - 5, 6, 5], { glow: 1 }));

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
            if (px > 150 && px < 280 && py > 580 && py < 750) return true;
            if (Math.hypot(px - PLAZA.x, (py - PLAZA.y) * 1.4) < PLAZA.r + 16 + m) return true;
            return false;
          };
          const inR = (px, py, h, m) => px > h.x - h.w / 2 - m && px < h.x + h.w / 2 + m && py > h.y - 34 - m && py < h.y + 8 + m;
          let placed = 0;
          for (let t = 0; t < 30000 && placed < 120; t++) {
            const tw = placed % 10 === 6, w = tw ? 40 : 60 + ((h2() * 40) | 0), a = Math.round(40 + h2() * (VW - 80)), b = Math.round(130 + h2() * (VH - 160));
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
            cobble(stub.filter(p => !ROADS.some(([rd, hw]) => distPoly(p[0], p[1], rd) < hw - 2)), 18, RC.side, p => !ROADS.some(([rd, hw]) => distPoly(p[0], p[1], rd) < hw + 12));
            if (tw) { const s = fTower(pk(['#3a5a9a', '#7a3a8a', '#2f6a7a', '#8a3a3a']), pk(FLAG)); spr(s, a, b, [a - 16, b - 14, 32, 14], { lamp: s.lamp.map(l => [a + l[0], b + l[1]]) }); BLD.push({ x: a, y: b, w: 40, kind: 'tower' }) }
            else {
              place('house', a, b, w, { wall: pick(WALLC), trim: pick(TRIMC), roof: pk(ROOFF), thatch: h2() < .25, flag: h2() < .22 ? pk(FLAG) : 0, shut: pk(SHUT), fl: h2() < .45 ? 2 : 1, chimney: h2() < .65 ? 1 : 0, wins: pick(WINS) });
              const side = h2() < .5 ? -1 : 1, k = h2(), px = a + side * (w / 2 + 12), fx = a - side * (w / 2 + 24);
              if (k < .25) spr(art.barrel(), px, b, [px - 6, b - 4, 12, 5]); else if (k < .45) spr(art.crate(), px, b, [px - 7, b - 4, 14, 5]); else if (k < .75) spr(art.flowerbed(placed + 60, 40, 22), fx, b + 2, null);
            }
            placed++;
          }
        } catch (e) { console.warn('[padat-desa]', e) }
        const OAK = [], PINE = []; for (let i = 0; i < 5; i++) OAK.push(art.oak(i + 20, .85 + (i % 3) * .12)); for (let i = 0; i < 3; i++) PINE.push(art.pine(i + 20, .9));
        const occ = []; const free = (a, b, m) => { if (a < 52 || a > VW - 52 || b < 62 || b > VH - 54) return false; if (distPoly(a, b, MAINd) < 32 + m || distPoly(a, b, NSd) < 30 + m || SIDEd.some(s => distPoly(a, b, s) < 20 + m) || LANEd.some(s => distPoly(a, b, s) < 26 + m)) return false; if (Math.hypot(a - PLAZA.x, (b - PLAZA.y) * 1.4) < PLAZA.r + m) return false; if (((a - POND.x) / (POND.rx + 22 + m)) ** 2 + ((b - POND.y) / (POND.ry + 18 + m)) ** 2 < 1) return false; if (((a - POND2.x) / (POND2.rx + 22 + m)) ** 2 + ((b - POND2.y) / (POND2.ry + 18 + m)) ** 2 < 1) return false; if (a > 1330 && a < 1500 && b > 626 && b < 740) return false; if (a > 1470 && a < 1670 && b > 400 && b < 520) return false; if (a > FARM.x - 24 - m && b > FARM.y - 24 - m && a < FARM.x + FARM.w + 24 && b < FARM.y + FARM.h + 30) return false; if (BLD.some(h => Math.abs(a - h.x) < h.w / 2 + 18 + m && b > h.y - 78 - m && b < h.y + 30 + m)) return false; if (a < 120 && Math.abs(b - 382) < 70) return false; if (a > 160 && a < 270 && b > 590 && b < 745) return false; if (objs.some(o => !o.fountain && Math.abs(o.x - a) < 28 + m && Math.abs(o.y - b) < 20 + m)) return false; return true };
        V.free = free;
        for (let gy = 28; gy < VH - 10; gy += 30) for (let gx = 10; gx < VW - 10; gx += 30) { const a = gx + rng() * 26, b = gy + rng() * 26, edge = a < 70 || a > VW - 60 || b < 80 || b > VH - 60, dens = edge ? .7 : .07; if (rng() > dens || !free(a, b, 8) || occ.some(q => Math.hypot(q[0] - a, q[1] - b) < 30)) continue; occ.push([a, b]); ell(x, 'rgba(0,12,4,.22)', a + 4, b - 2, 16, 7); const k = rng(), s = k < .65 ? OAK[(k * 100 | 0) % 5] : PINE[(k * 100 | 0) % 3]; spr(s, a, b + 4, [a - 4, b - 1, 8, 5]) }

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
        mkN({ n: 'Lio, Penyair Keliling', x: PLAZA.x - 62, y: PLAZA.y + 46, sit: 1, fc: 1, sk: '#e0b090', hair: '#a8622c', hs: 'short', hat: 'feather', hc: '#3a6a8a', c1: '#3a6a8a', c2: '#e8d890', c3: '#2a2a40', prop: 'lute', lines: ['Dengarlah, dengarlah! Kisah pahlawan yang keluar dari kegelapan... masih kurang bait terakhirnya.', 'Aku menggubah lagu tentang Morvath si Banteng Abyss. Sayangnya aku belum pernah melihatnya, dan tak mau melihatnya.', 'Kalau kau mengalahkannya, datanglah ke sini. Kau akan jadi bait terakhirku!'] });
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
          if (!n.path) continue; const talk = dlg && dlg.n === n; if (talk) { n.mv = 0; continue }
          const tg = n.path[n.pi], dx = tg[0] - n.x, dy = tg[1] - n.y, d = Math.hypot(dx, dy); if (d < 3) { n.pi = (n.pi + 1) % n.path.length; n.mv = 0; continue } n.mv = 1; const sp = 48; n.x += dx / d * sp * dt; n.y += dy / d * sp * dt; n.fc = dx > 0 ? 1 : -1
        }

        for (const c of V.crit) {
          c.tm -= dt; const d = Math.hypot(c.x - p.x, c.y - p.y);
          if (c.st === 0) { if (c.tm <= 0) { c.tm = 1 + Math.random() * 2.5; if (Math.random() < .5) { c.st = 1; const a = Math.random() * TAU, sp = c.kind === 'dog' ? 22 : 18; c.vx = Math.cos(a) * sp; c.vy = Math.sin(a) * sp * .7; c.fc = c.vx > 0 ? 1 : -1; c.tm = .6 + Math.random() } } if (d < 40 && c.kind === 'chicken') { c.st = 1; c.tm = .5; const a = Math.atan2(c.y - p.y, c.x - p.x); c.vx = Math.cos(a) * 50; c.vy = Math.sin(a) * 40; c.fc = c.vx > 0 ? 1 : -1 } }
          else { const nx = c.x + c.vx * dt, ny = c.y + c.vy * dt; if (!blk(nx, ny, 3)) { c.x = nx; c.y = ny } else { c.vx *= -1; c.vy *= -1 } if (c.tm <= 0) { c.st = 0; c.tm = 1 + Math.random() * 2 } }
        }
        if (T.cool <= 0 && p.x < 26 && Math.abs(p.y - 382) < 42 && p.vx < -8) { const Fo = WORLD.AREAS.forest; WORLD.start('gate', { to: 'forest', dx: -1, spawn: [Fo.w - 96, 348] }); msg('Kembali ke Hutan Bisikan...') }
      };

      function drawObj(o) {
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
          const cy = Y - 66 + Math.sin(t * 2) * 2.5; g.save(); g.globalCompositeOperation = 'lighter'; const gq = g.createRadialGradient(X, cy, 2, X, cy, 46); gq.addColorStop(0, 'rgba(120,230,255,' + (.42 + .1 * Math.sin(t * 3)) + ')'); gq.addColorStop(1, 'rgba(90,170,255,0)'); g.fillStyle = gq; g.fillRect(X - 46, cy - 46, 92, 92); g.restore();
          g.fillStyle = OLC; g.beginPath(); g.moveTo(X, cy - 11); g.lineTo(X + 7, cy); g.lineTo(X, cy + 11); g.lineTo(X - 7, cy); g.fill(); g.fillStyle = '#7ae0ff'; g.beginPath(); g.moveTo(X, cy - 9); g.lineTo(X + 5, cy); g.lineTo(X, cy + 9); g.lineTo(X - 5, cy); g.fill(); g.fillStyle = '#d8fbff'; g.beginPath(); g.moveTo(X, cy - 9); g.lineTo(X - 5, cy); g.lineTo(X, cy + 2); g.fill();
          for (let i = 0; i < 6; i++) { const a = t * 1.4 + i * 1.05, r = 12 + 3 * Math.sin(t * 2 + i); g.fillStyle = 'rgba(210,250,255,' + (.5 + .5 * Math.sin(t * 5 + i)) + ')'; g.fillRect(Math.round(X + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * .5), 1, 1) }
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

        g.font = '8px monospace'; for (const n of NP) { const d = dist(n, p); if (d < 90) { txt(n.n.split(',')[0], n.x, n.y - (n.kid ? 24 : 28), '#ffe9a8', 'center'); if (d < (n.rng || 36) && !dlg) txt('[G] ' + (n.shop ? 'Dagang' : 'Bicara'), n.x, n.y - (n.kid ? 34 : 38), '#fff', 'center') } if (n.fresh && !dlg) { g.fillStyle = '#ffd34d'; const by = Math.sin(t * 4); g.fillRect(Math.round(n.x) - 1, Math.round(n.y - 38 + by), 3, 6); g.fillRect(Math.round(n.x) - 1, Math.round(n.y - 30 + by), 3, 2) } }

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
