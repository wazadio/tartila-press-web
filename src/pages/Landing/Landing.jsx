import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BookCard from '../../components/BookCard/BookCard';
import { authorsApi, booksApi } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import './Landing.css';

function Landing() {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const { t } = useLang();
  const l = t.landing;

  useEffect(() => {
    booksApi.list({ featured: true }).then(setFeaturedBooks).catch(() => {});
    authorsApi.list().then(setAuthors).catch(() => {});
  }, []);

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <p className="hero__label">{l.label}</p>
            <h1 className="hero__title">
              {l.title} <em>{l.titleEm}</em> {l.titleSuffix}
            </h1>
            <p className="hero__subtitle">{l.subtitle}</p>
            <div className="hero__actions">
              <Link to="/books" className="btn btn-primary">{l.browseBooks}</Link>
              <Link to="/authors" className="btn btn-secondary">{l.meetAuthors}</Link>
            </div>
            <div className="hero__stats">
              <div className="hero__stat">
                <span className="hero__stat-value">6+</span>
                <span className="hero__stat-label">{l.titlesPublished}</span>
              </div>
              <div className="hero__stat">
                <span className="hero__stat-value">4</span>
                <span className="hero__stat-label">{l.awardAuthors}</span>
              </div>
              <div className="hero__stat">
                <span className="hero__stat-value">5★</span>
                <span className="hero__stat-label">{l.readerRating}</span>
              </div>
            </div>
          </div>
          <div className="hero__visual">
            <div className="hero__book-stack">
              {featuredBooks.slice(0, 3).map((book, i) => (
                <img
                  key={book.id}
                  src={book.cover}
                  alt={book.title}
                  className={`hero__book-cover hero__book-cover--${['lg', 'md', 'sm'][i]}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Genre strip */}
      <div className="genre-strip">
        <div className="container">
          <div className="genre-strip__inner">
            <span>Historical Fiction</span>
            <span className="genre-strip__sep">✦</span>
            <span>Literary Fiction</span>
            <span className="genre-strip__sep">✦</span>
            <span>Children's Literature</span>
            <span className="genre-strip__sep">✦</span>
            <span>Mystery &amp; Thriller</span>
            <span className="genre-strip__sep">✦</span>
            <span>Poetry &amp; Essays</span>
            <span className="genre-strip__sep">✦</span>
            <span>Young Adult</span>
          </div>
        </div>
      </div>

      {/* Featured Books */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-header__left">
              <p className="section-eyebrow">{l.highlights}</p>
              <h2>{l.featuredBooks}</h2>
            </div>
            <Link to="/books" className="section-link">{l.viewAll}</Link>
          </div>
          <div className="books-grid">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* Authors */}
      <section className="section section--alt">
        <div className="container">
          <div className="section-header">
            <div className="section-header__left">
              <p className="section-eyebrow">{l.talent}</p>
              <h2>{l.ourAuthors}</h2>
            </div>
            <Link to="/authors" className="section-link">{l.viewAll}</Link>
          </div>
          <div className="authors-strip">
            {authors.map((author) => (
              <Link key={author.id} to={`/authors/${author.id}`} className="author-chip">
                <img src={author.photo} alt={author.name} />
                <span>{author.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container cta__inner">
          <div className="cta__text">
            <h2>{l.authorCta}</h2>
            <p>{l.authorCtaDesc}</p>
          </div>
          <div className="cta__action">
            <Link to="/register" className="btn btn-primary">{l.getStarted}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
