import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { OfflineGame } from './offline/OfflineGame';
import { OfflineSetup } from './offline/OfflineSetup';
import { buildSession, startingValues, type Session } from './offline/session';

/**
 * /play/local: two people on one screen, played in this browser. Shows the
 * setup form, then the game. "/play/local?start=1" skips the form and uses the
 * last board.
 */
export function LocalGamePage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [session, setSession] = useState<Session | null>(() =>
    params.has('start') ? buildSession(startingValues()) : null,
  );
  const title = t('offline.localTitle');

  if (session) {
    return <OfflineGame key={session.id} title={title} session={session} onChangeSettings={() => setSession(null)} />;
  }
  return <OfflineSetup title={title} onStart={setSession} />;
}
