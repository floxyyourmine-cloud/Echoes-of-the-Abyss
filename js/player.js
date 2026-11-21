/* ==========================================================================
   ECHOES OF THE ABYSS - PLAYER & CHARACTER MODULE
   Character selection, attributes, animations, and HUD avatar.
   ========================================================================== */
    // ===== PILIH KARAKTER: pratinjau animasi (idle, kedip, rambut, pedang) =====
    (function () {
      const sel = document.getElementById('charSel');
      if (!sel)
        return;
      const cards = [...sel.querySelectorAll('.cs-card')];
      let cur = 'm';
      try {
        cur = localStorage.getItem('eoa_hero') === 'f' ? 'f' : 'm';
      } catch (e) { }
      const set = k => {
        cur = k; FEM = k === 'f'; try {
          localStorage.setItem('eoa_hero', k);
        } catch (e) { } cards.forEach(c => c.classList.toggle('on', c.dataset.hero === k));
      };
      cards.forEach(c => c.addEventListener('click', () => set(c.dataset.hero)));
      set(cur);
      let T = 0, last = performance.now();

      function preview(card) {
        const pc = card.querySelector('canvas'), pctx = pc.getContext('2d'), fem = card.dataset.hero === 'f';
        const sv = { p, t, HSd, wi, FEM, HT, HSH };
        const q = Object.assign({}, p, {
          x: 28, y: 36, vx: 0, vy: 0, wb: 0, wph: 0, idt: T * 3, face: .5, al: 0, dod: 0, swing: 0, hold: 0, recoil: 0, hurt: 0, cdA: 0, an: null
        });
        g.save();
        try {
          p = q;
          t = T;
          HSd = 1;
          wi = 0;
          FEM = fem;
          HT = null;
          g.setTransform(1, 0, 0, 1, 0, 0);
          g.globalAlpha = 1;
          g.imageSmoothingEnabled = false;
          g.clearRect(0, 0, 112, 120);
          g.setTransform(2, 0, 0, 2, 0, 0);
          const wp = wpose();
          drawHero(q.x, q.y, 0, null, wp.lx, wp.ly);
          drawArmed(wp);
          pctx.clearRect(0, 0, 112, 120);
          pctx.imageSmoothingEnabled = false;
          pctx.drawImage(cv, 0, 0, 112, 120, 0, 0, 112, 120);
        } finally {
          g.restore();
          p = sv.p;
          t = sv.t;
          HSd = sv.HSd;
          wi = sv.wi;
          FEM = sv.FEM;
          HT = sv.HT;
          HSH = sv.HSH;
        }
      }
      (function loop(n) {
        const dt = Math.min(.05, (n - last) / 1000);
        last = n;
        T += dt;
        const menu = document.getElementById('menu');
        if (!inGame && !playing && menu && !menu.classList.contains('hidden')) {
          try {
            cards.forEach(preview);
          } catch (e) { }
        }
        requestAnimationFrame(loop);
      })(last);
    })();
    /* ===== HUD PEMAIN BARU: potret wajah, bar HP / Stamina / ULT / EXP, peringatan darah rendah (<20%) ===== */
    (function () {
      /* cewek: rambut panjang lurus, pita merah, armor lebih gelap */
      var FF = [
        '.........rr.rr..',
        '...KKKKKKKrrrr..',
        '..KKKKKKKKKKKK..',
        '..KKHHKKKKKKKK..',
        '.KKKKKKKKKKKKKK.',
        '.KKKKKKKKKKKKKK.',
        '.KKKKKKKKKKKKKK.',
        '.KKKssssssssKKK.',
        '.KKKswcssgwsKKK.',
        '.KKKsccssggsKKK.',
        '.KKKpssssssspKKK.'.replace('sssssssp', 'ssssssp'),
        '.KKrrrrrrrrrrKK.',
        '.KKrRrrrrdrrrKK.',
        '.bbbbnnddnnbbbb.',
        'bbbbbbnnnnbbbbbb',
        'eeeeeennnneeeeee'
      ];
      var hpG = -1, vig = null, vW = 0, vH = 0;

      function buildVig() {
        vW = W;
        vH = H;
        vig = document.createElement('canvas');
        vig.width = W;
        vig.height = H;
        var x = vig.getContext('2d'), r = Math.hypot(W, H) / 2, gr = x.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, r);
        gr.addColorStop(0, 'rgba(190,0,10,0)');
        gr.addColorStop(.6, 'rgba(200,10,20,.2)');
        gr.addColorStop(1, 'rgba(235,20,30,.95)');
        x.fillStyle = gr;
        x.fillRect(0, 0, W, H);
        /* garis tepi tipis supaya sisi layar benar-benar terasa merah */
        var e = 22, sides = [
          [0, 0, W, e, 0, 0, 0, e], [0, H - e, W, e, 0, H, 0, H - e], [0, 0, e, H, 0, 0, e, 0], [W - e, 0, e, H, W, 0, W - e, 0]
        ];
        sides.forEach(function (s) { var q = x.createLinearGradient(s[4], s[5], s[6], s[7]); q.addColorStop(0, 'rgba(255,30,40,.55)'); q.addColorStop(1, 'rgba(255,30,40,0)'); x.fillStyle = q; x.fillRect(s[0], s[1], s[2], s[3]); });
      }

      function sh(s, x, y, c, al) { g.textAlign = al || 'left'; g.fillStyle = '#000'; g.fillText(s, x + 1, y + 1); g.fillStyle = c; g.fillText(s, x, y); }

      function frame(x, y, w, h, thin) {
        if (thin) {
          g.fillStyle = '#07060c';
          g.fillRect(x - 1, y - 1, w + 2, h + 2);
          return;
        }
        g.fillStyle = 'rgba(216,184,120,.55)';
        g.fillRect(x - 2, y - 2, w + 4, h + 4);
        g.fillStyle = '#07060c';
        g.fillRect(x - 1, y - 1, w + 2, h + 2);
      }

      function fill(x, y, w, h, fr, col) {
        g.fillStyle = '#1b1830';
        g.fillRect(x, y, w, h);
        var fw = Math.max(0, Math.round(w * Math.min(1, Math.max(0, fr))));
        if (!fw)
          return;
        g.fillStyle = col;
        g.fillRect(x, y, fw, h);
        g.fillStyle = 'rgba(255,255,255,.22)';
        g.fillRect(x, y, fw, Math.max(1, Math.ceil(h * .4)));
        g.fillStyle = 'rgba(0,0,0,.25)';
        g.fillRect(x, y + h - 1, fw, 1);
      }

      function face(x, y, now) {
        var tt = now / 1000, blink = (tt % 3.9) < .13 || ((tt + 1.7) % 7.3) < .1, glt = (tt % 5.1) < .2, cv = pfBuild(FEM ? 1 : 0, blink ? 1 : 0);
        g.drawImage(cv, x, y);
        if (glt && !blink) {
          g.fillStyle = '#fff';
          g.fillRect(x + PFX + 5, y + PFY - 12, 1, 1);
        }
      }

      /* ===== potret 46x44 px: kepala + bahu dirender dari rumus piksel yang sama dengan sprite in-game (1 unit-setengah = 1 px) ===== */
      var PL = {
        ol: '#0b0a10', bk: '#17151b', s1: '#f1f3f8', s2: '#c9ccd6', s3: '#9a9dac', s4: '#666878', s5: '#3b3b48',
        b1: '#6b3a34', b2: '#43231f', hk: '#1b1a21', hm: '#2c2a33', hh: '#4d4a58', sk: '#f6e6dd', ss: '#dcc3ba', ch: '#f2a6a8',
        ey: '#27b4c6', ed: '#0d6574', el: '#a8f2f7', rd: '#8a1a2c', rl: '#bd2c45', rk: '#4a0d1a', rm: '#9d2036'
      };
      var PFW = 46, PFH = 44, PFX = 23, PFY = 36, PFC = {};

      function pfBuild(fem, blk) {
        var key = fem + '_' + blk;
        if (PFC[key])
          return PFC[key];
        var cv = document.createElement('canvas');
        cv.width = PFW;
        cv.height = PFH;
        var q = cv.getContext('2d');
        var Z = function (a, b, w, h, c) { q.fillStyle = c; q.fillRect(a + PFX, b + PFY, w, h); }, ZH = Z, ZP = Z;
        var faceZ = function () {
          ZH(-10, -17, 20, 9, PL.sk);
          ZH(7, -17, 3, 9, PL.ss);
          ZH(-10, -17, 20, 1, '#c9b2ae');
          ZH(-8, -9, 2, 1, PL.ch);
          ZH(6, -9, 2, 1, PL.ch);
          ZH(-10, -9, 20, 1, PL.ss);
          [-1, 1].forEach(function (s) {
            var x0 = s < 0 ? -8 : 2, E1 = s < 0 ? PL.ey : '#e3a92a', E2 = s < 0 ? PL.ed : '#7a520a', E3 = s < 0 ? PL.el : '#fff0a8', E4 = s < 0 ? '#06242a' : '#2a1800';
            if (blk) {
              ZH(x0, -15, 6, 1, PL.ol);
              ZH(x0, -14, 6, 3, PL.sk);
              ZH(x0 + 1, -11, 4, 1, '#5a2a34');
            } else {
              ZH(x0, -15, 6, 1, PL.ol);
              ZH(s < 0 ? x0 - 1 : x0 + 6, -14, 1, 1, PL.ol);
              ZH(x0, -14, 6, 4, '#ffffff');
              ZH(x0 + 1, -14, 4, 4, E1);
              ZH(x0 + 1, -14, 4, 1, E2);
              ZH(x0 + 2, -13, 2, 2, E4);
              ZH(x0 + 1, -11, 4, 1, E3);
              ZH(x0 + 1, -14, 1, 1, '#ffffff');
            }
          });
          ZH(-1, -10, 2, 1, '#e3a89c');
          ZH(-2, -7, 4, 1, '#b86a72');
          ZH(-1, -6, 2, 1, '#8a4452');
        };
        var scarfZ = function (wd) {
          Z(-wd + 1, -8, 2 * wd - 2, 4, PL.rd);
          Z(-wd, -4, 2 * wd, 5, PL.rd);
          Z(-wd + 1, -8, 2 * wd - 2, 1, PL.rl);
          Z(-wd, -4, 9, 1, PL.rl);
          Z(2, -3, wd - 3, 1, PL.rm);
          Z(-wd, 1, 2 * wd, 1, PL.rk);
          Z(-6, -6, 1, 5, PL.rk);
          Z(4, -5, 1, 5, PL.rk);
          Z(-3, -7, 3, 1, PL.rm);
          Z(7, -3, 1, 4, PL.rk);
        };
        var i, y;
        if (!fem) {
          /* ---- COWOK ---- */
          Z(-11, 2, 22, 17, PL.bk);
          Z(-9, -2, 18, 13, PL.s2);
          Z(-9, -2, 18, 2, PL.s1);
          Z(-8, 0, 7, 4, PL.s1);
          Z(-8, 4, 5, 3, '#dfe1e9');
          Z(1, 0, 7, 4, PL.s2);
          Z(2, 4, 6, 3, PL.s3);
          Z(-1, 0, 2, 9, PL.s5);
          Z(-9, 9, 18, 1, PL.s4);
          Z(-9, 10, 18, 1, PL.s5);
          for (i = 0; i < 8; i++) {
            Z(-10 + i, 0 + i, 3, 2, PL.b1);
            Z(7 - i, 0 + i, 3, 2, PL.b1);
            Z(-10 + i, 2 + i, 3, 1, PL.b2);
            Z(7 - i, 2 + i, 3, 1, PL.b2);
          }
          [-1, 1].forEach(function (s) {
            var M = function (a, w) { return s < 0 ? a : -a - w; }, hi = s < 0 ? PL.s1 : PL.s2, md = s < 0 ? PL.s2 : PL.s3, sh = s < 0 ? PL.s3 : PL.s4, pl = function (x, w, yy, h) { ZP(M(x + 1, w - 2), yy, w - 2, 1, hi); ZP(M(x, w), yy + 1, w, h - 2, md); ZP(M(x + 1, w - 2), yy + h - 1, w - 2, 1, PL.s4); ZP(M(x + 1, w - 2), yy + 1, 3, 2, hi); ZP(s < 0 ? M(x, w) + w - 1 : M(x, w), yy + 2, 1, h - 3, sh); };
            pl(-21, 11, -5, 6);
            pl(-23, 13, 0, 6);
            pl(-21, 11, 5, 6);
            ZP(M(-14, 2), 2, 2, 2, PL.s5);
            ZP(M(-14, 2), 8, 2, 1, PL.s5);
            ZP(M(-19, 1), 3, 1, 1, PL.s5);
            ZP(M(-12, 1), -2, 1, 1, PL.s5);
            ZP(s < 0 ? -10 : 9, -5, 1, 16, PL.s5);
          });
          scarfZ(12);
          faceZ();
          var H = PL.hk, Mm = PL.hm, L = PL.hh, L2 = '#6c6a7c';
          [[-8, -30, 3, 2], [-3, -33, 4, 5], [2, -31, 3, 3], [7, -29, 3, 2]].forEach(function (a, k) { ZH(a[0], a[1], a[2], a[3], k % 2 ? Mm : H); ZH(a[0] + 1, a[1] - 1, Math.max(1, a[2] - 2), 1, H); });
          ZH(-10, -29, 20, 2, H);
          ZH(-12, -27, 24, 3, H);
          ZH(-13, -24, 26, 5, H);
          [[-16, -24, 3, 2], [-17, -21, 4, 2], [-15, -19, 3, 2]].forEach(function (a, k) { ZH(a[0], a[1], a[2], a[3], k % 2 ? Mm : H); });
          [[13, -25, 3, 2], [14, -22, 4, 2], [13, -19, 3, 2]].forEach(function (a, k) { ZH(a[0], a[1], a[2], a[3], k % 2 ? H : Mm); });
          ZH(-13, -19, 3, 7, H);
          ZH(10, -19, 3, 7, H);
          ZH(-12, -12, 2, 3, Mm);
          ZH(10, -12, 2, 3, Mm);
          ZH(-12, -19, 24, 3, H);
          ZH(-11, -16, 22, 1, H);
          [[-11, 3, 4], [-8, 3, 3], [-5, 3, 4], [-2, 4, 6], [2, 3, 4], [5, 3, 3], [8, 3, 4]].forEach(function (a, k) {
            var x = a[0], w = a[1], l = a[2];
            ZH(x, -20, w, l, k % 2 ? Mm : H);
            ZH(x, -20, 1, l, H);
            ZH(x + 1, -20 + l, w - 1, 1, H);
            if (l > 4) {
              ZH(x + 1, -19 + l, w - 1, 1, H);
              ZH(x + 2, -18 + l, 1, 1, H);
            }
          });
          ZH(-3, -32, 1, 3, L);
          ZH(-7, -28, 4, 1, L);
          ZH(1, -27, 5, 1, L);
          ZH(-11, -24, 3, 1, L2);
          ZH(8, -24, 3, 1, L2);
          ZH(-6, -22, 3, 1, L);
          ZH(3, -21, 4, 1, L);
          ZH(-12, -9, 2, 4, Mm);
          ZH(10, -9, 2, 4, Mm);
        } else {
          /* ---- CEWEK ---- */
          for (y = -24; y <= 8; y++) {
            var s2 = Math.round(Math.sin(-y * .14) * (y > 4 ? 1 : .3)), u = Math.max(0, y - 2), wv = Math.round(Math.sin(y * .38 + 1) * (1 + Math.min(2.4, u * .09))), w0 = (y < 4 ? 16 : 17 + Math.min(3, u * .12)) | 0, c = (y + 24) % 7 < 2 ? PL.hm : (y + 24) % 11 == 5 ? PL.hh : PL.hk;
            Z(-w0 + s2 + wv, y, 2 * w0, 1, PL.hk);
            Z(-w0 + s2 + wv, y, 7, 1, c);
            Z(w0 - 7 + s2 + wv, y, 7, 1, c);
          }
          Z(-9, 2, 18, 15, PL.bk);
          Z(-8, -1, 16, 12, PL.s2);
          Z(-8, -1, 16, 2, PL.s1);
          Z(-7, 1, 6, 4, PL.s1);
          Z(1, 1, 6, 4, PL.s2);
          Z(-8, 9, 16, 1, PL.s4);
          Z(-8, 10, 16, 1, PL.s5);
          Z(-1, 1, 2, 8, PL.s5);
          Z(-4, 3, 8, 2, PL.s5);
          Z(-1, 1, 2, 1, PL.s4);
          [-1, 1].forEach(function (s) {
            var M = function (a, w) { return s < 0 ? a : -a - w; }, hi = s < 0 ? PL.s1 : PL.s2, md = s < 0 ? PL.s2 : PL.s3;
            ZP(M(-18, 10), -4, 10, 5, md);
            ZP(M(-18, 10), -4, 10, 1, hi);
            ZP(M(-17, 4), -3, 4, 2, hi);
            ZP(M(-18, 10), 0, 10, 1, PL.s4);
            ZP(M(-19, 11), 1, 11, 5, md);
            ZP(M(-19, 11), 1, 11, 1, hi);
            ZP(M(-18, 4), 2, 4, 2, hi);
            ZP(M(-19, 11), 5, 11, 1, PL.s5);
            ZP(M(-14, 2), 2, 2, 2, PL.s5);
          });
          scarfZ(11);
          Z(-2, -2, 4, 4, PL.s3);
          Z(-1, -2, 2, 2, PL.s1);
          Z(-1, 0, 2, 1, PL.s5);
          faceZ();
          var H2 = PL.hk, M2 = PL.hm, L3 = PL.hh;
          ZH(-6, -33, 12, 2, H2);
          ZH(-10, -32, 20, 2, H2);
          ZH(-13, -30, 26, 3, H2);
          ZH(-15, -27, 30, 4, H2);
          ZH(-16, -23, 32, 6, H2);
          [
            [-14, 4, 4], [-11, 4, 5], [-8, 3, 4], [-5, 3, 5], [-2, 4, 6], [1, 3, 4], [4, 3, 5], [6, 3, 4], [9, 4, 5], [12, 3, 3]
          ].forEach(function (a, k) { ZH(a[0], -19, a[1], a[2], k % 2 ? M2 : H2); ZH(a[0], -19, 1, a[2], H2); });
          ZH(-9, -31, 5, 1, L3);
          ZH(1, -30, 6, 1, L3);
          ZH(-13, -26, 4, 1, L3);
          ZH(9, -26, 4, 1, L3);
          ZH(-4, -25, 5, 1, M2);
          ZH(3, -24, 5, 1, M2);
          ZH(-8, -22, 4, 1, L3);
          ZH(6, -22, 4, 1, L3);
          for (y = -18; y <= 8; y++) {
            var wv2 = Math.round(Math.sin(y * .5) * 1.2), c2 = y % 6 < 2 ? M2 : H2;
            ZH(-17 + wv2, y, 7, 1, c2);
            ZH(10 - wv2, y, 7, 1, c2);
            if (y % 7 == 3) {
              ZH(-16 + wv2, y, 1, 1, L3);
              ZH(11 - wv2, y, 1, 1, L3);
            }
          }
          ZH(5, -34, 6, 5, PL.rd);
          ZH(5, -34, 6, 1, PL.rl);
          ZH(7, -32, 2, 2, PL.rk);
          ZH(13, -36, 6, 6, PL.rm);
          ZH(13, -36, 6, 1, PL.rl);
          ZH(15, -34, 2, 2, PL.rk);
          ZH(10, -32, 3, 3, PL.rd);
          ZH(10, -32, 3, 1, PL.rl);
          ZH(10, -29, 3, 8, PL.rm);
          ZH(10, -29, 1, 8, PL.rl);
          ZH(13, -28, 3, 6, PL.rd);
          ZH(13, -23, 3, 1, PL.rk);
          ZH(11, -22, 1, 1, PL.rk);
        }
        /* bayangan lembut di sisi bawah supaya bahu menyatu dengan bingkai */
        var gr = q.createLinearGradient(0, PFH - 8, 0, PFH);
        gr.addColorStop(0, 'rgba(0,0,0,0)');
        gr.addColorStop(1, 'rgba(0,0,0,.35)');
        q.fillStyle = gr;
        q.fillRect(0, PFH - 8, PFW, 8);
        return PFC[key] = cv;
      }
      window.hudPlayer = function () {
        var now = performance.now(), mx = mhp(), fr = p.hp / mx, low = p.hp > 0 && fr < .4, crit = low && fr < .2, pu = .5 + .5 * Math.sin(now / 1000 * (fr < .1 ? 11 : crit ? 9 : 6)), i;
        /* --- sisi layar berdenyut merah saat HP < 40% (lebih cepat & pekat saat < 20%) --- */
        if (low) {
          if (!vig || vW !== W || vH !== H)
            buildVig();
          g.globalAlpha = crit ? .22 + .68 * pu : .12 + .5 * pu;
          g.drawImage(vig, 0, 0);
          g.globalAlpha = 1;
        }
        if (hpG < 0 || p.hp > hpG)
          hpG = p.hp;
        else
          hpG += (p.hp - hpG) * .08;
        g.save();
        g.imageSmoothingEnabled = false;
        /* --- potret (46x44, bingkai emas berhias) --- */
        var px = 8, py = 6, PW = 46, PH = 44, shk = crit ? Math.round(Math.sin(now / 38)) : 0;
        g.fillStyle = 'rgba(0,0,0,.35)';
        g.fillRect(px - 1, py + 3, PW + 4, PH + 4);
        g.fillStyle = '#6b5326';
        g.fillRect(px - 3, py - 3, PW + 6, PH + 6);
        g.fillStyle = '#d8b878';
        g.fillRect(px - 3, py - 3, PW + 6, 1);
        g.fillRect(px - 3, py - 3, 1, PH + 6);
        g.fillStyle = '#3a2c12';
        g.fillRect(px - 3, py + PH + 2, PW + 6, 1);
        g.fillRect(px + PW + 2, py - 3, 1, PH + 6);
        g.fillStyle = '#07060c';
        g.fillRect(px - 1, py - 1, PW + 2, PH + 2);
        /* latar: gradasi ungu gelap + kilau halus */
        var bgG = g.createLinearGradient(0, py, 0, py + PH);
        if (low) {
          var lr = (60 + 70 * pu) | 0;
          bgG.addColorStop(0, 'rgb(' + lr + ',14,22)');
          bgG.addColorStop(1, 'rgb(' + (lr >> 1) + ',8,14)');
        } else {
          bgG.addColorStop(0, '#3a2f66');
          bgG.addColorStop(1, '#17132b');
        }
        g.fillStyle = bgG;
        g.fillRect(px, py, PW, PH);
        g.fillStyle = 'rgba(255,255,255,.05)';
        g.fillRect(px, py, PW, 12);
        g.save();
        g.beginPath();
        g.rect(px, py, PW, PH);
        g.clip();
        face(px + shk, py, now);
        if (p.hurt > 0) {
          g.fillStyle = 'rgba(255,40,40,.45)';
          g.fillRect(px, py, PW, PH);
        } else if (low) {
          g.fillStyle = 'rgba(255,30,40,' + (.1 + .22 * pu) + ')';
          g.fillRect(px, py, PW, PH);
        }
        g.fillStyle = 'rgba(255,255,255,.10)';
        g.fillRect(px, py, PW, 1);
        g.fillRect(px, py, 1, PH);
        g.restore();
        /* paku sudut bingkai */
        g.fillStyle = '#ffe9b0';
        g.fillRect(px - 3, py - 3, 3, 3);
        g.fillRect(px + PW, py - 3, 3, 3);
        g.fillRect(px - 3, py + PH, 3, 3);
        g.fillRect(px + PW, py + PH, 3, 3);
        g.fillStyle = '#8a6a2a';
        g.fillRect(px - 2, py - 2, 1, 1);
        g.fillRect(px + PW + 1, py - 2, 1, 1);
        g.fillRect(px - 2, py + PH + 1, 1, 1);
        g.fillRect(px + PW + 1, py + PH + 1, 1, 1);
        /* lencana level */
        g.font = 'bold 7px monospace';
        var lt = 'Lv ' + lvl, lw = Math.ceil(g.measureText(lt).width) + 8, lx = px + (PW >> 1) - (lw >> 1);
        frame(lx, py + PH - 3, lw, 10, true);
        g.fillStyle = '#4a3a1c';
        g.fillRect(lx, py + PH - 3, lw, 10);
        g.fillStyle = '#d8b878';
        g.fillRect(lx, py + PH - 3, lw, 1);
        g.fillStyle = '#2a1f0c';
        g.fillRect(lx, py + PH + 6, lw, 1);
        sh(lt, lx + (lw >> 1), py + PH + 4, '#ffe9b0', 'center');
        /* --- HP --- */
        var bx = 62, bw = 126, c;
        frame(bx, 9, bw, 10);
        fill(bx, 9, bw, 10, 1, '#1b1830');
        g.fillStyle = 'rgba(255,225,190,.55)';
        g.fillRect(bx, 9, Math.round(bw * Math.min(1, hpG / mx)), 10);
        c = low ? 'rgb(' + ((170 + 85 * pu) | 0) + ',' + ((24 + 20 * pu) | 0) + ',' + ((28 + 20 * pu) | 0) + ')' : '#e04b4b';
        fill(bx, 9, bw, 10, fr, c);
        g.fillStyle = 'rgba(0,0,0,.35)';
        for (i = 1; i < 5; i++)
          g.fillRect(bx + Math.round(bw * i / 5), 9, 1, 10);
        g.font = 'bold 8px monospace';
        sh('HP ' + Math.max(0, Math.ceil(p.hp)) + '/' + mx, bx + 4, 17, low && pu > .5 ? '#ffd0d0' : '#fff');
        /* --- STAMINA --- */
        frame(bx, 23, bw, 5);
        fill(bx, 23, bw, 5, p.st / 100, p.st < 30 ? '#caa14a' : '#4fd18a');
        g.fillStyle = 'rgba(0,0,0,.35)';
        g.fillRect(bx + Math.round(bw * .3), 23, 1, 5);
        /* --- ULTIMATE --- */
        var rd = ULT >= ULT_MAX, up = rd ? .6 + .4 * Math.sin(now / 1000 * 8) : 1;
        frame(bx, 32, bw, 7);
        fill(bx, 32, bw, 7, ULT / ULT_MAX, rd ? 'rgb(' + ((200 + 55 * up) | 0) + ',' + ((170 + 60 * up) | 0) + ',60)' : '#9a5cff');
        if (rd) {
          g.strokeStyle = 'rgba(255,230,140,' + up + ')';
          g.strokeRect(bx - 2.5, 29.5, bw + 5, 12);
        }
        g.font = 'bold 8px monospace';
        sh(rd ? 'ULT SIAP [Q]' : 'ULT ' + Math.floor(ULT) + '%', bx + bw + 6, 39, rd ? '#ffe08a' : '#c9a8ff');
        /* --- EXP --- */
        frame(bx, 43, bw, 2, true);
        fill(bx, 43, bw, 2, exp / (lvl * 40), '#5fb0ff');
        g.restore();
        g.font = 'bold 9px monospace';
        g.textAlign = 'left';
        g.globalAlpha = 1;
      };
    })();
