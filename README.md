# LOFT — Kafe web sitesi

Siyah, antrasit ve metalik altın temalı, tek sayfalık statik site. HTML5, CSS3 ve vanilla JavaScript; kütüphane ya da derleme adımı yok.

## Dosya yapısı

```
index.html          Tüm bölümler (ana sayfa, hakkımızda, menü, galeri, iletişim)
404.html            Bulunamadı sayfası
css/style.css       Tüm stiller (bölümlere ayrılmış)
js/config.js        Telefon, adres, Instagram, harita, saatler, fotoğraf yolları
js/menu-data.js     Menü kategorileri, ürünler, fiyatlar
js/art.js           Fotoğraf gelene kadar görünen altın çizgi ikonlar (LOFT_ART.get)
js/hero-bg.js       Hero'daki hareketli koyu arka plan (altın ışık halkaları ve toz)
js/main.js          Navigasyon, mobil menü, menü sekmeleri, çalışma saati durumu, galeri, animasyonlar
js/live.js          Admin panelinde yayınlanan içeriği siteye uygular, açık sayfaları canlı günceller
js/live-schema.js   Panelden düzenlenebilen yazı ve fotoğraf alanlarının listesi
admin/              Yönetim paneli (adres: /admin/)
functions/          Cloudflare Pages Functions: API, giriş, fotoğraf ve içerik kaydı
images/             Fotoğraflar (images/README.md boyutları listeler)
favicon.svg · site.webmanifest · robots.txt · sitemap.xml · _headers
```

## Yönetim paneli (canlı güncelleme)

Panel `https://alanadiniz.com/admin/` adresinde açılır. Telefon, adres, Instagram, harita, çalışma saatleri, menü (kategori, ürün, fiyat, etiket), tüm fotoğraflar ve sitedeki başlık/açıklama yazıları panelden değiştirilir. **Değişiklikleri yayınla** dediğiniz anda içerik kaydedilir; siteyi açık tutan ziyaretçilerin sayfaları yenilenmeden, en geç yaklaşık 10 saniyede güncellenir. Sayfayı yeni açanlar zaten güncel hâlini görür.

### Kurulum (bir kez, Cloudflare panelinden, yaklaşık 5 dakika)

1. **Veritabanı oluşturun:** Cloudflare > Storage & Databases > D1 SQL database > Create. Adı `loft-db` olabilir. Tabloları site kendisi oluşturur.
2. **Veritabanını bağlayın:** Pages projesi > Settings > Bindings > Add > D1 database. Variable name **`DB`** (büyük harfle), database olarak `loft-db`.
3. **Şifre belirleyin:** Settings > Variables and secrets > Add. Name **`ADMIN_PASSWORD`**, tür **Secret**, değer olarak uzun ve tahmin edilmesi zor bir şifre.
4. **Yeniden yayınlayın:** Deployments > son yayının yanındaki ⋯ > Retry deployment (ya da GitHub'a yeni bir commit gönderin).
5. `/admin/` adresini açıp şifrenizle girin. Ayarlar eksikse panel neyin eksik olduğunu kendisi gösterir.

### Bilmeniz gerekenler

- Panelden ilk kez yayınladıktan sonra içerik panelden yönetilir. Kaydedilen alanlar için `config.js` ve `menu-data.js` içindeki değerler artık geçerli olmaz; bu dosyalar yedek varsayılan olarak kalır. Panelde boşalttığınız yazılar, sitedeki ilk hâline döner.
- Fotoğraflar panelde otomatik küçültülür (WebP, yaklaşık 450 KB altı) ve veritabanında saklanır; ayrıca bir depolama hizmeti gerekmez.
- Güvenlik: şifre yalnızca Cloudflare'de durur, depoya yazılmaz. 15 dakikada 5 hatalı denemeden sonra giriş geçici olarak kilitlenir. Oturum 7 gün sürer. `/admin/` arama motorlarına kapalıdır.
- Aynı anda iki kişi düzenlerse ikincisinin kaydı, ilkinin değişikliğini ezmesin diye uyarıyla durdurulur.
- Ücretsiz Cloudflare planında günlük 100.000 istek hakkı vardır. Açık ve görünür her sekme 10 saniyede bir çok küçük bir sürüm kontrolü yapar; sekme arka plandayken durur. Bir kafe sitesi için bu yeterlidir.
- Yerel deneme: `npx wrangler pages dev . --d1 DB=loft-db` komutu ve proje köküne `.dev.vars` dosyası (`ADMIN_PASSWORD=denemesifresi`). `.dev.vars` dosyasını GitHub'a göndermeyin.
- Panel ve API olmadan da (yerel dosya, başka barındırma) site, dosyalardaki içerikle eskisi gibi çalışır.

## Müşteri bilgilerini elle girme (panel kullanılmıyorsa)

Verilmeyen bilgiler uydurulmadı. Telefon, adres, Instagram, saatler ve fiyatlar boş bırakıldı; sitede "yakında eklenecek" olarak görünür ve ilgili butonlar bunu bir bildirimle söyler.

1. `js/config.js`: telefon, adres, Instagram, harita bağlantısı ve çalışma saatlerini yazın. Butonlar (Ara, Yol tarifi, Instagram) otomatik çalışır hale gelir.
2. `js/menu-data.js`: ürün adlarını ve `price` alanlarını gerçek menüyle değiştirin. `config.js` içinde `demo: false` yaparak "örnek menü" uyarısını kapatın.
3. Fotoğrafları `images/` klasörüne koyun ve yollarını `config.js` içindeki `images` bölümüne yazın.
4. Sitedeki yazılar (hakkımızda, slogan) taslaktır; marka diline göre `index.html` içinde düzenleyin.

## Notlar

- **Hero animasyonu:** Hero görünmediğinde ya da sekme arka plandayken durur. "Hareketi azalt" ayarı açık olan cihazlarda tek sabit kare gösterir. Yoğunluğu `js/hero-bg.js` içinde `a:` (ışık parlaklığı) ve `orbCount` değerlerinden ayarlayabilirsiniz.
- **Fiyatlar:** `menu-data.js` içinde `price: 95` yazarsanız "95 ₺" olarak görünür. `badge: "Yeni"` ile ürüne etiket eklenebilir.
- **Çalışma saatleri:** `config.js` içine `"09:00 – 23:00"` biçiminde yazarsanız site "Şu an açığız / kapalıyız" bilgisini kendisi gösterir (gece yarısını aşan saatler dahil). "Kapalı" yazılan günler de desteklenir.
- **Fotoğraflar:** Henüz eklenmedi. İzin verilen kaynaklardan (kendi çekimleriniz ya da lisanslı/Unsplash fotoğrafları) bir görseli `config.js` içindeki `images` alanına dosya yolu ya da tam adres olarak yazmanız yeterli.

## Yerelde açma

`index.html` dosyasına çift tıklamak yeterli. İsterseniz küçük bir sunucu da kullanabilirsiniz:

```
python3 -m http.server 8000
```

## GitHub ve Cloudflare Pages ile yayınlama

1. Klasörü bir GitHub deposuna gönderin (`git init`, `git add .`, `git commit`, `git push`).
2. Cloudflare Dashboard > Workers & Pages > Create > Pages > Connect to Git ile depoyu seçin.
3. Build ayarları: Framework preset **None**, build command **boş**, output directory **/** (kök).
4. Yayına alınca özel alan adını bağlayın.

## Yayından önce kontrol listesi

- [ ] `YOUR-DOMAIN.com` ifadesini şu dosyalarda gerçek alan adıyla değiştirin: `index.html` (canonical, og:url, JSON-LD), `sitemap.xml`, `robots.txt`.
- [ ] `index.html` içinde `og:image` satırını açın ve `images/og-cover.jpg` ekleyin.
- [ ] Gerçek adres, telefon ve saatleri girin; JSON-LD'ye (`index.html` başı) `address`, `telephone`, `openingHours` alanlarını ekleyin.
- [ ] Yazı tipleri Google Fonts'tan yüklenir. İsterseniz Jost ve Newsreader'ı indirip `css/` yanına koyarak kendi sunucunuzdan yayınlayın.

## Erişilebilirlik ve performans

- Klavye ile tam gezinme, görünür odak, "içeriğe geç" bağlantısı, ARIA sekmeleri ve modal galeri.
- `prefers-reduced-motion` açıkken animasyonlar kapanır.
- Bağımlılık yok; JS yaklaşık 15 KB, CSS yaklaşık 25 KB. Fotoğraflar `loading="lazy"` ile yüklenir (hero hariç).
