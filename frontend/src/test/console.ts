import { afterEach, beforeEach, vi } from 'vitest';

// The subject rejects a project that prints errors or warnings in the browser
// console, so a test fails when the page it renders does. A test that expects
// a message calls allowConsole() first.

type ConsoleMethod = 'error' | 'warn';
const METHODS: ConsoleMethod[] = ['error', 'warn'];

let printed: string[] = [];
let allowed = false;

/** Use in a test that is supposed to cause a console error or warning. */
export function allowConsole(): void {
  allowed = true;
}

const describeCall = (method: ConsoleMethod, args: unknown[]) =>
  `console.${method}: ${args.map((arg) => (arg instanceof Error ? arg.message : String(arg))).join(' ')}`.slice(0, 400);

/** Registers the guard for every test file; called from setup.ts. */
export function installConsoleGuard(): void {
  beforeEach(() => {
    printed = [];
    allowed = false;
    for (const method of METHODS) {
      vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
        printed.push(describeCall(method, args));
      });
    }
  });

  afterEach(() => {
    const messages = printed;
    printed = [];
    if (!allowed && messages.length > 0) {
      throw new Error(
        `The test printed to the console (call allowConsole() if that is expected):\n${messages.join('\n')}`,
      );
    }
  });
}
