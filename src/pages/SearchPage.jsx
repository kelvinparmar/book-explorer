import React, { useCallback, useRef, useState } from 'react';
import SearchForm from '../components/SearchForm.jsx';
import BookList from '../components/BookList.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { searchBooks } from '../api/googleBooks.js';
import './SearchPage.css';

function SearchPage() {
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | error | done
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef(null);

  const handleSearch = useCallback(async (fields) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError('');
    setHasSearched(true);

    try {
      const { items } = await searchBooks(fields, { signal: controller.signal });
      setBooks(items);
      setStatus('done');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Something went wrong while searching.');
      setStatus('error');
    }
  }, []);

  return (
    <div className="search-page">
      <div className="container">
        <section className="search-page__hero">
          <p className="eyebrow">Reader's catalog</p>
          <h1>Find your next read</h1>
          <p className="search-page__lede">
            Search the stacks by title, author, or genre — mix and match any of the three fields.
          </p>
        </section>

        <SearchForm onSearch={handleSearch} isLoading={status === 'loading'} />

        <section className="search-page__results" aria-live="polite">
          {status === 'loading' && <LoadingSpinner label="Searching the catalog" />}
          {status === 'error' && <ErrorMessage message={error} />}
          {status === 'done' && books.length === 0 && (
            <p className="search-page__empty">
              No entries found. Try a different title, author, or genre.
            </p>
          )}
          {status === 'done' && books.length > 0 && (
            <>
              <p className="search-page__count">{books.length} results</p>
              <BookList books={books} />
            </>
          )}
          {!hasSearched && status === 'idle' && (
            <p className="search-page__empty">
              Your results will appear here once you search the catalog above.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default SearchPage;
