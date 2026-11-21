/* ==========================================================================
   ECHOES OF THE ABYSS - COMBAT EXTENSIONS & STATUS EFFECTS MODULE
   Burn status, Poison effect, Blash fireballs, orange flame FX, poison trails.
   ========================================================================== */
    /* ===== Tembakan Blash: bola api (bukan panah) ===== */
    const _drawRockF = drawRock;
    drawRock = function (b) {
      if (!b.lv)
        return _drawRockF(b);
      const a = Math.atan2(b.vy, b.vx), f = 1 + Math.sin(t * 30 + b.x) * .12;
      g.save();
      g.translate(b.x, b.y);
      g.rotate(a);
      lavaGlow(0, 0, 18, .75);
      g.fillStyle = '#ff5a1f';
      g.beginPath();
      g.moveTo(0, -4.5 * f);
      g.quadraticCurveTo(-10, -3.5, -22 * f, 0);
      g.quadraticCurveTo(-10, 3.5, 0, 4.5 * f);
      g.closePath();
      g.fill();
      g.fillStyle = '#ffb050';
      g.beginPath();
      g.moveTo(0, -3);
      g.quadraticCurveTo(-7, -2, -14 * f, 0);
      g.quadraticCurveTo(-7, 2, 0, 3);
      g.closePath();
      g.fill();
      g.fillStyle = '#ff7a1f';
      g.beginPath();
      g.arc(0, 0, 5 * f, 0, 7);
      g.fill();
      g.fillStyle = '#ffd34d';
      g.beginPath();
      g.arc(0, 0, 3.2, 0, 7);
      g.fill();
      g.fillStyle = '#fff2b0';
      g.beginPath();
      g.arc(.5, 0, 1.6, 0, 7);
      g.fill();
      g.restore();
    };
    const _rockTrailF = rockTrail;
    rockTrail = function (b) {
      if (!b.lv)
        return _rockTrailF(b); if (R() < .7)
        dp.push({
          k: 'f', x: b.x, y: b.y, vx: (R() - .5) * 14, vy: (R() - .5) * 14 - 8, life: .25 + R() * .2, max: .45, s: 2 + R() * 2
        });
    };
    const _rockBreakF = rockBreak;
    rockBreak = function (b) {
      if (!b.lv)
        return _rockBreakF(b);
      fx.push({ k: 'ring', x: b.x, y: b.y, r: 14, life: .25, max: .25, col: '#ff7a1f' });
      for (let i = 0; i < 12; i++) {
        const a = R() * 6.283, v = 30 + R() * 90;
        dp.push({
          k: 'p', x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 15, life: .35 + R() * .3, max: .65, s: 1.5 + R() * 1.5, c: i % 2 ? '#ffd34d' : '#ff5a1f'
        });
      }
    };
  </script>

  <script>
    /* ===== Efek oranye: ledakan Golem & lemparan Blash ===== */
    const _flameO = flame;
    flame = function (q, k) {
      if (!q.o)
        return _flameO(q, k);
      const a = 1 - k, r = q.s * (1.3 - a * .7), c1 = a < .25 ? '255,245,190' : a < .55 ? '255,170,60' : '220,70,15';
      g.save();
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 2);
      gr.addColorStop(0, 'rgba(' + c1 + ',' + k * .9 + ')');
      gr.addColorStop(.5, 'rgba(255,110,30,' + k * .45 + ')');
      gr.addColorStop(1, 'rgba(160,30,0,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(q.x, q.y, r * 2, 0, 7);
      g.fill();
      g.restore();
    };
    const _pfireO = pfire;
    pfire = function (x, y, r) {
      if (!lavaOn())
        return _pfireO(x, y, r);
      r *= 1.4;
      puff(x, y, Math.round(r / 8) + 2, '90,40,15', 1.2);
      fx.push({ k: 'pf', x, y, r, life: .6, max: .6, pc: ['255,245,200', '255,150,50', '200,50,10'] });
      shake = Math.max(shake, 3);
      for (let i = 0; i < 14 + r * .6; i++) {
        const a = R() * 6.283, d = R() * r * .6, v = 20 + R() * 70;
        dp.push({
          k: 'f', o: 1, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * .7, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6 - 15, life: .45 + R() * .45, max: .9, s: 3 + R() * r * .18
        });
      }
      for (let i = 0; i < 12; i++) {
        const a = R() * 6.283, v = 30 + R() * 90;
        dp.push({
          k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 25, life: .5 + R() * .5, max: 1, s: 1.5 + R() * 1.5, c: i % 2 ? '#ffd34d' : '#ff7a1f'
        });
      }
    };
    /* jejak api Blash & warna cincin/muzzle jadi oranye */
    const _rockTrailO = rockTrail;
    rockTrail = function (b) {
      if (!b.lv)
        return _rockTrailO(b); if (R() < .7)
        dp.push({
          k: 'f', o: 1, x: b.x, y: b.y, vx: (R() - .5) * 14, vy: (R() - .5) * 14 - 8, life: .25 + R() * .2, max: .45, s: 2 + R() * 2
        });
    };
    const _updO = upd;
    upd = function (dt) {
      _updO(dt); if (lavaOn())
        fx.forEach(f => {
          if (f.k == 'ring' && f.col == '#f55')
            f.col = '#ff8a2a';
          else if (f.k == 'muzz' && f.col == '#e6c98e')
            f.col = '#ff8a2a';
        });
    };
  </script>

  <script>
    /* ===== Efek BURN: setiap hit dari musuh membakar player (ringan, tidak membunuh) ===== */
    const _hurtBn = hurt;
    hurt = function (d) {
      const h0 = p ? p.hp : 0;
      _hurtBn(d);
      if (p && lavaOn() && p.hp < h0 && p.dead <= 0) {
        if (!(p.burn > 0))
          msg('🔥 Kau terbakar!');
        p.burn = 3;
        p.bt = .5;
      }
    };
    const _updBn = upd;
    upd = function (dt) {
      _updBn(dt);
      if (!p)
        return;
      if (!lavaOn() || p.dead > 0) {
        p.burn = 0;
        return;
      }
      if (p.burn > 0) {
        p.burn -= dt;
        p.bt = (p.bt || 0) - dt;
        if (p.bt <= 0) {
          p.bt = .5;
          const n = Math.max(1, Math.round(2 * DF[DIFF].dmg));
          p.hp = Math.max(1, p.hp - n);
          dn(p.x, p.y - 12, n, 0, '#ff9a2a');
        }
        if (R() < dt * 22)
          dp.push({
            k: 'f', o: 1, x: p.x + (R() - .5) * 8, y: p.y - 2 - R() * 8, vx: (R() - .5) * 10, vy: -14 - R() * 16, life: .35, max: .35, s: 2 + R() * 1.5
          });
      }
    };
    const _envFxBn = envFx;
    envFx = function () {
      _envFxBn(); if (p && p.burn > 0 && lavaOn())
        lavaGlow(p.x, p.y - 6, 22, .3 + .15 * Math.sin(t * 14));
    };
    const _drawBn = draw;
    draw = function () {
      _drawBn(); if (p && p.burn > 0 && lavaOn()) {
        try {
          g.font = '9px monospace';
          txt('🔥 TERBAKAR', W - 10, 72, '#ff9a2a', 'right');
        } catch (e) { }
      }
    };
  </script>

  <script>
    /* ===== Suara tembakan Blash/bos lava: bola api ===== */
    const _eshotFB = SFX.eshot;
    SFX.eshot = function () {
      if (lavaOn())
        SFX.fireball();
      else
        _eshotFB();
    };
    /* ===== RACUN (Half): hit mini bos skeleton meracuni player — damage sama dengan burn Lava ===== */
    const _hurtPs = hurt;
    hurt = function (d) {
      const h0 = p ? p.hp : 0;
      _hurtPs(d);
      if (p && !lavaOn() && !iceOn() && !lobby && room == 0 && es.some(e => e.mini) && p.hp < h0 && p.dead <= 0) {
        if (!(p.psn > 0))
          msg('☠ Kau keracunan!');
        p.psn = 3;
        p.pt = .5;
      }
    };
    const _updPs = upd;
    upd = function (dt) {
      _updPs(dt);
      if (!p)
        return;
      if (lavaOn() || iceOn() || lobby || room != 0 || p.dead > 0) {
        p.psn = 0;
        return;
      }
      if (p.psn > 0) {
        p.psn -= dt;
        p.pt = (p.pt || 0) - dt;
        if (p.pt <= 0) {
          p.pt = .5;
          const n = Math.max(1, Math.round(2 * DF[DIFF].dmg));
          p.hp = Math.max(1, p.hp - n);
          dn(p.x, p.y - 12, n, 0, '#6bff5a');
        }
        if (R() < dt * 20)
          dp.push({
            k: 'p', x: p.x + (R() - .5) * 10, y: p.y - 4 - R() * 8, vx: (R() - .5) * 8, vy: -16 - R() * 14, life: .5, max: .5, s: 2 + R() * 1.5, c: R() < .5 ? '#7dff5a' : '#3fbf3a'
          });
      }
    };
    const _drawPs = draw;
    draw = function () {
      _drawPs(); if (p && p.psn > 0 && !lavaOn()) {
        try {
          g.font = '9px monospace';
          txt('☠ KERACUNAN', W - 10, 72, '#7dff5a', 'right');
        } catch (e) { }
      }
    };

    /* ===== EFEK SKILL MINI BOS (Half = racun hijau, Lava = api/bara) ===== */
    const _miniFxMX = miniFx;
    miniFx = function (dt) {
      const L = lavaOn(), dy = MBH.filter(h => h.k == 'c' && h.t - dt <= 0);
      _miniFxMX(dt);
      dy.forEach(h => {
        if (L) {
          fx.push({ k: 'gl', x: h.x, y: h.y, r: h.r * 2.2, c: '255,140,40', life: .4, max: .4 });
          for (let i = 0; i < 14; i++)
            dp.push({
              k: 'f', o: 1, x: h.x + (R() - .5) * h.r, y: h.y + (R() - .5) * h.r * .6, vx: (R() - .5) * 30, vy: -50 - R() * 70, life: .5 + R() * .4, max: .9, s: 2 + R() * 2.5
            });
          puff(h.x, h.y, 3, '255,110,30', 1.1);
        } else {
          fx.push({ k: 'gl', x: h.x, y: h.y, r: h.r * 2.2, c: '110,255,90', life: .45, max: .45 }, { k: 'ring', x: h.x, y: h.y, r: h.r * 1.3, w: 2, life: .4, max: .4, col: '#7dff5a' });
          for (let i = 0; i < 16; i++) {
            const a = R() * 6.283, v = 30 + R() * 70;
            dp.push({
              k: 'p', x: h.x, y: h.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .5 - 50 - R() * 40, life: .6 + R() * .4, max: 1, s: 2 + R() * 2, c: i % 2 ? '#7dff5a' : '#2f8a2a'
            });
          }
          puff(h.x, h.y, 4, '90,230,70', 1.3);
        }
      });
    };
    const _envFxMX = envFx;
    envFx = function () {
      _envFxMX();
      if (!MBH.length)
        return;
      const L = lavaOn(), c = L ? '255,120,30' : '110,255,90';
      g.save();
      g.globalCompositeOperation = 'lighter';
      MBH.forEach(h => {
        if (h.k == 'c') {
          const k = 1 - h.t / h.mx, q = g.createRadialGradient(h.x, h.y, 2, h.x, h.y, h.r);
          q.addColorStop(0, 'rgba(' + c + ',' + (.05 + .3 * k) + ')');
          q.addColorStop(1, 'rgba(' + c + ',0)');
          g.fillStyle = q;
          g.beginPath();
          g.arc(h.x, h.y, h.r, 0, 7);
          g.fill();
          g.setLineDash([5, 7]);
          g.lineDashOffset = -t * 40;
          g.strokeStyle = 'rgba(' + c + ',' + (.4 + .5 * k) + ')';
          g.lineWidth = 1.5;
          g.beginPath();
          g.arc(h.x, h.y, h.r * (1.1 - .1 * k), 0, 7);
          g.stroke();
          g.setLineDash([]);
          const n = Math.min(6, 2 + (h.r / 14 | 0));
          for (let i = 0; i < n; i++) {
            const u = (t * (L ? .9 : .5) + i / n) % 1, a = i * 2.4 + h.x, x = h.x + Math.cos(a) * h.r * .6, y = h.y + h.r * .3 - u * h.r * 1.1 * k;
            g.fillStyle = 'rgba(' + (L ? '255,200,80' : '170,255,140') + ',' + (1 - u) * (.3 + .6 * k) + ')';
            if (L)
              g.fillRect(x, y, 2, 2);
            else {
              g.beginPath();
              g.arc(x, y, 1.5 + u * 2, 0, 7);
              g.fill();
            }
          }
        } else if (h.k == 'l') {
          const k = 1 - h.t / h.mx;
          g.save();
          g.translate(h.x, h.y);
          g.rotate(h.a);
          const w = h.w * (.4 + k * 1.2), q = g.createLinearGradient(0, 0, h.len, 0);
          q.addColorStop(0, 'rgba(' + c + ',' + (.5 * k) + ')');
          q.addColorStop(1, 'rgba(' + c + ',0)');
          g.fillStyle = q;
          g.fillRect(0, -w, h.len, w * 2);
          g.fillStyle = 'rgba(255,255,255,' + (.2 + .6 * k) + ')';
          g.fillRect(0, -.8, h.len * (.3 + .7 * k), 1.6);
          g.restore();
        } else if (h.k == 'r') {
          g.strokeStyle = 'rgba(' + c + ',.45)';
          g.lineWidth = 9;
          g.beginPath();
          g.arc(h.x, h.y, Math.max(1, h.rr - 4), 0, 7);
          g.stroke();
          g.lineWidth = 1;
        }
      });
      g.restore();
    };

    /* ===== EFEK BOS: Half = bayangan ungu (wisp jiwa), Lava = bara + aura api ===== */
    const _envFxBX = envFx;
    envFx = function () {
      _envFxBX();
      if (room != 2 || lobby || !BOSS.on || BOSS.dead)
        return;
      const e = es.find(x => x.k == 'boss');
      if (!e)
        return;
      const L = lavaOn(), ph = BOSS.ph || 1, cx = DW / 2, cy = DY;
      g.save();
      g.globalCompositeOperation = 'lighter';
      if (L) {
        const q = g.createRadialGradient(e.x, e.y + 8, 4, e.x, e.y + 8, 52 + 8 * ph);
        q.addColorStop(0, 'rgba(255,170,50,' + (.22 + .08 * ph) + ')');
        q.addColorStop(1, 'rgba(255,60,10,0)');
        g.fillStyle = q;
        g.fillRect(e.x - 70, e.y - 50, 140, 120);
        for (let i = 0; i < 14; i++) {
          const u = (t * .35 + i * .071) % 1, x = (i * 97.3 + Math.sin(t + i) * 14) % DW, y = DH - u * DH * .9;
          g.fillStyle = 'rgba(255,' + (150 + i * 6) + ',50,' + (1 - u) * .7 + ')';
          g.fillRect(Math.round(x), Math.round(y), 2, 2);
        }
        g.strokeStyle = 'rgba(255,140,40,' + (.12 + .05 * ph) + ')';
        g.lineWidth = 1.5;
        for (let r = 0; r < 2; r++) {
          const u = (t * .5 + r * .5) % 1;
          g.globalAlpha = 1 - u;
          g.beginPath();
          g.arc(e.x, e.y + 8, 20 + u * 90, 0, 7);
          g.stroke();
        }
        g.globalAlpha = 1;
      } else {
        const q = g.createRadialGradient(e.x, e.y + 8, 4, e.x, e.y + 8, 56);
        q.addColorStop(0, 'rgba(170,80,255,' + (.2 + .08 * ph) + ')');
        q.addColorStop(1, 'rgba(90,20,160,0)');
        g.fillStyle = q;
        g.fillRect(e.x - 70, e.y - 50, 140, 120);
        const n = 4 + ph * 2;
        for (let i = 0; i < n; i++) {
          const a = t * (.5 + ph * .15) + i / n * 6.283, x = cx + Math.cos(a) * 184, y = cy + Math.sin(a) * 147 + Math.sin(t * 5 + i) * 2, w = g.createRadialGradient(x, y, 0, x, y, 12);
          w.addColorStop(0, 'rgba(220,170,255,.8)');
          w.addColorStop(1, 'rgba(140,60,255,0)');
          g.fillStyle = w;
          g.beginPath();
          g.arc(x, y, 12, 0, 7);
          g.fill();
        }
        if (R() < .5)
          dp.push({
            k: 'p', x: e.x + (R() - .5) * 26, y: e.y + 4, vx: (R() - .5) * 10, vy: -20 - R() * 24, life: .7, max: .7, s: 2 + R() * 1.5, c: R() < .5 ? '#b46cff' : '#6a2ec8'
          });
      }
      g.restore();
    };
  </script>

  <script>
    /* ===== BOLA RACUN (Half): glow, jejak, dan orb pengisian mini bos ===== */
    const _updPB = upd;
    upd = function (dt) {
      _updPB(dt);
      pr.forEach(b => {
        if (b.pb && R() < dt * 45)
          dp.push({
            k: 'p', x: b.x + (R() - .5) * 4, y: b.y + (R() - .5) * 4, vx: (R() - .5) * 10, vy: -6 - R() * 10, life: .35, max: .35, s: 1.5 + R() * 1.5, c: R() < .5 ? '#7dff5a' : '#2f8a2a'
          });
      });
    };
    const _envFxPB = envFx;
    envFx = function () {
      _envFxPB();
      g.save();
      g.globalCompositeOperation = 'lighter';
      pr.forEach(b => {
        if (!b.pb)
          return; const r = b.r; g.globalCompositeOperation = 'source-over'; g.fillStyle = '#2f9a2a'; g.beginPath(); g.arc(b.x, b.y, r, 0, 7); g.fill(); g.globalCompositeOperation = 'lighter'; const q = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 3.2); q.addColorStop(0, 'rgba(150,255,110,.85)'); q.addColorStop(1, 'rgba(60,200,40,0)'); g.fillStyle = q; g.beginPath(); g.arc(b.x, b.y, r * 3.2, 0, 7); g.fill(); g.fillStyle = 'rgba(220,255,200,.9)'; g.beginPath(); g.arc(b.x - r * .25, b.y - r * .25, r * .45, 0, 7); g.fill();
      });
      if (!lavaOn())
        es.forEach(e => {
          if (e.mini == 'mel' && e.s2 == 'wind' && e.atk == 'quake' && e.tmx) {
            const k = 1 - e.tm / e.tmx, x = e.x + (e.fdr || 1) * 18, y = e.y - 30, r = 4 + k * 9, q = g.createRadialGradient(x, y, 0, x, y, r * 2);
            q.addColorStop(0, 'rgba(190,255,150,.9)');
            q.addColorStop(1, 'rgba(60,200,40,0)');
            g.fillStyle = q;
            g.beginPath();
            g.arc(x, y, r * 2, 0, 7);
            g.fill();
          }
        });
      g.restore();
    };
