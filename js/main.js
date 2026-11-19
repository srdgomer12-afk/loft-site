/* ==========================================================================
   LOFT — main.js
   Bağımlılık yok. Bölümler: yardımcılar · görsel slotları · config bağlama ·
   çalışma saatleri · header/ilerleme · mobil menü · scroll animasyonları ·
   menü sekmeleri · galeri lightbox
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.LOFT_CONFIG || {};
  var MENU = window.LOFT_MENU || [];
  var MENU_UTILS = window.LOFT_MENU_UTILS || { formatPrice: function (p) { return p ? String(p) : null; } };
  var ART = window.LOFT_ART || { get: function () { return ''; } };

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- Yardımcılar ------------------------------------------------ */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(tag, props, children) {
    var node = document.createElement(tag);
    Object.keys(props || {}).forEach(function (key) {
      var val = props[key];
      if (key === 'class') node.className = val;
      else if (key === 'text') node.textContent = val;
      else node.setAttribute(key, val);
    });
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
  }

  var toastEl = $('[data-toast]');
  var toastTimer = 0;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3200);
  }

  /* ---------- Görsel slotları ------------------------------------------- */
  /* [data-slot] öğesine: ikon (data-art) ve config'te yolu varsa fotoğraf ekler.
     Fotoğraf yüklenemezse ikon yedek olarak kalır. */
  function mountSlot(slot) {
    if (!slot.dataset.ready) {
      slot.dataset.ready = '1';
      var artKey = slot.dataset.art;
      if (artKey) {
        var art = el('span', { 'class': 'ph__art', 'aria-hidden': 'true' });
        art.innerHTML = ART.get(artKey);
        slot.appendChild(art);
      }
    }

    /* Fotoğraf adresi değiştiyse (admin panelinden) eskisini kaldırıp yenisini yükle */
    var src = (CFG.images && CFG.images[slot.dataset.slot]) || '';
    var current = $('img', slot);
    if (current && current.getAttribute('src') === src) return;
    if (current) { current.remove(); slot.classList.remove('is-loaded'); }
    if (!src) return;

    var img = new Image();
    img.alt = slot.dataset.alt || '';
    img.decoding = 'async';
    var eager = slot.hasAttribute('data-eager');
    img.loading = eager ? 'eager' : 'lazy';
    if (eager) img.setAttribute('fetchpriority', 'high');
    img.onload = function () { slot.classList.add('is-loaded'); };
    img.onerror = function () { img.remove(); };
    img.src = src;
    slot.insertBefore(img, slot.firstChild);
  }
  function mountSlots(root) { $$('[data-slot]', root).forEach(mountSlot); }

  /* ---------- Config'i sayfaya bağla ------------------------------------ */
  var PENDING = {
    phone: 'Telefon numarası yakında eklenecek.',
    directions: 'Adres bilgisi yakında eklenecek.',
    instagram: 'Instagram hesabı yakında eklenecek.'
  };

  function instagramUrl(value) {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return 'https://www.instagram.com/' + value.replace(/^@/, '').replace(/\/+$/, '') + '/';
  }
  function instagramHandle(value) {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) {
      var parts = value.replace(/\/+$/, '').split('/');
      return '@' + parts[parts.length - 1].split('?')[0];
    }
    return '@' + value.replace(/^@/, '');
  }
  function telHref(value) {
    var digits = (value || '').replace(/[^\d+]/g, '');
    return digits ? 'tel:' + digits : '';
  }
  function directionsHref() {
    if (CFG.directionsUrl) return CFG.directionsUrl;
    if (CFG.address) {
      return 'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(CFG.address.replace(/\n/g, ', '));
    }
    return '';
  }

  function setField(name, value) {
    $$('[data-field="' + name + '"]').forEach(function (node) {
      if (node.dataset.ph === undefined) node.dataset.ph = node.textContent;
      if (value) { node.textContent = value; node.classList.remove('is-empty'); }
      else { node.textContent = node.dataset.ph; node.classList.add('is-empty'); }
    });
  }

  var pendingBound = false;

  function bindConfig() {
    setField('phone', CFG.phone);
    setField('address', CFG.address);
    setField('instagram', instagramHandle(CFG.instagram));

    var targets = {
      phone: telHref(CFG.phone),
      instagram: instagramUrl(CFG.instagram),
      directions: directionsHref()
    };

    $$('[data-link]').forEach(function (a) {
      var kind = a.dataset.link;
      var href = targets[kind];
      if (href) {
        a.setAttribute('href', href);
        if (kind !== 'phone') {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        }
        a.removeAttribute('data-pending');
      } else {
        a.setAttribute('href', '#iletisim');
        a.setAttribute('data-pending', '1');
        a.removeAttribute('target');
        a.removeAttribute('rel');
      }
    });

    /* Bilgisi girilmemiş bağlantılar: sayfa kaymaz, nazik bir bildirim çıkar */
    if (!pendingBound) {
      pendingBound = true;
      document.addEventListener('click', function (event) {
        var a = event.target.closest ? event.target.closest('a[data-pending]') : null;
        if (!a) return;
        event.preventDefault();
        toast(PENDING[a.dataset.link] || 'Bu bilgi yakında eklenecek.');
      });
    }

    var notice = $('[data-demo-notice]');
    if (notice) notice.hidden = !CFG.demo;

    var year = $('[data-year]');
    if (year) year.textContent = new Date().getFullYear();

    /* Harita */
    var map = $('[data-map]');
    var placeholder = $('[data-map-placeholder]');
    if (map) {
      var frame = $('iframe', map);
      if (CFG.mapEmbedUrl) {
        if (frame) {
          if (frame.getAttribute('src') !== CFG.mapEmbedUrl) frame.setAttribute('src', CFG.mapEmbedUrl);
        } else {
          map.insertBefore(el('iframe', {
            src: CFG.mapEmbedUrl,
            title: 'LOFT konumu haritası',
            loading: 'lazy',
            referrerpolicy: 'no-referrer-when-downgrade',
            allowfullscreen: ''
          }), map.firstChild);
        }
        if (placeholder) placeholder.style.display = 'none';
      } else {
        if (frame) frame.remove();
        if (placeholder) placeholder.style.display = '';
      }
    }
  }

  /* ---------- Çalışma saatleri + "şu an açık/kapalı" -------------------- */
  /* "09:00 – 23:00" biçimini okur; gece yarısını aşan aralıkları ("18:00 – 02:00") destekler. */
  function parseRange(text) {
    var m = /(\d{1,2})[:.](\d{2})\s*[–—-]\s*(\d{1,2})[:.](\d{2})/.exec(text || '');
    if (!m) return null;
    return { open: (+m[1]) * 60 + (+m[2]), close: (+m[3]) * 60 + (+m[4]) };
  }
  function isClosedText(text) { return /kapal[ıi]/i.test(text || ''); }

  function openNow(hours, now) {
    var today = (now.getDay() + 6) % 7; /* Pazartesi = 0 */
    var yesterday = (today + 6) % 7;
    var mins = now.getHours() * 60 + now.getMinutes();

    var range = hours[today] && parseRange(hours[today].time);
    if (range) {
      if (range.close > range.open) { if (mins >= range.open && mins < range.close) return true; }
      else if (mins >= range.open) return true; /* gece yarısını aşan: akşam kısmı */
    }
    var prev = hours[yesterday] && parseRange(hours[yesterday].time);
    if (prev && prev.close <= prev.open && mins < prev.close) return true; /* dünün gece kısmı */
    return false;
  }

  var hoursStatus = null;
  var hoursTimer = 0;

  function initHours() {
    var list = $('[data-hours]');
    if (!list || !CFG.hours || !CFG.hours.length) return;
    list.textContent = '';
    if (hoursStatus) { hoursStatus.remove(); hoursStatus = null; }
    clearInterval(hoursTimer);

    var todayIndex = (new Date().getDay() + 6) % 7;
    CFG.hours.forEach(function (row, i) {
      var time = el('span', {
        'class': 'hours__time' + (row.time ? '' : ' is-empty'),
        text: row.time || 'Saat eklenecek'
      });
      list.appendChild(el('li', { 'class': i === todayIndex ? 'is-today' : '' }, [
        el('span', { 'class': 'hours__day', text: row.day }),
        time
      ]));
    });

    /* Durum satırı yalnızca saatler gerçekten girilmişse gösterilir */
    var anyTime = CFG.hours.some(function (r) { return parseRange(r.time) || isClosedText(r.time); });
    if (!anyTime) return;

    var status = hoursStatus = el('p', { 'class': 'hours__status', 'data-hours-status': '' });
    list.parentNode.insertBefore(status, list);

    function update() {
      var open = openNow(CFG.hours, new Date());
      status.classList.toggle('is-open', open);
      status.textContent = open ? 'Şu an açığız' : 'Şu an kapalıyız';
    }
    update();
    hoursTimer = setInterval(update, 60000);
  }

  /* ---------- Header + scroll ilerleme ---------------------------------- */
  function initHeader() {
    var header = $('[data-header]');
    var bar = $('[data-progress]');
    var ticking = false;

    function update() {
      var y = window.scrollY || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (header) header.classList.toggle('is-scrolled', y > 24);
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();

    /* Hangi bölümdeyiz: menü bağlantısını vurgula */
    if (!('IntersectionObserver' in window)) return;
    var opts = { rootMargin: '-45% 0px -50% 0px' };

    function setCurrent(id) {
      $$('[data-nav]').forEach(function (a) {
        if (a.dataset.nav === id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      });
    }, opts);
    ['hakkimizda', 'menu', 'galeri', 'iletisim'].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });

    var hero = $('#anasayfa');
    if (hero) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) setCurrent('');
      }, opts).observe(hero);
    }
  }

  /* ---------- Mobil menü ------------------------------------------------- */
  function initDrawer() {
    var burger = $('[data-burger]');
    var drawer = $('[data-drawer]');
    if (!burger || !drawer) return;

    function isOpen() { return drawer.classList.contains('is-open'); }

    function setOpen(open, returnFocus) {
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) drawer.removeAttribute('inert'); else drawer.setAttribute('inert', '');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
      document.documentElement.classList.toggle('is-locked', open);

      if (open) {
        var first = $('a', drawer);
        if (first) setTimeout(function () { if (isOpen()) first.focus({ preventScroll: true }); }, 80);
      } else if (returnFocus) {
        burger.focus({ preventScroll: true });
      }
    }

    burger.addEventListener('click', function () { setOpen(!isOpen(), true); });

    /* Bir bağlantıya basınca menü kapanır; sayfa o bölüme kayar */
    $$('a', drawer).forEach(function (a) {
      a.addEventListener('click', function () { if (isOpen()) setOpen(false, false); });
    });

    document.addEventListener('keydown', function (event) {
      if (!isOpen()) return;
      if (event.key === 'Escape') { setOpen(false, true); return; }
      if (event.key !== 'Tab') return;
      /* Odağı burger ve menü bağlantıları arasında döndür */
      var items = [burger].concat($$('a[href]', drawer));
      var idx = items.indexOf(document.activeElement);
      if (event.shiftKey && idx <= 0) { event.preventDefault(); items[items.length - 1].focus(); }
      else if (!event.shiftKey && (idx === items.length - 1 || idx === -1)) { event.preventDefault(); items[0].focus(); }
    });

    /* Geniş ekrana geçilirse ya da yön değişirse menüyü kapat */
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && isOpen()) setOpen(false, false);
    });
  }

  /* ---------- Scroll ile beliren öğeler --------------------------------- */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (n) { io.observe(n); });

    /* Güvenlik: hiçbir şey tetiklenmezse içerik gizli kalmasın */
    window.addEventListener('load', function () {
      setTimeout(function () {
        items.forEach(function (n) {
          var r = n.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) n.classList.add('is-in');
        });
      }, 1500);
    });
  }

  /* ---------- Menü (sekmeler) ------------------------------------------- */
  var menuCurrentId = null;

  function initMenu() {
    var root = $('[data-menu]');
    if (!root) return;
    root.textContent = '';
    if (!MENU.length) return;

    var tablist = el('div', { 'class': 'cats', role: 'tablist', 'aria-label': 'Menü kategorileri' });
    var panel = el('div', { 'class': 'menu-panel', role: 'tabpanel', id: 'menu-panel', tabindex: '0' });
    var tabs = [];
    var current = -1;
    var swapTimer = 0;

    MENU.forEach(function (cat, i) {
      var media = el('span', { 'class': 'ph', 'data-slot': 'menu-' + cat.id, 'data-art': cat.art || '', 'data-alt': cat.name });
      var tab = el('button', {
        'class': 'cat', type: 'button', role: 'tab',
        id: 'tab-' + cat.id, 'aria-controls': 'menu-panel',
        'aria-selected': 'false', tabindex: '-1'
      }, [
        media,
        el('span', { 'class': 'cat__name', text: cat.name }),
        el('span', { 'class': 'cat__count', text: cat.items.length + ' çeşit' }),
        el('span', { 'class': 'cat__bar', 'aria-hidden': 'true' })
      ]);
      tab.addEventListener('click', function () { select(i, false); });
      tabs.push(tab);
      tablist.appendChild(tab);
    });

    root.appendChild(tablist);
    root.appendChild(panel);
    mountSlots(tablist);

    function renderPanel(cat) {
      panel.setAttribute('aria-labelledby', 'tab-' + cat.id);
      panel.textContent = '';

      var media = el('div', { 'class': 'menu-panel__media' }, [
        el('div', { 'class': 'ph', 'data-slot': 'menu-' + cat.id, 'data-art': cat.art || '', 'data-alt': cat.name })
      ]);

      var list = el('ul', { 'class': 'menu-list' });
      cat.items.forEach(function (item) {
        var price = MENU_UTILS.formatPrice(item.price);
        list.appendChild(el('li', {}, [
          el('div', { 'class': 'menu-item__row' }, [
            el('span', { 'class': 'menu-item__name', text: item.name }),
            item.badge ? el('span', { 'class': 'menu-item__badge', text: item.badge }) : null,
            el('span', { 'class': 'menu-item__leader', 'aria-hidden': 'true' }),
            price
              ? el('span', { 'class': 'menu-item__price', text: price })
              : el('span', { 'class': 'menu-item__price menu-item__price--soon', text: 'Fiyat yakında' })
          ]),
          item.desc ? el('p', { 'class': 'menu-item__desc', text: item.desc }) : null
        ]));
      });

      panel.appendChild(media);
      panel.appendChild(el('div', { 'class': 'menu-panel__body' }, [
        el('h3', { 'class': 'menu-panel__title', text: cat.name }),
        cat.lead ? el('p', { 'class': 'menu-panel__lead', text: cat.lead }) : null,
        list,
        cat.note ? el('p', { 'class': 'menu-panel__note', text: cat.note }) : null
      ]));
      mountSlots(panel);
    }

    function select(index, focusTab) {
      if (index === current) { if (focusTab) tabs[index].focus(); return; }
      var first = current === -1;
      current = index;
      menuCurrentId = MENU[index].id;

      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.setAttribute('tabindex', on ? '0' : '-1');
      });
      if (focusTab) tabs[index].focus({ preventScroll: true });

      /* Mobilde yatay kaydırılan kartlarda seçileni ortala (sayfa dikeyde oynamaz) */
      if (!first && tablist.scrollWidth > tablist.clientWidth) {
        var tab = tabs[index];
        var target = tab.offsetLeft - (tablist.clientWidth - tab.offsetWidth) / 2;
        if (tablist.scrollTo) tablist.scrollTo({ left: target, behavior: reduceMotion ? 'auto' : 'smooth' });
        else tablist.scrollLeft = target;
      }

      clearTimeout(swapTimer);
      if (first || reduceMotion) { renderPanel(MENU[index]); return; }

      panel.classList.add('is-swap');
      swapTimer = setTimeout(function () {
        renderPanel(MENU[current]); /* hızlı tıklamada her zaman son seçilen çizilir */
        requestAnimationFrame(function () { panel.classList.remove('is-swap'); });
      }, 220);
    }

    tablist.addEventListener('keydown', function (event) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      select(next, true);
    });

    var keep = 0;
    MENU.forEach(function (cat, i) { if (cat.id === menuCurrentId) keep = i; });
    select(keep, false);
  }

  /* ---------- Galeri lightbox ------------------------------------------- */
  function initGallery() {
    var tiles = $$('[data-tile]');
    var dialog = $('[data-lightbox]');
    if (!tiles.length || !dialog) return;

    var stage = $('[data-stage]', dialog);
    var caption = $('[data-caption]', dialog);
    var count = $('[data-count]', dialog);
    var shell = $('[data-shell]', dialog);
    var index = 0;
    var opener = null;
    var native = typeof dialog.showModal === 'function';

    /* Komşu görselleri önceden yükle: ok tuşuyla geçiş anında olur */
    function preload(i) {
      var slot = $('[data-slot]', tiles[(i + tiles.length) % tiles.length]);
      var src = slot && CFG.images && CFG.images[slot.dataset.slot];
      if (src) { var img = new Image(); img.src = src; }
    }

    function show(i) {
      index = (i + tiles.length) % tiles.length;
      var src = $('[data-slot]', tiles[index]);
      var view = el('div', {
        'class': 'ph',
        'data-slot': src.dataset.slot,
        'data-art': src.dataset.art || '',
        'data-alt': src.dataset.alt || '',
        'data-eager': ''
      });
      stage.textContent = '';
      stage.appendChild(view);
      mountSlot(view);
      caption.textContent = src.dataset.alt || '';
      count.textContent = (index + 1) + ' / ' + tiles.length;
      preload(index + 1);
      preload(index - 1);
    }

    function open(i, trigger) {
      opener = trigger;
      show(i);
      if (native) dialog.showModal(); else dialog.setAttribute('open', '');
      document.documentElement.classList.add('is-locked');
    }
    function finish() {
      document.documentElement.classList.remove('is-locked');
      if (opener) { opener.focus({ preventScroll: true }); opener = null; }
    }
    function close() {
      if (native) { if (dialog.open) dialog.close(); } /* 'close' olayı finish() çağırır */
      else { dialog.removeAttribute('open'); finish(); }
    }

    tiles.forEach(function (tile, i) {
      var btn = $('button', tile);
      btn.addEventListener('click', function () { open(i, btn); });
    });

    $('[data-lb-close]', dialog).addEventListener('click', close);
    $('[data-lb-prev]', dialog).addEventListener('click', function () { show(index - 1); });
    $('[data-lb-next]', dialog).addEventListener('click', function () { show(index + 1); });

    dialog.addEventListener('close', finish); /* Esc ile kapanma dahil */

    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
      else if (event.key === 'Escape' && !native) close();
    });

    /* Boşluğa tıklayınca kapat */
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog || event.target === shell) close();
    });

    /* Dokunmatik kaydırma: sola/sağa */
    var startX = null;
    dialog.addEventListener('touchstart', function (event) { startX = event.touches[0].clientX; }, { passive: true });
    dialog.addEventListener('touchend', function (event) {
      if (startX === null) return;
      var dx = event.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ---------- Başlat ----------------------------------------------------- */
  function init() {
    mountSlots(document);
    bindConfig();
    initHours();
    initHeader();
    initDrawer();
    initMenu();
    initGallery();
    initReveal();
  }

  /* live.js yeni içerik geldiğinde bunu çağırır: sayfa yenilenmeden güncellenir */
  window.LOFT_APP = {
    refresh: function () {
      bindConfig();
      initHours();
      initMenu();
      mountSlots(document);
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
