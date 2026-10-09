import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { sendOverNetwork, setTransport } from '@/lib/api/http';
import { installConsoleGuard } from './console';

installConsoleGuard();

// jsdom has no layout, so it does not implement scrolling; the router calls it on every navigation.
window.scrollTo = () => {};

// jsdom has no canvas either: it prints a long "Not implemented" error whenever code asks for one
// (axe-core does, to measure icon fonts). Answering "no canvas" keeps the test output readable;
// axe then skips that measurement. Tests that need a canvas fake it in their own file.
HTMLCanvasElement.prototype.getContext = () => null;

afterEach(() => {
  cleanup();
  // Nothing a test saved or faked may leak into the next one.
  window.localStorage.clear();
  setTransport(sendOverNetwork);
});
