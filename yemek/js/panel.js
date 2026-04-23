// yemek/js/panel.js
// Admin panel kontrolörü.

import { supabase } from './supabase-client.js';
import { randomKod, saatFormatla } from './util.js';

const BASE_URL = window.location.hostname.startsWith('yemek.')
  ? window.location.origin + '/k/'
  : window.location.origin + '/yemek/k/';

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
  tabMail:   document.getElementById('p-tab-mail'),
  arama:     document.getElementById('p-arama'),
  yenile:    document.getElementById('p-yenile'),
  listeGovde: document.getElementById('p-liste-govde'),
  csvFile:     document.getElementById('p-csv-file'),
  csvOnizleme: document.getElementById('p-csv-onizleme'),
  csvYukle:    document.getElementById('p-csv-yukle'),
  tekForm:     document.getElementById('p-tek-form'),
  tekAd:       document.getElementById('p-tek-ad'),
  tekEmail:    document.getElementById('p-tek-email'),
  linkler:     document.getElementById('p-linkler'),
  linkMetin:   document.getElementById('p-link-metin'),
  linkKopyala: document.getElementById('p-link-kopyala'),
  mailDavet:   document.getElementById('p-mail-davet'),
  mailSonuc:   document.getElementById('p-mail-sonuc'),
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
    const tab = t.dataset.tab;
    el.tabListe.hidden = tab !== 'liste';
    el.tabEkle.hidden = tab !== 'ekle';
    el.tabMail.hidden = tab !== 'mail';
  });
});

// --- Liste (katilimci_admin view'i üzerinden) ---
async function listeleYenile(aramaQ = '') {
  let q = supabase
    .from('katilimci_admin')
    .select('id, kod, ad_soyad, email, gun1_ogle, gun2_ogle, pin_var')
    .order('ad_soyad');

  if (aramaQ.trim().length >= 2) {
    const s = aramaQ.trim();
    q = q.or(`ad_soyad.ilike.%${s}%,kod.ilike.%${s}%,email.ilike.%${s}%`);
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
      <td>${escapeHtml(k.ad_soyad)}</td>
      <td><code>${k.kod}</code></td>
      <td class="p-email">${k.email ? escapeHtml(k.email) : '<span class="p-bos">—</span>'}</td>
      <td>${k.pin_var ? '<span class="p-pin-ok">✓</span>' : '<span class="p-bos">—</span>'}</td>
      <td>${gunHucresi(k.gun1_ogle, k.id, 'gun1_ogle')}</td>
      <td>${gunHucresi(k.gun2_ogle, k.id, 'gun2_ogle')}</td>
      <td>
        <button class="p-btn-sil" data-id="${k.id}" data-ad="${escapeHtml(k.ad_soyad)}">Sil</button>
      </td>
    `;
    el.listeGovde.appendChild(tr);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function gunHucresi(zaman, id, kolon) {
  if (zaman) {
    return `<span class="p-aldi" data-id="${id}" data-kol="${kolon}" title="tıkla → sıfırla">${saatFormatla(zaman)}</span>`;
  }
  return `<span class="p-almadi" data-id="${id}" data-kol="${kolon}" title="tıkla → alındı işaretle">—</span>`;
}

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

let aramaTimer;
el.arama.addEventListener('input', () => {
  clearTimeout(aramaTimer);
  aramaTimer = setTimeout(() => listeleYenile(el.arama.value), 300);
});

el.yenile.addEventListener('click', () => listeleYenile(el.arama.value));

// --- Sayaç ---
async function sayacGuncelle() {
  const { count: toplam } = await supabase.from('katilimci_admin').select('*', { count: 'exact', head: true });
  const { count: g1 } = await supabase.from('katilimci_admin').select('*', { count: 'exact', head: true }).not('gun1_ogle', 'is', null);
  const { count: g2 } = await supabase.from('katilimci_admin').select('*', { count: 'exact', head: true }).not('gun2_ogle', 'is', null);
  el.sayac.textContent = `Toplam: ${toplam || 0} · 9 May: ${g1 || 0} · 10 May: ${g2 || 0}`;
}

// --- CSV ---
el.csvFile.addEventListener('change', (e) => {
  const dosya = e.target.files[0];
  if (!dosya) return;

  Papa.parse(dosya, {
    header: true,
    skipEmptyLines: true,
    complete: (sonuc) => {
      csvKayitlari = (sonuc.data || []).map(r => ({
        ad_soyad: (r.ad_soyad || r['Ad Soyad'] || r.ad || '').trim(),
        email: (r.email || r.Email || r['E-posta'] || '').trim().toLowerCase() || null,
      })).filter(r => r.ad_soyad);

      const emailsiz = csvKayitlari.filter(r => !r.email).length;
      el.csvOnizleme.hidden = false;
      el.csvOnizleme.innerHTML = `
        <strong>${csvKayitlari.length} kayıt hazır</strong>
        ${emailsiz > 0 ? `<p style="color: var(--y-warn);">⚠️ ${emailsiz} kişinin email'i eksik — onlara davet maili gitmez</p>` : ''}
        <ul>${csvKayitlari.slice(0, 5).map(r => `<li>${escapeHtml(r.ad_soyad)} ${r.email ? `<small>(${escapeHtml(r.email)})</small>` : ''}</li>`).join('')}${csvKayitlari.length > 5 ? `<li>...ve ${csvKayitlari.length - 5} daha</li>` : ''}</ul>
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
    .select('kod, ad_soyad, email');

  if (error) { alert('Hata: ' + error.message); return; }

  linkleriGoster(data);
  csvKayitlari = null;
  el.csvFile.value = '';
  el.csvOnizleme.hidden = true;
  el.csvYukle.hidden = true;
  await listeleYenile();
  await sayacGuncelle();
});

// --- Tek kişi ---
el.tekForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const kayit = {
    ad_soyad: el.tekAd.value.trim(),
    email: el.tekEmail.value.trim().toLowerCase() || null,
    kod: randomKod()
  };

  const { data, error } = await supabase
    .from('katilimcilar')
    .insert(kayit)
    .select('kod, ad_soyad, email')
    .single();

  if (error) { alert('Hata: ' + error.message); return; }

  el.tekAd.value = '';
  el.tekEmail.value = '';
  linkleriGoster([data]);
  await listeleYenile();
  await sayacGuncelle();
});

// --- Link çıktısı ---
function linkleriGoster(kayitlar) {
  const metin = kayitlar.map(k => `${k.ad_soyad}${k.email ? ' (' + k.email + ')' : ''}: ${BASE_URL}${k.kod}`).join('\n');
  el.linkler.hidden = false;
  el.linkMetin.value = metin;
  el.linkler.scrollIntoView({ behavior: 'smooth' });
}

el.linkKopyala.addEventListener('click', async () => {
  await navigator.clipboard.writeText(el.linkMetin.value);
  el.linkKopyala.textContent = 'Kopyalandı ✓';
  setTimeout(() => { el.linkKopyala.textContent = 'Kopyala'; }, 2000);
});

// --- Mail davet ---
el.mailDavet.addEventListener('click', async () => {
  if (!confirm('PIN\'i olmayan tüm email\'li katılımcılara davet maili gönderilecek. Devam?')) return;

  el.mailDavet.disabled = true;
  const eski = el.mailDavet.textContent;
  el.mailDavet.textContent = 'Gönderiliyor...';
  el.mailSonuc.hidden = true;

  try {
    const { data, error } = await supabase.functions.invoke('yemek-mail', {
      body: { action: 'davet' }
    });
    if (error) throw error;

    el.mailSonuc.hidden = false;
    if (data.sent === 0 && data.toplam === 0) {
      el.mailSonuc.innerHTML = '✓ Gönderilecek katılımcı yok (herkesin ya PIN\'i var ya email\'i yok).';
    } else {
      let msg = `✓ ${data.sent} mail başarıyla gönderildi.`;
      if (data.failed > 0) msg += `<br>⚠️ ${data.failed} hata:<br><small>${(data.fails || []).slice(0, 5).join('<br>')}</small>`;
      el.mailSonuc.innerHTML = msg;
    }
  } catch (e) {
    el.mailSonuc.hidden = false;
    el.mailSonuc.textContent = 'Hata: ' + e.message;
  } finally {
    el.mailDavet.disabled = false;
    el.mailDavet.textContent = eski;
  }
});
