import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, SlidersIcon, TrashIcon } from '@/components/icons';
import { Button, CheckboxField, IconButton, Switch, type ButtonVariant } from '@/components/ui';
import { ComponentDemo, DemoGrid } from './DesignSection';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];

/** Buttons and the controls that switch something on or off. */
export function ActionsSection() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState(true);
  const [remember, setRemember] = useState(false);

  return (
    <DemoGrid>
      <ComponentDemo wide name="Button" description={t('design.actions.button')}>
        {VARIANTS.map((variant) => (
          <Button key={variant} variant={variant}>
            {t(`design.sample.${variant}`)}
          </Button>
        ))}
        <Button size="sm">{t('design.sample.small')}</Button>
        <Button size="lg">{t('design.sample.large')}</Button>
        <Button disabled>{t('design.sample.disabled')}</Button>
        <Button loading>{t('design.sample.loading')}</Button>
      </ComponentDemo>

      <ComponentDemo name="IconButton" description={t('design.actions.iconButton')}>
        <IconButton label={t('design.sample.add')}>
          <PlusIcon />
        </IconButton>
        <IconButton label={t('design.sample.settings')} variant="secondary">
          <SlidersIcon />
        </IconButton>
        <IconButton label={t('design.sample.delete')} disabled>
          <TrashIcon />
        </IconButton>
      </ComponentDemo>

      <ComponentDemo name="Switch" description={t('design.actions.switch')}>
        <Switch
          label={t('design.sample.notifications')}
          checked={notifications}
          onChange={(event) => setNotifications(event.target.checked)}
        />
      </ComponentDemo>

      <ComponentDemo name="CheckboxField" description={t('design.actions.checkbox')}>
        <CheckboxField
          label={t('design.sample.remember')}
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
        />
      </ComponentDemo>
    </DemoGrid>
  );
}
