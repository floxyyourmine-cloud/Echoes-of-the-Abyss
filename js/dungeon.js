/* ==========================================================================
   ECHOES OF THE ABYSS - DUNGEON, ROOMS & LIVING OVERWORLD MODULE
   Lava Rooms, Frost Crypt, Colosseum Abyss, Whispering Forest, and Lantern Valley Village.
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
   Lobby: portal ungu terbuka di gerbang → pahlawan berputar & tersedot → kilat + layar gelap
   Dungeon: pahlawan muncul dari portal biru → banner nama level & kesulitan */
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
  var A = 2.2, B = 1.4, BT = 3.8; /* detik: tersedot · muncul · lama banner */
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
    g.fillText('— M E M A S U K I   D U N G E O N —', W / 2, by + 15 - (1 - inn) * 6);
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
    g.fillText('LEVEL ' + D.lv + '  ·  ' + d.n + '  ·  GELOMBANG 1', W / 2, by + 58 + (1 - inn) * 5);
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
  txt('▲ DUNGEON', 320, 100 + bob, 'rgba(230,200,255,' + (.7 + .3 * pu) + ')', 'center');
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
    msg('♾ ENDLESS · Colosseum Abyss — bertahan selama mungkin! Rekor: Gelombang ' + EBEST);
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
        msg('♾ Gelombang ' + wave + ' — musuh ' + ETH[v]);
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
      msg('♾ ENDLESS selesai — bertahan sampai Gelombang ' + wave + (nb ? ' · REKOR BARU!' : ' · Rekor: ' + EBEST));
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
        msg('♾ Gelombang ' + wave + ' — MINI BOS muncul!');
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
        msg('Gelombang ' + wave + ' selesai! HP pulih' + (wave % 3 == 0 ? ' + potion' : '') + ' — gelombang ' + (wave + 1) + ' lebih kuat...');
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
    txt('♾ ENDLESS  ·  GELOMBANG ' + wave + '  ·  ' + ETH[LVL] + '  ·  REKOR ' + EBEST, W / 2, 14, '#ffd98a', 'center');
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
      msg('♾ ENDLESS · Colosseum Abyss — bertahan selama mungkin! Rekor: Gelombang ' + EBEST);
  });
  sync();
})();
/* ===== ARENA ENDLESS: "Colosseum Abyss" — peta 1 ruangan khusus (bukan Ancient Hall), warna mengikuti level ===== */
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
  // jalur: titik kontrol → polyline rapat (Catmull-Rom)
  function dense(pts, step) {
    const out = []; for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(2, Math.ceil(L / step));
      for (let k = 0; k < n; k++) { const u = k / n, u2 = u * u, u3 = u2 * u; out.push([.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3), .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]) }
    } out.push(pts[pts.length - 1].slice()); return out
  }
  function distPoly(px, py, dn) { let best = 1e9; for (let i = 0; i < dn.length; i++) { const d = Math.hypot(px - dn[i][0], py - dn[i][1]); if (d < best) best = d } return best }

  /* ---------- gambar orang (dipakai semua NPC luar ruangan) ---------- */
  const OUT = '#120e18';
  function person(n, i) {
    const x = Math.round(n.x), y = Math.round(n.y), tk = t + i * 1.7, talk = dlg && dlg.n === n, near = dist(n, p) < 90;
    // [animasi-npc] kecepatan, fase langkah, belok mulus, kedip tak beraturan
    const spd = n.spd || 0, wk = Math.min(1, spd / 22), ph = n._ph || 0, moving = spd > 5, mv = moving, dts = Math.min(.05, Math.max(0, t - (n._ft === undefined ? t : n._ft))); n._ft = t;
    n._nt = near && !moving ? (n._nt || 0) + dts : 0;
    const tf = talk || n._nt > .35 ? (p.x < n.x - 4 ? -1 : 1) : (n.fc || 1);
    n._fv = n._fv === undefined ? tf : n._fv + (tf - n._fv) * Math.min(1, dts * 13);
    const fc = Math.abs(n._fv) < .15 ? (n._fv < 0 ? -.15 : .15) : n._fv;
    const kk = n.kid ? 1.25 : 1, breath = (Math.sin(tk * 1.8) + 1) / 2 * .9, sw0 = Math.sin(ph) * wk;
    const bo = Math.round(breath * (1 - wk)) + Math.round(Math.abs(sw0) * 1.4 * kk);
    const bph = (tk + Math.sin(tk * .7) * 1.5) % 3.7, blink = bph < .12 || (bph > .3 && bph < .4 && Math.sin(tk * .31) > .6);
    const gl = !talk && wk < .1 && !n.sit && (tk % 7.3) > 5.2 && (tk % 7.3) < 6.3 ? 1 : 0, hx = Math.round(wk * 1.2) - gl;
    const sk = n.sk || '#e0b090', hair = n.hair || '#4a2a18', c1 = n.c1 || '#7a5a3a', c2 = n.c2 || '#d8b878', c3 = n.c3 || '#3a2e24', SH = 'rgba(0,0,0,.25)', HL = 'rgba(255,255,255,.16)', Q = [];
    const r = (a, b, w, h, c, o) => Q.push([a, b, w, h, c, o !== 0]), fl = () => { g.fillStyle = OUT; Q.forEach(q => q[5] && g.fillRect(q[0] - 1, q[1] - 1, q[2] + 2, q[3] + 2)); Q.forEach(q => { g.fillStyle = q[4]; g.fillRect(q[0], q[1], q[2], q[3]) }); Q.length = 0 };
    const rh = (a, b, w, h, c, o) => r(a + hx, b, w, h, c, o);
    g.save(); g.translate(x, y); const kid = n.kid; if (kid) g.scale(.8, .8);
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
    g.translate(0, by); const bt = -bo;
    // badan
    g.save(); g.translate(0, bt);
    r(-6, -10, 12, 13, c1); r(3, -9, 3, 11, SH, 0); r(-5, -9, 2, 9, HL, 0);
    if (n.apron) { r(-4, -8, 8, 11, n.apron); r(-4, -8, 8, 1, 'rgba(255,255,255,.3)', 0); r(-4, 2, 8, 1, 'rgba(0,0,0,.2)', 0) }
    if (n.armor) { r(-6, -10, 12, 8, '#8a909e'); r(-5, -10, 3, 6, '#bcc2cf', 0); r(4, -10, 2, 7, '#5a5f6c', 0); r(-1, -9, 1, 6, '#6a6f7c', 0); r(-8, -11, 4, 4, '#9aa0ae'); r(4, -11, 4, 4, '#9aa0ae') }
    if (n.vest) { r(-6, -10, 3, 13, n.vest); r(3, -10, 3, 13, n.vest) }
    r(-6, 0, 12, 2, c2); r(-1, 0, 2, 2, '#f4e2a8', 0);
    // lengan belakang & depan
    const arm = n.arm || 0, aw = sw * 2.5 + (1 - wk) * Math.sin(tk * 1.6) * .6, a = Math.round(aw), ta = talk ? Math.round(Math.max(0, Math.sin(t * 4.3)) * 3) : 0, hk = (tk * 1.1) % 1, hl = n.prop == 'hammer' && !talk ? Math.round(hk < .8 ? hk / .8 * 3 : (1 - (hk - .8) / .2) * 3) : 0;
    r(-9, -9, 3, 8 + a, c1); r(-9, -1 + a, 3, 3, sk);
    if (n.prop == 'hammer') { r(7, -10, 3, 7 - hl, c1); r(7, -3 - hl, 3, 3, sk); r(7, -14 - hl, 2, 12, '#5a3a22'); r(5, -17 - hl, 8, 5, '#6a6f7c'); r(5, -17 - hl, 8, 1, '#bcc2cf', 0) }
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
    if (blink) { rh(-3, -16, 2, 1, '#3a2418', 0); rh(1, -16, 2, 1, '#3a2418', 0) } else { rh(-3, -17, 2, 2, '#f4eee8', 0); rh(1, -17, 2, 2, '#f4eee8', 0); rh(-2 - gl, -17, 1, 2, '#2a1a14', 0); rh(2 - gl, -17, 1, 2, '#2a1a14', 0) }
    if (n.brow !== 0) { rh(-3, -19, 2, 1, n.hairb || hair, 0); rh(1, -19, 2, 1, n.hairb || hair, 0) }
    rh(-4, -15, 1, 1, 'rgba(255,120,130,.55)', 0); rh(3, -15, 1, 1, 'rgba(255,120,130,.55)', 0);
    if (talk && Math.floor(t * 9) % 2) rh(-1, -14, 2, 2, '#5a2020', 0); else rh(-1, -14, 2, 1, '#a8483a', 0);
    if (n.glasses) { rh(-4, -18, 4, 3, 'rgba(180,220,255,.35)', 0); rh(0, -18, 4, 3, 'rgba(180,220,255,.35)', 0); rh(-1, -17, 2, 1, '#2a2030', 0) }
    fl(); g.restore(); g.restore();
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
  // set ulang area lobby (setLobby hanya memulihkan NPC) → pakai fungsi asli toLobby tanpa pesan
  function _toLobbyArea() { const m = msgS, mt = msgT; _toLobby(); msgS = m; msgT = mt; fade = 0; walls = WL }
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
    if (TR.on) { if (TR.dO > .02 && (TR.k === 'toForest' || TR.k === 'toLobby')) drawLobbyDoor(TR.dO); return }
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
  txt = function (s) { if (window.AREA !== 'lobby' && AREAS[window.AREA]) { if (s === 'LOBBY — ZONA AMAN') arguments[0] = AREAS[window.AREA].name; else if (s === 'Sanctum Hall') arguments[0] = AREAS[window.AREA].sub } return _txt.apply(this, arguments) };
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

    /* --- tebing + pintu dungeon --- */
    const cx0 = cliffRect[0], cx1 = cliffRect[0] + cliffRect[2];
    for (let cx = cx0; cx <= cx1; cx++) {
      const edge = Math.min(cx - cx0, cx1 - cx), rnd = edge < 16 ? Math.sqrt(1 - Math.pow((16 - edge) / 16, 2)) : 1, hh = Math.round((82 + vnoise(cx / 16, 0, 9) * 12) * (.55 + .45 * rnd));
      for (let yy = 0; yy < hh; yy++) { const n = vnoise(cx / 9, yy / 5, 11), n2 = vnoise(cx / 40, yy / 30, 12); let col = n < .33 ? '#4a4652' : n < .68 ? '#625e6c' : '#7a7686'; if (n2 > .66) col = n < .5 ? '#56606a' : '#6a7480'; if (yy < 4) col = '#8f8b9a'; if (yy > hh - 5) col = n < .5 ? '#3a3640' : '#4a4652'; rc(x, col, cx, yy, 1, 1) }
      rc(x, OLC, cx, hh, 1, 2)
    }
    for (let i = 0; i < 22; i++) { const a = cx0 + 10 + rng() * (cx1 - cx0 - 20), b = 6 + rng() * 70, l = 6 + rng() * 16; rc(x, '#34303c', a, b, 1, l); rc(x, '#8a8696', a + 1, b, 1, l * .6) }
    for (let i = 0; i < 60; i++) { const a = cx0 + rng() * (cx1 - cx0), b = rng() * 86; if (vnoise(a / 12, b / 8, 21) > .55) { rc(x, '#4a8a3a', a, b, 3, 2); rc(x, '#6aaa4a', a, b, 2, 1) } }
    for (let i = 0; i < 28; i++) { const a = cx0 + 8 + rng() * (cx1 - cx0 - 16), b = 80 + rng() * 10; rc(x, '#3a7a34', a, b - 6, 1, 8); rc(x, '#5a9a44', a + 1, b - 4, 1, 6) }
    ell(x, 'rgba(0,0,0,.32)', 210, 98, 190, 6);
    // bingkai pintu (batu)
    const DX = F.door.x; rc(x, OLC, DX - 25, 30, 50, 68); rc(x, '#a79c8b', DX - 24, 31, 48, 66); rc(x, '#c8bca8', DX - 24, 31, 48, 3);
    for (let j = 0; j < 7; j++) { rc(x, '#7a7060', DX - 24, 36 + j * 9, 7, 1); rc(x, '#7a7060', DX + 17, 36 + j * 9, 7, 1) }
    rc(x, '#8a7e6c', DX - 24, 34, 48, 1); rc(x, '#d8cbb4', DX - 8, 28, 16, 6); rc(x, OLC, DX - 8, 27, 16, 1); rc(x, '#a79c8b', DX - 3, 29, 6, 4); rc(x, '#4a8a3a', DX - 24, 31, 8, 3); rc(x, '#4a8a3a', DX + 12, 31, 10, 3); rc(x, '#3a7a34', DX - 22, 34, 2, 7); rc(x, '#3a7a34', DX + 18, 34, 2, 9);
    rc(x, '#b6a38a', DX - 22, 94, 44, 4); rc(x, '#d8cbb4', DX - 22, 94, 44, 1); rc(x, '#6b5f55', DX - 22, 97, 44, 1);
    // batu pijakan di depan pintu
    for (let i = 0; i < 3; i++) { rc(x, '#8a8696', DX - 18 + i * 12, 100 + (i % 2) * 6, 10, 5); rc(x, '#aaa6b6', DX - 18 + i * 12, 100 + (i % 2) * 6, 10, 1) }

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
    const SIGNS = [[256, 134, 'Papan Petunjuk', ['← Pintu Dungeon (Aula Kuno) ada di belakangmu. Hampiri pintunya lalu melangkahlah masuk bila ingin kembali ke Dungeon.', '→ Desa Lembah Lentera, ke arah timur lewat jalan tanah. Hati-hati di perjalanan, pengelana.']], [770, 330, 'Papan Jembatan', ['Jembatan Tua Sungai Sunyi. Papannya lapuk, tapi masih kuat menahan seorang pahlawan.', '→ Desa Lembah Lentera. Sebentar lagi sampai!']], [536, 352, 'Papan Perkemahan', ['↓ Perkemahan Pemburu. Api unggun menyala dan ramah pada musafir yang lelah.']], [1090, 322, 'Papan Mata Air', ['↑ Mata Air Suci. Air yang mengalir dari bawah Dungeon. Minumlah untuk memulihkan diri.']], [FW - 130, 396, 'Papan Gerbang', ['Gerbang Desa Lembah Lentera. Gerbang Desa Lembah Lentera terbuka! Melangkahlah ke timur untuk memasuki desa.']]];
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
    if (o.c) {
      const c = o.c, hop = c.st ? Math.abs(Math.sin(Math.min(1, c.hz / .34) * Math.PI)) * 6 : 0, X = Math.round(c.x), Y = Math.round(c.y); g.save(); g.translate(X, Y); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-4, 1, 9, 2); g.translate(0, -Math.round(hop)); g.scale(c.fc, 1);
      const R = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(a, b, w, h) }; R(-5, -5, 11, 6, '#1a1210'); R(-4, -4, 9, 5, c.col); R(-4, -4, 9, 2, 'rgba(255,255,255,.18)'); R(2, -8, 5, 5, '#1a1210'); R(3, -7, 3, 4, c.col); R(3, -12, 2, 5, '#1a1210'); R(3, -11, 1, 4, c.col); R(5, -11, 2, 4, '#1a1210'); R(5, -10, 1, 3, '#e8b8b0'); R(5, -6, 1, 1, '#1a1210'); R(-7, -4, 3, 3, '#f4efe6'); R(-3, 0, 2, 1, '#1a1210'); R(2, 0, 2, 1, '#1a1210'); g.restore(); return
    }
    if (o.ch) { const c = o.ch, s = c.open ? c.s1 : c.s0; g.drawImage(s.img, Math.round(c.x - s.ox), Math.round(c.y - s.oy)); if (c.open && c.t < 1.2) { lightL(c.x, c.y - 8, 30, '255,210,90', .4 * (1 - c.t / 1.2)) } else if (!c.open) { const a = .5 + .5 * Math.sin(t * 3 + c.x); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,240,170,' + a + ')'; g.fillRect(Math.round(c.x) + 5, Math.round(c.y) - 14, 1, 3); g.fillRect(Math.round(c.x) + 4, Math.round(c.y) - 13, 3, 1); g.restore() } }
  }
  function renderList() {
    const x0 = camX - 70, x1 = camX + W / CAM_Z + 70, y0 = camY - 10, y1 = camY + H / CAM_Z + 90, L = [];
    for (const o of F.objs) { if (o.x < x0 || o.x > x1 || o.y < y0 || o.y - o.oy > y1) continue; L.push(o) }
    for (const o of F.dyn) { const y = o.y; if (y < y0 - 20 || y > y1) continue; const s = o.n || o.c || o.ch; if (s.x < x0 || s.x > x1) continue; if (o.n) { const n = o.n; L.push({ y: n.y + (n.sit ? 0 : 0), n, i: o.i }) } else if (o.c) L.push({ y: o.c.y, c: o.c }); else L.push({ y: o.y, ch: o.ch }) }
    L.sort((a, b) => a.y - b.y); return L;
  }
  F.drawBack = function () { F._L = renderList(); const py = p.y + 3; for (const o of F._L) if (o.y <= py) drawObj(o) };
  F.drawFront = function () {
    const py = p.y + 3; for (const o of F._L) if (o.y > py) drawObj(o);
    // label NPC
    g.font = '8px monospace'; for (const n of NP) { const d = dist(n, p); if (d < 90) { if (!n.sign) txt(n.n.split(',')[0], n.x, n.y - 28, '#ffe9a8', 'center'); if (d < (n.rng || 36) && !dlg) txt('[G] ' + (n.verb || (n.sign ? 'Baca' : 'Bicara')), n.x, n.y - (n.sign ? 22 : 38), '#fff', 'center') } if (n.fresh && !dlg && !n.sign) { g.fillStyle = '#ffd34d'; g.fillRect(Math.round(n.x) - 1, Math.round(n.y - 36 + Math.sin(t * 4)), 3, 6); g.fillRect(Math.round(n.x) - 1, Math.round(n.y - 28 + Math.sin(t * 4)), 3, 2) } }
    // kupu-kupu
    for (const b of F.bf) { const a = t * .5 + b.ph, X = b.cx + Math.sin(a * 1.3) * 40 + Math.cos(a * .7) * 20, Y = b.cy + Math.sin(a * .9) * 20 - 14 + Math.sin(t * 5 + b.ph) * 2; if (X < camX - 10 || X > camX + W / CAM_Z + 10 || Y < camY - 10 || Y > camY + H / CAM_Z + 10) continue; const fl = Math.abs(Math.sin(t * 14 + b.ph)); g.fillStyle = b.c; g.fillRect(Math.round(X) - 2 - (fl > .5 ? 1 : 0), Math.round(Y), 2, 2); g.fillRect(Math.round(X) + 1, Math.round(Y), 2 + (fl > .5 ? 1 : 0), 2); g.fillStyle = '#2a1a10'; g.fillRect(Math.round(X), Math.round(Y), 1, 2) }
    const vw = W / CAM_Z, vh = H / CAM_Z;
    // berkas cahaya matahari
    g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const bx = camX + ((i * .27 + .08 + Math.sin(t * .13 + i) * .03) * vw), wd = 30 + i * 9, al = .045 + .02 * Math.sin(t * .6 + i * 1.7), gr = g.createLinearGradient(bx, camY, bx + wd, camY + vh); gr.addColorStop(0, 'rgba(255,240,170,' + al + ')'); gr.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(bx, camY); g.lineTo(bx + wd, camY); g.lineTo(bx + wd - vh * .45, camY + vh); g.lineTo(bx - vh * .45, camY + vh); g.fill() }
    // kunang-kunang & serbuk sari
    for (const f of F.ff) { const X = camX + (((f.bx * vw - t * f.sx * .5 - camX * .15) % vw) + vw) % vw, Y = camY + (((f.by * vh + Math.sin(t * .8 + f.ph) * 12 + f.sy * t * .3) % vh) + vh) % vh, a = .35 + .5 * Math.max(0, Math.sin(t * 2 + f.ph)); g.fillStyle = f.k < .5 ? 'rgba(255,245,160,' + a + ')' : 'rgba(255,255,255,' + a * .6 + ')'; g.fillRect(Math.round(X), Math.round(Y), 2, 2); if (f.k < .5) { g.fillStyle = 'rgba(255,240,140,' + a * .25 + ')'; g.fillRect(Math.round(X) - 1, Math.round(Y) - 1, 4, 4) } }
    g.restore();
    // daun berguguran
    for (const l of F.lv) { const X = camX + (((l.bx * vw + t * l.sp * .6 + Math.sin(t * 1.3 + l.ph) * 14) % vw) + vw) % vw, Y = camY + (((l.by * vh + t * l.sp) % vh) + vh) % vh, r = Math.sin(t * 3 + l.ph); g.fillStyle = l.c; g.fillRect(Math.round(X), Math.round(Y), r > 0 ? 3 : 2, r > 0 ? 2 : 3); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(Math.round(X), Math.round(Y) + (r > 0 ? 1 : 2), r > 0 ? 3 : 2, 1) }
  };
})();


/* ===== Pintu tebing hutan -> kembali ke lobby Dungeon ===== */
(function () {
  WORLD.onDungeonDoor = function () { WORLD.start('toLobby', { x0: p.x, y0: p.y }); msg('Kau kembali masuk ke Dungeon...') };
})();

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
  V.clock = 15; V.night = 0; V.rain = 0; V.rainOn = 0; V.rainT = 90 + Math.random() * 60;
  const nightOf = h => (h >= 20 || h < 4) ? 1 : h >= 18 ? sm((h - 18) / 2) : h < 6 ? 1 - sm((h - 4) / 2) : 0;

  const rng = mkRng(4242), FC = [0, '#ffffff', '#ffd34d', '#ff9ac0', '#b48cff'];
  const GC = [['#3f7a30', '#5aa040'], ['#4a8a34', '#7ab848'], ['#356a2c', '#58983c']];
  let tufts = [], pigeons = [], ducks = [], fishes = [], bfly = [];

  const CH = {
    Mira: ['Herba segar, herba segar!', 'Ramuan baru sudah matang~'], Tamsin: ['Harga adil, senyum gratis!', 'Apa pun ada, apa pun kubeli!'],
    Borin: ['*TANG! TANG!*', 'Baja panas, tangan sabar.'], Hanna: ['Sup hangat siap disajikan!', 'Kamar kosong masih ada~'],
    Wren: ['Telur rebus, masih hangat!', 'Roti madu baru keluar oven~'], Lio: ['\u266a la la la ~', 'Satu bait lagi...'],
    Gaspar: ['Gagak-gagak itu lagi...', 'Labunya gemuk tahun ini!'], Finn: ['...', 'Sst. Ada yang menggigit!'],
    Nia: ['Kejar aku!', 'Hore!'], Tobi: ['Aku menang!', 'Nia curang!'], Rafi: ['Ada katak besar!', 'Kwek kwek!'],
    Kael: ['Semua aman.', 'Siapa di sana?'], Joko: ['Timur aman.', 'Hmm, tenang sekali.'],
    Rina: ['Kain halus, jahitan rapi~', 'Benangnya kurang satu warna.'], Doran: ['Kayu ini berat!', 'Satu kayu lagi...'],
    Sela: ['Bunga-bunga cantik~', 'Sedikit air lagi...'], Bima: ['Mana ayamku?', 'Jangan injak ayamnya!'],
    Aldous: ['Desa ini damai...', 'Pahlawan kita...'], Marta: ['Belanja dulu, ya.', 'Roti atau telur, ya?'],
    Salim: ['Pasar ramai hari ini!', 'Untung besar, untung besar.'], Nox: ['Lentera menyala, bisikan menjauh.', 'Malam yang tenang.']
  };
  const RAINL = ['Hujan!', 'Basah semua...', 'Cepat berteduh!'], NIGHTL = ['Sudah malam...', 'Dingin ya.'];
  const say = n => { const a = CH[n.n.split(',')[0]] || ['...'], r = Math.random(); if (V.rain > .4 && r < .6) return RAINL[(Math.random() * 3) | 0]; if (V.night > .6 && r < .3) return NIGHTL[(Math.random() * 2) | 0]; return a[(Math.random() * a.length) | 0] };

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
    V.npcs.forEach(n => { if (n.kid || /Petani|Peternak|Nelayan|Penebang|Penjahit|Tukang Taman/.test(n.n)) n.sleeps = 1 });
    V._all = V.dyn.slice();
    V.npcs.forEach(n => { if (n.nightOnly) { const k = NP.indexOf(n); if (k >= 0) NP.splice(k, 1) } });
    V._nt = false; V.dyn = V._all.filter(o => !(o.n && o.n.nightOnly));
  }

  // warga tidur di malam hari (hanya berganti saat tidak terlihat pemain, kecuali malam sudah pekat)
  function shift(force) {
    if (!V._all) return; const nt = !!V._nt, ext = nt ? V.night > .95 : V.night < .05;
    V.npcs.forEach(n => {
      const on = n.nightOnly ? nt : !(nt && n.sleeps), k = NP.indexOf(n); if (on === (k >= 0) || (dlg && dlg.n === n)) return;
      if (!force && !ext && Math.hypot(n.x - p.x, n.y - p.y) < 240) return;
      if (on) NP.push(n); else NP.splice(k, 1)
    });
    V.dyn = V._all.filter(o => { const s = o.n; return !s || NP.indexOf(s) >= 0 })
  }

  function life(dt) {
    V.clock = (V.clock + dt * 24 / DAY) % 24; V.night = nightOf(V.clock); V._nt = V.night > (V._nt ? .5 : .62);
    V.rainT -= dt; if (V.rainT <= 0) { V.rainOn = !V.rainOn; V.rainT = V.rainOn ? 30 + Math.random() * 30 : 110 + Math.random() * 120 }
    V.rain += ((V.rainOn ? 1 : 0) - V.rain) * Math.min(1, dt * .5);
    V._sc = (V._sc || 0) - dt; if (V._sc <= 0) { V._sc = 1; shift() }
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
      n._bn = t + 5 + Math.random() * 8; if (Math.hypot(n.x - p.x, n.y - p.y) < 190 && Math.random() < .6) n._b = { s: say(n), t: 3.4 }
    }
  }

  function ground() {
    const vw = W / CAM_Z, vh = H / CAM_Z, x0 = camX - 30, x1 = camX + vw + 30, y0 = camY - 30, y1 = camY + vh + 30, wet = V.rain, see = (x, y) => x > x0 && x < x1 && y > y0 && y < y1;
    for (const f of tufts) {
      if (!see(f.x, f.y)) continue;
      const dx = f.x - p.x, dy = f.y - p.y, d = Math.hypot(dx, dy), push = d < 26 ? (dx / (d + 1)) * (1 - d / 26) * 5 : 0, sw = Math.sin(t * 1.7 + f.ph + f.x * .02) * (1.1 + wet * 1.6) + push;
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
      for (let k = 1; k < N; k++) { const u = k / N, [x, y] = pt(u), sw = Math.sin(t * 2 + u * 7 + a * .01) * (1 + V.rain * 2); g.fillStyle = BC[(k + (a | 0)) % 5]; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 3, y); g.lineTo(x + sw * .6, y + 8); g.fill() }
    }
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
    const mist = cl(1 - Math.abs(h - 5.2) / 2.2, 0, 1);
    if (mist > .02) for (let i = 0; i < 6; i++) { const X = ((t * 4 + i * 390) % 2400) - 300, Y = 260 + i * 120; g.fillStyle = 'rgba(232,240,255,' + .11 * mist + ')'; g.beginPath(); g.ellipse(X, Y, 230, 36, 0, 0, 7); g.fill() }
    const gold = Math.max(cl(1 - Math.abs(h - 17.8) / 1.8, 0, 1), cl(1 - Math.abs(h - 6.4) / 1.3, 0, 1));
    if (gold > .02) { g.fillStyle = 'rgba(255,140,50,' + .13 * gold + ')'; g.fillRect(camX, camY, vw, vh) }
    if (n > .01) { g.fillStyle = 'rgba(5,9,42,' + .52 * n + ')'; g.fillRect(camX, camY, vw, vh) }
    if (r > .02) { g.fillStyle = 'rgba(30,40,70,' + .16 * r + ')'; g.fillRect(camX, camY, vw, vh) }
    if (n > .04) {
      g.globalCompositeOperation = 'lighter';
      for (const o of V.objs) {
        if (o.x < camX - 100 || o.x > camX + vw + 100 || o.y < camY - 60 || o.y > camY + vh + 140) continue;
        if (o.glow) lightL(o.x, o.y - 32, 64 + Math.sin(t * 6 + o.x) * 3, '255,196,100', .5 * n);
        if (o.lamp) o.lamp.forEach(([a, b]) => lightL(a, b + 4, 34, '255,205,120', .5 * n));
        if (o.forge) lightL(o.forge[0], o.forge[1], 52 + Math.sin(t * 11) * 4, '255,120,40', .35 * n)
      }
      lightL(p.x, p.y - 12, 80, '255,214,150', .26 * n); bunting(1);
      for (let i = 0; i < 36; i++) {
        const f = V.ff[i % V.ff.length], X = camX + (((f.bx * vw - t * f.sx * .4 - camX * .12 + i * 7) % vw) + vw) % vw, Y = camY + (((f.by * vh + Math.sin(t * .7 + f.ph + i) * 14) % vh) + vh) % vh, a = n * (1 - r) * (.35 + .6 * Math.max(0, Math.sin(t * 2.4 + f.ph + i)));
        g.fillStyle = 'rgba(190,255,140,' + a + ')'; g.fillRect(Math.round(X), Math.round(Y), 2, 2); g.fillStyle = 'rgba(190,255,140,' + a * .25 + ')'; g.fillRect(Math.round(X) - 1, Math.round(Y) - 1, 4, 4)
      }
      g.globalCompositeOperation = 'source-over'
    }
    if (r > .03) {
      const cnt = Math.round(150 * r); g.strokeStyle = 'rgba(195,215,245,' + .38 * r + ')'; g.lineWidth = 1; g.beginPath();
      for (let i = 0; i < cnt; i++) { const X = camX + ((i * 131.7 + t * 60) % vw), Y = camY + ((i * 79.3 + t * 430) % vh); g.moveTo(X, Y); g.lineTo(X - 3, Y + 9) } g.stroke();
      g.strokeStyle = 'rgba(210,230,255,.6)'; for (let i = 0; i < 24; i++) { const k = (t * 1.4 + i * .41) % 1; g.globalAlpha = (1 - k) * r; g.beginPath(); g.ellipse(camX + ((i * 211.3) % vw), camY + ((i * 97.7 + 60) % vh), 1 + k * 6, .5 + k * 2.4, 0, 0, 7); g.stroke() } g.globalAlpha = 1
    }
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

  // jam desa di HUD (di bawah pill emas)
  const _dr = draw;
  draw = function () {
    _dr.apply(this, arguments);
    if (window.AREA !== 'village' || !p || typeof W === 'undefined') return;
    guard(() => {
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      const hh = V.clock | 0, mm = (((V.clock % 1) * 6) | 0) * 10, s = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; g.font = 'bold 9px monospace';
      const tw = g.measureText(s).width + 24, X = W - 10 - tw, Y = 94;
      g.fillStyle = 'rgba(10,8,20,.62)'; g.fillRect(X, Y, tw, 14); g.fillStyle = '#c2a06b'; g.fillRect(X, Y, tw, 1); g.fillRect(X, Y + 13, tw, 1);
      if (V.rain > .4) { R('#9ab0d0', X + 4, Y + 3, 8, 4); R('#cfe0ff', X + 5, Y + 2, 5, 2); R('#7ab8ff', X + 5, Y + 8, 1, 3); R('#7ab8ff', X + 9, Y + 8, 1, 3) }
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
     dipasang di tepi timur KOLAM PEMANCINGAN (dekat dermaga & Finn si nelayan).
   - Spawn desa tetap di gerbang desa (tidak diubah).
   - Interaksi: dekati portal -> [G] (mobile: tombol BICARA) -> lanjutkan dialog -> teleport.
   - Transisi 'portalLobby': pahlawan berputar & tersedot ke pusaran -> kilat ungu ->
     muncul di lingkaran rune di Lobby.
   Posisi portal dicari otomatis (bebas tembok/pohon/NPC), lihat console: [portal-lobby].
   ===================================================================== */
(function () {
  'use strict';
  const V = WORLD.AREAS.village, SEQ = WORLD.SEQ;
  if (!V || !SEQ) return;
  const { TAU, E, lightL } = WORLD;
  const OLC = '#14100c';
  const POND = { x: 210, y: 650, rx: 96, ry: 44 };          // kolam pemancingan (sama dengan kolam desa)
  const LOBBY_SPAWN = [320, 322];                           // titik muncul di Lobby (sama dengan WORLD.go('lobby'))
  const SW = 1.9;                                           // detik: saat layar tertutup kilat -> pindah ke Lobby
  const PORTAL_ANCHOR = [384, 700];   // dekat kolam pemancingan
  const PT = V.portal = { x: PORTAL_ANCHOR[0], y: PORTAL_ANCHOR[1], boost: 0, near: 0, done: 0 };

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
    const free = typeof V.free === 'function' ? V.free : () => true;
    const Q = scan(PORTAL_ANCHOR[0], PORTAL_ANCHOR[1], -70, 70, -50, 40, (x, y) =>
      free(x, y, 10) && rimD(x, y, 30) >= 1 && !wallHit(x - 40, y - 26, x + 40, y + 14) && !npcHit(x, y + 22, 40));
    const pp = Q || PORTAL_ANCHOR;
    PT.x = pp[0]; PT.y = pp[1];
    if (!Q) console.warn('[portal-lobby] posisi bebas tidak ditemukan, memakai titik jangkar', pp);
    else console.info('[portal-lobby] portal =', [PT.x, PT.y]);

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
  const _df = V.drawFront;
  V.drawFront = function () {
    _df.apply(this, arguments);
    if (PT.done && !(WORLD.TR.on && WORLD.TR.k === 'portalLobby' && window.AREA !== 'village')) {
      const vw = W / CAM_Z, vh = H / CAM_Z;
      if (PT.x > camX - 120 && PT.x < camX + vw + 120 && PT.y > camY - 60 && PT.y < camY + vh + 160) guard(portalGlow);
    }
  };
  const _tk = V.tick;
  V.tick = function (dt) {
    _tk.call(this, dt);
    if (!PT.done) return;
    const d = Math.hypot(p.x - PT.x, p.y - (PT.y + 10));
    PT.near += ((d < 110 ? 1 : 0) - PT.near) * Math.min(1, dt * 3);
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
    dur: 4.0,
    f(T, dt) {
      const TR = WORLD.TR, ph = (a, b) => cl((T - a) / (b - a), 0, 1);
      if (T < SW) {
        // di Desa: berjalan ke lantai rune -> berputar, mengecil, tersedot ke pusaran -> kilat ungu
        const k = E(ph(0, .8)), s = E(ph(.8, 1.8)), mv = k > 0 && k < 1;
        p.x = TR.x0 + (PT.x - TR.x0) * k; p.y = TR.y0 + ((PT.y - 4) - TR.y0) * k;
        p.vx = 0; p.vy = mv ? -60 : 0; p.face = -Math.PI / 2; walk(dt, mv);
        TR.hs = 1 - s; TR.hy = 30 * s; TR.hr = 9 * s;
        PT.boost = E(ph(0, .9)); TR.pf = E(ph(1.3, SW));
        if (!TR.s1) { TR.s1 = 1; try { SFX.focus() } catch (e) { } }
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
        // di Lobby: lingkaran rune terbuka, pahlawan muncul berputar & membesar, lalu lingkaran menutup
        const s = E(ph(2.3, 3.2));
        TR.pf = 1 - E(ph(SW, 3.0)); TR.lob = E(ph(SW, 2.5)) * (1 - E(ph(3.3, 3.95)));
        TR.hs = s; TR.hy = 26 * (1 - s); TR.hr = -9 * (1 - s);
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
    ell(LX, LY + 3, 38 * k, 13 * k, 'rgba(10,4,30,.5)');
    g.lineWidth = 1.5; g.strokeStyle = 'rgba(190,150,255,' + .85 * k + ')'; g.beginPath(); g.ellipse(LX, LY + 3, 32 * k, 11 * k, 0, 0, TAU); g.stroke();
    g.lineWidth = 1; g.strokeStyle = 'rgba(150,200,255,' + .6 * k + ')'; g.beginPath(); g.ellipse(LX, LY + 3, 22 * k, 7.5 * k, 0, 0, TAU); g.stroke();
    for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + t * 1.2; R('rgba(225,205,255,' + .9 * k + ')', LX + Math.cos(a) * 27 * k, LY + 3 + Math.sin(a) * 9.2 * k, 2, 2) }
  }
  function lobbyRingLight(k) {
    lightL(LX, LY - 10, 60 * k + 4, '170,120,255', .45 * k);
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createLinearGradient(0, LY + 3, 0, LY - 90); gr.addColorStop(0, 'rgba(190,150,255,' + .5 * k + ')'); gr.addColorStop(1, 'rgba(190,150,255,0)');
    g.fillStyle = gr; g.fillRect(LX - 16 * k, LY - 90, 32 * k, 93);
    for (let i = 0; i < 14; i++) { const q = (t * .9 + i / 14) % 1; g.fillStyle = 'rgba(225,205,255,' + (1 - q) * .8 * k + ')'; g.fillRect(Math.round(LX + Math.sin(i * 3.1 + t * 2) * 14 * (1 - q * .4)), Math.round(LY + 2 - q * 80), 2, 2) }
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
      const TR = WORLD.TR; if (!(TR.on && TR.k === 'portalLobby' && TR.pf > .003)) return;
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(232,218,255,' + cl(TR.pf, 0, 1) + ')'; g.fillRect(0, 0, W, H); g.restore();
    });
  };
})();