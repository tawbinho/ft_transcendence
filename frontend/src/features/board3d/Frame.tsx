// WHY THIS FILE EXISTS
// The plastic frame of the board. It starts as a flat 2D rectangle with one
// round hole per square, which Three.js then "extrudes" (pushes into 3D, like
// a cookie cutter through dough) to give it depth. Two feet make it stand on
// the table.

import { useMemo } from 'react';
import { Path, Shape } from 'three';
import { FOOT_HEIGHT, FRAME_DEPTH, HOLE_RADIUS, frameSize, holeX, holeY } from './layout';

// The bevel rounds the edges of the frame and of every hole.
const EXTRUDE_SETTINGS = {
  depth: FRAME_DEPTH,
  bevelEnabled: true,
  bevelThickness: 0.04,
  bevelSize: 0.04,
  bevelSegments: 3,
  curveSegments: 24, // more segments = rounder holes
};

// The outline of the frame with a hole for every square.
function frameShape(cols: number, rows: number): Shape {
  const { width, height } = frameSize(cols, rows);
  const shape = new Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const hole = new Path();
      hole.absarc(holeX(col, cols), holeY(row, rows), HOLE_RADIUS, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
  }
  return shape;
}

interface FrameProps {
  cols: number;
  rows: number;
  color: string;
}

export function Frame({ cols, rows, color }: FrameProps) {
  const { width, height } = frameSize(cols, rows);
  // Building the shape is the slow part, so it is only redone when the board
  // size changes, not on every move.
  const shape = useMemo(() => frameShape(cols, rows), [cols, rows]);

  return (
    <group>
      {/* The extrusion grows from z = 0 to z = FRAME_DEPTH. Moving it back by
          half centres the frame on z = 0, which is where the discs are. */}
      <mesh position={[0, 0, -FRAME_DEPTH / 2]} castShadow receiveShadow>
        <extrudeGeometry args={[shape, EXTRUDE_SETTINGS]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>

      {/* One foot under each side. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (width / 2 - 0.3), -height / 2 - FOOT_HEIGHT / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.6, FOOT_HEIGHT, 1.8]} />
          <meshStandardMaterial color={color} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
