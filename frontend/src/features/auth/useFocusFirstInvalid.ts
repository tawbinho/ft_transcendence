import { useEffect, useRef } from 'react';

/**
 * After a form was submitted with mistakes, moves the focus to the first field marked `aria-
 * invalid`, so keyboard and screen reader users land on the problem.
 */
export function useFocusFirstInvalid(failedSubmits: number) {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (failedSubmits > 0) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [failedSubmits]);
  return form;
}
