/* ==========================================================================
   LOFT — live-schema.js
   Admin panelinden düzenlenebilen yazılar ve fotoğraf alanları.
   Yazılar, sayfadaki öğeyi CSS seçicisiyle bulur; HTML'e dokunmak gerekmez.
   Admin hiçbir şey değiştirmezse sitedeki mevcut yazı aynen kalır.
   ========================================================================== */
window.LOFT_LIVE_SCHEMA = {
  texts: [
    { key: 'heroSlogan',  group: 'Ana sayfa',  label: 'Slogan',                sel: '.hero__slogan' },
    { key: 'heroLead',    group: 'Ana sayfa',  label: 'Giriş yazısı',          sel: '.hero__lead', long: true },
    { key: 'aboutTitle',  group: 'Hakkımızda', label: 'Başlık',                sel: '#about-title', long: true },
    { key: 'aboutP1',     group: 'Hakkımızda', label: 'Birinci paragraf',      sel: '.about__text > p:nth-of-type(1)', long: true },
    { key: 'aboutP2',     group: 'Hakkımızda', label: 'İkinci paragraf',       sel: '.about__text > p:nth-of-type(2)', long: true },
    { key: 'fact1Title',  group: 'Hakkımızda', label: 'Özellik 1 başlığı',     sel: '.facts__row:nth-child(1) dt' },
    { key: 'fact1Text',   group: 'Hakkımızda', label: 'Özellik 1 açıklaması',  sel: '.facts__row:nth-child(1) dd', long: true },
    { key: 'fact2Title',  group: 'Hakkımızda', label: 'Özellik 2 başlığı',     sel: '.facts__row:nth-child(2) dt' },
    { key: 'fact2Text',   group: 'Hakkımızda', label: 'Özellik 2 açıklaması',  sel: '.facts__row:nth-child(2) dd', long: true },
    { key: 'fact3Title',  group: 'Hakkımızda', label: 'Özellik 3 başlığı',     sel: '.facts__row:nth-child(3) dt' },
    { key: 'fact3Text',   group: 'Hakkımızda', label: 'Özellik 3 açıklaması',  sel: '.facts__row:nth-child(3) dd', long: true },
    { key: 'menuLead',    group: 'Bölüm yazıları', label: 'Menü bölümü alt yazısı',    sel: '#menu .sec-lead', long: true },
    { key: 'galleryLead', group: 'Bölüm yazıları', label: 'Galeri bölümü alt yazısı',  sel: '#galeri .sec-lead', long: true },
    { key: 'contactTitle',group: 'Bölüm yazıları', label: 'İletişim bölümü başlığı',   sel: '#contact-title' },
    { key: 'contactLead', group: 'Bölüm yazıları', label: 'İletişim bölümü alt yazısı',sel: '#iletisim .sec-lead', long: true },
    { key: 'footerTag',   group: 'Bölüm yazıları', label: 'Sayfa altı sloganı',        sel: '.footer__tag' }
  ],

  /* Sabit fotoğraf alanları. Menü kategorilerinin fotoğrafları ("menu-<id>") kategoriden türetilir. */
  images: [
    { key: 'hero',    label: 'Ana sayfa arka planı',     hint: 'Yatay',   w: 2400, h: 1400 },
    { key: 'about-1', label: 'Hakkımızda 1: Mekân',      hint: 'Dikey',   w: 1200, h: 1500 },
    { key: 'about-2', label: 'Hakkımızda 2: Kahve',      hint: 'Kare',    w: 900,  h: 900 },
    { key: 'about-3', label: 'Hakkımızda 3: Sunum',      hint: 'Yatay',   w: 1600, h: 1200 },
    { key: 'g1',      label: 'Galeri 1: Kafe iç mekânı', hint: 'Kare',    w: 1600, h: 1600 },
    { key: 'g2',      label: 'Galeri 2: Kahve sunumu',   hint: 'Dikey',   w: 900,  h: 1800 },
    { key: 'g3',      label: 'Galeri 3: Tatlılar',       hint: 'Kare',    w: 900,  h: 900 },
    { key: 'g4',      label: 'Galeri 4: Masa ve dekor',  hint: 'Kare',    w: 900,  h: 900 },
    { key: 'g5',      label: 'Galeri 5: Işık ve atmosfer', hint: 'Geniş', w: 1800, h: 900 },
    { key: 'g6',      label: 'Galeri 6: Soğuk içecekler',hint: 'Kare',    w: 900,  h: 900 },
    { key: 'g7',      label: 'Galeri 7: Yiyecekler',     hint: 'Kare',    w: 900,  h: 900 }
  ],
  menuImage: { w: 1000, h: 1250 }
};
