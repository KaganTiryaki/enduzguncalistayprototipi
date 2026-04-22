// yemek/js/util.js
// Ortak yardımcılar.

import { GUN1_TARIH, GUN2_TARIH } from './config.js';

export function bugununGunu() {
  const bugun = new Date().toISOString().slice(0, 10);
  if (bugun === GUN1_TARIH) return 1;
  if (bugun === GUN2_TARIH) return 2;
  return null;
}

export function randomKod(uzunluk = 6) {
  const harfler = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 0, O, 1, I, l karışıklığı yok
  let kod = '';
  for (let i = 0; i < uzunluk; i++) {
    kod += harfler[Math.floor(Math.random() * harfler.length)];
  }
  return kod;
}

export function saatFormatla(tarihIso) {
  if (!tarihIso) return '';
  const t = new Date(tarihIso);
  return t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function tarihFormatla(tarihIso) {
  if (!tarihIso) return '';
  const t = new Date(tarihIso);
  return t.toLocaleDateString('tr-TR') + ' ' + saatFormatla(tarihIso);
}
