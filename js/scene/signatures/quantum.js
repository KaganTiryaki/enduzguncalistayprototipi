import {
    Group, Points, BufferGeometry, Float32BufferAttribute,
    PointsMaterial, Color, AdditiveBlending,
} from 'three';

export function quantum({ palette, anchor }) {
    const group = new Group();
    group.position.copy(anchor);

    const shells = [];
    const radii = [0.7, 0.95, 1.2];

    radii.forEach((r, idx) => {
        const count = 260 + idx * 80;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        const geom = new BufferGeometry();
        geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
        const color = idx === 1 ? palette.accent : idx === 2 ? palette.navy300 : palette.mist;
        const mat = new PointsMaterial({
            color: new Color(color),
            size: 0.022,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            blending: AdditiveBlending,
        });
        const pts = new Points(geom, mat);
        shells.push(pts);
        group.add(pts);
    });

    return {
        group,
        update(elapsed, _delta, intensity) {
            shells.forEach((s, i) => {
                s.rotation.y = elapsed * (0.08 + i * 0.04);
                s.rotation.x = Math.sin(elapsed * 0.3) * 0.08 * (1 + i * 0.3);
                const mat = s.material;
                mat.opacity = (0.3 + 0.55 * intensity) * (1 - i * 0.15);
            });
        },
    };
}
