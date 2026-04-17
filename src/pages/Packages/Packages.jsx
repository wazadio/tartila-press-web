import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { packagesApi } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import './Packages.css';

const TYPE_ICON = {
  per_chapter: '📄',
  per_book: '📚',
};

function fmt(price) {
  return `Rp ${price.toLocaleString('id-ID')}`;
}

function PackageCard({ pkg, p }) {
  const hasDiscount = pkg.discount > 0;
  const isFeatured = pkg.is_featured;

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
        <div className="pkg-card__final">
          {pkg.type === 'per_chapter' && <span className="pkg-card__from">Mulai dari </span>}
          {fmt(pkg.final_price)}
        </div>
        <div className="pkg-card__unit">
          {pkg.type === 'per_chapter' ? p.chapterUnit : p.bookUnit}
        </div>
      </div>

      <div className="pkg-card__actions">
        <Link to={`/packages/${pkg.id}`} className="btn btn-secondary pkg-card__detail">Lihat Detail</Link>
        <Link to={`/payment/${pkg.id}`} className="btn btn-primary pkg-card__cta">{p.getStarted}</Link>
      </div>
    </div>
  );
}

function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLang();
  const p = t.packages;

  useEffect(() => {
    packagesApi.list()
      .then(setPackages)
      .catch(() => setError('Failed to load packages.'))
      .finally(() => setLoading(false));
  }, []);


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

      {/* Packages */}
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
