import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { packagesApi, booksApi } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import './PackageDetail.css';

const TYPE_ICON = { per_chapter: '📄', per_book: '📚' };

function fmt(price) {
  return `Rp ${Number(price).toLocaleString('id-ID')}`;
}

function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const p = t.packages;

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bookList, setBookList] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);

  useEffect(() => {
    packagesApi.get(id)
      .then((data) => {
        setPkg(data);
        if (data.type === 'per_chapter') {
          setBooksLoading(true);
          booksApi.list({ is_template: true })
            .then(setBookList)
            .catch(() => {})
            .finally(() => setBooksLoading(false));
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="pkgdetail-state container">
        <p>{p.loading}</p>
      </div>
    );
  }

  if (notFound || !pkg) {
    return (
      <div className="pkgdetail-state container">
        <p>Paket tidak ditemukan.</p>
        <Link to="/packages" className="btn btn-secondary">{p.backToPackages ?? '← Kembali'}</Link>
      </div>
    );
  }

  const hasDiscount = pkg.discount > 0;
  const isPerChapter = pkg.type === 'per_chapter';

  return (
    <div className="pkgdetail-page">
      {/* Breadcrumb */}
      <div className="pkgdetail-breadcrumb">
        <div className="container">
          <Link to="/packages" className="pkgdetail-breadcrumb__back">← Kembali ke Paket</Link>
        </div>
      </div>

      <div className="container pkgdetail-layout">
        {/* Left — main content */}
        <div className="pkgdetail-main">
          <div className="pkgdetail-header">
            <span className="pkgdetail-header__icon">{TYPE_ICON[pkg.type]}</span>
            <span className="pkgdetail-header__type">
              {isPerChapter ? p.perChapter : p.perBook}
            </span>
            {pkg.is_featured && (
              <span className="pkgdetail-header__badge">{p.mostPopular}</span>
            )}
          </div>

          <h1 className="pkgdetail-title">{pkg.name}</h1>

          {pkg.description && (
            <div className="pkgdetail-desc">
              <p>{pkg.description}</p>
            </div>
          )}

          {/* Book grid for per_chapter */}
          {isPerChapter && (
            <div className="pkgdetail-books">
              <h2 className="pkgdetail-books__title">Template Buku</h2>
              <p className="pkgdetail-books__subtitle">Klik buku untuk memilih bab yang ingin dipesan.</p>
              {booksLoading && <p className="pkgdetail-books__loading">Memuat…</p>}
              {!booksLoading && bookList.length === 0 && (
                <p className="pkgdetail-books__empty">Belum ada template buku tersedia.</p>
              )}
              {!booksLoading && bookList.length > 0 && (
                <div className="pkgdetail-book-grid">
                  {bookList.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className="pkgdetail-book-card"
                      onClick={() => navigate(`/payment/${pkg.id}/chapters/${b.id}`)}
                    >
                      <div className="pkgdetail-book-card__cover-wrap">
                        {b.cover
                          ? <img src={b.cover} alt={b.title} className="pkgdetail-book-card__cover" />
                          : <div className="pkgdetail-book-card__cover-placeholder">📖</div>
                        }
                      </div>
                      <div className="pkgdetail-book-card__info">
                        <div className="pkgdetail-book-card__title">{b.title}</div>
                        {b.genre && <div className="pkgdetail-book-card__genre">{b.genre}</div>}
                        <div className="pkgdetail-book-card__cta">Pilih Bab →</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — pricing card */}
        <aside className="pkgdetail-aside">
          <div className={`pkgdetail-card${pkg.is_featured ? ' pkgdetail-card--featured' : ''}`}>
            {pkg.is_featured && (
              <div className="pkgdetail-card__featured-banner">{p.mostPopular}</div>
            )}

            <div className="pkgdetail-card__pricing">
              {isPerChapter && (
                <span className="pkgdetail-card__from">Mulai dari</span>
              )}
              {hasDiscount && (
                <div className="pkgdetail-card__original">
                  <span className="pkgdetail-card__original-price">{fmt(pkg.price)}</span>
                  <span className="pkgdetail-card__discount-badge">−{pkg.discount}%</span>
                </div>
              )}
              <div className="pkgdetail-card__final">{fmt(pkg.final_price)}</div>
              <div className="pkgdetail-card__unit">
                {isPerChapter ? p.chapterUnit : p.bookUnit}
              </div>
            </div>

            <Link
              to={`/payment/${pkg.id}`}
              className="btn btn-primary pkgdetail-card__cta"
            >
              {p.getStarted}
            </Link>

            <ul className="pkgdetail-card__meta">
              <li>
                <span className="pkgdetail-card__meta-icon">📋</span>
                <span>Tipe: <strong>{isPerChapter ? 'Per Bab' : 'Per Buku'}</strong></span>
              </li>
              {hasDiscount && (
                <li>
                  <span className="pkgdetail-card__meta-icon">🏷</span>
                  <span>Diskon <strong>{pkg.discount}%</strong> dari harga normal</span>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PackageDetail;
