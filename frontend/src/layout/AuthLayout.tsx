import type { ReactNode } from 'react';
import { LogoMark } from '@/components/icons';
import { Card } from '@/components/ui';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { AuthBoard } from './AuthBoard';

/**
 * Shared by the login and signup pages: the form in a card, with a picture of a
 * board beside it on wide screens (hidden from screen readers: it is decoration).
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useDocumentTitle(title);
  return (
    <div className="mx-auto grid w-full max-w-5xl items-center gap-10 py-4 lg:grid-cols-[1fr_28rem]">
      <div aria-hidden="true" className="hidden lg:block">
        <AuthBoard className="mx-auto max-w-md" />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoMark className="size-12" />
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-muted">{subtitle}</p>
        </div>
        <Card>{children}</Card>
        {footer && <div className="text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
