// WHY THIS FILE EXISTS
// The discs. A new disc falls into its hole with gravity and a small bounce,
// and the discs of the winning line slide forward and glow.
//
// The animations change the Three.js objects directly inside useFrame, which
// runs before every frame is drawn (about 60 times a second). Going through
// React state that often would re-render the whole board for nothing: the
// game itself does not change while a disc is falling.

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, MeshPhysicalMaterial } from 'three';
import { DISC_DEPTH, DISC_RADIUS } from './layout';

const GRAVITY = 40; // units per second squared: faster than real, feels snappier
const BOUNCE = 0.25; // share of its speed a disc keeps when it lands
const POP_OUT = 0.3; // how far a winning disc slides out of the frame

// A cylinder stands along the y axis. Turning it 90 degrees around x makes its
// flat face look at the camera.
const FACING_CAMERA: [number, number, number] = [Math.PI / 2, 0, 0];

interface DiscProps {
  x: number;
  y: number; // centre of the hole the disc ends up in
  color: string;
  dropFrom: number | null; // height to fall from, or null to appear in place
  glowing: boolean; // part of the winning line
}

export function Disc({ x, y, color, dropFrom, glowing }: DiscProps) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<MeshPhysicalMaterial>(null);
  const [startY] = useState(dropFrom ?? y); // read once, when the disc appears
  const speed = useRef(0); // falling speed; positive means going down

  useFrame(({ clock }, delta) => {
    if (!mesh.current || !material.current) return;
    const position = mesh.current.position;
    // delta is the time since the last frame, in seconds, so the disc moves at
    // the same speed on a 60 Hz and on a 144 Hz screen. It is capped at a
    // tenth of a second so a very late frame (a tab coming back from the
    // background) cannot make the disc jump.
    const dt = Math.min(delta, 0.1);

    // Falling: gravity increases the speed, the speed moves the disc down.
    if (position.y > y || speed.current !== 0) {
      speed.current += GRAVITY * dt;
      position.y -= speed.current * dt;
      if (position.y <= y) {
        // Landed: bounce back up with part of the speed, or stop when slow.
        position.y = y;
        speed.current = speed.current > 2 ? -speed.current * BOUNCE : 0;
      }
    }

    // Winning line: slide towards the player and pulse.
    const targetZ = glowing ? POP_OUT : 0;
    position.z += (targetZ - position.z) * Math.min(1, dt * 6);
    material.current.emissiveIntensity = glowing ? 0.35 + 0.25 * Math.sin(clock.elapsedTime * 6) : 0;
  });

  return (
    <mesh ref={mesh} position={[x, startY, 0]} rotation={FACING_CAMERA} castShadow receiveShadow>
      <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, DISC_DEPTH, 40]} />
      {/* Physical material with a clear coat: shiny plastic. */}
      <meshPhysicalMaterial
        ref={material}
        color={color}
        emissive={color}
        emissiveIntensity={0}
        roughness={0.35}
        clearcoat={0.8}
        clearcoatRoughness={0.15}
      />
    </mesh>
  );
}

interface PreviewDiscProps {
  x: number;
  y: number;
  color: string;
}

// The see-through disc that floats above the column the player points at, in
// the colour of the player whose turn it is.
export function PreviewDisc({ x, y, color }: PreviewDiscProps) {
  const mesh = useRef<Mesh>(null);
  const [startX] = useState(x); // after that, useFrame moves it

  useFrame(({ clock }, delta) => {
    if (!mesh.current) return;
    const position = mesh.current.position;
    position.x += (x - position.x) * Math.min(1, delta * 15); // glide to the column
    position.y = y + Math.sin(clock.elapsedTime * 3) * 0.06; // float up and down
  });

  return (
    <mesh ref={mesh} position={[startX, y, 0]} rotation={FACING_CAMERA}>
      <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, DISC_DEPTH, 40]} />
      <meshStandardMaterial color={color} transparent opacity={0.55} />
    </mesh>
  );
}
