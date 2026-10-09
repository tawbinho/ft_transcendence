import { historySearch, PAGE_SIZE, readHistoryView, toListParams } from './historyQuery';

describe('readHistoryView', () => {
  it('shows every match on the first page when the address has nothing', () => {
    expect(readHistoryView(new URLSearchParams(''))).toEqual({ filter: 'all', page: 1 });
  });

  it('reads the filter and the page', () => {
    expect(readHistoryView(new URLSearchParams('status=finished&page=3'))).toEqual({ filter: 'finished', page: 3 });
  });

  it('ignores a filter it does not know and a page that is not a number', () => {
    expect(readHistoryView(new URLSearchParams('status=banana&page=abc'))).toEqual({ filter: 'all', page: 1 });
  });
});

describe('historySearch', () => {
  it('leaves out what is the default', () => {
    expect(historySearch({ filter: 'all', page: 1 }).toString()).toBe('');
  });

  it('writes the filter and the page', () => {
    expect(historySearch({ filter: 'abandoned', page: 2 }).toString()).toBe('status=abandoned&page=2');
  });

  it('can be read back', () => {
    const view = { filter: 'waiting', page: 4 } as const;
    expect(readHistoryView(historySearch(view))).toEqual(view);
  });
});

describe('toListParams', () => {
  it('asks for every status on the first page', () => {
    expect(toListParams({ filter: 'all', page: 1 })).toEqual({ status: undefined, limit: PAGE_SIZE, offset: 0 });
  });

  it('skips the pages before the one shown', () => {
    expect(toListParams({ filter: 'finished', page: 3 })).toEqual({
      status: 'finished',
      limit: PAGE_SIZE,
      offset: 2 * PAGE_SIZE,
    });
  });
});
