import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createGame } from '@cf/engine';
import { Board } from './Board';
import '../../i18n';

describe('Board', () => {
  it('renders one clickable column per board column when interactive', () => {
    render(<Board game={createGame()} onDrop={() => undefined} />);
    expect(screen.getAllByRole('button')).toHaveLength(7);
  });

  it('is read-only (no buttons) when no onDrop is given', () => {
    render(<Board game={createGame()} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('drops into the clicked column', () => {
    const onDrop = vi.fn();
    render(<Board game={createGame()} onDrop={onDrop} />);
    fireEvent.click(screen.getAllByRole('button')[3]!);
    expect(onDrop).toHaveBeenCalledWith(3);
  });

  it('disables every column when disabled', () => {
    render(<Board game={createGame()} onDrop={() => undefined} disabled />);
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
  });
});
