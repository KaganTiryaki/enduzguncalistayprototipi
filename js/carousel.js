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
    let rafId = null;

    const sectionIO = new IntersectionObserver((entries) => {
        entries.forEach((e) => { inView = e.isIntersecting; });
        if (inView && rafId === null) loop(performance.now());
    }, { rootMargin: '200px 0px 200px 0px' });
    sectionIO.observe(section);

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

    // Track which slide is most in view → active signature
    let activeSlide = null;
    const slideIO = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (!top) return;
        if (top.target === activeSlide) return;
        activeSlide?.classList.remove('is-active');
        activeSlide = top.target;
        activeSlide.classList.add('is-active');
        const sig = activeSlide.getAttribute('data-signature');
        if (sig) stage.setActive(sig);
    }, {
        threshold: [0.35, 0.6, 0.85],
        rootMargin: '-20% 0px -30% 0px',
    });
    slides.forEach((s) => slideIO.observe(s));

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

    window.addEventListener('committee-modal:closed', () => {
        stage.zoomOut();
    });
});
