import {
    Group, BufferGeometry, Float32BufferAttribute,
    LineSegments, LineBasicMaterial, Points, PointsMaterial,
    Color, AdditiveBlending,
} from 'three';

export function neuro({ palette, anchor }) {
    const group = new Group();
    group.position.copy(anchor);

    // Brain side-view outline — front (+x) rounded, back (-x) has a gentle
    // occipital bulge and a soft parieto-cerebellar indent (not oval, not jagged)
    const outline = [
        // Frontal dome → top arc → occipital (gentle protrusion)
        [ 1.25,  0.10, 0], [ 1.20,  0.55, 0], [ 0.95,  0.95, 0],
        [ 0.45,  1.15, 0], [-0.15,  1.18, 0], [-0.70,  1.05, 0],
        [-1.18,  0.78, 0], [-1.38,  0.22, 0],
        // Occipital descent → soft notch → cerebellum apex
        [-1.32, -0.18, 0], [-1.18, -0.45, 0], [-1.28, -0.72, 0],
        [-1.10, -0.92, 0], [-0.85, -0.95, 0],
        // Brainstem tail (hangs down)
        [-0.72, -1.10, 0], [-0.70, -1.30, 0], [-0.70, -1.55, 0],
        // Underside → back to frontal base
        [-0.35, -0.95, 0], [ 0.30, -0.80, 0], [ 0.85, -0.55, 0],
        [ 1.15, -0.20, 0],
    ];

    // Interior texture nodes rejection-sampled inside the bounding ellipse
    const interior = [];
    while (interior.length < 28) {
        const x = (Math.random() - 0.5) * 2.2 - 0.05;
        const y = (Math.random() - 0.5) * 1.8 + 0.05;
        if ((x * x) / (1.15 * 1.15) + (y * y) / (0.95 * 0.95) < 0.95) {
            interior.push([x, y, (Math.random() - 0.5) * 0.25]);
        }
    }

    const nodes = [...outline, ...interior].flat();

    const edges = [];
    for (let i = 0; i < outline.length; i++) {
        const a = outline[i];
        const b = outline[(i + 1) % outline.length];
        edges.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
    interior.forEach(([ix, iy, iz]) => {
        const nearest = outline
            .map((p) => ({ p, d: Math.hypot(ix - p[0], iy - p[1], iz - p[2]) }))
            .sort((a, b) => a.d - b.d);
        for (let k = 0; k < 3; k++) {
            const [ox, oy, oz] = nearest[k].p;
            edges.push(ix, iy, iz, ox, oy, oz);
        }
    });
    // Interior-to-interior cortical links (each → 2 nearest other interior nodes, dedupe via i<j)
    for (let i = 0; i < interior.length; i++) {
        const [ix, iy, iz] = interior[i];
        const nearest = interior
            .map((p, j) => ({ p, j, d: Math.hypot(ix - p[0], iy - p[1], iz - p[2]) }))
            .filter((e) => e.j !== i)
            .sort((a, b) => a.d - b.d);
        for (let k = 0; k < 2; k++) {
            const { p, j } = nearest[k];
            if (j > i) edges.push(ix, iy, iz, p[0], p[1], p[2]);
        }
    }

    const edgeGeom = new BufferGeometry();
    edgeGeom.setAttribute('position', new Float32BufferAttribute(edges, 3));
    const edgeMat = new LineBasicMaterial({
        color: new Color(palette.navy300),
        transparent: true,
        opacity: 0.5,
    });
    group.add(new LineSegments(edgeGeom, edgeMat));

    const nodeGeom = new BufferGeometry();
    nodeGeom.setAttribute('position', new Float32BufferAttribute(nodes, 3));
    const nodeMat = new PointsMaterial({
        color: new Color(palette.accent),
        size: 0.085,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: AdditiveBlending,
    });
    group.add(new Points(nodeGeom, nodeMat));

    return {
        group,
        update(elapsed, _delta, intensity) {
            // Very subtle breathing sway — doesn't disrupt profile readability
            group.rotation.y = Math.sin(elapsed * 0.25) * 0.06;
            const pulse = 0.55 + 0.4 * Math.sin(elapsed * 1.2);
            edgeMat.opacity = (0.15 + 0.5 * intensity) * pulse;
            nodeMat.opacity = 0.45 + 0.55 * intensity;
        },
    };
}
