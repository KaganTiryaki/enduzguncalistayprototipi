-- ============================================================
-- PIN AUTH MIGRATION
-- ============================================================
-- Bu script katilimcilar tablosuna PIN/email kolonları ekler,
-- güvenli RPC fonksiyonları kurar ve RLS'i sıkılaştırır.
-- ============================================================

-- pgcrypto için (PIN hash'leme, token üretimi)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1) Yeni kolonlar
-- ============================================================
ALTER TABLE katilimcilar
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS pin_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reset_token TEXT,
  ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS katilimcilar_email_idx ON katilimcilar (email);
CREATE INDEX IF NOT EXISTS katilimcilar_reset_token_idx ON katilimcilar (reset_token);

-- ============================================================
-- 2) RLS sertleştirme: anon artık tabloyu direkt okuyamaz
-- ============================================================
-- Eski policy'leri temizle
DROP POLICY IF EXISTS "anon_select" ON katilimcilar;
DROP POLICY IF EXISTS "anon_update" ON katilimcilar;
DROP POLICY IF EXISTS "anon_insert" ON katilimcilar;
DROP POLICY IF EXISTS "anon_delete" ON katilimcilar;

-- Sadece INSERT/UPDATE/DELETE anon için açık kalsın (admin panel gerekli)
CREATE POLICY "anon_insert" ON katilimcilar FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update" ON katilimcilar FOR UPDATE TO anon USING (true);
CREATE POLICY "anon_delete" ON katilimcilar FOR DELETE TO anon USING (true);
-- NOT: SELECT policy yok → anon okuyamaz, sadece view üzerinden

-- ============================================================
-- 3) Güvenli view: hassas kolonlar gizli
-- ============================================================
DROP VIEW IF EXISTS katilimci_goster;
CREATE VIEW katilimci_goster AS
SELECT
  kod,
  ad_soyad,
  gun1_ogle,
  gun2_ogle,
  (pin_hash IS NOT NULL) AS pin_var
FROM katilimcilar;

GRANT SELECT ON katilimci_goster TO anon;

-- Admin panel için: ad/kod/gün/email görebilecek bir liste view (pin_hash vs. yine gizli)
DROP VIEW IF EXISTS katilimci_admin;
CREATE VIEW katilimci_admin AS
SELECT
  id,
  kod,
  ad_soyad,
  email,
  gun1_ogle,
  gun2_ogle,
  (pin_hash IS NOT NULL) AS pin_var,
  olusturulma
FROM katilimcilar;

GRANT SELECT ON katilimci_admin TO anon;

-- ============================================================
-- 4) RPC: PIN oluştur (ilk kez)
-- ============================================================
CREATE OR REPLACE FUNCTION pin_olustur(p_kod TEXT, p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_kayit RECORD;
BEGIN
  IF p_pin IS NULL OR length(p_pin) < 4 OR length(p_pin) > 8 THEN
    RETURN jsonb_build_object('durum', 'pin_gecersiz', 'mesaj', 'PIN 4-8 karakter olmalı');
  END IF;

  SELECT id, pin_hash, ad_soyad INTO v_kayit
  FROM katilimcilar WHERE kod = upper(p_kod);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('durum', 'kod_yok');
  END IF;

  IF v_kayit.pin_hash IS NOT NULL THEN
    RETURN jsonb_build_object('durum', 'pin_zaten_var');
  END IF;

  UPDATE katilimcilar
  SET pin_hash = crypt(p_pin, gen_salt('bf', 8)),
      pin_created_at = NOW()
  WHERE id = v_kayit.id;

  RETURN jsonb_build_object('durum', 'ok', 'ad_soyad', v_kayit.ad_soyad);
END;
$$;

GRANT EXECUTE ON FUNCTION pin_olustur TO anon;

-- ============================================================
-- 5) RPC: PIN doğrula (giriş)
-- ============================================================
CREATE OR REPLACE FUNCTION pin_dogrula(p_kod TEXT, p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_kayit RECORD;
BEGIN
  SELECT kod, ad_soyad, gun1_ogle, gun2_ogle, pin_hash INTO v_kayit
  FROM katilimcilar WHERE kod = upper(p_kod);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('durum', 'kod_yok');
  END IF;

  IF v_kayit.pin_hash IS NULL THEN
    RETURN jsonb_build_object('durum', 'pin_yok');
  END IF;

  IF crypt(p_pin, v_kayit.pin_hash) <> v_kayit.pin_hash THEN
    RETURN jsonb_build_object('durum', 'yanlis');
  END IF;

  RETURN jsonb_build_object(
    'durum', 'ok',
    'katilimci', jsonb_build_object(
      'kod', v_kayit.kod,
      'ad_soyad', v_kayit.ad_soyad,
      'gun1_ogle', v_kayit.gun1_ogle,
      'gun2_ogle', v_kayit.gun2_ogle
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION pin_dogrula TO anon;

-- ============================================================
-- 6) RPC: Reset uygula (yeni PIN belirleme)
-- ============================================================
CREATE OR REPLACE FUNCTION reset_uygula(p_token TEXT, p_yeni_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_kayit RECORD;
BEGIN
  IF p_yeni_pin IS NULL OR length(p_yeni_pin) < 4 OR length(p_yeni_pin) > 8 THEN
    RETURN jsonb_build_object('durum', 'pin_gecersiz', 'mesaj', 'PIN 4-8 karakter olmalı');
  END IF;

  SELECT id, reset_expires INTO v_kayit
  FROM katilimcilar WHERE reset_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('durum', 'token_gecersiz');
  END IF;

  IF v_kayit.reset_expires IS NULL OR v_kayit.reset_expires < NOW() THEN
    RETURN jsonb_build_object('durum', 'token_suresi_doldu');
  END IF;

  UPDATE katilimcilar
  SET pin_hash = crypt(p_yeni_pin, gen_salt('bf', 8)),
      pin_created_at = NOW(),
      reset_token = NULL,
      reset_expires = NULL
  WHERE id = v_kayit.id;

  RETURN jsonb_build_object('durum', 'ok');
END;
$$;

GRANT EXECUTE ON FUNCTION reset_uygula TO anon;
