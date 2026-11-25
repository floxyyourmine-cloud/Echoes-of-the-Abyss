/* ==========================================================================
   ECHOES OF THE ABYSS - MAIN ENGINE & ORCHESTRATOR MODULE
   Core engine, Web Audio SFX, external MP3 loader, input handlers, menus, loop.
   ========================================================================== */
var GFX = { hp: false, lvl: 0, capDp: 1e9 };
const MW = 640, MH = 400;
let W = 640, H = 400;
const cv = document.getElementById('c'), g = cv.getContext('2d', { alpha: false });
g.imageSmoothingEnabled = false;

function resizeGameCanvas() {
  const aspect = window.innerWidth / (window.innerHeight || 1);
  if (aspect >= 1.6) {
    H = 400;
    W = Math.round(H * aspect);
  } else {
    W = 640;
    H = Math.round(W / aspect);
  }
  cv.width = W;
  cv.height = H;
  g.imageSmoothingEnabled = false;
  if (typeof VG !== 'undefined' && VG) {
    VG.width = W;
    VG.height = H;
    const v = VG.getContext('2d'), q = v.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, Math.max(W, H) * .65);
    q.addColorStop(0, 'rgba(4,3,10,0)');
    q.addColorStop(1, 'rgba(4,3,10,.7)');
    v.fillStyle = q;
    v.fillRect(0, 0, W, H);
  }
}
window.addEventListener('resize', resizeGameCanvas);
window.addEventListener('orientationchange', resizeGameCanvas);
const K = {}, P = {}, M = { x: 320, y: 200, sx: 320, sy: 200, d: 0, u: 0 };
let isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 1024);
const touchJoy = { active: false, x: 0, y: 0, sprint: false, pointerId: null, startX: 0, startY: 0 };
let touchAiming = false;
const touchAttack = { active: false, pointerId: null };

// ===== Kamera: zoom dekat & mengikuti player (ubah CAM_Z untuk atur jarak; 1 = tanpa zoom) =====
let CAM_Z = 1.4;
const CAM_SM = 7;
let camX = 0, camY = 0, camInit = false;

// ===== Ukuran ruangan dungeon (diperluas dari 640x400) & jumlah musuh tambahan =====
const DW = 800, DH = 480, OX = 80, OY = 40, DY = DH / 2, EXTRA_ENEMIES = 4, HALF_EXTRA = 5;
let WW = 1218, WH = 400;

function camUpd(dt) {
  const vw = W / CAM_Z, vh = H / CAM_Z, tx = (vw >= WW) ? (WW - vw) / 2 : Math.max(0, Math.min(WW - vw, p.x - vw / 2)), ty = (vh >= WH) ? (WH - vh) / 2 : Math.max(0, Math.min(WH - vh, p.y - vh / 2 - 4));
  if (!camInit || Math.hypot(tx - camX, ty - camY) > 140) {
    camX = tx;
    camY = ty;
    camInit = true;
  } else {
    const k = Math.min(1, dt * CAM_SM);
    camX += (tx - camX) * k;
    camY += (ty - camY) * k;
  }
  camX = Math.round(camX * CAM_Z) / CAM_Z;
  camY = Math.round(camY * CAM_Z) / CAM_Z;
  M.x = camX + M.sx / CAM_Z;
  M.y = camY + M.sy / CAM_Z;
}
onkeydown = e => {
  SFX.init(); if (e.code == 'KeyF' && !e.repeat) {
    const d = document.documentElement;
    try {
      document.fullscreenElement ? document.exitFullscreen() : d.requestFullscreen && d.requestFullscreen();
    } catch (x) { }
  } if (!K[e.code])
    P[e.code] = 1; K[e.code] = 1; if (e.code == 'Space')
    e.preventDefault();
};
onkeyup = e => K[e.code] = 0;
cv.onmousemove = e => { const r = cv.getBoundingClientRect(); M.sx = (e.clientX - r.left) * W / r.width; M.sy = (e.clientY - r.top) * H / r.height; M.x = camX + M.sx / CAM_Z; M.y = camY + M.sy / CAM_Z; };
cv.onmousedown = e => { SFX.init(); M.d = 1; cv.focus(); };
onmouseup = () => {
  if (M.d) {
    M.d = 0;
    M.u = 1;
  }
};
cv.oncontextmenu = e => e.preventDefault();

// ===== Audio (Web Audio, tanpa file eksternal) =====
const SFX = (() => {
  let ac, mg, mu, sg, wg, cg, nb, on = true, nt = 0, st = 0, oc, rv, ml, ig, md = 'menu', vl = 1, mt = 0, bi = 0, xv = 1, xr = null;
  const RT = [55, 43.65, 49, 41.2], SC = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 659.25];

  /* ===== BUS SUARA SENJATA & SKILL: Saturated Bass + Bitcrush + Clipping + Crunch ===== */
  const buildFx = (ac, out) => {
    const inp = ac.createGain(), mix = ac.createGain();
    mix.gain.value = 1.1;
    mix.connect(out);
    const ws = fn => {
      const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++)
        c[i] = fn(i / (n - 1) * 2 - 1); const w = ac.createWaveShaper(); w.curve = c; w.oversample = 'none'; return w;
    };
    const bf = (type, fr, gn, q) => {
      const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = fr; if (gn != null)
        b.gain.value = gn; if (q)
        b.Q.value = q; return b;
    };
    const gx = v => { const n = ac.createGain(); n.gain.value = v; return n; };
    const chain = a => {
      for (let i = 0; i < a.length - 1; i++)
        a[i].connect(a[i + 1]); return a[0];
    };
    // 1) Saturated Bass: pita bass (<240Hz) dijenuhkan keras -> tebal & padat
    inp.connect(chain([bf('lowpass', 240, null, .7), gx(3.2), ws(x => Math.tanh(x * 3)), bf('lowshelf', 110, 5), gx(.85), mix]));
    // 2) Clipping + 3) Bitcrush (kuantisasi ~4-bit) + 4) Crunch (presence tajam & renyah)
    inp.connect(chain([
      gx(2.2), ws(x => Math.max(-.72, Math.min(.72, x * 2.4))), ws(x => Math.round(x * 8) / 8), bf('highpass', 150), bf('peaking', 2800, 8, 1.1), bf('highshelf', 5200, 5), gx(.5), mix
    ]));
    inp.out = mix;
    return inp;
  };
  const init = () => {
    if (ac) {
      if (ac.state == 'suspended')
        ac.resume();
      return;
    }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'balanced' });
    } catch (e) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e2) {
        return;
      }
    }
    ac.onstatechange = () => {
      if (ac.state == 'suspended' || ac.state == 'interrupted')
        ac.resume().catch(() => { });
    };
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && ac.state != 'running')
        ac.resume().catch(() => { });
    });
    const cp = ac.createDynamicsCompressor();
    cp.connect(ac.destination);
    mg = ac.createGain();
    mg.gain.value = on ? .55 : 0;
    mg.connect(cp);
    sg = ac.createGain();
    sg.connect(mg);
    cg = sg;
    try {
      wg = buildFx(ac, mg);
    } catch (e) {
      wg = null;
    }
    cg.gain.value = xv;
    try { swPrep(); } catch (e) { }
    try { dgPrep(); } catch (e) { }
    try { bwPrep(); } catch (e) { }
    if (wg && wg.out)
      wg.out.gain.value = 1.1 * xv;
    mu = ac.createGain();
    mu.gain.value = .3 * vl;
    mu.connect(mg);
    rv = ac.createConvolver();
    const ib = ac.createBuffer(2, ac.sampleRate * 1.4, ac.sampleRate), rw = ac.createGain();
    for (let c = 0; c < 2; c++) {
      const d = ib.getChannelData(c);
      for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.5);
    }
    rv.buffer = ib;
    rw.gain.value = .3;
    sg.connect(rv);
    rv.connect(rw);
    rw.connect(mg);
    oc = ac.createGain();
    oc.gain.value = vl;
    oc.connect(mg);
    oc.connect(rv);
    ml = ac.createGain();
    ml.connect(oc);
    const dl = ac.createDelay(1), fb = ac.createGain();
    dl.delayTime.value = .42;
    fb.gain.value = .38;
    mu.connect(dl);
    dl.connect(fb);
    fb.connect(dl);
    dl.connect(mg);
    nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++)
      d[i] = Math.random() * 2 - 1;
    nt = ac.currentTime + .2;
    setInterval(music, 120);
    bhPrep();
  };
  const env = (gn, t0, v, dur, at) => { gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(v, t0 + at); gn.gain.exponentialRampToValueAtTime(.0001, t0 + dur); };
  const tone = (f0, f1, dur, type, v, dl = 0, dest, at = .008) => {
    if (!ac)
      return; const t0 = ac.currentTime + dl, o = ac.createOscillator(), gn = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); env(gn, t0, v, dur, at); o.connect(gn); gn.connect(dest || sg); o.start(t0); o.stop(t0 + dur + .05);
  };
  const noise = (dur, v, f0, f1, q, type, dl = 0, at = .008) => {
    if (!ac)
      return; const t0 = ac.currentTime + dl, s = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain(); s.buffer = nb; s.loop = true; f.type = type || 'bandpass'; f.Q.value = q || 1; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); env(gn, t0, v, dur, at); s.connect(f); f.connect(gn); gn.connect(sg); s.start(t0); s.stop(t0 + dur + .05);
  };
  const pad = (f, t0, dur) => [f, f * 1.5, f * 2.005].forEach(q => { const o = ac.createOscillator(), gn = ac.createGain(), lp = ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = q; lp.type = 'lowpass'; lp.frequency.value = 380; gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(.09, t0 + dur * .4); gn.gain.linearRampToValueAtTime(0, t0 + dur); o.connect(lp); lp.connect(gn); gn.connect(mu); o.start(t0); o.stop(t0 + dur + .1); });

  function music() {
    if (!ac || !on)
      return;
    if (md == 'menu') {
      menuLoop();
      return;
    }
    if (md != 'game')
      return;
    while (nt < ac.currentTime + .4) {
      const t0 = nt;
      if (st % 8 == 0)
        pad(RT[(st >> 3) % 4], t0, 3.6);
      else if (Math.random() < .45) {
        const f = SC[Math.floor(Math.random() * SC.length)];
        tone(f, f * .99, .5, 'triangle', .12, t0 - ac.currentTime, mu);
      }
      nt += .45;
      st++;
    }
  }

  // ===== Orkestra (strings, brass, timpani, harpa, paduan suara) =====
  const ng = (t0, at, dur, v, d) => { const gn = ac.createGain(); gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(v, t0 + at); gn.gain.setValueAtTime(v, t0 + Math.max(at, dur - at)); gn.gain.linearRampToValueAtTime(0, t0 + dur); gn.connect(d); return gn; };
  const osc = (f, type, t0, dur, dest, det = 0) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det; o.connect(dest); o.start(t0); o.stop(t0 + dur + .1); };
  const str = (f, t0, dur, v, d) => { const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600; lp.connect(ng(t0, Math.min(1.6, dur * .4), dur, v, d || oc));[-9, 0, 8].forEach(c => osc(f, 'sawtooth', t0, dur, lp, c)); osc(f * 2, 'triangle', t0, dur, lp, 3); };
  const brass = (f, t0, dur, v, d) => { const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(300, t0); lp.frequency.linearRampToValueAtTime(1500, t0 + dur * .45); lp.frequency.linearRampToValueAtTime(500, t0 + dur); lp.connect(ng(t0, .18, dur, v, d || oc));[-5, 5].forEach(c => osc(f, 'sawtooth', t0, dur, lp, c)); };
  const bass = (f, t0, dur, v, d) => { const gn = ng(t0, .6, dur, v, d || oc), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.connect(gn); osc(f, 'sawtooth', t0, dur, lp); osc(f, 'sine', t0, dur, gn); };
  const choir = (f, t0, dur, v, d) => { const gn = ng(t0, Math.min(2.2, dur * .4), dur, v, d || oc);[800, 1150].forEach(fc => { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fc; bp.Q.value = 4; bp.connect(gn); osc(f, 'sawtooth', t0, dur, bp, -6); osc(f, 'sawtooth', t0, dur, bp, 6); }); osc(f, 'sine', t0, dur, gn); };
  const timp = (t0, v, f, d) => {
    const o = ac.createOscillator(), gn = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * 2, t0);
    o.frequency.exponentialRampToValueAtTime(f, t0 + .12);
    gn.gain.setValueAtTime(0, t0);
    gn.gain.linearRampToValueAtTime(v, t0 + .005);
    gn.gain.exponentialRampToValueAtTime(.0001, t0 + 1.4);
    o.connect(gn);
    gn.connect(d || oc);
    o.start(t0);
    o.stop(t0 + 1.5);
    const s = ac.createBufferSource(), lp = ac.createBiquadFilter(), g2 = ac.createGain();
    s.buffer = nb;
    s.loop = true;
    lp.type = 'lowpass';
    lp.frequency.value = 300;
    g2.gain.setValueAtTime(v * .6, t0);
    g2.gain.exponentialRampToValueAtTime(.0001, t0 + .15);
    s.connect(lp);
    lp.connect(g2);
    g2.connect(d || oc);
    s.start(t0);
    s.stop(t0 + .2);
  };
  const harp = (f, t0, v, d) => { const gn = ac.createGain(); gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(v, t0 + .005); gn.gain.exponentialRampToValueAtTime(.0001, t0 + 1.6); gn.connect(d || oc); osc(f, 'triangle', t0, 1.6, gn); osc(f * 2, 'sine', t0, 1.6, gn); };
  const cym = (t0, dur, v, d) => { const s = ac.createBufferSource(), hp = ac.createBiquadFilter(), gn = ac.createGain(); s.buffer = nb; s.loop = true; hp.type = 'highpass'; hp.frequency.value = 5000; gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(v, t0 + dur * .8); gn.gain.exponentialRampToValueAtTime(.0001, t0 + dur * 1.8); s.connect(hp); hp.connect(gn); gn.connect(d || oc); s.start(t0); s.stop(t0 + dur * 1.8 + .1); };
  const CH = [
    [110, 164.8, 220, 261.6, 329.6], [87.3, 130.8, 174.6, 220, 261.6], [130.8, 196, 261.6, 329.6, 392], [98, 146.8, 196, 246.9, 293.7]
  ];

  function menuLoop() {
    const now = ac.currentTime;
    if (!mt)
      mt = now + .1;
    while (mt < now + .6) {
      const c = CH[bi % 4], t0 = mt;
      bass(c[0], t0, 4.9, .12, ml);
      c.slice(1).forEach(f => str(f, t0, 5.2, .035, ml));
      if (bi % 4 == 0)
        timp(t0, .2, 65, ml);
      if (bi % 4 == 2)
        brass(c[2], t0, 4, .035, ml);
      if (bi % 4 == 3)
        choir(c[3], t0, 4.8, .03, ml);
      [c[1], c[2], c[3], c[4], c[3], c[2], c[4], c[3]].forEach((f, i) => harp(f * 2, t0 + .3 + i * .55, .05, ml));
      mt += 4.8;
      bi++;
    }
  }

  function bigChord(t0, d) { bass(110, t0, 9, .2, d); bass(55, t0, 9, .16, d);[220, 277.2, 329.6, 440, 554.4].forEach(f => str(f, t0, 8.5, .06, d));[440, 554.4, 659.3].forEach((f, i) => choir(f, t0, 8, .05 - i * .01, d)); brass(220, t0, 4, .1, d); brass(329.6, t0, 4, .08, d); timp(t0, .7, 55, d); timp(t0 + .02, .5, 82, d); cym(t0 - .3, .6, .18, d); }

  function newIg() { ig = ac.createGain(); ig.connect(oc); return ig; }

  function intro() {
    if (!ac)
      return;
    const T = ac.currentTime + .05, d = newIg();
    bass(55, T, 9.5, .16, d);
    [110, 164.8, 220, 261.6].forEach(f => str(f, T, 9, .04, d));
    [2, 2.9, 3.8].forEach(x => timp(T + x, .4, 60, d));
    [220, 261.6, 329.6, 440, 523.3, 659.3].forEach((f, i) => harp(f, T + 2.6 + i * .4, .07, d));
    str(329.6, T + 4, 2.2, .06, d);
    str(440, T + 5.5, 2.5, .06, d);
    str(523.3, T + 7, 2.5, .06, d);
    brass(220, T + 5.5, 2.3, .08, d);
    brass(329.6, T + 5.5, 2.3, .06, d);
    brass(261.6, T + 7.6, 1.8, .08, d);
    brass(392, T + 7.6, 1.8, .06, d);
    for (let i = 0; i < 12; i++)
      timp(T + 6 + i * .25, .18 + i * .03, 60 + (i % 3) * 6, d);
    cym(T + 7.2, 2, .12, d);
    bigChord(T + 9, d);
  }

  /* ===== MUSIK PEMBUKA FANTASI (intro langit → kerajaan → bukit, 12.6 dtk): angin, harpa berkilau, string, paduan suara, terompet & timpani; D-Lydian, selaras dengan teks intro ===== */
  function opening(off = 0) {
    if (!ac)
      return;
    const d = newIg(), now = ac.currentTime, base = now + .05 - off, A = t => base + t;
    const ev = (t, fn) => {
      if (t >= off)
        fn(A(t));
    }; // bunyi pendek
    const sus = (t, dur, fn) => {
      const s0 = Math.max(t, off), r = dur - (s0 - t); if (r > .7)
        fn(A(s0), r);
    }; // nada panjang (ikut masuk di tengah jika audio baru aktif)
    d.gain.setValueAtTime(Math.min(1, off / 1.8), now);
    if (off < 1.8)
      d.gain.linearRampToValueAtTime(1, A(1.8));
    d.gain.setValueAtTime(1, A(11.2));
    d.gain.linearRampToValueAtTime(0, A(13));
    const CHs = [
      [0, 4.2, 73.42, [146.83, 220, 293.66, 369.99]], [4, 3.8, 61.74, [185, 246.94, 293.66, 369.99]], [7.6, 3.2, 98, [196, 246.94, 293.66, 369.99]], [10.6, 3.4, 73.42, [146.83, 220, 293.66, 369.99, 440]]
    ];
    CHs.forEach(c => { sus(c[0], c[1] + .9, (t, r) => bass(c[2], t, r, .11, d)); c[3].forEach(f => sus(c[0], c[1] + .9, (t, r) => str(f, t, r, .034, d))); });
    // angin berhembus di atas awan
    sus(0, 9.5, (t, r) => { const sr = ac.createBufferSource(), bp = ac.createBiquadFilter(), gn = ng(t, r * .45, r, .05, d); sr.buffer = nb; sr.loop = true; bp.type = 'bandpass'; bp.Q.value = .7; bp.frequency.setValueAtTime(350, t); bp.frequency.linearRampToValueAtTime(950, t + r * .5); bp.frequency.linearRampToValueAtTime(400, t + r); sr.connect(bp); bp.connect(gn); sr.start(t); sr.stop(t + r + .1); });
    // harpa naik saat judul muncul, lalu glissando penutup
    [146.83, 220, 293.66, 369.99, 440, 587.33, 739.99, 880].forEach((f, i) => { ev(1 + i * .23, t => harp(f, t, .09, d)); ev(9.7 + i * .12, t => harp(f * 2, t, .05, d)); });
    // kilau lonceng ajaib mengikuti akor
    for (let t = .8, k = 0; t < 11.4; t += .42, k++) {
      const c = CHs.filter(x => t >= x[0]).pop(), n = c[3][(k * 3 + (k >> 2)) % c[3].length] * [4, 2, 4, 4][k % 4];
      ev(t, T0 => harp(n, T0, .032 + (k % 4 == 0 ? .02 : 0), d));
    }
    // paduan suara (aah) naik bersama narasi
    sus(1.2, 3.4, (t, r) => choir(293.66, t, r, .018, d));
    sus(4.4, 3.6, (t, r) => { choir(369.99, t, r, .035, d); choir(293.66, t, r, .03, d); });
    sus(7.8, 3.2, (t, r) => { choir(392, t, r, .035, d); choir(293.66, t, r, .03, d); });
    sus(10.4, 2.6, (t, r) => { choir(440, t, r, .04, d); choir(587.33, t, r, .035, d); choir(739.99, t, r, .03, d); });
    // terompet heroik & timpani di tiap kalimat narasi
    sus(5, 2.2, (t, r) => { brass(293.66, t, r, .05, d); brass(440, t, r, .03, d); });
    sus(7.6, 2.4, (t, r) => { brass(392, t, r, .045, d); brass(293.66, t, r, .03, d); });
    sus(10.5, 2.2, (t, r) => { brass(293.66, t, r, .05, d); brass(369.99, t, r, .035, d); });
    ev(4.9, t => timp(t, .26, 73.42, d));
    ev(7.5, t => timp(t, .28, 73.42, d));
    ev(10.5, t => { timp(t, .36, 73.42, d); timp(t + .02, .2, 110, d); });
    ev(4.8, t => cym(t, 1, .035, d));
    ev(10.3, t => cym(t, 1.6, .06, d));
  }

  function cut(tau = .12) {
    if (ac && ig) {
      ig.gain.setTargetAtTime(0, ac.currentTime, tau);
    } ig = null;
  }

  // ===== SFX gameplay engine v2: layered synthesis, pan/pitch variety, SFX-bus compressor+saturation, big reverb =====
  const rnd = Math.random, DC = new Float32Array(257);
  for (let i = 0; i < 257; i++)
    DC[i] = Math.tanh((i / 128 - 1) * 4);
  let xb, xw, pb, vq = [];
  const lim = {};

  // ===== OPTIMASI: batas voice, panner bersama, disconnect otomatis, reverb lebih ringan =====
  const LOW = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent), VMAX = LOW ? 22 : 38;
  const skip = v => { const n = ac.currentTime; vq = vq.filter(t => t > n); const c = vq.length; return c >= VMAX * 1.5 ? v < .4 : c >= VMAX && v < .15; };
  const X = () => {
    if (xb)
      return;
    const c = ac.createDynamicsCompressor();
    c.threshold.value = -14;
    c.knee.value = 8;
    c.ratio.value = 5;
    c.attack.value = .002;
    c.release.value = .12;
    const sh = ac.createWaveShaper(), cv = new Float32Array(257);
    for (let i = 0; i < 257; i++)
      cv[i] = Math.tanh((i / 128 - 1) * 1.5) / Math.tanh(1.5);
    sh.curve = cv;
    xb = ac.createGain();
    xb.connect(sh);
    sh.connect(c);
    c.connect(sg);
    const n = ac.sampleRate * (LOW ? .9 : 1.4) | 0, ib = ac.createBuffer(2, n, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ib.getChannelData(ch);
      for (let i = 0; i < n; i++)
        d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / n, 3);
    }
    const r2 = ac.createConvolver(), wg = ac.createGain();
    r2.buffer = ib;
    wg.gain.value = .6;
    xw = ac.createGain();
    xw.connect(r2);
    r2.connect(wg);
    xr = ac.createGain();
    xr.gain.value = xv;
    wg.connect(xr);
    xr.connect(mg);
    pb = [-.85, -.45, 0, .45, .85].map(v => { const p = ac.createStereoPanner(); p.pan.value = v; p.connect(xb); return p; });
  };
  const fin = (n, o) => {
    const k = o.pan != null ? o.pan : (rnd() - .5) * .3; n.connect(pb[Math.max(0, Math.min(4, Math.round((k + 1) * 2)))]); if (o.send) {
      const s = ac.createGain();
      s.gain.value = o.send;
      n.connect(s);
      s.connect(xw);
      return s;
    } return null;
  };
  const T = (f0, f1, dur, type, v, dl = 0, o = {}) => {
    if (!ac || !on || skip(v))
      return;
    X();
    const t0 = ac.currentTime + dl, os = ac.createOscillator(), gn = ac.createGain(), q = o.nj ? 1 : 1 + (rnd() - .5) * .07;
    vq.push(t0 + dur + .05);
    os.type = type;
    os.frequency.setValueAtTime(f0 * q, t0);
    os.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * q), t0 + dur);
    gn.gain.setValueAtTime(0, t0);
    gn.gain.linearRampToValueAtTime(v, t0 + (o.at || .003));
    gn.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    let f = null;
    if (o.lp) {
      f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lp;
      os.connect(f);
      f.connect(gn);
    } else
      os.connect(gn);
    const sn = fin(gn, o);
    os.onended = () => {
      try {
        os.disconnect();
        f && f.disconnect();
        gn.disconnect();
        sn && sn.disconnect();
      } catch (e) { }
    };
    os.start(t0);
    os.stop(t0 + dur + .05);
  };
  const N = (dur, v, f0, f1, q, type, dl = 0, o = {}) => {
    if (!ac || !on || skip(v))
      return;
    X();
    const t0 = ac.currentTime + dl, s = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
    vq.push(t0 + dur + .05);
    s.buffer = nb;
    s.loop = true;
    f.type = type || 'bandpass';
    f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t0);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    let h = f, w = null;
    if (o.dist) {
      w = ac.createWaveShaper();
      w.curve = DC;
      f.connect(w);
      h = w;
    }
    gn.gain.setValueAtTime(0, t0);
    gn.gain.linearRampToValueAtTime(v, t0 + (o.at || .002));
    gn.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    s.connect(f);
    h.connect(gn);
    const sn = fin(gn, o);
    s.onended = () => {
      try {
        s.disconnect();
        f.disconnect();
        w && w.disconnect();
        gn.disconnect();
        sn && sn.disconnect();
      } catch (e) { }
    };
    s.start(t0, rnd() * .9);
    s.stop(t0 + dur + .05);
  };
  const RING = (f, v, d, dl = 0, o = {}) => [1, 2.76, 5.4, 8.9].forEach((m, i) => T(f * m, f * m * .99, d / (1 + i * .5), 'sine', v / (1 + i * .9), dl, o));
  const CK = (v, dl = 0) => N(.025, v, 4000, 9000, .7, 'highpass', dl, { at: .0006 });
  const FM = (f0, f1, dur, v, a, b, dl = 0) => {
    if (!ac || !on)
      return; X(); const t0 = ac.currentTime + dl, os = ac.createOscillator(), gn = ac.createGain(); os.type = 'sawtooth'; os.frequency.setValueAtTime(f0, t0); os.frequency.exponentialRampToValueAtTime(f1, t0 + dur); gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(v, t0 + .02); gn.gain.exponentialRampToValueAtTime(.0001, t0 + dur);[a, b].forEach(fr => { const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fr; f.Q.value = 5; os.connect(f); f.connect(gn); }); fin(gn, {}); os.start(t0); os.stop(t0 + dur + .05);
  };
  const gt = (k, w, m) => {
    const n = ac.currentTime, a = lim[k] = (lim[k] || []).filter(t => n - t < w); if (a.length >= m)
      return false; a.push(n); return true;
  };
  const arp = (fs, v, gap, d = .5) => fs.forEach((f, i) => { T(f, f, d, 'triangle', v, i * gap, { send: .35 }); T(f * 2, f * 2, d * .8, 'sine', v * .35, i * gap); });
  // ledakan hampir nyata: crack -> sub boom -> badan blast ter-distorsi -> rumble ekor -> pecahan puing
  const EXP = (z, fire) => {
    CK(.55 * z);
    N(.05, .5 * z, 7000, 900, .8, 'bandpass', 0, { at: .0008, dist: 1 });
    T(115, 26, 1.1 * z, 'sine', .75 * z, 0, { send: .3 });
    T(62, 22, 1.5 * z, 'sine', .5 * z, .03);
    N(.9 * z, .55 * z, 2800, 110, .6, 'lowpass', 0, { at: .004, dist: 1, send: .6 });
    N(1.7 * z, .25 * z, 520, 55, .5, 'lowpass', .06, { at: .06, send: .8 });
    N(.4, .3 * z, 1600, 260, 1, 'bandpass', .03, { dist: 1 });
    for (let i = 0; i < 10; i++)
      N(.03 + rnd() * .04, .1 * z * (.4 + rnd()), 2500 + rnd() * 3500, 900, 2, 'bandpass', .1 + rnd() * .8 * z, { pan: rnd() * 2 - 1, at: .001 });
    if (fire)
      N(.9 * z, .22 * z, 700, 3800, .8, 'bandpass', .04, { at: .18, send: .4 });
  };
  const arrow = (v = 1) => {
    CK(.35 * v);
    N(.04, .55 * v, 500, 2600, 1.2, 'bandpass', 0, { at: .0008 });
    [[250, .2], [500, .12], [750, .07], [1000, .045]].forEach(([f, a], i) => T(f, f * .985, .32 / (1 + i * .4), 'triangle', a * v, 0, { at: .0008 }));
    T(130, 55, .12, 'sine', .38 * v);
    N(.3, .26 * v, 5200, 1300, 3.5, 'bandpass', .015, { at: .03, pan: (rnd() - .5) * .8 });
    N(.18, .12 * v, 9000, 3500, 1, 'highpass', .03, { at: .02 });
    RING(2600, .025 * v, .18, .005);
  };

  // ===== SFX v3 "EPIC": suara berlapis (sub-bass + badan + retakan + logam + udara + reverb) & orkestra untuk momen besar =====
  const SUB = (f0, f1, dur, v, dl = 0, o = {}) => { T(f0, f1, dur, 'sine', v, dl, Object.assign({ at: .002, send: .25 }, o)); T(f0 * 2, f1 * 2, dur * .6, 'triangle', v * .35, dl, { at: .002 }); };
  const WHSH = (dur, v, f0, f1, dl = 0, pan) => { const p0 = pan != null ? pan : (rnd() - .5) * .8; N(dur, v, f0, f1, 1.6, 'bandpass', dl, { at: dur * .35, pan: p0, send: .25 }); N(dur * .8, v * .5, f0 * 2.2, f1 * 1.8, 2.4, 'bandpass', dl + dur * .08, { at: dur * .3, pan: p0 }); N(dur * .7, v * .25, 6000, 11000, .8, 'highpass', dl + dur * .1, { at: dur * .3, pan: p0 }); };
  const BELL = (f, v, d, dl = 0, o = {}) => [[1, 1], [2.01, .55], [2.76, .38], [4.07, .22], [5.43, .14]].forEach(([m, a], i) => T(f * m, f * m * .998, d / (1 + i * .35), 'sine', v * a, dl, Object.assign({ send: .45 }, o)));
  const SHING = (f, v, dl = 0, d = .4) => { T(f * .6, f * 1.6, .09, 'triangle', v * 1.4, dl, { at: .004, lp: 9000 }); BELL(f, v, d, dl + .03, { send: .35 }); N(.05, v * 8, 3500, 11000, 2.5, 'bandpass', dl, { at: .0005 }); };
  const PWR = (f, v, d, dl = 0, lpf = 1800) => [.5, 1, 1.5, 2].forEach((m, i) => { T(f * m, f * m, d, 'sawtooth', v / (1 + i * .5), dl, { at: d * .12, lp: lpf, send: .5 }); T(f * m * 1.007, f * m * 1.007, d, 'sawtooth', v / (1 + i * .5) * .7, dl, { at: d * .12, lp: lpf, send: .5 }); });
  const HORN = (f, v, d, dl = 0) => { T(f, f, d, 'sawtooth', v, dl, { at: .03, lp: 2200, send: .45 }); T(f * 1.004, f * 1.004, d, 'sawtooth', v * .6, dl, { at: .03, lp: 2200, send: .45 }); T(f * 2, f * 2, d * .8, 'square', v * .22, dl, { at: .03, lp: 3000 }); };
  const IMP = (z, dl = 0) => { CK(.5 * z, dl); N(.05, .55 * z, 5200, 900, 1.1, 'bandpass', dl, { at: .0006, dist: 1 }); N(.09, .4 * z, 1400, 220, .9, 'bandpass', dl + .004, { dist: 1, send: .15 }); SUB(150, 42, .22 + .1 * z, .55 * z, dl); };
  const FIRE = (dur, v, dl = 0) => {
    N(dur, v, 500, 2600, .9, 'bandpass', dl, { at: dur * .25, send: .4, dist: 1 }); N(dur * 1.1, v * .8, 900, 140, .8, 'lowpass', dl, { at: dur * .15, send: .5 }); for (let i = 0; i < Math.ceil(dur * 12); i++)
      N(.04 + rnd() * .05, v * .35, 2500 + rnd() * 4000, 1800, 2.5, 'highpass', dl + rnd() * dur, { at: .002, pan: rnd() * 2 - 1 });
  };
  const ZAP = (dur, v, dl = 0, n = 5) => {
    for (let i = 0; i < n; i++) {
      const t0 = dl + i * dur / n + rnd() * .03;
      T(2400 + rnd() * 3000, 400 + rnd() * 500, .07, 'sawtooth', v * .5, t0, { lp: 6000, pan: rnd() * 2 - 1 });
      N(.05, v * .5, 4000, 9000, 2, 'highpass', t0, { at: .001 });
    }
  };
  const SHIM = (fs, v, gap, dl = 0, d = .9) => fs.forEach((f, i) => BELL(f, v, d, dl + i * gap));
  const TWANG = (v = 1, dl = 0, pan) => {
    const o = pan != null ? { pan } : {};
    N(.012, .5 * v, 3000, 8000, 1, 'highpass', dl, Object.assign({ at: .0004 }, o));
    [[196, .26], [392, .15], [588, .09], [784, .06], [1176, .04]].forEach(([f, a], i) => T(f * 1.04, f * .99, .34 / (1 + i * .45), 'triangle', a * v, dl, Object.assign({ at: .0008, send: .25 }, o)));
    T(120, 50, .1, 'sine', .35 * v, dl, o);
    N(.3, .26 * v, 5200, 1200, 3.5, 'bandpass', dl + .012, Object.assign({ at: .03 }, o));
    N(.2, .12 * v, 9000, 3500, 1, 'highpass', dl + .03, Object.assign({ at: .02 }, o));
  };
  const ORB = (v = 1, dl = 0) => { T(220, 1500, .32, 'sawtooth', .06 * v, dl, { lp: 2600, at: .06, send: .4 }); T(440, 3000, .3, 'sine', .07 * v, dl, { at: .05, send: .5 }); N(.34, .28 * v, 2000, 9500, 2, 'bandpass', dl, { at: .06, send: .4 }); SUB(95, 40, .3, .45 * v, dl + .05); BELL(880 + rnd() * 120, .05 * v, .7, dl + .06, { send: .6 }); ZAP(.12, .18 * v, dl + .04, 3); };
  const BLAST = (z, dl = 0, fire = 0) => {
    CK(.6 * z, dl);
    N(.05, .55 * z, 7500, 900, .8, 'bandpass', dl, { at: .0008, dist: 1 });
    SUB(120, 24, 1.2 * z, .85 * z, dl);
    T(62, 20, 1.6 * z, 'sine', .55 * z, dl + .03, { send: .4 });
    N(.9 * z, .6 * z, 2800, 100, .6, 'lowpass', dl, { at: .004, dist: 1, send: .6 });
    N(1.8 * z, .28 * z, 520, 50, .5, 'lowpass', dl + .06, { at: .06, send: .8 });
    N(.4, .32 * z, 1600, 240, 1, 'bandpass', dl + .03, { dist: 1 });
    T(220, 70, .35 * z, 'sawtooth', .18 * z, dl, { lp: 900, at: .002 });
    for (let i = 0; i < 12; i++)
      N(.03 + rnd() * .05, .11 * z * (.4 + rnd()), 2500 + rnd() * 3500, 900, 2, 'bandpass', dl + .1 + rnd() * .9 * z, { pan: rnd() * 2 - 1, at: .001 });
    if (fire)
      FIRE(.9 * z, .22 * z, dl + .04);
  };
  let ob;
  const OB = () => {
    X(); if (!ob) {
      ob = ac.createGain();
      ob.gain.value = 1;
      ob.connect(xb);
      const s = ac.createGain();
      s.gain.value = .5;
      ob.connect(s);
      s.connect(xw);
    } return ob;
  };
  const ORC = {
    timp: (dl, v, f) => {
      if (ac && on)
        timp(ac.currentTime + dl, v, f, OB());
    },
    choir: (f, dl, dur, v) => {
      if (ac && on)
        choir(f, ac.currentTime + dl, dur, v, OB());
    },
    str: (f, dl, dur, v) => {
      if (ac && on)
        str(f, ac.currentTime + dl, dur, v, OB());
    },
    harp: (f, dl, v) => {
      if (ac && on)
        harp(f, ac.currentTime + dl, v, OB());
    },
    cym: (dl, dur, v) => {
      if (ac && on)
        cym(ac.currentTime + dl, dur, v, OB());
    }
  };

  // ===== Pemilih suara berdasarkan pengaturan GRAFIK: PC/LAPTOP = suara epik baru, HP/MOBILE = suara awal =====
  const OLDM = {
    swing(w) {
      if (w == 4) {
        N(.07, .4, 3000, 9000, 2, 'bandpass', 0, { at: .01 });
        N(.07, .4, 3500, 9000, 2, 'bandpass', .06, { at: .01 });
        CK(.15, .12);
      } else if (w == 1) {
        CK(.22);
        N(.075, .5, 1800, 8500, 3.2, 'bandpass', 0, { at: .006 });
        N(.05, .28, 7000, 12000, 1.1, 'highpass', .01, { at: .002 });
        T(1300, 4600, .07, 'triangle', .07, 0, { at: .004, lp: 7000 });
        RING(3600, .035, .12, .05);
      } else {
        N(.17, .55, 600, 6000, 1.8, 'bandpass', 0, { at: .025 });
        N(.12, .25, 3500, 10000, .8, 'highpass', .03, { at: .01 });
        RING(w == 0 ? 2600 : 2000, .05, .28, .04);
      }
    },
    chop() { N(.15, .5, 500, 4500, 1.6, 'bandpass', 0, { at: .02 }); CK(.3, .05); T(150, 50, .14, 'sine', .5, .05); RING(1700, .07, .3, .05); },
    shot(a) {
      if (a) {
        N(.28, .3, 2000, 9000, 2, 'bandpass', 0, { at: .05 });
        T(280, 1300, .3, 'sawtooth', .07, 0, { lp: 2500 });
        T(90, 40, .25, 'sine', .4);
        RING(2100, .04, .4, .03, { send: .4 });
      } else
        arrow();
    },
    eshot() { arrow(.65); },
    fireball() {
      if (!ac)
        return;
      noise(.38, .26, 350, 2600, 1.1, 'bandpass', 0, .03);
      noise(.5, .2, 1100, 160, .8, 'lowpass', 0, .02);
      tone(190, 55, .45, 'sawtooth', .13, 0, undefined, .02);
      tone(900, 140, .26, 'sine', .1, 0, undefined, .004);
      for (let i = 0; i < 6; i++)
        noise(.05 + Math.random() * .05, .07, 3200 + Math.random() * 3000, 2200, 2, 'highpass', .04 + i * .055 + Math.random() * .03, .002);
    },
    hit(c) {
      if (!ac || !gt('h', .06, 3))
        return;
      const w = typeof wi == 'number' ? wi : 0, k = 1 - (lim.h.length - 1) * .22;
      CK(.4 * k);
      T(190, 60, .12, 'sine', .5 * k);
      if (w == 2) {
        T(330, 110, .09, 'triangle', .55 * k);
        N(.045, .5 * k, 1300, 350, 1, 'bandpass');
        N(.03, .45 * k, 3500, 8000, 1, 'bandpass', 0, { at: .0006 });
        T(1600, 900, .1, 'triangle', .08 * k);
        N(.12, .2 * k, 800, 200, .8, 'lowpass', .01, { dist: 1 });
        RING(2400, .04 * k, .22, .01);
      } else if (w == 3) {
        N(.18, .45 * k, 1500, 6000, 3, 'bandpass', 0, { dist: 1 });
        T(900, 2400, .12, 'sawtooth', .1 * k, 0, { lp: 3000 });
        T(200, 50, .2, 'sine', .4 * k);
        RING(3200, .04 * k, .3, .02);
      } else if (w == 1) {
        T(220, 80, .09, 'sine', .5 * k);
        N(.03, .6 * k, 4200, 1400, 2.5, 'bandpass', 0, { at: .0005 });
        N(.022, .4 * k, 7500, 11000, 1, 'highpass', 0, { at: .0004 });
        T(2000, 1200, .05, 'triangle', .08 * k);
        RING(3400, .07 * k, .18, .004);
      } else {
        N(.07, .5 * k, 2500, 7000, 1.2, 'bandpass');
        N(.06, .35 * k, 900, 300, 1, 'bandpass', .01, { dist: 1 });
        RING((w == 4 ? 3600 : 1800) + rnd() * 400, .09 * k, w == 4 ? .2 : .35);
      }
      if (c) {
        T(80, 30, .35, 'sine', .6);
        RING(1400, .12, .6, .01, { send: .3 });
        N(.25, .35, 5000, 800, .8, 'bandpass', 0, { send: .4 });
        CK(.6);
      }
    },
    boom(r) { EXP(Math.max(.7, Math.min(1.3, .7 + (r || 40) / 70)), 0); RING(1300, .05, .7, .02, { send: .5 }); T(900, 150, .5, 'sine', .06, .03, { send: .5 }); },
    slam() { EXP(1.35, 1); T(70, 28, 1, 'sine', .5, .05, { send: .4 }); RING(700, .06, .9, .05, { send: .5 }); },
    warn(k) {
      if (k == 0) {
        T(150, 620, .6, 'sawtooth', .05, 0, { at: .3, lp: 1800 });
        N(.6, .12, 300, 3000, 1.5, 'bandpass', 0, { at: .4 });
        T(390, 930, .6, 'sine', .05, 0, { at: .3 });
      } else {
        N(.5, .12, 300, 900, 2, 'bandpass', 0, { at: .3 });
        T(200, 320, .5, 'triangle', .05, 0, { at: .3 });
      }
    },
    stagger() { CK(.5); N(.25, .4, 6000, 1500, 1, 'bandpass'); RING(1700, .1, .5); T(300, 120, .15, 'sine', .4); },
    die() {
      N(.3, .4, 3500, 400, .9, 'bandpass', 0, { dist: 1 }); for (let i = 0; i < 6; i++)
        T(800 + rnd() * 1700, 500, .04, 'square', .05, .02 + rnd() * .25); T(240, 50, .35, 'triangle', .25); T(1200, 200, .5, 'sine', .07, .02, { send: .4 });
    },
    pain() { T(170, 60, .22, 'sine', .6); CK(.3); N(.15, .4, 900, 180, .8, 'lowpass'); FM(150, 95, .25, .18, 700, 1150); },
    death() { FM(120, 40, 1.2, .25, 500, 900); T(55, 35, 1.4, 'sine', .5, 0, { send: .5 }); N(1.2, .25, 200, 2200, 1, 'bandpass', 0, { at: .8, send: .6 }); T(60, 40, .2, 'sine', .5, .25); T(60, 40, .2, 'sine', .45, .55); },
    dodge() { N(.2, .3, 500, 3500, .8, 'bandpass', 0, { at: .06 }); N(.12, .2, 200, 900, 1, 'lowpass', .02); N(.06, .25, 800, 200, 1, 'lowpass', .1); },
    skill(i) {
      const w = typeof wi == 'number' ? wi : 0;
      N(.3 + .1 * (i | 0), .32, 400, 5000, 1.4, 'bandpass', 0, { at: .12 });
      T(200, 800 * (1 + (i | 0) * .5), .3, 'triangle', .12);
      if (w == 0)
        RING(2400, .07, .5, .05);
      else if (w == 1) {
        CK(.35);
        N(.14, .32, 2600, 10000, 3.5, 'bandpass', .015, { at: .004 });
        T(1400, 4800, .12, 'triangle', .07, .01, { lp: 7000 });
        RING(3200, .05, .24, .05);
        RING(4300, .03, .16, .09);
      } else if (w == 2) {
        CK(.3);
        N(.04, .5, 500, 2600, 1.2, 'bandpass', 0, { at: .001 });
        [250, 500, 750].forEach((f, k) => T(f, f * .98, .45 / (1 + k * .4), 'triangle', .16 / (1 + k * .6), 0, { at: .001, send: .25 }));
        N(.25, .2, 5000, 1500, 3, 'bandpass', .03);
      } else if (w == 3) {
        [0, .04, .08].forEach((d, k) => T(900 * (1 + k * .5), 2400, .4, 'sine', .07, d, { send: .4 }));
      } else
        T(75, 50, .3, 'sine', .4);
      if (i == 2) {
        T(70, 30, .6, 'sine', .5, .05, { send: .4 });
        RING(1500, .08, .8, .05, { send: .5 });
      }
    },
    focus() { arp([440, 554, 659, 880], .12, .06); N(.4, .2, 600, 6000, 1.2, 'bandpass', 0, { at: .2 }); T(60, 120, .3, 'sine', .3); },
    potion() {
      for (let i = 0; i < 4; i++)
        T(350 + rnd() * 150 + i * 60, 600 + i * 80, .07, 'sine', .2, i * .06); RING(1800, .05, .4, .28, { send: .3 });
    },
    pickup() { T(1200, 1200, .25, 'sine', .14, 0, { send: .3 }); T(1800, 1800, .3, 'sine', .1, .06); T(2400, 2400, .35, 'sine', .05, .1); },
    ready() { CK(.3); T(1500, 1500, .12, 'sine', .18); T(2250, 2250, .15, 'sine', .12, .05); },
    point() { T(1318, 1318, .1, 'square', .07); T(1760, 1760, .25, 'square', .07, .07); RING(2800, .03, .3, .07); },
    sw() { CK(.25); N(.08, .2, 1500, 4000, 1, 'bandpass'); T(500, 700, .05, 'triangle', .08); RING(3000, .03, .15); },
    level() { arp([523, 659, 784, 1047, 1319], .16, .09, .55); N(.8, .1, 3000, 9000, .8, 'highpass', .1, { at: .3 }); T(131, 131, .9, 'sine', .2, 0, { send: .4 }); },
    clear() { arp([392, 494, 587, 784], .16, .1, .55); T(98, 98, .8, 'sine', .25, .1, { send: .4 }); },
    door() { N(1, .5, 300, 100, 1, 'bandpass', 0, { at: .1, send: .5 }); N(.9, .25, 1200, 300, 3, 'bandpass', .05, { dist: 1 }); T(55, 38, 1, 'sine', .5); T(70, 30, .4, 'sine', .5, .9); N(.2, .3, 2000, 200, 1, 'lowpass', .9, { send: .4 }); },
    wave() { T(110, 110, .9, 'sawtooth', .12, 0, { lp: 700, at: .05, send: .4 }); T(165, 165, .9, 'sawtooth', .09, 0, { lp: 900, at: .05 }); T(70, 35, .3, 'sine', .5); T(70, 35, .3, 'sine', .45, .35); },
    summon() { [300, 450, 600].forEach((f, i) => T(f, f * 3, .8, 'sine', .05, i * .05, { at: .4, send: .4 })); N(.8, .06, 500, 6000, 1.5, 'bandpass', 0, { at: .45, send: .3 }); },
    appear() { T(140, 40, .4, 'sine', .5); CK(.3); RING(2200, .06, .5, 0, { send: .4 }); N(.2, .2, 3000, 500, 1, 'bandpass', 0, { dist: 1 }); },
    ultReady() { /* lembut & hangat: tiga nada sine naik (G-C-E) + gemuruh rendah, tanpa lonceng/desis tinggi */ if (!ac || !on)
      return; T(392, 392, .7, 'sine', .07, 0, { at: .08, lp: 1600, send: .35, nj: 1 }); T(523.25, 523.25, .8, 'sine', .07, .11, { at: .1, lp: 1600, send: .4, nj: 1 }); T(659.25, 659.25, 1, 'sine', .055, .22, { at: .12, lp: 1900, send: .5, nj: 1 }); T(98, 131, .7, 'sine', .2, 0, { at: .1, send: .3, nj: 1 });
    },
    ult(i) { N(1.3, .45, 200, 7000, 1.2, 'bandpass', 0, { at: .55, send: .6 }); T(55, 26, 1.6, 'sine', .75, 0, { send: .5 }); T(110, 520, .9, 'sawtooth', .08, 0, { lp: 2200, at: .45, send: .4 }); RING(900, .09, 1.2, .3, { send: .6 }); arp([392, 523, 659, 784, 1047, 1319], .12, .06, .9); T(70, 28, .8, 'sine', .6, .5, { send: .5 }); },
    /* ===== ritme basic attack (bow & staff): w=senjata, n=hit ke (0..2), k=urutan tembakan dalam hit ===== */
    beat(w, n, k) {
      const sc = [523.25, 659.25, 784, 1046.5], f = sc[n == 1 ? (k ? 2 : 1) : n == 2 ? 3 : 0] * (w == 3 ? .5 : 1);
      if (w == 2) {
        T(f, f * .985, .2 + n * .08, 'triangle', .09 + n * .02, 0, { send: .3 });
        T(f * 2, f * 2, .12, 'sine', .035, 0);
        if (n == 2) {
          T(f * .5, f * .5, .4, 'triangle', .07, .02, { send: .4 });
          RING(f * 2, .03, .5, .02, { send: .5 });
        }
      } else {
        T(f, f * 1.01, .3 + n * .1, 'sine', .1 + n * .02, 0, { send: .45 });
        T(f * 2.005, f * 2, .22, 'triangle', .04, 0, { send: .3 });
        if (n == 2) {
          arp([f * .5, f * .75, f], .05, .035, .5);
          RING(f * 2, .04, .7, .04, { send: .6 });
        }
      }
    },
    charge(w) {
      if (w == 2) {
        T(260, 980, .26, 'triangle', .05, 0, { at: .12, lp: 3000 });
        N(.26, .08, 800, 4500, 2, 'bandpass', 0, { at: .2 });
      } else {
        T(180, 760, .3, 'sine', .08, 0, { at: .2, send: .4 });
        T(360, 1520, .3, 'triangle', .03, 0, { at: .22, send: .3 });
        N(.3, .06, 400, 5000, 1.4, 'bandpass', 0, { at: .24, send: .3 });
      }
    },
    /* ===== black hole (ultimate staff) ===== */
    bhOpen() { T(38, 120, 1.4, 'sine', .55, 0, { at: .5, send: .5 }); T(76, 240, 1.4, 'sawtooth', .05, 0, { at: .6, lp: 900, send: .5 }); N(1.2, .25, 120, 2400, 1.2, 'bandpass', 0, { at: .7, send: .6 }); RING(300, .05, 1.2, .2, { send: .6 }); },
    bhPulse(k) { T(48 + 30 * k, 30, .45, 'sine', .35, 0, { send: .4 }); N(.3, .12, 200 + 800 * k, 80, 1, 'lowpass', 0, { at: .02, send: .5 }); },
    bhCollapse() { T(90, 2400, .6, 'sawtooth', .09, 0, { lp: 3500, at: .5, send: .4 }); T(45, 400, .6, 'sine', .5, 0, { at: .5 }); N(.6, .3, 200, 9000, 1.5, 'bandpass', 0, { at: .55, send: .6 }); },
    bhBlast() { EXP(1.9, 1); T(60, 20, 2.2, 'sine', .8, .02, { send: .6 }); RING(500, .08, 1.6, .05, { send: .7 }); N(1.4, .35, 9000, 200, .8, 'highpass', .02, { at: .02, send: .5 }); arp([196, 261.6, 329.6, 392, 523.25], .1, .05, 1.2); }
  };
  const NEWM = {
    swing(w, hn) {
      if (!ac || !on)
        return;
      const b = hn == 2 ? 1 : 0, z = b ? 1.4 : 1, a2 = hn == 1 ? -1 : 1;
      if (w == 4) {
        WHSH(.075 * z, .4, 3000, 9500, 0, -.4 * a2);
        WHSH(.075 * z, .36, 3600, 9500, .055, .4 * a2);
        CK(.2, .004);
        BELL(4200, .025, .16, .01, { send: .2 });
        if (b) {
          WHSH(.24, .5, 1200, 7500, .02);
          SUB(120, 46, .22, .4, .06);
          SHING(3000, .05, .1, .4);
        }
      } else if (w == 1) {
        CK(.26);
        WHSH(.09 * z, .6, 1800, 9000, 0, .2 * a2);
        T(1300, 5200, .06, 'triangle', .09, 0, { at: .004, lp: 7500 });
        BELL(3600, .035, .2, .04, { send: .3 });
        if (b) {
          SUB(100, 36, .38, .55, .06);
          WHSH(.32, .5, 500, 6500, .1);
          BELL(2400, .06, .8, .12, { send: .5 });
        } else if (hn == 1)
          WHSH(.15, .32, 900, 5200, 0, -.5);
      } else {
        WHSH(.17 * z, .62, 500, 6200, 0, .3 * a2);
        N(.12, .3, 3500, 10000, .8, 'highpass', .03, { at: .01 });
        SHING(2600 - (hn == 1 ? 300 : 0), .05, .035, .4);
        if (b) {
          SUB(90, 30, .45, .65, .05);
          WHSH(.4, .45, 250, 3800, .02, 0);
          BELL(1500, .07, 1, .08, { send: .6 });
          N(.3, .2, 800, 150, .8, 'lowpass', .05, { send: .5 });
        }
      }
    },
    chop() {
      if (!ac || !on)
        return; WHSH(.16, .55, 400, 3800, 0); IMP(.95, .05); BELL(1300, .05, .45, .05, { send: .4 }); N(.18, .22, 700, 160, .8, 'lowpass', .05, { dist: 1, send: .3 });
    },
    shot(a) {
      if (!ac || !on)
        return; if (a)
        ORB(1, 0);
      else {
        TWANG(1, 0);
        RING(2600, .025, .18, .005);
      }
    },
    eshot() {
      if (!ac || !on)
        return; T(520, 1800, .22, 'sawtooth', .07, 0, { lp: 3200, at: .03, send: .4 }); T(260, 900, .22, 'sine', .08, 0, { at: .03, send: .5 }); N(.22, .2, 1500, 6000, 2, 'bandpass', 0, { at: .03, send: .35 }); ZAP(.1, .15, .02, 3); BELL(1100, .035, .4, .05, { send: .5 });
    },
    fireball() {
      if (!ac || !on)
        return; FIRE(.5, .34, 0); T(190, 55, .5, 'sawtooth', .14, 0, { lp: 1200, at: .02, send: .3 }); T(900, 140, .26, 'sine', .1, 0, { at: .004 }); SUB(80, 36, .4, .4);
    },
    hit(c, kind) {
      if (!ac || !on || !gt('h', .06, 3))
        return;
      X();
      const w = typeof wi == 'number' ? wi : 0, k = 1 - (lim.h.length - 1) * .22;
      IMP(.8 * k);
      if (w == 0) {
        N(.06, .45 * k, 3000, 9000, 2.5, 'bandpass', 0, { at: .0005, dist: 1 });
        BELL(2100 + rnd() * 500, .06 * k, .35);
        T(320, 120, .1, 'triangle', .35 * k);
      } else if (w == 1) {
        N(.025, .6 * k, 5000, 12000, 1, 'highpass', 0, { at: .0004 });
        T(2400, 1200, .06, 'triangle', .1 * k);
        BELL(3300, .05 * k, .25);
        SUB(200, 70, .12, .4 * k);
      } else if (w == 2) {
        T(260, 90, .1, 'triangle', .5 * k);
        N(.05, .4 * k, 1800, 500, 1, 'bandpass');
        T(1400, 800, .06, 'square', .04 * k, 0, { lp: 3000 });
      } else if (w == 3) {
        T(700, 200, .18, 'sine', .2 * k, 0, { send: .5 });
        N(.15, .25 * k, 6000, 1200, 1.5, 'bandpass', 0, { send: .5 });
        BELL(1500 + rnd() * 300, .05 * k, .5);
      } else {
        N(.035, .5 * k, 4500, 10000, 2, 'bandpass', 0, { at: .0004 });
        N(.035, .4 * k, 3500, 9000, 2, 'bandpass', .03, { at: .0004 });
        BELL(3800, .04 * k, .15);
      }
      if (kind == 'slime') {
        T(380, 110, .16, 'sine', .3 * k, 0, { send: .2 });
        N(.14, .3 * k, 900, 200, 2.5, 'bandpass', 0, { at: .01 });
        T(180, 320, .08, 'sine', .15 * k, .06);
      } else if (kind == 'skel') {
        N(.02, .5 * k, 3000, 6000, 3, 'bandpass', 0, { at: .0004 });
        T(900, 420, .05, 'triangle', .18 * k);
        N(.015, .3 * k, 4000, 7000, 3, 'bandpass', .035, { at: .0004 });
      } else if (kind == 'mage') {
        T(500, 160, .2, 'sine', .2 * k, 0, { send: .5 });
        BELL(900, .05 * k, .4);
        N(.12, .2 * k, 6000, 2000, 2, 'bandpass', 0, { send: .4 });
      }
      if (c) {
        SUB(90, 28, .5, .7);
        BELL(1800, .1, .9, .01, { send: .6 });
        N(.3, .35, 6000, 800, .8, 'bandpass', 0, { send: .5 });
        CK(.6);
        T(1200, 2400, .18, 'sawtooth', .06, 0, { lp: 5000 });
        SHIM([1568, 2637], .05, .05, .02, .45);
      }
    },
    boom(r) {
      if (!ac || !on || !gt('b', .09, 3))
        return; BLAST(Math.max(.7, Math.min(1.3, .7 + (r || 40) / 70)), 0, 0); BELL(1300, .04, .7, .02, { send: .5 });
    },
    slam() {
      if (!ac || !on)
        return; BLAST(1.4, 0, 1); SUB(70, 26, 1, .55, .05); BELL(700, .06, .9, .05, { send: .5 }); for (let i = 0; i < 6; i++)
        N(.03, .2, 1800 + rnd() * 2000, 600, 3, 'bandpass', .12 + rnd() * .5, { pan: rnd() * 2 - 1, at: .001 });
    },
    warn(k) {
      if (!ac || !on)
        return;
      if (k == 0) {
        T(150, 620, .6, 'sawtooth', .06, 0, { at: .3, lp: 1800 });
        N(.6, .13, 300, 3000, 1.5, 'bandpass', 0, { at: .4 });
        T(390, 930, .6, 'sine', .05, 0, { at: .3 });
        SUB(60, 90, .55, .3, 0, { at: .35 });
        N(.4, .08, 2000, 7000, 6, 'bandpass', .1, { at: .3 });
      } else {
        T(300, 1300, .6, 'sawtooth', .05, 0, { at: .35, lp: 2800, send: .4 });
        N(.5, .12, 300, 6000, 2, 'bandpass', 0, { at: .35, send: .3 });
        T(200, 320, .5, 'triangle', .05, 0, { at: .3 });
        BELL(1200, .025, .6, .35, { send: .5 });
      }
    },
    // ---- suara tiap bos: id = mino | lava | kn | ar | gl | bl ; k = jenis serangan / intro / phase / die / hurt ----
    bossVo(id, k, ph) {
      const QK = (id == 'drg' ? { intro: [3.2, 12], phase: [3.6, 14], die: [3.6, 12], nova: [2.4, 10], triad: [2.8, 11], lunge: [.9, 5] } : { intro: [2.2, 9], phase: [2.6, 11], die: [3, 10], beamhold: [1.7, 6] })[k];
      if (QK && (id == 'mino' || id == 'lava' || id == 'drg'))
        QUAKE(QK[0], QK[1]);
      if (!ac || !on || !id)
        return;
      if (id == 'mino') { // Morvath Minotaur: auman banteng berat
        const p3 = ph == 3;
        if (k == 'intro') {
          ROAR(92, 2.3, .4, { lfo: 20, rate: 10 });
          T(60, 32, .2, 'sine', .6, 1);
          T(60, 32, .2, 'sine', .55, 1.3);
          T(58, 30, .25, 'sine', .55, 1.6);
          N(.4, .22, 900, 200, 1, 'lowpass', 2.1);
        } else if (k == 'slam') {
          VOX(125, 68, .42, .34, 520, 900, { at: .03, dist: 1, lfo: 30, ld: .4 });
          VOX(62, 40, .5, .3, 220, 420, { at: .04, dist: 1, lfo: 16, ld: .5 });
          RUMBLE(55, 28, .6, .5, 12);
          N(.3, .16, 1200, 250, 1, 'lowpass', .1);
        } else if (k == 'charge') {
          VOX(80, 140, .65, .34, 450, 780, { at: .1, pk: 120, lfo: 18, ld: .5, dist: 1 });
          VOX(40, 70, .7, .3, 200, 400, { at: .1, lfo: 12, ld: .5, dist: 1 });
          RUMBLE(50, 30, .8, .5, 14);
          [0, .14, .28, .42, .56].forEach(d => T(65, 34, .12, 'sine', .5, d));
        } else if (k == 'fan') {
          VOX(150, 88, .45, .3, 620, 1300, { at: .04, dist: 1, lfo: 34, ld: .35 });
          N(.3, .18, 3000, 900, 1.5, 'bandpass', 0, { at: .05 });
        } else if (k == 'rain') {
          ROAR(74, 1.2, .3, { lfo: 12, rate: 9 });
        } else if (k == 'dash') {
          N(.4, .22, 500, 2400, 1, 'bandpass', 0, { at: .08 });
          T(55, 30, .3, 'sine', .5);
        } else if (k == 'impact') {
          SUB(95, 36, .5, .6);
          RUMBLE(50, 24, .8, .6, 13);
          VOX(70, 48, .3, .28, 400, 700, { at: .02, dist: 1 });
        } else if (k == 'phase') {
          ROAR(88, 2.7, p3 ? .5 : .44, { lfo: p3 ? 32 : 24, rate: p3 ? 15 : 10, q: 1.2 });
          if (p3)
            VOX(55, 34, 2.4, .32, 280, 560, { dl: .3, lfo: 9, ld: .6, dist: 1 });
          T(55, 30, .25, 'sine', .6, 1.2);
          T(55, 30, .25, 'sine', .55, 1.5);
        } else if (k == 'die') {
          ROAR(105, 3.1, .4, { lfo: 12, rate: 8, at: .15 });
          T(55, 30, .25, 'sine', .6, 2);
          T(50, 28, .25, 'sine', .55, 2.4);
        } else if (k == 'hurt')
          VOX(140, 85, .28, .26, 550, 950, { at: .02, dist: 1, lfo: 30, ld: .3 });
      } else if (id == 'drg') { // Kryovarth Naga Es: auman sub-bass berlapis (1 suara per kepala), getar layar + haptik
        const f = ph || 1, F0 = [58, 50, 44][f - 1], V = (a, b, d, v, o) => VOX(a, b, d, v, 260, 900 + f * 250, Object.assign({ lfo: 7 + f * 5, ld: .5, dist: 1, send: .5 }, o));
        if (k == 'intro' || k == 'phase' || k == 'nova' || k == 'triad' || k == 'die') {
          const n = k == 'die' ? 3 : f;
          for (let i = 0; i < n; i++)
            ROAR(F0 * (1 + i * .19), 2.6 + f * .3, .42 - i * .05, { lfo: 9 + i * 5, rate: 9 + i * 3, q: 1.2, at: i * .12 });
          RUMBLE(F0 * .6, 22, 2.8, .8, 8 + f * 2);
          SUB(F0 * .5, 24, 2.4, .7);
          N(2.2, .14, 3000, 400, 1.2, 'bandpass', 0, { at: .4, send: .5 });
          for (let i = 0; i < 6; i++)
            T(36 + i * 3, 22, .3, 'sine', .6, i * .35);
          if (k == 'intro' || k == 'phase')
            ROCKS(6, .3, 2);
        } else if (k == 'breath' || k == 'blizzard') {
          V(F0 * 2.2, F0 * 1.2, 1.1, .3, { at: .2 });
          N(1.2, .2, 1200, 5000, 1.3, 'bandpass', 0, { at: .3, send: .4 });
          RUMBLE(F0, 28, 1.2, .5, 12);
        } else if (k == 'shards') {
          V(F0 * 3, F0 * 1.6, .4, .3, { at: .03, lfo: 30, ld: .3 });
          N(.3, .16, 4000, 1500, 1.5, 'bandpass');
        } else if (k == 'icicles' || k == 'hail') {
          V(F0 * 1.6, F0 * 3, .9, .28, { at: .4 });
          N(.9, .12, 800, 6000, 2, 'bandpass', 0, { at: .5 });
        } else if (k == 'tail') {
          SUB(90, 30, .5, .6);
          N(.5, .2, 2500, 300, 1, 'bandpass', 0, { at: .1 });
        } else if (k == 'lunge') {
          V(F0 * 1.5, F0 * 3, .6, .32, { at: .1 });
          RUMBLE(F0, 30, .8, .5, 14);
        } else if (k == 'hurt')
          V(F0 * 3, F0 * 2, .25, .22, { at: .02, lfo: 30, ld: .3 });
      } else if (id == 'lava') { // Titan Lava: batu bergemuruh, lava menggelegak, api meraung
        const f = ph || 1, F0 = [62, 54, 74][f - 1], FB = [[220, 480], [300, 720], [640, 1350]][f - 1], LF = [8, 13, 26][f - 1], V = (a, b, d, v, o) => VOX(a, b, d, v, FB[0], FB[1], Object.assign({ lfo: LF, ld: .5, dist: 1 }, o));
        if (k == 'intro' || k == 'phase') {
          ROAR(F0 * 1.5, 2.6, .44, { lfo: LF, rate: f == 3 ? 14 : 9, q: 1.2 });
          VOX(F0, F0 * .5, 2.4, .3, FB[0], FB[1], { dl: .2, lfo: LF, ld: .6, dist: 1 });
          ROCKS(7, .45, 2.2);
          if (f >= 2)
            BUBL(f == 3 ? 8 : 6);
          if (f == 3)
            FIRE(2, .2, .2);
        } else if (k == 'geyser') {
          V(F0, F0 * 2.2, .9, .28, { at: .4 });
          N(.9, .14, 300, 2500, 1.5, 'bandpass', 0, { at: .5, send: .4 });
          BUBL(5);
        } else if (k == 'tide') {
          V(F0 * 1.3, F0 * .8, .8, .3, { at: .15, lfo: LF * .7 });
          N(.8, .18, 2200, 300, 1, 'bandpass', 0, { at: .3 });
        } else if (k == 'meteor') {
          V(F0 * 1.2, F0 * 3, .9, .3, { at: .5 });
          N(.9, .12, 600, 5000, 2, 'bandpass', 0, { at: .6 });
        } else if (k == 'orbs') {
          V(F0 * 2, F0 * 1.1, .35, .3, { at: .03, lfo: LF * 1.5, ld: .3 });
          N(.25, .14, 2500, 800, 1.4, 'bandpass', 0, { at: .03 });
        } else if (k == 'ring') {
          V(F0 * 1.1, F0 * .6, .9, .32, { at: .35 });
          RUMBLE(F0, 26, 1, .55, 11, .3);
          SUB(F0 * .9, 28, .7, .55, .6);
        } else if (k == 'beam')
          V(F0 * 1.2, F0 * 2, 1, .26, { at: .5 });
        else if (k == 'beamhold') {
          ROAR(F0 * 1.8, 1.7, .36, { lfo: LF * 1.3, rate: 16 });
          N(1.7, .2, 400, 3500, 1.2, 'bandpass', 0, { at: .6, dist: 1, send: .4 });
        } else if (k == 'blink') {
          WHSH(.5, .3, 300, 3000, 0);
          V(F0, F0 * .7, .5, .2, { at: .1 });
        } else if (k == 'impact') {
          SUB(F0, 28, .5, .55);
          N(.2, .3, 1500, 200, 1, 'bandpass', 0, { dist: 1 });
        } else if (k == 'die') {
          ROAR(F0 * 1.9, 3.3, .42, { lfo: LF, rate: 7, at: .2 });
          ROCKS(16, .4, 2.8);
          N(3, .18, 200, 60, 1, 'lowpass', 0, { at: .4, send: .6 });
        } else if (k == 'hurt') {
          N(.06, .4, 1800, 400, 2, 'bandpass', 0, { dist: 1, at: .001 });
          V(F0 * 2, F0 * 1.2, .25, .22, { at: .02, lfo: LF * 1.5, ld: .3 });
        }
      } else if (id == 'ik' || id == 'it') { // mini bos salju: ik = Ksatria Salju Berkuda, it = Turet Es Hidup
        if (id == 'ik') {
          if (k == 'die') {
            VOX(560, 160, .9, .22, 900, 2400, { at: .05, lfo: 16, ld: .4, send: .4 });
            N(.9, .2, 5000, 1800, 2, 'bandpass', 0, { at: .1, send: .5 });
            [0, .08, .17, .3].forEach(d => N(.04, .25, 4000 + rnd() * 3000, 2000, 2, 'bandpass', d, { at: .001, pan: rnd() * 2 - 1 }));
          } else if (k == 'hurt') {
            N(.1, .25, 4500, 1500, 1.5, 'bandpass', 0, { at: .01 });
            VOX(620, 420, .18, .14, 900, 2000, { at: .02 });
          } else if (k == 'dash') {
            [0, .1, .2, .3, .4].forEach(d => T(90, 50, .08, 'sine', .5, d));
            N(.4, .18, 800, 2800, 1, 'bandpass', 0, { at: .1 });
          } else if (k == 'cage') {
            VOX(520, 300, .7, .24, 900, 2200, { at: .04, lfo: 18, ld: .3 });
            SUB(80, 40, .4, .4);
          } else {
            VOX(560, 340, .5, .22, 900, 2200, { at: .04, lfo: 18, ld: .3 });
            N(.3, .14, 3000, 800, 1, 'bandpass', 0, { at: .05 });
          }
        } else {
          if (k == 'die') {
            N(1.1, .22, 4000, 300, 1, 'bandpass', 0, { at: .1, dist: 1, send: .5 });
            T(300, 60, .9, 'sawtooth', .3);
          } else if (k == 'hurt') {
            N(.1, .25, 3800, 900, 1.4, 'bandpass', 0, { at: .01 });
            T(420, 300, .1, 'square', .18);
          } else if (k == 'spiral') {
            T(220, 160, .6, 'sawtooth', .18);
            N(.6, .12, 2000, 4500, 1.2, 'bandpass', 0, { at: .1 });
          } else if (k == 'beam') {
            T(150, 420, .9, 'sawtooth', .2);
            N(.9, .14, 600, 4000, 1.5, 'bandpass', 0, { at: .4 });
          } else if (k == 'mortar') {
            T(120, 50, .4, 'sine', .5);
            N(.5, .12, 1200, 300, 1, 'bandpass', 0, { at: .1 });
          } else {
            SUB(70, 34, .4, .5);
            N(.3, .2, 3000, 600, 1, 'bandpass', 0);
          }
        }
      } else { // mini bos: kn = Skeleton Knight, ar = Skeleton Archer, gl = Lava Golem, bl = Blash Inferno
        if (id == 'kn' || id == 'ar') {
          const kn = id == 'kn';
          if (k == 'die') {
            RATTLE(kn ? 16 : 12, .25, .07);
            VOX(kn ? 120 : 240, kn ? 50 : 120, .9, .22, kn ? 360 : 600, kn ? 700 : 1400, { at: .1, lfo: 12, ld: .4, send: .4 });
          } else if (k == 'hurt') {
            RATTLE(4, .2);
            VOX(kn ? 150 : 280, kn ? 100 : 200, .2, .14, kn ? 400 : 700, kn ? 800 : 1500, { at: .02 });
          } else if (k == 'dash') {
            N(.35, .2, 500, 2200, 1, 'bandpass', 0, { at: .08 });
            RATTLE(6, .2, .05);
          } else if (kn) {
            RATTLE(k == 'smash' ? 8 : 6, .22);
            VOX(k == 'smash' ? 140 : 100, k == 'smash' ? 80 : 60, .55, .26, 360, 700, { at: .05, dist: 1, lfo: 14, ld: .3 });
          } else {
            RATTLE(6, .18, .05);
            VOX(270, 190, .75, .17, 600, 1400, { at: .15, lfo: 7, ld: .5, send: .5 });
          }
        } else {
          const gl = id == 'gl';
          if (k == 'die') {
            if (gl) {
              VOX(80, 30, 1.6, .3, 260, 560, { at: .1, lfo: 9, ld: .5, dist: 1, send: .5 });
              ROCKS(8, .3, 1.2);
              SUB(40, 24, 1.5, .5);
            } else {
              N(1.1, .22, 3500, 300, 1, 'bandpass', 0, { at: .1, dist: 1, send: .5 });
              VOX(300, 90, 1, .2, 800, 1700, { at: .05, lfo: 30, ld: .5, dist: 1 });
            }
          } else if (k == 'hurt') {
            if (gl) {
              N(.05, .35, 1500, 400, 2, 'bandpass', 0, { dist: 1, at: .001 });
              VOX(110, 80, .2, .2, 260, 560, { at: .02, dist: 1 });
            } else {
              N(.12, .25, 3500, 800, 1.4, 'bandpass', 0, { at: .01, dist: 1 });
            }
          } else if (gl) {
            VOX(80, 50, .8, .28, 260, 560, { at: .1, lfo: 10, ld: .5, dist: 1 });
            N(.7, .14, 300, 1200, 1.2, 'bandpass', 0, { at: .2 });
            ROCKS(3, .25, .5);
          } else {
            N(.8, .2, 500, 3500, 1, 'bandpass', 0, { at: .3, dist: 1, send: .4 });
            VOX(300, 200, .6, .2, 800, 1700, { at: .1, lfo: 30, ld: .5, dist: 1 });
            for (let i = 0; i < 5; i++)
              N(.03, .2, 3000 + rnd() * 3000, 1500, 2, 'bandpass', rnd() * .7, { at: .001, pan: rnd() * 2 - 1 });
          }
        }
      }
    },
    bossHurt(id) {
      if (!ac || !on || !id || !gt('bh' + id, .45, 1))
        return; NEWM.bossVo(id, 'hurt', typeof BOSS == 'object' ? BOSS.ph : 1);
    },
    stagger() {
      if (!ac || !on)
        return; IMP(1.1); N(.3, .45, 7000, 1500, 1, 'bandpass', 0, { send: .3 }); BELL(1700, .09, .8, .01, { send: .5 }); BELL(2500, .05, .6, .04); for (let i = 0; i < 6; i++)
        N(.02, .25, 3500 + rnd() * 4000, 2000, 3, 'bandpass', .03 + rnd() * .25, { pan: rnd() * 2 - 1, at: .0004 });
    },
    die(kind) {
      if (!ac || !on || !gt('d', .14, 3))
        return;
      X();
      if (kind == 'slime') {
        N(.28, .5, 1500, 200, 1.4, 'lowpass', 0, { at: .004, dist: 1, send: .3 });
        T(340, 90, .22, 'sine', .35, 0, { send: .2 });
        [0, .06, .12, .19].forEach((d, i) => T(260 + i * 90, 120 + i * 40, .09, 'sine', .14, d));
        SUB(110, 40, .3, .4);
      } else if (kind == 'skel') {
        N(.03, .55, 3500, 7000, 2.5, 'bandpass', 0, { at: .0005 });
        T(1000, 400, .06, 'triangle', .2);
        for (let q = 0; q < 9; q++) {
          const d = .02 + q * .035 + rnd() * .03;
          N(.02, .3, 2500 + rnd() * 3000, 1500, 3, 'bandpass', d, { at: .0004, pan: rnd() * 2 - 1 });
          T(700 + rnd() * 700, 300, .04, 'triangle', .1, d, { pan: rnd() * 2 - 1 });
        }
        SUB(100, 34, .3, .45, .02);
        BELL(1600, .04, .5, .05);
      } else if (kind == 'mage') {
        T(900, 150, .5, 'sawtooth', .07, 0, { lp: 3000, at: .02, send: .5 });
        N(.45, .35, 5000, 400, 1, 'bandpass', 0, { dist: 1, send: .5 });
        SUB(130, 30, .45, .5, .05);
        SHIM([1760, 1319, 988, 740], .035, .06, .08, .6);
      } else {
        N(.3, .4, 3500, 400, .9, 'bandpass', 0, { dist: 1 });
        for (let i = 0; i < 6; i++)
          T(800 + rnd() * 1700, 500, .04, 'square', .05, .02 + rnd() * .25);
        T(240, 50, .35, 'triangle', .25);
        T(1200, 200, .5, 'sine', .07, .02, { send: .4 });
        SUB(110, 36, .35, .5);
      }
    },
    pain() {
      if (!ac || !on)
        return; SUB(170, 50, .3, .8); CK(.35); N(.18, .45, 900, 180, .8, 'lowpass', 0, { dist: 1 }); FM(150, 95, .28, .2, 700, 1150); T(55, 40, .25, 'sine', .5, .16); BELL(500, .03, .5, .02, { send: .5 });
    },
    death() {
      if (!ac || !on)
        return; FM(120, 40, 1.4, .28, 500, 900); SUB(55, 30, 1.6, .65); N(1.3, .25, 200, 2200, 1, 'bandpass', 0, { at: .8, send: .6 }); T(60, 40, .25, 'sine', .55, .25); T(60, 40, .25, 'sine', .5, .55); PWR(98, .04, 2.2, .1, 700); BELL(392, .08, 2.2, .3, { send: .8 }); BELL(311, .06, 2.4, .8, { send: .8 });
    },
    dodge() {
      if (!ac || !on)
        return; WHSH(.22, .38, 500, 4200, 0); N(.12, .22, 200, 900, 1, 'lowpass', .02); N(.07, .28, 800, 200, 1, 'lowpass', .1); SUB(120, 60, .14, .2, .02);
    },
    skill(i) {
      if (!ac || !on)
        return;
      const w = typeof wi == 'number' ? wi : 0;
      i |= 0;
      if (w == 0) {
        if (i == 0) {
          SHING(2600, .06, 0, .35);
          SHING(3300, .06, .07, .35);
          WHSH(.16, .5, 700, 6500, 0, -.5);
          WHSH(.16, .5, 800, 7000, .07, .5);
          IMP(.7, .14);
          SUB(130, 45, .2, .4, .08);
        } else if (i == 1) {
          for (let q = 0; q < 4; q++)
            WHSH(.22, .45, 400 + q * 220, 4200 + q * 600, q * .16, q % 2 ? .6 : -.6);
          N(.75, .22, 300, 1400, .7, 'bandpass', 0, { at: .3, send: .4 });
          SUB(70, 40, .7, .35);
          [0, 1, 2].forEach(q => SHING(2200 + q * 400, .04, .1 + q * .17, .3));
        } else {
          T(150, 900, .22, 'sawtooth', .1, 0, { lp: 2500, at: .12 });
          WHSH(.22, .6, 300, 6000, 0);
          [220, 330, 440].forEach(f => HORN(f, .07, .9, .2));
          BLAST(1.1, .22, 0);
          BELL(1568, .08, 1.4, .24, { send: .7 });
          SHIM([1047, 1319, 1568, 2093], .04, .05, .26, .8);
          ORC.timp(.2, .45, 62);
        }
      } else if (w == 1) {
        if (i == 0) {
          WHSH(.3, .55, 300, 5000, 0);
          for (let q = 0; q < 3; q++)
            SUB(80, 40, .15, .4, .05 + q * .09);
          SHING(1500, .07, .22, .5);
          IMP(.8, .22);
        } else if (i == 1) {
          SHING(900, .1, 0, .7);
          BELL(600, .07, .9, 0, { send: .5 });
          SUB(110, 40, .3, .5, .02);
          WHSH(.14, .5, 1500, 8000, .35);
          IMP(.9, .38);
          BELL(2400, .06, .7, .4, { send: .5 });
        } else {
          FM(95, 190, .8, .3, 400, 800);
          FM(80, 160, .8, .2, 600, 1200, .02);
          FIRE(1.1, .3, .05);
          for (let q = 0; q < 4; q++)
            SUB(65, 30, .22, .5, .1 + q * .13);
          WHSH(.35, .55, 300, 6000, .4);
          BELL(1000, .08, 1.2, .5, { send: .6 });
          ORC.timp(.3, .5, 58);
        }
      } else if (w == 2) {
        if (i == 0) {
          for (let q = 0; q < 4; q++)
            TWANG(.75, q * .07, (q - 1.5) * .35);
          RING(2600, .03, .3, .05);
        } else if (i == 1) {
          WHSH(.28, .45, 400, 4200, 0);
          SUB(110, 50, .18, .3, .02);
          for (let q = 0; q < 3; q++)
            TWANG(.75, .12 + q * .06, (q - 1) * .5);
        } else {
          T(260, 980, .4, 'triangle', .06, 0, { at: .25, lp: 3000 });
          N(.4, .1, 800, 5500, 2, 'bandpass', 0, { at: .3 });
          TWANG(1.25, .4);
          SUB(80, 34, .5, .5, .4);
          for (let q = 0; q < 14; q++)
            N(.12, .13, 6500 - q * 100, 1200, 4, 'bandpass', .75 + q * .09 + rnd() * .04, { at: .03, pan: rnd() * 2 - 1, send: .2 });
          BELL(1760, .05, .8, .4, { send: .6 });
        }
      } else if (w == 3) {
        if (i == 0) {
          ORB(1.3, 0);
          BLAST(.6, .12, 0);
          ZAP(.3, .3, .1, 5);
          BELL(1320, .06, 1, .12, { send: .7 });
        } else if (i == 1) {
          T(1800, 200, .2, 'sine', .12);
          WHSH(.25, .4, 6000, 500, 0);
          BELL(1000, .05, .6, .22, { send: .7 });
          SUB(80, 36, .5, .6, .25);
          N(.5, .25, 500, 9000, 1, 'bandpass', .22, { at: .01, send: .6 });
          SHIM([1319, 1760, 2349], .04, .04, .26, .6);
        } else {
          PWR(82.4, .05, 2, 0, 1000);
          FIRE(1.6, .28, .15);
          T(60, 160, 1.5, 'sine', .5, 0, { at: .8, send: .5 });
          N(1.8, .25, 150, 3500, 1, 'bandpass', 0, { at: 1.2, send: .6 });
          ORC.timp(.4, .4, 55);
          ORC.timp(.9, .5, 55);
          ORC.choir(164.8, .1, 1.8, .06);
          BELL(660, .06, 1.8, .9, { send: .8 });
        }
      } else {
        if (i == 0) {
          T(900, 120, .2, 'sawtooth', .06, 0, { lp: 2400 });
          WHSH(.2, .55, 800, 7000, 0);
          N(.25, .22, 600, 100, 1, 'lowpass', 0, { send: .4 });
          SUB(110, 40, .2, .35);
        } else if (i == 1) {
          for (let q = 0; q < 6; q++) {
            const pn = Math.cos(q / 6 * 6.28);
            WHSH(.09, .35, 3000, 10000, q * .035, pn);
          }
          SHING(3200, .06, .05, .4);
          SUB(100, 40, .3, .55, .04);
          BELL(2200, .05, .8, .12, { send: .6 });
        } else {
          N(.5, .25, 300, 3000, 1, 'bandpass', 0, { at: .3, send: .5 });
          for (let q = 0; q < 12; q++) {
            WHSH(.08, .32, 3000, 10000, .1 + q * .1, rnd() * 1.6 - .8);
            if (q % 3 == 0)
              SHING(2600 + rnd() * 1500, .035, .1 + q * .1, .25);
          }
          SHIM([1568, 2093, 1760, 2637], .035, .25, .2, .8);
          SUB(70, 36, .5, .4, .1);
        }
      }
    },
    focus() {
      if (!ac || !on)
        return; PWR(110, .035, 1, 0, 1600); arp([440, 554, 659, 880, 1109], .12, .06, .8); N(.5, .2, 600, 7000, 1.2, 'bandpass', 0, { at: .3, send: .4 }); SUB(60, 130, .4, .4); BELL(1760, .06, 1, .3, { send: .7 });
    },
    potion() {
      if (!ac || !on)
        return; for (let i = 0; i < 4; i++)
        T(350 + rnd() * 150 + i * 60, 600 + i * 80, .07, 'sine', .2, i * .06); SHIM([1568, 1976, 2349, 3136], .04, .07, .26, .7); T(523, 1046, .5, 'sine', .08, .2, { send: .6 });
    },
    pickup() {
      if (!ac || !on)
        return; BELL(1568, .08, .6, 0, { send: .5 }); BELL(2093, .06, .7, .06, { send: .5 }); BELL(2637, .045, .8, .11, { send: .5 }); N(.15, .08, 6000, 12000, .8, 'highpass', .05, { at: .02 });
    },
    ready() { CK(.3); T(1500, 1500, .12, 'sine', .18); T(2250, 2250, .15, 'sine', .12, .05); BELL(1760, .05, .5, .04, { send: .5 }); },
    point() { T(1318, 1318, .1, 'square', .07); T(1760, 1760, .25, 'square', .07, .07); RING(2800, .03, .3, .07); BELL(2637, .04, .5, .08, { send: .5 }); },
    sw() { CK(.25); N(.08, .2, 1500, 4000, 1, 'bandpass'); T(500, 700, .05, 'triangle', .08); RING(3000, .03, .15); },
    level() {
      if (!ac || !on)
        return; ORC.timp(0, .45, 65);[523.25, 659.25, 783.99, 1046.5].forEach((f, k) => HORN(f, .1, .5 + k * .1, k * .09)); HORN(1318.5, .11, 1.4, .38); HORN(261.6, .09, 1.5, .38); SHIM([1568, 2093, 2637, 3136], .045, .07, .4, 1.1); ORC.choir(523.25, .35, 2, .07); ORC.choir(659.25, .35, 2, .05); T(131, 131, 1.1, 'sine', .28, 0, { send: .4 }); ORC.cym(.35, .5, .08);
    },
    clear() {
      if (!ac || !on)
        return; ORC.timp(0, .5, 62); ORC.timp(.25, .45, 82);[392, 494, 587, 784].forEach((f, k) => HORN(f, .1, .55, k * .12)); HORN(987.8, .11, 1.6, .5); HORN(196, .09, 1.6, .5); ORC.choir(392, .4, 2.2, .07); SHIM([1568, 1976, 2349, 3136], .04, .08, .5, 1); ORC.cym(.5, .7, .1);
    },
    door() {
      if (!ac || !on)
        return; N(1, .5, 300, 100, 1, 'bandpass', 0, { at: .1, send: .5 }); N(.9, .28, 1200, 300, 3, 'bandpass', .05, { dist: 1 }); SUB(55, 30, 1.2, .7); SUB(70, 26, .5, .6, .9); BLAST(.8, .9, 0); ORC.timp(.88, .5, 52); for (let q = 0; q < 8; q++)
        N(.05, .15, 900 + rnd() * 1500, 400, 3, 'bandpass', .1 + rnd() * .8, { pan: rnd() * 2 - 1 });
    },
    wave() {
      if (!ac || !on)
        return; HORN(110, .13, 1.4, 0); HORN(165, .1, 1.4, 0); HORN(98, .11, 1.2, .55); ORC.timp(0, .6, 55); ORC.timp(.35, .6, 55); ORC.timp(.7, .7, 49); N(.9, .12, 200, 2500, 1, 'bandpass', 0, { at: .5, send: .5 }); BELL(440, .05, 1.4, .7, { send: .8 });
    },
    summon() {
      if (!ac || !on)
        return;[300, 450, 600].forEach((f, i) => T(f, f * 3, .8, 'sine', .06, i * .05, { at: .4, send: .5 })); N(.8, .08, 500, 6000, 1.5, 'bandpass', 0, { at: .45, send: .4 }); SUB(60, 40, .6, .35, .3); SUB(80, 30, .9, .4, .45); N(1, .14, 180, 900, 1.2, 'bandpass', .1, { at: .5, send: .6 }); ZAP(.3, .12, .4, 4);
    },
    appear() {
      if (!ac || !on)
        return;
      // Musuh muncul: portal bayangan (thump rendah + rift naik + geram + pop). Tanpa lonceng/ting.
      // Dibatasi: maks 2 efek penuh per 0.5 dtk; sisanya hanya thump pelan, jadi gelombang besar tidak jadi 'ting ting ting'.
      const k = gt('ap', .5, 2) ? 1 : .3, pn = (rnd() - .5) * .9, f = 100 + rnd() * 50;
      SUB(f, 34, .5, .55 * k, 0, { pan: pn });
      if (k < 1) {
        N(.18, .08, 900, 150, 1, 'lowpass', 0, { pan: pn });
        return;
      }
      T(f * .8, f * .45, .4, 'sawtooth', .09, 0, { lp: 380, at: .04, pan: pn, send: .3 });
      N(.3, .16, 250, 1500, 1.4, 'bandpass', 0, { at: .2, pan: pn, send: .35 });
      N(.1, .26, 2000, 350, 1, 'bandpass', .24, { at: .001, dist: 1, pan: pn, send: .3 });
      N(.35, .14, 1200, 160, 1.2, 'lowpass', .24, { pan: pn, send: .4 });
    },
    ultReady() { /* lembut & hangat: tiga nada sine naik (G-C-E) + gemuruh rendah, tanpa lonceng/desis tinggi */ if (!ac || !on)
      return; T(392, 392, .7, 'sine', .07, 0, { at: .08, lp: 1600, send: .35, nj: 1 }); T(523.25, 523.25, .8, 'sine', .07, .11, { at: .1, lp: 1600, send: .4, nj: 1 }); T(659.25, 659.25, 1, 'sine', .055, .22, { at: .12, lp: 1900, send: .5, nj: 1 }); T(98, 131, .7, 'sine', .2, 0, { at: .1, send: .3, nj: 1 });
    },
    ult(w) {
      if (!ac || !on)
        return;
      X();
      w = typeof w == 'number' ? w : (typeof wi == 'number' ? wi : 0);
      N(1.3, .5, 200, 8000, 1.2, 'bandpass', 0, { at: .55, send: .6 });
      T(110, 900, .95, 'sawtooth', .09, 0, { lp: 2600, at: .5, send: .5 });
      T(55, 24, 1.8, 'sine', .8, 0, { send: .5 });
      [0, .1, .2, .3, .4].forEach((t0, k) => ORC.timp(t0, .3 + k * .07, 58 + k * 3));
      ORC.choir(220 * (w == 3 ? .75 : 1), .1, 2.4, .09);
      ORC.choir(330, .1, 2.4, .07);
      BLAST(1.8, .5, 1);
      SUB(60, 22, 1.4, .8, .5);
      BELL(880, .07, 1.6, .55, { send: .7 });
      if (w == 0) {
        [293.66, 440, 587.33].forEach((f, k) => HORN(f, .11, 1.2, .52 + k * .03));
        SHIM([1175, 1568, 1976, 2349, 2960], .05, .07, .6, 1);
        SHING(3000, .08, .5, .8);
      } else if (w == 1) {
        FIRE(1.6, .4, .45);
        FM(110, 70, .9, .35, 600, 1000, .5);
        [196, 293.66].forEach(f => HORN(f, .13, 1.4, .5));
        [0, .2, .4].forEach(t0 => SUB(70, 30, .4, .5, .55 + t0));
      } else if (w == 2) {
        for (let q = 0; q < 8; q++)
          TWANG(.6, .15 + q * .08, rnd() * 1.6 - .8);
        WHSH(.9, .3, 6000, 900, .5, 0);
        [329.63, 493.88].forEach(f => HORN(f, .09, 1.2, .52));
        SHIM([1319, 1760, 2349], .05, .08, .6);
      } else if (w == 3) {
        PWR(110, .05, 1.8, .45, 1400);
        ZAP(.5, .3, .5, 5);
        BELL(660, .09, 2, .52, { send: .8 });
        SHIM([1320, 1568, 1976, 2637], .05, .09, .6, 1.2);
        T(40, 90, 1.2, 'sine', .5, 0, { at: .5, send: .6 });
      } else {
        for (let q = 0; q < 9; q++) {
          SHING(2400 + rnd() * 1800, .04, .2 + q * .06, .25);
          WHSH(.07, .3, 3000, 9500, .2 + q * .06, rnd() * 1.6 - .8);
        }
        N(.9, .2, 500, 100, 1, 'lowpass', .4, { at: .3, send: .6 });
        [146.83, 174.61].forEach(f => HORN(f, .11, 1.4, .5));
      }
    },
    /* ===== ritme basic attack (bow & staff): w=senjata, n=hit ke (0..2), k=urutan tembakan dalam hit ===== */
    beat(w, n, k) {
      if (!ac || !on)
        return;
      const sc = [523.25, 659.25, 784, 1046.5], f = sc[n == 1 ? (k ? 2 : 1) : n == 2 ? 3 : 0] * (w == 3 ? .5 : 1);
      if (w == 2) {
        T(f, f * .985, .2 + n * .08, 'triangle', .09 + n * .02, 0, { send: .3 });
        T(f * 2, f * 2, .12, 'sine', .035, 0);
        BELL(f * 2, .02 + n * .008, .4, 0, { send: .5 });
        if (n == 2) {
          T(f * .5, f * .5, .4, 'triangle', .07, .02, { send: .4 });
          RING(f * 2, .03, .5, .02, { send: .5 });
          SUB(f * .25, f * .12, .35, .3, .02);
          arp([f, f * 1.25, f * 1.5], .04, .04, .5);
        }
      } else {
        T(f, f * 1.01, .3 + n * .1, 'sine', .1 + n * .02, 0, { send: .45 });
        T(f * 2.005, f * 2, .22, 'triangle', .04, 0, { send: .3 });
        BELL(f * 2, .02 + n * .01, .5, 0, { send: .6 });
        if (n == 2) {
          arp([f * .5, f * .75, f], .05, .035, .5);
          RING(f * 2, .04, .7, .04, { send: .6 });
          SUB(f * .25, f * .1, .5, .35, .02);
          SHIM([f * 2, f * 3], .03, .06, .05, .8);
        }
      }
    },
    charge(w) {
      if (!ac || !on)
        return;
      if (w == 2) {
        T(260, 980, .26, 'triangle', .06, 0, { at: .12, lp: 3000 });
        N(.26, .09, 800, 4500, 2, 'bandpass', 0, { at: .2 });
        T(160, 520, .26, 'sawtooth', .035, 0, { at: .2, lp: 1400 });
        N(.2, .05, 300, 900, 8, 'bandpass', 0, { at: .15 });
      } else {
        T(180, 1100, .32, 'sine', .09, 0, { at: .22, send: .5 });
        T(360, 2200, .32, 'triangle', .04, 0, { at: .22, send: .4 });
        N(.32, .07, 400, 7000, 1.4, 'bandpass', 0, { at: .26, send: .4 });
        BELL(1320, .025, .5, .24, { send: .6 });
      }
    },
    /* ===== black hole (ultimate staff) ===== */
    bhOpen() {
      if (!ac || !on)
        return; T(38, 120, 1.4, 'sine', .6, 0, { at: .5, send: .5 }); T(76, 240, 1.4, 'sawtooth', .06, 0, { at: .6, lp: 900, send: .5 }); N(1.2, .28, 120, 2400, 1.2, 'bandpass', 0, { at: .7, send: .6 }); RING(300, .05, 1.2, .2, { send: .6 }); PWR(55, .04, 1.6, 0, 600); ORC.choir(110, 0, 1.8, .06);
    },
    bhPulse(k) {
      if (!ac || !on)
        return; T(48 + 30 * k, 30, .45, 'sine', .4, 0, { send: .4 }); N(.3, .14, 200 + 800 * k, 80, 1, 'lowpass', 0, { at: .02, send: .5 }); BELL(220 + 330 * k, .03, .6, .02, { send: .8 });
    },
    bhCollapse() {
      if (!ac || !on)
        return; T(90, 2400, .6, 'sawtooth', .1, 0, { lp: 3500, at: .5, send: .4 }); T(45, 400, .6, 'sine', .55, 0, { at: .5 }); N(.6, .32, 200, 9000, 1.5, 'bandpass', 0, { at: .55, send: .6 }); ORC.timp(.4, .5, 50);
    },
    bhBlast() {
      if (!ac || !on)
        return; BLAST(2.1, 0, 1); T(60, 20, 2.2, 'sine', .85, .02, { send: .6 }); RING(500, .08, 1.6, .05, { send: .7 }); N(1.4, .35, 9000, 200, .8, 'highpass', .02, { at: .02, send: .5 }); arp([196, 261.6, 329.6, 392, 523.25], .1, .05, 1.2); ORC.timp(0, .7, 45); ORC.choir(98, 0, 2.6, .08); ORC.cym(0, 1, .14);[98, 146.8, 196].forEach(f => HORN(f, .12, 1.6, .05));
    }
  };
  /* ===== ULTIMATE STAFF (Event Horizon): memakai suara kustom assets/audio/sound_ultimate_staff.mp3 =====
     Dimainkan sekali saat ulti dimulai (durasi 5.8s; dentuman besar di ~3.75s = saat ledakan black hole).
     Suara sintetis lama (bhPulse/bhCollapse/bhBlast) dimatikan selama MP3 aktif.
     Jika MP3 gagal dimuat, otomatis kembali ke suara sintetis lama. */
  const BH_SND = 'assets/audio/sound_ultimate_staff.mp3', BH_GAIN = 1;
  let bhBuf = null, bhState = 0, bhSrc = null, BHM = 0;
  function bhPrep() {
    if (bhState || !ac)
      return;
    bhState = 1;
    fetch(BH_SND).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(b => ac.decodeAudioData(b, x => { bhBuf = x; bhState = 2; }, () => { bhState = 3; }))
      .catch(() => { bhState = 3; });
  }
  function bhPlay() {
    if (!ac || !on || !bhBuf)
      return false;
    try {
      if (bhSrc) { try { bhSrc.stop(); } catch (e) { } }
      const s = ac.createBufferSource(), g = ac.createGain();
      s.buffer = bhBuf;
      g.gain.value = BH_GAIN * xv;
      s.connect(g);
      g.connect(mg);
      s.start();
      bhSrc = s;
      BHM = 1;
      return true;
    } catch (e) {
      return false;
    }
  }
  [OLDM, NEWM].forEach(M => {
    const o = { bhOpen: M.bhOpen, bhPulse: M.bhPulse, bhCollapse: M.bhCollapse, bhBlast: M.bhBlast };
    M.bhOpen = function () { bhPrep(); BHM = 0; if (bhPlay()) return; return o.bhOpen.apply(this, arguments); };
    M.bhPulse = function () { if (BHM) return; return o.bhPulse.apply(this, arguments); };
    M.bhCollapse = function () { if (BHM) return; return o.bhCollapse.apply(this, arguments); };
    M.bhBlast = function () { if (BHM) return; return o.bhBlast.apply(this, arguments); };
  });
  /* ===== ULTIMATE SWORD (Excalibur Judgement): memakai suara kustom assets/audio/sound_ultimate_sword.mp3 =====
     Dimainkan sekali saat ulti pedang dimulai (durasi ulti 3.2s; MP3 ~4.6s).
     Suara sintetis lama ulti pedang + dentuman penutup (SFX.slam di akhir ulti) dimatikan selama MP3 aktif.
     Jika MP3 gagal dimuat, otomatis kembali ke suara sintetis lama. */
  const SW_SND = 'assets/audio/sound_ultimate_sword.mp3', SW_GAIN = 1;
  let swBuf = null, swState = 0, swSrc = null, SWM = 0;
  let swA = null, swAok = 0;
  function swFail() {
    swState = 3;
    try { console.warn('[SFX] Gagal memuat ' + SW_SND + ' (cek lokasi file: harus di folder assets/audio/ di samping index.html). Memakai cadangan.'); } catch (e) { }
    try {
      if (!swA) { swA = new Audio(SW_SND); swA.preload = 'auto'; swA.oncanplaythrough = () => { swAok = 1; }; swA.onerror = () => { swAok = 0; }; swA.onended = () => { SWM = 0; }; swA.load(); }
    } catch (e) { }
  }
  function swPrep() {
    if (swState || !ac)
      return;
    swState = 1;
    fetch(SW_SND).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(b => ac.decodeAudioData(b, x => { swBuf = x; swState = 2; }, () => { swFail(); }))
      .catch(() => { swFail(); });
  }
  function swPlay() {
    if (!ac || !on)
      return false;
    if (!swBuf) {
      if (swState == 3 && swA && swAok) {
        try { swA.volume = Math.min(1, .6 * xv * SW_GAIN); swA.currentTime = 0; const q = swA.play(); if (q && q.catch) q.catch(() => { SWM = 0; }); SWM = 1; return true; } catch (e) { return false; }
      }
      return false;
    }
    try {
      if (swSrc) { try { swSrc.stop(); } catch (e) { } }
      const s = ac.createBufferSource(), g = ac.createGain();
      s.buffer = swBuf;
      g.gain.value = SW_GAIN * xv;
      s.connect(g);
      g.connect(mg);
      s.onended = () => { if (swSrc === s) SWM = 0; };
      s.start();
      swSrc = s;
      SWM = 1;
      return true;
    } catch (e) {
      return false;
    }
  }
  [OLDM, NEWM].forEach(M => {
    const o = { ult: M.ult };
    M.ult = function (w) {
      const wk = typeof w == 'number' ? w : (typeof wi == 'number' ? wi : 0);
      if (wk == 0) {
        swPrep(); SWM = 0;
        const ok = swPlay();
        try { msg(ok ? '[DEBUG SFX] Ulti Pedang: MP3 dimainkan' : '[DEBUG SFX] Ulti Pedang: MP3 BELUM siap (state=' + swState + '), pakai suara lama'); } catch (e) { }
        if (ok) return;
      }
      return o.ult.apply(this, arguments);
    };
  });
  /* ===== ULTIMATE DAGGERS (Thousand Shadows): memakai suara kustom assets/audio/sound_ultimate_deggers.mp3 =====
     Dimainkan sekali saat ulti belati dimulai (durasi ulti 4.1s; MP3 ~5.6s).
     Suara sintetis lama ulti belati + dentuman penutup (SFX.slam di akhir ulti) dimatikan selama MP3 aktif.
     Jika MP3 gagal dimuat, otomatis kembali ke suara sintetis lama. */
  const DG_SND = 'assets/audio/sound_ultimate_deggers.mp3', DG_GAIN = 1;
  let dgBuf = null, dgState = 0, dgSrc = null, DGM = 0;
  let dgA = null, dgAok = 0;
  function dgFail() {
    dgState = 3;
    try { console.warn('[SFX] Gagal memuat ' + DG_SND + ' (cek lokasi file: harus di folder assets/audio/ di samping index.html). Memakai cadangan.'); } catch (e) { }
    try {
      if (!dgA) { dgA = new Audio(DG_SND); dgA.preload = 'auto'; dgA.oncanplaythrough = () => { dgAok = 1; }; dgA.onerror = () => { dgAok = 0; }; dgA.onended = () => { DGM = 0; }; dgA.load(); }
    } catch (e) { }
  }
  function dgPrep() {
    if (dgState || !ac)
      return;
    dgState = 1;
    fetch(DG_SND).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(b => ac.decodeAudioData(b, x => { dgBuf = x; dgState = 2; }, () => { dgFail(); }))
      .catch(() => { dgFail(); });
  }
  function dgPlay() {
    if (!ac || !on)
      return false;
    if (!dgBuf) {
      if (dgState == 3 && dgA && dgAok) {
        try { dgA.volume = Math.min(1, .6 * xv * DG_GAIN); dgA.currentTime = 0; const q = dgA.play(); if (q && q.catch) q.catch(() => { DGM = 0; }); DGM = 1; return true; } catch (e) { return false; }
      }
      return false;
    }
    try {
      if (dgSrc) { try { dgSrc.stop(); } catch (e) { } }
      const s = ac.createBufferSource(), g = ac.createGain();
      s.buffer = dgBuf;
      g.gain.value = DG_GAIN * xv;
      s.connect(g);
      g.connect(mg);
      s.onended = () => { if (dgSrc === s) DGM = 0; };
      s.start();
      dgSrc = s;
      DGM = 1;
      return true;
    } catch (e) {
      return false;
    }
  }
  [OLDM, NEWM].forEach(M => {
    const o = { ult: M.ult };
    M.ult = function (w) {
      const wk = typeof w == 'number' ? w : (typeof wi == 'number' ? wi : 0);
      if (wk == 4) {
        dgPrep(); DGM = 0;
        const ok = dgPlay();
        try { msg(ok ? '[DEBUG SFX] Ulti Belati: MP3 dimainkan' : '[DEBUG SFX] Ulti Belati: MP3 BELUM siap (state=' + dgState + '), pakai suara lama'); } catch (e) { }
        if (ok) return;
      }
      return o.ult.apply(this, arguments);
    };
  });
  /* ===== ULTIMATE BOW (Heaven Barrage): memakai suara kustom assets/audio/sound_ultimate_bow.mp3 =====
     Dimainkan sekali saat ulti busur dimulai (durasi ulti 3.7s; MP3 ~5.0s).
     Suara sintetis lama ulti busur + dentuman penutup (SFX.slam di akhir ulti) dimatikan selama MP3 aktif.
     Jika MP3 gagal dimuat, otomatis kembali ke suara sintetis lama. */
  const BW_SND = 'assets/audio/sound_ultimate_bow.mp3', BW_GAIN = 1;
  let bwBuf = null, bwState = 0, bwSrc = null, BWM = 0;
  let bwA = null, bwAok = 0;
  function bwFail() {
    bwState = 3;
    try { console.warn('[SFX] Gagal memuat ' + BW_SND + ' (cek lokasi file: harus di folder assets/audio/ di samping index.html). Memakai cadangan.'); } catch (e) { }
    try {
      if (!bwA) { bwA = new Audio(BW_SND); bwA.preload = 'auto'; bwA.oncanplaythrough = () => { bwAok = 1; }; bwA.onerror = () => { bwAok = 0; }; bwA.onended = () => { BWM = 0; }; bwA.load(); }
    } catch (e) { }
  }
  function bwPrep() {
    if (bwState || !ac)
      return;
    bwState = 1;
    fetch(BW_SND).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(b => ac.decodeAudioData(b, x => { bwBuf = x; bwState = 2; }, () => { bwFail(); }))
      .catch(() => { bwFail(); });
  }
  function bwPlay() {
    if (!ac || !on)
      return false;
    if (!bwBuf) {
      if (bwState == 3 && bwA && bwAok) {
        try { bwA.volume = Math.min(1, .6 * xv * BW_GAIN); bwA.currentTime = 0; const q = bwA.play(); if (q && q.catch) q.catch(() => { BWM = 0; }); BWM = 1; return true; } catch (e) { return false; }
      }
      return false;
    }
    try {
      if (bwSrc) { try { bwSrc.stop(); } catch (e) { } }
      const s = ac.createBufferSource(), g = ac.createGain();
      s.buffer = bwBuf;
      g.gain.value = BW_GAIN * xv;
      s.connect(g);
      g.connect(mg);
      s.onended = () => { if (bwSrc === s) BWM = 0; };
      s.start();
      bwSrc = s;
      BWM = 1;
      return true;
    } catch (e) {
      return false;
    }
  }
  [OLDM, NEWM].forEach(M => {
    const o = { ult: M.ult };
    M.ult = function (w) {
      const wk = typeof w == 'number' ? w : (typeof wi == 'number' ? wi : 0);
      if (wk == 2) {
        bwPrep(); BWM = 0;
        const ok = bwPlay();
        try { msg(ok ? '[DEBUG SFX] Ulti Busur: MP3 dimainkan' : '[DEBUG SFX] Ulti Busur: MP3 BELUM siap (state=' + bwState + '), pakai suara lama'); } catch (e) { }
        if (ok) return;
      }
      return o.ult.apply(this, arguments);
    };
  });
  const GM = {};
  Object.keys(Object.assign({}, OLDM, NEWM)).forEach(k => {
    GM[k] = function () {
      const hp = typeof GFX !== 'undefined' && GFX.hp; if (sg)
        sg.gain.value = hp ? 1 : 1.25; const f = hp ? (OLDM[k] || NEWM[k]) : (NEWM[k] || OLDM[k]); return f.apply(null, arguments);
    };
  });

  // ===== SUARA BOS: auman / geraman / dengusan sintetis (sawtooth + formant + tremolo growl) =====
  const VOX = (f0, f1, dur, v, a, b, o = {}) => {
    if (!ac || !on || skip(v))
      return;
    X();
    v *= 2.5;
    const t0 = ac.currentTime + (o.dl || 0), gn = ac.createGain(), am = ac.createGain(), lf = ac.createOscillator(), lg = ac.createGain(), oss = [], at = o.at || .06;
    vq.push(t0 + dur + .1);
    [0, o.det == null ? 9 : o.det].forEach(c => {
      const os = ac.createOscillator(); os.type = o.type || 'sawtooth'; os.detune.value = c; os.frequency.setValueAtTime(f0, t0); if (o.pk)
        os.frequency.linearRampToValueAtTime(o.pk, t0 + dur * .3); os.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); oss.push(os);
    });
    const fl = [a, b].map(fr => { const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fr; f.Q.value = o.q || 4; oss.forEach(os => os.connect(f)); f.connect(gn); return f; });
    gn.gain.setValueAtTime(0, t0);
    gn.gain.linearRampToValueAtTime(v, t0 + at);
    gn.gain.setValueAtTime(v, t0 + Math.max(at + .01, dur * (o.hold || .3)));
    gn.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    am.gain.value = 1 - (o.ld || 0);
    lf.frequency.value = o.lfo || 1;
    lg.gain.value = o.ld || 0;
    if (o.lfo) {
      lf.connect(lg);
      lg.connect(am.gain);
    }
    gn.connect(am);
    let out = am, w = null;
    if (o.dist) {
      w = ac.createWaveShaper();
      w.curve = DC;
      am.connect(w);
      out = w;
    }
    const sn = fin(out, o);
    oss.forEach(os => { os.start(t0); os.stop(t0 + dur + .1); });
    if (o.lfo) {
      lf.start(t0);
      lf.stop(t0 + dur + .1);
    }
    oss[0].onended = () => {
      try {
        oss.forEach(x => x.disconnect());
        fl.forEach(x => x.disconnect());
        gn.disconnect();
        am.disconnect();
        lf.disconnect();
        lg.disconnect();
        w && w.disconnect();
        sn && sn.disconnect();
      } catch (e) { }
    };
  };
  const RATTLE = (n, v, gap = .06) => {
    for (let i = 0; i < n; i++)
      N(.02 + rnd() * .02, v * (.6 + rnd() * .6), 2200 + rnd() * 2600, 1200, 3, 'bandpass', i * (gap * (.6 + rnd() * .8)), { at: .001, pan: rnd() * 2 - 1 });
  };
  const BUBL = n => {
    for (let i = 0; i < n; i++)
      T(120 + rnd() * 120, 280 + rnd() * 240, .09, 'sine', .15, rnd() * .55, { at: .01, send: .3 });
  };
  const ROCKS = (n, v, span) => {
    for (let i = 0; i < n; i++)
      N(.05 + rnd() * .04, v, 900 + rnd() * 2500, 300, 2, 'bandpass', .15 + i * span / n + rnd() * .1, { dist: 1, at: .001, pan: rnd() * 2 - 1 });
  };
  // gemuruh sub-bass yang bergetar (tremolo + harmonik supaya terasa di speaker HP juga)
  const RUMBLE = (f0, f1, dur, v, rate, dl = 0) => {
    if (!ac || !on || skip(v))
      return;
    X();
    const t0 = ac.currentTime + dl, os = ac.createOscillator(), o2 = ac.createOscillator(), gn = ac.createGain(), am = ac.createGain(), lf = ac.createOscillator(), lg = ac.createGain(), w = ac.createWaveShaper();
    vq.push(t0 + dur + .1);
    os.type = 'sine';
    o2.type = 'triangle';
    w.curve = DC;
    os.frequency.setValueAtTime(f0, t0);
    os.frequency.exponentialRampToValueAtTime(Math.max(18, f1), t0 + dur);
    o2.frequency.setValueAtTime(f0 * 1.012, t0);
    o2.frequency.exponentialRampToValueAtTime(Math.max(18, f1 * 1.012), t0 + dur);
    gn.gain.setValueAtTime(0, t0);
    gn.gain.linearRampToValueAtTime(v, t0 + Math.min(.25, dur * .2));
    gn.gain.setValueAtTime(v, t0 + dur * .6);
    gn.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    am.gain.value = .45;
    lf.frequency.value = rate;
    lg.gain.value = .55;
    lf.connect(lg);
    lg.connect(am.gain);
    os.connect(gn);
    o2.connect(gn);
    gn.connect(am);
    am.connect(w);
    const sn = fin(w, { send: .3 });
    [os, o2, lf].forEach(x => { x.start(t0); x.stop(t0 + dur + .1); });
    os.onended = () => {
      try {
        [os, o2, lf, gn, am, lg, w].forEach(x => x.disconnect());
        sn && sn.disconnect();
      } catch (e) { }
    };
  };
  // auman berlapis: badan serak + sub-harmonik + nada disonan + jeritan serak + napas + gemuruh bergetar
  const ROAR = (b, dur, v, o = {}) => {
    const q = o.q || 1, lf = o.lfo || 22, at = o.at || .1;
    VOX(b, b * .45, dur, v, 420, 760, { at, lfo: lf, ld: .6, dist: 1, pk: b * 1.25, send: .55, det: 14 });
    VOX(b * .5, b * .22, dur, v * .8, 200, 420, { at: at + .05, lfo: lf * .5, ld: .55, dist: 1, send: .5, det: 22 });
    VOX(b * 1.06, b * .5, dur * .9, v * .55, 600, 1000, { dl: .03, at: .12, lfo: lf * 1.3, ld: .55, dist: 1, det: 45, send: .4 });
    VOX(b * 4, b * 2.2, dur * .55, v * .4, 1800, 3000, { dl: .02, at: .08, lfo: 38, ld: .6, dist: 1, q: 6, send: .5 });
    N(dur, .2 * q, 250, 2200, 1.1, 'bandpass', 0, { at: dur * .2, dist: 1, send: .5 });
    RUMBLE(b * .55, 24, dur * 1.1, .7 * q, o.rate || 11);
    SUB(b * .5, 26, dur, .6 * q);
  };
  // layar & HP ikut bergetar selama auman
  const QUAKE = (dur, amp) => {
    const n = Math.max(1, Math.round(dur / .08));
    for (let i = 0; i < n; i++)
      setTimeout(() => {
        try {
          shake = Math.max(shake, amp * (1 - i / n * .6));
        } catch (e) { }
      }, i * 80);
    try {
      if (navigator.vibrate)
        navigator.vibrate(Array.from({ length: Math.max(1, Math.round(dur / .13)) }, (_, i) => i % 2 ? 50 : 80));
    } catch (e) { }
  };
  return {
    swMp3: () => SWM, dgMp3: () => DGM, bwMp3: () => BWM, init, ready: () => !!ac, state: () => ac ? ac.state : 'none', opening, intro, cut, finale() {
      if (!ac)
        return; cut(); bigChord(ac.currentTime + .05, newIg());
    },
    sfxVol(v) {
      xv = Math.max(0, v); if (cg)
        cg.gain.value = xv; if (xr)
        xr.gain.value = xv; if (wg && wg.out)
        wg.out.gain.value = 1.1 * xv;
    },
    vol(v) {
      vl = v; if (oc)
        oc.gain.value = v; if (mu)
        mu.gain.value = .3 * v;
    },
    mode(m) {
      md = m; if (m == 'menu') {
        mt = 0;
        bi = 0;
      } if (ml)
        ml.gain.setTargetAtTime(m == 'menu' ? 1 : 0, ac.currentTime, .4);
    },
    isOn: () => on, toggle() {
      on = !on; if (mg)
        mg.gain.value = on ? .55 : 0;
    }, blip(f) { T(f, f * .86, .05, 'square', .028, 0, { lp: 2600 }); },
    bus(w) {
      if (wg)
        sg = w ? wg : cg;
    },
    ...GM
  };
})();
const R = Math.random, ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x), dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// Bonus hitbox serangan pemain terhadap musuh di Level 1 (Ancient Halls) — naikkan angka 6 jika masih sering meleset
const HB = () => {
  try {
    return !lobby && LVL == 1 ? 6 : 0;
  } catch (e) {
    return 0;
  }
}, HBA = (e, dd) => { const b = HB(); return b ? Math.asin(Math.min(1, (e.r + b) / Math.max(dd, 1))) : 0; };
const WP = [
  { n: 'Sword', cd: .3, hits: 3, dmg: 11, rng: 30, arc: 1.7, sc: ['STR'] },
  { n: 'Spear', cd: .38, hits: 3, dmg: 9, rng: 46, arc: .5, sc: ['STR', 'AGI'] },
  { n: 'Bow', cd: .4, hits: 3, dmg: 8, rng: 0, sc: ['AGI'] },
  { n: 'Staff', cd: .45, hits: 3, dmg: 7, rng: 0, sc: ['INT'] },
  { n: 'Daggers', cd: .18, hits: 3, dmg: 6, rng: 22, arc: 2, sc: ['AGI', 'STR'] }
];
const ET = {
  dummy: { hp: 9999, sp: 0, r: 8, c: '#c9a46b', sg: 99999, xp: 0, ht: 30 }, slime: { hp: 30, sp: 38, r: 7, c: '#5fd16a', sg: 20, xp: 10, ht: 28 }, skel: { hp: 55, sp: 48, r: 8, c: '#dfe3ea', sg: 45, xp: 25, ht: 30 }, mage: { hp: 35, sp: 34, r: 7, c: '#a55cff', sg: 25, xp: 20, ht: 28 }
};
const WB = () => [[0, 0, DW, 14], [0, DH - 14, DW, 14], [0, 0, 14, DH], [DW - 14, 0, 14, DH]], SHF = q => q.map(([x, y, w, h, k]) => k ? [x + OX, y + OY, w, h, k] : [x + OX, y + OY, w, h]);
const W0 = [
  ...WB(), ...SHF([[150, 90, 28, 28], [150, 282, 28, 28], [330, 186, 28, 28], [470, 90, 28, 28], [470, 282, 28, 28]]), [690, 126, 28, 28], [690, 326, 28, 28], [330, 404, 28, 28], [510, 404, 28, 28]
];
const W1 = [
  ...WB(), ...SHF([
    [96, 70, 28, 28, 'p'], [216, 70, 28, 28, 'p'], [396, 70, 28, 28, 'p'], [516, 70, 28, 28, 'p'], [96, 302, 28, 28, 'p'], [216, 302, 28, 28, 'p'], [396, 302, 28, 28, 'p'], [516, 302, 28, 28, 'p'], [288, 172, 64, 56, 'a'], [90, 255, 18, 18, 'c'], [500, 110, 18, 18, 'c'], [140, 110, 16, 18, 'b']
  ]),
  [696, 110, 28, 28, 'p'], [696, 342, 28, 28, 'p'], [176, 226, 28, 28, 'p'], [596, 226, 28, 28, 'p'], [120, 400, 18, 18, 'c'], [660, 400, 16, 18, 'b']
];
let lobby = true, trn = 0, walls = W0, room = 0, doorO = 0, doorOn = 0, fade = 0;
const A = { VIT: 5, STR: 5, DEF: 5, AGI: 5, INT: 5 };
let WSW = 0, MBD = 0, p, es = [], pr = [], fx = [], gh = [], dp = [], dr = [], wave = 1, shake = 0, lvl = 1, exp = 0, pts = 0, wi = 0, t = 0, clr = 0, msgS = '', msgT = 0;
let guide = false, SHX = 0, SHY = 0;
const mhp = () => 60 + A.VIT * 8;
const msg = s => { msgS = s; msgT = 3; };
const blk = (x, y, r) => walls.some(w => x + r > w[0] && x - r < w[0] + w[2] && y + r > w[1] && y - r < w[1] + w[3]);

function mv(o, dx, dy) {
  if (!blk(o.x + dx, o.y, o.r))
    o.x += dx; if (!blk(o.x, o.y + dy, o.r))
    o.y += dy;
}
const mk = (k, x, y) => ({
  k, x, y, vx: 0, vy: 0, ...ET[k], mhp: ET[k].hp, stg: 0, stun: 0, wind: 0, cd: 1 + R(), tx: 0, ty: 0, fl: 0, an: 0, ph: R() * 6, wk: 0, lx: x, ly: y
});

function spawn() {
  MBD = 0;
  pr = [];
  if (lobby) {
    es = [952, 1008, 1064].map(x => mkDummy(x));
    return;
  }
  const L = [
    ['slime', 360, 130], ['slime', 360, 350], ['skel', 500, 240], ['mage', 650, 120], ['mage', 650, 360], ['skel', 580, 180], ['slime', 480, 370],
    ['slime', 240, 220], ['skel', 330, 70], ['mage', 720, 70], ['skel', 620, 430]
  ];
  const L2 = [
    ['slime', 340, 170], ['slime', 340, 310], ['skel', 500, 190], ['mage', 660, 130], ['mage', 660, 350], ['skel', 580, 290], ['slime', 480, 80], ['mage', 280, 240],
    ['slime', 180, 410], ['skel', 420, 410], ['mage', 720, 420], ['skel', 700, 70]
  ];
  const ex = [];
  for (let j = 0, n = 0; j < HALF_EXTRA && n < 300; n++) {
    const x = 220 + R() * 520, y = 50 + R() * 380;
    if (!blk(x, y, 9)) {
      ex.push(['slime', x, y]);
      j++;
    }
  }
  if (room)
    for (let j = 0, n = 0; j < 2 * Math.max(0, wave - 7) && n < 400; n++) {
      const x = 200 + R() * 560, y = 50 + R() * 380;
      if (!blk(x, y, 9)) {
        ex.push([['skel', 'mage', 'slime'][j % 3], x, y]);
        j++;
      }
    } // gelombang 8-10: musuh tambahan
  es = (room ? L2 : L).slice(0, Math.min(8 + EXTRA_ENEMIES, 3 + wave + EXTRA_ENEMIES)).concat(ex).map(([k, x, y], i) => { const e = mk(k, x, y); e.hp = e.mhp = e.hp * (1 + Math.max(0, wave - 5) * .12); e.sd = i * .14; e.st = 1.1 + e.sd; e.sw = e.st; e.sx = 0; return e; });
  SFX.summon();
}

function reset() {
  const pot = p ? p.pot : 3; p = {
    x: lobby ? 320 : 60, y: lobby ? 320 : DY, vx: 0, vy: 0, r: 5, hp: mhp(), st: 100, stT: 0, face: 0, cdA: 0, combo: 0, comboT: 0, dod: 0, dx: 0, dy: 0, inv: 0, hold: 0, sc: [0, 0, 0], skb: 0, spn: 0, fa: 0, spv: 0, dsp: 0, ec: 0, focus: 0, pot, potC: 0, hurt: 0, swing: 0, dead: 0, recoil: 0, sd: 1, sa: 1, al: 0, rmax: .18, hn: 0, wb: 0, wph: 0, idt: 0, dfx: 0, an: null, buf: 0
  }; gh = []; dp = []; SQ = []; BH.on = 0; BH.t = 0; spawn();
}
/* BATTLE FOCUS (berapi-api): melee (Sword/Spear/Daggers) = attack speed + damage + lari; ranged (Bow/Staff) = speed + defense */
const FOCUS_MELEE = () => p && p.focus > 0 && (wi == 0 || wi == 1 || wi == 4), FOCUS_RANGED = () => p && p.focus > 0 && (wi == 2 || wi == 3);
const FOCUS_CFG = { dur: 10, atkSpd: 1.5, dmg: 1.5, runMelee: 1.3, runRanged: 1.3, defRanged: .55 };
const mul = () => { const w = WP[wi]; return (1 + (w.sc.reduce((s, k) => s + A[k], 0) / w.sc.length - 5) * .08) * (FOCUS_MELEE() ? FOCUS_CFG.dmg : 1); };

function dn(x, y, s, crit, col) { fx.push({ k: 't', x, y, s, col: col || (crit ? '#ffd34d' : '#fff'), crit, life: .8, max: .8 }); }

function hurt(d) {
  if (p.inv > 0 || p.dead > 0)
    return;
  d = d * 100 / (100 + A.DEF * 4);
  if (FOCUS_RANGED()) {
    d *= FOCUS_CFG.defRanged;
    fx.push({ k: 'ring', x: p.x, y: p.y, r: 12, w: 2, life: .25, max: .25, col: '#ffb347' });
  }
  p.hp -= d;
  p.inv = .5;
  p.hurt = .15;
  SFX.pain();
  shake = 4;
  dn(p.x, p.y - 10, Math.round(d), 0, '#f66');
  if (p.hp <= 0) {
    p.dead = 1.8;
    SFX.death();
    msg('Kau gugur. Kembali ke checkpoint terakhir...');
  }
}

function hit(e, d, sx, sy, kb = 70) {
  if (e.sw > 0)
    return;
  if (e.k == 'dummy')
    return hitDummy(e, d, sx, sy, kb);
  const c = R() < .15;
  d *= c ? 2 : 1;
  SFX.hit(c, e.k);
  if (e.k == 'boss' || e.mini)
    SFX.bossHurt(bossVid(e));
  ultGain(Math.min(d, Math.max(0, e.hp)));
  e.hp -= d;
  e.stg += d * 1.2;
  e.fl = .1;
  const a = Math.atan2(e.y - sy, e.x - sx);
  e.vx = Math.cos(a) * kb;
  e.vy = Math.sin(a) * kb;
  dn(e.x, e.y - 8, Math.round(d), c);
  impact(e, a, c);
  impact2(e, a, c);
  shake = Math.max(shake, c ? 5 : p.hn == 2 ? 4 : 2.5);
  if (!(wi == 1 && (p.dod > 0 && p.dsp > 0 || SG.rf > 0)))
    HST = Math.max(HST, c || p.hn == 2 ? .05 : .02);
  if (e.stg >= e.sg && !e.stun) {
    e.stun = 1.4;
    e.stg = 0;
    dn(e.x, e.y - 20, 'STAGGER', 0, '#ffd34d');
    SFX.stagger();
  }
  if (e.hp <= 0)
    kill(e);
}
const _hitCut = hit;
hit = function (e, d, sx, sy, kb) {
  const live = !(e.sw > 0); _hitCut(e, d, sx, sy, kb); if (!live)
    return; if (wi == 0 || wi == 4)
    cutMark(e);
  else if (wi == 1)
    spearMark(e);
  else if (wi == 2)
    arrowMark(e);
};

function bossVid(e) {
  if (!e || e.k == 'boss')
    return lavaOn() && room == 2 ? 'lava' : 'mino'; if (e.mini) {
      const L = lavaOn(), mel = e.mini == 'mel';
      if (e.ice)
        return mel ? 'ik' : 'it';
      return L ? (mel ? 'gl' : 'bl') : (mel ? 'kn' : 'ar');
    } return null;
}

function freeSpot(x, y) {
  for (const r of [0, 8, 16, 24, 32])
    for (let i = 0; i < 8; i++) {
      const a = i * .785, q = x + Math.cos(a) * r, w = y + Math.sin(a) * r;
      if (!blk(q, w, 5))
        return { x: q, y: w };
    } return { x: p.x, y: p.y };
}

// ===== EFEK KEMATIAN MINI BOS: tiap mini bos hancur dengan caranya sendiri =====
function miniDeath(e) {
  const id = bossVid(e), x = e.x, y = e.y - 6, ang = () => R() * 6.283, P = (n, f) => {
    for (let i = 0; i < n; i++)
      dp.push(f(i));
  };
  const ring = (r, w, col, life) => fx.push({ k: 'ring', x, y: y + 6, r, w, life, max: life, col });
  const shard = (n, c, v0, up) => P(n, () => {
    const a = ang(), v = v0 * (.4 + R()); return {
      k: 'sh', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .7 - up, rot: a, vr: (R() - .5) * 14, life: .8 + R() * .5, max: 1.3, s: 2 + R() * 2.6, c
    };
  });
  if (id == 'ik' || id == 'it') {
    iceMiniDeath(e, id);
    return;
  }
  HST = Math.max(HST, id == 'gl' ? .12 : .1);
  shake = Math.max(shake, id == 'gl' ? 14 : 10);
  if (id == 'kn') { // Skeleton Knight: tulang berhamburan, arwah hijau naik, lalu tulang jatuh berderak
    FLSH = .5;
    FLSC = '200,255,210';
    ring(46, 4, '#b8ffcc', .45);
    ring(78, 2, '#e8e0cc', .7);
    fx.push({ k: 'gl', x, y, r: 70, c: '150,255,190', life: .4, max: .4 });
    shard(18, '232,224,204', 150, 50);
    P(20, i => ({
      k: 'p', x: x + (R() - .5) * 16, y: y + R() * 6, vx: (R() - .5) * 30, vy: -40 - R() * 90, life: .7 + R() * .6, max: 1.3, s: 1.6 + R() * 2, c: i % 2 ? '#9dffb8' : '#e8fff0'
    }));
    puff(x, y + 6, 5, '120,125,110', 1.3);
    dn(x, y - 26, 'HANCUR!', 0, '#e8e0cc');
    skLater(.28, () => { shake = Math.max(shake, 5); ring(34, 2, '#e8e0cc', .3); shard(10, '232,224,204', 70, 10); });
  } else if (id == 'ar') { // Skeleton Archer: lenyap jadi kabut arwah, panah berhamburan
    FLSH = .45;
    FLSC = '150,255,235';
    ring(42, 3, '#8fffe0', .5);
    ring(70, 2, '#dffff8', .75);
    fx.push({ k: 'gl', x, y, r: 60, c: '140,255,230', life: .45, max: .45 });
    P(28, i => ({
      k: 'p', x: x + (R() - .5) * 18, y: y + (R() - .5) * 10, vx: (R() - .5) * 40, vy: -20 - R() * 60, life: .9 + R() * .7, max: 1.6, s: 2 + R() * 3, c: i % 2 ? '#8fffe0' : '#dffff8'
    }));
    P(10, () => ({ k: 'l', x, y, a: ang(), len: 30 + R() * 30, w: 2, cc: '#d8c9a0', life: .5, max: .5 }));
    shard(8, '232,224,204', 110, 40);
    puff(x, y, 6, '150,170,170', 1.4);
    dn(x, y - 26, 'LENYAP!', 0, '#8fffe0');
  } else if (id == 'gl') { // Lava Golem: retak, meledak jadi semburan lava + pecahan batu, ledakan susulan
    FLSH = .8;
    FLSC = '255,140,40';
    ring(60, 5, '#ff8a2a', .5);
    ring(100, 3, '#ffd34d', .75);
    fx.push({ k: 'gl', x, y, r: 120, c: '255,120,30', life: .5, max: .5 }, { k: 'pil', x, y, w: 70, h: 200, c: '255,140,50', life: .6, max: .6 });
    P(30, () => {
      const a = ang(), v = 40 + R() * 130; return {
        k: 'p', x, y, vx: Math.cos(a) * v * .8, vy: -80 - R() * 120, life: .6 + R() * .5, max: 1.1, s: 2 + R() * 3, c: ['#ffd34d', '#ff5a1f', '#ffb347'][R() * 3 | 0]
      };
    });
    shard(14, '80,62,56', 140, 60);
    puff(x, y, 8, '60,50,50', 1.8);
    dn(x, y - 26, 'RUNTUH!', 0, '#ffb347');
    skLater(.3, () => {
      SFX.boom(40); shake = Math.max(shake, 8); ring(50, 3, '#ff8a2a', .4); P(14, () => ({
        k: 'p', x: x + (R() - .5) * 20, y, vx: (R() - .5) * 90, vy: -70 - R() * 90, life: .5 + R() * .4, max: .9, s: 2 + R() * 2.5, c: R() < .5 ? '#ffd34d' : '#ff5a1f'
      }));
    });
    skLater(.6, () => { SFX.boom(28); ring(34, 2, '#ffd34d', .3); puff(x, y, 4, '70,60,60', 1.2); });
  } else if (id == 'bl') { // Blash Inferno: tubuh jadi pusaran api yang meledak keluar
    FLSH = .7;
    FLSC = '255,90,60';
    ring(54, 4, '#ff5a3a', .5);
    ring(84, 2, '#ffd34d', .75);
    fx.push({ k: 'gl', x, y, r: 100, c: '255,100,50', life: .5, max: .5 }, { k: 'pil', x, y, w: 56, h: 220, c: '255,100,50', life: .6, max: .6 });
    P(28, i => {
      const a = i / 28 * 12.566, v = 50 + i * 3; return {
        k: 'f', o: 1, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6 - 30, life: .5 + R() * .3, max: .8, s: 3 + R() * 3, c: i % 2 ? '#ff7a2a' : '#ffd34d'
      };
    });
    P(16, () => ({
      k: 'p', x: x + (R() - .5) * 14, y, vx: (R() - .5) * 50, vy: -60 - R() * 100, life: .7 + R() * .5, max: 1.2, s: 1.5 + R() * 2, c: '#ffb347'
    }));
    puff(x, y, 5, '70,40,30', 1.4);
    dn(x, y - 26, 'HANGUS!', 0, '#ff8a5a');
    skLater(.25, () => { SFX.boom(30); shake = Math.max(shake, 6); ring(44, 3, '#ff5a3a', .35); });
    skLater(.5, () => { ring(30, 2, '#ffd34d', .3); P(10, () => ({ k: 'p', x, y, vx: (R() - .5) * 60, vy: -50 - R() * 80, life: .6, max: .6, s: 2, c: '#ff7a2a' })); });
  }
}

function kill(e) {
  SFX.die(e.k);
  if (e.mini) {
    SFX.bossVo(bossVid(e), 'die');
    miniDeath(e);
  }
  burst(e);
  ultAdd(ULT_KILL);
  es = es.filter(x => x !== e);
  exp += e.xp;
  if (R() < dfx().drop) {
    const s = freeSpot(e.x, e.y);
    dr.push({ x: s.x, y: s.y, ph: R() * 6 });
  }
  while (exp >= lvl * 40) {
    exp -= lvl * 40;
    lvl++;
    pts += 3;
    msg('Level ' + lvl + '! +3 poin atribut (bagi di Ketua Orin, lobby)');
    SFX.level();
  }
}
const SH = [
  [
    { hn: 0, sd: 1, r: 30, arc: 1.7, lg: 60 }, { hn: 1, sd: -1, r: 30, arc: 1.7, lg: 60 }, { hn: 2, sd: 1, r: 40, arc: 2.5, lg: 130 }
  ], [
    { hn: 0, sd: 1, r: 46, arc: .5, lg: 70 }, { hn: 1, sd: -1, r: 40, arc: 1.5, lg: 50 }, { hn: 2, sd: 1, r: 68, arc: .45, lg: 170 }
  ], [], [], [
    { hn: 0, sd: 1, r: 24, arc: .7, lg: 60 }, { hn: 1, sd: -1, r: 24, arc: 1.6, lg: 60 }, { hn: 2, sd: 1, r: 32, arc: 2.6, lg: 90 }
  ]
];
const MELEE_R = 1.25, MELEE_A = 1.2;

function melee(r, arc, d, kb, sh) {
  if (!AN_KEEP)
    p.an = null;
  r *= MELEE_R;
  arc = arc >= 6.2 ? arc : arc < 1 ? Math.min(1, arc * 1.5) : Math.min(6.2, arc * MELEE_A);
  SFX.swing(wi, (sh || SH[wi][2] || {}).hn);
  sh = sh || SH[wi][2] || { hn: 2, sd: 1, lg: 50 };
  const a = p.face, sd = sh.sd;
  const lf = sh.lf || (wi == 0 || wi == 1 || wi == 4 ? .3 : .22);
  fx.push({ k: 'slash', x: p.x, y: p.y, a, arc, r, life: lf, max: lf, sd, w: wi, hn: sh.hn });
  for (let i = 0; i < 8; i++) {
    const q = a + sd * (-arc / 2 + arc * i / 7);
    dp.push({
      k: 'p', x: p.x + Math.cos(q) * r * .9, y: p.y + Math.sin(q) * r * .9, vx: -Math.sin(q) * sd * 40 + Math.cos(q) * 20, vy: Math.cos(q) * sd * 40 + Math.sin(q) * 20, life: .2 + R() * .15, max: .35, s: 1 + R() * 1.5, c: wi == 4 ? '#ffb48a' : wi == 1 ? '#ff9a9a' : '#e8f2ff'
    });
  }
  if (sh.hn == 2 && (wi == 0 || wi == 4)) {
    fx.push({
      k: 'ring', x: p.x + Math.cos(a) * r * .6 * (wi == 0), y: p.y + Math.sin(a) * r * .6 * (wi == 0), r: (wi == 0 ? 20 : 26) * MELEE_R, life: .3, max: .3, col: wi == 0 ? '#e8f2ff' : '#ffb48a'
    });
    shake = Math.max(shake, 2);
  }
  for (let i = 0; i < 10; i++) {
    const q = a + (R() - .5) * Math.min(arc, 3.5), d2 = r * (.6 + R() * .5);
    dp.push({
      k: 'p', x: p.x + Math.cos(q) * d2, y: p.y + Math.sin(q) * d2, vx: Math.cos(q) * 70, vy: Math.sin(q) * 70, life: .3 + R() * .25, max: .55, s: 1.5 + R() * 2, c: WCOL[wi]
    });
  }
  shake = Math.max(shake, 2.5);
  p.swing = .14;
  p.sd = sd;
  p.sa = arc;
  p.hn = sh.hn;
  p.vx += Math.cos(a) * sh.lg;
  p.vy += Math.sin(a) * sh.lg;
  if (!sh.nh)
    es.slice().forEach(e => {
      const dd = dist(p, e), da = Math.abs(((ang(p, e) - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (dd < r + e.r + HB() && (da < arc / 2 + HBA(e, dd) || dd < 8))
        hit(e, d, p.x, p.y, kb);
    });
}
// Sapuan area 360° untuk ultimate: semua musuh dalam radius pasti kena (tidak bergantung arah/arc)
function ultSweep(r, d, kb) {
  es.slice().forEach(e => {
    if (e.sw <= 0 && dist(p, e) < r + e.r + HB())
      hit(e, d, p.x, p.y, kb);
  });
}

function shoot(a, d, s, col, aoe = 0) {
  SFX.shot(aoe); if (aoe)
    fx.push({ k: 'rune', x: p.x, y: p.y + 4, life: .4, max: .4 }); p.recoil = .18; fx.push({ k: 'muzz', x: p.x + Math.cos(a) * 14, y: p.y + Math.sin(a) * 14, a, col, life: .18, max: .18, aoe }); pr.push({
      x: p.x + Math.cos(a) * 8, y: p.y + Math.sin(a) * 8, vx: Math.cos(a) * s, vy: Math.sin(a) * s, d, r: wi == 2 && !aoe ? 5 : 3, col, own: 'p', life: 1.2, aoe
    });
}

function boom(x, y, r, d) {
  SFX.boom(r); arcBlast(x, y, r); es.slice().forEach(e => {
    if (Math.hypot(e.x - x, e.y - y) < r + e.r + HB())
      hit(e, d, x, y, 90);
  });
}

// ===== ANIMASI SERANGAN DASAR v2: windup -> strike -> follow-through (keyframe + easing) =====
// Setiap hit punya keyframe sendiri. Damage/proyektil keluar tepat di akhir windup (hits[]),
// jadi ayunan terasa punya antisipasi, tenaga, dan pemulihan, bukan sekadar sapuan linear.
const AN_TW = 6.2832;
const AN_D = {
  ro: 0, ex: 0, lat: 0, sr: 0, sc: 1, lun: 0, so: 0, tr: 0, exA: 0, exB: 0, roA: 0, roB: 0, pull: 0, orb: 0, rec: 0
};
const AN_E = {
  lin: u => u, ios: u => .5 - .5 * Math.cos(Math.PI * u), o2: u => 1 - (1 - u) * (1 - u), o3: u => 1 - Math.pow(1 - u, 3), o4: u => 1 - Math.pow(1 - u, 4),
  io3: u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2
};
let AN_KEEP = 0;
const effArc = a => a >= 6.2 ? a : a < 1 ? Math.min(1, a * 1.5) : Math.min(6.2, a * MELEE_A);
const K_ = (t, v, e) => ({ t, v, e });

function anBuild(w, hn, big, A, s) {
  const a2 = A / 2, TW = AN_TW, K = K_;
  let kf, hits, cd, lf = .24;
  if (w == 0) { // PEDANG: tebas kiri, tebas balik kanan, lalu putar bilah & hantam besar
    if (hn == 0) {
      kf = [
        K(0, { so: 1 }), K(.05, { ro: -s * (a2 + .5), ex: -2.5, lun: -1.2, lat: -s * .8 }, 'ios'), K(.135, { ro: s * (a2 + .1), ex: 1.5, lun: 3.2 }, 'o3'), K(.2, { ro: s * (a2 + .3), ex: .6, lun: 2.2 }, 'o2'), K(.3, { so: 1 }, 'ios')
      ];
      hits = [.06];
      cd = .26;
    } else if (hn == 1) {
      kf = [
        K(0, { so: 1 }), K(.042, { ro: -s * (a2 + .55), ex: -2, lun: -1.5, lat: -s * 1.2 }, 'ios'), K(.12, { ro: s * (a2 + .12), ex: 2, lun: 4, lat: s * .4 }, 'o3'), K(.19, { ro: s * (a2 + .3), ex: .8, lun: 2.5 }, 'o2'), K(.27, { so: 1 }, 'ios')
      ];
      hits = [.05];
      cd = .24;
    } else {
      kf = [
        K(0, { so: 1 }), K(.055, { ro: -s * (a2 + .35), ex: -3, lun: -2.5, lat: -s * 1.5 }, 'o2'), K(.2, { ro: -s * (a2 + .2), ex: 1.5, lun: -1, sr: s * TW, sc: 1.18, tr: 1 }, 'ios'), K(.31, { ro: s * (a2 + .15), ex: 2, lun: 7, sr: s * TW, sc: 1.38 }, 'o4'), K(.42, { ro: s * (a2 + .4), ex: 1, lun: 5, sr: s * TW, sc: 1.22 }, 'o2'), K(.56, { sr: s * TW, so: 1 }, 'ios')
      ];
      hits = [.205];
      cd = .5;
      lf = .32;
    }
  } else if (w == 1) { // TOMBAK: tusuk cepat, sapu samping, lalu PUTAR tombak 2x dan tusukan dalam
    if (hn == 0) {
      kf = [
        K(0, {}), K(.055, { ex: -4.5, lun: -1.6 }, 'ios'), K(.135, { ex: 19, lun: 5.5, sc: 1.05 }, 'o4'), K(.19, { ex: 16, lun: 4.4, sc: 1.04 }, 'lin'), K(.3, {}, 'ios')
      ];
      hits = [.06];
      cd = .27;
      lf = .26;
    } else if (hn == 1) {
      kf = [
        K(0, {}), K(.05, { ro: -s * (a2 + .35), ex: -2, lun: -1.2, lat: -s * 1.5 }, 'ios'), K(.14, { ro: s * (a2 + .12), ex: 6, lun: 3.4, lat: s * .5 }, 'o3'), K(.2, { ro: s * (a2 + .25), ex: 3.5, lun: 2.2 }, 'o2'), K(.3, {}, 'ios')
      ];
      hits = [.055];
      cd = .26;
    } else {
      kf = [
        K(0, {}), K(.07, { ex: -3, lun: -2, lat: -s, sc: 1.02 }, 'o2'), K(.31, { ex: 3, lun: -.5, sr: s * TW * 2, tr: 1, sc: 1.1 }, 'ios'), K(.4, { ex: 30, lun: 11, sr: s * TW * 2, sc: 1.2 }, 'o4'), K(.47, { ex: 28, lun: 10, sr: s * TW * 2, sc: 1.18 }, 'lin'), K(.63, { sr: s * TW * 2 }, 'ios')
      ];
      hits = [.315];
      cd = .56;
      lf = .34;
    }
  } else if (w == 2) { // BUSUR berirama 4/4 (1 ketuk = .24s): hit1 "ta" - hit2 "ta-ta" (dua panah, setengah ketuk) - hit3 "TAAAN" (tarik pelan, tahan bergetar, lepas)
    if (hn == 0) {
      kf = [
        K(0, {}), K(.065, { pull: .9, ex: -1.8, ro: -.02, lun: .6 }, 'o2'), K(.075, { pull: 0, rec: 1, ex: 2.8, ro: .05, lun: -1.8 }, 'o3'), K(.15, { rec: .5, ex: 1, ro: .02, lun: -.6 }, 'lin'), K(.24, {}, 'o2')
      ];
      hits = [.075];
      cd = .24;
    } else if (hn == 1) {
      kf = [
        K(0, {}), K(.035, { pull: .8, ex: -1.3, lun: .4 }, 'o2'), K(.045, { pull: 0, rec: .8, ex: 2, lun: -1.2 }, 'o3'), K(.15, { pull: .85, ex: -1.2, rec: .1 }, 'ios'), K(.165, { pull: 0, rec: 1, ex: 2.8, ro: .05, lun: -1.9 }, 'o3'), K(.26, { rec: .4, ex: .8, lun: -.5 }, 'lin'), K(.34, {}, 'o2')
      ];
      hits = [.045, .165];
      cd = .24;
    } else {
      kf = [
        K(0, {}), K(.12, { pull: .55, ex: -1.6, ro: -.03, lun: .5 }, 'ios'), K(.25, { pull: 1, ex: -3, ro: -.05, lun: 1.4, rec: .35 }, 'ios'), K(.26, { pull: 0, rec: 1.5, ex: 5.5, ro: .09, lun: -3.4 }, 'o4'), K(.36, { rec: 1, ex: 2.5, lun: -1.5 }, 'o2'), K(.5, { rec: .3, ex: .6 }, 'o2'), K(.6, {}, 'ios')
      ];
      hits = [.26];
      cd = .48;
    }
  } else if (w == 3) { // TONGKAT berirama (1 ketuk = .3s): hit1 "ta" - hit2 "ta-ta" (dua orb) - hit3 "TAAAN" (orb mengembang, tongkat berputar, ledakan)
    if (hn == 0) {
      kf = [
        K(0, {}), K(.07, { ro: -.4, ex: -2.5, orb: 1, lat: -.8 }, 'o2'), K(.13, { ro: .12, ex: 5.5, orb: .5, lun: 2 }, 'o3'), K(.2, { ro: .04, ex: 3, orb: .3, lun: 1 }, 'o2'), K(.3, {}, 'ios')
      ];
      hits = [.075];
      cd = .3;
    } else if (hn == 1) {
      kf = [
        K(0, {}), K(.05, { ro: -.7, ex: -1.5, orb: 1, lat: -1 }, 'o2'), K(.1, { ro: .6, ex: 4, orb: .6, lat: 1, lun: 2 }, 'o3'), K(.17, { ro: -.35, ex: -1, orb: 1.1, lat: .5 }, 'o2'), K(.225, { ro: .45, ex: 4.2, orb: .6, lat: -.6, lun: 2.2 }, 'o3'), K(.3, { ro: .15, ex: 2, orb: .2, lun: 1 }, 'ios'), K(.38, {}, 'ios')
      ];
      hits = [.09, .22];
      cd = .3;
    } else {
      kf = [
        K(0, {}), K(.08, { ro: -.8, ex: -3, orb: 1.2, lat: -1.5 }, 'o2'), K(.28, { ro: -.15, ex: -1, sr: TW, orb: 2.4, tr: 1 }, 'ios'), K(.35, { ro: .1, ex: 8, sr: TW, orb: .9, lun: 3 }, 'o4'), K(.47, { ro: .04, ex: 5, sr: TW, orb: .5, lun: 1.5 }, 'o2'), K(.62, { sr: TW }, 'ios')
      ];
      hits = [.285];
      cd = .6;
    }
  } else { // BELATI: tusuk diagonal, tebas silang, lalu pusaran 360 dengan tangan menyilang
    if (hn == 0) {
      kf = [
        K(0, {}), K(.04, { ro: -s * .5, exA: -3, roA: -.35, lun: -1 }, 'ios'), K(.1, { ro: s * .1, exA: 14, exB: 3, roA: .15, lun: 3.4 }, 'o3'), K(.14, { ro: s * .18, exA: 11, exB: 2, lun: 2.6 }, 'o2'), K(.22, {}, 'ios')
      ];
      hits = [.045];
      cd = .19;
    } else if (hn == 1) {
      kf = [
        K(0, {}), K(.035, { ro: -s * (a2 + .4), exB: -2, roB: s * .3, lun: -1.2 }, 'ios'), K(.1, { ro: s * (a2 + .1), exA: 2, exB: 8, lun: 3.6 }, 'o3'), K(.145, { ro: s * (a2 + .25), exA: 1, exB: 5, lun: 2.4 }, 'o2'), K(.23, {}, 'ios')
      ];
      hits = [.04];
      cd = .2;
    } else {
      kf = [
        K(0, {}), K(.07, { roA: -.75, roB: .75, exA: 2, exB: 2, lun: -1.5 }, 'ios'), K(.26, { ro: s * TW, roA: -.2, roB: .2, exA: 9, exB: 9, lun: 4, sc: 1.15, tr: 1 }, 'o2'), K(.34, { ro: s * TW, exA: 5, exB: 5, lun: 2, sc: 1.08 }, 'o2'), K(.42, { ro: s * TW }, 'ios')
      ];
      hits = [.075];
      cd = .37;
      lf = .3;
    }
  }
  let tot = kf[kf.length - 1].t;
  if (big) { // charged: pemain sudah menahan, jadi windup dipangkas
    const h0 = hits[0], ws = .3, f = t => t <= h0 ? t * ws : t - h0 * (1 - ws);
    kf.forEach(k => k.t = f(k.t));
    hits = hits.map(f);
    cd = f(cd);
    tot = kf[kf.length - 1].t;
  }
  return { w, hn, big, kf, hits, cd, lf, tot, t: 0, cur: null, pv: null };
}

function anCh(AN, tt) {
  const K = AN.kf;
  tt = Math.max(0, Math.min(AN.tot, tt));
  let i = 0;
  while (i < K.length - 2 && tt > K[i + 1].t)
    i++;
  const a = K[i], b = K[i + 1], u = Math.min(1, Math.max(0, (tt - a.t) / Math.max(1e-4, b.t - a.t))), e = (AN_E[b.e] || AN_E.ios)(u), o = {};
  for (const k in AN_D) {
    const va = a.v[k] === undefined ? AN_D[k] : a.v[k], vb = b.v[k] === undefined ? AN_D[k] : b.v[k];
    o[k] = va + (vb - va) * e;
  }
  return o;
}

function anPose(AN) {
  const c = anCh(AN, AN.t), c2 = anCh(AN, AN.t - .03);
  c.srv = ((c.sr + c.ro) - (c2.sr + c2.ro)) / .03;
  if (AN.pv && AN.t < .06) {
    const w = AN_E.ios(AN.t / .06);
    for (const k in AN_D)
      c[k] = AN.pv[k] + (c[k] - AN.pv[k]) * w;
  } // sambung mulus dari pose hit sebelumnya
  AN.cur = c;
  return c;
}

function anTrail(cx, cy, r, ang, dir, tr, col, n) {
  n = n || 7;
  if (tr < .03 || !dir)
    return;
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a0 = ang - dir * i * .24, a1 = a0 - dir * .24;
    g.strokeStyle = col;
    g.globalAlpha = tr * (1 - i / n) * .75;
    g.lineWidth = 3.4 - i * .38;
    g.beginPath();
    g.arc(cx, cy, r, a0, a1, dir > 0);
    g.stroke();
  }
  g.restore();
}

function atk(h) {
  const w = WP[wi], n = p.combo % w.hits, fin = n == w.hits - 1, big = h > 0, W = wi;
  let m = mul();
  if (big)
    m *= 1 + Math.min(h, 1.5) * 1.3;
  else {
    p.combo = n + 1;
    if (fin)
      m *= 2;
  }
  const d = w.dmg * m, hn = big ? 2 : n;
  p.hn = hn;
  if (fin && !big)
    dn(p.x, p.y - 22, 'HIT 3  x2', 0, '#ffd34d');
  const sh = w.rng ? SH[wi][hn] : null, sd = sh ? sh.sd : 1, A = sh ? effArc(sh.arc * (big ? 1.3 : 1)) : 0, AN = anBuild(wi, hn, big, A, sd);
  if (FOCUS_MELEE()) {
    const fk = 1 / FOCUS_CFG.atkSpd;
    AN.kf.forEach(k => k.t *= fk);
    AN.hits = AN.hits.map(h => h * fk);
    AN.cd *= fk;
    AN.tot *= fk;
  } // Battle Focus: ayunan lebih cepat
  if (p.an && p.an.cur) {
    const pv = Object.assign({}, p.an.cur);
    pv.sr = wrapA(pv.sr);
    pv.ro = wrapA(pv.ro);
    AN.pv = pv;
  }
  p.an = AN;
  p.buf = 0;
  if (!big)
    p.comboT = AN.tot + .42;
  const ok = () => p.an === AN && wi === W && p.dead <= 0 && ULTT <= 0, at = (t, f) => skLater(t, () => {
    if (ok())
      f();
  });
  if (w.rng) {
    at(AN.hits[0], () => {
      AN_KEEP = 1;
      try {
        melee(sh.r * (big ? 1.35 : 1), sh.arc * (big ? 1.3 : 1), d, big || fin ? 150 : 70, Object.assign({}, sh, { lf: AN.lf }));
      } finally {
        AN_KEEP = 0;
      }
      if (hn == 2) {
        puff(p.x, p.y + 7, 3, '110,100,90', .6);
        if (wi == 1) {
          shake = Math.max(shake, 3.5);
        }
      }
    });
  } else if (wi == 2) {
    const bs = (o, dm, sp) => shoot(p.face + o, dm, sp, '#8bd17c'), rl = () => { p.recoil = 0; }, rn = big ? 2 : n, bt = k => { SFX.beat(2, rn, k); fx.push({ k: 'beat', x: p.x, y: p.y, a: p.face, w: 2, n: rn, life: .5, max: .5 }); };
    if (!big && n == 2)
      SFX.charge(2);
    if (big)
      at(AN.hits[0], () => { bs(0, d, 340); bs(.1, d, 340); bs(-.1, d, 340); rl(); shake = Math.max(shake, 3); bt(0); });
    else if (n == 0)
      at(AN.hits[0], () => { bs(0, d, 340); rl(); bt(0); });
    else if (n == 1) {
      at(AN.hits[0], () => { bs(-.05, d * .5, 380); rl(); bt(0); });
      at(AN.hits[1], () => { bs(.05, d * .5, 380); rl(); bt(1); });
    } else
      at(AN.hits[0], () => { bs(0, d, 430); const b = pr[pr.length - 1]; b.pierce = 1; b.big = 1; rl(); shake = Math.max(shake, 3); bt(0); });
  } else {
    const ss = (o, dm, ap, sp) => shoot(p.face + o, dm, sp, '#b48cff', ap), rl = () => { p.recoil = 0; }, rn = big ? 2 : n, bt = k => { SFX.beat(3, rn, k); fx.push({ k: 'beat', x: p.x, y: p.y, a: p.face, w: 3, n: rn, life: .5, max: .5 }); };
    if (!big && n == 2)
      SFX.charge(3);
    if (big)
      at(AN.hits[0], () => { ss(0, d, 40, 230); rl(); bt(0); });
    else if (n == 0)
      at(AN.hits[0], () => { ss(0, d, 24, 230); rl(); bt(0); });
    else if (n == 1) {
      at(AN.hits[0], () => { ss(-.14, d * .5, 22, 250); rl(); bt(0); });
      at(AN.hits[1], () => { ss(.14, d * .5, 22, 250); rl(); bt(1); });
    } else
      at(AN.hits[0], () => { ss(0, d, 48, 170); rl(); shake = Math.max(shake, 2.5); bt(0); });
  }
  p.rmax = .18;
  p.cdA = AN.cd;
}

// ===== SKILL BARU: 3 per senjata (Z X C) =====
let SQ = [];
const BH = { on: 0, t: 0, x: 0, y: 0, m: 1, tk: 0, pk: 0, cl: 0, ex: 0 };
const sk = (n, cd, dur, f) => ({ n, cd, dur, f });
const skLater = (t, f) => SQ.push({ t, f });
const skNear = (n, rg) => es.filter(e => e.sw <= 0 && dist(p, e) < rg).sort((a, b) => dist(p, a) - dist(p, b)).slice(0, n);

function skDash(a, sp, d) { p.dod = d; p.dsp = sp; p.dx = Math.cos(a); p.dy = Math.sin(a); p.inv = d + .1; p.dfx = 1; puff(p.x, p.y + 6, 3, '110,100,90', .8); }

function skLine(len, w, d, kb) {
  const a = Math.atan2(p.dy, p.dx), c = Math.cos(a), s = Math.sin(a); es.slice().forEach(e => {
    const dx = e.x - p.x, dy = e.y - p.y, f = dx * c + dy * s, q = Math.abs(-dx * s + dy * c); if (f > -8 && f < len * 1.1 && q < w * 1.3 + e.r + HB())
      hit(e, d, p.x, p.y, kb || 90);
  });
}

function skSpin(turns, dur) { p.fa = p.face; p.spv = turns * 6.283 / dur; p.spn = dur; }

function skTp(x, y) {
  if (!blk(x, y, p.r)) {
    p.x = x;
    p.y = y;
  }
}

function skBlink(a, L) {
  const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < L; i += 4) {
    if (blk(p.x + c * 4, p.y + s * 4, p.r))
      break;
    p.x += c * 4;
    p.y += s * 4;
  }
}

function skRain(x, y, d, rr = 21) {
  fx.push({
    k: 'ux', t: 'fall', s: 2, x, y, r: rr * 1.1, H: 150, tf: .55, life: .3, max: .3, c: '150,255,120', g: '255,235,150'
  }); dp.push({ k: 'l', x, y: y - 2, a: 1.5708, len: 86, w: 5, cc: '#b6ff8a', life: .24, max: .24 }); fx.push({ k: 'ring', x, y, r: 16, w: 3, life: .32, max: .32, col: '#b6ff8a' }, { k: 'gl', x, y, r: 30, c: '150,255,120', life: .26, max: .26 }); for (let i = 0; i < 7; i++) {
    const a = R() * 6.283, v = 40 + R() * 90;
    dp.push({
      k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6, life: .3 + R() * .2, max: .5, s: 2 + R() * 2, c: i % 2 ? '#b6ff8a' : '#fff'
    });
  } es.slice().forEach(e => {
    if (Math.hypot(e.x - x, e.y - y) < rr + e.r + HB())
      hit(e, d, x, y, 40);
  });
}
const tgt = () => { const d = Math.min(190, Math.hypot(M.x - p.x, M.y - p.y)), a = p.face; return [p.x + Math.cos(a) * d, p.y + Math.sin(a) * d]; };
const SK = [
  [
    sk('Cross Slash', 4, .4, (a, m) => { const S = (sd, r, ar, d, lg, h) => melee(r, ar, d * m, 120, { hn: h, sd, lg }); S(1, 46, 2, 15, 110, 0); skLater(.11, () => S(-1, 46, 2, 15, 110, 1)); skLater(.24, () => S(1, 58, 2.8, 26, 150, 2)); }),
    sk('Whirlwind', 8, .8, (a, m) => {
      skSpin(2, .7); for (let i = 0; i < 5; i++)
        skLater(i * .14, () => { melee(50, 2.6, 14 * m, 130, { hn: 0, sd: 1, lg: 20 }); fx.push({ k: 'ring', x: p.x, y: p.y, r: 58, life: .3, max: .3, col: '#9fd0ff' }); });
    }),
    sk('Heaven Split', 14, .6, (a, m) => {
      skDash(a, 380, .18); skLater(.22, () => {
        melee(66, 6.28, 50 * m, 200, { hn: 2, sd: 1, lg: 0 }); for (let i = 0; i < 3; i++)
          fx.push({ k: 'ring', x: p.x, y: p.y, r: 30 + i * 20, life: .35 + i * .1, max: .35 + i * .1, col: '#cfe6ff' }); for (let i = 0; i < 14; i++) {
            const q = R() * 6.283, v = 60 + R() * 120;
            dp.push({
              k: 'sh', x: p.x, y: p.y, vx: Math.cos(q) * v, vy: Math.sin(q) * v * .75, rot: q, vr: (R() - .5) * 12, life: .6, max: .6, s: 1.6 + R() * 2, c: '190,200,230'
            });
          } fx.push({ k: 'pil', x: p.x, y: p.y, w: 36, h: 160, c: '150,210,255', life: .55, max: .55 }); shake = Math.max(shake, 8); SFX.boom();
      });
    })
  ], [
    sk('Aegis Rush', 5, .5, (a, m) => {
      SG.bash = .5;
      skDash(a, 340, .16);
      skLater(.13, () => {
        const q = p.face; melee(54, 1.5, 18 * m, 300, { hn: 1, sd: 1, lg: 50 }); es.forEach(e => {
          if (e.sw <= 0 && dist(p, e) < 74 + e.r)
            e.stg += 26;
        }); sgFlash(p.x + Math.cos(q) * 30, p.y + Math.sin(q) * 30, 16); shake = Math.max(shake, 6);
      });
      skLater(.25, () => melee(66, .4, 14 * m, 170, { hn: 0, sd: 1, lg: 90 }));
      skLater(.37, () => melee(76, .42, 22 * m, 230, { hn: 2, sd: 1, lg: 110 }));
    }),
    sk('Bulwark Counter', 10, .95, (a, m) => {
      SG.g = SG.gm = .7;
      SG.hits = 0;
      p.vx *= .25;
      p.vy *= .25;
      fx.push({ k: 'ring', x: p.x, y: p.y, r: 30, w: 3, life: .7, max: .7, col: '#ffe08a' }, { k: 'rune', x: p.x, y: p.y + 4, life: .7, max: .7, sc: 1.6, w: 2 });
      // Setelah menahan, lepaskan serangan BERTUBI-TUBI: banyak tusukan cepat beruntun + tusukan penutup.
      // Makin banyak pukulan yang diblok, makin banyak & makin kuat tusukannya.
      skLater(.7, () => {
        const n = SG.hits, k = Math.min(n, 4), N = n > 0 ? 6 + 2 * k : 5, iv = .055, dm = (n > 0 ? 6 + 2 * k : 4.5) * m, T = N * iv;
        SG.g = 0;
        SG.hits = 0;
        SG.bash = T + .25;
        SG.rf = T - .01;
        p.skb = Math.max(p.skb, T + .2);
        fx.push({ k: 'ring', x: p.x, y: p.y, r: 24, w: 3, life: .3, max: .3, col: '#ffe08a' });
        for (let i = 0; i < N; i++)
          skLater(i * iv, () => {
            const b = p.face, q = b + (R() - .5) * .22;
            p.face = q;
            melee(78 + R() * 10, .34, dm, 70, { hn: 0, sd: 1, lg: 14 });
            dp.push({
              k: 'l', x: p.x + Math.cos(q) * 46, y: p.y - 2 + Math.sin(q) * 46, a: q, len: 54 + R() * 22, w: 4, cc: i % 2 ? '#ffe08a' : '#ffb0a0', life: .13, max: .13
            });
            sgSpark(p.x + Math.cos(q) * 70, p.y + Math.sin(q) * 70, 3);
            shake = Math.max(shake, 2);
            p.face = b;
          });
        skLater(T, () => {
          melee(98, .5, dm * 2.4, 230, { hn: 2, sd: 1, lg: 60 });
          shake = Math.max(shake, 6);
          sgFlash(p.x + Math.cos(p.face) * 50, p.y + Math.sin(p.face) * 50, 12);
          if (n > 0) {
            ultSweep(60, 8 * n * m, 230);
            sgFlash(p.x, p.y, 18);
            shake = Math.max(shake, 7);
            fx.push({ k: 'ring', x: p.x, y: p.y, r: 66, w: 4, life: .4, max: .4, col: '#ff5a5a' });
          }
        });
      });
    }),
    sk('Wyrmfang Charge', 13, .75, (a, m) => {
      SG.bash = .75;
      skDash(a, 460, .32);
      p.inv = Math.max(p.inv, .36);
      for (let i = 0; i < 6; i++)
        skLater(i * .055, () => {
          skLine(54, 14, 9 * m, 180); for (let j = 0; j < 6; j++)
            dp.push({
              k: 'gf', x: p.x, y: p.y, vx: (R() - .5) * 70, vy: (R() - .5) * 50, life: .4 + R() * .3, max: .7, s: 5 + R() * 6
            });
        });
      skLater(.34, () => {
        melee(86, 1.1, 26 * m, 260, { hn: 2, sd: 1, lg: 0 });
        sgFlash(p.x + Math.cos(a) * 40, p.y + Math.sin(a) * 40, 14);
        shake = Math.max(shake, 8);
        for (let j = 1; j <= 4; j++)
          skLater(j * .07, () => spRain(p.x + Math.cos(a) * (36 + j * 34), p.y + Math.sin(a) * (36 + j * 34), 14 * m, 28));
      });
    })
  ], [
    sk('Rapid Fire', 4, .55, (a, m) => {
      for (let i = 0; i < 7; i++)
        skLater(i * .07, () => { shootS(p.face + (R() - .5) * .12, 8 * m, 400, '#8bd17c'); p.vx -= Math.cos(p.face) * 35; p.vy -= Math.sin(p.face) * 35; });
    }),
    sk('Backflip Volley', 8, .5, (a, m) => {
      skDash(a + Math.PI, 340, .22); skLater(.1, () => {
        for (let i = -2; i <= 2; i++)
          shootS(p.face + i * .16, 9 * m, 380, '#8bd17c');
      }); skLater(.24, () => { shootS(p.face, 26 * m, 460, '#ffe08a'); const b = pr[pr.length - 1]; b.pierce = 1; b.big = 1; });
    }),
    sk('Arrow Rain', 13, 1.6, (a, m) => {
      const [tx, ty] = tgt(); fx.push({ k: 'ring', x: tx, y: ty, r: 55, w: 3.5, life: 1.3, max: 1.3, col: '#ff5a5a', fill: 1 }, { k: 'ring', x: tx, y: ty, r: 38, w: 2, life: 1.3, max: 1.3, col: '#ffb0a0' }, { k: 'rune', x: tx, y: ty, life: 1.3, max: 1.3, sc: 3.2, w: 2 }, { k: 'gl', x: tx, y: ty, r: 80, c: '255,110,100', life: 1.1, max: 1.1 }); for (let i = 0; i < 16; i++)
        skLater(.45 + i * .07, () => { const q = R() * 6.283, d = Math.sqrt(R()) * 55; skRain(tx + Math.cos(q) * d, ty + Math.sin(q) * d, 10 * m); });
    })
  ], [
    sk('Arcane Burst', 4, .5, (a, m) => { const [tx, ty] = tgt(); fx.push({ k: 'rune', x: tx, y: ty, life: .6, max: .6, sc: 2.6, w: 2.5 }); boomS(tx, ty, 44, 24 * m); skLater(.3, () => boomS(tx, ty, 58, 26 * m)); }),
    sk('Blink Nova', 8, .4, (a, m) => {
      const ox = p.x, oy = p.y; gh.push({ x: ox, y: oy, life: .4, max: .4, ph: p.wph }); fx.push({ k: 'ring', x: ox, y: oy, r: 22, w: 4, life: .4, max: .4, col: '#d6f' }, { k: 'gl', x: ox, y: oy, r: 34, c: '210,120,255', life: .3, max: .3 }); puff(ox, oy, 4, '50,28,80', 1); skBlink(a, 110); p.inv = .45; {
        const dx = p.x - ox, dy = p.y - oy;
        dp.push({
          k: 'l', x: p.x, y: p.y, a: Math.atan2(dy, dx), len: Math.hypot(dx, dy) + 12, w: 8, cc: '#e6b8ff', life: .38, max: .38
        });
      } fx.push({ k: 'rune', x: p.x, y: p.y + 4, life: .55, max: .55, sc: 2.1, w: 2 }); skLater(.1, () => boomS(p.x, p.y, 54, 24 * m));
    }),
    sk('Meteor Storm', 14, 2, (a, m) => {
      const [tx, ty] = tgt(); for (let i = 0; i < 6; i++)
        skLater(i * .28, () => {
          const q = R() * 6.283, d = R() * 60, x = tx + Math.cos(q) * d, y = ty + Math.sin(q) * d; fx.push({ k: 'ring', x, y, r: 32, w: 3.5, life: .5, max: .5, col: '#d6f', fill: 1 }, { k: 'rune', x, y, life: .5, max: .5, sc: 1.7, w: 2 }); for (let j = 0; j < 6; j++)
            skLater(j * .075, () => { const u = j / 5, hx = x - 34 + 34 * u, hy = y - 120 + 120 * u; dp.push({ k: 'l', x: hx, y: hy, a: 1.3, len: 56, w: 7, cc: '#e6b8ff', life: .18, max: .18 }); fx.push({ k: 'gl', x: hx, y: hy, r: 20, c: '215,150,255', life: .16, max: .16 }); }); skLater(.5, () => boomS(x, y, 36, 22 * m));
        });
    })
  ], [
    sk('Shadow Dash', 4, .5, (a, m) => { skDash(a, 400, .2); skLater(.04, () => skLine(40, 12, 10 * m)); skLater(.1, () => skLine(40, 12, 10 * m)); skLater(.22, () => melee(30, 2.6, 12 * m, 90, { hn: 0, sd: 1, lg: 40 })); skLater(.32, () => melee(30, 2.6, 12 * m, 90, { hn: 1, sd: -1, lg: 40 })); }),
    sk('Blade Burst', 8, .45, (a, m) => { skSpin(1, .3); shrThrow(a, m); }),
    sk('Phantom Flurry', 13, 1.2, (a, m) => {
      const T = skNear(4, 260), L = T.length ? T : [null, null, null];
      L.forEach((e, i) => skLater(i * .17, () => {
        const ox = p.x, oy = p.y;
        if (e && es.includes(e)) {
          const q = Math.atan2(e.y - p.y, e.x - p.x);
          skTp(e.x - Math.cos(q) * 18, e.y - Math.sin(q) * 18);
          p.face = q;
        } else
          skBlink(p.face + (i - 1) * .5, 70);
        gh.push({ x: ox, y: oy, life: .4, max: .4, ph: p.wph });
        fx.push({ k: 'ring', x: ox, y: oy, r: 10, life: .3, max: .3, col: '#ffb48a' });
        p.inv = .3;
        melee(26, 2.6, 16 * m, 100, { hn: i % 2, sd: i % 2 ? -1 : 1, lg: 0 });
        if (e)
          fx.push({ k: 'xm', x: e.x, y: e.y, a: .5, life: .3, max: .3 });
      }));
      skLater(L.length * .17, () => { skSpin(1, .25); melee(36, 6.28, 34 * m, 190, { hn: 2, sd: 1, lg: 0 }); });
    })
  ]
];

/* ===== REVAMP SPEAR: Crimson Dragon Aegis (perisai tema naga merah, dipegang tangan satunya) ===== */
const SG = { g: 0, gm: 0, hits: 0, bash: 0, fl: 0, bt: 1, rf: 0 };

function sgSpark(x, y, n) {
  for (let i = 0; i < n; i++) {
    const q = R() * 6.283, v = 50 + R() * 110;
    dp.push({
      k: 'p', x, y, vx: Math.cos(q) * v, vy: Math.sin(q) * v, life: .25 + R() * .2, max: .45, s: 1 + R() * 2, c: i % 2 ? '#ffe08a' : '#fff'
    });
  }
}

function sgFlash(x, y, n) { sgSpark(x, y, n); fx.push({ k: 'ring', x, y, r: 30, w: 4, life: .3, max: .3, col: '#ffe08a' }, { k: 'gl', x, y, r: 40, c: '255,200,120', life: .25, max: .25 }); SFX.hit(1); }
const _hurtSG = hurt;
hurt = function (d) {
  if (SG.g > 0 && p.dead <= 0) {
    SG.hits = Math.min(6, SG.hits + 1);
    SG.fl = .22;
    sgFlash(p.x + Math.cos(p.face) * 14, p.y - 6 + Math.sin(p.face) * 14, 8);
    dn(p.x, p.y - 22, 'BLOCK', 0, '#ffe08a');
    shake = Math.max(shake, 3);
    if (!(p.dod > 0 && p.dsp > 0))
      HST = Math.max(HST, .04);
    return;
  }
  return _hurtSG(d);
};
const _updSG = upd;
upd = function (dt) {
  const b0 = SG.bash; SG.g = Math.max(0, SG.g - dt); SG.bash = Math.max(0, SG.bash - dt); SG.fl = Math.max(0, SG.fl - dt); SG.rf = Math.max(0, SG.rf - dt); if (p && p.dead > 0) {
    SG.g = 0;
    SG.hits = 0;
  } _updSG(dt); if (SG.bash > b0)
    SG.bt = 0;
  else
    SG.bt += dt;
};

function drawShield(x, y, sc, gk, fl) {
  g.save();
  g.translate(Math.round(x), Math.round(y));
  g.scale(sc, sc);
  const sh = () => { g.beginPath(); g.moveTo(-7, -8); g.quadraticCurveTo(0, -10.5, 7, -8); g.lineTo(7, 1); g.quadraticCurveTo(6, 8, 0, 12.5); g.quadraticCurveTo(-6, 8, -7, 1); g.closePath(); };
  if (gk > 0 || fl > 0) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    const q = g.createRadialGradient(0, 0, 2, 0, 0, 26);
    q.addColorStop(0, 'rgba(255,205,130,' + ((gk > 0 ? .3 : 0) + fl * 1.2 + .1 * Math.sin(t * 20)) + ')');
    q.addColorStop(1, 'rgba(255,60,80,0)');
    g.fillStyle = q;
    g.fillRect(-28, -28, 56, 56);
    g.restore();
  }
  g.save();
  g.scale(1.22, 1.16);
  sh();
  g.fillStyle = HT || '#0f0e14';
  g.fill();
  g.restore();
  sh();
  g.fillStyle = HT || '#8f1a30';
  g.fill();
  g.save();
  sh();
  g.clip();
  g.fillStyle = HT || '#c42a48';
  g.fillRect(-8, -11, 8, 26);
  g.fillStyle = HT || '#6b1224';
  g.fillRect(4, -11, 4, 26);
  if (!HT) {
    g.fillStyle = 'rgba(255,130,150,.35)';
    for (let yy = -6; yy < 11; yy += 4)
      for (let xx = -6 + ((yy / 4) & 1 ? 2 : 0); xx < 7; xx += 4)
        g.fillRect(xx, yy, 2, 1);
  }
  g.fillStyle = HT || '#d9aa3c';
  g.beginPath();
  g.moveTo(0, -6);
  g.lineTo(3, -1);
  g.lineTo(0, 4);
  g.lineTo(-3, -1);
  g.closePath();
  g.fill();
  g.fillRect(-.5, 4, 1, 5);
  g.fillStyle = HT || '#ffe08a';
  g.beginPath();
  g.moveTo(0, -6);
  g.lineTo(-3, -1);
  g.lineTo(0, 1);
  g.closePath();
  g.fill();
  g.restore();
  sh();
  g.lineWidth = 1.6;
  g.strokeStyle = HT || '#aeb4c2';
  g.stroke();
  if (!HT) {
    g.save();
    sh();
    g.clip();
    g.strokeStyle = '#eef1f7';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-7, 1);
    g.lineTo(-7, -8);
    g.quadraticCurveTo(0, -10.5, 7, -8);
    g.stroke();
    g.restore();
  }
  g.fillStyle = HT || '#d9aa3c';
  [-1, 1].forEach(d => { g.beginPath(); g.moveTo(d * 6, -8); g.lineTo(d * 9.5, -12.5); g.lineTo(d * 3.5, -9); g.closePath(); g.fill(); });
  g.restore();
}
const _wposeSG = wpose;
wpose = function () {
  const o = _wposeSG();
  if (wi != 1)
    return o;
  const hs = HSd, f = p.face, cf = Math.cos(f), sf = Math.sin(f), s = hs >= 0 ? -1 : 1, bl = p.dod > 0 ? 1 : p.wb, bob = Math.abs(Math.sin(p.wph)) * 1.5 * bl + Math.sin(p.idt) * .5, k = p.swing > 0 ? 1 : p.al, Cx = p.x + o.lx, Cy = p.y - 8 - bob + o.ly, H = { ox: Math.round(p.x + o.lx), oy: Math.round(p.y - 10 - bob + o.ly), st: Math.sin(p.wph) * bl }, gk = SG.g > 0 ? 1 : 0, bk = Math.min(1, SG.bash / .25, SG.bt / .07), fw = Math.max(gk, bk);
  const rx = H.ox + s * 10, ry = H.oy + 12 - Math.round(s * H.st * 1.5), bx = Cx + s * 8 + cf * 3, by = Cy + 3 + sf * 3, fx0 = p.x + cf * (9 + bk * 9), fy0 = p.y - 7 + sf * (9 + bk * 9);
  const hx = lp(lp(rx, bx, k), fx0, fw), hy = lp(lp(ry, by, k), fy0, fw), cx = hx + s * (fw > 0 ? 0 : 3.5), cy = hy + 1, sc = 1 + gk * .3 + bk * .15, old = o.fn;
  o.gr.push({ x: hx, y: hy, s });
  o.fn = () => {
    if (old)
      old(); drawShield(cx, cy, sc, gk, SG.fl);
  };
  return o;
};

// ===== EFEK TEBAL =====
const WCL = ['110,175,255', '255,70,70', '150,255,120', '200,120,255', '255,120,100'], WCOL = ['#bfe4ff', '#ff8a8a', '#b6f08a', '#e6b8ff', '#ff9a8a'];
let FLSH = 0, FLSC = '255,255,255', HST = 0;

function skCast(i) {
  p.an = null; p.buf = 0; FLSH = i == 2 ? .9 : .5; FLSC = WCL[wi]; shake = Math.max(shake, i == 2 ? 6 : 3); fx.push({
    k: 'ring', x: p.x, y: p.y, r: i == 2 ? 38 : 26, w: wi == 2 || wi == 3 ? 3.5 : 1, life: .45, max: .45, col: 'rgb(' + WCL[wi] + ')'
  }); if (wi != 1)
    HST = Math.max(HST, i == 2 ? .07 : .04);
}

function pilFx(f, k) { const gr = g.createLinearGradient(0, f.y, 0, f.y - f.h); gr.addColorStop(0, 'rgba(' + f.c + ',' + k * .8 + ')'); gr.addColorStop(1, 'rgba(' + f.c + ',0)'); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; const w = f.w * (.4 + k * .6); g.fillRect(f.x - w / 2, f.y - f.h, w, f.h); g.fillStyle = 'rgba(255,255,255,' + k * .7 + ')'; g.fillRect(f.x - w / 6, f.y - f.h * .8, w / 3, f.h * .8); g.restore(); }

function gflame(q, k) { const a = 1 - k, r = q.s * (1.3 - a * .7), c1 = a < .25 ? '255,225,215' : a < .55 ? '255,90,70' : '200,25,25'; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 2); gr.addColorStop(0, 'rgba(' + c1 + ',' + k * .9 + ')'); gr.addColorStop(.5, 'rgba(255,60,40,' + k * .45 + ')'); gr.addColorStop(1, 'rgba(130,10,10,0)'); g.fillStyle = gr; g.beginPath(); g.arc(q.x, q.y, r * 2, 0, 7); g.fill(); g.restore(); }

/* ===== Efek tebasan baru: Sword & Daggers ===== */
// bilah runcing (lensa) sepanjang sumbu +x
function lens(x0, x1, w, rgb, al) {
  if (x1 - x0 < .5)
    return; g.fillStyle = 'rgba(' + rgb + ',' + al + ')'; g.beginPath(); g.moveTo(x0, 0); g.quadraticCurveTo((x0 + x1) / 2, -w, x1, 0); g.quadraticCurveTo((x0 + x1) / 2, w, x0, 0); g.fill();
}
// bulan sabit meruncing: ekor tipis & memudar, ujung kepala tajam & terang
function crescent(R, aT, aH, th, rgb, al, pw) {
  const N = 26, d = aH - aT;
  if (Math.abs(d) < .02)
    return;
  let fill = 'rgba(' + rgb + ',' + al + ')';
  if (g.createConicGradient) {
    const fr = Math.min(.999, Math.abs(d) / 6.2832), hd = d > 0, cg = g.createConicGradient(Math.min(aT, aH), 0, 0);
    cg.addColorStop(0, 'rgba(' + rgb + ',' + (hd ? .04 : al) + ')');
    cg.addColorStop(Math.max(.002, fr), 'rgba(' + rgb + ',' + (hd ? al : .04) + ')');
    fill = cg;
  }
  g.fillStyle = fill;
  g.beginPath();
  for (let i = 0; i <= N; i++) {
    const u = i / N, a = aT + d * u, s = Math.sin(Math.PI * Math.pow(u, pw)), r = R + th * .22 * s;
    i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  for (let i = N; i >= 0; i--) {
    const u = i / N, a = aT + d * u, s = Math.sin(Math.PI * Math.pow(u, pw)), r = R - th * .78 * s;
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
}
// tanda sayatan di musuh saat terkena Sword / Daggers
function cutFx(f, k) {
  const a = 1 - k, L = f.L * (.5 + .5 * Math.min(1, a * 3.2));
  g.save();
  g.translate(f.x, f.y);
  g.globalCompositeOperation = 'lighter';
  g.rotate(f.a);
  lens(-L, L, f.w * 1.8 * k + 1, f.c, k * .6);
  lens(-L, L, f.w * k + .5, '255,255,255', k);
  g.rotate(-f.a);
  for (let i = 0; i < 6; i++) {
    const q = i / 6 * 6.283 + f.a2, d = 5 + a * 16 * (.6 + (i % 3) * .3);
    g.fillStyle = i % 2 ? 'rgba(' + f.c + ',' + k + ')' : 'rgba(255,255,255,' + k + ')';
    g.fillRect(Math.round(Math.cos(q) * d) - 1, Math.round(Math.sin(q) * d) - 1, 2, 2);
  }
  g.restore();
}

function cutMark(e) {
  const dg = wi == 4, a = dg ? R() * 3.14 - 1.57 : p.face + (p.sd || 1) * (1.1 + (R() - .5) * .5), c = dg ? '255,110,90' : p.hn == 2 ? '255,210,110' : '120,190,255';
  fx.push({
    k: 'cut', x: e.x, y: e.y - 2, a, a2: R() * 6, L: dg ? 15 : 22 + (p.hn == 2 ? 8 : 0), w: dg ? 3 : 4, c, life: .2, max: .2
  });
  if (dg && p.hn == 2)
    fx.push({ k: 'cut', x: e.x, y: e.y - 2, a: a + 1.3, a2: R() * 6, L: 13, w: 3, c, life: .2, max: .2 });
}
// mata tombak berbentuk daun, runcing ke +x
function leaf(x, s, rgb, al) { g.fillStyle = 'rgba(' + rgb + ',' + al + ')'; g.beginPath(); g.moveTo(x + 14 * s, 0); g.quadraticCurveTo(x + 2 * s, -12 * s, x - 9 * s, 0); g.quadraticCurveTo(x + 2 * s, 12 * s, x + 14 * s, 0); g.fill(); }
// efek tembus saat tombak mengenai musuh
function pierceFx(f, k) {
  const a = 1 - k, e = Math.min(1, a * 3.2), Lg = f.L * (.35 + .65 * e);
  g.save();
  g.translate(f.x, f.y);
  g.globalCompositeOperation = 'lighter';
  g.rotate(f.a);
  g.lineJoin = 'round';
  lens(-10, Lg, 11 * k + 1, '255,70,80', k * .5);
  lens(-10, Lg, 4.5 * k + .5, '255,255,255', k);
  for (let i = 0; i < 2; i++) {
    const x = 6 + a * (24 + i * 14), h = (7 + i * 4) * (1 + a);
    g.strokeStyle = 'rgba(255,' + (150 + i * 60) + ',130,' + k * (.9 - i * .3) + ')';
    g.lineWidth = 2.4 - i;
    g.beginPath();
    g.moveTo(x - 9, -h);
    g.lineTo(x, 0);
    g.lineTo(x - 9, h);
    g.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const rn = Math.abs(Math.sin(f.x * 3.1 + f.y * 1.7 + i * 23.3) * 7919.1) % 1, x = 4 + a * (20 + rn * 30), y = (i % 2 ? 1 : -1) * rn * 10 * (.5 + a);
    g.fillStyle = i % 2 ? 'rgba(255,150,120,' + k + ')' : 'rgba(255,255,255,' + k + ')';
    g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
  }
  g.rotate(-f.a);
  g.strokeStyle = 'rgba(255,200,190,' + k + ')';
  g.lineWidth = 2 * k + .5;
  g.beginPath();
  g.arc(0, 0, 3 + a * 13, 0, 7);
  g.stroke();
  g.restore();
}
// kilau bintang + riak (dipakai bow & ledakan arkana)
function flareFx(f, k) {
  const a = 1 - k, L = f.L * (.4 + .6 * Math.min(1, a * 3));
  g.save();
  g.translate(f.x, f.y);
  g.globalCompositeOperation = 'lighter';
  g.rotate(f.a);
  for (let i = 0; i < 4; i++) {
    g.save();
    g.rotate(i * Math.PI / 2);
    const l = i % 2 ? L * .5 : L;
    lens(0, l, 6 * k + 1, f.c, k * .5);
    lens(0, l, 2.4 * k + .4, '255,255,255', k);
    g.restore();
  }
  g.rotate(-f.a);
  g.strokeStyle = 'rgba(' + f.c + ',' + k + ')';
  g.lineWidth = 2 * k + .5;
  g.beginPath();
  g.arc(0, 0, 3 + a * f.R, 0, 7);
  g.stroke();
  for (let i = 0; i < 5; i++) {
    const q = i * 1.2566 + f.a, d = 4 + a * f.R * 1.3;
    g.fillStyle = i % 2 ? 'rgba(' + f.c + ',' + k + ')' : 'rgba(255,255,255,' + k + ')';
    g.fillRect(Math.round(Math.cos(q) * d) - 1, Math.round(Math.sin(q) * d) - 1, 2, 2);
  }
  g.restore();
}

function spearMark(e) { fx.push({ k: 'pierce', x: e.x, y: e.y - 2, a: ang(p, e), L: p.hn == 2 ? 54 : 38, life: .26, max: .26 }); }

function arrowMark(e) {
  fx.push({
    k: 'flare', x: e.x, y: e.y - 2, a: ang(p, e), L: p.hn == 2 ? 30 : 22, R: p.hn == 2 ? 18 : 12, c: '150,255,120', life: .24, max: .24
  });
}
// proyektil pemain: panah (bow) & bola sihir (staff)
function projFx(b) {
  const a = Math.atan2(b.vy, b.vx), sk = b.sk ? 1.35 : 1;
  g.save();
  g.translate(b.x, b.y);
  g.rotate(a);
  g.globalCompositeOperation = 'lighter';
  if (b.aoe) {
    const L = 40 * sk * (b.aoe > 30 ? 1.3 : 1), w = 6 + b.aoe * .1;
    lens(-L * 1.25, 2, w * 1.9, '170,100,255', .45);
    lens(-L, 2, w * 1.1, '225,180,255', .7);
    lens(-L * .55, 2, w * .45, '255,255,255', .9);
    for (let i = 0; i < 3; i++) {
      const x = -L * (.35 + i * .25), y = Math.sin(t * 14 + i * 2.1) * w * .6;
      g.fillStyle = 'rgba(240,210,255,' + (.8 - i * .2) + ')';
      g.fillRect(Math.round(x), Math.round(y) - 1, 2, 2);
    }
  } else if (b.kn) {
    const L = 26 * sk, w = 4 * (b.sk ? 2 : 1), tg = g.createLinearGradient(-L, 0, 0, 0);
    tg.addColorStop(0, 'rgba(255,150,120,0)');
    tg.addColorStop(1, 'rgba(255,150,120,.75)');
    g.fillStyle = tg;
    g.fillRect(-L, -w / 2, L, w);
  } else {
    const big = b.big, L = (big ? 70 : 42) * sk, w = (big ? 8 : 4) * (b.sk ? 2 : 1);
    if (big) {
      lens(-L * 1.05, 4, w * 1.9, '255,205,110', .4);
      for (let i = 0; i < 4; i++) {
        g.strokeStyle = 'rgba(255,230,160,' + (.7 - i * .15) + ')';
        g.lineWidth = 1.5;
        g.beginPath();
        g.ellipse(-8 - i * L * .17, 0, 2 + i * .4, 5 + i * 1.3, 0, 0, 7);
        g.stroke();
      }
    }
    lens(-L, 3, w * 1.5, '150,255,120', .45);
    lens(-L * .72, 3, w * .8, '215,255,200', .75);
    lens(-L * .4, 4, w * .32 + .5, '255,255,255', .95);
    g.strokeStyle = 'rgba(200,255,180,.4)';
    g.lineWidth = 1;
    for (const y of [-5, 5]) {
      g.beginPath();
      g.moveTo(-L * .5, y);
      g.lineTo(-4, y * .5);
      g.stroke();
    }
    g.fillStyle = 'rgba(255,255,255,.95)';
    g.fillRect(6, -1, 3, 2);
    if (b.sk) {
      g.fillStyle = 'rgba(255,255,255,.9)';
      g.fillRect(-L * .55, -w * .15, L * .55, Math.max(2, w * .3));
    }
  }
  g.restore();
}

function slashFx2(f, pg) {
  const w = f.w, fd = 1 - pg * pg;
  g.save();
  g.translate(f.x, f.y);
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  g.globalAlpha = fd;
  if (w == 1 && f.hn != 1) {
    const big = f.hn == 2, ez = 1 - Math.pow(1 - Math.min(1, pg * 2.4), 3), c = Math.max(0, Math.min(1, (pg - .3) / .7)), fa = 1 - c, L = f.r * (big ? 1.15 : 1.05), tip = 6 + L * ez, tail = Math.max(2, tip - L * 1.25 * (1 - c * c)), glow = big ? '255,200,90' : '255,70,80', mid = big ? '255,228,160' : '255,140,120';
    g.rotate(f.a);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    // garis kecepatan di sepanjang lintasan
    for (let i = 0; i < 7; i++) {
      const rn = Math.abs(Math.sin(f.x * 5.3 + f.y * 2.9 + i * 31.7) * 9871.3) % 1, y = (i - 3) * (3 + pg * 3.2), x0 = tail + (tip - tail) * (.05 + rn * .3), x1 = tip - 8 - rn * 14;
      g.strokeStyle = 'rgba(' + mid + ',' + fa * (.75 - Math.abs(i - 3) * .12) + ')';
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(x0, y);
      g.lineTo(Math.max(x0 + 2, x1), y);
      g.stroke();
    }
    // gagang cahaya
    lens(tail, tip - 6, 8, glow, .35 * fa + .08);
    lens(tail, tip - 6, 3.6, mid, .85 * fa + .1);
    lens(tail, tip - 6, 1.6, '255,255,255', fa + .05);
    // bayangan mata tombak
    for (let j = 3; j >= 1; j--) {
      const x = tip - j * L * .2;
      if (x > 6)
        leaf(x, .85, glow, .32 * fa / j);
    }
    // chevron kejut
    for (let i = 0; i < 3; i++) {
      const x = tip - 6 - i * (9 + pg * 8), h = (7 + i * 4) * (1 + pg * .7), bk = 9 + i * 2;
      g.strokeStyle = 'rgba(' + (i ? mid : '255,240,235') + ',' + fa * (.9 - i * .22) + ')';
      g.lineWidth = 2.8 - i * .6;
      g.beginPath();
      g.moveTo(x - bk, -h);
      g.lineTo(x, 0);
      g.lineTo(x - bk, h);
      g.stroke();
    }
    if (big)
      lens(tip, tip + 36 * Math.min(1, pg * 2), 6, '255,230,170', fa * .8);
    // mata tombak
    const hs = 1 - c * c * .85;
    leaf(tip, 1.6, glow, .4 * hs);
    leaf(tip, 1.15, mid, .95 * hs);
    leaf(tip, .7, '255,255,255', hs);
    // kilau bintang di ujung
    if (c < .85) {
      g.save();
      g.translate(tip + 14, 0);
      const sf = 1 - c;
      lens(-10 * (1 + big * .5), 10 * (1 + big * .5), 2.6 * sf, '255,255,255', sf);
      g.rotate(1.5708);
      lens(-9, 9, 2.6 * sf, '255,255,255', sf);
      g.restore();
    }
    // gelombang kejut di ujung
    if (pg > .22) {
      const q = Math.min(1, (pg - .22) / .78), tx = tip + 14;
      g.strokeStyle = 'rgba(255,230,220,' + (1 - q) + ')';
      g.lineWidth = 2.5 * (1 - q) + .5;
      g.beginPath();
      g.ellipse(tx, 0, 4 + q * (big ? 18 : 12), 6 + q * (big ? 30 : 22), 0, 0, 7);
      g.stroke();
      for (let i = 0; i < 8; i++) {
        const an = i * .785 + .39, d0 = 4 + q * 6, d1 = d0 + (i % 2 ? 6 : 12) * (1 - q * .5);
        g.strokeStyle = 'rgba(255,255,255,' + (1 - q) + ')';
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(tx + Math.cos(an) * d0, Math.sin(an) * d0);
        g.lineTo(tx + Math.cos(an) * d1, Math.sin(an) * d1);
        g.stroke();
      }
    }
    // percikan
    for (let i = 0; i < 6; i++) {
      const rn = Math.abs(Math.sin(f.x * 4.7 + f.y * 3.3 + i * 17.9) * 8123.7) % 1, x = tail + (tip - tail) * rn, y = (rn - .5) * (14 + pg * 22) * (i % 2 ? 1 : -1);
      g.fillStyle = i % 2 ? 'rgba(' + mid + ',' + fa + ')' : 'rgba(255,255,255,' + fa + ')';
      g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
    }
  } else if (w == 1) {
    const sw = Math.min(f.arc, 6.2), sa = f.a - f.sd * sw / 2, pp = Math.min(1, pg * 1.7), ez = 1 - Math.pow(1 - pp, 3), c = Math.max(0, Math.min(1, (pg - .5) / .5)), head = sa + f.sd * sw * ez, tail = sa + f.sd * sw * Math.max(0, ez - .8 * (1 - c * c)), Rr = f.r, core = Math.min(Math.abs(head - tail), sw * .6);
    crescent(Rr * 1.05, tail, head, Rr * .5, '255,70,80', .35, 1.5);
    crescent(Rr * 1.0, tail, head, Rr * .32, '255,120,110', .85, 1.5);
    crescent(Rr, tail, head, Rr * .14, '255,236,230', 1, 1.5);
    // gagang tombak menyapu: busur tipis & garis radial
    for (const m of [.62, .8]) {
      g.strokeStyle = 'rgba(255,150,130,' + (m > .7 ? .55 : .35) * (1 - c) + ')';
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(0, 0, Rr * m, head - f.sd * core, head, f.sd < 0);
      g.stroke();
    }
    for (let i = 1; i < 5; i++) {
      const q = head - f.sd * i * .17;
      g.strokeStyle = 'rgba(255,110,100,' + (1 - i / 5) * .6 * (1 - c) + ')';
      g.lineWidth = 2.2 - i * .3;
      g.beginPath();
      g.moveTo(Math.cos(q) * 8, Math.sin(q) * 8);
      g.lineTo(Math.cos(q) * Rr * 1.08, Math.sin(q) * Rr * 1.08);
      g.stroke();
    }
    g.strokeStyle = 'rgba(255,235,230,' + (1 - c) + ')';
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(Math.cos(head) * 6, Math.sin(head) * 6);
    g.lineTo(Math.cos(head) * Rr * 1.0, Math.sin(head) * Rr * 1.0);
    g.stroke();
    // mata tombak menghadap arah sapuan
    if (c < .95) {
      const hx = Math.cos(head) * Rr * 1.02, hy = Math.sin(head) * Rr * 1.02, s2 = 1 - c * c;
      g.save();
      g.translate(hx, hy);
      g.rotate(head + f.sd * Math.PI / 2);
      leaf(0, 1.5, '255,70,80', .4 * s2);
      leaf(0, 1.1, '255,140,120', .95 * s2);
      leaf(0, .7, '255,255,255', s2);
      g.restore();
    }
    for (let i = 0; i < 6; i++) {
      const rn = Math.abs(Math.sin(f.x * 12.9 + f.y * 7.7 + i * 78.2) * 43758.5) % 1, ag = head - f.sd * (.1 + i * .14) * (.6 + rn), rd = Rr * (1.0 + (.1 + rn * .3) * pg * 1.4);
      g.fillStyle = i % 2 ? 'rgb(255,140,120)' : '#fff';
      g.globalAlpha = fd * (1 - i / 7);
      g.fillRect(Math.round(Math.cos(ag) * rd) - 1, Math.round(Math.sin(ag) * rd) - 1, 2, 2);
    }
    g.globalAlpha = fd;
  } else if (w == 4) {
    g.save();
    g.rotate(f.a);
    (f.hn == 0 ? [-.5] : f.hn == 1 ? [.9 * f.sd] : [-.75, .75]).forEach((o, i) => {
      const s = Math.min(1, Math.max(0, pg * 2.1 - i * .3));
      if (s <= 0)
        return;
      const e = 1 - Math.pow(1 - s, 3), c = Math.max(0, Math.min(1, (pg - .3 - i * .1) / .55)), L = f.hn == 2 ? 38 : 32, hx = -L + 2 * L * e, tx = Math.max(-L, hx - 1.5 * L * (1 - c * c));
      g.save();
      g.translate(20, 0);
      g.rotate(o);
      g.globalCompositeOperation = 'source-over';
      lens(tx - 2, hx + 7, 15, '38,8,58', .45 * (1 - c));
      g.globalCompositeOperation = 'lighter';
      lens(tx, hx + 6, 13, '255,50,70', .42);
      lens(tx, hx + 6, 8, '255,140,100', .85);
      lens(tx, hx + 6, 3.4, '255,255,255', 1);
      g.strokeStyle = 'rgba(255,130,100,.55)';
      g.lineWidth = 1;
      for (const yy of [-6, 6, -10]) {
        g.beginPath();
        g.moveTo(tx + 4, yy);
        g.lineTo(tx + 4 + (hx - tx) * .45, yy);
        g.stroke();
      }
      if (c < .85) {
        const hxx = Math.round(hx + 6);
        g.fillStyle = 'rgba(255,255,255,' + (1 - c) + ')';
        g.fillRect(hxx - 1, -4, 2, 8);
        g.fillRect(hxx - 4, -1, 8, 2);
      }
      for (let j = 0; j < 4; j++) {
        const rn = Math.abs(Math.sin(f.x * 9.1 + f.y * 4.3 + j * 37.7 + i * 11) * 4375.5) % 1, d = 6 + pg * 16 * (.5 + rn);
        g.fillStyle = j % 2 ? 'rgba(255,150,110,' + (1 - c) + ')' : 'rgba(255,255,255,' + (1 - c) + ')';
        g.fillRect(Math.round(hx - d * .3), Math.round((rn - .5) * 20 * (.4 + pg)), 2, 2);
      }
      g.restore();
    });
    g.restore();
    if (f.hn == 2) {
      const e2 = Math.min(1, pg * 1.5), eo = 1 - Math.pow(1 - e2, 2), c2 = Math.max(0, Math.min(1, (pg - .45) / .55)), hd = f.a + f.sd * 6.28 * eo, span = 2.8 * (1 - c2 * c2);
      for (let q = 0; q < 2; q++) {
        const hq = hd + q * Math.PI;
        crescent(f.r * .82, hq - f.sd * span, hq, f.r * .3, q ? '255,150,100' : '255,60,80', .85, 1.4);
      }
      g.strokeStyle = 'rgba(255,200,170,' + (1 - pg) * .7 + ')';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(0, 0, f.r * (.4 + pg * .8), 0, 7);
      g.stroke();
    }
  } else {
    const big = f.hn == 2, pal = f.en ? ['255,70,70', '255,215,205'] : big ? ['255,196,84', '255,244,200'] : f.hn == 1 ? ['80,220,255', '205,246,255'] : ['100,160,255', '212,232,255'], sw = Math.min(f.arc, 6.2), sa = f.a - f.sd * sw / 2, pp = Math.min(1, pg * 1.7), e = 1 - Math.pow(1 - pp, 3), c = Math.max(0, Math.min(1, (pg - .5) / .5)), head = sa + f.sd * sw * e, tail = sa + f.sd * sw * Math.max(0, e - .78 * (1 - c * c)), Rr = f.r;
    crescent(Rr * 1.04, tail, head, Rr * .62, pal[0], .32, 1.5);
    crescent(Rr * 1.02, tail, head, Rr * .42, pal[0], .8, 1.5);
    crescent(Rr * 1.0, tail, head, Rr * .2, pal[1], 1, 1.5);
    crescent(Rr * 1.22, tail - f.sd * .1, head - f.sd * .16, Rr * .12, pal[0], .55, 1.2);
    const core = Math.min(Math.abs(head - tail), sw * .55);
    g.strokeStyle = 'rgba(255,255,255,.9)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(0, 0, Rr * .97, head - f.sd * core, head, f.sd < 0);
    g.stroke();
    if (c < .9) {
      const hx = Math.cos(head) * Rr, hy = Math.sin(head) * Rr, L = 5 + 9 * (1 - c);
      g.fillStyle = 'rgba(255,255,255,' + (1 - c) + ')';
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const q = i * .785 + head, rr = i % 2 ? 2.5 : L;
        g.lineTo(hx + Math.cos(q) * rr, hy + Math.sin(q) * rr);
      }
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(' + pal[0] + ',' + (.6 * (1 - c)) + ')';
      g.beginPath();
      g.arc(hx, hy, 6 + 4 * (1 - c), 0, 7);
      g.fill();
    }
    for (let i = 0; i < 7; i++) {
      const rn = Math.abs(Math.sin(f.x * 12.9 + f.y * 7.7 + i * 78.2) * 43758.5) % 1, ag = head - f.sd * (.08 + i * .13) * (.6 + rn), rd = Rr * (1.02 + (.1 + rn * .3) * pg * 1.4);
      g.fillStyle = i % 2 ? 'rgb(' + pal[0] + ')' : '#fff';
      g.globalAlpha = fd * (1 - i / 8);
      g.fillRect(Math.round(Math.cos(ag) * rd) - 1, Math.round(Math.sin(ag) * rd) - 1, 2, 2);
    }
    g.globalAlpha = fd;
    if (big && !f.en) {
      g.lineWidth = 3;
      g.strokeStyle = 'rgba(' + pal[0] + ',' + (1 - pg) * .8 + ')';
      g.beginPath();
      g.arc(0, 0, Rr * (.35 + pg * .95), 0, 7);
      g.stroke();
      g.save();
      g.rotate(f.a);
      [-.6, 0, .6].forEach((o, i) => { g.save(); g.rotate(o * (1 + pg * .4)); lens(6, 6 + Rr * 1.35 * Math.min(1, pg * 2.2), i == 1 ? 3.5 : 5, pal[1], (1 - pg) * .8); g.restore(); });
      g.restore();
    }
  }
  g.restore();
}

function muzzFx2(f, k) {
  const a = 1 - k;
  g.save();
  g.translate(f.x, f.y);
  g.rotate(f.a);
  g.globalCompositeOperation = 'lighter';
  if (f.aoe) {
    const r = 10 + a * 26, gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
    gr.addColorStop(0, 'rgba(255,245,255,' + k + ')');
    gr.addColorStop(.4, 'rgba(200,120,255,' + k * .7 + ')');
    gr.addColorStop(1, 'rgba(90,30,180,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, r, 0, 7);
    g.fill();
    g.strokeStyle = 'rgba(235,200,255,' + k + ')';
    g.lineWidth = 3 * k;
    g.beginPath();
    g.arc(0, 0, 6 + a * 22, 0, 7);
    g.stroke();
    for (let i = 0; i < 8; i++) {
      const q = i * .785 + f.x, d = 4 + a * 26;
      g.fillStyle = 'rgba(255,255,255,' + k + ')';
      g.fillRect(Math.cos(q) * d - 1.5, Math.sin(q) * d - 1.5, 3, 3);
    }
    g.save();
    g.rotate(-f.a + a * 3);
    g.strokeStyle = 'rgba(240,210,255,' + k * .9 + ')';
    g.lineWidth = 1.2;
    const rr = 8 + a * 22;
    for (let s2 = 0; s2 < 2; s2++) {
      g.beginPath();
      for (let i = 0; i < 3; i++) {
        const q = i * 2.0944 + s2 * 3.1416;
        g.lineTo(Math.cos(q) * rr, Math.sin(q) * rr);
      }
      g.closePath();
      g.stroke();
    }
    g.restore();
    lens(-4, 12 + a * 36, 4 * k + 1, '255,255,255', k * .8);
  } else {
    const warm = f.col == '#e6c98e' || f.col == '#ff8a2a', c1 = warm ? '255,225,150' : '170,255,140', L = 16 + a * 34;
    lens(2, L, 10 * k + 2, c1, k * .55);
    lens(2, L * .8, 5 * k + 1, '255,255,235', k);
    [-.5, -.25, .25, .5].forEach(o => { g.save(); g.rotate(o); lens(4, 8 + a * 26 * (1 - Math.abs(o)), 1.6, c1, k * .9); g.restore(); });
    g.strokeStyle = 'rgba(' + c1 + ',' + k + ')';
    g.lineWidth = 2 * k + .5;
    g.beginPath();
    g.arc(2, 0, 4 + a * 12, -1.2, 1.2);
    g.stroke();
    for (let i = 0; i < 4; i++) {
      const q = (i - 1.5) * .35, d = 6 + a * 28;
      g.fillStyle = i % 2 ? 'rgba(' + c1 + ',' + k + ')' : 'rgba(255,255,255,' + k + ')';
      g.fillRect(Math.round(Math.cos(q) * d), Math.round(Math.sin(q) * d) - 1, 2, 2);
    }
  }
  g.restore();
}

// ===== ULTIMATE (tombol Q) — bar terisi dari damage; atur ULT_RATE (lebih besar = lebih cepat penuh) =====
const ULT_MAX = 100, ULT_RATE = .32, ULT_KILL = 3;
let ULTH = 0, ULT = 0, ULTT = 0, ULTF = 0, ULTN = '', ULTC = '255,255,255';

function ultAdd(v) {
  if (ULTT > 0 || (p && p.dead > 0) || ULT >= ULT_MAX)
    return;
  ULT = Math.min(ULT_MAX, ULT + v * dfx().ult);
  if (ULT >= ULT_MAX) {
    SFX.ultReady();
    msg('ULTIMATE SIAP! Tekan [Q]');
    fx.push({ k: 'ring', x: p.x, y: p.y, r: 30, w: 4, life: .6, max: .6, col: '#ffe08a' }, { k: 'gl', x: p.x, y: p.y, r: 60, c: '255,225,140', life: .5, max: .5 });
    dn(p.x, p.y - 22, 'ULTIMATE READY', 0, '#ffe08a');
  }
}

function ultGain(d) { ultAdd(d * ULT_RATE); }

function spRain(x, y, d, rr) {
  fx.push({
    k: 'ux', t: 'fall', s: 1, x, y, r: rr * .9, H: 130, tf: .55, life: .3, max: .3, c: '255,90,90', g: '255,200,110'
  });
  dp.push({ k: 'l', x, y: y - 2, a: 1.5708, len: 120, w: 8, cc: '#ff5a5a', life: .26, max: .26 });
  fx.push({ k: 'ring', x, y, r: rr * .8, w: 3, life: .34, max: .34, col: '#ff6a6a' }, { k: 'gl', x, y, r: rr * 1.6, c: '255,90,90', life: .28, max: .28 });
  for (let i = 0; i < 8; i++) {
    const a = R() * 6.283, v = 40 + R() * 100;
    dp.push({
      k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6, life: .3 + R() * .2, max: .5, s: 2 + R() * 2, c: i % 2 ? '#ff6a6a' : '#fff'
    });
  }
  es.slice().forEach(e => {
    if (Math.hypot(e.x - x, e.y - y) < rr + e.r + HB())
      hit(e, d, x, y, 50);
  });
}

/* ===== Efek ULTIMATE baru (khusus pemain): aura, jatuhan, pusaran, naga, segel ===== */
function uxFx(f, k) {
  const u = 1 - k, T = f.max, tt = u * T, c = f.c, gd = f.g || '255,255,255', S = Math.sin, Co = Math.cos;
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.translate(f.t == 'aura' ? p.x : f.x, f.t == 'aura' ? p.y : f.y);
  const quake = (w, r, a0) => {
    const kk = 1 - w;
    for (let j = 0; j < 3; j++) {
      const q = Math.max(0, w * 1.15 - j * .13);
      if (q <= 0 || q > 1)
        continue;
      g.save();
      g.scale(1, .6);
      g.strokeStyle = 'rgba(' + (j ? c : '255,255,255') + ',' + (1 - q) + ')';
      g.lineWidth = (5 - j * 1.3) * (1 - q) + .6;
      g.beginPath();
      g.arc(0, 0, r * (.12 + q * .95), 0, 7);
      g.stroke();
      g.restore();
    }
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, r * .8);
    gr.addColorStop(0, 'rgba(255,255,255,' + kk * kk + ')');
    gr.addColorStop(.4, 'rgba(' + c + ',' + kk * .5 + ')');
    gr.addColorStop(1, 'rgba(' + c + ',0)');
    g.fillStyle = gr;
    g.save();
    g.scale(1, .65);
    g.beginPath();
    g.arc(0, 0, r * .8, 0, 7);
    g.fill();
    g.restore();
    g.strokeStyle = 'rgba(' + gd + ',' + kk * .8 + ')';
    g.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const an = a0 + i * .628, L = r * (.25 + .85 * Math.min(1, w * 2.5)), j1 = ((i * 7) % 5 - 2) * 3;
      g.beginPath();
      g.moveTo(Co(an) * 8, S(an) * 5);
      g.lineTo(Co(an) * L * .5 + j1, S(an) * L * .3 - j1 * .5);
      g.lineTo(Co(an) * L, S(an) * L * .6);
      g.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const an = i * .524 + a0, d = r * w * (.6 + (i % 3) * .25);
      g.fillStyle = i % 2 ? 'rgba(' + gd + ',' + kk + ')' : 'rgba(255,255,255,' + kk + ')';
      g.fillRect(Math.round(Co(an) * d) - 1, Math.round(S(an) * d * .7 - S(w * 3.14) * 26) - 1, 2, 2);
    }
  };
  if (f.t == 'aura') {
    const env = Math.max(0, Math.min(1, tt / .35, (T - tt) / .5)), w = f.w, n = [6, 4, 8, 5, 6][w], R0 = [44, 40, 46, 42, 38][w], gr = g.createRadialGradient(0, 4, 0, 0, 4, 44);
    gr.addColorStop(0, 'rgba(' + c + ',' + .3 * env + ')');
    gr.addColorStop(1, 'rgba(' + c + ',0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 4, 44, 0, 7);
    g.fill();
    g.save();
    g.translate(0, 6);
    g.scale(1, .5);
    g.rotate(tt * .8);
    g.strokeStyle = 'rgba(' + c + ',' + .85 * env + ')';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(0, 0, 34, 0, 7);
    g.stroke();
    g.strokeStyle = 'rgba(' + gd + ',' + .8 * env + ')';
    g.lineWidth = 1.4;
    for (let s0 = 0; s0 < 2; s0++) {
      g.beginPath();
      for (let i = 0; i <= 3; i++) {
        const an = (s0 + i * 2) * 1.0472;
        i ? g.lineTo(Co(an) * 30, S(an) * 30) : g.moveTo(Co(an) * 30, S(an) * 30);
      }
      g.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const an = i * .5236;
      g.beginPath();
      g.moveTo(Co(an) * 34, S(an) * 34);
      g.lineTo(Co(an) * 40, S(an) * 40);
      g.stroke();
    }
    g.restore();
    for (let i = 0; i < n; i++) {
      const an = tt * (w == 4 ? -3.2 : 2.4) + i * 6.2832 / n, d = .78 + .22 * S(an);
      g.save();
      g.translate(Co(an) * R0, S(an) * R0 * .55 - 12);
      if (w == 0) {
        g.rotate(1.5708);
        lens(-12, 14, 3.4 * d, c, .85 * env);
        lens(-12, 14, 1.4 * d, '255,255,255', env);
        g.translate(-8, 0);
        g.rotate(1.5708);
        lens(-5, 5, 1.4, gd, env);
      } else if (w == 1) {
        g.rotate(an + 1.5708);
        lens(-16, 6, 2 * d, c, .8 * env);
        leaf(6, .8 * d, gd, env);
      } else if (w == 2) {
        g.rotate(an + 1.5708);
        lens(-14, 8, 2 * d, c, .8 * env);
        leaf(8, .45 * d, gd, env);
      } else if (w == 3)
        orb(0, 0, 3.6 * d, env);
      else {
        g.rotate(tt * 9 + i);
        lens(-7, 7, 1.8, '255,70,90', env * .9);
        g.rotate(1.5708);
        lens(-7, 7, 1.8, '255,70,90', env * .9);
      }
      g.restore();
    }
    for (let i = 0; i < 10; i++) {
      const x = S(i * 12.9) * 30, y = -((tt * 40 + i * 17) % 70);
      g.fillStyle = i % 2 ? 'rgba(' + gd + ',' + env * (1 + y / 70) + ')' : 'rgba(255,255,255,' + env * (1 + y / 70) + ')';
      g.fillRect(Math.round(x), Math.round(y), 2, 2);
    }
  } else if (f.t == 'cast') {
    const H = 190 * Math.min(1, u * 4), w = 30 * k + 4, gr = g.createLinearGradient(0, 0, 0, -H);
    gr.addColorStop(0, 'rgba(255,255,255,' + k + ')');
    gr.addColorStop(.5, 'rgba(' + c + ',' + k * .6 + ')');
    gr.addColorStop(1, 'rgba(' + c + ',0)');
    g.fillStyle = gr;
    g.fillRect(-w / 2, -H, w, H);
    for (let j = 0; j < 2; j++) {
      const r = (18 + 100 * u) * (1 + j * .4);
      g.save();
      g.scale(1, .45);
      g.strokeStyle = 'rgba(' + (j ? c : gd) + ',' + k + ')';
      g.lineWidth = 4 * k + 1;
      g.beginPath();
      g.arc(0, 4, r, 0, 7);
      g.stroke();
      g.restore();
    }
    for (let i = 0; i < 10; i++) {
      g.save();
      g.rotate(i * .628 + u * .6);
      lens(12 + u * 24, 34 + u * 70, 3 * k + .4, gd, k * .8);
      g.restore();
    }
  } else if (f.t == 'whirl') {
    const r = 34 + 120 * Math.pow(u, .6), hd = f.a0 + u * 5.5;
    crescent(r, hd - 2.2, hd, r * .28, c, k, 1.4);
    crescent(r * .9, hd + 3.1416 - 2.2, hd + 3.1416, r * .22, gd, k * .85, 1.4);
    g.strokeStyle = 'rgba(255,255,255,' + k * .8 + ')';
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(0, 0, r, hd - 1.2, hd);
    g.stroke();
  } else if (f.t == 'burst') {
    for (let i = 0; i < 14; i++) {
      g.save();
      g.rotate(i * .4488 + u * .5);
      lens(8 + u * 20, 30 + u * 110, 3.5 * k + .5, i % 2 ? gd : c, k * .9);
      g.restore();
    }
    g.strokeStyle = 'rgba(255,255,255,' + k + ')';
    g.lineWidth = 3 * k + .5;
    g.beginPath();
    g.arc(0, 0, 10 + u * 70, 0, 7);
    g.stroke();
  } else if (f.t == 'quake')
    quake(u, f.r, f.a);
  else if (f.t == 'fall') {
    const ph = f.tf, sc = Math.max(.7, f.r / 70);
    if (u < ph) {
      const v = u / ph, dx = f.s == 3 ? -.55 * f.H * (1 - v) : 0, dy = -f.H * (1 - v), al = Math.min(1, v * 3 + .3);
      g.save();
      g.translate(dx, dy);
      if (f.s == 3) {
        g.rotate(Math.atan2(1, .55));
        const r0 = 11 * sc;
        lens(-90 * sc, 0, 11 * sc, c, .55 * al);
        lens(-60 * sc, 0, 6 * sc, gd, .8 * al);
        lens(-35 * sc, 0, 2.5 * sc, '255,255,255', al);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, r0 * 1.8);
        gr.addColorStop(0, 'rgba(255,255,255,' + al + ')');
        gr.addColorStop(.4, 'rgba(' + c + ',' + .8 * al + ')');
        gr.addColorStop(1, 'rgba(' + c + ',0)');
        g.fillStyle = gr;
        g.beginPath();
        g.arc(0, 0, r0 * 1.8, 0, 7);
        g.fill();
      } else {
        g.rotate(1.5708);
        const L = [48, 40, 30][f.s] * sc;
        lens(-L * 4, -L * .3, 6 * sc, c, .45 * al);
        lens(-L * 2.4, 0, 2.4 * sc, '255,255,255', .7 * al);
        lens(-L, L, (f.s == 0 ? 9 : 5) * sc, c, .9 * al);
        lens(-L, L, (f.s == 0 ? 3.4 : 2) * sc, '255,255,255', al);
        if (f.s)
          leaf(L * .8, (f.s == 1 ? 1.4 : .8) * sc, gd, al);
        else {
          g.save();
          g.translate(-L * .55, 0);
          g.rotate(1.5708);
          lens(-13 * sc, 13 * sc, 3.2 * sc, gd, al);
          g.restore();
        }
      }
      g.restore();
    } else {
      const w = (u - ph) / (1 - ph);
      quake(w, f.r, f.x * .7);
      if (f.s != 3 && w < .8) {
        const L2 = (f.s == 0 ? 70 : 44) * sc, a2 = 1 - w / .8;
        g.save();
        g.rotate(-1.5708);
        lens(0, L2, (f.s == 0 ? 6 : 3) * sc, c, a2 * .7);
        lens(0, L2, 1.6 * sc, '255,255,255', a2);
        g.restore();
      }
      if (f.s == 3 && w < .9) {
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = 'rgba(20,5,30,' + .5 * (1 - w) + ')';
        g.beginPath();
        g.ellipse(0, 2, f.r * .3, f.r * .16, 0, 0, 7);
        g.fill();
      }
    }
  } else if (f.t == 'vortex') {
    const r = f.r * Math.min(1, tt / .5) * (u > .88 ? Math.max(0, 1 - (u - .88) / .12) : 1), al = Math.min(1, tt / .4);
    g.save();
    g.scale(1, .62);
    for (let a = 0; a < 4; a++) {
      g.strokeStyle = 'rgba(' + (a % 2 ? gd : c) + ',' + .55 * al + ')';
      g.lineWidth = 3 - a % 2;
      g.beginPath();
      for (let s = 0; s <= 1; s += .05) {
        const an = a * 1.5708 + tt * 3.2 + s * 4.2, rr = r * (1 - s * .92);
        s ? g.lineTo(Co(an) * rr, S(an) * rr) : g.moveTo(Co(an) * rr, S(an) * rr);
      }
      g.stroke();
    }
    g.strokeStyle = 'rgba(' + c + ',' + .5 * al + ')';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(0, 0, r, 0, 7);
    g.stroke();
    g.beginPath();
    g.arc(0, 0, r * .6, 0, 7);
    g.stroke();
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(12,0,28,' + .55 * al + ')';
    g.beginPath();
    g.arc(0, 0, r * .3, 0, 7);
    g.fill();
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgba(255,255,255,' + al + ')';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(0, 0, r * .3, 0, 7);
    g.stroke();
    for (let i = 0; i < 16; i++) {
      const s = (tt * .9 + i / 16) % 1, an = i * 2.4 + s * 5 + tt, rr = r * (1 - s);
      g.fillStyle = i % 2 ? 'rgba(255,255,255,' + al + ')' : 'rgba(' + c + ',' + al + ')';
      g.fillRect(Math.round(Co(an) * rr) - 1, Math.round(S(an) * rr) - 1, 2, 2);
    }
    g.restore();
    if (u > .9) {
      const q = (u - .9) / .1, gr = g.createRadialGradient(0, 0, 0, 0, 0, f.r * .7 * q + 4);
      gr.addColorStop(0, 'rgba(255,255,255,' + (1 - q) + ')');
      gr.addColorStop(1, 'rgba(' + c + ',0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(0, 0, f.r * .7 * q + 4, 0, 7);
      g.fill();
    }
  } else if (f.t == 'dragon') {
    const dx = f.x2 - f.x, dy = f.y2 - f.y, len = Math.hypot(dx, dy), h = len * Math.min(1, u * 1.7), tail = Math.max(0, h - len * .8 * (1 - Math.max(0, (u - .5) / .5)));
    g.rotate(Math.atan2(dy, dx));
    const N = 22, pt = i => { const s = tail + (h - tail) * i / N; return [s, f.amp * S(s * .08 - tt * 24) * (.25 + .75 * i / N)]; };
    for (let pass = 0; pass < 2; pass++)
      for (let i = 1; i <= N; i++) {
        const a = pt(i - 1), b = pt(i), q = i / N;
        g.strokeStyle = pass ? 'rgba(255,255,255,' + q * k + ')' : 'rgba(' + (q > .6 ? gd : c) + ',' + .55 * q * k + ')';
        g.lineWidth = (pass ? .35 : 1) * (2 + q * f.w);
        g.beginPath();
        g.moveTo(a[0], a[1]);
        g.lineTo(b[0], b[1]);
        g.stroke();
      }
    const hp = pt(N);
    g.save();
    g.translate(hp[0], hp[1]);
    leaf(0, f.hs, c, .5 * k + .3);
    leaf(0, f.hs * .7, gd, .9);
    leaf(0, f.hs * .4, '255,255,255', 1);
    g.restore();
    for (let i = 0; i < 8; i++) {
      const rn = ((i * 53 + Math.abs(f.x)) % 17) / 17, s = tail + (h - tail) * rn;
      g.fillStyle = i % 2 ? 'rgba(' + gd + ',' + k + ')' : 'rgba(255,255,255,' + k + ')';
      g.fillRect(Math.round(s) - 1, Math.round((rn - .5) * f.w * 3 + f.amp * S(s * .08 - tt * 24)) - 1, 2, 2);
    }
  } else if (f.t == 'sigil') {
    const r = f.r * Math.min(1, tt / .35), al = Math.max(0, Math.min(1, tt / .3, (T - tt) / .5)), n = f.n || 6;
    g.scale(1, .55);
    g.rotate(tt * .7);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
    gr.addColorStop(0, 'rgba(' + c + ',' + .22 * al + ')');
    gr.addColorStop(1, 'rgba(' + c + ',0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, r, 0, 7);
    g.fill();
    g.strokeStyle = 'rgba(' + c + ',' + .85 * al + ')';
    g.lineWidth = 2.6;
    g.beginPath();
    g.arc(0, 0, r, 0, 7);
    g.stroke();
    g.lineWidth = 1.4;
    g.beginPath();
    g.arc(0, 0, r * .84, 0, 7);
    g.stroke();
    g.strokeStyle = 'rgba(' + gd + ',' + .9 * al + ')';
    g.lineWidth = 1.8;
    for (let s0 = 0; s0 < (n % 2 ? 1 : 2); s0++) {
      g.beginPath();
      for (let i = 0; i <= n / (n % 2 ? 1 : 2); i++) {
        const an = (s0 + i * 2) * 6.2832 / n;
        i ? g.lineTo(Co(an) * r * .8, S(an) * r * .8) : g.moveTo(Co(an) * r * .8, S(an) * r * .8);
      }
      g.stroke();
    }
    for (let i = 0; i < 24; i++) {
      const an = i * .2618;
      g.beginPath();
      g.moveTo(Co(an) * r * .9, S(an) * r * .9);
      g.lineTo(Co(an) * r, S(an) * r);
      g.stroke();
    }
    g.rotate(-tt * 1.4);
    g.strokeStyle = 'rgba(255,255,255,' + .7 * al + ')';
    g.lineWidth = 1.4;
    g.beginPath();
    g.arc(0, 0, r * .4, 0, 7);
    g.stroke();
    g.strokeRect(-r * .2, -r * .2, r * .4, r * .4);
  } else if (f.t == 'xcut') {
    const sc = f.sc || 1;
    for (let j = 0; j < 3; j++) {
      const s = Math.min(1, Math.max(0, u * 4 - j * .25));
      if (s <= 0)
        continue;
      const L = 38 * sc * (.3 + .7 * s);
      g.save();
      g.rotate(f.a + j * 1.05);
      lens(-L, L, 6 * sc * k + 1, '255,40,80', k * .7);
      lens(-L, L, 2.2 * sc * k + .5, '255,255,255', k);
      g.restore();
    }
  }
  g.restore();
}

function ultVfx(i, a, m) {
  const C = ['140,205,255', '255,90,80', '150,255,120', '205,125,255', '255,70,100'][i], G = ['255,225,140', '255,200,110', '255,235,150', '255,255,255', '190,120,255'][i], U = UL[i].dur, [tx, ty] = tgt(), at = (t, f) => skLater(t, f), q = o => fx.push(Object.assign({ k: 'ux', c: C, g: G, max: o.life }, o)), fl = () => { FLSH = 1; FLSC = C; }, qk = (x, y, r) => q({ t: 'quake', x, y, r, a: R() * 6, life: .75 });
  q({ t: 'aura', w: i, life: U });
  q({ t: 'cast', x: p.x, y: p.y, life: .8 });
  if (i == 0) {
    for (let j = 0; j < 7; j++)
      at(.15 + j * .3, () => q({ t: 'whirl', x: p.x, y: p.y, a0: j * 1.1, life: .5 }));
    at(2.1, () => q({ t: 'fall', s: 0, x: p.x, y: p.y, H: 300, tf: .38, r: 150, life: 1.25 }));
    at(2.6, fl);
  } else if (i == 1) {
    q({
      t: 'dragon', x: p.x, y: p.y, x2: p.x + Math.cos(a) * 210, y2: p.y + Math.sin(a) * 210, w: 12, amp: 7, hs: 1.5, life: .55
    });
    at(1.0, () => { qk(p.x, p.y, 120); q({ t: 'sigil', x: p.x, y: p.y, r: 100, n: 6, life: 1.2 }); fl(); });
    at(1.6, () => { q({ t: 'dragon', x: p.x, y: p.y, x2: tx, y2: ty, w: 18, amp: 12, hs: 2.8, life: .6 }); q({ t: 'sigil', x: tx, y: ty, r: 130, n: 5, life: 2.2 }); });
    at(2.0, () => { qk(tx, ty, 170); fl(); });
  } else if (i == 2) {
    q({ t: 'burst', x: p.x, y: p.y, life: .6 });
    q({ t: 'sigil', x: tx, y: ty, r: 135, n: 6, life: U - .1 });
    at(3.0, () => q({ t: 'fall', s: 2, x: tx, y: ty, H: 330, tf: .5, r: 120, life: .9 }));
    at(3.45, fl);
  } else if (i == 3) { /* black hole: digambar oleh bhFx */ } else {
    q({ t: 'xcut', x: p.x, y: p.y, sc: 1.6, a: .6, life: .4 });
    at(3.65, () => { q({ t: 'xcut', x: p.x, y: p.y, sc: 3.2, a: .4, life: .55 }); qk(p.x, p.y, 130); fl(); });
  }
}

/* ===== BASIC ATTACK BERIRAMA (bow & staff): cincin ketukan + 3 titik tempo di atas kepala ===== */
function beatFx(f, k) {
  const u = 1 - k, pal = f.w == 2 ? ['150,255,120', '225,255,205'] : ['200,120,255', '240,215,255'], n = f.n, R0 = 8 + n * 5;
  g.save();
  g.translate(f.x, f.y + 4);
  g.globalCompositeOperation = 'lighter';
  g.save();
  g.scale(1, .5);
  for (let j = 0; j <= n; j++) {
    const q = Math.min(1, u * 2.2 - j * .15);
    if (q <= 0)
      continue;
    g.strokeStyle = 'rgba(' + (j ? pal[0] : pal[1]) + ',' + (1 - q) * .9 + ')';
    g.lineWidth = (3 - j * .6) * (1 - q) + .6;
    g.beginPath();
    g.arc(0, 0, R0 + q * (18 + n * 12) + j * 4, 0, 7);
    g.stroke();
  }
  g.restore();
  for (let i = 0; i < 3; i++) {
    const on = i <= n, cur = i == n, r = cur ? 2.2 + 2.4 * k : 1.6;
    g.fillStyle = on ? 'rgba(' + pal[cur ? 1 : 0] + ',' + (cur ? 1 : .8) * Math.min(1, k * 1.8 + .25) + ')' : 'rgba(' + pal[0] + ',.18)';
    g.beginPath();
    g.arc((i - 1) * 8, -30 - (cur ? 12 * u * (1 - u) : 0), r, 0, 7);
    g.fill();
  }
  g.restore();
}

/* ===== ULTIMATE STAFF: EVENT HORIZON (black hole) =====
   0 - .8s   : singularitas terbentuk, segel tanah menyala
   .8 - 3.2s : menghisap musuh & peluru musuh, piringan akresi + jet cahaya, damage berdenyut
   3.2 - 3.75s: runtuh menjadi satu titik putih
   3.75s     : supernova - ledakan besar, gelombang kejut, sinar radial
   Ubah BH_PR (radius hisap) / BH_BR (radius ledakan) / angka damage di bhTick & bhBlast untuk tuning. */
const BH_FORM = .8, BH_COL = 3.2, BH_EXP = 3.75, BH_END = 4.6, BH_PR = 175, BH_BR = 215, bhC = (v, a, b) => Math.max(a, Math.min(b, v)), bhE = u => u * u * (3 - 2 * u);

function bhStart(x, y, m) {
  Object.assign(BH, { on: 1, t: 0, x, y, m, tk: 0, pk: 0, cl: 0, ex: 0 });
  fx.push({ k: 'bh', life: BH_END + .05, max: BH_END + .05 });
  SFX.bhOpen();
}

function bhBlast(x, y, m) {
  SFX.bhBlast();
  FLSH = 1;
  FLSC = '255,255,255';
  shake = Math.max(shake, 24);
  HST = Math.max(HST, .14);
  es.slice().forEach(e => {
    if (e.sw > 0)
      return;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < BH_BR + e.r + HB())
      hit(e, 185 * m * (d < BH_BR * .55 ? 1 : 1 - .45 * (d - BH_BR * .55) / (BH_BR * .45)), x, y, 430);
  });
  for (let i = 0; i < 90; i++) {
    const a = R() * 6.283, v = 80 + R() * 330;
    dp.push({
      k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .72, life: .55 + R() * .6, max: 1.1, s: 2 + R() * 3.5, c: ['#ffffff', '#ffd9a0', '#e6b8ff', '#a65cff'][i % 4]
    });
  }
  for (let i = 0; i < 18; i++) {
    const a = R() * 6.283, v = 90 + R() * 220;
    dp.push({
      k: 'sh', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .75, rot: a, vr: (R() - .5) * 14, life: .7 + R() * .4, max: 1.1, s: 3 + R() * 3, c: i % 3 ? '215,150,255' : '255,240,255'
    });
  }
  puff(x, y, 12, '40,16,70', 2);
  fx.push({ k: 'pil', x, y, w: 150, h: 340, c: '230,190,255', life: .8, max: .8 }, { k: 'gl', x, y, r: 280, c: '220,170,255', life: .6, max: .6 }, { k: 'ring', x, y, r: 70, w: 6, life: .5, max: .5, col: '#fff' }, { k: 'ring', x, y, r: 130, w: 4, life: .7, max: .7, col: '#e6b8ff' }, { k: 'ring', x, y, r: 200, w: 3, life: .9, max: .9, col: '#a65cff' });
}

function bhTick(dt) {
  if (!BH.on)
    return;
  if (p.dead > 0) {
    BH.on = 0;
    BH.t = 0;
    return;
  }
  const T = (BH.t += dt), x = BH.x, y = BH.y, m = BH.m, pr0 = bhC(T / BH_COL, 0, 1), prog = bhE(bhC((T - .35) / .9, 0, 1)), col = T >= BH_COL;
  if (T < BH_EXP) {
    shake = Math.max(shake, 1 + 3.2 * pr0 + (col ? 2.5 : 0));
    const PR = BH_PR * (.6 + .4 * prog);
    // hisap musuh (dummy & boss tidak ikut tertarik, tapi tetap kena damage)
    es.forEach(e => {
      if (e.sw > 0 || e.k == 'dummy' || e.k == 'boss')
        return;
      const dx = x - e.x, dy = y - e.y, d = Math.hypot(dx, dy);
      if (d > PR || d < .5)
        return;
      const f = 1 - d / PR, sp = (50 + 330 * Math.pow(f, 1.1)) * prog * (col ? 1.5 : 1), sw = .55 * f, cs = Math.cos(sw), sn = Math.sin(sw), ax = dx / d, ay = dy / d, stp = Math.min(sp * dt, Math.max(0, d - 2));
      mv(e, (ax * cs - ay * sn) * stp, (ax * sn + ay * cs) * stp);
      e.stun = Math.max(e.stun || 0, .2);
      e.wind = 0;
      e.vx = e.vy = 0;
      e.bh = t + .25;
    });
    // peluru musuh ikut tersedot & lenyap di inti
    pr.forEach(b => {
      if (b.own != 'e')
        return; const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx, dy); if (d < PR) {
          if (d < 14) {
            b.life = 0;
            return;
          }
          b.vx += dx / d * 700 * dt;
          b.vy += dy / d * 700 * dt;
        }
    });
    // damage berdenyut
    BH.tk -= dt;
    if (BH.tk <= 0) {
      BH.tk = .17;
      const dmg = (7 + 9 * pr0) * m, h0 = HST;
      es.slice().forEach(e => {
        if (e.sw > 0)
          return; if (Math.hypot(e.x - x, e.y - y) < PR + e.r)
          hit(e, dmg, x, y, 0);
      });
      HST = h0;
    }
    // detak jantung makin cepat
    BH.pk -= dt;
    if (BH.pk <= 0 && T > .5) {
      BH.pk = .62 - .36 * pr0;
      SFX.bhPulse(pr0);
    }
    if (!BH.cl && col) {
      BH.cl = 1;
      SFX.bhCollapse();
      HST = Math.max(HST, .08);
    }
  }
  if (!BH.ex && T >= BH_EXP) {
    BH.ex = 1;
    bhBlast(x, y, m);
  }
  if (T >= BH_END) {
    BH.on = 0;
    BH.t = 0;
  }
}

function bhFx(f, k) {
  const T = BH.t;
  if (T <= 0 || T > BH_END)
    return;
  const x = BH.x, y = BH.y, S = Math.sin, Co = Math.cos, C = bhC, E = bhE, PI = Math.PI;
  const open = E(C(T / BH_FORM, 0, 1)), grow = E(C(T / 1.5, 0, 1)), colT = C((T - BH_COL) / (BH_EXP - BH_COL), 0, 1), col = E(colT), pre = T < BH_EXP;
  g.save();
  g.translate(x, y - 4);
  g.lineCap = 'round';
  if (pre) {
    const rc = (3 + 20 * grow) * (1 - .8 * col), Rd = (18 + 94 * grow) * (1 - .9 * col), PR = BH_PR * (.6 + .4 * open);
    // 1. tanah menggelap
    g.save();
    g.scale(1, .62);
    const dk = open * (.6 + .3 * col), dr = BH_PR * 1.2, gd = g.createRadialGradient(0, 0, rc * .5, 0, 0, dr);
    gd.addColorStop(0, 'rgba(3,0,10,' + dk + ')');
    gd.addColorStop(.5, 'rgba(12,2,30,' + dk * .6 + ')');
    gd.addColorStop(1, 'rgba(30,6,70,0)');
    g.fillStyle = gd;
    g.beginPath();
    g.arc(0, 0, dr, 0, 7);
    g.fill();
    g.restore();
    g.globalCompositeOperation = 'lighter';
    // 2. segel tanah + cincin lensa yang menyempit
    g.save();
    g.scale(1, .62);
    g.setLineDash([7, 9]);
    g.lineDashOffset = -T * 34;
    g.strokeStyle = 'rgba(190,130,255,' + .55 * open * (1 - col) + ')';
    g.lineWidth = 1.6;
    g.beginPath();
    g.arc(0, 0, PR, 0, 7);
    g.stroke();
    g.setLineDash([3, 6]);
    g.lineDashOffset = T * 22;
    g.strokeStyle = 'rgba(255,200,255,' + .35 * open * (1 - col) + ')';
    g.beginPath();
    g.arc(0, 0, PR * .72, 0, 7);
    g.stroke();
    g.setLineDash([]);
    for (let i = 0; i < 5; i++) {
      const s = (T * .7 + i / 5) % 1, r = rc + PR * (1 - s), a = S(s * PI) * .32 * open;
      g.strokeStyle = 'rgba(170,110,255,' + a + ')';
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(0, 0, r, 0, 7);
      g.stroke();
    }
    g.restore();
    // 3. aliran partikel spiral menuju inti (makin dekat makin cepat & panas)
    for (let i = 0; i < 120; i++) {
      const sp = .38 + (i % 5) * .06, s = (T * sp + i * .61803) % 1, s0 = Math.max(0, s - .04), a0 = i * 2.39996;
      const pos = q => { const rr = rc * 1.05 + (PR - rc * 1.05) * (1 - Math.pow(q, 1.8)), an = a0 + 6.5 * Math.pow(q, 1.35) + T * .15; return [Co(an) * rr, S(an) * rr * .62]; };
      const p1 = pos(s0), p2 = pos(s), cc = s > .8 ? '255,236,196' : s > .5 ? '255,160,224' : '176,122,255', al = open * (1 - col) * Math.min(1, s * 4) * (.3 + .7 * s) * (s > .97 ? (1 - s) / .03 : 1);
      g.strokeStyle = 'rgba(' + cc + ',' + al + ')';
      g.lineWidth = .8 + s * 1.6;
      g.beginPath();
      g.moveTo(p1[0], p1[1]);
      g.lineTo(p2[0], p2[1]);
      g.stroke();
    }
    // 4. piringan akresi (setengah belakang -> inti -> setengah depan)
    const disk = front => {
      g.save();
      g.rotate(-.28);
      if (!front) {
        g.save();
        g.scale(1, .32);
        const gg = g.createRadialGradient(0, 0, rc, 0, 0, Rd * 1.15);
        gg.addColorStop(0, 'rgba(255,210,150,' + .5 * open + ')');
        gg.addColorStop(.35, 'rgba(255,120,190,' + .28 * open + ')');
        gg.addColorStop(1, 'rgba(110,60,230,0)');
        g.fillStyle = gg;
        g.beginPath();
        g.arc(0, 0, Rd * 1.15, 0, 7);
        g.fill();
        g.restore();
      }
      for (let j = 0; j < 9; j++) {
        const u = j / 8, r = rc * 1.3 + (Rd - rc * 1.3) * u, cc = u < .22 ? '255,246,224' : u < .5 ? '255,192,112' : u < .75 ? '244,112,204' : '154,92,255';
        g.strokeStyle = 'rgba(' + cc + ',' + (.14 + .5 * (1 - u)) * open + ')';
        g.lineWidth = 3.4 - u * 2.2;
        g.beginPath();
        g.ellipse(0, 0, r, r * .3, 0, front ? 0 : PI, front ? PI : PI * 2);
        g.stroke();
      }
      for (let j = 0; j < 6; j++) {
        const u = j / 5, r = rc * 1.3 + (Rd - rc * 1.3) * u, a0 = (T * (4.6 - u * 3) + j * 1.7) % (PI * 2);
        if ((S(a0 + .5) > 0) !== front)
          continue;
        g.strokeStyle = 'rgba(255,250,236,' + .8 * open * (1 - .55 * u) + ')';
        g.lineWidth = 3 - u * 1.5;
        g.beginPath();
        g.ellipse(0, 0, r, r * .3, 0, a0, a0 + 1);
        g.stroke();
      }
      g.restore();
    };
    disk(false);
    // 5. jet cahaya kutub
    const jet = E(C((T - 1) / .6, 0, 1)) * (1 - col);
    if (jet > 0) {
      const w = 3 + rc * .22, H0 = 70 + 110 * jet, fl = .8 + .2 * S(T * 31);
      [-1, 1].forEach(sd => { const hh = H0 * (sd < 0 ? 1 : .55), gj = g.createLinearGradient(0, 0, 0, sd * hh); gj.addColorStop(0, 'rgba(255,255,255,' + .8 * jet * fl + ')'); gj.addColorStop(.5, 'rgba(190,130,255,' + .35 * jet * fl + ')'); gj.addColorStop(1, 'rgba(120,60,255,0)'); g.fillStyle = gj; g.beginPath(); g.moveTo(-w, 0); g.lineTo(-w * .2, sd * hh); g.lineTo(w * .2, sd * hh); g.lineTo(w, 0); g.closePath(); g.fill(); });
    }
    // 6. inti hitam
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#020008';
    g.beginPath();
    g.arc(0, 0, rc, 0, 7);
    g.fill();
    g.globalCompositeOperation = 'lighter';
    disk(true);
    // 7. cincin foton, busur lensa gravitasi, halo
    const ph = open;
    const hl = g.createRadialGradient(0, 0, rc, 0, 0, rc * 3.6);
    hl.addColorStop(0, 'rgba(255,200,150,' + .35 * ph + ')');
    hl.addColorStop(.4, 'rgba(180,100,255,' + .2 * ph + ')');
    hl.addColorStop(1, 'rgba(90,40,200,0)');
    g.fillStyle = hl;
    g.beginPath();
    g.arc(0, 0, rc * 3.6, 0, 7);
    g.fill();
    g.strokeStyle = 'rgba(255,170,110,' + .55 * ph + ')';
    g.lineWidth = 4.5;
    g.beginPath();
    g.arc(0, 0, rc * 1.16, 0, 7);
    g.stroke();
    g.strokeStyle = 'rgba(255,246,230,' + .95 * ph + ')';
    g.lineWidth = 1.8;
    g.beginPath();
    g.arc(0, 0, rc * 1.1, 0, 7);
    g.stroke();
    g.save();
    g.rotate(-.28);
    g.strokeStyle = 'rgba(255,214,160,' + .6 * ph + ')';
    g.lineWidth = 2.6;
    g.beginPath();
    g.ellipse(0, -rc * .12, rc * 1.55, rc * 1.38, 0, PI * 1.06, PI * 1.94);
    g.stroke();
    g.strokeStyle = 'rgba(255,170,220,' + .35 * ph + ')';
    g.lineWidth = 1.6;
    g.beginPath();
    g.ellipse(0, rc * .1, rc * 1.35, rc * 1.2, 0, PI * .12, PI * .88);
    g.stroke();
    g.restore();
    // 8. runtuh: cincin menyempit + titik putih-panas
    if (col > 0) {
      for (let i = 0; i < 4; i++) {
        const s = (colT * 1.3 + i * .25) % 1, r = 8 + 120 * Math.pow(1 - s, 1.6);
        g.save();
        g.scale(1, .62);
        g.strokeStyle = 'rgba(255,' + (200 + i * 14) + ',255,' + s * .8 * col + ')';
        g.lineWidth = 2.4 * s + .6;
        g.beginPath();
        g.arc(0, 0, r, 0, 7);
        g.stroke();
        g.restore();
      }
      const wr = 14 + 54 * colT * colT, wg = g.createRadialGradient(0, 0, 0, 0, 0, wr);
      wg.addColorStop(0, 'rgba(255,255,255,' + colT * .95 + ')');
      wg.addColorStop(.5, 'rgba(230,180,255,' + colT * .5 + ')');
      wg.addColorStop(1, 'rgba(160,90,255,0)');
      g.fillStyle = wg;
      g.beginPath();
      g.arc(0, 0, wr, 0, 7);
      g.fill();
    }
  }
  // 9. supernova
  if (T >= BH_EXP) {
    const tt = T - BH_EXP, ex = C(tt / (BH_END - BH_EXP), 0, 1), q1 = E(C(tt / .5, 0, 1)), fa = 1 - ex;
    g.globalCompositeOperation = 'source-over';
    g.save();
    g.scale(1, .62);
    const sc = g.createRadialGradient(0, 0, 0, 0, 0, BH_BR * .8);
    sc.addColorStop(0, 'rgba(6,0,16,' + .6 * fa + ')');
    sc.addColorStop(1, 'rgba(20,4,48,0)');
    g.fillStyle = sc;
    g.beginPath();
    g.arc(0, 0, BH_BR * .8, 0, 7);
    g.fill();
    g.restore();
    const fl = Math.max(0, 1 - tt / .32);
    if (fl > 0) {
      g.fillStyle = 'rgba(255,250,255,' + fl * .9 + ')';
      g.fillRect(-900, -900, 1800, 1800);
    }
    g.globalCompositeOperation = 'lighter';
    const br = 24 + 190 * q1, bg = g.createRadialGradient(0, 0, 0, 0, 0, br);
    bg.addColorStop(0, 'rgba(255,255,255,' + fa * .95 + ')');
    bg.addColorStop(.35, 'rgba(235,190,255,' + fa * .6 + ')');
    bg.addColorStop(1, 'rgba(130,60,255,0)');
    g.fillStyle = bg;
    g.beginPath();
    g.arc(0, 0, br, 0, 7);
    g.fill();
    for (let i = 0; i < 3; i++) {
      const q = E(C(tt / (.5 + i * .13), 0, 1));
      g.save();
      g.scale(1, .62);
      g.strokeStyle = 'rgba(' + (i == 0 ? '255,255,255' : i == 1 ? '232,190,255' : '170,100,255') + ',' + (1 - q) * .95 + ')';
      g.lineWidth = (8 - i * 2.2) * (1 - q) + 1;
      g.beginPath();
      g.arc(0, 0, 14 + BH_BR * (.45 + i * .3) * q, 0, 7);
      g.stroke();
      g.restore();
    }
    for (let i = 0; i < 28; i++) {
      const an = i * .2244 + (i % 3) * .03, len = (50 + BH_BR * 1.25 * q1) * (i % 2 ? .62 : 1);
      g.save();
      g.scale(1, .75);
      g.rotate(an);
      lens(10, len, 4.2 * fa + .8, i % 3 ? '232,196,255' : '255,255,255', fa * .85);
      g.restore();
    }
  }
  g.restore();
}

/* ===== SKILL X BELATI: SURIKEN BERPUTAR MENGELILINGI PEMAIN — muter 1 detik (area damage), lalu kembali menyatu ke pemain ===== */
const SHR_SPIN = 1, SHR_ORB = 62, SHR_R = 26, SHR_N = 4; // SHR_N = jumlah suriken yang mengorbit

function shrThrow(a, m) {
  fx.push({
    k: 'shr', x: p.x, y: p.y, oa: a, or: 6, ph: 0, t: 0, rot: 0, m, tk: 0, sn: 0, tr: Array.from({ length: SHR_N }, () => []), life: 8, max: 8
  });
  SFX.swing(4);
  fx.push({ k: 'ring', x: p.x, y: p.y, r: 14, w: 2, life: .25, max: .25, col: '#ff8a8a' });
}

function shrTick(dt) {
  fx.forEach(f => {
    if (f.k != 'shr' || f.life <= 0)
      return;
    f.t += dt;
    f.rot += dt * 24;
    if (f.ph == 0) {
      f.oa += dt * 10;
      f.or += (SHR_ORB - f.or) * Math.min(1, dt * 14);
      if (f.t >= .15) {
        f.ph = 1;
        f.t = 0;
        fx.push({ k: 'ring', x: p.x, y: p.y, r: SHR_ORB, w: 3, life: .3, max: .3, col: '#ff6a6a' });
      }
    } else if (f.ph == 1) {
      f.oa += dt * 11;
      f.or = SHR_ORB + Math.sin(f.t * 6) * 3;
      if (f.t >= SHR_SPIN) {
        f.ph = 2;
        f.t = 0;
        SFX.swing(4);
      }
    } else {
      f.oa += dt * 13;
      f.or = Math.max(6, f.or - dt * (110 + f.t * 500));
      if (f.or <= 6) {
        f.life = 0;
        fx.push({ k: 'ring', x: p.x, y: p.y, r: 12, w: 3, life: .25, max: .25, col: '#ffd0d0' }, { k: 'gl', x: p.x, y: p.y - 4, r: 28, c: '255,120,120', life: .2, max: .2 });
        SFX.pickup();
        return;
      }
    }
    for (let i = 0; i < SHR_N; i++) {
      const an = f.oa + i * 6.2832 / SHR_N, sx = p.x + Math.cos(an) * f.or, sy = p.y + Math.sin(an) * f.or * .85;
      f.tr[i].push([sx, sy]);
      if (f.tr[i].length > 10)
        f.tr[i].shift();
      if (R() < .5)
        dp.push({
          k: 'p', x: sx + (R() - .5) * 8, y: sy + (R() - .5) * 8, vx: (R() - .5) * 50, vy: (R() - .5) * 50, life: .3, max: .3, s: 1.5 + R() * 1.5, c: R() < .5 ? '#ff6a6a' : '#fff'
        });
    }
    f.tk -= dt;
    if (f.tk <= 0) {
      f.tk = .1;
      const h0 = HST, rr = f.or + SHR_R * .6;
      es.slice().forEach(e => {
        if (e.sw > 0)
          return; if (Math.hypot(e.x - p.x, (e.y - p.y) / .85) < rr + e.r + HB())
          hit(e, (f.ph == 1 ? 9 : 11) * f.m, p.x, p.y, 45);
      });
      HST = h0;
    }
    f.sn -= dt;
    if (f.sn <= 0 && f.ph == 1) {
      f.sn = .22;
      SFX.swing(4);
    }
  });
}

function shrFx(f, k) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  // area damage di sekitar pemain
  const orr = Math.max(1, f.or);
  g.save();
  g.translate(p.x, p.y + 2);
  g.scale(1, .85);
  const al = f.ph == 2 ? Math.min(1, f.or / SHR_ORB) : 1;
  g.strokeStyle = 'rgba(255,120,120,' + (.3 + .2 * Math.sin(f.t * 30)) * al + ')';
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(0, 0, f.or + SHR_R * .6, 0, 7);
  g.stroke();
  const dg = g.createRadialGradient(0, 0, orr * .3, 0, 0, orr + SHR_R * .6);
  dg.addColorStop(0, 'rgba(255,60,80,0)');
  dg.addColorStop(1, 'rgba(255,60,80,' + .16 * al + ')');
  g.fillStyle = dg;
  g.beginPath();
  g.arc(0, 0, f.or + SHR_R * .6, 0, 7);
  g.fill();
  g.restore();
  f.tr.forEach(tr => tr.forEach((q, i) => { const a = (i + 1) / tr.length; g.fillStyle = 'rgba(255,90,100,' + a * .3 + ')'; g.beginPath(); g.arc(q[0], q[1] - 2, 3 + a * 5, 0, 7); g.fill(); }));
  for (let n = 0; n < SHR_N; n++) {
    const an = f.oa + n * 6.2832 / SHR_N;
    g.save();
    g.translate(p.x + Math.cos(an) * f.or, p.y + Math.sin(an) * f.or * .85 - 2);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 22);
    gr.addColorStop(0, 'rgba(255,120,120,.65)');
    gr.addColorStop(1, 'rgba(255,60,80,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, 22, 0, 7);
    g.fill();
    g.globalCompositeOperation = 'source-over';
    g.rotate(f.rot);
    g.fillStyle = '#d7dde8';
    g.strokeStyle = '#2a2234';
    g.lineWidth = 1.2;
    g.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i * 1.5708;
      g.lineTo(Math.cos(a) * 13, Math.sin(a) * 13);
      g.lineTo(Math.cos(a + .785) * 3.6, Math.sin(a + .785) * 3.6);
    }
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#c8283e';
    g.beginPath();
    g.arc(0, 0, 2.4, 0, 7);
    g.fill();
    g.restore();
  }
  g.restore();
}
{
  const _updBH = upd;
  upd = function (dt) {
    const hs = HST > 0; _updBH(dt); if (!hs) {
      bhTick(dt);
      shrTick(dt);
    }
  };
}
const UL = [
  {
    n: 'Excalibur Judgement', dur: 3.2, f: (a, m) => {
      skSpin(5, 2.2);
      for (let i = 0; i < 7; i++)
        skLater(.15 + i * .3, () => {
          melee(100, 6.28, 0, 0, { hn: 2, sd: 1, lg: 0, nh: 1 }); ultSweep(150 + i * 6, 30 * m, 35); fx.push({ k: 'ring', x: p.x, y: p.y, r: 105 + i * 8, w: 4, life: .4, max: .4, col: '#9fd0ff' }, { k: 'gl', x: p.x, y: p.y, r: 130, c: '140,200,255', life: .3, max: .3 }); if (i % 2)
            fx.push({
              k: 'pil', x: p.x + (R() - .5) * 160, y: p.y + (R() - .5) * 110, w: 22, h: 130, c: '150,210,255', life: .45, max: .45
            });
        });
      skLater(2.6, () => {
        melee(150, 6.28, 0, 0, { hn: 2, sd: 1, lg: 0, nh: 1 });
        ultSweep(240, 95 * m, 320);
        for (let i = 0; i < 4; i++)
          fx.push({
            k: 'ring', x: p.x, y: p.y, r: 50 + i * 35, w: 5 - i, life: .5 + i * .1, max: .5 + i * .1, col: i % 2 ? '#cfe6ff' : '#fff'
          });
        for (let i = 0; i < 9; i++) {
          const q = i / 9 * 6.283, d = 70 + R() * 60;
          fx.push({
            k: 'pil', x: p.x + Math.cos(q) * d, y: p.y + Math.sin(q) * d * .7, w: 26, h: 150, c: '150,210,255', life: .55, max: .55
          });
        }
        fx.push({ k: 'pil', x: p.x, y: p.y, w: 90, h: 240, c: '200,235,255', life: .7, max: .7 });
        shake = Math.max(shake, 12);
        if (!SFX.swMp3()) SFX.slam();
      });
    }
  },
  {
    n: 'Crimson Dragon Lance', dur: 3.9, f: (a, m) => {
      const [tx, ty] = tgt();
      skDash(a, 560, .34);
      for (let i = 0; i < 7; i++)
        skLater(i * .05, () => {
          skLine(80, 26, 22 * m, 200); for (let j = 0; j < 5; j++)
            dp.push({
              k: 'gf', x: p.x, y: p.y, vx: (R() - .5) * 90, vy: (R() - .5) * 70, life: .4 + R() * .3, max: .7, s: 6 + R() * 7
            });
        });
      skLater(.42, () => {
        const b = p.face; for (let i = -3; i <= 3; i++)
          skLater(Math.abs(i) * .05, () => {
            p.face = b + i * .2; melee(130, .5, 30 * m, 220, { hn: 2, sd: 1, lg: 0 }); const q = p.face; dp.push({
              k: 'l', x: p.x + Math.cos(q) * 160, y: p.y + Math.sin(q) * 160, a: q, len: 170, w: 10, cc: '#ff5a5a', life: .3, max: .3
            });
          });
      });
      skLater(1.0, () => {
        melee(120, 6.28, 90 * m, 320, { hn: 2, sd: 1, lg: 0 });
        for (let i = 0; i < 26; i++) {
          const q = R() * 6.283, v = 90 + R() * 190;
          dp.push({ k: 'gf', x: p.x, y: p.y, vx: Math.cos(q) * v, vy: Math.sin(q) * v, life: .5, max: .5, s: 6 + R() * 8 });
        }
        for (let i = 0; i < 3; i++)
          fx.push({
            k: 'ring', x: p.x, y: p.y, r: 50 + i * 40, w: 5 - i, life: .45 + i * .1, max: .45 + i * .1, col: i % 2 ? '#ffb0a0' : '#ff5a5a'
          });
        fx.push({ k: 'pil', x: p.x, y: p.y, w: 80, h: 220, c: '255,70,70', life: .65, max: .65 });
        bang(p.x, p.y, 60, 1);
        shake = Math.max(shake, 12);
        SFX.slam();
      });
      // FINALE: lempar tombak raksasa ke target, lalu hujan tombak
      skLater(1.6, () => {
        const ox = p.x, oy = p.y, q = Math.atan2(ty - oy, tx - ox);
        p.face = q;
        SFX.shot(1);
        fx.push({ k: 'ring', x: tx, y: ty, r: 130, w: 4, life: 2.4, max: 2.4, col: '#ff5a5a', fill: 1 }, { k: 'ring', x: tx, y: ty, r: 90, w: 2, life: 2.4, max: 2.4, col: '#ffb0a0' }, { k: 'rune', x: tx, y: ty, life: 2.4, max: 2.4, sc: 7, w: 3 }, { k: 'gl', x: tx, y: ty, r: 170, c: '255,90,90', life: 2.2, max: 2.2 });
        for (let j = 0; j < 7; j++)
          skLater(j * .05, () => { const u = j / 6, hx = ox + (tx - ox) * u, hy = oy + (ty - oy) * u; dp.push({ k: 'l', x: hx, y: hy, a: q, len: 80, w: 12, cc: '#ff5a5a', life: .2, max: .2 }); fx.push({ k: 'gl', x: hx, y: hy, r: 30, c: '255,100,100', life: .2, max: .2 }); });
        skLater(.4, () => {
          spRain(tx, ty, 110 * m, 100); for (let i = 0; i < 3; i++)
            fx.push({
              k: 'ring', x: tx, y: ty, r: 50 + i * 35, w: 5 - i, life: .5 + i * .1, max: .5 + i * .1, col: i % 2 ? '#fff' : '#ff6a6a'
            }); fx.push({ k: 'pil', x: tx, y: ty, w: 110, h: 260, c: '255,90,90', life: .7, max: .7 }); shake = Math.max(shake, 12); SFX.slam();
        });
        for (let i = 0; i < 40; i++)
          skLater(.8 + i * .042, () => {
            const a2 = R() * 6.283, d = Math.sqrt(R()) * 125, x = tx + Math.cos(a2) * d, y = ty + Math.sin(a2) * d; spRain(x, y, 26 * m, 32); if (i % 4 == 0)
              SFX.boom(34);
          });
      });
    }
  },
  {
    n: 'Heaven Barrage', dur: 3.7, f: (a, m) => {
      const [tx, ty] = tgt();
      for (let i = 0; i < 14; i++)
        skLater(.05 + i * .014, () => { shootS(i / 14 * 6.283, 22 * m, 440, '#8bd17c'); const b = pr[pr.length - 1]; b.pierce = 1; b.big = 1; b.life = 1.1; });
      fx.push({ k: 'ring', x: tx, y: ty, r: 130, w: 4, life: 3, max: 3, col: '#ff5a5a', fill: 1 }, { k: 'ring', x: tx, y: ty, r: 90, w: 2, life: 3, max: 3, col: '#ffb0a0' }, { k: 'rune', x: tx, y: ty, life: 3, max: 3, sc: 7, w: 3 }, { k: 'gl', x: tx, y: ty, r: 170, c: '255,110,100', life: 2.8, max: 2.8 });
      for (let i = 0; i < 64; i++)
        skLater(.5 + i * .045, () => {
          const q = R() * 6.283, d = Math.sqrt(R()) * 120, x = tx + Math.cos(q) * d, y = ty + Math.sin(q) * d; skRain(x, y, 22 * m, 34); fx.push({ k: 'ring', x, y, r: 34, w: 2, life: .3, max: .3, col: '#d8ffb0' }); if (i % 4 == 0)
            if (!SFX.bwMp3()) SFX.boom(34);
        });
      skLater(3.45, () => {
        skRain(tx, ty, 85 * m, 95); for (let i = 0; i < 3; i++)
          fx.push({
            k: 'ring', x: tx, y: ty, r: 50 + i * 35, w: 5 - i, life: .5 + i * .1, max: .5 + i * .1, col: i % 2 ? '#fff' : '#b6ff8a'
          }); fx.push({ k: 'pil', x: tx, y: ty, w: 120, h: 260, c: '200,255,150', life: .7, max: .7 }); shake = Math.max(shake, 12); if (!SFX.bwMp3()) SFX.slam();
      });
    }
  },
  {
    n: 'Event Horizon', dur: BH_END, f: (a, m) => { const [tx, ty] = tgt(); bhStart(tx, ty, m); }
  },
  {
    n: 'Thousand Shadows', dur: 4.1, f: (a, m) => {
      // Ninja: menghilang, lalu serangan beruntun tanpa henti (gaya Alecto), muncul lagi dengan finisher
      ULTH = 1;
      puff(p.x, p.y, 8, '30,20,45', 1.4);
      fx.push({ k: 'ring', x: p.x, y: p.y, r: 30, w: 4, life: .5, max: .5, col: '#ff5a5a' }, { k: 'gl', x: p.x, y: p.y, r: 90, c: '60,20,40', life: .5, max: .5 });
      for (let i = 0; i < 38; i++)
        skLater(.25 + i * .09, () => {
          const ox = p.x, oy = p.y, T = skNear(6, 560), e = T.length ? T[Math.floor(R() * T.length)] : null;
          if (e) {
            const q = R() * 6.283;
            skTp(e.x + Math.cos(q) * 16, e.y + Math.sin(q) * 16);
            p.face = Math.atan2(e.y - p.y, e.x - p.x);
          } else
            skBlink(R() * 6.283, 70);
          gh.push({ x: ox, y: oy, life: .4, max: .4, ph: p.wph });
          {
            const dx = p.x - ox, dy = p.y - oy;
            dp.push({
              k: 'l', x: p.x, y: p.y, a: Math.atan2(dy, dx), len: Math.hypot(dx, dy) + 10, w: 5, cc: '#ff5a5a', life: .2, max: .2
            });
          }
          puff(p.x, p.y, 1, '30,20,45', .8);
          fx.push({ k: 'gl', x: p.x, y: p.y, r: 46, c: '255,120,100', life: .18, max: .18 });
          melee(44, 6.28, 15 * m, 100, { hn: i % 3, sd: i % 2 ? -1 : 1, lg: 0 });
          if (e)
            fx.push({ k: 'xm', x: e.x, y: e.y, a: .5 + i, life: .3, max: .3 }, {
              k: 'ux', t: 'xcut', x: e.x, y: e.y, sc: 1, a: .5 + i * 1.7, life: .32, max: .32, c: '255,70,100', g: '190,120,255'
            });
        });
      skLater(3.65, () => {
        ULTH = 0;
        puff(p.x, p.y, 8, '30,20,45', 1.4);
        skSpin(2, .4);
        melee(130, 6.28, 95 * m, 320, { hn: 2, sd: 1, lg: 0 });
        for (let i = 0; i < 3; i++)
          fx.push({
            k: 'ring', x: p.x, y: p.y, r: 50 + i * 35, w: 5 - i, life: .5 + i * .1, max: .5 + i * .1, col: i % 2 ? '#ffb48a' : '#ff5a5a'
          });
        fx.push({ k: 'pil', x: p.x, y: p.y, w: 80, h: 200, c: '255,130,100', life: .6, max: .6 });
        shake = Math.max(shake, 12);
        if (!SFX.dgMp3()) SFX.slam();
      });
    }
  }
];
/* ultimate tombak: pembuka dengan perisai di depan */
{
  const _u1 = UL[1].f;
  UL[1].f = (a, m) => { SG.bash = .6; _u1(a, m); };
}
for (let i = 0; i < 5; i++) {
  const f0 = UL[i].f;
  UL[i].f = (a, m) => { f0(a, m); ultVfx(i, a, m); };
}

function castUlt() {
  if (ULT < ULT_MAX || ULTT > 0 || p.dead > 0)
    return;
  const U = UL[wi];
  ULT = 0;
  ULTT = U.dur + .5;
  ULTF = 1.4;
  ULTN = U.n;
  ULTC = WCL[wi];
  p.an = null;
  p.buf = 0;
  p.skb = p.cdA = U.dur;
  p.inv = Math.max(p.inv, U.dur + .5);
  p.combo = 0;
  p.hold = 0;
  SFX.ult(wi);
  FLSH = 1;
  FLSC = WCL[wi];
  shake = Math.max(shake, 10);
  HST = Math.max(HST, .15);
  fx.push({ k: 'ring', x: p.x, y: p.y, r: 50, w: 5, life: .6, max: .6, col: 'rgb(' + WCL[wi] + ')' }, { k: 'gl', x: p.x, y: p.y, r: 110, c: WCL[wi], life: .5, max: .5 }, { k: 'rune', x: p.x, y: p.y + 4, life: 1, max: 1, sc: 4, w: 3 });
  U.f(p.face, mul());
}
const DC = ['#c14c61', '#ff8aa0', '#ffd0da', '#9ef'];

function dodgeBurst() {
  puff(p.x, p.y + 6, 5, '110,100,90', .9);
  for (let i = 0; i < 46; i++) {
    const a = R() * 6.283, v = 40 + R() * 130;
    dp.push({
      k: 'p', x: p.x + (R() - .5) * 10, y: p.y + (R() - .5) * 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .45 + R() * .3, max: .75, s: 1.5 + R() * 2.5, c: DC[i % 4]
    });
  }
  fx.push({ k: 'ring', x: p.x, y: p.y, r: 14, life: .35, max: .35, col: '#ff8aa0' });
}

function dodgeTrail() {
  const a = Math.atan2(p.dy, p.dx), n = a + 1.5708;
  gh.push({ x: p.x, y: p.y, life: .34, max: .34, ph: p.wph });
  for (let i = 0; i < 4; i++) {
    const o = (R() - .5) * 14;
    dp.push({
      k: 'p', x: p.x - Math.cos(a) * 6 + Math.cos(n) * o, y: p.y - Math.sin(a) * 6 + Math.sin(n) * o, vx: -Math.cos(a) * (20 + R() * 40) + (R() - .5) * 30, vy: -Math.sin(a) * (20 + R() * 40) + (R() - .5) * 30, life: .3 + R() * .3, max: .6, s: 1.5 + R() * 2, c: R() < .5 ? '#c14c61' : '#ff8aa0'
    });
  }
  for (let i = 0; i < 3; i++) {
    const o = (R() - .5) * 20;
    dp.push({ k: 'l', x: p.x + Math.cos(n) * o, y: p.y + Math.sin(n) * o, a, len: 14 + R() * 20, life: .24, max: .24 });
  }
}

function dodgeEnd() {
  fx.push({ k: 'ring', x: p.x, y: p.y, r: 12, life: .3, max: .3, col: '#c14c61' });
  for (let i = 0; i < 16; i++) {
    const a = R() * 6.283, v = 20 + R() * 60;
    dp.push({
      k: 'p', x: p.x, y: p.y + 8, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .5, life: .3 + R() * .25, max: .55, s: 1.5 + R() * 2, c: '#aab'
    });
  }
}
const SPC = {
  slime: ['120,255,150', '40,160,90'], skel: ['225,238,255', '120,140,210'], mage: ['205,140,255', '110,50,200']
}, SPH = { slime: '#78ff96', skel: '#e6f0ff', mage: '#c88cff' };

function glFx(f, k) { g.save(); g.globalCompositeOperation = 'lighter'; const q = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); q.addColorStop(0, 'rgba(255,255,255,' + k * .9 + ')'); q.addColorStop(.35, 'rgba(' + f.c + ',' + k * .6 + ')'); q.addColorStop(1, 'rgba(' + f.c + ',0)'); g.fillStyle = q; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill(); g.restore(); }

function shootS(a, d, sp, col, aoe) {
  shoot(a, d, sp, col, aoe); pr[pr.length - 1].sk = 1; fx.push({
    k: 'gl', x: p.x + Math.cos(a) * 14, y: p.y + Math.sin(a) * 14, r: 24, c: col == '#ffe08a' ? '255,225,140' : '150,255,120', life: .16, max: .16
  });
}

function boomS(x, y, r, d) {
  const n = fx.length;
  boom(x, y, r, d);
  const f = fx[n];
  if (f && f.k == 'ab') {
    f.w = 3;
    f.r *= 1.35;
  }
  fx.push({ k: 'gl', x, y, r: r * 2, c: '200,130,255', life: .35, max: .35 }, { k: 'ring', x, y, r: r * .8, w: 4, life: .4, max: .4, col: '#e6b8ff' }, { k: 'ring', x, y, r: r * .5, w: 2, life: .55, max: .55, col: '#fff' }, { k: 'pil', x, y, w: r * .9, h: 130, c: '200,130,255', life: .5, max: .5 });
  for (let i = 0; i < 14; i++) {
    const a = R() * 6.283, v = 70 + R() * 170;
    dp.push({
      k: 'sh', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .75, rot: a, vr: (R() - .5) * 14, life: .6 + R() * .3, max: .9, s: 2.6 + R() * 2.4, c: i % 3 ? '215,150,255' : '255,240,255'
    });
  }
  shake = Math.max(shake, 6);
}

function spawnTick(e, dt) {
  e.sw = Math.max(0, e.sw - dt);
  const el = e.st - e.sw - e.sd, k = el / 1.1;
  if (el < 0)
    return;
  const hx = SPH[e.k];
  if (k < .62 && R() < dt * 55) {
    const a = R() * 6.283, rr = 14 + R() * 8;
    dp.push({
      k: 'p', x: e.x + Math.cos(a) * rr, y: e.y + 7 + Math.sin(a) * rr * .5, vx: -Math.cos(a) * 30, vy: -26 - R() * 34, life: .5, max: .5, s: 1.5 + R() * 1.5, c: hx
    });
  }
  if (!e.sx && k >= .62) {
    e.sx = 1;
    SFX.appear();
    shake = Math.max(shake, 2);
    fx.push({ k: 'ring', x: e.x, y: e.y + 4, r: 10, life: .35, max: .35, col: hx });
    puff(e.x, e.y + 6, 4, '110,100,90', .8);
    for (let i = 0; i < 16; i++) {
      const a = i * .3927 + R() * .2, v = 50 + R() * 60;
      dp.push({
        k: 'p', x: e.x, y: e.y + 4, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6 - 10, life: .35 + R() * .25, max: .6, s: 1.5 + R() * 2, c: i % 2 ? hx : '#fff'
      });
    }
  }
}

function spawnDraw(e) {
  const el = e.st - e.sw - e.sd;
  if (el < 0)
    return;
  const k = Math.min(1, el / 1.1), cl = SPC[e.k], x = Math.round(e.x), y = Math.round(e.y + 7), ca = Math.min(1, k * 4) * Math.min(1, (1 - k) / .2), rr = 24 * (.4 + .6 * Math.min(1, k * 3));
  g.save();
  g.translate(x, y);
  g.scale(1, .5);
  g.globalCompositeOperation = 'lighter';
  const q = g.createRadialGradient(0, 0, 0, 0, 0, rr * 1.5);
  q.addColorStop(0, 'rgba(' + cl[1] + ',' + ca * .6 + ')');
  q.addColorStop(1, 'rgba(' + cl[1] + ',0)');
  g.fillStyle = q;
  g.fillRect(-rr * 1.5, -rr * 1.5, rr * 3, rr * 3);
  g.strokeStyle = 'rgba(' + cl[0] + ',' + ca * .9 + ')';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(0, 0, rr, 0, 7);
  g.stroke();
  g.lineWidth = 1;
  g.beginPath();
  g.arc(0, 0, rr * .72, 0, 7);
  g.stroke();
  g.save();
  g.rotate(t * 2.2);
  g.fillStyle = 'rgba(' + cl[0] + ',' + ca + ')';
  for (let i = 0; i < 8; i++) {
    g.rotate(.7854);
    g.fillRect(rr - 2, -1.5, 5, 3);
  }
  g.restore();
  g.rotate(-t * 1.5);
  for (let j = 0; j < 2; j++) {
    g.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = j * 1.0472 + i * 2.0944;
      g.lineTo(Math.cos(a) * rr * .72, Math.sin(a) * rr * .72);
    }
    g.closePath();
    g.stroke();
  }
  g.restore();
  const rv0 = k >= .62 ? (k - .62) / .38 : 0, rv = 1 - (1 - rv0) * (1 - rv0);
  g.fillStyle = 'rgba(0,0,0,' + .4 * rv + ')';
  g.fillRect(e.x - 8, e.y + 5, 16, 3);
  if (k >= .62) {
    const h = e.ht + 14, top = e.y + 9 - h * rv;
    g.save();
    g.beginPath();
    g.rect(x - 26, top, 52, e.y + 12 - top);
    g.clip();
    g.globalAlpha = Math.min(1, .4 + rv);
    const f0 = e.fl;
    e.fl = rv0 < .5 ? .1 : 0;
    drawEnemy(e);
    e.fl = f0;
    g.restore();
    if (rv < 1) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = 'rgba(' + cl[0] + ',.9)';
      g.fillRect(x - 10, top - 1, 20, 2);
      g.restore();
    }
  }
  const ba = k < .7 ? k / .7 : (1 - k) / .3, bw = 5 + ba * 9;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const bq = g.createLinearGradient(0, y, 0, y - 64);
  bq.addColorStop(0, 'rgba(' + cl[0] + ',' + ba * .55 + ')');
  bq.addColorStop(1, 'rgba(' + cl[0] + ',0)');
  g.fillStyle = bq;
  g.fillRect(x - bw / 2, y - 64, bw, 64);
  g.restore();
}

function upd(dt) {
  if (p)
    camUpd(dt);
  if (HST > 0) {
    HST -= dt;
    return;
  }
  FLSH = Math.max(0, FLSH - dt * 2.2);
  ULTF = Math.max(0, ULTF - dt);
  ULTT = Math.max(0, ULTT - dt);
  if (ULTT <= 0)
    ULTH = 0;
  if (ULTT > 0)
    p.inv = Math.max(p.inv, .15);
  t += dt;
  msgT -= dt;
  if (P.KeyM)
    SFX.toggle();
  if (P.KeyL)
    guide = !guide;
  shake = Math.max(0, shake - 20 * dt);
  if (p.dead > 0) {
    p.dead -= dt;
    if (p.dead <= 0) {
      toLobby();
      reset();
    }
    return;
  }
  {
    const due = SQ.filter(q => (q.t -= dt) <= 0);
    SQ = SQ.filter(q => q.t > 0);
    due.forEach(q => q.f());
  }
  p.sc = p.sc.map(v => v - dt);
  ['cdA', 'skb', 'ec', 'focus', 'inv', 'hurt', 'swing', 'potC', 'comboT', 'stT', 'recoil'].forEach(k => p[k] -= dt);
  if (p.an) {
    p.an.t += dt;
    if (p.an.t >= p.an.tot)
      p.an = null;
  }
  if (p.buf > 0)
    p.buf -= dt;
  focusTick(dt);
  if (p.comboT <= 0)
    p.combo = 0;
  p.al += ((M.d || p.cdA > 0 || p.recoil > 0 || p.an ? 1 : 0) - p.al) * Math.min(1, dt * 12);
  if (p.stT <= 0)
    p.st = Math.min(100, p.st + 35 * dt);
  WSW = Math.max(0, WSW - dt); // CD ganti senjata 2 detik
  for (let i = 0; i < 5; i++)
    if (P['Digit' + (i + 1)]) {
      if (wi != i) {
        if (WSW > 0)
          dn(p.x, p.y - 14, 'CD ' + WSW.toFixed(1) + 's', 0, '#9ab');
        else {
          SFX.sw();
          wi = i;
          WSW = 2;
          p.combo = 0;
          p.an = null;
          p.buf = 0;
        }
      } else {
        p.combo = 0;
        p.an = null;
        p.buf = 0;
      }
    }
  if (pts > 0 && ['Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'].some(k => P[k]))
    msg(lobby ? 'Naikkan status lewat Kitab Status milik Ketua Orin [G]' : 'Status hanya bisa dinaikkan di lobby lewat Ketua Orin (bukan di dungeon)');
  if (window.mobAim && window.mobAim(touchAiming)) { /* HP: auto-lock musuh terdekat / arah joystick */ } else if (!touchAiming && touchJoy.active && (Math.abs(touchJoy.x) > 0.1 || Math.abs(touchJoy.y) > 0.1)) {
    p.face = Math.atan2(touchJoy.y, touchJoy.x);
  } else {
    p.face = Math.atan2(M.y - p.y, M.x - p.x);
  }
  if (p.spn > 0) {
    p.spn -= dt;
    p.fa += p.spv * dt;
    p.face = p.fa;
  }
  {
    const c = Math.cos(p.face);
    if (c > .2)
      HSt = 1;
    else if (c < -.2)
      HSt = -1;
    HSd += (HSt - HSd) * Math.min(1, dt * 18);
  }
  let ix = (K.KeyD ? 1 : 0) - (K.KeyA ? 1 : 0), iy = (K.KeyS ? 1 : 0) - (K.KeyW ? 1 : 0);
  if (touchJoy.active) {
    ix = touchJoy.x;
    iy = touchJoy.y;
  }
  const l = Math.hypot(ix, iy);
  if (l && !touchJoy.active) {
    ix /= l;
    iy /= l;
  }
  if (P.Space && p.st >= 25 && p.dod <= 0 && ULTT <= 0) {
    p.st -= 25;
    p.stT = .8;
    p.an = null;
    p.buf = 0;
    p.dod = .2;
    p.dsp = 0;
    p.inv = .22;
    p.dx = l ? ix : Math.cos(p.face);
    p.dy = l ? iy : Math.sin(p.face);
    fx.push({ k: 'ring', x: p.x, y: p.y, r: 8, life: .25, max: .25, col: '#9ef' });
    p.dfx = 1;
    dodgeBurst();
    SFX.dodge();
  }
  if (p.dod > 0) {
    p.dod -= dt;
    {
      const dk = dashK();
      mv(p, p.dx * (p.dsp || 300) * dk * dt, p.dy * (p.dsp || 300) * dk * dt);
    }
  } else {
    const sp = (K.ShiftLeft || K.ShiftRight || touchJoy.sprint ? 125 : 85) * (1 + (A.AGI - 5) * .015) * (M.d && p.hold > .3 ? .45 : (p.cdA > 0 ? .7 : 1)) * (FOCUS_MELEE() ? FOCUS_CFG.runMelee : FOCUS_RANGED() ? FOCUS_CFG.runRanged : 1) * (window.CHILLM || 1);
    p.vx += (ix * sp - p.vx) * Math.min(1, dt * 10);
    p.vy += (iy * sp - p.vy) * Math.min(1, dt * 10);
    mv(p, p.vx * dt, p.vy * dt);
  }
  {
    const spd = Math.hypot(p.vx, p.vy), mvg = (ix || iy) && p.dod <= 0, tb = mvg ? Math.min(1, spd / 85) : 0;
    if (spd > 70 && p.dod <= 0 && R() < .1)
      puff(p.x, p.y + 7, 1, '110,100,90', .5);
    p.wb += (tb - p.wb) * Math.min(1, dt * 12);
    p.wph += dt * 12 * (.2 + (p.dod > 0 ? 1 : p.wb) * .8) * Math.max(1, Math.min(1.5, spd / 85));
    p.idt += dt * 3;
    const sf2 = Math.floor(p.wph / Math.PI);
    if (sf2 !== p.sfp) {
      p.sfp = sf2;
      if (p.wb > .6 && p.dod <= 0 && spd > 40)
        puff(p.x + (sf2 & 1 ? 3 : -3), p.y + 9, 1, '110,100,90', .35);
    }
    if (p._wb > .8 && p.wb <= .8 && p.dod <= 0)
      puff(p.x, p.y + 8, 2, '110,100,90', .45);
    p._wb = p.wb;
  }
  if (p.dfx) {
    if (p.dod > 0)
      dodgeTrail();
    else {
      p.dfx = 0;
      dodgeEnd();
    }
  }
  if (M.d) {
    const ph = p.hold;
    p.hold += dt;
    if (ph < .6 && p.hold >= .6)
      SFX.ready();
  }
  if (M.u) {
    M.u = 0;
    const h = p.hold;
    p.hold = 0;
    if (ULTT > 0) { } else if (h > .6 && p.st >= 30) {
      p.st -= 30;
      p.stT = .8;
      atk(h);
    } else if (p.cdA <= 0)
      atk(0);
    else if (h <= .6)
      p.buf = .22;
  }
  if (p.buf > 0 && p.cdA <= 0 && ULTT <= 0 && p.dead <= 0 && !M.d) {
    p.buf = 0;
    atk(0);
  }
  [['KeyZ', 0], ['KeyX', 1], ['KeyC', 2]].forEach(([k, i]) => {
    const q = SK[wi][i]; if (P[k] && p.sc[i] <= 0 && p.skb <= 0) {
      p.sc[i] = q.cd;
      p.skb = q.dur;
      SFX.skill(i);
      skCast(i);
      q.f(p.face, mul());
    }
  });
  if (P.KeyQ)
    castUlt();
  if (P.KeyE && p.ec <= 0) {
    p.ec = 30;
    p.focus = FOCUS_CFG.dur;
    p.fpt = 0;
    SFX.focus();
    const PL = FPAL[wi], pc = PL.pc, mel = wi == 0 || wi == 1 || wi == 4, cfp = (x, y, vx, vy, life, s) => dp.push({ k: 'cf', x, y, vx, vy, life, max: life, s, pc, dark: PL.dark });
    fx.push({ k: 'ring', x: p.x, y: p.y, r: 20, w: 4, life: .45, max: .45, col: PL.h[0] }, { k: 'ring', x: p.x, y: p.y, r: 36, w: 2, life: .65, max: .65, col: PL.h[1] }, { k: 'gl', x: p.x, y: p.y, r: 60, c: PL.mid, life: .5, max: .5 });
    for (let i = 0; i < 24; i++) {
      const q = R() * 6.283, v = 50 + R() * 130;
      cfp(p.x, p.y, Math.cos(q) * v, Math.sin(q) * v - 30, .45 + R() * .3, 5 + R() * 6);
    }
    shake = Math.max(shake, 8);
    FLSH = .8;
    FLSC = PL.mid;
    HST = Math.max(HST, .07);
    for (let i = 0; i < 40; i++)
      cfp(p.x + (R() - .5) * 14, p.y + 6, (R() - .5) * 60, -60 - R() * 130, .6 + R() * .5, 6 + R() * 8);
    for (let i = 0; i < 40; i++) {
      const q = R() * 6.283, v = 60 + R() * 150;
      dp.push({
        k: 'p', x: p.x, y: p.y, vx: Math.cos(q) * v, vy: Math.sin(q) * v * .6 - 30, life: .5 + R() * .5, max: 1, s: 1.5, c: PL.h[R() < .5 ? 0 : 1]
      });
    }
    skLater(.12, () => fx.push({ k: 'ring', x: p.x, y: p.y + 4, r: 46, w: 3, life: .6, max: .6, col: PL.h[0] }));
    skLater(.26, () => fx.push({ k: 'ring', x: p.x, y: p.y + 4, r: 64, w: 2, life: .8, max: .8, col: PL.h[1] }, { k: 'gl', x: p.x, y: p.y, r: 90, c: PL.mid, life: .6, max: .6 }));
    dn(p.x, p.y - 14, 'BATTLE FOCUS!', 0, PL.h[0]);
    dn(p.x, p.y - 27, mel ? 'ATK SPD + DMG + RUN' : 'SPEED + DEFENSE', 0, PL.h[1]);
  }
  if (P.KeyR && p.pot > 0 && p.hp < mhp() && p.potC <= 0) {
    {
      const hv = HEALV(60);
      p.hp = Math.min(mhp(), p.hp + hv);
      p.pot--;
      p.potC = dfx().potCd;
      SFX.potion();
      dn(p.x, p.y - 10, '+' + hv, 0, '#6f6');
    }
  }
  dr = dr.filter(d => {
    const k = dist(d, p);
    if (k < 50 && k > 1) {
      const s = Math.min(k, 110 * dt);
      d.x += (p.x - d.x) / k * s;
      d.y += (p.y - d.y) / k * s;
    }
    if (k < 14) {
      SFX.pickup();
      if (p.pot < 5) {
        p.pot++;
        dn(d.x, d.y - 6, '+potion', 0, '#6f6');
      } else {
        const hv = HEALV(20);
        p.hp = Math.min(mhp(), p.hp + hv);
        dn(d.x, d.y - 6, '+' + hv + ' HP', 0, '#6f6');
      }
      return false;
    }
    return true;
  });
  es.forEach(e => {
    const dt1 = dt * enemyTime(e);
    (function (dt) {
      if (e.sw > 0) {
        spawnTick(e, dt);
        return;
      }
      if (e.k == 'dummy') {
        dummyTick(e, dt);
        return;
      }
      if (e.k == 'boss') {
        bossTick(e, dt);
        return;
      }
      if (e.mini) {
        miniTick(e, dt);
        return;
      }
      e.fl -= dt;
      e.cd -= dt;
      e.an -= dt;
      mv(e, e.vx * dt, e.vy * dt);
      e.vx *= Math.pow(.02, dt);
      e.vy *= Math.pow(.02, dt);
      e.stg = Math.max(0, e.stg - 4 * dt);
      if (e.stun > 0) {
        e.stun -= dt;
        e.wind = 0;
        e.an = 0;
        return;
      }
      const d = dist(e, p), a = ang(e, p), cs = Math.cos(a) * e.sp * dt, sn = Math.sin(a) * e.sp * dt;
      if (e.wind > 0) {
        e.wind -= dt;
        if (e.wind <= 0) {
          if (e.k == 'skel') {
            SFX.slam();
            shake = Math.max(shake, 4);
            fx.push({ k: 'ring', x: e.tx, y: e.ty, r: 28, life: .2, max: .2, col: '#f55' });
            pfire(e.tx, e.ty, 38);
            if (Math.hypot(p.x - e.tx, p.y - e.ty) < 28 + p.r)
              hurt(16);
            if (dfx().shots >= 2)
              skLater(.4, () => {
                if (!es.includes(e) || p.dead > 0)
                  return; const sx = p.x, sy = p.y; SFX.slam(); shake = Math.max(shake, 3); fx.push({ k: 'ring', x: sx, y: sy, r: 24, life: .2, max: .2, col: '#f55' }); pfire(sx, sy, 30); if (Math.hypot(p.x - sx, p.y - sy) < 24 + p.r)
                  hurt(10);
              });
          } else {
            SFX.eshot();
            const b = Math.atan2(e.ty - e.y, e.tx - e.x);
            fx.push({ k: 'muzz', x: e.x + Math.cos(b) * 10, y: e.y + Math.sin(b) * 10, a: b, col: '#e6c98e', life: .18, max: .18 });
            {
              const X = dfx();
              for (let i = 0; i <= X.shots; i++) {
                const q = b + (i - X.shots / 2) * .24, v = 140 * X.pv;
                pr.push({ x: e.x, y: e.y, vx: Math.cos(q) * v, vy: Math.sin(q) * v, d: 12, r: 3, col: '#e6c98e', own: 'e', life: 3 });
              }
            }
          }
        }
        return;
      }
      if (e.k == 'slime') {
        if (e.an > 0) {
          if (!e.hd && e.an <= .3) {
            e.hd = 1;
            fx.push({ k: 'slash', x: e.x, y: e.y, a: a, arc: 1.8, r: 24, life: .22, max: .22, sd: 1, w: 0, hn: 0, en: 1 });
            SFX.chop();
            if (d < e.r + p.r + 12)
              hurt(8);
          }
        } else {
          mv(e, cs, sn);
          if (d < e.r + p.r + 9 && e.cd <= 0) {
            e.an = .6;
            e.hd = 0;
            e.cd = 1.3 * dfx().cd;
          }
        }
      } else if (e.k == 'skel') {
        if (d > 32)
          mv(e, cs, sn);
        else if (e.cd <= 0) {
          SFX.warn(0);
          e.wind = .6;
          e.tx = p.x;
          e.ty = p.y;
          e.cd = 1.6 * dfx().cd;
        }
      } else {
        const s = d < 110 ? -1 : d > 150 ? 1 : 0;
        mv(e, cs * s, sn * s);
        if (e.cd <= 0 && d < 260) {
          SFX.warn(1);
          e.wind = .7;
          e.tx = p.x;
          e.ty = p.y;
          e.cd = 2.2 * dfx().cd;
        }
      }
    }).call(null, dt1);
  });
  pr = pr.filter(b => {
    if (b.rock)
      rockTrail(b);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.own == 'p' && !b.aoe && R() < .5)
      dp.push({ k: 'p', x: b.x, y: b.y, vx: 0, vy: 0, life: .25, max: .25, s: 1.5, c: b.big ? '#ffe9a8' : '#b6f08a' });
    if (b.aoe && R() < .5)
      dp.push({
        k: 'p', x: b.x + (R() - .5) * 6, y: b.y + (R() - .5) * 6, vx: (R() - .5) * 30, vy: (R() - .5) * 30, life: .35, max: .35, s: 1 + R() * 1.5, c: R() < .5 ? '#fff' : '#e6b8ff'
      });
    if (b.aoe && R() < .8)
      dp.push({ k: 'f', x: b.x, y: b.y, vx: (R() - .5) * 20, vy: (R() - .5) * 20 - 10, life: .3, max: .3, s: 2.5 + R() * 2 });
    let dead = b.life <= 0 || blk(b.x, b.y, 1);
    if (!dead) {
      if (b.own == 'p') {
        const e = es.find(e => e.sw <= 0 && Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r + HB() && !(b.hs && b.hs.includes(e)));
        if (e) {
          if (b.pierce)
            (b.hs = b.hs || []).push(e);
          else
            dead = true;
          if (!b.aoe)
            hit(e, b.d, b.x - b.vx, b.y - b.vy, 60);
        }
      } else if (Math.hypot(p.x - b.x, p.y - b.y) < p.r + b.r) {
        hurt(b.d);
        dead = true;
      }
    }
    if (dead && b.rock)
      rockBreak(b);
    if (dead && b.aoe)
      boom(b.x, b.y, b.aoe, b.d);
    return !dead;
  });
  fx = fx.filter(f => {
    f.life -= dt; if (f.k == 't')
      f.y -= 20 * dt; return f.life > 0;
  });
  dp = dp.filter(q => {
    q.life -= dt; if (q.k == 's') {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.s += dt * 9;
    } else if (q.k == 'p' || q.k == 'f' || q.k == 'sh' || q.k == 'gf' || q.k == 'cf') {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      const d = Math.pow(.05, dt);
      q.vx *= d;
      q.vy *= d;
      if (q.k == 'f' || q.k == 'gf')
        q.vy -= 70 * dt;
      if (q.k == 'cf')
        q.vy -= (q.up == null ? 70 : q.up) * dt;
      if (q.k == 'sh')
        q.rot += q.vr * dt;
    } return q.life > 0;
  });
  gh = gh.filter(q => (q.life -= dt) > 0);
  if (!lobby && room < 2 && !es.length && !clr && !doorOn) {
    const lastW = room == 0 ? 5 : ROOM2_LAST_WAVE;
    if (room == 0 && wave >= lastW && !MBD) {
      MBD = 1;
      spawnMinis();
    } else if (wave >= lastW) {
      doorOn = 1;
      msg(room == 0 ? 'Gelombang 5 selesai! Pintu di kanan terbuka — masuk ke ruangan berikutnya.' : 'Gelombang ' + lastW + ' selesai! Pintu BOS di kanan terbuka...');
      SFX.door();
      SFX.clear();
    } else {
      clr = 3.5;
      msg('Area bersih! Gelombang berikutnya datang...');
      SFX.clear();
    }
  }
  doorO += ((doorOn ? 1 : 0) - doorO) * Math.min(1, dt * 4);
  fade = Math.max(0, fade - dt);
  if (R() < dt * 5) {
    const b = BR[Math.floor(R() * BR.length)];
    if (b)
      puff(b[0], b[1] - 14, 1, '60,56,70', .8);
  }
  lobbyTick(dt);
  if (!lobby && P.KeyB)
    backTick();
  if (room == 0 && doorOn && p.x > DW - 30 && Math.abs(p.y - DY) < 32)
    toRoom(1);
  if (room == 1 && doorOn && p.x > DW - 30 && Math.abs(p.y - DY) < 32)
    toBoss();
  if (clr > 0) {
    clr -= dt;
    if (clr <= 0) {
      clr = 0;
      wave++;
      spawn();
      SFX.wave();
    }
  }
  if (window.updateMobileUI)
    window.updateMobileUI();
  for (const k in P)
    delete P[k];
}
const SC = ['#e8f2ff', '#ffb0b0', '', '', '#ffb48a'];
let HT = null, HSH = null, HSd = 1, HSt = 1, FEM = false;
const wrapA = a => {
  while (a > Math.PI)
    a -= 6.2832; while (a < -Math.PI)
    a += 6.2832; return a;
}, lerpA = (a, b, k) => a + wrapA(b - a) * k, lp = (a, b, k) => a + (b - a) * k, R2 = (a, x, y) => [Math.cos(a) * x - Math.sin(a) * y, Math.sin(a) * x + Math.cos(a) * y];
// lengan berzirah dua ruas (bahu -> siku -> tangan) agar pegangan senjata terlihat luwes
function seg(ax, ay, bx, by, ps, c0, c1) {
  const dx = bx - ax, dy = by - ay, n = Math.max(1, Math.ceil(Math.hypot(dx, dy)));
  for (let i = 0; i <= n; i++) {
    const k = i / n, X = Math.round(ax + dx * k), Y = Math.round(ay + dy * k);
    if (!ps) {
      g.fillStyle = HT || '#0b0a10';
      g.fillRect(X - 2, Y - 2, 5, 5);
    } else {
      g.fillStyle = HT || (k < .5 ? c0 : c1);
      g.fillRect(X - 1, Y - 1, 3, 3);
    }
  }
}

function limb(sx, sy, hx, hy, hand, s) {
  s = s || (hx >= sx ? 1 : -1);
  const dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy) || 1, L = 6.4;
  let ex, ey;
  if (d >= 2 * L - .4) {
    ex = sx + dx / 2;
    ey = sy + dy / 2;
  } else {
    const h = Math.sqrt(L * L - d * d / 4), nx = -dy / d, ny = dx / d, mx = sx + dx / 2, my = sy + dy / 2, c1 = [mx + nx * h, my + ny * h], c2 = [mx - nx * h, my - ny * h], sc = q => (q[0] - (sx - s * 8)) * s * .9 + (q[1] - sy) * .7, c = sc(c1) > sc(c2) ? c1 : c2;
    ex = c[0];
    ey = c[1];
  }
  seg(sx, sy, ex, ey, 0);
  seg(ex, ey, hx, hy, 0);
  seg(sx, sy, ex, ey, 1, '#7f8396', '#a4a8b7');
  seg(ex, ey, hx, hy, 1, '#b8bccb', '#d9dce5');
  const EX = Math.round(ex), EY = Math.round(ey);
  g.fillStyle = HT || '#e4e7ee';
  g.fillRect(EX - 1, EY - 1, 3, 3);
  g.fillStyle = HT || '#8b8fa0';
  g.fillRect(EX, EY + 1, 2, 1);
  if (hand)
    fist(hx, hy);
}

function fist(hx, hy) { const X = Math.round(hx), Y = Math.round(hy); g.fillStyle = HT || '#0b0a10'; g.fillRect(X - 3, Y - 3, 6, 6); g.fillStyle = HT || '#d6d9e2'; g.fillRect(X - 2, Y - 2, 4, 4); g.fillStyle = HT || '#8b8fa0'; g.fillRect(X - 2, Y + 1, 4, 1); g.fillStyle = HT || '#f4f5fa'; g.fillRect(X - 2, Y - 2, 3, 1); g.fillStyle = HT || '#5d6176'; g.fillRect(X, Y - 1, 1, 2); }

function drawHero(x, y, ghost, ph, lx, ly) {
  const bl = ghost || p.dod > 0 ? 1 : p.wb, f = ph == null ? p.wph : ph, st = Math.sin(f) * bl, bob = Math.abs(Math.sin(f)) * 1.5 * bl + Math.sin(p.idt) * .5, ox = Math.round(x + (lx || 0)), oy = Math.round(y - 10 - bob + (ly || 0)), fl = ghost ? 0 : Math.max(-1, Math.min(1, -p.vx / 85)), cs = Math.sin(f * .7 + p.idt);

  // ===== SECONDARY ACTION (idle + jalan) =====
  const tt = t, iw = 1 - bl, br = Math.sin(tt * 1.7), inh = iw > .5 && br > .35 ? 1 : 0, dfw = a => Math.abs(Math.sin(f - a)), hdy = Math.round(-(dfw(.6) - dfw(0)) * 1.1 * bl) - inh, // kepala: napas (idle) / follow-through (jalan)
    pdy = Math.round(-(dfw(.9) - dfw(0)) * .9 * bl) - inh, // pelindung bahu: naik-turun telat dari badan
    blk = (tt % 3.9) < .13 || ((tt + 1.7) % 7.3) < .1, // kedip (kadang dobel)
    glt = (tt % 5.1) < .2, // kilau mata emas
    hsx = Math.max(-1, Math.min(1, Math.round(fl * 1.6 + Math.sin(tt * 2.1) * (.5 + .4 * bl)))), hlen = 2 + Math.round(dfw(1.2) * bl), // ayun rambut
    cl1 = v => Math.max(-1, Math.min(1, v)), mvx = ghost ? 0 : cl1(p.vx / 85), mvy = ghost ? 0 : cl1(p.vy / 85), rn = ghost ? 0 : Math.max(0, Math.min(1, (Math.hypot(p.vx, p.vy) - 85) / 40));
  if (!ghost) {
    g.fillStyle = 'rgba(0,0,0,.34)';
    g.fillRect(ox - 7, Math.round(y) + 6, 14, 1);
    g.fillRect(ox - 9, Math.round(y) + 7, 18, 2);
    g.fillRect(ox - 7, Math.round(y) + 9, 14, 1);
  }

  // ===== MODEL BARU: chibi ksatria pixel-art (grid setengah-unit) mengikuti gambar referensi cowok & cewek =====
  const PL = {
    ol: '#0b0a10', bk: '#17151b', s1: '#f1f3f8', s2: '#c9ccd6', s3: '#9a9dac', s4: '#666878', s5: '#3b3b48',
    b1: '#6b3a34', b2: '#43231f', hk: '#1b1a21', hm: '#2c2a33', hh: '#4d4a58', sk: '#f6e6dd', ss: '#dcc3ba', ch: '#f2a6a8',
    ey: '#27b4c6', ed: '#0d6574', el: '#a8f2f7', rd: '#8a1a2c', rl: '#bd2c45', rk: '#4a0d1a', rm: '#9d2036'
  };
  const mk = Q => ({
    Z: (a, b, w, h, c) => Q(a / 2, b / 2, w / 2, h / 2, c),
    ZH: (a, b, w, h, c) => Q(a / 2, b / 2 + hdy, w / 2, h / 2, c),
    ZP: (a, b, w, h, c) => Q(a / 2, b / 2 + pdy, w / 2, h / 2, c)
  });
  // jubah/syal merah compang-camping: default di sisi kanan layar (seperti gambar), berbalik saat bergerak ke kanan
  const capeZ = Z => {
    const fe = Math.max(-1, Math.min(1, fl + .45)), sg = fe >= 0 ? 1 : -1, ma = Math.abs(fe), X = [10, 15, 20, 24, 28], W = [7, 7, 7, 6, 6], T = [-2, 2, 7, 12, 17], Ln = [36, 33, 28, 21, 14];
    for (let k = 0; k < 5; k++) {
      const sh = Math.round(ma * 3 * (k + 1) / 5 + Math.sin(tt * 2.5 + f * 1.1 - k * .9) * (.6 + .9 * bl) * (k + 1) / 3 + cs * .4), w = W[k], x0 = X[k] + sh, xd = sg > 0 ? x0 : -x0 - w;
      for (let c = 0; c < w; c += 2) {
        const cw = Math.min(2, w - c), ln = Ln[k] - ((c / 2 + k) % 3) * 2 - (k % 2), xx = xd + c, sd = sg > 0 ? c == 0 : c + cw >= w, hl = sg > 0 ? c + cw >= w : c == 0;
        Z(xx, T[k], cw, ln, k % 2 ? PL.rd : PL.rm);
        if (sd)
          Z(xx, T[k], 1, ln - 1, PL.rk);
        if (hl)
          Z(xx + cw - 1, T[k] + 1, 1, ln - 3, PL.rl);
        if (k > 2 && ln > 6 && c == 2)
          Z(xx, T[k] + ln - 3, 1, 1, '#eadadd');
      }
    }
  };
  // kaki: bagian atas (paha) & bawah (lutut, tulang kering, sepatu bot) dipisah supaya urutan gambar bisa diatur
  const legZ = (Z, i, xc, wd, fem, part) => {
    const ph = f + i * Math.PI, sw = Math.sin(ph) * bl, cw = Math.cos(ph) * bl, lift = Math.round(Math.pow(Math.max(0, sw), .7) * (1.6 + 1.6 * rn)), fx = Math.round(cw * mvx * 2.4 + (iw > .5 ? Math.sin(tt * .6 + i * 3.1416) * .7 : 0)), fy = Math.round(cw * mvy * 1.6), tk = Math.round(fx * .4) * 2, sk = Math.round(fx * .75) * 2, ft = Math.max(13, 16 - lift + fy) * 2, X = xc - (wd >> 1), xf = X + fx * 2;
    if (part == 0) {
      if (fem)
        return;
      Z(X + tk, 17, wd, 11, PL.s2);
      Z(X + tk, 17, wd, 1, PL.s1);
      Z(X + tk, 18, 1, 9, PL.s1);
      Z(X + tk + wd - 1, 18, 1, 9, PL.s4);
      Z(X + tk + 1, 22, wd - 2, 1, PL.s3);
    } else {
      Z(X + tk, 25, wd, 4, PL.s2);
      Z(X + tk, 25, wd, 1, PL.s1);
      Z(X + tk + 1, 26, 2, 1, '#ffffff');
      Z(X + tk, 28, wd, 1, PL.s4);
      Z(X + tk + wd - 1, 26, 1, 2, PL.s4);
      const sh = Math.max(1, ft - 29);
      Z(X + sk, 29, wd - 1, sh, PL.s3);
      Z(X + sk, 29, 1, sh, PL.s2);
      Z(X + sk + wd - 2, 29, 1, sh, PL.s4);
      const bw = wd + 2;
      Z(xf - 1, ft, bw, 8, PL.s2);
      Z(xf - 1, ft, bw, 1, PL.s1);
      Z(xf - 1, ft + 2, 3, 2, PL.s1);
      Z(xf + 1, ft + 1, wd - 1, 1, PL.s3);
      Z(xf - 1, ft + 4, bw, 1, PL.s4);
      Z(xf + bw - 2, ft + 1, 1, 4, PL.s4);
      Z(xf - 1, ft + 6, bw, 2, '#23232e');
      if (fem)
        Z(xf - 1, ft + 5, bw, 1, '#c2a06b');
    }
  };
  // wajah: kulit pucat, mata teal besar (berkedip), pipi merona
  const faceZ = ZH => {
    ZH(-10, -17, 20, 9, PL.sk);
    ZH(7, -17, 3, 9, PL.ss);
    ZH(-10, -17, 20, 1, '#c9b2ae');
    ZH(-8, -9, 2, 1, PL.ch);
    ZH(6, -9, 2, 1, PL.ch);
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? -8 : 2, E1 = s < 0 ? PL.ey : '#e3a92a', E2 = s < 0 ? PL.ed : '#7a520a', E3 = s < 0 ? PL.el : '#fff0a8', E4 = s < 0 ? '#06242a' : '#2a1800';
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
        if (s > 0 && glt)
          ZH(x0 + 3, -12, 1, 1, '#ffffff');
      }
    }
  };
  const scarfZ = (Z, wd) => {
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
  const hairM = ZH => {
    const H = PL.hk, M = PL.hm, L = PL.hh, L2 = '#6c6a7c';
    // jambul tipis & runcing
    [[-8, -30, 3, 2], [-3, -33, 4, 5], [2, -31, 3, 3], [7, -29, 3, 2]].forEach(([x, y, w, h], i) => { ZH(x, y, w, h, i % 2 ? M : H); ZH(x + 1, y - 1, Math.max(1, w - 2), 1, H); });
    ZH(-10, -29, 20, 2, H);
    ZH(-12, -27, 24, 3, H);
    ZH(-13, -24, 26, 5, H);
    // beberapa helai samping saja
    [[-16, -24, 3, 2], [-17, -21, 4, 2], [-15, -19, 3, 2]].forEach(([x, y, w, h], i) => ZH(x, y, w, h, i % 2 ? M : H));
    [[13, -25, 3, 2], [14, -22, 4, 2], [13, -19, 3, 2]].forEach(([x, y, w, h], i) => ZH(x, y, w, h, i % 2 ? H : M));
    ZH(-13, -19, 3, 7, H);
    ZH(10, -19, 3, 7, H);
    ZH(-12, -12, 2, 3, M);
    ZH(10, -12, 2, 3, M);
    ZH(-12, -19, 24, 3, H);
    ZH(-11, -16, 22, 1, H);
    // poni jarang, ujung runcing
    [[-11, 3, 4], [-8, 3, 3], [-5, 3, 4], [-2, 4, 6], [2, 3, 4], [5, 3, 3], [8, 3, 4]].forEach(([x, w, l], i) => {
      ZH(x, -20, w, l, i % 2 ? M : H);
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
    ZH(-12 + hsx, -9, 2, 2 + hlen, M);
    ZH(10 + hsx, -9, 2, 2 + hlen, M);
  };

  // ===== COWOK: ksatria rambut hitam acak-acakan, syal merah, zirah silver tebal, tabard hitam berlambang salib =====
  const run = Q => {
    const { Z, ZH, ZP } = mk(Q);
    capeZ(Z);
    legZ(Z, 0, -6, 8, 0, 0);
    legZ(Z, 1, 6, 8, 0, 0);
    // badan: pakaian dalam gelap, dada silver, tali coklat bersilang, sabuk
    Z(-11, 2, 22, 17, PL.bk);
    Z(-9, 17, 18, 3, PL.bk);
    Z(-9, -2, 18, 13, PL.s2);
    Z(-9, -2, 18, 2, PL.s1);
    Z(-8, 0, 7, 4, PL.s1);
    Z(-8, 4, 5, 3, '#dfe1e9');
    Z(1, 0, 7, 4, PL.s2);
    Z(2, 4, 6, 3, PL.s3);
    Z(-1, 0, 2, 9, PL.s5);
    Z(-9, 9, 18, 1, PL.s4);
    Z(-9, 10, 18, 1, PL.s5);
    for (let t = 0; t < 8; t++) {
      Z(-10 + t, 0 + t, 3, 2, PL.b1);
      Z(7 - t, 0 + t, 3, 2, PL.b1);
      Z(-10 + t, 2 + t, 3, 1, PL.b2);
      Z(7 - t, 2 + t, 3, 1, PL.b2);
    }
    Z(-10, 11, 20, 4, PL.b2);
    Z(-10, 11, 20, 1, PL.b1);
    Z(-2, 10, 4, 6, PL.s3);
    Z(-1, 11, 2, 4, PL.s1);
    Z(-1, 13, 2, 1, PL.s5);
    Z(-8, 12, 1, 1, PL.s3);
    Z(7, 12, 1, 1, PL.s3);
    // tabard hitam dengan salib & ujung runcing
    Z(-5, 14, 10, 14, PL.bk);
    Z(-6, 14, 1, 14, PL.s3);
    Z(5, 14, 1, 14, PL.s3);
    Z(-5, 28, 10, 1, PL.s3);
    Z(-3, 29, 6, 1, PL.bk);
    Z(-3, 29, 1, 1, PL.s3);
    Z(2, 29, 1, 1, PL.s3);
    Z(-1, 30, 2, 1, PL.s3);
    Z(-1, 17, 2, 8, PL.s2);
    Z(-3, 19, 6, 1, PL.s2);
    Z(-1, 17, 2, 1, PL.s1);
    legZ(Z, 0, -6, 8, 0, 1);
    legZ(Z, 1, 6, 8, 0, 1);
    // pelindung bahu besar bersusun (naik-turun telat dari badan)
    for (const s of [-1, 1]) {
      const M = (a, w) => s < 0 ? a : -a - w, hi = s < 0 ? PL.s1 : PL.s2, md = s < 0 ? PL.s2 : PL.s3, sh = s < 0 ? PL.s3 : PL.s4, pl = (x, w, y, h) => { ZP(M(x + 1, w - 2), y, w - 2, 1, hi); ZP(M(x, w), y + 1, w, h - 2, md); ZP(M(x + 1, w - 2), y + h - 1, w - 2, 1, PL.s4); ZP(M(x + 1, w - 2), y + 1, 3, 2, hi); ZP(s < 0 ? M(x, w) + w - 1 : M(x, w), y + 2, 1, h - 3, sh); };
      pl(-21, 11, -5, 6);
      pl(-23, 13, 0, 6);
      pl(-21, 11, 5, 6);
      ZP(M(-14, 2), 2, 2, 2, PL.s5);
      ZP(M(-14, 2), 8, 2, 1, PL.s5);
      ZP(M(-19, 1), 3, 1, 1, PL.s5);
      ZP(M(-12, 1), -2, 1, 1, PL.s5);
      ZP(s < 0 ? -10 : 9, -5, 1, 16, PL.s5);
    }
    scarfZ(Z, 12);
    faceZ(ZH);
    hairM(ZH);
  };

  // ===== CEWEK: ksatria rambut hitam panjang bergelombang, pita merah, mantel hitam bersalib =====
  const hairBack = Z => {
    const hs = y => Math.round(fl * 6 * (y + 24) / 60 + Math.sin(tt * 2.2 - y * .14) * (1 + 1.6 * bl) * (y > 4 ? 1 : .3));
    for (let y = -24; y <= 38; y++) {
      const s = hs(y), u = Math.max(0, y - 2), wv = Math.round(Math.sin(y * .38 + 1) * (1 + Math.min(2.4, u * .09))), w0 = (y < 4 ? 16 : 17 + Math.min(3, u * .12)) | 0, tip = y > 33 ? (y - 33) * 2 : 0, c = (y + 24) % 7 < 2 ? PL.hm : (y + 24) % 11 == 5 ? PL.hh : PL.hk;
      Z(-w0 + s + wv + tip, y, 2 * w0 - 2 * tip, 1, PL.hk);
      Z(-w0 + s + wv + tip, y, 7, 1, c);
      Z(w0 - 7 + s + wv - tip, y, 7, 1, c);
    }
  };
  const runF = Q => {
    const { Z, ZH, ZP } = mk(Q);
    capeZ(Z);
    hairBack(Z);
    // mantel panjang: panel tengah + dua sisi melebar, hem berayun
    const k0 = Math.round(fl * 2 + Math.sin(f) * bl * 1.2), k1 = Math.round(k0 * .5);
    Z(-9, 2, 18, 15, PL.bk);
    Z(-9, 15, 18, 3, PL.bk);
    Z(-17 + k1, 16, 12, 8, PL.bk);
    Z(5 + k1, 16, 12, 8, PL.bk);
    Z(-19 + k0, 24, 14, 11, PL.bk);
    Z(5 + k0, 24, 14, 11, PL.bk);
    Z(-5, 15, 10, 20, PL.bk);
    Z(-17 + k1, 16, 1, 8, PL.s3);
    Z(16 + k1, 16, 1, 8, PL.s3);
    Z(-19 + k0, 24, 1, 11, PL.s3);
    Z(18 + k0, 24, 1, 11, PL.s3);
    Z(-19 + k0, 34, 14, 1, PL.s3);
    Z(5 + k0, 34, 14, 1, PL.s3);
    Z(-5, 15, 1, 20, PL.s3);
    Z(4, 15, 1, 20, PL.s3);
    Z(-5, 35, 10, 1, PL.s3);
    Z(-1, 19, 2, 10, PL.s1);
    Z(-3, 22, 6, 2, PL.s1);
    Z(13 + k0, 26, 1, 6, PL.s1);
    Z(11 + k0, 28, 5, 1, PL.s1);
    Z(-13 + k0, 28, 1, 5, PL.s1);
    Z(-15 + k0, 30, 5, 1, PL.s1);
    Z(-12 + k0, 27, 1, 1, PL.s4);
    Z(15 + k0, 27, 1, 1, PL.s4);
    Z(-16 + k1, 19, 2, 2, PL.s4);
    Z(14 + k1, 19, 2, 2, PL.s4);
    legZ(Z, 0, -5, 6, 1, 1);
    legZ(Z, 1, 5, 6, 1, 1);
    // zirah dada ramping dengan lambang salib, sabuk coklat bercincin
    Z(-8, -1, 16, 12, PL.s2);
    Z(-8, -1, 16, 2, PL.s1);
    Z(-7, 1, 6, 4, PL.s1);
    Z(1, 1, 6, 4, PL.s2);
    Z(-8, 9, 16, 1, PL.s4);
    Z(-8, 10, 16, 1, PL.s5);
    Z(-1, 1, 2, 8, PL.s5);
    Z(-4, 3, 8, 2, PL.s5);
    Z(-1, 1, 2, 1, PL.s4);
    Z(-9, 11, 18, 4, PL.b2);
    Z(-9, 11, 18, 1, PL.b1);
    for (const x of [-6, 0, 6]) {
      Z(x - 2, 10, 4, 6, PL.s3);
      Z(x - 1, 11, 2, 4, PL.b2);
      Z(x - 2, 10, 4, 1, PL.s1);
    }
    Z(-10, 15, 2, 7, PL.b2);
    Z(8, 15, 2, 7, PL.b2);
    Z(-10, 21, 2, 1, PL.s3);
    Z(8, 21, 2, 1, PL.s3);
    // bahu mungil
    for (const s of [-1, 1]) {
      const M = (a, w) => s < 0 ? a : -a - w, hi = s < 0 ? PL.s1 : PL.s2, md = s < 0 ? PL.s2 : PL.s3;
      ZP(M(-18, 10), -4, 10, 5, md);
      ZP(M(-18, 10), -4, 10, 1, hi);
      ZP(M(-17, 4), -3, 4, 2, hi);
      ZP(M(-18, 10), 0, 10, 1, PL.s4);
      ZP(M(-19, 11), 1, 11, 5, md);
      ZP(M(-19, 11), 1, 11, 1, hi);
      ZP(M(-18, 4), 2, 4, 2, hi);
      ZP(M(-19, 11), 5, 11, 1, PL.s5);
      ZP(M(-14, 2), 2, 2, 2, PL.s5);
    }
    scarfZ(Z, 11);
    Z(-2, -2, 4, 4, PL.s3);
    Z(-1, -2, 2, 2, PL.s1);
    Z(-1, 0, 2, 1, PL.s5);
    faceZ(ZH);
    // rambut: kubah, poni tirai, helai samping jatuh di dada, pita merah
    const H = PL.hk, M = PL.hm, L = PL.hh;
    ZH(-6, -33, 12, 2, H);
    ZH(-10, -32, 20, 2, H);
    ZH(-13, -30, 26, 3, H);
    ZH(-15, -27, 30, 4, H);
    ZH(-16, -23, 32, 6, H);
    const B = [
      [-14, 4, 4], [-11, 4, 5], [-8, 3, 4], [-5, 3, 5], [-2, 4, 6], [1, 3, 4], [4, 3, 5], [6, 3, 4], [9, 4, 5], [12, 3, 3]
    ];
    B.forEach(([x, w, l], i) => { ZH(x, -19, w, l, i % 2 ? M : H); ZH(x, -19, 1, l, H); });
    ZH(-9, -31, 5, 1, L);
    ZH(1, -30, 6, 1, L);
    ZH(-13, -26, 4, 1, L);
    ZH(9, -26, 4, 1, L);
    ZH(-4, -25, 5, 1, M);
    ZH(3, -24, 5, 1, M);
    ZH(-8, -22, 4, 1, L);
    ZH(6, -22, 4, 1, L);
    for (let y = -18; y <= 17; y++) {
      const wv = Math.round(Math.sin(y * .5) * 1.2), sw = y > 4 ? hsx : 0, c = y % 6 < 2 ? M : H;
      ZH(-17 + wv + sw, y, 7, 1, c);
      ZH(10 - wv + sw, y, 7, 1, c);
      if (y % 7 == 3) {
        ZH(-16 + wv + sw, y, 1, 1, L);
        ZH(11 - wv + sw, y, 1, 1, L);
      }
    }
    ZH(-16 + hsx, 18, 5, 2 + hlen, H);
    ZH(11 + hsx, 18, 5, 2 + hlen, H);
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
  };
  const Qo = (a, b, w, h) => {
    const T = g.getTransform(), sn = T.b || T.c ? null : [v => (Math.round(v * T.a + T.e) - T.e) / T.a, v => (Math.round(v * T.d + T.f) - T.f) / T.d]; let x0 = ox + a - .5, y0 = oy + b - .5, x1 = x0 + w + 1, y1 = y0 + h + 1; if (sn) {
      x0 = sn[0](x0);
      x1 = sn[0](x1);
      y0 = sn[1](y0);
      y1 = sn[1](y1);
      if (x1 <= x0)
        x1 = x0 + 1 / T.a;
      if (y1 <= y0)
        y1 = y0 + 1 / T.d;
    } g.fillStyle = HT ? '#fff' : '#0b0a10'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  }, Qf = (a, b, w, h, c) => {
    const T = g.getTransform(), sn = T.b || T.c ? null : [v => (Math.round(v * T.a + T.e) - T.e) / T.a, v => (Math.round(v * T.d + T.f) - T.f) / T.d]; let x0 = ox + a, y0 = oy + b, x1 = x0 + w, y1 = y0 + h; if (sn) {
      x0 = sn[0](x0);
      x1 = sn[0](x1);
      y0 = sn[1](y0);
      y1 = sn[1](y1);
      if (x1 <= x0)
        x1 = x0 + 1 / T.a;
      if (y1 <= y0)
        y1 = y0 + 1 / T.d;
    } g.fillStyle = HT || c; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  };
  const rr = FEM ? runF : run;
  rr(Qo);
  rr(Qf);
  HSH = { ox, oy, st, f, bl, fl, pdy, run: rn, sw: FEM ? 7 : 8 };
  if (ghost) {
    for (const s of [-1, 1])
      limb(ox + s * 8, oy + 2, ox + s * 9.5, oy + 13 - Math.round(s * st * 2), 1, s);
  }
}
const WS = [
  {
    S: .34, ax: 32, ay: 74, sr: 'crispEdges', svg: '<path fill="#0f0e14" d="M25 9 L32 1 L39 9 V65 H25 Z"/><path fill="#aeb4c2" d="M26 10 L32 3 V64 H26 Z"/><path fill="#eef1f7" d="M32 3 L38 10 V64 H32 Z"/><path fill="#7b8094" d="M26 10 H28 V64 H26 Z"/><path fill="#8f1a30" d="M30.5 14 H33.5 V56 H30.5 Z"/><path fill="#d0394f" d="M32 14 H33.5 V56 H32 Z"/><path fill="#0f0e14" d="M12 62 H52 V71 H12 Z"/><path fill="#8d91a1" d="M14 64 H50 V69 H14 Z"/><path fill="#d9dce5" d="M14 64 H50 V66 H14 Z"/><path fill="#c42a48" d="M29.5 65 H34.5 V69 H29.5 Z"/><path fill="#23232e" d="M14 69 H22 V70 H14 Z M42 69 H50 V70 H42 Z"/><path fill="#0f0e14" d="M27 70 H37 V88 H27 Z"/><path fill="#1f1e28" d="M29 71 H35 V87 H29 Z"/><path fill="#9a1f35" d="M29 73 H35 V75 H29 Z M29 79 H35 V81 H29 Z"/><path fill="#0f0e14" d="M25 86 H39 V95 H25 Z"/><path fill="#aeb4c2" d="M27 87 H37 V94 H27 Z"/><path fill="#c42a48" d="M30.5 88.5 H33.5 V92 H30.5 Z"/>'
  },
  {
    S: .4, ax: 32, ay: 68, sr: 'crispEdges', svg: '<path fill=\"#0f0e14\" d=\"M29 36 H35 V99 H29 Z\"/><path fill=\"#3a1520\" d=\"M30 37 H34 V98 H30 Z\"/><path fill=\"#7a2c40\" d=\"M31 38 H32 V97 H31 Z\"/><path fill=\"#1d1216\" d=\"M30 62 H34 V78 H30 Z\"/><path fill=\"#4a2a30\" d=\"M30 64 H34 V65 H30 Z M30 68 H34 V69 H30 Z M30 72 H34 V73 H30 Z M30 76 H34 V77 H30 Z\"/><path fill=\"#d9aa3c\" d=\"M29 60 H35 V62 H29 Z M29 78 H35 V80 H29 Z\"/><path fill=\"#9a741f\" d=\"M29 61 H35 V62 H29 Z M29 79 H35 V80 H29 Z\"/><path fill=\"#0f0e14\" d=\"M28.5 92 H35.5 V99 H28.5 Z\"/><path fill=\"#d9aa3c\" d=\"M29.5 93 H34.5 V98 H29.5 Z\"/><path fill=\"#9a741f\" d=\"M33 93 H34.5 V98 H33 Z\"/><path fill=\"#0f0e14\" d=\"M28 40 L23 53 L27 60 L29 54 L30 62 L32 53 L34 62 L35 54 L37 60 L41 53 L36 40 Z\"/><path fill=\"#b01f3a\" d=\"M29 41 L25 52 L27.5 57 L29.5 51 L30.5 59 L32 50 L33.5 59 L34.5 51 L36.5 57 L39 52 L35 41 Z\"/><path fill=\"#ff6b86\" d=\"M30 42 L28 49 L30 47 Z M33 42 L33 48 L35 46 Z\"/><g><path fill=\"#0f0e14\" d=\"M11 17 L16 27 L22 32 L29 34 V40 L20 38 L12 32 L8 23 Z\"/><path fill=\"#aeb4c2\" d=\"M12 20 L16 28 L22 32 L29 35 V38 L21 36 L13 31 L10 24 Z\"/><path fill=\"#eef1f7\" d=\"M11 18 L12 20 L14 26 L13 22 Z\"/></g><g transform=\"translate(64,0) scale(-1,1)\"><path fill=\"#0f0e14\" d=\"M11 17 L16 27 L22 32 L29 34 V40 L20 38 L12 32 L8 23 Z\"/><path fill=\"#aeb4c2\" d=\"M12 20 L16 28 L22 32 L29 35 V38 L21 36 L13 31 L10 24 Z\"/><path fill=\"#eef1f7\" d=\"M11 18 L12 20 L14 26 L13 22 Z\"/></g><path fill=\"#0f0e14\" d=\"M32 0 L42 17 L39 25 L37 31 V41 H27 V31 L25 25 L22 17 Z\"/><path fill=\"#8d94a8\" d=\"M32 3 L25 17 L27.5 25 L29.5 31 V39 H32 Z\"/><path fill=\"#e6e9f1\" d=\"M32 3 L39 17 L36.5 25 L34.5 31 V39 H32 Z\"/><path fill=\"#c42a48\" d=\"M31 10 H33 V30 H31 Z\"/><path fill=\"#ff6b86\" d=\"M32 10 H33 V20 H32 Z\"/><path fill=\"#0f0e14\" d=\"M26.5 36 H37.5 V42 H26.5 Z\"/><path fill=\"#d9aa3c\" d=\"M27.5 37 H36.5 V41 H27.5 Z\"/><path fill=\"#ffe08a\" d=\"M28 37 H31 V38 H28 Z\"/><path fill=\"#9a741f\" d=\"M27.5 40 H36.5 V41 H27.5 Z\"/>'
  },
  {
    S: .26, ax: 33, ay: 51, sr: 'geometricPrecision', svg: '<g transform="translate(64,0) scale(-1,1)"><path fill="none" stroke="#0f0e14" stroke-width="9" d="M31 7 Q5 48 31 94"/><path fill="none" stroke="#5a2234" stroke-width="6" d="M31 7 Q5 48 31 94"/><path fill="none" stroke="#d0405c" stroke-width="3" d="M30 9 Q10 49 30 92"/><path fill="#0f0e14" d="M25 41 H36 V61 H25 Z"/><path fill="#1f1e28" d="M27 43 H34 V59 H27 Z"/><path fill="#c42a48" d="M27 46 H34 V48 H27 Z M27 55 H34 V57 H27 Z"/><path fill="#aeb4c2" d="M28 4 H34 V10 H28 Z M28 91 H34 V97 H28 Z"/></g>'
  },
  {
    S: .3, ax: 32.5, ay: 62, sr: 'crispEdges', svg: '<path fill="#0f0e14" d="M29 28 H36 V99 H29 Z"/><path fill="#2a2128" d="M30.5 29 H34.5 V98 H30.5 Z"/><path fill="#5d3a46" d="M31.5 30 H32.5 V97 H31.5 Z"/><path fill="#9a1f35" d="M30.5 58 H34.5 V62 H30.5 Z M30.5 66 H34.5 V70 H30.5 Z"/><path fill="#8d91a1" d="M30 95 H35 V99 H30 Z"/><path fill="#0f0e14" d="M18 2 L27 9 L30 28 H35 L38 9 L47 2 L44 15 L38 29 H27 L21 15 Z"/><path fill="#aeb4c2" d="M20 4 L26 11 L29 26 L27 27 L22 15 Z M45 4 L39 11 L36 26 L38 27 L43 15 Z"/><path fill="#0f0e14" d="M32.5 0 L39 14 L32.5 29 L26 14 Z"/><path fill="#d0306e" d="M32.5 2 L37.5 14 L32.5 27 L27.5 14 Z"/><path fill="#ff7aa8" d="M32.5 2 L37.5 14 H32.5 Z"/><path fill="#7a1450" d="M32.5 14 H37.5 L32.5 27 Z"/><path fill="#8d91a1" d="M27 28 H38 V32 H27 Z"/><path fill="#d9dce5" d="M27 28 H38 V29.5 H27 Z"/>'
  },
  {
    S: .3, ax: 32, ay: 63, sr: 'crispEdges', svg: '<path fill="#0f0e14" d="M32 1 L39 14 V50 H25 V14 Z"/><path fill="#9aa1b4" d="M32 3 L27 14 V49 H32 Z"/><path fill="#eef1f7" d="M32 3 L37 14 V49 H32 Z"/><path fill="#8f1a30" d="M31 14 H33 V46 H31 Z"/><path fill="#0f0e14" d="M21 48 H43 V55 H21 Z"/><path fill="#8d91a1" d="M23 49.5 H41 V53.5 H23 Z"/><path fill="#c42a48" d="M30.5 50 H33.5 V53 H30.5 Z"/><path fill="#0f0e14" d="M28 54 H36 V72 H28 Z"/><path fill="#1f1e28" d="M29.5 55 H34.5 V71 H29.5 Z"/><path fill="#9a1f35" d="M29.5 58 H34.5 V60 H29.5 Z M29.5 65 H34.5 V67 H29.5 Z"/><path fill="#0f0e14" d="M27 70 H37 V77 H27 Z"/><path fill="#aeb4c2" d="M28.5 71 H35.5 V76 H28.5 Z"/>'
  }
];
WS.forEach(o => { const f = o.S * 2, i = new Image(); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + Math.round(64 * f) + '" height="' + Math.round(100 * f) + '" viewBox="0 0 64 100" shape-rendering="' + o.sr + '">' + o.svg + '</svg>'); o.im = i; });

function wspr(i, ox, oy, rot, sc = 1) {
  const o = WS[i], im = o.im; if (!im.width)
    return; const f = im.width / 64; g.save(); g.translate(ox, oy); g.rotate(rot); g.scale(.5 * sc, .5 * sc); g.imageSmoothingEnabled = true; g.drawImage(im, -o.ax * f, -o.ay * f); g.restore();
}

// ===== Pose senjata: tangan benar-benar memegang gagang =====
// ===== IDLE PEDANG: koreografi bergantian (santai / putar / siaga / sabet) + kilau bilah =====
const swH = k => { const x = Math.sin(k * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };
const swK = n => {
  let kd = Math.floor(swH(n) * 4); if (kd == Math.floor(swH(n - 1) * 4))
    kd = (kd + 1) % 4; return kd;
};

function swIdle(hs, id, ar0) {
  const T = 4.8, n = Math.floor(t / T), u = (t % T) / T, kd = swK(n), ss = (a, b, x) => { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
  let da = Math.sin(t * 1.3) * .08, dx = 0, dy = Math.sin(t * 1.7) * .5, tr = 0, gl = 0;
  if (kd == 0) {
    da += Math.sin(t * .9) * .14;
    dx += Math.sin(t * .9 + 1) * .8;
  } // santai: bandul pelan
  else if (kd == 1) {
    const s = ss(.18, .62, u);
    da += hs * 6.2832 * s;
    dy -= Math.sin(s * 3.1416) * 3;
    dx += hs * Math.sin(s * 3.1416) * 1.5;
    tr = Math.sin(s * 3.1416);
  } // putar pedang
  else if (kd == 2) {
    const e = ss(.12, .32, u) - ss(.72, .92, u);
    da += wrapA(p.face - hs * .3 - ar0) * e;
    dx -= hs * 3.5 * e;
    dy -= 6.5 * e;
    gl = e;
  } // siaga, bilah menyala
  else {
    const s1 = ss(.3, .4, u), s2 = ss(.4, .47, u), s3 = ss(.47, .8, u);
    da += hs * (-.8 * s1 + 2.2 * s2) * (1 - s3);
    dy -= 2 * s1 * (1 - s2);
    tr = Math.min(1, 4 * s2 * (1 - s2) * (1 - s3));
  } // sabet cepat
  da *= id;
  dx *= id;
  dy *= id;
  tr *= id;
  gl *= id;
  const gs = ss(.55, .82, u) * (u < .85 ? 1 : 0);
  return {
    da, dx, dy, fx: (x, y, a) => {
      g.save();
      if (gl > .02) {
        const pu = .7 + .3 * Math.sin(t * 7);
        g.fillStyle = 'rgba(255,70,100,' + .16 * gl * pu + ')';
        for (const d of [10, 17, 24]) {
          g.beginPath();
          g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 5 + 2 * gl, 0, 7);
          g.fill();
        }
      }
      if (tr > .04) {
        g.lineCap = 'round';
        const sd = hs >= 0 ? 1 : -1;
        for (let i = 0; i < 7; i++) {
          const aa = a - sd * i * .17;
          g.strokeStyle = 'rgba(255,236,226,' + tr * (1 - i / 7) * .6 + ')';
          g.lineWidth = 3.2 - i * .35;
          g.beginPath();
          g.arc(x, y, 22, aa, aa - sd * .17, sd > 0);
          g.stroke();
        }
      }
      if (id > .3 && gs > .02 && gs < .98) {
        const d = 7 + gs * 18, px = Math.round(x + Math.cos(a) * d), py = Math.round(y + Math.sin(a) * d), L = Math.round(1 + 3 * Math.sin(gs * 3.1416));
        g.globalAlpha = id;
        g.fillStyle = '#fff';
        g.fillRect(px - 1, py - L, 2, L * 2 + 1);
        g.fillRect(px - L, py - 1, L * 2 + 1, 2);
      }
      g.restore();
    }
  };
}

function wpose() {
  const ch = M.d && p.hold > .12, pull = Math.min(1, p.hold / .6), rc = p.recoil > 0 ? p.recoil / (p.rmax || .18) : 0, hn = p.hn, br = Math.sin(t * 2.5), hs = HSd, f = p.face, cf = Math.cos(f), sf = Math.sin(f), bl = p.dod > 0 ? 1 : p.wb, bob = Math.abs(Math.sin(p.wph)) * 1.5 * bl + Math.sin(p.idt) * .5, o = { lx: 0, ly: 0, sp: [], gr: [], fn: null }, side = hs >= 0 ? 1 : -1;
  if (wi == 0 || wi == 1 || wi == 4) {
    const AN = p.an, CH = AN ? anPose(AN) : null, sw = !AN && p.swing > 0, pg = sw ? 1 - p.swing / .14 : 0, k = AN ? Math.max(p.al, Math.min(1, AN.t / .05)) : (sw ? 1 : p.al), sd = p.sd;
    let ro = 0, ex = 0, sc = 1, lat = 0, sr = 0;
    if (CH) {
      ro = CH.ro;
      ex = CH.ex;
      sc = CH.sc;
      lat = CH.lat;
      sr = CH.sr;
    }
    if (sw) {
      ro = -sd * p.sa / 2 + sd * p.sa * Math.min(1, pg * 1.6);
      const s = Math.sin(pg * 3.14);
      if (wi == 1) {
        if (hn == 1)
          ex = s * 6;
        else {
          ro = 0;
          ex = s * (hn == 2 ? 34 : 18) * .78;
          sc = hn == 2 ? 1.15 : 1;
        }
      } else if (wi == 4) {
        if (hn == 0) {
          ro = 0;
          ex = s * 14;
        } else if (hn == 2) {
          ro = sd * pg * 6.28;
          sc = 1.1;
        }
      } else if (hn == 2)
        sc = 1 + .35 * s;
    }
    const lun = CH ? CH.lun : (wi == 1 ? Math.max(0, ex - 6) * .55 : wi == 4 ? ex * .3 : 0), lsub = CH ? (wi == 1 ? lun : 0) : lun;
    o.lx = cf * lun;
    o.ly = sf * lun;
    const Cx = p.x + o.lx, Cy = p.y - 8 - bob + o.ly, a1 = f + ro;
    if (wi == 4) {
      for (const i of [-1, 1]) {
        const rx = Cx + i * 10.5, ry = Cy + 11, bx = Cx + i * 5, by = Cy + 2, ar = Math.PI / 2 - i * .5 + Math.sin(t * 5 + i) * .06, ai = a1 + (CH ? (i > 0 ? CH.roA : CH.roB) : 0), fr = R2(ai, ((8 + ex + (CH ? (i > 0 ? CH.exA : CH.exB) : 0)) - lsub) * k, (i * 2.8 + lat) * k), gx = lp(rx, bx, k) + fr[0], gy = lp(ry, by, k) + fr[1], a = lerpA(ar, ai, k) + sr;
        o.sp.push([4, gx, gy, a + Math.PI / 2, sc]);
        o.gr.push({ x: gx, y: gy, s: i });
      }
      if (CH && CH.tr > .03)
        o.fn = () => anTrail(Cx, Cy, 17 + Math.max(0, ex) + (CH.exA + CH.exB) / 2, a1, Math.sign(CH.srv), CH.tr, 'rgba(255,150,110,.9)');
    } else {
      const ar0 = wi == 0 ? -Math.PI / 2 + hs * .62 + br * .04 * hs + Math.sin(p.wph) * bl * .12 * hs : -Math.PI / 2 + hs * .1 + br * .02, IS = wi == 0 ? swIdle(hs, (1 - p.wb) * (1 - k) * (p.hurt > 0 || p.dod > 0 ? 0 : 1), ar0) : null, rx = Cx + hs * (wi == 1 ? 13 : wi == 0 ? 9.5 : 10.5) + (IS ? IS.dx : 0), ry = Cy + (wi == 1 ? 7 : wi == 0 ? 6 : 11) + (IS ? IS.dy : 0) - (wi == 0 ? side * Math.sin(p.wph - .45) * bl * 2.4 : 0), bx = Cx + hs * 7, by = Cy + 3, ar = ar0 + (IS ? IS.da : 0), fr = R2(a1, ((8.5 + ex) - lsub) * k, lat * k), gx = lp(rx, bx, k) + fr[0], gy = lp(ry, by, k) + fr[1], a = lerpA(ar, a1 + (wi == 0 && !sw ? -hs * .16 * (CH ? CH.so : 1) : 0), k) + sr;
      o.sp.push([wi, gx, gy, a + Math.PI / 2, sc]);
      o.gr.push({ x: gx, y: gy, s: side });
      if (wi == 0)
        o.gr.push({ x: gx - Math.cos(a) * 4.5, y: gy - Math.sin(a) * 4.5, s: -side });
      if (IS)
        o.fn = () => IS.fx(gx, gy, a);
      if (CH && CH.tr > .03) {
        const _f = o.fn, tr0 = CH.tr, tv = Math.sign(CH.srv), tl = (wi == 0 ? 25 : 20) * sc * .92;
        o.fn = () => {
          if (_f)
            _f(); anTrail(gx, gy, tl, a, tv, tr0, wi == 0 ? 'rgba(190,225,255,.9)' : 'rgba(255,150,140,.9)');
        };
      }
    }
  } else if (wi == 2) {
    const AN = p.an, CH = AN ? anPose(AN) : null, chA = CH ? CH.pull > .06 : ch, pv = CH ? CH.pull : pull, k = CH ? Math.max(p.al, Math.min(1, AN.t / .05)) : ((ch || rc > 0) ? 1 : p.al), rcc = hn == 1 ? Math.abs(Math.sin(rc * 6.28)) : rc, lun = CH ? CH.lun : 0;
    o.lx = cf * lun;
    o.ly = sf * lun;
    const bx = CH ? (10 + CH.ex) * k : (10 - rcc * 3 * (hn == 2 ? 1.6 : 1)) * k, Cx = p.x + o.lx, Cy = p.y - 8 - bob + o.ly, ra = f + (CH ? CH.ro : 0), fr = R2(ra, bx, 0), gx = lp(Cx + hs * 11, Cx + hs * 3, k) + fr[0], gy = lp(Cy + 10, Cy + 3, k) + fr[1], a = lerpA(0, ra, k), rel = CH ? -pv * 7 + CH.rec * Math.sin(AN.t * 62) * 2.4 : (ch ? -pull * 7 : (k > .5 ? rcc * 2 : .6)), glow = CH ? (AN.hn == 2 ? Math.min(1, CH.rec) : 0) : (rc > 0 && hn == 2 ? rc : 0);
    o.sp.push([2, gx, gy, a, 1]);
    o.gr.push({ x: gx, y: gy, s: side });
    if (k > .35 || chA) {
      const s2 = R2(a, rel, 0);
      o.gr.push({ x: gx + s2[0], y: gy + s2[1], s: -side });
    }
    o.fn = () => {
      g.save();
      g.translate(gx, gy);
      g.rotate(a);
      g.lineWidth = 1;
      g.strokeStyle = '#e6d8c8';
      g.beginPath();
      g.moveTo(0, -11.3);
      g.lineTo(rel, 0);
      g.lineTo(0, 11.3);
      g.stroke();
      if (chA) {
        g.fillStyle = '#c2a17a';
        g.fillRect(rel, -.8, 17, 1.6);
        g.fillStyle = '#dce2ec';
        g.beginPath();
        g.moveTo(rel + 17, -2);
        g.lineTo(rel + 21, 0);
        g.lineTo(rel + 17, 2);
        g.fill();
        g.fillStyle = '#a33b4c';
        g.fillRect(rel, -2, 4, 1.2);
        g.fillRect(rel, .8, 4, 1.2);
      }
      if (CH && AN.hn == 2 && pv > .5) {
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = 'rgba(255,230,150,' + (pv - .5) * .5 + ')';
        g.beginPath();
        g.arc(rel + 19, 0, 3 + pv * 4, 0, 7);
        g.fill();
      }
      if (glow > 0) {
        g.fillStyle = 'rgba(255,230,150,' + glow * .6 + ')';
        g.beginPath();
        g.arc(24, 0, 6 * glow + 2, 0, 7);
        g.fill();
      }
      g.restore();
    };
  } else {
    const AN = p.an, CH = AN ? anPose(AN) : null, k = CH ? Math.max(p.al, Math.min(1, AN.t / .05)) : ((ch || rc > 0) ? 1 : p.al), lun = CH ? CH.lun : 0;
    o.lx = cf * lun;
    o.ly = sf * lun;
    const an = CH ? CH.ro : (hn == 1 ? Math.sin((1 - rc) * 6.28) * .8 * rc : hn == 2 ? -rc * .9 : 0), oxs = CH ? 8 + CH.ex : 8 + (hn == 0 ? rc * 4 : hn == 2 ? -rc * 3 : 0), rad = 3 + (CH ? CH.orb * 3 : (ch ? pull * 3 : 0) + rc * 4) + Math.sin(t * 8) * .6, Cx = p.x + o.lx, Cy = p.y - 8 - bob + o.ly, a1 = f + an, fr = R2(a1, oxs * k, CH ? CH.lat * k : 0), gx = lp(Cx + hs * 13.5, Cx + hs * 7, k) + fr[0], gy = lp(Cy + 9, Cy + 3, k) + fr[1], a = lerpA(-Math.PI / 2 + hs * .1 + br * .03, a1, k) + (CH ? CH.sr : 0), ox2 = gx + Math.cos(a) * 14, oy2 = gy + Math.sin(a) * 14, big2 = CH ? CH.orb > .35 : (ch || rc > 0);
    o.sp.push([3, gx, gy, a + Math.PI / 2, 1]);
    o.gr.push({ x: gx, y: gy, s: side });
    o.fn = () => {
      if (CH && CH.tr > .03)
        anTrail(gx, gy, 14, a, Math.sign(CH.srv), CH.tr, 'rgba(210,170,255,.9)');
      orb(ox2, oy2, lp(6 + Math.sin(t * 9) * .8, rad + 4, k), lp(.7, 1, k));
      if (big2)
        orb(ox2, oy2, rad * .9, 1.4);
      if (CH ? CH.orb > .5 : ch)
        for (let i = 0; i < 4; i++) {
          const q = t * 7 + i * 1.57, rr2 = CH ? 10 - Math.min(1, CH.orb / 2) * 3 : 10 - pull * 3;
          g.fillStyle = '#fff';
          g.fillRect(ox2 + Math.cos(q) * rr2 - 1, oy2 + Math.sin(q) * rr2 - 1, 2, 2);
        }
    };
  }
  return o;
}

function drawArmed(o) {
  const H = HSH;
  if (!H)
    return;
  const by = {};
  o.gr.forEach(q => by[q.s] = q);
  for (const s of [-1, 1]) {
    const q = by[s], sx = H.ox + s * (H.sw || 8), sy = H.oy + 2;
    if (q)
      limb(sx, sy, q.x, q.y, 0, s);
    else
      limb(sx, sy, sx + s * 1.5, H.oy + 13, 1, s);
  }
  o.sp.forEach(a => wspr(...a));
  if (o.fn)
    o.fn();
  o.gr.forEach(q => fist(q.x, q.y));
}

// ===== Model musuh: Half-Skeleton (slime), Dark Wizard (mage), Skeleton Archer (skel) =====
const MC = {
  dark: "#171720", armor: "#343440", armorLight: "#555361", bone: "#d0c5a8", boneDark: "#827967", red: "#873d49", purple: "#7652a0", magic: "#b99aff", wood: "#765039"
};
let MT = null, ENM = null;
const mr = (x, y, w, h, c) => { g.fillStyle = MT || c; g.fillRect(Math.round(x), Math.round(y), w, h); };
const ms = c => MT || c, msw = q => Math.sin(q * Math.PI);

function mSkull() {
  // Skull
  mr(301, 179, 41, 38, MC.bone);
  mr(297, 187, 5, 19, MC.boneDark);
  mr(341, 187, 5, 19, MC.boneDark);
  mr(304, 174, 35, 9, "#e0d5bd");
  mr(308, 170, 27, 6, MC.bone);
  // Eye sockets
  mr(306, 190, 11, 12, "#211e25");
  mr(327, 190, 11, 12, "#211e25");
  // Glowing eyes
  mr(309, 194, 6, 4, "#a8323d");
  mr(330, 194, 6, 4, "#a8323d");
  // Nose and jaw
  mr(319, 202, 5, 6, "#6e6259");
  mr(309, 211, 25, 9, MC.boneDark);
  mr(312, 211, 19, 5, "#e4d8c0");
}

function mArcher(pp, at, tm) {
  let p = pp;
  let swing = msw(p);
  let aiming = at;
  g.save();
  if (aiming)
    g.translate(0, -swing * 5);
  // Kaki: sendi lutut bergerak (IK)
  mLeg(307.5, -1, 17, MC.armor, MC.bone);
  mLeg(333.5, 1, 17, '#292831', MC.bone);
  // Chest bones
  mr(301, 231, 39, 57, MC.bone);
  for (let i = 0; i < 5; i++) {
    mr(305, 243 + i * 8, 31, 3, MC.boneDark);
    mr(307, 244 + i * 8, 26, 2, "#e0d5bd");
  }
  // Chest armor
  mr(292, 232, 57, 17, MC.armor);
  mr(289, 243, 12, 37, "#45434f");
  mr(340, 243, 12, 37, "#45434f");
  // Armor plates
  mr(296, 236, 13, 10, "#77717c");
  mr(333, 236, 13, 10, "#77717c");
  mr(299, 254, 9, 20, "#292833");
  mr(334, 254, 9, 20, "#292833");
  // Leather straps
  mr(310, 235, 5, 42, MC.wood);
  mr(326, 235, 5, 42, MC.wood);
  // Belt
  mr(294, 280, 52, 7, "#60432e");
  mr(314, 279, 12, 9, "#b09a70");
  // Shoulder armor
  mr(282, 232, 18, 20, "#494650");
  mr(344, 232, 18, 20, "#494650");
  mr(284, 229, 13, 5, "#817984");
  mr(347, 229, 13, 5, "#817984");
  // Skull
  mSkull();
  // Dark hood
  mr(296, 170, 47, 8, "#292530");
  mr(299, 166, 40, 7, "#48434d");
  mr(297, 177, 7, 15, "#37313d");
  mr(337, 177, 7, 15, "#37313d");
  // Red neck cloth
  mr(295, 218, 49, 9, MC.red);
  mr(292, 225, 9, 17, MC.red);
  mr(289, 240, 8, 8, "#5e2835");
  // Lengan & busur: membidik ke arah target, tarik tali, lepas (IK)
  const E = ENM || {}, k = E.kick || 0, sm = u => u * u * (3 - 2 * u), cl = (v, a, b) => Math.max(a, Math.min(b, v)), m = E.mz || 0, ws = Math.cos(E.gp || 0) * 4 * m;
  const ddx = (E.tx - E.x) || 0, ddy = (E.ty - E.y) || 1, dl = Math.hypot(ddx, ddy) || 1, dX = ddx / dl, dY = ddy / dl;
  const w = at ? sm(cl(p / .22, 0, 1)) : sm(k), hp = at ? sm(cl((p - .18) / .72, 0, 1)) : k, rc = at ? 0 : k, sw = Math.sin(tm * 2) * 1.5 * (1 - w);
  const iR = [358, 272 + sw + ws], iL = [288, 278 - sw - ws];
  const bhx = iR[0] + (353 + dX * 22 - dX * rc * 5 - iR[0]) * w, bhy = iR[1] + (246 + dY * 22 - dY * rc * 5 - iR[1]) * w, bcx = bhx, bcy = bhy - 14 * (1 - w);
  let th = Math.PI / 2 - Math.atan2(dX, dY);
  th = Math.atan2(Math.sin(th), Math.cos(th)) * w;
  const ltx = iL[0] + (bcx - dX * hp * 22 - iL[0]) * w, lty = iL[1] + (bcy - dY * hp * 22 - iL[1]) * w;
  mLimb2(353, 246, bhx, bhy, 20, 20, 1, 13, '#45434f', MC.wood, null, MC.bone);
  const hl = mLimb2(289, 246, ltx, lty, 20, 20, -1, 13, '#45434f', MC.wood, null, MC.bone);
  const lx = Math.cos(th) * (hl[0] - bcx) + Math.sin(th) * (hl[1] - bcy), nx = at ? Math.min(0, Math.max(-26, lx * w)) : (k > 0 ? Math.sin(tm * 70) * 3 * k : 0);
  // Bow
  g.save();
  g.translate(bcx, bcy);
  g.rotate(th);
  g.strokeStyle = ms("#9b6842");
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(0, -37);
  g.quadraticCurveTo(30, 0, 0, 37);
  g.stroke();
  g.strokeStyle = ms("#d5c9b9");
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, -37);
  g.lineTo(nx, 0);
  g.lineTo(0, 37);
  g.stroke();
  mr(-3, -5, 6, 10, MC.wood);
  if (at) {
    mr(nx, -1, 40, 3, "#c7c7c2");
    mr(nx + 38, -3, 5, 6, "#dce1e5");
    mr(nx, -4, 7, 2, MC.wood);
    mr(nx, 2, 7, 2, MC.wood);
  }
  g.restore();
  // Quiver
  mr(273, 216, 13, 47, "#60432e");
  mr(276, 211, 7, 9, "#b3a28b");
  mr(276, 202, 3, 15, "#c5cbd2");
  mr(281, 205, 3, 12, "#c5cbd2");
  mr(285, 208, 3, 10, "#c5cbd2");
  mr(280, 229, 7, 3, "#9a805d");
  // Armor details
  mr(297, 247, 5, 4, "#9a4650");
  mr(340, 247, 5, 4, "#9a4650");
  g.restore();
}

function mWizard(pp, at, tm) {
  let bob = Math.sin(tm * 3) * 2;
  let p = pp;
  g.save();
  g.translate(0, -bob);
  // Robe bottom
  mr(291, 275, 59, 61, "#292335");
  mr(286, 300, 69, 32, "#393047");
  mr(293, 324, 57, 9, "#1c1a27");
  // Robe details
  mr(299, 286, 7, 40, "#57466d");
  mr(337, 286, 7, 40, "#57466d");
  mr(313, 289, 15, 34, "#201c2d");
  // Belt
  mr(293, 274, 56, 7, MC.wood);
  mr(315, 274, 12, 8, "#b89a58");
  // Shoulders
  mr(285, 229, 70, 34, "#393047");
  mr(291, 232, 58, 12, "#57466d");
  // Head
  mr(304, 190, 33, 31, "#b58d80");
  // Hood
  mr(296, 179, 48, 25, "#211d2c");
  mr(301, 170, 38, 16, "#30283f");
  mr(307, 167, 26, 7, "#413451");
  // Dark face
  mr(303, 193, 37, 23, "#171720");
  mr(310, 202, 5, 3, MC.magic);
  mr(329, 202, 5, 3, MC.magic);
  // Collar
  mr(298, 218, 46, 14, "#56436e");
  mr(311, 218, 20, 5, "#a48bc1");
  // Lengan (IK): kumpulkan sihir -> lempar -> follow-through
  const E = ENM || {}, k = E.kick || 0, m = E.mz || 0, ws = Math.cos(E.gp || 0) * 4 * m, sw = at ? 0 : Math.sin(tm * 2);
  const FR = [[0, [357, 274, -.08]], [.6, [374, 216, -.3]], [.78, [374, 212, -.35]], [1, [352, 276, 1.9]]], FL = [[0, [288, 274]], [.6, [262, 226]], [.78, [258, 222]], [1, [262, 262]]];
  const qr = mAct(at, p, FR), ql = mAct(at, p, FL), gi = at ? Math.min(1, p * 1.4) : k;
  const hl = mLimb2(290, 246, ql[0], ql[1] - ws, 19, 19, -1, 14, '#393047', '#393047', null, '#b58d80');
  const hr = mLimb2(353, 246, qr[0], qr[1] + sw + ws, 19, 19, 1, 14, '#393047', '#393047', null, '#b58d80');
  if (at) {
    const r = 8 + 14 * p, q = g.createRadialGradient(hl[0], hl[1], 1, hl[0], hl[1], r);
    q.addColorStop(0, 'rgba(230,200,255,.85)');
    q.addColorStop(1, 'rgba(150,90,255,0)');
    g.fillStyle = q;
    g.fillRect(hl[0] - r, hl[1] - r, 2 * r, 2 * r);
  }
  // Staff
  g.save();
  g.translate(hr[0] + 1, hr[1] - 6);
  g.rotate(qr[2]);
  mr(0, -48, 6, 95, MC.wood);
  mr(-5, -57, 16, 12, "#57436f");
  mr(-3, -63, 12, 9, MC.purple);
  mr(0, -61, 5, 5, "#e5d7ff");
  if (gi > 0) {
    const q = g.createRadialGradient(2, -58, 2, 2, -58, 35);
    q.addColorStop(0, "rgba(195,151,255," + (.8 * gi) + ")");
    q.addColorStop(1, "rgba(150,90,255,0)");
    g.fillStyle = q;
    g.fillRect(-35, -95, 75, 75);
    mr(-2, -61, 9, 9, "#e8d7ff");
  }
  g.restore();
  // Magic particles
  if (at)
    for (let i = 0; i < 7; i++) {
      const a = tm * 3 + i * .9;
      mr(320 + Math.cos(a) * 30, 250 + Math.sin(a) * 25, 4, 4, MC.magic);
    }
  g.restore();
}

function mHalf(pp, at, tm) {
  let p = pp;
  let swing = at ? msw(p) : 0;
  let lean = at ? swing * 5 : Math.sin(tm * 3) * 1.5;
  g.save();
  g.translate(lean, 0);
  // Kaki: sendi pinggul-lutut-pergelangan bergerak (IK)
  mLeg(307.5, -1, 17, '#292831', MC.bone);
  mLeg(333.5, 1, 17, '#292831', MC.bone);
  // Torso bones
  mr(300, 235, 40, 55, MC.bone);
  // Ribs
  for (let i = 0; i < 5; i++) {
    mr(306, 244 + i * 7, 28, 3, MC.boneDark);
    mr(308, 245 + i * 7, 24, 2, "#e0d4b9");
  }
  // Chest armor
  mr(292, 230, 57, 15, MC.armor);
  mr(288, 240, 12, 38, MC.armor);
  mr(343, 240, 12, 38, MC.armor);
  mr(291, 234, 16, 10, MC.armorLight);
  mr(335, 234, 16, 10, MC.armorLight);
  mr(294, 250, 9, 22, "#24242e");
  mr(340, 250, 9, 22, "#24242e");
  // Shoulder armor
  mr(282, 232, 17, 19, "#44414e");
  mr(345, 232, 17, 19, "#44414e");
  mr(285, 229, 12, 5, "#716b77");
  mr(347, 229, 12, 5, "#716b77");
  // Skull
  mSkull();
  // Damaged helmet
  mr(296, 171, 47, 8, "#383640");
  mr(299, 166, 37, 7, "#55515b");
  mr(297, 177, 7, 9, "#4b4650");
  // Torn cloth
  mr(294, 218, 49, 9, MC.red);
  mr(291, 225, 9, 17, MC.red);
  mr(289, 240, 8, 8, "#5e2835");
  // Lengan + pedang + perisai: tebasan berkeyframe (angkat -> tebas -> follow-through)
  const F = [
    [0, [357, 277, -.35]], [.26, [372, 240, 1.2]], [.44, [367, 212, 2.5]], [.5, [367, 211, 2.55]], [.6, [334, 290, -.95]], [.78, [328, 292, -1.2]], [1, [357, 277, -.35]]
  ], FL = [[0, [288, 282]], [.4, [281, 262]], [.6, [286, 276]], [1, [288, 282]]], E = ENM || {}, m = E.mz || 0, ws = Math.cos(E.gp || 0) * 5 * m, ox = at ? 0 : Math.sin(tm * 2) * .8, oy = at ? 0 : Math.cos(tm * 2.2) * .8, qr = mAct(at, p, F), ql = mAct(at, p, FL);
  const hl = mLimb2(290, 244, ql[0], ql[1] - ws, 18, 18, -1, 13, '#343440', '#343440', null, MC.bone);
  mr(hl[0] - 17, hl[1] - 30, 17, 27, '#484450');
  mr(hl[0] - 14, hl[1] - 26, 11, 17, '#69616b');
  mr(hl[0] - 11, hl[1] - 21, 5, 5, '#9c4650');
  const hr = mLimb2(353, 244, qr[0] + ox, qr[1] + oy + ws, 18, 18, 1, 13, '#343440', '#343440', null, MC.bone);
  if (at && p > .5 && p < .75)
    for (let j = 1; j <= 3; j++) {
      const q2 = mKF(p - j * .022, F), r2 = mIK(353, 244, q2[0], q2[1], 18, 18, 1);
      mSword(r2[2], r2[3], q2[2], .24 - j * .06);
    }
  mSword(hr[0], hr[1], qr[2], 1);
  g.restore();
}
const EM = { slime: mHalf, skel: mWizard, mage: mArcher };

function drawEnemy(e) {
  if (e.k == 'dummy') {
    drawDummy(e);
    return;
  }
  const S = e.k == 'boss' ? .4 : .215, atk = e.wind > 0 || e.an > 0;
  let pg = 0;
  if (e.wind > 0)
    pg = 1 - e.wind / (e.k == 'skel' ? .6 : .7);
  else if (e.an > 0)
    pg = 1 - e.an / .6;
  const mvd = Math.hypot(e.x - e.lx, e.y - e.ly);
  e.lx = e.x;
  e.ly = e.y;
  e.wk += ((mvd > .15 && !atk && e.stun <= 0 ? 1 : 0) - e.wk) * .2;
  if (e.k != 'boss')
    enemyAnim(e, mvd, atk, pg);
  g.save();
  const dx = p.x - e.x, dy = p.y - e.y, dl = Math.hypot(dx, dy) || 1, lg = atk ? (e.k == 'slime' ? msw(pg) * 4 : e.k == 'mage' ? -msw(pg) * 1.5 : 0) : 0;
  if (e.k == 'boss')
    g.translate(SMR(e.x + dx / dl * lg), SMR(e.y + 7 + dy / dl * lg));
  else
    g.translate(e.rx + dx / dl * lg, e.ry + 7 + dy / dl * lg);
  g.scale(S, S);
  if (e.stun > 0)
    g.rotate(Math.sin(t * 25) * .05 + .12);
  if (e.k != 'boss') {
    g.rotate(e.zr);
    g.scale(e.zx, e.zy);
  }
  g.translate(0, e.k == 'boss' ? -Math.abs(Math.sin((t + e.ph) * 10)) * 7 * e.wk : -e.hh);
  g.translate(-320, -333);
  ENM = e;
  MT = e.fl > 0 ? '#fff' : null;
  EM[e.k](Math.min(1, pg), atk, t + e.ph);
  MT = null;
  g.restore();
}

// ===== Efek api ungu =====
function flame(q, k) {
  const a = 1 - k, r = q.s * (1.3 - a * .7), c1 = a < .25 ? '255,235,255' : a < .55 ? '210,120,255' : '130,50,210';
  g.save();
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 2);
  gr.addColorStop(0, 'rgba(' + c1 + ',' + k * .9 + ')');
  gr.addColorStop(.5, 'rgba(140,60,220,' + k * .45 + ')');
  gr.addColorStop(1, 'rgba(60,10,120,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(q.x, q.y, r * 2, 0, 7);
  g.fill();
  g.restore();
}

function pfFx(f, k) {
  const a = 1 - k, r = f.r * (.7 + a * .8), pc = f.pc || ['255,245,255', '220,130,255', '110,40,190'];
  g.save();
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
  gr.addColorStop(0, 'rgba(' + pc[0] + ',' + k * k + ')');
  gr.addColorStop(.3, 'rgba(' + pc[1] + ',' + k * .7 + ')');
  gr.addColorStop(.7, 'rgba(' + pc[2] + ',' + k * .35 + ')');
  gr.addColorStop(1, 'rgba(' + pc[2] + ',0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(f.x, f.y, r, 0, 7);
  g.fill();
  g.strokeStyle = 'rgba(' + pc[1] + ',' + k * .8 + ')';
  g.lineWidth = 1 + 2 * k;
  g.beginPath();
  g.arc(f.x, f.y, f.r * (.35 + a), 0, 7);
  g.stroke();
  g.restore();
}

function pfire(x, y, r) {
  puff(x, y, Math.round(r / 8) + 2, '45,25,70', 1.2);
  fx.push({ k: 'pf', x, y, r, life: .6, max: .6 });
  shake = Math.max(shake, 3);
  for (let i = 0; i < 14 + r * .6; i++) {
    const a = R() * 6.283, d = R() * r * .6, v = 20 + R() * 70;
    dp.push({
      k: 'f', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * .7, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6 - 15, life: .45 + R() * .45, max: .9, s: 3 + R() * r * .18
    });
  }
  for (let i = 0; i < 12; i++) {
    const a = R() * 6.283, v = 30 + R() * 90;
    dp.push({
      k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 25, life: .5 + R() * .5, max: 1, s: 1.5 + R() * 1.5, c: i % 2 ? '#e6b8ff' : '#ff9be8'
    });
  }
}

// ===== Ledakan Arcane (staff) =====
function arcBlast(x, y, r) {
  fx.push({ k: 'ab', x, y, r: r * 1.2, life: .95, max: .95, rot: R() * 6.28 }, { k: 'flare', x, y, a: R() * 3, L: r * 1.1, R: r * .6, c: '215,140,255', life: .26, max: .26 });
  puff(x, y, Math.round(r / 10) + 3, '50,28,80', 1.3);
  shake = Math.max(shake, 3 + r * .06);
  const n = 10 + Math.round(r * .35);
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.283 + R() * .3, v = 60 + R() * 150;
    dp.push({
      k: 'sh', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .75, rot: a, vr: (R() - .5) * 14, life: .5 + R() * .4, max: .9, s: 1.4 + R() * 2.2, c: i % 3 ? '200,130,255' : '255,235,255'
    });
  }
  for (let i = 0; i < 24; i++) {
    const a = R() * 6.283, d = R() * r * .8;
    dp.push({
      k: 'p', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * .7, vx: (R() - .5) * 14, vy: -30 - R() * 70, life: .7 + R() * .7, max: 1.4, s: 1 + R() * 2, c: i % 2 ? '#e6b8ff' : '#fff'
    });
  }
  for (let i = 0; i < 8; i++)
    dp.push({
      k: 'f', x: x + (R() - .5) * r * .5, y: y + (R() - .5) * r * .4, vx: (R() - .5) * 30, vy: -20 - R() * 30, life: .4 + R() * .3, max: .7, s: 3 + R() * r * .14
    });
}

function shardFx(q, k) {
  g.save();
  g.translate(Math.round(q.x), Math.round(q.y));
  g.rotate(q.rot);
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = Math.min(1, k * 1.6);
  const s = q.s * (.5 + k * .5);
  g.fillStyle = 'rgba(' + q.c + ',.9)';
  g.beginPath();
  g.moveTo(s * 2.2, 0);
  g.lineTo(0, s * .7);
  g.lineTo(-s * 1.2, 0);
  g.lineTo(0, -s * .7);
  g.closePath();
  g.fill();
  g.restore();
}

function abFx(f, k) {
  const a = 1 - k, r = f.r;
  let gr;
  g.save();
  g.translate(f.x, f.y);
  g.globalCompositeOperation = 'lighter';
  gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
  gr.addColorStop(0, 'rgba(190,110,255,' + .38 * k * k + ')');
  gr.addColorStop(1, 'rgba(80,20,160,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, 0, r, 0, 7);
  g.fill();
  if (a < .8) {
    const ra = Math.min(1, a * 6) * (1 - a / .8), R0 = r * .92;
    g.save();
    g.scale(1, .72);
    g.rotate(f.rot + a * 2.6);
    g.globalAlpha = ra;
    g.strokeStyle = 'rgb(215,160,255)';
    g.lineWidth = f.w || 1.2;
    g.beginPath();
    g.arc(0, 0, R0, 0, 7);
    g.stroke();
    g.beginPath();
    g.arc(0, 0, R0 * .78, 0, 7);
    g.stroke();
    for (let s = 0; s < 2; s++) {
      g.beginPath();
      for (let i = 0; i < 3; i++) {
        const an = i * 2.0944 + s * 3.1416;
        g.lineTo(Math.cos(an) * R0 * .78, Math.sin(an) * R0 * .78);
      }
      g.closePath();
      g.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const an = i * .5236;
      g.beginPath();
      g.moveTo(Math.cos(an) * R0 * .92, Math.sin(an) * R0 * .92);
      g.lineTo(Math.cos(an) * R0, Math.sin(an) * R0);
      g.stroke();
    }
    g.restore();
  }
  if (a < .55) {
    const pa = 1 - a / .55, w = r * .42 * (1 - a * .9), h = r * 1.7 * Math.min(1, a * 5 + .3);
    gr = g.createLinearGradient(0, 0, 0, -r * 1.7);
    gr.addColorStop(0, 'rgba(240,210,255,' + .7 * pa + ')');
    gr.addColorStop(1, 'rgba(150,70,255,0)');
    g.fillStyle = gr;
    g.fillRect(-w / 2, -h, w, h);
  }
  if (a < .3) {
    const ca = 1 - a / .3, cr = r * (.5 + a * 1.4);
    gr = g.createRadialGradient(0, 0, 0, 0, 0, cr);
    gr.addColorStop(0, 'rgba(255,255,255,' + ca + ')');
    gr.addColorStop(.4, 'rgba(230,170,255,' + .7 * ca + ')');
    gr.addColorStop(1, 'rgba(120,40,220,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, cr, 0, 7);
    g.fill();
  }
  [[0, 1, 3.5], [.12, .8, 2]].forEach(([d, sc, lw]) => {
    const q = (a - d) / (1 - d); if (q <= 0)
      return; const ee = 1 - Math.pow(1 - q, 3); g.globalAlpha = (1 - q) * .9; g.strokeStyle = q < .3 ? 'rgb(255,245,255)' : 'rgb(205,140,255)'; g.lineWidth = lw * (1 - q * .7) + .5; g.beginPath(); g.arc(0, 0, r * sc * (.15 + ee * .95), 0, 7); g.stroke();
  });
  g.restore();
}

function orb(x, y, r, i) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 0, x, y, r * 2.3);
  gr.addColorStop(0, 'rgba(255,245,255,' + Math.min(1, .75 * i) + ')');
  gr.addColorStop(.3, 'rgba(215,130,255,' + .6 * i + ')');
  gr.addColorStop(1, 'rgba(70,15,140,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(x, y, r * 2.3, 0, 7);
  g.fill();
  for (let n = 0; n < 3; n++) {
    const a = t * 7 + n * 2.1;
    g.fillStyle = 'rgba(190,100,255,' + .35 * i + ')';
    g.beginPath();
    g.ellipse(x + Math.sin(a * 1.3) * r * .4, y - Math.abs(Math.sin(a)) * r * .9, r * .35, r * .7, 0, 0, 7);
    g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,' + Math.min(1, .9 * i) + ')';
  g.beginPath();
  g.arc(x, y, Math.max(1, r * .36), 0, 7);
  g.fill();
  if (r > 5) {
    g.strokeStyle = 'rgba(225,170,255,' + .5 * i + ')';
    g.lineWidth = 1;
    g.setLineDash([2, 3]);
    g.lineDashOffset = -t * 12;
    g.beginPath();
    g.arc(x, y, r * 1.35, 0, 7);
    g.stroke();
    g.setLineDash([]);
  }
  for (let n = 0; n < 3; n++) {
    const a = t * 5 + n * 2.094, d = r * 1.55 + Math.sin(t * 9 + n) * r * .25;
    g.fillStyle = n % 2 ? 'rgba(235,190,255,' + .9 * i + ')' : 'rgba(255,255,255,' + .9 * i + ')';
    g.fillRect(Math.round(x + Math.cos(a) * d) - 1, Math.round(y + Math.sin(a) * d * .8) - 1, 2, 2);
  }
  g.restore();
}

// ===== Partikel saat serangan kena musuh =====
const EC = {
  dummy: ['#d8b878', '#8a6a3a', '#fff3d0'], slime: ['#d0c5a8', '#827967', '#aeb1bc'], skel: ['#b48cff', '#e6d6ff', '#ff9be8'], mage: ['#d0c5a8', '#c2a17a', '#aeb1bc']
};

function impact(e, a, crit) {
  const cs = EC[e.k], x = e.x, y = e.y - 3;
  fx.push({ k: 'ring', x, y, r: crit ? 9 : 6, life: .16, max: .16, col: crit ? '#ffd34d' : PL[wi][0] });
  for (let i = 0; i < (crit ? 16 : 8); i++) {
    const q = a + (R() - .5) * 1.6, v = 80 + R() * 140;
    dp.push({
      k: 'p', x, y, vx: Math.cos(q) * v, vy: Math.sin(q) * v, life: .2 + R() * .25, max: .45, s: 1 + R() * 1.5, c: i % 3 ? (crit ? '#ffd34d' : PL[wi][0]) : PL[wi][1]
    });
  }
  for (let i = 0; i < (crit ? 9 : 5); i++) {
    const q = a + (R() - .5) * 2.2, v = 30 + R() * 80;
    dp.push({
      k: 'p', x, y, vx: Math.cos(q) * v, vy: Math.sin(q) * v - 20, life: .4 + R() * .3, max: .7, s: 1.5 + R() * 2, c: cs[i % 2]
    });
  }
  for (let i = 0; i < (crit ? 6 : 3); i++)
    dp.push({ k: 'l', x, y, a: a + (R() - .5) * 1.8 + Math.PI, len: 10 + R() * 14, life: .14, max: .14 });
}

function burst(e) {
  const cs = EC[e.k], x = e.x, y = e.y - 4;
  puff(x, y, 6, '85,80,95', 1.2);
  fx.push({ k: 'ring', x, y, r: 14, life: .3, max: .3, col: cs[0] });
  for (let i = 0; i < 22; i++) {
    const q = R() * 6.283, v = 30 + R() * 130;
    dp.push({
      k: 'p', x, y, vx: Math.cos(q) * v, vy: Math.sin(q) * v - 30, life: .5 + R() * .5, max: 1, s: 2 + R() * 2.5, c: cs[i % 3]
    });
  }
  if (e.k == 'skel')
    pfire(x, y, 18);
}

function toRoom(n) { room = n; WW = DW; WH = DH; walls = n ? W1 : W0; TO = n ? TO1 : TO0; BR = n ? BR1 : BR0; BG = BGS[n]; doorOn = 0; doorO = 0; pr = []; dr = []; gh = []; p.x = 40; p.y = DY; p.vx = p.vy = 0; p.dod = 0; fade = .7; wave++; spawn(); SFX.door(); msg('Ruangan 2: Torch Dungeon — Gelombang ' + wave + ' dimulai!'); }

function drawDoors() {
  const dd = (x0, seal) => {
    const y0 = DY - 32, h = 64, e = x0 > 0 ? -4 : 0;
    g.fillStyle = '#252329';
    g.fillRect(x0 + e, y0 - 8, 18, h + 16);
    g.fillStyle = '#b6a38a';
    g.fillRect(x0 + e, y0 - 12, 18, 6);
    g.fillRect(x0 + e, y0 + h + 6, 18, 6);
    g.fillStyle = '#07060c';
    g.fillRect(x0, y0, 14, h);
    const sl = (seal ? 1 : 1 - doorO) * h / 2;
    g.fillStyle = '#6b5f55';
    g.fillRect(x0, y0, 14, sl);
    g.fillRect(x0, y0 + h - sl, 14, sl);
    g.fillStyle = '#b18b59';
    g.fillRect(x0, y0 + sl - 2, 14, 2);
    g.fillRect(x0, y0 + h - sl, 14, 2);
    if (sl > 2) {
      g.fillStyle = 'rgba(0,0,0,.25)';
      for (let y = y0 + 8; y < y0 + sl; y += 8)
        g.fillRect(x0, y, 14, 1);
      for (let y = y0 + h - 8; y > y0 + h - sl; y -= 8)
        g.fillRect(x0, y, 14, 1);
    }
    if (seal || doorO < .1) {
      g.fillStyle = seal ? 'rgba(190,50,70,' + (.5 + .3 * Math.sin(t * 3)) + ')' : '#c39a5d';
      g.fillRect(x0 + 5, y0 + h / 2 - 3, 4, 6);
    } else {
      g.save();
      g.globalCompositeOperation = 'lighter';
      const q = g.createRadialGradient(x0 + 7, DY, 0, x0 + 7, DY, 70 * doorO);
      q.addColorStop(0, 'rgba(255,225,160,.4)');
      q.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = q;
      g.fillRect(x0 - 70, DY - 70, 150, 140);
      g.restore();
    }
  };
  if (room == 2)
    dd(0, 1);
  else {
    dd(DW - 14, 0);
    if (room == 1)
      dd(0, 1);
  }
  if (room < 2 && doorOn) {
    g.fillStyle = 'rgba(255,223,155,' + (.5 + .4 * Math.sin(t * 6)) + ')';
    const ax = DW - 38 + Math.sin(t * 5) * 4;
    g.beginPath();
    g.moveTo(ax, DY - 7);
    g.lineTo(ax + 11, DY);
    g.lineTo(ax, DY + 7);
    g.fill();
  }
}

/* ===== LANTAI: lapisan detail (noda, bayangan tepi, bingkai, motif tengah, sarang laba-laba / tanah & rumput camp). Dipanggil SEBELUM dinding & properti digambar ===== */
function floorPass(b, w, h, o) {
  let sd = o.seed;
  const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, ri = (a, z) => a + Math.floor(r() * (z - a + 1)), cx = w / 2, cy = h / 2;
  const hit = (x, y, m) => (o.walls || []).some(q => x > q[0] - m && x < q[0] + q[2] + m && y > q[1] - m && y < q[1] + q[3] + m) || x < 30 || y < 30 || x > w - 30 || y > h - 30;
  const rad = (x, y, R, rgb, a) => { const q = b.createRadialGradient(x, y, 0, x, y, R); q.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); q.addColorStop(1, 'rgba(' + rgb + ',0)'); b.fillStyle = q; b.fillRect(x - R, y - R, R * 2, R * 2); };
  const blob = (x, y, rx, ry, c) => { b.fillStyle = c; b.beginPath(); b.ellipse(x, y, rx, ry, r() * 3, 0, 7); b.fill(); };
  for (let i = 0; i < o.patches; i++)
    rad(r() * w, r() * h, 40 + r() * 70, i % 2 ? o.lt : '0,0,0', i % 2 ? .07 : .13); // lantai aus / bernoda besar
  if (o.frame) { // bayangan tepi + bingkai batu berukir
    [
      [0, 0, 0, 44, 0, 0, w, 44], [0, h, 0, h - 44, 0, h - 44, w, 44], [0, 0, 44, 0, 0, 0, 44, h], [w, 0, w - 44, 0, w - 44, 0, 44, h]
    ].forEach(([x0, y0, x1, y1, rx, ry, rw, rh]) => { const q = b.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, 'rgba(0,0,0,.4)'); q.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = q; b.fillRect(rx, ry, rw, rh); });
    b.strokeStyle = o.trim;
    b.lineWidth = 1;
    b.strokeRect(24.5, 24.5, w - 49, h - 49);
    b.strokeRect(28.5, 28.5, w - 57, h - 57);
    [[34, 34], [w - 34, 34], [34, h - 34], [w - 34, h - 34]].forEach(([x, y]) => { b.fillStyle = o.trim; b.beginPath(); b.moveTo(x, y - 6); b.lineTo(x + 6, y); b.lineTo(x, y + 6); b.lineTo(x - 6, y); b.closePath(); b.fill(); b.fillStyle = o.glow; b.fillRect(x - 1, y - 1, 3, 3); });
  }
  b.save();
  b.translate(cx, cy);
  b.scale(1, .74);
  b.lineWidth = 1.5;
  b.strokeStyle = o.line;
  if (o.motif == 'rune') { // lingkaran rune bersinar
    rad(0, 0, 110, o.glowRgb, .16);
    for (const rr of [96, 84, 52]) {
      b.beginPath();
      b.arc(0, 0, rr, 0, 7);
      b.stroke();
    }
    b.setLineDash([4, 5]);
    b.beginPath();
    b.arc(0, 0, 68, 0, 7);
    b.stroke();
    b.setLineDash([]);
    for (let i = 0; i < 8; i++) {
      b.rotate(.7854);
      b.beginPath();
      b.moveTo(52, 0);
      b.lineTo(84, 0);
      b.stroke();
      b.fillStyle = o.glow;
      b.fillRect(88, -2, 5, 4);
    }
    b.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = i * .3927, rr = i % 2 ? 22 : 50;
      i ? b.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : b.moveTo(rr, 0);
    }
    b.closePath();
    b.stroke();
    b.fillStyle = o.glow;
    b.fillRect(-2, -2, 4, 4);
  } else if (o.motif == 'mosaic') { // mozaik berlian bertingkat
    for (const [s, c] of [[124, o.m1], [96, o.m2], [68, o.m1], [40, o.m2]]) {
      b.fillStyle = c;
      b.beginPath();
      b.moveTo(0, -s * .75);
      b.lineTo(s, 0);
      b.lineTo(0, s * .75);
      b.lineTo(-s, 0);
      b.closePath();
      b.fill();
      b.stroke();
    }
    rad(0, 0, 40, o.glowRgb, .18);
    b.beginPath();
    b.arc(0, 0, 12, 0, 7);
    b.stroke();
    b.fillStyle = o.glow;
    b.fillRect(-2, -2, 4, 4);
  }
  b.restore();
  for (let i = 0; i < (o.blood || 0); i++) {
    const x = ri(50, w - 50), y = ri(50, h - 50);
    if (hit(x, y, 26))
      continue;
    blob(x, y, 9 + r() * 12, 4 + r() * 6, 'rgba(70,10,16,.38)');
    for (let j = 0; j < 5; j++)
      blob(x + ri(-18, 18), y + ri(-9, 9), 1 + r() * 2, 1 + r(), 'rgba(90,14,20,.5)');
  }
  if (o.web)
    [[16, 16, 1, 1], [w - 16, 16, -1, 1], [16, h - 16, 1, -1], [w - 16, h - 16, -1, -1]].forEach(([x, y, sx, sy]) => {
      b.strokeStyle = 'rgba(225,225,240,.24)'; b.lineWidth = 1; for (let k = 0; k < 6; k++) {
        const a = k * .3 + .02;
        b.beginPath();
        b.moveTo(x, y);
        b.lineTo(x + sx * Math.cos(a) * 54, y + sy * Math.sin(a) * 54);
        b.stroke();
      } for (let k = 1; k < 5; k++) {
        b.beginPath();
        for (let j = 0; j < 6; j++) {
          const a = j * .3 + .02, px = x + sx * Math.cos(a) * k * 11, py = y + sy * Math.sin(a) * k * 11;
          j ? b.lineTo(px, py) : b.moveTo(px, py);
        }
        b.stroke();
      }
    });
  if (o.camp) { // tanah padat, jejak sepatu, kerikil, rumput liar
    for (let i = 0; i < 16; i++) {
      const x = ri(40, w - 40), y = ri(30, h - 30);
      blob(x, y, 26 + r() * 40, 10 + r() * 22, 'rgba(120,92,58,.2)');
      blob(x + 3, y + 2, 16 + r() * 24, 6 + r() * 12, 'rgba(150,118,76,.16)');
    }
    for (let i = 0; i < 90; i++) {
      const x = ri(20, w - 20), y = ri(20, h - 20);
      b.fillStyle = r() < .5 ? 'rgba(0,0,0,.24)' : 'rgba(210,180,130,.22)';
      b.fillRect(x, y, ri(1, 3), r() < .3 ? 2 : 1);
    }
    for (let i = 0; i < 12; i++) {
      const x = 70 + i * 22, y = 300 - i * 6 + (i % 2) * 4;
      b.fillStyle = 'rgba(30,20,10,.3)';
      b.fillRect(x, y, 3, 5);
      b.fillRect(x + 6, y + 2, 3, 5);
    }
    for (let i = 0; i < 34; i++) {
      const x = r() < .5 ? ri(18, 74) : ri(w - 74, w - 18), y = ri(20, h - 20);
      if ((o.walls || []).some(q => x > q[0] - 6 && x < q[0] + q[2] + 6 && y > q[1] - 6 && y < q[1] + q[3] + 6))
        continue;
      for (let j = 0; j < 5; j++) {
        b.fillStyle = r() < .5 ? '#46763a' : '#2f5a2f';
        b.fillRect(x + j * 2 - 4, y - ri(2, 4), 1, ri(3, 6));
      }
    }
  }
}

function buildBG2() {
  const b = BG1.getContext('2d');
  let sd = 7;
  const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, ri = (a, z) => a + Math.floor(r() * (z - a + 1));
  b.fillStyle = '#49434a';
  b.fillRect(0, 0, DW, DH);
  for (let y = 0; y < DH; y += 32)
    for (let x = 0; x < DW; x += 32) {
      const v = r();
      b.fillStyle = v > .5 ? '#554b50' : '#49434a';
      b.fillRect(x + 1, y + 1, 30, 30);
      b.fillStyle = 'rgba(255,255,255,.06)';
      b.fillRect(x + 1, y + 1, 30, 1);
      b.fillRect(x + 1, y + 1, 1, 30);
      b.fillStyle = 'rgba(20,18,20,.3)';
      b.fillRect(x + 1, y + 30, 30, 1);
      b.fillRect(x + 30, y + 1, 1, 30);
      if (v > .9) {
        b.strokeStyle = 'rgba(20,15,15,.45)';
        b.lineWidth = 1;
        b.beginPath();
        b.moveTo(x + 8, y + 9);
        b.lineTo(x + 14, y + 17);
        b.lineTo(x + 10, y + 26);
        b.stroke();
      }
      for (let i = 0; i < 4; i++) {
        b.fillStyle = r() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.15)';
        b.fillRect(x + ri(3, 27), y + ri(3, 27), ri(1, 2), 1);
      }
    }
  floorPass(b, DW, DH, {
    seed: 9, walls: W1, patches: 14, lt: '210,190,160', frame: 1, trim: 'rgba(194,160,107,.26)', glow: 'rgba(255,220,140,.8)', glowRgb: '255,200,110', line: 'rgba(194,160,107,.38)', motif: 'mosaic', m1: 'rgba(24,20,28,.38)', m2: 'rgba(130,105,70,.2)', blood: 6, web: 1
  });
  b.fillStyle = '#29252d';
  WB().forEach(a => b.fillRect(...a));
  b.fillStyle = '#413640';
  for (let x = 14; x < DW - 14; x += 24) {
    b.fillRect(x, 3, 18, 8);
    b.fillRect(x, DH - 11, 18, 8);
  }
  for (let y = 14; y < DH - 14; y += 24) {
    b.fillRect(3, y, 8, 18);
    b.fillRect(DW - 11, y, 8, 18);
  }
  b.fillStyle = '#5a4a58';
  b.fillRect(14, 12, DW - 28, 2);
  b.fillRect(14, DH - 14, DW - 28, 2);
  b.fillRect(12, 14, 2, DH - 28);
  b.fillRect(DW - 14, 14, 2, DH - 28);
  b.save();
  b.translate(OX, OY);
  b.strokeStyle = '#c5bda5';
  b.lineWidth = 3;
  b.beginPath();
  b.moveTo(433, 314);
  b.lineTo(456, 326);
  b.moveTo(454, 313);
  b.lineTo(436, 328);
  b.stroke();
  b.restore();
  b.save();
  b.translate(OX, OY);
  decor1f(b);
  b.restore();
  decor1x(b);
  BR1.forEach(([x, y]) => bzBase(b, x, y));
  W1.slice(4).forEach(([x, y, w, h, k]) => {
    b.fillStyle = 'rgba(0,0,0,.35)';
    b.fillRect(x + 3, y + 5, w, h);
    if (k == 'p') {
      b.fillStyle = '#25262a';
      b.fillRect(x, y, w, h);
      b.fillStyle = '#77746d';
      b.fillRect(x + 3, y + 3, w - 6, h - 6);
      b.fillStyle = '#aaa396';
      b.fillRect(x - 2, y - 2, w + 4, 6);
      b.fillRect(x - 2, y + h - 4, w + 4, 6);
      b.fillStyle = 'rgba(0,0,0,.22)';
      b.fillRect(x + w - 9, y + 7, 5, h - 14);
    } else if (k == 'a') {
      b.fillStyle = '#29252a';
      b.fillRect(x, y, w, h);
      b.fillStyle = '#5d5353';
      b.fillRect(x + 4, y + 4, w - 8, h - 8);
      b.fillStyle = '#81716a';
      b.fillRect(x + 9, y + 9, w - 18, h - 18);
      b.fillStyle = '#b18a54';
      b.fillRect(x + w / 2 - 5, y + h / 2 - 5, 10, 10);
      b.strokeStyle = '#d4ad70';
      b.lineWidth = 1;
      b.strokeRect(x + 14.5, y + 13.5, w - 29, h - 27);
    } else if (k == 'c') {
      b.fillStyle = '#38291f';
      b.fillRect(x, y, w, h);
      b.fillStyle = '#8a6038';
      b.fillRect(x + 2, y + 2, w - 4, h - 4);
      b.strokeStyle = '#3d2c20';
      b.lineWidth = 2;
      b.strokeRect(x + 4, y + 4, w - 8, h - 8);
      b.beginPath();
      b.moveTo(x + 4, y + 4);
      b.lineTo(x + w - 4, y + h - 4);
      b.moveTo(x + w - 4, y + 4);
      b.lineTo(x + 4, y + h - 4);
      b.stroke();
    } else {
      b.fillStyle = '#49301f';
      b.fillRect(x, y, w, h);
      b.fillStyle = '#9b7043';
      b.fillRect(x + 2, y + 2, w - 4, h - 4);
      b.fillStyle = '#302a28';
      b.fillRect(x, y + 5, w, 2);
      b.fillRect(x, y + h - 7, w, 2);
    }
  });
  TO1.forEach(([x, y]) => { b.fillStyle = '#30251f'; b.fillRect(x - 2, y - 1, 4, 7); b.fillStyle = '#bd6b32'; b.fillRect(x - 3, y - 3, 6, 3); });
  decor1w(b);
}

// ===== Asap, ledakan hit, efek senjata, dekorasi =====
function smoke(q, k) { const c = q.c || '80,76,92'; g.save(); g.globalAlpha = 1; const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.s); gr.addColorStop(0, 'rgba(' + c + ',' + k * .4 + ')'); gr.addColorStop(1, 'rgba(' + c + ',0)'); g.fillStyle = gr; g.beginPath(); g.arc(q.x, q.y, q.s, 0, 7); g.fill(); g.restore(); }

function puff(x, y, n, c, sz = 1) {
  for (let i = 0; i < n; i++)
    dp.push({
      k: 's', x: x + (R() - .5) * 8, y: y + (R() - .5) * 6, vx: (R() - .5) * 22, vy: -8 - R() * 22, life: .7 + R() * .8, max: 1.5, s: (4 + R() * 4) * sz, c
    });
}
const PC = [
  ['255,255,255', '140,190,255', '60,100,220'], ['255,235,235', '255,80,80', '170,20,30'], ['240,255,230', '150,230,110', '50,140,50'], ['255,245,255', '220,130,255', '110,40,190'], ['255,230,220', '255,90,90', '150,20,30']
];
const PL = [
  ['#cfe6ff', '#8fbfff'], ['#ffb0b0', '#ff4a4a'], ['#b6f08a', '#6fd05c'], ['#e6b8ff', '#b48cff'], ['#ff9a8a', '#ff4a4a']
];

/* ===== BATTLE FOCUS: aura megah, warna & efek area berbeda tiap senjata ===== */
const FPAL = [
  {
    pc: ['255,255,255', '215,230,255', '150,175,230'], in: '255,255,255', h: ['#ffffff', '#cfe0ff'], mid: '210,225,255', vg: '200,220,255'
  }, // Sword: putih (cahaya suci)
  {
    pc: ['255,225,200', '255,60,50', '160,10,10'], in: '255,200,170', h: ['#ff6a5a', '#ffb0a0'], mid: '255,60,50', vg: '255,40,40'
  }, // Spear: merah
  {
    pc: ['235,255,205', '90,230,90', '20,120,40'], in: '220,255,180', h: ['#7dff7d', '#d4ffb0'], mid: '90,230,90', vg: '60,220,80'
  }, // Bow: hijau (angin & daun)
  {
    pc: ['248,230,255', '190,100,255', '90,30,170'], in: '240,215,255', h: ['#c58bff', '#f0d8ff'], mid: '190,100,255', vg: '170,80,255'
  }, // Staff: ungu (arcane)
  {
    pc: ['255,130,130', '160,10,30', '60,0,12'], in: '230,40,60', h: ['#c01030', '#ff6070'], mid: '160,10,30', vg: '150,0,25', dark: 1
  }
]; // Daggers: merah gelap (bayangan)

function cflame(q, k) {
  const a = 1 - k, r = q.s * (1.3 - a * .7), pc = q.pc, c1 = a < .25 ? pc[0] : a < .55 ? pc[1] : pc[2];
  g.save();
  g.globalCompositeOperation = q.dark ? 'source-over' : 'lighter';
  const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 2);
  gr.addColorStop(0, 'rgba(' + c1 + ',' + k * .9 + ')');
  gr.addColorStop(.5, 'rgba(' + pc[1] + ',' + k * .45 + ')');
  gr.addColorStop(1, 'rgba(' + pc[2] + ',0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(q.x, q.y, r * 2, 0, 7);
  g.fill();
  g.restore();
}

function focusAura(front) {
  const PL = FPAL[wi], pc = PL.pc, rg = (c, al) => 'rgba(' + c + ',' + al + ')', IN = FOCUS_CFG.dur - p.focus, fk = Math.max(0, Math.min(1, p.focus / .5, .3 + IN * 2.5)), fl = .9 + .1 * Math.sin(t * 17), cx = p.x, cy = p.y + 2, fy = p.y + 9, dk = PL.dark ? .75 : 1;
  const tongue = (bx, by, h, w, ph, col) => { const sw = Math.sin(ph * 1.3) * 2; g.fillStyle = col; g.beginPath(); g.moveTo(bx - w, by); g.quadraticCurveTo(bx - w * .4 + sw, by - h * .55, bx + Math.sin(ph) * 2.5, by - h); g.quadraticCurveTo(bx + w * .4 + sw, by - h * .55, bx + w, by); g.closePath(); g.fill(); };
  g.save();
  g.globalCompositeOperation = PL.dark ? 'source-over' : 'lighter';
  if (!front) {
    if (IN < .9) { // pilar cahaya/api saat aktivasi
      const u = IN / .9, al = 1 - u, w = 10 + 16 * u, hh = 120 * Math.min(1, IN * 5), gp = g.createLinearGradient(0, fy, 0, fy - hh);
      gp.addColorStop(0, rg(pc[0], .8 * al));
      gp.addColorStop(.5, rg(pc[1], .5 * al));
      gp.addColorStop(1, rg(pc[2], 0));
      g.fillStyle = gp;
      g.fillRect(cx - w, fy - hh, w * 2, hh);
    }
    if (PL.dark) {
      g.fillStyle = rg('12,0,4', .4 * fk);
      g.beginPath();
      g.ellipse(cx, fy, 36 * fl, 13 * fl, 0, 0, 7);
      g.fill();
    } // kolam bayangan
    const gr = g.createRadialGradient(cx, cy, 3, cx, cy, 40 * fl);
    gr.addColorStop(0, rg(pc[0], .5 * fk * dk));
    gr.addColorStop(.45, rg(pc[1], .34 * fk));
    gr.addColorStop(1, rg(pc[2], 0));
    g.fillStyle = gr;
    g.beginPath();
    g.arc(cx, cy, 40 * fl, 0, 7);
    g.fill();
    if (wi == 0) { // sinar cahaya berputar (pedang)
      for (let i = 0; i < 8; i++) {
        g.save();
        g.translate(cx, fy - 4);
        g.scale(1, .5);
        g.rotate(t * .5 + i * .7854);
        const lg = g.createLinearGradient(0, 0, 50, 0);
        lg.addColorStop(0, rg(pc[0], .4 * fk));
        lg.addColorStop(1, rg(pc[0], 0));
        g.fillStyle = lg;
        g.beginPath();
        g.moveTo(0, -2.5);
        g.lineTo(50, -.4);
        g.lineTo(50, .4);
        g.lineTo(0, 2.5);
        g.closePath();
        g.fill();
        g.restore();
      }
    }
    g.save();
    g.translate(cx, fy);
    g.scale(1, .42); // lingkaran sigil di lantai (busur terang = sisa durasi buff)
    g.lineWidth = 2.2;
    g.strokeStyle = rg(pc[1], .9 * fk);
    g.beginPath();
    g.arc(0, 0, 31 * fl, 0, 7);
    g.stroke();
    g.lineWidth = 4;
    g.strokeStyle = rg(PL.in, .9 * fk);
    g.beginPath();
    g.arc(0, 0, 36, -1.5708, -1.5708 + 6.2832 * Math.max(0, p.focus / FOCUS_CFG.dur));
    g.stroke();
    g.lineWidth = 1.3;
    g.strokeStyle = rg(pc[0], .65 * fk);
    g.beginPath();
    g.arc(0, 0, 24, 0, 7);
    g.stroke();
    g.rotate(t * 1.1);
    g.strokeStyle = rg(PL.in, .8 * fk);
    g.fillStyle = rg(PL.in, .8 * fk);
    if (wi == 0) {
      for (let i = 0; i < 2; i++) {
        g.beginPath();
        g.moveTo(-24, 0);
        g.lineTo(24, 0);
        g.stroke();
        g.rotate(1.5708);
      }
      g.rotate(.7854);
      for (let i = 0; i < 2; i++) {
        g.beginPath();
        g.moveTo(-15, 0);
        g.lineTo(15, 0);
        g.stroke();
        g.rotate(1.5708);
      }
    } // salib cahaya
    else if (wi == 1) {
      g.fillStyle = rg(pc[1], .8 * fk);
      for (let i = 0; i < 8; i++) {
        g.rotate(.7854);
        g.beginPath();
        g.moveTo(24, -3.5);
        g.lineTo(36, 0);
        g.lineTo(24, 3.5);
        g.closePath();
        g.fill();
      }
    } // 8 mata tombak
    else if (wi == 2) {
      for (let i = 0; i < 3; i++) {
        g.rotate(2.0944);
        g.beginPath();
        g.arc(0, 0, 20, 0, 1.7);
        g.stroke();
        g.beginPath();
        g.arc(0, 0, 14, .3, 1.4);
        g.stroke();
      }
    } // pusaran angin
    else if (wi == 3) {
      for (let k2 = 0; k2 < 2; k2++) {
        g.rotate(k2 ? 1.0472 : 0);
        g.beginPath();
        for (let i = 0; i < 3; i++) {
          const an = i * 2.0944 - 1.5708;
          g.lineTo(Math.cos(an) * 24, Math.sin(an) * 24);
        }
        g.closePath();
        g.stroke();
      }
    } // heksagram arcane
    else {
      g.rotate(.7854);
      for (let i = 0; i < 2; i++) {
        g.beginPath();
        g.moveTo(-27, 0);
        g.lineTo(27, 0);
        g.stroke();
        g.rotate(1.5708);
      }
      g.rotate(-.7854);
      g.beginPath();
      for (let i = 0; i < 3; i++) {
        const an = i * 2.0944 + 1.5708;
        g.lineTo(Math.cos(an) * 20, Math.sin(an) * 20);
      }
      g.closePath();
      g.stroke();
    } // X silang + segitiga terbalik
    if (wi != 1)
      for (let i = 0; i < 8; i++) {
        g.rotate(.7854);
        g.fillRect(27, -1.5, 6, 3);
      }
    g.restore();
  }
  for (let i = 0; i < 12; i++) { // lingkar lidah api / cahaya
    const a = i / 12 * 6.2832 + t * .6, sn = Math.sin(a);
    if (front ? sn <= 0 : sn > 0)
      continue;
    const bx = cx + Math.cos(a) * 13, by = fy + sn * 4, ph = t * 9 + i * 1.7, h = 17 + 8 * Math.sin(ph) + (i % 3) * 5, ff = fk * (front ? .6 : 1);
    tongue(bx, by, h, 3.8, ph, rg(pc[1], .55 * ff));
    tongue(bx, by, h * .55, 2.1, ph, rg(PL.in, .6 * ff));
  }

  // ===== efek area khas tiap senjata =====
  if (wi == 1) { // TOMBAK: duri/lembing merah muncul dari tanah di sekitar
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * 6.2832 + t * .25, sn = Math.sin(a);
      if (front ? sn <= 0 : sn > 0)
        continue;
      const bx = cx + Math.cos(a) * 40, by = fy + sn * 14, h = 6 + 14 * Math.max(0, Math.sin(t * 4 + i * 2.1)), ff = fk * (front ? .7 : 1);
      g.fillStyle = rg(pc[1], .8 * ff);
      g.beginPath();
      g.moveTo(bx - 3, by);
      g.lineTo(bx, by - h);
      g.lineTo(bx + 3, by);
      g.closePath();
      g.fill();
      g.fillStyle = rg(pc[0], .7 * ff);
      g.beginPath();
      g.moveTo(bx - 1, by);
      g.lineTo(bx, by - h * .8);
      g.lineTo(bx + 1, by);
      g.closePath();
      g.fill();
    }
  } else if (wi == 2) { // BUSUR: pusaran daun & angin naik
    for (let i = 0; i < 12; i++) {
      const u = (t * .4 + i / 12) % 1, a = t * 2.2 + i * .63, sn = Math.sin(a);
      if (front ? sn <= 0 : sn > 0)
        continue;
      const rr = 14 + 24 * u, x = cx + Math.cos(a) * rr, y = fy - u * 36 + sn * rr * .3, al = Math.sin(u * 3.1416) * fk;
      g.save();
      g.translate(x, y);
      g.rotate(a + 1.57 + Math.sin(t * 6 + i));
      g.fillStyle = rg(i % 2 ? pc[1] : pc[0], .9 * al);
      g.beginPath();
      g.ellipse(0, 0, 3.2, 1.4, 0, 0, 7);
      g.fill();
      g.restore();
    }
  } else if (wi == 3) { // TONGKAT: glyph arcane melayang + kilau bintang
    for (let i = 0; i < 3; i++) {
      const a = -t * 1.3 + i * 2.0944, sn = Math.sin(a);
      if (front ? sn <= 0 : sn > 0)
        continue;
      const x = cx + Math.cos(a) * 31, y = fy - 16 + sn * 8 + Math.sin(t * 2 + i) * 3;
      g.save();
      g.translate(x, y);
      g.scale(1, .75);
      g.rotate(t * 2 + i);
      g.lineWidth = 1.2;
      g.strokeStyle = rg(PL.in, .85 * fk);
      g.beginPath();
      g.arc(0, 0, 5.5, 0, 7);
      g.stroke();
      g.beginPath();
      for (let j = 0; j < 3; j++) {
        const an = j * 2.0944 - 1.5708;
        g.lineTo(Math.cos(an) * 4.5, Math.sin(an) * 4.5);
      }
      g.closePath();
      g.stroke();
      g.restore();
    }
    if (!front)
      for (let i = 0; i < 7; i++) {
        const u = (t * .9 + i * .37) % 1, x = cx + Math.cos(i * 2.4) * (18 + (i * 7) % 20), y = fy - 6 - u * 34, z = 3.4 * Math.sin(u * 3.1416);
        g.fillStyle = rg(pc[0], .9 * fk * Math.sin(u * 3.1416));
        g.beginPath();
        g.moveTo(x, y - z);
        g.lineTo(x + z * .3, y);
        g.lineTo(x, y + z);
        g.lineTo(x - z * .3, y);
        g.closePath();
        g.fill();
        g.beginPath();
        g.moveTo(x - z, y);
        g.lineTo(x, y + z * .3);
        g.lineTo(x + z, y);
        g.lineTo(x, y - z * .3);
        g.closePath();
        g.fill();
      }
  } else if (wi == 4 && front) { // BELATI: goresan tebasan merah gelap menyilang acak
    for (let i = 0; i < 3; i++) {
      const cyc = t * 1.4 + i * .33, n = Math.floor(cyc), ph = cyc - n;
      if (ph > .35)
        continue;
      const hs = Math.sin(n * 12.9898 + i * 78.233) * 43758.5453, a = (hs - Math.floor(hs)) * 3.1416, al = (1 - ph / .35) * fk, ex = Math.cos(a) * 30, ey = Math.sin(a) * 21 * (.7 + ph);
      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round';
      g.strokeStyle = rg('255,50,70', .9 * al);
      g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(cx - ex, cy - ey);
      g.lineTo(cx + ex, cy + ey);
      g.stroke();
      g.strokeStyle = rg('255,200,200', .8 * al);
      g.lineWidth = .9;
      g.stroke();
      g.globalCompositeOperation = 'source-over';
    }
  }

  // ===== 4 benda mengorbit sesuai senjata: pedang, tombak, panah, kristal, belati =====
  for (let i = 0; i < 4; i++) {
    const a = t * (wi == 4 ? 4.2 : 3.2) + i * 1.5708, sn = Math.sin(a);
    if (front ? sn <= 0 : sn > 0)
      continue;
    const x = cx + Math.cos(a) * 21, y = cy - 4 + Math.sin(t * 2 + i) * 3 + sn * 7, al = fk, go = g.createRadialGradient(x, y, 0, x, y, 11);
    go.addColorStop(0, rg(pc[0], .55 * al));
    go.addColorStop(.5, rg(pc[1], .3 * al));
    go.addColorStop(1, rg(pc[2], 0));
    g.fillStyle = go;
    g.beginPath();
    g.arc(x, y, 11, 0, 7);
    g.fill();
    g.save();
    g.globalCompositeOperation = 'source-over';
    g.translate(x, y);
    g.rotate(a + 1.5708 + (wi == 4 ? t * 9 : 0));
    g.fillStyle = rg(pc[0], .95 * al);
    g.strokeStyle = rg(wi == 4 ? '255,60,80' : pc[1], .95 * al);
    g.lineWidth = 1.1;
    g.lineJoin = 'round';
    g.beginPath();
    if (wi == 0) {
      g.moveTo(0, -8);
      g.lineTo(2, -1);
      g.lineTo(0, 3);
      g.lineTo(-2, -1);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillRect(-3.5, 2.5, 7, 1.4);
    } else if (wi == 1) {
      g.moveTo(0, -10);
      g.lineTo(2.6, -4.5);
      g.lineTo(-2.6, -4.5);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillRect(-.5, -4.5, 1, 11);
    } else if (wi == 2) {
      g.moveTo(0, -9);
      g.lineTo(2, -5);
      g.lineTo(-2, -5);
      g.closePath();
      g.fill();
      g.fillRect(-.45, -5, .9, 12);
      g.fillStyle = rg(pc[1], .9 * al);
      g.fillRect(-2, 5, 1.2, 3);
      g.fillRect(.8, 5, 1.2, 3);
    } else if (wi == 3) {
      g.moveTo(0, -7);
      g.lineTo(3.5, 0);
      g.lineTo(0, 7);
      g.lineTo(-3.5, 0);
      g.closePath();
      g.fill();
      g.stroke();
    } else {
      g.moveTo(0, -7);
      g.lineTo(1.9, 0);
      g.lineTo(0, 2);
      g.lineTo(-1.9, 0);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = rg('90,5,20', .95 * al);
      g.fillRect(-2.4, 2, 4.8, 1.2);
    }
    g.restore();
  }
  g.restore();
}

function focusTick(dt) {
  const PL = FPAL[wi], pc = PL.pc, sp = (x, y, vx, vy, life, c) => dp.push({ k: 'p', x, y, vx, vy, life, max: life, s: 1, c }), cf = (x, y, vx, vy, life, s, up, ov) => dp.push({ k: 'cf', x, y, vx, vy, life, max: life, s, up, pc: ov || pc, dark: ov ? 1 : PL.dark }), hx = () => PL.h[R() < .5 ? 0 : 1];
  if (p.fprev > 0 && p.focus <= 0 && p.dead <= 0) {
    for (let i = 0; i < 24; i++) {
      const q = R() * 6.283, v = 30 + R() * 90;
      sp(p.x, p.y, Math.cos(q) * v, Math.sin(q) * v - 20, .4 + R() * .4, hx());
    }
    puff(p.x, p.y + 4, 4, wi == 0 ? '200,205,225' : '90,70,70', 1);
  }
  p.fprev = p.focus;
  if (p.focus <= 0 || p.dead > 0)
    return;
  if (Math.hypot(p.vx, p.vy) > 40 && R() < dt * 70)
    cf(p.x + (R() - .5) * 6, p.y + 7 + R() * 3, -p.vx * .15, -4, .3 + R() * .2, 5 + R() * 5);
  if (R() < dt * 90)
    cf(p.x + (R() - .5) * 12, p.y + 4 + R() * 6, (R() - .5) * 18, -8 - R() * 20, .35 + R() * .3, 3 + R() * 4);
  if (R() < dt * 60)
    sp(p.x + (R() - .5) * 16, p.y + R() * 8, (R() - .5) * 30, -40 - R() * 70, .5 + R() * .4, hx());
  p.fpt = (p.fpt == null ? 0 : p.fpt) - dt;
  if (p.fpt <= 0) {
    p.fpt = 1.1;
    fx.push({ k: 'ring', x: p.x, y: p.y + 6, r: 32, w: 3, life: .7, max: .7, col: PL.h[0] }, { k: 'ring', x: p.x, y: p.y + 6, r: 18, w: 1.5, life: .5, max: .5, col: PL.h[1] });
  } // gelombang denyut di area
  if (wi == 0) {
    if (R() < dt * 45)
      sp(p.x + (R() - .5) * 80, p.y + 10 + R() * 4, (R() - .5) * 6, -25 - R() * 25, .8 + R() * .6, '#ffffff');
    if (R() < dt * 6)
      cf(p.x + (R() - .5) * 60, p.y + 6, 0, -30, .7, 6, 20);
  } // butiran cahaya naik
  else if (wi == 1) {
    if (R() < dt * 9) {
      const a = R() * 6.283, x = p.x + Math.cos(a) * (28 + R() * 16), y = p.y + 9 + Math.sin(a) * 10;
      for (let j = 0; j < 5; j++)
        sp(x + (R() - .5) * 4, y, (R() - .5) * 20, -70 - R() * 60, .4 + R() * .3, hx());
      cf(x, y, 0, -20, .4, 6, 30);
    }
  } // semburan duri merah
  else if (wi == 2) {
    if (R() < dt * 28) {
      const a = R() * 6.283, x = p.x + Math.cos(a) * 26, y = p.y + 8 + Math.sin(a) * 9;
      sp(x, y, -Math.sin(a) * 45, -12 - R() * 22, .6 + R() * .4, hx());
    }
  } // percik angin melingkar
  else if (wi == 3) {
    if (R() < dt * 25)
      sp(p.x + (R() - .5) * 64, p.y - 26 - R() * 10, (R() - .5) * 8, 20 + R() * 20, .8, hx());
    if (R() < dt * 10)
      cf(p.x + (R() - .5) * 40, p.y + 8, (R() - .5) * 10, -25, .6, 5, 30);
  } // debu bintang jatuh
  else {
    if (R() < dt * 50)
      cf(p.x + (R() - .5) * 22, p.y + 8, (R() - .5) * 25, -10, .6 + R() * .4, 6 + R() * 5, 25, ['45,0,10', '28,0,7', '12,0,3']);
    if (R() < dt * 14)
      sp(p.x + (R() - .5) * 30, p.y - 6, (R() - .5) * 20, 25 + R() * 30, .5 + R() * .3, '#ff3045');
  } // asap bayangan + tetes merah
}

function bang(x, y, r, w) {
  const pc = PC[w];
  fx.push({ k: 'pf', x, y, r, life: .32, max: .32, pc });
  puff(x, y, 2, '70,66,80', .8);
  shake = Math.max(shake, 2.5);
  for (let i = 0; i < 8; i++) {
    const q = R() * 6.283, v = 50 + R() * 90;
    dp.push({
      k: 'p', x, y, vx: Math.cos(q) * v, vy: Math.sin(q) * v, life: .3 + R() * .3, max: .6, s: 1.5 + R() * 1.5, c: 'rgb(' + pc[1] + ')'
    });
  }
  if (p && p.focus > 0) {
    const PL = FPAL[wi];
    fx.push({ k: 'ring', x, y, r: r * .6, w: 2, life: .22, max: .22, col: PL.h[0] });
    for (let i = 0; i < 5; i++)
      dp.push({
        k: 'cf', x, y, vx: (R() - .5) * 100, vy: (R() - .5) * 100 - 20, life: .35 + R() * .25, max: .6, s: 5 + R() * 5, pc: PL.pc, dark: PL.dark
      });
  }
}

function impact2(e, a, crit) {
  const x = e.x, y = e.y - 3;
  if (wi == 1)
    for (let i = 0; i < 5; i++)
      dp.push({ k: 'l', x, y, a: a + (R() - .5) * .5 + Math.PI, len: 18 + R() * 16, life: .18, max: .18 });
  if (wi == 2)
    for (let i = 0; i < 6; i++)
      dp.push({
        k: 'p', x: x + (R() - .5) * 8, y, vx: (R() - .5) * 50, vy: -20 - R() * 40, life: .5 + R() * .3, max: .8, s: 2, c: i % 2 ? '#b6f08a' : '#6fd05c'
      });
  if (wi == 4) {
    fx.push({ k: 'xm', x, y, a: a + .5, life: .25, max: .25 });
    puff(x, y + 3, 1, '60,20,30', .6);
  }
  if (wi == 0)
    fx.push({ k: 'ring', x, y, r: 15, life: .2, max: .2, col: '#8fbfff' });
  if (wi != 3)
    bang(x, y, crit ? 34 : p.hn == 2 ? 26 : 20, wi);
}

function xmFx(f, k) { g.save(); g.translate(f.x, f.y); g.rotate(f.a); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,90,90,' + k + ')'; g.lineWidth = 2; const s = 6 + (1 - k) * 6; g.beginPath(); g.moveTo(-s, -s); g.lineTo(s, s); g.moveTo(s, -s); g.lineTo(-s, s); g.stroke(); g.restore(); }

function runeFx(f, k) {
  g.save(); g.translate(f.x, f.y); g.scale(f.sc || 1, .55 * (f.sc || 1)); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k; g.rotate((1 - k) * 3); g.strokeStyle = 'rgba(200,140,255,.9)'; g.lineWidth = f.w || 1; g.beginPath(); g.arc(0, 0, 16, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 11, 0, 7); g.stroke(); g.fillStyle = '#e6d0ff'; for (let i = 0; i < 6; i++) {
    g.rotate(1.0472);
    g.fillRect(14, -1, 4, 2);
  } g.beginPath(); g.moveTo(0, -11); g.lineTo(9.5, 5.5); g.lineTo(-9.5, 5.5); g.closePath(); g.stroke(); g.restore();
}

function brazier(x, y, i) {
  const f = 1 + Math.sin(t * 12 + i * 2) * .1, rd = 60 * f;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const q = g.createRadialGradient(x, y - 6, 0, x, y - 6, rd);
  q.addColorStop(0, 'rgba(255,140,50,.35)');
  q.addColorStop(1, 'rgba(255,140,50,0)');
  g.fillStyle = q;
  g.fillRect(x - rd, y - 6 - rd, rd * 2, rd * 2);
  g.restore();
  const h = 4 + Math.sin(t * 14 + i) * 1.5 + Math.sin(t * 23 + i * 3);
  g.fillStyle = '#e8561f';
  g.beginPath();
  g.moveTo(x - 5, y - 4);
  g.quadraticCurveTo(x - 6, y - 10 - h, x, y - 15 - h);
  g.quadraticCurveTo(x + 6, y - 10 - h, x + 5, y - 4);
  g.fill();
  g.fillStyle = '#ffb13b';
  g.beginPath();
  g.moveTo(x - 3, y - 4);
  g.quadraticCurveTo(x - 3, y - 9 - h * .6, x, y - 12 - h * .6);
  g.quadraticCurveTo(x + 3, y - 9 - h * .6, x + 3, y - 4);
  g.fill();
  g.fillStyle = '#ffe9a0';
  g.fillRect(x - 1, y - 9, 2, 4);
}
const rug = (b, x, y, w, h, c1, c2) => {
  b.fillStyle = 'rgba(0,0,0,.3)'; b.fillRect(x + 2, y + 3, w, h); b.fillStyle = c1; b.fillRect(x, y, w, h); b.strokeStyle = c2; b.lineWidth = 2; b.strokeRect(x + 3, y + 3, w - 6, h - 6); b.lineWidth = 1; b.strokeRect(x + 8, y + 8, w - 16, h - 16); b.fillStyle = c2; for (let i = 14; i < w - 14; i += 12)
    b.fillRect(x + i, y + h / 2 - 1, 5, 2); b.beginPath(); b.moveTo(x + w / 2, y + 11); b.lineTo(x + w / 2 + 10, y + h / 2); b.lineTo(x + w / 2, y + h - 11); b.lineTo(x + w / 2 - 10, y + h / 2); b.closePath(); b.stroke(); b.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 30; i++)
    b.fillRect(x + Math.random() * w, y + Math.random() * h, 2, 1);
};
const blood = (b, x, y, rx, ry) => {
  b.fillStyle = 'rgba(90,15,25,.4)'; b.beginPath(); b.ellipse(x, y, rx, ry, .4, 0, 7); b.fill(); b.fillStyle = 'rgba(120,20,30,.35)'; for (let i = 0; i < 6; i++)
    b.fillRect(x + (Math.random() - .5) * rx * 3, y + (Math.random() - .5) * ry * 3, 2, 2);
};
const rubble = (b, x, y) => {
  for (let i = 0; i < 6; i++) {
    b.fillStyle = i % 2 ? '#4a4552' : '#3a3640';
    b.fillRect(x + (i * 5) % 14 - 4, y + (i * 3) % 8 - 3, 3 + i % 3, 2 + i % 2);
  }
};
const skulls = (b, x, y) => { [[0, 0], [7, 2], [3, -5]].forEach(([dx, dy]) => { b.fillStyle = '#d8d2c4'; b.fillRect(x + dx - 3, y + dy - 3, 7, 6); b.fillRect(x + dx - 2, y + dy + 3, 5, 2); b.fillStyle = '#14121f'; b.fillRect(x + dx - 2, y + dy - 1, 2, 2); b.fillRect(x + dx + 1, y + dy - 1, 2, 2); }); b.fillStyle = '#cbc5b6'; b.fillRect(x - 8, y + 5, 14, 2); };
const candles = (b, x, y) => { b.fillStyle = 'rgba(255,190,90,.12)'; b.beginPath(); b.arc(x, y - 2, 11, 0, 7); b.fill();[[0, 0], [6, 2], [-5, 3]].forEach(([dx, dy]) => { b.fillStyle = '#d9d0b8'; b.fillRect(x + dx - 1, y + dy - 4, 3, 6); b.fillStyle = '#ffd27a'; b.fillRect(x + dx, y + dy - 6, 1, 2); }); };
const banner = (b, x, y, c, c2) => { b.fillStyle = '#3a3025'; b.fillRect(x - 10, y, 20, 2); b.fillStyle = c; b.beginPath(); b.moveTo(x - 8, y + 2); b.lineTo(x + 8, y + 2); b.lineTo(x + 8, y + 34); b.lineTo(x, y + 28); b.lineTo(x - 8, y + 34); b.closePath(); b.fill(); b.fillStyle = c2; b.fillRect(x - 1, y + 8, 2, 12); b.fillRect(x - 4, y + 12, 8, 2); };
const rack = (b, x, y) => { b.fillStyle = '#4a3424'; b.fillRect(x - 18, y, 36, 4); b.fillRect(x - 18, y + 14, 36, 3); b.fillRect(x - 18, y, 3, 18); b.fillRect(x + 15, y, 3, 18);[[-10, '#aeb9c5'], [-3, '#9ba8b5'], [4, '#c6cbd0'], [11, '#aeb9c5']].forEach(([dx, c]) => { b.fillStyle = c; b.fillRect(x + dx - 1, y + 2, 2, 14); b.fillStyle = '#8e6844'; b.fillRect(x + dx - 2, y + 11, 4, 2); }); };
const chain = (b, x, y, n) => {
  b.fillStyle = '#6a6672'; for (let i = 0; i < n; i += 4)
    b.fillRect(x, y + i, 2, 3); b.fillStyle = '#8a8692'; b.fillRect(x - 2, y + n, 6, 2);
};
const table = (b, x, y, w) => { b.fillStyle = 'rgba(0,0,0,.3)'; b.fillRect(x + 2, y + 3, w, 12); b.fillStyle = '#4a3424'; b.fillRect(x, y, w, 10); b.fillStyle = '#6b4a32'; b.fillRect(x, y, w, 3); b.fillStyle = '#2a1c12'; b.fillRect(x + 2, y + 10, 3, 5); b.fillRect(x + w - 5, y + 10, 3, 5); };
const bzBase = (b, x, y) => { b.fillStyle = 'rgba(0,0,0,.4)'; b.beginPath(); b.ellipse(x, y + 4, 10, 4, 0, 0, 7); b.fill(); b.fillStyle = '#2b2830'; b.fillRect(x - 3, y - 2, 6, 8); b.fillStyle = '#6b6670'; b.fillRect(x - 8, y - 5, 16, 4); b.fillStyle = '#3b373f'; b.fillRect(x - 8, y - 2, 16, 1); b.fillStyle = '#1c1a1f'; b.fillRect(x - 6, y - 4, 12, 2); };

function decor0f(b) { rug(b, 220, 172, 200, 56, '#4b2a38', '#9c7a52'); blood(b, 200, 250, 10, 5); blood(b, 440, 130, 8, 4); blood(b, 360, 310, 12, 5); rubble(b, 110, 300); rubble(b, 560, 250); rubble(b, 300, 60); skulls(b, 596, 270); skulls(b, 44, 322); skulls(b, 300, 352); candles(b, 250, 342); table(b, 450, 340, 40); candles(b, 462, 338); }

function decor0w(b) { [120, 260, 400, 540, 680].forEach(x => banner(b, x, 14, '#5a2230', '#c2a06b'));[190, 330, 470, 610].forEach(x => rack(b, x, 16)); chain(b, 60, 14, 26); chain(b, 740, 14, 22); rack(b, 200, DH - 32); rack(b, 600, DH - 32); }

function decor0x(b) { rug(b, 664, 212, 100, 56, '#4b2a38', '#9c7a52'); blood(b, 700, 150, 10, 5); blood(b, 130, 430, 9, 4); blood(b, 420, 440, 11, 5); rubble(b, 660, 60); rubble(b, 150, 440); rubble(b, 740, 400); skulls(b, 744, 100); skulls(b, 90, 436); candles(b, 640, 428); table(b, 540, 430, 40); candles(b, 552, 428); }

function decor1f(b) {
  rug(b, 262, 148, 116, 104, '#5a2634', '#c2a06b');
  blood(b, 210, 200, 10, 5);
  blood(b, 430, 240, 9, 4);
  blood(b, 330, 120, 8, 4);
  rubble(b, 70, 200);
  rubble(b, 580, 300);
  rubble(b, 200, 360);
  skulls(b, 60, 330);
  skulls(b, 586, 96);
  skulls(b, 330, 356);
  candles(b, 276, 160);
  candles(b, 364, 160);
  candles(b, 276, 240);
  candles(b, 364, 240);
  table(b, 560, 200, 36);
  candles(b, 572, 198);
  b.fillStyle = '#49301f';
  b.fillRect(574, 316, 14, 16);
  b.fillStyle = '#9b7043';
  b.fillRect(576, 318, 10, 12);
  b.fillStyle = '#302a28';
  b.fillRect(574, 321, 14, 2);
  b.fillRect(574, 327, 14, 2);
  b.fillStyle = '#38291f';
  b.fillRect(554, 322, 14, 14);
  b.fillStyle = '#8a6038';
  b.fillRect(556, 324, 10, 10);
}

function decor1w(b) { [200, 300, 400, 500, 600, 700].forEach(x => banner(b, x, 14, '#3a2a5a', '#b48cff')); chain(b, 100, 14, 34); chain(b, 250, 14, 28); chain(b, 550, 14, 30); chain(b, 750, 14, 34); rack(b, 294, DH - 32); rack(b, 494, DH - 32); rack(b, 694, DH - 32); }

function decor1x(b) { rug(b, 664, 212, 100, 56, '#5a2634', '#c2a06b'); blood(b, 700, 400, 10, 5); blood(b, 120, 120, 9, 4); blood(b, 300, 430, 8, 4); rubble(b, 740, 70); rubble(b, 60, 440); rubble(b, 440, 430); skulls(b, 760, 300); skulls(b, 60, 230); candles(b, 150, 420); candles(b, 650, 430); table(b, 560, 424, 36); candles(b, 572, 422); }

function bar(x, y, w, h, v, m, c) { g.fillStyle = '#000b'; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = c; g.fillRect(x, y, Math.max(0, w * v / m), h); }

/* ===== HUD PC: bar 5 senjata (ikon) + CD ganti senjata + slot skill dengan sapuan cooldown ===== */
function wpnIcon(i, cx, cy, u, acc, al) {
  const LG = (x0, y0, x1, y1, st) => { const gr = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }, OUT = '#161826';
  g.save();
  g.translate(cx, cy);
  g.scale(u, u);
  g.globalAlpha = al;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const dagger = gem => {
    g.beginPath();
    g.moveTo(0, -11);
    g.lineTo(2.3, -3);
    g.lineTo(1.5, 3.2);
    g.lineTo(-1.5, 3.2);
    g.lineTo(-2.3, -3);
    g.closePath();
    g.fillStyle = LG(-2.3, 0, 2.3, 0, [[0, '#7d879b'], [.5, '#f3f7ff'], [1, '#aab4c6']]);
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = .8;
    g.stroke();
    g.strokeStyle = 'rgba(70,80,110,.7)';
    g.lineWidth = .6;
    g.beginPath();
    g.moveTo(0, -8.5);
    g.lineTo(0, 2.6);
    g.stroke();
    g.fillStyle = '#c9a23a';
    g.fillRect(-4.2, 3.2, 8.4, 1.8);
    g.strokeStyle = OUT;
    g.lineWidth = .6;
    g.strokeRect(-4.2, 3.2, 8.4, 1.8);
    g.fillStyle = '#4b2230';
    g.fillRect(-1.1, 5, 2.2, 4.6);
    g.strokeStyle = 'rgba(255,255,255,.28)';
    g.lineWidth = .5;
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.moveTo(-1.1, 5.8 + k * 1.4);
      g.lineTo(1.1, 6.4 + k * 1.4);
      g.stroke();
    }
    g.fillStyle = gem;
    g.beginPath();
    g.arc(0, 10.4, 1.4, 0, 7);
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = .5;
    g.stroke();
  };
  if (i == 0) { // PEDANG: bilah baja + fuller, crossguard emas, gagang kulit, permata
    g.rotate(.7854);
    g.beginPath();
    g.moveTo(0, -13);
    g.lineTo(2.6, -9);
    g.lineTo(2.6, 3);
    g.lineTo(-2.6, 3);
    g.lineTo(-2.6, -9);
    g.closePath();
    g.fillStyle = LG(-2.6, 0, 2.6, 0, [[0, '#7d879b'], [.45, '#f6f9ff'], [1, '#aab4c6']]);
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = .9;
    g.stroke();
    g.strokeStyle = 'rgba(70,80,110,.65)';
    g.lineWidth = .7;
    g.beginPath();
    g.moveTo(0, -9.5);
    g.lineTo(0, 2);
    g.stroke();
    g.fillStyle = LG(0, 3, 0, 5.6, [[0, '#ffe27a'], [1, '#b8860b']]);
    g.beginPath();
    g.moveTo(-6.5, 3.4);
    g.lineTo(6.5, 3.4);
    g.lineTo(5.6, 5.6);
    g.lineTo(-5.6, 5.6);
    g.closePath();
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = .7;
    g.stroke();
    g.fillStyle = '#6b3f22';
    g.fillRect(-1.4, 5.6, 2.8, 5);
    g.strokeStyle = 'rgba(255,220,160,.35)';
    g.lineWidth = .5;
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.moveTo(-1.4, 6.6 + k * 1.5);
      g.lineTo(1.4, 7.2 + k * 1.5);
      g.stroke();
    }
    g.fillStyle = acc;
    g.beginPath();
    g.arc(0, 11.6, 1.9, 0, 7);
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = .7;
    g.stroke();
  } else if (i == 1) { // TOMBAK: mata tombak daun, sarung emas, rumbai merah, tiang kayu
    g.rotate(.7854);
    g.fillStyle = LG(-1, 0, 1, 0, [[0, '#8a5a2b'], [.5, '#c98d4a'], [1, '#6b4423']]);
    g.fillRect(-.95, -3, 1.9, 16);
    g.strokeStyle = OUT;
    g.lineWidth = .5;
    g.strokeRect(-.95, -3, 1.9, 16);
    g.fillStyle = '#9aa3b5';
    g.fillRect(-1.4, 11.6, 2.8, 1.8);
    g.strokeStyle = '#d6303a';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, -2);
    g.quadraticCurveTo(-3.2, 0, -3.4, 4);
    g.stroke();
    g.beginPath();
    g.moveTo(0, -2);
    g.quadraticCurveTo(3.2, 0, 3.4, 4);
    g.stroke();
    g.strokeStyle = '#ff8a8a';
    g.lineWidth = .6;
    g.beginPath();
    g.moveTo(0, -2);
    g.quadraticCurveTo(-3, 0, -3.2, 3.4);
    g.stroke();
    g.beginPath();
    g.moveTo(0, -14);
    g.quadraticCurveTo(4.6, -9, 1.3, -3.8);
    g.lineTo(-1.3, -3.8);
    g.quadraticCurveTo(-4.6, -9, 0, -14);
    g.closePath();
    g.fillStyle = LG(-4, 0, 4, 0, [[0, '#8e99ad'], [.5, '#f6f9ff'], [1, '#aab4c6']]);
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = .9;
    g.stroke();
    g.strokeStyle = 'rgba(70,80,110,.65)';
    g.lineWidth = .6;
    g.beginPath();
    g.moveTo(0, -12);
    g.lineTo(0, -4.2);
    g.stroke();
    g.fillStyle = LG(0, -4, 0, -2, [[0, '#ffe27a'], [1, '#b8860b']]);
    g.fillRect(-1.9, -4, 3.8, 2);
    g.strokeStyle = OUT;
    g.lineWidth = .5;
    g.strokeRect(-1.9, -4, 3.8, 2);
  } else if (i == 2) { // BUSUR: dua lengkung kayu, tali tertarik, panah berbulu + mata baja
    g.lineWidth = 4;
    g.strokeStyle = OUT;
    g.beginPath();
    g.arc(-6, 0, 12, -1.1, 1.1);
    g.stroke();
    g.lineWidth = 2.6;
    g.strokeStyle = LG(-6, -11, 6, 11, [[0, '#a8702f'], [.5, '#e0a35a'], [1, '#7a4a1f']]);
    g.beginPath();
    g.arc(-6, 0, 12, -1.1, 1.1);
    g.stroke();
    g.lineWidth = .7;
    g.strokeStyle = 'rgba(255,230,180,.7)';
    g.beginPath();
    g.arc(-6, 0, 12.6, -.95, .95);
    g.stroke();
    g.fillStyle = '#3b2a1a';
    g.fillRect(5.2, -2.6, 2.6, 5.2);
    g.strokeStyle = OUT;
    g.lineWidth = .5;
    g.strokeRect(5.2, -2.6, 2.6, 5.2);
    g.strokeStyle = '#e8e8ee';
    g.lineWidth = .8;
    g.beginPath();
    g.moveTo(-.9, -10.7);
    g.lineTo(-4.6, 0);
    g.lineTo(-.9, 10.7);
    g.stroke();
    g.strokeStyle = '#d8b27a';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-4.6, 0);
    g.lineTo(9, 0);
    g.stroke();
    g.fillStyle = '#dfe6f2';
    g.beginPath();
    g.moveTo(12.4, 0);
    g.lineTo(8.2, -2.4);
    g.lineTo(8.6, 0);
    g.lineTo(8.2, 2.4);
    g.closePath();
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = .5;
    g.stroke();
    g.fillStyle = acc;
    g.beginPath();
    g.moveTo(-4.8, 0);
    g.lineTo(-1.8, -2.6);
    g.lineTo(-1, 0);
    g.lineTo(-1.8, 2.6);
    g.closePath();
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = .4;
    g.stroke();
  } else if (i == 3) { // TONGKAT: tiang kayu berpita emas, cakar emas, orb arcane bercahaya
    g.rotate(.7854);
    g.fillStyle = LG(-1.1, 0, 1.1, 0, [[0, '#6b4423'], [.5, '#b97a3c'], [1, '#573618']]);
    g.fillRect(-1.1, -4, 2.2, 17);
    g.strokeStyle = OUT;
    g.lineWidth = .5;
    g.strokeRect(-1.1, -4, 2.2, 17);
    g.fillStyle = '#e0b84a';
    g.fillRect(-1.7, 3, 3.4, 1.3);
    g.fillRect(-1.7, 8, 3.4, 1.3);
    g.strokeStyle = OUT;
    g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(-1, -4);
    g.quadraticCurveTo(-5.4, -6, -4.2, -11);
    g.moveTo(1, -4);
    g.quadraticCurveTo(5.4, -6, 4.2, -11);
    g.stroke();
    g.strokeStyle = '#f0c850';
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-1, -4);
    g.quadraticCurveTo(-5.4, -6, -4.2, -11);
    g.moveTo(1, -4);
    g.quadraticCurveTo(5.4, -6, 4.2, -11);
    g.stroke();
    g.save();
    g.globalCompositeOperation = 'lighter';
    const ha = g.createRadialGradient(0, -8.5, 0, 0, -8.5, 9);
    ha.addColorStop(0, acc);
    ha.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = al * .5;
    g.fillStyle = ha;
    g.beginPath();
    g.arc(0, -8.5, 9, 0, 7);
    g.fill();
    g.restore();
    const og = g.createRadialGradient(-1, -9.6, .3, 0, -8.5, 4.4);
    og.addColorStop(0, '#ffffff');
    og.addColorStop(.4, acc);
    og.addColorStop(1, '#4a2a7a');
    g.fillStyle = og;
    g.beginPath();
    g.arc(0, -8.5, 4.2, 0, 7);
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = .6;
    g.stroke();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(-1.4, -9.8, .9, 0, 7);
    g.fill();
  } else { // BELATI: dua belati menyilang, gagang berlilit, permata merah
    g.save();
    g.translate(-.6, 1.2);
    g.rotate(-.78);
    dagger('#ff4a5a');
    g.restore();
    g.save();
    g.translate(.6, 1.2);
    g.rotate(.78);
    dagger(acc);
    g.restore();
  }
  g.restore();
}

function cdSweep(x, y, w, h, frac) {
  if (frac <= 0)
    return;
  const cx = x + w / 2, cy = y + h / 2, a0 = -1.5708;
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.fillStyle = 'rgba(0,0,0,.68)';
  g.beginPath();
  g.moveTo(cx, cy);
  g.arc(cx, cy, Math.max(w, h), a0, a0 + 6.2832 * Math.min(1, frac));
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,.55)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(cx, cy);
  g.lineTo(cx + Math.cos(a0 + 6.2832 * Math.min(1, frac)) * Math.max(w, h), cy + Math.sin(a0 + 6.2832 * Math.min(1, frac)) * Math.max(w, h));
  g.stroke();
  g.restore();
}
const HK = { e: [0, 0, 0, 0, 0], prev: -1, pop: 0, last: performance.now() };

function hudKeys() {
  g.save();
  // --- bar 5 senjata: terlihat jelas ada 5 slot, slot aktif menyala, CD ganti senjata berupa sapuan ---
  const sz = 30, gap = 5, x0 = 10, y0 = H - 76, now = performance.now(), dtk = Math.min(.05, Math.max(0, (now - HK.last) / 1000));
  HK.last = now;
  if (HK.prev != wi) {
    if (HK.prev >= 0)
      HK.pop = 1;
    HK.prev = wi;
  }
  HK.pop = Math.max(0, HK.pop - dtk * 4);
  g.font = 'bold 8px monospace';
  txt('SENJATA', x0, y0 - 8, '#8a90b0');
  txt(WP[wi].n.toUpperCase(), x0 + 5 * (sz + gap) - gap, y0 - 8, WCOL[wi], 'right');
  for (let i = 0; i < 5; i++) {
    const act = i == wi;
    HK.e[i] += ((act ? 1 : 0) - HK.e[i]) * Math.min(1, dtk * 14);
    const e = HK.e[i], grow = e * 3 + (act ? HK.pop * 2 : 0), x = x0 + i * (sz + gap) - grow, y = y0 - e * 4 - grow, bs = sz + grow * 2, col = WCL[i];
    const bg = g.createLinearGradient(0, y, 0, y + bs);
    bg.addColorStop(0, act ? 'rgba(34,32,60,.9)' : 'rgba(22,22,36,.68)');
    bg.addColorStop(1, act ? 'rgba(8,8,20,.92)' : 'rgba(0,0,0,.6)');
    g.fillStyle = bg;
    g.fillRect(x, y, bs, bs);
    if (act) {
      g.fillStyle = 'rgba(' + col + ',' + (.2 + .08 * Math.sin(t * 5)) + ')';
      g.fillRect(x, y, bs, bs);
      g.save();
      g.globalCompositeOperation = 'lighter';
      const gl = g.createRadialGradient(x + bs / 2, y + bs / 2, 2, x + bs / 2, y + bs / 2, bs * .9);
      gl.addColorStop(0, 'rgba(' + col + ',.35)');
      gl.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = gl;
      g.fillRect(x - 6, y - 6, bs + 12, bs + 12);
      g.restore();
    }
    wpnIcon(i, x + bs / 2, y + bs / 2 + 1, .82 + e * .3 + (act ? HK.pop * .12 : 0), WCOL[i], .55 + e * .45);
    if (WSW > 0 && !act) {
      cdSweep(x, y, bs, bs, WSW / 2);
      g.font = 'bold 10px monospace';
      txt(WSW.toFixed(1), x + bs / 2, y + bs / 2 + 4, '#fff', 'center');
    }
    g.strokeStyle = act ? 'rgb(' + col + ')' : 'rgba(' + col + ',.4)';
    g.lineWidth = act ? 2 : 1;
    g.strokeRect(x + .5, y + .5, bs - 1, bs - 1);
    g.font = 'bold 8px monospace';
    txt(String(i + 1), x + 3, y + 9, act ? '#ffd34d' : '#99a');
  }
  // --- slot skill Z X C + Focus E: sapuan cooldown + angka detik + bar progres ---
  const w = 54, h = 40, gp = 6, sx = W - 10 - (4 * w + 3 * gp), sy = H - 52, PLm = FPAL[wi].mid;
  [0, 1, 2].map(i => [['Z', 'X', 'C'][i], SK[wi][i].n, p.sc[i], SK[wi][i].cd, WCL[wi]]).concat([['E', 'Focus', p.ec, 30, PLm]]).forEach(([k, n, c, m, col], i) => {
    const x = sx + i * (w + gp), y = sy, on = i == 3 && p.focus > 0, rdy = c <= 0;
    g.fillStyle = 'rgba(0,0,0,.62)';
    g.fillRect(x, y, w, h);
    if (on) {
      g.fillStyle = 'rgba(' + col + ',.38)';
      const fh = h * Math.max(0, p.focus / FOCUS_CFG.dur);
      g.fillRect(x, y + h - fh, w, fh);
    } else if (rdy) {
      g.fillStyle = 'rgba(' + col + ',' + (.14 + .07 * Math.sin(t * 5 + i)) + ')';
      g.fillRect(x, y, w, h);
    } else {
      cdSweep(x, y, w, h, c / m);
    }
    if (!rdy) {
      g.fillStyle = 'rgba(' + col + ',.9)';
      g.fillRect(x, y + h - 3, w * (1 - c / m), 3);
    }
    g.strokeStyle = on ? 'rgb(' + col + ')' : rdy ? 'rgba(' + col + ',.95)' : 'rgba(' + col + ',.3)';
    g.lineWidth = on ? 2 : 1;
    g.strokeRect(x + .5, y + .5, w - 1, h - 1);
    g.font = 'bold 10px monospace';
    txt(k, x + 4, y + 12, rdy || on ? '#fff' : '#889');
    g.font = '7px monospace';
    txt(n.slice(0, 10), x + w / 2, y + h - 6, rdy || on ? '#dde' : '#778', 'center');
    if (on) {
      g.font = 'bold 11px monospace';
      txt(p.focus.toFixed(1) + 's', x + w / 2 + 6, y + 21, '#fff', 'center');
    } else if (!rdy) {
      g.font = 'bold 12px monospace';
      txt(c >= 1 ? String(Math.ceil(c)) : c.toFixed(1), x + w / 2 + 6, y + 22, '#fff', 'center');
    }
  });
  g.restore();
  g.font = 'bold 9px monospace';
}

function txt(s, x, y, c, al) { g.fillStyle = c || '#fff'; g.textAlign = al || 'left'; g.fillText(s, x, y); }

function draw() {
  g.fillStyle = '#0c0b14';
  g.fillRect(0, 0, W, H);
  g.save();
  SHX = SHY = 0;
  if (shake > 0)
    g.translate(SHX = (R() - .5) * shake, SHY = (R() - .5) * shake);
  g.scale(CAM_Z, CAM_Z);
  g.translate(-camX, -camY);
  g.drawImage(window.ENDM && !lobby && window.EBGC ? window.EBGC : BG, 0, 0);
  if (!lobby && !window.ENDM)
    drawDoors();
  if (!room && !lobby) {
    g.fillStyle = '#2b6f8a';
    g.beginPath();
    g.arc(60, DY, 12, 0, 7);
    g.fill();
    g.fillStyle = '#4fd0ff';
    g.beginPath();
    g.arc(60, DY, 6 + Math.sin(t * 3) * 1.5, 0, 7);
    g.fill();
  }
  envFx();
  if (lobby) {
    lobbyDraw();
    trainDraw();
    trainLife();
  }
  dr.forEach(d => { const by = Math.sin(t * 4 + d.ph) * 1.5; g.save(); g.globalCompositeOperation = 'lighter'; const q = g.createRadialGradient(d.x, d.y, 0, d.x, d.y, 14); q.addColorStop(0, 'rgba(255,100,140,.5)'); q.addColorStop(1, 'rgba(255,100,140,0)'); g.fillStyle = q; g.fillRect(d.x - 14, d.y - 14, 28, 28); g.restore(); g.fillStyle = '#e04b6b'; g.fillRect(d.x - 3, d.y - 4 + by, 6, 8); g.fillStyle = '#fff'; g.fillRect(d.x - 1, d.y - 6 + by, 2, 2); });
  es.forEach(e => {
    if (e.sw > 0) {
      spawnDraw(e);
      return;
    }
    if (e.wind > 0) {
      const k = 1 - e.wind / (e.k == 'skel' ? .6 : .7);
      g.fillStyle = (lavaOn() ? 'rgba(255,140,30,' : iceR() ? 'rgba(120,205,255,' : 'rgba(255,60,60,') + (.15 + k * .35) + ')';
      if (e.k == 'skel') {
        g.beginPath();
        g.arc(e.tx, e.ty, lavaOn() ? 42 : iceR() ? (room ? 50 : 44) : 28, 0, 7);
        g.fill();
      } else {
        g.strokeStyle = lavaOn() ? 'rgba(255,150,40,.7)' : iceR() ? 'rgba(140,215,255,.75)' : 'rgba(255,60,60,.6)';
        g.beginPath();
        g.moveTo(e.x, e.y);
        g.lineTo(e.tx, e.ty);
        g.stroke();
      }
    }
    g.fillStyle = '#0006';
    g.fillRect(e.x - 10, e.y + 6, 20, 3);
    drawEnemy(e);
    if (e.k == 'dummy' || e.dying)
      return;
    if (e.stun > 0 && !(e.bh > t)) {
      g.fillStyle = '#ffd34d';
      for (let i = 0; i < 3; i++)
        g.fillRect(e.x + Math.cos(t * 6 + i * 2.1) * 7 - 1, e.y - e.ht - 4 + Math.sin(t * 6 + i * 2.1) * 2, 2, 2);
    }
    bar(e.x - 9, e.y - e.ht - 11, 18, 2, e.hp, e.mhp, '#e44');
    bar(e.x - 9, e.y - e.ht - 8, 18, 1, e.stg, e.sg, '#ffd34d');
  });
  gh.forEach(q => {
    const k = q.life / q.max;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = k * .3;
    g.fillStyle = '#ff5a78';
    g.beginPath();
    g.ellipse(q.x, q.y - 4, 9, 14, 0, 0, 7);
    g.fill();
    g.restore();
    g.globalAlpha = k * .5;
    drawHero(q.x, q.y, 1, q.ph);
    g.globalAlpha = 1;
  });
  dp.forEach(q => {
    const k = q.life / q.max;
    if (GFX.hp && q.k != 'l' && (q.x < camX - 30 || q.y < camY - 30 || q.x > camX + W / CAM_Z + 30 || q.y > camY + H / CAM_Z + 30))
      return;
    if (q.k == 'f')
      flame(q, k);
    else if (q.k == 's')
      smoke(q, k);
    else if (q.k == 'sh')
      shardFx(q, k);
    else if (q.k == 'gf')
      gflame(q, k);
    else if (q.k == 'cf')
      cflame(q, k);
    else if (q.k == 'l') {
      const L = q.len * (.4 + k * .6);
      if (q.w) {
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = k * .45;
        g.strokeStyle = q.cc;
        g.lineWidth = q.w * 2.4;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(q.x, q.y);
        g.lineTo(q.x - Math.cos(q.a) * L, q.y - Math.sin(q.a) * L);
        g.stroke();
        g.restore();
      }
      g.globalAlpha = k * .9;
      g.strokeStyle = q.w ? '#fff' : '#ffd0da';
      g.lineWidth = q.w ? q.w * .55 : 1.5;
      g.beginPath();
      g.moveTo(q.x, q.y);
      g.lineTo(q.x - Math.cos(q.a) * L, q.y - Math.sin(q.a) * L);
      g.stroke();
      g.lineWidth = 1;
    } else {
      g.globalAlpha = k;
      g.fillStyle = q.c;
      const z = Math.ceil(q.s);
      g.fillRect(Math.round(q.x), Math.round(q.y), z, z);
    }
  });
  g.globalAlpha = 1;
  if ((p.dead <= 0 || Math.floor(t * 10) % 2) && !ULTH) {
    if (p.focus > 0)
      focusAura(0); // aura api Battle Focus (belakang hero)
    g.globalAlpha = p.inv > 0 && p.dod <= 0 ? .5 : 1;
    HT = p.hurt > 0 ? '#fff' : null;
    {
      const wp = wpose();
      drawHero(p.x, p.y, 0, null, wp.lx, wp.ly);
      drawArmed(wp);
    }
    HT = null;
    g.globalAlpha = 1;
    if (p.focus > 0)
      focusAura(1);
    if (M.d && p.hold > .3) {
      const k = Math.min(1, p.hold / .6);
      g.strokeStyle = k >= 1 ? '#ffd34d' : '#fff';
      g.beginPath();
      g.arc(p.x, p.y, 12, -1.57, -1.57 + k * 6.28);
      g.stroke();
    }
  }
  pr.forEach(b => {
    if (b.own == 'p')
      projFx(b);
  });
  pr.forEach(b => {
    const a = Math.atan2(b.vy, b.vx);
    if (b.aoe)
      orb(b.x, b.y, (4 + Math.sin(t * 20)) * b.aoe / 24 + 2, 1.1);
    else if (b.own == 'p' && b.kn) {
      g.save();
      g.translate(b.x, b.y);
      g.rotate(t * 30);
      g.fillStyle = '#dfe6f2';
      g.fillRect(-5, -1, 10, 2);
      g.fillRect(-1, -5, 2, 10);
      g.restore();
    } else if (b.own == 'p') {
      g.save();
      g.translate(b.x, b.y);
      g.rotate(a);
      g.save();
      g.globalCompositeOperation = 'lighter';
      const tg = g.createLinearGradient(-30, 0, 0, 0);
      tg.addColorStop(0, 'rgba(120,230,100,0)');
      tg.addColorStop(1, 'rgba(150,255,120,.55)');
      g.fillStyle = tg;
      g.fillRect(-30, -1.8, 30, 3.6);
      g.restore();
      if (b.big) {
        g.fillStyle = 'rgba(255,230,150,.35)';
        g.fillRect(-24, -2, 24, 4);
        g.scale(1.4, 1.4);
      }
      g.strokeStyle = 'rgba(255,255,255,.35)';
      g.beginPath();
      g.moveTo(-16, 0);
      g.lineTo(-4, 0);
      g.stroke();
      g.fillStyle = '#c2a17a';
      g.fillRect(-10, -.8, 14, 1.6);
      g.fillStyle = '#dce2ec';
      g.beginPath();
      g.moveTo(4, -2);
      g.lineTo(8, 0);
      g.lineTo(4, 2);
      g.fill();
      g.fillStyle = '#a33b4c';
      g.fillRect(-11, -2, 4, 1.2);
      g.fillRect(-11, .8, 4, 1.2);
      g.restore();
    } else if (b.rock)
      drawRock(b);
    else if (b.pb) { } else {
      g.save();
      g.translate(b.x, b.y);
      g.rotate(a);
      g.fillStyle = 'rgba(230,201,142,.3)';
      g.fillRect(-18, -1, 16, 2);
      g.fillStyle = '#c2a17a';
      g.fillRect(-10, -.8, 14, 1.6);
      g.fillStyle = '#dce2ec';
      g.beginPath();
      g.moveTo(4, -2);
      g.lineTo(9, 0);
      g.lineTo(4, 2);
      g.fill();
      g.fillStyle = '#a33b4c';
      g.fillRect(-11, -2, 4, 1.2);
      g.fillRect(-11, .8, 4, 1.2);
      g.restore();
    }
  });
  fx.forEach(f => {
    const k = f.life / f.max;
    if (f.k == 'slash')
      slashFx2(f, 1 - k);
    else if (f.k == 'muzz')
      muzzFx2(f, k);
    else if (f.k == 'pil')
      pilFx(f, k);
    else if (f.k == 'pf')
      pfFx(f, k);
    else if (f.k == 'ab')
      abFx(f, k);
    else if (f.k == 'xm')
      xmFx(f, k);
    else if (f.k == 'rune')
      runeFx(f, k);
    else if (f.k == 'gl')
      glFx(f, k);
    else if (f.k == 'cut')
      cutFx(f, k);
    else if (f.k == 'flare')
      flareFx(f, k);
    else if (f.k == 'pierce')
      pierceFx(f, k);
    else if (f.k == 'ux')
      uxFx(f, k);
    else if (f.k == 'beat')
      beatFx(f, k);
    else if (f.k == 'bh')
      bhFx(f, k);
    else if (f.k == 'shr')
      shrFx(f, k);
    else if (f.k == 'arc') {
      g.fillStyle = 'rgba(255,255,255,' + k * .55 + ')';
      g.beginPath();
      g.moveTo(f.x, f.y);
      g.arc(f.x, f.y, f.r, f.a - f.arc / 2, f.a + f.arc / 2);
      g.fill();
    } else if (f.k == 'ring') {
      g.strokeStyle = f.col;
      g.globalAlpha = k;
      g.lineWidth = f.w || 1;
      g.beginPath();
      g.arc(f.x, f.y, f.r * (f.fill ? 1 : 1.6 - k * .6), 0, 7);
      if (f.fill) {
        g.fillStyle = f.col;
        g.globalAlpha = k * .4;
        g.fill();
        g.globalAlpha = k;
      }
      g.stroke();
      g.lineWidth = 1;
      g.globalAlpha = 1;
    } else {
      g.font = (f.crit ? 'bold 11px' : 'bold 8px') + ' monospace';
      g.globalAlpha = Math.min(1, k * 2);
      txt(f.s, f.x, f.y, f.col, 'center');
      g.globalAlpha = 1;
    }
  });
  if (window.outFront)
    outFront();
  g.restore();
  g.drawImage(VG, 0, 0);
  g.font = 'bold 9px monospace';
  hudPlayer();
  if (lobby) {
    txt(trn ? 'RUANG PELATIHAN' : 'LOBBY — ZONA AMAN', W - 10, 18, '#8fe8a0', 'right');
    txt(trn ? 'Training Hall' : 'Sanctum Hall', W - 10, 44, '#778', 'right');
  } else {
    txt('Gelombang ' + wave + (room ? '/' + ROOM2_LAST_WAVE : '/5') + '  Musuh: ' + es.length, W - 10, 18, '#fff', 'right');
    txt(room ? 'Torch Dungeon' : 'Ancient Hall', W - 10, 44, '#778', 'right');
  }
  if (p.combo > 1)
    txt('Combo x' + p.combo, W - 10, 32, '#ffd34d', 'right');
  if (!isMobile)
    txt('[L] Kontrol   [F] Layar penuh   [M] Suara ' + (SFX.isOn() ? 'ON' : 'OFF'), W / 2, 12, '#667', 'center');
  if (pts > 0)
    txt('Poin atribut: ' + pts + ' - bagi lewat Ketua Orin di lobby', 10, 62, '#ffd34d');
  if (!isMobile)
    txt('VIT ' + A.VIT + ' STR ' + A.STR + ' DEF ' + A.DEF + ' AGI ' + A.AGI + ' INT ' + A.INT, 10, H - 34, '#aab');
  if (!isMobile)
    hudKeys();
  if (!isMobile)
    txt('Potion: ' + p.pot + '/5 [R]', 10, H - 6, '#e08aa0');
  if (msgT > 0) {
    g.globalAlpha = Math.min(1, msgT);
    g.font = 'bold 11px monospace';
    txt(msgS, W / 2, 60, '#fff', 'center');
    g.globalAlpha = 1;
  }
  if (lobby)
    lobbyHud();
  if (guide) {
    g.fillStyle = 'rgba(8,7,16,.92)';
    g.fillRect(100, 50, 440, 340);
    g.strokeStyle = '#4a4780';
    g.strokeRect(100.5, 50.5, 439, 339);
    g.font = 'bold 11px monospace';
    txt('PANDUAN KONTROL  (tekan L untuk menutup)', W / 2, 72, '#ffd34d', 'center');
    g.font = '9px monospace';
    [
      'WASD  : gerak,  Shift : lari', 'Mouse : arah serangan', 'Klik kiri : serangan basic (chain combo)', 'Tahan klik kiri lalu lepas : charged (30 stamina)', 'Space : dodge (25 stamina)', 'Z X C : 3 skill tiap senjata', 'E : Battle Focus', 'Q : ULTIMATE (aktif saat bar ULT penuh)', '1-5 : ganti senjata instan', 'R : potion (+60 HP)', 'Orin (lobby) : Kitab Status / atribut', 'M : suara ON/OFF', 'F : layar penuh', 'L : tampilkan / tutup panduan', 'G : bicara dengan NPC (lobby)', 'B : kembali ke lobby (dungeon)', 'ESC : jeda / menu utama'
    ].forEach((s, i) => txt(s, 120, 98 + i * 17, '#dde', 'left'));
  }
  if (p.focus > 0 && !ULTH) {
    const vk = Math.max(0, Math.min(1, p.focus / .6, .25 + (FOCUS_CFG.dur - p.focus) * 2)) * (.85 + .15 * Math.sin(t * 6)), VC = FPAL[wi].vg, vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75);
    vg.addColorStop(0, 'rgba(' + VC + ',0)');
    vg.addColorStop(1, 'rgba(' + VC + ',' + .38 * vk + ')');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
  }
  if (FLSH > 0) {
    g.fillStyle = 'rgba(' + FLSC + ',' + FLSH * .22 + ')';
    g.fillRect(0, 0, W, H);
  }
  if (ULTT > 0) {
    const k = Math.min(1, ULTT / .5), gr = g.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .8);
    gr.addColorStop(0, 'rgba(' + ULTC + ',0)');
    gr.addColorStop(1, 'rgba(' + ULTC + ',' + .28 * k + ')');
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  }
  if (ULTF > 0) {
    const al = ULTF > 1.2 ? (1.4 - ULTF) / .2 : Math.min(1, ULTF / .4);
    g.save();
    g.globalAlpha = al;
    g.fillStyle = 'rgba(0,0,0,.62)';
    g.fillRect(0, 92, W, 40);
    g.fillStyle = 'rgba(' + ULTC + ',.9)';
    g.fillRect(0, 92, W, 1);
    g.fillRect(0, 131, W, 1);
    g.font = '8px monospace';
    txt('— U L T I M A T E —', W / 2, 104, '#fff', 'center');
    g.font = 'bold 18px monospace';
    txt(ULTN.toUpperCase(), W / 2, 124, 'rgb(' + ULTC + ')', 'center');
    g.restore();
    g.font = '9px monospace';
  }
  if (fade > 0) {
    g.fillStyle = 'rgba(0,0,0,' + Math.min(1, fade * 1.7) + ')';
    g.fillRect(0, 0, W, H);
  }
  if (p.dead > 0) {
    g.fillStyle = 'rgba(120,0,0,.35)';
    g.fillRect(0, 0, W, H);
  }
}
const BG0 = document.createElement('canvas'), BG1 = document.createElement('canvas'), VG = document.createElement('canvas'), BGS = [BG0, BG1];
let BG = BG0;
BG0.width = BG1.width = DW;
BG0.height = BG1.height = DH;
VG.width = W;
VG.height = H;
const TO0 = [
  [100, 8], [300, 8], [500, 8], [700, 8], [200, DH - 7], [400, DH - 7], [600, DH - 7], [7, 140], [7, 340], [DW - 7, 140], [DW - 7, 340]
], TO1 = [64, 164, 264, 364, 464, 564, 664, 764].flatMap(x => [[x, 8], [x, DH - 7]]);
let TO = TO0;
const BR0 = [[36, 40], [DW - 36, 40], [36, DH - 40], [DW - 36, DH - 40]], BR1 = [[346, DY], [454, DY], [36, 60], [DW - 36, 60], [36, DH - 60], [DW - 36, DH - 60]];
let BR = BR0;

function buildBG() {
  const b = BG.getContext('2d');
  let sd = 11;
  const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, ri = (a, z) => a + Math.floor(r() * (z - a + 1));
  b.fillStyle = '#100f1b';
  b.fillRect(0, 0, DW, DH);
  const FL = ['#25233b', '#282641', '#222038', '#2b2945', '#201e34', '#27243d'];
  for (let y = 0; y < DH; y += 32)
    for (let x = 0; x < DW; x += 32) {
      b.fillStyle = FL[ri(0, 5)];
      b.fillRect(x + 1, y + 1, 30, 30);
      b.fillStyle = 'rgba(255,255,255,.07)';
      b.fillRect(x + 1, y + 1, 30, 1);
      b.fillRect(x + 1, y + 1, 1, 30);
      b.fillStyle = 'rgba(0,0,0,.28)';
      b.fillRect(x + 1, y + 30, 30, 1);
      b.fillRect(x + 30, y + 1, 1, 30);
      for (let i = 0; i < 7; i++) {
        b.fillStyle = r() < .5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.18)';
        b.fillRect(x + ri(3, 27), y + ri(3, 27), ri(1, 2), 1);
      }
    }
  floorPass(b, DW, DH, {
    seed: 5, walls: W0, patches: 14, lt: '150,140,230', frame: 1, trim: 'rgba(120,110,190,.22)', glow: 'rgba(130,190,255,.75)', glowRgb: '110,170,255', line: 'rgba(110,170,255,.34)', motif: 'rune', blood: 7, web: 1
  });
  const crack = (x, y, gl) => {
    b.strokeStyle = gl ? 'rgba(70,150,210,.35)' : 'rgba(5,4,12,.6)'; b.lineWidth = 1; b.beginPath(); b.moveTo(x, y); let cx = x, cy = y; for (let i = 0; i < 5; i++) {
      cx += ri(-6, 8);
      cy += ri(3, 8);
      b.lineTo(cx, cy);
    } b.stroke();
  };
  [
    [200, 60], [390, 140], [80, 250], [560, 200], [250, 330], [430, 40], [600, 300], [110, 340], [300, 120], [680, 90], [740, 200], [700, 330], [520, 430], [200, 440], [620, 420], [400, 300], [150, 420], [470, 230]
  ].forEach(([x, y], i) => crack(x, y, i % 4 == 0));
  [
    [40, 50], [590, 360], [200, 370], [420, 250], [100, 300], [700, 60], [730, 430], [400, 445], [60, 440], [760, 250]
  ].forEach(([x, y]) => {
    for (let i = 0; i < 26; i++) {
      b.fillStyle = r() < .5 ? 'rgba(60,120,80,.5)' : 'rgba(40,90,60,.45)';
      b.fillRect(x + ri(-10, 10), y + ri(-7, 7), ri(1, 3), ri(1, 2));
    }
  });
  [[260, 250], [540, 170], [680, 360], [420, 420], [130, 60], [720, 150]].forEach(([x, y]) => { b.fillStyle = 'rgba(20,40,80,.7)'; b.beginPath(); b.ellipse(x, y, 14, 6, 0, 0, 7); b.fill(); b.fillStyle = 'rgba(90,140,200,.3)'; b.fillRect(x - 8, y - 2, 6, 1); b.fillRect(x + 2, y + 1, 5, 1); });
  for (let i = 0; i < 28; i++) {
    const x = ri(30, DW - 30), y = ri(30, DH - 30);
    b.fillStyle = 'rgba(0,0,0,.35)';
    b.fillRect(x, y + 2, 4, 2);
    b.fillStyle = '#3d3a5c';
    b.fillRect(x, y, ri(2, 4), ri(2, 3));
  }
  const bone = (x, y, a) => { b.save(); b.translate(x, y); b.rotate(a); b.fillStyle = '#cbc5b6'; b.fillRect(-4, -1, 8, 2); b.fillRect(-5, -2, 2, 4); b.fillRect(3, -2, 2, 4); b.restore(); };
  [
    [230, 150, .4], [240, 156, -.8], [560, 310, .2], [90, 120, 1.2], [350, 330, .6], [420, 160, -.3], [500, 360, .9], [660, 150, .5], [740, 380, -.4], [300, 430, 1.0], [640, 260, .3]
  ].forEach(a => bone(...a));
  [[245, 162], [360, 322], [100, 128], [700, 300], [560, 430], [660, 70]].forEach(([x, y]) => { b.fillStyle = '#d8d2c4'; b.fillRect(x - 3, y - 3, 7, 6); b.fillRect(x - 2, y + 3, 5, 2); b.fillStyle = '#14121f'; b.fillRect(x - 2, y - 1, 2, 2); b.fillRect(x + 1, y - 1, 2, 2); });
  b.fillStyle = 'rgba(8,7,16,.6)';
  b.beginPath();
  b.arc(60, DY, 20, 0, 7);
  b.fill();
  b.strokeStyle = 'rgba(79,208,255,.25)';
  b.beginPath();
  b.arc(60, DY, 20, 0, 7);
  b.stroke();
  const gr = (x0, y0, x1, y1, rx, ry, rw, rh) => { const q = b.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, 'rgba(0,0,0,.55)'); q.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = q; b.fillRect(rx, ry, rw, rh); };
  gr(0, 14, 0, 34, 14, 14, DW - 28, 20);
  gr(0, DH - 14, 0, DH - 34, 14, DH - 34, DW - 28, 20);
  gr(14, 0, 34, 0, 14, 14, 20, DH - 28);
  gr(DW - 14, 0, DW - 34, 0, DW - 34, 14, 20, DH - 28);
  b.save();
  b.translate(OX, OY);
  decor0f(b);
  b.restore();
  decor0x(b);
  BR0.forEach(([x, y]) => bzBase(b, x, y));
  walls.slice(4).forEach(w => { b.fillStyle = 'rgba(0,0,0,.4)'; b.fillRect(w[0] + 3, w[1] + 5, w[2], w[3]); });
  const BC = ['#3a3760', '#363358', '#3e3b66', '#33305a'];
  const brick = (x, y, w, h, bw) => {
    b.save();
    b.beginPath();
    b.rect(x, y, w, h);
    b.clip();
    b.fillStyle = '#211f38';
    b.fillRect(x, y, w, h);
    for (let j = 0, ry = y; ry < y + h; ry += 7, j++)
      for (let rx = x - (j % 2 ? bw / 2 : 0); rx < x + w; rx += bw) {
        b.fillStyle = BC[ri(0, 3)];
        b.fillRect(rx + 1, ry + 1, bw - 1, 6);
        b.fillStyle = 'rgba(255,255,255,.09)';
        b.fillRect(rx + 1, ry + 1, bw - 1, 1);
        b.fillStyle = 'rgba(0,0,0,.3)';
        b.fillRect(rx + 1, ry + 6, bw - 1, 1);
        if (r() < .12) {
          b.fillStyle = 'rgba(60,120,80,.45)';
          b.fillRect(rx + ri(1, bw - 3), ry + 1, 3, 2);
        }
      }
    b.restore();
  };
  walls.forEach((w, i) => {
    brick(w[0], w[1], w[2], w[3], i < 4 ? 16 : 14);
    if (i > 3) {
      b.fillStyle = '#6a66a0';
      b.fillRect(w[0], w[1], w[2], 2);
      b.fillStyle = 'rgba(0,0,0,.35)';
      b.fillRect(w[0], w[1] + w[3] - 3, w[2], 3);
      b.fillRect(w[0] + w[2] - 2, w[1], 2, w[3]);
    } else {
      const e = [[14, 12, DW - 28, 2], [14, DH - 14, DW - 28, 2], [12, 14, 2, DH - 28], [DW - 14, 14, 2, DH - 28]][i];
      b.fillStyle = '#55518a';
      b.fillRect(...e);
    }
  });
  TO.forEach(([x, y]) => { b.fillStyle = '#14121f'; b.fillRect(x - 2, y - 1, 4, 6); b.fillStyle = '#6b5a44'; b.fillRect(x - 3, y - 2, 6, 2); });
  const web = (x, y, sx, sy) => { b.strokeStyle = 'rgba(220,220,240,.22)'; b.lineWidth = 1;[[0, 24], [10, 20], [20, 10], [24, 0]].forEach(([a, c]) => { b.beginPath(); b.moveTo(x, y); b.lineTo(x + sx * a, y + sy * c); b.stroke(); });[10, 18].forEach(q => { b.beginPath(); b.moveTo(x + sx * q, y); b.quadraticCurveTo(x + sx * q * .5, y + sy * q * .5, x, y + sy * q); b.stroke(); }); };
  web(14, 14, 1, 1);
  web(DW - 14, 14, -1, 1);
  web(14, DH - 14, 1, -1);
  web(DW - 14, DH - 14, -1, -1);
  decor0w(b);
  const v = VG.getContext('2d'), q = v.createRadialGradient(320, 200, 120, 320, 200, 390);
  q.addColorStop(0, 'rgba(4,3,10,0)');
  q.addColorStop(1, 'rgba(4,3,10,.7)');
  v.fillStyle = q;
  v.fillRect(0, 0, W, H);
}

function envFx() {
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const ux = WW / 2 + Math.sin(t * .15 + i * 2.1) * WW * .36, uy = WH / 2 + Math.cos(t * .12 + i * 1.7) * WH * .3;
    if (GFX.hp)
      glowBlit(ux, uy, 130, '70,50,140', .07);
    else {
      let q = g.createRadialGradient(ux, uy, 0, ux, uy, 130);
      q.addColorStop(0, 'rgba(70,50,140,.07)');
      q.addColorStop(1, 'rgba(70,50,140,0)');
      g.fillStyle = q;
      g.fillRect(ux - 130, uy - 130, 260, 260);
    }
  }
  TO.forEach(([x, y], i) => {
    const f = 1 + Math.sin(t * 11 + i * 3) * .08 + Math.sin(t * 19 + i) * .05, rd = 100 * f; if (GFX.hp)
      glowBlit(x, y, rd, '255,150,60', .3);
    else {
      let q = g.createRadialGradient(x, y, 0, x, y, rd);
      q.addColorStop(0, 'rgba(255,150,60,.3)');
      q.addColorStop(1, 'rgba(255,150,60,0)');
      g.fillStyle = q;
      g.fillRect(x - rd, y - rd, rd * 2, rd * 2);
    }
  });
  g.restore();
  if (!room && !lobby) {
    g.save();
    g.translate(60, DY);
    g.strokeStyle = 'rgba(79,208,255,.55)';
    g.lineWidth = 1;
    g.beginPath();
    g.arc(0, 0, 17, 0, 7);
    g.stroke();
    g.rotate(t * .6);
    g.fillStyle = 'rgba(120,220,255,.8)';
    for (let i = 0; i < 6; i++) {
      g.rotate(1.0472);
      g.fillRect(16, -1, 3, 2);
    }
    g.restore();
  }
  TO.forEach(([x, y], i) => { const h = Math.round(3 + (Math.sin(t * 13 + i * 2) * .5 + Math.sin(t * 23 + i) * .5) * 1.5), ox = Math.round(x), oy = Math.round(y); g.fillStyle = '#e8561f'; g.fillRect(ox - 2, oy - 3 - h, 4, h + 2); g.fillStyle = '#ff9a3c'; g.fillRect(ox - 1, oy - 2 - h, 2, h + 1); g.fillStyle = '#ffe28a'; g.fillRect(ox, oy - 4, 1, 2); });
  BR.forEach(([x, y], i) => brazier(x, y, i));
}

// ===== LOBBY (safe zone) =====
const BGL = document.createElement('canvas');
BGL.width = MW;
BGL.height = MH;
const WL = [
  [0, 0, 640, 14], [0, 386, 640, 14], [0, 0, 14, 400], [626, 0, 14, 172], [626, 228, 14, 172], [256, 14, 32, 32, 'g'], [352, 14, 32, 32, 'g'], [44, 40, 64, 30, 'a'], [532, 38, 64, 34, 'a'], [150, 150, 26, 26, 'p'], [464, 150, 26, 26, 'p'], [150, 262, 26, 26, 'p'], [464, 262, 26, 26, 'p'], [246, 52, 12, 14, 'b'], [382, 52, 12, 14, 'b'], [70, 98, 12, 8, 'c'], [558, 100, 12, 8, 'c'], [94, 302, 12, 8, 'c'], [590, 328, 22, 20, 'c'], [286, 164, 68, 46, 'f'], [186, 190, 38, 14, 'b'], [416, 190, 38, 14, 'b'], [16, 262, 30, 44, 'k'], [16, 310, 30, 44, 'k'], [50, 340, 34, 24, 'k'], [16, 356, 30, 28, 'k']
];
const TOL = [[120, 8], [200, 8], [440, 8], [520, 8], [7, 200], [633, 158], [633, 242], [220, 393], [420, 393]], BRL = [[252, 60], [388, 60]];
const DM = { t0: 0, sum: 0, n: 0, last: -99, max: 0 };
let dlg = null;
const NP = [
  {
    n: 'Brokk, Pandai Besi', x: 76, y: 96, c1: '#6b4d33', c2: '#8a6a4a', c3: '#2a2530', hair: '#5a3a22', ex: R_ => { R_(-5, -4, 10, 9, '#4a3a2e'); R_(-3, -11, 6, 3, '#5a3a22'); R_(8, -9, 2, 11, '#6b4d33'); R_(6, -11, 7, 4, '#9aa3b0'); },
    lines: [
      'Heh, akhirnya bangun juga! Senjatamu kelihatan tua, tapi masih tajam.', 'Pedang, tombak, busur, tongkat, belati: tiap senjata punya 3 hit combo yang berbeda. Tekan 1-5 untuk berganti.', 'Tahan klik kiri lalu lepas untuk serangan charged, dan Z X C untuk skill. Coba semuanya di manekin, di ruang pelatihan sebelah kanan lobby!'
    ]
  },
  {
    n: 'Seraphine, Penyembuh', x: 564, y: 98, c1: '#e8e4f0', c2: '#c2a06b', c3: '#cfc8dc', hair: '#d8b878', ex: R_ => { R_(-6, -19, 12, 4, '#e8e4f0'); R_(-6, -15, 2, 6, '#e8e4f0'); R_(4, -15, 2, 6, '#e8e4f0'); R_(-10, -14, 2, 22, '#c2a06b'); R_(-12, -17, 6, 4, '#8fe8ff'); },
    lines: [
      'Tempat ini dilindungi cahaya. Tidak ada makhluk Abyss yang bisa masuk.', 'Biarkan aku memulihkanmu sebelum kau pergi bertarung lagi...'
    ],
    act: () => { p.hp = mhp(); p.st = 100; p.pot = 5; p.sc = [0, 0, 0]; p.ec = 0; SFX.potion(); SFX.focus(); fx.push({ k: 'ring', x: p.x, y: p.y, r: 20, w: 3, life: .5, max: .5, col: '#8fe8ff' }, { k: 'gl', x: p.x, y: p.y, r: 40, c: '120,240,255', life: .5, max: .5 }); dn(p.x, p.y - 14, 'HP, Potion & Skill pulih', 0, '#8fe8ff'); }
  },
  {
    n: 'Ser Aldric, Ksatria Tua', x: 556, y: 206, c1: '#6a6f7c', c2: '#9aa0ae', c3: '#3a3d48', hair: '#9a9aa8', ex: R_ => { R_(-5, -20, 10, 7, '#8a8f9c'); R_(-1, -25, 3, 5, '#a33b4c'); R_(-12, -6, 6, 10, '#4b5aa0'); R_(-11, -4, 4, 6, '#c2a06b'); },
    lines: [
      'Gerbang di utara menuju Dungeon. Habiskan 5 gelombang untuk membuka pintu ke ruangan berikutnya.', 'Saat genting, tekan B (jika tak ada musuh dekat) untuk kembali ke lobby. Gugur pun akan membawamu pulang ke sini.', 'Poin atribut dari level up dibagi lewat Kitab Status milik Ketua Orin di lobby. Berhati-hatilah, pahlawan.'
    ]
  },
  {
    n: 'Abeth, Pedagang Keliling', kind: 'merchant', x: 542, y: 340, face: -1, mate: 'Finza', dance: 1, ly: 10, lx: 16, c1: '#7a3a5a', c2: '#d8b878', c3: '#3a2a3a', hair: '#6b3a22', skin: '#e8b898',
    lines: [
      'Selamat datang! Aku Abeth, pedagang keliling. Maaf ya, aku sedang berdansa dengan Finza, pasanganku. Kami selalu berdansa di lantai ini setiap sore.', 'Ramuan memulihkan 60 HP. Tekan R saat bertarung, dan musuh kadang menjatuhkan ramuan baru.', 'Finza bilang dagangan terbaik adalah yang membuat pelanggan pulang dengan selamat. Makanya, kuisi ulang persediaanmu. Gratis untuk pahlawan yang menjaga kita semua!'
    ],
    act: () => { p.pot = 5; SFX.pickup(); dn(p.x, p.y - 14, 'Potion penuh (5/5)', 0, '#6f6'); }
  },
  {
    n: ' Orin, Penjaga Arsip', kind: 'elder', x: 100, y: 300, c1: '#3a4a8a', c2: '#c2a06b', c3: '#2a2f5a', hair: '#e6e6ee', skin: '#d9b79c',
    lines: [
      'Ketua Kau mendengar gema itu? Abyss belum tidur. Ia hanya menunggu orang-orang lupa.', 'Dulu para pahlawan menaklukkan lima wangsa bayangan. Kini kisah mereka tinggal catatan di arsip tua ini.', 'Pedang, tombak, busur, tongkat, belati: tiap senjata menyimpan ultimate yang mampu membalik jalannya pertempuran.', 'Kemarilah, pahlawan. Kitab Status ini menyalurkan kekuatanmu. Poin atribut hanya bisa dibagi di sini, bukan di dalam dungeon.'
    ],
    act: () => {
      try {
        window.openStatBook();
      } catch (e) {
        console.error(e);
      }
    }
  },
  {
    n: 'Finza, Pelatih Tempur', kind: 'trainer', x: 518, y: 340, face: 1, mate: 'Abeth', dance: 1, ly: 10, lx: -16, c1: '#4a5a6a', c2: '#8a6a3a', c3: '#2e3440', hair: '#2a1a14', skin: '#d9a07a',
    lines: [
      'Hei, murid baru! Aku Finza, pelatih tempur sekaligus pasangan dansa Abeth. Lihat gaunnya? Cantik, kan? Aku melatih siapa pun yang tidak takut keringat.', 'Setiap damage yang kau beri mengisi bar ULT di kiri atas. Saat penuh, tekan Q!', 'Selama ultimate aktif kau kebal serangan. Tombak melempar tombak raksasa, belati menghilang seperti ninja!', 'Nih, kuisi bar ULT-mu supaya bisa langsung dicoba di manekin ruang pelatihan (pintu kanan lobby). Hajar! Lagu belum selesai, jadi aku kembali berdansa dulu!'
    ],
    act: () => { ultAdd(ULT_MAX); }
  }
];

function mkDummy(x) { const e = mk('dummy', x || 1008, 200); e.sw = 0; e.sd = 0; e.st = 0; e.sx = 1; e.tl = 0; e.tv = 0; return e; }

function dummyTick(e, dt) { e.fl -= dt; e.tv += (-e.tl * 140 - e.tv * 7) * dt; e.tl = Math.max(-.6, Math.min(.6, e.tl + e.tv * dt)); }

function hitDummy(e, d, sx, sy, kb) {
  const c = R() < .15;
  d *= c ? 2 : 1;
  ultGain(d);
  SFX.hit(c);
  e.fl = .12;
  const a = Math.atan2(e.y - sy, e.x - sx);
  e.tv = Math.max(-9, Math.min(9, e.tv + Math.cos(a) * (c ? 7 : 4.5)));
  dn(e.x, e.y - e.ht - 4, Math.round(d), c);
  impact(e, a, c);
  impact2(e, a, c);
  shake = Math.max(shake, c ? 4 : 1.8);
  if (!(wi == 1 && (p.dod > 0 && p.dsp > 0 || SG.rf > 0)))
    HST = Math.max(HST, c ? .04 : .015);
  if (t - DM.last > 3) {
    DM.t0 = t;
    DM.sum = 0;
    DM.n = 0;
    DM.max = 0;
  }
  DM.last = t;
  DM.sum += d;
  DM.n++;
  DM.max = Math.max(DM.max, d);
  for (let i = 0; i < 4; i++)
    dp.push({
      k: 'p', x: e.x, y: e.y - 8, vx: (R() - .5) * 60, vy: -20 - R() * 40, life: .4, max: .4, s: 1.5 + R() * 1.5, c: i % 2 ? '#d8b878' : '#8a6a3a'
    });
}

function drawDummy(e) {
  const x = Math.round(e.x), y = Math.round(e.y + 8), w = e.fl > 0, c = a => w ? '#fff' : a, f = (col, a, b, ww, h) => { g.fillStyle = c(col); g.fillRect(a, b, ww, h); };
  g.save();
  g.translate(x, y);
  g.rotate(e.tl || 0);
  f('#4a3424', -9, -3, 18, 4);
  f('#5d4430', -7, -5, 14, 3);
  f('#6b4d33', -2, -32, 4, 29);
  f('#7d5c3d', -2, -32, 1, 29);
  f('#6b4d33', -12, -25, 24, 3);
  f('#c9a46b', -6, -28, 12, 16);
  f('#b08a4f', -6, -17, 12, 3);
  f('#d8b878', -12, -26, 3, 5);
  f('#d8b878', 9, -26, 3, 5);
  g.fillStyle = c('#a33b4c');
  g.beginPath();
  g.arc(0, -21, 5.5, 0, 7);
  g.fill();
  g.fillStyle = c('#e8dcc0');
  g.beginPath();
  g.arc(0, -21, 3.8, 0, 7);
  g.fill();
  g.fillStyle = c('#a33b4c');
  g.beginPath();
  g.arc(0, -21, 2, 0, 7);
  g.fill();
  f('#bda06a', -4, -39, 8, 9);
  f('#8a6a3a', -4, -31, 8, 2);
  f('#3a2a1a', -3, -36, 2, 2);
  f('#3a2a1a', 1, -36, 2, 2);
  f('#3a2a1a', -2, -33, 4, 1);
  g.restore();
}

// ===== NPC tambahan lobby (Abeth, Orin, Finza) =====
function drawNPCx(n, i) {
  const x = Math.round(n.x), y = Math.round(n.y), tk = t + i * 1.7, talk = dlg && dlg.n === n, fc = (n.face && !talk) ? n.face : (p.x < n.x - 4 ? -1 : 1), bo = Math.round((Math.sin(tk * 1.8) + 1) / 2 * .9), blink = (tk % 4.1) < .13, lx = (p.x - n.x) * fc > -4 ? 1 : 0, K = n.kind, sk = n.skin, Q = [];
  const r = (a, b, w, h, c, o) => Q.push([a, b, w, h, c, o !== 0]), fl = () => { g.fillStyle = '#120e18'; Q.forEach(q => q[5] && g.fillRect(q[0] - 1, q[1] - 1, q[2] + 2, q[3] + 2)); Q.forEach(q => { g.fillStyle = q[4]; g.fillRect(q[0], q[1], q[2], q[3]); }); Q.length = 0; }, add = f => { g.save(); g.globalCompositeOperation = 'lighter'; f(); g.restore(); }, SH = 'rgba(0,0,0,.25)', HL = 'rgba(255,255,255,.16)';
  g.save();
  g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.beginPath();
  g.ellipse(0, 8, K == 'elder' ? 11 : 9, 3, 0, 0, 7);
  g.fill();
  g.scale(fc, 1);
  if (K == 'elder') {
    r(-8, 2, 16, 7, n.c1);
    r(-8, 8, 16, 1, n.c2, 0);
    r(-6, 3, 3, 5, SH, 0);
    r(3, 3, 3, 5, SH, 0);
  } else {
    r(-5, 2, 4, 6, n.c3);
    r(1, 2, 4, 6, n.c3);
    r(-6, 6, 5, 3, '#241a14');
    r(1, 6, 5, 3, '#241a14');
  }
  // tongkat / tas di belakang
  if (K == 'merchant') {
    r(-14, -11, 7, 13, '#7a5230');
    r(-14, -12, 7, 2, '#a8762f', 0);
    r(-13, -3, 5, 2, '#4a3020', 0);
    r(-15, -15, 9, 3, '#c9a46b');
    r(-14, -15, 2, 3, '#a8855a', 0);
  }
  if (K == 'elder') {
    r(-14, -27, 2, 36, '#8a6a3a');
    r(-14, -27, 1, 36, '#b08a4f', 0);
    r(-16, -30, 6, 4, '#c2a06b');
  }
  fl();
  g.translate(0, -bo);
  // badan
  r(-7, -10, K == 'elder' ? 14 : 14, K == 'elder' ? 14 : 13, n.c1);
  r(4, -9, 3, K == 'elder' ? 13 : 11, SH, 0);
  r(-6, -9, 2, 10, HL, 0);
  if (K == 'elder') {
    r(-1, -10, 2, 14, n.c2, 0);
    r(-7, -1, 14, 2, n.c2, 0);
    r(-9, -12, 18, 3, n.c1);
    r(-9, -12, 18, 1, HL, 0);
  } else {
    r(-7, 0, 14, 2, n.c2);
    r(-1, 0, 2, 2, '#f4e2a8', 0);
  }
  // lengan
  if (K == 'trainer') {
    r(-10, -9, 3, 9, sk);
    r(7, -9, 3, 9, sk);
    r(-10, -9, 3, 2, SH, 0);
    r(-6, -8, 12, 2, '#e8e0d0', 0);
    r(-5, -5, 10, 2, '#e8e0d0', 0);
  } else {
    r(-10, -9, 3, 9, n.c1);
    r(7, -9, 3, 9, n.c1);
    r(-10, -9, 3, 1, HL, 0);
    r(7, -9, 3, 1, HL, 0);
  }
  r(-10, 0, 3, 3, sk);
  r(7, 0, 3, 3, sk);
  if (K == 'merchant') {
    r(2, 1, 3, 3, '#d8b878');
    r(8, -4, 3, 5, '#e04b6b');
    r(8, -6, 3, 2, '#8a6a3a');
    r(9, -3, 1, 2, '#ffc0d0', 0);
  }
  if (K == 'trainer') {
    r(10, -19, 3, 21, '#b08a4f');
    r(10, -19, 1, 21, '#d8b878', 0);
    r(8, -2, 7, 2, '#6b4d33');
    r(9, 2, 5, 2, '#4a3020');
  }
  // kepala
  r(-4, -20, 8, 8, sk);
  r(2, -19, 2, 7, SH, 0);
  r(-4, -19, 1, 5, HL, 0);
  if (blink) {
    r(-3, -16, 2, 1, '#3a2418', 0);
    r(1, -16, 2, 1, '#3a2418', 0);
  } else {
    r(-3, -17, 2, 2, '#f4eee8', 0);
    r(1, -17, 2, 2, '#f4eee8', 0);
    r(-3 + lx, -17, 1, 2, '#2a1a14', 0);
    r(1 + lx, -17, 1, 2, '#2a1a14', 0);
  }
  r(-1, -14, 2, talk && Math.floor(tk * 9) % 2 ? 2 : 1, talk ? '#5a2020' : '#a86a5a', 0);
  if (K == 'merchant') {
    r(-5, -23, 10, 4, n.hair);
    r(-5, -21, 2, 8, n.hair);
    r(-6, -24, 12, 3, '#d98a2c');
    r(-6, -24, 12, 1, '#f0b050', 0);
    r(3, -22, 3, 3, '#b8701c', 0);
    r(-6, -17, 2, 5, n.hair);
  } else if (K == 'elder') {
    r(-6, -24, 12, 6, n.c1);
    r(-6, -24, 12, 1, HL, 0);
    r(-6, -19, 2, 8, n.c1);
    r(4, -19, 2, 8, n.c1);
    r(-4, -14, 8, 6, '#e6e6ee');
    r(-3, -9, 6, 3, '#e6e6ee');
    r(-2, -6, 4, 2, '#cfcfdc', 0);
    r(-3, -18, 3, 1, '#f4f4fa', 0);
    r(1, -18, 3, 1, '#f4f4fa', 0);
    r(-1, -23, 2, 2, '#8fe8ff', 0);
  } else {
    r(-5, -23, 10, 3, n.hair);
    r(-5, -21, 2, 3, n.hair);
    r(3, -21, 2, 2, n.hair);
    r(-5, -21, 10, 2, '#c8283e');
    r(-5, -21, 10, 1, '#ff6a80', 0);
    r(5, -20, 3, 5, '#c8283e');
    r(6, -16, 2, 3, '#9a1f35');
  }
  fl();
  g.restore();
  // efek khusus
  if (K == 'elder') {
    g.save();
    g.translate(x, y);
    g.scale(fc, 1);
    add(() => {
      const q = g.createRadialGradient(-13, -31 - bo, 0, -13, -31 - bo, 16), f = .6 + .3 * Math.sin(tk * 3);
      q.addColorStop(0, 'rgba(150,235,255,' + f + ')');
      q.addColorStop(1, 'rgba(90,170,255,0)');
      g.fillStyle = q;
      g.fillRect(-30, -48 - bo, 36, 36);
      for (let j = 0; j < 3; j++) {
        const a = tk * 1.3 + j * 2.1;
        g.fillStyle = 'rgba(200,245,255,.8)';
        g.fillRect(Math.round(-13 + Math.cos(a) * 7), Math.round(-31 - bo + Math.sin(a) * 4), 1, 1);
      }
    });
    const by = -24 - bo + Math.sin(tk * 2) * 2;
    g.fillStyle = '#120e18';
    g.fillRect(8, by - 1, 12, 10);
    g.fillStyle = '#8a2f3f';
    g.fillRect(9, by, 10, 8);
    g.fillStyle = '#e8dcc0';
    g.fillRect(10, by + 1, 8, 6);
    g.fillStyle = '#c2a06b';
    g.fillRect(13, by + 1, 2, 6);
    add(() => { g.fillStyle = 'rgba(255,240,170,.5)'; g.fillRect(11, by - 3, 2, 1); g.fillRect(16, by - 5, 1, 1); });
    g.restore();
  }
  if (K == 'merchant' && talk)
    add(() => { const q = g.createRadialGradient(x + fc * 9, y - 12, 0, x + fc * 9, y - 12, 12); q.addColorStop(0, 'rgba(255,120,150,.5)'); q.addColorStop(1, 'rgba(255,120,150,0)'); g.fillStyle = q; g.fillRect(x + fc * 9 - 12, y - 24, 24, 24); });
}

function drawNPC(n, i) {
  if (n.dance)
    return;
  if (n.kind) {
    drawNPCx(n, i);
    return;
  }
  const x = Math.round(n.x), y = Math.round(n.y), tk = t + i * 1.7, w = n.n.includes('Brokk') ? 0 : n.n.includes('Sera') ? 1 : 2, fc = w == 0 ? 1 : (p.x < n.x - 4 ? -1 : 1), lx = (p.x - n.x) * fc > -4 ? 1 : 0, ly = p.y > n.y + 8 ? 1 : 0, talk = dlg && dlg.n === n, blink = (tk % 4.3) < .13, bo = Math.round((Math.sin(tk * 1.8) + 1) / 2 * .9), hv = w == 1 ? -3 + Math.sin(tk * 1.6) * 1.5 : 0, oc = w == 1 ? '#3c3658' : '#120e18', mx = (h, z, k) => { const v = parseInt(h.slice(1), 16); return 'rgb(' + [v >> 16, v >> 8 & 255, v & 255].map(c => Math.round(c + (z - c) * k)) + ')'; }, dk = c => mx(c, 0, .32), lt = c => mx(c, 255, .28), Q = [], r = (a, b, ww, h, c, o) => Q.push([a, b, ww, h, c, o !== 0]), fl = () => { g.fillStyle = oc; Q.forEach(q => q[5] && g.fillRect(q[0] - 1, q[1] - 1, q[2] + 2, q[3] + 2)); Q.forEach(q => { g.fillStyle = q[4]; g.fillRect(q[0], q[1], q[2], q[3]); }); Q.length = 0; }, add = f => { g.save(); g.globalCompositeOperation = 'lighter'; f(); g.restore(); }, glow = (gx, gy, rd, col, a) => add(() => { const q = g.createRadialGradient(gx, gy, 0, gx, gy, rd); q.addColorStop(0, 'rgba(' + col + ',' + a + ')'); q.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = q; g.fillRect(gx - rd, gy - rd, rd * 2, rd * 2); }), face = (hx, hy, sk, pc, bw) => {
    r(hx, hy, 8, 8, sk);
    r(hx + 5, hy + 1, 3, 7, dk(sk), 0);
    r(hx, hy + 1, 1, 5, lt(sk), 0);
    r(hx - 1, hy + 3, 1, 3, sk);
    r(hx + 8, hy + 3, 1, 3, dk(sk));
    r(hx + 4, hy + 5, 1, 1, dk(sk), 0);
    if (blink) {
      r(hx + 1, hy + 4, 2, 1, dk(sk), 0);
      r(hx + 5, hy + 4, 2, 1, dk(sk), 0);
    } else {
      r(hx + 1, hy + 3, 2, 2, '#f4eee8', 0);
      r(hx + 5, hy + 3, 2, 2, '#f4eee8', 0);
      r(hx + 1 + lx, hy + 3 + ly, 1, 1, pc, 0);
      r(hx + 5 + lx, hy + 3 + ly, 1, 1, pc, 0);
    }
    r(hx + 1, hy + 2, 3, 1, bw, 0);
    r(hx + 5, hy + 2, 3, 1, bw, 0);
    r(hx + 3, hy + 6, 2, talk && Math.floor(tk * 9) % 2 ? 2 : 1, talk ? '#5a2020' : dk(sk), 0);
  };
  g.save();
  g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.beginPath();
  g.ellipse(0, 8, (w == 1 ? 8 + hv * .4 : 9) + 2, 3, 0, 0, 7);
  g.fill();
  g.scale(fc, 1);
  if (w == 0) {
    const u = tk % 3.6;
    let th = -.12;
    if (talk)
      th = -.9 + Math.sin(tk * 5) * .25;
    else if (u > 1.2 && u < 1.9)
      th = -.12 - 2.4 * Math.sin((u - 1.2) / .7 * 1.5708);
    else if (u >= 1.9 && u < 2.05)
      th = -2.52 + 1.52 * ((u - 1.9) / .15);
    else if (u >= 2.05 && u < 2.6)
      th = -1 + .88 * ((u - 2.05) / .55);
    const hot = !talk && u > 2.05 && u < 2.6 ? 1 - (u - 2.05) / .55 : 0;
    r(14, 4, 12, 3, '#7a8392');
    r(24, 4, 3, 2, '#7a8392');
    r(16, 7, 8, 2, '#4a505c');
    r(14, 4, 12, 1, '#c4cedb', 0);
    fl();
    glow(20, 4, 16, '255,150,60', .12 + .28 * hot);
    r(-5, 2, 4, 6, '#3a2c22');
    r(1, 2, 4, 6, '#3a2c22');
    r(-6, 6, 5, 3, '#241a14');
    r(1, 6, 5, 3, '#241a14');
    fl();
    g.save();
    g.translate(0, -bo);
    r(-11, -6, 4, 4, '#8a5a3a');
    r(-11, -2, 4, 5, '#c98f6a');
    r(-7, -10, 14, 13, '#8a5a3a');
    r(-6, -7, 12, 12, '#5a3a22');
    r(-6, -7, 2, 12, '#7a5230', 0);
    r(2, -7, 4, 12, '#47301c', 0);
    r(-7, 0, 14, 2, '#2a1a10');
    r(-1, 0, 2, 2, '#d8b878', 0);
    r(-4, 2, 5, 3, '#47301c', 0);
    r(-3, -4, 3, 2, '#3d2a18', 0);
    r(-5, -10, 2, 4, '#3a2414', 0);
    r(3, -10, 2, 4, '#3a2414', 0);
    face(-4, -20, '#c98f6a', '#2a1a10', '#7e4620');
    r(-5, -22, 10, 4, '#a33b4c');
    r(-4, -22, 3, 1, '#c9556a', 0);
    r(2, -21, 3, 3, '#7e2a38', 0);
    r(-8 + Math.round(Math.sin(tk * 3)), -21, 3, 5, '#a33b4c');
    r(-3, -21, 3, 2, '#2a2a34');
    r(1, -21, 3, 2, '#2a2a34');
    r(-2, -21, 1, 1, '#8fd0e0', 0);
    r(2, -21, 1, 1, '#8fd0e0', 0);
    r(-5, -14, 10, 6, '#a8602c');
    r(-4, -8, 8, 3, '#a8602c');
    r(-3, -5, 6, 2, '#a8602c');
    r(-2, -3, 4, 1, '#a8602c');
    r(-4, -13, 2, 6, '#c8803c', 0);
    r(2, -12, 3, 7, '#7e4620', 0);
    r(-4, -15, 4, 2, '#c8803c');
    r(0, -15, 4, 2, '#c8803c');
    if (talk && Math.floor(tk * 9) % 2)
      r(-1, -12, 2, 2, '#2a1008', 0);
    fl();
    g.save();
    g.translate(7, -6);
    g.rotate(th);
    r(-2, 0, 4, 4, '#8a5a3a');
    r(-2, 4, 4, 3, '#c98f6a');
    r(-2, 6, 4, 3, '#d9a47e');
    r(-1, 7, 2, 9, '#6b4a2e');
    r(-4, 14, 8, 5, '#9aa3b0');
    r(-4, 14, 8, 1, '#d6dde8', 0);
    r(-4, 18, 8, 1, '#6b7280', 0);
    fl();
    g.restore();
    g.restore();
    if (hot > 0)
      add(() => {
        const k = (u - 2.05) / .55; for (let j = 0; j < 7; j++) {
          const a = -.2 - j * .42, d = k * (10 + j % 3 * 5);
          g.fillStyle = 'rgba(255,' + (190 - j * 12) + ',80,' + (1 - k) + ')';
          g.fillRect(Math.round(21 + Math.cos(a) * d), Math.round(3 + Math.sin(a) * d + k * k * 12), j % 3 ? 1 : 2, j % 3 ? 1 : 2);
        }
      });
  } else if (w == 1) {
    glow(0, 8, 30, '140,230,255', .2);
    g.translate(0, hv);
    for (let k = 0; k < 17; k++) {
      const s = Math.round(Math.sin(tk * 1.8 - k * .45) * 1.4 * k / 12);
      r(-6 + s, -19 + k, 12 + (k > 10 ? 2 : 0), 1, (k >> 1) & 1 ? '#c8a868' : n.hair);
    }
    [[-6, -7, 12], [-7, -4, 14], [-8, -1, 16], [-9, 2, 18], [-10, 5, 20]].forEach(([a, b, ww], j) => { const s = j > 2 ? Math.round(Math.sin(tk * 2 + j) * .7) : 0; r(a + s, b, ww, 3, '#f2eef8'); });
    r(4, -4, 4, 10, '#d6d0e4', 0);
    r(-3, -2, 1, 9, '#d6d0e4', 0);
    r(0, -1, 1, 9, '#d6d0e4', 0);
    r(-10, 8, 20, 1, '#c2a06b');
    r(-6, -5, 12, 2, '#c2a06b', 0);
    r(-8, -11, 16, 5, '#e8e4f0');
    r(-8, -7, 16, 1, '#c2a06b', 0);
    r(-7, -11, 4, 2, '#fff', 0);
    r(4, -10, 4, 4, '#cfc8dc', 0);
    r(-1, -5, 2, 2, '#8fe8ff', 0);
    r(-12, -26, 2, 36, '#8a6a3a');
    r(-12, -26, 1, 36, '#b08a4f', 0);
    r(-14, -27, 6, 2, '#c2a06b');
    r(-13, -33, 4, 6, '#8fe8ff');
    r(-12, -32, 1, 3, '#fff', 0);
    r(-11, -9, 5, 6, '#f2eef8');
    r(-12, -4, 3, 3, '#f0cdb8');
    r(5, -9, 4, 5, '#f2eef8');
    r(4, -5, 3, 3, '#f0cdb8');
    face(-4, -20, '#f0cdb8', '#38b8d8', '#b8985a');
    r(-5, -22, 10, 4, n.hair);
    r(-5, -21, 2, 10, n.hair);
    r(3, -21, 2, 10, n.hair);
    r(-4, -20, 5, 2, n.hair);
    r(-3, -22, 2, 2, '#f8dfaa', 0);
    r(-5, -20, 10, 1, '#c2a06b', 0);
    r(-1, -21, 2, 2, '#8fe8ff', 0);
    fl();
    glow(-11, -30, 12 + 2 * Math.sin(tk * 3), '140,240,255', .55);
    add(() => {
      g.strokeStyle = 'rgba(255,235,170,.55)';
      g.lineWidth = 1;
      g.beginPath();
      g.ellipse(0, -27, 7, 2, 0, 0, 7);
      g.stroke();
      for (let j = 0; j < 4; j++) {
        const a = tk * 1.1 + j * 1.57;
        g.fillStyle = 'rgba(191,244,255,' + (.5 + .4 * Math.sin(a * 2)) + ')';
        g.fillRect(Math.round(Math.cos(a) * 14), Math.round(-8 + Math.sin(a) * 5 - j * 2), 2, 2);
      }
    });
  } else {
    for (let k = 0; k < 17; k++) {
      const s = Math.round(Math.sin(tk * 1.4 - k * .3) * k / 8);
      r(-9 - (k >> 3) + s, -10 + k, 18 + 2 * (k >> 3), 1, k & 2 ? '#8c2f3f' : '#7a2636');
    }
    r(-5, 0, 4, 8, '#6a6f7c');
    r(1, 0, 4, 8, '#6a6f7c');
    r(-6, 6, 5, 3, '#4a4e58');
    r(1, 6, 5, 3, '#4a4e58');
    r(-5, 1, 4, 2, '#9aa0ae', 0);
    r(1, 1, 4, 2, '#9aa0ae', 0);
    r(-4, -4, 8, 12, '#3f4d90');
    r(-1, -2, 2, 9, '#d8b878', 0);
    r(-3, 0, 6, 2, '#d8b878', 0);
    r(-4, 7, 8, 1, '#d8b878', 0);
    fl();
    g.save();
    g.translate(0, -bo);
    r(-7, -10, 14, 9, '#8a909e');
    r(-6, -10, 3, 8, '#bcc2cf', 0);
    r(4, -10, 3, 9, '#5a5f6c', 0);
    r(-1, -9, 1, 6, '#6a6f7c', 0);
    r(-7, -2, 14, 2, '#2a1a10');
    r(-1, -2, 2, 2, '#d8b878', 0);
    r(-5, -11, 10, 2, '#9aa0ae');
    r(-10, -11, 5, 5, '#9aa0ae');
    r(5, -11, 5, 5, '#9aa0ae');
    r(-10, -11, 5, 1, '#d8dde8', 0);
    r(5, -11, 5, 1, '#d8dde8', 0);
    r(-10, -7, 5, 1, '#c2a06b', 0);
    r(5, -7, 5, 1, '#c2a06b', 0);
    r(-16, -8, 9, 8, '#4b5aa0');
    r(-15, 0, 7, 4, '#4b5aa0');
    r(-14, 4, 5, 2, '#4b5aa0');
    r(-13, 6, 3, 1, '#4b5aa0');
    r(-16, -8, 9, 1, '#d8b878', 0);
    r(-16, -8, 1, 8, '#d8b878', 0);
    r(-12, -6, 2, 7, '#d8b878', 0);
    r(-14, -3, 6, 2, '#d8b878', 0);
    r(-9, 0, 4, 4, '#9aa0ae');
    r(-9, 0, 4, 1, '#d8dde8', 0);
    face(-4, -20, '#d9a98c', '#5a7a9a', '#e0e0ea');
    r(-5, -22, 10, 4, '#c8c8d4');
    r(-5, -20, 2, 5, '#c8c8d4');
    r(3, -20, 2, 4, '#c8c8d4');
    r(-3, -22, 3, 1, '#f0f0f8', 0);
    r(1, -19, 1, 4, '#b87a6a', 0);
    r(-4, -13, 8, 4, '#e6e6ee');
    r(-3, -9, 6, 2, '#e6e6ee');
    r(1, -12, 3, 3, '#b8b8c8', 0);
    r(-3, -15, 3, 2, '#e6e6ee');
    r(0, -15, 3, 2, '#e6e6ee');
    r(8, 0, 2, 9, '#cfd6e2');
    r(8, 0, 1, 9, '#fff', 0);
    r(5, -2, 8, 2, '#c2a06b');
    r(8, -6, 2, 4, '#5a3a22');
    r(8, -8, 2, 2, '#c2a06b');
    r(6, -6, 3, 3, '#8a909e');
    r(7, -6, 4, 3, '#bcc2cf');
    fl();
    g.restore();
  }
  fl();
  g.restore();
}

function toLobby() { WW = 1218; WH = 400; lobby = true; trn = 0; room = 0; walls = WL; TO = TOL; BR = BRL; BG = BGL; doorOn = 0; doorO = 0; clr = 0; pr = []; dr = []; gh = []; dlg = null; fade = .7; msg('Lobby — Zona Aman. Tidak ada musuh yang menyerang di sini.'); }

function goLobby() { toLobby(); p.x = 320; p.y = 320; p.vx = p.vy = 0; p.dod = 0; spawn(); SFX.door(); }

function enterDungeon() { WW = DW; WH = DH; lobby = false; room = 0; walls = W0; TO = TO0; BR = BR0; BG = BG0; wave = 1; doorOn = 0; doorO = 0; clr = 0; pr = []; dr = []; gh = []; dlg = null; p.x = 60; p.y = DY; p.vx = p.vy = 0; p.dod = 0; fade = .7; spawn(); SFX.door(); msg('Memasuki Dungeon — Gelombang 1 dimulai! [B] kembali ke lobby'); }

function backTick() {
  if (es.some(e => e.sw <= 0 && dist(e, p) < 140)) {
    msg('Musuh terlalu dekat untuk kembali ke lobby!');
    return;
  } goLobby();
}

function lobbyTick(dt) {
  if (!lobby)
    return;
  if (!trn && p.x > 660) {
    trn = 1;
    msg('Ruang Pelatihan — serang manekin untuk uji DPS. Pintu kiri = kembali ke lobby.');
  } else if (trn && p.x < 620) {
    trn = 0;
    msg('Lobby — Zona Aman.');
  }
  if (p.y < 34 && Math.abs(p.x - 320) < 30) {
    openDungeonSelect();
    return;
  }
  if (R() < dt * 7)
    dp.push({
      k: 'p', x: 62 + R() * 30, y: 60 + R() * 8, vx: (R() - .5) * 30, vy: -30 - R() * 30, life: .6, max: .6, s: 1.5, c: R() < .5 ? '#ffb050' : '#ff7a2a'
    });
  if (dlg && dist(dlg.n, p) > 70)
    dlg = null;
  if (P.KeyG) {
    if (dlg && dlg.c < dlg.len) {
      dlg.c = dlg.len;
      try {
        SFX.blip(520);
      } catch (e) { }
    } else if (dlg) {
      dlg.i++;
      if (dlg.i >= dlg.n.lines.length) {
        const a = dlg.n.act;
        dlg = null;
        if (a)
          a();
      } else
        SFX.point();
    } else {
      const n = NP.concat(TN).find(n => dist(n, p) < 36);
      if (n) {
        dlg = { n, i: 0 };
        SFX.pickup();
      }
    }
  }
}

function coupleFx() {
  const A = NP.find(n => n.mate === 'Finza'), F = NP.find(n => n.mate === 'Abeth');
  if (!A || !F)
    return;
  const CX = 530, CY = 340, fy = CY + 12, PI = Math.PI, wx = Math.sin(t * .9) * 6, wy = Math.cos(t * .9) * 2.5, k6 = t % 6, u = k6 < 1.2 ? k6 / 1.2 : -1, tw = u >= 0, s = tw ? Math.sin(u * PI) : 0, sxA = tw ? Math.cos(u * PI * 2) : 1, dxF = 6 * s, fX = CX - 12 + dxF + wx, aX = CX + 12 + wx, yy = CY + wy;
  F.x = fX;
  F.y = yy;
  A.x = aX;
  A.y = yy;
  // ---------- lantai dansa ----------
  g.save();
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.beginPath();
  g.ellipse(CX, fy + 3, 60, 26, 0, 0, 7);
  g.fill();
  g.fillStyle = '#2b2440';
  g.beginPath();
  g.ellipse(CX, fy, 58, 24, 0, 0, 7);
  g.fill();
  g.save();
  g.beginPath();
  g.ellipse(CX, fy, 58, 24, 0, 0, 7);
  g.clip();
  for (let i = -8; i < 8; i++)
    for (let j = -4; j < 4; j++) {
      g.fillStyle = (i + j) & 1 ? 'rgba(216,184,120,.16)' : 'rgba(255,120,160,.07)';
      g.fillRect(CX + i * 8, fy + j * 8, 8, 8);
    }
  g.restore();
  g.strokeStyle = '#d8b878';
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(CX, fy, 58, 24, 0, 0, 7);
  g.stroke();
  g.lineWidth = 1;
  g.strokeStyle = 'rgba(216,184,120,.55)';
  g.beginPath();
  g.ellipse(CX, fy, 44, 18, 0, 0, 7);
  g.stroke();
  g.restore();
  g.save();
  g.globalCompositeOperation = 'lighter';
  const q = g.createRadialGradient(CX, fy, 0, CX, fy, 66);
  q.addColorStop(0, 'rgba(255,130,170,' + (.2 + .07 * Math.sin(t * 2.4)) + ')');
  q.addColorStop(1, 'rgba(255,130,170,0)');
  g.fillStyle = q;
  g.fillRect(CX - 66, fy - 66, 132, 132);
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * PI * 2, f = .5 + .5 * Math.sin(t * 3 + i * 1.7);
    g.fillStyle = (i % 2 ? 'rgba(255,217,160,' : 'rgba(255,154,192,') + (.35 + .55 * f) + ')';
    g.fillRect(Math.round(CX + Math.cos(a) * 58) - 1, Math.round(fy + Math.sin(a) * 24) - 1, 3, 3);
  }
  g.restore();
  // ---------- penari ----------
  const dancer = (kind, x, y, sign, o) => {
    const fin = kind === 'f', sk = fin ? '#d9a07a' : '#e8b898', hair = fin ? '#2a1a14' : '#6b3a22', HL = 'rgba(255,255,255,.16)', SH = 'rgba(0,0,0,.25)', Q = [], r = (a, b, w, h, c, ol) => Q.push([a, b, w, h, c, ol !== 0]), fl = () => { g.fillStyle = '#120e18'; Q.forEach(z => z[5] && g.fillRect(z[0] - 1, z[1] - 1, z[2] + 2, z[3] + 2)); Q.forEach(z => { g.fillStyle = z[4]; g.fillRect(z[0], z[1], z[2], z[3]); }); Q.length = 0; }, ln = (x0, y0, x1, y1, w, c) => {
      const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++)
        r(Math.round(x0 + (x1 - x0) * i / n) - (w >> 1), Math.round(y0 + (y1 - y0) * i / n) - (w >> 1), w, w, c);
    }, talk = dlg && dlg.n === (fin ? F : A), blink = (t % 4.1) < .13, sxx = Math.abs(o.sx) < .14 ? (o.sx < 0 ? -.14 : .14) : o.sx;
    if (o.waist) {
      g.save();
      g.translate(Math.round(x + o.L), Math.round(y - o.bo));
      const ex = Math.round(16 - 8 * o.s), ey = Math.round(-2 + 2 * o.s);
      ln(5, -4, ex, ey, 3, '#22304a');
      r(ex - 2, ey - 1, 1, 3, '#d8b878', 0);
      r(ex - 1, ey - 1, 3, 3, '#f4eee8');
      fl();
      g.restore();
      return;
    }
    g.save();
    g.translate(Math.round(x), Math.round(y));
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.beginPath();
    g.ellipse(0, 8, fin ? 11 : 14, 3, 0, 0, 7);
    g.fill();
    g.scale(sign * sxx, 1);
    if (fin) {
      const lf = Math.round(o.lf), rf = Math.round(o.rf), ts = Math.round(Math.sin(t * 3 + 1) * 1.5);
      r(-10 + ts, -1, 5, 9, '#22304a');
      r(-10 + ts, 7, 5, 1, '#d8b878', 0);
      r(-5, 3, 4, 5 - lf, '#1c1c2a');
      r(1, 3, 4, 5 - rf, '#1c1c2a');
      r(-3, 3, 1, 5 - lf, '#3a3a52', 0);
      r(3, 3, 1, 5 - rf, '#3a3a52', 0);
      r(-6, 7 - lf, 5, 2, '#0c0c12');
      r(1, 7 - rf, 5, 2, '#0c0c12');
      r(-6, 7 - lf, 3, 1, '#5a5a74', 0);
      r(1, 7 - rf, 3, 1, '#5a5a74', 0);
    } else {
      const fa = o.flare, sw = o.sway, W = i => 7 + i * 1.1 + fa * i / 8;
      for (let i = 0; i < 9; i++) {
        const hw = W(i), sh = sw * i / 8;
        r(Math.round(-hw + sh), 1 + i, Math.round(hw * 2), 1, i % 4 === 3 ? '#a8305a' : '#b83a63');
      }
      for (let i = 1; i < 9; i++) {
        const hw = W(i), sh = sw * i / 8;
        [-5, -2, 1, 4].forEach((k, j) => r(Math.round(k * hw / 7 + sh), 1 + i, 1, 1, j % 2 ? '#8e2a4c' : '#d8587f', 0));
      }
      {
        const hw = W(7), sh = sw * 7 / 8;
        r(Math.round(-hw + sh), 7, Math.round(hw * 2), 1, '#d8b878', 0);
      }
      {
        const hw = W(9), sh = sw * 9 / 8, x0 = Math.round(-hw + sh), w = Math.round(hw * 2);
        r(x0, 9, w, 1, '#f4e2c8');
        for (let k = 1; k < w; k += 3)
          r(x0 + k, 9, 1, 1, '#c8b898', 0);
      }
      [[-6, 4], [2, 5], [-1, 7]].forEach(([a, b]) => { r(a, b, 2, 2, '#e8788f', 0); r(a, b, 1, 1, '#ffc0d4', 0); });
    }
    fl();
    g.restore();
    // ----- badan atas -----
    g.save();
    g.translate(Math.round(x + o.L), Math.round(y - o.bo));
    g.scale(sign * sxx, 1);
    if (fin) {
      ln(-6, -8, -10, -2, 3, '#1a2438');
      r(-11, -3, 3, 3, '#f4eee8');
      fl();
      r(-7, -10, 14, 15, '#22304a');
      r(4, -9, 3, 13, SH, 0);
      r(-6, -9, 2, 10, HL, 0);
      r(-2, -10, 5, 11, '#f4eee8', 0);
      r(-4, -10, 2, 9, '#1a2438', 0);
      r(3, -10, 2, 9, '#1a2438', 0);
      r(-4, -10, 1, 9, '#d8b878', 0);
      r(4, -10, 1, 9, '#d8b878', 0);
      r(-2, -3, 5, 6, '#8a1f35', 0);
      r(0, -2, 1, 1, '#f4e2a8', 0);
      r(0, 0, 1, 1, '#f4e2a8', 0);
      r(-7, 2, 14, 2, '#14121f');
      r(-1, 2, 2, 2, '#f0c860', 0);
      r(-7, 4, 14, 1, '#d8b878', 0);
      r(-3, -10, 2, 3, '#c8283e', 0);
      r(2, -10, 2, 3, '#c8283e', 0);
      r(-1, -10, 2, 2, '#9a1f35', 0);
      r(3, -7, 2, 2, '#ff5c8a', 0);
      r(-9, -11, 4, 2, '#d8b878');
      r(5, -11, 4, 2, '#d8b878');
      fl();
      const hx = Math.round(o.hx), hy = Math.round(o.hy);
      ln(5, -9, hx, hy, 3, '#22304a');
      r(hx - 2, hy - 1, 1, 3, '#d8b878', 0);
      r(hx - 1, hy - 1, 3, 3, '#f4eee8');
      fl();
    } else {
      r(-6, -10, 12, 13, '#c8456e');
      r(3, -9, 3, 11, SH, 0);
      r(-5, -9, 2, 9, HL, 0);
      r(-6, -10, 12, 1, '#f4e2c8', 0);
      r(-4, -10, 8, 2, sk, 0);
      r(0, -7, 1, 8, '#f4e2a8', 0);
      r(-1, -6, 3, 1, '#f4e2a8', 0);
      r(-1, -3, 3, 1, '#f4e2a8', 0);
      [[-3, -9], [-1, -8], [1, -8], [3, -9]].forEach(([a, b]) => r(a, b, 1, 1, '#fff', 0));
      r(-6, 0, 12, 2, '#d8b878');
      r(-1, 0, 2, 2, '#f4e2a8', 0);
      r(-10, -2, 5, 5, '#d8b878');
      r(-10, -2, 5, 1, '#f0c860', 0);
      r(-12 + Math.round(Math.sin(t * 4)), 2, 3, 5, '#d8b878');
      r(-9, -10, 4, 4, '#f4e2e8');
      r(5, -10, 4, 4, '#f4e2e8');
      r(-9, -7, 4, 1, '#c8456e', 0);
      r(5, -7, 4, 1, '#c8456e', 0);
      fl();
      const hx = Math.round(o.hx), hy = Math.round(o.hy), ex = Math.round(16 - 8 * o.s), ey = Math.round(-7 + 6 * o.s);
      ln(5, -8, hx, hy, 3, '#f4e2e8');
      r(hx - 2, hy - 1, 1, 3, '#d8b878', 0);
      r(hx - 1, hy - 1, 3, 3, '#f4eee8');
      ln(5, -6, ex, ey, 3, '#f4e2e8');
      r(ex - 2, ey - 1, 1, 3, '#d8b878', 0);
      r(ex - 1, ey - 1, 3, 3, '#f4eee8');
      fl();
    }
    r(-4, -20, 8, 8, sk);
    r(2, -19, 2, 7, SH, 0);
    r(-4, -19, 1, 5, HL, 0);
    r(-5, -17, 1, 2, sk, 0);
    if (fin) {
      r(-5, -23, 10, 4, hair);
      r(-5, -21, 2, 6, hair);
      r(3, -21, 2, 3, hair);
      r(-3, -23, 5, 1, '#5a3a2a', 0);
      r(-9, -21, 4, 7, hair);
      r(-9, -21, 4, 1, '#5a3a2a', 0);
      r(-7, -19, 2, 2, '#d8b878');
    } else {
      r(-5, -23, 10, 4, hair);
      r(-5, -21, 2, 8, hair);
      r(4, -21, 1, 6, hair);
      r(-3, -27, 6, 4, hair);
      r(-3, -27, 6, 1, '#8a5a3a', 0);
      r(-1, -26, 1, 2, '#8a5a3a', 0);
      r(-4, -24, 8, 1, '#f0c860');
      r(0, -25, 1, 1, '#8fe8ff', 0);
      r(3, -27, 3, 3, '#e04b6b');
      r(4, -26, 1, 1, '#ffd34d', 0);
      r(-5, -14, 1, 2, '#8fe8ff', 0);
      r(4, -14, 1, 2, '#8fe8ff', 0);
    }
    if (blink) {
      r(-3, -16, 2, 1, '#3a2418', 0);
      r(1, -16, 2, 1, '#3a2418', 0);
    } else {
      r(-3, -17, 2, 2, '#f4eee8', 0);
      r(1, -17, 2, 2, '#f4eee8', 0);
      r(-2, -17, 1, 2, '#2a1a14', 0);
      r(2, -17, 1, 2, '#2a1a14', 0);
    }
    r(-3, -19, 2, 1, fin ? hair : '#4a2a18', 0);
    r(1, -19, 2, 1, fin ? hair : '#4a2a18', 0);
    if (!fin) {
      r(-4, -17, 1, 1, '#2a1a14', 0);
      r(3, -17, 1, 1, '#2a1a14', 0);
    }
    r(-4, -15, 1, 1, 'rgba(255,120,130,.6)', 0);
    r(3, -15, 1, 1, 'rgba(255,120,130,.6)', 0);
    if (talk && Math.floor(t * 9) % 2)
      r(-1, -14, 2, 2, '#5a2020', 0);
    else {
      r(-1, -14, 2, 1, fin ? '#a86a5a' : '#c8283e', 0);
      r(-2, -15, 1, 1, fin ? '#a86a5a' : '#c8283e', 0);
      r(1, -15, 1, 1, fin ? '#a86a5a' : '#c8283e', 0);
    }
    fl();
    g.restore();
  };
  const bo0 = Math.abs(Math.sin(t * 3)), L0 = Math.sin(t * 1.5) * 1.2;
  const oF = {
    sx: 1, bo: bo0 * 1.5, L: L0, lf: Math.max(0, Math.sin(t * 3)) * 2.5, rf: Math.max(0, -Math.sin(t * 3)) * 2.5, hx: 12 + 6 * s, hy: -9 - 17 * s, s
  }, oA = {
    sx: sxA, bo: Math.abs(Math.sin(t * 3 + .4)) * 1.5 + s * 1.5, L: L0, sway: Math.sin(t * 3 + 2) * 2 + s * 2, flare: .8 * Math.sin(t * 3) + 3.5 * s, hx: 12 * (1 - s), hy: -9 - 17 * s, s
  };
  dancer('f', fX, yy, 1, oF);
  dancer('a', aX, yy, -1, oA);
  dancer('f', fX, yy, 1, Object.assign({ waist: 1 }, oF));
  // ---------- nada & hati & kilau ----------
  const note = (nx, ny, c, a) => { g.save(); g.globalAlpha = a; g.fillStyle = '#120e18'; g.fillRect(nx - 1, ny - 1, 5, 4); g.fillRect(nx + 1, ny - 6, 3, 8); g.fillStyle = c; g.fillRect(nx, ny, 3, 2); g.fillRect(nx + 2, ny - 5, 1, 6); g.fillRect(nx + 3, ny - 5, 2, 1); g.fillRect(nx + 4, ny - 4, 1, 1); g.restore(); };
  for (let i = 0; i < 3; i++) {
    const k = (t * .28 + i / 3) % 1;
    note(Math.round(CX + (i - 1) * 34 + Math.sin(t * 2 + i) * 6), Math.round(fy - 8 - k * 52), ['#ffe28a', '#ff9ac0', '#8fe8ff'][i], Math.sin(k * PI));
  }
  const heart = (hx, hy, z, a) => {
    g.save();
    g.globalAlpha = a;
    g.translate(Math.round(hx), Math.round(hy));
    g.scale(z, z);
    const H = [[-3, -3, 3, 2], [1, -3, 3, 2], [-4, -2, 8, 3], [-3, 1, 6, 1], [-2, 2, 4, 1], [-1, 3, 2, 1]];
    g.fillStyle = '#120e18';
    H.forEach(z => g.fillRect(z[0] - 1, z[1] - 1, z[2] + 2, z[3] + 2));
    g.fillStyle = '#ff5c8a';
    H.forEach(z => g.fillRect(z[0], z[1], z[2], z[3]));
    g.fillStyle = '#ffc0d4';
    g.fillRect(-3, -3, 1, 1);
    g.restore();
  };
  const mx = CX + wx, my = yy - 44;
  heart(mx, my + Math.sin(t * 2.2) * 1.5, 1, 1);
  for (let i = 0; i < 3; i++) {
    const k = (t * .35 + i / 3) % 1;
    heart(mx + Math.sin(k * 6 + i * 2) * 9, my + 10 - k * 18, .6, 1 - k);
  }
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 8; i++) {
    const k = (t * .4 + i / 8) % 1, sx = CX + Math.cos(i * 2.4) * 44, sy = fy - 6 - k * 40, a = Math.sin(k * PI) * (.5 + .5 * Math.sin(t * 8 + i));
    if (a < .05)
      continue;
    g.fillStyle = 'rgba(255,240,200,' + a + ')';
    g.fillRect(Math.round(sx) - 2, Math.round(sy), 5, 1);
    g.fillRect(Math.round(sx), Math.round(sy) - 2, 1, 5);
  }
  g.restore();
}

function lobbyDraw() {
  g.save();
  g.globalCompositeOperation = 'lighter';
  let q = g.createRadialGradient(320, 26, 0, 320, 26, 70);
  q.addColorStop(0, 'rgba(170,90,255,' + (.3 + .12 * Math.sin(t * 2.2)) + ')');
  q.addColorStop(1, 'rgba(90,30,180,0)');
  g.fillStyle = q;
  g.fillRect(250, 0, 140, 100);
  q = g.createRadialGradient(80, 58, 0, 80, 58, 60);
  q.addColorStop(0, 'rgba(255,130,40,' + (.4 + .12 * Math.sin(t * 9)) + ')');
  q.addColorStop(1, 'rgba(255,100,20,0)');
  g.fillStyle = q;
  g.fillRect(20, 0, 120, 120);
  q = g.createRadialGradient(564, 56, 0, 564, 56, 64);
  q.addColorStop(0, 'rgba(110,220,255,' + (.3 + .08 * Math.sin(t * 3)) + ')');
  q.addColorStop(1, 'rgba(60,160,255,0)');
  g.fillStyle = q;
  g.fillRect(500, 0, 128, 124);
  g.restore();
  g.save();
  g.strokeStyle = 'rgba(180,240,255,.6)';
  for (let i = 0; i < 2; i++) {
    const k = (t * .5 + i * .5) % 1;
    g.globalAlpha = 1 - k;
    g.beginPath();
    g.ellipse(564, 56, 6 + k * 18, 2 + k * 6, 0, 0, 7);
    g.stroke();
  }
  g.restore();
  fountainFx();
  ambientFx();
  NP.forEach((n, i) => {
    const b = talkBob(n); if (b) {
      g.save();
      g.translate(0, -b);
      drawNPC(n, i);
      g.restore();
    } else
      drawNPC(n, i);
  });
  coupleFx();
  g.save();
  g.font = 'bold 8px monospace';
  g.textAlign = 'center';
  g.fillStyle = '#e6d2ff';
  g.globalAlpha = .7 + .3 * Math.sin(t * 4);
  g.fillText('▲ DUNGEON', 320, Math.round(70 + Math.sin(t * 3) * 1.5));
  g.restore();
  g.font = '8px monospace';
  NP.forEach(n => {
    const d = dist(n, p); if (d < 90) {
      txt(n.n.split(',')[0], n.x + (n.lx || 0), n.y - 26 - (n.ly || 0), '#ffe9a8', 'center');
      if (d < 36 && !dlg)
        txt('[G] Bicara', n.x + (n.lx || 0), n.y - 36 - (n.ly || 0), '#fff', 'center');
    }
  });
  if (pts > 0) {
    const o = NP.find(n => n.kind == 'elder');
    if (o)
      txt('✦ ' + pts + ' poin atribut', o.x, o.y - 48 - Math.round(Math.sin(t * 3) * 2), '#ffd34d', 'center');
  }
  g.save();
  g.font = 'bold 8px monospace';
  g.textAlign = 'center';
  g.fillStyle = '#ffe0a0';
  g.globalAlpha = .7 + .3 * Math.sin(t * 4);
  g.fillText('PELATIHAN ▶', Math.round(588 + Math.sin(t * 3) * 1.5), 156);
  g.restore();
}

// ===== Dialog & gelembung bicara: gaya pixel + animasi ketik =====
function easeBack(x) { x = Math.min(1, Math.max(0, x)); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }

function dlgHash(s) {
  let h = 0; s = String(s || ''); for (let i = 0; i < s.length; i++)
    h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h);
}

function pxBox(x, y, w, h, fill, line, k) {
  x = Math.round(x);
  y = Math.round(y);
  w = Math.round(w);
  h = Math.round(h);
  k = k || 2;
  const sh = (ins, c) => { g.fillStyle = c; g.fillRect(x + ins + k, y + ins, w - 2 * ins - 2 * k, h - 2 * ins); g.fillRect(x + ins, y + ins + k, w - 2 * ins, h - 2 * ins - 2 * k); g.fillRect(x + ins + 1, y + ins + 1, w - 2 * ins - 2, h - 2 * ins - 2); };
  sh(0, line);
  sh(1, fill);
}

function talkBob(n) { return (dlg && dlg.n === n && dlg.c < dlg.len) ? (Math.floor(performance.now() / 110) % 2) : 0; }
var DLH = { now: 0, last: null, ghost: null };

function dlgPrep(d) {
  const full = TL(d.n.lines[d.i] || '');
  if (d.src === full)
    return;
  g.save();
  g.font = '9px monospace';
  const cw = g.measureText('M').width;
  g.restore();
  const mc = Math.max(20, Math.floor(450 / cw)), ls = [];
  let cur = '';
  full.split(' ').forEach(wd => {
    if (cur && (cur + ' ' + wd).length > mc) {
      ls.push(cur);
      cur = wd;
    } else
      cur = cur ? cur + ' ' + wd : wd;
  });
  if (cur)
    ls.push(cur);
  d.src = full;
  d.ls = ls.slice(0, 3);
  d.flat = d.ls.join(' ');
  d.len = d.flat.length;
  d.c = 0;
  d.cw = cw;
  d.wait = d.age < .2 ? .2 - d.age : .08;
}

function drawDlgBox(d, ek, al) {
  const n = d.n, X = 50, Y = 278, Wd = 540, Ht = 62, now = performance.now(), nm = TL(n.n || ''), ci = nm.indexOf(','), name = (ci < 0 ? nm : nm.slice(0, ci)).trim(), title = ci < 0 ? '' : nm.slice(ci + 1).trim(), hue = dlgHash(n.n) % 360;
  g.save();
  g.globalAlpha = Math.max(0, Math.min(1, al));
  g.translate(0, Math.round((1 - ek) * 18));
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.fillRect(X + 3, Y + 3, Wd, Ht);
  const gr = g.createLinearGradient(0, Y, 0, Y + Ht);
  gr.addColorStop(0, '#241b3d');
  gr.addColorStop(1, '#0d0a18');
  pxBox(X, Y, Wd, Ht, gr, '#c2a06b', 3);
  g.strokeStyle = 'rgba(194,160,107,.28)';
  g.lineWidth = 1;
  g.strokeRect(X + 4.5, Y + 4.5, Wd - 9, Ht - 9);
  // papan nama
  g.font = 'bold 10px monospace';
  const tw = Math.ceil(g.measureText(name).width) + 32, tx = X + 8, ty = Y - 15;
  const gt = g.createLinearGradient(0, ty, 0, ty + 20);
  gt.addColorStop(0, '#f3d98b');
  gt.addColorStop(1, '#b8924a');
  pxBox(tx, ty, tw, 20, gt, '#5a4320', 2);
  pxBox(tx + 5, ty + 4, 12, 12, 'hsl(' + hue + ',55%,45%)', '#2a1d0a', 2);
  g.font = 'bold 8px monospace';
  txt((name[0] || '?').toUpperCase(), tx + 11, ty + 13, '#fff', 'center');
  g.font = 'bold 10px monospace';
  txt(name, tx + 22, ty + 14, '#2b1d08');
  if (title) {
    g.font = 'italic 8px monospace';
    txt(title, tx + tw + 8 + 1, ty + 14 + 1, 'rgba(0,0,0,.7)');
    txt(title, tx + tw + 8, ty + 14, '#ffe9a8');
  }
  // teks (efek ketik)
  g.font = '9px monospace';
  g.textAlign = 'left';
  const cw = d.cw, flash = d.c < d.len && now - (d.lastAt || 0) < 90;
  let off = 0;
  d.ls.forEach((l, i) => {
    const k = Math.max(0, Math.min(l.length, d.c - off)), y = Y + 24 + i * 11, fl = flash && k > 0 && (d.c - off) === k && l[k - 1] !== ' ';
    off += l.length + 1;
    if (k <= 0)
      return;
    const part = l.slice(0, fl ? k - 1 : k);
    g.fillStyle = 'rgba(0,0,0,.55)';
    g.fillText(part, X + 13, y + 1);
    g.fillStyle = '#e8e4f0';
    g.fillText(part, X + 12, y);
    if (fl) {
      const fx = X + 12 + (k - 1) * cw;
      g.fillStyle = 'rgba(0,0,0,.55)';
      g.fillText(l[k - 1], fx + 1, y);
      g.fillStyle = '#fff3c4';
      g.fillText(l[k - 1], fx, y - 1);
    }
  });
  // petunjuk
  g.font = '8px monospace';
  if (d.c >= d.len) {
    txt('[G] ' + (d.i < n.lines.length - 1 ? 'lanjut' : 'tutup'), X + Wd - 26, Y + Ht - 7, '#9a97b8', 'right');
    const by = Math.round(Math.sin(now / 160) * 1.6);
    g.fillStyle = '#ffd34d';
    [[0, 7], [1, 5], [2, 3], [3, 1]].forEach(([r, w]) => g.fillRect(X + Wd - 20 + ((7 - w) >> 1), Y + Ht - 16 + r + by, w, 1));
  } else
    txt('[G] \u25b6\u25b6', X + Wd - 12, Y + Ht - 7, '#6f6c8f', 'right');
  g.restore();
}
var UIERR = 0;

function lobbyHud() {
  if (UIERR > 3)
    return; g.save(); try {
      lobbyHudNew();
    } catch (e) {
      UIERR++;
      console.error('lobbyHud', e);
      dlg = null;
    } g.restore();
}

function lobbyHudNew() {
  const now = performance.now(), dt = Math.min(.05, Math.max(0, (now - DLH.now) / 1000));
  DLH.now = now;
  if (!dlg) {
    if (DLH.last) {
      DLH.ghost = { d: DLH.last, t0: now };
      DLH.last = null;
    }
    if (DLH.ghost) {
      const k = (now - DLH.ghost.t0) / 160;
      if (k >= 1)
        DLH.ghost = null;
      else
        drawDlgBox(DLH.ghost.d, 1 - k, 1 - k);
    }
    return;
  }
  const d = dlg;
  DLH.last = d;
  DLH.ghost = null;
  if (d.age === undefined)
    d.age = 0;
  d.age += dt;
  dlgPrep(d);
  if (d.c < d.len) {
    d.wait -= dt;
    while (d.wait <= 0 && d.c < d.len) {
      const ch = d.flat[d.c], nx = d.flat[d.c + 1];
      d.c++;
      d.lastAt = now;
      d.wait += 1 / 55 + ((ch == '.' || ch == '!' || ch == '?' || ch == '\u2026') && (nx === undefined || nx === ' ') ? .24 : ((ch == ',' || ch == ';' || ch == ':') && nx === ' ' ? .11 : 0));
      if (ch !== ' ' && (d.c & 1)) {
        try {
          SFX.blip(250 + (dlgHash(d.n.n) % 7) * 38 + Math.random() * 18);
        } catch (e) { }
      }
    }
  }
  drawDlgBox(d, easeBack(d.age / .24), Math.min(1, d.age * 8));
}

// ===== Dekorasi & air mancur lobby =====
const bush = (b, x, y) => {
  b.fillStyle = 'rgba(0,0,0,.35)';
  b.beginPath();
  b.ellipse(x, y + 7, 13, 4, 0, 0, 7);
  b.fill();
  [['#1f4a34', 0, 0, 12, 8], ['#2a6044', -7, -2, 8, 6], ['#2a6044', 7, -2, 8, 6], ['#37785a', 0, -5, 8, 6]].forEach(([c, dx, dy, rx, ry]) => { b.fillStyle = c; b.beginPath(); b.ellipse(x + dx, y + dy, rx, ry, 0, 0, 7); b.fill(); });
  [[-6, -4, '#ff8aa0'], [4, -6, '#ffd34d'], [7, -1, '#ff8aa0'], [-2, -1, '#fff'], [-9, 0, '#ffd34d']].forEach(([dx, dy, c]) => { b.fillStyle = c; b.fillRect(x + dx, y + dy, 2, 2); });
};
const bench = (b, x, y) => { b.fillStyle = 'rgba(0,0,0,.35)'; b.fillRect(x + 2, y + 9, 38, 6); b.fillStyle = '#3a2a1c'; b.fillRect(x + 2, y + 8, 3, 5); b.fillRect(x + 33, y + 8, 3, 5); b.fillStyle = '#8a6038'; b.fillRect(x, y + 2, 38, 7); b.fillStyle = '#a77a4a'; b.fillRect(x, y + 2, 38, 2); b.fillStyle = '#5d4430'; b.fillRect(x, y - 4, 38, 3); b.fillStyle = '#7d5c3d'; b.fillRect(x, y - 4, 38, 1); b.fillStyle = '#3a2a1c'; b.fillRect(x + 3, y - 1, 2, 4); b.fillRect(x + 33, y - 1, 2, 4); };
const crystalLamp = (b, x, y) => {
  b.fillStyle = '#8a82b0';
  b.fillRect(x + 9, y - 2, 8, 3);
  b.fillStyle = '#4a4468';
  b.fillRect(x + 9, y + 1, 8, 1);
  b.fillStyle = '#2a6f9a';
  b.beginPath();
  b.moveTo(x + 13, y - 16);
  b.lineTo(x + 18, y - 8);
  b.lineTo(x + 13, y - 2);
  b.lineTo(x + 8, y - 8);
  b.closePath();
  b.fill();
  b.fillStyle = '#7ad0ff';
  b.beginPath();
  b.moveTo(x + 13, y - 16);
  b.lineTo(x + 13, y - 2);
  b.lineTo(x + 8, y - 8);
  b.closePath();
  b.fill();
  b.fillStyle = '#d8f4ff';
  b.fillRect(x + 11, y - 12, 1, 4);
};

function plazaBase(b) {
  const cx = 320, cy = 198;
  b.fillStyle = 'rgba(0,0,0,.3)';
  b.beginPath();
  b.ellipse(cx, cy + 5, 108, 66, 0, 0, 7);
  b.fill();
  const ring = (rx, ry, c) => { b.fillStyle = c; b.beginPath(); b.ellipse(cx, cy, rx, ry, 0, 0, 7); b.fill(); };
  ring(104, 62, '#2a2638');
  ring(100, 59, '#6a6382');
  ring(95, 55, '#4f4966');
  ring(84, 48, '#5e5878');
  ring(72, 40, '#413b56');
  b.strokeStyle = 'rgba(20,16,32,.55)';
  b.lineWidth = 1;
  for (let i = 0; i < 28; i++) {
    const a = i / 28 * 6.283, c = Math.cos(a), s = Math.sin(a);
    b.beginPath();
    b.moveTo(cx + c * 72, cy + s * 40);
    b.lineTo(cx + c * 95, cy + s * 55);
    b.stroke();
  }
  b.strokeStyle = 'rgba(255,255,255,.08)';
  [[84, 48], [95, 55]].forEach(([rx, ry]) => { b.beginPath(); b.ellipse(cx, cy, rx, ry, 0, 0, 7); b.stroke(); });
  b.strokeStyle = 'rgba(216,184,120,.75)';
  b.lineWidth = 1.5;
  b.beginPath();
  b.ellipse(cx, cy, 78, 44, 0, 0, 7);
  b.stroke();
  b.lineWidth = 1;
  b.beginPath();
  b.ellipse(cx, cy, 98, 57, 0, 0, 7);
  b.stroke();
  b.fillStyle = '#e8d098';
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * 6.283;
    b.fillRect(Math.round(cx + Math.cos(a) * 88) - 1, Math.round(cy + Math.sin(a) * 51) - 1, 3, 3);
  }
}

function fountainBase(b) {
  const cx = 320, cy = 198;
  b.fillStyle = 'rgba(0,0,0,.38)';
  b.beginPath();
  b.ellipse(cx, cy + 12, 46, 17, 0, 0, 7);
  b.fill();
  // dinding basin
  b.fillStyle = '#4a4560';
  b.beginPath();
  b.ellipse(cx, cy + 9, 41, 20, 0, 0, 7);
  b.fill();
  b.fillRect(cx - 41, cy, 82, 9);
  b.fillStyle = '#2c2840';
  for (let i = -3; i <= 3; i++) {
    const x = cx + i * 11, yt = cy + 20 * Math.sqrt(1 - Math.pow(i * 11 / 41, 2));
    b.fillRect(x, yt, 1, 9);
  }
  b.fillStyle = '#9a94b4';
  b.beginPath();
  b.ellipse(cx, cy, 41, 20, 0, 0, 7);
  b.fill();
  b.fillStyle = '#6f6988';
  b.beginPath();
  b.ellipse(cx, cy + 1, 36, 17, 0, 0, 7);
  b.fill();
  b.fillStyle = '#175a86';
  b.beginPath();
  b.ellipse(cx, cy + 1, 34, 16, 0, 0, 7);
  b.fill();
  b.strokeStyle = '#d6d0ea';
  b.lineWidth = 1;
  b.beginPath();
  b.ellipse(cx, cy, 41, 20, 0, 0, 7);
  b.stroke();
  b.fillStyle = '#e8d098';
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * 6.283;
    b.fillRect(Math.round(cx + Math.cos(a) * 39) - 1, Math.round(cy + Math.sin(a) * 19) - 1, 2, 2);
  }
  // tiang tengah
  b.fillStyle = '#8d87a6';
  b.fillRect(cx - 6, 176, 12, 22);
  b.fillStyle = '#b8b2d0';
  b.fillRect(cx - 6, 176, 3, 22);
  b.fillStyle = '#5d5878';
  b.fillRect(cx + 3, 176, 3, 22);
  b.fillStyle = '#d8b878';
  b.fillRect(cx - 6, 184, 12, 2);
  b.fillRect(cx - 6, 192, 12, 2);
  b.fillStyle = '#a8a2c0';
  b.beginPath();
  b.ellipse(cx, 198, 10, 4, 0, 0, 7);
  b.fill();
  // mangkuk atas
  b.fillStyle = '#4a4560';
  b.beginPath();
  b.ellipse(cx, 176, 15, 7, 0, 0, 7);
  b.fill();
  b.fillStyle = '#9a94b4';
  b.beginPath();
  b.ellipse(cx, 172, 15, 7, 0, 0, 7);
  b.fill();
  b.fillStyle = '#5ac0e8';
  b.beginPath();
  b.ellipse(cx, 172, 12, 5, 0, 0, 7);
  b.fill();
  b.strokeStyle = '#d6d0ea';
  b.beginPath();
  b.ellipse(cx, 172, 15, 7, 0, 0, 7);
  b.stroke();
  // puncak
  b.fillStyle = '#b8b2d0';
  b.fillRect(cx - 2, 156, 4, 14);
  b.fillStyle = '#f4efff';
  b.fillRect(cx - 2, 156, 1, 14);
  b.fillStyle = '#d8b878';
  b.beginPath();
  b.arc(cx, 153, 3.5, 0, 7);
  b.fill();
  b.fillStyle = '#fff3d0';
  b.fillRect(cx - 1, 151, 2, 2);
}

function fountainFx() {
  const cx = 320, cy = 198;
  let q;
  g.save();
  g.globalCompositeOperation = 'lighter';
  q = g.createRadialGradient(cx, cy, 10, cx, cy, 125);
  q.addColorStop(0, 'rgba(90,190,255,' + (.15 + .04 * Math.sin(t * 2)) + ')');
  q.addColorStop(1, 'rgba(60,140,255,0)');
  g.fillStyle = q;
  g.fillRect(cx - 130, cy - 85, 260, 170);
  g.globalCompositeOperation = 'source-over';
  // air basin
  g.save();
  g.beginPath();
  g.ellipse(cx, cy + 1, 34.5, 16.2, 0, 0, 7);
  g.clip();
  q = g.createRadialGradient(cx, cy, 2, cx, cy, 38);
  q.addColorStop(0, '#46b0d8');
  q.addColorStop(1, '#175a86');
  g.fillStyle = q;
  g.fillRect(cx - 40, cy - 20, 80, 40);
  g.strokeStyle = 'rgba(200,245,255,.6)';
  g.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const k = (t * .45 + i / 4) % 1;
    g.globalAlpha = (1 - k) * .8;
    g.beginPath();
    g.ellipse(cx, cy + 3, 8 + k * 28, 3 + k * 13, 0, 0, 7);
    g.stroke();
  }
  g.fillStyle = '#fff';
  for (let i = 0; i < 8; i++) {
    const a = t * .6 + i * 2.3;
    g.globalAlpha = .3 + .3 * Math.sin(t * 5 + i * 2);
    g.fillRect(Math.round(cx + Math.cos(a * 1.2 + i) * 26), Math.round(cy + Math.sin(a + i * 1.7) * 11), 2, 1);
  }
  g.restore();
  // air mangkuk atas
  g.save();
  g.beginPath();
  g.ellipse(cx, 172, 12, 5, 0, 0, 7);
  g.clip();
  g.fillStyle = '#62c8ee';
  g.fillRect(cx - 14, 166, 28, 12);
  g.strokeStyle = 'rgba(255,255,255,.7)';
  g.lineWidth = 1;
  for (let i = 0; i < 2; i++) {
    const k = (t * .7 + i * .5) % 1;
    g.globalAlpha = 1 - k;
    g.beginPath();
    g.ellipse(cx, 172, 3 + k * 9, 1 + k * 4, 0, 0, 7);
    g.stroke();
  }
  g.restore();
  // tirai air dari mangkuk atas ke basin
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * 6.283 + .26, c = Math.cos(a), s = Math.sin(a), x0 = cx + c * 13, y0 = 173 + s * 5, x1 = cx + c * 25, y1 = cy + s * 10 - 1;
    g.strokeStyle = 'rgba(170,230,255,' + (.35 + .15 * Math.sin(t * 9 + i)) + ')';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x0, y0);
    g.quadraticCurveTo(x0 + (x1 - x0) * .75, y0 + 3, x1, y1);
    g.stroke();
    for (let j = 0; j < 3; j++) {
      const u = (t * 1.6 + i * .31 + j / 3) % 1, xx = x0 + (x1 - x0) * u * .95, yy = y0 + (y1 - y0) * u * u;
      g.fillStyle = 'rgba(235,250,255,.85)';
      g.fillRect(Math.round(xx), Math.round(yy), 1, 2);
    }
    g.fillStyle = 'rgba(235,250,255,' + (.3 + .3 * Math.sin(t * 10 + i * 1.3)) + ')';
    g.fillRect(Math.round(x1) - 1, Math.round(y1), 3, 1);
  }
  // pancuran utama
  g.fillStyle = 'rgba(200,240,255,.85)';
  g.fillRect(cx - 1, 145 - Math.round(Math.sin(t * 6) * 2), 2, 9);
  for (let i = 0; i < 18; i++) {
    const ph = (t * .8 + i / 18) % 1, sp = Math.sin(i * 2.4) * 12, x = cx + sp * ph, y = 154 - 44 * ph + 60 * ph * ph;
    g.fillStyle = 'rgba(225,248,255,' + (1 - ph * .3) + ')';
    g.fillRect(Math.round(x), Math.round(y), 2, 2);
  }
  g.globalCompositeOperation = 'lighter';
  q = g.createRadialGradient(cx, 150, 0, cx, 150, 34);
  q.addColorStop(0, 'rgba(180,230,255,' + (.25 + .08 * Math.sin(t * 4)) + ')');
  q.addColorStop(1, 'rgba(120,200,255,0)');
  g.fillStyle = q;
  g.fillRect(cx - 36, 114, 72, 72);
  g.restore();
}

function ambientFx() {
  g.save();
  g.globalCompositeOperation = 'lighter';
  [[120, .9], [520, -.9]].forEach(([x, d], i) => { const al = .05 + .015 * Math.sin(t * .8 + i * 2), gr = g.createLinearGradient(x, 14, x + d * 90, 300); gr.addColorStop(0, 'rgba(255,225,160,' + al * 2 + ')'); gr.addColorStop(1, 'rgba(255,225,160,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 18, 14); g.lineTo(x + 18, 14); g.lineTo(x + d * 90 + 50, 300); g.lineTo(x + d * 90 - 50, 300); g.closePath(); g.fill(); });
  [[163, 141], [477, 141], [163, 253], [477, 253]].forEach(([x, y], i) => { const f = .75 + .25 * Math.sin(t * 3 + i * 1.7), q = g.createRadialGradient(x, y, 0, x, y, 36); q.addColorStop(0, 'rgba(120,200,255,' + .5 * f + ')'); q.addColorStop(1, 'rgba(80,140,255,0)'); g.fillStyle = q; g.fillRect(x - 36, y - 36, 72, 72); });
  for (let i = 0; i < 26; i++) {
    const x = 20 + ((i * 97) % 600) + Math.sin(t * .4 + i) * 18, y = 30 + ((i * 53) % 330) + Math.cos(t * .35 + i * 1.3) * 14, al = .25 + .35 * Math.max(0, Math.sin(t * 1.8 + i * 2.1)), c = i % 3 ? '255,230,150' : '150,230,255';
    g.fillStyle = 'rgba(' + c + ',' + al * .3 + ')';
    g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 4, 4);
    g.fillStyle = 'rgba(' + c + ',' + al + ')';
    g.fillRect(Math.round(x), Math.round(y), 2, 2);
  }
  g.restore();
}

function buildBGL() {
  const b = BGL.getContext('2d');
  let sd = 21;
  const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, ri = (a, z) => a + Math.floor(r() * (z - a + 1));
  b.fillStyle = '#100f1b';
  b.fillRect(0, 0, MW, MH);
  const FL = ['#352f3d', '#3a3344', '#302a38', '#383142', '#2e2936'];
  for (let y = 0; y < MH; y += 32)
    for (let x = 0; x < MW; x += 32) {
      b.fillStyle = FL[ri(0, 4)];
      b.fillRect(x + 1, y + 1, 30, 30);
      b.fillStyle = 'rgba(255,255,255,.07)';
      b.fillRect(x + 1, y + 1, 30, 1);
      b.fillRect(x + 1, y + 1, 1, 30);
      b.fillStyle = 'rgba(0,0,0,.28)';
      b.fillRect(x + 1, y + 30, 30, 1);
      b.fillRect(x + 30, y + 1, 1, 30);
      for (let i = 0; i < 6; i++) {
        b.fillStyle = r() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.16)';
        b.fillRect(x + ri(3, 27), y + ri(3, 27), ri(1, 2), 1);
      }
    }
  rug(b, 272, 44, 96, 330, '#4b2a38', '#9c7a52');
  plazaBase(b);
  fountainBase(b);
  b.strokeStyle = 'rgba(143,232,160,.4)';
  b.lineWidth = 1.5;
  b.beginPath();
  b.ellipse(320, 330, 30, 16, 0, 0, 7);
  b.stroke();
  b.beginPath();
  b.ellipse(320, 330, 20, 10, 0, 0, 7);
  b.stroke();
  b.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const a = i * 1.0472;
    b.fillStyle = 'rgba(143,232,160,.6)';
    b.fillRect(320 + Math.cos(a) * 30 - 1, 330 + Math.sin(a) * 16 - 1, 3, 3);
  }
  b.font = 'bold 8px monospace';
  b.textAlign = 'center';
  b.fillStyle = 'rgba(143,232,160,.6)';
  b.fillText('SAFE ZONE', 320, 356);
  const gr = (x0, y0, x1, y1, rx, ry, rw, rh) => { const q = b.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, 'rgba(0,0,0,.55)'); q.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = q; b.fillRect(rx, ry, rw, rh); };
  gr(0, 14, 0, 34, 14, 14, 612, 20);
  gr(0, 386, 0, 366, 14, 366, 612, 20);
  gr(14, 0, 34, 0, 14, 14, 20, 372);
  gr(626, 0, 606, 0, 606, 14, 20, 372);
  const BC = ['#3b3552', '#383250', '#403a58', '#35304c'];
  const wall = (x, y, w, h) => {
    b.fillStyle = '#211d33'; b.fillRect(x, y, w, h); for (let j = 0, ry = y; ry < y + h; ry += 7, j++)
      for (let rx = x - (j % 2 ? 8 : 0); rx < x + w; rx += 16) {
        const x0 = Math.max(rx, x), x1 = Math.min(rx + 16, x + w);
        if (x1 - x0 < 2)
          continue;
        b.fillStyle = BC[ri(0, 3)];
        b.fillRect(x0 + 1, ry + 1, x1 - x0 - 1, Math.min(6, y + h - ry - 1));
        b.fillStyle = 'rgba(255,255,255,.08)';
        b.fillRect(x0 + 1, ry + 1, x1 - x0 - 1, 1);
      }
  };
  [[0, 0, 640, 14], [0, 386, 640, 14], [0, 0, 14, 400], [626, 0, 14, 400]].forEach(w => wall(...w));
  b.fillStyle = '#4f4a80';
  b.fillRect(14, 12, 612, 2);
  b.fillRect(14, 386, 612, 2);
  b.fillRect(12, 14, 2, 372);
  b.fillRect(626, 14, 2, 372);
  {
    const q = b.createLinearGradient(596, 0, 626, 0);
    q.addColorStop(0, 'rgba(194,160,107,0)');
    q.addColorStop(1, 'rgba(194,160,107,.22)');
    b.fillStyle = q;
    b.fillRect(596, 172, 30, 56);
    const d = b.createLinearGradient(626, 0, 640, 0);
    d.addColorStop(0, '#3a2a14');
    d.addColorStop(1, '#0e0a06');
    b.fillStyle = d;
    b.fillRect(626, 172, 14, 56);
    b.fillStyle = '#2b2833';
    b.fillRect(614, 164, 26, 8);
    b.fillRect(614, 228, 26, 8);
    b.fillStyle = '#8a82b0';
    b.fillRect(614, 164, 26, 1);
    b.fillRect(614, 235, 26, 1);
    b.fillStyle = '#c2a06b';
    b.fillRect(626, 172, 1, 56);
  }
  wall(256, 0, 128, 46);
  b.fillStyle = '#0c0818';
  b.fillRect(288, 14, 64, 34);
  const gq = b.createLinearGradient(0, 14, 0, 48);
  gq.addColorStop(0, '#0c0818');
  gq.addColorStop(1, '#5a2f9a');
  b.fillStyle = gq;
  b.fillRect(290, 16, 60, 32);
  b.fillStyle = '#6a6672';
  for (let x = 294; x < 350; x += 8)
    b.fillRect(x, 16, 2, 32);
  b.fillRect(290, 26, 60, 2);
  b.fillRect(290, 38, 60, 2);
  b.fillStyle = '#2b2833';
  b.fillRect(284, 12, 72, 5);
  b.fillRect(284, 12, 5, 36);
  b.fillRect(351, 12, 5, 36);
  b.fillStyle = '#8a82b0';
  b.fillRect(284, 12, 72, 1);
  b.fillStyle = '#d8d2c4';
  b.fillRect(316, 3, 8, 7);
  b.fillStyle = '#14121f';
  b.fillRect(317, 5, 2, 2);
  b.fillRect(321, 5, 2, 2);
  b.fillStyle = 'rgba(0,0,0,.4)';
  b.fillRect(46, 44, 64, 30);
  b.fillStyle = '#3a3340';
  b.fillRect(44, 40, 64, 30);
  b.fillStyle = '#4a4352';
  b.fillRect(44, 40, 64, 4);
  b.fillStyle = '#14080a';
  b.fillRect(52, 48, 30, 18);
  b.fillStyle = '#e8561f';
  b.fillRect(55, 56, 24, 8);
  b.fillStyle = '#ffb050';
  b.fillRect(58, 59, 18, 4);
  b.fillStyle = '#5a5a66';
  b.fillRect(88, 56, 16, 6);
  b.fillRect(92, 62, 8, 6);
  b.fillStyle = 'rgba(0,0,0,.4)';
  b.fillRect(534, 42, 64, 34);
  b.fillStyle = '#4a4558';
  b.fillRect(532, 38, 64, 34);
  b.fillStyle = '#6a6578';
  b.fillRect(532, 38, 64, 3);
  b.fillStyle = '#1d4a6a';
  b.fillRect(538, 44, 52, 22);
  b.fillStyle = '#3aa0d0';
  b.fillRect(540, 46, 48, 18);
  b.fillStyle = '#8a8598';
  b.fillRect(560, 30, 8, 22);
  b.fillStyle = '#b0abc0';
  b.fillRect(558, 28, 12, 4);
  [[150, 150], [464, 150], [150, 262], [464, 262]].forEach(([x, y]) => { b.fillStyle = 'rgba(0,0,0,.4)'; b.fillRect(x + 3, y + 5, 26, 26); b.fillStyle = '#3a3552'; b.fillRect(x, y, 26, 26); b.fillStyle = '#2a2540'; b.fillRect(x + 20, y, 6, 26); b.fillStyle = '#5a5490'; b.fillRect(x, y, 26, 2); b.fillStyle = '#4c4670'; b.fillRect(x + 2, y + 3, 18, 2); });
  [[150, 150], [464, 150], [150, 262], [464, 262]].forEach(([x, y]) => crystalLamp(b, x, y));
  bench(b, 186, 192);
  bench(b, 416, 192);
  [[34, 160], [34, 236], [600, 136], [600, 266], [60, 368], [236, 372], [404, 372], [580, 368]].forEach(([x, y]) => bush(b, x, y));
  [[598, 338]].forEach(([x, y]) => { b.fillStyle = 'rgba(0,0,0,.4)'; b.fillRect(x - 6, y + 8, 16, 6); b.fillStyle = '#5d4430'; b.fillRect(x - 8, y - 10, 16, 20); b.fillStyle = '#3a2a1c'; b.fillRect(x - 8, y - 5, 16, 2); b.fillRect(x - 8, y + 3, 16, 2); });
  bzBase(b, 252, 60);
  bzBase(b, 388, 60);
  TOL.forEach(([x, y]) => { b.fillStyle = '#14121f'; b.fillRect(x - 2, y - 1, 4, 6); b.fillStyle = '#6b5a44'; b.fillRect(x - 3, y - 2, 6, 2); });
  banner(b, 170, 14, '#2a4a3a', '#8fe8a0');
  banner(b, 470, 14, '#2a4a3a', '#8fe8a0');

  // ===== PERPUSTAKAAN  ORIN =====
  {
    const BK = ['#7a2a3a', '#2a4a7a', '#2f6a4a', '#8a6a2a', '#5a3a7a', '#a0522d', '#3a5a6a', '#6a2a5a', '#b08a4f', '#4a4a5a'];
    // karpet baca hangat
    rug(b, 44, 268, 92, 86, '#2a2a4a', '#9c7a52');
    // cahaya hangat lembut
    {
      const q = b.createRadialGradient(80, 310, 6, 80, 310, 86);
      q.addColorStop(0, 'rgba(255,170,80,.20)');
      q.addColorStop(1, 'rgba(255,170,80,0)');
      b.fillStyle = q;
      b.fillRect(0, 224, 176, 176);
    }
    const shelf = (x, y, w, h) => {
      b.fillStyle = 'rgba(0,0,0,.4)';
      b.fillRect(x + 3, y + 5, w, h);
      b.fillStyle = '#3a2616';
      b.fillRect(x, y, w, h);
      b.fillStyle = '#5a3c22';
      b.fillRect(x, y, w, 3);
      b.fillStyle = '#7a5430';
      b.fillRect(x, y, w, 1);
      b.fillStyle = '#1c120a';
      b.fillRect(x + 2, y + 4, w - 4, h - 7);
      const rows = 3, rh = Math.floor((h - 7) / rows);
      for (let k = 0; k < rows; k++) {
        const ry = y + 4 + k * rh;
        let bx = x + 3;
        while (bx < x + w - 5) {
          const bw = ri(2, 4), bh = ri(rh - 8, rh - 3);
          b.fillStyle = BK[ri(0, 9)];
          b.fillRect(bx, ry + rh - 1 - bh, bw, bh);
          b.fillStyle = 'rgba(255,255,255,.18)';
          b.fillRect(bx, ry + rh - 1 - bh, 1, bh);
          if (r() < .4) {
            b.fillStyle = '#c2a06b';
            b.fillRect(bx, ry + rh - 1 - bh + 2, bw, 1);
          }
          bx += bw + (r() < .12 ? 2 : 0);
        }
        b.fillStyle = '#5a3c22';
        b.fillRect(x + 2, ry + rh - 1, w - 4, 2);
        b.fillStyle = 'rgba(0,0,0,.35)';
        b.fillRect(x + 2, ry + rh + 1, w - 4, 1);
      }
      b.fillStyle = '#2a1a0e';
      b.fillRect(x, y, 2, h);
      b.fillRect(x + w - 2, y, 2, h);
      b.fillStyle = '#2a1a0e';
      b.fillRect(x, y + h - 3, w, 3);
    };
    shelf(16, 262, 30, 44);
    shelf(16, 310, 30, 44);
    shelf(16, 356, 30, 28);
    // tangga perpustakaan di rak
    b.fillStyle = '#6b4d33';
    b.fillRect(48, 268, 3, 40);
    b.fillRect(56, 268, 3, 40);
    for (let yy = 272; yy < 306; yy += 7) {
      b.fillStyle = '#8a6a48';
      b.fillRect(48, yy, 11, 2);
    }
    // meja baca + buku terbuka + lilin
    b.fillStyle = 'rgba(0,0,0,.4)';
    b.fillRect(53, 344, 34, 24);
    b.fillStyle = '#5d4430';
    b.fillRect(50, 340, 34, 24);
    b.fillStyle = '#7d5c3d';
    b.fillRect(50, 340, 34, 3);
    b.fillStyle = '#3a2a1c';
    b.fillRect(50, 360, 34, 4);
    b.fillStyle = '#e8dcc0';
    b.fillRect(56, 346, 12, 8);
    b.fillRect(69, 346, 12, 8);
    b.fillStyle = '#b8a888';
    b.fillRect(68, 346, 1, 8);
    b.fillStyle = '#6a5a44';
    for (let i = 0; i < 3; i++) {
      b.fillRect(58, 348 + i * 2, 8, 1);
      b.fillRect(71, 348 + i * 2, 8, 1);
    }
    b.fillStyle = '#a33b4c';
    b.fillRect(52, 344, 4, 6);
    b.fillStyle = '#2a4a7a';
    b.fillRect(52, 351, 5, 3);
    b.fillStyle = '#e8dcc0';
    b.fillRect(77, 342, 3, 4);
    b.fillStyle = '#ffb050';
    b.fillRect(78, 340, 1, 2);
    b.fillStyle = '#ffe28a';
    b.fillRect(78, 339, 1, 1);
    // tumpukan buku di lantai
    const stack = (x, y, n) => {
      for (let i = 0; i < n; i++) {
        const w = ri(10, 15);
        b.fillStyle = 'rgba(0,0,0,.35)';
        b.fillRect(x + 1, y - i * 4 + 2, w, 4);
        b.fillStyle = BK[ri(0, 9)];
        b.fillRect(x, y - i * 4, w, 4);
        b.fillStyle = '#e8dcc0';
        b.fillRect(x + w - 2, y - i * 4 + 1, 2, 2);
      }
    };
    stack(104, 330, 4);
    stack(122, 326, 3);
    stack(66, 262, 2);
    stack(88, 338, 2);
    // gulungan perkamen
    const scroll = (x, y) => { b.fillStyle = 'rgba(0,0,0,.3)'; b.fillRect(x + 1, y + 3, 16, 5); b.fillStyle = '#d8c898'; b.fillRect(x, y, 16, 5); b.fillStyle = '#b8a878'; b.fillRect(x, y + 3, 16, 2); b.fillStyle = '#8a6a3a'; b.fillRect(x - 1, y, 2, 5); b.fillRect(x + 15, y, 2, 5); };
    scroll(110, 276);
    scroll(70, 292);
    // papan nama
    b.font = 'bold 8px monospace';
    b.textAlign = 'center';
    b.fillStyle = 'rgba(194,160,107,.7)';
    b.fillText('ARSIP', 62, 258);
    b.textAlign = 'left';
  }
  b.textAlign = 'left';
}

// ===== RUANG PELATIHAN (di kanan lobby) =====
const BGT = document.createElement('canvas');
BGT.width = MW;
BGT.height = MH;
const WT = [
  [0, 0, 640, 14], [0, 386, 640, 14], [626, 0, 14, 400], [0, 0, 14, 172], [0, 228, 14, 172], [423, 196, 14, 10, 'c'], [556, 56, 36, 26, 'c'], [556, 318, 36, 26, 'c']
];
const TOT = [
  [120, 8], [240, 8], [400, 8], [520, 8], [120, 393], [320, 393], [520, 393], [633, 100], [633, 300], [7, 150], [7, 250]
];

function trainDraw() {
  g.save();
  g.globalCompositeOperation = 'lighter';
  const q = g.createRadialGradient(1008, 206, 0, 1008, 206, 150);
  q.addColorStop(0, 'rgba(255,190,90,' + (.16 + .05 * Math.sin(t * 2)) + ')');
  q.addColorStop(1, 'rgba(255,150,60,0)');
  g.fillStyle = q;
  g.fillRect(858, 56, 300, 300);
  g.restore();
  g.save();
  g.font = 'bold 8px monospace';
  g.textAlign = 'center';
  g.fillStyle = '#ffe0a0';
  g.globalAlpha = .7 + .3 * Math.sin(t * 4);
  g.fillText('◀ LOBBY', Math.round(686 + Math.sin(t * 3) * 1.5), 160);
  g.restore();
  const dm = es[0];
  if (dm && dm.k == 'dummy') {
    g.fillStyle = 'rgba(20,14,8,.8)';
    g.fillRect(dm.x - 36, dm.y + 14, 72, 24);
    g.strokeStyle = '#8a6a3a';
    g.strokeRect(dm.x - 35.5, dm.y + 14.5, 71, 23);
    g.font = '8px monospace';
    if (t - DM.last < 8) {
      txt('DPS ' + (DM.sum / Math.max(1, DM.last - DM.t0 + .4)).toFixed(1) + '  Hit ' + DM.n, dm.x, dm.y + 25, '#ffd34d', 'center');
      txt('Total ' + Math.round(DM.sum) + '  Max ' + Math.round(DM.max), dm.x, dm.y + 34, '#ddd', 'center');
    } else
      txt('Serang manekin!', dm.x, dm.y + 29, '#ddd', 'center');
  }
}

function buildBGT() {
  const b = BGT.getContext('2d');
  let sd = 33;
  const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, ri = (a, z) => a + Math.floor(r() * (z - a + 1));
  b.fillStyle = '#100c08';
  b.fillRect(0, 0, MW, MH);
  const FL = ['#3b3228', '#40362b', '#352d24', '#3d3429', '#322b22'];
  for (let y = 0; y < MH; y += 32)
    for (let x = 0; x < MW; x += 32) {
      b.fillStyle = FL[ri(0, 4)];
      b.fillRect(x + 1, y + 1, 30, 30);
      b.fillStyle = 'rgba(255,255,255,.06)';
      b.fillRect(x + 1, y + 1, 30, 1);
      b.fillRect(x + 1, y + 1, 1, 30);
      b.fillStyle = 'rgba(0,0,0,.28)';
      b.fillRect(x + 1, y + 30, 30, 1);
      b.fillRect(x + 30, y + 1, 1, 30);
      for (let i = 0; i < 5; i++) {
        b.fillStyle = r() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.16)';
        b.fillRect(x + ri(3, 27), y + ri(3, 27), ri(1, 2), 1);
      }
    }
  floorPass(b, MW, MH, { seed: 21, walls: WT, patches: 12, lt: '210,180,130', camp: 1 });
  b.fillStyle = 'rgba(0,0,0,.3)';
  b.fillRect(16, 188, 230, 32);
  b.fillStyle = '#5a2a2a';
  b.fillRect(14, 184, 230, 32);
  b.strokeStyle = '#c2a06b';
  b.lineWidth = 2;
  b.strokeRect(17, 187, 224, 26);
  b.lineWidth = 1;
  b.strokeRect(22.5, 192.5, 214, 16);
  b.fillStyle = '#c2a06b';
  for (let x = 34; x < 230; x += 24)
    b.fillRect(x, 198, 6, 4);
  const cx = 430, cy = 206;
  b.fillStyle = 'rgba(0,0,0,.3)';
  b.beginPath();
  b.ellipse(cx, cy + 4, 100, 66, 0, 0, 7);
  b.fill();
  b.fillStyle = 'rgba(128,100,62,.6)';
  b.beginPath();
  b.ellipse(cx, cy, 96, 62, 0, 0, 7);
  b.fill();
  b.strokeStyle = 'rgba(60,44,28,.75)';
  b.lineWidth = 2;
  b.stroke();
  b.lineWidth = 1;
  b.fillStyle = 'rgba(150,120,76,.5)';
  b.beginPath();
  b.ellipse(cx, cy, 70, 44, 0, 0, 7);
  b.fill();
  b.strokeStyle = 'rgba(194,160,107,.35)';
  b.beginPath();
  b.ellipse(cx, cy, 46, 28, 0, 0, 7);
  b.stroke();
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * 6.283;
    b.fillStyle = '#6b4d33';
    b.fillRect(Math.round(cx + Math.cos(a) * 96) - 1, Math.round(cy + Math.sin(a) * 62) - 3, 3, 6);
  }
  b.font = 'bold 8px monospace';
  b.textAlign = 'center';
  b.fillStyle = 'rgba(194,160,107,.55)';
  b.fillText('ARENA LATIHAN', cx, cy + 88);
  const gr = (x0, y0, x1, y1, rx, ry, rw, rh) => { const q = b.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, 'rgba(0,0,0,.55)'); q.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = q; b.fillRect(rx, ry, rw, rh); };
  gr(0, 14, 0, 34, 14, 14, 612, 20);
  gr(0, 386, 0, 366, 14, 366, 612, 20);
  gr(14, 0, 34, 0, 14, 14, 20, 372);
  gr(626, 0, 606, 0, 606, 14, 20, 372);
  const BC = ['#4a3d34', '#46392f', '#4f4238', '#41352c'];
  const wall = (x, y, w, h) => {
    b.fillStyle = '#241b14'; b.fillRect(x, y, w, h); for (let j = 0, ry = y; ry < y + h; ry += 7, j++)
      for (let rx = x - (j % 2 ? 8 : 0); rx < x + w; rx += 16) {
        const x0 = Math.max(rx, x), x1 = Math.min(rx + 16, x + w);
        if (x1 - x0 < 2)
          continue;
        b.fillStyle = BC[ri(0, 3)];
        b.fillRect(x0 + 1, ry + 1, x1 - x0 - 1, Math.min(6, y + h - ry - 1));
        b.fillStyle = 'rgba(255,255,255,.08)';
        b.fillRect(x0 + 1, ry + 1, x1 - x0 - 1, 1);
      }
  };
  [[0, 0, 640, 14], [0, 386, 640, 14], [626, 0, 14, 400], [0, 0, 14, 172], [0, 228, 14, 172]].forEach(w => wall(...w));
  b.fillStyle = '#8a6a3a';
  b.fillRect(14, 12, 612, 2);
  b.fillRect(14, 386, 612, 2);
  b.fillRect(626, 14, 2, 372);
  b.fillRect(12, 14, 2, 158);
  b.fillRect(12, 228, 2, 158);
  {
    const d = b.createLinearGradient(0, 0, 14, 0);
    d.addColorStop(0, '#0e0a06');
    d.addColorStop(1, '#3a2a14');
    b.fillStyle = d;
    b.fillRect(0, 172, 14, 56);
    b.fillStyle = '#2b2833';
    b.fillRect(0, 164, 26, 8);
    b.fillRect(0, 228, 26, 8);
    b.fillStyle = '#8a82b0';
    b.fillRect(0, 164, 26, 1);
    b.fillRect(0, 235, 26, 1);
    b.fillStyle = '#c2a06b';
    b.fillRect(13, 172, 1, 56);
  }
  [100, 300, 500].forEach(x => banner(b, x, 14, '#6a3a12', '#ffd34d'));
  [200, 400, 570].forEach(x => rack(b, x, 16));
  [150, 330].forEach(x => rack(b, x, 364));
  [[556, 56], [556, 318]].forEach(([x, y]) => { b.fillStyle = 'rgba(0,0,0,.4)'; b.fillRect(x + 3, y + 4, 36, 26); b.fillStyle = '#6b4d33'; b.fillRect(x, y, 36, 26); b.fillStyle = '#8a6a48'; b.fillRect(x, y, 36, 3); b.fillStyle = '#3a2a1c'; b.fillRect(x, y + 12, 36, 2); b.fillRect(x + 16, y, 3, 26); b.fillRect(x, y + 24, 36, 2); });
  TOT.forEach(([x, y]) => { b.fillStyle = '#14121f'; b.fillRect(x - 2, y - 1, 4, 6); b.fillStyle = '#6b5a44'; b.fillRect(x - 3, y - 2, 6, 2); });
  b.textAlign = 'left';
}
buildBG();
buildBG2();
buildBGL();
buildBGT();
(() => {
  const CUT0 = 250, CUT1 = 312, CW = CUT1 - CUT0, TWW = MW - CW, TW = MW + TWW;
  const tmp = document.createElement('canvas');
  tmp.width = TW;
  tmp.height = MH;
  const c = tmp.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.drawImage(BGL, 0, 0);
  c.drawImage(BGT, 0, 0, CUT0, MH, MW, 0, CUT0, MH);
  c.drawImage(BGT, CUT1, 0, MW - CUT1, MH, MW + CUT0, 0, MW - CUT1, MH);
  BGL.width = TW;
  const b = BGL.getContext('2d');
  b.imageSmoothingEnabled = false;
  b.drawImage(tmp, 0, 0);
  const mx = x => x < CUT0 ? x + MW : x - CW + MW;
  const inL = WL.slice(5), inT = WT.slice(5).filter(w => w[0] > 500).map(w => [mx(w[0]), ...w.slice(1)]);
  const dB = [952, 1008, 1064].map(x => [x - 7, 196, 14, 10, 'c']);
  WL.length = 0;
  WL.push([0, 0, TW, 14], [0, 386, TW, 14], [0, 0, 14, 400], [TW - 14, 0, 14, 400], [626, 0, 28, 172], [626, 228, 28, 172], ...inL, ...inT, ...dB);
  TOL.push(...TOT.filter(([x]) => x < CUT0 || x >= CUT1).map(([x, y]) => [mx(x), y]));
})();

// ===== CAMP PELATIHAN: dekorasi + NPC yang sedang berlatih (koordinat dunia x:654..1204) =====
const TT = [{ x: 878, y: 304, fl: 0, st: [] }, { x: 878, y: 346, fl: 0, st: [] }], TDM = [{ x: 1182, y: 152, tl: 0, tv: 0, fl: 0, k: 0 }, { x: 1182, y: 254, tl: 0, tv: 0, fl: 0, k: 1 }];
const TN = [
  {
    n: 'Rhea, Prajurit Muda', role: 'spar', side: 0, x: 752, y: 104, fc: 1, ph: 0, sk: '#e0b090', hair: '#3a2a1a', c1: '#3a5a8a', c2: '#ffd34d', c3: '#2e3440', lines: [
      'Hah! Jangan lengah, Bram! Kita sparring sampai salah satu menyerah.', 'Kata Finza, pedang kayu lebih jujur dari pedang baja: tidak ada yang berdarah, tapi pelajarannya sama.'
    ]
  },
  {
    n: 'Bram, Rekrut', role: 'spar', side: 1, x: 794, y: 104, fc: -1, ph: 0, sk: '#c9946e', hair: '#6b3a22', c1: '#8a3a3a', c2: '#e8e4f0', c3: '#3a2a2a', lines: [
      'Rhea itu cepat sekali... tapi tadi aku hampir menang. Hampir.', 'Kalau mau ikut latihan, hajar manekin di arena tengah. DPS-mu muncul di bawahnya.'
    ]
  },
  {
    n: 'Lysa, Pemanah', role: 'bow', x: 706, y: 312, fc: 1, ph: .4, tg: TT[0], sk: '#e8c0a0', hair: '#2a6a4a', c1: '#2f6a45', c2: '#c2a06b', c3: '#3a3226', lines: [
      'Tarik napas, tahan, lepaskan. Memanah itu soal kesabaran, bukan tenaga.', 'Tahan klik kiri lalu lepas untuk panah charged: makin lama ditarik, makin kuat tembusannya.'
    ]
  },
  {
    n: 'Veyn, Murid Penyihir', role: 'mage', x: 706, y: 352, fc: 1, ph: 1.1, sk: '#d9b79c', hair: '#e6e6ee', c1: '#5a3a8a', c2: '#b48cff', c3: '#2a2040', lines: [
      'Sihir itu soal fokus, bukan teriakan. Meski... teriakan kadang membantu.', 'Tongkat menembakkan bola sihir yang meledak. Paling efektif kalau musuh berkelompok!'
    ]
  },
  {
    n: 'Darian, Pendekar Pedang', role: 'sword', x: 1148, y: 154, fc: 1, ph: .3, d: TDM[0], sk: '#d9a07a', hair: '#2a1a14', c1: '#6a6f7c', c2: '#c8283e', c3: '#2e3440', lines: [
      'Seribu tebasan sehari. Itu rahasiaku. Tidak ada jalan pintas.', 'Combo tiga serangan: yang kedua lebih cepat, yang ketiga paling kuat. Jangan putus rantainya.'
    ]
  },
  {
    n: 'Hakon, Penombak', role: 'spear', x: 1148, y: 256, fc: 1, ph: .9, d: TDM[1], sk: '#e0b090', hair: '#d8b878', c1: '#7a5a2a', c2: '#ffe9a8', c3: '#3a3226', lines: [
      'Tombak menjangkau lebih jauh dari pedang. Biarkan musuh tak pernah menyentuhmu.', 'Tusukan lurus menembus beberapa musuh sekaligus. Atur jaraknya!'
    ]
  },
  {
    n: 'Gorm, Pengangkat Beban', role: 'lift', x: 1002, y: 336, fc: 1, ph: 0, sk: '#d19a78', hair: '#1a1210', c1: '#a33b4c', c2: '#e8e4f0', c3: '#2a2d36', lines: [
      'Hngh... tujuh puluh... tujuh puluh satu! Otot adalah baju zirah terbaik!', 'Tambahkan poin atribut ke STR kalau mau pukulanmu seperti palu godam.'
    ]
  },
  {
    n: 'Pip, Rekrut Kelelahan', role: 'rest', x: 1030, y: 106, fc: 1, ph: 0, sk: '#e8b898', hair: '#8a5a2a', c1: '#6a7a5a', c2: '#d8b878', c3: '#3a3226', lines: [
      'Aduh... punggungku... Garran menyuruh kami lari sepuluh putaran keliling arena.', 'Duduk dekat api unggun ini satu-satunya yang membuatku tetap hidup.'
    ]
  },
  {
    n: 'Garran, Instruktur Camp', role: 'boss', x: 1098, y: 100, fc: -1, ph: 0, sk: '#c9946e', hair: '#9a9aa8', c1: '#2e3a2a', c2: '#ffd34d', c3: '#1f2a1c', lines: [
      'Perhatian, rekrut! Di camp ini tidak ada yang namanya terlalu lelah!', 'Manekin tidak membalas, tetapi musuh di dungeon akan. Latih dodge-mu dengan Space.', 'Aku isi bar ULT-mu. Cobalah di manekin arena, lalu kembali ke lobby dan masuki gerbang utara.'
    ], act: () => { ultAdd(ULT_MAX); }
  }
];
TN[0].o = TN[1];
TN[1].o = TN[0];
const CB = [
  [871, 294, 14, 24], [871, 334, 14, 24], [892, 290, 22, 76], [1172, 148, 16, 10], [1172, 250, 16, 10], [1046, 82, 28, 14], [1010, 96, 26, 10], [1084, 96, 26, 10], [1170, 324, 16, 18], [980, 352, 44, 12], [1040, 344, 30, 20], [662, 48, 16, 18]
];

function decorCamp(b) {
  let s = 77;
  const q = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296, px = (x, y, w, h, c) => { b.fillStyle = c; b.fillRect(x, y, w, h); }, el = (x, y, rx, ry, c) => { b.fillStyle = c; b.beginPath(); b.ellipse(x, y, rx, ry, 0, 0, 7); b.fill(); };
  for (let i = 0; i < 110; i++) {
    const x = 660 + q() * 540, y = 22 + q() * 360;
    if (Math.abs(x - 1008) < 100 && Math.abs(y - 206) < 66)
      continue;
    const m = i % 3;
    if (m == 0) {
      px(x, y, 2 + q() * 3, 1, 'rgba(0,0,0,.2)');
    } else if (m == 1) {
      b.strokeStyle = '#b89a52';
      b.lineWidth = 1;
      b.beginPath();
      b.moveTo(x, y);
      b.lineTo(x + 3 + q() * 3, y - 1 - q() * 2);
      b.stroke();
    } else
      px(x, y, 2, 1, 'rgba(120,80,40,.5)');
  }
  for (let i = 0; i < 10; i++) {
    const x = 930 + q() * 160, y = 160 + q() * 90;
    px(x, y, 3, 1, 'rgba(0,0,0,.25)');
    px(x + 4, y + 2, 3, 1, 'rgba(0,0,0,.25)');
  }
  // ring sparring
  px(686, 53, 176, 90, 'rgba(0,0,0,.28)');
  px(684, 50, 176, 88, '#6e5a3e');
  for (let i = 0; i < 150; i++)
    px(686 + q() * 172, 52 + q() * 84, 1 + q() * 2, 1, q() < .5 ? 'rgba(255,230,170,.18)' : 'rgba(0,0,0,.2)');
  px(690, 56, 164, 76, 'rgba(160,130,86,.28)');
  b.strokeStyle = 'rgba(240,230,200,.4)';
  b.lineWidth = 1;
  b.beginPath();
  b.ellipse(772, 94, 36, 24, 0, 0, 7);
  b.moveTo(772, 60);
  b.lineTo(772, 128);
  b.stroke();
  [[752, 104], [794, 104]].forEach(([x, y]) => { b.beginPath(); b.moveTo(x - 3, y + 8); b.lineTo(x + 3, y + 14); b.moveTo(x + 3, y + 8); b.lineTo(x - 3, y + 14); b.stroke(); });
  b.strokeStyle = '#c2a06b';
  [
    [684, 52, 860, 52], [684, 55, 860, 55], [684, 136, 860, 136], [684, 139, 860, 139], [686, 50, 686, 138], [859, 50, 859, 138]
  ].forEach(([a, c, d, e]) => { b.beginPath(); b.moveTo(a, c); b.lineTo(d, e); b.stroke(); });
  [[686, 50], [772, 50], [858, 50], [686, 138], [772, 138], [858, 138], [686, 94], [858, 94]].forEach(([x, y]) => { px(x - 2, y - 3, 4, 9, '#3a2412'); px(x - 2, y - 3, 4, 2, '#8a6038'); px(x - 1, y - 5, 2, 2, '#c2a06b'); });
  // jalur panah
  px(690, 288, 214, 76, 'rgba(70,50,30,.3)');
  px(690, 324, 214, 2, 'rgba(240,230,200,.28)');
  px(722, 288, 2, 76, 'rgba(240,235,220,.55)');
  b.font = 'bold 6px monospace';
  b.textAlign = 'center';
  b.fillStyle = 'rgba(240,230,200,.6)';
  b.textAlign = 'left';
  for (let k = 0; k < 2; k++)
    for (let x = 730; x < 880; x += 28)
      px(x, 300 + k * 42 + 10, 10, 1, 'rgba(240,230,200,.18)');
  TT.forEach(t => {
    el(t.x + 2, t.y + 22, 11, 3, 'rgba(0,0,0,.3)');
    px(t.x - 9, t.y + 6, 3, 16, '#3a2412');
    px(t.x + 6, t.y + 6, 3, 16, '#3a2412');
    px(t.x - 10, t.y + 20, 22, 3, '#5a3a22');
    px(t.x - 1, t.y + 8, 2, 12, '#5a3a22');
    [[12, '#6b4d33'], [11, '#d8c9a0'], [9, '#e8e4d8'], [7, '#1f3a6a'], [5, '#c8283e'], [2.6, '#ffd34d']].forEach(([r, c]) => { b.fillStyle = c; b.beginPath(); b.arc(t.x, t.y, r, 0, 7); b.fill(); });
    px(t.x - 13, t.y - 1, 3, 2, '#d8c9a0');
    px(t.x + 11, t.y - 1, 3, 2, '#d8c9a0');
  });
  // tumpukan jerami
  for (let i = 0; i < 4; i++) {
    const y = 290 + i * 19;
    el(904, y + 19, 13, 2, 'rgba(0,0,0,.25)');
    px(892, y, 22, 18, '#9a7c38');
    px(893, y + 1, 20, 16, '#c9a95a');
    for (let j = 0; j < 7; j++)
      px(895 + j * 3, y + 2 + (j * 5) % 11, 1, 5, '#a3843c');
    px(892, y + 6, 22, 1, '#6b4d33');
    px(892, y + 12, 22, 1, '#6b4d33');
    px(893, y + 1, 20, 2, '#e6cc7a');
  }
  // api unggun
  el(1060, 92, 48, 26, 'rgba(30,20,12,.5)');
  el(1060, 92, 40, 20, 'rgba(60,42,26,.45)');
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * 6.283;
    px(Math.round(1060 + Math.cos(a) * 24) - 3, Math.round(90 + Math.sin(a) * 11) - 2, 6, 4, i % 2 ? '#5a5662' : '#6b6672');
  }
  el(1060, 92, 10, 4, '#1a1410');
  px(1052, 88, 16, 3, '#4a3020');
  px(1054, 92, 14, 3, '#3a2412');
  [[1010, 96], [1084, 96]].forEach(([x, y]) => { px(x + 1, y + 8, 26, 3, 'rgba(0,0,0,.3)'); px(x, y, 26, 9, '#5a3a22'); px(x, y, 26, 2, '#8a6038'); px(x - 1, y + 1, 3, 7, '#c9a46b'); px(x + 24, y + 1, 3, 7, '#c9a46b'); });
  [[1016, 46], [1102, 42]].forEach(([x, y], i) => { px(x + 1, y + 10, 34, 3, 'rgba(0,0,0,.25)'); px(x, y, 34, 11, i ? '#6a3a3a' : '#3a5a6a'); px(x, y, 34, 2, 'rgba(255,255,255,.18)'); px(x + 2, y + 2, 9, 7, '#e8e4d8'); px(x + 30, y, 4, 11, '#2a1c12'); });
  table(b, 1118, 104, 40);
  px(1124, 100, 5, 4, '#c9a46b');
  px(1136, 101, 4, 3, '#c9a46b');
  px(1146, 100, 6, 4, '#e8e4d8');
  candles(b, 1152, 102);
  // zona angkat beban
  px(960, 326, 160, 46, 'rgba(40,30,20,.25)');
  px(980, 352, 44, 10, '#4a3424');
  px(980, 352, 44, 3, '#6b4a32');
  px(984, 362, 4, 6, '#2a1c12');
  px(1016, 362, 4, 6, '#2a1c12');
  px(1040, 344, 30, 20, 'rgba(0,0,0,.3)');
  [[1046, 346], [1058, 346]].forEach(([x, y]) => { px(x, y, 3, 16, '#2a1c12'); });
  px(1040, 350, 30, 3, '#8a8692');
  [[1043, 342], [1067, 342]].forEach(([x, y]) => { px(x - 2, y, 6, 18, '#3a3d48'); px(x - 1, y + 1, 2, 16, '#6a6f7c'); });
  [0, 1, 2, 3].forEach(i => { el(1088 + i * 7, 372 - i * 1, 6, 3, '#22252e'); el(1088 + i * 7, 370 - i * 1, 6, 3, '#3a3d48'); });
  [0, 1, 2].forEach(i => { const x = 948 + i * 14; el(x, 360, 5, 5, '#22252e'); px(x - 3, 352, 6, 2, '#22252e'); px(x - 1, 350, 2, 3, '#22252e'); });
  // pojok kanan
  b.fillStyle = 'rgba(0,0,0,.35)';
  b.beginPath();
  b.ellipse(1178, 331, 9, 4, 0, 0, 7);
  b.fill();
  px(1170, 324, 16, 18, '#49301f');
  px(1172, 326, 12, 14, '#9b7043');
  px(1170, 329, 16, 2, '#302a28');
  px(1170, 336, 16, 2, '#302a28');
  px(1173, 322, 10, 3, '#2a6f9a');
  el(1182, 166, 9, 4, 'rgba(0,0,0,.3)');
  el(1182, 268, 9, 4, 'rgba(0,0,0,.3)');
  // manekin baju zirah (kiri) & tong senjata
  [[668, 150], [668, 258]].forEach(([x, y]) => { el(x, y + 16, 9, 3, 'rgba(0,0,0,.3)'); px(x - 1, y - 4, 3, 20, '#3a2412'); px(x - 8, y + 14, 16, 3, '#5a3a22'); px(x - 6, y - 6, 12, 14, '#6a6f7c'); px(x - 6, y - 6, 12, 3, '#9aa0ae'); px(x - 4, y - 2, 3, 8, '#8a909e'); px(x - 4, y - 14, 8, 8, '#9aa0ae'); px(x - 3, y - 11, 6, 2, '#2a2d36'); px(x - 1, y - 17, 2, 4, '#a33b4c'); px(x + 7, y - 2, 5, 10, '#4b5aa0'); px(x + 8, y, 3, 6, '#c2a06b'); });
  [[680, 50], [1190, 330]].forEach(([x]) => 0);
  b.fillStyle = 'rgba(0,0,0,.35)';
  b.beginPath();
  b.ellipse(670, 68, 10, 4, 0, 0, 7);
  b.fill();
  px(662, 48, 16, 18, '#49301f');
  px(664, 50, 12, 14, '#9b7043');
  px(662, 53, 16, 2, '#302a28');
  px(662, 60, 16, 2, '#302a28');
  [[665, 40], [669, 38], [673, 41]].forEach(([x, y]) => { px(x, y, 2, 12, '#8a6038'); px(x - 1, y - 3, 4, 4, '#cfd6e2'); });
  // papan pengumuman & papan kapur
  px(924, 16, 32, 24, '#3a2412');
  px(926, 18, 28, 20, '#9a7a4a');
  [
    [928, 20, 8, 6, '#e8e4d8'], [939, 21, 9, 7, '#f4e2a8'], [930, 29, 7, 6, '#e8e4d8'], [941, 30, 10, 6, '#e8e4d8']
  ].forEach(([x, y, w, h, c]) => { px(x, y, w, h, c); px(x + w / 2, y - 1, 1, 2, '#c8283e'); });
  px(1118, 16, 50, 26, '#3a2412');
  px(1120, 18, 46, 22, '#23302a');
  b.font = '5px monospace';
  b.fillStyle = 'rgba(235,235,225,.85)';
  b.font = 'bold 7px monospace';
  b.fillStyle = 'rgba(194,160,107,.5)';
  b.textAlign = 'center';
  b.textAlign = 'left';
}
const trS = {};

function trSnd(k, n, f) {
  if (!trn || Math.abs(n.x - p.x) > 260 || t - (trS[k] || -9) < .3)
    return; trS[k] = t; f();
}
let trT = 0, TAR = [], TBO = [];

function swC(u) {
  if (u < .45) {
    const e = u / .45;
    return [.3 - 2.4 * e * e, -1.5 * e];
  } if (u < .58) {
    const e = (u - .45) / .13;
    return [-2.1 + 3.4 * e, -1.5 + 4.5 * e];
  } if (u < .78) {
    const e = (u - .58) / .2;
    return [1.3, 3 * (1 - e)];
  } const e = (u - .78) / .22; return [1.3 - e, 0];
}

function trHitD(n) {
  const d = n.d; d.tv += n.role == 'spear' ? -6 : -7; d.fl = .1; SFX && trSnd('d' + n.role, n, () => SFX.chop()); for (let i = 0; i < 4; i++)
    dp.push({
      k: 'p', x: d.x - 4, y: d.y - 14 + R() * 8, vx: -20 - R() * 50, vy: -20 - R() * 40, life: .4, max: .4, s: 1.5 + R() * 1.5, c: i % 2 ? '#d8b878' : '#8a6a3a'
    });
}

// ===== AI & ANIMASI NPC CAMP: rute jalan, rutinitas, gestur, gelembung bicara =====
const TWK = 42, pick = a => a[Math.floor(R() * a.length)];
const trMix = (h, z, k) => { const v = parseInt(h.slice(1), 16); return 'rgb(' + [v >> 16, v >> 8 & 255, v & 255].map(c => Math.round(c + (z - c) * k)) + ')'; };
const SAYH = {
  spar: ['Hyaah!', 'Kena!', 'Belum kalah!', 'Lagi!', 'Hup!'], sword: ['Hah!', 'Yaah!', 'Satu lagi!'], spear: ['Hiyaa!', 'Tusuk!', 'Lurus!'],
  bow: ['Tepat sasaran!', 'Meleset sedikit...', 'Satu panah lagi.'], mage: ['Boom!', 'Fokus...', 'Hampir stabil!']
};
const AMB = {
  Rhea: ['Ayo, sekali lagi!', 'Kau makin cepat, Bram.'], Bram: ['Aduh, tanganku...', 'Tunggu, aku belum siap!'],
  Lysa: ['Tarik napas... tahan...', 'Angin hari ini nakal.'], Veyn: ['Hmm, rumusnya begini...', 'Jangan berdiri dekat-dekat, ya.'],
  Darian: ['Seribu tebasan...', 'Pedang ini terasa ringan.'], Hakon: ['Jaga jarak!', 'Tusukan yang bersih.'],
  Gorm: ['Otot tidak datang sendiri.', 'Masih kurang berat!'], Pip: ['Boleh pulang sekarang?', 'Api ini hangat sekali...'],
  Garran: ['Jangan malas, rekrut!', 'Disiplin adalah senjata.']
};
const W_ = d => ({ k: 'work', d }), G_ = (x, y) => ({ k: 'go', x, y }), D_ = (a, d, f, s) => ({ k: 'do', a, d, f, s }), SY_ = { k: 'sync' };

function trRoutine(nm) {
  switch (nm) {
    case 'Rhea': return [SY_, D_('salute', 1.8, 'o'), W_(9.6), G_(718, 112), D_('drink', 2.4), D_('catch', 2.2), G_(752, 104)];
    case 'Bram': return [SY_, D_('salute', 1.8, 'o'), W_(9.6), G_(832, 112), D_('catch', 2.8), D_('drink', 2.0), G_(794, 104)];
    case 'Lysa': return [W_(9.6), D_('wipe', 1.8, 1), G_(838, 306), D_('pull', 2.8, 1), G_(706, 312), D_('stretch', 2.2, 1)];
    case 'Veyn': return [W_(7.6), G_(742, 356), D_('read', 4, 1), G_(706, 352), D_('meditate', 4.5, 1), W_(3.8), D_('sigh', 1.5, 1)];
    case 'Darian': return [
      W_(7.6), D_('wipe', 2, 1), W_(3.8), D_('stretch', 2.4, 1), G_(1118, 192), D_('drink', 2.6, 0, 'Segar...'), G_(1148, 154)
    ];
    case 'Hakon': return [W_(8.8), D_('wipe', 1.6, 1), W_(4.4), G_(1152, 310), D_('drink', 3, 1), G_(1148, 256), D_('stretch', 2, 1)];
    case 'Gorm': return [
      W_(10.2), D_('chalk', 2.2, 1), W_(6.8), D_('wipe', 2.6, 1), G_(1030, 322), G_(1146, 332), D_('drink', 3, 1), G_(1030, 322), G_(1002, 336), D_('stretch', 2, 1)
    ];
    case 'Pip': return [
      D_('sit', 7, 1, 'Hhh...'), D_('stretch', 2.5, 1), G_(1032, 122), D_('warm', 4.5, 1), G_(1030, 106), D_('doze', 6, 1)
    ];
    default: return [
      D_('cross', 3, 1), G_(1120, 205), D_('point', 4.5, 1, ['Tebas dari pinggul!', 'Jangan hanya lengan, pakai kakimu!']), G_(975, 330), D_('cross', 5, 1, 'Satu lagi, Gorm! Jangan menyerah!'), G_(960, 270), G_(800, 262), G_(742, 330), D_('point', 4.5, 1, 'Napas, bidik, lepas!'), G_(800, 240), G_(880, 170), G_(884, 106), D_('cross', 5, -1, ['Rhea! Kuda-kudamu!', 'Bram, angkat pedangmu!']), G_(940, 150), G_(1100, 126), D_('whistle', 3, -1, 'Pip! Berdiri!')
    ];
  }
}

function trSay(n, s, d, f) {
  if (n.say && n.say.t > .8 && !f)
    return; n.say = { s, t: d || 2.2 };
}

function trNext(n) {
  const rt = n.rt, S = rt[n.ri % rt.length];
  n.step = S;
  n.ri++;
  n.lt = 0;
  n.fr = 0;
  n.lu = 0;
  n.wh = 0;
  n.fx = 0;
  if (S.k == 'sync') {
    n.syc++;
    n.sw = 0;
  }
  if (S.k == 'work' && n.role == 'spar')
    n.rc++;
  if (S.s)
    trSay(n, Array.isArray(S.s) ? pick(S.s) : S.s, 2.8, 1);
}

function trInit() {
  TN.forEach((n, i) => {
    n.nm = n.n.split(',')[0]; n.rt = trRoutine(n.nm); n.ri = 0; n.syc = 0; n.rc = 0; n.sit = 0; n.mv = 0; n.ws = R() * 6; n.say = null; n.sayT = 3 + R() * 10; n.jog = 0; n.jc = 0; n.cnt = 60 + Math.floor(R() * 20); n.sw = 0; n.lt = 0; if (n.role == 'boss') {
      n.x = 1100;
      n.y = 122;
    } trNext(n); n.lt = n.role == 'spar' ? 0 : n.ph * 1.7;
  });
}

function trFace(n, f) {
  if (f === 'o')
    f = Math.sign(n.o.x - n.x) || n.fc;
  else if (f === 'p' || !f)
    f = (dist(n, p) < 120 && Math.abs(p.x - n.x) > 4) ? Math.sign(p.x - n.x) : n.fc;
  if (f)
    n.fc = f;
}

function trAI(n, dt) {
  const S = n.step, o = n.o, talk = dlg && dlg.n === n, hold = talk || (o && n.role == 'spar' && dlg && dlg.n === o), boss = TN[TN.length - 1];
  if (n.say && (n.say.t -= dt) <= 0)
    n.say = null;
  n.jc = Math.max(0, n.jc - dt);
  n.sayT -= dt;
  n.mv = 0;
  const sitting = S.k == 'do' && (S.a == 'sit' || S.a == 'doze' || S.a == 'meditate') && n.jog <= 0;
  n.sit = Math.max(0, Math.min(1, n.sit + (sitting ? dt * 3 : -dt * 3)));
  if (talk) {
    trFace(n, 'p');
    return;
  }
  if (hold)
    return;
  if (n.sayT <= 0) {
    n.sayT = 10 + R() * 14;
    if (!n.say && dist(n, p) < 240 && AMB[n.nm])
      trSay(n, pick(AMB[n.nm]), 2.6);
  }
  if (n.role == 'rest' && !n.jog && !n.jc && dist(n, boss) < 78) {
    n.jog = 3.2;
    n.jc = 30;
    trSay(n, 'S-siap, Pak!', 2.2, 1);
  }
  if (n.jog > 0) {
    n.jog -= dt;
    if (n.sit > 0)
      return;
    n.mv = 1;
    n.ws += dt * 15;
    trFace(n, boss.x < n.x ? -1 : 1);
    return;
  }
  if (n.sit > 0 && !sitting)
    return;
  if (S.k == 'go') {
    const dx = S.x - n.x, dy = S.y - n.y, d = Math.hypot(dx, dy), st = TWK * dt;
    if (d <= st + .5) {
      n.x = S.x;
      n.y = S.y;
      trNext(n);
    } else {
      n.x += dx / d * st;
      n.y += dy / d * st;
      if (Math.abs(dx) > 1.5)
        n.fc = dx > 0 ? 1 : -1;
      n.mv = 1;
      n.ws += st * .5;
    }
    return;
  }
  if (S.k == 'sync') {
    trFace(n, 'o');
    n.sw += dt;
    if (o.syc >= n.syc || n.sw > 6)
      trNext(n);
    return;
  }
  n.lt += dt;
  if (S.k == 'work') {
    const T = n.d || n.tg || (n.role == 'mage' ? TT[1] : null) || (n.role == 'spar' ? o : null);
    if (T)
      n.fc = Math.sign(T.x - n.x) || n.fc;
  } else
    trFace(n, S.f);
  if (n.lt >= S.d)
    trNext(n);
}
const sparPh = (m, u) => { const s2 = m.side ^ (m.rc & 1), at = s2 ? u >= .5 : u < .5; return at ? (u - (s2 ? .5 : 0)) * 2 : -1; };

function trPose(n) {
  const S = n.step, role = n.role, lt = n.lt, tk = t + n.ph, wk = S.k == 'work', ac = S.k == 'do' ? S.a : '', u = S.d ? Math.min(1, lt / S.d) : 0, fc = n.fc, P = {
    a: 1.45, b: 1.4, lean: 0, dy: 0, item: null, ir: 0, draw: 0, nock: 0, cast: 0, bar: 0, lf: 0, lb: 0, lF: 0, lB: 0, hy: 0, cross: 0, both: 0, pull: 0, ox: 0, float: 0, eyes: 0, z: 0, mouth: 0, prop: null, orb: 0
  };
  const cr = {
    spar: ['wood', 1, 1.1], spear: ['spear', .8, -1.5708], bow: ['bow', 1.1, 0], mage: ['staff', .9, -1.5708], boss: ['clip', 1.15, 0]
  }[role], sw = Math.sin(n.ws);
  if (cr) {
    P.item = cr[0];
    P.a = cr[1];
    P.ir = cr[2];
  }
  if (n.mv) {
    P.lf = sw * 3.4;
    P.lb = -sw * 3.4;
    P.lF = Math.max(0, Math.cos(n.ws)) * 2;
    P.lB = Math.max(0, -Math.cos(n.ws)) * 2;
    P.dy = -Math.abs(sw) * 1.3;
    P.b = 1.4 + sw * .6;
    if (!cr)
      P.a = 1.45 - sw * .6;
    P.lean = 1;
  }
  if (n.jog > 0 && n.sit <= 0) {
    P.a = .6 - sw * .9;
    P.b = .6 + sw * .9;
    P.dy = -Math.abs(sw) * 2.2;
    P.mouth = 2;
  }
  if (wk) {
    if (role == 'sword') {
      const w = (lt % 1.9) / 1.9;
      [P.a, P.lean] = swC(w);
      P.item = 'sword';
      P.ir = P.a;
      P.lf = P.lean * .7;
      P.lb = -P.lean * .5;
      P.b = 1.3 + P.lean * .12;
      P.mouth = w > .5 && w < .66 ? 2 : 0;
      if (n.lu < .56 && w >= .56) {
        trHitD(n);
        if (R() < .4)
          trSay(n, pick(SAYH.sword), 1.2);
      }
      n.lu = w;
    } else if (role == 'spear') {
      const w = (lt % 2.2) / 2.2;
      P.a = .05;
      P.lean = w < .4 ? -3 * (w / .4) : w < .5 ? -3 + 9 * ((w - .4) / .1) : w < .7 ? 6 : 6 * (1 - (w - .7) / .3);
      P.item = 'spear';
      P.ir = P.a;
      P.both = 1;
      P.b = .05;
      P.lf = P.lean * .6;
      P.lb = -P.lean * .4;
      P.mouth = w > .44 && w < .66 ? 2 : 0;
      if (n.lu < .46 && w >= .46) {
        trHitD(n);
        if (R() < .4)
          trSay(n, pick(SAYH.spear), 1.2);
      }
      n.lu = w;
    } else if (role == 'spar') {
      const w = (lt % 3.2) / 3.2, o = n.o, uu = sparPh(n, w), ou = sparPh(o, w);
      P.item = 'wood';
      if (uu >= 0) {
        [P.a, P.lean] = swC(uu);
        P.ir = P.a;
        const f = uu < .45 ? -2 * (uu / .45) : uu < .58 ? -2 + 8 * ((uu - .45) / .13) : uu < .78 ? 6 : 6 * (1 - (uu - .78) / .22);
        P.ox = fc * f;
        P.lf = f * .5;
        P.lb = -f * .35;
        P.mouth = uu > .5 && uu < .66 ? 2 : 0;
        if (n.lu < .56 && uu >= .56) {
          const mx = (n.x + o.x) / 2, my = n.y - 16;
          trSnd('clash', n, () => SFX.swing(1));
          fx.push({ k: 'ring', x: mx, y: my, r: 9, life: .18, max: .18, col: '#fff6c8' });
          for (let i = 0; i < 7; i++) {
            const a = R() * 6.283;
            dp.push({
              k: 'p', x: mx, y: my, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 20, life: .3, max: .3, s: 1.5, c: i % 2 ? '#fff' : '#ffd34d'
            });
          }
          if (R() < .5)
            trSay(n, pick(SAYH.spar), 1.2, 1);
        }
        n.lu = uu;
      } else {
        n.lu = 0;
        P.a = -.6 + Math.sin(tk * 5) * .08;
        P.ir = P.a;
        P.b = 1.0;
        if (ou > .35 && ou < .8) {
          P.a = -1.0 + (ou > .58 ? .35 : 0);
          P.ir = P.a - .2;
        }
        const bk = ou < .5 ? 0 : ou < .65 ? 5 * ((ou - .5) / .15) : ou < 1 ? 5 * (1 - (ou - .65) / .35) : 0;
        P.ox = -fc * Math.max(0, bk);
        P.lean = ou > .56 ? -2 : 0;
        P.lf = -P.ox * fc * .3;
      }
      P.lb = P.lb || 0;
    } else if (role == 'bow') {
      const w = (lt % 3.2) / 3.2;
      P.a = -.05;
      P.ir = -.05;
      P.item = 'bow';
      P.pull = 1;
      P.draw = w < .12 ? 0 : w < .65 ? (w - .12) / .53 : w < .72 ? 1 : Math.max(0, 1 - (w - .72) * 8);
      P.nock = w > .12 && w < .72 || w > .88;
      P.lean = -P.draw * 1.5;
      P.lb = -2;
      P.lf = 2;
      if (w < .1)
        n.fr = 0;
      if (!n.fr && w >= .72) {
        n.fr = 1;
        trSnd('bow', n, () => SFX.shot(0));
        TAR.push({ x0: n.x + 16 * fc, y0: n.y - 9, t0: t, tb: n.tg, n });
      }
    } else if (role == 'mage') {
      const w = (lt % 3.8) / 3.8, c = w < .2 ? 0 : w < .6 ? (w - .2) / .4 : w < .72 ? Math.max(0, 1 - (w - .6) * 8) : 0;
      P.cast = c;
      P.a = .55 - c * 1.1;
      P.item = 'staff';
      P.ir = -1.5708;
      P.b = .9 - c * 1.1;
      P.both = c > 0 ? 1 : 0;
      P.orb = c;
      if (w < .1)
        n.fr = 0;
      if (!n.fr && w >= .62) {
        n.fr = 1;
        TBO.push({ x0: n.x + fc * (5 + 9 * Math.cos(P.a)), y0: n.y - 32, t0: t, tb: TT[1], n });
        trSay(n, pick(SAYH.mage), 1.2);
      }
    } else if (role == 'lift') {
      const w = (lt % 3.4) / 3.4;
      P.bar = w < .2 ? 0 : w < .45 ? 16 * ((w - .2) / .25) : w < .65 ? 16 + Math.sin(lt * 30) * .4 : 16 - 16 * Math.min(1, (w - .65) / .25);
      P.dy = w < .2 ? 3 * (w / .2) : w < .45 ? 3 * (1 - (w - .2) / .25) : 0;
      P.lift = 1;
      P.mouth = w > .3 && w < .65 ? 2 : 0;
      P.lean = -P.bar * .05;
      if (n.lu < .45 && w >= .45)
        trSay(n, '' + (++n.cnt), 1.3, 1);
      n.lu = w;
      if (w > .45 && w < .6 && R() < .12)
        dp.push({ k: 'p', x: n.x + 5, y: n.y - 24, vx: (R() - .5) * 20, vy: 20, life: .5, max: .5, s: 1.5, c: '#bfe4ff' });
    }
  } else
    switch (ac) {
      case 'drink': {
        const k = Math.max(0, Math.min(1, lt / .5, (S.d - lt) / .5));
        P.item = 'flask';
        P.a = 1.2 - 2.45 * k;
        P.ir = 1.2 - 3.9 * k + Math.sin(lt * 3) * .1 * k;
        P.hy = -k;
        P.eyes = k > .6 ? 1 : 0;
        break;
      }
      case 'wipe': {
        const k = Math.min(1, lt / .4);
        P.item = null;
        P.a = 1.45 - 3.45 * k + (lt > .4 ? Math.sin(lt * 9) * .18 : 0);
        P.eyes = lt > .4 ? 1 : 0;
        if (R() < .05)
          dp.push({ k: 'p', x: n.x + fc * 4, y: n.y - 12, vx: fc * 6, vy: 10, life: .5, max: .5, s: 1.5, c: '#bfe4ff' });
        break;
      }
      case 'stretch': {
        const s = Math.sin(u * Math.PI);
        P.item = null;
        P.a = 1.45 - 2.95 * s;
        P.b = 1.4 - 3.1 * s;
        P.lean = -s * 1.5;
        P.dy = -s;
        P.eyes = s > .6 ? 1 : 0;
        P.mouth = s > .55 ? 2 : 0;
        break;
      }
      case 'catch': {
        const k = Math.min(1, lt / .4);
        P.lean = 2.5 * k;
        P.dy = 2 * k + Math.sin(lt * 9) * .7;
        P.a = 1.15;
        P.b = 1.05;
        P.hy = 2 * k;
        P.mouth = 2;
        P.eyes = 1;
        if (R() < .08)
          dp.push({ k: 'p', x: n.x + fc * 5, y: n.y - 14, vx: fc * 8, vy: 14, life: .5, max: .5, s: 1.5, c: '#bfe4ff' });
        break;
      }
      case 'salute': {
        const k1 = Math.min(1, lt / .4), k3 = u > .8 ? (u - .8) / .2 : 0, k = k1 * (1 - k3);
        P.a = 1 - 1.9 * k;
        P.ir = 1.1 - 2.67 * k;
        P.lean = u > .55 && u < .85 ? 2.5 * Math.sin((u - .55) / .3 * Math.PI) : 0;
        P.hy = P.lean > 0 ? 1 : 0;
        break;
      }
      case 'chalk': {
        const k = Math.cos(lt * 9);
        P.both = 1;
        P.a = .4 - k * .25;
        P.b = .4 + k * .25;
        if (R() < .06)
          puff(n.x + fc * 9, n.y - 4, 1, '235,235,230', .5);
        break;
      }
      case 'warm':
        P.item = null;
        P.both = 1;
        P.a = .05 + Math.sin(lt * 6) * .08;
        P.b = .15 + Math.cos(lt * 6) * .08;
        P.lean = 1;
        break;
      case 'sit':
        P.item = null;
        P.a = 1.2 + Math.sin(tk * .8) * .05;
        P.b = 1.1;
        P.hy = Math.sin(lt * .9) > .85 ? 1 : 0;
        break;
      case 'doze':
        P.item = null;
        P.a = 1.2;
        P.b = 1.1;
        P.hy = 2 + Math.sin(tk * 1.1) * 1.5;
        P.eyes = 1;
        P.z = 1;
        P.lean = 1;
        break;
      case 'meditate':
        P.item = null;
        P.both = 1;
        P.a = .3;
        P.b = .35;
        P.float = 3 + Math.sin(tk * 1.6) * 1.2;
        P.eyes = 1;
        P.orb = .7;
        break;
      case 'point':
        P.item = null;
        P.a = -.12 + Math.sin(lt * 4) * .04;
        P.b = 2.3;
        break;
      case 'cross':
        P.item = null;
        P.cross = 1;
        P.dy = Math.sin(tk * 1.4) * .4;
        break;
      case 'whistle': {
        const k = Math.min(1, lt / .3);
        P.item = null;
        P.a = 1.15 - 2.45 * k;
        P.hy = -1;
        if (lt > .4 && !n.wh) {
          n.wh = 1;
          fx.push({ k: 'ring', x: n.x + fc * 9, y: n.y - 14, r: 6, life: .4, max: .4, col: '#fff6c8' });
          trSnd('wh', n, () => SFX.point());
        }
        break;
      }
      case 'read':
        P.item = 'book';
        P.a = .25 + Math.sin(tk * 1.2) * .03;
        P.b = 1.1;
        P.hy = 1.5;
        P.eyes = 2;
        break;
      case 'pull':
        P.item = null;
        P.lean = 2 + Math.sin(lt * 6) * 1.2;
        P.a = .1 - Math.abs(Math.sin(lt * 3)) * .4;
        if (u > .5 && !n.fx) {
          n.fx = 1;
          n.tg.st.length = 0;
          puff(n.tg.x - 6, n.tg.y, 1, '200,180,140', .4);
        }
        break;
      case 'sigh':
        P.dy += Math.sin(lt * 3) * .8;
        P.hy = -Math.sin(u * Math.PI);
        break;
    }
  if (cr && role != 'boss' && P.item != cr[0] && !(wk && role != 'sword'))
    P.prop = cr[0];
  if (n.sit > 0)
    P.dy += 3 * n.sit;
  if (P.float)
    P.dy -= P.float;
  return P;
}

function trMan(n) {
  const P = trPose(n), tk = t + n.ph, x = Math.round(n.x + P.ox), y = Math.round(n.y), fc = n.fc, role = n.role, nm = n.nm, sk = n.sk, talk = dlg && dlg.n === n, open = (n.say && Math.floor(tk * 9) % 2) || talk && (!(dlg.len > 0) || dlg.c < dlg.len) && Math.floor(tk * 9) % 2 || P.mouth == 2, look = (p.x - n.x) * fc > -4 ? 1 : 0, blink = P.eyes == 1 || (tk % 4.3) < .13, big = role == 'lift', hw = big ? 9 : 7, SH = 'rgba(0,0,0,.24)', HL = 'rgba(255,255,255,.16)', OL = '#120e18', dsk = trMix(sk, 0, .32), sl = big ? sk : n.c1, aw = big ? 4 : 3, sit = n.sit, mv = n.mv, bt = '#241a14', Q = [], hy = Math.round(P.hy), c1 = n.c1, c2 = n.c2, c3 = n.c3, hair = n.hair;
  const r = (a, b, w, h, c, o) => Q.push([0, a, b, w, h, c, o !== 0]), rh = (a, b, w, h, c, o) => r(a, b + hy, w, h, c, o), sg = (x1, y1, x2, y2, w, c) => Q.push([1, x1, y1, x2, y2, w, c]);
  const sgd = (q, w, c, pd) => { const dx = q[3] - q[1], dy = q[4] - q[2], l = Math.hypot(dx, dy); g.save(); g.translate(q[1], q[2]); g.rotate(Math.atan2(dy, dx)); g.fillStyle = c; g.fillRect(-pd, -w / 2, l + 2 * pd, w); g.restore(); };
  const fl = () => {
    g.fillStyle = OL; Q.forEach(q => {
      if (q[0] == 0) {
        if (q[6])
          g.fillRect(q[1] - 1, q[2] - 1, q[3] + 2, q[4] + 2);
      } else
        sgd(q, q[5] + 2, OL, 1);
    }); Q.forEach(q => {
      if (q[0] == 0) {
        g.fillStyle = q[5];
        g.fillRect(q[1], q[2], q[3], q[4]);
      } else
        sgd(q, q[5], q[6], 0);
    }); Q.length = 0;
  };
  const arm = (sx, sy, a, col) => { const hx = sx + Math.cos(a) * 9, hy2 = sy + Math.sin(a) * 9; sg(sx, sy, hx - Math.cos(a) * 1.5, hy2 - Math.sin(a) * 1.5, aw, col); r(Math.round(hx - 2), Math.round(hy2 - 2), 3, 3, sk); return [hx, hy2]; };
  const arm2 = (sx, sy, tx, ty, side, col) => {
    let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy); if (d > 17.6) {
      dx *= 17.6 / d;
      dy *= 17.6 / d;
      d = 17.6;
    } const ah = d / 2, h = Math.sqrt(Math.max(0, 81 - ah * ah)), ux = dx / d, uy = dy / d, ex = sx + ux * ah - uy * h * side, ey = sy + uy * ah + ux * h * side; sg(sx, sy, ex, ey, aw, col); sg(ex, ey, sx + dx, sy + dy - 1, aw, col); r(Math.round(sx + dx - 2), Math.round(sy + dy - 2), 3, 3, sk);
  };
  // ---------- barang (digambar langsung) ----------
  const rc = (a, b, w, h, c) => { g.fillStyle = OL; g.fillRect(a - 1, b - 1, w + 2, h + 2); g.fillStyle = c; g.fillRect(a, b, w, h); };
  const item = (k, hx, hy2, ir) => {
    g.save();
    g.translate(hx, hy2);
    g.rotate(ir);
    if (k == 'sword' || k == 'wood') {
      const wd = k == 'wood';
      rc(-3, -1.5, 4, 3, '#5b3b2b');
      rc(0, -4, 2, 8, '#c2a06b');
      rc(2, -1.5, 17, 3, wd ? '#b89560' : '#cfd6e2');
      g.fillStyle = wd ? 'rgba(255,235,180,.35)' : 'rgba(255,255,255,.35)';
      g.fillRect(3, -1, 15, 1);
      if (wd) {
        g.fillStyle = 'rgba(80,50,20,.5)';
        g.fillRect(8, -1, 1, 3);
        g.fillRect(13, -1, 1, 3);
      }
    } else if (k == 'spear') {
      rc(-10, -1, 42, 2, '#8a6038');
      rc(31, -2.5, 7, 5, '#cfd6e2');
      g.fillStyle = '#c8283e';
      const fw = Math.sin(t * 6 + n.ph) * 1.2;
      g.beginPath();
      g.moveTo(27, -1);
      g.lineTo(27, 1);
      g.lineTo(19, 3 + fw);
      g.lineTo(19, -1 + fw);
      g.fill();
    } else if (k == 'staff') {
      rc(-12, -1.5, 34, 3, '#6b4d33');
      rc(8, -2, 3, 4, '#c2a06b');
      g.fillStyle = '#c9a0ff';
      g.beginPath();
      g.arc(24, 0, 3, 0, 7);
      g.fill();
      g.save();
      g.globalCompositeOperation = 'lighter';
      const rr = 7 + 11 * P.cast + Math.sin(t * 8) * 1.2, q = g.createRadialGradient(24, 0, 0, 24, 0, rr);
      q.addColorStop(0, 'rgba(230,200,255,.9)');
      q.addColorStop(1, 'rgba(150,80,255,0)');
      g.fillStyle = q;
      g.fillRect(24 - rr, -rr, rr * 2, rr * 2);
      g.restore();
    } else if (k == 'bow') {
      const px2 = -8 * P.draw;
      g.lineCap = 'round';
      g.strokeStyle = OL;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(0, -13);
      g.quadraticCurveTo(8, 0, 0, 13);
      g.stroke();
      g.strokeStyle = '#9b6842';
      g.lineWidth = 2;
      g.stroke();
      g.strokeStyle = '#e8e0c8';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, -13);
      g.lineTo(px2, 0);
      g.lineTo(0, 13);
      g.stroke();
      if (P.nock) {
        g.fillStyle = '#d8c9a0';
        g.fillRect(px2, -.5, 17, 1.5);
        g.fillStyle = '#cfd6e2';
        g.fillRect(px2 + 17, -1.5, 3, 3);
        g.fillStyle = '#c8283e';
        g.fillRect(px2 - 1, -1.5, 3, 3);
      }
      g.lineCap = 'butt';
    } else if (k == 'flask') {
      rc(-2, -2.5, 6, 5, '#6a4a2a');
      rc(4, -1.5, 2, 3, '#c2a06b');
      g.fillStyle = '#d8c9a0';
      g.fillRect(0, -2.5, 2, 5);
    } else if (k == 'book') {
      rc(-1, -6, 9, 8, '#8a2f3f');
      g.fillStyle = '#e8dcc0';
      g.fillRect(0, -5, 7, 6);
      g.fillStyle = 'rgba(80,60,40,.5)';
      g.fillRect(1, -4, 5, 1);
      g.fillRect(1, -2, 5, 1);
      g.fillRect(1, 0, 4, 1);
    } else if (k == 'clip') {
      rc(-1, -4, 5, 9, '#8a6a3a');
      g.fillStyle = '#e8e4d8';
      g.fillRect(0, -3, 3, 7);
      g.fillStyle = 'rgba(60,40,30,.5)';
      g.fillRect(0, -2, 3, 1);
      g.fillRect(0, 0, 3, 1);
    }
    g.restore();
  };
  g.save();
  g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.beginPath();
  g.ellipse(0, 8, (big ? 11 : 9) - P.float * .6, 3 - P.float * .2, 0, 0, 7);
  g.fill();
  g.scale(fc, 1);
  g.translate(Math.round(P.lean), Math.round(P.dy + Math.sin(tk * 1.8) * .5));
  // ---------- lapisan belakang ----------
  if (P.prop)
    item(P.prop, -13, P.prop == 'wood' ? -6 : P.prop == 'bow' ? -3 : -2, P.prop == 'wood' ? 1.5708 : P.prop == 'bow' ? 0 : -1.5708);
  const sway = Math.round(Math.sin(tk * 2.2) * 1 + (mv ? -2 : 0));
  if (role == 'boss') {
    r(-11 + sway, -12, 6, 19, '#1f2a1c');
    r(-11 + sway, 5, 6, 2, '#12190f', 0);
    r(-10 + sway, -11, 1, 17, 'rgba(255,255,255,.08)', 0);
  }
  if (role == 'bow') {
    r(-10, -15, 4, 14, '#6b4a2a');
    r(-10, -16, 4, 2, '#d8c9a0', 0);
    r(-10, -19, 1, 4, '#c8283e', 0);
    r(-8, -20, 1, 5, '#e8e4d8', 0);
    r(-7, -18, 1, 3, '#c8283e', 0);
    r(-10, -7, 4, 1, '#3a2412', 0);
  }
  if (nm == 'Darian') {
    r(-13, 0, 10, 2, '#2a1c12');
    r(-14, -1, 2, 4, '#c2a06b', 0);
  }
  if (role == 'spear') {
    const fw = Math.round(Math.sin(tk * 5) * 1 + (mv ? -2 : 0));
    r(-9 + fw, -11, 3, 7, '#c8283e');
    r(-10 + fw, -5, 3, 3, '#9a1f35', 0);
  }
  if (big) {
    r(-5, -12, 5, 3, '#e8e4d8', 0);
    r(-5, -10, 2, 7, '#e8e4d8', 0);
    r(-4, -5, 1, 1, '#c9c4b8', 0);
  }
  if (!P.both && !P.cross && !(P.lift))
    arm(-5, -8, P.b, sl);
  if (P.lift) { }
  fl();
  // ---------- kaki ----------
  if (role == 'mage') {
    if (P.float > 1) {
      r(-8, 4, 16, 3, c1);
      r(-7, 3, 4, 3, c1);
      r(3, 3, 4, 3, c1);
      r(-5, 6, 4, 2, bt);
      r(2, 6, 4, 2, bt);
    } else if (sit > .5) {
      r(-9, 4, 18, 5, c1);
      r(-9, 8, 18, 1, c2, 0);
      r(7, 7, 4, 2, bt);
    } else {
      const sk2 = Math.round(P.lf * .3);
      r(-8 - sk2, 2, 16, 7, c1);
      r(-8 - sk2, 8, 16, 1, c2, 0);
      r(-3 - sk2, 3, 1, 5, SH, 0);
      r(3 - sk2, 3, 1, 5, SH, 0);
      r(-5 + Math.round(P.lb * .6), 8, 4, 2, bt);
      r(2 + Math.round(P.lf * .6), 8, 4, 2, bt);
    }
  } else if (P.float > 1) {
    r(-8, 4, 16, 3, c3);
    r(-7, 3, 4, 3, c3);
    r(3, 3, 4, 3, c3);
    r(-5, 6, 4, 2, bt);
    r(2, 6, 4, 2, bt);
  } else if (sit > .5) {
    r(-6, 3, 12, 4, c3);
    r(2, 5, 6, 3, c3);
    r(5, 6, 5, 3, bt);
    r(-5, 5, 4, 3, trMix(c3, 0, .25));
  } else {
    const lb = Math.round(P.lb), lf = Math.round(P.lf), lB = Math.round(P.lB), lF = Math.round(P.lF);
    r(-5 + (lb >> 1), 2, 4, 6 - lB, trMix(c3, 0, .2));
    r(-6 + lb, 6 - lB, 5, 3, bt);
    r(1 + (lf >> 1), 2, 4, 6 - lF, c3);
    r(1 + lf, 6 - lF, 5, 3, bt);
    r(2 + lf, 6 - lF, 3, 1, '#4a3a2c', 0);
  }
  if (nm == 'Garran' || nm == 'Hakon') { /* pelindung lutut */
    if (sit < .5 && !P.float)
      r(1 + (Math.round(P.lf) >> 1), 3, 4, 2, '#6a6f7c', 0);
  }
  fl();
  // ---------- badan ----------
  r(-hw, -10, hw * 2, 13, c1);
  r(hw - 3, -9, 3, 11, SH, 0);
  r(-hw + 1, -9, 2, 9, HL, 0);
  if (role != 'mage') {
    r(-hw, 0, hw * 2, 2, c2);
    r(-1, 0, 2, 2, '#f4e2a8', 0);
  } else {
    r(-hw, 0, hw * 2, 2, c2);
    r(-1, 0, 2, 2, '#f4e2a8', 0);
    r(5, 1, 4, 4, '#6b4a2a');
    r(-9, 0, 3, 5, '#8a2f3f');
  }
  if (role == 'mage') {
    r(-2, -7, 1, 3, c2, 0);
    r(1, -6, 2, 1, c2, 0);
    r(0, -4, 1, 2, c2, 0);
    r(-4, -9, 8, 1, c2, 0);
  }
  if (role == 'spar') {
    r(-hw + 2, -8, hw * 2 - 4, 1, SH, 0);
    r(-hw + 2, -5, hw * 2 - 4, 1, SH, 0);
    r(-hw + 2, -2, hw * 2 - 4, 1, SH, 0);
    r(-3, -10, 6, 2, c2, 0);
  }
  if (role == 'bow') {
    r(-6, -9, 2, 2, '#6b4a2a', 0);
    r(-4, -7, 2, 2, '#6b4a2a', 0);
    r(-2, -5, 2, 2, '#6b4a2a', 0);
    r(0, -3, 2, 2, '#6b4a2a', 0);
  }
  if (nm == 'Darian') {
    r(-6, -9, 3, 6, '#8a909e', 0);
    r(2, -12, 7, 4, '#8a909e');
    r(2, -12, 7, 1, '#c0c6d2', 0);
    r(-7, -5, 14, 2, c2, 0);
  }
  if (role == 'spear') {
    r(-hw, -6, hw * 2, 1, '#4a3020', 0);
    r(-hw, -3, hw * 2, 1, '#4a3020', 0);
    r(-2, -10, 4, 13, '#5a3a22', 0);
    r(2, -12, 6, 3, '#e8e4d8');
  }
  if (big) {
    r(-hw, -1, hw * 2, 4, '#6b4a2a');
    r(-2, -8, 4, 1, SH, 0);
    r(-hw + 2, -9, 2, 4, HL, 0);
    r(hw - 5, -9, 4, 3, 'rgba(255,255,255,.1)', 0);
  }
  if (role == 'rest') {
    r(-3, -6, 4, 4, '#8a6a3a', 0);
    r(-3, -6, 4, 1, 'rgba(0,0,0,.25)', 0);
    r(5, 0, 3, 5, '#6a4a2a');
    r(-hw, 2, 3, 1, c1, 0);
    r(0, 3, 4, 1, c1, 0);
  }
  if (role == 'boss') {
    r(-9, -12, 6, 4, '#3a4a34');
    r(3, -12, 6, 4, '#3a4a34');
    r(-9, -12, 6, 1, c2, 0);
    r(3, -12, 6, 1, c2, 0);
    r(-4, -7, 2, 2, c2, 0);
    r(0, -7, 2, 2, '#c8283e', 0);
    r(-1, -10, 1, 6, '#e8e4d8', 0);
    r(-1, -4, 3, 2, '#c0c6d2', 0);
    r(-hw, 0, hw * 2, 3, '#3a2412');
    r(-2, 0, 4, 3, c2, 0);
  }
  fl();
  // ---------- kepala ----------
  rh(-4, -20, 8, 8, sk);
  rh(2, -19, 2, 7, SH, 0);
  rh(-4, -19, 1, 5, HL, 0);
  rh(4, -16, 1, 2, sk);
  rh(-3, -17, 2, 3, dsk, 0);
  if (blink)
    rh(0, -16, 3, 1, dsk, 0);
  else {
    rh(0, -17, 2, 2, '#f4eee8', 0);
    rh(P.eyes == 2 ? 1 : look, -17 + (P.eyes == 2 ? 1 : 0), 1, 1, '#2a1a14', 0);
    if (P.eyes == 2)
      rh(1, -16, 1, 1, '#2a1a14', 0);
  }
  rh(0, -19, 3, 1, (nm == 'Garran') ? '#9a9aa8' : hair, 0);
  rh(1, -13, open ? 3 : 2, open ? 2 : 1, open ? '#5a2020' : dsk, 0);
  if (nm == 'Rhea') {
    rh(-5, -23, 10, 4, hair);
    rh(-6, -21, 3, 7, hair);
    rh(-5, -21, 10, 2, c2);
    const pw = Math.round(Math.sin(tk * 3 + 1) * 1 + (mv ? -2 : 0));
    rh(-9 + pw, -20, 4, 3, hair);
    rh(-10 + pw, -18, 3, 6, hair);
    rh(1, -15, 2, 1, 'rgba(255,120,120,.3)', 0);
  } else if (nm == 'Bram') {
    rh(-5, -23, 10, 4, hair);
    rh(-5, -21, 2, 5, hair);
    rh(-4, -25, 2, 2, hair);
    rh(0, -25, 3, 2, hair);
    rh(2, -23, 3, 2, hair);
    rh(2, -15, 1, 2, '#a86a5a', 0);
    rh(-5, -21, 10, 1, c2, 0);
  } else if (nm == 'Lysa') {
    rh(-6, -24, 11, 5, c1);
    rh(-6, -20, 3, 8, c1);
    rh(-5, -19, 10, 1, c2, 0);
    rh(2, -29, 2, 6, '#c8283e', 0);
    rh(3, -27, 2, 3, '#e8e4d8', 0);
    const bw = Math.round(Math.sin(tk * 2.5) * 1 + (mv ? -2 : 0));
    rh(-7 + bw, -18, 3, 6, hair);
    rh(-8 + bw, -12, 3, 5, hair);
    rh(-8 + bw, -8, 2, 3, '#c8283e', 0);
    rh(1, -15, 2, 1, 'rgba(255,120,120,.3)', 0);
  } else if (nm == 'Veyn') {
    rh(-7, -22, 14, 3, c1);
    rh(-5, -26, 10, 4, c1);
    rh(-3, -30, 6, 4, c1);
    rh(-7, -22, 14, 1, c2, 0);
    rh(-1, -28, 2, 2, '#ffe9a8', 0);
    rh(-6, -19, 3, 8, hair);
    rh(-5, -13, 2, 3, hair);
    rh(0, -18, 4, 3, 'rgba(180,140,255,.25)', 0);
    rh(-1, -18, 5, 1, '#c2a06b', 0);
    rh(3, -18, 1, 3, '#c2a06b', 0);
    rh(-1, -16, 5, 1, '#c2a06b', 0);
  } else if (nm == 'Darian') {
    rh(-5, -23, 10, 3, hair);
    rh(-5, -21, 2, 4, hair);
    rh(-5, -21, 10, 2, '#c8283e');
    rh(-5, -21, 10, 1, '#ff6a80', 0);
    const hb = Math.round(Math.sin(tk * 4) * 1 + (mv ? -2 : 0));
    rh(-9 + hb, -20, 4, 2, '#c8283e');
    rh(-10 + hb, -18, 3, 3, '#9a1f35');
    rh(-3, -14, 7, 2, 'rgba(30,20,20,.45)', 0);
  } else if (nm == 'Hakon') {
    rh(-5, -23, 10, 4, hair);
    rh(-5, -21, 2, 6, hair);
    const pt = Math.round(Math.sin(tk * 2.5) * 1 + (mv ? -2 : 0));
    rh(-8 + pt, -21, 4, 3, hair);
    rh(-9 + pt, -19, 3, 7, hair);
    rh(-5, -21, 10, 1, '#c8283e', 0);
    r(-5, -12, 10, 3, '#c8283e', 0);
    rh(-2, -14, 6, 2, 'rgba(180,150,90,.55)', 0);
  } else if (nm == 'Gorm') {
    rh(-4, -22, 8, 2, hair);
    rh(-5, -21, 10, 2, '#e8e4f0');
    rh(-5, -20, 10, 1, 'rgba(0,0,0,.2)', 0);
    rh(-3, -14, 7, 4, hair);
    rh(0, -19, 4, 1, hair, 0);
    rh(-4, -20, 8, 1, 'rgba(255,255,255,.2)', 0);
  } else if (nm == 'Pip') {
    rh(-6, -24, 12, 4, c1);
    rh(-6, -21, 3, 6, hair);
    rh(0, -21, 7, 2, c1);
    rh(5, -20, 3, 2, trMix(c1, 0, .3), 0);
    rh(-1, -26, 3, 2, c2, 0);
    rh(2, -16, 3, 1, '#e8e4d8', 0);
    rh(1, -15, 1, 1, '#a86a5a', 0);
    rh(3, -14, 1, 1, '#a86a5a', 0);
  } else if (nm == 'Garran') {
    rh(-6, -24, 12, 4, c1);
    rh(-1, -23, 3, 2, c2, 0);
    rh(-5, -21, 10, 1, '#12190f', 0);
    rh(-5, -20, 2, 5, '#9a9aa8');
    rh(-4, -14, 9, 6, '#9a9aa8');
    rh(-3, -9, 7, 3, '#9a9aa8');
    rh(-2, -8, 4, 1, '#c6c6d2', 0);
    rh(0, -15, 4, 1, '#c6c6d2', 0);
    rh(0, -18, 1, 5, '#8a4a4a', 0);
    rh(1, -13, open ? 3 : 2, open ? 2 : 1, open ? '#5a2020' : '#6a6a78', 0);
  }
  fl();
  // ---------- lengan depan & barang ----------
  if (P.cross) {
    r(-6, -7, 12, 3, sl);
    r(3, -7, 4, 3, sk, 0);
    r(-6, -7, 12, 1, HL, 0);
  } else if (P.lift) {
    const yb = -12 - P.bar;
    arm2(-4, -8, -7, yb + 1, -1, sl);
    arm2(5, -8, 3, yb + 1, 1, sl);
    fl();
    g.save();
    g.translate(-5, yb);
    rc(-24, -1, 38, 3, '#9aa0ae');
    rc(-27, -8, 4, 17, '#3a3d48');
    rc(13, -8, 4, 17, '#3a3d48');
    rc(-22, -6, 2, 13, '#6a6f7c');
    rc(10, -6, 2, 13, '#6a6f7c');
    g.restore();
    r(-8, yb + 1, 3, 3, sk);
    r(2, yb + 1, 3, 3, sk);
  } else {
    if (P.both)
      arm(-3, -8, P.b, sl);
    if (P.pull) {
      const px2 = 14 - 8 * P.draw;
      sg(5, -7, px2, -8, aw, c1);
      r(Math.round(px2 - 2), -9, 3, 3, sk);
    }
    const h = arm(5, -8, P.a, sl);
    if (nm == 'Hakon' || nm == 'Lysa' || nm == 'Garran') {
      const bx = 5 + Math.cos(P.a) * 5, by = -8 + Math.sin(P.a) * 5;
      r(Math.round(bx - 2), Math.round(by - 2), 3, 3, nm == 'Lysa' ? '#6b4a2a' : '#8a909e', 0);
    }
    fl();
    if (P.item)
      item(P.item, h[0] + (P.item == 'book' ? 0 : 0), h[1], P.ir);
    if (P.pull) { }
  }
  fl();
  g.restore();
  // ---------- efek ----------
  if (P.orb) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (let j = 0; j < 3; j++) {
      const a = tk * 2 + j * 2.1, ox = Math.cos(a) * 12 * fc, oy = Math.sin(a) * 4;
      const q = g.createRadialGradient(x + ox, y - 28 - P.float + oy, 0, x + ox, y - 28 - P.float + oy, 5);
      q.addColorStop(0, 'rgba(230,200,255,' + .8 * Math.min(1, P.orb + .3) + ')');
      q.addColorStop(1, 'rgba(150,80,255,0)');
      g.fillStyle = q;
      g.fillRect(x + ox - 5, y - 33 - P.float + oy, 10, 10);
    }
    g.restore();
  }
  if (P.z) {
    g.save();
    g.textAlign = 'center';
    for (let j = 0; j < 3; j++) {
      const ph = (tk * .5 + j / 3) % 1;
      g.globalAlpha = 1 - ph;
      g.fillStyle = '#e8f0ff';
      g.font = 'bold ' + Math.round(5 + ph * 5) + 'px monospace';
      g.fillText('z', x + fc * (7 + ph * 8), y - 24 - ph * 14);
    }
    g.restore();
  }
}

function trBubble(n) {
  if (UIERR > 3)
    return; g.save(); try {
      trBubbleNew(n);
    } catch (e) {
      UIERR++;
      console.error('trBubble', e);
    } g.restore();
}

function trBubbleNew(n) {
  const s = n.say;
  if (!s)
    return;
  const d = dist(n, p), now = performance.now();
  if (s.t0 === undefined)
    s.t0 = now;
  const age = (now - s.t0) / 1000;
  g.save();
  g.font = 'bold 7px monospace';
  if (!s.ls) {
    const str = TL(s.s), cw = g.measureText('M').width, mc = Math.max(10, Math.floor(150 / cw)), ls = [];
    let cur = '';
    str.split(' ').forEach(wd => {
      if (cur && (cur + ' ' + wd).length > mc) {
        ls.push(cur);
        cur = wd;
      } else
        cur = cur ? cur + ' ' + wd : wd;
    });
    if (cur)
      ls.push(cur);
    if (!ls.length) {
      g.restore();
      return;
    }
    s.ls = ls;
    s.flat = ls.join(' ');
    s.w = Math.ceil(Math.max.apply(null, ls.map(l => l.length)) * cw) + 12;
    const need = .15 + s.flat.length / 38 + 1.3;
    if (s.t < need)
      s.t = need;
  }
  const ek = easeBack(age / .26), al = Math.min(1, s.t * 4) * Math.min(1, age * 10);
  if (ek < .05 || al <= 0) {
    g.restore();
    return;
  }
  if (!s.sn && d < 120 && age > .08) {
    s.sn = 1;
    try {
      SFX.blip(300 + (dlgHash(n.n || n.nm) % 5) * 45);
    } catch (e) { }
  }
  const h = s.ls.length * 9 + 4, w = s.w, c = Math.min(s.flat.length, Math.floor(Math.max(0, age - .12) * 38)), tipY = Math.round(n.y - 44 - (n.role == 'mage' ? 8 : 0) - (d < 90 ? (d < 36 && !dlg ? 20 : 12) : 0)) + 16 + Math.round(Math.sin(now / 420 + n.x));
  g.globalAlpha = al;
  g.translate(Math.round(n.x), tipY);
  g.scale(ek, ek);
  const bx = -Math.round(w / 2), by = -4 - h, bg = '#14101f';
  pxBox(bx + 1, by + 2, w, h, 'rgba(0,0,0,.3)', 'rgba(0,0,0,.3)', 2);
  const gr = g.createLinearGradient(0, by, 0, by + h);
  gr.addColorStop(0, '#2c2345');
  gr.addColorStop(1, bg);
  pxBox(bx, by, w, h, gr, '#ffe9a8', 2);
  g.fillStyle = bg;
  [[-2, -5, 5], [-2, -4, 5], [-1, -3, 3], [0, -2, 1]].forEach(([x, y, ww]) => g.fillRect(x, y, ww, 1));
  g.fillStyle = '#ffe9a8';
  [[-3, -4], [3, -4], [-2, -3], [2, -3], [-1, -2], [1, -2], [0, -1]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
  g.font = 'bold 7px monospace';
  g.textAlign = 'left';
  g.fillStyle = '#fff';
  let off = 0;
  s.ls.forEach((l, i) => {
    const k = Math.max(0, Math.min(l.length, c - off)); off += l.length + 1; if (k > 0)
      g.fillText(l.slice(0, k), bx + 6, by + 8 + i * 9);
  });
  g.restore();
}

function trDummy(d) {
  if (d.k == 0)
    drawDummy(d);
  else {
    g.save();
    g.translate(Math.round(d.x), Math.round(d.y + 8));
    g.rotate(d.tl);
    const f = (c, a, b, w, h) => { g.fillStyle = d.fl > 0 ? '#fff' : c; g.fillRect(a, b, w, h); };
    f('#120e18', -8, -1, 16, 3);
    f('#6b4d33', -7, -2, 14, 3);
    f('#6b4d33', -1.5, -30, 3, 28);
    f('#120e18', -12, -27, 24, 5);
    f('#d2b25f', -11, -26, 22, 3);
    f('#c9a95a', -6, -26, 12, 18);
    f('#a3843c', -6, -18, 12, 2);
    f('#a3843c', -6, -23, 12, 1);
    f('#e6cc7a', -5, -25, 3, 15);
    f('#6b4d33', -6, -14, 12, 2);
    f('#b8996a', -4, -38, 8, 9);
    f('#3a2a1a', -3, -35, 2, 2);
    f('#3a2a1a', 1, -35, 2, 2);
    g.restore();
  }
}

function trainLife() {
  if (p.x < 380)
    return;
  const dt = Math.min(.05, Math.max(0, t - trT));
  trT = t;
  TDM.forEach(d => { d.tv += (-d.tl * 120 - d.tv * 6) * dt; d.tl = Math.max(-.5, Math.min(.5, d.tl + d.tv * dt)); d.fl = Math.max(0, d.fl - dt); });
  TT.forEach(b => b.fl = Math.max(0, b.fl - dt));
  g.save();
  g.strokeStyle = 'rgba(120,90,50,.85)';
  g.lineWidth = 1;
  g.beginPath();
  for (let k = 0; k <= 24; k++) {
    const u = k / 24, x = 690 + 166 * u, y = 62 + Math.sin(u * Math.PI) * 8;
    k ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.stroke();
  for (let k = 1; k < 12; k++) {
    const u = k / 12, x = 690 + 166 * u, y = 62 + Math.sin(u * Math.PI) * 8, sw = Math.sin(t * 2 + k) * 1.5;
    g.fillStyle = ['#c8283e', '#ffd34d', '#3a6aa8'][k % 3];
    g.beginPath();
    g.moveTo(x - 3, y);
    g.lineTo(x + 3, y);
    g.lineTo(x + sw, y + 8);
    g.fill();
  }
  g.globalCompositeOperation = 'lighter';
  [[688, 60], [858, 60], [688, 132], [858, 132]].forEach(([x, y], i) => { const f = .75 + .25 * Math.sin(t * 9 + i * 2), q = g.createRadialGradient(x, y, 0, x, y, 22); q.addColorStop(0, 'rgba(255,190,90,' + .35 * f + ')'); q.addColorStop(1, 'rgba(255,150,50,0)'); g.fillStyle = q; g.fillRect(x - 22, y - 22, 44, 44); });
  const f = .8 + .2 * Math.sin(t * 7), q2 = g.createRadialGradient(1060, 86, 0, 1060, 86, 90);
  q2.addColorStop(0, 'rgba(255,150,60,' + .28 * f + ')');
  q2.addColorStop(1, 'rgba(255,110,30,0)');
  g.fillStyle = q2;
  g.fillRect(970, 0, 180, 180);
  g.restore();
  [[688, 58], [858, 58], [688, 130], [858, 130]].forEach(([x, y]) => { g.fillStyle = '#120e18'; g.fillRect(x - 3, y - 6, 6, 9); g.fillStyle = '#c8892a'; g.fillRect(x - 2, y - 5, 4, 7); g.fillStyle = '#ffe9a8'; g.fillRect(x - 1, y - 3, 2, 3); });
  brazier(1048, 88, 7);
  brazier(1072, 88, 8);
  TDM.forEach(trDummy);
  TT.forEach(b => {
    if (b.fl > 0) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = 'rgba(255,235,150,' + b.fl * 2 + ')';
      g.beginPath();
      g.arc(b.x, b.y, 8, 0, 7);
      g.fill();
      g.restore();
    } b.st.forEach(a => { g.fillStyle = '#d8c9a0'; g.fillRect(b.x - 15, b.y + a, 15, 1); g.fillStyle = '#c8283e'; g.fillRect(b.x - 19, b.y + a - 1, 4, 3); });
  });
  g.save();
  g.textAlign = 'center';
  g.font = 'bold 6px monospace';
  g.fillStyle = 'rgba(240,230,200,.6)';
  g.fillText('GARIS TEMBAK', 723, 284);
  g.font = 'bold 7px monospace';
  g.fillStyle = 'rgba(194,160,107,.5)';
  g.fillText('LAPANGAN PANAH', 796, 380);
  g.fillText('RING SPARRING', 772, 152);
  g.fillText('API UNGGUN', 1060, 126);
  g.textAlign = 'left';
  g.font = '5px monospace';
  g.fillStyle = 'rgba(235,235,225,.85)';
  g.fillText('LATIHAN HARI INI', 1122, 25);
  g.fillText('100 TEBASAN', 1122, 31);
  g.fillText('50 PANAH  10 LARI', 1122, 37);
  g.restore();
  TN.forEach(n => trAI(n, dt));
  TN.slice().sort((a, b) => a.y - b.y).forEach(trMan);
  TAR = TAR.filter(a => {
    const d = Math.hypot(a.tb.x - 6 - a.x0, a.tb.y - a.y0), k = (t - a.t0) / Math.max(.2, d / 300);
    if (k >= 1) {
      const b = a.tb;
      b.fl = .3;
      if (b.st.length >= 5)
        b.st.shift();
      b.st.push(Math.round(-7 + R() * 14));
      trSnd('thunk', { x: b.x }, () => SFX.chop());
      if (a.n && R() < .5)
        trSay(a.n, pick(SAYH.bow), 1.4);
      puff(b.x - 6, b.y, 1, '200,180,140', .4);
      return false;
    }
    const x = a.x0 + (a.tb.x - 6 - a.x0) * k, y = a.y0 + (a.tb.y - a.y0) * k - Math.sin(k * Math.PI) * 5;
    g.fillStyle = 'rgba(255,255,255,.25)';
    g.fillRect(x - 22, y, 14, 1);
    g.fillStyle = '#d8c9a0';
    g.fillRect(x - 14, y - .5, 17, 1.5);
    g.fillStyle = '#cfd6e2';
    g.fillRect(x + 3, y - 1.5, 3, 3);
    g.fillStyle = '#c8283e';
    g.fillRect(x - 15, y - 1.5, 3, 3);
    return true;
  });
  TBO = TBO.filter(a => {
    const d = Math.hypot(a.tb.x - 8 - a.x0, a.tb.y - a.y0), k = (t - a.t0) / Math.max(.25, d / 230);
    if (k >= 1) {
      const b = a.tb;
      b.fl = .35;
      fx.push({ k: 'pf', x: b.x - 6, y: b.y, r: 14, life: .35, max: .35 });
      puff(b.x - 6, b.y, 2, '70,40,110', .7);
      for (let i = 0; i < 8; i++) {
        const an = R() * 6.283;
        dp.push({
          k: 'p', x: b.x - 6, y: b.y, vx: Math.cos(an) * 70, vy: Math.sin(an) * 70, life: .35, max: .35, s: 1.5, c: i % 2 ? '#e6b8ff' : '#b48cff'
        });
      }
      trSnd('boom', { x: b.x }, () => SFX.chop());
      return false;
    }
    const x = a.x0 + (a.tb.x - 8 - a.x0) * k, y = a.y0 + (a.tb.y - a.y0) * k;
    if (R() < .7)
      dp.push({ k: 'p', x, y, vx: (R() - .5) * 20, vy: (R() - .5) * 20, life: .25, max: .25, s: 1.5 + R(), c: '#c9a0ff' });
    g.save();
    g.globalCompositeOperation = 'lighter';
    const q = g.createRadialGradient(x, y, 0, x, y, 9);
    q.addColorStop(0, 'rgba(255,240,255,.95)');
    q.addColorStop(.4, 'rgba(200,130,255,.7)');
    q.addColorStop(1, 'rgba(100,40,200,0)');
    g.fillStyle = q;
    g.fillRect(x - 9, y - 9, 18, 18);
    g.restore();
    return true;
  });
  g.font = '8px monospace';
  TN.forEach(n => {
    const d = dist(n, p); if (d < 90) {
      txt(n.n.split(',')[0], n.x, n.y - (n.role == 'mage' ? 36 : 30), '#ffe9a8', 'center');
      if (d < 36 && !dlg)
        txt('[G] Bicara', n.x, n.y - (n.role == 'mage' ? 46 : 40), '#fff', 'center');
    }
  });
  TN.forEach(trBubble);
}
trInit();
(() => { const b = BGL.getContext('2d'); decorCamp(b); WL.push(...CB); BRL.push([1060, 84]); })();
walls = WL;
TO = TOL;
BR = BRL;
BG = BGL;
reset();
msg('Selamat datang di Lobby. Bicara dengan NPC [G], latihan di ruang kanan, lalu masuk gerbang utara.');
resizeGameCanvas();
let last = performance.now(), playing = false, inGame = false;
(function loop(n) {
  const dt = Math.min(.05, (n - last) / 1000); last = n; if (playing) {
    upd(dt);
    draw();
  } requestAnimationFrame(loop);
})(last);
(function () {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let PS = 2, LW = 0, LH = 0;
  let animationFrame = 0;
  let cinematicStart = 0;
  let cinematicRunning = false;
  let cinematicFinished = false;
  let doorProgress = 0;
  let brightness = 1;
  let particles = [];
  let transitionTimers = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    PS = Math.max(2, Math.round(H / 300));
    LW = Math.ceil(W / PS);
    LH = Math.ceil(H / PS);
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener("resize", resize);
  resize();

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function clearTransitionTimers() {
    transitionTimers.forEach(clearTimeout);
    transitionTimers = [];
  }

  function delayed(fn, ms) {
    const timer = setTimeout(fn, ms);
    transitionTimers.push(timer);
  }

  function openSettings() {
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("settings").classList.remove("hidden");
  }

  function closeSettings() {
    document.getElementById("settings").classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");
  }
  document.getElementById("brightness").addEventListener("input", e => {
    brightness = Number(e.target.value) / 100;
    document.body.style.filter = `brightness(${brightness})`;
  });

  function exitGame() {
    document.getElementById("exitPopup").classList.remove("hidden");
    const b = document.querySelector("#exitPopup .popup-btn");
    if (b)
      b.focus();
  }
  // nilai & isi slider pada popup settings
  [["musicVol", "musicVolOut"], ["sfxVol", "sfxVolOut"], ["brightness", "brightnessOut"]].forEach(([id, out]) => {
    const inp = document.getElementById(id), o = document.getElementById(out);
    const sync = () => { const pct = (inp.value - inp.min) / (inp.max - inp.min) * 100; inp.style.setProperty("--v", pct + "%"); o.textContent = inp.value + "%"; };
    inp.addEventListener("input", sync);
    sync();
  });
  /* DUNGEON SCENE */
  /* ===== Latar dungeon, obor & pintu: tekstur di-cache ke kanvas offscreen (halus & ringan) ===== */
  const mkCv = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  const seeded = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const smoother = t => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
  let bgCache = null, bgKey = "", frameCache = null, frameKey = "", leafCache = null, leafKey = "";

  /* ===== PIXEL ART: adegan digambar per "piksel besar" (PS px layar), tanpa gradien halus ===== */
  const Bx = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
  const pr = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(a) * PS, Math.round(b) * PS, w * PS, h * PS); };
  const pdisc = (c, cx, cy, r) => {
    ctx.fillStyle = c; for (let d = -r; d <= r; d++) {
      const w = Math.floor(Math.sqrt(r * r - d * d + .5));
      ctx.fillRect((cx - w) * PS, (cy + d) * PS, (2 * w + 1) * PS, PS);
    }
  };
  const blit = (c, a, b) => ctx.drawImage(c, Math.round(a) * PS, Math.round(b) * PS, c.width * PS, c.height * PS);

  function buildBackground() {
    const c = mkCv(LW, LH), x = c.getContext("2d"), r = seeded(7), fy = Math.round(LH * .82), bh = Math.max(9, Math.round(LH * .075)), bw = Math.max(20, Math.round(LW * .09));
    Bx(x, "#0e0f14", 0, 0, LW, fy);
    for (let row = 0, y = 0; y < fy; row++, y += bh) {
      const off = row % 2 ? bw >> 1 : 0;
      for (let bx = -bw + off; bx < LW; bx += bw) {
        const t = .86 + r() * .28, a = Math.round(46 * t), b = Math.round(36 * t), lo = bh * .6 | 0;
        Bx(x, `rgb(${a + 6},${a + 6},${a + 14})`, bx + 1, y + 1, bw - 1, bh - 1);
        Bx(x, `rgb(${b},${b},${b + 8})`, bx + 1, y + lo, bw - 1, bh - lo - 1);
        Bx(x, "rgba(255,255,255,.08)", bx + 1, y + 1, bw - 1, 1);
        Bx(x, "rgba(0,0,0,.35)", bx + 1, y + bh - 1, bw - 1, 1);
        Bx(x, "rgba(0,0,0,.25)", bx + bw - 1, y + 1, 1, bh - 1);
        for (let k = 0; k < 7; k++)
          Bx(x, r() < .5 ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.2)", bx + 2 + (r() * (bw - 4) | 0), y + 2 + (r() * (bh - 4) | 0), 1 + (r() * 2 | 0), 1);
        if (r() < .1) {
          let cx = bx + 3 + (r() * (bw - 6) | 0), cy = y + 1;
          for (let k = 0; k < bh - 2; k++) {
            Bx(x, "rgba(0,0,0,.4)", cx, cy++, 1, 1);
            if (r() < .4)
              cx += r() < .5 ? -1 : 1;
          }
        }
      }
    }
    for (let i = 0; i < 7; i++)
      Bx(x, "rgba(0,0,0,.11)", 0, 0, LW, Math.round(fy * .4 * (7 - i) / 7));
    for (let i = 0; i < 6; i++) {
      const w = Math.round(LW * .2 * (6 - i) / 6);
      Bx(x, "rgba(0,0,0,.1)", 0, 0, w, fy);
      Bx(x, "rgba(0,0,0,.1)", LW - w, 0, w, fy);
    }
    Bx(x, "rgba(0,0,0,.3)", 0, fy - 4, LW, 4);
    Bx(x, "#1c1814", 0, fy, LW, LH - fy);
    for (let i = 1; i <= 7; i++) {
      const t = i / 7, yy = fy + Math.round((LH - fy) * t * t);
      Bx(x, "#0c0a08", 0, yy, LW, i > 3 ? 2 : 1);
      Bx(x, "rgba(255,230,190,.05)", 0, yy + 2, LW, 1);
    }
    const vx = LW / 2, vy = fy - LH * .38;
    for (let i = -12; i <= 12; i++) {
      const x0 = vx + i * LW * .06;
      for (let y = fy; y < LH; y++)
        Bx(x, "rgba(0,0,0,.45)", Math.round(vx + (x0 - vx) * (y - vy) / (fy - vy)), y, 1, 1);
    }
    for (let i = 1; i <= 5; i++)
      Bx(x, "rgba(0,0,0,.1)", 0, fy + Math.round((LH - fy) * i / 6), LW, LH);
    for (let i = 0; i < 4; i++)
      Bx(x, "rgba(0,0,0,.12)", 0, 0, Math.round(LW * .1 * (4 - i) / 4), LH), Bx(x, "rgba(0,0,0,.12)", LW - Math.round(LW * .1 * (4 - i) / 4), 0, LW, LH);
    return c;
  }

  function drawBackground(time) {
    const k = W + "x" + H; if (!bgCache || bgKey !== k) {
      bgCache = buildBackground();
      bgKey = k;
    } blit(bgCache, 0, 0);
  }

  function drawTorch(x, y, time) {
    const t = time * .001, lx = Math.round(x / PS), ly = Math.round(y / PS), u = Math.max(1, Math.round(LH / 260));
    const f = Math.sin(t * 9 + x) * .5 + Math.sin(t * 14.3 + x * 2.1) * .3 + Math.sin(t * 23 + x * .7) * .2, k = 1 + f * .08, sw = Math.round(f * 1.5 * u);
    pr("#26221e", lx - 4 * u, ly + 4 * u, 8 * u, 10 * u);
    pr("#4b453d", lx - 3 * u, ly + 4 * u, 2 * u, 10 * u);
    pr("#14110f", lx + 3 * u, ly + 4 * u, u, 10 * u);
    pr("#4a3626", lx - 2 * u, ly - u, 4 * u, 18 * u);
    pr("#76583a", lx - 2 * u, ly - u, u, 18 * u);
    pr("#33261a", lx + u, ly - u, u, 18 * u);
    pr("#3a352f", lx - 5 * u, ly - 3 * u, 10 * u, 3 * u);
    pr("#8b7a5a", lx - 5 * u, ly - 3 * u, 10 * u, u);
    pr("#2c2823", lx - 4 * u, ly, 8 * u, u);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    [[62, .035], [46, .04], [32, .05], [20, .06]].forEach(q => pdisc(`rgba(255,140,60,${q[1]})`, lx, ly - 8 * u, Math.round(q[0] * u * k * .8)));
    ctx.restore();
    [["#e8561a", 5, 17], ["#ffa23a", 3.6, 12], ["#ffe9a8", 2, 7]].forEach(q => {
      const h = Math.round(q[2] * u * k); for (let kk = 0; kk < h; kk++) {
        const half = Math.round(q[1] * u * Math.pow(1 - kk / h, .65));
        pr(q[0], lx - half + Math.round(sw * kk / h), ly - 4 * u - kk, 2 * half + 1, 1);
      }
    });
    for (let i = 0; i < 4; i++) {
      const ph = (t * .32 + i * .25 + x * .0013) % 1;
      ctx.globalAlpha = (1 - ph) * .9;
      pr("#ffc46a", lx + Math.round(Math.sin(ph * 6 + i * 2.1) * 5 * u) + sw, ly - 10 * u - Math.round(ph * 26 * u), 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  function buildFrame(dw, dh) {
    const pw = Math.max(8, Math.round(dw * .2)), lt = Math.max(9, Math.round(dh * .075)), ph = Math.round(dw * .42), ox = pw + 26, oy = lt + ph + 16, w2 = dw * 2, cx = ox + dw;
    const c = mkCv(w2 + ox * 2, dh + oy + 24), x = c.getContext("2d"), r = seeded(5);
    const stone = (sx, sy, sw, sh, t) => {
      Bx(x, `rgb(${t + 26},${t + 20},${t + 6})`, sx, sy, sw, sh);
      Bx(x, `rgb(${t + 44},${t + 36},${t + 16})`, sx, sy, sw, 1);
      Bx(x, `rgb(${t + 36},${t + 30},${t + 12})`, sx, sy, 1, sh);
      Bx(x, `rgb(${t - 12},${t - 18},${t - 30})`, sx, sy + sh - 1, sw, 1);
      Bx(x, `rgb(${t - 6},${t - 12},${t - 24})`, sx + sw - 1, sy, 1, sh);
      for (let k = 0; k < (sw * sh >> 6); k++)
        Bx(x, r() < .5 ? "rgba(255,240,200,.1)" : "rgba(0,0,0,.14)", sx + 1 + (r() * (sw - 2) | 0), sy + 1 + (r() * (sh - 2) | 0), 1 + (r() * 2 | 0), 1);
    };
    const top = oy - lt, bot = oy + dh + 2, cH = Math.round(pw * 1.15);
    [ox - pw, ox + w2].forEach((px, side) => {
      for (let yy = top, i = 0; yy < bot; yy += cH, i++)
        stone(px, yy, pw, Math.min(cH, bot - yy), 88 + (i % 2) * 6 - side * 3);
    });
    stone(ox - pw - 3, oy + dh - 4, pw + 3, 7, 82);
    stone(ox + w2, oy + dh - 4, pw + 3, 7, 79);
    stone(ox - pw - 5, top, w2 + pw * 2 + 10, lt, 94);
    stone(cx - Math.round(pw * .9), top, Math.round(pw * 1.8), lt + 3, 108);
    stone(ox - pw - 8, top - 3, w2 + pw * 2 + 16, 3, 104);
    const A0 = ox - pw - 8, C0 = ox + w2 + pw + 8, py0 = top - 3;
    for (let i = 0; i < ph; i++) {
      const y = py0 - ph + i, half = Math.round((C0 - A0) / 2 * (i + 1) / ph);
      Bx(x, "#8e846e", cx - half, y, half * 2, 1);
      Bx(x, "#c0b497", cx - half, y, 1, 1);
      Bx(x, "#c0b497", cx + half - 1, y, 1, 1);
      if (i > ph * .3 && half > 8) {
        const h2 = half - 6 - Math.round(i * .1);
        Bx(x, "rgba(20,16,12,.35)", cx - h2, y, h2 * 2, 1);
      }
    }
    Bx(x, "#c0b497", A0, py0 - 1, C0 - A0, 1);
    const es = Math.max(4, Math.round(dw * .07)), ey = py0 - Math.round(ph * .38);
    for (let d = -es; d <= es; d++) {
      const hw = es - Math.abs(d);
      if (hw > 1)
        Bx(x, d < 0 ? "#6b5530" : "#7a6038", cx - hw + 1, ey + d, 2 * hw - 1, 1);
      Bx(x, d < 0 ? "#ffe9a8" : "#c79a50", cx - hw, ey + d, 1, 1);
      Bx(x, d < 0 ? "#ffe9a8" : "#c79a50", cx + hw, ey + d, 1, 1);
    }
    stone(ox - pw - 10, oy + dh + 2, w2 + pw * 2 + 20, 4, 84);
    stone(ox - pw - 18, oy + dh + 6, w2 + pw * 2 + 36, 5, 72);
    for (let i = 0; i < 4; i++) {
      const a = [.55, .35, .18, .08][i];
      Bx(x, `rgba(0,0,0,${a})`, ox + i, oy, 1, dh);
      Bx(x, `rgba(0,0,0,${a})`, ox + w2 - 1 - i, oy, 1, dh);
      Bx(x, `rgba(0,0,0,${a})`, ox, oy + i, w2, 1);
    }
    return { cv: c, ox, oy };
  }

  function drawDoorFrame(cx, top, dw, dh) {
    const k = dw + "x" + dh + "x" + PS; if (!frameCache || frameKey !== k) {
      frameCache = buildFrame(dw, dh);
      frameKey = k;
    } blit(frameCache.cv, cx - dw - frameCache.ox, top - frameCache.oy);
  }

  function buildLeaf(w, h) {
    const c = mkCv(w, h), x = c.getContext("2d"), r = seeded(33), n = 4, pw = w / n | 0, gold = "#e0bd72", gd = "#8a6a2c";
    for (let i = 0; i < n; i++) {
      const px = i * pw;
      Bx(x, "#5b4630", px, 0, pw, h);
      Bx(x, "#6c553a", px + 1, 0, pw - 3, h);
      Bx(x, "#7a6244", px + 1, 0, 1, h);
      Bx(x, "#3d2f20", px + pw - 1, 0, 1, h);
      for (let k = 0; k < (h >> 2); k++)
        Bx(x, r() < .6 ? "rgba(0,0,0,.2)" : "rgba(255,220,160,.1)", px + 2 + (r() * (pw - 4) | 0), r() * h | 0, 1, 2 + (r() * 4 | 0));
    }
    Bx(x, "rgba(0,0,0,.28)", 0, h - (h * .18 | 0), w, h * .18 | 0);
    const bt = Math.max(3, Math.round(w * .07)), iron = (a, b, ww, hh) => { Bx(x, "#2b2824", a, b, ww, hh); Bx(x, "#4a463f", a, b, ww, 1); Bx(x, "#171512", a, b + hh - 1, ww, 1); };
    iron(0, 0, w, bt);
    iron(0, h - bt, w, bt);
    iron(0, 0, bt, h);
    iron(w - bt, 0, bt, h);
    const bH = Math.max(3, h * .028 | 0);
    iron(bt, h * .2 | 0, w - 2 * bt, bH);
    iron(bt, h * .8 | 0, w - 2 * bt, bH);
    const rv = (a, b) => { Bx(x, "#a8864c", a - 1, b - 1, 2, 2); Bx(x, "#f0dca8", a - 1, b - 1, 1, 1); };
    for (let i = 1; i <= 4; i++) {
      const a = bt + Math.round((w - bt * 2) * i / 5);
      rv(a, (h * .2 | 0) + (bH >> 1));
      rv(a, (h * .8 | 0) + (bH >> 1));
    }
    [[bt >> 1, bt >> 1], [w - (bt >> 1), bt >> 1], [bt >> 1, h - (bt >> 1)], [w - (bt >> 1), h - (bt >> 1)]].forEach(q => rv(q[0], q[1]));
    const fr = (a, b, ww, hh) => { Bx(x, gd, a + 1, b + 1, ww, hh);[[a, b, ww, 1], [a, b + hh - 1, ww, 1], [a, b, 1, hh], [a + ww - 1, b, 1, hh]].forEach(q => Bx(x, gold, ...q)); };
    fr(w * .15 | 0, h * .27 | 0, w * .64 | 0, h * .23 | 0);
    fr(w * .15 | 0, h * .57 | 0, w * .64 | 0, h * .17 | 0);
    const dcx = w * .47 | 0, dcy = h * .385 | 0, ds = Math.round(w * .13);
    for (let d = -ds; d <= ds; d++) {
      const hw = ds - Math.abs(d);
      Bx(x, gold, dcx - hw, dcy + d, 1, 1);
      Bx(x, gold, dcx + hw, dcy + d, 1, 1);
    }
    Bx(x, gold, dcx, dcy, 1, 1);
    const ccy = h * .655 | 0, cr = Math.max(3, Math.round(w * .09));
    for (let a = 0; a < 6.3; a += .1)
      Bx(x, gold, Math.round(dcx + Math.cos(a) * cr), Math.round(ccy + Math.sin(a) * cr), 1, 1);
    Bx(x, gold, dcx, ccy - cr, 1, cr * 2);
    Bx(x, gold, dcx - cr, ccy, cr * 2, 1);
    Bx(x, "rgba(0,0,0,.35)", w - bt - 3, 0, 3, h);
    const hx = w - bt - 6, hy = h * .5 | 0, hr = Math.max(3, Math.round(w * .06));
    rv(hx, hy - hr - 3);
    for (let a = 0; a < 6.3; a += .12) {
      Bx(x, gold, Math.round(hx + Math.cos(a) * hr), Math.round(hy + 1 + Math.sin(a) * hr), 1, 1);
    }
    return c;
  }

  function drawDoorLeaf(x, y, w, h, side, progress) {
    const k = w + "x" + h + "x" + PS;
    if (!leafCache || leafKey !== k) {
      leafCache = buildLeaf(w, h);
      leafKey = k;
    }
    const move = Math.round(smoother(progress) * w * .97);
    ctx.save();
    if (side === "left")
      ctx.translate((x - move) * PS, y * PS);
    else {
      ctx.translate((x + w + move) * PS, y * PS);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(leafCache, 0, 0, w * PS, h * PS);
    ctx.restore();
    if (progress > 0) {
      const e = side === "left" ? x + w - move : x + move - 3;
      pr("rgba(0,0,0,.4)", e, y, 3, h);
    }
  }

  function drawDoor(time) {
    const dw = Math.min(Math.round(W * .205 / PS), Math.round(H * .28 / PS)), dh = Math.round(H * .59 / PS), top = Math.round(H * .23 / PS), cx = Math.round(LW / 2), left = cx - dw, w2 = dw * 2;
    const p = doorProgress, open = smoother(p), baseY = top + dh;
    pr("#05060a", left, top, w2, dh);
    if (p > 0) { // terowongan cahaya: persegi bersarang (tampak berundak seperti pixel art)
      const cols = [[120, 70, 30], [205, 122, 52], [255, 192, 112], [255, 226, 160], [255, 240, 200]];
      cols.forEach((c, i) => { const ix = Math.round(i * dw * .2), iy = Math.round(i * dh * .1); pr(`rgb(${5 + (c[0] - 5) * open | 0},${6 + (c[1] - 6) * open | 0},${10 + (c[2] - 10) * open | 0})`, left + ix, top + iy, w2 - 2 * ix, dh - iy); });
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(left * PS, (top - 1) * PS, w2 * PS, (dh + 2) * PS);
    ctx.clip();
    drawDoorLeaf(left, top, dw, dh, "left", p);
    drawDoorLeaf(cx, top, dw, dh, "right", p);
    ctx.restore();
    drawDoorFrame(cx, top, dw, dh);
    if (p > 0) { // cahaya tumpah ke lantai, dibuat berundak 6 tingkat
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let y = baseY; y < LH; y++) {
        const tt = (y - baseY) / (LH - baseY), a = Math.round(.4 * open * (1 - tt) * 6) / 6, half = Math.round(dw * (.5 + .9 * open) * (1 + 1.6 * tt));
        if (a > 0) {
          ctx.fillStyle = `rgba(255,205,140,${a})`;
          ctx.fillRect(Math.round(cx - half) * PS, y * PS, half * 2 * PS, PS);
        }
      }
      ctx.restore();
    }
  }

  function addParticle() {
    particles.push({
      x: W / 2 + (Math.random() - .5) * W * .5,
      y: H * (.4 + Math.random() * .5),
      size: PS * (1 + (Math.random() * 2 | 0)),
      speed: Math.random() * .7 + .2,
      alpha: Math.random() * .6 + .2
    });
  }

  function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.y -= p.speed;
      p.x += Math.sin(p.y * .02) * .3;
      p.alpha -= .0015;
      ctx.fillStyle = `rgba(255,205,135,${Math.max(0, p.alpha)})`;
      ctx.fillRect(Math.round(p.x / PS) * PS, Math.round(p.y / PS) * PS, p.size, p.size);
      if (p.alpha <= 0 || p.y < 0)
        particles.splice(i, 1);
    }
  }
  /* START CINEMATIC */
  function startCinematic() {
    if (inGame) {
      resumeGame();
      return;
    }
    clearTransitionTimers();
    menuOn = false;
    cancelAnimationFrame(mAnim);
    SFX.init();
    SFX.mode('cine');
    SFX.intro();
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("settings").classList.add("hidden");
    document.getElementById("cinematicUI").classList.remove("hidden");
    const title = document.getElementById("finalTitle");
    title.classList.remove("show");
    title.style.opacity = 0;
    document.getElementById("skipButton").classList.remove("hidden");
    document.getElementById("lightTransition").style.opacity = 0;
    document.getElementById("blackFade").style.opacity = 0;
    cinematicStart = performance.now();
    cinematicRunning = true;
    cinematicFinished = false;
    doorProgress = 0;
    particles = [];
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(render);
  }

  function render(time) {
    if (!cinematicRunning)
      return;
    const elapsed = (time - cinematicStart) / 1000;
    // Pintu mulai bergerak setelah kamera memperlihatkan dungeon.
    doorProgress = clamp((elapsed - 2) / 4, 0, 1);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    // Kamera mendekati pintu setelah pintu terbuka.
    const zoomProgress = clamp((elapsed - 5.5) / 3.5, 0, 1);
    const zoomEase = zoomProgress * zoomProgress * (3 - 2 * zoomProgress);
    const zoom = 1 + zoomEase * .7; // kamera mendekat ke pintu (smoothing piksel tetap mati, jadi tetap tajam)
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);
    drawBackground(time);
    drawTorch(W * .16, H * .52, time);
    drawTorch(W * .84, H * .52, time);
    drawDoor(time);
    if (elapsed > 3.5) {
      if (Math.random() < .45)
        addParticle();
      drawParticles();
    }
    ctx.restore();
    // Awal adegan masuk dari hitam.
    if (elapsed < 1.2) {
      ctx.fillStyle = `rgba(0,0,0,${1 - elapsed / 1.2})`;
      ctx.fillRect(0, 0, W, H);
    }
    // Transisi dilakukan setelah pintu benar-benar terbuka.
    if (elapsed >= 9) {
      cinematicRunning = false;
      beginTitleTransition();
      return;
    }
    animationFrame = requestAnimationFrame(render);
  }
  /* DOOR TO TITLE TRANSITION */
  function beginTitleTransition() {
    if (cinematicFinished)
      return;
    cinematicFinished = true;
    document.getElementById("skipButton").classList.add("hidden");
    const light = document.getElementById("lightTransition");
    const black = document.getElementById("blackFade");
    // Cahaya memenuhi layar.
    light.style.transition = "opacity 2.2s ease";
    light.style.opacity = 1;
    // Setelah cahaya penuh, adegan perlahan menggelap.
    delayed(() => {
      light.style.transition = "opacity 2s ease";
      light.style.opacity = 0;
      black.style.transition = "opacity 2.4s ease";
      black.style.opacity = 1;
    }, 2200);
    // Judul muncul ketika layar sudah gelap.
    delayed(() => {
      document.getElementById("finalTitle").style.opacity = 1;
    }, 4300);
    delayed(() => {
      const title = document.getElementById("finalTitle");
      title.classList.add("show");
      black.style.opacity = 0;
    }, 4700);
  }

  function skipCinematic() {
    if (!cinematicRunning)
      return;
    cinematicRunning = false;
    SFX.finale();
    cancelAnimationFrame(animationFrame);
    doorProgress = 1;
    // Gambar frame pintu dalam keadaan terbuka.
    ctx.clearRect(0, 0, W, H);
    drawBackground(performance.now());
    drawTorch(W * .16, H * .52, performance.now());
    drawTorch(W * .84, H * .52, performance.now());
    drawDoor(performance.now());
    beginTitleTransition();
  }

  /* ===== Integrasi dengan game ===== */
  let menuOn = true, mAnim = 0;
  const startBtn = document.getElementById("startBtn");

  function menuFrame(time) {
    if (!menuOn)
      return;
    ctx.clearRect(0, 0, W, H);
    doorProgress = 0;
    drawBackground(time);
    drawTorch(W * .16, H * .52, time);
    drawTorch(W * (W > 900 ? .94 : .9), H * .52, time);
    ctx.save();
    ctx.translate(Math.round((W > 900 ? W * .13 : W * .06) / PS) * PS, 0); // pintu bergeser ke kanan agar tidak tertimpa judul menu
    drawDoor(time);
    ctx.restore();
    mAnim = requestAnimationFrame(menuFrame);
  }

  function showMenuScene() {
    menuOn = true;
    canvas.style.display = "block";
    resize();
    cancelAnimationFrame(mAnim);
    mAnim = requestAnimationFrame(menuFrame);
  }

  function startGame() {
    clearTransitionTimers();
    SFX.cut(.9);
    const black = document.getElementById("blackFade");
    black.style.transition = "opacity .8s ease";
    black.style.opacity = 1;
    delayed(() => {
      document.getElementById("cinematicUI").classList.add("hidden");
      const ft = document.getElementById("finalTitle");
      ft.classList.remove("show");
      ft.style.opacity = 0;
      document.getElementById("menu").classList.add("hidden");
      canvas.style.display = "none";
      cv.style.visibility = "visible";
      resizeGameCanvas();
      cv.focus();
      playing = true;
      inGame = true;
      menuOn = false;
      SFX.mode("game");
      if (typeof entryStart === "function")
        entryStart(); // adegan pahlawan masuk lobby
      startBtn.textContent = "CONTINUE";
      document.body.classList.add("ingame");
      if (isMobile) {
        const mob = document.getElementById("mobileControls");
        if (mob)
          mob.classList.remove("hidden");
      }
      black.style.transition = "opacity 1.2s ease";
      black.style.opacity = 0;
    }, 900);
  }

  function pauseGame() {
    if (!playing)
      return;
    playing = false;
    try {
      Object.keys(K).forEach(k => K[k] = 0);
      M.d = 0;
      for (const k in P)
        delete P[k];
    } catch (e) { }
    cv.style.visibility = "hidden";
    const mob = document.getElementById("mobileControls");
    if (mob)
      mob.classList.add("hidden");
    const sm = document.getElementById("statModal");
    if (sm)
      sm.classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");
    showMenuScene();
    SFX.mode("menu");
  }

  function resumeGame() {
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("settings").classList.add("hidden");
    menuOn = false;
    cancelAnimationFrame(mAnim);
    canvas.style.display = "none";
    cv.style.visibility = "visible";
    resizeGameCanvas();
    cv.focus();
    playing = true;
    SFX.mode("game");
    if (isMobile) {
      const mob = document.getElementById("mobileControls");
      if (mob)
        mob.classList.remove("hidden");
    }
  }
  window.addEventListener("keydown", e => {
    if (e.code === "Escape" && playing)
      pauseGame();
  });
  const unlock = () => { SFX.init(); document.getElementById("snd").classList.add("hidden"); };
  document.addEventListener("pointerdown", unlock);
  document.addEventListener("keydown", unlock);
  document.getElementById("musicVol").addEventListener("input", e => SFX.vol(e.target.value / 100 * 1.4));
  document.getElementById("sfxVol").addEventListener("input", e => SFX.sfxVol(e.target.value / 100));

  /* ===== MOBILE CONTROLS & RESPONSIVENESS SYSTEM ===== */
  function initMobileControls() {
    const joyZone = document.getElementById('joyZone');
    const joyBase = document.getElementById('joyBase');
    const joyStick = document.getElementById('joyStick');
    const mobBtnAttack = document.getElementById('mobBtnAttack');
    const mobBtnDodge = document.getElementById('mobBtnDodge');
    const mobBtnSkill1 = document.getElementById('mobBtnSkill1');
    const mobBtnSkill2 = document.getElementById('mobBtnSkill2');
    const mobBtnSkill3 = document.getElementById('mobBtnSkill3');
    const mobBtnUlt = document.getElementById('mobBtnUlt');
    const mobBtnFocus = document.getElementById('mobBtnFocus');
    const mobBtnPotion = document.getElementById('mobBtnPotion');
    const mobBtnInteract = document.getElementById('mobBtnInteract');
    const mobBtnPause = document.getElementById('mobBtnPause');
    const mobBtnAudio = document.getElementById('mobBtnAudio');
    const mobBtnFullscreen = document.getElementById('mobBtnFullscreen');
    const mobBtnLobby = document.getElementById('mobBtnLobby');
    const mobBtnStat = document.getElementById('mobBtnStat');
    const mobStatClose = document.getElementById('mobStatClose');
    const statModal = document.getElementById('statModal');
    const rotateOverlay = document.getElementById('rotateOverlay');

    function checkOrientation() {
      isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 1024);
      if (!rotateOverlay)
        return;
      const isPortrait = window.innerHeight > window.innerWidth;
      if (isPortrait && isMobile) {
        rotateOverlay.style.display = 'flex';
      } else {
        rotateOverlay.style.display = 'none';
      }
    }
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    checkOrientation();
    if (rotateOverlay) {
      rotateOverlay.addEventListener('pointerdown', () => {
        try {
          if (screen.orientation && screen.orientation.lock)
            screen.orientation.lock('landscape').catch(() => { });
        } catch (e) { }
      });
    }
    // Virtual Joystick
    if (joyZone && joyBase && joyStick) {
      joyZone.addEventListener('pointerdown', e => {
        e.preventDefault();
        touchJoy.pointerId = e.pointerId;
        touchJoy.active = true;
        const rect = joyZone.getBoundingClientRect();
        const touchX = e.clientX - rect.left;
        const touchY = e.clientY - rect.top;
        joyBase.style.left = (touchX - 70) + 'px';
        joyBase.style.bottom = (rect.height - touchY - 70) + 'px';
        touchJoy.startX = e.clientX;
        touchJoy.startY = e.clientY;
        joyStick.style.transform = 'translate(0px, 0px)';
      });
      window.addEventListener('pointermove', e => {
        if (!touchJoy.active || e.pointerId !== touchJoy.pointerId)
          return;
        const dx = e.clientX - touchJoy.startX;
        const dy = e.clientY - touchJoy.startY;
        const dist = Math.hypot(dx, dy);
        const maxR = 56;
        const angle = Math.atan2(dy, dx);
        const stickDist = Math.min(dist, maxR);
        joyStick.style.transform = `translate(${Math.cos(angle) * stickDist}px, ${Math.sin(angle) * stickDist}px)`;
        const mag = Math.min(1, dist / maxR);
        if (mag > 0.12) {
          touchJoy.x = (dx / (dist || 1)) * mag;
          touchJoy.y = (dy / (dist || 1)) * mag;
          touchJoy.sprint = mag > 0.72;
        } else {
          touchJoy.x = 0;
          touchJoy.y = 0;
          touchJoy.sprint = false;
        }
      });
      const resetJoy = e => {
        if (e.pointerId !== touchJoy.pointerId)
          return;
        touchJoy.active = false;
        touchJoy.pointerId = null;
        touchJoy.x = 0;
        touchJoy.y = 0;
        touchJoy.sprint = false;
        joyStick.style.transform = 'translate(0px, 0px)';
        joyBase.style.left = 'max(64px, env(safe-area-inset-left))';
        joyBase.style.bottom = 'max(30px, env(safe-area-inset-bottom))';
      };
      window.addEventListener('pointerup', resetJoy);
      window.addEventListener('pointercancel', resetJoy);
    }
    // Attack & Aim Button
    if (mobBtnAttack) {
      mobBtnAttack.addEventListener('pointerdown', e => {
        e.preventDefault();
        SFX.init();
        touchAttack.active = true;
        touchAttack.pointerId = e.pointerId;
        M.d = 1;
        cv.focus();
      });
      window.addEventListener('pointermove', e => {
        if (!touchAttack.active || e.pointerId !== touchAttack.pointerId)
          return;
        const rect = mobBtnAttack.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        if (Math.hypot(dx, dy) > 16) {
          touchAiming = true;
          const a = Math.atan2(dy, dx);
          if (typeof p !== 'undefined' && p) {
            p.face = a;
            M.x = p.x + Math.cos(a) * 120;
            M.y = p.y + Math.sin(a) * 120;
          }
        }
      });
      const releaseAtk = e => {
        if (!touchAttack.active || e.pointerId !== touchAttack.pointerId)
          return;
        touchAttack.active = false;
        touchAttack.pointerId = null;
        if (M.d) {
          M.d = 0;
          M.u = 1;
        }
        setTimeout(() => { touchAiming = false; }, 120);
      };
      window.addEventListener('pointerup', releaseAtk);
      window.addEventListener('pointercancel', releaseAtk);
    }
    // Dodge
    if (mobBtnDodge) {
      mobBtnDodge.addEventListener('pointerdown', e => {
        e.preventDefault();
        SFX.init();
        P.Space = 1;
      });
    }
    // Skills
    if (mobBtnSkill1)
      mobBtnSkill1.addEventListener('pointerdown', e => { e.preventDefault(); SFX.init(); P.KeyZ = 1; });
    if (mobBtnSkill2)
      mobBtnSkill2.addEventListener('pointerdown', e => { e.preventDefault(); SFX.init(); P.KeyX = 1; });
    if (mobBtnSkill3)
      mobBtnSkill3.addEventListener('pointerdown', e => { e.preventDefault(); SFX.init(); P.KeyC = 1; });
    // Ult, Focus, Potion
    if (mobBtnUlt)
      mobBtnUlt.addEventListener('pointerdown', e => { e.preventDefault(); SFX.init(); P.KeyQ = 1; });
    if (mobBtnFocus)
      mobBtnFocus.addEventListener('pointerdown', e => { e.preventDefault(); SFX.init(); P.KeyE = 1; });
    if (mobBtnPotion)
      mobBtnPotion.addEventListener('pointerdown', e => { e.preventDefault(); SFX.init(); P.KeyR = 1; });
    // Interact
    if (mobBtnInteract)
      mobBtnInteract.addEventListener('pointerdown', e => { e.preventDefault(); SFX.init(); P.KeyG = 1; });
    // Top Bar Actions
    if (mobBtnPause)
      mobBtnPause.addEventListener('pointerdown', e => { e.preventDefault(); pauseGame(); });
    if (mobBtnAudio) {
      mobBtnAudio.addEventListener('pointerdown', e => {
        e.preventDefault();
        SFX.toggle();
        mobBtnAudio.textContent = SFX.isOn() ? '♪' : '✕';
      });
    }
    if (mobBtnFullscreen) {
      mobBtnFullscreen.addEventListener('pointerdown', e => {
        e.preventDefault();
        const d = document.documentElement;
        try {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (d.requestFullscreen) {
            d.requestFullscreen();
          }
        } catch (err) { }
      });
    }
    if (mobBtnLobby)
      mobBtnLobby.addEventListener('pointerdown', e => { e.preventDefault(); P.KeyB = 1; });
    // Weapon Switcher
    document.querySelectorAll('.mob-wpn-btn').forEach(btn => {
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        const idx = parseInt(btn.dataset.wpn);
        if (typeof wi !== 'undefined' && wi !== idx) {
          P['Digit' + (idx + 1)] = 1;
        }
      });
    });
    // Stat Modal
    function toggleStatModal(show) {
      if (!statModal)
        return;
      const shouldShow = show !== undefined ? show : statModal.classList.contains('hidden');
      if (shouldShow) {
        statModal.classList.remove('hidden');
      } else {
        statModal.classList.add('hidden');
      }
    }
    window.toggleStatModal = toggleStatModal;
    if (mobBtnStat)
      mobBtnStat.addEventListener('pointerdown', e => { e.preventDefault(); msg(lobby ? 'Temui Ketua Orin di lobby dan bicara [G] untuk membuka Kitab Status' : 'Status hanya bisa dinaikkan di lobby lewat Ketua Orin'); });
    if (mobStatClose)
      mobStatClose.addEventListener('pointerdown', e => { e.preventDefault(); toggleStatModal(false); });
    document.querySelectorAll('.stat-add-btn').forEach(btn => {
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        const stat = btn.dataset.stat;
        const keyMap = { VIT: 'Digit6', STR: 'Digit7', DEF: 'Digit8', AGI: 'Digit9', INT: 'Digit0' };
        if (keyMap[stat] && pts > 0) {
          P[keyMap[stat]] = 1;
        }
      });
    });
  }
  // Mobile UI Frame Update (called during upd(dt))
  window.updateMobileUI = function () {
    if (!isMobile)
      return;
    const pObj = typeof p !== 'undefined' ? p : null;
    if (!pObj)
      return;
    // Skills cooldown & labels
    if (typeof SK !== 'undefined' && typeof wi !== 'undefined' && SK[wi]) {
      for (let i = 0; i < 3; i++) {
        const q = SK[wi][i];
        const cdEl = document.getElementById('mobSk' + (i + 1) + 'Cd');
        if (cdEl && q)
          cdEl.style.height = (pObj.sc[i] > 0 ? (pObj.sc[i] / q.cd) * 100 : 0) + '%';
      }
    }
    // Attack charge circle
    const chargeCircle = document.getElementById('mobChargeCircle');
    if (chargeCircle) {
      const ch = (M.d && pObj.hold > 0.05);
      const pct = ch ? Math.min(1, pObj.hold / 0.6) : 0;
      chargeCircle.style.strokeDashoffset = 233 * (1 - pct);
    }
    // Ult ready
    const ultBtn = document.getElementById('mobBtnUlt');
    if (ultBtn && typeof ULT !== 'undefined') {
      if (ULT >= ULT_MAX)
        ultBtn.classList.add('ready');
      else
        ultBtn.classList.remove('ready');
    }
    // Potion count
    const potBadge = document.getElementById('mobPotCount');
    if (potBadge)
      potBadge.textContent = pObj.pot;
    // Weapon active
    if (typeof wi !== 'undefined') {
      document.querySelectorAll('.mob-wpn-btn').forEach((btn, idx) => {
        if (idx === wi)
          btn.classList.add('active');
        else
          btn.classList.remove('active');
      });
    }
    // Stat point badge & values
    const statBtn = document.getElementById('mobBtnStat');
    const statBadge = document.getElementById('mobStatBadge');
    const statPts = document.getElementById('mobStatPts');
    if (typeof pts !== 'undefined') {
      if (pts > 0) {
        if (statBtn)
          statBtn.classList.remove('hidden');
        if (statBadge)
          statBadge.textContent = pts;
      } else {
        if (statBtn)
          statBtn.classList.add('hidden');
      }
      if (statPts)
        statPts.textContent = pts;
    }
    if (typeof A !== 'undefined') {
      ['VIT', 'STR', 'DEF', 'AGI', 'INT'].forEach(s => {
        const el = document.getElementById('val' + s);
        if (el)
          el.textContent = A[s];
      });
    }
    // Lobby button in top bar
    const lobbyBtn = document.getElementById('mobBtnLobby');
    if (lobbyBtn && typeof lobby !== 'undefined') {
      if (!lobby)
        lobbyBtn.classList.remove('hidden');
      else
        lobbyBtn.classList.add('hidden');
    }
    // Contextual Interact Button
    const interactBtn = document.getElementById('mobBtnInteract');
    const interactText = document.getElementById('mobInteractText');
    if (interactBtn) {
      const nearNpc = (typeof lobby !== 'undefined' && lobby && typeof NP !== 'undefined' && typeof TN !== 'undefined')
        ? NP.concat(TN).find(n => dist(n, pObj) < 38)
        : null;
      const isDlg = (typeof dlg !== 'undefined' && dlg !== null);
      if (isDlg || nearNpc) {
        interactBtn.classList.remove('hidden');
        if (interactText)
          interactText.textContent = isDlg ? 'LANJUT ▶' : 'BICARA [G]';
      } else {
        interactBtn.classList.add('hidden');
      }
    }
  };

  /* ===== PWA SERVICE WORKER & INSTALL PROMPT ===== */
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('installBtn');
    if (btn)
      btn.classList.remove('hidden');
  });

  function installPWA() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(choice => {
        if (choice.outcome === 'accepted') {
          const btn = document.getElementById('installBtn');
          if (btn)
            btn.classList.add('hidden');
        }
        deferredPrompt = null;
      });
    } else {
      alert("Untuk install di iOS Safari: tekan tombol Bagikan (Share) lalu pilih 'Add to Home Screen' (Tambah ke Layar Utama).");
    }
  }
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => { });
    });
  }
  Object.assign(window, {
    startCinematic, openSettings, closeSettings, exitGame, skipCinematic, startGame, pauseGame, resumeGame, installPWA
  });
  showMenuScene();
  initMobileControls();
})();
(function () {
  const DEATH_TIME = 3.8;
  if (typeof upd !== 'function' || typeof draw !== 'function' || typeof drawHero !== 'function' || typeof drawArmed !== 'function')
    return;
  const D = { on: false, t: 0, at: 0, dir: 1, P: [], R: [], wp: null, soul: 0, open: 0, P0: null, hold: 0, ck: 0 }, HOLD_AT = 2.6;
  const E = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u), cl = (v, a, b) => Math.max(a, Math.min(b, v)), rn = Math.random;
  const _upd = upd, _draw = draw, _hero = drawHero, _armed = drawArmed;
  const snd = f => {
    try {
      SFX[f]();
    } catch (e) { }
  };

  function pose(a) {
    let kb = 0, rot = 0, dy = 0, sy = 1, fl = 0;
    const d = D.dir;
    if (a < .12) {
      fl = 1;
      rot = -d * .08;
    } else if (a < .55) {
      const u = (a - .12) / .43;
      kb = d * 14 * (1 - Math.pow(1 - u, 2));
      rot = d * (.1 + .27 * u);
    } else if (a < .95) {
      const u = E((a - .55) / .4);
      kb = d * 14;
      rot = d * (.37 - .22 * u) + Math.sin(a * 40) * .02 * (1 - u);
      dy = 3.5 * u;
      sy = 1 - .14 * u;
    } else if (a < 1.35) {
      const u = (a - .95) / .4;
      kb = d * (14 + 10 * u);
      rot = d * (.15 + 1.4208 * Math.pow(u, 2.2));
      dy = 3.5 * (1 - u);
      sy = .86 + .14 * u;
    } else {
      const b = a - 1.35;
      kb = d * 24;
      rot = d * (1.5708 - .24 * Math.exp(-b * 8) * Math.abs(Math.sin(b * 20)));
    }
    return { kb, rot, dy, sy, fl };
  }
  const ring = (x, y, r, v, life, col, w, e) => D.R.push({ x, y, r, v, life, max: life, col, w, e: e || .55 });

  function sparks(x, y, n, spd, cols, life) {
    for (let i = 0; i < n; i++) {
      const a = rn() * 6.283, v = spd * (.35 + rn());
      D.P.push({
        k: 0, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: life * (.6 + rn() * .6), max: life, s: 1.5 + rn() * 2, c: cols[i % cols.length], g: 260
      });
    }
  }

  function dust(x, y, n) {
    for (let i = 0; i < n; i++) {
      const s = rn() < .5 ? -1 : 1;
      D.P.push({
        k: 1, x: x + s * rn() * 8, y, vx: s * (20 + rn() * 70), vy: -5 - rn() * 20, life: .6 + rn() * .5, max: 1, s: 3 + rn() * 4
      });
    }
  }

  function start() {
    D.on = true;
    D.t = 0;
    D.at = 0;
    D.soul = 0;
    D.P = [];
    D.R = [];
    D.P0 = p;
    D.hold = 0;
    D.ck = !!(window.CKPT && window.CKPT.canOffer());
    const n = (typeof es !== 'undefined' ? es : []).filter(e => e.sw <= 0).sort((a, b) => dist(a, p) - dist(b, p))[0];
    D.dir = n ? (p.x >= n.x ? 1 : -1) : (rn() < .5 ? -1 : 1);
    p.vx = p.vy = 0;
    p.wb = 0;
    p.focus = 0;
    p.dod = 0;
    p.dfx = 0;
    try {
      ULTH = 0;
    } catch (e) { }
    msgT = 0;
    D.wp = { x: p.x + D.dir * 4, y: p.y + 2, z: 14, vz: 150, vx: D.dir * 70, vy: -10, rot: 0, vr: D.dir * 11, w: wi };
    shake = Math.max(shake, 11);
    FLSH = 1;
    FLSC = '255,255,255';
    ring(p.x, p.y - 8, 6, 300, .5, '255,230,235', 3, 1);
    ring(p.x, p.y + 6, 6, 220, .6, '255,90,120', 2);
    sparks(p.x, p.y - 8, 34, 190, ['#ff5a78', '#ffd0da', '#fff', '#c14c61'], .8);
    p.dead = DEATH_TIME;
  }

  function step(dt) {
    D.t += dt;
    const sc = D.t < .5 ? .3 : D.t < 1 ? .3 + .7 * E((D.t - .5) / .5) : 1, as = dt * sc, a0 = D.at;
    D.at += as;
    const at = D.at, d = D.dir, q = pose(at), px = p.x + q.kb, py = p.y + 7;
    p.vx = at < .55 ? -d * 70 * (1 - at / .55) : 0;
    if (a0 < 1.35 && at >= 1.35) {
      snd('stagger');
      shake = Math.max(shake, 8);
      dust(px + d * 14, py, 16);
      ring(px + d * 14, py, 6, 150, .45, '200,190,170', 3);
    }
    if (!D.soul && at >= 1.65) {
      D.soul = 1;
      snd('pickup');
      ring(px + d * 18, py - 4, 6, 120, .7, '150,225,255', 2);
    }
    if (at > 2 && at < 3.1)
      for (let i = 0; i < 3; i++)
        D.P.push({
          k: 2, x: px + d * (4 + rn() * 32), y: py - 2 + (rn() - .5) * 10, vx: (rn() - .5) * 14, vy: -20 - rn() * 40, life: .8 + rn() * .6, max: 1.3, c: ['#aeb4c2', '#9a2038', '#e8cdbd', '#d9dce5'][i % 4]
        });
    const u = cl((at - 1.65) / 1.4, 0, 1);
    if (at > 1.65 && u < 1)
      D.P.push({
        k: 3, x: px + d * 18 + Math.sin(at * 5) * 5 * u, y: py - 6 - E(u) * 90, vx: (rn() - .5) * 14, vy: 6 + rn() * 10, life: .7, max: .7, s: 2 + rn() * 3, c: '180,225,255'
      });
    const w = D.wp;
    w.vz -= 520 * as;
    w.z += w.vz * as;
    if (w.z <= 0) {
      w.z = 0;
      if (Math.abs(w.vz) > 60) {
        w.vz = -w.vz * .38;
        w.vx *= .6;
        w.vr *= .55;
        sparks(w.x, w.y, 6, 70, ['#fff', '#ffd34d'], .35);
      } else {
        w.vz = 0;
        w.vr *= Math.pow(.05, as);
        w.vx *= Math.pow(.05, as);
      }
    }
    w.x += w.vx * as;
    w.y += w.vy * as;
    w.rot += w.vr * as;
    D.R = D.R.filter(o => { o.life -= as; o.r += o.v * as; o.v *= Math.pow(.15, as); return o.life > 0; });
    D.P = D.P.filter(o => {
      o.life -= as; if (o.life <= 0)
        return false; o.x += o.vx * as; o.y += o.vy * as; if (o.k == 0) {
          o.vy += o.g * as;
          o.vx *= Math.pow(.25, as);
        } else {
        const f = Math.pow(.2, as);
        o.vx *= f;
        o.vy *= f;
        if (o.k == 1)
          o.s += 6 * as;
        if (o.k == 2)
          o.vy -= 40 * as;
      } return true;
    });
  }
  upd = function (dt) {
    if (D.on && p && p.dead > 0) {
      if (D.hold)
        return; // layar checkpoint: animasi kematian ditahan
      try {
        step(dt);
      } catch (e) {
        D.on = false;
      }
      if (D.ck && D.at >= HOLD_AT) {
        D.hold = 1;
        try {
          window.CKPT.show();
        } catch (e) {
          D.hold = 0;
          D.ck = 0;
        }
        return;
      }
      p.dead = D.t >= DEATH_TIME ? dt * .5 : DEATH_TIME - D.t + dt * 1.01;
      _upd(dt);
      if (p !== D.P0 || p.dead <= 0) {
        D.on = false;
        D.open = 0;
      }
      return;
    }
    _upd(dt);
    if (p && p.dead > 0 && !D.on) {
      try {
        start();
      } catch (e) {
        D.on = false;
      }
    }
  };
  drawHero = function (x, y, gh, ph, lx, ly) {
    if (!D.on || gh)
      return _hero(x, y, gh, ph, lx, ly);
    const q = pose(D.at), al = 1 - E((D.at - 2) / 1);
    g.save();
    D.open = 1;
    g.translate(x + q.kb, y + 7 + q.dy);
    g.rotate(q.rot);
    g.scale(1, q.sy);
    g.translate(-x, -y - 7);
    g.globalAlpha = al;
    HT = q.fl ? '#fff' : null;
    _hero(x, y, 0, ph, lx, ly);
    HT = null;
  };
  drawArmed = function (o) {
    if (!D.on)
      return _armed(o); _armed({ sp: [], gr: [], fn: null }); if (D.open) {
        g.restore();
        D.open = 0;
      }
  };

  function overlay() {
    const at = D.at, d = D.dir, q = pose(at), px = p.x + q.kb, py = p.y + 7;
    g.save();
    g.scale(CAM_Z, CAM_Z);
    g.translate(-camX, -camY);
    if (at > 1.35) {
      const k = cl((at - 1.35) / .4, 0, 1) * (1 - E((at - 2.6) / .5));
      if (k > 0)
        pilFx({ x: px + d * 18, y: py, w: 34, h: 170, c: '170,215,255' }, k * .8);
    }
    const w = D.wp;
    g.fillStyle = 'rgba(0,0,0,' + (.3 - .2 * cl(w.z / 30, 0, 1)) + ')';
    g.beginPath();
    g.ellipse(w.x, w.y + 3, 9, 3, 0, 0, 7);
    g.fill();
    wspr(w.w, w.x, w.y - w.z, w.rot + (w.w == 2 ? 0 : Math.PI / 2), 1);
    D.R.forEach(o => { const k = o.life / o.max; g.strokeStyle = 'rgba(' + o.col + ',' + k + ')'; g.lineWidth = o.w * k + .5; g.beginPath(); g.ellipse(o.x, o.y, o.r, o.r * o.e, 0, 0, 7); g.stroke(); });
    D.P.forEach(o => {
      const k = o.life / o.max;
      if (o.k == 0) {
        g.globalAlpha = k;
        g.fillStyle = o.c;
        g.fillRect(Math.round(o.x), Math.round(o.y), Math.ceil(o.s), Math.ceil(o.s));
      } else if (o.k == 1) {
        g.globalAlpha = k * .5;
        g.fillStyle = '#8a8070';
        g.beginPath();
        g.arc(o.x, o.y, o.s, 0, 7);
        g.fill();
      } else if (o.k == 2) {
        g.globalAlpha = k;
        g.fillStyle = o.c;
        g.fillRect(Math.round(o.x), Math.round(o.y), 2, 2);
      } else {
        g.save();
        g.globalCompositeOperation = 'lighter';
        const r = o.s * 2, gr = g.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
        gr.addColorStop(0, 'rgba(' + o.c + ',' + k * .8 + ')');
        gr.addColorStop(1, 'rgba(' + o.c + ',0)');
        g.fillStyle = gr;
        g.fillRect(o.x - r, o.y - r, r * 2, r * 2);
        g.restore();
      }
    });
    g.globalAlpha = 1;
    const u = cl((at - 1.65) / 1.4, 0, 1);
    if (at > 1.65 && u < 1) {
      const sx = px + d * 18 + Math.sin(at * 5) * 5 * u, sy = py - 6 - E(u) * 90, sa = Math.min(1, (at - 1.65) * 3) * (1 - E((u - .7) / .3));
      g.save();
      g.globalCompositeOperation = 'lighter';
      let gr = g.createRadialGradient(sx, sy, 0, sx, sy, 22);
      gr.addColorStop(0, 'rgba(255,255,255,' + sa + ')');
      gr.addColorStop(.3, 'rgba(160,220,255,' + sa * .7 + ')');
      gr.addColorStop(1, 'rgba(80,140,255,0)');
      g.fillStyle = gr;
      g.fillRect(sx - 22, sy - 22, 44, 44);
      g.fillStyle = 'rgba(255,255,255,' + sa + ')';
      g.fillRect(Math.round(sx) - 1, Math.round(sy) - 3, 3, 6);
      g.fillRect(Math.round(sx) - 3, Math.round(sy) - 1, 7, 3);
      g.restore();
    }
    g.restore();
    const ds = E(at / 1.6) * .9;
    g.save();
    g.globalCompositeOperation = 'saturation';
    g.globalAlpha = ds;
    g.fillStyle = '#808080';
    g.fillRect(0, 0, W, H);
    g.restore();
    {
      const hb = at < 1.4 ? Math.exp(-(at % .5) * 6) * (1 - at / 1.4) : 0, gr = g.createRadialGradient(W / 2, H / 2, H * .2, W / 2, H / 2, Math.max(W, H) * .7);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(1, 'rgba(' + Math.round(120 * hb) + ',0,10,' + Math.min(.9, .3 + .5 * ds + .35 * hb) + ')');
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
    }
    {
      const bh = H * .085 * E(at / .7);
      g.fillStyle = '#000';
      g.fillRect(0, 0, W, bh);
      g.fillRect(0, H - bh, W, bh);
    }
    if (at > 1.7) {
      const ta = E((at - 1.7) / .7), f = Math.round(H * .07);
      g.save();
      g.globalAlpha = ta;
      g.textAlign = 'center';
      g.font = 'bold ' + f + 'px Georgia, serif';
      try {
        g.letterSpacing = (4 + (1 - ta) * 14) + 'px';
      } catch (e) { }
      g.shadowColor = '#b0152d';
      g.shadowBlur = 18;
      g.fillStyle = '#e8d6c0';
      g.fillText('KAU GUGUR', W / 2, H * .47);
      g.shadowBlur = 0;
      try {
        g.letterSpacing = '0px';
      } catch (e) { }
      const lw = W * .22 * ta;
      g.fillStyle = 'rgba(176,21,45,.9)';
      g.fillRect(W / 2 - lw / 2, H * .47 + f * .35, lw, 2);
      if (at > 2.1) {
        g.globalAlpha = E((at - 2.1) / .6) * .75;
        g.font = 'bold ' + Math.round(f * .3) + 'px monospace';
        g.fillStyle = '#b9b4c8';
        g.fillText(D.ck ? (bossNm() + ' masih menunggumu...') : 'Jiwamu kembali ke lobby...', W / 2, H * .47 + f * .95);
      }
      g.restore();
    }
    const fo = E((D.t - (DEATH_TIME - .55)) / .55);
    if (fo > 0) {
      g.fillStyle = 'rgba(0,0,0,' + fo + ')';
      g.fillRect(0, 0, W, H);
    }
  }
  draw = function () {
    const dying = D.on && p && p.dead > 0;
    let sv = 0;
    if (dying) {
      sv = p.dead;
      p.dead = 0;
    }
    _draw();
    if (D.open) {
      g.restore();
      D.open = 0;
    }
    if (dying) {
      p.dead = sv;
      try {
        overlay();
      } catch (e) {
        D.on = false;
      }
    }
  };
  window.DEATHFX = { off() { D.on = false; D.hold = 0; D.ck = 0; D.open = 0; } };
})();
(function () {
  if (typeof BGL === 'undefined' || typeof WL === 'undefined' || typeof lobbyDraw !== 'function' || typeof lobbyTick !== 'function' || typeof NP === 'undefined')
    return;
  const b = BGL.getContext('2d');
  const px = (x, y, w, h, c) => { b.fillStyle = c; b.fillRect(x, y, w, h); }, el = (x, y, rx, ry, c) => { b.fillStyle = c; b.beginPath(); b.ellipse(x, y, rx, ry, 0, 0, 7); b.fill(); };
  // ---------- STATIC (digambar sekali ke latar lobby) ----------
  {
    const sg = b.createRadialGradient(80, 100, 6, 80, 100, 90);
    sg.addColorStop(0, 'rgba(10,5,2,.5)');
    sg.addColorStop(1, 'rgba(10,5,2,0)');
    b.fillStyle = sg;
    b.fillRect(14, 24, 200, 170);
  }
  px(40, 70, 72, 6, '#2e2a38');
  px(40, 70, 72, 1, '#6a6482');
  px(40, 75, 72, 1, 'rgba(0,0,0,.35)');
  for (let i = 0; i < 9; i++)
    px(42 + i * 8, 72, 1, 3, 'rgba(0,0,0,.3)');
  // papan nama tergantung
  px(66, 14, 1, 7, '#6a6672');
  px(94, 14, 1, 7, '#6a6672');
  px(54, 21, 52, 13, 'rgba(0,0,0,.35)');
  px(52, 19, 52, 13, '#4a3424');
  px(52, 19, 52, 2, '#8a6038');
  px(52, 30, 52, 2, '#2a1c12');
  px(52, 19, 2, 13, '#2a1c12');
  px(102, 19, 2, 13, '#2a1c12');
  b.font = 'bold 6px monospace';
  b.textAlign = 'center';
  b.fillStyle = '#ffd34d';
  b.fillText('PANDAI BESI', 78, 28);
  b.textAlign = 'left';
  // dinding perkakas (palu, tang, penjepit)
  px(18, 17, 28, 2, '#3a2a1c');
  px(22, 19, 2, 12, '#6b4d33');
  px(19, 19, 8, 4, '#8a8f9c');
  px(19, 19, 8, 1, '#d6dde8');
  px(31, 19, 1, 15, '#6a6f7c');
  px(34, 19, 1, 15, '#6a6f7c');
  px(30, 33, 3, 2, '#6a6f7c');
  px(33, 33, 3, 2, '#6a6f7c');
  px(40, 19, 2, 10, '#7a5230');
  px(38, 28, 6, 4, '#6a6f7c');
  px(38, 28, 6, 1, '#c4cedb');
  // tunggul landasan
  el(97, 118, 12, 3, 'rgba(0,0,0,.4)');
  px(88, 107, 18, 10, '#4a3424');
  px(88, 107, 3, 10, '#6b4a32');
  px(102, 107, 4, 10, '#2a1c12');
  el(97, 107, 9, 3.4, '#8a6038');
  el(97, 107, 6, 2.2, '#6b4a2e');
  el(97, 107, 2.8, 1, '#4a321e');
  // tong air pendingin
  el(31, 121, 15, 4, 'rgba(30,70,110,.35)');
  el(31, 119, 12, 3.5, 'rgba(0,0,0,.4)');
  px(22, 98, 18, 21, '#6b4a2e');
  px(22, 98, 3, 21, '#8a6038');
  px(37, 98, 3, 21, '#4a321e');
  px(22, 102, 18, 2, '#6a6f7c');
  px(22, 113, 18, 2, '#6a6f7c');
  el(31, 98, 9, 3.4, '#3a2412');
  el(31, 98, 7.4, 2.6, '#2a6f9a');
  el(31, 97.6, 5, 1.6, '#4fa8d6');
  // batu asah
  px(24, 142, 22, 5, '#3a2412');
  px(24, 142, 22, 1, '#6b4a32');
  px(20, 124, 3, 19, '#4a3424');
  px(46, 124, 3, 19, '#4a3424');
  px(20, 124, 29, 2, '#6b4a32');
  el(34, 150, 16, 3, 'rgba(0,0,0,.3)');
  // peti batu bara + sekop
  px(113, 62, 20, 12, 'rgba(0,0,0,.35)');
  px(112, 58, 20, 12, '#3a2a1c');
  px(112, 58, 20, 2, '#6b4d33');
  px(112, 68, 20, 2, '#241810');
  px(114, 58, 1, 12, '#241810');
  px(129, 58, 1, 12, '#241810');
  el(122, 58, 9, 3.6, '#16121a');
  for (let i = 0; i < 10; i++)
    px(115 + (i * 7) % 14, 56 + (i * 3) % 4, 2, 2, i % 3 ? '#2a2630' : '#3a3640');
  px(135, 50, 2, 22, '#6b4d33');
  px(133, 68, 6, 5, '#8a8f9c');
  px(133, 68, 6, 1, '#d6dde8');
  // tumpukan batang logam
  {
    const ing = (x, y, c, h) => { px(x, y, 13, 4, '#14121f'); px(x + 1, y + 1, 11, 2, c); px(x + 1, y + 1, 11, 1, h); };
    px(139, 78, 28, 2, 'rgba(0,0,0,.3)');
    ing(139, 74, '#aeb4c2', '#eef1f7');
    ing(153, 74, '#aeb4c2', '#eef1f7');
    ing(146, 70, '#c9a46b', '#ffe08a');
  }
  // papan pajangan pedang pusaka (dinding)
  px(110, 17, 50, 41, 'rgba(0,0,0,.4)');
  px(108, 15, 50, 41, '#1c120a');
  px(110, 17, 46, 37, '#3a2616');
  for (let y = 20; y < 54; y += 4)
    px(110, y, 46, 1, 'rgba(0,0,0,.2)');
  px(113, 20, 40, 31, '#4a1a28');
  px(113, 20, 40, 2, '#7a2a3c');
  b.strokeStyle = '#c2a06b';
  b.lineWidth = 1;
  b.strokeRect(113.5, 20.5, 39, 30);
  [[111, 18], [153, 18], [111, 50], [153, 50]].forEach(([x, y]) => px(x, y, 3, 3, '#c2a06b'));
  px(122, 52, 22, 4, '#c2a06b');
  px(123, 53, 20, 2, '#8a6a3a');
  // rak senjata lantai
  el(168, 135, 52, 5, 'rgba(0,0,0,.38)');
  px(126, 100, 84, 26, 'rgba(14,8,5,.45)');
  px(124, 98, 4, 36, '#3a2412');
  px(208, 98, 4, 36, '#3a2412');
  px(124, 98, 4, 2, '#8a6038');
  px(208, 98, 4, 2, '#8a6038');
  px(124, 102, 88, 3, '#5a3a22');
  px(124, 102, 88, 1, '#8a6038');
  [140, 154, 168, 182, 196].forEach(x => { px(x - 6, 113, 12, 2, '#3a2412'); px(x - 6, 113, 12, 1, '#6b4a32'); });
  px(122, 124, 92, 9, '#4a3424');
  px(122, 124, 92, 2, '#8a6038');
  px(122, 131, 92, 2, '#2a1c12');
  [140, 154, 168, 182, 196].forEach(x => { px(x - 4, 127, 8, 3, '#241810'); px(x - 4, 127, 8, 1, '#c2a06b'); });
  // tabrakan
  WL.push([122, 124, 92, 9, 'k'], [22, 98, 18, 21, 'k'], [20, 124, 30, 24, 'k'], [112, 58, 22, 14, 'k'], [88, 107, 18, 10, 'k'], [18, 48, 26, 18, 'k']);
  // dialog Brokk
  NP[0].lines = [
    'Heh, akhirnya bangun juga! Senjatamu kelihatan tua, tapi masih tajam.', 'Rak di sana itu koleksi pribadiku: pedang, tombak, busur, tongkat, belati. Mau lihat? Tekan G di dekat rak.', 'Pedang pusaka di dinding itu peninggalan pahlawan terdahulu. Tiap senjata punya 3 hit combo berbeda; tahan klik kiri untuk charged, Z X C untuk skill.'
  ];
  const RK = {
    n: 'Rak Senjata Brokk', x: 168, y: 128, lines: [
      'Rak senjata pribadiku! Lima senjata, lima gaya bertarung. Semuanya kutempa sendiri.', 'PEDANG: seimbang dan serbaguna. Tebasan kiri lalu kanan, dan hantaman besar di hit ketiga.', 'TOMBAK: jangkauan panjang, menembus barisan musuh. BUSUR: tembak dari jauh, tahan klik kiri untuk panah tembus.', 'TONGKAT: bola sihir yang meledak, bagus lawan kerumunan. BELATI: cepat dan lincah, berputar silang di hit ketiga.', 'Pedang pusaka di dinding itu? Konon ia memilih pemiliknya, bukan sebaliknya. Mungkin ia memilihmu.'
    ]
  };
  const _lt = lobbyTick;
  lobbyTick = function (dt) {
    if (lobby && (typeof trn === 'undefined' || !trn) && P.KeyG && !dlg && dist(RK, p) < 50 && !NP.some(n => dist(n, p) < 36)) {
      dlg = { n: RK, i: 0 };
      try {
        SFX.pickup();
      } catch (e) { }
      delete P.KeyG;
    } _lt(dt);
  };
  // ---------- DINAMIS (api, bellows, percikan, senjata berkilau) ----------
  const SL = [
    [0, .34, 78, 95, 140], [1, .4, 68, 99, 154], [2, .26, 51, 97, 168], [3, .3, 62, 99, 182], [4, .3, 63, 77, 196]
  ];
  let lu = 0, lastHit = -9;
  const tw = (x, y, a) => {
    if (a < .02)
      return; g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,255,255,' + a + ')'; g.fillRect(Math.round(x) - 3, Math.round(y), 7, 1); g.fillRect(Math.round(x), Math.round(y) - 3, 1, 7); g.fillStyle = 'rgba(255,240,200,' + a * .6 + ')'; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); g.restore();
  };

  function strike() {
    lastHit = t;
    for (let i = 0; i < 22; i++) {
      const a = -Math.PI / 2 + (R() - .5) * 2.6, v = 60 + R() * 130;
      dp.push({
        k: 'p', x: 96, y: 99, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .3 + R() * .35, max: .65, s: 1 + R() * 1.6, c: i % 3 ? '#ffb050' : '#fff3c0'
      });
    }
    fx.push({ k: 'gl', x: 96, y: 99, r: 28, c: '255,190,100', life: .28, max: .28 }, { k: 'ring', x: 96, y: 100, r: 7, life: .2, max: .2, col: '#ffd9a0' });
    if (lobby && p && dist(p, { x: 96, y: 100 }) < 230) {
      try {
        SFX.sw();
      } catch (e) { }
    }
  }

  function smith() {
    if (camX > 330)
      return;
    const u = t % 3.6;
    if (lu < 2 && u >= 2)
      strike();
    lu = u;
    const pump = (Math.sin(t * 2.2) + 1) / 2, hot = Math.max(0, 1 - (t - lastHit) / 2.2);
    // bellows
    {
      const yt = 50 + pump * 7;
      g.fillStyle = '#14121f';
      g.fillRect(19, yt - 3, 24, 18 - (yt - 50));
      g.fillStyle = '#7a4a2a';
      g.beginPath();
      g.moveTo(20, yt);
      g.lineTo(42, yt + 3);
      g.lineTo(42, 62);
      g.lineTo(20, 62);
      g.fill();
      g.fillStyle = 'rgba(0,0,0,.25)';
      for (let i = 0; i < 4; i++)
        g.fillRect(22 + i * 5, yt + 1 + i * .6, 1, 62 - yt - 1);
      g.fillStyle = '#8a6038';
      g.fillRect(20, yt - 2, 22, 3);
      g.fillStyle = '#5a3a22';
      g.fillRect(20, 62, 22, 3);
      g.fillStyle = '#6b4d33';
      g.fillRect(24, yt - 14, 2, 12);
      g.fillRect(22, yt - 15, 6, 2);
      g.fillStyle = '#3a3d48';
      g.fillRect(42, 56, 8, 3);
      g.fillStyle = '#8a909e';
      g.fillRect(42, 56, 8, 1);
    }
    // api tungku
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const x0 = 57 + i * 3.6, h = (6 + Math.sin(t * 11 + i * 1.7) * 2 + Math.sin(t * 17 + i * 2.3) * 1.6) * (1 + pump * .5), sw = Math.sin(t * 9 + i) * 1.2;
      g.fillStyle = 'rgba(255,110,30,.8)';
      g.beginPath();
      g.moveTo(x0 - 2.2, 60);
      g.quadraticCurveTo(x0 - 2.5, 60 - h * .6, x0 + sw, 60 - h);
      g.quadraticCurveTo(x0 + 2.5, 60 - h * .6, x0 + 2.2, 60);
      g.fill();
      g.fillStyle = 'rgba(255,226,138,.85)';
      g.beginPath();
      g.moveTo(x0 - 1.1, 60);
      g.quadraticCurveTo(x0 - 1.2, 60 - h * .35, x0 + sw * .5, 60 - h * .62);
      g.quadraticCurveTo(x0 + 1.2, 60 - h * .35, x0 + 1.1, 60);
      g.fill();
    }
    let q = g.createRadialGradient(68, 58, 0, 68, 58, 22);
    q.addColorStop(0, 'rgba(255,150,50,' + (.3 + .15 * pump) + ')');
    q.addColorStop(1, 'rgba(255,100,20,0)');
    g.fillStyle = q;
    g.fillRect(44, 36, 48, 44);
    for (let i = 0; i < 4; i++) {
      const f = .5 + .5 * Math.sin(t * 3 + i * 1.8);
      g.fillStyle = 'rgba(255,90,40,' + (.25 + .45 * f) + ')';
      g.fillRect(116 + i * 4, 56 + (i % 2), 2, 2);
    }
    // logam panas di landasan
    if (hot > 0) {
      q = g.createRadialGradient(96, 99, 0, 96, 99, 10 + 6 * hot);
      q.addColorStop(0, 'rgba(255,170,70,' + .7 * hot + ')');
      q.addColorStop(1, 'rgba(255,100,20,0)');
      g.fillStyle = q;
      g.fillRect(80, 84, 32, 30);
      g.fillStyle = 'rgba(255,' + (120 + 100 * hot | 0) + ',60,' + (.5 + .5 * hot) + ')';
      g.fillRect(93, 98, 7, 2);
    }
    g.restore();
    if (R() < .06)
      dp.push({
        k: 'p', x: 60 + R() * 14, y: 54, vx: (R() - .5) * 20, vy: -30 - R() * 30, life: .7, max: .7, s: 1.5, c: R() < .5 ? '#ffb050' : '#ff7a2a'
      });
    // uap tong pendingin
    if (R() < .035)
      puff(31, 94, 1, '200,215,225', .45);
    g.fillStyle = 'rgba(255,255,255,.5)';
    g.fillRect(Math.round(28 + Math.sin(t * 2) * 3), 97, 2, 1);
    g.fillRect(Math.round(33 + Math.cos(t * 2.3) * 3), 98, 1, 1);
    // batu asah berputar + percikan
    {
      const cx = 34, cy = 133, ag = t * 5;
      g.fillStyle = '#14121f';
      g.beginPath();
      g.arc(cx, cy, 10, 0, 7);
      g.fill();
      g.fillStyle = '#8a8790';
      g.beginPath();
      g.arc(cx, cy, 8.6, 0, 7);
      g.fill();
      g.fillStyle = '#a8a5ae';
      g.beginPath();
      g.arc(cx - 1.5, cy - 1.5, 5.5, 0, 7);
      g.fill();
      g.strokeStyle = '#5a5660';
      g.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        const a = ag + i * 2.094;
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8);
        g.stroke();
      }
      g.fillStyle = '#4a3424';
      g.beginPath();
      g.arc(cx, cy, 2, 0, 7);
      g.fill();
      g.strokeStyle = '#6b4d33';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cx + 10, cy);
      g.lineTo(cx + 10 + Math.cos(ag) * 5, cy + Math.sin(ag) * 5);
      g.stroke();
      g.lineWidth = 1;
      if (Math.sin(t * .5) > .5 && R() < .4) {
        const a = -2.4 + (R() - .5) * 1.2, v = 50 + R() * 90;
        dp.push({
          k: 'p', x: cx - 8, y: cy - 3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .25 + R() * .2, max: .45, s: 1 + R() * 1.3, c: R() < .5 ? '#ffb050' : '#fff3c0'
        });
      }
    }
    // pedang pusaka di dinding
    {
      const cx = 133, cy = 36;
      let q2 = g.createRadialGradient(cx, cy, 2, cx, cy, 28);
      q2.addColorStop(0, 'rgba(120,190,255,' + (.28 + .1 * Math.sin(t * 2)) + ')');
      q2.addColorStop(1, 'rgba(80,140,255,0)');
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = q2;
      g.fillRect(cx - 30, cy - 30, 60, 60);
      g.restore();
      wspr(1, cx, cy + 3.6, -.62, .5);
      wspr(1, cx, cy + 3.6, .62, .5);
      wspr(0, cx, cy + (78 - 48) * .34 * .85, 0, .85);
      tw(cx, 22, Math.pow(Math.max(0, Math.sin(t * 1.3)), 8));
    }
    // rak senjata: kelima senjata sang pahlawan
    SL.forEach(([i, S, ay, bot, x], k) => { const oy = 124 - (bot - ay) * S; g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x, 124, 6, 2, 0, 0, 7); g.fill(); wspr(i, x, oy, 0, 1); tw(x, oy - (ay - 2) * S + 1, Math.pow(Math.max(0, Math.sin(t * 1.7 + k * 1.9)), 8)); });
    if (!dlg && dist(RK, p) < 62) {
      g.font = '8px monospace';
      txt('[G] Rak Senjata', 168, 92, '#fff', 'center');
    }
  }
  const _ld = lobbyDraw;
  lobbyDraw = function () {
    _ld(); try {
      smith();
    } catch (e) { }
  };
})();

/* ===== DEKOR: BENGKEL BROKK (rapi) & TAMAN SERAPHINE (hijau) ===== */
(function () {
  if (typeof BGL === 'undefined' || typeof WL === 'undefined' || typeof lobbyDraw !== 'function')
    return;
  const b = BGL.getContext('2d');
  let sd = 5;
  const R2 = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, ri = (a, z) => a + Math.floor(R2() * (z - a + 1));
  const px = (x, y, w, h, c) => { b.fillStyle = c; b.fillRect(x, y, w, h); }, el = (x, y, rx, ry, c) => { b.fillStyle = c; b.beginPath(); b.ellipse(x, y, rx, ry, 0, 0, 7); b.fill(); };
  const OL = '#120e18', ob = (x, y, w, h, c) => { px(x - 1, y - 1, w + 2, h + 2, OL); px(x, y, w, h, c); };
  const G = ['#2f6a3c', '#3f8a4c', '#5fae5c', '#7fc86a', '#4a9a52'], FC = ['#f6a0c0', '#fff0a0', '#ffffff', '#c8a0ff', '#ff8a8a'];

  /* ---------- BENGKEL BROKK ---------- */
  // 1) rapikan: tutup ingot yang berserakan dengan lantai bersih, lalu ganti dengan palet tertata
  b.drawImage(BGL, 200, 64, 40, 26, 136, 64, 40, 26);
  px(133, 68, 6, 5, '#8a909e');
  px(133, 68, 6, 1, '#d6dde8');
  el(155, 86, 20, 3, 'rgba(0,0,0,.4)');
  ob(139, 80, 34, 4, '#6b4d33');
  px(139, 80, 34, 1, '#8a6a48');
  [141, 155, 167].forEach(x => px(x, 84, 4, 3, '#3a2616'));
  const ing = (x, y, c, h) => { px(x - 1, y - 1, 13, 6, OL); px(x, y, 11, 4, c); px(x, y, 11, 1, h); px(x + 10, y + 1, 1, 3, 'rgba(0,0,0,.25)'); };
  ing(141, 75, '#aeb4c2', '#eef1f7');
  ing(155, 75, '#aeb4c2', '#eef1f7');
  ing(148, 70, '#aeb4c2', '#eef1f7');
  ing(148, 65, '#c9a46b', '#ffe08a');
  // 2) karpet bengkel di bawah landasan + noda hangus di sekitar tungku
  el(78, 82, 38, 5, 'rgba(0,0,0,.28)');
  el(120, 80, 14, 3, 'rgba(0,0,0,.2)');
  {
    const x = 50, y = 86, w = 70, h = 50;
    px(x + 2, y + 3, w, h, 'rgba(0,0,0,.3)');
    px(x, y, w, h, '#3a2218');
    b.strokeStyle = '#9c7a52';
    b.lineWidth = 2;
    b.strokeRect(x + 3, y + 3, w - 6, h - 6);
    b.lineWidth = 1;
    b.strokeStyle = '#6b4d33';
    b.strokeRect(x + 7.5, y + 7.5, w - 15, h - 15);
    for (let i = 0; i < 7; i++) {
      px(x + 13 + i * 8, y + 23, 3, 3, '#c2a06b');
      px(x + 14 + i * 8, y + 24, 1, 1, '#3a2218');
    }
    for (let i = x + 2; i < x + w - 2; i += 3) {
      px(i, y - 2, 1, 2, '#9c7a52');
      px(i, y + h, 1, 2, '#9c7a52');
    }
    el(97, 114, 14, 5, 'rgba(0,0,0,.28)');
  }
  el(97, 118, 12, 3, 'rgba(0,0,0,.4)');
  px(88, 107, 18, 10, '#4a3424');
  px(88, 107, 3, 10, '#6b4a32');
  px(102, 107, 4, 10, '#2a1c12');
  el(97, 107, 9, 3.4, '#8a6038');
  el(97, 107, 6, 2.2, '#6b4a2e');
  el(97, 107, 2.8, 1, '#4a321e');
  // 3) papan perisai di dinding
  px(184, 20, 70, 30, 'rgba(0,0,0,.4)');
  ob(182, 17, 70, 30, '#3a2616');
  px(184, 19, 66, 26, '#4a3424');
  [23, 29, 35, 41].forEach(y => px(184, y, 66, 1, 'rgba(0,0,0,.22)'));
  px(182, 17, 70, 3, '#6b4d33');
  px(182, 17, 70, 1, '#8a6a48');
  px(182, 44, 70, 3, '#2a1c12');
  [[184, 19], [248, 19], [184, 42], [248, 42]].forEach(([x, y]) => px(x, y, 2, 2, '#c2a06b'));
  const shield = (cx, cy, c) => { el(cx, cy + 1, 9, 9, 'rgba(0,0,0,.35)'); el(cx, cy, 9, 9, OL); el(cx, cy, 8, 8, '#c2a06b'); el(cx, cy, 6.6, 6.6, c); px(cx - 1, cy - 6, 2, 12, '#e8dcc0'); px(cx - 6, cy - 1, 12, 2, '#e8dcc0'); el(cx, cy, 2.6, 2.6, OL); el(cx, cy, 2, 2, '#d6dde8'); px(cx - 5, cy - 5, 2, 1, 'rgba(255,255,255,.35)'); };
  shield(196, 32, '#a33b4c');
  shield(217, 32, '#2a4a7a');
  shield(238, 32, '#2f6a4a');
  ob(205, 48, 34, 3, '#4a3424');
  px(205, 48, 34, 1, '#c2a06b');
  // 4) meja kerja
  px(188, 74, 64, 6, 'rgba(0,0,0,.35)');
  ob(188, 66, 5, 12, '#3a2616');
  ob(245, 66, 5, 12, '#3a2616');
  ob(185, 58, 68, 9, '#5d4430');
  px(185, 58, 68, 2, '#7d5c3d');
  px(187, 63, 64, 1, 'rgba(0,0,0,.25)');
  ob(193, 67, 52, 5, '#4a3424');
  px(215, 69, 8, 1, '#c2a06b');
  ob(190, 52, 9, 6, '#6a6f7c');
  px(190, 52, 9, 2, '#c4cedb');
  ob(193, 49, 8, 2, '#6b4d33');
  ob(204, 54, 16, 4, '#d8c898');
  px(204, 56, 16, 2, '#b8a878');
  px(203, 54, 2, 4, '#8a6a3a');
  px(219, 54, 2, 4, '#8a6a3a');
  [206, 210, 214].forEach(x => px(x, 55, 3, 1, '#8a6a3a'));
  ob(224, 52, 7, 5, '#6a6f7c');
  px(224, 52, 7, 1, '#c4cedb');
  ob(230, 54, 12, 3, '#7a5230');
  ob(244, 49, 7, 9, '#2a2630');
  px(245, 51, 5, 5, '#ffb050');
  px(246, 52, 3, 3, '#ffe28a');
  px(245, 47, 5, 2, '#6a6f7c');
  ob(214, 70, 8, 8, '#4a3424');
  px(215, 70, 6, 2, '#2a2630');
  px(216, 70, 2, 1, '#6a6f7c');
  // 5) tumpukan peti & tong
  el(242, 113, 24, 3, 'rgba(0,0,0,.35)');
  ob(224, 92, 20, 18, '#6b4d33');
  px(224, 92, 20, 2, '#8a6a48');
  px(224, 96, 20, 1, '#3a2616');
  px(224, 104, 20, 1, '#3a2616');
  px(233, 92, 2, 18, '#4a3424');
  ob(228, 80, 14, 12, '#5d4430');
  px(228, 80, 14, 1, '#8a6a48');
  px(228, 85, 14, 1, '#3a2616');
  px(234, 80, 2, 12, '#4a3424');
  ob(246, 96, 12, 16, '#6b4a2e');
  px(246, 100, 12, 2, '#6a6f7c');
  px(246, 108, 12, 2, '#6a6f7c');
  px(246, 96, 3, 16, '#8a6038');
  el(252, 96, 6, 2.4, '#3a2412');
  el(252, 96, 4.6, 1.6, '#1d4a6a');
  // 6) manekin zirah setengah jadi
  b.save();
  b.translate(0, 6);
  el(236, 157, 13, 3, 'rgba(0,0,0,.35)');
  ob(228, 152, 16, 4, '#3a2a1c');
  ob(235, 142, 3, 10, '#6b4d33');
  ob(224, 126, 6, 7, '#aeb4c2');
  ob(242, 126, 6, 7, '#aeb4c2');
  ob(228, 126, 16, 18, '#8a909e');
  px(240, 127, 3, 16, 'rgba(0,0,0,.2)');
  px(229, 127, 2, 14, 'rgba(255,255,255,.3)');
  px(235, 127, 2, 17, '#c4cedb');
  px(228, 141, 16, 2, '#c2a06b');
  [[231, 130], [239, 130], [231, 136], [239, 136]].forEach(([x, y]) => px(x, y, 1, 1, '#e8edf5'));
  ob(230, 112, 12, 13, '#9aa0ae');
  px(232, 118, 8, 2, OL);
  px(231, 113, 3, 1, '#e8edf5');
  ob(235, 106, 3, 7, '#a33b4c');
  b.restore();
  // 7) karung arang
  const sack = (x, y, c) => { el(x + 7, y + 12, 8, 2.5, 'rgba(0,0,0,.35)'); el(x + 7, y + 8, 8, 6, OL); el(x + 7, y + 8, 7, 5, c); ob(x + 5, y, 4, 4, c); px(x + 4, y + 3, 6, 1, '#8a6a3a'); px(x + 3, y + 5, 2, 3, 'rgba(255,255,255,.15)'); };
  sack(69, 140, '#6a5a44');
  sack(62, 146, '#5a4a38');
  sack(76, 148, '#6a5a44');
  [[66, 156], [84, 156], [74, 160]].forEach(([x, y]) => px(x, y, 2, 2, '#2a2630'));
  WL.push([186, 58, 66, 18, 'k'], [224, 80, 36, 32, 'k'], [228, 156, 16, 8, 'k'], [62, 142, 30, 18, 'k'], [139, 78, 34, 8, 'k']);

  /* ---------- TAMAN SERAPHINE ---------- */
  b.save();
  b.beginPath();
  b.rect(494, 16, 132, 150);
  b.rect(526, 32, 78, 50);
  b.clip('evenodd');
  px(494, 16, 132, 150, 'rgba(40,100,56,.12)');
  el(566, 108, 66, 42, 'rgba(40,92,52,.55)');
  el(566, 108, 54, 33, 'rgba(68,130,76,.42)');
  el(512, 92, 14, 30, 'rgba(40,92,52,.45)');
  el(610, 70, 14, 28, 'rgba(40,92,52,.4)');
  for (let i = 0; i < 520; i++) {
    const a = R2() * 6.283, d = Math.sqrt(R2()), x = Math.round(566 + Math.cos(a) * 66 * d), y = Math.round(108 + Math.sin(a) * 42 * d);
    if (x > 588 && x < 614 && y > 126 && y < 148)
      continue;
    const h = ri(2, 4);
    px(x, y - h, 1, h, G[ri(0, 4)]);
    if (R2() < .5)
      px(x + 1, y - h + 1, 1, h - 1, G[ri(0, 4)]);
  }
  for (let i = 0; i < 24; i++) {
    const a = R2() * 6.283, d = Math.sqrt(R2()), x = Math.round(566 + Math.cos(a) * 60 * d), y = Math.round(108 + Math.sin(a) * 38 * d);
    if (x > 586 && x < 616 && y > 124 && y < 150)
      continue;
    const c = FC[ri(0, 4)];
    px(x, y, 2, 2, c);
    px(x, y, 1, 1, '#ffe28a');
  }
  b.restore();
  // jalan batu pijakan
  [[560, 83], [567, 91], [572, 101], [573, 112], [569, 123], [572, 134]].forEach(([x, y]) => { el(x, y + 1, 6, 3, 'rgba(0,0,0,.35)'); el(x, y, 6, 3.2, OL); el(x, y, 5, 2.5, '#7a7690'); el(x - 1, y - 1, 3, 1.2, '#9a96b0'); px(x + 2, y, 2, 1, '#4a9a52'); });
  // petak bunga
  const bed = (x, y, w, h) => {
    px(x + 2, y + 3, w, h, 'rgba(0,0,0,.35)');
    ob(x, y, w, h, '#6a6678');
    px(x, y, w, 2, '#8a869a');
    px(x + 2, y + 3, w - 4, h - 5, '#3a2616');
    px(x + 2, y + 3, w - 4, 2, '#4a3220');
    for (let i = 0; i < w - 5; i += 3) {
      const hh = ri(4, 9), cx = x + 3 + i, c = G[ri(0, 4)];
      px(cx, y + 4 - hh, 1, hh, c);
      px(cx - 1, y + 5 - (hh >> 1), 3, 1, G[ri(1, 3)]);
      const fc = FC[ri(0, 4)];
      px(cx - 1, y + 3 - hh, 3, 3, fc);
      px(cx, y + 4 - hh, 1, 1, '#ffe28a');
    }
    WL.push([x, y, w, h, 'k']);
  };
  bed(500, 92, 26, 14);
  bed(606, 84, 18, 16);
  bed(500, 124, 28, 13);
  // pohon penyembuh
  el(509, 78, 17, 4, 'rgba(0,0,0,.35)');
  ob(505, 56, 7, 20, '#4a3020');
  px(505, 56, 2, 20, '#6b4a32');
  px(510, 56, 2, 20, '#2a1c12');
  px(502, 74, 4, 2, '#4a3020');
  px(511, 74, 4, 2, '#4a3020');
  el(509, 42, 19, 15, OL);
  el(509, 42, 18, 14, '#2f6a3c');
  el(506, 40, 14, 11, '#3f8a4c');
  el(503, 37, 8, 6, '#5fae5c');
  el(514, 46, 9, 6, '#2f6a3c');
  for (let i = 0; i < 46; i++) {
    const a = R2() * 6.283, d = Math.sqrt(R2()), x = Math.round(509 + Math.cos(a) * 16 * d), y = Math.round(42 + Math.sin(a) * 12 * d);
    px(x, y, 2, 2, G[ri(0, 4)]);
  }
  for (let i = 0; i < 9; i++) {
    const a = R2() * 6.283, d = Math.sqrt(R2()), x = Math.round(509 + Math.cos(a) * 15 * d), y = Math.round(42 + Math.sin(a) * 11 * d);
    px(x, y, 2, 2, '#f6a0c0');
    px(x, y, 1, 1, '#fff');
  }
  WL.push([504, 66, 10, 10, 'k']);
  // teratai & lumut di kolam
  const pad = (x, y, c) => { el(x, y + 1, 5, 2.4, 'rgba(0,0,0,.25)'); el(x, y, 5, 2.4, OL); el(x, y, 4, 1.8, c); px(x, y - 1, 5, 1, '#3aa0d0'); };
  pad(547, 58, '#3f8a4c');
  pad(553, 51, '#2f6a3c');
  pad(578, 61, '#3f8a4c');
  pad(584, 50, '#5fae5c');
  pad(570, 63, '#2f6a3c');
  px(576, 57, 2, 3, '#f6a0c0');
  px(579, 57, 2, 3, '#f6a0c0');
  px(577, 55, 3, 3, '#ffd0e0');
  px(578, 58, 1, 1, '#ffe28a');
  px(546, 55, 2, 3, '#ffffff');
  px(549, 55, 2, 3, '#ffffff');
  px(547, 53, 3, 3, '#d8f0ff');
  px(548, 56, 1, 1, '#ffe28a');
  [[532, 38, 9, 3], [587, 38, 9, 3], [532, 69, 8, 3], [588, 69, 8, 3]].forEach(([x, y, w, h]) => { px(x, y, w, h, '#3f8a4c'); px(x + 1, y, w - 3, 1, '#7fc86a'); });
  for (let x = 536; x < 594; x += 6) {
    const l = ri(2, 5);
    px(x, 72, 2, l, '#2f6a3c');
    px(x - 1, 72 + l - 1, 2, 2, '#5fae5c');
  }
  // sulur menggantung di dinding atas & dinding kanan
  for (let x = 498; x < 624; x += 3) {
    if (R2() < .45)
      continue;
    let len = ri(6, 28);
    if (x > 528 && x < 600)
      len = Math.min(len, 14);
    px(x, 14, 1, len, '#2f6a3c');
    for (let y = 17; y < 14 + len; y += 4)
      px(x + ((y >> 2) & 1 ? 1 : -1), y, 2, 2, G[ri(1, 3)]);
    px(x, 14 + len - 1, 2, 2, '#7fc86a');
    if (R2() < .2)
      px(x, 14 + ri(5, len), 2, 2, '#f6a0c0');
  }
  for (let y = 16; y < 160; y += 2) {
    const n = ri(0, 3);
    for (let k = 0; k < n; k++) {
      const x = 626 + Math.round((R2() - .5) * R2() * 18);
      px(x, y, 2, 2, G[ri(0, 4)]);
    }
    if (R2() < .12)
      px(626 + ri(-3, 3), y, 2, 2, FC[ri(0, 4)]);
    if (R2() < .15)
      px(627 + ri(-2, 2), y, 1, 8, '#2f6a3c');
  }
  // jamur bercahaya
  [[510, 138], [516, 142], [522, 137]].forEach(([x, y]) => { px(x - 1, y, 2, 4, '#d8f0e8'); el(x, y, 4, 2.4, OL); el(x, y, 3.2, 1.8, '#6fe0c8'); px(x - 2, y - 1, 1, 1, '#c8fff0'); });

  /* ---------- efek dinamis ---------- */
  const cross = (x, y, a, s) => { g.fillStyle = 'rgba(255,255,230,' + a + ')'; g.fillRect(Math.round(x) - s, Math.round(y), s * 2 + 1, 1); g.fillRect(Math.round(x), Math.round(y) - s, 1, s * 2 + 1); };

  function decoFx() {
    // lampu tempat kerja Brokk
    g.save();
    g.globalCompositeOperation = 'lighter';
    {
      const f = .75 + .2 * Math.sin(t * 9) + .1 * Math.sin(t * 23), q = g.createRadialGradient(247, 54, 0, 247, 54, 36);
      q.addColorStop(0, 'rgba(255,170,70,' + .4 * f + ')');
      q.addColorStop(1, 'rgba(255,140,40,0)');
      g.fillStyle = q;
      g.fillRect(205, 14, 84, 84);
    }
    // aura hijau penyembuh & kunang-kunang
    {
      const q = g.createRadialGradient(564, 100, 0, 564, 100, 74);
      q.addColorStop(0, 'rgba(120,255,160,' + (.14 + .05 * Math.sin(t * 2)) + ')');
      q.addColorStop(1, 'rgba(120,255,160,0)');
      g.fillStyle = q;
      g.fillRect(488, 26, 152, 152);
    }
    {
      const q = g.createRadialGradient(516, 140, 0, 516, 140, 16);
      q.addColorStop(0, 'rgba(110,240,210,' + (.3 + .1 * Math.sin(t * 3)) + ')');
      q.addColorStop(1, 'rgba(110,240,210,0)');
      g.fillStyle = q;
      g.fillRect(498, 122, 36, 36);
    }
    for (let i = 0; i < 10; i++) {
      const x = 560 + Math.sin(t * .5 + i * 1.9) * 52 + Math.sin(t * 1.3 + i) * 8, y = 100 + Math.cos(t * .4 + i * 2.3) * 38 + Math.sin(t * 1.1 + i * 3) * 6, a = .35 + .65 * Math.max(0, Math.sin(t * 2.2 + i * 1.7)), q = g.createRadialGradient(x, y, 0, x, y, 7);
      q.addColorStop(0, 'rgba(220,255,140,' + a * .5 + ')');
      q.addColorStop(1, 'rgba(220,255,140,0)');
      g.fillStyle = q;
      g.fillRect(x - 7, y - 7, 14, 14);
      g.fillStyle = 'rgba(255,255,190,' + a + ')';
      g.fillRect(Math.round(x), Math.round(y), 2, 2);
    }
    for (let i = 0; i < 6; i++) {
      const k = (t * .3 + i / 6) % 1;
      cross(520 + (i * 37) % 90 + Math.sin(t + i) * 3, 140 - k * 50, Math.sin(k * Math.PI) * .8, 2);
    }
    g.restore();
    // kupu-kupu
    [[0, '#f6a0c0'], [2.6, '#fff0a0']].forEach(([ph, c]) => {
      const x = 556 + Math.sin(t * .35 + ph) * 58, y = 108 + Math.cos(t * .5 + ph) * 24, w = 1 + Math.abs(Math.sin(t * 14 + ph)) * 3;
      g.fillStyle = OL;
      g.fillRect(Math.round(x) - 5, Math.round(y) - w - 1, 10, w * 2 + 2);
      g.fillStyle = c;
      g.fillRect(Math.round(x) - 4, Math.round(y) - w, 3, w * 2);
      g.fillRect(Math.round(x) + 1, Math.round(y) - w, 3, w * 2);
      g.fillStyle = '#3a2418';
      g.fillRect(Math.round(x), Math.round(y) - 1, 1, 3);
    });
    // daun jatuh dari pohon
    for (let i = 0; i < 3; i++) {
      const k = (t * .12 + i / 3) % 1, x = 509 + Math.sin(k * 8 + i * 2) * 14 + k * 12, y = 44 + k * 42;
      g.save();
      g.globalAlpha = 1 - k * k;
      g.fillStyle = G[i + 1];
      g.fillRect(Math.round(x), Math.round(y), 3, 2);
      g.fillStyle = '#7fc86a';
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
      g.restore();
    }
    // kilau di zirah & perisai
    cross(236, 123, Math.pow(Math.max(0, Math.sin(t * 1.4)), 8), 3);
    cross(196, 28, Math.pow(Math.max(0, Math.sin(t * 1.1 + 2)), 8), 3);
    // nyala lentera
    g.fillStyle = 'rgba(255,240,170,.9)';
    g.fillRect(246, 52 - (Math.sin(t * 12) > 0 ? 1 : 0), 3, 3);
  }
  const _ld3 = lobbyDraw;
  lobbyDraw = function () {
    _ld3(); try {
      decoFx();
    } catch (e) { }
  };
})();
(function () {
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ez = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u), eo = u => 1 - Math.pow(1 - cl(u, 0, 1), 3), TAU = Math.PI * 2;
  const sn = (f, a) => {
    try {
      SFX[f](a);
    } catch (e) { }
  };
  const $ = id => document.getElementById(id);

  /* ---------- Garis waktu (detik) ---------- */
  const SLOW = .9, DIS = 2.7, END = 3.9, VIC = 6.4; // kematian bos: slow-mo → ledakan beruntun → melebur → ledakan akhir → banner → ditarik ke lobby
  const OUT = 2.3, IN = 1.25; // animasi ditarik ke lobby: tersedot portal → muncul di lobby
  const BD = { on: 0, t: 0, e: null, nx: 0, fin: 0, dis: 0, fl: 0, dd: 1 };
  const PULL = { on: 0, t: 0, ph: 0, x: 0, y: 0, open: 0, rg: 0 };
  const CK = { on: 0, sel: 0, lock: 0 };
  const PS = [];

  /* ---------- Partikel kustom (cahaya, cincin, pusaran) ---------- */
  const ps = o => { o.max = o.life; PS.push(o); };

  function psStep(dt) {
    for (let i = PS.length - 1; i >= 0; i--) {
      const q = PS[i];
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
        const d = Math.pow(q.dr || 1, dt);
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
    PS.forEach(q => {
      const k = q.life / q.max;
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
        g.ellipse(q.x, q.y, q.r, q.r * (q.e || 1), 0, 0, 7);
        g.stroke();
      } else if (q.k == 'gl') {
        const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);
        gr.addColorStop(0, 'rgba(255,255,255,' + k * .85 + ')');
        gr.addColorStop(.4, 'rgba(' + q.c + ',' + k * .55 + ')');
        gr.addColorStop(1, 'rgba(' + q.c + ',0)');
        g.fillStyle = gr;
        g.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
      } else {
        g.globalAlpha = Math.min(1, k * 1.6);
        g.fillStyle = q.c;
        const s = Math.max(1, q.s * (q.sh ? k : 1));
        g.fillRect(Math.round(q.x - s / 2), Math.round(q.y - s / 2), Math.ceil(s), Math.ceil(s));
        g.globalAlpha = 1;
      }
    });
    g.restore();
  }

  /* ---------- Efek visual dasar ---------- */
  function pillar(x, y, w, h, I, c) {
    if (I <= 0)
      return;
    const gr = g.createLinearGradient(0, y, 0, y - h);
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

  function portal(cx, cy, k, rot, I) {
    if (k <= .02)
      return;
    const R0 = 36 * k;
    g.save();
    g.translate(cx, cy);
    g.scale(1, .42);
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, R0 * 1.15);
    gr.addColorStop(0, 'rgba(235,248,255,' + .75 * I + ')');
    gr.addColorStop(.45, 'rgba(120,190,255,' + .45 * I + ')');
    gr.addColorStop(1, 'rgba(110,90,255,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, R0 * 1.15, 0, 7);
    g.fill();
    g.lineCap = 'round';
    for (let a = 0; a < 5; a++) {
      g.beginPath();
      for (let s = 0; s <= 1.001; s += .06) {
        const an = rot + a * 1.2566 + s * 3.6, r = R0 * (.1 + .9 * s);
        g[s ? 'lineTo' : 'moveTo'](Math.cos(an) * r, Math.sin(an) * r);
      }
      g.strokeStyle = 'rgba(' + (a % 2 ? '200,170,255' : '170,225,255') + ',' + .8 * I + ')';
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
    g.strokeStyle = 'rgba(190,230,255,' + .7 * I + ')';
    g.beginPath();
    g.arc(0, 0, R0 * .66, 0, 7);
    g.stroke();
    g.setLineDash([]);
    g.restore();
  }

  /* =====================================================
     1) ANIMASI BOS MATI
     ===================================================== */
  window.bossDie = function (e) {
    if (e.dying)
      return;
    SFX.bossVo(bossVid(e), 'die');
    const B = BOSS;
    es.forEach(m => {
      if (m !== e)
        burst(m);
    }); // minion ikut hancur
    es = [e];
    pr = pr.filter(b => b.own == 'p'); // bos tetap ada di arena selama animasi
    B.dead = 1;
    B.hz = [];
    B.q = [];
    Object.assign(e, { dying: 1, hp: 0, s2: 'rest', atk: null, an: 0, wind: 0, stun: 0, vx: 0, vy: 0, tm: 99 });
    p.inv = Math.max(p.inv, 1);
    p.hp = mhp();
    p.pot = 5;
    Object.assign(BD, { on: 1, t: 0, e, nx: .15, fin: 0, dis: 0, fl: .8, dd: p.x < e.x ? -1 : 1 });
    HST = Math.max(HST, .3);
    shake = Math.max(shake, 14);
    FLSH = 1;
    FLSC = '255,235,200';
    fx.push({ k: 'ring', x: e.x, y: e.y - 40, r: 36, w: 5, life: .7, max: .7, col: '#fff' }, { k: 'ring', x: e.x, y: e.y - 40, r: 70, w: 3, life: .9, max: .9, col: '#ffd34d' }, { k: 'gl', x: e.x, y: e.y - 40, r: 120, c: '255,170,110', life: .5, max: .5 });
    sn('boom', 50);
    msgT = 0;
  };

  function blast(e, k, soft) {
    const x = e.x + (Math.random() - .5) * 54, y = e.y - 6 - Math.random() * 82, r = 9 + Math.random() * 12 + k * 10;
    fx.push({ k: 'ring', x, y, r, w: 2 + k * 2, life: .38, max: .38, col: Math.random() < .5 ? '#ffd9a8' : '#ff8a5a' }, { k: 'gl', x, y, r: r * 2.6, c: '255,140,70', life: .32, max: .32 });
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * TAU, v = 40 + Math.random() * 120;
      dp.push({
        k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 25, life: .45 + Math.random() * .5, max: .95, s: 2 + Math.random() * 2.5, c: ['#ffd070', '#ff8a3a', '#ff5a4a', '#fff'][i % 4]
      });
    }
    puff(x, y, 2, '70,58,66', 1.3);
    if (soft)
      shake = Math.max(shake, 2);
    else {
      sn('boom', 10 + k * 26);
      shake = Math.max(shake, 3 + k * 4);
    }
  }

  function finalBlast(e) {
    const x = e.x, y = e.y - 40;
    es = [];
    BD.e = null; // bos lenyap
    FLSH = 1;
    FLSC = '255,255,255';
    BD.fl = 1;
    shake = 16;
    HST = Math.max(HST, .12);
    for (let i = 0; i < 5; i++)
      fx.push({
        k: 'ring', x, y: y + 20, r: 30 + i * 26, w: 5 - i, life: .55 + i * .14, max: .55 + i * .14, col: i % 2 ? '#fff' : '#ffd34d'
      });
    fx.push({ k: 'gl', x, y, r: 170, c: '255,200,120', life: .7, max: .7 }, { k: 'pil', x, y: e.y + 8, w: 56, h: 260, c: '255,230,170', life: 1.6, max: 1.6 });
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * TAU, v = 40 + Math.random() * 190;
      dp.push({
        k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .8 - 30, life: .7 + Math.random() * .8, max: 1.5, s: 2 + Math.random() * 3, c: ['#fff', '#ffe08a', '#ff9a8a', '#ffd34d'][i % 4]
      });
    }
    for (let i = 0; i < 28; i++)
      ps({
        x: x + (Math.random() - .5) * 50, y: y + (Math.random() - .5) * 60, vx: (Math.random() - .5) * 14, vy: -16 - Math.random() * 34, g: -8, dr: .9, life: 1.8 + Math.random() * 1.4, s: 2 + Math.random() * 2, c: ['#ffffff', '#ffe9a8', '#ffb0c0'][i % 3], sh: 1
      });
    puff(x, y + 10, 6, '90,80,92', 1.8);
    sn('boom', 70);
    sn('level');
    sn('clear');
  }

  function bdStep(dt) {
    const e = BD.e, T = (BD.t += dt);
    BD.fl = Math.max(0, BD.fl - dt * 1.4);
    if (!BD.fin) {
      if (T < DIS) {
        BD.nx -= dt;
        if (BD.nx <= 0) {
          const k = cl((T - SLOW) / (DIS - SLOW), 0, 1);
          blast(e, k);
          BD.nx = T < SLOW ? .3 : .21 - .11 * k + Math.random() * .05;
        }
      } else {
        if (!BD.dis) {
          BD.dis = 1;
          sn('summon');
          sn('wave');
          fx.push({ k: 'ring', x: e.x, y: e.y + 8, r: 46, w: 4, life: .6, max: .6, col: '#ffe9a8' });
        }
        const u = cl((T - DIS) / (END - DIS), 0, 1), top = e.y - 112 + u * 126;
        for (let i = 0; i < 5; i++)
          ps({
            x: e.x + (Math.random() - .5) * 64, y: top + Math.random() * 8, vx: (Math.random() - .5) * 26, vy: -30 - Math.random() * 80, g: -30, dr: .6, life: .9 + Math.random() * .9, s: 1.5 + Math.random() * 2.5, c: ['#ffffff', '#ffe9a8', '#ffb0c0', '#ffd070'][i % 4], sh: 1
          });
        if (Math.random() < dt * 9)
          blast(e, 1, 1);
      }
      if (T >= END) {
        BD.fin = 1;
        finalBlast(e);
      }
    }
    if (T >= VIC) {
      BD.on = 0;
      startPull(false);
    }
  }
  // bos yang sekarat: berkedip putih, berguncang, berlutut lalu melebur dari kepala ke kaki
  const _deK = drawEnemy;
  drawEnemy = function (e) {
    if (e.k != 'boss' || !e.dying)
      return _deK(e);
    const T = BD.t, k = ez(cl((T - .4) / 2.3, 0, 1)), sink = k * 9, rot = BD.dd * .12 * k, sy = 1 - .1 * k, jx = (Math.random() - .5) * (T < DIS ? 2.4 : 1.4);
    const u = T < DIS ? 0 : cl((T - DIS) / (END - DIS), 0, 1), top = e.y - 112 + u * 126, x0 = e.x, y0 = e.y + 7, sv = e.fl;
    g.save();
    g.translate(x0 + jx, y0 + sink);
    g.rotate(rot);
    g.scale(1, sy);
    g.translate(-x0, -y0);
    if (u > 0) {
      g.beginPath();
      g.rect(e.x - 150, top, 300, 400);
      g.clip();
    }
    e.fl = 0;
    _deK(e);
    const wa = T < DIS ? (Math.floor(T * 13) % 2 ? .62 : 0) : Math.min(1, .45 + u * .6);
    if (wa > 0) {
      e.fl = .1;
      g.globalAlpha = wa;
      _deK(e);
      g.globalAlpha = 1;
    }
    e.fl = sv;
    g.restore();
    // aura panas + garis peleburan + pilar cahaya
    const ga = T < DIS ? .22 + .12 * Math.sin(T * 22) : .35 + .4 * u, gl = g.createRadialGradient(e.x, e.y - 44, 4, e.x, e.y - 44, 86);
    gl.addColorStop(0, 'rgba(255,' + (T < DIS ? '150,90' : '225,170') + ',' + ga + ')');
    gl.addColorStop(1, 'rgba(255,90,60,0)');
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = gl;
    g.fillRect(e.x - 90, e.y - 134, 180, 180);
    if (u > 0 && u < 1) {
      const ly = top + sink, lg = g.createLinearGradient(e.x - 56, 0, e.x + 56, 0);
      lg.addColorStop(0, 'rgba(255,240,200,0)');
      lg.addColorStop(.5, 'rgba(255,250,235,.95)');
      lg.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = lg;
      g.fillRect(e.x - 56, ly - 1.5, 112, 3);
      g.globalAlpha = .35;
      g.fillRect(e.x - 56, ly - 5, 112, 10);
    }
    g.restore();
    if (u > 0)
      pillar(e.x, e.y + 8, 22 + u * 26, 150 + u * 120, .3 + .5 * u, '255,225,170');
  };
  // bos yang sedang sekarat tidak bisa dipukul lagi (tidak ada XP ganda)
  const _hit = hit;
  hit = function (e, d, sx, sy, kb) {
    if (e && e.dying)
      return; return _hit(e, d, sx, sy, kb);
  };

  /* =====================================================
     2) ANIMASI PLAYER DITARIK KE LOBBY
     ===================================================== */

  function clearIn() {
    for (const k in K)
      K[k] = 0; for (const k in P)
      delete P[k]; M.d = 0; M.u = 0; try {
        cv.focus();
      } catch (e) { }
  }

  function startPull(revive) {
    const B = BOSS;
    B.on = 0;
    B.hz = [];
    B.q = [];
    B.vt = 0;
    clearIn();
    p.inv = 0;
    p.hurt = 0;
    p.vx = p.vy = 0;
    p.dod = 0;
    msgT = 0;
    shake = 0;
    FLSH = 0;
    HST = 0;
    fx = [];
    dp = [];
    pr = [];
    gh = [];
    PS.length = 0;
    Object.assign(PULL, { on: 1, t: 0, ph: 0, x: p.x, y: p.y, open: 0, rg: 0 });
    if (revive) { // pahlawan yang gugur dibangunkan sejenak sebelum ditarik pergi
      ps({ k: 'ring', x: p.x, y: p.y + 6, r: 6, v: 150, d: .2, life: .6, c: '255,235,200', w: 3, e: .45 });
      ps({ k: 'gl', x: p.x, y: p.y - 4, r: 46, c: '255,240,200', life: .55 });
      for (let i = 0; i < 12; i++)
        ps({
          x: p.x + (Math.random() - .5) * 10, y: p.y + 4, vx: (Math.random() - .5) * 30, vy: -20 - Math.random() * 40, g: -10, dr: .8, life: .8 + Math.random() * .5, s: 2, c: '#ffffff', sh: 1
        });
      sn('pickup');
    }
    sn('summon');
  }

  function pullStep(dt) {
    const T = (PULL.t += dt);
    t += dt;
    shake = Math.max(0, shake - 20 * dt);
    camUpd(dt);
    psStep(dt);
    if (!PULL.ph) {
      const cx = PULL.x, cy = PULL.y + 8;
      if (T > .12) { // benang cahaya tersedot ke pusat portal
        const n0 = (28 + 90 * cl(T / 1.6, 0, 1)) * dt, n = Math.floor(n0) + (Math.random() < n0 % 1 ? 1 : 0);
        for (let i = 0; i < n; i++) {
          const a = Math.random() * TAU, r = 42 + Math.random() * 44;
          ps({
            k: 'spi', cx, cy, a, r, v: 42 + Math.random() * 40, w: 2.2 + Math.random() * 1.6, life: 1.6, c: Math.random() < .5 ? '170,225,255' : '215,190,255', lw: 1 + Math.random(), x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * .42, px: cx + Math.cos(a) * r, py: cy + Math.sin(a) * r * .42
          });
        }
      }
      if (T >= PULL.rg && T < 1.6) {
        PULL.rg = T + .36;
        ps({ k: 'ring', x: cx, y: cy, r: 60, v: -78, life: .72, c: '160,220,255', w: 2, e: .42 });
      }
      if (T > .5 && T < 1.7) {
        shake = Math.max(shake, 1.1);
        if (Math.random() < dt * 22)
          ps({
            x: cx + (Math.random() - .5) * 12, y: cy - 6, vx: (Math.random() - .5) * 16, vy: -40 - Math.random() * 50, g: -20, dr: .7, life: .6 + Math.random() * .4, s: 2, c: '#cfeaff', sh: 1
          });
      }
      if (!PULL.fl && T >= 1.72) {
        PULL.fl = 1;
        shake = 5;
        sn('dodge');
        sn('door');
      }
      if (T >= OUT) { // pindah ke lobby (layar sedang hitam)
        toLobby();
        reset();
        fade = 0;
        PS.length = 0;
        camInit = false;
        camUpd(0);
        Object.assign(PULL, { ph: 1, t: 0, x: p.x, y: p.y, fl: 0 });
        const ax = p.x, ay = p.y + 8;
        ps({ k: 'ring', x: ax, y: ay, r: 6, v: 130, d: .25, life: .85, c: '170,225,255', w: 3, e: .42 });
        ps({ k: 'ring', x: ax, y: ay, r: 4, v: 80, d: .25, life: 1, c: '255,255,255', w: 2, e: .42 });
        ps({ k: 'gl', x: ax, y: ay - 6, r: 60, c: '170,215,255', life: .9 });
        for (let i = 0; i < 26; i++)
          ps({
            x: ax + (Math.random() - .5) * 26, y: ay - Math.random() * 14, vx: (Math.random() - .5) * 30, vy: -26 - Math.random() * 70, g: -12, dr: .8, life: .9 + Math.random() * .8, s: 1.5 + Math.random() * 2, c: ['#ffffff', '#bfe4ff', '#e0ccff'][i % 3], sh: 1
          });
        sn('appear');
        sn('pickup');
      }
    } else if (T >= IN) {
      PULL.on = 0;
      clearIn();
    }
  }

  function pullWorld() {
    const T = PULL.t, x = PULL.x, y = PULL.y;
    if (!PULL.ph) {
      const I = ez(cl((T - .3) / .6)) * (1 - ez(cl((T - 1.75) / .4)));
      if (I > 0) {
        const gr = g.createRadialGradient(x, y - 2, 0, x, y - 2, 30);
        gr.addColorStop(0, 'rgba(200,235,255,' + .42 * I + ')');
        gr.addColorStop(1, 'rgba(120,170,255,0)');
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = gr;
        g.fillRect(x - 30, y - 32, 60, 60);
        g.restore();
      }
      pillar(x, y + 8, 20 + 22 * I, 230, I, '190,225,255');
    } else {
      const I = 1 - ez(cl(T / .95));
      pillar(x, y + 8, 14 + 26 * I, 210, I, '190,225,255');
    }
  }
  // pahlawan berputar, mengecil, tersedot ke portal (lalu muncul kembali di lobby)
  const _hero = drawHero, _armed = drawArmed;
  drawHero = function (x, y, gh, ph, lx, ly) {
    if (!PULL.on || gh)
      return _hero(x, y, gh, ph, lx, ly);
    const T = PULL.t, cx = x, cy = y + 8;
    let s = 1, rot = 0, al = 1, ox = 0, oy = 0;
    if (!PULL.ph) {
      portal(cx, cy, ez(cl(T / .55)) * (1 - ez(cl((T - 1.8) / .3))), T * 5 + T * T * 4, 1);
      const a = ez(cl((T - .5) / 1.25)), lift = Math.sin(cl((T - .35) / .75, 0, 1) * Math.PI) * 7;
      s = 1 - .95 * Math.pow(a, 1.4);
      rot = Math.pow(a, 1.6) * TAU * 3;
      oy = 8 * a - lift;
      ox = T < .5 ? (Math.random() - .5) * 1.1 : 0;
      al = 1 - ez(cl((T - 1.6) / .25));
    } else {
      portal(cx, cy, 1 - ez(cl((T - .25) / .8)), -T * 6, 1 - cl((T - .5) / .6) * .5);
      const a = eo(cl((T - .12) / .75));
      s = .3 + .7 * a;
      rot = (1 - a) * -TAU * 1.5;
      oy = -(1 - a) * 24;
      al = cl((T - .08) / .3, 0, 1);
    }
    g.save();
    PULL.open = 1;
    g.globalAlpha *= al;
    g.translate(x + ox, y - 2 + oy);
    g.rotate(rot);
    g.scale(s, s);
    g.translate(-x, -(y - 2));
    _hero(x, y, gh, ph, lx, ly);
  };
  drawArmed = function (o) {
    _armed(o); if (PULL.open) {
      g.restore();
      PULL.open = 0;
    }
  };

  /* ---------- Overlay layar: kilatan, banner kemenangan, fade hitam ---------- */
  function screenFx() {
    g.save();
    if (BD.on) {
      if (BD.fl > 0) {
        g.fillStyle = 'rgba(255,248,235,' + Math.min(.9, BD.fl) + ')';
        g.fillRect(0, 0, W, H);
      }
      const T = BD.t;
      if (T > END && T < VIC) {
        const al = cl(Math.min((T - END) / .6, (VIC - T) / .6), 0, 1), by = Math.round(H * .27);
        g.globalAlpha = al;
        g.fillStyle = 'rgba(0,0,0,.7)';
        g.fillRect(0, by, W, 52);
        g.fillStyle = 'rgba(216,184,120,.9)';
        g.fillRect(0, by, W, 1);
        g.fillRect(0, by + 51, W, 1);
        g.font = '8px monospace';
        txt('— V I C T O R Y —', W / 2, by + 14, '#f8dfaa', 'center');
        g.font = 'bold 20px monospace';
        txt(bossNm().toUpperCase() + ' TUMBANG', W / 2, by + 39, '#ffd34d', 'center');
      }
    }
    if (PULL.on) {
      const T = PULL.t;
      if (!PULL.ph) {
        const fa = cl((T - 1.55) / .2, 0, 1) * (1 - cl((T - 1.8) / .45, 0, 1));
        if (fa > 0) {
          g.fillStyle = 'rgba(255,255,255,' + fa * .9 + ')';
          g.fillRect(0, 0, W, H);
        }
        const ba = ez(cl((T - 1.75) / .55, 0, 1));
        if (ba > 0) {
          g.fillStyle = 'rgba(0,0,0,' + ba + ')';
          g.fillRect(0, 0, W, H);
        }
      } else {
        const ba = 1 - ez(cl(T / .6, 0, 1));
        if (ba > 0) {
          g.fillStyle = 'rgba(0,0,0,' + ba + ')';
          g.fillRect(0, 0, W, H);
        }
      }
    }
    g.restore();
  }
  const _draw = draw;
  draw = function () {
    _draw();
    if (PULL.open) {
      g.restore();
      PULL.open = 0;
    }
    if (PULL.on || PS.length) {
      g.save();
      g.translate(SHX, SHY);
      g.scale(CAM_Z, CAM_Z);
      g.translate(-camX, -camY);
      if (PULL.on)
        pullWorld();
      psDraw();
      g.restore();
    }
    if (BD.on || PULL.on)
      screenFx();
  };
  const _upd = upd;
  upd = function (dt) {
    if (!PULL.on && HST <= 0 && BD.on) {
      bdStep(dt);
      if (BD.on && BD.t < SLOW)
        dt *= .3;
    } // slow-mo saat pukulan penentu
    if (PULL.on) {
      pullStep(dt);
      return;
    }
    if (HST <= 0)
      psStep(dt);
    _upd(dt);
  };

  /* =====================================================
     3) CHECKPOINT: PILIHAN SETELAH KALAH MELAWAN BOS
     ===================================================== */
  const ov = $('ckpt'), wrap = $('ckWrap'), bR = $('ckRetry'), bL = $('ckLobby');
  const sel = i => { CK.sel = i; bR.classList.toggle('sel', i == 0); bL.classList.toggle('sel', i == 1); };
  const closeUi = () => { CK.on = 0; ov.classList.add('hidden'); };

  function retry() {
    closeUi();
    clearIn();
    DEATHFX.off();
    reset();
    toBoss();
    HST = 0;
    FLSH = 0;
    shake = 0;
    PS.length = 0;
    BD.on = 0;
    p.inv = 1.2;
    msg('Checkpoint dimuat — HP pulih penuh. Lawan ' + bossNm() + ' kembali!');
  }

  function pickLobby() {
    closeUi();
    clearIn();
    DEATHFX.off();
    p.dead = 0;
    p.hp = mhp();
    p.st = 100;
    p.stT = 0;
    p.hold = 0;
    p.focus = 0;
    startPull(true);
  }
  window.CKPT = {
    canOffer() { return !!(BOSS.on && !BOSS.dead && room == 2 && !lobby); },
    show() {
      CK.on = 1;
      CK.lock = performance.now() + 650;
      sel(0);
      $('ckHint').style.display = isMobile ? 'none' : '';
      ov.classList.remove('hidden');
      wrap.classList.remove('go');
      void wrap.offsetWidth;
      wrap.classList.add('go');
      sn('wave');
    }
  };
  const ready = () => CK.on && performance.now() >= CK.lock;
  bR.addEventListener('click', () => {
    if (ready())
      retry();
  });
  bL.addEventListener('click', () => {
    if (ready())
      pickLobby();
  });
  [bR, bL].forEach((b, i) => {
    b.addEventListener('pointerenter', ev => {
      if (ev.pointerType == 'mouse')
        sel(i);
    }); b.addEventListener('mousedown', ev => ev.preventDefault());
  });
  addEventListener('keydown', ev => {
    if (!ready())
      return;
    const c = ev.code;
    if (c == 'Digit1' || c == 'Numpad1') {
      ev.preventDefault();
      retry();
    } else if (c == 'Digit2' || c == 'Numpad2') {
      ev.preventDefault();
      pickLobby();
    } else if (c == 'ArrowLeft' || c == 'ArrowUp' || c == 'KeyA' || c == 'KeyW') {
      ev.preventDefault();
      sel(0);
    } else if (c == 'ArrowRight' || c == 'ArrowDown' || c == 'KeyD' || c == 'KeyS') {
      ev.preventDefault();
      sel(1);
    } else if (c == 'Enter' || c == 'NumpadEnter' || c == 'Space') {
      ev.preventDefault();
      CK.sel ? pickLobby() : retry();
    }
  });
  setInterval(() => {
    if (CK.on)
      ov.classList.toggle('hidden', !playing);
  }, 150); // sembunyikan saat game dijeda (menu utama)
})();
/* ===== TUTORIAL SER ALDRIC =====
   Alur: Ser Aldric menghampiri pemain -> mengantar ke Camp Pelatihan -> mengajarkan kontrol
   satu per satu (pemain harus mencobanya) -> selesai. Bisa dilewati kapan saja (tombol LEWATI / Tab).
   Setelah selesai/dilewati, tidak muncul lagi otomatis. Desktop: tekan T di lobby untuk mengulang. */
(function () {
  const KEY = 'eoa_tutorial_v1';
  const ALD = NP.find(n => n.n.indexOf('Ser Aldric') === 0);
  if (!ALD)
    return;
  const L0 = ALD.lines, A0 = () => ask(), HOME = { x: ALD.x, y: ALD.y };
  ALD.act = A0; // setelah dialog biasa selesai, Ser Aldric menawarkan untuk mengulang tutorial
  let done = false;
  try {
    done = localStorage.getItem(KEY) === '1';
  } catch (e) { }
  const el = id => document.getElementById(id), pan = el('tutPanel');
  const T = {
    on: false, started: false, st: '', i: -1, v: 0, m: 0, ax: ALD.x, ay: ALD.y, path: [], follow: false, chase: false, walk: false, delay: 0, say: null, okT: 0, last: '', topLast: ''
  };
  const mob = () => !!isMobile;
  const kb = (k, l) => '<span class="kk"><kbd>' + k + '</kbd>' + (l ? ' ' + l : '') + '</span>';
  const WN = ['Pedang', 'Tombak', 'Busur', 'Tongkat', 'Belati'], SKK = ['Z', 'X', 'C'];
  const dA = () => dist({ x: T.ax, y: T.ay }, p);

  /* ---------- Daftar latihan ---------- */
  const STEPS = [
    {
      t: 'Serangan Dasar', s: 'Ayunkan senjatamu! Tiga serangan beruntun membentuk combo, dan hit ketiga paling kuat.', max: 3,
      k: () => mob() ? kb('ATK', 'tombol serang') : kb('Klik kiri', 'mouse'),
      n: () => mob() ? 'Serangan otomatis mengunci musuh terdekat. Geser tombol SERANG untuk membidik manual.' : 'Arahkan serangan dengan kursor mouse.',
      u: k => {
        if (k.mu && k.hold <= .6 && k.cdA <= .06 && p.cdA > 0)
          T.v++;
      }
    },
    {
      t: 'Serangan Charged', s: 'Tahan tombol serang sampai terdengar bunyi tanda siap, lalu lepas. Lebih kuat, tapi memakan 30 stamina.', max: 1,
      k: () => mob() ? kb('ATK', 'tahan ±1 detik, lalu lepas') : kb('Tahan klik kiri', 'lalu lepas'),
      n: () => 'Stamina terisi kembali otomatis jika sedang tidak dipakai.',
      u: k => {
        if (k.mu && k.hold > .6 && k.st >= 30 && k.ULTT <= 0 && p.stT > .7)
          T.v = 1;
      }
    },
    {
      t: 'Ganti Senjata', s: 'Kau punya 5 senjata dan bisa menggantinya kapan saja, bahkan di tengah pertarungan. Coba ganti dua kali!', max: 2,
      k: () => mob() ? 'Ketuk tombol <b>1 – 5</b> di kanan atas layar' : WN.map((w, i) => kb(i + 1, w)).join(''),
      n: () => 'Tiap senjata punya gaya serang, skill, dan ultimate yang berbeda.',
      u: k => {
        if (wi !== k.wi)
          T.v++;
      }
    },
    {
      t: 'Skill Senjata', s: 'Setiap senjata punya 3 skill dengan cooldown masing-masing. Pakai ketiganya!', max: 3,
      k: () => mob() ? 'Tombol <b>Z · X · C</b> di kanan bawah: ' + [0, 1, 2].map(i => SK[wi][i].n).join(', ') : [0, 1, 2].map(i => kb(SKK[i], SK[wi][i].n)).join(''),
      n: () => mob() ? 'Ganti senjata (tombol 1 – 5) untuk mencoba skill lainnya.' : 'Ganti senjata (1 – 5) untuk mencoba skill senjata lain.',
      u: k => {
        ['KeyZ', 'KeyX', 'KeyC'].forEach((c, i) => {
          if (k.P[c] && k.sc[i] <= .06 && p.sc[i] > 0)
            T.m |= 1 << i;
        }); T.v = (T.m & 1) + ((T.m >> 1) & 1) + ((T.m >> 2) & 1);
      }
    },
    {
      t: 'Dodge', s: 'Berguling menghindari serangan musuh. Kau kebal sesaat saat berguling, tapi memakan 25 stamina.', max: 2,
      k: () => mob() ? kb('DODGE', 'tombol ⚡ + arah joystick') : kb('Space', '+ arah gerak (WASD)'),
      n: () => 'Tanpa arah gerak, kau berguling ke arah kursor.',
      u: k => {
        if (k.P.Space && k.st >= 25 && k.dod <= 0 && k.ULTT <= 0 && p.dod > 0)
          T.v++;
      }
    },
    {
      t: 'Battle Focus', s: 'Fokus tempur membakar semangatmu 10 detik. Pedang, tombak, belati: serang lebih cepat, damage +50%, lari kencang. Busur, tongkat: lari kencang & pertahanan naik. Cooldown 30 detik.', max: 1,
      k: () => mob() ? kb('FOCUS', 'tombol bulat') : kb('E', 'Battle Focus'),
      n: () => 'Aktifkan sebelum menyerang musuh yang kuat.',
      u: k => {
        if (k.P.KeyE && k.ec <= .06 && p.ec > 0)
          T.v = 1;
      }
    },
    {
      id: 'ult', w: 1, t: 'Ultimate', s: 'Setiap damage yang kau beri mengisi bar ULT di kiri atas. Bar-mu sudah kuisi penuh. Selama ultimate aktif, kau kebal serangan!', max: 1,
      k: () => mob() ? kb('ULT', 'tombol bulat') : kb('Q', 'Ultimate'),
      n: () => 'Setiap senjata punya ultimate yang berbeda.',
      setup: () => {
        try {
          ultAdd(ULT_MAX);
        } catch (e) { }
      },
      u: k => {
        if (k.ULTT <= 0 && ULTT > 0)
          T.v = 1;
      }
    }
  ];

  /* ---------- Dialog Ser Aldric ---------- */
  const INTRO = () => [
    'Ah, akhirnya kau sadar, pahlawan. Aku Ser Aldric, penjaga lobby ini. Sebelum turun ke Dungeon, biar kuajarkan dulu cara bertarung.',
    'Ikuti aku ke Camp Pelatihan di sebelah timur lobby. ' + (mob() ? 'Gerakkan joystick kiri untuk berjalan.' : 'Berjalanlah dengan WASD, tahan Shift untuk berlari.'),
    'Kalau kau sudah hafal semua kontrolnya, tekan LEWATI di atas layar kapan saja. Ayo, ikuti aku!'
  ];
  const REPLAY = () => [
    'Baik, kita ulangi dari awal. Ikuti aku ke Camp Pelatihan lagi. Tekan LEWATI jika sudah cukup.'
  ];
  const ARRIVE = () => [
    'Inilah Camp Pelatihan. Rhea, Bram, dan yang lain berlatih di sini setiap hari. Tidak ada musuh yang menyerang, jadi jangan takut mencoba.',
    'Aku akan menyebutkan kontrolnya satu per satu. Coba lakukan sesuai arahanku. Kita mulai dari serangan dasar.'
  ];
  const OUTRO = () => [
    'Bagus sekali, kau cepat belajar! Tiga hal lagi: ' + (mob() ? 'tombol 🧪 untuk minum potion (+60 HP), BICARA untuk menyapa orang di sekitarmu, dan LOBBY untuk pulang saat di dungeon.' : 'tekan R untuk minum potion (+60 HP), G untuk bicara dengan orang di sekitarmu, dan B untuk kembali ke lobby saat di dungeon.'),
    'Poin atribut dari level up dibagi lewat ' + 'Kitab Status milik Ketua Orin (di lobby)' + '.' + (mob() ? '' : ' Tekan L kapan saja untuk membuka panduan kontrol.'),
    'Manekin latihan ada di arena sebelah timur. Gerbang utara lobby menuju Dungeon.' + (mob() ? '' : ' Lupa kontrolnya? Tekan T di lobby untuk mengulang latihan.') + ' Berhati-hatilah, pahlawan!'
  ];

  function say(lines, cb) {
    T.say = { lines, cb };
    ALD.lines = lines;
    ALD.act = function () {
      ALD.lines = L0; ALD.act = A0; T.say = null; if (cb)
        cb();
    };
    if (!dlg) {
      dlg = { n: ALD, i: 0 };
      try {
        SFX.pickup();
      } catch (e) { }
    }
  }

  /* ---------- Tawaran: ulangi tutorial? ---------- */
  const PL = ['Sebelum kau pergi... mau kuulangi latihan dasarnya dari awal? Aku tidak keberatan mengajarimu lagi.'], askEl = el('aldAsk');
  const asking = () => !!(dlg && dlg.n === ALD && ALD.lines === PL);

  function ask() {
    if (T.on || !lobby)
      return;
    ALD.lines = PL;
    ALD.act = closeAsk;
    dlg = { n: ALD, i: 0 };
    try {
      SFX.pickup();
    } catch (e) { }
  }

  function closeAsk() {
    ALD.lines = L0; ALD.act = A0; if (dlg && dlg.n === ALD)
      dlg = null; askEl.classList.add('hidden');
  }

  function answer(yes) {
    if (!asking())
      return;
    closeAsk();
    if (yes) {
      try {
        SFX.point();
      } catch (e) { }
      begin(true);
    }
  }
  askEl.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); const b = e.target.closest('button'); if (b)
      answer(b.dataset.a === 'y');
  });
  addEventListener('keydown', e => {
    if (!asking() || e.repeat)
      return; if (e.code === 'KeyY') {
        e.preventDefault();
        answer(true);
      } else if (e.code === 'KeyN') {
        e.preventDefault();
        answer(false);
      }
  });

  function syncAsk() {
    if (ALD.lines === PL && !asking()) {
      closeAsk();
      return;
    } // dialog tertutup (menjauh / pindah area)
    if (!asking()) {
      askEl.classList.add('hidden');
      return;
    }
    askEl.classList.remove('hidden');
    askEl.style.left = (590 / W * 100) + 'vw';
    askEl.style.top = (278 / H * 100) + 'vh'; // rata kanan, tepat di atas kotak dialog
  }

  /* ---------- Gerak Ser Aldric ---------- */
  const leadPath = () => [[440, 236], [600, 200], [650, 200], [770, 200]].filter(q => q[0] > T.ax + 4);
  const homePath = () => { const a = [[650, 200], [600, 200]].filter(q => q[0] < T.ax - 4); a.push([HOME.x, HOME.y]); return a; };

  function moveAld(dt) {
    let tx, ty, stop = 0;
    if (T.chase) {
      tx = p.x;
      ty = p.y;
      stop = 40;
    } else if (T.path.length) {
      tx = T.path[0][0];
      ty = T.path[0][1];
    } else {
      T.walk = false;
      return;
    }
    if (T.follow && !T.chase && dA() > 115) {
      T.walk = false;
      return;
    } // menunggu pemain menyusul
    const dx = tx - T.ax, dy = ty - T.ay, d = Math.hypot(dx, dy);
    if (d <= stop + 1 || d < 1.5) {
      if (!T.chase)
        T.path.shift();
      T.walk = false;
      return;
    }
    const s = Math.min(d - stop, 64 * dt);
    T.ax += dx / d * s;
    T.ay += dy / d * s;
    T.walk = true;
  }
  const place = () => { ALD.x = T.ax; ALD.y = T.ay + (T.walk ? Math.sin(t * 18) * .8 : 0); };

  /* ---------- Alur ---------- */
  function begin(replay) {
    T.started = true;
    T.on = true;
    T.i = -1;
    T.v = 0;
    T.m = 0;
    T.path = [];
    T.follow = false;
    T.chase = false;
    T.say = null;
    T.last = '';
    if (replay) {
      T.ax = p.x + (p.x < 1100 ? 28 : -28);
      T.ay = p.y;
      place();
      fx.push({ k: 'ring', x: T.ax, y: T.ay, r: 14, life: .4, max: .4, col: '#ffd34d' });
      T.st = 'intro';
      say(REPLAY(), () => { T.st = 'lead'; T.follow = true; T.path = leadPath(); });
    } else {
      T.st = 'come';
      T.chase = true;
    }
  }

  function nextStep() {
    T.i++;
    T.v = 0;
    T.m = 0;
    if (T.i >= STEPS.length) {
      T.st = 'outro';
      say(OUTRO(), () => finish(false));
      return;
    }
    T.st = 'step';
    const S = STEPS[T.i];
    if (S.setup)
      S.setup();
  }

  function finish(skipped, quiet) {
    const hadSay = !!T.say;
    T.on = false;
    T.st = '';
    T.chase = false;
    T.say = null;
    if (hadSay) {
      ALD.lines = L0;
      ALD.act = A0;
      if (dlg && dlg.n === ALD)
        dlg = null;
    }
    done = true;
    try {
      localStorage.setItem(KEY, '1');
    } catch (e) { }
    T.follow = false;
    T.path = homePath();
    pan.classList.add('hidden');
    if (!quiet)
      msg(skipped ? 'Tutorial dilewati.' + (mob() ? '' : ' Tekan T di lobby untuk mengulang.') : 'Latihan selesai! Semoga beruntung di Dungeon.');
  }
  const skip = () => {
    if (T.on)
      finish(true);
  };
  el('tutSkip').addEventListener('click', skip);
  addEventListener('keydown', e => {
    if (e.code === 'Tab' && T.on) {
      e.preventDefault();
      skip();
    }
  });

  function complete() {
    T.st = 'ok';
    T.okT = 1.3;
    try {
      SFX.point();
    } catch (e) { }
    try {
      dn(p.x, p.y - 14, 'Bagus!', 0, '#8fe8a0');
    } catch (e) { }
  }

  /* ---------- Per-frame ---------- */
  function tick(dt) {
    syncAsk();
    if (!T.on) {
      if (lobby) {
        if (!T.started && !done) {
          T.delay += dt;
          if (T.delay > 1.8)
            begin(false);
        } else if (P.KeyT && !dlg) {
          delete P.KeyT;
          begin(true);
        }
      }
      moveAld(dt);
      place();
      return;
    }
    if (!lobby) {
      finish(true, true);
      moveAld(dt);
      place();
      return;
    }
    if (T.say && !dlg && dA() < 44 && !P.KeyG) {
      dlg = { n: ALD, i: 0 };
      try {
        SFX.pickup();
      } catch (e) { }
    }
    switch (T.st) {
      case 'come':
        moveAld(dt);
        if (dA() <= 46) {
          T.chase = false;
          T.st = 'intro';
          say(INTRO(), () => { T.st = 'lead'; T.follow = true; T.path = leadPath(); });
        }
        break;
      case 'lead':
        moveAld(dt);
        if (!T.path.length && dA() < 80) {
          T.st = 'arrive';
          say(ARRIVE(), nextStep);
        }
        break;
      case 'ok':
        T.okT -= dt;
        if (T.okT <= 0)
          nextStep();
        break;
    }
    place();
    panel();
  }
  const snap = () => ({
    P: Object.assign({}, P), mu: M.u, hold: p.hold, st: p.st, cdA: p.cdA, dod: p.dod, ec: p.ec, wi: wi, sc: p.sc.slice(), ULTT: ULTT
  });

  function post(k) {
    const S = STEPS[T.i];
    if (!S)
      return;
    S.u(k);
    if (T.v >= S.max && !(S.w && ULTT > 0))
      complete();
  }
  const _upd = upd;
  upd = function (dt) {
    if (!playing || !p) {
      _upd(dt);
      return;
    }
    const live = p.dead <= 0;
    if (live)
      tick(dt);
    const k = (live && T.on && T.st === 'step') ? snap() : null;
    _upd(dt);
    if (k)
      post(k);
  };

  /* ---------- Panel (HTML) ---------- */
  function panel() {
    const far = dA() > 90;
    let head = 'TUTORIAL', title = '', text = '', keys = '', note = '', prog = '', ok = false;
    switch (T.st) {
      case 'come':
        title = 'Ser Aldric menghampirimu...';
        text = 'Tunggu sebentar.';
        break;
      case 'lead':
        head = 'Menuju Camp Pelatihan';
        title = 'Ikuti Ser Aldric';
        text = far ? 'Dekati Ser Aldric agar ia melanjutkan perjalanan.' : 'Ikuti Ser Aldric ke Camp Pelatihan di sebelah timur lobby.';
        keys = mob() ? 'Gerak: <b>joystick kiri</b>' : kb('W') + kb('A') + kb('S') + kb('D', 'gerak') + kb('Shift', 'lari');
        break;
      case 'intro':
      case 'arrive':
      case 'outro':
        head = 'Ser Aldric';
        title = 'Ser Aldric berbicara';
        text = (T.say && !dlg) ? 'Dekati Ser Aldric untuk melanjutkan.' : 'Lanjutkan dialog di bawah.';
        keys = mob() ? kb('LANJUT ▶', 'ketuk tombol dialog') : kb('G', 'lanjut');
        break;
      case 'step':
      case 'ok': {
        const S = STEPS[T.i];
        head = 'Latihan ' + (T.i + 1) + ' / ' + STEPS.length;
        if (T.st === 'ok') {
          title = '✔ Bagus!';
          ok = true;
          text = S.t + ' selesai.';
        } else {
          title = S.t;
          text = S.s;
          keys = S.k();
          note = S.n ? S.n() : '';
        }
        for (let i = 0; i < S.max; i++)
          prog += '<span class="pip' + (T.st === 'ok' || i < T.v ? ' on' : '') + '"></span>';
        break;
      }
    }
    const sig = head + '|' + title + '|' + text + '|' + keys + '|' + note + '|' + prog + '|' + ok;
    if (sig !== T.last) {
      T.last = sig;
      el('tutStep').textContent = head;
      el('tutTitle').textContent = title;
      el('tutTitle').className = ok ? 'ok' : '';
      el('tutText').textContent = text;
      el('tutKeys').innerHTML = keys;
      el('tutNote').textContent = note;
      el('tutProg').innerHTML = prog;
      el('tutSkip').textContent = mob() ? 'LEWATI ▸▸' : 'LEWATI [Tab]';
    }
    const top = Math.round(cv.getBoundingClientRect().top + 68 * cv.clientHeight / H) + 'px';
    if (top !== T.topLast) {
      T.topLast = top;
      pan.style.top = top;
    }
    pan.classList.remove('hidden');
  }
  setInterval(() => {
    if (!playing || !lobby || !T.on)
      pan.classList.add('hidden');
  }, 250);

  /* ---------- Penanda di atas Ser Aldric (kanvas) ---------- */
  const _draw = draw;
  draw = function () {
    _draw();
    if (!T.on || !lobby || !playing || p.dead > 0)
      return;
    if (!(T.st === 'lead' || (T.say && !dlg)))
      return;
    const z = CAM_Z, m = 18;
    let x = (T.ax - camX) * z, y = (T.ay - camY - 46) * z;
    const off = x < m || x > W - m || y < m || y > H - m;
    g.save();
    g.fillStyle = '#ffd34d';
    g.strokeStyle = '#120e18';
    g.lineWidth = 2;
    g.lineJoin = 'round';
    if (off) {
      const a = Math.atan2(y - H / 2, x - W / 2), cx = Math.max(m, Math.min(W - m, x)), cy = Math.max(m + 20, Math.min(H - m - 70, y));
      g.translate(cx, cy);
      g.rotate(a);
      g.beginPath();
      g.moveTo(10, 0);
      g.lineTo(-6, -8);
      g.lineTo(-6, 8);
      g.closePath();
      g.stroke();
      g.fill();
    } else {
      g.translate(x, y + Math.sin(t * 5) * 3);
      g.beginPath();
      g.moveTo(0, 7);
      g.lineTo(-7, -4);
      g.lineTo(7, -4);
      g.closePath();
      g.stroke();
      g.fill();
    }
    g.restore();
  };
})();
/* ===== ADEGAN MASUK LOBBY =====
   Menyambung sinematik pintu: setelah START, pintu di dinding selatan lobby terbuka, cahaya hangat tumpah,
   pahlawan berjalan keluar menuju Safe Zone (kontrol terkunci), lalu pintu menutup & tersegel.
   Tekan Space/Enter untuk melewati. Hanya diputar sekali, saat game pertama kali dimulai. */
(function () {
  const E = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
  const ENT = { on: 0, t: 0, played: 0, sfx: 0, cl: 0, lo: -1 };
  const T_WALK0 = .6, T_WALK1 = 2.5, T_CLOSE = 1.9, T_END = 3.0, Y0 = 393, Y1 = 322;
  const SX = 262, SY = 318, SW = 116, SH = 82;
  const ZB = CAM_Z, Z0 = ZB; // zoom dasar; zoom awal disamakan (efek zoom saat masuk dihapus)
  const bak = document.createElement('canvas');
  bak.width = SW;
  bak.height = SH;
  bak.getContext('2d').drawImage(BGL, SX, SY, SW, SH, 0, 0, SW, SH);
  /* pintu lobby dilukis langsung ke latar (di bawah player); o: 0 tertutup .. 1 terbuka penuh (sekaligus intensitas cahaya) */
  function paintDoor(o) {
    const b = BGL.getContext('2d'), CTX = b;
    b.imageSmoothingEnabled = false;
    b.save();
    b.globalCompositeOperation = 'source-over';
    b.globalAlpha = 1;
    b.drawImage(bak, SX, SY);
    const R = (c, x, y, w, h) => { b.fillStyle = c; b.fillRect(x, y, w, h); };
    R('#17151b', 289, 357, 62, 43); R('#6b5f55', 290, 358, 60, 42);
    for (let j = 0; j < 8; j++) { R('#554b43', 290, 362 + j * 5, 60, 1); for (let k = (j % 2) * 6; k < 60; k += 12) R('#554b43', 290 + k, 362 + j * 5, 1, 5) }
    R('#b6a38a', 289, 357, 62, 4); R('#d8cbb4', 289, 357, 62, 1); R('#8a7d70', 290, 361, 60, 2);
    R('#8a7d70', 290, 363, 10, 37); R('#a89a88', 290, 363, 2, 37); R('#8a7d70', 340, 363, 10, 37); R('#4f463e', 348, 363, 2, 37);
    R('#17151b', 314, 357, 12, 13); R('#c9b898', 315, 358, 10, 11); R('#e4d8bc', 315, 358, 10, 2); R('#b18b59', 319, 363, 2, 4);
    R('#4a4a54', 293, 372, 4, 3); R('#ff9a3c', 293, 369, 4, 3); R('#ffe28a', 294, 370, 2, 1); R('#4a4a54', 343, 372, 4, 3); R('#ff9a3c', 343, 369, 4, 3); R('#ffe28a', 344, 370, 2, 1);

    R('#07060c', 300, 368, 40, 32);
    if (o > .02) [[120, 70, 30], [205, 122, 52], [255, 192, 112], [255, 232, 170]].forEach((c, i) => R('rgb(' + (7 + (c[0] - 7) * o | 0) + ',' + (6 + (c[1] - 6) * o | 0) + ',' + (12 + (c[2] - 12) * o | 0) + ')', 300 + i * 4, 368 + i * 3, 40 - i * 8, 32 - i * 3));
    CTX.save(); CTX.beginPath(); CTX.rect(300, 368, 40, 32); CTX.clip();
    const off = Math.round(o * 20);
    [300 - off, 320 + off].forEach(x0 => { R('#6b5f55', x0, 368, 20, 32); R('#8a7d70', x0, 368, 20, 1);[5, 10, 15].forEach(q => R('#4f463e', x0 + q, 368, 1, 32)); R('#3a342e', x0, 376, 20, 2); R('#3a342e', x0, 390, 20, 2);[2, 17].forEach(q => { R('#b18b59', x0 + q, 376, 1, 1); R('#b18b59', x0 + q, 390, 1, 1) }); R('#2b2620', x0, 399, 20, 1) });
    if (off < 2) { R('#b18b59', 319, 368, 2, 32); R('#c39a5d', 317, 381, 6, 7); R('#2b2620', 319, 383, 2, 3) }
    CTX.restore();
    if (o > .02) { CTX.save(); CTX.globalCompositeOperation = 'lighter'; for (let yy = 386; yy > 330; yy -= 2) { const tt = (386 - yy) / 56, half = Math.round(20 + tt * 28), a = Math.round(.2 * o * (1 - tt) * 25) / 25; if (a > 0) { CTX.fillStyle = 'rgba(255,205,140,' + a + ')'; CTX.fillRect(320 - half, yy - 2, half * 2, 2) } } CTX.restore() }

    b.restore();
  }
  paintDoor(0); // pintu tersegel selalu ada di lobby
  window.entryStart = function () {
    if (ENT.played || !lobby || !p)
      return;
    ENT.played = ENT.on = 1;
    ENT.t = 0;
    ENT.sfx = ENT.cl = 0;
    ENT.lo = -1;
    p.x = 320;
    p.y = Y0;
    p.vx = p.vy = 0;
    p.face = -Math.PI / 2;
    camInit = false;
    CAM_Z = Z0;
    paintDoor(0);
  };

  function finish() {
    ENT.on = 0;
    CAM_Z = ZB;
    camInit = false;
    paintDoor(0);
    p.x = 320;
    p.y = Y1;
    p.vx = p.vy = 0;
    p.wb = 0;
    for (const k in P)
      delete P[k];
    M.d = 0;
    try {
      msg('Kau tiba di Lobby — Zona Aman. Tidak ada musuh yang menyerang di sini.');
    } catch (e) { }
  }

  function step(dt) {
    const skip = P.Space || P.Enter;
    ENT.t += dt;
    t += dt;
    shake = Math.max(0, shake - 20 * dt);
    camUpd(dt);
    if (typeof psStep === 'function')
      psStep(dt);
    for (const k in P)
      delete P[k];
    M.d = 0;
    if (skip && ENT.t > T_WALK0 + .3)
      ENT.t = T_END;
    const T = ENT.t;
    CAM_Z = ZB + (Z0 - ZB) * (1 - E((T - .3) / 2.4));
    if (!ENT.sfx) {
      ENT.sfx = 1;
      shake = Math.max(shake, 4);
      try {
        SFX.door();
      } catch (e) { }
    }
    if (T >= T_CLOSE && !ENT.cl) {
      ENT.cl = 1;
      try {
        SFX.door();
      } catch (e) { }
    }
    const o = T < T_WALK0 ? E(T / .6) : T < T_CLOSE ? 1 : 1 - E((T - T_CLOSE) / .7), oq = Math.round(o * 28) / 28;
    if (oq !== ENT.lo) {
      ENT.lo = oq;
      paintDoor(oq);
    }
    const k = Math.max(0, Math.min(1, (T - T_WALK0) / (T_WALK1 - T_WALK0))), y = Y0 + (Y1 - Y0) * (1 - Math.pow(1 - k, 2));
    p.vy = (y - p.y) / Math.max(dt, 1e-3);
    p.y = y;
    p.x = 320;
    p.vx = 0;
    p.face = -Math.PI / 2;
    p.wb += ((k > 0 && k < 1 ? 1 : 0) - p.wb) * Math.min(1, dt * 12);
    p.wph += dt * 12 * (.2 + p.wb * .8) * Math.max(1, Math.min(1.5, Math.abs(p.vy) / 85));
    p.idt += dt * 3;
    if (T >= T_END)
      finish();
  }
  const _hero = drawHero, _armed = drawArmed, _upd = upd;
  drawHero = function () {
    if (ENT.on && ENT.t < T_WALK0)
      return; return _hero.apply(this, arguments);
  };
  drawArmed = function () {
    if (ENT.on && ENT.t < T_WALK0)
      return; return _armed.apply(this, arguments);
  };
  upd = function (dt) {
    if (ENT.on) {
      step(dt);
      return;
    } _upd(dt);
  };
})();
(function () {
  const root = document.getElementById('intro'), cv = document.getElementById('introCv'), ctx = cv.getContext('2d'), menu = document.getElementById('menu');
  const tcv = document.createElement('canvas');
  tcv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  root.insertBefore(tcv, document.getElementById('introSkip'));
  const tx = tcv.getContext('2d');
  const DUR = 12.6;
  let W = 0, H = 0, SC = 2, raf = 0, t0 = 0, last = 0, done = false, skipAt = 0, A = null, rz = 0;
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ez = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

  /* ===== PIXEL ART: semua digambar di kanvas resolusi rendah (1 piksel = SC px layar), tanpa antialias ===== */
  const F = (x, c, a, b, w, h) => { x.fillStyle = c; const x0 = Math.round(a), y0 = Math.round(b); x.fillRect(x0, y0, Math.max(1, Math.round(a + w) - x0), Math.max(1, Math.round(b + h) - y0)); };
  const disc = (x, c, cx, cy, r) => {
    x.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy); for (let d = -r; d <= r; d++) {
      const w = Math.floor(Math.sqrt(r * r - d * d + .5));
      x.fillRect(cx - w, cy + d, 2 * w + 1, 1);
    }
  };
  const rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const KT = [0, 1.4, 5, 9, 12.2], KS = [0, .06, .85, 1.2, 1.9];
  const KM = (() => {
    const n = KT.length, d = [], m = []; for (let i = 0; i < n - 1; i++)
      d[i] = (KS[i + 1] - KS[i]) / (KT[i + 1] - KT[i]); m[0] = 0; for (let i = 1; i < n - 1; i++)
      m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2; m[n - 1] = d[n - 2]; return m;
  })();

  function camS(t) {
    t = Math.min(t, KT[KT.length - 1]); let i = 0; while (i < KT.length - 2 && t > KT[i + 1])
      i++; const h = KT[i + 1] - KT[i], u = (t - KT[i]) / h, u2 = u * u, u3 = u2 * u; return (2 * u3 - 3 * u2 + 1) * KS[i] + (u3 - 2 * u2 + u) * h * KM[i] + (-2 * u3 + 3 * u2) * KS[i + 1] + (u3 - u2) * h * KM[i + 1];
  }
  const WY = { mount: 1.30, A: 1.46, B: 1.60, C: 1.74, field: 1.80 }, F2 = { sky: .55, sun: .35, mount: .8, A: .88, B: .95, C: 1.0, field: 1.05, grass: 1.3 }, GW = 2.82;
  /* langit: pita warna lembut + dithering tipis di sambungan */
  const SKY = ['#0b0a1a', '#12102a', '#1b1638', '#2a1f48', '#43294f', '#6a3a58', '#9a5654', '#d08a58'];

  function mkSky(h) {
    const c = mk(W, h), x = c.getContext('2d'), im = x.createImageData(W, h), d = im.data, P = SKY.map(rgb), n = P.length; for (let y = 0; y < h; y++) {
      const t = y / h * (n - 1), i = Math.min(n - 2, t | 0), f = cl((t - i - .55) / .45);
      for (let px = 0; px < W; px++) {
        const k = P[i + (f * 16 > B4[(y & 3) * 4 + (px & 3)] ? 1 : 0)], o = (y * W + px) * 4;
        d[o] = k[0];
        d[o + 1] = k[1];
        d[o + 2] = k[2];
        d[o + 3] = 255;
      }
    } x.putImageData(im, 0, 0); return c;
  }
  /* awan pixel: bentuk dari gabungan lingkaran, diarsir per baris (terang atas, bayangan biru lembut di bawah) */
  function mkCloud(r, k) {
    const w = Math.round(132 * k), h = Math.round(58 * k), c = mk(w, h), x = c.getContext('2d'), base = h - 2, n = 6 + (r() * 3 | 0), cs = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), rad = k * (8 + Math.sin(u * Math.PI) * 12 + r() * 5);
      cs.push([w * (.13 + .74 * u) + (r() - .5) * 5 * k, base - rad * .75, rad]);
    }
    const m = new Uint8Array(w * h);
    for (let y = 0; y < base; y++)
      for (let px = 0; px < w; px++)
        for (const q of cs)
          if ((px - q[0]) ** 2 + (y - q[1]) ** 2 <= q[2] * q[2]) {
            m[y * w + px] = 1;
            break;
          }
    for (let y = 0; y < base; y++)
      for (let px = 0; px < w; px++) {
        if (!m[y * w + px])
          continue;
        let up = 0, dn = 0;
        while (up < 4 && y - up - 1 >= 0 && m[(y - up - 1) * w + px])
          up++;
        while (dn < 5 && y + dn + 1 < base && m[(y + dn + 1) * w + px])
          dn++;
        x.fillStyle = up == 0 ? '#9c92c6' : dn == 0 ? '#1c1730' : dn < 2 ? '#262040' : dn < 4 ? '#302948' : up < 3 ? '#4a406c' : '#3a3258';
        x.fillRect(px, y, 1, 1);
      }
    return c;
  }

  function ridge(seed, amp) { const r = rng(seed), p = [r() * 6, r() * 6, r() * 6], f = [.0032 + r() * .001, .0075, .017]; return px => amp * (.55 * Math.sin(px * f[0] * 2.2 + p[0]) + .3 * Math.sin(px * f[1] * 2.2 + p[1]) + .15 * Math.sin(px * f[2] * 2.2 + p[2])); }
  const TP = ['#243438', '#304441', '#4c5e51'];

  function tree(x, px, py, s, pal) { const r = Math.max(2, Math.round(s * 2.3)); x.fillStyle = '#2f2633'; x.fillRect(Math.round(px) - (r > 3 ? 1 : 0), Math.round(py - r), r > 3 ? 2 : 1, r + 1); disc(x, pal[0], px, py - r * 1.5, r); disc(x, pal[1], px - r * .25, py - r * 1.65, r * .78 | 0); disc(x, pal[2], px - r * .4, py - r * 1.9, Math.max(1, r * .4 | 0)); }

  function tufts(x, ry, rr, n, col, span) {
    x.fillStyle = col; for (let k = 0; k < n; k++) {
      const px = rr() * W | 0, py = ry(px) + 4 + (rr() * span | 0);
      x.fillRect(px, py, 1, 1);
      x.fillRect(px + 1, py - 1, 1, 1);
      x.fillRect(px + 2, py, 1, 1);
    }
  }

  function mkHill(o) {
    const M = o.M, h = M + Math.ceil(1.35 * H), c = mk(W, h), x = c.getContext('2d'), R = ridge(o.seed, o.amp);
    const ry0 = px => M - R(px) - (o.bump ? o.bump.h * Math.exp(-Math.pow((px - o.bump.x) / o.bump.w, 2)) : 0), pl = o.plateau, pY = pl ? ry0(pl.x) : 0;
    const ry = pl ? (px => { let t = cl((Math.abs(px - pl.x) - pl.hw) / pl.ramp); t = t * t * (3 - 2 * t); return Math.round(pY * (1 - t) + ry0(px) * t); }) : (px => Math.round(ry0(px)));
    const [rim, c0, c1, c2] = o.cols;
    for (let px = 0; px < W; px++) {
      const top = ry(px);
      x.fillStyle = rim;
      x.fillRect(px, top, 1, 1);
      x.fillStyle = c0;
      x.fillRect(px, top + 1, 1, 15);
      x.fillStyle = c1;
      x.fillRect(px, top + 16, 1, 24);
      x.fillStyle = c2;
      x.fillRect(px, top + 40, 1, h - top - 40);
      if (px & 1) {
        x.fillStyle = c1;
        x.fillRect(px, top + 14, 1, 2);
        x.fillStyle = c2;
        x.fillRect(px, top + 38, 1, 2);
      }
    }
    if (o.extra)
      o.extra(x, ry, M);
    return { cv: c, M, h, ry };
  }
  /* kerajaan pixel: tembok bata, menara beratap sirap biru, jendela berpendar, gerbang kayu, rumah-rumah kecil */
  function drawCastle(x, ox, oy, cw, flags) {
    const u = cw / 100, gy = 76, ST = '#736e7b', SL = '#7b7784', SS = '#645f6b', SD = '#4f4b58', OL = '#3a3650', RL = '#3d4876', RR = '#2e3764', RD = '#252b53', WN = '#231f39', GL = '#f6dc86';
    const R = (a, b, w, h, c) => F(x, c, ox + a * u, oy + b * u, w * u, h * u);
    const bricks = (a, b, w, h) => {
      for (let yy = b, i = 0; yy < b + h; yy += 2.4, i++) {
        R(a, yy, w, .3, SS);
        for (let xx = a + (i & 1) * 2.4 + 1; xx < a + w - 1; xx += 4.8)
          R(xx, yy, .3, 2.4, SS);
      }
    };
    const roof = (cx, w, top, apex, fl) => {
      const y0 = Math.round(oy + apex * u), y1 = Math.round(oy + top * u), hw = w * .68 * u, c = Math.round(ox + cx * u); for (let py = y0; py <= y1; py++) {
        const k = Math.round((py - y0 + 1) / (y1 - y0 + 1) * hw), sh = (py - y0) % 5 == 4;
        x.fillStyle = sh ? RD : RL;
        x.fillRect(c - k, py, k, 1);
        x.fillStyle = sh ? RD : RR;
        x.fillRect(c, py, k, 1);
      } R(cx - w * .68 - .5, top - .2, w * 1.36 + 1, .9, OL); R(cx - .3, apex - 1.4, .6, 1.6, GL); if (fl)
        flags.push({ x: ox + cx * u, y: oy + (apex - 1.4) * u });
    };
    const win = (cx, y) => { R(cx - 1, y - .5, 2, 4, WN); R(cx - .6, y + .2, 1.2, 1.8, GL); R(cx - 1.3, y + 3.5, 2.6, .5, SD); };
    const tower = (cx, w, top, rh, wins) => {
      R(cx - w / 2, top, w, gy - top, ST); R(cx + w * .12, top, w * .38, gy - top, SS); bricks(cx - w / 2, top, w, gy - top); R(cx - w / 2, top, .6, gy - top, SL); R(cx - w / 2 - .4, top, .4, gy - top, OL); R(cx + w / 2, top, .4, gy - top, OL); R(cx - w / 2 - .8, top - .4, w + 1.6, 1.2, SD); roof(cx, w + 1.8, top - .2, top - rh, 1); for (let i = 0; i < wins; i++)
        win(cx, top + 5 + i * 8);
    };
    R(8, 40, 84, gy - 40, ST);
    R(8, 62, 84, gy - 62, SS);
    bricks(8, 40, 84, gy - 40);
    R(8, 40, 84, .6, SL);
    R(7.6, 40, .4, gy - 40, OL);
    R(92, 40, .4, gy - 40, OL);
    for (let i = 8; i < 92; i += 4.2) {
      R(i, 37, 2.6, 3.2, ST);
      R(i, 37, 2.6, .5, SL);
      R(i + 2.4, 37, .3, 3.2, SD);
    }
    R(8, 39.6, 84, .8, SD);
    tower(10, 8, 28, 15, 2);
    tower(90, 8, 28, 15, 2);
    tower(29, 7, 33, 13, 1);
    tower(71, 7, 33, 13, 1);
    R(42, 14, 16, gy - 14, ST);
    R(52, 14, 6, gy - 14, SS);
    bricks(42, 14, 16, gy - 14);
    R(42, 14, .6, gy - 14, SL);
    R(41.6, 14, .4, gy - 14, OL);
    R(58, 14, .4, gy - 14, OL);
    R(41, 13, 18, 1.4, SD);
    roof(50, 19, 13, -2, 1);
    for (let i = 0; i < 3; i++)
      win(47 + i * 3.1, 22);
    R(39.5, 30, 21, 1.2, SD);
    win(50, 33);
    R(6.5, gy - 2.6, 87, 2.6, SD);
    R(6.5, gy - 2.6, 87, .5, SL);
    for (let d = 0; d <= 5.4; d += .35) {
      const hw = Math.sqrt(5.4 * 5.4 - d * d);
      R(50 - hw, 62 - d - .35, hw * 2, .4, SD);
    }
    R(44.6, 62, 10.8, gy - 62, SD);
    for (let d = 0; d <= 4.5; d += .35) {
      const hw = Math.sqrt(4.5 * 4.5 - d * d);
      R(50 - hw, 62 - d - .35, hw * 2, .4, '#3c303a');
    }
    R(45.5, 62, 9, gy - 62, '#3c303a');
    R(47.5, 57, .35, gy - 57, '#27202d');
    R(52.1, 57, .35, gy - 57, '#27202d');
    R(50, 57, .35, gy - 57, '#27202d');
    R(45.5, 66, 9, .8, '#221f34');
    R(45.5, 71, 9, .8, '#221f34');
    R(52.6, 70, 1, 1.4, GL);
    const roofs = ['#5f3e43', '#57313c', '#684e47', '#51303e'], walls = ['#7b757e', '#777078', '#7d7984'];
    const house = (hx, hy, w, h, rf, wl) => {
      R(hx + 1, hy + h, w, 1.2, 'rgba(0,0,0,.18)'); R(hx, hy, w, h, wl); R(hx + w * .6, hy, w * .4, h, 'rgba(0,0,0,.14)'); R(hx, hy, w, .4, SL); const rh = h * .75; for (let d = 0; d < rh; d += .5) {
        const wd = (w + 2.4) * (d / rh);
        R(hx + w / 2 - wd / 2, hy - rh + d, wd, .55, rf);
        R(hx + w / 2, hy - rh + d, wd / 2, .55, 'rgba(0,0,0,.2)');
      } R(hx + w * .4, hy + h * .45, w * .2, h * .55, '#342935'); R(hx + w * .12, hy + h * .28, w * .2, h * .22, GL);
    };
    [
      [1, 62, 9, 8], [12, 65, 8, 7], [22, 63, 9, 8], [33, 67, 7, 6], [60, 67, 7, 6], [70, 63, 9, 8], [81, 65, 8, 7], [91, 62, 9, 8], [6, 70, 8, 6], [78, 70, 8, 6]
    ].forEach((q, i) => house(q[0], q[1] + 4, q[2], q[3], roofs[i % 4], walls[i % 3]));
    [[40, 74], [60, 74], [28, 76], [68, 76]].forEach(q => tree(x, ox + q[0] * u, oy + q[1] * u, Math.max(1, Math.round(u * .45)), TP));
  }

  function mkPlant(seed, dk, lt, z) {
    const c = mk(z * 2, Math.ceil(z * 1.6)), x = c.getContext('2d'), r = rng(seed), cx = z, bs = c.height - 1, L = [];
    for (let i = 0; i < 7; i++) {
      const a = (-1 + 2 * i / 6) * .9 + (r() - .5) * .2;
      L.push([a, z * (.85 + r() * .5) * (1 - Math.abs(a) * .3)]);
    }
    L.sort((p, q) => Math.abs(q[0]) - Math.abs(p[0])).forEach(([a, len]) => {
      for (let j = 0; j < len; j++) {
        const px = Math.round(cx + Math.sin(a) * j), py = Math.round(bs - Math.cos(a) * j), w = Math.round(Math.sin(Math.PI * Math.min(1, j / len)) * z * .14 + .5);
        x.fillStyle = dk;
        x.fillRect(px - w, py, 2 * w + 1, 1);
        if (w > 1) {
          x.fillStyle = lt;
          x.fillRect(px - w + 1, py, 2 * w - 1, 1);
        }
      }
    });
    return c;
  }

  function build() {
    SC = Math.max(2, Math.round(innerHeight / 340));
    W = cv.width = Math.ceil(innerWidth / SC);
    H = cv.height = Math.ceil(innerHeight / SC);
    cv.style.cssText = 'position:absolute;left:0;top:0;display:block;image-rendering:pixelated;width:' + W * SC + 'px;height:' + H * SC + 'px';
    ctx.imageSmoothingEnabled = false;
    tcv.width = innerWidth;
    tcv.height = innerHeight;
    const u8 = H / 340, r = rng(11);
    A = { clouds: [], birds: [], leaves: [], flags: [] };
    A.sky = mkSky(Math.ceil(1.65 * H));
    {
      const sx = A.sky.getContext('2d'), sr = rng(5), sh = A.sky.height;
      for (let i = 0, n = Math.round(W * sh / 2300); i < n; i++) {
        const px = sr() * W | 0, py = Math.pow(sr(), 1.5) * sh * .52 | 0;
        sx.globalAlpha = .35 + sr() * .6;
        sx.fillStyle = sr() > .82 ? '#ffe7ad' : '#cfcaf0';
        sx.fillRect(px, py, 1, 1);
      }
      sx.globalAlpha = 1;
    }
    A.cl = [.6, .9, 1.35].map((k, i) => [0, 1, 2].map(v => mkCloud(rng(100 + i * 9 + v), k)));
    [[.55, .3, 0, .8, 12], [.8, .55, 1, .9, 16], [1.2, 1, 2, .96, 22]].forEach(([f, a, ki, al, n]) => {
      for (let i = 0; i < n; i++)
        A.clouds.push({
          v: r() * 3 | 0, k: ki, x: r() * (W + 300), wy: r() * (f > 1 ? 1.05 : 1.25) * H, f, sp: (1 + r() * 3) * f, a: al * (.88 + r() * .12)
        });
    });
    A.clouds.sort((p, q) => p.f - q.f);
    for (let i = 0; i < 7; i++)
      A.birds.push({ x: r() * (W + 120), wy: (.5 + r() * .65) * H, ph: r() * 6, sp: 14 + r() * 10 });
    for (let i = 0; i < 20; i++)
      A.leaves.push({
        x: r() * W, y: r() * H, vx: 16 + r() * 34, vy: 4 + r() * 12, rot: r() * 6, ph: r() * 6, col: ['#ff9a3c', '#ffb84d', '#e2672a', '#ffd27a', '#c94a22'][r() * 5 | 0]
      });
    {
      const M = Math.round(.2 * H), c = mk(W, M + .6 * H), x = c.getContext('2d'), R1 = ridge(31, .12 * H), R2 = ridge(77, .09 * H);
      [[R2, '#2b2547', '#251f3f', 1.1], [R1, '#1f1a38', '#19152f', 1]].forEach(([R, c0, c1, k]) => {
        for (let px = 0; px < W; px++) {
          const top = Math.round(M - .06 * H * k - Math.abs(R(px * 1.6)) * 1.15 - R(px) * .3);
          x.fillStyle = c0;
          x.fillRect(px, top, 1, c.height - top);
          x.fillStyle = c1;
          x.fillRect(px, top + Math.round(.1 * H), 1, c.height);
          if (px & 1)
            x.fillRect(px, top + Math.round(.1 * H) - 2, 1, 2);
          x.fillStyle = '#4a406c';
          x.fillRect(px, top, 1, 1);
        }
      });
      A.mount = { cv: c, M };
    }
    {
      const cw = Math.max(150, Math.min(W * .4, H * .9)), ch = cw * .84, cx = W * .64, M = Math.round(ch + .06 * H);
      A.A = mkHill({
        seed: 5, amp: .03 * H, M, cols: ['#71787a', '#516061', '#4b5c5a', '#445553'], bump: { x: cx, h: .05 * H, w: W * .2 }, plateau: { x: cx, hw: cw * .62, ramp: cw * .4 },
        extra: (x, ry) => {
          const yb = ry(cx), rr = rng(9);
          F(x, 'rgba(5,3,12,.5)', cx - cw * .47, yb + 4, cw * .94, .04 * cw);
          x.save();
          x.globalCompositeOperation = 'source-atop';
          const n = Math.round(.2 * H);
          for (let i = 0; i <= n; i++) {
            const t = i / n, c0 = cx + Math.sin(t * 3.4) * W * .06 * t, hw = Math.round(2 + t * 16 * u8);
            x.fillStyle = '#70686a';
            x.fillRect(Math.round(c0 - hw), yb + 2 + i, hw * 2, 1);
            x.fillStyle = '#605859';
            x.fillRect(Math.round(c0 - hw), yb + 2 + i, 1, 1);
            x.fillRect(Math.round(c0 + hw - 1), yb + 2 + i, 1, 1);
          }
          x.restore();
          tufts(x, ry, rr, 70, '#606d6b', .12 * H);
          for (let k = 0; k < 40; k++) {
            const px = rr() * W, py = ry(px) + 6 + rr() * .1 * H;
            if (Math.abs(px - cx) > cw * .46)
              tree(x, px, py, Math.max(1, Math.round(.9 * u8 + rr() * .6)), TP);
          }
          const fl = [];
          drawCastle(x, cx - cw / 2, yb - .905 * ch + 4, cw, fl);
          A.flags = fl;
        }
      });
    }
    A.B = mkHill({
      seed: 13, amp: .04 * H, M: Math.round(.14 * H), cols: ['#6c766f', '#45584e', '#3f5148', '#3a4c43'], extra: (x, ry, M) => {
        const rr = rng(21), cs = ['#526150', '#5b644f', '#44554b', '#696755', '#4c5c4a'];
        for (let k = 0; k < 60; k++) {
          const px = rr() * W, py = M + 10 + rr() * .45 * H, w = 14 + rr() * 34, h = 4 + rr() * 8;
          x.save();
          x.globalCompositeOperation = 'source-atop';
          x.globalAlpha = .6;
          x.fillStyle = cs[k % 5];
          x.fillRect(Math.round(px), Math.round(py), Math.round(w), Math.round(h));
          x.fillStyle = 'rgba(5,3,12,.55)';
          x.fillRect(Math.round(px), Math.round(py + h), Math.round(w), 1);
          x.restore();
        }
        tufts(x, ry, rr, 90, '#5a6a5f', .4 * H);
        for (let k = 0; k < 70; k++) {
          const px = rr() * W, py = ry(px) + 8 + rr() * .2 * H;
          tree(x, px, py, Math.max(1, Math.round((.7 + rr() * .7) * Math.max(.8, u8))), TP);
        }
      }
    });
    A.C = mkHill({
      seed: 29, amp: .05 * H, M: Math.round(.14 * H), cols: ['#6a7571', '#3e5347', '#384e42', '#33493d'], extra: (x, ry) => {
        const rr = rng(33);
        tufts(x, ry, rr, 110, '#55675b', .4 * H);
        for (let k = 0; k < 120; k++) {
          const px = rr() * W | 0, py = ry(px) + 6 + (rr() * .4 * H | 0);
          x.fillStyle = k % 3 ? '#e8c86a' : '#b8b4d8';
          x.fillRect(px, py, 1, 1);
        }
        for (let k = 0; k < 28; k++) {
          const px = rr() * W, py = ry(px) + 10 + rr() * .12 * H;
          tree(x, px, py, Math.max(1, Math.round((1 + rr() * .8) * Math.max(.8, u8))), ['#223235', '#2a403d', '#455a4d']);
        }
      }
    });
    A.plants = [[[1, '#23393a', '#3e584a'], [2, '#304139', '#5c6755'], [3, '#20343a', '#3b5754']].map(a => [7, 13, 24].map(z => mkPlant(a[0] + z, a[1], a[2], z)))];
    A.plants = A.plants[0];
    A.grass = [[], []];
    const gr = rng(77);
    for (let L = 0; L < 2; L++)
      for (let i = 0; i < Math.ceil(W / (L ? 3.8 : 3)); i++)
        A.grass[L].push({
          x: gr() * (W + 8) - 4 | 0, o: Math.round((L ? .13 : .035) * H + gr() * .035 * H), h: Math.round((L ? .09 : .06) * H * (.55 + gr() * .9)), w: gr() > (L ? .55 : .75) ? 2 : 1, ph: gr() * 6, lean: gr() - .5
        });
  }

  function drawClouds(S, time, f0, f1, fade) {
    A.clouds.forEach(c => {
      if (c.f < f0 || c.f >= f1)
        return; const im = A.cl[c.k][c.v], span = W + im.width * 2, x = Math.round(((c.x + c.sp * time) % span) - im.width), y = Math.round(c.wy - S * c.f - im.height * .6); if (y > H || y + im.height < 0)
        return; ctx.globalAlpha = c.a * fade; ctx.drawImage(im, x, y);
    }); ctx.globalAlpha = 1;
  }

  function layer(L, wy, f, S) {
    const y = Math.round(wy * H - L.M - S * f); if (y > H || y + L.h < 0)
      return y; ctx.drawImage(L.cv, 0, y); return y;
  }

  function haze(y, a, h) { y = Math.round(y);[.2, .5, 1, .5, .2].forEach((k, i) => { ctx.fillStyle = 'rgba(110,80,140,' + a * k + ')'; ctx.fillRect(0, y - h + Math.round(i * h * .4), W, Math.round(h * .4) + 1); }); }

  function drawField(S, time) {
    const top = Math.round(WY.field * H - S * F2.field), Fh = 1.7 * H;
    if (top > H)
      return;
    ctx.fillStyle = '#44564b';
    ctx.fillRect(0, Math.max(0, top), W, H);
    const N = 16;
    for (let i = 0; i < N; i++) {
      const ty = Math.pow((i + 1) / N, 1.9), y = Math.round(top + Fh * ty), y1 = Math.round(top + Fh * Math.pow((i + 2) / N, 1.9));
      if (y > H + 4 || y1 < -4)
        continue;
      ctx.fillStyle = i & 1 ? '#3f5047' : '#43554a';
      ctx.fillRect(0, y, W, y1 - y);
      ctx.fillStyle = '#2f3b39';
      ctx.fillRect(0, y1 - 1, W, ty > .5 ? 2 : 1);
      const cls = ty < .22 ? 0 : ty < .55 ? 1 : 2, z = [7, 13, 24][cls], sp = Math.round(z * 1.9);
      if (y1 - z * 1.6 > H)
        continue;
      for (let x = -(i & 1) * (sp >> 1) - sp, j = 0; x < W + sp; x += sp, j++) {
        const v = ((Math.floor(j / 4) % 3) + 3) % 3, sw = cls == 2 ? Math.round(Math.sin(time * 1.6 + x * .02 + i * .7) * .9) : 0;
        ctx.drawImage(A.plants[v][cls], x - z + sw, y1 - Math.ceil(z * 1.6) + 1);
      }
    }
  }
  /* rumput depan: helai pixel 3 nada, goyang pelan per langkah 1 piksel (tidak berkedip) */
  function drawGrass(S, time) {
    const y0 = Math.round(GW * H - S * F2.grass);
    if (y0 > H + 4)
      return;
    const cols = [['#1f2f32', '#2c433f', '#475c4c'], ['#1c292f', '#29403b', '#506252']];
    for (let L = 0; L < 2; L++) {
      const c = cols[L], fy = y0 + Math.round((L ? .13 : .035) * H);
      ctx.fillStyle = c[0];
      ctx.fillRect(0, fy, W, H - fy + 2);
      A.grass[L].forEach(b => {
        const by = y0 + b.o;
        if (by - b.h > H)
          return;
        const bend = Math.round(Math.sin(time * 1.8 + b.ph + b.x * .02) * 1.4 + b.lean * 3), h = b.h;
        for (let k = -3; k < h; k++) {
          const q = Math.max(0, k) / h, dx = Math.round(bend * q * q * 2);
          ctx.fillStyle = q < .35 ? c[0] : q < .72 ? c[1] : c[2];
          ctx.fillRect(b.x + dx, by - k, k > h - 3 ? 1 : b.w, 1);
        }
      });
    }
  }

  function drawFlags(S, time) {
    const y0 = Math.round(WY.A * H - A.A.M - S * F2.A);
    if (y0 > H || y0 + A.A.M < -20)
      return;
    A.flags.forEach(f => {
      const x = Math.round(f.x), y = y0 + Math.round(f.y); ctx.fillStyle = '#362f3c'; ctx.fillRect(x, y - 9, 1, 9); for (let i = 0; i < 7; i++) {
        const o = Math.round(Math.sin(time * 4 + f.x + i * .8) * 1.2 * (i / 6));
        ctx.fillStyle = '#c9453f';
        ctx.fillRect(x + 1 + i, y - 9 + o, 1, 4 - (i > 4 ? 1 : 0));
        ctx.fillStyle = '#e3665b';
        ctx.fillRect(x + 1 + i, y - 9 + o, 1, 1);
      }
    });
  }

  function drawBirds(S, time) {
    ctx.fillStyle = '#050409'; A.birds.forEach(b => {
      const x = Math.round(((b.x + b.sp * time) % (W + 60)) - 30), y = Math.round(b.wy - S * .9 + Math.sin(time * 1.3 + b.ph) * 3); if (y < -6 || y > H + 6)
        return; const up = (time * 5 + b.ph | 0) & 1; (up ? [[-3, -1], [-2, 0], [-1, 0], [0, 1], [1, 0], [2, 0], [3, -1]] : [[-3, 0], [-2, -1], [-1, 0], [0, 1], [1, 0], [2, -1], [3, 0]]).forEach(p => ctx.fillRect(x + p[0], y + p[1], 1, 1));
    });
  }

  function drawLeaves(dt, time, a) {
    if (a <= .01)
      return;
    ctx.globalAlpha = a;
    A.leaves.forEach(l => {
      l.x += l.vx * .35 * dt; l.y -= (l.vy + 8 - Math.sin(time * 2 + l.ph) * 9) * dt; l.rot += dt * 2; if (l.x > W + 6) {
        l.x = -6;
        l.y = Math.random() * H;
      } if (l.y < -6) {
        l.y = H + 6;
        l.x = Math.random() * W;
      } const x = Math.round(l.x), y = Math.round(l.y); ctx.fillStyle = l.col; if ((l.rot | 0) & 1) {
        ctx.fillRect(x, y, 2, 1);
        ctx.fillRect(x + 1, y + 1, 2, 1);
      } else {
        ctx.fillRect(x, y + 1, 2, 1);
        ctx.fillRect(x + 1, y, 2, 1);
      }
    });
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (done)
      return;
    raf = requestAnimationFrame(frame);
    const el = (now - t0) / 1000, dt = Math.min(.05, Math.max(0, (now - last) / 1000));
    last = now;
    const sH = camS(el), S = Math.round(sH * H), time = el, sk = skipAt ? cl((now - skipAt) / 450) : 0;
    ctx.drawImage(A.sky, 0, Math.round(-.35 * H - S * F2.sky));
    {
      const sx = Math.round(W * .77), sy = Math.round(.27 * H - S * F2.sun), r = Math.round(H * .06);
      [
        [r * 3.4, 'rgba(170,170,255,.10)'], [r * 2.4, 'rgba(170,170,255,.14)'], [r * 1.6, 'rgba(200,200,255,.22)'], [r, '#e9e6f8']
      ].forEach(a => disc(ctx, a[1], sx, sy, Math.round(a[0])));
    }
    drawClouds(S, time, 0, .7, 1);
    drawBirds(S, time);
    {
      const y = Math.round(WY.mount * H - A.mount.M - S * F2.mount);
      if (y < H)
        ctx.drawImage(A.mount.cv, 0, y);
    }
    haze(WY.mount * H - S * F2.mount + .02 * H, .45, Math.round(.05 * H));
    drawClouds(S, time, .7, 1, 1);
    layer(A.A, WY.A, F2.A, S);
    drawFlags(S, time);
    haze(WY.A * H - S * F2.A - .03 * H, .2, Math.round(.04 * H));
    layer(A.B, WY.B, F2.B, S);
    layer(A.C, WY.C, F2.C, S);
    drawField(S, time);
    drawClouds(S, time, 1, 9, 1 - cl((sH - .9) / .45));
    drawGrass(S, time);
    drawLeaves(dt, time, cl((sH - .55) / .5) * .7);
    tx.clearRect(0, 0, tcv.width, tcv.height);
    const TW = tcv.width, TH = tcv.height, ta = ez((el - .9) / 1.2) * (1 - ez((el - 4.4) / 1.2));
    if (ta > .01) {
      const fs = Math.max(26, Math.min(TW * .062, TH * .105)), px = TW * (TW > TH ? .27 : .5), py = TH * .3;
      tx.save();
      tx.globalAlpha = ta;
      tx.textAlign = 'center';
      tx.textBaseline = 'middle';
      tx.shadowColor = 'rgba(143,123,224,.8)';
      tx.shadowBlur = 30;
      tx.shadowOffsetY = 2;
      tx.lineJoin = 'round';
      tx.strokeStyle = 'rgba(14,10,36,.92)';
      if ('letterSpacing' in tx)
        tx.letterSpacing = Math.round(fs * .1) + 'px';
      {
        const gr = tx.createLinearGradient(0, py - fs * .6, 0, py + fs * .6);
        [
          [0, '#ffffff'], [.3, '#e8e3fb'], [.48, '#a99ce6'], [.54, '#5a4ca8'], [.62, '#9f92e0'], [.85, '#dcd6f7'], [1, '#7b6cc8']
        ].forEach(q => gr.addColorStop(q[0], q[1]));
        tx.fillStyle = gr;
      }
      tx.font = '700 ' + fs * 1.18 + 'px UnifrakturCook, Cinzel, Georgia, "Times New Roman", serif';
      tx.lineWidth = fs * .06;
      tx.strokeText('Echoes', px, py);
      tx.fillText('Echoes', px, py);
      if ('letterSpacing' in tx)
        tx.letterSpacing = Math.round(fs * .26) + 'px';
      tx.font = '700 ' + fs * .42 + 'px Cinzel, Georgia, "Times New Roman", serif';
      {
        const g2 = tx.createLinearGradient(0, py + fs * .7, 0, py + fs * 1.2);
        g2.addColorStop(0, '#f6f3ff');
        g2.addColorStop(1, '#b3a8ea');
        tx.fillStyle = g2;
      }
      tx.lineWidth = fs * .05;
      tx.strokeText('OF THE ABYSS', px, py + fs * .95);
      tx.fillText('OF THE ABYSS', px, py + fs * .95);
      tx.shadowBlur = 0;
      const lw = fs * 2.4 * ez((el - 1.4) / 1.2);
      tx.fillStyle = 'rgba(190,180,245,.8)';
      tx.fillRect(px - lw / 2, py + fs * 1.3, lw, 1.5);
      tx.restore();
    }
    {
      const EN = window.getLang && window.getLang() == 'en', CP = EN ? [
        ['Once, heroes conquered the five shadow dynasties.', 5, 7.4], ['Now the kingdom is silent... and the world has forgotten.', 7.6, 9.8], ['But the Abyss has not slept.', 10, 11.9]
      ] : [
        ['Dahulu, para pahlawan menaklukkan lima wangsa bayangan.', 5, 7.4], ['Kini kerajaan sunyi... dan dunia telah melupakan mereka.', 7.6, 9.8], ['Namun Abyss belum tidur.', 10, 11.9]
      ];
      for (const [tt, a0, a1] of CP) {
        const ca = ez((el - a0) / .6) * (1 - ez((el - (a1 - .6)) / .6));
        if (ca < .01)
          continue;
        const fz = Math.max(11, Math.min(TW * .034, TH * .052, TW * .92 / (tt.length * .46)));
        tx.save();
        tx.globalAlpha = ca;
        tx.textAlign = 'center';
        tx.textBaseline = 'middle';
        tx.shadowColor = 'rgba(0,0,0,.95)';
        tx.shadowBlur = 14;
        tx.shadowOffsetY = 1;
        tx.fillStyle = '#e6e0fa';
        tx.font = 'italic 500 ' + fz + 'px "Cormorant Garamond", Georgia, serif';
        if ('letterSpacing' in tx)
          tx.letterSpacing = Math.round(fz * .06) + 'px';
        tx.fillText(tt, TW / 2, TH * .83);
        tx.shadowBlur = 0;
        tx.fillStyle = 'rgba(190,180,245,.7)';
        const lw2 = Math.min(TW * .5, fz * tt.length * .3) * ca;
        tx.fillRect(TW / 2 - lw2 / 2, TH * .83 + fz * .95, lw2, 1);
        tx.restore();
      }
    }
    const bl = Math.max(ez((el - 11.2) / 1.2), sk, 1 - ez(el / .9));
    if (bl > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + bl + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (el >= DUR || sk >= 1)
      finish();
  }

  function finish() {
    if (done)
      return;
    done = true;
    try {
      SFX.mode('menu');
    } catch (e) { }
    cancelAnimationFrame(raf);
    removeEventListener('resize', onResize);
    removeEventListener('keydown', onKey);
    menu.classList.remove('hidden');
    root.style.background = '#000';
    root.style.pointerEvents = 'none';
    root.style.transition = 'opacity .9s ease';
    root.style.opacity = '0';
    setTimeout(() => { root.remove(); A = null; }, 1000);
  }
  const skip = () => {
    if (!skipAt && !done) {
      skipAt = performance.now();
      try {
        SFX.cut(.3);
      } catch (e) { }
    }
  };
  const onKey = e => {
    if (e.code == 'Enter' || e.code == 'Space' || e.code == 'Escape') {
      e.preventDefault();
      skip();
    }
  };
  const onResize = () => {
    clearTimeout(rz); rz = setTimeout(() => {
      if (!done)
        try {
          build();
        } catch (e) { }
    }, 200);
  };
  try {
    document.fonts && (document.fonts.load('700 40px UnifrakturCook'), document.fonts.load('italic 500 20px "Cormorant Garamond"'), document.fonts.load('700 40px Cinzel'));
  } catch (e) { }

  /* ===== SUARA INTRO: mulai otomatis bila browser mengizinkan; jika tidak, ketukan/tombol pertama menyalakan suara (tanpa melewati intro) ===== */
  let sndOn = false, hint = null;
  const sndState = () => {
    try {
      return SFX.state();
    } catch (e) {
      return 'none';
    }
  };
  const startSnd = () => {
    sndOn = true; if (hint) {
      hint.remove();
      hint = null;
    } try {
      SFX.opening(Math.max(0, (performance.now() - t0) / 1000));
    } catch (e) { }
  };
  try {
    SFX.init();
    SFX.mode('cine');
  } catch (e) { }
  const sndPoll = setInterval(() => {
    if (done) {
      clearInterval(sndPoll);
      return;
    }
    if (sndState() === 'running') {
      clearInterval(sndPoll);
      startSnd();
      return;
    }
    if (!hint && performance.now() - t0 > 700) {
      hint = document.createElement('div');
      hint.textContent = (window.getLang && window.getLang() == 'en') ? '♪ TAP FOR SOUND' : '♪ KETUK UNTUK SUARA';
      hint.style.cssText = 'position:absolute;left:0;right:0;bottom:7%;text-align:center;pointer-events:none;font:600 12px Cinzel,Georgia,serif;letter-spacing:.3em;color:#f1d9a4;opacity:.8;text-shadow:0 0 8px #000,0 1px 2px #000;animation:introSkipIn 1s ease both';
      root.appendChild(hint);
    }
  }, 150);
  root.addEventListener('pointerdown', e => {
    if (!sndOn && !done && sndState() !== 'running' && !(e.target.closest && e.target.closest('#introSkip'))) {
      e.stopPropagation();
      try {
        SFX.init();
      } catch (_) { }
    }
  }, true);
  try {
    menu.classList.add('hidden');
    build();
    root.addEventListener('pointerdown', skip);
    addEventListener('keydown', onKey);
    addEventListener('resize', onResize);
    t0 = last = performance.now();
    raf = requestAnimationFrame(frame);
  } catch (e) {
    console.error(e);
    done = false;
    finish();
  }
})();
/* ===== INTRO: naga terbang (ikut paralaks langit seperti burung), bara api, dan judul sinematik (menu tidak diubah) ===== */
(function () {
  const root = document.getElementById('intro'), sk = document.getElementById('introSkip');
  if (!root)
    return;
  /* suara otomatis: coba terus-menerus & buka kunci audio pada interaksi apa pun (browser tidak mengizinkan suara tanpa interaksi sama sekali) */
  const unlock = () => {
    try {
      SFX.init();
    } catch (e) { }
  };
  ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown'].forEach(ev => addEventListener(ev, unlock, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', unlock);
  addEventListener('focus', unlock);
  const uIv = setInterval(() => {
    if (!root.isConnected) {
      clearInterval(uIv);
      return;
    } unlock();
  }, 250);
  const mkc = css => { const c = document.createElement('canvas'); c.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;z-index:1;' + css; root.insertBefore(c, sk); return c; };
  const gc = mkc('width:100%;height:100%;mix-blend-mode:screen'), dc = mkc('image-rendering:pixelated');
  const gx = gc.getContext('2d'), dx = dc.getContext('2d');
  let W, H, SC, raf, GW = 0, GH = 0, fadeAt = 0;
  const t0 = performance.now();
  let last = t0;
  const em = [], sp = [];
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ez = u => { u = cl(u); return u * u * (3 - 2 * u); };
  /* kamera identik dengan intro (spline), agar naga ikut bergulir seperti burung */
  const KT = [0, 1.4, 5, 9, 12.2], KS = [0, .06, .85, 1.2, 1.9], KM = (() => {
    const n = 5, d = [], m = []; for (let i = 0; i < n - 1; i++)
      d[i] = (KS[i + 1] - KS[i]) / (KT[i + 1] - KT[i]); m[0] = 0; for (let i = 1; i < n - 1; i++)
      m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2; m[n - 1] = d[n - 2]; return m;
  })();

  function camS(t) {
    t = Math.min(t, 12.2); let i = 0; while (i < 3 && t > KT[i + 1])
      i++; const h = KT[i + 1] - KT[i], u = (t - KT[i]) / h, u2 = u * u, u3 = u2 * u; return (2 * u3 - 3 * u2 + 1) * KS[i] + (u3 - 2 * u2 + u) * h * KM[i] + (-2 * u3 + 3 * u2) * KS[i + 1] + (u3 - u2) * h * KM[i + 1];
  }

  /* ===== HIASAN JUDUL: mahkota sayap naga, braket sudut, pembatas permata, kilau bintang ===== */
  const oc = mkc('width:100%;height:100%'), ox = oc.getContext('2d');
  const gold = (a, l) => 'rgba(' + (l ? '240,238,255' : '170,155,235') + ',' + a + ')';

  function dia(x, y, r, fill) { ox.beginPath(); ox.moveTo(x, y - r); ox.lineTo(x + r * .7, y); ox.lineTo(x, y + r); ox.lineTo(x - r * .7, y); ox.closePath(); ox.fillStyle = fill; ox.fill(); }

  function sword(x, cy, fs) {
    const Hs = fs * 1.1, top = cy - Hs * .55, w = fs * .085, by = cy + Hs * .06;
    const bg = ox.createLinearGradient(x - w, 0, x + w, 0);
    bg.addColorStop(0, '#7c70c8');
    bg.addColorStop(.5, '#ffffff');
    bg.addColorStop(1, '#8f84d8');
    ox.save();
    ox.shadowColor = 'rgba(160,140,255,.9)';
    ox.shadowBlur = fs * .25;
    ox.fillStyle = bg;
    ox.beginPath();
    ox.moveTo(x, top);
    ox.lineTo(x + w, top + Hs * .12);
    ox.lineTo(x + w, by);
    ox.lineTo(x - w, by);
    ox.lineTo(x - w, top + Hs * .12);
    ox.closePath();
    ox.fill();
    ox.restore();
    ox.strokeStyle = 'rgba(60,50,130,.55)';
    ox.lineWidth = Math.max(1, fs * .018);
    ox.beginPath();
    ox.moveTo(x, top + Hs * .14);
    ox.lineTo(x, by - Hs * .02);
    ox.stroke();
    ox.strokeStyle = '#d9d3f7';
    ox.lineWidth = Math.max(2, fs * .05);
    ox.beginPath();
    ox.moveTo(x - fs * .27, cy + Hs * .12);
    ox.quadraticCurveTo(x, cy + Hs * .02, x + fs * .27, cy + Hs * .12);
    ox.stroke();
    [-1, 1].forEach(s => { ox.fillStyle = '#b6a8ff'; ox.beginPath(); ox.arc(x + s * fs * .27, cy + Hs * .12, fs * .04, 0, 6.283); ox.fill(); });
    ox.fillStyle = '#5a4ca8';
    ox.fillRect(x - fs * .03, cy + Hs * .09, fs * .06, Hs * .27);
    ox.fillStyle = '#9d90e0';
    for (let i = 0; i < 4; i++)
      ox.fillRect(x - fs * .03, cy + Hs * (.13 + i * .06), fs * .06, Math.max(1, fs * .012));
    ox.fillStyle = '#ece8ff';
    ox.beginPath();
    ox.arc(x, cy + Hs * .4, fs * .06, 0, 6.283);
    ox.fill();
    dia(x, cy + Hs * .08, fs * .05, '#6a5cc0');
  }

  function decor(el) {
    const TW = oc.width, TH = oc.height;
    ox.clearRect(0, 0, TW, TH);
    const ta = ez((el - .9) / 1.2) * (1 - ez((el - 4.4) / 1.2));
    if (ta < .01)
      return;
    const fs = Math.max(26, Math.min(TW * .062, TH * .105)), px = TW * (TW > TH ? .27 : .5), py = TH * .3, bw = fs * 2.7, g1 = ez((el - 1.3) / 1.4), cy = py - fs * .92;
    ox.save();
    ox.globalAlpha = ta;
    ox.lineCap = 'round';
    const gg = ox.createRadialGradient(0, 0, 0, 0, 0, fs * 1.4);
    gg.addColorStop(0, 'rgba(200,190,255,.8)');
    gg.addColorStop(1, 'rgba(120,100,220,0)');
    ox.save();
    ox.translate(px, cy);
    ox.fillStyle = gg;
    ox.globalAlpha = ta * (.7 + .3 * Math.sin(el * 3));
    ox.fillRect(-fs * 1.4, -fs * 1.4, fs * 2.8, fs * 2.8);
    ox.restore();
    /* sayap naga di kiri-kanan permata */
    for (let s = -1; s <= 1; s += 2)
      for (let k = 0; k < 4; k++) {
        const L = fs * (1.55 - k * .3) * g1, a = fs * .3, gr = ox.createLinearGradient(px + s * a, 0, px + s * (a + L), 0);
        gr.addColorStop(0, gold(.95, 1));
        gr.addColorStop(1, gold(0));
        ox.strokeStyle = gr;
        ox.lineWidth = Math.max(1.5, fs * .035 * (1 - k * .15));
        ox.beginPath();
        ox.moveTo(px + s * a, cy + k * fs * .015);
        ox.quadraticCurveTo(px + s * (a + L * .5), cy - fs * (.2 + k * .015), px + s * (a + L), cy + fs * (.1 + k * .09));
        ox.stroke();
      }
    sword(px, cy, fs);
    /* braket sudut */
    const x0 = px - bw * g1, x1 = px + bw * g1, y0 = py - fs * .78, y1 = py + fs * 1.95, bl = fs * .42;
    ox.strokeStyle = gold(.8);
    ox.lineWidth = Math.max(1.5, fs * .028);
    [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, sx, sy]) => { ox.beginPath(); ox.moveTo(x, y + sy * bl); ox.lineTo(x, y); ox.lineTo(x + sx * bl, y); ox.stroke(); dia(x, y, fs * .07, gold(1, 1)); });
    /* pembatas permata di bawah subjudul */
    const dy = py + fs * 1.62, dl = bw * .8 * ez((el - 1.7) / 1.2), dg = ox.createLinearGradient(px - dl, 0, px + dl, 0);
    dg.addColorStop(0, gold(0));
    dg.addColorStop(.35, gold(.9));
    dg.addColorStop(.5, gold(1, 1));
    dg.addColorStop(.65, gold(.9));
    dg.addColorStop(1, gold(0));
    ox.fillStyle = dg;
    ox.fillRect(px - dl, dy - 1, dl * 2, 2);
    if (dl > fs * .3) {
      dia(px, dy, fs * .13, '#f2eeff');
      dia(px, dy, fs * .07, '#6a5cc0');
      [-1, 1].forEach(s => { dia(px + s * fs * .34, dy, fs * .06, gold(1)); dia(px + s * fs * .55, dy, fs * .035, gold(.8)); });
    }
    /* kilau bintang yang berkedip */
    ox.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const a = Math.pow(Math.max(0, Math.sin(el * 2.1 + i * 1.9)), 8);
      if (a < .02)
        continue;
      const x = px + (i / 5 - .5) * fs * 4.4, y = py + Math.sin(i * 7) * fs * .32, r = fs * (.12 + .22 * a);
      ox.strokeStyle = 'rgba(240,236,255,' + a + ')';
      ox.lineWidth = 1.5;
      ox.beginPath();
      ox.moveTo(x - r, y);
      ox.lineTo(x + r, y);
      ox.moveTo(x, y - r * 1.4);
      ox.lineTo(x, y + r * 1.4);
      ox.stroke();
    }
    ox.restore();
  }

  function size() { SC = Math.max(2, Math.round(innerHeight / 340)); W = Math.ceil(innerWidth / SC); H = Math.ceil(innerHeight / SC); dc.width = W; dc.height = H; dc.style.width = W * SC + 'px'; dc.style.height = H * SC + 'px'; gc.width = oc.width = innerWidth; gc.height = oc.height = innerHeight; }
  size();
  addEventListener('resize', size);
  const R = (c, a, b, w, h) => { dx.fillStyle = c; dx.fillRect(Math.round(a), Math.round(b), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  const ln = (c, x0, y0, x1, y1, w) => {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))); for (let i = 0; i <= n; i++) {
      const u = n ? i / n : 0;
      R(c, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, w, w);
    }
  };

  function tri(c, ax, ay, bx, by, cx, cy) {
    const E = [[ax, ay, bx, by], [bx, by, cx, cy], [cx, cy, ax, ay]]; for (let y = Math.floor(Math.min(ay, by, cy)); y <= Math.ceil(Math.max(ay, by, cy)); y++) {
      const xs = [];
      E.forEach(([p, q, r, s]) => {
        if ((q <= y && s > y) || (s <= y && q > y))
          xs.push(p + (y - q) / (s - q) * (r - p));
      });
      if (xs.length > 1) {
        const a = Math.min(...xs), b = Math.max(...xs);
        R(c, a, y, b - a + 1, 1);
      }
    }
  }

  function wing(x, y, s, t, f, ph, far) {
    const P = v => x + v * f, p = Math.sin(t * 2.4 + ph), sh = [3 * s, -2 * s], E = [sh[0] - 5 * s, sh[1] - (7 + 10 * p) * s], F1 = [E[0] - 9 * s, E[1] + (8 + p) * s], F2 = [E[0] - 6 * s, E[1] + 14 * s], B = [-7 * s, 0];
    const m = far ? '#25122a' : '#2e1631', bone = far ? '#5a2a3c' : '#a6523f';
    [[sh, E, F1], [sh, F1, F2], [sh, F2, B]].forEach(q => tri(m, P(q[0][0]), y + q[0][1], P(q[1][0]), y + q[1][1], P(q[2][0]), y + q[2][1]));
    ln(bone, P(sh[0]), y + sh[1], P(E[0]), y + E[1], 1);
    [F1, F2].forEach(q => ln(bone, P(E[0]), y + E[1], P(q[0]), y + q[1], 1));
  }

  function dragon(x, y, s, t, f, al) {
    dx.globalAlpha = al;
    const P = v => x + v * f;
    wing(x + 1.5 * s * f, y - s, s, t, f, .9, 1);
    for (let i = 0; i <= 28; i++) {
      const u = i / 28 * 2 - 1, py = y + Math.sin(u * 3.2 - t * 2.4) * 1.7 * s * (.5 - u * .5) - Math.sin(u * 2 + 1) * s, r = s * (.7 + 2.6 * Math.exp(-Math.pow((u - .1) / .38, 2))), px = P(u * 15 * s);
      for (let d = -Math.round(r); d <= r; d++) {
        const w = Math.round(Math.sqrt(Math.max(0, r * r - d * d)) * 1.1) + 1;
        R(d > r * .55 ? '#4a2038' : '#1c0f26', px - w / 2, py + d, w, 1);
      }
    }
    const hx = 15 * s, hy = y - Math.sin(3) * s;
    R('#1c0f26', P(hx) - (f < 0 ? 4 * s : 0), hy - s, 4 * s, 1.8 * s);
    R('#1c0f26', P(hx + 2 * s) - (f < 0 ? 3 * s : 0), hy + .8 * s, 3 * s, .8 * s);
    ln('#d9a655', P(hx - 1.5 * s), hy - s, P(hx - 5 * s), hy - 4.5 * s, 1);
    ln('#d9a655', P(hx - 3 * s), hy - s, P(hx - 6.5 * s), hy - 3 * s, 1);
    R('#ffb347', P(hx + 1.2 * s), hy - .6 * s, 1, 1);
    wing(x, y, s, t, f, 0, 0);
    dx.globalAlpha = 1;
    return [P(hx + 4 * s), hy];
  }

  function glow(x, y, r, a, c) { const g = gx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + c + ',' + a + ')'); g.addColorStop(1, 'rgba(' + c + ',0)'); gx.fillStyle = g; gx.fillRect(x - r, y - r, r * 2, r * 2); }

  function frame(now) {
    if (!root.isConnected)
      return;
    raf = requestAnimationFrame(frame);
    const el = (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000);
    last = now;
    GW = gc.width;
    GH = gc.height;
    if (fadeAt) {
      const o = 1 - cl((now - fadeAt) / 250);
      gc.style.opacity = dc.style.opacity = oc.style.opacity = o;
    }
    dx.clearRect(0, 0, W, H);
    gx.clearRect(0, 0, GW, GH);
    const S = camS(el) * H;
    const warm = ez((el - 2.5) / 4) * (1 - ez((el - 10.5) / 2)), pulse = .8 + .2 * Math.sin(el * 3);
    glow(GW * .64, GH * 1.02, GH * .95, .2 * warm * pulse, '255,100,40');
    glow(GW * .77, (.27 * H - S * .35) * SC, GH * .35, .1 * ez(el / 2), '255,200,140');
    /* dua naga jauh (paralaks .75) */
    [[.4, .13, 1, 1.2, 7.5, .8], [.5, .2, .9, 2.4, 9, .6]].forEach(([x0, y0, s, a, b, al], i) => {
      const u = cl((el - a) / (b - a)); if (u > 0 && u < 1) {
        const wy = y0 * H + .75 * camS(3) * H;
        dragon((x0 + u * .62) * W, wy - .75 * S + Math.sin(el + i * 2) * .012 * H, s, el + i, 1, al * Math.min(1, ez(u * 5) * (1 - ez((u - .85) / .15)) + .001));
      }
    });
    /* naga besar: dunia-anchored seperti burung (paralaks .9) — kamera turun, naga tetap di langit dan terdorong keluar atas */
    const u = (el - 3.6) / 6.4;
    if (u > 0 && u < 1) {
      const s = 2.7, x = (1.14 - 1.28 * u) * W, wy = .3 * H + .9 * camS(6.2) * H, y = wy - .9 * S + Math.sin(el * 1.5) * .012 * H + (el - 6.2) * .006 * H, h = dragon(x, y, s, el, -1, 1), fa = ez((el - 6) / .4) * (1 - ez((el - 7.8) / .6));
      if (fa > .01)
        for (let i = 0; i < 20; i++) {
          const k = i / 20;
          glow((h[0] - k * 26 * s + (Math.random() - .5) * 3) * SC, (h[1] + k * 9 * s + (Math.random() - .5) * 4) * SC, (3 + k * 12) * s * SC * .55, (1 - k) * .55 * fa, k < .35 ? '255,230,160' : '255,110,30');
        }
      glow(h[0] * SC, h[1] * SC, 26 * SC, .3, '255,140,50');
    }
    if (el > 1.5 && em.length < 55 && Math.random() < .6)
      em.push({
        x: Math.random() * GW, y: GH + 6, v: 25 + Math.random() * 55, ph: Math.random() * 6, r: 1 + Math.random() * 2.2
      });
    const ea = ez((el - 1.5) / 1.5) * (1 - ez((el - 11) / 1.2));
    for (let i = em.length - 1; i >= 0; i--) {
      const e = em[i];
      e.y -= e.v * dt;
      e.ph += dt * 2;
      e.x += Math.sin(e.ph) * 14 * dt;
      if (e.y < -8) {
        em.splice(i, 1);
        continue;
      }
      const a = ea * cl(e.y / GH * 1.4) * .85;
      gx.fillStyle = 'rgba(255,' + (150 + 60 * Math.sin(e.ph) | 0) + ',70,' + a + ')';
      gx.shadowColor = '#ff7a1a';
      gx.shadowBlur = 8;
      gx.fillRect(e.x, e.y, e.r * SC / 2 + 1, e.r * SC / 2 + 1);
    }
    for (let i = sp.length - 1; i >= 0; i--) {
      const q = sp[i];
      q.l += dt;
      if (q.l > q.L) {
        sp.splice(i, 1);
        continue;
      }
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 30 * dt;
      gx.fillStyle = 'rgba(255,' + (170 + 70 * (1 - q.l / q.L) | 0) + ',90,' + (1 - q.l / q.L) + ')';
      gx.shadowColor = '#ff8a2e';
      gx.shadowBlur = 10;
      gx.fillRect(q.x, q.y, q.r + 1, q.r + 1);
    }
    gx.shadowBlur = 0;
    decor(el);
  }
  root.addEventListener('pointerdown', () => {
    if (!fadeAt)
      fadeAt = performance.now();
  });
  addEventListener('keydown', e => {
    if (e.code == 'Enter' || e.code == 'Space' || e.code == 'Escape') {
      if (!fadeAt)
        fadeAt = performance.now();
    }
  });
  raf = requestAnimationFrame(frame);
})();
/* ===== Pilihan Level & Kesulitan Dungeon ===== */
let LVL = 1, DIFF = 1, dselOn = false;
// ===== KESULITAN LANJUTAN (MUDAH tetap normal; BIASA & SULIT lebih keras) =====
// heal  : pengali penyembuhan (potion & +HP)   potCd: jeda minum potion   drop: peluang musuh menjatuhkan potion
// ult   : pengali kecepatan isi bar ULT        time : kecepatan gerak+serangan musuh biasa   tb: kecepatan bos/mini bos (saat jalan & jeda)
// cd    : pengali jeda serangan musuh biasa    shots: tambahan peluru/serangan beruntun       pv: kecepatan peluru musuh
const DFX = [
  { heal: 1, potCd: .5, drop: .3, ult: 1, time: 1, tb: 1, cd: 1, shots: 0, pv: 1 },
  { heal: .8, potCd: 1, drop: .22, ult: .75, time: 1.12, tb: 1.12, cd: .85, shots: 1, pv: 1.1 },
  { heal: 1 / 6, potCd: 1.6, drop: .1, ult: .3, time: 1.3, tb: 1.35, cd: .7, shots: 2, pv: 1.3 }
];
const dfx = () => lobby ? DFX[0] : DFX[DIFF];
const HEALV = v => Math.max(1, Math.round(v * dfx().heal));
const enemyTime = e => {
  if (lobby || e.sw > 0 || e.k == 'dummy')
    return 1; const f = DFX[DIFF]; if (e.k == 'boss' || e.mini)
    return (!e.s2 || e.s2 == 'move' || e.s2 == 'rest') ? f.tb : 1; return f.time;
};
const DF = [
  { n: 'MUDAH', hp: 1, dmg: 1, sp: 1, cnt: 1, c: '#8fe8a0', d: 'Pengalaman standar' },
  {
    n: 'BIASA', hp: 2, dmg: 1, sp: 1.05, cnt: 1.15, c: '#ffe7ad', d: 'Musuh alot (HP 2x), lebih banyak & agresif · ULT lebih lambat · heal berkurang'
  },
  {
    n: 'SULIT', hp: 5, dmg: 1.8, sp: 1.2, cnt: 1.4, c: '#ff6b6b', d: 'HP musuh 5x, brutal & cepat, serangan bertubi-tubi · damage +80% · ULT sangat sulit penuh · heal hanya +10'
  }
];
(function () {
  const PX = rows => {
    let d = ''; rows.forEach((r, y) => {
      for (let x = 0; x < r.length; x++)
        if (r[x] == '#')
          d += 'M' + x + ' ' + y + 'h1v1h-1z';
    }); return '<svg viewBox="0 0 ' + rows[0].length + ' ' + rows.length + '" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="' + d + '"/></svg>';
  };
  const IC = {
    castle: PX(['#.#..#.#', '########', '.######.', '.##..##.', '.##..##.', '.##..##.', '########', '########']),
    flame: PX(['...#....', '...##...', '..###.#.', '.#####.#', '.#######', '########', '.######.', '..####..']),
    snow: PX(['...##...', '#..##..#', '.#.##.#.', '..####..', '########', '..####..', '.#.##.#.', '#..##..#']),
    heart: PX(['.##..##.', '########', '########', '########', '.######.', '..####..', '...##...', '........']),
    sword: PX(['......##', '.....###', '....###.', '#..###..', '.####...', '..##....', '.#.##...', '#...#...']),
    skull: PX(['.######.', '########', '##.##.##', '##.##.##', '########', '.######.', '.#.##.#.', '.######.']),
    door: PX(['..####..', '.######.', '.#....#.', '.#....#.', '.#...##.', '.#....#.', '.#....#.', '########']),
    inf: PX(['............', '.###....###.', '#...#..#...#', '#....##....#', '#...#..#...#', '.###....###.'])
  };
  const DIC = [IC.heart, IC.sword, IC.skull];
  const seg = v => {
    const n = Math.max(1, Math.min(5, Math.round(v * 3))); let s = ''; for (let i = 0; i < 5; i++)
      s += '<i' + (i < n ? ' class="on"' : '') + '></i>'; return '<span class="sg">' + s + '</span>';
  };
  window.DSIC = IC;
  const SC = (bg, r) => '<svg viewBox="0 0 48 20" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" aria-hidden="true"><rect width="48" height="20" fill="' + bg + '"/>' + r.map(([x, y, w, h, c, o]) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"' + (o ? ' opacity="' + o + '"' : '') + '/>').join('') + '</svg>';
  const SCN = [
    null,
    /* Ancient Halls: aula batu berlumut, obor, gerbang */
    SC('#1b2d26', [
      [0, 4, 48, 1, '#22382f'], [0, 9, 48, 1, '#22382f'], [0, 14, 48, 1, '#22382f'], [6, 0, 1, 4, '#22382f'], [30, 0, 1, 4, '#22382f'], [18, 5, 1, 4, '#22382f'], [42, 5, 1, 4, '#22382f'], [12, 10, 1, 4, '#22382f'], [36, 10, 1, 4, '#22382f'],
      [0, 15, 48, 5, '#2e4a3e'], [0, 15, 48, 1, '#4f7a64'], [0, 18, 48, 1, '#243b31'], [10, 16, 1, 2, '#243b31'], [26, 16, 1, 2, '#243b31'], [40, 16, 1, 2, '#243b31'],
      [4, 2, 5, 13, '#4c6f5e'], [4, 2, 1, 13, '#6f9a84'], [8, 2, 1, 13, '#344f43'], [3, 1, 7, 2, '#5d8570'], [3, 13, 7, 2, '#5d8570'],
      [39, 2, 5, 13, '#4c6f5e'], [39, 2, 1, 13, '#6f9a84'], [43, 2, 1, 13, '#344f43'], [38, 1, 7, 2, '#5d8570'], [38, 13, 7, 2, '#5d8570'],
      [17, 6, 2, 9, '#4c6f5e'], [29, 6, 2, 9, '#4c6f5e'], [19, 5, 1, 1, '#4c6f5e'], [28, 5, 1, 1, '#4c6f5e'], [20, 4, 2, 1, '#4c6f5e'], [26, 4, 2, 1, '#4c6f5e'], [22, 3, 4, 1, '#5d8570'],
      [19, 6, 10, 9, '#070d0b'], [20, 5, 8, 1, '#070d0b'], [22, 4, 4, 1, '#070d0b'], [22, 10, 4, 5, '#8fe8a0', .25],
      [10, 4, 9, 9, '#ff9a2a', .12], [31, 4, 9, 9, '#ff9a2a', .12],
      [13, 9, 1, 3, '#7a4a20'], [12, 6, 3, 3, '#ff9a2a'], [13, 5, 1, 1, '#ffd34d'], [13, 7, 1, 2, '#ffe08a'],
      [34, 9, 1, 3, '#7a4a20'], [33, 6, 3, 3, '#ff9a2a'], [34, 5, 1, 1, '#ffd34d'], [34, 7, 1, 2, '#ffe08a']
    ]),
    /* Lava Depths: gua batu, sungai lava, pulau bara */
    SC('#240c0a', [
      [0, 0, 48, 2, '#120504'], [3, 2, 4, 1, '#120504'], [4, 3, 2, 1, '#120504'], [5, 4, 1, 1, '#120504'], [15, 2, 3, 1, '#120504'], [16, 3, 1, 2, '#120504'], [27, 2, 5, 1, '#120504'], [28, 3, 3, 1, '#120504'], [29, 4, 1, 2, '#120504'], [40, 2, 4, 1, '#120504'], [41, 3, 2, 1, '#120504'], [42, 4, 1, 1, '#120504'],
      [0, 10, 48, 5, '#4a1608'], [0, 12, 48, 3, '#7a240c'],
      [14, 9, 20, 6, '#3a1812'], [15, 8, 18, 1, '#4a1c10'], [14, 12, 20, 3, '#2a100c'], [20, 11, 1, 3, '#ff7a1f'], [27, 10, 1, 4, '#ff7a1f'],
      [22, 6, 4, 2, '#ff7a1f'], [23, 4, 2, 2, '#ff9a2a'], [23, 3, 1, 1, '#ffd34d'],
      [0, 14, 48, 6, '#d22a0a'], [0, 14, 48, 2, '#ff7a1f'], [4, 16, 6, 1, '#ffd34d'], [20, 17, 9, 1, '#ffb347'], [36, 15, 5, 1, '#ffd34d'], [12, 18, 4, 1, '#ff9a2a'], [30, 19, 6, 1, '#ff9a2a'],
      [8, 7, 1, 1, '#ffb050'], [10, 5, 1, 1, '#ff7a1f'], [38, 6, 1, 1, '#ffb050'], [42, 9, 1, 1, '#ff7a1f'], [6, 11, 1, 1, '#ffd34d'], [34, 4, 1, 1, '#ffd34d']
    ]),
    /* Frost Crypt: gua es, stalaktit, kristal */
    SC('#0d1f36', [
      [0, 0, 48, 6, '#0a1830'], [19, 3, 10, 12, '#8fe0ff', .12],
      [5, 4, 1, 1, '#fff', .8], [11, 8, 1, 1, '#fff', .7], [17, 3, 1, 1, '#dff6ff'], [31, 5, 1, 1, '#fff', .8], [38, 9, 1, 1, '#fff', .7], [44, 4, 1, 1, '#dff6ff'], [8, 11, 1, 1, '#fff', .6], [27, 10, 1, 1, '#fff', .6],
      [0, 0, 48, 2, '#16345a'], [2, 2, 2, 1, '#a8e0ff'], [2, 3, 1, 2, '#a8e0ff'], [9, 2, 3, 1, '#a8e0ff'], [10, 3, 1, 3, '#a8e0ff'], [20, 2, 2, 1, '#a8e0ff'], [20, 3, 1, 2, '#a8e0ff'], [34, 2, 3, 1, '#a8e0ff'], [35, 3, 1, 4, '#a8e0ff'], [42, 2, 2, 1, '#a8e0ff'], [42, 3, 1, 2, '#a8e0ff'],
      [0, 15, 48, 5, '#cdeeff'], [0, 15, 48, 1, '#ffffff'], [0, 17, 48, 3, '#8fc3e3'], [0, 19, 48, 1, '#6aa3c9'],
      [22, 6, 4, 9, '#8fe0ff'], [22, 6, 1, 9, '#d6f6ff'], [23, 4, 2, 2, '#d6f6ff'], [23, 3, 1, 1, '#fff'], [25, 7, 1, 8, '#5aa9d6'],
      [14, 10, 3, 5, '#6cc4ee'], [14, 10, 1, 5, '#bfeaff'], [15, 8, 1, 2, '#bfeaff'], [32, 9, 3, 6, '#6cc4ee'], [32, 9, 1, 6, '#bfeaff'], [33, 7, 1, 2, '#bfeaff'],
      [28, 12, 2, 3, '#6cc4ee'], [8, 12, 2, 3, '#6cc4ee'], [38, 12, 2, 3, '#6cc4ee']
    ])
  ];
  const LV = [
    ['1', 'Ancient Halls', 'Aula kuno dan Torch Dungeon, lalu bos Morvath.', 'castle', ['BOS MORVATH', 'COCOK PEMULA']],
    ['2', 'Lava Depths', 'Kolam lava melukai yang berdiri di atasnya. Musuh +15% HP.', 'flame', ['LAVA MELUKAI', 'HP MUSUH +15%']],
    ['3', 'Frost Crypt', 'Ruang es beku. Serangan musuh membuatmu membeku (melambat). Musuh +20% HP.', 'snow', ['EFEK BEKU', 'HP MUSUH +20%']]
  ];
  /* ===== Gaya menu pilih dungeon (disisipkan dari JS agar menu tetap mandiri) ===== */
  const dcss = document.createElement('style');
  dcss.textContent = `
    #dsel{position:fixed;inset:0;z-index:250;display:none;align-items:center;justify-content:center;padding:10px;box-sizing:border-box;overflow:auto;
      font-family:ui-monospace,'Courier New',monospace;color:#e9ecf5;--th:#8fe8a0;--th2:rgba(143,232,160,.22);
      background:radial-gradient(ellipse at 50% 38%,var(--th2),rgba(4,6,12,.94) 68%),#05070c;transition:background .45s}
    #dsel[data-th="1"]{--th:#8fe8a0;--th2:rgba(80,200,120,.26)}
    #dsel[data-th="2"]{--th:#ff8a3a;--th2:rgba(255,90,20,.30)}
    #dsel[data-th="3"]{--th:#8fe0ff;--th2:rgba(80,170,255,.28)}
    #dsel[data-th="e"]{--th:#ffd98a;--th2:rgba(255,200,80,.24)}
    #dsel.on{display:flex}
    #dsel::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.55;
      background:radial-gradient(circle at 15% 85%,var(--th) 0 1px,transparent 2px),radial-gradient(circle at 70% 90%,var(--th) 0 1px,transparent 2px),
      radial-gradient(circle at 40% 95%,var(--th) 0 1.5px,transparent 2.5px),radial-gradient(circle at 88% 80%,var(--th) 0 1px,transparent 2px);
      background-size:260px 260px,340px 340px,420px 420px,300px 300px;animation:dsRise 14s linear infinite}
    @keyframes dsRise{from{background-position:0 0,0 0,0 0,0 0}to{background-position:0 -520px,0 -680px,0 -840px,0 -600px}}
    #dsel .bx{position:relative;width:min(940px,100%);margin:auto;padding:20px 22px 14px;box-sizing:border-box;border-radius:6px;
      background:linear-gradient(180deg,rgba(18,22,36,.96),rgba(9,11,20,.97));
      box-shadow:0 0 0 2px var(--th),0 0 0 5px #0a0d18,0 0 0 6px rgba(255,255,255,.12),0 20px 70px #000,0 0 60px var(--th2);
      animation:dsIn .38s cubic-bezier(.2,.9,.25,1.05)}
    @keyframes dsIn{from{transform:translateY(18px) scale(.96);opacity:0}to{transform:none;opacity:1}}
    #dsel .bx::before,#dsel .bx::after{content:'\u25C6';position:absolute;color:var(--th);font-size:14px;text-shadow:0 0 8px var(--th)}
    #dsel .bx::before{left:8px;top:6px}#dsel .bx::after{right:8px;bottom:6px}
    #dsel h2{margin:0 0 4px;text-align:center;font-size:26px;letter-spacing:8px;color:#fff;text-shadow:0 0 14px var(--th),0 2px 0 #000;display:flex;align-items:center;gap:14px}
    #dsel h2::before,#dsel h2::after{content:'';flex:1;height:2px;background:linear-gradient(90deg,transparent,var(--th))}
    #dsel h2::after{transform:scaleX(-1)}
    #dsel .sub{display:flex;align-items:center;gap:10px;margin:14px 0 8px;font-size:11px;letter-spacing:4px;color:#9aa4c0}
    #dsel .sub::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(255,255,255,.25),transparent)}
    #dsel .sub.sl{margin-top:8px}
    #dsel .row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    #dsel .cd{position:relative;cursor:pointer;border-radius:6px;overflow:hidden;box-sizing:border-box;--c:#8fe8a0;
      background:linear-gradient(180deg,#141a2c,#0c101d);border:2px solid rgba(255,255,255,.12);
      transition:transform .16s,border-color .16s,box-shadow .16s,filter .16s;-webkit-tap-highlight-color:transparent;user-select:none}
    #dsel .cd:hover{transform:translateY(-3px);border-color:var(--c);filter:none}
    #dsel .cd:active{transform:translateY(0) scale(.985)}
    #dsel .row:has(.sel) .cd:not(.sel){filter:saturate(.55) brightness(.78)}
    #dsel .cd.sel{border-color:var(--c);transform:translateY(-4px);filter:none;
      box-shadow:0 0 0 1px var(--c),0 0 22px color-mix(in srgb,var(--c) 55%,transparent),0 10px 26px rgba(0,0,0,.6)}
    #dsel .lv.l1{--c:#8fe8a0}#dsel .lv.l2{--c:#ff8a3a}#dsel .lv.l3{--c:#8fe0ff}
    /* kartu level */
    #dsel .lv .bn{position:relative;height:118px;overflow:hidden;border-bottom:2px solid color-mix(in srgb,var(--c) 70%,#000)}
    #dsel .lv .bn svg{display:block;width:100%;height:100%;image-rendering:pixelated;transform:scale(1);transition:transform .6s ease}
    #dsel .lv.sel .bn svg{transform:scale(1.12)}
    #dsel .lv .bn::after{content:'';position:absolute;inset:0;pointer-events:none;
      background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 1px,transparent 1px 3px),linear-gradient(180deg,transparent 45%,rgba(8,10,18,.85))}
    #dsel .lv .ic{position:absolute;left:10px;bottom:8px;z-index:2;width:34px;height:34px;color:var(--c);filter:drop-shadow(0 0 6px var(--c)) drop-shadow(0 2px 0 #000)}
    #dsel .ic svg{display:block;width:100%;height:100%}
    #dsel .lv .kb{position:absolute;right:8px;top:8px;z-index:2;min-width:22px;height:22px;padding:0 4px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;
      font:700 12px ui-monospace,monospace;color:#cdd3e6;background:rgba(5,7,12,.78);border:1px solid rgba(255,255,255,.35);border-radius:3px}
    #dsel .lv .ck{position:absolute;left:8px;top:8px;z-index:2;padding:2px 7px;font-size:10px;letter-spacing:2px;font-weight:700;color:#06080e;background:var(--c);border-radius:3px;
      box-shadow:0 0 12px var(--c);opacity:0;transform:translateY(-6px);transition:.18s}
    #dsel .lv.sel .ck{opacity:1;transform:none}
    #dsel .lv .tx{padding:10px 12px 12px}
    #dsel .lv .tx em{display:block;font-style:normal;font-size:10px;letter-spacing:3px;color:var(--c);opacity:.9}
    #dsel .lv .tx b{display:block;margin:2px 0 4px;font-size:18px;letter-spacing:1px;color:#fff;text-shadow:0 0 10px color-mix(in srgb,var(--c) 60%,transparent)}
    #dsel .lv .tx small{display:block;min-height:46px;font-size:11.5px;line-height:1.4;color:#aeb6cf}
    #dsel .tg{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
    #dsel .tg u{text-decoration:none;font-size:9.5px;letter-spacing:1px;padding:2px 6px;border-radius:3px;color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);border:1px solid color-mix(in srgb,var(--c) 45%,transparent)}
    /* kartu kesulitan */
    #dsel .df{padding:12px 14px 12px;text-align:left}
    #dsel .df::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--c);box-shadow:0 0 12px var(--c)}
    #dsel .df .ic{position:absolute;right:12px;top:10px;width:30px;height:30px;color:var(--c);opacity:.9;filter:drop-shadow(0 0 6px var(--c))}
    #dsel .df>b{display:block;font-size:20px;letter-spacing:3px;color:var(--c);text-shadow:0 0 10px color-mix(in srgb,var(--c) 55%,transparent);margin-bottom:8px}
    #dsel .df .st{display:grid;gap:5px;margin-bottom:8px;font-size:10px;letter-spacing:2px;color:#9aa4c0}
    #dsel .df .st>div{display:flex;align-items:center;justify-content:space-between}
    #dsel .sg{display:inline-flex;gap:3px}
    #dsel .sg i{display:block;width:16px;height:8px;background:rgba(255,255,255,.1);transform:skewX(-18deg);transition:background .2s,box-shadow .2s}
    #dsel .sg i.on{background:var(--c);box-shadow:0 0 6px var(--c)}
    #dsel .df small{display:block;font-size:11px;line-height:1.4;color:#aeb6cf}
    /* ringkasan & tombol */
    #dsel .sum{display:flex;align-items:center;justify-content:center;gap:14px;margin:16px 0 12px;padding:9px 14px;font-size:15px;font-weight:700;letter-spacing:3px;
      background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);border-radius:4px}
    #dsel .sum i{display:block;width:8px;height:8px;background:var(--th);transform:rotate(45deg);box-shadow:0 0 8px var(--th)}
    #dsel .go{display:flex;justify-content:center;gap:14px}
    #dsel .go button{cursor:pointer;min-width:150px;padding:11px 22px;font:700 15px system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;letter-spacing:1px;color:#cdd3e6;
      background:#141a2c;border:2px solid rgba(255,255,255,.28);border-radius:4px;transition:transform .14s,filter .14s,box-shadow .14s}
    #dsel .go button:hover{transform:translateY(-2px);filter:brightness(1.25)}
    #dsel .go button:active{transform:translateY(1px)}
    #dsel .go button.p{color:#06080e;background:linear-gradient(180deg,color-mix(in srgb,var(--th) 100%,#fff 25%),var(--th));border-color:#fff;min-width:210px;font-size:18px;letter-spacing:1.5px;text-shadow:none;
      animation:dsPulse 1.8s ease-in-out infinite}
    @keyframes dsPulse{50%{box-shadow:0 0 0 3px color-mix(in srgb,var(--th) 40%,transparent),0 0 26px var(--th)}}
    #dsel .hint{margin-top:12px;text-align:center;font-size:10.5px;letter-spacing:1.5px;color:#7d86a3}
    #dsel .cd:focus-visible,#dsel .go button:focus-visible{outline:2px dashed #fff;outline-offset:2px}
    @media(max-width:760px){
      #dsel{align-items:flex-start}
      #dsel .bx{padding:14px 12px 10px}
      #dsel h2{font-size:19px;letter-spacing:4px}
      #dsel .row{grid-template-columns:1fr;gap:8px}
      #dsel .lv{display:grid;grid-template-columns:116px 1fr}
      #dsel .lv .bn{height:auto;min-height:104px;border-bottom:0;border-right:2px solid color-mix(in srgb,var(--c) 70%,#000)}
      #dsel .lv .ic{width:26px;height:26px}
      #dsel .lv .tx{padding:8px 10px}#dsel .lv .tx small{min-height:0;font-size:11px}
      #dsel .lv.sel,#dsel .cd.sel{transform:none}
      #dsel .hint{display:none}
      #dsel .go button{min-width:0;flex:1}#dsel .go button.p{min-width:0;flex:2}
    }
    @media(max-height:600px) and (min-width:761px){#dsel .lv .bn{height:84px}#dsel .lv .tx small{min-height:0}}
    @media(prefers-reduced-motion:reduce){#dsel::before,#dsel .bx,#dsel .go button.p{animation:none}#dsel .cd,#dsel .lv .bn svg{transition:none}}`;
  document.head.appendChild(dcss);
  const el = document.createElement('div');
  el.id = 'dsel';
  const dpct = v => Math.round(v * 100) + '%', dmul = v => '\u00D7' + (+v.toFixed(2));
  el.innerHTML = '<div class="bx"><h2>PILIH DUNGEON</h2>'
    + '<div class="sub sl">LEVEL</div><div class="row lvr" role="radiogroup" aria-label="Level">'
    + LV.map(([n, nm, ds, ic, tg]) => '<div class="cd lv l' + n + '" data-l="' + n + '" role="radio" aria-checked="false" tabindex="0"><div class="bn">' + SCN[n] + '<i class="ic">' + IC[ic] + '</i><span class="kb">' + n + '</span><span class="ck">\u2714 DIPILIH</span></div><div class="tx"><em>LEVEL ' + n + '</em><b>' + nm + '</b><small>' + ds + '</small><div class="tg">' + tg.map(t => '<u>' + t + '</u>').join('') + '</div></div></div>').join('')
    + '</div><div class="sub">KESULITAN</div><div class="row" role="radiogroup" aria-label="Kesulitan">'
    + DF.map((d, i) => '<div class="cd df" data-d="' + i + '" role="radio" aria-checked="false" tabindex="0" style="--c:' + d.c + '"><i class="ic">' + DIC[i] + '</i><b>' + d.n + '</b>'
      + '<div class="st"><div>JUMLAH' + seg(d.cnt) + '</div><div>NYAWA' + seg(d.hp) + '</div><div>BAHAYA' + seg(d.dmg) + '</div></div>'
      + '<small>' + d.d + '</small>'
      + '<div class="tg"><u>HP MUSUH ' + dmul(d.hp) + '</u><u>DAMAGE ' + dmul(d.dmg) + '</u><u>HEAL ' + dpct(DFX[i].heal) + '</u><u>ULT ' + dpct(DFX[i].ult) + '</u></div></div>').join('')
    + '</div><div class="sum" id="dsSum"></div><div class="go"><button id="dsBack">BATAL</button><button class="p" id="dsGo">MASUK \u25B6</button></div>'
    + '<div class="hint">1 2 3 LEVEL \u00B7 \u2190 \u2192 KESULITAN \u00B7 ENTER MASUK \u00B7 ESC BATAL</div></div>';
  document.body.appendChild(el);
  const LNM = ['', 'Ancient Halls', 'Lava Depths', 'Frost Crypt'], LCC = ['', '#8fe8a0', '#ff8a3a', '#8fe0ff'], sumEl = el.querySelector('#dsSum');
  window.dsSum = () => {
    let en = 0; try {
      en = ESEL;
    }
    catch (e) { } el.dataset.th = en ? 'e' : LVL; sumEl.innerHTML = '<span style="color:' + (en ? '#ffd98a' : LCC[LVL]) + '">' + (en ? 'ENDLESS · tema acak' : LNM[LVL]) + '</span><i></i><span style="color:' + DF[DIFF].c + '">' + DF[DIFF].n + '</span>';
  };
  const sync = () => { el.querySelectorAll('[data-l]').forEach(n => { const on = +n.dataset.l == LVL; n.classList.toggle('sel', on); n.setAttribute('aria-checked', on); }); el.querySelectorAll('[data-d]').forEach(n => { const on = +n.dataset.d == DIFF; n.classList.toggle('sel', on); n.setAttribute('aria-checked', on); }); window.dsSum(); };
  el.addEventListener('click', e => {
    const c = e.target.closest('.cd'); if (!c)
      return; if (c.dataset.l)
      LVL = +c.dataset.l; if (c.dataset.d)
      DIFF = +c.dataset.d; try { SFX.blip(c.dataset.l ? 360 + LVL * 90 : 300 + DIFF * 110); } catch (e) { } sync();
  });
  const clr = () => {
    try {
      Object.keys(K).forEach(k => K[k] = 0);
      M.d = 0;
      for (const k in P)
        delete P[k];
      touchJoy.active = false;
      touchAttack.active = false;
    }
    catch (e) { }
  };
  const close = () => { el.classList.remove('on'); dselOn = false; clr(); playing = true; cv.focus(); };
  window.openDungeonSelect = () => { clr(); playing = false; dselOn = true; sync(); el.classList.add('on'); };
  document.getElementById('dsBack').onclick = () => { p.y = 70; p.vx = p.vy = 0; close(); };
  document.getElementById('dsGo').onclick = () => { close(); enterDungeon(); msg((LVL == 3 ? 'Level 3: Frost Crypt' : LVL == 2 ? 'Level 2: Lava Depths' : 'Level 1: Ancient Halls') + ' [' + DF[DIFF].n + '] — Gelombang 1 dimulai!'); };
  document.addEventListener('keydown', e => {
    if (!dselOn)
      return;
    e.stopPropagation();
    e.preventDefault();
    if (e.code == 'Escape')
      document.getElementById('dsBack').click();
    else if (e.code == 'Enter' || e.code == 'Space')
      document.getElementById('dsGo').click();
    else if (e.code == 'Digit1') {
      LVL = 1; try { SFX.blip(450); } catch (x) { }
      sync();
    }
    else if (e.code == 'Digit2') {
      LVL = 2; try { SFX.blip(540); } catch (x) { }
      sync();
    }
    else if (e.code == 'Digit3') {
      LVL = 3; try { SFX.blip(630); } catch (x) { }
      sync();
    }
    else if (e.code == 'ArrowLeft' || e.code == 'KeyA') {
      DIFF = Math.max(0, DIFF - 1); try { SFX.blip(300 + DIFF * 110); } catch (x) { }
      sync();
    }
    else if (e.code == 'ArrowRight' || e.code == 'KeyD') {
      DIFF = Math.min(2, DIFF + 1); try { SFX.blip(300 + DIFF * 110); } catch (x) { }
      sync();
    }
  }, true);
})();
/* ===== KITAB STATUS (buku sihir) - hanya bisa dibuka lewat Ketua Orin di lobby ===== */
(function () {
  const ST = [
    ['VIT', 'Vitalitas', 'Ketahanan raga. Menambah HP maksimum.', '\u16DF', 'Digit6'],
    ['STR', 'Kekuatan', 'Tenaga otot. Menguatkan Pedang, Tombak & Belati.', '\u16A6', 'Digit7'],
    ['DEF', 'Pertahanan', 'Perisai jiwa. Meredam damage yang diterima.', '\u16C9', 'Digit8'],
    [
      'AGI', 'Kelincahan', 'Gerak gesit. Menambah kecepatan lari; menguatkan Busur, Tombak & Belati.', '\u16A8', 'Digit9'
    ],
    ['INT', 'Kebijaksanaan', 'Daya sihir. Menguatkan serangan Tongkat.', '\u16D7', 'Digit0']
  ];
  const css = document.createElement('style');
  css.textContent = `
      #sbook{position:fixed;inset:0;z-index:300;display:none;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 45%,rgba(60,30,80,.8),rgba(0,0,0,.94));font-family:Georgia,'Palatino Linotype',Palatino,serif;overflow:auto;padding:10px;box-sizing:border-box}
      #sbook.on{display:flex}
      #sbook .bk{position:relative;width:min(940px,100%);margin:auto;display:grid;grid-template-columns:1fr 16px 1fr;border-radius:14px;padding:16px;background:linear-gradient(145deg,#4a2a14,#2a140a 55%,#3b1f0f);box-shadow:0 0 0 2px #8a6a2a,0 0 0 5px #2a140a,0 18px 60px #000,0 0 90px rgba(170,90,255,.35);animation:sbOpen .55s cubic-bezier(.2,.9,.25,1.1)}
      @keyframes sbOpen{from{transform:perspective(1100px) rotateX(24deg) scale(.82);opacity:0}to{transform:none;opacity:1}}
      #sbook .bk::before,#sbook .bk::after{content:'\u2726';position:absolute;color:#e0b84a;font-size:20px;text-shadow:0 0 8px #ffd34d}
      #sbook .bk::before{left:6px;top:2px}#sbook .bk::after{right:6px;bottom:2px}
      #sbook .pg{position:relative;min-height:470px;padding:22px 26px 18px;color:#3a2410;background:radial-gradient(ellipse at 50% 40%,#f6e7c1,#e6cf9c 70%,#d2b57a);box-shadow:inset 0 0 40px rgba(110,70,20,.45)}
      #sbook .pg.l{border-radius:8px 0 0 8px;box-shadow:inset -22px 0 26px -16px rgba(70,35,10,.7),inset 0 0 40px rgba(110,70,20,.4);border-right:0}
      #sbook .pg.r{border-radius:0 8px 8px 0;box-shadow:inset 22px 0 26px -16px rgba(70,35,10,.7),inset 0 0 40px rgba(110,70,20,.4)}
      #sbook .sp{background:linear-gradient(90deg,#1a0c06,#6b4423 50%,#1a0c06);box-shadow:0 0 8px #000}
      #sbook h2{margin:0;text-align:center;font-size:24px;letter-spacing:5px;color:#4a1f66;text-shadow:0 1px 0 #f9efd2,0 0 12px rgba(160,80,230,.35);font-weight:700}
      #sbook .sub{text-align:center;font-style:italic;font-size:12px;color:#7a5a30;margin:2px 0 6px}
      #sbook .orn{height:12px;margin:4px auto 8px;width:80%;background:linear-gradient(90deg,transparent,#a8782a,transparent);clip-path:polygon(0 45%,46% 45%,50% 0,54% 45%,100% 45%,100% 55%,54% 55%,50% 100%,46% 55%,0 55%)}
      #sbook canvas{display:block;margin:0 auto;max-width:100%}
      #sbook .lv{display:flex;justify-content:space-between;font-size:13px;margin:6px 6px 2px;color:#5a3a18}
      #sbook .xp{height:7px;margin:0 6px 10px;border-radius:5px;background:#c8ab72;box-shadow:inset 0 1px 3px rgba(60,30,0,.6);overflow:hidden}
      #sbook .xp i{display:block;height:100%;background:linear-gradient(90deg,#7a3fb0,#c58bff);box-shadow:0 0 8px #b070ff}
      #sbook .orb{margin:6px auto 0;width:92px;height:92px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;background:radial-gradient(circle at 35% 30%,#e9c8ff,#8a3fd0 55%,#3a1166);box-shadow:0 0 0 3px #c9a23a,0 0 22px rgba(170,90,255,.8),inset 0 0 14px rgba(0,0,0,.45);animation:sbOrb 2.4s ease-in-out infinite}
      #sbook .orb.z{filter:grayscale(.85) brightness(.8);animation:none}
      @keyframes sbOrb{50%{box-shadow:0 0 0 3px #e8c24a,0 0 36px rgba(190,110,255,1),inset 0 0 14px rgba(0,0,0,.45)}}
      #sbook .orb b{font-size:30px;line-height:1;text-shadow:0 0 10px #fff}#sbook .orb small{font-size:9px;letter-spacing:1.5px;opacity:.9}
      #sbook .row{display:grid;grid-template-columns:44px 1fr 38px 40px;gap:10px;align-items:center;padding:9px 6px;border-bottom:1px dashed rgba(120,80,30,.5)}
      #sbook .ri{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:23px;color:#f6e7c1;background:radial-gradient(circle at 35% 30%,#8a4fc0,#3a1166);box-shadow:0 0 0 2px #c9a23a,inset 0 0 8px #000;text-shadow:0 0 8px #e9c8ff}
      #sbook .rn b{display:block;font-size:15px;letter-spacing:1px;color:#3a1a56}#sbook .rn em{display:block;font-size:11px;line-height:1.25;color:#6a4a24}
      #sbook .rv{font-size:24px;font-weight:700;text-align:center;color:#2a1408}
      #sbook .rv.bump{animation:sbBump .5s ease}
      @keyframes sbBump{30%{transform:scale(1.55);color:#8a2fd0;text-shadow:0 0 14px #c58bff}}
      #sbook .ad{width:36px;height:36px;border-radius:50%;border:0;cursor:pointer;font:700 22px/1 Georgia,serif;color:#fff;background:radial-gradient(circle at 35% 30%,#f0d070,#b8860b);box-shadow:0 0 0 2px #5a3a10,0 2px 6px rgba(0,0,0,.5);transition:transform .12s}
      #sbook .ad:hover:not(:disabled){transform:scale(1.15);box-shadow:0 0 0 2px #5a3a10,0 0 14px #ffd34d}#sbook .ad:active:not(:disabled){transform:scale(.92)}
      #sbook .ad:disabled{filter:grayscale(1) brightness(.75);cursor:not-allowed;opacity:.55}
      #sbook .ct{display:grid;grid-template-columns:1fr auto;gap:2px 10px;margin:10px 6px 0;font-size:12.5px;color:#4a2e12}#sbook .ct span:nth-child(even){font-weight:700;color:#3a1a56;text-align:right}
      #sbook .ctt{margin:12px 6px 0;font-size:11px;letter-spacing:3px;text-align:center;color:#7a5a30}
      #sbook .ft{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:11px;color:#7a5a30;font-style:italic}
      #sbook .cl{border:0;cursor:pointer;padding:6px 14px;border-radius:6px;font:700 12px Georgia,serif;letter-spacing:1px;color:#f6e7c1;background:linear-gradient(#6b3f9a,#3a1166);box-shadow:0 0 0 2px #c9a23a}
      #sbook .cl:hover{filter:brightness(1.2)}
      #sbook .spk{position:absolute;pointer-events:none;font-size:14px;color:#c58bff;text-shadow:0 0 8px #fff;animation:sbSp .8s ease-out forwards}
      @keyframes sbSp{to{transform:translate(var(--dx),var(--dy)) scale(.3);opacity:0}}
      @media(max-width:720px){#sbook .bk{grid-template-columns:1fr;padding:10px}#sbook .sp{display:none}#sbook .pg.l,#sbook .pg.r{border-radius:8px;min-height:0;border:0;margin-bottom:6px}#sbook h2{font-size:19px;letter-spacing:3px}}`;
  document.head.appendChild(css);
  const el = document.createElement('div');
  el.id = 'sbook';
  el.innerHTML = '<div class="bk"><div class="pg l"><h2>KITAB STATUS</h2><div class="sub">Catatan jiwa sang pahlawan \u2014 dijaga Ketua Orin</div><div class="orn"></div>'
    + '<canvas id="sbCv" width="300" height="270"></canvas><div class="lv"><span id="sbLv"></span><span id="sbXp"></span></div><div class="xp"><i id="sbXb"></i></div>'
    + '<div class="orb" id="sbOrb"><b id="sbPts">0</b><small>POIN JIWA</small></div></div>'
    + '<div class="sp"></div><div class="pg r"><h2>PENYALURAN</h2><div class="sub">Salurkan poin jiwa ke dalam lima rune</div><div class="orn"></div>'
    + ST.map(x => '<div class="row" data-s="' + x[0] + '"><div class="ri">' + x[3] + '</div><div class="rn"><b>' + x[1] + ' <small style="font-weight:400;color:#8a6a40">' + x[0] + '</small></b><em>' + x[2] + '</em></div><div class="rv" id="sbV' + x[0] + '">5</div><button class="ad" data-s="' + x[0] + '" title="Tambah ' + x[0] + ' [' + x[4].replace('Digit', '') + ']">+</button></div>').join('')
    + '<div class="ctt">\u2726 CATATAN ARSIP \u2726</div><div class="ct" id="sbCt"></div>'
    + '<div class="ft"><span>Tombol 6\u20130 menambah \u00B7 ESC / G menutup</span><button class="cl" id="sbClose">TUTUP KITAB</button></div></div></div>';
  document.body.appendChild(el);
  const $ = id => document.getElementById(id), cvs = $('sbCv'), cx = cvs.getContext('2d'), disp = { VIT: 5, STR: 5, DEF: 5, AGI: 5, INT: 5 };
  let bookOn = false, raf = 0;
  const clr = () => {
    try {
      Object.keys(K).forEach(k => K[k] = 0);
      M.d = 0;
      for (const k in P)
        delete P[k];
      touchJoy.active = false;
      touchAttack.active = false;
    }
    catch (e) { }
  };
  function refresh() {
    $('sbPts').textContent = pts;
    $('sbOrb').classList.toggle('z', pts <= 0);
    $('sbLv').textContent = 'Tingkat ' + lvl;
    $('sbXp').textContent = 'EXP ' + Math.floor(exp) + ' / ' + (lvl * 40);
    $('sbXb').style.width = Math.min(100, exp / (lvl * 40) * 100) + '%';
    ST.forEach(x => { $('sbV' + x[0]).textContent = A[x[0]]; });
    el.querySelectorAll('.ad').forEach(b => b.disabled = pts <= 0);
    const w = WP[wi], wm = 1 + (w.sc.reduce((q, k) => q + A[k], 0) / w.sc.length - 5) * .08;
    $('sbCt').innerHTML = [
      ['HP Maksimum', mhp()], ['Redaman Damage', Math.round((1 - 100 / (100 + A.DEF * 4)) * 100) + '%'], ['Kecepatan Gerak', Math.round((1 + (A.AGI - 5) * .015) * 100) + '%'], ['Kekuatan ' + w.n, '\u00D7' + wm.toFixed(2)]
    ].map(r => '<span>' + r[0] + '</span><span>' + r[1] + '</span>').join('');
  }
  function sparkle(btn) {
    const pg = btn.closest('.pg'), r = btn.getBoundingClientRect(), q = pg.getBoundingClientRect(); for (let i = 0; i < 9; i++) {
      const sp = document.createElement('span');
      sp.className = 'spk';
      sp.textContent = ['\u2726', '\u2727', '\u2736'][i % 3];
      sp.style.left = (r.left - q.left + r.width / 2) + 'px';
      sp.style.top = (r.top - q.top + r.height / 2) + 'px';
      sp.style.setProperty('--dx', ((Math.random() - .5) * 90) + 'px');
      sp.style.setProperty('--dy', (-20 - Math.random() * 60) + 'px');
      pg.appendChild(sp);
      setTimeout(() => sp.remove(), 850);
    }
  }
  function add(s, btn) {
    if (pts <= 0)
      return;
    try {
      SFX.point();
    }
    catch (e) { }
    A[s]++;
    pts--;
    if (s == 'VIT')
      p.hp += 8;
    refresh();
    const v = $('sbV' + s);
    v.classList.remove('bump');
    void v.offsetWidth;
    v.classList.add('bump');
    sparkle(btn || el.querySelector('.ad[data-s=' + s + ']'));
  }
  el.querySelectorAll('.ad').forEach(b => b.addEventListener('click', e => { e.preventDefault(); add(b.dataset.s, b); }));
  function draw(now) {
    if (!bookOn)
      return;
    raf = requestAnimationFrame(draw);
    const t0 = now / 1000, W2 = 300, H2 = 270, X = W2 / 2, Y = H2 / 2 + 2;
    cx.clearRect(0, 0, W2, H2);
    ST.forEach(x => { disp[x[0]] += (A[x[0]] - disp[x[0]]) * .12; });
    cx.save();
    cx.translate(X, Y);
    // lingkar sihir berputar
    cx.strokeStyle = 'rgba(120,70,20,.5)';
    cx.lineWidth = 1.5;
    [118, 108].forEach(r => { cx.beginPath(); cx.arc(0, 0, r, 0, 7); cx.stroke(); });
    cx.save();
    cx.rotate(t0 * .25);
    cx.strokeStyle = 'rgba(122,47,160,.55)';
    for (let i = 0; i < 36; i++) {
      cx.rotate(.17453);
      cx.beginPath();
      cx.moveTo(108, 0);
      cx.lineTo(i % 3 ? 114 : 118, 0);
      cx.stroke();
    }
    cx.restore();
    cx.save();
    cx.rotate(-t0 * .35);
    cx.strokeStyle = 'rgba(160,100,30,.35)';
    cx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i * 1.0472;
      cx.lineTo(Math.cos(a) * 100, Math.sin(a) * 100);
    }
    cx.closePath();
    cx.stroke();
    cx.restore();
    const mx = Math.max(12, ...ST.map(x => A[x[0]])) + 2, R5 = 86, pt = (i, v) => { const a = -1.5708 + i * 1.2566, r = R5 * v / mx; return [Math.cos(a) * r, Math.sin(a) * r]; };
    cx.strokeStyle = 'rgba(100,60,20,.4)';
    cx.lineWidth = 1;
    for (let l = 1; l <= 4; l++) {
      cx.beginPath();
      for (let i = 0; i < 5; i++) {
        const q = pt(i, mx * l / 4);
        i ? cx.lineTo(q[0], q[1]) : cx.moveTo(q[0], q[1]);
      }
      cx.closePath();
      cx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const q = pt(i, mx);
      cx.beginPath();
      cx.moveTo(0, 0);
      cx.lineTo(q[0], q[1]);
      cx.stroke();
    }
    const pg = cx.createRadialGradient(0, 0, 4, 0, 0, R5);
    pg.addColorStop(0, 'rgba(210,150,255,.55)');
    pg.addColorStop(1, 'rgba(110,40,170,.35)');
    cx.fillStyle = pg;
    cx.strokeStyle = '#6a2a9a';
    cx.lineWidth = 2;
    cx.beginPath();
    ST.forEach((x, i) => { const q = pt(i, disp[x[0]]); i ? cx.lineTo(q[0], q[1]) : cx.moveTo(q[0], q[1]); });
    cx.closePath();
    cx.fill();
    cx.stroke();
    cx.font = 'bold 12px Georgia,serif';
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    ST.forEach((x, i) => { const q = pt(i, disp[x[0]]), g2 = .6 + .4 * Math.sin(t0 * 3 + i); cx.fillStyle = 'rgba(255,230,140,' + g2 + ')'; cx.beginPath(); cx.arc(q[0], q[1], 4.2, 0, 7); cx.fill(); cx.strokeStyle = '#6a2a9a'; cx.lineWidth = 1.2; cx.stroke(); const l = pt(i, mx * 1.2); cx.fillStyle = '#3a1a56'; cx.fillText(x[0], l[0], l[1] - 6); cx.fillStyle = '#8a2fd0'; cx.fillText(A[x[0]], l[0], l[1] + 8); });
    cx.restore();
  }
  function close() {
    if (!bookOn)
      return; bookOn = false; cancelAnimationFrame(raf); el.classList.remove('on'); clr(); playing = true; try {
        cv.focus();
      }
    catch (e) { }
  }
  window.openStatBook = function () {
    if (!lobby) {
      msg('Status hanya bisa dinaikkan di lobby lewat Ketua Orin');
      return;
    } clr(); playing = false; bookOn = true; ST.forEach(x => disp[x[0]] = 5); refresh(); el.classList.add('on'); cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); try {
      SFX.pickup();
    }
    catch (e) { }
  };
  $('sbClose').addEventListener('click', close);
  el.addEventListener('pointerdown', e => {
    if (e.target === el)
      close();
  });
  document.addEventListener('keydown', e => {
    if (!bookOn)
      return;
    e.stopPropagation();
    e.preventDefault();
    if (e.code == 'Escape' || e.code == 'KeyG' || e.code == 'Enter')
      close();
    else {
      const x = ST.find(q => q[4] == e.code);
      if (x)
        add(x[0]);
    }
  }, true);
})();
/* ===== Efek kesulitan ===== */
const _hurtD = hurt;
hurt = function (d) { return _hurtD(lobby ? d : d * DF[DIFF].dmg); };
const _spawnD = spawn;
spawn = function () {
  _spawnD();
  if (lobby || room > 1 || !es.length || es[0].k == 'dummy')
    return;
  const d = DF[DIFF];
  if (d.cnt < 1)
    es = es.slice(0, Math.max(2, Math.round(es.length * d.cnt)));
  else if (d.cnt > 1) {
    const n = Math.round(es.length * (d.cnt - 1));
    for (let j = 0, a = 0; j < n && a < 300; a++) {
      const x = 200 + R() * 560, y = 50 + R() * 380;
      if (!blk(x, y, 9)) {
        const e = mk(['slime', 'skel', 'mage'][j % 3], x, y);
        e.sd = es.length * .14;
        e.st = 1.1 + e.sd;
        e.sw = e.st;
        e.sx = 0;
        es.push(e);
        j++;
      }
    }
  }
  es.forEach(e => { e.hp = e.mhp = Math.round(e.hp * d.hp * (LVL == 2 ? 1.15 : LVL == 3 ? 1.2 : 1)); e.sp *= d.sp; });
};
/* ===== Tema Lava (Level 2) ===== */
let LB = null, LP = [[], []];
function lavaBuild() {
  const mkPools = (ws, seed) => {
    let sd = seed;
    const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, out = [];
    for (let a = 0; a < 500 && out.length < 5; a++) {
      const w = 56 + r() * 30 | 0, h = 36 + r() * 18 | 0, x = 150 + r() * (DW - 300 - w) | 0, y = 60 + r() * (DH - 120 - h) | 0;
      const bad = ws.some(q => x + w + 18 > q[0] && x - 18 < q[0] + q[2] && y + h + 18 > q[1] && y - 18 < q[1] + q[3]) || out.some(q => x + w + 30 > q[0] && x - 30 < q[0] + q[2] && y + h + 30 > q[1] && y - 30 < q[1] + q[3]);
      if (!bad)
        out.push([x, y, w, h]);
    }
    return out;
  };
  const mkBg = (srcC, pools, seed) => {
    const c = document.createElement('canvas');
    c.width = DW;
    c.height = DH;
    const b = c.getContext('2d');
    b.drawImage(srcC, 0, 0);
    b.globalCompositeOperation = 'multiply';
    b.fillStyle = '#d9604a';
    b.fillRect(0, 0, DW, DH);
    b.globalCompositeOperation = 'source-over';
    b.fillStyle = 'rgba(40,6,0,.28)';
    b.fillRect(0, 0, DW, DH);
    let sd = seed;
    const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
    b.lineCap = 'round';
    b.lineJoin = 'round';
    for (let i = 0; i < 16; i++) {
      let x = 40 + r() * (DW - 80), y = 40 + r() * (DH - 80);
      b.beginPath();
      b.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (r() - .5) * 60;
        y += (r() - .5) * 60;
        b.lineTo(x, y);
      }
      b.strokeStyle = 'rgba(255,90,20,.35)';
      b.lineWidth = 3;
      b.stroke();
      b.strokeStyle = 'rgba(255,200,80,.8)';
      b.lineWidth = 1;
      b.stroke();
    }
    pools.forEach(([x, y, w, h]) => {
      b.fillStyle = '#1b0805'; b.fillRect(x - 4, y - 4, w + 8, h + 8); b.fillStyle = '#4a1608'; b.fillRect(x - 2, y - 2, w + 4, h + 4); const q = b.createLinearGradient(0, y, 0, y + h); q.addColorStop(0, '#ff9a2a'); q.addColorStop(1, '#d22a0a'); b.fillStyle = q; b.fillRect(x, y, w, h); b.fillStyle = 'rgba(255,230,120,.55)'; for (let i = 0; i < 5; i++)
        b.fillRect(x + 4 + r() * (w - 14), y + 4 + r() * (h - 8), 6, 2);
    });
    return c;
  };
  LP = [mkPools(W0, 3), mkPools(W1, 9)];
  LB = [mkBg(BG0, LP[0], 5), mkBg(BG1, LP[1], 8)];
}
const lavaOn = () => LVL == 2 && !lobby && room <= 2;
const _drawL = draw;
draw = function () {
  if (lavaOn()) {
    if (!LB)
      lavaBuild();
    if (room < 2)
      BG = LB[room];
  }
  _drawL();
  if (!lobby && room <= 2) {
    try {
      g.font = '9px monospace';
      txt('Level ' + LVL + ' · ' + DF[DIFF].n, W - 10, 58, LVL == 2 ? '#ff9a3c' : LVL == 3 ? '#8fe0ff' : DF[DIFF].c, 'right');
    }
    catch (e) { }
  }
};
const _envFxL = envFx;
envFx = function () {
  _envFxL();
  if (!lavaOn())
    return;
  g.save();
  g.globalCompositeOperation = 'lighter';
  (LP[room] || []).forEach(([x, y, w, h], i) => { const a = .16 + .1 * Math.sin(t * 3 + i * 1.7), q = g.createRadialGradient(x + w / 2, y + h / 2, 4, x + w / 2, y + h / 2, Math.max(w, h) * 1.1); q.addColorStop(0, 'rgba(255,120,40,' + a * 2 + ')'); q.addColorStop(1, 'rgba(255,60,10,0)'); g.fillStyle = q; g.fillRect(x - 40, y - 40, w + 80, h + 80); });
  g.restore();
};
const _updL = upd;
upd = function (dt) {
  _updL(dt);
  if (!lavaOn() || room > 1 || !p || p.dead > 0)
    return;
  const ps = LP[room] || [];
  if (R() < dt * 14 && ps.length) {
    const q = ps[R() * ps.length | 0];
    dp.push({
      k: 'p', x: q[0] + R() * q[2], y: q[1] + R() * q[3], vx: (R() - .5) * 14, vy: -22 - R() * 30, life: .7, max: .7, s: 1.5, c: R() < .5 ? '#ffb050' : '#ff5a1f'
    });
  }
  if (p.dod > 0)
    return;
  if (ps.some(([x, y, w, h]) => p.x + p.r > x && p.x - p.r < x + w && p.y + p.r > y && p.y - p.r < y + h)) {
    hurt(7);
    if (p.inv > .45)
      msg('🔥 Lava! Segera menjauh dari kolam lava!');
  }
};
/* ===== GRAFIK: PC/Laptop vs HP — HP memakai sprite cahaya ter-cache, batas partikel, culling & adaptif ===== */
(function () {
  var KEY = 'eoa_gfx', mode = 'auto';
  try {
    var s = localStorage.getItem(KEY);
    if (s === 'pc' || s === 'hp')
      mode = s;
  } catch (e) { }

  function isPhone() {
    try {
      return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (matchMedia('(hover: none) and (pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 900);
    } catch (e) {
      return false;
    }
  }
  /* sprite cahaya radial ter-cache: menggantikan createRadialGradient per partikel */
  var SPR = {};

  function spr(kind, rgb) {
    var key = kind + rgb, c = SPR[key];
    if (c)
      return c;
    c = SPR[key] = document.createElement('canvas');
    c.width = c.height = 64;
    var x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (kind == 'f') {
      gr.addColorStop(0, 'rgba(' + rgb + ',.9)');
      gr.addColorStop(.5, 'rgba(' + rgb + ',.45)');
      gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    } else if (kind == 'g') {
      gr.addColorStop(0, 'rgba(255,255,255,.9)');
      gr.addColorStop(.35, 'rgba(' + rgb + ',.6)');
      gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    } else {
      gr.addColorStop(0, 'rgba(' + rgb + ',1)');
      gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    }
    x.fillStyle = gr;
    x.fillRect(0, 0, 64, 64);
    return c;
  }

  function blit(c, x, y, r, a) { var sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = true; g.globalAlpha = a; g.drawImage(c, x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; g.imageSmoothingEnabled = sm; }
  window.glowBlit = function (x, y, r, rgb, a) { blit(spr('s', rgb), x, y, r, a); };
  var _flame = flame, _gflame = gflame, _smoke = smoke, _glFx = glFx, smk = 0;
  flame = function (q, k) {
    if (!GFX.hp)
      return _flame(q, k); var a = 1 - k, r = q.s * (1.3 - a * .7), c1 = a < .25 ? '255,235,255' : a < .55 ? '210,120,255' : '130,50,210'; g.save(); g.globalCompositeOperation = 'lighter'; blit(spr('f', c1), q.x, q.y, r * 2, k); g.restore();
  };
  gflame = function (q, k) {
    if (!GFX.hp)
      return _gflame(q, k); var a = 1 - k, r = q.s * (1.3 - a * .7), c1 = a < .25 ? '255,225,215' : a < .55 ? '255,90,70' : '200,25,25'; g.save(); g.globalCompositeOperation = 'lighter'; blit(spr('f', c1), q.x, q.y, r * 2, k); g.restore();
  };
  smoke = function (q, k) {
    if (!GFX.hp)
      return _smoke(q, k); if (GFX.lvl > 0 && (++smk & 1))
      return; blit(spr('s', q.c || '80,76,92'), q.x, q.y, q.s, k * .4);
  };
  glFx = function (f, k) {
    if (!GFX.hp)
      return _glFx(f, k); g.save(); g.globalCompositeOperation = 'lighter'; blit(spr('g', f.c), f.x, f.y, f.r, k); g.restore();
  };
  /* batas frame ~60fps untuk HP 90/120Hz agar baterai & suhu aman */
  var raf0 = window.requestAnimationFrame.bind(window), lastBy = new WeakMap();
  window.requestAnimationFrame = function (cb) {
    return raf0(function w(ts) {
      if (GFX.hp) {
        var l = lastBy.get(cb) || 0;
        if (ts - l < 15.5) {
          raf0(w);
          return;
        }
        lastBy.set(cb, ts);
      } cb(ts);
    });
  };
  /* penyesuaian otomatis: jika masih berat, kurangi partikel & asap ambient (tampilan utama tetap sama) */
  var _upd = upd, lastN = 0, ema = 16.7, slow = 0, fast = 0;
  upd = function (dt) {
    _upd(dt);
    var n = performance.now(), d = n - lastN;
    lastN = n;
    if (d > 250 || d <= 0)
      return;
    if (GFX.hp) {
      ema += (d - ema) * .05;
      GFX.capDp = GFX.lvl ? 130 : 220;
      if (dp.length > GFX.capDp)
        dp.splice(0, dp.length - GFX.capDp);
      if (ema > 23) {
        slow++;
        fast = 0;
      } else if (ema < 18) {
        fast++;
        slow = 0;
      } else
        slow = fast = 0;
      if (slow > 90 && GFX.lvl < 1) {
        GFX.lvl = 1;
        slow = 0;
      } else if (fast > 600 && GFX.lvl > 0) {
        GFX.lvl = 0;
        fast = 0;
      }
    } else {
      GFX.capDp = 1e9;
      GFX.lvl = 0;
    }
  };

  function apply(save) {
    GFX.hp = mode === 'hp' || (mode === 'auto' && isPhone());
    GFX.lvl = 0;
    ema = 16.7;
    slow = fast = 0;
    document.body.classList.toggle('gfx-hp', GFX.hp);
    var bs = document.querySelectorAll('.gfx-btn');
    for (var i = 0; i < bs.length; i++)
      bs[i].classList.toggle('on', bs[i].getAttribute('data-gfx') === mode);
    var o = document.getElementById('gfxOut');
    if (o)
      o.textContent = mode === 'auto' ? 'AUTO · ' + (GFX.hp ? 'HP' : 'PC') : mode === 'hp' ? 'HP / MOBILE' : 'PC / LAPTOP';
    if (save)
      try {
        localStorage.setItem(KEY, mode);
      } catch (e) { }
  }
  window.setGfx = function (m) { mode = m === 'pc' || m === 'hp' ? m : 'auto'; apply(true); };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.gfx-btn'); if (b)
      window.setGfx(b.getAttribute('data-gfx'));
  });
  apply(false);
})();
/* ===== MOBILE+: ikon skill, tombol besar, AUTO-LOCK musuh (khusus HP/tablet sentuh) ===== */
(function () {
  'use strict';
  var TOUCH = false;
  try {
    TOUCH = matchMedia('(hover: none) and (pointer: coarse)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  } catch (e) { }

  function S(b) { return '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + b + '</svg>'; }
  var F = 'fill="currentColor" fill-opacity=".28"', FS = 'fill="currentColor"';
  var IC = {
    /* senjata */
    sword: S('<g transform="rotate(45 16 16)"><path d="M16 2l3 4v14h-6V6z" fill="currentColor"/><path d="M9 20h14"/><path d="M16 20v6"/><circle cx="16" cy="28.5" r="1.6" fill="currentColor"/></g>'),
    spear: S('<g transform="rotate(45 16 16)"><path d="M16 1l4 8-4 5-4-5z" fill="currentColor"/><path d="M16 14v17"/><path d="M13 24l3 3 3-3"/></g>'),
    bow: S('<path d="M9 4c13 4 13 20 0 24"/><path d="M9 4v24"/><path d="M4 16h21"/><path d="M21 12l4 4-4 4"/>'),
    staff: S('<path d="M7 28L19 14"/><circle cx="22" cy="10" r="4"/><path d="M22 2v2M29 10h-2M27 5l-1 1M17 5l1 1"/>'),
    daggers: S('<g transform="rotate(45 16 16)"><path d="M16 3l2.5 3.500V16h-5V6.500z" fill="currentColor"/><path d="M12 16h8M16 16v6"/></g><g transform="rotate(-45 16 16)"><path d="M16 3l2.5 3.500V16h-5V6.500z" fill="currentColor"/><path d="M12 16h8M16 16v6"/></g>'),
    /* skill: bentuk meniru efek nyata skill di dalam game */
    /* Cross Slash: 2 tebasan menyilang + tebasan penutup besar */
    cross: S('<path d="M5 7Q16 10 27 25" stroke-width="3"/><path d="M27 7Q16 10 5 25" stroke-width="3"/><path d="M5 27Q16 29 27 27" stroke-width="1.6" opacity=".8"/><circle cx="16" cy="16" r="2" ' + FS + ' stroke="none"/><path d="M16 2v3M3 16h3M26 16h3" stroke-width="1.6"/>'),
    /* Whirlwind: pedang berputar 2x, cincin biru */
    spin: S('<path d="M16 3a13 13 0 0 1 13 13" stroke-width="2.400"/><path d="M29 16a13 13 0 0 1-13 13" stroke-width="2.400"/><path d="M16 29A13 13 0 0 1 3 16" opacity=".6"/><path d="M3 16A13 13 0 0 1 16 3" opacity=".6"/><path d="M25 6l5 2-2 5z" ' + FS + ' stroke="none"/><path d="M7 26l-5-2 2-5z" ' + FS + ' stroke="none"/><g transform="rotate(45 16 16)"><path d="M16 8l2 3v9h-4v-9z" ' + FS + ' stroke="none"/><path d="M12.500 20h7M16 20v4" stroke-width="1.800"/></g>'),
    /* Heaven Split: tebas ke bawah, tiang cahaya + cincin ledakan + pecahan */
    split: S('<path d="M12 2h8l-1 17h-6z" ' + F + '/><path d="M16 4v15" stroke-width="2.6"/><ellipse cx="16" cy="24" rx="5" ry="2.2"/><ellipse cx="16" cy="24" rx="10" ry="4.2" opacity=".75"/><ellipse cx="16" cy="24" rx="14" ry="6" opacity=".45"/><path d="M5 14l3 3M27 14l-3 3M9 9l2 3M23 9l-2 3" stroke-width="1.8"/>'),
    /* Aegis Rush: perisai naga menyeruduk dengan garis kecepatan */
    rush: S('<path d="M3 11h6M2 16h7M3 21h6" stroke-width="1.8" opacity=".8"/><path d="M13 5h11a3 3 0 0 1 3 3v8c0 6-5 9-9.500 11C13 25 10 22 10 16V8a3 3 0 0 1 3-3z" ' + F + '/><path d="M18.500 9v13M14 13h9" stroke-width="1.8"/><circle cx="18.500" cy="14.500" r="2" ' + FS + ' stroke="none"/><path d="M28 9l2 3M29 18l2-1" stroke-width="1.6"/>'),
    /* Bulwark Counter: perisai menahan lalu tusukan bertubi-tubi */
    shield: S('<path d="M5 6h8a2 2 0 0 1 2 2v13c0 4-3 6-6.500 7.500C5 27 3 25 3 21V8a2 2 0 0 1 2-2z" ' + F + '/><path d="M9 9v14" stroke-width="1.6"/><path d="M18 9h10M17 15h13M18 21h10" stroke-width="2.4"/><path d="M26 6l3 3-3 3M27 12l3 3-3 3M26 18l3 3-3 3" stroke-width="1.8"/>'),
    /* Wyrmfang Charge: terjang dengan tombak + deretan taring naga dari tanah */
    lance: S('<path d="M3 11h6M2 16h5" stroke-width="1.6" opacity=".7"/><path d="M6 20L22 8" stroke-width="2.6"/><path d="M21 3l9 3-3 9z" ' + FS + ' stroke="none"/><path d="M5 29l3-7 3 7z" ' + F + '/><path d="M12 29l3-9 3 9z" ' + F + '/><path d="M19 29l3-11 3 11z" ' + F + '/><path d="M3 29h27" stroke-width="1.6"/>'),
    /* Rapid Fire: 3 panah beruntun */
    rapid: S('<path d="M2 8h20" stroke-width="2.4"/><path d="M18 4l6 4-6 4" ' + FS + '/><path d="M2 8l-1-3M2 8l-1 3" stroke-width="1.6"/><path d="M5 16h22" stroke-width="2.4"/><path d="M23 12l6 4-6 4" ' + FS + '/><path d="M5 16l-1-3M5 16l-1 3" stroke-width="1.6"/><path d="M2 24h20" stroke-width="2.4"/><path d="M18 20l6 4-6 4" ' + FS + '/><path d="M2 24l-1-3M2 24l-1 3" stroke-width="1.6"/>'),
    /* Backflip Volley: salto mundur lalu 5 panah menyebar + 1 panah besar */
    backflip: S('<path d="M4 27C2 17 8 9 17 8" stroke-dasharray="1 3.500" stroke-width="2.4"/><path d="M13 3l6 5-6 5" stroke-width="2"/><path d="M19 12l10-6M20 16h11M19 20l10 6" stroke-width="1.8"/><path d="M26 3l3 3-4 1M28 13l3 3-3 3M26 25l3 1-1 4" stroke-width="1.4" opacity=".8"/><path d="M19 16h11" stroke-width="3.2"/>'),
    /* Arrow Rain: lingkaran target merah + hujan panah jatuh */
    rain: S('<ellipse cx="16" cy="25" rx="12" ry="4.500" ' + F + '/><ellipse cx="16" cy="25" rx="7" ry="2.500" opacity=".7"/><path d="M8 2v14M5 12l3 4 3-4" stroke-width="2"/><path d="M16 4v15M13 15l3 4 3-4" stroke-width="2.4"/><path d="M24 2v14M21 12l3 4 3-4" stroke-width="2"/><circle cx="16" cy="25" r="1.4" ' + FS + ' stroke="none"/>'),
    /* Arcane Burst: lingkaran rune sihir + ledakan di titik target */
    burst: S('<circle cx="16" cy="16" r="12.500" stroke-width="1.6" ' + F + '/><circle cx="16" cy="16" r="8" stroke-width="1.4" stroke-dasharray="2 2.500"/><path d="M16 5l2 5 5-2-2 5 5 2-5 2 2 5-5-2-2 5-2-5-5 2 2-5-5-2 5-2-2-5 5 2z" ' + FS + ' stroke="none" opacity=".9"/><circle cx="16" cy="16" r="2.200" fill="#fff" stroke="none"/>'),
    /* Blink Nova: bayangan tinggal + jejak teleport + nova bintang */
    nova: S('<circle cx="6" cy="16" r="3.600" stroke-dasharray="1.600 2.200" opacity=".8"/><path d="M11 16h4" stroke-width="2.200" stroke-dasharray="1.500 2.500"/><path d="M21 3l2.600 7.400L31 13l-7.400 2.600L21 23l-2.600-7.400L11 13l7.400-2.600z" ' + FS + ' stroke="none" transform="translate(-1 3)"/><circle cx="20" cy="16" r="3" fill="#fff" stroke="none"/><path d="M20 27v3M10 26l2 2M30 26l-2 2" stroke-width="1.600"/>'),
    /* Meteor Storm: beberapa meteor miring jatuh ke lingkaran sihir */
    meteor: S('<ellipse cx="14" cy="27" rx="12" ry="3.500" ' + F + '/><circle cx="21" cy="17" r="4.500" ' + FS + ' stroke="none"/><path d="M18 14L5 2M20 12L12 3M15 17L4 8" stroke-width="2.400"/><circle cx="9" cy="21" r="2.500" ' + FS + ' stroke="none"/><path d="M7 19L1 14M8 18l-2-6" stroke-width="1.800"/><circle cx="27" cy="25" r="1.800" ' + FS + ' stroke="none"/><path d="M26 23l-4-4" stroke-width="1.600"/>'),
    /* Shadow Dash: selinap lurus, 2 garis bayangan, lalu 2 tebasan pendek */
    dash: S('<path d="M2 8h9M1 14h10" stroke-width="1.800" opacity=".7"/><path d="M2 20h9" stroke-width="1.800" opacity=".7"/><path d="M12 16h13" stroke-width="2.800"/><path d="M22 9l8 7-8 7z" ' + FS + ' stroke="none"/><path d="M14 5q6 2 9 8M14 27q6-2 9-8" stroke-width="1.800" opacity=".85"/>'),
    /* Blade Burst: putaran lalu 10 bilah menembus melebar */
    blades: S('<circle cx="16" cy="16" r="4" ' + F + '/><path d="M16 12V2M19.500 13.500L26 6M20 16h10M19.500 18.500L26 26M16 20v10M12.500 18.500L6 26M12 16H2M12.500 13.500L6 6" stroke-width="2.200"/><path d="M13.500 5L16 1l2.500 4M5 13.500L1 16l4 2.500M27 13.500l4 2.500-4 2.500M13.500 27L16 31l2.500-4" stroke-width="1.600"/>'),
    /* Phantom Flurry: teleport menebas banyak musuh, tanda X + bayangan */
    flurry: S('<circle cx="6" cy="8" r="2.800" stroke-dasharray="1.500 2" opacity=".8"/><circle cx="6" cy="24" r="2.800" stroke-dasharray="1.500 2" opacity=".8"/><path d="M9 9l6 3M9 23l6-3" stroke-dasharray="1 2.500" stroke-width="1.600"/><path d="M15 4l12 10M27 4L15 14" stroke-width="2.800"/><path d="M15 18l12 10M27 18L15 28" stroke-width="2.800"/><path d="M18 11l6-3M18 25l6-3" stroke-width="1.400" opacity=".7"/>'),
    /* aksi lain */
    bolt: S('<path d="M18 3L7 18h8l-2 11 12-16h-8z" fill="currentColor"/>'),
    eye: S('<circle cx="16" cy="16" r="9"/><circle cx="16" cy="16" r="2.5" fill="currentColor"/><path d="M16 3v5M16 24v5M3 16h5M24 16h5"/>'),
    flask: S('<path d="M12 4h8M13 4v8L6 25a2.5 2.5 0 0 0 2.2 3.5h15.6A2.5 2.5 0 0 0 26 25L19 12V4"/><path d="M9 21h14"/>'),
    star: S('<path d="M16 2l4 10 10 4-10 4-4 10-4-10L2 16l10-4z" fill="currentColor"/>'),
    lock: S('<circle cx="16" cy="16" r="9"/><path d="M16 3v6M16 23v6M3 16h6M23 16h6"/><circle cx="16" cy="16" r="2" fill="currentColor"/>')
  };
  /* nama skill (Inggris) -> [ikon, nama pendek Indonesia] */
  var SKM = {
    'Cross Slash': ['cross', 'Tebas'], 'Whirlwind': ['spin', 'Putar'], 'Heaven Split': ['split', 'Belah'],
    'Aegis Rush': ['rush', 'Seruduk'], 'Bulwark Counter': ['shield', 'Tangkis'], 'Wyrmfang Charge': ['lance', 'Terjang'],
    'Rapid Fire': ['rapid', 'Panah'], 'Backflip Volley': ['backflip', 'Salto'], 'Arrow Rain': ['rain', 'Hujan'],
    'Arcane Burst': ['burst', 'Ledak'], 'Blink Nova': ['nova', 'Nova'], 'Meteor Storm': ['meteor', 'Meteor'],
    'Shadow Dash': ['dash', 'Selinap'], 'Blade Burst': ['blades', 'Sabet'], 'Phantom Flurry': ['flurry', 'Badai']
  };
  var WCOL = ['#8fc8ff', '#ffd479', '#8fe08a', '#c6a0ff', '#ff93a8']; /* warna cincin skill per senjata */
  var WICO = ['sword', 'spear', 'bow', 'staff', 'daggers'];

  function $(id) { return document.getElementById(id); }

  /* ---------- pasang ikon statis ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-ic]'), function (n) { n.innerHTML = IC[n.getAttribute('data-ic')] || ''; });
  Array.prototype.forEach.call(document.querySelectorAll('.mob-wpn-btn'), function (b, i) { b.innerHTML = '<i>' + (i + 1) + '</i>' + IC[WICO[i]]; });
  $('mobLockIco').innerHTML = IC.lock;
  var lastW = -1;

  function skin(w) {
    lastW = w;
    var set = SK[w];
    if (!set)
      return;
    for (var i = 0; i < 3; i++) {
      var q = set[i], m = SKM[q.n] || ['burst', q.n.slice(0, 7)], b = $('mobBtnSkill' + (i + 1));
      $('mobSk' + (i + 1) + 'Ico').innerHTML = IC[m[0]];
      $('mobSk' + (i + 1) + 'Lbl').textContent = m[1];
      b.style.setProperty('--ac', WCOL[w]);
      b.title = q.n + ' · cooldown ' + q.cd + ' dtk';
    }
    $('mobAtkIco').innerHTML = IC[WICO[w]];
    $('mobBtnAttack').style.setProperty('--ac', WCOL[w]);
  }

  /* ---------- cooldown: overlay + angka detik ---------- */
  var cache = {};

  function setTxt(id, v) {
    if (cache[id] !== v) {
      cache[id] = v;
      $(id).textContent = v;
    }
  }

  function cdUI(btn, cdId, numId, rem, max) {
    var on = rem > 0;
    btn.classList.toggle('cd', on);
    $(cdId).style.height = on ? Math.min(100, rem / max * 100) + '%' : '0%';
    setTxt(numId, on ? (rem >= 1 ? String(Math.ceil(rem)) : rem.toFixed(1)) : '');
  }

  /* ---------- AUTO-LOCK ---------- */
  var LK = { on: true, t: null, pin: 0 }, RANGE = 250;
  try {
    if (localStorage.getItem('eoa_lock') === '0')
      LK.on = false;
  } catch (e) { }

  function lockUI() {
    var b = $('mobBtnLock');
    b.classList.toggle('on', LK.on);
    $('mobLockTxt').textContent = LK.on ? 'AUTO' : 'MANUAL';
    b.title = LK.on ? 'Auto-lock aktif: serangan mengarah ke musuh terdekat' : 'Manual: geser tombol SERANG untuk membidik';
  }
  lockUI();
  $('mobBtnLock').addEventListener('pointerdown', function (e) {
    e.preventDefault();
    LK.on = !LK.on;
    LK.t = null;
    lockUI();
    try {
      localStorage.setItem('eoa_lock', LK.on ? '1' : '0');
    } catch (x) { }
    try {
      dn(p.x, p.y - 26, LK.on ? 'AUTO-LOCK' : 'BIDIK MANUAL', 0, LK.on ? '#ffb1a6' : '#ddd');
    } catch (x) { }
  });

  function valid(e) { return !!e && es.indexOf(e) >= 0 && !(e.sw > 0) && !e.dying && (e.k === 'dummy' || e.hp > 0); }

  function inView(e) {
    var vw = W / CAM_Z, vh = H / CAM_Z;
    return e.x > camX + 6 && e.x < camX + vw - 6 && e.y > camY + 6 && e.y < camY + vh - 6;
  }

  function pick() {
    var best = null, bd = 1e9, i, e, d;
    for (i = 0; i < es.length; i++) {
      e = es[i];
      if (!valid(e) || !inView(e))
        continue;
      d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    if (best && bd > RANGE)
      best = null;
    var c = LK.t; /* target lama dipertahankan agar tidak berpindah-pindah (histeresis) */
    if (valid(c) && inView(c)) {
      var dc = Math.hypot(c.x - p.x, c.y - p.y);
      if (dc <= RANGE + 40 && (t < LK.pin || !best || dc <= bd * 1.3 + 26))
        best = c;
    }
    LK.t = best;
    return best;
  }
  /* dipanggil dari upd(): true = arah serangan sudah diatur di sini */
  window.mobAim = function (manual) {
    if (!TOUCH || manual || !p)
      return false;
    var tg = LK.on ? pick() : null;
    if (tg) {
      p.face = Math.atan2(tg.y - p.y, tg.x - p.x);
      M.x = tg.x;
      M.y = tg.y;
    } else {
      LK.t = null;
      if (touchJoy.active && (Math.abs(touchJoy.x) > .1 || Math.abs(touchJoy.y) > .1))
        p.face = Math.atan2(touchJoy.y, touchJoy.x);
      M.x = p.x + Math.cos(p.face) * 120;
      M.y = p.y + Math.sin(p.face) * 120;
    }
    return true;
  };
  /* ketuk musuh di layar = pindah kunci ke musuh itu (bertahan 4 detik) */
  cv.addEventListener('pointerdown', function (ev) {
    if (!TOUCH || !LK.on || ev.pointerType === 'mouse' || !isMobile || !p)
      return;
    var r = cv.getBoundingClientRect();
    var wx = camX + ((ev.clientX - r.left) * W / r.width) / CAM_Z, wy = camY + ((ev.clientY - r.top) * H / r.height) / CAM_Z;
    var best = null, bd = 26, i, e, d;
    for (i = 0; i < es.length; i++) {
      e = es[i];
      if (!valid(e))
        continue;
      d = Math.hypot(e.x - wx, e.y - 4 - wy) - (e.r || 8);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    if (best) {
      LK.t = best;
      LK.pin = t + 4;
      ev.preventDefault();
      fx.push({ k: 'ring', x: best.x, y: best.y, r: 14, life: .25, max: .25, col: '#ffd34d' });
    }
  }, { passive: false });

  /* ---------- penanda target di kanvas ---------- */
  var _draw = draw;
  draw = function () {
    _draw();
    try {
      if (!TOUCH || !LK.on || !isMobile || !p || p.dead > 0)
        return;
      var e = LK.t;
      if (!valid(e))
        return;
      var sx = (e.x - camX) * CAM_Z, sy = (e.y - (e.ht || 12) * .5 - camY) * CAM_Z;
      var px = (p.x - camX) * CAM_Z, py = (p.y - camY) * CAM_Z;
      var R0 = Math.max(10, e.r || 8) * CAM_Z * .9 + 5 + Math.sin(t * 7) * 1.5;
      g.save();
      g.strokeStyle = 'rgba(255,211,77,.35)';
      g.lineWidth = 1.5;
      g.setLineDash([4, 6]);
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(sx, sy);
      g.stroke();
      g.setLineDash([]);
      g.translate(sx, sy);
      g.rotate(t * 1.3);
      g.strokeStyle = '#ff6b5b';
      g.lineWidth = 2.5;
      g.lineCap = 'round';
      for (var k = 0; k < 4; k++) {
        g.beginPath();
        g.arc(0, 0, R0, k * Math.PI / 2 + .15, k * Math.PI / 2 + Math.PI / 2 - .55);
        g.stroke();
      }
      g.rotate(-t * 1.3);
      g.fillStyle = '#ffd34d';
      g.beginPath();
      g.arc(0, 0, 2, 0, 7);
      g.fill();
      g.restore();
    } catch (x) { }
  };

  /* ---------- update tiap frame (setelah updateMobileUI bawaan) ---------- */
  var _u = window.updateMobileUI;
  window.updateMobileUI = function () {
    if (_u)
      _u();
    try {
      if (!isMobile || !p)
        return;
      if (wi !== lastW)
        skin(wi);
      $('mobBtnAttack').classList.toggle('charged', !!(M.d && p.hold >= .6));
      var set = SK[wi];
      for (var i = 0; i < 3; i++)
        cdUI($('mobBtnSkill' + (i + 1)), 'mobSk' + (i + 1) + 'Cd', 'mobSk' + (i + 1) + 'Num', p.sc[i], set[i].cd);
      cdUI($('mobBtnFocus'), 'mobFocusCd', 'mobFocusNum', p.ec, 30);
      $('mobBtnPotion').classList.toggle('cd', p.pot <= 0);
      setTxt('mobUltTxt', ULT >= ULT_MAX ? 'SIAP!' : Math.floor(ULT / ULT_MAX * 100) + '%');
    } catch (x) { }
  };
  skin(0);
})();
/* ===== ANALOG: status aktif / sprint + penunjuk arah ===== */
(function () {
  var jz = document.getElementById('joyZone'), jb = document.getElementById('joyBase'), jd = document.getElementById('joyDir');
  if (!jz || !jb || !jd)
    return;
  var id = null, sx = 0, sy = 0, MAXR = 56;
  jz.addEventListener('pointerdown', function (e) { id = e.pointerId; sx = e.clientX; sy = e.clientY; jb.classList.add('on'); jb.classList.remove('sprint'); jd.style.setProperty('--a', '0rad'); });
  window.addEventListener('pointermove', function (e) {
    if (e.pointerId !== id)
      return;
    var dx = e.clientX - sx, dy = e.clientY - sy, d = Math.hypot(dx, dy);
    jd.style.setProperty('--a', Math.atan2(dy, dx) + 'rad');
    jd.style.opacity = d > MAXR * .12 ? '1' : '0';
    jb.classList.toggle('sprint', d / MAXR > .72);
  });

  function off(e) {
    if (e.pointerId !== id)
      return; id = null; jb.classList.remove('on', 'sprint'); jd.style.opacity = '';
  }
  window.addEventListener('pointerup', off);
  window.addEventListener('pointercancel', off);
})();

/* ===== MUSIK LOBBY & DUNGEON: external MP3 loader (assets/audio/lobby.mp3 & assets/audio/dungeon.mp3) ===== */
(function () {
  var ctx = null, T = {}, duck = false;
  ['lobby', 'dungeon', 'ambient'].forEach(function (k) { T[k] = { buf: null, dec: false, fail: false, src: null, gain: null, stopT: 0, el: null, ev: 0, t0: 0, off: 0, pos: 0 }; });

  function sliderVol() {
    var s = document.getElementById('musicVol');
    return Math.max(0, Math.min(1, s ? (+s.value / 100) : .7));
  }

  function area() {
    try {
      if (!(playing && inGame && SFX.isOn() && !document.hidden))
        return null;
      if (lobby) {
        if (window.ENDM || (typeof BOSS !== 'undefined' && BOSS && BOSS.on))
          return null;
        // Hutan, Desa Lembah Lentera, Kerajaan Aurelia & Istana memakai SATU lagu (assets/audio/ambient.mp3) yang menyambung:
        // pindah hutan <-> desa <-> kerajaan <-> istana tidak me-restart lagu. Jika file-nya tidak ada, jatuh kembali ke lobby.mp3.
        var A = window.AREA;
        if ((A === 'forest' || A === 'village' || A === 'kingdom' || A === 'palace') && !(T.ambient.fail && T.ambient.el && T.ambient.el.error))
          return 'ambient';
        return 'lobby';
      }
      return 'dungeon';
    } catch (e) {
      return null;
    }
  }

  function ensureCtx() {
    if (!ctx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      } catch (e) {
        ctx = null;
        return false;
      }
    }
    if (ctx.state !== 'running') {
      try {
        ctx.resume();
      } catch (e) { }
    }
    return true;
  }

  function prep(k) {
    var t = T[k];
    if (t.buf || t.dec || t.fail)
      return;
    t.dec = true;
    fetch('assets/audio/' + k + '.mp3')
      .then(function (res) {
        if (!res.ok) throw new Error('Audio fetch status: ' + res.status);
        return res.arrayBuffer();
      })
      .then(function (buf) {
        if (ctx) {
          ctx.decodeAudioData(buf, function (b) {
            t.buf = b;
            t.dec = false;
          }, function () {
            t.dec = false;
            t.fail = true;
          });
        } else {
          t.dec = false;
          t.fail = true;
        }
      })
      .catch(function () {
        t.dec = false;
        t.fail = true;
      });
  }

  function elPlay(k, want) {
    var t = T[k];
    if (!t.el) {
      t.el = new Audio('assets/audio/' + k + '.mp3');
      t.el.loop = true;
      t.el.volume = 0;
    }
    if (want) {
      if (t.el.paused) {
        var p = t.el.play();
        if (p && p.catch)
          p.catch(function () { });
      }
      t.ev += (sliderVol() - t.ev) * .2 + .005;
      t.el.volume = Math.max(0, Math.min(1, t.ev));
    } else if (!t.el.paused) {
      t.ev -= .1;
      if (t.ev <= .01) {
        t.ev = 0;
        t.el.pause();
      } else
        t.el.volume = t.ev;
    }
  }

  function drive(k, want) {
    var t = T[k];
    if (want) {
      if (!ensureCtx())
        t.fail = true;
      if (!t.fail) {
        prep(k);
        if (t.buf && ctx.state === 'running') {
          clearTimeout(t.stopT);
          t.stopT = 0;
          if (!t.src) {
            t.gain = ctx.createGain();
            t.gain.gain.value = 0;
            t.gain.connect(ctx.destination);
            t.src = ctx.createBufferSource();
            t.src.buffer = t.buf;
            t.src.loop = true;
            t.src.connect(t.gain);
            // ambient: lanjut dari posisi terakhir (mis. setelah pause / dari dungeon kembali ke hutan)
            t.off = k === 'ambient' && t.buf.duration > 0 ? (t.pos || 0) % t.buf.duration : 0;
            t.src.start(0, t.off);
            t.t0 = ctx.currentTime;
          }
          t.gain.gain.setTargetAtTime(sliderVol(), ctx.currentTime, .4);
        }
      }
      if (t.fail)
        elPlay(k, true);
    } else {
      if (ctx && t.src) {
        t.gain.gain.setTargetAtTime(0, ctx.currentTime, .15);
        if (!t.stopT) {
          if (k === 'ambient' && t.buf && t.buf.duration > 0)
            t.pos = ((t.off || 0) + (ctx.currentTime - t.t0)) % t.buf.duration;   // ingat posisi lagu
          t.stopT = setTimeout(function () {
            t.stopT = 0;
            if (area() === k)
              return;
            try {
              t.src.stop();
            } catch (e) { }
            try {
              t.src.disconnect();
              t.gain.disconnect();
            } catch (e) { }
            t.src = null;
            t.gain = null;
          }, 900);
        }
      }
      if (t.el)
        elPlay(k, false);
    }
  }

  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    addEventListener(ev, function () {
      if (ctx && ctx.state !== 'running')
        try {
          ctx.resume();
        } catch (e) { }
    }, true);
  });

  setInterval(function () {
    var a = area();
    if (a) {
      try {
        SFX.vol(0);
        duck = true;
      } catch (e) { }
    } else if (duck) {
      try {
        SFX.vol(sliderVol() * 1.4);
      } catch (e) { }
      duck = false;
    }
    if ((a === 'lobby' || a === 'dungeon') && ensureCtx())
      prep('ambient');   // muat lebih awal supaya tidak hening saat masuk hutan
    drive('lobby', a === 'lobby');
    drive('dungeon', a === 'dungeon');
    drive('ambient', a === 'ambient');
  }, 100);
})();

/* ===== SERVICE WORKER REGISTRATION FOR PWA ===== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').then(function (reg) {
      console.log('ServiceWorker registered with scope:', reg.scope);
      // Cek pembaruan ke server setiap kali aplikasi dibuka
      reg.update().catch(() => {});
      // Jika service worker baru selesai diinstall dan mengambil alih
      reg.addEventListener('updatefound', function () {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New PWA update available, refreshing client...');
              window.location.reload();
            }
          });
        }
      });
    }).catch(function (err) {
      console.log('ServiceWorker registration failed:', err);
    });
  });
}