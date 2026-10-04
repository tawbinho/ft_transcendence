import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n, { LANGUAGES } from '../i18n';
import { useAuth } from '../features/auth/AuthContext';

function useHighContrast() {
  const [on, setOn] = useState(() => localStorage.getItem('cfa.theme') === 'high-contrast');
  useEffect(() => {
    const el = document.documentElement;
    if (on) el.dataset.theme = 'high-contrast';
    else delete el.dataset.theme;
    localStorage.setItem('cfa.theme', on ? 'high-contrast' : 'normal');
  }, [on]);
  return [on, setOn] as const;
}

const navItems = [
  { to: '/play', key: 'nav.play' },
  { to: '/spectate', key: 'nav.spectate' },
  { to: '/tournaments', key: 'nav.tournaments' },
  { to: '/leaderboard', key: 'nav.leaderboard' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [highContrast, setHighContrast] = useHighContrast();

  return (
    <div className="flex min-h-full flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded-lg focus:bg-raised focus:px-4 focus:py-2 focus:shadow-clay">
        {t('common.skipToContent')}
      </a>

      <header className="sticky top-0 z-20 bg-canvas shadow-clay-sm">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3" aria-label="Primary">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold">
            <span className="grid grid-cols-2 gap-0.5" aria-hidden>
              <i className="h-3 w-3 rounded-full bg-disc1" />
              <i className="h-3 w-3 rounded-full bg-disc2" />
              <i className="h-3 w-3 rounded-full bg-disc2" />
              <i className="h-3 w-3 rounded-full bg-disc1" />
            </span>
            {t('app.name')}
          </Link>

          <div className="ms-auto flex flex-wrap items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-2xl px-3 py-2 text-sm font-bold transition ${
                    isActive ? 'text-ink shadow-clay-sm' : 'text-muted hover:text-ink'
                  }`
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink to="/profile" className="rounded-2xl px-3 py-2 text-sm font-bold text-muted hover:text-ink">
                  {user.displayName}
                </NavLink>
                <button
                  onClick={() => void logout()}
                  className="rounded-2xl bg-raised px-4 py-2 text-sm font-bold shadow-clay-sm active:shadow-clay-in"
                >
                  {t('nav.signOut')}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-2xl bg-accent-strong px-4 py-2 text-sm font-bold text-white shadow-clay-sm active:shadow-clay-in"
              >
                {t('nav.signIn')}
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>

      <footer className="mt-10 border-t border-well">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-6 text-sm text-muted">
          <span>© 2026 {t('app.name')} — {t('footer.tagline')}</span>
          <div className="ms-auto flex items-center gap-3">
            <label className="flex items-center gap-2">
              <span className="sr-only">{t('profile.language')}</span>
              <select
                value={i18n.language}
                onChange={(e) => void i18n.changeLanguage(e.target.value)}
                className="rounded-xl bg-raised px-2 py-1 shadow-clay-in"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => setHighContrast((v) => !v)}
              className="rounded-xl bg-raised px-3 py-1 shadow-clay-sm active:shadow-clay-in"
              aria-pressed={highContrast}
            >
              {t('profile.highContrast')}
            </button>
            <Link to="/privacy" className="underline underline-offset-2 hover:text-ink">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="underline underline-offset-2 hover:text-ink">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
