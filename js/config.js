/* ==========================================================================
   LOFT — config.js
   Sitedeki tüm değiştirilebilir bilgiler burada. HTML'e dokunmadan
   telefon, adres, Instagram, harita, saatler ve fotoğrafları buradan girin.
   Boş bırakılan alanlar sitede "yakında eklenecek" olarak görünür.
   ========================================================================== */
window.LOFT_CONFIG = {

  /* Menü bölümündeki "örnek içerik" uyarısı. Gerçek menü girilince false yapın. */
  demo: true,

  /* Telefon. Örnek: "+90 212 000 00 00" */
  phone: "",

  /* Adres. Birden fazla satır için \n kullanın. Örnek: "Örnek Mah. Örnek Sk. No:1\nİstanbul" */
  address: "",

  /* Instagram. Kullanıcı adı ("loftcafe") ya da tam adres ("https://instagram.com/loftcafe") */
  instagram: "",

  /* Harita. Google Haritalar > Paylaş > Haritayı yerleştir > iframe içindeki src adresi.
     Boş bırakılırsa şık bir yer tutucu gösterilir. */
  mapEmbedUrl: "",

  /* İsteğe bağlı: yol tarifi bağlantısı. Boşsa ve adres girilmişse otomatik oluşturulur. */
  directionsUrl: "",

  /* Çalışma saatleri (Pazartesi'den Pazar'a). Örnek: "09:00 – 23:00" veya "Kapalı" */
  hours: [
    { day: "Pazartesi", time: "" },
    { day: "Salı",      time: "" },
    { day: "Çarşamba",  time: "" },
    { day: "Perşembe",  time: "" },
    { day: "Cuma",      time: "" },
    { day: "Cumartesi", time: "" },
    { day: "Pazar",     time: "" }
  ],

  /* Fotoğraflar. Dosyayı images/ klasörüne koyup yolunu yazın (örn. "images/hero.jpg").
     Boş olan alanlarda altın çizgili yer tutucu görünür. Önerilen boyutlar images/README.md içinde. */
  images: {
    "hero": "",

    "about-1": "",
    "about-2": "",
    "about-3": "",

    "menu-kahveler": "",
    "menu-soguk": "",
    "menu-sicak": "",
    "menu-tatlilar": "",
    "menu-yiyecekler": "",

    "g1": "",
    "g2": "",
    "g3": "",
    "g4": "",
    "g5": "",
    "g6": "",
    "g7": ""
  }
};
