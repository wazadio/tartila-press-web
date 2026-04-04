import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authorsApi, booksApi } from '../../services/api';
import BookCard from '../../components/BookCard/BookCard';
import { useLang } from '../../context/LanguageContext';
import './AuthorDetail.css';

function AuthorDetail() {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [authorBooks, setAuthorBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { t } = useLang();
  const d = t.authorDetail;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      authorsApi.get(id),
      booksApi.list(),
    ])
      .then(([authorData, allBooks]) => {
        setAuthor(authorData);
        setAuthorBooks(allBooks.filter((b) => b.author_id === authorData.id));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="container not-found"><p>{d.loading}</p></div>;
  }

  if (notFound || !author) {
    return (
      <div className="container not-found">
        <h2>{d.notFound}</h2>
        <Link to="/authors" className="btn btn-primary" style={{ marginTop: '1rem' }}>{d.back}</Link>
      </div>
    );
  }

  return (
    <div className="author-detail">
      <div className="container">
        <div className="author-detail__breadcrumb">
          <Link to="/">{d.home}</Link>
          <span>/</span>
          <Link to="/authors">{d.authors}</Link>
          <span>/</span>
          <span>{author.name}</span>
        </div>

        <div className="author-detail__profile">
          <div className="author-detail__photo-wrap">
            <img src={author.photo} alt={author.name} className="author-detail__photo" />
          </div>
          <div className="author-detail__info">
            <p className="author-detail__nationality">{author.nationality}</p>
            <h1 className="author-detail__name">{author.name}</h1>
            <div className="author-detail__genres">
              {author.genres.map((g) => <span className="badge" key={g}>{g}</span>)}
            </div>
            <div className="author-detail__divider" />
            <p className="author-detail__bio">{author.bio}</p>
            {author.website && (
              <a
                href={author.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
              >
                {d.visitWebsite}
              </a>
            )}
          </div>
        </div>

        {authorBooks.length > 0 && (
          <section className="author-detail__books">
            <div className="author-detail__books-header">
              <h2>{d.booksBy} {author.name}</h2>
              <span className="author-detail__book-count">{authorBooks.length}</span>
            </div>
            <div className="books-grid">
              {authorBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        )}

        <div className="author-detail__back">
          <Link to="/authors">{d.backLink}</Link>
        </div>
      </div>
    </div>
  );
}

export default AuthorDetail;
