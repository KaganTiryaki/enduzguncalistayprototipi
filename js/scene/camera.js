import { Vector3, MathUtils } from 'three';
import { anchors } from './anchors.js';

// Shift camera view to the right of the signature → signature renders in
// the LEFT half of the viewport, card stays centered, both visible.
const VIEWPORT_X_OFFSET = 2.8;

function buildTargets(distance, xOffset = 0) {
    const out = {};
    for (const sig of Object.keys(anchors)) {
        const p = anchors[sig];
        out[sig] = {
            position: new Vector3(p.x + xOffset, p.y, p.z + distance),
            lookAt: new Vector3(p.x + xOffset, p.y, p.z),
        };
    }
    return out;
}

export const HOME_TARGET = {
    position: new Vector3(0, 0.3, 32),
    lookAt: new Vector3(0, 0, 0),
};

// Scroll-active: camera framed on signature, offset so sig sits on LEFT of viewport (card centered overlays right-of-sig)
export const cameraTargets = buildTargets(9.5, VIEWPORT_X_OFFSET);
// Click-zoom (modal): no offset, signature centered behind modal panel
export const zoomTargets  = buildTargets(3.2, 0);

export function dampVec(current, target, lambda, dt) {
    current.x = MathUtils.damp(current.x, target.x, lambda, dt);
    current.y = MathUtils.damp(current.y, target.y, lambda, dt);
    current.z = MathUtils.damp(current.z, target.z, lambda, dt);
}
