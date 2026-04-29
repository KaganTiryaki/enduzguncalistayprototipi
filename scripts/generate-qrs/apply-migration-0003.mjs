// One-shot: 0003 migration'ını service_role ile uygular ve test verisi seed eder.
// Çalıştırma: node apply-migration-0003.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env');
if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
        const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
        if (m && process.env[m[1]] === undefined) {
            process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
    }
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
    console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY .env dosyasında olmalı.');
    process.exit(1);
}

// SQL dosyasını okuyup PostgREST exec_sql RPC'si yerine raw SQL çalıştırma
// için ayrı bir endpoint kullanmamız lazım. Supabase bunu PostgREST üzerinden
// vermez — manual approach: her statement'i ayrı ayrı `.rpc()` veya
// REST endpoint'leri ile yapamayız çünkü DDL var.
// Çözüm: kullanıcı bunu Supabase SQL editor'unda manuel çalıştıracak.
// Bu script sadece doğrulama yapar.

const supabase = createClient(url, key, { auth: { persistSession: false } });

console.log('Migration durumu kontrol ediliyor (cards.name kolonu var mı?)...');
const { data: probe, error: probeErr } = await supabase
    .from('cards')
    .select('name, committee')
    .limit(1);

if (probeErr) {
    console.error('cards.name kolonu yok. Önce 0003_person_and_cooldown.sql\'i Supabase SQL editor\'unda çalıştır:');
    console.error('  https://supabase.com/dashboard/project/sfoimuxbvxbwywujoeoa/sql');
    console.error('Hata:', probeErr.message);
    process.exit(2);
}

console.log('OK: 0003 migration uygulanmış.');

// Test verisi seed: card-001'i Ada Vardar'a ata
const TEST = { short_code: '001', name: 'Ada Vardar', email: 'adavrdr43@gmail.com', committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' };

const { error: updErr } = await supabase
    .from('cards')
    .update({ name: TEST.name, email: TEST.email, committee: TEST.committee })
    .eq('short_code', TEST.short_code);
if (updErr) { console.error('seed update:', updErr); process.exit(1); }

const { data: row } = await supabase
    .from('cards')
    .select('short_code, name, email, committee')
    .eq('short_code', TEST.short_code)
    .single();
console.log('Test kartı seed edildi:', row);

// 2h cooldown test: önceki redemption test artıklarını temizle
await supabase.from('redemptions').delete().eq('staff_code', '__PROTO_TEST__');

console.log('\nProto kontrol bitti. Şimdi /tara üstünden test edebilirsin:');
console.log('  PIN: 0910');
console.log('  Kart: card-001-kahvalti.png (mevcut PNG, m=br ignore ediliyor)');
console.log('  Beklenen: yeşil "GEÇİŞ — Ada Vardar"');
console.log('  Tekrar tara: sarı "ZATEN KULLANILDI — 1sa 59dk sonra"');
console.log('  NOT: Bugün 29 Nisan, normalde out_of_window döner. Test için RPC\'deki');
console.log('       tarih kontrolünü geçici olarak gevşetebiliriz — istersen söyle.');
