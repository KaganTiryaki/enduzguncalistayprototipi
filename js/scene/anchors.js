import { Vector3 } from 'three';

// Quantum at origin (anchor center); 6 others scattered around at
// non-uniform angles/radii. Hand-tuned so every pair is >= ~8 units
// apart (neighbors stay out of frame when camera focuses on one sig).
export const anchors = {
    quantum:  new Vector3( 0.0,  0.0,  0),
    neuro:    new Vector3( 8.5,  3.6,  0),
    'ai-nlp': new Vector3( 2.2,  9.2,  0),
    aero:     new Vector3(-7.4,  5.1,  0),
    molbio:   new Vector3(-9.8, -4.5,  0),
    forensic: new Vector3(-2.1, -10.4, 0),
    smart:    new Vector3( 9.6, -5.8,  0),
};
