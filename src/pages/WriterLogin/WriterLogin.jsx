import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import '../Login/Login.css';

function WriterLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { t } = useLang();
  const w = t.writerLogin;
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(
    searchParams.get('error') ? `Sign-in failed (${searchParams.get('error')}). Please try again.` : ''
  );
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs = {};
    if (!form.email.trim()) errs.email = w.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = w.emailInvalid;
    if (!form.password) errs.password = w.passwordRequired;
    return errs;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'writer') {
        navigate('/writer/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.message?.includes('verify your email')) {
        setApiError('Please verify your email before logging in. Check your inbox for the verification link.');
      } else if (err.message?.includes('Invalid email')) {
        setApiError(w.notWriter);
      } else {
        setApiError(err.message || w.failed);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <p className="auth-card__eyebrow">{w.eyebrow}</p>
          <h1>{w.title}</h1>
          <p>{w.subtitle}</p>
        </div>

        {apiError && <p className="error-msg auth-api-error">{apiError}</p>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">{w.email}</label>
            <input
              id="email" name="email" type="email" autoComplete="email"
              value={form.email} onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">{w.password}</label>
            <input
              id="password" name="password" type="password" autoComplete="current-password"
              value={form.password} onChange={handleChange}
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? w.signingIn : w.submit}
          </button>
        </form>

        <div className="auth-footer">
          <p><Link to="/writer/register">{w.noAccount}</Link></p>
          <p><Link to="/login">{w.readerLogin}</Link></p>
        </div>
      </div>
    </div>
  );
}

export default WriterLogin;
