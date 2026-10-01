import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    navigate('/', { replace: true });
    await logout();
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo">Everyday Goods</Link>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="visually-hidden">Menu</span>
          <span className="menu-icon" aria-hidden="true" />
        </button>

        <nav id="main-nav" className={menuOpen ? 'main-nav open' : 'main-nav'}>
          <NavLink to="/" end>Products</NavLink>
          <NavLink to="/wishlist">Wishlist</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          {user ? (
            <div className="nav-user">
              <span className="muted">Hi, {user.name.split(' ')[0]}</span>
              <button type="button" className="button button-secondary button-small" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <NavLink to="/login">Log in</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
