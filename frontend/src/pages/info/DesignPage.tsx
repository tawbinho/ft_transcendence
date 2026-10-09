import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { ActionsSection } from './design/ActionsSection';
import { ColorsSection } from './design/ColorsSection';
import { DesignSection, type SectionId } from './design/DesignSection';
import { DisplaySection } from './design/DisplaySection';
import { FeedbackSection } from './design/FeedbackSection';
import { FieldsSection } from './design/FieldsSection';
import { IconsSection } from './design/IconsSection';
import { IdentitySection } from './design/IdentitySection';
import { TokensSection } from './design/TokensSection';
import { TypeSection } from './design/TypeSection';

// The sections in the order of the page; the list at the top is built from it too.
const SECTIONS: { id: SectionId; Content: ComponentType }[] = [
  { id: 'identity', Content: IdentitySection },
  { id: 'colors', Content: ColorsSection },
  { id: 'type', Content: TypeSection },
  { id: 'tokens', Content: TokensSection },
  { id: 'icons', Content: IconsSection },
  { id: 'actions', Content: ActionsSection },
  { id: 'fields', Content: FieldsSection },
  { id: 'feedback', Content: FeedbackSection },
  { id: 'display', Content: DisplaySection },
];

/** The design system: identity, colors, type and every shared component, each with a line about what it is for. */
export function DesignPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('design.title')} subtitle={t('design.intro')} />
      <nav aria-label={t('design.contents')} className="mb-10">
        <ul className="flex flex-wrap gap-2">
          {SECTIONS.map(({ id }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-2"
              >
                {t(`design.${id}.title`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex flex-col gap-14">
        {SECTIONS.map(({ id, Content }) => (
          <DesignSection key={id} id={id}>
            <Content />
          </DesignSection>
        ))}
      </div>
    </>
  );
}
