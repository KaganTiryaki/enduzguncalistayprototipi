import {
    Scene, PerspectiveCamera, WebGLRenderer, Vector3, Color, Group,
} from 'three';
import { signatures, signatureOrder } from './signatures/index.js';
import { HOME_TARGET, ZOOM_TARGET, dampVec } from './camera.js';
import { disposeGroup } from './dispose.js';

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

    const sigPalette = {
        navy500: palette.navy500,
        navy400: palette.navy400,
        navy300: palette.navy300,
        accent: palette.accent,
        mist: palette.mist,
    };

    const rootGroup = new Group();
    scene.add(rootGroup);

    // All signatures rendered at origin — only active one visible
    const handles = {};
    signatureOrder.forEach((sig) => {
        handles[sig] = signatures[sig]({
            palette: sigPalette,
            anchor: new Vector3(0, 0, 0),
        });
        // Boost visual presence — each signature scales up for prominence
        handles[sig].group.scale.setScalar(1.25);
        handles[sig].group.visible = false;
        rootGroup.add(handles[sig].group);
    });

    let activeSig = null;
    let zoomed = false;
    let prevTime = performance.now();

    const camPos = camera.position.clone();
    const camLook = HOME_TARGET.lookAt.clone();
    const targetPos = camera.position.clone();
    const targetLook = HOME_TARGET.lookAt.clone();

    const intensity = {};
    signatureOrder.forEach((sig) => { intensity[sig] = 0; });

    function resize() {
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = Math.max(0.1, w / Math.max(1, h));
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
    }

    function updateTargets() {
        if (zoomed) {
            targetPos.copy(ZOOM_TARGET.position);
            targetLook.copy(ZOOM_TARGET.lookAt);
        } else {
            targetPos.copy(HOME_TARGET.position);
            targetLook.copy(HOME_TARGET.lookAt);
        }
    }

    function tick(timeMs) {
        const elapsed = timeMs / 1000;
        const dt = Math.min(0.05, (timeMs - prevTime) / 1000);
        prevTime = timeMs;

        signatureOrder.forEach((sig) => {
            const isActive = activeSig === sig;
            // Overdrive active to 1.4 for more prominence (signatures cap opacity at 1)
            const target = isActive ? 1.4 : 0;
            intensity[sig] += (target - intensity[sig]) * Math.min(1, dt * 4.5);
            const h = handles[sig];
            h.update(elapsed, dt, intensity[sig]);
            // Show/hide for perf — only visible when intensity non-trivial
            h.group.visible = intensity[sig] > 0.02;
        });

        // Gentle ambient rotation to keep scene alive
        rootGroup.rotation.y = 0.04 * Math.sin(elapsed * 0.15);

        updateTargets();
        const lambda = zoomed ? 4.0 : 3.0;
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
        if (sig) activeSig = sig;
        zoomed = true;
    }

    function zoomOut() {
        zoomed = false;
    }

    function destroy() {
        signatureOrder.forEach((sig) => disposeGroup(handles[sig].group));
        renderer.dispose();
    }

    resize();

    return { tick, resize, setActive, zoomTo, zoomOut, destroy };
}
