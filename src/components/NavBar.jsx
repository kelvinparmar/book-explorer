import React from 'react';
import { NavLink } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext.jsx';
import './NavBar.css';

function NavBar() {
  const { favorites } = useFavorites();

  return (
    <header className="nav-bar">
      <div className="container nav-bar__inner">
        <NavLink to="/" className="nav-bar__brand" aria-label="Book Explorer home">
          <span className="nav-bar__mark" aria-hidden="true">
            ⌘
          </span>
          <span>
            Book <em>Explorer</em>
          </span>
        </NavLink>

        <nav aria-label="Primary">
          <ul className="nav-bar__links">
            <li>
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'is-active' : '')}>
                Search
              </NavLink>
            </li>
            <li>
              <NavLink to="/favorites" className={({ isActive }) => (isActive ? 'is-active' : '')}>
                Favorites
                {favorites.length > 0 && (
                  <span className="nav-bar__badge" aria-hidden="true">
                    {favorites.length}
                  </span>
                )}
                <span className="visually-hidden">
                  {favorites.length > 0 ? `, ${favorites.length} saved` : ''}
                </span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default NavBar;
