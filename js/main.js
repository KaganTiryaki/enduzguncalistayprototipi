/* ==================== PRELOADER ==================== */
(function preloader() {
    const fill = document.getElementById('preloaderFill');
    const pct = document.getElementById('preloaderPct');
    const pre = document.getElementById('preloader');
    if (!pre) return;

    const imgs = Array.from(document.images);
    let loaded = 0;
    const total = Math.max(imgs.length, 1);

    function update() {
        const p = Math.round((loaded / total) * 100);
        if (fill) fill.style.width = p + '%';
        if (pct) pct.textContent = p + '%';
    }

    imgs.forEach(img => {
        if (img.complete) {
            loaded++;
        } else {
            img.addEventListener('load', () => { loaded++; update(); }, { once: true });
            img.addEventListener('error', () => { loaded++; update(); }, { once: true });
        }
    });
    update();

    function finish() {
        if (pre.classList.contains('is-hidden')) return;
        if (fill) fill.style.width = '100%';
        if (pct) pct.textContent = '100%';
        setTimeout(() => {
            pre.classList.add('is-hidden');
            document.body.classList.remove('is-loading');
            window.dispatchEvent(new Event('preloader:done'));
        }, 350);
    }

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish);

    // Hard fallback — never gate longer than 6s even if an asset hangs.
    setTimeout(finish, 6000);
})();

/* ==================== GOOGLE FORMS LINK ==================== */
const GOOGLE_FORMS_URL = 'https://docs.google.com/forms/d/1ZZhDnKlnY8I3jcgfbBd72_pR7xphhxl4y2pHaWWI3jI/viewform?edit_requested=true';

document.querySelectorAll('#applyBtnNav, #applyBtnHero, #applyBtnMobile').forEach(btn => {
    btn.href = GOOGLE_FORMS_URL;
});

/* ==================== NAVBAR SCROLL EFFECT ==================== */
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
});

/* ==================== MOBILE MENU ==================== */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

function openNav() {
    hamburger.classList.add('active');
    mobileMenu.classList.add('active');
    document.body.classList.add('menu-open');
    hamburger.setAttribute('aria-expanded', 'true');
}

function closeNav() {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.classList.remove('menu-open');
    hamburger.setAttribute('aria-expanded', 'false');
}

hamburger.addEventListener('click', () => {
    if (mobileMenu.classList.contains('active')) closeNav();
    else openNav();
});

document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', closeNav);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) closeNav();
});

// Outside-tap: drawer is full-width on mobile, so a click on the menu's own
// background (outside the .mobile-links list) closes it.
mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeNav();
});

/* ==================== SMOOTH SCROLL ==================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        e.preventDefault();
        const target = document.querySelector(targetId);
        if (target) {
            const navHeight = navbar.offsetHeight;
            const targetPosition = target.offsetTop - navHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
    });
});

/* ==================== ACTIVE NAV LINK ==================== */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

/* ==================== COUNTDOWN TIMER ==================== */
const targetDate = new Date('2026-05-09T09:00:00').getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
        document.getElementById('countdown').innerHTML = '<p class="countdown-ended">Etkinlik başladı!</p>';
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* ==================== FAQ ACCORDION ==================== */
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const isOpen = button.getAttribute('aria-expanded') === 'true';

        // Close all
        document.querySelectorAll('.faq-question').forEach(btn => {
            btn.setAttribute('aria-expanded', 'false');
            btn.parentElement.classList.remove('active');
        });

        // Open clicked (if it was closed)
        if (!isOpen) {
            button.setAttribute('aria-expanded', 'true');
            button.parentElement.classList.add('active');
        }
    });
});

/* ==================== SCROLL REVEAL ANIMATIONS ==================== */
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

revealElements.forEach(el => revealObserver.observe(el));

/* ==================== STAT COUNTER ANIMATION ==================== */
const statNumbers = document.querySelectorAll('.stat-number[data-target]');

const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.target);
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const counter = setInterval(() => {
                current += step;
                if (current >= target) {
                    el.textContent = target;
                    clearInterval(counter);
                } else {
                    el.textContent = Math.floor(current);
                }
            }, 16);

            statObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

/* ==================== COMMITTEE DETAIL PANEL ==================== */
const COMMITTEE_DATA = {
    'C/01': {
        title: 'Kuantum Fiziği',
        tagline: 'Süperpozisyondan dolanıklığa, kuantum hesaplamadan iletişime — atom altı dünyanın kurallarına bakış.',
        topics: ['Kuantum mekaniği temelleri', 'Süperpozisyon ve dolanıklık', 'Kuantum hesaplama (qubit, kapı mantığı)', 'Kuantum iletişim ve güvenlik'],
        learn: ['Klasik sezginin neden bozulduğunu', 'Kuantum algoritmaların gücünü', 'Güncel kuantum teknoloji uygulamalarını', 'Türkiye\'deki araştırma ekosistemini'],
        speakers: [
            { name: 'Onur Pusuluk', inst: 'Kadir Has Üniversitesi', focus: 'Kuantum mekaniği & termodinamik araştırmacısı' },
            { name: 'İnanç Kanık', inst: 'Radarsan', focus: 'Radar/algılamada kuantum uygulamaları' },
            { name: 'Elif Yunt', inst: 'Türk Alman Üniversitesi', focus: 'Kuantum fiziği teorik temelleri' }
        ]
    },
    'C/02': {
        title: 'Nöropsikoloji',
        tagline: 'Beynin biyolojisi ile zihnin süreçleri arasındaki köprü: davranış, bilinç ve bozuklukların nörobilimsel temelleri.',
        topics: ['Beyin bölgeleri ve fonksiyonları', 'Bilişsel süreçler: algı, dikkat, bellek', 'Nörolojik bozukluklar', 'Bilinç ve karar verme'],
        learn: ['Beynin davranışı nasıl şekillendirdiğini', 'Bilişsel süreçlerin biyolojik temelini', 'Modern nörogörüntüleme tekniklerini', 'Psikoloji ile sinirbilim arasındaki bağları'],
        speakers: [
            { name: 'Havva Demir', inst: 'İstanbul Üniversitesi', focus: 'Nöropsikoloji klinik ve akademik araştırmacı' }
        ]
    },
    'C/03': {
        title: 'Yapay Zekâ, Veri & Doğal Dil İşleme',
        tagline: 'Makine öğrenmesinden dil modellerine, veri biliminden üretken yapay zekâya.',
        topics: ['Makine öğrenmesi temelleri', 'Büyük dil modelleri (LLM)', 'Doğal dil işleme (NLP)', 'Veri etiği ve önyargı'],
        learn: ['Bir modelin nasıl eğitildiğini', 'Dil modellerinin içeriden nasıl çalıştığını', 'Gerçek dünya NLP uygulamalarını', 'Yapay zekânın etik sınırlarını'],
        speakers: [
            { name: 'Mehmet Ali Bayram', inst: 'Yeditepe Üniversitesi', focus: 'Yapay zekâ & veri bilimi akademisyeni' },
            { name: 'Emre Gül', inst: 'Fi-Product', focus: 'NLP & yapay zekâ ürün geliştirici' },
            { name: 'Melis Dünya Sezer Gül', inst: 'Fi-Product', focus: 'Yapay zekâ ürün tasarımı' }
        ]
    },
    'C/04': {
        title: 'Uçak ve Havacılık',
        tagline: 'Aerodinamikten modern hava araçlarının tasarımına ve sürdürülebilir havacılığa uzanan mühendislik zinciri.',
        topics: ['Aerodinamik prensipler', 'Uçak tasarımı ve yapısal analiz', 'Uçuş sistemleri ve aviyonik', 'Sürdürülebilir havacılık ve uzay teknolojileri'],
        learn: ['Bir uçağın nasıl havalandığını', 'Mühendislik optimizasyonunun gücünü', 'Havacılık sektörünün yol haritasını', 'Türkiye\'nin havacılık ekosistemini'],
        speakers: [
            { name: 'Serhan Kök', inst: 'Maltepe Kadir Has BİLSEM', focus: 'Havacılık eğitimi & uygulamalı çalışma' },
            { name: 'Dr. Caner Şentürk', inst: 'İstanbul Beykoz Üniversitesi', focus: 'Havacılık mühendisliği akademisyeni' }
        ]
    },
    'C/05': {
        title: 'Moleküler Biyoloji & Genetik',
        tagline: 'DNA\'dan CRISPR\'a, gen ifadesinden biyoteknolojinin en taze uygulamalarına.',
        topics: ['DNA, RNA ve protein sentezi', 'Gen düzenleme (CRISPR-Cas9)', 'Genetik hastalıklar ve tanı', 'Biyoteknoloji uygulamaları'],
        learn: ['Genin bilgiden proteine yolculuğunu', 'CRISPR\'ın nasıl çalıştığını', 'Tıpta genetik devrimin boyutlarını', 'Biyoetik tartışmaların temellerini'],
        speakers: [
            { name: 'Necla Birgül-Iyison', inst: 'Boğaziçi Üniversitesi', focus: 'Moleküler biyoloji & genetik araştırmacısı' },
            { name: 'Yelda Özden Çiftçi', inst: 'Gebze Teknik Üniversitesi', focus: 'Moleküler biyoloji & genetik akademisyeni' },
            { name: 'Ercan Arıcan', inst: 'İstanbul Üniversitesi', focus: 'Moleküler biyoloji & genetik araştırmacısı' },
            { name: 'Gül Çiçek Kılıç', inst: 'Gebze Teknik Üniversitesi', focus: 'Moleküler biyoloji & biyoteknoloji' },
            { name: 'Işık Ertekin', inst: 'Şişli Terakki', focus: 'Biyoloji eğitimi & genetik' }
        ]
    },
    'C/06': {
        title: 'Adli Bilimler, Kriminalistik & Toksikoloji',
        tagline: 'DNA analizinden olay yeri incelemesine, toksikolojiden delil hukukuna.',
        topics: ['DNA ve biyolojik delil analizi', 'Olay yeri inceleme yöntemleri', 'Toksikoloji ve zehir bilimi', 'Adli delilin hukuki geçerliliği'],
        learn: ['Bir delilin mahkemeye nasıl ulaştığını', 'Adli bilim tekniklerinin sınırlarını', 'Toksikolojik analizin prensiplerini', 'Bilim ile hukukun kesiştiği noktaları'],
        speakers: [
            { name: 'Miraç Özdemir', inst: 'İstanbul Gelişim Üniversitesi', focus: 'Adli bilimler & toksikoloji akademisyeni' },
            { name: 'Av. Ece Ertuğ Özkara', inst: 'Serbest Avukat', focus: 'Adli delil & hukuk pratiği' }
        ]
    },
    'C/07': {
        title: 'Akıllı Sistemler & Mühendislik',
        tagline: 'Robotik, otomasyon, gömülü sistemler ve Endüstri 4.0\'ın şekillendirdiği mühendislik.',
        topics: ['Robotik ve otonom sistemler', 'Gömülü sistemler ve IoT', 'Endüstri 4.0 ve otomasyon', 'İnsan-makine etkileşimi'],
        learn: ['Bir robotun nasıl karar verdiğini', 'Sensör-aktüatör döngüsünü', 'Akıllı fabrika mimarisini', 'Mühendislik kariyerinin yol haritasını'],
        speakers: [
            { name: 'Ali Buldu', inst: 'Marmara Üniversitesi', focus: 'Akıllı sistemler & mühendislik akademisyeni' },
            { name: 'Mehmet Kaan İldiz', inst: 'Üsküdar Üniversitesi', focus: 'Mühendislik & gömülü sistemler' }
        ]
    }
};

const committeeModal = document.getElementById('committeeModal');
if (committeeModal) {
    const symbolEl = committeeModal.querySelector('.committee-modal__symbol');
    const numEl = committeeModal.querySelector('.committee-modal__num');
    const titleEl = committeeModal.querySelector('.committee-modal__title');
    const taglineEl = committeeModal.querySelector('.committee-modal__tagline');
    const topicsEl = committeeModal.querySelector('.committee-modal__topics');
    const learnEl = committeeModal.querySelector('.committee-modal__learn');
    const speakersEl = committeeModal.querySelector('.committee-modal__speakers');

    function openCommittee(key, sourceCard) {
        const data = COMMITTEE_DATA[key];
        if (!data) return;

        // Clone the card's SVG icon for the themed opening animation
        symbolEl.innerHTML = '';
        const cardSvg = sourceCard?.querySelector('.committee__icon svg');
        if (cardSvg) {
            const clone = cardSvg.cloneNode(true);
            clone.removeAttribute('width');
            clone.removeAttribute('height');
            symbolEl.appendChild(clone);
            // Compute stroke length per element for clean draw-in animation
            requestAnimationFrame(() => {
                clone.querySelectorAll('path, circle, rect, ellipse, line, polyline, polygon').forEach(el => {
                    try {
                        const len = el.getTotalLength ? el.getTotalLength() : 300;
                        el.style.strokeDasharray = len;
                        el.style.strokeDashoffset = len;
                        el.style.opacity = '0';
                    } catch (_) { /* noop */ }
                });
            });
        } else {
            const baseImg = sourceCard?.querySelector('.committee__icon-img--base');
            const overlayImg = sourceCard?.querySelector('.committee__icon-img--overlay');
            if (baseImg && overlayImg) {
                const baseClone = baseImg.cloneNode(true);
                baseClone.className = 'committee-modal__symbol-img committee-modal__symbol-img--base';
                baseClone.setAttribute('alt', '');
                const overlayClone = overlayImg.cloneNode(true);
                overlayClone.className = 'committee-modal__symbol-img committee-modal__symbol-img--overlay';
                overlayClone.setAttribute('alt', '');
                symbolEl.appendChild(baseClone);
                symbolEl.appendChild(overlayClone);
            }
        }

        // Mark the active card so its icon swap state reflects the opened modal
        document.querySelectorAll('.committee.is-active').forEach(c => c.classList.remove('is-active'));
        sourceCard?.classList.add('is-active');

        numEl.textContent = key;
        titleEl.textContent = data.title;
        taglineEl.textContent = data.tagline;
        topicsEl.innerHTML = data.topics.map(t => `<li>${t}</li>`).join('');
        learnEl.innerHTML = data.learn.map(l => `<li>${l}</li>`).join('');
        speakersEl.innerHTML = data.speakers.map(s => `
            <div class="speaker-highlight">
                <span class="speaker-highlight__name">${s.name}</span>
                <span class="speaker-highlight__inst">${s.inst}</span>
                <span class="speaker-highlight__focus">${s.focus}</span>
            </div>
        `).join('');

        committeeModal.hidden = false;
        document.body.classList.add('modal-open');
        // Force reflow so animations trigger
        // eslint-disable-next-line no-unused-expressions
        committeeModal.offsetHeight;
        committeeModal.classList.add('is-open');
        const sig = sourceCard?.getAttribute('data-signature');
        window.dispatchEvent(new CustomEvent('committee-modal:opened', { detail: { key, sig } }));
    }

    function closeCommittee() {
        committeeModal.classList.remove('is-open');
        document.body.classList.remove('modal-open');
        document.querySelectorAll('.committee.is-active, .committee-slide.is-active').forEach(c => c.classList.remove('is-active'));
        setTimeout(() => {
            committeeModal.hidden = true;
            symbolEl.innerHTML = '';
        }, 400);
        window.dispatchEvent(new CustomEvent('committee-modal:closed'));
    }

    committeeModal.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) closeCommittee();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !committeeModal.hidden) closeCommittee();
    });

    // Expose for carousel integration (new experimental committees section)
    window.openCommitteeModal = openCommittee;

    // Swipe-down to close (mobile). Touch events only fire on touch devices,
    // so this is a no-op on desktop without a separate guard.
    const swipePanel = committeeModal.querySelector('.committee-modal__panel');
    let touchStartY = 0;
    let touchStartTime = 0;
    let dragging = false;

    swipePanel.addEventListener('touchstart', (e) => {
        if (!committeeModal.classList.contains('is-open')) return;
        touchStartY = e.touches[0].clientY;
        touchStartTime = performance.now();
        dragging = true;
        swipePanel.style.transition = 'none';
    }, { passive: true });

    swipePanel.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        const delta = e.touches[0].clientY - touchStartY;
        if (delta < 0) return; // ignore upward drag
        swipePanel.style.transform = `translateY(${delta}px)`;
    }, { passive: true });

    swipePanel.addEventListener('touchend', (e) => {
        if (!dragging) return;
        dragging = false;
        const delta = e.changedTouches[0].clientY - touchStartY;
        const elapsed = performance.now() - touchStartTime;
        const velocity = delta / Math.max(elapsed, 1);
        swipePanel.style.transition = '';
        if (delta > 80 || velocity > 0.5) {
            closeCommittee();
            setTimeout(() => { swipePanel.style.transform = ''; }, 450);
        } else {
            swipePanel.style.transform = '';
        }
    }, { passive: true });

    // Legacy card binding kept for any non-carousel .committee cards still in DOM
    document.querySelectorAll('.committee:not(.committee--cta)').forEach(card => {
        const num = card.querySelector('.committee__num')?.textContent?.trim();
        if (!num) return;
        card.addEventListener('click', () => openCommittee(num, card));
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openCommittee(num, card);
            }
        });
    });
}

/* ==================== CARD 3D TILT + TAP BURST ==================== */
const tiltSelector = '.committee, .committee-card, .activity-card, .team-card, .subteam-card, .sponsor-card, .vm-card, .info-card, .past-card, .eventinfo-program, .eventinfo-map';
const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

document.querySelectorAll(tiltSelector).forEach(card => {
    if (hasFinePointer) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rx = (y - 0.5) * -14;
            const ry = (x - 0.5) * 14;
            card.style.setProperty('--rx', `${rx}deg`);
            card.style.setProperty('--ry', `${ry}deg`);
            card.style.setProperty('--mx', `${x * 100}%`);
            card.style.setProperty('--my', `${y * 100}%`);
            card.classList.add('hover-tilt');
            window.dispatchEvent(new CustomEvent('card-hover', {
                detail: { x: e.clientX, y: e.clientY, active: true }
            }));
        });
        card.addEventListener('mouseleave', () => {
            card.style.removeProperty('--rx');
            card.style.removeProperty('--ry');
            card.classList.remove('hover-tilt');
            window.dispatchEvent(new CustomEvent('card-hover', {
                detail: { x: 0, y: 0, active: false }
            }));
        });
        card.addEventListener('mouseenter', (e) => {
            window.dispatchEvent(new CustomEvent('card-enter', {
                detail: { x: e.clientX, y: e.clientY }
            }));
        });
    } else {
        // Touch devices: tap → burst spark at touch point (mouse-follower orb is
        // skipped on mobile inside three-scene.js)
        card.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            if (!t) return;
            window.dispatchEvent(new CustomEvent('card-enter', {
                detail: { x: t.clientX, y: t.clientY }
            }));
        }, { passive: true });
    }
});

/* ==================== PROGRAM TABS ==================== */
document.querySelectorAll('[data-tabs]').forEach(root => {
    const tabs = root.querySelectorAll('.program__tab');
    const panels = root.querySelectorAll('.program__panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => {
                const active = t === tab;
                t.classList.toggle('is-active', active);
                t.setAttribute('aria-selected', active ? 'true' : 'false');
                t.setAttribute('tabindex', active ? '0' : '-1');
            });

            panels.forEach(panel => {
                const active = panel.id === target;
                panel.classList.toggle('is-active', active);
                if (active) panel.removeAttribute('hidden');
                else panel.setAttribute('hidden', '');
            });
        });
    });
});

statNumbers.forEach(el => statObserver.observe(el));

/* ==================== IMAGE LIGHTBOX ==================== */
(function lightbox() {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const cap = document.getElementById('lightboxCaption');
    const btn = document.getElementById('lightboxClose');
    if (!lb || !img || !btn) return;

    function open(src, alt) {
        img.src = src;
        img.alt = alt || '';
        cap.textContent = alt || '';
        lb.classList.add('is-open');
        lb.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightbox-open');
    }

    function close() {
        lb.classList.remove('is-open');
        lb.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lightbox-open');
        setTimeout(() => { img.src = ''; }, 300);
    }

    document.addEventListener('click', (e) => {
        const z = e.target.closest('.zoomable');
        if (!z || z.tagName !== 'IMG') return;
        e.preventDefault();
        open(z.currentSrc || z.src, z.alt);
    });
    btn.addEventListener('click', close);
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lb.classList.contains('is-open')) close();
    });
})();

/* ==================== SCROLL PROGRESS BAR ==================== */
(function scrollProgress() {
    const fill = document.getElementById('scrollProgressFill');
    if (!fill) return;
    let raf = 0;
    function tick() {
        raf = 0;
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const p = h > 0 ? (window.scrollY / h) * 100 : 0;
        fill.style.width = Math.min(100, Math.max(0, p)) + '%';
    }
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
    window.addEventListener('resize', tick);
    tick();
})();
