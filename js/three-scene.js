import * as THREE from 'three';

const canvas = document.getElementById('bg-canvas');
if (!canvas) throw new Error('bg-canvas not found');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.innerWidth < 768;

const PALETTE = {
    dark: { particle: 0xA8C0E0, accent: 0x88A8D8, lines: 0x5888C8, fog: 0x2F5BAE },
    light: { particle: 0x4878C0, accent: 0x3D6AB0, lines: 0x5888C8, fog: 0xF3F7FC }
};

const SECTION_MODES = {
    hero: 'atom',
    theme: 'dna',
    vision: 'flow',
    about: 'neural',
    workshop: 'wave',
    komiteler: 'orbital',
    program: 'timeline',
    team: 'constellation',
    faq: 'flow',
    sponsors: 'neural',
    eventinfo: 'wave',
    past: 'constellation',
    contact: 'constellation'
};

const DARK_SECTIONS = new Set(['hero', 'theme', 'workshop', 'program', 'team', 'eventinfo']);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 60);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

// ===== PARTICLE FIELD (always visible) =====
const particleCount = isMobile ? 250 : 500;
const particleGeo = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    velocities[i * 3]     = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particleMat = new THREE.PointsMaterial({
    color: PALETTE.dark.particle,
    size: 0.6,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// ===== DEEP STARFIELD (far-back dust) =====
const farCount = isMobile ? 400 : 900;
const farGeo = new THREE.BufferGeometry();
const farPos = new Float32Array(farCount * 3);
for (let i = 0; i < farCount; i++) {
    farPos[i * 3]     = (Math.random() - 0.5) * 600;
    farPos[i * 3 + 1] = (Math.random() - 0.5) * 600;
    farPos[i * 3 + 2] = -100 - Math.random() * 300;
}
farGeo.setAttribute('position', new THREE.BufferAttribute(farPos, 3));
const farMat = new THREE.PointsMaterial({
    color: 0x88A8D8,
    size: 0.3,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const farField = new THREE.Points(farGeo, farMat);
scene.add(farField);

// ===== AMBIENT FLOATING POLYHEDRONS =====
const ambientShapes = [];
const ambientCount = isMobile ? 4 : 9;
const shapeTypes = [
    () => new THREE.TetrahedronGeometry(Math.random() * 1.5 + 0.8),
    () => new THREE.OctahedronGeometry(Math.random() * 1.5 + 0.8),
    () => new THREE.IcosahedronGeometry(Math.random() * 1.2 + 0.6),
    () => new THREE.TorusGeometry(Math.random() * 1.2 + 0.6, 0.1, 8, 24),
    () => new THREE.BoxGeometry(Math.random() * 1.5 + 0.8, Math.random() * 1.5 + 0.8, Math.random() * 1.5 + 0.8)
];
for (let i = 0; i < ambientCount; i++) {
    const geo = shapeTypes[Math.floor(Math.random() * shapeTypes.length)]();
    const mat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0x88A8D8 : 0xA8C0E0,
        wireframe: true,
        transparent: true,
        opacity: 0.25 + Math.random() * 0.3
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 120,
        -20 - Math.random() * 40
    );
    mesh.userData.rotSpeed = {
        x: (Math.random() - 0.5) * 0.4,
        y: (Math.random() - 0.5) * 0.4,
        z: (Math.random() - 0.5) * 0.2
    };
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;
    mesh.userData.basePos = mesh.position.clone();
    scene.add(mesh);
    ambientShapes.push(mesh);
}

// ===== SHOOTING STARS / COMETS =====
const comets = [];
const cometCount = 2;
for (let i = 0; i < cometCount; i++) {
    const geo = new THREE.BufferGeometry();
    const trail = 20;
    const pts = new Float32Array(trail * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({
        color: 0xA8C0E0,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const comet = new THREE.Line(geo, mat);
    comet.userData.active = false;
    comet.userData.trail = trail;
    comet.userData.vx = 0;
    comet.userData.vy = 0;
    scene.add(comet);
    comets.push(comet);
}

function launchComet(comet) {
    const startX = (Math.random() - 0.5) * 200;
    const startY = 60 + Math.random() * 20;
    const angle = -Math.PI / 3 - Math.random() * Math.PI / 4;
    const speed = 60 + Math.random() * 40;
    const pos = comet.geometry.attributes.position.array;
    for (let i = 0; i < comet.userData.trail; i++) {
        pos[i * 3]     = startX;
        pos[i * 3 + 1] = startY;
        pos[i * 3 + 2] = -10;
    }
    comet.userData.active = true;
    comet.userData.vx = Math.cos(angle) * speed;
    comet.userData.vy = Math.sin(angle) * speed;
    comet.userData.headX = startX;
    comet.userData.headY = startY;
    comet.userData.life = 0;
    comet.userData.maxLife = 2 + Math.random() * 1.5;
    comet.geometry.attributes.position.needsUpdate = true;
}

let nextCometTime = 2;

// ===== MOUSE-FOLLOWER GLOW ORB =====
const orbGroup = new THREE.Group();
const orbCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xA8C0E0, transparent: true, opacity: 0.9 })
);
orbGroup.add(orbCore);
const orbHalo = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 24, 24),
    new THREE.MeshBasicMaterial({
        color: 0x88A8D8,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    })
);
orbGroup.add(orbHalo);
orbGroup.position.set(0, 0, 10);
scene.add(orbGroup);

// ===== BURST PARTICLES (triggered on card hover) =====
const BURST_COUNT = 60;
const bursts = [];
function createBurstPool(count) {
    for (let i = 0; i < count; i++) {
        const geo = new THREE.BufferGeometry();
        const n = 10;
        const pos = new Float32Array(n * 3);
        const vel = new Float32Array(n * 3);
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xA8C0E0,
            size: 0.8,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const points = new THREE.Points(geo, mat);
        points.userData.vel = vel;
        points.userData.life = 0;
        points.userData.maxLife = 1;
        points.userData.active = false;
        points.userData.n = n;
        scene.add(points);
        bursts.push(points);
    }
}
createBurstPool(4);

function fireBurst(screenX, screenY) {
    const free = bursts.find(b => !b.userData.active);
    if (!free) return;
    const ndc = new THREE.Vector3(
        (screenX / window.innerWidth) * 2 - 1,
        -(screenY / window.innerHeight) * 2 + 1,
        0.5
    );
    ndc.unproject(camera);
    const dir = ndc.sub(camera.position).normalize();
    const dist = (15 - camera.position.z) / dir.z;
    const world = camera.position.clone().add(dir.multiplyScalar(dist));

    const pos = free.geometry.attributes.position.array;
    const vel = free.userData.vel;
    for (let i = 0; i < free.userData.n; i++) {
        pos[i * 3]     = world.x;
        pos[i * 3 + 1] = world.y;
        pos[i * 3 + 2] = world.z;
        const angle = Math.random() * Math.PI * 2;
        const speed = 8 + Math.random() * 12;
        vel[i * 3]     = Math.cos(angle) * speed;
        vel[i * 3 + 1] = Math.sin(angle) * speed;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    free.geometry.attributes.position.needsUpdate = true;
    free.userData.life = 0;
    free.userData.maxLife = 0.8 + Math.random() * 0.3;
    free.userData.active = true;
    free.material.opacity = 1;
}

// ===== CARD HOVER TRACKING =====
let hoverTarget = { x: 0, y: 0, active: false };
window.addEventListener('card-hover', (e) => {
    hoverTarget = e.detail;
});
window.addEventListener('card-enter', (e) => {
    fireBurst(e.detail.x, e.detail.y);
});

// ===== MODE GROUPS =====
const modes = {};

// --- Atom mode: 5 orbital ellipses + nucleus + electron cloud ---
function buildAtom() {
    const g = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(15, 0.08, 8, 128);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x88A8D8, transparent: true, opacity: 0.5 });
    for (let i = 0; i < 5; i++) {
        const ring = new THREE.Mesh(ringGeo, ringMat.clone());
        ring.rotation.x = Math.PI / 5 * i;
        ring.rotation.y = Math.PI / 4 * i;
        ring.rotation.z = Math.PI / 6 * i;
        g.add(ring);
        // Electron
        const el = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xA8C0E0 })
        );
        el.userData.ring = ring;
        el.userData.offset = Math.random() * Math.PI * 2;
        el.userData.speed = 0.5 + Math.random() * 0.7;
        g.add(el);
    }
    // Outer thin ring
    const outerRing = new THREE.Mesh(
        new THREE.TorusGeometry(22, 0.04, 6, 128),
        new THREE.MeshBasicMaterial({ color: 0xA8C0E0, transparent: true, opacity: 0.3 })
    );
    outerRing.userData.isOuter = true;
    g.add(outerRing);

    // Electron cloud (small particles around nucleus)
    const cloudCount = 25;
    const cloudGeo = new THREE.BufferGeometry();
    const cloudPos = new Float32Array(cloudCount * 3);
    for (let i = 0; i < cloudCount; i++) {
        const r = 3 + Math.random() * 4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        cloudPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        cloudPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        cloudPos[i * 3 + 2] = r * Math.cos(phi);
    }
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPos, 3));
    const cloud = new THREE.Points(cloudGeo, new THREE.PointsMaterial({
        color: 0xA8C0E0, size: 0.3, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, depthWrite: false
    }));
    g.add(cloud);
    g.userData.cloud = cloud;

    const nucleus = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xA8C0E0, transparent: true, opacity: 0.9 })
    );
    g.add(nucleus);
    g.userData.nucleus = nucleus;
    return g;
}

// --- Orbital mode: 7 spheres (committees) orbiting central core ---
function buildOrbital() {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2, 1),
        new THREE.MeshBasicMaterial({ color: 0x5888C8, wireframe: true, transparent: true, opacity: 0.6 })
    );
    g.add(core);
    for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        const r = 14;
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.9, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x88A8D8, transparent: true, opacity: 0.85 })
        );
        sphere.userData.baseAngle = angle;
        sphere.userData.radius = r;
        sphere.userData.tilt = (Math.random() - 0.5) * 0.4;
        g.add(sphere);

        // Connecting line to core
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r * Math.cos(sphere.userData.tilt), Math.sin(angle) * r * Math.sin(sphere.userData.tilt))
        ]);
        const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x5888C8, transparent: true, opacity: 0.25 }));
        sphere.userData.line = line;
        g.add(line);
    }
    return g;
}

// --- Flow mode: soft wireframe blob ---
function buildFlow() {
    const g = new THREE.Group();
    const geo = new THREE.IcosahedronGeometry(14, 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x5888C8, wireframe: true, transparent: true, opacity: 0.35 });
    const mesh = new THREE.Mesh(geo, mat);
    g.add(mesh);
    g.userData.mesh = mesh;
    g.userData.positions = geo.attributes.position.array.slice();
    return g;
}

// --- Wave mode: plane grid with sine wave ---
function buildWave() {
    const g = new THREE.Group();
    const geo = new THREE.PlaneGeometry(60, 60, 40, 40);
    const mat = new THREE.MeshBasicMaterial({ color: 0x88A8D8, wireframe: true, transparent: true, opacity: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2.5;
    mesh.position.y = -8;
    g.add(mesh);
    g.userData.mesh = mesh;
    g.userData.basePositions = geo.attributes.position.array.slice();
    return g;
}

// --- Timeline mode: connected line sequence ---
function buildTimeline() {
    const g = new THREE.Group();
    const points = [];
    const nodes = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
        const x = (i - count / 2) * 4;
        const y = Math.sin(i * 0.8) * 3;
        const z = Math.cos(i * 0.5) * 2;
        points.push(new THREE.Vector3(x, y, z));
        const node = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xA8C0E0, transparent: true, opacity: 0.9 })
        );
        node.position.set(x, y, z);
        node.userData.baseY = y;
        node.userData.phase = i * 0.5;
        g.add(node);
        nodes.push(node);
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x88A8D8, transparent: true, opacity: 0.5 }));
    g.add(line);
    g.userData.nodes = nodes;
    g.userData.line = line;
    g.userData.points = points;
    return g;
}

// --- Constellation mode: star cluster with lines ---
function buildConstellation() {
    const g = new THREE.Group();
    const starCount = 30;
    const stars = [];
    for (let i = 0; i < starCount; i++) {
        const star = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xA8C0E0, transparent: true, opacity: 0.8 })
        );
        star.position.set(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 15
        );
        g.add(star);
        stars.push(star);
    }
    // Connect near neighbors
    const linePoints = [];
    for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
            if (stars[i].position.distanceTo(stars[j].position) < 8) {
                linePoints.push(stars[i].position.clone(), stars[j].position.clone());
            }
        }
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x5888C8, transparent: true, opacity: 0.25 }));
    g.add(lines);
    g.userData.stars = stars;
    return g;
}

// --- DNA mode: double helix ---
function buildDNA() {
    const g = new THREE.Group();
    const turns = 4;
    const segments = 80;
    const radius = 4;
    const height = 30;
    const strand1 = [];
    const strand2 = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI * 2 * turns;
        const y = (t - 0.5) * height;
        strand1.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
        strand2.push(new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius));
    }
    const m1 = new THREE.LineBasicMaterial({ color: 0x88A8D8, transparent: true, opacity: 0.7 });
    const m2 = new THREE.LineBasicMaterial({ color: 0xA8C0E0, transparent: true, opacity: 0.7 });
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(strand1), m1));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(strand2), m2));
    // Rungs
    const rungMat = new THREE.LineBasicMaterial({ color: 0x5888C8, transparent: true, opacity: 0.4 });
    const nodes = [];
    for (let i = 0; i <= segments; i += 4) {
        const rung = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([strand1[i], strand2[i]]),
            rungMat
        );
        g.add(rung);
        // Node spheres
        const s1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xA8C0E0 })
        );
        s1.position.copy(strand1[i]);
        g.add(s1);
        const s2 = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xA8C0E0 })
        );
        s2.position.copy(strand2[i]);
        g.add(s2);
        nodes.push(s1, s2);
    }
    g.userData.nodes = nodes;
    return g;
}

// --- Neural mode: neural network layers ---
function buildNeural() {
    const g = new THREE.Group();
    const layers = [4, 6, 6, 3];
    const layerSpacing = 7;
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xA8C0E0, transparent: true, opacity: 0.9 });
    const nodes = [];
    const allNodes = [];
    layers.forEach((count, li) => {
        const layerNodes = [];
        const xOffset = (li - (layers.length - 1) / 2) * layerSpacing;
        for (let i = 0; i < count; i++) {
            const y = (i - (count - 1) / 2) * 2.5;
            const node = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), nodeMat.clone());
            node.position.set(xOffset, y, 0);
            node.userData.basePos = node.position.clone();
            node.userData.phase = Math.random() * Math.PI * 2;
            g.add(node);
            layerNodes.push(node);
            allNodes.push(node);
        }
        nodes.push(layerNodes);
    });
    // Connections
    const connMat = new THREE.LineBasicMaterial({ color: 0x5888C8, transparent: true, opacity: 0.2 });
    const conns = [];
    for (let li = 0; li < nodes.length - 1; li++) {
        nodes[li].forEach(a => {
            nodes[li + 1].forEach(b => {
                const line = new THREE.Line(
                    new THREE.BufferGeometry().setFromPoints([a.position, b.position]),
                    connMat.clone()
                );
                line.userData.a = a;
                line.userData.b = b;
                line.userData.phase = Math.random() * Math.PI * 2;
                g.add(line);
                conns.push(line);
            });
        });
    }
    g.userData.nodes = allNodes;
    g.userData.conns = conns;
    return g;
}

modes.atom = buildAtom();
modes.orbital = buildOrbital();
modes.flow = buildFlow();
modes.wave = buildWave();
modes.timeline = buildTimeline();
modes.constellation = buildConstellation();
modes.dna = buildDNA();
modes.neural = buildNeural();

Object.values(modes).forEach(group => {
    group.visible = false;
    group.traverse(obj => {
        if (obj.material) obj.material.transparent = true;
    });
    scene.add(group);
});

let currentMode = 'atom';
let targetMode = 'atom';
let modeFade = 1; // 1 = fully current, 0 = transitioning
modes.atom.visible = true;

function setModeOpacity(group, opacity) {
    group.traverse(obj => {
        if (obj.material && obj.material.transparent) {
            // Store original opacity once
            if (obj.userData._baseOpacity === undefined) {
                obj.userData._baseOpacity = obj.material.opacity;
            }
            obj.material.opacity = obj.userData._baseOpacity * opacity;
        }
    });
}

// ===== SECTION OBSERVER =====
const sectionIds = Object.keys(SECTION_MODES);
const sectionEls = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
let activeSection = 'hero';
let targetTheme = 'dark';
let currentThemeMix = 1; // 1 = dark, 0 = light

const sectionObserver = new IntersectionObserver((entries) => {
    // Pick the entry most in view
    let best = null;
    let bestRatio = 0;
    entries.forEach(e => {
        if (e.intersectionRatio > bestRatio) {
            bestRatio = e.intersectionRatio;
            best = e;
        }
    });
    if (best && best.target.id) {
        activeSection = best.target.id;
        const nextMode = SECTION_MODES[activeSection] || 'flow';
        if (nextMode !== targetMode) {
            targetMode = nextMode;
            modeFade = 0;
            modes[targetMode].visible = true;
        }
        targetTheme = DARK_SECTIONS.has(activeSection) ? 'dark' : 'light';
    }
}, { threshold: [0.25, 0.5, 0.75] });

sectionEls.forEach(el => sectionObserver.observe(el));

// ===== MOUSE PARALLAX =====
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
});

// ===== RESIZE =====
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, 150);
});

// ===== ANIMATE LOOP =====
const clock = new THREE.Clock();
let running = true;

document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) clock.start();
});

function lerp(a, b, t) { return a + (b - a) * t; }

function animate() {
    if (!running) { requestAnimationFrame(animate); return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // Mouse parallax (smooth)
    mouse.x = lerp(mouse.x, mouse.tx, 0.05);
    mouse.y = lerp(mouse.y, mouse.ty, 0.05);
    camera.position.x = mouse.x * 3;
    camera.position.y = -mouse.y * 3;
    camera.lookAt(0, 0, 0);

    // Mouse-follower orb — screen-space to world-space
    {
        const targetScreenX = (mouse.tx + 1) / 2 * window.innerWidth;
        const targetScreenY = (1 - (mouse.ty + 1) / 2) * window.innerHeight;
        const ndc = new THREE.Vector3(
            (targetScreenX / window.innerWidth) * 2 - 1,
            -(targetScreenY / window.innerHeight) * 2 + 1,
            0.5
        );
        ndc.unproject(camera);
        const dir = ndc.sub(camera.position).normalize();
        const distToPlane = (20 - camera.position.z) / dir.z;
        const worldPos = camera.position.clone().add(dir.multiplyScalar(distToPlane));
        orbGroup.position.lerp(worldPos, 0.12);
        const scaleTarget = hoverTarget.active ? 2.2 : 1;
        const currentScale = orbGroup.scale.x;
        const newScale = lerp(currentScale, scaleTarget, 0.1);
        orbGroup.scale.setScalar(newScale);
        orbCore.material.opacity = lerp(orbCore.material.opacity, hoverTarget.active ? 1 : 0.6, 0.1);
        orbHalo.material.opacity = lerp(orbHalo.material.opacity, hoverTarget.active ? 0.5 : 0.2, 0.1);
    }

    // Update bursts
    bursts.forEach(burst => {
        if (!burst.userData.active) return;
        burst.userData.life += dt;
        if (burst.userData.life >= burst.userData.maxLife) {
            burst.userData.active = false;
            burst.material.opacity = 0;
            return;
        }
        const pos = burst.geometry.attributes.position.array;
        const vel = burst.userData.vel;
        for (let i = 0; i < burst.userData.n; i++) {
            pos[i * 3]     += vel[i * 3] * dt;
            pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
            pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
            vel[i * 3]     *= 0.96;
            vel[i * 3 + 1] *= 0.96;
            vel[i * 3 + 2] *= 0.96;
        }
        burst.geometry.attributes.position.needsUpdate = true;
        burst.material.opacity = 1 - (burst.userData.life / burst.userData.maxLife);
    });

    // Theme mix (dark -> light transitions)
    const themeTarget = targetTheme === 'dark' ? 1 : 0;
    currentThemeMix = lerp(currentThemeMix, themeTarget, 0.04);
    const pColor = new THREE.Color().lerpColors(
        new THREE.Color(PALETTE.light.particle),
        new THREE.Color(PALETTE.dark.particle),
        currentThemeMix
    );
    particleMat.color.copy(pColor);
    particleMat.opacity = lerp(0.35, 0.75, currentThemeMix);

    if (!prefersReducedMotion) {
        // Particle drift
        const pos = particleGeo.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            pos[i * 3]     += velocities[i * 3];
            pos[i * 3 + 1] += velocities[i * 3 + 1];
            pos[i * 3 + 2] += velocities[i * 3 + 2];
            // Wrap
            if (Math.abs(pos[i * 3])     > 100) velocities[i * 3]     *= -1;
            if (Math.abs(pos[i * 3 + 1]) > 100) velocities[i * 3 + 1] *= -1;
            if (Math.abs(pos[i * 3 + 2]) > 50)  velocities[i * 3 + 2] *= -1;
        }
        particleGeo.attributes.position.needsUpdate = true;
        particles.rotation.y += dt * 0.02;

        // Far field slow rotation
        farField.rotation.y += dt * 0.005;
        farField.rotation.x += dt * 0.003;

        // Ambient floating shapes
        ambientShapes.forEach((shape, i) => {
            shape.rotation.x += dt * shape.userData.rotSpeed.x;
            shape.rotation.y += dt * shape.userData.rotSpeed.y;
            shape.rotation.z += dt * shape.userData.rotSpeed.z;
            shape.position.y = shape.userData.basePos.y + Math.sin(t * 0.5 + shape.userData.floatOffset) * 1.5;
            shape.position.x = shape.userData.basePos.x + Math.cos(t * 0.3 + shape.userData.floatOffset) * 1;
        });

        // Comets
        nextCometTime -= dt;
        if (nextCometTime <= 0) {
            const free = comets.find(c => !c.userData.active);
            if (free) launchComet(free);
            nextCometTime = 3 + Math.random() * 4;
        }
        comets.forEach(comet => {
            if (!comet.userData.active) return;
            comet.userData.life += dt;
            if (comet.userData.life > comet.userData.maxLife) {
                comet.userData.active = false;
                comet.material.opacity = 0;
                return;
            }
            comet.userData.headX += comet.userData.vx * dt;
            comet.userData.headY += comet.userData.vy * dt;
            const pos = comet.geometry.attributes.position.array;
            const trail = comet.userData.trail;
            // Shift trail: each segment follows the previous
            for (let i = trail - 1; i > 0; i--) {
                pos[i * 3]     = pos[(i - 1) * 3];
                pos[i * 3 + 1] = pos[(i - 1) * 3 + 1];
                pos[i * 3 + 2] = pos[(i - 1) * 3 + 2];
            }
            pos[0] = comet.userData.headX;
            pos[1] = comet.userData.headY;
            pos[2] = -10;
            comet.geometry.attributes.position.needsUpdate = true;
            const fade = 1 - comet.userData.life / comet.userData.maxLife;
            comet.material.opacity = 0.9 * fade;
        });

        // Mode fade (cross-dissolve)
        modeFade = Math.min(1, modeFade + dt * 1.2);
        if (currentMode !== targetMode) {
            setModeOpacity(modes[currentMode], 1 - modeFade);
            setModeOpacity(modes[targetMode], modeFade);
            if (modeFade >= 1) {
                modes[currentMode].visible = false;
                currentMode = targetMode;
            }
        } else {
            setModeOpacity(modes[currentMode], 1);
        }

        // Mode-specific animations
        animateMode(modes.atom, 'atom', t);
        animateMode(modes.orbital, 'orbital', t);
        animateMode(modes.flow, 'flow', t);
        animateMode(modes.wave, 'wave', t);
        animateMode(modes.timeline, 'timeline', t);
        animateMode(modes.constellation, 'constellation', t);
        animateMode(modes.dna, 'dna', t);
        animateMode(modes.neural, 'neural', t);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function animateMode(group, name, t) {
    if (!group.visible) return;
    switch (name) {
        case 'atom': {
            group.rotation.y = t * 0.15;
            group.rotation.x = Math.sin(t * 0.2) * 0.2;
            group.children.forEach(child => {
                if (child.userData.ring) {
                    const ring = child.userData.ring;
                    const angle = t * child.userData.speed + child.userData.offset;
                    const r = 15;
                    child.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
                    child.position.applyEuler(ring.rotation);
                }
                if (child.userData.isOuter) {
                    child.rotation.x = t * 0.1;
                    child.rotation.y = t * 0.15;
                }
            });
            if (group.userData.nucleus) {
                const s = 1 + Math.sin(t * 2) * 0.15;
                group.userData.nucleus.scale.set(s, s, s);
            }
            if (group.userData.cloud) {
                group.userData.cloud.rotation.y = t * 0.4;
                group.userData.cloud.rotation.x = t * 0.25;
            }
            break;
        }
        case 'orbital': {
            group.rotation.y = t * 0.1;
            group.rotation.x = Math.sin(t * 0.15) * 0.15;
            group.children.forEach(child => {
                if (child.userData.baseAngle !== undefined) {
                    const a = child.userData.baseAngle + t * 0.3;
                    const r = child.userData.radius;
                    const tilt = child.userData.tilt;
                    child.position.set(Math.cos(a) * r, Math.sin(a) * r * Math.cos(tilt), Math.sin(a) * r * Math.sin(tilt));
                    if (child.userData.line) {
                        const pts = [new THREE.Vector3(0, 0, 0), child.position.clone()];
                        child.userData.line.geometry.setFromPoints(pts);
                    }
                }
            });
            break;
        }
        case 'flow': {
            group.rotation.y = t * 0.1;
            group.rotation.x = t * 0.05;
            const mesh = group.userData.mesh;
            const base = group.userData.positions;
            const pos = mesh.geometry.attributes.position.array;
            for (let i = 0; i < pos.length; i += 3) {
                const nx = base[i], ny = base[i + 1], nz = base[i + 2];
                const wave = Math.sin(t * 0.8 + nx * 0.1 + ny * 0.1) * 0.8;
                pos[i]     = nx + (nx / 14) * wave;
                pos[i + 1] = ny + (ny / 14) * wave;
                pos[i + 2] = nz + (nz / 14) * wave;
            }
            mesh.geometry.attributes.position.needsUpdate = true;
            break;
        }
        case 'wave': {
            const mesh = group.userData.mesh;
            const base = group.userData.basePositions;
            const pos = mesh.geometry.attributes.position.array;
            for (let i = 0; i < pos.length; i += 3) {
                const x = base[i], y = base[i + 1];
                pos[i + 2] = Math.sin(x * 0.3 + t * 1.5) * 1.5 + Math.cos(y * 0.3 + t) * 1.2;
            }
            mesh.geometry.attributes.position.needsUpdate = true;
            break;
        }
        case 'timeline': {
            group.rotation.y = Math.sin(t * 0.2) * 0.2;
            const pts = [];
            group.userData.nodes.forEach((n, i) => {
                const wave = Math.sin(t * 2 + n.userData.phase) * 0.8;
                n.position.y = n.userData.baseY + wave;
                const pulse = 0.8 + Math.sin(t * 3 + i * 0.5) * 0.3;
                n.scale.setScalar(pulse);
                pts.push(n.position.clone());
            });
            group.userData.line.geometry.setFromPoints(pts);
            break;
        }
        case 'constellation': {
            group.rotation.y = t * 0.08;
            group.rotation.x = Math.sin(t * 0.1) * 0.1;
            group.userData.stars.forEach((s, i) => {
                const pulse = 0.7 + Math.sin(t * 2 + i * 0.7) * 0.3;
                s.material.opacity = 0.6 * pulse;
            });
            break;
        }
        case 'dna': {
            group.rotation.y = t * 0.3;
            group.rotation.x = Math.sin(t * 0.2) * 0.1;
            if (group.userData.nodes) {
                group.userData.nodes.forEach((n, i) => {
                    const pulse = 0.9 + Math.sin(t * 3 + i * 0.4) * 0.3;
                    n.scale.setScalar(pulse);
                });
            }
            break;
        }
        case 'neural': {
            group.rotation.y = Math.sin(t * 0.2) * 0.3;
            group.rotation.x = Math.sin(t * 0.15) * 0.1;
            if (group.userData.nodes) {
                group.userData.nodes.forEach((n, i) => {
                    const pulse = 0.8 + Math.sin(t * 2 + n.userData.phase) * 0.3;
                    n.scale.setScalar(pulse);
                    n.material.opacity = 0.7 + Math.sin(t * 3 + n.userData.phase) * 0.25;
                });
            }
            if (group.userData.conns) {
                group.userData.conns.forEach((line, i) => {
                    const signal = Math.sin(t * 2.5 + line.userData.phase);
                    line.material.opacity = 0.1 + Math.max(0, signal) * 0.4;
                });
            }
            break;
        }
    }
}

animate();
console.log('Three.js sahnesi aktif —', THREE.REVISION);
