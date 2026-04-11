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

  // Filter: show only publishing orders with no manuscript uploaded yet
  const [filterNeedsUpload, setFilterNeedsUpload] = useState(false);

  // Per-transaction upload state: { [txId]: { uploading: bool, error: string|null } }
  const [uploadState, setUploadState] = useState({});

  useEffect(() => {
    transactionsApi
      .listMine()
      .then(setTransactions)
      .catch((err) => setError(err.message || p.loadFailed))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(txId, files) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      setUploadState((prev) => ({ ...prev, [txId]: { uploading: true, error: null } }));
      try {
        const updated = await transactionsApi.uploadManuscript(txId, file);
        setTransactions((prev) => prev.map((tx) => tx.id === txId ? updated : tx));
        setUploadState((prev) => ({ ...prev, [txId]: { uploading: false, error: null } }));
      } catch (err) {
        setUploadState((prev) => ({
          ...prev,
          [txId]: { uploading: false, error: err.message || 'Gagal mengupload file.' },
        }));
      }
    }
  }

  const publishingNeedsUploadCount = transactions.filter(
    (tx) => (tx.transaction_type || 'publishing') === 'publishing' &&
      (!tx.manuscript_files || tx.manuscript_files.length === 0)
  ).length;

  const visibleTransactions = filterNeedsUpload
    ? transactions.filter(
        (tx) => (tx.transaction_type || 'publishing') === 'publishing' &&
          (!tx.manuscript_files || tx.manuscript_files.length === 0)
      )
    : transactions;

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
          <>
            <div className="my-tx-filters">
              <button
                type="button"
                className={`my-tx-filter-btn${filterNeedsUpload ? ' my-tx-filter-btn--active' : ''}`}
                onClick={() => setFilterNeedsUpload((v) => !v)}
              >
                📄 Belum Upload Naskah
                {publishingNeedsUploadCount > 0 && (
                  <span className="my-tx-filter-badge">{publishingNeedsUploadCount}</span>
                )}
              </button>
            </div>

            {visibleTransactions.length === 0 && (
              <p className="my-tx-state">Semua pesanan penerbitan sudah mengupload naskah. ✓</p>
            )}

            <div className="my-tx-list">
              {visibleTransactions.map((tx) => {
                const isPublishing = (tx.transaction_type || 'publishing') === 'publishing';
                const canUpload = isPublishing && tx.status === 'paid';
                const txUpload = uploadState[tx.id] || {};

                return (
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

                    {isPublishing && (
                      <div className="my-tx-manuscript">
                        <div className="my-tx-manuscript__title">📄 Naskah</div>

                        {tx.manuscript_files && tx.manuscript_files.length > 0 ? (
                          <ul className="my-tx-manuscript__list">
                            {tx.manuscript_files.map((url, i) => (
                              <li key={i} className="my-tx-manuscript__item">
                                <a href={url} target="_blank" rel="noopener noreferrer" className="my-tx-manuscript__link">
                                  📄 File {i + 1}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="my-tx-manuscript__empty">Belum ada naskah yang diupload.</p>
                        )}

                        {canUpload && (
                          <div className="my-tx-manuscript__upload">
                            <label className="my-tx-manuscript__upload-btn">
                              {txUpload.uploading ? '⏳ Mengupload…' : '+ Tambah Naskah'}
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                multiple
                                disabled={txUpload.uploading}
                                style={{ display: 'none' }}
                                onChange={(e) => e.target.files?.length && handleUpload(tx.id, e.target.files)}
                              />
                            </label>
                            <span className="my-tx-manuscript__upload-hint">PDF · DOC · DOCX, maks. 20 MB</span>
                            {txUpload.error && (
                              <p className="my-tx-manuscript__error">{txUpload.error}</p>
                            )}
                          </div>
                        )}

                        {isPublishing && tx.status === 'unpaid' && (
                          <p className="my-tx-manuscript__locked">
                            🔒 Upload naskah tersedia setelah pembayaran dikonfirmasi.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MyTransactions;
