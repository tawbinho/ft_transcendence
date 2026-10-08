/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Comma-separated features answered by the in-browser demo server (see src/config.ts). */
  readonly VITE_DEMO_FEATURES?: string;
  /** "socket" to receive live updates over Socket.IO once the backend has a gateway. */
  readonly VITE_REALTIME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
