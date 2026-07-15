import React, { useState } from 'react';
import './SearchForm.css';

const initialFields = { title: '', author: '', genre: '' };
const titleSuggestions = [
  'Dune',
  'The Hobbit',
  '1984',
  'Pride and Prejudice',
  'The Great Gatsby',
  'To Kill a Mockingbird',
  'The Lord of the Rings',
  'Foundation',
  'The Catcher in the Rye',
  'The Alchemist',
];
const authorSuggestions = [
  'Frank Herbert',
  'J.R.R. Tolkien',
  'George Orwell',
  'Jane Austen',
  'F. Scott Fitzgerald',
  'Harper Lee',
  'Isaac Asimov',
  'J.K. Rowling',
  'Ursula K. Le Guin',
  'Paulo Coelho',
];

function buildSuggestions(source, query) {
  const value = query.trim().toLowerCase();
  if (!value) return [];

  return source
    .filter((item) => item.toLowerCase().includes(value))
    .slice(0, 5);
}

/**
 * Multi-field search form. Controlled inputs, validated so that at
 * least one field must be filled before submission is allowed.
 */
function SearchForm({ onSearch, isLoading }) {
  const [fields, setFields] = useState(initialFields);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState({ title: [], author: [] });

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFields((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');

    if (field === 'title' || field === 'author') {
      const source = field === 'title' ? titleSuggestions : authorSuggestions;
      setSuggestions((prev) => ({ ...prev, [field]: buildSuggestions(source, value) }));
    }
  };

  const handleSuggestionSelect = (field, value) => {
    setFields((prev) => ({ ...prev, [field]: value }));
    setSuggestions((prev) => ({ ...prev, [field]: [] }));
  };

  const handleInputBlur = (field) => () => {
    window.setTimeout(() => {
      setSuggestions((prev) => ({ ...prev, [field]: [] }));
    }, 120);
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
            onBlur={handleInputBlur('title')}
            placeholder="e.g. Dune"
            autoComplete="off"
          />
          {suggestions.title.length > 0 && (
            <ul className="search-form__suggestions" role="listbox" aria-label="Title suggestions">
              {suggestions.title.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    role="option"
                    className="search-form__suggestion"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionSelect('title', suggestion)}
                    aria-label={suggestion}
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="search-form__field">
          <label htmlFor="search-author">Author</label>
          <input
            id="search-author"
            name="author"
            type="text"
            value={fields.author}
            onChange={handleChange('author')}
            onBlur={handleInputBlur('author')}
            placeholder="e.g. Ursula K. Le Guin"
            autoComplete="off"
          />
          {suggestions.author.length > 0 && (
            <ul className="search-form__suggestions" role="listbox" aria-label="Author suggestions">
              {suggestions.author.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    role="option"
                    className="search-form__suggestion"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionSelect('author', suggestion)}
                    aria-label={suggestion}
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          )}
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
