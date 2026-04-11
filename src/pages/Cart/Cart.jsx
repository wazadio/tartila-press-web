import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { packagesApi } from '../../services/api';
import './Cart.css';

function fmt(n) {
  return `Rp ${Number(n).toLocaleString('id-ID')}`;
}

function Cart() {
  const { items, removeItem } = useCart();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    packagesApi.list().then(setPackages).catch(() => {});
  }, []);

  function getCheckoutUrl(item) {
    if (item.type === 'per_chapter' && item.packageId) {
      const chIds = (item.chapters || []).map((c) => c.id).join(',');
      const base = `/payment/${item.packageId}?book=${item.bookId}`;
      return chIds ? `${base}&chapters=${chIds}` : base;
    }
    const pkg = packages.find((p) => p.type === 'per_book');
    return pkg ? `/payment/${pkg.id}${item.bookId ? `?book=${item.bookId}` : ''}` : '/packages';
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="container">
          <div className="cart-empty__inner">
            <div className="cart-empty__icon">🛒</div>
            <h2>Keranjang Kosong</h2>
            <p>Belum ada item yang ditambahkan ke keranjang.</p>
            <div className="cart-empty__actions">
              <Link to="/books" className="btn btn-primary">Jelajahi Buku</Link>
              <Link to="/packages" className="btn btn-secondary">Lihat Paket</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="page-header">
          <h1>Keranjang Pesanan</h1>
          <p>{items.length} item ditambahkan</p>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.cartId} className="cart-card">
                <div className="cart-card__cover-wrap">
                  {item.bookCover
                    ? <img
                        src={item.bookCover}
                        alt={item.bookTitle}
                        className="cart-card__cover"
                        onError={(e) => { e.target.src = `https://placehold.co/80x110?text=Book`; }}
                      />
                    : <div className="cart-card__cover-placeholder">📖</div>
                  }
                </div>

                <div className="cart-card__info">
                  <span className={`cart-card__type-badge cart-card__type-badge--${item.type}`}>
                    {item.type === 'per_chapter' ? '📄 Per Bab' : '📚 Per Buku'}
                  </span>
                  <h3 className="cart-card__title">{item.bookTitle}</h3>
                  {item.genre && <span className="badge" style={{ alignSelf: 'flex-start' }}>{item.genre}</span>}
                  {item.author && <p className="cart-card__author">Penulis template: {item.author}</p>}

                  {item.type === 'per_chapter' && item.chapters?.length > 0 && (
                    <div className="cart-card__chapters">
                      <p className="cart-card__chapters-label">
                        {item.chapters.length} bab dipilih:
                      </p>
                      <ul className="cart-card__chapters-list">
                        {item.chapters.map((ch) => (
                          <li key={ch.id}>
                            Bab {ch.number} — {ch.title}
                            {ch.price > 0 && <span className="cart-card__ch-price"> ({fmt(ch.price)})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.type === 'per_book' && (
                    <p className="cart-card__note">Harga paket per-buku ditentukan saat checkout.</p>
                  )}
                </div>

                <div className="cart-card__right">
                  {item.totalAmount > 0 && (
                    <div className="cart-card__price">{fmt(item.totalAmount)}</div>
                  )}
                  <button
                    className="btn btn-primary cart-card__checkout"
                    onClick={() => navigate(getCheckoutUrl(item))}
                  >
                    Pesan Sekarang →
                  </button>
                  <button
                    className="btn btn-danger btn-sm cart-card__remove"
                    onClick={() => removeItem(item.cartId)}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalAmount > 0 && (
            <aside className="cart-summary">
              <div className="cart-summary__card">
                <h3 className="cart-summary__title">Ringkasan</h3>
                <div className="cart-summary__row">
                  <span>{items.length} item</span>
                  <strong>{fmt(totalAmount)}</strong>
                </div>
                <p className="cart-summary__note">
                  Setiap item dipesan secara terpisah melalui halaman pembayaran.
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

export default Cart;
