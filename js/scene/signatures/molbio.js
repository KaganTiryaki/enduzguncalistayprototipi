import {
    Group, BufferGeometry, Float32BufferAttribute,
    Line, LineBasicMaterial, LineSegments, Color,
} from 'three';

export function molbio({ palette, anchor }) {
    const group = new Group();
    group.position.copy(anchor);

    const samples = 220;
    const height = 2.4;
    const radius = 0.4;
    const turns = 3.2;

    const strandA = [];
    const strandB = [];
    const rungs = [];

    for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);
        const y = (t - 0.5) * height;
        const a = t * turns * Math.PI * 2;
        const ax = Math.cos(a) * radius;
        const az = Math.sin(a) * radius;
        const bx = Math.cos(a + Math.PI) * radius;
        const bz = Math.sin(a + Math.PI) * radius;
        strandA.push(ax, y, az);
        strandB.push(bx, y, bz);
        if (i % 8 === 0) {
            rungs.push(ax, y, az, bx, y, bz);
        }
    }

    const matA = new LineBasicMaterial({ color: new Color(palette.accent), transparent: true, opacity: 0.85 });
    const matB = new LineBasicMaterial({ color: new Color(palette.mist),   transparent: true, opacity: 0.75 });
    const matRung = new LineBasicMaterial({ color: new Color(palette.navy300), transparent: true, opacity: 0.4 });

    const geomA = new BufferGeometry();
    geomA.setAttribute('position', new Float32BufferAttribute(strandA, 3));
    const geomB = new BufferGeometry();
    geomB.setAttribute('position', new Float32BufferAttribute(strandB, 3));
    const geomRung = new BufferGeometry();
    geomRung.setAttribute('position', new Float32BufferAttribute(rungs, 3));

    group.add(new Line(geomA, matA));
    group.add(new Line(geomB, matB));
    group.add(new LineSegments(geomRung, matRung));

    return {
        group,
        update(elapsed, _delta, intensity) {
            group.rotation.y = elapsed * 0.25;
            group.rotation.x = Math.sin(elapsed * 0.15) * 0.08;
            matA.opacity = 0.4 + 0.5 * intensity;
            matB.opacity = 0.35 + 0.45 * intensity;
            matRung.opacity = 0.18 + 0.3 * intensity;
        },
    };
}
