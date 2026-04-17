import { initStage } from './scene/stage.js';

const PALETTE = {
    void: '#05070E',
    ink: '#0E1A33',
    navy500: '#3A64A7',
    navy400: '#4472B6',
    navy300: '#5381BE',
    accent: '#C88A3E',
    mist: '#9FB6D5',
};

function ready(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
        fn();
    }
}

ready(() => {
    const section = document.getElementById('komiteler');
    const canvas = document.getElementById('committees-stage');
    const carouselEl = document.querySelector('.committees-carousel');
    if (!section || !canvas || !carouselEl) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const stage = initStage(canvas, { palette: PALETTE, dpr });

    // RAF loop (runs only when committees section is visible)
    let inView = false;
    let rafId = null;

    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { inView = e.isIntersecting; });
        if (inView && rafId === null) loop(performance.now());
    }, { rootMargin: '200px 0px 200px 0px' });
    io.observe(section);

    function loop(t) {
        stage.tick(t);
        if (inView && document.visibilityState === 'visible') {
            rafId = requestAnimationFrame(loop);
        } else {
            rafId = null;
        }
    }

    window.addEventListener('resize', () => stage.resize());
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && inView && rafId === null) loop(performance.now());
    });

    // Swiper init
    const SwiperCls = window.Swiper;
    if (!SwiperCls) {
        console.warn('[committees] Swiper not loaded');
        return;
    }

    const swiper = new SwiperCls(carouselEl, {
        slidesPerView: 'auto',
        centeredSlides: true,
        grabCursor: true,
        speed: 700,
        initialSlide: 0,
        spaceBetween: 24,
        keyboard: { enabled: true },
        mousewheel: { forceToAxis: true, sensitivity: 0.4, thresholdDelta: 10 },
        pagination: {
            el: '.committees-carousel__pagination',
            clickable: true,
            bulletClass: 'committees-carousel__bullet',
            bulletActiveClass: 'committees-carousel__bullet--active',
        },
        navigation: {
            nextEl: '.committees-carousel__next',
            prevEl: '.committees-carousel__prev',
        },
        breakpoints: {
            640:  { slidesPerView: 'auto', spaceBetween: 28 },
            1024: { slidesPerView: 'auto', spaceBetween: 36 },
        },
    });

    function slideToSignature(slide) {
        if (!slide) return;
        const sig = slide.getAttribute('data-signature');
        if (sig) stage.setActive(sig);
    }

    slideToSignature(swiper.slides[swiper.activeIndex]);
    swiper.on('slideChange', () => {
        slideToSignature(swiper.slides[swiper.activeIndex]);
    });

    // Click / keyboard → zoom + open modal
    const gsap = window.gsap;

    function triggerZoom(sig, cb) {
        stage.zoomTo(sig);
        if (gsap) {
            gsap.to({}, { duration: 0.85, onComplete: cb || (() => {}) });
        } else {
            setTimeout(cb || (() => {}), 700);
        }
    }

    function onCardActivate(slide) {
        const sig = slide.getAttribute('data-signature');
        const num = slide.querySelector('.committee__num')?.textContent?.trim();
        if (!sig || !num) return;

        slide.classList.add('is-zooming');
        triggerZoom(sig, () => {
            // Delegate to existing modal open function on main.js
            if (typeof window.openCommitteeModal === 'function') {
                window.openCommitteeModal(num, slide);
            }
            slide.classList.remove('is-zooming');
        });
    }

    carouselEl.querySelectorAll('.committee-slide').forEach((slide) => {
        slide.setAttribute('role', 'button');
        slide.setAttribute('tabindex', '0');
        slide.addEventListener('click', (e) => {
            // Avoid clicks on interactive children (none today but future-proof)
            if (e.target.closest('a, button')) return;
            onCardActivate(slide);
        });
        slide.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCardActivate(slide);
            }
        });
    });

    // Zoom out when modal closes
    window.addEventListener('committee-modal:closed', () => {
        stage.zoomOut();
    });
});
