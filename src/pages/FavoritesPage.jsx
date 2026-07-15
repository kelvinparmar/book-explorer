import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext.jsx';
import './FavoritesPage.css';

function FavoriteRow({ book }) {
  const { removeFavorite, updateNotes } = useFavorites();
  const [notes, setNotes] = useState(book.notes || '');
  const [saved, setSaved] = useState(true);

  const handleNotesChange = (event) => {
    setNotes(event.target.value);
    setSaved(false);
  };

  const handleSaveNotes = () => {
    updateNotes(book.id, notes);
    setSaved(true);
  };

  const authorText = book.authors.length > 0 ? book.authors.join(', ') : 'Author unknown';

  return (
    <li className="favorite-row">
      <Link to={`/book/${encodeURIComponent(book.id)}`} className="favorite-row__cover-link">
        {book.thumbnail ? (
          <img src={book.thumbnail} alt="" className="favorite-row__cover" />
        ) : (
          <div className="favorite-row__cover favorite-row__cover--placeholder" aria-hidden="true">
            <span>{book.title.slice(0, 1)}</span>
          </div>
        )}
      </Link>

      <div className="favorite-row__body">
        <p className="eyebrow">{authorText}</p>
        <Link to={`/book/${encodeURIComponent(book.id)}`} className="favorite-row__title">
          {book.title}
        </Link>

        <div className="favorite-row__notes">
          <label htmlFor={`notes-${book.id}`}>Notes / tags</label>
          <textarea
            id={`notes-${book.id}`}
            value={notes}
            onChange={handleNotesChange}
            placeholder="e.g. book club pick, to re-read"
            rows={2}
          />
          <button type="button" onClick={handleSaveNotes} disabled={saved} className="favorite-row__save">
            {saved ? 'Saved' : 'Save note'}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="favorite-row__remove"
        onClick={() => removeFavorite(book.id)}
        aria-label={`Remove ${book.title} from favorites`}
      >
        Remove
      </button>
    </li>
  );
}

function FavoritesPage() {
  const { favorites } = useFavorites();

  const sorted = useMemo(
    () => [...favorites].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)),
    [favorites]
  );

  return (
    <div className="container favorites-page">
      <p className="eyebrow">Reading list</p>
      <h1>Your favorites</h1>

      {sorted.length === 0 ? (
        <p className="favorites-page__empty">
          Nothing saved yet. <Link to="/">Search the catalog</Link> and tap the star on a book to add it
          here.
        </p>
      ) : (
        <ul className="favorites-page__list" aria-label="Favorite books">
          {sorted.map((book) => (
            <FavoriteRow key={book.id} book={book} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default FavoritesPage;
