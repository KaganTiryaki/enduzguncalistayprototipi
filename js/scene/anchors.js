import { Vector3 } from 'three';

// Scattered, intentionally unorganized signature positions.
// Hand-picked so each pair is >= ~7.9 units apart (neighbors stay
// out of frame when camera is focused on a single signature).
export const anchors = {
    quantum:  new Vector3(-8.2,  3.8, 0),
    neuro:    new Vector3( 7.4,  4.6, 0),
    'ai-nlp': new Vector3(-9.8, -4.2, 0),
    aero:     new Vector3(10.1, -3.7, 0),
    molbio:   new Vector3(-1.8,  8.5, 0),
    forensic: new Vector3( 2.3, -8.9, 0),
    smart:    new Vector3( 0.5, -0.3, 0),
};
