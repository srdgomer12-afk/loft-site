/* ==========================================================================
   LOFT — live.js
   Admin panelinde yayınlanan içeriği siteye uygular ve açık sayfaları canlı tutar.
   - Sayfa açılırken: api/bootstrap ile gelen güncel içerik, main.js çalışmadan önce uygulanır.
   - Sonrasında: sekme görünürken birkaç saniyede bir sürüm numarasına bakar;
     değişmişse yeni içeriği çekip sayfayı yenilemeden günceller.
   API yoksa (yerel dosya, başka bir barındırma) hiçbir şey yapmaz; site varsayılan içerikle çalışır.
   ========================================================================== */
(function () {
  'use strict';

  var INTERVAL = 10000;
  var SCHEMA = window.LOFT_LIVE_SCHEMA || { texts: [] };

  /* main.js bu nesnelere referans tutar: değiştirirken yerinde güncelliyoruz */
  var CFG = window.LOFT_CONFIG = window.LOFT_CONFIG || {};
  var MENU = window.LOFT_MENU = window.LOFT_MENU || [];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* Dosyalardaki varsayılanlar (admin panel de bunları kullanır) */
  var defaults = { config: clone(CFG), menu: clone(MENU), texts: {} };
  SCHEMA.texts.forEach(function (t) {
    var node = document.querySelector(t.sel);
    if (node) defaults.texts[t.key] = node.textContent.trim();
  });
  window.LOFT_DEFAULTS = defaults;

  function apply(content) {
    content = content || {};

    var cfg = clone(defaults.config);
    var saved = content.config || {};
    Object.keys(saved).forEach(function (k) { cfg[k] = saved[k]; });
    cfg.images = {};
    [defaults.config.images || {}, content.images || {}].forEach(function (src) {
      Object.keys(src).forEach(function (k) { cfg.images[k] = src[k]; });
    });
    Object.keys(CFG).forEach(function (k) { delete CFG[k]; });
    Object.keys(cfg).forEach(function (k) { CFG[k] = cfg[k]; });

    var menu = Array.isArray(content.menu) ? content.menu : clone(defaults.menu);
    MENU.length = 0;
    menu.forEach(function (cat) { MENU.push(cat); });

    SCHEMA.texts.forEach(function (t) {
      var custom = content.texts && content.texts[t.key];
      var value = custom || defaults.texts[t.key];
      if (typeof value !== 'string') return;
      Array.prototype.forEach.call(document.querySelectorAll(t.sel), function (n) {
        if (n.textContent !== value) n.textContent = value;
      });
    });
  }

  var rev = -1;
  if (window.LOFT_LIVE && typeof window.LOFT_LIVE.rev === 'number') {
    rev = window.LOFT_LIVE.rev;
    apply(window.LOFT_LIVE.content);
  }

  /* ---------- Canlı güncelleme ---------- */
  var timer = 0, fails = 0, stopped = false, busy = false;

  function schedule(ms) {
    clearTimeout(timer);
    if (!stopped) timer = setTimeout(tick, ms);
  }

  function getJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (res) {
      if (res.status === 404) { stopped = true; throw new Error('no-api'); }
      if (!res.ok) throw new Error('http ' + res.status);
      return res.json();
    });
  }

  function tick() {
    if (document.hidden || busy || stopped) return; /* sekme görünür olunca yeniden başlar */
    busy = true;
    getJSON('api/live')
      .then(function (live) {
        if (typeof live.rev !== 'number' || live.rev === rev) return;
        return getJSON('api/content').then(function (data) {
          apply(data.content);
          rev = data.rev;
          if (window.LOFT_APP) window.LOFT_APP.refresh();
        });
      })
      .then(function () { fails = 0; })
      .catch(function () { fails++; })
      .then(function () {
        busy = false;
        schedule(fails ? Math.min(60000, INTERVAL * Math.pow(2, fails)) : INTERVAL);
      });
  }

  document.addEventListener('visibilitychange', function () { if (!document.hidden) schedule(0); });
  window.addEventListener('online', function () { schedule(0); });
  schedule(INTERVAL);
})();
