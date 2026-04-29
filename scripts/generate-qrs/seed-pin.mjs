// One-shot: staff_codes tablosunu sıfırlayıp tek paylaşılan PIN ekler.
// Çalıştırma: node seed-pin.mjs   (.env'deki SUPABASE_SERVICE_ROLE_KEY kullanılır)

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

const supabase = createClient(url, key, { auth: { persistSession: false } });

const PIN = '0910';

const { error: delErr } = await supabase
    .from('staff_codes')
    .delete()
    .neq('code', '__never_matches__');
if (delErr) { console.error('delete failed:', delErr); process.exit(1); }

const { error: insErr } = await supabase
    .from('staff_codes')
    .insert([{ code: PIN, label: 'Görevli', active: true }]);
if (insErr) { console.error('insert failed:', insErr); process.exit(1); }

const { data, error: selErr } = await supabase.from('staff_codes').select('*');
if (selErr) { console.error('select failed:', selErr); process.exit(1); }

console.log('staff_codes:', data);
console.log(`PIN '${PIN}' kuruldu.`);
