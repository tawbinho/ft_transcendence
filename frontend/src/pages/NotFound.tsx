import { Link } from 'react-router-dom';
import { Card } from '../components/ui';

export function NotFound() {
  return (
    <div className="mx-auto max-w-md text-center">
      <Card>
        <p className="font-display text-6xl font-extrabold text-accent-strong">404</p>
        <p className="mt-3 text-muted">This page dropped out of the board.</p>
        <Link to="/" className="mt-6 inline-block underline underline-offset-2">
          Back to the arena
        </Link>
      </Card>
    </div>
  );
}
