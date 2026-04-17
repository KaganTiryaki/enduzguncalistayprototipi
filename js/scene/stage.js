import {
    Scene, PerspectiveCamera, WebGLRenderer, Vector3, Color, Group,
} from 'three';
import { signatures, signatureOrder } from './signatures/index.js';
import { cameraTargets, zoomTargets, HOME_TARGET, dampVec } from './camera.js';
import { disposeGroup } from './dispose.js';

// All signatures share the origin; only the active one is visible (crossfade).
function anchorAtOrigin() {
    return new Vector3(0, 0, 0);
}

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
        handles[sig] = signatures[sig]({ palette: SIGNATURE_PALETTES[sig], anchor: anchorAtOrigin() });
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

    function updateTargets() {
        if (zoomedSig) {
            targetPos.copy(zoomTargets[zoomedSig].position);
            targetLook.copy(zoomTargets[zoomedSig].lookAt);
        } else if (activeSig) {
            targetPos.copy(cameraTargets[activeSig].position);
            targetLook.copy(cameraTargets[activeSig].lookAt);
        } else {
            targetPos.copy(HOME_TARGET.position);
            targetLook.copy(HOME_TARGET.lookAt);
        }
    }

    function tick(timeMs) {
        const elapsed = timeMs / 1000;
        const dt = Math.min(0.05, (timeMs - prevTime) / 1000);
        prevTime = timeMs;

        // Only the focused signature is visible; others smoothly fade out.
        const focus = zoomedSig || activeSig;
        signatureOrder.forEach((sig) => {
            const target = sig === focus ? 1 : 0;
            intensity[sig] += (target - intensity[sig]) * Math.min(1, dt * 6);
            handles[sig].group.visible = intensity[sig] > 0.005;
            handles[sig].update(elapsed, dt, intensity[sig]);
        });

        updateTargets();
        const lambda = zoomedSig ? 4.5 : 3.2;
        dampVec(camPos, targetPos, lambda, dt);
        dampVec(camLook, targetLook, lambda, dt);
        camera.position.copy(camPos);
        camera.lookAt(camLook);

        renderer.render(scene, camera);
    }

    function setActive(sig) {
        activeSig = sig;
    }

    function zoomTo(sig) {
        zoomedSig = sig;
    }

    function zoomOut() {
        zoomedSig = null;
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
