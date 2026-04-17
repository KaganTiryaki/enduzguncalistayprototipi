import {
    Group, BufferGeometry, Float32BufferAttribute,
    LineSegments, LineBasicMaterial, Points, PointsMaterial,
    Color, AdditiveBlending,
} from 'three';

export function neuro({ palette, anchor }) {
    const group = new Group();
    group.position.copy(anchor);

    const nodeCount = 48;
    const nodes = [];
    const edges = [];

    for (let i = 0; i < nodeCount; i++) {
        nodes.push(
            (Math.random() - 0.5) * 2.6,
            (Math.random() - 0.5) * 2.2,
            (Math.random() - 0.5) * 1.6
        );
    }

    for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
            const dx = nodes[i * 3] - nodes[j * 3];
            const dy = nodes[i * 3 + 1] - nodes[j * 3 + 1];
            const dz = nodes[i * 3 + 2] - nodes[j * 3 + 2];
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (d < 0.85) {
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
        size: 0.05,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: AdditiveBlending,
    });
    const nodeMesh = new Points(nodeGeom, nodeMat);
    group.add(nodeMesh);

    return {
        group,
        update(elapsed, _delta, intensity) {
            group.rotation.y = elapsed * 0.06;
            const pulse = 0.55 + 0.4 * Math.sin(elapsed * 1.2);
            edgeMat.opacity = (0.15 + 0.5 * intensity) * pulse;
            nodeMat.opacity = 0.4 + 0.55 * intensity;
        },
    };
}
