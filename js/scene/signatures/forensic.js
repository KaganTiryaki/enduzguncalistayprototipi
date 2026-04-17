import {
    Group, BufferGeometry, Float32BufferAttribute,
    LineSegments, LineBasicMaterial, RingGeometry, Mesh,
    MeshBasicMaterial, Color, DoubleSide,
} from 'three';

export function forensic({ palette, anchor }) {
    const group = new Group();
    group.position.copy(anchor);

    const spokes = [];
    const spokeCount = 24;
    const outer = 1.2;
    for (let i = 0; i < spokeCount; i++) {
        const a = (i / spokeCount) * Math.PI * 2;
        spokes.push(0, 0, 0, Math.cos(a) * outer, Math.sin(a) * outer, 0);
    }
    const spokesGeom = new BufferGeometry();
    spokesGeom.setAttribute('position', new Float32BufferAttribute(spokes, 3));
    const spokesMat = new LineBasicMaterial({
        color: new Color(palette.navy300),
        transparent: true,
        opacity: 0.4,
    });
    group.add(new LineSegments(spokesGeom, spokesMat));

    const rings = [];
    const ringMats = [];
    [0.35, 0.65, 0.95, 1.2].forEach((r, i) => {
        const geom = new RingGeometry(r - 0.004, r, 128);
        const mat = new MeshBasicMaterial({
            color: new Color(i === 2 ? palette.accent : palette.mist),
            transparent: true,
            opacity: 0.6,
            side: DoubleSide,
        });
        const ring = new Mesh(geom, mat);
        rings.push(ring);
        ringMats.push(mat);
        group.add(ring);
    });

    return {
        group,
        update(elapsed, _delta, intensity) {
            group.rotation.z = elapsed * 0.08;
            spokesMat.opacity = 0.18 + 0.35 * intensity;
            rings.forEach((ring, i) => {
                const pulse = 1 + Math.sin(elapsed * 0.6 + i * 1.3) * 0.04;
                ring.scale.set(pulse, pulse, 1);
                ringMats[i].opacity = (0.25 + 0.5 * intensity) * (i === 2 ? 1.1 : 0.85);
            });
        },
    };
}
