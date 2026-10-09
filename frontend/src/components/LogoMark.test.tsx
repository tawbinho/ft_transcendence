import { render } from '@testing-library/react';
import { LogoMark } from './LogoMark';
import { LogoMark as LogoFromIcons } from './icons';

describe('LogoMark', () => {
  it('is a decorative picture', () => {
    const { container } = render(<LogoMark />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('is a board of 4 by 4 holes with four yellow discs connected on a diagonal', () => {
    const { container } = render(<LogoMark />);
    const discs = [...container.querySelectorAll('circle')];

    expect(discs).toHaveLength(16);
    expect(discs.filter((disc) => disc.getAttribute('fill') === '#f9c623')).toHaveLength(4);
  });

  it('still comes from the icons file, where the header imports it', () => {
    expect(LogoFromIcons).toBe(LogoMark);
  });
});
