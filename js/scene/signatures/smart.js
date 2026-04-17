import {
    Group, BufferGeometry, Float32BufferAttribute,
    LineSegments, LineBasicMaterial, Points, PointsMaterial,
    Color, AdditiveBlending,
} from 'three';

export function smart({ palette, anchor }) {
    const group = new Group();
    group.position.copy(anchor);

    const step = 0.22;
    const half = 6;
    const gridLines = [];
    for (let i = -half; i <= half; i++) {
        const p = i * step;
        gridLines.push(-half * step, p, 0, half * step, p, 0);
        gridLines.push(p, -half * step, 0, p, half * step, 0);
    }
    const gridGeom = new BufferGeometry();
    gridGeom.setAttribute('position', new Float32BufferAttribute(gridLines, 3));
    const gridMat = new LineBasicMaterial({
        color: new Color(palette.navy400),
        transparent: true,
        opacity: 0.3,
    });
    group.add(new LineSegments(gridGeom, gridMat));

    const signalCount = 42;
    const signalPositions = new Float32Array(signalCount * 3);
    const signalPhases = new Float32Array(signalCount);
    for (let i = 0; i < signalCount; i++) {
        signalPhases[i] = Math.random() * Math.PI * 2;
    }
    const signalGeom = new BufferGeometry();
    signalGeom.setAttribute('position', new Float32BufferAttribute(signalPositions, 3));
    const signalMat = new PointsMaterial({
        color: new Color(palette.accent),
        size: 0.08,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: AdditiveBlending,
    });
    const signalPts = new Points(signalGeom, signalMat);
    group.add(signalPts);

    const attr = signalGeom.getAttribute('position');
    const range = half * step;

    return {
        group,
        update(elapsed, _delta, intensity) {
            for (let i = 0; i < signalCount; i++) {
                const t = (elapsed * 0.7 + signalPhases[i]) % 1;
                const rowSeed = Math.floor(signalPhases[i] * 100) % (half * 2 + 1);
                const row = (rowSeed - half) * step;
                const x = -range + t * range * 2;
                const y = row;
                attr.array[i * 3] = x;
                attr.array[i * 3 + 1] = y;
                attr.array[i * 3 + 2] = 0;
            }
            attr.needsUpdate = true;
            gridMat.opacity = 0.12 + 0.28 * intensity;
            signalMat.opacity = 0.4 + 0.55 * intensity;
        },
    };
}
