// yemek/js/katilimci.js
// Katılımcı akışı: kod → PIN oluştur veya PIN gir → QR.

import { supabase } from './supabase-client.js';
import { LOCAL_STORAGE_ANAHTAR, GUN1_TARIH, GUN2_TARIH } from './config.js';
import { saatFormatla } from './util.js';

const el = {
  kodSec:      document.getElementById('y-giris-kod'),
  kodInput:    document.getElementById('y-kod-input'),
  kodSubmit:   document.getElementById('y-kod-submit'),
  kodHata:     document.getElementById('y-giris-hata'),

  olusturSec:  document.getElementById('y-pin-olustur'),
  olusturSelam:document.getElementById('y-olustur-selam'),
  olusturIn1:  document.getElementById('y-pin-olustur-input1'),
  olusturIn2:  document.getElementById('y-pin-olustur-input2'),
  olusturBtn:  document.getElementById('y-pin-olustur-submit'),
  olusturHata: document.getElementById('y-pin-olustur-hata'),

  girisSec:    document.getElementById('y-pin-giris'),
  girisSelam:  document.getElementById('y-giris-selam'),
  girisIn:     document.getElementById('y-pin-giris-input'),
  girisBtn:    document.getElementById('y-pin-giris-submit'),
  girisHata:   document.getElementById('y-pin-giris-hata'),
  unuttumBtn:  document.getElementById('y-unuttum-btn'),

  unuttumSec:  document.getElementById('y-unuttum'),
  unuttumEmail:document.getElementById('y-unuttum-email'),
  unuttumSubmit:document.getElementById('y-unuttum-submit'),
  unuttumBilgi:document.getElementById('y-unuttum-bilgi'),
  unuttumGeri: document.getElementById('y-unuttum-geri'),

  resetSec:    document.getElementById('y-reset'),
  resetIn1:    document.getElementById('y-reset-pin1'),
  resetIn2:    document.getElementById('y-reset-pin2'),
  resetBtn:    document.getElementById('y-reset-submit'),
  resetHata:   document.getElementById('y-reset-hata'),

  qrSec:       document.getElementById('y-qr'),
  ad:          document.getElementById('y-ad'),
  qrCanvas:    document.getElementById('y-qr-canvas'),
  gun1:        document.getElementById('y-gun1').querySelector('.y-gun-badge'),
  gun2:        document.getElementById('y-gun2').querySelector('.y-gun-badge'),
  cikis:       document.getElementById('y-cikis'),
  offline:     document.getElementById('y-offline-banner'),
};

const state = { kod: null, resetToken: null };

// --- UI yardımcıları ---
const ALL_SECS = [el.kodSec, el.olusturSec, el.girisSec, el.unuttumSec, el.resetSec, el.qrSec];
function showOnly(sec) {
  ALL_SECS.forEach(s => s.hidden = true);
  sec.hidden = false;
}
function hata(e, msg) { e.hidden = false; e.textContent = msg; }
function hataTemizle(e) { e.hidden = true; e.textContent = ''; }

// --- URL / storage ---
function kodUrldenAl() {
  const qs = new URLSearchParams(window.location.search);
  if (qs.get('kod')) return qs.get('kod').toUpperCase();
  const p = window.location.pathname.split('/').filter(Boolean);
  const i = p.indexOf('k');
  if (i !== -1 && p[i + 1]) return p[i + 1].toUpperCase();
  return null;
}
function tokenUrldenAl() {
  return new URLSearchParams(window.location.search).get('reset');
}
const kodLocalAl = () => localStorage.getItem(LOCAL_STORAGE_ANAHTAR);
const kodLocalKaydet = k => localStorage.setItem(LOCAL_STORAGE_ANAHTAR, k);
const kodLocalSil = () => localStorage.removeItem(LOCAL_STORAGE_ANAHTAR);

// --- Durum sorgula (view'den, pin_var dahil) ---
async function durumAl(kod) {
  const { data, error } = await supabase
    .from('katilimci_goster')
    .select('kod, ad_soyad, gun1_ogle, gun2_ogle, pin_var')
    .eq('kod', kod)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// --- QR ---
function qrUret(icerik) {
  el.qrCanvas.innerHTML = '';
  new QRCode(el.qrCanvas, {
    text: icerik,
    width: 280,
    height: 280,
    colorDark: '#2C56A5',
    colorLight: '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H,
  });
}

function rozetGuncelle(badge, zaman, gunTarihi) {
  const bugun = new Date().toISOString().slice(0, 10);
  if (zaman) {
    badge.textContent = `Aldın (${saatFormatla(zaman)})`;
    badge.className = 'y-gun-badge y-badge-aldi';
  } else if (bugun > gunTarihi) {
    badge.textContent = 'Kaçırıldı';
    badge.className = 'y-gun-badge y-badge-gecti';
  } else {
    badge.textContent = 'Henüz alınmadı';
    badge.className = 'y-gun-badge y-badge-bekle';
  }
}

function qrGoster(k) {
  el.ad.textContent = k.ad_soyad;
  qrUret(k.kod);
  rozetGuncelle(el.gun1, k.gun1_ogle, GUN1_TARIH);
  rozetGuncelle(el.gun2, k.gun2_ogle, GUN2_TARIH);
  localStorage.setItem('mfl_yemek_cache_' + k.kod, JSON.stringify(k));
  showOnly(el.qrSec);
}

// --- Kod alındıktan sonra doğru akışa yönlendir ---
async function kodIsle(kod) {
  try {
    const d = await durumAl(kod);
    if (!d) {
      kodLocalSil();
      hata(el.kodHata, 'Bu kod sistemde bulunamadı.');
      showOnly(el.kodSec);
      return;
    }
    state.kod = d.kod;
    kodLocalKaydet(d.kod);

    if (d.pin_var) {
      el.girisSelam.textContent = `Merhaba ${d.ad_soyad}`;
      hataTemizle(el.girisHata);
      el.girisIn.value = '';
      showOnly(el.girisSec);
      setTimeout(() => el.girisIn.focus(), 50);
    } else {
      el.olusturSelam.textContent = `Merhaba ${d.ad_soyad}`;
      hataTemizle(el.olusturHata);
      el.olusturIn1.value = '';
      el.olusturIn2.value = '';
      showOnly(el.olusturSec);
      setTimeout(() => el.olusturIn1.focus(), 50);
    }
  } catch (e) {
    console.error(e);
    hata(el.kodHata, 'Bağlantı hatası. İnternetini kontrol et.');
    showOnly(el.kodSec);
  }
}

// --- Event handlers ---
el.kodSubmit.addEventListener('click', () => {
  const kod = (el.kodInput.value || '').trim().toUpperCase();
  if (kod.length < 4) { hata(el.kodHata, 'Kodu tam gir (6 karakter).'); return; }
  kodIsle(kod);
});
el.kodInput.addEventListener('keydown', e => { if (e.key === 'Enter') el.kodSubmit.click(); });

el.olusturBtn.addEventListener('click', async () => {
  const p1 = el.olusturIn1.value.trim();
  const p2 = el.olusturIn2.value.trim();
  if (p1.length < 4 || p1.length > 8) { hata(el.olusturHata, 'PIN 4-8 haneli olmalı'); return; }
  if (p1 !== p2) { hata(el.olusturHata, 'PIN\'ler eşleşmiyor'); return; }
  try {
    const { data, error } = await supabase.rpc('pin_olustur', { p_kod: state.kod, p_pin: p1 });
    if (error) throw error;
    if (data.durum === 'ok') {
      const { data: d2 } = await supabase.rpc('pin_dogrula', { p_kod: state.kod, p_pin: p1 });
      if (d2?.durum === 'ok') { qrGoster(d2.katilimci); return; }
      throw new Error('PIN kaydedildi ama giriş yapılamadı');
    }
    if (data.durum === 'pin_zaten_var') { kodIsle(state.kod); return; }
    hata(el.olusturHata, data.mesaj || 'Hata: ' + data.durum);
  } catch (e) {
    hata(el.olusturHata, 'Bağlantı hatası: ' + e.message);
  }
});

el.girisBtn.addEventListener('click', async () => {
  const pin = el.girisIn.value.trim();
  if (!pin) return;
  try {
    const { data, error } = await supabase.rpc('pin_dogrula', { p_kod: state.kod, p_pin: pin });
    if (error) throw error;
    if (data.durum === 'ok') { qrGoster(data.katilimci); return; }
    if (data.durum === 'yanlis') {
      hata(el.girisHata, 'PIN hatalı');
      el.girisIn.value = '';
      el.girisIn.focus();
      return;
    }
    if (data.durum === 'pin_yok') { kodIsle(state.kod); return; }
    if (data.durum === 'kod_yok') {
      kodLocalSil();
      hata(el.kodHata, 'Kod bulunamadı.');
      showOnly(el.kodSec);
      return;
    }
    hata(el.girisHata, 'Hata: ' + data.durum);
  } catch (e) {
    hata(el.girisHata, 'Bağlantı hatası: ' + e.message);
  }
});
el.girisIn.addEventListener('keydown', e => { if (e.key === 'Enter') el.girisBtn.click(); });

el.unuttumBtn.addEventListener('click', () => {
  el.unuttumEmail.value = '';
  el.unuttumBilgi.hidden = true;
  showOnly(el.unuttumSec);
  setTimeout(() => el.unuttumEmail.focus(), 50);
});
el.unuttumGeri.addEventListener('click', () => { showOnly(el.girisSec); });

el.unuttumSubmit.addEventListener('click', async () => {
  const email = el.unuttumEmail.value.trim();
  if (!email) return;
  el.unuttumSubmit.disabled = true;
  const eskiBtn = el.unuttumSubmit.textContent;
  el.unuttumSubmit.textContent = 'Gönderiliyor...';
  try {
    const { error } = await supabase.functions.invoke('yemek-mail', {
      body: { action: 'reset', email },
    });
    if (error) throw error;
    el.unuttumBilgi.hidden = false;
    el.unuttumBilgi.textContent = 'Eğer bu email sisteme kayıtlıysa, 1 dk içinde sıfırlama linki mailine gelecek.';
  } catch (e) {
    el.unuttumBilgi.hidden = false;
    el.unuttumBilgi.textContent = 'Hata: ' + e.message;
  } finally {
    el.unuttumSubmit.disabled = false;
    el.unuttumSubmit.textContent = eskiBtn;
  }
});

el.resetBtn.addEventListener('click', async () => {
  const p1 = el.resetIn1.value.trim();
  const p2 = el.resetIn2.value.trim();
  if (p1.length < 4 || p1.length > 8) { hata(el.resetHata, 'PIN 4-8 haneli olmalı'); return; }
  if (p1 !== p2) { hata(el.resetHata, 'PIN\'ler eşleşmiyor'); return; }
  try {
    const { data, error } = await supabase.rpc('reset_uygula', { p_token: state.resetToken, p_yeni_pin: p1 });
    if (error) throw error;
    if (data.durum === 'ok') {
      const url = new URL(window.location.href);
      url.searchParams.delete('reset');
      window.history.replaceState({}, '', url.toString());
      state.resetToken = null;
      kodIsle(state.kod);
      return;
    }
    if (data.durum === 'token_suresi_doldu') { hata(el.resetHata, 'Link süresi dolmuş. Yeniden talep et.'); return; }
    if (data.durum === 'token_gecersiz') { hata(el.resetHata, 'Link geçersiz.'); return; }
    hata(el.resetHata, 'Hata: ' + data.durum);
  } catch (e) {
    hata(el.resetHata, 'Bağlantı hatası: ' + e.message);
  }
});

el.cikis.addEventListener('click', () => {
  kodLocalSil();
  state.kod = null;
  el.kodInput.value = '';
  showOnly(el.kodSec);
  setTimeout(() => el.kodInput.focus(), 50);
});

// --- Başlangıç ---
(async function init() {
  const kod = kodUrldenAl() || kodLocalAl();
  const token = tokenUrldenAl();

  if (token && kod) {
    state.kod = kod;
    state.resetToken = token;
    showOnly(el.resetSec);
    setTimeout(() => el.resetIn1.focus(), 50);
    return;
  }

  if (kod) { await kodIsle(kod); return; }

  showOnly(el.kodSec);
  setTimeout(() => el.kodInput.focus(), 50);
})();
