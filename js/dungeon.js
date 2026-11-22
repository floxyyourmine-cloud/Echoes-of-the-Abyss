/* ==========================================================================
   ECHOES OF THE ABYSS - DUNGEON & BOSS ROOMS MODULE
   Lava Rooms, Magma Dungeon, Boss Arena Morvath, Endless Colosseum, and Combat VFX.
   ========================================================================== */
/* ===== Arena Bos Level 2: Aula Obsidian Magma (satu tema dengan Morvath, berubah tiap bentuk) ===== */
let LBB = null, LCR = null, RUN = null;

function buildLavaBossBG() {
  const c = document.createElement('canvas');
  c.width = DW;
  c.height = DH;
  const b = c.getContext('2d');
  LBB = c;
  let sd = 21;
  const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, TAU = Math.PI * 2, cx = DW / 2, cy = DY;
  const px = (x, y, w, h, col) => { b.fillStyle = col; b.fillRect(Math.round(x), Math.round(y), w, h); };
  /* 1. lantai obsidian berubin */
  for (let y = 0; y < DH; y += 40)
    for (let x = 0; x < DW; x += 40) {
      const v = r();
      px(x, y, 40, 40, v < .33 ? '#1b1114' : v < .66 ? '#20141a' : '#171014');
      px(x, y, 40, 1, 'rgba(255,120,60,.10)');
      px(x, y, 1, 40, 'rgba(255,120,60,.07)');
      px(x, y + 39, 40, 1, 'rgba(0,0,0,.5)');
      px(x + 39, y, 1, 40, 'rgba(0,0,0,.5)');
      for (let i = 0; i < 3; i++)
        if (r() < .5)
          px(x + r() * 36, y + r() * 36, 2, 1, '#34202a');
    }
  /* 2. retakan lava memancar dari pusat */
  LCR = [];
  for (let i = 0; i < 22; i++) {
    let a = i / 22 * TAU + r() * .2, rad = 70 + r() * 30;
    const pts = [[cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * .95]], len = 4 + (r() * 5 | 0);
    for (let k = 0; k < len; k++) {
      a += (r() - .5) * .7;
      rad += 28 + r() * 30;
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * .9]);
    }
    LCR.push(pts);
  }
  b.lineCap = b.lineJoin = 'round';
  [[5, '#0c0506'], [3, '#c8300f'], [2, '#ff7a1f'], [.9, '#ffd34d']].forEach(([w, col]) => { b.strokeStyle = col; b.lineWidth = w; LCR.forEach(pts => { b.beginPath(); pts.forEach((q, i) => i ? b.lineTo(q[0], q[1]) : b.moveTo(q[0], q[1])); b.stroke(); }); });
  /* 3. panggung ritual: cakram, cincin lava, bintang & rune */
  const dk = b.createRadialGradient(cx, cy, 20, cx, cy, 196);
  dk.addColorStop(0, '#0e0709');
  dk.addColorStop(1, '#1a0f13');
  b.fillStyle = dk;
  b.beginPath();
  b.arc(cx, cy, 192, 0, TAU);
  b.fill();
  [
    [190, 5, '#0a0507'], [186, 2.5, '#ff7a1f'], [150, 4, '#0a0507'], [150, 1.5, '#c8300f'], [96, 4, '#0a0507'], [96, 1.5, '#ff7a1f'], [44, 5, '#0a0507'], [44, 2, '#ff9a2a']
  ].forEach(([rd, w, col]) => { b.strokeStyle = col; b.lineWidth = w; b.beginPath(); b.arc(cx, cy, rd, 0, TAU); b.stroke(); });
  b.strokeStyle = '#ff7a1f';
  b.lineWidth = 1.5;
  for (const pts of [8]) {
    b.beginPath();
    for (let i = 0; i <= 8; i++) {
      const a = i * 3 / 8 * TAU * 1 - Math.PI / 2, rd = 92;
      i ? b.lineTo(cx + Math.cos(a) * rd, cy + Math.sin(a) * rd) : b.moveTo(cx + Math.cos(a) * rd, cy + Math.sin(a) * rd);
    }
    b.stroke();
  }
  b.strokeStyle = '#c8300f';
  b.lineWidth = 1;
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU;
    b.beginPath();
    b.moveTo(cx + Math.cos(a) * 154, cy + Math.sin(a) * 154);
    b.lineTo(cx + Math.cos(a) * 182, cy + Math.sin(a) * 182);
    b.stroke();
  }
  RUN = [];
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU - Math.PI / 2, x = cx + Math.cos(a) * 168, y = cy + Math.sin(a) * 168;
    RUN.push([x, y]);
    b.save();
    b.translate(x, y);
    b.rotate(a + Math.PI / 2);
    b.strokeStyle = '#ff7a1f';
    b.lineWidth = 1.6;
    b.beginPath();
    const sg = [
      [[-4, -7], [-4, 7]], [[-4, -7], [4, -2]], [[4, -2], [-4, 2]], [[-4, 2], [4, 7]], [[4, -7], [4, 7]], [[-4, 0], [4, 0]], [[-4, 7], [4, 3]], [[0, -7], [0, 7]]
    ];
    sg.forEach((q, k) => {
      if (((i * 5 + k * 3) % 7) < 4) {
        b.moveTo(q[0][0], q[0][1]);
        b.lineTo(q[1][0], q[1][1]);
      }
    });
    b.stroke();
    b.restore();
  }
  b.strokeStyle = '#ff9a2a';
  b.lineWidth = 2;
  b.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU - Math.PI / 2;
    i ? b.lineTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30) : b.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30);
  }
  b.closePath();
  b.stroke();
  b.fillStyle = '#ff7a1f';
  b.beginPath();
  b.arc(cx, cy, 6, 0, TAU);
  b.fill();
  b.fillStyle = '#ffd34d';
  b.beginPath();
  b.arc(cx, cy, 3, 0, TAU);
  b.fill();
  /* batu pecahan & bara di lantai */
  for (let i = 0; i < 40; i++) {
    const x = 30 + r() * (DW - 60), y = 30 + r() * (DH - 60);
    if (Math.hypot(x - cx, y - cy) < 200)
      continue;
    px(x, y, 3 + r() * 4, 2 + r() * 3, '#0d0709');
    if (r() < .3)
      px(x + 1, y, 1, 1, '#ff7a1f');
  }
  /* 4. dinding obsidian dengan lava merembes */
  const wc = '#0e0709';
  px(0, 0, DW, 14, wc);
  px(0, DH - 14, DW, 14, wc);
  px(0, 0, 14, DH, wc);
  px(DW - 14, 0, 14, DH, wc);
  for (let x = 0; x < DW; x += 20) {
    px(x, 0, 1, 14, '#6a1d0a');
    px(x, DH - 14, 1, 14, '#6a1d0a');
  }
  for (let y = 0; y < DH; y += 20) {
    px(0, y, 14, 1, '#6a1d0a');
    px(DW - 14, y, 14, 1, '#6a1d0a');
  }
  px(0, 13, DW, 1, '#ff5a1f');
  px(0, DH - 14, DW, 1, '#ff5a1f');
  px(13, 0, 1, DH, '#ff5a1f');
  px(DW - 14, 0, 1, DH, '#ff5a1f');
  b.save();
  b.globalCompositeOperation = 'lighter';
  [[0, 14, 0, 48], [0, DH - 14, 0, DH - 48], [14, 0, 48, 0], [DW - 14, 0, DW - 48, 0]].forEach(([x0, y0, x1, y1], i) => {
    const q = b.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, 'rgba(255,90,20,.35)'); q.addColorStop(1, 'rgba(255,90,20,0)'); b.fillStyle = q; if (i < 2)
      b.fillRect(0, Math.min(y0, y1), DW, 34);
    else
      b.fillRect(Math.min(x0, x1), 0, 34, DH);
  });
  b.restore();
  /* obor lava di dinding & kuali di sudut */
  TO2.forEach(([x, y]) => { px(x - 3, y - 2, 6, 9, '#0a0507'); px(x - 2, y - 1, 4, 2, '#ff7a1f'); });
  BR2.forEach(([x, y]) => {
    const sx = x < cx ? 1 : -1, sy = y < cy ? 1 : -1;
    b.fillStyle = '#0c0608';
    for (let i = 0; i < 3; i++) {
      b.beginPath();
      b.moveTo(x + sx * (14 + i * 9), y + sy * 22);
      b.lineTo(x + sx * (22 + i * 9), y + sy * (22 - 22 - i * 5 - 8));
      b.lineTo(x + sx * (30 + i * 9), y + sy * 22);
      b.fill();
    }
    b.fillStyle = 'rgba(0,0,0,.5)';
    b.beginPath();
    b.ellipse(x + 3, y + 8, 16, 8, 0, 0, TAU);
    b.fill();
    px(x - 12, y - 4, 24, 14, '#0c0608');
    px(x - 10, y - 6, 20, 4, '#2a171a');
    b.fillStyle = '#ff7a1f';
    b.beginPath();
    b.ellipse(x, y - 6, 9, 3, 0, 0, TAU);
    b.fill();
    px(x - 12, y + 6, 24, 3, '#4a2a26');
  });
  /* 6. vignet & cahaya */
  const v = b.createRadialGradient(cx, cy, 220, cx, cy, 470);
  v.addColorStop(0, 'rgba(8,2,2,0)');
  v.addColorStop(1, 'rgba(8,2,2,.7)');
  b.fillStyle = v;
  b.fillRect(0, 0, DW, DH);
  b.save();
  b.globalCompositeOperation = 'lighter';
  const pool = (x, y, rd, col) => { const q = b.createRadialGradient(x, y, 0, x, y, rd); q.addColorStop(0, col); q.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = q; b.fillRect(x - rd, y - rd, rd * 2, rd * 2); };
  BR2.forEach(([x, y]) => pool(x, y, 130, 'rgba(255,120,40,.25)'));
  TO2.forEach(([x, y]) => pool(x, y, 55, 'rgba(255,120,40,.09)'));
  pool(cx, cy, 210, 'rgba(255,60,20,.13)');
  b.restore();
}
const _drawBR = draw;
draw = function () {
  if (lavaOn() && room == 2) {
    if (!LBB)
      buildLavaBossBG();
    BG = LBB;
  } _drawBR();
};
const _envFxBR = envFx;
envFx = function () {
  _envFxBR();
  if (!lavaOn() || room != 2 || !LCR)
    return;
  const ph = BOSS.ph || 1, pu = .5 + .5 * Math.sin(t * (1.6 + ph * .9)), cx = DW / 2, cy = DY, col = ph == 1 ? '255,140,50' : ph == 2 ? '255,95,30' : '255,45,20';
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = g.lineJoin = 'round';
  g.strokeStyle = 'rgba(' + col + ',' + (.08 + .1 * ph * pu) + ')';
  g.lineWidth = 4;
  LCR.forEach(pts => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); });
  g.strokeStyle = 'rgba(' + col + ',' + (.14 + .12 * ph * pu) + ')';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(cx, cy, 186, 0, 7);
  g.stroke();
  RUN.forEach((q, i) => { const w = .5 + .5 * Math.sin(t * (2 + ph) - i * .52), gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], 16); gr.addColorStop(0, 'rgba(' + col + ',' + (.25 + .5 * w) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = gr; g.fillRect(q[0] - 16, q[1] - 16, 32, 32); });
  g.fillStyle = 'rgba(' + col + ',' + (.05 + .05 * ph * pu) + ')';
  g.fillRect(14, 14, DW - 28, 30);
  g.fillRect(14, DH - 44, DW - 28, 30);
  if (ph == 3) {
    g.fillStyle = 'rgba(255,40,20,' + (.03 + .04 * pu) + ')';
    g.fillRect(0, 0, DW, DH);
  }
  const n = 14 + ph * 8;
  for (let i = 0; i < n; i++) {
    const sp = 14 + (i % 5) * 5, k = (t * sp + i * 53) % DH, x = (i * 97.3 + Math.sin(t * .7 + i) * 20 + i * 13) % DW, y = DH - k;
    g.fillStyle = 'rgba(255,' + (140 + (i % 3) * 40) + ',60,' + (Math.min(1, y / DH * 1.4) * .7).toFixed(2) + ')';
    g.fillRect(Math.round(x), Math.round(y), 2, 2);
  }
  g.restore();
  BR2.forEach(([x, y], i) => { lavaFlame(x, y - 6, 9, 24 + ph * 9, '#c8300f', '#ffd34d', i); lavaFlame(x - 5, y - 6, 5, 14 + ph * 4, '#ff7a1f', '#ffe28a', i + 2); });
  TO2.forEach(([x, y], i) => lavaFlame(x, y, 3, 7 + ph * 2, '#ff7a1f', '#ffd34d', i));
};
/* ===== Level 2: ruangan lega tanpa pilar + desain baru Ember Hall & Magma Dungeon ===== */
const LWALLS = [WB(), WB(), WB()], LBR1 = BR1.slice(2);
const lwApply = () => {
  if (lavaOn()) {
    walls = LWALLS[room];
    if (room == 1)
      BR = LBR1;
  }
};
const _updLW = upd;
upd = function (dt) { lwApply(); _updLW(dt); lwApply(); };
const _toRoomLW = toRoom;
toRoom = function (n) { _toRoomLW(n); lwApply(); };
const _toBossLW = toBoss;
toBoss = function () { _toBossLW(); lwApply(); };
const _enterLW = enterDungeon;
enterDungeon = function () { _enterLW(); lwApply(); };

function lavaPoolsN(n) {
  let sd = n ? 9 : 3;
  const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, out = [];
  for (let a = 0; a < 600 && out.length < (n ? 6 : 5); a++) {
    const w = 56 + r() * 34 | 0, h = 36 + r() * 20 | 0, x = 150 + r() * (DW - 300 - w) | 0, y = 48 + r() * (DH - 96 - h) | 0;
    if (!out.some(q => x + w + 40 > q[0] && x - 40 < q[0] + q[2] && y + h + 40 > q[1] && y - 40 < q[1] + q[3]))
      out.push([x, y, w, h]);
  }
  return out;
}

function buildLavaRoom(n, pools) {
  const c = document.createElement('canvas');
  c.width = DW;
  c.height = DH;
  const b = c.getContext('2d');
  let sd = n ? 77 : 33;
  const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, TAU = Math.PI * 2, cx = DW / 2, cy = DY;
  const px = (x, y, w, h, col) => { b.fillStyle = col; b.fillRect(Math.round(x), Math.round(y), w, h); };
  const tone = n ? ['#150d10', '#1a1015', '#120b0e'] : ['#1f1417', '#25171b', '#1a1013'];
  for (let y = 0; y < DH; y += 40)
    for (let x = 0; x < DW; x += 40) {
      const v = r();
      px(x, y, 40, 40, tone[v * 3 | 0]);
      px(x, y, 40, 1, 'rgba(255,120,60,.10)');
      px(x, y, 1, 40, 'rgba(255,120,60,.07)');
      px(x, y + 39, 40, 1, 'rgba(0,0,0,.5)');
      px(x + 39, y, 1, 40, 'rgba(0,0,0,.5)');
      for (let i = 0; i < 3; i++)
        if (r() < .5)
          px(x + r() * 36, y + r() * 36, 2, 1, '#34202a');
    }
  /* retakan lava */
  const cr = [];
  for (let i = 0; i < (n ? 26 : 18); i++) {
    let x = 60 + r() * (DW - 120), y = 40 + r() * (DH - 80), a = r() * TAU;
    const pts = [[x, y]], len = 4 + (r() * 4 | 0);
    for (let k = 0; k < len; k++) {
      a += (r() - .5) * 1.1;
      x += Math.cos(a) * (24 + r() * 26);
      y += Math.sin(a) * (24 + r() * 26);
      pts.push([x, y]);
    }
    cr.push(pts);
  }
  b.lineCap = b.lineJoin = 'round';
  [[5, '#0c0506'], [3, n ? '#e8300f' : '#c8300f'], [2, '#ff7a1f'], [.9, '#ffd34d']].forEach(([w, col]) => { b.strokeStyle = col; b.lineWidth = w; cr.forEach(pts => { b.beginPath(); pts.forEach((q, i) => i ? b.lineTo(q[0], q[1]) : b.moveTo(q[0], q[1])); b.stroke(); }); });
  /* motif lantai */
  const ring = (x, y, rd, w, col) => { b.strokeStyle = col; b.lineWidth = w; b.beginPath(); b.arc(x, y, rd, 0, TAU); b.stroke(); };
  const star = (x, y, rd, k, col, w) => {
    b.strokeStyle = col; b.lineWidth = w; b.beginPath(); for (let i = 0; i <= k; i++) {
      const a = i * 3 / k * TAU - Math.PI / 2;
      i ? b.lineTo(x + Math.cos(a) * rd, y + Math.sin(a) * rd) : b.moveTo(x + Math.cos(a) * rd, y + Math.sin(a) * rd);
    } b.stroke();
  };
  if (!n) { /* Ember Hall: medali matahari di tengah + 4 segel sudut */
    const dk = b.createRadialGradient(cx, cy, 10, cx, cy, 104);
    dk.addColorStop(0, '#0e0709');
    dk.addColorStop(1, '#1a0f13');
    b.fillStyle = dk;
    b.beginPath();
    b.arc(cx, cy, 102, 0, TAU);
    b.fill();
    ring(cx, cy, 100, 5, '#0a0507');
    ring(cx, cy, 98, 2.2, '#ff7a1f');
    ring(cx, cy, 68, 4, '#0a0507');
    ring(cx, cy, 68, 1.5, '#c8300f');
    b.strokeStyle = '#ff9a2a';
    b.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU, r0 = 18, r1 = i % 2 ? 48 : 62;
      b.beginPath();
      b.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      b.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      b.stroke();
    }
    b.fillStyle = '#ff7a1f';
    b.beginPath();
    b.arc(cx, cy, 12, 0, TAU);
    b.fill();
    b.fillStyle = '#ffd34d';
    b.beginPath();
    b.arc(cx, cy, 6, 0, TAU);
    b.fill();
    [[190, 110], [DW - 190, 110], [190, DH - 110], [DW - 190, DH - 110]].forEach(([x, y]) => { ring(x, y, 28, 4, '#0a0507'); ring(x, y, 28, 1.5, '#8f2a0c'); star(x, y, 18, 6, '#ff7a1f', 1.4); });
  } else { /* Magma Dungeon: bintang segel besar + kisi ventilasi lava */
    ring(cx, cy, 132, 5, '#0a0507');
    ring(cx, cy, 130, 2, '#e8300f');
    ring(cx, cy, 90, 4, '#0a0507');
    ring(cx, cy, 90, 1.5, '#ff7a1f');
    star(cx, cy, 124, 8, '#ff7a1f', 1.8);
    star(cx, cy, 84, 5, '#c8300f', 1.4);
    b.fillStyle = '#ffd34d';
    b.beginPath();
    b.arc(cx, cy, 5, 0, TAU);
    b.fill();
    b.save();
    b.globalCompositeOperation = 'lighter';
    [
      [170, 100], [310, 100], [DW - 310, 100], [DW - 170, 100], [170, DH - 100], [310, DH - 100], [DW - 310, DH - 100], [DW - 170, DH - 100]
    ].forEach(([x, y]) => { const q = b.createRadialGradient(x, y, 0, x, y, 24); q.addColorStop(0, 'rgba(255,110,30,.35)'); q.addColorStop(1, 'rgba(255,110,30,0)'); b.fillStyle = q; b.fillRect(x - 24, y - 24, 48, 48); });
    b.restore();
    [
      [170, 100], [310, 100], [DW - 310, 100], [DW - 170, 100], [170, DH - 100], [310, DH - 100], [DW - 310, DH - 100], [DW - 170, DH - 100]
    ].forEach(([x, y]) => {
      px(x - 8, y - 8, 16, 16, '#08040a'); for (let i = 0; i < 4; i++)
        px(x - 6 + i * 4, y - 6, 2, 12, '#ff7a1f');
    });
  }
  /* kolam lava berbahaya (hitbox = kotak) */
  pools.forEach(([x, y, w, h]) => {
    const ch = 6;
    b.fillStyle = '#1b0805';
    b.beginPath();
    b.moveTo(x - 4 + ch, y - 4);
    b.lineTo(x + w + 4 - ch, y - 4);
    b.lineTo(x + w + 4, y - 4 + ch);
    b.lineTo(x + w + 4, y + h + 4 - ch);
    b.lineTo(x + w + 4 - ch, y + h + 4);
    b.lineTo(x - 4 + ch, y + h + 4);
    b.lineTo(x - 4, y + h + 4 - ch);
    b.lineTo(x - 4, y - 4 + ch);
    b.closePath();
    b.fill();
    const q = b.createLinearGradient(0, y, 0, y + h);
    q.addColorStop(0, '#ff9a2a');
    q.addColorStop(1, '#d22a0a');
    b.fillStyle = q;
    b.fillRect(x, y, w, h);
    b.fillStyle = 'rgba(255,230,120,.55)';
    for (let i = 0; i < 5; i++)
      b.fillRect(x + 4 + r() * (w - 14), y + 4 + r() * (h - 8), 6, 2);
    b.strokeStyle = '#4a1608';
    b.lineWidth = 2;
    b.strokeRect(x - 1, y - 1, w + 2, h + 2);
  });
  /* dinding obsidian + duri */
  const wc = '#0e0709';
  px(0, 0, DW, 14, wc);
  px(0, DH - 14, DW, 14, wc);
  px(0, 0, 14, DH, wc);
  px(DW - 14, 0, 14, DH, wc);
  for (let x = 0; x < DW; x += 20) {
    px(x, 0, 1, 14, '#6a1d0a');
    px(x, DH - 14, 1, 14, '#6a1d0a');
  }
  for (let y = 0; y < DH; y += 20) {
    px(0, y, 14, 1, '#6a1d0a');
    px(DW - 14, y, 14, 1, '#6a1d0a');
  }
  px(0, 13, DW, 1, '#ff5a1f');
  px(0, DH - 14, DW, 1, '#ff5a1f');
  px(13, 0, 1, DH, '#ff5a1f');
  px(DW - 14, 0, 1, DH, '#ff5a1f');
  b.fillStyle = '#0a0507';
  for (let x = 20; x < DW - 20; x += 26) {
    b.beginPath();
    b.moveTo(x - 6, 14);
    b.lineTo(x, 14 + (n ? 12 : 8));
    b.lineTo(x + 6, 14);
    b.fill();
    b.beginPath();
    b.moveTo(x - 6, DH - 14);
    b.lineTo(x, DH - 14 - (n ? 12 : 8));
    b.lineTo(x + 6, DH - 14);
    b.fill();
  }
  b.save();
  b.globalCompositeOperation = 'lighter';
  [[0, 14, 0, 48], [0, DH - 14, 0, DH - 48], [14, 0, 48, 0], [DW - 14, 0, DW - 48, 0]].forEach(([x0, y0, x1, y1], i) => {
    const q = b.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, 'rgba(255,90,20,.3)'); q.addColorStop(1, 'rgba(255,90,20,0)'); b.fillStyle = q; if (i < 2)
      b.fillRect(0, Math.min(y0, y1), DW, 34);
    else
      b.fillRect(Math.min(x0, x1), 0, 34, DH);
  });
  b.restore();
  /* obor, kuali & tengkorak */
  (n ? TO1 : TO0).forEach(([x, y]) => { px(x - 3, y - 2, 6, 9, '#0a0507'); px(x - 2, y - 1, 4, 2, '#ff7a1f'); });
  const brs = n ? LBR1 : BR0;
  brs.forEach(([x, y]) => { b.fillStyle = 'rgba(0,0,0,.5)'; b.beginPath(); b.ellipse(x + 3, y + 8, 16, 8, 0, 0, TAU); b.fill(); px(x - 12, y - 4, 24, 14, '#0c0608'); px(x - 10, y - 6, 20, 4, '#2a171a'); b.fillStyle = '#ff7a1f'; b.beginPath(); b.ellipse(x, y - 6, 9, 3, 0, 0, TAU); b.fill(); px(x - 12, y + 6, 24, 3, '#4a2a26'); });
  const skull = (x, y) => { px(x - 4, y - 3, 8, 6, '#cfc2a4'); px(x - 3, y + 3, 6, 2, '#a89878'); px(x - 3, y - 1, 2, 2, '#1a0a0a'); px(x + 1, y - 1, 2, 2, '#1a0a0a'); px(x - 1, y + 1, 2, 1, '#1a0a0a'); };
  brs.forEach(([x, y], i) => {
    const sx = x < cx ? 1 : -1, sy = y < cy ? 1 : -1; skull(x + sx * 26, y + sy * 20); px(x + sx * 34, y + sy * 24, 6, 2, '#cfc2a4'); px(x + sx * 14, y + sy * 26, 5, 2, '#a89878'); if (i % 2)
      skull(x + sx * 40, y + sy * 12);
  });
  for (let i = 0; i < 40; i++) {
    const x = 40 + r() * (DW - 80), y = 30 + r() * (DH - 60);
    px(x, y, 3 + r() * 4, 2 + r() * 3, '#0d0709');
    if (r() < .3)
      px(x + 1, y, 1, 1, '#ff7a1f');
  }
  /* vignet & cahaya */
  const v = b.createRadialGradient(cx, cy, 200, cx, cy, 470);
  v.addColorStop(0, 'rgba(8,2,2,0)');
  v.addColorStop(1, 'rgba(8,2,2,' + (n ? .75 : .62) + ')');
  b.fillStyle = v;
  b.fillRect(0, 0, DW, DH);
  b.save();
  b.globalCompositeOperation = 'lighter';
  const pool = (x, y, rd, col) => { const q = b.createRadialGradient(x, y, 0, x, y, rd); q.addColorStop(0, col); q.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = q; b.fillRect(x - rd, y - rd, rd * 2, rd * 2); };
  brs.forEach(([x, y]) => pool(x, y, 120, 'rgba(255,120,40,.22)'));
  pools.forEach(([x, y, w, h]) => pool(x + w / 2, y + h / 2, 70, 'rgba(255,100,20,.2)'));
  pool(cx, cy, 170, n ? 'rgba(255,50,20,.1)' : 'rgba(255,120,40,.1)');
  b.restore();
  return c;
}
let LRB = false;
const _drawLR = draw;
draw = function () {
  if (lavaOn() && room < 2 && !LRB) {
    LRB = true;
    LP = [lavaPoolsN(0), lavaPoolsN(1)];
    LB = [buildLavaRoom(0, LP[0]), buildLavaRoom(1, LP[1])];
  }
  lwApply();
  _drawLR();
};
/* ===== LAVA ROOMS v2: lava cair beranimasi (kerak + celah membara + gelembung) + dekor brutal & sadis ===== */
(function () {
  const TAU = Math.PI * 2, F = 6; /* F = jumlah frame animasi lava (loop mulus) */
  const hs = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 1274126177) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const sm = k => k * k * (3 - 2 * k), ss = (a, b, v) => { v = Math.max(0, Math.min(1, (v - a) / (b - a))); return v * v * (3 - 2 * v); };
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi), a = hs(xi, yi, s), b = hs(xi + 1, yi, s), c = hs(xi, yi + 1, s), d = hs(xi + 1, yi + 1, s); return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf; };
  const fbm = (x, y, s) => vn(x, y, s) * .5 + vn(x * 2, y * 2, s + 7) * .25 + vn(x * 4, y * 4, s + 13) * .125 + vn(x * 8, y * 8, s + 29) * .0625;
  const RAMP = [
    [0, 14, 3, 3], [.2, 58, 9, 5], [.4, 150, 24, 6], [.6, 232, 70, 10], [.78, 255, 140, 28], [.9, 255, 205, 80], [1, 255, 244, 170]
  ];
  const ramp = v => {
    v = Math.max(0, Math.min(1, v)); for (let i = 1; i < RAMP.length; i++)
      if (v <= RAMP[i][0]) {
        const a = RAMP[i - 1], b = RAMP[i], k = (v - a[0]) / (b[0] - a[0]);
        return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k];
      } return [255, 244, 170];
  };
  /* satu frame kolam lava: magma cair + pelat kerak gelap yang retak dan membara di tepinya */
  function poolFrame(w, h, seed, ph, hot) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const b = c.getContext('2d'), im = b.createImageData(w, h), d = im.data, ca = Math.cos(ph) * 1.4, sa = Math.sin(ph) * 1.4, CS = 15;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const wx = x + (fbm(x / 20 + ca, y / 20 + sa, seed) - .47) * 20, wy = y + (fbm(x / 20 - sa + 5, y / 20 + ca + 5, seed + 3) - .47) * 20, gx = wx / CS, gy = wy / CS, ix = Math.floor(gx), iy = Math.floor(gy);
        let d1 = 9, d2 = 9, cid = 0;
        for (let j = -1; j <= 1; j++)
          for (let i = -1; i <= 1; i++) {
            const cx = ix + i, cy = iy + j, px = cx + .15 + .7 * hs(cx, cy, seed + 11), py = cy + .15 + .7 * hs(cx, cy, seed + 17), dd = Math.hypot(px - gx, py - gy);
            if (dd < d1) {
              d2 = d1;
              d1 = dd;
              cid = hs(cx, cy, seed + 23);
            } else if (dd < d2)
              d2 = dd;
          }
        const edge = d2 - d1, n = fbm(wx / 16 + ca * .6, wy / 16 + sa * .6, seed + 31), n2 = fbm(wx / 7 - sa, wy / 7 + ca, seed + 41);
        const isCr = cid > (hot ? .5 : .42), cm = isCr ? ss(.05, .3, edge) : 0;
        let heat = .5 + n * .62 + (n2 - .5) * .22;
        heat = heat * (1 - cm) + (.05 + .2 * n2) * cm;
        if (isCr)
          heat += (1 - ss(0, .13, edge)) * .38 * (1 - cm * .2); /* tepi kerak membara */
        const m = Math.min(x, y, w - 1 - x, h - 1 - y);
        heat -= Math.max(0, 3 - m) * .07; /* tepi kolam sedikit mendingin */
        const o = ramp(heat), q = (y * w + x) * 4;
        d[q] = o[0];
        d[q + 1] = o[1];
        d[q + 2] = o[2];
        d[q + 3] = 255;
      }
    b.putImageData(im, 0, 0);
    return c;
  }

  /* ---------- Dekor brutal ---------- */
  const bone = (b, x, y, len, ang) => { b.save(); b.translate(x, y); b.rotate(ang); b.fillStyle = '#5a4a38'; b.fillRect(-len / 2, 1, len, 2); b.fillStyle = '#d8cdb0'; b.fillRect(-len / 2, 0, len, 2); b.fillRect(-len / 2 - 1, -1, 2, 4); b.fillRect(len / 2 - 1, -1, 2, 4); b.restore(); };
  const skull = (b, x, y, s, ang, glow) => {
    b.save();
    b.translate(x, y);
    b.rotate(ang || 0);
    b.scale(s, s);
    b.fillStyle = 'rgba(0,0,0,.45)';
    b.beginPath();
    b.ellipse(1, 5, 5.5, 2, 0, 0, TAU);
    b.fill();
    b.fillStyle = '#d8cdb0';
    b.fillRect(-4, -4, 8, 7);
    b.fillRect(-3, -5, 6, 1);
    b.fillRect(-3, 3, 6, 3);
    b.fillStyle = '#a89878';
    b.fillRect(-4, 1, 1, 2);
    b.fillRect(3, 1, 1, 2);
    b.fillRect(-3, 5, 6, 1);
    b.fillStyle = '#140707';
    b.fillRect(-3, -2, 2, 3);
    b.fillRect(1, -2, 2, 3);
    b.fillRect(-1, 1, 2, 1);
    b.fillRect(-2, 4, 1, 2);
    b.fillRect(0, 4, 1, 2);
    b.fillRect(2, 4, 1, 2);
    if (glow) {
      b.fillStyle = '#ff5a1a';
      b.fillRect(-2, -1, 1, 1);
      b.fillRect(2, -1, 1, 1);
    }
    b.restore();
  };
  const blood = (b, x, y, rad, r) => {
    b.save();
    for (let i = 0; i < 7; i++) {
      const a = r() * TAU, d = r() * rad * .6;
      b.fillStyle = 'rgba(62,5,7,' + (.5 + r() * .3) + ')';
      b.beginPath();
      b.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d * .7, rad * (.35 + r() * .4), rad * (.22 + r() * .3), r() * 3, 0, TAU);
      b.fill();
    }
    b.fillStyle = 'rgba(28,2,3,.55)';
    b.beginPath();
    b.ellipse(x, y, rad * .42, rad * .26, 0, 0, TAU);
    b.fill();
    b.fillStyle = 'rgba(220,80,70,.25)';
    b.fillRect(Math.round(x - rad * .3), Math.round(y - rad * .2), Math.max(2, rad * .25 | 0), 1);
    for (let i = 0; i < 10; i++) {
      const a = r() * TAU, d = rad * (.9 + r() * .9);
      b.fillStyle = 'rgba(105,9,11,.85)';
      b.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d * .7), 1 + (r() * 2 | 0), 1 + (r() * 2 | 0));
    }
    b.restore();
  };
  const drag = (b, x0, y0, x1, y1, r) => {
    b.save();
    b.lineCap = 'round';
    const mx = (x0 + x1) / 2 + (r() - .5) * 34, my = (y0 + y1) / 2 + (r() - .5) * 34;
    [[7, 'rgba(46,3,5,.5)'], [4, 'rgba(92,8,10,.72)']].forEach(([w, c]) => { b.strokeStyle = c; b.lineWidth = w; b.beginPath(); b.moveTo(x0, y0); b.quadraticCurveTo(mx, my, x1, y1); b.stroke(); });
    b.lineWidth = 1;
    b.strokeStyle = 'rgba(60,5,7,.55)';
    for (const k of [-1, 1]) {
      b.beginPath();
      b.moveTo(x0 + k * 4, y0 + k * 2);
      b.quadraticCurveTo(mx + k * 4, my, x1 + k * 3, y1);
      b.stroke();
    }
    b.restore();
  };
  const stake = (b, x, y, h, r, glow) => {
    blood(b, x, y + 2, 9, r);
    b.fillStyle = 'rgba(0,0,0,.4)';
    b.beginPath();
    b.ellipse(x + 2, y + 2, 6, 2.5, 0, 0, TAU);
    b.fill();
    b.fillStyle = '#1c1210';
    b.fillRect(x - 1, y - h, 3, h);
    b.fillStyle = '#4a382c';
    b.fillRect(x - 1, y - h, 1, h);
    for (let i = 0; i < 3; i++) {
      const ry = y - h * .42 - i * 5;
      b.fillStyle = '#cdbfa0';
      b.fillRect(x - 5 + i, ry, 11 - i * 2, 1);
      b.fillStyle = '#7a6a54';
      b.fillRect(x - 5 + i, ry + 1, 11 - i * 2, 1);
      b.fillStyle = '#cdbfa0';
      b.fillRect(x - 5 + i, ry, 1, 3);
      b.fillRect(x + 5 - i, ry, 1, 3);
    }
    b.fillStyle = 'rgba(125,10,12,.9)';
    b.fillRect(x, y - h * .8, 1, h * .7);
    b.fillRect(x - 1, y - h * .5, 1, h * .45);
    b.fillRect(x + 1, y - h * .6, 1, 5);
    skull(b, x + .5, y - h - 3, .95, (r() - .5) * .3, glow);
  };
  const cage = (b, x, r) => {
    const cy = 36, cw = 15, ch = 24;
    for (let i = 0; i < 4; i++) {
      b.fillStyle = i % 2 ? '#4a3e38' : '#2a2220';
      b.fillRect(x - 1, 14 + i * 4, 2, 3);
    }
    b.fillStyle = 'rgba(0,0,0,.4)';
    b.beginPath();
    b.ellipse(x + 5, cy + ch + 20, 11, 4, 0, 0, TAU);
    b.fill();
    b.fillStyle = '#100a0a';
    b.fillRect(x - cw / 2, cy, cw, ch);
    skull(b, x, cy + 8, .8, (r() - .5) * .5, true);
    b.fillStyle = '#b3a78a';
    b.fillRect(x - 4, cy + 13, 8, 1);
    b.fillRect(x - 3, cy + 15, 6, 1);
    b.fillRect(x - 4, cy + 17, 8, 1);
    b.fillRect(x, cy + 12, 1, 9);
    b.fillStyle = '#5a4a42';
    for (let i = 0; i <= 4; i++)
      b.fillRect(Math.round(x - cw / 2 + i * cw / 4) - (i == 4 ? 1 : 0), cy, 2, ch);
    b.fillStyle = '#7a665a';
    b.fillRect(x - cw / 2, cy, cw, 2);
    b.fillRect(x - cw / 2, cy + ch - 2, cw, 2);
    b.fillRect(x - cw / 2, cy + (ch >> 1), cw, 1);
    b.fillStyle = '#4a3e38';
    b.beginPath();
    b.moveTo(x - cw / 2 - 1, cy);
    b.lineTo(x, cy - 7);
    b.lineTo(x + cw / 2 + 1, cy);
    b.fill();
    b.fillStyle = 'rgba(125,10,12,.9)';
    b.fillRect(x - 3, cy + ch, 1, 6);
    b.fillRect(x + 2, cy + ch, 1, 10);
    blood(b, x + 2, cy + ch + 20, 8, r);
  };
  const chained = (b, X, y, sx, r) => {
    blood(b, X + sx * 12, y + 24, 11, r);
    b.fillStyle = 'rgba(100,8,10,.75)';
    b.fillRect(X + (sx > 0 ? 0 : -3), y - 14, 3, 30);
    b.strokeStyle = '#4a3e38';
    b.lineWidth = 1;
    for (const oy of [-14, -4]) {
      b.fillStyle = '#6a584c';
      b.fillRect(X + (sx > 0 ? 0 : -5), y + oy, 5, 3);
      b.beginPath();
      b.moveTo(X + sx * 5, y + oy + 1);
      b.lineTo(X + sx * (7 + (oy < -10 ? 1 : 3)), y + 5);
      b.stroke();
    }
    b.strokeStyle = '#cdbfa0';
    b.lineWidth = 1.5;
    b.beginPath();
    b.moveTo(X + sx * 8, y + 9);
    b.lineTo(X + sx * 8, y - 3);
    b.lineTo(X + sx * 6, y - 13);
    b.stroke();
    b.beginPath();
    b.moveTo(X + sx * 12, y + 9);
    b.lineTo(X + sx * 11, y - 1);
    b.lineTo(X + sx * 8, y - 4);
    b.stroke();
    b.fillStyle = '#cdbfa0';
    for (let i = 0; i < 4; i++)
      b.fillRect(X + sx * 7 + (sx > 0 ? 0 : -6), y + 8 + i * 3, 7, 1);
    b.fillRect(X + sx * 10 - (sx > 0 ? 0 : 1), y + 7, 1, 13);
    skull(b, X + sx * 10, y + 3, .9, sx * .5, true);
    bone(b, X + sx * 14, y + 26, 10, .4 * sx);
    bone(b, X + sx * 9, y + 22, 9, -.3 * sx);
  };
  /* rak penyiksaan (kayu + tali + roda) */
  const rack = (b, x, y, r) => {
    b.fillStyle = 'rgba(0,0,0,.4)';
    b.beginPath();
    b.ellipse(x + 30, y + 17, 34, 6, 0, 0, TAU);
    b.fill();
    b.fillStyle = '#2a1a12';
    b.fillRect(x, y, 60, 14);
    b.fillStyle = '#4a3020';
    b.fillRect(x, y, 60, 2);
    b.fillStyle = '#1a0e0a';
    b.fillRect(x, y + 12, 60, 2);
    for (let i = 0; i < 5; i++) {
      b.fillStyle = 'rgba(10,5,3,.5)';
      b.fillRect(x + 6 + i * 11, y + 2, 1, 10);
    }
    b.fillStyle = '#1a0e0a';
    b.fillRect(x + 2, y + 14, 4, 6);
    b.fillRect(x + 54, y + 14, 4, 6);
    b.fillStyle = '#3a2a22';
    b.fillRect(x - 6, y - 4, 6, 18);
    b.fillRect(x + 60, y - 4, 6, 18);
    b.fillStyle = '#6a584c';
    b.beginPath();
    b.arc(x - 3, y + 5, 4, 0, TAU);
    b.fill();
    b.fillStyle = '#1a0e0a';
    b.beginPath();
    b.arc(x - 3, y + 5, 1.5, 0, TAU);
    b.fill();
    b.fillStyle = '#8a7a64';
    b.fillRect(x + 6, y + 3, 5, 8);
    b.fillRect(x + 48, y + 3, 5, 8);
    b.fillStyle = '#d8cdb0';
    b.fillRect(x + 14, y + 4, 28, 5);
    b.fillStyle = '#a89878';
    b.fillRect(x + 14, y + 8, 28, 1);
    skull(b, x + 46, y + 6, .75, 1.4, true);
    b.fillStyle = 'rgba(105,9,11,.8)';
    b.fillRect(x + 10, y + 3, 40, 2);
    b.fillRect(x + 20, y + 5, 3, 10);
    b.fillRect(x + 38, y + 5, 2, 8);
    blood(b, x + 30, y + 24, 14, r);
  };
  /* balok eksekusi + kapak + keranjang tengkorak */
  const block = (b, x, y, r) => {
    b.fillStyle = 'rgba(0,0,0,.45)';
    b.beginPath();
    b.ellipse(x + 14, y + 16, 22, 6, 0, 0, TAU);
    b.fill();
    blood(b, x + 14, y + 16, 15, r);
    b.fillStyle = '#2a1a12';
    b.fillRect(x, y, 22, 16);
    b.fillStyle = '#4a3020';
    b.fillRect(x, y, 22, 3);
    b.fillStyle = '#150a07';
    b.fillRect(x, y + 13, 22, 3);
    b.fillStyle = '#12090a';
    b.fillRect(x + 6, y + 1, 10, 3);
    b.fillStyle = 'rgba(120,10,12,.9)';
    b.fillRect(x + 7, y + 1, 8, 2);
    b.fillRect(x + 10, y + 3, 1, 12);
    b.save();
    b.translate(x + 26, y + 8);
    b.rotate(.6);
    b.fillStyle = '#4a382c';
    b.fillRect(-1, -4, 2, 22);
    b.fillStyle = '#9aa0ae';
    b.beginPath();
    b.moveTo(1, -4);
    b.lineTo(10, -2);
    b.lineTo(10, 6);
    b.lineTo(1, 5);
    b.fill();
    b.fillStyle = '#d8dce6';
    b.fillRect(9, -2, 1, 8);
    b.fillStyle = 'rgba(125,10,12,.9)';
    b.fillRect(4, 0, 5, 3);
    b.restore();
    b.fillStyle = '#3a2218';
    b.fillRect(x - 26, y + 2, 20, 14);
    b.fillStyle = '#5a3a26';
    b.fillRect(x - 26, y + 2, 20, 2);
    b.fillStyle = '#150a07';
    b.fillRect(x - 24, y + 6, 16, 8);
    skull(b, x - 21, y + 3, .8, .3, false);
    skull(b, x - 12, y + 4, .7, -.4, true);
  };
  const claw = (b, x, y, r) => {
    b.save(); b.strokeStyle = 'rgba(8,3,4,.75)'; b.lineWidth = 1; const a = r() * TAU; for (let i = 0; i < 4; i++) {
      const o = i * 3;
      b.beginPath();
      b.moveTo(x + Math.cos(a + 1.57) * o, y + Math.sin(a + 1.57) * o);
      b.quadraticCurveTo(x + Math.cos(a + 1.57) * o + Math.cos(a) * 12 + 2, y + Math.sin(a + 1.57) * o + Math.sin(a) * 12, x + Math.cos(a + 1.57) * o + Math.cos(a) * 26, y + Math.sin(a + 1.57) * o + Math.sin(a) * 26);
      b.stroke();
    } b.restore();
  };
  /* dekor utama untuk ruangan Ember Hall (n=0) dan Magma Dungeon (n=1) */
  function grimRoom(c, n, pools, torches, braz) {
    const b = c.getContext('2d');
    let sd = n ? 4141 : 2323;
    const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, cx = DW / 2, cy = DY;
    const nearPool = (x, y, rad) => pools.some(q => x + rad > q[0] - 14 && x - rad < q[0] + q[2] + 14 && y + rad > q[1] - 14 && y - rad < q[1] + q[3] + 14);
    const nearBraz = (x, y, rad) => braz.some(([bx, by]) => Math.hypot(x - bx, y - by) < rad + 34);
    const portal = (x, y, rad) => !n && Math.hypot(x - 60, y - cy) < rad + 28;
    const free = (x, y, rad) => !nearPool(x, y, rad) && !nearBraz(x, y, rad) && !portal(x, y, rad);
    /* 1. jejak seretan darah menuju kolam lava (korban diseret ke lava) */
    pools.forEach(([x, y, w, h], i) => {
      for (let k = 0; k < 2; k++) {
        const a = r() * TAU, d = 90 + r() * 60, sx = Math.max(30, Math.min(DW - 30, x + w / 2 + Math.cos(a) * d)), sy = Math.max(30, Math.min(DH - 30, y + h / 2 + Math.sin(a) * d * .8));
        let tx = x + w / 2 + (sx < x ? -w / 2 - 3 : sx > x + w ? w / 2 + 3 : 0), ty = y + h / 2 + (sy < y ? -h / 2 - 3 : sy > y + h ? h / 2 + 3 : 0);
        if (free(sx, sy, 4)) {
          drag(b, sx, sy, tx, ty, r);
          blood(b, sx, sy, 8 + r() * 5, r);
        }
      }
    });
    /* 2. genangan darah kering + cipratan */
    for (let i = 0, a = 0; i < 9 && a < 80; a++) {
      const x = 50 + r() * (DW - 100), y = 40 + r() * (DH - 80);
      if (!free(x, y, 16))
        continue;
      blood(b, x, y, 9 + r() * 11, r);
      i++;
    }
    /* 3. cakaran di lantai */
    for (let i = 0, a = 0; i < 6 && a < 60; a++) {
      const x = 60 + r() * (DW - 120), y = 50 + r() * (DH - 100);
      if (free(x, y, 22)) {
        claw(b, x, y, r);
        i++;
      }
    }
    /* 4. tumpukan tulang */
    for (let i = 0, a = 0; i < 8 && a < 120; a++) {
      const x = 40 + r() * (DW - 80), y = 34 + r() * (DH - 68);
      if (!free(x, y, 18))
        continue;
      for (let k = 0; k < 4 + (r() * 4 | 0); k++)
        bone(b, x + (r() - .5) * 26, y + (r() - .5) * 14, 7 + r() * 8, r() * 3.14);
      if (r() < .75)
        skull(b, x + (r() - .5) * 12, y + (r() - .5) * 6, .85 + r() * .2, (r() - .5) * 1.2, r() < .4);
      i++;
    }
    /* 5. tiang sula dengan tubuh tertusuk di sepanjang dinding bawah */
    const sx0 = n ? [114, 314, 514, 714] : [100, 300, 500, 700];
    sx0.forEach((x, i) => {
      if (!nearPool(x, DH - 26, 14))
        stake(b, x, DH - 28, 30 + (i % 2) * 6, r, i % 2 == 0);
    });
    /* 6. kurungan gantung berisi tengkorak di dinding atas */
    CAGES[n] = (n ? [214, 414, 614] : [200, 400, 600]).filter(x => !nearPool(x, 62, 30));
    CAGES[n].forEach(x => cage(b, x, r));
    /* 7. mayat terbelenggu di dinding kiri/kanan */
    chained(b, 14, 190, 1, r);
    chained(b, 14, 308, 1, r);
    chained(b, DW - 14, 168, -1, r);
    chained(b, DW - 14, 322, -1, r);
    /* 8. alat siksa */
    if (n) {
      block(b, DW - 170, DH - 56, r);
      rack(b, 150, DH - 62, r);
    } else {
      rack(b, 120, DH - 62, r);
      block(b, DW - 196, DH - 56, r);
    }
    /* 9. friezes tengkorak di dinding atas + darah merembes dari dinding */
    for (let x = 22; x < DW - 20; x += 36) {
      if (torches.some(([tx, ty]) => ty < 20 && Math.abs(tx - x) < 16))
        continue;
      skull(b, x + (r() * 6 | 0), 7, .6, 0, r() < .3);
    }
    for (let i = 0; i < 46; i++) {
      const top = r() < .5, x = 20 + r() * (DW - 40), L = 4 + r() * 28;
      b.fillStyle = 'rgba(' + (95 + r() * 30 | 0) + ',8,10,.85)';
      if (top)
        b.fillRect(Math.round(x), 14, 1 + (r() < .3 ? 1 : 0), L);
      else
        b.fillRect(Math.round(x), DH - 14 - L, 1, L);
    }
    /* 10. gelapkan sudut agar suasana lebih menekan */
    const v = b.createRadialGradient(cx, cy, 190, cx, cy, 470);
    v.addColorStop(0, 'rgba(10,0,0,0)');
    v.addColorStop(1, 'rgba(10,0,0,.42)');
    b.fillStyle = v;
    b.fillRect(0, 0, DW, DH);
    /* 11. cahaya api & lava di atas dekorasi, supaya dekorasi ikut "terbakar" */
    b.save();
    b.globalCompositeOperation = 'lighter';
    pools.forEach(([x, y, w, h]) => { const q = b.createRadialGradient(x + w / 2, y + h / 2, 6, x + w / 2, y + h / 2, 90); q.addColorStop(0, 'rgba(255,110,30,.26)'); q.addColorStop(1, 'rgba(255,60,10,0)'); b.fillStyle = q; b.fillRect(x - 90, y - 90, w + 180, h + 180); });
    braz.forEach(([x, y]) => { const q = b.createRadialGradient(x, y, 4, x, y, 120); q.addColorStop(0, 'rgba(255,130,40,.2)'); q.addColorStop(1, 'rgba(255,60,10,0)'); b.fillStyle = q; b.fillRect(x - 120, y - 120, 240, 240); });
    b.restore();
  }
  /* bibir batu kolam lava (hangus, bergerigi) + frame pertama lava */
  function poolRim(c, pools, n) {
    const b = c.getContext('2d');
    let sd = 900 + n * 31;
    const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
    pools.forEach(([x, y, w, h], i) => {
      b.fillStyle = 'rgba(0,0,0,.5)';
      b.fillRect(x - 4, y + h + 3, w + 10, 5);
      b.fillStyle = '#0d0405';
      b.fillRect(x - 6, y - 6, w + 12, h + 12);
      for (let k = 0; k < w + h; k++) {
        const side = r() * 4 | 0, o = r() * 5 | 0;
        b.fillStyle = r() < .5 ? '#1a0a0a' : '#2a1410';
        if (side == 0)
          b.fillRect(x - 7 + (r() * (w + 12) | 0), y - 7 - (o >> 1), 2 + o, 2 + (o >> 1));
        else if (side == 1)
          b.fillRect(x - 7 + (r() * (w + 12) | 0), y + h + 3, 2 + o, 3 + (o >> 1));
        else if (side == 2)
          b.fillRect(x - 7 - (o >> 1), y - 6 + (r() * (h + 12) | 0), 3 + (o >> 1), 2 + o);
        else
          b.fillRect(x + w + 3, y - 6 + (r() * (h + 12) | 0), 3 + (o >> 1), 2 + o);
      }
      b.strokeStyle = '#6a2210';
      b.lineWidth = 1;
      b.strokeRect(x - 3.5, y - 3.5, w + 7, h + 7);
      b.drawImage(LPF[n][i][0], x, y);
      b.save();
      b.globalCompositeOperation = 'lighter';
      b.strokeStyle = 'rgba(255,120,30,.55)';
      b.lineWidth = 2;
      b.strokeRect(x - 1, y - 1, w + 2, h + 2);
      b.restore();
    });
  }
  let LPF = [[], []];
  const CAGES = [[], [], [150, 350, 450, 650]];
  const _build = buildLavaRoom;
  buildLavaRoom = function (n, pools) {
    LPF[n] = pools.map(([x, y, w, h], i) => {
      const fr = []; for (let k = 0; k < F; k++)
        fr.push(poolFrame(w, h, 17 + n * 50 + i * 7, k / F * TAU, n == 1)); return fr;
    });
    const c = _build(n, pools);
    poolRim(c, pools, n);
    grimRoom(c, n, pools, n ? TO1 : TO0, n ? LBR1 : BR0);
    return c;
  };

  /* ---------- Arena bos: altar pengorbanan ---------- */
  const _bossBG = buildLavaBossBG;
  buildLavaBossBG = function () {
    _bossBG();
    const b = LBB.getContext('2d');
    let sd = 777;
    const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, cx = DW / 2, cy = DY;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU + .26;
      drag(b, cx + Math.cos(a) * 176, cy + Math.sin(a) * 176, cx + Math.cos(a + .1) * 58, cy + Math.sin(a + .1) * 52, r);
    }
    for (let i = 0; i < 9; i++) {
      const a = r() * TAU, d = 60 + r() * 120;
      blood(b, cx + Math.cos(a) * d, cy + Math.sin(a) * d * .95, 8 + r() * 9, r);
    }
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * TAU + .1, x = cx + Math.cos(a) * 214, y = cy + Math.sin(a) * 214;
      if (x > 30 && x < DW - 30 && y > 40 && y < DH - 30)
        stake(b, x, y, 24 + (i % 3) * 5, r, i % 2 == 0);
    }
    [[110, 120], [DW - 110, 120], [110, DH - 120], [DW - 110, DH - 120]].forEach(([x, y]) => {
      for (let k = 0; k < 5; k++)
        bone(b, x + (r() - .5) * 30, y + (r() - .5) * 18, 8 + r() * 8, r() * 3.14); skull(b, x + 3, y - 2, .95, .3, true); skull(b, x - 9, y + 5, .8, -.5, false); blood(b, x, y + 4, 10, r);
    });
    CAGES[2].forEach(x => cage(b, x, r));
    chained(b, 14, 130, 1, r);
    chained(b, 14, 350, 1, r);
    chained(b, DW - 14, 130, -1, r);
    chained(b, DW - 14, 350, -1, r);
    for (let x = 22; x < DW - 20; x += 30) {
      if (TO2.some(([tx, ty]) => ty < 20 && Math.abs(tx - x) < 14))
        continue;
      skull(b, x, 7, .6, 0, r() < .4);
    }
    for (let i = 0; i < 40; i++) {
      const top = r() < .5, x = 20 + r() * (DW - 40), L = 5 + r() * 30;
      b.fillStyle = 'rgba(110,8,10,.85)';
      if (top)
        b.fillRect(Math.round(x), 14, 1, L);
      else
        b.fillRect(Math.round(x), DH - 14 - L, 1, L);
    }
  };

  /* ---------- Animasi: lava cair, gelembung, tetesan darah, bara ---------- */
  const _envFx = envFx;
  envFx = function () {
    const on = lavaOn() && room < 2, ps = on ? (LP[room] || []) : [];
    if (on && LPF[room].length) {
      const u = t * 2.4;
      ps.forEach(([x, y, w, h], i) => {
        const fr = LPF[room][i]; if (!fr)
          return; const fa = Math.floor(u) % F, fb = (fa + 1) % F; g.drawImage(fr[fa], x, y); g.save(); g.globalAlpha = u - Math.floor(u); g.drawImage(fr[fb], x, y); g.restore();
      });
    }
    _envFx();
    if (on) {
      ps.forEach(([x, y, w, h], i) => {
        const pu = .5 + .5 * Math.sin(t * 2.2 + i * 1.7);
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.strokeStyle = 'rgba(255,130,40,' + (.25 + .25 * pu) + ')';
        g.lineWidth = 2;
        g.strokeRect(x - 1, y - 1, w + 2, h + 2);
        g.restore();
        for (let k = 0; k < 4; k++) {
          const uu = t * .75 + k * .27 + i * .61, cyc = Math.floor(uu), f = uu - cyc, bx = x + 5 + hs(cyc, k, i + 100) * (w - 10), by = y + 5 + hs(cyc, k, i + 200) * (h - 10);
          if (f < .7) {
            const rr = 1 + f / .7 * 3.2;
            g.fillStyle = 'rgba(120,20,4,.85)';
            g.beginPath();
            g.arc(bx, by, rr + 1, 0, TAU);
            g.fill();
            g.fillStyle = '#ff9a2a';
            g.beginPath();
            g.arc(bx, by, rr, 0, TAU);
            g.fill();
            g.fillStyle = '#ffe28a';
            g.fillRect(Math.round(bx - rr * .5), Math.round(by - rr * .6), 2, 1);
          } else {
            const q = (f - .7) / .3;
            g.strokeStyle = 'rgba(255,200,80,' + (1 - q) + ')';
            g.lineWidth = 1;
            g.beginPath();
            g.arc(bx, by, 4 + q * 7, 0, TAU);
            g.stroke();
            g.fillStyle = 'rgba(255,230,120,' + (1 - q) + ')';
            for (let s = 0; s < 4; s++) {
              const a = s * 1.57 + k;
              g.fillRect(Math.round(bx + Math.cos(a) * q * 9), Math.round(by + Math.sin(a) * q * 9 - q * 4), 2, 2);
            }
          }
        }
      });
    }
    if (lavaOn() && room < 3) {
      /* tetesan darah dari kurungan gantung */
      const cx0 = CAGES[room] || [];
      cx0.forEach((x, i) => {
        const u = (t * .55 + i * .37) % 1, y0 = 62, fy = y0 + u * u * 22; if (u < .92) {
          g.fillStyle = 'rgba(170,14,16,.95)';
          g.fillRect(Math.round(x + (i % 2 ? 2 : -3)), Math.round(fy), 1, 3);
        } else {
          g.fillStyle = 'rgba(150,12,14,.7)';
          g.fillRect(Math.round(x + (i % 2 ? 2 : -3)) - 2, 100, 5, 1);
        }
      });
      /* bara melayang naik (memberi kesan panas) */
      g.save();
      g.globalCompositeOperation = 'lighter';
      const nn = room == 2 ? 0 : 26;
      for (let i = 0; i < nn; i++) {
        const sp = 10 + (i % 5) * 4, k = (t * sp + i * 71) % DH, x = (i * 113.7 + Math.sin(t * .8 + i) * 16) % DW, y = DH - k, a = Math.min(1, y / DH * 1.5) * .55;
        g.fillStyle = 'rgba(255,' + (120 + (i % 4) * 30) + ',50,' + a.toFixed(2) + ')';
        g.fillRect(Math.round(x), Math.round(y), 1 + (i % 3 == 0 ? 1 : 0), 1 + (i % 3 == 0 ? 1 : 0));
      }
      g.restore();
    }
  };
  /* arena bos memakai envFx milik bos; tetesan darah & bara tambahan di atas dipasang lewat wrapper ini */
})();

/* ===== LAVA SLIME v2: lebih besar, bermulut bertaring, mata marah, duri obsidian, tengkorak termakan ===== */
(function () {
  const S = 1.65, TAU = Math.PI * 2;
  const _ld = lavaDraw;
  lavaDraw = function (e) {
    if (e.k != 'slime')
      return _ld(e);
    const v = room, fl = e.fl > 0, F = c => fl ? '#fff' : c, tt = t + e.ph, dx = p.x - e.x, dy = p.y - e.y, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
    g.save();
    g.translate((e.rx == null ? e.x : e.rx) + (e.stun > 0 ? Math.sin(t * 40) * 1.2 : 0), (e.ry == null ? e.y : e.ry) + 7);
    if (e.rx != null) {
      g.rotate(e.zr || 0);
      g.scale(e.zx || 1, e.zy || 1);
      g.translate(0, -(e.hh || 0) * .215);
    }
    const pg = e.an > 0 ? Math.min(1, 1 - e.an / .6) : 0, lg = Math.sin(pg * Math.PI) * 9, sq = 1 + Math.sin(tt * 5) * .06 - .16 * Math.sin(pg * Math.PI);
    const w = (v ? 13 : 11.5) * sq, h = (v ? 15 : 13) / sq, op = Math.min(1, .3 + .7 * pg + .12 * Math.sin(tt * 4.2));
    const cB = F(v ? '#5a1205' : '#a8330b'), cM = F(v ? '#b8240a' : '#e8501a'), cH = F(v ? '#ff5a1a' : '#ff8a2a'), cC = F(v ? '#150909' : '#33150e'), LA = F('#ff7a1f'), LY = F('#ffd34d');
    g.translate(ux * lg, uy * lg * .6);
    /* bayangan + genangan lava di bawah */
    g.fillStyle = 'rgba(0,0,0,.5)';
    g.beginPath();
    g.ellipse(0, 1, w * 1.35 * S, 3.4 * S, 0, 0, TAU);
    g.fill();
    if (!fl)
      lavaGlow(0, -2, 30 * S, .28 + .1 * Math.sin(tt * 4) + pg * .25, v ? '255,70,20' : '255,130,40');
    g.scale(S, S);
    g.fillStyle = F(v ? '#4a0f04' : '#8a2a08');
    g.beginPath();
    g.ellipse(0, 0, w * 1.22, 2.6, 0, 0, TAU);
    g.fill();
    for (let i = -2; i <= 2; i++) {
      const bx = i * w * .5, bl = 1.5 + Math.abs(Math.sin(tt * 3 + i * 2)) * 1.2;
      g.beginPath();
      g.ellipse(bx, 1.2, 3.2, bl, 0, 0, TAU);
      g.fill();
    }
    /* duri obsidian di punggung (di belakang badan) */
    for (let i = -2; i <= 2; i++) {
      const bx = i * w * .36, by = -h * (1.0 - .1 * Math.abs(i)), L = 6 + (2 - Math.abs(i)) * 3.2 + (pg * 3) + Math.sin(tt * 6 + i) * .6, lean = i * 1.5;
      g.fillStyle = cC;
      g.beginPath();
      g.moveTo(bx - 2.2, by + 1);
      g.lineTo(bx + lean, by - L);
      g.lineTo(bx + 2.2, by + 1);
      g.fill();
      g.strokeStyle = LA;
      g.lineWidth = .6;
      g.beginPath();
      g.moveTo(bx + lean, by - L);
      g.lineTo(bx + .6, by - 1);
      g.stroke();
      if (!fl) {
        g.fillStyle = 'rgba(255,200,80,.9)';
        g.fillRect(bx + lean - .5, by - L, 1, 1.2);
      }
    }
    /* badan lava */
    const gr = g.createLinearGradient(0, -h * 1.3, 0, 2);
    gr.addColorStop(0, cH);
    gr.addColorStop(.45, cM);
    gr.addColorStop(1, cB);
    g.fillStyle = fl ? '#fff' : gr;
    g.beginPath();
    g.moveTo(-w, 0);
    g.bezierCurveTo(-w * 1.18, -h * 1.5, w * 1.18, -h * 1.5, w, 0);
    g.quadraticCurveTo(0, 3, -w, 0);
    g.fill();
    g.strokeStyle = F('#2a0803');
    g.lineWidth = .8;
    g.stroke();
    /* pelat kerak obsidian + retakan membara */
    [
      [-.7, -.3, 3.4], [.72, -.4, 3.1], [-.5, -1.12, 3], [.52, -1.1, 3.4], [.05, -1.28, 2.6], [-.95, -.72, 2.2], [.92, -.75, 2.4]
    ].forEach(([fx, fy, rr], i) => {
      const cx = fx * w, cy = fy * h, a0 = i * 1.3 + e.ph;
      g.fillStyle = cC;
      g.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = a0 + k / 6 * TAU, q = rr * (.75 + .3 * Math.sin(k * 2.7 + i));
        k ? g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q * .8) : g.moveTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q * .8);
      }
      g.closePath();
      g.fill();
      g.strokeStyle = LA;
      g.lineWidth = .5;
      g.globalAlpha = fl ? 1 : .55 + .35 * Math.sin(tt * 3 + i);
      g.stroke();
      g.globalAlpha = 1;
    });
    /* tengkorak korban yang sedang dilahap */
    const sx = -w * .78, sy = -h * .42;
    g.fillStyle = F('#d8cdb0');
    g.fillRect(sx - 3, sy - 3, 6, 5);
    g.fillRect(sx - 2, sy + 2, 4, 2);
    g.fillStyle = F('#120606');
    g.fillRect(sx - 2, sy - 1, 2, 2);
    g.fillRect(sx + 1, sy - 1, 1.5, 2);
    if (!fl) {
      g.fillStyle = '#ff5a1a';
      g.fillRect(sx - 1.5, sy - .5, 1, 1);
      g.fillRect(sx + 1.2, sy - .5, 1, 1);
    }
    g.fillStyle = F(v ? '#b8240a' : '#e8501a');
    g.beginPath();
    g.ellipse(sx, sy + 3.6, 4.6, 2.6, 0, 0, TAU);
    g.fill();
    g.fillStyle = F('#cfc2a4');
    g.save();
    g.translate(sx - 4, sy + 5);
    g.rotate(-.6);
    g.fillRect(-4, 0, 8, 1.4);
    g.fillRect(-5, -.6, 1.5, 2.6);
    g.restore();
    /* mulut menganga bergigi taring */
    const my = -h * .5, rx = w * .66, ry = 1.6 + 5.4 * op;
    g.fillStyle = F('#1a0300');
    g.beginPath();
    g.ellipse(0, my, rx, ry, 0, 0, TAU);
    g.fill();
    g.fillStyle = F(v ? '#ff4a14' : '#ff8a22');
    g.beginPath();
    g.ellipse(0, my + ry * .32, rx * .78, ry * .55, 0, 0, TAU);
    g.fill();
    if (!fl) {
      lavaGlow(0, my, 9 + pg * 4, .25 + .25 * pg, '255,80,20');
    }
    g.fillStyle = F('#f6ecc8');
    const nt = 6;
    for (let i = 0; i < nt; i++) {
      const tx = -rx * .86 + i * (rx * 1.72 / (nt - 1)), tl = 2.2 + op * 2.4 + ((i == 1 || i == 4) ? 1.8 : 0);
      g.beginPath();
      g.moveTo(tx - 1.5, my - ry * .84);
      g.lineTo(tx, my - ry * .84 + tl);
      g.lineTo(tx + 1.5, my - ry * .84);
      g.fill();
    }
    for (let i = 0; i < nt - 1; i++) {
      const tx = -rx * .7 + i * (rx * 1.4 / (nt - 2)), tl = 1.6 + op * 1.8;
      g.beginPath();
      g.moveTo(tx - 1.3, my + ry * .86);
      g.lineTo(tx, my + ry * .86 - tl);
      g.lineTo(tx + 1.3, my + ry * .86);
      g.fill();
    }
    /* mata marah menyala + alis menukik */
    for (const s of [-1, 1]) {
      const ex = s * w * .42, ey = -h * .88;
      g.fillStyle = F('#150200');
      g.beginPath();
      g.ellipse(ex, ey, 3.6, 2.7, s * .35, 0, TAU);
      g.fill();
      if (!fl)
        lavaGlow(ex, ey, 6, .4, '255,210,60');
      g.fillStyle = F('#fff0a0');
      g.beginPath();
      g.ellipse(ex, ey, 2.7, 2, s * .35, 0, TAU);
      g.fill();
      g.fillStyle = F('#c01000');
      g.fillRect(ex - .5 + ux * 1.2, ey - 1.7 + uy * .6, 1.1, 3.4);
      g.fillStyle = cC;
      g.beginPath();
      g.moveTo(ex + s * 4.4, ey - 5.2);
      g.lineTo(ex - s * 3.6, ey - 1.6);
      g.lineTo(ex - s * 3.4, ey - 3.8);
      g.lineTo(ex + s * 4.4, ey - 7.4);
      g.closePath();
      g.fill();
    }
    /* tetesan lava dari mulut & badan */
    g.fillStyle = F('#ffb050');
    for (let i = 0; i < 4; i++) {
      const dr = (tt * 9 + i * 2.7) % 9, x = (i - 1.5) * w * .32;
      g.globalAlpha = Math.max(0, 1 - dr / 9);
      g.fillRect(x, my + ry * .85 + dr * .7, 1.3, 2 + dr * .35);
    }
    g.globalAlpha = 1;
    g.fillRect(w * .86, -3 + ((tt * 7) % 5), 1.2, 3);
    g.fillRect(-w * .98, -2 + ((tt * 6 + 2) % 5), 1.2, 2.5);
    /* gelembung di permukaan */
    if (!fl)
      for (let i = 0; i < 2; i++) {
        const u = (tt * .9 + i * .5) % 1, bx = (i ? .35 : -.28) * w, by = -h * (1.12 - i * .1);
        g.strokeStyle = 'rgba(255,230,140,' + (1 - u) * .9 + ')';
        g.lineWidth = .7;
        g.beginPath();
        g.arc(bx, by, 1 + u * 2.4, 0, TAU);
        g.stroke();
      }
    /* api di puncak kepala */
    lavaFlame(0, -h * 1.15, v ? 3.6 : 3, v ? 8 : 6.5, F('#ff7a1f'), F('#ffe28a'), e.ph);
    lavaFlame(-w * .6, -h * .98, 2, 4.5, F('#ff5a1a'), F('#ffd34d'), e.ph + 2);
    lavaFlame(w * .6, -h * .98, 2, 4.5, F('#ff5a1a'), F('#ffd34d'), e.ph + 4);
    g.restore();
  };
  /* hitbox & HP menyesuaikan ukuran baru (tidak untuk mini bos) */
  const _upd = upd;
  upd = function (dt) {
    if (lavaOn() && room < 2)
      es.forEach(e => {
        if (e.k == 'slime' && !e.mini && !e._big) {
          e._big = 1;
          e.r = 10;
          e.ht = 34;
          e.hp = e.mhp = Math.round(e.hp * 1.2);
        }
      });
    _upd(dt);
  };
})();
/* ===== ANIMASI MASUK DUNGEON =====
   Lobby: portal ungu terbuka di gerbang \u2192 pahlawan berputar & tersedot \u2192 kilat + layar gelap
   Dungeon: pahlawan muncul dari portal biru \u2192 banner nama level & kesulitan */
(function () {
  var cl = function (v, a, b) { a = a == null ? 0 : a; b = b == null ? 1 : b; return Math.max(a, Math.min(b, v)); };
  var ez = function (u) { return u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u); };
  var eo = function (u) { return 1 - Math.pow(1 - cl(u), 3); };
  var TAU = Math.PI * 2, rnd = Math.random;

  function sn(f, a) {
    try {
      SFX[f](a);
    } catch (e) { }
  }
  var A = 2.2, B = 1.4, BT = 3.8; /* detik: tersedot \u00b7 muncul \u00b7 lama banner */
  var D = { on: 0, ph: 0, t: 0, x: 0, y: 0, open: 0, fl: 0, rg: 0, pend: 0, bt: -1, lv: 1, df: 1 };
  var PS = [];
  var VIO = {
    core: '245,232,255', mid: '170,125,255', edge: '105,60,215', a: '205,175,255', b: '170,225,255', pil: '200,170,255'
  };
  var BLU = {
    core: '235,248,255', mid: '120,190,255', edge: '110,90,255', a: '170,225,255', b: '215,190,255', pil: '190,225,255'
  };

  function clearIn() {
    try {
      for (var k in K)
        K[k] = 0;
      for (var k2 in P)
        delete P[k2];
      M.d = 0;
      M.u = 0;
      cv.focus();
    } catch (e) { }
  }

  /* ---------- partikel ---------- */
  function ps(o) { o.max = o.life; PS.push(o); }

  function psStep(dt) {
    for (var i = PS.length - 1; i >= 0; i--) {
      var q = PS[i];
      q.life -= dt;
      if (q.life <= 0) {
        PS.splice(i, 1);
        continue;
      }
      if (q.k == 'spi') {
        q.a += q.w * dt;
        q.w *= 1 + dt * 1.4;
        q.r -= q.v * dt;
        q.v *= 1 + dt * 1.1;
        if (q.r < 3) {
          PS.splice(i, 1);
          continue;
        }
        q.px = q.x;
        q.py = q.y;
        q.x = q.cx + Math.cos(q.a) * q.r;
        q.y = q.cy + Math.sin(q.a) * q.r * .42;
      } else if (q.k == 'ring') {
        q.r = Math.max(1, q.r + q.v * dt);
        if (q.d)
          q.v *= Math.pow(q.d, dt);
      } else if (q.k != 'gl') {
        q.vy += (q.g || 0) * dt;
        var d = Math.pow(q.dr || 1, dt);
        q.vx *= d;
        q.vy *= d;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
      }
    }
  }

  function psDraw() {
    if (!PS.length)
      return;
    g.save();
    g.globalCompositeOperation = 'lighter';
    PS.forEach(function (q) {
      var k = q.life / q.max;
      if (q.k == 'spi') {
        g.strokeStyle = 'rgba(' + q.c + ',' + Math.min(1, k * 1.6) * .9 + ')';
        g.lineWidth = q.lw || 1.4;
        g.beginPath();
        g.moveTo(q.px, q.py);
        g.lineTo(q.x, q.y);
        g.stroke();
      } else if (q.k == 'ring') {
        g.strokeStyle = 'rgba(' + q.c + ',' + k * .95 + ')';
        g.lineWidth = (q.w || 2) * k + .5;
        g.beginPath();
        g.ellipse(q.x, q.y, Math.abs(q.r), Math.abs(q.r) * (q.e || 1), 0, 0, 7);
        g.stroke();
      } else if (q.k == 'gl') {
        var gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);
        gr.addColorStop(0, 'rgba(255,255,255,' + k * .85 + ')');
        gr.addColorStop(.4, 'rgba(' + q.c + ',' + k * .55 + ')');
        gr.addColorStop(1, 'rgba(' + q.c + ',0)');
        g.fillStyle = gr;
        g.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
      } else {
        g.globalAlpha = Math.min(1, k * 1.6);
        g.fillStyle = q.c;
        var sz = Math.max(1, q.s * (q.sh ? k : 1));
        g.fillRect(Math.round(q.x - sz / 2), Math.round(q.y - sz / 2), Math.ceil(sz), Math.ceil(sz));
        g.globalAlpha = 1;
      }
    });
    g.restore();
  }

  function sparks(x, y, n, pal, up) {
    for (var i = 0; i < n; i++)
      ps({
        x: x + (rnd() - .5) * 22, y: y - rnd() * 12, vx: (rnd() - .5) * 34, vy: -(up || 30) - rnd() * 70, g: -12, dr: .8, life: .9 + rnd() * .8, s: 1.5 + rnd() * 2, c: ['#ffffff', 'rgb(' + pal.a + ')', 'rgb(' + pal.b + ')'][i % 3], sh: 1
      });
  }

  /* ---------- efek dasar ---------- */
  function pillar(x, y, w, h, I, c) {
    if (I <= 0)
      return;
    var gr = g.createLinearGradient(0, y, 0, y - h);
    gr.addColorStop(0, 'rgba(' + c + ',' + I * .85 + ')');
    gr.addColorStop(.6, 'rgba(' + c + ',' + I * .32 + ')');
    gr.addColorStop(1, 'rgba(' + c + ',0)');
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = gr;
    g.fillRect(x - w / 2, y - h, w, h);
    g.fillStyle = 'rgba(255,255,255,' + I * .7 + ')';
    g.fillRect(x - w / 6, y - h * .85, w / 3, h * .85);
    g.restore();
  }

  function portal(cx, cy, k, rot, I, pal) {
    if (k <= .02)
      return;
    var R0 = 36 * k;
    g.save();
    g.translate(cx, cy);
    g.scale(1, .42);
    g.globalCompositeOperation = 'lighter';
    var gr = g.createRadialGradient(0, 0, 0, 0, 0, R0 * 1.15);
    gr.addColorStop(0, 'rgba(' + pal.core + ',' + .75 * I + ')');
    gr.addColorStop(.45, 'rgba(' + pal.mid + ',' + .5 * I + ')');
    gr.addColorStop(1, 'rgba(' + pal.edge + ',0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, R0 * 1.15, 0, 7);
    g.fill();
    g.lineCap = 'round';
    for (var a = 0; a < 5; a++) {
      g.beginPath();
      for (var s2 = 0; s2 <= 1.001; s2 += .06) {
        var an = rot + a * 1.2566 + s2 * 3.6, r = R0 * (.1 + .9 * s2);
        g[s2 ? 'lineTo' : 'moveTo'](Math.cos(an) * r, Math.sin(an) * r);
      }
      g.strokeStyle = 'rgba(' + (a % 2 ? pal.b : pal.a) + ',' + .8 * I + ')';
      g.lineWidth = 2.6;
      g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,' + .85 * I + ')';
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(0, 0, R0, 0, 7);
    g.stroke();
    g.setLineDash([4, 5]);
    g.lineDashOffset = -rot * 12;
    g.strokeStyle = 'rgba(' + pal.a + ',' + .7 * I + ')';
    g.beginPath();
    g.arc(0, 0, R0 * .66, 0, 7);
    g.stroke();
    g.setLineDash([]);
    g.restore();
  }

  /* ---------- mulai ---------- */
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('#dsGo'))
      D.pend = 1;
  }, true);
  var _enter = enterDungeon;
  enterDungeon = function () {
    if (!D.pend)
      return _enter.apply(this, arguments);
    D.pend = 0;
    clearIn();
    p.vx = p.vy = 0;
    p.dod = 0;
    shake = 0;
    PS.length = 0;
    D.on = 1;
    D.ph = 0;
    D.t = 0;
    D.x = p.x;
    D.y = p.y;
    D.fl = 0;
    D.rg = 0;
    D.lv = LVL;
    D.df = DIFF;
    D.bt = -1;
    /* lingkaran rune di tanah */
    ps({ k: 'ring', x: p.x, y: p.y + 8, r: 8, v: 120, d: .25, life: .7, c: VIO.a, w: 3, e: .42 });
    ps({ k: 'gl', x: p.x, y: p.y + 4, r: 50, c: VIO.mid, life: .6 });
    sn('summon');
  };

  /* ---------- langkah per frame ---------- */
  function step(dt) {
    var T = (D.t += dt);
    t += dt;
    shake = Math.max(0, shake - 20 * dt);
    camUpd(dt);
    psStep(dt);
    msgT = 0;
    if (!D.ph) {
      var cx = D.x, cy = D.y + 8;
      if (T > .12) {
        var n0 = (30 + 95 * cl(T / 1.7)) * dt, n = Math.floor(n0) + (rnd() < n0 % 1 ? 1 : 0);
        for (var i = 0; i < n; i++) {
          var a = rnd() * TAU, r = 44 + rnd() * 46;
          ps({
            k: 'spi', cx: cx, cy: cy, a: a, r: r, v: 44 + rnd() * 42, w: 2.2 + rnd() * 1.6, life: 1.7, c: rnd() < .5 ? VIO.a : VIO.b, lw: 1 + rnd(), x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * .42, px: cx + Math.cos(a) * r, py: cy + Math.sin(a) * r * .42
          });
        }
      }
      if (T >= D.rg && T < 1.65) {
        D.rg = T + .34;
        ps({ k: 'ring', x: cx, y: cy, r: 64, v: -82, life: .75, c: VIO.a, w: 2, e: .42 });
      }
      if (T > .5 && T < 1.8) {
        shake = Math.max(shake, 1.2);
        if (rnd() < dt * 24)
          ps({
            x: cx + (rnd() - .5) * 12, y: cy - 6, vx: (rnd() - .5) * 16, vy: -40 - rnd() * 50, g: -20, dr: .7, life: .6 + rnd() * .4, s: 2, c: '#e6d6ff', sh: 1
          });
      }
      if (!D.fl && T >= 1.62) {
        D.fl = 1;
        shake = 6;
        sn('dodge');
        sn('door');
      }
      if (T >= A) { /* pindah ke dungeon saat layar hitam */
        D.ph = 1;
        D.t = 0;
        D.fl = 0;
        PS.length = 0;
        msgT = 0;
        _enter();
        fade = 0;
        camInit = false;
        camUpd(0);
        D.x = p.x;
        D.y = p.y;
        D.bt = 0;
        var ax = p.x, ay = p.y + 8;
        ps({ k: 'ring', x: ax, y: ay, r: 6, v: 130, d: .25, life: .85, c: BLU.a, w: 3, e: .42 });
        ps({ k: 'ring', x: ax, y: ay, r: 4, v: 80, d: .25, life: 1, c: '255,255,255', w: 2, e: .42 });
        ps({ k: 'gl', x: ax, y: ay - 6, r: 64, c: BLU.mid, life: .9 });
        sparks(ax, ay, 28, BLU, 26);
        sn('appear');
        sn('pickup');
      }
    } else {
      if (!D.fl && D.t > .55) {
        D.fl = 1;
        shake = Math.max(shake, 3);
        ps({ k: 'ring', x: D.x, y: D.y + 8, r: 10, v: 170, d: .2, life: .55, c: '255,255,255', w: 2.5, e: .42 });
        sn('dodge');
      }
      if (D.t >= B) {
        D.on = 0;
        clearIn();
        msg('Gelombang 1 dimulai! [B] kembali ke lobby');
      }
    }
  }

  /* ---------- gambar di dunia ---------- */
  function world() {
    var T = D.t, x = D.x, y = D.y;
    if (!D.ph) {
      var I = ez(cl((T - .3) / .6)) * (1 - ez(cl((T - 1.9) / .4)));
      if (I > 0) {
        var gr = g.createRadialGradient(x, y - 2, 0, x, y - 2, 34);
        gr.addColorStop(0, 'rgba(215,190,255,' + .45 * I + ')');
        gr.addColorStop(1, 'rgba(120,80,255,0)');
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = gr;
        g.fillRect(x - 34, y - 36, 68, 68);
        g.restore();
      }
      pillar(x, y + 8, 20 + 24 * I, 240, I, VIO.pil);
    } else {
      var I2 = 1 - ez(cl(T / .95));
      pillar(x, y + 8, 14 + 26 * I2, 210, I2, BLU.pil);
    }
  }

  /* ---------- pahlawan tersedot / muncul ---------- */
  var _hero = drawHero, _armed = drawArmed;
  drawHero = function (x, y, gh, ph, lx, ly) {
    if (!D.on || gh)
      return _hero(x, y, gh, ph, lx, ly);
    var T = D.t, cx = x, cy = y + 8, s = 1, rot = 0, al = 1, ox = 0, oy = 0, a, lift;
    if (!D.ph) {
      portal(cx, cy, ez(cl(T / .55)) * (1 - ez(cl((T - 1.95) / .3))), T * 5 + T * T * 4, 1, VIO);
      a = ez(cl((T - .5) / 1.3));
      lift = Math.sin(cl((T - .35) / .75) * Math.PI) * 7;
      s = 1 - .95 * Math.pow(a, 1.4);
      rot = Math.pow(a, 1.6) * TAU * 3;
      oy = 8 * a - lift;
      ox = T < .5 ? (rnd() - .5) * 1.1 : 0;
      al = 1 - ez(cl((T - 1.65) / .25));
    } else {
      portal(cx, cy, 1 - ez(cl((T - .3) / .8)), -T * 6, 1 - cl((T - .5) / .6) * .5, BLU);
      a = eo(cl((T - .12) / .75));
      s = .3 + .7 * a;
      rot = (1 - a) * -TAU * 1.5;
      oy = -(1 - a) * 24;
      al = cl((T - .08) / .3);
    }
    g.save();
    D.open = 1;
    g.globalAlpha *= al;
    g.translate(x + ox, y - 2 + oy);
    g.rotate(rot);
    g.scale(s, s);
    g.translate(-x, -(y - 2));
    _hero(x, y, gh, ph, lx, ly);
  };
  drawArmed = function (o) {
    _armed(o); if (D.open) {
      g.restore();
      D.open = 0;
    }
  };

  /* ---------- overlay layar: vinyet, kilat, gelap, banner ---------- */
  function banner() {
    var T = D.bt, inn = ez(cl((T - .3) / .55)), out = ez(cl((BT - T) / .7)), al = Math.min(inn, out);
    if (al <= 0)
      return;
    var L2 = D.lv == 2, L3 = D.lv == 3, by = Math.round(H * .24), bh = 66, ttl = L3 ? 'FROST CRYPT' : L2 ? 'LAVA DEPTHS' : 'ANCIENT HALLS', tc = L3 ? '#9fe4ff' : L2 ? '#ffa24d' : '#f8dfaa';
    var d = DF[D.df], lw = W * ez(cl((T - .25) / .7));
    g.save();
    g.textAlign = 'center';
    g.globalAlpha = al * .78;
    g.fillStyle = '#000';
    g.fillRect(0, by, W, bh);
    g.globalAlpha = al;
    g.fillStyle = L3 ? 'rgba(140,215,255,.9)' : L2 ? 'rgba(255,150,70,.9)' : 'rgba(216,184,120,.9)';
    g.fillRect((W - lw) / 2, by, lw, 1);
    g.fillRect((W - lw) / 2, by + bh - 1, lw, 1);
    g.font = '8px monospace';
    g.fillStyle = '#b9b4c8';
    g.fillText('\u2014 M E M A S U K I   D U N G E O N \u2014', W / 2, by + 15 - (1 - inn) * 6);
    var sc = 1 + (1 - inn) * .22;
    g.save();
    g.translate(W / 2, by + 41);
    g.scale(sc, sc);
    g.font = 'bold 22px monospace';
    g.fillStyle = 'rgba(0,0,0,.6)';
    g.fillText(ttl, 1, 1);
    g.fillStyle = tc;
    g.fillText(ttl, 0, 0);
    g.restore();
    g.font = '8px monospace';
    g.fillStyle = d.c;
    g.fillText('LEVEL ' + D.lv + '  \u00b7  ' + d.n + '  \u00b7  GELOMBANG 1', W / 2, by + 58 + (1 - inn) * 5);
    g.restore();
  }

  function screen() {
    g.save();
    if (D.on) {
      var T = D.t;
      if (!D.ph) {
        var va = ez(cl(T / 1.3)) * .6; /* sudut layar menggelap */
        if (va > 0) {
          var vg = g.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .85);
          vg.addColorStop(0, 'rgba(20,0,40,0)');
          vg.addColorStop(1, 'rgba(20,0,40,' + va + ')');
          g.fillStyle = vg;
          g.fillRect(0, 0, W, H);
        }
        var fa = cl((T - 1.55) / .2) * (1 - cl((T - 1.8) / .45));
        if (fa > 0) {
          g.fillStyle = 'rgba(245,235,255,' + fa * .9 + ')';
          g.fillRect(0, 0, W, H);
        }
        var ba = ez(cl((T - 1.7) / .5));
        if (ba > 0) {
          g.fillStyle = 'rgba(0,0,0,' + ba + ')';
          g.fillRect(0, 0, W, H);
        }
      } else {
        var bb = 1 - ez(cl(T / .6));
        if (bb > 0) {
          g.fillStyle = 'rgba(0,0,0,' + bb + ')';
          g.fillRect(0, 0, W, H);
        }
      }
    }
    g.restore();
    if (D.bt >= 0 && D.bt < BT)
      banner();
  }
  var _draw = draw;
  draw = function () {
    _draw();
    if (D.open) {
      g.restore();
      D.open = 0;
    }
    if (D.on || PS.length) {
      g.save();
      g.translate(SHX, SHY);
      g.scale(CAM_Z, CAM_Z);
      g.translate(-camX, -camY);
      if (D.on)
        world();
      psDraw();
      g.restore();
    }
    if (D.on || D.bt >= 0)
      screen();
  };
  var _upd = upd;
  upd = function (dt) {
    if (D.bt >= 0) {
      D.bt += dt;
      if (D.bt >= BT || lobby)
        D.bt = -1;
    }
    if (D.on) {
      step(dt);
      return;
    }
    if (PS.length)
      psStep(dt);
    _upd(dt);
  };
})();
/* ===== GERBANG DUNGEON (lobby): lengkungan batu besar, plakat "DUNGEON", lorong tangga gelap, lingkaran sihir & cahaya ungu agar jelas ini pintu ke dungeon ===== */
(() => {
  const b = BGL.getContext('2d'), R = (c, x, y, w, h) => { b.fillStyle = c; b.fillRect(x, y, w, h); };
  /* anak tangga batu di depan gerbang + karpet */
  R('rgba(0,0,0,.35)', 260, 46, 120, 8);
  [['#4a4358', 276, 46, 88, 5], ['#3f3950', 270, 51, 100, 5], ['#34304a', 264, 56, 112, 5]].forEach(([c, x, y, w, h]) => { R(c, x, y, w, h); R('#6a6482', x, y, w, 1); R('#1c1828', x, y + h - 1, w, 1); });
  R('#5a3144', 282, 46, 76, 15);
  R('#9c7a52', 282, 46, 2, 15);
  R('#9c7a52', 356, 46, 2, 15);
  /* lorong gelap + tangga turun */
  R('#07040f', 286, 12, 68, 36);
  const gq = b.createLinearGradient(0, 12, 0, 48);
  gq.addColorStop(0, '#0a0614');
  gq.addColorStop(.55, '#3a1a6a');
  gq.addColorStop(1, '#8a3ad0');
  b.fillStyle = gq;
  b.fillRect(288, 14, 64, 34);
  for (let i = 0; i < 5; i++) {
    const y = 22 + i * 5, w = 26 + i * 10;
    R('rgba(8,4,18,.6)', 320 - w / 2, y, w, 2);
    R('rgba(200,140,255,.3)', 320 - w / 2, y + 2, w, 1);
  }
  /* pilar batu berukir kiri & kanan */
  [262, 358].forEach(x => {
    R('#2b2740', x, 6, 20, 46); R('#3f3a5a', x, 6, 20, 3); R('#4a4568', x + 2, 9, 4, 43); R('#1b1830', x + 15, 9, 5, 43); for (let k = 0; k < 4; k++)
      R('#1b1830', x, 16 + k * 10, 20, 1); R('#2b2740', x - 3, 48, 26, 6); R('#4f4a80', x - 3, 48, 26, 1); R('#7a2a9a', x + 7, 22, 6, 10); R('#c58aff', x + 8, 24, 4, 6);
  });
  /* lengkung atas + batu kunci + gigi gerbang besi yang terangkat */
  R('#2b2740', 262, 10, 116, 5);
  R('#8a82b0', 262, 10, 116, 1);
  R('#4f4a80', 304, 3, 32, 11);
  R('#3f3a5a', 306, 5, 28, 8);
  for (let x = 290; x < 352; x += 6) {
    R('#8d8aa0', x, 15, 2, 8);
    R('#c9c6d8', x, 15, 1, 7);
    R('#5a566a', x, 23, 2, 2);
  }
  R('#5a566a', 288, 14, 64, 2);
  /* plakat nama */
  R('#14101f', 292, 1, 56, 11);
  R('#c2a06b', 292, 1, 56, 1);
  R('#c2a06b', 292, 11, 56, 1);
  R('#c2a06b', 292, 1, 1, 11);
  R('#c2a06b', 347, 1, 1, 11);
  b.font = 'bold 8px monospace';
  b.textAlign = 'center';
  b.fillStyle = '#ffd978';
  b.fillText('DUNGEON', 320, 9);
  /* tanda tengkorak di pilar */
  [[272, 36], [368, 36]].forEach(([x, y]) => { R('#d8d2c4', x - 4, y, 8, 7); R('#14121f', x - 3, y + 2, 2, 2); R('#14121f', x + 1, y + 2, 2, 2); R('#14121f', x - 1, y + 5, 2, 2); });
  /* cincin rune redup di lantai */
  b.strokeStyle = 'rgba(150,100,255,.35)';
  b.lineWidth = 1.5;
  b.beginPath();
  b.ellipse(320, 72, 40, 14, 0, 0, 7);
  b.stroke();
  b.lineWidth = 1;
})();
const _envFxDG = envFx;
envFx = function () {
  _envFxDG();
  if (!lobby || !p)
    return;
  const dd = Math.hypot(p.x - 320, p.y - 44), nr = Math.max(0, 1 - dd / 150), pu = .5 + .5 * Math.sin(t * 2.4);
  g.save();
  g.globalCompositeOperation = 'lighter';
  const rg = g.createRadialGradient(320, 34, 4, 320, 40, 70 + 14 * pu + 24 * nr);
  rg.addColorStop(0, 'rgba(170,90,255,' + (.35 + .2 * pu + .25 * nr) + ')');
  rg.addColorStop(1, 'rgba(120,40,220,0)');
  g.fillStyle = rg;
  g.fillRect(220, 0, 200, 130);
  g.save();
  g.translate(320, 72);
  g.scale(1, .36);
  g.strokeStyle = 'rgba(190,130,255,' + (.35 + .3 * pu + .3 * nr) + ')';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(0, 0, 40, 0, 7);
  g.stroke();
  g.rotate(t * .8);
  g.setLineDash([6, 8]);
  g.beginPath();
  g.arc(0, 0, 30, 0, 7);
  g.stroke();
  g.setLineDash([]);
  for (let i = 0; i < 6; i++) {
    g.rotate(1.0472);
    g.fillStyle = 'rgba(220,170,255,.8)';
    g.fillRect(29, -1.5, 5, 3);
  }
  g.restore();
  for (let i = 0; i < 10; i++) {
    const u = (t * .4 + i * .1) % 1, x = 320 + Math.sin(i * 5.3 + t * 1.2) * (10 + u * 22), y = 42 + u * 36;
    g.fillStyle = 'rgba(' + (i % 2 ? '200,140,255' : '255,120,200') + ',' + (.8 * (1 - u)) + ')';
    g.fillRect(Math.round(x), Math.round(y), 2, 2);
  }
  g.restore();
  const bob = Math.round(Math.sin(t * 3) * 2);
  g.font = 'bold 9px monospace';
  txt('\u25b2 DUNGEON', 320, 100 + bob, 'rgba(230,200,255,' + (.7 + .3 * pu) + ')', 'center');
};
/* ===== MODE ENDLESS: gelombang tanpa akhir di arena pertama, makin banyak & kuat, mini bos tiap 5 gelombang ===== */
let ENDLESS = 0, ESEL = 0, EDEAD = 0, EBEST = 0, ELW = -1, ELV = 0, ELS = 0;
const ETH = ['', 'ANCIENT HALLS', 'LAVA DEPTHS', 'FROST CRYPT'];
try {
  EBEST = +localStorage.getItem('eoa_endless_best') || 0;
} catch (er) { }
const _txtEN = txt;
txt = function (s, x, y, c, al) {
  if (ENDLESS && !lobby && typeof s == 'string' && s.indexOf('Gelombang ') == 0)
    s = s.replace('/5', ''); return _txtEN(s, x, y, c, al);
};
const _enterEN = enterDungeon;
enterDungeon = function () {
  ENDLESS = ESEL ? 1 : 0; EDEAD = 0; ELW = -1; ELV = 0; if (ENDLESS && !ELS)
    ELS = LVL; _enterEN(); if (ENDLESS)
    msg('\u267e ENDLESS \u00b7 Colosseum Abyss \u2014 bertahan selama mungkin! Rekor: Gelombang ' + EBEST);
};
const _spawnEN = spawn;
spawn = function () {
  if (ENDLESS && !lobby && room == 0) {
    if (wave != ELW) {
      let v;
      do {
        v = 1 + (R() * 3 | 0);
      } while (v == ELV);
      ELV = v;
      ELW = wave;
      if (wave > 1)
        msg('\u267e Gelombang ' + wave + ' \u2014 musuh ' + ETH[v]);
    }
    LVL = ELV;
    try {
      window.EBGC = EBGS[LVL] || (EBGS[LVL] = buildEndBG(LVL));
    } catch (er) { }
  }
  _spawnEN();
  if (!ENDLESS || lobby || room != 0)
    return;
  const n = Math.min(Math.max(0, Math.floor((wave - 3) * .8)), 14), hm = (1 + Math.max(0, wave - 5) * .12) * DF[DIFF].hp * (LVL == 2 ? 1.15 : LVL == 3 ? 1.2 : 1);
  for (let j = 0, c = 0; j < n && c < 400; c++) {
    const x = 200 + R() * 560, y = 50 + R() * 380;
    if (!blk(x, y, 9)) {
      const e = mk(['slime', 'skel', 'mage'][R() * 3 | 0], x, y);
      e.hp = e.mhp = e.hp * hm;
      e.sd = j * .1;
      e.st = 1.1 + e.sd;
      e.sw = e.st;
      e.sx = 0;
      es.push(e);
      j++;
    }
  }
};
const _updEN = upd;
upd = function (dt) {
  if (ENDLESS && !lobby && room == 0) {
    if (p.dead > 0 && !EDEAD) {
      EDEAD = 1;
      const nb = wave - 1 > EBEST;
      if (nb) {
        EBEST = wave - 1;
        try {
          localStorage.setItem('eoa_endless_best', EBEST);
        } catch (er) { }
      }
      msg('\u267e ENDLESS selesai \u2014 bertahan sampai Gelombang ' + wave + (nb ? ' \u00b7 REKOR BARU!' : ' \u00b7 Rekor: ' + EBEST));
    }
    if (!es.length && !clr && !doorOn && p.dead <= 0) {
      if (wave % 5 == 0 && !MBD) {
        MBD = 1;
        spawnMinis();
        const m = 1 + (wave / 5 - 1) * .45;
        es.forEach(e => {
          if (e.mini)
            e.hp = e.mhp = Math.round(e.mhp * m);
        });
        msg('\u267e Gelombang ' + wave + ' \u2014 MINI BOS muncul!');
      } else {
        clr = 3.5;
        if (wave > EBEST) {
          EBEST = wave;
          try {
            localStorage.setItem('eoa_endless_best', EBEST);
          } catch (er) { }
        }
        p.hp = Math.min(mhp(), p.hp + Math.round(mhp() * (wave % 5 == 0 ? .4 : .12)));
        if (wave % 3 == 0)
          p.pot = Math.min(5, (p.pot || 0) + 1);
        msg('Gelombang ' + wave + ' selesai! HP pulih' + (wave % 3 == 0 ? ' + potion' : '') + ' \u2014 gelombang ' + (wave + 1) + ' lebih kuat...');
        SFX.clear();
      }
    }
  }
  _updEN(dt);
};
const _drawEN = draw;
draw = function () {
  _drawEN(); if (ENDLESS && !lobby && room == 0) {
    g.save();
    g.font = 'bold 10px monospace';
    txt('\u267e ENDLESS  \u00b7  GELOMBANG ' + wave + '  \u00b7  ' + ETH[LVL] + '  \u00b7  REKOR ' + EBEST, W / 2, 14, '#ffd98a', 'center');
    g.restore();
  }
};
(function () {
  const el = document.getElementById('dsel');
  if (!el)
    return;
  const ref = el.querySelector('.sub.sl'), s = document.createElement('div'), r = document.createElement('div');
  s.className = 'sub';
  s.textContent = 'MODE';
  r.className = 'row m';
  r.setAttribute('role', 'radiogroup');
  r.innerHTML = '<div class="cd md" data-m="0" role="radio"><i class="ic">' + DSIC.door + '</i><div class="tx"><b>NORMAL</b><small>5 gelombang, ruangan berikutnya, lalu bos.</small></div></div><div class="cd md" data-m="1" role="radio"><i class="ic">' + DSIC.inf + '</i><div class="tx"><b>ENDLESS</b><small>Satu arena (Colosseum Abyss), gelombang tanpa akhir. Musuh campur acak tiap gelombang. Mini bos tiap 5 gelombang. [E]</small></div></div>';
  ref.parentNode.insertBefore(s, ref);
  ref.parentNode.insertBefore(r, ref);
  const sync = () => {
    r.querySelectorAll('.md').forEach(n => { const on = +n.dataset.m == ESEL; n.classList.toggle('sel', on); n.setAttribute('aria-checked', on); }); el.classList.toggle('endm', !!ESEL); const ls = el.querySelector('.sub.sl'); if (ls)
      ls.textContent = ESEL ? 'LEVEL: DIACAK TIAP GELOMBANG' : 'LEVEL'; if (window.dsSum)
      window.dsSum();
  };
  r.addEventListener('click', e => {
    const c = e.target.closest('.md'); if (c) {
      ESEL = +c.dataset.m;
      sync();
    }
  });
  document.addEventListener('keydown', e => {
    if (dselOn && e.code == 'KeyE') {
      ESEL = ESEL ? 0 : 1;
      sync();
    }
  });
  const _o = window.openDungeonSelect;
  window.openDungeonSelect = function () {
    if (ELS) {
      LVL = ELS;
      ELS = 0;
    } _o(); sync();
  };
  document.getElementById('dsGo').addEventListener('click', () => {
    if (ESEL)
      msg('\u267e ENDLESS \u00b7 Colosseum Abyss \u2014 bertahan selama mungkin! Rekor: Gelombang ' + EBEST);
  });
  sync();
})();
/* ===== ARENA ENDLESS: "Colosseum Abyss" \u2014 peta 1 ruangan khusus (bukan Ancient Hall), warna mengikuti level ===== */
const WE = [
  ...WB(), ...[[190, 130], [190, 350], [420, 100], [420, 380], [640, 250], [560, 80], [560, 400]].map(([x, y]) => [x - 14, y - 14, 28, 28])
];
const TOE = [100, 200, 300, 400, 500, 600, 700].flatMap(x => [[x, 8], [x, DH - 7]]), BRE = [[40, 60], [40, DH - 60], [DW - 40, 60], [DW - 40, DH - 60]];
const LW0 = LWALLS[0], EBGS = {};

function buildEndBG(th) {
  const c = document.createElement('canvas');
  c.width = DW;
  c.height = DH;
  const b = c.getContext('2d');
  const P = {
    1: {
      f: ['#2f2a3a', '#363046', '#2a2534', '#3a334a'], w: '#1d1a26', wl: '#2e2940', a: '#b48cff', ar: '180,140,255'
    }, 2: {
      f: ['#3a2623', '#43302b', '#32201e', '#4a342d'], w: '#1c1110', wl: '#33201c', a: '#ff8a2a', ar: '255,140,40'
    }, 3: {
      f: ['#2c4a66', '#35597a', '#264059', '#3d6488'], w: '#15263a', wl: '#24405c', a: '#9fe4ff', ar: '150,225,255'
    }
  }[th] || {
    f: ['#2f2a3a', '#363046', '#2a2534', '#3a334a'], w: '#1d1a26', wl: '#2e2940', a: '#b48cff', ar: '180,140,255'
  };
  let sd = 11;
  const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, px = (x, y, w, h, col) => { b.fillStyle = col; b.fillRect(Math.round(x), Math.round(y), w, h); }, cx = DW / 2, cy = DY, TAU = Math.PI * 2;
  for (let y = 0, j = 0; y < DH; y += 32, j++)
    for (let x = -(j % 2) * 24; x < DW; x += 48) {
      px(x + 1, y + 1, 46, 30, P.f[r() * 4 | 0]);
      px(x + 1, y + 1, 46, 1, 'rgba(255,255,255,.07)');
      px(x + 1, y + 30, 46, 1, 'rgba(0,0,0,.35)');
      px(x + 46, y + 1, 1, 30, 'rgba(0,0,0,.3)');
    }
  b.save();
  b.shadowColor = P.a;
  b.shadowBlur = 10;
  b.strokeStyle = 'rgba(' + P.ar + ',.55)';
  [200, 160, 110, 60].forEach((rr, i) => { b.lineWidth = i ? 2 : 3; b.setLineDash(i % 2 ? [10, 6] : []); b.beginPath(); b.arc(cx, cy, rr, 0, TAU); b.stroke(); });
  b.setLineDash([]);
  b.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12;
    b.beginPath();
    b.moveTo(cx + Math.cos(a) * 60, cy + Math.sin(a) * 60);
    b.lineTo(cx + Math.cos(a) * 200, cy + Math.sin(a) * 200);
    b.stroke();
  }
  b.beginPath();
  for (let i = 0; i <= 8; i++) {
    const a = (i * 3 % 8) * TAU / 8 - Math.PI / 2, X = cx + Math.cos(a) * 100, Y = cy + Math.sin(a) * 100;
    i ? b.lineTo(X, Y) : b.moveTo(X, Y);
  }
  b.stroke();
  b.restore();
  for (let i = 0; i < 36; i++) {
    const a = i * TAU / 36;
    px(cx + Math.cos(a) * 180 - 1, cy + Math.sin(a) * 180 - 1, 3, 3, P.a);
  }
  const gl = b.createRadialGradient(cx, cy, 0, cx, cy, 120);
  gl.addColorStop(0, 'rgba(' + P.ar + ',.22)');
  gl.addColorStop(1, 'rgba(' + P.ar + ',0)');
  b.fillStyle = gl;
  b.fillRect(cx - 120, cy - 120, 240, 240);
  WB().forEach(([x, y, w, h]) => {
    px(x, y, w, h, P.w); for (let yy = y; yy < y + h; yy += 7)
      for (let xx = x - ((yy / 7 | 0) % 2 ? 10 : 0); xx < x + w; xx += 20)
        px(xx + 1, yy + 1, 18, 5, r() < .5 ? P.wl : P.w);
  });
  b.fillStyle = 'rgba(' + P.ar + ',.6)';
  b.fillRect(14, 14, DW - 28, 2);
  b.fillRect(14, DH - 16, DW - 28, 2);
  b.fillRect(14, 14, 2, DH - 28);
  b.fillRect(DW - 16, 14, 2, DH - 28);
  WE.slice(4).forEach(([x, y, w, h]) => { const mx = x + w / 2, my = y + h / 2; b.fillStyle = 'rgba(0,0,0,.45)'; b.beginPath(); b.ellipse(mx + 4, my + 8, 17, 12, 0, 0, TAU); b.fill(); px(x - 1, y - 1, w + 2, h + 2, '#120e16'); px(x, y, w, h, P.wl); const q = b.createRadialGradient(mx - 3, my - 3, 1, mx, my, 12); q.addColorStop(0, P.f[3]); q.addColorStop(1, P.w); b.fillStyle = q; b.beginPath(); b.arc(mx, my, 11, 0, TAU); b.fill(); b.strokeStyle = P.a; b.lineWidth = 1.5; b.beginPath(); b.arc(mx, my, 11, 0, TAU); b.stroke(); px(mx - 1, my - 1, 2, 2, P.a); });
  TOE.forEach(([x, y]) => { px(x - 4, y - 3, 8, 10, '#1a1014'); px(x - 2, y + 2, 4, 4, P.a); });
  BRE.forEach(([x, y]) => {
    if (typeof bzBase == 'function')
      bzBase(b, x, y);
  });
  b.save();
  b.globalCompositeOperation = 'lighter';
  BRE.forEach(([x, y]) => { const q = b.createRadialGradient(x, y, 0, x, y, 110); q.addColorStop(0, 'rgba(' + P.ar + ',.18)'); q.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = q; b.fillRect(x - 110, y - 110, 220, 220); });
  b.restore();
  const v = b.createRadialGradient(cx, cy, 230, cx, cy, 470);
  v.addColorStop(0, 'rgba(4,2,8,0)');
  v.addColorStop(1, 'rgba(4,2,8,.6)');
  b.fillStyle = v;
  b.fillRect(0, 0, DW, DH);
  return c;
}
const _enterAR = enterDungeon;
enterDungeon = function () {
  _enterAR();
  window.ENDM = ENDLESS ? 1 : 0;
  LWALLS[0] = ENDLESS ? WE : LW0;
  if (ENDLESS) {
    walls = WE;
    TO = TOE;
    BR = BRE;
    p.x = DW / 2;
    p.y = DY;
    window.EBGC = EBGS[LVL] || (EBGS[LVL] = buildEndBG(LVL));
  }
};
const _updAR = upd;
upd = function (dt) {
  if (window.ENDM && !lobby) {
    walls = WE;
    TO = TOE;
    BR = BRE;
  } _updAR(dt);
};

/* ===== Suara senjata & skill lewat bus FX (bitcrush / saturated bass / crunch / clipping) ===== */
[
  'swing', 'chop', 'shot', 'hit', 'fireball', 'skill', 'charge', 'beat', 'ult', 'bhOpen', 'bhPulse', 'bhCollapse', 'bhBlast'
].forEach(n => {
  const o = SFX[n];
  if (typeof o != 'function')
    return;
  SFX[n] = function () {
    SFX.bus(true); try {
      return o.apply(this, arguments);
    } finally {
      SFX.bus(false);
    }
  };
});

/* ===== BOS LAVA DEPTHS & FROST CRYPT: begitu masuk FASE 3, HP bos terisi penuh lagi; fase 3 tetap dipertahankan ===== */
(function () {
  var HP = ['hp', 'health'], MX = ['mhp', 'maxhp', 'maxHp', 'hpMax', 'hpmax', 'maxHealth', 'max'];
  var pick = function (o, names) { for (var i = 0; i < names.length; i++) if (typeof o[names[i]] == 'number') return names[i]; return null; };
  var st = { healed: 0, peak: 0, lastPh: 0, logged: 0 };
  /* objek yang menyimpan HP bos: BOSS sendiri, atau entitas bos di daftar musuh */
  var target = function () {
    if (typeof BOSS == 'undefined' || !BOSS) return null;
    if (pick(BOSS, HP)) return BOSS;
    if (typeof es != 'undefined' && es) for (var i = 0; i < es.length; i++) { var e = es[i]; if (e && (e.boss || e.isBoss || /boss/i.test(e.k || '')) && pick(e, HP)) return e; }
    return null;
  };
  var bossFight = function () {
    if (typeof BOSS == 'undefined' || !BOSS || typeof room == 'undefined' || room != 2) return false;
    if (typeof ENDLESS != 'undefined' && ENDLESS) return false;
    return typeof LVL != 'undefined' && (LVL == 2 || LVL == 3);
  };
  var tick = function () {
    if (!bossFight() || (typeof p != 'undefined' && p && p.dead > 0)) { st.healed = 0; st.peak = 0; st.lastPh = 0; return; }   // keluar ruang bos / pemain mati = pertarungan baru
    var ph = BOSS.ph || 1, o = target();
    if (!st.healed && ph < 3) { if (o) { var hk0 = pick(o, HP); if (o[hk0] > st.peak) st.peak = o[hk0]; var mk0 = pick(o, MX); if (mk0 && o[mk0] > st.peak) st.peak = o[mk0]; } }
    if (ph >= 3 && st.lastPh < 3 && !st.healed && o) {
      var hk = pick(o, HP), mk = pick(o, MX), full = Math.max(mk ? o[mk] : 0, st.peak, o[hk]);
      o[hk] = full; if (mk && o[mk] < full) o[mk] = full;
      st.healed = 1;
      try { msg('FASE 3! Bos mengamuk \u2014 HP pulih penuh!'); } catch (e) { }
      try { if (typeof shake != 'undefined') shake = Math.max(shake, 10); } catch (e) { }
    }
    /* kunci fase 3: HP kembali penuh tidak boleh menurunkan fase */
    if (st.healed && BOSS.ph < 3) BOSS.ph = 3;
    st.lastPh = st.healed ? 3 : ph;
    if (!st.logged && o) { st.logged = 1; try { console.info('[boss-p3] HP:', pick(o, HP), ' MAX:', pick(o, MX) || '(puncak terpantau)'); } catch (e) { } }
  };
  var _u = upd;
  upd = function (dt) {
    if (st.healed && typeof BOSS != 'undefined' && BOSS && BOSS.ph < 3 && bossFight()) BOSS.ph = 3;
    _u(dt);
    try { tick(); } catch (e) { }
  };
})();