'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function ImpossibleCube() {
  const { scene } = useThree();
  const cleanupRef = useRef<() => void | null>(null);

  useEffect(() => {
    const group = new THREE.Group();

    // === Material: metallic shiny gray ===
    const metalMat = new THREE.MeshStandardMaterial({
      color: '#b0b0b0',
      metalness: 0.8,
      roughness: 0.2,
    });

    // === Beams for cube frame ===
    const beamGeom = new THREE.BoxGeometry(0.3, 3, 0.3);

    const positions = [
      [-1.5, 0, -1.5],
      [1.5, 0, -1.5],
      [-1.5, 0, 1.5],
      [1.5, 0, 1.5],
    ];

    positions.forEach(([x, y, z]) => {
      const v = new THREE.Mesh(beamGeom, metalMat);
      v.position.set(x, y, z);
      group.add(v);
    });

    const hGeom = new THREE.BoxGeometry(3.3, 0.3, 0.3);

    const horiz = [
      [0, 1.5, -1.5],
      [0, -1.5, -1.5],
      [0, 1.5, 1.5],
      [0, -1.5, 1.5],
    ];

    horiz.forEach(([x, y, z]) => {
      const h = new THREE.Mesh(hGeom, metalMat);
      h.position.set(x, y, z);
      group.add(h);
    });

    const dGeom = new THREE.BoxGeometry(0.3, 0.3, 3.3);

    const depth = [
      [-1.5, 1.5, 0],
      [1.5, 1.5, 0],
      [-1.5, -1.5, 0],
      [1.5, -1.5, 0],
    ];

    depth.forEach(([x, y, z]) => {
      const d = new THREE.Mesh(dGeom, metalMat);
      d.position.set(x, y, z);
      group.add(d);
    });

    // === Impossible diagonals ===
    const diagGeom = new THREE.BoxGeometry(0.3, 0.3, 3.5);
    const diag1 = new THREE.Mesh(diagGeom, metalMat);
    diag1.rotation.y = Math.PI / 4;
    diag1.position.set(0, 1.5, 0);
    group.add(diag1);

    const diag2 = new THREE.Mesh(diagGeom, metalMat);
    diag2.rotation.y = -Math.PI / 4;
    diag2.position.set(0, -1.5, 0);
    group.add(diag2);

    // === Lights ===
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(0xffffff, 1.2);
    directional.position.set(4, 6, 3);

    scene.add(group);
    scene.add(ambient);
    scene.add(directional);

    cleanupRef.current = () => {
      scene.remove(group);
      scene.remove(ambient);
      scene.remove(directional);
      beamGeom.dispose();
      hGeom.dispose();
      dGeom.dispose();
      diagGeom.dispose();
      metalMat.dispose();
    };

    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [scene]);

  return null;
}

export default function ThreeHero({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`w-full rounded-2xl stripes ${
        compact ? 'h-40' : 'h-[60vh]'
      }`}
    >
      <Canvas camera={{ position: [4, 8, 8], fov: 45 }}>
        <ImpossibleCube />
        <OrbitControls enablePan={false} enableZoom={false} autoRotate={true} />
      </Canvas>
    </div>
  );
}
