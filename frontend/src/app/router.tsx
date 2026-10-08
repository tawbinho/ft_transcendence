import { createBrowserRouter } from 'react-router';
import { PageSpinner } from '@/components/ui';
import { AppLayout } from '@/layout/AppLayout';
import { RouteError } from '@/layout/RouteError';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { GuestOnly, RequireAuth } from './guards';

// Every page is its own chunk, downloaded when first visited.
// Links to pages with a parameter are built in ./paths.ts.
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageSpinner />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          // Open to everyone.
          { index: true, lazy: () => import('@/pages/HomePage').then((m) => ({ Component: m.HomePage })) },
          { path: 'play', lazy: () => import('@/pages/PlayPage').then((m) => ({ Component: m.PlayPage })) },
          {
            path: 'play/local',
            lazy: () => import('@/pages/OfflineGamePage').then((m) => ({ Component: m.LocalGamePage })),
          },
          {
            path: 'play/computer',
            lazy: () => import('@/pages/OfflineGamePage').then((m) => ({ Component: m.ComputerGamePage })),
          },
          {
            path: 'tournaments',
            lazy: () => import('@/pages/TournamentsPage').then((m) => ({ Component: m.TournamentsPage })),
          },
          {
            path: 'tournaments/local',
            lazy: () => import('@/pages/LocalTournamentPage').then((m) => ({ Component: m.LocalTournamentPage })),
          },
          {
            path: 'privacy',
            lazy: () => import('@/pages/legal/LegalPage').then((m) => ({ Component: m.PrivacyPage })),
          },
          { path: 'terms', lazy: () => import('@/pages/legal/LegalPage').then((m) => ({ Component: m.TermsPage })) },

          // Visitors only.
          {
            element: <GuestOnly />,
            children: [
              { path: 'login', lazy: () => import('@/pages/LoginPage').then((m) => ({ Component: m.LoginPage })) },
              { path: 'signup', lazy: () => import('@/pages/SignupPage').then((m) => ({ Component: m.SignupPage })) },
            ],
          },

          // Logged-in users only.
          {
            element: <RequireAuth />,
            children: [
              {
                path: 'play/online',
                lazy: () => import('@/pages/NewMatchPage').then((m) => ({ Component: m.NewMatchPage })),
              },
              {
                path: 'matches',
                lazy: () => import('@/pages/HistoryPage').then((m) => ({ Component: m.HistoryPage })),
              },
              {
                path: 'matches/:matchId',
                lazy: () => import('@/pages/MatchPage').then((m) => ({ Component: m.MatchPage })),
              },
              { path: 'watch', lazy: () => import('@/pages/WatchPage').then((m) => ({ Component: m.WatchPage })) },
              {
                path: 'watch/:matchId',
                lazy: () => import('@/pages/WatchMatchPage').then((m) => ({ Component: m.WatchMatchPage })),
              },
              {
                path: 'tournaments/new',
                lazy: () => import('@/pages/NewTournamentPage').then((m) => ({ Component: m.NewTournamentPage })),
              },
              {
                path: 'tournaments/:tournamentId',
                lazy: () => import('@/pages/TournamentPage').then((m) => ({ Component: m.TournamentPage })),
              },
              {
                path: 'players',
                lazy: () => import('@/pages/PlayersPage').then((m) => ({ Component: m.PlayersPage })),
              },
              {
                path: 'users/:displayName',
                lazy: () => import('@/pages/ProfilePage').then((m) => ({ Component: m.ProfilePage })),
              },
              {
                path: 'friends',
                lazy: () => import('@/pages/FriendsPage').then((m) => ({ Component: m.FriendsPage })),
              },
              {
                // One route for the list and a conversation, so the page stays mounted between them.
                path: 'chat/:displayName?',
                lazy: () => import('@/pages/ChatPage').then((m) => ({ Component: m.ChatPage })),
              },
              {
                path: 'account',
                lazy: () => import('@/pages/AccountPage').then((m) => ({ Component: m.AccountPage })),
              },
            ],
          },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
]);
