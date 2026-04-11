import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { packagesApi, booksApi, bookChaptersApi } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import './Packages.css';
import '../BookCatalog/BookCatalog.css';

const TYPE_ICON = {
  per_chapter: '📄',
  per_book: '📚',
};

function fmt(price) {
  return `Rp ${price.toLocaleString('id-ID')}`;
}

function PackageCard({ pkg, p }) {
  const hasDiscount = pkg.discount > 0;
  const isFeatured = hasDiscount;

  return (
    <div className={`pkg-card ${isFeatured ? 'pkg-card--featured' : ''}`}>
      {isFeatured && <div className="pkg-card__badge">{p.mostPopular}</div>}
      <div className="pkg-card__icon">{TYPE_ICON[pkg.type]}</div>
      <div className="pkg-card__type">
        {pkg.type === 'per_chapter' ? p.perChapter : p.perBook}
      </div>
      <h3 className="pkg-card__name">{pkg.name}</h3>
      <p className="pkg-card__desc">{pkg.description}</p>

      <div className="pkg-card__pricing">
        {hasDiscount && (
          <div className="pkg-card__original">
            <span className="pkg-card__original-price">{fmt(pkg.price)}</span>
            <span className="pkg-card__discount-badge">-{pkg.discount}%</span>
          </div>
        )}
        <div className="pkg-card__final">{fmt(pkg.final_price)}</div>
        <div className="pkg-card__unit">
          {pkg.type === 'per_chapter' ? p.chapterUnit : p.bookUnit}
        </div>
      </div>

      <Link to={`/payment/${pkg.id}`} className="btn btn-primary pkg-card__cta">{p.getStarted}</Link>
    </div>
  );
}

function Packages() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('packages');
  const [templateBooks, setTemplateBooks] = useState([]);
  const [modalBook, setModalBook] = useState(null);
  const [chaptersMap, setChaptersMap] = useState({});
  const { t } = useLang();
  const p = t.packages;

  useEffect(() => {
    packagesApi.list()
      .then(setPackages)
      .catch(() => setError('Failed to load packages.'))
      .finally(() => setLoading(false));
    booksApi.list({ is_template: true })
      .then(setTemplateBooks)
      .catch(() => {});
  }, []);

  function openBookModal(book) {
    setModalBook(book);
    if (!chaptersMap[book.id]) {
      bookChaptersApi.list(book.id)
        .then((chs) => setChaptersMap((prev) => ({ ...prev, [book.id]: chs })))
        .catch(() => setChaptersMap((prev) => ({ ...prev, [book.id]: [] })));
    }
  }

  function navigateToPayment(book) {
    const perChapterPkg = packages.find((pkg) => pkg.type === 'per_chapter');
    if (perChapterPkg) {
      navigate(`/payment/${perChapterPkg.id}?book=${book.id}`);
    }
  }

  function closeBookModal() {
    setModalBook(null);
  }


  const featureRows = [
    [p.features[0], true, true],
    [p.features[1], false, true],
    [p.features[2], false, true],
    [p.features[3], true, true],
    [p.features[4], true, false],
    [p.features[5], true, false],
    [p.features[6], false, true],
    [p.features[7], false, true],
  ];

  return (
    <div className="packages-page">
      {/* Hero */}
      <section className="packages-hero">
        <div className="container">
          <p className="packages-hero__label">{p.label}</p>
          <h1 className="packages-hero__title">{p.title} <em>{p.titleEm}</em></h1>
          <p className="packages-hero__subtitle">{p.subtitle}</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="packages-tabs">
        <div className="container">
          <button
            className={`packages-tab${activeTab === 'packages' ? ' packages-tab--active' : ''}`}
            onClick={() => setActiveTab('packages')}
          >
            Paket Penerbitan
          </button>
          <button
            className={`packages-tab${activeTab === 'books' ? ' packages-tab--active' : ''}`}
            onClick={() => setActiveTab('books')}
          >
            Buku &amp; Bab
            {templateBooks.length > 0 && <span className="packages-tab__count">{templateBooks.length}</span>}
          </button>
        </div>
      </div>

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <>
        <section className="packages-cards">
          <div className="container">
            {loading && <p className="packages-loading">{p.loading}</p>}
            {error && <p className="error-msg">{error}</p>}

            {!loading && !error && (
              <div className="pkg-grid">
                {packages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} p={p} />)}
              </div>
            )}
          </div>
        </section>

        {/* Comparison */}
        {!loading && !error && packages.length > 0 && (
          <section className="packages-compare">
            <div className="container">
              <h2 className="packages-compare__title">{p.whatsIncluded}</h2>
              <div className="compare-table-wrapper">
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th>{p.feature}</th>
                      <th>{p.perChapter}</th>
                      <th>{p.perBook}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureRows.map(([feature, chapter, book]) => (
                      <tr key={feature}>
                        <td>{feature}</td>
                        <td className="compare-table__check">{chapter ? '✓' : '—'}</td>
                        <td className="compare-table__check">{book ? '✓' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
        </>
      )}

      {/* Buku & Bab Tab */}
      {activeTab === 'books' && (
        <section className="packages-books">
          <div className="container">
            <div className="page-header">
              <h2>Buku Tersedia untuk Pembelian Per Bab</h2>
              <p>Pilih buku dan bab yang ingin Anda terbitkan secara terpisah.</p>
            </div>
            {templateBooks.length === 0 ? (
              <div className="catalog-empty">
                <span className="catalog-empty__icon">📭</span>
                Belum ada buku yang tersedia.
              </div>
            ) : (
              <>
                <p className="catalog-count">
                  Menampilkan <strong>{templateBooks.length}</strong> buku
                </p>
                <div className="books-grid">
                  {templateBooks.map((book) => (
                    <div key={book.id} className="pkg-book-card">
                      <button
                        type="button"
                        className="pkg-book-card__cover-btn"
                        onClick={() => openBookModal(book)}
                      >
                        <img
                          src={book.cover || `https://placehold.co/300x420?text=${encodeURIComponent(book.title)}`}
                          alt={book.title}
                          className="pkg-book-card__cover"
                          onError={(e) => { e.target.src = `https://placehold.co/300x420?text=${encodeURIComponent(book.title)}`; }}
                        />
                        <div className="pkg-book-card__cover-overlay">
                          <span>Lihat Bab</span>
                        </div>
                      </button>
                      <div className="pkg-book-card__body">
                        {book.genre && <span className="badge">{book.genre}</span>}
                        <h3 className="pkg-book-card__title">{book.title}</h3>
                        {book.bidang_name && (
                          <p className="pkg-book-card__author">{book.bidang_name}</p>
                        )}
                        {book.author && (
                          <p className="pkg-book-card__author">{book.author}</p>
                        )}
                        {book.stock != null && (
                          <p className={`pkg-book-card__stock${book.stock === 0 ? ' pkg-book-card__stock--empty' : ''}`}>
                            {book.stock === 0 ? 'Stok Habis' : `Sisa ${book.stock}`}
                          </p>
                        )}
                        <button
                          type="button"
                          className="pkg-book-card__select-btn"
                          onClick={() => navigateToPayment(book)}
                        >
                          Pilih Bab →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Chapter Modal */}
      {modalBook && (() => {
        const chapters = chaptersMap[modalBook.id];
        return (
          <>
            <div className="pkgmodal__backdrop" onClick={closeBookModal} />
            <div className="pkgmodal" role="dialog" aria-modal="true">
              {modalBook.cover && (
                <div className="pkgmodal__hero">
                  <img src={modalBook.cover} alt={modalBook.title} className="pkgmodal__hero-img" />
                  <div className="pkgmodal__hero-overlay">
                    <div className="book-preview__tags">
                      {modalBook.bidang_name && <span className="book-preview__tag book-preview__tag--bidang">{modalBook.bidang_name}</span>}
                      {modalBook.genre && <span className="book-preview__tag">{modalBook.genre}</span>}
                    </div>
                    <h2 className="pkgmodal__hero-title">{modalBook.title}</h2>
                    {modalBook.author && <p className="pkgmodal__hero-author">{modalBook.author}</p>}
                  </div>
                  <button type="button" className="pkgmodal__close" onClick={closeBookModal}>×</button>
                </div>
              )}
              {!modalBook.cover && (
                <div className="pkgmodal__header">
                  <div>
                    <span className="pkgmodal__label">Daftar Bab</span>
                    <h2 className="pkgmodal__title">{modalBook.title}</h2>
                  </div>
                  <button type="button" className="pkgmodal__close pkgmodal__close--flat" onClick={closeBookModal}>×</button>
                </div>
              )}
              <div className="pkgmodal__body">
                {!chapters ? (
                  <p className="pkgmodal__loading">Memuat bab…</p>
                ) : chapters.length === 0 ? (
                  <p className="pkgmodal__empty">Belum ada bab yang ditentukan.</p>
                ) : (
                  <table className="pkgmodal__table">
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Judul Bab</th>
                        <th>Harga</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chapters.map((ch) => (
                        <tr key={ch.id}>
                          <td className="pkgmodal__table-num">{ch.number}</td>
                          <td>{ch.title}</td>
                          <td className="pkgmodal__table-price">{ch.price > 0 ? fmt(ch.price) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* CTA */}
      <section className="packages-cta">
        <div className="container packages-cta__inner">
          <h2>{p.ctaTitle}</h2>
          <p>{p.ctaDesc}</p>
          <div className="packages-cta__actions">
            <Link to="/register" className="btn btn-primary">{p.createAccount}</Link>
            <Link to="/books" className="btn btn-secondary">{p.exploreBooks}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Packages;
