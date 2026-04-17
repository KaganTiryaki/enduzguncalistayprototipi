import {
    Scene, PerspectiveCamera, WebGLRenderer, Vector3, Color, Group,
} from 'three';
import { signatures, signatureOrder } from './signatures/index.js';
import { cameraTargets, zoomTargets, HOME_TARGET, dampVec } from './camera.js';
import { disposeGroup } from './dispose.js';

const CONSTELLATION_RADIUS = 2.4;

function constellationAnchor(index, count) {
    const a = (index / count) * Math.PI * 2 - Math.PI / 2;
    return new Vector3(
        Math.cos(a) * CONSTELLATION_RADIUS,
        Math.sin(a) * CONSTELLATION_RADIUS * 0.55,
        0
    );
}

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

    const handles = {};
    signatureOrder.forEach((sig, i) => {
        const anchor = constellationAnchor(i, signatureOrder.length);
        handles[sig] = signatures[sig]({ palette: sigPalette, anchor });
        rootGroup.add(handles[sig].group);
    });

    let activeSig = null;
    let zoomedSig = null;
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

        signatureOrder.forEach((sig) => {
            let target;
            if (zoomedSig === sig) {
                target = 1;
            } else if (zoomedSig) {
                target = 0.08;
            } else if (activeSig === sig) {
                target = 1;
            } else {
                target = 0.32;
            }
            intensity[sig] += (target - intensity[sig]) * Math.min(1, dt * 5);
            handles[sig].update(elapsed, dt, intensity[sig]);
        });

        rootGroup.rotation.y = 0.05 * Math.sin(elapsed * 0.15);

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

    function destroy() {
        signatureOrder.forEach((sig) => disposeGroup(handles[sig].group));
        renderer.dispose();
    }

    resize();

    return { tick, resize, setActive, zoomTo, zoomOut, destroy };
}
