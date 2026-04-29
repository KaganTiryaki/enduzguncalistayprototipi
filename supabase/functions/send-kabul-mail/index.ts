// Supabase Edge Function: send-kabul-mail
// Komite kabul maillerini Brevo üzerinden toplu gönderir.
// Çağrılma: Panel /panel sayfası, staff PIN doğrulamalı.
//
// Secrets gerekli (Supabase Dashboard → Edge Functions → Secrets):
//   BREVO_API_KEY      — Brevo dashboard'dan alınan API anahtarı
//   STAFF_PIN          — Görevli/admin PIN (panel'de girilen, varsayılan 0910)
//
// HTTP body örneği:
//   {
//     "p_staff_code": "0910",
//     "komite": "Moleküler Biyoloji ve Genetik",
//     "sonTarih": "07.05.2026",
//     "duzeltme": false,
//     "kisiler": [
//       { "ad_soyad": "Ada Vardar", "email": "adavrdr43@gmail.com" }
//     ]
//   }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BREVO_API = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = "maltepefenfbc@gmail.com";
const FROM_NAME = "Maltepe Fen Çalıştay";
const REPLY_TO_EMAIL = "maltepefenfbc@gmail.com";
const REPLY_TO_NAME = "MFL FBÇ Ekibi";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function brevoSend(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) throw new Error("BREVO_API_KEY secret yok");

  const r = await fetch(BREVO_API, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      replyTo: { name: REPLY_TO_NAME, email: REPLY_TO_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!r.ok) {
    const err = await r.text();
    throw new Error("Brevo: " + err);
  }
  return true;
}

function kabulHtml(ilkIsim: string, adSoyad: string, komite: string, sonTarih: string, duzeltme: boolean) {
  const duzeltmeBanner = duzeltme ? `
  <div style="background:#fff5f5;border:2px solid #c33;padding:16px 20px;margin:0 0 20px 0;border-radius:4px;">
    <p style="margin:0 0 8px 0;color:#c33;font-weight:700;font-size:15px;">⚠️ DÜZELTME — ÖNEMLİ</p>
    <p style="margin:0;color:#1a1a1a;font-size:14px;line-height:1.5;">
      Az önce tarafınıza gönderdiğimiz başvuru onayı mailinde <strong>komite adı sehven yanlış</strong> yazılmıştır. Lütfen önceki maili <strong>dikkate almayınız</strong>. Aşağıda doğru bilgiler yer almaktadır. Yaşattığımız karışıklık için özür dileriz.
    </p>
  </div>` : '';
  return `
<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.6;">
  <div style="text-align:center;padding:24px 0;border-bottom:2px solid #2C56A5;">
    <h1 style="color:#2C56A5;margin:0;font-size:22px;">Maltepe Fen Lisesi Fen Bilimleri Çalıştayı Başvuru Onayı</h1>
  </div>
  <div style="padding:24px 0;">
    ${duzeltmeBanner}
    <p style="margin:0 0 16px 0;">Merhabalar <strong>${ilkIsim}</strong>,</p>

    <p>
      Maltepe Fen Lisesi tarafından düzenlenecek olan Fen Bilimleri Çalıştayı için yapmış olduğunuz başvuru, değerlendirme komitemiz tarafından özenle incelenmiş ve başvurunuzun <strong>${komite}</strong> komitesine kabul edilmesine karar verilmiştir. İlginiz ve başvurunuz için teşekkür ederiz.
    </p>

    <p>
      Katılımınızın kesinleşmesi için, <strong>${sonTarih}</strong> tarihine kadar aşağıda belirtilen IBAN numarasına çalıştay katılım ücretini yatırmanız gerekmektedir:
    </p>

    <div style="background:#f4f7fc;border-left:3px solid #2C56A5;padding:16px 20px;margin:20px 0;border-radius:4px;">
      <p style="margin:4px 0;"><strong>IBAN:</strong> TR12 0006 4000 0011 0341 1339 52</p>
      <p style="margin:4px 0;"><strong>Alıcı Adı:</strong> Demir Murat Sönmez</p>
      <p style="margin:4px 0;"><strong>Tutar:</strong> 750 TL</p>
    </div>

    <p>Açıklama kısmına lütfen <strong>tam olarak</strong> aşağıdaki şekilde yazınız — <strong style="color:#c33;">özellikle komite adınızı (${komite}) mutlaka belirtin</strong>, aksi halde ödemeniz hangi katılımcıya ait olduğu anlaşılamaz:</p>
    <div style="background:#fff6e0;border:1px dashed #d4a34a;padding:12px 16px;margin:8px 0 16px 0;border-radius:4px;font-family:monospace;font-size:14px;">
      ${adSoyad} - MFL FBÇ - <strong>${komite}</strong> - Bağış
    </div>
    <p style="color:#666;font-size:14px;font-style:italic;">
      (Belirtilen format dışındaki — komite adı yazılmamış veya farklı yazılmış — açıklamalarla yapılan ödemeler geçersiz sayılacak ve para iadesi yapılmayacaktır.)
    </p>

    <p>
      Son ödeme tarihi, zaruri durumlar haricinde kesinlikle geçirilmemelidir. Ödemede gecikme yaşanacaksa, mutlaka öncesinde aşağıdaki numaraya sebebiyle birlikte bilgilendirme yapılmalıdır:
    </p>
    <p style="text-align:center;font-size:18px;font-weight:600;color:#2C56A5;margin:12px 0 24px 0;">
      +90 543 881 38 36
    </p>

    <p>Sizleri aramızda görmekten büyük mutluluk duyacağız.<br>
    Fen dolu bir çalıştayda görüşmek üzere!</p>

    <p style="margin-top:28px;">
      Saygılarımızla,<br>
      <strong>Maltepe Fen Lisesi Fen Bilimleri Çalıştayı Ekibi</strong>
    </p>

    <p style="color:#666;font-size:13px;margin-top:20px;">
      Sorularınız için: <a href="mailto:maltepefenfbc@gmail.com" style="color:#2C56A5;">maltepefenfbc@gmail.com</a>
    </p>
  </div>
  <div style="text-align:center;color:#888;font-size:12px;padding-top:16px;border-top:1px solid #e0e0e0;">
    <a href="https://www.instagram.com/mflfenbilimlericalistayi/" style="color:#2C56A5;text-decoration:none;">@mflfenbilimlericalistayi</a>
  </div>
</div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResp({ error: "POST only" }, 405);
  }

  try {
    const body = await req.json();
    const staffCode = String(body.p_staff_code || "").trim();
    const expectedPin = Deno.env.get("STAFF_PIN") || "0910";
    if (staffCode !== expectedPin) {
      return jsonResp({ error: "invalid_staff" }, 401);
    }

    const komite = String(body.komite || "").trim();
    const sonTarih = String(body.sonTarih || "").trim();
    const duzeltme = body.duzeltme === true;
    const kisiler = Array.isArray(body.kisiler) ? body.kisiler : [];
    if (!komite) return jsonResp({ error: "komite_gerekli" }, 400);
    if (!sonTarih) return jsonResp({ error: "son_tarih_gerekli" }, 400);
    if (kisiler.length === 0) return jsonResp({ error: "liste_bos" }, 400);

    let sent = 0;
    let failed = 0;
    const fails: { name: string; email: string; reason: string }[] = [];

    const konu = duzeltme
      ? "DÜZELTME — Maltepe Fen Lisesi Fen Bilimleri Çalıştayı Başvuru Onayı"
      : "Maltepe Fen Lisesi Fen Bilimleri Çalıştayı Başvuru Onayı";

    for (const k of kisiler) {
      const adSoyad = String(k.ad_soyad || "").trim();
      const email = String(k.email || "").trim().toLowerCase();
      if (!email) {
        failed++;
        fails.push({ name: adSoyad || "(isimsiz)", email: "", reason: "email_yok" });
        continue;
      }

      const ilkIsim = adSoyad.split(/\s+/)[0] || "arkadaşım";

      try {
        await brevoSend(email, konu, kabulHtml(ilkIsim, adSoyad, komite, sonTarih, duzeltme));
        sent++;
      } catch (e) {
        failed++;
        fails.push({ name: adSoyad, email, reason: (e as Error).message });
      }
    }

    return jsonResp({ sent, failed, fails, toplam: kisiler.length, komite, duzeltme });
  } catch (e) {
    console.error(e);
    return jsonResp({ error: (e as Error).message }, 500);
  }
});
