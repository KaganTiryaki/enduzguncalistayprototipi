import {
    Group, BufferGeometry, Float32BufferAttribute,
    LineSegments, LineBasicMaterial, Points, PointsMaterial,
    Color, AdditiveBlending,
} from 'three';

export function neuro({ palette, anchor }) {
    const group = new Group();
    group.position.copy(anchor);

    // Brain side-view silhouette: elliptical cerebrum (wider horizontal than
    // vertical, front tapers) + small cerebellum bulge at back-bottom + short
    // brainstem tail. Rejection sampling within each region.
    const nodes = [];

    // Cerebrum: 42 nodes in a horizontal ellipsoid, slight pear shape
    // (narrows toward the front = +x, fuller at back = -x)
    {
        let placed = 0;
        while (placed < 42) {
            const x = (Math.random() - 0.5) * 2.6;
            const y = (Math.random() - 0.5) * 1.6 + 0.15;
            const z = (Math.random() - 0.5) * 1.2;
            const taper = x > 0 ? 1 - (x / 1.3) * 0.28 : 1;
            const rx = 1.3 * taper;
            if ((x*x)/(rx*rx) + (y*y)/0.7 + (z*z)/0.4 < 1) {
                nodes.push(x, y, z);
                placed++;
            }
        }
    }

    // Cerebellum: 7 nodes in small ellipsoid at back-bottom
    {
        let placed = 0;
        while (placed < 7) {
            const x = -0.85 + (Math.random() - 0.5) * 0.9;
            const y = -0.55 + (Math.random() - 0.5) * 0.55;
            const z = (Math.random() - 0.5) * 0.8;
            const dx = (x + 0.85) / 0.5;
            const dy = (y + 0.55) / 0.3;
            const dz = z / 0.4;
            if (dx*dx + dy*dy + dz*dz < 1) {
                nodes.push(x, y, z);
                placed++;
            }
        }
    }

    // Brainstem: 5 nodes descending from cerebellum base
    for (let i = 0; i < 5; i++) {
        nodes.push(-0.85 + (Math.random() - 0.5) * 0.18, -0.95 - i * 0.18, (Math.random() - 0.5) * 0.22);
    }

    const nodeCount = nodes.length / 3;
    const edges = [];
    for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
            const dx = nodes[i * 3] - nodes[j * 3];
            const dy = nodes[i * 3 + 1] - nodes[j * 3 + 1];
            const dz = nodes[i * 3 + 2] - nodes[j * 3 + 2];
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (d < 0.75) {
                edges.push(
                    nodes[i * 3], nodes[i * 3 + 1], nodes[i * 3 + 2],
                    nodes[j * 3], nodes[j * 3 + 1], nodes[j * 3 + 2]
                );
            }
        }
    }

    const edgeGeom = new BufferGeometry();
    edgeGeom.setAttribute('position', new Float32BufferAttribute(edges, 3));
    const edgeMat = new LineBasicMaterial({
        color: new Color(palette.navy300),
        transparent: true,
        opacity: 0.4,
    });
    const edgeMesh = new LineSegments(edgeGeom, edgeMat);
    group.add(edgeMesh);

    const nodeGeom = new BufferGeometry();
    nodeGeom.setAttribute('position', new Float32BufferAttribute(nodes, 3));
    const nodeMat = new PointsMaterial({
        color: new Color(palette.accent),
        size: 0.075,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: AdditiveBlending,
    });
    const nodeMesh = new Points(nodeGeom, nodeMat);
    group.add(nodeMesh);

    return {
        group,
        update(elapsed, _delta, intensity) {
            // No rotation — keeps the angular composition readable instantly
            const pulse = 0.55 + 0.4 * Math.sin(elapsed * 1.2);
            edgeMat.opacity = (0.15 + 0.5 * intensity) * pulse;
            nodeMat.opacity = 0.4 + 0.55 * intensity;
        },
    };
}
