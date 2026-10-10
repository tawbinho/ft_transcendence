import { readFilters, writeFilters, type PlayerFilters } from './playerFilters';

const defaults: PlayerFilters = { search: '', online: false, friends: false, sort: 'name', page: 1 };

describe('player filters in the URL', () => {
  it('uses the defaults when the URL has no filters', () => {
    expect(readFilters(new URLSearchParams())).toEqual(defaults);
  });

  it('reads every filter', () => {
    const params = new URLSearchParams('q=li&online=1&friends=1&sort=wins&page=3');
    expect(readFilters(params)).toEqual({ search: 'li', online: true, friends: true, sort: 'wins', page: 3 });
  });

  it('ignores a sort or a page that makes no sense', () => {
    const filters = readFilters(new URLSearchParams('sort=banana&page=-4&online=yes'));
    expect(filters).toEqual(defaults);
  });

  it('writes only what differs from the defaults', () => {
    expect(writeFilters(defaults).toString()).toBe('');
    expect(writeFilters({ ...defaults, search: 'li', sort: 'newest', page: 2 }).toString()).toBe(
      'q=li&sort=newest&page=2',
    );
  });

  it('gives back the same filters it was given', () => {
    const filters: PlayerFilters = { search: 'a b', online: true, friends: true, sort: 'wins', page: 5 };
    expect(readFilters(writeFilters(filters))).toEqual(filters);
  });
});
