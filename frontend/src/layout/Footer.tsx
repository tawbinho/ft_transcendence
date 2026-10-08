import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ColorSchemeSelect } from './ColorSchemeSelect';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-6 text-sm text-muted">
        <p>{t('footer.project')}</p>
        <nav className="flex gap-4" aria-label={t('footer.privacy') + ', ' + t('footer.terms')}>
          <Link to="/privacy" className="hover:text-fg hover:underline">
            {t('footer.privacy')}
          </Link>
          <Link to="/terms" className="hover:text-fg hover:underline">
            {t('footer.terms')}
          </Link>
        </nav>
        <ColorSchemeSelect className="ms-auto" />
      </div>
    </footer>
  );
}
