import { Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import './AuthorCard.css';

function AuthorCard({ author }) {
  const { t } = useLang();

  return (
    <div className="author-card">
      <Link to={`/authors/${author.id}`} className="author-card__photo-link">
        <img
          src={author.photo}
          alt={author.name}
          className="author-card__photo"
        />
      </Link>
      <div className="author-card__body">
        <h3 className="author-card__name">
          <Link to={`/authors/${author.id}`}>{author.name}</Link>
        </h3>
        <p className="author-card__nationality">{author.nationality}</p>
        <div className="author-card__genres">
          {author.genres.map((g) => (
            <span className="badge" key={g}>{g}</span>
          ))}
        </div>
        <p className="author-card__books">{author.books_published} {t.authorCard.booksPublished}</p>
      </div>
    </div>
  );
}

export default AuthorCard;
