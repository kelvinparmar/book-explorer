import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'book-explorer:favorites';

const FavoritesContext = createContext(undefined);

function loadInitialFavorites() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    // Corrupt or inaccessible storage shouldn't crash the app.
    return [];
  }
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(loadInitialFavorites);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore write failures (e.g. private browsing quota).
    }
  }, [favorites]);

  const addFavorite = useCallback((book, notes = '') => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === book.id)) return prev;
      return [...prev, { ...book, notes, addedAt: new Date().toISOString() }];
    });
  }, []);

  const removeFavorite = useCallback((bookId) => {
    setFavorites((prev) => prev.filter((f) => f.id !== bookId));
  }, []);

  const updateNotes = useCallback((bookId, notes) => {
    setFavorites((prev) => prev.map((f) => (f.id === bookId ? { ...f, notes } : f)));
  }, []);

  const isFavorite = useCallback(
    (bookId) => favorites.some((f) => f.id === bookId),
    [favorites]
  );

  const value = useMemo(
    () => ({ favorites, addFavorite, removeFavorite, updateNotes, isFavorite }),
    [favorites, addFavorite, removeFavorite, updateNotes, isFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (ctx === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return ctx;
}
