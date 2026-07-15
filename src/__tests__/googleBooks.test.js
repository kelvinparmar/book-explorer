import { buildQuery, searchBooks, normalizeBook } from '../api/googleBooks.js';

describe('buildQuery', () => {
  it('combines multiple fields with field-scoped operators', () => {
    expect(buildQuery({ title: 'Dune', author: 'Herbert', genre: 'sci-fi' })).toBe(
      'intitle:Dune+inauthor:Herbert+subject:sci-fi'
    );
  });

  it('omits empty or whitespace-only fields', () => {
    expect(buildQuery({ title: 'Dune', author: '  ', genre: '' })).toBe('intitle:Dune');
  });

  it('returns an empty string when no fields are provided', () => {
    expect(buildQuery({})).toBe('');
  });
});

describe('normalizeBook', () => {
  it('fills in safe defaults for missing optional fields', () => {
    const result = normalizeBook({ id: '1', volumeInfo: { title: 'Untitled Work' } });
    expect(result).toMatchObject({
      id: '1',
      title: 'Untitled Work',
      authors: [],
      description: '',
      thumbnail: '',
      categories: [],
    });
  });

  it('upgrades thumbnail URLs to https', () => {
    const result = normalizeBook({
      id: '2',
      volumeInfo: {
        title: 'Book',
        imageLinks: { thumbnail: 'http://books.google.com/img.jpg' },
      },
    });
    expect(result.thumbnail).toBe('https://books.google.com/img.jpg');
  });
});

describe('searchBooks', () => {
  afterEach(() => {
    delete global.fetch;
  });

  it('throws when no search fields are given, without calling fetch', async () => {
    global.fetch = jest.fn();
    await expect(searchBooks({})).rejects.toThrow(/at least one search field/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns normalized items on a successful response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        totalItems: 1,
        items: [{ id: 'xyz789', volumeInfo: { title: 'JavaScript Basics', authors: ['John Smith'] } }],
      }),
    });

    const result = await searchBooks({ title: 'JavaScript' });

    expect(result.totalItems).toBe(1);
    expect(result.items[0]).toMatchObject({ id: 'xyz789', title: 'JavaScript Basics' });
  });

  it('retries a rate-limited (429) response and succeeds once it clears', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429, headers: { get: () => null } })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalItems: 0, items: [] }),
      });

    const result = await searchBooks({ title: 'JavaScript' });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.totalItems).toBe(0);
    jest.useRealTimers();
  });

  it('gives up after repeated failures with a message the user can act on', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, headers: { get: () => null } });

    await expect(searchBooks({ title: 'JavaScript' })).rejects.toThrow(/having trouble/i);
    jest.useRealTimers();
  });

  it('falls back to a local result for a known title when the API is rate-limited', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429, headers: { get: () => null } });

    const result = await searchBooks({ title: 'Dune' });

    expect(result.totalItems).toBeGreaterThan(0);
    expect(result.items[0]).toMatchObject({ title: 'Dune' });
    jest.useRealTimers();
  });
});
