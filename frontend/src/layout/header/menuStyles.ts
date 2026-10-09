/** The look shared by the header's drop-down menus (account, language), so they open the same way. */
export const menuPanelClass =
  'absolute end-0 top-full z-40 mt-2 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-lg';

/** One row of such a menu: a link or a button, at least 44 px tall. */
export const menuItemClass =
  'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-start font-semibold text-fg hover:bg-surface-2 [&>svg]:text-muted';
