/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "socket" to receive live updates over Socket.IO. */
  readonly VITE_REALTIME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
