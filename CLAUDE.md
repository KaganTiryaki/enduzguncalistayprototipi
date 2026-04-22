# MFL FBÇ '26 — Çalıştay Landing Page

## Proje

Akademik çalıştay (Maltepe Fen Bilimleri Çalıştayı 2026) için tanıtım sitesi. Vanilla HTML/CSS/JS + Three.js r0.166 (importmap) + GSAP 3.13 + Lenis 1.1.20 + postprocessing. Build adımı yok, statik dosyalar.

## Dev

```bash
npx serve -l 3001
```

→ http://localhost:3001. CSS/JS cache nedeniyle **Ctrl+Shift+R** (hard refresh) sık gerekli.

## Mimari — İki Three.js Sahnesi (KRİTİK)

Site iki ayrı Three.js sahnesi çalıştırır. Yeni gelen kişi bu mimariyi anlamadan değişiklik yapmasın.

### 1. Full-page background (`js/three-scene.js`)

- Canvas: `#bg-canvas` (position: fixed, z-index: -1)
- `SECTION_MODES` sözlüğü → her section için bir mod: `atom/dna/flow/neural/wave/timeline/constellation`
- IntersectionObserver → scroll'da mod cross-fade
- Katmanlar: parçacık alanı, deep starfield, ambient polyhedronlar, shooting comet, mouse-follower orb, card-hover burst particles
- **`komiteler` SECTION_MODES'ta YOK** — komiteler bölümünde fade out (CSS: `body.committees-visible #bg-canvas { opacity: 0 }`)

### 2. Committees scene (`js/scene/stage.js`)

- Canvas: `#committees-stage` (position: fixed, viewport-wide)
- Sadece `body.committees-visible` class'ında opacity 1
- 7 sabit anchor (`js/scene/anchors.js`): quantum merkezde (0,0,0), diğerleri radyal dağıtılmış
- Her anchor'a bir imza (procedural constellation): `js/scene/signatures/{quantum,neuro,ai-nlp,aero,molbio,forensic,smart}.js`
- Her imzanın **mirror klonu** (scale.x = -1, **bağımsız material**). `splitProgress[sig]` 0→1 GSAP tween ile aktif sig'in yarıları ±SPLIT_DISTANCE (5.0) birim ayrılır. Pasif imzalar hep merged.
- Kamera 3 target modu (`js/scene/camera.js`):
  - `HOME_TARGET` (overview, z=32) — slide'lar dışındayken
  - `cameraTargets[sig]` (scroll-active, z=9.5) — bir slide merkeze geldiğinde
  - `zoomTargets[sig]` (click-zoom, z=9.5) — modal açılırken
- GTA-V arc: lateral geçişlerde pullback + ileri hareket (`tweenCameraTo` içinde `power2.out`, 1.5s)
- `UnrealBloomPass` (strength 0.75, radius 0.55, threshold 0.12) + `OutputPass`
- `scene.background = new Color(0x0A1128)` → çok koyu lacivert, additive blending'i bozmaz

## Carousel (`js/carousel.js`)

- **Closest-to-viewport-center** slide picker (IntersectionObserver değil; scroll listener + `getBoundingClientRect` + RAF throttle)
- İlk slide üstünde / son slide altında → overview mode (HOME_TARGET)
- Click → `stage.zoomTo(sig)` → 720ms gecikme → `window.openCommitteeModal(num, slide)`
- Modal açılınca `stage.isolate(true)` aktif olmayan imzaları gizler; kapanınca `stage.isolate(false)` + `stage.zoomOut()`

## Modal (`js/main.js`)

- `COMMITTEE_DATA` objesi (C/01 – C/07) — title, tagline, topics, learn, speakers array
- `data-lenis-prevent` attribute modalde → native wheel scroll (Lenis intercept etmez)
- `max-height: 92vh`, içinde scrollbar YOK (`.committee-modal__inner { overflow: visible }`)
- Event'ler: `committee-modal:opened`, `committee-modal:closed`

## Renk Paleti

Logo türevi, `:root` içinde:

```
--navy-dark: #2C56A5 · --navy-primary: #3A64A7
--navy-medium: #4472B6 · --navy-light: #5381BE
--accent: #819FCD · --accent-light: #9FB6D5
```

Stage arkası: `#0A1128` (near-black navy, additive-blending safe)

## Dosya Yapısı

```
index.html                          — 13 section
css/style.css                       — tüm stil, tek dosya
js/
├── main.js                         — modal + COMMITTEE_DATA
├── three-scene.js                  — full-page bg sahnesi
├── carousel.js                     — committee slide tracking + click flow
└── scene/
    ├── anchors.js                  — 7 imza anchor Vector3'leri
    ├── camera.js                   — HOME/camera/zoom target builders + damping
    ├── stage.js                    — initStage(): sahne/kamera/renderer/composer + imza manager
    ├── dispose.js                  — geometry/material cleanup
    └── signatures/
        ├── index.js                — order + factory map
        ├── quantum.js, neuro.js, ai-nlp.js, aero.js, molbio.js, forensic.js, smart.js
docs/
└── MASTER_PROMPT.md                — yeni session için kopya-yapıştır prompt
```

## Konvansiyonlar

- Yeni imza eklerken: `signatures/*.js` içinde `({ palette, anchor }) => { group, update(elapsed, delta, intensity) }` factory export
- `AdditiveBlending` kullanırken renk canlı kalsın — `scene.background` sadece koyu renk olabilir (luminance < 0.02)
- Damping: `dampVec(current, target, lambda, dt)` (camera.js) — GSAP kullanmayan bölümlerde tercih
- Her animasyon frame: stage.js `tick(t)` → active/split/camera/bloom hepsini günceller
- Palette keys: `palette.accent`, `palette.mist`, `palette.navy300/400/500` (stringly-typed, cross-file convention)

## Tuzaklar (Hard-Earned)

1. **Postprocess alpha**: UnrealBloomPass + OutputPass canvas'ı opaque yapar. CSS bg arkada kalır ama görünmez. Çözüm: `scene.background` kullan.
2. **Additive blending + parlak bg** = cisim renkleri soluklaşır (`final = obj + bg`). Bg her zaman koyu (< luminance 0.02).
3. **Lenis + modal wheel çakışması**: modal root element'ine `data-lenis-prevent` attribute koy → modal içi native scroll çalışır.
4. **IntersectionObserver rootMargin güvenilmez**: slide tracking için viewport-center + `getBoundingClientRect` + scroll listener + RAF throttle kullan.
5. **Canvas iki kere render**: bg-canvas + committees-stage aynı frame'de çalışır. Komiteler bölümünde bg-canvas'ı opacity 0 yap (CSS).
6. **Mirror klonları material.clone()**: `group.clone(true)` yetmez, her material'i bağımsız clone et yoksa splitProgress opacity mirror ile orijinali beraber etkiler.
7. **Hard refresh**: CSS/JS değişikliği browser cache'ine takılır. `Ctrl+Shift+R`.
8. **Kart hover scale transform** scroll pozisyon hesaplarını bozar. Translate + border + glow tercih.
9. **Section `overflow: hidden`** sticky canvas'ı keser. Sadece `overflow-x` clip kullan.
10. **ScrollTrigger.refresh()** resize'da zorunlu, aksi halde pin kopar.

## Git

- Main branch: `main`
- Aktif dev: `experimental/localhost8000-animations`
- Uzak repolar:
  - `origin` → KaganTiryaki/mfl-calistayv2 (orijinal)
  - `v2-2` → KaganTiryaki/mfl-calistayv2-2 (primary experimental)
  - `enduzgun` → KaganTiryaki/enduzguncalistayprototipi (prod snapshot)

## Master Prompt

Yeni bir Opus 4.7 plan mode session'ında sıfırdan Awwwards-kalite site yapmak için: [`docs/MASTER_PROMPT.md`](docs/MASTER_PROMPT.md). Tek atımda kopyala, yapıştır, `superpowers:brainstorming` + `frontend-design` + `writing-plans` zinciri otomatik tetiklenir.
