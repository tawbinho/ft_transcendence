import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { useAuth } from './features/auth/AuthContext';
import { Spinner } from './components/ui';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { NotFound } from './pages/NotFound';
import { Privacy, Terms } from './pages/Legal';
import { Play } from './pages/Play';
import { LocalMatch } from './pages/LocalMatch';
import { OnlineMatch } from './pages/OnlineMatch';
import { Spectate } from './pages/Spectate';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';
import { Tournaments } from './pages/Tournaments';
import { TournamentDetail } from './pages/TournamentDetail';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/play" element={<Play />} />
        <Route path="/play/local" element={<LocalMatch vsAI={false} />} />
        <Route path="/play/ai" element={<LocalMatch vsAI />} />
        <Route path="/match/:id" element={<RequireAuth><OnlineMatch /></RequireAuth>} />
        <Route path="/spectate" element={<Spectate />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}
