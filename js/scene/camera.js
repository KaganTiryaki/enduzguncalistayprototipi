import { Vector3, MathUtils } from 'three';
import { anchors } from './anchors.js';

function buildTargets(distance) {
    const out = {};
    for (const sig of Object.keys(anchors)) {
        const p = anchors[sig];
        out[sig] = {
            position: new Vector3(p.x, p.y, p.z + distance),
            lookAt: new Vector3(p.x, p.y, p.z),
        };
    }
    return out;
}

export const HOME_TARGET = {
    position: new Vector3(0, 0.3, 32),
    lookAt: new Vector3(0, 0, 0),
};

// Scroll-active: camera settles at overview distance from the signature
export const cameraTargets = buildTargets(9.5);
// Click-zoom (modal): camera gets intimate with the signature
export const zoomTargets  = buildTargets(3.2);

export function dampVec(current, target, lambda, dt) {
    current.x = MathUtils.damp(current.x, target.x, lambda, dt);
    current.y = MathUtils.damp(current.y, target.y, lambda, dt);
    current.z = MathUtils.damp(current.z, target.z, lambda, dt);
}
