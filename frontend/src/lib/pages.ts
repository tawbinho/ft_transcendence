// Pagination helpers shared by the lists that keep their page in the URL (?page=2).

/** The "page" search parameter as a page number: 1 when missing or invalid. */
export function readPage(params: URLSearchParams): number {
  return Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
}

/** How many pages `total` items fill, at least 1. */
export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
