import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import SearchForm from '../components/SearchForm.jsx';

describe('SearchForm', () => {
  it('shows a validation error when submitted with no fields filled', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchForm onSearch={onSearch} isLoading={false} />);

    await user.click(screen.getByRole('button', { name: /search catalog/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/enter a title, author, or genre/i);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('calls onSearch with the entered fields when at least one is filled', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchForm onSearch={onSearch} isLoading={false} />);

    await user.type(screen.getByLabelText(/title/i), 'Dune');
    await user.click(screen.getByRole('button', { name: /search catalog/i }));

    expect(onSearch).toHaveBeenCalledWith({ title: 'Dune', author: '', genre: '' });
  });

  it('clears a previous error once the user starts typing again', async () => {
    const user = userEvent.setup();
    render(<SearchForm onSearch={jest.fn()} isLoading={false} />);

    await user.click(screen.getByRole('button', { name: /search catalog/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/author/i), 'Le Guin');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disables the submit button while loading', () => {
    render(<SearchForm onSearch={jest.fn()} isLoading={true} />);
    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled();
  });
});
