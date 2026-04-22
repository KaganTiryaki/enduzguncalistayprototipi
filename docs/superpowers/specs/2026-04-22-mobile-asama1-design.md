# Mobile Adaptasyonu — Aşama 1: Layout, Hero, Modal

**Tarih:** 2026-04-22
**Kapsam:** Site mobile cihazlarda düzgün çalışsın — temel responsive iskelet, hamburger nav, hero stack, modal full-screen + swipe-to-close.
**Kapsam dışı (sonraki aşamalar):** komiteler carousel mobile-native (Aşama 2), Three.js stage perf + hover→touch eşdeğerleri (Aşama 3).

## Hedef

Telefon (320–768px genişlik) kullanıcısı için:
- Tüm section'lar dikey ve okunabilir akış
- Touch-friendly tap target'lar (min 44×44)
- Navigasyon hamburger drawer ile erişilebilir
- Committee modal'ı tam ekran + swipe-to-close
- Hover-only effect'ler mobile'da kapalı (`(hover: hover)` query)

Komiteler section'ı bu aşamada **olduğu gibi kalır** — desktop davranışı korunur, mobile'da hâlâ stage çalışır (Aşama 2'de mobile-native swipe carousel'e dönüştürülecek).

## Mimari Kararlar

### 1. Breakpoint sistemi

`:root`'a CSS değişkenleri:

```css
--bp-sm: 480px;   /* dar telefon (iPhone SE, küçük Android) */
--bp-md: 768px;   /* telefon geniş / tablet portrait — ana mobile threshold */
--bp-lg: 1024px;  /* tablet landscape / küçük desktop */
```

Mevcut `@media (max-width: 768px)` kuralları korunur; yeni eklenen kurallar bu değişkenleri kullanır (CSS custom property'ler `@media`'da kullanılamaz, dolayısıyla bu sabitler dökümantasyon amaçlıdır — gerçek media queries 480/768/1024 hardcoded sayılarla yazılır).

### 2. Navbar — hamburger drawer

**HTML değişiklikleri (`index.html`):**
- Mevcut nav linkleri korunur, ek olarak sağ üstte 44×44 hamburger button (3 çizgi SVG)
- Drawer container (sağda fixed, `transform: translateX(100%)` default)

**CSS:**
- 768px üstü: hamburger gizli, linkler yan yana (mevcut davranış)
- 768px altı: linkler gizli, hamburger görünür
- Drawer açıldığında `transform: translateX(0)`, full-height, width `min(80vw, 320px)`
- Backdrop overlay (semi-transparent), tap → kapan
- Drawer içinde 12 link dikey liste, "Başvur" CTA alta sticky
- Open state'te `body.nav-open { overflow: hidden }` ve `lenis.stop()`

**JS:**
- Hamburger button click → drawer toggle
- Backdrop click + ESC → kapan
- Link click → drawer kapan + smooth scroll (mevcut davranış korunur)

### 3. Hero (#hero)

**Logo (rozet):**
- Desktop 280px → 768px altı 200px → 480px altı 160px

**Başlık:**
- `clamp` ile zaten responsive; mobile için min değer daraltılır

**Countdown:**
- Mevcut: 4 sütun yan yana
- 768px altı: 4 sütun küçültülmüş font (orta telefon hala sığar)
- 480px altı: **2×2 grid**, daha büyük rakamlar
- Hücre min-height 80px

**Butonlar (Başvur, Keşfet):**
- 480px altı: alt alta + full-width
- 480–768px: yan yana, padding daraltılır

**Spacing:**
- Hero `padding-block` mobile'da %60 oranında

### 4. Modal — full-screen mobile

**768px altı:**
- `inset: 0` (tam ekran)
- `max-height: 100dvh` (`100vh` yerine `dvh` — iOS Safari adres çubuğu için)
- `border-radius: 0`, `width: 100vw`
- Symbol height 120 → 100
- Inner padding 22/32/26 → 18/20/22
- Topics + Learn grid `grid-template-columns: 1fr` (tek sütun)
- Speakers grid zaten `auto-fit minmax(160)` → 1fr'a düşer (3 speaker dikey)

**Swipe-to-close:**
- `committee-modal__panel` üzerine `touchstart`/`touchmove`/`touchend` handler
- Aşağı sürükle: `transform: translateY({delta}px)` ile feedback
- Bırakırken delta > 80px ya da hız > 0.5px/ms → `closeCommittee()`
- Aksi halde `transform: translateY(0)` ile geri yay
- Yukarı sürükleme yok sayılır (negatif delta clamped)

### 5. Section'lar (genel)

- Tüm section'lar 768px altında `padding-block` yarıya iner
- Tüm grid'lere fallback: `(max-width: 768px) { grid-template-columns: 1fr }`
- `(hover: hover)` query ile mevcut `:hover` state'leri (kart hover'leri, link underline animasyonları) mobile'da devre dışı

### 6. Touch target normalizasyonu

- Min 44×44 (Apple HIG)
- Etkilenen elemanlar:
  - Modal close 42 → 44
  - Hamburger 44 (yeni)
  - Navbar drawer linkleri padding-block 14px (yükseklik ≥44)
  - Buton paddingler kontrol — Başvur/Keşfet zaten ≥44

### 7. Tipografi tokenları

`:root`'a:

```css
--font-h1: clamp(2rem, 5vw, 3.5rem);
--font-h2: clamp(1.5rem, 3.5vw, 2.4rem);
--font-h3: clamp(1.2rem, 2.5vw, 1.6rem);
--font-body: clamp(0.95rem, 1.4vw, 1.05rem);
```

Bu spec'in scope'unda **sadece hero başlık (h1) + body base font** bu token'lara migrate edilir. Section heading'leri ve diğer text'ler mevcut sayısal değerlerini korur (Aşama 2/3'te token'a geçirilir). Modal'a hiç dokunulmaz (geçen oturumda zaten sıkılaştırıldı).

## Önkoşullar

- ✓ `<meta name="viewport" content="width=device-width, initial-scale=1.0">` `index.html`'de mevcut (doğrulandı).

## Etkilenen Dosyalar

- `index.html` — hamburger button + drawer markup
- `css/style.css` — breakpoint değişkenleri, hamburger/drawer stilleri, hero mobile, modal full-screen, hover gates, font tokens
- `js/main.js` — drawer toggle handler, swipe-to-close handler

## Test Planı

**Manuel test (Chrome DevTools mobile emulation + gerçek telefon):**
1. iPhone SE (375×667) — countdown 2×2, drawer açılır, modal full-screen
2. iPhone 14 Pro (393×852) — aynı
3. Pixel 5 (393×851) — aynı
4. iPad Mini portrait (768×1024) — sınır durumu, hala mobile davranışı
5. iPad Mini landscape (1024×768) — desktop davranışı

**Doğrulama checkler:**
- [ ] Hamburger 44×44 tap target
- [ ] Drawer backdrop tap kapatır
- [ ] Drawer açıkken sayfa scroll kilit
- [ ] Hero countdown 480px altı 2×2
- [ ] Modal 768px altı full-screen, scroll yok
- [ ] Modal swipe-down 80px+ → kapan
- [ ] Komiteler section eskisi gibi (Aşama 1 kapsamı dışı)
- [ ] Hiçbir section yatay scroll oluşturmaz

## Riskler

1. **Lenis + drawer çakışması:** Drawer açıldığında Lenis'i durdurmazsak background scroll devam eder. `lenis.stop()` / `lenis.start()` ile yönet.
2. **iOS Safari `100vh` vs `100dvh`:** Modern Safari `dvh` destekler ama eski iOS 15 öncesi `vh` kullanır. Fallback: `max-height: 100vh; max-height: 100dvh;`
3. **Touch event Lenis override:** Modal swipe-to-close handler `data-lenis-prevent` zaten var (CLAUDE.md tuzak #3). Touch event'lerin propagation kontrolü gerek.
4. **Mevcut `@media (max-width: 768px)` kurallarıyla çakışma:** ~10 mevcut breakpoint var; yeni kurallar override sırasına dikkat. Specificity düşük tutulacak, gerekirse cascade order ayarlanacak.

## Başarı Kriteri

iPhone SE (375×667) ile gerçek cihazda site açıldığında:
- Hamburger çalışır, 12 link erişilebilir
- Hero tek ekrana sığar, countdown 2×2 okunur
- En az bir komite modal açılır, full-screen olur, swipe-down ile kapanır
- Hiçbir section yatay scroll oluşturmaz
- Tüm tap target'lar parmakla rahat tıklanır

Bu kriterler karşılandığında Aşama 1 tamamlanmış sayılır; Aşama 2 (komiteler carousel) brainstorm'a girilir.
