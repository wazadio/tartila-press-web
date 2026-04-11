import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { writersApi } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import '../Login/Login.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

function WriterRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLang();
  const w = t.writerRegister;
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(
    searchParams.get('error') ? `Google sign-in failed (${searchParams.get('error')}). Please try again.` : ''
  );
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = w.nameRequired;
    if (!form.email.trim()) errs.email = w.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = w.emailInvalid;
    if (!form.password) errs.password = w.passwordRequired;
    else if (form.password.length < 8) errs.password = w.passwordTooShort;
    if (form.confirmPassword !== form.password) errs.confirmPassword = w.passwordMismatch;
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
      await writersApi.register({ name: form.name, email: form.email, password: form.password });
      navigate('/check-email', { state: { email: form.email } });
    } catch (err) {
      setApiError(err.message || w.failed);
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

        <a href={`${API_BASE}/api/auth/google/writer`} className="btn-google">
          <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Daftar dengan Google
        </a>

        <div className="auth-divider">
          <span>atau daftar dengan email</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">{w.fullName}</label>
            <input id="name" name="name" type="text" autoComplete="name"
              value={form.name} onChange={handleChange}
              className={errors.name ? 'input-error' : ''} />
            {errors.name && <span className="error-msg">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="email">{w.email}</label>
            <input id="email" name="email" type="email" autoComplete="email"
              value={form.email} onChange={handleChange}
              className={errors.email ? 'input-error' : ''} />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">{w.password}</label>
            <input id="password" name="password" type="password" autoComplete="new-password"
              value={form.password} onChange={handleChange}
              className={errors.password ? 'input-error' : ''} />
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">{w.confirmPassword}</label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password"
              value={form.confirmPassword} onChange={handleChange}
              className={errors.confirmPassword ? 'input-error' : ''} />
            {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword}</span>}
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? w.creating : w.submit}
          </button>
        </form>
        <div className="auth-footer">
          <p><Link to="/writer/login">{w.hasAccount}</Link></p>
          <p><Link to="/register">{w.readerRegister}</Link></p>
        </div>
      </div>
    </div>
  );
}

export default WriterRegister;
