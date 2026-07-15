const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

// Optional: set VITE_GOOGLE_BOOKS_API_KEY in a .env file to move off the
// shared, unauthenticated quota (see .env.example / README). The app works
// without one, just at a lower, IP-shared rate limit.
const API_KEY = import.meta.env?.VITE_GOOGLE_BOOKS_API_KEY;

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 600;

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
  const response = await fetchWithRetry(url, { signal });
  const data = await response.json();

  return {
    totalItems: data.totalItems ?? 0,
    items: (data.items ?? []).map(normalizeBook),
  };
}

/**
 * Fetch a single volume by id.
 */
export async function getBookById(id, { signal } = {}) {
  const url = buildUrl(`${BASE_URL}/${encodeURIComponent(id)}`, {});
  const response = await fetchWithRetry(url, { signal });
  const data = await response.json();
  return normalizeBook(data);
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
