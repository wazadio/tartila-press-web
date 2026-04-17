import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { packagesApi, booksApi, bookChaptersApi } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import './ChapterSelect.css';

function fmt(price) {
  return `Rp ${Number(price).toLocaleString('id-ID')}`;
}

function chapterFinalPrice(c, pkg) {
  const base = c.price > 0 ? c.price : (pkg?.price || 0);
  const discount = pkg?.discount || 0;
  return Math.round(base * (1 - discount / 100));
}

function ChapterSelect() {
  const { id: pkgId, bookId } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const p = t.packages;

  const [pkg, setPkg] = useState(null);
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    Promise.all([
      packagesApi.get(pkgId),
      booksApi.get(bookId),
      bookChaptersApi.list(bookId),
    ])
      .then(([pkgData, bookData, chapData]) => {
        setPkg(pkgData);
        setBook(bookData);
        setChapters(chapData);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [pkgId, bookId]);

  function toggleChapter(chId) {
    setSelectedIds((prev) =>
      prev.includes(chId) ? prev.filter((x) => x !== chId) : [...prev, chId]
    );
  }

  function handleConfirm() {
    navigate(`/payment/${pkgId}?book=${bookId}&chapters=${selectedIds.join(',')}`);
  }

  const selectedChapters = chapters.filter((c) => selectedIds.includes(c.id));
  const total = selectedChapters.length > 0
    ? selectedChapters.reduce((sum, c) => sum + chapterFinalPrice(c, pkg), 0)
    : (pkg?.final_price || 0);

  if (loading) {
    return (
      <div className="chsel-state container">
        <p>Memuat…</p>
      </div>
    );
  }

  if (notFound || !pkg || !book) {
    return (
      <div className="chsel-state container">
        <p>Data tidak ditemukan.</p>
        <Link to={`/payment/${pkgId}`} className="btn btn-secondary">← Kembali</Link>
      </div>
    );
  }

  return (
    <div className="chsel-page">
      {/* Breadcrumb */}
      <div className="chsel-breadcrumb">
        <div className="container">
          <Link to={`/packages/${pkgId}`} className="chsel-breadcrumb__link">Paket</Link>
          <span className="chsel-breadcrumb__sep">/</span>
          <Link to={`/payment/${pkgId}`} className="chsel-breadcrumb__link">{pkg.name}</Link>
          <span className="chsel-breadcrumb__sep">/</span>
          <span className="chsel-breadcrumb__current">Pilih Bab</span>
        </div>
      </div>

      <div className="container chsel-layout">
        {/* Left — book info */}
        <div className="chsel-book">
          {book.cover && (
            <div className="chsel-book__cover-wrap">
              <img
                src={book.cover}
                alt={book.title}
                className="chsel-book__cover"
                onClick={() => setLightboxSrc(book.cover)}
                title="Klik untuk memperbesar"
              />
            </div>
          )}
          {!book.cover && (
            <div className="chsel-book__cover-placeholder">📖</div>
          )}
          <div className="chsel-book__meta">
            {book.genre && <span className="chsel-book__tag">{book.genre}</span>}
            {book.bidang_name && <span className="chsel-book__tag chsel-book__tag--bidang">{book.bidang_name}</span>}
          </div>
          <h2 className="chsel-book__title">{book.title}</h2>
          {(book.synopsis || book.description) && (
            <p className="chsel-book__synopsis">
              {book.synopsis || book.description}
            </p>
          )}
        </div>

        {/* Right — chapter selection */}
        <div className="chsel-main">
          <div className="chsel-pkg-badge">
            <span className="chsel-pkg-badge__icon">📄</span>
            <span className="chsel-pkg-badge__name">{pkg.name}</span>
            {pkg.discount > 0 && (
              <span className="chsel-pkg-badge__discount">−{pkg.discount}%</span>
            )}
          </div>

          <h1 className="chsel-title">Pilih Bab yang Ingin Dipesan</h1>

          {chapters.length === 0 ? (
            <p className="chsel-empty">Belum ada daftar bab untuk buku ini.</p>
          ) : (
            <div className="chsel-list">
              {chapters.map((ch) => {
                const outOfStock = ch.stock != null && ch.stock <= 0;
                const finalPrice = chapterFinalPrice(ch, pkg);
                return (
                  <label
                    key={ch.id}
                    className={`chsel-item${selectedIds.includes(ch.id) ? ' chsel-item--checked' : ''}${outOfStock ? ' chsel-item--disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(ch.id)}
                      onChange={() => !outOfStock && toggleChapter(ch.id)}
                      disabled={outOfStock}
                    />
                    <span className="chsel-item__num">Bab {ch.number}</span>
                    <span className="chsel-item__title">{ch.title}</span>
                    <div className="chsel-item__right">
                      {ch.price > 0 && (
                        <span className="chsel-item__price">
                          {pkg.discount > 0 && (
                            <span className="chsel-item__original">{fmt(ch.price)}</span>
                          )}
                          {fmt(finalPrice)}
                        </span>
                      )}
                      {ch.stock != null && (
                        <span className={`chsel-item__stock${outOfStock ? ' chsel-item__stock--empty' : ''}`}>
                          {outOfStock ? 'Habis' : `Sisa ${ch.stock}`}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {selectedIds.length > 0 && (
            <p className="chsel-hint">{selectedIds.length} bab dipilih</p>
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="chsel-footer">
        <div className="container chsel-footer__inner">
          <div className="chsel-footer__total">
            <span className="chsel-footer__total-label">
              {selectedIds.length > 0 ? `${selectedIds.length} bab — Estimasi` : 'Mulai dari'}
            </span>
            <span className="chsel-footer__total-price">{fmt(total)}</span>
          </div>
          <div className="chsel-footer__actions">
            <Link to={`/payment/${pkgId}`} className="btn btn-secondary">← Kembali</Link>
            <button
              type="button"
              className="btn btn-primary"
              disabled={chapters.length > 0 && selectedIds.length === 0}
              onClick={handleConfirm}
            >
              Konfirmasi &amp; Lanjutkan →
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div className="chsel-lightbox" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="Preview" className="chsel-lightbox__img" />
        </div>
      )}
    </div>
  );
}

export default ChapterSelect;
