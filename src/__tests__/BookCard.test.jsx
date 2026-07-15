import React from 'react';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils.jsx';
import BookCard from '../components/BookCard.jsx';

const book = {
  id: 'xyz789',
  title: 'JavaScript Basics',
  authors: ['John Smith'],
  description: 'An introduction to JavaScript programming.',
  thumbnail: 'https://books.example.com/xyz789.jpg',
};

describe('BookCard', () => {
  it('renders the title, author, and description', () => {
    renderWithProviders(<BookCard book={book} />);

    expect(screen.getByText('JavaScript Basics')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText(/introduction to JavaScript/i)).toBeInTheDocument();
  });

  it('links to the book details page', () => {
    renderWithProviders(<BookCard book={book} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/book/xyz789');
  });

  it('toggles favorite state when the star button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookCard book={book} />);

    const favButton = screen.getByRole('button', { name: /add .* to favorites/i });
    expect(favButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(favButton);

    expect(screen.getByRole('button', { name: /remove .* from favorites/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
