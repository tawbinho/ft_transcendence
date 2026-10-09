// WHY THIS FILE EXISTS
// The room the board stands in: background, fog, lights, shadows and the
// table. This is what turns a board floating in empty space into a scene.
// The room's colour is given by the page (the backdrop prop), so it is light on
// a light page and dark on a dark one.

import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Color, PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

interface StageProps {
  backdrop: string; // background colour, and the fog colour the table fades into
  floorY: number; // height of the table top
}

export function Stage({ backdrop, floorY }: StageProps) {
  const renderer = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  // Image-based lighting. Three.js renders a simple lit room once into an
  // "environment map", blurred for rough surfaces (PMREM). Every material
  // then picks up soft light and reflections from it, so the plastic looks
  // glossy from any angle. No image file is downloaded.
  useEffect(() => {
    const generator = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = generator.fromScene(room, 0.04);
    room.dispose();
    generator.dispose();
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.5;
    return () => {
      scene.environment = null;
      environment.dispose();
    };
  }, [renderer, scene]);

  // The table is a little darker than a light backdrop so the shadows show on it; on a
  // dark backdrop it is a little lighter, because the lights already brighten it.
  // (Lightness here is in three.js's linear colour space, where dark colours are near 0.)
  const table = useMemo(() => {
    const color = new Color(backdrop);
    const isLight = color.getHSL({ h: 0, s: 0, l: 0 }).l > 0.5;
    return color.offsetHSL(0, 0, isLight ? -0.06 : 0.015);
  }, [backdrop]);

  return (
    <>
      <color attach="background" args={[backdrop]} />
      {/* Far away, everything fades into the background colour, so the table
          has no visible edge. Starts well behind the board. */}
      <fog attach="fog" args={[backdrop, 40, 120]} />

      {/* The "sun": the only light that casts shadows. The shadow camera is
          the box, seen from the light, inside which shadows are computed;
          radius blurs their edges. */}
      <directionalLight
        position={[6, 12, 9]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={6}
        shadow-bias={-0.0005}
      >
        <orthographicCamera attach="shadow-camera" args={[-12, 12, 12, -12, 1, 50]} />
      </directionalLight>

      {/* The table top. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color={table} roughness={0.85} />
      </mesh>
    </>
  );
}
