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

function waitForGlobal(name, timeoutMs = 4000) {
    return new Promise((resolve) => {
        const start = performance.now();
        (function check() {
            if (window[name]) return resolve(window[name]);
            if (performance.now() - start > timeoutMs) return resolve(null);
            setTimeout(check, 40);
        })();
    });
}

ready(async () => {
    const section = document.getElementById('komiteler');
    const canvas = document.getElementById('committees-stage');
    const slides = Array.from(document.querySelectorAll('.committee-slide'));
    if (!section || !canvas || slides.length === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const stage = initStage(canvas, { palette: PALETTE, dpr });

    // Wait for GSAP + ScrollTrigger + Lenis (loaded via defer scripts)
    const [gsap, ScrollTrigger, Lenis] = await Promise.all([
        waitForGlobal('gsap'),
        waitForGlobal('ScrollTrigger'),
        waitForGlobal('Lenis'),
    ]);

    // ===== Lenis smooth scroll =====
    let lenis = null;
    if (Lenis) {
        lenis = new Lenis({
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            smoothTouch: false,
        });
    }

    // ===== RAF loop: Three.js + Lenis =====
    let canvasVisible = false;
    let rafId = null;

    function loop(t) {
        if (lenis) lenis.raf(t);
        stage.tick(t);
        if (document.visibilityState === 'visible') {
            rafId = requestAnimationFrame(loop);
        } else {
            rafId = null;
        }
    }
    rafId = requestAnimationFrame(loop);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && rafId === null) {
            rafId = requestAnimationFrame(loop);
        }
    });

    // Canvas sizing
    function sizeCanvas() {
        stage.resize();
    }
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);

    // ===== ScrollTrigger: section visibility + active slide =====
    if (gsap && ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);

        // Hook Lenis into ScrollTrigger
        if (lenis) {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.lagSmoothing(0);
        }

        // Show/hide canvas based on section visibility
        ScrollTrigger.create({
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: (self) => {
                canvasVisible = self.isActive;
                canvas.classList.toggle('is-visible', canvasVisible);
            },
        });

        // Each slide activates its signature when near center
        slides.forEach((slide) => {
            ScrollTrigger.create({
                trigger: slide,
                start: 'top 65%',
                end: 'bottom 35%',
                onToggle: (self) => {
                    if (self.isActive) activateSlide(slide);
                },
            });
        });
    } else {
        // Fallback: IntersectionObserver if GSAP fails to load
        const sectionIO = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                canvasVisible = e.isIntersecting;
                canvas.classList.toggle('is-visible', canvasVisible);
            });
        }, { rootMargin: '100px 0px 100px 0px' });
        sectionIO.observe(section);

        const slideIO = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((e) => e.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) activateSlide(visible.target);
        }, { threshold: [0.35, 0.6, 0.85], rootMargin: '-20% 0px -30% 0px' });
        slides.forEach((s) => slideIO.observe(s));
    }

    let activeSlide = null;
    function activateSlide(slide) {
        if (slide === activeSlide) return;
        activeSlide?.classList.remove('is-active');
        activeSlide = slide;
        activeSlide.classList.add('is-active');
        const sig = slide.getAttribute('data-signature');
        if (sig) stage.setActive(sig);
    }

    // ===== Click / keyboard → zoom + modal =====
    function onCardActivate(slide) {
        const sig = slide.getAttribute('data-signature');
        const num = slide.querySelector('.committee__num')?.textContent?.trim();
        if (!sig || !num) return;

        activateSlide(slide);
        slide.classList.add('is-zooming');
        stage.zoomTo(sig);

        // Fire modal open after zoom settles
        const delay = 720;
        setTimeout(() => {
            if (typeof window.openCommitteeModal === 'function') {
                window.openCommitteeModal(num, slide);
            }
            slide.classList.remove('is-zooming');
        }, delay);
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

    // Modal close → zoom out
    window.addEventListener('committee-modal:closed', () => {
        stage.zoomOut();
    });
});
