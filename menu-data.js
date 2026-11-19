/* ==========================================================================
   LOFT — menu-data.js
   Menü içeriği. Ürün adları ve açıklamalar ÖRNEKTİR; gerçek menü ile değiştirin.

   Ürün alanları:
     name   (zorunlu)  Ürün adı
     desc   (isteğe bağlı) Kısa açıklama
     price  Sayı (95) ya da metin ("95 ₺", "95 / 120 ₺"). null ise "Fiyat yakında" görünür.
     badge  (isteğe bağlı) Küçük etiket, örn. "Yeni", "Önerilen"
   Kategori alanları: id, name, art (ikon adı: js/art.js), lead, note (isteğe bağlı), items
   Kategori görselleri js/config.js içinde "menu-<id>" anahtarıyla bağlanır.
   ========================================================================== */
window.LOFT_MENU = [
  {
    id: "kahveler",
    name: "Kahveler",
    art: "cup",
    lead: "Espresso tabanlı klasikler ve filtre seçenekleri.",
    items: [
      { name: "Espresso",      desc: "Yoğun ve sade.",                       price: null },
      { name: "Americano",     desc: "Uzun, yumuşak içimli.",                price: null },
      { name: "Flat White",    desc: "Kadifemsi süt dokusu.",                price: null },
      { name: "Latte",         desc: "Süt ağırlıklı, yumuşak.",              price: null },
      { name: "Cappuccino",    desc: "Espresso, süt ve köpüğün dengesi.",    price: null },
      { name: "Türk Kahvesi",  desc: "Geleneksel sunumla.",                  price: null }
    ]
  },
  {
    id: "soguk",
    name: "Soğuk İçecekler",
    art: "iced",
    lead: "Buz gibi, ferah ve sade.",
    items: [
      { name: "Iced Latte",     desc: "Buzlu süt ve espresso.",       price: null },
      { name: "Cold Brew",      desc: "Uzun demlenmiş, serin.",       price: null },
      { name: "Iced Americano", desc: "Temiz ve ferah.",              price: null },
      { name: "Limonata",       desc: "Ekşi ve tatlı dengesi.",       price: null },
      { name: "Buzlu Çay",      desc: "Meyve aromalı.",               price: null }
    ]
  },
  {
    id: "sicak",
    name: "Sıcak İçecekler",
    art: "mug",
    lead: "Kahve dışındaki sıcak seçenekler.",
    items: [
      { name: "Çay",            desc: "Klasik demleme.",              price: null },
      { name: "Sıcak Çikolata", desc: "Yoğun ve kremamsı.",           price: null },
      { name: "Bitki Çayı",     desc: "Günün sonu için.",             price: null },
      { name: "Chai Latte",     desc: "Baharatlı ve sıcak.",          price: null }
    ]
  },
  {
    id: "tatlilar",
    name: "Tatlılar",
    art: "cake",
    lead: "Kahvenin yanına yakışan dilimler.",
    items: [
      { name: "Cheesecake",     desc: "Kremsi dokulu.",               price: null },
      { name: "Tiramisu",       desc: "Kahveli ve hafif.",            price: null },
      { name: "Brownie",        desc: "Yoğun çikolatalı.",            price: null },
      { name: "Cookie",         desc: "Yumuşak içli.",                price: null },
      { name: "Günün Tatlısı",  desc: "Vitrindeki seçki.",            price: null }
    ]
  },
  {
    id: "yiyecekler",
    name: "Yiyecekler",
    art: "plate",
    lead: "Gün boyu hafif ve doyurucu seçenekler.",
    items: [
      { name: "Kruvasan",         desc: "Sade ya da dolgulu.",        price: null },
      { name: "Tost",             desc: "Sıcak ve çıtır.",            price: null },
      { name: "Sandviç",          desc: "Taze malzemelerle.",         price: null },
      { name: "Kahvaltı Tabağı",  desc: "Paylaşmalık seçki.",         price: null },
      { name: "Günün Salatası",   desc: "Hafif ve taze.",             price: null }
    ]
  }
];

/* Yardımcılar: main.js bunları kullanır, değiştirmenize gerek yok. */
window.LOFT_MENU_UTILS = {
  /* 95 -> "95 ₺", "95 ₺" -> "95 ₺", null/"" -> null */
  formatPrice: function (price) {
    if (price === null || price === undefined || price === "") return null;
    if (typeof price === "number" && isFinite(price)) {
      var text;
      try { text = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(price); }
      catch (e) { text = String(price); }
      return text + " ₺";
    }
    return String(price);
  }
};
