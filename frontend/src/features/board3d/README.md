# 3D board (optional)

A 3D view of the Connect Four board, drawn with Three.js through react-three-fiber (a React renderer: `<mesh>`
creates a `THREE.Mesh`). Games get a 2D / 3D switch above the board; the choice is saved in the browser
(`localStorage`, key `board-view`). The 3D board has no game rules: it draws the state it is given and calls
`onPlay(col)`, so the engine (or the server) still decides every move. Spectators get the same view, read-only.

## Files

| File                           | Job                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `Board3DView.tsx`              | The link to the app: takes the same props as the 2D board and gives them to `Board3D` |
| `Board3D.tsx`                  | The component: canvas, discs, column picking with the mouse, keyboard play            |
| `Frame.tsx`                    | The frame: a 2D shape with holes, extruded into 3D, plus two feet                     |
| `Disc.tsx`                     | A disc that falls with gravity and bounces, and the hover preview disc                |
| `Stage.tsx`                    | Background (the page's colour), fog, lighting, the shadow-casting light, the table    |
| `CameraRig.tsx`                | Fits the camera to the board; drag to turn it                                         |
| `Confetti.tsx`                 | The win celebration (one instanced mesh)                                              |
| `layout.ts`                    | Every size, and where each hole is                                                    |
| `themes.ts`                    | Colours of the frame and discs for the four board themes                              |
| `*.test.ts(x)`, `webglStub.ts` | Tests (they are deleted with the folder)                                              |

## How it is connected

Only one line outside this folder knows about it: `src/features/game/components/GameBoard.tsx` (every game screen
draws its board through it) loads `Board3DView` lazily, so Three.js (about 250 kB gzipped) is a separate file that
is downloaded only when someone switches to 3D. `GameBoard` shows the switch only when the browser supports WebGL 2.
While the 3D code loads, the 2D board stays on screen; if 3D fails to load or crashes, the 2D board comes back and
the switch is hidden for the rest of the visit.

The 3D board does not choose its size or its background. It fills the box (the "stage", `boardStage.css`) that
`GameBoard` puts both boards in, so switching between 2D and 3D moves nothing, and `Board3DView` gives it the
page's `--c-surface-2` colour as the room's backdrop, so the canvas is light on a light page and dark on a dark one.

## Turn it off without deleting anything

Build with `VITE_BOARD_3D=off` (see `.env.example`; the Dockerfile has `ARG VITE_BOARD_3D=on`). The 3D code and
Three.js are then left out of the build.

## Remove it for good

1. Delete this folder: `rm -r src/features/board3d`
2. In `src/features/game/components/GameBoard.tsx`, replace the two lines that define `Board3D` with
   `const Board3D: React.ComponentType<BoardProps> | null = null;`
3. Remove the libraries and their lock file entries: `npm uninstall three @react-three/fiber @types/three`
4. Optional tidy-up: the `board3d` texts (`src/i18n/locales/*/board3d.ts`), `VITE_BOARD_3D` in `.env.example`,
   the `Dockerfile` and `src/vite-env.d.ts`. Leaving them does no harm.

`npm run typecheck`, `npm test` and `npm run build` pass after steps 1 to 3.

## Versions

Keep `three` on `~0.182.0`: React Three Fiber 9 creates a `THREE.Clock`, and Three.js 0.183 and later print a
deprecation warning for it in the console, which the subject does not allow. `@react-three/fiber` 9.8 works with
React up to 19.3.

## Explaining it

- **How is the board made?** `Frame.tsx` draws a rectangle (`THREE.Shape`), cuts one circle (`THREE.Path`) per
  square into it, and `ExtrudeGeometry` pushes it into 3D with rounded edges. Discs sit inside the frame's thickness.
- **How does a disc fall?** In `Disc.tsx`, on every frame: `speed += gravity * dt`, `y -= speed * dt`. At its hole it
  bounces with 25% of the speed. `dt` is the time since the last frame, so it takes the same time at 60 or 144 Hz.
  Only the disc of the last move falls; the others appear in place.
- **Which column was clicked?** Each column has an invisible box. react-three-fiber casts a ray from the camera through
  the mouse (`THREE.Raycaster`) and calls `onClick` on the first box it hits. A click after the mouse moved more than
  8 pixels was a drag to turn the board, so it is ignored.
- **Where does the light come from?** A generated room (`RoomEnvironment`) blurred by `PMREMGenerator` gives soft light
  and reflections with no image file; one directional light casts the shadows (rendered from the light into a depth
  texture, the shadow map).
- **Why is the confetti one `InstancedMesh`?** 160 meshes would be 160 draw calls; an instanced mesh draws the same
  rectangle 160 times in one call.
- **How does the camera fit any board?** `CameraRig.tsx` computes the distance at which the board fills the angle of
  view, `distance = (height / 2) / tan(fov / 2)`, for the height and for the width, and keeps the larger plus 30%.
- **Without WebGL 2?** `GameBoard` does not offer 3D at all, and `Board3D` itself shows a text instead of crashing.
- **Keyboard?** Focus the board, left and right arrows choose a column (Home and End jump to the first and last),
  Enter or Space drops a disc. There are no number keys: 1 to 9 cannot reach a tenth column, and on a French keyboard the digits need Shift. A hidden live region tells screen readers which column is chosen.
