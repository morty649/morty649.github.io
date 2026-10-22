import type { CreateScene, ScenePalette } from "@/components/experience/types";
import * as THREE from "three";

// Baseline: nested shells, each made of rings that turn on their own axes, so the
// sphere is never quite still. Outer shells are faint; the core is the brand teal.
const SHELLS = [
  { radius: 1, high: 64, low: 36, opacity: 0.22, tone: "faint" },
  { radius: 0.64, high: 48, low: 28, opacity: 0.32, tone: "brand" },
  { radius: 0.36, high: 32, low: 20, opacity: 0.6, tone: "brandDeep" },
] as const;

const SEGMENTS = 128;

function randomDirection() {
  return new THREE.Vector3().randomDirection();
}

export const createScene: CreateScene = ({ quality, palette }) => {
  const group = new THREE.Group();
  const circle = new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: SEGMENTS }, (_, index) => {
      const angle = (index / SEGMENTS) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    })
  );
  const materials = SHELLS.map(
    (shell) => new THREE.LineBasicMaterial({ transparent: true, opacity: shell.opacity, depthWrite: false })
  );
  const rings: { mesh: THREE.LineLoop; axis: THREE.Vector3; speed: number }[] = [];

  SHELLS.forEach((shell, index) => {
    const count = quality === "high" ? shell.high : shell.low;
    for (let ring = 0; ring < count; ring += 1) {
      const mesh = new THREE.LineLoop(circle, materials[index]);
      mesh.scale.setScalar(shell.radius);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), randomDirection());
      group.add(mesh);
      rings.push({ mesh, axis: randomDirection(), speed: (Math.random() - 0.5) * 0.18 });
    }
  });

  const setPalette = (next: ScenePalette) => {
    SHELLS.forEach((shell, index) => materials[index].color.set(next[shell.tone]));
  };
  setPalette(palette);

  return {
    object: group,
    update({ delta, pointer, audio }) {
      for (const ring of rings) ring.mesh.rotateOnAxis(ring.axis, ring.speed * delta);
      group.rotation.y += (pointer.x * 0.35 - group.rotation.y) * 0.05;
      group.rotation.x += (-pointer.y * 0.25 - group.rotation.x) * 0.05;
      group.scale.setScalar(1 + audio.level * 0.04);
    },
    setPalette,
    dispose() {
      circle.dispose();
      materials.forEach((material) => material.dispose());
    },
  };
};
