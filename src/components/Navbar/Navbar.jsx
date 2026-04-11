import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const { lang, t, toggle } = useLang();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  function handleLogout() {
    logout();
    navigate('/');
  }

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
                {user && (
                  <NavLink to="/my-orders" className={({ isActive }) => isActive ? 'active' : ''}>{t.navbar.myOrders}</NavLink>
                )}
              </>
            )}
          </div>
          <div className="navbar__auth">
            <button className="btn-lang" onClick={toggle} title="Toggle language">
              {lang === 'en' ? '🇮🇩 ID' : '🇬🇧 EN'}
            </button>
            {user ? (
              <>
                <span className="navbar__user">{t.navbar.hi}, {user.name}</span>
                <button className="btn btn-secondary" onClick={handleLogout}>{t.navbar.logout}</button>
              </>
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
