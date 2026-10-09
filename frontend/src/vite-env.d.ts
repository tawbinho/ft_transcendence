/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Comma-separated features answered by the in-browser demo server (see src/config.ts). */
  readonly VITE_DEMO_FEATURES?: string;
  /** "socket" to receive live updates over Socket.IO once the backend has a gateway. */
  readonly VITE_REALTIME?: string;
  /** "off" builds the app without the optional 3D board (see src/features/board3d/README.md). */
  readonly VITE_BOARD_3D?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
