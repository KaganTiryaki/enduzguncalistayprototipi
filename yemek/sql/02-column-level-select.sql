-- ============================================================
-- COLUMN-LEVEL SELECT FIX
-- ============================================================
-- Önceki migration RLS SELECT policy'sini kaldırdı.
-- Admin panelinin INSERT+RETURNING yapabilmesi için gerekli.
-- Column-level GRANT ile pin_hash/reset_token/reset_expires gizli kalır.
-- ============================================================

-- Table-level SELECT'i kaldır
REVOKE SELECT ON katilimcilar FROM anon;
REVOKE SELECT ON katilimcilar FROM authenticated;

-- Sadece güvenli kolonlara SELECT ver
GRANT SELECT (id, kod, ad_soyad, email, gun1_ogle, gun2_ogle, olusturulma) ON katilimcilar TO anon;
GRANT SELECT (id, kod, ad_soyad, email, gun1_ogle, gun2_ogle, olusturulma) ON katilimcilar TO authenticated;

-- RLS: tüm satırlar okunabilir (kolon filtreleme GRANT üzerinden)
DROP POLICY IF EXISTS "anon_select" ON katilimcilar;
DROP POLICY IF EXISTS "anon_select_safe" ON katilimcilar;
CREATE POLICY "anon_select" ON katilimcilar FOR SELECT TO anon USING (true);
