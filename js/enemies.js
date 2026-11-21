/* ==========================================================================
   ECHOES OF THE ABYSS - ENEMIES, MINI-BOSSES & BOSSES MODULE
   Malakor, Morvath (3 forms), Kryovarth (Ice Dragon 3 phases), Mini-bosses.
   ========================================================================== */
    /* ===== RUANGAN 3: BOSS FIGHT ===== */
    const ROOM2_LAST_WAVE = 10; // wave (global) yang harus selesai di ruangan 2 agar pintu bos terbuka
    const BOSS_HP = 1600; // atur kesulitan di sini
    const BOSS = { on: 0, hz: [], q: [], ph: 1, intro: 0, dead: 0, vt: 0, ban: 0 };
    ET.boss = { hp: BOSS_HP, sp: 42, r: 13, c: '#b0152d', sg: 1e9, xp: 400, ht: 52 };
    EC.boss = ['#7a4a2e', '#3b2217', '#ff6a8a'];
    SPC.boss = ['255,120,140', '170,20,50'];
    SPH.boss = '#ff6a8a';

    /* ===== MODEL BOS: MINOTAUR (Morvath) ===== */
    let BOSS_E = null;
    const MNT = {
      fur: '#5a3522', furD: '#3b2217', furL: '#7a4a2e', skin: '#c89a7c', skinD: '#9a6e56', horn: '#e8dcc0', hornD: '#b3a283', hornR: '#8a7a60', hornT: '#fff4d8', iron: '#2c2a33', ironL: '#4d4a58', ironH: '#7d7a88', gold: '#d9aa3c', goldD: '#9a741f', leather: '#4a2a1a', cloth: '#7a1f30', clothD: '#521320', steel: '#9ba8b5', steelL: '#e0e5e9', steelD: '#5c6672', wood: '#6a4630', hoof: '#1a1218'
    };
    const mq = (x, y, w, h, c) => mr(x, y, Math.max(1, Math.round(w)), Math.max(1, Math.round(h)), c);
    const mm = (x, y, w, h, c) => { mr(x, y, w, h, c); mr(640 - x - w, y, w, h, c); }; // simetris kiri-kanan (sumbu x = 320)
    const bz = (u, x0, y0, x1, y1, x2, y2) => { const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, d = u * u; return [a * x0 + b * x1 + d * x2, a * y0 + b * y1 + d * y2]; };

    function mHorn(side, hd, cp) {
      const X = x => side > 0 ? x : 640 - x, M = MNT, tx = 222 + 16 * cp, ty = 64 + hd + 60 * cp;
      const P = [X(300), 160 + hd, X(204), 150 + hd, X(tx), ty], n = 24;
      for (let i = 0; i <= n; i++) {
        const u = i / n, [x, y] = bz(u, ...P), w = 21 - 15 * u;
        mq(x - w / 2, y - w / 2, w, w, M.hornD);
      }
      for (let i = 0; i <= n; i++) {
        const u = i / n, [x, y] = bz(u, ...P), w = (21 - 15 * u) * .62;
        mq(x - w / 2 - side, y - w / 2 - 1, w, w, u > .8 ? '#c01a30' : M.horn);
      }
      [.18, .4, .62].forEach(u => { const [x, y] = bz(u, ...P), w = 21 - 15 * u; mq(x - w / 2, y - 1, w, 2, M.hornR); });
    }

    function mArm(sx, sy, hx, hy, w0, w1, ex, vein) {
      const M = MNT, mx = (sx + hx) / 2 + ex, my = (sy + hy) / 2 + 4, n = 10, pts = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, [x, y] = bz(u, sx, sy, mx, my, hx, hy);
        pts.push([x, y, w0 + (w1 - w0) * u + Math.sin(u * Math.PI) * 6]);
      }
      pts.forEach(([x, y, w]) => mq(x - w / 2, y - w / 2, w, w, M.fur));
      pts.forEach(([x, y, w]) => mq(x - w / 2 + 1, y - w / 2 + 1, w * .26, w - 2, M.furL));
      pts.forEach(([x, y, w]) => mq(x + w / 2 - 4, y - w / 2 + 1, 3, w - 2, M.furD));
      if (vein)
        pts.forEach(([x, y, w], i) => {
          if (i % 2 && i < 8)
            mq(x - 1, y - 3, 2, 6, '#ff4a3a');
        });
      const [bx, by, bw] = pts[8]; // gelang besi di lengan bawah
      mq(bx - bw / 2 - 2, by - 5, bw + 4, 10, M.iron);
      mq(bx - bw / 2 - 2, by - 5, bw + 4, 2, M.ironH);
      mq(bx - 2, by - 2, 4, 4, M.gold);
      mq(hx - 12, hy - 8, 24, 20, M.fur);
      mq(hx - 12, hy + 6, 24, 5, M.furD);
      mq(hx - 12, hy - 8, 4, 18, M.furL);
      [-5, 1, 7].forEach(o => mq(hx + o, hy - 8, 2, 15, M.furD));
    }
    EM.boss = (pp, at, tm) => {
      const M = MNT, e = BOSS_E || {}, ph = BOSS.ph, PI = Math.PI, wk = e.wk || 0, ez = q => 1 - (1 - q) * (1 - q);
      const IDLE = PI + .35, SLAM = 2 * PI - .35;
      let a = IDLE + Math.sin(tm * 2) * .035, rz = 0, fz = 0, cp = 0, ro = 0;
      if (e.s2 == 'wind' && at) {
        const u = pp;
        if (e.atk == 'slam') {
          if (u < .72) {
            rz = ez(u / .72);
            a = IDLE - .25 * rz;
            ro = rz * .6;
          } else {
            const s = (u - .72) / .28, w = s * s, b = PI + .1;
            a = b + w * (SLAM - b);
            rz = 1 - w;
            ro = .6;
          }
        } else if (e.atk == 'rain') {
          rz = ez(u);
          fz = rz;
          a = IDLE - .3 * rz;
          ro = rz;
        } else if (e.atk == 'fan') {
          fz = ez(u);
          rz = .3 * fz;
          a = IDLE + .4 * fz;
          ro = u;
        } else if (e.atk == 'charge') {
          cp = ez(u);
          a = IDLE + .55 * cp;
        }
      } else if (e.s2 == 'act') {
        cp = 1;
        a = IDLE + .55;
      } else if (e.s2 == 'rest' && e.atk == 'slam') {
        const rec = Math.max(0, Math.min(1, e.tm / .7));
        const ss = rec * rec * (3 - 2 * rec);
        a = IDLE + (SLAM - IDLE) * ss + Math.sin((1 - rec) * 14) * .05 * rec;
      }
      const bb = Math.sin(tm * 2.2) * 1.3, hd = 12 * cp - 5 * ro + bb * .5, step = Math.sin(tm * 9) * 5 * wk;
      const eyeC = ph >= 3 ? '#ffb040' : '#ff3b4d', jw = 2 + Math.round(ro * 10);
      g.save();
      if (!MT) {
        g.fillStyle = 'rgba(0,0,0,.38)';
        g.beginPath();
        g.ellipse(320, 331, 66, 9, 0, 0, 7);
        g.fill();
      }
      if (!MT) {
        const ac = ph >= 3 ? '255,90,40' : ph == 2 ? '220,40,60' : '170,30,40', q = g.createRadialGradient(320, 250, 10, 320, 250, 160);
        q.addColorStop(0, 'rgba(' + ac + ',' + (.18 + ph * .05 + .04 * Math.sin(tm * 3)) + ')');
        q.addColorStop(1, 'rgba(' + ac + ',0)');
        g.fillStyle = q;
        g.fillRect(140, 90, 360, 270);
        if (ph >= 2)
          for (let i = 0; i < 6 + ph * 3; i++) {
            const u = (tm * .5 + i * .13) % 1;
            g.fillStyle = 'rgba(255,' + (90 + i * 10) + ',50,' + (1 - u) + ')';
            g.fillRect(Math.round(240 + (i * 37) % 160 + Math.sin(tm * 3 + i) * 6), Math.round(270 - u * 200), 3, 3);
          }
      }
      // Kaki berkuku
      mLeg(286, Math.max(0, step));
      mLeg(326, Math.max(0, -step));
      g.save();
      g.translate(0, bb + 8 * cp);
      // Torso berbulu
      mq(278, 210, 84, 68, M.fur);
      mq(280, 212, 6, 62, M.furL);
      mq(354, 212, 6, 62, M.furD);
      mm(284, 216, 34, 24, M.furL);
      mq(318, 216, 4, 52, M.furD);
      mm(298, 246, 20, 5, M.furL);
      mm(298, 255, 20, 5, M.furL);
      mm(300, 264, 18, 5, M.furL);
      mm(284, 236, 36, 3, M.furD);
      if (ph >= 2) {
        mm(292, 224, 3, 14, '#c8283e');
        mm(298, 226, 3, 14, '#c8283e');
      } // cat perang
      if (ph >= 3) {
        mm(288, 242, 2, 12, '#ff4a3a');
        mm(300, 270, 8, 2, '#ff4a3a');
        mm(296, 240, 2, 8, '#ff4a3a');
      } // urat membara
      // Harness kulit menyilang + medali emas
      for (let i = 0; i < 12; i++) {
        const x = 284 + i * 6, y = 214 + i * 4.7;
        mq(x, y, 8, 7, M.leather);
        mq(640 - x - 8, y, 8, 7, M.leather);
        mq(x, y, 8, 2, '#6a3e28');
        mq(640 - x - 8, y, 8, 2, '#6a3e28');
      }
      for (let i = 0; i < 9; i++) {
        const nx = 290 + i * 5.6, ny = 214 + Math.sin(i / 8 * PI) * 15;
        mq(Math.round(nx), Math.round(ny), 4, 7, M.horn);
        mq(Math.round(nx) + 1, Math.round(ny) + 6, 2, 3, M.hornD);
      }
      for (let i = 0; i < 4; i++) {
        mq(330 + i * 3, 226 + i * 6, 3, 5, '#d0907a');
      }
      mq(312, 234, 16, 16, M.goldD);
      mq(313, 235, 14, 14, M.gold);
      mq(317, 239, 6, 6, '#c8283e');
      mq(313, 235, 14, 2, '#f2d27a');
      // Sabuk + cawat
      mq(280, 268, 80, 11, M.leather);
      mq(280, 268, 80, 2, '#6a3e28');
      mq(310, 266, 20, 15, M.gold);
      mq(314, 270, 12, 7, M.goldD);
      mm(286, 271, 4, 4, M.ironH);
      mm(296, 271, 4, 4, M.ironH);
      mq(290, 279, 60, 15, M.cloth);
      mq(290, 279, 60, 3, M.clothD);
      mq(318, 282, 4, 12, M.clothD);
      for (let i = 0; i < 5; i++)
        mq(290 + i * 12, 294, 8, 5 + (i * 7) % 4, M.cloth);
      mm(276, 279, 14, 16, M.iron);
      mm(278, 281, 10, 2, M.ironL);
      mm(280, 287, 4, 4, M.gold);
      // Lengan: kiri (rantai putus di pergelangan) & kanan (pegang kapak)
      const hlx = 252 - 22 * fz - 6 * cp + Math.sin(tm * 9) * 3 * wk, hly = 292 - 56 * fz - 10 * cp + Math.sin(tm * 2) * 1.5 + Math.cos(tm * 9) * 2 * wk, hrx = 386 - 14 * rz + 4 * cp + Math.sin(tm * 9 + PI) * 3 * wk, hry = 288 - 62 * rz - 4 * cp + Math.sin(tm * 2 + 1) * 1.5 + Math.abs(Math.sin(tm * 9)) * 3 * wk;
      mArm(266, 234, hlx, hly, 36, 29, -8, ph >= 3);
      mArm(374, 234, hrx, hry, 36, 29, 8, ph >= 3);
      if (e.s2 == 'wind' && e.atk == 'fan')
        bossRockHand(hlx, hly, pp);
      for (let i = 0; i < 4; i++)
        mq(hlx - 3 + Math.sin(tm * 3 + i) * 2, hly + 12 + i * 5, 5, 4, M.ironH);
      // Pauldron besi bergerigi
      mm(248, 206, 38, 24, M.iron);
      mm(250, 204, 34, 5, M.ironL);
      mm(252, 208, 12, 3, M.ironH);
      mm(248, 226, 38, 4, M.gold);
      mm(256, 196, 7, 11, M.ironL);
      mm(270, 192, 7, 15, M.ironL);
      mm(243, 198, 7, 13, M.ironL);
      mm(262, 180, 7, 14, M.ironL);
      mm(277, 174, 6, 16, M.ironL);
      mm(264, 178, 3, 3, M.ironH);
      mm(279, 172, 3, 3, M.ironH);
      mm(258, 194, 3, 3, M.ironH);
      mm(272, 190, 3, 3, M.ironH);
      mm(254, 230, 30, 8, M.furD);
      // Leher + surai
      mq(272, 197, 96, 22, M.fur);
      mm(274, 195, 32, 6, M.furL);
      mm(278, 205, 26, 3, M.furD);
      mq(296, 196, 48, 22, M.furD);
      mq(300, 200, 8, 16, M.fur);
      mq(332, 200, 8, 16, M.fur);
      mq(289, 208, 62, 8, M.iron);
      mq(289, 208, 62, 2, M.ironH);
      for (let i = 0; i < 8; i++)
        mq(291 + i * 7.5 | 0, 200, 4, 9, M.ironL);
      // Kepala banteng
      mHorn(1, hd, cp);
      mHorn(-1, hd, cp);
      mm(276, 163 + hd, 18, 10, M.furD);
      mm(279, 165 + hd, 11, 5, '#b86a6a'); // telinga
      mq(294, 150 + hd, 52, 44, M.fur);
      mq(298, 146 + hd, 44, 8, M.furD);
      mq(306, 141 + hd, 28, 7, M.furD);
      mq(314, 137 + hd, 12, 6, M.furD);
      mm(296, 168 + hd, 6, 22, M.furL);
      mq(300, 152 + hd, 40, 10, M.furL);
      mq(317, 152 + hd, 6, 30, M.furD);
      for (let i = 0; i < 4; i++) {
        mq(298 + i * 6, 163 + hd + i * 2, 6, 8, M.furD);
        mq(640 - (298 + i * 6) - 6, 163 + hd + i * 2, 6, 8, M.furD);
      } // alis marah
      mm(300, 173 + hd, 18, 11, '#0c0405');
      mm(303, 175 + hd, 13, 7, eyeC);
      mm(303, 175 + hd, 13, 2, '#ffd0c0');
      mm(309, 175 + hd, 3, 7, '#1a0000');
      for (let i = 0; i < 6; i++)
        mm(297 + i * 4, Math.round(167 + hd + i * 1.6), 5, 5, '#24100b'); // alis tebal menukik: wajah murka
      for (let i = 0; i < 9; i++)
        mq(Math.round(298 + i * 1.6), 163 + hd + Math.round(i * 2.6), 2, 3, '#e8b8a0'); // bekas luka sobek
      mm(295, 178 + hd, 3, 13, '#c8283e');
      mm(299, 182 + hd, 2, 9, '#c8283e'); // cat perang
      if (!MT) {
        g.save();
        g.globalCompositeOperation = 'lighter';
        [309, 331].forEach(x => { const q = g.createRadialGradient(x, 179 + hd, 1, x, 179 + hd, 26); q.addColorStop(0, ph >= 3 ? 'rgba(255,190,70,.9)' : 'rgba(255,60,80,.85)'); q.addColorStop(1, 'rgba(255,40,40,0)'); g.fillStyle = q; g.fillRect(x - 26, 153 + hd, 52, 52); });
        g.restore();
      }
      if (!MT && ph >= 2) {
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = 'rgba(255,70,50,' + (.2 + .1 * Math.sin(tm * 8)) + ')';
        g.fillRect(298, 170 + hd, 24, 18);
        g.fillRect(318, 170 + hd, 24, 18);
        g.restore();
      }
      mq(300, 184 + hd, 40, 26, M.skinD);
      mq(304, 186 + hd, 32, 21, M.skin);
      mq(313, 180 + hd, 14, 8, M.skin);
      mm(311, 193 + hd, 5, 6, '#2a110d');
      mq(317, 199 + hd, 6, 2, M.gold);
      mq(316, 201 + hd, 2, 9, M.gold);
      mq(322, 201 + hd, 2, 9, M.gold);
      mq(317, 209 + hd, 6, 2, M.goldD); // anting hidung
      mq(306, 208 + hd, 28, jw, '#2a0c10');
      if (jw > 6)
        mq(314, 211 + hd, 12, jw - 3, '#b04050');
      mm(308, 204 + hd, 5, 9, '#efe4c8');
      mm(309, 204 + hd, 2, 3, '#ffffff');
      mq(308, 208 + hd + jw, 24, 6, M.skinD);
      mm(310, 205 + hd + jw, 3, 3, '#efe4c8');
      if (!MT)
        for (let i = 0; i < 4; i++) { // uap dari hidung
          const u = (tm * 1.3 + i * .27) % 1, side = i % 2, al = (1 - u) * (ph >= 3 ? .75 : .5);
          g.fillStyle = ph >= 3 ? 'rgba(255,150,70,' + al + ')' : 'rgba(235,235,245,' + al + ')';
          const s = 3 + u * 5;
          g.fillRect((side ? 332 : 308) - s / 2 + (side ? 1 : -1) * u * 6, 202 + hd - u * 16, s, s);
        }
      g.restore();
      // Kapak perang raksasa
      g.save();
      g.translate(hrx, hry);
      g.rotate(a);
      mq(-3, -22, 7, 134, M.wood);
      mq(-3, -22, 2, 134, '#8a5c40');
      mq(-4, -6, 9, 3, M.leather);
      mq(-4, 2, 9, 3, M.leather);
      mq(-5, -25, 10, 5, M.iron);
      [1, -1].forEach(s => {
        const rr = (x, y, w, h, c) => mr(s > 0 ? x : -x - w, y, w, h, c);
        rr(5, 76, 10, 32, M.steelD);
        rr(13, 71, 9, 42, M.steel);
        rr(21, 65, 8, 54, M.steel);
        rr(28, 62, 3, 60, M.steelL);
        rr(9, 80, 4, 24, M.steelL);
        rr(23, 102, 5, 13, '#7a1a24');
      });
      mq(-7, 72, 15, 38, M.iron);
      mq(-7, 72, 15, 3, M.gold);
      mq(-7, 107, 15, 3, M.gold);
      mq(-2, 78, 5, 26, M.ironL);
      mq(-3, 58, 7, 15, M.steelL);
      mq(-2, 110, 5, 11, M.steelL);
      g.restore();
      // Kepalan kanan menggenggam gagang
      mq(hrx - 12, hry - 8, 24, 20, M.fur);
      mq(hrx - 12, hry + 6, 24, 5, M.furD);
      mq(hrx - 12, hry - 8, 4, 18, M.furL);
      [-5, 1, 7].forEach(o => mq(hrx + o, hry - 8, 2, 15, M.furD));
      g.restore();
    };
    const W2 = [...WB(), [200, 120, 28, 28, 'p'], [200, 332, 28, 28, 'p'], [572, 120, 28, 28, 'p'], [572, 332, 28, 28, 'p']];
    const TO2 = [100, 200, 300, 400, 500, 600, 700].flatMap(x => [[x, 8], [x, DH - 7]]);
    const BR2 = [[40, 60], [40, DH - 60], [DW - 40, 60], [DW - 40, DH - 60]];
    const BGB = document.createElement('canvas');
    BGB.width = DW;
    BGB.height = DH;

    /* ===== LABIRIN MINOTAUR: arena batu pasir tua, perunggu, ukiran labirin & bukranion ===== */
    (function () {
      const b = BGB.getContext('2d');
      let sd = 7;
      const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
      const cx = DW / 2, cy = DY, TAU = Math.PI * 2, PI = Math.PI;
      const BRZ = '#b8863b', BRZD = '#6a4a22', BONE = '#d9ccb0', BONED = '#a8987a';
      const px = (x, y, w, h, c) => { b.fillStyle = c; b.fillRect(Math.round(x), Math.round(y), w, h); };
      const arc = (x, y, rr, a0, a1, c, lw) => { b.strokeStyle = c; b.lineWidth = lw; b.beginPath(); b.arc(x, y, rr, a0, a1); b.stroke(); };
      /* kepala banteng (dipakai di lantai, banner, dinding) */
      const bull = (x, y, s, hc, hl, sc, ss) => {
        b.save();
        b.translate(x, y);
        b.scale(s, s);
        b.lineCap = 'butt';
        [-1, 1].forEach(d => {
          b.strokeStyle = hc;
          b.lineWidth = 4;
          b.beginPath();
          b.moveTo(d * 6, 0);
          b.quadraticCurveTo(d * 23, 3, d * 20, -13);
          b.stroke();
          b.strokeStyle = hl;
          b.lineWidth = 2;
          b.beginPath();
          b.moveTo(d * 20, -7);
          b.lineTo(d * 20, -13);
          b.stroke();
        });
        b.fillStyle = sc;
        b.fillRect(-6, -5, 12, 11);
        b.fillRect(-4, 6, 8, 7);
        b.fillStyle = ss;
        b.fillRect(3, -5, 3, 11);
        b.fillRect(2, 6, 2, 7);
        b.fillStyle = '#120a0a';
        b.fillRect(-5, -1, 3, 3);
        b.fillRect(2, -1, 3, 3);
        b.fillRect(-2, 9, 1, 2);
        b.fillRect(1, 9, 1, 2);
        b.restore();
      };
      const skullB = (x, y, s) => bull(x, y, s, BONE, '#fff4d8', '#d8ccb0', BONED);
      /* 1. LANTAI: lempeng batu pasir tua yang aus */
      px(0, 0, DW, DH, '#150e0c');
      const FL = ['#3a2c27', '#41322b', '#34261f', '#3d2e26', '#46362c'];
      for (let y = 0, j = 0; y < DH; y += 32, j++)
        for (let x = -(j % 2) * 24; x < DW; x += 48) {
          px(x + 1, y + 1, 46, 30, FL[Math.floor(r() * 5)]);
          px(x + 1, y + 1, 46, 1, 'rgba(255,230,190,.07)');
          px(x + 1, y + 1, 1, 30, 'rgba(255,230,190,.05)');
          px(x + 1, y + 30, 46, 1, 'rgba(0,0,0,.35)');
          px(x + 46, y + 1, 1, 30, 'rgba(0,0,0,.3)');
          for (let i = 0; i < 5; i++)
            px(x + 3 + r() * 40, y + 3 + r() * 26, 1 + (r() * 2 | 0), 1, r() < .5 ? 'rgba(0,0,0,.22)' : 'rgba(255,230,190,.07)');
        }
      b.lineWidth = 1;
      b.strokeStyle = 'rgba(0,0,0,.5)';
      for (let i = 0; i < 16; i++) {
        let x = 30 + r() * (DW - 60), y = 30 + r() * (DH - 60), a = r() * TAU;
        b.beginPath();
        b.moveTo(x, y);
        for (let k = 0; k < 5; k++) {
          a += (r() - .5) * 1.2;
          x += Math.cos(a) * 9;
          y += Math.sin(a) * 9;
          b.lineTo(x, y);
        }
        b.stroke();
      }
      /* 2. PITA MEANDER (kunci Yunani) mengelilingi arena */
      const key = (x0, y0, len, ang) => {
        b.save();
        b.translate(x0, y0);
        b.rotate(ang);
        px(0, 0, len, 12, '#1b1210');
        px(0, 0, len, 1, BRZD);
        px(0, 11, len, 1, BRZD);
        b.strokeStyle = BRZ;
        b.lineWidth = 1.5;
        for (let i = 0; i + 12 <= len; i += 12) {
          b.beginPath();
          b.moveTo(i + 1, 10);
          b.lineTo(i + 1, 2);
          b.lineTo(i + 10, 2);
          b.lineTo(i + 10, 8);
          b.lineTo(i + 4, 8);
          b.lineTo(i + 4, 5);
          b.lineTo(i + 7, 5);
          b.stroke();
        }
        b.restore();
      };
      key(16, 16, DW - 32, 0);
      key(16, DH - 28, DW - 32, 0);
      key(28, 28, DH - 56, PI / 2);
      key(DW - 16, 28, DH - 56, PI / 2);
      /* 3. JEJAK KAKI BANTENG dari pintu masuk menuju pusat */
      for (let i = 0; i < 11; i++) {
        const x = 60 + i * 17, y = cy + (i % 2 ? 13 : -13) + Math.sin(i) * 3;
        px(x - 3, y - 4, 2, 7, 'rgba(0,0,0,.4)');
        px(x + 1, y - 4, 2, 7, 'rgba(0,0,0,.4)');
        px(x - 3, y - 4, 6, 1, 'rgba(0,0,0,.2)');
      }
      /* 4. LABIRIN DI LANTAI: enam lingkar dengan celah berputar */
      [176, 156, 136, 116, 96, 76].forEach((rr, k) => {
        const a0 = k * 1.15 + .5, s = a0 + .3, e = a0 + TAU - .3;
        arc(cx, cy + 2, rr, s, e, 'rgba(0,0,0,.55)', 5);
        arc(cx, cy, rr, s, e, BRZD, 4);
        arc(cx, cy - 1, rr, s, e, BRZ, 2);
        [s, e].forEach(a => px(cx + Math.cos(a) * rr - 2, cy + Math.sin(a) * rr - 2, 4, 4, '#e0b866'));
      });
      arc(cx, cy + 2, 192, 0, TAU, 'rgba(0,0,0,.5)', 6);
      arc(cx, cy, 192, 0, TAU, BONED, 4);
      arc(cx, cy - 1, 193, 0, TAU, BONE, 1);
      for (let i = 0; i < 48; i++) {
        const a = i * TAU / 48;
        px(cx + Math.cos(a) * 184 - 1, cy + Math.sin(a) * 184 - 1, 3, 3, i % 4 ? BRZD : BRZ);
      }
      /* retakan lava yang menyala dari inti arena */
      b.save();
      b.shadowColor = '#ff2a44';
      b.shadowBlur = 8;
      b.lineCap = 'round';
      b.strokeStyle = 'rgba(255,70,80,.7)';
      b.lineWidth = 1.5;
      for (let i = 0; i < 9; i++) {
        let a = i * TAU / 9 + r() * .3, d = 60;
        b.beginPath();
        b.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
        for (let k = 0; k < 5; k++) {
          d += 10 + r() * 14;
          a += (r() - .5) * .35;
          b.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
        }
        b.stroke();
      }
      b.restore();
      /* cakram pusat dengan lambang banteng */
      b.fillStyle = '#0d0808';
      b.beginPath();
      b.arc(cx, cy, 58, 0, TAU);
      b.fill();
      arc(cx, cy, 58, 0, TAU, BRZ, 3);
      arc(cx, cy, 52, 0, TAU, BRZD, 1);
      b.save();
      b.shadowColor = '#ff2a44';
      b.shadowBlur = 10;
      bull(cx, cy + 2, 1.7, '#c8283e', '#ff8a9a', '#8a1a2c', '#5a1020');
      b.restore();
      /* 5. PROPERTI: sisa pahlawan yang kalah */
      const bone = (x, y, a) => { b.save(); b.translate(x, y); b.rotate(a); px(-8, -1, 16, 2, BONE); px(-10, -2, 3, 4, BONE); px(7, -2, 3, 4, BONE); px(-8, 0, 16, 1, BONED); b.restore(); };
      const sword = (x, y, a) => { b.save(); b.translate(x, y); b.rotate(a); px(-12, -1, 20, 2, '#9ba8b5'); px(-12, -1, 20, 1, '#e0e5e9'); px(8, -3, 2, 6, BRZ); px(10, -1, 5, 2, '#4a2a1a'); b.restore(); };
      const shield = (x, y) => { b.fillStyle = 'rgba(0,0,0,.35)'; b.beginPath(); b.arc(x + 1, y + 2, 7, 0, TAU); b.fill(); b.fillStyle = '#6b4a2a'; b.beginPath(); b.arc(x, y, 6, 0, TAU); b.fill(); arc(x, y, 6, 0, TAU, BRZD, 1.5); px(x - 2, y - 2, 4, 4, BRZ); b.strokeStyle = 'rgba(0,0,0,.6)'; b.lineWidth = 1; b.beginPath(); b.moveTo(x + 2, y - 5); b.lineTo(x - 1, y + 1); b.lineTo(x + 3, y + 5); b.stroke(); };
      const helm = (x, y) => { b.fillStyle = '#6a6672'; b.beginPath(); b.arc(x, y, 6, PI, 0); b.fill(); px(x - 6, y, 12, 2, '#4d4a58'); px(x - 1, y - 6, 2, 6, '#8a8692'); };
      const hay = (x, y) => {
        for (let i = 0; i < 16; i++) {
          const a = r() * PI;
          b.strokeStyle = i % 2 ? '#a8893f' : '#7a6130';
          b.lineWidth = 1;
          b.beginPath();
          b.moveTo(x + (r() - .5) * 14, y + (r() - .5) * 8);
          b.lineTo(x + (r() - .5) * 14 + Math.cos(a) * 5, y + (r() - .5) * 8 + Math.sin(a) * 3);
          b.stroke();
        }
      };
      [
        [110, 150, .3], [690, 380, -.6], [300, 420, 1.2], [520, 62, .8], [70, 330, -.2], [740, 110, .5], [250, 66, -.4]
      ].forEach(a => bone(...a));
      [[330, 380, .5], [470, 100, -.3], [110, 300, 1.4]].forEach(a => sword(...a));
      [[560, 400], [250, 440], [640, 160]].forEach(a => shield(...a));
      [[660, 250], [140, 420]].forEach(a => helm(...a));
      [[100, 400], [700, 90], [650, 430], [150, 140]].forEach(a => hay(...a));
      blood(b, 300, 160, 12, 6);
      blood(b, 520, 330, 14, 6);
      blood(b, 650, 200, 10, 5);
      blood(b, 400, 60, 9, 4);
      rubble(b, 120, 400);
      rubble(b, 700, 80);
      rubble(b, 440, 440);
      skulls(b, 90, 90);
      skulls(b, 720, 420);
      skulls(b, 60, 410);
      /* 6. DINDING: balok batu pasir dengan list perunggu */
      const BC = ['#4a3a30', '#54423a', '#43332a', '#4f3d33'];
      const wall = (x, y, w, h, bw) => {
        b.save(); b.beginPath(); b.rect(x, y, w, h); b.clip(); b.fillStyle = '#1a1210'; b.fillRect(x, y, w, h); for (let j = 0, ry = y; ry < y + h; ry += 7, j++)
          for (let rx = x - (j % 2 ? bw / 2 : 0); rx < x + w; rx += bw) {
            b.fillStyle = BC[Math.floor(r() * 4)];
            b.fillRect(rx + 1, ry + 1, bw - 1, 6);
            b.fillStyle = 'rgba(255,230,190,.08)';
            b.fillRect(rx + 1, ry + 1, bw - 1, 1);
          } b.restore();
      };
      WB().forEach(w => wall(w[0], w[1], w[2], w[3], 20));
      px(14, 14, DW - 28, 2, BRZD);
      px(14, 14, DW - 28, 1, BRZ);
      px(14, DH - 16, DW - 28, 2, BRZD);
      px(14, DH - 16, DW - 28, 1, BRZ);
      px(14, 14, 2, DH - 28, BRZD);
      px(14, 14, 1, DH - 28, BRZ);
      px(DW - 16, 14, 2, DH - 28, BRZD);
      px(DW - 16, 14, 1, DH - 28, BRZ);
      const sh = (x, y, w, h, ax, ay, bx, by) => { const q = b.createLinearGradient(ax, ay, bx, by); q.addColorStop(0, 'rgba(0,0,0,.5)'); q.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = q; b.fillRect(x, y, w, h); };
      sh(16, 16, DW - 32, 24, 0, 16, 0, 40);
      sh(16, DH - 40, DW - 32, 24, 0, DH - 16, 0, DH - 40);
      sh(16, 16, 24, DH - 32, 16, 0, 40, 0);
      sh(DW - 40, 16, 24, DH - 32, DW - 16, 0, DW - 40, 0);
      /* 7. HIASAN DINDING */
      const bannerB = (x, y) => {
        px(x - 11, y, 22, 3, BRZD);
        px(x - 11, y, 22, 1, BRZ);
        b.fillStyle = '#5a1428';
        b.beginPath();
        b.moveTo(x - 9, y + 3);
        b.lineTo(x + 9, y + 3);
        b.lineTo(x + 9, y + 38);
        b.lineTo(x, y + 32);
        b.lineTo(x - 9, y + 38);
        b.closePath();
        b.fill();
        px(x - 9, y + 3, 3, 33, 'rgba(0,0,0,.25)');
        px(x + 6, y + 3, 3, 33, 'rgba(255,255,255,.05)');
        bull(x, y + 20, .5, '#e0b866', '#fff4d8', '#d9aa3c', '#9a741f');
      };
      const labrys = (x, y, a) => {
        b.save();
        b.translate(x, y);
        b.rotate(a);
        px(-1, -12, 3, 26, '#5a3a22');
        px(-1, -12, 1, 26, '#7a5230');
        [-1, 1].forEach(d => { b.fillStyle = '#9ba8b5'; b.beginPath(); b.moveTo(d, -11); b.quadraticCurveTo(d * 15, -14, d * 13, -1); b.quadraticCurveTo(d * 7, -5, d, -4); b.closePath(); b.fill(); b.strokeStyle = '#e0e5e9'; b.lineWidth = 1; b.beginPath(); b.moveTo(d * 13, -2); b.quadraticCurveTo(d * 15, -13, d * 2, -11); b.stroke(); });
        px(-2, -5, 5, 2, BRZ);
        b.restore();
      };
      [150, 250, 550, 650].forEach(x => bannerB(x, 14));
      skullB(400, 30, 1.1);
      chain(b, 355, 14, 22);
      chain(b, 445, 14, 22);
      skullB(400, DH - 26, 1.1);
      labrys(150, DH - 28, .6);
      labrys(150, DH - 28, -.6);
      labrys(650, DH - 28, .6);
      labrys(650, DH - 28, -.6);
      /* gerbang tersegel di sisi kanan: tidak ada jalan kembali */
      px(754, 188, 32, 104, '#2a1d17');
      px(754, 188, 32, 1, BRZ);
      px(754, 291, 32, 1, BRZD);
      px(758, 194, 12, 92, '#4a2f1a');
      px(771, 194, 12, 92, '#4a2f1a');
      px(770, 194, 1, 92, '#120a08');
      for (let y = 206; y < 286; y += 12) {
        px(758, y, 25, 1, 'rgba(0,0,0,.35)');
      }
      [214, 248, 272].forEach(y => { px(758, y, 25, 3, BRZD); px(758, y, 25, 1, BRZ); });
      arc(770, 240, 5, 0, TAU, BRZ, 2);
      arc(770, 240, 5, 0, TAU, 'rgba(0,0,0,.4)', .6);
      b.strokeStyle = '#7d7a88';
      b.lineWidth = 2;
      b.setLineDash([3, 2]);
      b.beginPath();
      b.moveTo(756, 196);
      b.lineTo(784, 284);
      b.moveTo(784, 196);
      b.lineTo(756, 284);
      b.stroke();
      b.setLineDash([]);
      skullB(770, 176, .8);
      /* 8. PILAR: kolom bulat dengan cincin perunggu */
      W2.slice(4).forEach(([x, y, w, h]) => {
        const mx = x + w / 2, my = y + h / 2;
        b.fillStyle = 'rgba(0,0,0,.45)';
        b.beginPath();
        b.ellipse(mx + 4, my + 8, 17, 12, 0, 0, TAU);
        b.fill();
        px(x - 1, y - 1, w + 2, h + 2, '#1a110e');
        px(x, y, w, h, '#4a3a30');
        px(x, y, w, 2, '#7a634f');
        px(x, y, 2, h, '#6a5444');
        px(x + w - 2, y, 2, h, '#2e221b');
        px(x, y + h - 2, w, 2, '#2e221b');
        const q = b.createRadialGradient(mx - 3, my - 3, 1, mx, my, 12);
        q.addColorStop(0, '#a58a6e');
        q.addColorStop(1, '#5e4a3a');
        b.fillStyle = q;
        b.beginPath();
        b.arc(mx, my, 11, 0, TAU);
        b.fill();
        arc(mx, my, 11, 0, TAU, BRZ, 2);
        arc(mx, my, 6, 0, TAU, BRZD, 1);
        px(mx - 1, my - 1, 2, 2, '#e0b866');
      });
      /* obor & perapian */
      TO2.forEach(([x, y]) => { px(x - 4, y - 3, 8, 10, '#2a1c14'); px(x - 3, y - 2, 6, 2, BRZ); px(x - 2, y + 2, 4, 4, BRZD); });
      BR2.forEach(([x, y]) => { bzBase(b, x, y); px(x - 9, y - 6, 18, 3, BRZD); px(x - 9, y - 6, 18, 1, BRZ); });
      /* 9. CAHAYA & VIGNET */
      const v = b.createRadialGradient(cx, cy, 230, cx, cy, 470);
      v.addColorStop(0, 'rgba(6,2,4,0)');
      v.addColorStop(1, 'rgba(6,2,4,.6)');
      b.fillStyle = v;
      b.fillRect(0, 0, DW, DH);
      b.save();
      b.globalCompositeOperation = 'lighter';
      const pool = (x, y, rd, c) => { const q = b.createRadialGradient(x, y, 0, x, y, rd); q.addColorStop(0, c); q.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = q; b.fillRect(x - rd, y - rd, rd * 2, rd * 2); };
      BR2.forEach(([x, y]) => pool(x, y, 120, 'rgba(255,140,50,.2)'));
      TO2.forEach(([x, y]) => pool(x, y, 60, 'rgba(255,140,50,.08)'));
      pool(cx, cy, 200, 'rgba(210,30,55,.15)');
      b.restore();
    })();
    /* efek hidup ruang bos: lingkar rune berdenyut, bara dari perapian, denyut inti sesuai fase */
    function bossEnvFx() {
      const ph = BOSS.ph || 1, cx = DW / 2, cy = DY, pu = .5 + .5 * Math.sin(t * (1.6 + ph * .9));
      g.save();
      g.globalCompositeOperation = 'lighter';
      const q = g.createRadialGradient(cx, cy, 20, cx, cy, 200);
      q.addColorStop(0, (lavaOn() ? 'rgba(255,110,20,' : 'rgba(170,70,255,') + (.03 + .05 * ph * pu) + ')');
      q.addColorStop(.6, (lavaOn() ? 'rgba(255,110,20,' : 'rgba(170,70,255,') + (.02 + .02 * ph * pu) + ')');
      q.addColorStop(1, 'rgba(170,70,255,0)');
      g.fillStyle = q;
      g.fillRect(cx - 200, cy - 200, 400, 400);
      g.strokeStyle = (lavaOn() ? 'rgba(255,160,60,' : 'rgba(200,130,255,') + (.22 + .14 * ph * pu) + ')';
      g.lineWidth = 2;
      g.setLineDash([3, 9]);
      g.lineDashOffset = -t * 10;
      g.beginPath();
      g.arc(cx, cy, 184, 0, 7);
      g.stroke();
      g.setLineDash([]);
      const n = ph >= 3 ? 28 : 16;
      for (let i = 0; i < n; i++) {
        const b = BR2[i % 4], life = (t * .35 + i * .137) % 1, x = b[0] + Math.sin(i * 1.7 + t * .8 + life * 5) * 14 * (1 + life), y = b[1] - 4 - life * 90;
        g.fillStyle = 'rgba(255,' + ((120 + 80 * (1 - life)) | 0) + ',60,' + ((1 - life) * .8).toFixed(2) + ')';
        g.fillRect(Math.round(x), Math.round(y), 2, 2);
      }
      g.restore();
    }
    const _envFxBoss = envFx;
    envFx = function () {
      _envFxBoss(); if (room == 2 && !lobby)
        bossEnvFx();
    };

    function toBoss() {
      room = 2;
      WW = DW;
      WH = DH;
      walls = W2;
      TO = TO2;
      BR = BR2;
      BG = BGB;
      doorOn = 0;
      doorO = 0;
      clr = 0;
      pr = [];
      dr = [];
      gh = [];
      p.x = 44;
      p.y = DY;
      p.vx = p.vy = 0;
      p.dod = 0;
      fade = .7;
      p.pot = 5;
      const e = mk('boss', DW / 2, DY);
      e.hp = e.mhp = BOSS_HP;
      e.sd = 0;
      e.st = e.sw = 1.4;
      e.sx = 0;
      es = [e];
      Object.assign(BOSS, { on: 1, hz: [], q: [], ph: 1, intro: .9, dead: 0, vt: 0, ban: 3.2 });
      SFX.door();
      SFX.summon();
      SFX.bossVo(bossVid(), 'intro');
      msg('Ruangan Bos — ' + bossNm() + ' menunggumu. Tidak ada jalan kembali!');
    }

    function bossFan(e) {
      const n = (BOSS.ph == 1 ? 5 : BOSS.ph == 2 ? 7 : 9) + dfx().shots * 2, sp = (135 + BOSS.ph * 16) * dfx().pv;
      let ox = e.x - 26, oy = e.y - 18;
      if (blk(ox, oy, 1)) {
        ox = e.x;
        oy = e.y;
      }
      const b = Math.atan2(p.y - oy, p.x - ox);
      SFX.dodge();
      SFX.boom(16);
      e.rc = 1;
      shake = Math.max(shake, 3);
      fx.push({ k: 'ring', x: ox, y: oy, r: 14, w: 3, life: .25, max: .25, col: '#ffd0a0' }, { k: 'gl', x: ox, y: oy, r: 40, c: '255,140,90', life: .25, max: .25 });
      puff(ox, oy, 3, '120,108,120', 1);
      for (let i = 0; i < 10; i++) {
        const a = b + (R() - .5) * 1.4, v = 40 + R() * 90;
        dp.push({
          k: 'p', x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .3 + R() * .3, max: .6, s: 1.5 + R() * 2, c: i % 2 ? '#98949f' : '#6d6a78'
        });
      }
      for (let i = 0; i < n; i++) {
        const q = b + (i - (n - 1) / 2) * .2;
        pr.push({
          x: ox, y: oy, vx: Math.cos(q) * sp, vy: Math.sin(q) * sp, d: 13, r: 4, col: '#8c8896', own: 'e', life: 3, rock: 1, rot: R() * 6.283, vr: (R() - .5) * 16, sd: R() * 50
        });
      }
    }

    function bossPhase(e, ph) {
      msg(ph == 2 ? 'Fase 2 — ' + bossNm() + ' memanggil pasukannya!' : 'Fase 3 — AMUK!');
      SFX.wave();
      SFX.bossVo('mino', 'phase', ph);
      FLSH = 1;
      FLSC = '255,60,80';
      shake = Math.max(shake, 10);
      HST = Math.max(HST, .12);
      fx.push({ k: 'ring', x: e.x, y: e.y, r: 60, w: 5, life: .6, max: .6, col: '#ff5a78' }, { k: 'gl', x: e.x, y: e.y, r: 120, c: '255,60,90', life: .5, max: .5 });
      BOSS.hz = [];
      BOSS.q = [];
      e.s2 = 'rest';
      e.tm = .9;
      e.an = 0;
      const n = ph == 2 ? 3 : 4;
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.283 + R(), s = freeSpot(e.x + Math.cos(a) * 55, e.y + Math.sin(a) * 55), m = mk('slime', s.x, s.y);
        m.hp = m.mhp = 42;
        m.sd = 0;
        m.st = m.sw = 1.1;
        m.sx = 0;
        es.push(m);
      }
    }

    function bossTick(e, dt) {
      const B = BOSS;
      e.fl -= dt;
      e.vx = e.vy = 0;
      e.stg = 0;
      e.stun = 0;
      if (p.dead > 0 || B.dead) {
        e.an = 0;
        return;
      }
      const rt = e.hp / e.mhp, ph = rt > .6 ? 1 : rt > .3 ? 2 : 3;
      if (ph > B.ph) {
        B.ph = ph;
        bossPhase(e, ph);
        return;
      }
      if (B.intro > 0) {
        B.intro -= dt;
        return;
      }
      if (!e.s2)
        e.s2 = 'move';
      const d = dist(e, p), a = ang(e, p), spd = e.sp * (1 + (ph - 1) * .25);
      e.cd -= dt;
      if (e.s2 == 'move') {
        e.an = 0;
        if (d > 34)
          mv(e, Math.cos(a) * spd * dt, Math.sin(a) * spd * dt);
        if (e.cd <= 0) {
          const o = d < 80 ? ['slam', 'slam', 'fan'] : ['charge', 'fan', 'charge'];
          if (ph >= 2)
            o.push('rain');
          const k = o[Math.floor(R() * o.length)], dur = k == 'slam' ? .9 - (ph - 1) * .1 : k == 'charge' ? .8 - (ph - 1) * .1 : k == 'fan' ? .6 : .8;
          e.s2 = 'wind';
          e.atk = k;
          e.tmx = e.tm = dur;
          e.ca = a;
          e.hit = 0;
          SFX.warn(k == 'fan' ? 1 : 0);
          SFX.bossVo('mino', k);
          if (k == 'slam')
            B.hz.push({ x: e.x, y: e.y, r: 58, t: dur, mx: dur, d: 24, big: 1 });
        }
      } else if (e.s2 == 'wind') {
        e.tm -= dt;
        e.an = Math.max(.01, .6 * (e.tm / e.tmx));
        if (e.atk == 'charge' && e.tm > e.tmx * .35)
          e.ca = a;
        if (e.tm <= 0) {
          e.an = 0;
          if (e.atk == 'slam') {
            e.s2 = 'rest';
            e.tm = .7;
          } else if (e.atk == 'charge') {
            e.s2 = 'act';
            e.tm = .5;
            SFX.dodge();
            SFX.bossVo('mino', 'dash');
          } else if (e.atk == 'fan') {
            bossFan(e);
            if (ph == 3)
              B.q.push({
                t: .4, f: () => {
                  if (es.includes(e) && p.dead <= 0)
                    bossFan(e);
                }
              });
            e.s2 = 'rest';
            e.tm = .6;
          } else {
            const n = (ph == 2 ? 6 : 9) + dfx().shots * 2, cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
            for (let i = 0; i < n; i++) {
              const t0 = .8 + i * .16, x = i ? cl(p.x + (R() - .5) * 170, 40, DW - 40) : p.x, y = i ? cl(p.y + (R() - .5) * 130, 40, DH - 40) : p.y;
              B.hz.push({ x, y, r: 30, t: t0, mx: t0, d: 16 });
            }
            SFX.summon();
            e.s2 = 'rest';
            e.tm = 1.2;
          }
        }
      } else if (e.s2 == 'act') {
        e.tm -= dt;
        const ox = e.x, oy = e.y;
        mv(e, Math.cos(e.ca) * 380 * dt, Math.sin(e.ca) * 380 * dt);
        if (R() < .7)
          puff(e.x, e.y + 6, 1, '120,30,50', .8);
        if (!e.hit && dist(e, p) < e.r + p.r + 5) {
          e.hit = 1;
          hurt(22);
        }
        if (Math.hypot(e.x - ox, e.y - oy) < .3) {
          e.tm = 0;
          shake = Math.max(shake, 6);
          SFX.slam();
          fx.push({ k: 'ring', x: e.x, y: e.y, r: 30, w: 3, life: .3, max: .3, col: '#b46cff' });
        }
        if (e.tm <= 0) {
          e.s2 = 'rest';
          e.tm = .8;
        }
      } else {
        e.an = 0;
        e.tm -= dt;
        if (e.tm <= 0) {
          e.s2 = 'move';
          e.cd = Math.max(.5, 1.5 - ph * .25);
        }
      }
    }

    function bossFx(dt) {
      const B = BOSS;
      B.q = B.q.filter(o => {
        o.t -= dt; if (o.t <= 0) {
          o.f();
          return false;
        } return true;
      });
      B.hz = B.hz.filter(h => {
        h.t -= dt;
        if (h.t > 0)
          return true;
        if (h.big)
          SFX.slam();
        else
          SFX.boom(h.r);
        bossImpact(h);
        fx.push({ k: 'ring', x: h.x, y: h.y, r: h.r, w: 3, life: .3, max: .3, col: '#b46cff' });
        shake = Math.max(shake, h.big ? 7 : 3);
        if (p.dead <= 0 && Math.hypot(p.x - h.x, p.y - h.y) < h.r + p.r)
          hurt(h.d);
        return false;
      });
    }
    // bos tidak langsung hilang: animasi kematiannya ada di blok CHECKPOINT (bossDie)
    const _kB = kill;
    kill = function (e) {
      if (e.k == 'boss' && e.dying)
        return; _kB(e); if (e.k == 'boss')
        bossDie(e);
    };
    const _updB = upd;
    upd = function (dt) {
      const B = BOSS;
      if (B.on && (lobby || room != 2)) {
        B.on = 0;
        B.hz = [];
        B.q = [];
        B.vt = 0;
        B.dead = 0;
      }
      if (B.on && P.KeyB) {
        delete P.KeyB;
        msg(B.dead ? 'Kau akan segera ditarik kembali ke lobby...' : 'Tidak ada jalan kabur dari ' + bossNm() + '!');
      }
      _updB(dt);
      if (B.on && !lobby && room == 2) {
        if (p.dead > 0) {
          B.hz = [];
          B.q = [];
        } else if (!(HST > 0))
          bossFx(dt);
        if (B.ban > 0)
          B.ban -= dt;
        if (B.vt > 0) {
          B.vt -= dt;
          if (B.vt <= 0) {
            B.vt = 0;
            goLobby();
          }
        }
      }
    };

    function bossGround(e) {
      if (e.sw > 0)
        return;
      const B = BOSS;
      if (B.ph >= 3) {
        g.save();
        g.globalCompositeOperation = 'lighter';
        const q = g.createRadialGradient(e.x, e.y, 0, e.x, e.y, 60);
        q.addColorStop(0, (lavaOn() ? 'rgba(255,100,20,' : 'rgba(170,70,255,') + (.25 + .1 * Math.sin(t * 8)) + ')');
        q.addColorStop(1, lavaOn() ? 'rgba(255,100,20,0)' : 'rgba(170,70,255,0)');
        g.fillStyle = q;
        g.fillRect(e.x - 60, e.y - 60, 120, 120);
        g.restore();
      }
      if (e.s2 == 'wind' && e.atk == 'charge') {
        const k = 1 - e.tm / e.tmx;
        g.save();
        g.translate(e.x, e.y);
        g.rotate(e.ca);
        g.fillStyle = 'rgba(255,60,60,' + (.12 + .28 * k) + ')';
        g.fillRect(0, -14, 190, 28);
        g.strokeStyle = 'rgba(255,120,120,.7)';
        g.strokeRect(.5, -13.5, 190, 27);
        g.restore();
      }
      B.hz.forEach(h => { const k = 1 - h.t / h.mx; g.fillStyle = 'rgba(255,50,60,' + (.1 + .18 * k) + ')'; g.beginPath(); g.arc(h.x, h.y, h.r, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,90,90,' + (.5 + .4 * k) + ')'; g.lineWidth = 1.5; g.beginPath(); g.arc(h.x, h.y, h.r, 0, 7); g.stroke(); g.lineWidth = 1; g.fillStyle = 'rgba(255,70,70,.35)'; g.beginPath(); g.arc(h.x, h.y, h.r * k, 0, 7); g.fill(); });
    }
    const _deB = drawEnemy;
    drawEnemy = function (e) {
      if (e.k == 'boss') {
        bossGround(e);
        BOSS_E = e;
      } _deB(e);
    };

    function bossHud() {
      const B = BOSS, e = es.find(x => x.k == 'boss');
      g.fillStyle = 'rgba(12,11,20,.92)';
      g.fillRect(W - 172, 6, 168, 44);
      g.font = 'bold 9px monospace';
      txt('BOSS CHAMBER', W - 10, 18, '#ff8aa0', 'right');
      txt(bossNm(), W - 10, 44, '#778', 'right');
      if (e && e.sw <= 0 && !e.dying) {
        const bw = Math.min(W * .5, 360), x = W / 2 - bw / 2, y = 76;
        g.fillStyle = '#000b';
        g.fillRect(x - 2, y - 2, bw + 4, 10);
        g.fillStyle = B.ph >= 3 ? '#ff3b4d' : '#c8283e';
        g.fillRect(x, y, bw * Math.max(0, e.hp) / e.mhp, 6);
        g.fillStyle = '#fff6';
        [.6, .3].forEach(k => g.fillRect(x + bw * k, y - 2, 1, 10));
        g.font = 'bold 9px monospace';
        txt(lavaOn() ? bossNm().toUpperCase() + ' · ' + LFORMS[Math.min(2, Math.max(0, B.ph - 1))] : 'MORVATH, SANG MINOTAUR', W / 2, y - 5, lavaOn() ? '#ffb070' : '#ffd0da', 'center');
      }
      if (B.ban > 0) {
        const al = Math.max(0, Math.min(1, B.ban / .5, (3.2 - B.ban) / .4));
        g.save();
        g.globalAlpha = al;
        g.fillStyle = 'rgba(0,0,0,.65)';
        g.fillRect(0, 100, W, 44);
        g.fillStyle = 'rgba(255,60,90,.9)';
        g.fillRect(0, 100, W, 1);
        g.fillRect(0, 143, W, 1);
        g.font = '8px monospace';
        txt('— B O S S —', W / 2, 113, '#fff', 'center');
        g.font = 'bold 18px monospace';
        txt(bossNm().toUpperCase(), W / 2, 136, '#ff6a8a', 'center');
        g.restore();
      }
    }
    const _drawB = draw;
    draw = function () {
      _drawB(); if (BOSS.on && room == 2 && !lobby && p.dead <= 0) {
        g.font = '9px monospace';
        bossHud();
      }
    };

    /* ===== BOS: animasi halus + efek serangan + batu ===== */
    function bossRockHand(x, y, u) {
      const k = 1 - (1 - u) * (1 - u), z = 8 + 18 * k, j = u > .7 ? (Math.random() - .5) * 2 : 0, cx = x + j, cy = y - z * .7 - 10 + j;
      mq(cx - z / 2, cy - z / 2, z, z * .9, '#3e3a46');
      mq(cx - z / 2 + 2, cy - z / 2 + 2, z - 4, z * .9 - 4, '#6d6a78');
      mq(cx - z / 2 + 3, cy - z / 2 + 3, z * .4, z * .3, '#a09cae');
      mq(cx - z * .1, cy - z * .2, 2, z * .6, '#ff5a4a');
      mq(cx - z * .3, cy + z * .1, z * .5, 2, '#ff5a4a');
    }

    function drawRock(b) {
      const r = b.r + 1.5, sd = b.sd || (b.sd = R() * 50), P = [];
      g.save();
      g.translate(b.x, b.y);
      g.fillStyle = 'rgba(0,0,0,.22)';
      g.beginPath();
      g.ellipse(0, r + 2, r * .9, r * .4, 0, 0, 7);
      g.fill();
      g.rotate(t * (b.vr || 4) + (b.rot || 0));
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * 6.283, m = .78 + .3 * Math.sin(i * 2.9 + sd);
        P.push([Math.cos(a) * r * m, Math.sin(a) * r * m]);
      }
      const path = k => { g.beginPath(); P.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x * k, y * k)); g.closePath(); };
      g.fillStyle = '#3a3642';
      path(1.12);
      g.fill();
      g.fillStyle = '#6d6a78';
      path(1);
      g.fill();
      g.save();
      g.translate(-r * .18, -r * .2);
      g.fillStyle = '#98949f';
      path(.55);
      g.fill();
      g.restore();
      g.strokeStyle = '#ff6a4a';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(-r * .4, -r * .1);
      g.lineTo(0, r * .1);
      g.lineTo(r * .3, -r * .2);
      g.stroke();
      g.lineWidth = 1;
      g.restore();
    }

    function rockTrail(b) {
      if (R() < .5)
        dp.push({
          k: 's', x: b.x, y: b.y, vx: (R() - .5) * 8, vy: (R() - .5) * 8, life: .3, max: .6, s: 2 + R() * 2, c: '120,110,125'
        });
    }

    function rockBreak(b) {
      puff(b.x, b.y, 2, '110,100,115', .7);
      for (let i = 0; i < 7; i++) {
        const a = R() * 6.283, v = 40 + R() * 80;
        dp.push({
          k: 'p', x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, life: .35 + R() * .3, max: .65, s: 1.5 + R() * 2, c: ['#6d6a78', '#98949f', '#3a3642'][i % 3]
        });
      }
      fx.push({ k: 'ring', x: b.x, y: b.y, r: 9, w: 2, life: .18, max: .18, col: '#cfc8d8' });
      if (Math.hypot(p.x - b.x, p.y - b.y) < 14)
        shake = Math.max(shake, 5);
      if (R() < .3)
        SFX.boom(8);
    }

    function bossImpact(h) {
      const big = h.big, x = h.x, y = h.y, r = h.r;
      puff(x, y, big ? 7 : 4, '96,84,92', big ? 1.8 : 1.2);
      fx.push({ k: 'ring', x, y, r: r * 1.5, w: big ? 5 : 3, life: .5, max: .5, col: '#ffd0a0' });
      if (big) {
        SFX.bossVo('mino', 'impact');
        fx.push({ k: 'ring', x, y, r: r * 2.2, w: 3, life: .7, max: .7, col: '#ff7a5a' }, { k: 'gl', x, y, r: r * 2.4, c: '255,110,70', life: .4, max: .4 });
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * 6.283 + R() * .3;
          dp.push({
            k: 'l', x: x + Math.cos(a) * 10, y: y + Math.sin(a) * 6, a: a + Math.PI, len: 34 + R() * 40, w: 3, cc: '#ff5a3a', life: .55, max: .55
          });
        }
        shake = Math.max(shake, 10);
        HST = Math.max(HST, .06);
      }
      for (let i = 0; i < (big ? 26 : 12); i++) {
        const a = R() * 6.283, v = 40 + R() * (big ? 150 : 90);
        dp.push({
          k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .7 - 25, life: .45 + R() * .5, max: .95, s: 2 + R() * 3, c: ['#6d6a78', '#98949f', '#4a4650'][i % 3]
        });
      }
    }
    {
      const _em = EM.boss, ez = q => 1 - (1 - q) * (1 - q);
      EM.boss = (pp, at, tm) => {
        const e = BOSS_E || {}, d = Math.cos(e.ca || 0) < 0 ? -1 : 1, wk = e.wk || 0;
        let rot = Math.sin(tm * 1.3) * .012 + Math.sin(tm * 9) * .03 * wk, sy = 1 + Math.sin(tm * 2.2) * .012 - Math.abs(Math.sin(tm * 9)) * .012 * wk, sx = 1, ox = 0;
        if (e.s2 == 'wind' && at) {
          if (e.atk == 'slam') {
            if (pp < .72) {
              const k = ez(pp / .72);
              sy *= 1 + .035 * k;
              sx *= 1 - .02 * k;
              rot -= .05 * k;
            } else {
              const q = (pp - .72) / .28, w = q * q;
              sy *= 1.035 - .1 * w;
              sx *= .98 + .07 * w;
              rot += .05 * w;
            }
          } else if (e.atk == 'rain')
            sy *= 1 + .04 * ez(pp);
          else if (e.atk == 'fan')
            rot += .05 * ez(pp);
          else if (e.atk == 'charge') {
            const k = ez(pp);
            sy *= 1 - .05 * k;
            sx *= 1 + .04 * k;
            rot += d * .1 * k;
          }
        } else if (e.s2 == 'act') {
          rot += d * .16;
          sx *= 1.05;
          sy *= .96;
        } else if (e.s2 == 'rest' && e.atk == 'slam') {
          const q = Math.max(0, 1 - (.7 - e.tm) / .35);
          sy *= 1 - .065 * q * q;
          sx *= 1 + .05 * q * q;
        }
        if (e.rc > 0) {
          rot -= .06 * e.rc;
          sy *= 1 - .04 * e.rc;
        }
        if (e.fl > 0) {
          ox += (Math.random() - .5) * 10;
          sy *= .97;
          sx *= 1.03;
        }
        e.zr = (e.zr || 0) + (rot - (e.zr || 0)) * .3;
        e.zx = (e.zx || 1) + (sx - (e.zx || 1)) * .3;
        e.zy = (e.zy || 1) + (sy - (e.zy || 1)) * .3;
        g.save();
        g.translate(320 + ox, 331);
        g.rotate(e.zr);
        g.scale(e.zx, e.zy);
        g.translate(-320, -331);
        _em(pp, at, tm);
        g.restore();
      };
    }

    function bossAnim(e, dt, ps) {
      if (!BOSS.on || BOSS.dead)
        return;
      e.rc = Math.max(0, (e.rc || 0) - dt * 2.6);
      const s = e.s2, K = e.atk, wx = e.x - 32, wy = e.y - 30;
      if (s == 'wind') {
        const f = 1 - e.tm / e.tmx;
        if (K == 'fan' && R() < .7) {
          const a = R() * 6.283, d = 14 + R() * 10 * (1 - f);
          dp.push({
            k: 'p', x: wx + Math.cos(a) * d, y: wy - 10 * f + Math.sin(a) * d * .6, vx: -Math.cos(a) * 30, vy: -Math.sin(a) * 20, life: .3, max: .3, s: 1.5 + R() * 1.5, c: R() < .5 ? '#8c8896' : '#ff6a5a'
          });
        }
        if (K == 'slam' && R() < .8) {
          const a = R() * 6.283, d = 40 + R() * 20;
          dp.push({
            k: 'p', x: e.x + Math.cos(a) * d, y: e.y + 4 + Math.sin(a) * d * .5, vx: -Math.cos(a) * d * 2.5, vy: -Math.sin(a) * d * 1.2, life: .35, max: .35, s: 2, c: '#ff7a5a'
          });
        }
        if (K == 'charge' && R() < .5)
          puff(e.x - Math.cos(e.ca) * 10, e.y + 8, 1, '110,95,100', .8);
        if (K == 'rain' && R() < .6)
          dp.push({ k: 'p', x: e.x + (R() - .5) * 40, y: e.y + 6, vx: 0, vy: -50, life: .5, max: .5, s: 2, c: '#ffb07a' });
      }
      if (ps == 'wind' && s != 'wind') {
        if (K == 'charge' && s == 'act') {
          puff(e.x, e.y + 6, 6, '110,95,100', 1.4);
          fx.push({ k: 'ring', x: e.x, y: e.y + 6, r: 24, w: 3, life: .3, max: .3, col: '#ffd0a0' });
          shake = Math.max(shake, 3);
          e.rc = .6;
        } else if (K == 'slam')
          e.rc = .5;
      }
      if (s == 'act') {
        dp.push({
          k: 'l', x: e.x - Math.cos(e.ca) * 10 + (R() - .5) * 14, y: e.y + (R() - .5) * 22, a: e.ca, len: 30 + R() * 40, life: .2, max: .2
        });
        if (e.hit && !e._h) {
          e._h = 1;
          fx.push({ k: 'ring', x: p.x, y: p.y, r: 18, w: 4, life: .3, max: .3, col: '#fff' }, { k: 'gl', x: p.x, y: p.y, r: 50, c: '255,90,70', life: .3, max: .3 });
          shake = Math.max(shake, 8);
          HST = Math.max(HST, .06);
        }
      } else
        e._h = 0;
      const wk = e.wk || 0;
      e.pw = (e.pw || 0) + dt * 9 * (wk > .4 ? 1 : 0);
      const st = Math.floor(e.pw / Math.PI);
      if (st !== e.pl) {
        e.pl = st;
        if (wk > .4) {
          puff(e.x + (st % 2 ? 10 : -10), e.y + 13, 2, '96,84,92', .7);
          shake = Math.max(shake, 1.2);
        }
      }
      if (BOSS.ph >= 3 && R() < .5)
        dp.push({
          k: 'p', x: e.x + (R() - .5) * 34, y: e.y - R() * 30, vx: (R() - .5) * 14, vy: -30 - R() * 30, life: .6 + R() * .5, max: 1, s: 1.5 + R() * 1.5, c: R() < .5 ? '#ff7a3a' : '#ffd070'
        });
    }
    {
      const _btk = bossTick;
      bossTick = function (e, dt) { const ps = e.s2; _btk(e, dt); bossAnim(e, dt, ps); };
    }
    { // batu jatuh untuk serangan "rain"
      const _bg = bossGround;
      bossGround = function (e) {
        _bg(e);
        if (e.sw > 0)
          return;
        BOSS.hz.forEach(h => {
          if (h.big)
            return;
          const k = 1 - h.t / h.mx;
          if (k < .3)
            return;
          const f = (k - .3) / .7, ry = h.y - 210 * (1 - f) * (1 - f);
          g.fillStyle = 'rgba(0,0,0,' + (.1 + .2 * f) + ')';
          g.beginPath();
          g.ellipse(h.x, h.y + 2, h.r * .5 * f, h.r * .2 * f, 0, 0, 7);
          g.fill();
          drawRock({ x: h.x, y: ry, r: h.r * .25, rot: h.x, vr: 6, sd: h.x });
        });
      };
    }

    /* ===== Animasi gerak musuh biasa (slime / skel / mage) — bos tidak ikut ===== */
    function enemyAnim(e, mvd, atk, pg) {
      const dt = Math.min(.05, Math.max(.001, t - (e.pt || t - .016))), U = 1 / .215, cl = (v, a, b) => Math.max(a, Math.min(b, v));
      e.pt = t;
      if (e.rx == null) {
        Object.assign(e, { rx: e.x, ry: e.y, zr: 0, zx: 1, zy: 1, hh: 0, gp: R() * 6, spd: 0, mz: 0, vxs: 0, px: e.x });
      }
      if (Math.hypot(e.x - e.rx, e.y - e.ry) > 40) {
        e.rx = e.x;
        e.ry = e.y;
      } else {
        const k = 1 - Math.pow(1e-6, dt);
        e.rx += (e.x - e.rx) * k;
        e.ry += (e.y - e.ry) * k;
      }
      e.spd += (mvd / dt - e.spd) * Math.min(1, dt * 10);
      e.vxs += ((e.x - e.px) / dt - e.vxs) * Math.min(1, dt * 8);
      e.px = e.x;
      e.mz += ((atk || e.stun > 0 ? 0 : cl(e.spd / 45, 0, 1)) - e.mz) * Math.min(1, dt * 8);
      if (e.pa && !atk && (e.ppg || 0) > .85)
        e.kick = 1;
      e.pa = atk;
      e.ppg = pg;
      e.kick = Math.max(0, (e.kick || 0) - dt * 3.5);
      const m = e.mz, ph = e.ph || 0, old = Math.floor(e.gp / Math.PI);
      e.gp += dt * 9 * (.4 + m) * (m > .04 ? 1 : 0);
      const lnd = m > .3 && Math.floor(e.gp / Math.PI) !== old, lean = cl(e.vxs / 80, -1, 1);
      let h = 0, sx = 1, sy = 1, rot = 0;
      if (e.k == 'slime') {
        const idle = Math.sin(t * 3 + ph);
        const bb = Math.abs(Math.sin(e.gp));
        h = bb * 1.3 * U * m;
        sy = 1 - .025 * (1 - bb) * m + .02 * idle * (1 - m);
        sx = 1 / Math.pow(sy, .6);
        rot = Math.sin(e.gp) * .03 * m + lean * .05 * m;
        if (lnd)
          puff(e.x, e.y + 6, 1, '90,80,100', .5);
      } else if (e.k == 'skel') {
        h = (1.4 + .8 * m) * U * (.5 + .5 * Math.sin(t * 3 + ph));
        rot = Math.sin(t * 2 + ph) * .025 + lean * .12 * m;
        sy = 1 + .02 * Math.sin(t * 3 + ph + 1);
        sx = 1 - (sy - 1) * .6;
      } else {
        const b = Math.abs(Math.sin(e.gp));
        h = b * 1.2 * U * m;
        rot = Math.sin(e.gp) * .035 * m + lean * .06 * m + Math.sin(t * 2 + ph) * .01;
        sy = 1 - .03 * (1 - b) * m + .015 * Math.sin(t * 2.4 + ph) * (1 - m);
        sx = 1 / Math.pow(sy, .6);
        if (lnd)
          puff(e.x, e.y + 6, 1, '90,80,100', .4);
      }
      if (atk) {
        const q = Math.sin(cl(pg, 0, 1) * Math.PI);
        sy *= 1 - .06 * q;
        sx *= 1 + .05 * q;
      }
      if (e.fl > 0) {
        sx *= 1.08;
        sy *= .92;
        rot += (R() - .5) * .08;
      }
      const f = Math.min(1, dt * 14);
      e.zr += (rot - e.zr) * f;
      e.zx += (sx - e.zx) * f;
      e.zy += (sy - e.zy) * f;
      e.hh += (h - e.hh) * Math.min(1, dt * 18);
    }

    /* ===== Rig sendi musuh: IK 2 ruas + keyframe ===== */
    function mSeg(x0, y0, x1, y1, w, c) { const l = Math.hypot(x1 - x0, y1 - y0); g.save(); g.translate(x0, y0); g.rotate(Math.atan2(y1 - y0, x1 - x0) - Math.PI / 2); mr(-w / 2, -w / 2, w, l + w, c); g.restore(); }

    function mIK(sx, sy, tx, ty, l1, l2, side) {
      let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy) || 1;
      const mx = l1 + l2 - .5;
      if (d > mx) {
        dx *= mx / d;
        dy *= mx / d;
        d = mx;
        tx = sx + dx;
        ty = sy + dy;
      }
      const be = Math.atan2(dx, dy), ga = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))), c = q => [sx + Math.sin(be + q * ga) * l1, sy + Math.cos(be + q * ga) * l1], a = c(1), b = c(-1), r = (a[0] - 320) * side >= (b[0] - 320) * side ? a : b;
      return [r[0], r[1], tx, ty];
    }

    function mLimb2(sx, sy, tx, ty, l1, l2, side, w, c1, c2, ci, ch) {
      const [ex, ey, hx, hy] = mIK(sx, sy, tx, ty, l1, l2, side);
      mSeg(sx, sy, ex, ey, w, c1);
      mSeg(ex, ey, hx, hy, w * .9, c2);
      if (ci) {
        mSeg(sx, sy, ex, ey, w * .4, ci);
        mSeg(ex, ey, hx, hy, w * .36, ci);
      }
      mr(ex - w * .45, ey - w * .45, w * .9, w * .9, c1);
      if (ch)
        mr(hx - 6, hy - 5, 12, 10, ch);
      return [hx, hy];
    }

    function mLeg(hx, side, w, c1, ci) {
      const e = ENM || {}, m = e.mz || 0, ph = (e.gp || 0) + (side > 0 ? Math.PI : 0), lf = Math.max(0, Math.sin(ph)) * m;
      const r = mLimb2(hx, 286, hx + side * (lf * 3 + .8 * Math.sin(ph) * m), 323 - lf * 10, 19, 18, side, w, c1, c1, ci);
      mr(r[0] - 12, r[1] - 4, 24, 12, '#171720');
    }

    function mKF(pp, F) {
      for (let i = 1; i < F.length; i++)
        if (pp <= F[i][0]) {
          const a = F[i - 1], b = F[i], u = (pp - a[0]) / ((b[0] - a[0]) || 1), w = u * u * (3 - 2 * u);
          return a[1].map((v, j) => v + (b[1][j] - v) * w);
        } return F[F.length - 1][1];
    }

    function mAct(at, pp, F) {
      const k = (ENM && ENM.kick) || 0;
      if (at)
        return mKF(pp, F);
      if (k > 0) {
        const a = F[F.length - 1][1], b = F[0][1], w = k * k * (3 - 2 * k);
        return a.map((v, j) => b[j] + (v - b[j]) * w);
      }
      return F[0][1];
    }

    function mSword(hx, hy, ab, al) {
      g.save();
      g.globalAlpha = al;
      g.translate(hx, hy - 4);
      g.rotate(-ab);
      mr(-2, -2, 6, 12, '#5b3b2b');
      mr(-7, 8, 16, 4, '#a6aab0');
      mr(-1, 12, 5, 36, '#9ba8b5');
      mr(0, 13, 2, 29, '#e0e5e9');
      mr(-1, 47, 5, 5, '#cbd3dc');
      mr(-1, 20, 5, 3, '#77565a');
      g.restore();
    }
    /* ===== Musuh Lava (Level 2): Lava Slime (dekat), Lava Golem (area), Blash (jarak jauh) ===== */
    /* Room 0 = varian "Ember" (oranye terang), Room 1 = varian "Magma" (obsidian merah, lebih kuat) */
    const EC_O = JSON.parse(JSON.stringify(EC)), SPC_O = JSON.parse(JSON.stringify(SPC)), SPH_O = Object.assign({}, SPH);
    const EC_L = {
      slime: ['#ff9a2a', '#ffd34d', '#c8300f'], skel: ['#5a3a30', '#ff7a1f', '#ffd34d'], mage: ['#ff6a1f', '#ffd34d', '#ff3a1a']
    };
    const SPC_L = { slime: ['255,170,60', '220,70,10'], skel: ['255,160,70', '120,40,10'], mage: ['255,210,90', '230,60,20'] }, SPH_L = { slime: '#ff9a2a', skel: '#ff7a1f', mage: '#ffd34d' };
    let ecLava = false, LZ = [], lzRoom = -1;

    function lavaGlow(x, y, r, a, c) { g.save(); g.globalCompositeOperation = 'lighter'; const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(' + (c || '255,140,40') + ',' + a + ')'); q.addColorStop(1, 'rgba(' + (c || '255,140,40') + ',0)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }

    function lavaFlame(x, y, w, h, c1, c2, ph) { const f = Math.sin(t * 14 + ph) * .15 + 1; g.fillStyle = c1; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w * .6, y - h * .6 * f, x + Math.sin(t * 9 + ph) * w * .4, y - h * f); g.quadraticCurveTo(x + w * .6, y - h * .5, x + w, y); g.closePath(); g.fill(); g.fillStyle = c2; g.beginPath(); g.moveTo(x - w * .5, y); g.quadraticCurveTo(x, y - h * .65 * f, x + w * .5, y); g.closePath(); g.fill(); }

    function lavaDraw(e) {
      const v = room, fl = e.fl > 0, F = c => fl ? '#fff' : c, tt = t + e.ph, dx = p.x - e.x, dy = p.y - e.y, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
      g.save();
      g.translate((e.rx == null ? e.x : e.rx) + (e.stun > 0 ? Math.sin(t * 40) * 1.2 : 0), (e.ry == null ? e.y : e.ry) + 7);
      if (e.rx != null) {
        g.rotate(e.zr || 0);
        g.scale(e.zx || 1, e.zy || 1);
        if (e.k == 'slime')
          g.translate(0, -(e.hh || 0) * .215);
      }
      if (e.k == 'slime') { /* LAVA SLIME: gumpalan lava, menerkam dari dekat */
        const pg = e.an > 0 ? Math.min(1, 1 - e.an / .6) : 0, lg = Math.sin(pg * Math.PI) * 6, sq = 1 + Math.sin(tt * 6) * .07 - .16 * Math.sin(pg * Math.PI), w = (v ? 12 : 10) * sq, h = (v ? 14 : 11) / sq;
        g.translate(ux * lg, uy * lg * .6);
        lavaGlow(0, -h * .5, 24, .35 + .1 * Math.sin(tt * 5));
        g.fillStyle = F(v ? '#8f1e08' : '#e8501a');
        g.beginPath();
        g.moveTo(-w, 0);
        g.bezierCurveTo(-w * 1.1, -h * 1.5, w * 1.1, -h * 1.5, w, 0);
        g.quadraticCurveTo(0, 3, -w, 0);
        g.fill();
        g.fillStyle = F(v ? '#d83a12' : '#ff9a2a');
        g.beginPath();
        g.moveTo(-w * .7, -1);
        g.bezierCurveTo(-w * .8, -h * 1.1, w * .8, -h * 1.1, w * .7, -1);
        g.fill();
        if (v) {
          g.fillStyle = F('#241010');
          g.fillRect(-w * .6, -h * .95, 5, 3);
          g.fillRect(w * .1, -h * .8, 6, 3);
          g.fillRect(-2, -h * 1.15, 4, 2);
        } else {
          g.fillStyle = F('#ffe28a');
          g.fillRect(-w * .3, -h * .5, 3, 2);
          g.fillRect(w * .2, -h * .35, 2, 2);
        }
        g.fillStyle = F('#fff2b0');
        g.fillRect(-w * .45 + ux, -h * .75 + uy, 3, 3);
        g.fillRect(w * .15 + ux, -h * .75 + uy, 3, 3);
        g.fillStyle = F('#3a0a00');
        g.fillRect(-w * .45 + 1 + ux * 1.5, -h * .75 + 1 + uy, 1, 2);
        g.fillRect(w * .15 + 1 + ux * 1.5, -h * .75 + 1 + uy, 1, 2);
        g.fillStyle = F('#ffb050');
        const dr = (tt * 14) % 6;
        g.fillRect(-w * .8, -2 + dr * .3, 1, 2 + dr * .4);
        g.fillRect(w * .7, -1 + dr * .2, 1, 2);
        lavaFlame(0, -h * 1.05, v ? 4 : 3, v ? 9 : 6, F('#ff7a1f'), F('#ffe28a'), e.ph);
      } else if (e.k == 'skel') { /* LAVA GOLEM: raksasa batu berapi, seram */
        const pg = e.wind > 0 ? 1 - e.wind / .6 : 0, ar = pg * 11, gl = .55 + .3 * Math.sin(tt * 4) + pg * .9, bob = -Math.abs(Math.sin(e.gp || 0)) * 1.8 * (e.mz || 0);
        const rk = F(v ? '#1a1112' : '#3a2927'), rk2 = F(v ? '#2f1c19' : '#5a3f38'), rk3 = F(v ? '#4f2c24' : '#7e5649'), LA = F('#ff7a1f'), LY = F('#ffd34d'), LR = F(v ? '#e8300f' : '#c8300f');
        g.translate(0, bob);
        g.scale(1.25, 1.25);
        lavaGlow(0, -14, 38 + pg * 18, .3 + .25 * gl, v ? '255,70,20' : '255,130,40');
        g.fillStyle = rk;
        g.fillRect(-9, -9, 7, 9);
        g.fillRect(2, -9, 7, 9);
        g.fillStyle = rk3;
        g.fillRect(-10, -2, 9, 3);
        g.fillRect(1, -2, 9, 3);
        g.fillStyle = LA;
        g.fillRect(-6, -7, 1, 5);
        g.fillRect(5, -6, 1, 4);
        g.fillStyle = rk2;
        g.fillRect(-9, -13, 18, 5);
        g.fillStyle = LA;
        g.fillRect(-1, -12, 2, 3);
        g.fillStyle = rk2;
        g.beginPath();
        g.moveTo(-10, -12);
        g.lineTo(-14, -24);
        g.lineTo(14, -24);
        g.lineTo(10, -12);
        g.closePath();
        g.fill();
        g.fillStyle = rk3;
        g.fillRect(-12, -25, 24, 3);
        g.fillStyle = F(v ? '#ff3a10' : '#ff5a1f');
        g.fillRect(-6, -22, 12, 9);
        g.fillStyle = rk;
        for (let i = 0; i < 3; i++)
          g.fillRect(-4 + i * 4, -22, 1.6, 9);
        g.fillStyle = LY;
        g.beginPath();
        g.arc(0, -17, 2 + gl * 1.5, 0, 7);
        g.fill();
        if (!fl)
          lavaGlow(0, -17, 12 + pg * 8, .7);
        g.fillStyle = LA;
        g.fillRect(-12, -20, 4, 1);
        g.fillRect(-10, -20, 1, 6);
        g.fillRect(8, -23, 1, 7);
        g.fillRect(8, -17, 4, 1);
        for (const s of [-1, 1]) {
          g.fillStyle = rk;
          g.beginPath();
          g.arc(s * 14, -23, 6.5, 0, 7);
          g.fill();
          g.fillStyle = rk3;
          for (let i = 0; i < (v ? 3 : 2); i++) {
            const a = -1.57 + s * (.2 + i * .5), L2 = v ? 12 : 9;
            g.beginPath();
            g.moveTo(s * 14 + Math.cos(a - .3) * 5, -23 + Math.sin(a - .3) * 5);
            g.lineTo(s * 14 + Math.cos(a) * L2, -23 + Math.sin(a) * L2);
            g.lineTo(s * 14 + Math.cos(a + .3) * 5, -23 + Math.sin(a + .3) * 5);
            g.fill();
          }
          g.fillStyle = LA;
          g.fillRect(s * 14 - 3, -22, 6, 1);
          if (!fl)
            lavaFlame(s * 14, -27, 5, v ? 18 : 12, LR, LY, s + e.ph);
          g.fillStyle = rk;
          g.fillRect(s * 17 - 3, -21 - ar, 6, 13);
          g.fillStyle = rk2;
          g.fillRect(s * 17 - 4, -10 - ar, 8, 7);
          g.fillStyle = LA;
          g.fillRect(s * 17 - 4, -8 - ar, 8, 1);
          g.fillRect(s * 17 - 1, -20 - ar, 1, 8);
          if (!fl) {
            lavaFlame(s * 17, -10 - ar, 4 + pg * 4, 9 + pg * 14, LR, LY, s * 3 + e.ph);
            if (pg > .2)
              lavaGlow(s * 17, -7 - ar, 14, .6 * pg);
          }
          g.fillStyle = rk3;
          g.beginPath();
          g.moveTo(s * 5, -32);
          g.quadraticCurveTo(s * (v ? 13 : 10), -34, s * (v ? 11 : 9), -(v ? 44 : 40));
          g.lineTo(s * 4, -30);
          g.closePath();
          g.fill();
        }
        g.fillStyle = rk2;
        g.fillRect(-6, -33, 12, 9);
        g.fillStyle = rk;
        g.fillRect(-7, -31, 14, 3);
        g.fillStyle = LY;
        g.fillRect(-5, -30, 4, 2);
        g.fillRect(1, -30, 4, 2);
        if (!fl) {
          lavaGlow(-3, -29, 7, .9, '255,70,20');
          lavaGlow(3, -29, 7, .9, '255,70,20');
        }
        g.fillStyle = F('#ff6a1f');
        g.fillRect(-4, -26, 8, 2 + pg * 3);
        g.fillStyle = F('#e8dcc0');
        for (let i = 0; i < 4; i++)
          g.fillRect(-4 + i * 2.2, -26, 1, 1.5 + pg);
        if (!fl) {
          lavaFlame(0, -33, v ? 7 : 5, v ? 24 : 16, LR, LY, e.ph);
          lavaFlame(-4, -33, 3, v ? 12 : 8, LA, LY, e.ph + 2);
          lavaFlame(4, -33, 3, v ? 12 : 8, LA, LY, e.ph + 4);
          for (let i = 0; i < 3; i++) {
            const dy = (tt * 30 + i * 13) % 16;
            g.fillStyle = LA;
            g.fillRect(-4 + i * 4, -12 + dy * .5, 1, 2);
          }
          for (let i = 0; i < 4; i++) {
            const a2 = (tt * 20 + i * 9) % 34;
            g.fillStyle = i % 2 ? LY : LA;
            g.fillRect(Math.sin(tt * 3 + i * 2) * 12, -14 - a2, 1.5, 1.5);
          }
        }
      } else { /* BLASH: hantu tengkorak api, seram */
        const pg = e.wind > 0 ? 1 - e.wind / .7 : 0, hv = -14 + Math.sin(tt * 3) * 2.5, c1 = v ? '#a81006' : '#e8501a', c2 = v ? '#ff7a1f' : '#ff9a2a', bone = F('#d9c8a8'), dk = F('#1a0505');
        g.translate(0, hv);
        if (v)
          g.scale(1.15, 1.15);
        lavaGlow(0, -4, 32, .35 + .25 * pg, v ? '255,60,20' : '255,120,40');
        g.fillStyle = F(c1);
        g.beginPath();
        g.moveTo(-9, -5);
        g.quadraticCurveTo(-14, 6, -11, 14);
        for (let i = 0; i < 5; i++) {
          const x = -11 + i * 5.5;
          g.lineTo(x + 2.7 + Math.sin(tt * 7 + i * 1.3) * 2, 24 + (i % 2) * 6 + Math.sin(tt * 5 + i) * 2);
          g.lineTo(x + 5.5, 14);
        }
        g.quadraticCurveTo(14, 6, 9, -5);
        g.closePath();
        g.fill();
        g.fillStyle = dk;
        g.beginPath();
        g.moveTo(-5, -3);
        g.lineTo(5, -3);
        g.lineTo(3, 16);
        g.lineTo(-3, 16);
        g.closePath();
        g.fill();
        g.fillStyle = F(c2);
        for (let i = 0; i < 3; i++)
          g.fillRect(-4, 0 + i * 4, 8, 1);
        lavaFlame(0, -14, v ? 9 : 7, v ? 24 : 17, F(c1), F(c2), e.ph);
        g.fillStyle = dk;
        for (const s of [-1, 1]) {
          g.beginPath();
          g.moveTo(s * 5, -14);
          g.quadraticCurveTo(s * 13, -17, s * 10, -(v ? 33 : 27));
          g.lineTo(s * 7, -16);
          g.closePath();
          g.fill();
        }
        g.fillStyle = bone;
        g.beginPath();
        g.ellipse(0, -9, 7.5, 8, 0, 0, 7);
        g.fill();
        g.fillRect(-5, -4, 10, 5);
        g.fillStyle = dk;
        for (const s of [-1, 1]) {
          g.save();
          g.translate(s * 3.4, -10);
          g.rotate(s * .35);
          g.beginPath();
          g.ellipse(0, 0, 2.6, 3.4, 0, 0, 7);
          g.fill();
          g.restore();
        }
        g.beginPath();
        g.moveTo(-1, -7);
        g.lineTo(1, -7);
        g.lineTo(0, -4.5);
        g.fill();
        if (!fl) {
          for (const s of [-1, 1]) {
            lavaGlow(s * 3.4 + ux, -10 + uy, 8, .9, '255,200,60');
            g.fillStyle = '#fff2a0';
            g.beginPath();
            g.arc(s * 3.4 + ux * .8, -10 + uy * .8, 1.4, 0, 7);
            g.fill();
          }
          if (v) {
            lavaGlow(0, -15, 5, .9, '255,80,30');
            g.fillStyle = '#ff5a1f';
            g.fillRect(-1, -16, 2, 2);
          }
        }
        g.fillStyle = pg > .2 ? F('#ff7a1f') : dk;
        g.fillRect(-4.5, -2.5, 9, 2 + pg * 3);
        g.fillStyle = F('#efe3c8');
        for (let i = 0; i < 5; i++)
          g.fillRect(-4 + i * 2, -2.5, 1.2, 2 + pg);
        const hx = pg > 0 ? 7 : 12, hy = pg > 0 ? -3 : 3 + Math.sin(tt * 4) * 2;
        for (const s of [-1, 1]) {
          const px = s * hx + (pg > 0 ? ux * 3 : 0), py = hy + (pg > 0 ? uy * 2 : 0);
          g.strokeStyle = bone;
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(s * 7, 2);
          g.lineTo(px, py);
          g.stroke();
          for (let k = -1; k <= 1; k++) {
            g.beginPath();
            g.moveTo(px, py);
            g.lineTo(px + s * 3 + (pg > 0 ? ux * 2 : 0), py + k * 3 + (pg > 0 ? uy * 2 : 1.5));
            g.stroke();
          }
        }
        for (let i = 0; i < 3; i++) {
          const a = tt * 3 + i * 2.1;
          g.fillStyle = F(i % 2 ? '#ffd34d' : '#ff6a1f');
          g.fillRect(Math.round(Math.cos(a) * 12), Math.round(Math.sin(a) * 5 - 2), 2, 2);
        }
        if (pg > 0) {
          lavaGlow(ux * 14, -2 + uy * 8, 8 + pg * 12, .95, '255,200,80');
          g.fillStyle = F('#fff2b0');
          g.beginPath();
          g.arc(ux * 14, -2 + uy * 8, 1.5 + pg * 4, 0, 7);
          g.fill();
        }
      }
      g.restore();
    }
    const _drawEnemyL = drawEnemy;
    drawEnemy = function (e) {
      if (lavaOn() && room < 2 && (e.k == 'slime' || e.k == 'skel' || e.k == 'mage')) {
        try {
          lavaDraw(e);
          return;
        } catch (x) { }
      } _drawEnemyL(e);
    };
    /* palet efek ikut tema */
    const _drawLE = draw;
    draw = function () {
      const on = lavaOn() && room < 2; if (on != ecLava) {
        ecLava = on;
        Object.assign(EC, on ? EC_L : EC_O);
        Object.keys(SPC_L).forEach(k => { SPC[k] = on ? SPC_L[k] : SPC_O[k]; SPH[k] = on ? SPH_L[k] : SPH_O[k]; });
      } _drawLE();
    };
    /* statistik: slime cepat & rapuh, golem lambat & tebal, Blash rapuh; varian Magma (room 1) lebih kuat */
    const _spawnLE = spawn;
    spawn = function () {
      _spawnLE();
      if (!lavaOn() || room > 1)
        return;
      const m = room ? 1.2 : 1;
      es.forEach(e => {
        if (e.k == 'slime') {
          e.sp *= 1.2;
          e.hp = e.mhp = Math.round(e.hp * .9 * m);
        } else if (e.k == 'skel') {
          e.sp *= .85;
          e.r = 12;
          e.ht = 38;
          e.hp = e.mhp = Math.round(e.hp * 1.4 * m);
        } else if (e.k == 'mage') {
          e.hp = e.mhp = Math.round(e.hp * .9 * m);
        }
      });
    };
    /* efek area golem, bola api Blash, kolam lava sisa hantaman */
    const _updLE = upd;
    upd = function (dt) {
      if (room != lzRoom || !lavaOn()) {
        LZ = [];
        lzRoom = room;
      }
      const sl = lavaOn() && room < 2 ? es.filter(e => e.k == 'skel' && e.wind > 0 && e.sw <= 0).map(e => [e, e.tx, e.ty]) : [];
      _updLE(dt);
      if (!lavaOn() || room > 1)
        return;
      sl.forEach(([e, x, y]) => {
        if (e.wind <= 0 && !(e.stun > 0)) {
          LZ.push({ x, y, r: room ? 56 : 48, life: room ? 4 : 3 });
          fx.push({ k: 'ring', x, y, r: room ? 64 : 54, life: .35, max: .35, col: '#ff7a1f' });
          for (let i = 0; i < 16; i++) {
            const a = R() * 6.283, v = 40 + R() * 90;
            dp.push({
              k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6 - 20, life: .5 + R() * .4, max: .9, s: 1.5 + R() * 2, c: i % 2 ? '#ffb050' : '#ff5a1f'
            });
          }
          shake = Math.max(shake, 5);
          if (p.dead <= 0 && Math.hypot(p.x - x, p.y - y) < (room ? 48 : 42) + p.r)
            hurt(16);
        }
      });
      const nw = pr.filter(b => b.own == 'e' && !b.lv);
      nw.forEach(b => {
        b.lv = 1;
        b.rock = 1;
        b.col = '#ff6a1f';
        b.r = 3.5;
        b.d = Math.round(b.d * 1.1);
        if (room) {
          const a = Math.atan2(b.vy, b.vx), s = Math.hypot(b.vx, b.vy);
          [-.3, .3].forEach(o => pr.push({ ...b, vx: Math.cos(a + o) * s, vy: Math.sin(a + o) * s, d: Math.round(b.d * .75), lv: 1 }));
        }
      });
      pr.forEach(b => {
        if (b.own == 'e' && b.lv && R() < dt * 40)
          dp.push({
            k: 'p', x: b.x, y: b.y, vx: (R() - .5) * 10, vy: -8 - R() * 10, life: .3, max: .3, s: 1.5, c: R() < .5 ? '#ffd34d' : '#ff5a1f'
          });
      });
      LZ = LZ.filter(z => (z.life -= dt) > 0);
      LZ.forEach(z => {
        if (R() < dt * 16)
          dp.push({
            k: 'p', x: z.x + (R() - .5) * z.r * 1.4, y: z.y + (R() - .5) * z.r, vx: 0, vy: -18 - R() * 20, life: .5, max: .5, s: 1.5, c: '#ffb050'
          }); if (p && p.dead <= 0 && p.dod <= 0 && Math.hypot(p.x - z.x, (p.y - z.y) * 1.3) < z.r)
          hurt(5);
      });
    };
    const _envFxLE = envFx;
    envFx = function () {
      _envFxLE();
      LZ.forEach(z => { const k = Math.min(1, z.life / .6), pu = .75 + .25 * Math.sin(t * 8); g.save(); g.globalCompositeOperation = 'lighter'; const q = g.createRadialGradient(z.x, z.y, 2, z.x, z.y, z.r); q.addColorStop(0, 'rgba(255,200,80,' + .55 * k * pu + ')'); q.addColorStop(.6, 'rgba(255,90,20,' + .4 * k + ')'); q.addColorStop(1, 'rgba(200,30,0,0)'); g.fillStyle = q; g.save(); g.translate(z.x, z.y); g.scale(1, .75); g.translate(-z.x, -z.y); g.beginPath(); g.arc(z.x, z.y, z.r, 0, 7); g.fill(); g.restore(); g.restore(); });
    };
    /* ===== LEVEL 3: FROST CRYPT (tema es) =====
       Musuh (memakai slot AI yang sama dengan Level 2):
       'slime' -> SKELETON BERARMOR ES  (jarak dekat, tebasan pedang es)
       'skel'  -> ICE GOLEM RAMPING     (serangan AREA: hantaman + zona beku sisa)
       'mage'  -> ICE MAGE              (jarak jauh: pecahan es; Room 2 menembak 3 arah)
       Room 0 = "Frost Hall" (biru muda), Room 1 = "Glacier Crypt" (biru tua, lebih kuat).
       Efek tema: kena serangan musuh es -> MEMBEKU (gerak melambat 30%). Bos tetap Morvath (arena diberi nuansa es). */
    const iceOn = () => LVL == 3 && !lobby && room <= 2;
    const iceR = () => iceOn() && room < 2;
    const EC_I = {
      slime: ['#8fd0f0', '#e6fbff', '#4a8fc8'], skel: ['#7fc4ee', '#d6f6ff', '#3a6fb0'], mage: ['#8fe0ff', '#ffffff', '#5aa0ff']
    };
    const SPC_I = {
      slime: ['190,235,255', '90,150,210'], skel: ['170,225,255', '60,110,180'], mage: ['200,245,255', '90,170,255']
    }, SPH_I = { slime: '#bfeaff', skel: '#9fd8ff', mage: '#c8f4ff' };
    let ecIce = false, IB = null, IBB = null, ICR = [[], [], []], IZ = [], izRoom = -1, chillT = 0;
    window.CHILLM = 1;

    function chill(d) {
      if (!iceR() || !p || p.dead > 0)
        return; if (!(chillT > 0))
        msg('❄ Kau membeku! Gerakmu melambat.'); chillT = Math.max(chillT, d);
    }

    /* ---------- util gambar ---------- */
    function iceGlow(x, y, r, a, c) { g.save(); g.globalCompositeOperation = 'lighter'; const cc = c || '130,215,255', q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(' + cc + ',' + Math.min(1, a) + ')'); q.addColorStop(1, 'rgba(' + cc + ',0)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }

    function iceSpike(x, y, w, h, c) { g.fillStyle = c; g.beginPath(); g.moveTo(x - w, y); g.lineTo(x, y - h); g.lineTo(x + w, y); g.closePath(); g.fill(); }

    /* ---------- latar: tekstur lantai diwarnai es + retakan + lapisan es + kristal di tepi ruangan ---------- */
    function iceCrystalB(b, x, y, sc, r) {
      const n = 3 + (r() * 3 | 0);
      b.fillStyle = 'rgba(0,0,0,.25)';
      b.fillRect(x - n * 3 * sc, y, n * 6 * sc, 2);
      for (let i = 0; i < n; i++) {
        const k = i - (n - 1) / 2, ox = k * 4.5 * sc + (r() - .5) * 3, hh = (10 + r() * 16) * sc * (1 - Math.abs(k) * .14), ww = (3 + r() * 2.4) * sc;
        b.fillStyle = '#3f78b8';
        b.beginPath();
        b.moveTo(x + ox - ww, y);
        b.lineTo(x + ox - ww * .6, y - hh * .75);
        b.lineTo(x + ox, y - hh);
        b.lineTo(x + ox + ww * .6, y - hh * .75);
        b.lineTo(x + ox + ww, y);
        b.closePath();
        b.fill();
        b.fillStyle = '#9fdcf5';
        b.beginPath();
        b.moveTo(x + ox - ww, y);
        b.lineTo(x + ox - ww * .6, y - hh * .75);
        b.lineTo(x + ox, y - hh);
        b.lineTo(x + ox, y);
        b.closePath();
        b.fill();
        b.fillStyle = 'rgba(255,255,255,.85)';
        b.fillRect(x + ox - ww * .35, y - hh * .7, 1, hh * .4);
      }
    }

    function iceTint(src, strong, seed, ws, nCr) {
      const w = src.width, h = src.height, c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const b = c.getContext('2d');
      let sd = seed;
      const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, cr = [];
      b.drawImage(src, 0, 0);
      b.globalCompositeOperation = 'multiply';
      b.fillStyle = strong ? '#6f92d6' : '#97c0ee';
      b.fillRect(0, 0, w, h);
      b.globalCompositeOperation = 'source-over';
      b.fillStyle = 'rgba(8,28,70,.24)';
      b.fillRect(0, 0, w, h);
      const vg = b.createRadialGradient(w / 2, h / 2, h * .25, w / 2, h / 2, w * .62);
      vg.addColorStop(0, 'rgba(190,230,255,0)');
      vg.addColorStop(1, 'rgba(210,240,255,.22)');
      b.fillStyle = vg;
      b.fillRect(0, 0, w, h);
      b.lineCap = 'round';
      b.lineJoin = 'round';
      for (let i = 0; i < 14; i++) {
        let x = 40 + r() * (w - 80), y = 40 + r() * (h - 80);
        b.beginPath();
        b.moveTo(x, y);
        for (let k = 0; k < 5; k++) {
          x += (r() - .5) * 60;
          y += (r() - .5) * 60;
          b.lineTo(x, y);
        }
        b.strokeStyle = 'rgba(200,240,255,.4)';
        b.lineWidth = 3;
        b.stroke();
        b.strokeStyle = 'rgba(255,255,255,.75)';
        b.lineWidth = 1;
        b.stroke();
      }
      const hit = (x, y, w2, h2, m) => (ws || []).some(q => x + w2 + m > q[0] && x - m < q[0] + q[2] && y + h2 + m > q[1] && y - m < q[1] + q[3]), sheets = [];
      for (let a = 0; a < 500 && sheets.length < (strong ? 6 : 5); a++) {
        const w2 = 54 + r() * 40 | 0, h2 = 34 + r() * 22 | 0, x = 120 + r() * (w - 240 - w2) | 0, y = 44 + r() * (h - 88 - h2) | 0;
        if (hit(x, y, w2, h2, 14) || sheets.some(q => x + w2 + 30 > q[0] && x - 30 < q[0] + q[2] && y + h2 + 30 > q[1] && y - 30 < q[1] + q[3]))
          continue;
        sheets.push([x, y, w2, h2]);
      }
      sheets.forEach(([x, y, w2, h2]) => {
        b.fillStyle = 'rgba(15,45,100,.5)';
        b.fillRect(x - 3, y - 3, w2 + 6, h2 + 6);
        const q = b.createLinearGradient(x, y, x + w2, y + h2);
        q.addColorStop(0, 'rgba(235,252,255,.88)');
        q.addColorStop(.5, 'rgba(150,210,245,.82)');
        q.addColorStop(1, 'rgba(100,160,225,.88)');
        b.fillStyle = q;
        b.fillRect(x, y, w2, h2);
        b.strokeStyle = 'rgba(255,255,255,.75)';
        b.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          const gx = x + 6 + r() * (w2 - 22), gy = y + 4 + r() * (h2 - 14);
          b.beginPath();
          b.moveTo(gx, gy + 8);
          b.lineTo(gx + 8, gy);
          b.stroke();
        }
        b.strokeStyle = 'rgba(60,110,190,.6)';
        b.lineWidth = 1;
        b.beginPath();
        b.moveTo(x + r() * w2, y);
        b.lineTo(x + r() * w2, y + h2 * .5);
        b.lineTo(x + r() * w2, y + h2);
        b.stroke();
      });
      const dy = typeof DY == 'number' ? DY : h / 2, n = nCr || (strong ? 9 : 7);
      for (let a = 0, k = 0; a < 200 && k < n; a++) {
        const top = r() < .5, x = 40 + r() * (w - 80), y = top ? 28 + r() * 14 : h - 26 + r() * 8;
        if ((x < 110 || x > w - 110) && Math.abs(y - dy) < 56)
          continue;
        if (hit(x - 14, y - 24, 28, 26, 4))
          continue;
        iceCrystalB(b, x, y, .8 + r() * .5, r);
        cr.push([x, y - 10]);
        k++;
      }
      return { c, cr };
    }

    function iceBuild() { const a = iceTint(BG0, false, 5, W0), b = iceTint(BG1, true, 8, W1); IB = [a.c, b.c]; ICR[0] = a.cr; ICR[1] = b.cr; }

    function iceBuildBoss() { const a = iceTint(BGB, true, 13, typeof W2 != 'undefined' ? W2 : [], 10); IBB = a.c; ICR[2] = a.cr; }

    /* ---------- gambar musuh es ---------- */
    function iceDraw(e) {
      const v = room, fl = e.fl > 0, F = c => fl ? '#fff' : c, tt = t + e.ph, dx = p.x - e.x, dy = p.y - e.y, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
      e.fcs = e.fcs == null ? (ux >= 0 ? 1 : -1) : e.fcs + ((ux >= 0 ? 1 : -1) - e.fcs) * .2;
      const sg = e.fcs >= 0 ? 1 : -1, m = e.mz || 0, gp = e.gp || 0;
      g.save();
      g.translate((e.rx == null ? e.x : e.rx) + (e.stun > 0 ? Math.sin(t * 40) * 1.2 : 0), (e.ry == null ? e.y : e.ry) + 7);
      if (e.rx != null) {
        g.rotate(e.zr || 0);
        g.scale(e.zx || 1, e.zy || 1);
        if (e.k == 'slime')
          g.translate(0, -(e.hh || 0) * .215);
      }
      if (e.k == 'slime') { /* SKELETON BERARMOR ES: tengkorak, helm & zirah es, pedang es + perisai */
        const pg = e.an > 0 ? Math.min(1, 1 - e.an / .6) : 0, bone = F('#e6f0f4'), bone2 = F('#a9bcc8'), dk = F('#0f2038'), ia = F(v ? '#5f9ad6' : '#8fd0f0'), ia2 = F(v ? '#a6d0f4' : '#d4f4ff'), ia3 = F(v ? '#2f5f9a' : '#4a8fc8'), eye = F('#c8f6ff');
        const lg = Math.sin(pg * Math.PI) * 5;
        g.translate(ux * lg, uy * lg * .5);
        g.scale(1.25, 1.25);
        iceGlow(0, -11, 26, .2 + .08 * Math.sin(tt * 4), '130,205,255');
        for (const sd of [-1, 1]) {
          const lf = Math.max(0, Math.sin(gp + (sd > 0 ? Math.PI : 0))) * 1.8 * m;
          g.fillStyle = bone;
          g.fillRect(sd * 2.6 - .8, -10, 1.6, 10 - lf);
          g.fillStyle = ia;
          g.fillRect(sd * 2.6 - 1.7, -6.5 - lf, 3.4, 4.2);
          g.fillStyle = ia3;
          g.fillRect(sd * 2.6 - 2.2 + sg * .8, -2.2 - lf, 4.4, 2.2);
        }
        g.fillStyle = bone2;
        g.fillRect(-4.5, -19, 9, 8);
        g.fillStyle = dk;
        g.fillRect(-5, -12, 10, 2.4);
        g.fillStyle = ia3;
        g.beginPath();
        g.moveTo(-5.6, -11);
        g.lineTo(5.6, -11);
        g.lineTo(6.6, -19.5);
        g.lineTo(-6.6, -19.5);
        g.closePath();
        g.fill();
        g.fillStyle = ia;
        g.beginPath();
        g.moveTo(-5.6, -11);
        g.lineTo(0, -11);
        g.lineTo(0, -19.5);
        g.lineTo(-6.6, -19.5);
        g.closePath();
        g.fill();
        g.fillStyle = ia2;
        g.fillRect(-.7, -19, 1.4, 7);
        g.fillRect(-1.2, -12.2, 2.4, 2.4);
        for (const sd of [-1, 1]) {
          g.fillStyle = ia;
          g.beginPath();
          g.moveTo(sd * 4.6, -19.8);
          g.lineTo(sd * 9.8, -21.2);
          g.lineTo(sd * 8.6, -24.8 - (v ? 3 : 0));
          g.lineTo(sd * 5.6, -22.4);
          g.closePath();
          g.fill();
          g.fillStyle = ia2;
          g.fillRect(sd * 6 - 1, -21.6, 2, 1);
        }
        g.fillStyle = bone;
        g.beginPath();
        g.ellipse(0, -25, 4.4, 4.7, 0, 0, 7);
        g.fill();
        g.fillStyle = bone2;
        g.fillRect(-2.9, -22, 5.8, 2.7);
        g.fillStyle = dk;
        for (let i = 0; i < 3; i++)
          g.fillRect(-2.2 + i * 1.8, -21.4, .7, 1.8);
        for (const s of [-1, 1]) {
          g.beginPath();
          g.ellipse(s * 1.9, -25.4, 1.5, 1.9, 0, 0, 7);
          g.fill();
        }
        g.fillRect(-.5, -23.4, 1, 1.2);
        if (!fl) {
          for (const s of [-1, 1])
            iceGlow(s * 1.9 + ux * .6, -25.4 + uy * .5, 6, .8);
          g.fillStyle = eye;
          for (const s of [-1, 1])
            g.fillRect(s * 1.9 + ux * .6 - .7, -25.4 + uy * .5 - .7, 1.4, 1.4);
        }
        g.fillStyle = ia;
        g.beginPath();
        g.moveTo(-5.3, -25);
        g.quadraticCurveTo(-5.8, -32.5, 0, -33);
        g.quadraticCurveTo(5.8, -32.5, 5.3, -25);
        g.lineTo(3.7, -27);
        g.lineTo(-3.7, -27);
        g.closePath();
        g.fill();
        g.fillStyle = ia3;
        g.fillRect(-.6, -31, 1.2, 4.6);
        g.fillRect(-5.3, -25, 1.6, 3.5);
        g.fillRect(3.7, -25, 1.6, 3.5);
        for (let i = -1; i <= 1; i++)
          iceSpike(i * 2.4, -31.6, 1.3, i ? (v ? 5 : 3.4) : (v ? 8 : 6), ia2);
        if (v)
          for (const s of [-1, 1])
            iceSpike(s * 5, -28, 1.2, 4.5, ia2);
        let A = -1.0;
        if (pg > 0)
          A = pg < .45 ? -1.0 - 1.5 * (pg / .45) : pg < .7 ? -2.5 + 3.6 * Math.min(1, (pg - .45) / .25) : 1.1 - 2.1 * ((pg - .7) / .3);
        const ang = sg > 0 ? A : Math.PI - A, hx = sg * 6.8 + Math.cos(ang) * 2.6, hy = -16 + Math.sin(ang) * 2.6, L = v ? 16 : 14, shx = -sg * 7.8;
        g.fillStyle = ia3;
        g.beginPath();
        g.arc(shx, -14.5, 4.8, 0, 7);
        g.fill();
        g.fillStyle = ia;
        g.beginPath();
        g.arc(shx, -14.5, 3.4, 0, 7);
        g.fill();
        g.fillStyle = ia2;
        g.fillRect(shx - .5, -17.6, 1, 6.2);
        g.fillRect(shx - 3.1, -15, 6.2, 1);
        g.strokeStyle = bone;
        g.lineWidth = 1.7;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(sg * 6, -18.5);
        g.lineTo(hx, hy);
        g.stroke();
        if (pg > .45 && pg < .8 && !fl) {
          g.save();
          g.globalCompositeOperation = 'lighter';
          g.strokeStyle = 'rgba(190,240,255,' + Math.max(0, .7 * (1 - Math.abs(pg - .6) * 3)) + ')';
          g.lineWidth = 3;
          g.beginPath();
          g.arc(hx, hy, L * .9, sg > 0 ? -2.5 : Math.PI + 2.5, ang, sg < 0);
          g.stroke();
          g.restore();
        }
        const cx = Math.cos(ang), cy = Math.sin(ang), nx = -cy, ny = cx;
        g.fillStyle = ia2;
        g.beginPath();
        g.moveTo(hx + nx * 1.2, hy + ny * 1.2);
        g.lineTo(hx + cx * L + nx * .5, hy + cy * L + ny * .5);
        g.lineTo(hx + cx * (L + 3), hy + cy * (L + 3));
        g.lineTo(hx + cx * L - nx * .5, hy + cy * L - ny * .5);
        g.lineTo(hx - nx * 1.2, hy - ny * 1.2);
        g.closePath();
        g.fill();
        g.strokeStyle = ia;
        g.lineWidth = .8;
        g.beginPath();
        g.moveTo(hx + cx * 2, hy + cy * 2);
        g.lineTo(hx + cx * L, hy + cy * L);
        g.stroke();
        g.strokeStyle = dk;
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(hx + nx * 3 + cx, hy + ny * 3 + cy);
        g.lineTo(hx - nx * 3 + cx, hy - ny * 3 + cy);
        g.stroke();
        if (!fl)
          iceGlow(hx + cx * L * .6, hy + cy * L * .6, 9, .3 + pg * .4);
      } else if (e.k == 'skel') { /* ICE GOLEM RAMPING: tinggi & kurus, lengan panjang, hantaman area */
        const pg = e.wind > 0 ? 1 - e.wind / .6 : 0, ks = e.kick || 0, gl = .55 + .3 * Math.sin(tt * 4) + pg * .9, bob = -Math.abs(Math.sin(gp)) * 1.2 * m;
        const ik = F(v ? '#2b4f86' : '#4f86c4'), ik2 = F(v ? '#4f84c8' : '#8fd0f0'), ik3 = F(v ? '#a8d4f8' : '#d6f6ff'), ikd = F('#0e2040'), CO = F('#c8f8ff'), CO2 = F('#5fd0ff');
        g.translate(0, bob);
        g.scale(.9, .9);
        iceGlow(0, -28, 44 + pg * 18, .22 + .18 * gl, '110,190,255');
        for (const sd of [-1, 1]) {
          const lf = Math.max(0, Math.sin(gp + (sd > 0 ? Math.PI : 0))) * 2 * m;
          g.fillStyle = ik;
          g.fillRect(sd * 3.6 - 1.6, -19, 3.2, 19 - lf);
          g.fillStyle = ik2;
          g.fillRect(sd * 3.6 - 1.6, -19, 1.2, 19 - lf);
          g.fillStyle = ik3;
          g.beginPath();
          g.moveTo(sd * 3.6, -13 - lf);
          g.lineTo(sd * 3.6 + 2.6, -10 - lf);
          g.lineTo(sd * 3.6, -7 - lf);
          g.lineTo(sd * 3.6 - 2.6, -10 - lf);
          g.closePath();
          g.fill();
          g.fillStyle = ik2;
          g.beginPath();
          g.moveTo(sd * 3.6 - 2.4, -lf);
          g.lineTo(sd * 3.6 + 2.4, -lf);
          g.lineTo(sd * 3.6 + 2, -3 - lf);
          g.lineTo(sd * 3.6 - 2, -3 - lf);
          g.closePath();
          g.fill();
        }
        g.fillStyle = ik2;
        g.beginPath();
        g.moveTo(-6.5, -19);
        g.lineTo(6.5, -19);
        g.lineTo(4.5, -24);
        g.lineTo(-4.5, -24);
        g.closePath();
        g.fill();
        g.fillStyle = ik2;
        g.beginPath();
        g.moveTo(-4.5, -24);
        g.lineTo(4.5, -24);
        g.lineTo(8.5, -40);
        g.lineTo(-8.5, -40);
        g.closePath();
        g.fill();
        g.fillStyle = ik;
        g.beginPath();
        g.moveTo(-4.5, -24);
        g.lineTo(0, -24);
        g.lineTo(0, -40);
        g.lineTo(-8.5, -40);
        g.closePath();
        g.fill();
        g.fillStyle = ik3;
        g.beginPath();
        g.moveTo(2.6, -26);
        g.lineTo(4.5, -24);
        g.lineTo(8.5, -40);
        g.lineTo(5.2, -40);
        g.closePath();
        g.fill();
        g.strokeStyle = ikd;
        g.lineWidth = .8;
        g.beginPath();
        g.moveTo(-3, -26);
        g.lineTo(-5.2, -33);
        g.lineTo(-4.4, -38);
        g.moveTo(3, -36);
        g.lineTo(1.6, -40);
        g.stroke();
        g.fillStyle = CO2;
        g.beginPath();
        g.moveTo(0, -37);
        g.lineTo(3.6, -32);
        g.lineTo(0, -27);
        g.lineTo(-3.6, -32);
        g.closePath();
        g.fill();
        g.fillStyle = CO;
        g.beginPath();
        g.moveTo(0, -34.5);
        g.lineTo(1.8, -32);
        g.lineTo(0, -29.5);
        g.lineTo(-1.8, -32);
        g.closePath();
        g.fill();
        if (!fl)
          iceGlow(0, -32, 14 + pg * 12, .55 + .3 * gl);
        for (const sd of [-1, 1]) {
          g.fillStyle = ik3;
          g.beginPath();
          g.moveTo(sd * 5.5, -39);
          g.lineTo(sd * 8.5, -49 - (v ? 4 : 0));
          g.lineTo(sd * 11, -39);
          g.closePath();
          g.fill();
          g.fillStyle = ik2;
          g.beginPath();
          g.moveTo(sd * 8, -40);
          g.lineTo(sd * 16, -45 - (v ? 3 : 0));
          g.lineTo(sd * 12.5, -37);
          g.closePath();
          g.fill();
          const sx0 = sd * 9, sy0 = -38;
          let hx = sd * 12, hy = -14 + Math.sin(tt * 2 + sd) * 1;
          if (pg > 0) {
            const q = pg * pg * (3 - 2 * pg);
            hx = sd * 12 + (sd * 5 - sd * 12) * q;
            hy = -14 + (-64 + 14) * q;
          } else if (ks > 0) {
            hx = sd * (12 - 4 * ks);
            hy = -14 + 13 * ks;
          }
          const ex = (sx0 + hx) / 2 + sd * 6, ey = (sy0 + hy) / 2;
          g.lineCap = 'round';
          g.lineJoin = 'round';
          g.strokeStyle = ik;
          g.lineWidth = 3.4;
          g.beginPath();
          g.moveTo(sx0, sy0);
          g.lineTo(ex, ey);
          g.lineTo(hx, hy);
          g.stroke();
          g.strokeStyle = ik2;
          g.lineWidth = 1.2;
          g.beginPath();
          g.moveTo(sx0, sy0);
          g.lineTo(ex, ey);
          g.lineTo(hx, hy);
          g.stroke();
          g.fillStyle = ik2;
          g.fillRect(hx - 3.6, hy - 4, 7.2, 4.6);
          for (let i = -1; i <= 1; i++) {
            g.fillStyle = ik3;
            g.beginPath();
            g.moveTo(hx + i * 2.8 - 1.9, hy + .4);
            g.lineTo(hx + i * 2.8, hy + (i ? 6 : 9));
            g.lineTo(hx + i * 2.8 + 1.9, hy + .4);
            g.closePath();
            g.fill();
          }
          if (!fl && pg > .2)
            iceGlow(hx, hy + 2, 14, .6 * pg);
        }
        g.fillStyle = ik;
        g.fillRect(-2, -43, 4, 4);
        g.fillStyle = ik2;
        g.beginPath();
        g.moveTo(0, -57);
        g.lineTo(5, -50);
        g.lineTo(3.6, -42.5);
        g.lineTo(-3.6, -42.5);
        g.lineTo(-5, -50);
        g.closePath();
        g.fill();
        g.fillStyle = ik;
        g.beginPath();
        g.moveTo(0, -57);
        g.lineTo(-5, -50);
        g.lineTo(-3.6, -42.5);
        g.lineTo(0, -42.5);
        g.closePath();
        g.fill();
        g.fillStyle = CO2;
        g.fillRect(-3.6, -50, 2.8, 1.5);
        g.fillRect(.8, -50, 2.8, 1.5);
        g.fillStyle = ikd;
        g.fillRect(-2.4, -46, 4.8, 1.2);
        if (!fl) {
          iceGlow(-2.2, -49.3, 7, .9);
          iceGlow(2.2, -49.3, 7, .9);
        }
        for (let i = -2; i <= 2; i++)
          iceSpike(i * 2, -55.5 + Math.abs(i) * 1.6, 1.1, 5 + (2 - Math.abs(i)) * (v ? 3.2 : 2.2), ik3);
        const no = v ? 4 : 3;
        for (let i = 0; i < no; i++) {
          const a = tt * 2 + i * (6.283 / no);
          g.save();
          g.translate(Math.cos(a) * 15, -36 + Math.sin(a) * 8);
          g.rotate(a);
          iceSpike(0, 2.5, 1.4, 5, ik3);
          g.restore();
        }
        if (!fl)
          for (let i = 0; i < 4; i++) {
            const a2 = (tt * 22 + i * 11) % 30;
            g.fillStyle = 'rgba(220,245,255,' + Math.max(0, .7 - a2 / 50) + ')';
            g.fillRect(Math.sin(tt * 3 + i * 2) * 10, -14 + a2 * .5, 1.4, 1.4);
          }
      } else { /* ICE MAGE: penyihir berjubah es, tongkat kristal, mengambang */
        const pg = e.wind > 0 ? 1 - e.wind / .7 : 0, hv = -8 + Math.sin(tt * 3) * 2.2, robe = F(v ? '#2a4c9a' : '#4a7fd0'), robe2 = F(v ? '#1b2f6a' : '#2f5aa8'), trim = F('#d6f6ff'), dk = F('#0b1830'), cry = F('#a8f0ff'), skin = F('#cfe8f4');
        g.translate(0, hv);
        if (v)
          g.scale(1.1, 1.1);
        iceGlow(0, -8, 32, .22 + .25 * pg, '120,200,255');
        g.fillStyle = robe;
        g.beginPath();
        g.moveTo(-5.5, -14);
        g.lineTo(5.5, -14);
        g.lineTo(11, 9);
        for (let i = 0; i < 5; i++) {
          const x = 11 - i * 4.4;
          g.lineTo(x - 2.2, 14 + (i % 2) * 3 + Math.sin(tt * 4 + i) * 1.2);
          g.lineTo(x - 4.4, 9);
        }
        g.closePath();
        g.fill();
        g.fillStyle = robe2;
        g.beginPath();
        g.moveTo(-2.6, -13);
        g.lineTo(2.6, -13);
        g.lineTo(5, 11);
        g.lineTo(-5, 11);
        g.closePath();
        g.fill();
        g.fillStyle = trim;
        g.fillRect(-9, 0, 18, 1);
        g.beginPath();
        g.ellipse(0, -13.5, 8.4, 3, 0, 0, 7);
        g.fill();
        g.fillStyle = robe;
        g.beginPath();
        g.moveTo(-6.2, -13);
        g.quadraticCurveTo(-8.2, -26, -1, -30);
        g.quadraticCurveTo(7, -26, 6.2, -13);
        g.closePath();
        g.fill();
        const tx = 5 + Math.sin(tt * 2) * 1.2;
        g.beginPath();
        g.moveTo(-3.4, -28);
        g.quadraticCurveTo(0, -34, tx, -(v ? 40 : 36));
        g.quadraticCurveTo(3, -31, 3.6, -27.6);
        g.closePath();
        g.fill();
        if (v)
          iceSpike(tx, -38, 1.3, 4, cry);
        g.fillStyle = dk;
        g.beginPath();
        g.ellipse(0, -20, 3.9, 4.8, 0, 0, 7);
        g.fill();
        g.strokeStyle = trim;
        g.lineWidth = 1;
        g.beginPath();
        g.ellipse(0, -20, 4.4, 5.3, 0, Math.PI * 1.05, Math.PI * 1.95);
        g.stroke();
        if (!fl) {
          for (const s of [-1, 1]) {
            iceGlow(s * 1.7 + ux * .6, -20 + uy * .5, 6, .9);
            g.fillStyle = '#e8fcff';
            g.fillRect(s * 1.7 + ux * .6 - .7, -20 + uy * .5 - .7, 1.4, 1.4);
          }
        }
        g.fillStyle = trim;
        g.beginPath();
        g.moveTo(-3, -16.8);
        g.lineTo(3, -16.8);
        g.lineTo(0, -9.5);
        g.closePath();
        g.fill();
        const sx = sg * 11, tilt = sg * pg * -.5, y0 = -28, cs = 1 + pg * .6;
        g.strokeStyle = robe;
        g.lineWidth = 3.2;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(sg * 5, -12);
        g.lineTo(sg * 10, -6);
        g.stroke();
        g.fillStyle = skin;
        g.beginPath();
        g.arc(sg * 10.5, -6, 1.6, 0, 7);
        g.fill();
        g.save();
        g.translate(sx, -2);
        g.rotate(tilt);
        g.strokeStyle = F('#5a4a3a');
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(0, 12);
        g.lineTo(0, -26);
        g.stroke();
        g.save();
        g.translate(0, y0);
        g.scale(cs, cs);
        g.fillStyle = cry;
        g.beginPath();
        g.moveTo(0, -7);
        g.lineTo(3.2, 0);
        g.lineTo(0, 5);
        g.lineTo(-3.2, 0);
        g.closePath();
        g.fill();
        g.fillStyle = F('#ffffff');
        g.fillRect(-.6, -4, 1.2, 4);
        g.restore();
        if (!fl)
          iceGlow(0, y0, 8 + pg * 14, .7);
        if (pg > 0)
          for (let i = 0; i < 4; i++) {
            const a = tt * 8 + i * 1.57, rr = 5 + pg * 6;
            iceSpike(Math.cos(a) * rr, y0 + Math.sin(a) * rr * .7 + 2, 1, 3.5, cry);
          }
        g.restore();
        const lhx = -sg * 8, lhy = -10 - pg * 7;
        g.strokeStyle = robe;
        g.lineWidth = 3.2;
        g.beginPath();
        g.moveTo(-sg * 5, -12);
        g.lineTo(lhx, lhy);
        g.stroke();
        g.fillStyle = skin;
        g.beginPath();
        g.arc(lhx, lhy, 1.6, 0, 7);
        g.fill();
        if (!fl && pg > 0)
          iceGlow(lhx, lhy, 8, .5 * pg);
        g.fillStyle = cry;
        for (let i = 0; i < 3; i++) {
          const a = tt * 3 + i * 2.1, x = Math.round(Math.cos(a) * 13), y = Math.round(Math.sin(a) * 5 - 12);
          g.fillRect(x - 1, y, 3, 1);
          g.fillRect(x, y - 1, 1, 3);
        }
      }
      g.restore();
    }
    const _drawEnemyI = drawEnemy;
    drawEnemy = function (e) {
      if (iceR() && !e.mini && (e.k == 'slime' || e.k == 'skel' || e.k == 'mage')) {
        try {
          iceDraw(e);
          return;
        } catch (x) { }
      } _drawEnemyI(e);
    };

    /* ---------- palet efek, latar, label ---------- */
    const _drawIce = draw;
    draw = function () {
      if (iceOn()) {
        if (!IB)
          iceBuild();
        if (room < 2)
          BG = IB[room];
        else {
          if (!IBB)
            iceBuildBoss();
          BG = IBB;
        }
      }
      const on = iceR();
      if (on != ecIce) {
        ecIce = on;
        Object.assign(EC, on ? EC_I : EC_O);
        Object.keys(SPC_I).forEach(k => { SPC[k] = on ? SPC_I[k] : SPC_O[k]; SPH[k] = on ? SPH_I[k] : SPH_O[k]; });
      }
      _drawIce();
      if (chillT > 0 && p && iceOn()) {
        try {
          g.font = '9px monospace';
          txt('❄ MEMBEKU', W - 10, 72, '#8fe0ff', 'right');
        } catch (e) { }
      }
    };

    /* ---------- statistik: skeleton tebal, golem lambat & tebal, mage rapuh; Glacier Crypt (room 1) lebih kuat ---------- */
    const _spawnI = spawn;
    spawn = function () {
      _spawnI();
      if (!iceR())
        return;
      const m = room ? 1.2 : 1;
      es.forEach(e => {
        if (e.mini)
          return;
        if (e.k == 'slime') {
          e.sp *= 1.05;
          e.r = 10;
          e.ht = 42;
          e.hp = e.mhp = Math.round(e.hp * 1.35 * m);
        } else if (e.k == 'skel') {
          e.sp *= .8;
          e.r = 10;
          e.ht = 44;
          e.hp = e.mhp = Math.round(e.hp * 1.25 * m);
        } else if (e.k == 'mage') {
          e.hp = e.mhp = Math.round(e.hp * .95 * m);
        }
      });
    };

    /* ---------- hancur jadi pecahan es ---------- */
    const _burstI = burst;
    burst = function (e) {
      _burstI(e);
      if (!iceR() || !e || e.mini || e.k == 'boss')
        return;
      const x = e.x, y = e.y - 6;
      fx.push({ k: 'ring', x, y: y + 6, r: 30, w: 3, life: .35, max: .35, col: '#bfeaff' });
      for (let i = 0; i < 14; i++) {
        const a = R() * 6.283, v = 40 + R() * 110;
        dp.push({
          k: 'sh', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .7 - 40, rot: a, vr: (R() - .5) * 12, life: .7 + R() * .5, max: 1.2, s: 2 + R() * 2.4, c: '190,235,255'
        });
      }
      for (let i = 0; i < 10; i++) {
        const a = R() * 6.283, v = 20 + R() * 80;
        dp.push({
          k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: .5 + R() * .5, max: 1, s: 1.5, c: i % 2 ? '#e8fbff' : '#8fd0f0'
        });
      }
    };

    /* ---------- membeku: kena damage di ruangan es -> melambat ---------- */
    const _hurtI = hurt;
    hurt = function (d) {
      const h0 = p ? p.hp : 0; _hurtI(d); if (p && iceR() && p.hp < h0 && p.dead <= 0)
        chill(2);
    };

    /* ---------- hantaman golem (area + zona beku), pecahan es Ice Mage, zona beku sisa ---------- */
    const _updI = upd;
    upd = function (dt) {
      if (room != izRoom || !iceOn()) {
        IZ = [];
        izRoom = room;
      }
      const sl = iceR() ? es.filter(e => e.k == 'skel' && !e.mini && e.wind > 0 && e.sw <= 0).map(e => [e, e.tx, e.ty]) : [];
      _updI(dt);
      if (!iceOn()) {
        chillT = 0;
        window.CHILLM = 1;
        return;
      }
      window.CHILLM = chillT > 0 ? .7 : 1;
      if (p && p.dead > 0)
        chillT = 0;
      else if (chillT > 0 && p) {
        chillT -= dt;
        if (R() < dt * 18)
          dp.push({
            k: 'p', x: p.x + (R() - .5) * 10, y: p.y + (R() - .5) * 12, vx: (R() - .5) * 10, vy: 6 + R() * 10, life: .5, max: .5, s: 1.5, c: '#d6f6ff'
          });
      }
      if (!iceR() || !p)
        return;
      fx.forEach(f => {
        if (f.k == 'ring' && f.col == '#f55')
          f.col = '#8fe0ff';
        else if (f.k == 'muzz' && f.col == '#e6c98e')
          f.col = '#aeeaff';
      });
      sl.forEach(([e, x, y]) => {
        if (e.wind <= 0 && !(e.stun > 0)) {
          IZ.push({ x, y, r: room ? 56 : 48, life: room ? 4 : 3 });
          fx.push({ k: 'ring', x, y, r: room ? 62 : 54, life: .35, max: .35, col: '#8fe0ff' }, { k: 'ring', x, y, r: room ? 40 : 34, w: 2, life: .25, max: .25, col: '#e8fbff' });
          for (let i = 0; i < 18; i++) {
            const a = R() * 6.283, v = 40 + R() * 90;
            dp.push({
              k: i % 3 ? 'p' : 'sh', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6 - 20, rot: a, vr: (R() - .5) * 12, life: .5 + R() * .4, max: .9, s: 1.5 + R() * 2, c: i % 3 ? (i % 2 ? '#e8fbff' : '#8fd0f0') : '190,235,255'
            });
          }
          shake = Math.max(shake, 5);
          if (p.dead <= 0 && Math.hypot(p.x - x, p.y - y) < (room ? 50 : 44) + p.r)
            hurt(16);
        }
      });
      pr.filter(b => b.own == 'e' && !b.ic).forEach(b => {
        b.ic = 1;
        b.col = '#aeeaff';
        b.r = 3.5;
        b.d = Math.round(b.d * 1.1);
        if (room) {
          const a = Math.atan2(b.vy, b.vx), s = Math.hypot(b.vx, b.vy);
          [-.3, .3].forEach(o => pr.push({ ...b, vx: Math.cos(a + o) * s, vy: Math.sin(a + o) * s, d: Math.round(b.d * .75), ic: 1 }));
        }
      });
      pr.forEach(b => {
        if (b.own == 'e' && b.ic && R() < dt * 40)
          dp.push({
            k: 'p', x: b.x, y: b.y, vx: (R() - .5) * 10, vy: -4 - R() * 8, life: .3, max: .3, s: 1.5, c: R() < .5 ? '#e8fbff' : '#8fd0f0'
          });
      });
      IZ = IZ.filter(z => (z.life -= dt) > 0);
      IZ.forEach(z => {
        if (R() < dt * 16)
          dp.push({
            k: 'p', x: z.x + (R() - .5) * z.r * 1.4, y: z.y + (R() - .5) * z.r, vx: 0, vy: -14 - R() * 16, life: .5, max: .5, s: 1.5, c: '#d6f6ff'
          }); if (p && p.dead <= 0 && p.dod <= 0 && Math.hypot(p.x - z.x, (p.y - z.y) * 1.3) < z.r) {
            hurt(3);
            chill(1.2);
          }
      });
    };

    /* ---------- efek lingkungan: kilau kristal, salju turun, telegraf golem, zona beku, peluru es, aura beku ---------- */
    const _envFxI = envFx;
    envFx = function () {
      _envFxI();
      if (!iceOn())
        return;
      g.save();
      g.globalCompositeOperation = 'lighter';
      (ICR[room] || []).forEach(([x, y], i) => { const a = .14 + .08 * Math.sin(t * 2 + i * 1.9), q = g.createRadialGradient(x, y, 2, x, y, 26); q.addColorStop(0, 'rgba(140,215,255,' + a * 2 + ')'); q.addColorStop(1, 'rgba(80,160,255,0)'); g.fillStyle = q; g.fillRect(x - 26, y - 26, 52, 52); });
      g.restore();
      g.save();
      for (let i = 0; i < 48; i++) {
        const sx = ((i * 97.31 + Math.sin(t * .7 + i) * 12) % DW + DW) % DW, sy = (t * (12 + (i % 5) * 5) + i * 53.7) % DH;
        g.fillStyle = 'rgba(236,248,255,' + (.35 + .4 * ((i % 4) / 3)) + ')';
        g.fillRect(sx, sy, i % 3 ? 1 : 2, i % 3 ? 1 : 2);
      }
      g.restore();
      if (!iceR())
        return;
      es.forEach(e => {
        if (e.k == 'skel' && !e.mini && e.wind > 0 && e.sw <= 0) {
          const k = 1 - e.wind / .6, R0 = room ? 50 : 44;
          g.save();
          g.strokeStyle = 'rgba(190,240,255,' + (.4 + .4 * k) + ')';
          g.lineWidth = 1.5;
          g.setLineDash([4, 4]);
          g.lineDashOffset = -t * 20;
          g.beginPath();
          g.arc(e.tx, e.ty, R0 * (.6 + .4 * k), 0, 7);
          g.stroke();
          g.setLineDash([]);
          g.fillStyle = 'rgba(200,245,255,' + (.25 + .5 * k) + ')';
          for (let i = 0; i < 8; i++) {
            const a = i * .785 + .3, rr = R0 * .8, x = e.tx + Math.cos(a) * rr, y = e.ty + Math.sin(a) * rr * .75, h = 3 + k * 10;
            g.beginPath();
            g.moveTo(x - 2, y);
            g.lineTo(x, y - h);
            g.lineTo(x + 2, y);
            g.closePath();
            g.fill();
          }
          g.restore();
        }
      });
      IZ.forEach(z => {
        const k = Math.min(1, z.life / .6), pu = .75 + .25 * Math.sin(t * 8);
        g.save();
        g.globalCompositeOperation = 'lighter';
        const q = g.createRadialGradient(z.x, z.y, 2, z.x, z.y, z.r);
        q.addColorStop(0, 'rgba(200,245,255,' + .5 * k * pu + ')');
        q.addColorStop(.6, 'rgba(90,170,255,' + .35 * k + ')');
        q.addColorStop(1, 'rgba(40,90,200,0)');
        g.fillStyle = q;
        g.save();
        g.translate(z.x, z.y);
        g.scale(1, .75);
        g.translate(-z.x, -z.y);
        g.beginPath();
        g.arc(z.x, z.y, z.r, 0, 7);
        g.fill();
        g.restore();
        g.restore();
        g.fillStyle = 'rgba(215,248,255,' + .7 * k + ')';
        for (let i = 0; i < 10; i++) {
          const a = i * .628 + z.x, rr = z.r * .7, x = z.x + Math.cos(a) * rr, y = z.y + Math.sin(a) * rr * .75;
          g.beginPath();
          g.moveTo(x - 1.6, y);
          g.lineTo(x, y - 6 - (i % 3) * 2);
          g.lineTo(x + 1.6, y);
          g.closePath();
          g.fill();
        }
      });
      pr.forEach(b => {
        if (b.own == 'e' && b.ic) {
          iceGlow(b.x, b.y, 11, .6);
          g.save();
          g.translate(b.x, b.y);
          g.rotate(Math.atan2(b.vy, b.vx));
          g.fillStyle = '#e8fbff';
          g.beginPath();
          g.moveTo(6, 0);
          g.lineTo(0, 2.4);
          g.lineTo(-5, 0);
          g.lineTo(0, -2.4);
          g.closePath();
          g.fill();
          g.restore();
        }
      });
      if (p && chillT > 0)
        iceGlow(p.x, p.y - 6, 22, .3 + .12 * Math.sin(t * 10));
    };
    /* ===== Bos Level 2: MORVATH — 3 bentuk (Titan Batu → Titan Magma → Raja Inferno), tanpa summon ===== */
    const LFORMS = ['TITAN BATU', 'TITAN MAGMA', 'RAJA INFERNO'];
    const _emBL = EM.boss;
    EM.boss = function lavaBossDraw(pp, at, tm) {
      if (!(lavaOn() && room == 2))
        return _emBL(pp, at, tm);
      const e = BOSS_E || {}, fl = !!MT, F = c => fl ? '#fff' : c, ez = q => 1 - (1 - q) * (1 - q), cl = (v, a, b) => Math.max(a, Math.min(b, v)), dir = Math.cos(e.ca || 0) < 0 ? -1 : 1, pu = .5 + .5 * Math.sin(tm * 3.2);
      const mk0 = e.s2 == 'morph' && e.mtx ? 1 - e.mt / e.mtx : -1, f = mk0 >= 0 && mk0 < .55 ? Math.max(1, BOSS.ph - 1) : (BOSS.ph || 1);
      const pal = [['#150e0e', '#2e2120', '#54423b'], ['#0d0506', '#2a1313', '#6c2f22'], ['#040102', '#1b0707', '#3d1610']][f - 1], D = pal[0], M = pal[1], Lt = pal[2], LA = '#ff7a1f', LY = '#ffd34d', LR = f == 3 ? '#e01808' : '#c8300f';
      let up = 0, spread = 0, lean = 0, core = 0, sy = 1 + Math.sin(tm * 2) * .01, sx = 1, al = 1;
      const k = e.atk;
      if (e.s2 == 'wind' && at) {
        const q = ez(pp);
        if (k == 'geyser')
          up = pp < .8 ? ez(pp / .8) * .8 : .8 * (1 - (pp - .8) / .2);
        else if (k == 'orbs') {
          spread = q;
          core = q * 1.4;
        } else if (k == 'tide') {
          up = .4 * q;
          lean = dir * .08 * q;
        } else if (k == 'meteor') {
          up = .95 * q;
          core = q * 1.2;
        } else if (k == 'ring') {
          spread = q;
          core = q * 1.8;
          sy *= 1 + .03 * q;
        } else if (k == 'beam') {
          spread = .8 * q;
          core = q * 2;
        } else if (k == 'blink') {
          al = 1 - .85 * q;
          sy *= 1 - .05 * q;
        }
      } else if (e.s2 == 'act') {
        spread = .6;
        core = 2;
      } else if (e.s2 == 'rest' && e.atk == 'blink')
        al = cl(1 - e.tm / .5, .2, 1);
      let jx = 0, sc = 1;
      if (mk0 >= 0) {
        jx = (R() - .5) * 10 * mk0;
        core += 2.2 * mk0;
        if (mk0 > .55)
          sc = 1 + .22 * (1 - (mk0 - .55) / .45);
      }
      core += (f - 1) * .4;
      const gl = .55 + pu * .25 + core * .4;
      const poly = (pts, c) => { g.fillStyle = F(c); g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill(); };
      const oct = (x, y, r, c) => poly([0, 1, 2, 3, 4, 5, 6, 7].map(i => [x + Math.cos(i * .7854 + .39) * r, y + Math.sin(i * .7854 + .39) * r * .92]), c);
      const crack = (pts, w) => {
        if (fl)
          return; g.lineCap = g.lineJoin = 'round'; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.strokeStyle = LR; g.lineWidth = w + 2; g.stroke(); g.strokeStyle = LA; g.lineWidth = w; g.stroke(); g.strokeStyle = 'rgba(255,220,110,' + (.45 + .5 * pu) + ')'; g.lineWidth = w * .4; g.stroke();
      };
      g.save();
      g.globalAlpha = al;
      g.translate(320 + jx, 333);
      g.rotate(lean);
      const SS = [.8, .88, .98][f - 1] * sc;
      g.scale(SS * sx, SS * sy);
      g.translate(-320, -333);
      const hv = 30 + Math.sin(tm * 2.2) * 5, by = 292 - hv;
      if (!fl) {
        g.save();
        g.translate(320, 333);
        g.scale(1, .3);
        lavaGlow(0, 0, 110 + f * 20, .55 + .2 * pu, f == 3 ? '255,60,20' : '255,110,30');
        g.restore();
        const rk = (tm * .9) % 1;
        g.strokeStyle = 'rgba(255,150,50,' + (1 - rk) * .7 + ')';
        g.lineWidth = 3;
        g.beginPath();
        g.ellipse(320, 333, 20 + rk * 70, 6 + rk * 20, 0, 0, 7);
        g.stroke();
        const jg = g.createLinearGradient(0, by, 0, 333);
        jg.addColorStop(0, 'rgba(255,235,130,.95)');
        jg.addColorStop(.5, 'rgba(255,100,20,.75)');
        jg.addColorStop(1, 'rgba(200,30,0,.25)');
        g.fillStyle = jg;
        g.beginPath();
        g.moveTo(296, by);
        g.lineTo(344, by);
        g.lineTo(378 + Math.sin(tm * 9) * 5, 333);
        g.lineTo(262 + Math.sin(tm * 8) * 5, 333);
        g.closePath();
        g.fill();
        for (let i = -3; i <= 3; i++)
          lavaFlame(320 + i * 16, 333, 9, 30 + (Math.sin(tm * 8 + i * 2) + 1) * 14 + (3 - Math.abs(i)) * 8, LR, LY, i);
        for (let i = 0; i < 12; i++) {
          const x = 320 + Math.sin(tm * 2.3 + i * 1.9) * (28 + i * 4), y = 333 - ((tm * 55 + i * 29) % (hv + 50));
          g.fillStyle = i % 2 ? LY : LA;
          g.fillRect(x, y, 2, 3);
        }
      }
      g.save();
      g.translate(0, -hv);
      const spk = (x, y, a, L, w, c) => poly([
        [x + Math.cos(a + 1.5708) * w, y + Math.sin(a + 1.5708) * w], [x + Math.cos(a) * L, y + Math.sin(a) * L], [x + Math.cos(a - 1.5708) * w, y + Math.sin(a - 1.5708) * w]
      ], c);
      const horn = (x0, y0, x1, y1, x2, y2, w, c) => {
        const P = [], Q = []; for (let i = 0; i <= 8; i++) {
          const u = i / 8, v = 1 - u, x = v * v * x0 + 2 * v * u * x1 + u * u * x2, y = v * v * y0 + 2 * v * u * y1 + u * u * y2, dx = 2 * v * (x1 - x0) + 2 * u * (x2 - x1), dy = 2 * v * (y1 - y0) + 2 * u * (y2 - y1), l = Math.hypot(dx, dy) || 1, ww = w * (1 - u * .96) / 2;
          P.push([x - dy / l * ww, y + dx / l * ww]);
          Q.push([x + dy / l * ww, y - dx / l * ww]);
        } poly(P.concat(Q.reverse()), c);
      };
      const BONE = '#e2d6b8';
      /* aura kegelapan di belakang bos */
      if (!fl && f >= 2) {
        g.save();
        const da = g.createRadialGradient(320, 230, 30, 320, 230, 250);
        da.addColorStop(0, 'rgba(10,0,0,' + (f == 3 ? .55 : .35) + ')');
        da.addColorStop(1, 'rgba(10,0,0,0)');
        g.fillStyle = da;
        g.beginPath();
        g.arc(320, 230, 250, 0, 7);
        g.fill();
        g.restore();
      }
      lavaGlow(320, 230, 190 + f * 25 + (mk0 >= 0 ? 90 * mk0 : 0), .22 + .12 * gl + (mk0 >= 0 ? .3 * mk0 : 0), f == 3 ? '255,60,20' : '255,140,40');
      if (mk0 > .5 && mk0 < .66)
        lavaGlow(320, 220, 320, 1 - Math.abs(mk0 - .58) * 12, '255,240,200');
      if (f == 3 && !fl)
        for (let i = 0; i < 9; i++) {
          const k2 = (tm * .35 + i / 9) % 1;
          g.fillStyle = 'rgba(15,0,0,' + (.42 * (1 - k2)) + ')';
          g.beginPath();
          g.arc(320 + Math.sin(i * 2.1 + tm) * 95, 270 - k2 * 230, 14 + k2 * 22, 0, 7);
          g.fill();
        }
      if (f == 3 && !fl)
        for (const s of [-1, 1]) { /* sayap api bertulang (kelelawar iblis) */
          const wv = Math.sin(tm * 3) * 8, tips = [[222, 38 + wv], [272, 92 + wv * .6], [268, 160], [230, 228]];
          g.save();
          g.globalCompositeOperation = 'lighter';
          g.fillStyle = 'rgba(255,40,10,.5)';
          g.beginPath();
          g.moveTo(320 + s * 70, 172);
          tips.forEach(q => g.lineTo(320 + s * q[0], q[1]));
          g.lineTo(320 + s * 70, 256);
          g.closePath();
          g.fill();
          g.fillStyle = 'rgba(255,150,40,.4)';
          g.beginPath();
          g.moveTo(320 + s * 70, 190);
          tips.forEach(q => g.lineTo(320 + s * (q[0] * .72 + 20), q[1] * .8 + 40));
          g.lineTo(320 + s * 70, 240);
          g.closePath();
          g.fill();
          g.restore();
          g.lineCap = 'round';
          tips.forEach(q => { const ex = 320 + s * q[0], dx = s * (q[0] - 84), dy = q[1] - 176; g.strokeStyle = D; g.lineWidth = 7; g.beginPath(); g.moveTo(320 + s * 84, 176); g.quadraticCurveTo(320 + s * (q[0] * .6 + 34), (176 + q[1]) / 2 - 22, ex, q[1]); g.stroke(); spk(ex, q[1], Math.atan2(dy, dx), 22, 5, D); });
          tips.forEach((q, i) => lavaFlame(320 + s * q[0], q[1] + 26, 8, 34 + i * 4, LR, LY, i + s));
        }
      /* duri punggung */
      for (let i = -3; i <= 3; i++) {
        const L = (30 + f * 16 - Math.abs(i) * 5) * (1 + (f == 3 ? .15 * Math.sin(tm * 4 + i) : 0)), a = -1.5708 + i * .2, bx = 320 + i * 30, by0 = 176 - Math.abs(i) * 2;
        spk(bx, by0, a, L, 9 + f, D);
        if (!fl && f >= 2)
          lavaFlame(bx + Math.cos(a) * L, by0 + Math.sin(a) * L + 4, 3, 8 + f * 3, LR, LY, i);
      }
      poly([[240, 168], [400, 168], [380, 268], [260, 268]], M);
      poly([[250, 172], [390, 172], [386, 194], [254, 194]], Lt);
      for (const s of [-1, 1]) {
        spk(320 + s * 58, 172, s > 0 ? -.75 : -2.39, 20 + f * 8, 6, D);
        spk(320 + s * 62, 246, s > 0 ? .5 : 2.64, 20 + f * 9, 7, D);
      }
      if (f >= 2) { /* dada terbuka: tulang rusuk di atas lava */
        poly([[268, 194], [372, 194], [362, 258], [278, 258]], f == 3 ? '#ff2a08' : '#ff5a1f');
        g.lineCap = 'round';
        g.strokeStyle = F(D);
        g.lineWidth = 5;
        g.beginPath();
        g.moveTo(320, 194);
        g.lineTo(320, 258);
        g.stroke();
        for (let i = 0; i < 4; i++) {
          const ry = 202 + i * 13;
          for (const s of [-1, 1]) {
            g.beginPath();
            g.moveTo(320, ry);
            g.quadraticCurveTo(320 + s * 34, ry - 8, 320 + s * (46 - i * 2), ry + 6);
            g.stroke();
          }
        }
        if (f == 3) {
          for (let i = 0; i < 7; i++)
            spk(272 + i * 16, 194, 1.5708, 13 + (i % 2) * 7, 6, BONE);
          for (let i = 0; i < 6; i++)
            spk(280 + i * 16, 258, -1.5708, 11 + (i % 2) * 7, 6, BONE);
        }
        if (!fl)
          for (let i = 0; i < 4; i++) {
            g.fillStyle = LA;
            g.fillRect(288 + i * 18, 258 + ((tm * 45 + i * 20) % 38), 2, 5);
          }
      } else {
        poly([[262, 200], [378, 200], [366, 258], [274, 258]], D);
        crack([[320, 224], [290, 205], [274, 208]], 3);
        crack([[320, 224], [352, 210], [368, 214]], 3);
        crack([[320, 224], [300, 250], [288, 256]], 3);
        crack([[320, 224], [342, 248], [352, 258]], 3);
        crack([[300, 200], [312, 214]], 2);
        crack([[342, 200], [330, 216]], 2);
      }
      g.save();
      g.globalCompositeOperation = 'lighter';
      const cr = 22 + pu * 3 + core * 5, cg = g.createRadialGradient(320, 224, 2, 320, 224, cr * 2);
      cg.addColorStop(0, 'rgba(255,240,170,' + Math.min(1, .9 * gl) + ')');
      cg.addColorStop(.4, 'rgba(255,110,30,.6)');
      cg.addColorStop(1, 'rgba(200,30,0,0)');
      if (!fl) {
        g.fillStyle = cg;
        g.beginPath();
        g.arc(320, 224, cr * 2, 0, 7);
        g.fill();
      }
      g.restore();
      oct(320, 224, cr * .6, LR);
      oct(320, 224, cr * .42, LA);
      oct(320, 224, cr * .22, LY);
      poly([[262, 262], [378, 262], [372, 292], [268, 292]], D);
      oct(320, 277, 8, LA);
      oct(320, 277, 4, LY);
      poly([[272, 290], [368, 290], [338, 318], [320, 332], [302, 318]], D);
      crack([[320, 292], [318, 308], [320, 324]], 3);
      for (let i = 0; i < 2 + f; i++) { /* batu / tengkorak mengorbit */
        const a = tm * 1.5 + i * 6.283 / (2 + f), ox = 320 + Math.cos(a) * 74, oy = 312 + Math.sin(a) * 9, r0 = 7 - Math.sin(a) * 1.5;
        if (f >= 2) {
          oct(ox, oy, r0 * 1.25, '#cfc3a6');
          g.fillStyle = F('#1a0606');
          g.fillRect(ox - r0 * .7, oy - 2, r0 * .5, 3);
          g.fillRect(ox + r0 * .2, oy - 2, r0 * .5, 3);
          if (!fl)
            lavaGlow(ox, oy, 13, .3, '255,90,20');
        } else
          oct(ox, oy, r0, i % 2 ? M : Lt);
      }
      if (f == 3)
        for (const s of [-1, 1]) { /* lengan kecil tambahan */
          const ex = 320 + s * (56 + Math.sin(tm * 3) * 3), ey = 252 + Math.cos(tm * 2.5) * 4;
          g.lineCap = 'round';
          g.strokeStyle = F(D);
          g.lineWidth = 16;
          g.beginPath();
          g.moveTo(320 + s * 34, 214);
          g.lineTo(ex, ey);
          g.stroke();
          g.strokeStyle = F(M);
          g.lineWidth = 9;
          g.stroke();
          for (let c = -1; c <= 1; c++)
            spk(ex + s * 4, ey + c * 7, c * .5 + (s > 0 ? 0 : Math.PI), 22, 3.5, '#ffe9b0');
          spk(320 + s * 44, 228, s > 0 ? -.9 : -2.24, 16, 5, D);
        }

      /* ===== KEPALA ===== */
      const ec = f == 1 ? LY : f == 2 ? '#ffb020' : '#fff0c0', gc = f == 3 ? '255,30,20' : f == 2 ? '255,110,20' : '255,200,60';
      poly([[290, 152], [296, 126], [344, 126], [350, 152], [346, 174], [294, 174]], M);
      poly([[288, 138], [352, 138], [344, 154], [320, 150], [296, 154]], D);
      if (f == 3) {
        oct(320, 133, 6, '#2a0505');
        if (!fl) {
          lavaGlow(320, 133, 14, .95, '255,50,30');
          g.fillStyle = '#fff';
          g.fillRect(318, 131, 4, 4);
        }
      }
      poly([[296, 146], [318, 151], [317, 164], [297, 159]], '#050102');
      poly([[344, 146], [322, 151], [323, 164], [343, 159]], '#050102');
      poly([[298, 149], [317, 156], [314, 161], [299, 158]], ec);
      poly([[342, 149], [323, 156], [326, 161], [341, 158]], ec);
      if (!fl) {
        lavaGlow(307, 154, 15 + f * 2, .9, gc);
        lavaGlow(333, 154, 15 + f * 2, .9, gc);
        if (f == 3)
          for (const s of [-1, 1]) {
            g.save();
            g.globalCompositeOperation = 'lighter';
            g.fillStyle = 'rgba(255,40,20,.35)';
            g.beginPath();
            g.moveTo(320 + s * 8, 154);
            g.lineTo(320 + s * (34 + 8 * pu), 146);
            g.lineTo(320 + s * (40 + 8 * pu), 160);
            g.closePath();
            g.fill();
            g.restore();
          }
      }
      poly([[316, 161], [324, 161], [320, 170]], '#050102');
      spk(291, 160, 2.7, 12 + f * 4, 5, D);
      spk(349, 160, .44, 12 + f * 4, 5, D);
      if (f == 1) { /* rahang batu bergigi runcing */
        poly([[296, 168], [344, 168], [338, 190], [302, 190]], D);
        poly([[302, 172], [338, 172], [334, 186], [306, 186]], '#8a1e0a');
        for (let i = 0; i < 6; i++) {
          spk(304 + i * 6.4, 172, 1.5708, 7 + (i % 2) * 3, 3, BONE);
          spk(304 + i * 6.4, 186, -1.5708, 6, 3, BONE);
        }
        if (!fl)
          lavaGlow(320, 180, 16, .5, '255,90,20');
        crack([[320, 130], [316, 140], [322, 146]], 2);
      } else if (f == 2) { /* rahang terbuka, lava menetes */
        poly([[294, 168], [346, 168], [342, 198], [298, 198]], D);
        poly([[301, 172], [339, 172], [335, 196], [305, 196]], '#ff5a1f');
        for (let i = 0; i < 6; i++) {
          spk(303 + i * 6.2, 172, 1.5708, 9 + (i % 2) * 4, 3.4, BONE);
          spk(305 + i * 6, 196, -1.5708, 8 + (i % 2) * 3, 3.4, BONE);
        }
        if (!fl) {
          lavaGlow(320, 184, 20, .6, '255,100,20');
          for (let i = 0; i < 3; i++) {
            g.fillStyle = LA;
            g.fillRect(306 + i * 14, 198 + ((tm * 50 + i * 13) % 26), 2, 5);
          }
        }
      } else { /* RAJA INFERNO: rahang menganga, taring panjang */
        poly([[290, 166], [350, 166], [352, 214], [288, 214]], D);
        poly([[298, 170], [342, 170], [346, 210], [294, 210]], '#ff2a08');
        poly([[308, 178], [332, 178], [334, 204], [306, 204]], '#ffb020');
        for (let i = 0; i < 7; i++)
          spk(299 + i * 6.8, 170, 1.5708, 12 + (i % 2) * 6, 3.6, BONE);
        spk(300, 170, 1.45, 26, 4.6, BONE);
        spk(340, 170, 1.69, 26, 4.6, BONE);
        for (let i = 0; i < 6; i++)
          spk(300 + i * 8, 210, -1.5708, 12 + (i % 2) * 5, 3.8, BONE);
        if (!fl) {
          lavaGlow(320, 190, 26, .7, '255,60,20');
          for (let i = 0; i < 4; i++) {
            g.fillStyle = LA;
            g.fillRect(300 + i * 13, 214 + ((tm * 60 + i * 17) % 40), 3, 7);
          }
        }
      }
      /* tanduk melengkung */
      const HN = [
        [[22, 134, 58, 128, 50, 84, 15]], [[22, 134, 64, 128, 70, 74, 17], [28, 150, 60, 154, 76, 128, 10]], [[20, 132, 74, 126, 60, 50, 19], [26, 146, 84, 154, 102, 108, 12], [30, 160, 70, 170, 92, 162, 8]]
      ][f - 1];
      for (const s of [-1, 1]) {
        const X = d => 320 + s * d;
        HN.forEach(h => { horn(X(h[0]), h[1], X(h[2]), h[3], X(h[4]), h[5], h[6] + 5, D); horn(X(h[0]), h[1], X(h[2]), h[3], X(h[4]), h[5], h[6], Lt); });
        if (!fl && f >= 2)
          lavaFlame(X(HN[0][4]), HN[0][5] + 6, 6, 14 + f * 4, LR, LY, s);
      }
      if (f == 3)
        for (let i = 0; i < 5; i++)
          spk(300 + i * 10, 128, -1.5708 + (i - 2) * .14, 26 + (i == 2 ? 18 : 0) - Math.abs(i - 2) * 4, 6, Lt);
      if (!fl) {
        lavaFlame(320, 128, 18 + f * 3, 44 + f * 14, LR, LY, 1);
        lavaFlame(304, 130, 9, 26 + f * 8, LA, LY, 2);
        lavaFlame(336, 130, 9, 26 + f * 8, LA, LY, 3);
      }
      const U = cl(up, -.3, 1);
      for (const s of [-1, 1]) {
        const sx0 = 320 + s * 100, sy0 = 205, fx = 320 + s * (112 - 46 * U + 26 * spread), fy = 300 - 190 * U - 40 * spread;
        g.lineCap = 'round';
        g.strokeStyle = F(D);
        g.lineWidth = 44;
        g.beginPath();
        g.moveTo(sx0, sy0);
        g.lineTo(fx, fy - 10);
        g.stroke();
        g.strokeStyle = F(M);
        g.lineWidth = 30;
        g.stroke();
        crack([[sx0 + s * 2, sy0 + 20], [(sx0 + fx) / 2 + s * 4, (sy0 + fy) / 2], [fx - s * 2, fy - 24]], 3);
        oct(fx, fy, 27, D);
        oct(fx, fy, 20, M);
        crack([[fx - 14, fy + 2], [fx, fy + 8], [fx + 14, fy + 1]], 3);
        const aa = Math.atan2(fy - 10 - sy0, fx - sx0), px = Math.cos(aa), py = Math.sin(aa), cc = f == 1 ? Lt : f == 2 ? BONE : '#ffe9b0';
        for (let c = -1; c <= 1; c++)
          spk(fx + px * 20 - py * c * 11, fy + py * 20 + px * c * 11, aa + c * .25, 15 + f * 7, 4.5, cc);
        for (let c = -1; c <= 1; c++)
          spk(fx - px * 18 - py * c * 13, fy - py * 18 + px * c * 13, aa + Math.PI + c * .5, 8 + f * 5, 4.5, D);
        if (!fl) {
          if (f >= 2)
            lavaFlame(fx, fy - 20, 10, 18 + f * 6, LR, LY, s + 5);
          for (let i = 0; i < 2; i++) {
            const dy = (tm * 40 + i * 17 + (s > 0 ? 9 : 0)) % 30;
            g.fillStyle = LA;
            g.fillRect(fx - 8 + i * 12, fy + 20 + dy, 2, 4);
          }
        }
      }
      for (const s of [-1, 1]) {
        const cx = 320 + s * 92, cy = 182;
        oct(cx, cy, 42, D);
        oct(cx, cy, 33, M);
        (f == 3 ? [-.8, -.35, .1, .55] : [-.35, .1, .55]).forEach(a0 => { const a = -1.57 + s * (a0 + .25), bx = cx + Math.cos(a) * 34, by2 = cy + Math.sin(a) * 34, L2 = 38 + (f - 1) * 20; poly([[bx - 9, by2 + 4], [bx + Math.cos(a) * L2, by2 + Math.sin(a) * L2], [bx + 9, by2 + 4]], Lt); });
        crack([[cx - 22, cy + 6], [cx - 4, cy - 2], [cx + 8, cy + 10], [cx + 24, cy + 2]], 3);
        if (!fl && f >= 2)
          lavaFlame(cx, cy - 34, 8, 16 + f * 6, LR, LY, s + 9);
      }
      g.restore();
      g.restore();
    };
    /* ---- AI bos lava: setiap bentuk punya skill sendiri (BUKAN skill Minotaur) ---- */
    let LH = [], LQ = [], LBEAM = null;
    const lcl = (v, a, b) => Math.max(a, Math.min(b, v));
    const lhAdd = (x, y, r, t0, d, pool) => LH.push({ x: lcl(x, 34, DW - 34), y: lcl(y, 34, DH - 34), r, t: t0, mx: t0, d, pool });
    const lfire = (e, a, sp, d) => pr.push({
      x: e.x, y: e.y - 18, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, d, r: 3.5, col: '#ff6a1f', own: 'e', life: 4, rock: 1, lv: 1, rot: 0, vr: 0, sd: R() * 50
    });
    const lseg = (px, py, x, y, a, len) => { const dx = Math.cos(a), dy = Math.sin(a), q = lcl((px - x) * dx + (py - y) * dy, 0, len); return Math.hypot(px - (x + dx * q), py - (y + dy * q)); };

    function lavaMorph(e, ph) {
      msg(ph == 2 ? 'Bentuk 2 — TITAN MAGMA! Batu retak, lava menyembur dari tubuhnya!' : 'Bentuk Akhir — RAJA INFERNO bangkit!');
      SFX.wave();
      SFX.bossVo('lava', 'phase', ph);
      FLSH = 1;
      FLSC = '255,110,20';
      shake = Math.max(shake, 12);
      HST = Math.max(HST, .15);
      fx.push({ k: 'ring', x: e.x, y: e.y, r: 60, w: 5, life: .6, max: .6, col: '#ff8a2a' }, { k: 'gl', x: e.x, y: e.y, r: 130, c: '255,120,30', life: .5, max: .5 });
      BOSS.hz = [];
      BOSS.q = [];
      LH = [];
      LQ = [];
      LBEAM = null;
      pr = pr.filter(b => b.own != 'e');
      e.s2 = 'morph';
      e.mt = e.mtx = ph == 2 ? 1.9 : 2.6;
      e.atk = null;
      e.an = 0;
    }

    function lavaBossTick(e, dt) {
      const B = BOSS;
      e.fl -= dt;
      e.vx = e.vy = 0;
      e.stg = 0;
      e.stun = 0;
      if (p.dead > 0 || B.dead) {
        e.an = 0;
        return;
      }
      const rt = e.hp / e.mhp, ph = rt > .6 ? 1 : rt > .3 ? 2 : 3;
      if (ph > B.ph) {
        B.ph = ph;
        lavaMorph(e, ph);
        return;
      }
      if (B.intro > 0) {
        B.intro -= dt;
        return;
      }
      if (e.s2 == 'morph') {
        e.mt -= dt;
        e.an = 0;
        const k = 1 - e.mt / e.mtx;
        if (R() < dt * 50) {
          const a = R() * 6.283;
          dp.push({
            k: 'f', o: 1, x: e.x + Math.cos(a) * 30, y: e.y - 20 + Math.sin(a) * 30, vx: Math.cos(a) * 50, vy: Math.sin(a) * 50 - 20, life: .5, max: .5, s: 3 + R() * 3
          });
        }
        if (R() < dt * 5) {
          shake = Math.max(shake, 4 + k * 5);
          SFX.boom(14);
        }
        if (e.mt <= 0) {
          SFX.slam();
          shake = Math.max(shake, 11);
          FLSH = .8;
          FLSC = '255,150,40';
          fx.push({ k: 'ring', x: e.x, y: e.y, r: 96, w: 5, life: .45, max: .45, col: '#ff8a2a' }, { k: 'ring', x: e.x, y: e.y, r: 60, w: 3, life: .3, max: .3, col: '#ffd34d' });
          for (let i = 0; i < 26; i++) {
            const a = R() * 6.283, v = 50 + R() * 130;
            dp.push({
              k: 'p', x: e.x, y: e.y - 20, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: .5 + R() * .5, max: 1, s: 1.5 + R() * 2, c: i % 2 ? '#ffd34d' : '#ff5a1f'
            });
          }
          if (dist(e, p) < 96)
            hurt(14);
          e.s2 = 'rest';
          e.tm = .9;
          e.cd = 1;
        }
        return;
      }
      if (!e.s2)
        e.s2 = 'move';
      const d = dist(e, p), a = ang(e, p), f = B.ph, spd = e.sp * (1 + (f - 1) * .25);
      e.cd -= dt;
      if (e.s2 == 'move') {
        e.an = 0;
        e.ca = a;
        const want = f == 1 ? 115 : f == 2 ? 85 : 95;
        if (d > want + 10)
          mv(e, Math.cos(a) * spd * dt, Math.sin(a) * spd * dt);
        else if (d < want - 28)
          mv(e, -Math.cos(a) * spd * dt * .8, -Math.sin(a) * spd * dt * .8);
        if (f >= 2) {
          e.trT = (e.trT || 0) - dt;
          if (e.trT <= 0) {
            e.trT = .45;
            LZ.push({ x: e.x, y: e.y + 8, r: 20, life: 2.2 });
          }
        }
        if (e.cd <= 0) {
          const set = f == 1 ? (d > 150 ? ['geyser', 'orbs', 'tide'] : ['tide', 'geyser', 'orbs']) : f == 2 ? ['meteor', 'ring', 'tide', 'orbs'] : ['beam', 'blink', 'meteor', 'ring', 'beam'];
          let q = set[R() * set.length | 0];
          if (q == e.last)
            q = set[R() * set.length | 0];
          e.last = q;
          const dur = ({ geyser: .9, orbs: .7, tide: .8, meteor: .9, ring: .9, beam: 1.1, blink: .9 })[q] * (1 - (f - 1) * .06);
          e.s2 = 'wind';
          e.atk = q;
          e.tmx = e.tm = dur;
          e.hit = 0;
          SFX.warn(q == 'orbs' ? 1 : 0);
          SFX.bossVo('lava', q, f);
          if (q == 'geyser') {
            for (let i = 0; i < 3; i++)
              lhAdd(p.x + (i ? (R() - .5) * 150 : 0), p.y + (i ? (R() - .5) * 110 : 0), 34, .9 + i * .25, 18, 1);
          } else if (q == 'tide') {
            const lines = f == 2 ? [-.3, .3] : [0];
            lines.forEach(o => {
              for (let i = 0; i < 6; i++)
                lhAdd(e.x + Math.cos(a + o) * (36 + i * 34), e.y + Math.sin(a + o) * (36 + i * 34), 24, .7 + i * .1, 15, 0);
            });
          } else if (q == 'meteor') {
            const n = f == 2 ? 5 : 7;
            for (let i = 0; i < n; i++)
              lhAdd(p.x + (i ? (R() - .5) * 280 : 0), p.y + (i ? (R() - .5) * 220 : 0), f == 3 ? 36 : 32, .9 + i * .15, 17, 1);
          } else if (q == 'beam') {
            const sg = R() < .5 ? 1 : -1;
            LBEAM = { a0: a - sg * .9, dir: sg, t: 0, warn: dur, life: 1.7, w: 13, len: 440, bx: e.x, by: e.y - 24 };
          } else if (q == 'blink') {
            const dx = p.x - e.x, dy = p.y - e.y, dl = Math.hypot(dx, dy) || 1, s2 = freeSpot(lcl(p.x + dx / dl * 90, 40, DW - 40), lcl(p.y + dy / dl * 90, 40, DH - 40));
            e.tgt = s2;
            lhAdd(s2.x, s2.y, 52, dur + .15, 20, 1);
          }
        }
      } else if (e.s2 == 'wind') {
        e.tm -= dt;
        e.an = Math.max(.01, .6 * (e.tm / e.tmx));
        if (e.atk != 'blink' && e.tm > e.tmx * .35)
          e.ca = a;
        if (LBEAM) {
          LBEAM.bx = e.x;
          LBEAM.by = e.y - 24;
        }
        if (e.tm <= 0) {
          e.an = 0;
          const q = e.atk;
          if (q == 'orbs') {
            const n = (f == 1 ? 3 : f == 2 ? 5 : 7) + dfx().shots, b0 = Math.atan2(p.y - e.y, p.x - e.x);
            SFX.eshot();
            for (let i = 0; i < n; i++)
              lfire(e, b0 + (i - (n - 1) / 2) * .24, (95 + f * 15) * dfx().pv, 11 + f * 2);
            e.s2 = 'rest';
            e.tm = .6;
          } else if (q == 'ring') {
            const rings = f == 3 ? 3 : 2, g0 = Math.atan2(p.y - e.y, p.x - e.x);
            const ring = (off, gap) => {
              SFX.boom(16); fx.push({ k: 'ring', x: e.x, y: e.y - 18, r: 30, w: 3, life: .3, max: .3, col: '#ff8a2a' }); for (let i = 0; i < 18; i++) {
                const an = i / 18 * 6.283 + off;
                if (Math.abs(((an - gap) % 6.283 + 6.283 + 3.1416) % 6.283 - 3.1416) < .4)
                  continue;
                lfire(e, an, 85, 13);
              }
            };
            ring(0, g0);
            for (let r = 1; r < rings; r++)
              LQ.push({
                t: r * .55, f: () => {
                  if (es.includes(e) && p.dead <= 0)
                    ring(r * .17, g0 + r * 1.1);
                }
              });
            e.s2 = 'rest';
            e.tm = .7 + rings * .3;
          } else if (q == 'beam') {
            e.s2 = 'act';
            e.tm = LBEAM ? LBEAM.life : 1.5;
            SFX.boom(30);
            SFX.bossVo('lava', 'beamhold', f);
          } else if (q == 'blink') {
            if (e.tgt) {
              fx.push({ k: 'ring', x: e.x, y: e.y, r: 30, life: .3, max: .3, col: '#ff8a2a' });
              e.x = e.tgt.x;
              e.y = e.tgt.y;
              fx.push({ k: 'ring', x: e.x, y: e.y, r: 40, w: 3, life: .3, max: .3, col: '#ffd34d' });
              SFX.dodge();
            }
            e.s2 = 'rest';
            e.tm = .5;
          } else {
            e.s2 = 'rest';
            e.tm = q == 'meteor' ? 1.1 : .8;
          }
        }
      } else if (e.s2 == 'act') {
        e.tm -= dt;
        e.an = .01;
        if (LBEAM)
          e.ca = LBEAM.a0 + LBEAM.dir * 1.2 * Math.max(0, LBEAM.t - LBEAM.warn);
        if (e.tm <= 0) {
          e.an = 0;
          e.s2 = 'rest';
          e.tm = .9;
        }
      } else {
        e.an = 0;
        e.tm -= dt;
        if (e.tm <= 0) {
          e.s2 = 'move';
          e.cd = Math.max(.55, 1.6 - f * .3);
        }
      }
    }
    const _bossTickL = bossTick;
    bossTick = function (e, dt) {
      if (lavaOn() && room == 2)
        return lavaBossTick(e, dt); return _bossTickL(e, dt);
    };
    const _updBF = upd;
    upd = function (dt) {
      _updBF(dt);
      if (!lavaOn() || room != 2 || !BOSS.on || p.dead > 0 || BOSS.dead) {
        if (LH.length || LQ.length || LBEAM) {
          LH = [];
          LQ = [];
          LBEAM = null;
        }
        return;
      }
      if (HST > 0)
        return;
      const e = es.find(x => x.k == 'boss');
      LQ = LQ.filter(o => {
        o.t -= dt; if (o.t <= 0) {
          o.f();
          return false;
        } return true;
      });
      LH = LH.filter(h => {
        h.t -= dt;
        if (h.t > 0)
          return true;
        SFX.boom(h.r);
        shake = Math.max(shake, 4);
        fx.push({ k: 'ring', x: h.x, y: h.y, r: h.r, w: 3, life: .3, max: .3, col: '#ff8a2a' }, { k: 'gl', x: h.x, y: h.y, r: h.r * 2, c: '255,140,40', life: .3, max: .3 });
        for (let i = 0; i < 16; i++) {
          const an = R() * 6.283, v = 30 + R() * 80;
          dp.push({
            k: i % 3 ? 'p' : 'f', o: 1, x: h.x + Math.cos(an) * h.r * .5, y: h.y + Math.sin(an) * h.r * .3, vx: Math.cos(an) * v * .5, vy: -40 - R() * 80, life: .5 + R() * .4, max: .9, s: 2 + R() * 2.5, c: i % 2 ? '#ffd34d' : '#ff5a1f'
          });
        }
        if (p.dead <= 0 && Math.hypot(p.x - h.x, p.y - h.y) < h.r + p.r)
          hurt(h.d);
        if (h.pool)
          LZ.push({ x: h.x, y: h.y, r: h.r * .9, life: 3 });
        return false;
      });
      LZ = LZ.filter(z => (z.life -= dt) > 0);
      LZ.forEach(z => {
        if (R() < dt * 16)
          dp.push({
            k: 'p', x: z.x + (R() - .5) * z.r * 1.4, y: z.y + (R() - .5) * z.r, vx: 0, vy: -18 - R() * 20, life: .5, max: .5, s: 1.5, c: '#ffb050'
          }); if (p.dead <= 0 && p.dod <= 0 && Math.hypot(p.x - z.x, (p.y - z.y) * 1.3) < z.r)
          hurt(5);
      });
      if (LBEAM) {
        const bm = LBEAM;
        bm.t += dt;
        if (e) {
          bm.bx = e.x;
          bm.by = e.y - 24;
        }
        if (bm.t >= bm.warn) {
          const an = bm.a0 + bm.dir * 1.2 * (bm.t - bm.warn);
          if (lseg(p.x, p.y, bm.bx, bm.by, an, bm.len) < bm.w / 2 + p.r)
            hurt(14);
          if (R() < dt * 40) {
            const q = R() * bm.len;
            dp.push({
              k: 'p', x: bm.bx + Math.cos(an) * q, y: bm.by + Math.sin(an) * q, vx: (R() - .5) * 30, vy: -20 - R() * 30, life: .4, max: .4, s: 2, c: '#ffd34d'
            });
          }
          shake = Math.max(shake, 1.5);
        }
        if (bm.t >= bm.warn + bm.life)
          LBEAM = null;
      }
      if (e && BOSS.ph == 3 && !e.dying && e.s2 != 'morph' && dist(e, p) < 48 && p.inv <= 0)
        hurt(7);
    };
    const _envFxBM = envFx;
    envFx = function () {
      _envFxBM();
      if (!lavaOn() || room != 2)
        return;
      LH.forEach(h => { const k = 1 - h.t / h.mx; g.save(); g.fillStyle = 'rgba(255,120,20,' + (.1 + .22 * k) + ')'; g.beginPath(); g.arc(h.x, h.y, h.r, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,170,60,' + (.5 + .4 * k) + ')'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = 'rgba(255,90,20,.35)'; g.beginPath(); g.arc(h.x, h.y, h.r * k, 0, 7); g.fill(); g.restore(); });
      if (LBEAM) {
        const bm = LBEAM, warn = bm.t < bm.warn, an = warn ? bm.a0 : bm.a0 + bm.dir * 1.2 * (bm.t - bm.warn);
        g.save();
        g.translate(bm.bx, bm.by);
        g.rotate(an);
        if (warn) {
          g.strokeStyle = 'rgba(255,150,40,' + (.45 + .3 * Math.sin(t * 20)) + ')';
          g.setLineDash([6, 5]);
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(0, 0);
          g.lineTo(bm.len, 0);
          g.stroke();
          g.setLineDash([]);
        } else {
          g.globalCompositeOperation = 'lighter';
          [
            [bm.w * 2.4, 'rgba(255,70,10,.35)'], [bm.w * 1.4, 'rgba(255,150,40,.6)'], [bm.w * .6, 'rgba(255,245,200,.95)']
          ].forEach(([w, c]) => { g.fillStyle = c; g.fillRect(0, -w / 2, bm.len, w); });
        }
        g.restore();
      }
    };
    /* ===== MINI BOS (Wave 5, sebelum pintu terbuka): 2 sekaligus — 1 jarak dekat + 1 jarak jauh, mengikuti tema level (Half / Lava) ===== */
    function spawnMinis() {
      const L = lavaOn(), IC = iceR(), nm = IC ? ['KSATRIA SALJU BERKUDA', 'TURET ES HIDUP'] : L ? ['LAVA GOLEM', 'BLASH INFERNO'] : ['SKELETON KNIGHT', 'SKELETON ARCHER'], K = (L || IC) ? ['skel', 'mage'] : ['slime', 'mage'];
      const at = (x, y) => (typeof freeSpot == 'function' ? freeSpot(x, y) : { x, y });
      const mkM = (k, i, x, y) => {
        const s = at(x, y), e = mk(k, s.x, s.y), rg = i == 1;
        e.mini = rg ? 'rng' : 'mel';
        e.mn = nm[i];
        e.msz = 1.65;
        e.r = Math.round(e.r * 1.6);
        e.hp = e.mhp = Math.round((rg ? 230 : 340) * (1 + (DF[DIFF].hp - 1) * .6));
        e.sp *= (rg ? 1.1 : 1.2) * DF[DIFF].sp;
        e.sg = 1e9;
        e.xp = 120;
        if (IC) {
          e.ice = 1;
          e.msz = rg ? 1.5 : 1.5;
          e.r = rg ? 20 : 22;
          e.hp = e.mhp = Math.round((rg ? 300 : 380) * (1 + (DF[DIFF].hp - 1) * .6));
          if (rg)
            e.sp = 0;
        }
        e.sd = i * .5;
        e.st = 1.4 + e.sd;
        e.sw = e.st;
        e.sx = 0;
        return e;
      };
      MBH = [];
      es.push(mkM(K[0], 0, DW * .55, DY - 70), mkM(K[1], 1, DW * .8, DY + 70));
      SFX.wave();
      shake = Math.max(shake, 6);
      msg('⚠ 2 MINI BOS muncul! Kalahkan keduanya untuk membuka pintu.');
    }

    /* ===== ANIMASI MINI BOS: muncul dari lingkaran pemanggil, napas/squash, telegraf serangan, gelombang kejut, mengamuk <50% HP, ledakan saat mati ===== */
    let MBH = []; /* hazard mini bos: k 'c' lingkaran, 'l' garis tembak, 'r' gelombang cincin */
    const mbCl = (v, a, b) => Math.max(a, Math.min(b, v));
    const _deMB = drawEnemy;
    drawEnemy = function (e) {
      if (!e.mini)
        return _deMB(e);
      if (e.ice)
        return iceMiniDraw(e);
      const L = lavaOn(), mel = e.mini == 'mel', en = e.rg ? 1 : 0, c = L ? '255,100,20' : '120,240,90', cc = en ? '255,50,30' : c, s0 = e.msz, fy = e.y + 7, ph = t + e.ph, pu = .5 + .5 * Math.sin(t * (en ? 8 : 4) + e.ph);
      const sp = e.sw > 0 ? Math.max(0, Math.min(1, 1 - e.sw / (e.st || 1.4))) : 1, ez = 1 - (1 - sp) * (1 - sp), wd = e.s2 == 'wind', ak = wd ? 1 - e.tm / e.tmx : 0;
      e.lx = e.x;
      e.ly = e.y;
      const dir = (e.fdr == null ? (p.x < e.x ? -1 : 1) : e.fdr), F = q => e.fl > 0 ? '#fff' : q, R_ = (q, x, y, w, h) => { g.fillStyle = F(q); g.fillRect(x, y, w, h); };
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.beginPath();
      g.ellipse(e.x, fy + 1, (mel ? 17 : 12) * (.4 + .6 * sp), 5, 0, 0, 7);
      g.fill();
      g.save();
      g.globalCompositeOperation = 'lighter';
      const q = g.createRadialGradient(e.x, fy, 2, e.x, fy, 40 + en * 8);
      q.addColorStop(0, 'rgba(' + cc + ',' + (.28 + .2 * pu + en * .15) + ')');
      q.addColorStop(1, 'rgba(' + cc + ',0)');
      g.fillStyle = q;
      g.beginPath();
      g.ellipse(e.x, fy, 40 + en * 8, 15, 0, 0, 7);
      g.fill();
      g.restore();
      if (sp < 1) {
        g.save();
        g.translate(e.x, fy);
        g.globalCompositeOperation = 'lighter';
        const al = 1 - sp * .6;
        g.strokeStyle = 'rgba(' + c + ',' + al + ')';
        g.lineWidth = 2;
        g.save();
        g.scale(1, .38);
        g.rotate(t * 2);
        g.beginPath();
        g.arc(0, 0, 32, 0, 7);
        g.stroke();
        g.restore();
        const hh = 95 * Math.sin(sp * 3.1416), pg = g.createLinearGradient(0, 0, 0, -hh);
        pg.addColorStop(0, 'rgba(' + c + ',' + .55 * al + ')');
        pg.addColorStop(1, 'rgba(' + c + ',0)');
        g.fillStyle = pg;
        g.fillRect(-15, -hh, 30, hh);
        g.restore();
      }
      g.save();
      g.globalAlpha = Math.min(1, sp * 1.6);
      g.translate(e.x, fy);
      const gr = .3 + .7 * ez, bob = Math.sin(ph * 3) * (mel ? .6 : 1.6) - Math.abs(Math.sin(e.gp2 || 0)) * (mel ? 2.6 : 1.4) * (e.wm || 0), sq = e.sqs == null ? (e.s2 == 'rest' ? .94 : 1 + ak * .04) : e.sqs;
      g.rotate(e.lean || 0);
      g.scale(dir * s0 * .85 * gr * sq, s0 * .85 * gr * (2 - sq));
      g.rotate(.22 * (e.ac == null ? (e.s2 == 'act' ? 1 : 0) : e.ac));
      const lo = Math.sin((e.gp2 || 0) * 2) * 2.2 * (e.wm || 0), ey = en ? '#ff3a2a' : L ? '#ffd060' : '#7dff5a';
      if (mel && L) {
        const P = (c, a) => { g.fillStyle = F(c); g.beginPath(); a.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill(); }, cw = e.fl > 0 ? '#fff' : 'rgba(255,' + (110 + 100 * pu | 0) + ',30,.95)', ob = '#0d0709', ba = bob;
        for (let i = 0; i < 6; i++) {
          const u = (t * .7 + i * .17 + e.ph) % 1;
          g.fillStyle = 'rgba(255,' + (150 + 90 * pu | 0) + ',50,' + (1 - u) + ')';
          g.fillRect(Math.round(-16 + i * 6 + Math.sin(i * 3 + t * 2) * 3), Math.round(-52 - u * 26 + ba), 2, 2);
        }
        P('#2a1714', [[-13, -12 + lo * .4], [-4, -12], [-3, 0], [-15, 0]]);
        P('#2a1714', [[4, -12], [14, -12 - lo * .4], [16, 0], [3, 0]]);
        P(ob, [[-16, -3], [-2, -3], [-2, 1], [-17, 1]]);
        P(ob, [[3, -3], [17, -3], [18, 1], [3, 1]]);
        g.fillStyle = cw;
        g.fillRect(-10, -8, 5, 2);
        g.fillRect(8, -8, 5, 2);
        g.fillRect(-9, -4, 2, 4);
        g.fillRect(10, -4, 2, 4);
        P('#2a1714', [[-26, -28 + ba], [-33, -12 + ba], [-27, -3 + ba], [-20, -14 + ba]]);
        g.fillStyle = cw;
        g.fillRect(-30, -9 + ba, 6, 4);
        g.fillRect(-28, -3 + ba + Math.abs(Math.sin(t * 5)) * 4, 2, 3);
        P('#35201b', [[-21, -13 + ba], [-25, -30 + ba], [-17, -41 + ba], [17, -41 + ba], [25, -30 + ba], [21, -13 + ba]]);
        P('#523228', [[-14, -39 + ba], [14, -39 + ba], [11, -33 + ba], [-11, -33 + ba]]);
        P('#1e100c', [[-12, -14 + ba], [12, -14 + ba], [9, -10 + ba], [-9, -10 + ba]]);
        const cg = g.createRadialGradient(0, -25 + ba, 1, 0, -25 + ba, 11);
        cg.addColorStop(0, 'rgba(255,245,170,1)');
        cg.addColorStop(.5, 'rgba(255,' + (110 + 60 * pu | 0) + ',30,.95)');
        cg.addColorStop(1, 'rgba(120,20,5,0)');
        g.fillStyle = e.fl > 0 ? '#fff' : cg;
        g.beginPath();
        g.arc(0, -25 + ba, 11, 0, 7);
        g.fill();
        for (let k = 0; k < 3; k++)
          R_('#1a0e0c', -10, -31 + k * 5 + ba, 20, 2);
        R_('#1a0e0c', -1, -33 + ba, 2, 16);
        g.fillStyle = cw;
        [[-19, -36, 2, 9], [-19, -28, 7, 2], [15, -38, 2, 10], [11, -29, 7, 2], [-17, -20, 2, 5], [14, -22, 2, 6]].forEach(a => g.fillRect(a[0], a[1] + ba, a[2], a[3]));
        P('#2a1714', [[-34, -30 + ba], [-27, -45 + ba], [-14, -43 + ba], [-12, -30 + ba]]);
        P('#2a1714', [[34, -30 + ba], [27, -45 + ba], [14, -43 + ba], [12, -30 + ba]]);
        [
          [[-29, -43], [-33, -56], [-24, -45]], [[-21, -45], [-19, -59], [-15, -44]], [[29, -43], [33, -56], [24, -45]], [[21, -45], [19, -59], [15, -44]]
        ].forEach(a => P(ob, a.map(q => [q[0], q[1] + ba])));
        g.fillStyle = cw;
        g.fillRect(-28, -38 + ba, 6, 2);
        g.fillRect(22, -38 + ba, 6, 2);
        P('#241310', [[-9, -42 + ba], [-11, -55 + ba], [0, -59 + ba], [11, -55 + ba], [9, -42 + ba]]);
        P(ob, [[-11, -51 + ba], [11, -51 + ba], [9, -47 + ba], [-9, -47 + ba]]);
        g.save();
        g.globalCompositeOperation = 'lighter';
        const eg = g.createRadialGradient(0, -48 + ba, 1, 0, -48 + ba, 14);
        eg.addColorStop(0, 'rgba(255,' + (en ? 40 : 160) + ',40,.55)');
        eg.addColorStop(1, 'rgba(255,60,20,0)');
        g.fillStyle = eg;
        g.fillRect(-14, -62 + ba, 28, 28);
        g.restore();
        R_(ey, -8, -50 + ba, 6, 3);
        R_(ey, 2, -50 + ba, 6, 3);
        g.fillStyle = cw;
        for (let i = 0; i < 4; i++)
          g.fillRect(-7 + i * 4, -44 + ba, 2, 3);
        P(ob, [[-9, -55 + ba], [-19, -61 + ba], [-23, -74 + ba], [-13, -63 + ba], [-6, -56 + ba]]);
        P(ob, [[9, -55 + ba], [19, -61 + ba], [23, -74 + ba], [13, -63 + ba], [6, -56 + ba]]);
        g.fillStyle = cw;
        g.fillRect(-23, -75 + ba, 3, 4);
        g.fillRect(20, -75 + ba, 3, 4);
        for (let i = 0; i < 5; i++) {
          const h = 8 + Math.abs(Math.sin(t * 9 + i * 1.3)) * 8;
          g.fillStyle = e.fl > 0 ? '#fff' : i % 2 ? '#ffb040' : '#ff6a1a';
          g.beginPath();
          g.moveTo(-7 + i * 3.5, -58 + ba);
          g.lineTo(-5 + i * 3.5 + Math.sin(t * 6 + i) * 2, -58 - h + ba);
          g.lineTo(-3 + i * 3.5, -58 + ba);
          g.fill();
        }
        const up = e.atk == 'smash' || e.atk == 'quake', ra = wd && up ? -.4 - ak * 1.9 : e.s2 == 'rest' && up ? .7 : e.s2 == 'wind' ? -.3 : Math.sin(ph * 3) * .06;
        g.save();
        g.translate(24, -30 + ba);
        g.rotate(ra);
        P('#2a1714', [[-5, 0], [5, 0], [6, 13], [-6, 13]]);
        g.fillStyle = cw;
        g.fillRect(-5, 11, 10, 4);
        R_('#14090a', -2, -24, 5, 34);
        P('#3a201a', [[-13, -42], [-4, -49], [9, -48], [15, -40], [13, -27], [-9, -25], [-15, -34]]);
        P(ob, [[-4, -49], [0, -58], [5, -48]]);
        g.fillStyle = cw;
        [[-9, -40, 2, 9], [-9, -32, 8, 2], [3, -44, 2, 8], [6, -36, 6, 2], [-2, -30, 2, 4]].forEach(a => g.fillRect(a[0], a[1], a[2], a[3]));
        for (let i = 0; i < 3; i++)
          g.fillRect(-8 + i * 7, -26 + Math.abs(Math.sin(t * 4 + i * 2)) * 6, 2, 4);
        g.restore();
      } else if (mel) {
        /* SKELETON KNIGHT: kerangka berzirah penuh, perisai menara + pedang panjang */
        const ST = ['#2c3242', '#4a546c', '#8e9ab8', '#171a24'], BN = '#14141a', GL = en ? '#ff3a2a' : '#7dff5a', up = e.atk == 'smash' || e.atk == 'quake', ra = wd && up ? -.4 - ak * 1.9 : e.s2 == 'rest' && up ? .7 : e.s2 == 'wind' ? -.3 : Math.sin(ph * 3) * .06;
        const Pg = (c, a) => { g.fillStyle = F(c); g.beginPath(); a.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill(); };
        for (let i = 0; i < 5; i++) {
          const u = (t * .6 + i * .2 + e.ph) % 1;
          g.fillStyle = 'rgba(110,255,90,' + (1 - u) * .8 + ')';
          g.fillRect(Math.round(-12 + i * 6 + Math.sin(i * 3 + t * 2) * 3), Math.round(-58 - u * 22 + bob), 2, 2);
        }
        R_(ST[3], -9, -12 + lo * .4, 7, 12 - lo * .4);
        R_(ST[3], 3, -12 - lo * .4, 7, 12 + lo * .4);
        R_(ST[0], -10, -22 + lo * .4, 9, 11);
        R_(ST[0], 2, -22 - lo * .4, 9, 11);
        R_(BN, -7, -13, 3, 2);
        R_(BN, 4, -13, 3, 2);
        R_(ST[1], -11, -3, 10, 3);
        R_(ST[1], 2, -3, 10, 3);
        R_(ST[0], -14, -42 + bob, 28, 22);
        R_(ST[2], -12, -41 + bob, 24, 3);
        R_(ST[1], -2, -40 + bob, 4, 20);
        R_(ST[3], -14, -22 + bob, 28, 3);
        R_('#6b7390', -4, -34 + bob, 8, 2);
        R_('#6b7390', -4, -29 + bob, 8, 2);
        Pg(ST[1], [[-23, -40 + bob], [-14, -46 + bob], [-12, -36 + bob], [-22, -32 + bob]]);
        Pg(ST[1], [[23, -40 + bob], [14, -46 + bob], [12, -36 + bob], [22, -32 + bob]]);
        Pg(BN, [[-22, -40 + bob], [-19, -52 + bob], [-15, -42 + bob]]);
        Pg(BN, [[22, -40 + bob], [19, -52 + bob], [15, -42 + bob]]);
        R_(ST[3], -7, -48 + bob, 14, 7);
        Pg(ST[1], [[-9, -50 + bob], [-8, -62 + bob], [8, -62 + bob], [9, -50 + bob], [7, -44 + bob], [-7, -44 + bob]]);
        R_(ST[2], -8, -62 + bob, 16, 2);
        R_(ST[3], -7, -55 + bob, 14, 4);
        R_(GL, -5, -54 + bob, 3, 2);
        R_(GL, 2, -54 + bob, 3, 2);
        R_(ST[3], -1, -51 + bob, 2, 5);
        Pg('#2f8a2a', [[-2, -62 + bob], [3, -70 + bob + Math.sin(t * 6) * 2], [9, -66 + bob], [4, -60 + bob]]);
        g.save();
        g.globalCompositeOperation = 'lighter';
        const eg = g.createRadialGradient(0, -54 + bob, 1, 0, -54 + bob, 12);
        eg.addColorStop(0, 'rgba(' + (en ? '255,60,40' : '110,255,90') + ',.5)');
        eg.addColorStop(1, 'rgba(110,255,90,0)');
        g.fillStyle = eg;
        g.fillRect(-12, -66 + bob, 24, 24);
        g.restore();
        Pg(ST[0], [[-31, -44 + bob], [-18, -42 + bob], [-18, -14 + bob], [-24, -8 + bob], [-31, -14 + bob]]);
        Pg(ST[2], [[-29, -42 + bob], [-27, -42 + bob], [-27, -16 + bob], [-29, -16 + bob]]);
        R_(BN, -27, -34 + bob, 7, 2);
        R_(BN, -25, -37 + bob, 3, 14);
        R_(GL, -26, -31 + bob, 5, 2);
        g.save();
        g.translate(19, -35 + bob);
        g.rotate(ra);
        R_(ST[0], -3, 0, 6, 13);
        R_(BN, -2, 12, 4, 4);
        R_('#4a2f1a', -1, -4, 3, 6);
        R_(ST[3], -7, -8, 14, 3);
        R_('#c9d4e8', -2, -42, 5, 36);
        R_('#fff', -1, -41, 1, 33);
        Pg('#c9d4e8', [[-2, -42], [0, -48], [3, -42]]);
        g.restore();
      } else {
        const fl = -6 + bob;
        if (L) {
          const P = (c, a) => { g.fillStyle = F(c); g.beginPath(); a.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill(); }, cw = e.fl > 0 ? '#fff' : 'rgba(255,' + (120 + 100 * pu | 0) + ',30,.95)', fc = i => e.fl > 0 ? '#fff' : i % 2 ? '#ffb040' : '#ff6a1a';
          g.save();
          g.translate(0, -22 + fl);
          g.globalCompositeOperation = 'lighter';
          g.strokeStyle = 'rgba(255,120,30,' + (.35 + .3 * pu) + ')';
          g.lineWidth = 1.5;
          g.beginPath();
          g.arc(0, 0, 27, 0, 7);
          g.stroke();
          g.beginPath();
          g.arc(0, 0, 20, 0, 7);
          g.stroke();
          g.rotate(t * 1.4);
          g.fillStyle = 'rgba(255,200,90,.8)';
          for (let i = 0; i < 8; i++) {
            g.rotate(.7854);
            g.fillRect(26, -1, 5, 2);
          }
          g.restore();
          P('#2a0e08', [[-14, -4 + fl], [-11, -30 + fl], [11, -30 + fl], [14, -4 + fl]]);
          P('#4a1a10', [[-9, -28 + fl], [9, -28 + fl], [7, -12 + fl], [-7, -12 + fl]]);
          for (let i = -3; i <= 3; i++) {
            const h = 12 + Math.sin(t * 9 + i * 1.7) * 5;
            g.fillStyle = fc(i + 3);
            g.beginPath();
            g.moveTo(i * 4.5 - 3, -5 + fl);
            g.lineTo(i * 4.5 + Math.sin(t * 5 + i) * 2, -5 + fl + h);
            g.lineTo(i * 4.5 + 3, -5 + fl);
            g.fill();
          }
          g.fillStyle = cw;
          for (let k = 0; k < 4; k++)
            g.fillRect(-5, -27 + k * 4 + fl, 10, 1);
          const cg = g.createRadialGradient(0, -20 + fl, 0, 0, -20 + fl, 8);
          cg.addColorStop(0, 'rgba(255,245,170,.9)');
          cg.addColorStop(1, 'rgba(255,90,20,0)');
          g.fillStyle = e.fl > 0 ? '#fff' : cg;
          g.beginPath();
          g.arc(0, -20 + fl, 8, 0, 7);
          g.fill();
          for (let s = -1; s <= 1; s += 2)
            for (let i = 0; i < 3; i++) {
              const h = 7 + Math.abs(Math.sin(t * 8 + i + s)) * 6;
              g.fillStyle = fc(i);
              g.beginPath();
              g.moveTo(s * (10 + i * 3) - 2, -30 + fl);
              g.lineTo(s * (10 + i * 3), -30 - h + fl);
              g.lineTo(s * (10 + i * 3) + 2, -30 + fl);
              g.fill();
            }
          for (let i = -2; i <= 2; i++) {
            const h = 10 + Math.abs(Math.sin(t * 8 + i * 1.4)) * 8;
            g.fillStyle = fc(i + 2);
            g.beginPath();
            g.moveTo(i * 4 - 3, -43 + fl);
            g.lineTo(i * 4 - 2 + Math.sin(t * 6 + i) * 2, -43 - h + fl);
            g.lineTo(i * 4 + 3, -43 + fl);
            g.fill();
          }
          P('#14090a', [[-6, -42 + fl], [-16, -48 + fl], [-20, -60 + fl], [-10, -50 + fl], [-3, -43 + fl]]);
          P('#14090a', [[6, -42 + fl], [16, -48 + fl], [20, -60 + fl], [10, -50 + fl], [3, -43 + fl]]);
          g.fillStyle = cw;
          g.fillRect(-21, -61 + fl, 3, 4);
          g.fillRect(18, -61 + fl, 3, 4);
          g.fillStyle = F('#d9c7a4');
          g.beginPath();
          g.arc(0, -37 + fl, 8, 0, 7);
          g.fill();
          R_('#c0ac88', -5, -32 + fl, 10, 5);
          R_('#1a0806', -6, -40 + fl, 5, 5);
          R_('#1a0806', 1, -40 + fl, 5, 5);
          R_(ey, -5, -39 + fl, 3, 3);
          R_(ey, 2, -39 + fl, 3, 3);
          R_('#1a0806', -1, -35 + fl, 2, 3);
          g.fillStyle = '#1a0806';
          for (let i = -1; i <= 1; i++)
            g.fillRect(i * 3 - 1, -31 + fl, 1, 4);
          const hy = -24 + fl - ak * 9, fr = 3 + ak * 9;
          R_('#2a0e08', 6, -27 + fl, 11, 3);
          R_('#d9c7a4', 16, hy - 1, 4, 3);
          g.save();
          g.globalCompositeOperation = 'lighter';
          const fg = g.createRadialGradient(22, hy - 5, 0, 22, hy - 5, fr + 5);
          fg.addColorStop(0, 'rgba(255,250,200,1)');
          fg.addColorStop(.5, 'rgba(255,120,30,.9)');
          fg.addColorStop(1, 'rgba(255,60,10,0)');
          g.fillStyle = fg;
          g.beginPath();
          g.arc(22, hy - 5, fr + 5, 0, 7);
          g.fill();
          g.restore();
          for (let i = 0; i < 3; i++) {
            const a = t * 2.2 + i * 2.094, r = 24 - ak * 12, ox = Math.cos(a) * r, oy = Math.sin(a) * r * .4 - 18 + fl;
            g.save();
            g.globalCompositeOperation = 'lighter';
            const og = g.createRadialGradient(ox, oy, 0, ox, oy, 7 + ak * 4);
            og.addColorStop(0, 'rgba(255,240,170,1)');
            og.addColorStop(1, 'rgba(255,90,20,0)');
            g.fillStyle = og;
            g.beginPath();
            g.arc(ox, oy, 7 + ak * 4, 0, 7);
            g.fill();
            g.restore();
          }
          for (let i = 0; i < 5; i++) {
            const u = (t * .8 + i * .2 + e.ph) % 1;
            g.fillStyle = 'rgba(255,' + (150 + 80 * pu | 0) + ',50,' + (1 - u) + ')';
            g.fillRect(Math.round(-12 + i * 6 + Math.sin(i * 4 + t * 3) * 3), Math.round(-50 - u * 22 + fl), 2, 2);
          }
        } else {
          /* SKELETON ARCHER: kerangka berzirah ringan, helm tertutup, busur panjang + tabung panah */
          const ST = ['#2c3242', '#4a546c', '#8e9ab8', '#171a24'], BN = '#14141a', GL = en ? '#ff3a2a' : '#7dff5a', Pg = (c, a) => { g.fillStyle = F(c); g.beginPath(); a.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill(); };
          R_(ST[3], -7, -14, 5, 14 + lo * .3);
          R_(ST[3], 2, -14, 5, 14 - lo * .3);
          R_(ST[1], -8, -3, 7, 3);
          R_(ST[1], 1, -3, 7, 3);
          R_(BN, -6, -22 + bob, 3, 9);
          R_(BN, 3, -22 + bob, 3, 9);
          Pg('#3a2c4a', [
            [-12, -6 + bob], [-7, -9 + bob], [0, -6 + bob], [7, -9 + bob], [12, -6 + bob], [8, -30 + bob], [-8, -30 + bob]
          ]);
          R_(ST[0], -9, -36 + bob, 18, 16);
          R_(ST[2], -8, -35 + bob, 16, 2);
          R_(ST[3], -9, -22 + bob, 18, 2);
          R_(BN, -4, -31 + bob, 8, 1);
          R_(BN, -4, -28 + bob, 8, 1);
          R_(BN, -4, -25 + bob, 8, 1);
          R_('#5a3a22', -13, -42 + bob, 5, 18);
          R_(BN, -12, -44 + bob, 1, 3);
          R_(BN, -10, -44 + bob, 1, 3);
          Pg(ST[1], [[-11, -35 + bob], [-6, -39 + bob], [-6, -31 + bob], [-11, -29 + bob]]);
          Pg(ST[1], [[11, -35 + bob], [6, -39 + bob], [6, -31 + bob], [11, -29 + bob]]);
          Pg(ST[1], [[-7, -39 + bob], [-7, -49 + bob], [-3, -53 + bob], [3, -53 + bob], [7, -49 + bob], [7, -39 + bob]]);
          R_(ST[2], -6, -50 + bob, 12, 2);
          R_(ST[3], -6, -45 + bob, 12, 4);
          R_(GL, -4, -44 + bob, 3, 2);
          R_(GL, 1, -44 + bob, 3, 2);
          R_(ST[3], -1, -41 + bob, 2, 3);
          Pg('#2f8a2a', [[0, -53 + bob], [5, -58 + bob + Math.sin(t * 6) * 2], [4, -52 + bob]]);
          g.save();
          g.globalCompositeOperation = 'lighter';
          const eg2 = g.createRadialGradient(0, -44 + bob, 1, 0, -44 + bob, 10);
          eg2.addColorStop(0, 'rgba(' + (en ? '255,60,40' : '110,255,90') + ',.45)');
          eg2.addColorStop(1, 'rgba(110,255,90,0)');
          g.fillStyle = eg2;
          g.fillRect(-10, -54 + bob, 20, 20);
          g.restore();
          const bx = 15, by = -30 + bob, pull = wd ? ak * 10 : 0, nk = bx + 1 - pull;
          R_(F(ST[0]), 7, -31 + bob, 8, 4);
          g.lineCap = 'round';
          g.save();
          g.translate(bx + 8, by);
          g.scale(1, 1);
          g.translate(-(bx + 8), -by);
          const limb = (c, w) => { g.strokeStyle = F(c); g.lineWidth = w; g.beginPath(); g.moveTo(bx - 4, by - 24); g.quadraticCurveTo(bx + 4, by - 20, bx + 8, by - 9); g.quadraticCurveTo(bx + 10, by - 3, bx + 8, by); g.quadraticCurveTo(bx + 10, by + 3, bx + 8, by + 9); g.quadraticCurveTo(bx + 4, by + 20, bx - 4, by + 24); g.stroke(); };
          limb('#14141a', 5);
          limb('#4a5a46', 2.2);
          R_('#d8d8e0', bx + 6, by - 4, 5, 8);
          R_('#14141a', bx + 7, by - 3, 3, 6);
          R_('#82ff66', bx - 6, by - 26, 3, 3);
          R_('#82ff66', bx - 6, by + 23, 3, 3);
          if (!F('#000').startsWith('#f')) {
            g.save();
            g.globalCompositeOperation = 'lighter';
            const rg2 = g.createRadialGradient(bx + 8, by, 0, bx + 8, by, 6 + 4 * ak);
            rg2.addColorStop(0, 'rgba(110,255,90,' + (.5 + .4 * ak) + ')');
            rg2.addColorStop(1, 'rgba(110,255,90,0)');
            g.fillStyle = rg2;
            g.fillRect(bx, by - 10, 18, 20);
            g.restore();
          }
          g.strokeStyle = 'rgba(190,255,160,.95)';
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(bx - 4, by - 24);
          g.lineTo(nk, by);
          g.lineTo(bx - 4, by + 24);
          g.stroke();
          if (wd) {
            g.save();
            g.globalCompositeOperation = 'lighter';
            const ag = g.createRadialGradient(bx + 10, by, 0, bx + 10, by, 5 + ak * 10);
            ag.addColorStop(0, 'rgba(190,255,150,' + (.6 + .4 * ak) + ')');
            ag.addColorStop(1, 'rgba(60,200,40,0)');
            g.fillStyle = ag;
            g.beginPath();
            g.arc(bx + 10, by, 5 + ak * 10, 0, 7);
            g.fill();
            g.restore();
          }
          g.restore();
        }
      }
      g.restore();
      if (e.s2 == 'wind') {
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.strokeStyle = 'rgba(255,' + (L ? 90 : 60) + ',40,' + (.25 + .5 * ak) + ')';
        g.lineWidth = 2;
        g.beginPath();
        g.ellipse(e.x, fy, 14 + ak * 26, 5 + ak * 10, 0, 0, 7);
        g.stroke();
        g.restore();
      }
      if (e.dz)
        for (let i = 0; i < 3; i++) {
          const a = t * 6 + i * 2.094;
          g.fillStyle = '#ffe36a';
          g.fillRect(Math.round(e.x + Math.cos(a) * 14), Math.round(e.y - 42 + Math.sin(a) * 4), 3, 3);
        }
      if (sp >= 1)
        for (let i = 0; i < 5; i++) {
          const aa = t * (en ? 3 : 1.6) + i * 1.2566 + e.ph, rr = 17 * s0 + Math.sin(t * 2 + i) * 3;
          g.fillStyle = 'rgba(' + cc + ',' + (.6 + .3 * Math.sin(t * 6 + i)) + ')';
          g.fillRect(Math.round(e.x + Math.cos(aa) * rr), Math.round(fy - 14 * s0 + Math.sin(aa) * rr * .45 - Math.abs(Math.sin(t * 3 + i)) * 6), 2, 2);
        }
      if (e.sw <= 0) {
        e.hv = e.hv == null ? e.hp : e.hv + (e.hp - e.hv) * .1;
        const w = 48, x = Math.round(e.x - w / 2), y = Math.round(e.y - e.r - 46), k = Math.max(0, e.hp / e.mhp), kv = Math.max(0, e.hv / e.mhp);
        g.fillStyle = 'rgba(10,8,14,.88)';
        g.fillRect(x - 1, y - 1, w + 2, 7);
        g.fillStyle = '#f2f2f2';
        g.fillRect(x, y, Math.round(w * kv), 5);
        g.fillStyle = en ? (pu > .5 ? '#ff3a2a' : '#c81e14') : L ? '#ff7a1f' : '#e0b84a';
        g.fillRect(x, y, Math.round(w * k), 5);
        g.font = 'bold 8px monospace';
        txt((en ? '☠ ' : '') + e.mn, e.x, y - 4, en ? '#ff8a7a' : L ? '#ffb070' : '#c4ffa8', 'center');
      }
    };
    const _updMA = upd;
    upd = function (dt) {
      _updMA(dt);
      if (lobby || room || !es.length)
        return;
      const IC = iceR(), L = lavaOn(), col = IC ? '#9fe4ff' : L ? '#ff8a2a' : '#82ff66', cs = IC ? '150,220,255' : L ? '255,120,30' : '120,240,90';
      const burst = (e, n, v, y0) => {
        for (let i = 0; i < n; i++) {
          const a = R() * 6.283, s = v * (.4 + R() * .8);
          dp.push({
            k: 'p', x: e.x, y: e.y + y0, vx: Math.cos(a) * s, vy: Math.sin(a) * s * .55 - 25, life: .4 + R() * .4, max: .8, s: 1.5 + R() * 2, c: i % 3 ? col : '#fff'
          });
        }
      };
      es.forEach(e => {
        if (!e.mini)
          return;
        if (e.sw > 0) {
          e.ws = 1;
          if (R() < dt * 30)
            dp.push({
              k: 'p', x: e.x + (R() - .5) * 30, y: e.y + 8, vx: (R() - .5) * 10, vy: -40 - R() * 50, life: .6, max: .6, s: 1.5 + R() * 1.5, c: R() < .5 ? col : '#fff'
            });
          return;
        }
        if (e.ws) {
          e.ws = 0;
          fx.push({ k: 'ring', x: e.x, y: e.y + 6, r: 60, w: 4, life: .5, max: .5, col }, { k: 'ring', x: e.x, y: e.y + 6, r: 34, w: 3, life: .35, max: .35, col: '#fff' });
          shake = Math.max(shake, 7);
          SFX.slam();
          burst(e, 22, 110, 6);
        }
        const fire = (e.pw && e.wind <= 0) || (e.hd && !e.phd);
        e.pw = e.wind > 0;
        e.phd = e.hd;
        if (fire && e.mini == 'mel') {
          fx.push({ k: 'ring', x: e.x, y: e.y + 6, r: 48, w: 4, life: .35, max: .35, col }, { k: 'ring', x: e.x, y: e.y + 6, r: 28, w: 2, life: .25, max: .25, col: '#fff' });
          shake = Math.max(shake, 5);
          burst(e, 10, 80, 6);
        }
        if (fire && e.mini == 'rng')
          fx.push({ k: 'ring', x: e.x, y: e.y, r: 26, w: 2, life: .25, max: .25, col });
        if (Math.hypot(e.x - (e.px == null ? e.x : e.px), e.y - (e.py == null ? e.y : e.py)) > .4 && R() < dt * 14)
          puff(e.x, e.y + 9, 1, L ? '150,80,50' : IC ? '210,230,245' : '120,110,100', .5);
        e.px = e.x;
        e.py = e.y;
        if (!e.rg && e.hp < e.mhp * .5) {
          e.rg = 1;
          e.sp *= 1.25;
          shake = Math.max(shake, 9);
          SFX.boom(20);
          FLSH = .5;
          FLSC = cs;
          fx.push({ k: 'ring', x: e.x, y: e.y, r: 80, w: 5, life: .55, max: .55, col: '#ff3a2a' }, { k: 'ring', x: e.x, y: e.y, r: 46, w: 3, life: .4, max: .4, col });
          burst(e, 26, 130, 0);
          msg(e.mn + ' mengamuk!');
        }
        if (e.rg) {
          e.cd -= dt * .5;
          if (R() < dt * 22)
            dp.push({
              k: 'p', x: e.x + (R() - .5) * 22, y: e.y - 6, vx: (R() - .5) * 14, vy: -30 - R() * 30, life: .6, max: .6, s: 1.5 + R(), c: R() < .5 ? '#ff4a2a' : col
            });
        }
      });
    };
    const _killMA = kill;
    kill = function (e) {
      if (e && e.mini && !e.ice) {
        const L = lavaOn(), col = L ? '#ff8a2a' : '#82ff66';
        fx.push({ k: 'ring', x: e.x, y: e.y, r: 90, w: 5, life: .6, max: .6, col }, { k: 'ring', x: e.x, y: e.y, r: 55, w: 4, life: .45, max: .45, col: '#fff' }, { k: 'ring', x: e.x, y: e.y, r: 30, w: 3, life: .3, max: .3, col }, { k: 'gl', x: e.x, y: e.y, r: 90, c: L ? '255,120,30' : '150,255,110', life: .5, max: .5 });
        for (let i = 0; i < 40; i++) {
          const a = R() * 6.283, s = 40 + R() * 150;
          dp.push({
            k: 'p', x: e.x, y: e.y - 6, vx: Math.cos(a) * s, vy: Math.sin(a) * s * .7 - 30, life: .5 + R() * .6, max: 1.1, s: 1.5 + R() * 2.5, c: i % 3 ? col : '#fff'
          });
        }
        shake = Math.max(shake, 11);
        HST = Math.max(HST, .12);
        FLSH = .6;
        FLSC = L ? '255,130,40' : '180,255,150';
        SFX.boom(24);
        SFX.slam();
      }
      return _killMA(e);
    }; /* serangan: pemanah menembak 3 panah/bola (damage +35%), brute memukul lebih sakit */

    /* ===== AI MINI BOS: pola serangan sendiri (lebih ringan dari Morvath) =====
       HALF BRUTE / LAVA GOLEM : smash (gelombang kejut cincin) · charge (menyeruduk, pusing jika menabrak tembok) · quake (retakan beruntun)
       HALF ARCHER / BLASH INFERNO : volley (kipas proyektil) · snipe (garis tembak) · rain (hujan ledakan) · blink saat mengamuk */

    function miniTick(e, dt) {
      if (e.ice)
        return iceMiniTick(e, dt);
      e.fl -= dt;
      e.cd -= dt;
      e.stg = 0;
      e.stun = 0;
      e.wind = 0;
      e.an = 0;
      const act = e.s2 == 'act';
      if (!act) {
        mv(e, e.vx * dt, e.vy * dt);
        e.vx *= Math.pow(.02, dt);
        e.vy *= Math.pow(.02, dt);
      }
      if (p.dead > 0) {
        e.s2 = 'move';
        return;
      }
      if (!e.s2)
        e.s2 = 'move';
      const d = dist(e, p), a = ang(e, p), rg = e.rg ? 1 : 0, mel = e.mini == 'mel', L = lavaOn(), col = L ? '#ff8a2a' : '#82ff66', tm = n => n * (rg ? .8 : 1);
      if (e.s2 == 'move') {
        e.dz = 0;
        if (mel) {
          if (d > 30)
            mv(e, Math.cos(a) * e.sp * dt, Math.sin(a) * e.sp * dt);
        } else {
          const s = d < 105 ? -1 : d < 120 ? (d - 120) / 15 : d > 205 ? 1 : d > 190 ? (d - 190) / 15 : 0;
          mv(e, Math.cos(a) * e.sp * s * dt, Math.sin(a) * e.sp * s * dt);
        }
        if (e.cd > 0)
          return;
        const o = mel ? (d < 75 ? ['smash', 'smash', 'quake'] : (L ? ['charge', 'quake', 'charge'] : ['quake', 'smash', 'quake'])) : (d < 100 ? ['rain', 'volley'] : ['volley', 'snipe', 'rain']), k = o[Math.floor(R() * o.length)], dur = tm({ smash: .9, charge: .8, quake: .7, volley: .6, snipe: .95, rain: .75 }[k]);
        e.s2 = 'wind';
        e.atk = k;
        e.tmx = e.tm = dur;
        e.ca = a;
        SFX.warn(mel ? 0 : 1);
        SFX.bossVo(bossVid(e), k);
        if (k == 'smash')
          MBH.push(L ? { k: 'c', x: e.x, y: e.y, r: 54, t: dur, mx: dur, d: 18, big: 1, ring: 1, rs: rg ? 210 : 165 } : { k: 'c', x: e.x, y: e.y, r: 62, t: dur, mx: dur, d: 16, big: 1, sh: rg ? 12 : 8 });
        if (k == 'quake' && L)
          for (let i = 1; i <= (rg ? 5 : 3); i++) {
            const q = dur + i * .2;
            MBH.push({
              k: 'c', x: mbCl(e.x + Math.cos(a) * (36 + i * 34), 30, DW - 30), y: mbCl(e.y + Math.sin(a) * (36 + i * 34), 30, DH - 30), r: 26, t: q, mx: q, d: 14, sp: !L
            });
          }
        if (k == 'snipe' && L)
          MBH.push({ k: 'l', o: e, x: e.x, y: e.y, a, len: 360, w: 6, t: dur, mx: dur, d: 20 });
        if (k == 'rain')
          for (let i = 0; i < (rg ? 6 : 4) + dfx().shots; i++) {
            const q = dur + i * .2;
            MBH.push({
              k: 'c', x: i ? mbCl(p.x + (R() - .5) * 150, 30, DW - 30) : p.x, y: i ? mbCl(p.y + (R() - .5) * 110, 30, DH - 30) : p.y, r: L ? 24 : 20, t: q, mx: q, d: 12, ar: !L
            });
          }
      } else if (e.s2 == 'wind') {
        e.tm -= dt;
        if (e.atk == 'charge' && e.tm > e.tmx * .4)
          e.ca = a;
        if (e.tm > 0)
          return;
        if (e.atk == 'charge') {
          e.s2 = 'act';
          e.tm = .42;
          e.hit = 0;
          SFX.dodge();
          SFX.bossVo(bossVid(e), 'dash');
          return;
        }
        if (!L && (e.atk == 'quake' || e.atk == 'snipe')) {
          const b0 = Math.atan2(p.y - e.y, p.x - e.x), big = e.atk == 'snipe', n = big ? 1 : (rg ? 5 : 3);
          SFX.eshot();
          shake = Math.max(shake, 2);
          fx.push({ k: 'ring', x: e.x, y: e.y - 20, r: 26, w: 3, life: .3, max: .3, col: '#7dff5a' });
          for (let i = 0; i < n; i++) {
            const q = b0 + (i - (n - 1) / 2) * .3, v = big ? 230 : 120;
            pr.push({
              x: e.x, y: e.y - 6, vx: Math.cos(q) * v, vy: Math.sin(q) * v, d: big ? 16 : 11, r: big ? 14 : 5.5, col: '#7dff5a', pb: 1, own: 'e', life: 3.5
            });
          }
        }
        if (e.atk == 'volley') {
          const n = (L ? (rg ? 7 : 5) : (rg ? 5 : 3)) + dfx().shots, b = Math.atan2(p.y - e.y, p.x - e.x);
          SFX.eshot();
          shake = Math.max(shake, 2);
          fx.push({ k: 'ring', x: e.x, y: e.y, r: 24, w: 3, life: .25, max: .25, col });
          for (let i = 0; i < n; i++) {
            const q = b + (i - (n - 1) / 2) * (L ? .22 : .3);
            pr.push({
              x: e.x, y: e.y, vx: Math.cos(q) * (L ? 150 : 125), vy: Math.sin(q) * (L ? 150 : 125), d: 10, r: L ? 3 : 9, col: L ? col : '#7dff5a', pb: !L, own: 'e', life: 3
            });
          }
        }
        e.s2 = 'rest';
        e.tm = mel ? .8 : .55;
        if (!mel && rg && R() < .5) {
          const r = R() * 6.283, nx = mbCl(p.x + Math.cos(r) * 150, 40, DW - 40), ny = mbCl(p.y + Math.sin(r) * 110, 40, DH - 40);
          if (!blk(nx, ny, e.r)) {
            puff(e.x, e.y, 6, '255,120,40', 1);
            fx.push({ k: 'ring', x: e.x, y: e.y, r: 30, w: 3, life: .3, max: .3, col });
            e.x = nx;
            e.y = ny;
            puff(nx, ny, 6, '255,120,40', 1);
          }
        }
      } else if (e.s2 == 'act') {
        e.tm -= dt;
        const ox = e.x, oy = e.y;
        mv(e, Math.cos(e.ca) * (rg ? 360 : 310) * dt, Math.sin(e.ca) * (rg ? 360 : 310) * dt);
        if (R() < .7)
          puff(e.x, e.y + 6, 1, L ? '150,70,40' : '120,110,100', .8);
        if (!e.hit && dist(e, p) < e.r + p.r + 4) {
          e.hit = 1;
          hurt(18);
        }
        if (Math.hypot(e.x - ox, e.y - oy) < .3) {
          e.s2 = 'rest';
          e.tm = 1.2;
          e.dz = 1;
          shake = Math.max(shake, 7);
          SFX.slam();
          fx.push({ k: 'ring', x: e.x, y: e.y, r: 34, w: 3, life: .3, max: .3, col });
          dn(e.x, e.y - 24, 'PUSING!', 0, '#ffd34d');
          return;
        }
        if (e.tm <= 0) {
          e.s2 = 'rest';
          e.tm = .7;
        }
      } else {
        e.tm -= dt;
        if (e.tm <= 0) {
          e.s2 = 'move';
          e.cd = rg ? 1 : 1.6;
        }
      }
    }

    function miniFx(dt) {
      const L = lavaOn(), col = L ? '#ff8a2a' : '#82ff66', cs = L ? '255,130,40' : '150,255,110';
      MBH = MBH.filter(h => {
        if (h.k == 'r') {
          h.rr += h.rs * dt;
          if (!h.hit && p.dead <= 0 && Math.abs(Math.hypot(p.x - h.x, p.y - h.y) - h.rr) < 8 + p.r) {
            h.hit = 1;
            hurt(h.d);
          }
          return h.rr < h.max;
        }
        if (h.k == 'l' && h.o && h.t > h.mx * .4 && es.includes(h.o)) {
          h.x = h.o.x;
          h.y = h.o.y;
          h.a = Math.atan2(p.y - h.y, p.x - h.x);
        }
        h.t -= dt;
        if (h.t > 0)
          return true;
        if (h.k == 'l') {
          SFX.boom(14);
          shake = Math.max(shake, 4);
          const dx = Math.cos(h.a), dy = Math.sin(h.a);
          for (let i = 0; i < 26; i++)
            dp.push({
              k: 'p', x: h.x + dx * i * 14, y: h.y + dy * i * 14, vx: (R() - .5) * 30, vy: (R() - .5) * 30, life: .3 + R() * .2, max: .5, s: 2 + R() * 2, c: i % 2 ? col : '#fff'
            });
          const u = (p.x - h.x) * dx + (p.y - h.y) * dy;
          if (p.dead <= 0 && u > 0 && u < h.len && Math.abs(-(p.x - h.x) * dy + (p.y - h.y) * dx) < h.w + p.r)
            hurt(h.d);
          return false;
        }
        h.big ? SFX.slam() : SFX.boom(h.r);
        shake = Math.max(shake, h.big ? 7 : 3);
        fx.push({ k: 'ring', x: h.x, y: h.y, r: h.r, w: 3, life: .3, max: .3, col }, { k: 'gl', x: h.x, y: h.y, r: h.r * 1.4, c: cs, life: .25, max: .25 });
        for (let i = 0; i < (h.big ? 18 : 8); i++) {
          const a = R() * 6.283, s = 30 + R() * 90;
          dp.push({
            k: 'p', x: h.x, y: h.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * .6 - 20, life: .3 + R() * .3, max: .6, s: 1.5 + R() * 2, c: i % 3 ? col : '#fff'
          });
        }
        if (p.dead <= 0 && Math.hypot(p.x - h.x, p.y - h.y) < h.r + p.r)
          hurt(h.d);
        if (h.sh)
          for (let i = 0; i < h.sh; i++) {
            const q = i / h.sh * 6.283;
            pr.push({
              x: h.x, y: h.y, vx: Math.cos(q) * 110, vy: Math.sin(q) * 110, d: 9, r: 4.5, col: '#7dff5a', pb: 1, own: 'e', life: 2.2
            });
          }
        if (h.sp)
          for (let i = 0; i < 6; i++)
            dp.push({
              k: 'p', x: h.x + (R() - .5) * h.r, y: h.y, vx: 0, vy: -60 - R() * 60, life: .45, max: .45, s: 2, c: '#3c3c4a'
            });
        if (h.ring)
          MBH.push({ k: 'r', x: h.x, y: h.y, rr: h.r, max: 150, rs: h.rs, d: 12 });
        return false;
      });
    }
    const _updMBH = upd;
    upd = function (dt) {
      _updMBH(dt);
      if (lobby || room) {
        MBH = [];
        return;
      }
      if (!es.some(e => e.mini)) {
        MBH = [];
        return;
      }
      if (p.dead > 0)
        MBH = [];
      else if (!(HST > 0))
        miniFx(dt);
    };
    const _envMBH = envFx;
    envFx = function () {
      _envMBH();
      if (!MBH.length && !es.some(e => e.mini && e.s2 == 'wind' && e.atk == 'charge'))
        return;
      const L = lavaOn(), c = L ? '255,120,30' : '90,220,70';
      g.save();
      es.forEach(e => {
        if (e.mini && e.s2 == 'wind' && e.atk == 'charge') {
          const k = 1 - e.tm / e.tmx;
          g.save();
          g.translate(e.x, e.y);
          g.rotate(e.ca);
          g.fillStyle = 'rgba(' + c + ',' + (.12 + .28 * k) + ')';
          g.fillRect(0, -13, 150, 26);
          g.strokeStyle = 'rgba(' + c + ',.8)';
          g.strokeRect(.5, -12.5, 150, 25);
          g.restore();
        }
      });
      MBH.forEach(h => {
        if (h.k == 'r') {
          g.strokeStyle = 'rgba(' + c + ',.9)';
          g.lineWidth = 5;
          g.beginPath();
          g.arc(h.x, h.y, h.rr, 0, 7);
          g.stroke();
          g.strokeStyle = 'rgba(255,255,255,.7)';
          g.lineWidth = 1.5;
          g.beginPath();
          g.arc(h.x, h.y, h.rr, 0, 7);
          g.stroke();
          g.lineWidth = 1;
          return;
        }
        const k = 1 - h.t / h.mx;
        if (h.k == 'l') {
          g.save();
          g.translate(h.x, h.y);
          g.rotate(h.a);
          g.fillStyle = 'rgba(' + c + ',' + (.12 + .4 * k) + ')';
          g.fillRect(0, -h.w * (.3 + k), h.len, h.w * 2 * (.3 + k));
          g.restore();
          return;
        }
        if (h.sp) {
          g.fillStyle = 'rgba(232,226,204,' + (.25 + .6 * k) + ')';
          for (let i = -1; i <= 1; i++) {
            const hh = 4 + 16 * k;
            g.beginPath();
            g.moveTo(h.x + i * 9 - 4, h.y + 6);
            g.lineTo(h.x + i * 9, h.y + 6 - hh);
            g.lineTo(h.x + i * 9 + 4, h.y + 6);
            g.fill();
          }
        }
        if (h.ar) {
          const ay = h.y - 90 * (1 - k), gb = g.createRadialGradient(h.x, ay, 0, h.x, ay, 24);
          gb.addColorStop(0, 'rgba(170,255,130,.95)');
          gb.addColorStop(1, 'rgba(60,200,40,0)');
          g.fillStyle = gb;
          g.beginPath();
          g.arc(h.x, ay, 24, 0, 7);
          g.fill();
          g.fillStyle = '#2f9a2a';
          g.beginPath();
          g.arc(h.x, ay, 10, 0, 7);
          g.fill();
          g.fillStyle = '#d8ffc8';
          g.beginPath();
          g.arc(h.x - 3, ay - 3, 3.5, 0, 7);
          g.fill();
        }
        g.fillStyle = 'rgba(' + c + ',' + (.1 + .18 * k) + ')';
        g.beginPath();
        g.arc(h.x, h.y, h.r, 0, 7);
        g.fill();
        g.strokeStyle = 'rgba(' + c + ',' + (.5 + .4 * k) + ')';
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(h.x, h.y, h.r, 0, 7);
        g.stroke();
        g.lineWidth = 1;
        g.fillStyle = 'rgba(' + c + ',.35)';
        g.beginPath();
        g.arc(h.x, h.y, h.r * k, 0, 7);
        g.fill();
      });
      g.restore();
    };
    const _toBossDF = toBoss;
    toBoss = function () {
      _toBossDF(); const b = es.find(x => x.k == 'boss'); if (b) {
        b.hp = b.mhp = Math.round(b.mhp * (1 + (DF[DIFF].hp - 1) * .6));
      }
    };
    /* ===== MINI BOS TEMA SALJU (Level 3) =====
       KSATRIA SALJU BERKUDA (jarak dekat) : kesatria berzirah es menunggang kuda salju bertanduk, tombak es panjang
       · gallop  — menerjang berkali-kali (2x, mengamuk 3x), memutar balik tanpa pusing, meninggalkan jejak beku
       · jab     — tusukan tombak berbentuk kipas + 3 pecahan es ke depan, lantai depan membeku
       · cage    — kuda berdiri, sangkar es muncul MENGELILINGI pemain: tetap di lingkaran tengah, JANGAN lari keluar!
       TURET ES HIDUP (jarak jauh) : turet kristal berakar, 1 mata besar yang mengikuti pemain, diam di tempat
       · spiral  — menyemburkan peluru berputar (pusaran 2 lengan, mengamuk 3 lengan)
       · beam    — sinar es menyapu busur lebar (garis peringatan + area sapuan)
       · mortar  — melontarkan bola salju, mendarat berurutan dan meninggalkan zona beku
       · roots   — (jika pemain terlalu dekat) akar es menyembul dari tanah di sekeliling turet */
    let IMH = []; /* hazard mini bos salju: c lingkaran tunda, cm penanda zona aman, bm sinar sapu */
    const iCl = (v, a, b) => Math.max(a, Math.min(b, v)), iAd = d => Math.atan2(Math.sin(d), Math.cos(d));
    const ICE_COL = '#9fe4ff', ICE_CS = '150,220,255';

    function iceShard(x, y, n, v0, up, cols) {
      for (let i = 0; i < n; i++) {
        const a = R() * 6.283, v = v0 * (.4 + R());
        dp.push({
          k: 'sh', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .7 - up, rot: a, vr: (R() - .5) * 14, life: .7 + R() * .5, max: 1.2, s: 2 + R() * 2.6, c: cols || '190,235,255'
        });
      }
    }

    function iceShot(x, y, a, v, d) {
      pr.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, d, r: 4.5, col: ICE_COL, own: 'e', life: 3.2, rock: 1, ic: 1, ib: 1, rot: 0, vr: 0, sd: R() * 50
      });
    }
    /* BOLA ES: gambar proyektil mini bos salju sebagai bola es (bukan pecahan runcing) */
    function drawIceBall(b) {
      const pu = .5 + .5 * Math.sin(t * 9 + (b.sd || 0)), R1 = 7 + pu * .8;
      g.save();
      g.translate(b.x, b.y);
      g.globalCompositeOperation = 'lighter';
      const o = g.createRadialGradient(0, 0, 2, 0, 0, 17);
      o.addColorStop(0, 'rgba(190,240,255,' + (.55 + .2 * pu) + ')');
      o.addColorStop(1, 'rgba(70,170,255,0)');
      g.fillStyle = o;
      g.fillRect(-17, -17, 34, 34);
      g.globalCompositeOperation = 'source-over';
      const sp = g.createRadialGradient(-2.2, -2.4, .8, 0, 0, R1);
      sp.addColorStop(0, '#ffffff');
      sp.addColorStop(.35, '#d9f6ff');
      sp.addColorStop(.75, '#7fcbff');
      sp.addColorStop(1, '#3f94e0');
      g.fillStyle = sp;
      g.beginPath();
      g.arc(0, 0, R1, 0, 7);
      g.fill();
      g.strokeStyle = 'rgba(235,252,255,.9)';
      g.lineWidth = 1;
      g.beginPath();
      g.arc(0, 0, R1, 0, 7);
      g.stroke();
      g.save();
      g.rotate(t * 2 + (b.sd || 0));
      g.strokeStyle = 'rgba(255,255,255,.55)';
      g.lineWidth = .8;
      g.beginPath();
      g.moveTo(-3, 1);
      g.lineTo(0, -1.5);
      g.lineTo(3.2, .8);
      g.moveTo(0, -1.5);
      g.lineTo(.6, 3.6);
      g.stroke();
      g.restore();
      g.fillStyle = 'rgba(255,255,255,.95)';
      g.beginPath();
      g.ellipse(-2.4, -2.8, 2, 1.2, -.6, 0, 7);
      g.fill();
      g.restore();
    }

    /* ---------- AI ---------- */
    function iceMiniTick(e, dt) {
      const mel = e.mini == 'mel', rg = e.rg ? 1 : 0, tm = n => n * (rg ? .8 : 1);
      e.fl -= dt;
      e.cd -= dt;
      e.stg = 0;
      e.stun = 0;
      e.wind = 0;
      e.an = 0;
      const act = e.s2 == 'act';
      if (mel) {
        if (!act) {
          mv(e, e.vx * dt, e.vy * dt);
          e.vx *= Math.pow(.02, dt);
          e.vy *= Math.pow(.02, dt);
        }
      } else {
        e.vx = e.vy = 0;
      }
      if (p.dead > 0) {
        e.s2 = 'move';
        return;
      }
      if (!e.s2)
        e.s2 = 'move';
      const d = dist(e, p), a = ang(e, p);
      if (!mel) { /* turet: mata & moncong mengikuti pemain (kecuali saat spiral / sinar) */
        if (e.ta == null)
          e.ta = a;
        if (!act && !(e.s2 == 'wind' && e.atk == 'beam'))
          e.ta += iAd(a - e.ta) * Math.min(1, dt * (e.s2 == 'wind' ? 2.5 : 5));
      }
      if (e.s2 == 'move') {
        e.dz = 0;
        if (mel && d > 50)
          mv(e, Math.cos(a) * e.sp * 1.5 * dt, Math.sin(a) * e.sp * 1.5 * dt);
        if (e.cd > 0)
          return;
        const o = mel ? (d < 85 ? ['jab', 'jab', 'cage', 'gallop'] : d < 170 ? ['gallop', 'cage', 'jab'] : ['gallop', 'gallop', 'cage'])
          : (d < 95 ? ['roots', 'spiral', 'mortar'] : ['spiral', 'beam', 'mortar', 'beam']);
        let k = o[Math.floor(R() * o.length)];
        if (k == e.lk && o.length > 1)
          k = o[(o.indexOf(k) + 1) % o.length];
        e.lk = k;
        const dur = tm({ gallop: .85, jab: .7, cage: 1.0, spiral: .7, beam: .95, mortar: .8, roots: .8 }[k]);
        e.s2 = 'wind';
        e.atk = k;
        e.tmx = e.tm = dur;
        e.ca = a;
        e.hit = 0;
        SFX.warn(mel ? 0 : 1);
        SFX.bossVo(bossVid(e), k);
        if (k == 'gallop')
          e.gp = rg ? 2 : 1;
        if (k == 'cage') {
          const q = dur + .2, cx = iCl(p.x, 90, DW - 90), cy = iCl(p.y, 90, DH - 90), n = rg ? 9 : 7, r0 = R() * 6.283;
          IMH.push({ k: 'cm', x: cx, y: cy, r: 38, t: q, mx: q });
          for (let i = 0; i < n; i++) {
            const aa = r0 + i / n * 6.283;
            IMH.push({ k: 'c', x: cx + Math.cos(aa) * 68, y: cy + Math.sin(aa) * 68, r: 27, t: q, mx: q, d: 14, fz: 1 });
          }
        }
        if (k == 'beam') {
          const s = R() < .5 ? -1 : 1, st = rg ? 1.3 : 1.6, a0 = a - s * .8;
          IMH.push({ k: 'bm', o: e, a: a0, a0, s, sw: 1.6, warm: dur, t: dur + st, mx: dur + st, len: 340, w: 7, d: 15, cool: 0 });
          e.bst = st;
        }
        if (k == 'roots')
          IMH.push({ k: 'c', x: e.x, y: e.y + 4, r: 64, t: dur, mx: dur, d: 15, fz: 1, sh: rg ? 10 : 7, big: 1, rt: 1 });
      } else if (e.s2 == 'wind') {
        e.tm -= dt;
        if ((e.atk == 'gallop' && e.tm > e.tmx * .4) || (e.atk == 'jab' && e.tm > e.tmx * .35))
          e.ca = a;
        if (e.tm > 0)
          return;
        if (e.atk == 'gallop') {
          e.s2 = 'act';
          e.tm = .42;
          e.hit = 0;
          e.tz = 0;
          SFX.dodge();
          SFX.bossVo('ik', 'dash');
          return;
        }
        if (e.atk == 'jab') {
          const R0 = rg ? 112 : 100, n = rg ? 5 : 3, ca = e.ca;
          SFX.eshot();
          SFX.slam();
          shake = Math.max(shake, 5);
          if (d < R0 + p.r && Math.abs(iAd(a - ca)) < .62)
            hurt(17);
          for (let i = 0; i < n; i++)
            iceShot(e.x + Math.cos(ca) * 20, e.y, ca + (i - (n - 1) / 2) * .24, 200, 10);
          for (let i = 1; i <= 3; i++) {
            const zx = e.x + Math.cos(ca) * (28 + i * 26), zy = e.y + Math.sin(ca) * (28 + i * 26);
            IZ.push({ x: zx, y: zy, r: 22, life: 2.2 });
            fx.push({ k: 'ring', x: zx, y: zy, r: 22, w: 2, life: .3, max: .3, col: ICE_COL });
            iceShard(zx, zy, 4, 60, 30);
          }
          fx.push({
            k: 'ring', x: e.x + Math.cos(ca) * 40, y: e.y + Math.sin(ca) * 40, r: 50, w: 3, life: .3, max: .3, col: '#e8fbff'
          });
        }
        if (e.atk == 'mortar') {
          const n = (rg ? 5 : 3) + (dfx().shots > 1 ? 1 : 0);
          SFX.eshot();
          shake = Math.max(shake, 3);
          fx.push({ k: 'ring', x: e.x, y: e.y - 30, r: 28, w: 3, life: .3, max: .3, col: ICE_COL });
          for (let i = 0; i < n; i++) {
            const q = .85 + i * .22;
            IMH.push({
              k: 'c', x: iCl(i ? p.x + (R() - .5) * 170 : p.x, 30, DW - 30), y: iCl(i ? p.y + (R() - .5) * 120 : p.y, 30, DH - 30), r: 30, t: q, mx: q, d: 14, sn: 1, fz: 1
            });
          }
          e.s2 = 'rest';
          e.tm = .9 + n * .15;
          return;
        }
        if (e.atk == 'spiral') {
          e.s2 = 'act';
          e.tm = rg ? 2.3 : 1.9;
          e.spa = e.ta;
          e.spd = R() < .5 ? -1 : 1;
          e.spt = 0;
          e.spn = 0;
          return;
        }
        if (e.atk == 'beam') {
          e.s2 = 'act';
          e.tm = e.bst || 1.6;
          return;
        }
        e.s2 = 'rest';
        e.tm = e.atk == 'jab' ? .8 : 1.0;
      } else if (e.s2 == 'act') {
        e.tm -= dt;
        if (mel) { /* satu lintasan terjangan */
          const ox = e.x, oy = e.y, sp = rg ? 440 : 400;
          mv(e, Math.cos(e.ca) * sp * dt, Math.sin(e.ca) * sp * dt);
          const mvd = Math.hypot(e.x - ox, e.y - oy);
          e.tz = (e.tz || 0) + mvd;
          if (e.tz > 26) {
            e.tz = 0;
            IZ.push({ x: e.x, y: e.y + 4, r: 20, life: 2.4 });
          }
          if (R() < .9)
            dp.push({
              k: 'p', x: e.x + (R() - .5) * 18, y: e.y + 7, vx: (R() - .5) * 30, vy: -10 - R() * 24, life: .45, max: .45, s: 1.5 + R() * 2, c: R() < .5 ? '#e8fbff' : '#9fd8ff'
            });
          if (!e.hit && dist(e, p) < e.r + p.r + 6) {
            e.hit = 1;
            hurt(16);
          }
          const blocked = mvd < .3;
          if (blocked || e.tm <= 0) {
            if (e.gp > 0 && !blocked) {
              e.gp--;
              e.s2 = 'wind';
              e.atk = 'gallop';
              e.tmx = e.tm = .4;
              e.ca = a;
              e.hit = 0;
              SFX.warn(0);
            } else {
              e.s2 = 'rest';
              e.tm = blocked ? 1.3 : .9;
              if (blocked) {
                shake = Math.max(shake, 6);
                SFX.slam();
                fx.push({ k: 'ring', x: e.x, y: e.y, r: 34, w: 3, life: .3, max: .3, col: ICE_COL });
                dn(e.x, e.y - 34, 'TERPELESET!', 0, '#bfeaff');
                iceShard(e.x, e.y, 8, 70, 20);
              }
            }
          }
        } else if (e.atk == 'spiral') { /* pusaran peluru berputar */
          e.spa += e.spd * dt * (rg ? 3.9 : 3.2);
          e.ta = e.spa;
          e.spt -= dt;
          if (e.spt <= 0) {
            e.spt = rg ? .09 : .11;
            const arms = rg ? 3 : 2;
            if (!(e.spn++ % 3))
              SFX.eshot();
            for (let i = 0; i < arms; i++)
              iceShot(e.x + Math.cos(e.spa + i * 6.2832 / arms) * 16, e.y - 6, e.spa + i * 6.2832 / arms, rg ? 135 : 120, 9);
          }
          if (e.tm <= 0) {
            e.s2 = 'rest';
            e.tm = .9;
          }
        } else { /* beam: sinar ditangani hazard 'bm' */
          if (e.tm <= 0) {
            e.s2 = 'rest';
            e.tm = .9;
          }
        }
      } else {
        e.tm -= dt;
        if (e.tm <= 0) {
          e.s2 = 'move';
          e.cd = rg ? .9 : 1.5;
        }
      }
    }

    /* ---------- hazard (lingkaran tunda, sinar sapu) ---------- */
    function iceHaz(h, dt) {
      if (h.k == 'bm') {
        if (!es.includes(h.o) || h.o.dying)
          return false;
        h.t -= dt;
        const el = h.mx - h.t;
        if (el >= h.warm) {
          h.a = h.a0 + h.s * h.sw * iCl((el - h.warm) / (h.mx - h.warm), 0, 1);
          if (!h.live) {
            h.live = 1;
            SFX.boom(18);
            shake = Math.max(shake, 3);
          }
          h.o.ta = h.a;
        } else
          h.o.ta += iAd(h.a0 - h.o.ta) * Math.min(1, dt * 7);
        if (h.live) {
          h.cool -= dt;
          const dx = Math.cos(h.a), dy = Math.sin(h.a), ox = h.o.x, oy = h.o.y, u = (p.x - ox) * dx + (p.y - oy) * dy, v = Math.abs(-(p.x - ox) * dy + (p.y - oy) * dx);
          if (u > 12 && u < h.len && v < h.w + p.r && h.cool <= 0 && p.inv <= 0) {
            h.cool = .45;
            hurt(h.d);
          }
          if (R() < dt * 70) {
            const uu = 20 + R() * (h.len - 20);
            dp.push({
              k: 'p', x: ox + dx * uu, y: oy + dy * uu, vx: (R() - .5) * 24, vy: (R() - .5) * 24 - 8, life: .3, max: .3, s: 1.5 + R() * 2, c: R() < .5 ? '#e8fbff' : ICE_COL
            });
          }
        }
        return h.t > 0;
      }
      h.t -= dt;
      if (h.t > 0)
        return true;
      if (h.k == 'cm')
        return false;
      h.big ? SFX.slam() : SFX.boom(h.r);
      shake = Math.max(shake, h.big ? 7 : 3);
      fx.push({ k: 'ring', x: h.x, y: h.y, r: h.r, w: 3, life: .3, max: .3, col: ICE_COL }, { k: 'gl', x: h.x, y: h.y, r: h.r * 1.4, c: ICE_CS, life: .25, max: .25 }, { k: 'pil', x: h.x, y: h.y, w: h.r * 1.1, h: 90, c: '190,235,255', life: .3, max: .3 });
      iceShard(h.x, h.y, h.big ? 14 : 7, 90, 30);
      if (p.dead <= 0 && Math.hypot(p.x - h.x, p.y - h.y) < h.r + p.r)
        hurt(h.d);
      if (h.fz)
        IZ.push({ x: h.x, y: h.y, r: h.r * 1.05, life: h.rt ? 3 : 2.6 });
      if (h.sh)
        for (let i = 0; i < h.sh; i++)
          iceShot(h.x, h.y, i / h.sh * 6.283, 105, 9);
      return false;
    }
    const _updIM = upd;
    upd = function (dt) {
      _updIM(dt);
      if (lobby || room || !iceR() || !es.some(e => e.mini && e.ice) || p.dead > 0) {
        IMH = [];
        return;
      }
      if (!(HST > 0))
        IMH = IMH.filter(h => iceHaz(h, dt));
      es.forEach(e => {
        if (!e.mini || !e.ice || e.sw > 0)
          return;
        if (e.mini == 'mel') {
          if ((e.wm || 0) > .4 && R() < dt * 26)
            dp.push({
              k: 'p', x: e.x + (R() - .5) * 20, y: e.y + 8, vx: -(e.svx || 0) * .15 + (R() - .5) * 20, vy: -10 - R() * 20, life: .5, max: .5, s: 1.5 + R() * 2, c: R() < .5 ? '#e8fbff' : '#9fd8ff'
            });
        } else if (R() < dt * 10)
          dp.push({
            k: 'p', x: e.x + (R() - .5) * 50, y: e.y + 8, vx: 0, vy: -14 - R() * 18, life: .8, max: .8, s: 1.5 + R(), c: '#d6f6ff'
          });
      });
    };

    /* ---------- telegraf serangan ---------- */
    const _envIM = envFx;
    envFx = function () {
      _envIM();
      if (!iceR() || lobby || room)
        return;
      const ms = es.filter(e => e.mini && e.ice && e.sw <= 0);
      if (!ms.length && !IMH.length)
        return;
      g.save();
      ms.forEach(e => {
        if (e.s2 != 'wind' || !e.tmx)
          return;
        const k = 1 - e.tm / e.tmx, rg = e.rg ? 1 : 0;
        if (e.atk == 'gallop') { /* jalur terjangan */
          g.save();
          g.translate(e.x, e.y);
          g.rotate(e.ca);
          const L = (rg ? 185 : 170) + 20;
          g.fillStyle = 'rgba(130,215,255,' + (.1 + .25 * k) + ')';
          g.fillRect(0, -30, L, 60);
          g.strokeStyle = 'rgba(190,240,255,.8)';
          g.lineWidth = 1.5;
          g.strokeRect(.5, -29.5, L, 59);
          g.fillStyle = 'rgba(232,251,255,' + (.25 + .4 * k) + ')';
          for (let i = 0; i < 5; i++) {
            const x = ((t * 80 + i * 40) % L);
            g.beginPath();
            g.moveTo(x, -8);
            g.lineTo(x + 10, 0);
            g.lineTo(x, 8);
            g.lineTo(x + 3, 0);
            g.closePath();
            g.fill();
          }
          g.restore();
        }
        if (e.atk == 'jab') { /* kipas tusukan tombak */
          const R0 = rg ? 112 : 100;
          g.save();
          g.translate(e.x, e.y);
          g.rotate(e.ca);
          g.fillStyle = 'rgba(130,215,255,' + (.1 + .3 * k) + ')';
          g.beginPath();
          g.moveTo(0, 0);
          g.arc(0, 0, R0 * (.55 + .45 * k), -.62, .62);
          g.closePath();
          g.fill();
          g.strokeStyle = 'rgba(200,245,255,' + (.5 + .4 * k) + ')';
          g.lineWidth = 1.5;
          g.beginPath();
          g.moveTo(0, 0);
          g.arc(0, 0, R0, -.62, .62);
          g.closePath();
          g.stroke();
          g.restore();
        }
        if (e.mini == 'rng' && (e.atk == 'spiral' || e.atk == 'beam' || e.atk == 'mortar')) {
          g.strokeStyle = 'rgba(190,240,255,' + (.3 + .5 * k) + ')';
          g.lineWidth = 1.5;
          g.beginPath();
          g.ellipse(e.x, e.y + 7, 18 + k * 22, 6 + k * 8, 0, 0, 7);
          g.stroke();
        }
      });
      IMH.forEach(h => {
        const k = 1 - h.t / h.mx;
        if (h.k == 'cm') { /* penanda ZONA AMAN sangkar es */
          g.save();
          g.strokeStyle = 'rgba(255,255,255,' + (.35 + .35 * Math.sin(t * 12)) + ')';
          g.lineWidth = 2;
          g.setLineDash([5, 5]);
          g.lineDashOffset = -t * 30;
          g.beginPath();
          g.arc(h.x, h.y, h.r, 0, 7);
          g.stroke();
          g.setLineDash([]);
          g.fillStyle = 'rgba(170,235,255,' + (.06 + .1 * k) + ')';
          g.beginPath();
          g.arc(h.x, h.y, h.r, 0, 7);
          g.fill();
          g.font = 'bold 8px monospace';
          g.textAlign = 'center';
          g.fillStyle = 'rgba(232,251,255,.85)';
          g.fillText('AMAN', h.x, h.y + 3);
          g.restore();
          return;
        }
        if (h.k == 'bm') {
          const ox = h.o.x, oy = h.o.y, a1 = h.a0 + h.s * h.sw;
          if (!h.live) {
            const kw = iCl((h.mx - h.t) / h.warm, 0, 1);
            g.fillStyle = 'rgba(150,220,255,' + (.05 + .08 * kw) + ')';
            g.beginPath();
            g.moveTo(ox, oy);
            g.arc(ox, oy, h.len, Math.min(h.a0, a1), Math.max(h.a0, a1));
            g.closePath();
            g.fill();
            g.save();
            g.translate(ox, oy);
            g.rotate(h.a0);
            g.strokeStyle = 'rgba(200,245,255,' + (.3 + .6 * kw) + ')';
            g.lineWidth = 1.5;
            g.setLineDash([8, 6]);
            g.lineDashOffset = -t * 40;
            g.beginPath();
            g.moveTo(12, 0);
            g.lineTo(h.len, 0);
            g.stroke();
            g.restore();
          } else {
            g.fillStyle = 'rgba(150,220,255,.06)';
            g.beginPath();
            g.moveTo(ox, oy);
            g.arc(ox, oy, h.len, Math.min(h.a0, a1), Math.max(h.a0, a1));
            g.closePath();
            g.fill();
            g.save();
            g.translate(ox, oy);
            g.rotate(h.a);
            g.globalCompositeOperation = 'lighter';
            const wv = 1 + .15 * Math.sin(t * 50);
            g.fillStyle = 'rgba(90,170,255,.35)';
            g.fillRect(12, -h.w * 1.4 * wv, h.len - 12, h.w * 2.8 * wv);
            g.fillStyle = 'rgba(190,240,255,.8)';
            g.fillRect(12, -h.w * .7 * wv, h.len - 12, h.w * 1.4 * wv);
            g.fillStyle = 'rgba(255,255,255,.95)';
            g.fillRect(12, -h.w * .25, h.len - 12, h.w * .5);
            g.restore();
          }
          return;
        }
        if (h.sn) {
          const ay = h.y - 100 * (1 - k);
          g.save();
          g.globalCompositeOperation = 'lighter';
          const gb = g.createRadialGradient(h.x, ay, 0, h.x, ay, 22);
          gb.addColorStop(0, 'rgba(220,248,255,.95)');
          gb.addColorStop(1, 'rgba(90,170,255,0)');
          g.fillStyle = gb;
          g.beginPath();
          g.arc(h.x, ay, 22, 0, 7);
          g.fill();
          g.restore();
          g.fillStyle = '#e8fbff';
          g.beginPath();
          g.arc(h.x, ay, 8, 0, 7);
          g.fill();
          g.fillStyle = '#9fd8ff';
          g.beginPath();
          g.arc(h.x + 2, ay + 2, 5, 0, 7);
          g.fill();
        }
        g.fillStyle = 'rgba(130,215,255,' + (.1 + .18 * k) + ')';
        g.beginPath();
        g.arc(h.x, h.y, h.r, 0, 7);
        g.fill();
        g.strokeStyle = 'rgba(200,245,255,' + (.5 + .4 * k) + ')';
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(h.x, h.y, h.r, 0, 7);
        g.stroke();
        g.lineWidth = 1;
        g.fillStyle = 'rgba(232,251,255,' + (.3 + .5 * k) + ')';
        for (let i = 0; i < 6; i++) {
          const aa = i * 1.047 + h.x, rr = h.r * .65, x = h.x + Math.cos(aa) * rr, y = h.y + Math.sin(aa) * rr, hh = 3 + 12 * k;
          g.beginPath();
          g.moveTo(x - 2.5, y + 3);
          g.lineTo(x, y + 3 - hh);
          g.lineTo(x + 2.5, y + 3);
          g.closePath();
          g.fill();
        }
        g.fillStyle = 'rgba(160,225,255,.3)';
        g.beginPath();
        g.arc(h.x, h.y, h.r * k, 0, 7);
        g.fill();
      });
      g.restore();
    };

    /* ---------- MODEL ---------- */
    function iceMiniDraw(e) {
      const mel = e.mini == 'mel', en = e.rg ? 1 : 0, s0 = e.msz, fy = e.y + 7, ph = t + e.ph, pu = .5 + .5 * Math.sin(t * (en ? 8 : 4) + e.ph);
      const sp = e.sw > 0 ? Math.max(0, Math.min(1, 1 - e.sw / (e.st || 1.4))) : 1, ez = 1 - (1 - sp) * (1 - sp), wd = e.s2 == 'wind', ak = wd && e.tmx ? iCl(1 - e.tm / e.tmx, 0, 1) : 0, atk = e.atk, st = e.s2;
      const dir = e.fdr == null ? (p.x < e.x ? -1 : 1) : e.fdr, F = q => e.fl > 0 ? '#fff' : q, R_ = (q, x, y, w, h) => { g.fillStyle = F(q); g.fillRect(x, y, w, h); };
      const PG = (c, a) => { g.fillStyle = F(c); g.beginPath(); a.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill(); };
      const cc = en ? '255,110,100' : '140,220,255', ey = en ? '#ff5a4a' : '#7ff3ff', wm = e.wm || 0, gp = e.gp2 || 0;
      /* bayangan + cahaya dasar */
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.beginPath();
      g.ellipse(e.x, fy + 1, (mel ? 26 : 19) * (.4 + .6 * sp), 5.5, 0, 0, 7);
      g.fill();
      g.save();
      g.globalCompositeOperation = 'lighter';
      const q0 = g.createRadialGradient(e.x, fy, 2, e.x, fy, 44 + en * 8);
      q0.addColorStop(0, 'rgba(' + cc + ',' + (.22 + .16 * pu + en * .12) + ')');
      q0.addColorStop(1, 'rgba(' + cc + ',0)');
      g.fillStyle = q0;
      g.beginPath();
      g.ellipse(e.x, fy, 44 + en * 8, 15, 0, 0, 7);
      g.fill();
      g.restore();
      /* muncul: lingkaran sihir salju + pilar cahaya */
      if (sp < 1) {
        g.save();
        g.translate(e.x, fy);
        g.globalCompositeOperation = 'lighter';
        const al = 1 - sp * .6;
        g.strokeStyle = 'rgba(150,225,255,' + al + ')';
        g.lineWidth = 2;
        g.save();
        g.scale(1, .38);
        g.rotate(t * 2);
        g.beginPath();
        g.arc(0, 0, 34, 0, 7);
        g.stroke();
        g.setLineDash([5, 6]);
        g.beginPath();
        g.arc(0, 0, 24, 0, 7);
        g.stroke();
        g.setLineDash([]);
        g.restore();
        const hh = 100 * Math.sin(sp * 3.1416), pg = g.createLinearGradient(0, 0, 0, -hh);
        pg.addColorStop(0, 'rgba(170,230,255,' + .55 * al + ')');
        pg.addColorStop(1, 'rgba(170,230,255,0)');
        g.fillStyle = pg;
        g.fillRect(-16, -hh, 32, hh);
        g.restore();
      }
      g.save();
      g.globalAlpha = Math.min(1, sp * 1.6);
      g.translate(e.x, fy);
      const gr = .3 + .7 * ez, sq = e.sqs == null ? 1 : e.sqs;
      if (mel) {
        /* ================= KSATRIA SALJU BERKUDA ================= */
        g.rotate((e.lean || 0) * .6 + (e.ac || 0) * .08);
        g.scale(dir * s0 * .85 * gr * sq, s0 * .85 * gr * (2 - sq));
        const gall = Math.max(e.ac || 0, wd && atk == 'gallop' ? ak * .6 : 0);
        const tRear = wd && atk == 'cage' ? iCl(ak * 2.2, 0, 1) : 0;
        e.rr = (e.rr || 0) + (tRear - (e.rr || 0)) * .18;
        const tLj = wd && atk == 'jab' ? -ak * 9 : (st == 'rest' && atk == 'jab' && e.tm > .35 ? 14 : 0);
        e.lj = (e.lj || 0) + (tLj - (e.lj || 0)) * .3;
        const rear = e.rr, lj = e.lj, bobH = Math.sin(ph * 3) * .5 - Math.abs(Math.sin(gp)) * 2.2 * wm;
        const HB = '#eaf6fd', HS = '#bcd9ee', HD = '#86aed0', BL = '#3b78b8', BL2 = '#2a5a94', TR = '#dff4ff', SL = '#a9c9e2';
        g.translate(-14, 0);
        g.rotate(-rear * .6);
        g.translate(14, bobH);
        const leg = (x, phs, col, front) => {
          const sw = Math.sin(gp * 2 + phs) * 6 * wm * (1 - gall) + (front ? 8 : -8) * gall, lift = Math.max(0, Math.cos(gp * 2 + phs)) * 5 * wm * (1 - gall) + gall * 5 + (front ? rear * 11 : 0), hx = x + sw, hy = -2 - lift;
          PG(col, [
            [x - 2.5, -17], [x + 3, -17], [x + 3 + sw * .5, -9 - lift * .5], [hx + 2.5, hy - 2], [hx - 2.5, hy - 2], [x - 3 + sw * .5, -9 - lift * .5]
          ]);
          R_('#26486a', hx - 3.5, hy - 1.5, 7, 3);
          R_('#bfeaff', hx - 3.5, hy - 1.5, 7, 1);
        };
        leg(-10, 3.1, HD, 0);
        leg(20, 2.2, HD, 1);
        const tw = Math.sin(t * 5 + e.ph) * 3 + wm * 5 + gall * 6; /* ekor es */
        PG('#9fdcff', [[-21, -34], [-30, -33 + tw * .3], [-37 - tw, -22 + tw * .5], [-33 - tw * .6, -12], [-30, -22], [-24, -27]]);
        PG('#e8fbff', [[-22, -33], [-29, -31 + tw * .3], [-34 - tw * .8, -21], [-28, -27]]);
        PG(HS, [
          [-23, -33], [-15, -37], [8, -37], [18, -35], [23, -29], [21, -21], [10, -16], [-10, -16], [-20, -20], [-25, -27]
        ]);
        PG(HB, [[-22, -33], [-15, -37], [8, -37], [18, -35], [21, -31], [8, -29], [-14, -29], [-23, -29]]);
        PG(BL, [[-15, -36], [9, -36], [12, -19], [-14, -18]]);
        PG(BL2, [[-14, -22], [12, -22], [12, -19], [-14, -18]]);
        R_(TR, -14, -37, 24, 1);
        R_(TR, -14, -19, 26, 1);
        PG(TR, [[-1, -33], [3, -29], [-1, -25], [-5, -29]]);
        for (let i = 0; i < 6; i++)
          PG(TR, [[-13 + i * 4.5, -18], [-10 + i * 4.5, -18], [-11.5 + i * 4.5, -13 + Math.sin(t * 4 + i) * .8]]);
        R_('#223d5c', -7, -40, 13, 3);
        leg(-16, 0, HB, 0);
        leg(14, 5.3, HB, 1);
        const nod = Math.sin(ph * 2.2) * 1.2 + gall * 3 - rear * 3 + (wd && atk == 'gallop' ? ak * 2 : 0);
        PG(SL, [[14, -37], [22, -35], [23, -24], [15, -20]]);
        PG(HB, [[16, -38], [24, -38], [31, -53 + nod], [25, -56 + nod], [17, -47]]);
        PG(HS, [[24, -38], [27, -37], [33, -52 + nod], [31, -53 + nod]]);
        for (let i = 0; i < 6; i++) {
          const mx = 17 + i * 2.6, my = -41 - i * 2.4 + nod * (i / 6);
          PG(i % 2 ? '#7fd4ff' : '#e8fbff', [[mx, my + 3], [mx - 5 - Math.sin(t * 6 + i) * 1.5 - wm * 3, my - 2], [mx + 2, my - 1]]);
        }
        PG(HB, [[26, -57 + nod], [34, -59 + nod], [43, -49 + nod], [42, -44 + nod], [36, -45 + nod], [28, -50 + nod]]);
        PG(BL, [[29, -57 + nod], [34, -58 + nod], [41, -50 + nod], [38, -50 + nod], [31, -52 + nod]]);
        PG('#d6f6ff', [[35, -59 + nod], [41, -70 + nod], [38, -58 + nod]]);
        PG(HB, [[27, -57 + nod], [29, -64 + nod], [32, -58 + nod]]);
        R_(HD, 40, -47 + nod, 3, 2);
        R_(ey, 33, -54 + nod, 3, 2);
        for (let i = 0; i < 3; i++) {
          const u = (t * 1.4 + i * .33) % 1;
          g.fillStyle = 'rgba(255,255,255,' + (.55 * (1 - u)) + ')';
          g.beginPath();
          g.arc(44 + u * 9, -46 + nod - u * 5, 1 + u * 2.4, 0, 7);
          g.fill();
        }
        /* penunggang */
        const rb = Math.sin(gp * 2) * 1.2 * wm, cf = wm * 7 + gall * 8 + Math.sin(t * 6) * 1.5 + rear * 6;
        PG('#9fd3f0', [[-4, -58 + rb], [-9, -40], [-25 - cf, -33 + cf * .3], [-20 - cf * .6, -50 + rb]]);
        PG('#e8fbff', [[-4, -57 + rb], [-8, -41], [-18 - cf * .7, -37 + cf * .2], [-14 - cf * .4, -52 + rb]]);
        PG(BL, [[-12, -54 + rb], [-5, -56 + rb], [-5, -44 + rb], [-8, -40 + rb], [-12, -44 + rb]]);
        PG(TR, [[-9, -52 + rb], [-8, -48 + rb], [-9, -44 + rb], [-10, -48 + rb]]);
        PG('#d3ecfa', [[-3, -40], [4, -40], [8, -32], [5, -27], [1, -31]]);
        R_('#26486a', 3, -29, 6, 3);
        PG('#dff3fd', [[-7, -41 + rb], [7, -41 + rb], [6, -57 + rb], [-6, -57 + rb]]);
        PG(SL, [[0, -41 + rb], [7, -41 + rb], [6, -57 + rb], [0, -57 + rb]]);
        R_(BL, -7, -43 + rb, 14, 2);
        PG('#4aa0ec', [[0, -54 + rb], [3, -50 + rb], [0, -46 + rb], [-3, -50 + rb]]);
        PG('#bfe3f7', [[-9, -57 + rb], [-3, -60 + rb], [-3, -53 + rb], [-9, -52 + rb]]);
        PG('#bfe3f7', [[9, -57 + rb], [3, -60 + rb], [3, -53 + rb], [9, -52 + rb]]);
        PG('#e8fbff', [[-9, -57 + rb], [-13, -66 + rb], [-6, -59 + rb]]);
        PG('#e8fbff', [[9, -57 + rb], [13, -65 + rb], [6, -59 + rb]]);
        PG('#7fd4ff', [[-4, -70 + rb], [-12 - cf * .5, -68 + cf * .2 + rb], [-7, -63 + rb]]);
        R_('#26486a', -5, -61 + rb, 10, 3);
        PG('#cfeaf8', [[-6, -59 + rb], [-5, -69 + rb], [0, -72 + rb], [5, -69 + rb], [6, -59 + rb]]);
        R_('#0b1a2a', -5, -66 + rb, 11, 3);
        R_(ey, -3, -65.5 + rb, 3, 2);
        R_(ey, 2, -65.5 + rb, 3, 2);
        R_('#e8fbff', -5, -70 + rb, 11, 1);
        for (let i = -1; i <= 1; i++)
          PG('#bfeaff', [[i * 3.5 - 2, -71 + rb], [i * 3.5, -71 - (i ? 7 : 11) + rb], [i * 3.5 + 2, -71 + rb]]);
        const la = wd && atk == 'cage' ? -.9 - ak * .5 : st == 'rest' && atk == 'cage' ? -.5 : atk == 'gallop' && (wd || st == 'act') ? .06 : -.12;
        PG('#bfe3f7', [[3, -54 + rb], [9, -52 + rb], [12, -46 + rb], [8, -45 + rb]]);
        g.save();
        g.translate(10, -46 + rb);
        g.rotate(la);
        R_(SL, -16 + lj, -1.5, 66, 3);
        R_('#e8fbff', -16 + lj, -1.5, 66, 1);
        PG('#e8fbff', [[50 + lj, -4], [68 + lj, 0], [50 + lj, 4]]);
        PG('#7fd4ff', [[50 + lj, -2], [61 + lj, 0], [50 + lj, 2]]);
        PG(BL, [[32 + lj, -1], [46 + lj, -4 + Math.sin(t * 9) * 3], [46 + lj, 5 + Math.sin(t * 9 + 1) * 3], [32 + lj, 2]]);
        R_('#bfe3f7', -4 + lj, -3, 5, 6);
        if (wd && (atk == 'jab' || atk == 'gallop'))
          iceGlow(66 + lj, 0, 8 + ak * 14, .3 + ak * .5);
        g.restore();
        iceGlow(33, -54 + nod, 9, .55);
      } else {
        /* ================= TURET ES HIDUP ================= */
        g.scale(s0 * .85 * gr * sq, s0 * .85 * gr * (2 - sq));
        const tgtAr = (wd || st == 'act') && (atk == 'spiral' || atk == 'beam') ? .55 : .12;
        e.ar = (e.ar || 0) + (tgtAr - (e.ar || 0)) * .12;
        const up = (wd && atk == 'mortar') || (st == 'rest' && atk == 'mortar' && e.tm > .4), by = Math.sin(ph * 2.4) * 1.2, hy = -47 + by - (up ? 4 : 0);
        const aim = up ? (Math.cos(e.ta || 0) < 0 ? -2.25 : -.9) : (e.ta == null ? Math.atan2(p.y - e.y, p.x - e.x) : e.ta);
        g.lineCap = 'round';
        for (let i = 0; i < 7; i++) {
          const s = (i - 3) / 3, w = Math.sin(t * 1.6 + i * 1.3) * 2.5, ex = s * 30 + w, ey2 = -1 + Math.abs(s) * 3;
          g.strokeStyle = F(i % 2 ? '#4a86c4' : '#7fb8e8');
          g.lineWidth = 4 - Math.abs(s) * 1.5;
          g.beginPath();
          g.moveTo(s * 6, -8);
          g.quadraticCurveTo(s * 20, -17 + w, ex, ey2);
          g.stroke();
          PG('#d6f2ff', [[ex - 2, ey2], [ex + (s > 0 ? 5 : -5), ey2 - 3], [ex, ey2 - 5]]);
        }
        PG('#4a86c4', [[-17, 0], [17, 0], [13, -13], [-13, -13]]);
        PG('#7fb8e8', [[-17, 0], [-6, 0], [-5, -13], [-13, -13]]);
        R_('#d6f2ff', -13, -13, 26, 1);
        for (const sx of [-1, 1]) {
          g.save();
          g.translate(sx * 14, -30 + by);
          g.rotate(sx * e.ar * .7);
          PG('#bfe3f7', [[0, 4], [sx * 8, -4], [sx * 12, -24], [sx * 3, -11], [0, -2]]);
          PG('#e8fbff', [[0, 2], [sx * 4, -5], [sx * 9, -21], [sx * 2, -9]]);
          g.restore();
        }
        PG('#8fc4ee', [[-13, -13], [13, -13], [16, -28 + by], [9, -43 + by], [-9, -43 + by], [-16, -28 + by]]);
        PG('#d6f2ff', [[-13, -13], [-5, -13], [-4, -43 + by], [-9, -43 + by], [-16, -28 + by]]);
        PG('#5a9ad0', [[5, -13], [13, -13], [16, -28 + by], [9, -43 + by], [4, -43 + by]]);
        R_('#3a76b0', -10, -34 + by, 7, 1);
        R_('#3a76b0', 3, -34 + by, 7, 1);
        R_('#3a76b0', -10, -20 + by, 7, 1);
        R_('#3a76b0', 3, -20 + by, 7, 1);
        g.save();
        g.globalCompositeOperation = 'lighter';
        const cg = g.createRadialGradient(0, -27 + by, 1, 0, -27 + by, 13);
        cg.addColorStop(0, 'rgba(' + (en ? '255,110,90' : '190,245,255') + ',' + (.5 + .4 * pu) + ')');
        cg.addColorStop(1, 'rgba(' + cc + ',0)');
        g.fillStyle = cg;
        g.fillRect(-14, -41 + by, 28, 28);
        g.restore();
        g.fillStyle = F(en ? '#ff6a5a' : '#bff6ff');
        g.beginPath();
        g.arc(0, -27 + by, 4 + pu * 1.5, 0, 7);
        g.fill();
        PG('#6ea8dc', [[-6, -41 + by], [6, -41 + by], [5, hy + 4], [-5, hy + 4]]);
        g.fillStyle = F('#cdebff');
        g.beginPath();
        g.arc(0, hy, 12, Math.PI, 0);
        g.lineTo(12, hy + 6);
        g.lineTo(-12, hy + 6);
        g.closePath();
        g.fill();
        R_('#9fd0f2', -12, hy + 2, 24, 4);
        R_('#f4ffff', -8, hy - 10, 6, 2);
        const exx = Math.cos(aim) * 3, eyy = Math.sin(aim) * 2;
        g.fillStyle = F('#f4ffff');
        g.beginPath();
        g.ellipse(0, hy - 1, 7, 5.5, 0, 0, 7);
        g.fill();
        g.fillStyle = F(en ? '#ff3a2a' : '#2a8cff');
        g.beginPath();
        g.arc(exx, hy - 1 + eyy, 3.2, 0, 7);
        g.fill();
        g.fillStyle = F('#0b1a2a');
        g.beginPath();
        g.arc(exx, hy - 1 + eyy, 1.4, 0, 7);
        g.fill();
        PG('#5a9ad0', [[-9, hy - 8], [0, hy - 3 - (en ? 1 : 0)], [0, hy - 6], [-9, hy - 10]]);
        PG('#5a9ad0', [[9, hy - 8], [0, hy - 3 - (en ? 1 : 0)], [0, hy - 6], [9, hy - 10]]);
        g.save();
        g.translate(0, hy + 1);
        g.rotate(aim);
        const rc = st == 'act' && atk == 'spiral' ? -Math.abs(Math.sin(t * 40)) * 2 : 0;
        PG('#6ea8dc', [[6 + rc, -5], [24 + rc, -4], [24 + rc, 4], [6 + rc, 5]]);
        PG('#cdebff', [[6 + rc, -5], [24 + rc, -4], [24 + rc, -1], [6 + rc, -2]]);
        R_('#3a76b0', 12 + rc, -5.5, 2, 11);
        R_('#3a76b0', 19 + rc, -5.5, 2, 11);
        PG('#eaffff', [[24 + rc, -5], [31 + rc, -1], [24 + rc, -1]]);
        PG('#eaffff', [[24 + rc, 5], [31 + rc, 1], [24 + rc, 1]]);
        const ch = wd && (atk == 'spiral' || atk == 'beam') ? ak : st == 'act' && (atk == 'spiral' || atk == 'beam') ? 1 : 0;
        if (ch > 0)
          iceGlow(28, 0, 8 + ch * 12, .4 + ch * .5, en ? '255,120,100' : '170,235,255');
        g.restore();
        for (let i = 0; i < 3; i++) {
          const aa = t * 1.6 + i * 2.094, ox = Math.cos(aa) * 21, oy = hy + Math.sin(aa) * 6 - 4;
          PG('#e8fbff', [[ox, oy - 4], [ox + 2.5, oy], [ox, oy + 4], [ox - 2.5, oy]]);
        }
      }
      g.restore();
      if (sp >= 1)
        for (let i = 0; i < 5; i++) {
          const aa = t * (en ? 3 : 1.6) + i * 1.2566 + e.ph, rr = 17 * s0 + Math.sin(t * 2 + i) * 3;
          g.fillStyle = 'rgba(' + cc + ',' + (.6 + .3 * Math.sin(t * 6 + i)) + ')';
          g.fillRect(Math.round(e.x + Math.cos(aa) * rr), Math.round(fy - 14 * s0 + Math.sin(aa) * rr * .45 - Math.abs(Math.sin(t * 3 + i)) * 6), 2, 2);
        }
      if (e.sw <= 0) {
        e.hv = e.hv == null ? e.hp : e.hv + (e.hp - e.hv) * .1;
        const w = 52, x = Math.round(e.x - w / 2), y = Math.round(fy - (mel ? 84 : 66) * s0 * .85 - 12), k = Math.max(0, e.hp / e.mhp), kv = Math.max(0, e.hv / e.mhp);
        g.fillStyle = 'rgba(10,8,14,.88)';
        g.fillRect(x - 1, y - 1, w + 2, 7);
        g.fillStyle = '#f2f2f2';
        g.fillRect(x, y, Math.round(w * kv), 5);
        g.fillStyle = en ? (pu > .5 ? '#ff3a2a' : '#c81e14') : '#5ac8ff';
        g.fillRect(x, y, Math.round(w * k), 5);
        g.font = 'bold 8px monospace';
        txt((en ? '☠ ' : '❄ ') + e.mn, e.x, y - 4, en ? '#ff8a7a' : '#bfeaff', 'center');
      }
    }

    /* ---------- efek kematian: pecah jadi kristal es ---------- */
    function iceMiniDeath(e, id) {
      const x = e.x, y = e.y - 6, ring = (r, w, col, life) => fx.push({ k: 'ring', x, y: y + 6, r, w, life, max: life, col });
      HST = Math.max(HST, .11);
      shake = Math.max(shake, id == 'ik' ? 12 : 10);
      FLSH = .55;
      FLSC = '170,225,255';
      ring(54, 4, ICE_COL, .5);
      ring(88, 2, '#e8fbff', .75);
      fx.push({ k: 'gl', x, y, r: 100, c: ICE_CS, life: .5, max: .5 }, { k: 'pil', x, y, w: 50, h: 190, c: '170,230,255', life: .6, max: .6 });
      iceShard(x, y, id == 'ik' ? 30 : 24, 160, 60);
      for (let i = 0; i < 26; i++)
        dp.push({
          k: 'p', x: x + (R() - .5) * 20, y: y + R() * 8, vx: (R() - .5) * 60, vy: -40 - R() * 100, life: .7 + R() * .6, max: 1.3, s: 1.5 + R() * 2.5, c: i % 2 ? '#e8fbff' : '#8fd0f0'
        });
      puff(x, y + 6, 6, '210,235,250', 1.4);
      dn(x, y - 26, id == 'ik' ? 'PECAH!' : 'KRISTAL PECAH!', 0, '#bfeaff');
      skLater(.28, () => { shake = Math.max(shake, 6); ring(40, 3, ICE_COL, .35); iceShard(x, y, 14, 90, 20); });
      if (id == 'it')
        skLater(.55, () => { SFX.boom(26); ring(70, 3, '#e8fbff', .4); iceShard(x, y, 12, 120, 40); });
    }
    /* ===== HALUSKAN GERAK: Mini Bos + Musuh Lava + Bos Lava =====
       - kecepatan dihaluskan (akselerasi & pengereman), tidak langsung berhenti / berbalik arah
       - hadap kiri/kanan berputar cepat tapi mulus, badan condong ke arah gerak, langkah sesuai kecepatan
       - musuh lava memakai posisi render halus (tanpa pembulatan piksel) + squash/hop seperti musuh biasa
       - knockback dan tabrakan (charge) tetap instan agar terasa mantap */
    let SM_DT = 0;
    const smCl = (v, a, b) => Math.max(a, Math.min(b, v));

    function SMR(v) { return (lavaOn() && room == 2) ? v : Math.round(v); }
    const smOn = e => !(e.sw > 0) && !e.dying && e.k != 'dummy' && (e.mini || (e.k == 'boss' && lavaOn() && room == 2) || ((lavaOn() || iceR()) && room < 2 && (e.k == 'slime' || e.k == 'skel' || e.k == 'mage')));
    const smK = e => (e.mini || e.k == 'skel') ? [7, 6] : e.k == 'boss' ? [6, 5] : e.k == 'slime' ? [11, 9] : [9, 8];
    const _mvSM = mv;
    mv = function (o, dx, dy) {
      if (!o || !o.smo)
        return _mvSM(o, dx, dy);
      if (dx === o.vx * SM_DT && dy === o.vy * SM_DT)
        return _mvSM(o, dx, dy); /* knockback: apa adanya */
      if (o.s2 == 'act') { /* charge: langsung bergerak, tapi start-nya dilandaikan */
        const f = (o.mini && o.tm != null) ? smCl(.3 + (.42 - o.tm) * 10, .3, 1) : 1;
        _mvSM(o, dx * f, dy * f);
        if (SM_DT > 0) {
          o.svx = dx * f / SM_DT;
          o.svy = dy * f / SM_DT;
        }
        return;
      }
      o.ix = (o.ix || 0) + dx;
      o.iy = (o.iy || 0) + dy; /* gerak AI: dikumpulkan lalu dihaluskan */
    };
    const _updSM = upd;
    upd = function (dt) {
      SM_DT = dt;
      for (const e of es) {
        e.smo = smOn(e) ? 1 : 0;
        if (e.smo) {
          e.ix = 0;
          e.iy = 0;
        } else if (e.svx) {
          e.svx = e.svy = 0;
        }
      }
      _updSM(dt);
      if (!(dt > 0) || (typeof HST === 'number' && HST > 0))
        return;
      for (const e of es) {
        if (!e.smo || e.s2 == 'act')
          continue;
        if (e.svx == null) {
          e.svx = 0;
          e.svy = 0;
        }
        const tx = (e.ix || 0) / dt, ty = (e.iy || 0) / dt, kk = smK(e), k = 1 - Math.exp(-(Math.hypot(tx, ty) >= Math.hypot(e.svx, e.svy) ? kk[0] : kk[1]) * dt);
        e.svx += (tx - e.svx) * k;
        e.svy += (ty - e.svy) * k;
        if (!tx && !ty && Math.hypot(e.svx, e.svy) < 2) {
          e.svx = e.svy = 0;
        }
        if (e.svx || e.svy)
          _mvSM(e, e.svx * dt, e.svy * dt);
      }
    };
    /* animasi visual mini bos: hadap, condong, langkah, squash */
    function miniVis(e) {
      const dt = Math.min(.05, Math.max(.001, t - (e.vpt || t - .016)));
      e.vpt = t;
      const k = r => 1 - Math.exp(-r * dt);
      if (e.fdr == null) {
        e.fdr = e.ftg = p.x < e.x ? -1 : 1;
        e.lean = 0;
        e.ac = 0;
        e.wm = 0;
        e.gp2 = 0;
        e.sqs = 1;
      }
      if (Math.abs(p.x - e.x) > 7)
        e.ftg = p.x < e.x ? -1 : 1;
      e.fdr += (e.ftg - e.fdr) * k(14);
      const spd = Math.hypot(e.svx || 0, e.svy || 0), wd = e.s2 == 'wind', ak = wd && e.tmx ? smCl(1 - e.tm / e.tmx, 0, 1) : 0;
      e.wm += ((e.s2 == 'act' || e.sw > 0 ? 0 : smCl(spd / Math.max(30, (e.sp || 40) * .9), 0, 1)) - e.wm) * k(9);
      e.gp2 += dt * spd * .11;
      e.lean += (smCl((e.svx || 0) / 240, -1, 1) * .11 - e.ftg * .06 * ak - e.lean) * k(10);
      e.ac += ((e.s2 == 'act' ? 1 : 0) - e.ac) * k(18);
      e.sqs += ((e.s2 == 'rest' ? .94 : 1 + ak * .04) - e.sqs) * k(14);
    }
    const _deSM = drawEnemy;
    drawEnemy = function (e) {
      if (e.mini) {
        if (!(e.sw > 0))
          miniVis(e);
      } else if ((lavaOn() || iceR()) && room < 2 && (e.k == 'slime' || e.k == 'skel' || e.k == 'mage') && !(e.sw > 0)) {
        try {
          const atk = e.wind > 0 || e.an > 0;
          let pg = 0;
          if (e.wind > 0)
            pg = 1 - e.wind / (e.k == 'skel' ? .6 : .7);
          else if (e.an > 0)
            pg = 1 - e.an / .6;
          const mvd = Math.hypot(e.x - e.lx, e.y - e.ly);
          e.lx = e.x;
          e.ly = e.y;
          e.wk = (e.wk || 0) + ((mvd > .15 && !atk && !(e.stun > 0) ? 1 : 0) - (e.wk || 0)) * .2;
          enemyAnim(e, mvd, atk, pg);
        } catch (x) { }
      }
      return _deSM(e);
    };
    /* ===== LEVEL 3 BOS: KRYOVARTH, NAGA ES PURBA — 3 fase (1 → 2 → 3 kepala), serangan acak, auman bergetar ===== */
    const iceBossOn = () => LVL == 3 && room == 2 && !lobby;
    let dgH = [], dgQ = [], dgB = [], dgR = []; // hazard bulat, antrean, beam napas, cincin kejut
    const DGN = ['NAGA SALJU', 'NAGA GLASIAL · 2 KEPALA', 'RAJA ES · 3 KEPALA'];
    const DG_HP = [[[320, 150]], [[262, 160], [378, 160]], [[320, 112], [232, 168], [408, 168]]], DG_SS = [1.12, 1.26, 1.4];
    const dgHead = (e, i) => { const f = BOSS.ph || 1, h = DG_HP[f - 1][i % f], s = .4 * DG_SS[f - 1]; return [e.x + (h[0] - 320) * s, e.y + 7 + (h[1] - 333) * s]; };
    const dgAdd = (x, y, r, t0, d, k) => dgH.push({ x: lcl(x, 34, DW - 34), y: lcl(y, 34, DH - 34), r, t: t0, mx: t0, d, k });
    const dgFire = (x, y, a, sp, d) => pr.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, d, r: 3.5, col: '#9fe4ff', own: 'e', life: 4, rock: 1, ic: 1, rot: 0, vr: 0, sd: R() * 50
    });
    const _bvDG = bossVid;
    bossVid = function (e) {
      if ((!e || e.k == 'boss') && iceBossOn())
        return 'drg'; return _bvDG(e);
    };

    /* ---------- MODEL NAGA: 1 kepala (fase 1) → 2 kepala (fase 2) → 3 kepala (fase 3) ---------- */
    const _emDG = EM.boss;
    EM.boss = function dragonDraw(pp, at, tm) {
      if (!iceBossOn())
        return _emDG(pp, at, tm);
      const e = BOSS_E || {}, fl = !!MT, F = c => fl ? '#fff' : c, ez = q => 1 - (1 - q) * (1 - q), ph = BOSS.ph || 1, PI = Math.PI;
      const mk0 = e.s2 == 'morph' && e.mtx ? 1 - e.mt / e.mtx : -1, f = mk0 >= 0 && mk0 < .55 ? Math.max(1, ph - 1) : ph;
      const PAL = [
        ['#173f66', '#3a86c0', '#d6f3ff', '#7fdcff'], ['#102f55', '#2a74b4', '#b4ecff', '#4fe0ff'], ['#16245e', '#4f8fe8', '#f0ffff', '#c6f6ff']
      ][f - 1], D = PAL[0], M = PAL[1], L = PAL[2], G = PAL[3];
      const k = e.atk, w = e.s2 == 'wind' && at, q = ez(pp || 0);
      let roar = 0, wing = 0, lean = 0, hv = 0;
      if (w) {
        if (k == 'nova' || k == 'triad') {
          roar = q;
          wing = q;
        } else if (k == 'breath')
          roar = .85 * q;
        else if (k == 'lunge')
          lean = (Math.cos(e.ca || 0) < 0 ? -1 : 1) * .12 * q;
        else if (k == 'icicles' || k == 'hail') {
          wing = q;
          hv = q;
        } else if (k == 'blizzard') {
          wing = q;
          roar = .5 * q;
        } else if (k == 'tail')
          lean = -.07 * q;
        else
          roar = .5 * q;
      } else if (e.s2 == 'act') {
        roar = .9;
        wing = .5;
      } else if (e.s2 == 'morph') {
        roar = 1;
        wing = 1;
      }
      let jx = 0, sc = 1;
      if (mk0 >= 0) {
        jx = (R() - .5) * 10 * mk0;
        if (mk0 > .55)
          sc = 1 + .2 * (1 - (mk0 - .55) / .45);
      }
      const poly = (a, c) => { g.fillStyle = F(c); g.beginPath(); a.forEach((v, i) => i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1])); g.closePath(); g.fill(); };
      const ell = (x, y, rx, ry, c) => { g.fillStyle = F(c); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
      const glow = (x, y, r, c, a) => {
        if (fl)
          return; g.save(); g.globalCompositeOperation = 'lighter'; const o = g.createRadialGradient(x, y, 0, x, y, r); o.addColorStop(0, 'rgba(' + c + ',' + a + ')'); o.addColorStop(1, 'rgba(' + c + ',0)'); g.fillStyle = o; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
      };
      const SS = DG_SS[f - 1] * sc;
      g.save();
      g.lineCap = 'round';
      g.translate(320 + jx, 333);
      g.rotate(lean);
      g.scale(SS, SS);
      g.translate(-320, -333);
      if (!fl) {
        g.fillStyle = 'rgba(0,0,0,.35)';
        g.beginPath();
        g.ellipse(320, 331, 92, 11, 0, 0, 7);
        g.fill();
      }
      glow(320, 230, 200, '110,215,255', .13 + .04 * f + .04 * Math.sin(tm * 3));
      // sayap
      [-1, 1].forEach(s => {
        const fp = Math.sin(tm * 2.2 + (s > 0 ? 0 : .5)) * 14 * (1 - wing * .6) - wing * 40, Wd = 100 + f * 24 + wing * 20, sx = 320 + s * 44, sy = 214;
        const tip = [320 + s * (Wd + 70), 104 - f * 8 + fp], b1 = [320 + s * (Wd + 26), 176 + fp * .5], b2 = [320 + s * Wd * .66, 236 + fp * .2], b3 = [320 + s * Wd * .3, 262];
        poly([[sx, sy], tip, b1, b2, b3, [sx, sy + 34]], M);
        poly([
          [sx, sy + 8], [tip[0] - s * 10, tip[1] + 18], [b1[0] - s * 6, b1[1] + 10], [b2[0] - s * 6, b2[1]], [b3[0], b3[1] - 4]
        ], 'rgba(190,238,255,.5)');
        [tip, b1, b2].forEach(v => { g.strokeStyle = F(D); g.lineWidth = 5; g.beginPath(); g.moveTo(sx, sy); g.lineTo(v[0], v[1]); g.stroke(); g.strokeStyle = F(L); g.lineWidth = 1.6; g.beginPath(); g.moveTo(sx, sy); g.lineTo(v[0], v[1]); g.stroke(); });
        if (f >= 2)
          for (let i = 0; i < 5; i++) {
            const u = i / 5, x0 = tip[0] + (b1[0] - tip[0]) * u, y0 = tip[1] + (b1[1] - tip[1]) * u;
            poly([[x0, y0], [x0 + s * 9, y0 + 20 + f * 4], [x0 - s * 6, y0 + 4]], L);
          }
      });
      // ekor berujung kristal
      const tw = Math.sin(tm * 1.6) * 18, ex = 478 + tw, ey = 292 + Math.sin(tm * 1.6 + 1) * 12;
      [[26, D], [17, M], [6, L]].forEach(([lw, c]) => { g.strokeStyle = F(c); g.lineWidth = lw; g.beginPath(); g.moveTo(350, 296); g.quadraticCurveTo(430 + tw, 338, ex, ey); g.stroke(); });
      poly([[ex - 8, ey + 6], [ex + 26, ey - 30], [ex + 10, ey + 4], [ex + 30, ey + 12], [ex + 2, ey + 14]], L);
      // badan
      ell(320, 262, 72, 58, D);
      ell(320, 259, 65, 51, M);
      ell(320, 252, 44, 38, F(f == 1 ? '#5aa5d8' : f == 2 ? '#4a9ae0' : '#7fb4ff'));
      for (let i = 0; i < 5; i++)
        ell(320, 238 + i * 13, 30 - i * 3, 5, L);
      const ns = 6 + f * 2;
      for (let i = 0; i < ns; i++) {
        const x = 262 + i * 116 / (ns - 1), y = 222 - Math.sin(i / (ns - 1) * PI) * 22;
        poly([[x - 7, y + 16], [x, y - 8 - f * 3 - (i % 2) * 6], [x + 7, y + 16]], i % 2 ? L : G);
      }
      if (f >= 2) {
        glow(320, 258, 40, '120,230,255', .4 + .25 * Math.sin(tm * 4));
        ell(320, 258, 9, 9, L);
      }
      if (f == 3) {
        g.strokeStyle = F('#e8ffff');
        g.lineWidth = 1.4;
        g.beginPath();
        g.moveTo(290, 236);
        g.lineTo(304, 262);
        g.lineTo(296, 288);
        g.moveTo(350, 240);
        g.lineTo(338, 268);
        g.lineTo(348, 290);
        g.stroke();
      }
      // kaki berkuku
      [-1, 1].forEach(s => { const x = 320 + s * 44; ell(x, 304, 20, 26, D); ell(x, 303, 16, 22, M); poly([[x - 21, 330], [x + 21, 330], [x + 16, 336], [x - 16, 336]], D);[-12, 0, 12].forEach(o => poly([[x + o - 4, 334], [x + o + 4, 334], [x + o, 342]], L)); });
      // leher + kepala
      const dA = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b)), SSn = .4 * DG_SS[f - 1];
      DG_HP[f - 1].forEach((hp, i) => {
        const hs = f == 1 ? 1.15 : f == 3 && i == 0 ? 1.2 : .95, hx = hp[0] + Math.sin(tm * 1.6 + i * 2.1) * 5, hy = hp[1] + Math.sin(tm * 2.1 + i) * 4 - roar * 16 - hv * 6;
        const mine = e.hd % f == i || k == 'triad' || k == 'nova';
        let op = .1 + .07 * Math.sin(tm * 2 + i * 2);
        if (w && mine)
          op = .25 + .75 * q;
        else if (e.s2 == 'act' && mine)
          op = .9;
        if (e.s2 == 'morph')
          op = 1;
        const tx = Math.atan2(p.y - (e.y + 7 + (hy - 333) * SSn), p.x - (e.x + (hx - 320) * SSn));
        let ha = -PI / 2 + (hp[0] - 320) * .004 + Math.sin(tm * 1.3 + i) * .1;
        ha = roar > .6 ? -PI / 2 + (hp[0] - 320) * .006 : ha + dA(tx, ha) * (op > .25 ? 1 : .35);
        const sx = 320 + (hp[0] - 320) * .3, sy = 238, cx = 320 + (hp[0] - 320) * .8, cy = (hy + sy) / 2 + 24;
        [[30, D], [21, M], [7, L]].forEach(([lw, c], j) => { g.strokeStyle = F(c); g.lineWidth = lw * hs * (j == 2 ? .8 : 1); g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(cx, cy, hx, hy + 8); g.stroke(); });
        for (let j = 1; j < 5; j++) {
          const [nx, ny] = bz(j / 5, sx, sy, cx, cy, hx, hy + 8);
          poly([[nx - 5, ny + 4], [nx, ny - 10], [nx + 5, ny + 4]], j % 2 ? L : G);
        }
        g.save();
        g.translate(hx, hy);
        g.rotate(ha);
        g.scale(hs, hs);
        poly([[-6, -9], [-26, -26], [-42, -24], [-24, -12]], L);
        poly([[-6, 9], [-26, 26], [-42, 24], [-24, 12]], L);
        poly([[-16, -13], [8, -12], [30, -6], [37, 0], [30, 5], [8, 9], [-16, 13]], D);
        poly([[-12, -9], [8, -8], [28, -3], [32, 1], [8, 6], [-12, 9]], M);
        for (let j = 0; j < 4; j++)
          poly([[16 + j * 5, 5], [19 + j * 5, 5], [17.5 + j * 5, 10]], '#fff');
        g.save();
        g.translate(-6, 8);
        g.rotate(op * .75);
        poly([[0, 0], [34, 3], [39, 9], [4, 14]], D);
        poly([[3, 3], [32, 5], [35, 8], [5, 11]], M);
        for (let j = 0; j < 3; j++)
          poly([[10 + j * 7, 3], [13 + j * 7, 3], [11.5 + j * 7, -3]], '#fff');
        g.restore();
        for (let j = 0; j < 5; j++)
          poly([[-10 + j * 6, -12], [-6 + j * 6, -12], [-8 + j * 6, -21 - (j % 2) * 4]], j % 2 ? G : L);
        poly([[6, -8], [15, -6], [8, -2]], fl ? '#fff' : f == 3 ? '#ffffff' : '#9ff4ff');
        g.restore();
        const mx = hx + Math.cos(ha) * 30 * hs, my = hy + Math.sin(ha) * 30 * hs;
        glow(hx + Math.cos(ha) * 8 * hs, hy + Math.sin(ha) * 8 * hs - 3, 20, '170,250,255', .7);
        if (op > .3)
          glow(mx, my, 30 * op, '150,235,255', .6 * op);
      });
      glow(320, 330, 120, '140,225,255', .08);
      if (!fl) {
        g.save();
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 16; i++) {
          const u = (tm * .25 + i * .0625) % 1;
          g.fillStyle = 'rgba(225,248,255,' + (1 - u) * .8 + ')';
          g.fillRect(Math.round(320 + Math.sin(i * 12.9) * 150 + Math.sin(tm + i) * 8), Math.round(330 - u * 270), 3, 3);
        }
        g.restore();
      }
      g.restore();
    };

    /* ---------- AI: serangan acak, tipuan (feint), jeda acak, rantai serangan ---------- */
    function dgStart(e, q, ph, a, fast) {
      const base = { shards: .75, icicles: .9, breath: 1, tail: .7, lunge: .8, blizzard: .8, nova: 1.3, triad: 1.5, hail: 1 }[q], dur = fast ? .4 : base * (.72 + R() * .6) * (1 - (ph - 1) * .05);
      e.s2 = 'wind';
      e.atk = q;
      e.tmx = e.tm = dur;
      e.hit = 0;
      e.hd = R() * ph | 0;
      e.ca = a;
      e.fn = !fast && ph >= 2 && ['shards', 'breath', 'lunge', 'blizzard'].includes(q) && R() < .2 ? 1 : 0;
      SFX.warn(q == 'shards' ? 1 : 0);
      SFX.bossVo('drg', q, ph);
      const ho = dgHead(e, e.hd);
      if (q == 'icicles') {
        const n = 3 + ph * 2;
        for (let i = 0; i < n; i++)
          dgAdd(p.x + (i ? (R() - .5) * 190 : 0), p.y + (i ? (R() - .5) * 140 : 0), 26 + ph * 2, .8 + i * .13 * (.6 + R() * .8), 14 + ph * 2);
      } else if (q == 'hail') {
        dgAdd(p.x, p.y, 30, .9, 16);
        for (let i = 0; i < 12; i++)
          dgAdd(34 + R() * (DW - 68), 34 + R() * (DH - 68), 30, .7 + R() * 1.1, 16);
      } else if (q == 'tail')
        dgAdd(e.x, e.y, 66 + ph * 4, dur, 18 + ph * 2, 't');
      else if (q == 'breath') {
        const sg = R() < .5 ? 1 : -1;
        dgB.push({
          bx: ho[0], by: ho[1], a0: a - sg * (.5 + R() * .5), dir: sg, t: 0, warn: dur, life: 1.2 + ph * .25, w: 14 + ph * 3, len: 430, d: 12 + ph * 2, h: e.hd, sp: .9 + ph * .2
        });
      } else if (q == 'triad') {
        const sg = R() < .5 ? 1 : -1;
        dgB.push({
          bx: ho[0], by: ho[1], a0: a - sg * .8, dir: sg, t: 0, warn: dur, life: 1.8, w: 18, len: 440, d: 15, h: 0, sp: 1.1
        });
      }
    }

    function dgMorph(e, ph) {
      msg(ph == 2 ? 'Fase 2 — Kryovarth menumbuhkan kepala kedua! Badai membeku!' : 'Fase Akhir — KEPALA KETIGA bangkit! Raja Es mengamuk!');
      SFX.wave();
      SFX.bossVo('drg', 'phase', ph);
      FLSH = 1;
      FLSC = '170,230,255';
      shake = Math.max(shake, 13);
      HST = Math.max(HST, .15);
      fx.push({ k: 'ring', x: e.x, y: e.y, r: 70, w: 5, life: .7, max: .7, col: '#bfeaff' }, { k: 'gl', x: e.x, y: e.y, r: 140, c: '150,220,255', life: .5, max: .5 });
      dgH = [];
      dgQ = [];
      dgB = [];
      dgR = [];
      pr = pr.filter(b => b.own != 'e');
      e.s2 = 'morph';
      e.mt = e.mtx = ph == 2 ? 2.2 : 3;
      e.atk = null;
      e.an = 0;
    }

    function dgTick(e, dt) {
      const B = BOSS;
      e.fl -= dt;
      e.vx = e.vy = 0;
      e.stg = 0;
      e.stun = 0;
      if (p.dead > 0 || B.dead) {
        e.an = 0;
        return;
      }
      const rt = e.hp / e.mhp, ph = rt > .66 ? 1 : rt > .33 ? 2 : 3;
      if (ph > B.ph) {
        B.ph = ph;
        dgMorph(e, ph);
        return;
      }
      if (B.intro > 0) {
        B.intro -= dt;
        return;
      }
      if (e.s2 == 'morph') {
        e.mt -= dt;
        e.an = 0;
        const k = 1 - e.mt / e.mtx;
        if (R() < dt * 40) {
          const a = R() * 6.283;
          dp.push({
            k: 'p', x: e.x + Math.cos(a) * 34, y: e.y - 20 + Math.sin(a) * 30, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 20, life: .5, max: .5, s: 2 + R() * 3, c: R() < .5 ? '#e8fbff' : '#7fd0ff'
          });
        }
        if (R() < dt * 5) {
          shake = Math.max(shake, 5 + k * 6);
          SFX.boom(14);
        }
        if (e.mt <= 0) {
          SFX.slam();
          shake = Math.max(shake, 12);
          FLSH = .8;
          FLSC = '190,235,255';
          dgR.push({ x: e.x, y: e.y, r: 20, v: 150, gap: ang(e, p), gw: .6, d: 12, w: 9 });
          e.s2 = 'rest';
          e.tm = .9;
          e.cd = 1;
        }
        return;
      }
      if (!e.s2)
        e.s2 = 'move';
      const d = dist(e, p), a = ang(e, p), spd = e.sp * (1 + (ph - 1) * .3);
      e.cd -= dt;
      if (e.s2 == 'move') {
        e.an = 0;
        e.ca = a;
        const want = ph == 1 ? 120 : ph == 2 ? 100 : 88;
        if (d > want + 10)
          mv(e, Math.cos(a) * spd * dt, Math.sin(a) * spd * dt);
        else if (d < want - 30)
          mv(e, -Math.cos(a) * spd * dt * .8, -Math.sin(a) * spd * dt * .8);
        if (e.cd <= 0) {
          const pool = ph == 1 ? ['shards', 'icicles', 'breath', 'tail'] : ph == 2 ? ['shards', 'icicles', 'breath', 'lunge', 'blizzard', 'nova', 'tail', 'shards'] : ['triad', 'hail', 'nova', 'breath', 'lunge', 'blizzard', 'shards', 'icicles', 'tail'];
          if (d < 75)
            pool.push('tail', 'tail');
          let q = pool[R() * pool.length | 0];
          if (q == e.last || (q == 'tail' && d > 95))
            q = pool[R() * pool.length | 0];
          e.last = q;
          dgStart(e, q, ph, a, 0);
        }
      } else if (e.s2 == 'wind') {
        e.tm -= dt;
        e.an = Math.max(.01, .6 * (e.tm / e.tmx));
        if (e.atk != 'lunge' || e.tm > e.tmx * .35)
          e.ca = a;
        if (e.tm <= 0) {
          e.an = 0;
          const q = e.atk;
          if (e.fn) {
            e.fn = 0;
            dgB = [];
            const alt = ['shards', 'lunge', 'tail', 'icicles'][R() * 4 | 0];
            dgStart(e, alt == q ? 'tail' : alt, ph, a, 1);
            return;
          }
          if (q == 'shards') {
            const ho = dgHead(e, e.hd), n = 2 + ph * 2 + dfx().shots, b0 = Math.atan2(p.y - ho[1], p.x - ho[0]);
            SFX.eshot();
            const vol = () => {
              for (let i = 0; i < n; i++)
                dgFire(ho[0], ho[1], b0 + (i - (n - 1) / 2) * (.17 + R() * .08) + (R() - .5) * .1, (90 + ph * 20 + R() * 25) * dfx().pv, 10 + ph * 2);
            };
            vol();
            if (ph == 3)
              dgQ.push({
                t: .32, f: () => {
                  if (es.includes(e) && p.dead <= 0)
                    vol();
                }
              });
            e.s2 = 'rest';
            e.tm = .55;
          } else if (q == 'breath') {
            e.s2 = 'act';
            e.tm = dgB[0] ? dgB[0].life : 1.4;
            SFX.boom(30);
          } else if (q == 'lunge') {
            e.s2 = 'act';
            e.tm = .55;
            SFX.dodge();
          } else if (q == 'blizzard') {
            e.s2 = 'act';
            e.tm = 1.4 + ph * .2;
            e.bt = 0;
            e.ba = R() * 6.283;
            SFX.boom(20);
          } else if (q == 'triad') {
            e.s2 = 'act';
            e.tm = 1.8;
            e.bt = 0;
            SFX.boom(34);
          } else if (q == 'nova') {
            const go = () => { SFX.boom(18); shake = Math.max(shake, 9); dgR.push({ x: e.x, y: e.y - 6, r: 24, v: 125 + ph * 18, gap: R() * 6.283, gw: .55 - ph * .05, d: 14 + ph * 2, w: 10 }); fx.push({ k: 'ring', x: e.x, y: e.y, r: 34, w: 4, life: .3, max: .3, col: '#bfeaff' }); };
            go();
            for (let i = 1; i < ph; i++)
              dgQ.push({
                t: i * .6, f: () => {
                  if (es.includes(e) && p.dead <= 0)
                    go();
                }
              });
            e.s2 = 'rest';
            e.tm = .8 + ph * .35;
          } else {
            e.s2 = 'rest';
            e.tm = q == 'hail' ? 1.1 : .8;
          }
        }
      } else if (e.s2 == 'act') {
        e.tm -= dt;
        e.an = .01;
        const q = e.atk;
        if (q == 'breath') {
          const b = dgB[0];
          if (b)
            e.ca = b.a0 + b.dir * b.sp * Math.max(0, b.t - b.warn);
        } else if (q == 'lunge') {
          const ox = e.x, oy = e.y;
          mv(e, Math.cos(e.ca) * 400 * dt, Math.sin(e.ca) * 400 * dt);
          if (R() < .8)
            puff(e.x, e.y + 6, 1, '190,230,255', .8);
          if (!e.hit && dist(e, p) < e.r + p.r + 8) {
            e.hit = 1;
            hurt(16 + ph * 3);
          }
          if (Math.hypot(e.x - ox, e.y - oy) < .3)
            e.tm = Math.min(e.tm, .05);
        } else if (q == 'blizzard') {
          e.bt -= dt;
          if (e.bt <= 0) {
            e.bt = .085;
            e.ba += .42;
            for (let i = 0; i < ph; i++)
              dgFire(e.x, e.y - 18, e.ba + i * 6.283 / ph, 85 + ph * 8, 9 + ph);
          }
        } else if (q == 'triad') {
          e.bt -= dt;
          if (e.bt <= 0) {
            e.bt = .45;
            const h1 = dgHead(e, 1), b0 = Math.atan2(p.y - h1[1], p.x - h1[0]);
            for (let i = -1; i <= 1; i++)
              dgFire(h1[0], h1[1], b0 + i * .22, 110 * dfx().pv, 12);
            dgAdd(p.x + (R() - .5) * 60, p.y + (R() - .5) * 50, 28, .7, 15);
            SFX.eshot();
          }
        }
        if (e.tm <= 0) {
          e.an = 0;
          e.s2 = 'rest';
          e.tm = .9;
          if (q == 'lunge') {
            SFX.slam();
            shake = Math.max(shake, 7);
            fx.push({ k: 'ring', x: e.x, y: e.y, r: 40, w: 4, life: .3, max: .3, col: '#bfeaff' });
            if (ph >= 2) {
              const n = ph == 2 ? 8 : 12;
              for (let i = 0; i < n; i++)
                dgFire(e.x, e.y - 8, i / n * 6.283 + R() * .3, 95, 10);
            }
          }
        }
      } else {
        e.an = 0;
        e.tm -= dt;
        if (e.tm <= 0) {
          e.s2 = 'move';
          e.cd = Math.max(.15, (1.5 - ph * .28) * (.3 + R() * 1.1));
        }
      }
    }
    const _bossTickDG = bossTick;
    bossTick = function (e, dt) {
      if (iceBossOn())
        return dgTick(e, dt); return _bossTickDG(e, dt);
    };
    const _toBossDG = toBoss;
    toBoss = function () {
      _toBossDG(); if (!iceBossOn())
        return; dgH = []; dgQ = []; dgB = []; dgR = []; const b = es.find(x => x.k == 'boss'); if (b) {
          b.hp = b.mhp = Math.round(b.mhp * 1.5);
          b.sp = 36;
          b.r = 20;
          b.ht = 70;
        } msg('Ruangan Bos — Kryovarth, Naga Es Purba, membekukan segalanya!');
    };

    /* ---------- update: hazard, beam napas, cincin kejut, beku ---------- */
    const _updDG = upd;
    upd = function (dt) {
      _updDG(dt);
      if (!iceBossOn() || !BOSS.on || p.dead > 0 || BOSS.dead) {
        if (dgH.length || dgQ.length || dgB.length || dgR.length) {
          dgH = [];
          dgQ = [];
          dgB = [];
          dgR = [];
        }
        return;
      }
      if (HST > 0)
        return;
      const e = es.find(x => x.k == 'boss');
      dgQ = dgQ.filter(o => {
        o.t -= dt; if (o.t <= 0) {
          o.f();
          return false;
        } return true;
      });
      dgH = dgH.filter(h => {
        h.t -= dt;
        if (h.t > 0)
          return true;
        SFX.boom(h.r);
        shake = Math.max(shake, h.k == 't' ? 7 : 4);
        fx.push({ k: 'ring', x: h.x, y: h.y, r: h.r, w: 3, life: .3, max: .3, col: '#bfeaff' }, { k: 'gl', x: h.x, y: h.y, r: h.r * 2, c: '150,220,255', life: .3, max: .3 });
        for (let i = 0; i < 14; i++) {
          const an = R() * 6.283, v = 30 + R() * 80;
          dp.push({
            k: 'p', x: h.x + Math.cos(an) * h.r * .5, y: h.y + Math.sin(an) * h.r * .3, vx: Math.cos(an) * v * .5, vy: -40 - R() * 80, life: .5 + R() * .4, max: .9, s: 2 + R() * 2.5, c: i % 2 ? '#e8fbff' : '#7fd0ff'
          });
        }
        if (p.dead <= 0 && Math.hypot(p.x - h.x, p.y - h.y) < h.r + p.r)
          hurt(h.d);
        return false;
      });
      dgB = dgB.filter(b => {
        b.t += dt;
        if (e) {
          const ho = dgHead(e, b.h);
          b.bx = ho[0];
          b.by = ho[1];
        }
        if (b.t >= b.warn) {
          const an = b.a0 + b.dir * b.sp * (b.t - b.warn);
          if (lseg(p.x, p.y, b.bx, b.by, an, b.len) < b.w / 2 + p.r)
            hurt(b.d);
          if (R() < dt * 40) {
            const q = R() * b.len;
            dp.push({
              k: 'p', x: b.bx + Math.cos(an) * q, y: b.by + Math.sin(an) * q, vx: (R() - .5) * 30, vy: -20 - R() * 30, life: .4, max: .4, s: 2, c: '#e8fbff'
            });
          }
          shake = Math.max(shake, 1.5);
        }
        return b.t < b.warn + b.life;
      });
      dgR = dgR.filter(r => {
        r.r += r.v * dt;
        const dd = Math.hypot(p.x - r.x, p.y - r.y);
        if (!r.hit && p.dead <= 0 && p.dod <= 0 && Math.abs(dd - r.r) < r.w / 2 + p.r) {
          const an = Math.atan2(p.y - r.y, p.x - r.x);
          if (Math.abs(Math.atan2(Math.sin(an - r.gap), Math.cos(an - r.gap))) > r.gw) {
            r.hit = 1;
            hurt(r.d);
          }
        }
        return r.r < 560;
      });
      if (e && BOSS.ph == 3 && !e.dying && e.s2 != 'morph' && dist(e, p) < 48 && p.inv <= 0)
        hurt(7);
    };
    const _hurtDG = hurt;
    hurt = function (d) {
      const h0 = p ? p.hp : 0; _hurtDG(d); try {
        if (iceOn() && p && p.hp < h0 && p.dead <= 0) {
          if (!(chillT > 0))
            msg('❄ Kau membeku! Gerakmu melambat.');
          chillT = Math.max(chillT, iceBossOn() ? 2.5 + BOSS.ph * .5 : 3);
          for (let i = 0; i < 10; i++)
            dp.push({
              k: 'p', x: p.x + (R() - .5) * 14, y: p.y + (R() - .5) * 14, vx: (R() - .5) * 60, vy: (R() - .5) * 60, life: .4, max: .4, s: 2, c: i % 2 ? '#e8fbff' : '#7fd0ff'
            });
        }
      } catch (er) { }
    };

    /* ---------- gambar: telegraph, beam, cincin; proyektil kristal; HUD ---------- */
    const _bgDG = bossGround;
    bossGround = function (e) {
      if (!iceBossOn())
        return _bgDG(e);
      if (e.sw > 0)
        return;
      const B = BOSS;
      g.save();
      if (B.ph >= 2) {
        g.globalCompositeOperation = 'lighter';
        const o = g.createRadialGradient(e.x, e.y, 0, e.x, e.y, 70);
        o.addColorStop(0, 'rgba(130,220,255,' + (.15 + .08 * B.ph + .06 * Math.sin(t * 6)) + ')');
        o.addColorStop(1, 'rgba(130,220,255,0)');
        g.fillStyle = o;
        g.fillRect(e.x - 70, e.y - 70, 140, 140);
        g.globalCompositeOperation = 'source-over';
      }
      dgH.forEach(h => { const k = 1 - h.t / h.mx; g.fillStyle = 'rgba(120,210,255,' + (.1 + .2 * k) + ')'; g.beginPath(); g.arc(h.x, h.y, h.r, 0, 7); g.fill(); g.strokeStyle = 'rgba(200,245,255,' + (.5 + .4 * k) + ')'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = 'rgba(210,248,255,.35)'; g.beginPath(); g.arc(h.x, h.y, h.r * k, 0, 7); g.fill(); });
      if (e.s2 == 'wind' && e.atk == 'lunge') {
        const k = 1 - e.tm / e.tmx;
        g.save();
        g.translate(e.x, e.y);
        g.rotate(e.ca);
        g.fillStyle = 'rgba(130,215,255,' + (.12 + .28 * k) + ')';
        g.fillRect(0, -14, 200, 28);
        g.strokeStyle = 'rgba(210,248,255,.7)';
        g.strokeRect(.5, -13.5, 200, 27);
        g.restore();
      }
      if (e.s2 == 'wind' && e.atk == 'nova') {
        const k = 1 - e.tm / e.tmx;
        g.strokeStyle = 'rgba(200,245,255,' + (.3 + .5 * k) + ')';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(e.x, e.y, 20 + k * 70, 0, 7);
        g.stroke();
      }
      dgB.forEach(b => {
        const warn = b.t < b.warn, an = warn ? b.a0 : b.a0 + b.dir * b.sp * (b.t - b.warn);
        g.save();
        g.translate(b.bx, b.by);
        g.rotate(an);
        if (warn) {
          g.strokeStyle = 'rgba(190,240,255,' + (.45 + .3 * Math.sin(t * 20)) + ')';
          g.setLineDash([6, 5]);
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(0, 0);
          g.lineTo(b.len, 0);
          g.stroke();
          g.setLineDash([]);
        } else {
          g.globalCompositeOperation = 'lighter';
          [
            [b.w * 2.4, 'rgba(60,160,255,.35)'], [b.w * 1.4, 'rgba(130,220,255,.6)'], [b.w * .6, 'rgba(240,255,255,.95)']
          ].forEach(([w, c]) => { g.fillStyle = c; g.fillRect(0, -w / 2, b.len, w); });
        }
        g.restore();
      });
      dgR.forEach(r => { g.lineCap = 'butt';[[r.w * 2.2, 'rgba(90,190,255,.22)'], [r.w, 'rgba(210,248,255,.85)']].forEach(([lw, c]) => { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); g.arc(r.x, r.y, r.r, r.gap + r.gw, r.gap + 6.283 - r.gw); g.stroke(); }); });
      g.restore();
    };
    const _drawRockDG = drawRock;
    drawRock = function (b) {
      if (b.ib)
        return drawIceBall(b);
      if (!b.ic)
        return _drawRockDG(b);
      g.save();
      g.translate(b.x, b.y);
      g.rotate(Math.atan2(b.vy, b.vx));
      g.globalCompositeOperation = 'lighter';
      const o = g.createRadialGradient(0, 0, 0, 0, 0, 12);
      o.addColorStop(0, 'rgba(200,245,255,.8)');
      o.addColorStop(1, 'rgba(80,190,255,0)');
      g.fillStyle = o;
      g.fillRect(-12, -12, 24, 24);
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#e8fbff';
      g.beginPath();
      g.moveTo(9, 0);
      g.lineTo(0, -3.6);
      g.lineTo(-8, 0);
      g.lineTo(0, 3.6);
      g.closePath();
      g.fill();
      g.fillStyle = '#6fc8ff';
      g.beginPath();
      g.moveTo(9, 0);
      g.lineTo(0, 3.6);
      g.lineTo(-8, 0);
      g.closePath();
      g.fill();
      g.restore();
    };
    const _rtDG = rockTrail;
    rockTrail = function (b) {
      if (!b.ic)
        return _rtDG(b); if (R() < .6)
        dp.push({
          k: 's', x: b.x, y: b.y, vx: (R() - .5) * 10, vy: (R() - .5) * 10, life: .3, max: .5, s: 2 + R() * 2, c: '190,235,255'
        });
    };
    const _rbDG = rockBreak;
    rockBreak = function (b) {
      if (!b.ic)
        return _rbDG(b); for (let i = 0; i < 8; i++) {
          const a = R() * 6.283, v = 40 + R() * 80;
          dp.push({
            k: 'p', x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .3 + R() * .3, max: .6, s: 1.5 + R() * 2, c: i % 2 ? '#e8fbff' : '#7fd0ff'
          });
        } fx.push({ k: 'ring', x: b.x, y: b.y, r: 9, w: 2, life: .18, max: .18, col: '#bfeaff' }); if (R() < .3)
        SFX.boom(8);
    };
    const _bossHudDG = bossHud;
    bossHud = function () {
      if (!iceBossOn())
        return _bossHudDG();
      const B = BOSS, e = es.find(x => x.k == 'boss');
      g.fillStyle = 'rgba(8,16,30,.92)';
      g.fillRect(W - 172, 6, 168, 44);
      g.font = 'bold 9px monospace';
      txt('BOSS CHAMBER', W - 10, 18, '#9fe4ff', 'right');
      txt('Kryovarth', W - 10, 44, '#778', 'right');
      if (e && e.sw <= 0 && !e.dying) {
        const bw = Math.min(W * .5, 360), x = W / 2 - bw / 2, y = 76;
        g.fillStyle = '#000b';
        g.fillRect(x - 2, y - 2, bw + 4, 10);
        g.fillStyle = B.ph >= 3 ? '#e8ffff' : B.ph == 2 ? '#7fe3ff' : '#5fb8f0';
        g.fillRect(x, y, bw * Math.max(0, e.hp) / e.mhp, 6);
        g.fillStyle = '#fff6';
        [.66, .33].forEach(k => g.fillRect(x + bw * k, y - 2, 1, 10));
        g.font = 'bold 9px monospace';
        txt('KRYOVARTH · ' + DGN[Math.min(2, Math.max(0, B.ph - 1))], W / 2, y - 5, '#cdf4ff', 'center');
      }
      if (B.ban > 0) {
        const al = Math.max(0, Math.min(1, B.ban / .5, (3.2 - B.ban) / .4));
        g.save();
        g.globalAlpha = al;
        g.fillStyle = 'rgba(0,10,30,.65)';
        g.fillRect(0, 100, W, 44);
        g.fillStyle = 'rgba(160,230,255,.9)';
        g.fillRect(0, 100, W, 1);
        g.fillRect(0, 143, W, 1);
        g.font = '8px monospace';
        txt('— B O S S —', W / 2, 113, '#fff', 'center');
        g.font = 'bold 18px monospace';
        txt('KRYOVARTH', W / 2, 136, '#9fe4ff', 'center');
        g.restore();
      }
    };
    /* ===== KRYOVARTH v2: rig bersendi (leher/ekor/sayap/kaki), gerak halus berinersia, tanpa lompatan kaku ===== */
    SMR = v => ((lavaOn() && room == 2) || iceBossOn()) ? v : Math.round(v);
    const _emDG2 = EM.boss;
    EM.boss = function (pp, at, tm) {
      if (!iceBossOn())
        return _emDG2(pp, at, tm);
      const e = BOSS_E || {}, fl = !!MT, F = c => fl ? '#fff' : c, ph = BOSS.ph || 1, PI = Math.PI, ez = q => 1 - (1 - q) * (1 - q), cl = (v, a, b) => Math.max(a, Math.min(b, v));
      const mk0 = e.s2 == 'morph' && e.mtx ? 1 - e.mt / e.mtx : -1, f = mk0 >= 0 && mk0 < .55 ? Math.max(1, ph - 1) : ph;
      const PAL = [
        ['#173f66', '#3a86c0', '#d6f3ff', '#7fdcff'], ['#102f55', '#2a74b4', '#b4ecff', '#4fe0ff'], ['#16245e', '#4f8fe8', '#f0ffff', '#c6f6ff']
      ][f - 1], D = PAL[0], M = PAL[1], L = PAL[2], G = PAL[3];
      const S = e.dg || (e.dg = {
        x: e.x, y: e.y, px: e.x, py: e.y, vx: 0, vy: 0, m: 0, ln: 0, gp: 0, pt: t, roar: 0, wing: 0, hv: 0, nk: {}, ha: {}, op: {}
      });
      const dt = cl(t - S.pt, .001, .05), kk = r => 1 - Math.exp(-r * dt), ph0 = S.pt == t;
      S.pt = t;
      if (!ph0) {
        S.vx += ((e.x - S.px) / dt - S.vx) * kk(7);
        S.vy += ((e.y - S.py) / dt - S.vy) * kk(7);
        S.px = e.x;
        S.py = e.y;
        S.x += (e.x - S.x) * kk(12);
        S.y += (e.y - S.y) * kk(12);
      }
      const sp = Math.hypot(S.vx, S.vy);
      S.m += (cl(sp / 38, 0, 1) - S.m) * kk(6);
      S.gp += dt * (3 + 6 * S.m) * (S.m > .04 ? 1 : 0.15);
      const k = e.atk, w = e.s2 == 'wind' && at, q = ez(pp || 0);
      let roar = 0, wing = 0, lean = 0, hv = 0;
      if (w) {
        if (k == 'nova' || k == 'triad') {
          roar = q;
          wing = q;
        } else if (k == 'breath')
          roar = .85 * q;
        else if (k == 'lunge')
          lean = (Math.cos(e.ca || 0) < 0 ? -1 : 1) * .12 * q;
        else if (k == 'icicles' || k == 'hail') {
          wing = q;
          hv = q;
        } else if (k == 'blizzard') {
          wing = q;
          roar = .5 * q;
        } else if (k == 'tail')
          lean = -.07 * q;
        else
          roar = .5 * q;
      } else if (e.s2 == 'act') {
        roar = .9;
        wing = .5;
      } else if (e.s2 == 'morph') {
        roar = 1;
        wing = 1;
      }
      S.roar += (roar - S.roar) * kk(11);
      S.wing += (wing - S.wing) * kk(9);
      S.hv += (hv - S.hv) * kk(11);
      roar = S.roar;
      wing = S.wing;
      hv = S.hv;
      S.ln += (cl(S.vx / 170, -1, 1) * .09 + lean - S.ln) * kk(9);
      let jx = 0, sc = 1;
      if (mk0 >= 0) {
        jx = (R() - .5) * 10 * mk0;
        if (mk0 > .55)
          sc = 1 + .2 * (1 - (mk0 - .55) / .45);
      }
      const by = Math.sin(tm * 2.3) * 3 + S.m * Math.sin(S.gp * 2) * 2, br = Math.sin(tm * 1.8) * .025, SS = DG_SS[f - 1] * sc;
      const ox = cl(S.x - e.x, -12, 12) / .4, oy = cl(S.y - e.y, -12, 12) / .4;
      const poly = (a, c) => { g.fillStyle = F(c); g.beginPath(); a.forEach((v, i) => i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1])); g.closePath(); g.fill(); };
      const ell = (x, y, rx, ry, c) => { g.fillStyle = F(c); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
      const glow = (x, y, r, c, a) => {
        if (fl)
          return; g.save(); g.globalCompositeOperation = 'lighter'; const o = g.createRadialGradient(x, y, 0, x, y, r); o.addColorStop(0, 'rgba(' + c + ',' + a + ')'); o.addColorStop(1, 'rgba(' + c + ',0)'); g.fillStyle = o; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
      };
      const seg = (a, b, lw, c) => { g.strokeStyle = F(c); g.lineWidth = lw; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
      const limb = (P, lw, c1, c2, tp) => {
        const n = P.length - 1; for (let i = 0; i < n; i++) {
          const u = lw * (1 - i / n * (tp || .45));
          seg(P[i], P[i + 1], u, c1);
          seg(P[i], P[i + 1], u * .38, c2);
        } for (let i = 1; i < n; i++) {
          const r = lw * (1 - i / n * (tp || .45)) * .5;
          ell(P[i][0], P[i][1], r, r, c1);
          ell(P[i][0], P[i][1], r * .5, r * .5, c2);
        }
      };
      const dA = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b)), SSn = .4 * DG_SS[f - 1];
      g.save();
      g.translate(0, Math.abs(Math.sin(tm * 10)) * 7 * (e.wk || 0));
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.translate(320 + jx + ox, 333 + oy);
      g.rotate(S.ln);
      g.scale(SS, SS);
      g.translate(-320, -333);
      if (!fl) {
        g.fillStyle = 'rgba(0,0,0,.35)';
        g.beginPath();
        g.ellipse(320, 331, 92 - by, 11, 0, 0, 7);
        g.fill();
      }
      glow(320, 230, 200, '110,215,255', .13 + .04 * f + .04 * Math.sin(tm * 3));
      // sayap: bahu -> siku -> pergelangan -> jari, tiap sendi menyusul dengan jeda (efek cambuk)
      [-1, 1].forEach(s => {
        const ff = o => Math.sin(tm * 2.2 + (s > 0 ? 0 : .35) - o) * (1 - wing * .55), d = a => [s * Math.cos(a), Math.sin(a)], add = (P, a, l) => [P[0] + d(a)[0] * l, P[1] + d(a)[1] * l];
        const sh = [320 + s * 44, 214 + by], A1 = -.5 - .55 * ff(0) - wing * .55, A2 = -.2 - .6 * ff(.7) - wing * .4, A3 = .35 - .55 * ff(1.4) - wing * .2;
        const E = add(sh, A1, 52 + f * 9), Wr = add(E, A2, 62 + f * 13), nf = f >= 2 ? 4 : 3, T = [];
        for (let i = 0; i < nf; i++)
          T.push(add(Wr, A3 + .2 + i * (.62 - ff(1.8 + i * .3) * .08), (96 + f * 16) * (1 - i * .13)));
        poly([sh, E, Wr, ...T, [320 + s * 26, 268 + by]], M);
        poly([
          [sh[0], sh[1] + 10], [E[0], E[1] + 8], ...T.map(v => [Wr[0] + (v[0] - Wr[0]) * .86, Wr[1] + (v[1] - Wr[1]) * .86]), [320 + s * 30, 262 + by]
        ], 'rgba(190,238,255,.45)');
        T.forEach(v => { seg(Wr, v, 4, D); seg(Wr, v, 1.4, L); ell(v[0], v[1], 2.4, 2.4, L); });
        limb([sh, E, Wr], 9, D, L, .35);
        ell(Wr[0], Wr[1], 5.5, 5.5, G);
        if (f >= 2)
          T.forEach(v => poly([[v[0], v[1]], [v[0] + s * 6, v[1] + 16], [v[0] - s * 4, v[1] + 3]], L));
      });
      // ekor: 9 ruas, gelombang menjalar + terseret arah gerak
      {
        let a = .3 - S.vx / 260 * .5, P = [[350, 296 + by]], x = 350, y = 296 + by;
        for (let j = 0; j < 9; j++) {
          a += Math.sin(tm * 1.7 - j * .6) * (.13 + j * .01) - S.ln * .12;
          x += Math.cos(a) * 21;
          y += Math.sin(a) * 21 * .8 + .6;
          P.push([x, y]);
          if (j % 2 == 0)
            poly([[x - 4, y - 3], [x + 1, y - 13 - f * 2], [x + 5, y - 3]], j % 4 ? L : G);
        }
        limb(P, 25, D, M, .8);
        const T = P[9], U = P[8], ta = Math.atan2(T[1] - U[1], T[0] - U[0]);
        g.save();
        g.translate(T[0], T[1]);
        g.rotate(ta);
        poly([[-4, 6], [30, 0], [-4, -6], [4, 0]], L);
        poly([[0, 5], [12, 15], [8, 2]], G);
        poly([[0, -5], [12, -15], [8, -2]], G);
        g.restore();
      }
      // badan bernapas
      g.save();
      g.translate(0, by);
      g.translate(320, 262);
      g.scale(1 + br, 1 + br * .9);
      g.translate(-320, -262);
      ell(320, 262, 72, 58, D);
      ell(320, 259, 65, 51, M);
      ell(320, 252, 44, 38, F(f == 1 ? '#5aa5d8' : f == 2 ? '#4a9ae0' : '#7fb4ff'));
      for (let i = 0; i < 5; i++)
        ell(320, 238 + i * 13, 30 - i * 3, 5, L);
      const ns = 6 + f * 2;
      for (let i = 0; i < ns; i++) {
        const x = 262 + i * 116 / (ns - 1) + Math.sin(tm * 2 - i * .5) * 1.5, y = 222 - Math.sin(i / (ns - 1) * PI) * 22;
        poly([[x - 7, y + 16], [x, y - 8 - f * 3 - (i % 2) * 6], [x + 7, y + 16]], i % 2 ? L : G);
      }
      if (f >= 2) {
        glow(320, 258, 40, '120,230,255', .4 + .25 * Math.sin(tm * 4));
        ell(320, 258, 9, 9, L);
      }
      if (f == 3) {
        g.strokeStyle = F('#e8ffff');
        g.lineWidth = 1.4;
        g.beginPath();
        g.moveTo(290, 236);
        g.lineTo(304, 262);
        g.lineTo(296, 288);
        g.moveTo(350, 240);
        g.lineTo(338, 268);
        g.lineTo(348, 290);
        g.stroke();
      }
      g.restore();
      // kaki: paha -> lutut -> pergelangan (IK), siklus langkah
      [-1, 1].forEach(s => {
        const phs = S.gp + (s > 0 ? PI : 0), lift = Math.max(0, Math.sin(phs)) * S.m, hip = [320 + s * 40, 284 + by * .6], ft = [320 + s * (44 + Math.cos(phs) * 11 * S.m), 335 - lift * 15], r = mIK(hip[0], hip[1], ft[0], ft[1], 30, 30, s);
        limb([hip, [r[0], r[1]], [r[2], r[3]]], 25, D, M, .3);
        ell(r[2], r[3] + 1, 17, 6, D);
        [-10, 0, 10].forEach(o => poly([[r[2] + o - 4, r[3] + 3], [r[2] + o + 4, r[3] + 3], [r[2] + o + s * 2, r[3] + 10]], L));
      });
      // leher: rantai 6 sendi (pangkal lambat, kepala cepat) + kepala berengsel rahang
      DG_HP[f - 1].forEach((hp, i) => {
        const key = f + '_' + i, hs = f == 1 ? 1.15 : f == 3 && i == 0 ? 1.2 : .95, hx = hp[0] + Math.sin(tm * 1.6 + i * 2.1) * 6, hy = hp[1] + by + Math.sin(tm * 2.1 + i) * 4 - roar * 16 - hv * 6;
        const mine = e.hd % f == i || k == 'triad' || k == 'nova';
        let op = .1 + .07 * Math.sin(tm * 2 + i * 2);
        if (w && mine)
          op = .25 + .75 * q;
        else if (e.s2 == 'act' && mine)
          op = .9;
        if (e.s2 == 'morph')
          op = 1;
        S.op[key] = S.op[key] == null ? op : S.op[key] + (op - S.op[key]) * kk(13);
        op = S.op[key];
        const sx = 320 + (hp[0] - 320) * .3, sy = 238 + by, cx = 320 + (hp[0] - 320) * .8, cy = (hy + sy) / 2 + 24, N = 6, nk = S.nk[key] || (S.nk[key] = []);
        for (let j = 0; j <= N; j++) {
          const T = j ? bz(j / N, sx, sy, cx, cy, hx, hy + 8) : [sx, sy];
          if (!nk[j])
            nk[j] = [T[0], T[1]];
          else {
            const r = kk(j ? 7 + j * 3.6 : 60);
            nk[j][0] += (T[0] - nk[j][0]) * r;
            nk[j][1] += (T[1] - nk[j][1]) * r;
          }
        }
        limb(nk, 30 * hs, D, M, .5);
        for (let j = 1; j < N; j++)
          poly([[nk[j][0] - 5, nk[j][1] + 3], [nk[j][0], nk[j][1] - 10 - (j % 2) * 3], [nk[j][0] + 5, nk[j][1] + 3]], j % 2 ? L : G);
        const H = nk[N], tx = Math.atan2(p.y - (e.y + 7 + (H[1] - 333) * SSn), p.x - (e.x + (H[0] - 320) * SSn));
        let ha = -PI / 2 + (hp[0] - 320) * .004 + Math.sin(tm * 1.3 + i) * .1;
        ha = roar > .6 ? -PI / 2 + (hp[0] - 320) * .006 : ha + dA(tx, ha) * (op > .25 ? 1 : .35);
        S.ha[key] = S.ha[key] == null ? ha : S.ha[key] + dA(ha, S.ha[key]) * kk(9);
        ha = S.ha[key];
        g.save();
        g.translate(H[0], H[1]);
        g.rotate(ha);
        g.scale(hs, hs);
        poly([[-6, -9], [-26, -26], [-42, -24], [-24, -12]], L);
        poly([[-6, 9], [-26, 26], [-42, 24], [-24, 12]], L);
        poly([[-16, -13], [8, -12], [30, -6], [37, 0], [30, 5], [8, 9], [-16, 13]], D);
        poly([[-12, -9], [8, -8], [28, -3], [32, 1], [8, 6], [-12, 9]], M);
        for (let j = 0; j < 4; j++)
          poly([[16 + j * 5, 5], [19 + j * 5, 5], [17.5 + j * 5, 10]], '#fff');
        g.save();
        g.translate(-6, 8);
        g.rotate(op * .75);
        poly([[0, 0], [34, 3], [39, 9], [4, 14]], D);
        poly([[3, 3], [32, 5], [35, 8], [5, 11]], M);
        for (let j = 0; j < 3; j++)
          poly([[10 + j * 7, 3], [13 + j * 7, 3], [11.5 + j * 7, -3]], '#fff');
        ell(0, 2, 4, 4, G);
        g.restore();
        for (let j = 0; j < 5; j++)
          poly([[-10 + j * 6, -12], [-6 + j * 6, -12], [-8 + j * 6, -21 - (j % 2) * 4 + Math.sin(tm * 3 + j) * 1.2]], j % 2 ? G : L);
        poly([[6, -8], [15, -6], [8, -2]], fl ? '#fff' : f == 3 ? '#ffffff' : '#9ff4ff');
        g.restore();
        const mx = H[0] + Math.cos(ha) * 30 * hs, my = H[1] + Math.sin(ha) * 30 * hs;
        glow(H[0] + Math.cos(ha) * 8 * hs, H[1] + Math.sin(ha) * 8 * hs - 3, 20, '170,250,255', .7);
        if (op > .3)
          glow(mx, my, 30 * op, '150,235,255', .6 * op);
      });
      glow(320, 330, 120, '140,225,255', .08);
      if (!fl) {
        g.save();
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 16; i++) {
          const u = (tm * .25 + i * .0625) % 1;
          g.fillStyle = 'rgba(225,248,255,' + (1 - u) * .8 + ')';
          g.fillRect(Math.round(320 + Math.sin(i * 12.9) * 150 + Math.sin(tm + i) * 8), Math.round(330 - u * 270), 3, 3);
        }
        g.restore();
      }
      g.restore();
    };
    /* musuh es biasa: ayun badan berinersia (condong ke arah gerak + goyang langkah), berputar di kaki */
    const _iceDrawSm = iceDraw;
    iceDraw = function (e) {
      if (e.rx == null)
        return _iceDrawSm(e);
      const m = e.mz || 0, a = (e.vxs || 0) / 400 * m + Math.sin((e.gp || 0)) * .03 * m + Math.sin(t * 1.7 + (e.ph || 0)) * .012;
      e.sw2 = (e.sw2 || 0) + (a - (e.sw2 || 0)) * .18;
      g.save();
      g.translate(e.rx, e.ry + 7);
      g.rotate(e.sw2);
      g.translate(-e.rx, -(e.ry + 7));
      try {
        _iceDrawSm(e);
      } finally {
        g.restore();
      }
    };

    /* ===== DASH/GULING v2: akselerasi cepat lalu mengerem halus, squash & stretch, lompatan kecil, jejak bercahaya ===== */
    function dashU() {
      if (p.dod > (p._pd || 0) + .001)
        p.dmx = p.dod; p._pd = p.dod; return p.dmx > 0 ? Math.min(1, Math.max(0, 1 - p.dod / p.dmx)) : 1;
    }

    function dashK() {
      if (p.dsp)
        return 1; const u = dashU(); return 1.6 - 1.2 * u;
    } /* rata-rata ≈ 1 → jarak tetap sama */

    function dashXf(x, y) {
      if (!(p.dod > 0) || p.dsp)
        return 0;
      const u = dashU(), s = Math.pow(1 - u, 1.4), a = Math.atan2(p.dy, p.dx);
      g.translate(x, y - Math.sin(Math.PI * Math.min(1, u * 1.15)) * 4);
      g.rotate(a);
      g.scale(1 + .3 * s, 1 - .2 * s);
      g.rotate(-a);
      g.rotate(p.dx * .16 * (1 - u * .6));
      g.translate(-x, -y);
      return 1;
    }
    const _dhDash = drawHero;
    drawHero = function (x, y, ghost, ph, lx, ly) {
      if (ghost)
        return _dhDash(x, y, ghost, ph, lx, ly); g.save(); dashXf(x, y); try {
          return _dhDash(x, y, ghost, ph, lx, ly);
        } finally {
        g.restore();
      }
    };
    const _daDash = drawArmed;
    drawArmed = function (wp) {
      g.save(); dashXf(p.x, p.y); try {
        return _daDash(wp);
      } finally {
        g.restore();
      }
    };
    const _dtDash = dodgeTrail;
    dodgeTrail = function () {
      _dtDash();
      const u = dashU(), a = Math.atan2(p.dy, p.dx);
      fx.push({
        k: 'gl', x: p.x - Math.cos(a) * 8, y: p.y - Math.sin(a) * 8, r: 20 + 10 * (1 - u), c: '255,140,165', life: .2, max: .2
      });
      if (R() < .8)
        dp.push({
          k: 'p', x: p.x + (R() - .5) * 8, y: p.y + 9, vx: -Math.cos(a) * 30 + (R() - .5) * 20, vy: -8 - R() * 14, life: .35, max: .35, s: 2 + R() * 2, c: '#9a8f86'
        });
    };
    const _deDash = dodgeEnd;
    dodgeEnd = function () {
      _deDash(); const a = Math.atan2(p.dy, p.dx); for (let i = 0; i < 8; i++)
        dp.push({
          k: 'p', x: p.x, y: p.y + 9, vx: Math.cos(a) * (30 + R() * 50) + (R() - .5) * 30, vy: -6 - R() * 16, life: .35 + R() * .2, max: .55, s: 2 + R() * 2, c: '#9a8f86'
        });
    };

    /* ===== HITBOX BOS: radius disesuaikan dengan ukuran badan (Morvath, bos lava, Kryovarth per fase) ===== */
    const bossHR = () => iceBossOn() ? Math.round(28.8 * DG_SS[Math.min(2, Math.max(0, (BOSS.ph || 1) - 1))]) : 28;
    const _btHB = bossTick;
    bossTick = function (e, dt) {
      if (e && e.k == 'boss')
        e.r = bossHR(); return _btHB(e, dt);
    };
    const _tbHB = toBoss;
    toBoss = function () {
      _tbHB(); const b = es.find(x => x.k == 'boss'); if (b)
        b.r = bossHR();
    };
    function bossNm() { return LVL == 3 ? 'Kryovarth' : LVL == 2 ? 'Pyrovarth' : 'Morvath'; }

    /* ===== LEVEL 3 REDESIGN: Frost Hall = gua es + danau beku, Glacier Crypt = makam es, Ruang Bos = Takhta Kryovarth =====
       Semua dibungkus try/catch: kalau ada error, desain es lama otomatis dipakai lagi. */
    (function () {
      const TAU = Math.PI * 2, rg = s => { let d = s; return () => (d = (d * 1664525 + 1013904223) >>> 0) / 4294967296; };
      const mkC = () => { const c = document.createElement('canvas'); c.width = DW; c.height = DH; return c; };
      const LG = (b, x0, y0, x1, y1, st) => { const q = b.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
      const RG = (b, x, y, r0, r1, st) => { const q = b.createRadialGradient(x, y, r0, x, y, r1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
      const poly = (b, p) => { b.beginPath(); p.forEach((q, i) => i ? b.lineTo(q[0], q[1]) : b.moveTo(q[0], q[1])); b.closePath(); b.fill(); };
      const glowB = (b, x, y, r, c, a) => { b.save(); b.globalCompositeOperation = 'lighter'; b.fillStyle = RG(b, x, y, 0, r, [[0, 'rgba(' + c + ',' + a + ')'], [1, 'rgba(' + c + ',0)']]); b.fillRect(x - r, y - r, r * 2, r * 2); b.restore(); };
      const shadow = (b, x, y, rx) => { b.fillStyle = 'rgba(0,8,24,.5)'; b.beginPath(); b.ellipse(x, y, rx, 6, 0, 0, TAU); b.fill(); };

      /* ---------- tata letak (tabrakan) tiap ruangan ---------- */
      const IW = [
        [
          ...WB(), [250, 130, 30, 30], [520, 130, 30, 30], [250, 320, 30, 30], [520, 320, 30, 30], [370, 210, 60, 60, 'm'], [150, 98, 38, 28, 'r'], [612, 354, 38, 28, 'r']
        ],
        [
          ...WB(), [352, 210, 96, 60, 'a'], [290, 130, 26, 26, 'p'], [484, 130, 26, 26, 'p'], [290, 324, 26, 26, 'p'], [484, 324, 26, 26, 'p'], [110, 150, 26, 56, 's'], [110, 274, 26, 56, 's'], [664, 150, 26, 56, 's'], [664, 274, 26, 56, 's']
        ],
        [
          ...WB(), [346, 14, 108, 74, 't'], [160, 112, 34, 34, 'o'], [160, 334, 34, 34, 'o'], [606, 112, 34, 34, 'o'], [606, 334, 34, 34, 'o']
        ]
      ];
      /* lampu: c = kristal bercahaya, f = obor api biru, B = perapian biru besar */
      const LP = [
        [
          [7, 130, 'c'], [7, 350, 'c'], [793, 130, 'c'], [793, 350, 'c'], [250, 8, 'c'], [550, 8, 'c'], [250, 472, 'c'], [550, 472, 'c']
        ],
        [100, 200, 300, 400, 500, 600, 700].flatMap(x => [[x, 8, 'f'], [x, DH - 7, 'f']]).concat([[36, 60, 'B'], [764, 60, 'B'], [36, 420, 'B'], [764, 420, 'B']]),
        [[40, 60, 'B'], [760, 60, 'B'], [40, 420, 'B'], [760, 420, 'B']].concat([150, 250, 550, 650].flatMap(x => [[x, 8, 'f'], [x, DH - 7, 'f']]))
      ];

      /* ---------- util gambar ---------- */
      const cracks = (b, r, n, c1, c2, step) => {
        b.lineCap = b.lineJoin = 'round';
        const L = [];
        for (let i = 0; i < n; i++) {
          let x = r() * DW, y = r() * DH, a = r() * TAU;
          const p = [[x, y]];
          for (let k = 0, m = 3 + (r() * 5 | 0); k < m; k++) {
            a += (r() - .5) * 1.3;
            x += Math.cos(a) * step * (.5 + r());
            y += Math.sin(a) * step * (.5 + r());
            p.push([x, y]);
          }
          L.push(p);
        }
        [[3, c1], [1.1, c2]].forEach(([w, c]) => { b.strokeStyle = c; b.lineWidth = w; L.forEach(p => { b.beginPath(); p.forEach((q, i) => i ? b.lineTo(q[0], q[1]) : b.moveTo(q[0], q[1])); b.stroke(); }); });
      };
      const flake = (b, x, y, R_, col, lw) => {
        b.strokeStyle = col;
        b.lineWidth = lw;
        for (let k = 0; k < 6; k++) {
          const a = k * TAU / 6;
          b.beginPath();
          b.moveTo(x, y);
          b.lineTo(x + Math.cos(a) * R_, y + Math.sin(a) * R_);
          [.45, .7].forEach(q => { const px = x + Math.cos(a) * R_ * q, py = y + Math.sin(a) * R_ * q;[-1, 1].forEach(s => { b.moveTo(px, py); b.lineTo(px + Math.cos(a + s * .9) * R_ * .2, py + Math.sin(a + s * .9) * R_ * .2); }); });
          b.stroke();
        }
      };

      function wallBand(b, r, o) {
        b.fillStyle = o.f;
        WB().forEach(q => b.fillRect(...q));
        for (let i = 0; i < 300; i++) {
          const x = r() * DW, y = r() * DH;
          if (x > 14 && x < DW - 14 && y > 14 && y < DH - 14)
            continue;
          b.fillStyle = r() < .5 ? o.a : o.b;
          b.fillRect(x, y, 2 + r() * 8 | 0, 2 + r() * 4 | 0);
        }
        b.fillStyle = o.e;
        b.fillRect(14, 12, DW - 28, 2);
        b.fillRect(14, DH - 14, DW - 28, 2);
        b.fillRect(12, 14, 2, DH - 28);
        b.fillRect(DW - 14, 14, 2, DH - 28);
        const sp = (x, y, dx, dy, L, w) => { b.fillStyle = o.i; poly(b, [[x - dy * w, y + dx * w], [x + dx * L, y + dy * L], [x + dy * w, y - dx * w]]); b.fillStyle = o.il; poly(b, [[x - dy * w, y + dx * w], [x + dx * L, y + dy * L], [x, y]]); };
        for (let x = 20; x < DW - 16; x += 10 + r() * 14) {
          if (o.skip && o.skip(x))
            continue;
          sp(x, 14, 0, 1, 6 + r() * o.L, 2 + r() * 2.5);
          if (r() < .8)
            sp(x + 3, DH - 14, 0, -1, 5 + r() * o.L * .8, 2 + r() * 2.5);
        }
        for (let y = 24; y < DH - 20; y += 14 + r() * 18) {
          if (Math.abs(y - DY) < 44)
            continue;
          sp(14, y, 1, 0, 5 + r() * 10, 2 + r() * 2);
          sp(DW - 14, y, -1, 0, 5 + r() * 10, 2 + r() * 2);
        }
      }
      const vig = b => { b.fillStyle = RG(b, DW / 2, DY, 220, 480, [[0, 'rgba(2,8,22,0)'], [1, 'rgba(2,8,22,.6)']]); b.fillRect(0, 0, DW, DH); };

      /* ---------- properti ---------- */
      function crystals(b, x, y, w, h, r, sc) {
        const cx = x + w / 2, by = y + h - 2;
        shadow(b, cx + 3, by + 3, w * .8);
        b.fillStyle = 'rgba(230,248,255,.8)';
        b.beginPath();
        b.ellipse(cx, by + 1, w * .62, h * .2, 0, 0, TAU);
        b.fill();
        [-2, 2, -1, 1, 0].forEach(k => {
          const bx = cx + k * w * .22, hh = (30 + r() * 18) * sc * (1 - Math.abs(k) * .16), ww = (5 + r() * 2.5) * sc, yy = by - Math.abs(k);
          b.fillStyle = '#2f6ab0';
          poly(b, [[bx - ww, yy], [bx - ww * .7, yy - hh * .7], [bx, yy - hh], [bx + ww * .7, yy - hh * .7], [bx + ww, yy]]);
          b.fillStyle = '#8fdcff';
          poly(b, [[bx - ww, yy], [bx - ww * .7, yy - hh * .7], [bx, yy - hh], [bx, yy]]);
          b.fillStyle = 'rgba(255,255,255,.9)';
          b.fillRect(bx - ww * .4, yy - hh * .75, 1.5, hh * .4);
        });
        glowB(b, cx, by - 16 * sc, 36 * sc, '120,210,255', .2);
      }

      function monolith(b, x, y, w, h) {
        const cx = x + w / 2;
        shadow(b, cx + 4, y + h + 2, w * .66);
        b.fillStyle = LG(b, x, y, x + w, y + h, [[0, '#7fcdf2'], [.5, '#3f86c8'], [1, '#1d4f92']]);
        b.fillRect(x, y + 14, w, h - 14);
        b.fillStyle = '#c6efff';
        poly(b, [[x, y + 14], [x + 9, y], [x + w - 9, y], [x + w, y + 14]]);
        b.fillStyle = 'rgba(255,255,255,.55)';
        b.fillRect(x + 3, y + 18, 2, h - 24);
        b.fillStyle = 'rgba(8,24,60,.78)';
        b.beginPath();
        b.arc(cx, y + 28, 5, 0, TAU);
        b.fill();
        b.fillRect(cx - 7, y + 33, 14, 16);
        b.fillRect(cx - 12, y + 35, 4, 12);
        b.fillRect(cx + 8, y + 35, 4, 10);
        b.fillRect(cx - 5, y + 48, 4, 8);
        b.fillRect(cx + 1, y + 48, 4, 8);
        b.fillRect(cx + 11, y + 22, 2, 22);
        glowB(b, cx, y + 36, 34, '140,225,255', .22);
        b.strokeStyle = 'rgba(255,255,255,.7)';
        b.lineWidth = 1;
        b.beginPath();
        b.moveTo(x + 4, y + 20);
        b.lineTo(x + 14, y + 34);
        b.lineTo(x + 8, y + 50);
        b.stroke();
      }

      function boulder(b, x, y, w, h) {
        shadow(b, x + w / 2 + 3, y + h, w * .6);
        b.fillStyle = '#35506e';
        poly(b, [[x, y + h], [x + 3, y + 8], [x + w * .35, y], [x + w * .75, y + 3], [x + w, y + 12], [x + w - 2, y + h]]);
        b.fillStyle = '#4a6a8c';
        poly(b, [[x + 3, y + 8], [x + w * .35, y], [x + w * .5, y + h * .5], [x + 4, y + h * .7]]);
        b.fillStyle = 'rgba(240,250,255,.95)';
        poly(b, [
          [x + 1, y + 11], [x + 5, y + 6], [x + w * .35, y - 1], [x + w * .75, y + 2], [x + w + 1, y + 13], [x + w * .7, y + 9], [x + w * .5, y + 12], [x + w * .3, y + 8], [x + 8, y + 13]
        ]);
      }

      function column(b, x, y, w, h) {
        const cx = x + w / 2;
        shadow(b, cx + 3, y + h, w * .7);
        b.fillStyle = '#0f2a50';
        b.fillRect(x - 2, y + h - 8, w + 4, 8);
        b.fillStyle = LG(b, x, 0, x + w, 0, [[0, '#6fb4e6'], [.55, '#2f6aa8'], [1, '#17396e']]);
        b.fillRect(x + 3, y - 34, w - 6, h + 26);
        b.fillStyle = 'rgba(235,250,255,.8)';
        for (let i = 0; i < 3; i++)
          b.fillRect(x + 3, y - 20 + i * 14, w - 6, 2);
        b.fillStyle = '#9fdcf8';
        b.fillRect(x - 2, y - 38, w + 4, 6);
        for (let i = -1; i <= 1; i++) {
          b.fillStyle = '#dff6ff';
          poly(b, [[cx + i * 7 - 3, y - 38], [cx + i * 7, y - 38 - (i ? 6 : 10)], [cx + i * 7 + 3, y - 38]]);
        }
        glowB(b, cx, y - 40, 22, '140,225,255', .25);
      }

      function altar(b, x, y, w, h) {
        const cx = x + w / 2, cy = y + h / 2;
        b.fillStyle = 'rgba(0,8,24,.5)';
        b.fillRect(x + 4, y + h - 2, w, 8);
        b.fillStyle = '#10264a';
        b.fillRect(x, y, w, h);
        b.fillStyle = '#2c5c98';
        b.fillRect(x + 4, y + 4, w - 8, h - 8);
        b.fillStyle = '#4a82c0';
        b.fillRect(x + 4, y + 4, w - 8, 3);
        b.fillStyle = '#1d437a';
        b.fillRect(x + 12, y + 12, w - 24, h - 24);
        b.save();
        b.shadowColor = '#7fe0ff';
        b.shadowBlur = 6;
        flake(b, cx, cy + 2, 17, 'rgba(210,248,255,.95)', 1.5);
        b.restore();
        [[-12, 26, 5], [12, 22, 4.5], [0, 44, 7]].forEach(([ox, hh, ww]) => { const bx = cx + ox, by = cy - 4; b.fillStyle = '#2f6ab0'; poly(b, [[bx - ww, by], [bx - ww * .7, by - hh * .7], [bx, by - hh], [bx + ww * .7, by - hh * .7], [bx + ww, by]]); b.fillStyle = '#9fe4ff'; poly(b, [[bx - ww, by], [bx - ww * .7, by - hh * .7], [bx, by - hh], [bx, by]]); b.fillStyle = 'rgba(255,255,255,.9)'; b.fillRect(bx - ww * .4, by - hh * .7, 1.5, hh * .4); });
        glowB(b, cx, cy - 20, 52, '130,220,255', .3);
      }

      function sarco(b, x, y, w, h) {
        b.fillStyle = 'rgba(0,8,24,.5)';
        b.fillRect(x + 3, y + h - 2, w, 6);
        b.fillStyle = '#12284c';
        b.fillRect(x, y + h - 10, w, 10);
        b.fillStyle = '#2a528a';
        poly(b, [[x + 3, y + h - 10], [x, y + 8], [x + w * .5, y], [x + w, y + 8], [x + w - 3, y + h - 10]]);
        b.fillStyle = '#4a82c0';
        poly(b, [[x + 3, y + h - 10], [x, y + 8], [x + w * .5, y], [x + w * .5, y + h - 10]]);
        b.fillStyle = 'rgba(220,246,255,.35)';
        b.fillRect(x + 2, y + 10, w - 4, 8);
        b.fillStyle = '#9fe4ff';
        b.fillRect(x + w / 2 - 1, y + 8, 2, h - 24);
        b.fillRect(x + w / 2 - 5, y + 16, 10, 2);
        glowB(b, x + w / 2, y + h / 2, 22, '130,220,255', .2);
      }

      function throne(b, x, y, w, h) {
        const cx = x + w / 2;
        b.fillStyle = 'rgba(0,6,20,.6)';
        b.fillRect(x + 4, y + h - 2, w, 8);
        b.fillStyle = '#16335e';
        b.fillRect(x, y + h - 14, w, 14);
        b.fillStyle = '#3a72b0';
        b.fillRect(x + 2, y + h - 14, w - 4, 3);
        b.fillStyle = '#1d4378';
        b.fillRect(x + 12, y + h - 28, w - 24, 14);
        b.fillStyle = '#4a82c0';
        b.fillRect(x + 14, y + h - 28, w - 28, 3);
        b.fillStyle = '#10264c';
        poly(b, [
          [cx - 34, y + h - 28], [cx - 38, y + 14], [cx - 24, y + 2], [cx + 24, y + 2], [cx + 38, y + 14], [cx + 34, y + h - 28]
        ]);
        b.fillStyle = '#2c5c98';
        poly(b, [
          [cx - 28, y + h - 28], [cx - 31, y + 16], [cx - 20, y + 6], [cx + 20, y + 6], [cx + 31, y + 16], [cx + 28, y + h - 28]
        ]);
        for (let i = -3; i <= 3; i++) {
          b.fillStyle = '#cdf0ff';
          poly(b, [[cx + i * 9 - 4, y + 4], [cx + i * 9, y - 12 + Math.abs(i) * 3], [cx + i * 9 + 4, y + 4]]);
        }
        b.fillStyle = '#e6fbff';
        poly(b, [[cx, y + 14], [cx + 7, y + 24], [cx, y + 34], [cx - 7, y + 24]]);
        b.fillStyle = '#d6f2ff';
        b.fillRect(x + 4, y + h - 42, 12, 14);
        b.fillRect(x + w - 16, y + h - 42, 12, 14);
        glowB(b, cx, y + 24, 48, '130,225,255', .5);
      }

      function obelisk(b, x, y, w, h) {
        const cx = x + w / 2;
        shadow(b, cx + 3, y + h, w * .7);
        b.fillStyle = '#0f2a50';
        b.fillRect(x, y + h - 12, w, 12);
        b.fillStyle = '#3a72b0';
        b.fillRect(x, y + h - 12, w, 2);
        b.fillStyle = '#1a3f78';
        poly(b, [[x + 5, y + h - 12], [x + w - 5, y + h - 12], [x + w - 9, y - 32], [cx, y - 48], [x + 9, y - 32]]);
        b.fillStyle = '#3b78c0';
        poly(b, [[x + 5, y + h - 12], [cx, y + h - 12], [cx, y - 48], [x + 9, y - 32]]);
        b.fillStyle = '#9fe8ff';
        for (let i = 0; i < 5; i++)
          b.fillRect(cx - 1, y - 26 + i * 10, 2, 5);
        glowB(b, cx, y - 36, 30, '140,225,255', .3);
      }

      function lampBase(b, [x, y, k]) {
        if (k == 'c') {
          b.fillStyle = '#1a4a80';
          poly(b, [[x - 4, y + 4], [x, y - 7], [x + 4, y + 4]]);
          b.fillStyle = '#c8f4ff';
          poly(b, [[x - 4, y + 4], [x, y - 7], [x, y + 4]]);
          return;
        }
        if (k == 'f') {
          b.fillStyle = '#0a1a34';
          b.fillRect(x - 3, y - 1, 6, 8);
          b.fillStyle = '#7fc0ee';
          b.fillRect(x - 4, y - 3, 8, 3);
          return;
        }
        shadow(b, x, y + 5, 12);
        b.fillStyle = '#10284c';
        b.fillRect(x - 3, y - 4, 6, 10);
        b.fillStyle = '#5a9ad4';
        b.fillRect(x - 9, y - 8, 18, 4);
        b.fillStyle = '#9fdcf8';
        poly(b, [[x - 8, y - 8], [x + 8, y - 8], [x + 5, y - 4], [x - 5, y - 4]]);
        for (let i = -1; i <= 1; i += 2) {
          b.fillStyle = '#dff6ff';
          poly(b, [[x + i * 8 - 2, y - 8], [x + i * 8, y - 14], [x + i * 8 + 2, y - 8]]);
        }
      }

      function drawObs(b, W, r, cr) {
        W.slice(4).sort((p, q) => p[1] + p[3] - q[1] - q[3]).forEach(([x, y, w, h, k]) => {
          const cx = x + w / 2;
          if (k == 'm') {
            monolith(b, x, y, w, h);
            cr.push([cx, y + 30]);
          } else if (k == 'r')
            boulder(b, x, y, w, h);
          else if (k == 'p') {
            column(b, x, y, w, h);
            cr.push([cx, y - 38]);
          } else if (k == 'a') {
            altar(b, x, y, w, h);
            cr.push([cx, y + 8]);
          } else if (k == 's')
            sarco(b, x, y, w, h);
          else if (k == 't')
            throne(b, x, y, w, h);
          else if (k == 'o') {
            obelisk(b, x, y, w, h);
            cr.push([cx, y - 40]);
          } else {
            crystals(b, x, y, w, h, r, 1);
            cr.push([cx, y + 2]);
          }
        });
      }

      /* ---------- ruangan 0: FROST HALL (gua es & danau beku) ---------- */
      function build0() {
        const c = mkC(), b = c.getContext('2d'), r = rg(31), cx = DW / 2, cy = DY, cr = [];
        b.fillStyle = RG(b, cx, cy, 30, 540, [[0, '#2c6fae'], [.5, '#1c5086'], [1, '#0a2142']]);
        b.fillRect(0, 0, DW, DH);
        for (let i = 0; i < 34; i++) {
          b.save();
          b.translate(r() * DW, r() * DH);
          b.rotate(r() * 3);
          b.fillStyle = 'rgba(' + (r() < .5 ? '170,225,255' : '10,40,90') + ',' + (.05 + r() * .06) + ')';
          b.beginPath();
          b.ellipse(0, 0, 30 + r() * 70, 14 + r() * 34, 0, 0, TAU);
          b.fill();
          b.restore();
        }
        cracks(b, r, 44, 'rgba(6,24,56,.5)', 'rgba(200,240,255,.5)', 34);
        b.fillStyle = RG(b, cx, cy, 10, 156, [[0, 'rgba(210,246,255,.34)'], [.8, 'rgba(150,215,250,.16)'], [1, 'rgba(150,215,250,0)']]);
        b.beginPath();
        b.arc(cx, cy, 156, 0, TAU);
        b.fill();
        [150, 118, 86].forEach((rr, i) => { b.strokeStyle = 'rgba(220,248,255,' + (.42 - i * .08) + ')'; b.lineWidth = i ? 1.5 : 2.5; b.setLineDash(i == 1 ? [8, 6] : []); b.beginPath(); b.arc(cx, cy, rr, 0, TAU); b.stroke(); });
        b.setLineDash([]);
        flake(b, cx, cy, 142, 'rgba(225,250,255,.5)', 1.5);
        for (let i = 0; i < 44; i++) {
          const e = r() * 4 | 0, u = r(), x = e < 2 ? 20 + u * (DW - 40) : e == 2 ? 20 : DW - 20, y = e == 0 ? 20 : e == 1 ? DH - 20 : 30 + u * (DH - 60);
          if (Math.abs(y - DY) < 40 && (x < 40 || x > DW - 40))
            continue;
          const rx = 12 + r() * 24, ry = 5 + r() * 7;
          b.fillStyle = 'rgba(10,40,90,.35)';
          b.beginPath();
          b.ellipse(x + 2, y + 3, rx, ry, 0, 0, TAU);
          b.fill();
          b.fillStyle = 'rgba(238,250,255,.9)';
          b.beginPath();
          b.ellipse(x, y, rx, ry, 0, 0, TAU);
          b.fill();
          b.fillStyle = 'rgba(190,225,250,.8)';
          b.beginPath();
          b.ellipse(x + 2, y + ry * .35, rx * .8, ry * .55, 0, 0, TAU);
          b.fill();
        }
        wallBand(b, r, { f: '#0b2038', a: '#12304f', b: '#071628', e: '#8fd8ff', i: '#bfe9ff', il: '#f2fcff', L: 22 });
        for (let i = 0; i < 8; i++) {
          const x = 70 + i * 90 + r() * 30, top = i % 2 == 0;
          iceCrystalB(b, x, top ? 32 : DH - 16, .9 + r() * .4, r);
          cr.push([x, top ? 22 : DH - 26]);
        }
        drawObs(b, IW[0], r, cr);
        LP[0].forEach(q => lampBase(b, q));
        vig(b);
        return { c, cr };
      }

      /* ---------- ruangan 1: GLACIER CRYPT (makam es berlorong karpet beku) ---------- */
      function build1() {
        const c = mkC(), b = c.getContext('2d'), r = rg(57), cx = DW / 2, cy = DY, cr = [], T = ['#142a4e', '#17305a', '#12254a', '#1a3562'];
        for (let y = 0; y < DH; y += 32)
          for (let x = 0; x < DW; x += 32) {
            b.fillStyle = T[r() * 4 | 0];
            b.fillRect(x, y, 32, 32);
            b.fillStyle = 'rgba(160,215,255,.09)';
            b.fillRect(x, y, 32, 1);
            b.fillRect(x, y, 1, 32);
            b.fillStyle = 'rgba(0,6,20,.5)';
            b.fillRect(x, y + 31, 32, 1);
            b.fillRect(x + 31, y, 1, 32);
            if (r() < .12) {
              b.fillStyle = 'rgba(210,240,255,.12)';
              b.fillRect(x + 3, y + 3, 26, 26);
            }
          }
        b.fillStyle = 'rgba(18,60,120,.85)';
        b.fillRect(14, DY - 30, DW - 28, 60);
        b.strokeStyle = 'rgba(150,215,255,.7)';
        b.lineWidth = 2;
        b.strokeRect(18, DY - 26, DW - 36, 52);
        b.lineWidth = 1;
        b.strokeRect(24, DY - 20, DW - 48, 40);
        b.fillStyle = 'rgba(170,225,255,.45)';
        for (let x = 36; x < DW - 36; x += 28)
          poly(b, [[x, DY], [x + 7, DY - 7], [x + 14, DY], [x + 7, DY + 7]]);
        [[0, 0], [DW, 0], [0, DH], [DW, DH]].forEach(([x, y]) => { b.fillStyle = RG(b, x, y, 0, 210, [[0, 'rgba(225,248,255,.5)'], [.6, 'rgba(160,215,250,.14)'], [1, 'rgba(160,215,250,0)']]); b.fillRect(Math.max(0, x - 210), Math.max(0, y - 210), 420, 420); });
        for (let i = 0; i < 160; i++) {
          b.fillStyle = 'rgba(235,250,255,' + (.2 + r() * .4) + ')';
          b.fillRect(r() * DW | 0, r() * DH | 0, 1 + (r() < .3), 1);
        }
        cracks(b, r, 14, 'rgba(2,10,30,.5)', 'rgba(190,235,255,.45)', 30);
        b.save();
        b.shadowColor = '#6fd0ff';
        b.shadowBlur = 8;
        b.strokeStyle = 'rgba(140,220,255,.7)';
        [96, 74].forEach((rr, i) => { b.lineWidth = i ? 1.5 : 2.5; b.beginPath(); b.arc(cx, cy, rr, 0, TAU); b.stroke(); });
        b.lineWidth = 1.5;
        for (let i = 0; i < 24; i++) {
          const a = i * TAU / 24, e = i % 2 ? 86 : 96;
          b.beginPath();
          b.moveTo(cx + Math.cos(a) * 74, cy + Math.sin(a) * 74);
          b.lineTo(cx + Math.cos(a) * e, cy + Math.sin(a) * e);
          b.stroke();
        }
        b.restore();
        wallBand(b, r, { f: '#0a1730', a: '#13284a', b: '#060f22', e: '#6fb8e8', i: '#9fd8f5', il: '#e6fbff', L: 14 });
        b.fillStyle = '#0d1f3e';
        b.fillRect(14, 14, DW - 28, 22);
        b.fillStyle = 'rgba(120,190,240,.4)';
        b.fillRect(14, 35, DW - 28, 1);
        for (let x = 52; x < DW - 40; x += 60) {
          b.fillStyle = '#040a18';
          b.fillRect(x, 17, 34, 17);
          b.fillStyle = '#cfe6f2';
          b.fillRect(x + 13, 21, 8, 7);
          b.fillRect(x + 15, 28, 4, 3);
          b.fillStyle = '#040a18';
          b.fillRect(x + 14, 23, 2, 2);
          b.fillRect(x + 18, 23, 2, 2);
          b.fillStyle = 'rgba(190,235,255,.28)';
          b.fillRect(x, 17, 34, 17);
          b.fillStyle = 'rgba(230,250,255,.7)';
          b.fillRect(x, 17, 34, 1);
        }
        drawObs(b, IW[1], r, cr);
        LP[1].forEach(q => lampBase(b, q));
        vig(b);
        return { c, cr };
      }

      /* ---------- ruangan 2: TAKHTA KRYOVARTH (aula agung, dais mandala, takhta es) ---------- */
      function build2() {
        const c = mkC(), b = c.getContext('2d'), r = rg(91), cx = DW / 2, cy = DY, cr = [], T = ['#0f2548', '#12294f', '#0c1e3d'];
        for (let y = 0; y < DH; y += 40)
          for (let x = 0; x < DW; x += 40) {
            b.fillStyle = T[r() * 3 | 0];
            b.fillRect(x, y, 40, 40);
            b.fillStyle = 'rgba(150,215,255,.13)';
            b.fillRect(x, y, 40, 1);
            b.fillRect(x, y, 1, 40);
            b.fillStyle = 'rgba(0,4,16,.6)';
            b.fillRect(x, y + 39, 40, 1);
            b.fillRect(x + 39, y, 1, 40);
            if (r() < .3) {
              b.fillStyle = 'rgba(200,240,255,.07)';
              poly(b, [[x + 6, y + 34], [x + 20, y + 6], [x + 28, y + 6], [x + 14, y + 34]]);
            }
          }
        b.fillStyle = RG(b, cx, cy, 20, 208, [[0, '#2a65a4'], [.7, '#183f72'], [1, '#0f2c55']]);
        b.beginPath();
        b.arc(cx, cy, 206, 0, TAU);
        b.fill();
        b.strokeStyle = '#8fd8ff';
        b.lineWidth = 3;
        b.beginPath();
        b.arc(cx, cy, 206, 0, TAU);
        b.stroke();
        b.strokeStyle = 'rgba(0,6,20,.6)';
        b.lineWidth = 4;
        b.beginPath();
        b.arc(cx, cy, 211, 0, TAU);
        b.stroke();
        const rw = cx - 206 - 8;
        b.fillStyle = 'rgba(14,52,110,.9)';
        b.fillRect(14, DY - 28, rw, 56);
        b.strokeStyle = 'rgba(200,240,255,.75)';
        b.lineWidth = 2;
        b.strokeRect(16, DY - 26, rw - 4, 52);
        b.fillStyle = 'rgba(190,235,255,.5)';
        for (let x = 28; x < rw - 6; x += 22)
          poly(b, [[x, DY], [x + 6, DY - 6], [x + 12, DY], [x + 6, DY + 6]]);
        b.save();
        b.shadowColor = '#7fd8ff';
        b.shadowBlur = 10;
        b.strokeStyle = 'rgba(150,226,255,.75)';
        [196, 150, 104, 60].forEach((rr, i) => { b.lineWidth = i % 2 ? 1.5 : 2.5; b.setLineDash(i == 1 ? [10, 6] : []); b.beginPath(); b.arc(cx, cy, rr, 0, TAU); b.stroke(); });
        b.setLineDash([]);
        b.lineWidth = 1.4;
        for (let i = 0; i < 12; i++) {
          const a = i * TAU / 12;
          b.beginPath();
          b.moveTo(cx + Math.cos(a) * 60, cy + Math.sin(a) * 60);
          b.lineTo(cx + Math.cos(a) * 196, cy + Math.sin(a) * 196);
          b.stroke();
        }
        [[150, 12, 5], [104, 8, 3]].forEach(([R_, n, s]) => {
          b.beginPath(); for (let i = 0; i <= n; i++) {
            const a = i * s * TAU / n - Math.PI / 2, X = cx + Math.cos(a) * R_, Y = cy + Math.sin(a) * R_;
            i ? b.lineTo(X, Y) : b.moveTo(X, Y);
          } b.stroke();
        });
        flake(b, cx, cy, 58, 'rgba(230,252,255,.9)', 2);
        b.restore();
        for (let i = 0; i < 36; i++) {
          const a = i * TAU / 36;
          b.fillStyle = '#cdf4ff';
          b.fillRect(Math.round(cx + Math.cos(a) * 178) - 1, Math.round(cy + Math.sin(a) * 178) - 1, 3, 3);
        }
        glowB(b, cx, cy, 130, '120,210,255', .25);
        cracks(b, r, 10, 'rgba(0,6,20,.5)', 'rgba(190,235,255,.4)', 28);
        wallBand(b, r, {
          f: '#07142a', a: '#0f2447', b: '#050d1e', e: '#a8e4ff', i: '#b4e8ff', il: '#f4fdff', L: 16, skip: x => x > 330 && x < 470
        });
        b.fillStyle = '#0a1c38';
        b.fillRect(14, 14, DW - 28, 26);
        b.fillStyle = 'rgba(150,220,255,.5)';
        b.fillRect(14, 39, DW - 28, 2);
        for (let x = 34; x < DW - 20; x += 44) {
          b.fillStyle = 'rgba(90,150,210,.28)';
          b.fillRect(x, 14, 6, 25);
          b.fillStyle = 'rgba(220,248,255,.35)';
          b.fillRect(x, 14, 1, 25);
        }
        if (typeof banner == 'function')
          [180, 270, 530, 620].forEach(x => banner(b, x, 14, '#1c4f94', '#d6f4ff'));
        drawObs(b, IW[2], r, cr);
        LP[2].forEach(q => lampBase(b, q));
        vig(b);
        return { c, cr };
      }

      /* ---------- pasang desain baru ke sistem es yang sudah ada ---------- */
      const _ib = iceBuild, _ibb = iceBuildBoss;
      iceBuild = function () {
        try {
          const a = build0(), b = build1();
          IB = [a.c, b.c];
          ICR[0] = a.cr;
          ICR[1] = b.cr;
        } catch (er) {
          console.warn(er);
          _ib();
        }
      };
      iceBuildBoss = function () {
        try {
          const a = build2();
          IBB = a.c;
          ICR[2] = a.cr;
        } catch (er) {
          console.warn(er);
          _ibb();
        }
      };
      IB = null;
      IBB = null;
      const on = () => LVL == 3 && !lobby && room <= 2 && !window.ENDM;
      const apply = () => {
        if (on()) {
          walls = IW[room];
          TO = [];
          BR = [];
        }
      };
      const fix = () => {
        try {
          if (!on())
            return;
          es.forEach(e => {
            if (e.k != 'boss' && blk(e.x, e.y, 10))
              for (let i = 0; i < 300; i++) {
                const x = 100 + R() * 600, y = 40 + R() * 400;
                if (!blk(x, y, 12)) {
                  e.x = x;
                  e.y = y;
                  break;
                }
              }
          });
        } catch (er) { }
      };
      const _spawn = spawn;
      spawn = function () { apply(); _spawn(); fix(); };
      const _upd = upd;
      upd = function (dt) { apply(); _upd(dt); apply(); };
      const _toRoom = toRoom;
      toRoom = function (n) { _toRoom(n); apply(); fix(); };
      const _toBoss = toBoss;
      toBoss = function () { _toBoss(); apply(); };
      const _enter = enterDungeon;
      enterDungeon = function () { _enter(); apply(); fix(); };

      /* ---------- animasi: api biru, kristal, danau berkilau, kabut makam, aurora & cincin rune bos ---------- */
      function lampFx(q, i) {
        const x = q[0], y = q[1], k = q[2], f = 1 + Math.sin(t * 9 + i * 2.3) * .08 + Math.sin(t * 17 + i) * .05;
        if (k == 'c') {
          iceGlow(x, y, 34 * f, .3 + .12 * Math.sin(t * 1.7 + i * 1.3), '140,225,255');
          return;
        }
        const B = k == 'B', s = B ? 1.5 : .8, h = 2 + Math.sin(t * 13 + i * 2) * 1.3 + Math.sin(t * 23 + i), fy = B ? y - 8 : y - 2;
        iceGlow(x, y - 8, (B ? 130 : 72) * f, B ? .34 : .26, '90,190,255');
        [['#2a8fe8', 1, 0], ['#8fe6ff', .6, 1.5]].forEach(([c0, m, dy]) => { g.fillStyle = c0; g.beginPath(); g.moveTo(x - 5 * s * m, fy - dy); g.quadraticCurveTo(x - 6 * s * m, fy - (6 + h) * s * m - dy, x, fy - (12 + h) * s * m - dy); g.quadraticCurveTo(x + 6 * s * m, fy - (6 + h) * s * m - dy, x + 5 * s * m, fy - dy); g.fill(); });
        g.fillStyle = '#fff';
        g.fillRect(x - s, fy - 7 * s, 2 * s, 4 * s);
      }

      function lake() {
        g.save();
        g.beginPath();
        g.arc(DW / 2, DY, 150, 0, TAU);
        g.clip();
        g.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 4; k++) {
          const x = ((t * 26 + k * 190) % (DW + 260)) - 130;
          g.fillStyle = LG(g, x - 30, 0, x + 30, 0, [
            [0, 'rgba(200,245,255,0)'], [.5, 'rgba(200,245,255,' + (.07 + .04 * Math.sin(t + k)) + ')'], [1, 'rgba(200,245,255,0)']
          ]);
          g.beginPath();
          g.moveTo(x - 30, DY + 160);
          g.lineTo(x + 10, DY - 160);
          g.lineTo(x + 40, DY - 160);
          g.lineTo(x, DY + 160);
          g.closePath();
          g.fill();
        }
        g.restore();
      }

      function crypt() {
        const cx = DW / 2, cy = DY, pu = .5 + .5 * Math.sin(t * 1.6);
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.strokeStyle = 'rgba(150,226,255,' + (.25 + .25 * pu) + ')';
        g.lineWidth = 2;
        g.setLineDash([5, 7]);
        g.lineDashOffset = -t * 14;
        g.beginPath();
        g.arc(cx, cy, 96, 0, TAU);
        g.stroke();
        g.lineDashOffset = t * 10;
        g.beginPath();
        g.arc(cx, cy, 74, 0, TAU);
        g.stroke();
        g.setLineDash([]);
        g.restore();
        iceGlow(cx, cy - 22, 60 + 12 * pu, .22 + .12 * pu, '130,220,255');
        g.save();
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) {
          const x = ((t * 9 + i * 240) % (DW + 300)) - 150, y = DH - 70 + Math.sin(t * .5 + i) * 14;
          g.fillStyle = RG(g, x, y, 0, 120, [[0, 'rgba(150,210,255,.1)'], [1, 'rgba(150,210,255,0)']]);
          g.fillRect(x - 120, y - 60, 240, 120);
        }
        g.restore();
      }

      function bossAmb() {
        const pu = .5 + .5 * Math.sin(t * 1.3);
        g.save();
        g.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 4; k++) {
          const x = DW * (.15 + k * .23) + Math.sin(t * .25 + k * 1.7) * 40, w = 90 + Math.sin(t * .4 + k) * 20;
          g.fillStyle = LG(g, x, 14, x, 300, [
            [0, 'rgba(120,255,225,0)'], [.25, 'rgba(120,255,230,' + (.07 + .03 * Math.sin(t * .9 + k)) + ')'], [1, 'rgba(110,140,255,0)']
          ]);
          g.beginPath();
          g.moveTo(x - w / 2, 14);
          g.lineTo(x + w / 2, 14);
          g.lineTo(x + w * .9 + Math.sin(t * .6 + k) * 30, 300);
          g.lineTo(x - w * .4 + Math.sin(t * .5 + k) * 30, 300);
          g.closePath();
          g.fill();
        }
        g.restore();
        iceGlow(DW / 2, 38, 60 + 10 * pu, .25 + .15 * pu, '130,225,255');
      }

      function bossFx() {
        const ph = BOSS.ph || 1, cx = DW / 2, cy = DY, pu = .5 + .5 * Math.sin(t * (1.4 + ph * .8));
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = RG(g, cx, cy, 20, 210, [[0, 'rgba(90,200,255,' + (.05 + .05 * ph * pu) + ')'], [1, 'rgba(90,200,255,0)']]);
        g.fillRect(cx - 210, cy - 210, 420, 420);
        [[184, 3, 9, -10], [142, 2, 6, 14], [98, 2, 4, -18]].forEach(([rr, lw, gp, sp]) => { g.strokeStyle = 'rgba(150,225,255,' + (.2 + .14 * ph * pu) + ')'; g.lineWidth = lw; g.setLineDash([gp, gp * 2]); g.lineDashOffset = t * sp; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.stroke(); });
        g.setLineDash([]);
        for (let i = 0; i < 12; i++) {
          const a = i * TAU / 12 + t * .12, x = cx + Math.cos(a) * 166, y = cy + Math.sin(a) * 166;
          g.fillStyle = 'rgba(200,245,255,' + (.35 + .35 * Math.sin(t * 2 + i)) + ')';
          g.beginPath();
          g.moveTo(x, y - 4);
          g.lineTo(x + 3, y);
          g.lineTo(x, y + 4);
          g.lineTo(x - 3, y);
          g.closePath();
          g.fill();
        }
        const w = (t * .35) % 1;
        g.strokeStyle = 'rgba(190,240,255,' + ((1 - w) * .22 * ph).toFixed(3) + ')';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(cx, cy, 30 + w * 190, 0, TAU);
        g.stroke();
        for (let i = 0; i < (ph >= 3 ? 28 : 16); i++) {
          const b0 = LP[2][i % 4], life = (t * .3 + i * .151) % 1, x = b0[0] + Math.sin(i * 1.7 + t * .8 + life * 5) * 14 * (1 + life), y = b0[1] - 12 - life * 100;
          g.fillStyle = 'rgba(200,240,255,' + ((1 - life) * .8).toFixed(2) + ')';
          g.fillRect(Math.round(x), Math.round(y), 2, 2);
        }
        g.restore();
      }
      const _env = envFx;
      envFx = function () {
        _env(); if (!on())
          return; try {
            LP[room].forEach(lampFx);
            if (room == 0)
              lake();
            else if (room == 1)
              crypt();
            else
              bossAmb();
          } catch (er) { }
      };
      const _bef = bossEnvFx;
      bossEnvFx = function () {
        if (!(LVL == 3 && !lobby))
          return _bef(); try {
            bossFx();
          } catch (er) { }
      };
    })();
    /* ===== MODEL NAGA KRYOVARTH v2: ramping & bertulang, sayap kelelawar bergerigi, leher S berduri, kepala tengkorak bertanduk panjang =====
       Posisi kepala (DG_HP) & titik serangan tidak berubah, hanya tampilannya. Kalau error, model lama dipakai lagi. */
    (function () {
      const _dd = EM.boss;
      EM.boss = function (pp, at, tm) {
        if (!iceBossOn())
          return _dd(pp, at, tm);
        try {
          drawDrg(pp, at, tm);
        } catch (er) {
          console.warn(er);
          return _dd(pp, at, tm);
        }
      };

      function drawDrg(pp, at, tm) {
        const e = BOSS_E || {}, fl = !!MT, F = c => fl ? '#fff' : c, ez = q => 1 - (1 - q) * (1 - q), ph = BOSS.ph || 1, PI = Math.PI;
        const mk0 = e.s2 == 'morph' && e.mtx ? 1 - e.mt / e.mtx : -1, f = mk0 >= 0 && mk0 < .55 ? Math.max(1, ph - 1) : ph;
        const PAL = [
          ['#0d2a4a', '#235e96', '#cfeeff', '#6fd8ff'], ['#091c3a', '#1c5694', '#b4e8ff', '#3fd0ff'], ['#060f2c', '#173f86', '#eaffff', '#aef6ff']
        ][f - 1], D = PAL[0], M = PAL[1], L = PAL[2], G = PAL[3];
        const k = e.atk, w = e.s2 == 'wind' && at, q = ez(pp || 0);
        let roar = 0, wing = 0, lean = 0, hv = 0;
        if (w) {
          if (k == 'nova' || k == 'triad') {
            roar = q;
            wing = q;
          } else if (k == 'breath')
            roar = .85 * q;
          else if (k == 'lunge')
            lean = (Math.cos(e.ca || 0) < 0 ? -1 : 1) * .12 * q;
          else if (k == 'icicles' || k == 'hail') {
            wing = q;
            hv = q;
          } else if (k == 'blizzard') {
            wing = q;
            roar = .5 * q;
          } else if (k == 'tail')
            lean = -.07 * q;
          else
            roar = .5 * q;
        } else if (e.s2 == 'act') {
          roar = .9;
          wing = .5;
        } else if (e.s2 == 'morph') {
          roar = 1;
          wing = 1;
        }
        let jx = 0, sc = 1;
        if (mk0 >= 0) {
          jx = (R() - .5) * 10 * mk0;
          if (mk0 > .55)
            sc = 1 + .2 * (1 - (mk0 - .55) / .45);
        }
        const poly = (a, c) => { g.fillStyle = F(c); g.beginPath(); a.forEach((v, i) => i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1])); g.closePath(); g.fill(); };
        const ell = (x, y, rx, ry, c) => { g.fillStyle = F(c); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
        const glow = (x, y, r, c, a) => {
          if (fl)
            return; g.save(); g.globalCompositeOperation = 'lighter'; const o = g.createRadialGradient(x, y, 0, x, y, r); o.addColorStop(0, 'rgba(' + c + ',' + a + ')'); o.addColorStop(1, 'rgba(' + c + ',0)'); g.fillStyle = o; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
        };
        const ln = (pts, lw, c) => { g.strokeStyle = F(c); g.lineWidth = lw; g.beginPath(); pts.forEach((v, i) => i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1])); g.stroke(); };
        const SS = DG_SS[f - 1] * sc;
        g.save();
        g.lineCap = g.lineJoin = 'round';
        g.translate(320 + jx, 333);
        g.rotate(lean);
        g.scale(SS, SS);
        g.translate(-320, -333);
        if (!fl) {
          g.fillStyle = 'rgba(0,0,0,.4)';
          g.beginPath();
          g.ellipse(320, 331, 108, 12, 0, 0, 7);
          g.fill();
        }
        glow(320, 230, 220, '90,190,255', .14 + .05 * f + .04 * Math.sin(tm * 3));
        if (f == 3)
          glow(320, 240, 260, '30,60,160', .25);
        /* sayap kelelawar: tulang panjang, selaput bergerigi */
        [-1, 1].forEach(s => {
          const fp = Math.sin(tm * 2.2 + (s > 0 ? 0 : .5)) * 14 * (1 - wing * .6) - wing * 40, Wd = 92 + f * 26 + wing * 20, sx = 320 + s * 42, sy = 214;
          const el = [320 + s * Wd * .55, 146 + fp * .4], wr = [320 + s * (Wd + 8), 92 - f * 8 + fp], T = [
            [320 + s * (Wd + 92), 128 - f * 6 + fp * 1.1], [320 + s * (Wd + 64), 196 + fp * .7], [320 + s * Wd * .8, 248 + fp * .4], [320 + s * Wd * .4, 270]
          ];
          g.fillStyle = F('rgba(14,52,108,.94)');
          g.beginPath();
          g.moveTo(sx, sy);
          g.lineTo(el[0], el[1]);
          g.lineTo(wr[0], wr[1]);
          g.lineTo(T[0][0], T[0][1]);
          for (let i = 0; i < 3; i++) {
            const a = T[i], b2 = T[i + 1], mx = (a[0] + b2[0]) / 2, my = (a[1] + b2[1]) / 2;
            g.quadraticCurveTo(mx + (wr[0] - mx) * .3, my + (wr[1] - my) * .3, b2[0], b2[1]);
          }
          g.lineTo(sx, sy + 38);
          g.closePath();
          g.fill();
          if (!fl) {
            g.strokeStyle = 'rgba(150,225,255,.55)';
            g.lineWidth = 1.6;
            g.stroke();
          }
          T.forEach(v => { ln([wr, v], 4.5, D); ln([wr, v], 1.3, L); });
          ln([[sx, sy], el, wr], 9, D);
          ln([[sx, sy], el, wr], 5, M);
          ln([[sx, sy], el, wr], 1.6, L);
          poly([[wr[0] - s * 5, wr[1] + 2], [wr[0] + s * 1, wr[1] - 20], [wr[0] + s * 7, wr[1] + 4]], L);
          poly([[T[0][0] - s * 3, T[0][1]], [T[0][0] + s * 6, T[0][1] - 14], [T[0][0] + s * 8, T[0][1] + 4]], L);
          [.3, .6].forEach(u => { const x = sx + (el[0] - sx) * u, y = sy + (el[1] - sy) * u; poly([[x - 4, y], [x + s * 2, y - 14 - f * 2], [x + 5, y + 2]], G); });
        });
        /* ekor berduri dengan ujung bilah es */
        const tw = Math.sin(tm * 1.6) * 18, ex = 486 + tw, ey = 290 + Math.sin(tm * 1.6 + 1) * 12, tcx = 432 + tw * .6, tcy = 346;
        [[22, D], [13, M], [3, L]].forEach(([lw, c]) => { g.strokeStyle = F(c); g.lineWidth = lw; g.beginPath(); g.moveTo(352, 298); g.quadraticCurveTo(tcx, tcy, ex, ey); g.stroke(); });
        for (let j = 1; j < 6; j++) {
          const v = bz(j / 6, 352, 298, tcx, tcy, ex, ey), sz = 14 - j * 1.6;
          poly([[v[0] - 5, v[1] + 2], [v[0] - 1, v[1] - sz - 4], [v[0] + 5, v[1] - 1]], j % 2 ? L : G);
        }
        poly([
          [ex - 6, ey + 7], [ex + 12, ey - 16], [ex + 40, ey - 34], [ex + 22, ey - 4], [ex + 38, ey + 10], [ex + 8, ey + 12]
        ], L);
        poly([[ex - 6, ey + 7], [ex + 12, ey - 16], [ex + 22, ey - 4], [ex + 8, ey + 12]], G);
        /* kaki bertekuk dengan cakar panjang */
        [-1, 1].forEach(s => {
          const hip = [320 + s * 44, 284], kn = [320 + s * 68, 306], an = [320 + s * 54, 326];
          ell(320 + s * 50, 290, 20, 26, D);
          ell(320 + s * 50, 289, 16, 22, M);
          ln([hip, kn, an], 14, D);
          ln([hip, kn, an], 8, M);
          poly([[kn[0], kn[1] - 4], [kn[0] + s * 16, kn[1] - 14], [kn[0] + s * 4, kn[1] + 4]], L);
          poly([[an[0] - 15, 331], [an[0] + 15, 331], [an[0] + 11, 336], [an[0] - 11, 336]], D);
          [-12, 0, 12].forEach(o => poly([[an[0] + o - 3, 334], [an[0] + o + 3, 334], [an[0] + o + s * 2, 348]], L));
        });
        /* badan: zirah es ramping, tulang rusuk, inti beku bercahaya */
        ell(320, 226, 52, 22, D);
        poly([[262, 226], [290, 206], [350, 206], [378, 226], [368, 262], [352, 298], [288, 298], [272, 262]], D);
        poly([[272, 228], [294, 214], [346, 214], [368, 228], [360, 260], [346, 290], [294, 290], [280, 260]], M);
        ln([[320, 214], [320, 296]], 5, D);
        for (let i = 0; i < 4; i++) {
          const y = 232 + i * 13, wd = 38 - i * 5;
          [-1, 1].forEach(s => { g.strokeStyle = F('#e4f2fb'); g.lineWidth = 3.4 - i * .35; g.beginPath(); g.moveTo(320, y); g.quadraticCurveTo(320 + s * wd * .9, y - 6, 320 + s * wd, y + 10); g.stroke(); });
        }
        glow(320, 258, 36 + f * 9, '120,230,255', .3 + .12 * f + .22 * Math.sin(tm * 4));
        ell(320, 258, 5 + f, 9 + f, L);
        if (f >= 2) {
          g.strokeStyle = F('#e8ffff');
          g.lineWidth = 1.4;
          g.beginPath();
          g.moveTo(288, 232);
          g.lineTo(302, 258);
          g.lineTo(294, 286);
          g.moveTo(352, 236);
          g.lineTo(340, 264);
          g.lineTo(350, 290);
          g.stroke();
        }
        const ns = 7 + f * 2;
        for (let i = 0; i < ns; i++) {
          const x = 270 + i * 100 / (ns - 1), y = 210 - Math.sin(i / (ns - 1) * PI) * 8;
          poly([[x - 6, y + 10], [x, y - 12 - f * 5 - (i % 2) * 7], [x + 6, y + 10]], i % 2 ? L : G);
        }
        [-1, 1].forEach(s => {
          poly([[320 + s * 50, 218], [320 + s * (74 + f * 8), 188 - f * 10], [320 + s * (66 + f * 4), 216]], L);
          poly([[320 + s * 58, 224], [320 + s * (94 + f * 10), 210 - f * 6], [320 + s * 76, 234]], G);
          if (f >= 2)
            poly([[320 + s * 44, 212], [320 + s * 54, 172 - f * 8], [320 + s * 60, 210]], L);
        });
        /* leher S berduri + kepala tengkorak bertanduk */
        const dA = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b)), SSn = .4 * DG_SS[f - 1], ord = f == 3 ? [1, 2, 0] : DG_HP[f - 1].map((_, i) => i);
        ord.forEach(i => {
          const hp = DG_HP[f - 1][i], hs = f == 1 ? 1.2 : f == 3 && i == 0 ? 1.35 : 1.02, hx = hp[0] + Math.sin(tm * 1.6 + i * 2.1) * 5, hy = hp[1] + Math.sin(tm * 2.1 + i) * 4 - roar * 16 - hv * 6;
          const mine = e.hd % f == i || k == 'triad' || k == 'nova';
          let op = .1 + .07 * Math.sin(tm * 2 + i * 2);
          if (w && mine)
            op = .25 + .75 * q;
          else if (e.s2 == 'act' && mine)
            op = .9;
          if (e.s2 == 'morph')
            op = 1;
          const tx = Math.atan2(p.y - (e.y + 7 + (hy - 333) * SSn), p.x - (e.x + (hx - 320) * SSn));
          let ha = -PI / 2 + (hp[0] - 320) * .004 + Math.sin(tm * 1.3 + i) * .1;
          ha = roar > .6 ? -PI / 2 + (hp[0] - 320) * .006 : ha + dA(tx, ha) * (op > .25 ? 1 : .35);
          const sx = 320 + (hp[0] - 320) * .3, sy = 236, cx = 320 + (hp[0] - 320) * 1.15 + (i % 2 ? 26 : -26) * (f > 1 ? 1 : 0), cy = (hy + sy) / 2 + 30;
          [[20, D], [13, M], [4, L]].forEach(([lw, c], j) => { g.strokeStyle = F(c); g.lineWidth = lw * hs * (j == 2 ? .8 : 1); g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(cx, cy, hx, hy + 8); g.stroke(); });
          for (let j = 1; j < 6; j++) {
            const v = bz(j / 6, sx, sy, cx, cy, hx, hy + 8);
            poly([[v[0] - 7, v[1] + 5], [v[0], v[1] - 17], [v[0] + 7, v[1] + 5]], j % 2 ? L : G);
          }
          g.save();
          g.translate(hx, hy);
          g.rotate(ha);
          g.scale(hs, hs);
          poly([[-4, -11], [-14, -30], [-40, -48], [-60, -52], [-36, -36], [-20, -16]], L);
          poly([[-4, 11], [-14, 30], [-40, 48], [-60, 52], [-36, 36], [-20, 16]], L);
          if (f == 3 && i == 0) {
            poly([[-2, -13], [-6, -44], [-24, -62], [-16, -34], [-10, -14]], G);
            poly([[-2, 13], [-6, 44], [-24, 62], [-16, 34], [-10, 14]], G);
          }
          poly([[-20, -14], [6, -18], [28, -11], [46, -5], [52, 1], [44, 5], [12, 9], [-20, 15]], D);
          poly([[-16, -10], [6, -14], [28, -8], [44, -3], [48, 1], [10, 6], [-16, 10]], M);
          poly([[-2, -15], [24, -9], [24, -3], [2, -8]], D);
          poly([[6, -8], [22, -5], [8, -1]], f == 3 ? '#ffffff' : '#bff8ff');
          g.fillStyle = F(D);
          g.fillRect(40, -3, 3, 2);
          for (let j = 0; j < 5; j++)
            poly([[14 + j * 7, 4], [18 + j * 7, 4], [16 + j * 7, 11 + (j % 2) * 4]], '#fff');
          poly([[40, 3], [45, 3], [43, 17]], '#fff');
          for (let j = 0; j < 6; j++)
            poly([[-14 + j * 6, -15], [-9 + j * 6, -15], [-12 + j * 6, -26 - (j % 2) * 7 - (f == 3 ? 6 : 0)]], j % 2 ? G : L);
          g.save();
          g.translate(-6, 9);
          g.rotate(op * .8);
          poly([[0, 0], [46, 5], [54, 13], [6, 19]], D);
          poly([[3, 3], [44, 6], [50, 11], [7, 16]], M);
          for (let j = 0; j < 4; j++)
            poly([[12 + j * 8, 4], [16 + j * 8, 4], [14 + j * 8, -5 - (j % 2) * 3]], '#fff');
          poly([[42, 6], [47, 6], [45, -9]], '#fff');
          g.restore();
          g.restore();
          const ca = Math.cos(ha), sa = Math.sin(ha);
          glow(hx + (14 * ca + 5 * sa) * hs, hy + (14 * sa - 5 * ca) * hs, 15, '180,250,255', .95);
          if (op > .3)
            glow(hx + ca * 36 * hs, hy + sa * 36 * hs, 34 * op, '150,235,255', .65 * op);
        });
        glow(320, 330, 130, '140,225,255', .1);
        if (!fl) {
          g.save();
          g.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 18; i++) {
            const u = (tm * .25 + i * .0556) % 1;
            g.fillStyle = 'rgba(225,248,255,' + (1 - u) * .8 + ')';
            g.fillRect(Math.round(320 + Math.sin(i * 12.9) * 160 + Math.sin(tm + i) * 8), Math.round(330 - u * 270), 3, 3);
          }
          g.restore();
        }
        g.restore();
      }
    })();
    /* ===== ANIMASI MATI MINI BOS =====
       Mini bos tidak langsung hilang: ia berkedip putih & bergetar, lalu runtuh dengan gaya masing-masing,
       dan baru setelah itu meledak (efek miniDeath yang sudah ada) dan memberi XP / drop.
       kn  Skeleton Knight   : bergetar, tulang lepas, roboh ke samping
       ar  Skeleton Archer   : memudar jadi arwah, merosot lalu menguap
       gl  Lava Golem        : membara membengkak, retak, runtuh jadi puing
       bl  Blash Inferno     : api berputar makin cepat lalu menciut ke atas
       ik  Ksatria Salju     : membeku putih, kuda ambruk ke samping
       it  Turet Es Hidup    : retak, lalu tenggelam ke tanah */
    const mdC = (v, a, b) => Math.max(a, Math.min(b, v));
    const MD_DUR = { kn: 1.2, ar: 1.1, gl: 1.5, bl: 1.3, ik: 1.3, it: 1.3 };
    const MD_COL = {
      kn: '150,255,190', ar: '150,255,235', gl: '255,120,30', bl: '255,100,50', ik: '170,225,255', it: '170,225,255'
    };
    const _killMD = kill;
    kill = function (e) {
      if (e && e.mini && !e.mdDone) {
        if (e.dying)
          return;
        const id = bossVid(e) || 'kn';
        Object.assign(e, {
          dying: 1, hp: 0, s2: 'rest', atk: null, an: 0, wind: 0, stun: 0, vx: 0, vy: 0, tm: 99, dyT: 0, dyMax: MD_DUR[id] || 1.2, dyId: id, dyDir: p.x < e.x ? -1 : 1
        });
        HST = Math.max(HST, .12);
        shake = Math.max(shake, 7);
        try {
          SFX.slam();
        } catch (x) { }
        return;
      }
      _killMD(e);
    };
    const _miniTickMD = miniTick;
    miniTick = function (e, dt) {
      if (e.dying)
        return; _miniTickMD(e, dt);
    };
    const _updMD = upd;
    upd = function (dt) {
      _updMD(dt);
      if (lobby || !(dt > 0) || HST > 0)
        return;
      es.slice().forEach(e => {
        if (!e.mini || !e.dying || e.mdDone)
          return;
        e.dyT += dt;
        const k = mdC(e.dyT / e.dyMax, 0, 1), id = e.dyId, x = e.x, y = e.y - 6;
        const P = (c, f) => {
          if (R() < dt * c)
            dp.push(f());
        };
        if (id == 'kn' || id == 'ar') {
          P(45, () => ({
            k: 'p', x: x + (R() - .5) * 26, y: y + R() * 10, vx: (R() - .5) * 20, vy: -20 - R() * 40, life: .6, max: .6, s: 1.6 + R() * 2, c: R() < .5 ? '#9dffb8' : '#e8fff0'
          }));
          if (id == 'kn')
            P(30, () => ({
              k: 'sh', x: x + (R() - .5) * 20, y: y + R() * 10, vx: (R() - .5) * 70, vy: -30 - R() * 40, rot: R() * 6, vr: (R() - .5) * 14, life: .7, max: .7, s: 2 + R() * 2, c: '232,224,204'
            }));
        } else if (id == 'gl' || id == 'bl') {
          P(70, () => ({
            k: 'p', x: x + (R() - .5) * 30, y: y + R() * 14, vx: (R() - .5) * 40, vy: -40 - R() * 80, life: .5, max: .5, s: 2 + R() * 2.5, c: ['#ffd34d', '#ff5a1f', '#ffb347'][R() * 3 | 0]
          }));
          if (id == 'gl')
            P(20, () => ({
              k: 'sh', x: x + (R() - .5) * 30, y: y + R() * 14, vx: (R() - .5) * 60, vy: -20 - R() * 40, rot: R() * 6, vr: (R() - .5) * 12, life: .8, max: .8, s: 2 + R() * 2.5, c: '80,62,56'
            }));
        } else {
          P(60, () => ({
            k: 'p', x: x + (R() - .5) * 28, y: y + R() * 12, vx: (R() - .5) * 30, vy: -20 - R() * 60, life: .6, max: .6, s: 1.5 + R() * 2, c: R() < .5 ? '#e8fbff' : '#8fd0f0'
          }));
          P(25, () => ({
            k: 'sh', x: x + (R() - .5) * 24, y: y + R() * 10, vx: (R() - .5) * 60, vy: -20 - R() * 40, rot: R() * 6, vr: (R() - .5) * 14, life: .7, max: .7, s: 2 + R() * 2, c: '190,235,255'
          }));
        }
        if (k > .5 && !e.mdQ) {
          e.mdQ = 1;
          shake = Math.max(shake, 5);
          fx.push({ k: 'ring', x, y: y + 6, r: 30, w: 2, life: .3, max: .3, col: '#fff' });
        }
        if (e.dyT >= e.dyMax) {
          e.mdDone = 1;
          e.dying = 0;
          _killMD(e);
        }
      });
    };
    const _drawEnemyMD = drawEnemy;
    drawEnemy = function (e) {
      if (!(e.mini && e.dying))
        return _drawEnemyMD(e);
      const id = e.dyId, T = e.dyT, k = mdC(T / e.dyMax, 0, 1), c = mdC((k - .4) / .6, 0, 1), cc = c * c * (3 - 2 * c), dd = e.dyDir || 1;
      const x0 = e.x, y0 = e.y + 7, jx = (R() - .5) * (1.5 + 4 * (1 - cc * .6)), sv = e.fl;
      let sx = 1, sy = 1, rot = 0, sink = 0, up = 0, al = 1, clipG = false;
      if (id == 'kn') {
        sy = 1 - .5 * cc;
        sx = 1 + .2 * cc;
        rot = dd * .55 * cc;
        sink = 4 * cc;
      } else if (id == 'ar') {
        sy = 1 - .45 * cc;
        sx = 1 + .1 * cc;
        sink = 8 * cc;
        al = 1 - .85 * cc;
      } else if (id == 'gl') {
        const sw = Math.sin(mdC(k / .5, 0, 1) * 3.14) * .1;
        sx = 1 + sw + .15 * cc;
        sy = 1 + sw - .55 * cc;
        sink = 6 * cc;
      } else if (id == 'bl') {
        const sh = 1 - .85 * cc;
        sx = sh;
        sy = sh;
        up = -26 * cc;
        rot = Math.sin(t * 25) * .12 * (1 + cc * 2);
        al = 1 - .3 * cc;
      } else if (id == 'ik') {
        rot = dd * .9 * cc;
        sy = 1 - .15 * cc;
        sink = 10 * cc;
      } else {
        sink = 46 * cc;
        clipG = true;
      }
      g.save();
      if (clipG) {
        g.beginPath();
        g.rect(x0 - 120, y0 - 260, 240, 260 + 2);
        g.clip();
      }
      g.translate(x0 + jx, y0 + sink + up);
      g.rotate(rot);
      g.scale(sx, sy);
      g.translate(-x0, -y0);
      g.globalAlpha = al;
      e.fl = 0;
      _drawEnemyMD(e);
      const wa = Math.floor(T * 14) % 2 ? .6 * (1 - cc * .5) : 0;
      if (wa > 0) {
        e.fl = .1;
        g.globalAlpha = wa * al;
        _drawEnemyMD(e);
      }
      g.globalAlpha = 1;
      e.fl = sv;
      g.restore();
      const col = MD_COL[id] || '255,255,255', ga = .15 + .4 * k + .12 * Math.sin(T * 30);
      g.save();
      g.globalCompositeOperation = 'lighter';
      const gq = g.createRadialGradient(e.x, e.y - 16, 3, e.x, e.y - 16, 56);
      gq.addColorStop(0, 'rgba(' + col + ',' + mdC(ga, 0, 1) + ')');
      gq.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = gq;
      g.fillRect(e.x - 58, e.y - 74, 116, 116);
      g.restore();
    };
