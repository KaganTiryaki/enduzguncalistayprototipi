import {
    Group, BufferGeometry, Float32BufferAttribute,
    Line, LineBasicMaterial, Points, PointsMaterial,
    Color, AdditiveBlending,
} from 'three';

export function neuro({ palette, anchor }) {
    const group = new Group();
    group.position.copy(anchor);

    // --- Brain side-view silhouette (facing right: +x = front) ---
    // Closed outline: forehead → crown → occiput → cerebellum → brainstem →
    // temporal underside → back to forehead
    const outlinePts = [
         1.15,  0.75, 0,
         0.95,  0.97, 0,
         0.55,  1.10, 0,
         0.00,  1.16, 0,
        -0.50,  1.12, 0,
        -0.95,  0.95, 0,
        -1.30,  0.55, 0,
        -1.45,  0.10, 0,
        -1.35, -0.30, 0,
        -1.20, -0.55, 0,  // cerebellum top-back
        -1.05, -0.78, 0,  // cerebellum back curve
        -0.80, -0.92, 0,  // cerebellum bottom
        -0.55, -0.88, 0,  // indent between cerebellum and brainstem
        -0.35, -1.05, 0,  // brainstem
        -0.10, -1.05, 0,
         0.20, -1.00, 0,
         0.55, -0.85, 0,  // temporal lobe underside
         0.90, -0.60, 0,
         1.15, -0.25, 0,
         1.30,  0.15, 0,
         1.22,  0.50, 0,
         1.15,  0.75, 0,  // close loop
    ];

    const outlineMat = new LineBasicMaterial({
        color: new Color(palette.accent),
        transparent: true,
        opacity: 0.9,
    });
    const outlineGeom = new BufferGeometry();
    outlineGeom.setAttribute('position', new Float32BufferAttribute(outlinePts, 3));
    group.add(new Line(outlineGeom, outlineMat));

    // --- Internal anatomy: sulci & gyri (shared softer material) ---
    const foldMat = new LineBasicMaterial({
        color: new Color(palette.accent),
        transparent: true,
        opacity: 0.55,
    });

    function addFold(pts) {
        const g = new BufferGeometry();
        g.setAttribute('position', new Float32BufferAttribute(pts, 3));
        group.add(new Line(g, foldMat));
    }

    // Central sulcus — major vertical fold dividing frontal/parietal
    addFold([
        0.15,  1.05, 0,
        0.18,  0.85, 0,
        0.22,  0.55, 0,
        0.28,  0.25, 0,
        0.30, -0.05, 0,
    ]);

    // Lateral (Sylvian) fissure — horizontal split
    addFold([
         0.95, -0.20, 0,
         0.55, -0.38, 0,
         0.10, -0.42, 0,
        -0.40, -0.30, 0,
        -0.80, -0.12, 0,
    ]);

    // Upper gyrus curve (parietal)
    addFold([
        -0.85,  0.80, 0,
        -0.45,  0.95, 0,
         0.00,  0.92, 0,
         0.45,  0.80, 0,
         0.75,  0.62, 0,
    ]);

    // Mid gyrus (temporal-frontal)
    addFold([
        -0.95,  0.45, 0,
        -0.55,  0.62, 0,
        -0.10,  0.58, 0,
         0.40,  0.42, 0,
         0.75,  0.20, 0,
    ]);

    // Cerebellum internal fold
    addFold([
        -1.25, -0.45, 0,
        -1.10, -0.62, 0,
        -0.95, -0.80, 0,
        -0.75, -0.88, 0,
    ]);

    // --- Accent dots at landmarks (pulse with intensity) ---
    const landmarks = [
         0.30, -0.05, 0,   // central sulcus end
        -0.80, -0.12, 0,   // posterior lateral fissure
         0.15,  1.05, 0,   // top of central sulcus
        -0.95, -0.80, 0,   // cerebellum
    ];
    const dotMat = new PointsMaterial({
        color: new Color(palette.accent),
        size: 0.10,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: AdditiveBlending,
    });
    const dotGeom = new BufferGeometry();
    dotGeom.setAttribute('position', new Float32BufferAttribute(landmarks, 3));
    group.add(new Points(dotGeom, dotMat));

    return {
        group,
        update(elapsed, _delta, intensity) {
            // No rotation — stable profile, readable at a glance
            const pulse = 0.55 + 0.4 * Math.sin(elapsed * 1.2);
            outlineMat.opacity = 0.55 + 0.4 * intensity;
            foldMat.opacity    = (0.25 + 0.45 * intensity) * (0.82 + 0.18 * pulse);
            dotMat.opacity     = 0.45 + 0.5 * intensity;
        },
    };
}
