import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { packagesApi, genresApi, transactionsApi, booksApi, bookChaptersApi, bidangApi } from '../../services/api';
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
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
  const [bidangList, setBidangList] = useState([]);
  const [selectedBidangId, setSelectedBidangId] = useState('');
  const [selectedGenreFilter, setSelectedGenreFilter] = useState('');
  const [bookList, setBookList] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookConfirmed, setBookConfirmed] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
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
    Promise.allSettled([packagesApi.get(id), genresApi.list(), transactionsApi.getConfig(), bidangApi.list()])
      .then(([pkgResult, genreResult, configResult, bidangResult]) => {
        if (pkgResult.status !== 'fulfilled') {
          setNotFound(true);
          return;
        }

        const pkgData = pkgResult.value;
        const gData = genreResult.status === 'fulfilled' ? genreResult.value : [];
        const bData = bidangResult.status === 'fulfilled' ? bidangResult.value : [];
        setPkg(pkgData);
        setGenreList(gData);
        setBidangList(bData);
        if (configResult.status === 'fulfilled') {
          setBankName(configResult.value.bank_name || '');
          setBankAccountName(configResult.value.bank_account_name || '');
          setBankAccountNumber(configResult.value.bank_account_number || '');
        }
        if (pkgData.type === 'per_chapter') {
          const preBookId = searchParams.get('book');
          booksApi.list({ is_template: true }).then((books) => {
            setBookList(books);
            if (preBookId) {
              const book = books.find((b) => String(b.id) === String(preBookId));
              if (book) {
                setSelectedBookId(String(book.id));
                setSelectedBook(book);
                setForm((prev) => ({ ...prev, bookTitle: book.title || '', genre: book.genre || '' }));
                const preChapterIds = searchParams.get('chapters');
                bookChaptersApi.list(book.id)
                  .then((chs) => {
                    setAvailableChapters(chs);
                    if (preChapterIds) {
                      const ids = preChapterIds.split(',').map(Number).filter(Boolean);
                      const validIds = chs.filter((c) => ids.includes(c.id)).map((c) => c.id);
                      setSelectedChapterIds(validIds);
                      setBookConfirmed(true);
                    }
                  })
                  .catch(() => {});
                if (!preChapterIds) {
                  setBookModalOpen(true);
                }
              }
            }
          }).catch(() => {});
        }
        setForm((prev) => ({
          ...prev,
          name: user?.name || '',
          email: user?.email || '',
          genre: pkgData.type === 'per_chapter' ? '' : (gData[0]?.name || ''),
        }));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isPerChapter = pkg?.type === 'per_chapter';
  const unitPrice = pkg?.final_price || 0;

  // total: if chapters have individual prices, sum those; otherwise unit_price × count
  const selectedChapters = availableChapters.filter((c) => selectedChapterIds.includes(c.id));
  // Apply package discount to chapter individual price
  function chapterFinalPrice(c) {
    const base = c.price > 0 ? c.price : (pkg?.price || 0);
    const discount = pkg?.discount || 0;
    return Math.round(base * (1 - discount / 100));
  }

  const total = isPerChapter
    ? (selectedChapters.length > 0
        ? selectedChapters.reduce((sum, c) => sum + chapterFinalPrice(c), 0)
        : unitPrice * chapters)
    : unitPrice;
  const chapterCount = isPerChapter
    ? (selectedChapterIds.length > 0 ? selectedChapterIds.length : chapters)
    : 1;

  function handleBidangSelect(e) {
    setSelectedBidangId(e.target.value);
    setSelectedGenreFilter('');
    setSelectedBookId('');
    setSelectedBook(null);
    setAvailableChapters([]);
    setSelectedChapterIds([]);
    setBookConfirmed(false);
    setForm((prev) => ({ ...prev, bookTitle: '', genre: '' }));
    setFilteredBooks([]);
  }

  function handleGenreFilterSelect(e) {
    const genreName = e.target.value;
    setSelectedGenreFilter(genreName);
    setSelectedBookId('');
    setSelectedBook(null);
    setAvailableChapters([]);
    setSelectedChapterIds([]);
    setForm((prev) => ({ ...prev, bookTitle: '', genre: genreName }));
    const filtered = bookList.filter((b) => b.genre === genreName);
    setFilteredBooks(filtered);
  }

  function handleBookSelect(e) {
    const bookId = e.target.value;
    setSelectedBookId(bookId);
    setSelectedChapterIds([]);
    setAvailableChapters([]);
    if (bookId) {
      const book = bookList.find((b) => String(b.id) === String(bookId));
      setSelectedBook(book || null);
      setForm((prev) => ({ ...prev, bookTitle: book?.title || '' }));
      bookChaptersApi.list(bookId)
        .then((chs) => { setAvailableChapters(chs); })
        .catch(() => {});
    } else {
      setSelectedBook(null);
      setForm((prev) => ({ ...prev, bookTitle: '' }));
    }
  }

  function handleBookCardClick(book) {
    navigate(`/payment/${id}/chapters/${book.id}`);
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
    if (isPerChapter) {
      if (!selectedBookId) errs.bookTitle = 'Pilih buku terlebih dahulu.';
      else if (availableChapters.length > 0 && selectedChapterIds.length === 0)
        errs.chapters = 'Pilih minimal satu bab.';
      else if (availableChapters.length === 0 && chapters < 1) errs.chapters = p.chaptersRequired;
    } else {
      if (!form.bookTitle.trim()) errs.bookTitle = p.bookTitleRequired;
      if (!form.genre) errs.genre = p.genreRequired;
    }
    if (!form.name.trim()) errs.name = p.nameRequired;
    if (!form.email.trim()) errs.email = p.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = p.emailInvalid;
    if (!user?.phone && !form.phone.trim()) errs.phone = p.phoneRequired;
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
        customer_name: user?.name || form.name,
        customer_email: user?.email || form.email,
        customer_phone: user?.phone || form.phone,
        notes: [
          form.notes,
          selectedChapters.length > 0
            ? 'Chapters: ' + selectedChapters.map((c) => `Ch.${c.number} ${c.title}`).join(', ')
            : '',
        ].filter(Boolean).join('\n'),
        book_id: selectedBook ? selectedBook.id : null,
        chapter_ids: selectedChapters.map((c) => c.id),
      });
      setTransaction(created);
      setBankName(created.bank_name || bankName);
      setBankAccountName(created.bank_account_name || bankAccountName);
      setBankAccountNumber(created.bank_account_number || bankAccountNumber);
      // Save phone to user profile if they entered it and don't have one yet
      if (user && !user.phone && form.phone.trim()) {
        updateProfile({ phone: form.phone.trim() }).catch(() => {});
      }
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

  const activeFilterCount = [selectedBidangId, selectedGenreFilter].filter(Boolean).length;

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-breadcrumb">
          <Link to="/packages">{p.packages}</Link>
          <span>/</span>
          <span>{p.checkout}</span>
        </div>
        <h1 className="payment-title">{p.title}</h1>

        <form className="payment-layout" onSubmit={handleSubmit} noValidate>

          {/* ── MAIN: Book grid + preview + chapters ── */}
          <div className="payment-col payment-col--main">

            {isPerChapter && (
              <div className="filter-toolbar">
                <button
                  type="button"
                  className={`filter-toolbar__btn${activeFilterCount > 0 ? ' filter-toolbar__btn--active' : ''}`}
                  onClick={() => setFilterDrawerOpen(true)}
                >
                  <span className="filter-toolbar__icon">⚙</span>
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="filter-toolbar__badge">{activeFilterCount}</span>
                  )}
                </button>
                {selectedBidangId && (
                  <span className="filter-toolbar__chip">
                    {bidangList.find((b) => String(b.id) === String(selectedBidangId))?.name}
                    <button type="button" onClick={handleBidangSelect.bind(null, { target: { value: '' } })}>×</button>
                  </span>
                )}
                {selectedGenreFilter && (
                  <span className="filter-toolbar__chip">
                    {selectedGenreFilter}
                    <button type="button" onClick={handleGenreFilterSelect.bind(null, { target: { value: '' } })}>×</button>
                  </span>
                )}
              </div>
            )}

            {isPerChapter ? (
              <>
                {/* Book grid — only content in main column */}
                {(() => {
                  const displayBooks = selectedGenreFilter
                    ? filteredBooks
                    : selectedBidangId
                      ? bookList.filter((b) => b.bidang_name && bidangList.find((bd) => String(bd.id) === String(selectedBidangId))?.name === b.bidang_name)
                      : bookList;
                  return displayBooks.length > 0 ? (
                    <div className="book-grid-list">
                      {displayBooks.map((b) => {
                        const isConfirmed = bookConfirmed && String(b.id) === String(selectedBookId);
                        return (
                          <button
                            key={b.id}
                            type="button"
                            className={`book-grid-item${isConfirmed ? ' book-grid-item--selected' : ''}`}
                            onClick={() => handleBookCardClick(b)}
                          >
                            <div className="book-grid-item__cover-wrap">
                              {b.cover
                                ? <img
                                    src={b.cover} alt={b.title}
                                    className="book-grid-item__cover"
                                    onClick={(e) => { e.stopPropagation(); setLightboxSrc(b.cover); }}
                                    title="Klik untuk memperbesar"
                                  />
                                : <div className="book-grid-item__cover-placeholder">📖</div>
                              }
                              {isConfirmed && <div className="book-grid-item__check">✓</div>}
                            </div>
                            <div className="book-grid-item__info">
                              <div className="book-grid-item__title">{b.title}</div>
                              <div className="book-grid-item__tags">
                                {b.bidang_name && <span className="book-grid-item__tag book-grid-item__tag--bidang">{b.bidang_name}</span>}
                                {b.genre && <span className="book-grid-item__tag">{b.genre}</span>}
                              </div>
                              <div className="book-grid-item__cta">
                                {isConfirmed ? 'Dipilih ✓' : 'Pilih Bab →'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="payment-preview-placeholder">
                      <p>{selectedBidangId || selectedGenreFilter ? 'Tidak ada buku untuk filter ini.' : 'Belum ada template buku tersedia.'}</p>
                    </div>
                  );
                })()}
              </>
            ) : (
              /* Per-book: book info form */
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
            )}
          </div>

          {/* ── RIGHT: Confirmed book + Contact + Summary + Submit ── */}
          <div className="payment-col payment-col--right">

            {/* Book confirmation card */}
            {isPerChapter && (
              <div className={`payment-section book-confirmed-card${bookConfirmed ? ' book-confirmed-card--active' : ''}`}>
                {bookConfirmed && selectedBook ? (
                  <>
                    <div className="book-confirmed-card__row">
                      {selectedBook.cover && (
                        <img src={selectedBook.cover} alt={selectedBook.title} className="book-confirmed-card__cover" />
                      )}
                      <div className="book-confirmed-card__info">
                        <div className="book-confirmed-card__label">Buku Dipilih</div>
                        <div className="book-confirmed-card__title">{selectedBook.title}</div>
                        <div className="book-preview__tags" style={{ marginTop: '0.3rem' }}>
                          {selectedBook.genre && <span className="book-preview__tag">{selectedBook.genre}</span>}
                          {selectedBook.bidang_name && <span className="book-preview__tag book-preview__tag--bidang">{selectedBook.bidang_name}</span>}
                        </div>
                        {selectedChapterIds.length > 0 && (
                          <div className="book-confirmed-card__chapters">{selectedChapterIds.length} bab dipilih</div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '0.75rem', width: '100%' }}
                      onClick={() => navigate(`/payment/${id}/chapters/${selectedBook.id}`)}
                    >
                      Ubah Pilihan
                    </button>
                  </>
                ) : (
                  <div className="book-confirmed-card__empty">
                    <span>📚</span>
                    <p>Pilih buku template dari daftar untuk melanjutkan.</p>
                  </div>
                )}
                {errors.bookTitle && <p className="error-msg" style={{ marginTop: '0.5rem' }}>{errors.bookTitle}</p>}
              </div>
            )}

            <div className="payment-section">
              <h2 className="payment-section__title">{p.contactInfo}</h2>
              {user ? (
                <div className="payment-user-info">
                  <div className="payment-user-info__row">
                    <span className="payment-user-info__label">{p.name}</span>
                    <span className="payment-user-info__value">{user.name}</span>
                  </div>
                  <div className="payment-user-info__row">
                    <span className="payment-user-info__label">{p.email}</span>
                    <span className="payment-user-info__value">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="payment-user-info__row">
                      <span className="payment-user-info__label">{p.phone}</span>
                      <span className="payment-user-info__value">{user.phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
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
                </>
              )}
              {!user?.phone && (
                <div className="form-group">
                  <label>{p.phone} *</label>
                  <input
                    name="phone" type="tel" value={form.phone}
                    onChange={handleChange} placeholder={p.phonePlaceholder}
                    className={errors.phone ? 'input-error' : ''}
                  />
                  {errors.phone && <span className="error-msg">{errors.phone}</span>}
                </div>
              )}
              <div className="form-group">
                <label>{p.notes}</label>
                <textarea
                  name="notes" rows={2} value={form.notes}
                  onChange={handleChange} placeholder={p.notesPlaceholder}
                />
              </div>
            </div>

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
                  {selectedChapters.length > 0 && selectedChapters.some((c) => c.price > 0) ? (
                    // Chapters have individual prices — show itemised with discount applied
                    selectedChapters.map((c) => (
                      <div key={c.id} className="payment-summary__row payment-summary__row--chapter">
                        <span>Bab {c.number}: {c.title?.length > 20 ? c.title.slice(0, 20) + '…' : c.title}</span>
                        <span>{fmt(chapterFinalPrice(c))}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="payment-summary__row">
                        <span>{p.pricePerChapter}</span>
                        <span>{fmt(unitPrice)}</span>
                      </div>
                      <div className="payment-summary__row">
                        <span>{p.chapters}</span>
                        <span>{chapterCount}</span>
                      </div>
                    </>
                  )}
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
              <button type="submit" className="btn btn-primary payment-submit" disabled={submitting}>
                {submitting ? p.processing : p.submit}
              </button>
              {submitError && <p className="error-msg" style={{ marginTop: '0.8rem' }}>{submitError}</p>}
            </div>
          </div>

        </form>
      </div>


      {/* ── Filter Drawer ── */}
      {isPerChapter && (
        <>
          {filterDrawerOpen && (
            <div className="filter-drawer__backdrop" onClick={() => setFilterDrawerOpen(false)} />
          )}
          <div className={`filter-drawer${filterDrawerOpen ? ' filter-drawer--open' : ''}`}>
            <div className="filter-drawer__header">
              <span className="filter-drawer__title">Filter Buku</span>
              <button type="button" className="filter-drawer__close" onClick={() => setFilterDrawerOpen(false)}>×</button>
            </div>
            <div className="filter-drawer__body">
              <div className="form-group">
                <label>Bidang</label>
                <select value={selectedBidangId} onChange={handleBidangSelect}>
                  <option value="">— Semua Bidang —</option>
                  {bidangList.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {errors.bidang && <p className="error-msg">{errors.bidang}</p>}
              </div>

              {selectedBidangId && (() => {
                const linked = genreList.filter((g) => String(g.bidang_id) === String(selectedBidangId));
                const options = linked.length > 0 ? linked : genreList;
                return (
                  <div className="form-group">
                    <label>{p.genre}</label>
                    <select value={selectedGenreFilter} onChange={handleGenreFilterSelect}>
                      <option value="">— Semua Genre —</option>
                      {options.map((g) => (
                        <option key={g.id} value={g.name}>{genreLabel(g, lang)}</option>
                      ))}
                    </select>
                    {errors.genre && <p className="error-msg">{errors.genre}</p>}
                  </div>
                );
              })()}

              {form.bookTitle && (
                <div className="form-group">
                  <label>Buku Dipilih</label>
                  <input type="text" value={form.bookTitle} readOnly className="input-readonly" />
                </div>
              )}
            </div>
            <div className="filter-drawer__footer">
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => setFilterDrawerOpen(false)}
              >
                Terapkan Filter
              </button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  onClick={() => {
                    handleBidangSelect({ target: { value: '' } });
                    setFilterDrawerOpen(false);
                  }}
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Lightbox ── */}
      {lightboxSrc && (
        <div
          className="lightbox"
          onClick={() => setLightboxSrc(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Lihat gambar"
        >
          <button type="button" className="lightbox__close" onClick={() => setLightboxSrc(null)}>×</button>
          <img src={lightboxSrc} alt="" className="lightbox__img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default Payment;
