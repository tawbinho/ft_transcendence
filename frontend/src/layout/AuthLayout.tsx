import type { ReactNode } from 'react';
import { LogoMark } from '@/components/icons';
import { Card } from '@/components/ui';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

/** Narrow centered card shared by the login and signup pages. */
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
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <LogoMark className="size-12" />
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-muted">{subtitle}</p>
      </div>
      <Card>{children}</Card>
      {footer && <div className="text-center text-sm text-muted">{footer}</div>}
    </div>
  );
}
