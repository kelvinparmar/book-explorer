import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { FavoritesProvider, useFavorites } from '../context/FavoritesContext.jsx';

const book = { id: 'abc123', title: 'Dune', authors: ['Frank Herbert'] };

function wrapper({ children }) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('FavoritesContext', () => {
  it('starts with an empty favorites list', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    expect(result.current.favorites).toEqual([]);
  });

  it('adds a book to favorites', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => {
      result.current.addFavorite(book);
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].id).toBe('abc123');
    expect(result.current.isFavorite('abc123')).toBe(true);
  });

  it('does not add the same book twice', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => {
      result.current.addFavorite(book);
      result.current.addFavorite(book);
    });

    expect(result.current.favorites).toHaveLength(1);
  });

  it('removes a book from favorites', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => {
      result.current.addFavorite(book);
    });
    act(() => {
      result.current.removeFavorite('abc123');
    });

    expect(result.current.favorites).toHaveLength(0);
    expect(result.current.isFavorite('abc123')).toBe(false);
  });

  it('updates notes for a favorited book', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => {
      result.current.addFavorite(book);
    });
    act(() => {
      result.current.updateNotes('abc123', 'Book club pick');
    });

    expect(result.current.favorites[0].notes).toBe('Book club pick');
  });

  it('persists favorites to localStorage', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => {
      result.current.addFavorite(book);
    });

    const stored = JSON.parse(window.localStorage.getItem('book-explorer:favorites'));
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('abc123');
  });

  it('throws when used outside of a FavoritesProvider', () => {
    // Suppress the expected React error boundary console noise for this case.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useFavorites())).toThrow(
      /useFavorites must be used within a FavoritesProvider/
    );
    spy.mockRestore();
  });
});
