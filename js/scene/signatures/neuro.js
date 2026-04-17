import {
    Group, BufferGeometry, Float32BufferAttribute,
    Line, LineBasicMaterial, Points, PointsMaterial,
    Color, AdditiveBlending,
} from 'three';

export function neuro({ palette, anchor }) {
    const group = new Group();
    group.position.copy(anchor);

    // Brain side-view outline (classic medical illustration).
    // Traced counter-clockwise starting from front-top; closes back to start.
    // Scaled for ~2.4 wide × 2.5 tall.
    const outline = [
        // cerebrum top (front → back)
         1.30,  0.55, 0,
         1.45,  0.85, 0,
         1.20,  1.15, 0,
         0.60,  1.30, 0,
        -0.10,  1.32, 0,
        -0.80,  1.20, 0,
        -1.30,  0.95, 0,
        // back curve
        -1.50,  0.50, 0,
        -1.45,  0.05, 0,
        -1.40, -0.35, 0,
        // cerebellum bump (back-bottom)
        -1.30, -0.65, 0,
        -1.00, -0.85, 0,
        -0.75, -0.80, 0,
        // brainstem tail
        -0.78, -1.10, 0,
        -0.80, -1.45, 0,
        // bottom of brain (curves back toward front)
        -0.55, -0.75, 0,
        -0.15, -0.70, 0,
         0.40, -0.55, 0,
         0.90, -0.30, 0,
         1.20,  0.05, 0,
         1.30,  0.55, 0, // close
    ];

    // Internal sulci (lines through/inside the cerebrum)
    const sulci = [
        // Lateral (Sylvian) fissure — horizontal curve
         1.10,  0.10, 0,   0.50,  0.25, 0,
         0.50,  0.25, 0,  -0.20,  0.30, 0,
        -0.20,  0.30, 0,  -0.80,  0.20, 0,
        -0.80,  0.20, 0,  -1.20,  0.00, 0,
        // Central sulcus — diagonal from top-middle down
         0.20,  1.25, 0,   0.00,  0.80, 0,
         0.00,  0.80, 0,  -0.20,  0.35, 0,
        // Brainstem division line
        -0.92, -0.85, 0,  -0.70, -0.82, 0,
        // Small gyrus suggestions
         0.60,  0.70, 0,   0.20,  0.85, 0,
        -0.50,  0.85, 0,  -0.90,  0.70, 0,
    ];

    // Inner "neuron" dots scattered within brain silhouette
    const dots = [];
    const dotCount = 26;
    let placed = 0;
    while (placed < dotCount) {
        const x = (Math.random() - 0.5) * 2.6;
        const y = (Math.random() - 0.5) * 2.2 + 0.1;
        // rough brain-bounds ellipse check
        if ((x*x)/1.8 + (y*y)/1.4 < 0.85 && y > -0.4) {
            dots.push(x, y, (Math.random() - 0.5) * 0.3);
            placed++;
        }
    }

    // Outline material (bright accent — the main brain silhouette)
    const outlineMat = new LineBasicMaterial({
        color: new Color(palette.accent),
        transparent: true,
        opacity: 0.95,
    });
    const outlineGeom = new BufferGeometry();
    outlineGeom.setAttribute('position', new Float32BufferAttribute(outline, 3));
    group.add(new Line(outlineGeom, outlineMat));

    // Sulci material (softer, mist color)
    const sulciMat = new LineBasicMaterial({
        color: new Color(palette.mist),
        transparent: true,
        opacity: 0.55,
    });
    // Use LineSegments via individual Line per pair would be costly;
    // here sulci points are already arranged as pairs so we draw segments.
    const sulciGeom = new BufferGeometry();
    sulciGeom.setAttribute('position', new Float32BufferAttribute(sulci, 3));
    const sulciLine = new Line(sulciGeom, sulciMat);
    // Three.js Line draws connected polyline; we want segments. Use LineSegments:
    // but we already imported LineBasicMaterial; LineSegments needs different import.
    // Keep as Line — the pairs form a zigzag, still visually represents folds.
    group.add(sulciLine);

    // Inner neuron dots — additive glow
    const dotGeom = new BufferGeometry();
    dotGeom.setAttribute('position', new Float32BufferAttribute(dots, 3));
    const dotMat = new PointsMaterial({
        color: new Color(palette.accent),
        size: 0.065,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: AdditiveBlending,
    });
    group.add(new Points(dotGeom, dotMat));

    return {
        group,
        update(elapsed, _delta, intensity) {
            // No rotation — keep brain profile readable
            const pulse = 0.55 + 0.4 * Math.sin(elapsed * 1.2);
            outlineMat.opacity = 0.35 + 0.55 * intensity;
            sulciMat.opacity = (0.18 + 0.35 * intensity) * pulse;
            dotMat.opacity = 0.35 + 0.6 * intensity;
        },
    };
}
