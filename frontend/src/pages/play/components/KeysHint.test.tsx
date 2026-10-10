import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { KeysHint } from './KeysHint';

describe('KeysHint', () => {
  it('shows the arrow keys and the digit keys as keys, each beside what it does', () => {
    renderWithProviders(<KeysHint />);

    expect(screen.getByText('Keys:')).toBeInTheDocument();
    expect(screen.getByText('←').tagName).toBe('KBD');
    expect(screen.getByText('→').tagName).toBe('KBD');
    expect(screen.getByText('to move')).toBeInTheDocument();
    expect(screen.getByText('1').tagName).toBe('KBD');
    expect(screen.getByText('9').tagName).toBe('KBD');
    expect(screen.getByText('to drop a disc')).toBeInTheDocument();
  });
});
