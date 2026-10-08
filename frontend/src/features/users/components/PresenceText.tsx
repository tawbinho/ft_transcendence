import { useTranslation } from 'react-i18next';
import { formatRelative } from '@/lib/format';

/** "Online", "Last seen 3 hours ago" or "Offline", in words (not only a colored dot). */
export function PresenceText({ online, lastSeenAt }: { online: boolean; lastSeenAt?: string | null }) {
  const { t, i18n } = useTranslation();
  if (online) return <span className="font-semibold text-success">{t('presence.online')}</span>;
  if (lastSeenAt) {
    return <span>{t('presence.lastSeen', { time: formatRelative(lastSeenAt, i18n.language) })}</span>;
  }
  return <span>{t('presence.offline')}</span>;
}
