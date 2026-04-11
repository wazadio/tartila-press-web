import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { booksApi, transactionsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './BuyBook.css';

function fmt(price) {
  return `Rp ${Number(price).toLocaleString('id-ID')}`;
}

function BuyBook() {
  const { id } = useParams();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [order, setOrder] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: 1,
    address: '',
    notes: '',
  });

  useEffect(() => {
    booksApi.get(id)
      .then((b) => {
        setBook(b);
        setForm((prev) => ({
          ...prev,
          name: user?.name || '',
          email: user?.email || '',
        }));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Nama wajib diisi.';
    if (!form.email.trim()) e.email = 'Email wajib diisi.';
    if (!form.phone.trim()) e.phone = 'Nomor telepon wajib diisi.';
    if (!form.address.trim()) e.address = 'Alamat pengiriman wajib diisi.';
    if (form.quantity < 1) e.quantity = 'Jumlah minimal 1.';
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'quantity' ? Number(value) : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }

    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await transactionsApi.create({
        transaction_type: 'book_sale',
        book_id: Number(id),
        quantity: form.quantity,
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        customer_phone: form.phone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim() || null,
      });
      setOrder(result);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Gagal membuat pesanan.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container"><p style={{ padding: '2rem' }}>Memuat…</p></div>;
  if (notFound || !book) {
    return (
      <div className="container buybook-notfound">
        <h2>Buku tidak ditemukan.</h2>
        <Link to="/books" className="btn btn-primary">Kembali ke Katalog</Link>
      </div>
    );
  }

  if (submitted && order) {
    return (
      <div className="buybook-page">
        <div className="container">
          <div className="buybook-success">
            <div className="buybook-success__icon">✅</div>
            <h2>Pesanan Diterima!</h2>
            <p>Terima kasih, <strong>{order.customer_name}</strong>. Pesanan kamu untuk <em>{order.book_title}</em> telah kami catat.</p>

            {order.bank_account_number && (
              <div className="buybook-success__bank">
                <p className="buybook-success__bank-label">Lakukan transfer ke rekening berikut:</p>
                <div className="buybook-success__bank-info">
                  <span className="buybook-success__bank-name">{order.bank_name}</span>
                  <span className="buybook-success__bank-num">{order.bank_account_number}</span>
                  <span className="buybook-success__bank-holder">a/n {order.bank_account_name}</span>
                </div>
                <p className="buybook-success__bank-amount">
                  Jumlah transfer: <strong>{fmt(order.total_amount)}</strong>
                </p>
                <p className="buybook-success__bank-note">
                  Konfirmasi pembayaran ke tim kami setelah melakukan transfer. Bukti pembayaran dapat dikirimkan via WhatsApp atau email.
                </p>
              </div>
            )}

            <div className="buybook-success__actions">
              <Link to="/books" className="btn btn-secondary">Kembali ke Katalog</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const qty = Math.max(1, Number(form.quantity) || 1);
  const total = (book.price || 0) * qty;
  const outOfStock = book.stock != null && book.stock <= 0;

  return (
    <div className="buybook-page">
      <div className="container">
        <div className="buybook-breadcrumb">
          <Link to="/">Beranda</Link>
          <span>/</span>
          <Link to="/books">Katalog</Link>
          <span>/</span>
          <Link to={`/books/${book.id}`}>{book.title}</Link>
          <span>/</span>
          <span>Beli</span>
        </div>

        <div className="buybook-layout">
          {/* Book summary */}
          <aside className="buybook-aside">
            <div className="buybook-book-card">
              <img
                src={book.cover || `https://placehold.co/220x310?text=${encodeURIComponent(book.title)}`}
                alt={book.title}
                className="buybook-book-card__cover"
                onError={(e) => { e.target.src = `https://placehold.co/220x310?text=${encodeURIComponent(book.title)}`; }}
              />
              <div className="buybook-book-card__info">
                {book.genre && <span className="badge">{book.genre}</span>}
                <h3 className="buybook-book-card__title">{book.title}</h3>
                {book.author && <p className="buybook-book-card__author">{book.author}</p>}
                <p className="buybook-book-card__price">{fmt(book.price || 0)} / eksemplar</p>
                {book.stock != null && (
                  <p className={`buybook-book-card__stock${outOfStock ? ' buybook-book-card__stock--empty' : ''}`}>
                    {outOfStock ? 'Stok Habis' : `Sisa ${book.stock} eksemplar`}
                  </p>
                )}
              </div>
            </div>

            <div className="buybook-summary">
              <div className="buybook-summary__row">
                <span>Harga satuan</span>
                <span>{fmt(book.price || 0)}</span>
              </div>
              <div className="buybook-summary__row">
                <span>Jumlah</span>
                <span>{qty} eksemplar</span>
              </div>
              <div className="buybook-summary__row buybook-summary__row--total">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
          </aside>

          {/* Order form */}
          <main className="buybook-form-wrap">
            <h1 className="buybook-form-wrap__title">Detail Pemesanan</h1>

            {outOfStock && (
              <div className="buybook-stockout">
                Buku ini sedang habis. Silakan cek kembali nanti.
              </div>
            )}

            <form className="buybook-form" onSubmit={handleSubmit} noValidate>
              <div className="buybook-form__row">
                <label htmlFor="buy-name">Nama Lengkap *</label>
                <input
                  id="buy-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className={errors.name ? 'input-error' : ''}
                  autoComplete="name"
                />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>

              <div className="buybook-form__row">
                <label htmlFor="buy-email">Email *</label>
                <input
                  id="buy-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={errors.email ? 'input-error' : ''}
                  autoComplete="email"
                />
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>

              <div className="buybook-form__row">
                <label htmlFor="buy-phone">No. Telepon/WA *</label>
                <input
                  id="buy-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'input-error' : ''}
                  autoComplete="tel"
                />
                {errors.phone && <p className="field-error">{errors.phone}</p>}
              </div>

              <div className="buybook-form__row">
                <label htmlFor="buy-qty">Jumlah Eksemplar *</label>
                <input
                  id="buy-qty"
                  name="quantity"
                  type="number"
                  min="1"
                  max={book.stock ?? undefined}
                  value={form.quantity}
                  onChange={handleChange}
                  className={errors.quantity ? 'input-error' : ''}
                />
                {errors.quantity && <p className="field-error">{errors.quantity}</p>}
              </div>

              <div className="buybook-form__row">
                <label htmlFor="buy-address">Alamat Pengiriman *</label>
                <textarea
                  id="buy-address"
                  name="address"
                  rows={3}
                  value={form.address}
                  onChange={handleChange}
                  className={errors.address ? 'input-error' : ''}
                  placeholder="Jl. …, Kota, Provinsi, Kode Pos"
                />
                {errors.address && <p className="field-error">{errors.address}</p>}
              </div>

              <div className="buybook-form__row">
                <label htmlFor="buy-notes">Catatan (opsional)</label>
                <textarea
                  id="buy-notes"
                  name="notes"
                  rows={2}
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Misal: permintaan tanda tangan, dll."
                />
              </div>

              {submitError && <p className="field-error buybook-form__submit-error">{submitError}</p>}

              <button
                type="submit"
                className="btn btn-primary buybook-form__submit"
                disabled={submitting || outOfStock}
              >
                {submitting ? 'Memproses…' : `Pesan — ${fmt(total)}`}
              </button>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

export default BuyBook;
