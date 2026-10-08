import axe from 'axe-core';

/**
 * Fails when axe-core finds accessibility problems in what a test rendered.
 * Checks WCAG 2.0 and 2.1 level A and AA. Color contrast needs real layout,
 * which jsdom does not have, so it is checked in the browser instead
 * (page-check with --axe).
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const result = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  const problems = result.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help}\n` +
      violation.nodes.map((node) => `  ${node.html.slice(0, 160)}`).join('\n'),
  );
  if (problems.length > 0) throw new Error(`Accessibility problems:\n${problems.join('\n')}`);
}
