import { Vector3, MathUtils } from 'three';

const RADIUS = 3.6;
const Y_SCALE = 0.58;

function anchor(index, count) {
    const a = (index / count) * Math.PI * 2 - Math.PI / 2;
    return new Vector3(
        Math.cos(a) * RADIUS,
        Math.sin(a) * RADIUS * Y_SCALE,
        0
    );
}

const SIG_ORDER = ['quantum', 'neuro', 'ai-nlp', 'aero', 'molbio', 'forensic', 'smart'];

function buildTargets(distance, yLift = 0) {
    const out = {};
    SIG_ORDER.forEach((sig, i) => {
        const p = anchor(i, SIG_ORDER.length);
        out[sig] = {
            position: new Vector3(p.x, p.y + yLift, distance),
            lookAt: new Vector3(p.x, p.y, 0),
        };
    });
    return out;
}

export const HOME_TARGET = {
    position: new Vector3(0, 0.3, 9.2),
    lookAt: new Vector3(0, 0, 0),
};

export const cameraTargets = buildTargets(5.2, 0);
export const zoomTargets  = buildTargets(2.4, 0);

export function dampVec(current, target, lambda, dt) {
    current.x = MathUtils.damp(current.x, target.x, lambda, dt);
    current.y = MathUtils.damp(current.y, target.y, lambda, dt);
    current.z = MathUtils.damp(current.z, target.z, lambda, dt);
}
