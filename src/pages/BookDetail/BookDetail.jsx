import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { booksApi } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useLang } from '../../context/LanguageContext';
import './BookDetail.css';

function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { t } = useLang();
  const d = t.bookDetail;

  useEffect(() => {
    setLoading(true);
    booksApi.get(id)
      .then(setBook)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="container not-found"><p>{d.loading}</p></div>;
  }

  if (notFound || !book) {
    return (
      <div className="container not-found">
        <h2>{d.notFound}</h2>
        <Link to="/books" className="btn btn-primary" style={{ marginTop: '1rem' }}>{d.backToCatalog}</Link>
      </div>
    );
  }

  const starsDisplay = '★'.repeat(Math.round(book.rating)) + '☆'.repeat(5 - Math.round(book.rating));
  const descriptionContent = book.description || book.synopsis || '';
  const looksLikeHtml = /<[^>]+>/.test(descriptionContent);

  return (
    <div className="book-detail">
      <div className="container">
        <div className="book-detail__breadcrumb">
          <Link to="/">{d.home}</Link>
          <span>/</span>
          <Link to="/books">{d.books}</Link>
          <span>/</span>
          <span>{book.title}</span>
        </div>

        <div className="book-detail__grid">
          <div className="book-detail__cover-wrap">
            <img src={book.cover} alt={`Cover of ${book.title}`} className="book-detail__cover" />
          </div>

          <div className="book-detail__info">
            <div className="book-detail__genre-row">
              <span className="badge">{book.genre}</span>
              <span className="book-detail__year">{book.published_year}</span>
            </div>

            <h1 className="book-detail__title">{book.title}</h1>

            <p className="book-detail__author">
              {d.by} <Link to={`/authors/${book.author_id}`}>{book.author}</Link>
            </p>

            <div className="book-detail__rating-row">
              <span className="book-detail__stars">{starsDisplay}</span>
              <span className="book-detail__rating-num">{book.rating} / 5</span>
            </div>

            <div className="book-detail__divider" />

            {looksLikeHtml ? (
              <div
                className="book-detail__description"
                dangerouslySetInnerHTML={{ __html: descriptionContent }}
              />
            ) : (
              <p className="book-detail__description">{descriptionContent}</p>
            )}

            <table className="book-detail__table">
              <tbody>
                <tr><th>{d.isbn}</th><td>{book.isbn}</td></tr>
                <tr><th>{d.pages}</th><td>{book.pages}</td></tr>
                <tr><th>{d.published}</th><td>{book.published_year}</td></tr>
                <tr><th>{d.genre}</th><td>{book.genre}</td></tr>
              </tbody>
            </table>

            <div className="book-detail__price-row">
              <span className="book-detail__price">
                Rp {book.price.toLocaleString('id-ID')}
              </span>
              <button
                className="btn btn-primary"
                onClick={() => {
                  addItem({
                    type: 'per_book',
                    packageId: null,
                    bookId: book.id,
                    bookTitle: book.title,
                    bookCover: book.cover || null,
                    genre: book.genre,
                    author: book.author || null,
                    chapters: [],
                    totalAmount: 0,
                  });
                  navigate('/cart');
                }}
              >
                {d.addToCart}
              </button>
            </div>
          </div>
        </div>

        <div className="book-detail__back">
          <Link to="/books">{d.backLink}</Link>
        </div>
      </div>
    </div>
  );
}

export default BookDetail;
