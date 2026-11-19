/* ==========================================================================
   LOFT — art.js
   Fotoğraf yüklenene kadar (ya da hiç eklenmediyse) görünen altın çizgi ikonlar.
   Kullanım: LOFT_ART.get('cup') -> SVG metni. Bilinmeyen ad için varsayılan ikon döner.
   Yeni ikon eklemek için icons içine aynı biçimde bir satır ekleyin.
   ========================================================================== */
(function () {
  'use strict';

  var open = '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
  var close = '</svg>';

  var icons = {
    cup: open +
      '<ellipse cx="60" cy="92" rx="38" ry="7"/>' +
      '<path d="M32 50h50v18c0 13-11 22-25 22S32 81 32 68z"/>' +
      '<path d="M82 56h6c8 0 8 16 0 16h-8"/>' +
      '<path d="M46 40c-4-5 4-8 0-14M60 40c-4-5 4-8 0-14M74 40c-4-5 4-8 0-14"/>' + close,

    mug: open +
      '<path d="M30 54h46v22c0 14-10 24-23 24S30 90 30 76z"/>' +
      '<path d="M76 60h6c9 0 9 18 0 18h-6"/>' +
      '<path d="M53 54V36l10-6"/>' +
      '<rect x="62" y="21" width="12" height="9" transform="rotate(-20 68 25)"/>' +
      '<path d="M40 44c-3-4 3-6 0-10M66 44c-3-4 3-6 0-10" opacity=".6"/>' + close,

    iced: open +
      '<path d="M36 34h48l-6 56c-.5 5-4 8-9 8H51c-5 0-8.5-3-9-8z"/>' +
      '<path d="M38 50h44"/>' +
      '<rect x="48" y="58" width="14" height="14" rx="2" transform="rotate(-12 55 65)"/>' +
      '<rect x="62" y="68" width="14" height="14" rx="2" transform="rotate(10 69 75)"/>' +
      '<path d="M68 34l9-20h9"/>' + close,

    cake: open +
      '<ellipse cx="60" cy="96" rx="44" ry="6"/>' +
      '<path d="M24 90V52l72-12v50z"/>' +
      '<path d="M24 64l72-12M24 77l72-12"/>' +
      '<circle cx="60" cy="41" r="5"/>' +
      '<path d="M60 36q3-7 9-8"/>' + close,

    plate: open +
      '<circle cx="60" cy="62" r="30"/><circle cx="60" cy="62" r="20"/>' +
      '<path d="M14 34v18c0 5 3 7 6 7s6-2 6-7V34M20 34v54"/>' +
      '<path d="M104 34c-7 7-9 18-7 30h7v24"/>' + close,

    bean: open +
      '<g transform="rotate(35 60 60)"><ellipse cx="60" cy="60" rx="26" ry="38"/>' +
      '<path d="M60 22c-9 13 9 23 0 38s9 25 0 38"/></g>' + close,

    lamp: open +
      '<path d="M60 8v34"/>' +
      '<path d="M34 76c0-22 12-34 26-34s26 12 26 34z"/>' +
      '<path d="M52 76a8 8 0 0 0 16 0"/>' +
      '<path d="M30 96l-8 8M60 100v10M90 96l8 8" opacity=".6"/>' + close,

    window: open +
      '<rect x="22" y="14" width="76" height="92"/>' +
      '<path d="M60 14v92M22 44h76M22 75h76"/>' + close,

    vase: open +
      '<path d="M46 108h28M50 108c-10-12-12-30-2-42l6-8h12l6 8c10 12 8 30-2 42"/>' +
      '<path d="M60 58V20M60 44c-8-4-14-12-14-20M60 34c8-4 12-10 12-18"/>' + close
  };

  window.LOFT_ART = {
    icons: icons,
    /* Bilinmeyen ya da boş ad için kahve çekirdeği ikonu döner */
    get: function (name) { return icons[name] || icons.bean; },
    has: function (name) { return Object.prototype.hasOwnProperty.call(icons, name); }
  };
})();
