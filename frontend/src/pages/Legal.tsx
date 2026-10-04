import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui';
import type { ReactNode } from 'react';

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-4xl font-extrabold">{title}</h1>
      <Card className="space-y-4 leading-relaxed text-ink/90">{children}</Card>
    </article>
  );
}

export function Privacy() {
  const { t } = useTranslation();
  return (
    <LegalPage title={t('legal.privacyTitle')}>
      <p>
        Connect Four Arena is a student project built for the 42 <em>ft_transcendence</em> curriculum.
        This policy explains what we store and why. Last updated 23 September 2026.
      </p>
      <h2 className="font-display text-xl font-bold">What we collect</h2>
      <ul className="list-disc space-y-1 ps-6">
        <li><strong>Account data:</strong> your display name, and — for password accounts — your email and a
          hashed, salted password (we never store your password in plain text).</li>
        <li><strong>42 sign-in:</strong> if you sign in with 42, we store your 42 account id and public login
          to link your account, plus your public avatar URL.</li>
        <li><strong>Two-factor:</strong> if you enable 2FA, we store the shared secret used to verify codes.</li>
        <li><strong>Gameplay:</strong> your online match results, ratings, and statistics.</li>
        <li><strong>Session:</strong> one <code>httpOnly</code> cookie that keeps you signed in.</li>
      </ul>
      <h2 className="font-display text-xl font-bold">How we use it</h2>
      <p>
        Only to run the game: authenticating you, matching you with opponents, showing the leaderboard and
        your match history, and keeping your session. We do not sell your data or share it with advertisers.
      </p>
      <h2 className="font-display text-xl font-bold">Retention & control</h2>
      <p>
        Data lives in our own database for as long as your account exists. You can sign out at any time to
        clear your session, and you can disable 2FA from your profile. To have your account and data removed,
        contact your team administrator.
      </p>
    </LegalPage>
  );
}

export function Terms() {
  const { t } = useTranslation();
  return (
    <LegalPage title={t('legal.termsTitle')}>
      <p>
        By using Connect Four Arena you agree to these terms. This is a non-commercial educational project;
        it is provided as-is, without warranty. Last updated 23 September 2026.
      </p>
      <h2 className="font-display text-xl font-bold">Your account</h2>
      <p>
        Keep your credentials safe and use a display name that isn’t offensive or impersonating someone else.
        You are responsible for activity on your account.
      </p>
      <h2 className="font-display text-xl font-bold">Fair play</h2>
      <p>
        Play fairly: don’t attempt to cheat, tamper with the game’s network traffic, disrupt other players’
        matches, or abuse the service. The game state is decided by the server, and abuse may lead to removal.
      </p>
      <h2 className="font-display text-xl font-bold">Availability</h2>
      <p>
        The service may change or go offline at any time. We are not liable for lost matches, ratings, or
        downtime. Questions? Reach out to the project team.
      </p>
    </LegalPage>
  );
}
