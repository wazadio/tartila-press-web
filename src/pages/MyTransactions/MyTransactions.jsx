import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { transactionsApi } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import './MyTransactions.css';

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
    hour12: false,
  }).format(date);
  return `${formatted} WIB`;
}

function MyTransactions() {
  const { t } = useLang();
  const p = t.myTransactions;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    transactionsApi
      .listMine()
      .then(setTransactions)
      .catch((err) => setError(err.message || p.loadFailed))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="my-tx-page">
      <div className="container">
        <div className="page-header">
          <h1>{p.title}</h1>
          <p>{p.subtitle}</p>
        </div>

        {loading && <p className="my-tx-state">{p.loading}</p>}
        {error && <p className="my-tx-state my-tx-state--error">{error}</p>}

        {!loading && !error && transactions.length === 0 && (
          <div className="my-tx-empty">
            <p>{p.empty}</p>
            <Link to="/packages" className="btn btn-primary">{p.browsePackages}</Link>
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <div className="my-tx-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="my-tx-card">
                <div className="my-tx-card__header">
                  <span className="my-tx-card__invoice">#{tx.id}</span>
                  <span className={`my-tx-type-badge my-tx-type-badge--${tx.transaction_type || 'publishing'}`}>
                    {tx.transaction_type === 'book_sale' ? '📦 Pembelian Buku' : '✏️ Jasa Penerbitan'}
                  </span>
                  <span className={`my-tx-badge my-tx-badge--${tx.status}`}>
                    {tx.status === 'paid' ? p.statusPaid : p.statusUnpaid}
                  </span>
                </div>

                <div className="my-tx-card__body">
                  <div className="my-tx-card__col">
                    <div className="my-tx-card__label">{p.bookTitle}</div>
                    <div className="my-tx-card__value">{tx.book_title}</div>
                  </div>
                  {tx.transaction_type !== 'book_sale' && (
                    <div className="my-tx-card__col">
                      <div className="my-tx-card__label">{p.package}</div>
                      <div className="my-tx-card__value">{tx.package_name}</div>
                    </div>
                  )}
                  {tx.transaction_type !== 'book_sale' && (
                    <div className="my-tx-card__col">
                      <div className="my-tx-card__label">{p.genre}</div>
                      <div className="my-tx-card__value">{tx.genre}</div>
                    </div>
                  )}
                  {tx.transaction_type !== 'book_sale' && tx.package_type === 'per_chapter' && (
                    <div className="my-tx-card__col">
                      <div className="my-tx-card__label">{p.chapters}</div>
                      <div className="my-tx-card__value">{tx.chapters}</div>
                    </div>
                  )}
                  {tx.transaction_type === 'book_sale' && (
                    <div className="my-tx-card__col">
                      <div className="my-tx-card__label">Jumlah</div>
                      <div className="my-tx-card__value">{tx.chapters} eksemplar</div>
                    </div>
                  )}
                  {tx.transaction_type === 'book_sale' && tx.address && (
                    <div className="my-tx-card__col">
                      <div className="my-tx-card__label">Alamat Pengiriman</div>
                      <div className="my-tx-card__value">{tx.address}</div>
                    </div>
                  )}
                  <div className="my-tx-card__col">
                    <div className="my-tx-card__label">{p.total}</div>
                    <div className="my-tx-card__value my-tx-card__value--total">{fmt(tx.total_amount)}</div>
                  </div>
                  <div className="my-tx-card__col">
                    <div className="my-tx-card__label">{p.invoiceDate}</div>
                    <div className="my-tx-card__value">{fmtDateTime(tx.created_at)}</div>
                  </div>
                  <div className="my-tx-card__col">
                    <div className="my-tx-card__label">{p.deliveryDeadline}</div>
                    <div className="my-tx-card__value">{tx.delivery_deadline || '—'}</div>
                  </div>
                </div>

                {tx.status === 'unpaid' && (
                  <div className="my-tx-card__bank">
                    <div className="my-tx-card__bank-title">{p.transferTo}</div>
                    <div className="my-tx-card__bank-detail">
                      <span className="my-tx-card__bank-name">{tx.bank_name || '—'}</span>
                      <span>{tx.bank_account_name || '—'}</span>
                      <span className="my-tx-card__bank-acc">{tx.bank_account_number || '—'}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTransactions;
