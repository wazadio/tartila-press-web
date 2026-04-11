import { Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import './Footer.css';

function Footer() {
  const { t } = useLang();
  const f = t.footer;

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">
            <img src="/favicon.jpeg" alt="Tartila" className="footer__logo-img" />
            Tartila
          </div>
          <p>{f.tagline}</p>
          <span className="footer__tagline">{f.excellence}</span>
        </div>
        <nav className="footer__nav">
          <h4>{f.explore}</h4>
          <Link to="/books">{f.books}</Link>
          <Link to="/authors">{f.authors}</Link>
          <Link to="/packages">{f.packages}</Link>
        </nav>
        <nav className="footer__nav">
          <h4>{f.account}</h4>
          <Link to="/login">{f.login}</Link>
          <Link to="/register">{f.register}</Link>
        </nav>
        <nav className="footer__nav">
          <h4>{f.admin}</h4>
          <Link to="/admin">{f.dashboard}</Link>
          <Link to="/admin/books/new">{f.newBook}</Link>
        </nav>
      </div>
      <div className="footer__bottom">
        <div className="container">
          <p>{f.copyright(new Date().getFullYear())}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
