# Book Explorer

A React app for searching books via the Google Books API, viewing details, and
keeping a personal, annotated list of favorites.

## Setup & run

Requires Node 18+.

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173
npm run build       # production build to dist/
npm run preview     # serve the production build locally
```

No API key is required — the Google Books `volumes` endpoint is public for
the read-only search/lookup calls this app makes.

## Testing

```bash
npm test             # run the full Jest + React Testing Library suite once
npm run test:watch   # watch mode
npm run test:coverage
```

26 tests across 5 suites cover:
- **SearchForm** — validation (blocks empty submission), submission payload, error-clearing on input, disabled state while loading.
- **FavoritesContext** — add/remove/dedupe, notes editing, localStorage persistence, misuse (hook used outside provider).
- **BookCard** — rendering, the details link, and the favorite-toggle button.
- **App routing** — `/`, `/favorites`, `/book/:id`, and a 404 fallback, including navigation via the nav bar.
- **googleBooks API client** — query building from multiple fields, response normalization/defaults, and error handling on failed requests.

## Approach & trade-offs

**Routing.** Three routes (`/`, `/book/:id`, `/favorites`) via React Router.
`BookDetailsPage` and `FavoritesPage` are behind `React.lazy` + `Suspense` so
the initial bundle only ships the search page; `vite build` confirms these
split into separate chunks.

**Form handling.** `SearchForm` is fully controlled (one `useState` object
for all three fields). Validation is intentionally simple: at least one field
must be non-empty, checked on submit rather than on every keystroke, so
errors don't appear before the user has had a chance to type. The three
fields map onto Google's `intitle:` / `inauthor:` / `subject:` query
operators, combined with `+` — this narrows results (an AND, not an OR)
which matches how someone using three separate labeled fields expects
search to behave.

**State management.** Favorites use React Context (`FavoritesContext`)
rather than Redux — the app only has one piece of shared state, so a
reducer/store library would add ceremony without adding capability. The
context persists to `localStorage` so favorites survive a refresh, and
exposes `addFavorite` / `removeFavorite` / `updateNotes` / `isFavorite`,
each `useCallback`-memoized so consumers like `BookCard` don't re-render
on every favorites-list change (the whole `value` object is also
`useMemo`-wrapped for the same reason). Each favorite carries a `notes`
field (added via a per-row textarea on the Favorites page) — the exercise's
optional "attach notes when favoriting" enhancement, implemented instead as
editable-at-any-time so users aren't forced to write a note at the moment
they favorite something.

**API layer.** All Google Books calls go through `src/api/googleBooks.js`,
which centralizes URL building, response normalization (so components never
touch raw `volumeInfo`/`imageLinks` shapes or worry about missing fields),
and error surfaces. Requests are cancelled with `AbortController` on
unmount or when a new search fires before the previous one resolves, so a
slow, stale response can't clobber a newer one.

**Performance.** `BookCard` and `BookList` are `React.memo`-wrapped since
they re-render on every favorites-context update; the spine color for each
card is computed with a small deterministic hash rather than `Math.random()`
so it doesn't reshuffle on re-render. Route-level code-splitting (above)
is the other main lever, given the details/favorites pages aren't needed
on first paint.

**Accessibility.** Semantic landmarks (`header`, `nav`, `main`), a skip
link, labelled form fields, `aria-live="polite"` around search results so
loading/empty/error states are announced, `aria-pressed` + descriptive
`aria-label`s on the favorite toggle buttons, and visible focus rings
(including for `prefers-reduced-motion` users, whose spinner still gets a
resting state rather than motion).

**Known trade-offs.** No pagination UI beyond the first `maxResults` batch
returned per search (the API client supports `startIndex`, so a "load more"
control would be a small addition, not a rearchitecture). Book descriptions
from Google Books are simple HTML snippets and are rendered as such via
`dangerouslySetInnerHTML`; this is standard practice for this API's output
but would want sanitization (e.g. DOMPurify) if the data source were less
trusted.

## Project structure

```
src/
  api/googleBooks.js       # fetch, query building, response normalization
  context/FavoritesContext.jsx
  components/              # NavBar, SearchForm, BookCard, BookList, LoadingSpinner, ErrorMessage
  pages/                   # SearchPage, BookDetailsPage (lazy), FavoritesPage (lazy)
  __tests__/                # Jest + React Testing Library specs
  App.jsx, main.jsx, index.css
```
