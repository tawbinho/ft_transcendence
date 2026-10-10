import { screen } from '@testing-library/react';
import { getAppearanceControls } from '@/app/extensions';
import { renderRoute } from '@/test/render';
import { makeUser } from '@/test/fixtures/users';
import { fakeApi } from '@/test/fakeApi';
import './register';

describe('switching the feature on (register.ts)', () => {
  it('adds the picker to the controls of Settings, and nothing else', () => {
    expect(getAppearanceControls()).toHaveLength(1);
  });

  it('shows the picker next to the accent color in Settings', async () => {
    fakeApi();
    renderRoute('/settings/preferences', { user: makeUser() });
    expect(await screen.findByRole('group', { name: 'Accent color' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Page background' })).toBeInTheDocument();
  });
});
