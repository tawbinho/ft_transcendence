import { fireEvent, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { ReplayControls } from './ReplayControls';

function setup(props: Partial<Parameters<typeof ReplayControls>[0]> = {}) {
  const onStep = vi.fn();
  const onTogglePlay = vi.fn();
  const view = renderWithProviders(
    <ReplayControls
      step={5}
      total={23}
      playing={false}
      announcement="Move 5 of 23: bob played column 3."
      onStep={onStep}
      onTogglePlay={onTogglePlay}
      {...props}
    />,
  );
  return { ...view, onStep, onTogglePlay };
}

describe('ReplayControls', () => {
  it('shows the move number and announces it to screen readers', () => {
    const { container } = setup();
    expect(screen.getByText('Move 5 of 23')).toBeInTheDocument();
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('Move 5 of 23: bob played column 3.');
  });

  it('steps with the buttons', async () => {
    const { events, onStep } = setup();
    await events.click(screen.getByRole('button', { name: 'Next move' }));
    await events.click(screen.getByRole('button', { name: 'Previous move' }));
    await events.click(screen.getByRole('button', { name: 'Go to the start' }));
    await events.click(screen.getByRole('button', { name: 'Go to the end' }));
    expect(onStep.mock.calls.map(([step]) => step)).toEqual([6, 4, 0, 23]);
  });

  it('plays and pauses', async () => {
    const { events, onTogglePlay, rerender } = setup();
    await events.click(screen.getByRole('button', { name: 'Play the replay' }));
    expect(onTogglePlay).toHaveBeenCalledTimes(1);
    rerender(
      <ReplayControls step={5} total={23} playing announcement="" onStep={vi.fn()} onTogglePlay={onTogglePlay} />,
    );
    expect(screen.getByRole('button', { name: 'Pause the replay' })).toBeInTheDocument();
  });

  it('moves with the arrow keys, Home and End', async () => {
    const { events, onStep } = setup();
    screen.getByRole('button', { name: 'Next move' }).focus();
    await events.keyboard('{ArrowRight}{ArrowLeft}{Home}{End}');
    expect(onStep.mock.calls.map(([step]) => step)).toEqual([6, 4, 0, 23]);
  });

  it('does not step twice when the slider has the focus', () => {
    const { onStep } = setup();
    const slider = screen.getByRole('slider', { name: 'Position in the match' });
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onStep).not.toHaveBeenCalled();
  });

  it('jumps with the slider', () => {
    const { onStep } = setup();
    fireEvent.change(screen.getByRole('slider', { name: 'Position in the match' }), { target: { value: '12' } });
    expect(onStep).toHaveBeenCalledWith(12);
  });

  it('keeps the buttons that cannot move further focusable but marks them unavailable', () => {
    setup({ step: 0 });
    const previous = screen.getByRole('button', { name: 'Previous move' });
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    expect(previous).not.toBeDisabled();
  });

  it('has no accessibility problems', async () => {
    const { container } = setup();
    await expectNoA11yViolations(container);
  });
});
