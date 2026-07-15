import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BookDetailsPage from '../pages/BookDetailsPage.jsx';
import { FavoritesProvider } from '../context/FavoritesContext.jsx';
import { getBookById } from '../api/googleBooks.js';

jest.mock('../api/googleBooks.js', () => ({
  getBookById: jest.fn(),
}));

beforeEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
});

describe('BookDetailsPage notes', () => {
  it('saves a note for a book', async () => {
    getBookById.mockResolvedValue({
      id: 'abc123',
      title: 'Dune',
      authors: ['Frank Herbert'],
      description: 'A classic sci-fi novel.',
      thumbnail: '',
      publisher: 'Ace Books',
      publishedDate: '1965',
      pageCount: 688,
      categories: ['Science Fiction'],
      averageRating: 4.7,
      ratingsCount: 1200,
      previewLink: '',
      language: 'en',
    });

    const user = userEvent.setup();

    render(
      <FavoritesProvider>
        <MemoryRouter initialEntries={['/book/abc123']}>
          <Routes>
            <Route path="/book/:id" element={<BookDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </FavoritesProvider>
    );

    const textarea = await screen.findByLabelText(/notes/i);
    await user.type(textarea, 'Great for book club');
    await user.click(screen.getByRole('button', { name: /save note/i }));

    expect(await screen.findByRole('button', { name: /saved/i })).toBeInTheDocument();

    const stored = JSON.parse(window.localStorage.getItem('book-explorer:favorites'));
    expect(stored[0].notes).toBe('Great for book club');
  });
});
