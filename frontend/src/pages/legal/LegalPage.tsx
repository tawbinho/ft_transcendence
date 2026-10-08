import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';
import { useLanguage } from '@/i18n';
import { privacy, terms, LEGAL_UPDATED, type LegalDocument } from './content';

function LegalArticle({ title, document }: { title: string; document: LegalDocument }) {
  const { t, i18n } = useTranslation();
  const updated = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date(LEGAL_UPDATED));

  return (
    <article className="mx-auto max-w-3xl">
      <PageHeader title={title} subtitle={t('legal.updated', { date: updated })} />
      <Card className="flex flex-col gap-6 leading-relaxed">
        <p>{document.intro}</p>
        {document.sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-fg/90">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </Card>
    </article>
  );
}

export function PrivacyPage() {
  const { t } = useTranslation();
  const [language] = useLanguage();
  return <LegalArticle title={t('legal.privacyTitle')} document={privacy[language]} />;
}

export function TermsPage() {
  const { t } = useTranslation();
  const [language] = useLanguage();
  return <LegalArticle title={t('legal.termsTitle')} document={terms[language]} />;
}
