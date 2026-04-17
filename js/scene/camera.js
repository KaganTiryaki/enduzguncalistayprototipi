import { Vector3, MathUtils } from 'three';

export const HOME_TARGET = {
    position: new Vector3(0, 0.15, 5.8),
    lookAt: new Vector3(0, 0, 0),
};

export const ZOOM_TARGET = {
    position: new Vector3(0, 0.05, 3.1),
    lookAt: new Vector3(0, 0, 0),
};

export function dampVec(current, target, lambda, dt) {
    current.x = MathUtils.damp(current.x, target.x, lambda, dt);
    current.y = MathUtils.damp(current.y, target.y, lambda, dt);
    current.z = MathUtils.damp(current.z, target.z, lambda, dt);
}
