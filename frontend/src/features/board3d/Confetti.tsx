// WHY THIS FILE EXISTS
// Confetti when a player wins. All the pieces are ONE InstancedMesh: the
// graphics card draws the same small rectangle 160 times in a single draw
// call, each copy with its own position, rotation and colour. 160 separate
// meshes would cost 160 draw calls.

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, Euler, Object3D, Vector3, type InstancedMesh } from 'three';

const COUNT = 160;
const GRAVITY = 9;
const MAX_FALL_SPEED = 2.2; // air holds paper back: it never falls faster than this

interface Piece {
  position: Vector3;
  velocity: Vector3;
  rotation: Euler;
  spin: number; // how fast it tumbles
}

// Every piece starts at the winning line and is thrown up, out and towards the
// player, at random.
function launch(x: number, y: number): Piece[] {
  return Array.from({ length: COUNT }, () => ({
    position: new Vector3(x, y, 0.4),
    velocity: new Vector3((Math.random() - 0.5) * 9, 3 + Math.random() * 6, 0.5 + Math.random() * 3.5),
    rotation: new Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
    spin: 3 + Math.random() * 6,
  }));
}

interface ConfettiProps {
  x: number; // where the burst starts
  y: number;
  floorY: number; // where the pieces come to rest
  color1: string;
  color2: string;
}

export function Confetti({ x, y, floorY, color1, color2 }: ConfettiProps) {
  const mesh = useRef<InstancedMesh>(null);
  const pieces = useMemo(() => launch(x, y), [x, y]);
  // A helper object: set its position and rotation, read back its matrix.
  const helper = useMemo(() => new Object3D(), []);

  // Half the pieces in each player's colour.
  useLayoutEffect(() => {
    const instances = mesh.current;
    if (!instances) return;
    const color = new Color();
    for (let i = 0; i < COUNT; i++) {
      instances.setColorAt(i, color.set(i % 2 === 0 ? color1 : color2));
    }
    if (instances.instanceColor) instances.instanceColor.needsUpdate = true;
  }, [color1, color2]);

  useFrame((_, delta) => {
    const instances = mesh.current;
    if (!instances) return;
    const dt = Math.min(delta, 0.1);

    pieces.forEach((piece, i) => {
      if (piece.position.y > floorY) {
        piece.velocity.y = Math.max(piece.velocity.y - GRAVITY * dt, -MAX_FALL_SPEED);
        piece.velocity.x *= 1 - dt; // air also slows the sideways drift
        piece.velocity.z *= 1 - dt;
        piece.position.addScaledVector(piece.velocity, dt);
        piece.rotation.x += piece.spin * dt;
        piece.rotation.y += piece.spin * 0.6 * dt;
        if (piece.position.y <= floorY) {
          // Reached the table: lie flat and stay there.
          piece.position.y = floorY + 0.01;
          piece.rotation.set(-Math.PI / 2, 0, piece.rotation.z);
        }
      }
      helper.position.copy(piece.position);
      helper.rotation.copy(piece.rotation);
      helper.updateMatrix();
      instances.setMatrixAt(i, helper.matrix);
    });
    instances.instanceMatrix.needsUpdate = true; // send the new matrices to the GPU
  });

  return (
    // The pieces fly everywhere, so skip the "is it on screen?" test and
    // always draw them (frustumCulled={false}).
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} castShadow frustumCulled={false}>
      <planeGeometry args={[0.14, 0.22]} />
      <meshStandardMaterial side={DoubleSide} roughness={0.6} />
    </instancedMesh>
  );
}
