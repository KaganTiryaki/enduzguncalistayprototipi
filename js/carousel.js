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
    const slides = Array.from(document.querySelectorAll('.committee-slide'));
    if (!section || !canvas || slides.length === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const stage = initStage(canvas, { palette: PALETTE, dpr });

    let inView = false;
    let modalOpen = false;
    let rafId = null;

    const sectionIO = new IntersectionObserver((entries) => {
        entries.forEach((e) => { inView = e.isIntersecting; });
        if (!modalOpen) {
            document.body.classList.toggle('committees-visible', inView);
        }
        if ((inView || modalOpen) && rafId === null) loop(performance.now());
    }, { rootMargin: '300px 0px 300px 0px' });
    sectionIO.observe(section);

    function loop(t) {
        stage.tick(t);
        if ((inView || modalOpen) && document.visibilityState === 'visible') {
            rafId = requestAnimationFrame(loop);
        } else {
            rafId = null;
        }
    }

    window.addEventListener('resize', () => stage.resize());
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && inView && rafId === null) loop(performance.now());
    });

    // Track active signature via ScrollTrigger (GSAP) for stable, non-glitchy transitions
    let activeSlide = null;
    function setActiveSlide(slide) {
        if (slide === activeSlide) return;
        activeSlide?.classList.remove('is-active');
        activeSlide = slide;
        activeSlide.classList.add('is-active');
        const sig = activeSlide.getAttribute('data-signature');
        if (sig) stage.setActive(sig);
    }

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (gsap && ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        slides.forEach((slide) => {
            ScrollTrigger.create({
                trigger: slide,
                start: 'top 65%',
                end: 'bottom 35%',
                onEnter:     () => setActiveSlide(slide),
                onEnterBack: () => setActiveSlide(slide),
            });
        });
    } else {
        // Fallback: single IntersectionObserver with stricter threshold (no flip)
        const fallbackIO = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting && e.intersectionRatio > 0.5) setActiveSlide(e.target);
            });
        }, { threshold: [0.5] });
        slides.forEach((s) => fallbackIO.observe(s));
    }

    // Click / keyboard → zoom + open modal
    function onCardActivate(slide) {
        const sig = slide.getAttribute('data-signature');
        const num = slide.querySelector('.committee__num')?.textContent?.trim();
        if (!sig || !num) return;

        slide.classList.add('is-zooming');
        stage.zoomTo(sig);

        setTimeout(() => {
            if (typeof window.openCommitteeModal === 'function') {
                window.openCommitteeModal(num, slide);
            }
            slide.classList.remove('is-zooming');
        }, 720);
    }

    slides.forEach((slide) => {
        slide.setAttribute('role', 'button');
        slide.setAttribute('tabindex', '0');
        slide.addEventListener('click', (e) => {
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

    window.addEventListener('committee-modal:opened', (e) => {
        const sig = e.detail?.sig;
        if (sig) stage.zoomTo(sig);
        stage.isolate(true);
        modalOpen = true;
        document.body.classList.add('committees-visible');
        if (rafId === null) loop(performance.now());
    });

    window.addEventListener('committee-modal:closed', () => {
        stage.isolate(false);
        stage.zoomOut();
        modalOpen = false;
        if (!inView) document.body.classList.remove('committees-visible');
    });
});
