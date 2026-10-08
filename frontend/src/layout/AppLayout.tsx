import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, ScrollRestoration, useLocation, useNavigation } from 'react-router';
import { useRealtimeSync } from '@/app/realtime';
import { DemoBanner } from './DemoBanner';
import { Footer } from './Footer';
import { Header } from './Header';

export function AppLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigation = useNavigation();
  const main = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  useRealtimeSync();

  // After a client-side navigation, move focus to the new page so keyboard and
  // screen reader users start reading from its top (like a real page load).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    main.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-fg focus:not-sr-only focus:fixed focus:start-3 focus:top-3"
      >
        {t('nav.skipToContent')}
      </a>
      {navigation.state === 'loading' && (
        <div className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-primary" aria-hidden="true" />
      )}
      <Header />
      <DemoBanner />
      <main
        id="main"
        ref={main}
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none sm:py-10"
      >
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
