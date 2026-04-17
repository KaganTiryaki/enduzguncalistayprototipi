import { Vector3, MathUtils } from 'three';

const SIG_ORDER = ['quantum', 'neuro', 'ai-nlp', 'aero', 'molbio', 'forensic', 'smart'];

export const HOME_TARGET = {
    position: new Vector3(0, 0, 5.8),
    lookAt: new Vector3(0, 0, 0),
};

const SCROLL_POS = new Vector3(0, 0, 5.2);
const ZOOM_POS = new Vector3(0, 0, 3.0);
const ORIGIN = new Vector3(0, 0, 0);

function target(pos) {
    return { position: pos.clone(), lookAt: ORIGIN.clone() };
}

export const cameraTargets = Object.fromEntries(SIG_ORDER.map((sig) => [sig, target(SCROLL_POS)]));
export const zoomTargets   = Object.fromEntries(SIG_ORDER.map((sig) => [sig, target(ZOOM_POS)]));

export function dampVec(current, target, lambda, dt) {
    current.x = MathUtils.damp(current.x, target.x, lambda, dt);
    current.y = MathUtils.damp(current.y, target.y, lambda, dt);
    current.z = MathUtils.damp(current.z, target.z, lambda, dt);
}
