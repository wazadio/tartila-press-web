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
          <div className="catalog-search-row">
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
              <div className="catalog-select-wrap">
                <label className="catalog-select-label">Bidang</label>
                <select
                  className="catalog-select"
                  value={selectedBidangId ?? ''}
                  onChange={(e) => {
                    setSelectedBidangId(e.target.value ? Number(e.target.value) : null);
                    setSelectedGenre('All');
                  }}
                >
                  <option value="">{c.all} Bidang</option>
                  {bidangList.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="catalog-select-wrap">
              <label className="catalog-select-label">{c.genre}</label>
              <select
                className="catalog-select"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
              >
                <option value="All">{c.all} Genre</option>
                {genres
                  .filter((g) => selectedBidangId === null || g.bidang_id === selectedBidangId)
                  .map((g) => (
                    <option key={g.id} value={g.name}>
                      {lang === 'id' && g.name_id ? g.name_id : g.name}
                    </option>
                  ))}
              </select>
            </div>

            {(selectedBidangId !== null || selectedGenre !== 'All') && (
              <button
                type="button"
                className="catalog-clear-btn"
                onClick={() => { setSelectedBidangId(null); setSelectedGenre('All'); }}
              >
                ✕ Reset
              </button>
            )}
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
