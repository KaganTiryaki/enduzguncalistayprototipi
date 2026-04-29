// MFL FBÇ '26 — Yönetim paneli
// PIN gate + list_cards RPC ile tüm katılımcıları listeler.
// Read-only: ekleme/silme yok.

(() => {
    'use strict';

    const cfg = window.MFL_TARA_CONFIG || {};
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
        alert('config.js yüklenmedi. /tara/config.js erişilemez.');
        return;
    }
    const supabase = window.supabase
        ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
        : null;

    const PIN_KEY = 'mfl-panel-pin';

    const body            = document.body;
    const gateForm        = document.getElementById('gateForm');
    const pinInput        = document.getElementById('pinInput');
    const gateHata        = document.getElementById('gateHata');
    const summaryEl       = document.getElementById('summary');
    const tbody           = document.getElementById('cardsTbody');
    const emptyMsg        = document.getElementById('emptyMsg');
    const searchInput     = document.getElementById('searchInput');
    const committeeFilter = document.getElementById('committeeFilter');
    const statusFilter    = document.getElementById('statusFilter');
    const refreshBtn      = document.getElementById('refreshBtn');
    const exportBtn       = document.getElementById('exportBtn');
    const logoutBtn       = document.getElementById('logoutBtn');
    const contentEl       = document.getElementById('content');

    let staffPin = sessionStorage.getItem(PIN_KEY) || '';
    let allCards = [];

    // ========== gate ==========
    if (staffPin) {
        enterPanel().catch(err => {
            console.error('panel load failed', err);
            staffPin = '';
            sessionStorage.removeItem(PIN_KEY);
            body.className = 'view-gate';
        });
    }

    gateForm.addEventListener('submit', async e => {
        e.preventDefault();
        const code = pinInput.value.trim();
        if (!code) return;
        staffPin = code;
        gateHata.hidden = true;
        try {
            await loadCards();
            sessionStorage.setItem(PIN_KEY, code);
            body.className = 'view-content';
            contentEl.hidden = false;
            renderTable();
        } catch (err) {
            console.error(err);
            gateHata.textContent = err.message && err.message.includes('invalid_staff')
                ? 'PIN geçersiz.'
                : 'Bağlantı hatası: ' + (err.message || err);
            gateHata.hidden = false;
            staffPin = '';
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem(PIN_KEY);
        staffPin = '';
        allCards = [];
        body.className = 'view-gate';
        pinInput.value = '';
        setTimeout(() => pinInput.focus(), 50);
    });

    refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        try { await loadCards(); renderTable(); }
        catch (err) { alert('Yenileme başarısız: ' + (err.message || err)); }
        finally { refreshBtn.disabled = false; }
    });

    exportBtn.addEventListener('click', exportCsv);

    [searchInput, committeeFilter, statusFilter].forEach(el =>
        el.addEventListener('input', renderTable));

    // ========== mail modal ==========
    const mailBtn        = document.getElementById('mailBtn');
    const mailModal      = document.getElementById('mailModal');
    const mailForm       = document.getElementById('mailForm');
    const mailCommittee  = document.getElementById('mailCommittee');
    const mailDate       = document.getElementById('mailDate');
    const mailDuzeltme   = document.getElementById('mailDuzeltme');
    const mailRecipients = document.getElementById('mailRecipients');
    const mailParseInfo  = document.getElementById('mailParseInfo');
    const mailSendBtn    = document.getElementById('mailSendBtn');
    const mailResult     = document.getElementById('mailResult');

    mailBtn.addEventListener('click', () => {
        const committees = [...new Set(allCards.map(c => c.committee).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'tr'));
        mailCommittee.innerHTML = '<option value="">— Komite seç —</option>' +
            committees.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
        mailDate.value = '04.05.2026';
        mailDuzeltme.checked = false;
        mailRecipients.value = '';
        mailParseInfo.hidden = true;
        mailParseInfo.innerHTML = '';
        mailResult.hidden = true;
        mailSendBtn.disabled = true;
        mailModal.hidden = false;
    });

    mailModal.addEventListener('click', e => {
        if (e.target.closest('[data-close]')) {
            mailModal.hidden = true;
        }
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !mailModal.hidden) mailModal.hidden = true;
    });

    mailCommittee.addEventListener('change', refreshSendButton);
    mailRecipients.addEventListener('input', parseRecipients);

    function parseRecipients() {
        const lines = mailRecipients.value.split('\n').map(l => l.trim()).filter(Boolean);
        const ok = [];
        const bad = [];
        for (const line of lines) {
            const sep = line.includes(',') ? ',' : (line.includes('\t') ? '\t' : ',');
            const parts = line.split(sep).map(s => s.trim());
            if (parts.length < 2) { bad.push(line); continue; }
            const name = parts[0];
            const email = parts[parts.length - 1].toLowerCase();
            if (!name || !email.includes('@') || !email.includes('.')) { bad.push(line); continue; }
            ok.push({ ad_soyad: name, email });
        }
        if (lines.length === 0) {
            mailParseInfo.hidden = true;
            mailParseInfo.innerHTML = '';
        } else {
            const badHtml = bad.length
                ? '<ul class="bad">' + bad.map(b => `<li>Hatalı: ${escapeHtml(b)}</li>`).join('') + '</ul>'
                : '';
            mailParseInfo.innerHTML = `<div class="count">${ok.length} geçerli alıcı${bad.length ? `, ${bad.length} hatalı satır` : ''}</div>` + badHtml;
            mailParseInfo.hidden = false;
        }
        mailRecipients.dataset.parsed = JSON.stringify(ok);
        refreshSendButton();
    }

    function refreshSendButton() {
        const com = mailCommittee.value;
        const parsed = JSON.parse(mailRecipients.dataset.parsed || '[]');
        mailSendBtn.disabled = !com || parsed.length === 0;
    }

    mailForm.addEventListener('submit', async e => {
        e.preventDefault();
        const com = mailCommittee.value;
        const tarih = mailDate.value.trim();
        const duzeltme = mailDuzeltme.checked;
        if (!com || !tarih) return;

        const kisiler = JSON.parse(mailRecipients.dataset.parsed || '[]');
        if (kisiler.length === 0) return;

        const onay = confirm(
            `${duzeltme ? 'DÜZELTME maili' : 'Kabul maili'} ${kisiler.length} kişiye gönderilecek\n` +
            `Komite: ${com}\nSon tarih: ${tarih}\n\nDevam edilsin mi?`
        );
        if (!onay) return;

        mailSendBtn.disabled = true;
        mailSendBtn.textContent = 'Gönderiliyor...';
        mailResult.hidden = true;

        try {
            const fnUrl = `${cfg.SUPABASE_URL}/functions/v1/send-kabul-mail`;
            const r = await fetch(fnUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cfg.SUPABASE_ANON_KEY}`,
                    'apikey': cfg.SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                    p_staff_code: staffPin,
                    komite: com,
                    sonTarih: tarih,
                    duzeltme,
                    kisiler
                })
            });
            const data = await r.json();
            if (!r.ok || data.error) throw new Error(data.error || `HTTP ${r.status}`);
            const failHtml = data.fails && data.fails.length
                ? '<ul>' + data.fails.map(f => `<li>${escapeHtml(f.name)} (${escapeHtml(f.email || '—')}): ${escapeHtml(f.reason)}</li>`).join('') + '</ul>'
                : '';
            const okClass = data.failed === 0 ? 'ok' : (data.sent > 0 ? 'warn' : 'err');
            mailResult.className = 'mail-modal__result ' + okClass;
            mailResult.innerHTML = `<strong>${data.sent}</strong> mail gönderildi, <strong>${data.failed}</strong> başarısız.${failHtml}`;
            mailResult.hidden = false;
        } catch (err) {
            mailResult.className = 'mail-modal__result err';
            mailResult.innerHTML = `<strong>Hata:</strong> ${escapeHtml(err.message || String(err))}`;
            mailResult.hidden = false;
        } finally {
            mailSendBtn.disabled = false;
            mailSendBtn.textContent = 'Gönder';
        }
    });

    // ========== veri ==========
    async function enterPanel() {
        await loadCards();
        body.className = 'view-content';
        contentEl.hidden = false;
        renderTable();
    }

    async function loadCards() {
        const { data, error } = await supabase.rpc('list_cards', { p_staff_code: staffPin });
        if (error) throw error;
        allCards = data || [];
        populateCommitteeFilter();
        updateSummary();
    }

    function populateCommitteeFilter() {
        const committees = [...new Set(allCards.map(c => c.committee).filter(Boolean))].sort((a, b) =>
            a.localeCompare(b, 'tr')
        );
        const current = committeeFilter.value;
        committeeFilter.innerHTML = '<option value="">Tüm komiteler</option>' +
            committees.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
        if (committees.includes(current)) committeeFilter.value = current;
    }

    function updateSummary() {
        const total = allCards.length;
        const used  = allCards.filter(c => c.last_redeemed_at).length;
        const revoked = allCards.filter(c => c.revoked_at).length;
        summaryEl.textContent = `${total} kart kişiye atanmış · ${used} en az bir kez geçiş yaptı · ${revoked} iptal`;
    }

    // ========== render ==========
    function renderTable() {
        const q = searchInput.value.trim().toLowerCase();
        const com = committeeFilter.value;
        const stat = statusFilter.value;

        const filtered = allCards.filter(c => {
            if (com && c.committee !== com) return false;
            if (stat === 'used'    && !c.last_redeemed_at) return false;
            if (stat === 'unused'  && c.last_redeemed_at)  return false;
            if (stat === 'revoked' && !c.revoked_at)        return false;
            if (q) {
                const hay = `${c.short_code} ${c.name || ''} ${c.email || ''} ${c.committee || ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });

        emptyMsg.hidden = filtered.length > 0;
        tbody.innerHTML = filtered.map(rowHtml).join('');
    }

    function rowHtml(c) {
        const status = c.revoked_at ? 'revoked'
                     : c.last_redeemed_at ? 'ok'
                     : 'idle';
        const badge = status === 'revoked' ? '<span class="badge badge--revoked">İptal</span>'
                    : status === 'ok'      ? '<span class="badge badge--ok">Geçti</span>'
                    :                        '<span class="badge badge--idle">Bekliyor</span>';
        const last = c.last_redeemed_at ? humanDateTime(c.last_redeemed_at) : '<span class="em">—</span>';
        const qrSrc = `/yemekqrkodlari/png/card-${c.short_code}-kahvalti.png`;
        const qrAlt = `${c.name || c.short_code} QR`;
        return `<tr>
            <td>${escapeHtml(c.short_code)}</td>
            <td class="qr-cell"><img class="qr-thumb" src="${qrSrc}" alt="${escapeAttr(qrAlt)}" loading="lazy" data-code="${escapeAttr(c.short_code)}" data-name="${escapeAttr(c.name || '')}"></td>
            <td>${escapeHtml(c.name || '—')}</td>
            <td>${c.email ? escapeHtml(c.email) : '<span class="em">—</span>'}</td>
            <td class="committee-cell">${escapeHtml(c.committee || '—')}</td>
            <td class="cnt">${c.redemption_count || 0}</td>
            <td>${last}</td>
            <td>${badge}</td>
        </tr>`;
    }

    // Click to zoom QR
    const qrModal      = document.getElementById('qrModal');
    const qrModalImg   = document.getElementById('qrModalImg');
    const qrModalCap   = document.getElementById('qrModalCaption');
    tbody.addEventListener('click', e => {
        const img = e.target.closest('.qr-thumb');
        if (!img) return;
        qrModalImg.src = img.src;
        qrModalImg.alt = img.alt;
        qrModalCap.textContent = `Kart ${img.dataset.code} — ${img.dataset.name || ''}`;
        qrModal.classList.add('is-open');
        qrModal.setAttribute('aria-hidden', 'false');
    });
    qrModal.addEventListener('click', () => {
        qrModal.classList.remove('is-open');
        qrModal.setAttribute('aria-hidden', 'true');
        qrModalImg.src = '';
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && qrModal.classList.contains('is-open')) {
            qrModal.click();
        }
    });

    // ========== csv export ==========
    function exportCsv() {
        const head = ['kart_no', 'ad_soyad', 'email', 'komite', 'gecis_sayisi', 'son_gecis', 'durum'];
        const rows = allCards.map(c => [
            c.short_code, c.name || '', c.email || '', c.committee || '',
            c.redemption_count || 0,
            c.last_redeemed_at || '',
            c.revoked_at ? 'iptal' : (c.last_redeemed_at ? 'gecti' : 'bekliyor')
        ]);
        const csv = '﻿' + [head, ...rows].map(r =>
            r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        a.href = url; a.download = `mfl-fbc26-kartlar-${ts}.csv`;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
    }

    // ========== utils ==========
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function escapeAttr(s) { return escapeHtml(s); }
    function humanDateTime(t) {
        if (!t) return '';
        const d = new Date(t);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${dd}.${mm} ${hh}:${mi}`;
    }
})();
