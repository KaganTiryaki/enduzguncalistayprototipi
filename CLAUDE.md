# CLAUDE.md — MFL FBÇ '26 Proje Kuralları

Bu proje **Maltepe Fen Lisesi Fen Bilimleri Çalıştayı 2026** tanıtım sitesidir. Statik, Türkçe içerikli, vanilla HTML/CSS/JS + Three.js arka plan sahnesiyle çalışır.

## Önce Bunu Yap
- Frontend değişikliklerine başlamadan önce `frontend-design` skill'ini çağır.
- Dosyayı düzenlemeden önce `css/style.css` başındaki CSS variable bloğunu oku — proje design token sistemiyle çalışıyor, hardcoded renk/spacing yazma.

## Yaratıcı İş Kuralı
Aşağıdaki işlerden birine başlamadan önce **`superpowers:brainstorming` skill'ini çağır** — önce niyeti ve gereksinimleri netleştir, sonra kodla:
- Yeni section, sayfa veya component eklemek
- Mevcut bir bölümün tasarımını/davranışını değiştirmek
- Yeni bir etkileşim (animasyon, modal, filtre) tasarlamak
- Three.js sahnesini yeniden yapılandırmak

Aşağıdaki işlerde brainstorming'e gerek yok, doğrudan yap:
- Bug fix / typo düzeltme
- Mevcut kuralları uygulayarak küçük CSS ayarı
- Dosya okuma, araştırma, açıklama
- Commit mesajı, git işlemi
- Kullanıcının net olarak tariflediği ufak değişiklik

## Proje Yapısı
```
index.html          → landing tek sayfa, tüm section'lar içinde
css/style.css       → landing stylesheet, CSS variable tabanlı
js/main.js          → navbar, modal, scroll, etkileşim
js/three-scene.js   → arka plan beyin sahnesi (Three.js)
js/scene/           → komite carousel Three.js sistemi
js/carousel.js      → komite slide picker
assets/images/      → logolar, ekip fotoğrafları, sponsor logoları

# Yemek QR Sistemi (etkinlik 9-10 Mayıs 2026)
adminpanel/         → /adminpanel/ — yetkili paneli (PIN gate, kart listesi, kabul mail)
tara/               → /tara/ — görevli QR scanner (kapıda fiziksel kart okutma)
yemekqrkodlari/     → 800 adet QR kart PNG'i (script ile üretilir)
supabase/migrations → DB schema + RPC'ler (0001-0004)
supabase/functions  → Edge function (send-kabul-mail klasörü — DİKKAT alttaki nota bak)
scripts/generate-qrs → Node script'leri: kart üretici, seed-participants, seed-pin
```

Landing bölümleri: `#hero`, `#about`, `#team`, `#sponsors`, `#komiteler`, `#program`, `#contact`.

## Yemek QR Sistemi — Önemli Notlar
- **Mimari:** Her katılımcıya fiziksel QR kart (`yemekqrkodlari/png/card-NNN-{kahvalti,ogle}.png`). Kullanıcı portali YOK — sadece kapıda görevli scanner okutuyor.
- **DB (Supabase):** `cards`, `redemptions`, `staff_codes`, `people` tabloları + RLS (anon GRANT yok, sadece SECURITY DEFINER RPC'ler).
- **RPC'ler:** `redeem_meal(short_code, staff_code, ts)`, `lookup_short_code(short_code, staff_code)`, `list_cards(staff_code)`, `today_event_day()`.
- **PIN:** Tek `staff_codes.code` (default `0910`), tüm görevli/admin için ortak. Admin panel + scanner aynı PIN'i kullanır.
- **Edge function uyumsuzluğu:** Klasör adı `supabase/functions/send-kabul-mail/` ama frontend `${SUPABASE_URL}/functions/v1/yemek-mail`'e istek atıyor. Eski projeden kalma `yemek-mail` deploy'u sayesinde çalışıyor. Yeni session'da deploy etmeden önce isim hizalaması gerekli.
- **Cooldown:** 0003 migration aynı kart için 2 saat cooldown koyar; etkinlik tarihi `2026-05-09 / 2026-05-10` hardcoded — değişirse migration update lazım.
- **vercel.json:** Sadece `{"trailingSlash": false}`. Klasör isimleri direkt URL oluyor (`/adminpanel/`, `/tara/`).
- **Hassas:** `scripts/generate-qrs/.env` (service role key) gitignored. Anon key `tara/config.js`'de public — RLS sayesinde güvenli.

## Dil ve İçerik
- **Tüm kullanıcıya görünen metin Türkçe.** İngilizce placeholder yazma.
- HTML `lang="tr"`, tarih formatı gün-ay-yıl (9 Mayıs 2026).
- Tonu profesyonel ama genç — hedef kitle lise öğrencileri ve eğitimciler.
- Kod içindeki yorum ve değişken isimleri İngilizce kalabilir.

## Brand — Gerçek Renk Paleti
**`css/style.css` içindeki CSS variable'ları TEK doğru kaynak.** İnternette gördüğün başka paletlere güvenme.

```
--navy-dark:    #2C56A5   (metin / ink)
--navy-primary: #3A64A7
--navy-medium:  #4472B6   (primary)
--navy-light:   #5381BE
--accent:       #819FCD   (orta mavi)
--accent-light: #9FB6D5   (açık pudra)
--off-white:    #F3F7FC
--gray-light:   #DDE8F3   (çizgi/border)
--gray:         #7B93B8   (muted)
```

Yeni renk **uydurma**. Yeni bir tona ihtiyaç olursa variable olarak ekle, sonra kullan.

## Tipografi
- **Body:** Inter (400, 500, 600, 700, 800)
- **Display/Başlık:** Playfair Display (700)
- İkisi de `index.html` `<head>` içinde Google Fonts ile yüklü — tekrar import etme.
- Aynı fontu hem başlık hem body için kullanma.
- Büyük başlıklarda tight tracking (`-0.02em` ila `-0.03em`), body'de `line-height: 1.6-1.7`.

## Stil Kuralları (Anti-Generic)
- **Renk:** Tailwind/Bootstrap default tonları yok (`blue-500`, `indigo-600` vs.). Sadece CSS variable'ları kullan.
- **Shadow:** Flat `box-shadow: 0 2px 4px rgba(0,0,0,.1)` yasak. Katmanlı, brand rengine hafif tint'li shadow kullan: `0 10px 30px -10px rgba(44, 86, 165, 0.2)`.
- **Animasyon:** Sadece `transform` ve `opacity` animate et. `transition: all` yasak. Spring benzeri easing (`cubic-bezier(0.4, 0, 0.2, 1)`) tercih et.
- **Etkileşim:** Her tıklanabilir element için `:hover`, `:focus-visible`, `:active` state'leri zorunlu. Tab ile gezilebilmeli.
- **Görseller:** Ekip fotoğrafları `assets/images/` içinde. Yoksa `https://placehold.co/WIDTHxHEIGHT` kullan — rastgele Unsplash linki koyma.
- **Spacing:** `--section-padding`, `--container-width`, `--nav-height` variable'ları var. Random `margin: 73px` yazma.
- **Derinlik:** Katman sistemi: zemin → navbar → modal. Hepsini aynı z-plane'de bırakma.

## Three.js Sahnesi
- `js/three-scene.js` içindeki beyin sahnesi **arka plan dekoratif** — `#bg-canvas` üzerinde render ediliyor, `aria-hidden="true"`.
- Performans kritik: animasyonu ağırlaştırma, geometry'yi şişirme, her frame'de yeni material yaratma.
- Sahneyi değiştirirken `brain_v3.png` / `brain_v4.png` / `brain_live.png` referans görsellerine bak — mevcut stil bu yönde evrildi.
- Canvas boyutunu `window.resize` olayında güncellemeyi unutma.

## Değiştirme Disiplini
- Kullanıcı "şunu ekle" demediyse **yeni section, yeni CTA, yeni içerik yaratma.**
- Bir bug fix için çevresindeki kodu refactor etme. Üç benzer satır, erken soyutlamadan iyidir.
- Komite listesi, ekip sıralaması, program içeriği gibi alanlar **yetki hiyerarşisine göre** dizili — sıralama değiştirmeden önce kullanıcıya sor (bkz. son commit'ler).
- Mevcut bir renk/font "daha iyi olur" diye değiştirme. Kullanıcı açıkça isterse değiştir.

## Erişilebilirlik
- Görsellere anlamlı `alt` ekle. Dekoratif olanlar için `alt=""` + `aria-hidden="true"`.
- Form elemanları `<label>` ile bağlı olmalı.
- Renk kontrastı WCAG AA geçmeli — özellikle `--gray` üstünde metin kullanırken dikkat.
- Hamburger butonu, modal kapat butonu gibi icon-only butonlarda `aria-label` zorunlu.

## Test ve Doğrulama
- Tarayıcıda açarak test et: `index.html` dosyasını direkt tarayıcıda aç veya basit statik server (`python -m http.server` ya da VS Code Live Server) kullan.
- En az iki viewport'ta kontrol et: mobil (375px) ve desktop (1440px).
- Three.js sahnesi ilk saniyede render oldu mu, konsol hatası var mı — bak.
- Türkçe karakter (ğ, ş, ı, İ) bozulmamış mı — özellikle yeni section eklerken kontrol et.

## Commit ve Git
- Commit mesajları Türkçe, `tür: açıklama` formatında (mevcut örüntü):
  - `fix:` hata düzeltme
  - `style:` görsel/CSS değişiklik
  - `feat:` yeni özellik
- Tek commit'te mantıksal olarak ilgisiz değişiklikler karıştırma.
- Kullanıcı açıkça istemeden commit atma.

## Dokunma
- `package.json` yok — bu proje bilinçli olarak build-step'siz. `npm install` önermeden önce kullanıcıya sor.
- `assets/images/` altındaki logoları yeniden adlandırma veya silme — HTML'den referanslanıyor.
- CSS variable isimlerini değiştirme — global olarak kullanılıyor.
