import { Vector3, MathUtils } from 'three';

export const HOME_TARGET = {
    position: new Vector3(0, 0.2, 6.2),
    lookAt: new Vector3(0, 0, 0),
};

export const cameraTargets = {
    quantum:    { position: new Vector3(-2.4,  0.2, 4.8), lookAt: new Vector3(-2.2,  0.0, 0.0) },
    neuro:      { position: new Vector3( 2.6,  0.1, 4.6), lookAt: new Vector3( 2.4,  0.0, 0.0) },
    'ai-nlp':   { position: new Vector3(-2.8, -0.3, 4.4), lookAt: new Vector3(-2.6, -0.4, 0.0) },
    aero:       { position: new Vector3( 2.2, -0.5, 4.6), lookAt: new Vector3( 2.0, -0.6, 0.0) },
    molbio:     { position: new Vector3(-2.0,  0.6, 4.2), lookAt: new Vector3(-1.8,  0.4, 0.0) },
    forensic:   { position: new Vector3( 2.8,  0.5, 4.4), lookAt: new Vector3( 2.6,  0.3, 0.0) },
    smart:      { position: new Vector3( 0.0, -0.2, 4.2), lookAt: new Vector3( 0.0, -0.2, 0.0) },
};

export const zoomTargets = {
    quantum:    { position: new Vector3(-2.4,  0.2, 2.2), lookAt: new Vector3(-2.2,  0.0, 0.0) },
    neuro:      { position: new Vector3( 2.6,  0.1, 2.0), lookAt: new Vector3( 2.4,  0.0, 0.0) },
    'ai-nlp':   { position: new Vector3(-2.8, -0.3, 2.0), lookAt: new Vector3(-2.6, -0.4, 0.0) },
    aero:       { position: new Vector3( 2.2, -0.5, 2.0), lookAt: new Vector3( 2.0, -0.6, 0.0) },
    molbio:     { position: new Vector3(-2.0,  0.6, 2.0), lookAt: new Vector3(-1.8,  0.4, 0.0) },
    forensic:   { position: new Vector3( 2.8,  0.5, 2.0), lookAt: new Vector3( 2.6,  0.3, 0.0) },
    smart:      { position: new Vector3( 0.0, -0.2, 1.8), lookAt: new Vector3( 0.0, -0.2, 0.0) },
};

export function dampVec(current, target, lambda, dt) {
    current.x = MathUtils.damp(current.x, target.x, lambda, dt);
    current.y = MathUtils.damp(current.y, target.y, lambda, dt);
    current.z = MathUtils.damp(current.z, target.z, lambda, dt);
}
