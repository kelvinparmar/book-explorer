import React, { useState } from 'react';
import './SearchForm.css';

const initialFields = { title: '', author: '', genre: '' };

/**
 * Multi-field search form. Controlled inputs, validated so that at
 * least one field must be filled before submission is allowed.
 */
function SearchForm({ onSearch, isLoading }) {
  const [fields, setFields] = useState(initialFields);
  const [error, setError] = useState('');

  const handleChange = (field) => (event) => {
    setFields((prev) => ({ ...prev, [field]: event.target.value }));
    if (error) setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const hasValue = Object.values(fields).some((v) => v.trim().length > 0);

    if (!hasValue) {
      setError('Enter a title, author, or genre to search.');
      return;
    }

    setError('');
    onSearch(fields);
  };

  return (
    <form className="search-form" onSubmit={handleSubmit} noValidate>
      <div className="search-form__grid">
        <div className="search-form__field">
          <label htmlFor="search-title">Title</label>
          <input
            id="search-title"
            name="title"
            type="text"
            value={fields.title}
            onChange={handleChange('title')}
            placeholder="e.g. Dune"
            autoComplete="off"
          />
        </div>

        <div className="search-form__field">
          <label htmlFor="search-author">Author</label>
          <input
            id="search-author"
            name="author"
            type="text"
            value={fields.author}
            onChange={handleChange('author')}
            placeholder="e.g. Ursula K. Le Guin"
            autoComplete="off"
          />
        </div>

        <div className="search-form__field">
          <label htmlFor="search-genre">Genre or keyword</label>
          <input
            id="search-genre"
            name="genre"
            type="text"
            value={fields.genre}
            onChange={handleChange('genre')}
            placeholder="e.g. science fiction"
            autoComplete="off"
          />
        </div>
      </div>

      {error && (
        <p className="search-form__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="search-form__submit" disabled={isLoading}>
        {isLoading ? 'Searching…' : 'Search catalog'}
      </button>
    </form>
  );
}

export default SearchForm;
