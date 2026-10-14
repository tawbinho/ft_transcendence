/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "socket" to receive live updates over Socket.IO. */
  readonly VITE_REALTIME?: string;
  /** "off" builds the app without the optional 3D board (see src/features/board3d/README.md). */
  readonly VITE_BOARD_3D?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
