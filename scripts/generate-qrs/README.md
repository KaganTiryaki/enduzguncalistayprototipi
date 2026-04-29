# QR PNG Üretici — MFL FBÇ '26

Bu script **yerel** çalıştırılır, deploy edilmez. 400 kart için 800 QR PNG üretip Supabase `cards` tablosunu doldurur.

## Kurulum

```bash
cd scripts/generate-qrs
npm install
cp .env.example .env
# .env'i aç:
#   - SUPABASE_URL
#   - SUPABASE_SERVICE_ROLE_KEY  (Supabase Dashboard → API → service_role)
#   - BASE_URL                   (basımdan önce KESİNLEŞMİŞ domain)
```

## Çalıştırma

### İlk üretim (cards tablosu boş olmalı)
```bash
node generate.mjs
```

Çıktı:
- `output/png/card-001-kahvalti.png` ... `output/png/card-400-ogle.png`
- `output/cards.csv` (press ekibine git)
- `output/contact-sheet.html` (basım öncesi göz kontrolü)

### Sıfırdan yeniden üretim (DİKKAT — tüm redemption'lar silinir)
```bash
node generate.mjs --reset
```

### Tek kart yeniden basım (kayıp kart senaryosu)
```bash
node generate.mjs --single 042
```

Mevcut `042` kartı `revoked_at` ile iptal edilir, yeni `042-A` (sonra `042-B`...) üretilir, sadece o iki PNG yenilenir. Press ekibi sadece yeni kartı basar.

## Üretim sonrası

1. `output/contact-sheet.html`'i tarayıcıda aç, rastgele 5-10 QR'ı telefon kamerasıyla tara — `?c=<uuid>&m=br|lu` doğru olmalı.
2. `output/png/` ve `output/cards.csv`'yi ZIP'leyip press ekibine gönder.
3. **`output/` klasörünü commit ETME** (.gitignore'da).

## Güvenlik

- `SUPABASE_SERVICE_ROLE_KEY` admin yetkisi verir. `.env` dosyası `.gitignore`'da. Asla repo'ya/Slack'e/Drive'a yapıştırma.
- Anahtar sızdıysa: Supabase Dashboard → API → service_role → "Reset" tuşuna bas.
