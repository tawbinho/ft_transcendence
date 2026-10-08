import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { PlayIcon, TrophyIcon } from '@/components/icons';
import { buttonClass } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatMessageTime } from '@/lib/format';
import type { Message } from '../types';

/** One message of a conversation: a bubble, an invitation card, or a notice from the server. */
export function MessageItem({
  message,
  mine,
  peerName,
  seen,
}: {
  message: Message;
  mine: boolean;
  peerName: string;
  /** The peer has read it (shown under the viewer's latest message). */
  seen: boolean;
}) {
  const { t, i18n } = useTranslation();
  const time = <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt, i18n.language)}</time>;

  if (message.kind === 'system') {
    return (
      <li className="my-2 flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-center text-sm">
        <p className="flex items-center gap-2 font-semibold">
          <TrophyIcon className="text-primary" />
          {t('chat.tournamentMatchReady', { name: peerName })}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {message.matchId && (
            <Link to={paths.match(message.matchId)} className={buttonClass({ size: 'sm' })}>
              {t('chat.playMatch')}
            </Link>
          )}
          {message.tournamentId && (
            <Link
              to={paths.tournament(message.tournamentId)}
              className={buttonClass({ size: 'sm', variant: 'secondary' })}
            >
              {t('chat.seeBracket')}
            </Link>
          )}
        </div>
        <span className="text-xs text-muted">{time}</span>
      </li>
    );
  }

  return (
    <li className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[min(85%,32rem)] rounded-2xl px-4 py-2',
          mine ? 'rounded-ee-md bg-primary text-primary-fg' : 'rounded-es-md bg-surface-2 text-fg',
        )}
      >
        <span className="sr-only">{mine ? t('chat.you') : peerName}: </span>
        {message.kind === 'invite' ? (
          <div className="flex flex-col items-start gap-2 py-1">
            <p className="flex items-center gap-2 font-semibold">
              <PlayIcon />
              {mine ? t('chat.inviteSent', { name: peerName }) : t('chat.inviteReceived', { name: peerName })}
            </p>
            {message.matchId && (
              <Link
                to={paths.match(message.matchId)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-semibold',
                  mine
                    ? 'bg-primary-fg/15 hover:bg-primary-fg/25'
                    : 'bg-primary text-primary-fg hover:bg-primary-hover',
                )}
              >
                {mine ? t('chat.openMatch') : t('chat.joinMatch')}
              </Link>
            )}
          </div>
        ) : (
          // dir="auto": a message takes the direction of its own text, whatever the page's.
          <p dir="auto" className="whitespace-pre-wrap break-words">
            {message.body}
          </p>
        )}
      </div>
      <span className="px-1 text-xs text-muted">
        {time}
        {seen && (
          <>
            <span aria-hidden="true"> · </span>
            {t('chat.seen')}
          </>
        )}
      </span>
    </li>
  );
}
