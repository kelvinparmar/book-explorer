import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { getBookById } from '../api/googleBooks.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import './BookDetailsPage.css';

function BookDetailsPage() {
  const { id } = useParams();
  const { favorites, isFavorite, addFavorite, removeFavorite, updateNotes, addComment, editComment, deleteComment } = useFavorites();

  const [book, setBook] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(true);
  const [commentDraft, setCommentDraft] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentStatus, setCommentStatus] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    getBookById(id, { signal: controller.signal })
      .then((data) => {
        setBook(data);
        setStatus('done');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Could not load this book.');
        setStatus('error');
      });

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!book) return;

    const existingFavorite = favorites.find((favorite) => favorite.id === book.id);
    setNotes(existingFavorite?.notes || '');
    setSaved(true);
    setCommentDraft('');
    setEditingCommentId(null);
    setCommentStatus('');
  }, [book, favorites]);

  const handleNotesChange = (event) => {
    setNotes(event.target.value);
    setSaved(false);
  };

  const handleSaveNotes = () => {
    if (!book) return;

    if (favorited) {
      updateNotes(book.id, notes);
    } else if (notes.trim()) {
      addFavorite(book, notes.trim());
    }

    setSaved(true);
  };

  const handleSaveComment = () => {
    if (!book || !commentDraft.trim()) return;

    if (editingCommentId) {
      editComment(book.id, editingCommentId, commentDraft);
      setCommentStatus('Comment updated');
      setEditingCommentId(null);
    } else {
      addComment(book.id, commentDraft, book);
      setCommentStatus('Comment saved to history');
    }

    setCommentDraft('');
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setCommentDraft(comment.text);
    setCommentStatus('');
  };

  const handleDeleteComment = (commentId) => {
    if (!book) return;
    deleteComment(book.id, commentId);
    if (editingCommentId === commentId) {
      setEditingCommentId(null);
      setCommentDraft('');
    }
    setCommentStatus('Comment deleted');
  };

  if (status === 'loading') {
    return (
      <div className="container book-details">
        <LoadingSpinner label="Retrieving entry" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container book-details">
        <ErrorMessage message={error} />
        <Link to="/" className="book-details__back">
          ← Back to search
        </Link>
      </div>
    );
  }

  const favorited = isFavorite(book.id);
  const authorText = book.authors.length > 0 ? book.authors.join(', ') : 'Author unknown';

  return (
    <div className="container book-details">
      <Link to="/" className="book-details__back">
        ← Back to search
      </Link>

      <article className="book-details__card">
        <div className="book-details__cover-col">
          {book.thumbnail ? (
            <img src={book.thumbnail} alt={`Cover of ${book.title}`} className="book-details__cover" />
          ) : (
            <div className="book-details__cover book-details__cover--placeholder" aria-hidden="true">
              <span>{book.title.slice(0, 1)}</span>
            </div>
          )}

          <button
            type="button"
            className={`book-details__fav ${favorited ? 'is-favorited' : ''}`}
            aria-pressed={favorited}
            onClick={() => (favorited ? removeFavorite(book.id) : addFavorite(book))}
          >
            {favorited ? '★ Remove from favorites' : '☆ Add to favorites'}
          </button>

          <div className="book-details__notes">
            <label htmlFor={`book-notes-${book.id}`}>Notes / tags</label>
            <textarea
              id={`book-notes-${book.id}`}
              value={notes}
              onChange={handleNotesChange}
              placeholder="e.g. book club pick, to re-read"
              rows={3}
            />
            <button type="button" onClick={handleSaveNotes} disabled={saved} className="book-details__save">
              {saved ? 'Saved' : 'Save note'}
            </button>

            <div className="book-details__comments">
              <label htmlFor={`book-comment-${book.id}`}>Book history</label>
              <textarea
                id={`book-comment-${book.id}`}
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="Add a comment or note history entry"
                rows={3}
              />
              <div className="book-details__comments-actions">
                <button type="button" onClick={handleSaveComment} className="book-details__save">
                  {editingCommentId ? 'Update comment' : 'Add comment'}
                </button>
                {editingCommentId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCommentId(null);
                      setCommentDraft('');
                    }}
                    className="book-details__cancel"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {commentStatus && <p className="book-details__comment-status" role="status">{commentStatus}</p>}

              <ul className="book-details__comment-list">
                {(favorites.find((favorite) => favorite.id === book.id)?.comments || []).map((comment) => (
                  <li key={comment.id} className="book-details__comment-item">
                    <p>{comment.text}</p>
                    <div className="book-details__comment-actions">
                      <button type="button" onClick={() => handleEditComment(comment)} className="book-details__link-btn">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDeleteComment(comment.id)} className="book-details__link-btn">
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="book-details__body">
          <p className="eyebrow">Catalog entry — {book.id}</p>
          <h1>{book.title}</h1>
          <p className="book-details__author">by {authorText}</p>

          <dl className="book-details__meta">
            {book.publisher && (
              <div>
                <dt>Publisher</dt>
                <dd>{book.publisher}</dd>
              </div>
            )}
            {book.publishedDate && (
              <div>
                <dt>Published</dt>
                <dd>{book.publishedDate}</dd>
              </div>
            )}
            {book.pageCount ? (
              <div>
                <dt>Pages</dt>
                <dd>{book.pageCount}</dd>
              </div>
            ) : null}
            {book.categories.length > 0 && (
              <div>
                <dt>Category</dt>
                <dd>{book.categories.join(', ')}</dd>
              </div>
            )}
            {book.averageRating && (
              <div>
                <dt>Rating</dt>
                <dd>
                  {book.averageRating} / 5 ({book.ratingsCount ?? 0} ratings)
                </dd>
              </div>
            )}
          </dl>

          {book.description ? (
            <div
              className="book-details__desc"
              // Google Books descriptions are simple, sanitized HTML snippets
              // (italics/bold/line breaks) rendered directly by the API docs' examples.
              dangerouslySetInnerHTML={{ __html: book.description }}
            />
          ) : (
            <p className="book-details__desc book-details__desc--empty">
              No description is available for this title.
            </p>
          )}

          {book.previewLink && (
            <a
              href={book.previewLink}
              target="_blank"
              rel="noreferrer noopener"
              className="book-details__preview"
            >
              View on Google Books ↗
            </a>
          )}
        </div>
      </article>
    </div>
  );
}

export default BookDetailsPage;
