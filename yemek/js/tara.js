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
let kilitli = false;
const gecmis = [];

// --- PIN ---
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

if (sessionStorage.getItem('t-pin-ok') === '1') {
  el.pinGate.hidden = true;
  el.main.hidden = false;
  scannerBaslat();
  sayimGuncelle();
}

// --- Scanner ---
function scannerBaslat() {
  if (qrReader) return;
  qrReader = new Html5Qrcode('t-scanner');
  qrReader.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 240, height: 240 } },
    onQrOkundu,
    () => { /* tarama hatası sessizce */ }
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
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.value = tip === 'ok' ? 880 : tip === 'err' ? 220 : 440;
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    o.start(); o.stop(audioCtx.currentTime + 0.3);
  } catch (e) { /* autoplay restriction olabilir */ }
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

el.gecmis.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('t-g-geri')) return;
  const idx = parseInt(e.target.dataset.idx);
  const kayit = gecmis[idx];
  if (!confirm(`${kayit.ad_soyad} için kaydı iptal et?`)) return;

  const { data, error } = await supabase
    .from('katilimcilar')
    .select('gun1_ogle, gun2_ogle, id')
    .eq('kod', kayit.kod)
    .maybeSingle();

  if (error || !data) { alert('Hata: ' + (error?.message || 'bulunamadı')); return; }

  const guncelleme = {};
  if (data.gun2_ogle) guncelleme.gun2_ogle = null;
  else if (data.gun1_ogle) guncelleme.gun1_ogle = null;

  const { error: err2 } = await supabase
    .from('katilimcilar')
    .update(guncelleme)
    .eq('id', data.id);

  if (err2) { alert('Hata: ' + err2.message); return; }

  gecmis.splice(idx, 1);
  gecmisiRenderle();
  sayimGuncelle();
});

// --- Sayım ---
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

// --- Manuel giriş ---
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
