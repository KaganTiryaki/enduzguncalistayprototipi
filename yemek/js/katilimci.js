// yemek/js/katilimci.js
// Katılımcı sayfası: kod bul, veri çek, QR üret, durum göster.

import { supabase } from './supabase-client.js';
import { LOCAL_STORAGE_ANAHTAR } from './config.js';
import { saatFormatla } from './util.js';

const el = {
  giris:       document.getElementById('y-giris'),
  girisInput:  document.getElementById('y-kod-input'),
  girisBtn:    document.getElementById('y-kod-submit'),
  girisHata:   document.getElementById('y-giris-hata'),
  qr:          document.getElementById('y-qr'),
  ad:          document.getElementById('y-ad'),
  qrCanvas:    document.getElementById('y-qr-canvas'),
  gun1:        document.getElementById('y-gun1').querySelector('.y-gun-badge'),
  gun2:        document.getElementById('y-gun2').querySelector('.y-gun-badge'),
  cikis:       document.getElementById('y-cikis'),
  offline:     document.getElementById('y-offline-banner')
};

// --- Kod bulma sırası ---
function kodUrldenAl() {
  const qs = new URLSearchParams(window.location.search);
  if (qs.get('kod')) return qs.get('kod').toUpperCase();

  const pathParca = window.location.pathname.split('/').filter(Boolean);
  const kIdx = pathParca.indexOf('k');
  if (kIdx !== -1 && pathParca[kIdx + 1]) return pathParca[kIdx + 1].toUpperCase();

  return null;
}

function kodLocalAl() {
  return localStorage.getItem(LOCAL_STORAGE_ANAHTAR);
}

function kodLocalKaydet(kod) {
  localStorage.setItem(LOCAL_STORAGE_ANAHTAR, kod);
}

function kodLocalSil() {
  localStorage.removeItem(LOCAL_STORAGE_ANAHTAR);
}

// --- Veri çekme ---
async function katilimciGetir(kod) {
  const { data, error } = await supabase
    .from('katilimcilar')
    .select('kod, ad_soyad, gun1_ogle, gun2_ogle')
    .eq('kod', kod)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// --- QR üretme ---
function qrUret(icerik) {
  el.qrCanvas.innerHTML = '';
  new QRCode(el.qrCanvas, {
    text: icerik,
    width: 280,
    height: 280,
    colorDark: '#2C56A5',
    colorLight: '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H
  });
}

// --- Durum rozeti ---
function durumRozetiGuncelle(badgeEl, zaman) {
  if (zaman) {
    badgeEl.textContent = `Aldın (${saatFormatla(zaman)})`;
    badgeEl.className = 'y-gun-badge y-badge-aldi';
  } else {
    badgeEl.textContent = 'Henüz alınmadı';
    badgeEl.className = 'y-gun-badge y-badge-bekle';
  }
}

// --- Ana akış ---
async function goster(kod) {
  el.giris.hidden = true;
  el.qr.hidden = false;

  try {
    const k = await katilimciGetir(kod);
    if (!k) {
      el.qr.hidden = true;
      el.giris.hidden = false;
      el.girisHata.hidden = false;
      el.girisHata.textContent = 'Bu kod sistemde bulunamadı. Kontrol edip tekrar dene.';
      kodLocalSil();
      return;
    }

    el.ad.textContent = k.ad_soyad;
    qrUret(k.kod);
    durumRozetiGuncelle(el.gun1, k.gun1_ogle);
    durumRozetiGuncelle(el.gun2, k.gun2_ogle);
    kodLocalKaydet(k.kod);

    localStorage.setItem('mfl_yemek_cache_' + k.kod, JSON.stringify(k));
  } catch (e) {
    console.error(e);
    const cache = localStorage.getItem('mfl_yemek_cache_' + kod);
    if (cache) {
      const k = JSON.parse(cache);
      el.ad.textContent = k.ad_soyad;
      qrUret(k.kod);
      durumRozetiGuncelle(el.gun1, k.gun1_ogle);
      durumRozetiGuncelle(el.gun2, k.gun2_ogle);
      el.offline.hidden = false;
    } else {
      el.qr.hidden = true;
      el.giris.hidden = false;
      el.girisHata.hidden = false;
      el.girisHata.textContent = 'Bağlantı hatası. İnternetini kontrol et.';
    }
  }
}

function girisiGoster() {
  el.giris.hidden = false;
  el.qr.hidden = true;
  el.girisHata.hidden = true;
  el.girisInput.focus();
}

// --- Event handler'lar ---
el.girisBtn.addEventListener('click', () => {
  const kod = el.girisInput.value.trim().toUpperCase();
  if (!kod || kod.length < 4) {
    el.girisHata.hidden = false;
    el.girisHata.textContent = 'Kodu tam gir (6 karakter).';
    return;
  }
  goster(kod);
});

el.girisInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') el.girisBtn.click();
});

el.cikis.addEventListener('click', () => {
  kodLocalSil();
  girisiGoster();
});

// --- Başlangıç ---
const urlKod = kodUrldenAl();
const cachedKod = kodLocalAl();

if (urlKod) {
  goster(urlKod);
} else if (cachedKod) {
  goster(cachedKod);
} else {
  girisiGoster();
}
