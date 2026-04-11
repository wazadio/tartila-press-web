import { useEffect, useState } from 'react';
import BookCard from '../../components/BookCard/BookCard';
import { booksApi, genresApi, bidangApi } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import './BookCatalog.css';

function BookCatalog() {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [bidangList, setBidangList] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedBidangId, setSelectedBidangId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { t, lang } = useLang();
  const c = t.catalog;

  useEffect(() => {
    genresApi.list().then(setGenres).catch(() => {});
    bidangApi.list().then(setBidangList).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (selectedGenre !== 'All') params.genre = selectedGenre;
    if (selectedBidangId !== null) params.bidang_id = selectedBidangId;
    params.is_template = false;
    booksApi.list(params)
      .then(setBooks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, selectedGenre, selectedBidangId]);

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
          {bidangList.length > 0 && (
            <div className="catalog-filters">
              <span className="catalog-filters-label">Bidang</span>
              <button
                className={`filter-btn${selectedBidangId === null ? ' active' : ''}`}
                onClick={() => setSelectedBidangId(null)}
              >{c.all}</button>
              {bidangList.map((b) => (
                <button
                  key={b.id}
                  className={`filter-btn${selectedBidangId === b.id ? ' active' : ''}`}
                  onClick={() => setSelectedBidangId(b.id)}
                >{b.name}</button>
              ))}
            </div>
          )}
          <div className="catalog-filters">
            <span className="catalog-filters-label">{c.genre}</span>
            <button
              className={`filter-btn${selectedGenre === 'All' ? ' active' : ''}`}
              onClick={() => setSelectedGenre('All')}
            >
              {c.all}
            </button>
            {genres
              .filter((g) => selectedBidangId === null || g.bidang_id === selectedBidangId)
              .map((g) => (
                <button
                  key={g.id}
                  className={`filter-btn${selectedGenre === g.name ? ' active' : ''}`}
                  onClick={() => setSelectedGenre(g.name)}
                >
                  {lang === 'id' && g.name_id ? g.name_id : g.name}
                </button>
              ))
            }
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
