import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { sendOverNetwork, setTransport } from '@/lib/api/http';
import { installConsoleGuard } from './console';

installConsoleGuard();

// jsdom has no layout, so it does not implement scrolling; the router calls it on every navigation.
window.scrollTo = () => {};

afterEach(() => {
  cleanup();
  // Nothing a test saved or faked may leak into the next one.
  window.localStorage.clear();
  setTransport(sendOverNetwork);
});
