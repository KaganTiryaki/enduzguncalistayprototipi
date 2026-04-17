import {
    Scene, PerspectiveCamera, WebGLRenderer, Color, Group,
} from 'three';
import { signatures, signatureOrder } from './signatures/index.js';
import { cameraTargets, zoomTargets, HOME_TARGET, dampVec } from './camera.js';
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

    const handles = {};
    signatureOrder.forEach((sig) => {
        handles[sig] = signatures[sig]({ palette: SIGNATURE_PALETTES[sig], anchor: anchors[sig] });
        rootGroup.add(handles[sig].group);
    });

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
    }

    const gsap = (typeof window !== 'undefined') ? window.gsap : null;

    // GTA-V style camera transition: zoom out, fly laterally, zoom back in.
    // When source and destination are on the same z-plane (typical scroll
    // transition between signatures), this creates a satisfying "pullback →
    // glide → settle" arc instead of a flat lateral slide.
    function tweenCameraTo(pos, look, duration = 1.5) {
        if (!gsap) {
            targetPos.copy(pos);
            targetLook.copy(look);
            return;
        }

        gsap.killTweensOf(camPos);
        gsap.killTweensOf(camLook);

        // Pullback distance: proportional to lateral travel, min 4, max 10
        const dx = pos.x - camPos.x;
        const dy = pos.y - camPos.y;
        const lateral = Math.sqrt(dx * dx + dy * dy);
        const pullback = Math.min(10, Math.max(4, lateral * 0.6));
        const midZ = Math.max(camPos.z, pos.z) + pullback;

        const tl = gsap.timeline();
        // Phase 1: pull back (out), start lateral move
        tl.to(camPos, {
            x: pos.x,
            y: pos.y,
            z: midZ,
            duration: duration * 0.55,
            ease: 'power2.inOut',
        }, 0);
        // Phase 2: zoom in to target z (starts halfway through lateral)
        tl.to(camPos, {
            z: pos.z,
            duration: duration * 0.5,
            ease: 'power2.out',
        }, duration * 0.55);
        // Look: smooth pan throughout
        tl.to(camLook, {
            x: look.x,
            y: look.y,
            z: look.z,
            duration: duration * 0.95,
            ease: 'power2.inOut',
        }, 0);
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
        });

        rootGroup.rotation.y = 0.04 * Math.sin(elapsed * 0.12);

        if (!gsap) {
            // Fallback: damp camPos/camLook toward targets
            const lambda = zoomedSig ? 4.0 : 2.4;
            dampVec(camPos, targetPos, lambda, dt);
            dampVec(camLook, targetLook, lambda, dt);
        }
        camera.position.copy(camPos);
        camera.lookAt(camLook);

        renderer.render(scene, camera);
    }

    function applyTarget() {
        if (zoomedSig) {
            // Click zoom: direct (no GTA-style pullback, stays intimate)
            tweenCameraDirect(zoomTargets[zoomedSig].position, zoomTargets[zoomedSig].lookAt, 0.9);
        } else if (activeSig) {
            tweenCameraTo(cameraTargets[activeSig].position, cameraTargets[activeSig].lookAt, 1.6);
        } else {
            tweenCameraTo(HOME_TARGET.position, HOME_TARGET.lookAt, 1.5);
        }
    }

    // Direct tween — used for modal click-zoom (don't want dramatic pullback)
    function tweenCameraDirect(pos, look, duration) {
        if (!gsap) { targetPos.copy(pos); targetLook.copy(look); return; }
        gsap.killTweensOf(camPos);
        gsap.killTweensOf(camLook);
        gsap.to(camPos,  { x: pos.x,  y: pos.y,  z: pos.z,  duration, ease: 'power2.inOut' });
        gsap.to(camLook, { x: look.x, y: look.y, z: look.z, duration, ease: 'power2.inOut' });
    }

    function setActive(sig) {
        if (sig === activeSig) return;
        activeSig = sig;
        if (!zoomedSig) applyTarget();
    }

    function zoomTo(sig) {
        zoomedSig = sig;
        applyTarget();
    }

    function zoomOut() {
        zoomedSig = null;
        applyTarget();
    }

    function isolate(on) {
        isolated = !!on;
    }

    function destroy() {
        signatureOrder.forEach((sig) => disposeGroup(handles[sig].group));
        renderer.dispose();
    }

    resize();

    return { tick, resize, setActive, zoomTo, zoomOut, isolate, destroy };
}
