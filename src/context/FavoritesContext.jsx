import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'book-explorer:favorites';

const FavoritesContext = createContext(undefined);

function createEntryId(prefix = 'entry') {
  const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return `${prefix}-${cryptoApi.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeFavoriteEntry(entry) {
  const comments = Array.isArray(entry?.comments)
    ? entry.comments.map((comment) => ({
        id: comment?.id || createEntryId(`comment-${entry.id}`),
        text: typeof comment?.text === 'string' ? comment.text : '',
        createdAt: comment?.createdAt || new Date().toISOString(),
      })).filter((comment) => comment.text)
    : [];

  return {
    ...entry,
    notes: typeof entry?.notes === 'string' ? entry.notes : '',
    comments,
  };
}

function loadInitialFavorites() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeFavoriteEntry) : [];
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
      return [
        ...prev,
        {
          ...book,
          notes,
          comments: notes ? [{ id: createEntryId('comment'), text: notes, createdAt: new Date().toISOString() }] : [],
          addedAt: new Date().toISOString(),
        },
      ];
    });
  }, []);

  const removeFavorite = useCallback((bookId) => {
    setFavorites((prev) => prev.filter((f) => f.id !== bookId));
  }, []);

  const updateNotes = useCallback((bookId, notes) => {
    setFavorites((prev) => prev.map((favorite) => {
      if (favorite.id !== bookId) return favorite;
      return {
        ...favorite,
        notes,
        comments: notes
          ? [
              ...(favorite.comments || []),
              { id: createEntryId('comment'), text: notes, createdAt: new Date().toISOString() },
            ]
          : favorite.comments || [],
      };
    }));
  }, []);

  const addComment = useCallback((bookId, text, book = null) => {
    const trimmed = text?.trim();
    if (!trimmed) return;

    setFavorites((prev) => {
      const existingFavorite = prev.find((favorite) => favorite.id === bookId);
      if (existingFavorite) {
        return prev.map((favorite) => {
          if (favorite.id !== bookId) return favorite;
          return {
            ...favorite,
            comments: [
              ...(favorite.comments || []),
              { id: createEntryId('comment'), text: trimmed, createdAt: new Date().toISOString() },
            ],
          };
        });
      }

      if (book && book.id === bookId) {
        return [
          ...prev,
          {
            ...book,
            notes: '',
            comments: [{ id: createEntryId('comment'), text: trimmed, createdAt: new Date().toISOString() }],
            addedAt: new Date().toISOString(),
          },
        ];
      }

      return prev;
    });
  }, []);

  const editComment = useCallback((bookId, commentId, text) => {
    const trimmed = text?.trim();
    if (!trimmed) return;

    setFavorites((prev) => prev.map((favorite) => {
      if (favorite.id !== bookId) return favorite;
      return {
        ...favorite,
        comments: (favorite.comments || []).map((comment) => (
          comment.id === commentId ? { ...comment, text: trimmed } : comment
        )),
      };
    }));
  }, []);

  const deleteComment = useCallback((bookId, commentId) => {
    setFavorites((prev) => prev.map((favorite) => {
      if (favorite.id !== bookId) return favorite;
      return {
        ...favorite,
        comments: (favorite.comments || []).filter((comment) => comment.id !== commentId),
      };
    }));
  }, []);

  const isFavorite = useCallback(
    (bookId) => favorites.some((f) => f.id === bookId),
    [favorites]
  );

  const value = useMemo(
    () => ({
      favorites,
      addFavorite,
      removeFavorite,
      updateNotes,
      addComment,
      editComment,
      deleteComment,
      isFavorite,
    }),
    [favorites, addFavorite, removeFavorite, updateNotes, addComment, editComment, deleteComment, isFavorite]
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
