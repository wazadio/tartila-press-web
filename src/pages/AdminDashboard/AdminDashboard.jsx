import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authorsApi, booksApi, packagesApi, genresApi, transactionsApi, bidangApi } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import './AdminDashboard.css';

const EMPTY_PKG = { name: '', type: 'per_chapter', description: '', price: '', discount: 0 };
const EMPTY_GENRE = { name: '', name_id: '' };
const EMPTY_BIDANG = { name: '' };

function BidangForm({ initial, onSave, onCancel, a }) {
  const [name, setName] = useState(initial.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Nama bidang wajib diisi.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim() });
    } catch (err) {
      setError(err.message || a.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="pkg-form" onSubmit={handleSubmit}>
      <div className="pkg-form__row">
        <div className="pkg-form__field">
          <label>Nama Bidang</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ilmu Sosial, Sains, Sastra…" />
        </div>
      </div>
      {error && <p className="error-msg">{error}</p>}
      <div className="pkg-form__actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? a.saving : initial.id ? 'Update Bidang' : 'Tambah Bidang'}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>{a.cancel}</button>
      </div>
    </form>
  );
}

function GenreForm({ initial, onSave, onCancel, a, bidangList }) {
  const [name, setName] = useState(initial.name || '');
  const [nameId, setNameId] = useState(initial.name_id || '');
  const [bidangId, setBidangId] = useState(initial.bidang_id || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError(a.genreNameRequired); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), name_id: nameId.trim() || null, bidang_id: bidangId ? Number(bidangId) : null });
    } catch (err) {
      setError(err.message || a.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="pkg-form" onSubmit={handleSubmit}>
      <div className="pkg-form__row">
        <div className="pkg-form__field">
          <label>{a.genreName}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={a.genreNamePlaceholder} />
        </div>
        <div className="pkg-form__field">
          <label>{a.genreNameId}</label>
          <input value={nameId} onChange={(e) => setNameId(e.target.value)} placeholder={a.genreNameIdPlaceholder} />
        </div>
        <div className="pkg-form__field">
          <label>Bidang</label>
          <select value={bidangId} onChange={(e) => setBidangId(e.target.value)}>
            <option value="">— Pilih Bidang —</option>
            {bidangList.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="error-msg">{error}</p>}
      <div className="pkg-form__actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? a.saving : initial.id ? a.updateGenre : a.addGenreBtn}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>{a.cancel}</button>
      </div>
    </form>
  );
}

function fmt(price) {
  return `Rp ${Number(price).toLocaleString('id-ID')}`;
}

function fmtDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const formatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
  return `${formatted} WIB`;
}

function AuthorForm({ initial, genreList, onSave, onCancel, a }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    photo: initial.photo || '',
    bio: initial.bio || '',
    nationality: initial.nationality || '',
    books_published: initial.books_published ?? 0,
    genres: initial.genres || [],
    website: initial.website || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }

  function handleGenreSelect(e) {
    const val = e.target.value;
    if (!val || form.genres.includes(val)) return;
    setForm((prev) => ({ ...prev, genres: [...prev.genres, val] }));
    e.target.value = '';
  }

  function removeGenre(name) {
    setForm((prev) => ({ ...prev, genres: prev.genres.filter((g) => g !== name) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError(a.nameRequired); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, books_published: Number(form.books_published) || 0 });
    } catch (err) {
      setError(err.message || a.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="pkg-form" onSubmit={handleSubmit}>
      <div className="pkg-form__row">
        <div className="pkg-form__field">
          <label>{a.authorName}</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={a.authorName} />
        </div>
        <div className="pkg-form__field">
          <label>{a.authorNationality}</label>
          <input value={form.nationality} onChange={(e) => set('nationality', e.target.value)} placeholder={a.authorNationality} />
        </div>
      </div>
      <div className="pkg-form__row">
        <div className="pkg-form__field">
          <label>{a.authorPhoto}</label>
          <input value={form.photo} onChange={(e) => set('photo', e.target.value)} placeholder="https://..." />
        </div>
        <div className="pkg-form__field pkg-form__field--sm">
          <label>{a.authorBooksPublished}</label>
          <input type="number" min="0" value={form.books_published} onChange={(e) => set('books_published', e.target.value)} />
        </div>
      </div>
      <div className="pkg-form__field">
        <label>{a.authorBio}</label>
        <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={2} placeholder={a.authorBio} />
      </div>
      <div className="pkg-form__field">
        <label>{a.authorWebsite}</label>
        <input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." />
      </div>
      <div className="pkg-form__field">
        <label>{a.authorGenres}</label>
        <div className="author-genre-tags">
          {form.genres.map((g) => (
            <span key={g} className="author-genre-tag">
              {g}
              <button type="button" onClick={() => removeGenre(g)}>×</button>
            </span>
          ))}
        </div>
        <select onChange={handleGenreSelect} defaultValue="">
          <option value="" disabled>{a.authorGenrePlaceholder}</option>
          {genreList.filter((g) => !form.genres.includes(g.name)).map((g) => (
            <option key={g.id} value={g.name}>{g.name}</option>
          ))}
        </select>
      </div>
      {error && <p className="error-msg">{error}</p>}
      <div className="pkg-form__actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? a.saving : a.updateAuthor}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>{a.cancel}</button>
      </div>
    </form>
  );
}

function PackageForm({ initial, onSave, onCancel, a }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError(a.nameRequired);
    if (!form.price || Number(form.price) <= 0) return setError(a.priceRequired);
    setSaving(true);
    try {
      await onSave({ ...form, price: Number(form.price), discount: Number(form.discount) });
    } catch (err) {
      setError(err.message || a.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="pkg-form" onSubmit={handleSubmit}>
      <div className="pkg-form__row">
        <div className="pkg-form__field">
          <label>{a.pkgName}</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={a.pkgName} />
        </div>
        <div className="pkg-form__field pkg-form__field--sm">
          <label>{a.pkgType}</label>
          <select value={form.type} onChange={(e) => set('type', e.target.value)}>
            <option value="per_chapter">{a.perChapter}</option>
            <option value="per_book">{a.perBook}</option>
          </select>
        </div>
      </div>
      <div className="pkg-form__field">
        <label>{a.pkgDesc}</label>
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder={`${a.pkgDesc}…`} />
      </div>
      <div className="pkg-form__row">
        <div className="pkg-form__field">
          <label>{a.pkgPrice}</label>
          <input type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder={a.pkgPricePlaceholder} />
        </div>
        <div className="pkg-form__field pkg-form__field--sm">
          <label>{a.pkgDiscount}</label>
          <input type="number" min="0" max="100" value={form.discount} onChange={(e) => set('discount', e.target.value)} placeholder={a.pkgDiscountPlaceholder} />
        </div>
      </div>
      {error && <p className="error-msg">{error}</p>}
      <div className="pkg-form__actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? a.saving : initial.id ? a.updatePackage : a.addPackageBtn}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>{a.cancel}</button>
      </div>
    </form>
  );
}


function AdminDashboard() {
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [packages, setPackages] = useState([]);
  const [genres, setGenres] = useState([]);
  const [bidangList, setBidangList] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [txDrafts, setTxDrafts] = useState({});
  const [txSavingId, setTxSavingId] = useState(null);
  const [txError, setTxError] = useState('');
  const [editingTx, setEditingTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState('');
  const [activeTab, setActiveTab] = useState('books');
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [showGenreForm, setShowGenreForm] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);
  const [showBidangForm, setShowBidangForm] = useState(false);
  const [editingBidang, setEditingBidang] = useState(null);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const { t } = useLang();
  const a = t.admin;

  useEffect(() => {
    Promise.allSettled([booksApi.list(), authorsApi.listAll(), packagesApi.list(), genresApi.list(), transactionsApi.list(), bidangApi.list()])
      .then(([b, au, p, g, tx, bd]) => {
        if (b.status === 'fulfilled') setBooks(b.value);
        else console.error('[admin] books fetch failed:', b.reason);
        if (au.status === 'fulfilled') setAuthors(au.value);
        else console.error('[admin] authors fetch failed:', au.reason);
        if (p.status === 'fulfilled') setPackages(p.value);
        else console.error('[admin] packages fetch failed:', p.reason);
        if (g.status === 'fulfilled') setGenres(g.value);
        else console.error('[admin] genres fetch failed:', g.reason);
        if (bd.status === 'fulfilled') setBidangList(bd.value);
        else console.error('[admin] bidang fetch failed:', bd.reason);
        if (tx.status === 'fulfilled') setTransactions(tx.value);
        else console.error('[admin] transactions fetch failed:', tx.reason);
      })
      .finally(() => setLoading(false));
  }, []);

  function getTxDraft(tx) {
    const saved = txDrafts[tx.id] || {};
    return {
      status: saved.status !== undefined ? saved.status : tx.status,
      delivery_deadline: saved.delivery_deadline !== undefined
        ? saved.delivery_deadline
        : (tx.delivery_deadline ? String(tx.delivery_deadline).slice(0, 10) : ''),
    };
  }

  function updateTxDraft(txId, changes) {
    setTxDrafts((prev) => ({ ...prev, [txId]: { ...(prev[txId] || {}), ...changes } }));
  }

  async function handleSaveTransaction(tx) {
    const draft = getTxDraft(tx);
    setTxSavingId(tx.id);
    setTxError('');
    try {
      const payload = { status: draft.status };
      // Only include delivery_deadline if admin actually edited it in this session
      if (txDrafts[tx.id] && 'delivery_deadline' in txDrafts[tx.id]) {
        payload.delivery_deadline = draft.status === 'unpaid' ? (draft.delivery_deadline || null) : null;
      }
      const updated = await transactionsApi.update(tx.id, payload);
      setTransactions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setTxDrafts((prev) => ({
        ...prev,
        [tx.id]: {
          status: updated.status,
          delivery_deadline: updated.delivery_deadline ? String(updated.delivery_deadline).slice(0, 10) : '',
        },
      }));
      setEditingTx(null);
    } catch (err) {
      // If backend rejected due to stock exhaustion, refresh transaction list to show the badge
      if (err.message && err.message.includes('Stok')) {
        setTransactions((prev) =>
          prev.map((item) => item.id === tx.id ? { ...item, stock_exhausted: true } : item)
        );
      }
      setTxError(err.message || a.updateTransactionFailed);
    } finally {
      setTxSavingId(null);
    }
  }

  async function handleDeleteBook(book) {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    setDeleteError('');
    try {
      await booksApi.delete(book.id);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
    } catch (err) {
      setDeleteError(err.message || a.deleteBookFailed);
    }
  }

  async function handleSavePkg(data) {
    if (editingPkg) {
      const updated = await packagesApi.update(editingPkg.id, data);
      setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else {
      const created = await packagesApi.create(data);
      setPackages((prev) => [...prev, created]);
    }
    setShowPkgForm(false);
    setEditingPkg(null);
  }

  async function handleDeletePkg(pkg) {
    if (!window.confirm(`Delete package "${pkg.name}"? This cannot be undone.`)) return;
    try {
      await packagesApi.delete(pkg.id);
      setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
    } catch (err) {
      alert(err.message || a.deletePkgFailed);
    }
  }

  function startEditPkg(pkg) { setEditingPkg(pkg); setShowPkgForm(true); }
  function startAddPkg() { setEditingPkg(null); setShowPkgForm(true); }
  function cancelPkgForm() { setShowPkgForm(false); setEditingPkg(null); }

  async function handleSaveGenre(data) {
    if (editingGenre) {
      const updated = await genresApi.update(editingGenre.id, data);
      setGenres((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    } else {
      const created = await genresApi.create(data);
      setGenres((prev) => [...prev].concat(created).sort((a, b) => a.name.localeCompare(b.name)));
    }
    setShowGenreForm(false);
    setEditingGenre(null);
  }

  async function handleDeleteGenre(genre) {
    if (!window.confirm(`Delete genre "${genre.name}"?`)) return;
    try {
      await genresApi.delete(genre.id);
      setGenres((prev) => prev.filter((g) => g.id !== genre.id));
    } catch (err) {
      alert(err.message || a.deleteGenreFailed);
    }
  }

  function startEditGenre(genre) { setEditingGenre(genre); setShowGenreForm(true); }
  function startAddGenre() { setEditingGenre(null); setShowGenreForm(true); }
  function cancelGenreForm() { setShowGenreForm(false); setEditingGenre(null); }

  async function handleSaveBidang(data) {
    if (editingBidang) {
      const updated = await bidangApi.update(editingBidang.id, data);
      setBidangList((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } else {
      const created = await bidangApi.create(data);
      setBidangList((prev) => [...prev].concat(created).sort((a, b) => a.name.localeCompare(b.name)));
    }
    setShowBidangForm(false);
    setEditingBidang(null);
  }

  async function handleDeleteBidang(item) {
    if (!window.confirm(`Hapus bidang "${item.name}"?`)) return;
    try {
      await bidangApi.delete(item.id);
      setBidangList((prev) => prev.filter((b) => b.id !== item.id));
    } catch (err) {
      alert(err.message || a.deleteFailed);
    }
  }

  function startEditBidang(item) { setEditingBidang(item); setShowBidangForm(true); }
  function startAddBidang() { setEditingBidang(null); setShowBidangForm(true); }
  function cancelBidangForm() { setShowBidangForm(false); setEditingBidang(null); }

  async function handleSaveAuthor(data) {
    const updated = await authorsApi.update(editingAuthor.id, data);
    setAuthors((prev) => prev.map((au) => (au.id === updated.id ? updated : au)));
    setEditingAuthor(null);
  }

  async function handleDeleteAuthor(author) {
    if (!window.confirm(`Delete author "${author.name}"? This cannot be undone.`)) return;
    try {
      await authorsApi.delete(author.id);
      setAuthors((prev) => prev.filter((au) => au.id !== author.id));
    } catch (err) {
      alert(err.message || a.deleteAuthorFailed);
    }
  }

  async function handleToggleVerifyAuthor(author) {
    try {
      const updated = author.is_verified
        ? await authorsApi.unverify(author.id)
        : await authorsApi.verify(author.id);
      setAuthors((prev) => prev.map((au) => (au.id === updated.id ? updated : au)));
    } catch (err) {
      alert(err.message || 'Failed to update author verification.');
    }
  }

  function startEditAuthor(author) {
    setEditingAuthor(author);
  }

  const tabs = [
    { key: 'books', label: a.books, count: books.length },
    { key: 'authors', label: a.authorsTab, count: authors.length },
    { key: 'packages', label: a.publishingPackages, count: packages.length },
    { key: 'transactions', label: a.transactionsTab, count: transactions.length },
    { key: 'genres', label: a.genresTab, count: genres.length },
    { key: 'bidang', label: 'Bidang', count: bidangList.length },
  ];

  return (
    <>
    <div className="admin">
      <div className="container">

        {/* Stats */}
        <div className="admin-stats">
          <div className="stat-card">
            <span className="stat-card__value">{books.length}</span>
            <span className="stat-card__label">{a.totalBooks}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{authors.length}</span>
            <span className="stat-card__label">{a.totalAuthors}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{books.filter((b) => b.featured).length}</span>
            <span className="stat-card__label">{a.featuredBooks}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{packages.length}</span>
            <span className="stat-card__label">{a.packages}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{transactions.length}</span>
            <span className="stat-card__label">{a.transactionsTab}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{genres.length}</span>
            <span className="stat-card__label">{a.genresTab}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`admin-tab${activeTab === tab.key ? ' admin-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className="admin-tab__count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Books Tab */}
        {activeTab === 'books' && (
          <div className="admin-tab-panel">
            <div className="admin-section__header">
              <h2>{a.books}</h2>
              <Link to="/admin/books/new" className="btn btn-primary">{a.addBook}</Link>
            </div>

            {deleteError && <p className="error-msg" style={{ marginBottom: '1rem' }}>{deleteError}</p>}

            {loading ? (
              <p>{a.loading}</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{a.colTitle}</th>
                      <th>{a.colAuthor}</th>
                      <th>Bidang</th>
                      <th>{a.colGenre}</th>
                      <th>Deskripsi</th>
                      <th>{a.colYear}</th>
                      <th>{a.colPrice}</th>
                      <th>{a.colFeatured}</th>
                      <th>Template</th>
                      <th>{a.colActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <tr key={book.id}>
                        <td><Link to={`/books/${book.id}`}>{book.title}</Link></td>
                        <td>{book.author}</td>
        <td>{book.bidang_name || '—'}</td>
                        <td><span className="badge">{book.genre}</span></td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', maxWidth: '200px' }}>
                          {book.synopsis ? (book.synopsis.length > 80 ? book.synopsis.slice(0, 80) + '…' : book.synopsis) : '—'}
                        </td>
                        <td>{book.published_year}</td>
                        <td>Rp {book.price.toLocaleString('id-ID')}</td>
                        <td>
                          <span className={`status-dot ${book.featured ? 'status-dot--yes' : 'status-dot--no'}`}>
                            {book.featured ? a.yes : a.no}
                          </span>
                        </td>
                        <td>
                          <span className={`status-dot ${book.is_template ? 'status-dot--yes' : 'status-dot--no'}`}>
                            {book.is_template ? a.yes : a.no}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            <Link to={`/admin/books/${book.id}/edit`} className="btn btn-secondary btn-sm">{a.edit}</Link>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBook(book)}>{a.delete}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Authors Tab */}
        {activeTab === 'authors' && (
          <div className="admin-tab-panel">
            <div className="admin-section__header">
              <h2>{editingAuthor ? `${a.edit}: ${editingAuthor.name}` : a.authorsTab}</h2>
            </div>

            {editingAuthor ? (
              <AuthorForm
                initial={editingAuthor}
                genreList={genres}
                onSave={handleSaveAuthor}
                onCancel={() => setEditingAuthor(null)}
                a={a}
              />
            ) : loading ? (
              <p>{a.loading}</p>
            ) : authors.length === 0 ? (
              <p className="admin-empty">{a.noAuthors}</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{a.photoCol}</th>
                      <th>{a.colName}</th>
                      <th>{a.authorNationality}</th>
                      <th>{a.authorBooksPublished}</th>
                      <th>{a.authorGenres}</th>
                      <th>Status</th>
                      <th>{a.colActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {authors.map((author) => (
                      <tr key={author.id}>
                        <td>
                          {author.photo
                            ? <img src={author.photo} alt={author.name} className="writer-avatar-thumb" />
                            : <div className="writer-avatar-initial">{author.name?.[0]?.toUpperCase()}</div>}
                        </td>
                        <td style={{ fontWeight: 600 }}>{author.name}</td>
                        <td>{author.nationality || '—'}</td>
                        <td>{author.books_published ?? 0}</td>
                        <td style={{ fontSize: '0.82rem' }}>{author.genres?.join(', ') || '—'}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.15rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: author.is_verified ? 'rgba(34,139,34,0.1)' : 'rgba(180,0,0,0.08)',
                            color: author.is_verified ? '#1a6e1a' : '#b40000',
                          }}>
                            {author.is_verified ? '✓ Terverifikasi' : '✗ Belum'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button
                              className={`btn btn-sm ${author.is_verified ? 'btn-secondary' : 'btn-primary'}`}
                              onClick={() => handleToggleVerifyAuthor(author)}
                            >
                              {author.is_verified ? 'Batalkan' : 'Verifikasi'}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => startEditAuthor(author)}>{a.edit}</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAuthor(author)}>{a.delete}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div className="admin-tab-panel">
            <div className="admin-section__header">
              <h2>{a.publishingPackages}</h2>
              {!showPkgForm && (
                <button className="btn btn-primary" onClick={startAddPkg}>{a.addPackage}</button>
              )}
            </div>

            {showPkgForm && (
              <PackageForm
                initial={editingPkg ? { ...editingPkg } : EMPTY_PKG}
                onSave={handleSavePkg}
                onCancel={cancelPkgForm}
                a={a}
              />
            )}

            {loading ? (
              <p>{a.loading}</p>
            ) : packages.length === 0 ? (
              <p className="admin-empty">{a.noPackages}</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{a.colName}</th>
                      <th>{a.colType}</th>
                      <th>{a.colPrice}</th>
                      <th>{a.colDiscount}</th>
                      <th>{a.colFinalPrice}</th>
                      <th>{a.colActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map((pkg) => (
                      <tr key={pkg.id}>
                        <td style={{ fontWeight: 600 }}>{pkg.name}</td>
                        <td>
                          <span className="badge">
                            {pkg.type === 'per_chapter' ? a.perChapter : a.perBook}
                          </span>
                        </td>
                        <td>{fmt(pkg.price)}</td>
                        <td>
                          {pkg.discount > 0 ? (
                            <span className="status-dot status-dot--yes">{pkg.discount}%</span>
                          ) : (
                            <span className="status-dot status-dot--no">{a.none}</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{fmt(pkg.final_price)}</td>
                        <td>
                          <div className="admin-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => startEditPkg(pkg)}>{a.edit}</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeletePkg(pkg)}>{a.delete}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="admin-tab-panel">
            <div className="admin-section__header">
              <h2>{a.transactionsTab}</h2>
            </div>

            {txError && <p className="error-msg" style={{ marginBottom: '1rem' }}>{txError}</p>}

            {loading ? (
              <p>{a.loading}</p>
            ) : transactions.length === 0 ? (
              <p className="admin-empty">{a.noTransactions}</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>{a.invoiceCreatedAt}</th>
                      <th>{a.colName}</th>
                      <th>{a.txBookTitle}</th>
                      <th>{a.publishingPackages}</th>
                      <th>{a.colPrice}</th>
                      <th>{a.txUserAccount}</th>
                      <th>{a.transactionStatus}</th>
                      <th>{a.colActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const draft = getTxDraft(tx);
                      const deadlineLocked = draft.status !== 'unpaid';
                      return (
                        <tr key={tx.id}>
                          <td>#{tx.id}</td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{fmtDateTime(tx.created_at)}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{tx.customer_name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{tx.customer_email}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{tx.customer_phone}</div>
                            {tx.notes && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{tx.notes}</div>}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{tx.book_title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{tx.genre}</div>
                            {tx.package_type === 'per_chapter' && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{tx.chapters} ch</div>
                            )}
                          </td>
                          <td>{tx.package_name}</td>
                          <td>{fmt(tx.total_amount)}</td>
                          <td>
                            {tx.user_id ? (
                              <>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tx.user_role}</div>
                                <div style={{ fontSize: '0.78rem', color: tx.user_is_verified ? 'var(--color-green, #2d8a4e)' : 'var(--color-text-muted)' }}>
                                  {tx.user_is_verified ? a.txVerified : a.txUnverified}
                                </div>
                              </>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{a.txGuest}</span>
                            )}
                          </td>
                          <td>
                            <span className={`tx-status-badge tx-status-badge--${tx.status}`}>
                              {tx.status === 'paid' ? a.statusPaid : a.statusUnpaid}
                            </span>
                            {tx.stock_exhausted && (
                              <span className="tx-stock-badge">⚠ Stok Habis</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => { setEditingTx(tx); setTxError(''); }}
                            >
                              {a.edit || 'Edit'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Genres Tab */}
        {activeTab === 'genres' && (
          <div className="admin-tab-panel">
            <div className="admin-section__header">
              <h2>{a.genresTab}</h2>
              {!showGenreForm && (
                <button className="btn btn-primary" onClick={startAddGenre}>{a.addGenre}</button>
              )}
            </div>

            {showGenreForm && (
              <GenreForm
                initial={editingGenre ? { ...editingGenre } : EMPTY_GENRE}
                onSave={handleSaveGenre}
                onCancel={cancelGenreForm}
                a={a}
                bidangList={bidangList}
              />
            )}

            {loading ? (
              <p>{a.loading}</p>
            ) : genres.length === 0 ? (
              <p className="admin-empty">{a.noGenres}</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{a.genreName}</th>
                      <th>{a.genreNameId}</th>
                      <th>Bidang</th>
                      <th>{a.colActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genres.map((genre, i) => (
                      <tr key={genre.id}>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{genre.name}</td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{genre.name_id || '—'}</td>
                        <td>{genre.bidang_name || '—'}</td>
                        <td>
                          <div className="admin-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => startEditGenre(genre)}>{a.edit}</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteGenre(genre)}>{a.delete}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Bidang Tab */}
        {activeTab === 'bidang' && (
          <div className="admin-tab-panel">
            <div className="admin-section__header">
              <h2>Bidang</h2>
              {!showBidangForm && (
                <button className="btn btn-primary" onClick={startAddBidang}>+ Tambah Bidang</button>
              )}
            </div>

            {showBidangForm && (
              <BidangForm
                initial={editingBidang ? { ...editingBidang } : EMPTY_BIDANG}
                onSave={handleSaveBidang}
                onCancel={cancelBidangForm}
                a={a}
              />
            )}

            {loading ? (
              <p>{a.loading}</p>
            ) : bidangList.length === 0 ? (
              <p className="admin-empty">Belum ada bidang.</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nama Bidang</th>
                      <th>{a.colActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bidangList.map((item, i) => (
                      <tr key={item.id}>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>
                          <div className="admin-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => startEditBidang(item)}>{a.edit}</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBidang(item)}>{a.delete}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>

    {/* ── Transaction Edit Modal ─────────────────────────────────────── */}
    {editingTx && (() => {
      const draft = getTxDraft(editingTx);
      const deadlineLocked = draft.status !== 'unpaid';
      return (
        <>
          <div className="tx-modal__backdrop" onClick={() => { setEditingTx(null); setTxError(''); }} />
          <div className="tx-modal" role="dialog" aria-modal="true">
            <div className="tx-modal__header">
              <h2 className="tx-modal__title">Edit Transaksi #{editingTx.id}</h2>
              <button className="tx-modal__close" onClick={() => { setEditingTx(null); setTxError(''); }} aria-label="Tutup">&times;</button>
            </div>

            <div className="tx-modal__body">
              {/* Detail read-only */}
              <div className="tx-modal__info-grid">
                <div className="tx-modal__info-row">
                  <span className="tx-modal__info-label">Pelanggan</span>
                  <span className="tx-modal__info-value">
                    <strong>{editingTx.customer_name}</strong><br />
                    <small>{editingTx.customer_email}</small><br />
                    <small>{editingTx.customer_phone}</small>
                  </span>
                </div>
                <div className="tx-modal__info-row">
                  <span className="tx-modal__info-label">Buku</span>
                  <span className="tx-modal__info-value">
                    <strong>{editingTx.book_title}</strong><br />
                    <small>{editingTx.genre}</small>
                    {editingTx.package_type === 'per_chapter' && <small> · {editingTx.chapters} bab</small>}
                  </span>
                </div>
                <div className="tx-modal__info-row">
                  <span className="tx-modal__info-label">Paket</span>
                  <span className="tx-modal__info-value">{editingTx.package_name}</span>
                </div>
                <div className="tx-modal__info-row">
                  <span className="tx-modal__info-label">Total</span>
                  <span className="tx-modal__info-value" style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{fmt(editingTx.total_amount)}</span>
                </div>
                <div className="tx-modal__info-row">
                  <span className="tx-modal__info-label">Tanggal</span>
                  <span className="tx-modal__info-value">{fmtDateTime(editingTx.created_at)}</span>
                </div>
                {editingTx.notes && (
                  <div className="tx-modal__info-row">
                    <span className="tx-modal__info-label">Catatan</span>
                    <span className="tx-modal__info-value" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>{editingTx.notes}</span>
                  </div>
                )}
              </div>

              {editingTx.stock_exhausted && (
                <div className="tx-modal__stock-warn">⚠ Stok habis — tidak dapat diubah menjadi Lunas</div>
              )}

              {/* Editable fields */}
              <div className="tx-modal__fields">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={draft.status}
                    onChange={(e) => updateTxDraft(editingTx.id, { status: e.target.value })}
                  >
                    <option value="unpaid">{a.statusUnpaid}</option>
                    <option value="paid">{a.statusPaid}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{a.deliveryDeadline}</label>
                  <input
                    type="date"
                    value={draft.delivery_deadline}
                    disabled={deadlineLocked}
                    onChange={(e) => updateTxDraft(editingTx.id, { delivery_deadline: e.target.value })}
                  />
                  {deadlineLocked && (
                    <span className="form-hint">Deadline hanya bisa diatur saat status Belum Lunas.</span>
                  )}
                </div>
              </div>

              {txError && <p className="error-msg" style={{ marginTop: '0.75rem' }}>{txError}</p>}
            </div>

            <div className="tx-modal__footer">
              <button
                className="btn btn-secondary"
                onClick={() => { setEditingTx(null); setTxError(''); }}
              >
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleSaveTransaction(editingTx)}
                disabled={txSavingId === editingTx.id}
              >
                {txSavingId === editingTx.id ? a.saving : a.saveTransaction}
              </button>
            </div>
          </div>
        </>
      );
    })()}
    </>
  );
}

export default AdminDashboard;
