import {
    Group, BufferGeometry, Float32BufferAttribute,
    Line, LineBasicMaterial, Points, PointsMaterial,
    Color, AdditiveBlending,
} from 'three';

export function aiNlp({ palette, anchor }) {
    const group = new Group();
    group.position.copy(anchor);

    const layers = [5, 9, 9, 5];
    const xs = [-1.5, -0.5, 0.5, 1.5];
    const nodePositions = [];
    const nodeLayer = [];

    layers.forEach((count, li) => {
        const layerIdx = [];
        for (let i = 0; i < count; i++) {
            const y = (i - (count - 1) / 2) * 0.28;
            nodePositions.push(xs[li], y, 0);
            layerIdx.push(nodePositions.length / 3 - 1);
        }
        nodeLayer.push(layerIdx);
    });

    const edgeMat = new LineBasicMaterial({
        color: new Color(palette.navy400),
        transparent: true,
        opacity: 0.28,
    });

    for (let li = 0; li < nodeLayer.length - 1; li++) {
        const a = nodeLayer[li];
        const b = nodeLayer[li + 1];
        for (const ai of a) {
            for (const bi of b) {
                const ax = nodePositions[ai * 3], ay = nodePositions[ai * 3 + 1];
                const bx = nodePositions[bi * 3], by = nodePositions[bi * 3 + 1];
                const geom = new BufferGeometry();
                geom.setAttribute(
                    'position',
                    new Float32BufferAttribute([ax, ay, 0, bx, by, 0], 3)
                );
                group.add(new Line(geom, edgeMat));
            }
        }
    }

    const nodeGeom = new BufferGeometry();
    nodeGeom.setAttribute('position', new Float32BufferAttribute(nodePositions, 3));
    const nodeMat = new PointsMaterial({
        color: new Color(palette.accent),
        size: 0.06,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: AdditiveBlending,
    });
    group.add(new Points(nodeGeom, nodeMat));

    return {
        group,
        update(elapsed, _delta, intensity) {
            group.rotation.y = Math.sin(elapsed * 0.3) * 0.25;
            edgeMat.opacity = (0.1 + 0.4 * intensity) * (0.7 + 0.3 * Math.sin(elapsed * 2));
            nodeMat.opacity = 0.35 + 0.6 * intensity;
        },
    };
}
