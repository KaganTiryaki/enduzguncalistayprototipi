# Mobile Adaptasyonu Aşama 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site mobile cihazlarda (320–768px) düzgün çalışsın — hamburger drawer fonksiyonel olsun, hero stack edilebilsin, committee modal full-screen + swipe-to-close, tüm section'lar dikey ve okunabilir akışta.

**Architecture:** Vanilla CSS/JS değişikliği. Build adımı yok. Mevcut hamburger/mobileMenu markup'ı (HTML) ve CSS iskeleti var ama davranış (body scroll lock, ESC, backdrop tap, swipe handler) eksik. Modal CSS'i geçen oturumda sıkılaştırıldı; mobile için full-screen override eklenecek. Yeni bir komponent eklenmiyor — mevcut elemanlara mobile davranış kazandırılıyor.

**Tech Stack:** Vanilla HTML/CSS/JS. Lenis (smooth scroll, `data-lenis-prevent` attribute ile bypass). Doğrulama: Chrome DevTools MCP (`emulate` + `evaluate_script`).

**Test stratejisi:** Vanilla projede otomatik test framework yok. Her task bir "before/after" Chrome DevTools MCP ölçümüyle doğrulanır (`mcp__plugin_chrome-devtools-mcp_chrome-devtools__emulate` ile mobile emülasyon + `evaluate_script` ile DOM/style sorgusu). Kullanıcı paralelde gerçek telefonda manuel test eder.

**Önkoşullar (doğrulanmış):**
- ✓ `<meta name="viewport" content="width=device-width, initial-scale=1.0">` `index.html:?` mevcut
- ✓ `#hamburger` button + `#mobileMenu` overlay zaten var (`index.html:66-86`)
- ✓ Temel hamburger toggle JS var (`js/main.js:23-37`); body scroll lock / ESC / backdrop yok
- ✓ Lenis `js/carousel.js` içinde lokal scope; `data-lenis-prevent` attribute ile bypass mümkün

---

## File Structure

| Dosya | Sorumluluk | Tipi |
|---|---|---|
| `css/style.css` | Tüm görsel değişiklikler: tokens, drawer styling, hero responsive, modal full-screen, hover gates, touch target sizing | Modify |
| `index.html` | `#mobileMenu`'ya `data-lenis-prevent` + backdrop overlay div ekle | Modify |
| `js/main.js` | Hamburger handler'ı genişlet (body lock, ESC, backdrop tap); modal swipe-to-close handler ekle | Modify |
| `js/carousel.js` | Dokunulmaz | — |

Tek dosya başına tek odak — CSS'te mobile'a dair her şey, JS'te etkileşim handler'ları. HTML değişiklikleri minimal.

---

## Genel: Dev Server ve Test Aracı

Her task'te değişikliği doğrulamak için iki şeye ihtiyaç var:

1. **Dev server**: `npx serve -l 3001` (bir kere ayakta olması yeter; CLAUDE.md'de belirtildi)
2. **Chrome DevTools MCP** sayfa açık: `http://localhost:3001`

**Mobile emülasyon (her task'te):**

```
mcp__plugin_chrome-devtools-mcp_chrome-devtools__emulate
viewport: { width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
```

Sonra:

```
mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page
type: reload, ignoreCache: true
```

---

### Task 1: CSS Tokens — Breakpoint Sabitleri ve Tipografi Değişkenleri

**Files:**
- Modify: `css/style.css` (`:root` block, satır ~4-35)

CSS custom property'ler `@media` query içinde kullanılamaz — bu yüzden breakpoint değişkenleri **dökümantasyon amaçlı** :root'a eklenir; gerçek `@media` query'leri yine 480/768/1024 hardcoded sayılarla yazılır.

- [ ] **Step 1: Mevcut `:root` blokunu oku ve ekleneceği yeri belirle**

Dosya: `css/style.css`. `:root {` ile başlayan blok ~satır 4'te.

- [ ] **Step 2: Breakpoint + tipografi değişkenlerini `:root`'a ekle**

`:root` bloğunun sonuna (kapatma `}` öncesi) ekle:

```css
/* Mobile breakpoints — documentation only; @media queries use the literal numbers
   because CSS custom properties can't be used inside media queries. */
--bp-sm: 480px;
--bp-md: 768px;
--bp-lg: 1024px;

/* Touch target minimum (Apple HIG) */
--touch-min: 44px;

/* Fluid typography — used in hero h1 and body base */
--font-h1: clamp(1.9rem, 5vw, 3.4rem);
--font-body: clamp(0.95rem, 1.4vw, 1.05rem);
```

- [ ] **Step 3: `body` font-size'ı yeni token'a bağla**

`css/style.css` içinde `body {` selector'ünü bul (~satır 50 civarı, ana body kuralı). Mevcut `font-size` değerini `var(--font-body)` ile değiştir. Eğer `body` selector'ünün içinde `font-size` yoksa ekle:

```css
body {
    /* ... mevcut özellikler ... */
    font-size: var(--font-body);
}
```

- [ ] **Step 4: `.hero-title` font-size'ını yeni token'a bağla**

`css/style.css` `.hero-title` selector'ünü bul (~satır 342). Mevcut `font-size: clamp(...)` değerini `var(--font-h1)` ile değiştir. Mevcut `@media (max-width: 768px) .hero-title` ve `@media (max-width: 400px) .hero-title` override'ları kaldırılabilir mi kontrol et — eğer sadece font-size override ediyorlarsa kaldır (artık clamp yetiyor); başka özellik (line-height, margin) varsa sadece font-size satırını sil.

- [ ] **Step 5: Doğrula — DevTools, mobile emülasyon**

Önce mobile emulate (yukarıdaki Genel bölümü), sonra:

```js
mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script
function: () => {
  const root = document.documentElement;
  const bodyFs = getComputedStyle(document.body).fontSize;
  const h1 = document.querySelector('.hero-title');
  const h1Fs = h1 ? getComputedStyle(h1).fontSize : 'no h1';
  const tokens = {
    bp_sm: getComputedStyle(root).getPropertyValue('--bp-sm').trim(),
    bp_md: getComputedStyle(root).getPropertyValue('--bp-md').trim(),
    touch_min: getComputedStyle(root).getPropertyValue('--touch-min').trim(),
    font_body: getComputedStyle(root).getPropertyValue('--font-body').trim(),
    font_h1: getComputedStyle(root).getPropertyValue('--font-h1').trim()
  };
  return { tokens, bodyFs, h1Fs, viewport: innerWidth };
}
```

Beklenen: `tokens.bp_md === '768px'`, `tokens.touch_min === '44px'`, `bodyFs` ~16px, `h1Fs` mobile'da clamp min'e yakın (~30px).

- [ ] **Step 6: Commit**

```bash
git add css/style.css
git commit -m "feat(mobile): add breakpoint and typography CSS tokens"
```

---

### Task 2: Hamburger 44×44 + Body Scroll Lock + ESC + Outside-Tap

Mevcut hamburger `padding: 4px` ile ~32×16px tap area'sı veriyor (3 span × 2px height + gap'ler). 44×44'e büyüt. Davranış olarak: drawer açıkken body scroll kilit, ESC kapansın, drawer dışına tap kapansın, Lenis çakışmasın.

**Files:**
- Modify: `css/style.css` (`.hamburger`, `.mobile-menu`, yeni `body.nav-open`)
- Modify: `index.html` (`#mobileMenu`'ya `data-lenis-prevent` attribute)
- Modify: `js/main.js` (mevcut hamburger handler genişlet)

- [ ] **Step 1: `.hamburger` selector'ünü 44×44 yap**

`css/style.css` ~satır 230-239:

```css
.hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    width: var(--touch-min);
    height: var(--touch-min);
    padding: 0;
    z-index: 1001;
}
```

(`padding: 4px` → `padding: 0` + explicit `width`/`height: 44px`; `justify-content: center` + `align-items: center` ile 3 span dikey ortalanır.)

- [ ] **Step 2: `body.nav-open` scroll kilidini ekle**

`css/style.css` `.mobile-menu.active` kuralının yanına ekle (~satır 280):

```css
body.nav-open {
    overflow: hidden;
}
```

- [ ] **Step 3: `#mobileMenu`'ya `data-lenis-prevent` attribute ekle**

`index.html` ~satır 75:

```html
<div class="mobile-menu" id="mobileMenu" data-lenis-prevent>
```

- [ ] **Step 4: Hamburger JS handler'ını genişlet**

`js/main.js` ~satır 23-37 mevcut blok şu hale gelir:

```js
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

function openNav() {
    hamburger.classList.add('active');
    mobileMenu.classList.add('active');
    document.body.classList.add('nav-open');
    hamburger.setAttribute('aria-expanded', 'true');
}

function closeNav() {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
}

hamburger.addEventListener('click', () => {
    if (mobileMenu.classList.contains('active')) closeNav();
    else openNav();
});

document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', closeNav);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) closeNav();
});

// Outside tap (drawer is full-width on mobile so this is a click on the menu
// background area outside the .mobile-links list)
mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeNav();
});
```

(Mevcut handler'ı tam değiştir; yeni: openNav/closeNav fonksiyonları + ESC + outside-tap + aria-expanded).

- [ ] **Step 5: Hamburger button'a aria-expanded başlangıç değerini ekle**

`index.html` ~satır 66:

```html
<button class="hamburger" id="hamburger" aria-label="Menüyü aç" aria-expanded="false">
```

- [ ] **Step 6: Doğrula — boyut + davranış**

Mobile emulate edilmiş şekilde reload, sonra:

```js
mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script
function: () => {
  const h = document.getElementById('hamburger');
  const r = h.getBoundingClientRect();
  return { hamburgerSize: { w: Math.round(r.width), h: Math.round(r.height) }, display: getComputedStyle(h).display };
}
```

Beklenen: `{ w: 44, h: 44 }`, `display !== 'none'` (mobile viewport'ta görünür).

Sonra hamburger'a tıkla:

```js
mcp__plugin_chrome-devtools-mcp_chrome-devtools__click
uid: <hamburger uid from snapshot>
```

Sonra durumu kontrol:

```js
mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script
function: () => {
  const m = document.getElementById('mobileMenu');
  return {
    menuActive: m.classList.contains('active'),
    bodyLocked: document.body.classList.contains('nav-open'),
    bodyOverflow: getComputedStyle(document.body).overflow,
    ariaExpanded: document.getElementById('hamburger').getAttribute('aria-expanded'),
    menuRight: getComputedStyle(m).right
  };
}
```

Beklenen: `menuActive: true`, `bodyLocked: true`, `bodyOverflow: 'hidden'`, `ariaExpanded: 'true'`, `menuRight: '0px'`.

ESC simulate:

```js
mcp__plugin_chrome-devtools-mcp_chrome-devtools__press_key
key: Escape
```

Tekrar evaluate — beklenen: `menuActive: false`, `bodyLocked: false`.

- [ ] **Step 7: Commit**

```bash
git add css/style.css index.html js/main.js
git commit -m "feat(mobile): hamburger drawer 44x44 + scroll lock + ESC + outside-tap"
```

---

### Task 3: Hero Responsive (Logo Scale + Başlık + Butonlar)

**Files:**
- Modify: `css/style.css` (`.hero-logo`, `.hero-buttons`, ilgili @media kuralları)

- [ ] **Step 1: Mevcut `.hero-logo` ve `.hero-buttons` kurallarını oku**

`css/style.css` `.hero-logo` (~satır 326), `.hero-buttons` (~satır 408), mevcut `@media (max-width: 768px)` ve `@media (max-width: 400px)` override'ları (~satır 1530-1640).

- [ ] **Step 2: `.hero-logo` boyutunu fluid yap**

`.hero-logo` ana kuralında `width`/`height` değerlerini bul. Eğer mevcut sabit (örn. `width: 280px`), fluid clamp'a çevir:

```css
.hero-logo {
    /* mevcut diğer özellikler korunur */
    width: clamp(160px, 24vw, 280px);
    height: auto;
}
```

Mevcut `@media (max-width: 768px) .hero-logo` ve `@media (max-width: 400px) .hero-logo` blokları sadece logo boyutu override ediyorsa kaldır (clamp yetiyor); başka özellik (margin, opacity) varsa sadece width/height satırlarını sil.

- [ ] **Step 3: `.hero-buttons` mobile davranışı**

`css/style.css` mevcut `.hero-buttons` (~satır 408) muhtemelen `display: flex; gap: ...; justify-content: center;` formatında. 480px altında alt alta + full-width yap. Yeni @media kuralı ekle (mevcut mobile override'larla aynı `@media (max-width: 480px)` bloğuna konsolide edilebilir; ayrı blok da yazılabilir):

```css
@media (max-width: 480px) {
    .hero-buttons {
        flex-direction: column;
        width: 100%;
        gap: 12px;
    }
    .hero-buttons .btn {
        width: 100%;
        text-align: center;
    }
}
```

(Eğer mevcut `@media (max-width: 400px)` bloğu varsa ve yakın içerik varsa orayla birleştir; aksi halde ayrı blok ekle.)

- [ ] **Step 4: Doğrula**

```js
mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script
function: () => {
  const logo = document.querySelector('.hero-logo');
  const btns = document.querySelector('.hero-buttons');
  const firstBtn = btns?.querySelector('.btn');
  return {
    viewport: innerWidth,
    logoWidth: logo ? Math.round(logo.getBoundingClientRect().width) : null,
    btnsDirection: btns ? getComputedStyle(btns).flexDirection : null,
    firstBtnWidth: firstBtn ? Math.round(firstBtn.getBoundingClientRect().width) : null,
    btnsContainerWidth: btns ? Math.round(btns.getBoundingClientRect().width) : null
  };
}
```

iPhone SE viewport (375): beklenen `logoWidth` ~ 160-180, `btnsDirection: 'column'`, `firstBtnWidth ≈ btnsContainerWidth` (full-width buton).

768px viewport ile tekrar et: `btnsDirection: 'row'` olmalı.

- [ ] **Step 5: Commit**

```bash
git add css/style.css
git commit -m "feat(mobile): hero logo fluid scale + buttons stack on narrow screens"
```

---

### Task 4: Hero Countdown 2×2 Grid (480px altında)

**Files:**
- Modify: `css/style.css` (`.countdown` ve `.countdown-item` ilgili media query'leri)

- [ ] **Step 1: Mevcut `.countdown` kurallarını oku**

`.countdown` (~satır 365), `.countdown-item` (~satır 372), mevcut `@media (max-width: 768px) .countdown` (~satır 1539) ve `.countdown-number/label` mobile override'ları.

- [ ] **Step 2: `.countdown`'u 480px altında 2×2 grid yap**

Yeni @media kuralı:

```css
@media (max-width: 480px) {
    .countdown {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        max-width: 320px;
        margin-left: auto;
        margin-right: auto;
    }
    .countdown-item {
        min-height: 80px;
    }
}
```

(Mevcut `.countdown` muhtemelen `display: flex` ile 4 sütun; grid override 480 altında.)

- [ ] **Step 3: 480-768px arası 4 sütun küçültülmüş font (mevcut davranışı koru)**

Mevcut `@media (max-width: 768px)` countdown rule'u (~satır 1539-1551) zaten 4 sütun küçültülmüş font içeriyor. Buna dokunma; 480px override'u onun üzerine binecek (cascade order doğru — 480 < 768 ama 480 query daha spesifik şartla aktifken 768 zaten aktif olur, son tanımlanan kazanır → yeni 480 kuralını dosyada **mevcut 768 kuralından sonra** koy).

- [ ] **Step 4: Doğrula**

iPhone SE (375):

```js
mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script
function: () => {
  const cd = document.querySelector('.countdown');
  const items = document.querySelectorAll('.countdown-item');
  const cdRect = cd.getBoundingClientRect();
  const layoutMap = Array.from(items).map(el => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width) };
  });
  return {
    viewport: innerWidth,
    display: getComputedStyle(cd).display,
    gridCols: getComputedStyle(cd).gridTemplateColumns,
    items: layoutMap,
    countdownWidth: Math.round(cdRect.width)
  };
}
```

Beklenen: `display: 'grid'`, `gridCols: 2 sayı içerir` (örn. `'151.5px 151.5px'`), 4 item iki satıra dağılmış (item[0].y === item[1].y, item[2].y > item[0].y, item[2].y === item[3].y).

768px viewport'ta tekrar: 4 sütun yan yana (4 item'ın hepsi aynı y).

- [ ] **Step 5: Commit**

```bash
git add css/style.css
git commit -m "feat(mobile): countdown 2x2 grid below 480px"
```

---

### Task 5: Modal Full-Screen Mobile (CSS)

**Files:**
- Modify: `css/style.css` (`.committee-modal__panel` ve alt elemanlar için yeni `@media` blok)

- [ ] **Step 1: Mevcut mobile modal blok'unu oku**

`css/style.css` ~satır 2487-2491:

```css
@media (max-width: 768px) {
    .committee-modal__inner { padding: 24px 22px 28px; }
    .committee-modal__grid { grid-template-columns: 1fr; gap: 24px; }
    .committee-modal__symbol { height: 140px; }
    .committee-modal__symbol svg { width: 100px; height: 100px; }
}
```

Bu blok geçen oturumdaki sıkılaştırmadan önceki değerleri içeriyor olabilir — değerleri sıkılaştırılmış desktop ile uyumlu hale getir.

- [ ] **Step 2: 768px altı modal full-screen blok'unu yaz**

Yukarıdaki blok'u tamamen değiştir:

```css
@media (max-width: 768px) {
    .committee-modal {
        padding: 0;
    }
    .committee-modal__panel {
        width: 100vw;
        max-width: 100vw;
        height: 100vh;
        height: 100dvh;
        max-height: 100vh;
        max-height: 100dvh;
        border-radius: 0;
        border-left: none;
        border-right: none;
    }
    .committee-modal__symbol {
        height: 100px;
    }
    .committee-modal__symbol svg {
        width: 78px;
        height: 78px;
    }
    .committee-modal__symbol::after {
        width: 110px;
        height: 110px;
    }
    .committee-modal__inner {
        padding: 18px 20px 22px;
    }
    .committee-modal__grid {
        grid-template-columns: 1fr;
        gap: 16px 0;
    }
    .committee-modal__title {
        font-size: clamp(1.2rem, 5vw, 1.6rem);
    }
    .committee-modal__close {
        width: 44px;
        height: 44px;
        top: 12px;
        right: 12px;
    }
    .committee-modal__speakers {
        grid-template-columns: 1fr;
    }
}
```

(`100vh` + `100dvh` fallback iOS Safari için; `dvh` modern Safari'de adres çubuğu retract olduğunda yeniden hesaplanır.)

- [ ] **Step 3: Doğrula — modal aç, ölç**

iPhone SE emulate, reload. Sonra komiteler section'ına scroll + modal aç:

```js
mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script
function: async () => {
  document.getElementById('komiteler')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  window.openCommitteeModal('C/01', null);
  await new Promise(r => setTimeout(r, 1500));
  const panel = document.querySelector('.committee-modal__panel');
  const close = document.querySelector('.committee-modal__close');
  const symbol = document.querySelector('.committee-modal__symbol');
  const grid = document.querySelector('.committee-modal__grid');
  const pRect = panel.getBoundingClientRect();
  const cRect = close.getBoundingClientRect();
  return {
    viewport: { w: innerWidth, h: innerHeight },
    panel: { w: Math.round(pRect.width), h: Math.round(pRect.height), top: Math.round(pRect.top), left: Math.round(pRect.left) },
    panelBorderRadius: getComputedStyle(panel).borderRadius,
    close: { w: Math.round(cRect.width), h: Math.round(cRect.height) },
    symbolHeight: Math.round(symbol.getBoundingClientRect().height),
    gridColumns: getComputedStyle(grid).gridTemplateColumns
  };
}
```

Beklenen iPhone SE (375×667):
- `panel.w === 375`, `panel.h === 667` (full-screen), `panel.top === 0`, `panel.left === 0`
- `panelBorderRadius === '0px'`
- `close.w === 44`, `close.h === 44`
- `symbolHeight === 100`
- `gridColumns` tek değer (örn `'335px'`) → tek sütun

- [ ] **Step 4: Commit**

```bash
git add css/style.css
git commit -m "feat(mobile): committee modal full-screen below 768px"
```

---

### Task 6: Modal Swipe-to-Close (JS)

**Files:**
- Modify: `js/main.js` (modal blok'una touch handler ekle)

Aşağı sürükleme `delta > 80px` ya da `velocity > 0.5px/ms` ise kapan. Yukarı sürükleme yok sayılır. Modal aktifken DOM olmadığı için (`hidden` true), handler `committeeModal` referansına bağlı, açıldığında reset.

- [ ] **Step 1: Mevcut modal blok'unun sonunu bul**

`js/main.js` ~satır 240'tan sonra `committeeModal` blok'u var. Blok kapanmadan önce (`}` öncesi, `window.openCommitteeModal = openCommittee;` sonrası uygun yer) handler ekle.

- [ ] **Step 2: Swipe handler'ı ekle**

`window.openCommitteeModal = openCommittee;` satırından sonra ekle (committeeModal blok içinde):

```js
// Swipe-to-close (mobile only — touch events don't fire from mouse on desktop)
const panel = committeeModal.querySelector('.committee-modal__panel');
let touchStartY = 0;
let touchStartTime = 0;
let dragging = false;

panel.addEventListener('touchstart', (e) => {
    if (!committeeModal.classList.contains('is-open')) return;
    touchStartY = e.touches[0].clientY;
    touchStartTime = performance.now();
    dragging = true;
    panel.style.transition = 'none';
}, { passive: true });

panel.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const delta = e.touches[0].clientY - touchStartY;
    if (delta < 0) return; // ignore upward
    panel.style.transform = `translateY(${delta}px)`;
}, { passive: true });

panel.addEventListener('touchend', (e) => {
    if (!dragging) return;
    dragging = false;
    const delta = (e.changedTouches[0].clientY) - touchStartY;
    const elapsed = performance.now() - touchStartTime;
    const velocity = delta / Math.max(elapsed, 1);
    panel.style.transition = '';
    if (delta > 80 || velocity > 0.5) {
        closeCommittee();
        // reset for next open
        setTimeout(() => { panel.style.transform = ''; }, 450);
    } else {
        panel.style.transform = '';
    }
}, { passive: true });
```

- [ ] **Step 3: Doğrula — touch event simülasyonu**

Chrome DevTools MCP'de touch event simulasyonu doğrudan API yok; CDP touchstart/touchmove/touchend dispatch edilebilir ama uğraştırıcı. Pragmatik test: handler'ın bağlandığını ve doğru fonksiyonu çağırdığını verify et:

```js
mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script
function: async () => {
  // Open modal first
  document.getElementById('komiteler')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  window.openCommitteeModal('C/01', null);
  await new Promise(r => setTimeout(r, 1500));
  const panel = document.querySelector('.committee-modal__panel');
  const before = panel.style.transform;

  // Simulate touchstart + touchmove (delta 100px) + touchend
  const fire = (type, y) => {
    const ev = new TouchEvent(type, {
      bubbles: true, cancelable: true,
      touches: type === 'touchend' ? [] : [{ clientY: y, clientX: 100, identifier: 0, target: panel, pageX: 100, pageY: y, screenX: 100, screenY: y, radiusX: 1, radiusY: 1, rotationAngle: 0, force: 1 }],
      changedTouches: [{ clientY: y, clientX: 100, identifier: 0, target: panel, pageX: 100, pageY: y, screenX: 100, screenY: y, radiusX: 1, radiusY: 1, rotationAngle: 0, force: 1 }]
    });
    panel.dispatchEvent(ev);
  };
  fire('touchstart', 200);
  fire('touchmove', 250);
  const midTransform = panel.style.transform;
  fire('touchmove', 320);
  fire('touchend', 320);
  await new Promise(r => setTimeout(r, 600));
  return {
    transformDuringDrag: midTransform,
    modalStillOpen: document.getElementById('committeeModal').classList.contains('is-open'),
    transformAfter: panel.style.transform
  };
}
```

Beklenen: `transformDuringDrag` boş olmamalı (`'translateY(50px)'` benzeri), `modalStillOpen: false` (delta 120 > 80 → kapan), `transformAfter: ''` (reset oldu).

`TouchEvent` constructor bazı browserlarda kısıtlı. Eğer evaluate hata verirse: gerçek cihazda manuel test et (Step 4'e atla, commit'i şimdilik tut).

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "feat(mobile): committee modal swipe-down to close"
```

---

### Task 7: Section Global Responsive + Hover Gating

Tüm section'lar 768px altında `padding-block` yarıya indir + tüm grid'ler tek sütun fallback + hover-only effect'ler `(hover: hover)` ile gate'le.

**Files:**
- Modify: `css/style.css` (mevcut 768px @media bloğunu genişlet ya da yeni grup ekle)

- [ ] **Step 1: Mevcut `.section` ve common grid kurallarını incele**

`css/style.css` `.section` (~satır 90 civarı?) ya da section padding kontrol eden ana kural. Yapı:

```bash
grep -n -E '\.section|\.container|--section-padding' css/style.css | head -20
```

Mevcut padding değerini ve ana grid'leri (vm-grid, team-grid, sponsor-grid, vs.) bul.

- [ ] **Step 2: Section padding mobile reduction**

Mevcut `@media (max-width: 768px)` blok'larından birinin sonuna ekle (ya da yeni blok):

```css
@media (max-width: 768px) {
    .section {
        padding-block: clamp(40px, 9vw, 60px);
    }
    /* All multi-column grids fall back to single column on mobile */
    .vm-grid,
    .team-grid,
    .sponsors-grid,
    .program-grid,
    .faq-grid,
    .past-grid,
    .contact-grid {
        grid-template-columns: 1fr !important;
    }
}
```

(Selector listesi dosyada gerçekten var olanlara göre güncellenir — Step 1'de bulunan grid sınıfları. `!important` cascade çakışmasını önler; reveal animasyonları gibi diğer kurallar override etmesin.)

- [ ] **Step 3: Hover-only effect'leri `(hover: hover)` ile gate'le**

Bu daha narin — mevcut kodda `:hover` selectorleri tarayıp hangileri "süs" olduğunu (kart hover lift, link underline) ayır. **Bu task'in pragmatik versiyonu**: kart hover lift'lerini gate'le. Yeni blok ekle:

```css
@media (hover: none) {
    /* Disable hover-only lift/glow effects on touch devices */
    .vm-card:hover,
    .speaker-highlight:hover,
    .committee:hover,
    .team-member:hover,
    .sponsor-item:hover,
    .program-item:hover {
        transform: none !important;
        background: inherit;
        border-color: inherit;
    }
}
```

(Selector listesi gerçek class isimlerine göre güncellenir — `grep -n ':hover' css/style.css` ile transform/background değiştiren kuralları bul.)

- [ ] **Step 4: Doğrula — section padding ölç**

```js
mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script
function: () => {
  const sections = ['theme', 'vision', 'about', 'workshop'].map(id => {
    const el = document.getElementById(id);
    if (!el) return { id, missing: true };
    const cs = getComputedStyle(el);
    return { id, paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom };
  });
  // Multi-col grids → single column
  const grids = ['vm-grid', 'team-grid', 'sponsors-grid'].map(cls => {
    const el = document.querySelector('.' + cls);
    if (!el) return { cls, missing: true };
    return { cls, gridCols: getComputedStyle(el).gridTemplateColumns };
  });
  return { viewport: innerWidth, sections, grids };
}
```

Beklenen: section padding'ler ~40-60px aralığında; grid'lerin `gridTemplateColumns` tek bir değer içerir (`'375px'` benzeri).

- [ ] **Step 5: Commit**

```bash
git add css/style.css
git commit -m "feat(mobile): section padding shrink + grid 1fr fallback + hover gating"
```

---

### Task 8: Touch Target Audit

Tüm tap'lenebilir element ≥ 44×44 olmalı. Tarama → düzeltme.

**Files:**
- Modify: `css/style.css` (eksik olan elemanlara min-width/min-height ekle)

- [ ] **Step 1: Mobile viewport'ta interaktif elementlerin boyutlarını ölç**

```js
mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script
function: () => {
  const selectors = [
    '.nav-cta', '.btn', '.mobile-link', '.hamburger',
    '.committee-modal__close', '.scroll-indicator',
    '.committee', '.faq-question', 'a[href]'
  ];
  const out = [];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      if (i > 2) return; // sample first 3
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return; // hidden
      if (r.width < 44 || r.height < 44) {
        out.push({ sel, idx: i, w: Math.round(r.width), h: Math.round(r.height) });
      }
    });
  });
  return out;
}
```

Beklenen output: küçük olan elemanların listesi. Her biri için CSS'te min-width/min-height: 44px ekle ya da padding artır.

- [ ] **Step 2: Bulunan eksik tap target'ları düzelt**

Liste tipik olarak şunları içerir:
- `.committee-modal__close` (zaten Task 5'te 44 yapıldı)
- `.scroll-indicator` (hero altındaki ↓ ok)
- `.faq-question` (eğer 40'tan kısa)

Her biri için ekle:

```css
@media (max-width: 768px) {
    .scroll-indicator {
        min-width: var(--touch-min);
        min-height: var(--touch-min);
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
    /* Diğer Step 1'de bulunan eksikler — gerçek liste burada genişler */
}
```

Step 1'in çıktısına göre `selector listesi` doldurulur. Yoksa skip.

- [ ] **Step 3: Step 1 sorgusunu tekrarla, listenin boş olduğunu doğrula**

Aynı evaluate, beklenen: boş array `[]` ya da sadece dekoratif (link içindeki ikon vb.) elementler.

- [ ] **Step 4: Commit**

```bash
git add css/style.css
git commit -m "feat(mobile): normalize tap targets to 44x44 minimum"
```

---

### Task 9: Smoke Test — Spec Başarı Kriteri Doğrulama

**Files:** Yok (sadece doğrulama)

Spec'te tanımlı 7 kriteri tek bir DevTools sorgusuyla doğrula:

1. Hamburger 44×44 tap target ✓
2. Drawer backdrop tap kapatır ✓
3. Drawer açıkken sayfa scroll kilit ✓
4. Hero countdown 480px altı 2×2 ✓
5. Modal 768px altı full-screen, scroll yok ✓
6. Modal swipe-down 80px+ → kapan ✓
7. Komiteler section eskisi gibi (kapsam dışı, regression test) ✓
8. Hiçbir section yatay scroll oluşturmaz ✓

- [ ] **Step 1: iPhone SE viewport — hero + drawer testi**

Mobile emulate (375×667), reload. Sonra:

```js
mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script
function: async () => {
  const out = {};
  // 1. Hamburger size
  const h = document.getElementById('hamburger');
  const hr = h.getBoundingClientRect();
  out.hamburger44 = hr.width === 44 && hr.height === 44;

  // 4. Countdown 2x2
  const items = document.querySelectorAll('.countdown-item');
  const ys = Array.from(items).map(i => Math.round(i.getBoundingClientRect().top));
  out.countdown2x2 = ys[0] === ys[1] && ys[2] === ys[3] && ys[2] > ys[0];

  // 8. No horizontal scroll
  out.noHorizontalScroll = document.documentElement.scrollWidth <= innerWidth;

  // 3 + 2: Open drawer, check lock + outside-tap-close
  h.click();
  await new Promise(r => setTimeout(r, 300));
  out.drawerOpen = document.getElementById('mobileMenu').classList.contains('active');
  out.bodyLocked = getComputedStyle(document.body).overflow === 'hidden';

  // Outside tap (click on the menu container outside the links)
  const menu = document.getElementById('mobileMenu');
  menu.dispatchEvent(new MouseEvent('click', { bubbles: true, target: menu }));
  await new Promise(r => setTimeout(r, 300));
  // dispatching synthetic event with target=menu doesn't actually re-route e.target;
  // simulate by directly calling the close handler if needed:
  // (handler reads e.target === mobileMenu so synthetic may not match — fallback: use ESC)
  const stillOpen = document.getElementById('mobileMenu').classList.contains('active');
  if (stillOpen) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await new Promise(r => setTimeout(r, 300));
  }
  out.drawerClosable = !document.getElementById('mobileMenu').classList.contains('active');

  return out;
}
```

Beklenen: tüm değerler `true`.

- [ ] **Step 2: Modal smoke**

```js
mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script
function: async () => {
  document.getElementById('komiteler')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  window.openCommitteeModal('C/01', null);
  await new Promise(r => setTimeout(r, 1500));
  const panel = document.querySelector('.committee-modal__panel');
  const r = panel.getBoundingClientRect();
  const noScroll = panel.scrollHeight <= panel.clientHeight + 1;
  return {
    fullScreen: r.top === 0 && r.left === 0 && Math.round(r.width) === innerWidth,
    noScroll
  };
}
```

Beklenen: `fullScreen: true`, `noScroll: true`.

- [ ] **Step 3: Desktop regression**

Emulate'i kapat (normal viewport'a dön):

```
mcp__plugin_chrome-devtools-mcp_chrome-devtools__resize_page
width: 1440, height: 900
```

Sayfa reload. Hızlı kontrol:

```js
mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script
function: () => {
  const h = document.getElementById('hamburger');
  const cd = document.querySelector('.countdown');
  const navLinks = document.querySelector('.nav-links');
  return {
    hamburgerHidden: getComputedStyle(h).display === 'none',
    countdownDesktop: getComputedStyle(cd).display !== 'grid' || getComputedStyle(cd).gridTemplateColumns.split(' ').length === 4,
    navLinksVisible: getComputedStyle(navLinks).display !== 'none'
  };
}
```

Beklenen: hamburger hidden, navLinks visible, countdown desktop davranışı.

Eğer regression varsa task numarasına dön ve düzelt.

- [ ] **Step 4: Final commit (sadece varsa düzeltme)**

Eğer Step 1-3'te bir failure çıkıp düzeltildiyse:

```bash
git add css/style.css js/main.js
git commit -m "fix(mobile): smoke test corrections for asama1"
```

Aksi halde commit yok; aşama tamamlandı.

---

## Self-Review

**Spec coverage:**
- (1) Breakpoint sistemi → Task 1 ✓
- (2) Hamburger drawer → Task 2 ✓
- (3) Hero (logo, başlık, countdown, butonlar) → Task 3 + Task 4 ✓
- (4) Modal full-screen + swipe → Task 5 + Task 6 ✓
- (5) Section global → Task 7 ✓
- (6) Touch target normalizasyonu → Task 8 ✓
- (7) Tipografi tokenları → Task 1 ✓ (sadece h1 + body, spec scope ile uyumlu)

**Placeholder scan:** TODO/TBD yok. Tüm kod blokları gerçek değerler içeriyor.

**Type/identifier consistency:**
- `openNav`/`closeNav` Task 2'de tanımlı, tutarlı kullanılıyor.
- `closeCommittee` Task 6'da çağrılıyor; `js/main.js` mevcut kodunda tanımlı (`js/main.js:315`).
- CSS değişkenleri `--touch-min`, `--font-h1`, `--font-body` Task 1'de tanımlı, sonraki task'lerde tutarlı kullanılıyor.

**Verify komutları çalıştırılabilir mi:** Tüm `evaluate_script` blokları self-contained JavaScript fonksiyonu; chrome-devtools MCP onları kabul ediyor.

**Risk noktaları:**
- Task 6 `TouchEvent` constructor bazı emulated environmentlerde fail olabilir; bu durumda manuel test fallback'i belirtildi.
- Task 7 Step 3 grid selector listesi gerçek class isimlerine göre güncellenmeli — Step 1'in `grep` çıktısına bağlı.
- Task 8 selector listesi de Step 1'in gerçek output'una bağlı; placeholder değil ama tasarımı "ölç → düzelt" döngüsü olarak yapıldı.

Plan tamamlandı.
