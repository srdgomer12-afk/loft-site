# LOFT görselleri

Fotoğrafları bu klasöre koyun, ardından `js/config.js` içindeki `images` bölümüne dosya yolunu yazın.
Yolu boş bırakılan alanda altın çizgili yer tutucu görünür. Hiçbir HTML değişikliği gerekmez.

| config anahtarı | Nerede görünür | Önerilen oran / boyut |
|---|---|---|
| `hero` | Ana sayfa tam ekran arka plan | Yatay, 2400 × 1400 px |
| `about-1` | Hakkımızda büyük görsel | Dikey 4:5, 1200 × 1500 px |
| `about-2` | Hakkımızda küçük görsel | Kare, 900 × 900 px |
| `about-3` | Hakkımızda sunum görseli | Yatay 4:3, 1600 × 1200 px |
| `menu-kahveler`, `menu-soguk`, `menu-sicak`, `menu-tatlilar`, `menu-yiyecekler` | Menü kategori kartı ve panel görseli | Dikey 4:5, 1000 × 1250 px |
| `g1` | Galeri, büyük iç mekân karesi | Kare, 1600 × 1600 px |
| `g2` | Galeri, dikey kahve karesi | Dikey 1:2, 900 × 1800 px |
| `g3`, `g4`, `g6`, `g7` | Galeri, küçük kareler | Kare, 900 × 900 px |
| `g5` | Galeri, geniş kare | Yatay 2:1, 1800 × 900 px |

Hızlı yüklenme için:
- JPG ya da WebP kullanın; her görsel mümkünse 300 KB altında olsun (hero için 500 KB'a kadar).
- Fotoğraflar siyah/altın tona uyumlu olsun: koyu fon, sıcak ışık, az doygun renk.
- Paylaşım önizlemesi için `og-cover.jpg` (1200 × 630 px) hazırlayıp `index.html` içindeki `og:image` satırını açın.
