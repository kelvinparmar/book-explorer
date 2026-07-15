import React from 'react';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils.jsx';
import App from '../App.jsx';

describe('App routing', () => {
  it('renders the search page at /', () => {
    renderWithProviders(<App />, { route: '/' });
    expect(screen.getByRole('heading', { name: /find your next read/i })).toBeInTheDocument();
  });

  it('navigates to the favorites page via the nav link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/' });

    await user.click(screen.getByRole('link', { name: /favorites/i }));

    expect(await screen.findByRole('heading', { name: /your favorites/i })).toBeInTheDocument();
  });

  it('shows a not-found message for an unknown route', async () => {
    renderWithProviders(<App />, { route: '/does-not-exist' });
    expect(await screen.findByRole('heading', { name: /entry not found/i })).toBeInTheDocument();
  });

  it('renders the book details page for a valid id', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'xyz789',
        volumeInfo: {
          title: 'JavaScript Basics',
          authors: ['John Smith'],
          description: 'An introduction to JavaScript programming.',
        },
      }),
    });

    renderWithProviders(<App />, { route: '/book/xyz789' });

    expect(await screen.findByRole('heading', { name: /javascript basics/i })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/volumes/xyz789'),
      expect.anything()
    );

    delete global.fetch;
  });
});
