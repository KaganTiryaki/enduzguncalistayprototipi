import {
    Group, TorusGeometry, Mesh, MeshBasicMaterial, Color,
    BufferGeometry, Float32BufferAttribute, Points, PointsMaterial,
    AdditiveBlending,
} from 'three';

export function aero({ palette, anchor }) {
    const group = new Group();
    group.position.copy(anchor);

    const torusGeom = new TorusGeometry(1.15, 0.02, 10, 180);
    const torusMat = new MeshBasicMaterial({
        color: new Color(palette.mist),
        transparent: true,
        opacity: 0.55,
    });
    const torus = new Mesh(torusGeom, torusMat);
    torus.rotation.x = Math.PI / 2.3;
    group.add(torus);

    const trailCount = 500;
    const trailPositions = new Float32Array(trailCount * 3);
    const trailGeom = new BufferGeometry();
    trailGeom.setAttribute('position', new Float32BufferAttribute(trailPositions, 3));
    const trailMat = new PointsMaterial({
        color: new Color(palette.accent),
        size: 0.042,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: AdditiveBlending,
    });
    const trail = new Points(trailGeom, trailMat);
    group.add(trail);

    const attr = trailGeom.getAttribute('position');

    return {
        group,
        update(elapsed, _delta, intensity) {
            group.rotation.z = Math.sin(elapsed * 0.2) * 0.1;
            torus.rotation.z = elapsed * 0.15;
            const radius = 1.0;
            for (let i = 0; i < trailCount; i++) {
                const t = elapsed * 0.6 - i * 0.008;
                const x = Math.cos(t) * radius;
                const y = Math.sin(t * 1.3) * 0.18;
                const z = Math.sin(t) * radius;
                attr.array[i * 3] = x;
                attr.array[i * 3 + 1] = y;
                attr.array[i * 3 + 2] = z;
            }
            attr.needsUpdate = true;
            trailMat.opacity = 0.35 + 0.55 * intensity;
            torusMat.opacity = 0.25 + 0.35 * intensity;
        },
    };
}
