/* LOFT yönetim paneli. Bağımlılık yok. */
(function () {
  'use strict';

  var SCHEMA = window.LOFT_LIVE_SCHEMA;
  var CFG0 = window.LOFT_CONFIG || {};
  var MENU0 = window.LOFT_MENU || [];
  var ART = window.LOFT_ART;
  var app = document.getElementById('app');
  var toastEl = document.getElementById('toast');

  var S = null;            /* çalışma kopyası: { config, menu, texts, images } */
  var DEF_TEXTS = {};      /* sitedeki mevcut yazılar */
  var rev = 0;
  var dirty = false;
  var tab = 'genel';
  var openCats = {};
  var busy = 0;
  var publishMsg = '';

  /* ---------- yardımcılar ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function h(tag, props, kids) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (v === undefined || v === null || v === false) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'open') n[k] = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  var toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3800);
  }
  function api(method, url, body, headers) {
    var opt = { method: method, credentials: 'same-origin', cache: 'no-store', headers: Object.assign({ 'x-requested-with': 'loft-admin' }, headers || {}) };
    if (body !== undefined) opt.body = body;
    return fetch(url, opt).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, status: res.status, data: data }; });
    });
  }
  function setDirty(on) { dirty = on; if (on) publishMsg = ''; renderBar(); }
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- açılış ---------- */
  function boot() {
    api('GET', '/api/admin/session').then(function (r) {
      var s = r.data || {};
      if (!s.passwordSet || !s.dbOk) return renderSetup(s);
      if (!s.authed) return renderLogin();
      loadEditor();
    }).catch(function () {
      app.textContent = '';
      app.appendChild(h('p', { 'class': 'boot', text: 'Sunucuya ulaşılamadı. Panel yalnızca Cloudflare Pages üzerinde çalışır.' }));
    });
  }

  function gate(title, kids) {
    app.textContent = '';
    app.appendChild(h('div', { 'class': 'gate' }, [h('div', { 'class': 'gate__box' }, [
      h('p', { 'class': 'gate__mark', text: 'LOFT' }), h('h1', { text: title })].concat(kids))]));
  }

  function renderSetup(s) {
    function item(ok, text) { return h('li', { 'class': ok ? 'good' : 'bad' }, [(ok ? 'Tamam: ' : 'Eksik: ') + text]); }
    gate('Panelin çalışması için iki ayar gerekiyor', [
      h('ol', { 'class': 'setup' }, [
        item(s.dbOk, 'D1 veritabanı. Cloudflare > Pages projesi > Settings > Bindings > D1 database. Değişken adı DB olmalı.'),
        item(s.passwordSet, 'Yönetici şifresi. Settings > Variables and Secrets > ADMIN_PASSWORD (Secret olarak ekleyin).')
      ]),
      h('p', { 'class': 'gate__err', text: 'Ayarları ekledikten sonra siteyi yeniden dağıtın (Deployments > Retry deployment) ve bu sayfayı yenileyin.' })
    ]);
  }

  function renderLogin() {
    var pw = h('input', { type: 'password', id: 'pw', autocomplete: 'current-password', required: true });
    var err = h('p', { 'class': 'gate__err', role: 'alert' });
    var btn = h('button', { 'class': 'btn', type: 'submit', text: 'Giriş yap' });
    var form = h('form', {}, [h('label', { 'for': 'pw', text: 'Yönetici şifresi' }), pw, btn, err]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      btn.disabled = true; err.textContent = '';
      api('POST', '/api/admin/session', JSON.stringify({ password: pw.value }), { 'content-type': 'application/json' })
        .then(function (r) {
          if (!r.ok) { err.textContent = r.data.error || 'Giriş yapılamadı.'; btn.disabled = false; pw.select(); return; }
          return loadEditor().then(function (loaded) {
            if (!loaded) { err.textContent = 'Giriş yapıldı ama içerik yüklenemedi. Tekrar deneyin.'; btn.disabled = false; }
          });
        })
        .catch(function () {
          err.textContent = 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.';
          btn.disabled = false;
        });
    });
    gate('Yönetim paneli', [form]);
    pw.focus();
  }

  function loadEditor() {
    return Promise.all([
      fetch('/api/content', { cache: 'no-store' }).then(function (r) { return r.json(); }),
      fetch('/', { cache: 'no-store' }).then(function (r) { return r.text(); })
    ]).then(function (res) {
      var doc = new DOMParser().parseFromString(res[1], 'text/html');
      SCHEMA.texts.forEach(function (t) { var n = doc.querySelector(t.sel); if (n) DEF_TEXTS[t.key] = n.textContent.trim(); });
      rev = res[0].rev || 0;
      S = build(res[0].content || {});
      dirty = false;
      renderShell();
      return true;
    }).catch(function () { toast('İçerik yüklenemedi. Sayfayı yenileyin.'); return false; });
  }

  function build(c) {
    var cfg = clone(CFG0); delete cfg.images;
    Object.keys(c.config || {}).forEach(function (k) { cfg[k] = c.config[k]; });
    cfg.hours = (cfg.hours || []).map(function (r) { return { day: r.day, time: r.time || '' }; });
    var texts = {};
    SCHEMA.texts.forEach(function (t) { texts[t.key] = (c.texts && c.texts[t.key]) || DEF_TEXTS[t.key] || ''; });
    var images = Object.assign({}, CFG0.images || {}, c.images || {});
    return { config: cfg, menu: clone(Array.isArray(c.menu) ? c.menu : MENU0), texts: texts, images: images };
  }

  /* ---------- kabuk ---------- */
  var TABS = [['genel', 'Genel bilgiler'], ['saatler', 'Çalışma saatleri'], ['menu', 'Menü'], ['foto', 'Fotoğraflar'], ['yazi', 'Site yazıları']];
  var paneEl, barEl;

  function renderShell() {
    app.textContent = '';
    var logout = h('button', { 'class': 'btn btn--ghost btn--sm', type: 'button', text: 'Çıkış', onclick: function () {
      if (dirty && !confirm('Yayınlanmamış değişiklikler var. Yine de çıkılsın mı?')) return;
      dirty = false;
      api('DELETE', '/api/admin/session').then(boot).catch(function () { toast('Bağlantı hatası. Çıkış yapılamadı.'); });
    } });
    app.appendChild(h('header', { 'class': 'top' }, [
      h('span', { 'class': 'top__mark', text: 'LOFT' }), h('span', { 'class': 'top__sub', text: 'Yönetim' }), h('span', { 'class': 'top__sp' }),
      h('a', { href: '/', target: '_blank', rel: 'noopener', text: 'Siteyi aç' }), logout
    ]));
    var tabs = h('div', { 'class': 'tabs', role: 'tablist', 'aria-label': 'Bölümler' }, TABS.map(function (t) {
      return h('button', { 'class': 'tab', role: 'tab', type: 'button', 'data-tab': t[0], 'aria-selected': t[0] === tab ? 'true' : 'false', text: t[1], onclick: function () { tab = t[0]; renderShell(); window.scrollTo(0, 0); } });
    }));
    paneEl = h('section', { 'class': 'pane', role: 'tabpanel' });
    app.appendChild(h('div', { 'class': 'layout' }, [tabs, paneEl]));
    barEl = h('div', { 'class': 'publish' });
    app.appendChild(barEl);
    ({ genel: paneGenel, saatler: paneSaatler, menu: paneMenu, foto: panePhotos, yazi: paneTexts })[tab]();
    renderBar();
  }

  function head(title, text) { paneEl.appendChild(h('div', { 'class': 'pane__head' }, [h('h2', { text: title }), h('p', { text: text })])); }

  function renderBar() {
    if (!barEl) return;
    barEl.textContent = '';
    var on = dirty || !!publishMsg;
    barEl.classList.toggle('is-on', on);
    if (dirty) {
      barEl.appendChild(publishMsg
        ? h('p', { 'class': 'err', role: 'alert', text: publishMsg })
        : h('p', { text: 'Yayınlanmamış değişiklikler var.' }));
      barEl.appendChild(h('button', { 'class': 'btn btn--ghost btn--sm', type: 'button', text: 'Vazgeç', onclick: function () {
        if (confirm('Yapılan değişiklikler silinsin mi?')) loadEditor();
      } }));
      barEl.appendChild(h('button', { 'class': 'btn', type: 'button', disabled: busy > 0, text: busy ? 'Fotoğraf hazırlanıyor…' : 'Değişiklikleri yayınla', onclick: publish }));
    } else if (publishMsg) {
      barEl.appendChild(h('p', { 'class': publishMsg.indexOf('Yayınlandı') === 0 ? '' : 'err', text: publishMsg }));
    }
  }

  /* ---------- alan üreticileri ---------- */
  function field(label, input, hint) { return h('label', { 'class': 'field' }, [h('span', { text: label }), input, hint ? h('small', { text: hint }) : null]); }
  function bindText(obj, key, props, multiline) {
    var n = h(multiline ? 'textarea' : 'input', Object.assign({ type: multiline ? undefined : 'text', value: obj[key] == null ? '' : obj[key] }, props || {}));
    n.addEventListener('input', function () { obj[key] = n.value; setDirty(true); });
    return n;
  }

  /* ---------- Genel bilgiler ---------- */
  function paneGenel() {
    head('Genel bilgiler', 'Telefon, adres ve bağlantılar. Boş bıraktığınız alan sitede "yakında eklenecek" olarak görünür.');
    var c = S.config;
    var map = bindText(c, 'mapEmbedUrl', { placeholder: 'https://www.google.com/maps/embed?pb=…' });
    map.addEventListener('change', function () {
      var m = /src\s*=\s*["']([^"']+)["']/i.exec(map.value);
      if (m) { map.value = c.mapEmbedUrl = m[1]; setDirty(true); }
    });
    var demo = h('input', { type: 'checkbox', checked: !!c.demo });
    demo.addEventListener('change', function () { c.demo = demo.checked; setDirty(true); });
    paneEl.appendChild(h('div', { 'class': 'card' }, [
      h('div', { 'class': 'row' }, [
        field('Telefon', bindText(c, 'phone', { type: 'tel', placeholder: '+90 424 000 00 00' })),
        field('Instagram', bindText(c, 'instagram', { placeholder: 'loftcafe veya tam adres' }), 'Kullanıcı adı ya da profil adresi.')
      ]),
      field('Adres', bindText(c, 'address', { rows: 3 }, true), 'Birden fazla satır yazabilirsiniz.'),
      field('Harita', map, 'Google Haritalar > Paylaş > Haritayı yerleştir. Kodun tamamını yapıştırabilirsiniz, adresi kendisi ayıklar.'),
      field('Yol tarifi bağlantısı (isteğe bağlı)', bindText(c, 'directionsUrl', { type: 'url', placeholder: 'https://maps.app.goo.gl/…' }), 'Boşsa ve adres yazılıysa otomatik oluşturulur.')
    ]));
    paneEl.appendChild(h('div', { 'class': 'card' }, [
      h('label', { 'class': 'check' }, [demo, h('span', { text: 'Menüde "bu menü örnek içeriktir" uyarısını göster. Gerçek menüyü girdiyseniz kapatın.' })])
    ]));
  }

  /* ---------- Çalışma saatleri ---------- */
  function paneSaatler() {
    head('Çalışma saatleri', '09:00 – 23:00 biçiminde yazın. Gece yarısını geçen saatler de olur (18:00 – 02:00). Site "şu an açığız" bilgisini buna göre gösterir.');
    var card = h('div', { 'class': 'card' });
    var list = h('div', { 'class': 'hours' });
    S.config.hours.forEach(function (row) {
      var inp = bindText(row, 'time', { placeholder: '09:00 – 23:00', 'aria-label': row.day });
      list.appendChild(h('div', { 'class': 'hours__row' }, [
        h('strong', { text: row.day }), h('span', {}, [inp]),
        h('button', { 'class': 'btn btn--ghost btn--sm', type: 'button', text: 'Kapalı', onclick: function () { row.time = 'Kapalı'; inp.value = 'Kapalı'; setDirty(true); } })
      ]));
    });
    var all = h('button', { 'class': 'btn btn--ghost btn--sm', type: 'button', text: 'Pazartesi saatini tüm günlere uygula', onclick: function () {
      var t = S.config.hours[0].time;
      S.config.hours.forEach(function (r) { r.time = t; });
      setDirty(true); renderShell();
    } });
    card.appendChild(list); card.appendChild(all);
    paneEl.appendChild(card);
  }

  /* ---------- Menü ---------- */
  function slugify(s) {
    var map = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' };
    return s.toLowerCase().replace(/[çğıöşü]/g, function (m) { return map[m]; }).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
  }
  function move(arr, i, d) { var j = i + d; if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; setDirty(true); renderShell(); }

  function paneMenu() {
    head('Menü', 'Kategorileri ve ürünleri düzenleyin. Fiyat alanına 95 yazarsanız sitede "95 ₺" görünür; boş bırakırsanız "Fiyat yakında" yazar.');
    S.menu.forEach(function (cat, ci) { paneEl.appendChild(catView(cat, ci)); });

    var nameInp = h('input', { type: 'text', placeholder: 'Yeni kategori adı', 'aria-label': 'Yeni kategori adı' });
    var addCat = function () {
      var name = nameInp.value.trim(); if (!name) { nameInp.focus(); return; }
      var id = slugify(name) || 'kategori', base = id, n = 2;
      while (S.menu.some(function (c) { return c.id === id; })) id = base + '-' + n++;
      S.menu.push({ id: id, name: name, art: 'bean', lead: '', note: '', items: [] });
      openCats[id] = true; setDirty(true); renderShell();
    };
    nameInp.addEventListener('keydown', function (e) { if (e.key === 'Enter') addCat(); });
    paneEl.appendChild(h('div', { 'class': 'card' }, [h('h3', { text: 'Kategori ekle' }), h('div', { 'class': 'row' }, [nameInp, h('button', { 'class': 'btn', type: 'button', text: 'Kategori ekle', onclick: addCat })])]));
  }

  function catView(cat, ci) {
    var d = h('details', { 'class': 'cat', open: !!openCats[cat.id] });
    d.addEventListener('toggle', function () { openCats[cat.id] = d.open; });
    var title = h('span', { 'class': 'cat__name', text: cat.name });
    d.appendChild(h('summary', {}, [title, h('span', { 'class': 'cat__meta', text: cat.items.length + ' ürün' }), h('span', { 'class': 'cat__sp' }),
      h('button', { 'class': 'icon-btn', type: 'button', 'aria-label': 'Kategoriyi yukarı taşı', text: '↑', disabled: ci === 0, onclick: function (e) { e.preventDefault(); move(S.menu, ci, -1); } }),
      h('button', { 'class': 'icon-btn', type: 'button', 'aria-label': 'Kategoriyi aşağı taşı', text: '↓', disabled: ci === S.menu.length - 1, onclick: function (e) { e.preventDefault(); move(S.menu, ci, 1); } })
    ]));

    var nameInp = bindText(cat, 'name', { maxlength: 60 });
    nameInp.addEventListener('input', function () { title.textContent = cat.name || 'Adsız kategori'; });
    var icon = h('select', {}, ART.icons ? Object.keys(ART.icons).map(function (k) { return h('option', { value: k, text: ICON_NAMES[k] || k, selected: cat.art === k }); }) : []);
    icon.value = cat.art || 'bean';
    icon.addEventListener('change', function () { cat.art = icon.value; setDirty(true); });

    var items = h('div', { 'class': 'items' }, [h('div', { 'class': 'items__head' }, [h('span', { text: 'Ürün' }), h('span', { text: 'Açıklama' }), h('span', { text: 'Fiyat' }), h('span', { text: 'Etiket' }), h('span')])]);
    cat.items.forEach(function (it, ii) {
      var price = h('input', { type: 'text', inputmode: 'decimal', value: it.price == null ? '' : String(it.price), placeholder: '95', 'aria-label': 'Fiyat' });
      price.addEventListener('input', function () { it.price = price.value.trim() === '' ? null : price.value; setDirty(true); });
      items.appendChild(h('div', { 'class': 'item' }, [
        bindText(it, 'name', { maxlength: 80, placeholder: 'Ürün adı', 'aria-label': 'Ürün adı' }),
        bindText(it, 'desc', { maxlength: 160, placeholder: 'Kısa açıklama', 'aria-label': 'Açıklama' }),
        price,
        bindText(it, 'badge', { maxlength: 20, placeholder: 'Yeni', 'aria-label': 'Etiket' }),
        h('div', { 'class': 'item__act' }, [
          h('button', { 'class': 'icon-btn', type: 'button', 'aria-label': 'Ürünü yukarı taşı', text: '↑', disabled: ii === 0, onclick: function () { move(cat.items, ii, -1); } }),
          h('button', { 'class': 'icon-btn', type: 'button', 'aria-label': 'Ürünü aşağı taşı', text: '↓', disabled: ii === cat.items.length - 1, onclick: function () { move(cat.items, ii, 1); } }),
          h('button', { 'class': 'icon-btn', type: 'button', 'aria-label': 'Ürünü sil', text: '✕', onclick: function () { cat.items.splice(ii, 1); setDirty(true); renderShell(); } })
        ])
      ]));
    });

    d.appendChild(h('div', { 'class': 'cat__body' }, [
      h('div', { 'class': 'row' }, [field('Kategori adı', nameInp), field('İkon (fotoğraf yokken görünür)', icon)]),
      field('Kısa tanıtım', bindText(cat, 'lead', { maxlength: 200 })),
      field('Not (isteğe bağlı)', bindText(cat, 'note', { maxlength: 200 }), 'Listenin altında küçük yazıyla görünür.'),
      items,
      h('div', { 'class': 'cat__actions' }, [
        h('button', { 'class': 'btn btn--ghost btn--sm', type: 'button', text: 'Ürün ekle', onclick: function () { cat.items.push({ name: '', desc: '', price: null, badge: '' }); openCats[cat.id] = true; setDirty(true); renderShell(); } }),
        h('button', { 'class': 'btn btn--danger btn--sm', type: 'button', text: 'Kategoriyi sil', onclick: function () {
          if (!confirm('"' + cat.name + '" kategorisi ve içindeki ' + cat.items.length + ' ürün silinsin mi?')) return;
          S.menu.splice(ci, 1); delete S.images['menu-' + cat.id]; setDirty(true); renderShell();
        } })
      ])
    ]));
    return d;
  }
  var ICON_NAMES = { cup: 'Fincan', mug: 'Kupa', iced: 'Soğuk içecek', cake: 'Tatlı', plate: 'Tabak', bean: 'Kahve çekirdeği', lamp: 'Lamba', window: 'Pencere', vase: 'Vazo' };

  /* ---------- Fotoğraflar ---------- */
  function paneVisible(src) { return src ? src : ''; }

  function panePhotos() {
    head('Fotoğraflar', 'Fotoğraf seçtiğinizde otomatik küçültülür ve siteye uygun biçime çevrilir. Yayınla dediğiniz anda sitede görünür.');
    var grid = h('div', { 'class': 'photos' });
    SCHEMA.images.forEach(function (im) { grid.appendChild(photoCard(im.key, im.label, im.hint + ', en çok ' + im.w + ' × ' + im.h + ' px', im.w, im.h)); });
    S.menu.forEach(function (cat) {
      var m = SCHEMA.menuImage;
      grid.appendChild(photoCard('menu-' + cat.id, 'Menü: ' + cat.name, 'Dikey, en çok ' + m.w + ' × ' + m.h + ' px', m.w, m.h));
    });
    paneEl.appendChild(grid);
  }

  function photoCard(key, label, hint, w, h2) {
    var view = h('div', { 'class': 'photo__view' });
    var act = h('div', { 'class': 'photo__act' });
    function paint() {
      view.textContent = ''; act.textContent = '';
      var src = paneVisible(S.images[key]);
      if (src) view.appendChild(h('img', { src: src.charAt(0) === '/' || /^https?:/.test(src) ? src : '/' + src, alt: label, loading: 'lazy' }));
      else view.textContent = 'Fotoğraf yok';
      var file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', hidden: true });
      file.addEventListener('change', function () { if (file.files[0]) upload(file.files[0]); });
      act.appendChild(file);
      act.appendChild(h('button', { 'class': 'btn btn--ghost btn--sm', type: 'button', text: src ? 'Değiştir' : 'Fotoğraf seç', onclick: function () { file.click(); } }));
      if (src) act.appendChild(h('button', { 'class': 'btn btn--danger btn--sm', type: 'button', text: 'Kaldır', onclick: function () { S.images[key] = ''; setDirty(true); paint(); } }));
    }
    function upload(f) {
      busy++; view.textContent = ''; view.appendChild(h('span', { 'class': 'photo__busy', text: 'Hazırlanıyor…' })); renderBar();
      compress(f, w, h2).then(function (blob) {
        return api('POST', '/api/admin/image', blob, { 'content-type': blob.type });
      }).then(function (r) {
        if (!r.ok) throw new Error(r.data.error || 'Yüklenemedi.');
        S.images[key] = r.data.url; setDirty(true);
      }).catch(function (e) { toast(e.message || 'Fotoğraf yüklenemedi.'); })
        .then(function () { busy--; paint(); renderBar(); });
    }
    paint();
    return h('div', { 'class': 'photo' }, [view, h('div', { 'class': 'photo__body' }, [h('strong', { text: label }), h('small', { text: hint }), act])]);
  }

  /* Tarayıcıda küçült: hedef boyuta sığdır, WebP'ye çevir, ~450 KB altına in */
  function loadBitmap(file) {
    if (window.createImageBitmap) return createImageBitmap(file).catch(function () { return viaImg(); });
    return viaImg();
    function viaImg() {
      return new Promise(function (res, rej) {
        var url = URL.createObjectURL(file), img = new Image();
        img._url = url;
        img.onload = function () { res(img); };
        img.onerror = function () { release(img); rej(new Error('Bu dosya okunamadı.')); };
        img.src = url;
      });
    }
  }
  /* Geçici adresi ve çözülmüş görüntü belleğini bırak (başarı, hata, ne olursa olsun) */
  function release(img) {
    if (img._url) { URL.revokeObjectURL(img._url); img._url = null; }
    if (typeof img.close === 'function') img.close();
  }
  function toBlob(canvas, type, q) { return new Promise(function (res) { canvas.toBlob(res, type, q); }); }
  function compress(file, maxW, maxH) {
    return loadBitmap(file).then(function (img) {
      var w0 = img.width || img.naturalWidth, h0 = img.height || img.naturalHeight;
      var scale = Math.min(1, maxW / w0, maxH / h0);
      var LIMIT = 450 * 1024, qualities = [0.86, 0.78, 0.7, 0.6, 0.5], tries = 0;
      function attempt() {
        var canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w0 * scale)); canvas.height = Math.max(1, Math.round(h0 * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        var i = 0;
        function next() {
          return toBlob(canvas, 'image/webp', qualities[i]).then(function (b) {
            if (!b || b.type !== 'image/webp') return toBlob(canvas, 'image/jpeg', qualities[i]);
            return b;
          }).then(function (b) {
            if (b.size <= LIMIT || (i === qualities.length - 1 && b.size <= 880 * 1024)) return b;
            if (++i < qualities.length) return next();
            scale *= 0.75; if (++tries > 4) throw new Error('Fotoğraf çok büyük, daha küçük bir dosya deneyin.');
            return attempt();
          });
        }
        return next();
      }
      return attempt().then(function (b) { release(img); return b; }, function (e) { release(img); throw e; });
    });
  }

  /* ---------- Site yazıları ---------- */
  function paneTexts() {
    head('Site yazıları', 'Sitedeki başlık ve açıklamalar. Değiştirmediğiniz yazılar olduğu gibi kalır; boşaltırsanız ilk hâline döner.');
    var groups = {};
    SCHEMA.texts.forEach(function (t) { (groups[t.group] = groups[t.group] || []).push(t); });
    Object.keys(groups).forEach(function (g) {
      paneEl.appendChild(h('div', { 'class': 'card' }, [h('h3', { text: g })].concat(groups[g].map(function (t) {
        return field(t.label, bindText(S.texts, t.key, { maxlength: 600, rows: t.long ? 3 : undefined, placeholder: DEF_TEXTS[t.key] || '' }, !!t.long));
      }))));
    });
  }

  /* ---------- yayınla ---------- */
  function payload() {
    var cfg = clone(S.config);
    var menu = clone(S.menu).map(function (cat) {
      cat.items.forEach(function (it) {
        if (typeof it.price === 'string') {
          var t = it.price.trim();
          it.price = /^\d+([.,]\d+)?$/.test(t) ? parseFloat(t.replace(',', '.')) : (t || null);
        }
      });
      cat.items = cat.items.filter(function (it) { return it.name && it.name.trim(); });
      return cat;
    });
    var texts = {};
    SCHEMA.texts.forEach(function (t) { var v = (S.texts[t.key] || '').trim(); if (v && v !== DEF_TEXTS[t.key]) texts[t.key] = v; });
    var images = {};
    Object.keys(S.images).forEach(function (k) {
      var v = S.images[k] || '';
      if (/^\/api\/img\//.test(v)) images[k] = v;
      /* Kaldırılan fotoğraf: dosyada varsayılan bir görsel varsa "boş" olarak kaydet ki o geri gelmesin */
      else if (v === '' && (CFG0.images || {})[k]) images[k] = '';
    });
    return { config: cfg, menu: menu, texts: texts, images: images };
  }

  function publish() {
    if (busy) return;
    var btn = barEl.querySelector('.btn:not(.btn--ghost)'); if (btn) { btn.disabled = true; btn.textContent = 'Yayınlanıyor…'; }
    api('PUT', '/api/admin/content', JSON.stringify({ baseRev: rev, content: payload() }), { 'content-type': 'application/json' })
      .then(function (r) {
        if (r.ok) {
          rev = r.data.rev; dirty = false;
          publishMsg = 'Yayınlandı. Açık olan sayfalar birkaç saniye içinde kendiliğinden güncellenir.';
          toast('Yayınlandı'); renderBar();
          setTimeout(function () { if (!dirty) { publishMsg = ''; renderBar(); } }, 6000);
        } else if (r.status === 401) { dirty = false; toast('Oturum süresi doldu. Yeniden giriş yapın.'); boot(); }
        else { publishMsg = r.data.error || 'Yayınlanamadı.'; renderBar(); if (r.status === 409) { barEl.appendChild(h('button', { 'class': 'btn btn--ghost btn--sm', type: 'button', text: 'Yenile', onclick: function () { dirty = false; loadEditor(); } })); } }
      }).catch(function () { publishMsg = 'Bağlantı hatası. Tekrar deneyin.'; renderBar(); });
  }

  boot();
})();
