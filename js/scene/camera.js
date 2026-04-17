import { Vector3, MathUtils } from 'three';
import { anchors } from './anchors.js';

// Split distance: when a sig is active, its two halves fly out by this
// amount to each side of the anchor → halves appear fully at left/right
// of the card (which sits at viewport center).
export const SPLIT_DISTANCE = 5.0;

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

// Camera framed squarely on the signature anchor. When active, halves
// split around anchor → symmetric around the card (viewport center).
export const cameraTargets = buildTargets(9.5);
// Modal zoom: closer, still on anchor
export const zoomTargets  = buildTargets(3.2);

export function dampVec(current, target, lambda, dt) {
    current.x = MathUtils.damp(current.x, target.x, lambda, dt);
    current.y = MathUtils.damp(current.y, target.y, lambda, dt);
    current.z = MathUtils.damp(current.z, target.z, lambda, dt);
}
