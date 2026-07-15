import React from 'react';
import BookCard from './BookCard.jsx';
import './BookList.css';

function BookList({ books }) {
  if (books.length === 0) return null;

  return (
    <ul className="book-list" aria-label="Search results">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </ul>
  );
}

export default React.memo(BookList);
