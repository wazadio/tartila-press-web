import { useEffect, useState } from 'react';
import BookCard from '../../components/BookCard/BookCard';
import { booksApi, genresApi } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import './BookCatalog.css';

function BookCatalog() {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { t, lang } = useLang();
  const c = t.catalog;

  useEffect(() => {
    genresApi.list().then(setGenres).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (selectedGenre !== 'All') params.genre = selectedGenre;
    booksApi.list(params)
      .then(setBooks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, selectedGenre]);

  return (
    <div className="book-catalog">
      <div className="container">
        <div className="page-header">
          <h1>{c.title}</h1>
          <p>{c.subtitle}</p>
        </div>

        <div className="catalog-controls">
          <div className="catalog-search-wrap">
            <span className="catalog-search-icon">🔍</span>
            <input
              type="search"
              className="catalog-search"
              placeholder={c.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={c.title}
            />
          </div>
          <div className="catalog-filters">
            <span className="catalog-filters-label">{c.genre}</span>
            <button
              className={`filter-btn${selectedGenre === 'All' ? ' active' : ''}`}
              onClick={() => setSelectedGenre('All')}
            >
              {c.all}
            </button>
            {genres.map((g) => (
              <button
                key={g.id}
                className={`filter-btn${selectedGenre === g.name ? ' active' : ''}`}
                onClick={() => setSelectedGenre(g.name)}
              >
                {lang === 'id' && g.name_id ? g.name_id : g.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="catalog-count">{c.loading}</p>
        ) : (
          <>
            <p className="catalog-count">
              {c.showing} <strong>{books.length}</strong> {books.length !== 1 ? c.titlePlural : c.titleSingular}
            </p>
            {books.length === 0 ? (
              <div className="catalog-empty">
                <span className="catalog-empty__icon">📭</span>
                {c.noResults}
              </div>
            ) : (
              <div className="books-grid">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BookCatalog;
