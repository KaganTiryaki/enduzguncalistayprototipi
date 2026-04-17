import {
    Scene, PerspectiveCamera, WebGLRenderer, Color, Group, Vector2,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { signatures, signatureOrder } from './signatures/index.js';
import { cameraTargets, zoomTargets, HOME_TARGET, SPLIT_DISTANCE, dampVec } from './camera.js';
import { anchors } from './anchors.js';
import { disposeGroup } from './dispose.js';

// Per-committee signature palettes so each constellation is visually distinct
const SIGNATURE_PALETTES = {
    quantum:  { accent: '#7B8FE8', mist: '#C4D1F2', navy500: '#3A64A7', navy400: '#4472B6', navy300: '#5381BE' },
    neuro:    { accent: '#FF7BAE', mist: '#FFC2D6', navy500: '#B54873', navy400: '#C25B86', navy300: '#D07299' },
    'ai-nlp': { accent: '#33E1C9', mist: '#B9F4EB', navy500: '#2E8E80', navy400: '#3BA697', navy300: '#4FBEAE' },
    aero:     { accent: '#C8E6FF', mist: '#E9F4FF', navy500: '#5A93C4', navy400: '#6AA5D0', navy300: '#7FB6DB' },
    molbio:   { accent: '#6EE58C', mist: '#C2F3CE', navy500: '#3C9454', navy400: '#49A863', navy300: '#58B974' },
    forensic: { accent: '#FFA65C', mist: '#FFD7B5', navy500: '#C56A3A', navy400: '#D47D48', navy300: '#E28F58' },
    smart:    { accent: '#FFD23F', mist: '#FFEA9E', navy500: '#C49522', navy400: '#D6A630', navy300: '#E5B843' },
};

export function initStage(canvas, options) {
    const { palette, dpr } = options;

    const scene = new Scene();
    scene.background = null;

    const camera = new PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.copy(HOME_TARGET.position);
    camera.lookAt(HOME_TARGET.lookAt);

    const renderer = new WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(new Color(0x000000), 0);

    const rootGroup = new Group();
    scene.add(rootGroup);

    // Each signature has a symmetric mirror twin (cloned, scale.x = -1).
    // Both halves start MERGED at anchor + OFFSET (single shape at viewport
    // center). When sig becomes active, splitProgress tweens 0→1 and the
    // halves fly out to anchor.x / anchor.x + 2*OFFSET — card-framing split.
    const handles = {};
    const splitProgress = {};
    signatureOrder.forEach((sig) => {
        const anchor = anchors[sig];
        handles[sig] = signatures[sig]({ palette: SIGNATURE_PALETTES[sig], anchor });
        rootGroup.add(handles[sig].group);

        // Mirror: deep clone with INDEPENDENT materials so we can fade it in
        // separately (splitProgress controls mirror opacity)
        const mirror = handles[sig].group.clone(true);
        mirror.traverse((child) => {
            if (child.material) {
                child.material = Array.isArray(child.material)
                    ? child.material.map((m) => m.clone())
                    : child.material.clone();
            }
        });
        mirror.scale.x = -1;
        handles[sig].mirror = mirror;
        rootGroup.add(mirror);

        splitProgress[sig] = { v: 0 };
        applySplit(sig);
    });

    function applySplit(sig) {
        const anchor = anchors[sig];
        const p = splitProgress[sig].v;
        // p=0: both at anchor → overlap, renders as single shape
        // p=1: original at anchor.x - D, mirror at anchor.x + D → symmetric split
        handles[sig].group.position.x   = anchor.x - SPLIT_DISTANCE * p;
        handles[sig].mirror.position.x  = anchor.x + SPLIT_DISTANCE * p;
        handles[sig].group.position.y   = anchor.y;
        handles[sig].mirror.position.y  = anchor.y;
        handles[sig].group.position.z   = anchor.z;
        handles[sig].mirror.position.z  = anchor.z;
    }

    // Postprocessing: bloom makes accent particles/lines glow cinematically
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(dpr);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.75, 0.55, 0.12);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    let activeSig = null;
    let zoomedSig = null;
    let isolated = false;
    let prevTime = performance.now();

    const camPos = camera.position.clone();
    const camLook = HOME_TARGET.lookAt.clone();
    const targetPos = camera.position.clone();
    const targetLook = HOME_TARGET.lookAt.clone();

    const intensity = {
        quantum: 0, neuro: 0, 'ai-nlp': 0, aero: 0, molbio: 0, forensic: 0, smart: 0,
    };

    function resize() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = Math.max(0.1, w / Math.max(1, h));
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        composer.setSize(w, h);
        bloom.resolution.set(w, h);
    }

    const gsap = (typeof window !== 'undefined') ? window.gsap : null;

    function tweenCameraTo(pos, look, duration = 1.5) {
        if (!gsap) {
            targetPos.copy(pos);
            targetLook.copy(look);
            return;
        }

        gsap.killTweensOf(camPos);
        gsap.killTweensOf(camLook);

        const dx = pos.x - camPos.x;
        const dy = pos.y - camPos.y;
        const lateral = Math.sqrt(dx * dx + dy * dy);
        const zDiff = Math.abs(camPos.z - pos.z);

        const useGtaArc = zDiff < 3 && lateral > 2;

        if (!useGtaArc) {
            gsap.to(camPos,  { x: pos.x,  y: pos.y,  z: pos.z,  duration, ease: 'power2.inOut' });
            gsap.to(camLook, { x: look.x, y: look.y, z: look.z, duration, ease: 'power2.inOut' });
            return;
        }

        const pullback = Math.min(10, Math.max(4, lateral * 0.6));
        const midZ = pos.z + pullback;

        const tl = gsap.timeline();
        tl.to(camPos, {
            x: pos.x,
            y: pos.y,
            z: midZ,
            duration: duration * 0.55,
            ease: 'power2.inOut',
        }, 0);
        tl.to(camPos, {
            z: pos.z,
            duration: duration * 0.5,
            ease: 'power2.out',
        }, duration * 0.55);
        tl.to(camLook, {
            x: look.x,
            y: look.y,
            z: look.z,
            duration: duration * 0.95,
            ease: 'power2.inOut',
        }, 0);
    }

    // Copy rotations from original group's entire subtree onto mirror,
    // and tie mirror material opacities to splitProgress (so mirror fades
    // in as it flies out — prevents asymmetric ghosting when merged)
    function syncMirror(sig) {
        const handle = handles[sig];
        const src = handle.group;
        const dst = handle.mirror;
        if (!dst) return;
        dst.rotation.copy(src.rotation);
        const p = splitProgress[sig].v;
        const srcKids = src.children;
        const dstKids = dst.children;
        for (let i = 0; i < srcKids.length; i++) {
            const sk = srcKids[i];
            const dk = dstKids[i];
            if (!dk) continue;
            dk.rotation.copy(sk.rotation);
            const sm = sk.material;
            const dm = dk.material;
            if (sm && dm) {
                if (Array.isArray(sm) && Array.isArray(dm)) {
                    for (let j = 0; j < sm.length; j++) {
                        if (dm[j]) dm[j].opacity = (sm[j].opacity ?? 1) * p;
                    }
                } else if (!Array.isArray(sm) && !Array.isArray(dm)) {
                    dm.opacity = (sm.opacity ?? 1) * p;
                }
            }
        }
    }

    function tick(timeMs) {
        const elapsed = timeMs / 1000;
        const dt = Math.min(0.05, (timeMs - prevTime) / 1000);
        prevTime = timeMs;

        signatureOrder.forEach((sig) => {
            let target;
            if (isolated) {
                target = (zoomedSig === sig || activeSig === sig) ? 1 : 0;
            } else if (zoomedSig === sig) {
                target = 1;
            } else if (zoomedSig) {
                target = 0;
            } else if (activeSig === sig) {
                target = 1;
            } else {
                target = 0.35;
            }
            const speed = isolated ? 7 : 5;
            intensity[sig] += (target - intensity[sig]) * Math.min(1, dt * speed);
            handles[sig].update(elapsed, dt, intensity[sig]);
            syncMirror(sig);
        });

        rootGroup.rotation.y = 0.04 * Math.sin(elapsed * 0.12);

        if (!gsap) {
            const lambda = zoomedSig ? 4.0 : 2.4;
            dampVec(camPos, targetPos, lambda, dt);
            dampVec(camLook, targetLook, lambda, dt);
        }
        camera.position.copy(camPos);
        camera.lookAt(camLook);

        composer.render();
    }

    function applyTarget() {
        if (zoomedSig) {
            tweenCameraDirect(zoomTargets[zoomedSig].position, zoomTargets[zoomedSig].lookAt, 0.9);
        } else if (activeSig) {
            tweenCameraTo(cameraTargets[activeSig].position, cameraTargets[activeSig].lookAt, 1.6);
        } else {
            tweenCameraTo(HOME_TARGET.position, HOME_TARGET.lookAt, 1.5);
        }
    }

    function tweenCameraDirect(pos, look, duration) {
        if (!gsap) { targetPos.copy(pos); targetLook.copy(look); return; }
        gsap.killTweensOf(camPos);
        gsap.killTweensOf(camLook);
        gsap.to(camPos,  { x: pos.x,  y: pos.y,  z: pos.z,  duration, ease: 'power2.inOut' });
        gsap.to(camLook, { x: look.x, y: look.y, z: look.z, duration, ease: 'power2.inOut' });
    }

    function animateSplit(sig, target, { delay = 0, duration = 1.2, ease = 'power2.inOut' } = {}) {
        if (!splitProgress[sig]) return;
        if (gsap) {
            gsap.to(splitProgress[sig], {
                v: target,
                duration,
                delay,
                ease,
                onUpdate: () => applySplit(sig),
                overwrite: 'auto',
            });
        } else {
            splitProgress[sig].v = target;
            applySplit(sig);
        }
    }

    function setActive(sig) {
        if (sig === activeSig) return;
        const prev = activeSig;
        activeSig = sig;
        if (!zoomedSig) applyTarget();
        // Merge previous fast — gets out of the way
        if (prev) animateSplit(prev, 0, { duration: 0.5, ease: 'power2.in' });
        // Delay new split so camera has time to arrive; smooth settle (no bounce)
        if (sig) animateSplit(sig, 1, { delay: 0.8, duration: 1.4, ease: 'power2.out' });
    }

    function zoomTo(sig) {
        zoomedSig = sig;
        applyTarget();
        // Halves stay SPLIT in modal — user sees symmetric halves on both
        // sides of the modal panel
    }

    function zoomOut() {
        zoomedSig = null;
        applyTarget();
    }

    function isolate(on) {
        isolated = !!on;
    }

    function destroy() {
        signatureOrder.forEach((sig) => {
            disposeGroup(handles[sig].group);
            if (handles[sig].mirror) disposeGroup(handles[sig].mirror);
        });
        renderer.dispose();
        composer.dispose?.();
    }

    resize();

    return { tick, resize, setActive, zoomTo, zoomOut, isolate, destroy };
}
