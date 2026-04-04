import { Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import './BookCard.css';

function BookCard({ book }) {
  const { t } = useLang();

  return (
    <div className="book-card">
      <Link to={`/books/${book.id}`} className="book-card__cover-link">
        <img
          src={book.cover || `https://placehold.co/300x420?text=${encodeURIComponent(book.title)}`}
          alt={`Cover of ${book.title}`}
          className="book-card__cover"
          onError={(e) => { e.target.src = `https://placehold.co/300x420?text=${encodeURIComponent(book.title)}`; }}
        />
      </Link>
      <div className="book-card__body">
        <span className="badge">{book.genre}</span>
        <h3 className="book-card__title">
          <Link to={`/books/${book.id}`}>{book.title}</Link>
        </h3>
        <p className="book-card__author">
          {t.bookCard.by}{' '}
          <Link to={`/authors/${book.authorId}`}>{book.author}</Link>
        </p>
        <div className="book-card__meta">
          <span className="book-card__rating">★ {book.rating}</span>
          <span className="book-card__price">
            Rp {book.price.toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  );
}

export default BookCard;
