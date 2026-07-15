import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import SearchPage from './pages/SearchPage.jsx';

// Code-split the details and favorites pages: they aren't needed on
// the initial search-page load, so keep them out of the main bundle.
const BookDetailsPage = lazy(() => import('./pages/BookDetailsPage.jsx'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'));

function NotFound() {
  return (
    <div className="container" style={{ padding: '64px 0' }}>
      <p className="eyebrow">Error 404</p>
      <h1 style={{ fontFamily: 'var(--font-display)' }}>Entry not found</h1>
      <p>That page isn't in the catalog.</p>
    </div>
  );
}

function App() {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <NavBar />
      <main id="main-content" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="container">
              <LoadingSpinner label="Loading page" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/book/:id" element={<BookDetailsPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
