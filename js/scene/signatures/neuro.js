import {
    Group, BufferGeometry, Float32BufferAttribute,
    LineSegments, LineBasicMaterial, Points, PointsMaterial,
    Color, AdditiveBlending,
} from 'three';

export function neuro({ palette, anchor }) {
    const group = new Group();
    group.position.copy(anchor);

    // Brain side-view: 19 manually placed outline points tracing the silhouette
    // (frontal dome → top arc → occipital → cerebellum lobe → brainstem → underside)
    const outline = [
        // Frontal dome → top arc → occipital
        [ 1.25,  0.10, 0], [ 1.20,  0.55, 0], [ 0.95,  0.95, 0],
        [ 0.45,  1.15, 0], [-0.15,  1.18, 0], [-0.70,  1.05, 0],
        [-1.15,  0.75, 0], [-1.30,  0.25, 0],
        // Cerebellum bulge (back-bottom)
        [-1.25, -0.25, 0], [-1.35, -0.55, 0], [-1.15, -0.80, 0],
        [-0.85, -0.85, 0],
        // Brainstem tail (hangs down)
        [-0.75, -1.05, 0], [-0.70, -1.30, 0], [-0.70, -1.55, 0],
        // Underside → back to frontal base
        [-0.35, -0.95, 0], [ 0.30, -0.80, 0], [ 0.85, -0.55, 0],
        [ 1.15, -0.20, 0],
    ];

    // Interior texture nodes — 12 random points within brain bounding ellipse
    // (axis-aligned, centered at ~origin, roughly fits the outline)
    const interior = [];
    {
        let placed = 0;
        while (placed < 12) {
            const x = (Math.random() - 0.5) * 2.2 - 0.05;
            const y = (Math.random() - 0.5) * 1.8 + 0.05;
            // Ellipse test (approximates outline interior)
            if ((x * x) / (1.15 * 1.15) + (y * y) / (0.95 * 0.95) < 0.95) {
                const z = (Math.random() - 0.5) * 0.25;
                interior.push([x, y, z]);
                placed++;
            }
        }
    }

    // Nodes array (outline + interior)
    const nodes = [];
    outline.forEach(([x, y, z]) => nodes.push(x, y, z));
    interior.forEach(([x, y, z]) => nodes.push(x, y, z));

    // Edges
    const edges = [];
    // 1) Outline ring: outline[i] ↔ outline[i+1]
    for (let i = 0; i < outline.length; i++) {
        const a = outline[i];
        const b = outline[(i + 1) % outline.length];
        edges.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
    // 2) Each interior node → its 2 nearest outline neighbors
    interior.forEach(([ix, iy, iz]) => {
        const dists = outline.map(([ox, oy, oz], idx) => {
            const dx = ix - ox, dy = iy - oy, dz = iz - oz;
            return { idx, d: Math.sqrt(dx * dx + dy * dy + dz * dz) };
        });
        dists.sort((a, b) => a.d - b.d);
        for (let k = 0; k < 2; k++) {
            const [ox, oy, oz] = outline[dists[k].idx];
            edges.push(ix, iy, iz, ox, oy, oz);
        }
    });

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
            edgeMat.opacity = (0.2 + 0.55 * intensity) * pulse;
            nodeMat.opacity = 0.45 + 0.55 * intensity;
        },
    };
}
