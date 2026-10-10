// Test helper: jsdom has no WebGL (and no matchMedia, which Board3D asks about
// reduced motion), so tests that need a browser with WebGL 2 fake them.
import { afterEach, vi } from 'vitest';

export function stubWebGL2(): void {
  vi.stubGlobal('WebGL2RenderingContext', class {});
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as never);
}

/** Call once at the top of a test file that uses stubWebGL2. */
export function resetWebGLStub(): void {
  afterEach(() => vi.unstubAllGlobals());
}
