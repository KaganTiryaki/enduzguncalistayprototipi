export function disposeGroup(root) {
    root.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        const m = child.material;
        if (Array.isArray(m)) {
            m.forEach(disposeMaterial);
        } else if (m) {
            disposeMaterial(m);
        }
    });
}

function disposeMaterial(material) {
    for (const key of Object.keys(material)) {
        const value = material[key];
        if (value && typeof value === 'object' && value.isTexture) {
            value.dispose();
        }
    }
    material.dispose();
}
