/* ==========================================================================
   ECHOES OF THE ABYSS - LOBBY & CORRIDOR MODULE
   Overworld engine core, WORLD state, pixel art library, Lobby gates,
   and Dungeon Corridor passage with resting camp and NPCs.
   ========================================================================== */
/* =====================================================================
   TAMBAHAN: KELUAR DUNGEON -> HUTAN BISIKAN
   ---------------------------------------------------------------------
   Script ini ditambahkan di akhir index.html tanpa mengubah kode game utama.
   - Pintu di dinding selatan lobby kini bisa dipakai keluar menuju Hutan Bisikan.
   - Di Hutan Bisikan: jalur panjang, sungai + jembatan, perkemahan, mata air suci,
     tanaman & peti harta. Pintu tebing di utara hutan membawa pahlawan kembali ke lobby.
   Area luar ruangan memakai mode "zona aman" (lobby=true) supaya sistem lama tetap bekerja.
   ===================================================================== */
(function () {
  'use strict';
  const TAU = Math.PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
  const E = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u) };
  const mkRng = seed => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296 };
  function mkCv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x] }
  const rc = (x, col, a, b, w, h) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))) };
  function disc(x, col, cx, cy, r) { cx = Math.round(cx); cy = Math.round(cy); x.fillStyle = col; for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)) + .5); x.fillRect(cx - w, cy + dy, w * 2 + 1, 1) } }
  function ell(x, col, cx, cy, rx, ry) { cx = Math.round(cx); cy = Math.round(cy); x.fillStyle = col; for (let dy = -ry; dy <= ry; dy++) { const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy / ry) * (dy / ry))) + .5); x.fillRect(cx - w, cy + dy, w * 2 + 1, 1) } }
  function hash(ix, iy, seed) { let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }
  function vnoise(x, y, seed) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return lerp(lerp(hash(ix, iy, seed), hash(ix + 1, iy, seed), sx), lerp(hash(ix, iy + 1, seed), hash(ix + 1, iy + 1, seed), sx), sy) }
  const h2r = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  // jalur: titik kontrol â†’ polyline rapat (Catmull-Rom)
  function dense(pts, step) {
    const out = []; for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(2, Math.ceil(L / step));
      for (let k = 0; k < n; k++) { const u = k / n, u2 = u * u, u3 = u2 * u; out.push([.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3), .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]) }
    } out.push(pts[pts.length - 1].slice()); return out
  }
  function distPoly(px, py, dn) { let best = 1e9; for (let i = 0; i < dn.length; i++) { const d = Math.hypot(px - dn[i][0], py - dn[i][1]); if (d < best) best = d } return best }

  /* ---------- gambar orang (dipakai semua NPC luar ruangan) ---------- */
  const OUT = '#120e18';
  /* ikon emosi melayang di atas kepala: kaget "!", senang hati, sedih "...", marah urat, bingung "?" (takut cukup keringat dingin) */
  function emoIcon(em, X, Y, ea, left) {
    let al = Math.min(1, ea / .1, left / .35); if (!(al > 0)) return;
    const pxl = (c, a, b) => { g.fillStyle = c; g.fillRect(Math.round(X + a), Math.round(Y + b), 1, 1) };
    const pat = (rows, ox, oy, col) => { for (let pass = 0; pass < 2; pass++) rows.forEach((s, ry) => { for (let rx = 0; rx < s.length; rx++) if (s[rx] === 'X') pxl(pass ? col : 'rgba(18,10,24,.6)', ox + rx + (pass ? 0 : 1), oy + ry + (pass ? 0 : 1)) }) };
    g.save();
    if (em === 'kaget') { if (ea < 1.3) { g.globalAlpha = al; pat(['XX', 'XX', 'XX', 'XX', '..', 'XX'], -1, -8 - Math.round(Math.sin(Math.min(1, ea / .25) * Math.PI) * 2), '#ff5a3a') } }
    else if (em === 'senang') { const k = ea % 2.6; if (k < 1.5) { g.globalAlpha = al * Math.min(1, (1.5 - k) / .4); pat(['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..'], -2, -7 - Math.round(k * 3), '#ff6a9a') } }
    else if (em === 'sedih') { g.globalAlpha = al; const nd = Math.floor(ea * 1.8) % 4; for (let j = 0; j < nd; j++) pat(['XX', 'XX'], -5 + j * 4, -6, '#aebfff') }
    else if (em === 'marah') { g.globalAlpha = al; pat(Math.floor(t * 6) % 2 ? ['XX...XX', 'X.....X', '.......', '.......', '.......', 'X.....X', 'XX...XX'] : ['XX.XX', 'X...X', '.....', 'X...X', 'XX.XX'], Math.floor(t * 6) % 2 ? 3 : 4, Math.floor(t * 6) % 2 ? -9 : -8, '#ff3a3a') }
    else if (em === 'bingung') { g.globalAlpha = al; pat(['.XXX.', 'X...X', '....X', '...X.', '..X..', '.....', '..X..'], -2, -9 + Math.round(Math.sin(t * 5)), '#ffe28a') }
    g.restore();
  }
  function person(n, i) {
    const x = Math.round(n.x), y = Math.round(n.y), tk = t + i * 1.7, talk = dlg && dlg.n === n, near = dist(n, p) < 90;
    // [ekspresi] emo = senang | kaget | sedih | marah | takut | bingung (diatur modul Desa Hidup lewat n._em / n._emT / n._emA)
    const emo = n._emT > 0 ? (n._em || '') : '', emA = n._emA || 0;
    const emJx = emo === 'takut' ? (Math.sin(t * 46 + i * 2) > .35 ? 1 : Math.sin(t * 46 + i * 2) < -.35 ? -1 : 0) : emo === 'marah' ? (Math.sin(t * 24 + i) > .6 ? 1 : 0) : n._shiver ? (Math.sin(t * 38 + i * 2) > .35 ? 1 : 0) : 0;
    const emBt = emo === 'kaget' && emA < .45 ? -Math.round(2.4 * Math.sin(Math.PI * emA / .45)) : emo === 'senang' ? -Math.round(Math.max(0, Math.sin(t * 9 + i)) * 1.2) : n._droop ? Math.round((Math.sin(t * 1.3 + i) + 1) * 1.3) : 0;
    // [animasi-npc] kecepatan, fase langkah, belok mulus, kedip tak beraturan
    const spd = n.spd || 0, wk = Math.min(1, spd / 22), ph = n._ph || 0, moving = spd > 5, mv = moving, dts = Math.min(.05, Math.max(0, t - (n._ft === undefined ? t : n._ft))); n._ft = t;
    n._nt = near && !moving ? (n._nt || 0) + dts : 0;
    const tf = talk || n._nt > .35 ? (p.x < n.x - 4 ? -1 : 1) : (n.fc || 1);
    n._fv = n._fv === undefined ? tf : n._fv + (tf - n._fv) * Math.min(1, dts * 13);
    const fc = Math.abs(n._fv) < .15 ? (n._fv < 0 ? -.15 : .15) : n._fv;
    const kk = n.kid ? 1.25 : 1, breath = (Math.sin(tk * 1.8) + 1) / 2 * .9, sw0 = Math.sin(ph) * wk;
    const bo = Math.round(breath * (1 - wk)) + Math.round(Math.abs(sw0) * 1.4 * kk);
    const bph = (tk + Math.sin(tk * .7) * 1.5) % 3.7, blink = n._closed || bph < .12 || (bph > .3 && bph < .4 && Math.sin(tk * .31) > .6);
    const gl = !talk && wk < .1 && !n.sit && (tk % 7.3) > 5.2 && (tk % 7.3) < 6.3 ? 1 : 0, hx = Math.round(wk * 1.2) - gl;
    const sk = n.sk || '#e0b090', hair = n.hair || '#4a2a18', c1 = n.c1 || '#7a5a3a', c2 = n.c2 || '#d8b878', c3 = n.c3 || '#3a2e24', SH = 'rgba(0,0,0,.25)', HL = 'rgba(255,255,255,.16)', Q = [];
    const r = (a, b, w, h, c, o) => Q.push([a, b, w, h, c, o !== 0]), fl = () => { g.fillStyle = OUT; Q.forEach(q => q[5] && g.fillRect(q[0] - 1, q[1] - 1, q[2] + 2, q[3] + 2)); Q.forEach(q => { g.fillStyle = q[4]; g.fillRect(q[0], q[1], q[2], q[3]) }); Q.length = 0 };
    const rh = (a, b, w, h, c, o) => r(a + hx, b, w, h, c, o);
    g.save(); g.translate(x + emJx, y); const kid = n.kid; if (kid) g.scale(.8, .8);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, 8, 9 - Math.abs(sw0) * .9, 3 - Math.abs(sw0) * .3, 0, 0, 7); g.fill(); g.scale(fc, 1);
    const sw = sw0, lf = Math.round(Math.max(0, sw) * 3), rf = Math.round(Math.max(0, -sw) * 3), lx = Math.round(Math.cos(ph) * 1.4 * wk), by = n.sit ? 4 : 0;
    // belakang: tas / tongkat panjang
    if (n.prop == 'staff') { r(-11, -24, 2, 32, '#7a5230'); r(-12, -27, 4, 4, n.pc || '#8fe8ff') }
    if (n.prop == 'spear') { r(-11, -26, 2, 34, '#9a7a4a'); r(-12, -31, 4, 6, '#cfd6e2') }
    if (n.prop == 'pitchfork') { r(-11, -18, 2, 26, '#8a6a3a'); r(-13, -22, 6, 1, '#c8ccd6'); r(-13, -22, 1, 5, '#c8ccd6'); r(-10, -22, 1, 5, '#c8ccd6'); r(-7, -22, 1, 5, '#c8ccd6') }
    if (n.prop == 'broom') { r(-11, -14, 2, 22, '#8a6a3a'); r(-13, 6, 6, 4, '#c9a95a') }
    if (n.prop == 'pack') { r(-12, -10, 7, 12, '#7a5230'); r(-12, -11, 7, 2, '#a8762f', 0); r(-11, -3, 5, 2, '#4a3020', 0) }
    if (n.prop == 'basket') { r(-12, -4, 7, 7, '#b88a4a'); r(-12, -4, 7, 1, '#d8aa66', 0); r(-11, -6, 5, 2, '#e8d8a0', 0) }
    // kaki
    if (n.sit) { r(-5, 2, 10, 4, c3); r(-7, 4, 4, 3, '#241a14'); r(3, 4, 4, 3, '#241a14') }
    else if (n.robe) { r(-7, 2, 14, 7, c1); r(-7, 8, 14, 1, c2, 0); r(-5, 3, 3, 5, SH, 0) }
    else { r(-5, 0, 4, 8 - lf, c3); r(1, 0, 4, 8 - rf, c3); r(-6 + lx, 6 - lf, 5, 3, '#241a14'); r(1 - lx, 6 - rf, 5, 3, '#241a14'); r(-3, 3, 1, 4, SH, 0) }
    g.translate(0, by); const bt = -bo + emBt;
    // badan
    g.save(); g.translate(0, bt);
    r(-6, -10, 12, 13, c1); r(3, -9, 3, 11, SH, 0); r(-5, -9, 2, 9, HL, 0);
    if (n.apron) { r(-4, -8, 8, 11, n.apron); r(-4, -8, 8, 1, 'rgba(255,255,255,.3)', 0); r(-4, 2, 8, 1, 'rgba(0,0,0,.2)', 0) }
    if (n.armor) { r(-6, -10, 12, 8, '#8a909e'); r(-5, -10, 3, 6, '#bcc2cf', 0); r(4, -10, 2, 7, '#5a5f6c', 0); r(-1, -9, 1, 6, '#6a6f7c', 0); r(-8, -11, 4, 4, '#9aa0ae'); r(4, -11, 4, 4, '#9aa0ae') }
    if (n.vest) { r(-6, -10, 3, 13, n.vest); r(3, -10, 3, 13, n.vest) }
    r(-6, 0, 12, 2, c2); r(-1, 0, 2, 2, '#f4e2a8', 0);
    // lengan belakang & depan
    const arm = n.arm || 0, aw = sw * 2.5 + (1 - wk) * Math.sin(tk * 1.6) * .6, a = Math.round(aw), ta = talk ? Math.round(Math.max(0, Math.sin(t * 4.3)) * 3) : 0, hk = (tk * 1.1) % 1, hl = n.prop == 'hammer' && !talk ? Math.round(hk < .8 ? hk / .8 * 3 : (1 - (hk - .8) / .2) * 3) : 0;
    if (n._act === 'stretch') { r(-9, -23, 3, 14, c1); r(-9, -26, 3, 3, sk) } else { r(-9, -9, 3, 8 + a, c1); r(-9, -1 + a, 3, 3, sk) }
    const ac = n._act, bob = Math.round(Math.sin(t * 3 + i) * 2);
    if (ac === 'warm') { r(5, -9, 7, 3, c1); r(12, -9 + Math.round(Math.sin(t * 5 + i)), 3, 3, sk); r(9, -6, 3, 3, sk); r(13, -10, 2, 1, 'rgba(255,170,80,.7)', 0) }   // tangan terulur ke api
    else if (ac === 'feed') { r(5, -9, 7, 3, c1); r(12, -9, 3, 3, sk); r(12, -8, 5, 1, '#6a4424'); r(16, -7, 5, 1, '#6a4424'); r(20, -6, 4, 1, '#6a4424'); r(23, -6, 2, 1, '#ff8a2a', 0) }   // ranting kayu
    else if (ac === 'tend') { r(5, -9, 7, 3, c1); r(12, -8 + bob, 3, 3, sk); r(13, -11 + bob, 2, 3, '#5ad06a', 0) }
    else if (ac === 'stretch') { r(5, -23, 3, 14, c1); r(5, -26, 3, 3, sk) }
    else if (ac === 'shiver') { r(5, -9, 3, 4, c1); r(-5, -6, 11, 3, c1); r(4, -6, 3, 3, sk) }
    else if (ac === 'drink') { r(5, -9, 3, 3, c1); r(6, -13, 3, 5, c1); r(7, -15, 3, 3, sk); r(10, -17, 5, 5, '#e8e4d8'); r(11, -16, 3, 1, '#c8843c', 0) }
    else if (n.prop == 'hammer') { r(7, -10, 3, 7 - hl, c1); r(7, -3 - hl, 3, 3, sk); r(7, -14 - hl, 2, 12, '#5a3a22'); r(5, -17 - hl, 8, 5, '#6a6f7c'); r(5, -17 - hl, 8, 1, '#bcc2cf', 0) }
    else if (n.prop == 'lute') { r(5, -8, 3, 6, c1); r(7, -4 + Math.round(Math.sin(tk * 7)), 3, 3, sk); r(7, -9, 9, 8, '#a8622c'); r(8, -8, 7, 6, '#c8843c'); r(11, -6, 2, 2, '#2a1a10', 0); r(15, -14, 2, 8, '#6a3a1c'); r(14, -16, 4, 3, '#8a5a2c') }
    else if (n.prop == 'rod') { r(5, -10, 3, 6, c1); r(7, -5, 3, 3, sk); r(8, -22, 1, 18, '#8a6a3a'); r(9, -22, 12, 1, '#8a6a3a') }
    else if (n.prop == 'bottle') { r(5, -9, 3, 5, c1); r(7, -5, 3, 3, sk); r(8, -9, 4, 6, n.pc || '#5ad06a'); r(9, -11, 2, 2, '#c8ccd6'); r(9, -8, 2, 2, 'rgba(255,255,255,.5)', 0) }
    else if (n.prop == 'scroll') { r(5, -9, 3, 6, c1); r(7, -4, 3, 3, sk); r(7, -9, 6, 7, '#e8dcc0'); r(7, -9, 6, 1, '#b8a070', 0); r(8, -6, 4, 1, '#8a7a50', 0); r(8, -4, 3, 1, '#8a7a50', 0) }
    else if (n.prop == 'staff' || n.prop == 'spear' || n.prop == 'pitchfork' || n.prop == 'broom') { r(5, -9, 3, 7, c1); r(7, -3, 3, 3, sk) }
    else { r(5, -9, 3, 8 - a - ta, c1); r(5, -1 - a - ta, 3, 3, sk) }
    // kepala
    rh(-4, -20, 8, 8, sk); rh(2, -19, 2, 7, SH, 0); rh(-4, -19, 1, 5, HL, 0); rh(-5, -17, 1, 2, sk, 0);
    const hs = n.hs || 'short';
    if (hs == 'short') { rh(-5, -23, 10, 4, hair); rh(-5, -21, 2, 5, hair); rh(3, -21, 2, 3, hair); rh(-3, -23, 5, 1, 'rgba(255,255,255,.22)', 0) }
    else if (hs == 'long') { rh(-5, -23, 10, 4, hair); rh(-5, -21, 2, 11, hair); rh(3, -21, 2, 3, hair); rh(4, -19, 2, 8, hair); rh(-3, -23, 5, 1, 'rgba(255,255,255,.2)', 0) }
    else if (hs == 'bun') { rh(-5, -23, 10, 4, hair); rh(-5, -21, 2, 6, hair); rh(3, -21, 2, 3, hair); rh(-3, -27, 6, 4, hair); rh(-3, -27, 6, 1, 'rgba(255,255,255,.2)', 0) }
    else if (hs == 'spiky') { rh(-5, -23, 10, 4, hair); rh(-5, -21, 2, 4, hair); rh(-4, -26, 2, 3, hair); rh(-1, -27, 2, 4, hair); rh(2, -26, 2, 3, hair); rh(3, -21, 2, 3, hair) }
    else if (hs == 'bald') { rh(-5, -21, 1, 3, hair); rh(4, -21, 1, 3, hair) }
    if (n.beard) { rh(-4, -14, 8, 4, n.beard); rh(-3, -10, 6, 2, n.beard); rh(-1, -13, 3, 1, 'rgba(0,0,0,.25)', 0) }
    if (n.stache) { rh(-3, -15, 7, 2, n.stache) }
    // topi
    const ht = n.hat;
    if (ht == 'straw') { rh(-8, -22, 16, 3, '#d8b45a'); rh(-5, -26, 10, 5, '#e8c870'); rh(-5, -23, 10, 1, '#b8893a', 0); rh(-8, -22, 16, 1, '#f0d890', 0) }
    else if (ht == 'cap') { rh(-5, -24, 10, 5, n.hc || '#3a5a8a'); rh(2, -21, 6, 2, n.hc || '#3a5a8a'); rh(-4, -24, 6, 1, 'rgba(255,255,255,.2)', 0) }
    else if (ht == 'hood') { rh(-6, -24, 12, 6, n.hc || '#3a4a3a'); rh(-6, -20, 2, 9, n.hc || '#3a4a3a'); rh(4, -20, 2, 7, n.hc || '#3a4a3a'); rh(-4, -25, 8, 2, n.hc || '#3a4a3a'); rh(-4, -24, 5, 1, 'rgba(255,255,255,.16)', 0) }
    else if (ht == 'bonnet') { rh(-6, -24, 12, 6, '#f0e8dc'); rh(-6, -20, 3, 7, '#f0e8dc'); rh(-5, -25, 10, 2, '#f0e8dc'); rh(-3, -23, 6, 1, '#d8c8b0', 0); rh(4, -21, 2, 3, '#d8869a', 0) }
    else if (ht == 'helm') { rh(-5, -24, 10, 6, '#9aa0ae'); rh(-5, -20, 2, 5, '#9aa0ae'); rh(3, -20, 2, 4, '#9aa0ae'); rh(-3, -24, 3, 1, '#d8dde8', 0); rh(-1, -27, 3, 4, '#a33b4c'); rh(-4, -19, 8, 1, '#3a3d48', 0) }
    else if (ht == 'feather') { rh(-5, -24, 10, 4, n.hc || '#3a6a4a'); rh(-5, -22, 3, 3, n.hc || '#3a6a4a'); rh(2, -27, 3, 4, '#e0485b'); rh(3, -29, 2, 3, '#ff7a8a', 0) }
    else if (ht == 'cook') { rh(-5, -25, 10, 5, '#f4f0e8'); rh(-4, -28, 8, 4, '#f4f0e8'); rh(-4, -25, 8, 1, '#d8d0c0', 0) }
    else if (ht == 'band') { rh(-5, -21, 10, 2, n.hc || '#c8283e', 0) }
    // wajah
    const INK = '#3a2418', EW = '#f4eee8', PU = '#2a1a14', BRC = n.hairb || hair, wideEye = emo === 'kaget' || emo === 'takut', talkOn = talk && Math.floor(t * 9) % 2;
    if (emo === 'takut') rh(-4, -19, 8, 6, 'rgba(205,225,255,.22)', 0);             // wajah pucat
    // mata
    if (emo === 'senang') { [-4, 1].forEach(ex => { rh(ex, -16, 1, 1, INK, 0); rh(ex + 1, -17, 1, 1, INK, 0); rh(ex + 2, -16, 1, 1, INK, 0) }) }   // mata tertawa ^ ^
    else if (wideEye) { const sh = emo === 'takut' ? (Math.sin(t * 13 + i) > 0 ? 0 : -1) : 0; rh(-3, -18, 2, 3, EW, 0); rh(1, -18, 2, 3, EW, 0); rh(-2 + sh, -17, 1, 1, PU, 0); rh(2 + sh, -17, 1, 1, PU, 0) }   // melotot, pupil kecil
    else if (blink) { rh(-3, -16, 2, 1, INK, 0); rh(1, -16, 2, 1, INK, 0) }
    else if (emo === 'marah') { rh(-3, -16, 2, 1, EW, 0); rh(1, -16, 2, 1, EW, 0); rh(-2, -16, 1, 1, PU, 0); rh(2, -16, 1, 1, PU, 0) }               // mata menyipit
    else if (emo === 'sedih') { rh(-3, -17, 2, 2, EW, 0); rh(1, -17, 2, 2, EW, 0); rh(-2, -16, 1, 1, PU, 0); rh(2, -16, 1, 1, PU, 0) }               // pupil menunduk
    else { rh(-3, -17, 2, 2, EW, 0); rh(1, -17, 2, 2, EW, 0); rh(-2 - gl, -17, 1, 2, PU, 0); rh(2 - gl, -17, 1, 2, PU, 0) }
    // alis
    if (n.brow !== 0) {
      if (emo === 'sedih') { rh(-3, -18, 1, 1, BRC, 0); rh(-2, -19, 1, 1, BRC, 0); rh(1, -19, 1, 1, BRC, 0); rh(2, -18, 1, 1, BRC, 0) }               // ujung dalam naik
      else if (emo === 'takut') { rh(-3, -19, 1, 1, BRC, 0); rh(-2, -20, 1, 1, BRC, 0); rh(1, -20, 1, 1, BRC, 0); rh(2, -19, 1, 1, BRC, 0) }
      else if (emo === 'marah') { rh(-3, -19, 1, 1, BRC, 0); rh(-2, -18, 1, 1, BRC, 0); rh(1, -18, 1, 1, BRC, 0); rh(2, -19, 1, 1, BRC, 0) }         // ujung dalam turun
      else if (emo === 'kaget') { rh(-3, -20, 2, 1, BRC, 0); rh(1, -20, 2, 1, BRC, 0) }                                                             // alis terangkat
      else if (emo === 'bingung') { rh(-3, -19, 2, 1, BRC, 0); rh(1, -20, 2, 1, BRC, 0) }                                                           // satu alis naik
      else { rh(-3, -19, 2, 1, BRC, 0); rh(1, -19, 2, 1, BRC, 0) }
    }
    // pipi
    const CK = emo === 'senang' ? 'rgba(255,100,120,.85)' : emo === 'marah' ? 'rgba(255,60,50,.8)' : emo === 'takut' || emo === 'sedih' ? 'rgba(255,120,130,.18)' : 'rgba(255,120,130,.55)';
    rh(-4, -15, 1, 1, CK, 0); rh(3, -15, 1, 1, CK, 0);
    // mulut
    if (n._yawn && !talk) rh(-1, -15, 3, 3, '#4a1a18', 0);
    else if (emo === 'senang') { if (talkOn) { rh(-1, -14, 2, 1, '#a8483a', 0); rh(-2, -15, 1, 1, '#a8483a', 0); rh(1, -15, 1, 1, '#a8483a', 0) } else { rh(-2, -15, 4, 1, '#4a1a18', 0); rh(-1, -14, 2, 1, '#e8707a', 0) } }   // senyum lebar
    else if (emo === 'kaget') rh(-1, -15, 2, 2, '#4a1a18', 0);                                                                                        // mulut "o"
    else if (emo === 'sedih') { rh(-1, -14, 2, 1, '#8a3a30', 0); rh(-2, -13, 1, 1, '#8a3a30', 0); rh(1, -13, 1, 1, '#8a3a30', 0) }                    // cemberut
    else if (emo === 'marah') { rh(-2, -14, 4, 1, '#6a1c18', 0); rh(-1, -14, 2, 1, EW, 0) }                                                           // gigi terkatup
    else if (emo === 'takut') { rh(-2, -14, 1, 1, '#6a2a2a', 0); rh(-1, -13, 1, 1, '#6a2a2a', 0); rh(0, -14, 1, 1, '#6a2a2a', 0); rh(1, -13, 1, 1, '#6a2a2a', 0) }   // mulut bergetar
    else if (emo === 'bingung') rh(0, -14, 2, 1, '#8a3a30', 0);
    else if (talkOn) rh(-1, -14, 2, 2, '#5a2020', 0); else rh(-1, -14, 2, 1, '#a8483a', 0);
    if (emo === 'sedih') { const k = (t * 2.4 + i) % 1; rh(Math.floor(t * 2.4 + i) % 2 ? -3 : 2, -15 + Math.round(k * 2), 1, 1, '#8ad0ff', 0) }   // air mata
    if (emo === 'takut') { const k = (t * 1.7 + i) % 1; rh(4, -20 + Math.round(k * 5), 1, 2, '#8ad8ff') }                                            // keringat dingin
    if (n.glasses) { rh(-4, -18, 4, 3, 'rgba(180,220,255,.35)', 0); rh(0, -18, 4, 3, 'rgba(180,220,255,.35)', 0); rh(-1, -17, 2, 1, '#2a2030', 0) }
    fl(); g.restore(); g.restore();
    if (emo) emoIcon(emo, x + emJx, y - (kid ? 27 : 33), emA, n._emT);
  }

  /* ---------- state dunia (disimpan di localStorage) ---------- */
  const KEY = 'eoa_world_v1';
  const W_ = { gold: 0, inv: { herb: 0, mush: 0, flower: 0 }, gear: { w: 0, a: 0 }, bought: {}, chests: {}, seen: {}, visited: 0 };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) { W_.gold = s.gold | 0; Object.assign(W_.inv, s.inv || {}); Object.assign(W_.gear, s.gear || {}); W_.bought = s.bought || {}; W_.chests = s.chests || {}; W_.seen = s.seen || {}; W_.visited = s.visited | 0 } } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(W_)) } catch (e) { } };
  const GEAR_W = [0, .08, .16, .24, .32, .40], GEAR_A = [0, .06, .12, .18, .24, .30];

  const WORLD = window.WORLD = {
    S: W_, save, TAU, clamp, lerp, E, mkRng, mkCv, rc, disc, ell, hash, vnoise, h2r, mixc, dense, distPoly, person,
    dmgMul: () => 1 + GEAR_W[W_.gear.w],
    armorMul: () => 1 - GEAR_A[W_.gear.a],
    addGold(n, at) { W_.gold += n; if (at !== false && p) dn(p.x, p.y - 20, '+' + n + ' G', 0, '#ffd34d'); save() },
    onKill(e) { const base = { slime: 5, skel: 9, mage: 8, boss: 250 }[e.k] || 6, v = Math.round((e.mini ? 70 : base) * (1 + Math.random() * .5) * (e.mini ? 1 : 1)); W_.gold += v; save(); dn(e.x, e.y - e.ht - 12, '+' + v + ' G', 0, '#ffd34d') },
    label() { return AREAS[window.AREA] ? [AREAS[window.AREA].name, AREAS[window.AREA].sub] : ['', ''] }
  };
  window.AREA = 'lobby';
  const AREAS = WORLD.AREAS = {};
  const LOB = { np: null, tn: null, sealed: false };

  /* ---------- pergantian area ---------- */
  function swapOutNPCs() { if (!LOB.np) { LOB.np = NP.slice(); LOB.tn = TN.slice() } NP.length = 0; TN.length = 0 }
  function restoreNPCs() { if (LOB.np) { NP.length = 0; TN.length = 0; LOB.np.forEach(n => NP.push(n)); LOB.tn.forEach(n => TN.push(n)); LOB.np = LOB.tn = null } }
  function setArea(name) {
    const A_ = AREAS[name]; if (!A_) return;
    if (!A_.ready) { A_.ready = 1; A_.build() }
    A_.npcs.forEach(n => { if (n.act && !n._bound) { n.act = n.act.bind(n); n._bound = 1 } });
    swapOutNPCs(); NP.push(...A_.npcs); window.AREA = name;
    CAM_Z = 1.4; lobby = true; room = 0; trn = 0; WW = A_.w; WH = A_.h; walls = A_.walls; BG = A_.bg; TO = []; BR = []; es = []; pr = []; dr = []; gh = []; dlg = null; doorOn = 0; doorO = 0; clr = 0; camInit = false;
    if (A_.enter) A_.enter();
  }
  function setLobby() {
    CAM_Z = 1.4; restoreNPCs(); window.AREA = 'lobby';
  }
  // toLobby (kematian, dll.) selalu mengembalikan ke lobby asli
  const _toLobby = toLobby;
  toLobby = function () { setLobby(); _toLobby() };
  WORLD.setArea = setArea; WORLD.setLobby = setLobby; WORLD.LOB = LOB;

  /* ---------- transisi (pintu, gerbang) ---------- */
  const TR = WORLD.TR = { on: 0, t: 0, k: '', cool: 0, hide: 0, fade: 0, white: 0, st: 0, o: 0 };
  const banner = WORLD.banner = { t: -1, a: '', b: '' };
  function showBanner(a, b) { banner.t = 0; banner.a = a; banner.b = b }
  function walkAnim(dt, vy, moving) { p.wb += ((moving ? 1 : 0) - p.wb) * Math.min(1, dt * 12); p.wph += dt * 12 * (.2 + p.wb * .8) * Math.max(1, Math.min(1.5, Math.abs(vy) / 85)); p.idt += dt * 3 }
  function lockInput() { for (const k in P) delete P[k]; for (const k in K) K[k] = 0; M.d = 0; try { touchJoy.active = false } catch (e) { } }
  function tutorialOn() { const e = document.getElementById('tutPanel'); return !!(e && !e.classList.contains('hidden')) }
  WORLD.tutorialOn = tutorialOn;

  // timeline tiap jenis transisi. step(dt) dipanggil tiap frame selama TR.on.
  const SEQ = {
    // muncul di luar dungeon: pintu tebing terbuka, pahlawan melangkah keluar, pintu menutup
    'emerge': {
      dur: 3.6, f(T, dt) {
        const F = AREAS.forest;
        if (!TR.s2) { TR.s2 = 1; try { SFX.door() } catch (e) { } }
        F.doorO = T < 2.2 ? 1 : 1 - E((T - 2.2) / .8);
        TR.hide = T < .35; TR.fade = 1 - E((T - .1) / .9); TR.white = 1;
        const k = E((T - .35) / 1.4); p.x = F.door.x; p.y = F.door.y - 6 + 40 * k; p.vy = 40 * (k > 0 && k < 1 ? 1 : 0); p.face = Math.PI / 2; walkAnim(dt, 90, k > 0 && k < 1)
      }
    },
    // keluar dari lobby lewat pintu selatan -> muncul di hutan
    'toForest': {
      dur: 4.7, f(T, dt) {
        if (T < 1.0) {
          if (!TR.s1) { TR.s1 = 1; try { SFX.door() } catch (e) { } }
          TR.dO = E(T / .45);
          p.x = TR.x0 + (320 - TR.x0) * E(T / .35);
          p.y = TR.y0 + (410 - TR.y0) * E((T - .3) / .7);
          p.vx = 0; p.vy = T > .3 ? 70 : 0; p.face = Math.PI / 2; walkAnim(dt, 90, T > .3);
          TR.white = 1; TR.fade = E((T - .45) / .55); TR.hide = T > .85;
        } else {
          if (!TR.sw) {
            TR.sw = 1; TR.dO = 0; setArea('forest'); const F = AREAS.forest;
            p.x = F.door.x; p.y = F.door.y - 6; p.vx = p.vy = 0; camInit = false; camUpd(0);
            F.doorO = 1; showBanner(F.name, F.sub); TR.s2 = 0
          }
          SEQ.emerge.f(T - 1.0, dt)
        }
      }
    },
    // masuk lagi ke dungeon lewat pintu tebing -> muncul di lobby
    'toLobby': {
      dur: 3.3, f(T, dt) {
        const F = AREAS.forest;
        if (T < .95) {
          if (!TR.s1) { TR.s1 = 1; try { SFX.door() } catch (e) { } }
          F.doorO = E(T / .4);
          p.x = TR.x0 + (F.door.x - TR.x0) * E(T / .3);
          p.y = TR.y0 + ((F.door.y - 40) - TR.y0) * E((T - .15) / .7);
          p.vx = 0; p.vy = T > .15 ? -70 : 0; p.face = -Math.PI / 2; walkAnim(dt, 90, T > .15);
          TR.white = 0; TR.fade = E((T - .35) / .55); TR.hide = T > .7;
        } else {
          if (!TR.sw) {
            TR.sw = 1; F.doorO = 0; TR.hide = 1; setLobby(); _toLobbyArea();
            p.x = 320; p.y = 398; p.vx = p.vy = 0; p.face = -Math.PI / 2; camInit = false; camUpd(0); TR.dO = 1; TR.s2 = 0
          }
          TR.fade = 1 - E((T - .95) / .6); TR.white = 0; TR.hide = T < 1.1;
          const k = E((T - 1.1) / 1.2); p.x = 320; p.y = 398 - 60 * k; p.vx = 0; p.vy = (k > 0 && k < 1) ? -70 : 0; p.face = -Math.PI / 2;
          walkAnim(dt, 90, k > 0 && k < 1);
          if (T >= 2.0 && !TR.s2) { TR.s2 = 1; try { SFX.door() } catch (e) { } }
          TR.dO = T < 2.0 ? 1 : 1 - E((T - 2.0) / .6)
        }
      }
    },
    // gerbang: fade hitam, pindah area, jalan masuk
    'gate': {
      dur: 3.0, f(T, dt) {
        const to = TR.to, dx = TR.dx;
        if (T < .6) { const k = T / .6; p.x += dx * 46 * dt; p.vx = dx * 46; p.face = dx > 0 ? 0 : Math.PI; walkAnim(dt, 90, 1); TR.fade = E(k); TR.white = 0 }
        else if (T < .75) { if (!TR.sw) { TR.sw = 1; const A_ = AREAS[to]; if (to === 'lobby') { setLobby(); _toLobbyArea() } else setArea(to); const sp = TR.spawn; p.x = sp[0]; p.y = sp[1]; p.vx = p.vy = 0; camInit = false; camUpd(0); showBanner(A_.name, A_.sub) } TR.fade = 1 }
        else { const k = E((T - .75) / .7); TR.fade = 1 - k; TR.white = 0; const wl = (T - .75) < 1.1; if (wl) { p.x += TR.dx * 42 * dt; p.vx = TR.dx * 42 } walkAnim(dt, 90, wl); p.face = TR.dx > 0 ? 0 : Math.PI }
      }
    }
  };
  // set ulang area lobby (setLobby hanya memulihkan NPC) â†’ pakai fungsi asli toLobby tanpa pesan
  function _toLobbyArea() { const m = msgS, mt = msgT; _toLobby(); spawn(); msgS = m; msgT = mt; fade = 0; walls = WL }   // spawn() = pulihkan manekin di camp pelatih (setArea mengosongkan es)
  WORLD.SEQ = SEQ; WORLD._toLobbyArea = _toLobbyArea; // dipakai modul Portal Lobby (akhir file)
  WORLD.start = function (kind, o) {
    if (TR.on || !p || p.dead > 0) return; lockInput(); TR.on = 1; TR.t = 0; TR.k = kind; TR.s1 = TR.s2 = TR.sw = 0; TR.hide = 0; TR.fade = 0; TR.lo = -1; TR.y0 = p.y; Object.assign(TR, o || {}); try { dlg = null } catch (e) { }
  };
  WORLD.go = function (name) {   // debug / lompat langsung
    if (name === 'lobby') { setLobby(); _toLobbyArea(); p.x = 320; p.y = 322 } else { setArea(name); const A_ = AREAS[name]; p.x = A_.spawn[0]; p.y = A_.spawn[1] } p.vx = p.vy = 0; camInit = false; camUpd(0)
  };
  function trStep(dt) {
    const S = SEQ[TR.k]; TR.t += dt; t += dt; shake = Math.max(0, shake - 20 * dt); lockInput(); if (typeof psStep === 'function') psStep(dt);
    S.f(TR.t, dt); camUpd(dt);
    if (TR.t >= S.dur) { TR.on = 0; TR.hide = 0; TR.fade = 0; TR.cool = 1.2; TR.dO = 0; lockInput(); if (AREAS.forest && (TR.k === 'emerge' || TR.k === 'toForest')) AREAS.forest.doorO = 0 }
  }
  const _upd = upd;
  upd = function (dt) {
    if (TR.on) { trStep(dt); return }
    if (TR.cool > 0) TR.cool -= dt;
    banner.t >= 0 && (banner.t += dt);
    if (window.AREA !== 'lobby') delete P.KeyT;
    _upd(dt);
    if (window.AREA !== 'lobby') { const A_ = AREAS[window.AREA]; if (A_ && A_.tick) A_.tick(dt) }
  };
  // hero tersembunyi saat di dalam ceruk pintu
  const _hero = drawHero, _armed = drawArmed;
  drawHero = function () { if (TR.on && TR.hide) return; return _hero.apply(this, arguments) };
  drawArmed = function () { if (TR.on && TR.hide) return; return _armed.apply(this, arguments) };


  /* ---------- pintu keluar di dinding selatan lobby ---------- */
  function tutDone() { try { return localStorage.getItem('eoa_tutorial_v1') === '1' } catch (e) { return true } }
  let exitWarn = -99;
  function lobbyExitDoor() {
    if (TR.on || TR.cool > 0 || !p || p.dead > 0 || dlg || !lobby) return;
    const nearDoor = p.x > 280 && p.x < 360 && p.y > 336;
    if (nearDoor && !AREAS.forest.ready) { AREAS.forest.ready = 1; AREAS.forest.build() }
    if (p.x > 292 && p.x < 348 && p.y > 366 && p.vy > 8) {
      if (tutorialOn()) {
        if (t - exitWarn > 3) { exitWarn = t; msg('Selesaikan atau lewati latihan Ser Aldric dulu sebelum keluar Dungeon.') }
        p.y = Math.min(p.y, 366); return
      }
      WORLD.start('toForest', { x0: p.x, y0: p.y }); msg('Kau melangkah keluar dari Dungeon...')
    }
  }
  function drawLobbyDoor(o) {
    const CTX = g, R = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h) };
    R('#07060c', 300, 368, 40, 32);
    if (o > .02) [[120, 70, 30], [205, 122, 52], [255, 192, 112], [255, 232, 170]].forEach((c, i) => R('rgb(' + (7 + (c[0] - 7) * o | 0) + ',' + (6 + (c[1] - 6) * o | 0) + ',' + (12 + (c[2] - 12) * o | 0) + ')', 300 + i * 4, 368 + i * 3, 40 - i * 8, 32 - i * 3));
    CTX.save(); CTX.beginPath(); CTX.rect(300, 368, 40, 32); CTX.clip();
    const off = Math.round(o * 20);
    [300 - off, 320 + off].forEach(x0 => { R('#6b5f55', x0, 368, 20, 32); R('#8a7d70', x0, 368, 20, 1);[5, 10, 15].forEach(q => R('#4f463e', x0 + q, 368, 1, 32)); R('#3a342e', x0, 376, 20, 2); R('#3a342e', x0, 390, 20, 2);[2, 17].forEach(q => { R('#b18b59', x0 + q, 376, 1, 1); R('#b18b59', x0 + q, 390, 1, 1) }); R('#2b2620', x0, 399, 20, 1) });
    if (off < 2) { R('#b18b59', 319, 368, 2, 32); R('#c39a5d', 317, 381, 6, 7); R('#2b2620', 319, 383, 2, 3) }
    CTX.restore();
    if (o > .02) { CTX.save(); CTX.globalCompositeOperation = 'lighter'; for (let yy = 386; yy > 330; yy -= 2) { const tt = (386 - yy) / 56, half = Math.round(20 + tt * 28), a = Math.round(.2 * o * (1 - tt) * 25) / 25; if (a > 0) { CTX.fillStyle = 'rgba(255,205,140,' + a + ')'; CTX.fillRect(320 - half, yy - 2, half * 2, 2) } } CTX.restore() }
  }
  function lobbyDoorFx() {
    if (TR.on) { if (TR.dO > .02 && (TR.k === 'toForest' || TR.k === 'toLobby' || TR.k === 'corridorToLobby')) drawLobbyDoor(TR.dO); return }
    if (p && !dlg && p.x > 280 && p.x < 360 && p.y > 330) { g.font = '8px monospace'; txt('Pintu keluar Dungeon \u2193', 320, 350, '#ffe9a8', 'center') }
  }

  /* ---------- hook lobby ---------- */
  const _lobbyTick = lobbyTick;
  lobbyTick = function (dt) {
    if (window.AREA === 'lobby') { lobbyExitDoor(); return _lobbyTick(dt) }
    const A_ = AREAS[window.AREA]; if (!A_) return;
    // dialog (sama seperti lobby)
    if (dlg && dist(dlg.n, p) > 76) dlg = null;
    if (P.KeyG) {
      if (dlg && dlg.c < dlg.len) { dlg.c = dlg.len; try { SFX.blip(520) } catch (e) { } }
      else if (dlg) { dlg.i++; if (dlg.i >= dlg.n.lines.length) { const a = dlg.n.act; dlg = null; if (a) a() } else SFX.point() }
      else { const n = NP.find(n => dist(n, p) < (n.rng || 36)); if (n) { dlg = { n, i: 0 }; SFX.pickup() } }
    }
  };
  const _lobbyDraw = lobbyDraw;
  lobbyDraw = function () {
    if (window.AREA === 'lobby') { _lobbyDraw(); lobbyDoorFx(); return }
    const A_ = AREAS[window.AREA]; if (A_ && A_.drawBack) A_.drawBack()
  };
  const _trainDraw = trainDraw, _trainLife = trainLife;
  trainDraw = function () { if (window.AREA === 'lobby') _trainDraw() };
  trainLife = function () { if (window.AREA === 'lobby') _trainLife() };
  const _envFx = envFx;
  envFx = function () { if (window.AREA === 'lobby') return _envFx(); const A_ = AREAS[window.AREA]; if (A_ && A_.env) A_.env() };
  const _txt = txt;
  txt = function (s) { if (window.AREA !== 'lobby' && AREAS[window.AREA]) { if (s === 'LOBBY â€” ZONA AMAN') arguments[0] = AREAS[window.AREA].name; else if (s === 'Sanctum Hall') arguments[0] = AREAS[window.AREA].sub } return _txt.apply(this, arguments) };
  window.outFront = function () { if (window.AREA === 'lobby') return; const A_ = AREAS[window.AREA]; if (A_ && A_.drawFront) A_.drawFront() };


  /* ---------- HUD: emas, tas, banner area, fade transisi ---------- */
  const COIN = ['..####..', '.#YYYY#.', '#YYwYYY#', '#YwYYYY#', '#YYYYYY#', '#YYYYYY#', '.#YYYY#.', '..####..'];
  function coin(x, y, s) { COIN.forEach((row, j) => { for (let i = 0; i < 8; i++) { const c = row[i]; if (c === '.') continue; g.fillStyle = c === '#' ? '#7a4a0c' : c === 'w' ? '#fff3b0' : '#f2c230'; g.fillRect(x + i * s, y + j * s, s, s) } }) }
  const _draw = draw;
  draw = function () {
    _draw();
    if (!p || typeof W === 'undefined') return;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    // pill emas (hanya di area luar)
    if (window.AREA !== 'lobby') {
      const gold = W_.gold + '', bagN = W_.inv.herb + W_.inv.mush + W_.inv.flower;
      g.font = 'bold 9px monospace'; const tw = g.measureText(gold).width + 26, X = W - 10 - tw, Y = 64;
      g.fillStyle = 'rgba(10,8,20,.62)'; g.fillRect(X, Y, tw, 14); g.fillStyle = '#c2a06b'; g.fillRect(X, Y, tw, 1); g.fillRect(X, Y + 13, tw, 1);
      coin(X + 4, Y + 3, 1); g.textAlign = 'right'; g.fillStyle = '#ffe28a'; g.fillText(gold, W - 14, Y + 10);
      if (bagN > 0) { g.font = '8px monospace'; g.fillStyle = '#b8e8a0'; g.fillText('Tas: ' + bagN + ' bahan', W - 10, Y + 25) }
    }
    // banner area
    if (banner.t >= 0 && banner.t < 4.2) {
      const a = banner.t < .6 ? banner.t / .6 : banner.t > 3.4 ? 1 - (banner.t - 3.4) / .8 : 1;
      g.globalAlpha = clamp(a, 0, 1); const cx = W / 2, cy = H * .26;
      g.fillStyle = 'rgba(8,6,16,.55)'; g.fillRect(cx - 130, cy - 18, 260, 40); g.fillStyle = '#c2a06b'; g.fillRect(cx - 130, cy - 18, 260, 1); g.fillRect(cx - 130, cy + 21, 260, 1);
      g.textAlign = 'center'; g.font = 'bold 14px monospace'; g.fillStyle = 'rgba(0,0,0,.7)'; g.fillText(banner.a, cx + 1, cy + 3); g.fillStyle = '#ffe9a8'; g.fillText(banner.a, cx, cy + 2);
      g.font = 'italic 9px monospace'; g.fillStyle = '#b8b0d8'; g.fillText(banner.b, cx, cy + 16); g.globalAlpha = 1
    } else if (banner.t >= 4.2) banner.t = -1;
    // fade transisi
    if (TR.on && TR.fade > 0) { g.fillStyle = TR.white ? 'rgba(255,244,214,' + TR.fade + ')' : 'rgba(0,0,0,' + TR.fade + ')'; g.fillRect(0, 0, W, H) }
    g.restore();
  };
})();


/* ===== Pustaka seni pixel (sprite statis dibuat sekali ke kanvas offscreen) ===== */
(function () {
  'use strict';
  const { TAU, clamp, lerp, mkRng, mkCv, rc, disc, ell, hash, vnoise, h2r, mixc } = WORLD;
  const art = WORLD.art = {};
  const rgb = c => 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
  const OL = '#0f1a12';   // garis tepi alami
  art.rgb = rgb;

  /* pohon ek: kanopi bulat berlapis. kembali {img, ox, oy} (ox,oy = titik dasar batang) */
  art.oak = function (seed, sc) {
    const rng = mkRng(seed * 7919 + 13), S = sc || 1, w = Math.round(58 * S), h = Math.round(76 * S), [c, x] = mkCv(w, h), cx = w / 2 | 0, by = h - 6;
    const hue = rng(), base = mixc(h2r('#3c8a3a'), hue > .6 ? h2r('#5a9a34') : h2r('#2f7a44'), rng() * .7), dark = mixc(base, [8, 30, 18], .45), lite = mixc(base, [190, 235, 110], .38), lite2 = mixc(base, [230, 250, 150], .55);
    // bayangan batang & akar
    const tw = Math.round(8 * S), th = Math.round(24 * S);
    rc(x, OL, cx - tw / 2 - 1, by - th, tw + 2, th + 2); rc(x, '#5a3a22', cx - tw / 2, by - th, tw, th); rc(x, '#7a5434', cx - tw / 2, by - th, 2, th); rc(x, '#3e2616', cx + tw / 2 - 2, by - th, 2, th);
    rc(x, OL, cx - tw / 2 - 3, by - 1, tw + 6, 3); rc(x, '#4a2e1a', cx - tw / 2 - 2, by - 1, tw + 4, 2);
    for (let i = 0; i < 4; i++) rc(x, '#3e2616', cx - tw / 2 + 1 + rng() * (tw - 3), by - th + 3 + rng() * (th - 6), 1, 3);
    // kanopi
    const cl = [[0, -34, 17], [-13, -27, 12], [13, -27, 12], [0, -48, 12], [-8, -42, 11], [9, -42, 11]].map(([dx, dy, r]) => [cx + dx * S + (rng() - .5) * 4, by + dy * S + (rng() - .5) * 3, Math.round(r * S * (.9 + rng() * .2))]);
    cl.forEach(([a, b, r]) => disc(x, OL, a, b, r + 1));
    cl.forEach(([a, b, r]) => disc(x, rgb(dark), a, b, r));
    cl.forEach(([a, b, r]) => disc(x, rgb(base), a - 1, b - 2, r - 2));
    cl.forEach(([a, b, r]) => { if (r > 8) disc(x, rgb(lite), a - 3, b - 4, Math.max(3, r - 6)) });
    cl.forEach(([a, b, r]) => { if (r > 10) disc(x, rgb(lite2), a - 5, b - 6, Math.max(2, r - 10)) });
    // tekstur daun
    for (let i = 0; i < 70; i++) { const q = cl[(rng() * cl.length) | 0], an = rng() * TAU, d = Math.sqrt(rng()) * (q[2] - 2), px = q[0] + Math.cos(an) * d, py = q[1] + Math.sin(an) * d, k = rng(); rc(x, k < .45 ? rgb(dark) : k < .8 ? rgb(lite) : rgb(base), px, py, 2, 1) }
    return { img: c, ox: cx, oy: by };
  };
  /* pohon cemara */
  art.pine = function (seed, sc) {
    const rng = mkRng(seed * 3571 + 5), S = sc || 1, w = Math.round(44 * S), h = Math.round(80 * S), [c, x] = mkCv(w, h), cx = w / 2 | 0, by = h - 5;
    const base = mixc(h2r('#2d6a48'), h2r('#3a7a52'), rng()), dark = mixc(base, [6, 24, 22], .5), lite = mixc(base, [150, 220, 140], .4);
    rc(x, OL, cx - 3, by - 14, 6, 16); rc(x, '#5a3a22', cx - 2, by - 14, 4, 14); rc(x, '#7a5434', cx - 2, by - 14, 1, 14);
    const tiers = [[by - 14, 17, 17], [by - 26, 14, 15], [by - 38, 11, 14], [by - 49, 7, 13]];
    tiers.forEach(([yy, hw, hh]) => { for (let j = 0; j < hh; j++) { const k = j / hh, wd = Math.round(hw * S * (.28 + .72 * k) * (1 + (rng() - .5) * .08)); rc(x, OL, cx - wd - 1, yy - hh + j, wd * 2 + 2, 1) } });
    tiers.forEach(([yy, hw, hh]) => { for (let j = 0; j < hh; j++) { const k = j / hh, wd = Math.round(hw * S * (.28 + .72 * k)); rc(x, rgb(dark), cx - wd, yy - hh + j, wd * 2, 1); rc(x, rgb(base), cx - wd + 1, yy - hh + j, Math.max(1, wd * 2 - 3), 1); if (wd > 3) rc(x, rgb(lite), cx - wd + 2, yy - hh + j, Math.max(1, wd - 3), 1) } });
    for (let i = 0; i < 26; i++) { const t = tiers[(rng() * 4) | 0], k = rng(), wd = Math.round(t[1] * S * (.28 + .72 * k)); rc(x, rgb(dark), cx - wd + rng() * wd * 2, t[0] - t[2] + k * t[2], 2, 1) }
    rc(x, '#cfe8c0', cx - 1, by - 61, 2, 2);
    return { img: c, ox: cx, oy: by };
  };
  art.bush = function (seed, berries) {
    const rng = mkRng(seed * 131 + 9), [c, x] = mkCv(30, 20), base = mixc(h2r('#3f8a3c'), h2r('#5a9a3a'), rng()), dark = mixc(base, [8, 30, 18], .45), lite = mixc(base, [200, 240, 120], .35);
    const cl = [[15, 11, 8], [8, 12, 6], [22, 12, 6], [15, 7, 6]];
    cl.forEach(([a, b, r]) => disc(x, OL, a, b, r + 1)); cl.forEach(([a, b, r]) => disc(x, rgb(dark), a, b, r)); cl.forEach(([a, b, r]) => disc(x, rgb(base), a - 1, b - 1, r - 1)); cl.forEach(([a, b, r]) => disc(x, rgb(lite), a - 2, b - 3, Math.max(2, r - 4)));
    for (let i = 0; i < 12; i++) rc(x, rng() < .5 ? rgb(dark) : rgb(lite), 5 + rng() * 20, 4 + rng() * 11, 2, 1);
    if (berries) for (let i = 0; i < 6; i++) { const a = 6 + rng() * 18, b = 6 + rng() * 9; rc(x, '#c8283e', a, b, 2, 2); rc(x, '#ff8a9a', a, b, 1, 1) }
    ell(x, 'rgba(0,0,0,0)', 0, 0, 0, 0);
    return { img: c, ox: 15, oy: 17 };
  };
  art.rock = function (seed, big) {
    const rng = mkRng(seed * 977 + 3), w = big ? 34 : 22, h = big ? 26 : 16, [c, x] = mkCv(w, h);
    const cl = big ? [[17, 14, 11], [9, 16, 7], [25, 16, 8]] : [[11, 9, 7], [6, 10, 5], [16, 10, 5]];
    cl.forEach(([a, b, r]) => ell(x, OL, a, b, r + 1, Math.round(r * .75) + 1)); cl.forEach(([a, b, r]) => ell(x, '#5a5862', a, b, r, Math.round(r * .75)));
    cl.forEach(([a, b, r]) => ell(x, '#7c7a86', a - 1, b - 1, r - 2, Math.round(r * .75) - 2)); cl.forEach(([a, b, r]) => ell(x, '#9a98a6', a - 2, b - 3, Math.max(2, r - 5), Math.max(1, Math.round(r * .75) - 5)));
    for (let i = 0; i < (big ? 6 : 3); i++) rc(x, '#4a4852', 3 + rng() * (w - 6), 4 + rng() * (h - 8), 3, 1);
    if (rng() < .6) { rc(x, '#4a8a3a', 4 + rng() * (w - 10), 2 + rng() * 3, 4, 2); rc(x, '#6aaa4a', 5 + rng() * (w - 12), 2 + rng() * 3, 2, 1) }
    return { img: c, ox: w / 2 | 0, oy: h - 3 };
  };
  art.log = function () {
    const [c, x] = mkCv(34, 14); rc(x, OL, 1, 3, 32, 10); rc(x, '#6a4a2c', 2, 4, 30, 8); rc(x, '#8a6440', 2, 4, 30, 2); rc(x, '#4a301a', 2, 10, 30, 2);
    for (let i = 0; i < 5; i++) rc(x, '#4a301a', 5 + i * 6, 5, 1, 4); rc(x, OL, 0, 4, 4, 8); rc(x, '#c9a46b', 1, 5, 3, 6); rc(x, '#a8823f', 2, 6, 1, 4); rc(x, '#c9a46b', 29, 5, 3, 6);
    rc(x, '#4a8a3a', 10, 3, 8, 2); rc(x, '#6aaa4a', 11, 3, 4, 1); return { img: c, ox: 17, oy: 11 };
  };
  art.stump = function () {
    const [c, x] = mkCv(18, 16); ell(x, OL, 9, 6, 8, 4); rc(x, OL, 1, 6, 16, 8); rc(x, '#5a3a22', 2, 6, 14, 7); rc(x, '#7a5434', 2, 6, 4, 7); ell(x, '#c9a46b', 9, 6, 7, 3); ell(x, '#a8823f', 9, 6, 4, 2); ell(x, '#c9a46b', 9, 6, 2, 1); return { img: c, ox: 9, oy: 12 };
  };
  art.sign = function () {
    const [c, x] = mkCv(28, 34); rc(x, OL, 12, 8, 6, 26); rc(x, '#6a4a2c', 13, 8, 4, 25); rc(x, '#8a6440', 13, 8, 1, 25);
    rc(x, OL, 2, 3, 24, 11); rc(x, '#9a7444', 3, 4, 22, 9); rc(x, '#b8905a', 3, 4, 22, 2); rc(x, '#6a4a2c', 3, 11, 22, 2); for (let i = 0; i < 4; i++) rc(x, '#4a301a', 6 + i * 5, 7, 3, 2);
    rc(x, '#c8ccd6', 4, 5, 1, 1); rc(x, '#c8ccd6', 23, 5, 1, 1); rc(x, '#c8ccd6', 4, 11, 1, 1); rc(x, '#c8ccd6', 23, 11, 1, 1);
    rc(x, OL, 6, 16, 20, 9); rc(x, '#8a6440', 7, 17, 18, 7); rc(x, '#a8825a', 7, 17, 18, 1); for (let i = 0; i < 3; i++) rc(x, '#3a2414', 10 + i * 5, 20, 3, 1); return { img: c, ox: 14, oy: 31 };
  };
  art.chest = function (open) {
    const [c, x] = mkCv(20, 18); rc(x, 'rgba(0,0,0,.3)', 2, 14, 16, 3);
    rc(x, OL, 2, 6, 16, 10); rc(x, '#8a5a2c', 3, 7, 14, 8); rc(x, '#a8743c', 3, 7, 14, 2); rc(x, '#5a3a1c', 3, 13, 14, 2); rc(x, '#d8b84a', 3, 10, 14, 1); rc(x, '#d8b84a', 9, 7, 2, 7); rc(x, '#fff0a0', 9, 10, 2, 2);
    if (open) { rc(x, OL, 2, 1, 16, 6); rc(x, '#6a4020', 3, 1, 14, 5); rc(x, '#ffd34d', 5, 5, 10, 3); rc(x, '#fff3a0', 6, 5, 3, 1); rc(x, '#fff3a0', 11, 6, 3, 1) }
    else { rc(x, OL, 2, 2, 16, 6); rc(x, '#a8743c', 3, 3, 14, 4); rc(x, '#c8924c', 3, 3, 14, 1); rc(x, '#d8b84a', 3, 5, 14, 1); rc(x, '#d8b84a', 9, 3, 2, 5) }
    return { img: c, ox: 10, oy: 15 };
  };
  art.tent = function () {
    const [c, x] = mkCv(66, 52); ell(x, 'rgba(0,0,0,.3)', 33, 47, 30, 4);
    for (let j = 0; j < 40; j++) { const wd = Math.round(4 + j * .74); rc(x, OL, 33 - wd - 1, 6 + j, wd * 2 + 2, 1) }
    for (let j = 0; j < 40; j++) { const wd = Math.round(4 + j * .74); rc(x, j % 8 < 4 ? '#b8553a' : '#c9704a', 33 - wd, 6 + j, wd * 2, 1); rc(x, 'rgba(0,0,0,.18)', 33, 6 + j, wd, 1) }
    rc(x, OL, 27, 28, 13, 18); rc(x, '#241a18', 28, 28, 11, 17); rc(x, '#3a2a24', 28, 28, 5, 17); rc(x, OL, 32, 0, 3, 9); rc(x, '#8a6440', 33, 0, 1, 9); rc(x, '#e0485b', 34, 0, 6, 3); rc(x, '#ff8a9a', 34, 0, 6, 1);
    rc(x, '#7a5230', 6, 44, 4, 3); rc(x, '#7a5230', 56, 44, 4, 3); return { img: c, ox: 33, oy: 46 };
  };
  art.rack = function () {   // jemuran kulit / daging
    const [c, x] = mkCv(42, 30); rc(x, OL, 2, 6, 4, 24); rc(x, '#6a4a2c', 3, 6, 2, 23); rc(x, OL, 36, 6, 4, 24); rc(x, '#6a4a2c', 37, 6, 2, 23); rc(x, OL, 2, 6, 38, 4); rc(x, '#8a6440', 3, 7, 36, 2);
    [[9, '#c8785a'], [18, '#d8a05a'], [27, '#c8785a']].forEach(([a, col]) => { rc(x, OL, a, 9, 8, 13); rc(x, col, a + 1, 10, 6, 11); rc(x, 'rgba(255,255,255,.18)', a + 1, 10, 2, 9); rc(x, 'rgba(0,0,0,.2)', a + 5, 10, 2, 11) });
    return { img: c, ox: 21, oy: 28 };
  };
  art.lantern = function () {   // tiang lentera (cahaya digambar dinamis)
    const [c, x] = mkCv(18, 44); rc(x, 'rgba(0,0,0,.3)', 4, 40, 10, 3); rc(x, OL, 7, 14, 4, 28); rc(x, '#4a3a2c', 8, 14, 2, 27); rc(x, '#6a5a44', 8, 14, 1, 27);
    rc(x, OL, 3, 4, 12, 12); rc(x, '#3a2c20', 4, 5, 10, 10); rc(x, '#ffd870', 5, 6, 8, 8); rc(x, '#fff3b8', 6, 7, 4, 5); rc(x, OL, 2, 2, 14, 3); rc(x, '#5a4630', 3, 2, 12, 2); rc(x, OL, 5, 0, 8, 3); rc(x, '#6a5638', 6, 0, 6, 2);
    rc(x, OL, 6, 38, 6, 4); rc(x, '#5a4630', 7, 38, 4, 3); return { img: c, ox: 9, oy: 41 };
  };
  art.barrel = function () {
    const [c, x] = mkCv(16, 20); rc(x, 'rgba(0,0,0,.3)', 2, 17, 12, 3); rc(x, OL, 2, 3, 12, 16); rc(x, '#8a5a30', 3, 4, 10, 14); rc(x, '#a8743c', 3, 4, 3, 14); rc(x, '#5a3a1c', 11, 4, 2, 14);
    rc(x, '#4a4a54', 2, 7, 12, 2); rc(x, '#4a4a54', 2, 14, 12, 2); rc(x, '#7a7a88', 3, 7, 10, 1); ell(x, '#b8905a', 8, 4, 5, 2); ell(x, '#6a4020', 8, 4, 3, 1); return { img: c, ox: 8, oy: 17 };
  };
  art.crate = function () {
    const [c, x] = mkCv(18, 18); rc(x, 'rgba(0,0,0,.3)', 1, 15, 16, 3); rc(x, OL, 1, 2, 16, 15); rc(x, '#a8743c', 2, 3, 14, 13); rc(x, '#c8924c', 2, 3, 14, 3); rc(x, '#6a4020', 2, 7, 14, 1); rc(x, '#6a4020', 2, 12, 14, 1); rc(x, '#6a4020', 2, 3, 2, 13); rc(x, '#6a4020', 14, 3, 2, 13); rc(x, '#5a3a1c', 4, 8, 10, 4); return { img: c, ox: 9, oy: 16 };
  };
  art.haybale = function () {
    const [c, x] = mkCv(24, 18); rc(x, 'rgba(0,0,0,.28)', 2, 15, 20, 3); rc(x, OL, 2, 3, 20, 14); rc(x, '#c9a95a', 3, 4, 18, 12); rc(x, '#e6cc7a', 3, 4, 18, 3); rc(x, '#9a7c38', 3, 12, 18, 4); rc(x, '#6b4d33', 3, 8, 18, 1); for (let i = 0; i < 7; i++) rc(x, '#a3843c', 5 + i * 2, 6 + (i * 5) % 8, 1, 4); return { img: c, ox: 12, oy: 15 };
  };
  art.flowerbed = function (seed, w, h) {
    const rng = mkRng(seed), [c, x] = mkCv(w, h); ell(x, 'rgba(60,40,20,.9)', w / 2, h / 2, w / 2 - 1, h / 2 - 1); ell(x, '#6a4a2c', w / 2, h / 2, w / 2 - 2, h / 2 - 2); ell(x, '#4a2e1a', w / 2, h / 2, w / 2 - 4, h / 2 - 4);
    const cols = ['#e0485b', '#ffd34d', '#e8e4f0', '#b48cff', '#ff9ac0'];
    for (let i = 0; i < w * h / 24; i++) { const a = rng() * TAU, d = Math.sqrt(rng()), fx = w / 2 + Math.cos(a) * d * (w / 2 - 5), fy = h / 2 + Math.sin(a) * d * (h / 2 - 4); rc(x, '#3a7a34', fx, fy + 1, 1, 2); rc(x, cols[(rng() * cols.length) | 0], fx - 1, fy - 1, 2, 2) } return { img: c, ox: w / 2 | 0, oy: h - 2 };
  };
  art.fence = function (len) {   // pagar kayu horizontal
    const [c, x] = mkCv(len, 16); rc(x, 'rgba(0,0,0,.25)', 0, 13, len, 3);
    for (let i = 0; i <= len; i += 14) { rc(x, OL, i, 2, 5, 13); rc(x, '#8a6440', i + 1, 2, 3, 12); rc(x, '#b8905a', i + 1, 2, 1, 12) }
    rc(x, OL, 0, 4, len, 4); rc(x, '#9a7444', 0, 5, len, 2); rc(x, OL, 0, 9, len, 4); rc(x, '#8a6440', 0, 10, len, 2); return { img: c, ox: 0, oy: 14 };
  };

  /* semak kecil, bunga, rumput: stempel langsung ke kanvas latar */
  art.grassTuft = function (x, a, b, rng, pal) {
    const c = pal || ['#2f6a2c', '#4a8a3a', '#7ab85a']; rc(x, c[0], a, b, 1, 3); rc(x, c[1], a + 1, b - 1, 1, 4); rc(x, c[2], a + 2, b, 1, 3); if (rng() < .5) rc(x, c[1], a - 1, b + 1, 1, 2)
  };
  art.flower = function (x, a, b, col) { rc(x, '#3a7a34', a, b + 1, 1, 3); rc(x, col, a - 1, b - 1, 3, 3); rc(x, '#fff3b0', a, b, 1, 1) };
  art.pebbles = function (x, a, b, rng) { for (let i = 0; i < 3; i++) { const ox = a + rng() * 9 - 4, oy = b + rng() * 5 - 2; rc(x, '#6a6a72', ox, oy, 3, 2); rc(x, '#a8a8b2', ox, oy, 2, 1) } };
})();

/* =====================================================================
   LORONG DUNGEON â€” ruangan lorong antara Lobby dan pintu keluar ke Hutan
   Alur: Lobby (pintu selatan) -> LORONG -> pintu di ujung lorong -> Hutan Bisikan
         Hutan (pintu bukit) -> LORONG (ujung selatan) -> pintu utara -> Lobby
   ===================================================================== */
(function () {
  'use strict';
  const { E, mkRng, mkCv, rc, ell, hash, vnoise, h2r, mixc, person } = WORLD, AREAS = WORLD.AREAS, SEQ = WORLD.SEQ, TR = WORLD.TR;
  if (!SEQ || !SEQ.toForest || !SEQ.toLobby) return;
  const CW = 720, CH = 560, CX = 360;
  const ND = { x: CX, y: 26 }, SD = { x: CX, y: 500 };            // pintu utara (ke Lobby) & selatan (ke Hutan): y = tepi atas bukaan pintu (tinggi 32)
  const C = AREAS.corridor = { name: 'LORONG DUNGEON', sub: 'Dungeon Passage', w: CW, h: CH, spawn: [CX, 112], ready: 0, objs: [], dyn: [], npcs: [], walls: [], bg: null, inO: 0, outO: 0, torches: [], eyes: [], ff: [], fires: [], _L: [] };
  const inOpen = (x, y) => (x >= 256 && x < 464 && y >= 58 && y < 500) || (x >= 208 && x < 256 && y >= 170 && y < 240) || (x >= 464 && x < 512 && y >= 330 && y < 400) || (x >= 156 && x < 256 && y >= 396 && y < 492);   // lorong utama, 2 ceruk patung/peti mati, dan pos perkemahan

  /* ---------- pembuatan ruangan (sekali) ---------- */
  C.build = function () {
    const rng = mkRng(77), [bg, x] = mkCv(CW, CH); C.bg = bg;
    const walls = C.walls = [], objs = C.objs = [];
    C.npcs = []; C.torches = []; C.eyes = []; C.fires = []; C.ff = [];
    const N = CW * CH, op = new Uint8Array(N), BIG = 999;
    for (let yy = 0; yy < CH; yy++) for (let xx = 0; xx < CW; xx++) op[yy * CW + xx] = inOpen(xx, yy) ? 1 : 0;
    const dt = (val) => {   // jarak chessboard ke piksel bernilai val
      const out = new Float32Array(N); for (let i = 0; i < N; i++) out[i] = op[i] === val ? 0 : BIG;
      for (let yy = 0; yy < CH; yy++) for (let xx = 0; xx < CW; xx++) { const i = yy * CW + xx; let v = out[i]; if (v === 0) continue; if (xx > 0) v = Math.min(v, out[i - 1] + 1); if (yy > 0) { v = Math.min(v, out[i - CW] + 1); if (xx > 0) v = Math.min(v, out[i - CW - 1] + 1); if (xx < CW - 1) v = Math.min(v, out[i - CW + 1] + 1) } out[i] = v }
      for (let yy = CH - 1; yy >= 0; yy--) for (let xx = CW - 1; xx >= 0; xx--) { const i = yy * CW + xx; let v = out[i]; if (v === 0) continue; if (xx < CW - 1) v = Math.min(v, out[i + 1] + 1); if (yy < CH - 1) { v = Math.min(v, out[i + CW] + 1); if (xx < CW - 1) v = Math.min(v, out[i + CW + 1] + 1); if (xx > 0) v = Math.min(v, out[i + CW - 1] + 1) } out[i] = v }
      return out;
    };
    const dWall = dt(1), dFloor = dt(0);
    const RK0 = h2r('#13101b'), RK1 = h2r('#262033'), B0 = h2r('#1f1a2c'), B1 = h2r('#3a3150'), BM = h2r('#0e0b16'), F0 = h2r('#2c2838'), F1 = h2r('#403a52'), FM = h2r('#1a1724'), CP = h2r('#5a1020'), CPD = h2r('#2a060e'), CPL = h2r('#7a1c30'), GOLD = h2r('#a8843a'), RIM = h2r('#6a5f86');
    const id = x.createImageData(CW, CH), d = id.data;
    for (let yy = 0; yy < CH; yy++) for (let xx = 0; xx < CW; xx++) {
      const i = yy * CW + xx, o4 = i * 4; let c;
      if (op[i]) {                                           // lantai batu + karpet merah
        const row = (yy / 16) | 0, off = (row & 1) * 11, col = ((xx + off) / 22) | 0, sh = hash(col, row, 5), mort = yy % 16 === 0 || (xx + off) % 22 === 0, cd = Math.abs(xx - CX);
        c = mixc(F0, F1, sh * .75 + vnoise(xx / 6, yy / 6, 6) * .25); if (mort) c = FM;
        if (yy >= 60 && yy < 498 && cd < 30) {
          c = mixc(CP, CPL, vnoise(xx / 3, yy / 3, 7) * .25);
          if (cd >= 27) c = CPD; else if (cd >= 24 && cd < 26) c = GOLD;
          else { const ddy = ((yy - 60) % 26) - 13, m = cd + Math.abs(ddy); if (m < 9 && cd < 22) c = m < 5 ? CPL : mixc(CP, CPL, .55) }
          if (yy < 63 || yy >= 495) c = ((xx + yy) & 1) ? GOLD : CPD;
        }
        const ao = dFloor[i]; if (ao < 10) { const k = 1 - (10 - ao) / 10 * .55; c = [c[0] * k, c[1] * k, c[2] * k] }
      } else {                                               // dinding bata & batuan
        const dd = dWall[i], lim = (yy < 80 || yy > 480) ? 46 : 28;
        if (dd <= lim) {
          const row = (yy / 6) | 0, mort = yy % 6 === 0 || (xx + (row & 1) * 5) % 11 === 0, n = vnoise(xx / 6, yy / 4, 31);
          c = mixc(B0, B1, n); if (mort) c = BM; const k = .55 + .45 * (1 - dd / lim); c = [c[0] * k, c[1] * k, c[2] * k];
          if (dd <= 1) c = RIM;
        } else c = mixc(RK0, RK1, vnoise(xx / 18, yy / 14, 3) * .6 + vnoise(xx / 5, yy / 5, 4) * .4);
      }
      d[o4] = c[0]; d[o4 + 1] = c[1]; d[o4 + 2] = c[2]; d[o4 + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    const K = '#09060f';
    // bingkai pintu utara (ke Lobby) & selatan (ke Hutan)
    rc(x, K, CX - 29, ND.y - 7, 58, 39); rc(x, '#4a4260', CX - 28, ND.y - 6, 56, 38); rc(x, '#6a5f86', CX - 28, ND.y - 6, 56, 1);
    for (let i = 0; i < 9; i++) { rc(x, i % 2 ? '#5a5272' : '#4a4260', CX - 28 + i * 6, ND.y - 5, 5, 6); rc(x, K, CX - 28 + i * 6 + 5, ND.y - 5, 1, 6) }
    rc(x, '#07060c', CX - 22, ND.y, 44, 32);
    rc(x, K, CX - 27, SD.y - 1, 54, 41); rc(x, '#4a4260', CX - 26, SD.y, 52, 40); rc(x, '#6a5f86', CX - 26, SD.y + 38, 52, 1); rc(x, '#07060c', CX - 22, SD.y, 44, 32);
    // spanduk merah di dinding utara
    [-52, 52].forEach(dx => { const bx = CX + dx; rc(x, K, bx - 8, 16, 16, 3); rc(x, '#7a6a50', bx - 7, 17, 14, 1); for (let xx = -5; xx < 5; xx++) { const h = 26 - (xx % 3 === 0 ? 4 : xx % 2 ? 2 : 0); rc(x, K, bx + xx, 19, 1, h + 1); rc(x, xx < -1 ? '#9a1830' : xx < 2 ? '#7a1020' : '#520a16', bx + xx, 19, 1, h) } rc(x, '#c8a050', bx - 1, 26, 2, 8); rc(x, '#c8a050', bx - 3, 29, 6, 2) });
    // dudukan obor (api digambar hidup di drawFront)
    const sconce = (a, b) => { rc(x, K, a - 4, b, 9, 8); rc(x, '#5a5060', a - 2, b + 1, 5, 2); rc(x, K, a - 5, b - 6, 11, 7); rc(x, '#3a3048', a - 4, b - 5, 9, 5); rc(x, '#7a6a98', a - 4, b - 5, 9, 1); C.torches.push([a, b - 6]) };
    [96, 280, 372].forEach(b => sconce(252, b)); sconce(161, 440);[96, 200, 290, 470].forEach(b => sconce(468, b)); sconce(CX - 36, 52); sconce(CX + 36, 52);
    // retakan lantai, puing, tulang, sarang laba-laba
    for (let i = 0; i < 9; i++) { let a = 266 + rng() * 188, b = 70 + rng() * 410; if (Math.abs(a - CX) < 34) continue; const L = 6 + rng() * 14; for (let k = 0; k < L; k++) { rc(x, '#12101a', a, b, 1, 1); a += (rng() - .5) * 2; b += .8 } }
    for (let i = 0; i < 16; i++) { const a = 264 + rng() * 192, b = 70 + rng() * 420; if (Math.abs(a - CX) < 34) continue; rc(x, '#1a1724', a, b + 1, 4, 2); rc(x, '#4a4560', a, b, 3, 2); rc(x, '#625c78', a, b, 1, 1) }
    [[320, 466], [442, 120], [268, 96]].forEach(([a, b]) => { rc(x, '#cfc6d8', a, b, 5, 1); rc(x, '#cfc6d8', a - 1, b - 1, 1, 3); rc(x, '#cfc6d8', a + 5, b - 1, 1, 3); rc(x, K, a + 8, b - 2, 6, 5); rc(x, '#d8d0e0', a + 9, b - 1, 4, 3); rc(x, K, a + 10, b, 1, 1); rc(x, K, a + 12, b, 1, 1) });
    [[258, 62, 1], [462, 62, -1]].forEach(([a, b, s]) => { for (let k = 0; k < 14; k++) { rc(x, 'rgba(220,215,235,.35)', a + s * k, b + k * .6, 1, 1); rc(x, 'rgba(220,215,235,.3)', a + s * k * .5, b + k, 1, 1) } for (let k = 0; k < 10; k++) rc(x, 'rgba(220,215,235,.25)', a + s * k, b + 4 + k * .5, 1, 1) });
    // pos perkemahan: tikar anyaman & bekas api unggun
    ell(x, '#1a1008', 206, 455, 40, 28); ell(x, '#5a3a24', 206, 454, 38, 26); ell(x, '#7a4a2c', 206, 454, 33, 22); ell(x, '#5a3a24', 206, 454, 27, 17); ell(x, '#8a5a34', 206, 454, 21, 12); ell(x, '#5a3a24', 206, 454, 15, 8);
    for (let a = 0; a < 6.283; a += .12) rc(x, '#a8843a', 206 + Math.cos(a) * 33, 454 + Math.sin(a) * 22, 1, 1);
    ell(x, '#120c08', 206, 457, 15, 8);
    // lingkaran rune pudar di tengah karpet
    for (let a = 0; a < 6.283; a += .05) { rc(x, 'rgba(200,160,70,.5)', CX + Math.cos(a) * 36, 290 + Math.sin(a) * 28, 1, 1); if ((a * 10 | 0) % 4 === 0) rc(x, 'rgba(200,160,70,.7)', CX + Math.cos(a) * 41, 290 + Math.sin(a) * 32, 1, 1) }
    rc(x, 'rgba(200,160,70,.55)', CX - 1, 280, 2, 20); rc(x, 'rgba(200,160,70,.55)', CX - 8, 289, 16, 2);
    /* --- objek berdiri: pilar, patung, peti mati batu, peti kayu, tong --- */
    const Z1 = '#1d1729', Z2 = '#292139', Z3 = '#382e4e', Z4 = '#4c4068';
    const spr = (s, px, py, solid, sy) => { objs.push({ img: s.img, x: px, y: sy === undefined ? py : sy, ox: s.ox, oy: s.oy, dy: py }); if (solid) walls.push(solid) };
    const pillar = () => { const [c, q] = mkCv(22, 58); ell(q, 'rgba(0,0,0,.35)', 11, 55, 10, 3); rc(q, K, 3, 46, 16, 10); rc(q, '#4a4262', 4, 47, 14, 8); rc(q, '#6a5f86', 4, 47, 14, 1); rc(q, K, 5, 8, 12, 40); rc(q, '#3a3250', 6, 8, 10, 39); rc(q, '#4e4668', 6, 8, 3, 39); rc(q, '#262034', 13, 8, 3, 39); rc(q, '#2c2640', 10, 10, 1, 36); rc(q, K, 2, 2, 18, 8); rc(q, '#4a4262', 3, 3, 16, 6); rc(q, '#6a5f86', 3, 3, 16, 1); return { img: c, ox: 11, oy: 55 } };
    const knight = () => {
      const [c, q] = mkCv(28, 58); ell(q, 'rgba(0,0,0,.35)', 14, 55, 12, 3);
      rc(q, K, 2, 46, 24, 10); rc(q, '#4a4262', 3, 47, 22, 8); rc(q, '#6a5f86', 3, 47, 22, 1);
      rc(q, K, 8, 32, 12, 15); rc(q, '#5a5470', 9, 33, 10, 13); rc(q, K, 7, 16, 14, 18); rc(q, '#6a6482', 8, 17, 12, 16); rc(q, '#8a84a2', 8, 17, 3, 16); rc(q, '#4a4560', 17, 17, 3, 16);
      rc(q, K, 5, 16, 18, 4); rc(q, '#8a84a2', 6, 17, 16, 2);
      rc(q, K, 9, 4, 11, 13); rc(q, '#6a6482', 10, 5, 9, 11); rc(q, '#8a84a2', 10, 5, 3, 11); rc(q, '#07060c', 11, 9, 7, 2); rc(q, '#ff4a5e', 12, 9, 1, 1); rc(q, '#ff4a5e', 16, 9, 1, 1); rc(q, K, 13, 0, 3, 6); rc(q, '#7a1626', 14, 0, 1, 6);
      rc(q, K, 22, 14, 4, 34); rc(q, '#a8a4b8', 23, 15, 2, 31); rc(q, K, 19, 24, 9, 3); rc(q, '#8a7a50', 20, 25, 7, 1);
      rc(q, K, 1, 20, 8, 15); rc(q, '#4a2a6a', 2, 21, 6, 13); rc(q, '#a8843a', 4, 23, 2, 8); rc(q, '#a8843a', 3, 26, 4, 2);
      return { img: c, ox: 14, oy: 54 };
    };
    const coffin = () => { const [c, q] = mkCv(44, 30); ell(q, 'rgba(0,0,0,.35)', 22, 26, 20, 3); rc(q, K, 1, 8, 42, 18); rc(q, '#3a3250', 2, 9, 40, 16); rc(q, '#4e4668', 2, 9, 40, 2); rc(q, '#262034', 2, 22, 40, 3); rc(q, K, 0, 4, 44, 6); rc(q, '#5a5272', 1, 5, 42, 4); rc(q, '#7a7092', 1, 5, 42, 1); rc(q, '#2c2640', 8, 11, 28, 1); rc(q, '#a8843a', 21, 12, 2, 9); rc(q, '#a8843a', 18, 14, 8, 2); return { img: c, ox: 22, oy: 26 } };
    const crate = () => { const [c, q] = mkCv(22, 24); ell(q, 'rgba(0,0,0,.35)', 11, 21, 10, 3); rc(q, K, 1, 2, 20, 19); rc(q, '#6a4a2a', 2, 3, 18, 17); rc(q, '#8a6238', 2, 3, 18, 2); rc(q, '#3e2a16', 2, 11, 18, 2); rc(q, '#3e2a16', 10, 3, 2, 17); rc(q, '#a8843a', 3, 4, 2, 2); rc(q, '#a8843a', 16, 17, 2, 2); return { img: c, ox: 11, oy: 20 } };
    const barrel = () => { const [c, q] = mkCv(18, 26); ell(q, 'rgba(0,0,0,.35)', 9, 23, 8, 3); rc(q, K, 1, 3, 16, 19); rc(q, '#6a4a2a', 2, 4, 14, 17); rc(q, '#8a6238', 3, 4, 3, 17); rc(q, '#3e2a16', 12, 4, 4, 17); rc(q, '#3a3548', 1, 8, 16, 2); rc(q, '#3a3548', 1, 16, 16, 2); rc(q, K, 2, 1, 14, 4); rc(q, '#8a6238', 3, 2, 12, 2); return { img: c, ox: 9, oy: 22 } };
    const PIL = pillar();[128, 290, 440].forEach(b => { spr(PIL, 272, b, [265, b - 4, 14, 6]); spr(PIL, 448, b, [441, b - 4, 14, 6]) });
    const KN = knight(); spr(KN, 232, 232, [219, 226, 26, 8]); C.eyes.push([232 - 14 + 12, 232 - 54 + 9], [232 - 14 + 16, 232 - 54 + 9]);
    spr(coffin(), 488, 392, [467, 384, 42, 10]);
    spr(crate(), 276, 478, [266, 472, 20, 8]); spr(crate(), 294, 486, [284, 480, 20, 8]); spr(barrel(), 448, 480, [440, 474, 16, 8]);
    const bedroll = () => { const [c, q] = mkCv(30, 16); ell(q, 'rgba(0,0,0,.3)', 15, 13, 14, 3); rc(q, K, 1, 3, 28, 11); rc(q, '#3a5a8a', 2, 4, 26, 9); rc(q, '#4a70a8', 2, 4, 26, 2); rc(q, '#2a4268', 2, 11, 26, 2); rc(q, K, 1, 2, 9, 8); rc(q, '#e8dcc0', 2, 3, 7, 6); rc(q, '#fff8e0', 2, 3, 7, 1); rc(q, '#2a4268', 17, 5, 1, 7); return { img: c, ox: 15, oy: 12 } };
    const campfire = () => { const [c, q] = mkCv(34, 22); ell(q, 'rgba(0,0,0,.3)', 17, 17, 15, 4); for (let a = 0; a < 6.283; a += .55) { const sx = 17 + Math.cos(a) * 13, sy = 12 + Math.sin(a) * 7; rc(q, K, sx - 3, sy - 2, 6, 5); rc(q, '#6a6478', sx - 2, sy - 1, 4, 3); rc(q, '#8a849a', sx - 2, sy - 1, 4, 1) } rc(q, K, 8, 9, 18, 5); rc(q, '#4a2e18', 9, 10, 16, 3); rc(q, '#6a4424', 9, 10, 16, 1); rc(q, K, 12, 6, 3, 8); rc(q, '#5a3a22', 13, 7, 1, 6); rc(q, K, 20, 6, 3, 8); rc(q, '#5a3a22', 21, 7, 1, 6); return { img: c, ox: 17, oy: 15 } };
    const rack = () => { const [c, q] = mkCv(34, 34); ell(q, 'rgba(0,0,0,.3)', 17, 31, 15, 3); rc(q, K, 1, 6, 32, 5); rc(q, '#5a3a22', 2, 7, 30, 3); rc(q, K, 1, 6, 4, 26); rc(q, '#5a3a22', 2, 7, 2, 24); rc(q, K, 29, 6, 4, 26); rc(q, '#5a3a22', 30, 7, 2, 24); rc(q, K, 1, 20, 32, 4); rc(q, '#5a3a22', 2, 21, 30, 2);[8, 14, 20].forEach((a, i) => { rc(q, K, a - 1, 0, 4, 28); rc(q, i === 1 ? '#a8a4b8' : '#8a7a50', a, 1, 2, 26); rc(q, i === 1 ? '#8a7a50' : '#a8a4b8', a - 1, i === 1 ? 20 : 1, 4, 3) }); rc(q, K, 23, 12, 9, 11); rc(q, '#7a1626', 24, 13, 7, 9); rc(q, '#a8843a', 26, 15, 3, 5); return { img: c, ox: 17, oy: 31 } };
    const sack = () => { const [c, q] = mkCv(34, 22); ell(q, 'rgba(0,0,0,.3)', 17, 18, 14, 3); rc(q, K, 2, 4, 14, 15); rc(q, '#8a6a42', 3, 5, 12, 13); rc(q, '#a8864e', 3, 5, 3, 13); rc(q, K, 6, 1, 6, 5); rc(q, '#6a4a2a', 7, 2, 4, 3); rc(q, K, 18, 8, 13, 11); rc(q, '#6a7a8a', 19, 9, 11, 9); rc(q, '#8a9aaa', 19, 9, 11, 2); rc(q, '#3a4452', 22, 12, 5, 3); return { img: c, ox: 17, oy: 19 } };
    spr(bedroll(), 184, 418, null, 410); spr(campfire(), 206, 457, [194, 451, 24, 10]); C.fires.push([206, 447]);
    spr(rack(), 272, 372, [259, 366, 26, 8]); spr(sack(), 238, 414, [224, 410, 28, 7]);
    // NPC yang sedang beristirahat
    const addN = o => { C.npcs.push(o); objs.push({ n: o, i: C.npcs.length - 1, get x() { return o.x }, get y() { return o.y }, ox: 0, oy: 0 }); return o };
    addN({
      n: 'Sera, Tabib Pengembara', x: 236, y: 456, fc: -1, sit: 1, fresh: 1, rng: 44, cd: -99, verb: 'Bicara', sk: '#e8c0a0', hair: '#5a3a1a', hs: 'long', hat: 'hood', hc: '#2f6a4a', c1: '#2f8a5a', c2: '#e8e4d8', c3: '#2a3a30', apron: '#e8e4d8', prop: 'bottle', pc: '#5ad06a',
      get lines() { return t - this.cd < 25 ? ['Istirahatlah dulu, lukamu tidak separah itu. Tehnya masih hangat, kok.'] : ['Duduk, duduk. Kau terlihat baru keluar dari Aula Kuno. Minumlah ramuan hangat ini.', 'Aku Sera, tabib pengembara. Lorong ini satu-satunya tempat di dungeon yang aman untuk berhenti, monster tak pernah berani dekat api unggun ini.'] },
      act() { this.fresh = 0; if (t - this.cd < 25) return; this.cd = t; p.hp = mhp(); p.st = 100; p.sc = [0, 0, 0]; p.ec = 0; try { SFX.potion(); SFX.focus() } catch (e) { } fx.push({ k: 'ring', x: p.x, y: p.y, r: 20, w: 3, life: .5, max: .5, col: '#ffd9a0' }, { k: 'gl', x: p.x, y: p.y, r: 40, c: '255,200,120', life: .5, max: .5 }); dn(p.x, p.y - 14, 'HP & Stamina pulih', 0, '#ffd9a0') }
    });
    addN({
      n: 'Borin, Prajurit Letih', x: 184, y: 418, fc: 1, sit: 0, rng: 40, sk: '#d9a07a', hair: '#3a2a1a', hat: 'helm', armor: 1, beard: '#3a2a1a', c1: '#4b5aa0', c2: '#c2a06b', c3: '#3a3d48', prop: 'spear',
      lines: ['Zzz... hah?! Aku tidak tidur! Aku cuma... memejamkan mata dengan sungguh-sungguh.', 'Aku Borin, bekas pengawal ekspedisi. Kami menembus Aula Kuno tiga hari lalu. Teman-temanku sudah pulang ke desa, aku malah ketiduran di sini.', 'Hati-hati di lantai bawah. Morvath si Banteng Abyss tidak kenal ampun. Tapi kalau kau tumbang, setidaknya kau terbangun lagi di lobby.']
    });
    addN({
      n: 'Lyra, Penyihir Magang', x: 438, y: 176, fc: -1, sit: 1, rng: 40, sk: '#e8c0a0', hair: '#7a3a8a', hs: 'long', c1: '#4a3a8a', c2: '#c8a0ff', c3: '#2a2040', prop: 'scroll',
      lines: ['Sst! Aku sedang membaca. Naskah ini tentang Abyss, tulisannya kuno sekali.', 'Katanya cahaya lentera desa menjaga bisikan Abyss tetap jauh. Makanya hutan di luar terasa tenang.', 'Kalau kau menemukan gulungan bertanda rune merah di dungeon, bawa padaku ya. Aku penasaran sekali!']
    });
    /* rutinitas harian NPC: tiap langkah = jalan ke titik (go) atau melakukan sesuatu (act) selama dur detik */
    const FE = [236, 456], FW = [176, 458], FN = [206, 434], FS = [207, 479], BED = [184, 418], SK = [238, 424], NOOK = [438, 176], RUNE = [360, 292];
    const [sera, borin, lyra] = C.npcs;
    sera.routine = [
      { act: 'drink', sit: 1, fc: -1, dur: [9, 12] },                 // duduk menyeruput teh hangat
      { act: 'warm', sit: 1, fc: -1, dur: [6, 8] },                   // menghangatkan tangan
      { go: [[238, 440], SK], fc: -1 },
      { act: 'tend', fc: -1, dur: [6, 9] },                           // memilah ramuan & herbal
      { go: [[222, 436], FN], fc: 1 },
      { act: 'feed', fc: 1, dur: [4.5, 5.5] },                        // menambah kayu ke api unggun
      { go: [[230, 446], FE], fc: -1 }
    ];
    borin.routine = [
      { act: 'sleep', dur: [24, 34] },                                // tidur pulas di kantong tidur
      { act: 'stretch', sit: 1, yawn: 1, closed: 1, dur: [3, 3.6] },  // bangun, menguap & meregangkan badan
      { go: [[184, 434], FW], fc: 1 },
      { act: 'warm', sit: 1, fc: 1, dur: [9, 13] },                   // menghangatkan diri di api unggun
      { act: 'doze', sit: 1, fc: 1, closed: 1, droop: 1, dur: [8, 11] }, // mengantuk, kepala terangguk-angguk
      { go: [[178, 436], BED], fc: 1 }
    ];
    lyra.routine = [
      { act: 'read', sit: 1, fc: -1, dur: [16, 22] },                 // membaca naskah di bawah obor
      { go: [[418, 200], [384, 262], RUNE], fc: 1 },
      { act: 'read', fc: 1, dur: [6, 8] },                            // mencocokkan naskah dengan rune di lantai
      { act: 'shiver', fc: 1, shiver: 1, dur: [2.5, 3.2] },           // kedinginan
      { go: [[330, 350], [300, 430], [300, 462], [262, 462], [240, 474], FS], fc: 1 },
      { act: 'warm', fc: 1, dur: [9, 12] },                           // menghangatkan diri di api unggun
      { go: [[240, 474], [262, 462], [300, 462], [300, 430], [330, 350], [392, 270], [420, 200], NOOK], fc: -1 }
    ];
    C.npcs.forEach(n => { n._ri = 0; beginStep(n) });
    objs.sort((a, b) => a.y - b.y);
    // dinding & lantai tidak boleh ditembus
    walls.push([0, 0, CW, 56], [0, 0, 256, 170], [0, 170, 208, 70], [0, 240, 256, 156], [0, 396, 156, 96], [0, 492, 256, CH - 492], [464, 0, 256, 330], [512, 330, 208, 70], [464, 400, 256, CH - 400], [0, 508, CW, CH - 508]);
    // debu melayang
    for (let i = 0; i < 28; i++) C.ff.push({ x: 268 + rng() * 184, y: 70 + rng() * 420, sp: 2 + rng() * 4, ph: rng() * 6 });
  };
  C.enter = function () { };

  /* ---------- rutinitas NPC lorong ---------- */
  const OL = '#120e18', FIREP = [206, 447];
  function beginStep(n) {
    const s = n.routine[n._ri % n.routine.length]; n._s = s;
    n._closed = s.closed ? 1 : 0; n._yawn = s.yawn ? 1 : 0; n._droop = s.droop ? 1 : 0; n._shiver = s.shiver ? 1 : 0; n._fed = 0;
    if (s.go) { n._wp = s.go.map(q => q.slice()); n._act = 'walk'; n.sit = 0 }
    else { n._act = s.act; n.sit = s.sit ? 1 : 0; n._tmax = n._tm = s.dur[0] + Math.random() * (s.dur[1] - s.dur[0]); n.spd = 0; n.mv = 0; if (s.fc) n.fc = s.fc }
  }
  function nextStep(n) { n._ri++; beginStep(n) }
  function npcTick(dt) {
    dt = Math.min(dt, .05); C.boost = Math.max(0, (C.boost || 0) - dt * .5);
    for (const n of C.npcs) {
      if (!n.routine) continue;
      if (dlg && dlg.n === n) {                                   // sedang diajak bicara: berhenti, buka mata, hadap pemain
        if (n._act === 'sleep') nextStep(n);                      // yang tidur terbangun kaget
        if (n._act !== 'talk') { n._prev = n._act; n._act = 'talk'; n._closed = n._yawn = n._droop = n._shiver = 0 }
        n.spd = 0; n.mv = 0; continue;
      }
      if (n._act === 'talk') n._act = n._prev;
      const s = n._s;
      if (s.go) {
        const w = n._wp[0], dx = w[0] - n.x, dy = w[1] - n.y, d = Math.hypot(dx, dy), sp = 26;
        if (d < 1.5) { n._wp.shift(); if (!n._wp.length) { n.spd = 0; n.mv = 0; if (s.fc) n.fc = s.fc; nextStep(n) } }
        else { const m = Math.min(d, sp * dt); n.x += dx / d * m; n.y += dy / d * m; n.spd = sp; n.mv = 1; n._ph = (n._ph || 0) + sp * dt * .34; if (Math.abs(dx) > 1.5) n.fc = dx > 0 ? 1 : -1 }
      } else {
        n.spd = 0; n.mv = 0; n._tm -= dt;
        const dr = (n.fc || 1) > 0 ? 1 : -1;
        if (n._act === 'drink' && Math.random() < dt * 5) dp.push({ k: 'p', x: n.x + dr * 12, y: n.y - 14, vx: (Math.random() - .5) * 4, vy: -9 - Math.random() * 6, life: 1.1, max: 1.1, s: 1.5, c: '#dfe6f0' });
        if (n._act === 'feed' && !n._fed && n._tm < n._tmax * .5) {
          n._fed = 1; C.boost = 1;
          for (let k = 0; k < 10; k++) dp.push({ k: 'p', x: FIREP[0] + (Math.random() - .5) * 10, y: FIREP[1] - 6, vx: (Math.random() - .5) * 46, vy: -30 - Math.random() * 34, life: .9, max: .9, s: 2, c: Math.random() < .5 ? '#ffb050' : '#ff7a2a' });
        }
        if ((n._act === 'warm' || n._act === 'doze') && Math.random() < dt * 1.5) dp.push({ k: 'p', x: FIREP[0] + (Math.random() - .5) * 8, y: FIREP[1] - 8, vx: (Math.random() - .5) * 10, vy: -22 - Math.random() * 14, life: .8, max: .8, s: 1.5, c: '#ffb050' });
        if (n._tm <= 0) nextStep(n);
      }
    }
  }
  function drawSleep(n, i) {   // orang tidur telentang di kantong tidur, dada naik-turun saat bernapas
    const x = Math.round(n.x), y = Math.round(n.y), br = Math.round((Math.sin((t + i) * 1.5) + 1) / 2), snore = ((t * .45 + i) % 2) < .7, Q = [];
    const r = (a, b, w, h, c, o) => Q.push([a, b, w, h, c, o !== 0]);
    r(-24, -5, 8, 5, '#9aa0ae'); r(-24, -5, 8, 1, '#d8dde8', 0); r(-22, -8, 3, 3, '#a33b4c'); r(-23, -1, 6, 1, 'rgba(0,0,0,.25)', 0);   // helm di samping bantal
    r(13, -6, 5, 5, '#241a14'); r(13, -6, 5, 1, '#3a2c22', 0);                                                                        // ujung sepatu
    r(-5, -9 - br, 19, 9 + br, '#4a70a8'); r(-5, -9 - br, 19, 2, '#6a90c8', 0); r(-5, -2, 19, 2, '#2a4268', 0); r(2, -8 - br, 1, 7, '#3a5a8a', 0);   // selimut
    r(-13, -11, 9, 3, n.hair || '#3a2a1a'); r(-12, -9, 8, 6, n.sk || '#d9a07a');
    r(-11, -7, 2, 1, '#3a2418', 0); r(-8, -7, 2, 1, '#3a2418', 0);                                                                     // mata terpejam
    if (n.beard) r(-12, -5, 8, 3, n.beard); r(-10, -4, 3, snore ? 2 : 1, '#2a1410', 0);
    g.fillStyle = OL; Q.forEach(q => q[5] && g.fillRect(x + q[0] - 1, y + q[1] - 1, q[2] + 2, q[3] + 2));
    Q.forEach(q => { g.fillStyle = q[4]; g.fillRect(x + q[0], y + q[1], q[2], q[3]) });
  }

  /* ---------- update: pintu utara (Lobby) & selatan (Hutan) ---------- */
  C.tick = function (dt) {
    npcTick(dt);
    if (TR.on) return;
    const F = AREAS.forest; if (!F.ready && p.y > 300) { F.ready = 1; F.build() }       // siapkan Hutan sebelum keluar
    if (TR.cool > 0 || dlg) return;
    if (p.y < ND.y + 58 && Math.abs(p.x - CX) < 22 && p.vy < -6) { p.y = ND.y + 58; p.vy = 0; WORLD.start('corridorToLobby', { x0: p.x, y0: p.y }); msg('Kau kembali ke Lobby...'); return }
    if (p.y > SD.y - 6 && Math.abs(p.x - CX) < 24 && p.vy > 6) { p.y = SD.y - 6; p.vy = 0; WORLD.start('corridorToForest', { x0: p.x, y0: p.y }); msg('Kau melangkah keluar dari Dungeon...') }
  };

  /* ---------- gambar ---------- */
  function lightL(a, b, rr, col, al) { g.save(); g.globalCompositeOperation = 'lighter'; const q = g.createRadialGradient(a, b, 0, a, b, rr); q.addColorStop(0, 'rgba(' + col + ',' + al + ')'); q.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = q; g.fillRect(a - rr, b - rr, rr * 2, rr * 2); g.restore() }
  function drawDoor(cx, y0, o, cols, spill, dir) {
    const w = 44, h = 32, x0 = cx - w / 2, R = (c, a, b, ww, hh) => { g.fillStyle = c; g.fillRect(a, b, ww, hh) };
    R('#07060c', x0, y0, w, h);
    if (o > .02) cols.forEach((c, i) => R('rgb(' + (7 + (c[0] - 7) * o | 0) + ',' + (6 + (c[1] - 6) * o | 0) + ',' + (12 + (c[2] - 12) * o | 0) + ')', x0 + i * 4, y0 + i * 3, w - i * 8, h - i * 3));
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); const off = Math.round(o * 22);
    [x0 - off, cx + off].forEach(a => { R('#5c5260', a, y0, 22, h); R('#7a7088', a, y0, 22, 1);[5, 11, 17].forEach(q => R('#3e3646', a + q, y0, 1, h)); R('#2e2836', a, y0 + 9, 22, 2); R('#2e2836', a, y0 + 21, 22, 2);[2, 19].forEach(q => { R('#9a8a60', a + q, y0 + 9, 1, 1); R('#9a8a60', a + q, y0 + 21, 1, 1) }); R('#1e1a24', a, y0 + h - 1, 22, 1) });
    if (off < 3) { R('#9a8a60', cx - 1, y0, 2, h); R('#b8a070', cx - 3, y0 + 13, 6, 7) }
    g.restore();
    if (o > .02) { g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 28; k++) { const tt = k / 28, half = Math.round(20 + tt * 34), a = Math.round(.22 * o * (1 - tt) * 25) / 25, yy = dir > 0 ? y0 + h + k * 2 : y0 - k * 2 - 2; if (a > 0) { g.fillStyle = 'rgba(' + spill + ',' + a + ')'; g.fillRect(cx - half, yy, half * 2, 2) } } g.restore() }
  }
  const WARM = [[120, 70, 30], [205, 122, 52], [255, 192, 112], [255, 232, 170]], DAY = [[70, 110, 50], [130, 190, 100], [200, 235, 160], [245, 255, 215]];
  C.env = function () { drawDoor(ND.x, ND.y, C.inO, WARM, '255,205,140', 1); drawDoor(SD.x, SD.y, C.outO, DAY, '220,255,190', -1) };
  function drawObj(o) { if (o.n) { if (o.n._act === 'sleep') drawSleep(o.n, o.i); else person(o.n, o.i); return } g.drawImage(o.img, o.x - o.ox, o.y - o.oy) }
  C.drawBack = function () {
    C.objs.sort((a, b) => a.y - b.y);   // NPC bergerak: urutkan ulang agar tumpang-tindih benar
    const x0 = camX - 40, x1 = camX + W / CAM_Z + 40, y0 = camY - 10, y1 = camY + H / CAM_Z + 90; C._L = [];
    for (const o of C.objs) { if (o.x < x0 || o.x > x1 || o.y < y0 || o.y - o.oy > y1) continue; C._L.push(o) }
    const py = p.y + 3; for (const o of C._L) if (o.y <= py) drawObj(o);
  };
  C.drawFront = function () {
    const py = p.y + 3; for (const o of C._L) if (o.y > py) drawObj(o);
    const vw = W / CAM_Z, vh = H / CAM_Z;
    g.font = '8px monospace';
    if (!dlg && !TR.on) { if (p.y < 130 && Math.abs(p.x - CX) < 50) txt('Kembali ke Lobby \u2191', CX, 96, '#ffe9a8', 'center'); if (p.y > 420 && Math.abs(p.x - CX) < 50) txt('Pintu keluar ke Hutan \u2193', CX, 490, '#ffe9a8', 'center') }
    // label NPC & prompt bicara
    for (const n of NP) { const d = dist(n, p); if (d < 90) { txt(n.n.split(',')[0], n.x, n.y - 28, '#ffe9a8', 'center'); if (d < (n.rng || 36) && !dlg) txt('[G] ' + (n.verb || 'Bicara'), n.x, n.y - 38, '#fff', 'center') } if (n.fresh && !dlg) { g.fillStyle = '#ffd34d'; g.fillRect(Math.round(n.x) - 1, Math.round(n.y - 36 + Math.sin(t * 4)), 3, 6); g.fillRect(Math.round(n.x) - 1, Math.round(n.y - 28 + Math.sin(t * 4)), 3, 2) } }
    // lorong remang: gelap, hanya diterangi obor
    g.fillStyle = 'rgba(6,4,14,.36)'; g.fillRect(camX - 4, camY - 4, vw + 8, vh + 8);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const q of C.torches) {
      const X = q[0], Y = q[1]; if (X < camX - 80 || X > camX + vw + 80 || Y < camY - 80 || Y > camY + vh + 80) continue;
      lightL(X, Y - 2, 74 + Math.sin(t * 9 + Y) * 4, '255,160,70', .34 + .05 * Math.sin(t * 13 + X + Y));
      for (let i = 0; i < 3; i++) { const h = Math.round(5 + Math.sin(t * 12 + i * 2 + Y) * 1.5 + (i === 1 ? 3 : 0)), a = X - 2 + i * 2; g.fillStyle = '#e8561f'; g.fillRect(a - 1, Y - h, 3, h + 1); g.fillStyle = '#ff9a3c'; g.fillRect(a, Y - h + 2, 1, h - 2); if (i === 1) { g.fillStyle = '#ffe28a'; g.fillRect(a, Y - 3, 1, 3) } }
      if (Math.random() < .05) dp.push({ k: 'p', x: X + (Math.random() - .5) * 4, y: Y - 6, vx: (Math.random() - .5) * 8, vy: -20 - Math.random() * 16, life: .8, max: .8, s: 1.5, c: Math.random() < .5 ? '#ffb050' : '#ff7a2a' });
    }
    for (const f of C.fires) {   // api unggun pos istirahat
      const X = f[0], Y = f[1], bs = C.boost || 0; lightL(X, Y, 100 + bs * 34 + Math.sin(t * 11) * 6, '255,150,60', .4 + bs * .18);
      for (let i = 0; i < 3; i++) { const h = Math.round(7 + Math.sin(t * 13 + i * 2) * 2 + (i === 1 ? 4 : 0) + bs * 5), a = X - 5 + i * 5; g.fillStyle = '#e8561f'; g.fillRect(a - 2, Y - h, 5, h + 2); g.fillStyle = '#ff9a3c'; g.fillRect(a - 1, Y - h + 2, 3, h - 1); g.fillStyle = '#ffe28a'; g.fillRect(a, Y - 4, 1, 3) }
      if (Math.random() < .12) dp.push({ k: 'p', x: X + (Math.random() - .5) * 8, y: Y - 6, vx: (Math.random() - .5) * 12, vy: -24 - Math.random() * 20, life: .8, max: .8, s: 1.5, c: Math.random() < .5 ? '#ffb050' : '#ff7a2a' });
    }
    lightL(CX, 290, 46, '220,170,80', .07 + .05 * Math.sin(t * 1.4));   // lingkaran rune berdenyut pelan
    for (const n of C.npcs) if (n._act === 'warm' || n._act === 'feed') lightL(n.x, n.y - 8, 30, '255,150,70', .16 + .05 * Math.sin(t * 11));   // wajah & tangan diterpa cahaya api
    for (const e of C.eyes) lightL(e[0], e[1], 7, '255,60,80', .5 + .25 * Math.sin(t * 2.4 + e[0]));
    lightL(p.x, p.y - 10, 70, '255,215,160', .1);
    for (const f of C.ff) { const X = f.x + Math.sin(t * .4 + f.ph) * 8, Y = 70 + ((f.y - 70 + t * f.sp) % 420), a = .18 + .3 * Math.max(0, Math.sin(t * 1.3 + f.ph)); if (X < camX - 4 || X > camX + vw + 4 || Y < camY - 4 || Y > camY + vh + 4) continue; g.fillStyle = 'rgba(255,225,180,' + a + ')'; g.fillRect(Math.round(X), Math.round(Y), 1, 1) }
    g.restore();
    // "Zzz" di atas NPC yang tertidur
    for (const n of C.npcs) { const sl = n._act === 'sleep'; if (!(sl || n._act === 'doze') || (dlg && dlg.n === n)) continue; g.textAlign = 'left'; for (let j = 0; j < 3; j++) { const k = (t * .5 + j / 3) % 1, a = Math.sin(k * Math.PI); g.font = 'bold ' + (6 + j * 2) + 'px monospace'; g.fillStyle = 'rgba(210,225,255,' + a + ')'; g.fillText('z', n.x + (sl ? -6 : 5) + k * 8 + j * 3, n.y - (sl ? 14 : 30) - k * 16) } g.font = '8px monospace' }
  };

  /* ---------- transisi: Lobby <-> Lorong <-> Hutan ---------- */
  const showB = () => { const b = WORLD.banner; b.t = 0; b.a = C.name; b.b = C.sub };
  const door = () => { try { SFX.door() } catch (e) { } };
  const walk = (dt, vy, mv) => { p.wb += ((mv ? 1 : 0) - p.wb) * Math.min(1, dt * 12); p.wph += dt * 12 * (.2 + p.wb * .8) * Math.max(1, Math.min(1.5, Math.abs(vy) / 85)); p.idt += dt * 3 };
  const _toForest = SEQ.toForest, _toLobby = SEQ.toLobby;
  // Lobby -> Lorong (pintu selatan Lobby tetap sama; setelah keluar pintu pahlawan muncul di ujung utara lorong)
  SEQ.toForest = {
    dur: 4.0, f(T, dt) {
      if (T < 1.0) { const r = _toForest.f(T, dt); TR.white = 0; return r }
      if (!TR.sw) { TR.sw = 1; TR.dO = 0; AREAS.forest.doorO = 0; WORLD.setArea('corridor'); p.x = CX; p.y = ND.y + 28; p.vx = p.vy = 0; p.face = Math.PI / 2; camInit = false; camUpd(0); C.inO = 1; C.outO = 0; showB(); TR.s2 = 0 }
      const u = T - 1.0; if (!TR.s2) { TR.s2 = 1; door() }
      C.inO = u < 1.6 ? 1 : 1 - E((u - 1.6) / .8);
      TR.hide = u < .35; TR.fade = 1 - E((u - .1) / .9); TR.white = 0;
      const k = E((u - .35) / 1.4); p.x = CX; p.y = ND.y + 28 + 56 * k; p.vx = 0; p.vy = 40 * (k > 0 && k < 1 ? 1 : 0); p.face = Math.PI / 2; walk(dt, 90, k > 0 && k < 1)
    }
  };
  // Lorong -> Hutan (pintu di ujung selatan lorong)
  SEQ.corridorToForest = {
    dur: 4.7, f(T, dt) {
      if (T < 1.0) {
        if (!TR.s1) { TR.s1 = 1; door() }
        C.outO = E(T / .45);
        p.x = TR.x0 + (CX - TR.x0) * E(T / .35); p.y = TR.y0 + (SD.y + 42 - TR.y0) * E((T - .3) / .7);
        p.vx = 0; p.vy = T > .3 ? 70 : 0; p.face = Math.PI / 2; walk(dt, 90, T > .3);
        TR.white = 1; TR.fade = E((T - .45) / .55); TR.hide = T > .85;
      } else {
        if (!TR.sw) { TR.sw = 1; C.outO = 0; WORLD.setArea('forest'); const F = AREAS.forest; p.x = F.door.x; p.y = F.door.y - 6; p.vx = p.vy = 0; camInit = false; camUpd(0); F.doorO = 1; const b = WORLD.banner; b.t = 0; b.a = F.name; b.b = F.sub; TR.s2 = 0 }
        SEQ.emerge.f(T - 1.0, dt)
      }
    }
  };
  // Hutan -> Lorong (masuk lewat pintu bukit; muncul di ujung selatan lorong)
  SEQ.toLobby = {
    dur: 3.3, f(T, dt) {
      if (T < .95) return _toLobby.f(T, dt);
      const F = AREAS.forest, sy = SD.y + 34;
      if (!TR.sw) { TR.sw = 1; F.doorO = 0; TR.hide = 1; WORLD.setArea('corridor'); p.x = CX; p.y = sy; p.vx = p.vy = 0; p.face = -Math.PI / 2; camInit = false; camUpd(0); C.outO = 1; C.inO = 0; showB(); TR.s2 = 0 }
      TR.fade = 1 - E((T - .95) / .6); TR.white = 0; TR.hide = T < 1.1;
      const k = E((T - 1.1) / 1.2); p.x = CX; p.y = sy - 66 * k; p.vx = 0; p.vy = (k > 0 && k < 1) ? -70 : 0; p.face = -Math.PI / 2; walk(dt, 90, k > 0 && k < 1);
      if (T >= 2.0 && !TR.s2) { TR.s2 = 1; door() }
      C.outO = T < 2.0 ? 1 : 1 - E((T - 2.0) / .6)
    }
  };
  // Lorong -> Lobby (pintu utara lorong)
  SEQ.corridorToLobby = {
    dur: 3.35, f(T, dt) {
      if (T < 1.0) {
        if (!TR.s1) { TR.s1 = 1; door() }
        C.inO = E(T / .45);
        p.x = TR.x0 + (CX - TR.x0) * E(T / .35); p.y = TR.y0 + (ND.y + 10 - TR.y0) * E((T - .3) / .7);
        p.vx = 0; p.vy = T > .3 ? -70 : 0; p.face = -Math.PI / 2; walk(dt, 90, T > .3);
        TR.white = 0; TR.fade = E((T - .45) / .55); TR.hide = T > .85;
      } else { C.inO = 0; _toLobby.f(T - 1.0 + .95, dt) }
    }
  };
})();