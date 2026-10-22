import { Navigate, createBrowserRouter, type RouteObject } from 'react-router';
import { PageSpinner } from '@/components/ui';
import { AppLayout } from '@/layout/AppLayout';
import { RouteError } from '@/layout/RouteError';
import { NotFoundPage } from '@/pages/info/NotFoundPage';
import { GuestOnly, RequireAuth } from './guards';

// Every page is its own chunk, downloaded when first visited. A page lives in
// src/pages/<area>/<Name>Page.tsx. Links to pages with a parameter are built in
// ./paths.ts.

/** Open to everyone. */
const publicRoutes: RouteObject[] = [
  { index: true, lazy: () => import('@/pages/home/HomePage').then((m) => ({ Component: m.HomePage })) },
  { path: 'play', lazy: () => import('@/pages/play/PlayPage').then((m) => ({ Component: m.PlayPage })) },
  {
    path: 'play/local',
    lazy: () => import('@/pages/play/LocalGamePage').then((m) => ({ Component: m.LocalGamePage })),
  },
  {
    path: 'tournaments',
    lazy: () => import('@/pages/tournaments/TournamentsPage').then((m) => ({ Component: m.TournamentsPage })),
  },
  {
    path: 'forgot-password',
    lazy: () => import('@/pages/auth/ForgotPasswordPage').then((m) => ({ Component: m.ForgotPasswordPage })),
  },
  {
    path: 'verify-email',
    lazy: () => import('@/pages/auth/VerifyEmailPage').then((m) => ({ Component: m.VerifyEmailPage })),
  },
  { path: 'privacy', lazy: () => import('@/pages/info/legal/LegalPage').then((m) => ({ Component: m.PrivacyPage })) },
  { path: 'terms', lazy: () => import('@/pages/info/legal/LegalPage').then((m) => ({ Component: m.TermsPage })) },
];

/** Visitors only: a logged-in user is sent on to where they were heading. */
const visitorRoutes: RouteObject[] = [
  { path: 'login', lazy: () => import('@/pages/auth/LoginPage').then((m) => ({ Component: m.LoginPage })) },
  { path: 'signup', lazy: () => import('@/pages/auth/SignupPage').then((m) => ({ Component: m.SignupPage })) },
];

/** Logged-in users only: visitors are sent to the login page. */
const memberRoutes: RouteObject[] = [
  { path: 'play/online', lazy: () => import('@/pages/play/NewMatchPage').then((m) => ({ Component: m.NewMatchPage })) },
  { path: 'matches/:matchId', lazy: () => import('@/pages/play/MatchPage').then((m) => ({ Component: m.MatchPage })) },
  { path: 'matches', lazy: () => import('@/pages/history/HistoryPage').then((m) => ({ Component: m.HistoryPage })) },
  {
    path: 'tournaments/new',
    lazy: () => import('@/pages/tournaments/NewTournamentPage').then((m) => ({ Component: m.NewTournamentPage })),
  },
  {
    path: 'tournaments/:tournamentId',
    lazy: () => import('@/pages/tournaments/TournamentPage').then((m) => ({ Component: m.TournamentPage })),
  },
  {
    path: 'users/:displayName',
    lazy: () => import('@/pages/profile/ProfilePage').then((m) => ({ Component: m.ProfilePage })),
  },
  {
    // The optional section is one of profile, security, preferences and blocked.
    path: 'settings/:section?',
    lazy: () => import('@/pages/settings/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
  },
  // The settings page used to be called "account".
  { path: 'account', element: <Navigate to="/settings" replace /> },
  {
    path: 'players',
    lazy: () => import('@/pages/community/PlayersPage').then((m) => ({ Component: m.PlayersPage })),
  },
  {
    path: 'leaderboard',
    lazy: () => import('@/pages/community/LeaderboardPage').then((m) => ({ Component: m.LeaderboardPage })),
  },
  { path: 'friends', lazy: () => import('@/pages/community/FriendsPage').then((m) => ({ Component: m.FriendsPage })) },
  {
    // One route for the list and a conversation, so the page stays mounted between them.
    path: 'chat/:displayName?',
    lazy: () => import('@/pages/community/ChatPage').then((m) => ({ Component: m.ChatPage })),
  },
];

/** The whole route table. */
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageSpinner />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          ...publicRoutes,
          { element: <GuestOnly />, children: visitorRoutes },
          { element: <RequireAuth />, children: memberRoutes },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
