import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Kbd } from './Kbd';

describe('Kbd', () => {
  it('writes a key as keyboard text', () => {
    renderWithProviders(
      <p>
        Press <Kbd>Enter</Kbd> to drop the disc.
      </p>,
    );

    const key = screen.getByText('Enter');
    expect(key.tagName).toBe('KBD');
  });
});
