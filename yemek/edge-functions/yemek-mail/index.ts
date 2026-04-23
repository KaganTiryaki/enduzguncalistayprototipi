// Supabase Edge Function: yemek-mail
// Davet + şifre sıfırlama maillerini Brevo üzerinden gönderir.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = "noreply@maltepefencalistay.org";
const FROM_NAME = "Maltepe Fen Çalıştay";
const SITE_URL = "https://yemek.maltepefencalistay.org";

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
  if (!apiKey) throw new Error("BREVO_API_KEY yok");

  const r = await fetch(BREVO_API, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!r.ok) {
    const err = await r.text();
    console.error("Brevo error:", err);
    throw new Error("Brevo mail atılamadı: " + err);
  }
  return true;
}

function davetHtml(adSoyad: string, link: string) {
  return `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#1a1a1a;">
  <div style="text-align:center;padding:24px 0;border-bottom:2px solid #2C56A5;">
    <h1 style="color:#2C56A5;margin:0;font-size:24px;">MFL FBÇ '26 — Çalıştay Yemek</h1>
  </div>
  <div style="padding:24px 0;">
    <h2 style="color:#2C56A5;">Merhaba ${adSoyad}</h2>
    <p style="line-height:1.6;">
      Maltepe Fen Lisesi Fen Bilimleri Çalıştayı '26'ya katıldığın için teşekkürler.
      Etkinlik boyunca yemek QR kodunu görmek için aşağıdaki linke tıkla ve
      sana özel bir PIN belirle. PIN'ini unutma — sonraki girişlerde kullanacaksın.
    </p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${link}" style="background:#2C56A5;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
        Giriş Yap & PIN Oluştur
      </a>
    </p>
    <p style="color:#666;font-size:14px;">
      Veya bu linki kopyala: <br>
      <code style="background:#f0f0f0;padding:4px 8px;border-radius:4px;word-break:break-all;">${link}</code>
    </p>
  </div>
  <div style="text-align:center;color:#888;font-size:12px;padding-top:16px;border-top:1px solid #e0e0e0;">
    MFL FBÇ '26 — 9-10 Mayıs 2026 · Maltepe Fen Lisesi
  </div>
</div>`;
}

function kabulHtml(ilkIsim: string, adSoyad: string, komite: string, sonTarih: string) {
  return `
<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.6;">
  <div style="text-align:center;padding:24px 0;border-bottom:2px solid #2C56A5;">
    <h1 style="color:#2C56A5;margin:0;font-size:22px;">Maltepe Fen Lisesi Fen Bilimleri Çalıştayı Başvuru Onayı</h1>
  </div>
  <div style="padding:24px 0;">
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

    <p>Açıklama kısmına lütfen şu şekilde yazınız:</p>
    <div style="background:#fff6e0;border:1px dashed #d4a34a;padding:12px 16px;margin:8px 0 16px 0;border-radius:4px;font-family:monospace;font-size:14px;">
      ${adSoyad} - MFL FBÇ - ${komite} - Bağış
    </div>
    <p style="color:#666;font-size:14px;font-style:italic;">
      (Belirtilen format dışındaki açıklamalarla yapılan ödemeler geçersiz sayılacak ve para iadesi yapılmayacaktır.)
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
  </div>
  <div style="text-align:center;color:#888;font-size:12px;padding-top:16px;border-top:1px solid #e0e0e0;">
    <a href="https://www.instagram.com/mflfenbilimlericalistayi/" style="color:#2C56A5;text-decoration:none;">@mflfenbilimlericalistayi</a>
  </div>
</div>`;
}

function resetHtml(adSoyad: string, link: string) {
  return `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#1a1a1a;">
  <div style="text-align:center;padding:24px 0;border-bottom:2px solid #2C56A5;">
    <h1 style="color:#2C56A5;margin:0;font-size:24px;">PIN Sıfırlama</h1>
  </div>
  <div style="padding:24px 0;">
    <h2 style="color:#2C56A5;">Merhaba ${adSoyad}</h2>
    <p style="line-height:1.6;">
      PIN'ini sıfırlamak istediğini belirttin. Yeni bir PIN belirlemek için
      aşağıdaki linke tıkla. Bu link <strong>1 saat boyunca</strong> geçerli.
    </p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${link}" style="background:#2C56A5;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
        Yeni PIN Belirle
      </a>
    </p>
    <p style="color:#c33;font-size:14px;">
      Eğer bu isteği sen yapmadıysan bu maili görmezden gelebilirsin — PIN'in değişmeyecek.
    </p>
  </div>
  <div style="text-align:center;color:#888;font-size:12px;padding-top:16px;border-top:1px solid #e0e0e0;">
    MFL FBÇ '26 — Çalıştay Yemek Sistemi
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
    const action = body.action;

    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(supaUrl, supaKey);

    // ============================================================
    // action: "davet" — tüm emailli katılımcılara davet mailleri
    // ============================================================
    if (action === "davet") {
      const { data, error } = await supa
        .from("katilimcilar")
        .select("kod, ad_soyad, email")
        .not("email", "is", null)
        .is("pin_hash", null);

      if (error) return jsonResp({ error: error.message }, 500);

      let sent = 0;
      let failed = 0;
      const fails: string[] = [];

      for (const k of data || []) {
        try {
          const link = `${SITE_URL}/k/${k.kod}`;
          await brevoSend(k.email, "MFL Çalıştay — Yemek QR Kodun", davetHtml(k.ad_soyad, link));
          sent++;
        } catch (e) {
          failed++;
          fails.push(`${k.ad_soyad} (${k.email}): ${(e as Error).message}`);
        }
      }

      return jsonResp({ sent, failed, fails, toplam: (data || []).length });
    }

    // ============================================================
    // action: "davet_tek" — tek bir katılımcıya davet (yeni eklenen)
    // ============================================================
    if (action === "davet_tek") {
      const kod = (body.kod || "").toUpperCase();
      const { data, error } = await supa
        .from("katilimcilar")
        .select("kod, ad_soyad, email")
        .eq("kod", kod)
        .maybeSingle();

      if (error) return jsonResp({ error: error.message }, 500);
      if (!data) return jsonResp({ error: "katilimci_yok" }, 404);
      if (!data.email) return jsonResp({ error: "email_yok" }, 400);

      const link = `${SITE_URL}/k/${data.kod}`;
      await brevoSend(data.email, "MFL Çalıştay — Yemek QR Kodun", davetHtml(data.ad_soyad, link));
      return jsonResp({ ok: true });
    }

    // ============================================================
    // action: "kabul_toplu" — verilen listeye kabul maili at
    // body: { komite: string, sonTarih: string, kisiler: [{ ad_soyad, email }, ...] }
    // ============================================================
    if (action === "kabul_toplu") {
      const komite = String(body.komite || "").trim();
      const sonTarih = String(body.sonTarih || "").trim();
      const kisiler = Array.isArray(body.kisiler) ? body.kisiler : [];
      if (!komite) return jsonResp({ error: "komite_gerekli" }, 400);
      if (!sonTarih) return jsonResp({ error: "son_tarih_gerekli" }, 400);
      if (kisiler.length === 0) return jsonResp({ error: "liste_bos" }, 400);

      let sent = 0;
      let failed = 0;
      const fails: string[] = [];

      for (const k of kisiler) {
        const adSoyad = String(k.ad_soyad || "").trim();
        const email = String(k.email || "").trim().toLowerCase();
        if (!email) { failed++; fails.push(`${adSoyad || "(isimsiz)"}: email_yok`); continue; }

        const ilkIsim = adSoyad.split(/\s+/)[0] || "arkadaşım";

        try {
          await brevoSend(
            email,
            "Maltepe Fen Lisesi Fen Bilimleri Çalıştayı Başvuru Onayı",
            kabulHtml(ilkIsim, adSoyad, komite, sonTarih)
          );
          sent++;
        } catch (e) {
          failed++;
          fails.push(`${adSoyad} (${email}): ${(e as Error).message}`);
        }
      }

      return jsonResp({ sent, failed, fails, toplam: kisiler.length, komite });
    }

    // ============================================================
    // action: "reset" — şifremi unuttum
    // ============================================================
    if (action === "reset") {
      const email = (body.email || "").toLowerCase().trim();
      if (!email) return jsonResp({ error: "email_gerekli" }, 400);

      const { data } = await supa
        .from("katilimcilar")
        .select("kod, ad_soyad")
        .eq("email", email)
        .maybeSingle();

      // Kasıtlı: email yoksa da ok dönüyoruz (enumeration saldırısı önleme)
      if (!data) return jsonResp({ ok: true });

      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const { error: updErr } = await supa
        .from("katilimcilar")
        .update({ reset_token: token, reset_expires: expires })
        .eq("kod", data.kod);

      if (updErr) return jsonResp({ error: updErr.message }, 500);

      const link = `${SITE_URL}/k/${data.kod}?reset=${token}`;
      await brevoSend(email, "MFL Çalıştay — PIN Sıfırlama", resetHtml(data.ad_soyad, link));
      return jsonResp({ ok: true });
    }

    return jsonResp({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error(e);
    return jsonResp({ error: (e as Error).message }, 500);
  }
});
