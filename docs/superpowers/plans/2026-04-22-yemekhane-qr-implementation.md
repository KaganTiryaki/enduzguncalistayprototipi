# Çalıştay Yemekhane QR Sistemi — Implementasyon Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MFL FBÇ '26 çalıştayının 2 günü (9-10 Mayıs 2026) boyunca katılımcıların öğle yemeği alımını QR kodlarla kontrol eden, çift yemek alımını engelleyen, görevli ve idare için basit arayüzler sunan bir web sistemi kurmak.

**Architecture:** Mevcut çalıştay repo'suna `yemek/` subpath olarak entegre edilmiş, vanilla HTML/CSS/JS ile yazılmış 3-sayfalık (katılımcı + görevli + admin) bir web uygulaması. Veritabanı olarak Supabase (tek tablo, RLS korumalı), hosting olarak mevcut Vercel projesi kullanılır. QR üretme (qrcode.js) ve okuma (html5-qrcode) için CDN kütüphaneleri yüklenir. Hiçbir build adımı yok.

**Tech Stack:**
- Vanilla HTML5, CSS3, ES modules
- Supabase (PostgreSQL + Auto REST API + RLS)
- `qrcode` JS library (QR üretimi) — CDN
- `html5-qrcode` library (kamera tarama) — CDN
- `PapaParse` (CSV okuma, admin tarafı) — CDN
- `@supabase/supabase-js` v2 — CDN
- Vercel static hosting
- Mevcut çalıştay sitesinin navy palette CSS değişkenleri

**Spec referansı:** `docs/superpowers/specs/2026-04-22-yemekhane-qr-design.md`

**Credential'lar (spec sonrası geldi):**
- URL: `https://sfoimuxbvxbwywujoeoa.supabase.co`
- Publishable (anon) key: `sb_publishable_wjGpT2yUDWMY8FilQ3nySw_XTLXtdG2`
- Secret key: **kullanılmayacak, yenilenmesi gerekiyor**

---

## Dosya Yapısı

```
suanakadareniyisi/                         (mevcut çalıştay repo'su)
├── index.html                             (mevcut, dokunulmayacak)
├── css/style.css                          (mevcut)
├── js/                                    (mevcut)
├── vercel.json                            (YENİ — /yemek/k/:kod rewrite)
└── yemek/                                 (YENİ — tüm yemekhane sistemi)
    ├── index.html                         (katılımcı giriş: kod/cached kod → QR)
    ├── k.html                             (katılımcı derin link: /yemek/k/ABC123)
    ├── tara.html                          (görevli scanner)
    ├── panel.html                         (admin dashboard)
    ├── yemek.css                          (tüm yemek sistemi stilleri)
    └── js/
        ├── config.js                      (URL + anon key + sabitler)
        ├── supabase-client.js             (Supabase client factory)
        ├── util.js                        (ortak yardımcılar: tarih, gün hesap, kod üretme)
        ├── katilimci.js                   (index.html + k.html controller)
        ├── tara.js                        (scanner controller)
        └── panel.js                       (admin controller)
```

### Sorumluluklar

| Dosya | Sorumluluk |
|---|---|
| `config.js` | Supabase URL + key + gün sabitler (`GUN1_TARIH = '2026-05-09'`, `GUN2_TARIH = '2026-05-10'`) |
| `supabase-client.js` | Supabase client export'u (singleton) |
| `util.js` | `bugununGunu()`, `randomKod()`, tarih/saat formatlayıcılar |
| `katilimci.js` | Kod'u bul (URL/localStorage/input), Supabase'den kayıt getir, QR render et |
| `tara.js` | Kamera açma, QR okuma, Supabase update, UI feedback, PIN gate |
| `panel.js` | CSV parse, bulk insert, liste/istatistik render, CRUD, PIN gate |
| `yemek.css` | Tüm yemek ekranlarının stili (navy palette'i çalıştay sitesinden import) |

---

## Görev Listesi (Özet)

**MVP (olmazsa olmaz):**
- Task 1: Branch oluştur + klasör hazırlığı
- Task 2: Supabase şeması kur (manuel)
- Task 3: Config + Supabase client + util
- Task 4: Katılımcı sayfası — QR render
- Task 5: Katılımcı sayfası — UI/UX parlatma
- Task 6: Görevli scanner — ana akış
- Task 7: Görevli scanner — PIN + manuel giriş + geri al
- Task 8: Admin panel — auth + CSV yükleme
- Task 9: Admin panel — dashboard + arama + CRUD
- Task 10: Vercel routing + deploy
- Task 11: End-to-end test

**Faz 2 (vakit kalırsa, atlanabilir):**
- Task 12: Service Worker + offline queue
- Task 13: Saatlik grafik
- Task 14: Toplu link paylaşım formatı

---

## Task 1: Branch oluştur ve klasör iskeleti

**Files:**
- Create: `yemek/` (klasör)
- Create: `yemek/js/` (klasör)

- [ ] **Step 1: Yeni branch aç**

```bash
git checkout -b feature/yemekhane-qr
```

Beklenen: `Switched to a new branch 'feature/yemekhane-qr'`

- [ ] **Step 2: Klasörleri oluştur**

```bash
mkdir -p yemek/js
```

- [ ] **Step 3: Boş placeholder dosyaları yarat**

```bash
touch yemek/index.html yemek/k.html yemek/tara.html yemek/panel.html yemek/yemek.css
touch yemek/js/config.js yemek/js/supabase-client.js yemek/js/util.js
touch yemek/js/katilimci.js yemek/js/tara.js yemek/js/panel.js
```

- [ ] **Step 4: Commit iskeleti**

```bash
git add yemek/
git commit -m "scaffold: yemek/ klasör iskeleti"
```

---

## Task 2: Supabase şeması kur (manuel — kullanıcı Dashboard'da yapar)

**Not:** Bu task'ta kod yazılmıyor, kullanıcı Supabase Dashboard'da SQL çalıştırıyor.

- [ ] **Step 1: Supabase Dashboard → SQL Editor'ı aç**

`https://sfoimuxbvxbwywujoeoa.supabase.co` → giriş yap → sol menü "SQL Editor" → "New query"

- [ ] **Step 2: Aşağıdaki SQL'i yapıştır ve Run bas**

```sql
-- ============================================
-- ÇALIŞTAY YEMEKHANE QR SİSTEMİ — ŞEMA
-- ============================================

-- Ana tablo: katılımcılar
CREATE TABLE katilimcilar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kod TEXT UNIQUE NOT NULL,
  ad_soyad TEXT NOT NULL,
  okul TEXT,
  gun1_ogle TIMESTAMPTZ,
  gun2_ogle TIMESTAMPTZ,
  olusturulma TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_katilimcilar_kod ON katilimcilar(kod);
CREATE INDEX idx_katilimcilar_ad ON katilimcilar(ad_soyad);

-- Config tablosu: PIN'ler (tek satır, key-value)
CREATE TABLE yemek_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Başlangıç PIN'leri (etkinlik öncesi değiştir)
INSERT INTO yemek_config (key, value) VALUES
  ('gorevli_pin', '2468'),
  ('admin_pin',   '9753');

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE katilimcilar ENABLE ROW LEVEL SECURITY;
ALTER TABLE yemek_config ENABLE ROW LEVEL SECURITY;

-- katilimcilar: anon SELECT serbest (RLS yüzeysel koruma, asıl koruma app-side)
CREATE POLICY "katilimci_select_anon" ON katilimcilar
  FOR SELECT USING (true);

-- katilimcilar: anon UPDATE serbest (görevli tarama için)
CREATE POLICY "katilimci_update_anon" ON katilimcilar
  FOR UPDATE USING (true);

-- katilimcilar: anon INSERT serbest (admin ekleme için)
CREATE POLICY "katilimci_insert_anon" ON katilimcilar
  FOR INSERT WITH CHECK (true);

-- katilimcilar: anon DELETE serbest (admin silme için)
CREATE POLICY "katilimci_delete_anon" ON katilimcilar
  FOR DELETE USING (true);

-- yemek_config: anon SELECT serbest (PIN doğrulama için)
CREATE POLICY "config_select_anon" ON yemek_config
  FOR SELECT USING (true);

-- ============================================
-- YEMEKTARAMA FONKSİYONU (hem gün hesabı hem çift-alma kontrolü)
-- ============================================

CREATE OR REPLACE FUNCTION yemek_tara(p_kod TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_katilimci katilimcilar%ROWTYPE;
  v_bugun DATE;
  v_simdi TIMESTAMPTZ;
  v_gun_key TEXT;
  v_mevcut TIMESTAMPTZ;
BEGIN
  v_simdi := NOW();
  v_bugun := v_simdi::DATE;

  -- Katılımcıyı bul
  SELECT * INTO v_katilimci FROM katilimcilar WHERE kod = p_kod;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('durum', 'tanimsiz');
  END IF;

  -- Hangi günü güncelleyeceğimizi bul
  IF v_bugun = DATE '2026-05-09' THEN
    v_gun_key := 'gun1';
    v_mevcut := v_katilimci.gun1_ogle;
  ELSIF v_bugun = DATE '2026-05-10' THEN
    v_gun_key := 'gun2';
    v_mevcut := v_katilimci.gun2_ogle;
  ELSE
    -- Etkinlik dışı tarih (test) — gun1 kolonunu kullan,
    -- böylece E2E test akışı çalışır. Etkinlik öncesi temizlenecek.
    v_gun_key := 'gun1';
    v_mevcut := v_katilimci.gun1_ogle;
  END IF;

  -- Zaten almış mı?
  IF v_mevcut IS NOT NULL THEN
    RETURN jsonb_build_object(
      'durum', 'zaten_aldi',
      'ad_soyad', v_katilimci.ad_soyad,
      'okul', v_katilimci.okul,
      'onceki_saat', v_mevcut
    );
  END IF;

  -- Güncelle
  IF v_gun_key = 'gun1' THEN
    UPDATE katilimcilar SET gun1_ogle = v_simdi WHERE id = v_katilimci.id;
  ELSIF v_gun_key = 'gun2' THEN
    UPDATE katilimcilar SET gun2_ogle = v_simdi WHERE id = v_katilimci.id;
  END IF;

  RETURN jsonb_build_object(
    'durum', 'ok',
    'ad_soyad', v_katilimci.ad_soyad,
    'okul', v_katilimci.okul,
    'saat', v_simdi,
    'gun', v_gun_key
  );
END;
$$;

-- anon rolünün fonksiyonu çağırabilmesi için
GRANT EXECUTE ON FUNCTION yemek_tara(TEXT) TO anon;
```

Beklenen: "Success. No rows returned" (tüm DDL/DML başarılı)

- [ ] **Step 3: Tablonun oluştuğunu doğrula**

Dashboard → **Table Editor** → sol listede `katilimcilar` ve `yemek_config` görünsün.

- [ ] **Step 4: Test verisi ekle (opsiyonel ama önerilir)**

SQL Editor'da:

```sql
INSERT INTO katilimcilar (kod, ad_soyad, okul) VALUES
  ('TEST01', 'Ahmet Yılmaz',   'Maltepe Fen Lisesi'),
  ('TEST02', 'Zeynep Kaya',    'Kadıköy Anadolu Lisesi'),
  ('TEST03', 'Mehmet Aydın',   'Galatasaray Lisesi');
```

- [ ] **Step 5: PIN'leri değiştir (etkinlik öncesi, şimdi default kalabilir)**

Default `gorevli_pin=2468`, `admin_pin=9753`. Etkinlik öncesi:

```sql
UPDATE yemek_config SET value = 'XXXX' WHERE key = 'gorevli_pin';
UPDATE yemek_config SET value = 'YYYY' WHERE key = 'admin_pin';
```

- [ ] **Step 6: Geri bildir**

Kullanıcı "tamam, şema kuruldu" derse sonraki task'a geç.

---

## Task 3: Config, Supabase client ve util

**Files:**
- Modify: `yemek/js/config.js`
- Modify: `yemek/js/supabase-client.js`
- Modify: `yemek/js/util.js`
- Create: `yemek/test-connection.html` (geçici test sayfası, sonra silinecek)

- [ ] **Step 1: `yemek/js/config.js` yaz**

```js
// yemek/js/config.js
// Supabase kimlik bilgileri ve proje sabitleri.
// Publishable key HALKA açık amaçla tasarlandı — RLS güvenliği sağlıyor.

export const SUPABASE_URL = 'https://sfoimuxbvxbwywujoeoa.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_wjGpT2yUDWMY8FilQ3nySw_XTLXtdG2';

export const GUN1_TARIH = '2026-05-09';
export const GUN2_TARIH = '2026-05-10';

export const LOCAL_STORAGE_ANAHTAR = 'mfl_yemek_kod';
```

- [ ] **Step 2: `yemek/js/supabase-client.js` yaz**

```js
// yemek/js/supabase-client.js
// Supabase singleton client. ES module, browser-native.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});
```

- [ ] **Step 3: `yemek/js/util.js` yaz**

```js
// yemek/js/util.js
// Ortak yardımcılar.

import { GUN1_TARIH, GUN2_TARIH } from './config.js';

export function bugununGunu() {
  const bugun = new Date().toISOString().slice(0, 10);
  if (bugun === GUN1_TARIH) return 1;
  if (bugun === GUN2_TARIH) return 2;
  return null;
}

export function randomKod(uzunluk = 6) {
  const harfler = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 0, O, 1, I, l karışıklığı yok
  let kod = '';
  for (let i = 0; i < uzunluk; i++) {
    kod += harfler[Math.floor(Math.random() * harfler.length)];
  }
  return kod;
}

export function saatFormatla(tarihIso) {
  if (!tarihIso) return '';
  const t = new Date(tarihIso);
  return t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function tarihFormatla(tarihIso) {
  if (!tarihIso) return '';
  const t = new Date(tarihIso);
  return t.toLocaleDateString('tr-TR') + ' ' + saatFormatla(tarihIso);
}
```

- [ ] **Step 4: `yemek/test-connection.html` oluştur (geçici)**

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Supabase Bağlantı Testi</title>
</head>
<body>
  <h1>Bağlantı testi</h1>
  <p>Console'u aç (F12)</p>
  <div id="sonuc">Yükleniyor...</div>

  <script type="module">
    import { supabase } from './js/supabase-client.js';

    const { data, error } = await supabase
      .from('katilimcilar')
      .select('kod, ad_soyad, okul')
      .limit(5);

    const hedef = document.getElementById('sonuc');
    if (error) {
      hedef.innerText = 'HATA: ' + error.message;
      console.error(error);
    } else {
      hedef.innerText = 'BAŞARILI. ' + data.length + ' satır bulundu:\n' + JSON.stringify(data, null, 2);
      console.log(data);
    }
  </script>
</body>
</html>
```

- [ ] **Step 5: Yerel sunucuda test et**

```bash
npx serve -l 3001
```

Tarayıcıda: `http://localhost:3001/yemek/test-connection.html`

Beklenen: "BAŞARILI. 3 satır bulundu" (Task 2 Step 4'te 3 test kaydı girdiysek)

Eğer "HATA: JWT" veya benzeri çıkarsa → anon key yanlış, `config.js`'i kontrol et.

- [ ] **Step 6: Test dosyasını sil**

```bash
rm yemek/test-connection.html
```

- [ ] **Step 7: Commit**

```bash
git add yemek/js/
git commit -m "feat(yemek): supabase client + config + util"
```

---

## Task 4: Katılımcı sayfası — QR render (temel akış)

**Files:**
- Modify: `yemek/index.html`
- Modify: `yemek/k.html`
- Modify: `yemek/js/katilimci.js`

**Not:** `index.html` ve `k.html` HEMEN HEMEN AYNI. İkisi de `katilimci.js`'i çağırır. Fark: `k.html` URL'den kodu çeker, `index.html` localStorage veya input'tan alır.

- [ ] **Step 1: `yemek/index.html` yaz**

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Çalıştay Yemek QR — MFL FBÇ '26</title>
  <link rel="stylesheet" href="yemek.css">
</head>
<body class="y-katilimci">
  <main class="y-wrap">
    <header class="y-header">
      <h1>Çalıştay Yemek</h1>
      <p class="y-sub">MFL FBÇ '26 — 9-10 Mayıs</p>
    </header>

    <!-- Kod giriş ekranı (QR kod yoksa) -->
    <section id="y-giris" class="y-card" hidden>
      <h2>Katılımcı kodu</h2>
      <p>Sana gönderilen 6 haneli kodu gir:</p>
      <input type="text" id="y-kod-input" maxlength="6" autocapitalize="characters" autocomplete="off">
      <button id="y-kod-submit" class="y-btn y-btn-primary">QR'ımı Göster</button>
      <p id="y-giris-hata" class="y-hata" hidden></p>
    </section>

    <!-- QR gösterim ekranı -->
    <section id="y-qr" class="y-card" hidden>
      <div class="y-katilimci-bilgi">
        <h2 id="y-ad">—</h2>
        <p id="y-okul">—</p>
      </div>

      <div id="y-qr-canvas" class="y-qr-canvas"></div>

      <div class="y-durum-listesi">
        <div class="y-durum-item" id="y-gun1">
          <span class="y-gun-label">9 Mayıs (Cumartesi)</span>
          <span class="y-gun-badge">—</span>
        </div>
        <div class="y-durum-item" id="y-gun2">
          <span class="y-gun-label">10 Mayıs (Pazar)</span>
          <span class="y-gun-badge">—</span>
        </div>
      </div>

      <button id="y-cikis" class="y-btn y-btn-secondary">Farklı katılımcı girişi</button>
    </section>

    <div id="y-offline-banner" class="y-offline" hidden>
      ⚠️ Çevrimdışı — son bilinen durum gösteriliyor
    </div>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <script type="module" src="js/katilimci.js"></script>
</body>
</html>
```

- [ ] **Step 2: `yemek/k.html` yaz (derin link versiyonu)**

`index.html` ile aynı içerik ama başlıkta "başlangıçta kod ekranı yok" davranışı için küçük bir işaret:

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Çalıştay Yemek QR — MFL FBÇ '26</title>
  <link rel="stylesheet" href="yemek.css">
</head>
<body class="y-katilimci" data-mod="link">
  <main class="y-wrap">
    <header class="y-header">
      <h1>Çalıştay Yemek</h1>
      <p class="y-sub">MFL FBÇ '26 — 9-10 Mayıs</p>
    </header>

    <section id="y-qr" class="y-card" hidden>
      <div class="y-katilimci-bilgi">
        <h2 id="y-ad">—</h2>
        <p id="y-okul">—</p>
      </div>
      <div id="y-qr-canvas" class="y-qr-canvas"></div>
      <div class="y-durum-listesi">
        <div class="y-durum-item" id="y-gun1">
          <span class="y-gun-label">9 Mayıs (Cumartesi)</span>
          <span class="y-gun-badge">—</span>
        </div>
        <div class="y-durum-item" id="y-gun2">
          <span class="y-gun-label">10 Mayıs (Pazar)</span>
          <span class="y-gun-badge">—</span>
        </div>
      </div>
      <button id="y-cikis" class="y-btn y-btn-secondary">Farklı katılımcı girişi</button>
    </section>

    <section id="y-giris" class="y-card" hidden>
      <h2>Katılımcı kodu</h2>
      <p>Sana gönderilen 6 haneli kodu gir:</p>
      <input type="text" id="y-kod-input" maxlength="6" autocapitalize="characters" autocomplete="off">
      <button id="y-kod-submit" class="y-btn y-btn-primary">QR'ımı Göster</button>
      <p id="y-giris-hata" class="y-hata" hidden></p>
    </section>

    <div id="y-offline-banner" class="y-offline" hidden>
      ⚠️ Çevrimdışı — son bilinen durum gösteriliyor
    </div>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <script type="module" src="js/katilimci.js"></script>
</body>
</html>
```

- [ ] **Step 3: `yemek/js/katilimci.js` yaz**

```js
// yemek/js/katilimci.js
// Katılımcı sayfası: kod bul, veri çek, QR üret, durum göster.

import { supabase } from './supabase-client.js';
import { LOCAL_STORAGE_ANAHTAR } from './config.js';
import { saatFormatla } from './util.js';

const el = {
  giris:       document.getElementById('y-giris'),
  girisInput:  document.getElementById('y-kod-input'),
  girisBtn:    document.getElementById('y-kod-submit'),
  girisHata:   document.getElementById('y-giris-hata'),
  qr:          document.getElementById('y-qr'),
  ad:          document.getElementById('y-ad'),
  okul:        document.getElementById('y-okul'),
  qrCanvas:    document.getElementById('y-qr-canvas'),
  gun1:        document.getElementById('y-gun1').querySelector('.y-gun-badge'),
  gun2:        document.getElementById('y-gun2').querySelector('.y-gun-badge'),
  cikis:       document.getElementById('y-cikis'),
  offline:     document.getElementById('y-offline-banner')
};

// --- Kod bulma sırası ---
// 1) URL path'den: /yemek/k/ABC123 veya ?kod=ABC123
// 2) localStorage
// 3) Kullanıcıdan iste (input form)

function kodUrldenAl() {
  const qs = new URLSearchParams(window.location.search);
  if (qs.get('kod')) return qs.get('kod').toUpperCase();

  const pathParca = window.location.pathname.split('/').filter(Boolean);
  const kIdx = pathParca.indexOf('k');
  if (kIdx !== -1 && pathParca[kIdx + 1]) return pathParca[kIdx + 1].toUpperCase();

  return null;
}

function kodLocalAl() {
  return localStorage.getItem(LOCAL_STORAGE_ANAHTAR);
}

function kodLocalKaydet(kod) {
  localStorage.setItem(LOCAL_STORAGE_ANAHTAR, kod);
}

function kodLocalSil() {
  localStorage.removeItem(LOCAL_STORAGE_ANAHTAR);
}

// --- Veri çekme ---
async function katilimciGetir(kod) {
  const { data, error } = await supabase
    .from('katilimcilar')
    .select('kod, ad_soyad, okul, gun1_ogle, gun2_ogle')
    .eq('kod', kod)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// --- QR üretme ---
function qrUret(icerik) {
  el.qrCanvas.innerHTML = '';
  QRCode.toCanvas(icerik, {
    width: 280,
    margin: 2,
    color: { dark: '#2C56A5', light: '#FFFFFF' }
  }, (err, canvas) => {
    if (err) { console.error(err); return; }
    el.qrCanvas.appendChild(canvas);
  });
}

// --- Durum rozeti ---
function durumRozetiGuncelle(badgeEl, zaman) {
  if (zaman) {
    badgeEl.textContent = `Aldın (${saatFormatla(zaman)})`;
    badgeEl.className = 'y-gun-badge y-badge-aldi';
  } else {
    badgeEl.textContent = 'Henüz alınmadı';
    badgeEl.className = 'y-gun-badge y-badge-bekle';
  }
}

// --- Ana akış ---
async function goster(kod) {
  el.giris.hidden = true;
  el.qr.hidden = false;

  try {
    const k = await katilimciGetir(kod);
    if (!k) {
      el.qr.hidden = true;
      el.giris.hidden = false;
      el.girisHata.hidden = false;
      el.girisHata.textContent = 'Bu kod sistemde bulunamadı. Kontrol edip tekrar dene.';
      kodLocalSil();
      return;
    }

    el.ad.textContent = k.ad_soyad;
    el.okul.textContent = k.okul || '';
    qrUret(k.kod);
    durumRozetiGuncelle(el.gun1, k.gun1_ogle);
    durumRozetiGuncelle(el.gun2, k.gun2_ogle);
    kodLocalKaydet(k.kod);

    // Cache'e yazıp offline için hazır tut
    localStorage.setItem('mfl_yemek_cache_' + k.kod, JSON.stringify(k));
  } catch (e) {
    console.error(e);
    // Offline fallback
    const cache = localStorage.getItem('mfl_yemek_cache_' + kod);
    if (cache) {
      const k = JSON.parse(cache);
      el.ad.textContent = k.ad_soyad;
      el.okul.textContent = k.okul || '';
      qrUret(k.kod);
      durumRozetiGuncelle(el.gun1, k.gun1_ogle);
      durumRozetiGuncelle(el.gun2, k.gun2_ogle);
      el.offline.hidden = false;
    } else {
      el.qr.hidden = true;
      el.giris.hidden = false;
      el.girisHata.hidden = false;
      el.girisHata.textContent = 'Bağlantı hatası. İnternetini kontrol et.';
    }
  }
}

function girisiGoster() {
  el.giris.hidden = false;
  el.qr.hidden = true;
  el.girisHata.hidden = true;
  el.girisInput.focus();
}

// --- Event handler'lar ---
el.girisBtn.addEventListener('click', () => {
  const kod = el.girisInput.value.trim().toUpperCase();
  if (!kod || kod.length < 4) {
    el.girisHata.hidden = false;
    el.girisHata.textContent = 'Kodu tam gir (6 karakter).';
    return;
  }
  goster(kod);
});

el.girisInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') el.girisBtn.click();
});

el.cikis.addEventListener('click', () => {
  kodLocalSil();
  girisiGoster();
});

// --- Başlangıç ---
const urlKod = kodUrldenAl();
const cachedKod = kodLocalAl();

if (urlKod) {
  goster(urlKod);
} else if (cachedKod) {
  goster(cachedKod);
} else {
  girisiGoster();
}
```

- [ ] **Step 4: Browser'da test et**

```bash
npx serve -l 3001
```

Tarayıcıda:
- `http://localhost:3001/yemek/` → giriş ekranı
- `TEST01` gir → Ahmet Yılmaz çıkmalı, QR görünmeli, "Henüz alınmadı" × 2
- Sayfayı yenile → otomatik açılmalı (localStorage)
- `http://localhost:3001/yemek/k.html?kod=TEST02` → direkt Zeynep Kaya gelmeli
- `http://localhost:3001/yemek/k.html?kod=YOK` → hata mesajı çıkmalı

- [ ] **Step 5: Commit**

```bash
git add yemek/index.html yemek/k.html yemek/js/katilimci.js
git commit -m "feat(yemek): katılımcı sayfası — QR render + localStorage cache"
```

---

## Task 5: Katılımcı sayfası — CSS ve UX

**Files:**
- Modify: `yemek/yemek.css`

- [ ] **Step 1: `yemek/yemek.css` yaz (tüm yemek sistemi ortak stili)**

```css
/* ============================================
   YEMEKHANE QR — TÜM EKRANLAR ORTAK STIL
   ============================================ */

/* Navy palette (çalıştay sitesi tutarlılığı) */
:root {
  --y-navy-dark: #2C56A5;
  --y-navy-primary: #3A64A7;
  --y-navy-medium: #4472B6;
  --y-navy-light: #5381BE;
  --y-accent: #819FCD;
  --y-accent-light: #9FB6D5;

  --y-white: #FFFFFF;
  --y-off-white: #F3F7FC;
  --y-gray-light: #DDE8F3;
  --y-gray: #7B93B8;
  --y-text: #2C56A5;
  --y-text-muted: #7B93B8;

  --y-ok: #2E8B57;
  --y-err: #C73E3A;
  --y-warn: #C69214;

  --y-radius: 14px;
  --y-shadow: 0 8px 32px rgba(44, 86, 165, 0.15);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--y-off-white);
  color: var(--y-text);
  min-height: 100vh;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* Tipografi */
h1 { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 2rem; }
h2 { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.4rem; margin-bottom: 0.5rem; }

/* ============================================
   KATILIMCI SAYFASI
   ============================================ */
.y-katilimci { padding: 0; }

.y-wrap {
  max-width: 480px;
  margin: 0 auto;
  padding: 2rem 1.25rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.y-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.y-header h1 { color: var(--y-navy-dark); }
.y-sub { color: var(--y-text-muted); font-size: 0.95rem; margin-top: 0.25rem; }

.y-card {
  background: var(--y-white);
  border-radius: var(--y-radius);
  padding: 1.75rem 1.5rem;
  box-shadow: var(--y-shadow);
  border: 1px solid var(--y-gray-light);
}

.y-katilimci-bilgi { text-align: center; margin-bottom: 1.25rem; }
.y-katilimci-bilgi h2 { color: var(--y-navy-dark); margin-bottom: 0.25rem; }
.y-katilimci-bilgi p { color: var(--y-text-muted); font-size: 1rem; }

.y-qr-canvas {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  background: var(--y-white);
  border-radius: var(--y-radius);
  margin: 1rem 0 1.5rem;
  border: 2px solid var(--y-gray-light);
}

.y-qr-canvas canvas { display: block; max-width: 100%; height: auto; }

/* Durum rozetleri */
.y-durum-listesi { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.25rem; }

.y-durum-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--y-off-white);
  border-radius: 10px;
  font-size: 0.95rem;
}

.y-gun-label { font-weight: 600; color: var(--y-navy-dark); }

.y-gun-badge {
  font-size: 0.85rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-weight: 600;
}

.y-badge-aldi {
  background: rgba(46, 139, 87, 0.12);
  color: var(--y-ok);
}

.y-badge-bekle {
  background: rgba(123, 147, 184, 0.12);
  color: var(--y-text-muted);
}

/* Form */
input[type="text"], input[type="password"], input[type="file"] {
  width: 100%;
  padding: 0.9rem 1rem;
  font-size: 1.1rem;
  border: 2px solid var(--y-gray-light);
  border-radius: 10px;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  font-family: inherit;
  color: var(--y-text);
  background: var(--y-white);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

input[type="text"]:focus, input[type="password"]:focus {
  outline: none;
  border-color: var(--y-navy-medium);
}

/* Butonlar */
.y-btn {
  width: 100%;
  padding: 0.95rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.08s, box-shadow 0.15s, background 0.15s;
}

.y-btn:active { transform: scale(0.98); }

.y-btn-primary {
  background: var(--y-navy-primary);
  color: var(--y-white);
}

.y-btn-primary:hover {
  background: var(--y-navy-dark);
  box-shadow: 0 4px 14px rgba(44, 86, 165, 0.35);
}

.y-btn-secondary {
  background: transparent;
  color: var(--y-navy-primary);
  border: 2px solid var(--y-gray-light);
  margin-top: 1rem;
}

.y-btn-secondary:hover {
  background: var(--y-off-white);
  border-color: var(--y-navy-light);
}

/* Hata */
.y-hata {
  color: var(--y-err);
  font-size: 0.9rem;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(199, 62, 58, 0.08);
  border-radius: 8px;
}

/* Offline */
.y-offline {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(198, 146, 20, 0.12);
  color: var(--y-warn);
  border-radius: 10px;
  font-size: 0.9rem;
  text-align: center;
}
```

- [ ] **Step 2: Browser'da tekrar test et**

`http://localhost:3001/yemek/` — stil düzgün uygulanmış olmalı, mobil genişlikte (DevTools → 375px) düzgün görünmeli.

- [ ] **Step 3: Commit**

```bash
git add yemek/yemek.css
git commit -m "style(yemek): katılımcı sayfası navy palette + responsive"
```

---

## Task 6: Görevli scanner — ana akış

**Files:**
- Modify: `yemek/tara.html`
- Modify: `yemek/js/tara.js`
- Modify: `yemek/yemek.css` (scanner stilleri eklenecek)

- [ ] **Step 1: `yemek/tara.html` yaz**

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Görevli Tarama — Yemek QR</title>
  <link rel="stylesheet" href="yemek.css">
</head>
<body class="y-tara">
  <!-- PIN Gate -->
  <section id="t-pin-gate" class="y-card t-pin-card">
    <h2>Görevli Girişi</h2>
    <p>4 haneli PIN'i gir:</p>
    <input type="password" id="t-pin-input" maxlength="8" inputmode="numeric">
    <button id="t-pin-submit" class="y-btn y-btn-primary">Giriş</button>
    <p id="t-pin-hata" class="y-hata" hidden></p>
  </section>

  <!-- Scanner Ana Arayüz -->
  <main id="t-main" hidden>
    <header class="t-header">
      <div>
        <h1>Yemek Tarama</h1>
        <p id="t-sayim">—</p>
      </div>
      <button id="t-manuel-btn" class="y-btn-sec-small">Manuel giriş</button>
    </header>

    <div id="t-scanner" class="t-scanner"></div>

    <div id="t-sonuc" class="t-sonuc t-sonuc-idle">
      <div class="t-sonuc-ikon">📷</div>
      <div class="t-sonuc-metin">Tarama bekliyor...</div>
    </div>

    <section class="t-son-taramalar">
      <h3>Son taramalar</h3>
      <ul id="t-gecmis"></ul>
    </section>
  </main>

  <!-- Manuel Giriş Modal -->
  <div id="t-manuel-modal" class="t-modal" hidden>
    <div class="t-modal-inner">
      <h2>Manuel Giriş</h2>
      <p>Telefon unutan için: kod veya isim ara</p>
      <input type="text" id="t-manuel-arama" placeholder="Kod / isim / okul">
      <ul id="t-manuel-sonuclar" class="t-manuel-sonuclar"></ul>
      <button id="t-manuel-kapat" class="y-btn y-btn-secondary">Kapat</button>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
  <script type="module" src="js/tara.js"></script>
</body>
</html>
```

- [ ] **Step 2: `yemek/js/tara.js` — ilk sürüm (PIN + scanner)**

```js
// yemek/js/tara.js
// Görevli tarama kontrolörü.

import { supabase } from './supabase-client.js';
import { saatFormatla } from './util.js';

const el = {
  pinGate:   document.getElementById('t-pin-gate'),
  pinInput:  document.getElementById('t-pin-input'),
  pinSubmit: document.getElementById('t-pin-submit'),
  pinHata:   document.getElementById('t-pin-hata'),
  main:      document.getElementById('t-main'),
  sayim:     document.getElementById('t-sayim'),
  manuelBtn: document.getElementById('t-manuel-btn'),
  scanner:   document.getElementById('t-scanner'),
  sonuc:     document.getElementById('t-sonuc'),
  gecmis:    document.getElementById('t-gecmis'),
  manuelModal:    document.getElementById('t-manuel-modal'),
  manuelArama:    document.getElementById('t-manuel-arama'),
  manuelSonuclar: document.getElementById('t-manuel-sonuclar'),
  manuelKapat:    document.getElementById('t-manuel-kapat'),
};

let qrReader = null;
let kilitli = false; // tarama sonrası 1.5sn kilit (çift okuma engeli)
const gecmis = []; // { zaman, ad_soyad, durum, kod, id }

// --- PIN Kontrolü ---
async function pinKontrol(pin) {
  const { data, error } = await supabase
    .from('yemek_config')
    .select('value')
    .eq('key', 'gorevli_pin')
    .maybeSingle();
  if (error) throw error;
  return data && data.value === pin;
}

el.pinSubmit.addEventListener('click', async () => {
  const pin = el.pinInput.value.trim();
  try {
    const ok = await pinKontrol(pin);
    if (ok) {
      el.pinGate.hidden = true;
      el.main.hidden = false;
      sessionStorage.setItem('t-pin-ok', '1');
      scannerBaslat();
      sayimGuncelle();
    } else {
      el.pinHata.hidden = false;
      el.pinHata.textContent = 'PIN hatalı.';
    }
  } catch (e) {
    el.pinHata.hidden = false;
    el.pinHata.textContent = 'Bağlantı hatası: ' + e.message;
  }
});

el.pinInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') el.pinSubmit.click();
});

// Önceden giriş yaptıysa (aynı oturum)
if (sessionStorage.getItem('t-pin-ok') === '1') {
  el.pinGate.hidden = true;
  el.main.hidden = false;
}

// --- Scanner ---
function scannerBaslat() {
  qrReader = new Html5Qrcode('t-scanner');
  qrReader.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 240, height: 240 } },
    onQrOkundu,
    () => { /* tarama hatası — sessizce geç */ }
  ).catch(err => {
    console.error('Scanner açılamadı:', err);
    sonucGoster('err', '📷', 'Kamera açılamadı: ' + err.message);
  });
}

async function onQrOkundu(kod) {
  if (kilitli) return;
  kilitli = true;
  kod = (kod || '').trim().toUpperCase();

  try {
    const { data, error } = await supabase.rpc('yemek_tara', { p_kod: kod });
    if (error) throw error;

    taramaSonucUygula(data, kod);
  } catch (e) {
    console.error(e);
    sonucGoster('err', '⚠️', 'Hata: ' + e.message);
  }

  setTimeout(() => { kilitli = false; idleyeDon(); }, 1500);
}

function taramaSonucUygula(data, kod) {
  if (data.durum === 'ok') {
    sonucGoster('ok', '✅', `${data.ad_soyad}\n${data.okul || ''}\nAfiyet olsun`);
    bipCal('ok');
    gecmiseEkle({ ad_soyad: data.ad_soyad, zaman: data.saat, durum: 'ok', kod });
  } else if (data.durum === 'zaten_aldi') {
    sonucGoster('err', '⛔', `${data.ad_soyad}\nBugün ${saatFormatla(data.onceki_saat)}'te aldı`);
    bipCal('err');
    gecmiseEkle({ ad_soyad: data.ad_soyad, zaman: data.onceki_saat, durum: 'zaten', kod });
  } else if (data.durum === 'tanimsiz') {
    sonucGoster('warn', '⚠️', `Tanımsız kod: ${kod}`);
    bipCal('warn');
  }
  sayimGuncelle();
}

function sonucGoster(tip, ikon, metin) {
  el.sonuc.className = 't-sonuc t-sonuc-' + tip;
  el.sonuc.querySelector('.t-sonuc-ikon').textContent = ikon;
  el.sonuc.querySelector('.t-sonuc-metin').textContent = metin;
}

function idleyeDon() {
  el.sonuc.className = 't-sonuc t-sonuc-idle';
  el.sonuc.querySelector('.t-sonuc-ikon').textContent = '📷';
  el.sonuc.querySelector('.t-sonuc-metin').textContent = 'Tarama bekliyor...';
}

// --- Ses ---
const audioCtx = typeof AudioContext !== 'undefined' ? new AudioContext() : null;
function bipCal(tip) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.frequency.value = tip === 'ok' ? 880 : tip === 'err' ? 220 : 440;
  g.gain.setValueAtTime(0.1, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  o.start(); o.stop(audioCtx.currentTime + 0.3);
}

// --- Geçmiş ---
function gecmiseEkle(kayit) {
  gecmis.unshift(kayit);
  if (gecmis.length > 20) gecmis.pop();
  gecmisiRenderle();
}

function gecmisiRenderle() {
  el.gecmis.innerHTML = '';
  gecmis.forEach((k, idx) => {
    const li = document.createElement('li');
    li.className = 't-gecmis-' + k.durum;
    li.innerHTML = `
      <span class="t-g-saat">${saatFormatla(k.zaman)}</span>
      <span class="t-g-ad">${k.ad_soyad}</span>
      <span class="t-g-durum">${k.durum === 'ok' ? '✅' : k.durum === 'zaten' ? '⛔' : '⚠️'}</span>
      ${k.durum === 'ok' ? `<button data-idx="${idx}" class="t-g-geri">Geri al</button>` : ''}
    `;
    el.gecmis.appendChild(li);
  });
}

// Geri al (event delegation)
el.gecmis.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('t-g-geri')) return;
  const idx = parseInt(e.target.dataset.idx);
  const kayit = gecmis[idx];
  if (!confirm(`${kayit.ad_soyad} için kaydı iptal et?`)) return;

  // Hangi günse o kolonu null yap
  const { data, error } = await supabase
    .from('katilimcilar')
    .select('gun1_ogle, gun2_ogle, id')
    .eq('kod', kayit.kod)
    .maybeSingle();

  if (error || !data) { alert('Hata: ' + (error?.message || 'bulunamadı')); return; }

  const guncelleme = {};
  if (data.gun1_ogle) guncelleme.gun1_ogle = null;
  else if (data.gun2_ogle) guncelleme.gun2_ogle = null;

  const { error: err2 } = await supabase
    .from('katilimcilar')
    .update(guncelleme)
    .eq('id', data.id);

  if (err2) { alert('Hata: ' + err2.message); return; }

  gecmis.splice(idx, 1);
  gecmisiRenderle();
  sayimGuncelle();
});

// --- Sayım (sol üstte "bugüne kadar X aldı") ---
async function sayimGuncelle() {
  const bugun = new Date().toISOString().slice(0, 10);
  const kolon = bugun === '2026-05-10' ? 'gun2_ogle' : 'gun1_ogle';

  const { count: alan } = await supabase
    .from('katilimcilar')
    .select('*', { count: 'exact', head: true })
    .not(kolon, 'is', null);

  const { count: toplam } = await supabase
    .from('katilimcilar')
    .select('*', { count: 'exact', head: true });

  el.sayim.textContent = `Bugün ${alan || 0} / ${toplam || 0} aldı`;
}

// --- Manuel giriş modal ---
el.manuelBtn.addEventListener('click', () => {
  el.manuelModal.hidden = false;
  el.manuelArama.value = '';
  el.manuelSonuclar.innerHTML = '';
  el.manuelArama.focus();
});

el.manuelKapat.addEventListener('click', () => {
  el.manuelModal.hidden = true;
});

let manuelTimer;
el.manuelArama.addEventListener('input', () => {
  clearTimeout(manuelTimer);
  manuelTimer = setTimeout(manuelAra, 300);
});

async function manuelAra() {
  const q = el.manuelArama.value.trim();
  if (q.length < 2) { el.manuelSonuclar.innerHTML = ''; return; }

  const { data, error } = await supabase
    .from('katilimcilar')
    .select('kod, ad_soyad, okul, gun1_ogle, gun2_ogle')
    .or(`kod.ilike.%${q}%,ad_soyad.ilike.%${q}%,okul.ilike.%${q}%`)
    .limit(10);

  if (error) { console.error(error); return; }

  el.manuelSonuclar.innerHTML = '';
  data.forEach(k => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${k.ad_soyad}</strong>
        <small>${k.okul || ''} · ${k.kod}</small>
      </div>
      <button data-kod="${k.kod}" class="y-btn y-btn-primary">Onayla</button>
    `;
    el.manuelSonuclar.appendChild(li);
  });
}

el.manuelSonuclar.addEventListener('click', async (e) => {
  if (e.target.tagName !== 'BUTTON') return;
  const kod = e.target.dataset.kod;
  el.manuelModal.hidden = true;
  onQrOkundu(kod);
});
```

- [ ] **Step 3: `yemek.css`'e scanner stillerini ekle (dosya sonuna)**

```css
/* ============================================
   GÖREVLİ TARAMA
   ============================================ */
.y-tara { background: #0E1A30; color: var(--y-white); min-height: 100vh; }

.t-pin-card { max-width: 400px; margin: 4rem auto; }
.t-pin-card h2 { color: var(--y-navy-dark); }

.t-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  background: var(--y-navy-dark);
  color: var(--y-white);
}

.t-header h1 { font-size: 1.25rem; color: var(--y-white); }
.t-header p { color: var(--y-accent-light); font-size: 0.85rem; margin-top: 0.2rem; }

.y-btn-sec-small {
  padding: 0.5rem 0.9rem;
  font-size: 0.85rem;
  background: transparent;
  color: var(--y-white);
  border: 1px solid var(--y-accent);
  border-radius: 6px;
  cursor: pointer;
}

.t-scanner {
  width: 100%;
  max-width: 500px;
  margin: 1rem auto;
  background: #000;
  border-radius: var(--y-radius);
  overflow: hidden;
}

.t-scanner video { width: 100%; display: block; }

.t-sonuc {
  max-width: 500px;
  margin: 0 auto 1rem;
  padding: 1.5rem 1.25rem;
  border-radius: var(--y-radius);
  text-align: center;
  transition: background 0.2s;
}

.t-sonuc-ikon { font-size: 3rem; margin-bottom: 0.5rem; }
.t-sonuc-metin { font-size: 1.1rem; font-weight: 600; white-space: pre-line; }

.t-sonuc-idle { background: rgba(255,255,255,0.05); }
.t-sonuc-ok   { background: var(--y-ok); color: white; }
.t-sonuc-err  { background: var(--y-err); color: white; }
.t-sonuc-warn { background: var(--y-warn); color: white; }

.t-son-taramalar {
  max-width: 500px;
  margin: 2rem auto 1rem;
  padding: 0 1.25rem;
}

.t-son-taramalar h3 { font-size: 1rem; margin-bottom: 0.75rem; color: var(--y-accent-light); }

#t-gecmis { list-style: none; padding: 0; }
#t-gecmis li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  margin-bottom: 0.3rem;
  background: rgba(255,255,255,0.04);
  border-radius: 8px;
  font-size: 0.9rem;
}

.t-g-saat { color: var(--y-accent); min-width: 48px; }
.t-g-ad { flex: 1; }
.t-g-durum { min-width: 24px; text-align: center; }
.t-g-geri {
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  background: var(--y-err);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Manuel giriş modal */
.t-modal {
  position: fixed; inset: 0;
  background: rgba(14, 26, 48, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.t-modal-inner {
  background: var(--y-white);
  color: var(--y-text);
  padding: 1.5rem;
  border-radius: var(--y-radius);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.t-manuel-sonuclar { list-style: none; padding: 0; margin: 1rem 0; }
.t-manuel-sonuclar li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border-bottom: 1px solid var(--y-gray-light);
  gap: 0.5rem;
}

.t-manuel-sonuclar small { display: block; color: var(--y-text-muted); font-size: 0.8rem; }
.t-manuel-sonuclar button { padding: 0.5rem 0.8rem; font-size: 0.85rem; width: auto; }
```

- [ ] **Step 4: Browser'da test et**

Tarayıcıda `http://localhost:3001/yemek/tara.html`:
- PIN gir: `2468` → giriş olmalı (kamera izni iste → ver)
- Başka sekmede `k.html?kod=TEST01` açıp QR'ı ekranda göster
- Scanner'a QR'ı göster (telefondan değil, bilgisayar ekranından) → ✅ yeşil "Ahmet Yılmaz, Afiyet olsun"
- Aynı QR'ı tekrar göster → ⛔ kırmızı "bugün aldı"
- "Manuel giriş" butonu → `zey` ara → Zeynep çıkmalı → "Onayla" → ✅
- Liste alta yazılmalı, "Geri al" ile iptal edilmeli

- [ ] **Step 5: Commit**

```bash
git add yemek/tara.html yemek/js/tara.js yemek/yemek.css
git commit -m "feat(yemek): görevli scanner — QR okuma + PIN + manuel giriş + geçmiş"
```

---

## Task 7: Admin panel — auth + CSV upload + liste

**Files:**
- Modify: `yemek/panel.html`
- Modify: `yemek/js/panel.js`
- Modify: `yemek/yemek.css` (panel stilleri)

- [ ] **Step 1: `yemek/panel.html` yaz**

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel — Yemek QR</title>
  <link rel="stylesheet" href="yemek.css">
</head>
<body class="y-panel">
  <!-- PIN Gate -->
  <section id="p-pin-gate" class="y-card p-pin-card">
    <h2>Yönetici Girişi</h2>
    <input type="password" id="p-pin-input" maxlength="8" inputmode="numeric" placeholder="PIN">
    <button id="p-pin-submit" class="y-btn y-btn-primary">Giriş</button>
    <p id="p-pin-hata" class="y-hata" hidden></p>
  </section>

  <!-- Ana Panel -->
  <main id="p-main" hidden>
    <header class="p-header">
      <h1>Yemek QR — Yönetim</h1>
      <div id="p-sayac" class="p-sayac">—</div>
    </header>

    <nav class="p-tabs">
      <button class="p-tab p-tab-aktif" data-tab="liste">Liste</button>
      <button class="p-tab" data-tab="ekle">Toplu Ekle</button>
    </nav>

    <!-- Liste tab -->
    <section id="p-tab-liste" class="p-section">
      <div class="p-liste-ust">
        <input type="text" id="p-arama" placeholder="Ad / okul / kod ara">
        <button id="p-yenile" class="y-btn y-btn-secondary p-btn-sm">Yenile</button>
      </div>
      <table class="p-tablo">
        <thead>
          <tr>
            <th>Ad Soyad</th>
            <th>Okul</th>
            <th>Kod</th>
            <th>9 May</th>
            <th>10 May</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="p-liste-govde"></tbody>
      </table>
    </section>

    <!-- Ekle tab -->
    <section id="p-tab-ekle" class="p-section" hidden>
      <h2>CSV / Excel yükle</h2>
      <p>Kolonlar: <code>ad_soyad</code>, <code>okul</code> (opsiyonel). Her satır bir katılımcı.</p>
      <input type="file" id="p-csv-file" accept=".csv,.txt">
      <div id="p-csv-onizleme" class="p-csv-onizleme" hidden></div>
      <button id="p-csv-yukle" class="y-btn y-btn-primary" hidden>Sisteme Ekle</button>

      <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--y-gray-light);">

      <h2>Tek tek ekle</h2>
      <form id="p-tek-form">
        <input type="text" id="p-tek-ad" placeholder="Ad Soyad" required>
        <input type="text" id="p-tek-okul" placeholder="Okul">
        <button type="submit" class="y-btn y-btn-primary">Ekle</button>
      </form>
    </section>

    <!-- Toplu link listesi (ekleme sonrası görünür) -->
    <section id="p-linkler" class="p-section" hidden>
      <h2>Oluşturulan linkler</h2>
      <p>Aşağıyı kopyalayıp WhatsApp/email ile paylaşabilirsin:</p>
      <textarea id="p-link-metin" rows="10" readonly></textarea>
      <button id="p-link-kopyala" class="y-btn y-btn-primary">Kopyala</button>
    </section>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
  <script type="module" src="js/panel.js"></script>
</body>
</html>
```

- [ ] **Step 2: `yemek/js/panel.js` yaz**

```js
// yemek/js/panel.js
// Admin panel kontrolörü.

import { supabase } from './supabase-client.js';
import { randomKod, saatFormatla } from './util.js';

const BASE_URL = window.location.origin + '/yemek/k/';

const el = {
  pinGate:   document.getElementById('p-pin-gate'),
  pinInput:  document.getElementById('p-pin-input'),
  pinSubmit: document.getElementById('p-pin-submit'),
  pinHata:   document.getElementById('p-pin-hata'),
  main:      document.getElementById('p-main'),
  sayac:     document.getElementById('p-sayac'),
  tabs:      document.querySelectorAll('.p-tab'),
  tabListe:  document.getElementById('p-tab-liste'),
  tabEkle:   document.getElementById('p-tab-ekle'),
  arama:     document.getElementById('p-arama'),
  yenile:    document.getElementById('p-yenile'),
  listeGovde: document.getElementById('p-liste-govde'),
  csvFile:     document.getElementById('p-csv-file'),
  csvOnizleme: document.getElementById('p-csv-onizleme'),
  csvYukle:    document.getElementById('p-csv-yukle'),
  tekForm:     document.getElementById('p-tek-form'),
  tekAd:       document.getElementById('p-tek-ad'),
  tekOkul:     document.getElementById('p-tek-okul'),
  linkler:     document.getElementById('p-linkler'),
  linkMetin:   document.getElementById('p-link-metin'),
  linkKopyala: document.getElementById('p-link-kopyala'),
};

let csvKayitlari = null;

// --- PIN ---
async function pinKontrol(pin) {
  const { data, error } = await supabase
    .from('yemek_config')
    .select('value')
    .eq('key', 'admin_pin')
    .maybeSingle();
  if (error) throw error;
  return data && data.value === pin;
}

el.pinSubmit.addEventListener('click', async () => {
  try {
    const ok = await pinKontrol(el.pinInput.value.trim());
    if (ok) {
      el.pinGate.hidden = true;
      el.main.hidden = false;
      sessionStorage.setItem('p-pin-ok', '1');
      await listeleYenile();
      await sayacGuncelle();
    } else {
      el.pinHata.hidden = false;
      el.pinHata.textContent = 'PIN hatalı';
    }
  } catch (e) {
    el.pinHata.hidden = false;
    el.pinHata.textContent = 'Bağlantı hatası: ' + e.message;
  }
});

el.pinInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') el.pinSubmit.click();
});

if (sessionStorage.getItem('p-pin-ok') === '1') {
  el.pinGate.hidden = true;
  el.main.hidden = false;
  listeleYenile();
  sayacGuncelle();
}

// --- Tab switching ---
el.tabs.forEach(t => {
  t.addEventListener('click', () => {
    el.tabs.forEach(x => x.classList.remove('p-tab-aktif'));
    t.classList.add('p-tab-aktif');
    el.tabListe.hidden = t.dataset.tab !== 'liste';
    el.tabEkle.hidden = t.dataset.tab !== 'ekle';
  });
});

// --- Liste yenile + arama ---
async function listeleYenile(aramaQ = '') {
  let q = supabase
    .from('katilimcilar')
    .select('id, kod, ad_soyad, okul, gun1_ogle, gun2_ogle')
    .order('ad_soyad');

  if (aramaQ.trim().length >= 2) {
    const s = aramaQ.trim();
    q = q.or(`ad_soyad.ilike.%${s}%,okul.ilike.%${s}%,kod.ilike.%${s}%`);
  }

  const { data, error } = await q;
  if (error) { alert(error.message); return; }

  listeyiRenderle(data || []);
}

function listeyiRenderle(kayitlar) {
  el.listeGovde.innerHTML = '';
  kayitlar.forEach(k => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${k.ad_soyad}</td>
      <td>${k.okul || ''}</td>
      <td><code>${k.kod}</code></td>
      <td>${gunHucresi(k.gun1_ogle, k.id, 'gun1_ogle')}</td>
      <td>${gunHucresi(k.gun2_ogle, k.id, 'gun2_ogle')}</td>
      <td>
        <button class="p-btn-sil" data-id="${k.id}" data-ad="${k.ad_soyad}">Sil</button>
      </td>
    `;
    el.listeGovde.appendChild(tr);
  });
}

function gunHucresi(zaman, id, kolon) {
  if (zaman) {
    return `<span class="p-aldi" data-id="${id}" data-kol="${kolon}" title="tıkla → sıfırla">${saatFormatla(zaman)}</span>`;
  }
  return `<span class="p-almadi" data-id="${id}" data-kol="${kolon}" title="tıkla → alındı işaretle">—</span>`;
}

// Liste içindeki etkileşim (event delegation)
el.listeGovde.addEventListener('click', async (e) => {
  const aldi = e.target.closest('.p-aldi');
  const almadi = e.target.closest('.p-almadi');
  const sil = e.target.closest('.p-btn-sil');

  if (aldi) {
    const id = aldi.dataset.id;
    const kol = aldi.dataset.kol;
    if (!confirm('Bu kayıt silinsin mi (sıfırla)?')) return;
    await supabase.from('katilimcilar').update({ [kol]: null }).eq('id', id);
    await listeleYenile(el.arama.value);
    sayacGuncelle();
  } else if (almadi) {
    const id = almadi.dataset.id;
    const kol = almadi.dataset.kol;
    if (!confirm('Manuel olarak alındı işaretle?')) return;
    await supabase.from('katilimcilar').update({ [kol]: new Date().toISOString() }).eq('id', id);
    await listeleYenile(el.arama.value);
    sayacGuncelle();
  } else if (sil) {
    const id = sil.dataset.id;
    const ad = sil.dataset.ad;
    if (!confirm(`${ad} katılımcısı tamamen silinsin mi?`)) return;
    await supabase.from('katilimcilar').delete().eq('id', id);
    await listeleYenile(el.arama.value);
    sayacGuncelle();
  }
});

// Arama (debounced)
let aramaTimer;
el.arama.addEventListener('input', () => {
  clearTimeout(aramaTimer);
  aramaTimer = setTimeout(() => listeleYenile(el.arama.value), 300);
});

el.yenile.addEventListener('click', () => listeleYenile(el.arama.value));

// --- Sayaç ---
async function sayacGuncelle() {
  const { count: toplam } = await supabase.from('katilimcilar').select('*', { count: 'exact', head: true });
  const { count: g1 } = await supabase.from('katilimcilar').select('*', { count: 'exact', head: true }).not('gun1_ogle', 'is', null);
  const { count: g2 } = await supabase.from('katilimcilar').select('*', { count: 'exact', head: true }).not('gun2_ogle', 'is', null);
  el.sayac.textContent = `Toplam: ${toplam || 0} · 9 May: ${g1 || 0} · 10 May: ${g2 || 0}`;
}

// --- CSV yükleme ---
el.csvFile.addEventListener('change', (e) => {
  const dosya = e.target.files[0];
  if (!dosya) return;

  Papa.parse(dosya, {
    header: true,
    skipEmptyLines: true,
    complete: (sonuc) => {
      csvKayitlari = (sonuc.data || []).map(r => ({
        ad_soyad: (r.ad_soyad || r['Ad Soyad'] || r.ad || '').trim(),
        okul: (r.okul || r['Okul'] || '').trim()
      })).filter(r => r.ad_soyad);

      el.csvOnizleme.hidden = false;
      el.csvOnizleme.innerHTML = `
        <strong>${csvKayitlari.length} kayıt hazır</strong>
        <ul>${csvKayitlari.slice(0, 5).map(r => `<li>${r.ad_soyad} — ${r.okul}</li>`).join('')}${csvKayitlari.length > 5 ? `<li>...ve ${csvKayitlari.length - 5} daha</li>` : ''}</ul>
      `;
      el.csvYukle.hidden = false;
    }
  });
});

el.csvYukle.addEventListener('click', async () => {
  if (!csvKayitlari || csvKayitlari.length === 0) return;

  const kayitlarKodlu = csvKayitlari.map(r => ({
    ...r,
    kod: randomKod()
  }));

  const { data, error } = await supabase
    .from('katilimcilar')
    .insert(kayitlarKodlu)
    .select();

  if (error) { alert('Hata: ' + error.message); return; }

  linkleriGoster(data);
  csvKayitlari = null;
  el.csvFile.value = '';
  el.csvOnizleme.hidden = true;
  el.csvYukle.hidden = true;
  await listeleYenile();
  await sayacGuncelle();
});

// --- Tek kişi ekleme ---
el.tekForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const kayit = {
    ad_soyad: el.tekAd.value.trim(),
    okul: el.tekOkul.value.trim() || null,
    kod: randomKod()
  };

  const { data, error } = await supabase
    .from('katilimcilar')
    .insert(kayit)
    .select()
    .single();

  if (error) { alert('Hata: ' + error.message); return; }

  el.tekAd.value = '';
  el.tekOkul.value = '';
  linkleriGoster([data]);
  await listeleYenile();
  await sayacGuncelle();
});

// --- Link çıktısı ---
function linkleriGoster(kayitlar) {
  const metin = kayitlar.map(k => `${k.ad_soyad}: ${BASE_URL}${k.kod}`).join('\n');
  el.linkler.hidden = false;
  el.linkMetin.value = metin;
  el.linkler.scrollIntoView({ behavior: 'smooth' });
}

el.linkKopyala.addEventListener('click', async () => {
  await navigator.clipboard.writeText(el.linkMetin.value);
  el.linkKopyala.textContent = 'Kopyalandı ✓';
  setTimeout(() => { el.linkKopyala.textContent = 'Kopyala'; }, 2000);
});
```

- [ ] **Step 3: `yemek.css`'e panel stillerini ekle**

```css
/* ============================================
   ADMIN PANEL
   ============================================ */
.y-panel { padding: 0; }

.p-pin-card { max-width: 400px; margin: 4rem auto; }

.p-header {
  background: var(--y-navy-dark);
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.p-header h1 { color: white; font-size: 1.25rem; }
.p-sayac { font-size: 0.9rem; color: var(--y-accent-light); }

.p-tabs {
  background: var(--y-navy-primary);
  display: flex;
  padding: 0 1rem;
}

.p-tab {
  background: transparent;
  border: none;
  color: var(--y-accent-light);
  padding: 0.85rem 1.25rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-family: inherit;
  border-bottom: 3px solid transparent;
}

.p-tab-aktif {
  color: white;
  border-bottom-color: var(--y-accent);
  font-weight: 600;
}

.p-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem;
}

.p-liste-ust {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  align-items: center;
}

.p-liste-ust input[type="text"] {
  flex: 1;
  margin: 0;
  text-transform: none;
  letter-spacing: normal;
}

.p-btn-sm { width: auto; padding: 0.6rem 1rem; font-size: 0.85rem; margin: 0; }

.p-tablo {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: var(--y-radius);
  overflow: hidden;
  box-shadow: var(--y-shadow);
}

.p-tablo th, .p-tablo td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--y-gray-light);
  font-size: 0.9rem;
}

.p-tablo th {
  background: var(--y-off-white);
  font-weight: 600;
  color: var(--y-navy-dark);
}

.p-tablo code {
  background: var(--y-off-white);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.p-aldi {
  color: var(--y-ok);
  font-weight: 600;
  cursor: pointer;
}

.p-almadi {
  color: var(--y-text-muted);
  cursor: pointer;
}

.p-btn-sil {
  padding: 0.3rem 0.7rem;
  font-size: 0.8rem;
  background: transparent;
  color: var(--y-err);
  border: 1px solid var(--y-err);
  border-radius: 4px;
  cursor: pointer;
}

.p-btn-sil:hover { background: var(--y-err); color: white; }

.p-csv-onizleme {
  background: var(--y-off-white);
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-size: 0.9rem;
}

.p-csv-onizleme ul { margin-top: 0.5rem; padding-left: 1.5rem; }

#p-tek-form input { text-transform: none; letter-spacing: normal; }

#p-link-metin {
  width: 100%;
  padding: 0.75rem;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  border: 1px solid var(--y-gray-light);
  border-radius: 8px;
  margin-bottom: 0.75rem;
}
```

- [ ] **Step 4: Test**

Tarayıcıda `http://localhost:3001/yemek/panel.html`:
- PIN: `9753` → panel açılmalı
- "Liste" tab'ında 3 test verisi görünmeli
- Arama "Ahmet" → sadece Ahmet
- "Toplu Ekle" → tek kişi ekle: "Test Kişi", "Test Okul" → eklenmeli
- Link çıktısı görünmeli, kopyalanabilir olmalı
- Liste geri dön → yeni kişi görünmeli

CSV testi için bir test CSV'si yarat:
```
ad_soyad,okul
Ali Veli,Ankara Fen
Ayşe Fatma,İzmir Fen
```

Dosyayı seç → önizleme → yükle → 2 yeni kayıt + link çıktısı.

- [ ] **Step 5: Commit**

```bash
git add yemek/panel.html yemek/js/panel.js yemek/yemek.css
git commit -m "feat(yemek): admin panel — liste + CSV upload + CRUD + link üretimi"
```

---

## Task 8: Vercel routing (derin link)

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: `vercel.json` oluştur**

```json
{
  "rewrites": [
    { "source": "/yemek/k/:kod", "destination": "/yemek/k.html?kod=:kod" }
  ]
}
```

- [ ] **Step 2: Yerel test**

`npx serve` bu rewrite'ı desteklemez, ama yereli test edebiliriz `?kod=` ile:
`http://localhost:3001/yemek/k.html?kod=TEST01`

Prodüksiyonda `yoursite.com/yemek/k/TEST01` şeklinde clean URL çalışacak.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat: yemek/k/:kod için Vercel rewrite"
```

---

## Task 9: End-to-end test

Bu task tamamen manuel — tüm akışı gerçek kullanım senaryolarıyla test eder.

- [ ] **Step 1: Test verilerini temizle**

Supabase SQL Editor'da:

```sql
DELETE FROM katilimcilar WHERE kod LIKE 'TEST%';
```

- [ ] **Step 2: Admin panelden 5 gerçekçi katılımcı ekle**

`http://localhost:3001/yemek/panel.html` → "Toplu Ekle" → CSV veya tek tek:
- Kağan Tiryaki — Maltepe Fen Lisesi
- Bora Demir — Galatasaray Lisesi
- Elif Şahin — Kadıköy Anadolu Lisesi
- Mert Acar — Cağaloğlu Anadolu Lisesi
- Zehra Koç — Saint Joseph

Her birinin link'ini ayrı sekmede aç (toplam 5 sekme).

- [ ] **Step 3: Scanner'ı aç ve hepsini tara**

`http://localhost:3001/yemek/tara.html` → PIN `2468` → kamera açılır.

Her link sekmesine geçip QR'ı scanner ekranına göster.

**Doğrulama:**
- [ ] 5 taramada da ✅ yeşil işaret ve "afiyet olsun"
- [ ] Geçmiş listesinde 5 satır
- [ ] Sol üstte "Bugün 5/5 aldı"

- [ ] **Step 4: Çift tarama testi**

Aynı QR'ları tekrar tara → hepsi ⛔ "zaten aldı"

- [ ] **Step 5: Geri al testi**

Geçmişte birinci taramaya "Geri al" bas → Supabase'de ilgili `gun1_ogle` null olmalı.
Panel'e geçip kontrol et → o kişinin 9 May kolonu "—" olmalı.

- [ ] **Step 6: Manuel giriş testi**

Scanner'a dönüp "Manuel giriş" → biraz önce geri aldığın kişiyi bul → "Onayla" → ✅

- [ ] **Step 7: Tanımsız QR testi**

Herhangi bir rastgele QR (başka bir siteden) ekranda göster → scanner ⚠️ "Tanımsız kod"

- [ ] **Step 8: Admin paneli etkileşim testi**

Panel → bir "—" (almadı) hücresine tıkla → onayla → manuel "aldı" işaretlenmeli
Bir "15:34" (aldı) hücresine tıkla → onayla → "—" olmalı (iptal)

Tüm adımlar geçerse sistem hazır.

- [ ] **Step 9: Son kontrol — tüm kayıtları sıfırla**

Etkinlik öncesi temiz başlangıç için:

```sql
DELETE FROM katilimcilar;
```

(Gerçek katılımcı listesini idare formdan aktaracak.)

- [ ] **Step 10: Son commit**

```bash
git add -A
git commit -m "chore(yemek): E2E test geçti, sistem hazır"
```

---

## Task 10: Deploy & domain

- [ ] **Step 1: Branch'i main'e merge (veya PR aç)**

Kullanıcının tercihine bağlı. Direkt merge:

```bash
git checkout main
git merge feature/yemekhane-qr
git push origin main
```

Veya PR:

```bash
git push -u origin feature/yemekhane-qr
gh pr create --title "feat: yemekhane QR sistemi" --body "Spec + plan docs'ta"
```

- [ ] **Step 2: Vercel otomatik deploy'u bekle**

Push → Vercel otomatik build → ~1-2 dk → canlı.

- [ ] **Step 3: Prod URL'lerini test et**

Vercel deploy URL'inden (veya custom domain varsa):
- `/yemek/` → giriş ekranı
- `/yemek/k/XXXX` (gerçek kod) → QR direkt
- `/yemek/tara.html` → scanner (kamera HTTPS gerektirir, Vercel'de sorun yok)
- `/yemek/panel.html` → admin

- [ ] **Step 4: PIN'leri production'a uygun değerlere güncelle**

Supabase SQL Editor:

```sql
UPDATE yemek_config SET value = '<gerçek-gorevli-pin>' WHERE key = 'gorevli_pin';
UPDATE yemek_config SET value = '<gerçek-admin-pin>' WHERE key = 'admin_pin';
```

PIN'leri idareye güvenli bir kanalla ilet.

---

## Faz 2 (Opsiyonel — vakit kalırsa)

### Task 11: Service Worker + offline queue

Görevli sayfasının wifi kesildiğinde bile çalışması için:
- Service Worker ile `tara.html` ve bağımlı JS/CSS cache'le
- `onQrOkundu` içinde Supabase RPC hatası → IndexedDB kuyruğa yaz
- Online olunca kuyruğu boşalt

### Task 12: Saatlik grafik

Admin panel'de son 6 saatin bar chart'ı (Chart.js CDN'den).

### Task 13: QR özelleştirme

Katılımcı QR'ında çalıştay logosu merkezde olsun (kütüphane destekliyor).

---

## Başarı Kriterleri (Spec'ten tekrar)

1. ✅ 2 gün boyunca 150+ katılımcı, 40 dk'lık öğle servisi → sıra tıkanmaz (her tarama <1sn)
2. ✅ Her katılımcı günde en fazla 1 öğle yemeği alır (DB-level zorunlu)
3. ✅ İdare 1 tıkta "kaç kişi aldı" bilgisine erişir
4. 🟡 Offline 60sn (Faz 2'de tam destek)
5. ✅ Geliştirme süresi 2-3 gün (MVP ~10 task × ~30 dk)
6. ✅ Maliyet 0 TL

---

## Test Stratejisi

**Bu projede otomatik test framework (Jest/Vitest) KURULMUYOR.**

Sebep: vanilla statik site, build yok, küçük scope (2 gün kullanım). Framework kurmanın maliyeti > değeri.

**Test yaklaşımı:**
- Her task sonunda manuel browser test (task içinde adımlı)
- Task 9: end-to-end smoke test (gerçek kullanım simülasyonu)
- Deploy sonrası staging URL'de tekrar smoke test
- Etkinlik öncesi 1 gün → 10 fake katılımcıyla tam provada çalıştır

---

## Risk ve Öngörülen Sorunlar

| Risk | Mitigation |
|---|---|
| Kamera izni reddedilirse | Manuel giriş fallback zaten var |
| iOS'ta html5-qrcode bazı cihazlarda yavaş | Test et; gerekirse `qrbox` küçült |
| Supabase bedava tier beklenmedik limit | Metrikler %1 seviyede, risk sıfıra yakın |
| Eş zamanlı iki görevli tarama yarışı | `yemek_tara` RPC atomic — DB garantisi var |
| QR ekranda parlama → okunmuyor | Katılımcı parlaklığı max, gerekirse "yenile" butonu |
| Link kaybı | Admin panelden isimle arayıp link yeniden gönderilir |
| PIN sızıntısı | 4 haneli + etkinlik sonrası tablo temizleniyor, büyük hasar yok |

---

**Plan bitti.** Uygulama sırasında karar değişiklikleri olursa `git commit`'lerde not düş, spec'e geri yansıt.
