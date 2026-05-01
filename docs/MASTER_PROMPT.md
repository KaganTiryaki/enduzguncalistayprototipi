# MISSION — MFL FBÇ '26: Sinematik scroll sitesi, FWA of the Day adayı, $0 maliyet

Sen Opus 4.7 / Claude Code, max effort. Bu brief'i disiplinli bir süreçte inşa edeceksin. Hedef: Awwwards SOTD + FWA of the Day + CSS Design Awards aday. Referans kalite: bruno-simon.com, activetheory.net, lusion.co, studiofreight.com, dogstudio.co. Bu referanslara benzemeyecek — hissini yakala.

**Maliyet limiti**: Yazılım/asset için $0. Hiçbir paid API kullanma. Sadece ücretsiz servisler + açık kaynak.

────────────────────────────────────────

## SÜREÇ — ATLAMAK YOK

1. Plan mode'daysan HEMEN `superpowers:brainstorming` çağır. Brief'i 3 cümlede özetle → teker teker 6-8 soru sor (2026 teması, tarih, hosting, ses tercihi, retro mode, launch, KVKK cookie, karanlık mod, CMS ihtiyacı).
2. `frontend-design` + visual companion ile 4 kritik moment mockup: (1) intro+hero, (2) komite cinematic overture, (3) modal-with-sig-behind, (4) footer outro. Onay ALMADAN kod yazma.
3. `superpowers:writing-plans` → 12+ milestone plan.
4. Her milestone TDD + verification-before-completion. Her 2 milestone'da code-review.
5. `vercel:deployments-cicd` veya Netlify ile preview deploy her milestone sonunda.

────────────────────────────────────────

## STACK (EXACT, hepsi free/open-source)

**Runtime**:
- Vite 5+ TypeScript strict
- Three.js r0.166+ (bundled, importmap değil)
- **GSAP 3.13** (free tier yeterli; Business olmadan ScrollTrigger + ScrollToPlugin kullanılabilir. SplitText/MorphSVG kullanıyorsan kendin yaz: `splitting.js` free alternatif, SVG morph için `flubber.js` free)
- Lenis 1.1+ smooth scroll
- **@theatre/core** + **@theatre/studio** (dev-only, MIT lisans, free) — kamera sekansı GUI
- **tsParticles** (MIT)
- **Rive Runtime** (@rive-app/canvas) — runtime MIT, editor freemium; sadece runtime kullan
- **Shader Park** (MIT) — SDF shader
- **Tone.js** (MIT) — opt-in ambient
- **lottie-web** (MIT) — intro animasyon (JSON Kullanıcı Figma'da çizer veya LottieFiles CC0'dan alır)
- **maath** — math helper
- **vite-plugin-glsl** — shader import
- **vite-plugin-image-optimizer** — AVIF/WebP

**Kalite**:
- TypeScript strict + ESLint + Prettier + stylelint
- **Playwright** + **axe-playwright** (a11y)
- **@lhci/cli** Lighthouse gate

**AI assist (FREE)**:
- **Google AI Studio** (ai.google.dev) — Gemini 2.5 Flash Image API, 15 req/dk ücretsiz kota, sadece Google hesabı yetiyor, kredi kartı yok
- Sadece **8 statik destek imgesi** için: 7 komite editorial illüstrasyonu + 1 OG sosyal kart (1200×630). Three.js canvas asset'lerini MÜDAHALESİZ bırak.

**Deploy**: Vercel veya Netlify free tier. `@vercel/analytics` + `@vercel/speed-insights` (free).

────────────────────────────────────────

## BRIEF

Maltepe Fen Bilimleri Çalıştayı '26 (MFL FBÇ '26). 7 disiplin, 7 masa. 16-25 yaş öğrenciler + akademisyenler. Türkçe. Ton: akademik ciddiyet × dijital avangard × museum-quality. Pazarlama klişesi YASAK ("unlock potential" vs.).

### 7 Komite

| # | Başlık | Konuşmacılar |
|---|---|---|
| C/01 | Kuantum Fiziği | Onur Pusuluk (Kadir Has), İnanç Kanık (Radarsan), Elif Yunt (TAÜ) |
| C/02 | Nöropsikoloji | Havva Demir (İÜ) |
| C/03 | YZ, Veri & NLP | Mehmet Ali Bayram (Yeditepe), Emre Gül, Melis Dünya Sezer Gül (Fi-Product) |
| C/04 | Uçak & Havacılık | Serhan Kök (BİLSEM), Dr. Caner Şentürk (Beykoz) |
| C/05 | Mol Bio & Genetik | Necla Birgül-Iyison (Boğaziçi), Yelda Özden Çiftçi, Ercan Arıcan, Gül Çiçek Kılıç, Işık Ertekin |
| C/06 | Adli & Toksikoloji | Miraç Özdemir, Av. Ece Ertuğ Özkara |
| C/07 | Akıllı Sistemler | Ali Buldu (Marmara), Mehmet Kaan İldiz (Üsküdar) |

Her biri için tagline + 4 konu + 4 "ne öğreneceksin" brainstorming sonunda netleşecek.

────────────────────────────────────────

## İKİ THREE.JS SAHNESİ (KRİTİK MİMARİ)

### 1. Ambient bg sahnesi (`src/three/ambient.ts`)

- Canvas `#bg-canvas`, fixed, z: -1
- Section bazlı mod: hero=atom, theme=dna, vision=flow, about=neural, workshop=wave, program=timeline, team/past/contact=constellation, faq=flow, sponsors=neural, eventinfo=wave
- `komiteler` section'da bg-canvas opacity 0'a fade (committees-stage baskın olur)
- Katmanlar: particle field (500/250 adaptif), deep starfield (900/400), ambient wireframe polyhedronlar float + rotate, 2 shooting comet (trail 20), mouse-follower glow orb (core + halo additive), card-hover burst particles
- **Custom GLSL shader** katmanları: volumetric fog, curl noise dust, subtle film grain
- Theme mix (dark sections'a göre particle color lerp)
- `prefers-reduced-motion` → statik snapshot

### 2. Cinematic committee sahnesi (`src/three/cinema.ts`)

- Canvas `#committees-stage`, fixed viewport, z: 2
- 7 anchor (3D spiral helix — kamera helix boyunca akar):

```
quantum  ( 0,  0,  0)
neuro    ( 6,  3, -6)
ai-nlp   (-4,  6, -12)
aero     ( 8, -2, -20)
molbio   (-6, -5, -28)
forensic ( 3,  7, -36)
smart    ( 0, -8, -44)
```

- **Her imza custom ShaderMaterial** (fresnel rim + palette-specific gradient + vertex displacement + chromatic aberration uniform). `uTime`, `uIntensity`, `uSplit` uniforms.
  - **quantum**: 3 orbital ellipse + merkez octahedron nucleus
  - **neuro**: 20-node side-profile beyin silueti (parieto-cerebellar notch) + 28 iç + interior→outline k=3 + interior→interior k=2
  - **ai-nlp**: 4-6-6-3 neural net + transformer attention overlay
  - **aero**: dual orbit ring + airfoil kontur + streamlines
  - **molbio**: double helix 4 sarım
  - **forensic**: tripod + kromatografi peaks
  - **smart**: radial actuator ring + IoT sensor nodes
- Her imzanın **mirror klonu** (scale.x = -1, material.clone() ile BAĞIMSIZ). `splitProgress[sig]` 0→1 tween, aktif imzanın yarıları ±SPLIT_DISTANCE (5.0) ayrılır.
- Post-fx: **UnrealBloomPass** (0.9/0.6/0.1) + **custom FilmGrainPass** + **ChromaticAberrationPass** (hafif, kenarlarda) + **VignettePass**
- `scene.background = new Color(0x0A1128)` (additive-blending-safe koyu lacivert, luminance < 0.01)
- Theatre.js Studio ile kamera + bloom + material uniforms GUI'de hand-crafted; prod'da `@theatre/core` replay

### Cinema tour mekaniği (SİNEMATIC ONE-SHOT)

```ts
ScrollTrigger.create({
  trigger: '#komiteler',
  start: 'top top',
  end: '+=7000',       // 7 komite × 1 ekran scroll = 7 sahne
  pin: true,
  scrub: 0.6,
  onUpdate: (self) => cinema.setPlayhead(self.progress),
})
```

User `#komiteler`'e girer → viewport pin → scroll = playhead. Her 1/7 dilimde:
1. Kamera anchor'a yaklaşır (helix path, Theatre.js easing)
2. Halves split (GSAP tween 0→1)
3. Yandan editorial kart DOM paneli materialize (GSAP Flip, SplitText char stagger)
4. 1 saniye dwell
5. Kart demat, halves merge (p=1→0), kamera bir sonraki anchor'a
6. 7. komite sonunda "Detay için tıkla" CTA → modal

────────────────────────────────────────

## SECTIONS (13)

1. **Intro** — Lottie MFL logo 2s + mask transition
2. **hero** — Full-viewport atom sahnesi arka, SplitText char title ("Yedi disiplin, yedi masa, yedi akademik ev sahibi"), mono alt satır tarih+venue, Rive scroll cue
3. **theme** — 2026 tema manifestosu, DNA bg, Gambetta italic pull-quote
4. **vision** — Vizyon+Misyon split columns, Flow bg, word stagger reveal
5. **about** — Horizontal pinned timeline (yıllar), Neural bg
6. **workshop** — 3-kolon format (oturum/atölye/panel), Wave bg
7. **komiteler** — CINEMATIC PINNED TOUR (yukarıda), star dust bg
8. **program** — Horizontal pinned schedule grid, Timeline bg
9. **team** — 12 portre, tilt hover, Constellation bg
10. **faq** — MorphSVG (veya flubber) accordion, Flow bg
11. **sponsors** — Infinite marquee (scroll velocity-based), Neural bg
12. **eventinfo** — Stylized map + ulaşım, Wave bg
13. **past** — 4 yıl grid, Flip on hover, Constellation bg
14. **contact** — Kinetic "Görüşmek üzere." footer

────────────────────────────────────────

## ETKİLEŞİM

- **Custom cursor 4 state**: default (24px), link (48px halka), text (2px dikey), card (80px shutter)
- **Magnetic buttons** (120px tetikleme, quickTo damping)
- **SplitText word reveal** her section
- **Flip on mobile menu** logo → full-screen nav
- **Rive**: hero cue, section numaraları, sponsors rotator
- **Modal**: `max-height: 92vh`, internal scroll YOK, `data-lenis-prevent`, arka planda komite shader material loop devam
- **Tone.js**: ambient drone + transition woosh (opt-in, default mute, corner toggle)
- **Keyboard**: Tab trap modalde, Esc kapat, cinema tour için "skip tour" butonu (a11y)

────────────────────────────────────────

## ART DIRECTION

**Palette**:

```
--void: #05070E
--navy-ink: #0A1128 (stage bg)
--navy-dark: #2C56A5
--navy-primary: #3A64A7
--navy-medium: #4472B6
--navy-light: #5381BE
--accent-mid: #819FCD
--accent-light: #9FB6D5
--accent-gold: #C88A3E (spotlight)
--accent-hot: #FF7BAE (neuro glow)
--grain: rgba(255,255,255,0.04)
```

**Typography** (Fontshare free variable fonts, woff2 self-host):
- Display: **Cabinet Grotesk Variable** 100–900
- Serif italic: **Gambetta** (pull-quotes)
- Body: **Inter Variable**
- Mono: **Space Mono** (meta: C/0X, saatler)
- `text-rendering: optimizeLegibility; letter-spacing: -0.02em` display'de
- `tabular-nums` tüm sayılarda

**Grid**: 12-col, gutter 24px, margin clamp(20px, 5vw, 80px). Asimetrik section'lar (7-5, 4-8, 12-full). Tek kolon ortalanmış YOK.

**Texture**: Sürekli `noise.png` grain overlay (mix-blend-mode: overlay, opacity 0.04). Section geçişlerinde hafif chromatic aberration shader. Opt-in CRT scanline toggle (retro mode).

────────────────────────────────────────

## AI ASSET ÜRETİM (Google AI Studio — FREE, kredi kartsız)

1. https://ai.google.dev/ → Google hesabı ile giriş → API key al
2. Claude Code'a `.env`'e `GEMINI_API_KEY=...` ekle
3. Aşağıdaki 8 prompt'u `gemini-2.5-flash-image` ile çalıştır:

**7 komite editorial illüstrasyonu** (public/img/c0X-*.webp, 1792×1024):

- **C/01 Kuantum**: "Editorial scientific illustration: single glowing qubit at the center of three crossed 3D orbital ellipses, volumetric starfield background, deep navy #0A1128 void, wireframe geometry, museum-quality minimal render, no text, 16:9"
- **C/02 Nöropsikoloji**: "Side profile of human brain reconstructed from dense network of glowing node points and thin connecting lines, cerebellum bulge and brainstem visible, deep navy bg, magenta pink #FF7BAE accent, medical illustration + constellation map hybrid, no text, 16:9"
- **C/03 YZ**: "Layered neural network — four columns of luminous nodes connected by arcs, transformer attention heatmap overlay, teal #33E1C9 accent, data flowing left to right, editorial 3D render, no text, 16:9"
- **C/04 Havacılık**: "Minimalist airfoil cross-section with Bernoulli streamline curves wrapping, pale blue particles drifting in airflow, cosmic navy bg, editorial, no text, 16:9"
- **C/05 Mol Bio**: "Vertical DNA double helix, 4 turns, base pairs glowing green #6EE58C, laboratory museum minimal aesthetic, dark navy environment, no text, 16:9"
- **C/06 Adli**: "Forensic tripod with three crossing light beams on glass evidence slab, amber #FFA65C accent, chromatography peaks at ground plane, forensic-noir museum style, no text, 16:9"
- **C/07 Akıllı Sistemler**: "Radial actuator ring with 16 mechanical arms, central IoT hub, gold #FFD23F accent, clean industrial Endüstri 4.0 illustration, no text, 16:9"

**OG sosyal kart** (public/og-card.webp, 1200×630):
- "MFL FBÇ '26 key art — seven signature objects in spiral constellation (brain, DNA helix, neural net, airfoil, qubit orbits, forensic tripod, robotic ring), deep navy cosmos, editorial poster composition, no text"

Toplam 8 istek ≈ 1 dakika, **$0**.

────────────────────────────────────────

## PERF + A11Y BÜTÇESİ

- **Lighthouse mobile**: Perf ≥85 (shader+post-fx yükü gerekçeli), A11y ≥95, BP ≥95, SEO ≥95
- **LCP** < 2.5s, **CLS** < 0.05, **INP** < 200ms
- **Bundle gzip JS** ≤ 280KB (Three + GSAP + Theatre core + Rive + Tone)
- **DPR cap** 1.75
- Fontlar: `font-display: swap`, Latin + Turkish subset preload
- Görseller: AVIF + WebP, explicit width/height (CLS), lazy
- Shader compile: viewport'a girene kadar lazy
- `prefers-reduced-motion`: cinema tour skip + statik 7-card fallback
- WebGL check → yoksa CSS-only fallback page
- AudioContext: user gesture ile start
- Focus trap modal, skip link, axe-playwright 0 critical

────────────────────────────────────────

## DOSYA YAPISI

```
mfl-fbc26/
├── index.html, vite.config.ts, package.json, tsconfig.json
├── playwright.config.ts, .lighthouserc.json, netlify.toml (veya vercel.json)
├── public/
│   ├── fonts/ (cabinet, gambetta, inter, space-mono .woff2)
│   ├── lottie/mfl-intro.json
│   ├── rive/hero-cue.riv, section-numbers.riv
│   ├── textures/noise.png
│   ├── img/ (7 Gemini komite + og-card)
│   └── theatre/project-state.json
├── src/
│   ├── main.ts, styles/*.css
│   ├── three/
│   │   ├── ambient.ts, cinema.ts
│   │   ├── signatures/ (7 shader-based)
│   │   ├── shaders/ (*.glsl: fresnel, volumetric-fog, curl-noise, film-grain, chromatic)
│   │   ├── post-fx/ (grain, chromatic, vignette)
│   │   ├── anchors.ts, camera.ts, dispose.ts
│   ├── audio/ (tone-setup, sound-map)
│   ├── motion/ (gsap-setup, split-reveal, magnetic, cursor, flip-utils)
│   ├── rive/ (rive-setup)
│   ├── theatre/ (cinema-sequence)
│   └── components/ (navigation, hero, committees-tour, modal, data)
└── tests/
    ├── e2e/*.spec.ts
    └── a11y/*.spec.ts
```

Scripts:

```
"dev": "vite"
"build": "vite build"
"preview": "vite preview"
"theatre:studio": "cross-env THEATRE_STUDIO=1 vite"
"test": "playwright test && lhci autorun"
"deploy": "netlify deploy --prod"   # veya vercel --prod
```

────────────────────────────────────────

## KABUL KRİTERLERİ (tümü ✅ olmadan "bitti" deme)

- [ ] Intro Lottie 2s, hero SplitText char stagger
- [ ] Her section özgün scroll-choreographed reveal
- [ ] `#komiteler` scroll-pin 7 sahne, scroll = playhead, ek scroll yok
- [ ] 7 imza shader-based (ShaderMaterial, fresnel rim + palette gradient), post-fx zinciri aktif
- [ ] Halves split + editorial kart materialize + dwell + demat döngüsü sorunsuz
- [ ] Modal max-height 92vh, scroll yok, arka planda komite shader loop
- [ ] Custom cursor 4 state morph
- [ ] Magnetic buttons çalışıyor
- [ ] Rive hero cue + section numaraları
- [ ] 8 Gemini imge üretildi (public/img/)
- [ ] Tone.js opt-in toggle
- [ ] `prefers-reduced-motion` → statik fallback
- [ ] Klavye gezilebilir, focus-visible, Esc modal, skip-tour butonu
- [ ] Playwright e2e (intro/hero/tour/modal/kb/a11y) yeşil
- [ ] axe-playwright 0 critical
- [ ] Lighthouse mobile Perf ≥85, A11y ≥95
- [ ] Bundle gzip ≤280KB
- [ ] Turkish karakterler tüm fontlarda tam
- [ ] Netlify/Vercel preview URL + Lighthouse rapor paylaşıldı
- [ ] CLAUDE.md + README yazıldı
- [ ] Maliyet $0 (paid API kullanılmadı)

────────────────────────────────────────

## TUZAKLAR — KAÇIN

1. UnrealBloomPass canvas'ı opaque yapar → scene.background kullan (CSS bg görünmez)
2. Additive blending + parlak bg = cisim renkleri yıkanır → bg luminance < 0.02 zorunlu
3. Lenis + ScrollTrigger.pin: pin sırasında Lenis.stop(), sonra resume (official GSAP docs)
4. Shader material her frame recompile etme — tek oluştur, uniform güncelle
5. Theatre.js Studio prod bundle'da OLMAMALI (dev only, core-only prod)
6. Rive runtime tek engine, multi-artboard
7. Custom cursor element `pointer-events: none`
8. AudioContext user gesture ile (Safari susar)
9. ScrollTrigger.refresh() resize'da zorunlu
10. Gemini API key `.env` → `.gitignore`, prod'da Netlify/Vercel env vars

────────────────────────────────────────

## BAŞLA

1. Brief'i 3 cümlede özetle
2. `superpowers:brainstorming` → 6-8 soru teker teker
3. `frontend-design` + visual companion → 4 moment mockup
4. Onay sonrası `superpowers:writing-plans` → 12+ milestone
5. TDD + verification-before-completion build
6. Final: Netlify/Vercel preview + Lighthouse + Playwright + a11y + CLAUDE.md + README

Zaman sınırı yok. Kaliteden ödün YOK. Maliyet $0.
