import { PageSpinner } from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { Dashboard } from './dashboard/Dashboard';
import { Landing } from './Landing';

/** Members land on their dashboard, everyone else on the presentation of the game. */
export function HomePage() {
  const { data: user, isPending } = useCurrentUser();
  useDocumentTitle();

  if (isPending) return <PageSpinner />;
  return user ? <Dashboard user={user} /> : <Landing />;
}
