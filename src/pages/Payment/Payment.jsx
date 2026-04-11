import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { packagesApi, genresApi, transactionsApi, booksApi, bookChaptersApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import './Payment.css';

function genreLabel(g, lang) {
  return lang === 'id' && g.name_id ? g.name_id : g.name;
}

function fmt(price) {
  return `Rp ${Number(price).toLocaleString('id-ID')}`;
}

function Payment() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, lang } = useLang();
  const p = t.payment;

  const [pkg, setPkg] = useState(null);
  const [genreList, setGenreList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  const [chapters, setChapters] = useState(1);
  const [bookList, setBookList] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [availableChapters, setAvailableChapters] = useState([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState([]);
  const [form, setForm] = useState({
    bookTitle: '',
    genre: '',
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.allSettled([packagesApi.get(id), genresApi.list(), transactionsApi.getConfig()])
      .then(([pkgResult, genreResult, configResult]) => {
        if (pkgResult.status !== 'fulfilled') {
          setNotFound(true);
          return;
        }

        const pkgData = pkgResult.value;
        const gData = genreResult.status === 'fulfilled' ? genreResult.value : [];
        setPkg(pkgData);
        setGenreList(gData);
        if (configResult.status === 'fulfilled') {
          setBankName(configResult.value.bank_name || '');
          setBankAccountName(configResult.value.bank_account_name || '');
          setBankAccountNumber(configResult.value.bank_account_number || '');
        }
        if (pkgData.type === 'per_chapter') {
          booksApi.list().then(setBookList).catch(() => {});
        }
        setForm((prev) => ({
          ...prev,
          name: user?.name || '',
          email: user?.email || '',
          genre: gData[0]?.name || '',
        }));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isPerChapter = pkg?.type === 'per_chapter';
  const unitPrice = pkg?.final_price || 0;

  // total: if chapters have individual prices, sum those; otherwise unit_price × count
  const selectedChapters = availableChapters.filter((c) => selectedChapterIds.includes(c.id));
  const total = isPerChapter
    ? (selectedChapters.length > 0
        ? selectedChapters.reduce((sum, c) => sum + (c.price || unitPrice), 0)
        : unitPrice * chapters)
    : unitPrice;
  const chapterCount = isPerChapter
    ? (selectedChapterIds.length > 0 ? selectedChapterIds.length : chapters)
    : 1;

  function handleBookSelect(e) {
    const bookId = e.target.value;
    setSelectedBookId(bookId);
    setSelectedChapterIds([]);
    setAvailableChapters([]);
    if (bookId) {
      const book = bookList.find((b) => String(b.id) === String(bookId));
      setForm((prev) => ({ ...prev, bookTitle: book?.title || '' }));
      bookChaptersApi.list(bookId)
        .then((chs) => { setAvailableChapters(chs); })
        .catch(() => {});
    } else {
      setForm((prev) => ({ ...prev, bookTitle: '' }));
    }
  }

  function toggleChapter(chId) {
    setSelectedChapterIds((prev) =>
      prev.includes(chId) ? prev.filter((x) => x !== chId) : [...prev, chId]
    );
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const errs = {};
    if (!form.bookTitle.trim()) errs.bookTitle = p.bookTitleRequired;
    if (!form.genre) errs.genre = p.genreRequired;
    if (!form.name.trim()) errs.name = p.nameRequired;
    if (!form.email.trim()) errs.email = p.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = p.emailInvalid;
    if (!form.phone.trim()) errs.phone = p.phoneRequired;
    if (isPerChapter && availableChapters.length > 0 && selectedChapterIds.length === 0)
      errs.chapters = 'Please select at least one chapter.';
    if (isPerChapter && availableChapters.length === 0 && chapters < 1) errs.chapters = p.chaptersRequired;
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setSubmitError('');
    try {
      const created = await transactionsApi.create({
        package_id: pkg.id,
        book_title: form.bookTitle,
        genre: form.genre,
        chapters: chapterCount,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        notes: [
          form.notes,
          selectedChapters.length > 0
            ? 'Chapters: ' + selectedChapters.map((c) => `Ch.${c.number} ${c.title}`).join(', ')
            : '',
        ].filter(Boolean).join('\n'),
      });
      setTransaction(created);
      setBankName(created.bank_name || bankName);
      setBankAccountName(created.bank_account_name || bankAccountName);
      setBankAccountNumber(created.bank_account_number || bankAccountNumber);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || p.submitFailed);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container payment-state"><p>{p.loading}</p></div>;

  if (notFound || !pkg) {
    return (
      <div className="container payment-state">
        <h2>{p.notFound}</h2>
        <Link to="/packages" className="btn btn-primary" style={{ marginTop: '1rem' }}>{p.backToPackages}</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="payment-success">
        <div className="container">
          <div className="payment-success__card">
            <div className="payment-success__icon">✓</div>
            <h2>{p.successTitle}</h2>
            <p>{p.successDesc}</p>
            <div className="payment-success__summary">
              <div className="payment-success__row">
                <span>{p.package}</span>
                <span>{pkg.name}</span>
              </div>
              {isPerChapter && (
                <div className="payment-success__row">
                  <span>{p.chapters}</span>
                  <span>{chapters} {p.chaptersUnit}</span>
                </div>
              )}
              <div className="payment-success__row">
                <span>{p.bookTitle}</span>
                <span>{form.bookTitle}</span>
              </div>
              <div className="payment-success__row">
                <span>{p.genre}</span>
                <span>{form.genre}</span>
              </div>
              <div className="payment-success__row payment-success__row--total">
                <span>{p.total}</span>
                <span>{fmt(total)}</span>
              </div>
              <div className="payment-success__row">
                <span>{p.paymentStatus}</span>
                <span>{transaction?.status === 'paid' ? p.statusPaid : p.statusUnpaid}</span>
              </div>
              <div className="payment-success__row">
                <span>{p.bankNameLabel}</span>
                <span>{bankName || '-'}</span>
              </div>
              <div className="payment-success__row">
                <span>{p.bankAccountNameLabel}</span>
                <span>{bankAccountName || '-'}</span>
              </div>
              <div className="payment-success__row">
                <span>{p.bankNumberLabel}</span>
                <span>{bankAccountNumber || '-'}</span>
              </div>
            </div>
            <p className="payment-success__note">{p.successNote}</p>
            <Link to="/packages" className="btn btn-secondary">{p.backToPackages}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="container">
        <div className="payment-breadcrumb">
          <Link to="/packages">{p.packages}</Link>
          <span>/</span>
          <span>{p.checkout}</span>
        </div>

        <div className="payment-layout">
          {/* Form */}
          <div className="payment-form-wrap">
            <h1 className="payment-title">{p.title}</h1>

            <form className="payment-form" onSubmit={handleSubmit} noValidate>
              {/* Chapter selector — only for per_chapter */}
              {isPerChapter && (
                <div className="payment-section">
                  <h2 className="payment-section__title">{p.chapterSelection}</h2>

                  {/* Book selector */}
                  {bookList.length > 0 && (
                    <div className="form-group">
                      <label>Select Book</label>
                      <select value={selectedBookId} onChange={handleBookSelect}>
                        <option value="">— pick a book —</option>
                        {bookList.map((b) => (
                          <option key={b.id} value={b.id}>{b.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Sellable chapters checklist */}
                  {availableChapters.length > 0 ? (
                    <div className="form-group">
                      <label>Select Chapters</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
                        {availableChapters.map((ch) => (
                          <label key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedChapterIds.includes(ch.id)}
                              onChange={() => toggleChapter(ch.id)}
                            />
                            <span>Ch.{ch.number} — {ch.title}</span>
                            {ch.price > 0 && <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{fmt(ch.price)}</span>}
                          </label>
                        ))}
                      </div>
                      {errors.chapters && <p className="error-msg">{errors.chapters}</p>}
                      {selectedChapterIds.length > 0 && (
                        <p className="chapter-hint" style={{ marginTop: '0.5rem' }}>
                          {selectedChapterIds.length} chapter(s) selected · Total: <strong>{fmt(total)}</strong>
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Fallback: manual chapter count if no sellable chapters defined */
                    <>
                      <div className="chapter-selector">
                        <button type="button" className="chapter-btn" onClick={() => setChapters((c) => Math.max(1, c - 1))}>−</button>
                        <input
                          type="number" min="1" value={chapters}
                          onChange={(e) => setChapters(Math.max(1, parseInt(e.target.value) || 1))}
                          className="chapter-input"
                        />
                        <button type="button" className="chapter-btn" onClick={() => setChapters((c) => c + 1)}>+</button>
                        <span className="chapter-label">{p.chaptersUnit}</span>
                      </div>
                      {errors.chapters && <p className="error-msg">{errors.chapters}</p>}
                      <p className="chapter-hint">
                        {chapters} {p.chaptersUnit} × {fmt(unitPrice)} = <strong>{fmt(total)}</strong>
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Book info */}
              <div className="payment-section">
                <h2 className="payment-section__title">{p.bookInfo}</h2>
                <div className="form-group">
                  <label>{p.bookTitle} *</label>
                  <input
                    name="bookTitle" type="text" value={form.bookTitle}
                    onChange={handleChange} placeholder={p.bookTitlePlaceholder}
                    className={errors.bookTitle ? 'input-error' : ''}
                  />
                  {errors.bookTitle && <span className="error-msg">{errors.bookTitle}</span>}
                </div>
                <div className="form-group">
                  <label>{p.genre} *</label>
                  <select
                    name="genre" value={form.genre} onChange={handleChange}
                    className={errors.genre ? 'input-error' : ''}
                  >
                    <option value="">{p.genrePlaceholder}</option>
                    {genreList.map((g) => (
                      <option key={g.id} value={g.name}>{genreLabel(g, lang)}</option>
                    ))}
                  </select>
                  {errors.genre && <span className="error-msg">{errors.genre}</span>}
                </div>
                <div className="form-group">
                  <label>{p.notes}</label>
                  <textarea
                    name="notes" rows={3} value={form.notes}
                    onChange={handleChange} placeholder={p.notesPlaceholder}
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="payment-section">
                <h2 className="payment-section__title">{p.contactInfo}</h2>
                <div className="form-group">
                  <label>{p.name} *</label>
                  <input
                    name="name" type="text" value={form.name}
                    onChange={handleChange} className={errors.name ? 'input-error' : ''}
                  />
                  {errors.name && <span className="error-msg">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>{p.email} *</label>
                  <input
                    name="email" type="email" value={form.email}
                    onChange={handleChange} className={errors.email ? 'input-error' : ''}
                  />
                  {errors.email && <span className="error-msg">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label>{p.phone} *</label>
                  <input
                    name="phone" type="tel" value={form.phone}
                    onChange={handleChange} placeholder={p.phonePlaceholder}
                    className={errors.phone ? 'input-error' : ''}
                  />
                  {errors.phone && <span className="error-msg">{errors.phone}</span>}
                </div>
              </div>

              <button type="submit" className="btn btn-primary payment-submit" disabled={submitting}>
                {submitting ? p.processing : p.submit}
              </button>
              {submitError && <p className="error-msg" style={{ marginTop: '0.8rem' }}>{submitError}</p>}
            </form>
          </div>

          {/* Order summary */}
          <div className="payment-summary">
            <div className="payment-summary__card">
              <h2 className="payment-summary__title">{p.orderSummary}</h2>
              <div className="payment-summary__pkg-name">{pkg.name}</div>
              <div className="payment-summary__type">
                {pkg.type === 'per_chapter' ? p.perChapter : p.perBook}
              </div>
              {pkg.description && (
                <p className="payment-summary__desc">{pkg.description}</p>
              )}
              <div className="payment-summary__divider" />
              {isPerChapter ? (
                <>
                  <div className="payment-summary__row">
                    <span>{p.pricePerChapter}</span>
                    <span>{fmt(unitPrice)}</span>
                  </div>
                  <div className="payment-summary__row">
                    <span>{p.chapters}</span>
                    <span>{chapters}</span>
                  </div>
                </>
              ) : (
                <div className="payment-summary__row">
                  <span>{p.packagePrice}</span>
                  <span>{fmt(unitPrice)}</span>
                </div>
              )}
              {pkg.discount > 0 && (
                <div className="payment-summary__row payment-summary__row--discount">
                  <span>{p.discount}</span>
                  <span>−{pkg.discount}%</span>
                </div>
              )}
              <div className="payment-summary__divider" />
              <div className="payment-summary__row payment-summary__row--total">
                <span>{p.total}</span>
                <span>{fmt(total)}</span>
              </div>
              <div className="payment-summary__method">
                <p className="payment-summary__method-label">{p.paymentMethod}</p>
                <div className="payment-summary__method-option">
                  🏦 {p.bankTransfer}
                </div>
                <div className="payment-summary__bank-number">
                  {p.bankNameLabel}: {bankName || '-'}
                </div>
                <div className="payment-summary__bank-number">
                  {p.bankAccountNameLabel}: {bankAccountName || '-'}
                </div>
                <div className="payment-summary__bank-number">
                  {p.bankNumberLabel}: {bankAccountNumber || '-'}
                </div>
                <p className="payment-summary__method-note">{p.bankNote}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;
