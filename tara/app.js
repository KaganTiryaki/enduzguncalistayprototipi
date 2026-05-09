// MFL FBÇ '26 — staff scanner
// Akış:
//   1) Gate: ortak PIN sessionStorage'a kaydet
//   2) Scanner: getUserMedia HD stream + dual-decoder loop
//      Layer 1: BarcodeDetector (iOS 16+ Safari, Android Chrome — native, en hızlı)
//      Layer 2: jsQR (saf JS, küçük + dot-stilde QR'larda iyi, inversionAttempts=attemptBoth)
//      requestAnimationFrame loop, qrbox kısıtı yok, tüm frame taranır.
//   3) Result overlay 1.5s → yeniden tarama
//   4) Network hatası → localStorage outbox → otomatik replay

(() => {
    'use strict';

    const cfg = window.MFL_TARA_CONFIG || {};
    if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes('CHANGE-ME')) {
        alert('config.js içinde SUPABASE_URL ve SUPABASE_ANON_KEY ayarlanmamış.');
    }

    const supabase = window.supabase
        ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
        : null;

    const RESULT_DURATION_MS = 1500;
    const SCAN_LOCKOUT_MS    = 4000;
    const REDEEM_TIMEOUT_MS  = 6000;
    const OUTBOX_KEY         = 'mfl-tara-outbox';
    const OUTBOX_MAX         = 500;
    const OUTBOX_WARN_AT     = 400;
    const PIN_KEY            = 'mfl-tara-pin';

    const body          = document.body;
    const gateForm      = document.getElementById('gateForm');
    const staffInput    = document.getElementById('staffCodeInput');
    const gateHata      = document.getElementById('gateHata');
    const scannerDayEl  = document.getElementById('scannerDay');
    const logoutBtn     = document.getElementById('logoutBtn');
    const cameraHint    = document.getElementById('cameraHint');
    const scanLog       = document.getElementById('scanLog');
    const resultEl      = document.getElementById('result');
    const resultIcon    = document.getElementById('resultIcon');
    const resultTitle   = document.getElementById('resultTitle');
    const resultSub     = document.getElementById('resultSub');

    let staffPin    = sessionStorage.getItem(PIN_KEY) || '';
    let recentScans = new Map();
    let mediaStream = null;
    let videoEl     = null;
    let scanning    = false;
    let resultTimer = 0;

    if (staffPin) {
        enterScanner();
    } else {
        body.className = 'view-gate';
    }

    gateForm.addEventListener('submit', async e => {
        e.preventDefault();
        const code = staffInput.value.trim();
        if (!code) return;
        const submitBtn = gateForm.querySelector('button[type="submit"]');
        const oldText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Doğrulanıyor...'; }
        gateHata.hidden = true;
        try {
            const { data, error } = await supabase.rpc('lookup_short_code', {
                p_short_code: 'PINCHECK',
                p_staff_code: code
            });
            if (error) throw error;
            if (data?.status === 'invalid_staff') {
                gateHata.textContent = 'PIN hatalı.';
                gateHata.hidden = false;
                staffInput.select();
                return;
            }
            staffPin = code;
            sessionStorage.setItem(PIN_KEY, code);
            enterScanner();
        } catch (err) {
            console.error('PIN doğrulama hatası', err);
            gateHata.textContent = 'Bağlantı hatası: ' + (err.message || err);
            gateHata.hidden = false;
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = oldText; }
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem(PIN_KEY);
        staffPin = '';
        stopScanner();
        body.className = 'view-gate';
        staffInput.value = '';
        staffInput.focus();
    });

    window.addEventListener('online', drainOutbox);

    async function enterScanner() {
        body.className = 'view-scanner';
        await fetchTodayLabel();
        drainOutbox();
        await startCamera();
    }

    async function fetchTodayLabel() {
        if (!supabase) return;
        try {
            const { data, error } = await supabase.rpc('today_event_day');
            if (error) throw error;
            scannerDayEl.textContent = humanDate(data);
        } catch {
            scannerDayEl.textContent = 'Tarih alınamadı';
        }
    }

    async function startCamera() {
        scanning = true;
        cameraHint.textContent = 'Kamera başlatılıyor…';

        const reader = document.getElementById('qrReader');
        reader.innerHTML = '';

        const video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.setAttribute('autoplay', '');
        video.muted = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        reader.appendChild(video);
        videoEl = video;

        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width:  { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            video.srcObject = mediaStream;
            await video.play();
            const settings = mediaStream.getVideoTracks()[0]?.getSettings?.() || {};
            console.log('[scanner] camera streaming', settings.width + 'x' + settings.height);
            cameraHint.textContent = 'QR’ı çerçeveye getir';
        } catch (err) {
            cameraHint.textContent = 'Kamera açılamadı: ' + (err.message || err);
            console.error('[scanner] getUserMedia failed:', err);
            return;
        }

        const detector = ('BarcodeDetector' in window)
            ? new window.BarcodeDetector({ formats: ['qr_code'] })
            : null;
        const hasJsQR = typeof window.jsQR === 'function';
        console.log('[scanner] decoders — BarcodeDetector:', !!detector, 'jsQR:', hasJsQR);

        if (!detector && !hasJsQR) {
            cameraHint.textContent = 'QR motoru yüklenemedi (jsQR + BarcodeDetector yok).';
            console.error('[scanner] hiçbir decoder yok!');
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        let frameCount = 0;
        let lastDetectorErrLog = 0;
        const startTs = Date.now();

        const tick = async () => {
            if (!scanning) return;
            if (video.readyState < 2 || video.videoWidth === 0) {
                requestAnimationFrame(tick);
                return;
            }
            frameCount++;
            let decoded = null;

            if (detector) {
                try {
                    const codes = await detector.detect(video);
                    if (codes && codes.length > 0) decoded = codes[0].rawValue;
                } catch (err) {
                    const now = Date.now();
                    if (now - lastDetectorErrLog > 5000) {
                        console.warn('[scanner] BarcodeDetector.detect threw:', err);
                        lastDetectorErrLog = now;
                    }
                }
            }

            if (!decoded && hasJsQR) {
                try {
                    canvas.width  = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = window.jsQR(img.data, img.width, img.height, {
                        inversionAttempts: 'attemptBoth'
                    });
                    if (code && code.data) decoded = code.data;
                } catch (err) {
                    if (frameCount === 1) console.warn('[scanner] jsQR error:', err);
                }
            }

            if (decoded) {
                console.log('[scanner] decoded:', decoded);
                handleDecoded(decoded);
            }

            if (frameCount % 120 === 0) {
                const fps = (frameCount / ((Date.now() - startTs) / 1000)).toFixed(1);
                console.log('[scanner] alive — frame ' + frameCount + ', ' + fps + ' fps');
            }

            if (scanning) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    function stopScanner() {
        scanning = false;
        if (mediaStream) {
            mediaStream.getTracks().forEach(t => t.stop());
            mediaStream = null;
        }
        if (videoEl) {
            try { videoEl.srcObject = null; } catch {}
            videoEl = null;
        }
        const reader = document.getElementById('qrReader');
        if (reader) reader.innerHTML = '';
    }

    function handleDecoded(raw) {
        if (!scanning) return;

        const parsed = parseQrUrl(raw);
        if (!parsed) {
            flashResult('error', '⚠', 'Tanınmayan QR', 'Bu kod sistemimize ait değil.');
            return;
        }
        const { cardId, meal } = parsed;

        const now = Date.now();
        cleanLockout(now);
        const lockKey = cardId + '|' + meal;
        if (recentScans.has(lockKey)) return;
        recentScans.set(lockKey, now + SCAN_LOCKOUT_MS);

        redeem(cardId, meal);
    }

    function parseQrUrl(raw) {
        try {
            const url = new URL(raw);
            const c = url.searchParams.get('c');
            if (!c || !/^[0-9a-f-]{36}$/i.test(c)) return null;
            return { cardId: c, meal: 'kahvalti' };
        } catch {
            return null;
        }
    }

    function cleanLockout(now) {
        for (const [k, exp] of recentScans) {
            if (exp <= now) recentScans.delete(k);
        }
    }

    async function redeem(cardId, meal) {
        scanning = false;
        try {
            const res = await callRedeem(cardId, meal);
            renderRedeem(res);
            logScan(res);
        } catch {
            queueOutbox({ cardId, meal, attemptedAt: Date.now() });
            flashResult('error', '⚠', 'Bağlantı hatası', 'Tarama kuyruğa alındı, internet gelince yeniden denenecek.');
            logScan({ status: 'error', short_code: cardId.slice(0, 4), meal });
        }
    }

    async function callRedeem(cardId, meal) {
        if (!supabase) throw new Error('supabase client yok');
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), REDEEM_TIMEOUT_MS);
        try {
            const { data, error } = await supabase.rpc('redeem_meal', {
                p_card_id:    cardId,
                p_meal:       meal,
                p_staff_code: staffPin,
                p_user_agent: navigator.userAgent
            }).abortSignal(ctrl.signal);
            if (error) throw error;
            return data;
        } finally {
            clearTimeout(timer);
        }
    }

    function renderRedeem(res) {
        const who = res.name ? res.name : `Kart ${res.short_code || '???'}`;
        const sub = (res.committee ? res.committee + ' · ' : '') + `Kart ${res.short_code || '???'}`;

        switch (res.status) {
            case 'ok':
                flashResult('ok', '✓', `GEÇİŞ — ${who}`, sub);
                vibrate(200);
                break;

            case 'cooldown': {
                const ago  = humanTime(res.last_at);
                flashResult('already_used', '✓',
                    `İÇERİDE — ${who}`,
                    `Az önce (${ago}) geçti, geçirebilirsin.`);
                vibrate([100, 80, 100]);
                break;
            }

            case 'already_used':
                flashResult('already_used', '✕', `ZATEN KULLANILDI — ${who}`,
                    `İlk geçiş: ${humanTime(res.first_redeemed_at)}`);
                vibrate([100, 80, 100]);
                break;

            case 'invalid_staff':
                flashResult('error', '🔒', 'PIN geçersiz', 'Çıkış yapıp doğru PIN\'i gir.');
                break;
            case 'unknown_card':
                flashResult('error', '?', 'Bilinmeyen kart', 'Bu kart sistemde kayıtlı değil.');
                break;
            case 'revoked':
                flashResult('error', '⛔', `İptal edilmiş — ${who}`, 'Bu yaka kartı iptal edilmiş, geçiş yok.');
                break;
            case 'out_of_window':
                flashResult('error', '⏰', `Etkinlik dışı — ${who}`,
                    `Sistem tarihi: ${humanDate(res.computed_day)}`);
                break;
            default:
                flashResult('error', '⚠', 'Beklenmeyen yanıt', JSON.stringify(res));
        }
    }

    function flashResult(state, icon, title, sub) {
        clearTimeout(resultTimer);
        resultEl.dataset.status = state;
        resultIcon.textContent  = icon;
        resultTitle.textContent = title;
        resultSub.textContent   = sub || '';
        resultEl.hidden = false;
        resultEl.offsetHeight;
        resultEl.dataset.state = 'visible';
        resultTimer = setTimeout(resetResult, RESULT_DURATION_MS);
    }
    function resetResult() {
        resultEl.dataset.state = '';
        setTimeout(() => {
            resultEl.hidden = true;
            scanning = true;
        }, 200);
    }

    function logScan(res) {
        const li = document.createElement('li');
        li.classList.add(res.status === 'ok' ? 'log--ok' :
                         res.status === 'already_used' ? 'log--used' :
                         'log--error');
        const time = humanTime(new Date());
        const code = res.short_code || '???';
        const meal = res.meal === 'kahvalti' ? 'KAH' : res.meal === 'ogle' ? 'OGL' : '—';
        const tag  = res.status === 'ok' ? '✓ geçiş' :
                     res.status === 'already_used' ? '✕ kullanılmış' :
                     `! ${res.status}`;
        li.innerHTML = `<span>${time}</span><span>${code}</span><span>${meal}</span><span>${tag}</span>`;
        scanLog.prepend(li);
        while (scanLog.children.length > 20) scanLog.lastElementChild.remove();
    }

    function readOutbox() {
        try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); }
        catch { return []; }
    }
    function writeOutbox(arr) {
        localStorage.setItem(OUTBOX_KEY, JSON.stringify(arr.slice(-OUTBOX_MAX)));
    }
    function queueOutbox(entry) {
        const ob = readOutbox();
        ob.push(entry);
        writeOutbox(ob);
        if (ob.length >= OUTBOX_MAX) {
            flashResult('error', '⚠️', 'KUYRUK DOLDU',
                `${OUTBOX_MAX}+ offline tarama bekliyor — internet sağlanana kadar yeni taramalar kaydedilemeyebilir.`);
        } else if (ob.length === OUTBOX_WARN_AT) {
            flashResult('error', '⚠️', 'OFFLINE — kuyruk doluyor',
                `${ob.length} tarama bekliyor, internet kontrol et.`);
        }
    }
    async function drainOutbox() {
        if (!navigator.onLine || !supabase) return;
        const ob = readOutbox();
        if (ob.length === 0) return;
        const remaining = [];
        for (const item of ob) {
            try {
                const r = await callRedeem(item.cardId, item.meal);
                if (r.status === 'ok' || r.status === 'already_used') continue;
                remaining.push(item);
            } catch {
                remaining.push(item);
                break;
            }
        }
        writeOutbox(remaining);
    }

    function humanDate(d) {
        if (!d) return '—';
        const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
        const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                        'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    function humanTime(t) {
        if (!t) return '--:--';
        const date = typeof t === 'string' ? new Date(t) : t;
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }
    function vibrate(p) {
        try { navigator.vibrate && navigator.vibrate(p); } catch {}
    }
})();
