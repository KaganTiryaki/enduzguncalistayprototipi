# Çalıştay Yemekhane QR Sistemi — Tasarım Dökümanı

**Tarih:** 2026-04-22
**Kapsam:** MFL FBÇ '26 Çalıştayı — 9-10 Mayıs 2026, 2 günlük etkinlik
**Durum:** Tasarım onayı sonrası implementasyon planına geçilecek

---

## Amaç

Çalıştay süresince yemekhanede her katılımcının sadece 1 kez öğle yemeği alabilmesini sağlayan, görevli tarafından kontrol edilen QR tabanlı bir dijital sistem. Çift yemek almanın önüne geçmek + idarenin "kim aldı / kim almadı" bilgisine anlık erişebilmesi.

## Kapsam

### Dahil
- 2 gün (9 Mayıs + 10 Mayıs 2026), her gün 1 öğle servisi
- ~150-200 katılımcı (kesin sayı kayıt formundan gelecek)
- Katılımcıların telefonlarında QR gösterimi
- Görevlinin kendi telefonundan sürekli-kamera tarama
- Yönetici panelinde liste yönetimi + anlık rapor

### Dışı (bu spec'e girmiyor)
- Yaka kartına basılı QR (telefon fallback'i yok — saf "B" modu)
- Konuşmacı/personel yemek takibi (sadece katılımcılar)
- Kahvaltı / akşam yemeği / ikramlar (sadece öğle)
- Bildirim/SMS gönderimi
- Raporların PDF/Excel export'u (faz 2)
- Uzun vadeli arşivleme (etkinlik sonrası veri silinebilir)

---

## Kullanıcı Akışları

### A. Katılımcı Akışı (öğrenci)

**Etkinlik öncesi (~1 hafta önce):**
1. İdare formdan gelen katılımcı listesini admin paneline yükler
2. Sistem her katılımcıya 6-haneli rastgele bir kod üretir: `aB3xK9`
3. Her katılımcıya özel link WhatsApp/email ile gönderilir:
   `https://calistay.site/yemek/k/aB3xK9`

**Etkinlik günü:**
1. Katılımcı linki açar → telefonunda QR kod görür
2. Ekranda ayrıca: adı, okulu, hangi günler yemek hakkı olduğu bilgisi
3. Sayfa `localStorage`'a kodu kaydeder → 2. gün tekrar link açmaya gerek yok, `calistay.site/yemek` açınca otomatik QR gelir
4. Yemekhane sırasında telefonunu görevliye uzatır

**QR ekranı özellikleri:**
- Tam ekran, yüksek kontrast (güneşte okunabilir)
- Otomatik ekran parlaklığı maksimum (API izin veriyorsa)
- "Bugün aldın" / "Bugün henüz almadın" durum rozeti
- Yenileme butonu (kamera okumazsa tekrar üret)

### B. Görevli Akışı

1. Görevli etkinlik başında telefonundan `calistay.site/yemek/tara` açar
2. 4 haneli PIN ile girer (idareden önceden alınır)
3. Kamera sürekli açık kalır, QR görünce otomatik okur

**Tarama sonuçları:**

| Durum | Görsel | Ses | Anlam |
|---|---|---|---|
| ✅ **İlk tarama, hak var** | Büyük yeşil tik + isim + okul | "Bip" (kısa, yüksek) | "Geçebilir, afiyet olsun" |
| ⛔ **Bugün zaten aldı** | Büyük kırmızı X + isim + saat | "Bzzzt" (düşük, uzun) | "Geçirme, zaten almış" |
| ⚠️ **Tanımsız kod** | Sarı uyarı | Hafif tık | "Bu kod sistemde yok — kontrol et" |

- Her tarama sonrası 1 saniye bekle → kamera otomatik yeniden aktif
- "Manuel giriş" butonu: telefon unutanlar için → isim/okul ile ara, onayla → sisteme işler
- Son 20 tarama alt listede görünür (yanlışlık varsa "geri al" ile iptal)

### C. Admin Akışı (idare)

`calistay.site/yemek/panel` → şifre ile girer.

**Özellikler:**
1. **Katılımcı listesi yükle:** Excel/CSV (kolon: ad_soyad, okul). Sistem otomatik kod üretir + link listesi çıktısı verir (WhatsApp'a yapıştırılabilir format)
2. **Bugünün tablosu:** tüm katılımcılar, kimin aldığı ✅ / almadığı ❌
3. **Arama:** ad/soyad/okul
4. **Anlık sayaç:** "122 / 180 aldı"
5. **Saatlik dağılım:** son 6 saatin mini grafiği
6. **Manuel işlem:** bir katılımcıya manuel "aldı" / "almadı" işaretle (hata düzeltme)
7. **Katılımcı ekle/sil** (liste yüklendikten sonra eklemeler için)

---

## Veri Modeli

**Tek tablo: `katilimcilar`**

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | uuid | Primary key |
| `kod` | text unique | Random 6-char (QR içeriği, link parametresi) |
| `ad_soyad` | text | Ad Soyad |
| `okul` | text | Katılımcının okulu |
| `gun1_ogle` | timestamptz null | 9 Mayıs öğle — aldıysa zaman, yoksa null |
| `gun2_ogle` | timestamptz null | 10 Mayıs öğle — aldıysa zaman, yoksa null |
| `olusturulma` | timestamptz | Kayıt tarihi |

**Tarama mantığı:**
- Gün 1 ise → `gun1_ogle` null mı? Evet → onayla + zaman yaz. Hayır → reddet.
- Gün 2 ise → `gun2_ogle` null mı? Evet → onayla + zaman yaz. Hayır → reddet.
- Günün hangisi olduğu server-side `CURRENT_DATE` ile belirlenir (9 Mayıs = gün1, 10 Mayıs = gün2)

**Neden günlük reset yok:**
Sadece 2 gün var, her gün ayrı kolon. Boolean flag + günlük reset yerine, her öğün ayrı field. Basit, hatasız, debug dostu.

---

## Teknik Altyapı

### Stack

| Katman | Seçim | Gerekçe |
|---|---|---|
| Frontend | Vanilla HTML/CSS/JS | Mevcut çalıştay sitesiyle tutarlı |
| QR oluşturma | `qrcode.js` (CDN) | Build yok, hafif |
| QR okuma | `html5-qrcode` (CDN) | Kamera entegrasyonu, iOS/Android uyum |
| Backend | Supabase (bedava tier) | Tek tablo + REST/Realtime hazır |
| Hosting | Vercel (bedava tier) | Mevcut çalıştay sitesiyle aynı proje |
| Auth (görevli/admin) | Env variable + client-side PIN gate | Aşırı basit kullanım için yeterli |

### Entegrasyon (mevcut çalıştay sitesi)

Mevcut [repo'nun](../../..) altında `/yemek/` dizini:

```
mfl-calistay-repo/
├── index.html              (mevcut çalıştay sitesi)
├── css/style.css
├── js/...
└── yemek/                  ← YENİ
    ├── index.html          (katılımcı: kod varsa QR, yoksa redirect ana site)
    ├── k/                  (rewrite → k.html?kod=X)
    │   └── [kod].html      (her kod için aynı sayfa, URL'den alır)
    ├── tara.html           (görevli: scanner)
    ├── panel.html          (admin: dashboard)
    ├── yemek.css           (ayrı CSS — navy palette import)
    └── js/
        ├── katilimci.js    (kod yükle, QR oluştur)
        ├── tara.js         (scanner + Supabase update)
        └── panel.js        (admin CRUD + istatistik)
```

- Vercel aynı proje, ek yapılandırma gereksiz (subpath otomatik)
- Supabase client browser'dan direkt konuşur (anon key + Row Level Security kuralları ile sınırlı erişim)
- Çalıştay sitesinin navy palette değişkenleri (`--navy-*`, `--accent*`) import edilir, font aynı (Inter + Playfair)

### Supabase Row Level Security (RLS) politikası

Açık browser'dan Supabase anon key ile erişiliyor → RLS ile kısıtlanır:

```sql
-- Katılımcı: kendi kaydını sadece kod ile SELECT edebilir
CREATE POLICY "katilimci_self_read" ON katilimcilar
  FOR SELECT USING (kod = current_setting('request.jwt.claim.kod', true));

-- Görevli/admin: PIN doğrulanmış session (Supabase JWT custom claim)
CREATE POLICY "gorevli_all" ON katilimcilar
  FOR ALL USING (auth.jwt() ->> 'role' IN ('gorevli', 'admin'));
```

(Detay: implementasyon planında — burada yaklaşım yeter.)

---

## Offline Davranış

### Katılımcı sayfası
- İlk yüklemede kod + isim + QR `localStorage`'a yazılır
- 2. açılışta internet yoksa cache'den gösterilir ("offline modu" rozeti)
- Durum rozeti ("aldın / almadın") network bağlıysa tazelenir, yoksa son bilinen hali

### Görevli sayfası
- Service Worker ile çekirdek dosyalar cache'e alınır → kamera sayfası internet kopsa da açılır
- Tarama sonuçları internet yoksa `IndexedDB` kuyruğuna yazılır, bağlantı gelince otomatik senkron
- Kısa kesintilerde (wifi switch gibi) katılımcı zar zor çift tarama fırsatı bulur → risk kabul edilebilir
- 30 saniyeden uzun kesinti → UI uyarısı: "Offline modu. Taramaları kaydediyorum, gelince gönderilecek."

### Admin sayfası
- Offline çalışmaz (sadece canlı veri önemli). Uyarı gösterilir.

---

## Güvenlik ve Gizlilik

- **KVKK:** Yemekhane DB'sinde sadece ad/soyad + okul + rastgele kod. TC yok, telefon yok, email yok. Kayıt formunda zaten toplanan veriler bu sistemde yok.
- **Aydınlatma metni:** Yemekhane sistemi için ayrı kısa metin hazırlanmalı, link gönderimi sırasında paylaşılacak. (İdarenin yapacağı iş, teknik değil)
- **QR paylaşımı:** Biri başka birinin QR'ını göstermeye çalışsa bile → sadece o hedefin öğlen yemeği "alınmış" sayılır. Saldırı vektörü zayıf (görevli yüze bakıyor, isim ekranda görünüyor).
- **PIN'ler:** Görevli ve admin PIN'leri etkinlikten 1-2 gün önce oluşturulup ilgili kişilere verilecek. Etkinlik sonrası iptal/yenileme.
- **Veri silme:** Etkinlik bitiminden 30 gün sonra tüm tablo temizlenir (manual veya cron).

---

## Edge Case'ler

| Durum | Davranış |
|---|---|
| Katılımcı telefonunu unuttu | Görevli "Manuel giriş" → isim/okul ile arar, manuel onay verir |
| QR kod ekranda okunmuyor (çatlak ekran, parlama) | Yenile butonu → kod regenerate; yine olmuyorsa manuel giriş |
| Son dakika kayıt olan katılımcı | Admin panelinden tek kişi eklenir, hemen link gider |
| Yanlış tarama (görevli yanlış kişiyi onayladı) | Son 20 tarama listesinden "geri al" butonu |
| İki görevli aynı anda tarıyor | Her tarama bağımsız Supabase update — race condition yok (transaction level DB garantisi) |
| Katılımcı link'i kaybetti | Admin panelden ada göre arayıp link'i yeniden paylaşır |
| 2. gün aynı link çalışır mı? | Evet, aynı kod kalıcı, `gun2_ogle` kolonuyla gün kontrolü yapılır |

---

## Açık Sorular / Kararlar

- [ ] **Site alan adı:** Çalıştay sitesi hangi domain'de yayında olacak? (`fbc.maltepefen.meb.k12.tr`? `calistay.mfl.edu.tr`?) — link şablonu buna göre son hali alır.
- [ ] **Liste kolonları:** Form'dan gelen Excel'de kolon adları ne? (ad_soyad tek sütun mu, ayrı mı — implementasyon planında netleşecek)
- [ ] **PIN teslimatı:** Görevli ve admin PIN'leri kim alacak, nasıl aktarılacak? (Operasyonel, tasarım dışı)
- [ ] **Aydınlatma metni:** İdarenin hazırlayacağı, teknik ekip değil.

---

## Başarı Kriterleri

1. 2 gün boyunca 150+ katılımcı, her gün ~40 dk öğle servisi → sistem sıra oluşturmadan dayanır
2. Her katılımcı günde en fazla 1 öğle yemeği alır (çift tarama sistem tarafından reddedilir)
3. İdare her an "şu ana kadar kaç kişi aldı" sorusuna 1 tıkta cevap alır
4. Offline 60 saniyeye kadar kesintide sistem görevli tarafında kullanılabilir kalır
5. Toplam geliştirme süresi: 2-3 gün (tahmin, plan oluşturulurken netleşecek)
6. Toplam maliyet: 0 TL (Supabase + Vercel bedava tier)

---

## Sonraki Adım

Spec onayı → `writing-plans` ile implementasyon planı: dosya dosya, iş sırası, test stratejisi.
