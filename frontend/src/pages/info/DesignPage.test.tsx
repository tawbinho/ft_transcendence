import { screen, within } from '@testing-library/react';
import * as icons from '@/components/icons';
import { expectNoA11yViolations } from '@/test/axe';
import { renderRoute } from '@/test/render';

// Every shared component of components/ui and components/ must be shown on the page.
const COMPONENTS = [
  'Alert',
  'Avatar',
  'Badge',
  'Button',
  'Card',
  'CheckboxField',
  'ConfirmDialog',
  'EmptyState',
  'IconButton',
  'Kbd',
  'LoadError',
  'ModeCard',
  'OptionGroup',
  'Pagination',
  'RangeField',
  'SelectField',
  'StatTiles',
  'Switch',
  'TabLinks',
  'TextField',
];

describe('/design', () => {
  it('has one title and a heading for each part of the page', async () => {
    renderRoute('/design', { user: null });

    expect(await screen.findByRole('heading', { level: 1, name: 'Design system' })).toBeInTheDocument();
    for (const name of ['Identity', 'Colors', 'Type', 'Icons', 'Actions', 'Fields', 'Feedback']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
    // The list at the top links to those parts.
    const contents = screen.getByRole('navigation', { name: 'On this page' });
    expect(within(contents).getByRole('link', { name: 'Colors' })).toHaveAttribute('href', '#colors');
  });

  it('shows every shared component', async () => {
    renderRoute('/design', { user: null });
    await screen.findByRole('heading', { level: 1 });

    const shown = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent ?? '');
    for (const name of COMPONENTS) {
      expect(
        shown.some((text) => text.includes(name)),
        name,
      ).toBe(true);
    }
  });

  it('shows every icon of the app', async () => {
    const { container } = renderRoute('/design', { user: null });
    await screen.findByRole('heading', { level: 1 });

    const names = Object.keys(icons).filter((name) => name.endsWith('Icon') && name !== 'Icon');
    expect(names.length).toBeGreaterThan(40);
    for (const name of names) expect(container).toHaveTextContent(name);
  });

  it('shows the palette of both themes', async () => {
    const { container } = renderRoute('/design', { user: null });
    await screen.findByRole('heading', { level: 1 });

    expect(container.querySelector('[data-theme="light"]')).not.toBeNull();
    expect(container.querySelector('[data-theme="dark"]')).not.toBeNull();
  });

  it('switches the accent color from the page', async () => {
    const { events } = renderRoute('/design', { user: null });
    await screen.findByRole('heading', { level: 1 });

    await events.click(screen.getByRole('radio', { name: 'Rose' }));
    expect(document.documentElement.dataset.accent).toBe('rose');
    delete document.documentElement.dataset.accent;
  });

  it('has no accessibility problems', async () => {
    const { container } = renderRoute('/design', { user: null });
    await screen.findByRole('heading', { level: 1 });

    await expectNoA11yViolations(container);
  });
});
