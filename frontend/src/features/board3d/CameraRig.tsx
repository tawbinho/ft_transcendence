// WHY THIS FILE EXISTS
// Puts the camera far enough back to see the whole board, whatever the size
// of the board or of the screen, and lets the player turn the board by
// dragging it (OrbitControls, from the Three.js examples).

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MARGIN = 1.15; // leave 15% of free space around the board

interface CameraRigProps {
  width: number; // size of what must stay in view
  height: number;
}

export function CameraRig({ width, height }: CameraRigProps) {
  const camera = useThree((state) => state.camera as PerspectiveCamera);
  const canvas = useThree((state) => state.gl.domElement);
  const aspect = useThree((state) => state.size.width / state.size.height);
  const controls = useRef<OrbitControls | null>(null);

  // Dragging moves the camera around the board, within limits, so the board
  // is never seen from behind or from under the table.
  useEffect(() => {
    const orbit = new OrbitControls(camera, canvas);
    orbit.enableDamping = true; // keeps turning a little after a drag: smooth
    orbit.enablePan = false; // the board always stays in the middle
    orbit.enableZoom = false; // the mouse wheel keeps scrolling the page
    orbit.minAzimuthAngle = -Math.PI / 3; // up to 60 degrees to the left
    orbit.maxAzimuthAngle = Math.PI / 3; // and to the right
    orbit.minPolarAngle = Math.PI / 4; // from 45 degrees above
    orbit.maxPolarAngle = Math.PI / 2 - 0.05; // down to just above the table
    controls.current = orbit;
    return () => orbit.dispose();
  }, [camera, canvas]);

  // How far back the camera must be for the board to fit, in height and in
  // width (a narrow phone screen needs more distance). camera.fov is the
  // vertical angle of view in degrees; half of it, in radians, is fov * PI / 360.
  useEffect(() => {
    const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);
    const fitHeight = height / 2 / tanHalfFov;
    const fitWidth = width / 2 / (tanHalfFov * aspect);
    // Same viewing angle, new distance from the centre of the board.
    camera.position.setLength(Math.max(fitHeight, fitWidth) * MARGIN);
  }, [camera, aspect, width, height]);

  // The smooth slow-down after a drag needs an update on every frame.
  useFrame(() => controls.current?.update());

  return null;
}
