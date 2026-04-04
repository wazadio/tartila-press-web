import { useEffect, useState } from 'react';
import AuthorCard from '../../components/AuthorCard/AuthorCard';
import { authorsApi } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import './AuthorList.css';

function AuthorList() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();
  const a = t.authorList;

  useEffect(() => {
    authorsApi.list()
      .then(setAuthors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="author-list">
      <div className="container">
        <div className="page-header">
          <h1>{a.title}</h1>
          <p>{a.subtitle}</p>
        </div>
        {loading ? (
          <p>{a.loading}</p>
        ) : (
          <div className="authors-grid">
            {authors.map((author) => (
              <AuthorCard key={author.id} author={author} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthorList;
