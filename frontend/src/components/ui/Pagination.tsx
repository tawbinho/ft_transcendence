import { useTranslation } from 'react-i18next';
import { Button } from './Button';

/** Previous / next buttons around "Page 2 of 5". Hidden when everything fits on one page. */
export function Pagination({
  page,
  pages,
  onChange,
  label,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  /** Names the navigation landmark for screen readers, e.g. "Matches". */
  label: string;
}) {
  const { t } = useTranslation();
  if (pages <= 1) return null;

  return (
    <nav className="flex items-center justify-between gap-4" aria-label={label}>
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {t('common.previous')}
      </Button>
      <span className="text-sm text-muted">{t('common.pageOf', { page, pages })}</span>
      <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        {t('common.next')}
      </Button>
    </nav>
  );
}
