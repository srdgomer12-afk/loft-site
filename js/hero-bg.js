/* ==========================================================================
   LOFT — hero-bg.js
   Hero için koyu, yavaş hareket eden arka plan: kafe ışıklarını andıran
   bulanık altın "bokeh" halkaları ve ince altın toz. Canvas, bağımlılık yok.
   - Hero görünmüyorsa ya da sekme gizliyse durur (pil/performans)
   - prefers-reduced-motion açıksa tek sabit kare çizer
   - Masaüstünde imleçle çok hafif paralaks
   ========================================================================== */
(function () {
  'use strict';

  var hero = document.getElementById('anasayfa');
  var canvas = document.querySelector('[data-hero-canvas]');
  if (!hero || !canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  var w = 0, h = 0, dpr = 1;
  var orbs = [], dust = [];
  var sprite = null;
  var raf = 0, running = false, lastTime = 0, clock = 0;
  var px = 0, py = 0, tx = 0, ty = 0;
  var visible = true;

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* Bir kez çizilen yumuşak ışık sprite'ı: her frame'de drawImage ile ölçeklenir */
  function makeSprite() {
    var s = document.createElement('canvas');
    s.width = s.height = 128;
    var c = s.getContext('2d');
    var g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(239, 220, 168, 0.95)');
    g.addColorStop(0.35, 'rgba(201, 164, 92, 0.4)');
    g.addColorStop(1, 'rgba(201, 164, 92, 0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    return s;
  }

  function seed() {
    var scale = Math.min(1, Math.max(0.55, w / 1100));
    var orbCount = Math.round(Math.min(24, Math.max(9, (w * h) / 80000)));
    var dustCount = Math.round(Math.min(70, Math.max(24, (w * h) / 22000)));

    orbs = [];
    for (var i = 0; i < orbCount; i++) {
      orbs.push({
        x: rand(0, w), y: rand(0, h),
        r: rand(28, 105) * scale,
        vx: rand(-5, 5), vy: rand(-9, -2),
        a: rand(0.1, 0.3),
        speed: rand(0.25, 0.7), phase: rand(0, 6.28),
        depth: rand(0.2, 1)
      });
    }
    dust = [];
    for (var j = 0; j < dustCount; j++) {
      dust.push({
        x: rand(0, w), y: rand(0, h),
        r: rand(0.5, 1.5),
        vx: rand(-3, 3), vy: rand(-14, -4),
        a: rand(0.15, 0.55),
        speed: rand(0.6, 1.6), phase: rand(0, 6.28),
        depth: rand(0.3, 1.2)
      });
    }
  }

  function resize() {
    var rect = hero.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    draw(0);
  }

  function step(dt) {
    var i, o;
    for (i = 0; i < orbs.length; i++) {
      o = orbs[i];
      o.x += o.vx * dt; o.y += o.vy * dt;
      if (o.y < -o.r * 1.5) { o.y = h + o.r * 1.5; o.x = rand(0, w); }
      if (o.x < -o.r * 1.5) o.x = w + o.r * 1.5;
      else if (o.x > w + o.r * 1.5) o.x = -o.r * 1.5;
    }
    for (i = 0; i < dust.length; i++) {
      o = dust[i];
      o.x += o.vx * dt; o.y += o.vy * dt;
      if (o.y < -4) { o.y = h + 4; o.x = rand(0, w); }
      if (o.x < -4) o.x = w + 4;
      else if (o.x > w + 4) o.x = -4;
    }
    px += (tx - px) * Math.min(1, dt * 2.2);
    py += (ty - py) * Math.min(1, dt * 2.2);
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    var i, o, alpha, ox, oy;
    for (i = 0; i < orbs.length; i++) {
      o = orbs[i];
      alpha = o.a * (0.55 + 0.45 * Math.sin(t * o.speed + o.phase));
      ox = o.x + px * o.depth * 22;
      oy = o.y + py * o.depth * 14;
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, ox - o.r, oy - o.r, o.r * 2, o.r * 2);
    }

    ctx.fillStyle = '#efdca8';
    for (i = 0; i < dust.length; i++) {
      o = dust[i];
      alpha = o.a * (0.4 + 0.6 * Math.abs(Math.sin(t * o.speed + o.phase)));
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(o.x + px * o.depth * 30, o.y + py * o.depth * 18, o.r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
    lastTime = now;
    clock += dt;
    step(dt);
    draw(clock);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceMotion || !visible || document.hidden) return;
    running = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }
  function sync() { if (visible && !document.hidden) start(); else stop(); }

  sprite = makeSprite();
  resize();
  /* Açılışta yumuşak belirme */
  requestAnimationFrame(function () { canvas.classList.add('is-on'); });

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 160);
  });

  document.addEventListener('visibilitychange', sync);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      sync();
    }, { threshold: 0 }).observe(hero);
  }

  if (finePointer && !reduceMotion) {
    hero.addEventListener('pointermove', function (event) {
      var rect = hero.getBoundingClientRect();
      tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
  }

  start();
})();
