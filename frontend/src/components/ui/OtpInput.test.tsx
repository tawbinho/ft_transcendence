import { screen } from '@testing-library/react';
import { useState } from 'react';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { OtpInput } from './OtpInput';

function Example({ onComplete = () => {} }: { onComplete?: (code: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <>
      <OtpInput label="Code" value={value} onChange={setValue} onComplete={onComplete} />
      <output>{value}</output>
    </>
  );
}

const digit = (n: number) => screen.getByLabelText(`Code, digit ${n} of 6`);

describe('OtpInput', () => {
  it('has six labelled boxes and no accessibility problem', async () => {
    const { container } = renderWithProviders(<Example />);
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
    await expectNoA11yViolations(container);
  });

  it('moves to the next box after each digit and ignores letters', async () => {
    const { events } = renderWithProviders(<Example />);
    await events.click(digit(1));
    await events.keyboard('1a2');
    expect(screen.getByRole('status')).toHaveTextContent('12');
    expect(digit(3)).toHaveFocus();
  });

  it('Backspace clears and goes back', async () => {
    const { events } = renderWithProviders(<Example />);
    await events.click(digit(1));
    await events.keyboard('123{Backspace}{Backspace}');
    expect(screen.getByRole('status')).toHaveTextContent('1');
    expect(digit(2)).toHaveFocus();
  });

  it('fills every box from a pasted code and reports it complete', async () => {
    const onComplete = vi.fn();
    const { events } = renderWithProviders(<Example onComplete={onComplete} />);
    await events.click(digit(1));
    await events.paste('651 312');
    expect(screen.getByRole('status')).toHaveTextContent('651312');
    expect(onComplete).toHaveBeenCalledWith('651312');
  });
});
