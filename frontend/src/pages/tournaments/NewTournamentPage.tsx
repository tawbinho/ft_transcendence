import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { MIN_TOURNAMENT_PLAYERS } from '@/features/tournaments/types';
import { NewTournamentForm } from './online/NewTournamentForm';

export function NewTournamentPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        title={t('tournaments.newTitle')}
        subtitle={t('tournaments.newSubtitle', { min: MIN_TOURNAMENT_PLAYERS })}
      />
      <NewTournamentForm />
    </>
  );
}
