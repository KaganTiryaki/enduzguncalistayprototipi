import {
    Group, BufferGeometry, Float32BufferAttribute,
    Line, LineSegments, LineBasicMaterial, Color,
} from 'three';

// Side-view brain silhouette: outline polyline + cerebellum oval + brainstem
// + two internal gyri lines. Face points RIGHT (+x). Static, no rotation.
export function neuro({ palette, anchor }) {
    const group = new Group();
    group.position.copy(anchor);

    // --- 1. Cerebrum outline (closed polyline, side view) ---
    const keyPts = [
        [ 1.00,  0.75], [ 1.18,  0.55], [ 1.22,  0.30], [ 1.15,  0.05],
        [ 0.95, -0.22], [ 0.55, -0.40], [ 0.05, -0.45], [-0.40, -0.40],
        [-0.70, -0.22], [-0.95,  0.08], [-1.05,  0.35], [-0.95,  0.62],
        [-0.70,  0.82], [-0.30,  0.95], [ 0.15,  1.02], [ 0.55,  0.98],
        [ 0.82,  0.88], [ 1.00,  0.75],
    ];
    const subdiv = 10;
    const outlinePts = [];
    for (let i = 0; i < keyPts.length - 1; i++) {
        for (let k = 0; k < subdiv; k++) {
            const t = k / subdiv;
            const x = keyPts[i][0] * (1 - t) + keyPts[i + 1][0] * t;
            const y = keyPts[i][1] * (1 - t) + keyPts[i + 1][1] * t;
            outlinePts.push(x, y, 0);
        }
    }
    const outlineGeom = new BufferGeometry();
    outlineGeom.setAttribute('position', new Float32BufferAttribute(outlinePts, 3));
    const outlineMat = new LineBasicMaterial({
        color: new Color(palette.accent),
        transparent: true,
        opacity: 0.9,
    });
    group.add(new Line(outlineGeom, outlineMat));

    // --- 2. Cerebellum (oval at back-bottom) ---
    const cerPts = [];
    const ccx = -0.72, ccy = -0.32, rx = 0.28, ry = 0.20;
    for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        cerPts.push(ccx + Math.cos(a) * rx, ccy + Math.sin(a) * ry, 0);
    }
    const cerGeom = new BufferGeometry();
    cerGeom.setAttribute('position', new Float32BufferAttribute(cerPts, 3));
    const accentMat = new LineBasicMaterial({
        color: new Color(palette.navy300),
        transparent: true,
        opacity: 0.75,
    });
    group.add(new Line(cerGeom, accentMat));

    // --- 3. Brainstem (short vertical line below cerebellum) ---
    const stemPts = [-0.60, -0.45, 0,  -0.60, -0.80, 0];
    const stemGeom = new BufferGeometry();
    stemGeom.setAttribute('position', new Float32BufferAttribute(stemPts, 3));
    group.add(new LineSegments(stemGeom, accentMat));

    // --- 4. Internal gyri (wavy lines showing cortical folds) ---
    const gyriPts = [];
    const waves = [
        { y:  0.50, amp: 0.06, xs: -0.60, xe:  0.80, freq: 5 },
        { y:  0.15, amp: 0.05, xs: -0.85, xe:  0.95, freq: 6 },
        { y: -0.15, amp: 0.04, xs: -0.50, xe:  0.90, freq: 5 },
    ];
    for (const w of waves) {
        const segs = 90;
        for (let i = 0; i < segs; i++) {
            const t0 = i / segs;
            const t1 = (i + 1) / segs;
            const x0 = w.xs + (w.xe - w.xs) * t0;
            const x1 = w.xs + (w.xe - w.xs) * t1;
            const y0 = w.y + Math.sin(t0 * Math.PI * w.freq) * w.amp;
            const y1 = w.y + Math.sin(t1 * Math.PI * w.freq) * w.amp;
            gyriPts.push(x0, y0, 0, x1, y1, 0);
        }
    }
    const gyriGeom = new BufferGeometry();
    gyriGeom.setAttribute('position', new Float32BufferAttribute(gyriPts, 3));
    const gyriMat = new LineBasicMaterial({
        color: new Color(palette.mist),
        transparent: true,
        opacity: 0.4,
    });
    group.add(new LineSegments(gyriGeom, gyriMat));

    return {
        group,
        update(_elapsed, _delta, intensity) {
            outlineMat.opacity = 0.35 + 0.6 * intensity;
            accentMat.opacity = 0.25 + 0.55 * intensity;
            gyriMat.opacity   = 0.15 + 0.4 * intensity;
        },
    };
}
