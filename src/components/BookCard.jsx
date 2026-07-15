import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext.jsx';
import './BookCard.css';

// A small fixed palette of spine colors, deterministically chosen per
// book id so the same book always gets the same spine color.
const SPINE_COLORS = ['#c08a34', '#a63d40', '#3f6a52', '#2f4d6b', '#7a5230'];

function spineColorFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return SPINE_COLORS[hash % SPINE_COLORS.length];
}

function BookCard({ book }) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const favorited = isFavorite(book.id);

  const handleToggleFavorite = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (favorited) {
      removeFavorite(book.id);
    } else {
      addFavorite(book);
    }
  };

  const authorText = book.authors.length > 0 ? book.authors.join(', ') : 'Author unknown';

  return (
    <li className="book-card">
      <Link to={`/book/${encodeURIComponent(book.id)}`} className="book-card__link">
        <div className="book-card__cover-wrap">
          <span
            className="book-card__spine"
            style={{ background: spineColorFor(book.id) }}
            aria-hidden="true"
          />
          {book.thumbnail ? (
            <img className="book-card__cover" src={book.thumbnail} alt="" loading="lazy" />
          ) : (
            <div className="book-card__cover book-card__cover--placeholder" aria-hidden="true">
              <span>{book.title.slice(0, 1)}</span>
            </div>
          )}
        </div>

        <div className="book-card__body">
          <p className="eyebrow">{authorText}</p>
          <h3 className="book-card__title">{book.title}</h3>
          {book.description && <p className="book-card__desc">{book.description}</p>}
        </div>
      </Link>

      <button
        type="button"
        className={`book-card__fav ${favorited ? 'is-favorited' : ''}`}
        onClick={handleToggleFavorite}
        aria-pressed={favorited}
        aria-label={favorited ? `Remove ${book.title} from favorites` : `Add ${book.title} to favorites`}
      >
        <span aria-hidden="true">{favorited ? '★' : '☆'}</span>
      </button>
    </li>
  );
}

export default React.memo(BookCard);
