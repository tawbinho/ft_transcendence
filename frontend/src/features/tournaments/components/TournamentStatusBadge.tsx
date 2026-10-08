import { useTranslation } from 'react-i18next';
import { Badge, type BadgeTone } from '@/components/ui';
import type { TournamentStatus } from '../types';

const TONES: Record<TournamentStatus, BadgeTone> = { registering: 'warning', running: 'info', finished: 'neutral' };

export function TournamentStatusBadge({ status }: { status: TournamentStatus }) {
  const { t } = useTranslation();
  return <Badge tone={TONES[status]}>{t(`tournaments.status.${status}`)}</Badge>;
}
