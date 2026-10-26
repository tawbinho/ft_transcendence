import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OfflineGame } from './offline/OfflineGame';
import { OfflineSetup } from './offline/OfflineSetup';
import type { Session } from './offline/session';

/**
 * /play/local: two people on one screen, played in this browser. Shows the
 * setup form, then the game.
 */
export function LocalGamePage() {
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const title = t('offline.localTitle');

  if (session) {
    return <OfflineGame key={session.id} title={title} session={session} onChangeSettings={() => setSession(null)} />;
  }
  return <OfflineSetup title={title} onStart={setSession} />;
}
