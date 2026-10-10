import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Footer } from './Footer';

describe('the footer', () => {
  it('links the privacy policy, the terms and the design system', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms of service' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Design system' })).toHaveAttribute('href', '/design');
  });

  it('no longer holds the appearance select (the header has a theme button)', () => {
    renderWithProviders(<Footer />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
