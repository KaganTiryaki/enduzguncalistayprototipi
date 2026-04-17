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

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.classList.toggle('menu-open');
});

document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
    });
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
        tagline: 'Atom altı dünyanın kuralları klasik fiziğe meydan okuyor. Süperpozisyon, dolanıklık ve belirsizlik ilkesinden kuantum hesaplamaya uzanan yolculuğa katılın.',
        topics: ['Kuantum mekaniği temelleri', 'Süperpozisyon ve dolanıklık', 'Kuantum hesaplama (qubit, kapı mantığı)', 'Kuantum iletişim ve güvenlik'],
        learn: ['Klasik sezginin neden bozulduğunu', 'Kuantum algoritmaların gücünü', 'Güncel kuantum teknoloji uygulamalarını', 'Türkiye\'deki araştırma ekosistemini'],
        speakers: [
            { name: 'Onur Pusuluk', inst: 'Kadir Has Üniversitesi', focus: 'Kuantum mekaniği ve termodinamiği alanında araştırmalar yürütüyor.' },
            { name: 'İnanç Kanık', inst: 'Radarsan', focus: 'Radar ve algılama sistemlerinde kuantum prensiplerinin endüstriyel uygulaması üzerine çalışıyor.' },
            { name: 'Elif Yunt', inst: 'Türk Alman Üniversitesi', focus: 'Kuantum fiziğinin teorik temelleri ve güncel araştırma alanları üzerine çalışıyor.' }
        ]
    },
    'C/02': {
        title: 'Nöropsikoloji',
        tagline: 'Beynin biyolojik yapısı ile zihnin süreçleri arasındaki köprüyü inceleyeceğiz. Davranış, bilinç ve bozuklukların nörobilimsel temellerine odaklanacağız.',
        topics: ['Beyin bölgeleri ve fonksiyonları', 'Bilişsel süreçler: algı, dikkat, bellek', 'Nörolojik bozukluklar', 'Bilinç ve karar verme'],
        learn: ['Beynin davranışı nasıl şekillendirdiğini', 'Bilişsel süreçlerin biyolojik temelini', 'Modern nörogörüntüleme tekniklerini', 'Psikoloji ile sinirbilim arasındaki bağları'],
        speakers: [
            { name: 'Havva Demir', inst: 'İstanbul Üniversitesi', focus: 'Nöropsikoloji alanında klinik ve akademik çalışmalar yürütüyor.' }
        ]
    },
    'C/03': {
        title: 'Yapay Zekâ, Veri & Doğal Dil İşleme',
        tagline: 'Makinelerin öğrenmesinden dil modellerine, veri biliminden üretken yapay zekâya — teknolojinin en dinamik cephesini masaya yatıracağız.',
        topics: ['Makine öğrenmesi temelleri', 'Büyük dil modelleri (LLM)', 'Doğal dil işleme (NLP)', 'Veri etiği ve önyargı'],
        learn: ['Bir modelin nasıl eğitildiğini', 'Dil modellerinin içeriden nasıl çalıştığını', 'Gerçek dünya NLP uygulamalarını', 'Yapay zekânın etik sınırlarını'],
        speakers: [
            { name: 'Mehmet Ali Bayram', inst: 'Yeditepe Üniversitesi', focus: 'Yapay zekâ ve veri bilimi alanında akademik araştırmalar yürütüyor.' },
            { name: 'Emre Gül', inst: 'Fi-Product', focus: 'Doğal dil işleme ve yapay zekâ ürünleri geliştirme alanında çalışıyor.' },
            { name: 'Melis Dünya Sezer Gül', inst: 'Fi-Product', focus: 'Yapay zekâ tabanlı ürünlerin tasarımı ve uygulanması üzerine çalışıyor.' }
        ]
    },
    'C/04': {
        title: 'Uçak ve Havacılık',
        tagline: 'Kanattan yörüngeye uzanan mühendislik zinciri: aerodinamik prensiplerden modern hava araçlarının tasarımına ve sürdürülebilir havacılığa.',
        topics: ['Aerodinamik prensipler', 'Uçak tasarımı ve yapısal analiz', 'Uçuş sistemleri ve aviyonik', 'Sürdürülebilir havacılık ve uzay teknolojileri'],
        learn: ['Bir uçağın nasıl havalandığını', 'Mühendislik optimizasyonunun gücünü', 'Havacılık sektörünün yol haritasını', 'Türkiye\'nin havacılık ekosistemini'],
        speakers: [
            { name: 'Serhan Kök', inst: 'Maltepe Kadir Has BİLSEM', focus: 'Havacılık alanında eğitim ve uygulamalı çalışmalar yürütüyor.' },
            { name: 'Dr. Caner Şentürk', inst: 'İstanbul Beykoz Üniversitesi', focus: 'Havacılık mühendisliği alanında akademik çalışmalar yürütüyor.' }
        ]
    },
    'C/05': {
        title: 'Moleküler Biyoloji & Genetik',
        tagline: 'Yaşamın moleküler dilini çözmek: DNA\'dan CRISPR\'a, gen ifadesinden biyoteknolojinin en taze uygulamalarına.',
        topics: ['DNA, RNA ve protein sentezi', 'Gen düzenleme (CRISPR-Cas9)', 'Genetik hastalıklar ve tanı', 'Biyoteknoloji uygulamaları'],
        learn: ['Genin bilgiden proteine yolculuğunu', 'CRISPR\'ın nasıl çalıştığını', 'Tıpta genetik devrimin boyutlarını', 'Biyoetik tartışmaların temellerini'],
        speakers: [
            { name: 'Necla Birgül-Iyison', inst: 'Boğaziçi Üniversitesi', focus: 'Moleküler biyoloji ve genetik alanında araştırmalar yürütüyor.' },
            { name: 'Yelda Özden Çiftçi', inst: 'Gebze Teknik Üniversitesi', focus: 'Moleküler biyoloji ve genetik alanında akademik çalışmalar yürütüyor.' },
            { name: 'Ercan Arıcan', inst: 'İstanbul Üniversitesi', focus: 'Moleküler biyoloji ve genetik alanında araştırmalar yürütüyor.' },
            { name: 'Gül Çiçek Kılıç', inst: 'Gebze Teknik Üniversitesi', focus: 'Moleküler biyoloji ve biyoteknoloji alanında çalışmalar yürütüyor.' },
            { name: 'Işık Ertekin', inst: 'Şişli Terakki', focus: 'Biyoloji eğitimi ve genetik alanında çalışmalar yürütüyor.' }
        ]
    },
    'C/06': {
        title: 'Adli Bilimler, Kriminalistik & Toksikoloji',
        tagline: 'Suçun aydınlatılması bilim ve hukukun ortak masasında yapılır. DNA analizinden olay yeri incelemesine, toksikolojiden delil hukukuna.',
        topics: ['DNA ve biyolojik delil analizi', 'Olay yeri inceleme yöntemleri', 'Toksikoloji ve zehir bilimi', 'Adli delilin hukuki geçerliliği'],
        learn: ['Bir delilin mahkemeye nasıl ulaştığını', 'Adli bilim tekniklerinin sınırlarını', 'Toksikolojik analizin prensiplerini', 'Bilim ile hukukun kesiştiği noktaları'],
        speakers: [
            { name: 'Miraç Özdemir', inst: 'İstanbul Gelişim Üniversitesi', focus: 'Adli bilimler ve toksikoloji alanında akademik çalışmalar yürütüyor.' },
            { name: 'Av. Ece Ertuğ Özkara', inst: 'Serbest Avukat', focus: 'Adli delil ve hukuk pratiği alanında çalışmalar yürütüyor.' }
        ]
    },
    'C/07': {
        title: 'Akıllı Sistemler & Mühendislik',
        tagline: 'Sensörden karara uzanan zincir: robotik, otomasyon, gömülü sistemler ve Endüstri 4.0\'ın yeniden şekillendirdiği mühendislik pratiği.',
        topics: ['Robotik ve otonom sistemler', 'Gömülü sistemler ve IoT', 'Endüstri 4.0 ve otomasyon', 'İnsan-makine etkileşimi'],
        learn: ['Bir robotun nasıl karar verdiğini', 'Sensör-aktüatör döngüsünü', 'Akıllı fabrika mimarisini', 'Mühendislik kariyerinin yol haritasını'],
        speakers: [
            { name: 'Ali Buldu', inst: 'Marmara Üniversitesi', focus: 'Akıllı sistemler ve mühendislik alanında akademik çalışmalar yürütüyor.' },
            { name: 'Mehmet Kaan İldiz', inst: 'Üsküdar Üniversitesi', focus: 'Mühendislik ve gömülü sistemler alanında çalışmalar yürütüyor.' }
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

/* ==================== CARD 3D TILT ==================== */
const tiltSelector = '.committee, .committee-card, .activity-card, .team-card, .subteam-card, .sponsor-card, .vm-card, .info-card, .past-card, .eventinfo-program, .eventinfo-map';
document.querySelectorAll(tiltSelector).forEach(card => {
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

        // Dispatch world-space event for Three.js
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
