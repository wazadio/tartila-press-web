import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const { lang, t, toggle } = useLang();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  function handleLogout() {
    logout();
    setDropdownOpen(false);
    navigate('/');
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header>
      <div className="navbar-announce">
        {t.navbar.announce}
      </div>
      <nav className="navbar">
        <div className="container navbar__inner">
          <Link to={isAdmin ? '/admin' : '/'} className="navbar__brand">
            <img src="/favicon.jpeg" alt="Tartila" className="navbar__brand-logo" />
            Tartila
          </Link>
          <span className="navbar__sep" />
          <div className="navbar__links">
            {isAdmin ? (
              <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>{t.navbar.admin}</NavLink>
            ) : (
              <>
                <NavLink to="/books" className={({ isActive }) => isActive ? 'active' : ''}>{t.navbar.books}</NavLink>
                <NavLink to="/authors" className={({ isActive }) => isActive ? 'active' : ''}>{t.navbar.authors}</NavLink>
                <NavLink to="/packages" className={({ isActive }) => isActive ? 'active' : ''}>{t.navbar.packages}</NavLink>
                {user?.role === 'writer' && (
                  <NavLink to="/writer/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>{t.navbar.writerDashboard}</NavLink>
                )}
              </>
            )}
          </div>
          <div className="navbar__auth">
            <button className="btn-lang" onClick={toggle} title="Toggle language">
              {lang === 'en' ? '🇮🇩 ID' : '🇬🇧 EN'}
            </button>
            {user ? (
              <div className="navbar__user-menu" ref={dropdownRef}>
                <button
                  className="navbar__user-btn"
                  onClick={() => setDropdownOpen((o) => !o)}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  <span className="navbar__user-avatar">
                    {user.name?.[0]?.toUpperCase()}
                  </span>
                  <span className="navbar__user-name">{user.name}</span>
                  <span className={`navbar__user-caret${dropdownOpen ? ' navbar__user-caret--open' : ''}`}>▾</span>
                </button>

                {dropdownOpen && (
                  <div className="navbar__dropdown">
                    <div className="navbar__dropdown-header">
                      <span className="navbar__dropdown-name">{user.name}</span>
                      <span className="navbar__dropdown-email">{user.email}</span>
                    </div>
                    <div className="navbar__dropdown-divider" />
                    {!isAdmin && (
                      <>
                        <Link
                          to="/my-orders"
                          className="navbar__dropdown-item"
                          onClick={() => setDropdownOpen(false)}
                        >
                          📋 {t.navbar.myOrders}
                        </Link>
                        {user.role === 'writer' && (
                          <Link
                            to="/writer/dashboard"
                            className="navbar__dropdown-item"
                            onClick={() => setDropdownOpen(false)}
                          >
                            ✏️ {t.navbar.writerDashboard}
                          </Link>
                        )}
                        <div className="navbar__dropdown-divider" />
                      </>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="navbar__dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        ⚙️ {t.navbar.admin}
                      </Link>
                    )}
                    <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={handleLogout}>
                      {t.navbar.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">{t.navbar.login}</Link>
                <Link to="/register" className="btn btn-primary">{t.navbar.register}</Link>
                <Link to="/writer/register" className="btn btn-secondary">{t.navbar.writerRegister}</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
