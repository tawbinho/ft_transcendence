import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { OfflineGame } from './OfflineGame';
import { OfflineSetup } from './OfflineSetup';
import { buildSession, startingValues, type Mode, type Session } from './session';

export type { Mode } from './session';

/**
 * A game played in this browser: two people on one screen, or one person
 * against the computer. Shows the setup form, then the game.
 * "/play/local?start=1" skips the form and uses the last board.
 */
export function OfflineGamePage({ mode }: { mode: Mode }) {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [session, setSession] = useState<Session | null>(() =>
    params.has('start') ? buildSession(mode, startingValues()) : null,
  );
  const title = mode === 'local' ? t('offline.localTitle') : t('offline.computerTitle');

  if (session) {
    return <OfflineGame key={session.id} title={title} session={session} onChangeSettings={() => setSession(null)} />;
  }
  return <OfflineSetup mode={mode} title={title} onStart={setSession} />;
}
