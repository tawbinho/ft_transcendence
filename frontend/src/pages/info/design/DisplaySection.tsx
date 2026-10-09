import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModeCard } from '@/components/ModeCard';
import { StatTiles } from '@/components/StatTiles';
import { TrophyIcon } from '@/components/icons';
import { Avatar, Card, Kbd, Pagination, TabLinks, type AvatarSize } from '@/components/ui';
import { ComponentDemo, DemoGrid } from './DesignSection';

const AVATAR_SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const PEOPLE = ['Alice', 'Bob', 'Chloé', 'Dina'];

/** Cards, numbers, people, keys and the controls that move between pages. */
export function DisplaySection() {
  const { t } = useTranslation();
  const [page, setPage] = useState(2);

  return (
    <DemoGrid>
      <ComponentDemo name="Card" description={t('design.display.card')}>
        <Card className="w-full">{t('design.sample.message')}</Card>
      </ComponentDemo>

      <ComponentDemo name="Avatar" description={t('design.display.avatar')}>
        {AVATAR_SIZES.map((size, index) => (
          <Avatar key={size} size={size} user={{ displayName: PEOPLE[index % PEOPLE.length]!, avatarUrl: null }} />
        ))}
      </ComponentDemo>

      <ComponentDemo wide name="StatTiles" description={t('design.display.statTiles')}>
        <StatTiles
          className="w-full"
          tiles={[
            [t('design.sample.wins'), '42'],
            [t('design.sample.losses'), '17'],
            [t('design.sample.draws'), '3'],
            [t('design.sample.rate'), '68 %'],
          ]}
        />
      </ComponentDemo>

      <ComponentDemo wide name="ModeCard" description={t('design.display.modeCard')}>
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <ModeCard
            to="/play"
            icon={<TrophyIcon />}
            title={t('design.sample.cardTitle')}
            body={t('design.sample.cardBody')}
          />
          <ModeCard
            icon={<TrophyIcon />}
            title={t('design.sample.cardTitle')}
            body={t('design.sample.cardBody')}
            headingLevel={3}
          />
        </div>
      </ComponentDemo>

      <ComponentDemo wide name="TabLinks" description={t('design.display.tabLinks')}>
        <TabLinks
          className="w-full"
          label={t('design.sample.tabs')}
          tabs={[
            { to: '/design', label: t('design.title'), end: true },
            { to: '/play', label: t('design.sample.tabPlay') },
            { to: '/tournaments', label: t('design.sample.tabTournaments'), count: 2 },
          ]}
        />
      </ComponentDemo>

      <ComponentDemo name="Pagination" description={t('design.display.pagination')}>
        <div className="w-full">
          <Pagination page={page} pages={4} onChange={setPage} label={t('design.sample.pages')} />
        </div>
      </ComponentDemo>

      <ComponentDemo name="Kbd" description={t('design.display.kbd')}>
        <Kbd>←</Kbd>
        <Kbd>→</Kbd>
        <Kbd>Enter</Kbd>
      </ComponentDemo>
    </DemoGrid>
  );
}
