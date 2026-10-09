import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OptionGroup, RangeField, SelectField, TextField } from '@/components/ui';
import { ComponentDemo, DemoGrid } from './DesignSection';

type Level = 'easy' | 'normal' | 'hard';

/** Text fields, a menu, a slider and a group of choices. */
export function FieldsSection() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [size, setSize] = useState(7);
  const [level, setLevel] = useState<Level>('normal');

  const levels = (['easy', 'normal', 'hard'] as const).map((value) => ({
    value,
    label: t(`design.sample.${value}`),
    description: t(`design.sample.${value}Hint`),
  }));

  return (
    <DemoGrid>
      <ComponentDemo name="TextField" description={t('design.fields.textField')}>
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <TextField
            label={t('design.sample.name')}
            hint={t('design.sample.nameHint')}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField label={t('design.sample.name')} error={t('design.sample.nameError')} defaultValue="x" />
        </div>
      </ComponentDemo>

      <ComponentDemo name="SelectField" description={t('design.fields.selectField')}>
        <SelectField label={t('design.sample.language')} className="w-full max-w-xs" defaultValue="en">
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="ar">العربية</option>
        </SelectField>
      </ComponentDemo>

      <ComponentDemo name="RangeField" description={t('design.fields.rangeField')}>
        <div className="w-full max-w-xs">
          <RangeField label={t('design.sample.columns')} value={size} min={4} max={10} onChange={setSize} />
        </div>
      </ComponentDemo>

      <ComponentDemo wide name="OptionGroup" description={t('design.fields.optionGroup')}>
        <div className="flex w-full flex-col gap-5">
          <OptionGroup legend={t('design.sample.level')} options={levels} value={level} onChange={setLevel} />
          <OptionGroup
            legend={t('design.sample.level')}
            options={levels}
            value={level}
            onChange={setLevel}
            variant="cards"
          />
        </div>
      </ComponentDemo>
    </DemoGrid>
  );
}
