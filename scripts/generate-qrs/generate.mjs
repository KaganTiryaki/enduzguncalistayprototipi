// MFL FBÇ '26 — QR PNG üretici
// Kullanım:
//   node generate.mjs                  ilk üretim (cards tablosu boş olmalı)
//   node generate.mjs --reset          mevcut cards/redemptions silinir, baştan üretilir (DİKKAT)
//   node generate.mjs --single 042     tek kart üret (kayıp kart sonrası yeniden basım)
//
// Çıktı:
//   output/png/card-NNN-kahvalti.png
//   output/png/card-NNN-ogle.png
//   output/cards.csv
//   output/contact-sheet.html

import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------- env yükle ----------
loadEnvFile(resolve(__dirname, '.env'));

const SUPABASE_URL              = required('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = required('SUPABASE_SERVICE_ROLE_KEY');
const BASE_URL                  = required('BASE_URL').replace(/\/+$/, '');
const CARD_COUNT                = parseInt(process.env.CARD_COUNT || '400', 10);

if (BASE_URL.includes('CHANGE-ME')) {
    fail('BASE_URL .env icinde gercek bir domain ile degistirilmedi. Basimdan once kesinlesmis olmali.');
}

// ---------- argümanları parse et ----------
const args = process.argv.slice(2);
const RESET   = args.includes('--reset');
const SINGLE  = args.includes('--single');
const REPAINT = args.includes('--repaint');
const singleIdx = args.indexOf('--single');
const singleShortCode = SINGLE ? args[singleIdx + 1] : null;

if (SINGLE && !singleShortCode) {
    fail('--single bayrağı bir short_code argümanı bekler. Örnek: node generate.mjs --single 042');
}

// ---------- supabase client ----------
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ---------- ana akış ----------
const outDir    = resolve(__dirname, 'output');
const pngDir    = resolve(outDir, 'png');
mkdirSync(pngDir, { recursive: true });

if (SINGLE) {
    await generateSingle(singleShortCode);
} else if (REPAINT) {
    await repaintAll();
} else {
    await generateAll();
}

console.log('\n✅ Tamamlandı.');

// ============================================================
// fonksiyonlar
// ============================================================

async function generateAll() {
    // 1) önceden veri var mı?
    const { count, error: countErr } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true });
    if (countErr) fail(`cards count alınamadı: ${countErr.message}`);

    if (count > 0 && !RESET) {
        fail(`cards tablosu boş değil (${count} satır). Tüm kartları yeniden üretmek için --reset bayrağını ver. DİKKAT: redemption'lar da silinir.`);
    }

    if (RESET && count > 0) {
        console.log(`⚠ --reset: mevcut ${count} kart ve tüm redemption'lar siliniyor...`);
        const { error: e1 } = await supabase.from('redemptions').delete().neq('id', 0);
        if (e1) fail(`redemptions silinemedi: ${e1.message}`);
        const { error: e2 } = await supabase.from('cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (e2) fail(`cards silinemedi: ${e2.message}`);
    }

    // 2) 400 kayıt üret
    const records = Array.from({ length: CARD_COUNT }, (_, i) => ({
        id: uuidv4(),
        short_code: String(i + 1).padStart(3, '0')
    }));

    console.log(`📝 ${CARD_COUNT} kart Supabase'e yazılıyor...`);
    const { error: insertErr } = await supabase.from('cards').insert(records);
    if (insertErr) fail(`cards insert başarısız: ${insertErr.message}`);

    // 3) PNG'leri render et + CSV satırları
    const csvRows = [['short_code', 'card_id', 'kahvalti_png', 'ogle_png', 'kahvalti_url', 'ogle_url']];
    for (let i = 0; i < records.length; i++) {
        const card = records[i];
        const { kahvaltiPng, oglePng, kahvaltiUrl, ogleUrl } = await renderCard(card);
        csvRows.push([card.short_code, card.id, kahvaltiPng, oglePng, kahvaltiUrl, ogleUrl]);
        if ((i + 1) % 50 === 0) console.log(`   ${i + 1}/${records.length} kart hazır`);
    }

    // 4) CSV ve contact sheet
    writeCsv(resolve(outDir, 'cards.csv'), csvRows);
    writeContactSheet(records);

    console.log(`\n📦 Çıktı: ${outDir}`);
    console.log(`   ${CARD_COUNT * 2} PNG, cards.csv, contact-sheet.html`);
}

// Cards tablosundaki mevcut UUID'leri koruyarak SADECE PNG'leri yeni BASE_URL ile yeniden render eder.
// Domain değişikliği gibi durumlarda kullanılır — Supabase'deki kayıtlar bozulmadan QR'lar yenilenir.
async function repaintAll() {
    console.log(`🎨 Repaint modu: cards tablosu okunuyor, PNG'ler yeniden uretilecek (BASE_URL=${BASE_URL})`);

    const { data: rows, error } = await supabase
        .from('cards')
        .select('id, short_code, revoked_at')
        .order('short_code');
    if (error) fail(`cards okuma hatasi: ${error.message}`);
    if (!rows || rows.length === 0) fail('cards tablosu bos. Once "node generate.mjs" ile ilk uretim yap.');

    const active = rows.filter(r => !r.revoked_at);
    const skipped = rows.length - active.length;
    console.log(`   ${rows.length} kart bulundu (${active.length} aktif, ${skipped} iptal)`);

    const csvRows = [['short_code', 'card_id', 'kahvalti_png', 'ogle_png', 'kahvalti_url', 'ogle_url']];
    for (let i = 0; i < active.length; i++) {
        const card = active[i];
        const { kahvaltiPng, oglePng, kahvaltiUrl, ogleUrl } = await renderCard(card);
        csvRows.push([card.short_code, card.id, kahvaltiPng, oglePng, kahvaltiUrl, ogleUrl]);
        if ((i + 1) % 50 === 0) console.log(`   ${i + 1}/${active.length} kart hazir`);
    }

    writeCsv(resolve(outDir, 'cards.csv'), csvRows);
    writeContactSheet(active);

    console.log(`\n📦 Cikti: ${outDir}`);
    console.log(`   ${active.length * 2} PNG yeniden basildi`);
}

async function generateSingle(shortCode) {
    const code = shortCode.padStart(3, '0');
    console.log(`🎯 Tek kart üretimi: ${code}`);

    // var mı?
    const { data: existing, error: lookupErr } = await supabase
        .from('cards')
        .select('id, short_code, revoked_at')
        .eq('short_code', code)
        .maybeSingle();
    if (lookupErr) fail(`cards lookup hatası: ${lookupErr.message}`);

    let card;
    if (existing) {
        // mevcut kartı revoke et + yeni kayıt oluştur
        if (!existing.revoked_at) {
            const { error: revErr } = await supabase
                .from('cards')
                .update({ revoked_at: new Date().toISOString() })
                .eq('id', existing.id);
            if (revErr) fail(`mevcut kart revoke edilemedi: ${revErr.message}`);
            console.log(`   eski kart (${existing.id}) revoked_at set edildi`);
        }
        // Yeni short_code: aynı sayı + harf suffixi (042-A, sonra 042-B...)
        const replacementCode = await nextReplacementCode(code);
        const { data: inserted, error: insErr } = await supabase
            .from('cards')
            .insert({ id: uuidv4(), short_code: replacementCode })
            .select()
            .single();
        if (insErr) fail(`yeni kart insert hatası: ${insErr.message}`);
        card = inserted;
        console.log(`   yeni kart üretildi: ${replacementCode}`);
    } else {
        // hiç yok, ilk kez basılıyor
        const { data: inserted, error: insErr } = await supabase
            .from('cards')
            .insert({ id: uuidv4(), short_code: code })
            .select()
            .single();
        if (insErr) fail(`kart insert hatası: ${insErr.message}`);
        card = inserted;
    }

    const { kahvaltiPng, oglePng } = await renderCard(card);
    console.log(`\n✅ Tek PNG'ler:\n   ${kahvaltiPng}\n   ${oglePng}`);
}

async function nextReplacementCode(baseCode) {
    // 042 → 042-A, 042-A → 042-B ...
    const { data, error } = await supabase
        .from('cards')
        .select('short_code')
        .like('short_code', `${baseCode}-%`);
    if (error) fail(`replacement lookup hatası: ${error.message}`);
    const used = (data || []).map(r => r.short_code);
    for (let c = 'A'.charCodeAt(0); c <= 'Z'.charCodeAt(0); c++) {
        const candidate = `${baseCode}-${String.fromCharCode(c)}`;
        if (!used.includes(candidate)) return candidate;
    }
    fail(`${baseCode} için 26 yedek üretildi, daha fazlası destekenmiyor.`);
}

async function renderCard(card) {
    const kahvaltiUrl = `${BASE_URL}/tara?c=${card.id}&m=br`;
    const ogleUrl     = `${BASE_URL}/tara?c=${card.id}&m=lu`;
    const kahvaltiPng = `card-${card.short_code}-kahvalti.png`;
    const oglePng     = `card-${card.short_code}-ogle.png`;

    const opts = {
        errorCorrectionLevel: 'M',
        width: 600,
        margin: 2,
        color: { dark: '#2C56A5', light: '#FFFFFF' } // navy-dark + beyaz, basımda kontrastı yüksek
    };

    await QRCode.toFile(resolve(pngDir, kahvaltiPng), kahvaltiUrl, opts);
    await QRCode.toFile(resolve(pngDir, oglePng), ogleUrl, opts);

    return { kahvaltiPng, oglePng, kahvaltiUrl, ogleUrl };
}

function writeCsv(path, rows) {
    const csv = rows.map(r => r.map(escapeCsv).join(',')).join('\n');
    writeFileSync(path, '﻿' + csv, 'utf-8'); // BOM → Excel UTF-8 doğru açar
    console.log(`   ${path}`);
}

function escapeCsv(v) {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function writeContactSheet(cards) {
    // press ekibi basım öncesi göz kontrolü için 4 kolonlu thumbnail HTML
    const items = cards.map(c => `
        <div class="card">
            <div class="grid">
                <figure>
                    <img src="png/card-${c.short_code}-kahvalti.png" alt="${c.short_code} kahvaltı">
                    <figcaption>${c.short_code} · KAHVALTI</figcaption>
                </figure>
                <figure>
                    <img src="png/card-${c.short_code}-ogle.png" alt="${c.short_code} öğle">
                    <figcaption>${c.short_code} · ÖĞLE</figcaption>
                </figure>
            </div>
        </div>`).join('');

    const html = `<!doctype html>
<html lang="tr"><head>
<meta charset="utf-8">
<title>MFL FBÇ '26 — QR Contact Sheet</title>
<style>
    body { font-family: system-ui, sans-serif; padding: 24px; background: #f3f7fc; color: #2c56a5; }
    h1 { margin: 0 0 8px; }
    p { margin: 0 0 24px; color: #7b93b8; }
    .sheet { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .card { background: white; border-radius: 12px; padding: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    figure { margin: 0; text-align: center; }
    img { width: 100%; height: auto; display: block; }
    figcaption { font-size: 11px; margin-top: 4px; }
</style></head><body>
<h1>MFL FBÇ '26 — Yaka Kartı QR Kontrol Sayfası</h1>
<p>${cards.length} kart × 2 öğün = ${cards.length * 2} QR. Basım öncesi rastgele örneklerin telefonla taranıp doğru URL'i gösterdiği teyit edilmeli.</p>
<div class="sheet">${items}</div>
</body></html>`;

    writeFileSync(resolve(outDir, 'contact-sheet.html'), html, 'utf-8');
    console.log(`   ${resolve(outDir, 'contact-sheet.html')}`);
}

function loadEnvFile(path) {
    if (!existsSync(path)) {
        fail(`.env bulunamadı: ${path}\n.env.example'i kopyalayıp düzenle.`);
    }
    const content = readFileSync(path, 'utf-8');
    for (const line of content.split('\n')) {
        const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        if (process.env[m[1]] === undefined) {
            process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
    }
}

function required(name) {
    const v = process.env[name];
    if (!v) fail(`Zorunlu env: ${name}. .env dosyana ekle.`);
    return v;
}

function fail(msg) {
    console.error(`\n❌ ${msg}\n`);
    process.exit(1);
}
