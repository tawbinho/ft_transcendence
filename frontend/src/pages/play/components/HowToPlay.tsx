import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Kbd } from '@/components/ui';

/** The rules in three lines and the keys that work on the board. */
export function HowToPlay() {
  const { t } = useTranslation();

  // Each row: the keys (always drawn left to right) and what they do.
  const keys: [ReactNode, string][] = [
    [
      <>
        <Kbd>←</Kbd> <Kbd>→</Kbd>
      </>,
      t('play.help.keyMove'),
    ],
    [
      <>
        <Kbd>{t('play.help.keyHome')}</Kbd> <Kbd>{t('play.help.keyEnd')}</Kbd>
      </>,
      t('play.help.keyEnds'),
    ],
    [<Kbd>1 – 9</Kbd>, t('play.help.keyDigits')],
    [
      <>
        <Kbd>{t('play.help.keyEnter')}</Kbd> <Kbd>{t('play.help.keySpace')}</Kbd>
      </>,
      t('play.help.keyDrop'),
    ],
  ];

  return (
    <Card className="grid gap-6 md:grid-cols-2">
      <section>
        <h2 className="text-xl font-bold">{t('play.help.title')}</h2>
        <ol className="mt-3 flex list-decimal flex-col gap-2 ps-5 text-muted marker:font-bold marker:text-fg">
          <li>{t('play.help.rule1')}</li>
          <li>{t('play.help.rule2', { n: 4 })}</li>
          <li>{t('play.help.rule3')}</li>
        </ol>
      </section>
      <section>
        <h2 className="text-xl font-bold">{t('play.help.keysTitle')}</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5">
          {keys.map(([combo, label]) => (
            <div key={label} className="contents">
              <dt dir="ltr" className="whitespace-nowrap">
                {combo}
              </dt>
              <dd className="min-w-0 text-muted">{label}</dd>
            </div>
          ))}
        </dl>
      </section>
    </Card>
  );
}
