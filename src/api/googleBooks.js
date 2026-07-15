const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

// Optional: set VITE_GOOGLE_BOOKS_API_KEY in a .env file to move off the
// shared, unauthenticated quota (see .env.example / README). The app works
// without one, just at a lower, IP-shared rate limit.
const API_KEY = import.meta.env?.VITE_GOOGLE_BOOKS_API_KEY;

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 600;
const FALLBACK_BOOKS = [
  {
    id: 'fallback-dune',
    volumeInfo: {
      title: 'Dune',
      authors: ['Frank Herbert'],
      description: 'A science fiction novel about a young nobleman on the desert planet Arrakis.',
      categories: ['Science Fiction'],
    },
  },
  {
    id: 'fallback-hobbit',
    volumeInfo: {
      title: 'The Hobbit',
      authors: ['J.R.R. Tolkien'],
      description: 'A classic fantasy adventure following Bilbo Baggins on a quest with dwarves and a dragon.',
      categories: ['Fantasy'],
    },
  },
  {
    id: 'fallback-1984',
    volumeInfo: {
      title: '1984',
      authors: ['George Orwell'],
      description: 'A dystopian novel about surveillance, propaganda, and totalitarian control.',
      categories: ['Dystopian Fiction'],
    },
  },
  {
    id: 'fallback-pride',
    volumeInfo: {
      title: 'Pride and Prejudice',
      authors: ['Jane Austen'],
      description: 'A romantic novel about love, class, and social manners in Regency England.',
      categories: ['Classic'],
    },
  },
  {
    id: 'fallback-gatsby',
    volumeInfo: {
      title: 'The Great Gatsby',
      authors: ['F. Scott Fitzgerald'],
      description: 'A Jazz Age novel about wealth, desire, and the American Dream.',
      categories: ['Classic'],
    },
  },
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a Google Books query string from separate search fields.
 * Empty fields are omitted. Uses the API's field-scoped operators
 * (intitle:, inauthor:, subject:) so a multi-field search narrows
 * results rather than broadening them.
 */
export function buildQuery({ title, author, genre }) {
  const parts = [];
  if (title?.trim()) parts.push(`intitle:${title.trim()}`);
  if (author?.trim()) parts.push(`inauthor:${author.trim()}`);
  if (genre?.trim()) parts.push(`subject:${genre.trim()}`);
  return parts.join('+');
}

function buildUrl(path, params) {
  const url = new URL(path);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  });
  if (API_KEY) url.searchParams.set('key', API_KEY);
  return url.toString();
}

function getFallbackMatches(fields) {
  const terms = [fields.title, fields.author, fields.genre]
    .filter(Boolean)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (terms.length === 0) return [];

  return FALLBACK_BOOKS.filter((book) => {
    const haystack = [
      book.volumeInfo?.title ?? '',
      ...(book.volumeInfo?.authors ?? []),
      ...(book.volumeInfo?.categories ?? []),
      book.volumeInfo?.description ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return terms.every((term) => haystack.includes(term));
  }).map(normalizeBook);
}

function getFallbackBookById(id) {
  const lookupId = String(id || '').toLowerCase();
  const match = FALLBACK_BOOKS.find((book) => String(book.id).toLowerCase().includes(lookupId));

  if (!match) return null;

  return normalizeBook(match);
}

/**
 * Map an HTTP status to a message the person searching can actually act on.
 */
function messageForStatus(status) {
  if (status === 429) {
    return "You've hit Google Books' rate limit — wait a few seconds and try again.";
  }
  if (status === 403) {
    return 'Google Books rejected this request (403). If you set an API key, check that it is valid and unrestricted for this domain.';
  }
  if (status >= 500) {
    return 'Google Books is having trouble right now. Please try again shortly.';
  }
  return `Google Books API request failed (${status})`;
}

/**
 * Fetch with automatic retry + exponential backoff, but only for 429
 * (rate limited) and 5xx (transient server error) responses. Honors
 * Retry-After when the server sends one.
 */
async function fetchWithRetry(url, { signal } = {}) {
  let attempt = 0;

  while (true) {
    const response = await fetch(url, { signal });

    if (response.ok) return response;

    const isRetryable = response.status === 429 || response.status >= 500;
    if (!isRetryable || attempt >= MAX_RETRIES) {
      const error = new Error(messageForStatus(response.status));
      error.status = response.status;
      throw error;
    }

    const retryAfterHeader = Number(response.headers?.get?.('Retry-After'));
    const delay = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
      ? retryAfterHeader * 1000
      : RETRY_BASE_DELAY_MS * 2 ** attempt;

    await wait(delay);
    attempt += 1;
  }
}

/**
 * Search the Google Books API.
 * @param {{title?: string, author?: string, genre?: string}} fields
 * @param {{maxResults?: number, startIndex?: number, signal?: AbortSignal}} options
 */
export async function searchBooks(fields, { maxResults = 20, startIndex = 0, signal } = {}) {
  const q = buildQuery(fields);
  if (!q) {
    throw new Error('At least one search field is required.');
  }

  const url = buildUrl(BASE_URL, { q, maxResults, startIndex });

  try {
    const response = await fetchWithRetry(url, { signal });
    const data = await response.json();

    return {
      totalItems: data.totalItems ?? 0,
      items: (data.items ?? []).map(normalizeBook),
    };
  } catch (error) {
    const fallbackItems = getFallbackMatches(fields);
    if (error?.status === 429 && fallbackItems.length > 0) {
      return {
        totalItems: fallbackItems.length,
        items: fallbackItems,
      };
    }

    throw error;
  }
}

/**
 * Fetch a single volume by id.
 */
export async function getBookById(id, { signal } = {}) {
  const url = buildUrl(`${BASE_URL}/${encodeURIComponent(id)}`, {});

  try {
    const response = await fetchWithRetry(url, { signal });
    const data = await response.json();
    return normalizeBook(data);
  } catch (error) {
    if (error?.status === 429) {
      const fallbackBook = getFallbackBookById(id);
      if (fallbackBook) {
        return fallbackBook;
      }
    }

    throw error;
  }
}

/**
 * Flatten the parts of a Google Books volume the UI actually needs,
 * with safe fallbacks for the many optional fields the API omits.
 */
export function normalizeBook(item) {
  const info = item.volumeInfo ?? {};
  const links = info.imageLinks ?? {};

  return {
    id: item.id,
    title: info.title ?? 'Untitled',
    authors: info.authors ?? [],
    description: info.description ?? '',
    thumbnail: (links.thumbnail || links.smallThumbnail || '').replace('http://', 'https://'),
    publishedDate: info.publishedDate ?? '',
    publisher: info.publisher ?? '',
    pageCount: info.pageCount ?? null,
    categories: info.categories ?? [],
    averageRating: info.averageRating ?? null,
    ratingsCount: info.ratingsCount ?? null,
    previewLink: info.previewLink ?? '',
    language: info.language ?? '',
  };
}
